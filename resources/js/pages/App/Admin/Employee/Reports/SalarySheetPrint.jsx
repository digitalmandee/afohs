import { useEffect, useState } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress } from '@mui/material';
import axios from 'axios';

const formatCurrency = (amount) => `Rs ${parseFloat(amount || 0).toLocaleString()}`;

const SalarySheetPrint = ({ period = null, filters = {}, generatedAt = '' }) => {
    const [payslips, setPayslips] = useState([]);
    const [totals, setTotals] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(route('employees.reports.api.salary-sheet', filters));
                // API returns { data: { payslips: [], totals: {} } }
                setPayslips(response.data.data.payslips || []);
                setTotals(response.data.data.totals || null);
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
                <Typography sx={{ ml: 2 }}>Generating Salary Sheet...</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3, backgroundColor: '#fff' }}>
            <style>{`@media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }`}</style>

            <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    Salary Sheet
                </Typography>
                {period && (
                    <Typography variant="body2" color="textSecondary">
                        Period: {period.period_name || period.name} ({period.start_date} to {period.end_date})
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
                            <TableCell sx={{ fontWeight: 600 }}>Employee ID</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Department</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">
                                Basic
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">
                                Allowances
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">
                                Deductions
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">
                                Gross
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">
                                Net Salary
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {payslips.map((payslip, index) => (
                            <TableRow key={payslip.id}>
                                <TableCell>{index + 1}</TableCell>
                                <TableCell>{payslip.employee_id_number}</TableCell>
                                <TableCell>{payslip.employee_name}</TableCell>
                                <TableCell>{payslip.department || '-'}</TableCell>
                                <TableCell align="right">{formatCurrency(payslip.basic_salary)}</TableCell>
                                <TableCell align="right" sx={{ color: 'green' }}>
                                    {formatCurrency(payslip.total_allowances)}
                                </TableCell>
                                <TableCell align="right" sx={{ color: 'red' }}>
                                    {formatCurrency(payslip.total_deductions)}
                                </TableCell>
                                <TableCell align="right">{formatCurrency(payslip.gross_salary)}</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 600 }}>
                                    {formatCurrency(payslip.net_salary)}
                                </TableCell>
                            </TableRow>
                        ))}
                        {totals && (
                            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                                <TableCell colSpan={4} sx={{ fontWeight: 600 }}>
                                    TOTAL
                                </TableCell>
                                <TableCell align="right" sx={{ fontWeight: 600 }}>
                                    {formatCurrency(totals.total_basic)}
                                </TableCell>
                                <TableCell align="right" sx={{ fontWeight: 600, color: 'green' }}>
                                    {formatCurrency(totals.total_allowances)}
                                </TableCell>
                                <TableCell align="right" sx={{ fontWeight: 600, color: 'red' }}>
                                    {formatCurrency(totals.total_deductions)}
                                </TableCell>
                                <TableCell align="right" sx={{ fontWeight: 600 }}>
                                    {formatCurrency(totals.total_gross)}
                                </TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700 }}>
                                    {formatCurrency(totals.total_net)}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default SalarySheetPrint;

SalarySheetPrint.layout = (page) => page;
