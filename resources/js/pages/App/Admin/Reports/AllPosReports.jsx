import React, { useMemo, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { Box, Button, Card, CardActions, CardContent, Grid, Stack, Typography } from '@mui/material';
import { Search } from '@mui/icons-material';
import dayjs from 'dayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

export default function AllPosReports({ startDate, endDate, filters }) {
    const [dateFilters, setDateFilters] = useState({
        start_date: filters?.start_date || startDate,
        end_date: filters?.end_date || endDate,
    });

    const reports = useMemo(
        () => [
            {
                title: 'DISH BREAKDOWN SUMMARY (RESTAURANT-WISE)',
                routeName: 'admin.reports.pos.restaurant-wise',
                printRouteName: 'admin.reports.pos.restaurant-wise.print',
            },
            {
                title: 'RUNNING SALES ORDERS REPORT',
                routeName: 'admin.reports.pos.running-sales-orders',
                printRouteName: 'admin.reports.pos.running-sales-orders.print',
            },
            {
                title: 'SALES SUMMARY (WITH ITEMS)',
                routeName: 'admin.reports.pos.sales-summary-with-items',
                printRouteName: 'admin.reports.pos.sales-summary-with-items.print',
            },
            {
                title: 'DAILY SALES LIST (CASHIER-WISE)',
                routeName: 'admin.reports.pos.daily-sales-list-cashier-wise',
                printRouteName: 'admin.reports.pos.daily-sales-list-cashier-wise.print',
            },
            {
                title: 'DAILY DUMP ITEMS REPORT',
                routeName: 'admin.reports.pos.daily-dump-items-report',
                printRouteName: 'admin.reports.pos.daily-dump-items-report.print',
            },
            {
                title: 'DISH BREAKDOWN SUMMARY (PRICE)',
                routeName: 'admin.reports.pos.dish-breakdown-price',
            },
            {
                title: 'DISH BREAKDOWN SUMMARY (SOLD QUANTITY)',
                routeName: 'admin.reports.pos.dish-breakdown-quantity',
            },
            {
                title: 'CLOSING SALES REPORT',
                routeName: 'admin.reports.pos.closing-sales',
            },
            {
                title: 'MONTHLY EMPLOYEE FOOD BILLS REPORT',
                routeName: 'admin.reports.pos.monthly-employee-food-bills',
            },
            {
                title: 'GRAPHICAL REPORT',
                routeName: 'admin.reports.pos.graphical',
            },
        ],
        [],
    );

    const handleFilterChange = (field, value) => {
        setDateFilters((prev) => ({ ...prev, [field]: value }));
    };

    const applyFilters = () => {
        router.get(route('admin.reports.pos.all'), dateFilters, { preserveState: true });
    };

    const openReport = (routeName) => {
        router.get(route(routeName, dateFilters));
    };

    const openPrint = (routeName) => {
        window.open(route(routeName, dateFilters), '_blank');
    };

    return (
        <>
            <Head title="POS Reports" />
            <Box sx={{ p: 3, minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
                <Typography sx={{ fontWeight: 700, fontSize: '30px', color: '#063455', mb: 2 }}>
                    POS Reports
                </Typography>

                <Box sx={{ mb: 3 }}>
                    <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <DatePicker
                                label="Start Date"
                                format="DD/MM/YYYY"
                                value={dateFilters.start_date ? dayjs(dateFilters.start_date) : null}
                                onChange={(newValue) =>
                                    handleFilterChange('start_date', newValue ? newValue.format('YYYY-MM-DD') : '')
                                }
                                slotProps={{
                                    textField: {
                                        size: 'small',
                                        InputProps: {
                                            sx: {
                                                borderRadius: '16px',
                                                '& fieldset': { borderRadius: '16px' },
                                            },
                                        },
                                    },
                                }}
                            />
                            <DatePicker
                                label="End Date"
                                format="DD/MM/YYYY"
                                value={dateFilters.end_date ? dayjs(dateFilters.end_date) : null}
                                onChange={(newValue) =>
                                    handleFilterChange('end_date', newValue ? newValue.format('YYYY-MM-DD') : '')
                                }
                                slotProps={{
                                    textField: {
                                        size: 'small',
                                        InputProps: {
                                            sx: {
                                                borderRadius: '16px',
                                                '& fieldset': { borderRadius: '16px' },
                                            },
                                        },
                                    },
                                }}
                            />
                        </LocalizationProvider>
                        <Button
                            variant="contained"
                            startIcon={<Search />}
                            onClick={applyFilters}
                            sx={{
                                backgroundColor: '#063455',
                                color: 'white',
                                textTransform: 'none',
                                borderRadius: '16px',
                                '&:hover': { backgroundColor: '#063455' },
                            }}
                        >
                            Search
                        </Button>
                    </Stack>
                </Box>

                <Grid container spacing={2}>
                    {reports.map((report) => (
                        <Grid item xs={12} md={6} lg={4} key={report.routeName}>
                            <Card sx={{ borderRadius: '16px' }}>
                                <CardContent>
                                    <Typography sx={{ fontWeight: 700, color: '#063455' }}>{report.title}</Typography>
                                </CardContent>
                                <CardActions sx={{ px: 2, pb: 2, pt: 0, gap: 1 }}>
                                    <Button
                                        variant="contained"
                                        onClick={() => openReport(report.routeName)}
                                        sx={{
                                            backgroundColor: '#063455',
                                            color: 'white',
                                            textTransform: 'none',
                                            borderRadius: '12px',
                                            '&:hover': { backgroundColor: '#063455' },
                                        }}
                                    >
                                        Open
                                    </Button>
                                    {report.printRouteName && (
                                        <Button
                                            variant="outlined"
                                            onClick={() => openPrint(report.printRouteName)}
                                            sx={{
                                                borderColor: '#063455',
                                                color: '#063455',
                                                textTransform: 'none',
                                                borderRadius: '12px',
                                            }}
                                        >
                                            Print
                                        </Button>
                                    )}
                                </CardActions>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </Box>
        </>
    );
}
