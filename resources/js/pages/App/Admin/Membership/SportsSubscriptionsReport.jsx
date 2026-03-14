import { useState, useMemo, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { router, usePage } from '@inertiajs/react';
import { TextField, Chip, Box, Paper, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Button, InputAdornment, Grid, FormControl, InputLabel, Select, MenuItem, Pagination, Autocomplete, Radio, RadioGroup, FormControlLabel } from '@mui/material';
import { Search, Print, ArrowBack } from '@mui/icons-material';
import axios from 'axios';
import debounce from 'lodash.debounce';
import dayjs from "dayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

const SportsSubscriptionsReport = () => {
    // Get props first
    const { transactions, statistics, filters, all_cities, all_payment_methods, all_categories, all_genders, all_family_members, subscription_categories, guest_types, all_cashiers } = usePage().props;

    // Suggestions State (dynamic API)
    const [suggestions, setSuggestions] = useState([]);
    const [membershipSuggestions, setMembershipSuggestions] = useState([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);

    // Modal state
    // const [open, setOpen] = useState(true);
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
        family_member: filters?.family_member || '',
        customer_type: filters?.customer_type || 'all',
        subscription_category_id: filters?.subscription_category_id || '',
        cashier: filters?.cashier ? Number(filters.cashier) : '',
    });

    // Fetch Suggestions - debounced API call
    const fetchSuggestions = useMemo(
        () =>
            debounce(async (query, type) => {
                if (!query) {
                    setSuggestions([]);
                    return;
                }
                setLoadingSuggestions(true);
                try {
                    const response = await axios.get(route('api.bookings.search-customers'), {
                        params: { query, type },
                    });
                    setSuggestions(response.data);
                } catch (error) {
                    console.error('Error fetching suggestions:', error);
                } finally {
                    setLoadingSuggestions(false);
                }
            }, 300),
        [],
    );

    // Fetch Membership Suggestions
    const fetchMembershipSuggestions = useMemo(
        () =>
            debounce(async (query, type) => {
                if (!query) {
                    setMembershipSuggestions([]);
                    return;
                }
                try {
                    const response = await axios.get(route('api.bookings.search-customers'), {
                        params: { query, type },
                    });
                    setMembershipSuggestions(response.data);
                } catch (error) {
                    console.error('Error fetching membership suggestions:', error);
                }
            }, 300),
        [],
    );

    useEffect(() => {
        if (allFilters.membership_no_search) {
            const type = allFilters.customer_type && allFilters.customer_type !== 'all' ? allFilters.customer_type : 'all';
            fetchMembershipSuggestions(allFilters.membership_no_search, type);
        } else {
            setMembershipSuggestions([]);
        }
    }, [allFilters.membership_no_search, allFilters.customer_type]);

    useEffect(() => {
        if (allFilters.member_search) {
            fetchSuggestions(allFilters.member_search, allFilters.customer_type);
        } else {
            setSuggestions([]);
        }
    }, [allFilters.member_search, allFilters.customer_type]);

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
        router.get(route('membership.sports-subscriptions-report'), allFilters, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handlePageChange = (event, page) => {
        router.get(
            route('membership.sports-subscriptions-report'),
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
            family_member: '',
            customer_type: 'all',
            subscription_category_id: '',
            cashier: '',
        });
        router.get(route('membership.sports-subscriptions-report'));
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
            case 'bank_online':
            case 'online':
                return '#8b5cf6'; // Purple
            case 'cheque':
                return '#f59e0b'; // Orange
            default:
                return '#6b7280';
        }
    };

    const getPaymentMethodLabel = (method) => {
        const normalized = (method || '').toString().trim().toLowerCase();
        if (!normalized) return 'N/A';

        if (normalized === 'cash') return 'Cash';
        if (['credit_card', 'credit card', 'debit_card', 'debit card'].includes(normalized)) return 'Credit Card';
        if (['bank_online', 'online', 'bank transfer'].includes(normalized)) return 'Online';
        if (normalized === 'cheque') return 'Cheque';

        return method;
    };

    const getFamilyMemberColor = (relation) => {
        switch (relation) {
            case 'SELF':
                return '#059669'; // Green
            case 'Son':
            case 'Daughter':
                return '#0ea5e9'; // Blue
            case 'Wife':
            case 'Husband':
                return '#8b5cf6'; // Purple
            case 'Father':
            case 'Mother':
                return '#f59e0b'; // Orange
            default:
                return '#6b7280'; // Gray
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

        if (allFilters.family_member) {
            params.append('family_member', allFilters.family_member);
        }

        if (allFilters.customer_type && allFilters.customer_type !== 'all') {
            params.append('customer_type', allFilters.customer_type);
        }

        if (allFilters.subscription_category_id) {
            params.append('subscription_category_id', allFilters.subscription_category_id);
        }

        if (allFilters.cashier) {
            params.append('cashier', allFilters.cashier);
        }

        if (allFilters.categories && allFilters.categories.length > 0) {
            allFilters.categories.forEach((cat) => params.append('categories[]', cat));
        }

        // Add current page number
        if (transactions?.current_page) {
            params.append('page', transactions.current_page);
        }

        // Open print page in new window
        const printUrl = route('membership.sports-subscriptions-report.print') + (params.toString() ? '?' + params.toString() : '');
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
                        <Typography sx={{ fontWeight: 600, fontSize: '24px', color: '#063455' }}>Sports Subscriptions Report</Typography>
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
                    <Typography sx={{ fontWeight: 600, fontSize: '18px', color: '#063455', mb: 3 }}>Search & Filter Options</Typography>

                    {/* Search Fields - Row 1 */}
                    <Grid container spacing={2} sx={{ mb: 2 }}>
                        {/* Booking Type - FIRST */}
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
                                    value={allFilters.customer_type}
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
                                    <MenuItem value="all">All</MenuItem>
                                    <MenuItem value="member">Member</MenuItem>
                                    <MenuItem value="corporate">Corporate</MenuItem>
                                    <MenuItem value="guest">All Guests</MenuItem>
                                    {guest_types?.map((t) => (
                                        <MenuItem key={t.id} value={`guest-${t.id}`}>
                                            {t.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        {/* Search by Name with Autocomplete */}
                        <Grid item xs={12} md={3}>
                            <Autocomplete
                                freeSolo
                                disablePortal
                                options={suggestions}
                                getOptionLabel={(option) =>
                                    typeof option === 'string'
                                        ? option
                                        : option?.name || option?.full_name || option?.value || option?.label || ''
                                }
                                inputValue={allFilters.member_search || ''}
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
                                }}
                                renderInput={(params) => <TextField {...params} fullWidth size="small" label="Search Name" placeholder="Guest Name..." sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }} />}
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
                                options={membershipSuggestions}
                                getOptionLabel={(option) =>
                                    typeof option === 'string'
                                        ? option
                                        : option?.membership_no || option?.customer_no || option?.label || ''
                                }
                                inputValue={allFilters.membership_no_search || ''}
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

                        <Grid item xs={12} md={2}>
                            <TextField
                                fullWidth
                                size="small"
                                label="Invoice #"
                                placeholder="Invoice No..."
                                value={allFilters.invoice_search || ''}
                                onChange={(e) => handleFilterChange('invoice_search', e.target.value)}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: '16px',
                                    },
                                }}
                            />
                        </Grid>

                        <Grid item xs={12} md={2}>
                            {/* <TextField
                                fullWidth
                                size="small"
                                type="date"
                                label="Begin Date"
                                value={allFilters.date_from}
                                onChange={(e) => handleFilterChange('date_from', e.target.value)}
                                InputLabelProps={{
                                    shrink: true,
                                }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: '16px',
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
                        <Grid item xs={12} md={2}>

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

                        <Grid item xs={12} md={2}>
                            {/* <FormControl fullWidth size="small">
                                    <InputLabel>All Genders</InputLabel>
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
                                options={all_genders || []}
                                value={allFilters.gender || ''}
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
                                        placeholder="Select gender"
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }}
                                    />} freeSolo />
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Autocomplete
                                fullWidth
                                size="small"
                                options={subscription_categories || []}
                                value={subscription_categories?.find((cat) => cat.id === allFilters.subscription_category_id) || null}
                                onChange={(e, value) => handleFilterChange('subscription_category_id', value?.id || '')}
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
                                        label="Subscription Category"
                                        placeholder="e.g. Gym, Swimming"
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }}
                                    />} />
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Autocomplete
                                multiple
                                fullWidth
                                size="small"
                                options={all_categories || []}
                                value={(all_categories || []).filter((c) => (allFilters.categories || []).includes(c.id))}
                                onChange={(e, value) => handleFilterChange('categories', value.map((v) => v.id))}
                                ListboxProps={{
                                    sx: {
                                        maxHeight: 300,
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
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Category"
                                        placeholder="Select category"
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }}
                                    />
                                )}
                            />
                        </Grid>
                        <Grid item xs={12} md={3}>
                            {/* <FormControl fullWidth size="small">
                                <InputLabel>Details</InputLabel>
                                <Select
                                    value={allFilters.family_member}
                                    onChange={(e) => handleFilterChange('family_member', e.target.value)}
                                >
                                    <MenuItem value="">All</MenuItem>
                                    {all_family_members && all_family_members.map((member) => (
                                        <MenuItem key={member} value={member}>
                                            {member}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl> */}
                            <Autocomplete
                                fullWidth
                                size="small"
                                options={all_family_members || []}
                                value={allFilters.family_member || ''}
                                onChange={(e, value) => handleFilterChange('family_member', value)}
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
                                        label="Details"
                                        placeholder="Select or type member"
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }}
                                    />} freeSolo />
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <Autocomplete
                                fullWidth size="small"
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
                                getOptionLabel={(option) => option.name || ''} isOptionEqualToValue={(option, value) => option.id === value?.id}
                                renderInput={(params) =>
                                    <TextField {...params}
                                        label="Cashier"
                                        placeholder="Select cashier"
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }}
                                    />} />
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <Autocomplete
                                fullWidth
                                size="small"
                                options={all_payment_methods || []} value={allFilters.payment_method || ''}
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
                                        label="Payment Method"
                                        placeholder="Select method"
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }}
                                    />} freeSolo />
                        </Grid>
                    </Grid>

                    {/* Filter Fields Row 2 */}
                    <Grid container spacing={2} sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
                        <Grid item xs={12} md={1.5}>
                            <Button
                                fullWidth
                                variant="contained"
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
                        </Grid>
                        <Grid item xs={12} md={1.5}>
                            <Button
                                fullWidth
                                variant="outlined"
                                onClick={handleReset}
                                sx={{
                                    borderColor: '#063455',
                                    color: '#063455',
                                    height: '40px',
                                    borderRadius: '16px',
                                    textTransform: 'none',
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

                {/* Sports Subscriptions Table */}
                <Box sx={{ mb: 3 }}>
                    <Typography sx={{ fontWeight: 600, fontSize: '20px', color: '#063455', mb: 2 }}>Sports Subscriptions List</Typography>
                    <TableContainer sx={{ borderRadius: '16px', overflowX: 'auto' }}>
                        <Table>
                            <TableHead>
                                <TableRow style={{ backgroundColor: '#063455' }}>
                                    <TableCell sx={{ color: 'white', fontSize: '14px', fontWeight: 600, }}>Invoice</TableCell>
                                    <TableCell sx={{ color: 'white', fontSize: '14px', fontWeight: 600, whiteSpace:'nowrap' }}>Subscriber Name</TableCell>
                                    <TableCell sx={{ color: 'white', fontSize: '14px', fontWeight: 600, whiteSpace:'nowrap' }}>Member Name</TableCell>
                                    <TableCell sx={{ color: 'white', fontSize: '14px', fontWeight: 600, }}>Membership</TableCell>
                                    <TableCell sx={{ color: 'white', fontSize: '14px', fontWeight: 600, }}>Type</TableCell>
                                    <TableCell sx={{ color: 'white', fontSize: '14px', fontWeight: 600, whiteSpace:'nowrap' }}>Family Member</TableCell>
                                    <TableCell sx={{ color: 'white', fontSize: '14px', fontWeight: 600, whiteSpace:'nowrap' }}>Start Date</TableCell>
                                    <TableCell sx={{ color: 'white', fontSize: '14px', fontWeight: 600, whiteSpace:'nowrap' }}>End Date</TableCell>
                                    <TableCell sx={{ color: 'white', fontSize: '14px', fontWeight: 600, }}>Amount</TableCell>
                                    <TableCell sx={{ color: 'white', fontSize: '14px', fontWeight: 600, whiteSpace:'nowrap' }}>Payment Method</TableCell>
                                    <TableCell sx={{ color: 'white', fontSize: '14px', fontWeight: 600, }}>Category</TableCell>
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
                                            <TableCell sx={{ color: '#374151', fontWeight: 600, fontSize: '14px' }}>{transaction.invoice?.member?.full_name || transaction.invoice?.corporateMember?.full_name || transaction.invoice?.customer?.name || 'N/A'}</TableCell>
                                            <TableCell sx={{ color: '#374151', fontWeight: 500, fontSize: '14px' }}>{transaction.invoice?.member?.full_name || transaction.invoice?.corporateMember?.full_name || transaction.invoice?.customer?.name || 'N/A'}</TableCell>
                                            <TableCell sx={{ color: '#374151', fontWeight: 500, fontSize: '14px' }}>{transaction.invoice?.member?.membership_no || transaction.invoice?.corporateMember?.membership_no || transaction.invoice?.customer?.customer_no || 'N/A'}</TableCell>
                                            <TableCell sx={{ color: '#6B7280', fontWeight: 400, fontSize: '14px' }}>{transaction.subscription_category?.name || transaction.data?.subscription_category_name || transaction.subscription_type?.name || transaction.data?.subscription_type_name || 'N/A'}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={transaction.invoice?.customer_id ? 'Guest' : transaction.data?.family_member_relation || 'SELF'}
                                                    size="small"
                                                    sx={{
                                                        backgroundColor: transaction.invoice?.customer_id ? '#f0f9ff' : `${getFamilyMemberColor(transaction.data?.family_member_relation)}20`,
                                                        color: transaction.invoice?.customer_id ? '#0284c7' : getFamilyMemberColor(transaction.data?.family_member_relation),
                                                        fontWeight: 600,
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ color: '#6B7280', fontWeight: 400, fontSize: '14px' }}>{formatDate(transaction.start_date)}</TableCell>
                                            <TableCell sx={{ color: '#6B7280', fontWeight: 400, fontSize: '14px' }}>{formatDate(transaction.end_date)}</TableCell>
                                            <TableCell sx={{ color: '#059669', fontWeight: 600, fontSize: '14px' }}>{formatCurrency(transaction.total).replace('PKR', 'Rs.')}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={getPaymentMethodLabel(transaction.invoice?.payment_method || transaction.payment_method)}
                                                    size="small"
                                                    sx={{
                                                        backgroundColor: `${getPaymentMethodColor(transaction.invoice?.payment_method || transaction.payment_method)}20`,
                                                        color: getPaymentMethodColor(transaction.invoice?.payment_method || transaction.payment_method),
                                                        fontWeight: 600,
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ color: '#6B7280', fontWeight: 400, fontSize: '14px' }}>
                                                {transaction.invoice?.member?.member_category?.name ||
                                                    transaction.invoice?.member?.memberCategory?.name ||
                                                    transaction.invoice?.corporateMember?.member_category?.name ||
                                                    transaction.invoice?.corporateMember?.memberCategory?.name ||
                                                    transaction.invoice?.corporate_member?.member_category?.name ||
                                                    transaction.invoice?.corporate_member?.memberCategory?.name ||
                                                    ''}
                                            </TableCell>
                                            <TableCell sx={{ color: '#6B7280', fontWeight: 400, fontSize: '14px' }}>{transaction.invoice?.created_by?.name || 'System'}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={12} align="center" sx={{ py: 4 }}>
                                            <Typography color="textSecondary">No sports subscription records found</Typography>
                                        </TableCell>
                                    </TableRow>
                                )}

                                {/* Footer Row */}
                                {transactions?.data && transactions.data.length > 0 && (
                                    <TableRow sx={{ backgroundColor: '#063455', borderTop: '2px solid #374151' }}>
                                        <TableCell sx={{ fontWeight: 700, color: 'white', fontSize: '16px' }} colSpan={8}>
                                            TOTAL ({statistics?.total_transactions || 0} Subscriptions)
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: 'white', fontSize: '16px' }}>{formatCurrency(statistics?.total_amount || 0).replace('PKR', 'Rs.')}</TableCell>
                                        <TableCell colSpan={3} sx={{ fontWeight: 700, color: 'white', fontSize: '14px' }}>
                                            Sports Subscriptions Collection Report
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

export default SportsSubscriptionsReport;
