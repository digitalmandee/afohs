import React from 'react';
import { router } from '@inertiajs/react';
import { Alert, Button, Grid, MenuItem, TableCell, TableRow, TextField } from '@mui/material';
import AppPage from '@/components/App/ui/AppPage';
import SurfaceCard from '@/components/App/ui/SurfaceCard';
import AdminDataTable from '@/components/App/ui/AdminDataTable';
import FilterToolbar from '@/components/App/ui/FilterToolbar';

export default function WarehouseLocationsIndex({ locations, warehouses = [], filters = {}, error = null }) {
    const [localFilters, setLocalFilters] = React.useState({
        search: filters.search || '',
        warehouse_id: filters.warehouse_id || '',
        status: filters.status || '',
        per_page: filters.per_page || locations?.per_page || 25,
    });

    const applyFilters = (next) => {
        const payload = { per_page: next.per_page || 25 };
        if (next.search?.trim()) payload.search = next.search.trim();
        if (next.warehouse_id) payload.warehouse_id = next.warehouse_id;
        if (next.status) payload.status = next.status;
        router.get(route('inventory.locations.index'), payload, { preserveState: true, preserveScroll: true, replace: true });
    };

    const updateFilter = (key, value, immediate = false) => {
        const next = { ...localFilters, [key]: value };
        setLocalFilters(next);
        if (immediate) {
            applyFilters(next);
        }
    };

    return (
        <AppPage
            eyebrow="Inventory"
            title="Warehouse Locations"
            subtitle="Manage and review locations across all warehouses from one master register."
            actions={[
                <Button key="master" variant="outlined" onClick={() => router.visit(route('inventory.warehouses.index'))}>
                    Warehouse Master
                </Button>,
            ]}
        >
            {error ? <Alert severity="warning" variant="outlined">{error}</Alert> : null}
            <SurfaceCard title="Live Filters" subtitle="Search by warehouse, location code, or status.">
                <FilterToolbar
                    onReset={() => {
                        const reset = { search: '', warehouse_id: '', status: '', per_page: localFilters.per_page || 25 };
                        setLocalFilters(reset);
                        applyFilters(reset);
                    }}
                    onApply={() => applyFilters(localFilters)}
                    lowChrome
                    title="Filters"
                    subtitle="Refine locations by search, warehouse, and status."
                >
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={5}>
                            <TextField
                                label="Search warehouse/location"
                                value={localFilters.search}
                                onChange={(event) => updateFilter('search', event.target.value)}
                                onBlur={() => applyFilters(localFilters)}
                                fullWidth
                            />
                        </Grid>
                        <Grid item xs={12} md={3.5}>
                            <TextField select label="Warehouse" value={localFilters.warehouse_id} onChange={(event) => updateFilter('warehouse_id', event.target.value, true)} fullWidth>
                                <MenuItem value="">All warehouses</MenuItem>
                                {warehouses.map((warehouse) => (
                                    <MenuItem key={warehouse.id} value={warehouse.id}>{warehouse.code} · {warehouse.name}</MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={3.5}>
                            <TextField select label="Status" value={localFilters.status} onChange={(event) => updateFilter('status', event.target.value, true)} fullWidth>
                                <MenuItem value="">All statuses</MenuItem>
                                <MenuItem value="active">Active</MenuItem>
                                <MenuItem value="inactive">Inactive</MenuItem>
                            </TextField>
                        </Grid>
                    </Grid>
                </FilterToolbar>
            </SurfaceCard>

            <SurfaceCard title="Locations Register" subtitle="Global location directory across warehouse masters.">
                <AdminDataTable
                    columns={[
                        { key: 'warehouse', label: 'Warehouse', minWidth: 230 },
                        { key: 'code', label: 'Location Code', minWidth: 150 },
                        { key: 'name', label: 'Location Name', minWidth: 220 },
                        { key: 'restaurant', label: 'Restaurant', minWidth: 180 },
                        { key: 'primary', label: 'Primary', minWidth: 120 },
                        { key: 'status', label: 'Status', minWidth: 120 },
                    ]}
                    rows={locations?.data || []}
                    pagination={locations}
                    tableMinWidth={980}
                    emptyMessage="No locations found."
                    renderRow={(location) => (
                        <TableRow hover key={location.id}>
                            <TableCell>{location.warehouse ? `${location.warehouse.code} · ${location.warehouse.name}` : '-'}</TableCell>
                            <TableCell>{location.code}</TableCell>
                            <TableCell>{location.name}</TableCell>
                            <TableCell>{location.tenant?.name || '-'}</TableCell>
                            <TableCell>{location.is_primary ? 'Yes' : 'No'}</TableCell>
                            <TableCell>{location.status}</TableCell>
                        </TableRow>
                    )}
                />
            </SurfaceCard>
        </AppPage>
    );
}
