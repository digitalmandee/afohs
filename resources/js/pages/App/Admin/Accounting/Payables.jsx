import React from 'react';
import { router } from '@inertiajs/react';
import { Button, Chip, Grid, MenuItem, TableCell, TableRow, TextField } from '@mui/material';
import debounce from 'lodash.debounce';
import AppPage from '@/components/App/ui/AppPage';
import AdminDataTable from '@/components/App/ui/AdminDataTable';
import FilterToolbar from '@/components/App/ui/FilterToolbar';
import StatCard from '@/components/App/ui/StatCard';
import SurfaceCard from '@/components/App/ui/SurfaceCard';

export default function Payables({ bills, total, summary, filters, tenants = [] }) {
    const rows = bills?.data || [];
    const [localFilters, setLocalFilters] = React.useState({
        search: filters?.search || '',
        status: filters?.status || '',
        tenant_id: filters?.tenant_id || '',
        from: filters?.from || '',
        to: filters?.to || '',
        per_page: filters?.per_page || bills?.per_page || 25,
        page: 1,
    });
    const filtersRef = React.useRef(localFilters);

    const submitFilters = React.useCallback((nextFilters) => {
        const payload = {};

        if (nextFilters.search?.trim()) payload.search = nextFilters.search.trim();
        if (nextFilters.status) payload.status = nextFilters.status;
        if (nextFilters.tenant_id) payload.tenant_id = nextFilters.tenant_id;
        if (nextFilters.from) payload.from = nextFilters.from;
        if (nextFilters.to) payload.to = nextFilters.to;
        payload.per_page = nextFilters.per_page || 25;
        if (Number(nextFilters.page) > 1) payload.page = Number(nextFilters.page);

        router.get(route('accounting.payables'), payload, {
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
            tenant_id: filters?.tenant_id || '',
            from: filters?.from || '',
            to: filters?.to || '',
            per_page: filters?.per_page || bills?.per_page || 25,
            page: 1,
        };
        filtersRef.current = next;
        setLocalFilters(next);
    }, [bills?.per_page, filters?.from, filters?.per_page, filters?.search, filters?.status, filters?.tenant_id, filters?.to]);

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
            tenant_id: '',
            from: '',
            to: '',
            per_page: filtersRef.current.per_page || bills?.per_page || 25,
            page: 1,
        };
        debouncedSubmit.cancel();
        filtersRef.current = cleared;
        setLocalFilters(cleared);
        submitFilters(cleared);
    }, [bills?.per_page, debouncedSubmit, submitFilters]);

    const columns = [
        { key: 'bill_no', label: 'Bill No' },
        { key: 'vendor', label: 'Vendor', minWidth: 220 },
        { key: 'restaurant', label: 'Restaurant', minWidth: 160 },
        { key: 'bill_date', label: 'Bill Date', minWidth: 130 },
        { key: 'due_date', label: 'Due Date', minWidth: 130 },
        { key: 'status', label: 'Status', minWidth: 140 },
        { key: 'posting', label: 'Posting', minWidth: 130 },
        { key: 'total', label: 'Total', minWidth: 120, align: 'right' },
        { key: 'paid', label: 'Paid', minWidth: 120, align: 'right' },
        { key: 'balance', label: 'Balance', minWidth: 130, align: 'right' },
        { key: 'action', label: 'Action', minWidth: 120, align: 'center' },
    ];

    return (
        <AppPage
            eyebrow="Accounting"
            title="Payables"
            subtitle="Review open vendor liabilities, payment progress, and bill aging from one standardized register."
        >
            <Grid container spacing={2.25}>
                <Grid item xs={12} md={3}><StatCard label="Global Outstanding" value={Number(total || 0).toFixed(2)} accent /></Grid>
                <Grid item xs={12} md={3}><StatCard label="Filtered Records" value={summary?.records || 0} tone="light" /></Grid>
                <Grid item xs={12} md={3}><StatCard label="Filtered Outstanding" value={Number(summary?.filtered_outstanding || 0).toFixed(2)} tone="light" /></Grid>
                <Grid item xs={12} md={1.5}><StatCard label="Draft" value={summary?.draft_count || 0} tone="muted" /></Grid>
                <Grid item xs={12} md={1.5}><StatCard label="Posted" value={summary?.posted_count || 0} tone="muted" /></Grid>
                <Grid item xs={12} md={1.5}><StatCard label="Partial Paid" value={summary?.partial_count || 0} tone="muted" /></Grid>
            </Grid>

            <SurfaceCard title="Live Filters" subtitle="Results update automatically while you refine vendors, bill status, and date range.">
                <FilterToolbar onReset={resetFilters}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={4}>
                            <TextField
                                label="Search bill or vendor"
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
                                <MenuItem value="draft">Draft</MenuItem>
                                <MenuItem value="posted">Posted</MenuItem>
                                <MenuItem value="partially_paid">Partially paid</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <TextField
                                select
                                label="Restaurant"
                                value={localFilters.tenant_id}
                                onChange={(event) => updateFilters({ tenant_id: event.target.value }, { immediate: true })}
                                fullWidth
                            >
                                <MenuItem value="">All restaurants</MenuItem>
                                {tenants.map((tenant) => (
                                    <MenuItem key={tenant.id} value={tenant.id}>{tenant.name}</MenuItem>
                                ))}
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

            <SurfaceCard title="Payables Register" subtitle="Operational vendor bill list with outstanding balances and procurement drilldowns.">
                <AdminDataTable
                    columns={columns}
                    rows={rows}
                    pagination={bills}
                    emptyMessage="No payables found."
                    tableMinWidth={1220}
                    renderRow={(bill) => {
                        const balance = Number(bill.grand_total || 0) - Number(bill.paid_amount || 0);

                        return (
                            <TableRow key={bill.id} hover>
                                <TableCell sx={{ fontWeight: 700, color: 'text.primary' }}>{bill.bill_no}</TableCell>
                                <TableCell>{bill.vendor?.name || '-'}</TableCell>
                                <TableCell>{bill.restaurant_name || '-'}</TableCell>
                                <TableCell>{bill.bill_date || '-'}</TableCell>
                                <TableCell>{bill.due_date || '-'}</TableCell>
                                <TableCell>
                                    <Chip
                                        label={bill.status}
                                        size="small"
                                        color={bill.status === 'draft' ? 'default' : bill.status === 'partially_paid' ? 'warning' : 'success'}
                                        variant="outlined"
                                        sx={{ textTransform: 'capitalize' }}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={bill.posting_status || '-'}
                                        size="small"
                                        variant="outlined"
                                        color={bill.posting_status === 'posted' ? 'success' : bill.posting_status === 'failed' ? 'error' : 'warning'}
                                    />
                                </TableCell>
                                <TableCell align="right">{Number(bill.grand_total || 0).toFixed(2)}</TableCell>
                                <TableCell align="right">{Number(bill.paid_amount || 0).toFixed(2)}</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700 }}>{balance.toFixed(2)}</TableCell>
                                <TableCell align="center">
                                    <Button size="small" variant="outlined" onClick={() => router.visit(bill.document_url || route('procurement.vendor-bills.edit', bill.id))}>
                                        Open Source
                                    </Button>
                                </TableCell>
                            </TableRow>
                        );
                    }}
                />
            </SurfaceCard>
        </AppPage>
    );
}
