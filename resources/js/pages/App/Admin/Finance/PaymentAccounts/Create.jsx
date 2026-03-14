import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { Box, Button, Card, CardContent, Grid, IconButton, MenuItem, TextField, Typography } from '@mui/material';
import { ArrowBack, Save } from '@mui/icons-material';
import AdminLayout from '@/layouts/AdminLayout';

export default function Create({ item }) {
    const isEdit = !!item;

    const { data, setData, post, put, processing, errors } = useForm({
        name: item?.name || '',
        payment_method: item?.payment_method || '',
        status: item?.status || 'active',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isEdit) {
            put(route('finance.payment-accounts.update', item.id));
        } else {
            post(route('finance.payment-accounts.store'));
        }
    };

    return (
        <AdminLayout>
            <Head title={isEdit ? `Edit Payment Account: ${item.name}` : 'Create Payment Account'} />

            <Box sx={{ display: 'flex', alignItems: 'flex-start', pt: 2.5, pl: 2 }}>
                <IconButton
                    href={route('finance.payment-accounts.index')}
                    sx={{
                        mt: 0.5,
                        color: '#063455',
                        '&:hover': { bgcolor: 'rgba(6, 52, 85, 0.1)' },
                    }}
                >
                    <ArrowBack />
                </IconButton>
                <Box>
                    <Typography sx={{ fontWeight: '700', fontSize: '30px', color: '#063455' }}>{isEdit ? 'Edit Payment Account' : 'Create New Payment Account'}</Typography>
                    <Typography sx={{ fontWeight: '600', fontSize: '15px', color: '#063455' }}>Set the account name and link it to a payment method.</Typography>
                </Box>
            </Box>

            <Box sx={{ maxWidth: 900, mx: 'auto', p: 3 }}>
                <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3 }}>
                    <CardContent sx={{ p: 4 }}>
                        <form onSubmit={handleSubmit}>
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        select
                                        label="Status"
                                        fullWidth
                                        value={data.status}
                                        onChange={(e) => setData('status', e.target.value)}
                                        error={!!errors.status}
                                        helperText={errors.status}
                                    >
                                        <MenuItem value="active">Active</MenuItem>
                                        <MenuItem value="inactive">Inactive</MenuItem>
                                    </TextField>
                                </Grid>

                                <Grid item xs={12}>
                                    <TextField
                                        label="Account Name"
                                        fullWidth
                                        required
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        error={!!errors.name}
                                        helperText={errors.name}
                                        placeholder="e.g., HBL POS Machine, Meezan Bank Account, Cash Counter"
                                    />
                                </Grid>

                                <Grid item xs={12}>
                                    <TextField
                                        select
                                        label="Payment Method"
                                        fullWidth
                                        value={data.payment_method}
                                        onChange={(e) => setData('payment_method', e.target.value)}
                                        error={!!errors.payment_method}
                                        helperText={errors.payment_method}
                                    >
                                        <MenuItem value="">Select</MenuItem>
                                        <MenuItem value="cash">Cash</MenuItem>
                                        <MenuItem value="credit_card">Credit Card</MenuItem>
                                        <MenuItem value="debit_card">Debit Card</MenuItem>
                                        <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                                        <MenuItem value="online">Online Transfer</MenuItem>
                                        <MenuItem value="cheque">Cheque</MenuItem>
                                    </TextField>
                                </Grid>

                                <Grid item xs={12}>
                                    <Box display="flex" justifyContent="flex-end" gap={2} mt={2}>
                                        <Link href={route('finance.payment-accounts.index')}>
                                            <Button variant="outlined" sx={{ color: '#063455', border: '1px solid #063455', borderRadius: 2, textTransform: 'none' }}>
                                                Cancel
                                            </Button>
                                        </Link>
                                        <Button type="submit" variant="contained" disabled={processing} startIcon={<Save />} sx={{ bgcolor: '#063455', '&:hover': { bgcolor: '#063455' }, borderRadius: 2, px: 1, textTransform: 'none' }}>
                                            {isEdit ? 'Update Payment Account' : 'Save Payment Account'}
                                        </Button>
                                    </Box>
                                </Grid>
                            </Grid>
                        </form>
                    </CardContent>
                </Card>
            </Box>
        </AdminLayout>
    );
}
