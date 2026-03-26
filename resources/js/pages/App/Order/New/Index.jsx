import FoodIcon from '@/components/App/Icons/Food';
import ShopIcon from '@/components/App/Icons/ShoppingBag';
import SofaIcon from '@/components/App/Icons/Sofa';
import POSLayout from '@/components/POSLayout';
import { useOrderStore } from '@/stores/useOrderStore';
import { Box, Button, CircularProgress, FormControl, Grid, InputLabel, MenuItem, Select, Stack, TextField, Typography, Autocomplete } from '@mui/material';
import { router } from '@inertiajs/react';
import dayjs from 'dayjs';
import { useEffect, useMemo, useRef, useState } from 'react';
import DineDialog from './Dine';
import ReservationDialog from './Reservation';
import TakeAwayDialog from './Takeaway';
import RoomDialog from './RoomDialog';
import axios from 'axios';
import { CiDeliveryTruck } from 'react-icons/ci';
import CakeIcon from '@mui/icons-material/Cake';
import BedroomParentIcon from '@mui/icons-material/BedroomParent';
import ShiftGate from '@/components/Pos/ShiftGate';
import { routeNameForContext } from '@/lib/utils';
import { OrderSurface } from './Shared';

const orderTypeCardSx = (active) => ({
    minHeight: 74,
    borderRadius: '12px',
    border: active ? '1.5px solid rgba(12, 103, 167, 0.45)' : '1px solid rgba(203, 213, 225, 0.92)',
    background: active ? 'rgba(176,222,255,0.4)' : '#fff',
    boxShadow: 'none',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 0.45,
    px: 0.7,
    py: 0.75,
    color: active ? '#0c3b5c' : '#52606d',
    textTransform: 'none',
});

export default function NewOrder({ orderNo, guestTypes, allrestaurants, activeTenantId, activePosLocation }) {
    const {
        orderDetails,
        weeks,
        initWeeks,
        selectedWeek,
        monthYear,
        setInitialOrder,
        handleOrderTypeChange,
        handleWeekChange,
        resetOrderDetails,
        handleOrderDetailChange,
    } = useOrderStore();

    const [floorTables, setFloorTables] = useState([]);
    const [roomTypes, setRoomTypes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [shiftInfo, setShiftInfo] = useState(null);
    const [selectedRestaurant, setSelectedRestaurant] = useState(() => {
        const query = new URLSearchParams(window.location.search);
        const restaurantIdFromUrl = query.get('restaurant_id');

        if (restaurantIdFromUrl) return restaurantIdFromUrl;
        if (activeTenantId) return activeTenantId;
        if (Array.isArray(allrestaurants) && allrestaurants.length > 0) return allrestaurants[0].id;

        return '';
    });
    const [tablesReloadKey, setTablesReloadKey] = useState(0);
    const prevRestaurantRef = useRef(null);
    const prevOrderTypeRef = useRef(null);

    const [bookingSearchTerm, setBookingSearchTerm] = useState('');
    const [bookingSearchResult, setBookingSearchResult] = useState(null);
    const [bookingOptions, setBookingOptions] = useState([]);
    const [bookingSearchLoading, setBookingSearchLoading] = useState(false);

    useEffect(() => {
        if (!selectedRestaurant && Array.isArray(allrestaurants) && allrestaurants.length > 0) {
            setSelectedRestaurant(activeTenantId || allrestaurants[0].id);
        }
    }, [activeTenantId, allrestaurants, selectedRestaurant]);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (bookingSearchTerm.trim()) {
                searchBookings(bookingSearchTerm);
            } else {
                setBookingOptions([]);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [bookingSearchTerm]);

    const searchBookings = async (query) => {
        setBookingSearchLoading(true);
        try {
            const response = await axios.get(route(routeNameForContext('api.cake-bookings.search')), {
                params: { query },
            });
            setBookingOptions(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error('Booking search error:', error);
            setBookingOptions([]);
        } finally {
            setBookingSearchLoading(false);
        }
    };

    const handleLoadBooking = () => {
        if (!bookingSearchResult) return;

        router.visit(route(routeNameForContext('order.menu')), {
            method: 'get',
            data: {
                restaurant_id: selectedRestaurant || undefined,
                cake_booking_id: bookingSearchResult.id,
                order_type: 'takeaway',
            },
        });
    };

    useEffect(() => {
        const fetchShiftInfo = async () => {
            try {
                const response = await axios.get(route(routeNameForContext('pos-shifts.status')));
                if (response.data.has_active_shift) {
                    setShiftInfo(response.data.shift);
                }
            } catch (error) {
                console.error('Failed to fetch shift info:', error);
            }
        };
        fetchShiftInfo();
    }, []);

    useEffect(() => {
        initWeeks();
    }, [monthYear]);

    useEffect(() => {
        const query = new URLSearchParams(window.location.search);
        const table = query.get('table');
        const floor = query.get('floor');
        const type = query.get('type');
        const preserve = query.get('preserve');

        if (!preserve) {
            resetOrderDetails();

            setInitialOrder({
                orderNo,
                guestTypes,
                floorTables: floor ? [{ id: floor }] : floorTables,
                table: table || null,
                time: dayjs().format('HH:mm'),
            });

            if (type) {
                handleOrderTypeChange(type);
            }
        }
    }, []);

    const handleRestaurantChange = (restaurantId) => {
        setSelectedRestaurant(restaurantId);
    };

    const loadFloorTables = async (restaurantId = selectedRestaurant, options = {}) => {
        const resetSelection = options?.resetSelection === true;

        try {
            const response = await axios.get(route(routeNameForContext('api.floors-with-tables')), {
                params: { restaurant_id: restaurantId },
            });
            setFloorTables(response.data);
            if (resetSelection) {
                handleOrderDetailChange('floor', '');
                handleOrderDetailChange('table', '');
            }
        } catch (error) {
            console.error(error);
        }
    };

    const loadRooms = async (params = {}) => {
        if (params?.clear) {
            setRoomTypes([]);
            return;
        }
        setLoading(true);
        try {
            const response = await axios.get(route(routeNameForContext('rooms.order')), {
                params: { ...params, restaurant_id: selectedRestaurant || undefined },
            });
            setRoomTypes(response.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (orderDetails.order_type === 'room') {
            loadRooms({ clear: true });
        } else {
            setRoomTypes([]);
        }
    }, [orderDetails.order_type]);

    useEffect(() => {
        const isTableFlow = orderDetails.order_type === 'dineIn' || orderDetails.order_type === 'reservation';
        if (!isTableFlow) {
            prevOrderTypeRef.current = orderDetails.order_type;
            return;
        }

        if (!selectedRestaurant) return;

        const restaurantChanged = prevRestaurantRef.current !== null && String(prevRestaurantRef.current) !== String(selectedRestaurant);
        const orderTypeChanged = prevOrderTypeRef.current !== null && prevOrderTypeRef.current !== orderDetails.order_type;
        const shouldResetSelection = restaurantChanged || orderTypeChanged;

        if (shouldResetSelection) {
            setTablesReloadKey((key) => key + 1);
        }

        loadFloorTables(selectedRestaurant, { resetSelection: shouldResetSelection });

        prevRestaurantRef.current = selectedRestaurant;
        prevOrderTypeRef.current = orderDetails.order_type;
    }, [orderDetails.order_type, selectedRestaurant]);

    const orderTypeOptions = useMemo(() => ([
        { value: 'dineIn', label: 'Dine In', icon: <FoodIcon sx={{ color: orderDetails.order_type === 'dineIn' ? '#063455' : 'inherit' }} /> },
        { value: 'delivery', label: 'Delivery', icon: <CiDeliveryTruck style={{ width: 28, height: 28, color: orderDetails.order_type === 'delivery' ? '#063455' : 'currentColor' }} /> },
        { value: 'takeaway', label: 'Takeaway', icon: <ShopIcon sx={{ color: orderDetails.order_type === 'takeaway' ? '#063455' : 'inherit' }} /> },
        { value: 'reservation', label: 'Reservation', icon: <SofaIcon sx={{ color: orderDetails.order_type === 'reservation' ? '#063455' : 'inherit' }} /> },
        { value: 'room', label: 'Room', icon: <BedroomParentIcon sx={{ width: 24, height: 24, color: orderDetails.order_type === 'room' ? '#063455' : 'inherit' }} /> },
        { value: 'load_booking', label: 'Load Booking', icon: <CakeIcon sx={{ color: orderDetails.order_type === 'load_booking' ? '#063455' : 'inherit' }} /> },
    ]), [orderDetails.order_type]);

    const currentRestaurantName = allrestaurants?.find((restaurant) => String(restaurant.id) === String(selectedRestaurant))?.name || activePosLocation?.name || 'Restaurant not selected';

    const renderOrderFlow = () => {
        if (orderDetails.order_type === 'dineIn') {
            return (
                <DineDialog
                    guestTypes={guestTypes}
                    floorTables={floorTables}
                    allrestaurants={allrestaurants}
                    selectedRestaurant={selectedRestaurant}
                    onRestaurantChange={handleRestaurantChange}
                />
            );
        }

        if (orderDetails.order_type === 'takeaway' || orderDetails.order_type === 'delivery') {
            return <TakeAwayDialog guestTypes={guestTypes} selectedRestaurant={selectedRestaurant} />;
        }

        if (orderDetails.order_type === 'reservation') {
            return (
                <ReservationDialog
                    guestTypes={guestTypes}
                    floorTables={floorTables}
                    tablesReloadKey={tablesReloadKey}
                    allrestaurants={allrestaurants}
                    selectedRestaurant={selectedRestaurant}
                    onRestaurantChange={handleRestaurantChange}
                />
            );
        }

        if (orderDetails.order_type === 'room') {
            return (
                <RoomDialog
                    guestTypes={guestTypes}
                    roomTypes={roomTypes}
                    loading={loading}
                    selectedRestaurant={selectedRestaurant}
                    reloadRooms={loadRooms}
                />
            );
        }

        return (
            <Box sx={{ px: { xs: 2, md: 2.5 }, py: 2.2 }}>
                <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: '#102a43', mb: 1.5 }}>
                    Load Cake Booking
                </Typography>
                <Typography sx={{ fontSize: '0.88rem', color: '#64748b', mb: 2 }}>
                    Search an existing booking and bring it into POS as an order draft.
                </Typography>

                <Autocomplete
                    fullWidth
                    options={bookingOptions}
                    getOptionLabel={(option) => `Booking #${option.booking_number} - ${option.customer_name} (${option.customer_phone || 'No Phone'})`}
                    loading={bookingSearchLoading}
                    onInputChange={(event, newInputValue) => {
                        setBookingSearchTerm(newInputValue);
                    }}
                    onChange={(event, newValue) => {
                        setBookingSearchResult(newValue);
                    }}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Search Booking"
                            placeholder="Booking ID, customer name, or phone"
                            size="small"
                            InputProps={{
                                ...params.InputProps,
                                endAdornment: (
                                    <>
                                        {bookingSearchLoading ? <CircularProgress color="inherit" size={18} /> : null}
                                        {params.InputProps.endAdornment}
                                    </>
                                ),
                            }}
                        />
                    )}
                    renderOption={(props, option) => (
                        <li {...props} key={option.id}>
                            <Box>
                                <Typography variant="body2" fontWeight={700}>
                                    #{option.booking_number} - {option.customer_name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Phone: {option.customer_phone || 'N/A'} | Cake: {option.cake_type?.name || '-'}
                                </Typography>
                            </Box>
                        </li>
                    )}
                />

                {bookingSearchResult ? (
                    <OrderSurface sx={{ mt: 2, p: 2, borderRadius: '20px' }}>
                        <Typography sx={{ fontWeight: 800, color: '#102a43' }}>
                            Booking #{bookingSearchResult.booking_number}
                        </Typography>
                        <Stack spacing={0.45} sx={{ mt: 1 }}>
                            <Typography variant="body2">Customer: {bookingSearchResult.customer_name}</Typography>
                            <Typography variant="body2">Cake: {bookingSearchResult.cake_type?.name} ({bookingSearchResult.weight || '-'} lbs)</Typography>
                            <Typography variant="body2">Total: Rs {bookingSearchResult.total_price}</Typography>
                            <Typography variant="body2" color="primary.main">Advance: Rs {bookingSearchResult.advance_amount}</Typography>
                            <Typography variant="body2" color="error.main">Balance: Rs {bookingSearchResult.balance_amount}</Typography>
                        </Stack>

                        <Button variant="contained" fullWidth sx={{ mt: 2 }} onClick={handleLoadBooking}>
                            Load to Order
                        </Button>
                    </OrderSurface>
                ) : null}
            </Box>
        );
    };

    return (
        <ShiftGate>
            <Box
                sx={{
                    minHeight: '100vh',
                    background: 'linear-gradient(180deg, #f4f8fc 0%, #eef4fa 100%)',
                    px: { xs: 0.75, md: 1.5, xl: 2 },
                    py: { xs: 1, md: 1.5 },
                }}
            >
                <Box sx={{ width: '100%', maxWidth: 1480, mx: 'auto' }}>
                    <Grid container spacing={1.5}>
                        <Grid item xs={12}>
                            <OrderSurface sx={{ p: { xs: 1.4, md: 1.6 } }}>
                                <Grid container spacing={1.5} alignItems="center">
                                    <Grid item xs={12} md={4}>
                                        <Typography sx={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, mb: 0.2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                            Operational Date (Shift)
                                        </Typography>
                                        <Typography sx={{ fontSize: { xs: '1.3rem', md: '1.42rem' }, fontWeight: 800, color: '#063455', letterSpacing: '-0.03em' }}>
                                            {shiftInfo ? dayjs(shiftInfo.start_date).format('DD MMM YYYY') : dayjs().format('DD MMM YYYY')}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} md={4}>
                                        <Box>
                                            <Typography sx={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, mb: 0.2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                                Order Context
                                            </Typography>
                                            <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
                                                <ContextPill label="ID" value={`#${orderDetails.order_no || orderNo}`} />
                                                <ContextPill label="Mode" value={orderTypeOptions.find((option) => option.value === orderDetails.order_type)?.label || 'Dine In'} />
                                                <ContextPill label="Restaurant" value={currentRestaurantName} />
                                            </Stack>
                                        </Box>
                                    </Grid>
                                    <Grid item xs={12} md={4}>
                                        <Box sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                                            <Typography sx={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, mb: 0.2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                                POS Location
                                            </Typography>
                                            <Typography sx={{ fontSize: { xs: '1.08rem', md: '1.2rem' }, fontWeight: 800, color: '#063455', letterSpacing: '-0.02em' }}>
                                                {shiftInfo?.posLocation?.name || activePosLocation?.name || currentRestaurantName}
                                            </Typography>
                                        </Box>
                                    </Grid>
                                </Grid>
                            </OrderSurface>
                        </Grid>

                        <Grid item xs={12}>
                            <OrderSurface sx={{ overflow: 'hidden' }}>
                                <Box sx={{ px: { xs: 1.5, md: 1.8 }, pt: { xs: 1.25, md: 1.4 }, pb: 0.8 }}>
                                    <Typography sx={{ fontSize: '0.96rem', fontWeight: 800, color: '#102a43', mb: 0.25 }}>
                                        Start New Order
                                    </Typography>
                                    <Typography sx={{ fontSize: '0.8rem', color: '#64748b' }}>
                                        Choose the order type first, then complete the customer and service details below.
                                    </Typography>
                                </Box>

                                <Box
                                    sx={{
                                        px: { xs: 1.5, md: 1.8 },
                                        pb: 1.2,
                                        display: 'grid',
                                        gridTemplateColumns: {
                                            xs: 'repeat(2, minmax(0, 1fr))',
                                            md: 'repeat(3, minmax(0, 1fr))',
                                            lg: 'repeat(6, minmax(0, 1fr))',
                                        },
                                        gap: 0.8,
                                    }}
                                >
                                    {orderTypeOptions.map((option) => {
                                        const active = orderDetails.order_type === option.value;
                                        return (
                                            <Button
                                                key={option.value}
                                                onClick={() => handleOrderTypeChange(option.value)}
                                                sx={orderTypeCardSx(active)}
                                            >
                                                <Box sx={{ display: 'grid', placeItems: 'center', minHeight: 20 }}>
                                                    {option.icon}
                                                </Box>
                                                <Typography sx={{ fontSize: '0.82rem', fontWeight: active ? 800 : 700, textAlign: 'center', lineHeight: 1.15 }}>
                                                    {option.label}
                                                </Typography>
                                            </Button>
                                        );
                                    })}
                                </Box>

                                <Box sx={{ px: { xs: 1.5, md: 1.8 }, pb: 1 }}>
                                    <Grid container spacing={0.9}>
                                        {Array.isArray(allrestaurants) && allrestaurants.length > 1 && orderDetails.order_type !== 'dineIn' ? (
                                            <Grid item xs={12} md={orderDetails.order_type === 'reservation' ? 6 : 4}>
                                                <OrderSurface sx={{ p: 1.1, borderRadius: '12px', boxShadow: 'none', bgcolor: '#f8fafc' }}>
                                                    <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#7b8794', textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.55 }}>
                                                        Restaurant
                                                    </Typography>
                                                    <FormControl size="small" fullWidth>
                                                        <InputLabel id="restaurant-label">Restaurant</InputLabel>
                                                        <Select
                                                            labelId="restaurant-label"
                                                            value={selectedRestaurant || ''}
                                                            label="Restaurant"
                                                            onChange={(event) => handleRestaurantChange(event.target.value)}
                                                        >
                                                            {allrestaurants.map((item) => (
                                                                <MenuItem value={item.id} key={item.id}>
                                                                    {item.name}
                                                                </MenuItem>
                                                            ))}
                                                        </Select>
                                                    </FormControl>
                                                </OrderSurface>
                                            </Grid>
                                        ) : null}

                                        {orderDetails.order_type === 'reservation' ? (
                                            <Grid item xs={12} md={6}>
                                                <OrderSurface sx={{ p: 1.1, borderRadius: '12px', boxShadow: 'none', bgcolor: '#f8fafc' }}>
                                                    <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#7b8794', textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.55 }}>
                                                        Reservation Week
                                                    </Typography>
                                                    <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
                                                        {weeks.map((week) => (
                                                            <Box
                                                                key={week.id}
                                                                component="button"
                                                                type="button"
                                                                onClick={() => handleWeekChange(week.id)}
                                                                sx={{
                                                                    px: 1.1,
                                                                    py: 0.7,
                                                                    borderRadius: '10px',
                                                                    border: selectedWeek === week.id ? '1px solid rgba(6, 52, 85, 0.4)' : '1px solid rgba(226, 232, 240, 0.94)',
                                                                    bgcolor: selectedWeek === week.id ? 'rgba(176,222,255,0.45)' : '#fff',
                                                                    cursor: 'pointer',
                                                                    minWidth: 118,
                                                                    textAlign: 'left',
                                                                }}
                                                            >
                                                                <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#102a43' }}>
                                                                    {week.label}
                                                                </Typography>
                                                                <Typography sx={{ fontSize: '0.7rem', color: '#64748b' }}>
                                                                    {week.dateRange}
                                                                </Typography>
                                                            </Box>
                                                        ))}
                                                    </Stack>
                                                </OrderSurface>
                                            </Grid>
                                        ) : null}
                                    </Grid>
                                </Box>

                                <Box sx={{ borderTop: '1px solid rgba(226, 232, 240, 0.92)' }}>
                                    {renderOrderFlow()}
                                </Box>
                            </OrderSurface>
                        </Grid>
                    </Grid>
                </Box>
            </Box>
        </ShiftGate>
    );
}

function ContextPill({ label, value }) {
    return (
        <Box
            sx={{
                px: 1,
                py: 0.7,
                borderRadius: '10px',
                border: '1px solid rgba(226, 232, 240, 0.92)',
                bgcolor: '#f8fafc',
                minWidth: 110,
            }}
        >
            <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#7b8794', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {label}
            </Typography>
            <Typography sx={{ mt: 0.15, fontSize: '0.82rem', fontWeight: 700, color: '#102a43', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {value}
            </Typography>
        </Box>
    );
}

NewOrder.layout = (page) => <POSLayout>{page}</POSLayout>;
