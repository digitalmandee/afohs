'use client';

import UserAutocomplete from '@/components/UserAutocomplete';
import GuestCreateModal from '@/components/GuestCreateModal';
import { useOrderStore } from '@/stores/useOrderStore';
import { router } from '@inertiajs/react';
import { routeNameForContext } from '@/lib/utils';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import SearchIcon from '@mui/icons-material/Search';
import { Autocomplete, Box, Button, CircularProgress, FormControl, FormControlLabel, Grid, IconButton, InputAdornment, InputBase, InputLabel, MenuItem, Paper, Radio, RadioGroup, Select, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import axios from 'axios';
import { enqueueSnackbar } from 'notistack';
import { useCallback, useEffect, useState } from 'react';

const DineDialog = ({ guestTypes, floorTables, allrestaurants, selectedRestaurant, onRestaurantChange }) => {
    const { orderDetails, handleOrderDetailChange } = useOrderStore();

    const [filterOption, setFilterOption] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [waiters, setWaiters] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [showGuestModal, setShowGuestModal] = useState(false);

    const handleGuestCreated = (newGuest) => {
        const formattedGuest = {
            ...newGuest,
            label: `${newGuest.name} (Guest - ${newGuest.customer_no})`,
            booking_type: 'guest',
        };

        handleOrderDetailChange('member_type', `guest-${newGuest.guest_type_id}`);
        handleOrderDetailChange('member', formattedGuest);
        setShowGuestModal(false);
    };

    const handleAutocompleteChange = (event, value, field) => {
        handleOrderDetailChange(field, value);
        // setErrors({ ...errors, [field]: '' }); // Clear error on change
    };

    const handleMembershipType = (value) => {
        handleOrderDetailChange('membership_type', value);
        handleOrderDetailChange('member', {});
    };
    const handleMemberType = (value) => {
        handleOrderDetailChange('member_type', value);
        handleOrderDetailChange('member', {});
    };

    const handleMemberSelection = (newValue) => {
        if (!newValue) {
            handleOrderDetailChange('member', {});
            return;
        }

        if (newValue.booking_type !== 'member') {
            handleOrderDetailChange('member', newValue);
            return;
        }

        const status = String(newValue.status || '')
            .trim()
            .toLowerCase()
            .replace(/\s+/g, '_');
        const reason = newValue.status_reason || newValue.reason || '';

        if (status === 'expired') {
            enqueueSnackbar(`The membership has EXPIRED!${reason ? ` Reason: ${reason}` : ''}`, { variant: 'warning' });
            handleOrderDetailChange('member', newValue);
            return;
        }

        const blocked = new Set(['absent', 'suspended', 'terminated', 'not_assign', 'not_assigned', 'cancelled', 'inactive', 'in_suspension_process']);
        if (blocked.has(status)) {
            enqueueSnackbar(`Please consult Accounts Manager in order to continue with this Order.${reason ? ` Reason: ${reason}` : ''}`, { variant: 'error' });
            handleOrderDetailChange('member', {});
            return;
        }

        handleOrderDetailChange('member', newValue);
    };

    const handleFilterOptionChange = (event, newFilterOption) => {
        if (newFilterOption !== null) {
            setFilterOption(newFilterOption);
        }
    };

    useEffect(() => {
        axios.get(route(routeNameForContext('waiters.all'))).then((res) => setWaiters(res.data.waiters));
    }, ['']);

    const allTables = floorTables.flatMap((floor) =>
        (floor.tables || []).map((table) => ({
            ...table,
            floor_name: floor.name,
        })),
    );

    const filteredTables = allTables
        .filter((table) => {
            if (filterOption === 'available' && !table.is_available) return false;
            const keyword = searchTerm.toLowerCase();
            return table.table_no.toLowerCase().includes(keyword) || String(table.capacity).includes(keyword);
        });

    const isDisabled = !orderDetails.member || Object.keys(orderDetails.member).length === 0 || !orderDetails.waiter || typeof orderDetails.waiter !== 'object' || !orderDetails.waiter.id || !orderDetails.table;

    const goToMenu = useCallback(() => {
        router.visit(
            route(routeNameForContext('order.menu'), {
                restaurant_id: selectedRestaurant || undefined,
                table_id: orderDetails.table.id,
                member_id: orderDetails.member.id,
                member_type: orderDetails.member_type,
                waiter_id: orderDetails.waiter.id,
                person_count: orderDetails.person_count,
                floor_id: orderDetails.table?.floor_id ?? orderDetails.floor,
                order_type: 'dineIn',
            }),
        );
    }, [orderDetails.floor, orderDetails.member, orderDetails.member_type, orderDetails.person_count, orderDetails.table, orderDetails.waiter, selectedRestaurant]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'F10' && !isDisabled) {
                e.preventDefault();
                goToMenu();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isDisabled, goToMenu]);

    return (
        <>
            <Box>
            <Box sx={{ px: 2, mb: 2 }}>
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: '',
                        bgcolor: '#F6F6F6',
                        px: 2,
                        py: 1.5,
                        borderRadius: 1,
                    }}
                >
                    <Typography sx={{ fontSize: '14px', color: '#7F7F7F' }}>Order ID</Typography>
                    <Typography
                        sx={{
                            fontWeight: 'bold',
                            fontSize: '14px',
                            color: '#063455',
                            marginLeft: 2,
                        }}
                    >
                        #{orderDetails.order_no}
                    </Typography>
                </Box>
            </Box>

            <Box sx={{ px: 2, mb: 2 }}>
                <FormControl component="fieldset">
                    <Grid item xs={12}>
                        <RadioGroup
                            row
                            value={orderDetails.member_type}
                            onChange={(e) => {
                                handleOrderDetailChange('member_type', e.target.value);
                                handleOrderDetailChange('member', {}); // Clear member on type change
                            }}
                            sx={{ gap: 1 }}
                        >
                            <FormControlLabel value="0" control={<Radio />} label="Member" sx={{ border: orderDetails.member_type == '0' ? '1px solid #A27B5C' : '1px solid #E3E3E3', borderRadius: 1, px: 1, m: 0, bgcolor: orderDetails.member_type == '0' ? '#FCF7EF' : 'transparent' }} />
                            <FormControlLabel value="2" control={<Radio />} label="Corporate Member" sx={{ border: orderDetails.member_type == '2' ? '1px solid #A27B5C' : '1px solid #E3E3E3', borderRadius: 1, px: 1, m: 0, bgcolor: orderDetails.member_type == '2' ? '#FCF7EF' : 'transparent' }} />
                            <FormControlLabel value="3" control={<Radio />} label="Employee" sx={{ border: orderDetails.member_type == '3' ? '1px solid #A27B5C' : '1px solid #E3E3E3', borderRadius: 1, px: 1, m: 0, bgcolor: orderDetails.member_type == '3' ? '#FCF7EF' : 'transparent' }} />
                            {guestTypes.map((type) => (
                                <FormControlLabel
                                    key={type.id}
                                    value={`guest-${type.id}`}
                                    control={<Radio />}
                                    label={type.name}
                                    sx={{
                                        border: orderDetails.member_type == `guest-${type.id}` ? '1px solid #A27B5C' : '1px solid #E3E3E3',
                                        borderRadius: 1,
                                        px: 1,
                                        m: 0,
                                        bgcolor: orderDetails.member_type == `guest-${type.id}` ? '#FCF7EF' : 'transparent',
                                    }}
                                />
                            ))}
                        </RadioGroup>
                    </Grid>
                </FormControl>
            </Box>

            {/* Customer Information */}
            <Grid container spacing={2} sx={{ px: 2, mb: 2 }}>
                <Grid item xs={12}>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                        Customer Name
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                        <Box sx={{ flexGrow: 1 }}>
                            <UserAutocomplete routeUri={route(routeNameForContext('api.users.global-search'))} memberType={orderDetails.member_type} value={orderDetails.member && orderDetails.member.id ? orderDetails.member : null} onChange={(newValue) => handleMemberSelection(newValue)} label="Member / Guest Name" placeholder="Search by Name, ID, or CNIC..." />
                        </Box>
                        <Button variant="contained" onClick={() => setShowGuestModal(true)} sx={{ backgroundColor: '#063455', color: '#fff', height: '40px' }}>
                            + Add
                        </Button>
                    </Box>
                </Grid>
                <Grid item xs={4}>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                        Customer Qty
                    </Typography>
                    <Box sx={{ display: 'flex' }}>
                        <TextField size="small" value={orderDetails.person_count} onChange={(e) => handleOrderDetailChange('person_count', e.target.value)} min={1} type="number" sx={{ width: '60%' }} />
                        <Button
                            variant="outlined"
                            sx={{
                                ml: 1,
                                textTransform: 'none',
                                color: '#666',
                                borderColor: '#ddd',
                            }}
                        >
                            Person
                        </Button>
                    </Box>
                </Grid>
            </Grid>

            {/* Waiters */}
            <Box sx={{ px: 2, mb: 2 }}>
                <Autocomplete
                    fullWidth
                    size="small"
                    options={waiters}
                    value={orderDetails.waiter}
                    getOptionLabel={(option) => option?.name || ''}
                    onChange={(event, value) => handleAutocompleteChange(event, value, 'waiter')}
                    loading={searchLoading}
                    renderInput={(params) => <TextField {...params} fullWidth sx={{ p: 0 }} placeholder="Select Waiter" variant="outlined" />}
                    filterOptions={(options, state) => options.filter((option) => `${option.name} ${option.email} ${option.employee_id}`.toLowerCase().includes(state.inputValue.toLowerCase()))}
                    renderOption={(props, option) => {
                        const getStatusChipStyles = (status) => {
                            const s = (status || '').toLowerCase();
                            if (s === 'active') return { backgroundColor: '#e8f5e9', color: '#2e7d32' };
                            if (s === 'suspended' || s === 'inactive') return { backgroundColor: '#fff3e0', color: '#ef6c00' };
                            return { backgroundColor: '#ffebee', color: '#c62828' };
                        };
                        return (
                            <li {...props} key={option.id}>
                                <Box sx={{ width: '100%' }}>
                                    <Box display="flex" justifyContent="space-between" alignItems="center">
                                        <Typography variant="body2" fontWeight="bold">
                                            {option.employee_id}
                                        </Typography>
                                        {option.status && (
                                            <Box
                                                component="span"
                                                sx={{
                                                    height: '20px',
                                                    fontSize: '10px',
                                                    px: 1,
                                                    borderRadius: '10px',
                                                    ...getStatusChipStyles(option.status),
                                                    textTransform: 'capitalize',
                                                    ml: 1,
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                }}
                                            >
                                                {option.status}
                                            </Box>
                                        )}
                                    </Box>
                                    <Typography variant="caption" color="text.secondary">
                                        {option.name}
                                    </Typography>
                                    {(option.department_name || option.subdepartment_name || option.company) && (
                                        <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '10px' }}>
                                            {[option.department_name, option.subdepartment_name, option.company].filter(Boolean).join(' • ')}
                                        </Typography>
                                    )}
                                </Box>
                            </li>
                        );
                    }}
                />
            </Box>

            {Array.isArray(allrestaurants) && allrestaurants.length > 1 && (
                <Box sx={{ px: 2, mb: 2 }}>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                        Restaurant
                    </Typography>
                    <FormControl fullWidth size="small">
                        <InputLabel id="restaurant-label">Restaurant</InputLabel>
                        <Select
                            labelId="restaurant-label"
                            value={selectedRestaurant || ''}
                            label="Restaurant"
                            onChange={(e) => onRestaurantChange?.(e.target.value)}
                        >
                            {allrestaurants.map((item) => (
                                <MenuItem value={item.id} key={item.id}>
                                    {item.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>
            )}

            {/* Search and Filter */}
            <Box sx={{ px: 2, mb: 2, display: 'flex' }}>
                <Paper
                    component="form"
                    sx={{
                        p: '2px 4px',
                        display: 'flex',
                        alignItems: 'center',
                        flex: 1,
                        border: '1px solid #ddd',
                        boxShadow: 'none',
                    }}
                >
                    <InputBase sx={{ ml: 1, flex: 1 }} placeholder="Search" inputProps={{ 'aria-label': 'search tables' }} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    <IconButton type="button" sx={{ p: '10px' }} aria-label="search">
                        <SearchIcon />
                    </IconButton>
                </Paper>
                <ToggleButtonGroup value={filterOption} exclusive onChange={handleFilterOptionChange} aria-label="filter option" size="small" sx={{ ml: 1 }}>
                    <ToggleButton
                        value="all"
                        aria-label="all"
                        sx={{
                            textTransform: 'none',
                            '&.Mui-selected': {
                                backgroundColor: '#063455',
                                color: 'white',
                                '&:hover': {
                                    backgroundColor: '#063455',
                                },
                            },
                        }}
                    >
                        All
                    </ToggleButton>
                    <ToggleButton
                        value="available"
                        aria-label="available"
                        sx={{
                            textTransform: 'none',
                            '&.Mui-selected': {
                                backgroundColor: '#063455',
                                color: 'white',
                                '&:hover': {
                                    backgroundColor: '#063455',
                                },
                            },
                        }}
                    >
                        Available
                    </ToggleButton>
                </ToggleButtonGroup>
            </Box>

            {/* Table Selection */}
            <Box sx={{ px: 2, mb: 2 }}>
                <RadioGroup
                    value={orderDetails.table ? JSON.stringify(orderDetails.table) : orderDetails.table}
                    onChange={(e) => {
                        console.log(e.target.value);
                        handleOrderDetailChange('table', JSON.parse(e.target.value));
                    }}
                >
                    <Grid container spacing={1}>
                        {filteredTables.length > 0 &&
                            filteredTables.map((table) => (
                                <Grid item xs={4} sm={3} md={2} key={table.id}>
                                    <Paper
                                        elevation={0}
                                        sx={{
                                            p: 1,
                                            bgcolor: table.id === orderDetails.table?.id ? '#FCF7EF' : table.is_available ? 'white' : '#f5f5f5',
                                            border: table.id === orderDetails.table?.id ? '1px solid #A27B5C' : '1px solid #e0e0e0',
                                            borderRadius: 1,
                                            opacity: table.is_available ? 1 : 0.7,
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                            }}
                                        >
                                            <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                                                {table.table_no}
                                            </Typography>
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                }}
                                            >
                                                {table.is_available ? (
                                                    <FormControlLabel
                                                        value={JSON.stringify(table)}
                                                        control={<Radio size="small" />}
                                                        label=""
                                                        sx={{
                                                            m: 0,
                                                            color: '#063455',
                                                        }}
                                                    />
                                                ) : (
                                                    <Typography variant="caption" sx={{ color: '#063455' }}>
                                                        {table.table_no.split('-')[0]} - Full
                                                    </Typography>
                                                )}
                                            </Box>
                                        </Box>
                                    </Paper>
                                </Grid>
                            ))}
                    </Grid>
                </RadioGroup>
            </Box>

            {/* Footer */}
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    p: 2,
                    borderTop: '1px solid #e0e0e0',
                }}
            >
                <Button
                    sx={{
                        color: '#666',
                        textTransform: 'none',
                        mr: 1,
                    }}
                >
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    endIcon={<ArrowForwardIcon />}
                    sx={{
                        bgcolor: '#0c3b5c',
                        '&:hover': {
                            bgcolor: '#072a42',
                        },
                        textTransform: 'none',
                    }}
                    disabled={isDisabled}
                    onClick={goToMenu}
                >
                    Choose Menu
                </Button>
            </Box>
            </Box>

            <GuestCreateModal open={showGuestModal} onClose={() => setShowGuestModal(false)} onSuccess={handleGuestCreated} guestTypes={guestTypes} storeRouteName={routeNameForContext('customers.store')} memberSearchRouteName={routeNameForContext('api.users.global-search')} memberSearchParams={{ type: '0' }} />
        </>
    );
};
DineDialog.layout = (page) => page;
export default DineDialog;
