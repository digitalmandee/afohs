import React from 'react';
import { router } from '@inertiajs/react';
import { Button, Grid, TableCell, TableRow, TextField, Typography } from '@mui/material';
import { DescriptionOutlined, EditOutlined } from '@mui/icons-material';
import AppPage from '@/components/App/ui/AppPage';
import AdminDataTable from '@/components/App/ui/AdminDataTable';
import FilterToolbar from '@/components/App/ui/FilterToolbar';
import StatCard from '@/components/App/ui/StatCard';
import SurfaceCard from '@/components/App/ui/SurfaceCard';
import { AdminIconAction, AdminRowActionGroup } from '@/components/App/ui/AdminRowActions';
import EventBookingInvoiceModal from '@/components/App/Events/EventBookingInvoiceModal';
import { EventStatusChip, TruncatedValue, formatAmount, formatDate } from '../Booking/roomEventListUi';

function resolveGuestName(booking) {
    return booking.customer?.name || booking.member?.full_name || booking.corporateMember?.full_name || booking.name || 'N/A';
}

function resolveGuestId(booking) {
    return booking.member?.membership_no || booking.corporateMember?.membership_no || booking.customer?.customer_no || booking.booking_no;
}

export default function EventBookingDashboard({ data, eventVenues = [] }) {
    const [searchTerm, setSearchTerm] = React.useState('');
    const [selectedBookingId, setSelectedBookingId] = React.useState(null);
    const bookings = data?.bookingsData || [];

    const filteredBookings = React.useMemo(() => {
        const normalized = searchTerm.trim().toLowerCase();

        if (!normalized) {
            return bookings;
        }

        return bookings.filter((booking) => {
            return [
                resolveGuestName(booking),
                resolveGuestId(booking),
                booking.event_venue?.name,
                booking.nature_of_event,
                booking.booking_no,
            ]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(normalized));
        });
    }, [bookings, searchTerm]);

    const applyFilters = React.useCallback(() => {
        setSearchTerm((current) => current.trim());
    }, []);

    return (
        <>
            <AppPage
                eyebrow="Events"
                title="Events Dashboard"
                subtitle="Recent event activity, venue coverage, and direct compact actions in the upgraded event operations shell."
                actions={[
                    <Button key="manage" variant="outlined" onClick={() => router.visit(route('events.manage'))}>
                        Manage Bookings
                    </Button>,
                    <Button key="venues" variant="outlined" onClick={() => router.visit(route('event-venues.index'))}>
                        Venues
                    </Button>,
                    <Button key="create" variant="contained" onClick={() => router.visit(route('events.booking.create'))}>
                        Event Booking
                    </Button>,
                ]}
            >
                <Grid container spacing={2.25}>
                    <Grid item xs={12} md={3}>
                        <StatCard label="Event Bookings" value={data?.totalEventBookings || 0} accent />
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <StatCard label="Available Venues" value={data?.availableVenuesToday || 0} tone="light" />
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <StatCard label="Confirmed" value={data?.confirmedBookings || 0} tone="muted" />
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <StatCard label="Completed" value={data?.completedBookings || 0} tone="light" />
                    </Grid>
                </Grid>

                <SurfaceCard title="Live Search" subtitle={`Filter recent bookings by guest, booking number, venue, or event name across ${eventVenues.length} active venues.`}>
                    <FilterToolbar
                        title="Filters"
                        subtitle="Refine bookings and click Apply."
                        lowChrome
                        onApply={applyFilters}
                        onReset={() => setSearchTerm('')}
                    >
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    label="Search recent bookings"
                                    placeholder="Guest, booking #, venue, or event"
                                    value={searchTerm}
                                    onChange={(event) => setSearchTerm(event.target.value)}
                                />
                            </Grid>
                        </Grid>
                    </FilterToolbar>
                </SurfaceCard>

                <SurfaceCard title="Recent Event Bookings" subtitle="Compact icon-only row actions keep invoice and edit flows on one line while preserving direct access.">
                    <AdminDataTable
                        columns={[
                            { key: 'booking_no', label: 'Booking #', minWidth: 120 },
                            { key: 'guest_id', label: 'Member / Guest #', minWidth: 150 },
                            { key: 'guest', label: 'Guest', minWidth: 220 },
                            { key: 'venue', label: 'Venue', minWidth: 180 },
                            { key: 'event', label: 'Event', minWidth: 200 },
                            { key: 'booking_date', label: 'Booked', minWidth: 110 },
                            { key: 'event_date', label: 'Event Date', minWidth: 110 },
                            { key: 'total', label: 'Total', minWidth: 110, align: 'right' },
                            { key: 'status', label: 'Status', minWidth: 120 },
                            { key: 'actions', label: 'Actions', minWidth: 100, align: 'right' },
                        ]}
                        rows={filteredBookings}
                        emptyMessage="No event bookings match the current search."
                        tableMinWidth={1380}
                        stickyLastColumn
                        renderRow={(booking) => (
                            <TableRow key={booking.id} hover>
                                <TableCell sx={{ fontWeight: 700 }}>{booking.booking_no}</TableCell>
                                <TableCell>{resolveGuestId(booking)}</TableCell>
                                <TableCell>
                                    <TruncatedValue value={resolveGuestName(booking)} maxWidth={220} />
                                </TableCell>
                                <TableCell>
                                    <TruncatedValue value={booking.event_venue?.name || 'N/A'} maxWidth={180} />
                                </TableCell>
                                <TableCell>
                                    <TruncatedValue value={booking.nature_of_event || 'N/A'} maxWidth={200} />
                                </TableCell>
                                <TableCell>{formatDate(booking.booking_date || booking.created_at)}</TableCell>
                                <TableCell>{formatDate(booking.event_date)}</TableCell>
                                <TableCell align="right">{formatAmount(booking.total_price)}</TableCell>
                                <TableCell>
                                    <EventStatusChip status={booking.status} />
                                </TableCell>
                                <TableCell align="right">
                                    <AdminRowActionGroup justify="flex-end">
                                        <AdminIconAction title="View Invoice" onClick={() => setSelectedBookingId(booking.id)}>
                                            <DescriptionOutlined fontSize="small" />
                                        </AdminIconAction>
                                        <AdminIconAction title="Edit Booking" color="warning" onClick={() => router.visit(route('events.booking.edit', booking.id))}>
                                            <EditOutlined fontSize="small" />
                                        </AdminIconAction>
                                    </AdminRowActionGroup>
                                </TableCell>
                            </TableRow>
                        )}
                    />
                </SurfaceCard>
            </AppPage>

            <EventBookingInvoiceModal open={!!selectedBookingId} onClose={() => setSelectedBookingId(null)} bookingId={selectedBookingId} setBookings={() => {}} />
        </>
    );
}
