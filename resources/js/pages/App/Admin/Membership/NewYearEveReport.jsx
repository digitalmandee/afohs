import { useEffect, useMemo, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { router, usePage } from '@inertiajs/react';
import { TextField, Chip, Box, IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Button, InputAdornment, Grid, FormControl, InputLabel, Select, MenuItem, Pagination, Autocomplete, CircularProgress } from '@mui/material';
import { Search, Print, ArrowBack } from '@mui/icons-material';
import dayjs from "dayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import axios from 'axios';
import debounce from 'lodash/debounce';

const NewYearEveReport = () => {
    // Get props first
    const { filters, all_cities, all_payment_methods, all_categories, all_genders, all_cashiers } = usePage().props;

    // Modal state
    // const [open, setOpen] = useState(true);
    const [loading, setLoading] = useState(true);
    const [transactions, setTransactions] = useState(null);
    const [statistics, setStatistics] = useState(null);
    const [allFilters, setAllFilters] = useState({
        member_search: filters?.member_search || '',
        invoice_search: filters?.invoice_search || '',
        date_from: filters?.date_from || '',
        date_to: filters?.date_to || '',
        city: filters?.city || '',
        payment_method: filters?.payment_method || '',
        categories: (filters?.categories || []).map((v) => Number(v)),
        gender: filters?.gender || '',
        cashier: filters?.cashier ? Number(filters.cashier) : '',
    });

    const [memberSuggestions, setMemberSuggestions] = useState([]);

    useEffect(() => {
        setAllFilters({
            member_search: filters?.member_search || '',
            invoice_search: filters?.invoice_search || '',
            date_from: filters?.date_from || '',
            date_to: filters?.date_to || '',
            city: filters?.city || '',
            payment_method: filters?.payment_method || '',
            categories: (filters?.categories || []).map((v) => Number(v)),
            gender: filters?.gender || '',
            cashier: filters?.cashier ? Number(filters.cashier) : '',
        });
    }, [JSON.stringify(filters)]);

    const fetchMemberSuggestions = useMemo(
        () =>
            debounce(async (query) => {
                if (!query || query.length < 2) {
                    setMemberSuggestions([]);
                    return;
                }

                try {
                    const res = await axios.get(route('api.members.search'), {
                        params: { query, type: 'member' },
                    });
                    setMemberSuggestions(res.data?.members || []);
                } catch (e) {
                    setMemberSuggestions([]);
                }
            }, 300),
        []
    );

    useEffect(() => {
        fetchMemberSuggestions(allFilters.member_search);
        return () => fetchMemberSuggestions.cancel();
    }, [allFilters.member_search, fetchMemberSuggestions]);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        axios
            .get(route('membership.new-year-eve-report.data'), { params: filters })
            .then((res) => {
                if (cancelled) return;
                setTransactions(res.data?.transactions || null);
                setStatistics(res.data?.statistics || null);
            })
            .catch(() => {
                if (cancelled) return;
                setTransactions(null);
                setStatistics(null);
            })
            .finally(() => {
                if (cancelled) return;
                setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [JSON.stringify(filters)]);

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
        router.get(route('membership.new-year-eve-report'), allFilters, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handlePageChange = (event, page) => {
        router.get(
            route('membership.new-year-eve-report'),
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
            invoice_search: '',
            date_from: '',
            date_to: '',
            city: '',
            payment_method: '',
            categories: [],
            gender: '',
            cashier: '',
        });
        router.get(route('membership.new-year-eve-report'));
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
        const printUrl = route('membership.new-year-eve-report.print') + (params.toString() ? '?' + params.toString() : '');
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
                        <Typography sx={{ fontWeight: 600, fontSize: '24px', color: '#063455' }}>New Year Eve Report</Typography>
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

                    {/* Search Fields */}
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid item xs={12} md={2.4}>
                            <Autocomplete
                                freeSolo
                                fullWidth
                                size="small"
                                options={memberSuggestions}
                                value={allFilters.member_search}
                                getOptionLabel={(option) => {
                                    if (typeof option === 'string') return option;
                                    const name = option.full_name || '';
                                    const no = option.membership_no ? ` (${option.membership_no})` : '';
                                    return `${name}${no}`.trim();
                                }}
                                isOptionEqualToValue={(option, value) => option.id === value?.id}
                                onInputChange={(event, newInputValue) => {
                                    handleFilterChange('member_search', newInputValue);
                                }}
                                onChange={(event, newValue) => {
                                    if (typeof newValue === 'string') {
                                        handleFilterChange('member_search', newValue);
                                    } else if (newValue && typeof newValue === 'object') {
                                        handleFilterChange('member_search', newValue.full_name || '');
                                    } else {
                                        handleFilterChange('member_search', '');
                                    }
                                }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        placeholder="Search by Name"
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: '16px',
                                            },
                                        }}
                                    />
                                )}
                            />
                        </Grid>
                        <Grid item xs={12} md={2.4}>
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
                        <Grid item xs={12} md={2.4}>
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
                        <Grid item xs={12} md={2.4}>
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
                        <Grid item xs={12} md={2.4}>
                            <TextField
                                fullWidth
                                size="small"
                                label="Search by City"
                                placeholder="All Cities"
                                value={allFilters.city}
                                onChange={(e) => handleFilterChange('city', e.target.value)}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }}
                            />
                        </Grid>
                    </Grid>

                    {/* Filter Fields */}
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={2.4}>
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
                                size="small"
                                fullWidth
                                options={all_payment_methods || []}
                                value={allFilters.payment_method || null}
                                onChange={(event, newValue) => {
                                    handleFilterChange('payment_method', newValue || '');
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
                                isOptionEqualToValue={(option, value) => option === value}
                                renderInput={(params) =>
                                    <TextField {...params}
                                        label="Choose Payment Method"
                                        placeholder="All Methods"
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }}
                                    />}
                            />

                        </Grid>
                        <Grid item xs={12} md={2.4}>
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
                                multiple
                                size="small"
                                fullWidth
                                options={all_categories || []}
                                getOptionLabel={(option) => option.name}
                                isOptionEqualToValue={(option, value) => option.id === value.id}
                                value={all_categories?.filter((cat) => allFilters.categories.includes(cat.id)) || []}
                                onChange={(event, newValue) => {
                                    handleFilterChange(
                                        'categories',
                                        newValue.map((cat) => cat.id),
                                    );
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
                                renderTags={(value, getTagProps) => value.map((option, index) => <Chip key={option.id} label={option.name} size="small" {...getTagProps({ index })} />)}
                                renderInput={(params) =>
                                    <TextField {...params}
                                        label="Choose Categories"
                                        placeholder="Select categories"
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }}
                                    />}
                            />
                        </Grid>
                        <Grid item xs={12} md={2.4}>
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
                                renderInput={(params) => <TextField {...params} label="Choose Gender" placeholder="Select gender" sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }} />} freeSolo />
                        </Grid>

                        <Grid item xs={12} md={2.4}>
                            <Autocomplete
                                fullWidth
                                size="small"
                                options={all_cashiers || []} getOptionLabel={(option) => option.name || ''}
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
                                isOptionEqualToValue={(option, value) => option.id === value?.id} renderInput={(params) => <TextField {...params} label="Cashier" placeholder="Select cashier" sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }} />} />
                        </Grid>
                        <Grid item xs={12} md={2.4} sx={{display:'flex', justifyContent:'space-between'}}>
                            <Button
                                small
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
                            <Button
                                small
                                variant="contained"
                                startIcon={<Search/>}
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
                    </Grid>
                </Box>

                {/* New Year Eve Subscriptions Table */}
                <Box sx={{ mb: 3 }}>
                    <Typography sx={{ fontWeight: 600, fontSize: '20px', color: '#063455', mb: 2 }}>New Year Eve Subscriptions List</Typography>
                    {loading && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                            <CircularProgress />
                        </Box>
                    )}
                    <TableContainer sx={{ borderRadius: '16px', overflowX: 'auto' }}>
                        <Table>
                            <TableHead>
                                <TableRow style={{ backgroundColor: '#063455' }}>
                                    <TableCell sx={{ color: 'white', fontSize: '14px', fontWeight: 600, }}>Invoice</TableCell>
                                    <TableCell sx={{ color: 'white', fontSize: '14px', fontWeight: 600, }}>City</TableCell>
                                    <TableCell sx={{ color: 'white', fontSize: '14px', fontWeight: 600, whiteSpace:'nowrap' }}>Member Name</TableCell>
                                    <TableCell sx={{ color: 'white', fontSize: '14px', fontWeight: 600, whiteSpace:'nowrap' }}>Amount Received</TableCell>
                                    <TableCell sx={{ color: 'white', fontSize: '14px', fontWeight: 600, whiteSpace:'nowrap' }}>Payment Method</TableCell>
                                    <TableCell sx={{ color: 'white', fontSize: '14px', fontWeight: 600, }}>Category</TableCell>
                                    <TableCell sx={{ color: 'white', fontSize: '14px', fontWeight: 600, }}>Dated</TableCell>
                                    <TableCell sx={{ color: 'white', fontSize: '14px', fontWeight: 600, }}>Duration</TableCell>
                                    <TableCell sx={{ color: 'white', fontSize: '14px', fontWeight: 600, }}>Membership</TableCell>
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
                                            <TableCell sx={{ color: '#374151', fontWeight: 500, fontSize: '14px' }}>
                                                {transaction.invoice?.member?.current_city || transaction.invoice?.customer?.city || 'N/A'}
                                            </TableCell>
                                            <TableCell sx={{ color: '#374151', fontWeight: 600, fontSize: '14px' }}>
                                                {transaction.invoice?.member?.full_name || transaction.invoice?.customer?.name || transaction.invoice?.data?.member_name || 'Guest'}
                                            </TableCell>
                                            <TableCell sx={{ color: '#059669', fontWeight: 600, fontSize: '14px' }}>{formatCurrency(transaction.total).replace('PKR', 'Rs.')}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={transaction.invoice?.payment_method}
                                                    size="small"
                                                    sx={{
                                                        backgroundColor: `${getPaymentMethodColor(transaction.invoice?.payment_method)}20`,
                                                        color: getPaymentMethodColor(transaction.invoice?.payment_method),
                                                        fontWeight: 600,
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ color: '#6B7280', fontWeight: 400, fontSize: '14px' }}>
                                                {transaction.invoice?.member?.member_category?.name || transaction.invoice?.customer?.guest_type?.name || transaction.invoice?.customer?.guestType?.name || 'N/A'}
                                            </TableCell>
                                            <TableCell sx={{ color: '#6B7280', fontWeight: 400, fontSize: '14px' }}>
                                                {formatDate(transaction.invoice?.issue_date || transaction.invoice?.created_at || transaction.created_at)}
                                            </TableCell>
                                            <TableCell sx={{ color: '#6B7280', fontWeight: 400, fontSize: '14px' }}>{transaction.start_date && transaction.end_date ? `${formatDate(transaction.start_date)} - ${formatDate(transaction.end_date)}` : 'N/A'}</TableCell>
                                            <TableCell sx={{ color: '#374151', fontWeight: 500, fontSize: '14px' }}>
                                                {transaction.invoice?.member?.membership_no || transaction.invoice?.customer?.customer_no || transaction.invoice?.customer?.id || transaction.invoice?.customer_id || '-'}
                                            </TableCell>
                                            <TableCell sx={{ color: '#6B7280', fontWeight: 400, fontSize: '14px' }}>
                                                {transaction.invoice?.created_by?.name || transaction.invoice?.createdBy?.name || 'N/A'}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                                            <Typography color="textSecondary">
                                                {loading ? 'Loading...' : 'No New Year Eve subscription records found'}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                )}

                                {/* Footer Row */}
                                {transactions?.data && transactions.data.length > 0 && (
                                    <TableRow sx={{ backgroundColor: '#063455', borderTop: '2px solid #374151' }}>
                                        <TableCell sx={{ fontWeight: 700, color: 'white', fontSize: '16px' }} colSpan={3}>
                                            TOTAL ({statistics?.total_transactions || 0} Transactions)
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: 'white', fontSize: '16px' }}>{formatCurrency(statistics?.total_amount || 0).replace('PKR', 'Rs.')}</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: 'white', fontSize: '14px' }}>Avg: {formatCurrency(statistics?.average_amount || 0).replace('PKR', 'Rs.')}</TableCell>
                                        <TableCell colSpan={5} sx={{ fontWeight: 700, color: 'white', fontSize: '14px' }}>
                                            New Year Eve Subscription Collection Report
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

export default NewYearEveReport;
