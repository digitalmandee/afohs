import React from 'react';
import { router } from '@inertiajs/react';
import { Box, Button, Chip, Grid, MenuItem, Stack, TableCell, TableRow, TextField, Typography } from '@mui/material';
import AppPage from '@/components/App/ui/AppPage';
import SurfaceCard from '@/components/App/ui/SurfaceCard';
import StatCard from '@/components/App/ui/StatCard';
import AdminDataTable from '@/components/App/ui/AdminDataTable';

const tabs = ['overview', 'inventory', 'locations', 'documents', 'movements', 'valuation', 'coverage'];

export default function WarehouseShow({
    warehouse,
    tab = 'overview',
    inventory = [],
    documents = [],
    movements = {},
    valuation = [],
    coverageAssignments = [],
    inventoryStatus = {},
}) {
    const onTabChange = (nextTab) => {
        router.get(route('inventory.warehouses.show', warehouse.id), { tab: nextTab }, { preserveState: true, preserveScroll: true, replace: true });
    };

    return (
        <AppPage
            eyebrow="Inventory"
            title={`${warehouse.code} · ${warehouse.name}`}
            subtitle="Warehouse detail control center with inventory, documents, movements, valuation, and coverage."
            actions={[
                <Button key="back" variant="outlined" onClick={() => router.visit(route('inventory.warehouses.index'))}>
                    Back to Master
                </Button>,
                <Button key="items" variant="outlined" onClick={() => router.visit(route('pos.inventory.index'))}>
                    Inventory Items
                </Button>,
                <Button key="ops" variant="contained" onClick={() => router.visit(route('inventory.operations.index'))}>
                    Stock Movements
                </Button>,
            ]}
        >
            <Grid container spacing={2.25}>
                <Grid item xs={12} md={3}><StatCard label="Status" value={warehouse.status || '-'} accent /></Grid>
                <Grid item xs={12} md={3}><StatCard label="Category" value={warehouse.category?.name || '-'} tone="light" /></Grid>
                <Grid item xs={12} md={3}><StatCard label="Locations" value={(warehouse.locations || []).length} tone="light" /></Grid>
                <Grid item xs={12} md={3}><StatCard label="Coverage" value={warehouse.all_restaurants ? 'All restaurants' : `${(warehouse.coverage_restaurants || []).length} selected`} tone="muted" /></Grid>
            </Grid>

            <SurfaceCard title="Warehouse Tabs" subtitle="Switch between operational views for this warehouse.">
                <TextField
                    select
                    label="View"
                    value={tab}
                    onChange={(event) => onTabChange(event.target.value)}
                    sx={{ minWidth: 280 }}
                >
                    {tabs.map((option) => (
                        <MenuItem key={option} value={option}>{option.replaceAll('_', ' ')}</MenuItem>
                    ))}
                </TextField>
            </SurfaceCard>

            {tab === 'overview' && (
                <SurfaceCard title="Overview" subtitle="Coverage and location status at a glance.">
                    <Stack spacing={1.2}>
                        <Typography color="text.secondary">{warehouse.address || 'No warehouse notes/address provided.'}</Typography>
                        <Box>
                            {(warehouse.coverage_restaurants || []).map((restaurant) => (
                                <Chip key={restaurant.id} label={restaurant.name} sx={{ mr: 1, mb: 1 }} />
                            ))}
                            {warehouse.all_restaurants && <Chip label="All restaurants" color="primary" />}
                        </Box>
                    </Stack>
                </SurfaceCard>
            )}

            {tab === 'inventory' && (
                <SurfaceCard title="Inventory" subtitle="On-hand and valuation by inventory item and location in this warehouse.">
                    <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid item xs={12} md={3}><StatCard label="Configured Inventory Items" value={inventoryStatus.configured_products || 0} tone="light" /></Grid>
                        <Grid item xs={12} md={3}><StatCard label="Stocked Here" value={inventoryStatus.stocked_here_count || 0} tone="light" /></Grid>
                        <Grid item xs={12} md={3}><StatCard label="Stocked Elsewhere" value={inventoryStatus.stocked_elsewhere_count || 0} tone="light" /></Grid>
                        <Grid item xs={12} md={3}><StatCard label="No Movements Yet" value={inventoryStatus.configured_without_movements_count || 0} tone="muted" /></Grid>
                    </Grid>
                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mb: 2 }}>
                        <Chip size="small" variant="outlined" label={`Linked ingredients: ${inventoryStatus.linked_ingredients_here || 0} used here / ${inventoryStatus.linked_ingredients || 0} total`} />
                        <Chip size="small" variant="outlined" color="warning" label={`Legacy-only ingredients: ${inventoryStatus.legacy_only_ingredients || 0}`} />
                    </Stack>
                    {inventory.length === 0 ? (
                        <Box sx={{ mb: 2, p: 2, borderRadius: 3, border: '1px dashed', borderColor: 'divider', backgroundColor: 'rgba(6,52,85,0.03)' }}>
                            <Typography sx={{ fontWeight: 700, color: 'text.primary' }}>
                                No warehouse stock is posted in this warehouse yet.
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                                Configured inventory items: {inventoryStatus.configured_products || 0}. Items stocked elsewhere: {inventoryStatus.stocked_elsewhere_count || 0}. Items with no posted movements anywhere: {inventoryStatus.configured_without_movements_count || 0}.
                            </Typography>
                            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 1.5 }}>
                                <Button size="small" variant="contained" onClick={() => router.visit(route('pos.inventory.create'))}>
                                    Add Inventory Item
                                </Button>
                                <Button size="small" variant="outlined" onClick={() => router.visit(route('pos.ingredients.index'))}>
                                    Review Ingredients
                                </Button>
                            </Stack>
                        </Box>
                    ) : null}
                    <AdminDataTable
                        columns={[
                            { key: 'product', label: 'Inventory Item', minWidth: 260 },
                            { key: 'location', label: 'Location', minWidth: 220 },
                            { key: 'on_hand', label: 'On Hand', minWidth: 130, align: 'right' },
                            { key: 'reserved', label: 'Reserved', minWidth: 130, align: 'right' },
                            { key: 'available', label: 'Available', minWidth: 130, align: 'right' },
                            { key: 'avg_cost', label: 'Avg Cost', minWidth: 130, align: 'right' },
                            { key: 'value', label: 'Value', minWidth: 140, align: 'right' },
                        ]}
                        rows={inventory}
                        tableMinWidth={1220}
                        emptyMessage="No inventory rows found for this warehouse."
                        renderRow={(row, index) => (
                            <TableRow hover key={`${row.product_id}-${row.location}-${index}`}>
                                <TableCell>{row.product_code ? `${row.product_code} · ${row.product_name}` : row.product_name || '-'}</TableCell>
                                <TableCell>{row.location}</TableCell>
                                <TableCell align="right">{Number(row.on_hand || 0).toFixed(3)}</TableCell>
                                <TableCell align="right">{Number(row.reserved_qty || 0).toFixed(3)}</TableCell>
                                <TableCell align="right">{Number(row.available_qty || 0).toFixed(3)}</TableCell>
                                <TableCell align="right">{Number(row.avg_cost || 0).toFixed(4)}</TableCell>
                                <TableCell align="right">{Number(row.value || 0).toFixed(2)}</TableCell>
                            </TableRow>
                        )}
                    />
                </SurfaceCard>
            )}

            {tab === 'locations' && (
                <SurfaceCard title="Locations" subtitle="Location list inside this warehouse.">
                    <AdminDataTable
                        columns={[
                            { key: 'code', label: 'Code', minWidth: 140 },
                            { key: 'name', label: 'Location', minWidth: 240 },
                            { key: 'primary', label: 'Primary', minWidth: 120 },
                            { key: 'status', label: 'Status', minWidth: 120 },
                        ]}
                        rows={warehouse.locations || []}
                        tableMinWidth={720}
                        emptyMessage="No locations available for this warehouse."
                        renderRow={(location) => (
                            <TableRow hover key={location.id}>
                                <TableCell>{location.code}</TableCell>
                                <TableCell>{location.name}</TableCell>
                                <TableCell>{location.is_primary ? 'Yes' : 'No'}</TableCell>
                                <TableCell>{location.status}</TableCell>
                            </TableRow>
                        )}
                    />
                </SurfaceCard>
            )}

            {tab === 'documents' && (
                <SurfaceCard title="Documents" subtitle="Recent stock documents involving this warehouse.">
                    <AdminDataTable
                        columns={[
                            { key: 'doc', label: 'Doc No', minWidth: 150 },
                            { key: 'date', label: 'Date', minWidth: 120 },
                            { key: 'type', label: 'Type', minWidth: 140 },
                            { key: 'restaurant', label: 'Restaurant', minWidth: 170 },
                            { key: 'status', label: 'Status', minWidth: 120 },
                        ]}
                        rows={documents}
                        tableMinWidth={820}
                        emptyMessage="No documents found for this warehouse."
                        renderRow={(document) => (
                            <TableRow hover key={document.id}>
                                <TableCell>{document.document_no}</TableCell>
                                <TableCell>{document.transaction_date}</TableCell>
                                <TableCell>{String(document.type || '').replaceAll('_', ' ')}</TableCell>
                                <TableCell>{document.tenant?.name || '-'}</TableCell>
                                <TableCell>{document.status}</TableCell>
                            </TableRow>
                        )}
                    />
                </SurfaceCard>
            )}

            {tab === 'movements' && (
                <SurfaceCard title="Movements" subtitle="Movement ledger rows posted in this warehouse.">
                    <AdminDataTable
                        columns={[
                            { key: 'date', label: 'Date', minWidth: 120 },
                            { key: 'product', label: 'Inventory Item', minWidth: 230 },
                            { key: 'location', label: 'Location', minWidth: 180 },
                            { key: 'type', label: 'Type', minWidth: 140 },
                            { key: 'in', label: 'Qty In', minWidth: 120, align: 'right' },
                            { key: 'out', label: 'Qty Out', minWidth: 120, align: 'right' },
                            { key: 'value', label: 'Value', minWidth: 130, align: 'right' },
                        ]}
                        rows={movements?.data || []}
                        pagination={movements}
                        tableMinWidth={1040}
                        emptyMessage="No movement rows found for this warehouse."
                        renderRow={(row) => (
                            <TableRow hover key={row.id}>
                                <TableCell>{row.transaction_date}</TableCell>
                                <TableCell>{row.product ? `${row.product.menu_code || row.product.id} · ${row.product.name}` : '-'}</TableCell>
                                <TableCell>{row.warehouse_location ? `${row.warehouse_location.code} · ${row.warehouse_location.name}` : 'No location'}</TableCell>
                                <TableCell>{String(row.type || '').replaceAll('_', ' ')}</TableCell>
                                <TableCell align="right">{Number(row.qty_in || 0).toFixed(3)}</TableCell>
                                <TableCell align="right">{Number(row.qty_out || 0).toFixed(3)}</TableCell>
                                <TableCell align="right">{Number(row.total_cost || 0).toFixed(2)}</TableCell>
                            </TableRow>
                        )}
                    />
                </SurfaceCard>
            )}

            {tab === 'valuation' && (
                <SurfaceCard title="Valuation by Location" subtitle="Warehouse location valuation summary.">
                    <AdminDataTable
                        columns={[
                            { key: 'location', label: 'Location', minWidth: 240 },
                            { key: 'qty', label: 'Net Qty', minWidth: 130, align: 'right' },
                            { key: 'value', label: 'Valuation', minWidth: 150, align: 'right' },
                        ]}
                        rows={valuation}
                        tableMinWidth={620}
                        emptyMessage="No valuation rows for this warehouse."
                        renderRow={(row, index) => (
                            <TableRow hover key={`${row.location}-${index}`}>
                                <TableCell>{row.location}</TableCell>
                                <TableCell align="right">{Number(row.net_qty || 0).toFixed(3)}</TableCell>
                                <TableCell align="right">{Number(row.valuation || 0).toFixed(2)}</TableCell>
                            </TableRow>
                        )}
                    />
                </SurfaceCard>
            )}

            {tab === 'coverage' && (
                <SurfaceCard title="Coverage Roles" subtitle="Restaurant role mapping for sellable, back-store, and issue sources.">
                    <AdminDataTable
                        columns={[
                            { key: 'restaurant', label: 'Restaurant', minWidth: 220 },
                            { key: 'location', label: 'Location', minWidth: 220 },
                            { key: 'role', label: 'Role', minWidth: 180 },
                            { key: 'primary', label: 'Primary', minWidth: 120 },
                        ]}
                        rows={coverageAssignments}
                        tableMinWidth={760}
                        emptyMessage="No coverage assignments for this warehouse."
                        renderRow={(assignment) => (
                            <TableRow hover key={assignment.id}>
                                <TableCell>{assignment.restaurant?.name || '-'}</TableCell>
                                <TableCell>{assignment.warehouse_location ? `${assignment.warehouse_location.code} · ${assignment.warehouse_location.name}` : 'Whole warehouse'}</TableCell>
                                <TableCell>{String(assignment.role || '').replaceAll('_', ' ')}</TableCell>
                                <TableCell>{assignment.is_primary ? 'Yes' : 'No'}</TableCell>
                            </TableRow>
                        )}
                    />
                </SurfaceCard>
            )}
        </AppPage>
    );
}
