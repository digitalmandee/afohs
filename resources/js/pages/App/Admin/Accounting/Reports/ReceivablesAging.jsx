import React from 'react';
import { router } from '@inertiajs/react';
import debounce from 'lodash.debounce';
import { Box, Button, Chip, Grid, MenuItem, TableCell, TableRow, TextField, Typography } from '@mui/material';
import AppPage from '@/components/App/ui/AppPage';
import AdminDataTable from '@/components/App/ui/AdminDataTable';
import FilterToolbar from '@/components/App/ui/FilterToolbar';
import StatCard from '@/components/App/ui/StatCard';
import SurfaceCard from '@/components/App/ui/SurfaceCard';

const buckets = ['current', '1-30', '31-60', '61-90', '90+'];

export default function ReceivablesAging({ rows, summary, filters }) {
    const data = rows?.data || [];
    const [localFilters, setLocalFilters] = React.useState({
        search: filters?.search || '',
        from: filters?.from || '',
        to: filters?.to || '',
        bucket: filters?.bucket || '',
        per_page: filters?.per_page || rows?.per_page || 25,
        page: 1,
    });
    const filtersRef = React.useRef(localFilters);

    const submitFilters = React.useCallback((nextFilters) => {
        const payload = {};

        if (nextFilters.search?.trim()) payload.search = nextFilters.search.trim();
        if (nextFilters.from) payload.from = nextFilters.from;
        if (nextFilters.to) payload.to = nextFilters.to;
        if (nextFilters.bucket) payload.bucket = nextFilters.bucket;
        payload.per_page = nextFilters.per_page || 25;
        if (Number(nextFilters.page) > 1) payload.page = Number(nextFilters.page);

        router.get(route('accounting.reports.receivables-aging'), payload, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    }, []);

    const debouncedSubmit = React.useMemo(() => debounce((nextFilters) => submitFilters(nextFilters), 350), [submitFilters]);

    React.useEffect(() => () => debouncedSubmit.cancel(), [debouncedSubmit]);

    React.useEffect(() => {
        const next = {
            search: filters?.search || '',
            from: filters?.from || '',
            to: filters?.to || '',
            bucket: filters?.bucket || '',
            per_page: filters?.per_page || rows?.per_page || 25,
            page: 1,
        };
        filtersRef.current = next;
        setLocalFilters(next);
    }, [filters?.bucket, filters?.from, filters?.per_page, filters?.search, filters?.to, rows?.per_page]);

    const updateFilters = React.useCallback((partial, { immediate = false } = {}) => {
        const next = { ...filtersRef.current, ...partial };

        if (!Object.prototype.hasOwnProperty.call(partial, 'page')) {
            next.page = 1;
        }

        filtersRef.current = next;
        setLocalFilters(next);

        if (immediate) {
            debouncedSubmit.cancel();
            submitFilters(next);
            return;
        }

        debouncedSubmit(next);
    }, [debouncedSubmit, submitFilters]);

    const resetFilters = React.useCallback(() => {
        const cleared = {
            search: '',
            from: '',
            to: '',
            bucket: '',
            per_page: filtersRef.current.per_page || rows?.per_page || 25,
            page: 1,
        };
        debouncedSubmit.cancel();
        filtersRef.current = cleared;
        setLocalFilters(cleared);
        submitFilters(cleared);
    }, [debouncedSubmit, rows?.per_page, submitFilters]);

    const columns = [
        { key: 'invoice', label: 'Invoice', minWidth: 150 },
        { key: 'party', label: 'Party', minWidth: 220 },
        { key: 'due_date', label: 'Due Date', minWidth: 130 },
        { key: 'age', label: 'Age', minWidth: 90, align: 'right' },
        { key: 'bucket', label: 'Bucket', minWidth: 120 },
        { key: 'total', label: 'Total', minWidth: 120, align: 'right' },
        { key: 'paid', label: 'Paid', minWidth: 120, align: 'right' },
        { key: 'balance', label: 'Balance', minWidth: 130, align: 'right' },
    ];

    return (
        <AppPage
            eyebrow="Accounting Reports"
            title="Receivables Aging"
            subtitle="Open invoice aging across members, corporate accounts, and other receivable sources with live filtering and denser review."
        >
            <Grid container spacing={2.25}>
                <Grid item xs={12} md={3}><StatCard label="Open Documents" value={summary?.records || 0} accent /></Grid>
                <Grid item xs={12} md={3}><StatCard label="Total Outstanding" value={Number(summary?.total_balance || 0).toFixed(2)} tone="light" /></Grid>
                <Grid item xs={12} md={3}><StatCard label="Average Age (Days)" value={summary?.average_age || 0} tone="light" /></Grid>
                <Grid item xs={12} md={3}><StatCard label="90+ Exposure" value={Number(summary?.bucket_balance?.['90+'] || 0).toFixed(2)} tone="muted" /></Grid>
            </Grid>

            <SurfaceCard
                title="Aging Buckets"
                subtitle="Live distribution of open receivables across aging bands."
                actions={<Button variant="outlined" onClick={() => window.print()}>Print</Button>}
            >
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {buckets.map((bucket) => (
                        <Chip
                            key={bucket}
                            size="small"
                            variant="outlined"
                            label={`${bucket}: ${summary?.bucket_count?.[bucket] || 0} | ${Number(summary?.bucket_balance?.[bucket] || 0).toFixed(2)}`}
                            sx={{ borderColor: 'primary.main', color: 'primary.main' }}
                        />
                    ))}
                </Box>
            </SurfaceCard>

            <SurfaceCard title="Live Filters" subtitle="Results update automatically as you narrow by invoice text, aging bucket, or date range.">
                <FilterToolbar onReset={resetFilters}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={4}>
                            <TextField
                                label="Search invoice or member"
                                value={localFilters.search}
                                onChange={(event) => updateFilters({ search: event.target.value })}
                                fullWidth
                            />
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <TextField
                                select
                                label="Bucket"
                                value={localFilters.bucket}
                                onChange={(event) => updateFilters({ bucket: event.target.value }, { immediate: true })}
                                fullWidth
                            >
                                <MenuItem value="">All buckets</MenuItem>
                                {buckets.map((bucket) => <MenuItem key={bucket} value={bucket}>{bucket}</MenuItem>)}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <TextField
                                label="From"
                                type="date"
                                value={localFilters.from}
                                onChange={(event) => updateFilters({ from: event.target.value }, { immediate: true })}
                                InputLabelProps={{ shrink: true }}
                                fullWidth
                            />
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <TextField
                                label="To"
                                type="date"
                                value={localFilters.to}
                                onChange={(event) => updateFilters({ to: event.target.value }, { immediate: true })}
                                InputLabelProps={{ shrink: true }}
                                fullWidth
                            />
                        </Grid>
                    </Grid>
                </FilterToolbar>
            </SurfaceCard>

            <SurfaceCard title="Receivables Aging Register" subtitle="Branded aging table with shared pagination and printable summary support.">
                <AdminDataTable
                    columns={columns}
                    rows={data}
                    pagination={rows}
                    emptyMessage="No receivables aging records found."
                    tableMinWidth={1080}
                    renderRow={(row) => (
                        <TableRow key={row.id} hover>
                            <TableCell sx={{ fontWeight: 700, color: 'text.primary' }}>{row.document_no}</TableCell>
                            <TableCell>{row.party}</TableCell>
                            <TableCell>{row.due_date || '-'}</TableCell>
                            <TableCell align="right">{row.age_days}</TableCell>
                            <TableCell>
                                <Chip
                                    size="small"
                                    label={row.bucket}
                                    color={row.bucket === '90+' ? 'error' : row.bucket === '61-90' ? 'warning' : 'default'}
                                    variant="outlined"
                                />
                            </TableCell>
                            <TableCell align="right">{Number(row.total || 0).toFixed(2)}</TableCell>
                            <TableCell align="right">{Number(row.paid || 0).toFixed(2)}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700 }}>{Number(row.balance || 0).toFixed(2)}</TableCell>
                        </TableRow>
                    )}
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1.25, display: 'block' }}>
                    Totals: Outstanding {Number(summary?.total_balance || 0).toFixed(2)} | 90+ Exposure {Number(summary?.bucket_balance?.['90+'] || 0).toFixed(2)}
                </Typography>
            </SurfaceCard>
        </AppPage>
    );
}
