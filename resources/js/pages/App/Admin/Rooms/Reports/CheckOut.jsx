import { router } from '@inertiajs/react';
import { useState } from 'react';
import { route } from 'ziggy-js';
import AdminLayout from '@/layouts/AdminLayout';
import { Box, Card, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableFooter, Paper, IconButton, Chip, Tooltip } from '@mui/material';
import { ArrowBack as ArrowBackIcon, Print as PrintIcon, FileDownload as FileDownloadIcon } from '@mui/icons-material';
import Pagination from '@/components/Pagination';
import dayjs from 'dayjs';

import RoomBookingFilter from '../../Booking/BookingFilter';
import BookingInvoiceModal from '@/components/App/Rooms/BookingInvoiceModal';

const CheckOutReport = ({ bookings = {}, filters = {} }) => {
    const bookingList = bookings.data || [];
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const [selectedBookingId, setSelectedBookingId] = useState(null);

    const handlePrint = () => {
        const params = new URLSearchParams(window.location.search);
        const printUrl = route('rooms.reports.check-out.print', Object.fromEntries(params));
        window.open(printUrl, '_blank');
    };

    const handleExport = () => {
        const params = new URLSearchParams(window.location.search);
        const exportUrl = route('rooms.reports.check-out.export', Object.fromEntries(params));
        window.location.href = exportUrl;
    };

    const getGuestName = (booking) => {
        if (booking.customer) return booking.customer.name;
        if (booking.member) return booking.member.full_name;
        if (booking.corporateMember) return booking.corporateMember.full_name;
        if (booking.corporate_member) return booking.corporate_member.full_name;
        return 'Unknown';
    };

    const getMemberType = (booking) => {
        if (booking.member) return 'Member';
        if (booking.corporateMember || booking.corporate_member) return 'Corporate';
        if (booking.customer) return 'Guest';
        if (booking.employee) return 'Employee';
        return 'Unknown';
    };

    const getMembershipNo = (booking) => {
        if (booking.member) return booking.member.membership_no;
        if (booking.corporateMember) return booking.corporateMember.membership_no;
        if (booking.corporate_member) return booking.corporate_member.membership_no;
        if (booking.customer) return booking.customer.customer_no;
        if (booking.employee) return booking.employee.employee_id || booking.employee.employee_no || booking.employee.id;
        return '-';
    };

    return (
        <AdminLayout>
            <Box sx={{ bgcolor: '#f5f5f5', minHeight: '100vh', p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <IconButton onClick={() => router.visit(route('rooms.reports'))}>
                            <ArrowBackIcon sx={{ color: '#063455' }} />
                        </IconButton>
                        <Typography sx={{ color: '#063455', fontWeight: 700, fontSize: '30px' }}>
                            Check-out Report
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button
                            variant="outlined"
                            startIcon={<FileDownloadIcon />}
                            onClick={handleExport}
                            sx={{ bgcolor: '#063455', color: '#fff', borderRadius: '16px', textTransform: 'none' }}>
                            Export
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<PrintIcon />}
                            onClick={handlePrint}
                            sx={{ bgcolor: '#063455', color: '#fff', borderRadius: '16px', textTransform: 'none' }}>
                            Print
                        </Button>
                    </Box>
                </Box>

                <RoomBookingFilter
                    routeName="rooms.reports.check-out"
                    showStatus={false}
                    showRoomType={true}
                    showDates={{ booking: false, checkIn: true, checkOut: true }}
                    dateLabels={{ checkIn: 'Check-In Date', checkOut: 'Check-Out Date' }}
                    dateMode={{ checkIn: 'single', checkOut: 'single' }}
                />

                <Box sx={{ mb: 2 }}>
                    <Chip label={`Total Records: ${bookings.total || 0}`} color="primary" variant="outlined" />
                </Box>

                <Card sx={{ borderRadius: '12px' }}>
                    <TableContainer component={Paper} elevation={0}>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ backgroundColor: '#063455' }}>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600, whiteSpace: 'nowrap' }}>ID</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600, whiteSpace: 'nowrap' }}>Check-In Date</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600, whiteSpace: 'nowrap' }}>Check-Out Date</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600, whiteSpace: 'nowrap' }}>Member / Guest</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600, whiteSpace: 'nowrap' }}>Membership No</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600, whiteSpace: 'nowrap' }}>Member Type</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600, whiteSpace: 'nowrap' }}>Room</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600, whiteSpace: 'nowrap' }}>Rent</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600, whiteSpace: 'nowrap' }}>Nights</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600, whiteSpace: 'nowrap' }}>Room Charges</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600, whiteSpace: 'nowrap' }}>Other Charges</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600, whiteSpace: 'nowrap' }}>Food Bill</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600, whiteSpace: 'nowrap' }}>Advance</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600, whiteSpace: 'nowrap' }}>Discount</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600, whiteSpace: 'nowrap' }}>Inv Total</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600, whiteSpace: 'nowrap' }}>Paid</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600, whiteSpace: 'nowrap' }}>Balance</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600, whiteSpace: 'nowrap' }}>Invoice</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {bookingList.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={18} align="center" sx={{ py: 4 }}>
                                            <Typography color="textSecondary">No data found</Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    bookingList.map((booking) => {
                                        const roomCharge = parseFloat(booking.room_charge || 0);
                                        const foodBill = (booking.orders || []).reduce((sum, order) => sum + parseFloat(order.total_price || 0), 0);
                                        const advance = parseFloat(booking.advance_amount || 0);
                                        const discount = parseFloat(booking.discount_value || 0);
                                        const paidOrdersSum = (booking.orders || []).filter((o) => o.payment_status === 'paid').reduce((sum, order) => sum + parseFloat(order.total_price || 0), 0);

                                        const invoiceTotal = parseFloat(booking.grand_total || 0) + foodBill;
                                        const paid = parseFloat(booking.invoice?.paid_amount || 0) + paidOrdersSum;
                                        const balance = Math.max(0, invoiceTotal - paid);

                                        const guestName = getGuestName(booking);

                                        return (
                                            <TableRow key={booking.id} sx={{ '&:hover': { backgroundColor: '#f5f5f5' } }}>
                                                <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{booking.id}</TableCell>
                                                <TableCell sx={{ color: '#7F7F7F', whiteSpace: 'nowrap' }}>{booking.check_in_date ? dayjs(booking.check_in_date).format('DD-MM-YYYY') : ''}</TableCell>
                                                <TableCell sx={{ color: '#7F7F7F', whiteSpace: 'nowrap' }}>{booking.check_out_date ? dayjs(booking.check_out_date).format('DD-MM-YYYY') : ''}</TableCell>
                                                <TableCell sx={{ color: '#7F7F7F', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    <Tooltip title={guestName} arrow>
                                                        <span>{guestName}</span>
                                                    </Tooltip>
                                                </TableCell>
                                                <TableCell sx={{ color: '#7F7F7F', whiteSpace: 'nowrap' }}>{getMembershipNo(booking)}</TableCell>
                                                <TableCell sx={{ color: '#7F7F7F', whiteSpace: 'nowrap' }}>{getMemberType(booking)}</TableCell>
                                                <TableCell sx={{ color: '#7F7F7F', whiteSpace: 'nowrap' }}>{booking.room?.name}</TableCell>
                                                <TableCell sx={{ color: '#7F7F7F', whiteSpace: 'nowrap' }}>{Math.round(booking.per_day_charge || 0)}</TableCell>
                                                <TableCell sx={{ color: '#7F7F7F', whiteSpace: 'nowrap' }}>{booking.nights || 1}</TableCell>
                                                <TableCell sx={{ color: '#7F7F7F', whiteSpace: 'nowrap' }}>{Math.round(roomCharge)}</TableCell>
                                                <TableCell sx={{ color: '#7F7F7F', whiteSpace: 'nowrap' }}>{Math.round(booking.total_other_charges || 0)}</TableCell>
                                                <TableCell sx={{ color: '#7F7F7F', whiteSpace: 'nowrap' }}>{Math.round(foodBill)}</TableCell>
                                                <TableCell sx={{ color: '#7F7F7F', whiteSpace: 'nowrap' }}>{Math.round(advance)}</TableCell>
                                                <TableCell sx={{ color: '#7F7F7F', whiteSpace: 'nowrap' }}>{Math.round(discount)}</TableCell>
                                                <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{Math.round(invoiceTotal)}</TableCell>
                                                <TableCell sx={{ fontWeight: 600, color: 'green', whiteSpace: 'nowrap' }}>{Math.round(paid)}</TableCell>
                                                <TableCell sx={{ fontWeight: 600, color: 'red', whiteSpace: 'nowrap' }}>{Math.round(balance)}</TableCell>
                                                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => {
                                                            setSelectedBookingId(booking.id);
                                                            setShowInvoiceModal(true);
                                                        }}
                                                        sx={{ color: '#063455' }}
                                                    >
                                                        <PrintIcon fontSize="small" />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                            {bookingList.length > 0 && (
                                <TableFooter>
                                    <TableRow sx={{ backgroundColor: '#f0f0f0' }}>
                                        <TableCell colSpan={8} sx={{ fontWeight: 'bold' }}>
                                            Grand Total
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>{Math.round(bookingList.reduce((sum, b) => sum + (b.nights || 1), 0))}</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>{Math.round(bookingList.reduce((sum, b) => sum + parseFloat(b.room_charge || 0), 0))}</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>{Math.round(bookingList.reduce((sum, b) => sum + (parseFloat(b.other_charges_sum_amount || 0) + parseFloat(b.mini_bar_items_sum_amount || 0)), 0))}</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>{Math.round(bookingList.reduce((sum, b) => sum + (b.orders || []).reduce((s, o) => s + parseFloat(o.total_price || 0), 0), 0))}</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>{Math.round(bookingList.reduce((sum, b) => sum + parseFloat(b.advance_amount || 0), 0))}</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>{Math.round(bookingList.reduce((sum, b) => sum + parseFloat(b.discount_value || 0), 0))}</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>
                                            {Math.round(
                                                bookingList.reduce((sum, b) => {
                                                    const fb = (b.orders || []).reduce((s, o) => s + parseFloat(o.total_price || 0), 0);
                                                    return sum + parseFloat(b.grand_total || 0) + fb;
                                                }, 0),
                                            )}
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', color: 'green' }}>
                                            {Math.round(
                                                bookingList.reduce((sum, b) => {
                                                    const paidOrders = (b.orders || []).filter((o) => o.payment_status === 'paid').reduce((s, o) => s + parseFloat(o.total_price || 0), 0);
                                                    return sum + parseFloat(b.invoice?.paid_amount || 0) + paidOrders;
                                                }, 0),
                                            )}
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', color: 'red' }}>
                                            {Math.round(
                                                bookingList.reduce((sum, b) => {
                                                    const paidOrdersSum = (b.orders || []).filter((o) => o.payment_status === 'paid').reduce((s, o) => s + parseFloat(o.total_price || 0), 0);
                                                    const pd = parseFloat(b.invoice?.paid_amount || 0) + paidOrdersSum;
                                                    const fb = (b.orders || []).reduce((s, o) => s + parseFloat(o.total_price || 0), 0);
                                                    return sum + Math.max(0, parseFloat(b.grand_total || 0) + fb - pd);
                                                }, 0),
                                            )}
                                        </TableCell>
                                        <TableCell />
                                    </TableRow>
                                </TableFooter>
                            )}
                        </Table>
                    </TableContainer>
                </Card>

                <Pagination data={bookings} />
            </Box>

            <BookingInvoiceModal
                open={showInvoiceModal}
                onClose={() => {
                    setShowInvoiceModal(false);
                    setSelectedBookingId(null);
                }}
                bookingId={selectedBookingId}
                type="ROOM_BOOKING"
            />
        </AdminLayout>
    );
};

export default CheckOutReport;
