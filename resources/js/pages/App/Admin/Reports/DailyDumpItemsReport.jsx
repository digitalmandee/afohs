import React from 'react';
import { Head, router } from '@inertiajs/react';
import { Autocomplete, Button, Checkbox, FormControlLabel, Grid, MenuItem, TableCell, TableRow, TextField } from '@mui/material';
import AppPage from '@/components/App/ui/AppPage';
import AdminDataTable from '@/components/App/ui/AdminDataTable';
import DateRangeFilterFields from '@/components/App/ui/DateRangeFilterFields';
import FilterToolbar from '@/components/App/ui/FilterToolbar';
import StatCard from '@/components/App/ui/StatCard';
import SurfaceCard from '@/components/App/ui/SurfaceCard';
import useFilterLoadingState from '@/hooks/useFilterLoadingState';
import { formatReportCurrency, normalizeIntArray, normalizeStringArray } from './posReportShared';

const CUSTOMER_TYPE_OPTIONS = [
    { label: 'Member', value: 'member' },
    { label: 'Guest', value: 'guest' },
    { label: 'Employee', value: 'employee' },
];

const PAYMENT_STATUS_OPTIONS = [
    { label: 'Advance', value: 'advance' },
    { label: 'Paid', value: 'paid' },
    { label: 'Unpaid', value: 'unpaid' },
];

export default function DailyDumpItemsReport({
    dumpItemsData = [],
    tenants = [],
    waiters = [],
    cashiers = [],
    cancelledByUsers = [],
    startDate,
    endDate,
    totalQuantity = 0,
    totalSalePrice = 0,
    totalFoodValue = 0,
    filters = {},
}) {
    const [dateFilters, setDateFilters] = React.useState({
        start_date: filters?.start_date || startDate || '',
        end_date: filters?.end_date || endDate || '',
        tenant_ids: normalizeIntArray(filters?.tenant_ids),
        waiter_ids: normalizeIntArray(filters?.waiter_ids),
        cashier_ids: normalizeIntArray(filters?.cashier_ids),
        cancelled_by_ids: normalizeIntArray(filters?.cancelled_by_ids),
        customer_types: normalizeStringArray(filters?.customer_types),
        payment_statuses: normalizeStringArray(filters?.payment_statuses),
        customer_search: filters?.customer_search || '',
        category_names: normalizeStringArray(filters?.category_names),
        item_search: filters?.item_search || '',
        discounted_only: Boolean(filters?.discounted_only) && String(filters?.discounted_only) !== '0',
        taxed_only: Boolean(filters?.taxed_only) && String(filters?.taxed_only) !== '0',
    });
    const { loading, beginLoading } = useFilterLoadingState([
        dumpItemsData.length,
        filters?.end_date,
        filters?.start_date,
        filters?.customer_search,
        filters?.item_search,
    ]);

    const applyFilters = React.useCallback(() => {
        beginLoading();
        router.get(route('admin.reports.pos.daily-dump-items-report'), {
            ...dateFilters,
            tenant_ids: dateFilters.tenant_ids.join(','),
            waiter_ids: dateFilters.waiter_ids.join(','),
            cashier_ids: dateFilters.cashier_ids.join(','),
            cancelled_by_ids: dateFilters.cancelled_by_ids.join(','),
            customer_types: dateFilters.customer_types.join(','),
            payment_statuses: dateFilters.payment_statuses.join(','),
            category_names: dateFilters.category_names.join(','),
        }, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    }, [beginLoading, dateFilters]);

    const resetFilters = React.useCallback(() => {
        const cleared = {
            start_date: startDate || '',
            end_date: endDate || '',
            tenant_ids: [],
            waiter_ids: [],
            cashier_ids: [],
            cancelled_by_ids: [],
            customer_types: [],
            payment_statuses: [],
            customer_search: '',
            category_names: [],
            item_search: '',
            discounted_only: false,
            taxed_only: false,
        };
        setDateFilters(cleared);
        beginLoading();
        router.get(route('admin.reports.pos.daily-dump-items-report'), {
            start_date: cleared.start_date,
            end_date: cleared.end_date,
        }, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    }, [beginLoading, endDate, startDate]);

    const handlePrint = () => {
        window.open(route('admin.reports.pos.daily-dump-items-report.print', {
            ...dateFilters,
            tenant_ids: dateFilters.tenant_ids.join(','),
            waiter_ids: dateFilters.waiter_ids.join(','),
            cashier_ids: dateFilters.cashier_ids.join(','),
            cancelled_by_ids: dateFilters.cancelled_by_ids.join(','),
            customer_types: dateFilters.customer_types.join(','),
            payment_statuses: dateFilters.payment_statuses.join(','),
            category_names: dateFilters.category_names.join(','),
        }), '_blank');
    };

    return (
        <>
            <Head title="Daily Dump Items Report" />
            <AppPage
                eyebrow="POS Reports"
                title="Daily Dump Items Report"
                subtitle="Track cancelled and dumped items in the same shared report shell used across the rest of POS reporting."
                actions={[
                    <Button key="print" variant="outlined" onClick={handlePrint}>
                        Print
                    </Button>,
                ]}
            >
                <Grid container spacing={2.25}>
                    <Grid item xs={12} md={4}><StatCard label="Dumped Items" value={dumpItemsData.length} accent /></Grid>
                    <Grid item xs={12} md={4}><StatCard label="Total Quantity" value={totalQuantity} tone="light" /></Grid>
                    <Grid item xs={12} md={4}><StatCard label="Food Value" value={formatReportCurrency(totalFoodValue)} tone="muted" /></Grid>
                </Grid>

                <SurfaceCard title="Report Filters" subtitle="Keep the richer dump-report criteria while replacing the older legacy screen shell.">
                    <FilterToolbar
                        title="Filters"
                        subtitle="Pick report criteria and click Apply."
                        lowChrome
                        onApply={applyFilters}
                        onReset={resetFilters}
                    >
                        <Grid container spacing={2}>
                            <DateRangeFilterFields
                                startLabel="Start Date"
                                endLabel="End Date"
                                startValue={dateFilters.start_date}
                                endValue={dateFilters.end_date}
                                onStartChange={(value) => setDateFilters((current) => ({ ...current, start_date: value }))}
                                onEndChange={(value) => setDateFilters((current) => ({ ...current, end_date: value }))}
                                startGrid={{ xs: 12, md: 3 }}
                                endGrid={{ xs: 12, md: 3 }}
                            />
                            <Grid item xs={12} md={3}>
                                <Autocomplete
                                    multiple
                                    options={tenants}
                                    getOptionLabel={(option) => option.name || ''}
                                    value={tenants.filter((tenant) => dateFilters.tenant_ids.includes(tenant.id))}
                                    onChange={(_, value) => setDateFilters((current) => ({ ...current, tenant_ids: value.map((item) => item.id) }))}
                                    renderInput={(params) => <TextField {...params} label="Restaurants" fullWidth />}
                                />
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <Autocomplete
                                    multiple
                                    options={waiters}
                                    getOptionLabel={(option) => option.name || ''}
                                    value={waiters.filter((item) => dateFilters.waiter_ids.includes(item.id))}
                                    onChange={(_, value) => setDateFilters((current) => ({ ...current, waiter_ids: value.map((item) => item.id) }))}
                                    renderInput={(params) => <TextField {...params} label="Waiters" fullWidth />}
                                />
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <Autocomplete
                                    multiple
                                    options={cashiers}
                                    getOptionLabel={(option) => option.name || ''}
                                    value={cashiers.filter((item) => dateFilters.cashier_ids.includes(item.id))}
                                    onChange={(_, value) => setDateFilters((current) => ({ ...current, cashier_ids: value.map((item) => item.id) }))}
                                    renderInput={(params) => <TextField {...params} label="Cashiers" fullWidth />}
                                />
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <Autocomplete
                                    multiple
                                    options={cancelledByUsers}
                                    getOptionLabel={(option) => option.name || ''}
                                    value={cancelledByUsers.filter((item) => dateFilters.cancelled_by_ids.includes(item.id))}
                                    onChange={(_, value) => setDateFilters((current) => ({ ...current, cancelled_by_ids: value.map((item) => item.id) }))}
                                    renderInput={(params) => <TextField {...params} label="Cancelled By" fullWidth />}
                                />
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <TextField
                                    select
                                    SelectProps={{ multiple: true }}
                                    label="Customer Types"
                                    value={dateFilters.customer_types}
                                    onChange={(event) => setDateFilters((current) => ({ ...current, customer_types: event.target.value }))}
                                    fullWidth
                                >
                                    {CUSTOMER_TYPE_OPTIONS.map((option) => (
                                        <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <TextField
                                    label="Customer Name / No"
                                    value={dateFilters.customer_search}
                                    onChange={(event) => setDateFilters((current) => ({ ...current, customer_search: event.target.value }))}
                                    fullWidth
                                />
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <TextField
                                    label="Categories"
                                    helperText="Comma separated"
                                    value={dateFilters.category_names.join(', ')}
                                    onChange={(event) => setDateFilters((current) => ({ ...current, category_names: normalizeStringArray(event.target.value) }))}
                                    fullWidth
                                />
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <TextField
                                    label="Item Code / Name"
                                    value={dateFilters.item_search}
                                    onChange={(event) => setDateFilters((current) => ({ ...current, item_search: event.target.value }))}
                                    fullWidth
                                />
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <TextField
                                    select
                                    SelectProps={{ multiple: true }}
                                    label="Payment Statuses"
                                    value={dateFilters.payment_statuses}
                                    onChange={(event) => setDateFilters((current) => ({ ...current, payment_statuses: event.target.value }))}
                                    fullWidth
                                >
                                    {PAYMENT_STATUS_OPTIONS.map((option) => (
                                        <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <FormControlLabel
                                    control={<Checkbox checked={dateFilters.discounted_only} onChange={(event) => setDateFilters((current) => ({ ...current, discounted_only: event.target.checked }))} />}
                                    label="Discounted Only"
                                />
                                <FormControlLabel
                                    control={<Checkbox checked={dateFilters.taxed_only} onChange={(event) => setDateFilters((current) => ({ ...current, taxed_only: event.target.checked }))} />}
                                    label="Taxed Only"
                                />
                            </Grid>
                        </Grid>
                    </FilterToolbar>
                </SurfaceCard>

                <SurfaceCard title="Dump Register" subtitle="Visible cancellation table with a consistent empty state and a shared report-table presentation.">
                    <AdminDataTable
                        columns={[
                            { key: 'invoice_kot', label: 'Order #', minWidth: 110 },
                            { key: 'table_no', label: 'Table', minWidth: 90 },
                            { key: 'date', label: 'Date', minWidth: 110 },
                            { key: 'item_code', label: 'Item Code', minWidth: 130 },
                            { key: 'item_name', label: 'Item Name', minWidth: 220 },
                            { key: 'qty', label: 'Quantity', minWidth: 100, align: 'right' },
                            { key: 'status', label: 'Status', minWidth: 110 },
                            { key: 'instructions', label: 'Instructions', minWidth: 180 },
                            { key: 'reason', label: 'Reason', minWidth: 160 },
                            { key: 'remarks', label: 'Remarks', minWidth: 180 },
                            { key: 'sale_price', label: 'Sale Price', minWidth: 130, align: 'right' },
                            { key: 'food_value', label: 'Food Value', minWidth: 140, align: 'right' },
                            { key: 'cancelled_by', label: 'Cancelled By', minWidth: 170 },
                        ]}
                        rows={dumpItemsData}
                        loading={loading}
                        emptyMessage="No dumped items found for the selected filters."
                        tableMinWidth={1920}
                        renderRow={(row, index) => (
                            <TableRow key={`${row.invoice_kot}-${row.item_code}-${index}`} hover>
                                <TableCell>{row.invoice_kot}</TableCell>
                                <TableCell>{row.table_no}</TableCell>
                                <TableCell>{row.date}</TableCell>
                                <TableCell>{row.item_code}</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: 'text.primary' }}>{row.item_name}</TableCell>
                                <TableCell align="right">{row.qty}</TableCell>
                                <TableCell>{row.status}</TableCell>
                                <TableCell>{row.instructions}</TableCell>
                                <TableCell>{row.reason}</TableCell>
                                <TableCell>{row.remarks}</TableCell>
                                <TableCell align="right">{formatReportCurrency(row.sale_price)}</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700 }}>{formatReportCurrency(row.food_value)}</TableCell>
                                <TableCell>{row.cancelled_by}</TableCell>
                            </TableRow>
                        )}
                    />
                    <Grid container spacing={1.5} sx={{ mt: 1.5 }}>
                        <Grid item xs={12} md={4}><StatCard label="Total Quantity" value={totalQuantity} accent /></Grid>
                        <Grid item xs={12} md={4}><StatCard label="Total Sale Price" value={formatReportCurrency(totalSalePrice)} tone="light" /></Grid>
                        <Grid item xs={12} md={4}><StatCard label="Total Food Value" value={formatReportCurrency(totalFoodValue)} tone="muted" /></Grid>
                    </Grid>
                </SurfaceCard>
            </AppPage>
        </>
    );
}
