import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Button, Grid, TableCell, TableRow, TextField, Typography } from '@mui/material';
import dayjs from 'dayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import AppPage from '@/components/App/ui/AppPage';
import AdminDataTable from '@/components/App/ui/AdminDataTable';
import FilterToolbar from '@/components/App/ui/FilterToolbar';
import SurfaceCard from '@/components/App/ui/SurfaceCard';
import StatCard from '@/components/App/ui/StatCard';

export default function SinglePosReport({ reportData = {}, tenant, startDate, endDate, filters }) {
    const [dateFilters, setDateFilters] = useState({
        start_date: filters?.start_date || startDate || '',
        end_date: filters?.end_date || endDate || '',
    });

    const rows = reportData?.items || reportData?.rows || [];
    const columns = [
        { key: 'category', label: 'Category', minWidth: 220 },
        { key: 'dish', label: 'Dish', minWidth: 260 },
        { key: 'quantity', label: 'Quantity', minWidth: 120, align: 'right' },
    ];

    const applyFilters = () => {
        router.get(route('admin.reports.pos.single', { tenantId: tenant.id }), dateFilters, { preserveState: true, preserveScroll: true });
    };

    const handlePrint = () => {
        window.open(route('admin.reports.pos.single.print', { tenantId: tenant.id, ...dateFilters }), '_blank');
    };

    const totalRows = Array.isArray(rows) ? rows : [];

    return (
        <>
            <Head title={`POS Report - ${tenant?.name || 'Restaurant'}`} />
            <AppPage
                eyebrow="POS Reports"
                title={tenant?.name || 'Restaurant Report'}
                subtitle="Restaurant-level POS dish breakdown with shared report controls and a visible table shell."
                actions={[
                    <Button key="back" variant="outlined" component={Link} href={route('admin.reports.pos.all', dateFilters)}>
                        Back To Reports
                    </Button>,
                    <Button key="print" variant="outlined" onClick={handlePrint}>
                        Print
                    </Button>,
                ]}
            >
                <Grid container spacing={2.25}>
                    <Grid item xs={12} md={4}><StatCard label="Total Items Sold" value={reportData?.total_quantity || 0} accent /></Grid>
                    <Grid item xs={12} md={4}><StatCard label="Categories" value={reportData?.categories?.length || 0} tone="light" /></Grid>
                    <Grid item xs={12} md={4}><StatCard label="Date Range" value={`${dateFilters.start_date || '-'} to ${dateFilters.end_date || '-'}`} tone="muted" /></Grid>
                </Grid>

                <SurfaceCard title="Report Range" subtitle="Adjust the report dates and reopen the restaurant-level breakdown without leaving the current shell.">
                    <FilterToolbar onReset={() => setDateFilters({ start_date: startDate || '', end_date: endDate || '' })} actions={<Button variant="contained" onClick={applyFilters}>Apply Range</Button>}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                                <LocalizationProvider dateAdapter={AdapterDayjs}>
                                    <DatePicker
                                        label="Start Date"
                                        format="DD/MM/YYYY"
                                        value={dateFilters.start_date ? dayjs(dateFilters.start_date) : null}
                                        onChange={(value) => setDateFilters((prev) => ({ ...prev, start_date: value ? value.format('YYYY-MM-DD') : '' }))}
                                        slotProps={{ textField: { size: 'small', fullWidth: true } }}
                                    />
                                </LocalizationProvider>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <LocalizationProvider dateAdapter={AdapterDayjs}>
                                    <DatePicker
                                        label="End Date"
                                        format="DD/MM/YYYY"
                                        value={dateFilters.end_date ? dayjs(dateFilters.end_date) : null}
                                        onChange={(value) => setDateFilters((prev) => ({ ...prev, end_date: value ? value.format('YYYY-MM-DD') : '' }))}
                                        slotProps={{ textField: { size: 'small', fullWidth: true } }}
                                    />
                                </LocalizationProvider>
                            </Grid>
                        </Grid>
                    </FilterToolbar>
                </SurfaceCard>

                <SurfaceCard title="Dish Breakdown Summary" subtitle="Restaurant-level sold-quantity register with a consistent no-data fallback.">
                    <AdminDataTable
                        columns={columns}
                        rows={totalRows}
                        emptyMessage="No POS items found for the selected date range."
                        tableMinWidth={760}
                        renderRow={(row, index) => (
                            <TableRow key={`${row.category || 'category'}-${row.dish || index}`} hover>
                                <TableCell>{row.category || row.category_name || '-'}</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: 'text.primary' }}>{row.dish || row.item_name || '-'}</TableCell>
                                <TableCell align="right">{row.quantity || row.qty || 0}</TableCell>
                            </TableRow>
                        )}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1.25, display: 'block' }}>
                        Report range: {dateFilters.start_date || startDate || '-'} to {dateFilters.end_date || endDate || '-'}
                    </Typography>
                </SurfaceCard>
            </AppPage>
        </>
    );
}
