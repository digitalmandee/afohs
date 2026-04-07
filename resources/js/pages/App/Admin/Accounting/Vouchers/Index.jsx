import React from 'react';
import { Link, router } from '@inertiajs/react';
import { Button, Chip, Grid, MenuItem, Stack, TableCell, TableRow, TextField } from '@mui/material';
import AppPage from '@/components/App/ui/AppPage';
import FilterToolbar from '@/components/App/ui/FilterToolbar';
import SurfaceCard from '@/components/App/ui/SurfaceCard';
import AdminDataTable from '@/components/App/ui/AdminDataTable';
import StatCard from '@/components/App/ui/StatCard';
import ConfirmActionDialog from '@/components/App/ui/ConfirmActionDialog';
import { formatCount } from '@/lib/formatting';

export default function Index({ vouchers, summary = {}, tenants = [], filters = {} }) {
    const rows = vouchers?.data || [];
    const [local, setLocal] = React.useState({
        search: filters.search || '',
        voucher_type: filters.voucher_type || '',
        status: filters.status || '',
        tenant_id: filters.tenant_id || '',
        from: filters.from || '',
        to: filters.to || '',
        per_page: filters.per_page || vouchers?.per_page || 25,
    });
    const [confirmSubmit, setConfirmSubmit] = React.useState({ open: false, voucherId: null });

    const apply = () => {
        router.get(route('accounting.vouchers.index'), local, { preserveState: true, preserveScroll: true, replace: true });
    };

    const reset = () => {
        const cleared = { search: '', voucher_type: '', status: '', tenant_id: '', from: '', to: '', per_page: local.per_page || 25 };
        setLocal(cleared);
        router.get(route('accounting.vouchers.index'), cleared, { preserveState: true, preserveScroll: true, replace: true });
    };

    return (
        <AppPage
            eyebrow="Accounting"
            title="Accounting Vouchers"
            subtitle="Manual voucher posting register for CPV, CRV, BPV, BRV, and JV."
            actions={[
                <Button key="create" variant="contained" component={Link} href={route('accounting.vouchers.create')}>
                    New Voucher
                </Button>,
            ]}
        >
            <Grid container spacing={2.25}>
                <Grid item xs={12} md={3}><StatCard label="Total" value={formatCount(summary.count)} accent /></Grid>
                <Grid item xs={12} md={3}><StatCard label="Draft" value={formatCount(summary.draft)} tone="light" /></Grid>
                <Grid item xs={12} md={3}><StatCard label="Submitted" value={formatCount(summary.submitted)} tone="light" /></Grid>
                <Grid item xs={12} md={3}><StatCard label="Posted" value={formatCount(summary.posted)} tone="muted" /></Grid>
            </Grid>

            <SurfaceCard title="Filters" subtitle="Filter voucher register and apply.">
                <FilterToolbar title="Filters" subtitle="Set filters and click Apply." lowChrome onApply={apply} onReset={reset}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={3}>
                            <TextField label="Search" value={local.search} onChange={(e) => setLocal((p) => ({ ...p, search: e.target.value }))} fullWidth />
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <TextField select label="Type" value={local.voucher_type} onChange={(e) => setLocal((p) => ({ ...p, voucher_type: e.target.value }))} fullWidth>
                                <MenuItem value="">All</MenuItem>
                                {['CPV', 'CRV', 'BPV', 'BRV', 'JV'].map((type) => (
                                    <MenuItem key={type} value={type}>{type}</MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <TextField select label="Status" value={local.status} onChange={(e) => setLocal((p) => ({ ...p, status: e.target.value }))} fullWidth>
                                <MenuItem value="">All</MenuItem>
                                {['draft', 'submitted', 'posted', 'cancelled', 'reversed'].map((status) => (
                                    <MenuItem key={status} value={status}>{status}</MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <TextField select label="Restaurant" value={local.tenant_id} onChange={(e) => setLocal((p) => ({ ...p, tenant_id: e.target.value }))} fullWidth>
                                <MenuItem value="">All</MenuItem>
                                {tenants.map((tenant) => (
                                    <MenuItem key={tenant.id} value={tenant.id}>{tenant.name}</MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={1.5}>
                            <TextField type="date" label="From" value={local.from} onChange={(e) => setLocal((p) => ({ ...p, from: e.target.value }))} InputLabelProps={{ shrink: true }} fullWidth />
                        </Grid>
                        <Grid item xs={12} md={1.5}>
                            <TextField type="date" label="To" value={local.to} onChange={(e) => setLocal((p) => ({ ...p, to: e.target.value }))} InputLabelProps={{ shrink: true }} fullWidth />
                        </Grid>
                    </Grid>
                </FilterToolbar>
            </SurfaceCard>

            <SurfaceCard title="Voucher Register" subtitle="Track voucher status and approval lifecycle.">
                <AdminDataTable
                    columns={[
                        { key: 'voucher_no', label: 'Voucher No', minWidth: 160 },
                        { key: 'voucher_type', label: 'Type', minWidth: 110 },
                        { key: 'voucher_date', label: 'Voucher Date', minWidth: 130 },
                        { key: 'posting_date', label: 'Posting Date', minWidth: 130 },
                        { key: 'tenant', label: 'Branch', minWidth: 160 },
                        { key: 'status', label: 'Status', minWidth: 120 },
                        { key: 'action', label: 'Action', minWidth: 420, align: 'right' },
                    ]}
                    rows={rows}
                    pagination={vouchers}
                    emptyMessage="No accounting vouchers found."
                    tableMinWidth={940}
                    renderRow={(row) => (
                        <TableRow key={row.id} hover>
                            <TableCell sx={{ fontWeight: 700 }}>{row.voucher_no}</TableCell>
                            <TableCell><Chip size="small" label={row.voucher_type} variant="outlined" /></TableCell>
                            <TableCell>{row.voucher_date}</TableCell>
                            <TableCell>{row.posting_date || '-'}</TableCell>
                            <TableCell>{row.tenant?.name || '-'}</TableCell>
                            <TableCell>
                                <Chip size="small" label={row.status} color={row.status === 'posted' ? 'success' : row.status === 'submitted' ? 'warning' : row.status === 'cancelled' ? 'error' : row.status === 'reversed' ? 'secondary' : 'default'} />
                            </TableCell>
                            <TableCell align="right">
                                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" justifyContent="flex-end">
                                    <Button size="small" variant="outlined" component={Link} href={route('accounting.vouchers.show', row.id)}>View</Button>
                                    <Button size="small" variant="outlined" href={route('accounting.vouchers.print', row.id)} target="_blank" rel="noopener noreferrer">Print</Button>
                                    <Button size="small" variant="outlined" href={route('accounting.vouchers.pdf', row.id)}>PDF</Button>
                                    {row.status === 'draft' ? (
                                        <>
                                            <Button size="small" variant="outlined" component={Link} href={route('accounting.vouchers.edit', row.id)}>Edit</Button>
                                            <Button size="small" variant="contained" onClick={() => setConfirmSubmit({ open: true, voucherId: row.id })}>Submit</Button>
                                            <Button size="small" color="warning" variant="outlined" onClick={() => router.post(route('accounting.vouchers.cancel', row.id))}>Cancel</Button>
                                        </>
                                    ) : null}
                                    {row.status === 'submitted' ? (
                                        <>
                                            <Button size="small" color="success" variant="contained" onClick={() => router.post(route('accounting.vouchers.approve', row.id))}>Approve</Button>
                                            <Button size="small" color="error" variant="outlined" onClick={() => router.post(route('accounting.vouchers.reject', row.id))}>Reject</Button>
                                            <Button size="small" color="warning" variant="outlined" onClick={() => router.post(route('accounting.vouchers.cancel', row.id))}>Cancel</Button>
                                        </>
                                    ) : null}
                                    {row.status === 'posted' ? (
                                        <Button
                                            size="small"
                                            color="error"
                                            variant="outlined"
                                            onClick={() => {
                                                if (!window.confirm('Reverse this posted voucher?')) return;
                                                router.post(route('accounting.vouchers.reverse', row.id), { reason: 'Manual reversal', reversal_date: row.posting_date || row.voucher_date });
                                            }}
                                        >
                                            Reverse
                                        </Button>
                                    ) : null}
                                </Stack>
                            </TableCell>
                        </TableRow>
                    )}
                />
            </SurfaceCard>

            <ConfirmActionDialog
                open={confirmSubmit.open}
                title="Submit voucher for approval?"
                message="This will move the voucher to submitted status and send it into the approval workflow. No general ledger posting will happen yet."
                confirmLabel="Submit for Approval"
                severity="warning"
                onClose={() => setConfirmSubmit({ open: false, voucherId: null })}
                onConfirm={() => {
                    if (!confirmSubmit.voucherId) return;
                    router.post(route('accounting.vouchers.submit', confirmSubmit.voucherId), {}, {
                        onFinish: () => setConfirmSubmit({ open: false, voucherId: null }),
                    });
                }}
            />
        </AppPage>
    );
}
