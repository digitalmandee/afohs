import React from 'react';
import { router } from '@inertiajs/react';
import { Alert, Button, Chip, Grid, Stack, TableCell, TableRow, Typography } from '@mui/material';
import AppPage from '@/components/App/ui/AppPage';
import AdminDataTable from '@/components/App/ui/AdminDataTable';
import SurfaceCard from '@/components/App/ui/SurfaceCard';
import StatCard from '@/components/App/ui/StatCard';
import { formatAmount, formatCount } from '@/lib/formatting';

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

export default function Dashboard({ statistics, recent_transactions, transaction_filters = {}, error = null }) {
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
            {error ? <Alert severity="warning" variant="outlined">{error}</Alert> : null}

            <Grid container spacing={1.5}>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard label="Invoices" value={formatCount(statistics?.total_transactions)} accent compact />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard label="Total Revenue" value={formatAmount(statistics?.total_revenue)} tone="light" compact />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard label="Open Invoices" value={formatCount(statistics?.open_invoices)} tone="light" compact />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        label="Integration Coverage"
                        value={`${Number(statistics?.integration_coverage_percent || 0).toFixed(1)}%`}
                        caption={`${formatCount(statistics?.linked_invoices)} linked`}
                        tone="muted"
                        compact
                    />
                </Grid>
            </Grid>

            <SurfaceCard
                title="Revenue Mix"
                subtitle="Keep the legacy finance overview while making the breakdown easier to compare against the new accounting module."
                cardSx={{ borderRadius: '18px' }}
                contentSx={{ p: { xs: 1.5, md: 2 }, '&:last-child': { pb: { xs: 1.5, md: 2 } } }}
            >
                <Grid container spacing={1.5}>
                    <Grid item xs={12} md={4}>
                        <StatCard label="Membership Revenue" value={formatAmount(statistics?.membership_fee_revenue)} tone="light" compact />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <StatCard label="Maintenance Revenue" value={formatAmount(statistics?.maintenance_fee_revenue)} tone="light" compact />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <StatCard label="Subscription Revenue" value={formatAmount(statistics?.subscription_fee_revenue)} tone="muted" compact />
                    </Grid>
                    <Grid item xs={12}>
                        <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
                            <Chip size="small" variant="outlined" label={`Paid ${formatCount(statistics?.paid_invoices)}`} />
                            <Chip size="small" variant="outlined" label={`Open ${formatCount(statistics?.open_invoices)}`} />
                            <Chip size="small" variant="outlined" label={`Failed ${formatCount(statistics?.failed_postings)}`} />
                            <Chip size="small" variant="outlined" label={`Pending ${formatCount(statistics?.pending_postings)}`} />
                            <Chip size="small" variant="outlined" label={`Unlinked ${formatCount(statistics?.unlinked_invoices)}`} />
                            <Chip size="small" variant="outlined" label={`Booking ${formatAmount(statistics?.total_booking_revenue)}`} />
                            <Chip size="small" variant="outlined" label={`Food ${formatAmount(statistics?.food_revenue)}`} />
                        </Stack>
                    </Grid>
                </Grid>
            </SurfaceCard>

            <SurfaceCard
                title="Recent Transactions"
                subtitle="Latest legacy finance invoices with accounting-backed posting and journal visibility."
                cardSx={{ borderRadius: '18px' }}
                contentSx={{ p: { xs: 1.5, md: 2 }, '&:last-child': { pb: { xs: 1.5, md: 2 } } }}
            >
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
                            <TableCell align="right">{formatAmount(row.total_price)}</TableCell>
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
