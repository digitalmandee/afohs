import { useEffect } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip } from '@mui/material';

const MiniBarPrint = ({ items = [], filters = {}, generatedAt = '' }) => {
    useEffect(() => {
        setTimeout(() => window.print(), 500);
    }, []);

    return (
        <Box sx={{ p: 3, backgroundColor: '#fff' }}>
            <style>{`@media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }`}</style>

            <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    Mini-bar Usage Report
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
                            <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Room</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Guest</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Item</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Qty</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Price</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Total</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {items.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell>{item.created_at ? new Date(item.created_at).toLocaleDateString() : '-'}</TableCell>
                                <TableCell>{item.room_booking?.room?.room_number}</TableCell>
                                <TableCell>{item.room_booking?.customer ? item.room_booking.customer.name : item.room_booking?.member ? item.room_booking.member.full_name : item.room_booking?.corporate_member ? item.room_booking.corporate_member.name : '-'}</TableCell>
                                <TableCell>{item.item}</TableCell>
                                <TableCell>{item.qty}</TableCell>
                                <TableCell>{item.amount}</TableCell>
                                <TableCell>{item.total}</TableCell>
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

MiniBarPrint.layout = (page) => page;

export default MiniBarPrint;
