import React from 'react';
import { Link, router } from '@inertiajs/react';
import { Button, Chip, Grid, MenuItem, TableCell, TableRow, TextField } from '@mui/material';
import AppPage from '@/components/App/ui/AppPage';
import AdminDataTable from '@/components/App/ui/AdminDataTable';
import AppLoadingButton from '@/components/App/ui/AppLoadingButton';
import ConfirmActionDialog from '@/components/App/ui/ConfirmActionDialog';
import FilterToolbar from '@/components/App/ui/FilterToolbar';
import StatCard from '@/components/App/ui/StatCard';
import SurfaceCard from '@/components/App/ui/SurfaceCard';
import useMutationAction from '@/hooks/useMutationAction';
import { formatCount } from '@/lib/formatting';

export default function Index({ documents, summary = {}, filters = {}, typeOptions = [] }) {
    const mutation = useMutationAction();
    const rows = documents?.data || [];
    const [type, setType] = React.useState(filters.type || '');
    const [status, setStatus] = React.useState(filters.status || '');
    const perPage = filters.per_page || documents?.per_page || 25;

    const applyFilters = (nextType, nextStatus) => {
        router.get(route('inventory.document-flows.index'), {
            type: nextType,
            status: nextStatus,
            per_page: perPage,
        }, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    return (
        <AppPage
            eyebrow="Warehouse"
            title="Inventory Document Flows"
            subtitle="Manage issue, receipt, department transfer, and department adjustment documents."
            actions={[
                <Button key="create" variant="contained" component={Link} href={route('inventory.document-flows.create')}>
                    New Document
                </Button>,
            ]}
        >
            <Grid container spacing={2.25}>
                <Grid item xs={12} sm={4}><StatCard compact label="Documents" value={formatCount(summary.count)} accent /></Grid>
                <Grid item xs={12} sm={4}><StatCard compact label="Draft" value={formatCount(summary.draft)} /></Grid>
                <Grid item xs={12} sm={4}><StatCard compact label="Posted" value={formatCount(summary.posted)} /></Grid>
            </Grid>

            <SurfaceCard title="Filter">
                <FilterToolbar
                    onReset={() => {
                    setType('');
                    setStatus('');
                    router.get(route('inventory.document-flows.index'), { per_page: perPage }, { replace: true, preserveScroll: true });
                    }}
                    onApply={() => applyFilters(type, status)}
                    lowChrome
                    title="Filters"
                    subtitle="Filter documents by type and workflow state."
                >
                    <Grid container spacing={1.25}>
                        <Grid item xs={12} md={4}>
                            <TextField
                                size="small"
                                select
                                label="Document Type"
                                value={type}
                                onChange={(event) => {
                                    const nextType = event.target.value;
                                    setType(nextType);
                                    applyFilters(nextType, status);
                                }}
                                fullWidth
                            >
                                <MenuItem value="">All</MenuItem>
                                {typeOptions.map((option) => (
                                    <MenuItem key={option} value={option}>{option}</MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <TextField
                                size="small"
                                select
                                label="Status"
                                value={status}
                                onChange={(event) => {
                                    const nextStatus = event.target.value;
                                    setStatus(nextStatus);
                                    applyFilters(type, nextStatus);
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

            <SurfaceCard title="Document Register">
                <AdminDataTable
                    columns={[
                        { key: 'document_no', label: 'Doc No' },
                        { key: 'transaction_date', label: 'Date' },
                        { key: 'type', label: 'Type' },
                        { key: 'source', label: 'Source Warehouse' },
                        { key: 'destination', label: 'Destination Warehouse' },
                        { key: 'status', label: 'Status' },
                        { key: 'actions', label: 'Actions', align: 'right' },
                    ]}
                    rows={rows}
                    pagination={documents}
                    emptyMessage="No inventory documents found."
                    renderRow={(row) => (
                        <TableRow key={row.id} hover>
                            <TableCell>{row.document_no}</TableCell>
                            <TableCell>{row.transaction_date}</TableCell>
                            <TableCell>{row.type}</TableCell>
                            <TableCell>{row.source_warehouse?.name || '-'}</TableCell>
                            <TableCell>{row.destination_warehouse?.name || '-'}</TableCell>
                            <TableCell><Chip size="small" label={row.workflow_state || row.status} /></TableCell>
                            <TableCell align="right">
                                {row.approval_required && row.approval_status === 'draft' ? (
                                    <AppLoadingButton
                                        size="small"
                                        loading={mutation.isPending(`doc-submit-${row.id}`)}
                                        loadingLabel="Submitting..."
                                        onClick={() => mutation.runRouterAction({
                                            key: `doc-submit-${row.id}`,
                                            method: 'post',
                                            url: route('inventory.document-flows.submit', row.id),
                                            successMessage: 'Document submitted.',
                                            errorMessage: 'Failed to submit document.',
                                            confirmConfig: {
                                                title: 'Submit Document',
                                                message: 'Submit this document for approval?',
                                                confirmLabel: 'Submit',
                                                severity: 'warning',
                                            },
                                        })}
                                    >
                                        Submit
                                    </AppLoadingButton>
                                ) : null}
                                {row.status !== 'posted' && ['draft', 'submitted'].includes(row.approval_status) ? (
                                    <AppLoadingButton
                                        size="small"
                                        color="success"
                                        loading={mutation.isPending(`doc-approve-${row.id}`)}
                                        loadingLabel="Posting..."
                                        onClick={() => mutation.runRouterAction({
                                            key: `doc-approve-${row.id}`,
                                            method: 'post',
                                            url: route('inventory.document-flows.approve', row.id),
                                            successMessage: 'Document approved/posted.',
                                            errorMessage: 'Failed to approve/post document.',
                                            confirmConfig: {
                                                title: 'Approve/Post Document',
                                                message: 'This may create stock and accounting impact. Continue?',
                                                confirmLabel: 'Approve/Post',
                                                severity: 'critical',
                                            },
                                        })}
                                    >
                                        Approve/Post
                                    </AppLoadingButton>
                                ) : null}
                                {['draft', 'submitted'].includes(row.approval_status) ? (
                                    <AppLoadingButton
                                        size="small"
                                        color="error"
                                        loading={mutation.isPending(`doc-reject-${row.id}`)}
                                        loadingLabel="Rejecting..."
                                        onClick={() => mutation.runRouterAction({
                                            key: `doc-reject-${row.id}`,
                                            method: 'post',
                                            url: route('inventory.document-flows.reject', row.id),
                                            data: { remarks: 'Rejected from register.' },
                                            successMessage: 'Document rejected.',
                                            errorMessage: 'Failed to reject document.',
                                            confirmConfig: {
                                                title: 'Reject Document',
                                                message: 'Reject this document?',
                                                confirmLabel: 'Reject',
                                                severity: 'danger',
                                            },
                                        })}
                                    >
                                        Reject
                                    </AppLoadingButton>
                                ) : null}
                            </TableCell>
                        </TableRow>
                    )}
                />
            </SurfaceCard>
            <ConfirmActionDialog {...mutation.confirmDialogProps} />
        </AppPage>
    );
}
