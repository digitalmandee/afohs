import React from 'react';
import { router, useForm } from '@inertiajs/react';
import { Button, Grid, MenuItem, TextField, Typography } from '@mui/material';
import AsyncSearchTextField from '@/components/AsyncSearchTextField';
import AppPage from '@/components/App/ui/AppPage';
import SurfaceCard from '@/components/App/ui/SurfaceCard';

const genderOptions = ['male', 'female', 'other'];

const fieldSx = {
    '& .MuiOutlinedInput-root': {
        borderRadius: '16px',
    },
};

const renderMemberWithStatus = (option) => (
    <div style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" fontWeight="bold">
                {option.membership_no || option.customer_no || option.employee_id}
            </Typography>
        </div>
        <Typography variant="caption" color="text.secondary">
            {option.name}
        </Typography>
    </div>
);

export default function CustomerForm({ customer = {}, customerNo, guestTypes = [], isEdit = false }) {
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
        guest: customer.member_name
            ? { name: customer.member_name, label: customer.member_name, membership_no: customer.member_no }
            : null,
    });

    const handleMemberChange = React.useCallback(
        (event) => {
            const selected = event?.target?.value || null;
            setData('guest', selected);
            setData('member_name', selected?.name || '');
            setData('member_no', selected?.membership_no || '');
        },
        [setData],
    );

    const handleSubmit = React.useCallback(
        (event) => {
            event.preventDefault();
            if (isEdit) {
                put(route('guests.update', customer.id));
                return;
            }

            post(route('guests.store'));
        },
        [customer.id, isEdit, post, put],
    );

    return (
        <AppPage
            eyebrow="Guest Management"
            title={isEdit ? 'Edit Guest' : 'Add Guest'}
            subtitle="Manage live guest records with guest type, contact details, and sponsor linkage in the current premium workflow."
            actions={[
                <Button key="back" variant="outlined" onClick={() => router.visit(route('guests.index'))}>
                    Back to Guests
                </Button>,
            ]}
        >
            <SurfaceCard title="Guest Profile" subtitle="Capture the operational guest master that Room and Event bookings search against.">
                <form onSubmit={handleSubmit}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                            <TextField fullWidth label="Guest #" value={data.customer_no} disabled error={!!errors.customer_no} helperText={errors.customer_no} sx={fieldSx} />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField fullWidth required label="Guest Name" value={data.name} onChange={(event) => setData('name', event.target.value)} error={!!errors.name} helperText={errors.name} sx={fieldSx} />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField fullWidth required label="Contact" placeholder="03XXXXXXXXX" value={data.contact} onChange={(event) => setData('contact', event.target.value.replace(/[^0-9+\-]/g, ''))} error={!!errors.contact} helperText={errors.contact} sx={fieldSx} />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField fullWidth select label="Gender" value={data.gender} onChange={(event) => setData('gender', event.target.value)} error={!!errors.gender} helperText={errors.gender} sx={fieldSx}>
                                {genderOptions.map((option) => (
                                    <MenuItem key={option} value={option}>
                                        {option}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField fullWidth label="Address" value={data.address} onChange={(event) => setData('address', event.target.value)} error={!!errors.address} helperText={errors.address} sx={fieldSx} />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField fullWidth label="CNIC" placeholder="XXXXX-XXXXXXX-X" value={data.cnic} onChange={(event) => setData('cnic', event.target.value)} error={!!errors.cnic} helperText={errors.cnic} sx={fieldSx} />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField fullWidth label="Email" value={data.email} onChange={(event) => setData('email', event.target.value)} error={!!errors.email} helperText={errors.email} sx={fieldSx} />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField fullWidth select required label="Guest Type" value={data.guest_type_id} onChange={(event) => setData('guest_type_id', event.target.value)} error={!!errors.guest_type_id} helperText={errors.guest_type_id} sx={fieldSx}>
                                {guestTypes.map((type) => (
                                    <MenuItem key={type.id} value={type.id}>
                                        {type.name}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <AsyncSearchTextField
                                label="Authorized Member"
                                name="guest"
                                value={data.guest}
                                onChange={handleMemberChange}
                                endpoint="admin.api.search-users"
                                params={{ type: '0' }}
                                placeholder="Search members..."
                                fullWidth
                                renderItem={renderMemberWithStatus}
                                sx={fieldSx}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField fullWidth label="Member No" value={data.member_no} onChange={(event) => setData('member_no', event.target.value)} error={!!errors.member_no} helperText={errors.member_no} sx={fieldSx} disabled />
                        </Grid>
                    </Grid>

                    <Grid container spacing={1.25} justifyContent="flex-end" sx={{ mt: 2 }}>
                        <Grid item>
                            <Button variant="outlined" onClick={() => router.visit(route('guests.index'))}>
                                Cancel
                            </Button>
                        </Grid>
                        <Grid item>
                            <Button type="submit" variant="contained" disabled={processing}>
                                {isEdit ? 'Update Guest' : 'Save Guest'}
                            </Button>
                        </Grid>
                    </Grid>
                </form>
            </SurfaceCard>
        </AppPage>
    );
}
