'use client';
import { useState, useMemo, useEffect } from 'react';
import { Box, Button, TextField, FormControl, Select, MenuItem, Grid, Chip, Autocomplete, Typography, Checkbox, ListItemText, Radio, RadioGroup, FormControlLabel } from '@mui/material';
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

const RoomBookingFilter = ({
    routeName = 'rooms.manage',
    showStatus = true,
    showRoomType = true,
    showVenues = false,
    venues = [],
    showDates = { booking: true, checkIn: true, checkOut: true },
    dateLabels = { booking: 'Booking Date', checkIn: 'Check-In', checkOut: 'Check-Out' },
    dateMode = { booking: 'range', checkIn: 'range', checkOut: 'range' },
}) => {
    const { props } = usePage();
    const { filters, roomTypes = [], rooms = [] } = props; // Receive rooms prop

    // Local state for filters
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [searchId, setSearchId] = useState(filters.search_id || '');
    const [membershipNo, setMembershipNo] = useState(filters.membership_no || '');
    const [customerType, setCustomerType] = useState(filters.customer_type || 'all');
    const [guestTypes, setGuestTypes] = useState([]);

    const [bookingDateFrom, setBookingDateFrom] = useState(filters.booking_date_from ? dayjs(filters.booking_date_from) : null);
    const [bookingDateTo, setBookingDateTo] = useState(filters.booking_date_to ? dayjs(filters.booking_date_to) : null);

    const [checkInFrom, setCheckInFrom] = useState(filters.check_in_from || filters.event_date_from || '');
    const [checkInTo, setCheckInTo] = useState(filters.check_in_to || filters.event_date_to || '');

    const [checkOutFrom, setCheckOutFrom] = useState(filters.check_out_from || '');
    const [checkOutTo, setCheckOutTo] = useState(filters.check_out_to || '');

    const [selectedRoomTypes, setSelectedRoomTypes] = useState(filters.room_type ? filters.room_type.split(',') : []);
    const [selectedRooms, setSelectedRooms] = useState(filters.room_ids ? filters.room_ids.split(',') : []);
    const [selectedVenues, setSelectedVenues] = useState(filters.venues || []); // For Events
    const [selectedStatus, setSelectedStatus] = useState(filters.booking_status ? filters.booking_status.split(',') : filters.status || []);

    // Suggestions State
    const [suggestions, setSuggestions] = useState([]);
    const [membershipSuggestions, setMembershipSuggestions] = useState([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);

    // Fetch Suggestions
    const fetchSuggestions = useMemo(
        () =>
            debounce(async (query, type) => {
                if (!query) {
                    setSuggestions([]);
                    return;
                }
                setLoadingSuggestions(true);
                try {
                    const response = await axios.get(route(routeName.includes('events') ? 'api.events.search-customers' : 'api.bookings.search-customers'), {
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
            debounce(async (query) => {
                if (!query) {
                    setMembershipSuggestions([]);
                    return;
                }
                try {
                    const response = await axios.get(route(routeName.includes('events') ? 'api.events.search-customers' : 'api.bookings.search-customers'), {
                        params: { query, type: 'all' }, // Search all types for membership/customer no
                    });
                    setMembershipSuggestions(response.data);
                } catch (error) {
                    console.error('Error fetching membership suggestions:', error);
                }
            }, 300),
        [],
    );

    useEffect(() => {
        if (membershipNo) {
            fetchMembershipSuggestions(membershipNo);
        } else {
            setMembershipSuggestions([]);
        }
    }, [membershipNo]);

    useEffect(() => {
        if (searchTerm) {
            fetchSuggestions(searchTerm, customerType);
        } else {
            setSuggestions([]);
        }
    }, [searchTerm, customerType]); // Re-fetch if type changes while searching

    useEffect(() => {
        if (!routeName.includes('events')) {
            setGuestTypes([]);
            return;
        }

        axios
            .get(route('api.guest-types.active'))
            .then((res) => setGuestTypes(Array.isArray(res.data) ? res.data : []))
            .catch(() => setGuestTypes([]));
    }, [routeName]);

    const handleApply = () => {
        const filterParams = {};

        if (searchTerm) filterParams.search = searchTerm;
        if (searchId) filterParams.search_id = searchId;
        if (membershipNo) filterParams.membership_no = membershipNo;
        if (customerType && customerType !== 'all') filterParams.customer_type = customerType;

        if (bookingDateFrom) filterParams.booking_date_from = bookingDateFrom.format('YYYY-MM-DD');
        if (bookingDateTo) filterParams.booking_date_to = bookingDateTo.format('YYYY-MM-DD');

        // Allow adapting parameter names based on whether it's for events or rooms
        // We know 'events' routes might use event_date_from/to instead of check_in_from/to
        // But for simplicity, we can just pass check_in params and let the controller handle mapping if we wanted,
        // OR we can check the route name.
        if (routeName.includes('events')) {
            if (checkInFrom) filterParams.event_date_from = checkInFrom;
            if (checkInTo) filterParams.event_date_to = checkInTo;
            if (dateMode.checkIn === 'single' && checkInFrom && !checkInTo) filterParams.event_date_to = checkInFrom;
        } else {
            if (checkInFrom) filterParams.check_in_from = checkInFrom;
            if (checkInTo) filterParams.check_in_to = checkInTo;
            if (dateMode.checkIn === 'single' && checkInFrom && !checkInTo) filterParams.check_in_to = checkInFrom;
        }

        if (checkOutFrom) filterParams.check_out_from = checkOutFrom;
        if (checkOutTo) filterParams.check_out_to = checkOutTo;
        if (dateMode.checkOut === 'single' && checkOutFrom && !checkOutTo) filterParams.check_out_to = checkOutFrom;

        if (selectedRoomTypes.length > 0) filterParams.room_type = selectedRoomTypes.join(',');
        if (selectedRooms.length > 0) filterParams.room_ids = selectedRooms.join(',');
        if (selectedVenues.length > 0) filterParams.venues = selectedVenues;

        if (selectedStatus.length > 0) {
            filterParams.booking_status = selectedStatus.join(',');
            // Also pass as 'status' array for event controllers that expect array
            filterParams.status = selectedStatus;
        }

        router.get(route(routeName), filterParams, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleReset = () => {
        setSearchTerm('');
        setSearchId('');
        setMembershipNo('');
        setCustomerType('all');
        setBookingDateFrom(null);
        setBookingDateTo(null);
        setCheckInFrom('');
        setCheckInTo('');
        setCheckOutFrom('');
        setCheckOutTo('');
        setSelectedRoomTypes([]);
        setSelectedRooms([]);
        setSelectedVenues([]);
        setSelectedStatus([]);

        router.get(route(routeName), {}, { preserveState: true, preserveScroll: true });
    };

    const selectedRoomTypeObjects = roomTypes.filter((rt) => selectedRoomTypes.includes(rt.id.toString()));

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box sx={{ mb: 3, mt: 3, boxShadow: 'none' }}>
                <Grid container spacing={2} alignItems="center">
                    {/* Customer Type Selection */}
                    <Grid item xs={12} md={3}>
                        {/* <FormControl component="fieldset">
                            <RadioGroup row aria-label="customer-type" name="customer-type" value={customerType} onChange={(e) => setCustomerType(e.target.value)}>
                                <FormControlLabel value="all" control={<Radio sx={{ color: '#063455', '&.Mui-checked': { color: '#063455' } }} />} label="All" />
                                <FormControlLabel value="member" control={<Radio sx={{ color: '#063455', '&.Mui-checked': { color: '#063455' } }} />} label="Member" />
                                <FormControlLabel value="corporate" control={<Radio sx={{ color: '#063455', '&.Mui-checked': { color: '#063455' } }} />} label="Corporate" />
                                <FormControlLabel value="guest" control={<Radio sx={{ color: '#063455', '&.Mui-checked': { color: '#063455' } }} />} label="Guest" />
                            </RadioGroup>
                        </FormControl> */}
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
                                value={customerType}
                                onChange={(e) => setCustomerType(e.target.value)}
                                defaultValue="all"
                                MenuProps={{
                                    sx: {
                                        '& .MuiPaper-root': {
                                            borderRadius: '16px',
                                            boxShadow: 'none !important',
                                            marginTop: '4px',
                                            maxHeight: '180px', // Limits height after 4+ rooms
                                            overflowY: 'auto', // Adds scroll when needed
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
                                <MenuItem value="guest">Guest</MenuItem>
                                {routeName.includes('events') &&
                                    guestTypes.map((type) => (
                                        <MenuItem key={type.id} value={`guest-${type.id}`}>
                                            {type.name}
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
                            getOptionLabel={(option) => option.value || option} // Use value (name) for input text
                            inputValue={searchTerm}
                            onInputChange={(event, newInputValue) => {
                                setSearchTerm(newInputValue);
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
                    <Grid item xs={12} md={3}>
                        <Autocomplete
                            freeSolo
                            disablePortal
                            options={membershipSuggestions}
                            getOptionLabel={(option) => option.membership_no || option.customer_no || option.value || option}
                            inputValue={membershipNo}
                            onInputChange={(event, newInputValue) => {
                                setMembershipNo(newInputValue);
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
                    <Grid item xs={12} md={3}>
                        <TextField fullWidth size="small" label="Booking ID" placeholder="Booking ID..." value={searchId} onChange={(e) => setSearchId(e.target.value)} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }} />
                    </Grid>

                    {/* Booking Date Range */}
                    {showDates.booking && (
                        <>
                            <Grid item xs={12} md={3}>
                                <DatePicker
                                    label={`${dateLabels.booking} From`}
                                    format="DD-MM-YYYY"
                                    value={bookingDateFrom ? dayjs(bookingDateFrom) : null}
                                    onChange={(newValue) => setBookingDateFrom(newValue ? newValue.format('YYYY-MM-DD') : '')}
                                    enableAccessibleFieldDOMStructure={false}
                                    slots={{ textField: RoundedTextField }}
                                    slotProps={{
                                        textField: {
                                            size: 'small',
                                            fullWidth: true,
                                            sx: { minWidth: '150px' },
                                            onClick: (e) => e.target.closest('.MuiFormControl-root').querySelector('button')?.click(),
                                        },
                                        actionBar: { actions: ['clear', 'today', 'cancel', 'accept'] },
                                        popper: {
                                            sx: {
                                                mt: 1, // Top spacing
                                                // mb: 2,
                                                '& .MuiPaper-root': {
                                                    borderRadius: '16px', // ✅ Rounded corners
                                                    boxShadow: 'none',
                                                },
                                            },
                                        },
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <DatePicker
                                    label={`${dateLabels.booking} To`}
                                    format="DD-MM-YYYY"
                                    value={bookingDateTo ? dayjs(bookingDateTo) : null}
                                    onChange={(newValue) => setBookingDateTo(newValue ? newValue.format('YYYY-MM-DD') : '')}
                                    enableAccessibleFieldDOMStructure={false}
                                    slots={{ textField: RoundedTextField }}
                                    slotProps={{
                                        textField: { size: 'small', fullWidth: true, sx: { minWidth: '150px' }, onClick: (e) => e.target.closest('.MuiFormControl-root').querySelector('button')?.click() },
                                        actionBar: { actions: ['clear', 'today', 'cancel', 'accept'] },
                                        popper: {
                                            sx: {
                                                mt: 1, // Top spacing
                                                // mb: 2,
                                                '& .MuiPaper-root': {
                                                    borderRadius: '16px', // ✅ Rounded corners
                                                    boxShadow: 'none',
                                                },
                                            },
                                        },
                                    }}
                                />
                            </Grid>
                        </>
                    )}

                    {/* Check In Date Range */}
                    {showDates.checkIn && (
                        <>
                            {dateMode.checkIn === 'single' ? (
                                <Grid item xs={12} md={3}>
                                    <DatePicker
                                        label={dateLabels.checkIn}
                                        format="DD-MM-YYYY"
                                        value={checkInFrom ? dayjs(checkInFrom) : null}
                                        onChange={(newValue) => {
                                            const v = newValue ? newValue.format('YYYY-MM-DD') : '';
                                            setCheckInFrom(v);
                                            setCheckInTo(v);
                                        }}
                                        enableAccessibleFieldDOMStructure={false}
                                        slots={{ textField: RoundedTextField }}
                                        slotProps={{
                                            textField: { size: 'small', fullWidth: true, sx: { minWidth: '150px' }, onClick: (e) => e.target.closest('.MuiFormControl-root').querySelector('button')?.click() },
                                            actionBar: { actions: ['clear', 'today', 'cancel', 'accept'] },
                                            popper: {
                                                sx: {
                                                    mt: 1,
                                                    '& .MuiPaper-root': {
                                                        borderRadius: '16px',
                                                        boxShadow: 'none',
                                                    },
                                                },
                                            },
                                        }}
                                    />
                                </Grid>
                            ) : (
                                <>
                                    <Grid item xs={12} md={3}>
                                        <DatePicker
                                            label={`${dateLabels.checkIn} From`}
                                            format="DD-MM-YYYY"
                                            value={checkInFrom ? dayjs(checkInFrom) : null}
                                            onChange={(newValue) => setCheckInFrom(newValue ? newValue.format('YYYY-MM-DD') : '')}
                                            enableAccessibleFieldDOMStructure={false}
                                            slots={{ textField: RoundedTextField }}
                                            slotProps={{
                                                textField: { size: 'small', fullWidth: true, sx: { minWidth: '150px' }, onClick: (e) => e.target.closest('.MuiFormControl-root').querySelector('button')?.click() },
                                                actionBar: { actions: ['clear', 'today', 'cancel', 'accept'] },
                                                popper: {
                                                    sx: {
                                                        mt: 1,
                                                        '& .MuiPaper-root': {
                                                            borderRadius: '16px',
                                                            boxShadow: 'none',
                                                        },
                                                    },
                                                },
                                            }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={3}>
                                        <DatePicker
                                            label="Check-In To"
                                            format="DD-MM-YYYY"
                                            value={checkInTo ? dayjs(checkInTo) : null}
                                            onChange={(newValue) => setCheckInTo(newValue ? newValue.format('YYYY-MM-DD') : '')}
                                            enableAccessibleFieldDOMStructure={false}
                                            slots={{ textField: RoundedTextField }}
                                            slotProps={{
                                                textField: { size: 'small', fullWidth: true, sx: { minWidth: '150px' }, onClick: (e) => e.target.closest('.MuiFormControl-root').querySelector('button')?.click() },
                                                actionBar: { actions: ['clear', 'today', 'cancel', 'accept'] },
                                                popper: {
                                                    sx: {
                                                        mt: 2,
                                                        '& .MuiPaper-root': {
                                                            borderRadius: '16px',
                                                            boxShadow: 'none',
                                                        },
                                                    },
                                                },
                                            }}
                                        />
                                    </Grid>
                                </>
                            )}
                        </>
                    )}

                    {/* Check Out Date Range */}
                    {showDates.checkOut && (
                        <>
                            {dateMode.checkOut === 'single' ? (
                                <Grid item xs={12} md={3}>
                                    <DatePicker
                                        label={dateLabels.checkOut}
                                        format="DD-MM-YYYY"
                                        value={checkOutFrom ? dayjs(checkOutFrom) : null}
                                        onChange={(newValue) => {
                                            const v = newValue ? newValue.format('YYYY-MM-DD') : '';
                                            setCheckOutFrom(v);
                                            setCheckOutTo(v);
                                        }}
                                        enableAccessibleFieldDOMStructure={false}
                                        slots={{ textField: RoundedTextField }}
                                        slotProps={{
                                            textField: { size: 'small', fullWidth: true, sx: { minWidth: '150px' }, onClick: (e) => e.target.closest('.MuiFormControl-root').querySelector('button')?.click() },
                                            actionBar: { actions: ['clear', 'today', 'cancel', 'accept'] },
                                            popper: {
                                                sx: {
                                                    mt: 1,
                                                    '& .MuiPaper-root': {
                                                        borderRadius: '16px',
                                                        boxShadow: 'none',
                                                    },
                                                },
                                            },
                                        }}
                                    />
                                </Grid>
                            ) : (
                                <>
                                    <Grid item xs={12} md={3}>
                                        <DatePicker
                                            label={`${dateLabels.checkOut} From`}
                                            format="DD-MM-YYYY"
                                            value={checkOutFrom ? dayjs(checkOutFrom) : null}
                                            onChange={(newValue) => setCheckOutFrom(newValue ? newValue.format('YYYY-MM-DD') : '')}
                                            enableAccessibleFieldDOMStructure={false}
                                            slots={{ textField: RoundedTextField }}
                                            slotProps={{
                                                textField: { size: 'small', fullWidth: true, sx: { minWidth: '150px' }, onClick: (e) => e.target.closest('.MuiFormControl-root').querySelector('button')?.click() },
                                                actionBar: { actions: ['clear', 'today', 'cancel', 'accept'] },
                                                popper: {
                                                    sx: {
                                                        mt: 1,
                                                        '& .MuiPaper-root': {
                                                            borderRadius: '16px',
                                                            boxShadow: 'none',
                                                        },
                                                    },
                                                },
                                            }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={3}>
                                        <DatePicker
                                            label={`${dateLabels.checkOut} To`}
                                            format="DD-MM-YYYY"
                                            value={checkOutTo ? dayjs(checkOutTo) : null}
                                            onChange={(newValue) => setCheckOutTo(newValue ? newValue.format('YYYY-MM-DD') : '')}
                                            enableAccessibleFieldDOMStructure={false}
                                            slots={{ textField: RoundedTextField }}
                                            slotProps={{
                                                textField: { size: 'small', fullWidth: true, sx: { minWidth: '150px' }, onClick: (e) => e.target.closest('.MuiFormControl-root').querySelector('button')?.click() },
                                                actionBar: { actions: ['clear', 'today', 'cancel', 'accept'] },
                                                popper: {
                                                    sx: {
                                                        mt: 1,
                                                        '& .MuiPaper-root': {
                                                            borderRadius: '16px',
                                                            boxShadow: 'none',
                                                        },
                                                    },
                                                },
                                            }}
                                        />
                                    </Grid>
                                </>
                            )}
                        </>
                    )}

                    {/* Room Type Filter */}
                    {showRoomType && roomTypes && (
                        <Grid item xs={12} md={3}>
                            <FormControl fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }}>
                                <Select
                                    multiple
                                    value={selectedRoomTypes}
                                    onChange={(e) => setSelectedRoomTypes(e.target.value)}
                                    displayEmpty
                                    renderValue={(selected) => {
                                        if (selected.length === 0) return <Typography color="text.secondary">Room Type</Typography>;
                                        return (
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                {selected.map((value) => {
                                                    const type = roomTypes.find((rt) => rt.id == value);
                                                    return <Chip key={value} label={type ? type.name : value} size="small" style={{ color: '#fff', backgroundColor: '#063455' }} />;
                                                })}
                                            </Box>
                                        );
                                    }}
                                    MenuProps={{
                                        sx: {
                                            '& .MuiPaper-root': {
                                                borderRadius: '16px',
                                                boxShadow: 'none !important',
                                                marginTop: '4px',
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
                                    {roomTypes.map((type) => (
                                        <MenuItem key={type.id} value={type.id.toString()}>
                                            {type.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            {/* <Autocomplete
                                multiple
                                options={roomTypes}
                                getOptionLabel={(option) => option.name}
                                value={selectedRoomTypeObjects}
                                onChange={(_, newValue) => {
                                    // newValue is array of roomType objects
                                    setSelectedRoomTypes(newValue.map(v => v.id.toString()));
                                }}
                                // placeholder when nothing selected
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        placeholder="Room Type"
                                        size="small"
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: '16px',
                                            },
                                        }}
                                    />
                                )}
                                renderTags={(value, getTagProps) =>
                                    value.map((option, index) => (
                                        <Chip
                                            {...getTagProps({ index })}
                                            key={option.id}
                                            label={option.name}
                                            size="small"
                                        />
                                    ))
                                }
                                sx={{
                                    // dropdown paper styling
                                    '& .MuiAutocomplete-popper .MuiPaper-root': {
                                        borderRadius: '16px',
                                        boxShadow: 'none',
                                        marginTop: '4px',
                                    },
                                    '& .MuiAutocomplete-popper .MuiAutocomplete-option': {
                                        '&:hover': {
                                            backgroundColor: '#063455',
                                            color: '#fff',
                                        },
                                    },
                                }}
                            /> */}
                        </Grid>
                    )}
                    {/* Room Selection */}
                    {showRoomType && rooms && (
                        <Grid item xs={12} md={3}>
                            <FormControl fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }}>
                                <Select
                                    multiple
                                    value={selectedRooms}
                                    onChange={(e) => setSelectedRooms(e.target.value)}
                                    displayEmpty
                                    renderValue={(selected) => {
                                        if (selected.length === 0) return <Typography color="text.secondary">Select Room</Typography>;
                                        return (
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                {selected.map((value) => {
                                                    const room = rooms.find((r) => r.id == value);
                                                    return <Chip key={value} label={room ? room.name : value} size="small" style={{ color: '#fff', backgroundColor: '#063455' }} />;
                                                })}
                                            </Box>
                                        );
                                    }}
                                    MenuProps={{
                                        sx: {
                                            '& .MuiPaper-root': {
                                                borderRadius: '16px',
                                                boxShadow: 'none !important',
                                                marginTop: '4px',
                                                maxHeight: '180px', // Limits height after 4+ rooms
                                                overflowY: 'auto', // Adds scroll when needed
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
                                    {rooms &&
                                        rooms.map((room) => (
                                            <MenuItem key={room.id} value={String(room.id)}>
                                                {room.name}
                                            </MenuItem>
                                        ))}
                                </Select>
                            </FormControl>
                        </Grid>
                    )}

                    {/* Venue Selection (For Events) */}
                    {showVenues && venues && (
                        <Grid item xs={12} md={3}>
                            <FormControl fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }}>
                                <Select
                                    multiple
                                    value={selectedVenues}
                                    onChange={(e) => setSelectedVenues(e.target.value)}
                                    displayEmpty
                                    renderValue={(selected) => {
                                        if (selected.length === 0) return <Typography style={{ color: '#999' }}>Choose Venues</Typography>;
                                        return (
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                {selected.map((value) => {
                                                    // Check if venue is object (from controller) or simple string
                                                    // Controller returns formatted options as {value: 'Name', label: 'Name'}
                                                    const venueObj = venues.find((v) => v.value === value || v.id == value);
                                                    return <Chip key={value} label={venueObj?.label || venueObj?.name || value} size="small" />;
                                                })}
                                            </Box>
                                        );
                                    }}
                                    MenuProps={{
                                        sx: {
                                            '& .MuiPaper-root': {
                                                borderRadius: '16px',
                                                boxShadow: 'none !important',
                                                marginTop: '4px',
                                            },
                                            '& .MuiMenuItem-root': {
                                                borderRadius: '16px',
                                                // px:5,
                                                '&:hover': {
                                                    backgroundColor: '#063455 !important',
                                                    color: '#fff !important',
                                                },
                                            },
                                        },
                                    }}
                                >
                                    {venues.map((venue) => (
                                        <MenuItem key={venue.value || venue.id} value={venue.value || String(venue.id)}>
                                            {venue.label || venue.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                    )}

                    {/* Status Filter */}
                    {showStatus && (
                        <Grid item xs={12} md={3}>
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
                                                {selected.map((value) => {
                                                    const label = value.replace('_', ' ');
                                                    const capitalizedLabel = label.charAt(0).toUpperCase() + label.slice(1);
                                                    return <Chip key={value} label={capitalizedLabel} size="small" style={{ color: '#fff', backgroundColor: '#063455' }} />;
                                                })}
                                            </Box>
                                        );
                                    }}
                                    MenuProps={{
                                        sx: {
                                            '& .MuiPaper-root': {
                                                borderRadius: '16px',
                                                boxShadow: 'none !important',
                                                marginTop: '4px',
                                            },
                                            '& .MuiMenuItem-root': {
                                                borderRadius: '16px',
                                                // px:5,
                                                '&:hover': {
                                                    backgroundColor: '#063455 !important',
                                                    color: '#fff !important',
                                                },
                                            },
                                        },
                                    }}
                                >
                                    {/* 'checked_in', 'checked_out',  */}
                                    {['confirmed', 'completed', 'cancelled', 'paid', 'unpaid'].map((status) => (
                                        <MenuItem key={status} value={status}>
                                            {status.replace('_', ' ')}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                    )}

                    {/* Action Buttons */}
                    <Grid item xs={12} md={3} sx={{ display: 'flex', gap: 2 }}>
                        <Button variant="outlined" onClick={handleReset} sx={{ borderRadius: '16px', textTransform: 'none', color: '#063455', border: '1px solid #063455', paddingLeft: 4, paddingRight: 4 }}>
                            Reset
                        </Button>
                        <Button variant="contained" startIcon={<Search />} onClick={handleApply} sx={{ borderRadius: '16px', backgroundColor: '#063455', textTransform: 'none', paddingLeft: 4, paddingRight: 4 }}>
                            Search
                        </Button>
                    </Grid>
                </Grid>
            </Box>
        </LocalizationProvider>
    );
};

export default RoomBookingFilter;
