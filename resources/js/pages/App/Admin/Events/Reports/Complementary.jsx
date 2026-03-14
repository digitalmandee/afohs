import { router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import AdminLayout from '@/layouts/AdminLayout';
import { Box, Card, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Chip } from '@mui/material';
import { ArrowBack as ArrowBackIcon, Print as PrintIcon, FileDownload as FileDownloadIcon } from '@mui/icons-material';
import Pagination from '@/components/Pagination';

import RoomBookingFilter from '../../Booking/BookingFilter';

const ComplementaryReport = ({ items = {}, filters = {}, venues = [] }) => {
    const itemList = items.data || [];

    const handlePrint = () => {
        const params = new URLSearchParams(window.location.search);
        const printUrl = route('events.reports.complementary.print', Object.fromEntries(params));
        window.open(printUrl, '_blank');
    };

    const handleExport = () => {
        const params = new URLSearchParams(window.location.search);
        const exportUrl = route('events.reports.complementary.export', Object.fromEntries(params));
        window.location.href = exportUrl;
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

                {/* Filters */}
                <RoomBookingFilter
                    routeName="events.reports.complementary"
                    showStatus={false} // Status filter might not be relevant/easy for mixed UNION query
                    showRoomType={false}
                    showVenues={false} // Venue filter hard for UNION query unless joined
                    showDates={{ booking: false, checkIn: true, checkOut: false }}
                    dateLabels={{ checkIn: 'Event Date' }}
                />

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
                                    <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Booking No</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Guest</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Date</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Item</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Details</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Value</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Category</TableCell>
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
                                    itemList.map((item, index) => (
                                        <TableRow key={`${item.booking_id}-${index}`} sx={{ '&:hover': { backgroundColor: '#f5f5f5' } }}>
                                            <TableCell>{item.booking_no}</TableCell>
                                            <TableCell>{item.guest_name}</TableCell>
                                            <TableCell>{item.event_date}</TableCell>
                                            <TableCell>{item.item_name}</TableCell>
                                            <TableCell>{item.details}</TableCell>
                                            <TableCell>{item.amount}</TableCell>
                                            <TableCell>
                                                <Chip label={item.category} size="small" variant="outlined" />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <Pagination data={items} />
                </Card>
            </Box>
        </AdminLayout>
    );
};

export default ComplementaryReport;
