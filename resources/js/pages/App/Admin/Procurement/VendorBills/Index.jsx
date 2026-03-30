import React from 'react';
import { Link, router } from '@inertiajs/react';
import axios from 'axios';
import debounce from 'lodash.debounce';
import {
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    MenuItem,
    TableCell,
    TableRow,
    TextField,
    Typography,
} from '@mui/material';
import AdminDataTable from '@/components/App/ui/AdminDataTable';
import AppPage from '@/components/App/ui/AppPage';
import CompactDateRangePicker from '@/components/App/ui/CompactDateRangePicker';
import FilterToolbar from '@/components/App/ui/FilterToolbar';
import SurfaceCard from '@/components/App/ui/SurfaceCard';
import StatCard from '@/components/App/ui/StatCard';
import { formatAmount, formatCount } from '@/lib/formatting';

export default function Index({ bills, filters, summary = {}, vendors = [], tenants = [] }) {
    const rows = bills?.data || [];
    const columns = [
        { key: 'bill_no', label: 'Bill No' },
        { key: 'vendor', label: 'Vendor', sx: { minWidth: 220 } },
        { key: 'date', label: 'Date' },
        { key: 'status', label: 'Status' },
        { key: 'approval', label: 'Approval' },
        { key: 'gl', label: 'GL' },
        { key: 'total', label: 'Total', align: 'right' },
        { key: 'actions', label: 'Actions', align: 'right', sx: { minWidth: 240 } },
    ];
    const [historyOpen, setHistoryOpen] = React.useState(false);
    const [historyRows, setHistoryRows] = React.useState([]);
    const [historyTitle, setHistoryTitle] = React.useState('');
    const [loadingHistory, setLoadingHistory] = React.useState(false);
    const [localFilters, setLocalFilters] = React.useState({
        search: filters?.search || '',
        status: filters?.status || '',
        vendor_id: filters?.vendor_id || '',
        tenant_id: filters?.tenant_id || '',
        from: filters?.from || '',
        to: filters?.to || '',
        per_page: filters?.per_page || bills?.per_page || 25,
        page: 1,
    });
    const filtersRef = React.useRef(localFilters);

    const submitFilters = React.useCallback((nextFilters) => {
        const payload = {};
        if (nextFilters.search?.trim()) payload.search = nextFilters.search.trim();
        if (nextFilters.status) payload.status = nextFilters.status;
        if (nextFilters.vendor_id) payload.vendor_id = nextFilters.vendor_id;
        if (nextFilters.tenant_id) payload.tenant_id = nextFilters.tenant_id;
        if (nextFilters.from) payload.from = nextFilters.from;
        if (nextFilters.to) payload.to = nextFilters.to;
        payload.per_page = nextFilters.per_page || 25;
        if (Number(nextFilters.page) > 1) payload.page = Number(nextFilters.page);

        router.get(route('procurement.vendor-bills.index'), payload, {
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
            tenant_id: filters?.tenant_id || '',
            from: filters?.from || '',
            to: filters?.to || '',
            per_page: filters?.per_page || bills?.per_page || 25,
            page: 1,
        };
        filtersRef.current = next;
        setLocalFilters(next);
    }, [bills?.per_page, filters?.from, filters?.per_page, filters?.search, filters?.status, filters?.tenant_id, filters?.to, filters?.vendor_id]);

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

    const resetFilters = React.useCallback(() => {
        const next = {
            search: '',
            status: '',
            vendor_id: '',
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

    const openHistory = async (bill) => {
        setHistoryTitle(`Approval History - ${bill.bill_no}`);
        setHistoryRows([]);
        setLoadingHistory(true);
        setHistoryOpen(true);
        try {
            const res = await axios.get(route('procurement.approval-actions.index'), {
                params: { document_type: 'vendor_bill', document_id: bill.id },
            });
            setHistoryRows(res.data?.actions || []);
        } catch (error) {
            setHistoryRows([]);
        } finally {
            setLoadingHistory(false);
        }
    };

    return (
        <AppPage
            eyebrow="Procurement"
            title="Vendor Bills"
            subtitle="Track AP obligations, approvals, and GL posting from one standardized bill register."
            actions={[
                <Button key="create" variant="contained" component={Link} href={route('procurement.vendor-bills.create')}>
                    New Bill
                </Button>,
            ]}
        >
            <Grid container spacing={2.25}>
                <Grid item xs={12} md={3}><StatCard label="Bills" value={formatCount(summary.count)} /></Grid>
                <Grid item xs={12} md={3}><StatCard label="Total Value" value={formatAmount(summary.total_value)} /></Grid>
                <Grid item xs={12} md={3}><StatCard label="Outstanding" value={formatAmount(summary.outstanding)} tone="light" /></Grid>
                <Grid item xs={12} md={3}><StatCard label="Posted" value={formatCount(summary.posted)} tone="light" /></Grid>
            </Grid>

            <SurfaceCard title="Live Filters" subtitle="Results update automatically while you search, choose vendor/status, or adjust dates.">
                <FilterToolbar onReset={resetFilters}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={3}>
                            <TextField
                                label="Search bill or vendor"
                                value={localFilters.search}
                                onChange={(e) => updateFilters({ search: e.target.value })}
                                fullWidth
                            />
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <TextField
                                select
                                label="Status"
                                value={localFilters.status}
                                onChange={(e) => updateFilters({ status: e.target.value }, { immediate: true })}
                                fullWidth
                            >
                                <MenuItem value="">All</MenuItem>
                                <MenuItem value="draft">Draft</MenuItem>
                                <MenuItem value="posted">Posted</MenuItem>
                                <MenuItem value="partially_paid">Partially Paid</MenuItem>
                                <MenuItem value="paid">Paid</MenuItem>
                                <MenuItem value="void">Void</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <TextField
                                select
                                label="Vendor"
                                value={localFilters.vendor_id}
                                onChange={(e) => updateFilters({ vendor_id: e.target.value }, { immediate: true })}
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
                                select
                                label="Restaurant"
                                value={localFilters.tenant_id}
                                onChange={(e) => updateFilters({ tenant_id: e.target.value }, { immediate: true })}
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
                                label="Bill Date Range"
                            />
                        </Grid>
                    </Grid>
                </FilterToolbar>
            </SurfaceCard>

            <SurfaceCard title="Vendor Bill Register" subtitle="Operational bill list with approval history, posting status, and consistent table density.">
                <AdminDataTable
                    columns={columns}
                    rows={rows}
                    pagination={bills}
                    emptyMessage="No bills found."
                    tableMinWidth={1040}
                    renderRow={(bill) => (
                        <TableRow key={bill.id} hover sx={{ '& .MuiTableCell-body': { py: 1.45, borderBottomColor: '#edf2f7' } }}>
                            <TableCell sx={{ fontWeight: 700, color: 'text.primary' }}>{bill.bill_no}</TableCell>
                            <TableCell>{bill.vendor?.name || '-'}</TableCell>
                            <TableCell>{bill.bill_date || '-'}</TableCell>
                            <TableCell>{bill.status || '-'}</TableCell>
                            <TableCell>{bill.latest_approval_action?.action || '-'}</TableCell>
                            <TableCell>
                                <Typography sx={{ fontWeight: 700, color: 'text.primary' }}>{String(bill.accounting_status || (bill.gl_posted ? 'posted' : 'pending')).replaceAll('_', ' ')}</Typography>
                                {bill.accounting_failure_reason ? (
                                    <Typography variant="body2" color="error.main">{bill.accounting_failure_reason}</Typography>
                                ) : (
                                    <Chip
                                        size="small"
                                        label={bill.gl_posted ? 'Posted' : 'Pending'}
                                        color={bill.gl_posted ? 'success' : 'warning'}
                                        variant={bill.gl_posted ? 'filled' : 'outlined'}
                                    />
                                )}
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700 }}>{formatAmount(bill.grand_total)}</TableCell>
                            <TableCell align="right">
                                {bill.status === 'draft' && (
                                    <>
                                        <Button size="small" component={Link} href={route('procurement.vendor-bills.edit', bill.id)}>Edit</Button>
                                        <Button size="small" onClick={() => router.post(route('procurement.vendor-bills.submit', bill.id))}>Submit</Button>
                                        <Button size="small" color="success" onClick={() => router.post(route('procurement.vendor-bills.approve', bill.id))}>Approve</Button>
                                        <Button size="small" color="error" onClick={() => router.post(route('procurement.vendor-bills.reject', bill.id))}>Reject</Button>
                                    </>
                                )}
                                <Button size="small" onClick={() => openHistory(bill)}>History</Button>
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
