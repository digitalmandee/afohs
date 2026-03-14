<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Employee;
use App\Models\Media;
use App\Models\Member;
use App\Models\PosCakeBooking;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

class PosCakeBookingController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = PosCakeBooking::query()
            ->with(['member', 'corporateMember', 'customer', 'employee', 'cakeType', 'createdBy', 'media']);

        // Search Filters
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q
                    ->where('customer_name', 'like', "%{$search}%")
                    ->orWhereHas('member', fn($q) => $q->where('full_name', 'like', "%{$search}%"))
                    ->orWhereHas('corporateMember', fn($q) => $q->where('full_name', 'like', "%{$search}%"))
                    ->orWhereHas('employee', fn($q) => $q->where('name', 'like', "%{$search}%"));
            });
        }

        if ($request->filled('booking_number')) {
            $query->where('booking_number', 'like', "%{$request->booking_number}%");
        }

        if ($request->filled('membership_no')) {
            $searchMembership = $request->membership_no;
            $query->where(function ($q) use ($searchMembership) {
                $q
                    ->whereHas('member', fn($q) => $q->where('membership_no', 'like', "%{$searchMembership}%"))
                    ->orWhereHas('corporateMember', fn($q) => $q->where('membership_no', 'like', "%{$searchMembership}%"))
                    ->orWhereHas('customer', fn($q) => $q->where('customer_no', 'like', "%{$searchMembership}%"))
                    ->orWhereHas('employee', fn($q) => $q->where('employee_id', 'like', "%{$searchMembership}%"));
            });
        }

        // Customer Type Filter
        if ($request->filled('customer_type')) {
            if ($request->customer_type == 'Member')
                $query->where('customer_type', '0');
            elseif ($request->customer_type == 'Corporate')
                $query->where('customer_type', '2');  // Corporate
            elseif ($request->customer_type == 'Employee')
                $query->where('customer_type', '3');
            elseif ($request->customer_type == 'Guest')
                $query->where('customer_type', 'Guest')->orWhere('customer_type', 'like', 'guest-%');
        }

        // Status Filter
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('start_date')) {
            $query->whereDate('booking_date', '>=', $request->start_date);
        }
        if ($request->filled('end_date')) {
            $query->whereDate('booking_date', '<=', $request->end_date);
        }
        if ($request->filled('delivery_date')) {
            $query->whereDate('delivery_date', $request->delivery_date);
        }

        if ($request->filled('discounted_taxed')) {
            if ($request->discounted_taxed == 'discounted') {
                $query->where('discount_amount', '>', 0);
            } elseif ($request->discounted_taxed == 'taxed') {
                $query->where('tax_amount', '>', 0);
            }
        }

        if ($request->filled('cashier_id')) {
            $query->where('created_by', $request->cashier_id);
        }

        // Apply Tenant Scope if needed (assuming trait or manual scope)
        if (session()->has('active_restaurant_id')) {
            $query->where('tenant_id', session('active_restaurant_id'));
        }

        $bookings = $query->latest()->paginate(50)->withQueryString();
        $cashiers = User::select('id', 'name')->get();

        return Inertia::render('App/CakeBooking/Index', [
            'bookings' => $bookings,
            'cashiers' => $cashiers,
            'filters' => $request->all(),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        // Fetch Cake Types (Category 'Cakes' or similar)
        // Assuming we need to find products in 'Cakes' category.
        // For now, I'll fetch all products or filter by category if I knew the ID.
        // I'll fetch generic products for now, user might need to configure category.
        $cakeTypes = \App\Models\CakeType::where('status', 'active')->get();
        // Better: Fetch Category 'Cakes' first.

        $guestTypes = \App\Models\GuestType::where('status', 1)->select('id', 'name')->get();

        return Inertia::render('App/CakeBooking/Create', [
            'cakeTypes' => $cakeTypes,
            'guestTypes' => $guestTypes,
            'nextBookingNumber' => $this->getNextBookingNumber()
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'customer_type' => 'required|string',
            'booking_date' => 'required|date',
            'delivery_date' => 'nullable|date',
            'pickup_time' => 'nullable|string',
            'cake_type_id' => 'required|exists:products,id',
            'weight' => 'nullable|numeric',
            'total_price' => 'required|numeric',
            'advance_amount' => 'required|numeric|min:1',
            'payment_mode' => 'required|string',  // Compulsory if advance is there
        ]);

        DB::transaction(function () use ($request) {
            $booking = new PosCakeBooking();
            $booking->fill($request->all());

            // Auto-generate booking number if not provided
            if (!$request->booking_number) {
                $booking->booking_number = $this->getNextBookingNumber();
            }

            $booking->tenant_id = session('active_restaurant_id');
            $booking->created_by = Auth::id();

            // Map ID based on Type
            $booking->member_id = null;
            $booking->corporate_id = null;
            $booking->employee_id = null;
            $booking->customer_id = null;

            if ($request->customer_type == '2' || $request->customer_type == 'Corporate') {
                $booking->corporate_id = $request->member_id;
            } else if ($request->customer_type == '0' || $request->customer_type == 'Member') {
                $booking->member_id = $request->member_id;
            } else if ($request->customer_type == '3' || $request->customer_type == 'Employee') {
                $booking->employee_id = $request->member_id;
            } else {
                // Guests or others
                if ($request->member_id) {
                    $booking->customer_id = $request->member_id;
                }
            }

            // Calculate Balance
            $total = $request->total_price ?? 0;
            $tax = $request->tax_amount ?? 0;
            $discount = $request->discount_amount ?? 0;
            $advance = $request->advance_amount ?? 0;

            $booking->balance_amount = ($total + $tax - $discount) - $advance;

            // Handle Attachment (Legacy single file - optionally keep or migrate)
            if ($request->hasFile('attachment')) {
                $path = $request->file('attachment')->store('cake_attachments', 'public');
                $booking->attachment_path = $path;
                $booking->has_attachment = true;
            }

            // Handle Multiple Documents (Media)
            if ($request->hasFile('documents')) {
                foreach ($request->file('documents') as $file) {
                    $originalName = $file->getClientOriginalName();
                    $extension = $file->getClientOriginalExtension();
                    $fileSize = $file->getSize();
                    $mimeType = $file->getMimeType();

                    $fileName = Str::uuid() . '.' . $extension;
                    $path = $file->storeAs('cake-bookings/' . $booking->id, $fileName, 'public');

                    Media::create([
                        'mediable_type' => PosCakeBooking::class,
                        'mediable_id' => $booking->id,
                        'type' => 'document',
                        'file_name' => $originalName,
                        'file_path' => 'storage/' . $path,  // Ensure public access path
                        'mime_type' => $mimeType,
                        'file_size' => $fileSize,
                        'disk' => 'public',
                        'created_by' => Auth::id(),
                    ]);
                }
            }

            $booking->save();
        });

        return redirect()->route('cake-bookings.index')->with('success', 'Booking created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(PosCakeBooking $posCakeBooking)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit($id)
    {
        $booking = PosCakeBooking::with(['member', 'corporateMember', 'employee', 'media'])->findOrFail($id);
        // Same data as Create
        $cakeTypes = \App\Models\CakeType::where('status', 'active')->get();
        $guestTypes = \App\Models\GuestType::all();

        return Inertia::render('App/CakeBooking/Create', [
            'booking' => $booking,
            'cakeTypes' => $cakeTypes,
            'guestTypes' => $guestTypes,
            'isEdit' => true
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        $booking = PosCakeBooking::findOrFail($id);

        $booking->fill($request->except(['booking_number']));  // Don't change booking number

        // Map ID based on Type
        $booking->member_id = null;
        $booking->corporate_id = null;
        $booking->employee_id = null;
        $booking->customer_id = null;

        if ($request->customer_type == '2' || $request->customer_type == 'Corporate') {
            $booking->corporate_id = $request->member_id;
        } else if ($request->customer_type == '0' || $request->customer_type == 'Member') {
            $booking->member_id = $request->member_id;
        } else if ($request->customer_type == '3' || $request->customer_type == 'Employee') {
            $booking->employee_id = $request->member_id;
        } else {
            // Guests or others
            if ($request->member_id) {
                $booking->customer_id = $request->member_id;
            }
        }

        // Recalculate Balance
        $total = $request->total_price ?? $booking->total_price;
        $tax = $request->tax_amount ?? $booking->tax_amount;
        $discount = $request->discount_amount ?? $booking->discount_amount;
        $discount = $request->discount_amount ?? $booking->discount_amount;
        // Check if advance_amount is present in request, else use existing. Validate it if touched?
        // Actually, update request might not include all fields if partial update.
        // But for full edit form it sends everything.
        // Let's assume validation handles required fields if they are in the request.
        if ($request->has('advance_amount')) {
            $request->validate([
                'advance_amount' => 'required|numeric|min:1',
                'payment_mode' => 'required|string',
            ]);
        }
        $advance = $request->advance_amount ?? $booking->advance_amount;

        $booking->balance_amount = ($total + $tax - $discount) - $advance;

        if ($request->hasFile('attachment')) {
            $path = $request->file('attachment')->store('cake_attachments', 'public');
            $booking->attachment_path = $path;
            $booking->has_attachment = true;
        }

        // Handle Media Deletion
        if ($request->filled('deleted_media_ids')) {
            $idsToDelete = $request->input('deleted_media_ids');
            if (is_array($idsToDelete)) {
                $mediaToDelete = Media::whereIn('id', $idsToDelete)
                    ->where('mediable_id', $booking->id)
                    ->where('mediable_type', PosCakeBooking::class)
                    ->get();

                foreach ($mediaToDelete as $media) {
                    // Delete file from storage
                    if ($media->file_path && Storage::disk('public')->exists(str_replace('storage/', '', $media->file_path))) {
                        Storage::disk('public')->delete(str_replace('storage/', '', $media->file_path));
                    }
                    $media->delete();
                }
            }
        }

        // Handle Multiple Documents (Media)
        if ($request->hasFile('documents')) {
            foreach ($request->file('documents') as $file) {
                $originalName = $file->getClientOriginalName();
                $extension = $file->getClientOriginalExtension();
                $fileSize = $file->getSize();
                $mimeType = $file->getMimeType();

                $fileName = Str::uuid() . '.' . $extension;
                $path = $file->storeAs('cake-bookings/' . $booking->id, $fileName, 'public');

                Media::create([
                    'mediable_type' => PosCakeBooking::class,
                    'mediable_id' => $booking->id,
                    'type' => 'document',
                    'file_name' => $originalName,
                    'file_path' => 'storage/' . $path,
                    'mime_type' => $mimeType,
                    'file_size' => $fileSize,
                    'disk' => 'public',
                    'created_by' => Auth::id(),
                ]);
            }
        }

        $booking->save();

        return redirect()->route('cake-bookings.index')->with('success', 'Booking updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $booking = PosCakeBooking::findOrFail($id);
        $booking->delete();
        return redirect()->back()->with('success', 'Booking deleted.');
    }

    // API for POS Search
    public function search(Request $request)
    {
        $query = $request->query('query');

        if (!$query)
            return response()->json([]);

        if (!$query)
            return response()->json([]);

        $bookings = PosCakeBooking::with(['member', 'cakeType', 'customer'])
            ->where(function ($q) use ($query) {
                $q
                    ->where('booking_number', 'like', "%{$query}%")
                    ->orWhere('customer_phone', 'like', "%{$query}%")
                    ->orWhere('customer_name', 'like', "%{$query}%");
            })
            ->where('status', '!=', 'completed')  // Only pending/active bookings
            ->where('status', '!=', 'cancelled')
            ->limit(20)
            ->get();

        return response()->json($bookings);
    }

    private function getNextBookingNumber()
    {
        $max = PosCakeBooking::max('booking_number');
        return $max ? $max + 1 : 1;
    }

    public function printInvoice($id)
    {
        $booking = PosCakeBooking::with(['member', 'cakeType', 'createdBy'])->findOrFail($id);
        return Inertia::render('App/CakeBooking/Invoice', [
            'booking' => $booking
        ]);
    }

    public function getFamilyMembers(Request $request, $id)
    {
        $type = $request->query('type', '0');  // Default to Member if not provided

        if ($type == '2' || $type == 'Corporate') {
            $member = \App\Models\CorporateMember::with('familyMembers')->find($id);
        } else {
            $member = Member::with('familyMembers')->find($id);
        }

        if (!$member) {
            return response()->json([]);
        }
        return response()->json($member->familyMembers);
    }
}
