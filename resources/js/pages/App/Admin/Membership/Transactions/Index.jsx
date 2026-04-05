import React from 'react';
import { router } from '@inertiajs/react';
import { Button, Chip, Grid, MenuItem, Stack, TableCell, TableRow, TextField, Typography } from '@mui/material';
import debounce from 'lodash.debounce';
import AppPage from '@/components/App/ui/AppPage';
import AdminDataTable from '@/components/App/ui/AdminDataTable';
import FilterToolbar from '@/components/App/ui/FilterToolbar';
import StatCard from '@/components/App/ui/StatCard';
import SurfaceCard from '@/components/App/ui/SurfaceCard';
import { formatAmount, formatCount } from '@/lib/formatting';

const defaultFilters = (filters, transactions) => ({
    search: filters?.search || '',
    fee_type: filters?.fee_type || 'all',
    status: filters?.status || 'all',
    date_from: filters?.date_from || '',
    date_to: filters?.date_to || '',
    per_page: filters?.per_page || transactions?.per_page || 25,
    page: 1,
});

export default function TransactionIndex({ transactions, filters, summary = {} }) {
    const rows = transactions?.data || [];
    const [localFilters, setLocalFilters] = React.useState(() => defaultFilters(filters, transactions));
    const filtersRef = React.useRef(localFilters);

    const submitFilters = React.useCallback((nextFilters) => {
        const payload = {};
        Object.entries(nextFilters).forEach(([key, value]) => {
            if (['all', '', null, undefined].includes(value)) return;
            if (key === 'page' && Number(value) <= 1) return;
            payload[key] = value;
        });
        payload.per_page = nextFilters.per_page || 25;

        router.get(route('membership.transactions.index'), payload, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    }, []);

    const debouncedSubmit = React.useMemo(() => debounce((next) => submitFilters(next), 350), [submitFilters]);
    React.useEffect(() => () => debouncedSubmit.cancel(), [debouncedSubmit]);

    React.useEffect(() => {
        const next = defaultFilters(filters, transactions);
        filtersRef.current = next;
        setLocalFilters(next);
    }, [filters, transactions?.per_page]);

    const updateFilters = React.useCallback((partial, { immediate = false } = {}) => {
        const next = { ...filtersRef.current, ...partial, page: 1 };
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
        const next = defaultFilters({}, { per_page: filtersRef.current.per_page });
        debouncedSubmit.cancel();
        filtersRef.current = next;
        setLocalFilters(next);
        submitFilters(next);
    }, [debouncedSubmit, submitFilters]);

    return (
        <AppPage
            eyebrow="Membership"
            title="All Transactions"
            subtitle="Membership fee and maintenance activity with accounting-backed posting visibility and live filtering."
            actions={[
                <Button key="create" variant="contained" onClick={() => router.visit(route('finance.transaction.create'))}>
                    Add New Transaction
                </Button>,
            ]}
        >
            <Grid container spacing={2.25}>
                <Grid item xs={12} md={3}><StatCard label="Transactions" value={formatCount(summary?.count)} accent /></Grid>
                <Grid item xs={12} md={3}><StatCard label="Total Amount" value={formatAmount(summary?.total_amount)} tone="light" /></Grid>
                <Grid item xs={12} md={3}><StatCard label="Open Balance" value={formatAmount(summary?.balance)} tone="light" /></Grid>
                <Grid item xs={12} md={3}><StatCard label="Posting Failures" value={formatCount(summary?.failed_postings)} tone="muted" /></Grid>
            </Grid>

            <SurfaceCard title="Live Filters" subtitle="Results refresh automatically while you search, change fee type, or adjust the date range.">
                <FilterToolbar
                    title="Filters"
                    subtitle="Refine transactions and click Apply."
                    lowChrome
                    onApply={() => submitFilters(localFilters)}
                    onReset={resetFilters}
                >
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={4}>
                            <TextField label="Search member or membership #" value={localFilters.search} onChange={(event) => updateFilters({ search: event.target.value })} fullWidth />
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <TextField select label="Fee Type" value={localFilters.fee_type} onChange={(event) => updateFilters({ fee_type: event.target.value }, { immediate: true })} fullWidth>
                                <MenuItem value="all">All Types</MenuItem>
                                <MenuItem value="membership_fee">Membership Fee</MenuItem>
                                <MenuItem value="maintenance_fee">Maintenance Fee</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <TextField select label="Status" value={localFilters.status} onChange={(event) => updateFilters({ status: event.target.value }, { immediate: true })} fullWidth>
                                <MenuItem value="all">All Status</MenuItem>
                                <MenuItem value="paid">Paid</MenuItem>
                                <MenuItem value="unpaid">Unpaid</MenuItem>
                                <MenuItem value="partial">Partial</MenuItem>
                                <MenuItem value="overdue">Overdue</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <TextField label="From" type="date" value={localFilters.date_from} onChange={(event) => updateFilters({ date_from: event.target.value }, { immediate: true })} InputLabelProps={{ shrink: true }} fullWidth />
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <TextField label="To" type="date" value={localFilters.date_to} onChange={(event) => updateFilters({ date_to: event.target.value }, { immediate: true })} InputLabelProps={{ shrink: true }} fullWidth />
                        </Grid>
                    </Grid>
                </FilterToolbar>
            </SurfaceCard>

            <SurfaceCard title="Membership Transaction Register" subtitle="Compact membership-specific invoice list with accounting posting and journal linkage.">
                <AdminDataTable
                    columns={[
                        { key: 'invoice', label: 'Invoice', minWidth: 140 },
                        { key: 'member', label: 'Member', minWidth: 220 },
                        { key: 'fee_type', label: 'Fee Type', minWidth: 140 },
                        { key: 'amount', label: 'Amount', minWidth: 120, align: 'right' },
                        { key: 'status', label: 'Status', minWidth: 120 },
                        { key: 'posting', label: 'Posting', minWidth: 120 },
                        { key: 'journal', label: 'Journal', minWidth: 110 },
                        { key: 'action', label: 'Action', minWidth: 150, align: 'right' },
                    ]}
                    rows={rows}
                    pagination={transactions}
                    tableMinWidth={1260}
                    emptyMessage="No membership transactions found."
                    renderRow={(row) => (
                        <TableRow key={row.id} hover>
                            <TableCell>{row.invoice_no}</TableCell>
                            <TableCell>
                                <Stack spacing={0.35}>
                                    <Typography sx={{ fontWeight: 700 }}>{row.member?.full_name || 'Member'}</Typography>
                                    <Typography variant="body2" color="text.secondary">{row.member?.membership_no || '-'}</Typography>
                                </Stack>
                            </TableCell>
                            <TableCell>{String(row.fee_type || '').replaceAll('_', ' ')}</TableCell>
                            <TableCell align="right">{formatAmount(row.total_price)}</TableCell>
                            <TableCell>
                                <Chip size="small" label={row.status || '-'} color={row.status === 'paid' ? 'success' : row.status === 'overdue' ? 'error' : 'warning'} />
                            </TableCell>
                            <TableCell>
                                <Chip size="small" variant="outlined" label={row.posting_status || '-'} color={row.posting_status === 'posted' ? 'success' : row.posting_status === 'failed' ? 'error' : 'warning'} />
                            </TableCell>
                            <TableCell>{row.journal_entry_id ? `JE-${row.journal_entry_id}` : '-'}</TableCell>
                            <TableCell align="right">
                                <Stack direction="row" spacing={1} justifyContent="flex-end">
                                    {row.document_url ? (
                                        <Button size="small" variant="outlined" onClick={() => router.visit(row.document_url)}>
                                            Open Source
                                        </Button>
                                    ) : (
                                        <Button size="small" variant="outlined" disabled>
                                            Unavailable
                                        </Button>
                                    )}
                                    {row.journal_entry_id ? (
                                        <Button size="small" variant="outlined" onClick={() => router.visit(route('accounting.journals.show', row.journal_entry_id))}>
                                            Journal
                                        </Button>
                                    ) : null}
                                </Stack>
                            </TableCell>
                        </TableRow>
                    )}
                />
            </SurfaceCard>
        </AppPage>
    );
}
