'use client';

import UserAutocomplete from '@/components/UserAutocomplete';
import GuestCreateModal from '@/components/GuestCreateModal';
import { useOrderStore } from '@/stores/useOrderStore';
import { router } from '@inertiajs/react';
import { routeNameForContext } from '@/lib/utils';
import SearchIcon from '@mui/icons-material/Search';
import {
    Autocomplete,
    Box,
    FormControl,
    Grid,
    IconButton,
    InputAdornment,
    InputBase,
    InputLabel,
    MenuItem,
    Paper,
    Radio,
    Select,
    TableCell,
    TableRow,
    TextField,
    Typography,
} from '@mui/material';
import axios from 'axios';
import { enqueueSnackbar } from 'notistack';
import { useCallback, useEffect, useState } from 'react';
import { OrderActionFooter, OrderMemberTypeSelector, OrderMetaStrip, OrderSection, OrderSurface } from './Shared';

const DineDialog = ({ guestTypes, floorTables, allrestaurants, selectedRestaurant, onRestaurantChange }) => {
    const { orderDetails, handleOrderDetailChange } = useOrderStore();
    const [filterOption, setFilterOption] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [waiters, setWaiters] = useState([]);
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

    useEffect(() => {
        axios.get(route(routeNameForContext('waiters.all'))).then((response) => setWaiters(response.data.waiters));
    }, []);

    const allTables = floorTables.flatMap((floor) =>
        (floor.tables || []).map((table) => ({
            ...table,
            floor_name: floor.name,
        })),
    );

    const filteredTables = allTables.filter((table) => {
        if (filterOption === 'available' && !table.is_available) return false;
        const keyword = searchTerm.toLowerCase();
        return table.table_no.toLowerCase().includes(keyword) || String(table.capacity).includes(keyword);
    });

    const isDisabled =
        !orderDetails.member ||
        Object.keys(orderDetails.member).length === 0 ||
        !orderDetails.waiter ||
        typeof orderDetails.waiter !== 'object' ||
        !orderDetails.waiter.id ||
        !orderDetails.table;

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
        const handleKeyDown = (event) => {
            if (event.key === 'F10' && !isDisabled) {
                event.preventDefault();
                goToMenu();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [goToMenu, isDisabled]);

    return (
        <>
            <Box sx={{ py: 0.6 }}>
                <Box sx={{ px: { xs: 1.5, md: 1.8 }, pb: 0.9 }}>
                    <OrderMetaStrip
                        value={`#${orderDetails.order_no}`}
                        secondaryLabel="Mode"
                        secondaryValue="Dine In"
                    />
                </Box>

                <OrderSection title="Guest & Service Setup" subtitle="Select the customer, service owner, and dining details before opening the menu.">
                    <Grid container spacing={1.25}>
                        <Grid item xs={12}>
                            <OrderMemberTypeSelector
                                guestTypes={guestTypes}
                                value={orderDetails.member_type}
                                onChange={(value) => {
                                    handleOrderDetailChange('member_type', value);
                                    handleOrderDetailChange('member', {});
                                }}
                            />
                        </Grid>

                        <Grid item xs={12} lg={7}>
                            <Typography variant="body2" sx={{ mb: 0.45, fontWeight: 700, color: '#243b53', fontSize: '0.82rem' }}>
                                Customer Name
                            </Typography>
                            <Box display="flex" alignItems="center" gap={0.8}>
                                <Box sx={{ flexGrow: 1 }}>
                                    <UserAutocomplete
                                        routeUri={route(routeNameForContext('api.users.global-search'))}
                                        memberType={orderDetails.member_type}
                                        value={orderDetails.member && orderDetails.member.id ? orderDetails.member : null}
                                        onChange={(newValue) => handleMemberSelection(newValue)}
                                        label="Member / Guest Name"
                                        placeholder="Search by Name, ID, or CNIC..."
                                    />
                                </Box>
                                <Box sx={{ minWidth: { xs: 82, sm: 94 } }}>
                                    <Box
                                        component="button"
                                        type="button"
                                        onClick={() => setShowGuestModal(true)}
                                        style={{
                                            width: '100%',
                                            height: 38,
                                            borderRadius: 10,
                                            border: 'none',
                                            background: '#063455',
                                            color: '#fff',
                                            fontWeight: 800,
                                            cursor: 'pointer',
                                        }}
                                    >
                                        + Add
                                    </Box>
                                </Box>
                            </Box>
                        </Grid>

                        <Grid item xs={12} sm={4} lg={2}>
                            <Typography variant="body2" sx={{ mb: 0.45, fontWeight: 700, color: '#243b53', fontSize: '0.82rem' }}>
                                Customer Qty
                            </Typography>
                            <TextField
                                size="small"
                                fullWidth
                                type="number"
                                value={orderDetails.person_count}
                                onChange={(event) => handleOrderDetailChange('person_count', event.target.value)}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <Typography sx={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748b' }}>
                                                Person
                                            </Typography>
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>

                        <Grid item xs={12} sm={8} lg={3}>
                            <Typography variant="body2" sx={{ mb: 0.45, fontWeight: 700, color: '#243b53', fontSize: '0.82rem' }}>
                                Select Waiter
                            </Typography>
                            <Autocomplete
                                fullWidth
                                size="small"
                                options={waiters}
                                value={orderDetails.waiter}
                                getOptionLabel={(option) => option?.name || ''}
                                onChange={(event, value) => handleAutocompleteChange(event, value, 'waiter')}
                                renderInput={(params) => <TextField {...params} fullWidth placeholder="Select Waiter" variant="outlined" />}
                                filterOptions={(options, state) =>
                                    options.filter((option) =>
                                        `${option.name} ${option.email} ${option.employee_id}`.toLowerCase().includes(state.inputValue.toLowerCase()),
                                    )
                                }
                                renderOption={(props, option) => {
                                    const getStatusChipStyles = (status) => {
                                        const normalized = (status || '').toLowerCase();
                                        if (normalized === 'active') return { backgroundColor: '#e8f5e9', color: '#2e7d32' };
                                        if (normalized === 'suspended' || normalized === 'inactive') return { backgroundColor: '#fff3e0', color: '#ef6c00' };
                                        return { backgroundColor: '#ffebee', color: '#c62828' };
                                    };
                                    return (
                                        <li {...props} key={option.id}>
                                            <Box sx={{ width: '100%' }}>
                                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                                    <Typography variant="body2" fontWeight={700}>
                                                        {option.employee_id}
                                                    </Typography>
                                                    {option.status ? (
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
                                                    ) : null}
                                                </Box>
                                                <Typography variant="caption" color="text.secondary">
                                                    {option.name}
                                                </Typography>
                                            </Box>
                                        </li>
                                    );
                                }}
                            />
                        </Grid>

                        {Array.isArray(allrestaurants) && allrestaurants.length > 1 ? (
                            <Grid item xs={12} md={4}>
                                <Typography variant="body2" sx={{ mb: 0.45, fontWeight: 700, color: '#243b53', fontSize: '0.82rem' }}>
                                    Restaurant
                                </Typography>
                                <FormControl fullWidth size="small">
                                    <InputLabel id="restaurant-label">Restaurant</InputLabel>
                                    <Select
                                        labelId="restaurant-label"
                                        value={selectedRestaurant || ''}
                                        label="Restaurant"
                                        onChange={(event) => onRestaurantChange?.(event.target.value)}
                                    >
                                        {allrestaurants.map((item) => (
                                            <MenuItem value={item.id} key={item.id}>
                                                {item.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                        ) : null}
                    </Grid>
                </OrderSection>

                <OrderSection title="Table Selection" subtitle="Search and filter tables, then pick an available table to start the order.">
                    <OrderSurface sx={{ p: 1, borderRadius: '12px', boxShadow: 'none', bgcolor: '#f8fafc' }}>
                        <Grid container spacing={1} alignItems="center">
                            <Grid item xs={12} md={8}>
                                <Paper
                                    component="form"
                                    sx={{
                                        p: '1px 6px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        border: '1px solid #d9e2ec',
                                        boxShadow: 'none',
                                        borderRadius: '10px',
                                    }}
                                >
                                    <InputBase
                                        sx={{ ml: 1, flex: 1 }}
                                        placeholder="Search table by number or capacity"
                                        inputProps={{ 'aria-label': 'search tables' }}
                                        value={searchTerm}
                                        onChange={(event) => setSearchTerm(event.target.value)}
                                    />
                                    <IconButton type="button" sx={{ p: '10px' }} aria-label="search">
                                        <SearchIcon />
                                    </IconButton>
                                </Paper>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Box
                                    sx={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                                        gap: 1,
                                    }}
                                >
                                    {['all', 'available'].map((option) => {
                                        const active = filterOption === option;
                                        return (
                                            <Box
                                                key={option}
                                                component="button"
                                            type="button"
                                            onClick={() => setFilterOption(option)}
                                            style={{
                                                    height: 34,
                                                    borderRadius: '10px',
                                                    border: active ? '1px solid #063455' : '1px solid #d9e2ec',
                                                    background: active ? '#063455' : '#fff',
                                                    color: active ? '#fff' : '#52606d',
                                                    fontWeight: 700,
                                                    fontSize: '0.8rem',
                                                    textTransform: 'capitalize',
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                {option}
                                            </Box>
                                        );
                                    })}
                                </Box>
                            </Grid>
                        </Grid>
                    </OrderSurface>

                    <Box sx={{ mt: 1 }}>
                        <Grid container spacing={1}>
                            {filteredTables.map((table) => {
                                const active = table.id === orderDetails.table?.id;
                                return (
                                    <Grid item xs={6} sm={4} md={4} xl={3} key={table.id}>
                                        <Paper
                                            elevation={0}
                                            sx={{
                                                p: 1,
                                                minHeight: 72,
                                                borderRadius: '12px',
                                                bgcolor: active ? '#FCF7EF' : table.is_available ? '#fff' : '#f8fafc',
                                                border: active ? '1.5px solid #A27B5C' : '1px solid #d9e2ec',
                                                opacity: table.is_available ? 1 : 0.72,
                                            }}
                                        >
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                                                <Box>
                                                    <Typography variant="body2" sx={{ fontWeight: 800, color: '#102a43', fontSize: '0.86rem' }}>
                                                        {table.table_no}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>
                                                        {table.floor_name || 'Dining Floor'}
                                                    </Typography>
                                                </Box>
                                                {table.is_available ? (
                                                    <Radio
                                                        checked={active}
                                                        onChange={() => handleOrderDetailChange('table', table)}
                                                        size="small"
                                                    />
                                                ) : (
                                                    <Typography variant="caption" sx={{ color: '#9aa5b1', fontWeight: 700, fontSize: '0.68rem' }}>
                                                        Full
                                                    </Typography>
                                                )}
                                            </Box>
                                            <Typography sx={{ mt: 0.95, fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>
                                                Capacity {table.capacity}
                                            </Typography>
                                        </Paper>
                                    </Grid>
                                );
                            })}
                        </Grid>
                    </Box>
                </OrderSection>

                <OrderActionFooter primaryDisabled={isDisabled} onPrimary={goToMenu} />
            </Box>

            <GuestCreateModal
                open={showGuestModal}
                onClose={() => setShowGuestModal(false)}
                onSuccess={handleGuestCreated}
                guestTypes={guestTypes}
                storeRouteName={routeNameForContext('customers.store')}
                memberSearchRouteName={routeNameForContext('api.users.global-search')}
                memberSearchParams={{ type: '0' }}
            />
        </>
    );
};

DineDialog.layout = (page) => page;
export default DineDialog;
