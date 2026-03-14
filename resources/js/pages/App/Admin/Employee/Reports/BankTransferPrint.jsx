import { useEffect, useState } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress } from '@mui/material';
import axios from 'axios';

const formatCurrency = (amount) => `Rs ${parseFloat(amount || 0).toLocaleString()}`;

const BankTransferPrint = ({ period = null, filters = {}, generatedAt = '' }) => {
    const [employees, setEmployees] = useState([]);
    const [totals, setTotals] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(route('employees.reports.api.bank-transfer', filters));
                setEmployees(response.data.data.employees || []);
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
                <Typography sx={{ ml: 2 }}>Generating Bank Transfer Report...</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3, backgroundColor: '#fff' }}>
            <style>{`@media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }`}</style>

            <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    Bank Transfer Report
                </Typography>
                {period && (
                    <Typography variant="body2" color="textSecondary">
                        Period: {period.period_name || period.name}
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
                            <TableCell sx={{ fontWeight: 600 }}>Employee Name</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Department</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Bank Name</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Account No</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Branch Code</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">
                                Net Salary
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {employees.map((emp, index) => (
                            <TableRow key={index}>
                                <TableCell>{index + 1}</TableCell>
                                <TableCell>{emp.employee_id_number}</TableCell>
                                <TableCell>{emp.employee_name}</TableCell>
                                <TableCell>{emp.department || '-'}</TableCell>
                                <TableCell>{emp.bank_name}</TableCell>
                                <TableCell>{emp.account_no}</TableCell>
                                <TableCell>{emp.branch_code}</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 600 }}>
                                    {formatCurrency(emp.net_salary)}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {totals && (
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Total Employees: {totals.total_employees}</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 700 }}>
                        Total Transfer Amount: {formatCurrency(totals.total_amount)}
                    </Typography>
                </Box>
            )}
        </Box>
    );
};

export default BankTransferPrint;

BankTransferPrint.layout = (page) => page;
