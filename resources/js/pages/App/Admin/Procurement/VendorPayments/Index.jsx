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

export default function Index({ payments, filters, summary = {}, vendors = [], paymentAccounts = [] }) {
    const rows = payments?.data || [];
    const [historyOpen, setHistoryOpen] = React.useState(false);
    const [historyRows, setHistoryRows] = React.useState([]);
    const [historyTitle, setHistoryTitle] = React.useState('');
    const [loadingHistory, setLoadingHistory] = React.useState(false);
    const [localFilters, setLocalFilters] = React.useState({
        search: filters?.search || '',
        status: filters?.status || '',
        method: filters?.method || '',
        vendor_id: filters?.vendor_id || '',
        payment_account_id: filters?.payment_account_id || '',
        from: filters?.from || '',
        to: filters?.to || '',
        per_page: filters?.per_page || payments?.per_page || 25,
        page: 1,
    });
    const filtersRef = React.useRef(localFilters);

    const submitFilters = React.useCallback((nextFilters) => {
        const payload = {};
        if (nextFilters.search?.trim()) payload.search = nextFilters.search.trim();
        if (nextFilters.status) payload.status = nextFilters.status;
        if (nextFilters.method) payload.method = nextFilters.method;
        if (nextFilters.vendor_id) payload.vendor_id = nextFilters.vendor_id;
        if (nextFilters.payment_account_id) payload.payment_account_id = nextFilters.payment_account_id;
        if (nextFilters.from) payload.from = nextFilters.from;
        if (nextFilters.to) payload.to = nextFilters.to;
        payload.per_page = nextFilters.per_page || 25;
        if (Number(nextFilters.page) > 1) payload.page = Number(nextFilters.page);

        router.get(route('procurement.vendor-payments.index'), payload, {
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
            method: filters?.method || '',
            vendor_id: filters?.vendor_id || '',
            payment_account_id: filters?.payment_account_id || '',
            from: filters?.from || '',
            to: filters?.to || '',
            per_page: filters?.per_page || payments?.per_page || 25,
            page: 1,
        };
        filtersRef.current = next;
        setLocalFilters(next);
    }, [filters?.from, filters?.method, filters?.payment_account_id, filters?.per_page, filters?.search, filters?.status, filters?.to, filters?.vendor_id, payments?.per_page]);

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
            method: '',
            vendor_id: '',
            payment_account_id: '',
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

    const openHistory = async (payment) => {
        setHistoryTitle(`Approval History - ${payment.payment_no}`);
        setHistoryRows([]);
        setLoadingHistory(true);
        setHistoryOpen(true);
        try {
            const res = await axios.get(route('procurement.approval-actions.index'), {
                params: { document_type: 'vendor_payment', document_id: payment.id },
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
            title="Vendor Payments"
            subtitle="Control AP disbursements with clearer filter behavior, posting visibility, and approval tracking."
            actions={[
                <Button key="create" variant="contained" component={Link} href={route('procurement.vendor-payments.create')}>
                    New Payment
                </Button>,
            ]}
        >
            <Grid container spacing={2.25}>
                <Grid item xs={12} md={3}><StatCard label="Payments" value={summary.count || 0} /></Grid>
                <Grid item xs={12} md={3}><StatCard label="Total Amount" value={Number(summary.total_amount || 0).toFixed(2)} /></Grid>
                <Grid item xs={12} md={3}><StatCard label="Posted" value={summary.posted || 0} tone="light" /></Grid>
                <Grid item xs={12} md={3}><StatCard label="Void" value={summary.void || 0} tone="light" /></Grid>
            </Grid>

            <SurfaceCard title="Live Filters" subtitle="Results update automatically while searching and changing payment attributes.">
                <FilterToolbar onReset={resetFilters}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={2}>
                            <TextField
                                label="Search payment/vendor"
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
                                <MenuItem value="void">Void</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <TextField
                                select
                                label="Method"
                                value={localFilters.method}
                                onChange={(e) => updateFilters({ method: e.target.value }, { immediate: true })}
                                fullWidth
                            >
                                <MenuItem value="">All Methods</MenuItem>
                                <MenuItem value="cash">Cash</MenuItem>
                                <MenuItem value="bank">Bank</MenuItem>
                                <MenuItem value="cheque">Cheque</MenuItem>
                                <MenuItem value="online">Online</MenuItem>
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
                                label="Payment Account"
                                value={localFilters.payment_account_id}
                                onChange={(e) => updateFilters({ payment_account_id: e.target.value }, { immediate: true })}
                                fullWidth
                            >
                                <MenuItem value="">All Accounts</MenuItem>
                                {paymentAccounts.map((acc) => (
                                    <MenuItem key={acc.id} value={acc.id}>{acc.name}</MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={1}>
                            <TextField
                                label="From"
                                type="date"
                                value={localFilters.from}
                                onChange={(e) => updateFilters({ from: e.target.value }, { immediate: true })}
                                InputLabelProps={{ shrink: true }}
                                fullWidth
                            />
                        </Grid>
                        <Grid item xs={12} md={1}>
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

            <SurfaceCard title="Vendor Payment Register" subtitle="Operational payment list with approval history and GL status in one place.">
                <TableContainer className="premium-scroll">
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={tableHeadSx}>
                                <TableCell>Payment No</TableCell>
                                <TableCell>Vendor</TableCell>
                                <TableCell>Date</TableCell>
                                <TableCell>Method</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Approval</TableCell>
                                <TableCell>GL</TableCell>
                                <TableCell align="right">Amount</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {rows.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={9} align="center" sx={{ py: 5 }}>
                                        No payments found.
                                    </TableCell>
                                </TableRow>
                            )}
                            {rows.map((payment) => (
                                <TableRow key={payment.id} hover sx={{ '& .MuiTableCell-body': { py: 1.45, borderBottomColor: '#edf2f7' } }}>
                                    <TableCell sx={{ fontWeight: 700, color: 'text.primary' }}>{payment.payment_no}</TableCell>
                                    <TableCell>{payment.vendor?.name || '-'}</TableCell>
                                    <TableCell>{payment.payment_date || '-'}</TableCell>
                                    <TableCell>{payment.method || '-'}</TableCell>
                                    <TableCell>{payment.status || '-'}</TableCell>
                                    <TableCell>{payment.latest_approval_action?.action || '-'}</TableCell>
                                    <TableCell>
                                        <Chip
                                            size="small"
                                            label={payment.gl_posted ? 'Posted' : 'Pending'}
                                            color={payment.gl_posted ? 'success' : 'warning'}
                                            variant={payment.gl_posted ? 'filled' : 'outlined'}
                                        />
                                    </TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 700 }}>{Number(payment.amount || 0).toFixed(2)}</TableCell>
                                    <TableCell align="right">
                                        {payment.status === 'draft' && (
                                            <>
                                                <Button size="small" component={Link} href={route('procurement.vendor-payments.edit', payment.id)}>Edit</Button>
                                                <Button size="small" onClick={() => router.post(route('procurement.vendor-payments.submit', payment.id))}>Submit</Button>
                                                <Button size="small" color="success" onClick={() => router.post(route('procurement.vendor-payments.approve', payment.id))}>Approve</Button>
                                                <Button size="small" color="error" onClick={() => router.post(route('procurement.vendor-payments.reject', payment.id))}>Reject</Button>
                                            </>
                                        )}
                                        <Button size="small" onClick={() => openHistory(payment)}>History</Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
                <Pagination data={payments} />
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
