import React from 'react';
import { router, useForm } from '@inertiajs/react';
import { Button, Chip, Grid, MenuItem, TableCell, TableRow, TextField } from '@mui/material';
import AppPage from '@/components/App/ui/AppPage';
import SurfaceCard from '@/components/App/ui/SurfaceCard';
import AdminDataTable from '@/components/App/ui/AdminDataTable';

export default function WarehouseCoverageIndex({ restaurants = [], warehouses = [], assignments = [] }) {
    const form = useForm({
        restaurant_id: '',
        warehouse_id: '',
        warehouse_location_id: '',
        role: 'sellable',
        is_primary: false,
        is_active: true,
    });

    const selectedWarehouse = warehouses.find((warehouse) => String(warehouse.id) === String(form.data.warehouse_id));
    const locationOptions = selectedWarehouse?.locations || [];

    const submit = (event) => {
        event.preventDefault();
        form.post(route('inventory.coverage.upsert'), {
            onSuccess: () => {
                form.reset();
                form.setData('role', 'sellable');
                form.setData('is_active', true);
            },
        });
    };

    return (
        <AppPage
            eyebrow="Inventory"
            title="Restaurant Coverage Matrix"
            subtitle="Assign sellable, back-store, and primary issue warehouse sources for each restaurant."
            actions={[
                <Button key="master" variant="outlined" onClick={() => router.visit(route('inventory.warehouses.index'))}>
                    Warehouse Master
                </Button>,
            ]}
        >
            <SurfaceCard title="Coverage Assignment" subtitle="Set warehouse/location role mapping for restaurant inventory visibility and POS consumption.">
                <Grid container spacing={2} component="form" onSubmit={submit}>
                    <Grid item xs={12} md={3}>
                        <TextField
                            select
                            label="Restaurant"
                            value={form.data.restaurant_id}
                            onChange={(event) => form.setData('restaurant_id', event.target.value)}
                            error={!!form.errors.restaurant_id}
                            helperText={form.errors.restaurant_id}
                            fullWidth
                        >
                            <MenuItem value="">Select restaurant</MenuItem>
                            {restaurants.map((restaurant) => (
                                <MenuItem key={restaurant.id} value={restaurant.id}>{restaurant.name}</MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <TextField
                            select
                            label="Warehouse"
                            value={form.data.warehouse_id}
                            onChange={(event) => {
                                form.setData('warehouse_id', event.target.value);
                                form.setData('warehouse_location_id', '');
                            }}
                            error={!!form.errors.warehouse_id}
                            helperText={form.errors.warehouse_id}
                            fullWidth
                        >
                            <MenuItem value="">Select warehouse</MenuItem>
                            {warehouses.map((warehouse) => (
                                <MenuItem key={warehouse.id} value={warehouse.id}>{warehouse.code} · {warehouse.name}</MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                    <Grid item xs={12} md={2}>
                        <TextField
                            select
                            label="Location"
                            value={form.data.warehouse_location_id}
                            onChange={(event) => form.setData('warehouse_location_id', event.target.value)}
                            fullWidth
                        >
                            <MenuItem value="">Whole warehouse</MenuItem>
                            {locationOptions.map((location) => (
                                <MenuItem key={location.id} value={location.id}>{location.code} · {location.name}</MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                    <Grid item xs={12} md={2}>
                        <TextField
                            select
                            label="Role"
                            value={form.data.role}
                            onChange={(event) => form.setData('role', event.target.value)}
                            fullWidth
                        >
                            <MenuItem value="sellable">Sellable</MenuItem>
                            <MenuItem value="back_store">Back Store</MenuItem>
                            <MenuItem value="primary_issue_source">Primary Source</MenuItem>
                        </TextField>
                    </Grid>
                    <Grid item xs={12} md={2}>
                        <TextField
                            select
                            label="Primary"
                            value={form.data.is_primary ? 'yes' : 'no'}
                            onChange={(event) => form.setData('is_primary', event.target.value === 'yes')}
                            fullWidth
                        >
                            <MenuItem value="no">No</MenuItem>
                            <MenuItem value="yes">Yes</MenuItem>
                        </TextField>
                    </Grid>
                    <Grid item xs={12}>
                        <Button type="submit" variant="contained" disabled={form.processing}>Save Coverage</Button>
                    </Grid>
                </Grid>
            </SurfaceCard>

            <SurfaceCard title="Active Coverage Register" subtitle="Current restaurant-to-warehouse role mapping matrix.">
                <AdminDataTable
                    columns={[
                        { key: 'restaurant', label: 'Restaurant', minWidth: 200 },
                        { key: 'warehouse', label: 'Warehouse', minWidth: 240 },
                        { key: 'location', label: 'Location', minWidth: 220 },
                        { key: 'role', label: 'Role', minWidth: 160 },
                        { key: 'primary', label: 'Primary', minWidth: 120 },
                        { key: 'status', label: 'Status', minWidth: 120 },
                        { key: 'action', label: 'Action', minWidth: 120, align: 'right' },
                    ]}
                    rows={assignments}
                    tableMinWidth={1120}
                    emptyMessage="No active coverage assignments configured."
                    renderRow={(assignment) => (
                        <TableRow hover key={assignment.id}>
                            <TableCell>{assignment.restaurant?.name || '-'}</TableCell>
                            <TableCell>{assignment.warehouse ? `${assignment.warehouse.code} · ${assignment.warehouse.name}` : '-'}</TableCell>
                            <TableCell>{assignment.warehouse_location ? `${assignment.warehouse_location.code} · ${assignment.warehouse_location.name}` : 'Whole warehouse'}</TableCell>
                            <TableCell>{String(assignment.role || '').replaceAll('_', ' ')}</TableCell>
                            <TableCell>{assignment.is_primary ? 'Yes' : 'No'}</TableCell>
                            <TableCell>
                                <Chip size="small" label={assignment.is_active ? 'Active' : 'Inactive'} color={assignment.is_active ? 'success' : 'default'} variant="outlined" />
                            </TableCell>
                            <TableCell align="right">
                                <Button size="small" color="error" variant="outlined" onClick={() => router.delete(route('inventory.warehouse-assignments.destroy', assignment.id))}>
                                    Remove
                                </Button>
                            </TableCell>
                        </TableRow>
                    )}
                />
            </SurfaceCard>
        </AppPage>
    );
}

