import { useState } from 'react';
import { router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import AdminLayout from '@/layouts/AdminLayout';
import { Box, Card, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Chip } from '@mui/material';
import { ArrowBack as ArrowBackIcon, Print as PrintIcon, FileDownload as FileDownloadIcon } from '@mui/icons-material';
import Pagination from '@/components/Pagination';

import RoomBookingFilter from '../../Booking/BookingFilter';

const MemberWiseReport = ({ bookings = {}, filters = {} }) => {
    const bookingList = bookings.data || [];

    const handlePrint = () => {
        const params = new URLSearchParams(window.location.search);
        const printUrl = route('rooms.reports.member-wise.print', Object.fromEntries(params));
        window.open(printUrl, '_blank');
    };

    const handleExport = () => {
        const params = new URLSearchParams(window.location.search);
        const exportUrl = route('rooms.reports.member-wise.export', Object.fromEntries(params));
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

    const getGuestId = (booking) => {
        if (booking.customer) return booking.customer.customer_no || 'Guest';
        if (booking.member) return booking.member.membership_no;
        if (booking.corporateMember) return booking.corporateMember.membership_no;
        return '';
    };

    return (
        <AdminLayout>
            <Box sx={{ bgcolor: '#f5f5f5', minHeight: '100vh', p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <IconButton onClick={() => router.visit(route('rooms.reports'))}>
                            <ArrowBackIcon sx={{ color: '#063455' }} />
                        </IconButton>
                        <Typography sx={{ color: '#063455', fontWeight: 700, fontSize:'30px' }}>
                            Member-wise Report
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button 
                        variant="outlined" 
                        startIcon={<FileDownloadIcon />} 
                        onClick={handleExport} 
                        sx={{ bgcolor:'#063455', color: '#fff', borderRadius:'16px', textTransform:'none' }}>
                            Export
                        </Button>
                        <Button 
                        variant="outlined" 
                        startIcon={<PrintIcon />} 
                        onClick={handlePrint} 
                        sx={{ bgcolor:'#063455', color: '#fff', borderRadius:'16px', textTransform:'none' }}>
                            Print
                        </Button>
                    </Box>
                </Box>

                <RoomBookingFilter routeName="rooms.reports.member-wise" showStatus={true} showRoomType={true} showDates={{ booking: false, checkIn: true, checkOut: false }} dateLabels={{ checkIn: 'Check-In Date' }} />

                <Box sx={{ mb: 2 }}>
                    <Chip label={`Total Records: ${bookings.total || 0}`} color="primary" variant="outlined" />
                </Box>

                <Card sx={{ borderRadius: '12px' }}>
                    <TableContainer component={Paper} elevation={0}>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ backgroundColor: '#063455' }}>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Booking No</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Member / Guest</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Check In</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Checkout</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Room</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Charges</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Status</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {bookingList.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                                            <Typography color="textSecondary">No data found. Try searching for a member.</Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    bookingList.map((booking) => (
                                        <TableRow key={booking.id} sx={{ '&:hover': { backgroundColor: '#f5f5f5' } }}>
                                            <TableCell sx={{ fontWeight: 500 }}>{booking.booking_no || booking.booking_number}</TableCell>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight={500}>
                                                    {getGuestName(booking)}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {getGuestId(booking)}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>{booking.check_in_date}</TableCell>
                                            <TableCell>{booking.check_out_date}</TableCell>
                                            <TableCell>
                                                {booking.room?.roomBooking_number} <br />
                                                <Typography variant="caption" color="text.secondary">
                                                    {booking.room?.name} ({booking.room?.roomType?.name})
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                                        Total: {Number(booking.grand_total).toFixed(2)}
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ color: 'success.main' }}>
                                                        Paid: {Number(booking.invoice?.paid_amount || 0).toFixed(2)}
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ color: 'error.main' }}>
                                                        Due: {Number(Number(booking.grand_total) - Number(booking.invoice?.paid_amount || 0)).toFixed(2)}
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Chip label={booking.status} size="small" color={getStatusColor(booking.status)} />
                                            </TableCell>
                                        </TableRow>
                                    ))
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

export default MemberWiseReport;
