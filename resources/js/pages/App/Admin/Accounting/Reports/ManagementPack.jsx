import React from 'react';
import { router } from '@inertiajs/react';
import { Button, Grid, TableCell, TableRow, TextField } from '@mui/material';
import AppPage from '@/components/App/ui/AppPage';
import AdminDataTable from '@/components/App/ui/AdminDataTable';
import FilterToolbar from '@/components/App/ui/FilterToolbar';
import StatCard from '@/components/App/ui/StatCard';
import SurfaceCard from '@/components/App/ui/SurfaceCard';

function formatNumber(value, digits = 2) {
    return Number(value || 0).toFixed(digits);
}

export default function ManagementPack({ filters, cashFlow = {}, workingCapital = {}, arBySource = [], budgetSummary = {}, inventoryValuation = [], bankPositions = [] }) {
    const [localFilters, setLocalFilters] = React.useState({
        from: filters?.from || '',
        to: filters?.to || '',
    });

    React.useEffect(() => {
        setLocalFilters({
            from: filters?.from || '',
            to: filters?.to || '',
        });
    }, [filters]);

    return (
        <AppPage
            eyebrow="Accounting Reports"
            title="Management Pack"
            subtitle="Cash flow, working capital, inventory valuation, receivables exposure, and bank position in one standardized executive workspace."
        >
            <Grid container spacing={2.25}>
                <Grid item xs={12} md={3}><StatCard label="Cash Inflows" value={formatNumber(cashFlow?.inflows)} accent /></Grid>
                <Grid item xs={12} md={3}><StatCard label="Cash Outflows" value={formatNumber(cashFlow?.outflows)} tone="light" /></Grid>
                <Grid item xs={12} md={3}><StatCard label="Net Cash Flow" value={formatNumber(cashFlow?.net)} tone="light" /></Grid>
                <Grid item xs={12} md={3}><StatCard label="Working Capital" value={formatNumber(workingCapital?.net_position)} tone="muted" /></Grid>
            </Grid>

            <SurfaceCard title="Report Filters" subtitle="Adjust the reporting period while keeping all management views in the same premium shell.">
                <FilterToolbar onReset={() => router.get(route('accounting.reports.management-pack'))}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={3}>
                            <TextField label="From" type="date" value={localFilters.from} onChange={(event) => setLocalFilters((current) => ({ ...current, from: event.target.value }))} InputLabelProps={{ shrink: true }} fullWidth />
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <TextField label="To" type="date" value={localFilters.to} onChange={(event) => setLocalFilters((current) => ({ ...current, to: event.target.value }))} InputLabelProps={{ shrink: true }} fullWidth />
                        </Grid>
                        <Grid item xs={12}>
                            <Button
                                variant="contained"
                                onClick={() => router.get(route('accounting.reports.management-pack'), localFilters, {
                                    preserveState: true,
                                    preserveScroll: true,
                                    replace: true,
                                })}
                            >
                                Apply
                            </Button>
                        </Grid>
                    </Grid>
                </FilterToolbar>
            </SurfaceCard>

            <Grid container spacing={2.25}>
                <Grid item xs={12} md={4}><StatCard label="Budgeted" value={formatNumber(budgetSummary?.budgeted)} tone="light" /></Grid>
                <Grid item xs={12} md={4}><StatCard label="Actual" value={formatNumber(budgetSummary?.actual)} tone="light" /></Grid>
                <Grid item xs={12} md={4}><StatCard label="Variance" value={formatNumber(budgetSummary?.variance)} tone="muted" /></Grid>
            </Grid>

            <SurfaceCard title="Receivables by Source" subtitle="Outstanding source exposure linked to the broader accounting reporting layer.">
                <AdminDataTable
                    columns={[
                        { key: 'source', label: 'Source', minWidth: 180 },
                        { key: 'invoices', label: 'Invoices', minWidth: 140, align: 'right' },
                        { key: 'outstanding', label: 'Outstanding', minWidth: 160, align: 'right' },
                    ]}
                    rows={arBySource}
                    tableMinWidth={760}
                    emptyMessage="No source-wise receivable data found."
                    renderRow={(row, index) => (
                        <TableRow key={`${row.source}-${index}`} hover>
                            <TableCell sx={{ fontWeight: 700 }}>{row.source}</TableCell>
                            <TableCell align="right">{row.total_invoices || 0}</TableCell>
                            <TableCell align="right">{formatNumber(row.outstanding)}</TableCell>
                        </TableRow>
                    )}
                />
            </SurfaceCard>

            <SurfaceCard title="Inventory Valuation" subtitle="Warehouse-aware valuation using the same warehouse data model now powering stock operations.">
                <AdminDataTable
                    columns={[
                        { key: 'warehouse', label: 'Warehouse', minWidth: 160 },
                        { key: 'quantity', label: 'Net Qty', minWidth: 140, align: 'right' },
                        { key: 'valuation', label: 'Valuation', minWidth: 160, align: 'right' },
                    ]}
                    rows={inventoryValuation}
                    tableMinWidth={760}
                    emptyMessage="No inventory valuation data found."
                    renderRow={(row, index) => (
                        <TableRow key={`${row.warehouse_id}-${index}`} hover>
                            <TableCell sx={{ fontWeight: 700 }}>{row.warehouse_name || `Warehouse #${row.warehouse_id}`}</TableCell>
                            <TableCell align="right">{formatNumber(row.net_qty, 3)}</TableCell>
                            <TableCell align="right">{formatNumber(row.valuation)}</TableCell>
                        </TableRow>
                    )}
                />
            </SurfaceCard>

            <SurfaceCard title="Bank Positions" subtitle="Opening, movement, and closing visibility across bank-linked accounts.">
                <AdminDataTable
                    columns={[
                        { key: 'account', label: 'Account', minWidth: 220 },
                        { key: 'opening', label: 'Opening', minWidth: 140, align: 'right' },
                        { key: 'inflows', label: 'Inflows', minWidth: 140, align: 'right' },
                        { key: 'outflows', label: 'Outflows', minWidth: 140, align: 'right' },
                        { key: 'closing', label: 'Closing', minWidth: 140, align: 'right' },
                    ]}
                    rows={bankPositions}
                    tableMinWidth={980}
                    emptyMessage="No bank account position data found."
                    renderRow={(row) => (
                        <TableRow key={row.id} hover>
                            <TableCell sx={{ fontWeight: 700 }}>{row.name}</TableCell>
                            <TableCell align="right">{formatNumber(row.opening)}</TableCell>
                            <TableCell align="right">{formatNumber(row.inflows)}</TableCell>
                            <TableCell align="right">{formatNumber(row.outflows)}</TableCell>
                            <TableCell align="right">{formatNumber(row.closing)}</TableCell>
                        </TableRow>
                    )}
                />
            </SurfaceCard>
        </AppPage>
    );
}
