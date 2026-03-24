import React from 'react';
import { router } from '@inertiajs/react';
import {
    Box,
    Button,
    Checkbox,
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
import axios from 'axios';
import debounce from 'lodash.debounce';
import { enqueueSnackbar } from 'notistack';
import AppPage from '@/components/App/ui/AppPage';
import AdminDataTable from '@/components/App/ui/AdminDataTable';
import FilterToolbar from '@/components/App/ui/FilterToolbar';
import StatCard from '@/components/App/ui/StatCard';
import SurfaceCard from '@/components/App/ui/SurfaceCard';
import PaymentDialog from '@/components/App/Transactions/PaymentDialog';

const statusColor = {
    paid: 'success',
    unpaid: 'warning',
    partial: 'warning',
    overdue: 'error',
    cancelled: 'default',
    failed: 'error',
    pending: 'warning',
    posted: 'success',
    not_configured: 'default',
};

const amountFormatter = new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

const countFormatter = new Intl.NumberFormat(undefined);

const formatAmount = (value) => amountFormatter.format(Number(value || 0));
const formatCount = (value) => countFormatter.format(Number(value || 0));

const defaultFilters = (filters, transactions) => ({
    search: filters?.search || '',
    invoice_no: filters?.invoice_no || '',
    member_name: filters?.member_name || '',
    membership_no: filters?.membership_no || '',
    status: filters?.status || 'all',
    type: filters?.type || 'all',
    customer_type: filters?.customer_type || 'all',
    created_by: filters?.created_by || 'all',
    start_date: filters?.start_date || '',
    end_date: filters?.end_date || '',
    per_page: filters?.per_page || transactions?.per_page || 25,
    page: 1,
});

export default function Transaction({ transactions, filters, users = [], transactionTypes = {}, summary = {}, tenants = [] }) {
    const rows = transactions?.data || [];
    const [localFilters, setLocalFilters] = React.useState(() => defaultFilters(filters, transactions));
    const filtersRef = React.useRef(localFilters);
    const [selectedIds, setSelectedIds] = React.useState([]);
    const [paymentDialog, setPaymentDialog] = React.useState({ open: false, transaction: null });
    const [submittingPayment, setSubmittingPayment] = React.useState(false);
    const [bulkDialog, setBulkDialog] = React.useState({ open: false, type: 'discount', amount: '', is_percent: false });

    const submitFilters = React.useCallback((nextFilters) => {
        const payload = {};
        Object.entries(nextFilters).forEach(([key, value]) => {
            if (['all', '', null, undefined].includes(value)) return;
            if (key === 'page' && Number(value) <= 1) return;
            payload[key] = value;
        });
        payload.per_page = nextFilters.per_page || 25;

        router.get(route('finance.transaction'), payload, {
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
        const next = defaultFilters({}, { per_page: filtersRef.current.per_page });
        debouncedSubmit.cancel();
        filtersRef.current = next;
        setLocalFilters(next);
        submitFilters(next);
    }, [debouncedSubmit, submitFilters]);

    const handleSelectAll = (checked) => {
        setSelectedIds(checked ? rows.map((row) => row.id) : []);
    };

    const toggleSelect = (id) => {
        setSelectedIds((current) => (current.includes(id) ? current.filter((value) => value !== id) : [...current, id]));
    };

    const handleConfirmPayment = async (paymentData) => {
        if (!paymentDialog.transaction) return;

        setSubmittingPayment(true);
        const formData = new FormData();
        formData.append('status', 'paid');
        formData.append('payment_method', paymentData.payment_method);
        if (paymentData.payment_account_id) {
            formData.append('payment_account_id', paymentData.payment_account_id);
        }
        if (paymentData.credit_card_type) {
            formData.append('credit_card_type', paymentData.credit_card_type);
        }
        if (paymentData.receipt_file) {
            formData.append('receipt_file', paymentData.receipt_file);
        }
        if (paymentData.payment_mode_details) {
            formData.append('payment_mode_details', paymentData.payment_mode_details);
        }

        try {
            const response = await axios.post(route('finance.transaction.update-status', paymentDialog.transaction.id), formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (response.data.success) {
                enqueueSnackbar('Invoice marked as paid successfully.', { variant: 'success' });
                setPaymentDialog({ open: false, transaction: null });
                router.reload({ only: ['transactions', 'summary'] });
            }
        } catch (error) {
            enqueueSnackbar(error.response?.data?.message || 'Failed to update payment.', { variant: 'error' });
        } finally {
            setSubmittingPayment(false);
        }
    };

    const submitBulkAction = async () => {
        if (!bulkDialog.amount || selectedIds.length === 0) {
            enqueueSnackbar('Select records and enter an amount first.', { variant: 'error' });
            return;
        }

        const endpoint = bulkDialog.type === 'discount'
            ? route('finance.transaction.bulk-discount')
            : route('finance.transaction.bulk-overdue');

        try {
            const response = await axios.post(endpoint, {
                ids: selectedIds,
                amount: bulkDialog.amount,
                is_percent: bulkDialog.is_percent,
            });
            enqueueSnackbar(response.data.message || 'Bulk action completed.', { variant: 'success' });
            setBulkDialog({ open: false, type: 'discount', amount: '', is_percent: false });
            setSelectedIds([]);
            router.reload({ only: ['transactions', 'summary'] });
        } catch (error) {
            enqueueSnackbar(error.response?.data?.message || 'Bulk action failed.', { variant: 'error' });
        }
    };

    const columns = [
        { key: 'select', label: '', minWidth: 52 },
        { key: 'invoice', label: 'Invoice', minWidth: 150 },
        { key: 'party', label: 'Party', minWidth: 220 },
        { key: 'type', label: 'Type', minWidth: 170 },
        { key: 'restaurant', label: 'Restaurant', minWidth: 180 },
        { key: 'amount', label: 'Amount', minWidth: 120, align: 'right' },
        { key: 'paid', label: 'Paid', minWidth: 120, align: 'right' },
        { key: 'balance', label: 'Balance', minWidth: 120, align: 'right' },
        { key: 'invoice_status', label: 'Invoice Status', minWidth: 130 },
        { key: 'posting_status', label: 'Posting', minWidth: 130 },
        { key: 'journal', label: 'Journal', minWidth: 110 },
        { key: 'action', label: 'Action', minWidth: 170, align: 'right' },
    ];

    return (
        <>
            <AppPage
                eyebrow="Finance"
                title="Transactions"
                subtitle="Legacy finance transactions are still available here, now aligned with accounting-backed posting state, journal linkage, and restaurant context."
                actions={[
                    <Button key="create" variant="contained" onClick={() => router.visit(route('finance.transaction.create'))}>
                        Add Transaction
                    </Button>,
                ]}
            >
                <Grid container spacing={1.5}>
                    <Grid item xs={12} sm={6} md={3}><StatCard label="Transactions" value={formatCount(summary?.count)} accent compact /></Grid>
                    <Grid item xs={12} sm={6} md={3}><StatCard label="Total Amount" value={formatAmount(summary?.total_amount)} tone="light" compact /></Grid>
                    <Grid item xs={12} sm={6} md={3}><StatCard label="Open Balance" value={formatAmount(summary?.balance)} tone="muted" compact /></Grid>
                    <Grid item xs={12} sm={6} md={3}><StatCard label="Posting Exceptions" value={formatCount((summary?.failed_postings || 0) + (summary?.pending_postings || 0))} tone="light" compact /></Grid>
                    <Grid item xs={12} sm={6} md={3}><StatCard label="Paid Amount" value={formatAmount(summary?.paid_amount)} tone="light" compact /></Grid>
                    <Grid item xs={12} sm={6} md={3}><StatCard label="Failed Postings" value={formatCount(summary?.failed_postings)} tone="muted" compact /></Grid>
                    <Grid item xs={12} sm={6} md={3}><StatCard label="Pending Postings" value={formatCount(summary?.pending_postings)} tone="light" compact /></Grid>
                </Grid>

                <SurfaceCard
                    title="Live Filters"
                    subtitle="Refine finance transactions by invoice, party, type, status, creator, and date without using the older manual search workflow."
                    cardSx={{ borderRadius: '18px' }}
                    contentSx={{ p: { xs: 1.5, md: 2 }, '&:last-child': { pb: { xs: 1.5, md: 2 } } }}
                >
                    <FilterToolbar
                        compact
                        onReset={resetFilters}
                        actions={(
                            <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
                                <Button
                                    size="small"
                                    variant="outlined"
                                    disabled={selectedIds.length === 0}
                                    onClick={() => setBulkDialog({ open: true, type: 'discount', amount: '', is_percent: false })}
                                >
                                    Bulk Discount
                                </Button>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    disabled={selectedIds.length === 0}
                                    onClick={() => setBulkDialog({ open: true, type: 'overdue', amount: '', is_percent: false })}
                                >
                                    Bulk Overdue
                                </Button>
                            </Stack>
                        )}
                    >
                        <Grid container spacing={1.25}>
                            <Grid item xs={12} md={4}>
                                <TextField size="small" label="Search invoice or payment method" value={localFilters.search} onChange={(event) => updateFilters({ search: event.target.value })} fullWidth />
                            </Grid>
                            <Grid item xs={12} md={2}>
                                <TextField size="small" label="Invoice #" value={localFilters.invoice_no} onChange={(event) => updateFilters({ invoice_no: event.target.value })} fullWidth />
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <TextField size="small" label="Member / customer" value={localFilters.member_name} onChange={(event) => updateFilters({ member_name: event.target.value })} fullWidth />
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <TextField size="small" label="Membership / customer #" value={localFilters.membership_no} onChange={(event) => updateFilters({ membership_no: event.target.value })} fullWidth />
                            </Grid>
                            <Grid item xs={12} md={2}>
                                <TextField size="small" select label="Status" value={localFilters.status} onChange={(event) => updateFilters({ status: event.target.value }, { immediate: true })} fullWidth>
                                    <MenuItem value="all">All</MenuItem>
                                    <MenuItem value="paid">Paid</MenuItem>
                                    <MenuItem value="unpaid">Unpaid</MenuItem>
                                    <MenuItem value="partial">Partial</MenuItem>
                                    <MenuItem value="overdue">Overdue</MenuItem>
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={2.5}>
                                <TextField size="small" select label="Customer Type" value={localFilters.customer_type} onChange={(event) => updateFilters({ customer_type: event.target.value }, { immediate: true })} fullWidth>
                                    <MenuItem value="all">All</MenuItem>
                                    <MenuItem value="member">Primary Member</MenuItem>
                                    <MenuItem value="corporate">Corporate</MenuItem>
                                    <MenuItem value="guest">Guest</MenuItem>
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <TextField size="small" select label="Transaction Type" value={localFilters.type} onChange={(event) => updateFilters({ type: event.target.value }, { immediate: true })} fullWidth>
                                    <MenuItem value="all">All types</MenuItem>
                                    {Object.entries(transactionTypes).map(([id, label]) => (
                                        <MenuItem key={id} value={`type_${id}`}>{label}</MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={2.5}>
                                <TextField size="small" select label="Created By" value={localFilters.created_by} onChange={(event) => updateFilters({ created_by: event.target.value }, { immediate: true })} fullWidth>
                                    <MenuItem value="all">All users</MenuItem>
                                    {users.map((user) => (
                                        <MenuItem key={user.id} value={user.id}>{user.name}</MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={2}>
                                <TextField size="small" label="From" type="date" value={localFilters.start_date} onChange={(event) => updateFilters({ start_date: event.target.value }, { immediate: true })} InputLabelProps={{ shrink: true }} fullWidth />
                            </Grid>
                            <Grid item xs={12} md={2}>
                                <TextField size="small" label="To" type="date" value={localFilters.end_date} onChange={(event) => updateFilters({ end_date: event.target.value }, { immediate: true })} InputLabelProps={{ shrink: true }} fullWidth />
                            </Grid>
                        </Grid>
                    </FilterToolbar>
                </SurfaceCard>

                <SurfaceCard
                    title="Transaction Register"
                    subtitle="Operational finance table with selection, payment action, posting state, and accounting journal linkage."
                    cardSx={{ borderRadius: '18px' }}
                    contentSx={{ p: { xs: 1.5, md: 2 }, '&:last-child': { pb: { xs: 1.5, md: 2 } } }}
                >
                    <AdminDataTable
                        columns={columns}
                        rows={rows}
                        pagination={transactions}
                        tableMinWidth={1620}
                        emptyMessage="No finance transactions found."
                        renderRow={(row) => {
                            const checked = selectedIds.includes(row.id);
                            const corporate = row.corporateMember || row.corporate_member;
                            return (
                                <TableRow key={row.id} hover>
                                    <TableCell padding="checkbox">
                                        <Checkbox checked={checked} onChange={() => toggleSelect(row.id)} />
                                    </TableCell>
                                    <TableCell>
                                        <Stack spacing={0.35}>
                                            <Typography sx={{ fontWeight: 700, color: 'text.primary' }}>{row.invoice_no}</Typography>
                                            <Typography variant="body2" color="text.secondary">{row.issue_date || row.created_at}</Typography>
                                        </Stack>
                                    </TableCell>
                                    <TableCell>
                                        <Stack spacing={0.35}>
                                            <Typography sx={{ fontWeight: 700, color: 'text.primary' }}>
                                                {row.member?.full_name || corporate?.full_name || row.customer?.name || 'Guest'}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {row.member?.membership_no || corporate?.membership_no || row.customer?.customer_no || '-'}
                                            </Typography>
                                        </Stack>
                                    </TableCell>
                                    <TableCell>{row.fee_type_formatted || '-'}</TableCell>
                                    <TableCell>{row.restaurant_name || '-'}</TableCell>
                                    <TableCell align="right">{formatAmount(row.total_price)}</TableCell>
                                    <TableCell align="right">{formatAmount(row.paid_amount)}</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 700 }}>{formatAmount(row.balance)}</TableCell>
                                    <TableCell>
                                        <Chip size="small" label={row.status || '-'} color={statusColor[row.status] || 'default'} />
                                    </TableCell>
                                    <TableCell>
                                        <Chip size="small" variant="outlined" label={row.posting_status || '-'} color={statusColor[row.posting_status] || 'default'} />
                                    </TableCell>
                                    <TableCell>{row.journal_entry_id ? `JE-${row.journal_entry_id}` : '-'}</TableCell>
                                    <TableCell align="right">
                                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                                            {Number(row.balance || 0) > 0 ? (
                                                <Button size="small" variant="contained" onClick={() => setPaymentDialog({ open: true, transaction: row })}>
                                                    Receive
                                                </Button>
                                            ) : null}
                                            {row.document_url ? (
                                                <Button size="small" variant="outlined" onClick={() => router.visit(row.document_url)}>
                                                    Open
                                                </Button>
                                            ) : null}
                                            {row.journal_entry_id ? (
                                                <Button size="small" variant="outlined" onClick={() => router.visit(route('accounting.journals.show', row.journal_entry_id))}>
                                                    Journal
                                                </Button>
                                            ) : null}
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            );
                        }}
                        headRowSx={{
                            '& .MuiTableCell-head': {
                                bgcolor: '#0a3d62',
                                color: '#f8fafc',
                                borderBottom: 'none',
                                py: 1.35,
                                fontSize: '0.74rem',
                                fontWeight: 700,
                                letterSpacing: '0.06em',
                                textTransform: 'uppercase',
                                whiteSpace: 'nowrap',
                            },
                        }}
                    />
                    <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mt: 1.5 }}>
                        <Checkbox
                            checked={rows.length > 0 && selectedIds.length === rows.length}
                            indeterminate={selectedIds.length > 0 && selectedIds.length < rows.length}
                            onChange={(event) => handleSelectAll(event.target.checked)}
                        />
                        <Typography color="text.secondary">
                            {selectedIds.length} selected on this page
                        </Typography>
                    </Stack>
                </SurfaceCard>
            </AppPage>

            <PaymentDialog
                open={paymentDialog.open}
                onClose={() => setPaymentDialog({ open: false, transaction: null })}
                transaction={paymentDialog.transaction}
                onConfirm={handleConfirmPayment}
                submitting={submittingPayment}
            />

            <Dialog open={bulkDialog.open} onClose={() => setBulkDialog({ open: false, type: 'discount', amount: '', is_percent: false })} maxWidth="xs" fullWidth>
                <DialogTitle>{bulkDialog.type === 'discount' ? 'Bulk Discount' : 'Bulk Overdue'}</DialogTitle>
                <DialogContent dividers>
                    <Stack spacing={2} sx={{ mt: 0.5 }}>
                        <Typography color="text.secondary">
                            Apply this to {selectedIds.length} selected invoices.
                        </Typography>
                        <TextField
                            label="Amount"
                            type="number"
                            value={bulkDialog.amount}
                            onChange={(event) => setBulkDialog((current) => ({ ...current, amount: event.target.value }))}
                            fullWidth
                        />
                        <TextField
                            select
                            label="Mode"
                            value={bulkDialog.is_percent ? 'percent' : 'fixed'}
                            onChange={(event) => setBulkDialog((current) => ({ ...current, is_percent: event.target.value === 'percent' }))}
                            fullWidth
                        >
                            <MenuItem value="fixed">Fixed amount</MenuItem>
                            <MenuItem value="percent">Percentage</MenuItem>
                        </TextField>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setBulkDialog({ open: false, type: 'discount', amount: '', is_percent: false })}>Cancel</Button>
                    <Button variant="contained" onClick={submitBulkAction}>Apply</Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
