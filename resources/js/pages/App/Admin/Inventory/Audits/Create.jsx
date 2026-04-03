import React from 'react';
import { Link, useForm } from '@inertiajs/react';
import { Add, DeleteOutline } from '@mui/icons-material';
import { Box, Button, Grid, IconButton, MenuItem, Stack, TextField } from '@mui/material';
import AppPage from '@/components/App/ui/AppPage';
import SurfaceCard from '@/components/App/ui/SurfaceCard';

export default function Create({ warehouses = [], locations = [], inventoryItems = [] }) {
    const { data, setData, post, processing, errors } = useForm({
        tenant_id: '',
        warehouse_id: '',
        warehouse_location_id: '',
        audit_date: new Date().toISOString().slice(0, 10),
        remarks: '',
        items: [{ inventory_item_id: '', counted_qty: 0 }],
    });

    const filteredLocations = locations.filter((location) => (
        !data.warehouse_id || Number(location.warehouse_id) === Number(data.warehouse_id)
    ));

    const addItem = () => setData('items', [...data.items, { inventory_item_id: '', counted_qty: 0 }]);
    const removeItem = (index) => setData('items', data.items.filter((_, idx) => idx !== index));
    const updateItem = (index, field, value) => {
        const next = [...data.items];
        next[index] = { ...next[index], [field]: value };
        setData('items', next);
    };

    const submit = (event) => {
        event.preventDefault();
        post(route('inventory.audits.store'));
    };

    return (
        <AppPage
            eyebrow="Warehouse"
            title="Create Stock Audit"
            subtitle="Capture physical count lines and submit for variance posting."
            actions={[
                <Button key="back" component={Link} href={route('inventory.audits.index')} variant="outlined">
                    Back to Stock Audits
                </Button>,
            ]}
        >
            <form onSubmit={submit}>
                <Stack spacing={2.25}>
                    <SurfaceCard title="Audit Header">
                        <Grid container spacing={1.5}>
                            <Grid item xs={12} md={4}>
                                <TextField
                                    select
                                    size="small"
                                    label="Warehouse"
                                    value={data.warehouse_id}
                                    onChange={(event) => {
                                        setData('warehouse_id', event.target.value);
                                        setData('warehouse_location_id', '');
                                    }}
                                    error={!!errors.warehouse_id}
                                    helperText={errors.warehouse_id}
                                    fullWidth
                                >
                                    {warehouses.map((warehouse) => (
                                        <MenuItem key={warehouse.id} value={warehouse.id}>{warehouse.name}</MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField
                                    select
                                    size="small"
                                    label="Location"
                                    value={data.warehouse_location_id}
                                    onChange={(event) => setData('warehouse_location_id', event.target.value)}
                                    error={!!errors.warehouse_location_id}
                                    helperText={errors.warehouse_location_id}
                                    fullWidth
                                >
                                    <MenuItem value="">All Locations</MenuItem>
                                    {filteredLocations.map((location) => (
                                        <MenuItem key={location.id} value={location.id}>{location.name}{location.code ? ` (${location.code})` : ''}</MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField
                                    size="small"
                                    label="Audit Date"
                                    type="date"
                                    value={data.audit_date}
                                    onChange={(event) => setData('audit_date', event.target.value)}
                                    error={!!errors.audit_date}
                                    helperText={errors.audit_date}
                                    InputLabelProps={{ shrink: true }}
                                    fullWidth
                                />
                            </Grid>
                            <Grid item xs={12}>
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
                        title="Count Lines"
                        actions={<Button startIcon={<Add />} variant="outlined" onClick={addItem}>Add Line</Button>}
                    >
                        <Stack spacing={1.5}>
                            {data.items.map((item, index) => (
                                <Box key={index} sx={{ border: '1px solid rgba(226,232,240,0.95)', borderRadius: '14px', p: 1.5 }}>
                                    <Grid container spacing={1.5} alignItems="center">
                                        <Grid item xs={12} md={6}>
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
                                        <Grid item xs={12} md={5}>
                                            <TextField
                                                size="small"
                                                label="Counted Qty"
                                                type="number"
                                                value={item.counted_qty}
                                                onChange={(event) => updateItem(index, 'counted_qty', event.target.value)}
                                                error={!!errors[`items.${index}.counted_qty`]}
                                                helperText={errors[`items.${index}.counted_qty`]}
                                                fullWidth
                                            />
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
                        <Button component={Link} href={route('inventory.audits.index')} variant="outlined">
                            Cancel
                        </Button>
                        <Button type="submit" variant="contained" disabled={processing}>
                            {processing ? 'Saving...' : 'Create Audit'}
                        </Button>
                    </Box>
                </Stack>
            </form>
        </AppPage>
    );
}

