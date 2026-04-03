import React from 'react';
import { Link, useForm } from '@inertiajs/react';
import { Add, DeleteOutline } from '@mui/icons-material';
import { Box, Button, Grid, IconButton, MenuItem, Stack, TextField } from '@mui/material';
import AppPage from '@/components/App/ui/AppPage';
import SurfaceCard from '@/components/App/ui/SurfaceCard';

export default function Create({ tenants = [], warehouses = [], locations = [], departments = [], inventoryItems = [], typeOptions = [] }) {
    const { data, setData, post, processing, errors } = useForm({
        type: typeOptions?.[0]?.value || 'store_issue_note',
        tenant_id: '',
        department_id: '',
        subdepartment_id: '',
        source_warehouse_id: '',
        source_warehouse_location_id: '',
        destination_warehouse_id: '',
        destination_warehouse_location_id: '',
        transaction_date: new Date().toISOString().slice(0, 10),
        remarks: '',
        items: [{ inventory_item_id: '', quantity: 1, unit_cost: 0 }],
    });

    const sourceLocations = locations.filter((location) => (
        !data.source_warehouse_id || Number(location.warehouse_id) === Number(data.source_warehouse_id)
    ));
    const destinationLocations = locations.filter((location) => (
        !data.destination_warehouse_id || Number(location.warehouse_id) === Number(data.destination_warehouse_id)
    ));

    const addItem = () => setData('items', [...data.items, { inventory_item_id: '', quantity: 1, unit_cost: 0 }]);
    const removeItem = (index) => setData('items', data.items.filter((_, idx) => idx !== index));
    const updateItem = (index, field, value) => {
        const next = [...data.items];
        next[index] = { ...next[index], [field]: value };
        setData('items', next);
    };

    const submit = (event) => {
        event.preventDefault();
        post(route('inventory.document-flows.store'));
    };

    return (
        <AppPage
            eyebrow="Warehouse"
            title="Create Inventory Document"
            subtitle="Create typed issue/receipt/department flow documents on top of current movement engine."
            actions={[
                <Button key="back" component={Link} href={route('inventory.document-flows.index')} variant="outlined">
                    Back to Document Flows
                </Button>,
            ]}
        >
            <form onSubmit={submit}>
                <Stack spacing={2.25}>
                    <SurfaceCard title="Document Header">
                        <Grid container spacing={1.5}>
                            <Grid item xs={12} md={3}>
                                <TextField
                                    select
                                    size="small"
                                    label="Document Type"
                                    value={data.type}
                                    onChange={(event) => setData('type', event.target.value)}
                                    error={!!errors.type}
                                    helperText={errors.type}
                                    fullWidth
                                >
                                    {typeOptions.map((option) => (
                                        <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
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
                                    label="Department"
                                    value={data.department_id}
                                    onChange={(event) => setData('department_id', event.target.value)}
                                    error={!!errors.department_id}
                                    helperText={errors.department_id}
                                    fullWidth
                                >
                                    <MenuItem value="">None</MenuItem>
                                    {departments.map((department) => (
                                        <MenuItem key={department.id} value={department.id}>{department.name}</MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <TextField
                                    size="small"
                                    label="Transaction Date"
                                    type="date"
                                    value={data.transaction_date}
                                    onChange={(event) => setData('transaction_date', event.target.value)}
                                    error={!!errors.transaction_date}
                                    helperText={errors.transaction_date}
                                    InputLabelProps={{ shrink: true }}
                                    fullWidth
                                />
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <TextField
                                    select
                                    size="small"
                                    label="Source Warehouse"
                                    value={data.source_warehouse_id}
                                    onChange={(event) => {
                                        setData('source_warehouse_id', event.target.value);
                                        setData('source_warehouse_location_id', '');
                                    }}
                                    error={!!errors.source_warehouse_id}
                                    helperText={errors.source_warehouse_id}
                                    fullWidth
                                >
                                    <MenuItem value="">None</MenuItem>
                                    {warehouses.map((warehouse) => (
                                        <MenuItem key={warehouse.id} value={warehouse.id}>{warehouse.name}</MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <TextField
                                    select
                                    size="small"
                                    label="Source Location"
                                    value={data.source_warehouse_location_id}
                                    onChange={(event) => setData('source_warehouse_location_id', event.target.value)}
                                    error={!!errors.source_warehouse_location_id}
                                    helperText={errors.source_warehouse_location_id}
                                    fullWidth
                                >
                                    <MenuItem value="">None</MenuItem>
                                    {sourceLocations.map((location) => (
                                        <MenuItem key={location.id} value={location.id}>{location.name}{location.code ? ` (${location.code})` : ''}</MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <TextField
                                    select
                                    size="small"
                                    label="Destination Warehouse"
                                    value={data.destination_warehouse_id}
                                    onChange={(event) => {
                                        setData('destination_warehouse_id', event.target.value);
                                        setData('destination_warehouse_location_id', '');
                                    }}
                                    error={!!errors.destination_warehouse_id}
                                    helperText={errors.destination_warehouse_id}
                                    fullWidth
                                >
                                    <MenuItem value="">None</MenuItem>
                                    {warehouses.map((warehouse) => (
                                        <MenuItem key={warehouse.id} value={warehouse.id}>{warehouse.name}</MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <TextField
                                    select
                                    size="small"
                                    label="Destination Location"
                                    value={data.destination_warehouse_location_id}
                                    onChange={(event) => setData('destination_warehouse_location_id', event.target.value)}
                                    error={!!errors.destination_warehouse_location_id}
                                    helperText={errors.destination_warehouse_location_id}
                                    fullWidth
                                >
                                    <MenuItem value="">None</MenuItem>
                                    {destinationLocations.map((location) => (
                                        <MenuItem key={location.id} value={location.id}>{location.name}{location.code ? ` (${location.code})` : ''}</MenuItem>
                                    ))}
                                </TextField>
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
                        title="Document Lines"
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
                                        <Grid item xs={12} md={2}>
                                            <TextField
                                                size="small"
                                                label="Quantity"
                                                type="number"
                                                value={item.quantity}
                                                onChange={(event) => updateItem(index, 'quantity', event.target.value)}
                                                error={!!errors[`items.${index}.quantity`]}
                                                helperText={errors[`items.${index}.quantity`]}
                                                fullWidth
                                            />
                                        </Grid>
                                        <Grid item xs={12} md={3}>
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
                        <Button component={Link} href={route('inventory.document-flows.index')} variant="outlined">
                            Cancel
                        </Button>
                        <Button type="submit" variant="contained" disabled={processing}>
                            {processing ? 'Saving...' : 'Create Document'}
                        </Button>
                    </Box>
                </Stack>
            </form>
        </AppPage>
    );
}

