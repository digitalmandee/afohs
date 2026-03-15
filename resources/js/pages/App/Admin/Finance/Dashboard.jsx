import React from 'react';
import { router } from '@inertiajs/react';
import { Button, Chip, Grid, Stack, TableCell, TableRow, Typography } from '@mui/material';
import AppPage from '@/components/App/ui/AppPage';
import AdminDataTable from '@/components/App/ui/AdminDataTable';
import SurfaceCard from '@/components/App/ui/SurfaceCard';
import StatCard from '@/components/App/ui/StatCard';

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

export default function Dashboard({ statistics, recent_transactions, transaction_filters = {} }) {
    const rows = recent_transactions?.data || [];

    const columns = [
        { key: 'invoice', label: 'Invoice', minWidth: 150 },
        { key: 'member', label: 'Party', minWidth: 210 },
        { key: 'type', label: 'Type', minWidth: 150 },
        { key: 'restaurant', label: 'Restaurant', minWidth: 180 },
        { key: 'amount', label: 'Amount', minWidth: 120, align: 'right' },
        { key: 'balance', label: 'Balance', minWidth: 120, align: 'right' },
        { key: 'invoice_status', label: 'Invoice Status', minWidth: 130 },
        { key: 'posting_status', label: 'Posting', minWidth: 130 },
        { key: 'journal', label: 'Journal', minWidth: 120 },
        { key: 'action', label: 'Action', minWidth: 160, align: 'right' },
    ];

    return (
        <AppPage
            eyebrow="Finance"
            title="Finance Dashboard"
            subtitle="Legacy finance remains available as an operator workspace, now aligned with accounting status, restaurant context, and journal linkage."
            actions={[
                <Button key="manage" variant="outlined" onClick={() => router.visit(route('finance.transaction'))}>
                    View Transactions
                </Button>,
                <Button key="create" variant="contained" onClick={() => router.visit(route('finance.transaction.create'))}>
                    Add Transaction
                </Button>,
            ]}
        >
            <Grid container spacing={2.25}>
                <Grid item xs={12} md={3}><StatCard label="Invoices" value={statistics?.total_transactions || 0} accent /></Grid>
                <Grid item xs={12} md={3}><StatCard label="Total Revenue" value={Number(statistics?.total_revenue || 0).toFixed(2)} tone="light" /></Grid>
                <Grid item xs={12} md={3}><StatCard label="Open Invoices" value={statistics?.open_invoices || 0} tone="light" /></Grid>
                <Grid item xs={12} md={3}><StatCard label="Paid Invoices" value={statistics?.paid_invoices || 0} tone="muted" /></Grid>
                <Grid item xs={12} md={3}><StatCard label="Membership Revenue" value={Number(statistics?.membership_fee_revenue || 0).toFixed(2)} tone="light" /></Grid>
                <Grid item xs={12} md={3}><StatCard label="Maintenance Revenue" value={Number(statistics?.maintenance_fee_revenue || 0).toFixed(2)} tone="light" /></Grid>
                <Grid item xs={12} md={3}><StatCard label="Subscription Revenue" value={Number(statistics?.subscription_fee_revenue || 0).toFixed(2)} tone="light" /></Grid>
                <Grid item xs={12} md={3}><StatCard label="Posting Failures" value={statistics?.failed_postings || 0} tone="muted" /></Grid>
            </Grid>

            <SurfaceCard title="Revenue Mix" subtitle="Keep the legacy finance overview while making the breakdown easier to compare against the new accounting module.">
                <Grid container spacing={2}>
                    <Grid item xs={12} md={3}><StatCard label="Room Revenue" value={Number(statistics?.room_revenue || 0).toFixed(2)} tone="light" /></Grid>
                    <Grid item xs={12} md={3}><StatCard label="Event Revenue" value={Number(statistics?.event_revenue || 0).toFixed(2)} tone="light" /></Grid>
                    <Grid item xs={12} md={3}><StatCard label="Food Revenue" value={Number(statistics?.food_revenue || 0).toFixed(2)} tone="light" /></Grid>
                    <Grid item xs={12} md={3}><StatCard label="Booking Revenue" value={Number(statistics?.total_booking_revenue || 0).toFixed(2)} tone="light" /></Grid>
                </Grid>
            </SurfaceCard>

            <SurfaceCard title="Recent Transactions" subtitle="Latest legacy finance invoices with accounting-backed posting and journal visibility.">
                <AdminDataTable
                    columns={columns}
                    rows={rows}
                    pagination={recent_transactions}
                    tableMinWidth={1440}
                    emptyMessage="No finance transactions found."
                    renderRow={(row) => {
                        const corporate = row.corporateMember || row.corporate_member;

                        return (
                        <TableRow key={row.id} hover>
                            <TableCell>
                                <Stack spacing={0.35}>
                                    <Typography sx={{ fontWeight: 700, color: 'text.primary' }}>{row.invoice_no || `INV-${row.id}`}</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {row.issue_date || row.created_at}
                                    </Typography>
                                </Stack>
                            </TableCell>
                            <TableCell>
                                <Stack spacing={0.35}>
                                    <Typography sx={{ fontWeight: 700, color: 'text.primary' }}>
                                        {row.member?.full_name || corporate?.full_name || row.customer?.name || 'Guest'}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {row.member?.membership_no || corporate?.membership_no || row.customer?.email || '-'}
                                    </Typography>
                                </Stack>
                            </TableCell>
                            <TableCell>{row.fee_type_formatted || '-'}</TableCell>
                            <TableCell>{row.restaurant_name || '-'}</TableCell>
                            <TableCell align="right">{Number(row.total_price || 0).toFixed(2)}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700 }}>{Number(row.balance || 0).toFixed(2)}</TableCell>
                            <TableCell>
                                <Chip size="small" label={row.status || '-'} color={statusColor[row.status] || 'default'} />
                            </TableCell>
                            <TableCell>
                                <Chip size="small" variant="outlined" label={row.posting_status || '-'} color={statusColor[row.posting_status] || 'default'} />
                            </TableCell>
                            <TableCell>{row.journal_entry_id ? `JE-${row.journal_entry_id}` : '-'}</TableCell>
                            <TableCell align="right">
                                <Stack direction="row" spacing={1} justifyContent="flex-end">
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
                    )}}
                />
            </SurfaceCard>
        </AppPage>
    );
}
