import React from 'react';
import { router, useForm } from '@inertiajs/react';
import {
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    MenuItem,
    Stack,
    TableCell,
    TableRow,
    TextField,
    Typography,
} from '@mui/material';
import debounce from 'lodash.debounce';
import AdminDataTable from '@/components/App/ui/AdminDataTable';
import AppPage from '@/components/App/ui/AppPage';
import FilterToolbar from '@/components/App/ui/FilterToolbar';
import StatCard from '@/components/App/ui/StatCard';
import SurfaceCard from '@/components/App/ui/SurfaceCard';
import { AdminIconAction, AdminRowActionGroup } from '@/components/App/ui/AdminRowActions';
import { DeleteOutline } from '@mui/icons-material';

export default function Index({ vendors, filters, summary = {}, tenants = [], coaAccounts = [], paymentAccounts = [] }) {
    const [openModal, setOpenModal] = React.useState(false);
    const [localFilters, setLocalFilters] = React.useState({
        search: filters?.search || '',
        status: filters?.status || '',
        tenant_id: filters?.tenant_id || '',
        per_page: filters?.per_page || vendors?.per_page || 25,
        page: 1,
    });
    const filtersRef = React.useRef(localFilters);

    const submitFilters = React.useCallback((nextFilters) => {
        const payload = {};

        if (nextFilters.search?.trim()) {
            payload.search = nextFilters.search.trim();
        }
        if (nextFilters.status) {
            payload.status = nextFilters.status;
        }
        if (nextFilters.tenant_id) {
            payload.tenant_id = nextFilters.tenant_id;
        }
        payload.per_page = nextFilters.per_page || 25;
        if (Number(nextFilters.page) > 1) {
            payload.page = Number(nextFilters.page);
        }

        router.get(route('procurement.vendors.index'), payload, {
            preserveState: false,
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
            per_page: filters?.per_page || vendors?.per_page || 25,
            page: 1,
        };
        filtersRef.current = next;
        setLocalFilters(next);
    }, [filters?.per_page, filters?.search, filters?.status, filters?.tenant_id, vendors?.per_page]);

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
            setLocalFilters(nextFilters);

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
        const next = {
            search: '',
            status: '',
            tenant_id: '',
            per_page: localFilters.per_page || 25,
            page: 1,
        };
        debouncedSubmit.cancel();
        filtersRef.current = next;
        setLocalFilters(next);
        submitFilters(next);
    }, [debouncedSubmit, localFilters.per_page, submitFilters]);

    const { data, setData, post, processing, errors, reset } = useForm({
        code: '',
        name: '',
        tax_id: '',
        phone: '',
        email: '',
        address: '',
        tenant_id: '',
        payment_terms_days: 0,
        currency: 'PKR',
        opening_balance: 0,
        payable_account_id: '',
        advance_account_id: '',
        default_payment_account_id: '',
        tax_treatment: '',
        approval_status: 'approved',
        status: 'active',
    });

    const list = vendors?.data || [];
    const columns = [
        { key: 'code', label: 'Code' },
        { key: 'name', label: 'Vendor', minWidth: 220 },
        { key: 'restaurant', label: 'Restaurant', minWidth: 170 },
        { key: 'finance', label: 'Finance Defaults', minWidth: 320 },
        { key: 'contact', label: 'Contact', minWidth: 220 },
        { key: 'opening_balance', label: 'Opening Balance' },
        { key: 'status', label: 'Status' },
        { key: 'actions', label: 'Action', align: 'right' },
    ];

    const submit = (e) => {
        e.preventDefault();
        post(route('procurement.vendors.store'), {
            onSuccess: () => {
                reset();
                setData('currency', 'PKR');
                setData('opening_balance', 0);
                setData('payment_terms_days', 0);
                setData('approval_status', 'approved');
                setData('status', 'active');
                setOpenModal(false);
            },
        });
    };

    return (
        <AppPage
            eyebrow="Procurement"
            title="Vendors"
            subtitle="Maintain restaurant-aware supplier masters with finance defaults so payables and payments post correctly into accounting."
            actions={[
                <Button key="create" variant="contained" onClick={() => setOpenModal(true)}>
                    Add Vendor
                </Button>,
            ]}
        >
            <Grid container spacing={2.25}>
                <Grid item xs={12} md={2.4}>
                    <StatCard label="Vendors" value={summary.count || 0} />
                </Grid>
                <Grid item xs={12} md={2.4}>
                    <StatCard label="Active" value={summary.active || 0} tone="light" />
                </Grid>
                <Grid item xs={12} md={2.4}>
                    <StatCard label="Approved" value={summary.approved || 0} tone="light" />
                </Grid>
                <Grid item xs={12} md={2.4}>
                    <StatCard label="Inactive" value={summary.inactive || 0} tone="muted" />
                </Grid>
                <Grid item xs={12} md={2.4}>
                    <StatCard label="Opening Balance" value={Number(summary.opening_balance || 0).toFixed(2)} tone="light" />
                </Grid>
            </Grid>

            <SurfaceCard title="Live Filters" subtitle="Results update automatically while you search, change status, or switch restaurant context.">
                <FilterToolbar onReset={resetFilters}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={5}>
                            <TextField
                                label="Search vendor"
                                placeholder="Search by code, name, or email"
                                value={localFilters.search}
                                onChange={(e) => updateFilters({ search: e.target.value })}
                                fullWidth
                            />
                        </Grid>
                        <Grid item xs={12} md={3.5}>
                            <TextField
                                select
                                label="Restaurant"
                                value={localFilters.tenant_id}
                                onChange={(e) => updateFilters({ tenant_id: e.target.value }, { immediate: true })}
                                fullWidth
                            >
                                <MenuItem value="">All restaurants</MenuItem>
                                {tenants.map((tenant) => (
                                    <MenuItem key={tenant.id} value={tenant.id}>{tenant.name}</MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={3.5}>
                            <TextField
                                select
                                label="Status"
                                value={localFilters.status}
                                onChange={(e) => updateFilters({ status: e.target.value }, { immediate: true })}
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

            <SurfaceCard title="Vendor Register" subtitle="Vendor master with restaurant context, account defaults, and payment readiness in one standardized table.">
                <AdminDataTable
                    columns={columns}
                    rows={list}
                    pagination={vendors}
                    emptyMessage="No vendors found."
                    tableMinWidth={1380}
                    renderRow={(vendor) => (
                        <TableRow
                            key={vendor.id}
                            hover
                            sx={{
                                '& .MuiTableCell-body': {
                                    py: 1.5,
                                    borderBottomColor: '#edf2f7',
                                },
                            }}
                        >
                            <TableCell sx={{ fontWeight: 700, color: 'text.primary' }}>{vendor.code}</TableCell>
                            <TableCell>
                                <Typography sx={{ fontWeight: 700, color: 'text.primary' }}>{vendor.name}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Terms: {vendor.payment_terms_days ?? 0} days
                                </Typography>
                            </TableCell>
                            <TableCell>
                                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                                    <Chip size="small" label={vendor.tenant?.name || 'Shared'} color="primary" variant="outlined" />
                                    <Chip size="small" label={vendor.approval_status || 'approved'} variant="outlined" />
                                </Stack>
                            </TableCell>
                            <TableCell>
                                <Stack spacing={0.5}>
                                    <Typography variant="body2" color="text.secondary">
                                        Payable: {vendor.payable_account ? `${vendor.payable_account.full_code} · ${vendor.payable_account.name}` : '-'}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Advance: {vendor.advance_account ? `${vendor.advance_account.full_code} · ${vendor.advance_account.name}` : '-'}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Payment: {vendor.default_payment_account?.name || '-'}
                                    </Typography>
                                </Stack>
                            </TableCell>
                            <TableCell>
                                <Typography>{vendor.phone || '-'}</Typography>
                                <Typography variant="body2" color="text.secondary">{vendor.email || '-'}</Typography>
                            </TableCell>
                            <TableCell>{Number(vendor.opening_balance || 0).toFixed(2)}</TableCell>
                            <TableCell>
                                <Chip
                                    size="small"
                                    label={vendor.status}
                                    color={vendor.status === 'active' ? 'success' : 'default'}
                                    variant={vendor.status === 'active' ? 'filled' : 'outlined'}
                                />
                            </TableCell>
                            <TableCell align="right">
                                <AdminRowActionGroup justify="flex-end">
                                    <AdminIconAction title="Delete Vendor" color="error" onClick={() => router.delete(route('procurement.vendors.destroy', vendor.id))}>
                                        <DeleteOutline fontSize="small" />
                                    </AdminIconAction>
                                </AdminRowActionGroup>
                            </TableCell>
                        </TableRow>
                    )}
                />
            </SurfaceCard>

            <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: '22px' } }}>
                <DialogTitle>Add Vendor</DialogTitle>
                <form onSubmit={submit}>
                    <DialogContent>
                        <Grid container spacing={2} sx={{ mt: 0 }}>
                            <Grid item xs={12} md={4}>
                                <TextField label="Code" value={data.code} onChange={(e) => setData('code', e.target.value)} error={!!errors.code} helperText={errors.code} fullWidth />
                            </Grid>
                            <Grid item xs={12} md={8}>
                                <TextField label="Name" value={data.name} onChange={(e) => setData('name', e.target.value)} error={!!errors.name} helperText={errors.name} fullWidth />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField label="Phone" value={data.phone} onChange={(e) => setData('phone', e.target.value)} error={!!errors.phone} helperText={errors.phone} fullWidth />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField label="Email" value={data.email} onChange={(e) => setData('email', e.target.value)} error={!!errors.email} helperText={errors.email} fullWidth />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField label="Tax ID" value={data.tax_id} onChange={(e) => setData('tax_id', e.target.value)} error={!!errors.tax_id} helperText={errors.tax_id} fullWidth />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField label="Address" value={data.address} onChange={(e) => setData('address', e.target.value)} fullWidth />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField select label="Restaurant" value={data.tenant_id} onChange={(e) => setData('tenant_id', e.target.value)} error={!!errors.tenant_id} helperText={errors.tenant_id} fullWidth>
                                    <MenuItem value="">Shared vendor</MenuItem>
                                    {tenants.map((tenant) => (
                                        <MenuItem key={tenant.id} value={tenant.id}>{tenant.name}</MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField label="Payment Terms (days)" type="number" value={data.payment_terms_days} onChange={(e) => setData('payment_terms_days', e.target.value)} error={!!errors.payment_terms_days} helperText={errors.payment_terms_days} fullWidth />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField label="Opening Balance" type="number" value={data.opening_balance} onChange={(e) => setData('opening_balance', e.target.value)} error={!!errors.opening_balance} helperText={errors.opening_balance} fullWidth />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField select label="Payable Account" value={data.payable_account_id} onChange={(e) => setData('payable_account_id', e.target.value)} error={!!errors.payable_account_id} helperText={errors.payable_account_id} fullWidth>
                                    <MenuItem value="">None</MenuItem>
                                    {coaAccounts.map((account) => (
                                        <MenuItem key={account.id} value={account.id}>{account.full_code} · {account.name}</MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField select label="Advance Account" value={data.advance_account_id} onChange={(e) => setData('advance_account_id', e.target.value)} error={!!errors.advance_account_id} helperText={errors.advance_account_id} fullWidth>
                                    <MenuItem value="">None</MenuItem>
                                    {coaAccounts.map((account) => (
                                        <MenuItem key={account.id} value={account.id}>{account.full_code} · {account.name}</MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField select label="Default Payment Account" value={data.default_payment_account_id} onChange={(e) => setData('default_payment_account_id', e.target.value)} error={!!errors.default_payment_account_id} helperText={errors.default_payment_account_id} fullWidth>
                                    <MenuItem value="">None</MenuItem>
                                    {paymentAccounts.map((account) => (
                                        <MenuItem key={account.id} value={account.id}>{account.name}</MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField select label="Tax Treatment" value={data.tax_treatment} onChange={(e) => setData('tax_treatment', e.target.value)} error={!!errors.tax_treatment} helperText={errors.tax_treatment} fullWidth>
                                    <MenuItem value="">None</MenuItem>
                                    <MenuItem value="standard">Standard</MenuItem>
                                    <MenuItem value="withholding">Withholding</MenuItem>
                                    <MenuItem value="exempt">Exempt</MenuItem>
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField select label="Approval Status" value={data.approval_status} onChange={(e) => setData('approval_status', e.target.value)} fullWidth>
                                    <MenuItem value="approved">Approved</MenuItem>
                                    <MenuItem value="pending">Pending</MenuItem>
                                    <MenuItem value="blocked">Blocked</MenuItem>
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField select label="Status" value={data.status} onChange={(e) => setData('status', e.target.value)} fullWidth>
                                    <MenuItem value="active">Active</MenuItem>
                                    <MenuItem value="inactive">Inactive</MenuItem>
                                </TextField>
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setOpenModal(false)}>Cancel</Button>
                        <Button type="submit" variant="contained" disabled={processing}>Create Vendor</Button>
                    </DialogActions>
                </form>
            </Dialog>
        </AppPage>
    );
}
