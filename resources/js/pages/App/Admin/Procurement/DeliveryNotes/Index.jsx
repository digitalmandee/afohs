import React from 'react';
import { Link } from '@inertiajs/react';
import { Button, Chip, TableCell, TableRow } from '@mui/material';
import AppPage from '@/components/App/ui/AppPage';
import AdminDataTable from '@/components/App/ui/AdminDataTable';
import SurfaceCard from '@/components/App/ui/SurfaceCard';

export default function Index({ deliveryNotes }) {
    const rows = deliveryNotes?.data || [];

    return (
        <AppPage
            eyebrow="Procurement"
            title="Delivery Notes"
            subtitle="Track delivery-note references for dispatch and fulfillment traceability."
            actions={[
                <Button key="create" variant="contained" component={Link} href={route('procurement.delivery-notes.create')}>
                    New Delivery Note
                </Button>,
            ]}
        >
            <SurfaceCard title="Delivery Note Register">
                <AdminDataTable
                    columns={[
                        { key: 'document_no', label: 'Document No' },
                        { key: 'date', label: 'Date' },
                        { key: 'source', label: 'Source Warehouse' },
                        { key: 'destination', label: 'Destination Warehouse' },
                        { key: 'status', label: 'Status' },
                        { key: 'remarks', label: 'Remarks' },
                        { key: 'actions', label: 'Actions', align: 'right' },
                    ]}
                    rows={rows}
                    pagination={deliveryNotes}
                    emptyMessage="No delivery notes found."
                    renderRow={(row) => (
                        <TableRow key={row.id} hover>
                            <TableCell>{row.document_no}</TableCell>
                            <TableCell>{row.transaction_date}</TableCell>
                            <TableCell>{row.source_warehouse?.name || '-'}</TableCell>
                            <TableCell>{row.destination_warehouse?.name || '-'}</TableCell>
                            <TableCell><Chip size="small" label={row.status} /></TableCell>
                            <TableCell>{row.remarks || '-'}</TableCell>
                            <TableCell align="right">
                                <Button
                                    size="small"
                                    component={Link}
                                    href={route('procurement.delivery-notes.print', row.id)}
                                    target="_blank"
                                >
                                    Print
                                </Button>
                            </TableCell>
                        </TableRow>
                    )}
                />
            </SurfaceCard>
        </AppPage>
    );
}
