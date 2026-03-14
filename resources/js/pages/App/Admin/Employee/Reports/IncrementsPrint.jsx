import { useEffect, useState } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress } from '@mui/material';
import axios from 'axios';

const formatCurrency = (amount) => `Rs ${parseFloat(amount || 0).toLocaleString()}`;

const IncrementsPrint = ({ filters = {}, generatedAt = '' }) => {
    const [increments, setIncrements] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(route('employees.reports.api.increments', filters));
                setIncrements(response.data.data.increments || []);
                setLoading(false);
                setTimeout(() => window.print(), 500);
            } catch (error) {
                console.error('Error fetching report data', error);
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
                <Typography sx={{ ml: 2 }}>Generating Increments Report...</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3, backgroundColor: '#fff' }}>
            <style>{`@media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }`}</style>

            <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    Salary Increments Report
                </Typography>
                <Typography variant="body2" color="textSecondary">
                    Period: {filters.date_from} to {filters.date_to}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                    Generated: {generatedAt}
                </Typography>
            </Box>

            <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid #ddd' }}>
                <Table size="small">
                    <TableHead>
                        <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                            <TableCell sx={{ fontWeight: 600 }}>#</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Employee</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Department</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Effective Date</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">
                                Previous Salary
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">
                                Current Salary
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">
                                Increment
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {increments.map((item, index) => (
                            <TableRow key={item.id}>
                                <TableCell>{index + 1}</TableCell>
                                <TableCell>{item.employee?.name || '-'}</TableCell>
                                <TableCell>{item.employee?.department?.name || '-'}</TableCell>
                                <TableCell>{item.effective_date}</TableCell>
                                <TableCell align="right">{formatCurrency(item.previous_salary)}</TableCell>
                                <TableCell align="right">{formatCurrency(item.current_salary)}</TableCell>
                                <TableCell align="right" sx={{ color: item.increment >= 0 ? 'green' : 'red', fontWeight: 500 }}>
                                    {item.increment >= 0 ? '+' : ''}
                                    {formatCurrency(item.increment)}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Box sx={{ mt: 3, textAlign: 'right' }}>
                <Typography variant="body2" color="textSecondary">
                    Total Records: {increments.length}
                </Typography>
            </Box>
        </Box>
    );
};

export default IncrementsPrint;

IncrementsPrint.layout = (page) => page;
