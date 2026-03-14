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
import ReceiptIcon from '@mui/icons-material/Receipt';
import { format } from 'date-fns';
import dayjs from "dayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

export default function SalesSummaryWithItems({ salesData, startDate, endDate, tenants, waiters, cashiers, grandTotalQty, grandTotalAmount, grandTotalDiscount, grandTotalTax, grandTotalSale, filters }) {
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
        setReportFilters((prev) => ({ ...prev, [field]: value }));
    };

    const applyFilters = () => {
        router.get(route('admin.reports.pos.sales-summary-with-items'), reportFilters);
    };

    const handlePrint = () => {
        const printUrl = route('admin.reports.pos.sales-summary-with-items.print', reportFilters);
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
        Number(grandTotalTax || 0) > 0 || (salesData || []).some((inv) => Number(inv?.total_tax || 0) > 0);

    return (
        <>
            {/* <Head title="Sales Summary (With Items)" /> */}
            {/* <SideNav open={open} setOpen={setOpen} /> */}

            <div
                style={{
                    minHeight: '100vh',
                    backgroundColor: "#f5f5f5"
                }}
            >
                <Box sx={{ p: 2 }}>
                    {/* Header */}
                    <Box sx={{ mb: 2 }}>
                        <Grid container justifyContent="space-between" alignItems="center">
                            <Grid item>
                                <Typography sx={{ fontWeight: '700', fontSize: '30px', color: '#063455' }}>
                                    Sales Summary (With Items)
                                </Typography>
                            </Grid>
                            <Grid item>
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
                            </Grid>
                        </Grid>
                        <Typography sx={{ fontWeight: '600', fontSize: '15px', color: '#063455' }}>
                            Invoice-wise detailed sales report with item breakdown
                        </Typography>
                    </Box>

                    <Box sx={{ mb: 2 }}>
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
                                            sx: { minWidth: 160 },
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
                                    borderRadius: '16px',
                                    textTransform: 'none',
                                    '&:hover': { backgroundColor: '#063455' },
                                }}
                            >
                                Search
                            </Button>
                        </Stack>
                    </Box>

                    {/* Summary Stats */}
                    <Grid container spacing={3} sx={{ mb: 3 }}>
                        <Grid item xs={12} md={3}>
                            <Card sx={{ borderRadius: '16px', bgcolor: '#063455' }}>
                                <CardContent sx={{ textAlign: 'center' }}>
                                    <Typography sx={{ fontWeight: '500', fontSize: '16px', color: '#fff' }}>
                                        Total Invoices
                                    </Typography>
                                    <Typography sx={{ fontWeight: '500', fontSize: '20px', color: '#fff' }}>
                                        {salesData?.length || 0}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Card sx={{ borderRadius: '16px', bgcolor: '#063455' }}>
                                <CardContent sx={{ textAlign: 'center' }}>
                                    <Typography sx={{ fontWeight: '500', fontSize: '16px', color: '#fff' }}>
                                        Total Quantity
                                    </Typography>
                                    <Typography sx={{ fontWeight: '500', fontSize: '20px', color: '#fff' }}>
                                        {grandTotalQty}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Card sx={{ borderRadius: '16px', bgcolor: '#063455' }}>
                                <CardContent sx={{ textAlign: 'center' }}>
                                    <Typography sx={{ fontWeight: '500', fontSize: '16px', color: '#fff' }}>
                                        Total Discount
                                    </Typography>
                                    <Typography sx={{ fontWeight: '500', fontSize: '20px', color: '#fff' }}>
                                        {formatCurrency(grandTotalDiscount)}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Card sx={{ borderRadius: '16px', bgcolor: '#063455' }}>
                                <CardContent sx={{ textAlign: 'center' }}>
                                    <Typography sx={{ fontWeight: '500', fontSize: '16px', color: '#fff' }}>
                                        Total Sale
                                    </Typography>
                                    <Typography sx={{ fontWeight: '500', fontSize: '20px', color: '#fff' }}>
                                        {formatCurrency(grandTotalSale)}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>

                    {/* Sales Report */}
                    <Paper elevation={2} sx={{ p: 3 }}>
                        <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold', textAlign: 'center' }}>
                            AFOHS - SALES SUMMARY (WITH ITEMS)
                        </Typography>

                        <Divider sx={{ mb: 3 }} />

                        {salesData && Array.isArray(salesData) && salesData.length > 0 ? (
                            <Box>
                                {salesData.map((invoice, index) => (
                                    <Box key={index} sx={{ mb: 4, border: '1px solid #ddd', borderRadius: 2 }}>
                                        {/* Invoice Header */}
                                        <Box sx={{
                                            p: 2,
                                            backgroundColor: '#f5f5f5',
                                            borderBottom: '1px solid #ddd',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}>
                                            <Box>
                                                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                                    INVOICE#: {invoice.invoice_no}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    DATE: {invoice.date} | CUSTOMER: {invoice.customer} | ORDER VIA: {invoice.order_via}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    WAITER: {invoice.waiter} | TABLE#: {invoice.table} | COVERS: {invoice.covers}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ textAlign: 'right' }}>
                                                <Typography variant="body2" color="text.secondary">
                                                    KOT: {invoice.kot}
                                                </Typography>
                                            </Box>
                                        </Box>

                                        {/* Items Table */}
                                        <TableContainer>
                                            <Table size="small">
                                                <TableHead>
                                                    <TableRow sx={{bgcolor:'#063455'}}>
                                                        <TableCell sx={{ fontWeight: '600', color: '#fff' }}>Time</TableCell>
                                                        <TableCell sx={{ fontWeight: '600', color:'#fff' }}>Item Code</TableCell>
                                                        <TableCell sx={{ fontWeight: '600', color:'#fff' }}>Item Name</TableCell>
                                                        <TableCell sx={{ fontWeight: '600', color:'#fff', }}>QTY Sold</TableCell>
                                                        <TableCell sx={{ fontWeight: '600', color:'#fff' }}>Sale Price</TableCell>
                                                        <TableCell sx={{ fontWeight: '600', color:'#fff' }}>Sub Total</TableCell>
                                                        <TableCell sx={{ fontWeight: '600', color:'#fff' }}>Discount</TableCell>
                                                        {showTaxColumn && (
                                                            <TableCell sx={{ fontWeight: '600', color: '#fff' }}>Tax</TableCell>
                                                        )}
                                                        <TableCell sx={{ fontWeight: '600', color:'#fff' }}>Total Sale</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {invoice.items.map((item, itemIndex) => (
                                                        <TableRow key={itemIndex}>
                                                            <TableCell sx={{ fontSize: '0.75rem' }}>{item.time || '-'}</TableCell>
                                                            <TableCell sx={{ fontSize: '0.75rem' }}>{item.code}</TableCell>
                                                            <TableCell sx={{ fontSize: '0.75rem' }}>{item.name}</TableCell>
                                                            <TableCell sx={{ fontSize: '0.75rem', textAlign: 'center' }}>{item.qty}</TableCell>
                                                            <TableCell sx={{ fontSize: '0.75rem', textAlign: 'center' }}>{formatCurrency(item.sale_price)}</TableCell>
                                                            <TableCell sx={{ fontSize: '0.75rem', textAlign: 'center' }}>{formatCurrency(item.sub_total)}</TableCell>
                                                            <TableCell sx={{ fontSize: '0.75rem', textAlign: 'center' }}>{formatCurrency(item.discount)}</TableCell>
                                                            {showTaxColumn && (
                                                                <TableCell sx={{ fontSize: '0.75rem', textAlign: 'center' }}>
                                                                    {formatCurrency(item.tax)}
                                                                </TableCell>
                                                            )}
                                                            <TableCell sx={{ fontSize: '0.75rem', textAlign: 'center', fontWeight: 'bold' }}>{formatCurrency(item.total_sale)}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                    {/* Invoice Total Row */}
                                                    <TableRow sx={{ backgroundColor: '#063455' }}>
                                                        <TableCell sx={{ fontWeight: '600', color:'#fff' }}>TOTAL:</TableCell>
                                                        <TableCell sx={{ fontWeight: '600', color:'#fff' }}></TableCell>
                                                        <TableCell sx={{ fontWeight: '600', color:'#fff' }}></TableCell>
                                                        <TableCell sx={{ fontWeight: '600', color:'#fff' }}>{invoice.total_qty}</TableCell>
                                                        <TableCell sx={{ fontWeight: '600', color:'#fff' }}></TableCell>
                                                        <TableCell sx={{ fontWeight: '600', color:'#fff' }}>{formatCurrency(invoice.total_amount)}</TableCell>
                                                        <TableCell sx={{ fontWeight: '600', color:'#fff' }}>{formatCurrency(invoice.total_discount)}</TableCell>
                                                        {showTaxColumn && (
                                                            <TableCell sx={{ fontWeight: '600', color: '#fff' }}>
                                                                {formatCurrency(invoice.total_tax)}
                                                            </TableCell>
                                                        )}
                                                        <TableCell sx={{ fontWeight: '600', color:'#fff' }}>{formatCurrency(invoice.total_sale)}</TableCell>
                                                    </TableRow>
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    </Box>
                                ))}

                                {/* Grand Total */}
                                <Box sx={{ mt: 4, p: 3, bgcolor: '#0a3d62', color: 'white', borderRadius: 2 }}>
                                    <Typography
                                        variant="h6"
                                        sx={{
                                            textAlign: 'center',
                                            fontWeight: 'bold',
                                            mb: 2
                                        }}
                                    >
                                        GRAND TOTALS
                                    </Typography>
                                    <Stack direction="row" spacing={2} flexWrap="wrap" justifyContent="center" useFlexGap>
                                        <Typography variant="body1">
                                            <strong>Invoices: {salesData.length}</strong>
                                        </Typography>
                                        <Typography variant="body1">
                                            <strong>Quantity: {grandTotalQty}</strong>
                                        </Typography>
                                        <Typography variant="body1">
                                            <strong>Discount: {formatCurrency(grandTotalDiscount)}</strong>
                                        </Typography>
                                        {showTaxColumn && (
                                            <Typography variant="body1">
                                                <strong>Tax: {formatCurrency(grandTotalTax)}</strong>
                                            </Typography>
                                        )}
                                        <Typography variant="body1">
                                            <strong>Total Sale: {formatCurrency(grandTotalSale)}</strong>
                                        </Typography>
                                    </Stack>
                                </Box>
                            </Box>
                        ) : (
                            <Box sx={{ textAlign: 'center', py: 4 }}>
                                <ReceiptIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                                <Typography variant="h6" color="text.secondary">
                                    No sales data found for the selected date range
                                </Typography>
                            </Box>
                        )}
                    </Paper>
                </Box>
            </div>
        </>
    );
}
