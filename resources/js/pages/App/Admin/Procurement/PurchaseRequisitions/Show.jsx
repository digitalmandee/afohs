import React from 'react';
import { Link } from '@inertiajs/react';
import { Box, Button, Chip, Grid, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import AppPage from '@/components/App/ui/AppPage';
import SurfaceCard from '@/components/App/ui/SurfaceCard';
import StatCard from '@/components/App/ui/StatCard';
import { formatAmount } from '@/lib/formatting';

export default function Show({ requisition, meta = {}, history = [] }) {
    const lines = requisition?.items || [];

    return (
        <AppPage
            eyebrow="Procurement"
            title={`Requisition ${requisition?.pr_no || ''}`}
            subtitle="Review requisition details, lines, and approval history."
            actions={[
                <Button key="back" component={Link} href={route('procurement.purchase-requisitions.index')} variant="outlined">
                    Back to Requisitions
                </Button>,
            ]}
        >
            <Grid container spacing={2.25}>
                <Grid item xs={12} md={3}><StatCard compact label="Request For" value={meta.request_for_label || '-'} accent /></Grid>
                <Grid item xs={12} md={3}><StatCard compact label="Location / Business Unit" value={meta.location_label || '-'} /></Grid>
                <Grid item xs={12} md={3}><StatCard compact label="Total Qty" value={Number(meta.total_qty || 0).toFixed(3)} /></Grid>
                <Grid item xs={12} md={3}><StatCard compact label="Estimated Total" value={formatAmount(meta.total_estimated || 0)} /></Grid>
            </Grid>

            <SurfaceCard title="Header Details">
                <Grid container spacing={1.5}>
                    <Grid item xs={12} md={3}><Typography variant="body2"><strong>Status:</strong> <Chip size="small" label={requisition?.status || '-'} /></Typography></Grid>
                    <Grid item xs={12} md={3}><Typography variant="body2"><strong>Request Date:</strong> {requisition?.request_date || '-'}</Typography></Grid>
                    <Grid item xs={12} md={3}><Typography variant="body2"><strong>Required Date:</strong> {requisition?.required_date || '-'}</Typography></Grid>
                    <Grid item xs={12} md={3}><Typography variant="body2"><strong>Department:</strong> {requisition?.department?.name || '-'}</Typography></Grid>
                    <Grid item xs={12} md={3}><Typography variant="body2"><strong>Requester:</strong> {requisition?.requester?.name || '-'}</Typography></Grid>
                    <Grid item xs={12} md={3}><Typography variant="body2"><strong>Approved By:</strong> {requisition?.approver?.name || '-'}</Typography></Grid>
                    <Grid item xs={12} md={3}><Typography variant="body2"><strong>Restaurant:</strong> {requisition?.tenant?.name || '-'}</Typography></Grid>
                    <Grid item xs={12} md={3}><Typography variant="body2"><strong>Warehouse:</strong> {requisition?.warehouse?.name || '-'}</Typography></Grid>
                    <Grid item xs={12}>
                        <Typography variant="body2"><strong>Notes:</strong> {requisition?.notes || '-'}</Typography>
                    </Grid>
                </Grid>
            </SurfaceCard>

            <SurfaceCard title="Requested Items">
                <Box sx={{ overflowX: 'auto' }}>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Item</TableCell>
                                <TableCell>SKU</TableCell>
                                <TableCell align="right">Qty Requested</TableCell>
                                <TableCell align="right">Qty Converted</TableCell>
                                <TableCell align="right">Estimated Unit Cost</TableCell>
                                <TableCell align="right">Line Estimate</TableCell>
                                <TableCell>Remarks</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {lines.map((line) => (
                                <TableRow key={line.id}>
                                    <TableCell>{line.inventory_item?.name || `Item ${line.inventory_item_id}`}</TableCell>
                                    <TableCell>{line.inventory_item?.sku || '-'}</TableCell>
                                    <TableCell align="right">{Number(line.qty_requested || 0).toFixed(3)}</TableCell>
                                    <TableCell align="right">{Number(line.qty_converted || 0).toFixed(3)}</TableCell>
                                    <TableCell align="right">{formatAmount(line.estimated_unit_cost || 0)}</TableCell>
                                    <TableCell align="right">{formatAmount((line.qty_requested || 0) * (line.estimated_unit_cost || 0))}</TableCell>
                                    <TableCell>{line.remarks || '-'}</TableCell>
                                </TableRow>
                            ))}
                            {lines.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center">No requisition lines found.</TableCell>
                                </TableRow>
                            ) : null}
                        </TableBody>
                    </Table>
                </Box>
            </SurfaceCard>

            <SurfaceCard title="Approval History">
                <Stack spacing={1}>
                    {history.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">No approval actions recorded.</Typography>
                    ) : history.map((entry) => (
                        <Box
                            key={entry.id}
                            sx={{
                                border: '1px solid rgba(226,232,240,0.95)',
                                borderRadius: '12px',
                                p: 1.25,
                                display: 'flex',
                                justifyContent: 'space-between',
                                gap: 1,
                                flexWrap: 'wrap',
                            }}
                        >
                            <Typography variant="body2">
                                <strong>{entry.action}</strong> by {entry.action_by_name || 'System'} {entry.remarks ? `• ${entry.remarks}` : ''}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">{entry.created_at}</Typography>
                        </Box>
                    ))}
                </Stack>
            </SurfaceCard>
        </AppPage>
    );
}
