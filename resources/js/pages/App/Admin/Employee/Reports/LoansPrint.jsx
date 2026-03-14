import { useEffect, useState } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, CircularProgress } from '@mui/material';
import axios from 'axios';

const formatCurrency = (amount) => `Rs ${parseFloat(amount || 0).toLocaleString()}`;

const getStatusColor = (status) => {
    const colors = {
        pending: 'warning',
        approved: 'info',
        disbursed: 'success',
        rejected: 'error',
        paid: 'default',
    };
    return colors[status] || 'default';
};

const LoansPrint = ({ filters = {}, generatedAt = '' }) => {
    const [loans, setLoans] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(route('employees.reports.api.loans', filters));
                setLoans(response.data.data.loans || []);
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
                <Typography sx={{ ml: 2 }}>Generating Loans Report...</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3, backgroundColor: '#fff' }}>
            <style>{`@media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }`}</style>

            <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    Employee Loans Report
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
                            <TableCell sx={{ fontWeight: 600 }}>Loan Date</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">
                                Amount
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">
                                Paid
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">
                                Remaining
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loans.map((loan, index) => (
                            <TableRow key={loan.id}>
                                <TableCell>{index + 1}</TableCell>
                                <TableCell>
                                    <Box>
                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                            {loan.employee?.name}
                                        </Typography>
                                        <Typography variant="caption" color="textSecondary">
                                            {loan.employee?.employee_id}
                                        </Typography>
                                    </Box>
                                </TableCell>
                                <TableCell>{loan.employee?.department?.name || '-'}</TableCell>
                                <TableCell>{loan.loan_date}</TableCell>
                                <TableCell align="right">{formatCurrency(loan.amount)}</TableCell>
                                <TableCell align="right" sx={{ color: 'green' }}>
                                    {formatCurrency(loan.total_paid)}
                                </TableCell>
                                <TableCell align="right" sx={{ color: 'red' }}>
                                    {formatCurrency(loan.remaining_amount)}
                                </TableCell>
                                <TableCell>
                                    <Chip label={loan.status} size="small" color={getStatusColor(loan.status)} />
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
                            Total Loans
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
                            Total Recovered
                        </Typography>
                        <Typography variant="h6" color="success.main">
                            {formatCurrency(summary.total_recovered)}
                        </Typography>
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

export default LoansPrint;

LoansPrint.layout = (page) => page;
