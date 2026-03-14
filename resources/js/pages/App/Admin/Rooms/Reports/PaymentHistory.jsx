import { useState } from 'react';
import { router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import AdminLayout from '@/layouts/AdminLayout';
import { Box, Card, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Chip } from '@mui/material';
import { ArrowBack as ArrowBackIcon, Print as PrintIcon, FileDownload as FileDownloadIcon } from '@mui/icons-material';
import Pagination from '@/components/Pagination';

import RoomBookingFilter from '../../Booking/BookingFilter';

const PaymentHistoryReport = ({ bookings = {}, filters = {} }) => {
    // bookings is paginated
    const bookingList = bookings.data || [];

    const handlePrint = () => {
        const params = new URLSearchParams(window.location.search);
        const printUrl = route('rooms.reports.payment-history.print', Object.fromEntries(params));
        window.open(printUrl, '_blank');
    };

    const handleExport = () => {
        const params = new URLSearchParams(window.location.search);
        const exportUrl = route('rooms.reports.payment-history.export', Object.fromEntries(params));
        window.location.href = exportUrl;
    };

    const getStatusColor = (status) => {
        const colors = {
            paid: 'success',
            unpaid: 'error',
        };
        return colors[status] || 'default';
    };

    const getGuestName = (booking) => {
        if (booking.customer) return booking.customer.name;
        if (booking.member) return booking.member.full_name;
        if (booking.corporateMember) return booking.corporateMember.full_name;
        return 'Unknown';
    };

    return (
        <AdminLayout>
            <Box sx={{ bgcolor: '#f5f5f5', minHeight: '100vh', p: 3 }}>
                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <IconButton onClick={() => router.visit(route('rooms.reports'))}>
                            <ArrowBackIcon sx={{ color: '#063455' }} />
                        </IconButton>
                        <Typography sx={{ color: '#063455', fontWeight: 700, fontSize: '30px' }}>
                            Room-wise Payment History
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

                <RoomBookingFilter routeName="rooms.reports.payment-history" showStatus={true} showRoomType={true} showDates={{ booking: false, checkIn: true, checkOut: false }} dateLabels={{ checkIn: 'Check-In Date' }} />

                {/* Results Summary */}
                <Box sx={{ mb: 2 }}>
                    <Chip label={`Total Records: ${bookings.total || 0}`} color="primary" variant="outlined" />
                </Box>

                {/* Table */}
                <Card sx={{ borderRadius: '12px' }}>
                    <TableContainer component={Paper} elevation={0}>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ backgroundColor: '#063455' }}>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Invoice No</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Booking No</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Room</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Guest</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Total Amount</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Paid Amount</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Balance</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Payment Status</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {bookingList.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                                            <Typography color="textSecondary">No data found</Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    bookingList.map((booking) => {
                                        const invoice = booking.invoice;
                                        // Use grand_total from booking if invoice total is not reliable, or use invoice total
                                        const total = parseFloat(booking.grand_total || 0);
                                        const paid = parseFloat(invoice ? invoice.paid_amount : 0);
                                        const balance = total - paid;
                                        const status = balance <= 0 ? (total > 0 ? 'paid' : 'unpaid') : 'unpaid';

                                        return (
                                            <TableRow key={booking.id} sx={{ '&:hover': { backgroundColor: '#f5f5f5' } }}>
                                                <TableCell>{invoice ? invoice.invoice_no : '-'}</TableCell>
                                                <TableCell>{booking.booking_no || booking.booking_number}</TableCell>
                                                <TableCell>{booking.room?.name}</TableCell>
                                                <TableCell>{getGuestName(booking)}</TableCell>
                                                <TableCell>{total.toFixed(2)}</TableCell>
                                                <TableCell sx={{ color: 'success.main' }}>{paid.toFixed(2)}</TableCell>
                                                <TableCell sx={{ color: 'error.main' }}>{balance.toFixed(2)}</TableCell>
                                                <TableCell>
                                                    <Chip label={status.toUpperCase()} size="small" color={getStatusColor(status)} />
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Card>

                <Pagination data={bookings} />
            </Box>
        </AdminLayout>
    );
};

export default PaymentHistoryReport;
