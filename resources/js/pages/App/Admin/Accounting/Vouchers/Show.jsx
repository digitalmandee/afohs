import React from 'react';
import { Link, router } from '@inertiajs/react';
import { Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TableCell, TableRow, TextField, Typography } from '@mui/material';
import AppPage from '@/components/App/ui/AppPage';
import SurfaceCard from '@/components/App/ui/SurfaceCard';
import AdminDataTable from '@/components/App/ui/AdminDataTable';
import ConfirmActionDialog from '@/components/App/ui/ConfirmActionDialog';
import useMutationAction from '@/hooks/useMutationAction';
import { formatAmount } from '@/lib/formatting';

export default function Show({ voucher, approvalTrail = [], allocations = [], recentOperationalLogs = [], auditEvents = [] }) {
    const lines = Array.isArray(voucher?.lines) ? voucher.lines : [];
    const allocationRows = Array.isArray(allocations) ? allocations : [];
    const operationalLogs = Array.isArray(recentOperationalLogs) ? recentOperationalLogs : [];
    const auditTrail = Array.isArray(auditEvents) ? auditEvents : [];
    const mediaFiles = Array.isArray(voucher?.media) ? voucher.media : [];
    const tenant = voucher?.tenant || null;
    const department = voucher?.department || null;
    const paymentAccount = voucher?.paymentAccount || voucher?.payment_account || null;
    const reversalVoucher = voucher?.reversalVoucher || voucher?.reversal_voucher || null;
    const totalDebit = lines.reduce((sum, line) => sum + Number(line?.debit || 0), 0);
    const totalCredit = lines.reduce((sum, line) => sum + Number(line?.credit || 0), 0);
    const modeLabel = String(voucher?.entry_mode || '').toLowerCase() === 'manual' ? 'Manual' : 'Smart';
    const [reverseOpen, setReverseOpen] = React.useState(false);
    const [reverseReason, setReverseReason] = React.useState('');
    const [reverseDate, setReverseDate] = React.useState(voucher?.posting_date || voucher?.voucher_date || '');
    const mutation = useMutationAction();
    const reversalEvent = operationalLogs.find((log) => log?.action === 'accounting.voucher.reversed');
    const reversalReason = reversalEvent?.context_json?.reason || '-';
    const paymentForLabel = ['CPV', 'BPV'].includes(voucher?.voucher_type) ? (voucher?.party_type === 'vendor' ? 'Vendor Payment' : 'Expense') : '-';
    const vendorLabel = voucher?.party_type === 'vendor' ? `Vendor #${voucher?.party_id || '-'}` : '-';

    const submitReversal = () => {
        if (!reverseReason.trim()) return;
        router.post(route('accounting.vouchers.reverse', voucher.id), {
            reason: reverseReason.trim(),
            reversal_date: reverseDate || voucher?.posting_date || voucher?.voucher_date,
        }, {
            onSuccess: () => {
                setReverseOpen(false);
                setReverseReason('');
            },
        });
    };

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
                    <Chip label={`Branch: ${tenant?.name || '-'}`} />
                    <Chip label={`Cost Center: ${department?.name || '-'}`} />
                    <Chip label={`Payment Account: ${paymentAccount?.name || '-'}`} />
                    <Chip label={`Currency: ${voucher?.currency_code || 'PKR'}`} />
                    <Chip label={`Exchange Rate: ${voucher?.exchange_rate || '1.000000'}`} />
                    <Chip label={`Payment For: ${paymentForLabel}`} />
                    <Chip label={`Vendor / Payee: ${vendorLabel}`} />
                    <Chip label={`Reference: ${voucher?.reference_no || '-'}`} />
                    <Chip label={`Amount: ${formatAmount(voucher?.amount || 0)}`} />
                    <Chip label={`Approval Ref: ${voucher?.approval_reference || '-'}`} />
                    <Chip label={`Reversal Voucher: ${reversalVoucher?.voucher_no || '-'}`} />
                </Box>
                <Box sx={{ mt: 1.25 }}>
                    {voucher?.remarks || '-'}
                </Box>
                {voucher?.status === 'reversed' ? (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Reversal reason: {reversalReason}
                    </Typography>
                ) : null}
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
                    <Typography variant="body2">Created By: {voucher?.createdBy?.name || voucher?.createdBy?.email || voucher?.created_by || '-'}</Typography>
                    <Typography variant="body2">Approved By: {voucher?.approvedBy?.name || voucher?.approvedBy?.email || voucher?.approved_by || '-'}</Typography>
                    <Typography variant="body2">Posted By: {voucher?.postedBy?.name || voucher?.postedBy?.email || voucher?.posted_by || '-'}</Typography>
                    <Typography variant="body2">Cancelled By: {voucher?.cancelledBy?.name || voucher?.cancelledBy?.email || voucher?.cancelled_by || '-'}</Typography>
                    <Typography variant="body2">Reversed By: {voucher?.reversedBy?.name || voucher?.reversedBy?.email || voucher?.reversed_by || '-'}</Typography>
                    {auditTrail.map((item) => (
                        <Typography key={item.id} variant="body2" color="text.secondary">
                            {item.action} · {item.message || '-'} · {item.actor?.name || ''} {item.created_at || ''}
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
                    rows={allocationRows}
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
                    {mediaFiles.length ? mediaFiles.map((file) => (
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
                {operationalLogs.length ? (
                    <Stack spacing={0.75}>
                        {operationalLogs.map((log) => (
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
                    <Button
                        variant="contained"
                        onClick={() => mutation.runRouterAction({
                            key: `voucher-submit-${voucher.id}`,
                            method: 'post',
                            url: route('accounting.vouchers.submit', voucher.id),
                            options: {
                                onSuccess: () => router.visit(route('accounting.vouchers.show', voucher.id)),
                            },
                            successMessage: 'Voucher submitted for approval.',
                            errorMessage: 'Failed to submit voucher.',
                            confirmConfig: {
                                title: 'Submit for Approval',
                                message: 'This will move the voucher to submitted status and send it into the approval workflow. No general ledger posting will happen yet.',
                                confirmLabel: 'Submit for Approval',
                                severity: 'warning',
                            },
                        })}
                    >
                        Submit
                    </Button>
                </Box>
            ) : null}

            {voucher?.status === 'submitted' ? (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                    <Button
                        color="error"
                        variant="outlined"
                        onClick={() => mutation.runRouterAction({
                            key: `voucher-reject-${voucher.id}`,
                            method: 'post',
                            url: route('accounting.vouchers.reject', voucher.id),
                            options: {
                                onSuccess: () => router.visit(route('accounting.vouchers.show', voucher.id)),
                            },
                            successMessage: 'Voucher moved back to draft.',
                            errorMessage: 'Failed to reject voucher.',
                            confirmConfig: {
                                title: 'Reject Voucher',
                                message: 'Send this voucher back to draft?',
                                confirmLabel: 'Reject',
                                severity: 'danger',
                            },
                        })}
                    >
                        Reject
                    </Button>
                    <Button
                        color="warning"
                        variant="outlined"
                        onClick={() => mutation.runRouterAction({
                            key: `voucher-cancel-${voucher.id}`,
                            method: 'post',
                            url: route('accounting.vouchers.cancel', voucher.id),
                            options: {
                                onSuccess: () => router.visit(route('accounting.vouchers.show', voucher.id)),
                            },
                            successMessage: 'Voucher cancelled.',
                            errorMessage: 'Failed to cancel voucher.',
                            confirmConfig: {
                                title: 'Cancel Voucher',
                                message: 'Cancel this voucher? This will stop it from moving further in workflow.',
                                confirmLabel: 'Cancel Voucher',
                                severity: 'warning',
                            },
                        })}
                    >
                        Cancel
                    </Button>
                    <Button
                        color="success"
                        variant="contained"
                        onClick={() => mutation.runRouterAction({
                            key: `voucher-approve-${voucher.id}`,
                            method: 'post',
                            url: route('accounting.vouchers.approve', voucher.id),
                            options: {
                                onSuccess: () => router.visit(route('accounting.vouchers.show', voucher.id)),
                            },
                            successMessage: 'Voucher approved and posted.',
                            errorMessage: 'Failed to approve voucher.',
                            confirmConfig: {
                                title: 'Approve/Post Voucher',
                                message: 'Approve this voucher and post it to the general ledger?',
                                confirmLabel: 'Approve/Post',
                                severity: 'critical',
                            },
                        })}
                    >
                        Approve/Post
                    </Button>
                </Box>
            ) : null}

            {voucher?.status === 'posted' && !voucher?.reversal_voucher_id ? (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                    <Button
                        color="error"
                        variant="contained"
                        onClick={() => setReverseOpen(true)}
                    >
                        Reverse Voucher
                    </Button>
                </Box>
            ) : null}

            <Dialog open={reverseOpen} onClose={() => setReverseOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Reverse Posted Voucher</DialogTitle>
                <DialogContent dividers>
                    <Stack spacing={2}>
                        <Typography variant="body2" color="text.secondary">
                            This will create a linked reversal voucher and keep the original posted voucher unchanged.
                        </Typography>
                        <TextField
                            label="Reversal Reason"
                            value={reverseReason}
                            onChange={(event) => setReverseReason(event.target.value)}
                            required
                            fullWidth
                            multiline
                            minRows={3}
                        />
                        <TextField
                            type="date"
                            label="Reversal Date"
                            value={reverseDate}
                            onChange={(event) => setReverseDate(event.target.value)}
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setReverseOpen(false)}>Close</Button>
                    <Button color="error" variant="contained" onClick={submitReversal} disabled={!reverseReason.trim()}>
                        Create Reversal
                    </Button>
                </DialogActions>
            </Dialog>

            <ConfirmActionDialog {...mutation.confirmDialogProps} />
        </AppPage>
    );
}
