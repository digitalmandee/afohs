import React from 'react';
import { Link, router } from '@inertiajs/react';
import { Alert, Button, Chip, Grid, MenuItem, TableCell, TableRow, TextField, Typography } from '@mui/material';
import debounce from 'lodash.debounce';
import AppPage from '@/components/App/ui/AppPage';
import AdminDataTable from '@/components/App/ui/AdminDataTable';
import CompactDateRangePicker from '@/components/App/ui/CompactDateRangePicker';
import FilterToolbar from '@/components/App/ui/FilterToolbar';
import StatCard from '@/components/App/ui/StatCard';
import SurfaceCard from '@/components/App/ui/SurfaceCard';

const typeMeta = {
    unbilled: { label: 'Unbilled', color: 'warning' },
    over_billed: { label: 'Over Billed', color: 'error' },
    under_billed: { label: 'Under Billed', color: 'info' },
    price_variance: { label: 'Price Variance', color: 'secondary' },
    matched: { label: 'Matched', color: 'success' },
};

const initialFilters = (filters, rows) => ({
    search: filters?.search || '',
    vendor_id: filters?.vendor_id || '',
    type: filters?.type || '',
    from: filters?.from || '',
    to: filters?.to || '',
    show_matched: Number(filters?.show_matched || 0),
    per_page: filters?.per_page || rows?.per_page || 25,
    page: 1,
});

export default function Discrepancies({ rows, summary = {}, vendors = [], filters = {}, error }) {
    const list = rows?.data || [];
    const [localFilters, setLocalFilters] = React.useState(() => initialFilters(filters, rows));
    const filtersRef = React.useRef(localFilters);

    const submitFilters = React.useCallback((nextFilters) => {
        const payload = {};
        if (nextFilters.search?.trim()) payload.search = nextFilters.search.trim();
        if (nextFilters.vendor_id) payload.vendor_id = nextFilters.vendor_id;
        if (nextFilters.type) payload.type = nextFilters.type;
        if (nextFilters.from) payload.from = nextFilters.from;
        if (nextFilters.to) payload.to = nextFilters.to;
        if (nextFilters.show_matched) payload.show_matched = 1;
        payload.per_page = nextFilters.per_page || 25;
        if (Number(nextFilters.page) > 1) payload.page = Number(nextFilters.page);

        router.get(route('procurement.insights.discrepancies'), payload, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    }, []);

    const debouncedSubmit = React.useMemo(() => debounce((next) => submitFilters(next), 350), [submitFilters]);
    React.useEffect(() => () => debouncedSubmit.cancel(), [debouncedSubmit]);
    React.useEffect(() => {
        const next = initialFilters(filters, rows);
        filtersRef.current = next;
        setLocalFilters(next);
    }, [filters, rows?.per_page]);

    const updateFilters = React.useCallback((partial, { immediate = false } = {}) => {
        const next = { ...filtersRef.current, ...partial, page: 1 };
        filtersRef.current = next;
        setLocalFilters(next);
        if (immediate) {
            debouncedSubmit.cancel();
            submitFilters(next);
            return;
        }
        debouncedSubmit(next);
    }, [debouncedSubmit, submitFilters]);

    const resetFilters = React.useCallback(() => {
        const next = initialFilters({}, { per_page: filtersRef.current.per_page });
        debouncedSubmit.cancel();
        filtersRef.current = next;
        setLocalFilters(next);
        submitFilters(next);
    }, [debouncedSubmit, submitFilters]);

    return (
        <AppPage eyebrow="Procurement" title="3-Way Match Queue" subtitle="Monitor PO, GRN, and vendor bill mismatches in a cleaner operational view with live filtering and faster follow-up actions.">
            {error ? <Alert severity="warning" variant="outlined">{error}</Alert> : null}

            <Grid container spacing={2.25}>
                <Grid item xs={12} md={2}><StatCard label="Queue Items" value={summary.total || 0} accent /></Grid>
                <Grid item xs={12} md={2}><StatCard label="Unbilled" value={summary.unbilled || 0} tone="light" /></Grid>
                <Grid item xs={12} md={2}><StatCard label="Over Billed" value={summary.over_billed || 0} tone="light" /></Grid>
                <Grid item xs={12} md={2}><StatCard label="Under Billed" value={summary.under_billed || 0} tone="light" /></Grid>
                <Grid item xs={12} md={2}><StatCard label="Price Variance" value={summary.price_variance || 0} tone="light" /></Grid>
                <Grid item xs={12} md={2}><StatCard label="Matched" value={summary.matched || 0} tone="muted" /></Grid>
            </Grid>

            <SurfaceCard title="Live Filters" subtitle="Search the queue by GRN, PO, vendor, date range, and queue type without the old manual submit flow.">
                <FilterToolbar onReset={resetFilters}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={3}>
                            <TextField label="Search GRN / PO / vendor" value={localFilters.search} onChange={(event) => updateFilters({ search: event.target.value })} fullWidth />
                        </Grid>
                        <Grid item xs={12} md={2.5}>
                            <TextField select label="Vendor" value={localFilters.vendor_id} onChange={(event) => updateFilters({ vendor_id: event.target.value }, { immediate: true })} fullWidth>
                                <MenuItem value="">All Vendors</MenuItem>
                                {vendors.map((vendor) => <MenuItem key={vendor.id} value={vendor.id}>{vendor.name}</MenuItem>)}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={2.5}>
                            <TextField select label="Queue Type" value={localFilters.type} onChange={(event) => updateFilters({ type: event.target.value }, { immediate: true })} fullWidth>
                                <MenuItem value="">All Types</MenuItem>
                                <MenuItem value="unbilled">Unbilled</MenuItem>
                                <MenuItem value="over_billed">Over Billed</MenuItem>
                                <MenuItem value="under_billed">Under Billed</MenuItem>
                                <MenuItem value="price_variance">Price Variance</MenuItem>
                                <MenuItem value="matched">Matched</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={2.5}>
                            <CompactDateRangePicker
                                from={localFilters.from}
                                to={localFilters.to}
                                onChange={({ from, to }) => updateFilters({ from, to }, { immediate: true })}
                                label="Received Date Range"
                            />
                        </Grid>
                        <Grid item xs={12} md={1}>
                            <TextField select label="Matched" value={localFilters.show_matched} onChange={(event) => updateFilters({ show_matched: Number(event.target.value) }, { immediate: true })} fullWidth>
                                <MenuItem value={0}>Hide</MenuItem>
                                <MenuItem value={1}>Show</MenuItem>
                            </TextField>
                        </Grid>
                    </Grid>
                </FilterToolbar>
            </SurfaceCard>

            <SurfaceCard title="Discrepancy Register" subtitle="Queue entries with commercial delta, price variance, and follow-up action in one standardized table.">
                <AdminDataTable
                    columns={[
                        { key: 'grn', label: 'GRN', minWidth: 140 },
                        { key: 'po', label: 'PO', minWidth: 140 },
                        { key: 'vendor', label: 'Vendor', minWidth: 180 },
                        { key: 'type', label: 'Type', minWidth: 140 },
                        { key: 'received_date', label: 'Received', minWidth: 120 },
                        { key: 'grn_total', label: 'GRN Total', minWidth: 120, align: 'right' },
                        { key: 'billed_total', label: 'Billed Total', minWidth: 120, align: 'right' },
                        { key: 'delta', label: 'Delta', minWidth: 120, align: 'right' },
                        { key: 'variance', label: 'Price Variance', minWidth: 140, align: 'right' },
                        { key: 'action', label: 'Action', minWidth: 150, align: 'right' },
                    ]}
                    rows={list}
                    pagination={rows}
                    tableMinWidth={1420}
                    emptyMessage="No discrepancy records found."
                    renderRow={(row) => (
                        <TableRow key={row.id} hover>
                            <TableCell>{row.grn_no}</TableCell>
                            <TableCell>{row.po_no}</TableCell>
                            <TableCell>{row.vendor_name}</TableCell>
                            <TableCell>
                                <Chip size="small" variant="outlined" label={typeMeta[row.type]?.label || row.type} color={typeMeta[row.type]?.color || 'default'} />
                            </TableCell>
                            <TableCell>{row.received_date}</TableCell>
                            <TableCell align="right">{Number(row.receipt_total || 0).toFixed(2)}</TableCell>
                            <TableCell align="right">{Number(row.billed_total || 0).toFixed(2)}</TableCell>
                            <TableCell align="right">{Number(row.delta_amount || 0).toFixed(2)}</TableCell>
                            <TableCell align="right">{Number(row.price_variance_amount || 0).toFixed(2)}</TableCell>
                            <TableCell align="right">
                                {row.type === 'unbilled' ? (
                                    <Button size="small" component={Link} href={route('procurement.vendor-bills.create', { goods_receipt_id: row.id })}>
                                        Create Bill
                                    </Button>
                                ) : (
                                    <Typography variant="body2" color="text.secondary">Review</Typography>
                                )}
                            </TableCell>
                        </TableRow>
                    )}
                />
            </SurfaceCard>
        </AppPage>
    );
}
