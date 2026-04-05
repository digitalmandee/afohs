import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    Button,
    Chip,
    Grid,
    MenuItem,
    TableCell,
    TableRow,
    TextField,
} from '@mui/material';
import dayjs from 'dayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import AppPage from '@/components/App/ui/AppPage';
import AdminDataTable from '@/components/App/ui/AdminDataTable';
import FilterToolbar from '@/components/App/ui/FilterToolbar';
import SurfaceCard from '@/components/App/ui/SurfaceCard';
import StatCard from '@/components/App/ui/StatCard';

const toArray = (value) => {
    if (Array.isArray(value)) return value.filter(Boolean);
    if (!value) return [];
    return String(value).split(',').map((item) => item.trim()).filter(Boolean);
};

const toIntArray = (value) => toArray(value).map((item) => Number(item)).filter((item) => Number.isFinite(item) && item > 0);

const formatCurrency = (amount) => new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
}).format(Number(amount || 0)).replace('PKR', 'Rs');

const formatOrderType = (type) => {
    const types = {
        dineIn: 'Dine-In',
        delivery: 'Delivery',
        takeaway: 'Takeaway',
        reservation: 'Reservation',
        room_service: 'Room Service',
    };

    return types[type] || type || '-';
};

const getCustomerType = (order) => {
    if (order.employee) return 'Employee';
    if (order.member) return order.member?.memberType?.name === 'Corporate' ? 'Corporate' : 'Member';
    if (order.customer) return order.customer?.guestType?.name || order.customer?.guest_type?.name || 'Guest';
    return 'Guest';
};

const getCustomerNo = (order) => {
    if (order.member) return order.member.membership_no || '-';
    if (order.customer) return order.customer.customer_no || '-';
    if (order.employee) return order.employee.employee_id || '-';
    return '-';
};

const getCustomerName = (order) => {
    if (order.member) return order.member.full_name || '-';
    if (order.customer) return order.customer.name || '-';
    if (order.employee) return order.employee.name || '-';
    return '-';
};

export default function RunningSalesOrders({ runningOrders = [], totalOrders = 0, totalAmount = 0, reportDate, startDate, endDate, tenants = [], cashiers = [], filters = {} }) {
    const [reportFilters, setReportFilters] = useState({
        start_date: filters?.start_date || startDate || reportDate || '',
        end_date: filters?.end_date || endDate || reportDate || '',
        tenant_ids: toIntArray(filters?.tenant_ids),
        cashier_ids: toIntArray(filters?.cashier_ids),
    });

    const handleFilterChange = (field, value) => {
        setReportFilters((prev) => ({ ...prev, [field]: value }));
    };

    const applyFilters = () => {
        router.get(route('admin.reports.pos.running-sales-orders'), {
            ...reportFilters,
            tenant_ids: reportFilters.tenant_ids.join(','),
            cashier_ids: reportFilters.cashier_ids.join(','),
        }, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const handlePrint = () => {
        window.open(route('admin.reports.pos.running-sales-orders.print', {
            ...reportFilters,
            tenant_ids: reportFilters.tenant_ids.join(','),
            cashier_ids: reportFilters.cashier_ids.join(','),
        }), '_blank');
    };

    const columns = [
        { key: 'invoice', label: 'Invoice', minWidth: 150 },
        { key: 'date', label: 'Date', minWidth: 110 },
        { key: 'time', label: 'Time', minWidth: 100 },
        { key: 'table', label: 'Table', minWidth: 90 },
        { key: 'restaurant', label: 'Restaurant', minWidth: 180 },
        { key: 'order_taker', label: 'Order Taker', minWidth: 160 },
        { key: 'customer_type', label: 'Customer Type', minWidth: 140 },
        { key: 'customer_no', label: 'Customer #', minWidth: 140 },
        { key: 'customer_name', label: 'Customer Name', minWidth: 200 },
        { key: 'total', label: 'Grand Total', minWidth: 140, align: 'right' },
        { key: 'cashier', label: 'Cashier', minWidth: 160 },
        { key: 'mode', label: 'Order Mode', minWidth: 140 },
    ];

    return (
        <>
            <Head title="Running Sales Orders Report" />
            <AppPage
                eyebrow="POS Reports"
                title="Running Sales Orders"
                subtitle="Live POS order register with a shared report shell, date controls, and restaurant/cashier filtering."
                actions={[
                    <Button key="print" variant="outlined" onClick={handlePrint}>
                        Print
                    </Button>,
                ]}
            >
                <Grid container spacing={2.25}>
                    <Grid item xs={12} md={4}><StatCard label="Running Orders" value={totalOrders} accent /></Grid>
                    <Grid item xs={12} md={4}><StatCard label="Total Amount" value={formatCurrency(totalAmount)} tone="light" /></Grid>
                    <Grid item xs={12} md={4}><StatCard label="Report Date" value={reportFilters.start_date || reportDate || '-'} tone="muted" /></Grid>
                </Grid>

                <SurfaceCard title="Live Filters" subtitle="Adjust date range, restaurant, and cashier selections before opening or printing the report.">
                    <FilterToolbar
                        title="Filters"
                        subtitle="Set report criteria and click Apply."
                        lowChrome
                        onApply={applyFilters}
                        onReset={() => {
                            const cleared = {
                                start_date: startDate || reportDate || '',
                                end_date: endDate || reportDate || '',
                                tenant_ids: [],
                                cashier_ids: [],
                            };
                            setReportFilters(cleared);
                            router.get(route('admin.reports.pos.running-sales-orders'), {
                                start_date: cleared.start_date,
                                end_date: cleared.end_date,
                            }, { preserveState: true, preserveScroll: true, replace: true });
                        }}
                    >
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={3}>
                                <LocalizationProvider dateAdapter={AdapterDayjs}>
                                    <DatePicker
                                        label="Start Date"
                                        format="DD/MM/YYYY"
                                        value={reportFilters.start_date ? dayjs(reportFilters.start_date) : null}
                                        onChange={(value) => handleFilterChange('start_date', value ? value.format('YYYY-MM-DD') : '')}
                                        slotProps={{ textField: { size: 'small', fullWidth: true } }}
                                    />
                                </LocalizationProvider>
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <LocalizationProvider dateAdapter={AdapterDayjs}>
                                    <DatePicker
                                        label="End Date"
                                        format="DD/MM/YYYY"
                                        value={reportFilters.end_date ? dayjs(reportFilters.end_date) : null}
                                        onChange={(value) => handleFilterChange('end_date', value ? value.format('YYYY-MM-DD') : '')}
                                        slotProps={{ textField: { size: 'small', fullWidth: true } }}
                                    />
                                </LocalizationProvider>
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <TextField
                                    select
                                    SelectProps={{ multiple: true }}
                                    label="Restaurants"
                                    value={reportFilters.tenant_ids}
                                    onChange={(event) => handleFilterChange('tenant_ids', event.target.value)}
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
                                    label="Cashiers"
                                    value={reportFilters.cashier_ids}
                                    onChange={(event) => handleFilterChange('cashier_ids', event.target.value)}
                                    fullWidth
                                >
                                    {cashiers.map((cashier) => (
                                        <MenuItem key={cashier.id} value={cashier.id}>{cashier.name}</MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                        </Grid>
                    </FilterToolbar>
                </SurfaceCard>

                <SurfaceCard title="Running Orders Register" subtitle="Active orders with party, cashier, restaurant, and order-mode visibility in a standardized POS report table.">
                    <AdminDataTable
                        columns={columns}
                        rows={runningOrders}
                        emptyMessage="No running orders found for the selected date range."
                        tableMinWidth={1500}
                        renderRow={(order, index) => (
                            <TableRow key={order.id || index} hover>
                                <TableCell sx={{ fontWeight: 700, color: 'text.primary' }}>{order.invoice_no || order.id}</TableCell>
                                <TableCell>{order.start_date || order.created_at?.slice?.(0, 10) || '-'}</TableCell>
                                <TableCell>{order.start_time || order.created_at?.slice?.(11, 19) || '-'}</TableCell>
                                <TableCell>{order.table?.table_no || order.table_id || '-'}</TableCell>
                                <TableCell>{order.tenant?.name || '-'}</TableCell>
                                <TableCell>{order.waiter?.name || '-'}</TableCell>
                                <TableCell>
                                    <Chip size="small" variant="outlined" label={getCustomerType(order)} />
                                </TableCell>
                                <TableCell>{getCustomerNo(order)}</TableCell>
                                <TableCell>{getCustomerName(order)}</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700 }}>{formatCurrency(order.total_price || 0)}</TableCell>
                                <TableCell>{order.cashier?.name || order.cashier_name || '-'}</TableCell>
                                <TableCell>{formatOrderType(order.order_type)}</TableCell>
                            </TableRow>
                        )}
                    />
                </SurfaceCard>
            </AppPage>
        </>
    );
}
