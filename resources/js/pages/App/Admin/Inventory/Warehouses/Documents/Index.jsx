import React from 'react';
import { router } from '@inertiajs/react';
import { Alert, Grid, MenuItem, TableCell, TableRow, TextField } from '@mui/material';
import AppPage from '@/components/App/ui/AppPage';
import SurfaceCard from '@/components/App/ui/SurfaceCard';
import FilterToolbar from '@/components/App/ui/FilterToolbar';
import AdminDataTable from '@/components/App/ui/AdminDataTable';

export default function WarehouseDocumentsIndex({ documents, filters = {}, warehouses = [], tenants = [], error = null }) {
    const [localFilters, setLocalFilters] = React.useState({
        search: filters.search || '',
        type: filters.type || '',
        restaurant_id: filters.restaurant_id || '',
        warehouse_id: filters.warehouse_id || '',
        per_page: filters.per_page || documents?.per_page || 25,
    });

    const applyFilters = (next) => {
        const payload = { per_page: next.per_page || 25 };
        if (next.search?.trim()) payload.search = next.search.trim();
        if (next.type) payload.type = next.type;
        if (next.restaurant_id) payload.restaurant_id = next.restaurant_id;
        if (next.warehouse_id) payload.warehouse_id = next.warehouse_id;
        router.get(route('inventory.documents.index'), payload, { preserveState: true, preserveScroll: true, replace: true });
    };

    const update = (key, value, immediate = false) => {
        const next = { ...localFilters, [key]: value };
        setLocalFilters(next);
        if (immediate) applyFilters(next);
    };

    return (
        <AppPage
            eyebrow="Inventory"
            title="Stock Documents"
            subtitle="Document-level register for GRN, transfer, adjustment, opening balance, and stock issue batches."
        >
            {error ? <Alert severity="warning" variant="outlined">{error}</Alert> : null}
            <SurfaceCard title="Live Filters" subtitle="Filter by document number, warehouse, restaurant, and document type.">
                <FilterToolbar
                    onReset={() => {
                        const reset = { search: '', type: '', restaurant_id: '', warehouse_id: '', per_page: localFilters.per_page || 25 };
                        setLocalFilters(reset);
                        applyFilters(reset);
                    }}
                    onApply={() => applyFilters(localFilters)}
                    lowChrome
                    title="Filters"
                    subtitle="Refine stock documents by search, type, restaurant, and warehouse."
                >
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={4}>
                            <TextField label="Search document" value={localFilters.search} onChange={(event) => update('search', event.target.value)} onBlur={() => applyFilters(localFilters)} fullWidth />
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <TextField select label="Type" value={localFilters.type} onChange={(event) => update('type', event.target.value, true)} fullWidth>
                                <MenuItem value="">All</MenuItem>
                                <MenuItem value="opening_balance">Opening</MenuItem>
                                <MenuItem value="adjustment">Adjustment</MenuItem>
                                <MenuItem value="transfer">Transfer</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <TextField select label="Restaurant" value={localFilters.restaurant_id} onChange={(event) => update('restaurant_id', event.target.value, true)} fullWidth>
                                <MenuItem value="">All restaurants</MenuItem>
                                {tenants.map((tenant) => (
                                    <MenuItem key={tenant.id} value={tenant.id}>{tenant.name}</MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <TextField select label="Warehouse" value={localFilters.warehouse_id} onChange={(event) => update('warehouse_id', event.target.value, true)} fullWidth>
                                <MenuItem value="">All warehouses</MenuItem>
                                {warehouses.map((warehouse) => (
                                    <MenuItem key={warehouse.id} value={warehouse.id}>{warehouse.code} · {warehouse.name}</MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                    </Grid>
                </FilterToolbar>
            </SurfaceCard>

            <SurfaceCard title="Document Register" subtitle="Track stock-impacting documents and trace source modules.">
                <AdminDataTable
                    columns={[
                        { key: 'doc', label: 'Doc No', minWidth: 150 },
                        { key: 'date', label: 'Date', minWidth: 120 },
                        { key: 'type', label: 'Type', minWidth: 140 },
                        { key: 'restaurant', label: 'Restaurant', minWidth: 180 },
                        { key: 'source', label: 'Source', minWidth: 240 },
                        { key: 'destination', label: 'Destination', minWidth: 240 },
                        { key: 'status', label: 'Status', minWidth: 120 },
                    ]}
                    rows={documents?.data || []}
                    pagination={documents}
                    tableMinWidth={1280}
                    emptyMessage="No stock documents found."
                    renderRow={(document) => (
                        <TableRow hover key={document.id}>
                            <TableCell>{document.document_no}</TableCell>
                            <TableCell>{document.transaction_date}</TableCell>
                            <TableCell>{String(document.type || '').replaceAll('_', ' ')}</TableCell>
                            <TableCell>{document.tenant?.name || '-'}</TableCell>
                            <TableCell>{document.source_warehouse ? `${document.source_warehouse.code} · ${document.source_warehouse.name}` : '-'}</TableCell>
                            <TableCell>{document.destination_warehouse ? `${document.destination_warehouse.code} · ${document.destination_warehouse.name}` : '-'}</TableCell>
                            <TableCell>{document.status}</TableCell>
                        </TableRow>
                    )}
                />
            </SurfaceCard>
        </AppPage>
    );
}
