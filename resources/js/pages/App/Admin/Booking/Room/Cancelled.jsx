import { router } from '@inertiajs/react';
import { Visibility } from '@mui/icons-material';
import { Box, TableCell, TableRow, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import AdminDataTable from '@/components/App/ui/AdminDataTable';
import BookingInvoiceModal from '@/components/App/Rooms/BookingInvoiceModal';
import BookingActionModal from '@/components/App/Rooms/BookingActionModal';
import RoomBookingFilter from '../BookingFilter';
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
} from '../roomEventListUi';

const RoomCancelled = ({ bookings }) => {
    const [filteredBookings, setFilteredBookings] = useState(bookings.data || []);
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [actionModalOpen, setActionModalOpen] = useState(false);
    const [actionType, setActionType] = useState(null);
    const [selectedActionBooking, setSelectedActionBooking] = useState(null);

    const handleOpenInvoice = (booking) => {
        setSelectedBooking(booking);
        setShowInvoiceModal(true);
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
                    acc.securityDeposit += Number(booking.invoice?.advance_payment || booking.invoice?.paid_amount || 0);
                    return acc;
                },
                { perDayCharge: 0, securityDeposit: 0 },
            ),
        [filteredBookings],
    );

    return (
        <>
            <PageShell
                eyebrow="Rooms"
                title="Cancelled Room Bookings"
                subtitle="Review cancelled and refunded room stays in the updated premium register with clearer statuses and action controls."
                filterSubtitle="Filter cancelled room bookings by member, booking ID, room, and stay dates without leaving the register."
                filterContent={<RoomBookingFilter embedded routeName="rooms.booking.cancelled" showStatus={false} showRoomType showDates={{ booking: true, checkIn: true, checkOut: true }} />}
                tableTitle="Cancelled Register"
                tableSubtitle="Cancellation and refund register with current admin styling and preserved undo or return-advance flows."
            >
                <AdminDataTable
                    columns={[
                        { key: 'id', label: 'ID', minWidth: 90 },
                        { key: 'bookingDate', label: 'Booking Date', minWidth: 130 },
                        { key: 'checkIn', label: 'Check-In', minWidth: 120 },
                        { key: 'checkOut', label: 'Check-Out', minWidth: 120 },
                        { key: 'guest', label: 'Member / Guest', minWidth: 180, wrap: true },
                        { key: 'membership', label: 'Membership No', minWidth: 140 },
                        { key: 'occupied', label: 'Occupied By', minWidth: 150, wrap: true },
                        { key: 'room', label: 'Room', minWidth: 120 },
                        { key: 'persons', label: 'Persons', minWidth: 90, align: 'right' },
                        { key: 'perDay', label: 'Per Day Charge', minWidth: 130, align: 'right' },
                        { key: 'deposit', label: 'Security Deposit', minWidth: 140, align: 'right' },
                        { key: 'paymentMode', label: 'Payment Mode', minWidth: 130 },
                        { key: 'account', label: 'Account', minWidth: 150, wrap: true },
                        { key: 'status', label: 'Status', minWidth: 140, wrap: true },
                        { key: 'actions', label: 'Actions', minWidth: 150, sticky: 'right' },
                    ]}
                    rows={filteredBookings}
                    pagination={bookings}
                    tableMinWidth={1950}
                    stickyLastColumn
                    emptyMessage="No cancelled room bookings found."
                    renderRow={(booking) => {
                        const refundedAmount = booking.status === 'refunded' ? booking.notes?.match(/Refund Processed: (\d+)/)?.[1] : null;
                        return (
                            <TableRow key={booking.id} hover>
                                <TableCell sx={{ fontWeight: 700 }}>{booking.id}</TableCell>
                                <TableCell>{formatDate(booking.booking_date)}</TableCell>
                                <TableCell>{formatDate(booking.check_in_date)}</TableCell>
                                <TableCell>{formatDate(booking.check_out_date)}</TableCell>
                                <TableCell><TruncatedValue value={booking.customer ? booking.customer.name : booking.member ? booking.member.full_name : booking.corporateMember?.full_name || 'N/A'} /></TableCell>
                                <TableCell>{booking.member ? booking.member.membership_no : booking.corporateMember ? booking.corporateMember.membership_no : booking.customer ? booking.customer.customer_no : '-'}</TableCell>
                                <TableCell><TruncatedValue value={`${booking.guest_first_name || ''} ${booking.guest_last_name || ''}`.trim() || '-'} /></TableCell>
                                <TableCell>{booking.room?.name || 'N/A'}</TableCell>
                                <TableCell align="right">{booking.persons || 0}</TableCell>
                                <TableCell align="right">{formatAmount(booking.per_day_charge)}</TableCell>
                                <TableCell align="right">{formatAmount(booking.invoice ? booking.invoice.advance_payment || booking.invoice.paid_amount : 0)}</TableCell>
                                <TableCell>{booking.invoice?.payment_method || '-'}</TableCell>
                                <TableCell><TruncatedValue value={booking.invoice?.data?.payment_account || '-'} /></TableCell>
                                <TableCell>
                                    <Box>
                                        <RoomStatusChip status={booking.status} />
                                        {refundedAmount ? (
                                            <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: '#063455', fontWeight: 700 }}>
                                                Refunded: Rs {refundedAmount}
                                            </Typography>
                                        ) : null}
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    <TableActionStack>
                                        <OutlineActionButton label="Undo" onClick={() => handleOpenActionModal(booking, 'undo')} />
                                        {booking.status === 'cancelled' &&
                                        Number(booking.invoice?.advance_payment || booking.invoice?.paid_amount || 0) > 0 &&
                                        (booking.booking_date || booking.created_at) &&
                                        dayjs().diff(dayjs(booking.booking_date || booking.created_at), 'day') <= 2 ? (
                                            <OutlineActionButton label="Return Advance" color="error" onClick={() => handleOpenActionModal(booking, 'refund')} />
                                        ) : null}
                                        <OutlineActionButton label="View" onClick={() => handleOpenInvoice(booking)} />
                                    </TableActionStack>
                                </TableCell>
                            </TableRow>
                        );
                    }}
                />

                <TotalsRow
                    items={[
                        { label: 'Per Day Charge', value: formatAmount(totals.perDayCharge) },
                        { label: 'Security Deposit', value: formatAmount(totals.securityDeposit) },
                    ]}
                />
            </PageShell>

            <BookingInvoiceModal open={showInvoiceModal} onClose={() => setShowInvoiceModal(false)} bookingId={selectedBooking?.id} type="CANCELLATION" />
            <BookingActionModal open={actionModalOpen} onClose={() => setActionModalOpen(false)} booking={selectedActionBooking} action={actionType} onConfirm={handleConfirmAction} />
        </>
    );
};

export default RoomCancelled;
