import { useState } from 'react';
import { router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import AdminLayout from '@/layouts/AdminLayout';
import { Box, Card, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Chip } from '@mui/material';
import { ArrowBack as ArrowBackIcon, Print as PrintIcon, FileDownload as FileDownloadIcon } from '@mui/icons-material';
import Pagination from '@/components/Pagination';

import RoomBookingFilter from '../../Booking/BookingFilter';

const MiniBarReport = ({ items = {}, filters = {} }) => {
    const itemList = items.data || [];

    const handlePrint = () => {
        const params = new URLSearchParams(window.location.search);
        const printUrl = route('rooms.reports.mini-bar.print', Object.fromEntries(params));
        window.open(printUrl, '_blank');
    };

    const handleExport = () => {
        const params = new URLSearchParams(window.location.search);
        const exportUrl = route('rooms.reports.mini-bar.export', Object.fromEntries(params));
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
                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <IconButton onClick={() => router.visit(route('rooms.reports'))}>
                            <ArrowBackIcon sx={{ color: '#063455' }} />
                        </IconButton>
                        <Typography sx={{ color: '#063455', fontWeight: 700, fontSize: '30px' }}>
                            Mini-bar Usage Report
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

                {/* Filters */}
                {/* Note: MiniBar report supports date_from/date_to which maps to 'checkIn' style dates or 'booking' dates in Filter?
                    Controller uses date_from/date_to manual variables, not 'check_in_from'.
                    However, RoomBookingFilter sends check_in_from / booking_date_from.

                    Wait, RoomReportController.miniBar uses:
                    $dateFrom = $request->date_from ?? ...

                    But RoomBookingFilter sends:
                    booking_date_from / booking_date_to (if booking=true)
                    check_in_from / check_in_to (if checkIn=true)

                    I previously refactored Controller to use applyFilters implicitly for RoomBooking, but the main date filter for ITEMS is created_at of the item.

                    Let's allow RoomBookingFilter to control 'created_at' of ITEMS? No, RoomBookingFilter is for BOOKING.

                    Actually, for MiniBar, we might want to filter by Item Date.
                    RoomBookingFilter 'showDates' prop allows keys: 'booking', 'checkIn', 'checkOut'.
                    If we use 'booking' date filter, it sends 'booking_date_from'.

                    I should update RoomReportController::miniBar to accept 'booking_date_from' as the ITEM date filter if 'date_from' is missing, OR configure Filter to send 'date_from'.
                    RoomBookingFilter is standardized. It sends 'booking_date_from'.

                    Let's update RoomReportController to use 'booking_date_from' if present for the ITEM date, effectively treating "Booking Date" filter as "Date" filter for this report.

                    In RoomReportController::miniBar:
                    $dateFrom = $request->date_from ?? $request->booking_date_from ?? ...
                */}

                <RoomBookingFilter routeName="rooms.reports.mini-bar" showStatus={true} showRoomType={true} showDates={{ booking: true, checkIn: false, checkOut: false }} dateLabels={{ booking: 'Date Range' }} />

                {/* Results Summary */}
                <Box sx={{ mb: 2 }}>
                    <Chip label={`Total Records: ${items.total || 0}`} color="primary" variant="outlined" />
                </Box>

                {/* Table */}
                <Card sx={{ borderRadius: '12px' }}>
                    <TableContainer component={Paper} elevation={0}>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ backgroundColor: '#063455' }}>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Date</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Room</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Guest</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Item</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Qty</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Price</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Total</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {itemList.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
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
                                            <TableCell>{item.item}</TableCell>
                                            <TableCell>{item.qty}</TableCell>
                                            <TableCell>{item.amount}</TableCell>
                                            <TableCell>{item.total}</TableCell>
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

export default MiniBarReport;
