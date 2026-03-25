import React from 'react';
import { router } from '@inertiajs/react';
import { Button, Chip, Grid, Typography } from '@mui/material';
import AppPage from '@/components/App/ui/AppPage';
import SurfaceCard from '@/components/App/ui/SurfaceCard';

function DetailItem({ label, value }) {
    return (
        <Grid item xs={12} md={6}>
            <Typography variant="overline" sx={{ color: 'text.secondary', letterSpacing: '0.08em' }}>
                {label}
            </Typography>
            <Typography sx={{ fontWeight: 700, color: 'text.primary' }}>{value || '-'}</Typography>
        </Grid>
    );
}

export default function Show({ customer }) {
    return (
        <AppPage
            eyebrow="Guest Management"
            title={customer?.name || 'Guest Profile'}
            subtitle="Read-only guest details backed by the live customer master."
            actions={[
                <Button key="back" variant="outlined" onClick={() => router.visit(route('guests.index'))}>
                    Back to Guests
                </Button>,
                <Button key="edit" variant="contained" onClick={() => router.visit(route('guests.edit', customer.id))}>
                    Edit Guest
                </Button>,
            ]}
        >
            <SurfaceCard title="Guest Details" subtitle="Operational identity, guest type, sponsor, and contact information.">
                <Grid container spacing={2.25}>
                    <DetailItem label="Guest #" value={customer.customer_no} />
                    <DetailItem label="Guest Type" value={customer.guest_type?.name} />
                    <DetailItem label="Contact" value={customer.contact} />
                    <DetailItem label="Email" value={customer.email} />
                    <DetailItem label="Gender" value={customer.gender} />
                    <DetailItem label="CNIC" value={customer.cnic} />
                    <DetailItem label="Authorized Member" value={customer.member_name} />
                    <DetailItem label="Member No" value={customer.member_no} />
                    <Grid item xs={12}>
                        <Typography variant="overline" sx={{ color: 'text.secondary', letterSpacing: '0.08em' }}>
                            Address
                        </Typography>
                        <Typography sx={{ fontWeight: 700, color: 'text.primary' }}>{customer.address || '-'}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                        <Chip size="small" label="Live Guest Record" color="primary" variant="outlined" />
                    </Grid>
                </Grid>
            </SurfaceCard>
        </AppPage>
    );
}
