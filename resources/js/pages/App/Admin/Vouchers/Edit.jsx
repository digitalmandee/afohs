import React, { useState } from 'react';
import { Box, Typography, IconButton, Button, Card, CardContent, TextField, MenuItem, Grid, Alert, Divider, Chip } from '@mui/material';
import { Save as SaveIcon, ArrowBack as BackIcon } from '@mui/icons-material';
import { router } from '@inertiajs/react';
import { useForm } from '@inertiajs/react';

const EditVoucher = ({ voucher }) => {
    const { data, setData, put, processing, errors, reset } = useForm({
        voucher_name: voucher.voucher_name || '',
        description: voucher.description || '',
        amount: voucher.amount || '',
        valid_from: voucher.valid_from || '',
        valid_to: voucher.valid_to || '',
        status: voucher.status || 'active',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route('vouchers.update', voucher.id), {
            onSuccess: () => {
                // Will redirect automatically on success
            },
        });
    };

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-PK', {
            style: 'currency',
            currency: 'PKR',
        })
            .format(amount)
            .replace('PKR', 'Rs');
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // Get status color
    const getStatusColor = (status) => {
        switch (status) {
            case 'active':
                return 'success';
            case 'inactive':
                return 'default';
            case 'expired':
                return 'error';
            case 'used':
                return 'info';
            default:
                return 'default';
        }
    };

    // Get voucher type color
    const getTypeColor = (type) => {
        return type === 'member' ? 'primary' : 'secondary';
    };

    // Calculate minimum valid_to date (1 day after valid_from)
    const getMinValidToDate = () => {
        if (!data.valid_from) return '';
        const validFrom = new Date(data.valid_from);
        validFrom.setDate(validFrom.getDate() + 1);
        return validFrom.toISOString().split('T')[0];
    };

    return (
        <Box sx={{ p: 3, bgcolor: '#f5f5f5' }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <IconButton
                    onClick={() => router.visit(route('vouchers.dashboard'))}
                    sx={{
                        mt: 0.5,
                        color: '#063455',
                        '&:hover': { bgcolor: 'rgba(6, 52, 85, 0.1)' },
                    }}
                >
                    <BackIcon />
                </IconButton>
                <Typography sx={{ color: '#063455', fontSize: '30px', fontWeight: '700' }}>
                    Edit Voucher
                    {/* - {voucher.voucher_code} */}
                </Typography>
            </Box>

            <Grid container spacing={3}>
                {/* Voucher Information Card */}
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Typography sx={{ color: '#063455', fontWeight: '600', fontSize: '24px' }}>
                                Voucher Information
                            </Typography>
                            <Divider sx={{ mb: 2 }} />

                            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography sx={{ color: '#4b4949', fontSize: '16px' }}>
                                    Voucher Code:
                                </Typography>
                                <Typography sx={{ color: '#063455', fontWeight: '600', fontSize: '16px' }}>
                                    {voucher.voucher_code}
                                </Typography>
                            </Box>

                            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography sx={{ color: '#4b4949', fontSize: '16px' }}>
                                    Type:
                                </Typography>
                                <Chip
                                    label={voucher.voucher_type}
                                    color={getTypeColor(voucher.voucher_type)}
                                    size="small"
                                    sx={{ textTransform: 'capitalize', mt: 0.5 }}
                                />
                            </Box>

                            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography sx={{ color: '#4b4949', fontSize: '16px' }}>
                                    Current Status:
                                </Typography>
                                <Chip
                                    label={voucher.status}
                                    color={getStatusColor(voucher.status)}
                                    size="small"
                                    sx={{ textTransform: 'capitalize', mt: 0.5 }}
                                />
                            </Box>

                            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography sx={{ color: '#4b4949', fontSize: '16px' }}>
                                    Recipient:
                                </Typography>
                                <Typography sx={{ color: '#063455', fontWeight: '600', fontSize: '16px' }}>
                                    {voucher.recipient}
                                </Typography>
                                <Typography sx={{ color: '#063455', fontWeight: '600', fontSize: '16px' }}>
                                    {voucher.voucher_type === 'member' && voucher.member
                                        ? `Membership: ${voucher.member.membership_no || 'N/A'}`
                                        : voucher.voucher_type === 'employee' && voucher.employee
                                            ? `Employee ID: ${voucher.employee.employee_id || 'N/A'}`
                                            : 'N/A'
                                    }
                                </Typography>
                            </Box>

                            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography sx={{ color: '#4b4949', fontSize: '16px' }}>
                                    Created By:
                                </Typography>
                                <Typography sx={{ color: '#063455', fontWeight: '600', fontSize: '16px' }}>
                                    {voucher.created_by ? voucher.created_by.name : 'System'}
                                </Typography>
                                <Typography sx={{ color: '#063455', fontWeight: '600', fontSize: '16px' }}>
                                    {formatDate(voucher.created_at)}
                                </Typography>
                            </Box>

                            {voucher.is_used && (
                                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography sx={{ color: '#4b4949', fontSize: '16px' }}>
                                        Used At:
                                    </Typography>
                                    <Typography sx={{ color: '#063455', fontWeight: '600', fontSize: '16px' }}>
                                        {formatDate(voucher.used_at)}
                                    </Typography>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Edit Form */}
                <Grid item xs={12} md={8}>
                    <Card>
                        <CardContent>
                            <Typography sx={{ color: '#063455', fontWeight: '600', fontSize: '24px' }}>
                                Edit Voucher Details
                            </Typography>
                            <Divider sx={{ mb: 3 }} />

                            <Alert severity="warning" sx={{ mb: 3 }}>
                                Note: Voucher type and recipient cannot be changed after creation. Only voucher details, validity period, and status can be modified.
                            </Alert>

                            <form onSubmit={handleSubmit}>
                                <Grid container spacing={3}>
                                    {/* Voucher Details */}
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            fullWidth
                                            label="Voucher Name"
                                            value={data.voucher_name}
                                            onChange={(e) => setData('voucher_name', e.target.value)}
                                            error={!!errors.voucher_name}
                                            helperText={errors.voucher_name}
                                            required
                                        />
                                    </Grid>

                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            fullWidth
                                            label="Amount (PKR)"
                                            type="number"
                                            value={data.amount}
                                            onChange={(e) => setData('amount', e.target.value)}
                                            error={!!errors.amount}
                                            helperText={errors.amount}
                                            inputProps={{ min: 0.01, step: 0.01 }}
                                            required
                                        />
                                    </Grid>

                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            label="Description"
                                            multiline
                                            rows={3}
                                            value={data.description}
                                            onChange={(e) => setData('description', e.target.value)}
                                            error={!!errors.description}
                                            helperText={errors.description}
                                        />
                                    </Grid>

                                    {/* Validity Period */}
                                    <Grid item xs={12}>
                                        <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                                            Validity Period
                                        </Typography>
                                    </Grid>

                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            fullWidth
                                            label="Valid From"
                                            type="date"
                                            value={data.valid_from}
                                            onChange={(e) => setData('valid_from', e.target.value)}
                                            error={!!errors.valid_from}
                                            helperText={errors.valid_from}
                                            InputLabelProps={{
                                                shrink: true,
                                            }}
                                            required
                                        />
                                    </Grid>

                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            fullWidth
                                            label="Valid To"
                                            type="date"
                                            value={data.valid_to}
                                            onChange={(e) => setData('valid_to', e.target.value)}
                                            error={!!errors.valid_to}
                                            helperText={errors.valid_to}
                                            InputLabelProps={{
                                                shrink: true,
                                            }}
                                            inputProps={{
                                                min: getMinValidToDate()
                                            }}
                                            required
                                        />
                                    </Grid>

                                    {/* Status */}
                                    <Grid item xs={12}>
                                        <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                                            Status Management
                                        </Typography>
                                    </Grid>

                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            fullWidth
                                            select
                                            label="Status"
                                            value={data.status}
                                            onChange={(e) => setData('status', e.target.value)}
                                            error={!!errors.status}
                                            helperText={errors.status}
                                        >
                                            <MenuItem value="active">Active</MenuItem>
                                            <MenuItem value="inactive">Inactive</MenuItem>
                                            <MenuItem value="expired">Expired</MenuItem>
                                            <MenuItem value="used">Used</MenuItem>
                                        </TextField>
                                    </Grid>

                                    {/* Preview */}
                                    {data.voucher_name && data.amount && (
                                        // <Grid item xs={12}>
                                        //     <Card variant="outlined" sx={{ backgroundColor: '#f8f9fa', mt: 2 }}>
                                        //         <CardContent>
                                        //             <Typography sx={{ color: '#063455', fontWeight: 600, fontSize: '16px' }}>
                                        //                 Updated Voucher Preview
                                        //             </Typography>
                                        //             <Grid container spacing={2}>
                                        //                 <Grid item xs={6} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        //                     <Typography sx={{ color: '#4b4949', fontSize: '16px' }}>
                                        //                         Voucher Name:
                                        //                     </Typography>
                                        //                     <Typography variant="body1" fontWeight="bold">
                                        //                         {data.voucher_name}
                                        //                     </Typography>
                                        //                 </Grid>
                                        //                 <Grid item xs={6} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        //                     <Typography sx={{ color: '#4b4949', fontSize: '16px' }}>
                                        //                         Amount:
                                        //                     </Typography>
                                        //                     <Typography variant="body1" fontWeight="bold" color="primary">
                                        //                         Rs {parseFloat(data.amount || 0).toFixed(2)}
                                        //                     </Typography>
                                        //                 </Grid>
                                        //                 <Grid item xs={6} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        //                     <Typography sx={{ color: '#4b4949', fontSize: '16px' }}>
                                        //                         Status:
                                        //                     </Typography>
                                        //                     <Chip
                                        //                         label={data.status}
                                        //                         color={getStatusColor(data.status)}
                                        //                         size="small"
                                        //                         sx={{ textTransform: 'capitalize' }}
                                        //                     />
                                        //                 </Grid>
                                        //                 <Grid item xs={6} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        //                     <Typography sx={{ color: '#4b4949', fontSize: '16px' }}>
                                        //                         Valid Period:
                                        //                     </Typography>
                                        //                     <Typography variant="body1">
                                        //                         {data.valid_from && data.valid_to
                                        //                             ? `${data.valid_from} to ${data.valid_to}`
                                        //                             : 'Not set'
                                        //                         }
                                        //                     </Typography>
                                        //                 </Grid>
                                        //             </Grid>
                                        //         </CardContent>
                                        //     </Card>
                                        // </Grid>
                                        <Grid item xs={12}>
                                            <Card variant="outlined" sx={{ backgroundColor: '#f8f9fa', mt: 2 }}>
                                                <CardContent>
                                                    <Typography sx={{ color: '#063455', fontWeight: 600, fontSize: '16px' }}>
                                                        Updated Voucher Preview
                                                    </Typography>

                                                    {/* Row 1: Voucher Name | Divider | Amount */}
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, my: 2 }}>
                                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flex: 1 }}>
                                                            <Typography sx={{ color: '#4b4949', fontSize: '16px' }}>
                                                                Voucher Name:
                                                            </Typography>
                                                            <Typography variant="body1" fontWeight="bold">
                                                                {data.voucher_name}
                                                            </Typography>
                                                        </Box>
                                                        <Divider orientation="vertical" flexItem sx={{ height: 24 }} />
                                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flex: 1 }}>
                                                            <Typography sx={{ color: '#4b4949', fontSize: '16px' }}>
                                                                Amount:
                                                            </Typography>
                                                            <Typography variant="body1" fontWeight="bold" color="primary">
                                                                Rs {parseFloat(data.amount || 0).toFixed(2)}
                                                            </Typography>
                                                        </Box>
                                                    </Box>

                                                    {/* Row 2: Status | Divider | Valid Period */}
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flex: 1 }}>
                                                            <Typography sx={{ color: '#4b4949', fontSize: '16px' }}>
                                                                Status:
                                                            </Typography>
                                                            <Chip
                                                                label={data.status}
                                                                color={getStatusColor(data.status)}
                                                                size="small"
                                                                sx={{ textTransform: 'capitalize' }}
                                                            />
                                                        </Box>
                                                        <Divider orientation="vertical" flexItem sx={{ height: 24 }} />
                                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flex: 1 }}>
                                                            <Typography sx={{ color: '#4b4949', fontSize: '16px' }}>
                                                                Valid Period:
                                                            </Typography>
                                                            <Typography variant="body1">
                                                                {data.valid_from && data.valid_to
                                                                    ? `${data.valid_from} to ${data.valid_to}`
                                                                    : 'Not set'
                                                                }
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    )}
                                    {/* Action Buttons */}
                                    <Grid item xs={12}>
                                        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
                                            <Button variant="outlined" onClick={() => router.visit(route('vouchers.dashboard'))} disabled={processing}
                                                sx={{ color: '#063455', border: '1px solid #063455', textTransform: 'none' }}>
                                                Cancel
                                            </Button>
                                            <Button type="submit" variant="contained" startIcon={<SaveIcon />} disabled={processing} sx={{ backgroundColor: '#063455', textTransform: 'none' }}>
                                                {processing ? 'Updating...' : 'Update Voucher'}
                                            </Button>
                                        </Box>
                                    </Grid>
                                </Grid>
                            </form>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default EditVoucher;
