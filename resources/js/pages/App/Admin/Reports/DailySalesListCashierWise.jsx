import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    Box,
    Paper,
    Typography,
    Button,
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
    Autocomplete,
    FormControl,
    InputLabel,
    Select,
    MenuItem
} from '@mui/material';
import { Search } from '@mui/icons-material';
import PrintIcon from '@mui/icons-material/Print';
import FilterListIcon from '@mui/icons-material/FilterList';
import PersonIcon from '@mui/icons-material/Person';
import { format } from 'date-fns';
import dayjs from "dayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

export default function DailySalesListCashierWise({
    cashierData,
    allCashiers = [],
    tenants,
    waiters,
    startDate,
    endDate,
    grandTotalSale,
    grandTotalDiscount,
    grandTotalSTax,
    grandTotalCash,
    grandTotalCredit,
    grandTotalPaid,
    grandTotalUnpaid,
    grandTotal,
    filters
}) {
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

    const [dateFilters, setDateFilters] = useState({
        start_date: filters?.start_date || startDate,
        end_date: filters?.end_date || endDate,
        cashier_ids: toIntArray(filters?.cashier_ids),
    });

    const handleFilterChange = (field, value) => {
        setDateFilters(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const applyFilters = () => {
        router.get(route('admin.reports.pos.daily-sales-list-cashier-wise'), dateFilters);
    };

    const handlePrint = () => {
        const printUrl = route('admin.reports.pos.daily-sales-list-cashier-wise.print', dateFilters);
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
        return 'Rs ' + new Intl.NumberFormat('en-PK', {
            style: 'decimal',
            minimumFractionDigits: 1,
            maximumFractionDigits: 2
        }).format(amount).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    };

    return (
        <>
            {/* <Head title="Daily Sales List (Cashier-Wise)" /> */}
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
                                    Daily Sales List (Cashier-Wise)
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
                        <Typography sx={{ fontWeight: '600', fontSize: '16px', color: '#063455' }}>
                            Sales summary grouped by cashier with payment details
                        </Typography>
                    </Box>

                    {/* Filters */}
                    <Box sx={{ mt: 4, mb: 2 }}>
                        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                            {/* <FilterListIcon color="primary" />
                            <Typography variant="h6">Filters</Typography> */}
                            {/* <TextField
                                label="Start Date"
                                type="date"
                                size="small"
                                value={dateFilters.start_date}
                                onChange={(e) => handleFilterChange('start_date', e.target.value)}
                                InputLabelProps={{ shrink: true }}
                            /> */}
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DatePicker
                                    label="Start Date"
                                    format="DD/MM/YYYY"
                                    value={
                                        dateFilters.start_date
                                            ? dayjs(dateFilters.start_date)
                                            : null
                                    }
                                    onChange={(newValue) =>
                                        handleFilterChange(
                                            "start_date",
                                            newValue ? newValue.format("YYYY-MM-DD") : ""
                                        )
                                    }
                                    slotProps={{
                                        textField: {
                                            size: "small",
                                            InputProps: {
                                                sx: {
                                                    borderRadius: "16px",
                                                    "& fieldset": {
                                                        borderRadius: "16px",
                                                    },
                                                },
                                            },
                                        },
                                    }}
                                />
                            </LocalizationProvider>
                            {/* <TextField
                                label="End Date"
                                type="date"
                                size="small"
                                value={dateFilters.end_date}
                                onChange={(e) => handleFilterChange('end_date', e.target.value)}
                                InputLabelProps={{ shrink: true }}
                            /> */}
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DatePicker
                                    label="End Date"
                                    format="DD/MM/YYYY"
                                    value={
                                        dateFilters.end_date
                                            ? dayjs(dateFilters.end_date)
                                            : null
                                    }
                                    onChange={(newValue) =>
                                        handleFilterChange(
                                            "end_date",
                                            newValue ? newValue.format("YYYY-MM-DD") : ""
                                        )
                                    }
                                    slotProps={{
                                        textField: {
                                            size: "small",
                                            InputProps: {
                                                sx: {
                                                    borderRadius: "16px",
                                                    "& fieldset": {
                                                        borderRadius: "16px",
                                                    },
                                                },
                                            },
                                        },
                                    }}
                                />
                            </LocalizationProvider>
                            {/* <FormControl size="small" sx={{ minWidth: 200 }}>
                                <InputLabel>Cashier</InputLabel>
                                <Select
                                    value={dateFilters.cashier_id}
                                    onChange={(e) => handleFilterChange('cashier_id', e.target.value)}
                                    label="Cashier"
                                >
                                    <MenuItem value="">
                                        <em>All Cashiers</em>
                                    </MenuItem>
                                    {allCashiers.map((cashier) => (
                                        <MenuItem key={cashier.id} value={cashier.id}>
                                            {cashier.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl> */}
                            <Autocomplete
                                multiple
                                size="small"
                                options={allCashiers}
                                getOptionLabel={(option) => option.name || ""}
                                value={allCashiers.filter((c) => dateFilters.cashier_ids.includes(c.id))}
                                onChange={(event, newValue) =>
                                    handleFilterChange("cashier_ids", newValue.map((v) => v.id))
                                }
                                isOptionEqualToValue={(option, value) => option.id === value.id}
                                slotProps={{
                                    paper: {
                                        sx: {
                                            borderRadius: "16px",
                                            boxShadow: "none",
                                            mt: 1,
                                        },
                                    },
                                    listbox: {
                                        sx: {
                                            "& .MuiAutocomplete-option": {
                                                borderRadius: "16px",
                                                mx: 1,
                                                my: 0.3,
                                            },
                                            "& .MuiAutocomplete-option:hover": {
                                                backgroundColor: "#063455 !important",
                                                color: "#fff",
                                                mx: 1,
                                                my: 0.3,
                                            },
                                            "& .MuiAutocomplete-option.Mui-focused": {
                                                backgroundColor: "#063455 !important",
                                                color: "#fff",
                                                mx: 1,
                                                my: 0.3,
                                            },
                                        },
                                    },
                                }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Cashier"
                                        sx={{
                                            minWidth: 200,
                                            "& .MuiOutlinedInput-root": {
                                                borderRadius: "16px",
                                                "& fieldset": {
                                                    borderRadius: "16px",
                                                },
                                            },
                                        }}
                                    />
                                )}
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
                                    '&:hover': { backgroundColor: '#063455' }
                                }}
                            >
                                Search
                            </Button>
                        </Stack>
                    </Box>

                    {/* Summary Stats */}
                    <Grid container spacing={3} sx={{ mb: 3 }}>
                        <Grid item xs={12} md={3}>
                            <Card sx={{ bgcolor: '#063455', borderRadius: '16px' }}>
                                <CardContent sx={{ textAlign: 'center' }}>
                                    <Typography sx={{ fontWeight: '500', fontSize: '16px', color: '#fff' }}>
                                        Active Cashiers
                                    </Typography>
                                    <Typography sx={{ fontWeight: '500', fontSize: '20px', color: '#fff' }}>
                                        {cashierData?.length || 0}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Card sx={{ bgcolor: '#063455', borderRadius: '16px' }}>
                                <CardContent sx={{ textAlign: 'center' }}>
                                    <Typography sx={{ fontWeight: '500', fontSize: '16px', color: '#fff' }}>
                                        Total Sales
                                    </Typography>
                                    <Typography sx={{ fontWeight: '500', fontSize: '20px', color: '#fff' }}>
                                        {formatCurrency(grandTotalSale)}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Card sx={{ bgcolor: '#063455', borderRadius: '16px' }}>
                                <CardContent sx={{ textAlign: 'center' }}>
                                    <Typography sx={{ fontWeight: '500', fontSize: '16px', color: '#fff' }}>
                                        Total Paid
                                    </Typography>
                                    <Typography sx={{ fontWeight: '500', fontSize: '20px', color: '#fff' }}>
                                        {formatCurrency(grandTotalPaid)}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Card sx={{ bgcolor: '#063455', borderRadius: '16px' }}>
                                <CardContent sx={{ textAlign: 'center' }}>
                                    <Typography sx={{ fontWeight: '500', fontSize: '16px', color: '#fff' }}>
                                        Total Unpaid
                                    </Typography>
                                    <Typography sx={{ fontWeight: '500', fontSize: '20px', color: '#fff' }}>
                                        {formatCurrency(grandTotalUnpaid)}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>

                    {/* Cashier Sales Report */}
                    <Paper elevation={2} sx={{ p: 3 }}>
                        <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold', textAlign: 'center' }}>
                            AFOHS - DAILY SALES LIST (CASHIER-WISE)
                        </Typography>

                        <Divider sx={{ mb: 3 }} />

                        {cashierData && Array.isArray(cashierData) && cashierData.length > 0 ? (
                            <TableContainer component={Paper} elevation={1}>
                                <Table>
                                    <TableHead>
                                        <TableRow sx={{ backgroundColor: '#063455' }}>
                                            <TableCell sx={{ fontWeight: '600', color: '#fff' }}>
                                                Cashier Name
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: '600', color: '#fff' }}>
                                                Sale
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: '600', color: '#fff' }}>
                                                Discount
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: '600', color: '#fff' }}>
                                                S.TAX AMT
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: '600', color: '#fff' }}>
                                                Cash
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: '600', color: '#fff' }}>
                                                Credit
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: '600', color: '#fff' }}>
                                                Paid
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: '600', color: '#fff' }}>
                                                Unpaid
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: '600', color: '#fff' }}>
                                                Total
                                            </TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {cashierData.map((cashier, index) => (
                                            <TableRow
                                                key={index}
                                                sx={{
                                                    '&:nth-of-type(odd)': {
                                                        backgroundColor: '#fafafa'
                                                    },
                                                    '&:hover': {
                                                        backgroundColor: '#f0f7ff'
                                                    }
                                                }}
                                            >
                                                <TableCell sx={{ fontSize: '0.8rem', fontWeight: 'bold', borderRight: '1px solid #ddd' }}>
                                                    {cashier.name}
                                                </TableCell>
                                                <TableCell sx={{ fontSize: '0.8rem', textAlign: 'center', borderRight: '1px solid #ddd' }}>
                                                    {formatCurrency(cashier.sale)}
                                                </TableCell>
                                                <TableCell sx={{ fontSize: '0.8rem', textAlign: 'center', borderRight: '1px solid #ddd' }}>
                                                    {formatCurrency(cashier.discount)}
                                                </TableCell>
                                                <TableCell sx={{ fontSize: '0.8rem', textAlign: 'center', borderRight: '1px solid #ddd' }}>
                                                    {formatCurrency(cashier.s_tax_amt)}
                                                </TableCell>
                                                <TableCell sx={{ fontSize: '0.8rem', textAlign: 'center', borderRight: '1px solid #ddd' }}>
                                                    {formatCurrency(cashier.cash)}
                                                </TableCell>
                                                <TableCell sx={{ fontSize: '0.8rem', textAlign: 'center', borderRight: '1px solid #ddd' }}>
                                                    {formatCurrency(cashier.credit)}
                                                </TableCell>
                                                <TableCell sx={{ fontSize: '0.8rem', textAlign: 'center', fontWeight: 'bold', color: '#4caf50', borderRight: '1px solid #ddd' }}>
                                                    {formatCurrency(cashier.paid)}
                                                </TableCell>
                                                <TableCell sx={{ fontSize: '0.8rem', textAlign: 'center', fontWeight: 'bold', color: '#ff9800', borderRight: '1px solid #ddd' }}>
                                                    {formatCurrency(cashier.unpaid)}
                                                </TableCell>
                                                <TableCell sx={{ fontSize: '0.8rem', textAlign: 'center', fontWeight: 'bold', color: '#0a3d62' }}>
                                                    {formatCurrency(cashier.total)}
                                                </TableCell>
                                            </TableRow>
                                        ))}

                                        {/* Grand Total Row */}
                                        <TableRow sx={{ backgroundColor: '#063455', color: '#fff' }}>
                                            <TableCell sx={{ fontWeight: '600', color: 'white' }}>
                                                GRAND TOTAL:
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: '600', color: 'white' }}>
                                                {formatCurrency(grandTotalSale)}
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: '600', color: 'white' }}>
                                                {formatCurrency(grandTotalDiscount)}
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: '600', color: 'white' }}>
                                                {formatCurrency(grandTotalSTax)}
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: '600', color: 'white' }}>
                                                {formatCurrency(grandTotalCash)}
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: '600', color: 'white' }}>
                                                {formatCurrency(grandTotalCredit)}
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: '600', color: 'white', }}>
                                                {formatCurrency(grandTotalPaid)}
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: '600', color: 'white' }}>
                                                {formatCurrency(grandTotalUnpaid)}
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: '600', color: 'white' }}>
                                                {formatCurrency(grandTotal)}
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        ) : (
                            <Box sx={{ textAlign: 'center', py: 4 }}>
                                <PersonIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                                <Typography variant="h6" color="text.secondary">
                                    No cashier sales data found for the selected date range
                                </Typography>
                            </Box>
                        )}
                    </Paper>
                </Box>
            </div>
        </>
    );
}
