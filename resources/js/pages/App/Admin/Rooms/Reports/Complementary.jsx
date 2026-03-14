import { useState } from 'react';
import { router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import AdminLayout from '@/layouts/AdminLayout';
import { Box, Card, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Chip } from '@mui/material';
import { ArrowBack as ArrowBackIcon, Print as PrintIcon, FileDownload as FileDownloadIcon } from '@mui/icons-material';
import Pagination from '@/components/Pagination';

import RoomBookingFilter from '../../Booking/BookingFilter';

const ComplementaryReport = ({ items = {}, filters = {} }) => {
    const itemList = items.data || [];

    const handlePrint = () => {
        const params = new URLSearchParams(window.location.search);
        const printUrl = route('rooms.reports.complementary.print', Object.fromEntries(params));
        window.open(printUrl, '_blank');
    };

    const handleExport = () => {
        const params = new URLSearchParams(window.location.search);
        const exportUrl = route('rooms.reports.complementary.export', Object.fromEntries(params));
        window.location.href = exportUrl;
    };

    const getGuestName = (booking) => {
        if (!booking) return '-';
        if (booking.customer) return booking.customer.name;
        if (booking.member) return booking.member.full_name;
        if (booking.corporateMember) return booking.corporateMember.full_name;
        return 'Unknown';
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
                            Complementary Items Report
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

                <RoomBookingFilter routeName="rooms.reports.complementary" showStatus={true} showRoomType={true} showDates={{ booking: true, checkIn: false, checkOut: false }} dateLabels={{ booking: 'Date Range' }} />

                <Box sx={{ mb: 2 }}>
                    <Chip label={`Total Records: ${items.total || 0}`} color="primary" variant="outlined" />
                </Box>

                <Card sx={{ borderRadius: '12px' }}>
                    <TableContainer component={Paper} elevation={0}>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ backgroundColor: '#063455' }}>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Date</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Room</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Guest</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Description</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Amount</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {itemList.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                                            <Typography color="textSecondary">No data found</Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    itemList.map((item) => (
                                        <TableRow key={item.id} sx={{ '&:hover': { backgroundColor: '#f5f5f5' } }}>
                                            <TableCell>{item.created_at ? new Date(item.created_at).toLocaleDateString() : '-'}</TableCell>
                                            <TableCell>
                                                {item.room_booking?.room?.name} ({item.room_booking?.room?.room_type?.name})
                                            </TableCell>
                                            <TableCell>{getGuestName(item.room_booking)}</TableCell>
                                            <TableCell>{item.details}</TableCell>
                                            <TableCell>{item.amount}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Card>

                <Pagination data={items} />
            </Box>
        </AdminLayout>
    );
};

export default ComplementaryReport;
