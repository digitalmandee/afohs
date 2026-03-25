import React from 'react';
import { Head, router } from '@inertiajs/react';
import { Autocomplete, Button, Grid, MenuItem, TableCell, TableRow, TextField } from '@mui/material';
import AppPage from '@/components/App/ui/AppPage';
import AdminDataTable from '@/components/App/ui/AdminDataTable';
import DateRangeFilterFields from '@/components/App/ui/DateRangeFilterFields';
import FilterToolbar from '@/components/App/ui/FilterToolbar';
import StatCard from '@/components/App/ui/StatCard';
import SurfaceCard from '@/components/App/ui/SurfaceCard';
import useFilterLoadingState from '@/hooks/useFilterLoadingState';
import { formatReportCurrency, normalizeIntArray } from './posReportShared';

export default function DailySalesListCashierWise({
    cashierData = [],
    allCashiers = [],
    startDate,
    endDate,
    grandTotalSale = 0,
    grandTotalDiscount = 0,
    grandTotalSTax = 0,
    grandTotalCash = 0,
    grandTotalCredit = 0,
    grandTotalPaid = 0,
    grandTotalUnpaid = 0,
    grandTotal = 0,
    filters = {},
}) {
    const [dateFilters, setDateFilters] = React.useState({
        start_date: filters?.start_date || startDate || '',
        end_date: filters?.end_date || endDate || '',
        cashier_ids: normalizeIntArray(filters?.cashier_ids),
    });
    const { loading, beginLoading } = useFilterLoadingState([
        cashierData.length,
        filters?.cashier_ids,
        filters?.end_date,
        filters?.start_date,
    ]);

    const applyFilters = React.useCallback(() => {
        beginLoading();
        router.get(route('admin.reports.pos.daily-sales-list-cashier-wise'), {
            ...dateFilters,
            cashier_ids: dateFilters.cashier_ids.join(','),
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
            cashier_ids: [],
        };
        setDateFilters(cleared);
        beginLoading();
        router.get(route('admin.reports.pos.daily-sales-list-cashier-wise'), {
            start_date: cleared.start_date,
            end_date: cleared.end_date,
        }, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    }, [beginLoading, endDate, startDate]);

    const handlePrint = () => {
        window.open(route('admin.reports.pos.daily-sales-list-cashier-wise.print', {
            ...dateFilters,
            cashier_ids: dateFilters.cashier_ids.join(','),
        }), '_blank');
    };

    return (
        <>
            <Head title="Daily Sales List (Cashier-Wise)" />
            <AppPage
                eyebrow="POS Reports"
                title="Daily Sales List (Cashier-Wise)"
                subtitle="Cashier performance, payment split, and totals inside the standardized POS reporting shell."
                actions={[
                    <Button key="print" variant="outlined" onClick={handlePrint}>
                        Print
                    </Button>,
                ]}
            >
                <Grid container spacing={2.25}>
                    <Grid item xs={12} md={3}><StatCard label="Active Cashiers" value={cashierData.length} accent /></Grid>
                    <Grid item xs={12} md={3}><StatCard label="Total Sales" value={formatReportCurrency(grandTotalSale)} tone="light" /></Grid>
                    <Grid item xs={12} md={3}><StatCard label="Paid" value={formatReportCurrency(grandTotalPaid)} tone="light" /></Grid>
                    <Grid item xs={12} md={3}><StatCard label="Unpaid" value={formatReportCurrency(grandTotalUnpaid)} tone="muted" /></Grid>
                </Grid>

                <SurfaceCard title="Report Filters" subtitle="Set the cashier scope and reporting window before refreshing or printing the cashier register.">
                    <FilterToolbar onReset={resetFilters} actions={<Button variant="contained" onClick={applyFilters}>Apply</Button>}>
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
                            <Grid item xs={12} md={6}>
                                <Autocomplete
                                    multiple
                                    options={allCashiers}
                                    getOptionLabel={(option) => option.name || ''}
                                    value={allCashiers.filter((cashier) => dateFilters.cashier_ids.includes(cashier.id))}
                                    onChange={(_, value) => setDateFilters((current) => ({ ...current, cashier_ids: value.map((item) => item.id) }))}
                                    isOptionEqualToValue={(option, value) => option.id === value.id}
                                    renderInput={(params) => <TextField {...params} label="Cashiers" fullWidth />}
                                />
                            </Grid>
                        </Grid>
                    </FilterToolbar>
                </SurfaceCard>

                <SurfaceCard title="Cashier Register" subtitle="Visible table shell with totals, loading feedback, and the same report styling as the rest of the upgraded POS pages.">
                    <AdminDataTable
                        columns={[
                            { key: 'name', label: 'Cashier Name', minWidth: 220 },
                            { key: 'sale', label: 'Sale', minWidth: 140, align: 'right' },
                            { key: 'discount', label: 'Discount', minWidth: 140, align: 'right' },
                            { key: 's_tax_amt', label: 'S.Tax Amt', minWidth: 140, align: 'right' },
                            { key: 'cash', label: 'Cash', minWidth: 140, align: 'right' },
                            { key: 'credit', label: 'Credit', minWidth: 140, align: 'right' },
                            { key: 'paid', label: 'Paid', minWidth: 140, align: 'right' },
                            { key: 'unpaid', label: 'Unpaid', minWidth: 140, align: 'right' },
                            { key: 'total', label: 'Total', minWidth: 140, align: 'right' },
                        ]}
                        rows={cashierData}
                        loading={loading}
                        emptyMessage="No cashier sales data found for the selected date range."
                        tableMinWidth={1400}
                        renderRow={(cashier) => (
                            <TableRow key={cashier.id || cashier.name} hover>
                                <TableCell sx={{ fontWeight: 700, color: 'text.primary' }}>{cashier.name}</TableCell>
                                <TableCell align="right">{formatReportCurrency(cashier.sale)}</TableCell>
                                <TableCell align="right">{formatReportCurrency(cashier.discount)}</TableCell>
                                <TableCell align="right">{formatReportCurrency(cashier.s_tax_amt)}</TableCell>
                                <TableCell align="right">{formatReportCurrency(cashier.cash)}</TableCell>
                                <TableCell align="right">{formatReportCurrency(cashier.credit)}</TableCell>
                                <TableCell align="right">{formatReportCurrency(cashier.paid)}</TableCell>
                                <TableCell align="right">{formatReportCurrency(cashier.unpaid)}</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700 }}>{formatReportCurrency(cashier.total)}</TableCell>
                            </TableRow>
                        )}
                    />
                    <Grid container spacing={1.5} sx={{ mt: 1.5 }}>
                        <Grid item xs={12} md={3}><StatCard label="Grand Total" value={formatReportCurrency(grandTotal)} accent /></Grid>
                        <Grid item xs={12} md={3}><StatCard label="Cash" value={formatReportCurrency(grandTotalCash)} tone="light" /></Grid>
                        <Grid item xs={12} md={3}><StatCard label="Credit" value={formatReportCurrency(grandTotalCredit)} tone="light" /></Grid>
                        <Grid item xs={12} md={3}><StatCard label="Discount" value={formatReportCurrency(grandTotalDiscount)} tone="muted" /></Grid>
                    </Grid>
                </SurfaceCard>
            </AppPage>
        </>
    );
}
