import { router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import AdminLayout from '@/layouts/AdminLayout';
import { Box, Card, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Chip } from '@mui/material';
import { ArrowBack as ArrowBackIcon, Print as PrintIcon, FileDownload as FileDownloadIcon } from '@mui/icons-material';
import Pagination from '@/components/Pagination';
import dayjs from 'dayjs';

import RoomBookingFilter from '../../Booking/BookingFilter';

const CancelledReport = ({ bookings = {}, filters = {}, venues = [] }) => {
    const bookingList = bookings.data || [];

    const handlePrint = () => {
        const params = new URLSearchParams(window.location.search);
        const printUrl = route('events.reports.cancelled.print', Object.fromEntries(params));
        window.open(printUrl, '_blank');
    };

    const handleExport = () => {
        const params = new URLSearchParams(window.location.search);
        const exportUrl = route('events.reports.cancelled.export', Object.fromEntries(params));
        window.location.href = exportUrl;
    };

    const getStatusColor = (status) => {
        const colors = {
            cancelled: 'error',
            refunded: 'warning',
        };
        return colors[status] || 'default';
    };

    const getGuestName = (booking) => {
        if (booking.booked_by) return booking.booked_by;
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
                        <IconButton onClick={() => router.visit(route('events.reports'))}>
                            <ArrowBackIcon sx={{ color: '#063455' }} />
                        </IconButton>
                        <Typography sx={{ color: '#063455', fontWeight: 700, fontSize: '30px' }}>
                            Cancelled Events Report
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button variant="outlined" startIcon={<FileDownloadIcon />}
                            onClick={handleExport}
                            sx={{ bgcolor: '#063455', color: '#fff', borderRadius: '16px', textTransform: 'none' }}>
                            Export
                        </Button>
                        <Button variant="outlined" startIcon={<PrintIcon />}
                            onClick={handlePrint}
                            sx={{ bgcolor: '#063455', color: '#fff', borderRadius: '16px', textTransform: 'none' }}>
                            Print
                        </Button>
                    </Box>
                </Box>

                {/* Filters */}
                {/* Note: 'booking: true' shows 'Booking Date' filters, BUT controller uses them as updated_at/cancellation_date for cancelled report.
                    We should perhaps rename label to 'Cancelled Data' via dateLabels prop. */}
                <RoomBookingFilter routeName="events.reports.cancelled" showStatus={true} showRoomType={false} showVenues={true} venues={venues} showDates={{ booking: true, checkIn: false, checkOut: false }} dateLabels={{ booking: 'Cancellation Date', checkIn: 'Event Date' }} />

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
                                    <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Guest</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Venue</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Cancelled Date</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Status</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Total</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Security</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Advance</TableCell>
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
                                            <TableCell>{booking.booking_no || booking.id}</TableCell>
                                            <TableCell>{getGuestName(booking)}</TableCell>
                                            <TableCell>{booking.event_venue?.name}</TableCell>
                                            <TableCell>{dayjs(booking.updated_at).format('DD-MM-YYYY')}</TableCell>
                                            <TableCell>
                                                <Chip label={booking.status} size="small" color={getStatusColor(booking.status)} />
                                            </TableCell>
                                            <TableCell>{booking.total_price}</TableCell>
                                            <TableCell>{booking.security_deposit || 0}</TableCell>
                                            <TableCell>{booking.advance_amount || 0}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <Pagination data={bookings} />
                </Card>
            </Box>
        </AdminLayout>
    );
};

export default CancelledReport;
