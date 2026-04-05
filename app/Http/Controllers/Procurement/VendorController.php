<?php

namespace App\Http\Controllers\Procurement;

use App\Helpers\FileHelper;
use App\Http\Controllers\Controller;
use App\Models\CoaAccount;
use App\Models\InventoryItem;
use App\Models\PaymentAccount;
use App\Models\PurchaseReturn;
use App\Models\SupplierAdvance;
use App\Models\Tenant;
use App\Models\Vendor;
use App\Models\VendorBankAccount;
use App\Models\VendorBill;
use App\Models\VendorContact;
use App\Models\VendorItemMapping;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

class VendorController extends Controller
{
    private const PROFILE_TABS = ['overview', 'bills', 'payments', 'returns', 'advances', 'ledger', 'contacts', 'bank_accounts', 'item_mappings'];

    public function index(Request $request)
    {
        $perPage = (int) $request->integer('per_page', 25);
        if (!in_array($perPage, [10, 25, 50, 100], true)) {
            $perPage = 25;
        }

        $query = Vendor::query()
            ->select('vendors.*')
            ->with(['tenant:id,name', 'payableAccount:id,full_code,name', 'advanceAccount:id,full_code,name', 'defaultPaymentAccount:id,name'])
            ->selectSub(
                VendorBill::query()
                    ->selectRaw('COALESCE(SUM(GREATEST(grand_total - paid_amount - advance_applied_amount - COALESCE(return_applied_amount, 0), 0)), 0)')
                    ->whereColumn('vendor_bills.vendor_id', 'vendors.id')
                    ->whereNotIn('status', ['void']),
                'ap_outstanding'
            )
            ->selectSub(
                SupplierAdvance::query()
                    ->selectRaw('COALESCE(SUM(GREATEST(amount - applied_amount, 0)), 0)')
                    ->whereColumn('supplier_advances.vendor_id', 'vendors.id')
                    ->whereIn('status', ['posted', 'partially_applied']),
                'advance_credit'
            )
            ->selectSub(
                PurchaseReturn::query()
                    ->selectRaw('COALESCE(SUM(GREATEST(vendor_credit_amount, 0)), 0)')
                    ->whereColumn('purchase_returns.vendor_id', 'vendors.id')
                    ->where('status', 'posted')
                    ->where('credit_status', 'unapplied'),
                'purchase_return_credit'
            );

        if ($request->filled('search')) {
            $search = trim((string) $request->search);
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status') && in_array($request->status, ['active', 'inactive'], true)) {
            $query->where('status', $request->status);
        }

        if ($request->filled('tenant_id')) {
            $query->where('tenant_id', $request->tenant_id);
        }

        $balanceSnapshot = (clone $query)->get(['id', 'ap_outstanding', 'advance_credit', 'purchase_return_credit']);

        $summary = [
            'count' => (int) (clone $query)->count(),
            'active' => (int) (clone $query)->where('status', 'active')->count(),
            'inactive' => (int) (clone $query)->where('status', 'inactive')->count(),
            'opening_balance' => (float) ((clone $query)->sum('opening_balance') ?? 0),
            'approved' => (int) (clone $query)->where('approval_status', 'approved')->count(),
            'ap_outstanding' => (float) ($balanceSnapshot->sum(fn ($vendor) => (float) ($vendor->ap_outstanding ?? 0)) ?? 0),
            'advance_credit' => (float) ($balanceSnapshot->sum(fn ($vendor) => (float) ($vendor->advance_credit ?? 0)) ?? 0),
            'purchase_return_credit' => (float) ($balanceSnapshot->sum(fn ($vendor) => (float) ($vendor->purchase_return_credit ?? 0)) ?? 0),
            'net_payable' => (float) ($balanceSnapshot->sum(fn ($vendor) => max(
                0,
                (float) ($vendor->ap_outstanding ?? 0)
                - (float) ($vendor->advance_credit ?? 0)
                - (float) ($vendor->purchase_return_credit ?? 0)
            )) ?? 0),
        ];

        $vendors = $query->orderBy('name')->paginate($perPage)->withQueryString();

        return Inertia::render('App/Admin/Procurement/Vendors/Index', [
            'vendors' => $vendors,
            'summary' => $summary,
            'tenants' => Tenant::query()->orderBy('name')->get(['id', 'name']),
            'coaAccounts' => Schema::hasTable('coa_accounts')
                ? CoaAccount::query()->where('is_postable', true)->where('is_active', true)->orderBy('full_code')->get(['id', 'full_code', 'name'])
                : collect(),
            'paymentAccounts' => PaymentAccount::query()->orderBy('name')->get(['id', 'name', 'tenant_id']),
            'filters' => $request->only(['search', 'status', 'tenant_id', 'per_page']),
            'error' => !Schema::hasTable('coa_accounts') ? 'Chart of Accounts is not configured yet. Vendor finance defaults are temporarily unavailable.' : null,
        ]);
    }

    public function show(Request $request, Vendor $vendor)
    {
        $perPage = (int) $request->integer('per_page', 10);
        if (!in_array($perPage, [10, 25, 50, 100], true)) {
            $perPage = 10;
        }

        $requestedTab = strtolower((string) $request->string('tab', 'overview'));
        $activeTab = in_array($requestedTab, self::PROFILE_TABS, true) ? $requestedTab : 'overview';

        $vendor->load([
            'tenant:id,name',
            'payableAccount:id,full_code,name',
            'advanceAccount:id,full_code,name',
            'defaultPaymentAccount:id,name',
            'createdBy:id,name',
            'updatedBy:id,name',
            'profilePhoto',
            'profilePhoto.uploadedBy:id,name',
            'contacts:id,vendor_id,name,email,phone,title,is_primary,created_at,updated_at',
            'bankAccounts:id,vendor_id,bank_name,account_name,account_number,iban,swift_code,is_primary,created_at,updated_at',
            'itemMappings.inventoryItem:id,name,sku',
            'itemMappings.tenant:id,name',
        ]);

        $summary = $this->calculateVendorSummary($vendor->id);

        $bills = VendorBill::query()
            ->where('vendor_id', $vendor->id)
            ->with(['tenant:id,name', 'goodsReceipt:id,grn_no'])
            ->orderByDesc('bill_date')
            ->orderByDesc('id')
            ->paginate($perPage, ['*'], 'bills_page')
            ->withQueryString();

        $payments = \App\Models\VendorPayment::query()
            ->where('vendor_id', $vendor->id)
            ->with(['tenant:id,name', 'paymentAccount:id,name'])
            ->orderByDesc('payment_date')
            ->orderByDesc('id')
            ->paginate($perPage, ['*'], 'payments_page')
            ->withQueryString();

        $returns = PurchaseReturn::query()
            ->where('vendor_id', $vendor->id)
            ->with(['tenant:id,name', 'warehouse:id,name', 'goodsReceipt:id,grn_no', 'vendorBill:id,bill_no'])
            ->orderByDesc('return_date')
            ->orderByDesc('id')
            ->paginate($perPage, ['*'], 'returns_page')
            ->withQueryString();

        $advances = SupplierAdvance::query()
            ->where('vendor_id', $vendor->id)
            ->with(['purchaseOrder:id,po_no', 'paymentAccount:id,name'])
            ->orderByDesc('advance_date')
            ->orderByDesc('id')
            ->paginate($perPage, ['*'], 'advances_page')
            ->withQueryString();

        $ledgerCollection = $this->buildLedgerEntries($vendor);
        $ledgerPage = max(1, (int) $request->integer('ledger_page', 1));
        $ledger = new LengthAwarePaginator(
            $ledgerCollection->forPage($ledgerPage, $perPage)->values(),
            $ledgerCollection->count(),
            $perPage,
            $ledgerPage,
            [
                'path' => $request->url(),
                'pageName' => 'ledger_page',
                'query' => $request->query(),
            ]
        );

        return Inertia::render('App/Admin/Procurement/Vendors/Show', [
            'vendor' => $vendor,
            'profileImage' => $vendor->profilePhoto ? [
                'id' => $vendor->profilePhoto->id,
                'url' => $vendor->profilePhoto->file_path,
                'name' => $vendor->profilePhoto->file_name,
                'uploaded_at' => optional($vendor->profilePhoto->created_at)->toDateTimeString(),
                'uploaded_by' => $vendor->profilePhoto->uploadedBy?->name,
            ] : null,
            'summary' => $summary,
            'activeTab' => $activeTab,
            'perPage' => $perPage,
            'lookup' => [
                'tenants' => Tenant::query()->orderBy('name')->get(['id', 'name']),
                'coaAccounts' => Schema::hasTable('coa_accounts')
                    ? CoaAccount::query()->where('is_postable', true)->where('is_active', true)->orderBy('full_code')->get(['id', 'full_code', 'name'])
                    : collect(),
                'paymentAccounts' => PaymentAccount::query()->orderBy('name')->get(['id', 'name', 'payment_method', 'tenant_id']),
                'inventoryItems' => InventoryItem::query()->orderBy('name')->get(['id', 'name', 'sku']),
            ],
            'canEdit' => (bool) $request->user(),
            'bills' => $bills,
            'payments' => $payments,
            'returns' => $returns,
            'advances' => $advances,
            'ledgerEntries' => $ledger,
        ]);
    }

    public function uploadProfileImage(Request $request, Vendor $vendor)
    {
        $data = $request->validate([
            'profile_image' => 'required|image|mimes:jpg,jpeg,png,webp|max:4096',
        ]);

        $file = $data['profile_image'];

        DB::transaction(function () use ($vendor, $file) {
            $old = $vendor->media()->where('type', 'profile_photo')->latest('id')->first();
            if ($old) {
                $old->deleteFile();
                $old->delete();
            }

            $path = FileHelper::saveImage($file, 'vendor_profiles');
            $vendor->media()->create([
                'type' => 'profile_photo',
                'file_name' => $file->getClientOriginalName(),
                'file_path' => $path,
                'mime_type' => $file->getMimeType(),
                'file_size' => $file->getSize(),
                'disk' => 'public',
                'description' => 'Vendor profile photo',
            ]);
        });

        return back()->with('success', 'Vendor profile image updated.');
    }

    public function removeProfileImage(Vendor $vendor)
    {
        $photo = $vendor->media()->where('type', 'profile_photo')->latest('id')->first();

        if (!$photo) {
            return back()->with('success', 'No profile image found.');
        }

        $photo->deleteFile();
        $photo->delete();

        return back()->with('success', 'Vendor profile image removed.');
    }

    public function store(Request $request)
    {
        if (!Schema::hasTable('coa_accounts')) {
            $request->merge([
                'payable_account_id' => null,
                'advance_account_id' => null,
            ]);
        }

        $data = $request->validate([
            'code' => 'required|string|max:32|unique:vendors,code',
            'name' => 'required|string|max:255',
            'tax_id' => 'nullable|string|max:100',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string',
            'tenant_id' => 'nullable|exists:tenants,id',
            'payment_terms_days' => 'nullable|integer|min:0',
            'currency' => 'nullable|string|max:8',
            'opening_balance' => 'nullable|numeric',
            'payable_account_id' => 'nullable|exists:coa_accounts,id',
            'advance_account_id' => 'nullable|exists:coa_accounts,id',
            'default_payment_account_id' => 'nullable|exists:payment_accounts,id',
            'tax_treatment' => 'nullable|string|max:50',
            'approval_status' => 'required|in:approved,pending,blocked',
            'status' => 'required|in:active,inactive',
        ]);

        $data['created_by'] = $request->user()?->id;

        Vendor::create($data);

        return redirect()->back()->with('success', 'Vendor created.');
    }

    public function update(Request $request, Vendor $vendor)
    {
        if (!Schema::hasTable('coa_accounts')) {
            $request->merge([
                'payable_account_id' => null,
                'advance_account_id' => null,
            ]);
        }

        $data = $request->validate([
            'code' => 'required|string|max:32|unique:vendors,code,' . $vendor->id,
            'name' => 'required|string|max:255',
            'tax_id' => 'nullable|string|max:100',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string',
            'tenant_id' => 'nullable|exists:tenants,id',
            'payment_terms_days' => 'nullable|integer|min:0',
            'currency' => 'nullable|string|max:8',
            'opening_balance' => 'nullable|numeric',
            'payable_account_id' => 'nullable|exists:coa_accounts,id',
            'advance_account_id' => 'nullable|exists:coa_accounts,id',
            'default_payment_account_id' => 'nullable|exists:payment_accounts,id',
            'tax_treatment' => 'nullable|string|max:50',
            'approval_status' => 'required|in:approved,pending,blocked',
            'status' => 'required|in:active,inactive',
        ]);

        $data['updated_by'] = $request->user()?->id;

        $vendor->update($data);

        return redirect()->back()->with('success', 'Vendor updated.');
    }

    public function destroy(Vendor $vendor)
    {
        $vendor->delete();

        return redirect()->back()->with('success', 'Vendor removed.');
    }

    public function storeContact(Request $request, Vendor $vendor)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'title' => 'nullable|string|max:120',
            'is_primary' => 'nullable|boolean',
        ]);

        DB::transaction(function () use ($vendor, $data) {
            if (!empty($data['is_primary'])) {
                $vendor->contacts()->update(['is_primary' => false]);
            }
            $vendor->contacts()->create($data);
        });

        return back()->with('success', 'Vendor contact saved.');
    }

    public function updateContact(Request $request, Vendor $vendor, VendorContact $contact)
    {
        abort_unless((int) $contact->vendor_id === (int) $vendor->id, 404);

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'title' => 'nullable|string|max:120',
            'is_primary' => 'nullable|boolean',
        ]);

        DB::transaction(function () use ($vendor, $contact, $data) {
            if (!empty($data['is_primary'])) {
                $vendor->contacts()->whereKeyNot($contact->id)->update(['is_primary' => false]);
            }
            $contact->update($data);
        });

        return back()->with('success', 'Vendor contact updated.');
    }

    public function destroyContact(Vendor $vendor, VendorContact $contact)
    {
        abort_unless((int) $contact->vendor_id === (int) $vendor->id, 404);
        $contact->delete();
        return back()->with('success', 'Vendor contact removed.');
    }

    public function storeBankAccount(Request $request, Vendor $vendor)
    {
        $data = $request->validate([
            'bank_name' => 'required|string|max:255',
            'account_name' => 'nullable|string|max:255',
            'account_number' => 'nullable|string|max:100',
            'iban' => 'nullable|string|max:100',
            'swift_code' => 'nullable|string|max:100',
            'is_primary' => 'nullable|boolean',
        ]);

        DB::transaction(function () use ($vendor, $data) {
            if (!empty($data['is_primary'])) {
                $vendor->bankAccounts()->update(['is_primary' => false]);
            }
            $vendor->bankAccounts()->create($data);
        });

        return back()->with('success', 'Bank account saved.');
    }

    public function updateBankAccount(Request $request, Vendor $vendor, VendorBankAccount $bankAccount)
    {
        abort_unless((int) $bankAccount->vendor_id === (int) $vendor->id, 404);

        $data = $request->validate([
            'bank_name' => 'required|string|max:255',
            'account_name' => 'nullable|string|max:255',
            'account_number' => 'nullable|string|max:100',
            'iban' => 'nullable|string|max:100',
            'swift_code' => 'nullable|string|max:100',
            'is_primary' => 'nullable|boolean',
        ]);

        DB::transaction(function () use ($vendor, $bankAccount, $data) {
            if (!empty($data['is_primary'])) {
                $vendor->bankAccounts()->whereKeyNot($bankAccount->id)->update(['is_primary' => false]);
            }
            $bankAccount->update($data);
        });

        return back()->with('success', 'Bank account updated.');
    }

    public function destroyBankAccount(Vendor $vendor, VendorBankAccount $bankAccount)
    {
        abort_unless((int) $bankAccount->vendor_id === (int) $vendor->id, 404);
        $bankAccount->delete();
        return back()->with('success', 'Bank account removed.');
    }

    public function storeItemMapping(Request $request, Vendor $vendor)
    {
        $data = $request->validate([
            'inventory_item_id' => 'required|exists:inventory_items,id',
            'tenant_id' => 'nullable|exists:tenants,id',
            'is_preferred' => 'nullable|boolean',
            'is_active' => 'nullable|boolean',
            'contract_price' => 'nullable|numeric|min:0',
            'last_purchase_price' => 'nullable|numeric|min:0',
            'lead_time_days' => 'nullable|integer|min:0',
            'minimum_order_qty' => 'nullable|numeric|min:0',
            'currency' => 'nullable|string|max:8',
        ]);

        $exists = VendorItemMapping::query()
            ->where('vendor_id', $vendor->id)
            ->where('inventory_item_id', $data['inventory_item_id'])
            ->exists();
        if ($exists) {
            return back()->withErrors([
                'inventory_item_id' => 'Mapping already exists for this item.',
            ]);
        }

        DB::transaction(function () use ($vendor, $data) {
            if (!empty($data['is_preferred'])) {
                $vendor->itemMappings()->update(['is_preferred' => false]);
            }
            $vendor->itemMappings()->create(array_merge([
                'is_active' => true,
                'is_preferred' => false,
                'currency' => 'PKR',
            ], $data));
        });

        return back()->with('success', 'Item mapping saved.');
    }

    public function updateItemMapping(Request $request, Vendor $vendor, VendorItemMapping $itemMapping)
    {
        abort_unless((int) $itemMapping->vendor_id === (int) $vendor->id, 404);

        $data = $request->validate([
            'inventory_item_id' => 'required|exists:inventory_items,id',
            'tenant_id' => 'nullable|exists:tenants,id',
            'is_preferred' => 'nullable|boolean',
            'is_active' => 'nullable|boolean',
            'contract_price' => 'nullable|numeric|min:0',
            'last_purchase_price' => 'nullable|numeric|min:0',
            'lead_time_days' => 'nullable|integer|min:0',
            'minimum_order_qty' => 'nullable|numeric|min:0',
            'currency' => 'nullable|string|max:8',
        ]);

        $exists = VendorItemMapping::query()
            ->where('vendor_id', $vendor->id)
            ->where('inventory_item_id', $data['inventory_item_id'])
            ->whereKeyNot($itemMapping->id)
            ->exists();
        if ($exists) {
            return back()->withErrors([
                'inventory_item_id' => 'Mapping already exists for this item.',
            ]);
        }

        DB::transaction(function () use ($vendor, $itemMapping, $data) {
            if (!empty($data['is_preferred'])) {
                $vendor->itemMappings()->whereKeyNot($itemMapping->id)->update(['is_preferred' => false]);
            }
            $itemMapping->update($data);
        });

        return back()->with('success', 'Item mapping updated.');
    }

    public function destroyItemMapping(Vendor $vendor, VendorItemMapping $itemMapping)
    {
        abort_unless((int) $itemMapping->vendor_id === (int) $vendor->id, 404);
        $itemMapping->delete();
        return back()->with('success', 'Item mapping removed.');
    }

    private function calculateVendorSummary(int $vendorId): array
    {
        $apOutstanding = (float) (VendorBill::query()
            ->where('vendor_id', $vendorId)
            ->whereNotIn('status', ['void'])
            ->selectRaw('COALESCE(SUM(GREATEST(grand_total - paid_amount - advance_applied_amount - COALESCE(return_applied_amount, 0), 0)), 0) as total')
            ->value('total') ?? 0);

        $advanceCredit = (float) (SupplierAdvance::query()
            ->where('vendor_id', $vendorId)
            ->whereIn('status', ['posted', 'partially_applied'])
            ->selectRaw('COALESCE(SUM(GREATEST(amount - applied_amount, 0)), 0) as total')
            ->value('total') ?? 0);

        $purchaseReturnCredit = (float) (PurchaseReturn::query()
            ->where('vendor_id', $vendorId)
            ->where('status', 'posted')
            ->where('credit_status', 'unapplied')
            ->selectRaw('COALESCE(SUM(GREATEST(vendor_credit_amount, 0)), 0) as total')
            ->value('total') ?? 0);

        return [
            'ap_outstanding' => $apOutstanding,
            'advance_credit' => $advanceCredit,
            'purchase_return_credit' => $purchaseReturnCredit,
            'net_payable' => max(0, $apOutstanding - $advanceCredit - $purchaseReturnCredit),
        ];
    }

    private function buildLedgerEntries(Vendor $vendor): Collection
    {
        $entries = collect();

        if ((float) $vendor->opening_balance !== 0.0) {
            $entries->push([
                'date' => $vendor->created_at?->toDateString(),
                'type' => 'opening_balance',
                'document_no' => 'OPENING',
                'status' => $vendor->status,
                'debit' => max(0, (float) $vendor->opening_balance),
                'credit' => 0.0,
                'delta' => (float) $vendor->opening_balance,
                'link' => null,
            ]);
        }

        VendorBill::query()
            ->where('vendor_id', $vendor->id)
            ->whereNotIn('status', ['void'])
            ->get(['id', 'bill_no', 'bill_date', 'grand_total', 'status'])
            ->each(function ($bill) use ($entries, $vendor) {
                $amount = (float) ($bill->grand_total ?? 0);
                $entries->push([
                    'date' => $bill->bill_date?->toDateString(),
                    'type' => 'bill',
                    'document_no' => $bill->bill_no,
                    'status' => $bill->status,
                    'debit' => $amount,
                    'credit' => 0.0,
                    'delta' => $amount,
                    'link' => route('procurement.vendor-bills.index', ['vendor_id' => $vendor->id]),
                ]);
            });

        \App\Models\VendorPayment::query()
            ->where('vendor_id', $vendor->id)
            ->whereIn('status', ['approved', 'posted'])
            ->get(['id', 'payment_no', 'payment_date', 'amount', 'status'])
            ->each(function ($payment) use ($entries, $vendor) {
                $amount = (float) ($payment->amount ?? 0);
                $entries->push([
                    'date' => $payment->payment_date?->toDateString(),
                    'type' => 'payment',
                    'document_no' => $payment->payment_no,
                    'status' => $payment->status,
                    'debit' => 0.0,
                    'credit' => $amount,
                    'delta' => -$amount,
                    'link' => route('procurement.vendor-payments.index', ['vendor_id' => $vendor->id]),
                ]);
            });

        PurchaseReturn::query()
            ->where('vendor_id', $vendor->id)
            ->where('status', 'posted')
            ->get(['id', 'return_no', 'return_date', 'vendor_credit_amount', 'status'])
            ->each(function ($return) use ($entries, $vendor) {
                $amount = (float) ($return->vendor_credit_amount ?? 0);
                $entries->push([
                    'date' => $return->return_date?->toDateString(),
                    'type' => 'purchase_return',
                    'document_no' => $return->return_no,
                    'status' => $return->status,
                    'debit' => 0.0,
                    'credit' => $amount,
                    'delta' => -$amount,
                    'link' => route('procurement.purchase-returns.index', ['vendor_id' => $vendor->id]),
                ]);
            });

        SupplierAdvance::query()
            ->where('vendor_id', $vendor->id)
            ->whereIn('status', ['posted', 'partially_applied'])
            ->get(['id', 'advance_no', 'advance_date', 'amount', 'applied_amount', 'status'])
            ->each(function ($advance) use ($entries, $vendor) {
                $amount = max(0, (float) ($advance->amount ?? 0) - (float) ($advance->applied_amount ?? 0));
                if ($amount <= 0) {
                    return;
                }
                $entries->push([
                    'date' => $advance->advance_date?->toDateString(),
                    'type' => 'supplier_advance',
                    'document_no' => $advance->advance_no,
                    'status' => $advance->status,
                    'debit' => 0.0,
                    'credit' => $amount,
                    'delta' => -$amount,
                    'link' => route('procurement.supplier-advances.index', ['vendor_id' => $vendor->id]),
                ]);
            });

        $running = 0.0;
        return $entries
            ->sortBy([
                ['date', 'asc'],
                ['type', 'asc'],
                ['document_no', 'asc'],
            ])
            ->values()
            ->map(function (array $entry) use (&$running) {
                $running += (float) $entry['delta'];
                $entry['running_balance'] = $running;

                return $entry;
            });
    }
}
