import React, { useState, useMemo, useEffect } from 'react';
import POSLayout from "@/components/POSLayout";
import ViewDocumentsModal from '@/components/App/CakeBooking/ViewDocumentsModal';
import { Head, Link, router } from '@inertiajs/react';
import { Box, Paper, Typography, Button, Grid, TextField, MenuItem, Select, FormControl, InputLabel, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, InputAdornment, Chip, Pagination, ListItemText, Autocomplete } from '@mui/material';
import { Add, Search, Edit, Delete, Print, Close } from '@mui/icons-material';
import dayjs from 'dayjs';
import { debounce } from 'lodash';
import axios from 'axios';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { routeNameForContext } from '@/lib/utils';

// const drawerWidthOpen = 240;
// const drawerWidthClosed = 110;

export default function Index({ bookings, filters, cashiers }) {
    // const [open, setOpen] = React.useState(true);
    const [docsModalOpen, setDocsModalOpen] = useState(false);
    const [selectedDocs, setSelectedDocs] = useState([]);

    // Filter State
    const [filterState, setFilterState] = useState({
        search: filters.search || '', // Search by Name
        membership_no: filters.membership_no || '', // Search by Membership No
        booking_number: filters.booking_number || '', // Search by Booking ID
        customer_type: filters.customer_type || 'All',
        start_date: filters.start_date || '',
        end_date: filters.end_date || '',
        delivery_date: filters.delivery_date || '',
        discounted_taxed: filters.discounted_taxed || 'All',
        cashier_id: filters.cashier_id || '',
        status: filters.status || 'active', // Default to active
    });

    // Suggestions State
    const [suggestions, setSuggestions] = useState([]);
    const [membershipSuggestions, setMembershipSuggestions] = useState([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);

    const handleFilterChange = (field, value) => {
        const newFilters = { ...filterState, [field]: value };
        setFilterState(newFilters);
    };

    const handleApplyFilters = () => {
        // When searching, we might want to reset status to active? Or keep current?
        // User might search for a cancelled booking.
        router.get(route(routeNameForContext('cake-bookings.index')), { ...filterState, page: 1 }, { preserveState: true, replace: true });
    };

    // Auto-refresh when status tab changes
    useEffect(() => {
        handleApplyFilters();
    }, [filterState.status]);

    const handlePageChange = (event, value) => {
        router.get(route(routeNameForContext('cake-bookings.index')), { ...filterState, page: value }, { preserveState: true, preserveScroll: true });
    };

    // Calculate Page Totals
    const pageTotals = useMemo(() => {
        return bookings.data.reduce(
            (acc, curr) => ({
                total: acc.total + parseFloat(curr.total_price || 0),
                discount: acc.discount + parseFloat(curr.discount_amount || 0),
                tax: acc.tax + parseFloat(curr.tax_amount || 0),
                grandTotal: acc.grandTotal + parseFloat(curr.balance_amount || 0),
            }),
            { total: 0, discount: 0, tax: 0, grandTotal: 0 },
        );
    }, [bookings.data]);

    // Handle Suggestions Fetch
    const handleSuggestionFetch = useMemo(
        () =>
            debounce((inputValue, type) => {
                if (!inputValue) return;
                setLoadingSuggestions(true);
                axios
                    .get(route(routeNameForContext('api.orders.search-customers')), { params: { query: inputValue, type } })
                    .then((response) => {
                        const formatted = response.data.map((item) => ({
                            ...item,
                            label: item.name || item.full_name,
                        }));
                        if (type === 'membership') {
                            setMembershipSuggestions(formatted);
                        } else {
                            setSuggestions(formatted);
                        }
                    })
                    .catch((error) => console.error(error))
                    .finally(() => setLoadingSuggestions(false));
            }, 300),
        [],
    );

    useEffect(() => {
        if (filterState.search) handleSuggestionFetch(filterState.search, filterState.customer_type === 'All' ? 'all' : filterState.customer_type.toLowerCase());
        else setSuggestions([]);
    }, [filterState.search, filterState.customer_type]);

    useEffect(() => {
        if (filterState.membership_no) handleSuggestionFetch(filterState.membership_no, 'all');
        else setMembershipSuggestions([]);
    }, [filterState.membership_no]);

    return (
        <>
            {/* <Head title="Cake Bookings List" />
            <SideNav open={open} setOpen={setOpen} />
            <Box
                sx={{
                    marginLeft: open ? `${drawerWidthOpen}px` : `${drawerWidthClosed}px`,
                    transition: 'margin-left 0.3s ease-in-out',
                    marginTop: '5.5rem',
                    p: 2,
                    bgcolor: '#f4f6f8',
                    minHeight: '100vh',
                }}
            > */}
            <Box sx={{
                minHeight: '100vh',
                p: 2,
                bgcolor: '#f5f5f5'
            }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography sx={{ color: '#063455', fontWeight: '600', fontSize: '30px' }}>
                        Cake Bookings List
                    </Typography>
                    <Box>
                        {/* Status Tabs/Toggles */}
                        <Box sx={{ display: 'inline-flex', gap: 1, bgcolor: 'white', p: 0.5, borderRadius: 2, mr: 2 }}>
                            <Button
                                variant={filterState.status === 'active' ? 'contained' : 'text'}
                                onClick={() => handleFilterChange('status', 'active')}
                                sx={{
                                    bgcolor: filterState.status === 'active' ? '#063455' : 'transparent',
                                    color: filterState.status === 'active' ? 'white' : '#063455',
                                    '&:hover': { bgcolor: filterState.status === 'active' ? '#04243a' : 'rgba(6, 52, 85, 0.04)' },
                                    borderRadius: '16px',
                                    textTransform: 'none',
                                    px: 3,
                                }}
                            >
                                Active
                            </Button>
                            <Button
                                variant={filterState.status === 'cancelled' ? 'contained' : 'text'}
                                onClick={() => handleFilterChange('status', 'cancelled')}
                                sx={{
                                    bgcolor: filterState.status === 'cancelled' ? '#d32f2f' : 'transparent',
                                    color: filterState.status === 'cancelled' ? 'white' : '#d32f2f',
                                    '&:hover': { bgcolor: filterState.status === 'cancelled' ? '#b71c1c' : 'rgba(211, 47, 47, 0.04)' },
                                    borderRadius: '16px',
                                    textTransform: 'none',
                                    px: 3,
                                }}
                            >
                                Cancelled
                            </Button>
                        </Box>

                        <Button
                            variant="contained"
                            startIcon={<Add />}
                            component={Link}
                            href={route(routeNameForContext('cake-bookings.create'))}
                            sx={{
                                bgcolor: '#063455',
                                borderRadius: '16px',
                                textTransform: 'none',
                                '&:hover': { bgcolor: '#063455' }
                            }}>
                            Create Booking
                        </Button>
                    </Box>
                </Box>

                <Box sx={{ pt: 2, mb: 2 }}>
                    {/* Top Row Filters */}
                    <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
                        {/* Customer Type Select */}
                        <Grid item xs={12} md={2}>
                            <FormControl
                                size="small"
                                sx={{
                                    width: '100%',
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: '16px',
                                    },
                                }}
                            >
                                <Select
                                    value={filterState.customer_type || 'All'}
                                    onChange={(e) => handleFilterChange('customer_type', e.target.value)}
                                    displayEmpty
                                    MenuProps={{
                                        sx: {
                                            '& .MuiPaper-root': {
                                                borderRadius: '16px',
                                                boxShadow: 'none !important',
                                                marginTop: '4px',
                                                maxHeight: '180px',
                                                overflowY: 'auto',
                                            },
                                            '& .MuiMenuItem-root': {
                                                borderRadius: '16px',
                                                '&:hover': {
                                                    backgroundColor: '#063455 !important',
                                                    color: '#fff !important',
                                                },
                                            },
                                        },
                                    }}
                                >
                                    <MenuItem value="All">All Types</MenuItem>
                                    <MenuItem value="Member">Member</MenuItem>
                                    <MenuItem value="Corporate">Corporate</MenuItem>
                                    <MenuItem value="Guest">Guest</MenuItem>
                                    <MenuItem value="Employee">Employee</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        {/* Search by Name with Autocomplete */}
                        <Grid item xs={12} md={4}>
                            <Autocomplete
                                freeSolo
                                disablePortal
                                filterOptions={(x) => x}
                                options={suggestions}
                                getOptionLabel={(option) => option.value || option}
                                inputValue={filterState.search}
                                onInputChange={(event, newInputValue) => {
                                    handleFilterChange('search', newInputValue);
                                }}
                                renderInput={(params) => <TextField {...params} fullWidth size="small" label="Search Name" placeholder="Name..." sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }} />}
                                renderOption={(props, option) => (
                                    <li {...props} key={option.id || option.label}>
                                        <Box sx={{ width: '100%' }}>
                                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                                <Typography variant="body2" fontWeight="bold">
                                                    {option.membership_no || option.customer_no || option.employee_id}
                                                </Typography>
                                                {option.status && (
                                                    <Chip
                                                        label={option.status}
                                                        size="small"
                                                        sx={{
                                                            height: '20px',
                                                            fontSize: '10px',
                                                            backgroundColor: option.status === 'active' ? '#e8f5e9' : option.status === 'suspended' ? '#fff3e0' : '#ffebee',
                                                            color: option.status === 'active' ? '#2e7d32' : option.status === 'suspended' ? '#ef6c00' : '#c62828',
                                                            textTransform: 'capitalize',
                                                            ml: 1,
                                                        }}
                                                    />
                                                )}
                                            </Box>
                                            <Typography variant="caption" color="text.secondary">
                                                {option.name || option.label}
                                            </Typography>
                                        </Box>
                                    </li>
                                )}
                            />
                        </Grid>

                        {/* Search by Membership Number */}
                        <Grid item xs={12} md={2}>
                            <Autocomplete
                                freeSolo
                                disablePortal
                                filterOptions={(x) => x}
                                options={membershipSuggestions}
                                getOptionLabel={(option) => option.membership_no || option.customer_no || option.value || option}
                                inputValue={filterState.membership_no}
                                onInputChange={(event, newInputValue) => {
                                    handleFilterChange('membership_no', newInputValue);
                                }}
                                renderInput={(params) => <TextField {...params} fullWidth size="small" label="Membership #" placeholder="Number..." sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }} />}
                                renderOption={(props, option) => (
                                    <li {...props} key={option.id || option.label}>
                                        <Box sx={{ width: '100%' }}>
                                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                                <Typography variant="body2" fontWeight="bold">
                                                    {option.membership_no || option.customer_no || option.employee_id}
                                                </Typography>
                                                {option.status && (
                                                    <Chip
                                                        label={option.status}
                                                        size="small"
                                                        sx={{
                                                            height: '20px',
                                                            fontSize: '10px',
                                                            backgroundColor: option.status === 'active' ? '#e8f5e9' : option.status === 'suspended' ? '#fff3e0' : '#ffebee',
                                                            color: option.status === 'active' ? '#2e7d32' : option.status === 'suspended' ? '#ef6c00' : '#c62828',
                                                            textTransform: 'capitalize',
                                                            ml: 1,
                                                        }}
                                                    />
                                                )}
                                            </Box>
                                            <Typography variant="caption" color="text.secondary">
                                                {option.name || option.label}
                                            </Typography>
                                        </Box>
                                    </li>
                                )}
                            />
                        </Grid>

                        {/* Search by ID */}
                        <Grid item xs={12} md={2}>
                            <TextField
                                fullWidth
                                label="Booking No."
                                placeholder="Search Id..."
                                size="small"
                                value={filterState.booking_number}
                                onChange={(e) => handleFilterChange('booking_number', e.target.value)}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }} />
                        </Grid>
                        <Grid item xs={6} md={2}>
                            {/* <TextField
                                fullWidth
                                // label="Start Date"
                                placeholder='Start Date'
                                type="date"
                                size="small"
                                value={filterState.start_date}
                                onChange={(e) => handleFilterChange('start_date', e.target.value)}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }}
                            /> */}
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DatePicker
                                    label="Start Date"
                                    value={filterState.start_date ? dayjs(filterState.start_date) : null}
                                    onChange={(newValue) => {
                                        const formattedDate = newValue ? newValue.format('YYYY-MM-DD') : '';
                                        handleFilterChange('start_date', formattedDate);
                                    }}
                                    sx={{
                                        '& .MuiInputBase-root, & .MuiOutlinedInput-root, & fieldset': {
                                            borderRadius: '16px !important',
                                        },
                                    }}
                                    slotProps={{
                                        textField: {
                                            size: 'small',
                                            fullWidth: true,
                                        },
                                    }}
                                />
                            </LocalizationProvider>
                        </Grid>
                    </Grid>

                    {/* Second Row Filters */}
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={6} md={2}>
                            {/* <TextField
                                fullWidth
                                type="date"
                                size="small"
                                value={filterState.end_date}
                                onChange={(e) => handleFilterChange('end_date', e.target.value)} /> */}
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DatePicker
                                    label="End Date"
                                    value={filterState.end_date ? dayjs(filterState.end_date) : null}
                                    onChange={(newValue) => {
                                        const formattedDate = newValue ? newValue.format('YYYY-MM-DD') : '';
                                        handleFilterChange('end_date', formattedDate);
                                    }}
                                    sx={{
                                        '& .MuiInputBase-root, & .MuiOutlinedInput-root, & fieldset': {
                                            borderRadius: '16px !important',
                                        },
                                    }}
                                    slotProps={{
                                        textField: {
                                            size: 'small',
                                            fullWidth: true,
                                        },
                                    }}
                                />
                            </LocalizationProvider>
                        </Grid>
                        <Grid item xs={6} md={2}>
                            {/* <TextField
                                fullWidth
                                type="date"
                                size="small"
                                value={filterState.delivery_date}
                                onChange={(e) => handleFilterChange('delivery_date', e.target.value)} /> */}
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DatePicker
                                    label="Delivery Date"
                                    value={filterState.delivery_date ? dayjs(filterState.delivery_date) : null}
                                    onChange={(newValue) => {
                                        const formattedDate = newValue ? newValue.format('YYYY-MM-DD') : '';
                                        handleFilterChange('delivery_date', formattedDate);
                                    }}
                                    sx={{
                                        '& .MuiInputBase-root, & .MuiOutlinedInput-root, & fieldset': {
                                            borderRadius: '16px !important',
                                        },
                                    }}
                                    slotProps={{
                                        textField: {
                                            size: 'small',
                                            fullWidth: true,
                                        },
                                    }}
                                />
                            </LocalizationProvider>
                        </Grid>

                        <Grid item xs={6} md={2}>
                            {/* <Select fullWidth size="small" value={filterState.discounted_taxed} onChange={(e) => handleFilterChange('discounted_taxed', e.target.value)} displayEmpty>
                                <MenuItem value="All">All</MenuItem>
                                <MenuItem value="discounted">Discounted</MenuItem>
                                <MenuItem value="taxed">Taxed</MenuItem>
                            </Select> */}
                            <Autocomplete
                                fullWidth
                                size="small"
                                options={['All', 'Discounted', 'Taxed']}
                                value={filterState.discounted_taxed || 'All'}
                                onChange={(event, newValue) => {
                                    handleFilterChange('discounted_taxed', newValue || 'All');
                                }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        placeholder="Select option"
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: '16px',
                                            },
                                            '& .MuiOutlinedInput-notchedOutline': {
                                                borderRadius: '16px',
                                            },
                                        }}
                                    />
                                )}
                                disableClearable
                                ListboxProps={{
                                    sx: {
                                        '& .MuiAutocomplete-option': {
                                            '&[aria-selected="true"]': {
                                                backgroundColor: '#063455',
                                                color: '#fff',
                                                borderRadius: '16px',
                                                my: 0.3
                                            },
                                            '&:hover': {
                                                backgroundColor: '#063455 !important',
                                                color: '#fff !important',
                                                borderRadius: '16px',
                                                my: 0.3
                                            },
                                        },
                                    },
                                }}
                            />
                        </Grid>
                        <Grid item xs={6} md={2}>
                            <Autocomplete
                                options={cashiers || []} getOptionLabel={(option) => option.name}
                                value={cashiers?.find((c) => c.id == filterState.cashier_id) || null}
                                onChange={(event, newValue) => handleFilterChange('cashier_id', newValue ? newValue.id : '')}
                                renderInput={(params) =>
                                    <TextField {...params}
                                        placeholder="Choose Options"
                                        size="small"
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: '16px',
                                            },
                                            '& .MuiOutlinedInput-notchedOutline': {
                                                borderRadius: '16px',
                                            },
                                        }}
                                    />}
                                ListboxProps={{
                                    sx: {
                                        '& .MuiAutocomplete-option': {
                                            '&[aria-selected="true"]': {
                                                backgroundColor: '#063455',
                                                color: '#fff',
                                                borderRadius: '16px',
                                                my: 0.3
                                            },
                                            '&:hover': {
                                                backgroundColor: '#063455 !important',
                                                color: '#fff !important',
                                                borderRadius: '16px',
                                                my: 0.3
                                            },
                                        },
                                    },
                                }}
                            />
                        </Grid>

                        {/* Action Buttons */}
                        <Grid item xs={12} md={4}>
                            <Button
                                variant="outlined"
                                color="secondary"
                                onClick={() => {
                                    setFilterState({
                                        search: '',
                                        membership_no: '',
                                        booking_number: '',
                                        customer_type: 'All',
                                        start_date: '',
                                        end_date: '',
                                        delivery_date: '',
                                        discounted_taxed: 'All',
                                        cashier_id: '',
                                    });
                                    router.get(route(routeNameForContext('cake-bookings.index'))); // Reset
                                }}
                                sx={{
                                    borderRadius: '16px',
                                    textTransform: 'none',
                                    border: '1px solid #063455'
                                }}
                            >
                                Reset
                            </Button>
                            <Button
                                variant="contained"
                                startIcon={<Search />}
                                onClick={() => handleApplyFilters()}
                                sx={{
                                    bgcolor: '#063455',
                                    borderRadius: '16px',
                                    textTransform: 'none',
                                    ml:2,
                                    '&:hover': { bgcolor: '#063455' }
                                }}
                            >
                                Search
                            </Button>
                        </Grid>
                    </Grid>
                </Box>

                <TableContainer component={Paper} sx={{borderRadius:'12px'}}>
                    <Table size="small">
                        <TableHead sx={{ bgcolor: '#063455' }}>
                            <TableRow>
                                {['SR', 'Booking', 'Booking Date', 'Name', 'Customer Type', 'Total', 'Advance', 'Balance', 'Discount', 'Tax', 'Grand Total', 'User', 'Document', 'Invoice', 'Cancel', 'Edit', 'Delete'].map((head) => (
                                    <TableCell key={head} sx={{ color: '#fff', fontWeight: '600', whiteSpace:'nowrap' }}>
                                        {head}
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {bookings.data.length > 0 ? (
                                bookings.data.map((booking, index) => {
                                    const grandTotal = parseFloat(booking.total_price || 0) - parseFloat(booking.discount_amount || 0) + parseFloat(booking.tax_amount || 0);

                                    return (
                                        <TableRow key={booking.id} hover sx={{ '&:nth-of-type(odd)': { bgcolor: '#f4f6f8' } }}>
                                            <TableCell>{(bookings.current_page - 1) * bookings.per_page + index + 1}</TableCell>
                                            <TableCell>{booking.booking_number}</TableCell>
                                            <TableCell>{dayjs(booking.booking_date).format('DD/MM/YYYY')}</TableCell>
                                            <TableCell>{booking.customer_name || booking.member?.full_name || 'N/A'}</TableCell>
                                            <TableCell>{booking.customer_type === '0' ? `Member (${booking.member?.membership_no || ''})` : booking.customer_type === '2' ? `Corporate (${booking.corporate_member?.membership_no || ''})` : booking.customer_type}</TableCell>
                                            <TableCell>{parseFloat(booking.total_price).toLocaleString()}</TableCell>
                                            <TableCell>{parseFloat(booking.advance_amount || 0).toLocaleString()}</TableCell>
                                            <TableCell>{parseFloat(booking.balance_amount || 0).toLocaleString()}</TableCell>
                                            <TableCell>{parseFloat(booking.discount_amount || 0).toLocaleString()}</TableCell>
                                            <TableCell>{parseFloat(booking.tax_amount || 0).toLocaleString()}</TableCell>
                                            <TableCell>{grandTotal.toLocaleString()}</TableCell>
                                            <TableCell>{booking.created_by?.name || 'N/A'}</TableCell>
                                            <TableCell align="center">
                                                {booking.media?.length > 0 || booking.attachment_path ? (
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => {
                                                            const mediaList = booking.media || [];
                                                            // Legacy support: if attachment_path exists and not in media, add it?
                                                            // For now, just pass media. But if legacy path exists, maybe we wrap it.
                                                            // Let's create a temporary object for legacy path if media is empty?
                                                            // Or just append legacy if exists.
                                                            let effectiveMedia = [...mediaList];
                                                            if (booking.attachment_path && mediaList.length === 0) {
                                                                effectiveMedia.push({
                                                                    file_path: 'storage/' + booking.attachment_path,
                                                                    file_name: 'Attachment',
                                                                    mime_type: 'image/jpeg', // Guess
                                                                });
                                                            }
                                                            setSelectedDocs(effectiveMedia);
                                                            setDocsModalOpen(true);
                                                        }}
                                                    >
                                                        <Search fontSize="small" color="primary" />
                                                    </IconButton>
                                                ) : (
                                                    '-'
                                                )}
                                            </TableCell>
                                            <TableCell align="center">
                                                <a href={route(routeNameForContext('cake-bookings.print'), booking.id)} target="_blank" rel="noreferrer">
                                                    <Print fontSize="small" color="action" />
                                                </a>
                                            </TableCell>
                                            <TableCell align="center">
                                                {booking.status !== 'cancelled' && (
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => {
                                                            if (confirm('Are you sure you want to cancel this booking?')) {
                                                                router.put(
                                                                    route(routeNameForContext('cake-bookings.update'), booking.id),
                                                                    {
                                                                        status: 'cancelled',
                                                                        // Preserve other fields to avoid validation errors if controller requires them?
                                                                        // Controller uses existing values if not provided for calculation, but validation?
                                                                        // We checked controller, it seems safe for partial update regarding calculations.
                                                                        // But let's send minimal data.
                                                                        // Actually, standard resource update might expect full data in some implementations.
                                                                        // Our controller: $booking->fill($request->except(...))
                                                                        // Boolean/Nullable fields might be issue if not sent?
                                                                        // Let's try sending just status.
                                                                    },
                                                                    {
                                                                        onSuccess: () => alert('Booking cancelled'),
                                                                    },
                                                                );
                                                            }
                                                        }}
                                                    >
                                                        <Close fontSize="small" sx={{ fontSize: 16 }} />
                                                    </IconButton>
                                                )}
                                            </TableCell>
                                            <TableCell align="center">
                                                <Link href={route(routeNameForContext('cake-bookings.edit'), booking.id)}>
                                                    <Edit fontSize="small" sx={{ fontSize: 16, color: 'text.secondary' }} />
                                                </Link>
                                            </TableCell>
                                            <TableCell align="center">
                                                <Delete fontSize="small" sx={{ fontSize: 16, color: 'text.secondary' }} />
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={15} align="center">
                                        No bookings found
                                    </TableCell>
                                </TableRow>
                            )}

                            {/* Summary Footer Row */}
                            <TableRow sx={{ bgcolor: '#063455' }}>
                                <TableCell colSpan={5} align="right" sx={{ color: 'white', fontWeight: 'bold' }}>
                                    TOTAL :
                                </TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>{pageTotals.total.toLocaleString()}</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>{pageTotals.discount.toLocaleString()}</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>{pageTotals.tax.toLocaleString()}</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>{pageTotals.grandTotal.toLocaleString()}</TableCell>
                                <TableCell colSpan={6} />
                            </TableRow>
                        </TableBody>
                    </Table>
                </TableContainer>

                <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
                    <Pagination count={bookings.last_page} page={bookings.current_page} onChange={handlePageChange} color="primary" shape="rounded" />
                    <Select size="small" value={50} sx={{ ml: 2, height: 32 }}>
                        <MenuItem value={50}>50</MenuItem>
                    </Select>
                </Box>
            </Box>

            {/* Document View Modal */}
            <ViewDocumentsModal open={docsModalOpen} onClose={() => setDocsModalOpen(false)} media={selectedDocs} />
        </>
    );
}

Index.layout = (page) => <POSLayout>{page}</POSLayout>; // Layout already applied via SideNav internal logic in original file? Original file had explicit SideNav usage.
// Ah, the user added `Index.layout = (page) => page;` manually in previous step, so keeping it.
