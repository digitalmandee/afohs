import { useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { Box, Typography, Grid, Paper, Divider, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';

const PrintDetailedReport = ({ period, payslips }) => {
    useEffect(() => {
        // Auto-print when component loads
        const timer = setTimeout(() => {
            window.print();
        }, 1000);

        return () => clearTimeout(timer);
    }, []);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-PK', {
            style: 'currency',
            currency: 'PKR',
        })
            .format(amount || 0)
            .replace('PKR', 'Rs');
    };

    // Calculate totals
    const totals = payslips?.reduce(
        (acc, payslip) => ({
            gross: acc.gross + (parseFloat(payslip.gross_salary) || 0),
            deductions: acc.deductions + (parseFloat(payslip.total_deductions) || 0),
            net: acc.net + (parseFloat(payslip.net_salary) || 0),
            allowances: acc.allowances + (parseFloat(payslip.total_allowances) || 0),
            basic: acc.basic + (parseFloat(payslip.basic_salary) || 0),
        }),
        { gross: 0, deductions: 0, net: 0, allowances: 0, basic: 0 }
    ) || { gross: 0, deductions: 0, net: 0, allowances: 0, basic: 0 };

    const printStyles = {
        '@media print': {
            body: { margin: 0, padding: 0 },
            '@page': { margin: '0.5in' },
        },
    };

    return (
        <>
            <Head title="Detailed Payroll Report - Print" />
            
            <style jsx global>{`
                @media print {
                    body {
                        margin: 0;
                        padding: 0;
                        font-family: Arial, sans-serif;
                    }
                    
                    @page {
                        margin: 0.5in;
                        size: A4;
                    }
                    
                    * {
                        -webkit-print-color-adjust: exact !important;
                        color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                }
            `}</style>

            <Box sx={{ p: 3, backgroundColor: 'white', minHeight: '100vh' }}>
            {/* Header */}
            <Box sx={{ textAlign: 'center', mb: 3, borderBottom: '2px solid #063455', pb: 2 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#063455', mb: 1 }}>
                    AFOHS CLUB
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#063455', mb: 1 }}>
                    Detailed Payroll Report
                </Typography>
                <Typography variant="body2" color="textSecondary">
                    Generated on: {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
                </Typography>
            </Box>

            {/* Period Information */}
            <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#063455', mb: 1 }}>
                    Period Information
                </Typography>
                <Grid container spacing={2}>
                    <Grid item xs={3}>
                        <Typography variant="body2" color="textSecondary">
                            Period:
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {period?.period_name || 'N/A'}
                        </Typography>
                    </Grid>
                    <Grid item xs={3}>
                        <Typography variant="body2" color="textSecondary">
                            Start Date:
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {period ? new Date(period.start_date).toLocaleDateString() : 'N/A'}
                        </Typography>
                    </Grid>
                    <Grid item xs={3}>
                        <Typography variant="body2" color="textSecondary">
                            End Date:
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {period ? new Date(period.end_date).toLocaleDateString() : 'N/A'}
                        </Typography>
                    </Grid>
                    <Grid item xs={3}>
                        <Typography variant="body2" color="textSecondary">
                            Total Employees:
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {payslips?.length || 0}
                        </Typography>
                    </Grid>
                </Grid>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Summary Totals */}
            <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#063455', mb: 2 }}>
                    Summary Totals
                </Typography>
                <Grid container spacing={2}>
                    <Grid item xs={2.4}>
                        <Paper sx={{ p: 1, border: '1px solid #e0e0e0', textAlign: 'center' }}>
                            <Typography variant="body2" color="textSecondary">Basic Salary</Typography>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                {formatCurrency(totals.basic)}
                            </Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={2.4}>
                        <Paper sx={{ p: 1, border: '1px solid #e0e0e0', textAlign: 'center' }}>
                            <Typography variant="body2" color="textSecondary">Allowances</Typography>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#2e7d32' }}>
                                {formatCurrency(totals.allowances)}
                            </Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={2.4}>
                        <Paper sx={{ p: 1, border: '1px solid #e0e0e0', textAlign: 'center' }}>
                            <Typography variant="body2" color="textSecondary">Gross Salary</Typography>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#2e7d32' }}>
                                {formatCurrency(totals.gross)}
                            </Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={2.4}>
                        <Paper sx={{ p: 1, border: '1px solid #e0e0e0', textAlign: 'center' }}>
                            <Typography variant="body2" color="textSecondary">Deductions</Typography>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#d32f2f' }}>
                                {formatCurrency(totals.deductions)}
                            </Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={2.4}>
                        <Paper sx={{ p: 1, border: '1px solid #e0e0e0', textAlign: 'center', backgroundColor: '#f8f9fa' }}>
                            <Typography variant="body2" color="textSecondary">Net Salary</Typography>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#063455' }}>
                                {formatCurrency(totals.net)}
                            </Typography>
                        </Paper>
                    </Grid>
                </Grid>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Detailed Payslips Table */}
            <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#063455', mb: 2 }}>
                    Employee Payslips Details
                </Typography>
                <TableContainer component={Paper} sx={{ border: '1px solid #e0e0e0' }}>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                                <TableCell sx={{ fontWeight: 600, color: '#063455', fontSize: '0.75rem' }}>Employee</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: '#063455', fontSize: '0.75rem' }}>ID</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: '#063455', fontSize: '0.75rem' }}>Department</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 600, color: '#063455', fontSize: '0.75rem' }}>Basic</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 600, color: '#063455', fontSize: '0.75rem' }}>Allowances</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 600, color: '#063455', fontSize: '0.75rem' }}>Gross</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 600, color: '#063455', fontSize: '0.75rem' }}>Deductions</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 600, color: '#063455', fontSize: '0.75rem' }}>Net Salary</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {payslips?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} align="center" sx={{ py: 2 }}>
                                        <Typography variant="body2" color="textSecondary">No payslips found for this period</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                payslips?.map((payslip, index) => (
                                    <TableRow key={payslip.id} sx={{ '&:nth-of-type(odd)': { backgroundColor: '#fafafa' } }}>
                                        <TableCell sx={{ fontSize: '0.75rem' }}>
                                            {payslip.employee?.user?.name || payslip.employee?.name || 'N/A'}
                                        </TableCell>
                                        <TableCell sx={{ fontSize: '0.75rem' }}>
                                            {payslip.employee?.employee_id || 'N/A'}
                                        </TableCell>
                                        <TableCell sx={{ fontSize: '0.75rem' }}>
                                            {payslip.employee?.department?.name || 'N/A'}
                                        </TableCell>
                                        <TableCell align="right" sx={{ fontSize: '0.75rem' }}>
                                            {formatCurrency(payslip.basic_salary)}
                                        </TableCell>
                                        <TableCell align="right" sx={{ fontSize: '0.75rem', color: '#2e7d32' }}>
                                            {formatCurrency(payslip.total_allowances)}
                                        </TableCell>
                                        <TableCell align="right" sx={{ fontSize: '0.75rem', color: '#2e7d32' }}>
                                            {formatCurrency(payslip.gross_salary)}
                                        </TableCell>
                                        <TableCell align="right" sx={{ fontSize: '0.75rem', color: '#d32f2f' }}>
                                            {formatCurrency(payslip.total_deductions)}
                                        </TableCell>
                                        <TableCell align="right" sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#063455' }}>
                                            {formatCurrency(payslip.net_salary)}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                            {/* Totals Row */}
                            <TableRow sx={{ backgroundColor: '#e3f2fd', borderTop: '2px solid #063455' }}>
                                <TableCell colSpan={3} sx={{ fontWeight: 700, fontSize: '0.8rem' }}>
                                    TOTALS ({payslips?.length || 0} employees)
                                </TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.8rem' }}>
                                    {formatCurrency(totals.basic)}
                                </TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.8rem', color: '#2e7d32' }}>
                                    {formatCurrency(totals.allowances)}
                                </TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.8rem', color: '#2e7d32' }}>
                                    {formatCurrency(totals.gross)}
                                </TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.8rem', color: '#d32f2f' }}>
                                    {formatCurrency(totals.deductions)}
                                </TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.8rem', color: '#063455' }}>
                                    {formatCurrency(totals.net)}
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>

            {/* Footer */}
            <Box sx={{ mt: 4, pt: 2, borderTop: '1px solid #e0e0e0', textAlign: 'center' }}>
                <Typography variant="body2" color="textSecondary">
                    This report was generated by AFOHS Club Payroll Management System
                </Typography>
                <Typography variant="body2" color="textSecondary">
                    Report Date: {new Date().toLocaleDateString()} | Total Employees: {payslips?.length || 0}
                </Typography>
            </Box>
            </Box>
        </>
    );
};

PrintDetailedReport.layout = (page) => page;

export default PrintDetailedReport;
