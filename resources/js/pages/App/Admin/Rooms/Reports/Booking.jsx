import { useState } from 'react';
import { router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import AdminLayout from '@/layouts/AdminLayout';
import { Box, Card, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Chip } from '@mui/material';
import { ArrowBack as ArrowBackIcon, Print as PrintIcon, FileDownload as FileDownloadIcon } from '@mui/icons-material';
import Pagination from '@/components/Pagination';
import dayjs from 'dayjs';

import RoomBookingFilter from '../../Booking/BookingFilter';

const BookingReport = ({ bookings = {}, filters = {} }) => {
    const bookingList = bookings.data || [];

    const handlePrint = () => {
        const params = new URLSearchParams(window.location.search);
        const printUrl = route('rooms.reports.booking.print', Object.fromEntries(params));
        window.open(printUrl, '_blank');
    };

    const handleExport = () => {
        const params = new URLSearchParams(window.location.search);
        const exportUrl = route('rooms.reports.booking.export', Object.fromEntries(params));
        window.location.href = exportUrl;
    };

    const getStatusColor = (status) => {
        const colors = {
            confirmed: 'primary',
            checked_in: 'success',
            checked_out: 'default',
            cancelled: 'error',
            refunded: 'warning',
            completed: 'success',
            pending: 'warning',
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
                            Booking Report
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

                <RoomBookingFilter routeName="rooms.reports.booking" showStatus={true} showRoomType={true} showDates={{ booking: false, checkIn: true, checkOut: false }} dateLabels={{ checkIn: 'Check-In Date' }} />

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
                                    <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Booking No</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Room</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Guest</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Check In</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Check Out</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Status</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Total</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Paid</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Due</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {bookingList.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                                            <Typography color="textSecondary">No data found</Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    bookingList.map((booking) => {
                                        const total = parseFloat(booking.grand_total || booking.invoice?.total_price || 0);
                                        const paidCash = parseFloat(booking.invoice?.paid_amount || 0);
                                        const advance = parseFloat(booking.invoice?.advance_payment || 0);
                                        const paid = paidCash + advance;
                                        const due = ['cancelled', 'refunded'].includes(booking.status) ? 0 : Math.max(0, total - paid);
                                        return (
                                            <TableRow key={booking.id} sx={{ '&:hover': { backgroundColor: '#f5f5f5' } }}>
                                                <TableCell>{booking.booking_no || booking.id}</TableCell>
                                                <TableCell>
                                                    {booking.room?.name} <br />
                                                    <Typography variant="caption" color="textSecondary">
                                                        {booking.room?.roomType?.name}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>{getGuestName(booking)}</TableCell>
                                                <TableCell>{booking.check_in_date ? dayjs(booking.check_in_date).format('DD-MM-YYYY') : '-'}</TableCell>
                                                <TableCell>{booking.check_out_date ? dayjs(booking.check_out_date).format('DD-MM-YYYY') : '-'}</TableCell>
                                                <TableCell>
                                                    <Chip label={booking.status} size="small" color={getStatusColor(booking.status)} />
                                                </TableCell>
                                                <TableCell>{total.toFixed(2)}</TableCell>
                                                <TableCell sx={{ color: 'success.main', fontWeight: 500 }}>{paid.toFixed(2)}</TableCell>
                                                <TableCell sx={{ color: 'error.main', fontWeight: 500 }}>{due.toFixed(2)}</TableCell>
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

export default BookingReport;
