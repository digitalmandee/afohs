import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { Card, CardContent, Typography, Grid, Box, Button, Chip, Divider, Table, TableBody, TableCell, TableContainer, TableRow, Paper } from '@mui/material';
import { ArrowBack, Receipt, Person, Payment, CalendarToday } from '@mui/icons-material';
import 'bootstrap/dist/css/bootstrap.min.css';
import dayjs from 'dayjs';

export default function ShowTransaction({ transaction }) {
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-PK', {
            style: 'currency',
            currency: 'PKR',
        }).format(amount);
    };

    const formatDate = (date) => {
        if (!date) return '';
        return dayjs(date).format('DD-MM-YYYY');
    };

    const formatDateTime = (date) => {
        if (!date) return '';
        return dayjs(date).format('DD-MM-YYYY hh:mm A');
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'paid':
                return 'success';
            case 'unpaid':
                return 'error';
            default:
                return 'default';
        }
    };

    const getFeeTypeColor = (feeType) => {
        switch (feeType) {
            case 'membership_fee':
                return 'primary';
            case 'maintenance_fee':
                return 'secondary';
            default:
                return 'default';
        }
    };

    return (
        <>
            <Head title={`Transaction ${transaction.invoice_no}`} />
            {/* <SideNav /> */}

            <Box sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Button component={Link} href={route('membership.transactions.index')} startIcon={<ArrowBack />} sx={{ mr: 2 }}>
                        Back to Transactions
                    </Button>
                    <Typography variant="h4" component="h1">
                        Transaction Details
                    </Typography>
                </Box>

                <Grid container spacing={3}>
                    {/* Transaction Overview */}
                    <Grid item xs={12} md={8}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <Receipt sx={{ mr: 1, color: 'primary.main' }} />
                                    <Typography variant="h6">Invoice #{transaction.invoice_no}</Typography>
                                    <Box sx={{ ml: 'auto' }}>
                                        <Chip label={transaction.status?.toUpperCase()} color={getStatusColor(transaction.status)} />
                                    </Box>
                                </Box>

                                <TableContainer component={Paper} elevation={0}>
                                    <Table>
                                        <TableBody>
                                            <TableRow>
                                                <TableCell component="th" scope="row" sx={{ fontWeight: 'medium' }}>
                                                    Fee Type
                                                </TableCell>
                                                <TableCell>
                                                    <Chip label={transaction.fee_type?.replace('_', ' ').toUpperCase()} color={getFeeTypeColor(transaction.fee_type)} size="small" />
                                                </TableCell>
                                            </TableRow>

                                            {transaction.payment_frequency && (
                                                <TableRow>
                                                    <TableCell component="th" scope="row" sx={{ fontWeight: 'medium' }}>
                                                        Payment Frequency
                                                    </TableCell>
                                                    <TableCell sx={{ textTransform: 'capitalize' }}>{transaction.payment_frequency.replace('_', ' ')}</TableCell>
                                                </TableRow>
                                            )}

                                            {transaction.quarter_number && (
                                                <TableRow>
                                                    <TableCell component="th" scope="row" sx={{ fontWeight: 'medium' }}>
                                                        Quarter Number
                                                    </TableCell>
                                                    <TableCell>Quarter {transaction.quarter_number}</TableCell>
                                                </TableRow>
                                            )}

                                            <TableRow>
                                                <TableCell component="th" scope="row" sx={{ fontWeight: 'medium' }}>
                                                    Original Amount
                                                </TableCell>
                                                <TableCell>{formatCurrency(transaction.amount)}</TableCell>
                                            </TableRow>

                                            {transaction.tax_amount > 0 && (
                                                <TableRow>
                                                    <TableCell component="th" scope="row" sx={{ fontWeight: 'medium' }}>
                                                        Tax
                                                    </TableCell>
                                                    <TableCell>{formatCurrency(transaction.tax_amount)}</TableCell>
                                                </TableRow>
                                            )}

                                            {transaction.additional_charges > 0 && (
                                                <TableRow>
                                                    <TableCell component="th" scope="row" sx={{ fontWeight: 'medium' }}>
                                                        Overdue / Additional Charges
                                                    </TableCell>
                                                    <TableCell>{formatCurrency(transaction.additional_charges)}</TableCell>
                                                </TableRow>
                                            )}

                                            {transaction.discount_value > 0 && (
                                                <>
                                                    <TableRow>
                                                        <TableCell component="th" scope="row" sx={{ fontWeight: 'medium' }}>
                                                            Discount Type
                                                        </TableCell>
                                                        <TableCell sx={{ textTransform: 'capitalize' }}>{transaction.discount_type}</TableCell>
                                                    </TableRow>
                                                    <TableRow>
                                                        <TableCell component="th" scope="row" sx={{ fontWeight: 'medium' }}>
                                                            Discount Value
                                                        </TableCell>
                                                        <TableCell>{transaction.discount_type === 'percent' ? `${transaction.discount_value}%` : formatCurrency(transaction.discount_value)}</TableCell>
                                                    </TableRow>
                                                </>
                                            )}

                                            <TableRow>
                                                <TableCell component="th" scope="row" sx={{ fontWeight: 'medium', fontSize: '1.1rem' }}>
                                                    Total Amount
                                                </TableCell>
                                                <TableCell sx={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'primary.main' }}>{formatCurrency(transaction.total_price)}</TableCell>
                                            </TableRow>

                                            <TableRow>
                                                <TableCell component="th" scope="row" sx={{ fontWeight: 'medium' }}>
                                                    Paid Amount
                                                </TableCell>
                                                <TableCell>{formatCurrency(transaction.paid_amount)}</TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Member Information */}
                    <Grid item xs={12} md={4}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <Person sx={{ mr: 1, color: 'primary.main' }} />
                                    <Typography variant="h6">Member Information</Typography>
                                </Box>

                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="subtitle1" fontWeight="medium">
                                        {transaction.member?.full_name}
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">
                                        Membership No: {transaction.member?.membership_no}
                                    </Typography>
                                </Box>

                                <Button component={Link} href={route('membership.edit', { id: transaction.member_id })} variant="outlined" size="small" fullWidth>
                                    View Member Profile
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Payment Information */}
                        <Card sx={{ mt: 2 }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <Payment sx={{ mr: 1, color: 'primary.main' }} />
                                    <Typography variant="h6">Payment Information</Typography>
                                </Box>

                                <TableContainer component={Paper} elevation={0}>
                                    <Table size="small">
                                        <TableBody>
                                            <TableRow>
                                                <TableCell component="th" scope="row" sx={{ fontWeight: 'medium' }}>
                                                    Method
                                                </TableCell>
                                                <TableCell sx={{ textTransform: 'capitalize' }}>{transaction.payment_method?.replace('_', ' ')}</TableCell>
                                            </TableRow>

                                            {transaction.payment_date && (
                                                <TableRow>
                                                    <TableCell component="th" scope="row" sx={{ fontWeight: 'medium' }}>
                                                        Payment Date
                                                    </TableCell>
                                                    <TableCell>{formatDateTime(transaction.payment_date)}</TableCell>
                                                </TableRow>
                                            )}

                                            <TableRow>
                                                <TableCell component="th" scope="row" sx={{ fontWeight: 'medium' }}>
                                                    Issue Date
                                                </TableCell>
                                                <TableCell>{formatDate(transaction.issue_date)}</TableCell>
                                            </TableRow>

                                            <TableRow>
                                                <TableCell component="th" scope="row" sx={{ fontWeight: 'medium' }}>
                                                    Due Date
                                                </TableCell>
                                                <TableCell>{formatDate(transaction.due_date)}</TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Period Information */}
                    {transaction.valid_from && transaction.valid_to && (
                        <Grid item xs={12}>
                            <Card>
                                <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                        <CalendarToday sx={{ mr: 1, color: 'primary.main' }} />
                                        <Typography variant="h6">{transaction.fee_type === 'membership_fee' ? 'Membership Validity' : 'Payment Period'}</Typography>
                                    </Box>

                                    <Grid container spacing={2}>
                                        <Grid item xs={12} md={6}>
                                            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                                                <Typography variant="subtitle2" color="textSecondary">
                                                    Valid From
                                                </Typography>
                                                <Typography variant="h6">{formatDate(transaction.valid_from)}</Typography>
                                            </Box>
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                                                <Typography variant="subtitle2" color="textSecondary">
                                                    Valid To
                                                </Typography>
                                                <Typography variant="h6">{formatDate(transaction.valid_to)}</Typography>
                                            </Box>
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>
                        </Grid>
                    )}

                    {/* Additional Information */}
                    {transaction.remarks && (
                        <Grid item xs={12}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        Remarks
                                    </Typography>
                                    <Typography variant="body1">{transaction.remarks}</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    )}

                    {/* System Information */}
                    <Grid item xs={12}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    System Information
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} md={4}>
                                        <Typography variant="body2" color="textSecondary">
                                            Created At
                                        </Typography>
                                        <Typography variant="body1">{formatDateTime(transaction.created_at)}</Typography>
                                    </Grid>
                                    {transaction.updated_at && (
                                        <Grid item xs={12} md={4}>
                                            <Typography variant="body2" color="textSecondary">
                                                Last Updated
                                            </Typography>
                                            <Typography variant="body1">{formatDateTime(transaction.updated_at)}</Typography>
                                        </Grid>
                                    )}
                                    <Grid item xs={12} md={4}>
                                        <Typography variant="body2" color="textSecondary">
                                            Transaction ID
                                        </Typography>
                                        <Typography variant="body1">#{transaction.id}</Typography>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Box>
        </>
    );
}
