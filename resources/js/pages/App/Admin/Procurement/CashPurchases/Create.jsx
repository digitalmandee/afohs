import React from 'react';
import { Link, useForm } from '@inertiajs/react';
import { Add, DeleteOutline } from '@mui/icons-material';
import { Box, Button, Grid, IconButton, MenuItem, Stack, TextField, Typography } from '@mui/material';
import AppPage from '@/components/App/ui/AppPage';
import SurfaceCard from '@/components/App/ui/SurfaceCard';
import { formatAmount } from '@/lib/formatting';

export default function Create({ vendors = [], warehouses = [], paymentAccounts = [], inventoryItems = [], tenants = [] }) {
    const { data, setData, post, processing, errors } = useForm({
        vendor_id: '',
        tenant_id: '',
        warehouse_id: '',
        warehouse_location_id: '',
        payment_account_id: '',
        purchase_date: new Date().toISOString().slice(0, 10),
        remarks: '',
        items: [{ inventory_item_id: '', qty: 1, unit_cost: 0 }],
    });

    const addItem = () => setData('items', [...data.items, { inventory_item_id: '', qty: 1, unit_cost: 0 }]);
    const removeItem = (index) => setData('items', data.items.filter((_, idx) => idx !== index));
    const updateItem = (index, field, value) => {
        const next = [...data.items];
        next[index] = { ...next[index], [field]: value };
        setData('items', next);
    };

    const total = data.items.reduce((sum, item) => sum + Number(item.qty || 0) * Number(item.unit_cost || 0), 0);

    const submit = (event) => {
        event.preventDefault();
        post(route('procurement.cash-purchases.store'));
    };

    return (
        <AppPage
            eyebrow="Procurement"
            title="Create Cash Purchase"
            subtitle="Create direct buy-and-receive transactions with same-day payment references."
            actions={[
                <Button key="back" component={Link} href={route('procurement.cash-purchases.index')} variant="outlined">
                    Back to Cash Purchases
                </Button>,
            ]}
        >
            <form onSubmit={submit}>
                <Stack spacing={2.25}>
                    <SurfaceCard title="Cash Purchase Header">
                        <Grid container spacing={1.5}>
                            <Grid item xs={12} md={3}>
                                <TextField
                                    select
                                    size="small"
                                    label="Restaurant"
                                    value={data.tenant_id}
                                    onChange={(event) => setData('tenant_id', event.target.value)}
                                    error={!!errors.tenant_id}
                                    helperText={errors.tenant_id}
                                    fullWidth
                                >
                                    <MenuItem value="">Shared</MenuItem>
                                    {tenants.map((tenant) => (
                                        <MenuItem key={tenant.id} value={tenant.id}>{tenant.name}</MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <TextField
                                    select
                                    size="small"
                                    label="Vendor"
                                    value={data.vendor_id}
                                    onChange={(event) => setData('vendor_id', event.target.value)}
                                    error={!!errors.vendor_id}
                                    helperText={errors.vendor_id}
                                    fullWidth
                                >
                                    <MenuItem value="">Walk-in / direct market</MenuItem>
                                    {vendors.map((vendor) => (
                                        <MenuItem key={vendor.id} value={vendor.id}>{vendor.name}</MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <TextField
                                    select
                                    size="small"
                                    label="Warehouse"
                                    value={data.warehouse_id}
                                    onChange={(event) => setData('warehouse_id', event.target.value)}
                                    error={!!errors.warehouse_id}
                                    helperText={errors.warehouse_id}
                                    fullWidth
                                >
                                    {warehouses.map((warehouse) => (
                                        <MenuItem key={warehouse.id} value={warehouse.id}>{warehouse.name}</MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <TextField
                                    select
                                    size="small"
                                    label="Payment Account"
                                    value={data.payment_account_id}
                                    onChange={(event) => setData('payment_account_id', event.target.value)}
                                    error={!!errors.payment_account_id}
                                    helperText={errors.payment_account_id}
                                    fullWidth
                                >
                                    <MenuItem value="">Select</MenuItem>
                                    {paymentAccounts.map((paymentAccount) => (
                                        <MenuItem key={paymentAccount.id} value={paymentAccount.id}>{paymentAccount.name}</MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <TextField
                                    size="small"
                                    label="Purchase Date"
                                    type="date"
                                    value={data.purchase_date}
                                    onChange={(event) => setData('purchase_date', event.target.value)}
                                    error={!!errors.purchase_date}
                                    helperText={errors.purchase_date}
                                    InputLabelProps={{ shrink: true }}
                                    fullWidth
                                />
                            </Grid>
                            <Grid item xs={12} md={9}>
                                <TextField
                                    size="small"
                                    label="Remarks"
                                    value={data.remarks}
                                    onChange={(event) => setData('remarks', event.target.value)}
                                    error={!!errors.remarks}
                                    helperText={errors.remarks}
                                    fullWidth
                                />
                            </Grid>
                        </Grid>
                    </SurfaceCard>

                    <SurfaceCard
                        title="Items"
                        subtitle={`Document total: ${formatAmount(total)}`}
                        actions={<Button startIcon={<Add />} variant="outlined" onClick={addItem}>Add Item</Button>}
                    >
                        <Stack spacing={1.5}>
                            {data.items.map((item, index) => (
                                <Box key={index} sx={{ border: '1px solid rgba(226,232,240,0.95)', borderRadius: '14px', p: 1.5 }}>
                                    <Grid container spacing={1.5} alignItems="flex-start">
                                        <Grid item xs={12} md={5}>
                                            <TextField
                                                select
                                                size="small"
                                                label="Inventory Item"
                                                value={item.inventory_item_id}
                                                onChange={(event) => updateItem(index, 'inventory_item_id', event.target.value)}
                                                error={!!errors[`items.${index}.inventory_item_id`]}
                                                helperText={errors[`items.${index}.inventory_item_id`]}
                                                fullWidth
                                            >
                                                {inventoryItems.map((inventoryItem) => (
                                                    <MenuItem key={inventoryItem.id} value={inventoryItem.id}>
                                                        {inventoryItem.name}{inventoryItem.sku ? ` (${inventoryItem.sku})` : ''}
                                                    </MenuItem>
                                                ))}
                                            </TextField>
                                        </Grid>
                                        <Grid item xs={12} md={2}>
                                            <TextField
                                                size="small"
                                                label="Qty"
                                                type="number"
                                                value={item.qty}
                                                onChange={(event) => updateItem(index, 'qty', event.target.value)}
                                                error={!!errors[`items.${index}.qty`]}
                                                helperText={errors[`items.${index}.qty`]}
                                                fullWidth
                                            />
                                        </Grid>
                                        <Grid item xs={12} md={2}>
                                            <TextField
                                                size="small"
                                                label="Unit Cost"
                                                type="number"
                                                value={item.unit_cost}
                                                onChange={(event) => updateItem(index, 'unit_cost', event.target.value)}
                                                error={!!errors[`items.${index}.unit_cost`]}
                                                helperText={errors[`items.${index}.unit_cost`]}
                                                fullWidth
                                            />
                                        </Grid>
                                        <Grid item xs={12} md={2}>
                                            <Typography variant="caption" color="text.secondary">
                                                Line total
                                            </Typography>
                                            <Typography variant="body2" sx={{ mt: 0.6 }}>
                                                {formatAmount(Number(item.qty || 0) * Number(item.unit_cost || 0))}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={12} md={1} sx={{ textAlign: 'right' }}>
                                            <IconButton onClick={() => removeItem(index)} disabled={data.items.length === 1}>
                                                <DeleteOutline />
                                            </IconButton>
                                        </Grid>
                                    </Grid>
                                </Box>
                            ))}
                        </Stack>
                    </SurfaceCard>

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                        <Button component={Link} href={route('procurement.cash-purchases.index')} variant="outlined">
                            Cancel
                        </Button>
                        <Button type="submit" variant="contained" disabled={processing}>
                            {processing ? 'Saving...' : 'Create Cash Purchase'}
                        </Button>
                    </Box>
                </Stack>
            </form>
        </AppPage>
    );
}

