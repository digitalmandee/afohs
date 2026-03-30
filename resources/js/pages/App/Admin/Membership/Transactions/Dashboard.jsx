import React from 'react';
import { router } from '@inertiajs/react';
import { Button, Chip, Grid, Stack, TableCell, TableRow, Typography } from '@mui/material';
import AppPage from '@/components/App/ui/AppPage';
import AdminDataTable from '@/components/App/ui/AdminDataTable';
import SurfaceCard from '@/components/App/ui/SurfaceCard';
import StatCard from '@/components/App/ui/StatCard';
import { formatAmount, formatCount } from '@/lib/formatting';

const postingColor = {
    posted: 'success',
    pending: 'warning',
    failed: 'error',
    not_configured: 'default',
};

export default function TransactionDashboard({ statistics, recent_transactions, filters = {} }) {
    const rows = recent_transactions?.data || [];

    return (
        <AppPage
            eyebrow="Membership"
            title="Transaction Dashboard"
            subtitle="Membership transaction activity with accounting posting visibility, open balances, and journal linkage."
            actions={[
                <Button key="all" variant="outlined" onClick={() => router.visit(route('finance.transaction'))}>
                    Finance Transactions
                </Button>,
                <Button key="create" variant="contained" onClick={() => router.visit(route('finance.transaction.create'))}>
                    Add Transaction
                </Button>,
            ]}
        >
            <Grid container spacing={2.25}>
                <Grid item xs={12} md={2.4}><StatCard label="Transactions" value={formatCount(statistics?.total_transactions)} accent /></Grid>
                <Grid item xs={12} md={2.4}><StatCard label="Total Revenue" value={formatAmount(statistics?.total_revenue)} tone="light" /></Grid>
                <Grid item xs={12} md={2.4}><StatCard label="Membership Fees" value={formatAmount(statistics?.membership_fee_revenue)} tone="light" /></Grid>
                <Grid item xs={12} md={2.4}><StatCard label="Maintenance Fees" value={formatAmount(statistics?.maintenance_fee_revenue)} tone="light" /></Grid>
                <Grid item xs={12} md={1.2}><StatCard label="Failed" value={formatCount(statistics?.failed_postings)} tone="muted" /></Grid>
                <Grid item xs={12} md={1.2}><StatCard label="Pending" value={formatCount(statistics?.pending_postings)} tone="light" /></Grid>
            </Grid>

            <SurfaceCard title="Recent Membership Transactions" subtitle="Recent invoice activity for membership-related charges with accounting status in place.">
                <AdminDataTable
                    columns={[
                        { key: 'invoice', label: 'Invoice', minWidth: 150 },
                        { key: 'member', label: 'Member', minWidth: 220 },
                        { key: 'fee_type', label: 'Fee Type', minWidth: 150 },
                        { key: 'amount', label: 'Amount', minWidth: 120, align: 'right' },
                        { key: 'balance', label: 'Balance', minWidth: 120, align: 'right' },
                        { key: 'posting', label: 'Posting', minWidth: 130 },
                        { key: 'journal', label: 'Journal', minWidth: 120 },
                        { key: 'action', label: 'Action', minWidth: 150, align: 'right' },
                    ]}
                    rows={rows}
                    pagination={recent_transactions}
                    tableMinWidth={1280}
                    emptyMessage="No membership transactions found."
                    renderRow={(row) => (
                        <TableRow key={row.id} hover>
                            <TableCell>
                                <Stack spacing={0.35}>
                                    <Typography sx={{ fontWeight: 700 }}>{row.invoice_no}</Typography>
                                    <Typography variant="body2" color="text.secondary">{row.created_at}</Typography>
                                </Stack>
                            </TableCell>
                            <TableCell>
                                <Stack spacing={0.35}>
                                    <Typography sx={{ fontWeight: 700 }}>{row.member?.full_name || 'Member'}</Typography>
                                    <Typography variant="body2" color="text.secondary">{row.member?.membership_no || '-'}</Typography>
                                </Stack>
                            </TableCell>
                            <TableCell>{String(row.fee_type || '').replaceAll('_', ' ')}</TableCell>
                            <TableCell align="right">{formatAmount(row.total_price)}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700 }}>{formatAmount(row.balance)}</TableCell>
                            <TableCell>
                                <Chip size="small" variant="outlined" label={row.posting_status || '-'} color={postingColor[row.posting_status] || 'default'} />
                            </TableCell>
                            <TableCell>{row.journal_entry_id ? `JE-${row.journal_entry_id}` : '-'}</TableCell>
                            <TableCell align="right">
                                <Stack direction="row" spacing={1} justifyContent="flex-end">
                                    {row.document_url ? (
                                        <Button size="small" variant="outlined" onClick={() => router.visit(row.document_url)}>
                                            Open Source
                                        </Button>
                                    ) : (
                                        <Button size="small" variant="outlined" disabled>
                                            Unavailable
                                        </Button>
                                    )}
                                    {row.journal_entry_id ? (
                                        <Button size="small" variant="outlined" onClick={() => router.visit(route('accounting.journals.show', row.journal_entry_id))}>
                                            Journal
                                        </Button>
                                    ) : null}
                                </Stack>
                            </TableCell>
                        </TableRow>
                    )}
                />
            </SurfaceCard>
        </AppPage>
    );
}
