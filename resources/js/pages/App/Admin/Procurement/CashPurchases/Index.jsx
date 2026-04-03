import React from 'react';
import { Link, router } from '@inertiajs/react';
import { Button, Chip, Grid, MenuItem, TableCell, TableRow, TextField } from '@mui/material';
import AppPage from '@/components/App/ui/AppPage';
import AdminDataTable from '@/components/App/ui/AdminDataTable';
import FilterToolbar from '@/components/App/ui/FilterToolbar';
import StatCard from '@/components/App/ui/StatCard';
import SurfaceCard from '@/components/App/ui/SurfaceCard';
import { formatAmount, formatCount } from '@/lib/formatting';

export default function Index({ cashPurchases, summary = {}, filters = {} }) {
    const rows = cashPurchases?.data || [];
    const [search, setSearch] = React.useState(filters.search || '');
    const [status, setStatus] = React.useState(filters.status || '');
    const perPage = filters.per_page || cashPurchases?.per_page || 25;

    const applyFilters = (next = {}) => {
        router.get(route('procurement.cash-purchases.index'), {
            search: next.search ?? search,
            status: next.status ?? status,
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
            title="Cash Purchases"
            subtitle="Track direct purchases with immediate stock receipt and payment context."
            actions={[
                <Button key="create" variant="contained" component={Link} href={route('procurement.cash-purchases.create')}>
                    New Cash Purchase
                </Button>,
            ]}
        >
            <Grid container spacing={2.25}>
                <Grid item xs={12} sm={6} lg={3}><StatCard compact label="Purchases" value={formatCount(summary.count)} accent /></Grid>
                <Grid item xs={12} sm={6} lg={3}><StatCard compact label="Total Value" value={formatAmount(summary.total_value)} /></Grid>
                <Grid item xs={12} sm={6} lg={3}><StatCard compact label="Draft" value={formatCount(summary.draft)} /></Grid>
                <Grid item xs={12} sm={6} lg={3}><StatCard compact label="Posted" value={formatCount(summary.posted)} /></Grid>
            </Grid>

            <SurfaceCard title="Filter">
                <FilterToolbar onReset={() => {
                    setSearch('');
                    setStatus('');
                    router.get(route('procurement.cash-purchases.index'), { per_page: perPage }, { replace: true, preserveScroll: true });
                }}>
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

            <SurfaceCard title="Cash Purchase Register">
                <AdminDataTable
                    columns={[
                        { key: 'cp_no', label: 'CP No' },
                        { key: 'purchase_date', label: 'Date' },
                        { key: 'vendor', label: 'Vendor' },
                        { key: 'warehouse', label: 'Warehouse' },
                        { key: 'amount', label: 'Amount', align: 'right' },
                        { key: 'status', label: 'Status' },
                        { key: 'actions', label: 'Actions', align: 'right' },
                    ]}
                    rows={rows}
                    pagination={cashPurchases}
                    emptyMessage="No cash purchases found."
                    renderRow={(row) => (
                        <TableRow key={row.id} hover>
                            <TableCell>{row.cp_no}</TableCell>
                            <TableCell>{row.purchase_date}</TableCell>
                            <TableCell>{row.vendor?.name || '-'}</TableCell>
                            <TableCell>{row.warehouse?.name || '-'}</TableCell>
                            <TableCell align="right">{formatAmount(row.grand_total)}</TableCell>
                            <TableCell><Chip size="small" label={row.status} /></TableCell>
                            <TableCell align="right">
                                {row.status === 'draft' ? (
                                    <Button size="small" onClick={() => router.post(route('procurement.cash-purchases.submit', row.id))}>Submit</Button>
                                ) : null}
                                {['draft', 'submitted'].includes(row.status) ? (
                                    <Button size="small" color="success" onClick={() => router.post(route('procurement.cash-purchases.approve', row.id))}>Approve/Post</Button>
                                ) : null}
                                {['draft', 'submitted'].includes(row.status) ? (
                                    <Button size="small" color="error" onClick={() => router.post(route('procurement.cash-purchases.reject', row.id))}>Reject</Button>
                                ) : null}
                            </TableCell>
                        </TableRow>
                    )}
                />
            </SurfaceCard>
        </AppPage>
    );
}

