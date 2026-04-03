import React from 'react';
import { Link, router } from '@inertiajs/react';
import { Button, Chip, Grid, MenuItem, TableCell, TableRow, TextField } from '@mui/material';
import AppPage from '@/components/App/ui/AppPage';
import AdminDataTable from '@/components/App/ui/AdminDataTable';
import FilterToolbar from '@/components/App/ui/FilterToolbar';
import StatCard from '@/components/App/ui/StatCard';
import SurfaceCard from '@/components/App/ui/SurfaceCard';
import { formatAmount, formatCount } from '@/lib/formatting';

export default function Index({ audits, summary = {}, filters = {} }) {
    const rows = audits?.data || [];
    const [status, setStatus] = React.useState(filters.status || '');
    const perPage = filters.per_page || audits?.per_page || 25;

    const applyFilters = (nextStatus) => {
        router.get(route('inventory.audits.index'), { status: nextStatus, per_page: perPage }, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    return (
        <AppPage
            eyebrow="Warehouse"
            title="Stock Audits"
            subtitle="Run count sessions, review variance, and post approved adjustments."
            actions={[
                <Button key="create" variant="contained" component={Link} href={route('inventory.audits.create')}>
                    New Stock Audit
                </Button>,
            ]}
        >
            <Grid container spacing={2.25}>
                <Grid item xs={12} sm={6} lg={4}><StatCard compact label="Audits" value={formatCount(summary.count)} accent /></Grid>
                <Grid item xs={12} sm={6} lg={4}><StatCard compact label="Draft" value={formatCount(summary.draft)} /></Grid>
                <Grid item xs={12} sm={6} lg={4}><StatCard compact label="Posted" value={formatCount(summary.posted)} /></Grid>
            </Grid>

            <SurfaceCard title="Filter">
                <FilterToolbar onReset={() => {
                    setStatus('');
                    router.get(route('inventory.audits.index'), { per_page: perPage }, { replace: true, preserveScroll: true });
                }}>
                    <Grid container spacing={1.25}>
                        <Grid item xs={12} md={3}>
                            <TextField
                                size="small"
                                select
                                label="Status"
                                value={status}
                                onChange={(event) => {
                                    setStatus(event.target.value);
                                    applyFilters(event.target.value);
                                }}
                                fullWidth
                            >
                                <MenuItem value="">All</MenuItem>
                                <MenuItem value="draft">Draft</MenuItem>
                                <MenuItem value="submitted">Submitted</MenuItem>
                                <MenuItem value="posted">Posted</MenuItem>
                            </TextField>
                        </Grid>
                    </Grid>
                </FilterToolbar>
            </SurfaceCard>

            <SurfaceCard title="Stock Audit Register">
                <AdminDataTable
                    columns={[
                        { key: 'audit_no', label: 'Audit No' },
                        { key: 'audit_date', label: 'Audit Date' },
                        { key: 'warehouse', label: 'Warehouse' },
                        { key: 'items', label: 'Items', align: 'right' },
                        { key: 'variance', label: 'Variance Value', align: 'right' },
                        { key: 'status', label: 'Status' },
                        { key: 'actions', label: 'Actions', align: 'right' },
                    ]}
                    rows={rows}
                    pagination={audits}
                    emptyMessage="No stock audits found."
                    renderRow={(row) => {
                        const varianceValue = (row.items || []).reduce((sum, item) => sum + Number(item.variance_value || 0), 0);
                        return (
                            <TableRow key={row.id} hover>
                                <TableCell>{row.audit_no}</TableCell>
                                <TableCell>{row.audit_date}</TableCell>
                                <TableCell>{row.warehouse?.name || '-'}</TableCell>
                                <TableCell align="right">{formatCount(row.items?.length || 0)}</TableCell>
                                <TableCell align="right">{formatAmount(varianceValue)}</TableCell>
                                <TableCell><Chip size="small" label={row.status} /></TableCell>
                                <TableCell align="right">
                                    {row.status === 'draft' ? (
                                        <Button size="small" onClick={() => router.post(route('inventory.audits.submit', row.id))}>Submit</Button>
                                    ) : null}
                                    {['draft', 'submitted'].includes(row.status) ? (
                                        <Button size="small" color="success" onClick={() => router.post(route('inventory.audits.approve', row.id))}>Approve/Post</Button>
                                    ) : null}
                                </TableCell>
                            </TableRow>
                        );
                    }}
                />
            </SurfaceCard>
        </AppPage>
    );
}

