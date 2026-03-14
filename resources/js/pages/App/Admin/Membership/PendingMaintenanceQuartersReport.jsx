import { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { router, usePage } from '@inertiajs/react';
import { TextField, Box, Paper, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Button, Grid, FormControl, InputLabel, Select, MenuItem, Autocomplete, Dialog, DialogTitle, DialogContent } from '@mui/material';
import { Search, Print, ArrowBack, InfoOutlined, OpenInNew, Close } from '@mui/icons-material';
import dayjs from "dayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { PendingMaintenanceReportView } from './PendingMaintenanceReport';

const PendingMaintenanceQuartersReport = () => {
    // Get props first
    const { summary, grand_totals, filters, all_categories, all_statuses } = usePage().props;

    // Filter state
    const [allFilters, setAllFilters] = useState({
        date_from: filters?.date_from || '',
        date_to: filters?.date_to || '',
        category: filters?.category || '',
    });

    // Detail modal state
    const [detailModal, setDetailModal] = useState({
        open: false,
        categoryId: null,
        categoryName: '',
        quartersValue: null,
        quartersLabel: '',
    });

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-PK', {
            style: 'currency',
            currency: 'PKR',
            minimumFractionDigits: 0,
        }).format(amount || 0);
    };

    // Open the detail modal with category and quarter info
    const handleOpenDetail = (categoryId, categoryName, quartersValue, quartersLabel) => {
        setDetailModal({
            open: true,
            categoryId,
            categoryName,
            quartersValue,
            quartersLabel,
        });
    };

    const handleCloseDetail = () => {
        setDetailModal({ open: false, categoryId: null, categoryName: '', quartersValue: null, quartersLabel: '' });
    };

    // Generate link to detailed Pending Maintenance Report with filters
    const getDetailReportUrl = () => {
        const params = new URLSearchParams();
        if (detailModal.categoryId) {
            params.append('categories[]', detailModal.categoryId);
        }
        if (detailModal.quartersValue) {
            if (detailModal.quartersValue >= 7) {
                params.append('quarters_pending', '6+');
            } else {
                params.append('quarters_pending', String(detailModal.quartersValue));
            }
        }
        return route('membership.pending-maintenance-report') + (params.toString() ? '?' + params.toString() : '');
    };

    const getEmbeddedFilters = () => {
        const date = allFilters.date_to || dayjs().format('DD-MM-YYYY');
        const quarters = detailModal.quartersValue >= 7 ? '6+' : String(detailModal.quartersValue || '1');

        return {
            member_search: '',
            member_id: '',
            name_search: '',
            membership_no_search: '',
            cnic_search: '',
            contact_search: '',
            status: ['active'],
            categories: detailModal.categoryId ? [detailModal.categoryId] : [],
            quarters_pending: quarters,
            per_page: '15',
            date,
        };
    };

    const handleSearch = () => {
        router.get(route('membership.pending-maintenance-quarters-report'), allFilters, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleFilterChange = (field, value) => {
        setAllFilters((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleReset = () => {
        setAllFilters({
            date_from: '',
            date_to: '',
            category: '',
        });
        router.get(route('membership.pending-maintenance-quarters-report'));
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
        const printUrl = route('membership.pending-maintenance-quarters-report.print') + (params.toString() ? '?' + params.toString() : '');
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
                        <Typography sx={{ fontWeight: 600, fontSize: '24px', color: '#063455' }}>Pending Maintenance Report (Category-wise)</Typography>
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
                                backgroundColor: '#052d47',
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
                                value={all_categories.filter((cat) => allFilters.category?.includes(cat.id)) || []}
                                onChange={(event, newValue) => {
                                    const categoryIds = newValue.map((cat) => cat.id);
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
                                renderInput={(params) =>
                                    <TextField {...params}
                                        label="Choose Categories"
                                        placeholder="All Categories"
                                        size="small"
                                        fullWidth
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }}
                                    />}
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
                                        borderRadius:'16px',
                                        textTransform: 'none',
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
                                        borderRadius:'16px',
                                        textTransform: 'none',
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

                {/* Pending Maintenance Quarters Table */}
                <Box sx={{ mb: 3 }}>
                    <TableContainer component={Paper} sx={{ boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', borderRadius: 2, overflowX: 'auto' }}>
                        <Table>
                            <TableHead>
                                <TableRow style={{ backgroundColor: '#063455' }}>
                                    <TableCell sx={{ color: 'white', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', width: '50px' }}>SR #</TableCell>
                                    <TableCell sx={{ color: 'white', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>CATEGORY</TableCell>
                                    <TableCell sx={{ color: 'white', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', textAlign: 'center', backgroundColor: '#059669' }}>1 QUARTER PENDING</TableCell>
                                    <TableCell sx={{ color: 'white', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', textAlign: 'center', backgroundColor: '#0ea5e9' }}>2 QUARTERS PENDING</TableCell>
                                    <TableCell sx={{ color: 'white', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', textAlign: 'center', backgroundColor: '#8b5cf6' }}>3 QUARTERS PENDING</TableCell>
                                    <TableCell sx={{ color: 'white', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', textAlign: 'center', backgroundColor: '#f59e0b' }}>4 QUARTERS PENDING</TableCell>
                                    <TableCell sx={{ color: 'white', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', textAlign: 'center', backgroundColor: '#ef4444' }}>5 QTS PENDING</TableCell>
                                    <TableCell sx={{ color: 'white', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', textAlign: 'center', backgroundColor: '#b91c1c' }}>6 QTS PENDING</TableCell>
                                    <TableCell sx={{ color: 'white', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', textAlign: 'center', backgroundColor: '#dc2626' }}>MORE THAN 6 QTS</TableCell>
                                    <TableCell sx={{ color: 'white', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', textAlign: 'center' }}>MAINTENANCE FEE (QUARTERLY)</TableCell>
                                    <TableCell sx={{ color: 'white', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', textAlign: 'center' }}>TOTAL VALUES</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {summary && Object.keys(summary).length > 0 ? (
                                    Object.entries(summary).map(([categoryName, data], index) => (
                                        <TableRow
                                            key={categoryName}
                                            sx={{
                                                '&:nth-of-type(odd)': { backgroundColor: '#f9fafb' },
                                                '&:hover': { backgroundColor: '#f3f4f6' },
                                                borderBottom: '1px solid #e5e7eb',
                                            }}
                                        >
                                            <TableCell sx={{ color: '#374151', fontWeight: 600, fontSize: '14px', textAlign: 'center' }}>{index + 1}</TableCell>
                                            <TableCell sx={{ color: '#374151', fontWeight: 600, fontSize: '14px' }}>{categoryName}</TableCell>
                                            <TableCell sx={{ color: '#059669', fontWeight: 600, fontSize: '14px', textAlign: 'center' }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                                                    {data['1_quarter_pending']?.count || 0}
                                                    <IconButton size="small" onClick={() => handleOpenDetail(data.category_id, categoryName, 1, '1 Qts')} sx={{ p: 0 }}>
                                                        <InfoOutlined sx={{ fontSize: 14, color: '#059669' }} />
                                                    </IconButton>
                                                </Box>
                                                <Typography variant="caption" sx={{ display: 'block', color: '#059669' }}>
                                                    ({formatCurrency(data['1_quarter_pending']?.amount || 0).replace('PKR', '')})
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={{ color: '#0ea5e9', fontWeight: 600, fontSize: '14px', textAlign: 'center' }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                                                    {data['2_quarters_pending']?.count || 0}
                                                    <IconButton size="small" onClick={() => handleOpenDetail(data.category_id, categoryName, 2, '2 Qts')} sx={{ p: 0 }}>
                                                        <InfoOutlined sx={{ fontSize: 14, color: '#0ea5e9' }} />
                                                    </IconButton>
                                                </Box>
                                                <Typography variant="caption" sx={{ display: 'block', color: '#0ea5e9' }}>
                                                    ({formatCurrency(data['2_quarters_pending']?.amount || 0).replace('PKR', '')})
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={{ color: '#8b5cf6', fontWeight: 600, fontSize: '14px', textAlign: 'center' }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                                                    {data['3_quarters_pending']?.count || 0}
                                                    <IconButton size="small" onClick={() => handleOpenDetail(data.category_id, categoryName, 3, '3 Qts')} sx={{ p: 0 }}>
                                                        <InfoOutlined sx={{ fontSize: 14, color: '#8b5cf6' }} />
                                                    </IconButton>
                                                </Box>
                                                <Typography variant="caption" sx={{ display: 'block', color: '#8b5cf6' }}>
                                                    ({formatCurrency(data['3_quarters_pending']?.amount || 0).replace('PKR', '')})
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={{ color: '#f59e0b', fontWeight: 600, fontSize: '14px', textAlign: 'center' }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                                                    {data['4_quarters_pending']?.count || 0}
                                                    <IconButton size="small" onClick={() => handleOpenDetail(data.category_id, categoryName, 4, '4 Qts')} sx={{ p: 0 }}>
                                                        <InfoOutlined sx={{ fontSize: 14, color: '#f59e0b' }} />
                                                    </IconButton>
                                                </Box>
                                                <Typography variant="caption" sx={{ display: 'block', color: '#f59e0b' }}>
                                                    ({formatCurrency(data['4_quarters_pending']?.amount || 0).replace('PKR', '')})
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={{ color: '#ef4444', fontWeight: 600, fontSize: '14px', textAlign: 'center' }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                                                    {data['5_quarters_pending']?.count || 0}
                                                    <IconButton size="small" onClick={() => handleOpenDetail(data.category_id, categoryName, 5, '5 Qts')} sx={{ p: 0 }}>
                                                        <InfoOutlined sx={{ fontSize: 14, color: '#ef4444' }} />
                                                    </IconButton>
                                                </Box>
                                                <Typography variant="caption" sx={{ display: 'block', color: '#ef4444' }}>
                                                    ({formatCurrency(data['5_quarters_pending']?.amount || 0).replace('PKR', '')})
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={{ color: '#b91c1c', fontWeight: 600, fontSize: '14px', textAlign: 'center' }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                                                    {data['6_quarters_pending']?.count || 0}
                                                    <IconButton size="small" onClick={() => handleOpenDetail(data.category_id, categoryName, 6, '6 Qts')} sx={{ p: 0 }}>
                                                        <InfoOutlined sx={{ fontSize: 14, color: '#b91c1c' }} />
                                                    </IconButton>
                                                </Box>
                                                <Typography variant="caption" sx={{ display: 'block', color: '#b91c1c' }}>
                                                    ({formatCurrency(data['6_quarters_pending']?.amount || 0).replace('PKR', '')})
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={{ color: '#dc2626', fontWeight: 600, fontSize: '14px', textAlign: 'center' }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                                                    {data['more_than_6_quarters_pending']?.count || 0}
                                                    <IconButton size="small" onClick={() => handleOpenDetail(data.category_id, categoryName, 7, '6+ Qts')} sx={{ p: 0 }}>
                                                        <InfoOutlined sx={{ fontSize: 14, color: '#dc2626' }} />
                                                    </IconButton>
                                                </Box>
                                                <Typography variant="caption" sx={{ display: 'block', color: '#dc2626' }}>
                                                    ({formatCurrency(data['more_than_6_quarters_pending']?.amount || 0).replace('PKR', '')})
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={{ color: '#374151', fontWeight: 600, fontSize: '14px', textAlign: 'center' }}>{formatCurrency(data['maintenance_fee_quarterly']).replace('PKR', '')}</TableCell>
                                            <TableCell sx={{ color: '#dc2626', fontWeight: 700, fontSize: '14px', textAlign: 'center' }}>{formatCurrency(data['total_values']).replace('PKR', '')}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={11} align="center" sx={{ py: 4 }}>
                                            <Typography color="textSecondary">No pending maintenance records found for the selected criteria</Typography>
                                        </TableCell>
                                    </TableRow>
                                )}

                                {/* Grand Total Row */}
                                {summary && Object.keys(summary).length > 0 && (
                                    <TableRow sx={{ backgroundColor: '#063455', borderTop: '2px solid #374151' }}>
                                        <TableCell sx={{ fontWeight: 700, color: 'white', fontSize: '16px', textAlign: 'center' }}></TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: 'white', fontSize: '16px' }}>GRAND TOTAL</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: 'white', fontSize: '14px', textAlign: 'center' }}>
                                            {grand_totals['1_quarter_pending']?.count || 0}
                                            <Typography variant="caption" sx={{ display: 'block', color: 'white' }}>
                                                ({formatCurrency(grand_totals['1_quarter_pending']?.amount || 0).replace('PKR', '')})
                                            </Typography>
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: 'white', fontSize: '14px', textAlign: 'center' }}>
                                            {grand_totals['2_quarters_pending']?.count || 0}
                                            <Typography variant="caption" sx={{ display: 'block', color: 'white' }}>
                                                ({formatCurrency(grand_totals['2_quarters_pending']?.amount || 0).replace('PKR', '')})
                                            </Typography>
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: 'white', fontSize: '14px', textAlign: 'center' }}>
                                            {grand_totals['3_quarters_pending']?.count || 0}
                                            <Typography variant="caption" sx={{ display: 'block', color: 'white' }}>
                                                ({formatCurrency(grand_totals['3_quarters_pending']?.amount || 0).replace('PKR', '')})
                                            </Typography>
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: 'white', fontSize: '14px', textAlign: 'center' }}>
                                            {grand_totals['4_quarters_pending']?.count || 0}
                                            <Typography variant="caption" sx={{ display: 'block', color: 'white' }}>
                                                ({formatCurrency(grand_totals['4_quarters_pending']?.amount || 0).replace('PKR', '')})
                                            </Typography>
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: 'white', fontSize: '14px', textAlign: 'center' }}>
                                            {grand_totals['5_quarters_pending']?.count || 0}
                                            <Typography variant="caption" sx={{ display: 'block', color: 'white' }}>
                                                ({formatCurrency(grand_totals['5_quarters_pending']?.amount || 0).replace('PKR', '')})
                                            </Typography>
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: 'white', fontSize: '14px', textAlign: 'center' }}>
                                            {grand_totals['6_quarters_pending']?.count || 0}
                                            <Typography variant="caption" sx={{ display: 'block', color: 'white' }}>
                                                ({formatCurrency(grand_totals['6_quarters_pending']?.amount || 0).replace('PKR', '')})
                                            </Typography>
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: 'white', fontSize: '14px', textAlign: 'center' }}>
                                            {grand_totals['more_than_6_quarters_pending']?.count || 0}
                                            <Typography variant="caption" sx={{ display: 'block', color: 'white' }}>
                                                ({formatCurrency(grand_totals['more_than_6_quarters_pending']?.amount || 0).replace('PKR', '')})
                                            </Typography>
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: 'white', fontSize: '14px', textAlign: 'center' }}>{formatCurrency(grand_totals['maintenance_fee_quarterly']).replace('PKR', '')}</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: 'white', fontSize: '14px', textAlign: 'center' }}>{formatCurrency(grand_totals['total_values']).replace('PKR', '')}</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>

                {/* Summary Statistics */}
                {summary && Object.keys(summary).length > 0 && (
                    <Box sx={{ mt: 3, p: 3, backgroundColor: 'white', borderRadius: 2, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: '#374151', mb: 2 }}>
                            Pending Quarters Summary
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={6} md={1.7}>
                                <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#dcfce7', borderRadius: 2 }}>
                                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#059669' }}>
                                        {grand_totals['1_quarter_pending']?.count || 0}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#047857', fontWeight: 600 }}>
                                        1 Qts Pending
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={6} md={1.7}>
                                <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#dbeafe', borderRadius: 2 }}>
                                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#0ea5e9' }}>
                                        {grand_totals['2_quarters_pending']?.count || 0}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#0284c7', fontWeight: 600 }}>
                                        2 Qts Pending
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={6} md={1.7}>
                                <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#ede9fe', borderRadius: 2 }}>
                                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#8b5cf6' }}>
                                        {grand_totals['3_quarters_pending']?.count || 0}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#7c3aed', fontWeight: 600 }}>
                                        3 Qts Pending
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={6} md={1.7}>
                                <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#fef3c7', borderRadius: 2 }}>
                                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#f59e0b' }}>
                                        {grand_totals['4_quarters_pending']?.count || 0}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#d97706', fontWeight: 600 }}>
                                        4 Qts Pending
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={6} md={1.7}>
                                <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#fee2e2', borderRadius: 2 }}>
                                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#ef4444' }}>
                                        {grand_totals['5_quarters_pending']?.count || 0}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#dc2626', fontWeight: 600 }}>
                                        5 Qts Pending
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={6} md={1.7}>
                                <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#fca5a5', borderRadius: 2 }}>
                                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#b91c1c' }}>
                                        {grand_totals['6_quarters_pending']?.count || 0}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#991b1b', fontWeight: 600 }}>
                                        6 Qts Pending
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={6} md={1.7}>
                                <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#fecaca', borderRadius: 2 }}>
                                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#dc2626' }}>
                                        {grand_totals['more_than_6_quarters_pending']?.count || 0}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#b91c1c', fontWeight: 600 }}>
                                        6+ Qts Pending
                                    </Typography>
                                </Box>
                            </Grid>
                        </Grid>
                        <Box sx={{ mt: 3, textAlign: 'center', p: 3, backgroundColor: '#f3f4f6', borderRadius: 2 }}>
                            <Typography variant="h3" sx={{ fontWeight: 700, color: '#dc2626' }}>
                                {formatCurrency(grand_totals['total_values']).replace('PKR', '')}
                            </Typography>
                            <Typography variant="h6" sx={{ color: '#374151', fontWeight: 600 }}>
                                Total Pending Amount
                            </Typography>
                        </Box>
                    </Box>
                )}
            </div>
            <Dialog open={detailModal.open} onClose={handleCloseDetail} fullScreen>
                <DialogTitle sx={{ backgroundColor: '#063455', color: 'white', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                        <Typography sx={{ fontWeight: 700, fontSize: '16px' }}>{detailModal.categoryName}</Typography>
                        <Typography sx={{ fontSize: '13px', opacity: 0.9 }}>{detailModal.quartersLabel} Pending</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <IconButton
                            onClick={() => window.open(getDetailReportUrl(), '_blank')}
                            sx={{ color: 'white' }}
                            size="small"
                        >
                            <OpenInNew />
                        </IconButton>
                        <IconButton onClick={handleCloseDetail} sx={{ color: 'white' }} size="small">
                            <Close />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent sx={{ p: 0 }}>
                    <PendingMaintenanceReportView
                        initialMembers={null}
                        initialStatistics={null}
                        initialFilters={getEmbeddedFilters()}
                        all_statuses={all_statuses || []}
                        all_categories={all_categories || []}
                        embedded
                        onClose={handleCloseDetail}
                    />
                </DialogContent>
            </Dialog>
        </>
    );
};

export default PendingMaintenanceQuartersReport;
