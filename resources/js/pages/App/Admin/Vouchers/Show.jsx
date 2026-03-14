import React, { useState } from 'react';
import { Box, Typography, Button, IconButton, Card, CardContent, Grid, Chip, Divider, Alert } from '@mui/material';
import { ArrowBack as BackIcon, Edit as EditIcon, CheckCircle as CheckCircleIcon, Print as PrintIcon } from '@mui/icons-material';
import { router } from '@inertiajs/react';

const ShowVoucher = ({ voucher }) => {

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

    // Format datetime
    const formatDateTime = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
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

    // Check if voucher is expired
    const isExpired = () => {
        return new Date() > new Date(voucher.valid_to);
    };

    // Check if voucher is valid
    const isValid = () => {
        const now = new Date();
        return now >= new Date(voucher.valid_from) && now <= new Date(voucher.valid_to) && !voucher.is_used;
    };

    // Calculate days remaining
    const getDaysRemaining = () => {
        if (isExpired()) return 0;
        const now = new Date();
        const validTo = new Date(voucher.valid_to);
        const diffTime = validTo - now;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    // Mark voucher as used
    const handleMarkAsUsed = () => {
        if (confirm('Are you sure you want to mark this voucher as used?')) {
            router.post(route('vouchers.mark-used', voucher.id));
        }
    };

    return (
        <Box sx={{ p: 3, bgcolor: '#f5f5f5' }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                    
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
                    <Typography
                        sx={{
                            fontWeight: '700',
                            color: '#063455',
                            fontSize:'30px',
                            // mb: 0.5
                        }}
                    >
                        Voucher Details
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button variant="outlined" startIcon={<EditIcon />} onClick={() => router.visit(route('vouchers.edit', voucher.id))} sx={{color:'#fff', bgcolor:'#063455', borderRadius:'16px', textTransform:'none'}}>
                        Edit Voucher
                    </Button>
                    {voucher.status === 'active' && !voucher.is_used && isValid() && (
                        <Button variant="contained" startIcon={<CheckCircleIcon />} onClick={handleMarkAsUsed} sx={{ backgroundColor: '#063455' }}>
                            Mark as Used
                        </Button>
                    )}
                </Box>
            </Box>

            {/* Status Alerts */}
            {voucher.is_used && (
                <Alert severity="info" sx={{ mb: 3 }}>
                    This voucher has been used on {formatDateTime(voucher.used_at)}
                </Alert>
            )}
            {isExpired() && !voucher.is_used && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    This voucher has expired on {formatDate(voucher.valid_to)}
                </Alert>
            )}
            {isValid() && (
                <Alert severity="success" sx={{ mb: 3 }}>
                    This voucher is valid and can be used. {getDaysRemaining()} days remaining.
                </Alert>
            )}

            <Grid container spacing={2}>
                {/* Voucher Information */}
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Typography sx={{color:'#063455', fontWeight:'600', fontSize:'24px'}}>
                                Voucher Information:
                            </Typography>
                            {/* <Divider sx={{ mb: 2 }} /> */}

                            <Grid container spacing={2} sx={{mt:2}}>
                                <Grid item xs={12} sx={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                                    <Typography sx={{color:'#4b4949', fontSize:'16px'}}>
                                        Voucher Code:
                                    </Typography>
                                    <Typography sx={{color:'#063455', fontWeight:'600', fontSize:'16px'}}>
                                        {voucher.voucher_code}
                                    </Typography>
                                </Grid>

                                <Grid item xs={12} sx={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                                    <Typography sx={{color:'#4b4949', fontSize:'16px'}}>
                                        Status:
                                    </Typography>
                                    <Chip
                                        label={voucher.status}
                                        color={getStatusColor(voucher.status)}
                                        size="medium"
                                        sx={{ textTransform: 'capitalize', mt: 0.5 }}
                                    />
                                </Grid>

                                <Grid item xs={12} sx={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                                    <Typography sx={{color:'#4b4949', fontSize:'16px'}}>
                                        Voucher Name:
                                    </Typography>
                                    <Typography sx={{color:'#000', fontWeight:'600', fontSize:'16px'}}>
                                        {voucher.voucher_name}
                                    </Typography>
                                </Grid>

                                {voucher.description && (
                                    <Grid item xs={12} sx={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                                        <Typography sx={{color:'#4b4949', fontSize:'16px'}}>
                                            Description:
                                        </Typography>
                                        <Typography sx={{color:'#000', fontWeight:'600', fontSize:'16px'}}>
                                            {voucher.description}
                                        </Typography>
                                    </Grid>
                                )}

                                <Grid item xs={12} sx={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                                    <Typography sx={{color:'#4b4949', fontSize:'16px'}}>
                                        Amount:
                                    </Typography>
                                    <Typography sx={{color:'#063455', fontWeight:'600', fontSize:'16px'}}>
                                        {formatCurrency(voucher.amount)}
                                    </Typography>
                                </Grid>

                                <Grid item xs={12} sx={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                                    <Typography sx={{color:'#4b4949', fontSize:'16px'}}>
                                        Type:
                                    </Typography>
                                    <Chip
                                        label={voucher.voucher_type}
                                        color={getTypeColor(voucher.voucher_type)}
                                        size="medium"
                                        sx={{ textTransform: 'capitalize', mt: 0.5 }}
                                    />
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Recipient Information */}
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Typography sx={{color:'#063455', fontWeight:'600', fontSize:'24px'}}>
                                Recipient Information:
                            </Typography>
                            {/* <Divider sx={{ mb: 2 }} /> */}

                            <Grid container spacing={2} sx={{mt:2}}>
                                <Grid item xs={12} sx={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                                    <Typography sx={{color:'#4b4949', fontSize:'16px'}}>
                                        Recipient Name:
                                    </Typography>
                                    <Typography sx={{color:'#000', fontWeight:'500', fontSize:'16px'}}>
                                        {voucher.recipient || 'N/A'}
                                    </Typography>
                                </Grid>

                                {voucher.voucher_type === 'member' && voucher.member && (
                                    <>
                                        <Grid item xs={12} sx={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                                            <Typography sx={{color:'#4b4949', fontSize:'16px'}}>
                                                Membership Number:
                                            </Typography>
                                            <Typography sx={{color:'#000', fontWeight:'500', fontSize:'16px'}}>
                                                {voucher.member.membership_no || 'N/A'}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={12} sx={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                                            <Typography sx={{color:'#4b4949', fontSize:'16px'}}>
                                                Phone:
                                            </Typography>
                                            <Typography sx={{color:'#000', fontWeight:'500', fontSize:'16px'}}>
                                                {voucher.member.phone || 'N/A'}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={12} sx={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                                            <Typography sx={{color:'#4b4949', fontSize:'16px'}}>
                                                Email:
                                            </Typography>
                                            <Typography sx={{color:'#000', fontWeight:'500', fontSize:'16px'}}>
                                                {voucher.member.email || 'N/A'}
                                            </Typography>
                                        </Grid>
                                    </>
                                )}

                                {voucher.voucher_type === 'employee' && voucher.employee && (
                                    <>
                                        <Grid item xs={12} sx={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                                            <Typography sx={{color:'#4b4949', fontSize:'16px'}}>
                                                Employee ID:
                                            </Typography>
                                            <Typography sx={{color:'#000', fontWeight:'500', fontSize:'16px'}}>
                                                {voucher.employee.employee_id || 'N/A'}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={12} sx={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                                            <Typography sx={{color:'#4b4949', fontSize:'16px'}}>
                                                Designation:
                                            </Typography>
                                            <Typography sx={{color:'#000', fontWeight:'500', fontSize:'16px'}}>
                                                {voucher.employee.designation || 'N/A'}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={12} sx={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                                            <Typography sx={{color:'#4b4949', fontSize:'16px'}}>
                                                Email:
                                            </Typography>
                                            <Typography sx={{color:'#000', fontWeight:'500', fontSize:'16px'}}>
                                                {voucher.employee.email || 'N/A'}
                                            </Typography>
                                        </Grid>
                                    </>
                                )}
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Validity Information */}
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Typography sx={{color:'#063455', fontWeight:'600', fontSize:'24px'}}>
                                Validity Information:
                            </Typography>
                            {/* <Divider sx={{ mb: 2 }} /> */}

                            <Grid container spacing={2} sx={{mt:2}}>
                                <Grid item xs={12} sx={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                                    <Typography sx={{color:'#4b4949', fontSize:'16px'}}>
                                        Valid From:
                                    </Typography>
                                    <Typography sx={{color:'#000', fontWeight:'500', fontSize:'16px'}}>
                                        {formatDate(voucher.valid_from)}
                                    </Typography>
                                </Grid>

                                <Grid item xs={12} sx={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                                    <Typography sx={{color:'#4b4949', fontSize:'16px'}}>
                                        Valid To:
                                    </Typography>
                                    <Typography sx={{color:'#000', fontWeight:'500', fontSize:'16px'}}>
                                        {formatDate(voucher.valid_to)}
                                    </Typography>
                                </Grid>

                                <Grid item xs={12} sx={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                                    <Typography sx={{color:'#4b4949', fontSize:'16px'}}>
                                        Days Remaining:
                                    </Typography>
                                    <Typography color={getDaysRemaining() > 7 ? 'success.main' : getDaysRemaining() > 0 ? 'warning.main' : 'error.main'}>
                                        {getDaysRemaining()} days
                                    </Typography>
                                </Grid>

                                <Grid item xs={12} sx={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                                    <Typography sx={{color:'#4b4949', fontSize:'16px'}}>
                                        Is Used:
                                    </Typography>
                                    <Chip
                                        label={voucher.is_used ? 'Yes' : 'No'}
                                        color={voucher.is_used ? 'info' : 'default'}
                                        size="small"
                                        sx={{ mt: 0.5 }}
                                    />
                                </Grid>

                                {voucher.is_used && (
                                    <Grid item xs={12} sx={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                                        <Typography sx={{color:'#4b4949', fontSize:'16px'}}>
                                            Used At:
                                        </Typography>
                                        <Typography sx={{color:'#000', fontWeight:'500', fontSize:'16px'}}>
                                            {formatDateTime(voucher.used_at)}
                                        </Typography>
                                    </Grid>
                                )}
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>

                {/* System Information */}
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Typography sx={{color:'#063455', fontWeight:'600', fontSize:'24px'}}>
                                System Information:
                            </Typography>
                            {/* <Divider sx={{ mb: 2 }} /> */}

                            <Grid container spacing={2} sx={{mt:2}}>
                                <Grid item xs={12} sx={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                                    <Typography sx={{color:'#4b4949', fontSize:'16px'}}>
                                        Created By:
                                    </Typography>
                                    <Typography sx={{color:'#000', fontWeight:'500', fontSize:'16px'}}>
                                        {voucher.created_by ? voucher.created_by.name : 'System'}
                                    </Typography>
                                </Grid>

                                <Grid item xs={12} sx={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                                    <Typography sx={{color:'#4b4949', fontSize:'16px'}}>
                                        Created At:
                                    </Typography>
                                    <Typography sx={{color:'#000', fontWeight:'500', fontSize:'16px'}}>
                                        {formatDateTime(voucher.created_at)}
                                    </Typography>
                                </Grid>

                                {voucher.updated_by && (
                                    <>
                                        <Grid item xs={12} sx={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                                            <Typography sx={{color:'#4b4949', fontSize:'16px'}}>
                                                Last Updated By:
                                            </Typography>
                                            <Typography sx={{color:'#000', fontWeight:'500', fontSize:'16px'}}>
                                                {voucher.updated_by.name}
                                            </Typography>
                                        </Grid>

                                        <Grid item xs={12} sx={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                                            <Typography sx={{color:'#4b4949', fontSize:'16px'}}>
                                                Updated At:
                                            </Typography>
                                            <Typography sx={{color:'#000', fontWeight:'500', fontSize:'16px', display:'flex', flexWrap:'wrap', ml:5}}>
                                                {formatDateTime(voucher.updated_at)}
                                            </Typography>
                                        </Grid>
                                    </>
                                )}
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default ShowVoucher;
