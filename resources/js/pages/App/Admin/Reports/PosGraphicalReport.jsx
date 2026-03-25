import React from 'react';
import { Head, router } from '@inertiajs/react';
import { Button, Grid, TableCell, TableRow } from '@mui/material';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import AppPage from '@/components/App/ui/AppPage';
import AdminDataTable from '@/components/App/ui/AdminDataTable';
import DateRangeFilterFields from '@/components/App/ui/DateRangeFilterFields';
import FilterToolbar from '@/components/App/ui/FilterToolbar';
import StatCard from '@/components/App/ui/StatCard';
import SurfaceCard from '@/components/App/ui/SurfaceCard';
import useFilterLoadingState from '@/hooks/useFilterLoadingState';
import { formatReportCurrency } from './posReportShared';

export default function PosGraphicalReport({ startDate, endDate, filters = {}, rows = [] }) {
    const [reportFilters, setReportFilters] = React.useState({
        start_date: filters?.start_date || startDate || '',
        end_date: filters?.end_date || endDate || '',
    });
    const { loading, beginLoading } = useFilterLoadingState([
        filters?.end_date,
        filters?.start_date,
        rows.length,
    ]);

    const data = React.useMemo(() => (
        rows.map((row) => ({
            date: row.date,
            total: Number(row.total || 0),
            orders: Number(row.orders || 0),
        }))
    ), [rows]);

    const applyFilters = React.useCallback(() => {
        beginLoading();
        router.get(route('admin.reports.pos.graphical'), reportFilters, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    }, [beginLoading, reportFilters]);

    const resetFilters = React.useCallback(() => {
        const cleared = {
            start_date: startDate || '',
            end_date: endDate || '',
        };
        setReportFilters(cleared);
        beginLoading();
        router.get(route('admin.reports.pos.graphical'), cleared, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    }, [beginLoading, endDate, startDate]);

    const totalOrders = data.reduce((sum, row) => sum + row.orders, 0);
    const totalAmount = data.reduce((sum, row) => sum + row.total, 0);

    return (
        <>
            <Head title="POS Graphical Report" />
            <AppPage
                eyebrow="POS Reports"
                title="Graphical Report"
                subtitle="Daily sales trend and supporting table view under the same shared POS reporting contract."
            >
                <Grid container spacing={2.25}>
                    <Grid item xs={12} md={4}><StatCard label="Days" value={data.length} accent /></Grid>
                    <Grid item xs={12} md={4}><StatCard label="Orders" value={totalOrders} tone="light" /></Grid>
                    <Grid item xs={12} md={4}><StatCard label="Total Sales" value={formatReportCurrency(totalAmount)} tone="muted" /></Grid>
                </Grid>

                <SurfaceCard title="Report Filters" subtitle="Apply a reporting window before refreshing the chart and supporting totals.">
                    <FilterToolbar onReset={resetFilters} actions={<Button variant="contained" onClick={applyFilters}>Apply</Button>}>
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
                        </Grid>
                    </FilterToolbar>
                </SurfaceCard>

                <SurfaceCard title="Sales Trend" subtitle="Chart view stays visible even when the range is empty, so the report never collapses into a blank page.">
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <div style={{ width: '100%', height: 320 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={data}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <Tooltip
                                            formatter={(value, name) => (
                                                name === 'total' ? [formatReportCurrency(value), 'Total'] : [value, 'Orders']
                                            )}
                                        />
                                        <Bar dataKey="total" fill="#0a3d62" radius={[10, 10, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </Grid>
                    </Grid>
                </SurfaceCard>

                <SurfaceCard title="Graph Data" subtitle="Table view for QA, export checking, and date-by-date verification.">
                    <AdminDataTable
                        columns={[
                            { key: 'date', label: 'Date', minWidth: 150 },
                            { key: 'orders', label: 'Orders', minWidth: 120, align: 'right' },
                            { key: 'total', label: 'Total', minWidth: 160, align: 'right' },
                        ]}
                        rows={data}
                        loading={loading}
                        tableMinWidth={760}
                        emptyMessage="No graphical report data found for the selected date range."
                        renderRow={(row) => (
                            <TableRow key={row.date} hover>
                                <TableCell>{row.date}</TableCell>
                                <TableCell align="right">{row.orders}</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700 }}>{formatReportCurrency(row.total)}</TableCell>
                            </TableRow>
                        )}
                    />
                </SurfaceCard>
            </AppPage>
        </>
    );
}
