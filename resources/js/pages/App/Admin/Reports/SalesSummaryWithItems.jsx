import React from 'react';
import { Head, router } from '@inertiajs/react';
import { Button, Checkbox, FormControlLabel, Grid, MenuItem, Stack, TableCell, TableRow, TextField, Typography } from '@mui/material';
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

function InvoiceItemsTable({ invoice, showTaxColumn }) {
    const columns = [
        { key: 'time', label: 'Time', minWidth: 100 },
        { key: 'code', label: 'Item Code', minWidth: 130 },
        { key: 'name', label: 'Item Name', minWidth: 240 },
        { key: 'qty', label: 'Qty Sold', minWidth: 100, align: 'right' },
        { key: 'sale_price', label: 'Sale Price', minWidth: 130, align: 'right' },
        { key: 'sub_total', label: 'Sub Total', minWidth: 130, align: 'right' },
        { key: 'discount', label: 'Discount', minWidth: 130, align: 'right' },
        ...(showTaxColumn ? [{ key: 'tax', label: 'Tax', minWidth: 120, align: 'right' }] : []),
        { key: 'total_sale', label: 'Total Sale', minWidth: 130, align: 'right' },
    ];

    return (
        <SurfaceCard
            title={`Invoice ${invoice.invoice_no}`}
            subtitle={`Customer ${invoice.customer || '-'} | Waiter ${invoice.waiter || '-'} | Table ${invoice.table || '-'} | KOT ${invoice.kot || '-'}`}
        >
            <AdminDataTable
                columns={columns}
                rows={invoice.items || []}
                tableMinWidth={showTaxColumn ? 1280 : 1160}
                emptyMessage="No items found for this invoice."
                renderRow={(item, index) => (
                    <TableRow key={`${invoice.invoice_no}-${index}`} hover>
                        <TableCell>{item.time || '-'}</TableCell>
                        <TableCell>{item.code || '-'}</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: 'text.primary' }}>{item.name || '-'}</TableCell>
                        <TableCell align="right">{item.qty}</TableCell>
                        <TableCell align="right">{formatReportCurrency(item.sale_price)}</TableCell>
                        <TableCell align="right">{formatReportCurrency(item.sub_total)}</TableCell>
                        <TableCell align="right">{formatReportCurrency(item.discount)}</TableCell>
                        {showTaxColumn ? <TableCell align="right">{formatReportCurrency(item.tax)}</TableCell> : null}
                        <TableCell align="right" sx={{ fontWeight: 700 }}>{formatReportCurrency(item.total_sale)}</TableCell>
                    </TableRow>
                )}
            />
            <Grid container spacing={1.5} sx={{ mt: 1.5 }}>
                <Grid item xs={12} md={3}><StatCard label="Invoice Qty" value={invoice.total_qty || 0} accent /></Grid>
                <Grid item xs={12} md={3}><StatCard label="Sub Total" value={formatReportCurrency(invoice.total_amount)} tone="light" /></Grid>
                <Grid item xs={12} md={3}><StatCard label="Discount" value={formatReportCurrency(invoice.total_discount)} tone="light" /></Grid>
                <Grid item xs={12} md={3}><StatCard label="Total Sale" value={formatReportCurrency(invoice.total_sale)} tone="muted" /></Grid>
            </Grid>
        </SurfaceCard>
    );
}

export default function SalesSummaryWithItems({
    salesData = [],
    startDate,
    endDate,
    tenants = [],
    waiters = [],
    cashiers = [],
    grandTotalQty = 0,
    grandTotalDiscount = 0,
    grandTotalTax = 0,
    grandTotalSale = 0,
    filters = {},
}) {
    const [reportFilters, setReportFilters] = React.useState({
        start_date: filters?.start_date || startDate || '',
        end_date: filters?.end_date || endDate || '',
        tenant_ids: normalizeIntArray(filters?.tenant_ids),
        customer_types: normalizeStringArray(filters?.customer_types),
        customer_search: filters?.customer_search || '',
        waiter_ids: normalizeIntArray(filters?.waiter_ids),
        cashier_ids: normalizeIntArray(filters?.cashier_ids),
        table_nos: normalizeStringArray(filters?.table_nos),
        category_names: normalizeStringArray(filters?.category_names),
        item_search: filters?.item_search || '',
        discounted_only: Boolean(filters?.discounted_only) && String(filters?.discounted_only) !== '0',
        taxed_only: Boolean(filters?.taxed_only) && String(filters?.taxed_only) !== '0',
        payment_statuses: normalizeStringArray(filters?.payment_statuses),
    });
    const { loading, beginLoading } = useFilterLoadingState([
        salesData.length,
        filters?.end_date,
        filters?.start_date,
        filters?.customer_search,
        filters?.item_search,
    ]);

    const showTaxColumn = Number(grandTotalTax || 0) > 0 || salesData.some((invoice) => Number(invoice?.total_tax || 0) > 0);

    const applyFilters = React.useCallback(() => {
        beginLoading();
        router.get(route('admin.reports.pos.sales-summary-with-items'), {
            ...reportFilters,
            tenant_ids: reportFilters.tenant_ids.join(','),
            customer_types: reportFilters.customer_types.join(','),
            waiter_ids: reportFilters.waiter_ids.join(','),
            cashier_ids: reportFilters.cashier_ids.join(','),
            table_nos: reportFilters.table_nos.join(','),
            category_names: reportFilters.category_names.join(','),
            payment_statuses: reportFilters.payment_statuses.join(','),
        }, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    }, [beginLoading, reportFilters]);

    const resetFilters = React.useCallback(() => {
        const cleared = {
            start_date: startDate || '',
            end_date: endDate || '',
            tenant_ids: [],
            customer_types: [],
            customer_search: '',
            waiter_ids: [],
            cashier_ids: [],
            table_nos: [],
            category_names: [],
            item_search: '',
            discounted_only: false,
            taxed_only: false,
            payment_statuses: [],
        };
        setReportFilters(cleared);
        beginLoading();
        router.get(route('admin.reports.pos.sales-summary-with-items'), {
            start_date: cleared.start_date,
            end_date: cleared.end_date,
        }, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    }, [beginLoading, endDate, startDate]);

    const handlePrint = () => {
        window.open(route('admin.reports.pos.sales-summary-with-items.print', {
            ...reportFilters,
            tenant_ids: reportFilters.tenant_ids.join(','),
            customer_types: reportFilters.customer_types.join(','),
            waiter_ids: reportFilters.waiter_ids.join(','),
            cashier_ids: reportFilters.cashier_ids.join(','),
            table_nos: reportFilters.table_nos.join(','),
            category_names: reportFilters.category_names.join(','),
            payment_statuses: reportFilters.payment_statuses.join(','),
        }), '_blank');
    };

    return (
        <>
            <Head title="Sales Summary (With Items)" />
            <AppPage
                eyebrow="POS Reports"
                title="Sales Summary (With Items)"
                subtitle="Invoice-wise sales and item detail with the same premium report shell, totals, and empty-state handling as the rest of the POS suite."
                actions={[
                    <Button key="print" variant="outlined" onClick={handlePrint}>
                        Print
                    </Button>,
                ]}
            >
                <Grid container spacing={2.25}>
                    <Grid item xs={12} md={3}><StatCard label="Invoices" value={salesData.length} accent /></Grid>
                    <Grid item xs={12} md={3}><StatCard label="Quantity" value={grandTotalQty} tone="light" /></Grid>
                    <Grid item xs={12} md={3}><StatCard label="Discount" value={formatReportCurrency(grandTotalDiscount)} tone="light" /></Grid>
                    <Grid item xs={12} md={3}><StatCard label="Total Sale" value={formatReportCurrency(grandTotalSale)} tone="muted" /></Grid>
                </Grid>

                <SurfaceCard title="Report Filters" subtitle="Keep the rich invoice and item filtering while replacing the legacy POS report shell with shared components.">
                    <FilterToolbar
                        title="Filters"
                        subtitle="Refine report dimensions and click Apply."
                        lowChrome
                        onApply={applyFilters}
                        onReset={resetFilters}
                    >
                        <Grid container spacing={2}>
                            <DateRangeFilterFields
                                startLabel="Start Date"
                                endLabel="End Date"
                                startValue={reportFilters.start_date}
                                endValue={reportFilters.end_date}
                                onStartChange={(value) => setReportFilters((current) => ({ ...current, start_date: value }))}
                                onEndChange={(value) => setReportFilters((current) => ({ ...current, end_date: value }))}
                                startGrid={{ xs: 12, md: 3 }}
                                endGrid={{ xs: 12, md: 3 }}
                            />
                            <Grid item xs={12} md={3}>
                                <TextField
                                    select
                                    SelectProps={{ multiple: true }}
                                    label="Restaurants"
                                    value={reportFilters.tenant_ids}
                                    onChange={(event) => setReportFilters((current) => ({ ...current, tenant_ids: event.target.value }))}
                                    fullWidth
                                >
                                    {tenants.map((tenant) => (
                                        <MenuItem key={tenant.id} value={tenant.id}>{tenant.name}</MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <TextField
                                    select
                                    SelectProps={{ multiple: true }}
                                    label="Customer Types"
                                    value={reportFilters.customer_types}
                                    onChange={(event) => setReportFilters((current) => ({ ...current, customer_types: event.target.value }))}
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
                                    value={reportFilters.customer_search}
                                    onChange={(event) => setReportFilters((current) => ({ ...current, customer_search: event.target.value }))}
                                    fullWidth
                                />
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <TextField
                                    select
                                    SelectProps={{ multiple: true }}
                                    label="Waiters"
                                    value={reportFilters.waiter_ids}
                                    onChange={(event) => setReportFilters((current) => ({ ...current, waiter_ids: event.target.value }))}
                                    fullWidth
                                >
                                    {waiters.map((waiter) => (
                                        <MenuItem key={waiter.id} value={waiter.id}>{waiter.name}</MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <TextField
                                    select
                                    SelectProps={{ multiple: true }}
                                    label="Cashiers"
                                    value={reportFilters.cashier_ids}
                                    onChange={(event) => setReportFilters((current) => ({ ...current, cashier_ids: event.target.value }))}
                                    fullWidth
                                >
                                    {cashiers.map((cashier) => (
                                        <MenuItem key={cashier.id} value={cashier.id}>{cashier.name}</MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <TextField
                                    label="Table Numbers"
                                    helperText="Comma separated"
                                    value={reportFilters.table_nos.join(', ')}
                                    onChange={(event) => setReportFilters((current) => ({ ...current, table_nos: normalizeStringArray(event.target.value) }))}
                                    fullWidth
                                />
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <TextField
                                    label="Categories"
                                    helperText="Comma separated"
                                    value={reportFilters.category_names.join(', ')}
                                    onChange={(event) => setReportFilters((current) => ({ ...current, category_names: normalizeStringArray(event.target.value) }))}
                                    fullWidth
                                />
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <TextField
                                    label="Item Code / Name"
                                    value={reportFilters.item_search}
                                    onChange={(event) => setReportFilters((current) => ({ ...current, item_search: event.target.value }))}
                                    fullWidth
                                />
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <TextField
                                    select
                                    SelectProps={{ multiple: true }}
                                    label="Payment Statuses"
                                    value={reportFilters.payment_statuses}
                                    onChange={(event) => setReportFilters((current) => ({ ...current, payment_statuses: event.target.value }))}
                                    fullWidth
                                >
                                    {PAYMENT_STATUS_OPTIONS.map((option) => (
                                        <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
                                    <FormControlLabel
                                        control={<Checkbox checked={reportFilters.discounted_only} onChange={(event) => setReportFilters((current) => ({ ...current, discounted_only: event.target.checked }))} />}
                                        label="Discounted Only"
                                    />
                                    <FormControlLabel
                                        control={<Checkbox checked={reportFilters.taxed_only} onChange={(event) => setReportFilters((current) => ({ ...current, taxed_only: event.target.checked }))} />}
                                        label="Taxed Only"
                                    />
                                </Stack>
                            </Grid>
                        </Grid>
                    </FilterToolbar>
                </SurfaceCard>

                {salesData.length === 0 ? (
                    <SurfaceCard title="Sales Register" subtitle="The report shell still renders cleanly when there are no invoices to show.">
                        <AdminDataTable
                            columns={[{ key: 'placeholder', label: 'Invoices', minWidth: 220 }]}
                            rows={[]}
                            loading={loading}
                            emptyMessage="No sales data found for the selected date range."
                            renderRow={() => null}
                        />
                    </SurfaceCard>
                ) : (
                    salesData.map((invoice, index) => (
                        <InvoiceItemsTable
                            key={`${invoice.invoice_no || index}-${index}`}
                            invoice={invoice}
                            showTaxColumn={showTaxColumn}
                        />
                    ))
                )}

                <SurfaceCard title="Grand Totals" subtitle="High-level QA totals stay visible even when drilling into invoice-level detail.">
                    <Grid container spacing={2.25}>
                        <Grid item xs={12} md={3}><StatCard label="Invoices" value={salesData.length} accent /></Grid>
                        <Grid item xs={12} md={3}><StatCard label="Quantity" value={grandTotalQty} tone="light" /></Grid>
                        <Grid item xs={12} md={3}><StatCard label="Discount" value={formatReportCurrency(grandTotalDiscount)} tone="light" /></Grid>
                        <Grid item xs={12} md={3}><StatCard label="Total Sale" value={formatReportCurrency(grandTotalSale)} tone="muted" /></Grid>
                        {showTaxColumn ? (
                            <Grid item xs={12} md={3}><StatCard label="Tax" value={formatReportCurrency(grandTotalTax)} tone="muted" /></Grid>
                        ) : null}
                    </Grid>
                </SurfaceCard>
            </AppPage>
        </>
    );
}
