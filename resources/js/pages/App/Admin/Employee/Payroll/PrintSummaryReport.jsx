import { useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { Box, Typography, Grid, Paper, Divider, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';

const PrintSummaryReport = ({ period, summary }) => {
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

    const printStyles = {
        '@media print': {
            body: { margin: 0, padding: 0 },
            '@page': { margin: '1in' },
        },
    };

    return (
        <>
            <Head title="Payroll Summary Report - Print" />
            
            <style jsx global>{`
                @media print {
                    body {
                        margin: 0;
                        padding: 0;
                        font-family: Arial, sans-serif;
                    }
                    
                    @page {
                        margin: 1in;
                        size: A4;
                    }
                    
                    * {
                        -webkit-print-color-adjust: exact !important;
                        color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                }
            `}</style>

            <Box sx={{ p: 4, backgroundColor: 'white', minHeight: '100vh' }}>
            {/* Header */}
            <Box sx={{ textAlign: 'center', mb: 4, borderBottom: '2px solid #063455', pb: 2 }}>
                <Typography variant="h3" sx={{ fontWeight: 700, color: '#063455', mb: 1 }}>
                    AFOHS CLUB
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 600, color: '#063455', mb: 1 }}>
                    Payroll Summary Report
                </Typography>
                <Typography variant="body1" color="textSecondary">
                    Generated on: {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
                </Typography>
            </Box>

            {/* Period Information */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#063455', mb: 2 }}>
                    Period Information
                </Typography>
                <Grid container spacing={2}>
                    <Grid item xs={3}>
                        <Typography variant="subtitle2" color="textSecondary">
                            Period Name:
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {period?.period_name || 'N/A'}
                        </Typography>
                    </Grid>
                    <Grid item xs={3}>
                        <Typography variant="subtitle2" color="textSecondary">
                            Start Date:
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {period ? new Date(period.start_date).toLocaleDateString() : 'N/A'}
                        </Typography>
                    </Grid>
                    <Grid item xs={3}>
                        <Typography variant="subtitle2" color="textSecondary">
                            End Date:
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {period ? new Date(period.end_date).toLocaleDateString() : 'N/A'}
                        </Typography>
                    </Grid>
                    <Grid item xs={3}>
                        <Typography variant="subtitle2" color="textSecondary">
                            Status:
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600, textTransform: 'capitalize' }}>
                            {period?.status || 'N/A'}
                        </Typography>
                    </Grid>
                </Grid>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Summary Statistics */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#063455', mb: 3 }}>
                    Payroll Summary
                </Typography>
                <Grid container spacing={3}>
                    <Grid item xs={6}>
                        <Paper sx={{ p: 2, border: '1px solid #e0e0e0' }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#063455' }}>
                                Total Employees
                            </Typography>
                            <Typography variant="h4" sx={{ fontWeight: 700, color: '#063455' }}>
                                {summary?.total_employees || 0}
                            </Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={6}>
                        <Paper sx={{ p: 2, border: '1px solid #e0e0e0' }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#2e7d32' }}>
                                Total Gross Amount
                            </Typography>
                            <Typography variant="h5" sx={{ fontWeight: 700, color: '#2e7d32' }}>
                                {formatCurrency(summary?.total_gross_amount)}
                            </Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={6}>
                        <Paper sx={{ p: 2, border: '1px solid #e0e0e0' }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#d32f2f' }}>
                                Total Deductions
                            </Typography>
                            <Typography variant="h5" sx={{ fontWeight: 700, color: '#d32f2f' }}>
                                {formatCurrency(summary?.total_deductions)}
                            </Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={6}>
                        <Paper sx={{ p: 2, border: '1px solid #e0e0e0' }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#063455' }}>
                                Total Net Amount
                            </Typography>
                            <Typography variant="h5" sx={{ fontWeight: 700, color: '#063455' }}>
                                {formatCurrency(summary?.total_net_amount)}
                            </Typography>
                        </Paper>
                    </Grid>
                </Grid>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Detailed Breakdown */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#063455', mb: 3 }}>
                    Payroll Breakdown
                </Typography>
                <TableContainer component={Paper} sx={{ border: '1px solid #e0e0e0' }}>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                                <TableCell sx={{ fontWeight: 600, color: '#063455' }}>Category</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 600, color: '#063455' }}>Amount</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 600, color: '#063455' }}>Average per Employee</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 600 }}>Gross Salary</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 600, color: '#2e7d32' }}>
                                    {formatCurrency(summary?.total_gross_amount)}
                                </TableCell>
                                <TableCell align="right">
                                    {summary?.total_employees > 0 ? formatCurrency(summary.total_gross_amount / summary.total_employees) : formatCurrency(0)}
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 600 }}>Total Deductions</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 600, color: '#d32f2f' }}>
                                    {formatCurrency(summary?.total_deductions)}
                                </TableCell>
                                <TableCell align="right">
                                    {summary?.total_employees > 0 ? formatCurrency(summary.total_deductions / summary.total_employees) : formatCurrency(0)}
                                </TableCell>
                            </TableRow>
                            <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                                <TableCell sx={{ fontWeight: 700, fontSize: '1.1rem' }}>Net Payroll</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700, fontSize: '1.1rem', color: '#063455' }}>
                                    {formatCurrency(summary?.total_net_amount)}
                                </TableCell>
                                <TableCell align="right" sx={{ fontWeight: 600 }}>
                                    {summary?.total_employees > 0 ? formatCurrency(summary.total_net_amount / summary.total_employees) : formatCurrency(0)}
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>

            {/* Footer */}
            <Box sx={{ mt: 6, pt: 2, borderTop: '1px solid #e0e0e0', textAlign: 'center' }}>
                <Typography variant="body2" color="textSecondary">
                    This report was generated by AFOHS Club Payroll Management System
                </Typography>
                <Typography variant="body2" color="textSecondary">
                    Report Date: {new Date().toLocaleDateString()} | Page 1 of 1
                </Typography>
            </Box>
            </Box>
        </>
    );
};

PrintSummaryReport.layout = (page) => page;

export default PrintSummaryReport;
