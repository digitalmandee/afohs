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
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from '@mui/material';
import Pagination from '@/components/Pagination';
import AppPage from '@/components/App/ui/AppPage';
import FilterToolbar from '@/components/App/ui/FilterToolbar';
import SurfaceCard from '@/components/App/ui/SurfaceCard';
import StatCard from '@/components/App/ui/StatCard';

const tableHeadSx = {
    '& .MuiTableCell-head': {
        bgcolor: '#0a3d62',
        color: '#f8fafc',
        borderBottom: 'none',
        fontSize: '0.74rem',
        fontWeight: 700,
        py: 1.35,
    },
    '& .MuiTableCell-head:first-of-type': { borderTopLeftRadius: 16 },
    '& .MuiTableCell-head:last-of-type': { borderTopRightRadius: 16 },
};

export default function Index({ bills, filters, summary = {}, vendors = [] }) {
    const rows = bills?.data || [];
    const [historyOpen, setHistoryOpen] = React.useState(false);
    const [historyRows, setHistoryRows] = React.useState([]);
    const [historyTitle, setHistoryTitle] = React.useState('');
    const [loadingHistory, setLoadingHistory] = React.useState(false);
    const [localFilters, setLocalFilters] = React.useState({
        search: filters?.search || '',
        status: filters?.status || '',
        vendor_id: filters?.vendor_id || '',
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
            from: filters?.from || '',
            to: filters?.to || '',
            per_page: filters?.per_page || bills?.per_page || 25,
            page: 1,
        };
        filtersRef.current = next;
        setLocalFilters(next);
    }, [bills?.per_page, filters?.from, filters?.per_page, filters?.search, filters?.status, filters?.to, filters?.vendor_id]);

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
                <Grid item xs={12} md={3}><StatCard label="Bills" value={summary.count || 0} /></Grid>
                <Grid item xs={12} md={3}><StatCard label="Total Value" value={Number(summary.total_value || 0).toFixed(2)} /></Grid>
                <Grid item xs={12} md={3}><StatCard label="Outstanding" value={Number(summary.outstanding || 0).toFixed(2)} tone="light" /></Grid>
                <Grid item xs={12} md={3}><StatCard label="Posted" value={summary.posted || 0} tone="light" /></Grid>
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
                                label="From"
                                type="date"
                                value={localFilters.from}
                                onChange={(e) => updateFilters({ from: e.target.value }, { immediate: true })}
                                InputLabelProps={{ shrink: true }}
                                fullWidth
                            />
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <TextField
                                label="To"
                                type="date"
                                value={localFilters.to}
                                onChange={(e) => updateFilters({ to: e.target.value }, { immediate: true })}
                                InputLabelProps={{ shrink: true }}
                                fullWidth
                            />
                        </Grid>
                    </Grid>
                </FilterToolbar>
            </SurfaceCard>

            <SurfaceCard title="Vendor Bill Register" subtitle="Operational bill list with approval history, posting status, and consistent table density.">
                <TableContainer className="premium-scroll">
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={tableHeadSx}>
                                <TableCell>Bill No</TableCell>
                                <TableCell>Vendor</TableCell>
                                <TableCell>Date</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Approval</TableCell>
                                <TableCell>GL</TableCell>
                                <TableCell align="right">Total</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {rows.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={8} align="center" sx={{ py: 5 }}>
                                        No bills found.
                                    </TableCell>
                                </TableRow>
                            )}
                            {rows.map((bill) => (
                                <TableRow key={bill.id} hover sx={{ '& .MuiTableCell-body': { py: 1.45, borderBottomColor: '#edf2f7' } }}>
                                    <TableCell sx={{ fontWeight: 700, color: 'text.primary' }}>{bill.bill_no}</TableCell>
                                    <TableCell>{bill.vendor?.name || '-'}</TableCell>
                                    <TableCell>{bill.bill_date || '-'}</TableCell>
                                    <TableCell>{bill.status || '-'}</TableCell>
                                    <TableCell>{bill.latest_approval_action?.action || '-'}</TableCell>
                                    <TableCell>
                                        <Chip
                                            size="small"
                                            label={bill.gl_posted ? 'Posted' : 'Pending'}
                                            color={bill.gl_posted ? 'success' : 'warning'}
                                            variant={bill.gl_posted ? 'filled' : 'outlined'}
                                        />
                                    </TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 700 }}>{Number(bill.grand_total || 0).toFixed(2)}</TableCell>
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
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
                <Pagination data={bills} />
            </SurfaceCard>

            <Dialog open={historyOpen} onClose={() => setHistoryOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: '22px' } }}>
                <DialogTitle>{historyTitle}</DialogTitle>
                <DialogContent>
                    {loadingHistory && <Typography>Loading history...</Typography>}
                    {!loadingHistory && (
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Action</TableCell>
                                    <TableCell>By</TableCell>
                                    <TableCell>Remarks</TableCell>
                                    <TableCell>Date</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {historyRows.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} align="center">No approval actions yet.</TableCell>
                                    </TableRow>
                                )}
                                {historyRows.map((row) => (
                                    <TableRow key={row.id}>
                                        <TableCell>{row.action}</TableCell>
                                        <TableCell>{row.action_by_name || row.action_by || '-'}</TableCell>
                                        <TableCell>{row.remarks || '-'}</TableCell>
                                        <TableCell>{row.created_at || '-'}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2.5 }}>
                    <Button onClick={() => setHistoryOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>
        </AppPage>
    );
}
