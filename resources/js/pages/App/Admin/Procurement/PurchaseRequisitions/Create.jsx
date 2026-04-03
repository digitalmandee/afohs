import React from 'react';
import { Link, useForm } from '@inertiajs/react';
import { Add, DeleteOutline } from '@mui/icons-material';
import { Box, Button, Grid, IconButton, MenuItem, Stack, TextField, Typography } from '@mui/material';
import AppPage from '@/components/App/ui/AppPage';
import SurfaceCard from '@/components/App/ui/SurfaceCard';
import { formatAmount } from '@/lib/formatting';

export default function Create({ tenants = [], departments = [], requesters = [], inventoryItems = [] }) {
    const { data, setData, post, processing, errors } = useForm({
        tenant_id: '',
        department_id: '',
        subdepartment_id: '',
        requested_by: '',
        request_date: new Date().toISOString().slice(0, 10),
        required_date: '',
        notes: '',
        items: [{ inventory_item_id: '', qty_requested: 1, estimated_unit_cost: 0, remarks: '' }],
    });

    const addItem = () => {
        setData('items', [...data.items, { inventory_item_id: '', qty_requested: 1, estimated_unit_cost: 0, remarks: '' }]);
    };

    const removeItem = (index) => {
        setData('items', data.items.filter((_, idx) => idx !== index));
    };

    const updateItem = (index, field, value) => {
        const next = [...data.items];
        next[index] = { ...next[index], [field]: value };
        setData('items', next);
    };

    const estimatedTotal = data.items.reduce(
        (sum, item) => sum + Number(item.qty_requested || 0) * Number(item.estimated_unit_cost || 0),
        0,
    );

    const submit = (event) => {
        event.preventDefault();
        post(route('procurement.purchase-requisitions.store'));
    };

    return (
        <AppPage
            eyebrow="Procurement"
            title="Create Purchase Requisition"
            subtitle="Capture department demand and submit it for approval and PO conversion."
            actions={[
                <Button key="back" component={Link} href={route('procurement.purchase-requisitions.index')} variant="outlined">
                    Back to Requisitions
                </Button>,
            ]}
        >
            <form onSubmit={submit}>
                <Stack spacing={2.25}>
                    <SurfaceCard title="Requisition Details">
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
                                    label="Department"
                                    value={data.department_id}
                                    onChange={(event) => setData('department_id', event.target.value)}
                                    error={!!errors.department_id}
                                    helperText={errors.department_id}
                                    fullWidth
                                >
                                    <MenuItem value="">Select</MenuItem>
                                    {departments.map((department) => (
                                        <MenuItem key={department.id} value={department.id}>{department.name}</MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <TextField
                                    select
                                    size="small"
                                    label="Requester"
                                    value={data.requested_by}
                                    onChange={(event) => setData('requested_by', event.target.value)}
                                    error={!!errors.requested_by}
                                    helperText={errors.requested_by}
                                    fullWidth
                                >
                                    <MenuItem value="">Current User</MenuItem>
                                    {requesters.map((requester) => (
                                        <MenuItem key={requester.id} value={requester.id}>{requester.name}</MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <TextField
                                    size="small"
                                    label="Request Date"
                                    type="date"
                                    value={data.request_date}
                                    onChange={(event) => setData('request_date', event.target.value)}
                                    error={!!errors.request_date}
                                    helperText={errors.request_date}
                                    InputLabelProps={{ shrink: true }}
                                    fullWidth
                                />
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <TextField
                                    size="small"
                                    label="Required Date"
                                    type="date"
                                    value={data.required_date}
                                    onChange={(event) => setData('required_date', event.target.value)}
                                    error={!!errors.required_date}
                                    helperText={errors.required_date}
                                    InputLabelProps={{ shrink: true }}
                                    fullWidth
                                />
                            </Grid>
                            <Grid item xs={12} md={9}>
                                <TextField
                                    size="small"
                                    label="Notes"
                                    value={data.notes}
                                    onChange={(event) => setData('notes', event.target.value)}
                                    error={!!errors.notes}
                                    helperText={errors.notes}
                                    fullWidth
                                />
                            </Grid>
                        </Grid>
                    </SurfaceCard>

                    <SurfaceCard
                        title="Requested Items"
                        subtitle={`Estimated total: ${formatAmount(estimatedTotal)}`}
                        actions={(
                            <Button startIcon={<Add />} variant="outlined" onClick={addItem}>
                                Add Item
                            </Button>
                        )}
                    >
                        <Stack spacing={1.5}>
                            {data.items.map((item, index) => (
                                <Box key={index} sx={{ border: '1px solid rgba(226,232,240,0.95)', borderRadius: '14px', p: 1.5 }}>
                                    <Grid container spacing={1.5} alignItems="flex-start">
                                        <Grid item xs={12} md={4}>
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
                                                label="Qty Requested"
                                                type="number"
                                                value={item.qty_requested}
                                                onChange={(event) => updateItem(index, 'qty_requested', event.target.value)}
                                                error={!!errors[`items.${index}.qty_requested`]}
                                                helperText={errors[`items.${index}.qty_requested`]}
                                                fullWidth
                                            />
                                        </Grid>
                                        <Grid item xs={12} md={2}>
                                            <TextField
                                                size="small"
                                                label="Est. Unit Cost"
                                                type="number"
                                                value={item.estimated_unit_cost}
                                                onChange={(event) => updateItem(index, 'estimated_unit_cost', event.target.value)}
                                                error={!!errors[`items.${index}.estimated_unit_cost`]}
                                                helperText={errors[`items.${index}.estimated_unit_cost`]}
                                                fullWidth
                                            />
                                        </Grid>
                                        <Grid item xs={12} md={3}>
                                            <TextField
                                                size="small"
                                                label="Remarks"
                                                value={item.remarks}
                                                onChange={(event) => updateItem(index, 'remarks', event.target.value)}
                                                error={!!errors[`items.${index}.remarks`]}
                                                helperText={errors[`items.${index}.remarks`]}
                                                fullWidth
                                            />
                                        </Grid>
                                        <Grid item xs={12} md={1} sx={{ textAlign: 'right' }}>
                                            <IconButton onClick={() => removeItem(index)} disabled={data.items.length === 1}>
                                                <DeleteOutline />
                                            </IconButton>
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Typography variant="caption" color="text.secondary">
                                                Line estimate: {formatAmount(Number(item.qty_requested || 0) * Number(item.estimated_unit_cost || 0))}
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                </Box>
                            ))}
                        </Stack>
                    </SurfaceCard>

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                        <Button component={Link} href={route('procurement.purchase-requisitions.index')} variant="outlined">
                            Cancel
                        </Button>
                        <Button type="submit" variant="contained" disabled={processing}>
                            {processing ? 'Saving...' : 'Create Requisition'}
                        </Button>
                    </Box>
                </Stack>
            </form>
        </AppPage>
    );
}
