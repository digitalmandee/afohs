import React from 'react';
import { Link, router } from '@inertiajs/react';
import axios from 'axios';
import debounce from 'lodash.debounce';
import { Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Grid, IconButton, Menu, MenuItem, Stack, TableCell, TableRow, TextField, Tooltip, Typography, useMediaQuery } from '@mui/material';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import HighlightOffOutlinedIcon from '@mui/icons-material/HighlightOffOutlined';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import MoreVertOutlinedIcon from '@mui/icons-material/MoreVertOutlined';
import AdminDataTable from '@/components/App/ui/AdminDataTable';
import AppPage from '@/components/App/ui/AppPage';
import CompactDateRangePicker from '@/components/App/ui/CompactDateRangePicker';
import ConfirmActionDialog from '@/components/App/ui/ConfirmActionDialog';
import FilterToolbar from '@/components/App/ui/FilterToolbar';
import SurfaceCard from '@/components/App/ui/SurfaceCard';
import StatCard from '@/components/App/ui/StatCard';
import useMutationAction from '@/hooks/useMutationAction';
import { formatAmount, formatCount } from '@/lib/formatting';

function ActionIconButton({
    title,
    onClick,
    icon,
    color = 'default',
    loading = false,
    disabled = false,
    href,
    target,
    rel,
}) {
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

function PurchaseOrderRowActions({ po, mutation, openHistory }) {
    const isCompact = useMediaQuery('(max-width:1500px)');
    const [anchorEl, setAnchorEl] = React.useState(null);
    const menuOpen = Boolean(anchorEl);

    const isDraft = po.status === 'draft';
    const canEdit = ['draft', 'submitted'].includes(po.status);
    const canCreateGrn = ['approved', 'partially_received'].includes(po.status);

    const actionItems = [
        ...(isDraft
            ? [
                {
                    key: 'submit',
                    label: 'Submit PO',
                    icon: <SendOutlinedIcon fontSize="small" />,
                    color: 'primary',
                    loading: mutation.isPending(`po-submit-${po.id}`),
                    onClick: () =>
                        mutation.runRouterAction({
                            key: `po-submit-${po.id}`,
                            method: 'post',
                            url: route('procurement.purchase-orders.submit', po.id),
                            successMessage: 'Purchase order submitted.',
                            errorMessage: 'Failed to submit purchase order.',
                            confirmConfig: {
                                title: 'Submit Purchase Order',
                                message: 'Submit this purchase order for approval?',
                                confirmLabel: 'Submit',
                                severity: 'warning',
                            },
                        }),
                },
                {
                    key: 'approve',
                    label: 'Approve PO',
                    icon: <CheckCircleOutlineOutlinedIcon fontSize="small" />,
                    color: 'success',
                    loading: mutation.isPending(`po-approve-${po.id}`),
                    onClick: () =>
                        mutation.runRouterAction({
                            key: `po-approve-${po.id}`,
                            method: 'post',
                            url: route('procurement.purchase-orders.approve', po.id),
                            successMessage: 'Purchase order approved.',
                            errorMessage: 'Failed to approve purchase order.',
                            confirmConfig: {
                                title: 'Approve Purchase Order',
                                message: 'Approve this purchase order?',
                                confirmLabel: 'Approve',
                                severity: 'critical',
                            },
                        }),
                },
                {
                    key: 'reject',
                    label: 'Reject PO',
                    icon: <HighlightOffOutlinedIcon fontSize="small" />,
                    color: 'error',
                    loading: mutation.isPending(`po-reject-${po.id}`),
                    onClick: () =>
                        mutation.runRouterAction({
                            key: `po-reject-${po.id}`,
                            method: 'post',
                            url: route('procurement.purchase-orders.reject', po.id),
                            successMessage: 'Purchase order rejected.',
                            errorMessage: 'Failed to reject purchase order.',
                            confirmConfig: {
                                title: 'Reject Purchase Order',
                                message: 'Reject this purchase order?',
                                confirmLabel: 'Reject',
                                severity: 'danger',
                            },
                        }),
                },
              ]
            : []),
        ...(canEdit
            ? [{
                key: 'edit',
                label: 'Edit PO',
                icon: <EditOutlinedIcon fontSize="small" />,
                color: 'default',
                onClick: () => router.visit(route('procurement.purchase-orders.edit', po.id)),
            }]
            : []),
        {
            key: 'history',
            label: 'History',
            icon: <HistoryOutlinedIcon fontSize="small" />,
            color: 'default',
            onClick: () => openHistory(po),
        },
    ];

    return (
        <Stack direction="row" spacing={0.6} justifyContent="flex-end" alignItems="center">
            {canCreateGrn && (
                <ActionIconButton
                    title="Create GRN"
                    color="primary"
                    icon={<ReceiptLongOutlinedIcon fontSize="small" />}
                    onClick={() => router.visit(`${route('procurement.goods-receipts.create')}?purchase_order_id=${po.id}`)}
                />
            )}
            <ActionIconButton
                title="Print PO"
                icon={<PrintOutlinedIcon fontSize="small" />}
                href={route('procurement.purchase-orders.print', po.id)}
                target="_blank"
                rel="noreferrer"
            />
            <ActionIconButton
                title="Download PDF"
                icon={<PictureAsPdfOutlinedIcon fontSize="small" />}
                href={route('procurement.purchase-orders.pdf', po.id)}
            />
            <ActionIconButton
                title="View PO"
                color="primary"
                icon={<VisibilityOutlinedIcon fontSize="small" />}
                href={route('procurement.purchase-orders.view', po.id)}
                target="_blank"
                rel="noreferrer"
            />

            {!isCompact &&
                actionItems.map((item) => (
                    <ActionIconButton
                        key={item.key}
                        title={item.label}
                        icon={item.icon}
                        color={item.color}
                        onClick={item.onClick}
                        loading={item.loading}
                    />
                ))}

            {(isCompact || actionItems.length > 2) && (
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
                                    item.onClick();
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
            )}
        </Stack>
    );
}

export default function Index({ orders, filters, summary = {}, vendors = [], warehouses = [], tenants = [] }) {
    const mutation = useMutationAction();
    const data = orders?.data || [];
    const columns = [
        { key: 'po_no', label: 'PO No' },
        { key: 'vendor', label: 'Vendor', sx: { minWidth: 220 } },
        { key: 'warehouse', label: 'Warehouse', sx: { minWidth: 180 } },
        { key: 'status', label: 'Status' },
        { key: 'approval', label: 'Approval' },
        { key: 'accounting', label: 'Accounting' },
        { key: 'total', label: 'Total', align: 'right' },
        { key: 'actions', label: 'Actions', align: 'right', sx: { minWidth: 340 } },
    ];
    const [localFilters, setLocalFilters] = React.useState({
        search: filters?.search || '',
        status: filters?.status || '',
        vendor_id: filters?.vendor_id || '',
        warehouse_id: filters?.warehouse_id || '',
        tenant_id: filters?.tenant_id || '',
        from: filters?.from || '',
        to: filters?.to || '',
        per_page: filters?.per_page || orders?.per_page || 25,
        page: 1,
    });
    const filtersRef = React.useRef(localFilters);

    const submitFilters = React.useCallback((nextFilters) => {
        const payload = {};

        if (nextFilters.search?.trim()) payload.search = nextFilters.search.trim();
        if (nextFilters.status) payload.status = nextFilters.status;
        if (nextFilters.vendor_id) payload.vendor_id = nextFilters.vendor_id;
        if (nextFilters.warehouse_id) payload.warehouse_id = nextFilters.warehouse_id;
        if (nextFilters.tenant_id) payload.tenant_id = nextFilters.tenant_id;
        if (nextFilters.from) payload.from = nextFilters.from;
        if (nextFilters.to) payload.to = nextFilters.to;
        payload.per_page = nextFilters.per_page || 25;
        if (Number(nextFilters.page) > 1) payload.page = Number(nextFilters.page);

        router.get(route('procurement.purchase-orders.index'), payload, {
            preserveState: false,
            preserveScroll: true,
            replace: true,
        });
    }, []);

    const debouncedSubmit = React.useMemo(() => debounce((nextFilters) => submitFilters(nextFilters), 350), [submitFilters]);

    React.useEffect(() => () => debouncedSubmit.cancel(), [debouncedSubmit]);

    React.useEffect(() => {
        const next = {
            search: filters?.search || '',
            status: filters?.status || '',
            vendor_id: filters?.vendor_id || '',
            warehouse_id: filters?.warehouse_id || '',
            tenant_id: filters?.tenant_id || '',
            from: filters?.from || '',
            to: filters?.to || '',
            per_page: filters?.per_page || orders?.per_page || 25,
            page: 1,
        };
        filtersRef.current = next;
        setLocalFilters(next);
    }, [filters?.from, filters?.per_page, filters?.search, filters?.status, filters?.tenant_id, filters?.to, filters?.vendor_id, filters?.warehouse_id, orders?.per_page]);

    const updateFilters = React.useCallback(
        (partial, { immediate = false } = {}) => {
            const nextFilters = {
                ...filtersRef.current,
                ...partial,
            };

            if (!Object.prototype.hasOwnProperty.call(partial, 'page')) {
                nextFilters.page = 1;
            }

            filtersRef.current = nextFilters;
            setLocalFilters(nextFilters);

            if (immediate) {
                debouncedSubmit.cancel();
                submitFilters(nextFilters);
                return;
            }

            debouncedSubmit(nextFilters);
        },
        [debouncedSubmit, submitFilters],
    );

    const updateFilter = React.useCallback((name, value, options = {}) => updateFilters({ [name]: value }, options), [updateFilters]);

    const resetFilters = React.useCallback(() => {
        const next = {
            search: '',
            status: '',
            vendor_id: '',
            warehouse_id: '',
            tenant_id: '',
            from: '',
            to: '',
            per_page: localFilters.per_page || 25,
            page: 1,
        };
        debouncedSubmit.cancel();
        filtersRef.current = next;
        setLocalFilters(next);
        submitFilters(next);
    }, [debouncedSubmit, localFilters.per_page, submitFilters]);
    const [historyOpen, setHistoryOpen] = React.useState(false);
    const [historyRows, setHistoryRows] = React.useState([]);
    const [historyTitle, setHistoryTitle] = React.useState('');
    const [loadingHistory, setLoadingHistory] = React.useState(false);

    const openHistory = async (po) => {
        setHistoryTitle(`Approval History - ${po.po_no}`);
        setHistoryRows([]);
        setLoadingHistory(true);
        setHistoryOpen(true);
        try {
            const res = await axios.get(route('procurement.approval-actions.index'), {
                params: { document_type: 'purchase_order', document_id: po.id },
            });
            setHistoryRows(res.data?.actions || []);
        } catch (e) {
            setHistoryRows([]);
        } finally {
            setLoadingHistory(false);
        }
    };

    return (
        <AppPage
            eyebrow="Procurement"
            title="Purchase Orders"
            subtitle="Track approvals, warehouse destinations, vendor commitments, and downstream accounting readiness in a cleaner procurement workspace."
            actions={[
                <Button key="create" variant="contained" component={Link} href={route('procurement.purchase-orders.create')}>
                    New PO
                </Button>,
            ]}
        >
            <Grid container spacing={2.25}>
                <Grid item xs={12} sm={6} lg={2}><StatCard compact label="Orders" value={formatCount(summary.count)} accent /></Grid>
                <Grid item xs={12} sm={6} lg={2}><StatCard compact label="Total Value" value={formatAmount(summary.total_value)} /></Grid>
                <Grid item xs={12} sm={6} lg={2}><StatCard compact label="Draft" value={formatCount(summary.draft)} /></Grid>
                <Grid item xs={12} sm={6} lg={2}><StatCard compact label="Approved" value={formatCount(summary.approved)} /></Grid>
                <Grid item xs={12} sm={6} lg={2}><StatCard compact label="Received" value={formatCount(summary.received)} /></Grid>
                <Grid item xs={12} sm={6} lg={2}><StatCard compact label="Cancelled" value={formatCount(summary.cancelled)} /></Grid>
            </Grid>

            <SurfaceCard
                title="Filter Purchase Orders"
                subtitle="Search by PO, vendor, warehouse, status, or date range with live updates."
                cardSx={{ borderRadius: '18px' }}
                contentSx={{ p: { xs: 1.5, md: 2 }, '&:last-child': { pb: { xs: 1.5, md: 2 } } }}
            >
                <FilterToolbar
                    onReset={resetFilters}
                    onApply={() => submitFilters(localFilters)}
                    lowChrome
                    title="Filters"
                    subtitle="Refine purchase orders by search, status, vendor, warehouse, and date range."
                >
                    <Box>
                        <Grid container spacing={1.25} alignItems="center">
                            <Grid item xs={12} md={3}>
                                <TextField
                                    size="small"
                                    label="Search PO or vendor"
                                    value={localFilters.search}
                                    onChange={(e) => updateFilter('search', e.target.value)}
                                    fullWidth
                                />
                            </Grid>
                            <Grid item xs={12} md={2}>
                                <TextField
                                    size="small"
                                    select
                                    label="Status"
                                    value={localFilters.status}
                                    onChange={(e) => updateFilter('status', e.target.value, { immediate: true })}
                                    fullWidth
                                >
                                    <MenuItem value="">All</MenuItem>
                                    <MenuItem value="draft">Draft</MenuItem>
                                    <MenuItem value="approved">Approved</MenuItem>
                                    <MenuItem value="partially_received">Partially Received</MenuItem>
                                    <MenuItem value="received">Received</MenuItem>
                                    <MenuItem value="cancelled">Cancelled</MenuItem>
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={2}>
                                <TextField
                                    size="small"
                                    select
                                    label="Vendor"
                                    value={localFilters.vendor_id}
                                    onChange={(e) => updateFilter('vendor_id', e.target.value, { immediate: true })}
                                    fullWidth
                                >
                                    <MenuItem value="">All Vendors</MenuItem>
                                    {vendors.map((vendor) => (
                                        <MenuItem key={vendor.id} value={vendor.id}>{vendor.name}</MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={2}>
                                <TextField
                                    size="small"
                                    select
                                    label="Warehouse"
                                    value={localFilters.warehouse_id}
                                    onChange={(e) => updateFilter('warehouse_id', e.target.value, { immediate: true })}
                                    fullWidth
                                >
                                    <MenuItem value="">All Warehouses</MenuItem>
                                    {warehouses.map((warehouse) => (
                                        <MenuItem key={warehouse.id} value={warehouse.id}>{warehouse.name}</MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={2}>
                                <TextField
                                    size="small"
                                    select
                                    label="Restaurant"
                                    value={localFilters.tenant_id}
                                    onChange={(e) => updateFilter('tenant_id', e.target.value, { immediate: true })}
                                    fullWidth
                                >
                                    <MenuItem value="">All Restaurants</MenuItem>
                                    {tenants.map((tenant) => (
                                        <MenuItem key={tenant.id} value={tenant.id}>{tenant.name}</MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <CompactDateRangePicker
                                    from={localFilters.from}
                                    to={localFilters.to}
                                    onChange={({ from, to }) => updateFilters({ from, to }, { immediate: true })}
                                    label="Order Date Range"
                                />
                            </Grid>
                        </Grid>
                    </Box>
                </FilterToolbar>
            </SurfaceCard>

            <SurfaceCard title="Purchase Order Register" subtitle="Operational view of procurement status, approvals, and the receipt-to-bill accounting handoff.">
                <AdminDataTable
                    columns={columns}
                    rows={data}
                    pagination={orders}
                    emptyMessage="No purchase orders."
                    tableMinWidth={1260}
                    renderRow={(po) => (
                        <TableRow
                            key={po.id}
                            hover
                            sx={{
                                '& .MuiTableCell-body': {
                                    py: 1.45,
                                    borderBottomColor: '#edf2f7',
                                },
                            }}
                        >
                            <TableCell sx={{ fontWeight: 700, color: 'text.primary' }}>{po.po_no}</TableCell>
                            <TableCell>{po.vendor?.name}</TableCell>
                            <TableCell>{po.warehouse?.name}</TableCell>
                            <TableCell>
                                <Chip
                                    size="small"
                                    label={String(po.status || '-').replace(/_/g, ' ')}
                                    color={po.status === 'approved' || po.status === 'received' ? 'success' : po.status === 'cancelled' ? 'error' : 'default'}
                                    variant={po.status === 'draft' ? 'outlined' : 'filled'}
                                />
                            </TableCell>
                            <TableCell>{po.latest_approval_action?.action || '-'}</TableCell>
                            <TableCell>
                                <Chip
                                    size="small"
                                    label={po.accounting_status === 'non_posting' ? 'Non-posting' : 'Operational'}
                                    color="default"
                                    variant="outlined"
                                />
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700 }}>{formatAmount(po.grand_total)}</TableCell>
                            <TableCell align="right">
                                <PurchaseOrderRowActions po={po} mutation={mutation} openHistory={openHistory} />
                            </TableCell>
                        </TableRow>
                    )}
                />
            </SurfaceCard>

            <Dialog open={historyOpen} onClose={() => setHistoryOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: '22px' } }}>
                <DialogTitle>{historyTitle}</DialogTitle>
                <DialogContent>
                    {loadingHistory && <Typography>Loading history...</Typography>}
                    {!loadingHistory && (
                        <AdminDataTable
                            columns={[
                                { key: 'action', label: 'Action' },
                                { key: 'by', label: 'By' },
                                { key: 'remarks', label: 'Remarks', sx: { minWidth: 240 } },
                                { key: 'date', label: 'Date' },
                            ]}
                            rows={historyRows}
                            emptyMessage="No approval actions yet."
                            tableMinWidth={720}
                            renderRow={(row) => (
                                <TableRow key={row.id}>
                                    <TableCell>{row.action}</TableCell>
                                    <TableCell>{row.action_by_name || row.action_by || '-'}</TableCell>
                                    <TableCell>{row.remarks || '-'}</TableCell>
                                    <TableCell>{row.created_at || '-'}</TableCell>
                                </TableRow>
                            )}
                        />
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2.5 }}>
                    <Button onClick={() => setHistoryOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>
            <ConfirmActionDialog {...mutation.confirmDialogProps} />
        </AppPage>
    );
}
