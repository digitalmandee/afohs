import { useState, useMemo } from 'react';
import axios from 'axios';
import debounce from 'lodash.debounce';
import 'bootstrap/dist/css/bootstrap.min.css';
import { router, usePage } from '@inertiajs/react';
import { TextField, Chip, IconButton, Autocomplete, Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Button, InputAdornment, Grid, FormControl, InputLabel, Select, MenuItem, Pagination } from '@mui/material';
import { Search, Print, ArrowBack } from '@mui/icons-material';
import dayjs from "dayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

const MonthlyMaintenanceFeeReport = () => {
    // Get props first
    const { transactions, statistics, filters, all_cities, all_payment_methods, all_categories, all_genders, all_cashiers } = usePage().props;

    // Filter state
    const [allFilters, setAllFilters] = useState({
        member_search: filters?.member_search || '',
        membership_no_search: filters?.membership_no_search || '',
        invoice_search: filters?.invoice_search || '',
        date_from: filters?.date_from || '',
        date_to: filters?.date_to || '',
        city: filters?.city || '',
        payment_method: filters?.payment_method || '',
        categories: (filters?.categories || []).map((v) => Number(v)),
        gender: filters?.gender || '',
        cashier: filters?.cashier ? Number(filters.cashier) : '',
    });

    const [nameSuggestions, setNameSuggestions] = useState([]);
    const [membershipNoSuggestions, setMembershipNoSuggestions] = useState([]);

    const fetchNameSuggestions = useMemo(
        () =>
            debounce(async (query) => {
                if (!query) {
                    setNameSuggestions([]);
                    return;
                }
                try {
                    const response = await axios.get(route('api.bookings.search-customers'), {
                        params: { query, type: 'member' },
                    });
                    setNameSuggestions(response.data);
                } catch (error) {
                    console.error('Error fetching name suggestions:', error);
                }
            }, 300),
        [],
    );

    const fetchMembershipNoSuggestions = useMemo(
        () =>
            debounce(async (query) => {
                if (!query) {
                    setMembershipNoSuggestions([]);
                    return;
                }
                try {
                    const response = await axios.get(route('api.bookings.search-customers'), {
                        params: { query, type: 'member' },
                    });
                    setMembershipNoSuggestions(response.data);
                } catch (error) {
                    console.error('Error fetching membership number suggestions:', error);
                }
            }, 300),
        [],
    );

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-PK', {
            style: 'currency',
            currency: 'PKR',
            minimumFractionDigits: 0,
        }).format(amount || 0);
    };

    const formatDate = (date) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('en-GB');
    };

    const handleSearch = () => {
        router.get(route('membership.monthly-maintenance-fee-report'), allFilters, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handlePageChange = (event, page) => {
        router.get(
            route('membership.monthly-maintenance-fee-report'),
            {
                ...allFilters,
                page: page,
            },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const handleFilterChange = (field, value) => {
        setAllFilters((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleReset = () => {
        setAllFilters({
            member_search: '',
            membership_no_search: '',
            invoice_search: '',
            date_from: '',
            date_to: '',
            city: '',
            payment_method: '',
            categories: [],
            gender: '',
            cashier: '',
        });
        router.get(route('membership.monthly-maintenance-fee-report'));
    };

    const getPaymentMethodColor = (method) => {
        switch (method?.toLowerCase()) {
            case 'cash':
                return '#059669'; // Green
            case 'credit_card':
            case 'credit card':
            case 'debit_card':
            case 'debit card':
                return '#0ea5e9'; // Blue
            case 'bank transfer':
            case 'online':
                return '#8b5cf6'; // Purple
            case 'cheque':
                return '#f59e0b'; // Orange
            default:
                return '#6b7280';
        }
    };

    const handlePrint = () => {
        // Build query string with current filters and page
        const params = new URLSearchParams();

        if (allFilters.member_search) {
            params.append('member_search', allFilters.member_search);
        }

        if (allFilters.membership_no_search) {
            params.append('membership_no_search', allFilters.membership_no_search);
        }

        if (allFilters.invoice_search) {
            params.append('invoice_search', allFilters.invoice_search);
        }

        if (allFilters.date_from) {
            params.append('date_from', allFilters.date_from);
        }

        if (allFilters.date_to) {
            params.append('date_to', allFilters.date_to);
        }

        if (allFilters.city) {
            params.append('city', allFilters.city);
        }

        if (allFilters.payment_method) {
            params.append('payment_method', allFilters.payment_method);
        }

        if (allFilters.gender) {
            params.append('gender', allFilters.gender);
        }

        if (allFilters.categories && allFilters.categories.length > 0) {
            allFilters.categories.forEach((cat) => params.append('categories[]', cat));
        }

        if (allFilters.cashier) {
            params.append('cashier', allFilters.cashier);
        }

        // Add current page number
        if (transactions?.current_page) {
            params.append('page', transactions.current_page);
        }

        // Open print page in new window
        const printUrl = route('membership.monthly-maintenance-fee-report.print') + (params.toString() ? '?' + params.toString() : '');
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
            <div className="container-fluid px-4 py-4" style={{ backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
                {/* Top Bar */}
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div className="d-flex align-items-center">
                        <IconButton onClick={() => window.history.back()}>
                            <ArrowBack sx={{ color: '#063455' }} />
                        </IconButton>
                        <Typography sx={{ fontWeight: 600, fontSize: '24px', color: '#063455' }}>Monthly Maintenance Fee Report</Typography>
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
                <Box sx={{ mb: 3, pt: 2, }}>
                    <Typography sx={{ fontWeight: 600, fontSize: '18px', color: '#063455', mb: 3 }}>Search & Filter Options</Typography>

                    {/* Search Fields */}
                    <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid item xs={12} md={3}>
                            <Autocomplete
                                freeSolo
                                disablePortal
                                options={nameSuggestions}
                                getOptionLabel={(option) =>
                                    typeof option === 'string'
                                        ? option
                                        : option?.name || option?.full_name || option?.value || option?.label || ''
                                }
                                inputValue={allFilters.member_search}
                                onChange={(event, selectedOption) => {
                                    if (typeof selectedOption === 'string') {
                                        handleFilterChange('member_search', selectedOption);
                                        return;
                                    }
                                    if (selectedOption?.name || selectedOption?.full_name) {
                                        handleFilterChange('member_search', selectedOption.name || selectedOption.full_name);
                                    }
                                }}
                                onInputChange={(event, newInputValue) => {
                                    handleFilterChange('member_search', newInputValue);
                                    fetchNameSuggestions(newInputValue);
                                }}
                                renderInput={(params) =>
                                    <TextField {...params}
                                        fullWidth
                                        size="small"
                                        placeholder="Search by Name"
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }} />}
                                renderOption={(props, option) => (
                                    <li {...props} key={option.id || option.label}>
                                        <Box sx={{ width: '100%' }}>
                                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                                <Typography variant="body2" fontWeight="bold">
                                                    {option.name || option.full_name}
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
                                                {option.membership_no || option.customer_no}
                                            </Typography>
                                        </Box>
                                    </li>
                                )}
                            />
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Autocomplete
                                freeSolo
                                disablePortal
                                options={membershipNoSuggestions}
                                getOptionLabel={(option) =>
                                    typeof option === 'string'
                                        ? option
                                        : option?.membership_no || option?.customer_no || option?.label || ''
                                }
                                inputValue={allFilters.membership_no_search}
                                onChange={(event, selectedOption) => {
                                    if (typeof selectedOption === 'string') {
                                        handleFilterChange('membership_no_search', selectedOption);
                                        return;
                                    }
                                    if (selectedOption?.membership_no || selectedOption?.customer_no) {
                                        handleFilterChange('membership_no_search', selectedOption.membership_no || selectedOption.customer_no);
                                    }
                                }}
                                onInputChange={(event, newInputValue) => {
                                    handleFilterChange('membership_no_search', newInputValue);
                                    fetchMembershipNoSuggestions(newInputValue);
                                }}
                                renderInput={(params) =>
                                    <TextField
                                        {...params}
                                        fullWidth
                                        size="small"
                                        placeholder="Search by Membership #"
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }}
                                    />}
                                renderOption={(props, option) => (
                                    <li {...props} key={`membership-${option.membership_no || option.customer_no || option.label}`}>
                                        <Box sx={{ width: '100%' }}>
                                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                                <Typography variant="body2" fontWeight="bold">
                                                    {option.membership_no || option.customer_no}
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
                                                {option.name || option.full_name}
                                            </Typography>
                                        </Box>
                                    </li>
                                )}
                            />
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <TextField
                                fullWidth
                                size="small"
                                placeholder="Search by Invoice No"
                                value={allFilters.invoice_search}
                                onChange={(e) => handleFilterChange('invoice_search', e.target.value)}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: '16px',
                                    },
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} md={3}>
                            {/* <TextField
                                fullWidth
                                size="small"
                                type="date"
                                label="From (dd/mm/yyyy)"
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
                                label="To (dd/mm/yyyy)"
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
                                    <InputLabel>Search by City</InputLabel>
                                    <Select
                                        value={allFilters.city}
                                        onChange={(e) => handleFilterChange('city', e.target.value)}
                                    >
                                        <MenuItem value="">All Cities</MenuItem>
                                        {all_cities && all_cities.map((city) => (
                                            <MenuItem key={city} value={city}>
                                                {city}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl> */}
                            <Autocomplete
                                fullWidth
                                size="small"
                                options={all_cities || []} value={allFilters.city}
                                onChange={(e, value) => handleFilterChange('city', value)}
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
                                renderInput={(params) =>
                                    <TextField {...params}
                                        label="Search by City"
                                        placeholder="Enter city name"
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }}
                                    />}
                                freeSolo />
                        </Grid>
                        <Grid item xs={12} md={3}>
                            {/* <FormControl fullWidth size="small">
                                <InputLabel>Choose Payment Method</InputLabel>
                                <Select
                                    value={allFilters.payment_method}
                                    onChange={(e) => handleFilterChange('payment_method', e.target.value)}
                                >
                                    <MenuItem value="">All Methods</MenuItem>
                                    {all_payment_methods && all_payment_methods.map((method) => (
                                        <MenuItem key={method} value={method}>
                                            {method}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl> */}
                            <Autocomplete
                                fullWidth
                                size="small"
                                options={all_payment_methods || []}
                                value={allFilters.payment_method || ''}
                                onChange={(e, value) => handleFilterChange('payment_method', value)}
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
                                renderInput={(params) =>
                                    <TextField {...params}
                                        label="Choose Payment Method"
                                        placeholder="Select or type method"
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }}
                                    />} freeSolo />
                        </Grid>
                        <Grid item xs={12} md={3}>
                            {/* <FormControl fullWidth size="small">
                                <InputLabel>Choose Categories</InputLabel>
                                <Select
                                    multiple
                                    value={allFilters.categories}
                                    onChange={(e) => handleFilterChange('categories', e.target.value)}
                                    renderValue={(selected) => (
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                            {selected.map((value) => {
                                                const category = all_categories?.find(cat => cat.id === value);
                                                return <Chip key={value} label={category?.name || value} size="small" />;
                                            })}
                                        </Box>
                                    )}
                                >
                                    {all_categories && all_categories.map((category) => (
                                        <MenuItem key={category.id} value={category.id}>
                                            {category.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl> */}
                            <Autocomplete
                                fullWidth
                                size="small"
                                multiple
                                options={all_categories || []}
                                value={all_categories?.filter((cat) => allFilters.categories?.includes(cat.id)) || []}
                                onChange={(e, value) =>
                                    handleFilterChange(
                                        'categories',
                                        value.map((cat) => cat.id),
                                    )
                                }
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
                                getOptionLabel={(option) => option.name || ''}
                                renderTags={(value, getTagProps) => value.map((option, index) => <Chip key={option.id} label={option.name} size="small" {...getTagProps({ index })} />)}
                                renderInput={(params) =>
                                    <TextField {...params}
                                        label="Choose Categories"
                                        placeholder="Select or type category"
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }}
                                    />}
                                freeSolo
                            />
                        </Grid>
                        <Grid item xs={12} md={3}>
                            {/* <FormControl fullWidth size="small">
                                <InputLabel>Choose Gender</InputLabel>
                                <Select
                                    value={allFilters.gender}
                                    onChange={(e) => handleFilterChange('gender', e.target.value)}
                                >
                                    <MenuItem value="">All Genders</MenuItem>
                                    {all_genders && all_genders.map((gender) => (
                                        <MenuItem key={gender} value={gender}>
                                            {gender}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl> */}
                            <Autocomplete
                                fullWidth
                                size="small"
                                options={all_genders || []} value={allFilters.gender || ''}
                                onChange={(e, value) => handleFilterChange('gender', value)}
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
                                renderInput={(params) =>
                                    <TextField {...params}
                                        label="Choose Gender"
                                        placeholder="Select or type gender"
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }}
                                    />} freeSolo />
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Autocomplete
                                fullWidth
                                size="small"
                                options={all_cashiers || []}
                                value={all_cashiers?.find((c) => c.id === allFilters.cashier) || null}
                                onChange={(e, value) => handleFilterChange('cashier', value?.id || '')}
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
                                getOptionLabel={(option) => option.name || ''}
                                isOptionEqualToValue={(option, value) => option.id === value?.id}
                                renderInput={(params) =>
                                    <TextField {...params}
                                        label="Choose Cashier"
                                        placeholder="Select cashier"
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }}
                                    />} />
                        </Grid>
                        <Grid item xs={12} md={3} sx={{ display: 'flex', gap: 2 }}>
                            <Button
                                fullWidth
                                variant="contained"
                                startIcon={<Search />}
                                onClick={handleSearch}
                                sx={{
                                    backgroundColor: '#063455',
                                    height: '40px',
                                    textTransform: 'none',
                                    borderRadius: '16px',
                                    '&:hover': {
                                        backgroundColor: '#063455',
                                    },
                                }}
                            >
                                Search
                            </Button>

                            <Button
                                fullWidth
                                variant="outlined"
                                onClick={handleReset}
                                sx={{
                                    borderColor: '#063455',
                                    color: '#063455',
                                    height: '40px',
                                    textTransform: 'none',
                                    borderRadius: '16px',
                                    '&:hover': {
                                        // backgroundColor: '#fef2f2',
                                        borderColor: '#063455',
                                    },
                                }}
                            >
                                Reset
                            </Button>
                        </Grid>
                    </Grid>

                </Box>

                {/* Monthly Maintenance Fee Table */}
                <Box sx={{ mb: 3 }}>
                    <Typography sx={{ fontWeight: 600, fontSize: '20px', color: '#063455', mb: 2 }}>Monthly Maintenance Fee List</Typography>
                    <TableContainer sx={{ borderRadius: '16px' }}>
                        <Table>
                            <TableHead>
                                <TableRow style={{ backgroundColor: '#063455' }}>
                                    <TableCell sx={{ color: 'white', fontSize: '14px', fontWeight: 600, }}>Invoice</TableCell>
                                    <TableCell sx={{ color: 'white', fontSize: '14px', fontWeight: 600, }}>City</TableCell>
                                    <TableCell sx={{ color: 'white', fontSize: '14px', fontWeight: 600, whiteSpace:'nowrap' }}>Member Name</TableCell>
                                    <TableCell sx={{ color: 'white', fontSize: '14px', fontWeight: 600, }}>Membership</TableCell>
                                    <TableCell sx={{ color: 'white', fontSize: '14px', fontWeight: 600, whiteSpace:'nowrap' }}>Amount Received</TableCell>
                                    <TableCell sx={{ color: 'white', fontSize: '14px', fontWeight: 600, whiteSpace:'nowrap' }}>Payment Method</TableCell>
                                    <TableCell sx={{ color: 'white', fontSize: '14px', fontWeight: 600, }}>Category</TableCell>
                                    <TableCell sx={{ color: 'white', fontSize: '14px', fontWeight: 600, }}>Dated</TableCell>
                                    <TableCell sx={{ color: 'white', fontSize: '14px', fontWeight: 600, }}>Duration</TableCell>
                                    <TableCell sx={{ color: 'white', fontSize: '14px', fontWeight: 600, }}>User</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {transactions?.data && transactions.data.length > 0 ? (
                                    transactions.data.map((transaction, index) => (
                                        <TableRow
                                            key={transaction.id}
                                            sx={{
                                                '&:nth-of-type(odd)': { backgroundColor: '#f9fafb' },
                                                '&:hover': { backgroundColor: '#f3f4f6' },
                                                borderBottom: '1px solid #e5e7eb',
                                            }}
                                        >
                                            <TableCell sx={{ color: '#374151', fontWeight: 600, fontSize: '14px' }}>{transaction.invoice?.invoice_no}</TableCell>
                                            <TableCell sx={{ color: '#374151', fontWeight: 500, fontSize: '14px' }}>{transaction.invoice?.member?.current_city || 'N/A'}</TableCell>
                                            <TableCell sx={{ color: '#374151', fontWeight: 600, fontSize: '14px' }}>{transaction.invoice?.member?.full_name}</TableCell>
                                            <TableCell sx={{ color: '#374151', fontWeight: 500, fontSize: '14px' }}>{transaction.invoice?.member?.membership_no}</TableCell>
                                            <TableCell sx={{ color: '#059669', fontWeight: 600, fontSize: '14px' }}>{formatCurrency(transaction.total).replace('PKR', 'Rs.')}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={transaction.invoice?.payment_method || 'N/A'}
                                                    size="small"
                                                    sx={{
                                                        backgroundColor: `${getPaymentMethodColor(transaction.invoice?.payment_method)}20`,
                                                        color: getPaymentMethodColor(transaction.invoice?.payment_method),
                                                        fontWeight: 600,
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ color: '#6B7280', fontWeight: 400, fontSize: '14px' }}>{transaction.invoice?.member?.member_category?.name || 'N/A'}</TableCell>
                                            <TableCell sx={{ color: '#6B7280', fontWeight: 400, fontSize: '14px' }}>
                                                {formatDate(transaction.invoice?.issue_date || transaction.invoice?.created_at || transaction.created_at)}
                                            </TableCell>
                                            <TableCell sx={{ color: '#6B7280', fontWeight: 400, fontSize: '14px' }}>{transaction.start_date && transaction.end_date ? `${formatDate(transaction.start_date)} - ${formatDate(transaction.end_date)}` : 'N/A'}</TableCell>
                                            <TableCell sx={{ color: '#374151', fontWeight: 500, fontSize: '14px' }}>{transaction.invoice?.created_by?.name || 'System'}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                                            <Typography color="textSecondary">No maintenance fee records found</Typography>
                                        </TableCell>
                                    </TableRow>
                                )}

                                {/* Footer Row */}
                                {transactions?.data && transactions.data.length > 0 && (
                                    <TableRow sx={{ backgroundColor: '#063455', borderTop: '2px solid #374151' }}>
                                        <TableCell sx={{ fontWeight: 700, color: 'white', fontSize: '16px' }} colSpan={4}>
                                            TOTAL ({statistics?.total_transactions || 0} Transactions)
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: 'white', fontSize: '16px' }}>{formatCurrency(statistics?.total_amount || 0).replace('PKR', 'Rs.')}</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: 'white', fontSize: '14px' }}>Avg: {formatCurrency(statistics?.average_amount || 0).replace('PKR', 'Rs.')}</TableCell>
                                        <TableCell colSpan={4} sx={{ fontWeight: 700, color: 'white', fontSize: '14px' }}>
                                            Monthly Maintenance Fee Collection Report
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {/* Pagination */}
                    {transactions?.data && transactions.data.length > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                            <Pagination
                                count={transactions.last_page}
                                page={transactions.current_page}
                                onChange={handlePageChange}
                                color="primary"
                                size="large"
                                showFirstButton
                                showLastButton
                                sx={{
                                    '& .MuiPaginationItem-root': {
                                        fontSize: '16px',
                                    },
                                }}
                            />
                        </Box>
                    )}

                    {/* Pagination Info */}
                    {transactions?.data && transactions.data.length > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                            <Typography variant="body2" color="textSecondary">
                                Showing {transactions.from} to {transactions.to} of {transactions.total} results
                            </Typography>
                        </Box>
                    )}
                </Box>
            </div>
            {/* </div> */}
        </>
    );
};

export default MonthlyMaintenanceFeeReport;
