'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Box, Button, TextField, FormControl, Select, MenuItem, Grid, Chip, Autocomplete, Typography, Paper } from '@mui/material';
import axios from 'axios';
import { Search } from '@mui/icons-material';
import { router, usePage } from '@inertiajs/react';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import { styled } from '@mui/material/styles';
import debounce from 'lodash.debounce';
import FilterToolbar from '@/components/App/ui/FilterToolbar';

const RoundedTextField = styled(TextField)({
    '& .MuiOutlinedInput-root': {
        borderRadius: '16px',
    },
});

const defaultShellSx = {
    mb: 3,
    mt: 3,
    borderRadius: 4,
    border: '1px solid rgba(6, 52, 85, 0.08)',
    background: 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.98) 100%)',
    px: { xs: 2, md: 2.5 },
    py: { xs: 2, md: 2.5 },
};

export default function RoomBookingFilter({
    routeName = 'rooms.manage',
    showStatus = true,
    showRoomType = true,
    showVenues = false,
    venues = [],
    showDates = { booking: true, checkIn: true, checkOut: true },
    dateLabels = { booking: 'Booking Date', checkIn: 'Check-In', checkOut: 'Check-Out' },
    dateMode = { booking: 'range', checkIn: 'range', checkOut: 'range' },
    embedded = false,
}) {
    const { props } = usePage();
    const { filters, roomTypes = [], rooms = [] } = props;

    const normalizeDate = (value) => {
        if (!value) return '';
        return dayjs(value).isValid() ? dayjs(value).format('YYYY-MM-DD') : '';
    };

    const normalizeArray = (value) => {
        if (Array.isArray(value)) return value.filter(Boolean).map((item) => String(item));
        if (typeof value === 'string' && value.trim() !== '') {
            return value
                .split(',')
                .map((item) => item.trim())
                .filter(Boolean);
        }

        return [];
    };

    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [searchId, setSearchId] = useState(filters.search_id || '');
    const [membershipNo, setMembershipNo] = useState(filters.membership_no || '');
    const [customerType, setCustomerType] = useState(filters.customer_type || 'all');
    const [guestTypes, setGuestTypes] = useState([]);

    const [bookingDateFrom, setBookingDateFrom] = useState(normalizeDate(filters.booking_date_from));
    const [bookingDateTo, setBookingDateTo] = useState(normalizeDate(filters.booking_date_to));
    const [checkInFrom, setCheckInFrom] = useState(normalizeDate(filters.check_in_from || filters.event_date_from));
    const [checkInTo, setCheckInTo] = useState(normalizeDate(filters.check_in_to || filters.event_date_to));
    const [checkOutFrom, setCheckOutFrom] = useState(normalizeDate(filters.check_out_from));
    const [checkOutTo, setCheckOutTo] = useState(normalizeDate(filters.check_out_to));

    const [selectedRoomTypes, setSelectedRoomTypes] = useState(normalizeArray(filters.room_type));
    const [selectedRooms, setSelectedRooms] = useState(normalizeArray(filters.room_ids));
    const [selectedVenues, setSelectedVenues] = useState(normalizeArray(filters.venues));
    const [selectedStatus, setSelectedStatus] = useState(normalizeArray(filters.booking_status || filters.status));

    const [suggestions, setSuggestions] = useState([]);
    const [membershipSuggestions, setMembershipSuggestions] = useState([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);

    const buildFilterParams = useCallback(() => {
        const filterParams = {};

        if (searchTerm) filterParams.search = searchTerm;
        if (searchId) filterParams.search_id = searchId;
        if (membershipNo) filterParams.membership_no = membershipNo;
        if (customerType && customerType !== 'all') filterParams.customer_type = customerType;

        if (bookingDateFrom) filterParams.booking_date_from = bookingDateFrom;
        if (bookingDateTo) filterParams.booking_date_to = bookingDateTo;

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
            filterParams.status = selectedStatus;
        }

        return filterParams;
    }, [bookingDateFrom, bookingDateTo, checkInFrom, checkInTo, checkOutFrom, checkOutTo, customerType, dateMode.checkIn, dateMode.checkOut, membershipNo, routeName, searchId, searchTerm, selectedRoomTypes, selectedRooms, selectedStatus, selectedVenues]);

    const submitFilters = useCallback(
        (params) => {
            router.get(route(routeName), params, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            });
        },
        [routeName],
    );

    const debouncedApply = useMemo(() => debounce((params) => submitFilters(params), 350), [submitFilters]);
    const hasMountedRef = useRef(false);
    const isSyncingFromPropsRef = useRef(false);

    useEffect(() => () => debouncedApply.cancel(), [debouncedApply]);

    useEffect(() => {
        isSyncingFromPropsRef.current = true;
        setSearchTerm(filters.search || '');
        setSearchId(filters.search_id || '');
        setMembershipNo(filters.membership_no || '');
        setCustomerType(filters.customer_type || 'all');
        setBookingDateFrom(normalizeDate(filters.booking_date_from));
        setBookingDateTo(normalizeDate(filters.booking_date_to));
        setCheckInFrom(normalizeDate(filters.check_in_from || filters.event_date_from));
        setCheckInTo(normalizeDate(filters.check_in_to || filters.event_date_to));
        setCheckOutFrom(normalizeDate(filters.check_out_from));
        setCheckOutTo(normalizeDate(filters.check_out_to));
        setSelectedRoomTypes(normalizeArray(filters.room_type));
        setSelectedRooms(normalizeArray(filters.room_ids));
        setSelectedVenues(normalizeArray(filters.venues));
        setSelectedStatus(normalizeArray(filters.booking_status || filters.status));
    }, [filters]);

    useEffect(() => {
        if (!hasMountedRef.current) {
            hasMountedRef.current = true;
            return;
        }

        if (isSyncingFromPropsRef.current) {
            isSyncingFromPropsRef.current = false;
            return;
        }

        debouncedApply(buildFilterParams());
    }, [buildFilterParams, debouncedApply]);

    const fetchSuggestions = useMemo(
        () =>
            debounce(async (query, type) => {
                if (!query) {
                    setSuggestions([]);
                    return;
                }
                setLoadingSuggestions(true);
                try {
                    const suggestionType = typeof type === 'string' && type.startsWith('guest-') ? 'guest' : type;
                    const response = await axios.get(route(routeName.includes('events') ? 'api.events.search-customers' : 'api.bookings.search-customers'), {
                        params: { query, type: suggestionType },
                    });
                    setSuggestions(Array.isArray(response.data) ? response.data : []);
                } catch (error) {
                    console.error('Error fetching suggestions:', error);
                    setSuggestions([]);
                } finally {
                    setLoadingSuggestions(false);
                }
            }, 300),
        [routeName],
    );

    const fetchMembershipSuggestions = useMemo(
        () =>
            debounce(async (query) => {
                if (!query) {
                    setMembershipSuggestions([]);
                    return;
                }
                try {
                    const response = await axios.get(route(routeName.includes('events') ? 'api.events.search-customers' : 'api.bookings.search-customers'), {
                        params: { query, type: 'all' },
                    });
                    setMembershipSuggestions(Array.isArray(response.data) ? response.data : []);
                } catch (error) {
                    console.error('Error fetching membership suggestions:', error);
                    setMembershipSuggestions([]);
                }
            }, 300),
        [routeName],
    );

    useEffect(() => {
        if (membershipNo) {
            fetchMembershipSuggestions(membershipNo);
        } else {
            setMembershipSuggestions([]);
        }
    }, [membershipNo, fetchMembershipSuggestions]);

    useEffect(() => {
        if (searchTerm) {
            fetchSuggestions(searchTerm, customerType);
        } else {
            setSuggestions([]);
        }
    }, [searchTerm, customerType, fetchSuggestions]);

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
        debouncedApply.cancel();
        submitFilters(buildFilterParams());
    };

    const handleReset = () => {
        debouncedApply.cancel();
        hasMountedRef.current = true;
        isSyncingFromPropsRef.current = true;
        setSearchTerm('');
        setSearchId('');
        setMembershipNo('');
        setCustomerType('all');
        setBookingDateFrom('');
        setBookingDateTo('');
        setCheckInFrom('');
        setCheckInTo('');
        setCheckOutFrom('');
        setCheckOutTo('');
        setSelectedRoomTypes([]);
        setSelectedRooms([]);
        setSelectedVenues([]);
        setSelectedStatus([]);
        submitFilters({});
    };

    const selectedRoomTypeObjects = roomTypes.filter((rt) => selectedRoomTypes.includes(rt.id.toString()));
    void selectedRoomTypeObjects;

    const fields = (
        <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={3}>
                    <FormControl size="small" sx={{ width: '100%', '& .MuiOutlinedInput-root': { borderRadius: '16px' } }}>
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
                            <MenuItem value="guest">Guest</MenuItem>
                            {routeName.includes('events')
                                ? guestTypes.map((type) => (
                                      <MenuItem key={type.id} value={`guest-${type.id}`}>
                                          {type.name}
                                      </MenuItem>
                                  ))
                                : null}
                        </Select>
                    </FormControl>
                </Grid>

                <Grid item xs={12} md={3}>
                    <Autocomplete
                        freeSolo
                        disablePortal
                        options={suggestions}
                        loading={loadingSuggestions}
                        getOptionLabel={(option) => option.value || option}
                        inputValue={searchTerm}
                        onInputChange={(_, newInputValue) => setSearchTerm(newInputValue)}
                        renderInput={(params) => <TextField {...params} fullWidth size="small" label="Search Name" placeholder="Guest Name..." sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }} />}
                        renderOption={(props, option) => (
                            <li {...props} key={option.id || option.label}>
                                <Box sx={{ width: '100%' }}>
                                    <Box display="flex" justifyContent="space-between" alignItems="center">
                                        <Typography variant="body2" fontWeight="bold">
                                            {option.membership_no || option.customer_no || option.employee_id}
                                        </Typography>
                                        {option.status ? (
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
                                        ) : null}
                                    </Box>
                                    <Typography variant="caption" color="text.secondary">
                                        {option.name || option.label}
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
                        options={membershipSuggestions}
                        getOptionLabel={(option) => option.membership_no || option.customer_no || option.value || option}
                        inputValue={membershipNo}
                        onInputChange={(_, newInputValue) => setMembershipNo(newInputValue)}
                        renderInput={(params) => <TextField {...params} fullWidth size="small" label="Membership #" placeholder="Number..." sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }} />}
                        renderOption={(props, option) => (
                            <li {...props} key={option.id || option.label}>
                                <Box sx={{ width: '100%' }}>
                                    <Box display="flex" justifyContent="space-between" alignItems="center">
                                        <Typography variant="body2" fontWeight="bold">
                                            {option.membership_no || option.customer_no || option.employee_id}
                                        </Typography>
                                        {option.status ? (
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
                                        ) : null}
                                    </Box>
                                    <Typography variant="caption" color="text.secondary">
                                        {option.name || option.label}
                                    </Typography>
                                </Box>
                            </li>
                        )}
                    />
                </Grid>

                <Grid item xs={12} md={3}>
                    <TextField fullWidth size="small" label="Booking ID" placeholder="Booking ID..." value={searchId} onChange={(e) => setSearchId(e.target.value)} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }} />
                </Grid>

                {showDates.booking ? (
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
                                    textField: { size: 'small', fullWidth: true, sx: { minWidth: '150px' }, onClick: (e) => e.target.closest('.MuiFormControl-root').querySelector('button')?.click() },
                                    actionBar: { actions: ['clear', 'today', 'cancel', 'accept'] },
                                    popper: { sx: { mt: 1, '& .MuiPaper-root': { borderRadius: '16px', boxShadow: 'none' } } },
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
                                    popper: { sx: { mt: 1, '& .MuiPaper-root': { borderRadius: '16px', boxShadow: 'none' } } },
                                }}
                            />
                        </Grid>
                    </>
                ) : null}

                {showDates.checkIn ? (
                    dateMode.checkIn === 'single' ? (
                        <Grid item xs={12} md={3}>
                            <DatePicker
                                label={dateLabels.checkIn}
                                format="DD-MM-YYYY"
                                value={checkInFrom ? dayjs(checkInFrom) : null}
                                onChange={(newValue) => {
                                    const value = newValue ? newValue.format('YYYY-MM-DD') : '';
                                    setCheckInFrom(value);
                                    setCheckInTo(value);
                                }}
                                enableAccessibleFieldDOMStructure={false}
                                slots={{ textField: RoundedTextField }}
                                slotProps={{
                                    textField: { size: 'small', fullWidth: true, sx: { minWidth: '150px' }, onClick: (e) => e.target.closest('.MuiFormControl-root').querySelector('button')?.click() },
                                    actionBar: { actions: ['clear', 'today', 'cancel', 'accept'] },
                                    popper: { sx: { mt: 1, '& .MuiPaper-root': { borderRadius: '16px', boxShadow: 'none' } } },
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
                                        popper: { sx: { mt: 1, '& .MuiPaper-root': { borderRadius: '16px', boxShadow: 'none' } } },
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
                                        popper: { sx: { mt: 2, '& .MuiPaper-root': { borderRadius: '16px', boxShadow: 'none' } } },
                                    }}
                                />
                            </Grid>
                        </>
                    )
                ) : null}

                {showDates.checkOut ? (
                    dateMode.checkOut === 'single' ? (
                        <Grid item xs={12} md={3}>
                            <DatePicker
                                label={dateLabels.checkOut}
                                format="DD-MM-YYYY"
                                value={checkOutFrom ? dayjs(checkOutFrom) : null}
                                onChange={(newValue) => {
                                    const value = newValue ? newValue.format('YYYY-MM-DD') : '';
                                    setCheckOutFrom(value);
                                    setCheckOutTo(value);
                                }}
                                enableAccessibleFieldDOMStructure={false}
                                slots={{ textField: RoundedTextField }}
                                slotProps={{
                                    textField: { size: 'small', fullWidth: true, sx: { minWidth: '150px' }, onClick: (e) => e.target.closest('.MuiFormControl-root').querySelector('button')?.click() },
                                    actionBar: { actions: ['clear', 'today', 'cancel', 'accept'] },
                                    popper: { sx: { mt: 1, '& .MuiPaper-root': { borderRadius: '16px', boxShadow: 'none' } } },
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
                                        popper: { sx: { mt: 1, '& .MuiPaper-root': { borderRadius: '16px', boxShadow: 'none' } } },
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
                                        popper: { sx: { mt: 1, '& .MuiPaper-root': { borderRadius: '16px', boxShadow: 'none' } } },
                                    }}
                                />
                            </Grid>
                        </>
                    )
                ) : null}

                {showRoomType && roomTypes ? (
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
                                                const type = roomTypes.find((roomType) => roomType.id == value);
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
                    </Grid>
                ) : null}

                {showRoomType && rooms ? (
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
                                                const room = rooms.find((currentRoom) => currentRoom.id == value);
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
                                {rooms.map((room) => (
                                    <MenuItem key={room.id} value={String(room.id)}>
                                        {room.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                ) : null}

                {showVenues && venues ? (
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
                                                const venueObj = venues.find((venue) => venue.value === value || venue.id == value);
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
                ) : null}

                {showStatus ? (
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
                                            '&:hover': {
                                                backgroundColor: '#063455 !important',
                                                color: '#fff !important',
                                            },
                                        },
                                    },
                                }}
                            >
                                {['confirmed', 'completed', 'cancelled', 'paid', 'unpaid'].map((status) => (
                                    <MenuItem key={status} value={status}>
                                        {status.replace('_', ' ')}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                ) : null}

            </Grid>
    );

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            {embedded ? (
                <FilterToolbar
                    compact={false}
                    title="Filters"
                    subtitle="Set booking criteria and click Apply."
                    lowChrome
                    onApply={handleApply}
                    showApply={false}
                    onReset={handleReset}
                    actions={
                        <Button
                            variant="contained"
                            startIcon={<Search />}
                            onClick={handleApply}
                            sx={{
                                borderRadius: '999px',
                                backgroundColor: '#063455',
                                textTransform: 'none',
                                px: 2.25,
                                py: 0.85,
                                '&:hover': { backgroundColor: '#052a42' },
                            }}
                        >
                            Apply now
                        </Button>
                    }
                >
                    {fields}
                </FilterToolbar>
            ) : (
                <Paper elevation={0} sx={defaultShellSx}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: { xs: 'flex-start', md: 'center' }, mb: 2, flexDirection: { xs: 'column', md: 'row' } }}>
                        <Box>
                            <Typography sx={{ color: '#0f172a', fontSize: '1rem', fontWeight: 700 }}>Live Filters</Typography>
                            <Typography sx={{ color: '#64748b', fontSize: '0.875rem' }}>Results refresh automatically while you refine booking, member, and date criteria.</Typography>
                        </Box>
                        <Chip label="Live" size="small" sx={{ alignSelf: { xs: 'flex-start', md: 'center' }, backgroundColor: 'rgba(6,52,85,0.08)', color: '#063455', fontWeight: 700 }} />
                    </Box>
                    {fields}
                    <Box sx={{ display: 'flex', gap: 1.5, justifyContent: { xs: 'stretch', md: 'flex-end' }, flexWrap: 'wrap', mt: 2 }}>
                        <Button variant="outlined" onClick={handleReset} sx={{ borderRadius: '16px', textTransform: 'none', color: '#063455', border: '1px solid #063455', paddingLeft: 4, paddingRight: 4 }}>
                            Reset
                        </Button>
                        <Button variant="contained" startIcon={<Search />} onClick={handleApply} sx={{ borderRadius: '16px', backgroundColor: '#063455', textTransform: 'none', paddingLeft: 4, paddingRight: 4 }}>
                            Apply now
                        </Button>
                    </Box>
                </Paper>
            )}
        </LocalizationProvider>
    );
}
