import React from 'react';
import { useForm, router } from '@inertiajs/react';
import {
    Alert,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    MenuItem,
    TableCell,
    TableRow,
    TextField,
} from '@mui/material';
import debounce from 'lodash.debounce';
import AppPage from '@/components/App/ui/AppPage';
import AdminDataTable from '@/components/App/ui/AdminDataTable';
import FilterToolbar from '@/components/App/ui/FilterToolbar';
import StatCard from '@/components/App/ui/StatCard';
import SurfaceCard from '@/components/App/ui/SurfaceCard';

export default function Accounts({ accounts, coaAccounts, filters, error = null }) {
    const [openModal, setOpenModal] = React.useState(false);
    const list = accounts?.data || [];
    const coaMap = React.useMemo(() => new Map(coaAccounts.map((acc) => [acc.id, acc])), [coaAccounts]);
    const [localFilters, setLocalFilters] = React.useState({
        search: filters?.search || '',
        method: filters?.method || '',
        status: filters?.status || '',
        per_page: filters?.per_page || accounts?.per_page || 25,
        page: 1,
    });
    const filtersRef = React.useRef(localFilters);
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        payment_method: 'bank_transfer',
        status: 'active',
        coa_account_id: '',
        is_default: false,
    });

    const submitFilters = React.useCallback((nextFilters) => {
        const payload = {};

        if (nextFilters.search?.trim()) payload.search = nextFilters.search.trim();
        if (nextFilters.method) payload.method = nextFilters.method;
        if (nextFilters.status) payload.status = nextFilters.status;
        payload.per_page = nextFilters.per_page || 25;
        if (Number(nextFilters.page) > 1) payload.page = Number(nextFilters.page);

        router.get(route('accounting.bank-accounts.index'), payload, {
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
            method: filters?.method || '',
            status: filters?.status || '',
            per_page: filters?.per_page || accounts?.per_page || 25,
            page: 1,
        };
        filtersRef.current = next;
        setLocalFilters(next);
    }, [accounts?.per_page, filters?.method, filters?.per_page, filters?.search, filters?.status]);

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
            method: '',
            status: '',
            per_page: filtersRef.current.per_page || accounts?.per_page || 25,
            page: 1,
        };
        debouncedSubmit.cancel();
        filtersRef.current = cleared;
        setLocalFilters(cleared);
        submitFilters(cleared);
    }, [accounts?.per_page, debouncedSubmit, submitFilters]);

    const submit = (event) => {
        event.preventDefault();
        post(route('accounting.bank-accounts.store'), {
            onSuccess: () => {
                reset();
                setOpenModal(false);
            },
        });
    };

    const columns = [
        { key: 'name', label: 'Name', minWidth: 200 },
        { key: 'method', label: 'Method', minWidth: 130 },
        { key: 'status', label: 'Status', minWidth: 120 },
        { key: 'default', label: 'Default', minWidth: 110 },
        { key: 'coa', label: 'COA Mapping', minWidth: 300 },
        { key: 'action', label: 'Action', minWidth: 120, align: 'center' },
    ];

    const activeCount = list.filter((account) => account.status === 'active').length;
    const defaultCount = list.filter((account) => account.is_default).length;

    return (
        <>
            <AppPage
                eyebrow="Accounting"
                title="Bank Accounts"
                subtitle="Manage operational payment accounts, their status, and linked chart of accounts mapping."
                actions={[
                    <Button key="add" variant="contained" onClick={() => setOpenModal(true)}>
                        Add Account
                    </Button>,
                ]}
            >
                <Grid container spacing={2.25}>
                    <Grid item xs={12} md={3}><StatCard label="Accounts" value={accounts?.total || list.length} accent /></Grid>
                    <Grid item xs={12} md={3}><StatCard label="Active" value={activeCount} tone="light" /></Grid>
                    <Grid item xs={12} md={3}><StatCard label="Default Mapped" value={defaultCount} tone="light" /></Grid>
                    <Grid item xs={12} md={3}><StatCard label="COA Options" value={coaAccounts.length} tone="muted" /></Grid>
                </Grid>

                {error ? <Alert severity="warning" variant="outlined">{error}</Alert> : null}

                <SurfaceCard title="Live Filters" subtitle="Results update automatically while you refine account name, method, or activity state.">
                    <FilterToolbar onReset={resetFilters}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={4}>
                                <TextField
                                    label="Search account"
                                    value={localFilters.search}
                                    onChange={(event) => updateFilters({ search: event.target.value })}
                                    fullWidth
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField
                                    select
                                    label="Method"
                                    value={localFilters.method}
                                    onChange={(event) => updateFilters({ method: event.target.value }, { immediate: true })}
                                    fullWidth
                                >
                                    <MenuItem value="">All methods</MenuItem>
                                    <MenuItem value="bank_transfer">Bank</MenuItem>
                                    <MenuItem value="online">Online</MenuItem>
                                    <MenuItem value="cheque">Cheque</MenuItem>
                                    <MenuItem value="cash">Cash</MenuItem>
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

                <SurfaceCard title="Account Register" subtitle="Standardized payment-account list with chart mapping and operational cleanup actions.">
                    <AdminDataTable
                        columns={columns}
                        rows={list}
                        pagination={accounts}
                        emptyMessage="No bank accounts found."
                        tableMinWidth={1080}
                        renderRow={(account) => (
                            <TableRow key={account.id} hover>
                                <TableCell sx={{ fontWeight: 700, color: 'text.primary' }}>{account.name}</TableCell>
                                <TableCell sx={{ textTransform: 'capitalize' }}>{String(account.payment_method || '').replaceAll('_', ' ')}</TableCell>
                                <TableCell>
                                    <Chip label={account.status} size="small" color={account.status === 'active' ? 'success' : 'default'} variant="outlined" />
                                </TableCell>
                                <TableCell>
                                    <Chip label={account.is_default ? 'Yes' : 'No'} size="small" color={account.is_default ? 'primary' : 'default'} variant="outlined" />
                                </TableCell>
                                <TableCell>
                                    {account.coa_account_id && coaMap.has(account.coa_account_id)
                                        ? `${coaMap.get(account.coa_account_id).full_code} - ${coaMap.get(account.coa_account_id).name}`
                                        : '-'}
                                </TableCell>
                                <TableCell align="center">
                                    <Button size="small" color="error" variant="outlined" onClick={() => router.delete(route('accounting.bank-accounts.destroy', account.id))}>
                                        Delete
                                    </Button>
                                </TableCell>
                            </TableRow>
                        )}
                    />
                </SurfaceCard>
            </AppPage>

            <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="md" fullWidth>
                <DialogTitle>Add Bank Account</DialogTitle>
                <form onSubmit={submit}>
                    <DialogContent>
                        <Grid container spacing={2} sx={{ mt: 0 }}>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    label="Name"
                                    value={data.name}
                                    onChange={(event) => setData('name', event.target.value)}
                                    error={!!errors.name}
                                    helperText={errors.name}
                                    fullWidth
                                />
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <TextField select label="Method" value={data.payment_method} onChange={(event) => setData('payment_method', event.target.value)} fullWidth>
                                    <MenuItem value="bank_transfer">Bank</MenuItem>
                                    <MenuItem value="online">Online</MenuItem>
                                    <MenuItem value="cheque">Cheque</MenuItem>
                                    <MenuItem value="cash">Cash</MenuItem>
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <TextField select label="Status" value={data.status} onChange={(event) => setData('status', event.target.value)} fullWidth>
                                    <MenuItem value="active">Active</MenuItem>
                                    <MenuItem value="inactive">Inactive</MenuItem>
                                </TextField>
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    select
                                    label="COA Account"
                                    value={data.coa_account_id}
                                    onChange={(event) => setData('coa_account_id', event.target.value)}
                                    fullWidth
                                >
                                    <MenuItem value="">None</MenuItem>
                                    {coaAccounts.map((account) => (
                                        <MenuItem key={account.id} value={account.id}>
                                            {account.full_code} - {account.name}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 2 }}>
                        <Button onClick={() => setOpenModal(false)}>Cancel</Button>
                        <Button type="submit" variant="contained" disabled={processing}>
                            Create Account
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </>
    );
}
