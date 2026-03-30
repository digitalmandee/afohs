import React from 'react';
import { Alert, Grid, TableCell, TableRow } from '@mui/material';
import AppPage from '@/components/App/ui/AppPage';
import SurfaceCard from '@/components/App/ui/SurfaceCard';
import StatCard from '@/components/App/ui/StatCard';
import AdminDataTable from '@/components/App/ui/AdminDataTable';
import { formatAmount, formatCount } from '@/lib/formatting';

export default function WarehouseValuationIndex({
    summary = {},
    byWarehouse = [],
    byLocation = [],
    byRestaurant = [],
    movementValueDelta = [],
    error = null,
}) {
    return (
        <AppPage
            eyebrow="Inventory"
            title="Valuation & Reconciliation"
            subtitle="Warehouse-, location-, and restaurant-level inventory value visibility with movement value deltas."
        >
            {error ? <Alert severity="warning" variant="outlined">{error}</Alert> : null}
            <Grid container spacing={2.25}>
                <Grid item xs={12} md={4}><StatCard label="Total Valuation" value={formatAmount(summary.total_valuation)} accent /></Grid>
                <Grid item xs={12} md={4}><StatCard label="Warehouses" value={formatCount(summary.warehouse_count)} tone="light" /></Grid>
                <Grid item xs={12} md={4}><StatCard label="Restaurants" value={formatCount(summary.restaurant_count)} tone="muted" /></Grid>
            </Grid>

            <Grid container spacing={2.25}>
                <Grid item xs={12} lg={6}>
                    <SurfaceCard title="Valuation by Warehouse" subtitle="Stock value rollup by warehouse.">
                        <AdminDataTable
                            columns={[
                                { key: 'warehouse', label: 'Warehouse', minWidth: 220 },
                                { key: 'qty', label: 'Net Qty', minWidth: 140, align: 'right' },
                                { key: 'value', label: 'Valuation', minWidth: 160, align: 'right' },
                            ]}
                            rows={byWarehouse}
                            tableMinWidth={620}
                            emptyMessage="No warehouse valuation rows found."
                            renderRow={(row, index) => (
                                <TableRow hover key={`${row.warehouse_id}-${index}`}>
                                    <TableCell>{row.warehouse ? `${row.warehouse.code} · ${row.warehouse.name}` : '-'}</TableCell>
                                    <TableCell align="right">{Number(row.net_qty || 0).toFixed(3)}</TableCell>
                                    <TableCell align="right">{formatAmount(row.valuation)}</TableCell>
                                </TableRow>
                            )}
                        />
                    </SurfaceCard>
                </Grid>
                <Grid item xs={12} lg={6}>
                    <SurfaceCard title="Valuation by Restaurant" subtitle="Restaurant scope valuation from warehouse-aware ledger movements.">
                        <AdminDataTable
                            columns={[
                                { key: 'restaurant', label: 'Restaurant', minWidth: 220 },
                                { key: 'qty', label: 'Net Qty', minWidth: 140, align: 'right' },
                                { key: 'value', label: 'Valuation', minWidth: 160, align: 'right' },
                            ]}
                            rows={byRestaurant}
                            tableMinWidth={620}
                            emptyMessage="No restaurant valuation rows found."
                            renderRow={(row, index) => (
                                <TableRow hover key={`${row.tenant_id}-${index}`}>
                                    <TableCell>{row.tenant?.name || '-'}</TableCell>
                                    <TableCell align="right">{Number(row.net_qty || 0).toFixed(3)}</TableCell>
                                    <TableCell align="right">{formatAmount(row.valuation)}</TableCell>
                                </TableRow>
                            )}
                        />
                    </SurfaceCard>
                </Grid>
            </Grid>

            <SurfaceCard title="Valuation by Location" subtitle="Warehouse location-level stock quantity and value view.">
                <AdminDataTable
                    columns={[
                        { key: 'warehouse', label: 'Warehouse', minWidth: 220 },
                        { key: 'location', label: 'Location', minWidth: 220 },
                        { key: 'qty', label: 'Net Qty', minWidth: 140, align: 'right' },
                        { key: 'value', label: 'Valuation', minWidth: 160, align: 'right' },
                    ]}
                    rows={byLocation}
                    tableMinWidth={920}
                    emptyMessage="No location valuation rows found."
                    renderRow={(row, index) => (
                        <TableRow hover key={`${row.warehouse_location_id}-${index}`}>
                            <TableCell>{row.warehouse ? `${row.warehouse.code} · ${row.warehouse.name}` : '-'}</TableCell>
                            <TableCell>{row.warehouse_location ? `${row.warehouse_location.code} · ${row.warehouse_location.name}` : 'No location'}</TableCell>
                            <TableCell align="right">{Number(row.net_qty || 0).toFixed(3)}</TableCell>
                            <TableCell align="right">{formatAmount(row.valuation)}</TableCell>
                        </TableRow>
                    )}
                />
            </SurfaceCard>

            <SurfaceCard title="Movement-Value Delta" subtitle="Value impact by movement type for reconciliation checks.">
                <AdminDataTable
                    columns={[
                        { key: 'type', label: 'Movement Type', minWidth: 220 },
                        { key: 'qty', label: 'Net Qty', minWidth: 140, align: 'right' },
                        { key: 'value', label: 'Total Value', minWidth: 160, align: 'right' },
                    ]}
                    rows={movementValueDelta}
                    tableMinWidth={620}
                    emptyMessage="No movement delta rows found."
                    renderRow={(row, index) => (
                        <TableRow hover key={`${row.type}-${index}`}>
                            <TableCell>{String(row.type || '').replaceAll('_', ' ')}</TableCell>
                            <TableCell align="right">{Number(row.net_qty || 0).toFixed(3)}</TableCell>
                            <TableCell align="right">{formatAmount(row.total_value)}</TableCell>
                        </TableRow>
                    )}
                />
            </SurfaceCard>
        </AppPage>
    );
}
