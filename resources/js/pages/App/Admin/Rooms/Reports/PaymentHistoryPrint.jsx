import { useEffect } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip } from '@mui/material';

const PaymentHistoryPrint = ({ bookings = [], filters = {}, generatedAt = '' }) => {
    useEffect(() => {
        setTimeout(() => window.print(), 500);
    }, []);

    const getStatusColor = (status) => {
        const colors = {
            paid: 'success',
            unpaid: 'error',
        };
        return colors[status] || 'default';
    };

    return (
        <Box sx={{ p: 3, backgroundColor: '#fff' }}>
            <style>{`@media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }`}</style>

            <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    Room-wise Payment History
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
                            <TableCell sx={{ fontWeight: 600 }}>Invoice No</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Booking Ref</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Room</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Guest</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Total Amount</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Paid Amount</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Balance</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Payment Status</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {bookings.map((booking) => {
                            const invoice = booking.invoice;
                            const total = invoice ? parseFloat(invoice.total_amount) : 0;
                            const paid = invoice ? parseFloat(invoice.paid_amount) : 0;
                            const balance = total - paid;
                            const status = balance <= 0 ? (total > 0 ? 'paid' : 'unpaid') : 'unpaid';

                            return (
                                <TableRow key={booking.id}>
                                    <TableCell>{invoice ? invoice.invoice_no : '-'}</TableCell>
                                    <TableCell>{booking.booking_number}</TableCell>
                                    <TableCell>{booking.room?.room_number}</TableCell>
                                    <TableCell>{booking.customer ? booking.customer.name : booking.member ? booking.member.full_name : booking.corporate_member ? booking.corporate_member.name : '-'}</TableCell>
                                    <TableCell>{total.toFixed(2)}</TableCell>
                                    <TableCell>{paid.toFixed(2)}</TableCell>
                                    <TableCell>{balance.toFixed(2)}</TableCell>
                                    <TableCell>
                                        <Chip label={status.toUpperCase()} size="small" color={getStatusColor(status)} variant="outlined" />
                                    </TableCell>
                                </TableRow>
                            );
                        })}
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

PaymentHistoryPrint.layout = (page) => page;

export default PaymentHistoryPrint;
