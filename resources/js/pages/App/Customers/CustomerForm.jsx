import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { IconButton, Button, Typography, Box, TextField, MenuItem } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { router, usePage, useForm } from '@inertiajs/react';
import AsyncSearchTextField from '@/components/AsyncSearchTextField';
import POSLayout from "@/components/POSLayout";
import { routeNameForContext } from '@/lib/utils';

const genderOptions = ['male', 'female', 'other'];

// const drawerWidthOpen = 240;
// const drawerWidthClosed = 110;

const CustomerForm = ({ customer = {}, customerNo, guestTypes = [], isEdit = false }) => {
    const [open, setOpen] = useState(true);
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
        isEdit ? put(route(routeNameForContext('customers.update'), customer.id)) : post(route(routeNameForContext('customers.store')));
    };

    return (
        <>
            {/* <SideNav open={open} setOpen={setOpen} />
            <Box
                sx={{
                    marginLeft: open ? `${drawerWidthOpen}px` : `${drawerWidthClosed}px`,
                    transition: 'margin-left 0.3s ease-in-out',
                    marginTop: '5rem',
                    
                }}
            > */}
            <Box sx={{
                bgcolor: '#f5f5f5',
                minHeight: '100vh',
                p: 2,
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <IconButton>
                        <ArrowBackIcon sx={{ color: '#063455' }} onClick={() => router.visit(route(routeNameForContext('customers.index')))} />
                    </IconButton>
                    <Typography sx={{ fontWeight: '600', fontSize: '30px', color: '#063455' }}>
                        {isEdit ? 'Edit Customer' : 'Add Customer'}
                    </Typography>
                </Box>

                <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 600, mx: 'auto', mt: 5, bgcolor: '#fff', p: 3 }}>
                    <TextField fullWidth label="Customer No" margin="normal" value={data.customer_no} disabled error={!!errors.customer_no} helperText={errors.customer_no} />

                    <TextField fullWidth label="Name*" margin="normal" value={data.name} onChange={(e) => setData('name', e.target.value)} error={!!errors.name} helperText={errors.name} />
                    <TextField fullWidth label="Contact*" margin="normal" value={data.contact} onChange={(e) => setData('contact', e.target.value)} error={!!errors.contact} helperText={errors.contact} />

                    <TextField fullWidth select label="Gender" margin="normal" value={data.gender} onChange={(e) => setData('gender', e.target.value)} error={!!errors.gender} helperText={errors.gender}>
                        {genderOptions.map((option) => (
                            <MenuItem key={option} value={option}>
                                {option}
                            </MenuItem>
                        ))}
                    </TextField>

                    <TextField fullWidth label="Address" margin="normal" value={data.address} onChange={(e) => setData('address', e.target.value)} />

                    <TextField fullWidth label="CNIC" margin="normal" value={data.cnic} onChange={(e) => setData('cnic', e.target.value)} />

                    <TextField fullWidth label="Email" margin="normal" value={data.email} onChange={(e) => setData('email', e.target.value)} />

                    <TextField fullWidth select label="Guest Type*" margin="normal" value={data.guest_type_id} onChange={(e) => setData('guest_type_id', e.target.value)} error={!!errors.guest_type_id} helperText={errors.guest_type_id}>
                        {guestTypes.map((type) => (
                            <MenuItem key={type.id} value={type.id}>
                                {type.name}
                            </MenuItem>
                        ))}
                    </TextField>

                    <AsyncSearchTextField label="Member Name" name="guest" value={data.guest} onChange={handleChange} endpoint="admin.api.search-users" params={{ type: '0' }} placeholder="Search members..." />

                    <TextField fullWidth label="Member No" margin="normal" value={data.member_no} onChange={(e) => setData('member_no', e.target.value)} disabled />
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                            type="submit"
                            variant="contained"
                            sx={{ mt: 2, borderRadius: '16px', textTransform: 'none' }}
                            disabled={processing}>
                            {isEdit ? 'Update' : 'Save'}
                        </Button>
                    </Box>
                </Box>
            </Box>
        </>
    );
};
CustomerForm.layout = (page) => <POSLayout>{page}</POSLayout>;
export default CustomerForm;
