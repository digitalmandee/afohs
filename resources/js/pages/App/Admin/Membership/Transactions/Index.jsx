import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Card, CardContent, Typography, Grid, Box, Button, TextField, FormControl, InputLabel, Select, MenuItem, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, Pagination, InputAdornment } from '@mui/material';
import { Search, FilterList, Add, Visibility } from '@mui/icons-material';
import 'bootstrap/dist/css/bootstrap.min.css';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

export default function TransactionIndex({ transactions, filters }) {
    // const [open, setOpen] = useState(true);

    const [localFilters, setLocalFilters] = useState({
        search: filters.search || '',
        fee_type: filters.fee_type || 'all',
        status: filters.status || 'all',
        date_from: filters.date_from || '',
        date_to: filters.date_to || '',
    });

    const handleFilterChange = (field, value) => {
        setLocalFilters((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const applyFilters = () => {
        router.get(route('membership.transactions.index'), localFilters, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const clearFilters = () => {
        const clearedFilters = {
            search: '',
            fee_type: 'all',
            status: 'all',
            date_from: '',
            date_to: '',
        };
        setLocalFilters(clearedFilters);
        router.get(
            route('membership.transactions.index'),
            {},
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const handlePageChange = (event, page) => {
        router.get(
            route('membership.transactions.index'),
            {
                ...localFilters,
                page,
            },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

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
            <Head title="All Transactions" />
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
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h4" component="h1">
                        All Transactions
                    </Typography>
                    <Button component={Link} href={route('finance.transaction.create')} variant="contained" startIcon={<Add />}>
                        Add New Transaction
                    </Button>
                </Box>

                {/* Filters */}
                <Card sx={{ mb: 3 }}>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            <FilterList sx={{ mr: 1, verticalAlign: 'middle' }} />
                            Filters
                        </Typography>

                        <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} md={3}>
                                <TextField
                                    fullWidth
                                    label="Search"
                                    placeholder="Member name or membership no"
                                    value={localFilters.search}
                                    onChange={(e) => handleFilterChange('search', e.target.value)}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Search />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Grid>

                            <Grid item xs={12} md={2}>
                                <FormControl fullWidth>
                                    <InputLabel>Fee Type</InputLabel>
                                    <Select value={localFilters.fee_type} onChange={(e) => handleFilterChange('fee_type', e.target.value)} label="Fee Type">
                                        <MenuItem value="all">All Types</MenuItem>
                                        <MenuItem value="membership_fee">Membership Fee</MenuItem>
                                        <MenuItem value="maintenance_fee">Maintenance Fee</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid item xs={12} md={2}>
                                <FormControl fullWidth>
                                    <InputLabel>Status</InputLabel>
                                    <Select value={localFilters.status} onChange={(e) => handleFilterChange('status', e.target.value)} label="Status">
                                        <MenuItem value="all">All Status</MenuItem>
                                        <MenuItem value="paid">Paid</MenuItem>
                                        <MenuItem value="unpaid">Unpaid</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid item xs={12} md={2}>
                                <LocalizationProvider dateAdapter={AdapterDayjs}>
                                    <DatePicker
                                        label="From Date"
                                        value={localFilters.date_from ? dayjs(localFilters.date_from) : null}
                                        onChange={(newValue) => handleFilterChange('date_from', newValue ? dayjs(newValue).format('YYYY-MM-DD') : '')}
                                        format="DD-MM-YYYY"
                                        slotProps={{
                                            textField: {
                                                fullWidth: true,
                                                size: 'small', // Added size small to match other filters
                                                InputLabelProps: { shrink: true },
                                                onClick: (e) => e.target.closest('.MuiFormControl-root').querySelector('button')?.click(),
                                            },
                                        }}
                                    />
                                </LocalizationProvider>
                            </Grid>

                            <Grid item xs={12} md={2}>
                                <LocalizationProvider dateAdapter={AdapterDayjs}>
                                    <DatePicker
                                        label="To Date"
                                        value={localFilters.date_to ? dayjs(localFilters.date_to) : null}
                                        onChange={(newValue) => handleFilterChange('date_to', newValue ? dayjs(newValue).format('YYYY-MM-DD') : '')}
                                        format="DD-MM-YYYY"
                                        slotProps={{
                                            textField: {
                                                fullWidth: true,
                                                size: 'small', // Added size small to match other filters
                                                InputLabelProps: { shrink: true },
                                                onClick: (e) => e.target.closest('.MuiFormControl-root').querySelector('button')?.click(),
                                            },
                                        }}
                                    />
                                </LocalizationProvider>
                            </Grid>

                            <Grid item xs={12} md={1}>
                                <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column' }}>
                                    <Button variant="contained" onClick={applyFilters} size="small">
                                        Apply
                                    </Button>
                                    <Button variant="outlined" onClick={clearFilters} size="small">
                                        Clear
                                    </Button>
                                </Box>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>

                {/* Transactions Table */}
                <Card>
                    <CardContent>
                        <TableContainer component={Paper} elevation={0}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Invoice No</TableCell>
                                        <TableCell>Member</TableCell>
                                        <TableCell>Fee Type</TableCell>
                                        <TableCell>Payment Frequency</TableCell>
                                        <TableCell>Amount</TableCell>
                                        <TableCell>Status</TableCell>
                                        <TableCell>Payment Method</TableCell>
                                        <TableCell>Date</TableCell>
                                        <TableCell>Validity Period</TableCell>
                                        <TableCell>Days</TableCell>
                                        <TableCell>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {transactions.data && transactions.data.length > 0 ? (
                                        transactions.data.map((transaction) => (
                                            <TableRow key={transaction.id} hover>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight="medium">
                                                        {transaction.invoice_no}
                                                    </Typography>
                                                </TableCell>
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
                                                <TableCell>{transaction.payment_frequency ? <Chip label={transaction.payment_frequency.replace('_', ' ').toUpperCase()} variant="outlined" size="small" /> : '-'}</TableCell>
                                                <TableCell>
                                                    <Box>
                                                        <Typography variant="body2" fontWeight="medium">
                                                            {formatCurrency(transaction.total_price)}
                                                        </Typography>
                                                        {transaction.discount_value > 0 && (
                                                            <Typography variant="caption" color="textSecondary">
                                                                Original: {formatCurrency(transaction.amount)}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip label={transaction.status?.toUpperCase()} color={getStatusColor(transaction.status)} size="small" />
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                                                        {transaction.payment_method?.replace('_', ' ')}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Box>
                                                        <Typography variant="body2">{formatDate(transaction.created_at)}</Typography>
                                                        {transaction.payment_date && (
                                                            <Typography variant="caption" color="textSecondary">
                                                                Paid: {formatDate(transaction.payment_date)}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                </TableCell>
                                                <TableCell>
                                                    {transaction.valid_from && transaction.valid_to ? (
                                                        <Box>
                                                            <Typography variant="body2" fontSize="0.875rem">
                                                                {formatDate(transaction.valid_from)}
                                                            </Typography>
                                                            <Typography variant="caption" color="textSecondary">
                                                                to {formatDate(transaction.valid_to)}
                                                            </Typography>
                                                        </Box>
                                                    ) : (
                                                        <Typography variant="body2" color="textSecondary">
                                                            -
                                                        </Typography>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {transaction.valid_from && transaction.valid_to ? (
                                                        <Typography variant="body2" fontSize="0.875rem">
                                                            {dayjs(transaction.valid_to).diff(dayjs(transaction.valid_from), 'day') + 1}
                                                        </Typography>
                                                    ) : (
                                                        '-'
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {/* <Button component={Link} href={route('membership.transactions.show', transaction.id)} size="small" variant="outlined" startIcon={<Visibility />}>
                                                            View
                                                        </Button> */}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={11} align="center">
                                                <Typography color="textSecondary" sx={{ py: 4 }}>
                                                    No transactions found
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        {/* Pagination */}
                        {transactions.last_page > 1 && (
                            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                                <Pagination count={transactions.last_page} page={transactions.current_page} onChange={handlePageChange} color="primary" showFirstButton showLastButton />
                            </Box>
                        )}

                        {/* Summary */}
                        <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                            <Typography variant="body2" color="textSecondary">
                                Showing {transactions.from || 0} to {transactions.to || 0} of {transactions.total || 0} transactions
                            </Typography>
                        </Box>
                    </CardContent>
                </Card>
            </Box>
            {/* </div> */}
        </>
    );
}
