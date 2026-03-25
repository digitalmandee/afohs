import React from 'react';
import { router } from '@inertiajs/react';
import { Box, Button, Chip, Grid, Stack, TableCell, TableRow, Typography } from '@mui/material';
import AppPage from '@/components/App/ui/AppPage';
import SurfaceCard from '@/components/App/ui/SurfaceCard';
import StatCard from '@/components/App/ui/StatCard';
import AdminDataTable from '@/components/App/ui/AdminDataTable';

export default function Dashboard({
    summary = {},
    todayMovements = {},
    valuationByWarehouse = [],
    restaurantSnapshot = [],
    recentDocuments = [],
    transferAlerts = [],
}) {
    return (
        <AppPage
            eyebrow="Inventory"
            title="Warehouse Dashboard"
            subtitle="Cross-warehouse health, movement trends, valuation, and transfer-readiness in one full-width command center."
            actions={[
                <Button key="master" variant="outlined" onClick={() => router.visit(route('inventory.warehouses.index'))}>
                    Warehouse Master
                </Button>,
                <Button key="locations" variant="outlined" onClick={() => router.visit(route('inventory.locations.index'))}>
                    Locations
                </Button>,
                <Button key="items" variant="outlined" onClick={() => router.visit(route('inventory.items.index'))}>
                    Inventory Items
                </Button>,
                <Button key="ops" variant="outlined" onClick={() => router.visit(route('inventory.operations.index'))}>
                    Stock Movements
                </Button>,
                <Button key="create" variant="contained" onClick={() => router.visit(route('inventory.items.create'))}>
                    Add Inventory Item
                </Button>,
            ]}
        >
            <Grid container spacing={2.25}>
                <Grid item xs={12} md={2.4}><StatCard label="Total Warehouses" value={summary.total_warehouses || 0} accent /></Grid>
                <Grid item xs={12} md={2.4}><StatCard label="Active Warehouses" value={summary.active_warehouses || 0} tone="light" /></Grid>
                <Grid item xs={12} md={2.4}><StatCard label="Active Locations" value={summary.active_locations || 0} tone="light" /></Grid>
                <Grid item xs={12} md={2.4}><StatCard label="Low Stock Items" value={summary.low_stock_count || 0} tone="muted" /></Grid>
                <Grid item xs={12} md={2.4}><StatCard label="Out of Stock" value={summary.out_of_stock_count || 0} tone="muted" /></Grid>
                <Grid item xs={12} md={4}><StatCard label="Today In Qty" value={Number(todayMovements.in || 0).toFixed(3)} tone="light" /></Grid>
                <Grid item xs={12} md={4}><StatCard label="Today Out Qty" value={Number(todayMovements.out || 0).toFixed(3)} tone="light" /></Grid>
                <Grid item xs={12} md={4}><StatCard label="Today Transfers" value={todayMovements.transfer || 0} tone="light" /></Grid>
                <Grid item xs={12} md={3}><StatCard label="Configured Inventory Items" value={summary.configured_products || 0} tone="light" /></Grid>
                <Grid item xs={12} md={3}><StatCard label="Inventory Items With Stock" value={summary.tracked_products || 0} tone="light" /></Grid>
                <Grid item xs={12} md={3}><StatCard label="Linked Ingredients" value={summary.linked_ingredients || 0} tone="light" /></Grid>
                <Grid item xs={12} md={3}><StatCard label="Legacy-only Ingredients" value={summary.legacy_only_ingredients || 0} tone="muted" /></Grid>
            </Grid>

            <SurfaceCard title="Inventory Model" subtitle="Keep stock in inventory items, then link ingredients when recipes should consume warehouse balances.">
                <Stack direction="row" spacing={1.2} useFlexGap flexWrap="wrap" sx={{ mb: 1.25 }}>
                    <Chip size="small" color="primary" variant="outlined" label={`Configured inventory items: ${summary.configured_products || 0}`} />
                    <Chip size="small" color="success" variant="outlined" label={`Linked ingredients: ${summary.linked_ingredients || 0}`} />
                    <Chip size="small" color="warning" variant="outlined" label={`Not linked to inventory: ${summary.legacy_only_ingredients || 0}`} />
                </Stack>
                <Typography variant="body2" color="text.secondary">
                    Ingredients are recipe records. Inventory Items are the stock-managed raw materials that appear in warehouses, stock movements, and purchasing.
                </Typography>
                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 1.5 }}>
                    <Button size="small" variant="contained" onClick={() => router.visit(route('inventory.items.create'))}>
                        Add Inventory Item
                    </Button>
                    <Button size="small" variant="outlined" onClick={() => router.visit(route('inventory.ingredients.index'))}>
                        Review Ingredients
                    </Button>
                </Stack>
            </SurfaceCard>

            <Grid container spacing={2.25}>
                <Grid item xs={12} lg={6}>
                    <SurfaceCard title="Valuation by Warehouse" subtitle="Warehouse-level quantity and valuation snapshot.">
                        <AdminDataTable
                            columns={[
                                { key: 'warehouse', label: 'Warehouse', minWidth: 220 },
                                { key: 'qty', label: 'Net Qty', minWidth: 140, align: 'right' },
                                { key: 'valuation', label: 'Valuation', minWidth: 160, align: 'right' },
                            ]}
                            rows={valuationByWarehouse}
                            tableMinWidth={620}
                            emptyMessage="No valuation rows available."
                            renderRow={(row, index) => (
                                <TableRow hover key={`${row.warehouse_id}-${index}`}>
                                    <TableCell>{row.warehouse_code ? `${row.warehouse_code} · ${row.warehouse_name}` : row.warehouse_name || '-'}</TableCell>
                                    <TableCell align="right">{Number(row.net_qty || 0).toFixed(3)}</TableCell>
                                    <TableCell align="right">{Number(row.valuation || 0).toFixed(2)}</TableCell>
                                </TableRow>
                            )}
                        />
                    </SurfaceCard>
                </Grid>
                <Grid item xs={12} lg={6}>
                    <SurfaceCard title="Restaurant Stock Snapshot" subtitle="Restaurant-wise warehouse balance and value.">
                        <AdminDataTable
                            columns={[
                                { key: 'restaurant', label: 'Restaurant', minWidth: 220 },
                                { key: 'qty', label: 'Net Qty', minWidth: 140, align: 'right' },
                                { key: 'valuation', label: 'Valuation', minWidth: 160, align: 'right' },
                            ]}
                            rows={restaurantSnapshot}
                            tableMinWidth={620}
                            emptyMessage="No restaurant snapshot data available."
                            renderRow={(row, index) => (
                                <TableRow hover key={`${row.restaurant_id}-${index}`}>
                                    <TableCell>{row.restaurant_name || '-'}</TableCell>
                                    <TableCell align="right">{Number(row.net_qty || 0).toFixed(3)}</TableCell>
                                    <TableCell align="right">{Number(row.valuation || 0).toFixed(2)}</TableCell>
                                </TableRow>
                            )}
                        />
                    </SurfaceCard>
                </Grid>
            </Grid>

            <Grid container spacing={2.25}>
                <Grid item xs={12} lg={7}>
                    <SurfaceCard title="Recent Stock Documents" subtitle="GRN, transfer, opening, and adjustment documents from warehouse operations.">
                        <AdminDataTable
                            columns={[
                                { key: 'doc', label: 'Document', minWidth: 160 },
                                { key: 'date', label: 'Date', minWidth: 120 },
                                { key: 'restaurant', label: 'Restaurant', minWidth: 170 },
                                { key: 'warehouse', label: 'Warehouse', minWidth: 240 },
                                { key: 'status', label: 'Status', minWidth: 120 },
                            ]}
                            rows={recentDocuments}
                            tableMinWidth={980}
                            emptyMessage="No stock documents posted yet."
                            renderRow={(document) => (
                                <TableRow hover key={document.id}>
                                    <TableCell>{document.document_no}</TableCell>
                                    <TableCell>{document.transaction_date}</TableCell>
                                    <TableCell>{document.tenant?.name || '-'}</TableCell>
                                    <TableCell>
                                        {document.source_warehouse?.name || document.destination_warehouse?.name || '-'}
                                    </TableCell>
                                    <TableCell>
                                        <Chip size="small" label={document.status} color={document.status === 'posted' ? 'success' : 'default'} variant="outlined" />
                                    </TableCell>
                                </TableRow>
                            )}
                        />
                    </SurfaceCard>
                </Grid>
                <Grid item xs={12} lg={5}>
                    <SurfaceCard title="Transfer Needed Alerts" subtitle="Back-store assigned but no active sellable source configured.">
                        <Stack spacing={1.2}>
                            {transferAlerts.length === 0 ? (
                                <Typography color="text.secondary">No transfer alerts right now.</Typography>
                            ) : transferAlerts.map((alert, index) => (
                                <Box
                                    key={`${alert.restaurant_name}-${index}`}
                                    sx={{ p: 2, borderRadius: 3.5, border: '1px solid', borderColor: 'divider', backgroundColor: 'rgba(250, 247, 236, 0.8)' }}
                                >
                                    <Typography sx={{ fontWeight: 700, color: 'text.primary' }}>{alert.restaurant_name}</Typography>
                                    <Typography variant="body2" color="text.secondary">{alert.message}</Typography>
                                </Box>
                            ))}
                        </Stack>
                    </SurfaceCard>
                </Grid>
            </Grid>
        </AppPage>
    );
}
