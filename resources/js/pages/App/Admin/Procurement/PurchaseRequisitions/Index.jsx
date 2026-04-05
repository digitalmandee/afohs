import React from 'react';
import { Link, router, useForm } from '@inertiajs/react';
import { Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Grid, IconButton, Menu, MenuItem, Stack, TableCell, TableRow, TextField, Tooltip, Typography } from '@mui/material';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import OpenInNewOutlinedIcon from '@mui/icons-material/OpenInNewOutlined';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import HighlightOffOutlinedIcon from '@mui/icons-material/HighlightOffOutlined';
import MoreVertOutlinedIcon from '@mui/icons-material/MoreVertOutlined';
import AppPage from '@/components/App/ui/AppPage';
import SurfaceCard from '@/components/App/ui/SurfaceCard';
import StatCard from '@/components/App/ui/StatCard';
import AdminDataTable from '@/components/App/ui/AdminDataTable';
import AppLoadingButton from '@/components/App/ui/AppLoadingButton';
import ConfirmActionDialog from '@/components/App/ui/ConfirmActionDialog';
import useMutationAction from '@/hooks/useMutationAction';
import { formatAmount } from '@/lib/formatting';

function ActionIconButton({ title, onClick, icon, color = 'default', loading = false, disabled = false, href, target, rel }) {
    return (
        <Tooltip title={title}>
            <span>
                <IconButton
                    size="small"
                    color={color}
                    onClick={onClick}
                    component={href ? 'a' : 'button'}
                    href={href}
                    target={target}
                    rel={rel}
                    disabled={disabled || loading}
                    sx={{ border: '1px solid #dbe5ee', borderRadius: '10px' }}
                >
                    {loading ? <CircularProgress size={14} color="inherit" /> : icon}
                </IconButton>
            </span>
        </Tooltip>
    );
}

function PurchaseRequisitionRowActions({ row, mutation, openConvertModal }) {
    const [anchorEl, setAnchorEl] = React.useState(null);
    const menuOpen = Boolean(anchorEl);

    const actionItems = [
        ...(row.status === 'draft'
            ? [{
                key: 'submit',
                label: 'Submit',
                icon: <SendOutlinedIcon fontSize="small" />,
                loading: mutation.isPending(`pr-submit-${row.id}`),
                run: () => mutation.runRouterAction({
                    key: `pr-submit-${row.id}`,
                    method: 'post',
                    url: route('procurement.purchase-requisitions.submit', row.id),
                    successMessage: 'Requisition submitted.',
                    errorMessage: 'Failed to submit requisition.',
                    confirmConfig: {
                        title: 'Submit Requisition',
                        message: 'Submit this requisition for approval?',
                        confirmLabel: 'Submit',
                        severity: 'warning',
                    },
                }),
            }]
            : []),
        ...(['draft', 'submitted'].includes(row.status)
            ? [{
                key: 'approve',
                label: 'Approve',
                icon: <CheckCircleOutlineOutlinedIcon fontSize="small" />,
                loading: mutation.isPending(`pr-approve-${row.id}`),
                run: () => mutation.runRouterAction({
                    key: `pr-approve-${row.id}`,
                    method: 'post',
                    url: route('procurement.purchase-requisitions.approve', row.id),
                    successMessage: 'Requisition approved.',
                    errorMessage: 'Failed to approve requisition.',
                    confirmConfig: {
                        title: 'Approve Requisition',
                        message: 'Approve this requisition now?',
                        confirmLabel: 'Approve',
                        severity: 'critical',
                    },
                }),
            }, {
                key: 'reject',
                label: 'Reject',
                icon: <HighlightOffOutlinedIcon fontSize="small" />,
                loading: mutation.isPending(`pr-reject-${row.id}`),
                run: () => mutation.runRouterAction({
                    key: `pr-reject-${row.id}`,
                    method: 'post',
                    url: route('procurement.purchase-requisitions.reject', row.id),
                    successMessage: 'Requisition rejected.',
                    errorMessage: 'Failed to reject requisition.',
                    confirmConfig: {
                        title: 'Reject Requisition',
                        message: 'Reject this requisition?',
                        confirmLabel: 'Reject',
                        severity: 'danger',
                    },
                }),
            }]
            : []),
    ];

    const canConvert = ['approved', 'partially_converted'].includes(row.status) && !!row.has_remaining_qty;

    return (
        <Stack direction="row" spacing={0.6} justifyContent="flex-end" alignItems="center">
            {canConvert ? (
                <ActionIconButton
                    title="Convert to PO"
                    color="primary"
                    icon={<ReceiptLongOutlinedIcon fontSize="small" />}
                    onClick={() => openConvertModal(row)}
                />
            ) : null}

            {row.latest_purchase_order ? (
                <ActionIconButton
                    title={`Open PO (${row.latest_purchase_order.po_no})`}
                    color="default"
                    icon={<OpenInNewOutlinedIcon fontSize="small" />}
                    href={route('procurement.purchase-orders.view', row.latest_purchase_order.id)}
                    target="_blank"
                    rel="noreferrer"
                />
            ) : null}

            <ActionIconButton
                title="View Requisition"
                color="primary"
                icon={<VisibilityOutlinedIcon fontSize="small" />}
                href={route('procurement.purchase-requisitions.show', row.id)}
                target="_blank"
                rel="noreferrer"
            />

            {actionItems.length > 0 ? (
                <>
                    <ActionIconButton
                        title="More Actions"
                        icon={<MoreVertOutlinedIcon fontSize="small" />}
                        onClick={(event) => setAnchorEl(event.currentTarget)}
                    />
                    <Menu
                        anchorEl={anchorEl}
                        open={menuOpen}
                        onClose={() => setAnchorEl(null)}
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                    >
                        {actionItems.map((item) => (
                            <MenuItem
                                key={item.key}
                                disabled={item.loading}
                                onClick={() => {
                                    setAnchorEl(null);
                                    item.run();
                                }}
                            >
                                <Stack direction="row" spacing={1} alignItems="center">
                                    {item.loading ? <CircularProgress size={14} /> : item.icon}
                                    <Typography variant="body2">{item.label}</Typography>
                                </Stack>
                            </MenuItem>
                        ))}
                    </Menu>
                </>
            ) : null}
        </Stack>
    );
}

export default function Index({ requisitions, summary = {}, vendors = [], warehouses = [] }) {
    const rows = requisitions?.data || [];
    const [convertModal, setConvertModal] = React.useState({ open: false, requisition: null });
    const mutation = useMutationAction();
    const convertForm = useForm({
        vendor_id: '',
        warehouse_id: '',
        order_date: new Date().toISOString().slice(0, 10),
        expected_date: '',
        items: [],
    });

    const openConvertModal = (row) => {
        const lines = (row.items || [])
            .map((item) => {
                const requested = Number(item.qty_requested || 0);
                const converted = Number(item.qty_converted || 0);
                const remaining = Math.max(0, requested - converted);
                return {
                    requisition_item_id: item.id,
                    inventory_item_name: item.inventory_item?.name || `Item ${item.inventory_item_id}`,
                    qty_ordered: remaining > 0 ? remaining : 0,
                    max_qty: remaining,
                    unit_cost: Number(item.estimated_unit_cost || 0),
                };
            })
            .filter((item) => item.max_qty > 0);

        convertForm.setData({
            vendor_id: '',
            warehouse_id: '',
            order_date: new Date().toISOString().slice(0, 10),
            expected_date: '',
            items: lines,
        });
        setConvertModal({ open: true, requisition: row });
    };

    const closeConvertModal = () => {
        setConvertModal({ open: false, requisition: null });
        convertForm.reset();
    };

    const updateConvertItem = (index, field, value) => {
        const next = [...convertForm.data.items];
        const current = { ...next[index], [field]: value };
        if (field === 'qty_ordered') {
            const maxQty = Number(next[index].max_qty || 0);
            const numericValue = Number(value || 0);
            current.qty_ordered = Math.min(Math.max(numericValue, 0), maxQty);
        }
        next[index] = current;
        convertForm.setData('items', next);
    };

    const submitConversion = (event) => {
        event.preventDefault();
        if (!convertModal.requisition) return;

        const payload = {
            ...convertForm.data,
            items: (convertForm.data.items || []).filter((line) => Number(line.qty_ordered) > 0).map((line) => ({
                requisition_item_id: line.requisition_item_id,
                qty_ordered: Number(line.qty_ordered),
                unit_cost: Number(line.unit_cost || 0),
            })),
        };

        mutation.runAction({
            key: `pr-convert-${convertModal.requisition.id}`,
            requireConfirm: true,
            confirmConfig: {
                title: 'Convert Requisition to PO',
                message: 'This will create a purchase order from selected lines. Do you want to continue?',
                confirmLabel: 'Convert',
                severity: 'warning',
            },
            successMessage: 'Purchase order created successfully.',
            errorMessage: 'Failed to convert requisition.',
            action: ({ onSuccess, onError, onFinish }) => {
                convertForm.transform(() => payload);
                convertForm.post(
                    route('procurement.purchase-requisitions.convert-to-po', convertModal.requisition.id),
                    {
                        onSuccess: () => {
                            closeConvertModal();
                            onSuccess();
                        },
                        onError,
                        onFinish,
                    },
                );
            },
        });
    };

    return (
        <AppPage
            eyebrow="Procurement"
            title="Purchase Requisitions"
            subtitle="Initiate procurement demand and convert approved requests to purchase orders."
            actions={[
                <Button key="create" component={Link} href={route('procurement.purchase-requisitions.create')} variant="contained">
                    New Requisition
                </Button>,
            ]}
        >
            <Grid container spacing={2.25}>
                <Grid item xs={12} md={2.4}><StatCard label="Total" value={summary.count || 0} accent /></Grid>
                <Grid item xs={12} md={2.4}><StatCard label="Draft" value={summary.draft || 0} /></Grid>
                <Grid item xs={12} md={2.4}><StatCard label="Submitted" value={summary.submitted || 0} /></Grid>
                <Grid item xs={12} md={2.4}><StatCard label="Approved" value={summary.approved || 0} tone="light" /></Grid>
                <Grid item xs={12} md={2.4}><StatCard label="Converted" value={summary.converted || 0} tone="muted" /></Grid>
            </Grid>

            <SurfaceCard title="Requisition Register" subtitle="Review request lifecycle and trigger approval/conversion actions.">
                <AdminDataTable
                    columns={[
                        { key: 'pr_no', label: 'PR No' },
                        { key: 'date', label: 'Request Date' },
                        { key: 'request_for', label: 'Request For' },
                        { key: 'location', label: 'Location / Business Unit' },
                        { key: 'department', label: 'Department' },
                        { key: 'items', label: 'Items', align: 'right' },
                        { key: 'status', label: 'Status' },
                        { key: 'actions', label: 'Actions', align: 'right', sx: { minWidth: 220 } },
                    ]}
                    rows={rows}
                    pagination={requisitions}
                    emptyMessage="No requisitions found."
                    renderRow={(row) => (
                        <TableRow key={row.id} hover>
                            <TableCell>{row.pr_no}</TableCell>
                            <TableCell>{row.request_date}</TableCell>
                            <TableCell>{row.request_for_label || '-'}</TableCell>
                            <TableCell>{row.location_label || '-'}</TableCell>
                            <TableCell>{row.department?.name || '-'}</TableCell>
                            <TableCell align="right">{row.items?.length || 0}</TableCell>
                            <TableCell><Chip size="small" label={row.status} /></TableCell>
                            <TableCell align="right">
                                <PurchaseRequisitionRowActions
                                    row={row}
                                    mutation={mutation}
                                    openConvertModal={openConvertModal}
                                />
                            </TableCell>
                        </TableRow>
                    )}
                />
            </SurfaceCard>

            <Dialog open={convertModal.open} onClose={closeConvertModal} fullWidth maxWidth="md">
                <DialogTitle>Convert Requisition to PO</DialogTitle>
                <form onSubmit={submitConversion}>
                    <DialogContent>
                        <Grid container spacing={1.5}>
                            <Grid item xs={12} md={4}>
                                <TextField
                                    select
                                    size="small"
                                    label="Vendor"
                                    value={convertForm.data.vendor_id}
                                    onChange={(event) => convertForm.setData('vendor_id', event.target.value)}
                                    error={!!convertForm.errors.vendor_id}
                                    helperText={convertForm.errors.vendor_id}
                                    fullWidth
                                >
                                    {vendors.map((vendor) => (
                                        <MenuItem key={vendor.id} value={vendor.id}>{vendor.name}</MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField
                                    select
                                    size="small"
                                    label="Warehouse"
                                    value={convertForm.data.warehouse_id}
                                    onChange={(event) => convertForm.setData('warehouse_id', event.target.value)}
                                    error={!!convertForm.errors.warehouse_id}
                                    helperText={convertForm.errors.warehouse_id}
                                    fullWidth
                                >
                                    {warehouses.map((warehouse) => (
                                        <MenuItem key={warehouse.id} value={warehouse.id}>{warehouse.name}</MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={2}>
                                <TextField
                                    size="small"
                                    type="date"
                                    label="Order Date"
                                    value={convertForm.data.order_date}
                                    onChange={(event) => convertForm.setData('order_date', event.target.value)}
                                    error={!!convertForm.errors.order_date}
                                    helperText={convertForm.errors.order_date}
                                    InputLabelProps={{ shrink: true }}
                                    fullWidth
                                />
                            </Grid>
                            <Grid item xs={12} md={2}>
                                <TextField
                                    size="small"
                                    type="date"
                                    label="Expected Date"
                                    value={convertForm.data.expected_date}
                                    onChange={(event) => convertForm.setData('expected_date', event.target.value)}
                                    error={!!convertForm.errors.expected_date}
                                    helperText={convertForm.errors.expected_date}
                                    InputLabelProps={{ shrink: true }}
                                    fullWidth
                                />
                            </Grid>
                        </Grid>

                        <Typography sx={{ mt: 2, mb: 1, fontWeight: 700 }}>
                            Conversion Lines
                        </Typography>
                        {(convertForm.data.items || []).map((line, index) => (
                            <Grid container spacing={1.5} key={line.requisition_item_id} sx={{ mb: 1 }}>
                                <Grid item xs={12} md={5}>
                                    <TextField size="small" label="Item" value={line.inventory_item_name} fullWidth InputProps={{ readOnly: true }} />
                                </Grid>
                                <Grid item xs={12} md={3}>
                                    <TextField
                                        size="small"
                                        type="number"
                                        label={`Qty (max ${line.max_qty})`}
                                        value={line.qty_ordered}
                                        onChange={(event) => updateConvertItem(index, 'qty_ordered', event.target.value)}
                                        fullWidth
                                    />
                                </Grid>
                                <Grid item xs={12} md={2}>
                                    <TextField size="small" type="number" label="Unit Cost" value={line.unit_cost} onChange={(event) => updateConvertItem(index, 'unit_cost', event.target.value)} fullWidth />
                                </Grid>
                                <Grid item xs={12} md={2}>
                                    <TextField
                                        size="small"
                                        label="Line Total"
                                        value={formatAmount(Number(line.qty_ordered || 0) * Number(line.unit_cost || 0))}
                                        fullWidth
                                        InputProps={{
                                            readOnly: true,
                                            sx: { '& input': { textAlign: 'right', fontWeight: 700 } },
                                        }}
                                    />
                                </Grid>
                            </Grid>
                        ))}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={closeConvertModal}>Cancel</Button>
                        <AppLoadingButton
                            type="submit"
                            variant="contained"
                            loading={mutation.isPending(`pr-convert-${convertModal.requisition?.id || 'new'}`)}
                            loadingLabel="Converting..."
                        >
                            {mutation.isPending(`pr-convert-${convertModal.requisition?.id || 'new'}`) ? 'Converting...' : 'Create PO'}
                        </AppLoadingButton>
                    </DialogActions>
                </form>
            </Dialog>
            <ConfirmActionDialog {...mutation.confirmDialogProps} />
        </AppPage>
    );
}
