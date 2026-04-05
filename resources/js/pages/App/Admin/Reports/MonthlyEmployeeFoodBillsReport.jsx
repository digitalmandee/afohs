import React from 'react';
import { Head, router } from '@inertiajs/react';
import { Button, Grid, TableCell, TableRow, TextField } from '@mui/material';
import AppPage from '@/components/App/ui/AppPage';
import AdminDataTable from '@/components/App/ui/AdminDataTable';
import DateRangeFilterFields from '@/components/App/ui/DateRangeFilterFields';
import FilterToolbar from '@/components/App/ui/FilterToolbar';
import StatCard from '@/components/App/ui/StatCard';
import SurfaceCard from '@/components/App/ui/SurfaceCard';
import useFilterLoadingState from '@/hooks/useFilterLoadingState';
import { formatReportCurrency } from './posReportShared';

export default function MonthlyEmployeeFoodBillsReport({ startDate, endDate, filters = {}, rows = [] }) {
    const [reportFilters, setReportFilters] = React.useState({
        start_date: filters?.start_date || startDate || '',
        end_date: filters?.end_date || endDate || '',
        employee_search: filters?.employee_search || '',
    });
    const { loading, beginLoading } = useFilterLoadingState([
        filters?.employee_search,
        filters?.end_date,
        filters?.start_date,
        rows.length,
    ]);

    const applyFilters = React.useCallback(() => {
        beginLoading();
        router.get(route('admin.reports.pos.monthly-employee-food-bills'), reportFilters, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    }, [beginLoading, reportFilters]);

    const resetFilters = React.useCallback(() => {
        const cleared = {
            start_date: startDate || '',
            end_date: endDate || '',
            employee_search: '',
        };
        setReportFilters(cleared);
        beginLoading();
        router.get(route('admin.reports.pos.monthly-employee-food-bills'), cleared, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    }, [beginLoading, endDate, startDate]);

    const totalOrders = rows.reduce((sum, row) => sum + Number(row.orders || 0), 0);
    const totalAmount = rows.reduce((sum, row) => sum + Number(row.total || 0), 0);

    return (
        <>
            <Head title="Monthly Employee Food Bills Report" />
            <AppPage
                eyebrow="POS Reports"
                title="Monthly Employee Food Bills"
                subtitle="Track employee meal spending inside the same shared reporting shell used across the upgraded POS report suite."
            >
                <Grid container spacing={2.25}>
                    <Grid item xs={12} md={4}><StatCard label="Employees" value={rows.length} accent /></Grid>
                    <Grid item xs={12} md={4}><StatCard label="Orders" value={totalOrders} tone="light" /></Grid>
                    <Grid item xs={12} md={4}><StatCard label="Total Bills" value={formatReportCurrency(totalAmount)} tone="muted" /></Grid>
                </Grid>

                <SurfaceCard title="Report Filters" subtitle="Choose a date range and employee search term before running the report.">
                    <FilterToolbar
                        title="Filters"
                        subtitle="Select period and employee scope, then Apply."
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
                            <Grid item xs={12} md={6}>
                                <TextField
                                    label="Employee Name / ID"
                                    value={reportFilters.employee_search}
                                    onChange={(event) => setReportFilters((current) => ({ ...current, employee_search: event.target.value }))}
                                    fullWidth
                                />
                            </Grid>
                        </Grid>
                    </FilterToolbar>
                </SurfaceCard>

                <SurfaceCard title="Employee Billing Register" subtitle="Visible report grid with loading and empty-state handling instead of the older plain paper table.">
                    <AdminDataTable
                        columns={[
                            { key: 'serial', label: 'Sr #', minWidth: 90 },
                            { key: 'employee_no', label: 'Employee #', minWidth: 150 },
                            { key: 'employee_name', label: 'Employee Name', minWidth: 240 },
                            { key: 'orders', label: 'Orders', minWidth: 120, align: 'right' },
                            { key: 'total', label: 'Total', minWidth: 140, align: 'right' },
                        ]}
                        rows={rows}
                        loading={loading}
                        tableMinWidth={880}
                        emptyMessage="No employee food bills found for the selected filters."
                        renderRow={(row, index) => (
                            <TableRow key={row.employee_id || index} hover>
                                <TableCell>{index + 1}</TableCell>
                                <TableCell>{row.employee_no || '-'}</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: 'text.primary' }}>{row.employee_name || '-'}</TableCell>
                                <TableCell align="right">{row.orders || 0}</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700 }}>{formatReportCurrency(row.total)}</TableCell>
                            </TableRow>
                        )}
                    />
                </SurfaceCard>
            </AppPage>
        </>
    );
}
