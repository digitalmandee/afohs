import { router } from '@inertiajs/react';
import { Cancel, Visibility } from '@mui/icons-material';
import { TableCell, TableRow } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import axios from 'axios';
import { FaEdit } from 'react-icons/fa';
import AdminDataTable from '@/components/App/ui/AdminDataTable';
import EventBookingInvoiceModal from '@/components/App/Events/EventBookingInvoiceModal';
import EventViewDocumentsModal from '@/components/App/Events/EventViewDocumentsModal';
import EventBookingActionModal from '@/components/App/Events/EventBookingActionModal';
import RoomBookingFilter from '../Booking/BookingFilter';
import {
    EventStatusChip,
    formatAmount,
    formatDate,
    IconActionButton,
    OutlineActionButton,
    PageShell,
    TableActionStack,
    TotalsRow,
    TruncatedValue,
} from '../Booking/roomEventListUi';

const EventsManage = ({ bookings, aggregates }) => {
    const [filteredBookings, setFilteredBookings] = useState(bookings.data || []);
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const [selectedBookingId, setSelectedBookingId] = useState(null);
    const [venues, setVenues] = useState([]);
    const [showDocsModal, setShowDocsModal] = useState(false);
    const [selectedBookingForDocs, setSelectedBookingForDocs] = useState(null);
    const [actionModalOpen, setActionModalOpen] = useState(false);
    const [actionType, setActionType] = useState(null);
    const [selectedActionBooking, setSelectedActionBooking] = useState(null);

    useEffect(() => {
        axios
            .get('/api/events/venues')
            .then((response) => setVenues(response.data))
            .catch(() => setVenues([]));
    }, []);

    useEffect(() => {
        setFilteredBookings(bookings.data || []);
    }, [bookings]);

    const handleConfirmAction = (bookingId, reason, refundData) => {
        if (actionType === 'cancel') {
            const data = { cancellation_reason: reason };
            if (refundData?.amount) {
                data.refund_amount = refundData.amount;
                data.refund_mode = refundData.mode;
                data.refund_account = refundData.account;
            }
            router.put(route('events.booking.cancel', bookingId), data, { onSuccess: () => setActionModalOpen(false) });
            return;
        }

        if (actionType === 'refund') {
            router.put(
                route('events.booking.refund', bookingId),
                {
                    refund_amount: refundData.amount,
                    refund_mode: refundData.mode,
                    refund_account: refundData.account,
                    notes: reason,
                },
                { onSuccess: () => setActionModalOpen(false) },
            );
            return;
        }

        router.put(route('events.booking.undo-cancel', bookingId), {}, { onSuccess: () => setActionModalOpen(false) });
    };

    return (
        <>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
                <PageShell
                    eyebrow="Events"
                    title="Event Bookings"
                    subtitle="Create, monitor, and act on event bookings in the same premium register shell used by the newer admin screens."
                    filterSubtitle="Filter live by guest type, guest name, membership, venue, booking date, and event date."
                    filterContent={<RoomBookingFilter embedded routeName="events.manage" showRoomType={false} showVenues venues={venues} showStatus={false} showDates={{ booking: true, checkIn: true, checkOut: false }} dateLabels={{ booking: 'Booking Date', checkIn: 'Event Date' }} />}
                    tableTitle="Event Booking Register"
                    tableSubtitle="Unified event-booking table with modern badges, compact actions, and preserved cancellation workflows."
                >
                    <AdminDataTable
                        columns={[
                            { key: 'bookingNo', label: 'Booking No', minWidth: 130 },
                            { key: 'membership', label: 'Membership / Guest ID', minWidth: 160 },
                            { key: 'guestName', label: 'Guest Name', minWidth: 180, wrap: true },
                            { key: 'guestType', label: 'Guest Type', minWidth: 140 },
                            { key: 'event', label: 'Event', minWidth: 140, wrap: true },
                            { key: 'venue', label: 'Venue', minWidth: 140, wrap: true },
                            { key: 'timing', label: 'Timing', minWidth: 150 },
                            { key: 'menu', label: 'Menu', minWidth: 150, wrap: true },
                            { key: 'bookingDate', label: 'Booking Date', minWidth: 130 },
                            { key: 'eventDate', label: 'Event Date', minWidth: 130 },
                            { key: 'total', label: 'Total', minWidth: 100, align: 'right' },
                            { key: 'advance', label: 'Advance', minWidth: 100, align: 'right' },
                            { key: 'paid', label: 'Paid', minWidth: 100, align: 'right' },
                            { key: 'balance', label: 'Balance', minWidth: 100, align: 'right' },
                            { key: 'status', label: 'Status', minWidth: 120 },
                            { key: 'actions', label: 'Actions', minWidth: 160, sticky: 'right' },
                        ]}
                        rows={filteredBookings}
                        pagination={bookings}
                        tableMinWidth={2050}
                        stickyLastColumn
                        emptyMessage="No event bookings found."
                        renderRow={(booking) => {
                            const invoicePaid = Number(booking.invoice?.paid_amount ?? 0) + Number(booking.invoice?.advance_payment ?? 0);
                            const totalReceived = invoicePaid + Number(booking.security_deposit ?? 0);
                            const totalPrice = Number(booking.total_price ?? 0);
                            const membershipOrGuestId = booking.member?.membership_no || booking.corporateMember?.membership_no || booking.corporate_member?.membership_no || booking.customer?.customer_no || '-';
                            const guestTypeName = booking.member ? 'Member' : booking.corporateMember || booking.corporate_member ? 'Corporate Member' : booking.customer ? booking.customer?.guest_type?.name || booking.customer?.guestType?.name || 'Guest' : '-';
                            const timing = booking.event_time_from && booking.event_time_to ? `${booking.event_time_from} - ${booking.event_time_to}` : booking.event_time_from || booking.event_time_to || 'N/A';

                            return (
                                <TableRow key={booking.id} hover>
                                    <TableCell sx={{ fontWeight: 700 }}>{booking.booking_no}</TableCell>
                                    <TableCell>{membershipOrGuestId}</TableCell>
                                    <TableCell><TruncatedValue value={booking.name || booking.customer?.name || booking.member?.full_name || booking.corporateMember?.full_name || booking.corporate_member?.full_name || 'N/A'} /></TableCell>
                                    <TableCell>{guestTypeName}</TableCell>
                                    <TableCell><TruncatedValue value={booking.nature_of_event || 'N/A'} /></TableCell>
                                    <TableCell><TruncatedValue value={booking.event_venue?.name || 'N/A'} /></TableCell>
                                    <TableCell>{timing}</TableCell>
                                    <TableCell><TruncatedValue value={booking.menu?.name || 'N/A'} /></TableCell>
                                    <TableCell>{formatDate(booking.created_at)}</TableCell>
                                    <TableCell>{formatDate(booking.event_date)}</TableCell>
                                    <TableCell align="right">{formatAmount(booking.total_price)}</TableCell>
                                    <TableCell align="right">{formatAmount(booking.advance_amount)}</TableCell>
                                    <TableCell align="right">{formatAmount(totalReceived)}</TableCell>
                                    <TableCell align="right">{formatAmount(totalPrice - invoicePaid)}</TableCell>
                                    <TableCell><EventStatusChip status={booking.status || booking.invoice?.status || 'pending'} /></TableCell>
                                    <TableCell>
                                        <TableActionStack>
                                            <IconActionButton title="View Documents" onClick={() => { setSelectedBookingForDocs(booking); setShowDocsModal(true); }}>
                                                <Visibility fontSize="small" />
                                            </IconActionButton>
                                            <IconActionButton title="Edit Booking" onClick={() => router.visit(route('events.booking.edit', booking.id))} color="#f57c00">
                                                <FaEdit size={16} />
                                            </IconActionButton>
                                            <OutlineActionButton label="View" onClick={() => { setSelectedBookingId(booking.id); setShowInvoiceModal(true); }} />
                                            {!['completed', 'cancelled', 'refunded'].includes(booking.status) ? (
                                                <IconActionButton title="Cancel Booking" onClick={() => { setSelectedActionBooking(booking); setActionType('cancel'); setActionModalOpen(true); }} color="#d32f2f">
                                                    <Cancel fontSize="small" />
                                                </IconActionButton>
                                            ) : null}
                                            {booking.status === 'cancelled' && (booking.invoice?.paid_amount > 0 || booking.invoice?.advance_payment > 0 || booking.security_deposit > 0) ? (
                                                <OutlineActionButton label="Refund" color="error" onClick={() => { setSelectedActionBooking(booking); setActionType('refund'); setActionModalOpen(true); }} />
                                            ) : null}
                                            {['cancelled', 'refunded'].includes(booking.status) ? (
                                                <OutlineActionButton label="Undo" onClick={() => { setSelectedActionBooking(booking); setActionType('undo'); setActionModalOpen(true); }} />
                                            ) : null}
                                        </TableActionStack>
                                    </TableCell>
                                </TableRow>
                            );
                        }}
                    />

                    {aggregates ? (
                        <TotalsRow
                            items={[
                                { label: 'Total Amount', value: aggregates.total_amount },
                                { label: 'Advance', value: aggregates.total_advance },
                                { label: 'Paid', value: aggregates.total_paid },
                                { label: 'Balance', value: aggregates.total_balance },
                            ]}
                        />
                    ) : null}
                </PageShell>
            </LocalizationProvider>

            <EventBookingInvoiceModal open={showInvoiceModal} onClose={() => { setShowInvoiceModal(false); setSelectedBookingId(null); }} bookingId={selectedBookingId} setBookings={() => router.reload({ only: ['bookings'] })} />
            <EventViewDocumentsModal open={showDocsModal} onClose={() => { setShowDocsModal(false); setSelectedBookingForDocs(null); }} bookingId={selectedBookingForDocs?.id} />
            <EventBookingActionModal open={actionModalOpen} onClose={() => setActionModalOpen(false)} booking={selectedActionBooking} action={actionType} onConfirm={handleConfirmAction} />
        </>
    );
};

export default EventsManage;
