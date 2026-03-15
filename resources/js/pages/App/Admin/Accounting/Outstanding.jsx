import React from 'react';
import { router } from '@inertiajs/react';
import { Alert, Button, Chip, Grid, MenuItem, TableCell, TableRow, TextField } from '@mui/material';
import debounce from 'lodash.debounce';
import AppPage from '@/components/App/ui/AppPage';
import AdminDataTable from '@/components/App/ui/AdminDataTable';
import FilterToolbar from '@/components/App/ui/FilterToolbar';
import StatCard from '@/components/App/ui/StatCard';
import SurfaceCard from '@/components/App/ui/SurfaceCard';

export default function Outstanding({ rows, summary, filters, error }) {
    const list = rows?.data || [];
    const [localFilters, setLocalFilters] = React.useState({
        search: filters?.search || '',
        bucket: filters?.bucket || '',
        per_page: filters?.per_page || rows?.per_page || 25,
        page: 1,
    });
    const filtersRef = React.useRef(localFilters);

    const submitFilters = React.useCallback((nextFilters) => {
        const payload = {};

        if (nextFilters.search?.trim()) payload.search = nextFilters.search.trim();
        if (nextFilters.bucket) payload.bucket = nextFilters.bucket;
        payload.per_page = nextFilters.per_page || 25;
        if (Number(nextFilters.page) > 1) payload.page = Number(nextFilters.page);

        router.get(route('accounting.outstanding'), payload, {
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
            bucket: filters?.bucket || '',
            per_page: filters?.per_page || rows?.per_page || 25,
            page: 1,
        };
        filtersRef.current = next;
        setLocalFilters(next);
    }, [filters?.bucket, filters?.per_page, filters?.search, rows?.per_page]);

    const updateFilters = React.useCallback(
        (partial, { immediate = false } = {}) => {
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
        },
        [debouncedSubmit, submitFilters],
    );

    const resetFilters = React.useCallback(() => {
        const cleared = {
            search: '',
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
        { key: 'invoice_no', label: 'Invoice' },
        { key: 'payer', label: 'Payer', minWidth: 220 },
        { key: 'source_type', label: 'Source', minWidth: 160 },
        { key: 'restaurant', label: 'Restaurant', minWidth: 160 },
        { key: 'due_date', label: 'Due Date', minWidth: 140 },
        { key: 'age', label: 'Age (Days)', minWidth: 110, align: 'right' },
        { key: 'bucket', label: 'Bucket', minWidth: 120 },
        { key: 'balance', label: 'Balance', minWidth: 130, align: 'right' },
        { key: 'posting', label: 'Posting', minWidth: 120 },
        { key: 'action', label: 'Action', minWidth: 160, align: 'center' },
    ];

    return (
        <AppPage
            eyebrow="Accounting"
            title="Outstanding"
            subtitle="Monitor open invoices by aging bucket, balance exposure, and underlying source document."
        >
            {error ? <Alert severity="warning">{error}</Alert> : null}

            <Grid container spacing={2.25}>
                <Grid item xs={12} md={3}><StatCard label="Filtered Invoices" value={summary?.records || 0} accent /></Grid>
                <Grid item xs={12} md={3}><StatCard label="Total Balance" value={Number(summary?.total_balance || 0).toFixed(2)} tone="light" /></Grid>
                <Grid item xs={12} md={3}><StatCard label="Average Age (Days)" value={summary?.average_age || 0} tone="light" /></Grid>
                <Grid item xs={12} md={3}><StatCard label="90+ Exposure" value={Number(summary?.bucket_balance?.['90+'] || 0).toFixed(2)} tone="muted" /></Grid>
            </Grid>

            <SurfaceCard title="Live Filters" subtitle="Refine outstanding exposure by payer reference and aging bucket.">
                <FilterToolbar onReset={resetFilters}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={8}>
                            <TextField
                                label="Search invoice or member"
                                value={localFilters.search}
                                onChange={(event) => updateFilters({ search: event.target.value })}
                                fullWidth
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TextField
                                select
                                label="Aging Bucket"
                                value={localFilters.bucket}
                                onChange={(event) => updateFilters({ bucket: event.target.value }, { immediate: true })}
                                fullWidth
                            >
                                <MenuItem value="">All buckets</MenuItem>
                                <MenuItem value="0-30">0-30</MenuItem>
                                <MenuItem value="31-60">31-60</MenuItem>
                                <MenuItem value="61-90">61-90</MenuItem>
                                <MenuItem value="90+">90+</MenuItem>
                            </TextField>
                        </Grid>
                    </Grid>
                </FilterToolbar>
            </SurfaceCard>

            <SurfaceCard title="Outstanding Register" subtitle="Aging-focused receivables list with source context and invoice drilldown.">
                <AdminDataTable
                    columns={columns}
                    rows={list}
                    pagination={rows}
                    error={error}
                    emptyMessage="No outstanding invoices found."
                    tableMinWidth={1160}
                    renderRow={(row, index) => (
                        <TableRow key={`${row.invoice_no}-${index}`} hover>
                            <TableCell sx={{ fontWeight: 700, color: 'text.primary' }}>{row.invoice_no}</TableCell>
                            <TableCell>{row.payer}</TableCell>
                            <TableCell>{row.source_label || String(row.source_type || '-').replaceAll('_', ' ')}</TableCell>
                            <TableCell>{row.restaurant_name || '-'}</TableCell>
                            <TableCell>{row.due_date || '-'}</TableCell>
                            <TableCell align="right">{row.age}</TableCell>
                            <TableCell>
                                <Chip
                                    label={row.bucket}
                                    size="small"
                                    variant="outlined"
                                    color={row.bucket === '90+' ? 'error' : row.bucket === '61-90' ? 'warning' : 'default'}
                                />
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700 }}>{Number(row.balance || 0).toFixed(2)}</TableCell>
                            <TableCell>
                                <Chip
                                    label={row.posting_status || '-'}
                                    size="small"
                                    variant="outlined"
                                    color={row.posting_status === 'posted' ? 'success' : row.posting_status === 'failed' ? 'error' : 'warning'}
                                />
                            </TableCell>
                            <TableCell align="center">
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
