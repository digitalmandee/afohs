import React, { useEffect } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import { Box, Button, Card, CardContent, IconButton, Grid, TextField, Typography, FormControlLabel, Switch, MenuItem, Alert, Divider } from '@mui/material';
import { Save, ArrowBack, Lock, LockOpen } from '@mui/icons-material';
import AdminLayout from '@/layouts/AdminLayout';

export default function Create({ item }) {
    const isEdit = !!item;

    const { data, setData, post, put, processing, errors } = useForm({
        name: item?.name || '',
        default_amount: item?.default_amount || '',
        is_fixed: item?.is_fixed ? true : false,
        status: item?.status || 'active',
        // Preserve other fields if needed, but only editing these
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isEdit) {
            put(route('finance.charge-types.update', item.id));
        } else {
            post(route('finance.charge-types.store'));
        }
    };

    return (
        <AdminLayout>
            <Head title={isEdit ? `Edit Charge Type: ${item.name}` : 'Create Charge Type'} />
            {/* <Link href={route('finance.charge-types.index')}>
                <Button startIcon={<ArrowBack />} sx={{ mb: 2, textTransform: 'none' }}>
                    Back to List
                </Button>
            </Link>
            <Box mb={3}>
                <Typography sx={{ fontWeight: '700', fontSize: '30px', color: '#063455' }}>
                    {isEdit ? 'Edit Charge Type' : 'Create New Charge Type'}
                </Typography>
                <Typography sx={{ fontWeight: '600', fontSize: '15px', color: '#063455' }}>
                    Configure the fee name, default pricing, and whether the price should be locked for cashiers.
                </Typography>
            </Box> */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', pt:2.5, pl:2 }}>
                <IconButton
                    href={route('finance.charge-types.index')}
                    sx={{
                        mt: 0.5,
                        color: '#063455',
                        '&:hover': { bgcolor: 'rgba(6, 52, 85, 0.1)' }
                    }}
                >
                    <ArrowBack />
                </IconButton>
                <Box>
                    <Typography sx={{ fontWeight: '700', fontSize: '30px', color: '#063455' }}>
                        {isEdit ? 'Edit Charge Type' : 'Create New Charge Type'}
                    </Typography>
                    <Typography sx={{ fontWeight: '600', fontSize: '15px', color: '#063455' }}>
                        Configure the fee name, default pricing, and whether the price should be locked for cashiers.
                    </Typography>
                </Box>
            </Box>
            <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>

                <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3 }}>
                    <CardContent sx={{ p: 4 }}>
                        <form onSubmit={handleSubmit}>
                            <Grid container spacing={3}>
                                {/* Name */}
                                <Grid item xs={12}>
                                    <TextField label="Charge Type Name" fullWidth required value={data.name} onChange={(e) => setData('name', e.target.value)} error={!!errors.name} helperText={errors.name} placeholder="e.g., Gym Fee, Guest Entry, Locker Rent" />
                                </Grid>

                                {/* Default Amount */}
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        label="Default Amount (Optional)"
                                        fullWidth
                                        type="number"
                                        value={data.default_amount}
                                        onChange={(e) => setData('default_amount', e.target.value)}
                                        error={!!errors.default_amount}
                                        helperText={errors.default_amount || 'Leave empty for 0 or variable pricing.'}
                                        InputProps={{
                                            startAdornment: (
                                                <Typography color="text.secondary" sx={{ mr: 1 }}>
                                                    Rs
                                                </Typography>
                                            ),
                                        }}
                                    />
                                </Grid>

                                {/* Status */}
                                <Grid item xs={12} md={6}>
                                    <TextField select label="Status" fullWidth value={data.status} onChange={(e) => setData('status', e.target.value)} error={!!errors.status} helperText={errors.status}>
                                        <MenuItem value="active">Active</MenuItem>
                                        <MenuItem value="inactive">Inactive</MenuItem>
                                    </TextField>
                                </Grid>

                                <Grid item xs={12}>
                                    <Divider />
                                </Grid>

                                {/* Is Fixed Toggle */}
                                <Grid item xs={12}>
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, p: 2, bgcolor: data.is_fixed ? '#fff7ed' : '#f0fdf4', borderRadius: 2, border: '1px solid', borderColor: data.is_fixed ? '#fed7aa' : '#bbf7d0' }}>
                                        <Box sx={{ mt: 0.5, color: data.is_fixed ? 'warning.main' : 'success.main' }}>{data.is_fixed ? <Lock /> : <LockOpen />}</Box>
                                        <Box flexGrow={1}>
                                            <FormControlLabel control={<Switch checked={data.is_fixed} onChange={(e) => setData('is_fixed', e.target.checked)} color="warning" />} label={<Typography fontWeight="bold">Fixed Price Mode</Typography>} />
                                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                                {data.is_fixed ? 'When enabled, the amount field will be LOCKED (Read-Only) for cashiers. They cannot change the price.' : 'When disabled, cashiers can edit the price freely (Dynamic Pricing).'}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Grid>

                                {/* Submit */}
                                <Grid item xs={12}>
                                    <Box display="flex" justifyContent="flex-end" gap={2} mt={2}>
                                        <Link href={route('finance.charge-types.index')}>
                                            <Button variant="outlined" sx={{ color: '#063455', border: '1px solid #063455', borderRadius: 2, textTransform: 'none' }}>
                                                Cancel
                                            </Button>
                                        </Link>
                                        <Button
                                            type="submit"
                                            variant="contained"
                                            disabled={processing}
                                            startIcon={<Save />}
                                            sx={{
                                                bgcolor: '#063455',
                                                '&:hover': { bgcolor: '#063455' },
                                                borderRadius: 2,
                                                px: 1,
                                                textTransform: 'none'
                                            }}
                                        >
                                            {isEdit ? 'Update Charge Type' : 'Save Charge Type'}
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
