import React from 'react';
import { Link, router } from '@inertiajs/react';
import { Box, Button, Chip, Stack, TableCell, TableRow, Typography } from '@mui/material';
import AppPage from '@/components/App/ui/AppPage';
import SurfaceCard from '@/components/App/ui/SurfaceCard';
import AdminDataTable from '@/components/App/ui/AdminDataTable';
import { formatAmount } from '@/lib/formatting';

export default function Show({ voucher, approvalTrail = [], allocations = [], recentOperationalLogs = [] }) {
    const lines = voucher?.lines || [];
    const totalDebit = lines.reduce((sum, line) => sum + Number(line.debit || 0), 0);
    const totalCredit = lines.reduce((sum, line) => sum + Number(line.credit || 0), 0);
    const modeLabel = String(voucher?.entry_mode || '').toLowerCase() === 'manual' ? 'Manual' : 'Smart';

    return (
        <AppPage
            eyebrow="Accounting"
            title={`Voucher ${voucher?.voucher_no || ''}`}
            subtitle={`${voucher?.voucher_type || ''} · ${voucher?.status || ''}`}
            actions={[
                <Button key="back" variant="outlined" component={Link} href={route('accounting.vouchers.index')}>
                    Back
                </Button>,
                <Button key="print" variant="outlined" href={route('accounting.vouchers.print', voucher.id)} target="_blank" rel="noopener noreferrer">
                    Print
                </Button>,
                <Button key="pdf" variant="outlined" href={route('accounting.vouchers.pdf', voucher.id)}>
                    Download PDF
                </Button>,
            ]}
        >
            <SurfaceCard title="Voucher Summary" subtitle="Header context and workflow state.">
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.25 }}>
                    <Chip label={`Type: ${voucher?.voucher_type || '-'}`} />
                    <Chip label={`Mode: ${modeLabel}`} />
                    <Chip label={`Date: ${voucher?.voucher_date || '-'}`} />
                    <Chip label={`Posting Date: ${voucher?.posting_date || '-'}`} />
                    <Chip label={`Status: ${voucher?.status || '-'}`} color={voucher?.status === 'posted' ? 'success' : voucher?.status === 'submitted' ? 'warning' : 'default'} />
                    <Chip label={`Branch: ${voucher?.tenant?.name || '-'}`} />
                    <Chip label={`Cost Center: ${voucher?.department?.name || '-'}`} />
                    <Chip label={`Payment Account: ${voucher?.payment_account?.name || '-'}`} />
                    <Chip label={`Currency: ${voucher?.currency_code || 'PKR'}`} />
                    <Chip label={`Exchange Rate: ${voucher?.exchange_rate || '1.000000'}`} />
                    <Chip label={`Reference: ${voucher?.reference_no || '-'}`} />
                    <Chip label={`Amount: ${formatAmount(voucher?.amount || 0)}`} />
                    <Chip label={`Approval Ref: ${voucher?.approval_reference || '-'}`} />
                    <Chip label={`Reversal Voucher: ${voucher?.reversal_voucher?.voucher_no || '-'}`} />
                </Box>
                <Box sx={{ mt: 1.25 }}>
                    {voucher?.remarks || '-'}
                </Box>
            </SurfaceCard>

            <SurfaceCard title="Lines" subtitle={`Debit ${formatAmount(totalDebit)} | Credit ${formatAmount(totalCredit)}`}>
                <AdminDataTable
                    columns={[
                        { key: 'account', label: 'Account', minWidth: 260 },
                        { key: 'description', label: 'Description', minWidth: 240 },
                        { key: 'department', label: 'Cost Center', minWidth: 160 },
                        { key: 'debit', label: 'Debit', minWidth: 140, align: 'right' },
                        { key: 'credit', label: 'Credit', minWidth: 140, align: 'right' },
                    ]}
                    rows={lines}
                    pagination={null}
                    emptyMessage="No voucher lines."
                    tableMinWidth={820}
                    renderRow={(line) => (
                            <TableRow key={line.id} hover>
                                <TableCell>{line.account?.full_code} - {line.account?.name}</TableCell>
                                <TableCell>{line.description || '-'}</TableCell>
                                <TableCell>{line.department?.name || '-'}</TableCell>
                                <TableCell align="right">{formatAmount(line.debit)}</TableCell>
                                <TableCell align="right">{formatAmount(line.credit)}</TableCell>
                            </TableRow>
                        )}
                    />
            </SurfaceCard>

            <SurfaceCard title="Audit Trail" subtitle="Creation, approval, posting, and workflow history.">
                <Stack spacing={1}>
                    <Typography variant="body2">Created By: {voucher?.created_by?.name || voucher?.created_by?.email || voucher?.created_by || '-'}</Typography>
                    <Typography variant="body2">Approved By: {voucher?.approved_by?.name || voucher?.approved_by?.email || voucher?.approved_by || '-'}</Typography>
                    <Typography variant="body2">Posted By: {voucher?.posted_by?.name || voucher?.posted_by?.email || voucher?.posted_by || '-'}</Typography>
                    <Typography variant="body2">Cancelled By: {voucher?.cancelled_by?.name || voucher?.cancelled_by?.email || voucher?.cancelled_by || '-'}</Typography>
                    <Typography variant="body2">Reversed By: {voucher?.reversed_by?.name || voucher?.reversed_by?.email || voucher?.reversed_by || '-'}</Typography>
                    {approvalTrail.map((item) => (
                        <Typography key={item.id} variant="body2" color="text.secondary">
                            {item.action} · {item.remarks || '-'} · {item.created_at || ''}
                        </Typography>
                    ))}
                </Stack>
            </SurfaceCard>

            <SurfaceCard title="Invoice Allocations" subtitle="Settlement trace for invoice-linked vouchers.">
                <AdminDataTable
                    columns={[
                        { key: 'invoice', label: 'Invoice', minWidth: 220 },
                        { key: 'party', label: 'Party', minWidth: 160 },
                        { key: 'allocated', label: 'Allocated', minWidth: 140, align: 'right' },
                        { key: 'remaining', label: 'Remaining', minWidth: 140, align: 'right' },
                        { key: 'date', label: 'Allocated At', minWidth: 180 },
                    ]}
                    rows={allocations}
                    pagination={null}
                    emptyMessage="No settlement allocations for this voucher."
                    tableMinWidth={840}
                    renderRow={(row) => (
                        <TableRow key={row.id} hover>
                            <TableCell>{row.invoice_no} ({row.invoice_type})</TableCell>
                            <TableCell>{row.party_type}{row.party_id ? ` #${row.party_id}` : ''}</TableCell>
                            <TableCell align="right">{formatAmount(row.allocated_amount)}</TableCell>
                            <TableCell align="right">{formatAmount(row.remaining_outstanding)}</TableCell>
                            <TableCell>{row.allocated_at || '-'}</TableCell>
                        </TableRow>
                    )}
                />
            </SurfaceCard>

            <SurfaceCard title="Attachments" subtitle="Supporting documents linked to this voucher.">
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {(voucher?.media || []).length ? (voucher.media || []).map((file) => (
                        <Button
                            key={file.id}
                            variant="outlined"
                            size="small"
                            href={file.file_path ? `/storage/${file.file_path}` : '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            disabled={!file.file_path}
                        >
                            {file.file_name}
                        </Button>
                    )) : <Typography variant="body2" color="text.secondary">No attachments.</Typography>}
                </Stack>
            </SurfaceCard>

            <SurfaceCard title="Recent Failures & Events" subtitle="Latest operational logs for this voucher.">
                {(recentOperationalLogs || []).length ? (
                    <Stack spacing={0.75}>
                        {recentOperationalLogs.map((log) => (
                            <Box key={log.id} sx={{ border: '1px solid rgba(220,229,238,0.9)', borderRadius: 1.5, p: 1 }}>
                                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} justifyContent="space-between">
                                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                        {log.action} · {log.status} / {log.severity}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {log.created_at}
                                    </Typography>
                                </Stack>
                                <Typography variant="body2" color={log.status === 'failed' ? 'error.main' : 'text.secondary'}>
                                    {log.message}
                                </Typography>
                                {log.correlation_id ? (
                                    <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                                        Correlation: {log.correlation_id}
                                    </Typography>
                                ) : null}
                            </Box>
                        ))}
                    </Stack>
                ) : (
                    <Typography variant="body2" color="text.secondary">No recent operational logs for this voucher.</Typography>
                )}
            </SurfaceCard>

            {voucher?.status === 'draft' ? (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                    <Button variant="outlined" component={Link} href={route('accounting.vouchers.edit', voucher.id)}>
                        Edit
                    </Button>
                    <Button variant="contained" onClick={() => router.post(route('accounting.vouchers.submit', voucher.id))}>
                        Submit
                    </Button>
                </Box>
            ) : null}

            {voucher?.status === 'submitted' ? (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                    <Button color="error" variant="outlined" onClick={() => router.post(route('accounting.vouchers.reject', voucher.id))}>
                        Reject
                    </Button>
                    <Button color="warning" variant="outlined" onClick={() => router.post(route('accounting.vouchers.cancel', voucher.id))}>
                        Cancel
                    </Button>
                    <Button color="success" variant="contained" onClick={() => router.post(route('accounting.vouchers.approve', voucher.id))}>
                        Approve/Post
                    </Button>
                </Box>
            ) : null}

            {voucher?.status === 'posted' && !voucher?.reversal_voucher_id ? (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                    <Button
                        color="error"
                        variant="contained"
                        onClick={() => {
                            if (!window.confirm('Reverse this posted voucher? This will create a linked reversal voucher.')) return;
                            router.post(route('accounting.vouchers.reverse', voucher.id), { reason: 'Manual reversal', reversal_date: voucher?.posting_date || voucher?.voucher_date });
                        }}
                    >
                        Reverse Voucher
                    </Button>
                </Box>
            ) : null}
        </AppPage>
    );
}
