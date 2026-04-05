import React from 'react';
import { router } from '@inertiajs/react';
import { Button, Chip, Grid, MenuItem, TableCell, TableRow, TextField } from '@mui/material';
import debounce from 'lodash.debounce';
import AppPage from '@/components/App/ui/AppPage';
import AdminDataTable from '@/components/App/ui/AdminDataTable';
import FilterToolbar from '@/components/App/ui/FilterToolbar';
import StatCard from '@/components/App/ui/StatCard';
import SurfaceCard from '@/components/App/ui/SurfaceCard';
import { formatAmount, formatCount } from '@/lib/formatting';

export default function Receivables({ invoices, total, summary, filters }) {
    const rows = invoices?.data || [];
    const [localFilters, setLocalFilters] = React.useState({
        search: filters?.search || '',
        status: filters?.status || '',
        from: filters?.from || '',
        to: filters?.to || '',
        per_page: filters?.per_page || invoices?.per_page || 25,
        page: 1,
    });
    const filtersRef = React.useRef(localFilters);

    const submitFilters = React.useCallback((nextFilters) => {
        const payload = {};

        if (nextFilters.search?.trim()) payload.search = nextFilters.search.trim();
        if (nextFilters.status) payload.status = nextFilters.status;
        if (nextFilters.from) payload.from = nextFilters.from;
        if (nextFilters.to) payload.to = nextFilters.to;
        payload.per_page = nextFilters.per_page || 25;
        if (Number(nextFilters.page) > 1) payload.page = Number(nextFilters.page);

        router.get(route('accounting.receivables'), payload, {
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
            status: filters?.status || '',
            from: filters?.from || '',
            to: filters?.to || '',
            per_page: filters?.per_page || invoices?.per_page || 25,
            page: 1,
        };
        filtersRef.current = next;
        setLocalFilters(next);
    }, [filters?.from, filters?.per_page, filters?.search, filters?.status, filters?.to, invoices?.per_page]);

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
            status: '',
            from: '',
            to: '',
            per_page: filtersRef.current.per_page || invoices?.per_page || 25,
            page: 1,
        };
        debouncedSubmit.cancel();
        filtersRef.current = cleared;
        setLocalFilters(cleared);
        submitFilters(cleared);
    }, [debouncedSubmit, invoices?.per_page, submitFilters]);

    const columns = [
        { key: 'invoice_no', label: 'Invoice' },
        { key: 'payer', label: 'Payer', minWidth: 220 },
        { key: 'source', label: 'Source', minWidth: 150 },
        { key: 'restaurant', label: 'Restaurant', minWidth: 160 },
        { key: 'status', label: 'Status', minWidth: 130 },
        { key: 'posting', label: 'Posting', minWidth: 130 },
        { key: 'issue_date', label: 'Issue Date', minWidth: 140 },
        { key: 'total', label: 'Total', minWidth: 120, align: 'right' },
        { key: 'paid', label: 'Paid', minWidth: 120, align: 'right' },
        { key: 'balance', label: 'Balance', minWidth: 130, align: 'right' },
        { key: 'action', label: 'Action', minWidth: 120, align: 'center' },
    ];

    return (
        <AppPage
            eyebrow="Accounting"
            title="Receivables"
            subtitle="Track unpaid and partially paid invoices with live filters, clearer source context, and operational drilldowns."
        >
            <Grid container spacing={2.25}>
                <Grid item xs={12} md={3}><StatCard label="Global Outstanding" value={formatAmount(total)} accent /></Grid>
                <Grid item xs={12} md={3}><StatCard label="Filtered Records" value={formatCount(summary?.records)} tone="light" /></Grid>
                <Grid item xs={12} md={3}><StatCard label="Filtered Outstanding" value={formatAmount(summary?.filtered_outstanding)} tone="light" /></Grid>
                <Grid item xs={12} md={3}><StatCard label="Unpaid" value={formatCount(summary?.unpaid_count)} tone="muted" /></Grid>
                <Grid item xs={12} md={3}><StatCard label="Partial" value={formatCount(summary?.partial_count)} tone="muted" /></Grid>
            </Grid>

            <SurfaceCard title="Live Filters" subtitle="Results update automatically as you refine payer, status, and invoice dates.">
                <FilterToolbar
                    onReset={resetFilters}
                    onApply={() => submitFilters(localFilters)}
                    lowChrome
                    title="Filters"
                    subtitle="Refine receivables by search, status, source, and date range."
                >
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
                                label="Status"
                                value={localFilters.status}
                                onChange={(event) => updateFilters({ status: event.target.value }, { immediate: true })}
                                fullWidth
                            >
                                <MenuItem value="">All open</MenuItem>
                                <MenuItem value="unpaid">Unpaid</MenuItem>
                                <MenuItem value="partial">Partial</MenuItem>
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

            <SurfaceCard title="Receivables Register" subtitle="Operational receivables list with source visibility, payment status, and consistent pagination.">
                <AdminDataTable
                    columns={columns}
                    rows={rows}
                    pagination={invoices}
                    emptyMessage="No receivables found."
                    tableMinWidth={1240}
                    renderRow={(invoice) => {
                        const balance = Number(invoice.total_price || 0) - Number(invoice.paid_amount || 0);
                        const payer = invoice.member?.full_name || invoice.corporate_member?.full_name || invoice.customer?.name || '-';

                        return (
                            <TableRow key={invoice.id} hover>
                                <TableCell sx={{ fontWeight: 700, color: 'text.primary' }}>{invoice.invoice_no}</TableCell>
                                <TableCell>{payer}</TableCell>
                                <TableCell>{invoice.source_label || '-'}</TableCell>
                                <TableCell>{invoice.restaurant_name || '-'}</TableCell>
                                <TableCell>
                                    <Chip
                                        label={invoice.status}
                                        size="small"
                                        color={invoice.status === 'partial' ? 'warning' : 'error'}
                                        variant="outlined"
                                        sx={{ textTransform: 'capitalize' }}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={invoice.posting_status || '-'}
                                        size="small"
                                        variant="outlined"
                                        color={invoice.posting_status === 'posted' ? 'success' : invoice.posting_status === 'failed' ? 'error' : 'warning'}
                                    />
                                </TableCell>
                                <TableCell>{invoice.issue_date || '-'}</TableCell>
                                <TableCell align="right">{formatAmount(invoice.total_price)}</TableCell>
                                <TableCell align="right">{formatAmount(invoice.paid_amount)}</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700 }}>{formatAmount(balance)}</TableCell>
                                <TableCell align="center">
                                    {invoice.document_url ? (
                                        <Button size="small" variant="outlined" onClick={() => router.visit(invoice.document_url)}>
                                            Open Source
                                        </Button>
                                    ) : (
                                        <Button size="small" variant="outlined" disabled>
                                            Unavailable
                                        </Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        );
                    }}
                />
            </SurfaceCard>
        </AppPage>
    );
}
