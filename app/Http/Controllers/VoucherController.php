<?php

namespace App\Http\Controllers;

use App\Models\Voucher;
use App\Models\Member;
use App\Models\Employee;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;

class VoucherController extends Controller
{
    /**
     * Display voucher dashboard with statistics
     */
    public function dashboard(Request $request)
    {
        $query = Voucher::with(['member', 'employee', 'createdBy']);

        // Apply filters
        if ($request->filled('type')) {
            $query->where('voucher_type', $request->type);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('voucher_name', 'like', "%{$search}%")
                  ->orWhere('voucher_code', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $vouchers = $query->latest()->paginate(15);

        // Statistics
        $stats = [
            'total_vouchers' => Voucher::count(),
            'active_vouchers' => Voucher::where('status', 'active')->count(),
            'expired_vouchers' => Voucher::where('status', 'expired')->count(),
            'used_vouchers' => Voucher::where('status', 'used')->count(),
            'member_vouchers' => Voucher::where('voucher_type', 'member')->count(),
            'employee_vouchers' => Voucher::where('voucher_type', 'employee')->count(),
            'total_value' => Voucher::sum('amount'),
            'active_value' => Voucher::where('status', 'active')->sum('amount'),
        ];

        return Inertia::render('App/Admin/Vouchers/Dashboard', [
            'vouchers' => $vouchers,
            'stats' => $stats,
            'filters' => $request->only(['type', 'status', 'search'])
        ]);
    }

    /**
     * Show the form for creating a new voucher
     */
    public function create()
    {
        return Inertia::render('App/Admin/Vouchers/Create');
    }

    /**
     * Store a newly created voucher
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'voucher_name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'amount' => 'required|numeric|min:0.01',
            'voucher_type' => 'required|in:member,employee',
            'member_id' => 'required_if:voucher_type,member|nullable|exists:members,id',
            'employee_id' => 'required_if:voucher_type,employee|nullable|exists:employees,id',
            'valid_from' => 'required|date|after_or_equal:today',
            'valid_to' => 'required|date|after:valid_from',
            'status' => 'required|in:active,inactive'
        ]);

        $validated['created_by'] = Auth::id();

        Voucher::create($validated);

        return redirect()->route('vouchers.dashboard')
            ->with('success', 'Voucher created successfully!');
    }

    /**
     * Display the specified voucher
     */
    public function show(Voucher $voucher)
    {
        $voucher->load(['member', 'employee', 'createdBy', 'updatedBy']);

        return Inertia::render('App/Admin/Vouchers/Show', [
            'voucher' => $voucher
        ]);
    }

    /**
     * Show the form for editing the specified voucher
     */
    public function edit(Voucher $voucher)
    {
        $voucher->load(['member', 'employee']);

        return Inertia::render('App/Admin/Vouchers/Edit', [
            'voucher' => $voucher
        ]);
    }

    /**
     * Update the specified voucher
     */
    public function update(Request $request, Voucher $voucher)
    {
        $validated = $request->validate([
            'voucher_name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'amount' => 'required|numeric|min:0.01',
            'valid_from' => 'required|date',
            'valid_to' => 'required|date|after:valid_from',
            'status' => 'required|in:active,inactive,expired,used'
        ]);

        // Don't allow changing voucher_type, member_id, or employee_id after creation
        $validated['updated_by'] = Auth::id();

        $voucher->update($validated);

        return redirect()->route('vouchers.dashboard')
            ->with('success', 'Voucher updated successfully!');
    }

    /**
     * Remove the specified voucher
     */
    public function destroy(Voucher $voucher)
    {
        $voucher->update(['deleted_by' => Auth::id()]);
        $voucher->delete();

        return redirect()->route('vouchers.dashboard')
            ->with('success', 'Voucher deleted successfully!');
    }

    /**
     * Mark voucher as used
     */
    public function markAsUsed(Voucher $voucher)
    {
        if ($voucher->is_used) {
            return back()->with('error', 'Voucher is already used!');
        }

        if (!$voucher->is_valid) {
            return back()->with('error', 'Voucher is not valid or has expired!');
        }

        $voucher->markAsUsed();

        return back()->with('success', 'Voucher marked as used successfully!');
    }

    /**
     * Update voucher status (for bulk operations)
     */
    public function updateStatus(Request $request)
    {
        $validated = $request->validate([
            'voucher_ids' => 'required|array',
            'voucher_ids.*' => 'exists:vouchers,id',
            'status' => 'required|in:active,inactive,expired,used'
        ]);

        Voucher::whereIn('id', $validated['voucher_ids'])
            ->update([
                'status' => $validated['status'],
                'updated_by' => Auth::id()
            ]);

        return back()->with('success', 'Voucher statuses updated successfully!');
    }

    /**
     * Get vouchers for API (for mobile app or other integrations)
     */
    public function getVouchers(Request $request)
    {
        $query = Voucher::with(['member', 'employee']);

        if ($request->filled('type')) {
            $query->where('voucher_type', $request->type);
        }

        if ($request->filled('recipient_id') && $request->filled('type')) {
            if ($request->type === 'member') {
                $query->where('member_id', $request->recipient_id);
            } else {
                $query->where('employee_id', $request->recipient_id);
            }
        }

        $vouchers = $query->valid()->get();

        return response()->json([
            'success' => true,
            'vouchers' => $vouchers
        ]);
    }
}
