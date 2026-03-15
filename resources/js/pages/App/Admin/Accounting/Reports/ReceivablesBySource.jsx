import React from 'react';
import { router } from '@inertiajs/react';
import { Button, Chip, Grid, MenuItem, TableCell, TableRow, TextField, Typography } from '@mui/material';
import AppPage from '@/components/App/ui/AppPage';
import AdminDataTable from '@/components/App/ui/AdminDataTable';
import FilterToolbar from '@/components/App/ui/FilterToolbar';
import StatCard from '@/components/App/ui/StatCard';
import SurfaceCard from '@/components/App/ui/SurfaceCard';

function formatNumber(value, digits = 2) {
    return Number(value || 0).toFixed(digits);
}

export default function ReceivablesBySource({ rows, summary = {}, sourceOptions = [], filters = {} }) {
    const list = rows?.data || [];
    const sourceTotals = summary?.source_totals || {};
    const [localFilters, setLocalFilters] = React.useState({
        search: filters?.search || '',
        source: filters?.source || '',
        bucket: filters?.bucket || '',
        from: filters?.from || '',
        to: filters?.to || '',
    });

    React.useEffect(() => {
        setLocalFilters({
            search: filters?.search || '',
            source: filters?.source || '',
            bucket: filters?.bucket || '',
            from: filters?.from || '',
            to: filters?.to || '',
        });
    }, [filters]);

    const applyFilters = (nextFilters = localFilters) => {
        router.get(route('accounting.reports.receivables-by-source'), nextFilters, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    return (
        <AppPage
            eyebrow="Accounting Reports"
            title="Receivables by Source"
            subtitle="Unified source-wise receivables for membership, subscriptions, POS, room bookings, and events in the standardized reporting shell."
            actions={[
                <Button
                    key="csv"
                    variant="outlined"
                    onClick={() => {
                        window.location.href = route('accounting.reports.receivables-by-source', {
                            ...localFilters,
                            export: 'csv',
                        });
                    }}
                >
                    Export CSV
                </Button>,
                <Button key="print" variant="outlined" onClick={() => window.print()}>
                    Print
                </Button>,
            ]}
        >
            <Grid container spacing={2.25}>
                <Grid item xs={12} md={3}><StatCard label="Open Receivables" value={summary.records || 0} accent /></Grid>
                <Grid item xs={12} md={3}><StatCard label="Outstanding" value={formatNumber(summary.total_balance)} tone="light" /></Grid>
                <Grid item xs={12} md={3}><StatCard label="Average Age" value={`${formatNumber(summary.average_age, 1)} days`} tone="light" /></Grid>
                <Grid item xs={12} md={3}><StatCard label="90+ Bucket" value={formatNumber(summary?.bucket_balance?.['90+'])} tone="muted" /></Grid>
            </Grid>

            <SurfaceCard title="Live Filters" subtitle="Filter by source, bucket, period, or party without using the older manual report form.">
                <FilterToolbar onReset={() => router.get(route('accounting.reports.receivables-by-source'))}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={3}>
                            <TextField label="Search invoice or party" value={localFilters.search} onChange={(event) => setLocalFilters((current) => ({ ...current, search: event.target.value }))} fullWidth />
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <TextField select label="Source" value={localFilters.source} onChange={(event) => setLocalFilters((current) => ({ ...current, source: event.target.value }))} fullWidth>
                                <MenuItem value="">All Sources</MenuItem>
                                {sourceOptions.map((source) => (
                                    <MenuItem key={source} value={source}>{source}</MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <TextField select label="Bucket" value={localFilters.bucket} onChange={(event) => setLocalFilters((current) => ({ ...current, bucket: event.target.value }))} fullWidth>
                                <MenuItem value="">All Buckets</MenuItem>
                                <MenuItem value="current">Current</MenuItem>
                                <MenuItem value="1-30">1-30</MenuItem>
                                <MenuItem value="31-60">31-60</MenuItem>
                                <MenuItem value="61-90">61-90</MenuItem>
                                <MenuItem value="90+">90+</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <TextField label="From" type="date" value={localFilters.from} onChange={(event) => setLocalFilters((current) => ({ ...current, from: event.target.value }))} InputLabelProps={{ shrink: true }} fullWidth />
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <TextField label="To" type="date" value={localFilters.to} onChange={(event) => setLocalFilters((current) => ({ ...current, to: event.target.value }))} InputLabelProps={{ shrink: true }} fullWidth />
                        </Grid>
                        <Grid item xs={12} md={1}>
                            <Button variant="contained" fullWidth onClick={() => applyFilters()}>
                                Apply
                            </Button>
                        </Grid>
                    </Grid>
                </FilterToolbar>

                <Grid container spacing={1.25} sx={{ mt: 0.5 }}>
                    {Object.keys(sourceTotals).length === 0 ? (
                        <Grid item xs={12}>
                            <Typography variant="body2" color="text.secondary">No source exposure data found.</Typography>
                        </Grid>
                    ) : Object.entries(sourceTotals).map(([source, stats]) => (
                        <Grid item key={source}>
                            <Chip
                                label={`${source}: ${formatNumber(stats.balance)} (${stats.count || 0})`}
                                sx={{ bgcolor: 'rgba(6,52,85,0.08)', color: 'primary.main', border: '1px solid rgba(6,52,85,0.18)' }}
                            />
                        </Grid>
                    ))}
                </Grid>
            </SurfaceCard>

            <SurfaceCard title="Receivables Register" subtitle="Source-level receivables aging with the same density, pagination, and brand treatment as the upgraded operational tables.">
                <AdminDataTable
                    columns={[
                        { key: 'invoice', label: 'Invoice', minWidth: 140 },
                        { key: 'source', label: 'Source', minWidth: 150 },
                        { key: 'restaurant', label: 'Restaurant', minWidth: 160 },
                        { key: 'party', label: 'Party', minWidth: 220 },
                        { key: 'due_date', label: 'Due Date', minWidth: 130 },
                        { key: 'bucket', label: 'Bucket', minWidth: 110 },
                        { key: 'total', label: 'Total', minWidth: 120, align: 'right' },
                        { key: 'paid', label: 'Paid', minWidth: 120, align: 'right' },
                        { key: 'balance', label: 'Balance', minWidth: 120, align: 'right' },
                        { key: 'action', label: 'Action', minWidth: 150, align: 'right' },
                    ]}
                    rows={list}
                    pagination={rows}
                    tableMinWidth={1240}
                    emptyMessage="No receivables found."
                    renderRow={(row) => (
                        <TableRow key={row.id} hover>
                            <TableCell sx={{ fontWeight: 700 }}>{row.document_no}</TableCell>
                            <TableCell>{row.source}</TableCell>
                            <TableCell>{row.restaurant_name || '-'}</TableCell>
                            <TableCell>{row.party}</TableCell>
                            <TableCell>{row.due_date || '-'}</TableCell>
                            <TableCell>{row.bucket}</TableCell>
                            <TableCell align="right">{formatNumber(row.total)}</TableCell>
                            <TableCell align="right">{formatNumber(row.paid)}</TableCell>
                            <TableCell align="right">{formatNumber(row.balance)}</TableCell>
                            <TableCell align="right">
                                {row.document_url ? (
                                    <Button size="small" variant="outlined" onClick={() => router.visit(row.document_url)}>
                                        Open Source
                                    </Button>
                                ) : (
                                    <Button size="small" variant="outlined" disabled>
                                        Unavailable
                                    </Button>
                                )}
                            </TableCell>
                        </TableRow>
                    )}
                />
            </SurfaceCard>
        </AppPage>
    );
}
