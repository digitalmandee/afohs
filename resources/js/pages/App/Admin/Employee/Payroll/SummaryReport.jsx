import { useState } from 'react';
import { router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import AdminLayout from '@/layouts/AdminLayout';
import { Box, Card, CardContent, Typography, Button, Grid, Paper, Divider, IconButton, Tooltip } from '@mui/material';
import { ArrowBack as ArrowBackIcon, Print as PrintIcon, Assessment as AssessmentIcon, TrendingUp as TrendingUpIcon, TrendingDown as TrendingDownIcon, AccountBalance as AccountBalanceIcon, Group as GroupIcon } from '@mui/icons-material';

const drawerWidth = 240;

const SummaryReport = ({ period, summary }) => {
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-PK', {
            style: 'currency',
            currency: 'PKR',
        })
            .format(amount || 0)
            .replace('PKR', 'Rs');
    };

    const handlePrint = () => {
        window.open(route('employees.payroll.reports.summary.print', period.id), '_blank');
    };

    return (
        <AdminLayout>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Button startIcon={<ArrowBackIcon />} onClick={() => router.visit(route('employees.payroll.reports'))} sx={{ color: '#063455' }}>
                        Back to Reports
                    </Button>
                    <Box>
                        <Typography variant="h4" sx={{ color: '#063455', fontWeight: 600 }}>
                            Payroll Summary Report
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                            {period?.period_name} - {period ? new Date(period.start_date).toLocaleDateString() : ''} to {period ? new Date(period.end_date).toLocaleDateString() : ''}
                        </Typography>
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <Tooltip title="Print Report">
                        <IconButton onClick={handlePrint} sx={{ color: '#063455' }}>
                            <PrintIcon />
                        </IconButton>
                    </Tooltip>
                    <AssessmentIcon sx={{ fontSize: 40, color: '#063455', opacity: 0.7 }} />
                </Box>
            </Box>

            {/* Period Information */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" sx={{ color: '#063455', fontWeight: 600, mb: 3 }}>
                        Period Information
                    </Typography>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={3}>
                            <Typography variant="subtitle2" color="textSecondary">
                                Period Name
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                {period?.period_name || 'N/A'}
                            </Typography>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Typography variant="subtitle2" color="textSecondary">
                                Start Date
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                {period ? new Date(period.start_date).toLocaleDateString() : 'N/A'}
                            </Typography>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Typography variant="subtitle2" color="textSecondary">
                                End Date
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                {period ? new Date(period.end_date).toLocaleDateString() : 'N/A'}
                            </Typography>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Typography variant="subtitle2" color="textSecondary">
                                Status
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 600, textTransform: 'capitalize' }}>
                                {period?.status || 'N/A'}
                            </Typography>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {/* Summary Statistics */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} md={3}>
                    <Card sx={{ background: 'linear-gradient(135deg, #063455 0%, #0a4a6b 100%)', color: 'white' }}>
                        <CardContent sx={{ textAlign: 'center', py: 3 }}>
                            <GroupIcon sx={{ fontSize: 40, mb: 1 }} />
                            <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
                                {summary?.total_employees || 0}
                            </Typography>
                            <Typography variant="body2">Total Employees</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                    <Card sx={{ background: 'linear-gradient(135deg, #2e7d32 0%, #388e3c 100%)', color: 'white' }}>
                        <CardContent sx={{ textAlign: 'center', py: 3 }}>
                            <TrendingUpIcon sx={{ fontSize: 40, mb: 1 }} />
                            <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                                {formatCurrency(summary?.total_gross_amount)}
                            </Typography>
                            <Typography variant="body2">Total Gross Amount</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                    <Card sx={{ background: 'linear-gradient(135deg, #d32f2f 0%, #f44336 100%)', color: 'white' }}>
                        <CardContent sx={{ textAlign: 'center', py: 3 }}>
                            <TrendingDownIcon sx={{ fontSize: 40, mb: 1 }} />
                            <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                                {formatCurrency(summary?.total_deductions)}
                            </Typography>
                            <Typography variant="body2">Total Deductions</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                    <Card sx={{ background: 'linear-gradient(135deg, #ed6c02 0%, #ff9800 100%)', color: 'white' }}>
                        <CardContent sx={{ textAlign: 'center', py: 3 }}>
                            <AccountBalanceIcon sx={{ fontSize: 40, mb: 1 }} />
                            <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                                {formatCurrency(summary?.total_net_amount)}
                            </Typography>
                            <Typography variant="body2">Total Net Amount</Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Detailed Breakdown */}
            <Card>
                <CardContent>
                    <Typography variant="h6" sx={{ color: '#063455', fontWeight: 600, mb: 3 }}>
                        Payroll Breakdown
                    </Typography>

                    <Grid container spacing={4}>
                        {/* Earnings Section */}
                        <Grid item xs={12} md={6}>
                            <Paper sx={{ p: 3, backgroundColor: '#f8f9fa' }}>
                                <Typography variant="h6" sx={{ color: '#2e7d32', fontWeight: 600, mb: 2 }}>
                                    Earnings
                                </Typography>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                    <Typography variant="body1">Total Gross Salary</Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                        {formatCurrency(summary?.total_gross_amount)}
                                    </Typography>
                                </Box>
                                <Divider sx={{ my: 2 }} />
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                        Total Earnings
                                    </Typography>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#2e7d32' }}>
                                        {formatCurrency(summary?.total_gross_amount)}
                                    </Typography>
                                </Box>
                            </Paper>
                        </Grid>

                        {/* Deductions Section */}
                        <Grid item xs={12} md={6}>
                            <Paper sx={{ p: 3, backgroundColor: '#f8f9fa' }}>
                                <Typography variant="h6" sx={{ color: '#d32f2f', fontWeight: 600, mb: 2 }}>
                                    Deductions
                                </Typography>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                    <Typography variant="body1">Total Deductions</Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                        {formatCurrency(summary?.total_deductions)}
                                    </Typography>
                                </Box>
                                <Divider sx={{ my: 2 }} />
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                        Total Deductions
                                    </Typography>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#d32f2f' }}>
                                        {formatCurrency(summary?.total_deductions)}
                                    </Typography>
                                </Box>
                            </Paper>
                        </Grid>
                    </Grid>

                    {/* Net Payroll */}
                    <Box sx={{ mt: 4 }}>
                        <Paper sx={{ p: 3, backgroundColor: '#063455', color: 'white', textAlign: 'center' }}>
                            <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                                Net Payroll Amount
                            </Typography>
                            <Typography variant="h3" sx={{ fontWeight: 700 }}>
                                {formatCurrency(summary?.total_net_amount)}
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 1, opacity: 0.8 }}>
                                Total amount to be paid to {summary?.total_employees || 0} employees
                            </Typography>
                        </Paper>
                    </Box>

                    {/* Additional Information */}
                    <Box sx={{ mt: 4 }}>
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={4}>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="subtitle2" color="textSecondary">
                                        Average Gross Salary
                                    </Typography>
                                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#063455' }}>
                                        {summary?.total_employees > 0 ? formatCurrency(summary.total_gross_amount / summary.total_employees) : formatCurrency(0)}
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="subtitle2" color="textSecondary">
                                        Average Deductions
                                    </Typography>
                                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#063455' }}>
                                        {summary?.total_employees > 0 ? formatCurrency(summary.total_deductions / summary.total_employees) : formatCurrency(0)}
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="subtitle2" color="textSecondary">
                                        Average Net Salary
                                    </Typography>
                                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#063455' }}>
                                        {summary?.total_employees > 0 ? formatCurrency(summary.total_net_amount / summary.total_employees) : formatCurrency(0)}
                                    </Typography>
                                </Box>
                            </Grid>
                        </Grid>
                    </Box>
                </CardContent>
            </Card>
        </AdminLayout>
    );
};

export default SummaryReport;
