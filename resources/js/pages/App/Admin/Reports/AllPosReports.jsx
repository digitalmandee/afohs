import React, { useMemo, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { Box, Button, Grid, Stack, Typography } from '@mui/material';
import { Search } from '@mui/icons-material';
import dayjs from 'dayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import AppPage from '@/components/App/ui/AppPage';
import FilterToolbar from '@/components/App/ui/FilterToolbar';
import SurfaceCard from '@/components/App/ui/SurfaceCard';

export default function AllPosReports({ startDate, endDate, filters }) {
    const [dateFilters, setDateFilters] = useState({
        start_date: filters?.start_date || startDate,
        end_date: filters?.end_date || endDate,
    });

    const reports = useMemo(
        () => [
            { title: 'Dish Breakdown Summary (Restaurant-Wise)', routeName: 'admin.reports.pos.restaurant-wise', printRouteName: 'admin.reports.pos.restaurant-wise.print' },
            { title: 'Running Sales Orders Report', routeName: 'admin.reports.pos.running-sales-orders', printRouteName: 'admin.reports.pos.running-sales-orders.print' },
            { title: 'Sales Summary (With Items)', routeName: 'admin.reports.pos.sales-summary-with-items', printRouteName: 'admin.reports.pos.sales-summary-with-items.print' },
            { title: 'Daily Sales List (Cashier-Wise)', routeName: 'admin.reports.pos.daily-sales-list-cashier-wise', printRouteName: 'admin.reports.pos.daily-sales-list-cashier-wise.print' },
            { title: 'Daily Dump Items Report', routeName: 'admin.reports.pos.daily-dump-items-report', printRouteName: 'admin.reports.pos.daily-dump-items-report.print' },
            { title: 'Dish Breakdown Summary (Price)', routeName: 'admin.reports.pos.dish-breakdown-price' },
            { title: 'Dish Breakdown Summary (Sold Quantity)', routeName: 'admin.reports.pos.dish-breakdown-quantity' },
            { title: 'Closing Sales Report', routeName: 'admin.reports.pos.closing-sales' },
            { title: 'Monthly Employee Food Bills Report', routeName: 'admin.reports.pos.monthly-employee-food-bills' },
            { title: 'Graphical Report', routeName: 'admin.reports.pos.graphical' },
        ],
        [],
    );

    const handleFilterChange = (field, value) => {
        setDateFilters((prev) => ({ ...prev, [field]: value }));
    };

    const applyFilters = () => {
        router.get(route('admin.reports.pos.all'), dateFilters, { preserveState: true, preserveScroll: true, replace: true });
    };

    const openReport = (routeName) => {
        router.get(route(routeName, dateFilters), {}, { preserveState: true, preserveScroll: true });
    };

    const openPrint = (routeName) => {
        window.open(route(routeName, dateFilters), '_blank');
    };

    return (
        <>
            <Head title="POS Reports" />
            <AppPage
                eyebrow="POS Reports"
                title="POS Reports"
                subtitle="Browse restaurant reporting, operational sales breakdowns, and printable POS exports from the same premium reporting shell."
            >
                <SurfaceCard title="Report Range" subtitle="Choose a date range once and open the operational POS reports with consistent filters.">
                    <FilterToolbar
                        onReset={() => {
                            const cleared = { start_date: startDate || '', end_date: endDate || '' };
                            setDateFilters(cleared);
                            router.get(route('admin.reports.pos.all'), cleared, { preserveState: true, preserveScroll: true, replace: true });
                        }}
                        actions={(
                            <Button variant="contained" startIcon={<Search />} onClick={applyFilters}>
                                Apply Range
                            </Button>
                        )}
                    >
                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} useFlexGap>
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DatePicker
                                    label="Start Date"
                                    format="DD/MM/YYYY"
                                    value={dateFilters.start_date ? dayjs(dateFilters.start_date) : null}
                                    onChange={(value) => handleFilterChange('start_date', value ? value.format('YYYY-MM-DD') : '')}
                                    slotProps={{ textField: { size: 'small', fullWidth: true } }}
                                />
                                <DatePicker
                                    label="End Date"
                                    format="DD/MM/YYYY"
                                    value={dateFilters.end_date ? dayjs(dateFilters.end_date) : null}
                                    onChange={(value) => handleFilterChange('end_date', value ? value.format('YYYY-MM-DD') : '')}
                                    slotProps={{ textField: { size: 'small', fullWidth: true } }}
                                />
                            </LocalizationProvider>
                        </Stack>
                    </FilterToolbar>
                </SurfaceCard>

                <Grid container spacing={2.25}>
                    {reports.map((report) => (
                        <Grid item xs={12} md={6} xl={4} key={report.routeName}>
                            <SurfaceCard
                                title={report.title}
                                subtitle="Open the live report or launch its print view with the current date range."
                                contentSx={{ p: { xs: 1.5, md: 2 } }}
                            >
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Current range: {dateFilters.start_date || 'Any'} to {dateFilters.end_date || 'Any'}
                                    </Typography>
                                    <Stack direction="row" spacing={1}>
                                        <Button size="small" variant="contained" onClick={() => openReport(report.routeName)}>
                                            Open
                                        </Button>
                                        {report.printRouteName ? (
                                            <Button size="small" variant="outlined" onClick={() => openPrint(report.printRouteName)}>
                                                Print
                                            </Button>
                                        ) : null}
                                    </Stack>
                                </Box>
                            </SurfaceCard>
                        </Grid>
                    ))}
                </Grid>
            </AppPage>
        </>
    );
}
