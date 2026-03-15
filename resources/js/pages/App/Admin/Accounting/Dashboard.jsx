import React from 'react';
import { Link, router } from '@inertiajs/react';
import { Alert, Box, Button, Chip, Grid, MenuItem, Stack, TableCell, TableRow, TextField, Typography } from '@mui/material';
import debounce from 'lodash.debounce';
import AppPage from '@/components/App/ui/AppPage';
import AdminDataTable from '@/components/App/ui/AdminDataTable';
import FilterToolbar from '@/components/App/ui/FilterToolbar';
import SurfaceCard from '@/components/App/ui/SurfaceCard';
import StatCard from '@/components/App/ui/StatCard';

export default function Dashboard({ stats, latestTransactions, transactionFilters, moduleOptions, tenants = [], error = null }) {
    const recentEntries = stats?.recent_entries || [];
    const latestRows = latestTransactions?.data || [];
    const entryMix = stats?.entry_mix || [];
    const ruleCoverage = stats?.rule_coverage || { expected: [], active: [], missing: [] };
    const exceptions = stats?.exceptions || { failed_postings: 0, pending_postings: 0, recent_failures: [] };
    const [filters, setFilters] = React.useState({
        search: transactionFilters?.search || '',
        status: transactionFilters?.status || '',
        module_type: transactionFilters?.module_type || '',
        tenant_id: transactionFilters?.tenant_id || '',
        from: transactionFilters?.from || '',
        to: transactionFilters?.to || '',
        per_page: transactionFilters?.per_page || latestTransactions?.per_page || 25,
        page: 1,
    });
    const filtersRef = React.useRef(filters);

    const submitFilters = React.useCallback((nextFilters) => {
        const payload = {};

        if (nextFilters.search?.trim()) payload.search = nextFilters.search.trim();
        if (nextFilters.status) payload.status = nextFilters.status;
        if (nextFilters.module_type) payload.module_type = nextFilters.module_type;
        if (nextFilters.tenant_id) payload.tenant_id = nextFilters.tenant_id;
        if (nextFilters.from) payload.from = nextFilters.from;
        if (nextFilters.to) payload.to = nextFilters.to;
        payload.per_page = nextFilters.per_page || 25;
        if (Number(nextFilters.page) > 1) payload.page = Number(nextFilters.page);

        router.get(route('accounting.dashboard'), payload, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    }, []);

    const debouncedSubmit = React.useMemo(() => debounce((nextFilters) => submitFilters(nextFilters), 350), [submitFilters]);

    React.useEffect(() => () => debouncedSubmit.cancel(), [debouncedSubmit]);

    React.useEffect(() => {
        const next = {
            search: transactionFilters?.search || '',
            status: transactionFilters?.status || '',
            module_type: transactionFilters?.module_type || '',
            tenant_id: transactionFilters?.tenant_id || '',
            from: transactionFilters?.from || '',
            to: transactionFilters?.to || '',
            per_page: transactionFilters?.per_page || latestTransactions?.per_page || 25,
            page: 1,
        };
        filtersRef.current = next;
        setFilters(next);
    }, [
        latestTransactions?.per_page,
        transactionFilters?.from,
        transactionFilters?.module_type,
        transactionFilters?.per_page,
        transactionFilters?.search,
        transactionFilters?.status,
        transactionFilters?.tenant_id,
        transactionFilters?.to,
    ]);

    const updateFilters = React.useCallback(
        (partial, { immediate = false } = {}) => {
            const nextFilters = {
                ...filtersRef.current,
                ...partial,
            };

            if (!Object.prototype.hasOwnProperty.call(partial, 'page')) {
                nextFilters.page = 1;
            }

            filtersRef.current = nextFilters;
            setFilters(nextFilters);

            if (immediate) {
                debouncedSubmit.cancel();
                submitFilters(nextFilters);
                return;
            }

            debouncedSubmit(nextFilters);
        },
        [debouncedSubmit, submitFilters],
    );

    const resetFilters = React.useCallback(() => {
        const cleared = {
            search: '',
            status: '',
            module_type: '',
            tenant_id: '',
            from: '',
            to: '',
            per_page: filtersRef.current.per_page || latestTransactions?.per_page || 25,
            page: 1,
        };
        debouncedSubmit.cancel();
        filtersRef.current = cleared;
        setFilters(cleared);
        submitFilters(cleared);
    }, [debouncedSubmit, latestTransactions?.per_page, submitFilters]);

    const recentColumns = [
        { key: 'entry_no', label: 'Entry No' },
        { key: 'entry_date', label: 'Date' },
        { key: 'status', label: 'Status' },
        { key: 'description', label: 'Description', sx: { minWidth: 320 } },
    ];

    const feedColumns = [
        { key: 'entry_no', label: 'Entry No' },
        { key: 'entry_date', label: 'Date' },
        { key: 'module_type', label: 'Source' },
        { key: 'status', label: 'Status' },
        { key: 'restaurant', label: 'Restaurant' },
        { key: 'description', label: 'Description', sx: { minWidth: 320 } },
        { key: 'action', label: 'Action', align: 'right', sx: { minWidth: 150 } },
    ];

    return (
        <AppPage
            eyebrow="Finance Control"
            title="Accounting Dashboard"
            subtitle="Track receivables, payables, ledger activity, posting coverage, and exception health from a single control surface."
            actions={[
                <Button key="coa" component={Link} href={route('accounting.coa.index')} variant="contained">
                    Chart of Accounts
                </Button>,
                <Button key="gl" component={Link} href={route('accounting.general-ledger')} variant="outlined">
                    General Ledger
                </Button>,
            ]}
        >
            <Grid container spacing={2.25}>
                <Grid item xs={12} md={3}><StatCard label="Total Accounts" value={stats.total_accounts} accent /></Grid>
                <Grid item xs={12} md={3}><StatCard label="Receivables" value={Number(stats.receivables || 0).toFixed(2)} /></Grid>
                <Grid item xs={12} md={3}><StatCard label="Payables" value={Number(stats.payables || 0).toFixed(2)} /></Grid>
                <Grid item xs={12} md={3}><StatCard label="AR 90+ Exposure" value={Number(stats.receivables_90_plus || 0).toFixed(2)} /></Grid>
                <Grid item xs={12} md={3}><StatCard label="AP 90+ Exposure" value={Number(stats.payables_90_plus || 0).toFixed(2)} /></Grid>
                <Grid item xs={12} md={3}><StatCard label="Vendors" value={stats.total_vendors} /></Grid>
                <Grid item xs={12} md={3}><StatCard label="Bank Accounts" value={stats.bank_accounts} /></Grid>
                <Grid item xs={12} md={3}><StatCard label="Cash Accounts" value={stats.cash_accounts} /></Grid>
                <Grid item xs={12} md={2.4}><StatCard label="Posting Failures" value={exceptions.failed_postings} /></Grid>
                <Grid item xs={12} md={2.4}><StatCard label="Posting Pending" value={exceptions.pending_postings} /></Grid>
                <Grid item xs={12} md={2.4}><StatCard label="Posting Skipped" value={exceptions.skipped_postings || 0} /></Grid>
                <Grid item xs={12} md={2.4}><StatCard label="Source Unresolved" value={exceptions.unresolved_postings || 0} tone="muted" /></Grid>
            </Grid>

            {error ? <Alert severity="warning" variant="outlined">{error}</Alert> : null}

            <SurfaceCard title="Quick Actions" subtitle="Jump into the highest-traffic accounting workflows.">
                <Grid container spacing={1.5}>
                    <Grid item><Button component={Link} href={route('accounting.coa.index')} variant="contained">Chart of Accounts</Button></Grid>
                    <Grid item><Button component={Link} href={route('accounting.general-ledger')} variant="outlined">General Ledger</Button></Grid>
                    <Grid item><Button component={Link} href={route('accounting.receivables')} variant="outlined">Receivables</Button></Grid>
                    <Grid item><Button component={Link} href={route('accounting.payables')} variant="outlined">Payables</Button></Grid>
                    <Grid item><Button component={Link} href={route('accounting.reports.trial-balance')} variant="outlined">Trial Balance</Button></Grid>
                    <Grid item><Button component={Link} href={route('accounting.reports.financial-statements')} variant="outlined">Statements</Button></Grid>
                    <Grid item><Button component={Link} href={route('accounting.reports.management-pack')} variant="outlined">Management Pack</Button></Grid>
                    <Grid item><Button component={Link} href={route('accounting.reports.receivables-aging')} variant="outlined">AR Aging</Button></Grid>
                    <Grid item><Button component={Link} href={route('accounting.reports.receivables-by-source')} variant="outlined">AR by Source</Button></Grid>
                    <Grid item><Button component={Link} href={route('accounting.reports.payables-aging')} variant="outlined">AP Aging</Button></Grid>
                    <Grid item><Button component={Link} href={route('accounting.bank-reconciliation.index')} variant="outlined">Bank Reconciliation</Button></Grid>
                    <Grid item><Button component={Link} href={route('accounting.periods.index')} variant="outlined">Period Close</Button></Grid>
                </Grid>
            </SurfaceCard>

            <SurfaceCard title="Recent Transactions" subtitle="Latest entries moving through the books.">
                <AdminDataTable
                    columns={recentColumns}
                    rows={recentEntries}
                    emptyMessage="No recent entries."
                    tableMinWidth={780}
                    renderRow={(entry) => (
                        <TableRow key={entry.id} hover>
                            <TableCell sx={{ fontWeight: 700, color: 'text.primary' }}>{entry.entry_no}</TableCell>
                            <TableCell>{entry.entry_date}</TableCell>
                            <TableCell>{entry.status}</TableCell>
                            <TableCell>{entry.description || '-'}</TableCell>
                        </TableRow>
                    )}
                />
            </SurfaceCard>

            <SurfaceCard title="Transaction Mix" subtitle="See which modules are generating accounting activity.">
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.25 }}>
                    {entryMix.length === 0 && <Typography variant="body2" color="text.secondary">No transaction mix available.</Typography>}
                    {entryMix.map((item, idx) => (
                        <Chip
                            key={`${item.module_type || 'generic'}-${idx}`}
                            label={`${item.module_label || item.module_type || 'general'}: ${item.total}`}
                            sx={{
                                bgcolor: 'rgba(6,52,85,0.10)',
                                border: '1px solid rgba(6,52,85,0.24)',
                                color: 'primary.main',
                                fontWeight: 700,
                            }}
                        />
                    ))}
                </Box>
            </SurfaceCard>

            <SurfaceCard
                title="Transaction Feed"
                subtitle="Filter the latest accounting activity by status, source module, and date range."
            >
                <FilterToolbar onReset={resetFilters}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={3}>
                            <TextField
                                label="Search entry or description"
                                value={filters.search}
                                onChange={(e) => updateFilters({ search: e.target.value })}
                                fullWidth
                            />
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <TextField
                                select
                                label="Status"
                                value={filters.status}
                                onChange={(e) => updateFilters({ status: e.target.value }, { immediate: true })}
                                fullWidth
                            >
                                <MenuItem value="">All</MenuItem>
                                <MenuItem value="draft">Draft</MenuItem>
                                <MenuItem value="posted">Posted</MenuItem>
                                <MenuItem value="reversed">Reversed</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <TextField
                                select
                                label="Module"
                                value={filters.module_type}
                                onChange={(e) => updateFilters({ module_type: e.target.value }, { immediate: true })}
                                fullWidth
                            >
                                <MenuItem value="">All Modules</MenuItem>
                                {(moduleOptions || []).map((module) => (
                                    <MenuItem key={module.value} value={module.value}>{module.label}</MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <TextField
                                select
                                label="Restaurant"
                                value={filters.tenant_id}
                                onChange={(e) => updateFilters({ tenant_id: e.target.value }, { immediate: true })}
                                fullWidth
                            >
                                <MenuItem value="">All restaurants</MenuItem>
                                {tenants.map((tenant) => (
                                    <MenuItem key={tenant.id} value={tenant.id}>{tenant.name}</MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <TextField
                                label="From"
                                type="date"
                                value={filters.from}
                                onChange={(e) => updateFilters({ from: e.target.value }, { immediate: true })}
                                InputLabelProps={{ shrink: true }}
                                fullWidth
                            />
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <TextField
                                label="To"
                                type="date"
                                value={filters.to}
                                onChange={(e) => updateFilters({ to: e.target.value }, { immediate: true })}
                                InputLabelProps={{ shrink: true }}
                                fullWidth
                            />
                        </Grid>
                    </Grid>
                </FilterToolbar>

                <Typography variant="h6" sx={{ mb: 2, color: 'text.primary' }}>Latest Posted Feed</Typography>
                <AdminDataTable
                    columns={feedColumns}
                    rows={latestRows}
                    pagination={latestTransactions}
                    emptyMessage="No transactions available."
                    tableMinWidth={960}
                    renderRow={(entry) => (
                        <TableRow key={entry.id} hover>
                            <TableCell sx={{ fontWeight: 700, color: 'text.primary' }}>{entry.entry_no}</TableCell>
                            <TableCell>{entry.entry_date}</TableCell>
                            <TableCell>
                                <Chip size="small" label={entry.source_label || entry.module_type || 'General'} variant="outlined" />
                            </TableCell>
                            <TableCell>{entry.status}</TableCell>
                            <TableCell>{entry.restaurant_name || '-'}</TableCell>
                            <TableCell>{entry.description || '-'}</TableCell>
                            <TableCell align="right">
                                {entry.document_url ? (
                                    <Button size="small" variant="outlined" onClick={() => router.visit(entry.document_url)}>
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

            <SurfaceCard title="Integration Coverage" subtitle="Monitor posting-rule readiness across modules.">
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {(ruleCoverage.expected || []).map((code) => {
                        const isActive = (ruleCoverage.active || []).includes(code);
                        return (
                            <Chip
                                key={code}
                                label={code}
                                size="small"
                                color={isActive ? 'success' : 'warning'}
                                variant={isActive ? 'filled' : 'outlined'}
                            />
                        );
                    })}
                </Box>
                {(ruleCoverage.missing || []).length > 0 ? (
                    <Typography variant="body2" sx={{ mt: 2, color: 'warning.main' }}>
                        Missing active mappings: {(ruleCoverage.missing || []).join(', ')}
                    </Typography>
                ) : (
                    <Typography variant="body2" sx={{ mt: 2, color: 'success.main' }}>
                        All major module posting rules are active.
                    </Typography>
                )}
            </SurfaceCard>

            <SurfaceCard
                title="Exception Center"
                subtitle="Review posting failures with source labels, restaurant context, and direct retry access."
                actions={
                    <Button
                        size="small"
                        variant="outlined"
                        disabled={(exceptions.failed_postings || 0) === 0}
                        onClick={() => router.post(route('accounting.events.retry-all'))}
                    >
                        Retry All Failed
                    </Button>
                }
            >
                <AdminDataTable
                    columns={[
                        { key: 'event', label: 'Event', minWidth: 140 },
                        { key: 'source', label: 'Source', minWidth: 220 },
                        { key: 'restaurant', label: 'Restaurant', minWidth: 180 },
                        { key: 'error', label: 'Failure Reason', minWidth: 320 },
                        { key: 'attempt', label: 'Last Attempt', minWidth: 180 },
                        { key: 'action', label: 'Action', minWidth: 180, align: 'right' },
                    ]}
                    rows={exceptions.recent_failures || []}
                    emptyMessage="No failed postings."
                    tableMinWidth={1240}
                    renderRow={(failure) => (
                        <TableRow key={failure.id} hover>
                            <TableCell>{failure.event_type}</TableCell>
                            <TableCell>
                                <Stack spacing={0.35}>
                                    <Typography sx={{ fontWeight: 700 }}>{failure.source_label || failure.source_type}</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {failure.document_no || `#${failure.source_id}`}
                                    </Typography>
                                </Stack>
                            </TableCell>
                            <TableCell>{failure.restaurant_name || '-'}</TableCell>
                            <TableCell>{failure.failure_reason || '-'}</TableCell>
                            <TableCell>{failure.updated_at || '-'}</TableCell>
                            <TableCell align="right">
                                <Stack direction="row" spacing={1} justifyContent="flex-end">
                                    {failure.document_url ? (
                                        <Button size="small" variant="outlined" onClick={() => router.visit(failure.document_url)}>
                                            Open Source
                                        </Button>
                                    ) : (
                                        <Button size="small" variant="outlined" disabled>
                                            Unavailable
                                        </Button>
                                    )}
                                    <Button size="small" variant="outlined" onClick={() => router.post(route('accounting.events.retry', failure.id))}>
                                        Retry
                                    </Button>
                                </Stack>
                            </TableCell>
                        </TableRow>
                    )}
                />
            </SurfaceCard>
        </AppPage>
    );
}
