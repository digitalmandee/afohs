import React from 'react';
import { router, useForm } from '@inertiajs/react';
import {
    Box,
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
import {
    AccountBalanceWalletOutlined,
    DeleteOutline,
    PaymentsOutlined,
    ReceiptLongOutlined,
    UndoOutlined,
    VisibilityOutlined,
} from '@mui/icons-material';
import { formatAmount, formatCount } from '@/lib/formatting';

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
    const statCards = [
        { key: 'vendors', label: 'Vendors', value: formatCount(summary.count), tone: 'dark' },
        { key: 'active', label: 'Active', value: formatCount(summary.active), tone: 'light' },
        { key: 'approved', label: 'Approved', value: formatCount(summary.approved), tone: 'light' },
        { key: 'inactive', label: 'Inactive', value: formatCount(summary.inactive), tone: 'muted' },
        { key: 'opening_balance', label: 'Opening Balance', value: formatAmount(summary.opening_balance), tone: 'light' },
        { key: 'ap_outstanding', label: 'AP Outstanding', value: formatAmount(summary.ap_outstanding), tone: 'light' },
        { key: 'advance_credit', label: 'Advance Credit', value: formatAmount(summary.advance_credit), tone: 'light' },
        { key: 'purchase_return_credit', label: 'Return Credit', value: formatAmount(summary.purchase_return_credit), tone: 'light' },
        { key: 'net_payable', label: 'Net Payable', value: formatAmount(summary.net_payable), tone: 'light' },
    ];
    const columns = [
        { key: 'code', label: 'Code' },
        { key: 'name', label: 'Vendor', minWidth: 260 },
        { key: 'restaurant', label: 'Restaurant', minWidth: 170 },
        { key: 'status', label: 'Status', minWidth: 120 },
        { key: 'ap', label: 'AP Outstanding', minWidth: 140 },
        { key: 'advance', label: 'Advance Credit', minWidth: 140 },
        { key: 'return_credit', label: 'Return Credit', minWidth: 140 },
        { key: 'net', label: 'Net Payable', minWidth: 140 },
        { key: 'approval', label: 'Approval', minWidth: 120 },
        { key: 'actions', label: 'Actions', align: 'right', minWidth: 220 },
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
            subtitle="Vendor master and payable-readiness register."
            hideSubtitle
            actions={[
                <Button key="create" variant="contained" onClick={() => setOpenModal(true)}>
                    Add Vendor
                </Button>,
            ]}
        >
            <Grid container spacing={1}>
                {statCards.map((card, index) => (
                    <Grid key={card.key} item xs={12} sm={6} md={3} lg={2.4}>
                        <StatCard
                            label={card.label}
                            value={card.value}
                            tone={card.tone}
                            compact
                            minimal={index !== 0}
                            accent={index === 0}
                            white={index !== 0}
                            cardSx={index !== 0 ? { backgroundColor: '#ffffff !important' } : {}}
                        />
                    </Grid>
                ))}
            </Grid>

            <Box sx={{ pt: 1, borderTop: '1px solid rgba(214,224,237,0.92)' }}>
                <FilterToolbar
                    onReset={resetFilters}
                    onApply={() => submitFilters(localFilters)}
                    inlineActions
                    lowChrome
                    showReset={false}
                    title="Filters"
                    subtitle="Quickly narrow vendor records by search, restaurant, and status."
                >
                    <Grid
                        container
                        spacing={1}
                        sx={{
                            m: 0,
                            width: '100%',
                            alignItems: 'center',
                            pb: 0.8,
                        }}
                    >
                        <Grid item xs={12} md={5}>
                            <TextField
                                size="small"
                                label="Search vendor"
                                placeholder="Search by code, name, or email"
                                value={localFilters.search}
                                onChange={(e) => updateFilters({ search: e.target.value })}
                                fullWidth
                            />
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <TextField
                                size="small"
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
                        <Grid item xs={12} md={2}>
                            <TextField
                                size="small"
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
                        <Grid
                            item
                            xs={12}
                            md={2}
                            sx={{
                                display: 'flex',
                                justifyContent: 'flex-start',
                                alignItems: 'center',
                                pl: { md: 0.5 },
                                pr: { md: 0.5 },
                                pt: { xs: 0.25, md: 0 },
                                pb: { xs: 0.6, md: 0.35 },
                            }}
                        >
                            <Button
                                size="small"
                                variant="outlined"
                                onClick={resetFilters}
                                sx={{ minHeight: 36, px: 1.5, mb: { md: 0.2 } }}
                            >
                                Reset Filters
                            </Button>
                        </Grid>
                    </Grid>
                </FilterToolbar>
            </Box>

            <SurfaceCard contentSx={{ p: 0, '&:last-child': { pb: 0 } }}>
                <AdminDataTable
                    columns={columns}
                    rows={list}
                    pagination={vendors}
                    emptyMessage="No vendors found."
                    tableMinWidth={1480}
                    renderRow={(vendor) => (
                        <TableRow
                            key={vendor.id}
                            hover
                            sx={{
                                '& .MuiTableCell-body': {
                                    py: 1,
                                    borderBottomColor: '#edf2f7',
                                },
                            }}
                        >
                            <TableCell sx={{ fontWeight: 700, color: 'text.primary' }}>{vendor.code}</TableCell>
                            <TableCell>
                                <Typography sx={{ fontWeight: 700, color: 'text.primary', whiteSpace: 'nowrap' }}>{vendor.name}</Typography>
                            </TableCell>
                            <TableCell>
                                <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>{vendor.tenant?.name || 'Shared'}</Typography>
                            </TableCell>
                            <TableCell>
                                <Chip
                                    size="small"
                                    label={vendor.status || 'inactive'}
                                    color={vendor.status === 'active' ? 'success' : 'default'}
                                    variant={vendor.status === 'active' ? 'filled' : 'outlined'}
                                />
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>{formatAmount(vendor.ap_outstanding)}</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>{formatAmount(vendor.advance_credit)}</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>{formatAmount(vendor.purchase_return_credit)}</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#0a3d62' }}>
                                {formatAmount(Math.max(0, Number(vendor.ap_outstanding || 0) - Number(vendor.advance_credit || 0) - Number(vendor.purchase_return_credit || 0)))}
                            </TableCell>
                            <TableCell>
                                <Chip size="small" label={vendor.approval_status || 'approved'} variant="outlined" />
                            </TableCell>
                            <TableCell align="right">
                                <AdminRowActionGroup justify="flex-end">
                                    <AdminIconAction title="View Profile" onClick={() => router.get(route('procurement.vendors.show', vendor.id))}>
                                        <VisibilityOutlined fontSize="small" />
                                    </AdminIconAction>
                                    <AdminIconAction title="Vendor Bills" onClick={() => router.get(route('procurement.vendor-bills.index'), { vendor_id: vendor.id })}>
                                        <ReceiptLongOutlined fontSize="small" />
                                    </AdminIconAction>
                                    <AdminIconAction title="Vendor Payments" onClick={() => router.get(route('procurement.vendor-payments.index'), { vendor_id: vendor.id })}>
                                        <PaymentsOutlined fontSize="small" />
                                    </AdminIconAction>
                                    <AdminIconAction title="Supplier Advances" onClick={() => router.get(route('procurement.supplier-advances.index'), { vendor_id: vendor.id })}>
                                        <AccountBalanceWalletOutlined fontSize="small" />
                                    </AdminIconAction>
                                    <AdminIconAction title="Purchase Returns" onClick={() => router.get(route('procurement.purchase-returns.index'), { vendor_id: vendor.id })}>
                                        <UndoOutlined fontSize="small" />
                                    </AdminIconAction>
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
