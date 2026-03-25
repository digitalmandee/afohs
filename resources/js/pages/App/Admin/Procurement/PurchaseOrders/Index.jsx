import React from 'react';
import { Link, router } from '@inertiajs/react';
import axios from 'axios';
import debounce from 'lodash.debounce';
import { Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Grid, MenuItem, TableCell, TableRow, TextField, Typography } from '@mui/material';
import AdminDataTable from '@/components/App/ui/AdminDataTable';
import AppPage from '@/components/App/ui/AppPage';
import DateRangeFilterFields from '@/components/App/ui/DateRangeFilterFields';
import FilterToolbar from '@/components/App/ui/FilterToolbar';
import SurfaceCard from '@/components/App/ui/SurfaceCard';
import StatCard from '@/components/App/ui/StatCard';

export default function Index({ orders, filters, summary = {}, vendors = [], warehouses = [], tenants = [] }) {
    const data = orders?.data || [];
    const columns = [
        { key: 'po_no', label: 'PO No' },
        { key: 'vendor', label: 'Vendor', sx: { minWidth: 220 } },
        { key: 'warehouse', label: 'Warehouse', sx: { minWidth: 180 } },
        { key: 'status', label: 'Status' },
        { key: 'approval', label: 'Approval' },
        { key: 'accounting', label: 'Accounting' },
        { key: 'total', label: 'Total', align: 'right' },
        { key: 'actions', label: 'Actions', align: 'right', sx: { minWidth: 240 } },
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
                <Grid item xs={12} md={2}><StatCard label="Orders" value={summary.count || 0} accent /></Grid>
                <Grid item xs={12} md={3}><StatCard label="Total Value" value={Number(summary.total_value || 0).toFixed(2)} /></Grid>
                <Grid item xs={12} md={2}><StatCard label="Draft" value={summary.draft || 0} /></Grid>
                <Grid item xs={12} md={2}><StatCard label="Approved" value={summary.approved || 0} /></Grid>
                <Grid item xs={12} md={2}><StatCard label="Received" value={summary.received || 0} /></Grid>
                <Grid item xs={12} md={1}><StatCard label="Cancelled" value={summary.cancelled || 0} /></Grid>
            </Grid>

            <SurfaceCard
                title="Filter Purchase Orders"
                subtitle="Search by PO, vendor, warehouse, status, or date range with live updates."
                cardSx={{ borderRadius: '18px' }}
                contentSx={{ p: { xs: 1.5, md: 2 }, '&:last-child': { pb: { xs: 1.5, md: 2 } } }}
            >
                <FilterToolbar onReset={resetFilters}>
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
                            <DateRangeFilterFields
                                startValue={localFilters.from}
                                endValue={localFilters.to}
                                onStartChange={(value) => updateFilter('from', value, { immediate: true })}
                                onEndChange={(value) => updateFilter('to', value, { immediate: true })}
                                startGrid={{ xs: 12, md: 1.5 }}
                                endGrid={{ xs: 12, md: 1.5 }}
                            />
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
                    tableMinWidth={1060}
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
                            <TableCell align="right" sx={{ fontWeight: 700 }}>{Number(po.grand_total || 0).toFixed(2)}</TableCell>
                            <TableCell align="right">
                                {po.status === 'draft' && (
                                    <>
                                        <Button size="small" onClick={() => router.post(route('procurement.purchase-orders.submit', po.id))}>Submit</Button>
                                        <Button size="small" color="success" onClick={() => router.post(route('procurement.purchase-orders.approve', po.id))}>Approve</Button>
                                        <Button size="small" color="error" onClick={() => router.post(route('procurement.purchase-orders.reject', po.id))}>Reject</Button>
                                    </>
                                )}
                                <Button size="small" onClick={() => openHistory(po)}>History</Button>
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
        </AppPage>
    );
}
