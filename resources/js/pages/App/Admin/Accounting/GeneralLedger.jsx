import React from 'react';
import { router } from '@inertiajs/react';
import debounce from 'lodash.debounce';
import { Alert, Button, Chip, Grid, MenuItem, TableCell, TableRow, TextField } from '@mui/material';
import AppPage from '@/components/App/ui/AppPage';
import AdminDataTable from '@/components/App/ui/AdminDataTable';
import FilterToolbar from '@/components/App/ui/FilterToolbar';
import StatCard from '@/components/App/ui/StatCard';
import SurfaceCard from '@/components/App/ui/SurfaceCard';

export default function GeneralLedger({ lines, accounts, filters, summary, tenants = [], error = null }) {
    const rows = lines?.data || [];
    const [localFilters, setLocalFilters] = React.useState({
        account_id: filters?.account_id || '',
        search: filters?.search || '',
        tenant_id: filters?.tenant_id || '',
        from: filters?.from || '',
        to: filters?.to || '',
        per_page: filters?.per_page || lines?.per_page || 25,
        page: 1,
    });
    const filtersRef = React.useRef(localFilters);

    const submitFilters = React.useCallback((nextFilters) => {
        const payload = {};

        if (nextFilters.account_id) payload.account_id = nextFilters.account_id;
        if (nextFilters.search?.trim()) payload.search = nextFilters.search.trim();
        if (nextFilters.tenant_id) payload.tenant_id = nextFilters.tenant_id;
        if (nextFilters.from) payload.from = nextFilters.from;
        if (nextFilters.to) payload.to = nextFilters.to;
        payload.per_page = nextFilters.per_page || 25;
        if (Number(nextFilters.page) > 1) payload.page = Number(nextFilters.page);

        router.get(route('accounting.general-ledger'), payload, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    }, []);

    const debouncedSubmit = React.useMemo(() => debounce((nextFilters) => submitFilters(nextFilters), 350), [submitFilters]);

    React.useEffect(() => () => debouncedSubmit.cancel(), [debouncedSubmit]);

    React.useEffect(() => {
        const next = {
            account_id: filters?.account_id || '',
            search: filters?.search || '',
            tenant_id: filters?.tenant_id || '',
            from: filters?.from || '',
            to: filters?.to || '',
            per_page: filters?.per_page || lines?.per_page || 25,
            page: 1,
        };
        filtersRef.current = next;
        setLocalFilters(next);
    }, [filters?.account_id, filters?.from, filters?.per_page, filters?.search, filters?.tenant_id, filters?.to, lines?.per_page]);

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
            account_id: '',
            search: '',
            tenant_id: '',
            from: '',
            to: '',
            per_page: filtersRef.current.per_page || lines?.per_page || 25,
            page: 1,
        };
        debouncedSubmit.cancel();
        filtersRef.current = cleared;
        setLocalFilters(cleared);
        submitFilters(cleared);
    }, [debouncedSubmit, lines?.per_page, submitFilters]);

    const columns = [
        { key: 'date', label: 'Date', minWidth: 130 },
        { key: 'entry_no', label: 'Entry No', minWidth: 140 },
        { key: 'account', label: 'Account', minWidth: 240 },
        { key: 'description', label: 'Description', minWidth: 260 },
        { key: 'debit', label: 'Debit', minWidth: 120, align: 'right' },
        { key: 'credit', label: 'Credit', minWidth: 120, align: 'right' },
        { key: 'source', label: 'Source', minWidth: 160 },
        { key: 'restaurant', label: 'Restaurant', minWidth: 160 },
        { key: 'action', label: 'Action', minWidth: 150, align: 'right' },
    ];

    return (
        <AppPage
            eyebrow="Accounting"
            title="General Ledger"
            subtitle="Review account-level journal movement with live filtering, consistent pagination, and a denser ledger register."
        >
            <Grid container spacing={2.25}>
                <Grid item xs={12} md={4}><StatCard label="Visible Ledger Lines" value={summary?.records || lines?.total || 0} accent /></Grid>
                <Grid item xs={12} md={4}><StatCard label="Visible Debits" value={Number(summary?.total_debit || 0).toFixed(2)} tone="light" /></Grid>
                <Grid item xs={12} md={4}><StatCard label="Visible Credits" value={Number(summary?.total_credit || 0).toFixed(2)} tone="muted" /></Grid>
            </Grid>

            {error ? <Alert severity="warning" variant="outlined">{error}</Alert> : null}

            <SurfaceCard title="Live Filters" subtitle="Filter by account, reference text, and date range without using manual search submissions.">
                <FilterToolbar onReset={resetFilters}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={3}>
                            <TextField
                                select
                                label="Account"
                                value={localFilters.account_id}
                                onChange={(event) => updateFilters({ account_id: event.target.value }, { immediate: true })}
                                fullWidth
                            >
                                <MenuItem value="">All accounts</MenuItem>
                                {accounts.map((account) => (
                                    <MenuItem key={account.id} value={account.id}>
                                        {account.full_code} - {account.name}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TextField
                                label="Search entry or description"
                                value={localFilters.search}
                                onChange={(event) => updateFilters({ search: event.target.value })}
                                fullWidth
                            />
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
                        <Grid item xs={12} md={2.5}>
                            <TextField
                                label="From"
                                type="date"
                                value={localFilters.from}
                                onChange={(event) => updateFilters({ from: event.target.value }, { immediate: true })}
                                InputLabelProps={{ shrink: true }}
                                fullWidth
                            />
                        </Grid>
                        <Grid item xs={12} md={2.5}>
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

            <SurfaceCard title="Ledger Register" subtitle="Chronological journal lines with account context and balanced debit-credit visibility.">
                <AdminDataTable
                    columns={columns}
                    rows={rows}
                    pagination={lines}
                    emptyMessage="No ledger lines found."
                    tableMinWidth={1120}
                    renderRow={(line) => (
                        <TableRow key={line.id} hover>
                            <TableCell>{line.entry_date}</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: 'text.primary' }}>{line.entry_no}</TableCell>
                            <TableCell>{line.account?.full_code} - {line.account?.name}</TableCell>
                            <TableCell>{line.description || '-'}</TableCell>
                            <TableCell align="right">{Number(line.debit || 0).toFixed(2)}</TableCell>
                            <TableCell align="right">{Number(line.credit || 0).toFixed(2)}</TableCell>
                            <TableCell>
                                <Chip
                                    size="small"
                                    variant="outlined"
                                    color={Number(line.debit || 0) > 0 ? 'success' : 'primary'}
                                    label={line.source_label || (Number(line.debit || 0) > 0 ? 'Debit' : 'Credit')}
                                />
                            </TableCell>
                            <TableCell>{line.restaurant_name || '-'}</TableCell>
                            <TableCell align="right">
                                {line.document_url ? (
                                    <Button size="small" variant="outlined" onClick={() => router.visit(line.document_url)}>
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
