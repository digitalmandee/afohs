import { useEffect, useState } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress } from '@mui/material';
import axios from 'axios';

const formatCurrency = (amount) => `Rs ${parseFloat(amount || 0).toLocaleString()}`;

const DeductionsPrint = ({ period = null, filters = {}, generatedAt = '' }) => {
    const [deductions, setDeductions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(route('employees.reports.api.deductions', filters));
                setDeductions(response.data.data.deductions || []);
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
                <Typography sx={{ ml: 2 }}>Generating Deductions Report...</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3, backgroundColor: '#fff' }}>
            <style>{`@media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }`}</style>

            <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    Deductions Report
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
                            <TableCell sx={{ fontWeight: 600 }}>Deduction Type</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">
                                Amount
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {deductions.map((deduction, index) => (
                            <TableRow key={index}>
                                <TableCell>{index + 1}</TableCell>
                                <TableCell>{deduction.employee_id_number}</TableCell>
                                <TableCell>{deduction.employee_name}</TableCell>
                                <TableCell>{deduction.department_name || '-'}</TableCell>
                                <TableCell>{deduction.deduction_name}</TableCell>
                                <TableCell align="right" sx={{ color: 'red' }}>
                                    {formatCurrency(deduction.amount)}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Box sx={{ mt: 3, textAlign: 'right' }}>
                <Typography variant="body2" color="textSecondary">
                    Total Records: {deductions.length}
                </Typography>
            </Box>
        </Box>
    );
};

export default DeductionsPrint;

DeductionsPrint.layout = (page) => page;
