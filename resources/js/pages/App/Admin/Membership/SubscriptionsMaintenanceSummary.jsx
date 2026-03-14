import { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { router, usePage } from '@inertiajs/react';
import { TextField, Box, Paper, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Button, Grid, FormControl, InputLabel, Select, MenuItem, Autocomplete } from '@mui/material';
import { Print, Search, ArrowBack } from '@mui/icons-material';
import dayjs from "dayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

const SubscriptionsMaintenanceSummary = () => {
    // Get props first
    const { summary, grand_totals, filters, all_categories } = usePage().props;

    // Modal state
    // const [open, setOpen] = useState(true);
    const [allFilters, setAllFilters] = useState({
        date_from: filters?.date_from || '',
        date_to: filters?.date_to || '',
        category: filters?.category || '',
    });

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-PK', {
            style: 'currency',
            currency: 'PKR',
            minimumFractionDigits: 0,
        }).format(amount || 0);
    };

    const handleSearch = () => {
        router.get(route('membership.subscriptions-maintenance-summary'), allFilters, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleFilterChange = (field, value) => {
        setAllFilters(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleReset = () => {
        setAllFilters({
            date_from: '',
            date_to: '',
            category: '',
        });
        router.get(route('membership.subscriptions-maintenance-summary'));
    };

    const handlePrint = () => {
        // Build query string with current filters
        const params = new URLSearchParams();

        if (allFilters.date_from) {
            params.append('date_from', allFilters.date_from);
        }

        if (allFilters.date_to) {
            params.append('date_to', allFilters.date_to);
        }

        if (allFilters.category) {
            params.append('category', allFilters.category);
        }

        // Open print page in new window
        const printUrl = route('membership.subscriptions-maintenance-summary.print') + (params.toString() ? '?' + params.toString() : '');
        window.open(printUrl, '_blank');
    };

    return (
        <>
            {/* <SideNav open={open} setOpen={setOpen} />
            <div
                style={{
                    marginLeft: open ? `${drawerWidthOpen}px` : `${drawerWidthClosed}px`,
                    transition: 'margin-left 0.3s ease-in-out',
                    marginTop: '5rem',
                    backgroundColor: '#F6F6F6',
                }}
            > */}
            <div className="container-fluid px-4 py-4" style={{ backgroundColor: '#f5f5f5', minHeight: '100vh', overflowX: 'hidden' }}>
                {/* Top Bar */}
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div className="d-flex align-items-center">
                        <IconButton onClick={() => window.history.back()}>
                            <ArrowBack sx={{ color: '#063455' }} />
                        </IconButton>
                        <Typography sx={{ fontWeight: 600, fontSize: '24px', color: '#063455' }}>
                            MEMBER REVENUE BY PAYMENT METHOD REPORT
                        </Typography>
                    </div>
                    <Button
                        variant="contained"
                        startIcon={<Print />}
                        onClick={handlePrint}
                        sx={{
                            backgroundColor: '#063455',
                            color: 'white',
                            textTransform: 'none',
                            borderRadius: '16px',
                            '&:hover': {
                                backgroundColor: '#063455',
                            },
                        }}
                    >
                        Print
                    </Button>
                </div>

                {/* Search and Filters */}
                <Box sx={{ mb: 3, pt: 2 }}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={3}>
                            {/* <TextField
                                fullWidth
                                size="small"
                                type="date"
                                label="From Date"
                                value={allFilters.date_from}
                                onChange={(e) => handleFilterChange('date_from', e.target.value)}
                                InputLabelProps={{
                                    shrink: true,
                                }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2,
                                    },
                                }}
                            /> */}
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DatePicker
                                    label="From Date"
                                    format="DD-MM-YYYY"
                                    value={allFilters.date_from ? dayjs(allFilters.date_from, "DD-MM-YYYY") : null}
                                    onChange={(newValue) =>
                                        handleFilterChange(
                                            "date_from",
                                            newValue ? newValue.format("DD-MM-YYYY") : ""
                                        )
                                    }
                                    slotProps={{
                                        textField: {
                                            fullWidth: true,
                                            size: "small",
                                            sx: {
                                                "& .MuiOutlinedInput-root": {
                                                    borderRadius: "16px",
                                                },
                                                "& fieldset": {
                                                    borderRadius: "16px",
                                                },
                                            },
                                        },
                                    }}
                                />
                            </LocalizationProvider>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            {/* <TextField
                                fullWidth
                                size="small"
                                type="date"
                                label="To Date"
                                value={allFilters.date_to}
                                onChange={(e) => handleFilterChange('date_to', e.target.value)}
                                InputLabelProps={{
                                    shrink: true,
                                }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2,
                                    },
                                }}
                            /> */}
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DatePicker
                                    label="To Date"
                                    format="DD-MM-YYYY"
                                    value={allFilters.date_to ? dayjs(allFilters.date_to, "DD-MM-YYYY") : null}
                                    onChange={(newValue) =>
                                        handleFilterChange(
                                            "date_to",
                                            newValue ? newValue.format("DD-MM-YYYY") : ""
                                        )
                                    }
                                    slotProps={{
                                        textField: {
                                            fullWidth: true,
                                            size: "small",
                                            sx: {
                                                "& .MuiOutlinedInput-root": {
                                                    borderRadius: "16px",
                                                },
                                                "& fieldset": {
                                                    borderRadius: "16px",
                                                },
                                            },
                                        },
                                    }}
                                />
                            </LocalizationProvider>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            {/* <FormControl fullWidth size="small">
                                <InputLabel>Choose Category</InputLabel>
                                <Select
                                    value={allFilters.category}
                                    onChange={(e) => handleFilterChange('category', e.target.value)}
                                >
                                    <MenuItem value="">All Categories</MenuItem>
                                    {all_categories && all_categories.map((category) => (
                                        <MenuItem key={category.id} value={category.id}>
                                            {category.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl> */}
                            <Autocomplete
                                multiple
                                value={all_categories.filter(cat => allFilters.category?.includes(cat.id)) || []}
                                onChange={(event, newValue) => {
                                    const categoryIds = newValue.map(cat => cat.id);
                                    handleFilterChange('category', categoryIds);
                                }}
                                ListboxProps={{
                                    sx: {
                                        maxHeight: 300, // optional height
                                        px: 1,

                                        "& .MuiAutocomplete-option": {
                                            borderRadius: "16px",
                                            mx: 0.5,
                                            my: 0.5,
                                        },

                                        "& .MuiAutocomplete-option:hover": {
                                            backgroundColor: "#063455",
                                            color: "#fff",
                                        },

                                        "& .MuiAutocomplete-option[aria-selected='true']": {
                                            backgroundColor: "#063455",
                                            color: "#fff",
                                        },

                                        "& .MuiAutocomplete-option[aria-selected='true']:hover": {
                                            backgroundColor: "#063455",
                                            color: "#fff",
                                        },
                                    },
                                }}
                                options={all_categories || []}
                                getOptionLabel={(option) => option.name || ''}
                                isOptionEqualToValue={(option, value) => option.id === value?.id}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Choose Categories"
                                        placeholder="All Categories"
                                        size="small"
                                        fullWidth
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }}
                                    />
                                )}
                            />
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button
                                    variant="contained"
                                    startIcon={<Search />}
                                    onClick={handleSearch}
                                    sx={{
                                        backgroundColor: '#063455',
                                        // flex: 1,
                                        textTransform: 'none',
                                        borderRadius:'16px',
                                        '&:hover': {
                                            backgroundColor: '#063455',
                                        },
                                    }}
                                >
                                    Search
                                </Button>
                                <Button
                                    variant="outlined"
                                    onClick={handleReset}
                                    sx={{
                                        borderColor: '#063455',
                                        color: '#063455',
                                        textTransform: 'none',
                                        borderRadius:'16px',
                                        '&:hover': {
                                            // backgroundColor: '#fef2f2',
                                            borderColor: '#063455',
                                        },
                                    }}
                                >
                                    Reset
                                </Button>
                            </Box>
                        </Grid>
                    </Grid>
                </Box>

                {/* Summary Table */}
                <Box sx={{ mb: 3 }}>
                    <TableContainer sx={{ borderRadius: '16px', overflowX: 'auto' }}>
                        <Table>
                            <TableHead>
                                <TableRow style={{ backgroundColor: '#063455' }}>
                                    <TableCell sx={{ color: 'white', fontSize: '14px', fontWeight: 600, }}>
                                        SR
                                    </TableCell>
                                    <TableCell sx={{ color: 'white', fontSize: '14px', fontWeight: 600, }}>
                                        Category
                                    </TableCell>
                                    <TableCell sx={{ color: 'white', fontSize: '14px', fontWeight: 600, }}>
                                        Cash
                                    </TableCell>
                                    <TableCell sx={{ color: 'white', fontSize: '14px', fontWeight: 600, }}>
                                        Credit Card
                                    </TableCell>
                                    <TableCell sx={{ color: 'white', fontSize: '14px', fontWeight: 600, }}>
                                    Bank/Online
                                    </TableCell>
                                    <TableCell sx={{ color: 'white', fontSize: '14px', fontWeight: 600, }}>
                                        Total Revenue
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {summary && Object.keys(summary).length > 0 ? (
                                    Object.entries(summary).map(([categoryName, amounts], index) => (
                                        <TableRow
                                            key={categoryName}
                                            sx={{
                                                '&:nth-of-type(odd)': { backgroundColor: '#f9fafb' },
                                                '&:hover': { backgroundColor: '#f3f4f6' },
                                                borderBottom: '1px solid #e5e7eb',
                                            }}
                                        >
                                            <TableCell sx={{ color: '#374151', fontWeight: 600, fontSize: '14px', textAlign: 'center' }}>
                                                {index + 1}
                                            </TableCell>
                                            <TableCell sx={{ color: '#374151', fontWeight: 600, fontSize: '14px' }}>
                                                {categoryName}
                                            </TableCell>
                                            <TableCell sx={{ color: '#059669', fontWeight: 600, fontSize: '14px', textAlign: 'center' }}>
                                                {amounts.cash > 0 ? formatCurrency(amounts.cash).replace('PKR', '') : '0'}
                                            </TableCell>
                                            <TableCell sx={{ color: '#0ea5e9', fontWeight: 600, fontSize: '14px', textAlign: 'center' }}>
                                                {amounts.credit_card > 0 ? formatCurrency(amounts.credit_card).replace('PKR', '') : '0'}
                                            </TableCell>
                                            <TableCell sx={{ color: '#8b5cf6', fontWeight: 600, fontSize: '14px', textAlign: 'center' }}>
                                                {amounts.bank_online > 0 ? formatCurrency(amounts.bank_online).replace('PKR', '') : '0'}
                                            </TableCell>
                                            <TableCell sx={{ color: '#dc2626', fontWeight: 700, fontSize: '14px', textAlign: 'center' }}>
                                                {formatCurrency(amounts.total).replace('PKR', '')}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                                            <Typography color="textSecondary">
                                                No subscription or maintenance fee records found for the selected criteria
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                )}

                                {/* Grand Total Row */}
                                {summary && Object.keys(summary).length > 0 && (
                                    <TableRow sx={{ backgroundColor: '#063455', borderTop: '2px solid #374151' }}>
                                        <TableCell sx={{ fontWeight: 700, color: 'white', fontSize: '16px', textAlign: 'center' }}>

                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: 'white', fontSize: '16px' }}>
                                            GRAND TOTAL
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: 'white', fontSize: '16px', textAlign: 'center' }}>
                                            {grand_totals.cash > 0 ? formatCurrency(grand_totals.cash).replace('PKR', '') : '0'}
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: 'white', fontSize: '16px', textAlign: 'center' }}>
                                            {grand_totals.credit_card > 0 ? formatCurrency(grand_totals.credit_card).replace('PKR', '') : '0'}
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: 'white', fontSize: '16px', textAlign: 'center' }}>
                                            {grand_totals.bank_online > 0 ? formatCurrency(grand_totals.bank_online).replace('PKR', '') : '0'}
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: 'white', fontSize: '16px', textAlign: 'center' }}>
                                            {formatCurrency(grand_totals.total).replace('PKR', '')}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>

                {/* Summary Info */}
                {summary && Object.keys(summary).length > 0 && (
                    <Box sx={{ mt: 3, p: 3, backgroundColor: 'white', borderRadius: 2, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: '#374151', mb: 2 }}>
                            Summary Statistics
                        </Typography>
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={3}>
                                <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#dcfce7', borderRadius: 2 }}>
                                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#059669' }}>
                                        {formatCurrency(grand_totals.cash).replace('PKR', '')}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#047857', fontWeight: 600 }}>
                                        Total Cash Revenue
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#dbeafe', borderRadius: 2 }}>
                                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#0ea5e9' }}>
                                        {formatCurrency(grand_totals.credit_card).replace('PKR', '')}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#0284c7', fontWeight: 600 }}>
                                        Total Credit Card Revenue
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#ede9fe', borderRadius: 2 }}>
                                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#8b5cf6' }}>
                                        {formatCurrency(grand_totals.bank_online).replace('PKR', '')}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#7c3aed', fontWeight: 600 }}>
                                        Total Bank/Online Revenue
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#fecaca', borderRadius: 2 }}>
                                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#dc2626' }}>
                                        {formatCurrency(grand_totals.total).replace('PKR', '')}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#b91c1c', fontWeight: 600 }}>
                                        Grand Total Revenue
                                    </Typography>
                                </Box>
                            </Grid>
                        </Grid>
                    </Box>
                )}
            </div>
            {/* </div> */}
        </>
    );
};

export default SubscriptionsMaintenanceSummary;
