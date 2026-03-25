import { router } from '@inertiajs/react';
import { Cancel, Visibility } from '@mui/icons-material';
import { Box, TableCell, TableRow, Tooltip, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { FaEdit } from 'react-icons/fa';
import AdminDataTable from '@/components/App/ui/AdminDataTable';
import BookingInvoiceModal from '@/components/App/Rooms/BookingInvoiceModal';
import ViewDocumentsModal from '@/components/App/Rooms/ViewDocumentsModal';
import BookingActionModal from '@/components/App/Rooms/BookingActionModal';
import RoomCheckInModal from '@/components/App/Rooms/CheckInModal';
import RoomBookingFilter from './BookingFilter';
import {
    formatAmount,
    formatDate,
    IconActionButton,
    OutlineActionButton,
    PageShell,
    RoomStatusChip,
    TableActionStack,
    TotalsRow,
    TruncatedValue,
} from './roomEventListUi';

const RoomScreen = ({ bookings }) => {
    const [filteredBookings, setFilteredBookings] = useState(bookings.data || []);
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [showDocsModal, setShowDocsModal] = useState(false);
    const [selectedBookingForDocs, setSelectedBookingForDocs] = useState(null);
    const [checkInModalOpen, setCheckInModalOpen] = useState(false);
    const [selectedCheckInBooking, setSelectedCheckInBooking] = useState(null);
    const [actionModalOpen, setActionModalOpen] = useState(false);
    const [actionType, setActionType] = useState(null);
    const [selectedActionBooking, setSelectedActionBooking] = useState(null);

    const handleShowInvoice = (booking) => {
        setSelectedBooking(booking);
        setShowInvoiceModal(true);
    };

    const handleCloseInvoice = () => {
        setShowInvoiceModal(false);
        setSelectedBooking(null);
    };

    const handleShowDocs = (booking) => {
        setSelectedBookingForDocs(booking);
        setShowDocsModal(true);
    };

    const handleCloseDocs = () => {
        setShowDocsModal(false);
        setSelectedBookingForDocs(null);
    };

    const handleOpenCheckIn = (booking) => {
        setSelectedCheckInBooking(booking);
        setCheckInModalOpen(true);
    };

    const handleCloseCheckIn = (result) => {
        setCheckInModalOpen(false);
        setSelectedCheckInBooking(null);
        if (result === 'success') {
            router.reload();
        }
    };

    const handleOpenActionModal = (booking, type) => {
        setSelectedActionBooking(booking);
        setActionType(type);
        setActionModalOpen(true);
    };

    const handleConfirmAction = (bookingId, reason, refundData) => {
        if (actionType === 'cancel') {
            router.put(route('rooms.booking.cancel', bookingId), { cancellation_reason: reason }, { onSuccess: () => setActionModalOpen(false) });
            return;
        }

        if (actionType === 'refund') {
            router.put(
                route('rooms.booking.refund', bookingId),
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

        router.put(route('rooms.booking.undo-cancel', bookingId), {}, { onSuccess: () => setActionModalOpen(false) });
    };

    useEffect(() => {
        setFilteredBookings(bookings.data || []);
    }, [bookings]);

    const totals = useMemo(
        () =>
            (filteredBookings || []).reduce(
                (acc, booking) => {
                    acc.perDayCharge += Number(booking.per_day_charge || 0);
                    acc.securityDeposit += Number(booking.security_deposit || 0);
                    acc.advancePaid += Number(booking.advance_amount || 0);
                    acc.totalAmount += Number(booking.grand_total || 0);
                    return acc;
                },
                { perDayCharge: 0, securityDeposit: 0, advancePaid: 0, totalAmount: 0 },
            ),
        [filteredBookings],
    );

    const columns = [
        { key: 'booking', label: 'Booking ID', minWidth: 120 },
        { key: 'guest', label: 'Member / Guest', minWidth: 180, wrap: true },
        { key: 'membership', label: 'Membership No', minWidth: 140 },
        { key: 'occupied', label: 'Occupied By', minWidth: 150, wrap: true },
        { key: 'bookingDate', label: 'Booking Date', minWidth: 130 },
        { key: 'checkIn', label: 'Check-In', minWidth: 120 },
        { key: 'checkOut', label: 'Check-Out', minWidth: 120 },
        { key: 'room', label: 'Room', minWidth: 140 },
        { key: 'persons', label: 'Persons', minWidth: 90, align: 'right' },
        { key: 'duration', label: 'Duration', minWidth: 90, align: 'right' },
        { key: 'perDay', label: 'Per Day Charge', minWidth: 130, align: 'right' },
        { key: 'deposit', label: 'Security Deposit', minWidth: 140, align: 'right' },
        { key: 'advance', label: 'Advance Paid', minWidth: 120, align: 'right' },
        { key: 'paymentMode', label: 'Payment Mode', minWidth: 130 },
        { key: 'paymentAccount', label: 'Payment Account', minWidth: 160, wrap: true },
        { key: 'total', label: 'Total Amount', minWidth: 120, align: 'right' },
        { key: 'status', label: 'Status', minWidth: 120 },
        { key: 'actions', label: 'Actions', minWidth: 150, sticky: 'right' },
    ];

    return (
        <>
            <PageShell
                eyebrow="Rooms"
                title="Room Bookings"
                subtitle="Manage room reservations in the current premium operations shell with live filters, clearer actions, and a modern register layout."
                filterSubtitle="Refine bookings by member, booking, room, and date ranges without leaving the live register."
                filterContent={<RoomBookingFilter embedded showStatus={false} />}
                tableTitle="Booking Register"
                tableSubtitle="Modernized room-booking table with current admin styling, preserved actions, and bottom-line totals."
            >
                <AdminDataTable
                    columns={columns}
                    rows={filteredBookings}
                    pagination={bookings}
                    tableMinWidth={2120}
                    stickyLastColumn
                    emptyMessage="No room bookings found."
                    renderRow={(booking) => (
                        <TableRow key={booking.id} hover>
                            <TableCell sx={{ fontWeight: 700 }}>{booking.booking_no}</TableCell>
                            <TableCell>
                                <TruncatedValue
                                    value={
                                        booking.customer
                                            ? booking.customer.name
                                            : booking.member
                                              ? booking.member.full_name
                                              : booking.corporateMember || booking.corporate_member
                                                ? (booking.corporateMember || booking.corporate_member).full_name
                                                : ''
                                    }
                                />
                            </TableCell>
                            <TableCell>{booking.member ? booking.member.membership_no : booking.corporateMember || booking.corporate_member ? (booking.corporateMember || booking.corporate_member).membership_no : booking.customer ? booking.customer.customer_no : '-'}</TableCell>
                            <TableCell>
                                <TruncatedValue value={`${booking.guest_first_name || ''} ${booking.guest_last_name || ''}`.trim() || '-'} />
                            </TableCell>
                            <TableCell>{formatDate(booking.booking_date)}</TableCell>
                            <TableCell>{formatDate(booking.check_in_date)}</TableCell>
                            <TableCell>{formatDate(booking.check_out_date)}</TableCell>
                            <TableCell>{booking.room?.name || '-'}</TableCell>
                            <TableCell align="right">{booking.persons || 0}</TableCell>
                            <TableCell align="right">{booking.nights || dayjs(booking.check_out_date).diff(dayjs(booking.check_in_date), 'day') + 1 || 0}</TableCell>
                            <TableCell align="right">{formatAmount(booking.per_day_charge)}</TableCell>
                            <TableCell align="right">{formatAmount(booking.security_deposit)}</TableCell>
                            <TableCell align="right">{formatAmount(booking.advance_amount)}</TableCell>
                            <TableCell>{booking.invoice?.payment_method || '-'}</TableCell>
                            <TableCell>
                                <TruncatedValue value={booking.invoice?.payment_account || booking.invoice?.data?.payment_account || '-'} />
                            </TableCell>
                            <TableCell align="right">{formatAmount(booking.grand_total)}</TableCell>
                            <TableCell><RoomStatusChip status={booking.status} /></TableCell>
                            <TableCell>
                                <TableActionStack>
                                    <IconActionButton title="View Documents" onClick={() => handleShowDocs(booking)}>
                                        <Visibility fontSize="small" />
                                    </IconActionButton>
                                    <IconActionButton title="Edit Booking" onClick={() => router.visit(route('rooms.edit.booking', { id: booking.id }))} color="#f57c00">
                                        <FaEdit size={16} />
                                    </IconActionButton>
                                    <OutlineActionButton label="View" onClick={() => handleShowInvoice(booking)} />
                                    {['pending', 'confirmed'].includes(booking.status) ? <OutlineActionButton label="Check In" onClick={() => handleOpenCheckIn(booking)} /> : null}
                                    {!['cancelled', 'refunded'].includes(booking.status) ? (
                                        <IconActionButton title="Cancel Booking" onClick={() => handleOpenActionModal(booking, 'cancel')} color="#d32f2f">
                                            <Cancel fontSize="small" />
                                        </IconActionButton>
                                    ) : null}
                                    {booking.status === 'cancelled' &&
                                    Number(booking.invoice?.advance_payment || booking.invoice?.paid_amount || 0) > 0 &&
                                    (booking.booking_date || booking.created_at) &&
                                    dayjs().diff(dayjs(booking.booking_date || booking.created_at), 'day') <= 2 ? (
                                        <OutlineActionButton label="Return Advance" color="error" onClick={() => handleOpenActionModal(booking, 'refund')} />
                                    ) : null}
                                </TableActionStack>
                            </TableCell>
                        </TableRow>
                    )}
                />

                <TotalsRow
                    items={[
                        { label: 'Per Day Charge', value: formatAmount(totals.perDayCharge) },
                        { label: 'Security Deposit', value: formatAmount(totals.securityDeposit) },
                        { label: 'Advance Paid', value: formatAmount(totals.advancePaid) },
                        { label: 'Total Amount', value: formatAmount(totals.totalAmount) },
                    ]}
                />
            </PageShell>

            <BookingInvoiceModal open={showInvoiceModal} onClose={handleCloseInvoice} bookingId={selectedBooking?.id} setBookings={setFilteredBookings} type="ROOM_BOOKING" />
            <ViewDocumentsModal open={showDocsModal} onClose={handleCloseDocs} bookingId={selectedBookingForDocs?.id} />
            <RoomCheckInModal open={checkInModalOpen} onClose={handleCloseCheckIn} bookingId={selectedCheckInBooking?.id} />
            <BookingActionModal open={actionModalOpen} onClose={() => setActionModalOpen(false)} booking={selectedActionBooking} action={actionType} onConfirm={handleConfirmAction} />
        </>
    );
};

export default RoomScreen;
