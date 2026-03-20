import React from 'react';
import { Alert, Box, Button, Chip, Grid, List, ListItem, ListItemText, Stack, Switch, TextField, Typography } from '@mui/material';
import POSLayout from '@/components/POSLayout';
import AppPage from '@/components/App/ui/AppPage';
import SurfaceCard from '@/components/App/ui/SurfaceCard';
import StatCard from '@/components/App/ui/StatCard';
import { routeNameForContext } from '@/lib/utils';

const initialStoreInfo = {
    name: 'AFOHS Club Outlet',
    email: 'ops@afohsclub.local',
    phone1: '+92 300 0000000',
    phone2: '',
    country: 'Pakistan',
    city: 'Karachi',
    zipCode: '',
    fullAddress: '',
};

export default function SettingDashboard() {
    const [storeInfo, setStoreInfo] = React.useState(initialStoreInfo);
    const [notifications, setNotifications] = React.useState({
        outOfStockMenu: true,
        stockMinimum: true,
        selfOrder: true,
        orderFromMobileApp: false,
    });
    const [orderTypes, setOrderTypes] = React.useState({
        cashier: ['dine_in', 'delivery', 'takeaway'],
        selfOrder: ['dine_in', 'pick_up', 'delivery', 'takeaway'],
        mobileApp: ['dine_in', 'pick_up', 'delivery', 'takeaway', 'reservation'],
    });

    const categories = ['Coffee & Beverage', 'Food & Snack', 'Bakery', 'Retail'];
    const paymentTypes = ['Cash', 'Bank Transfer', 'Card', 'QR Code'];
    const bankAccounts = ['Sea Bank', 'CIMB Bank', 'Citibank'];
    const floors = ['Floor 1', 'Floor 2'];

    const handleFieldChange = (field, value) => {
        setStoreInfo((prev) => ({ ...prev, [field]: value }));
    };

    const toggleNotification = (field) => {
        setNotifications((prev) => ({ ...prev, [field]: !prev[field] }));
    };

    return (
        <Box sx={{ p: { xs: 2, md: 3 } }}>
            <AppPage
                eyebrow="POS Settings"
                title="Settings Workspace"
                subtitle="A premium full-width settings workspace for outlet information, service behavior, table setup, and operational configuration."
                actions={[
                    <Button key="printers" variant="outlined" href={route(routeNameForContext('printers.index'))}>
                        Printer Management
                    </Button>,
                    <Button key="save" variant="contained" disabled>
                        Save Workspace
                    </Button>,
                ]}
            >
                <Alert severity="info">
                    This workspace is now structured as a real settings surface. Sections that still depend on older local-only demo data are shown as reference/setup areas until their server-backed flows are fully wired.
                </Alert>

                <Grid container spacing={2.25}>
                    <Grid item xs={12} md={3}><StatCard label="Menu Categories" value={categories.length} accent /></Grid>
                    <Grid item xs={12} md={3}><StatCard label="Payment Types" value={paymentTypes.length} tone="light" /></Grid>
                    <Grid item xs={12} md={3}><StatCard label="Floor Areas" value={floors.length} tone="muted" /></Grid>
                    <Grid item xs={12} md={3}><StatCard label="Bank Accounts" value={bankAccounts.length} tone="light" /></Grid>
                </Grid>

                <Grid container spacing={2.25}>
                    <Grid item xs={12} lg={7}>
                        <SurfaceCard title="Store and Outlet Information" subtitle="Maintain the primary outlet identity and contact details in the same premium shell used across settings pages.">
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                    <TextField fullWidth label="Outlet Name" value={storeInfo.name} onChange={(e) => handleFieldChange('name', e.target.value)} />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField fullWidth label="Email" value={storeInfo.email} onChange={(e) => handleFieldChange('email', e.target.value)} />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField fullWidth label="Primary Phone" value={storeInfo.phone1} onChange={(e) => handleFieldChange('phone1', e.target.value)} />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField fullWidth label="Secondary Phone" value={storeInfo.phone2} onChange={(e) => handleFieldChange('phone2', e.target.value)} />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <TextField fullWidth label="Country" value={storeInfo.country} onChange={(e) => handleFieldChange('country', e.target.value)} />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <TextField fullWidth label="City" value={storeInfo.city} onChange={(e) => handleFieldChange('city', e.target.value)} />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <TextField fullWidth label="Zip Code" value={storeInfo.zipCode} onChange={(e) => handleFieldChange('zipCode', e.target.value)} />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField fullWidth multiline minRows={3} label="Full Address" value={storeInfo.fullAddress} onChange={(e) => handleFieldChange('fullAddress', e.target.value)} />
                                </Grid>
                            </Grid>
                        </SurfaceCard>

                        <SurfaceCard title="Service and Order Behavior" subtitle="Make key operational rules visible without burying them inside modal-only flows.">
                            <Grid container spacing={2}>
                                {[
                                    ['Out of Stock Menu Alerts', 'outOfStockMenu'],
                                    ['Low Stock Alerts', 'stockMinimum'],
                                    ['Self Order Enabled', 'selfOrder'],
                                    ['Mobile App Orders', 'orderFromMobileApp'],
                                ].map(([label, key]) => (
                                    <Grid item xs={12} md={6} key={key}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, border: '1px solid #e5e7eb', borderRadius: 3 }}>
                                            <Typography sx={{ fontWeight: 600 }}>{label}</Typography>
                                            <Switch checked={notifications[key]} onChange={() => toggleNotification(key)} />
                                        </Box>
                                    </Grid>
                                ))}
                            </Grid>
                        </SurfaceCard>
                    </Grid>

                    <Grid item xs={12} lg={5}>
                        <Stack spacing={2.25}>
                            <SurfaceCard title="Order Type Availability" subtitle="Current operational coverage by channel.">
                                <Stack spacing={1.5}>
                                    {Object.entries(orderTypes).map(([channel, values]) => (
                                        <Box key={channel} sx={{ p: 1.5, border: '1px solid #e5e7eb', borderRadius: 3 }}>
                                            <Typography sx={{ textTransform: 'capitalize', fontWeight: 700, mb: 1 }}>{channel}</Typography>
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                                                {values.map((value) => (
                                                    <Chip key={value} label={value.replace('_', ' ')} size="small" />
                                                ))}
                                            </Box>
                                        </Box>
                                    ))}
                                </Stack>
                            </SurfaceCard>

                            <SurfaceCard title="Reference Setup Areas" subtitle="These areas are now visible as part of the settings workspace, but still represent lighter-touch setup until their dedicated flows are completed.">
                                <List disablePadding>
                                    {[
                                        ['Menu Categories', categories],
                                        ['Payment Types', paymentTypes],
                                        ['Bank Accounts', bankAccounts],
                                        ['Floor and Table Areas', floors],
                                    ].map(([label, values]) => (
                                        <ListItem key={label} sx={{ px: 0, py: 1, alignItems: 'flex-start' }}>
                                            <ListItemText
                                                primary={label}
                                                secondary={
                                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 0.75 }}>
                                                        {values.map((value) => (
                                                            <Chip key={value} label={value} size="small" variant="outlined" />
                                                        ))}
                                                    </Box>
                                                }
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            </SurfaceCard>

                            <SurfaceCard title="Printing and Device Setup" subtitle="Printer routing now lives in its own dedicated page while the settings workspace gives operators a clear next step.">
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    Use Printer Management for kitchen mappings, receipt printers, test printing, and print health checks.
                                </Typography>
                                <Button variant="contained" href={route(routeNameForContext('printers.index'))}>
                                    Open Printer Management
                                </Button>
                            </SurfaceCard>
                        </Stack>
                    </Grid>
                </Grid>
            </AppPage>
        </Box>
    );
}

SettingDashboard.layout = (page) => <POSLayout>{page}</POSLayout>;
