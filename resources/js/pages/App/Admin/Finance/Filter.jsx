'use client';
import { useState, useMemo, useEffect } from 'react';
import { Box, Button, TextField, FormControl, Select, MenuItem, Grid, Chip, Autocomplete, Typography } from '@mui/material';
import axios from 'axios';
import { Search } from '@mui/icons-material';
import { router, usePage } from '@inertiajs/react';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import { styled } from '@mui/material/styles';
import debounce from 'lodash.debounce';

const RoundedTextField = styled(TextField)({
    '& .MuiOutlinedInput-root': {
        borderRadius: '16px',
    },
});

const TransactionFilter = ({ transactionTypes = [], users = [], subscriptionCategories = [], financialChargeTypes = [] }) => {
    const { props } = usePage();
    const { filters } = props;

    // Local state for filters
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [invoiceNo, setInvoiceNo] = useState(filters.invoice_no || '');
    const [membershipNo, setMembershipNo] = useState(filters.membership_no || '');
    const [customerType, setCustomerType] = useState(filters.customer_type || 'all');

    // Multi-select states
    const [selectedTypes, setSelectedTypes] = useState(filters.type && filters.type !== 'all' ? filters.type.split(',') : []);
    const [selectedMinisters, setSelectedMinisters] = useState(filters.created_by && filters.created_by !== 'all' ? filters.created_by.split(',') : []);
    const [selectedStatus, setSelectedStatus] = useState(filters.status && filters.status !== 'all' ? filters.status.split(',') : []);

    // Sub-filters (Merged into Main Type)
    // const [subscriptionCategoryId, setSubscriptionCategoryId] = useState(filters.subscription_category_id || '');
    // const [financialChargeTypeId, setFinancialChargeTypeId] = useState(filters.financial_charge_type_id || '');

    // Date Map
    const [startDate, setStartDate] = useState(filters.start_date ? dayjs(filters.start_date) : null);
    const [endDate, setEndDate] = useState(filters.end_date ? dayjs(filters.end_date) : null);

    // Suggestion States
    const [suggestions, setSuggestions] = useState([]);
    const [membershipSuggestions, setMembershipSuggestions] = useState([]);
    const [invoiceSuggestions, setInvoiceSuggestions] = useState([]);

    // Fetch Suggestions (Name)
    const fetchSuggestions = useMemo(
        () =>
            debounce(async (query, type) => {
                if (!query) {
                    setSuggestions([]);
                    return;
                }
                try {
                    const response = await axios.get(route('api.bookings.search-customers'), {
                        params: { query, type: type || 'all', include_inactive: 1 },
                    });
                    setSuggestions(response.data);
                } catch (error) {
                    console.error('Error fetching suggestions:', error);
                }
            }, 300),
        [],
    );

    // Fetch Membership Suggestions
    const fetchMembershipSuggestions = useMemo(
        () =>
            debounce(async (query) => {
                if (!query) {
                    setMembershipSuggestions([]);
                    return;
                }
                try {
                    const response = await axios.get(route('api.bookings.search-customers'), {
                        params: { query, type: 'all', include_inactive: 1 },
                    });
                    setMembershipSuggestions(response.data);
                } catch (error) {
                    console.error('Error fetching membership suggestions:', error);
                }
            }, 300),
        [],
    );

    // Fetch Invoice Suggestions
    const fetchInvoiceSuggestions = useMemo(
        () =>
            debounce(async (query) => {
                if (!query) {
                    setInvoiceSuggestions([]);
                    return;
                }
                try {
                    const response = await axios.get(route('finance.transaction.search-invoices'), {
                        params: { query },
                    });
                    setInvoiceSuggestions(response.data);
                } catch (error) {
                    console.error('Error fetching invoice suggestions:', error);
                }
            }, 300),
        [],
    );

    useEffect(() => {
        if (membershipNo) {
            fetchMembershipSuggestions(membershipNo);
        }
    }, [membershipNo]);

    useEffect(() => {
        if (invoiceNo) {
            fetchInvoiceSuggestions(invoiceNo);
        }
    }, [invoiceNo]);

    useEffect(() => {
        if (searchTerm) {
            fetchSuggestions(searchTerm, customerType);
        }
    }, [searchTerm, customerType]);

    // ... (rest of handleApply and handleReset)

    const handleApply = () => {
        const filterParams = {};

        if (searchTerm) filterParams.search = searchTerm;
        if (invoiceNo) filterParams.invoice_no = invoiceNo;
        if (membershipNo) filterParams.membership_no = membershipNo;
        if (customerType && customerType !== 'all') filterParams.customer_type = customerType;

        if (startDate) filterParams.start_date = startDate.format('YYYY-MM-DD');
        if (endDate) filterParams.end_date = endDate.format('YYYY-MM-DD');

        if (selectedTypes.length > 0) filterParams.type = selectedTypes.join(',');
        if (selectedMinisters.length > 0) filterParams.created_by = selectedMinisters.join(',');
        if (selectedStatus.length > 0) filterParams.status = selectedStatus.join(',');

        router.get(route('finance.transaction'), filterParams, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const handleReset = () => {
        setSearchTerm('');
        setInvoiceNo('');
        setMembershipNo('');
        setCustomerType('all');
        setStartDate(null);
        setEndDate(null);
        setSelectedTypes([]);
        setSelectedMinisters([]);
        setSelectedStatus([]);

        router.get(route('finance.transaction'), {}, { preserveState: true, preserveScroll: true });
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box sx={{ mb: 3, mt: 3 }}>
                <Grid container spacing={2} alignItems="center">
                    {/* Customer Type */}
                    <Grid item xs={12} md={2}>
                        <FormControl fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }}>
                            <Select
                                value={customerType}
                                onChange={(e) => setCustomerType(e.target.value)}
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
                                <MenuItem value="all">All Types</MenuItem>
                                <MenuItem value="member">Member</MenuItem>
                                <MenuItem value="corporate">Corporate</MenuItem>
                                <MenuItem value="guest">Guest</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>

                    {/* Membership # */}
                    <Grid item xs={12} md={3}>
                        <Autocomplete
                            freeSolo
                            disablePortal
                            options={membershipSuggestions}
                            getOptionLabel={(option) => {
                                if (typeof option === 'string') return option;
                                return option.membership_no || option.customer_no || '';
                            }}
                            inputValue={membershipNo}
                            onInputChange={(event, newInputValue) => setMembershipNo(newInputValue)}
                            renderInput={(params) => <TextField {...params} fullWidth size="small" label="Membership #" placeholder="Search Membership No..." sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }} />}
                            renderOption={(props, option) => (
                                <li {...props} key={option.id || option.label}>
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

                    {/* Member Name */}
                    <Grid item xs={12} md={3}>
                        <Autocomplete
                            freeSolo
                            disablePortal
                            options={suggestions}
                            getOptionLabel={(option) => {
                                if (typeof option === 'string') return option;
                                return option.full_name || option.name || option.value || option.label || '';
                            }}
                            inputValue={searchTerm}
                            onInputChange={(event, newValue) => setSearchTerm(newValue)}
                            renderInput={(params) => <TextField {...params} fullWidth size="small" label="Member Name" placeholder="Search Name..." sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }} />}
                            renderOption={(props, option) => (
                                <li {...props} key={option.id || option.label}>
                                    <Box sx={{ width: '100%' }}>
                                        <Box display="flex" justifyContent="space-between" alignItems="center">
                                            <Typography variant="body2" fontWeight="bold">
                                                {option.full_name || option.name}
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

                    {/* Invoice No */}
                    <Grid item xs={12} md={2}>
                        <Autocomplete
                            freeSolo
                            disablePortal
                            options={invoiceSuggestions}
                            getOptionLabel={(option) => (option.value ? String(option.value) : String(option))}
                            inputValue={invoiceNo}
                            onInputChange={(event, newInputValue) => setInvoiceNo(newInputValue)}
                            renderInput={(params) => <TextField {...params} fullWidth size="small" label="Invoice No / Name" placeholder="Search Invoice..." sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }} />}
                            renderOption={(props, option) => (
                                <li {...props} key={option.id}>
                                    <Box sx={{ width: '100%' }}>
                                        <Box display="flex" justifyContent="space-between" alignItems="center">
                                            <Typography variant="body2" fontWeight="bold">
                                                #{option.value}
                                            </Typography>
                                            <Chip label={option.type} size="small" sx={{ height: '20px', fontSize: '10px', backgroundColor: '#e3f2fd', color: '#0d47a1' }} />
                                        </Box>
                                        <Typography variant="caption" color="text.secondary">
                                            {option.name}
                                        </Typography>
                                    </Box>
                                </li>
                            )}
                        />
                    </Grid>

                    {/* Fee Type Filter */}
                    <Grid item xs={12} md={3}>
                        <Autocomplete
                            multiple
                            disableCloseOnSelect
                            limitTags={1}
                            options={[
                                ...Object.entries(transactionTypes)
                                    .filter(([id]) => id !== '5' && id !== '6')
                                    .map(([id, name]) => ({ label: name, value: `type_${id}`, group: 'Standard Types' })),
                                ...subscriptionCategories.map((cat) => ({ label: cat.name, value: `sub_${cat.id}`, group: 'Subscriptions' })),
                                ...financialChargeTypes.map((type) => ({ label: type.name, value: `charge_${type.id}`, group: 'Financial Charges' })),
                            ]}
                            groupBy={(option) => option.group}
                            getOptionLabel={(option) => option.label}
                            value={[
                                ...Object.entries(transactionTypes)
                                    .filter(([id]) => id !== '5' && id !== '6')
                                    .map(([id, name]) => ({ label: name, value: `type_${id}`, group: 'Standard Types' })),
                                ...subscriptionCategories.map((cat) => ({ label: cat.name, value: `sub_${cat.id}`, group: 'Subscriptions' })),
                                ...financialChargeTypes.map((type) => ({ label: type.name, value: `charge_${type.id}`, group: 'Financial Charges' })),
                            ].filter((opt) => selectedTypes.includes(opt.value))}
                            onChange={(event, newValue) => {
                                setSelectedTypes(newValue.map((v) => v.value));
                            }}
                            renderInput={(params) => <TextField {...params} label={selectedTypes.length === 0 ? 'Fee Type (All Selected)' : 'Fee Type'} placeholder={selectedTypes.length === 0 ? 'All Types' : 'Select...'} size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }} />}
                            renderOption={(props, option, { selected }) => (
                                <li {...props} key={option.value}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                        <Typography variant="body2" sx={{ fontWeight: selected ? 'bold' : 'normal', color: selected ? '#063455' : 'inherit' }}>
                                            {option.label}
                                        </Typography>
                                    </Box>
                                </li>
                            )}
                            sx={{
                                '& .MuiAutocomplete-tag': {
                                    backgroundColor: '#063455',
                                    color: '#fff',
                                    height: '24px',
                                },
                            }}
                        />
                    </Grid>

                    {/* Created By (Cashier) */}
                    <Grid item xs={12} md={2}>
                        <Autocomplete
                            multiple
                            limitTags={1}
                            options={users}
                            getOptionLabel={(option) => option.name}
                            value={users.filter((user) => selectedMinisters.includes(String(user.id)))}
                            onChange={(event, newValue) => {
                                setSelectedMinisters(newValue.map((user) => String(user.id)));
                            }}
                            renderInput={(params) => <TextField {...params} label="Cashier/User" placeholder="Select..." size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }} />}
                            renderOption={(props, option, { selected }) => (
                                <li {...props} key={option.id}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                        <Typography variant="body2">{option.name}</Typography>
                                    </Box>
                                </li>
                            )}
                            sx={{
                                '& .MuiAutocomplete-tag': {
                                    backgroundColor: '#063455',
                                    color: '#fff',
                                    height: '24px',
                                },
                            }}
                        />
                    </Grid>

                    {/* Status */}
                    <Grid item xs={12} md={2}>
                        <FormControl fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }}>
                            <Select
                                multiple
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                                displayEmpty
                                renderValue={(selected) => {
                                    if (selected.length === 0) return <Typography color="text.secondary">Status</Typography>;
                                    return (
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                            {selected.map((value) => (
                                                <Chip key={value} label={value.charAt(0).toUpperCase() + value.slice(1)} size="small" />
                                            ))}
                                        </Box>
                                    );
                                }}
                            >
                                {['paid', 'unpaid', 'cancelled', 'advance'].map((status) => (
                                    <MenuItem key={status} value={status}>
                                        {status.charAt(0).toUpperCase() + status.slice(1)}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    {/* Start Date */}
                    <Grid item xs={12} md={2}>
                        <DatePicker
                            label="Start Date"
                            format="DD-MM-YYYY"
                            value={startDate}
                            onChange={(newValue) => setStartDate(newValue)}
                            slots={{ textField: RoundedTextField }}
                            slotProps={{
                                textField: { size: 'small', fullWidth: true, onClick: (e) => e.target.closest('.MuiFormControl-root').querySelector('button')?.click() },
                                actionBar: { actions: ['clear', 'today', 'cancel', 'accept'] },
                                popper: { sx: { '& .MuiPaper-root': { borderRadius: '16px', boxShadow: 'none' } } },
                            }}
                            enableAccessibleFieldDOMStructure={false}
                        />
                    </Grid>

                    {/* End Date */}
                    <Grid item xs={12} md={2}>
                        <DatePicker
                            label="End Date"
                            format="DD-MM-YYYY"
                            value={endDate}
                            onChange={(newValue) => setEndDate(newValue)}
                            slots={{ textField: RoundedTextField }}
                            slotProps={{
                                textField: { size: 'small', fullWidth: true, onClick: (e) => e.target.closest('.MuiFormControl-root').querySelector('button')?.click() },
                                actionBar: { actions: ['clear', 'today', 'cancel', 'accept'] },
                                popper: { sx: { '& .MuiPaper-root': { borderRadius: '16px', boxShadow: 'none' } } },
                            }}
                            enableAccessibleFieldDOMStructure={false}
                        />
                    </Grid>

                    {/* Actions */}
                    <Grid item xs={12} md={4} sx={{ display: 'flex', gap: 1 }}>
                        <Button variant="outlined" onClick={handleReset} sx={{ borderRadius: '16px', textTransform: 'none', color: '#063455', border: '1px solid #063455', flex: 1 }}>
                            Reset
                        </Button>
                        <Button variant="contained" startIcon={<Search />} onClick={handleApply} sx={{ borderRadius: '16px', backgroundColor: '#063455', textTransform: 'none', flex: 1 }}>
                            Search
                        </Button>
                    </Grid>
                </Grid>
            </Box>
        </LocalizationProvider>
    );
};

export default TransactionFilter;
