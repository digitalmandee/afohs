import { useEffect } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';

const AddOnsPrint = ({ items = [], filters = {}, generatedAt = '' }) => {
    useEffect(() => {
        setTimeout(() => window.print(), 500);
    }, []);

    const getGuestName = (booking) => {
        if (!booking) return '-';
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
                    Add-ons Report
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
                            <TableCell sx={{ fontWeight: 600 }}>Booking No</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Guest</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Venue</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Addon</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Details</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Amount</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {items.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell>{item.event_booking?.booking_no || '-'}</TableCell>
                                <TableCell>{getGuestName(item.event_booking)}</TableCell>
                                <TableCell>{item.event_booking?.event_venue?.name || '-'}</TableCell>
                                <TableCell>{item.type}</TableCell>
                                <TableCell>{item.details}</TableCell>
                                <TableCell>{item.amount}</TableCell>
                                <TableCell>{item.event_booking?.event_date}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Box sx={{ mt: 3, textAlign: 'right' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Total Records: {items.length}
                </Typography>
            </Box>
        </Box>
    );
};

AddOnsPrint.layout = (page) => page;

export default AddOnsPrint;
