import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, IconButton, Button, Grid, Box, TextField, MenuItem, CircularProgress, Typography, Chip } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import axios from 'axios';
import { usePage } from '@inertiajs/react';
import AsyncSearchTextField from '@/components/AsyncSearchTextField';
import { enqueueSnackbar } from 'notistack';

// Helper function to render member with status
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

const genderOptions = ['male', 'female', 'other'];

const GuestCreateModal = ({ open, onClose, onSuccess, guestTypes = [], storeRouteName = 'guests.store', memberSearchRouteName = 'admin.api.search-users', memberSearchParams = { type: '0' } }) => {
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const [formData, setFormData] = useState({
        name: '',
        contact: '',
        gender: '',
        email: '',
        cnic: '',
        address: '',
        guest_type_id: '',
        member_name: '',
        member_no: '',
        guest: null, // For AsyncSearchTextField
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleMemberSelect = (e) => {
        // AsyncSearchTextField passes {target: {value: item}} or similar object?
        // In CustomerForm: onChange={handleChange} -> setData('member_name', newData?.name);
        // Let's verify AsyncSearchTextField usage.
        // In CustomerForm: <AsyncSearchTextField ... onChange={handleChange} ... />
        // And handleChange: const newData = e.target.value;

        const newData = e.target.value;
        setFormData((prev) => ({
            ...prev,
            guest: newData,
            member_name: newData?.name || '',
            member_no: newData?.membership_no || '',
        }));
    };

    const handleSubmit = async () => {
        setLoading(true);
        setErrors({});

        try {
            const response = await axios.post(route(storeRouteName), formData, {
                headers: {
                    Accept: 'application/json',
                },
            });

            if (response.data.success) {
                enqueueSnackbar('Guest created successfully', { variant: 'success' });
                onSuccess(response.data.customer);
                onClose();
                // Reset form
                setFormData({
                    name: '',
                    contact: '',
                    gender: '',
                    email: '',
                    cnic: '',
                    address: '',
                    guest_type_id: '',
                    member_name: '',
                    member_no: '',
                    guest: null,
                });
            }
        } catch (error) {
            console.error('Error creating guest:', error);
            if (error.response && error.response.status === 422) {
                setErrors(error.response.data.errors);
            } else {
                enqueueSnackbar('Error creating guest', { variant: 'error' });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#063455', color: '#fff' }}>
                Add New Customer
                <IconButton onClick={onClose} sx={{ color: '#fff' }}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent sx={{ mt: 2 }}>
                <Box component="form" noValidate autoComplete="off">
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12} sm={6}>
                            <TextField size='small' fullWidth label="Name*" name="name" value={formData.name} onChange={handleChange} error={!!errors.name} helperText={errors.name && errors.name[0]} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField size='small' fullWidth label="Contact*" name="contact" placeholder="03XXXXXXXX" value={formData.contact} onChange={(e) => handleChange({ target: { name: 'contact', value: e.target.value.replace(/[^0-9+\-]/g, '') } })} error={!!errors.contact} helperText={errors.contact && errors.contact[0]} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField size='small' fullWidth select label="Gender*" name="gender" value={formData.gender} onChange={handleChange} error={!!errors.gender} helperText={errors.gender && errors.gender[0]}>
                                {genderOptions.map((option) => (
                                    <MenuItem key={option} value={option}>
                                        {option}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField size='small' fullWidth label="Email" name="email" value={formData.email} onChange={handleChange} error={!!errors.email} helperText={errors.email && errors.email[0]} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField size='small'
                                fullWidth
                                label="CNIC"
                                name="cnic"
                                placeholder="XXXXX-XXXXXXX-X"
                                value={formData.cnic}
                                onChange={(e) => {
                                    let value = e.target.value.replace(/\D/g, '');
                                    if (value.length > 5 && value[5] !== '-') value = value.slice(0, 5) + '-' + value.slice(5);
                                    if (value.length > 13 && value[13] !== '-') value = value.slice(0, 13) + '-' + value.slice(13);
                                    if (value.length > 15) value = value.slice(0, 15);
                                    handleChange({ target: { name: 'cnic', value } });
                                }}
                                error={!!errors.cnic}
                                helperText={errors.cnic && errors.cnic[0]}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField size='small' fullWidth label="Address" name="address" value={formData.address} onChange={handleChange} error={!!errors.address} helperText={errors.address && errors.address[0]} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField size='small' fullWidth select label="Guest Type*" name="guest_type_id" value={formData.guest_type_id} onChange={handleChange} error={!!errors.guest_type_id} helperText={errors.guest_type_id && errors.guest_type_id[0]}>
                                {guestTypes.map((type) => (
                                    <MenuItem key={type.id} value={type.id}>
                                        {type.name}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Box sx={{ width: '100%' }}>
                                <AsyncSearchTextField size='small' label="Member Name" name="guest" value={formData.guest} onChange={handleMemberSelect} endpoint={memberSearchRouteName} params={memberSearchParams} placeholder="Search members..." fullWidth renderItem={renderMemberWithStatus} />
                            </Box>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField size='small' fullWidth label="Member No" name="member_no" value={formData.member_no} disabled />
                        </Grid>

                        <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                            <Button onClick={onClose} sx={{ mr: 1 }}>
                                Cancel
                            </Button>
                            <Button variant="contained" onClick={handleSubmit} disabled={loading} startIcon={loading && <CircularProgress size={20} color="inherit" />}>
                                {loading ? 'Saving...' : 'Save'}
                            </Button>
                        </Grid>
                    </Grid>
                </Box>
            </DialogContent>
        </Dialog>
    );
};

export default GuestCreateModal;
