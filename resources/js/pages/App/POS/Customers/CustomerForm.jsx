import POSLayout from "@/components/POSLayout";
import AsyncSearchTextField from '@/components/AsyncSearchTextField';
import { router, useForm } from '@inertiajs/react';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { Box, Button, Chip, Grid, IconButton, MenuItem, TextField, Typography } from '@mui/material';
import React from 'react';

const genderOptions = ['male', 'female', 'other'];

const renderMemberWithStatus = (option) => (
    <Box sx={{ width: '100%' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="body2" fontWeight="bold">
                {option.membership_no || option.customer_no || option.employee_id}
            </Typography>
            {option.status && (
                <Chip
                    label={option.status}
                    size="small"
                    sx={{
                        height: '20px',
                        fontSize: '10px',
                        backgroundColor: option.status === 'active' ? '#e8f5e9' : option.status === 'suspended' ? '#fff3e0' : '#ffebee',
                        color: option.status === 'active' ? '#2e7d32' : option.status === 'suspended' ? '#ef6c00' : '#c62828',
                        textTransform: 'capitalize',
                        ml: 1,
                    }}
                />
            )}
        </Box>
        <Typography variant="caption" color="text.secondary">
            {option.name}
        </Typography>
    </Box>
);

const CustomerForm = ({ customer = {}, customerNo, guestTypes = [], isEdit = false }) => {
    const { data, setData, post, put, processing, errors } = useForm({
        customer_no: customer.customer_no || customerNo || '',
        name: customer.name || '',
        address: customer.address || '',
        gender: customer.gender || '',
        cnic: customer.cnic || '',
        contact: customer.contact || '',
        email: customer.email || '',
        guest_type_id: customer.guest_type_id || '',
        member_name: customer.member_name || '',
        member_no: customer.member_no || '',
        guest: customer.member_name ? { name: customer.member_name, label: customer.member_name, membership_no: customer.member_no } : null,
    });

    const handleChange = (e) => {
        const newData = e.target.value;
        setData('member_name', newData?.name);
        setData('member_no', newData?.membership_no);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        isEdit ? put(route('pos.customers.update', customer.id)) : post(route('pos.customers.store'));
    };

    return (
        <>
            <Box
                sx={{
                    minHeight: '100vh',
                    p: 2,
                    bgcolor: '#f5f5f5',
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <IconButton onClick={() => router.visit(route('pos.customers.index'))}>
                        <ArrowBackIcon sx={{ color: '#063455' }} />
                    </IconButton>
                    <Typography sx={{ fontWeight: 600, color: '#063455', fontSize: '30px' }}>{isEdit ? 'Edit Customer' : 'Add Customer'}</Typography>
                </Box>

                <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 600, mx: 'auto', mt: 3, bgcolor: '#fff', p: 3 }}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Customer No"
                                margin="normal"
                                value={data.customer_no}
                                disabled
                                error={!!errors.customer_no}
                                helperText={errors.customer_no}
                                sx={{
                                    width: '100%',
                                    '& .MuiInputBase-root': {
                                        height: 35,
                                        display: 'flex',
                                        alignItems: 'center',
                                    },
                                    '& .MuiSelect-select': {
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: '0 14px !important',
                                        height: '100%',
                                        boxSizing: 'border-box',
                                    },
                                    '& legend': {
                                        display: 'none',
                                    },
                                    '& label': {
                                        top: '-10px',
                                    },
                                }}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Name*"
                                margin="normal"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                error={!!errors.name}
                                helperText={errors.name}
                                sx={{
                                    width: '100%',
                                    '& .MuiInputBase-root': {
                                        height: 35,
                                        display: 'flex',
                                        alignItems: 'center',
                                    },
                                    '& .MuiSelect-select': {
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: '0 14px !important',
                                        height: '100%',
                                        boxSizing: 'border-box',
                                    },
                                    '& legend': {
                                        display: 'none',
                                    },
                                    '& label': {
                                        top: '-10px',
                                    },
                                }}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Contact*"
                                margin="normal"
                                placeholder="03XXXXXXXX"
                                value={data.contact}
                                onChange={(e) => setData('contact', e.target.value.replace(/[^0-9+\-]/g, ''))}
                                error={!!errors.contact}
                                helperText={errors.contact}
                                sx={{
                                    width: '100%',
                                    '& .MuiInputBase-root': {
                                        height: 35,
                                        display: 'flex',
                                        alignItems: 'center',
                                    },
                                    '& .MuiSelect-select': {
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: '0 14px !important',
                                        height: '100%',
                                        boxSizing: 'border-box',
                                    },
                                    '& legend': {
                                        display: 'none',
                                    },
                                    '& label': {
                                        top: '-10px',
                                    },
                                }}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                select
                                label="Gender*"
                                margin="normal"
                                value={data.gender}
                                onChange={(e) => setData('gender', e.target.value)}
                                error={!!errors.gender}
                                helperText={errors.gender}
                                sx={{
                                    width: '100%',
                                    '& .MuiInputBase-root': {
                                        height: 35,
                                        display: 'flex',
                                        alignItems: 'center',
                                    },
                                    '& .MuiSelect-select': {
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: '0 14px !important',
                                        height: '100%',
                                        boxSizing: 'border-box',
                                    },
                                    '& legend': {
                                        display: 'none',
                                    },
                                    '& label': {
                                        top: '-10px',
                                    },
                                }}
                            >
                                {genderOptions.map((option) => (
                                    <MenuItem key={option} value={option}>
                                        {option}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Address"
                                margin="normal"
                                value={data.address}
                                onChange={(e) => setData('address', e.target.value)}
                                sx={{
                                    width: '100%',
                                    '& .MuiInputBase-root': {
                                        height: 35,
                                        display: 'flex',
                                        alignItems: 'center',
                                    },
                                    '& .MuiSelect-select': {
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: '0 14px !important',
                                        height: '100%',
                                        boxSizing: 'border-box',
                                    },
                                    '& legend': {
                                        display: 'none',
                                    },
                                    '& label': {
                                        top: '-10px',
                                    },
                                }}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="CNIC"
                                margin="normal"
                                placeholder="XXXXX-XXXXXXX-X"
                                value={data.cnic}
                                onChange={(e) => {
                                    let value = e.target.value.replace(/\D/g, '');
                                    if (value.length > 5 && value[5] !== '-') value = value.slice(0, 5) + '-' + value.slice(5);
                                    if (value.length > 13 && value[13] !== '-') value = value.slice(0, 13) + '-' + value.slice(13);
                                    if (value.length > 15) value = value.slice(0, 15);
                                    setData('cnic', value);
                                }}
                                sx={{
                                    width: '100%',
                                    '& .MuiInputBase-root': {
                                        height: 35,
                                        display: 'flex',
                                        alignItems: 'center',
                                    },
                                    '& .MuiSelect-select': {
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: '0 14px !important',
                                        height: '100%',
                                        boxSizing: 'border-box',
                                    },
                                    '& legend': {
                                        display: 'none',
                                    },
                                    '& label': {
                                        top: '-10px',
                                    },
                                }}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Email"
                                margin="normal"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                sx={{
                                    width: '100%',
                                    '& .MuiInputBase-root': {
                                        height: 35,
                                        display: 'flex',
                                        alignItems: 'center',
                                    },
                                    '& .MuiSelect-select': {
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: '0 14px !important',
                                        height: '100%',
                                        boxSizing: 'border-box',
                                    },
                                    '& legend': {
                                        display: 'none',
                                    },
                                    '& label': {
                                        top: '-10px',
                                    },
                                }}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                select
                                label="Guest Type*"
                                margin="normal"
                                value={data.guest_type_id}
                                onChange={(e) => setData('guest_type_id', e.target.value)}
                                error={!!errors.guest_type_id}
                                helperText={errors.guest_type_id}
                                sx={{
                                    width: '100%',
                                    '& .MuiInputBase-root': {
                                        height: 35,
                                        display: 'flex',
                                        alignItems: 'center',
                                    },
                                    '& .MuiSelect-select': {
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: '0 14px !important',
                                        height: '100%',
                                        boxSizing: 'border-box',
                                    },
                                    '& legend': {
                                        display: 'none',
                                    },
                                    '& label': {
                                        top: '-10px',
                                    },
                                }}
                            >
                                {guestTypes.map((type) => (
                                    <MenuItem key={type.id} value={type.id}>
                                        {type.name}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <Box
                                sx={{
                                    width: '100%',
                                    '& .MuiInputBase-root': { height: 40, alignItems: 'center' },
                                    '& .MuiInputBase-input': { padding: '0 14px' },
                                    '& label': {
                                        top: '-10px',
                                    },
                                }}
                            >
                                <AsyncSearchTextField
                                    label="Member Name"
                                    name="guest"
                                    value={data.guest}
                                    onChange={handleChange}
                                    endpoint="pos.api.users.global-search"
                                    params={{ type: '0' }}
                                    placeholder="Search members..."
                                    fullWidth
                                    renderItem={renderMemberWithStatus}
                                />
                            </Box>
                        </Grid>

                        <Grid item xs={12} sm={6} sx={{ mt: -1.4 }}>
                            <TextField
                                fullWidth
                                label="Member No"
                                margin="normal"
                                value={data.member_no}
                                onChange={(e) => setData('member_no', e.target.value)}
                                disabled
                                sx={{
                                    width: '100%',
                                    '& .MuiInputBase-root': {
                                        height: 35,
                                        display: 'flex',
                                        alignItems: 'center',
                                    },
                                    '& .MuiSelect-select': {
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: '0 14px !important',
                                        height: '100%',
                                        boxSizing: 'border-box',
                                    },
                                    '& legend': {
                                        display: 'none',
                                    },
                                    '& label': {
                                        top: '-10px',
                                    },
                                }}
                            />
                        </Grid>
                    </Grid>

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button type="submit" variant="contained" disabled={processing}>
                            {isEdit ? 'Update' : 'Save'}
                        </Button>
                    </Box>
                </Box>
            </Box>
        </>
    );
};

export default CustomerForm;


CustomerForm.layout = (page) => <POSLayout>{page}</POSLayout>;
