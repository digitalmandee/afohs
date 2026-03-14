import { useEffect, useState } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, CircularProgress } from '@mui/material';
import axios from 'axios';

const formatCurrency = (amount) => `Rs ${parseFloat(amount || 0).toLocaleString()}`;

const getStatusColor = (status) => {
    const colors = {
        pending: 'warning',
        approved: 'info',
        paid: 'success',
        rejected: 'error',
    };
    return colors[status] || 'default';
};

const AdvancesPrint = ({ filters = {}, generatedAt = '' }) => {
    const [advances, setAdvances] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(route('employees.reports.api.advances', filters));
                setAdvances(response.data.data.advances || []);
                setSummary(response.data.data.summary || null);
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
                <Typography sx={{ ml: 2 }}>Generating Advances Report...</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3, backgroundColor: '#fff' }}>
            <style>{`@media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }`}</style>

            <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    Employee Advances Report
                </Typography>
                {filters.date_from && filters.date_to && (
                    <Typography variant="body2" color="textSecondary">
                        Period: {filters.date_from} to {filters.date_to}
                    </Typography>
                )}
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
                            <TableCell sx={{ fontWeight: 600 }}>Advance Date</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">
                                Amount
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">
                                Remaining
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {advances.map((advance, index) => (
                            <TableRow key={advance.id}>
                                <TableCell>{index + 1}</TableCell>
                                <TableCell>
                                    <Box>
                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                            {advance.employee?.name}
                                        </Typography>
                                        <Typography variant="caption" color="textSecondary">
                                            {advance.employee?.employee_id}
                                        </Typography>
                                    </Box>
                                </TableCell>
                                <TableCell>{advance.employee?.department?.name || '-'}</TableCell>
                                <TableCell>{advance.advance_date}</TableCell>
                                <TableCell align="right">{formatCurrency(advance.amount)}</TableCell>
                                <TableCell align="right" sx={{ color: 'red' }}>
                                    {formatCurrency(advance.remaining_amount)}
                                </TableCell>
                                <TableCell>
                                    <Chip label={advance.status} size="small" color={getStatusColor(advance.status)} />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {summary && (
                <Box sx={{ mt: 3, p: 2, border: '1px solid #ddd', borderRadius: 1, display: 'flex', justifyContent: 'space-between' }}>
                    <Box>
                        <Typography variant="caption" color="textSecondary">
                            Total Advances
                        </Typography>
                        <Typography variant="h6">{summary.count}</Typography>
                    </Box>
                    <Box>
                        <Typography variant="caption" color="textSecondary">
                            Total Amount
                        </Typography>
                        <Typography variant="h6">{formatCurrency(summary.total_amount)}</Typography>
                    </Box>
                    <Box>
                        <Typography variant="caption" color="textSecondary">
                            Total Outstanding
                        </Typography>
                        <Typography variant="h6" color="error.main">
                            {formatCurrency(summary.total_remaining)}
                        </Typography>
                    </Box>
                </Box>
            )}
        </Box>
    );
};

export default AdvancesPrint;

AdvancesPrint.layout = (page) => page;
