import React, { useMemo, useState } from 'react';
import { router } from '@inertiajs/react';
import { Visibility } from '@mui/icons-material';
import { TableCell, TableRow } from '@mui/material';
import dayjs from 'dayjs';
import { FaEdit } from 'react-icons/fa';
import AdminDataTable from '@/components/App/ui/AdminDataTable';
import BookingInvoiceModal from '@/components/App/Rooms/BookingInvoiceModal';
import ViewDocumentsModal from '@/components/App/Rooms/ViewDocumentsModal';
import RoomOrderHistoryModal from '@/components/App/Rooms/RoomOrderHistoryModal';
import RoomBookingFilter from '../BookingFilter';
import {
    formatAmount,
    formatDate,
    IconActionButton,
    OutlineActionButton,
    PageShell,
    TableActionStack,
    TotalsRow,
    TruncatedValue,
} from '../roomEventListUi';

const RoomCheckOut = ({ bookings }) => {
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [showDocsModal, setShowDocsModal] = useState(false);
    const [selectedBookingForDocs, setSelectedBookingForDocs] = useState(null);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [selectedBookingForHistory, setSelectedBookingForHistory] = useState(null);

    const handleShowHistory = (booking) => {
        setSelectedBookingForHistory(booking);
        setShowHistoryModal(true);
    };

    const handleOpenInvoice = (booking) => {
        setSelectedBooking(booking);
        setShowInvoiceModal(true);
    };

    const handleShowDocs = (booking) => {
        setSelectedBookingForDocs(booking);
        setShowDocsModal(true);
    };

    const handleCloseDocs = () => {
        setShowDocsModal(false);
        setSelectedBookingForDocs(null);
    };

    const totals = useMemo(
        () => ({
            nights: formatAmount((bookings.data || []).reduce((sum, booking) => sum + Number(booking.nights || 1), 0)),
            roomCharges: formatAmount((bookings.data || []).reduce((sum, booking) => sum + Number(booking.room_charge || 0), 0)),
            otherCharges: formatAmount(
                (bookings.data || []).reduce((sum, booking) => sum + Number(booking.other_charges_sum_amount || 0) + Number(booking.mini_bar_items_sum_amount || 0), 0),
            ),
            foodBill: formatAmount(
                (bookings.data || []).reduce((sum, booking) => sum + (booking.orders || []).reduce((orderSum, order) => orderSum + Number(order.total_price || 0), 0), 0),
            ),
            advance: formatAmount((bookings.data || []).reduce((sum, booking) => sum + Number(booking.advance_amount || 0), 0)),
            discount: formatAmount((bookings.data || []).reduce((sum, booking) => sum + Number(booking.discount_value || 0), 0)),
            invoiceTotal: formatAmount(
                (bookings.data || []).reduce((sum, booking) => {
                    const foodBill = (booking.orders || []).reduce((orderSum, order) => orderSum + Number(order.total_price || 0), 0);
                    return sum + Number(booking.grand_total || 0) + foodBill;
                }, 0),
            ),
            paid: formatAmount(
                (bookings.data || []).reduce((sum, booking) => {
                    const paidOrders = (booking.orders || []).filter((order) => order.payment_status === 'paid').reduce((orderSum, order) => orderSum + Number(order.total_price || 0), 0);
                    return sum + Number(booking.invoice?.paid_amount || 0) + paidOrders;
                }, 0),
            ),
            balance: formatAmount(
                (bookings.data || []).reduce((sum, booking) => {
                    const paidOrders = (booking.orders || []).filter((order) => order.payment_status === 'paid').reduce((orderSum, order) => orderSum + Number(order.total_price || 0), 0);
                    const foodBill = (booking.orders || []).reduce((orderSum, order) => orderSum + Number(order.total_price || 0), 0);
                    return sum + Math.max(0, Number(booking.grand_total || 0) + foodBill - (Number(booking.invoice?.paid_amount || 0) + paidOrders));
                }, 0),
            ),
        }),
        [bookings.data],
    );

    return (
        <>
            <PageShell
                eyebrow="Rooms"
                title="Room Check Out"
                subtitle="Finalize stay settlements with the current premium table shell, stronger totals visibility, and a cleaner billing register."
                filterSubtitle="Filter checkout-ready stays by member, room, and check-in or check-out dates."
                filterContent={<RoomBookingFilter embedded routeName="rooms.checkout" showStatus={false} showRoomType showDates={{ booking: false, checkIn: true, checkOut: true }} dateLabels={{ checkIn: 'Check-In Date', checkOut: 'Check-Out Date' }} dateMode={{ checkIn: 'single', checkOut: 'single' }} />}
                tableTitle="Check-Out Register"
                tableSubtitle="Billing-focused checkout grid with premium table styling and preserved document, invoice, and order-history actions."
            >
                <AdminDataTable
                    columns={[
                        { key: 'id', label: 'ID', minWidth: 90 },
                        { key: 'date', label: 'Date', minWidth: 120 },
                        { key: 'guest', label: 'Member / Guest', minWidth: 180, wrap: true },
                        { key: 'membership', label: 'Membership No', minWidth: 140 },
                        { key: 'memberType', label: 'Member Type', minWidth: 130 },
                        { key: 'room', label: 'Room', minWidth: 120 },
                        { key: 'rent', label: 'Rent', minWidth: 100, align: 'right' },
                        { key: 'nights', label: 'Nights', minWidth: 90, align: 'right' },
                        { key: 'roomCharge', label: 'Room Charges', minWidth: 120, align: 'right' },
                        { key: 'other', label: 'Other Charges', minWidth: 120, align: 'right' },
                        { key: 'food', label: 'Food Bill', minWidth: 110, align: 'right' },
                        { key: 'advance', label: 'Advance', minWidth: 100, align: 'right' },
                        { key: 'discount', label: 'Discount', minWidth: 100, align: 'right' },
                        { key: 'invoiceTotal', label: 'Inv Total', minWidth: 110, align: 'right' },
                        { key: 'paid', label: 'Paid', minWidth: 100, align: 'right' },
                        { key: 'account', label: 'Payment Account', minWidth: 150, wrap: true },
                        { key: 'balance', label: 'Balance', minWidth: 100, align: 'right' },
                        { key: 'actions', label: 'Actions', minWidth: 140, sticky: 'right' },
                    ]}
                    rows={bookings.data || []}
                    pagination={bookings}
                    tableMinWidth={2100}
                    stickyLastColumn
                    emptyMessage="No check-out bookings found."
                    renderRow={(booking) => {
                        const roomCharge = Number(booking.room_charge || 0);
                        const foodBill = (booking.orders || []).reduce((sum, order) => sum + Number(order.total_price || 0), 0);
                        const paidOrders = (booking.orders || []).filter((order) => order.payment_status === 'paid').reduce((sum, order) => sum + Number(order.total_price || 0), 0);
                        const invoiceTotal = Number(booking.grand_total || 0) + foodBill;
                        const paid = Number(booking.invoice?.paid_amount || 0) + paidOrders;
                        const balance = Math.max(0, invoiceTotal - paid);
                        const memberType = booking.member ? 'Member' : booking.corporateMember || booking.corporate_member ? 'Corporate' : booking.customer ? 'Guest' : booking.employee ? 'Employee' : 'Unknown';
                        const membershipNo = booking.member ? booking.member.membership_no : booking.corporateMember || booking.corporate_member ? (booking.corporateMember || booking.corporate_member).membership_no : booking.customer ? booking.customer.customer_no : booking.employee?.employee_id || booking.employee?.employee_no || booking.employee?.id || '-';

                        return (
                            <TableRow key={booking.id} hover>
                                <TableCell sx={{ fontWeight: 700 }}>{booking.id}</TableCell>
                                <TableCell>{formatDate(booking.booking_date)}</TableCell>
                                <TableCell><TruncatedValue value={booking.customer ? booking.customer.name : booking.member ? booking.member.full_name : booking.corporateMember || booking.corporate_member ? (booking.corporateMember || booking.corporate_member).full_name : ''} /></TableCell>
                                <TableCell>{membershipNo || '-'}</TableCell>
                                <TableCell>{memberType}</TableCell>
                                <TableCell>{booking.room?.name || '-'}</TableCell>
                                <TableCell align="right">{formatAmount(booking.per_day_charge)}</TableCell>
                                <TableCell align="right">{booking.nights || 1}</TableCell>
                                <TableCell align="right">{formatAmount(roomCharge)}</TableCell>
                                <TableCell align="right">{formatAmount(booking.total_other_charges)}</TableCell>
                                <TableCell align="right">{formatAmount(foodBill)}</TableCell>
                                <TableCell align="right">{formatAmount(booking.advance_amount)}</TableCell>
                                <TableCell align="right">{formatAmount(booking.discount_value)}</TableCell>
                                <TableCell align="right">{formatAmount(invoiceTotal)}</TableCell>
                                <TableCell align="right" sx={{ color: '#0e5f3c', fontWeight: 700 }}>{formatAmount(paid)}</TableCell>
                                <TableCell><TruncatedValue value={booking.invoice?.payment_account || booking.invoice?.data?.payment_account || '-'} /></TableCell>
                                <TableCell align="right" sx={{ color: '#b42318', fontWeight: 700 }}>{formatAmount(balance)}</TableCell>
                                <TableCell>
                                    <TableActionStack>
                                        <IconActionButton title="View Documents" onClick={() => handleShowDocs(booking)}>
                                            <Visibility fontSize="small" />
                                        </IconActionButton>
                                        <IconActionButton title="Edit Booking" onClick={() => router.visit(route('rooms.edit.booking', { id: booking.id }))} color="#f57c00">
                                            <FaEdit size={16} />
                                        </IconActionButton>
                                        <OutlineActionButton label="View" onClick={() => handleOpenInvoice(booking)} />
                                        <OutlineActionButton label="Orders" onClick={() => handleShowHistory(booking)} />
                                    </TableActionStack>
                                </TableCell>
                            </TableRow>
                        );
                    }}
                />

                <TotalsRow
                    items={[
                        { label: 'Nights', value: totals.nights },
                        { label: 'Room Charges', value: totals.roomCharges },
                        { label: 'Other Charges', value: totals.otherCharges },
                        { label: 'Food Bill', value: totals.foodBill },
                        { label: 'Advance', value: totals.advance },
                        { label: 'Discount', value: totals.discount },
                        { label: 'Inv Total', value: totals.invoiceTotal },
                        { label: 'Paid', value: totals.paid },
                        { label: 'Balance', value: totals.balance },
                    ]}
                />
            </PageShell>

            <BookingInvoiceModal open={showInvoiceModal} onClose={() => setShowInvoiceModal(false)} bookingId={selectedBooking?.id} type="CHECK_OUT" />
            <ViewDocumentsModal open={showDocsModal} onClose={handleCloseDocs} bookingId={selectedBookingForDocs?.id} />
            <RoomOrderHistoryModal
                open={showHistoryModal}
                onClose={() => {
                    setShowHistoryModal(false);
                    setSelectedBookingForHistory(null);
                }}
                bookingId={selectedBookingForHistory?.id}
            />
        </>
    );
};

export default RoomCheckOut;
