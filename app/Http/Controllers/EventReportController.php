<?php

namespace App\Http\Controllers;

use App\Models\EventBooking;
use App\Models\EventBookingMenu;
use App\Models\EventBookingMenuAddOn;
use App\Models\EventBookingOtherCharge;
use App\Models\EventMenu;
use App\Models\EventVenue;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class EventReportController extends Controller
{
    /**
     * Reports Dashboard - Index page with all report links
     */
    public function index()
    {
        $reports = [
            [
                'id' => 1,
                'title' => 'Day-wise Report',
                'description' => 'Daily event schedule and summary',
                'icon' => 'Today',
                'color' => '#063455',
                'route' => 'events.reports.day-wise',
                'stats' => 'Daily Stats'
            ],
            [
                'id' => 2,
                'title' => 'Event-wise Payment History',
                'description' => 'Payment history and outstanding balances',
                'icon' => 'History',
                'color' => '#063455',
                'route' => 'events.reports.payment-history',
                'stats' => 'Payments'
            ],
            [
                'id' => 3,
                'title' => 'Booking Report',
                'description' => 'Comprehensive list of all event bookings',
                'icon' => 'BookOnline',
                'color' => '#063455',
                'route' => 'events.reports.booking',
                'stats' => 'All Bookings'
            ],
            [
                'id' => 4,
                'title' => 'Cancelled Events Report',
                'description' => 'List of cancelled and refunded events',
                'icon' => 'Cancel',
                'color' => '#d32f2f',
                'route' => 'events.reports.cancelled',
                'stats' => 'Cancellations'
            ],
            [
                'id' => 5,
                'title' => 'Completed Events Report',
                'description' => 'List of successfully completed events',
                'icon' => 'CheckCircle',
                'color' => '#2e7d32',
                'route' => 'events.reports.completed',
                'stats' => 'Completed'
            ],
            [
                'id' => 6,
                'title' => 'Venue-wise Report',
                'description' => 'Events grouped by venue',
                'icon' => 'Apartment',
                'color' => '#063455',
                'route' => 'events.reports.venue-wise',
                'stats' => 'Venues'
            ],
            [
                'id' => 7,
                'title' => 'Menu-wise Report',
                'description' => 'Menu popularity and consumption',
                'icon' => 'Restaurant',
                'color' => '#063455',
                'route' => 'events.reports.menu-wise',
                'stats' => 'Menus'
            ],
            [
                'id' => 8,
                'title' => 'Add-ons Report',
                'description' => 'Usage of extra menu add-ons',
                'icon' => 'Extension',
                'color' => '#063455',
                'route' => 'events.reports.addons',
                'stats' => 'Additions'
            ],
            [
                'id' => 9,
                'title' => 'Complementary Report',
                'description' => 'Log of complementary items provided',
                'icon' => 'CardGiftcard',
                'color' => '#063455',
                'route' => 'events.reports.complementary',
                'stats' => 'Free Items'
            ],
        ];

        return Inertia::render('App/Admin/Events/Reports/Index', [
            'reports' => $reports
        ]);
    }

    // --- Report Methods ---

    /**
     * Day-wise Report
     */
    public function dayWise(Request $request)
    {
        $filters = $request->all();

        if (empty($filters['event_date_from']) && empty($filters['event_date_to']) && empty($filters['date_from'])) {
            $filters['event_date_from'] = Carbon::now()->startOfMonth()->format('Y-m-d');
            $filters['event_date_to'] = Carbon::now()->format('Y-m-d');
        }

        $query = EventBooking::with(['eventVenue', 'customer', 'member', 'corporateMember'])
            ->orderBy('event_date', 'asc')
            ->orderBy('event_time_from', 'asc');

        $query = $this->applyFilters($query, $filters);

        $bookings = $query->paginate(30)->appends($request->query());

        return Inertia::render('App/Admin/Events/Reports/DayWise', [
            'bookings' => $bookings,
            'filters' => $filters,
            'venues' => EventVenue::select('id', 'name')->get(),
        ]);
    }

    public function dayWiseExport(Request $request)
    {
        $filters = $request->all();
        $query = EventBooking::with(['eventVenue', 'customer', 'member', 'corporateMember'])
            ->orderBy('event_date', 'asc')
            ->orderBy('event_time_from', 'asc');
        $query = $this->applyFilters($query, $filters);

        return $this->streamCsv($query, function ($row) {
            return [
                $row->booking_no,
                $this->getGuestName($row),
                $row->eventVenue->name ?? 'N/A',
                $row->nature_of_event,
                $row->event_date,
                $row->event_time_from . ' - ' . $row->event_time_to,
                $row->status,
                $row->total_price,
                $row->paid_amount ?? 0,
                $row->total_price - ($row->paid_amount ?? 0)
            ];
        }, ['Booking No', 'Booked By', 'Venue', 'Nature', 'Date', 'Time', 'Status', 'Total', 'Paid', 'Due'], 'event-day-wise-report.csv');
    }

    public function dayWisePrint(Request $request)
    {
        $filters = $request->all();
        $query = EventBooking::with(['eventVenue', 'customer', 'member', 'corporateMember'])
            ->orderBy('event_date', 'asc')
            ->orderBy('event_time_from', 'asc');
        $query = $this->applyFilters($query, $filters);
        $bookings = $query->get();

        return Inertia::render('App/Admin/Events/Reports/DayWisePrint', [
            'bookings' => $bookings,
            'filters' => $filters,
            'generatedAt' => now()->format('d M Y, h:i A')
        ]);
    }

    /**
     * Payment History Report
     */
    public function paymentHistory(Request $request)
    {
        $filters = $request->all();
        if (empty($filters['event_date_from']) && empty($filters['event_date_to'])) {
            $filters['event_date_from'] = Carbon::now()->startOfMonth()->format('Y-m-d');
            $filters['event_date_to'] = Carbon::now()->format('Y-m-d');
        }

        $query = EventBooking::has('invoice')
            ->with(['eventVenue', 'member', 'customer', 'corporateMember', 'invoice.transactions'])
            ->whereHas('invoice', function ($q) {
                // Focus on revenue: either fully paid or already received amount
                $q->where('status', 'paid')->orWhere('paid_amount', '>', 0);
            })
            ->orderBy('event_date', 'desc');

        $query = $this->applyFilters($query, $filters);
        $bookings = $query->paginate(30)->appends($request->query());

        return Inertia::render('App/Admin/Events/Reports/PaymentHistory', [
            'bookings' => $bookings,
            'filters' => $filters,
            'venues' => EventVenue::select('id', 'name')->get(),
        ]);
    }

    public function paymentHistoryExport(Request $request)
    {
        $filters = $request->all();
        $query = EventBooking::has('invoice')
            ->with(['eventVenue', 'member', 'customer', 'corporateMember', 'invoice'])
            ->whereHas('invoice', function ($q) {
                $q->where('status', 'paid')->orWhere('paid_amount', '>', 0);
            })
            ->orderBy('event_date', 'desc');
        $query = $this->applyFilters($query, $filters);

        return $this->streamCsv($query, function ($row) {
            return [
                $row->booking_no,
                $this->getGuestName($row),
                $row->eventVenue->name ?? 'N/A',
                $row->event_date,
                $row->invoice->invoice_no ?? 'N/A',
                $row->total_price,
                $row->invoice->paid_amount ?? 0,
                $row->total_price - ($row->invoice->paid_amount ?? 0)
            ];
        }, ['Booking No', 'Booked By', 'Venue', 'Event Date', 'Invoice No', 'Total', 'Paid', 'Due'], 'event-payment-history.csv');
    }

    public function paymentHistoryPrint(Request $request)
    {
        $filters = $request->all();
        $query = EventBooking::has('invoice')
            ->with(['eventVenue', 'member', 'customer', 'corporateMember', 'invoice.transactions'])
            ->whereHas('invoice', function ($q) {
                $q->where('status', 'paid')->orWhere('paid_amount', '>', 0);
            })
            ->orderBy('event_date', 'desc');
        $query = $this->applyFilters($query, $filters);
        $bookings = $query->get();

        return Inertia::render('App/Admin/Events/Reports/PaymentHistoryPrint', [
            'bookings' => $bookings,
            'filters' => $filters,
            'generatedAt' => now()->format('d M Y, h:i A')
        ]);
    }

    /**
     * Booking Report
     */
    public function booking(Request $request)
    {
        $filters = $request->all();

        if (empty($filters['event_date_from']) && empty($filters['event_date_to']) && empty($filters['booking_date_from'])) {
            $filters['event_date_from'] = Carbon::now()->startOfMonth()->format('Y-m-d');
            $filters['event_date_to'] = Carbon::now()->format('Y-m-d');
        }

        $query = EventBooking::with(['eventVenue', 'customer', 'member', 'corporateMember', 'invoice'])
            ->orderBy('created_at', 'desc');

        $query = $this->applyFilters($query, $filters);
        $bookings = $query->paginate(30)->appends($request->query());

        return Inertia::render('App/Admin/Events/Reports/Booking', [
            'bookings' => $bookings,
            'filters' => $filters,
            'venues' => EventVenue::select('id', 'name')->get(),
        ]);
    }

    public function bookingExport(Request $request)
    {
        $filters = $request->all();
        $query = EventBooking::with(['eventVenue', 'customer', 'member', 'corporateMember', 'invoice'])->orderBy('created_at', 'desc');
        $query = $this->applyFilters($query, $filters);

        return $this->streamCsv($query, function ($row) {
            return [
                $row->booking_no,
                $row->created_at->format('Y-m-d H:i'),
                $this->getGuestName($row),
                $row->eventVenue->name ?? 'N/A',
                $row->event_date,
                $row->status,
                $row->total_price,
                $row->paid_amount ?? 0
            ];
        }, ['Booking No', 'Booking Date', 'Booked By', 'Venue', 'Event Date', 'Status', 'Total', 'Paid'], 'event-booking-report.csv');
    }

    public function bookingPrint(Request $request)
    {
        $filters = $request->all();
        $query = EventBooking::with(['eventVenue', 'customer', 'member', 'corporateMember', 'invoice'])->orderBy('created_at', 'desc');
        $query = $this->applyFilters($query, $filters);
        $bookings = $query->get();

        return Inertia::render('App/Admin/Events/Reports/BookingPrint', [
            'bookings' => $bookings,
            'filters' => $filters,
            'generatedAt' => now()->format('d M Y, h:i A')
        ]);
    }

    /**
     * Cancelled Events Report
     */
    public function cancelled(Request $request)
    {
        $filters = $request->all();
        if (empty($filters['booking_date_from']) && empty($filters['booking_date_to'])) {
            $filters['booking_date_from'] = Carbon::now()->startOfMonth()->format('Y-m-d');
            $filters['booking_date_to'] = Carbon::now()->format('Y-m-d');
        }

        $query = EventBooking::with(['eventVenue', 'customer', 'member', 'corporateMember', 'invoice'])
            ->whereIn('status', ['cancelled', 'refunded'])
            ->orderBy('updated_at', 'desc');

        // Apply specific cancellation date filters if needed, otherwise applyFilters handles general booking dates
        // RoomReportController used 'updated_at' for date filter in cancelled report.
        if (!empty($filters['booking_date_from'])) {
            $query->whereDate('updated_at', '>=', $filters['booking_date_from']);
        }
        if (!empty($filters['booking_date_to'])) {
            $query->whereDate('updated_at', '<=', $filters['booking_date_to']);
        }

        $filtersForApply = $filters;
        unset($filtersForApply['booking_date_from'], $filtersForApply['booking_date_to']);

        $query = $this->applyFilters($query, $filtersForApply);
        $bookings = $query->paginate(30)->appends($request->query());

        return Inertia::render('App/Admin/Events/Reports/Cancelled', [
            'bookings' => $bookings,
            'filters' => $filters,
            'venues' => EventVenue::select('id', 'name')->get(),
        ]);
    }

    public function cancelledExport(Request $request)
    {
        $filters = $request->all();
        $query = EventBooking::with(['eventVenue', 'customer', 'member', 'corporateMember'])
            ->whereIn('status', ['cancelled', 'refunded'])
            ->orderBy('updated_at', 'desc');

        if (!empty($filters['booking_date_from'])) {
            $query->whereDate('updated_at', '>=', $filters['booking_date_from']);
        }
        if (!empty($filters['booking_date_to'])) {
            $query->whereDate('updated_at', '<=', $filters['booking_date_to']);
        }
        $filtersForApply = $filters;
        unset($filtersForApply['booking_date_from'], $filtersForApply['booking_date_to']);

        $query = $this->applyFilters($query, $filtersForApply);

        return $this->streamCsv($query, function ($row) {
            return [
                $row->booking_no,
                $this->getGuestName($row),
                $row->eventVenue->name ?? 'N/A',
                $row->updated_at->format('Y-m-d'),
                $row->status,
                $row->total_price,
                $row->security_deposit ?? 0,
                $row->advance_amount ?? 0
            ];
        }, ['Booking No', 'Booked By', 'Venue', 'Cancelled Date', 'Status', 'Total', 'Security', 'Advance'], 'cancelled-events.csv');
    }

    public function cancelledPrint(Request $request)
    {
        $filters = $request->all();
        $query = EventBooking::with(['eventVenue', 'customer', 'member', 'corporateMember'])
            ->whereIn('status', ['cancelled', 'refunded'])
            ->orderBy('updated_at', 'desc');

        if (!empty($filters['booking_date_from'])) {
            $query->whereDate('updated_at', '>=', $filters['booking_date_from']);
        }
        if (!empty($filters['booking_date_to'])) {
            $query->whereDate('updated_at', '<=', $filters['booking_date_to']);
        }
        $filtersForApply = $filters;
        unset($filtersForApply['booking_date_from'], $filtersForApply['booking_date_to']);

        $query = $this->applyFilters($query, $filtersForApply);
        $bookings = $query->get();

        return Inertia::render('App/Admin/Events/Reports/CancelledPrint', [
            'bookings' => $bookings,
            'filters' => $filters,
            'generatedAt' => now()->format('d M Y, h:i A')
        ]);
    }

    /**
     * Completed Events Report
     */
    public function completed(Request $request)
    {
        $filters = $request->all();
        if (empty($filters['event_date_from']) && empty($filters['event_date_to'])) {
            $filters['event_date_from'] = Carbon::now()->startOfMonth()->format('Y-m-d');
            $filters['event_date_to'] = Carbon::now()->format('Y-m-d');
        }

        $query = EventBooking::with(['eventVenue', 'customer', 'member', 'corporateMember'])
            ->where('status', 'completed')
            ->orderBy('event_date', 'desc');

        $query = $this->applyFilters($query, $filters);
        $bookings = $query->paginate(30)->appends($request->query());

        return Inertia::render('App/Admin/Events/Reports/Completed', [
            'bookings' => $bookings,
            'filters' => $filters,
            'venues' => EventVenue::select('id', 'name')->get(),
        ]);
    }

    public function completedExport(Request $request)
    {
        $filters = $request->all();
        $query = EventBooking::with(['eventVenue', 'customer', 'member', 'corporateMember'])
            ->where('status', 'completed')
            ->orderBy('event_date', 'desc');
        $query = $this->applyFilters($query, $filters);

        return $this->streamCsv($query, function ($row) {
            return [
                $row->booking_no,
                $this->getGuestName($row),
                $row->eventVenue->name ?? 'N/A',
                $row->event_date,
                $row->status,
                $row->total_price,
                $row->paid_amount ?? 0
            ];
        }, ['Booking No', 'Booked By', 'Venue', 'Event Date', 'Status', 'Total', 'Paid'], 'completed-events.csv');
    }

    public function completedPrint(Request $request)
    {
        $filters = $request->all();
        $query = EventBooking::with(['eventVenue', 'customer', 'member', 'corporateMember'])
            ->where('status', 'completed')
            ->orderBy('event_date', 'desc');
        $query = $this->applyFilters($query, $filters);
        $bookings = $query->get();

        return Inertia::render('App/Admin/Events/Reports/CompletedPrint', [
            'bookings' => $bookings,
            'filters' => $filters,
            'generatedAt' => now()->format('d M Y, h:i A')
        ]);
    }

    /**
     * Venue-wise Report
     */
    public function venueWise(Request $request)
    {
        $filters = $request->all();
        if (empty($filters['event_date_from']) && empty($filters['event_date_to'])) {
            $filters['event_date_from'] = Carbon::now()->startOfMonth()->format('Y-m-d');
            $filters['event_date_to'] = Carbon::now()->format('Y-m-d');
        }

        $query = EventBooking::with(['eventVenue', 'customer', 'member', 'corporateMember'])
            ->orderBy('event_Venue_id')
            ->orderBy('event_date', 'desc');

        $query = $this->applyFilters($query, $filters);
        $bookings = $query->paginate(30)->appends($request->query());

        return Inertia::render('App/Admin/Events/Reports/VenueWise', [
            'bookings' => $bookings,
            'filters' => $filters,
            'venues' => EventVenue::select('id', 'name')->get(),
        ]);
    }

    public function venueWiseExport(Request $request)
    {
        $filters = $request->all();
        $query = EventBooking::with(['eventVenue', 'customer', 'member', 'corporateMember'])
            ->orderBy('event_Venue_id')
            ->orderBy('event_date', 'desc');
        $query = $this->applyFilters($query, $filters);

        return $this->streamCsv($query, function ($row) {
            return [
                $row->booking_no,
                $row->eventVenue->name ?? 'N/A',
                $this->getGuestName($row),
                $row->event_date,
                $row->nature_of_event,
                $row->grand_total,
                $row->status
            ];
        }, ['Booking No', 'Venue', 'Booked By', 'Date', 'Nature', 'Total', 'Status'], 'venue-wise-report.csv');
    }

    public function venueWisePrint(Request $request)
    {
        $filters = $request->all();
        $query = EventBooking::with(['eventVenue', 'customer', 'member', 'corporateMember'])
            ->orderBy('event_Venue_id')
            ->orderBy('event_date', 'desc');
        $query = $this->applyFilters($query, $filters);
        $bookings = $query->get();

        return Inertia::render('App/Admin/Events/Reports/VenueWisePrint', [
            'bookings' => $bookings,
            'filters' => $filters,
            'generatedAt' => now()->format('d M Y, h:i A')
        ]);
    }

    /**
     * Menu-wise Report
     */
    public function menuWise(Request $request)
    {
        $filters = $request->all();
        $dateFrom = $request->event_date_from ?? $request->date_from ?? Carbon::now()->startOfMonth()->format('Y-m-d');
        $dateTo = $request->event_date_to ?? $request->date_to ?? Carbon::now()->format('Y-m-d');

        // Note: EventBooking has 'menu_id' or 'selectedMenu' logical link, but we also have EventBookingMenu table.
        // We will query EventBookingMenu and link back to Booking.
        $query = EventBookingMenu::with(['eventBooking.member', 'eventBooking.customer', 'eventBooking.corporateMember', 'eventBooking.eventVenue'])
            ->whereHas('eventBooking', function ($q) use ($dateFrom, $dateTo) {
                $q->whereBetween('event_date', [$dateFrom, $dateTo]);
            });

        // Apply booking filters
        if (!empty($filters['venue_id']) || !empty($filters['status']) || !empty($filters['search'])) {
            $filtersForBooking = $filters;
            unset($filtersForBooking['event_date_from'], $filtersForBooking['event_date_to']);
            $query->whereHas('eventBooking', function ($q) use ($filtersForBooking) {
                $this->applyFilters($q, $filtersForBooking);
            });
        }

        $items = $query->paginate(30)->appends($request->query());

        return Inertia::render('App/Admin/Events/Reports/MenuWise', [
            'items' => $items,
            'filters' => compact('dateFrom', 'dateTo'),
            'venues' => EventVenue::select('id', 'name')->get(),
        ]);
    }

    public function menuWiseExport(Request $request)
    {
        $filters = $request->all();
        $dateFrom = $request->event_date_from ?? $request->date_from ?? Carbon::now()->startOfMonth()->format('Y-m-d');
        $dateTo = $request->event_date_to ?? $request->date_to ?? Carbon::now()->format('Y-m-d');

        $query = EventBookingMenu::with(['eventBooking.member', 'eventBooking.customer', 'eventBooking.corporateMember', 'eventBooking.eventVenue'])
            ->whereHas('eventBooking', function ($q) use ($dateFrom, $dateTo) {
                $q->whereBetween('event_date', [$dateFrom, $dateTo]);
            });

        if (!empty($filters['venue_id']) || !empty($filters['status']) || !empty($filters['search'])) {
            $filtersForBooking = $filters;
            unset($filtersForBooking['event_date_from'], $filtersForBooking['event_date_to']);
            $query->whereHas('eventBooking', function ($q) use ($filtersForBooking) {
                $this->applyFilters($q, $filtersForBooking);
            });
        }

        return $this->streamCsv($query, function ($row) {
            return [
                $row->eventBooking->booking_no ?? 'N/A',
                $this->getGuestName($row->eventBooking),
                $row->eventBooking->eventVenue->name ?? 'N/A',
                $row->name,  // Menu Name
                $row->amount,  // Price per person
                $row->eventBooking->no_of_guests,
                $row->eventBooking->event_date
            ];
        }, ['Booking No', 'Booked By', 'Venue', 'Menu Name', 'Price', 'Guests', 'Date'], 'menu-wise-report.csv');
    }

    public function menuWisePrint(Request $request)
    {
        $filters = $request->all();
        $dateFrom = $request->event_date_from ?? $request->date_from ?? Carbon::now()->startOfMonth()->format('Y-m-d');
        $dateTo = $request->event_date_to ?? $request->date_to ?? Carbon::now()->format('Y-m-d');

        $query = EventBookingMenu::with(['eventBooking.member', 'eventBooking.customer', 'eventBooking.corporateMember', 'eventBooking.eventVenue'])
            ->whereHas('eventBooking', function ($q) use ($dateFrom, $dateTo) {
                $q->whereBetween('event_date', [$dateFrom, $dateTo]);
            });

        if (!empty($filters['venue_id']) || !empty($filters['status']) || !empty($filters['search'])) {
            $filtersForBooking = $filters;
            unset($filtersForBooking['event_date_from'], $filtersForBooking['event_date_to']);
            $query->whereHas('eventBooking', function ($q) use ($filtersForBooking) {
                $this->applyFilters($q, $filtersForBooking);
            });
        }

        $items = $query->get();

        return Inertia::render('App/Admin/Events/Reports/MenuWisePrint', [
            'items' => $items,
            'filters' => compact('dateFrom', 'dateTo'),
            'generatedAt' => now()->format('d M Y, h:i A')
        ]);
    }

    /**
     * Add-ons Report
     */
    public function addOns(Request $request)
    {
        $filters = $request->all();
        $dateFrom = $request->event_date_from ?? $request->date_from ?? Carbon::now()->startOfMonth()->format('Y-m-d');
        $dateTo = $request->event_date_to ?? $request->date_to ?? Carbon::now()->format('Y-m-d');

        $query = EventBookingMenuAddOn::with(['eventBooking.member', 'eventBooking.customer', 'eventBooking.corporateMember', 'eventBooking.eventVenue'])
            ->whereHas('eventBooking', function ($q) use ($dateFrom, $dateTo) {
                $q->whereBetween('event_date', [$dateFrom, $dateTo]);
            })
            ->where('is_complementary', false);  // Only paid add-ons here? "Add-ons report" usually implies charged items. Complementary has its own report.

        if (!empty($filters['venue_id']) || !empty($filters['status']) || !empty($filters['search'])) {
            $filtersForBooking = $filters;
            unset($filtersForBooking['event_date_from'], $filtersForBooking['event_date_to']);
            $query->whereHas('eventBooking', function ($q) use ($filtersForBooking) {
                $this->applyFilters($q, $filtersForBooking);
            });
        }

        $items = $query->paginate(30)->appends($request->query());

        return Inertia::render('App/Admin/Events/Reports/AddOns', [
            'items' => $items,
            'filters' => compact('dateFrom', 'dateTo'),
            'venues' => EventVenue::select('id', 'name')->get(),
        ]);
    }

    public function addOnsExport(Request $request)
    {
        $filters = $request->all();
        $dateFrom = $request->event_date_from ?? $request->date_from ?? Carbon::now()->startOfMonth()->format('Y-m-d');
        $dateTo = $request->event_date_to ?? $request->date_to ?? Carbon::now()->format('Y-m-d');

        $query = EventBookingMenuAddOn::with(['eventBooking.member', 'eventBooking.customer', 'eventBooking.corporateMember', 'eventBooking.eventVenue'])
            ->whereHas('eventBooking', function ($q) use ($dateFrom, $dateTo) {
                $q->whereBetween('event_date', [$dateFrom, $dateTo]);
            })
            ->where('is_complementary', false);

        if (!empty($filters['venue_id']) || !empty($filters['status']) || !empty($filters['search'])) {
            $filtersForBooking = $filters;
            unset($filtersForBooking['event_date_from'], $filtersForBooking['event_date_to']);
            $query->whereHas('eventBooking', function ($q) use ($filtersForBooking) {
                $this->applyFilters($q, $filtersForBooking);
            });
        }

        return $this->streamCsv($query, function ($row) {
            return [
                $row->eventBooking->booking_no ?? 'N/A',
                $this->getGuestName($row->eventBooking),
                $row->eventBooking->eventVenue->name ?? 'N/A',
                $row->type,  // Addon Type/Name
                $row->details,
                $row->amount,
                $row->eventBooking->event_date
            ];
        }, ['Booking No', 'Booked By', 'Venue', 'Addon', 'Details', 'Amount', 'Date'], 'addons-report.csv');
    }

    public function addOnsPrint(Request $request)
    {
        $filters = $request->all();
        $dateFrom = $request->event_date_from ?? $request->date_from ?? Carbon::now()->startOfMonth()->format('Y-m-d');
        $dateTo = $request->event_date_to ?? $request->date_to ?? Carbon::now()->format('Y-m-d');

        $query = EventBookingMenuAddOn::with(['eventBooking.member', 'eventBooking.customer', 'eventBooking.corporateMember', 'eventBooking.eventVenue'])
            ->whereHas('eventBooking', function ($q) use ($dateFrom, $dateTo) {
                $q->whereBetween('event_date', [$dateFrom, $dateTo]);
            })
            ->where('is_complementary', false);

        if (!empty($filters['venue_id']) || !empty($filters['status']) || !empty($filters['search'])) {
            $filtersForBooking = $filters;
            unset($filtersForBooking['event_date_from'], $filtersForBooking['event_date_to']);
            $query->whereHas('eventBooking', function ($q) use ($filtersForBooking) {
                $this->applyFilters($q, $filtersForBooking);
            });
        }

        $items = $query->get();

        return Inertia::render('App/Admin/Events/Reports/AddOnsPrint', [
            'items' => $items,
            'filters' => compact('dateFrom', 'dateTo'),
            'generatedAt' => now()->format('d M Y, h:i A')
        ]);
    }

    /**
     * Complementary Report (Includes all events and details that had complementary items)
     */
    public function complementary(Request $request)
    {
        $filters = $request->all();
        $dateFrom = $request->event_date_from ?? $request->date_from ?? Carbon::now()->startOfMonth()->format('Y-m-d');
        $dateTo = $request->event_date_to ?? $request->date_to ?? Carbon::now()->format('Y-m-d');

        // We need to fetch items from BOTH MenuAddOns and OtherCharges where is_complementary = 1
        // Since pagination across two tables is tricky with Eloquent, we'll fetch them separately and merge, or use a UNION.
        // For simplicity and to match the 'items' structure, let's just pick one or maybe just list the bookings that have ANY complementary items?
        // User said: "Includes all events and details that had complementary items".
        // A unified list of items is probably best.

        // Approach: Union query for items
        $addons = DB::table('event_booking_menu_add_ons')
            ->join('event_bookings', 'event_booking_menu_add_ons.event_booking_id', '=', 'event_bookings.id')
            ->select(
                'event_booking_menu_add_ons.id', 'event_booking_menu_add_ons.type as item_name', 'event_booking_menu_add_ons.details', 'event_booking_menu_add_ons.amount',
                'event_bookings.booking_no', 'event_bookings.name as guest_name', 'event_bookings.event_date', 'event_bookings.id as booking_id',
                DB::raw("'Add-on' as category")
            )
            ->where('event_booking_menu_add_ons.is_complementary', true)
            ->whereBetween('event_bookings.event_date', [$dateFrom, $dateTo]);

        $charges = DB::table('event_booking_other_charges')
            ->join('event_bookings', 'event_booking_other_charges.event_booking_id', '=', 'event_bookings.id')
            ->select(
                'event_booking_other_charges.id', 'event_booking_other_charges.type as item_name', 'event_booking_other_charges.details', 'event_booking_other_charges.amount',
                'event_bookings.booking_no', 'event_bookings.name as guest_name', 'event_bookings.event_date', 'event_bookings.id as booking_id',
                DB::raw("'Other Charge' as category")
            )
            ->where('event_booking_other_charges.is_complementary', true)
            ->whereBetween('event_bookings.event_date', [$dateFrom, $dateTo]);

        // Combine
        $query = $addons->union($charges);

        // Filters?
        // Basic search on booking details is hard on Union without complex joins.
        // Let's stick to simple date filter for now or implement search on the result?
        // For 'venue_id', we'd need to join venues too.

        $items = $query->orderBy('event_date', 'desc')->paginate(30)->appends($request->query());

        return Inertia::render('App/Admin/Events/Reports/Complementary', [
            'items' => $items,
            'filters' => compact('dateFrom', 'dateTo'),
            'venues' => EventVenue::select('id', 'name')->get(),
        ]);
    }

    public function complementaryExport(Request $request)
    {
        $dateFrom = $request->event_date_from ?? $request->date_from ?? Carbon::now()->startOfMonth()->format('Y-m-d');
        $dateTo = $request->event_date_to ?? $request->date_to ?? Carbon::now()->format('Y-m-d');

        $addons = DB::table('event_booking_menu_add_ons')
            ->join('event_bookings', 'event_booking_menu_add_ons.event_booking_id', '=', 'event_bookings.id')
            ->select('event_bookings.booking_no', 'event_bookings.name', 'event_bookings.event_date', 'event_booking_menu_add_ons.type', 'event_booking_menu_add_ons.details', 'event_booking_menu_add_ons.amount')
            ->where('event_booking_menu_add_ons.is_complementary', true)
            ->whereBetween('event_bookings.event_date', [$dateFrom, $dateTo]);

        $charges = DB::table('event_booking_other_charges')
            ->join('event_bookings', 'event_booking_other_charges.event_booking_id', '=', 'event_bookings.id')
            ->select('event_bookings.booking_no', 'event_bookings.name', 'event_bookings.event_date', 'event_booking_other_charges.type', 'event_booking_other_charges.details', 'event_booking_other_charges.amount')
            ->where('event_booking_other_charges.is_complementary', true)
            ->whereBetween('event_bookings.event_date', [$dateFrom, $dateTo]);

        $query = $addons->union($charges)->orderBy('event_date', 'desc');

        return $this->streamCsv($query, function ($row) {
            return [
                $row->booking_no,
                $row->name,
                $row->event_date,
                $row->type,
                $row->details,
                $row->amount
            ];
        }, ['Booking No', 'Guest', 'Date', 'Item', 'Details', 'Value'], 'complementary-report.csv');
    }

    public function complementaryPrint(Request $request)
    {
        $dateFrom = $request->event_date_from ?? $request->date_from ?? Carbon::now()->startOfMonth()->format('Y-m-d');
        $dateTo = $request->event_date_to ?? $request->date_to ?? Carbon::now()->format('Y-m-d');

        $addons = DB::table('event_booking_menu_add_ons')
            ->join('event_bookings', 'event_booking_menu_add_ons.event_booking_id', '=', 'event_bookings.id')
            ->select(
                'event_booking_menu_add_ons.id', 'event_booking_menu_add_ons.type as item_name', 'event_booking_menu_add_ons.details', 'event_booking_menu_add_ons.amount',
                'event_bookings.booking_no', 'event_bookings.name as guest_name', 'event_bookings.event_date',
                DB::raw("'Add-on' as category")
            )
            ->where('event_booking_menu_add_ons.is_complementary', true)
            ->whereBetween('event_bookings.event_date', [$dateFrom, $dateTo]);

        $charges = DB::table('event_booking_other_charges')
            ->join('event_bookings', 'event_booking_other_charges.event_booking_id', '=', 'event_bookings.id')
            ->select(
                'event_booking_other_charges.id', 'event_booking_other_charges.type as item_name', 'event_booking_other_charges.details', 'event_booking_other_charges.amount',
                'event_bookings.booking_no', 'event_bookings.name as guest_name', 'event_bookings.event_date',
                DB::raw("'Other Charge' as category")
            )
            ->where('event_booking_other_charges.is_complementary', true)
            ->whereBetween('event_bookings.event_date', [$dateFrom, $dateTo]);

        $items = $addons->union($charges)->orderBy('event_date', 'desc')->get();

        return Inertia::render('App/Admin/Events/Reports/ComplementaryPrint', [
            'items' => $items,
            'filters' => compact('dateFrom', 'dateTo'),
            'generatedAt' => now()->format('d M Y, h:i A')
        ]);
    }

    // --- Helpers ---

    private function applyFilters($query, $filters)
    {
        $customerType = $filters['customer_type'] ?? 'all';
        $search = $filters['search'] ?? null;

        if ($customerType === 'member') {
            $query->whereHas('member');
            if ($search) {
                $query->whereHas('member', function ($q) use ($search) {
                    $q
                        ->where('full_name', 'like', "%{$search}%")
                        ->orWhere('membership_no', 'like', "%{$search}%");
                });
            }
        } elseif ($customerType === 'corporate') {
            $query->whereHas('corporateMember');
            if ($search) {
                $query->whereHas('corporateMember', function ($q) use ($search) {
                    $q
                        ->where('full_name', 'like', "%{$search}%")
                        ->orWhere('membership_no', 'like', "%{$search}%");
                });
            }
        } elseif ($customerType === 'guest') {
            $query->whereHas('customer');
            if ($search) {
                $query->whereHas('customer', function ($q) use ($search) {
                    $q
                        ->where('name', 'like', "%{$search}%")
                        ->orWhere('customer_no', 'like', "%{$search}%");
                });
            }
        } else {
            // ALL types
            if ($search) {
                $query->where(function ($q) use ($search) {
                    $q
                        ->where('booking_no', 'like', "%{$search}%")
                        ->orWhere('name', 'like', "%{$search}%")  // Direct name on booking
                        ->orWhereHas('member', function ($sub) use ($search) {
                            $sub
                                ->where('full_name', 'like', "%{$search}%")
                                ->orWhere('membership_no', 'like', "%{$search}%");
                        })
                        ->orWhereHas('corporateMember', function ($sub) use ($search) {
                            $sub
                                ->where('full_name', 'like', "%{$search}%")
                                ->orWhere('membership_no', 'like', "%{$search}%");
                        })
                        ->orWhereHas('customer', function ($sub) use ($search) {
                            $sub
                                ->where('name', 'like', "%{$search}%")
                                ->orWhere('customer_no', 'like', "%{$search}%");
                        });
                });
            }
        }

        // Venue Filter
        if (!empty($filters['venue_id'])) {
            $venueIds = is_array($filters['venue_id']) ? $filters['venue_id'] : explode(',', $filters['venue_id']);
            $query->whereIn('event_venue_id', $venueIds);
        }

        // Status Filter
        if (!empty($filters['status'])) {
            $statuses = is_array($filters['status']) ? $filters['status'] : explode(',', $filters['status']);
            $query->whereIn('status', $statuses);
        }

        // Event Date Range
        if (!empty($filters['event_date_from'])) {
            $query->whereDate('event_date', '>=', $filters['event_date_from']);
        }
        if (!empty($filters['event_date_to'])) {
            $query->whereDate('event_date', '<=', $filters['event_date_to']);
        }

        // Booking Date (Created At)
        if (!empty($filters['booking_date_from'])) {
            $query->whereDate('created_at', '>=', $filters['booking_date_from']);
        }
        if (!empty($filters['booking_date_to'])) {
            $query->whereDate('created_at', '<=', $filters['booking_date_to']);
        }

        return $query;
    }

    private function streamCsv($query, callable $rowFormatter, array $columns, string $filename)
    {
        return response()->streamDownload(function () use ($query, $rowFormatter, $columns) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, $columns);

            $query->chunk(100, function ($results) use ($handle, $rowFormatter) {
                foreach ($results as $row) {
                    fputcsv($handle, $rowFormatter($row));
                }
            });

            fclose($handle);
        }, $filename);
    }

    private function getGuestName($booking)
    {
        if (!$booking)
            return 'Unknown';
        return $booking->booked_by ?? ($booking->member ? $booking->member->full_name : ($booking->customer ? $booking->customer->name : 'Unknown'));
    }
}
