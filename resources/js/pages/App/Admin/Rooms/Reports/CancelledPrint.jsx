import { useEffect } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip } from '@mui/material';

const CancelledPrint = ({ bookings = [], filters = {}, generatedAt = '' }) => {
    useEffect(() => {
        setTimeout(() => window.print(), 500);
    }, []);

    const getStatusColor = (status) => {
        const colors = {
            cancelled: 'error',
            refunded: 'info',
        };
        return colors[status] || 'default';
    };

    return (
        <Box sx={{ p: 3, backgroundColor: '#fff' }}>
            <style>{`@media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }`}</style>

            <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    Cancelled/Refunded Bookings Report
                </Typography>
                <Typography variant="body2" color="textSecondary">
                    {filters.dateFrom} to {filters.dateTo}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                    Generated: {generatedAt}
                </Typography>
            </Box>

            <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid #ddd' }}>
                <Table size="small">
                    <TableHead>
                        <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                            <TableCell sx={{ fontWeight: 600 }}>Booking ID</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Room</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Guest</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Cancellation Date</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Total Amount</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Refunded Amount</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {bookings.map((booking) => (
                            <TableRow key={booking.id}>
                                <TableCell>{booking.booking_number || booking.id}</TableCell>
                                <TableCell>{booking.room?.room_number}</TableCell>
                                <TableCell>{booking.customer ? booking.customer.name : booking.member ? booking.member.full_name : booking.corporate_member ? booking.corporate_member.name : '-'}</TableCell>
                                <TableCell>
                                    <Chip label={booking.status} size="small" color={getStatusColor(booking.status)} variant="outlined" />
                                </TableCell>
                                <TableCell>{booking.updated_at ? new Date(booking.updated_at).toLocaleDateString() : '-'}</TableCell>
                                <TableCell>{booking.total_amount}</TableCell>
                                <TableCell>{booking.paid_amount || '0'}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Box sx={{ mt: 3, textAlign: 'right' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Total Records: {bookings.length}
                </Typography>
            </Box>
        </Box>
    );
};

CancelledPrint.layout = (page) => page;

export default CancelledPrint;
