import { useState } from 'react';
import { router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import AdminLayout from '@/layouts/AdminLayout';
import { Box, Card, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Chip } from '@mui/material';
import { ArrowBack as ArrowBackIcon, Print as PrintIcon, FileDownload as FileDownloadIcon } from '@mui/icons-material';
import Pagination from '@/components/Pagination';

import RoomBookingFilter from '../../Booking/BookingFilter';

const CheckInReport = ({ bookings = {}, filters = {} }) => {
    const bookingList = bookings.data || [];

    const handlePrint = () => {
        const params = new URLSearchParams(window.location.search);
        const printUrl = route('rooms.reports.check-in.print', Object.fromEntries(params));
        window.open(printUrl, '_blank');
    };

    const handleExport = () => {
        const params = new URLSearchParams(window.location.search);
        const exportUrl = route('rooms.reports.check-in.export', Object.fromEntries(params));
        window.location.href = exportUrl;
    };

    const getStatusColor = (status) => {
        const colors = {
            checked_in: 'success',
            completed: 'default',
        };
        return colors[status] || 'default';
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
                            Check-in Report
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

                <RoomBookingFilter routeName="rooms.reports.check-in" showStatus={false} showRoomType={true} showDates={{ booking: false, checkIn: true, checkOut: false }} dateLabels={{ checkIn: 'Check-In Date' }} />

                <Box sx={{ mb: 2 }}>
                    <Chip label={`Total Records: ${bookings.total || 0}`} color="primary" variant="outlined" />
                </Box>

                <Card sx={{ borderRadius: '12px' }}>
                    <TableContainer component={Paper} elevation={0}>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ backgroundColor: '#063455' }}>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Booking No</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Room</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Member / Guest</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Membership No</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Member Type</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Check In Date</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Check In Time</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Status</TableCell>
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
                                    bookingList.map((booking) => (
                                        <TableRow key={booking.id} sx={{ '&:hover': { backgroundColor: '#f5f5f5' } }}>
                                            <TableCell>{booking.booking_no || booking.booking_number || booking.id}</TableCell>
                                            <TableCell>
                                                {booking.room?.name || '-'} <br />
                                                <Typography variant="caption" color="textSecondary">
                                                    {booking.room?.roomType?.name || booking.room?.room_type?.name}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>{getGuestName(booking)}</TableCell>
                                            <TableCell>{getMembershipNo(booking)}</TableCell>
                                            <TableCell>{getMemberType(booking)}</TableCell>
                                            <TableCell>{booking.check_in_date}</TableCell>
                                            <TableCell>{booking.check_in_time || '-'}</TableCell>
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

export default CheckInReport;
