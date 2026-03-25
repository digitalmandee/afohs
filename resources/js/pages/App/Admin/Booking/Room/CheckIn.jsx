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
    RoomStatusChip,
    TableActionStack,
    TotalsRow,
    TruncatedValue,
} from '../roomEventListUi';

const RoomCheckIn = ({ bookings }) => {
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
        () =>
            (bookings.data || []).reduce(
                (acc, booking) => {
                    acc.perDayCharge += Number(booking.per_day_charge || 0);
                    acc.securityDeposit += Number(booking.security_deposit || 0);
                    acc.advancePaid += Number(booking.advance_amount || 0);
                    return acc;
                },
                { perDayCharge: 0, securityDeposit: 0, advancePaid: 0 },
            ),
        [bookings.data],
    );

    return (
        <>
            <PageShell
                eyebrow="Rooms"
                title="Room Check In"
                subtitle="Register arrivals in the current admin shell with live filters, premium tables, and preserved check-out follow-up actions."
                filterSubtitle="Track arriving guests by booking date, stay dates, member details, and room selection."
                filterContent={<RoomBookingFilter embedded routeName="rooms.checkin" showStatus={false} showRoomType showDates={{ booking: true, checkIn: true, checkOut: true }} />}
                tableTitle="Check-In Register"
                tableSubtitle="Operational check-in list with linked documents, order history, and a cleaner action row."
            >
                <AdminDataTable
                    columns={[
                        { key: 'id', label: 'ID', minWidth: 90 },
                        { key: 'bookingDate', label: 'Booking Date', minWidth: 130 },
                        { key: 'checkIn', label: 'Check-In', minWidth: 120 },
                        { key: 'checkOut', label: 'Check-Out', minWidth: 120 },
                        { key: 'guest', label: 'Member / Guest', minWidth: 180, wrap: true },
                        { key: 'membership', label: 'Membership No', minWidth: 140 },
                        { key: 'memberType', label: 'Member Type', minWidth: 130 },
                        { key: 'occupiedBy', label: 'Occupied By', minWidth: 150, wrap: true },
                        { key: 'room', label: 'Room', minWidth: 140 },
                        { key: 'persons', label: 'Persons', minWidth: 90, align: 'right' },
                        { key: 'perDay', label: 'Per Day Charge', minWidth: 130, align: 'right' },
                        { key: 'deposit', label: 'Security Deposit', minWidth: 140, align: 'right' },
                        { key: 'advance', label: 'Advance Paid', minWidth: 120, align: 'right' },
                        { key: 'paymentMode', label: 'Payment Mode', minWidth: 130 },
                        { key: 'paymentAccount', label: 'Payment Account', minWidth: 160, wrap: true },
                        { key: 'status', label: 'Status', minWidth: 120 },
                        { key: 'actions', label: 'Actions', minWidth: 140, sticky: 'right' },
                    ]}
                    rows={bookings.data || []}
                    pagination={bookings}
                    tableMinWidth={1980}
                    stickyLastColumn
                    emptyMessage="No check-in bookings found."
                    renderRow={(booking) => (
                        <TableRow key={booking.id} hover>
                            <TableCell sx={{ fontWeight: 700 }}>{booking.id}</TableCell>
                            <TableCell>{formatDate(booking.booking_date)}</TableCell>
                            <TableCell>{formatDate(booking.check_in_date)}</TableCell>
                            <TableCell>{formatDate(booking.check_out_date)}</TableCell>
                            <TableCell>
                                <TruncatedValue value={booking.customer ? booking.customer.name : booking.member ? booking.member.full_name : booking.corporateMember || booking.corporate_member ? (booking.corporateMember || booking.corporate_member).full_name : ''} />
                            </TableCell>
                            <TableCell>{booking.member ? booking.member.membership_no : booking.corporateMember || booking.corporate_member ? (booking.corporateMember || booking.corporate_member).membership_no : booking.customer ? booking.customer.customer_no : '-'}</TableCell>
                            <TableCell>{booking.member ? 'Member' : booking.corporateMember || booking.corporate_member ? 'Corporate' : booking.customer ? 'Guest' : booking.employee ? 'Employee' : 'Unknown'}</TableCell>
                            <TableCell><TruncatedValue value={`${booking.guest_first_name || ''} ${booking.guest_last_name || ''}`.trim() || '-'} /></TableCell>
                            <TableCell>{booking.room?.name || '-'}</TableCell>
                            <TableCell align="right">{booking.persons || 0}</TableCell>
                            <TableCell align="right">{formatAmount(booking.per_day_charge)}</TableCell>
                            <TableCell align="right">{formatAmount(booking.security_deposit)}</TableCell>
                            <TableCell align="right">{formatAmount(booking.advance_amount)}</TableCell>
                            <TableCell>{booking.invoice?.payment_method || '-'}</TableCell>
                            <TableCell><TruncatedValue value={booking.invoice?.payment_account || booking.invoice?.data?.payment_account || '-'} /></TableCell>
                            <TableCell><RoomStatusChip status={booking.status} /></TableCell>
                            <TableCell>
                                <TableActionStack>
                                    <IconActionButton title="View Documents" onClick={() => handleShowDocs(booking)}>
                                        <Visibility fontSize="small" />
                                    </IconActionButton>
                                    <IconActionButton title="Edit Booking" onClick={() => router.visit(route('rooms.edit.booking', { id: booking.id }))} color="#f57c00">
                                        <FaEdit size={16} />
                                    </IconActionButton>
                                    <OutlineActionButton label="Check Out" onClick={() => router.visit(route('rooms.edit.booking', { id: booking.id, type: 'checkout' }))} />
                                    <OutlineActionButton label="Orders" onClick={() => handleShowHistory(booking)} />
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
                    ]}
                />
            </PageShell>

            <BookingInvoiceModal open={showInvoiceModal} onClose={() => setShowInvoiceModal(false)} bookingId={selectedBooking?.id} type="CHECK_IN" />
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

export default RoomCheckIn;
