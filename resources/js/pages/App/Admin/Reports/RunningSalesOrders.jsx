import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    Box,
    Paper,
    Typography,
    Button,
    Grid,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Card,
    CardContent,
    Chip,
    TextField,
    Autocomplete
} from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import RefreshIcon from '@mui/icons-material/Refresh';
import { format } from 'date-fns';
import dayjs from 'dayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Search } from '@mui/icons-material';

export default function RunningSalesOrders({ runningOrders, totalOrders, totalAmount, reportDate, startDate, endDate, tenants, cashiers, filters }) {

    const toArray = (v) => {
        if (Array.isArray(v)) return v.filter(Boolean);
        if (!v) return [];
        return String(v)
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
    };

    const toIntArray = (v) =>
        toArray(v)
            .map((x) => Number(x))
            .filter((n) => Number.isFinite(n) && n > 0);

    const [reportFilters, setReportFilters] = useState({
        start_date: filters?.start_date || startDate || reportDate,
        end_date: filters?.end_date || endDate || reportDate,
        tenant_ids: toIntArray(filters?.tenant_ids),
        cashier_ids: toIntArray(filters?.cashier_ids),
    });

    const handleFilterChange = (field, value) => {
        setReportFilters((prev) => ({ ...prev, [field]: value }));
    };

    const handlePrint = () => {
        const printUrl = route('admin.reports.pos.running-sales-orders.print', reportFilters);
        window.open(printUrl, '_blank');
    };

    const handleRefresh = () => {
        router.get(route('admin.reports.pos.running-sales-orders'), reportFilters, { preserveState: true });
    };

    const formatDate = (dateString) => {
        try {
            return format(new Date(dateString), 'dd/MM/yyyy');
        } catch (error) {
            return dateString;
        }
    };

    const formatTime = (dateString) => {
        try {
            return format(new Date(dateString), 'HH:mm:ss');
        } catch (error) {
            return dateString;
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-PK', {
            style: 'currency',
            currency: 'PKR'
        }).format(amount).replace('PKR', 'Rs');
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'pending':
                return 'warning';
            case 'preparing':
                return 'info';
            case 'ready':
                return 'success';
            case 'served':
                return 'primary';
            default:
                return 'default';
        }
    };

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

    return (
        <>
            {/* <Head title="Running Sales Orders" /> */}
            {/* <SideNav open={open} setOpen={setOpen} /> */}

            <div
                style={{
                    minHeight: '100vh',
                    backgroundColor: '#f5f5f5'
                }}
            >
                <Box sx={{ p: 2 }}>
                    {/* Header */}
                    <Box sx={{ mb: 2 }}>
                        <Grid container justifyContent="space-between" alignItems="center">
                            <Grid item>
                                <Typography sx={{ fontWeight: '700', fontSize: '30px', color: '#063455' }}>
                                    Running Sales Orders Report
                                </Typography>
                            </Grid>
                            <Grid item>
                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    {/* <Button
                                        variant="outlined"
                                        startIcon={<RefreshIcon />}
                                        onClick={handleRefresh}
                                        sx={{
                                            borderColor: '#0a3d62',
                                            color: '#0a3d62',
                                            '&:hover': { borderColor: '#083049', backgroundColor: '#f5f5f5' }
                                        }}
                                    >
                                        Refresh
                                    </Button> */}
                                    <Button
                                        variant="contained"
                                        startIcon={<PrintIcon />}
                                        onClick={handlePrint}
                                        sx={{
                                            backgroundColor: '#063455',
                                            color: 'white',
                                            borderRadius: '16px',
                                            textTransform: 'none',
                                            '&:hover': { backgroundColor: '#063455' }
                                        }}
                                    >
                                        Print
                                    </Button>
                                </Box>
                            </Grid>
                        </Grid>
                        <Box sx={{ mt: 1 }}>
                            <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
                                <LocalizationProvider dateAdapter={AdapterDayjs}>
                                    <DatePicker
                                        label="Start Date"
                                        format="DD/MM/YYYY"
                                        value={reportFilters.start_date ? dayjs(reportFilters.start_date) : null}
                                        onChange={(newValue) =>
                                            handleFilterChange('start_date', newValue ? newValue.format('YYYY-MM-DD') : '')
                                        }
                                        slotProps={{
                                            textField: {
                                                size: 'small',
                                                InputProps: { sx: { borderRadius: '16px', '& fieldset': { borderRadius: '16px' } } },
                                            },
                                        }}
                                    />
                                    <DatePicker
                                        label="End Date"
                                        format="DD/MM/YYYY"
                                        value={reportFilters.end_date ? dayjs(reportFilters.end_date) : null}
                                        onChange={(newValue) =>
                                            handleFilterChange('end_date', newValue ? newValue.format('YYYY-MM-DD') : '')
                                        }
                                        slotProps={{
                                            textField: {
                                                size: 'small',
                                                InputProps: { sx: { borderRadius: '16px', '& fieldset': { borderRadius: '16px' } } },
                                            },
                                        }}
                                    />
                                </LocalizationProvider>

                                <Autocomplete
                                    multiple
                                    size="small"
                                    options={tenants || []}
                                    getOptionLabel={(opt) => opt?.name || ''}
                                    value={(tenants || []).filter((t) => reportFilters.tenant_ids.includes(t.id))}
                                    onChange={(_, value) => handleFilterChange('tenant_ids', value.map((v) => v.id))}
                                    renderInput={(params) => <TextField {...params} label="Restaurant" />}
                                    sx={{ minWidth: 220 }}
                                />

                                <Autocomplete
                                    multiple
                                    size="small"
                                    options={cashiers || []}
                                    getOptionLabel={(opt) => opt?.name || ''}
                                    value={(cashiers || []).filter((c) => reportFilters.cashier_ids.includes(c.id))}
                                    onChange={(_, value) => handleFilterChange('cashier_ids', value.map((v) => v.id))}
                                    renderInput={(params) => <TextField {...params} label="Cashier" />}
                                    sx={{ minWidth: 220 }}
                                />

                                <Button
                                    variant="contained"
                                    startIcon={<Search />}
                                    onClick={handleRefresh}
                                    sx={{
                                        backgroundColor: '#063455',
                                        color: 'white',
                                        borderRadius: '16px',
                                        textTransform: 'none',
                                        '&:hover': { backgroundColor: '#063455' },
                                    }}
                                >
                                    Search
                                </Button>
                            </Stack>
                        </Box>
                    </Box>

                    {/* Summary Stats */}
                    <Grid container spacing={3} sx={{ mb: 3 }}>
                        <Grid item xs={12} md={4}>
                            <Card sx={{ bgcolor: '#063455', borderRadius: '16px' }}>
                                <CardContent sx={{ textAlign: 'center' }}>
                                    <Typography sx={{ fontWeight: '500', fontSize: '16px', color: '#fff' }}>
                                        Running Orders
                                    </Typography>
                                    <Typography sx={{ fontWeight: '500', fontSize: '20px', color: '#fff' }}>
                                        {totalOrders}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Card sx={{ bgcolor: '#063455', borderRadius: '16px' }}>
                                <CardContent sx={{ textAlign: 'center' }}>
                                    <Typography sx={{ fontWeight: '500', fontSize: '16px', color: '#fff' }}>
                                        Total Amount
                                    </Typography>
                                    <Typography sx={{ fontWeight: '500', fontSize: '20px', color: '#fff' }}>
                                        {formatCurrency(totalAmount)}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Card sx={{ bgcolor: '#063455', borderRadius: '16px' }}>
                                <CardContent sx={{ textAlign: 'center' }}>
                                    <Typography sx={{ fontWeight: '500', fontSize: '16px', color: '#fff' }}>
                                        Live Report
                                    </Typography>
                                    <AccessTimeIcon sx={{ fontSize: 25, color: '#fff' }} />
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>

                    {/* Orders Table */}
                    <Paper elevation={2} sx={{ p: 3 }}>
                        <Typography variant="h5" sx={{ mb: 3, fontWeight: '600', textAlign: 'center' }}>
                            RUNNING SALES ORDERS
                        </Typography>

                        {runningOrders && Array.isArray(runningOrders) && runningOrders.length > 0 ? (
                            <TableContainer component={Paper} elevation={1}>
                                <Table>
                                    <TableHead>
                                        <TableRow sx={{bgcolor:'#063455'}}>
                                            <TableCell sx={{ fontWeight: '600', color:'#fff' }}>
                                                Sr #
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: '600', color:'#fff' }}>
                                                Invoice #
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: '600', color:'#fff' }}>
                                                Date
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: '600', color:'#fff' }}>
                                                Time
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: '600', color:'#fff' }}>
                                                Table #
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: '600', color:'#fff' }}>
                                                Restaurant
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: '600', color:'#fff' }}>
                                                Order Taker
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: '600', color:'#fff' }}>
                                                Customer Type
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: '600', color:'#fff' }}>
                                                Customer #
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: '600', color:'#fff' }}>
                                                Customer Name
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: '600', color:'#fff' }}>
                                                Grand Total
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: '600', color:'#fff' }}>
                                                Cashier
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: '600', color:'#fff' }}>
                                                Order Mode
                                            </TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {runningOrders.map((order, index) => (
                                            <TableRow
                                                key={order.id}
                                                sx={{
                                                    '&:nth-of-type(odd)': {
                                                        backgroundColor: '#fafafa'
                                                    }
                                                }}
                                            >
                                                <TableCell sx={{ fontSize: '0.8rem', textAlign: 'center', fontWeight: 'bold' }}>
                                                    {index + 1}
                                                </TableCell>
                                                <TableCell sx={{ fontSize: '0.8rem', textAlign: 'center', fontWeight: 'bold', color: '#0a3d62' }}>
                                                    {order.invoice_no || order.id}
                                                </TableCell>
                                                <TableCell sx={{ fontSize: '0.8rem', textAlign: 'center' }}>
                                                    {formatDate(order.start_date || order.created_at)}
                                                </TableCell>
                                                <TableCell sx={{ fontSize: '0.8rem', textAlign: 'center' }}>
                                                    {order.start_time ? order.start_time : formatTime(order.created_at)}
                                                </TableCell>
                                                <TableCell sx={{ fontSize: '0.8rem', textAlign: 'center', fontWeight: 'bold' }}>
                                                    {order.table?.table_no || order.table_id || 'N/A'}
                                                </TableCell>
                                                <TableCell sx={{ fontSize: '0.8rem' }}>
                                                    {order.tenant?.name || 'N/A'}
                                                </TableCell>
                                                <TableCell sx={{ fontSize: '0.8rem', textAlign: 'center' }}>
                                                    {order.waiter?.name || 'N/A'}
                                                </TableCell>
                                                <TableCell sx={{ fontSize: '0.8rem', textAlign: 'center' }}>
                                                    {getCustomerType(order)}
                                                </TableCell>
                                                <TableCell sx={{ fontSize: '0.8rem', textAlign: 'center' }}>
                                                    {getCustomerNo(order)}
                                                </TableCell>
                                                <TableCell sx={{ fontSize: '0.8rem' }}>
                                                    {getCustomerName(order)}
                                                </TableCell>
                                                <TableCell sx={{ fontSize: '0.8rem', textAlign: 'right', fontWeight: 'bold', color: '#4caf50' }}>
                                                    {formatCurrency(order.total_price || 0)}
                                                </TableCell>
                                                <TableCell sx={{ fontSize: '0.8rem' }}>
                                                    {order.cashier?.name || order.cashier_name || 'N/A'}
                                                </TableCell>
                                                <TableCell sx={{ fontSize: '0.8rem', textAlign: 'center' }}>
                                                    {formatOrderType(order.order_type)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        ) : (
                            <Box sx={{ textAlign: 'center', py: 4 }}>
                                <RestaurantIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                                <Typography variant="h6" color="text.secondary">
                                    No running orders found for today
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                    All orders have been completed or there are no orders yet.
                                </Typography>
                            </Box>
                        )}

                        {/* Summary Footer */}
                        {runningOrders && runningOrders.length > 0 && (
                            <Box sx={{ mt: 4, p: 3, bgcolor: '#f0f7ff', borderRadius: 2, border: '2px solid #0a3d62' }}>
                                <Typography
                                    variant="h6"
                                    sx={{
                                        textAlign: 'center',
                                        fontWeight: 'bold',
                                        color: '#0a3d62'
                                    }}
                                >
                                    TOTAL RUNNING ORDERS: {totalOrders} | TOTAL AMOUNT: {formatCurrency(totalAmount)}
                                </Typography>
                            </Box>
                        )}
                    </Paper>
                </Box>
            </div>
        </>
    );
}
