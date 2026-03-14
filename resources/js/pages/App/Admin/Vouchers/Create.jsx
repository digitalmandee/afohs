import React, { useState } from 'react';
import { Box, Typography, Button, Card, CardContent, TextField, MenuItem, Grid, Alert, Divider, IconButton } from '@mui/material';
import { Save as SaveIcon, ArrowBack as BackIcon } from '@mui/icons-material';
import { router } from '@inertiajs/react';
import { useForm } from '@inertiajs/react';
import AsyncSearchTextField from '@/components/AsyncSearchTextField';

const CreateVoucher = () => {
    const { data, setData, post, processing, errors, reset } = useForm({
        voucher_name: '',
        description: '',
        amount: '',
        voucher_type: 'member',
        member_id: '',
        employee_id: '',
        valid_from: '',
        valid_to: '',
        status: 'active',
    });

    const [selectedRecipient, setSelectedRecipient] = useState(null);

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('vouchers.store'), {
            onSuccess: () => {
                // Will redirect automatically on success
            },
        });
    };

    const handleVoucherTypeChange = (type) => {
        setData({
            ...data,
            voucher_type: type,
            member_id: '',
            employee_id: '',
        });
        setSelectedRecipient(null);
    };

    const handleRecipientChange = (event) => {
        const recipient = event.target.value;
        setSelectedRecipient(recipient);

        if (recipient) {
            if (data.voucher_type === 'member') {
                setData('member_id', recipient.id);
            } else {
                setData('employee_id', recipient.id);
            }
        } else {
            setData(data.voucher_type === 'member' ? 'member_id' : 'employee_id', '');
        }
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
            <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 3 }}>
                <IconButton
                    onClick={() => router.visit(route('vouchers.dashboard'))}
                    sx={{
                        mt: 0.5,
                        color: '#063455',
                        '&:hover': { bgcolor: 'rgba(6, 52, 85, 0.1)' }
                    }}
                >
                    <BackIcon />
                </IconButton>
                <Typography sx={{ color: '#063455', fontWeight: '700', fontSize: '30px', mb: 0.5 }}>
                    Create New Voucher
                </Typography>
            </Box>
            <Box sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                // minHeight: '100vh',
                p: 2
            }}>
                <Card sx={{ maxWidth: '600px' }}>
                    <CardContent>
                        <form onSubmit={handleSubmit}>
                            <Grid container spacing={3}>
                                {/* Voucher Type Selection */}
                                <Grid item xs={12}>
                                    <Typography variant="h6" gutterBottom>
                                        Voucher Type
                                    </Typography>
                                    <Alert severity="info" sx={{ mb: 2 }}>
                                        Select whether this voucher is for a Member or Employee. This cannot be changed after creation.
                                    </Alert>
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        select
                                        label="Voucher Type"
                                        value={data.voucher_type}
                                        onChange={(e) => handleVoucherTypeChange(e.target.value)}
                                        error={!!errors.voucher_type}
                                        helperText={errors.voucher_type}
                                        required
                                    >
                                        <MenuItem value="member">Member Voucher</MenuItem>
                                        <MenuItem value="employee">Employee Voucher</MenuItem>
                                    </TextField>
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
                                    </TextField>
                                </Grid>

                                {/* Recipient Selection */}
                                <Grid item xs={12}>
                                    <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                                        Recipient Selection
                                    </Typography>
                                    <Divider sx={{ mb: 2 }} />
                                </Grid>

                                <Grid item xs={12}>
                                    <AsyncSearchTextField
                                        label={`Select ${data.voucher_type === 'member' ? 'Member' : 'Employee'}`}
                                        name="recipient"
                                        value={selectedRecipient}
                                        onChange={handleRecipientChange}
                                        endpoint="admin.api.search-users"
                                        params={{ type: data.voucher_type === 'member' ? '0' : 'employee' }}
                                        placeholder={`Search ${data.voucher_type === 'member' ? 'members' : 'employees'}...`}
                                        resultFormat={(item) => (
                                            <Box>
                                                <Typography variant="body2" fontWeight="bold">
                                                    {item.name}
                                                </Typography>
                                                <Typography variant="caption" color="textSecondary">
                                                    {data.voucher_type === 'member'
                                                        ? `Membership: ${item.membership_no || 'N/A'} | Phone: ${item.phone || 'N/A'}`
                                                        : `Employee ID: ${item.employee_id || 'N/A'} | ${item.designation || 'N/A'}`
                                                    }
                                                </Typography>
                                            </Box>
                                        )}
                                    />
                                    {(errors.member_id || errors.employee_id) && (
                                        <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                                            {errors.member_id || errors.employee_id}
                                        </Typography>
                                    )}
                                </Grid>

                                {/* Voucher Details */}
                                <Grid item xs={12}>
                                    <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                                        Voucher Details
                                    </Typography>
                                    <Divider sx={{ mb: 2 }} />
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        label="Voucher Name"
                                        value={data.voucher_name}
                                        onChange={(e) => setData('voucher_name', e.target.value)}
                                        error={!!errors.voucher_name}
                                        helperText={errors.voucher_name}
                                        placeholder="e.g., Birthday Voucher, Performance Bonus"
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
                                        label="Description (Optional)"
                                        multiline
                                        rows={3}
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        error={!!errors.description}
                                        helperText={errors.description}
                                        placeholder="Add any additional details about this voucher..."
                                    />
                                </Grid>

                                {/* Validity Period */}
                                <Grid item xs={12}>
                                    <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                                        Validity Period
                                    </Typography>
                                    <Divider sx={{ mb: 2 }} />
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
                                        inputProps={{
                                            min: new Date().toISOString().split('T')[0]
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

                                {/* Preview */}
                                {data.voucher_name && data.amount && selectedRecipient && (
                                    <Grid item xs={12}>
                                        <Card variant="outlined" sx={{ backgroundColor: '#f8f9fa', mt: 2 }}>
                                            <CardContent>
                                                <Typography variant="subtitle1" gutterBottom>
                                                    Voucher Preview
                                                </Typography>
                                                <Grid container spacing={2}>
                                                    <Grid item xs={6}>
                                                        <Typography variant="body2" color="text.secondary">
                                                            Voucher Name
                                                        </Typography>
                                                        <Typography variant="body1" fontWeight="bold">
                                                            {data.voucher_name}
                                                        </Typography>
                                                    </Grid>
                                                    <Grid item xs={6}>
                                                        <Typography variant="body2" color="text.secondary">
                                                            Amount
                                                        </Typography>
                                                        <Typography variant="body1" fontWeight="bold" color="primary">
                                                            Rs {parseFloat(data.amount || 0).toFixed(2)}
                                                        </Typography>
                                                    </Grid>
                                                    <Grid item xs={6}>
                                                        <Typography variant="body2" color="text.secondary">
                                                            Recipient
                                                        </Typography>
                                                        <Typography variant="body1">
                                                            {selectedRecipient.name} ({data.voucher_type})
                                                        </Typography>
                                                    </Grid>
                                                    <Grid item xs={6}>
                                                        <Typography variant="body2" color="text.secondary">
                                                            Valid Period
                                                        </Typography>
                                                        <Typography variant="body1">
                                                            {data.valid_from && data.valid_to
                                                                ? `${data.valid_from} to ${data.valid_to}`
                                                                : 'Not set'
                                                            }
                                                        </Typography>
                                                    </Grid>
                                                </Grid>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                )}

                                {/* Action Buttons */}
                                <Grid item xs={12}>
                                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
                                        <Button variant="outlined" onClick={() => router.visit(route('vouchers.dashboard'))} disabled={processing} sx={{ color: '#063455', border: '1px solid #063455', textTransform: 'none' }}>
                                            Cancel
                                        </Button>
                                        <Button type="submit" variant="contained" startIcon={<SaveIcon />} disabled={processing} sx={{ backgroundColor: '#063455', textTransform: 'none' }}>
                                            {processing ? 'Creating...' : 'Create Voucher'}
                                        </Button>
                                    </Box>
                                </Grid>
                            </Grid>
                        </form>
                    </CardContent>
                </Card>
            </Box>
        </Box>
    );
};

export default CreateVoucher;
