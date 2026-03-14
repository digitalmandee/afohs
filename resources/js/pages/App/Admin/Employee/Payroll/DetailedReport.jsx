import { useState } from 'react';
import { router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import AdminLayout from '@/layouts/AdminLayout';
import { Box, Card, CardContent, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, IconButton, Tooltip, Grid, Pagination } from '@mui/material';
import { ArrowBack as ArrowBackIcon, Print as PrintIcon, Visibility as VisibilityIcon, Assessment as AssessmentIcon } from '@mui/icons-material';

const drawerWidth = 240;

const DetailedReport = ({ period, payslips }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;
    const totalPages = Math.ceil((payslips?.length || 0) / itemsPerPage);

    const paginatedPayslips = payslips?.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage) || [];

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-PK', {
            style: 'currency',
            currency: 'PKR',
        })
            .format(amount || 0)
            .replace('PKR', 'Rs');
    };

    const handlePrint = () => {
        window.open(route('employees.payroll.reports.detailed.print', period.id), '_blank');
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'approved':
                return 'success';
            case 'pending':
                return 'warning';
            case 'rejected':
                return 'error';
            default:
                return 'default';
        }
    };

    // Calculate totals
    const totals = payslips?.reduce(
        (acc, payslip) => ({
            gross: acc.gross + (parseFloat(payslip.gross_salary) || 0),
            deductions: acc.deductions + (parseFloat(payslip.total_deductions) || 0),
            net: acc.net + (parseFloat(payslip.net_salary) || 0),
        }),
        { gross: 0, deductions: 0, net: 0 },
    ) || { gross: 0, deductions: 0, net: 0 };

    return (
        <AdminLayout>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <IconButton onClick={() => window.history.back()}>
                        <ArrowBackIcon sx={{ color: '#063455' }} />
                    </IconButton>
                    <Box>
                        <Typography variant="h4" sx={{ color: '#063455', fontWeight: 600 }}>
                            Detailed Payroll Report
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

            {/* Summary Cards */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} md={3}>
                    <Card sx={{ background: 'linear-gradient(135deg, #063455 0%, #0a4a6b 100%)', color: 'white' }}>
                        <CardContent sx={{ textAlign: 'center', py: 2 }}>
                            <Typography variant="h5" sx={{ fontWeight: 600 }}>
                                {payslips?.length || 0}
                            </Typography>
                            <Typography variant="body2">Total Payslips</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                    <Card sx={{ background: 'linear-gradient(135deg, #2e7d32 0%, #388e3c 100%)', color: 'white' }}>
                        <CardContent sx={{ textAlign: 'center', py: 2 }}>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                {formatCurrency(totals.gross)}
                            </Typography>
                            <Typography variant="body2">Total Gross</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                    <Card sx={{ background: 'linear-gradient(135deg, #d32f2f 0%, #f44336 100%)', color: 'white' }}>
                        <CardContent sx={{ textAlign: 'center', py: 2 }}>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                {formatCurrency(totals.deductions)}
                            </Typography>
                            <Typography variant="body2">Total Deductions</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                    <Card sx={{ background: 'linear-gradient(135deg, #ed6c02 0%, #ff9800 100%)', color: 'white' }}>
                        <CardContent sx={{ textAlign: 'center', py: 2 }}>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                {formatCurrency(totals.net)}
                            </Typography>
                            <Typography variant="body2">Total Net</Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Detailed Payslips Table */}
            <Card>
                <CardContent>
                    <Typography variant="h6" sx={{ color: '#063455', fontWeight: 600, mb: 3 }}>
                        Employee Payslips Details
                    </Typography>

                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                                    <TableCell sx={{ fontWeight: 600, color: '#063455' }}>Employee</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#063455' }}>Employee ID</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#063455' }}>Department</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#063455' }}>Basic Salary</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#063455' }}>Allowances</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#063455' }}>Gross Salary</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#063455' }}>Deductions</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#063455' }}>Net Salary</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#063455' }}>Status</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#063455' }}>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {paginatedPayslips.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                                            <Typography color="textSecondary">No payslips found for this period</Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paginatedPayslips.map((payslip) => (
                                        <TableRow key={payslip.id} sx={{ '&:hover': { backgroundColor: '#f5f5f5' } }}>
                                            <TableCell>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                                    {payslip.employee?.user?.name || payslip.employee?.name || 'N/A'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>{payslip.employee?.employee_id || 'N/A'}</TableCell>
                                            <TableCell>{payslip.employee?.department?.name || 'N/A'}</TableCell>
                                            <TableCell>
                                                <Typography sx={{ fontWeight: 600 }}>{formatCurrency(payslip.basic_salary)}</Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography sx={{ fontWeight: 600, color: '#2e7d32' }}>{formatCurrency(payslip.total_allowances)}</Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography sx={{ fontWeight: 600, color: '#2e7d32' }}>{formatCurrency(payslip.gross_salary)}</Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography sx={{ fontWeight: 600, color: '#d32f2f' }}>{formatCurrency(payslip.total_deductions)}</Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography sx={{ fontWeight: 600, color: '#063455' }}>{formatCurrency(payslip.net_salary)}</Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip label={payslip.status || 'pending'} size="small" color={getStatusColor(payslip.status)} />
                                            </TableCell>
                                            <TableCell>
                                                <Tooltip title="View Payslip">
                                                    <IconButton size="small" onClick={() => router.visit(route('employees.payroll.payslip.view', payslip.id))} sx={{ color: '#063455' }}>
                                                        <VisibilityIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                            <Pagination
                                count={totalPages}
                                page={currentPage}
                                onChange={(event, page) => setCurrentPage(page)}
                                color="primary"
                                sx={{
                                    '& .MuiPaginationItem-root': {
                                        color: '#063455',
                                    },
                                    '& .Mui-selected': {
                                        backgroundColor: '#063455',
                                        color: 'white',
                                    },
                                }}
                            />
                        </Box>
                    )}

                    {/* Totals Summary */}
                    <Box sx={{ mt: 4, p: 3, backgroundColor: '#f8f9fa', borderRadius: 1 }}>
                        <Typography variant="h6" sx={{ color: '#063455', fontWeight: 600, mb: 2 }}>
                            Report Summary
                        </Typography>
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={3}>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="subtitle2" color="textSecondary">
                                        Total Employees
                                    </Typography>
                                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#063455' }}>
                                        {payslips?.length || 0}
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="subtitle2" color="textSecondary">
                                        Total Gross Amount
                                    </Typography>
                                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#2e7d32' }}>
                                        {formatCurrency(totals.gross)}
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="subtitle2" color="textSecondary">
                                        Total Deductions
                                    </Typography>
                                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#d32f2f' }}>
                                        {formatCurrency(totals.deductions)}
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="subtitle2" color="textSecondary">
                                        Total Net Amount
                                    </Typography>
                                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#063455' }}>
                                        {formatCurrency(totals.net)}
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

export default DetailedReport;
