import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import AdminLayout from '@/layouts/AdminLayout';
import { Box, Card, CardContent, Typography, Button, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Divider, Chip, Avatar, CircularProgress, Alert, IconButton, Tooltip } from '@mui/material';
import { ArrowBack as ArrowBackIcon, Print as PrintIcon, Download as DownloadIcon, Person as PersonIcon, CalendarMonth as CalendarIcon, AccountBalance as AccountBalanceIcon, TrendingUp as TrendingUpIcon, TrendingDown as TrendingDownIcon, Receipt as ReceiptIcon } from '@mui/icons-material';
import axios from 'axios';

const drawerWidth = 240;

const ViewPayslip = ({ payslipId }) => {
    const [payslip, setPayslip] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showOrdersDialog, setShowOrdersDialog] = useState(false);
    const [ordersForDialog, setOrdersForDialog] = useState([]);

    useEffect(() => {
        fetchPayslip();
    }, [payslipId]);

    const fetchPayslip = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`/api/payroll/payslips/${payslipId}`);
            if (response.data.success) {
                setPayslip(response.data.payslip);
            } else {
                setError('Payslip not found');
            }
        } catch (error) {
            console.error('Error fetching payslip:', error);
            setError('Error loading payslip data');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-PK', {
            style: 'currency',
            currency: 'PKR',
        })
            .format(amount || 0)
            .replace('PKR', 'Rs');
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-PK', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'paid':
                return 'success';
            case 'approved':
                return 'info';
            case 'pending':
                return 'warning';
            case 'draft':
                return 'default';
            default:
                return 'default';
        }
    };

    const handlePrint = () => {
        window.open(route('employees.payroll.payslips.print', payslipId), '_blank');
    };

    const handleDownload = () => {
        // Implementation for PDF download would go here
        console.log('Download payslip as PDF');
    };

    if (loading) {
        return (
            <AdminLayout>
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        minHeight: '60vh',
                    }}
                >
                    <CircularProgress size={60} sx={{ color: '#063455' }} />
                </Box>
            </AdminLayout>
        );
    }

    if (error || !payslip) {
        return (
            <AdminLayout>
                <Box>
                    <Alert severity="error">{error || 'Payslip not found'}</Alert>
                </Box>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <IconButton onClick={() => window.history.back()}>
                        <ArrowBackIcon sx={{ color: '#063455' }} />
                    </IconButton>
                    {/* <Divider orientation="vertical" flexItem /> */}
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 600, color: '#063455' }}>
                            Payslip Details
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                            {payslip.employee?.name} - {payslip.period?.period_name}
                        </Typography>
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Print Payslip">
                        <IconButton
                            onClick={handlePrint}
                            sx={{
                                backgroundColor: '#063455',
                                color: 'white',
                                '&:hover': { backgroundColor: '#052d45' },
                            }}
                        >
                            <PrintIcon />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Download PDF">
                        <IconButton
                            onClick={handleDownload}
                            sx={{
                                backgroundColor: '#2e7d32',
                                color: 'white',
                                '&:hover': { backgroundColor: '#1b5e20' },
                            }}
                        >
                            <DownloadIcon />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="View CTS Orders">
                        <IconButton
                            onClick={() => {
                                setOrdersForDialog(payslip.order_deductions || []);
                                setShowOrdersDialog(true);
                            }}
                            sx={{ backgroundColor: '#6a1b9a', color: 'white', '&:hover': { backgroundColor: '#4a148c' } }}
                        >
                            <DownloadIcon />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            <Grid container spacing={3}>
                {/* Employee Information */}
                <Grid item xs={12} md={4}>
                    <Card sx={{ height: 'fit-content' }}>
                        <CardContent sx={{ p: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                                <PersonIcon sx={{ color: '#063455' }} />
                                <Typography variant="h6" sx={{ fontWeight: 600, color: '#063455' }}>
                                    Employee Information
                                </Typography>
                            </Box>

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                                <Avatar src={payslip.employee?.profile_photo} sx={{ width: 60, height: 60, backgroundColor: '#063455' }}>
                                    {payslip.employee?.name?.charAt(0)}
                                </Avatar>
                                <Box>
                                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                        {payslip.employee?.name}
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">
                                        ID: {payslip.employee?.employee_id}
                                    </Typography>
                                </Box>
                            </Box>

                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <Box>
                                    <Typography variant="body2" color="textSecondary">
                                        Department:
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                        {payslip.employee?.department?.name || 'N/A'}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="body2" color="textSecondary">
                                        Designation:
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                        {payslip.employee?.designation || 'N/A'}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="body2" color="textSecondary">
                                        Join Date:
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                        {payslip.employee?.join_date ? formatDate(payslip.employee.join_date) : 'N/A'}
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Payslip Summary */}
                <Grid item xs={12} md={8}>
                    <Card>
                        <CardContent sx={{ p: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                                <ReceiptIcon sx={{ color: '#063455' }} />
                                <Typography variant="h6" sx={{ fontWeight: 600, color: '#063455' }}>
                                    Payslip Summary
                                </Typography>
                                <Chip label={payslip.status || 'Draft'} color={getStatusColor(payslip.status)} size="small" sx={{ ml: 'auto' }} />
                            </Box>

                            <Grid container spacing={3}>
                                {/* Period Information */}
                                <Grid item xs={12} sm={6}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                        <CalendarIcon sx={{ fontSize: 20, color: '#063455' }} />
                                        <Typography variant="body2" color="textSecondary">
                                            Pay Period:
                                        </Typography>
                                    </Box>
                                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                        {payslip.period?.period_name}
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">
                                        {formatDate(payslip.period?.start_date)} - {formatDate(payslip.period?.end_date)}
                                    </Typography>
                                </Grid>

                                {/* Basic Salary */}
                                <Grid item xs={12} sm={6}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                        <AccountBalanceIcon sx={{ fontSize: 20, color: '#063455' }} />
                                        <Typography variant="body2" color="textSecondary">
                                            Basic Salary:
                                        </Typography>
                                    </Box>
                                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#2e7d32' }}>
                                        {formatCurrency(payslip.basic_salary)}
                                    </Typography>
                                </Grid>

                                {/* Gross Salary */}
                                <Grid item xs={12} sm={6}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                        <TrendingUpIcon sx={{ fontSize: 20, color: '#2e7d32' }} />
                                        <Typography variant="body2" color="textSecondary">
                                            Gross Salary:
                                        </Typography>
                                    </Box>
                                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#2e7d32' }}>
                                        {formatCurrency(payslip.gross_salary)}
                                    </Typography>
                                </Grid>

                                {/* Net Salary */}
                                <Grid item xs={12} sm={6}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                        <TrendingDownIcon sx={{ fontSize: 20, color: '#1976d2' }} />
                                        <Typography variant="body2" color="textSecondary">
                                            Net Salary:
                                        </Typography>
                                    </Box>
                                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#1976d2' }}>
                                        {formatCurrency(payslip.net_salary)}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Allowances */}
                {payslip.allowances && payslip.allowances.length > 0 && (
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent sx={{ p: 3 }}>
                                <Typography variant="h6" sx={{ fontWeight: 600, color: '#063455', mb: 3 }}>
                                    Allowances
                                </Typography>
                                <TableContainer>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 600 }}>
                                                    Amount
                                                </TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {payslip.allowances.map((allowance, index) => (
                                                <TableRow key={index}>
                                                    <TableCell>{allowance.allowance_type?.name}</TableCell>
                                                    <TableCell align="right" sx={{ color: '#2e7d32', fontWeight: 600 }}>
                                                        {formatCurrency(allowance.amount)}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 700, borderTop: '2px solid #e0e0e0' }}>Total Allowances</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 700, color: '#2e7d32', borderTop: '2px solid #e0e0e0' }}>
                                                    {formatCurrency(payslip.total_allowances)}
                                                </TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </CardContent>
                        </Card>
                    </Grid>
                )}

                {/* Deductions */}
                {payslip.deductions && payslip.deductions.length > 0 && (
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent sx={{ p: 3 }}>
                                <Typography variant="h6" sx={{ fontWeight: 600, color: '#063455', mb: 3 }}>
                                    Deductions
                                </Typography>
                                <TableContainer>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 600 }}>
                                                    Amount
                                                </TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {payslip.deductions.map((deduction, index) => (
                                                <TableRow key={index}>
                                                    <TableCell>{deduction.deduction_type?.name}</TableCell>
                                                    <TableCell align="right" sx={{ color: '#d32f2f', fontWeight: 600 }}>
                                                        -{formatCurrency(deduction.amount)}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 700, borderTop: '2px solid #e0e0e0' }}>Total Deductions</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 700, color: '#d32f2f', borderTop: '2px solid #e0e0e0' }}>
                                                    -{formatCurrency(payslip.total_deductions)}
                                                </TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </CardContent>
                        </Card>
                    </Grid>
                )}

                {/* Additional Information */}
                <Grid item xs={12}>
                    <Card>
                        <CardContent sx={{ p: 3 }}>
                            <Typography variant="h6" sx={{ fontWeight: 600, color: '#063455', mb: 3 }}>
                                Additional Information
                            </Typography>
                            <Grid container spacing={3}>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Typography variant="body2" color="textSecondary">
                                        Working Days:
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                        {payslip.working_days || 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Typography variant="body2" color="textSecondary">
                                        Present Days:
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                        {payslip.present_days || 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Typography variant="body2" color="textSecondary">
                                        Absent Days:
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                        {payslip.absent_days || 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Typography variant="body2" color="textSecondary">
                                        Overtime Hours:
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                        {payslip.overtime_hours || '0'} hrs
                                    </Typography>
                                </Grid>
                            </Grid>

                            {payslip.remarks && (
                                <Box sx={{ mt: 3 }}>
                                    <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                                        Remarks:
                                    </Typography>
                                    <Typography variant="body1">{payslip.remarks}</Typography>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Orders Dialog */}
            <Dialog open={showOrdersDialog} onClose={() => setShowOrdersDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    <Typography variant="h6" sx={{ color: '#063455', fontWeight: 600 }}>
                        CTS Order Deductions
                    </Typography>
                </DialogTitle>
                <DialogContent>
                    {!ordersForDialog || ordersForDialog.length === 0 ? (
                        <Box sx={{ py: 3 }}>
                            <Typography color="textSecondary">No CTS orders found for this payslip.</Typography>
                        </Box>
                    ) : (
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Date</TableCell>
                                        <TableCell>Order ID</TableCell>
                                        <TableCell>Amount</TableCell>
                                        <TableCell>Note</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {ordersForDialog.map((o) => {
                                        const alreadyDeducted = !!o.deducted_at;
                                        return (
                                            <TableRow key={o.id} sx={{ opacity: alreadyDeducted ? 0.6 : 1, fontStyle: alreadyDeducted ? 'italic' : 'normal' }}>
                                                <TableCell>{o.paid_at ? new Date(o.paid_at).toLocaleDateString() : '—'}</TableCell>
                                                <TableCell>{o.id}</TableCell>
                                                <TableCell>{formatCurrency(o.amount)}</TableCell>
                                                <TableCell>
                                                    <Box>
                                                        <Typography variant="body2">{o.note || '—'}</Typography>
                                                        {o.deducted_at && (
                                                            <Typography variant="caption" color="textSecondary">
                                                                Deducted: {new Date(o.deducted_at).toLocaleString()}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowOrdersDialog(false)}>Close</Button>
                </DialogActions>
            </Dialog>
        </AdminLayout>
    );
};

export default ViewPayslip;
