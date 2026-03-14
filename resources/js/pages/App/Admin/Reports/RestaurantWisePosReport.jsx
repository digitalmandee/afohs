import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    Box,
    Paper,
    Typography,
    Button,
    Checkbox,
    TextField,
    Grid,
    Divider,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Card,
    CardContent,
    Stack,
    FormControlLabel,
    Autocomplete
} from '@mui/material';
import { Search } from '@mui/icons-material';
import PrintIcon from '@mui/icons-material/Print';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import { format } from 'date-fns';
import dayjs from "dayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

export default function RestaurantWisePosReport({ allReportsData, tenants, waiters, cashiers, startDate, endDate, grandTotal, grandSubTotal, grandDiscount, grandTax, grandTotalSale, filters }) {
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
        start_date: filters?.start_date || startDate,
        end_date: filters?.end_date || endDate,
        tenant_ids: toIntArray(filters?.tenant_ids),
        customer_types: toArray(filters?.customer_types),
        customer_search: filters?.customer_search || '',
        waiter_ids: toIntArray(filters?.waiter_ids),
        cashier_ids: toIntArray(filters?.cashier_ids),
        table_nos: toArray(filters?.table_nos),
        category_names: toArray(filters?.category_names),
        item_search: filters?.item_search || '',
        discounted_only: Boolean(filters?.discounted_only) && String(filters?.discounted_only) !== '0',
        taxed_only: Boolean(filters?.taxed_only) && String(filters?.taxed_only) !== '0',
        payment_statuses: toArray(filters?.payment_statuses),
    });

    const handleFilterChange = (field, value) => {
        setReportFilters((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const applyFilters = () => {
        router.get(route('admin.reports.pos.restaurant-wise'), reportFilters);
    };

    const handlePrintAll = () => {
        const printUrl = route('admin.reports.pos.restaurant-wise.print', reportFilters);
        window.open(printUrl, '_blank');
    };

    const formatDate = (dateString) => {
        try {
            return format(new Date(dateString), 'dd/MM/yyyy');
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

    const showTaxColumn =
        Number(grandTax || 0) > 0 ||
        (allReportsData || []).some((r) => Number(r?.report_data?.total_tax || 0) > 0);

    return (
        <>
            {/* <Head title="Restaurant-Wise POS Reports" /> */}
            {/* <SideNav open={open} setOpen={setOpen} /> */}

            <div
                style={{
                    minHeight: '100vh',
                    backgroundColor: '#f5f5f5'
                }}
            >
                <Box sx={{ p: 2 }}>
                    <Box sx={{ mb: 1 }}>
                        <Grid container justifyContent="space-between" alignItems="center">
                            <Grid item>
                                <Typography sx={{ fontWeight: '700', fontSize: '30px', color: '#063455' }}>
                                    DISH BREAKDOWN SUMMARY (RESTAURANT-WISE)
                                </Typography>
                            </Grid>
                            <Grid item>
                                <Button
                                    variant="contained"
                                    startIcon={<PrintIcon />}
                                    onClick={handlePrintAll}
                                    sx={{
                                        backgroundColor: '#063455',
                                        color: 'white',
                                        textTransform: 'none',
                                        borderRadius: '16px',
                                        '&:hover': { backgroundColor: '#063455' }
                                    }}
                                >
                                    Print All Reports
                                </Button>
                            </Grid>
                        </Grid>
                    </Box>

                    <Box sx={{ mb: 1.5 }}>
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
                                            sx: { minWidth: 160 },
                                            InputProps: {
                                                sx: { borderRadius: '16px', '& fieldset': { borderRadius: '16px' } },
                                            },
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
                                            sx: { minWidth: 160 },
                                            InputProps: {
                                                sx: { borderRadius: '16px', '& fieldset': { borderRadius: '16px' } },
                                            },
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
                                sx={{ minWidth: 240 }}
                            />

                            <Autocomplete
                                multiple
                                size="small"
                                options={[
                                    { label: 'Member', value: 'member' },
                                    { label: 'Guest', value: 'guest' },
                                    { label: 'Employee', value: 'employee' },
                                ]}
                                getOptionLabel={(opt) => opt.label}
                                value={[
                                    { label: 'Member', value: 'member' },
                                    { label: 'Guest', value: 'guest' },
                                    { label: 'Employee', value: 'employee' },
                                ].filter((o) => reportFilters.customer_types.includes(o.value))}
                                onChange={(_, value) => handleFilterChange('customer_types', value.map((v) => v.value))}
                                renderInput={(params) => <TextField {...params} label="Customer Type" />}
                                sx={{ minWidth: 220 }}
                            />

                            <TextField
                                size="small"
                                label="Customer Name/No"
                                value={reportFilters.customer_search}
                                onChange={(e) => handleFilterChange('customer_search', e.target.value)}
                                sx={{ minWidth: 220 }}
                            />

                            <Autocomplete
                                multiple
                                size="small"
                                options={waiters || []}
                                getOptionLabel={(opt) => opt?.name || ''}
                                value={(waiters || []).filter((w) => reportFilters.waiter_ids.includes(w.id))}
                                onChange={(_, value) => handleFilterChange('waiter_ids', value.map((v) => v.id))}
                                renderInput={(params) => <TextField {...params} label="Waiter" />}
                                sx={{ minWidth: 200 }}
                            />

                            <Autocomplete
                                multiple
                                size="small"
                                options={cashiers || []}
                                getOptionLabel={(opt) => opt?.name || ''}
                                value={(cashiers || []).filter((c) => reportFilters.cashier_ids.includes(c.id))}
                                onChange={(_, value) => handleFilterChange('cashier_ids', value.map((v) => v.id))}
                                renderInput={(params) => <TextField {...params} label="Cashier" />}
                                sx={{ minWidth: 200 }}
                            />

                            <Autocomplete
                                multiple
                                freeSolo
                                size="small"
                                options={[]}
                                value={reportFilters.table_nos}
                                onChange={(_, value) => handleFilterChange('table_nos', value)}
                                renderInput={(params) => <TextField {...params} label="Table #" />}
                                sx={{ minWidth: 140 }}
                            />

                            <Autocomplete
                                multiple
                                freeSolo
                                size="small"
                                options={[]}
                                value={reportFilters.category_names}
                                onChange={(_, value) => handleFilterChange('category_names', value)}
                                renderInput={(params) => <TextField {...params} label="Category" />}
                                sx={{ minWidth: 220 }}
                            />

                            <TextField
                                size="small"
                                label="Item Code/Name"
                                value={reportFilters.item_search}
                                onChange={(e) => handleFilterChange('item_search', e.target.value)}
                                sx={{ minWidth: 200 }}
                            />

                            <Autocomplete
                                multiple
                                size="small"
                                options={[
                                    { label: 'Advance', value: 'advance' },
                                    { label: 'Paid', value: 'paid' },
                                    { label: 'Unpaid', value: 'unpaid' },
                                ]}
                                getOptionLabel={(opt) => opt.label}
                                value={[
                                    { label: 'Advance', value: 'advance' },
                                    { label: 'Paid', value: 'paid' },
                                    { label: 'Unpaid', value: 'unpaid' },
                                ].filter((o) => reportFilters.payment_statuses.includes(o.value))}
                                onChange={(_, value) => handleFilterChange('payment_statuses', value.map((v) => v.value))}
                                renderInput={(params) => <TextField {...params} label="Status" />}
                                sx={{ minWidth: 180 }}
                            />

                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={reportFilters.discounted_only}
                                        onChange={(e) => handleFilterChange('discounted_only', e.target.checked)}
                                        size="small"
                                    />
                                }
                                label="Discounted"
                            />
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={reportFilters.taxed_only}
                                        onChange={(e) => handleFilterChange('taxed_only', e.target.checked)}
                                        size="small"
                                    />
                                }
                                label="Taxed"
                            />

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

                    <Box sx={{ mb: 1.5, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
                        <Typography sx={{ fontWeight: 700, color: '#063455' }}>Items: {grandTotal}</Typography>
                        <Typography sx={{ fontWeight: 700, color: '#063455' }}>
                            Sub Total: {formatCurrency(grandSubTotal)}
                        </Typography>
                        <Typography sx={{ fontWeight: 700, color: '#063455' }}>
                            Discount: {formatCurrency(grandDiscount)}
                        </Typography>
                        {showTaxColumn && (
                            <Typography sx={{ fontWeight: 700, color: '#063455' }}>
                                Tax: {formatCurrency(grandTax)}
                            </Typography>
                        )}
                        <Typography sx={{ fontWeight: 700, color: '#063455' }}>
                            Total Sale: {formatCurrency(grandTotalSale)}
                        </Typography>
                    </Box>

                    {/* Restaurants List */}
                    <Paper elevation={2} sx={{ p: 3 }}>
                        <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold', textAlign: 'center' }}>
                            Restaurant-Wise Financial Summary
                        </Typography>

                        <Typography variant="subtitle1" sx={{ mb: 2, textAlign: 'center', color: 'text.secondary' }}>
                            Report Date: {formatDate(startDate)} {startDate !== endDate ? `to ${formatDate(endDate)}` : ''}
                        </Typography>

                        <Divider sx={{ mb: 3 }} />

                        {allReportsData && Array.isArray(allReportsData) && allReportsData.length > 0 ? (
                            allReportsData.map((restaurantData, index) => (
                                <Box key={index} sx={{ mb: 6 }}>
                                    {/* Restaurant Header */}
                                    <Box sx={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        mb: 2,
                                        p: 2,
                                        backgroundColor: '#0a3d62',
                                        color: 'white',
                                        borderRadius: 1
                                    }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <RestaurantIcon sx={{ fontSize: 30 }} />
                                            <Box>
                                                <Typography variant="h6" sx={{ fontWeight: 'bold', textTransform: 'uppercase' }}>
                                                    {restaurantData.tenant_name}
                                                </Typography>
                                                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                                    Total Sale: {formatCurrency(restaurantData.report_data.total_sale)}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Box>

                                    {/* Financial Table for Restaurant */}
                                    <TableContainer component={Paper}>
                                        <Table>
                                            <TableHead>
                                                <TableRow sx={{bgcolor:'#063455'}}>
                                                    <TableCell sx={{ fontWeight: '600', color:'#fff' }}>
                                                        Item Code
                                                    </TableCell>
                                                    <TableCell sx={{ fontWeight: '600', color:'#fff' }}>
                                                        Item Name
                                                    </TableCell>
                                                    <TableCell sx={{ fontWeight: '600', color:'#fff' }}>
                                                        QTY Sold
                                                    </TableCell>
                                                    <TableCell sx={{ fontWeight: '600', color:'#fff' }}>
                                                        Sale Price
                                                    </TableCell>
                                                    <TableCell sx={{ fontWeight: '600', color:'#fff' }}>
                                                        Sub Total
                                                    </TableCell>
                                                    <TableCell sx={{ fontWeight: '600', color:'#fff'}}>
                                                        Discount
                                                    </TableCell>
                                                    {showTaxColumn && (
                                                        <TableCell sx={{ fontWeight: '600', color: '#fff' }}>Tax</TableCell>
                                                    )}
                                                    <TableCell sx={{ fontWeight: '600', color:'#fff' }}>
                                                        Total Sale
                                                    </TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {restaurantData.report_data && Array.isArray(restaurantData.report_data.categories) && restaurantData.report_data.categories.map((category, categoryIndex) => (
                                                    <React.Fragment key={categoryIndex}>
                                                        {/* Category Header Row */}
                                                        <TableRow sx={{ bgcolor: '#f8f8f8' }}>
                                                            <TableCell
                                                                colSpan={showTaxColumn ? 8 : 7}
                                                                sx={{
                                                                    fontWeight: 'bold',
                                                                    fontSize: '0.95rem',
                                                                    textTransform: 'uppercase',
                                                                    py: 1.5,
                                                                    borderTop: '2px solid #ddd'
                                                                }}
                                                            >
                                                                {category.category_name}
                                                            </TableCell>
                                                        </TableRow>

                                                        {/* Category Items */}
                                                        {Array.isArray(category.items) && category.items.map((item, itemIndex) => (
                                                            <TableRow
                                                                key={itemIndex}
                                                                sx={{
                                                                    '&:nth-of-type(odd)': {
                                                                        backgroundColor: '#fafafa'
                                                                    }
                                                                }}
                                                            >
                                                                <TableCell sx={{ fontSize: '0.8rem', textAlign: 'center', fontWeight: 'bold' }}>
                                                                    {item.menu_code || 'N/A'}
                                                                </TableCell>
                                                                <TableCell sx={{ fontSize: '0.8rem' }}>
                                                                    {item.name}
                                                                </TableCell>
                                                                <TableCell sx={{ fontSize: '0.8rem', textAlign: 'center', fontWeight: 'bold', color: '#0a3d62' }}>
                                                                    {item.quantity}
                                                                </TableCell>
                                                                <TableCell sx={{ fontSize: '0.8rem', textAlign: 'center', fontWeight: 'bold' }}>
                                                                    {formatCurrency(item.price)}
                                                                </TableCell>
                                                                <TableCell sx={{ fontSize: '0.8rem', textAlign: 'center', fontWeight: 'bold' }}>
                                                                    {formatCurrency(item.sub_total)}
                                                                </TableCell>
                                                                <TableCell sx={{ fontSize: '0.8rem', textAlign: 'center', fontWeight: 'bold', color: '#ff9800' }}>
                                                                    {formatCurrency(item.discount)}
                                                                </TableCell>
                                                                {showTaxColumn && (
                                                                    <TableCell
                                                                        sx={{ fontSize: '0.8rem', textAlign: 'center', fontWeight: 'bold', color: '#1e88e5' }}
                                                                    >
                                                                        {formatCurrency(item.tax)}
                                                                    </TableCell>
                                                                )}
                                                                <TableCell sx={{ fontSize: '0.8rem', textAlign: 'center', fontWeight: 'bold', color: '#4caf50' }}>
                                                                    {formatCurrency(item.total_sale)}
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}

                                                        {/* Category Total Row */}
                                                        <TableRow sx={{ bgcolor: '#063455' }}>
                                                            <TableCell sx={{ fontWeight: '600', color:'#fff' }}>
                                                            </TableCell>
                                                            <TableCell sx={{ fontWeight: '600', color:'#fff' }}>
                                                                {category.category_name.toUpperCase()} TOTAL:
                                                            </TableCell>
                                                            <TableCell sx={{ fontWeight: '600', color:'#fff' }}>
                                                                {category.total_quantity}
                                                            </TableCell>
                                                            <TableCell sx={{ fontWeight: '600', color:'#fff' }}>
                                                                -
                                                            </TableCell>
                                                            <TableCell sx={{ fontWeight: '600', color:'#fff' }}>
                                                                {formatCurrency(category.total_sub_total)}
                                                            </TableCell>
                                                            <TableCell sx={{ fontWeight: '600', color:'#fff' }}>
                                                                {formatCurrency(category.total_discount)}
                                                            </TableCell>
                                                            {showTaxColumn && (
                                                                <TableCell sx={{ fontWeight: '600', color: '#fff' }}>
                                                                    {formatCurrency(category.total_tax)}
                                                                </TableCell>
                                                            )}
                                                            <TableCell sx={{ fontWeight: '600', color:'#fff' }}>
                                                                {formatCurrency(category.total_sale)}
                                                            </TableCell>
                                                        </TableRow>
                                                    </React.Fragment>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </Box>
                            ))
                        ) : (
                            <Box sx={{ textAlign: 'center', py: 4 }}>
                                <RestaurantIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                                <Typography variant="h6" color="text.secondary">
                                    No restaurant data available for the selected date range
                                </Typography>
                            </Box>
                        )}

                        {/* Grand Total */}
                        {allReportsData && allReportsData.length > 0 && (
                            <Box sx={{ mt: 4, p: 3, bgcolor: '#f0f7ff', borderRadius: 2, border: '2px solid #0a3d62' }}>
                                <Typography
                                    variant="h5"
                                    sx={{
                                        textAlign: 'center',
                                        fontWeight: 'bold',
                                        color: '#0a3d62',
                                        mb: 2
                                    }}
                                >
                                    GRAND TOTALS ACROSS ALL RESTAURANTS
                                </Typography>
                                <Stack direction="row" spacing={2} flexWrap="wrap" justifyContent="center" useFlexGap>
                                    <Typography variant="body1">
                                        <strong>Items: {grandTotal}</strong>
                                    </Typography>
                                    <Typography variant="body1">
                                        <strong>Sub Total: {formatCurrency(grandSubTotal)}</strong>
                                    </Typography>
                                    <Typography variant="body1">
                                        <strong>Discount: {formatCurrency(grandDiscount)}</strong>
                                    </Typography>
                                    {showTaxColumn && (
                                        <Typography variant="body1">
                                            <strong>Tax: {formatCurrency(grandTax)}</strong>
                                        </Typography>
                                    )}
                                    <Typography variant="body1">
                                        <strong>Total Sale: {formatCurrency(grandTotalSale)}</strong>
                                    </Typography>
                                </Stack>
                            </Box>
                        )}
                    </Paper>
                </Box>
            </div>
        </>
    );
}
