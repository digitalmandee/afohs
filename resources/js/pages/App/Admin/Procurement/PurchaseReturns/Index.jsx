import React from 'react';
import { Link, router } from '@inertiajs/react';
import { Button, Chip, Grid, MenuItem, Stack, TableCell, TableRow, TextField, Typography } from '@mui/material';
import AppPage from '@/components/App/ui/AppPage';
import AdminDataTable from '@/components/App/ui/AdminDataTable';
import AppLoadingButton from '@/components/App/ui/AppLoadingButton';
import ConfirmActionDialog from '@/components/App/ui/ConfirmActionDialog';
import FilterToolbar from '@/components/App/ui/FilterToolbar';
import StatCard from '@/components/App/ui/StatCard';
import SurfaceCard from '@/components/App/ui/SurfaceCard';
import useMutationAction from '@/hooks/useMutationAction';
import { formatAmount, formatCount } from '@/lib/formatting';

export default function Index({ returns, summary = {}, filters = {}, vendors = [] }) {
    const mutation = useMutationAction();
    const rows = returns?.data || [];
    const [search, setSearch] = React.useState(filters.search || '');
    const [status, setStatus] = React.useState(filters.status || '');
    const [vendorId, setVendorId] = React.useState(filters.vendor_id || '');
    const perPage = filters.per_page || returns?.per_page || 25;

    const applyFilters = (next = {}) => {
        router.get(route('procurement.purchase-returns.index'), {
            search: next.search ?? search,
            status: next.status ?? status,
            vendor_id: next.vendor_id ?? vendorId,
            per_page: next.per_page ?? perPage,
        }, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    return (
        <AppPage
            eyebrow="Procurement"
            title="Purchase Returns"
            subtitle="Control stock returns to vendors with clear posting status."
            actions={[
                <Button key="create" variant="contained" component={Link} href={route('procurement.purchase-returns.create')}>
                    New Purchase Return
                </Button>,
            ]}
        >
            <Grid container spacing={2.25}>
                <Grid item xs={12} sm={6} lg={3}><StatCard compact label="Returns" value={formatCount(summary.count)} accent /></Grid>
                <Grid item xs={12} sm={6} lg={3}><StatCard compact label="Total Value" value={formatAmount(summary.total)} /></Grid>
                <Grid item xs={12} sm={6} lg={3}><StatCard compact label="Posted" value={formatCount(summary.posted)} /></Grid>
                <Grid item xs={12} sm={6} lg={3}><StatCard compact label="Unapplied Credit" value={formatAmount(summary.unapplied_credit)} /></Grid>
            </Grid>

            <SurfaceCard title="Filter">
                <FilterToolbar
                    onReset={() => {
                        setSearch('');
                        setStatus('');
                        setVendorId('');
                        router.get(route('procurement.purchase-returns.index'), { per_page: perPage }, { replace: true, preserveScroll: true });
                    }}
                    onApply={() => applyFilters({ search, status, vendor_id: vendorId })}
                    lowChrome
                    title="Filters"
                    subtitle="Refine returns by search, vendor, and status."
                >
                    <Grid container spacing={1.25}>
                        <Grid item xs={12} md={4}>
                            <TextField
                                size="small"
                                label="Search"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                onBlur={() => applyFilters({ search })}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter') {
                                        event.preventDefault();
                                        applyFilters({ search });
                                    }
                                }}
                                fullWidth
                            />
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <TextField
                                size="small"
                                select
                                label="Vendor"
                                value={vendorId}
                                onChange={(event) => {
                                    setVendorId(event.target.value);
                                    applyFilters({ vendor_id: event.target.value });
                                }}
                                fullWidth
                            >
                                <MenuItem value="">All</MenuItem>
                                {vendors.map((vendor) => (
                                    <MenuItem key={vendor.id} value={vendor.id}>{vendor.name}</MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <TextField
                                size="small"
                                select
                                label="Status"
                                value={status}
                                onChange={(event) => {
                                    setStatus(event.target.value);
                                    applyFilters({ status: event.target.value });
                                }}
                                fullWidth
                            >
                                <MenuItem value="">All</MenuItem>
                                <MenuItem value="draft">Draft</MenuItem>
                                <MenuItem value="submitted">Submitted</MenuItem>
                                <MenuItem value="posted">Posted</MenuItem>
                                <MenuItem value="rejected">Rejected</MenuItem>
                            </TextField>
                        </Grid>
                    </Grid>
                </FilterToolbar>
            </SurfaceCard>

            <SurfaceCard title="Return Register">
                <AdminDataTable
                    columns={[
                        { key: 'return_no', label: 'Return No' },
                        { key: 'return_date', label: 'Date' },
                        { key: 'vendor', label: 'Vendor' },
                        { key: 'source', label: 'Source' },
                        { key: 'credit', label: 'Credit' },
                        { key: 'amount', label: 'Amount', align: 'right' },
                        { key: 'status', label: 'Status' },
                        { key: 'actions', label: 'Actions', align: 'right' },
                    ]}
                    rows={rows}
                    pagination={returns}
                    emptyMessage="No purchase returns found."
                    renderRow={(row) => (
                        <TableRow key={row.id} hover>
                            <TableCell>{row.return_no}</TableCell>
                            <TableCell>{row.return_date}</TableCell>
                            <TableCell>{row.vendor?.name || '-'}</TableCell>
                            <TableCell>
                                <Stack spacing={0.4}>
                                    <Typography variant="body2">GRN: {row.goods_receipt?.grn_no || '-'}</Typography>
                                    <Typography variant="body2">Bill: {row.vendor_bill?.bill_no || '-'}</Typography>
                                </Stack>
                            </TableCell>
                            <TableCell>
                                <Stack spacing={0.4}>
                                    <Chip
                                        size="small"
                                        label={String(row.credit_status || 'none').replaceAll('_', ' ')}
                                        color={row.credit_status === 'unapplied' ? 'warning' : row.credit_status === 'applied' ? 'success' : 'default'}
                                        variant={row.credit_status === 'none' ? 'outlined' : 'filled'}
                                    />
                                    {row.vendor_credit_amount ? (
                                        <Typography variant="caption" color="text.secondary">{formatAmount(row.vendor_credit_amount)}</Typography>
                                    ) : null}
                                </Stack>
                            </TableCell>
                            <TableCell align="right">{formatAmount(row.grand_total)}</TableCell>
                            <TableCell><Chip size="small" label={row.status} /></TableCell>
                            <TableCell align="right">
                                {row.status === 'draft' ? (
                                    <AppLoadingButton
                                        size="small"
                                        loading={mutation.isPending(`prtn-submit-${row.id}`)}
                                        loadingLabel="Submitting..."
                                        onClick={() => mutation.runRouterAction({
                                            key: `prtn-submit-${row.id}`,
                                            method: 'post',
                                            url: route('procurement.purchase-returns.submit', row.id),
                                            successMessage: 'Purchase return submitted.',
                                            errorMessage: 'Failed to submit purchase return.',
                                            confirmConfig: {
                                                title: 'Submit Purchase Return',
                                                message: 'Submit this purchase return for approval?',
                                                confirmLabel: 'Submit',
                                                severity: 'warning',
                                            },
                                        })}
                                    >
                                        Submit
                                    </AppLoadingButton>
                                ) : null}
                                {['draft', 'submitted'].includes(row.status) ? (
                                    <AppLoadingButton
                                        size="small"
                                        color="success"
                                        loading={mutation.isPending(`prtn-approve-${row.id}`)}
                                        loadingLabel="Posting..."
                                        onClick={() => mutation.runRouterAction({
                                            key: `prtn-approve-${row.id}`,
                                            method: 'post',
                                            url: route('procurement.purchase-returns.approve', row.id),
                                            successMessage: 'Purchase return approved and posted.',
                                            errorMessage: 'Failed to approve/post purchase return.',
                                            confirmConfig: {
                                                title: 'Approve/Post Purchase Return',
                                                message: 'This will post inventory and accounting reversal. Continue?',
                                                confirmLabel: 'Approve/Post',
                                                severity: 'critical',
                                            },
                                        })}
                                    >
                                        Approve/Post
                                    </AppLoadingButton>
                                ) : null}
                                {['draft', 'submitted'].includes(row.status) ? (
                                    <AppLoadingButton
                                        size="small"
                                        color="error"
                                        loading={mutation.isPending(`prtn-reject-${row.id}`)}
                                        loadingLabel="Rejecting..."
                                        onClick={() => mutation.runRouterAction({
                                            key: `prtn-reject-${row.id}`,
                                            method: 'post',
                                            url: route('procurement.purchase-returns.reject', row.id),
                                            successMessage: 'Purchase return rejected.',
                                            errorMessage: 'Failed to reject purchase return.',
                                            confirmConfig: {
                                                title: 'Reject Purchase Return',
                                                message: 'Reject this purchase return?',
                                                confirmLabel: 'Reject',
                                                severity: 'danger',
                                            },
                                        })}
                                    >
                                        Reject
                                    </AppLoadingButton>
                                ) : null}
                            </TableCell>
                        </TableRow>
                    )}
                />
            </SurfaceCard>
            <ConfirmActionDialog {...mutation.confirmDialogProps} />
        </AppPage>
    );
}
