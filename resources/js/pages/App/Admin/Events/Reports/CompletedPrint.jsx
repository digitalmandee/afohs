import { useEffect } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip } from '@mui/material';

const CompletedPrint = ({ bookings = [], filters = {}, generatedAt = '' }) => {
    useEffect(() => {
        setTimeout(() => window.print(), 500);
    }, []);

    const getGuestName = (booking) => {
        if (booking.booked_by) return booking.booked_by;
        if (booking.customer) return booking.customer.name;
        if (booking.member) return booking.member.full_name;
        if (booking.corporateMember) return booking.corporateMember.full_name;
        return 'Unknown';
    };

    return (
        <Box sx={{ p: 3, backgroundColor: '#fff' }}>
            <style>{`@media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }`}</style>

            <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    Completed Events Report
                </Typography>
                <Typography variant="body2" color="textSecondary">
                    {filters.event_date_from || filters.date_from} to {filters.event_date_to || filters.date_to}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                    Generated: {generatedAt}
                </Typography>
            </Box>

            <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid #ddd' }}>
                <Table size="small">
                    <TableHead>
                        <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                            <TableCell sx={{ fontWeight: 600 }}>Booking No</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Guest</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Venue</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Event Date</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Total</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Paid</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {bookings.map((booking) => (
                            <TableRow key={booking.id}>
                                <TableCell>{booking.booking_no || booking.id}</TableCell>
                                <TableCell>{getGuestName(booking)}</TableCell>
                                <TableCell>{booking.event_venue?.name}</TableCell>
                                <TableCell>{booking.event_date}</TableCell>
                                <TableCell>
                                    <Chip label={booking.status} size="small" color="success" variant="outlined" />
                                </TableCell>
                                <TableCell>{booking.total_price}</TableCell>
                                <TableCell>{booking.paid_amount || 0}</TableCell>
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

CompletedPrint.layout = (page) => page;

export default CompletedPrint;
