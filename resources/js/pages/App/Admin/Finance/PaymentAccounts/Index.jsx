import React from 'react';
import { Link, router } from '@inertiajs/react';
import debounce from 'lodash.debounce';
import { Button, Chip, Grid, Stack, TableCell, TableRow, TextField, MenuItem } from '@mui/material';
import AppPage from '@/components/App/ui/AppPage';
import AdminDataTable from '@/components/App/ui/AdminDataTable';
import FilterToolbar from '@/components/App/ui/FilterToolbar';
import StatCard from '@/components/App/ui/StatCard';
import SurfaceCard from '@/components/App/ui/SurfaceCard';
import useFilterLoadingState from '@/hooks/useFilterLoadingState';

const paymentMethodLabel = (value) => String(value || '-').replaceAll('_', ' ');

export default function Index({ accounts, filters = {} }) {
    const rows = accounts?.data || [];
    const [localFilters, setLocalFilters] = React.useState({
        search: filters.search || '',
        payment_method: filters.payment_method || '',
        status: filters.status || '',
        per_page: accounts?.per_page || 10,
        page: 1,
    });
    const filtersRef = React.useRef(localFilters);
    const { loading, beginLoading } = useFilterLoadingState([
        accounts?.per_page,
        filters.payment_method,
        filters.search,
        filters.status,
        rows.length,
    ]);

    const submitFilters = React.useCallback((nextFilters) => {
        beginLoading();
        const payload = {};
        if (nextFilters.search?.trim()) payload.search = nextFilters.search.trim();
        if (nextFilters.payment_method) payload.payment_method = nextFilters.payment_method;
        if (nextFilters.status) payload.status = nextFilters.status;
        payload.per_page = nextFilters.per_page || accounts?.per_page || 10;
        if (Number(nextFilters.page) > 1) payload.page = Number(nextFilters.page);

        router.get(route('finance.payment-accounts.index'), payload, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    }, [accounts?.per_page, beginLoading]);

    const debouncedSubmit = React.useMemo(() => debounce((next) => submitFilters(next), 300), [submitFilters]);
    React.useEffect(() => () => debouncedSubmit.cancel(), [debouncedSubmit]);

    React.useEffect(() => {
        const next = {
            search: filters.search || '',
            payment_method: filters.payment_method || '',
            status: filters.status || '',
            per_page: accounts?.per_page || 10,
            page: 1,
        };
        filtersRef.current = next;
        setLocalFilters(next);
    }, [accounts?.per_page, filters.payment_method, filters.search, filters.status]);

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
            payment_method: '',
            status: '',
            per_page: filtersRef.current.per_page || accounts?.per_page || 10,
            page: 1,
        };
        debouncedSubmit.cancel();
        filtersRef.current = cleared;
        setLocalFilters(cleared);
        submitFilters(cleared);
    }, [accounts?.per_page, debouncedSubmit, submitFilters]);

    const handleDelete = React.useCallback((id) => {
        if (!window.confirm('Are you sure you want to delete this payment account?')) {
            return;
        }

        router.delete(route('finance.payment-accounts.destroy', id), {
            preserveScroll: true,
        });
    }, []);

    const columns = [
        { key: 'name', label: 'Name', minWidth: 220 },
        { key: 'method', label: 'Payment Method', minWidth: 180 },
        { key: 'status', label: 'Status', minWidth: 120 },
        { key: 'actions', label: 'Actions', minWidth: 170, align: 'right' },
    ];

    const summary = {
        total: accounts?.total || rows.length,
        active: rows.filter((account) => account.status === 'active').length,
        inactive: rows.filter((account) => account.status === 'inactive').length,
    };

    return (
        <AppPage
            eyebrow="Finance"
            title="Payment Accounts"
            subtitle="Manage finance payment-account mappings with live filtering, shared table behavior, and a clearer operational shell."
            actions={[
                <Button key="trashed" variant="outlined" component={Link} href={route('finance.payment-accounts.trashed')}>
                    Deleted Items
                </Button>,
                <Button key="create" variant="contained" component={Link} href={route('finance.payment-accounts.create')}>
                    Add Payment Account
                </Button>,
            ]}
        >
            <Grid container spacing={2.25}>
                <Grid item xs={12} md={4}><StatCard label="Accounts" value={summary.total} accent /></Grid>
                <Grid item xs={12} md={4}><StatCard label="Active" value={summary.active} tone="light" /></Grid>
                <Grid item xs={12} md={4}><StatCard label="Inactive" value={summary.inactive} tone="muted" /></Grid>
            </Grid>

            <SurfaceCard title="Live Filters" subtitle="Filter payment accounts by account name, method, or status without the older apply/reset workflow.">
                <FilterToolbar onReset={resetFilters}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={4}>
                            <TextField
                                label="Search account name"
                                value={localFilters.search}
                                onChange={(event) => updateFilters({ search: event.target.value })}
                                fullWidth
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TextField
                                select
                                label="Payment Method"
                                value={localFilters.payment_method}
                                onChange={(event) => updateFilters({ payment_method: event.target.value }, { immediate: true })}
                                fullWidth
                            >
                                <MenuItem value="">All Methods</MenuItem>
                                <MenuItem value="cash">Cash</MenuItem>
                                <MenuItem value="credit_card">Credit Card</MenuItem>
                                <MenuItem value="debit_card">Debit Card</MenuItem>
                                <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                                <MenuItem value="online">Online Transfer</MenuItem>
                                <MenuItem value="cheque">Cheque</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TextField
                                select
                                label="Status"
                                value={localFilters.status}
                                onChange={(event) => updateFilters({ status: event.target.value }, { immediate: true })}
                                fullWidth
                            >
                                <MenuItem value="">All</MenuItem>
                                <MenuItem value="active">Active</MenuItem>
                                <MenuItem value="inactive">Inactive</MenuItem>
                            </TextField>
                        </Grid>
                    </Grid>
                </FilterToolbar>
            </SurfaceCard>

            <SurfaceCard title="Payment Account Register" subtitle="Shared finance register with visible no-data fallback and preserved filters across pagination.">
                <AdminDataTable
                    columns={columns}
                    rows={rows}
                    loading={loading}
                    pagination={accounts}
                    emptyMessage="No payment accounts found."
                    tableMinWidth={860}
                    renderRow={(account) => (
                        <TableRow key={account.id} hover>
                            <TableCell sx={{ fontWeight: 700, color: 'text.primary' }}>{account.name}</TableCell>
                            <TableCell sx={{ textTransform: 'capitalize' }}>{paymentMethodLabel(account.payment_method)}</TableCell>
                            <TableCell>
                                <Chip
                                    label={account.status || '-'}
                                    size="small"
                                    variant="outlined"
                                    color={account.status === 'active' ? 'success' : 'default'}
                                    sx={{ textTransform: 'capitalize' }}
                                />
                            </TableCell>
                            <TableCell align="right">
                                <Stack direction="row" spacing={1} justifyContent="flex-end">
                                    <Button size="small" variant="outlined" component={Link} href={route('finance.payment-accounts.edit', account.id)}>
                                        Edit
                                    </Button>
                                    <Button size="small" variant="outlined" color="error" onClick={() => handleDelete(account.id)}>
                                        Delete
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
