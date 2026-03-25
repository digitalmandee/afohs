import React from 'react';
import { Link, router } from '@inertiajs/react';
import debounce from 'lodash.debounce';
import { Button, Chip, Grid, MenuItem, Stack, TableCell, TableRow, TextField, Typography } from '@mui/material';
import AppPage from '@/components/App/ui/AppPage';
import AdminDataTable from '@/components/App/ui/AdminDataTable';
import FilterToolbar from '@/components/App/ui/FilterToolbar';
import StatCard from '@/components/App/ui/StatCard';
import SurfaceCard from '@/components/App/ui/SurfaceCard';
import DateRangeFilterFields from '@/components/App/ui/DateRangeFilterFields';
import useFilterLoadingState from '@/hooks/useFilterLoadingState';

const formatCurrency = (amount) => new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
}).format(Number(amount || 0)).replace('PKR', 'Rs');

const statusColor = {
    active: 'success',
    inactive: 'default',
    expired: 'error',
    used: 'info',
};

export default function VoucherDashboard({ vouchers, stats = {}, filters = {} }) {
    const rows = vouchers?.data || [];
    const [localFilters, setLocalFilters] = React.useState({
        search: filters.search || '',
        type: filters.type || '',
        status: filters.status || '',
        account: filters.account || '',
        from: filters.from || '',
        to: filters.to || '',
        per_page: vouchers?.per_page || 15,
        page: 1,
    });
    const filtersRef = React.useRef(localFilters);
    const { loading, beginLoading } = useFilterLoadingState([
        filters.account,
        filters.from,
        filters.search,
        filters.status,
        filters.to,
        filters.type,
        vouchers?.per_page,
        rows.length,
    ]);

    const submitFilters = React.useCallback((nextFilters) => {
        beginLoading();
        const payload = {};
        if (nextFilters.search?.trim()) payload.search = nextFilters.search.trim();
        if (nextFilters.type) payload.type = nextFilters.type;
        if (nextFilters.status) payload.status = nextFilters.status;
        if (nextFilters.account?.trim()) payload.account = nextFilters.account.trim();
        if (nextFilters.from) payload.from = nextFilters.from;
        if (nextFilters.to) payload.to = nextFilters.to;
        payload.per_page = nextFilters.per_page || vouchers?.per_page || 15;
        if (Number(nextFilters.page) > 1) payload.page = Number(nextFilters.page);

        router.get(route('vouchers.dashboard'), payload, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    }, [beginLoading, vouchers?.per_page]);

    const debouncedSubmit = React.useMemo(() => debounce((next) => submitFilters(next), 300), [submitFilters]);
    React.useEffect(() => () => debouncedSubmit.cancel(), [debouncedSubmit]);

    React.useEffect(() => {
        const next = {
            search: filters.search || '',
            type: filters.type || '',
            status: filters.status || '',
            account: filters.account || '',
            from: filters.from || '',
            to: filters.to || '',
            per_page: vouchers?.per_page || 15,
            page: 1,
        };
        filtersRef.current = next;
        setLocalFilters(next);
    }, [filters.account, filters.from, filters.search, filters.status, filters.to, filters.type, vouchers?.per_page]);

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
            type: '',
            status: '',
            account: '',
            from: '',
            to: '',
            per_page: filtersRef.current.per_page || vouchers?.per_page || 15,
            page: 1,
        };
        debouncedSubmit.cancel();
        filtersRef.current = cleared;
        setLocalFilters(cleared);
        submitFilters(cleared);
    }, [debouncedSubmit, submitFilters, vouchers?.per_page]);

    const markAsUsed = React.useCallback((voucherId) => {
        if (!window.confirm('Are you sure you want to mark this voucher as used?')) {
            return;
        }

        router.post(route('vouchers.mark-used', voucherId), {}, { preserveScroll: true });
    }, []);

    const deleteVoucher = React.useCallback((voucherId) => {
        if (!window.confirm('Are you sure you want to delete this voucher?')) {
            return;
        }

        router.delete(route('vouchers.destroy', voucherId), { preserveScroll: true });
    }, []);

    const columns = [
        { key: 'voucher_code', label: 'Voucher', minWidth: 180 },
        { key: 'recipient', label: 'Account', minWidth: 220 },
        { key: 'type', label: 'Type', minWidth: 120 },
        { key: 'validity', label: 'Validity', minWidth: 180 },
        { key: 'status', label: 'Status', minWidth: 120 },
        { key: 'amount', label: 'Amount', minWidth: 120, align: 'right' },
        { key: 'actions', label: 'Actions', minWidth: 220, align: 'right' },
    ];

    return (
        <AppPage
            eyebrow="Finance"
            title="Voucher Management"
            subtitle="Manage voucher recipients, validity windows, and value from a live-filtered register instead of the older manual dashboard."
            actions={[
                <Button key="create" variant="contained" component={Link} href={route('vouchers.create')}>
                    Create Voucher
                </Button>,
            ]}
        >
            <Grid container spacing={2.25}>
                <Grid item xs={12} sm={6} md={3}><StatCard label="Total Vouchers" value={stats.total_vouchers || 0} accent /></Grid>
                <Grid item xs={12} sm={6} md={3}><StatCard label="Active" value={stats.active_vouchers || 0} tone="light" /></Grid>
                <Grid item xs={12} sm={6} md={3}><StatCard label="Used" value={stats.used_vouchers || 0} tone="light" /></Grid>
                <Grid item xs={12} sm={6} md={3}><StatCard label="Total Value" value={formatCurrency(stats.total_value)} tone="muted" /></Grid>
            </Grid>

            <SurfaceCard title="Live Filters" subtitle="Filter vouchers by code, recipient account, type, status, and validity range with live updates.">
                <FilterToolbar onReset={resetFilters}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={3}>
                            <TextField
                                label="Search voucher"
                                value={localFilters.search}
                                onChange={(event) => updateFilters({ search: event.target.value })}
                                fullWidth
                            />
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <TextField
                                label="Recipient account"
                                value={localFilters.account}
                                onChange={(event) => updateFilters({ account: event.target.value })}
                                fullWidth
                            />
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <TextField
                                select
                                label="Voucher Type"
                                value={localFilters.type}
                                onChange={(event) => updateFilters({ type: event.target.value }, { immediate: true })}
                                fullWidth
                            >
                                <MenuItem value="">All</MenuItem>
                                <MenuItem value="member">Member</MenuItem>
                                <MenuItem value="employee">Employee</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={2}>
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
                                <MenuItem value="expired">Expired</MenuItem>
                                <MenuItem value="used">Used</MenuItem>
                            </TextField>
                        </Grid>
                        <DateRangeFilterFields
                            startValue={localFilters.from}
                            endValue={localFilters.to}
                            onStartChange={(value) => updateFilters({ from: value }, { immediate: true })}
                            onEndChange={(value) => updateFilters({ to: value }, { immediate: true })}
                            startGrid={{ xs: 12, md: 1 }}
                            endGrid={{ xs: 12, md: 1 }}
                        />
                    </Grid>
                </FilterToolbar>
            </SurfaceCard>

            <SurfaceCard title="Voucher Register" subtitle="Shared finance table with recipient visibility, validity windows, and visible empty-state handling.">
                <AdminDataTable
                    columns={columns}
                    rows={rows}
                    loading={loading}
                    pagination={vouchers}
                    emptyMessage="No vouchers found."
                    tableMinWidth={1180}
                    renderRow={(voucher) => {
                        const recipient = voucher.voucher_type === 'member'
                            ? voucher.member?.full_name || 'Unknown member'
                            : voucher.employee?.name || 'Unknown employee';
                        const recipientMeta = voucher.voucher_type === 'member'
                            ? voucher.member?.membership_no || '-'
                            : voucher.employee?.employee_id || '-';

                        return (
                            <TableRow key={voucher.id} hover>
                                <TableCell>
                                    <Stack spacing={0.35}>
                                        <Typography sx={{ fontWeight: 700, color: 'text.primary' }}>
                                            {voucher.voucher_code || `V-${voucher.id}`}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {voucher.voucher_name || '-'}
                                        </Typography>
                                    </Stack>
                                </TableCell>
                                <TableCell>
                                    <Stack spacing={0.35}>
                                        <Typography sx={{ fontWeight: 700, color: 'text.primary' }}>{recipient}</Typography>
                                        <Typography variant="body2" color="text.secondary">{recipientMeta}</Typography>
                                    </Stack>
                                </TableCell>
                                <TableCell sx={{ textTransform: 'capitalize' }}>{voucher.voucher_type || '-'}</TableCell>
                                <TableCell>
                                    <Stack spacing={0.35}>
                                        <Typography>{voucher.valid_from || '-'}</Typography>
                                        <Typography variant="body2" color="text.secondary">to {voucher.valid_to || '-'}</Typography>
                                    </Stack>
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={voucher.status || '-'}
                                        size="small"
                                        variant="outlined"
                                        color={statusColor[voucher.status] || 'default'}
                                        sx={{ textTransform: 'capitalize' }}
                                    />
                                </TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700 }}>{formatCurrency(voucher.amount)}</TableCell>
                                <TableCell align="right">
                                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                                        <Button size="small" variant="outlined" component={Link} href={route('vouchers.show', voucher.id)}>
                                            View
                                        </Button>
                                        <Button size="small" variant="outlined" component={Link} href={route('vouchers.edit', voucher.id)}>
                                            Edit
                                        </Button>
                                        {voucher.status !== 'used' ? (
                                            <Button size="small" variant="outlined" onClick={() => markAsUsed(voucher.id)}>
                                                Mark Used
                                            </Button>
                                        ) : null}
                                        <Button size="small" variant="outlined" color="error" onClick={() => deleteVoucher(voucher.id)}>
                                            Delete
                                        </Button>
                                    </Stack>
                                </TableCell>
                            </TableRow>
                        );
                    }}
                />
            </SurfaceCard>
        </AppPage>
    );
}
