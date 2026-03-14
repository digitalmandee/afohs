import { useEffect } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip } from '@mui/material';

const ComplementaryPrint = ({ items = [], filters = {}, generatedAt = '' }) => {
    useEffect(() => {
        setTimeout(() => window.print(), 500);
    }, []);

    return (
        <Box sx={{ p: 3, backgroundColor: '#fff' }}>
            <style>{`@media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }`}</style>

            <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    Complementary Items Report
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
                            <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Item</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Details</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Value</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {items.map((item, index) => (
                            <TableRow key={`${item.booking_id}-${index}`}>
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

ComplementaryPrint.layout = (page) => page;

export default ComplementaryPrint;
