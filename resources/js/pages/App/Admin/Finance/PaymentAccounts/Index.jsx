import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Box, Button, IconButton, MenuItem, Pagination, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography, Chip } from '@mui/material';
import { Add, ArrowBack, Delete, Edit, Restaurant } from '@mui/icons-material';
import AdminLayout from '@/layouts/AdminLayout';

export default function Index({ accounts, filters = {} }) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');
    const [paymentMethod, setPaymentMethod] = useState(filters.payment_method || '');

    const handleApply = (e) => {
        e.preventDefault();

        const params = {};
        if (search) params.search = search;
        if (status) params.status = status;
        if (paymentMethod) params.payment_method = paymentMethod;

        router.get(route('finance.payment-accounts.index'), params, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const handleReset = () => {
        setSearch('');
        setStatus('');
        setPaymentMethod('');

        router.get(route('finance.payment-accounts.index'), {}, { preserveState: true, preserveScroll: true, replace: true });
    };

    const handleDelete = (id) => {
        if (confirm('Are you sure you want to delete this payment account?')) {
            router.delete(route('finance.payment-accounts.destroy', id));
        }
    };

    const handlePageChange = (event, value) => {
        const params = {};
        if (search) params.search = search;
        if (status) params.status = status;
        if (paymentMethod) params.payment_method = paymentMethod;
        params.page = value;

        router.get(route('finance.payment-accounts.index'), params, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    return (
        <AdminLayout>
            <Head title="Payment Accounts" />

            <Box sx={{ display: 'flex', alignItems: 'flex-start', pt: 2.5, pl: 2 }}>
                <IconButton
                    href={route('finance.dashboard')}
                    sx={{
                        mt: 0.5,
                        color: '#063455',
                        '&:hover': { bgcolor: 'rgba(6, 52, 85, 0.1)' },
                    }}
                >
                    <ArrowBack />
                </IconButton>
                <Box>
                    <Typography sx={{ fontWeight: '700', fontSize: '30px', color: '#063455' }}>Payment Accounts</Typography>
                    <Typography sx={{ fontWeight: '600', fontSize: '15px', color: '#063455' }}>Manage payment accounts per payment method.</Typography>
                </Box>
            </Box>

            <Box sx={{ p: 3 }}>
                <Box display="flex" justifyContent="flex-end" alignItems="center" mb={2}>
                    <Link href={route('finance.payment-accounts.trashed')}>
                        <Button variant="outlined" color="error" startIcon={<Delete />} sx={{ mr: 2, textTransform: 'none', borderRadius: 16 }}>
                            Deleted Items
                        </Button>
                    </Link>
                    <Link href={route('finance.payment-accounts.create')}>
                        <Button variant="contained" startIcon={<Add />} sx={{ bgcolor: '#063455', '&:hover': { bgcolor: '#063455' }, textTransform: 'none', borderRadius: 16 }}>
                            Add Payment Account
                        </Button>
                    </Link>
                </Box>

                <Paper sx={{ p: 2, mb: 2 }}>
                    <Box component="form" onSubmit={handleApply} display="flex" gap={2} flexWrap="wrap" alignItems="center">
                        <TextField size="small" label="Search" value={search} onChange={(e) => setSearch(e.target.value)} sx={{ minWidth: 240 }} />
                        <TextField select size="small" label="Payment Method" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} sx={{ minWidth: 220 }}>
                            <MenuItem value="">All</MenuItem>
                            <MenuItem value="cash">Cash</MenuItem>
                            <MenuItem value="credit_card">Credit Card</MenuItem>
                            <MenuItem value="debit_card">Debit Card</MenuItem>
                            <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                            <MenuItem value="online">Online Transfer</MenuItem>
                            <MenuItem value="cheque">Cheque</MenuItem>
                        </TextField>
                        <TextField select size="small" label="Status" value={status} onChange={(e) => setStatus(e.target.value)} sx={{ minWidth: 180 }}>
                            <MenuItem value="">All</MenuItem>
                            <MenuItem value="active">Active</MenuItem>
                            <MenuItem value="inactive">Inactive</MenuItem>
                        </TextField>
                        <Button type="submit" variant="contained" sx={{ bgcolor: '#063455', '&:hover': { bgcolor: '#063455' }, textTransform: 'none', borderRadius: 16 }}>
                            Apply
                        </Button>
                        <Button type="button" variant="outlined" onClick={handleReset} sx={{ textTransform: 'none', borderRadius: 16, color: '#063455', borderColor: '#063455' }}>
                            Reset
                        </Button>
                    </Box>
                </Paper>

                <Paper>
                    <TableContainer sx={{ borderRadius: '12px', overflowX: 'auto' }}>
                        <Table>
                            <TableHead sx={{ bgcolor: '#063455' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 600, color: '#fff' }}>Name</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#fff' }}>Payment Method</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#fff' }}>Status</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 600, color: '#fff' }}>
                                        Actions
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {accounts.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} align="center" sx={{ py: 8 }}>
                                            <Box sx={{ color: 'text.secondary' }}>
                                                <Restaurant sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
                                                <Typography>No payment accounts found.</Typography>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    accounts.data.map((account) => (
                                        <TableRow key={account.id} hover>
                                            <TableCell>
                                                <Typography variant="subtitle2" fontWeight={600} color="#1e293b">
                                                    {account.name}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" color="text.secondary">
                                                    {account.payment_method || '-'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip label={account.status} size="small" color={account.status === 'active' ? 'success' : 'default'} sx={{ textTransform: 'capitalize', height: 24 }} />
                                            </TableCell>
                                            <TableCell align="right">
                                                <Box display="flex" justifyContent="flex-end" gap={1}>
                                                    <Link href={route('finance.payment-accounts.edit', account.id)}>
                                                        <IconButton size="small" color="primary">
                                                            <Edit fontSize="small" />
                                                        </IconButton>
                                                    </Link>
                                                    <IconButton size="small" color="error" onClick={() => handleDelete(account.id)}>
                                                        <Delete fontSize="small" />
                                                    </IconButton>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>

                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, mb: 3 }}>
                    <Pagination count={accounts.last_page} page={accounts.current_page} onChange={handlePageChange} color="primary" />
                </Box>
            </Box>
        </AdminLayout>
    );
}
