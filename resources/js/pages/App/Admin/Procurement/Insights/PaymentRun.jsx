import React from 'react';
import { router, useForm, usePage } from '@inertiajs/react';
import { Alert, Button, Grid, MenuItem, Stack, TableCell, TableRow, TextField, Typography } from '@mui/material';
import debounce from 'lodash.debounce';
import AppPage from '@/components/App/ui/AppPage';
import AdminDataTable from '@/components/App/ui/AdminDataTable';
import FilterToolbar from '@/components/App/ui/FilterToolbar';
import StatCard from '@/components/App/ui/StatCard';
import SurfaceCard from '@/components/App/ui/SurfaceCard';

const initialFilters = (filters, bills) => ({
    search: filters?.search || '',
    vendor_id: filters?.vendor_id || '',
    due_to: filters?.due_to || '',
    min_age_days: filters?.min_age_days || '',
    bucket: filters?.bucket || '',
    per_page: filters?.per_page || bills?.per_page || 25,
    page: 1,
});

export default function PaymentRun({ bills, summary = {}, vendors = [], paymentAccounts = [], filters = {} }) {
    const { errors = {} } = usePage().props;
    const rows = bills?.data || [];
    const [selectedAllocations, setSelectedAllocations] = React.useState({});
    const [localFilters, setLocalFilters] = React.useState(() => initialFilters(filters, bills));
    const filtersRef = React.useRef(localFilters);

    const { data, setData, post, processing, reset } = useForm({
        payment_date: new Date().toISOString().slice(0, 10),
        method: 'bank',
        payment_account_id: '',
        reference: '',
        remarks: 'Batch payment run',
    });

    const submitFilters = React.useCallback((nextFilters) => {
        const payload = {};
        if (nextFilters.search?.trim()) payload.search = nextFilters.search.trim();
        if (nextFilters.vendor_id) payload.vendor_id = nextFilters.vendor_id;
        if (nextFilters.due_to) payload.due_to = nextFilters.due_to;
        if (nextFilters.min_age_days) payload.min_age_days = nextFilters.min_age_days;
        if (nextFilters.bucket) payload.bucket = nextFilters.bucket;
        payload.per_page = nextFilters.per_page || 25;
        if (Number(nextFilters.page) > 1) payload.page = Number(nextFilters.page);

        router.get(route('procurement.payment-run.index'), payload, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    }, []);

    const debouncedSubmit = React.useMemo(() => debounce((next) => submitFilters(next), 350), [submitFilters]);
    React.useEffect(() => () => debouncedSubmit.cancel(), [debouncedSubmit]);
    React.useEffect(() => {
        const next = initialFilters(filters, bills);
        filtersRef.current = next;
        setLocalFilters(next);
    }, [filters, bills?.per_page]);

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

    const setAllocation = (billId, amount) => {
        setSelectedAllocations((prev) => ({ ...prev, [billId]: amount }));
    };

    const autoSelect = () => {
        const next = {};
        rows.forEach((row) => {
            next[row.id] = Number(row.outstanding || 0).toFixed(2);
        });
        setSelectedAllocations(next);
    };

    const clearSelect = () => setSelectedAllocations({});

    const selectedRows = rows
        .map((row) => ({ bill_id: row.id, amount: Number(selectedAllocations[row.id] || 0), vendor_id: row.vendor_id }))
        .filter((row) => row.amount > 0);

    const selectedTotal = selectedRows.reduce((sum, row) => sum + row.amount, 0);
    const selectedVendors = new Set(selectedRows.map((row) => row.vendor_id)).size;

    const runPayment = () => {
        post(route('procurement.payment-run.execute'), {
            data: {
                ...data,
                payment_account_id: data.payment_account_id || null,
                allocations: selectedRows,
            },
            preserveScroll: true,
            onSuccess: () => {
                setSelectedAllocations({});
                reset('reference', 'remarks');
            },
        });
    };

    return (
        <AppPage eyebrow="Procurement" title="Payment Run" subtitle="Select open AP bills and post grouped vendor payments with cleaner filtering, allocation review, and standardized table density.">
            <Grid container spacing={2.25}>
                <Grid item xs={12} md={4}><StatCard label="Open Bills" value={summary.count || 0} accent /></Grid>
                <Grid item xs={12} md={4}><StatCard label="Outstanding" value={Number(summary.outstanding || 0).toFixed(2)} tone="light" /></Grid>
                <Grid item xs={12} md={4}><StatCard label="90+ Overdue" value={Number(summary.overdue_90_plus || 0).toFixed(2)} tone="muted" /></Grid>
            </Grid>

            <SurfaceCard title="Live Filters" subtitle="Narrow the payable queue by vendor, due date, minimum age, and aging bucket with immediate updates.">
                <FilterToolbar
                    onReset={resetFilters}
                    onApply={() => submitFilters(localFilters)}
                    lowChrome
                    title="Filters"
                    subtitle="Refine payment run queue by search, vendor, due date, age, and bucket."
                >
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={3}>
                            <TextField label="Search bill or vendor" value={localFilters.search} onChange={(event) => updateFilters({ search: event.target.value })} fullWidth />
                        </Grid>
                        <Grid item xs={12} md={2.5}>
                            <TextField select label="Vendor" value={localFilters.vendor_id} onChange={(event) => updateFilters({ vendor_id: event.target.value }, { immediate: true })} fullWidth>
                                <MenuItem value="">All Vendors</MenuItem>
                                {vendors.map((vendor) => <MenuItem key={vendor.id} value={vendor.id}>{vendor.name}</MenuItem>)}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <TextField label="Due Before" type="date" value={localFilters.due_to} onChange={(event) => updateFilters({ due_to: event.target.value }, { immediate: true })} InputLabelProps={{ shrink: true }} fullWidth />
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <TextField label="Min Age (Days)" type="number" value={localFilters.min_age_days} onChange={(event) => updateFilters({ min_age_days: event.target.value }, { immediate: true })} fullWidth />
                        </Grid>
                        <Grid item xs={12} md={2.5}>
                            <TextField select label="Bucket" value={localFilters.bucket} onChange={(event) => updateFilters({ bucket: event.target.value }, { immediate: true })} fullWidth>
                                <MenuItem value="">All Buckets</MenuItem>
                                <MenuItem value="0-30">0-30</MenuItem>
                                <MenuItem value="31-60">31-60</MenuItem>
                                <MenuItem value="61-90">61-90</MenuItem>
                                <MenuItem value="90+">90+</MenuItem>
                            </TextField>
                        </Grid>
                    </Grid>
                </FilterToolbar>
            </SurfaceCard>

            <SurfaceCard title="Run Setup" subtitle="Prepare the grouped payment posting details before executing the run.">
                {(errors?.allocations || errors?.payment_account_id) ? (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {errors.allocations || errors.payment_account_id}
                    </Alert>
                ) : null}
                <Grid container spacing={2}>
                    <Grid item xs={12} md={2}>
                        <TextField label="Payment Date" type="date" value={data.payment_date} onChange={(e) => setData('payment_date', e.target.value)} InputLabelProps={{ shrink: true }} fullWidth />
                    </Grid>
                    <Grid item xs={12} md={2}>
                        <TextField select label="Method" value={data.method} onChange={(e) => setData('method', e.target.value)} fullWidth>
                            <MenuItem value="cash">Cash</MenuItem>
                            <MenuItem value="bank">Bank</MenuItem>
                            <MenuItem value="cheque">Cheque</MenuItem>
                            <MenuItem value="online">Online</MenuItem>
                        </TextField>
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <TextField select label="Payment Account" value={data.payment_account_id} onChange={(e) => setData('payment_account_id', e.target.value)} fullWidth>
                            <MenuItem value="">None</MenuItem>
                            {paymentAccounts.map((acc) => <MenuItem key={acc.id} value={acc.id}>{acc.name} ({acc.payment_method})</MenuItem>)}
                        </TextField>
                    </Grid>
                    <Grid item xs={12} md={2}>
                        <TextField label="Reference" value={data.reference} onChange={(e) => setData('reference', e.target.value)} fullWidth />
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <TextField label="Remarks" value={data.remarks} onChange={(e) => setData('remarks', e.target.value)} fullWidth />
                    </Grid>
                </Grid>
                <Stack direction="row" spacing={1.25} sx={{ mt: 2 }} alignItems="center" flexWrap="wrap" useFlexGap>
                    <Button variant="outlined" onClick={autoSelect}>Select All Outstanding</Button>
                    <Button variant="outlined" onClick={clearSelect}>Clear</Button>
                    <Button variant="contained" disabled={processing || selectedRows.length === 0} onClick={runPayment}>
                        Post Payment Run
                    </Button>
                    <Typography color="text.secondary">
                        Selected {selectedRows.length} bills across {selectedVendors} vendors · Total {selectedTotal.toFixed(2)}
                    </Typography>
                </Stack>
            </SurfaceCard>

            <SurfaceCard title="Payable Queue" subtitle="Allocate bill balances directly from the standardized payment run register.">
                <AdminDataTable
                    columns={[
                        { key: 'bill', label: 'Bill No', minWidth: 140 },
                        { key: 'vendor', label: 'Vendor', minWidth: 200 },
                        { key: 'due_date', label: 'Due Date', minWidth: 120 },
                        { key: 'bucket', label: 'Bucket', minWidth: 110 },
                        { key: 'outstanding', label: 'Outstanding', minWidth: 120, align: 'right' },
                        { key: 'allocate', label: 'Allocate', minWidth: 180, align: 'right' },
                    ]}
                    rows={rows}
                    pagination={bills}
                    tableMinWidth={1080}
                    emptyMessage="No payable bills match current filters."
                    renderRow={(row) => (
                        <TableRow key={row.id} hover>
                            <TableCell>{row.bill_no}</TableCell>
                            <TableCell>{row.vendor?.name}</TableCell>
                            <TableCell>{row.due_date || row.bill_date}</TableCell>
                            <TableCell>{row.bucket}</TableCell>
                            <TableCell align="right">{Number(row.outstanding || 0).toFixed(2)}</TableCell>
                            <TableCell align="right" sx={{ width: 180 }}>
                                <TextField
                                    size="small"
                                    type="number"
                                    inputProps={{ min: 0, step: '0.01', max: Number(row.outstanding || 0) }}
                                    value={selectedAllocations[row.id] ?? ''}
                                    onChange={(event) => setAllocation(row.id, event.target.value)}
                                    fullWidth
                                />
                            </TableCell>
                        </TableRow>
                    )}
                />
            </SurfaceCard>
        </AppPage>
    );
}
