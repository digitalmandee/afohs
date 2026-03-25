import React from 'react';
import { router } from '@inertiajs/react';
import debounce from 'lodash.debounce';
import { Box, Button, Chip, Grid, MenuItem, TableCell, TableRow, TextField, Typography } from '@mui/material';
import AppPage from '@/components/App/ui/AppPage';
import AdminDataTable from '@/components/App/ui/AdminDataTable';
import DateRangeFilterFields from '@/components/App/ui/DateRangeFilterFields';
import FilterToolbar from '@/components/App/ui/FilterToolbar';
import StatCard from '@/components/App/ui/StatCard';
import SurfaceCard from '@/components/App/ui/SurfaceCard';
import useFilterLoadingState from '@/hooks/useFilterLoadingState';
import { downloadReportPdf, formatReportAmount, formatReportCount, openReportPrint, sanitizeFilters } from './reportOutput';

const buckets = ['current', '1-30', '31-60', '61-90', '90+'];

export default function ReceivablesAging({ rows, summary, filters }) {
    const data = rows?.data || [];
    const { loading, beginLoading } = useFilterLoadingState([
        filters?.bucket,
        filters?.from,
        filters?.per_page,
        filters?.search,
        filters?.to,
        rows?.per_page,
        data.length,
    ]);
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
        beginLoading();
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
    }, [beginLoading]);

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
            actions={[
                <Button key="pdf" variant="outlined" onClick={() => downloadReportPdf('accounting.reports.receivables-aging.pdf', sanitizeFilters(localFilters))}>Download PDF</Button>,
                <Button key="print" variant="outlined" onClick={() => openReportPrint('accounting.reports.receivables-aging.print', sanitizeFilters(localFilters))}>Print</Button>,
            ]}
        >
            <Grid container spacing={2.25}>
                <Grid item xs={12} md={3}><StatCard label="Open Documents" value={formatReportCount(summary?.records)} accent /></Grid>
                <Grid item xs={12} md={3}><StatCard label="Total Outstanding" value={formatReportAmount(summary?.total_balance)} tone="light" /></Grid>
                <Grid item xs={12} md={3}><StatCard label="Average Age (Days)" value={formatReportCount(summary?.average_age)} tone="light" /></Grid>
                <Grid item xs={12} md={3}><StatCard label="90+ Exposure" value={formatReportAmount(summary?.bucket_balance?.['90+'])} tone="muted" /></Grid>
            </Grid>

            <SurfaceCard
                title="Aging Buckets"
                subtitle="Live distribution of open receivables across aging bands."
                actions={<Button variant="outlined" onClick={() => openReportPrint('accounting.reports.receivables-aging.print', sanitizeFilters(localFilters))}>Print</Button>}
            >
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {buckets.map((bucket) => (
                        <Chip
                            key={bucket}
                            size="small"
                            variant="outlined"
                            label={`${bucket}: ${formatReportCount(summary?.bucket_count?.[bucket])} | ${formatReportAmount(summary?.bucket_balance?.[bucket])}`}
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
                        <DateRangeFilterFields
                            startValue={localFilters.from}
                            endValue={localFilters.to}
                            onStartChange={(value) => updateFilters({ from: value }, { immediate: true })}
                            onEndChange={(value) => updateFilters({ to: value }, { immediate: true })}
                            startGrid={{ xs: 12, md: 3 }}
                            endGrid={{ xs: 12, md: 3 }}
                        />
                    </Grid>
                </FilterToolbar>
            </SurfaceCard>

            <SurfaceCard title="Receivables Aging Register" subtitle="Branded aging table with shared pagination and printable summary support.">
                <AdminDataTable
                    columns={columns}
                    rows={data}
                    loading={loading}
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
                            <TableCell align="right">{formatReportAmount(row.total)}</TableCell>
                            <TableCell align="right">{formatReportAmount(row.paid)}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700 }}>{formatReportAmount(row.balance)}</TableCell>
                        </TableRow>
                    )}
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1.25, display: 'block' }}>
                    Totals: Outstanding {formatReportAmount(summary?.total_balance)} | 90+ Exposure {formatReportAmount(summary?.bucket_balance?.['90+'])}
                </Typography>
            </SurfaceCard>
        </AppPage>
    );
}
