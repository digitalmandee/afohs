import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Card, CardContent, Typography, Grid, Box, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip } from '@mui/material';
import { AttachMoney, Receipt, TrendingUp, AccountBalance } from '@mui/icons-material';
import 'bootstrap/dist/css/bootstrap.min.css';
import dayjs from 'dayjs';

export default function TransactionDashboard({ statistics, recent_transactions }) {
    // const [open, setOpen] = useState(true);

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
            <Head title="Transaction Dashboard" />
            {/* <SideNav open={open} setOpen={setOpen} />

            <div
                style={{
                    marginLeft: open ? `${drawerWidthOpen}px` : `${drawerWidthClosed}px`,
                    transition: 'margin-left 0.3s ease-in-out',
                    marginTop: '5rem',
                    backgroundColor: '#F6F6F6',
                }}
            > */}
            <Box sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h4" component="h1" gutterBottom>
                        Transaction Dashboard
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button component={Link} href={route('finance.transaction.create')} variant="contained" color="primary">
                            Add New Transaction
                        </Button>
                        <Button component={Link} href={route('membership.transactions.index')} variant="outlined">
                            View All Transactions
                        </Button>
                    </Box>
                </Box>

                {/* Statistics Cards */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Receipt sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                                    <Box>
                                        <Typography color="textSecondary" gutterBottom>
                                            Total Transactions
                                        </Typography>
                                        <Typography variant="h5">{statistics.total_transactions}</Typography>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <AttachMoney sx={{ fontSize: 40, color: 'success.main', mr: 2 }} />
                                    <Box>
                                        <Typography color="textSecondary" gutterBottom>
                                            Total Revenue
                                        </Typography>
                                        <Typography variant="h5">{formatCurrency(statistics.total_revenue)}</Typography>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <TrendingUp sx={{ fontSize: 40, color: 'info.main', mr: 2 }} />
                                    <Box>
                                        <Typography color="textSecondary" gutterBottom>
                                            Membership Fees
                                        </Typography>
                                        <Typography variant="h5">{formatCurrency(statistics.membership_fee_revenue)}</Typography>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <AccountBalance sx={{ fontSize: 40, color: 'warning.main', mr: 2 }} />
                                    <Box>
                                        <Typography color="textSecondary" gutterBottom>
                                            Maintenance Fees
                                        </Typography>
                                        <Typography variant="h5">{formatCurrency(statistics.maintenance_fee_revenue)}</Typography>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* Recent Transactions */}
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Recent Transactions
                        </Typography>
                        <TableContainer component={Paper} elevation={0}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Invoice No</TableCell>
                                        <TableCell>Member</TableCell>
                                        <TableCell>Fee Type</TableCell>
                                        <TableCell>Amount</TableCell>
                                        <TableCell>Status</TableCell>
                                        <TableCell>Date</TableCell>
                                        <TableCell>Valid Until</TableCell>
                                        <TableCell>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {recent_transactions && recent_transactions.length > 0 ? (
                                        recent_transactions.map((transaction) => (
                                            <TableRow key={transaction.id}>
                                                <TableCell>{transaction.invoice_no}</TableCell>
                                                <TableCell>
                                                    <Box>
                                                        <Typography variant="body2" fontWeight="medium">
                                                            {transaction.member?.full_name}
                                                        </Typography>
                                                        <Typography variant="caption" color="textSecondary">
                                                            {transaction.member?.membership_no}
                                                        </Typography>
                                                    </Box>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip label={transaction.fee_type?.replace('_', ' ').toUpperCase()} color={getFeeTypeColor(transaction.fee_type)} size="small" />
                                                </TableCell>
                                                <TableCell>{formatCurrency(transaction.total_price)}</TableCell>
                                                <TableCell>
                                                    <Chip label={transaction.status?.toUpperCase()} color={getStatusColor(transaction.status)} size="small" />
                                                </TableCell>
                                                <TableCell>{formatDate(transaction.created_at)}</TableCell>
                                                <TableCell>
                                                    {transaction.valid_to ? (
                                                        <Typography variant="body2" color={new Date(transaction.valid_to) > new Date() ? 'success.main' : 'error.main'}>
                                                            {formatDate(transaction.valid_to)}
                                                        </Typography>
                                                    ) : (
                                                        <Typography variant="body2" color="textSecondary">
                                                            -
                                                        </Typography>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {/* <Button component={Link} href={route('membership.transactions.show', transaction.id)} size="small" variant="outlined">
                                                            View
                                                        </Button> */}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={8} align="center">
                                                <Typography color="textSecondary">No transactions found</Typography>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </CardContent>
                </Card>
            </Box>
            {/* </div> */}
        </>
    );
}
