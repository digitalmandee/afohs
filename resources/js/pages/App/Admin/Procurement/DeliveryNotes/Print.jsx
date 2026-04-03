import React from 'react';
import { Button, Divider, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import AppPage from '@/components/App/ui/AppPage';
import SurfaceCard from '@/components/App/ui/SurfaceCard';
import { formatAmount } from '@/lib/formatting';

export default function Print({ deliveryNote, generatedAt, generatedBy }) {
    const lines = deliveryNote?.lines || [];

    return (
        <AppPage
            eyebrow="Procurement"
            title={`Delivery Note ${deliveryNote?.document_no || ''}`}
            subtitle="Print-friendly delivery note view."
            actions={[
                <Button key="print" variant="contained" onClick={() => window.print()}>
                    Print
                </Button>,
            ]}
        >
            <SurfaceCard title="Delivery Note Header">
                <Stack spacing={0.8}>
                    <Typography variant="body2"><strong>Document No:</strong> {deliveryNote?.document_no}</Typography>
                    <Typography variant="body2"><strong>Date:</strong> {deliveryNote?.transaction_date}</Typography>
                    <Typography variant="body2"><strong>Restaurant:</strong> {deliveryNote?.tenant?.name || 'Shared'}</Typography>
                    <Typography variant="body2"><strong>Source Warehouse:</strong> {deliveryNote?.source_warehouse?.name || '-'}</Typography>
                    <Typography variant="body2"><strong>Destination Warehouse:</strong> {deliveryNote?.destination_warehouse?.name || '-'}</Typography>
                    <Typography variant="body2"><strong>Source Reference:</strong> {deliveryNote?.source_document_type || '-'} {deliveryNote?.source_document_id || ''}</Typography>
                    <Typography variant="body2"><strong>Remarks:</strong> {deliveryNote?.remarks || '-'}</Typography>
                </Stack>
                <Divider sx={{ my: 1.5 }} />
                <Typography variant="caption" color="text.secondary">
                    Generated at {generatedAt} by {generatedBy || 'system'}
                </Typography>
            </SurfaceCard>

            <SurfaceCard title="Delivered Items">
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>Item</TableCell>
                            <TableCell>SKU</TableCell>
                            <TableCell align="right">Quantity</TableCell>
                            <TableCell align="right">Unit Cost</TableCell>
                            <TableCell align="right">Line Total</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {lines.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5}>No line items.</TableCell>
                            </TableRow>
                        ) : lines.map((line) => (
                            <TableRow key={line.id}>
                                <TableCell>{line.inventory_item?.name || '-'}</TableCell>
                                <TableCell>{line.inventory_item?.sku || '-'}</TableCell>
                                <TableCell align="right">{Number(line.quantity || 0).toFixed(3)}</TableCell>
                                <TableCell align="right">{formatAmount(line.unit_cost, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</TableCell>
                                <TableCell align="right">{formatAmount(line.line_total)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </SurfaceCard>
        </AppPage>
    );
}

