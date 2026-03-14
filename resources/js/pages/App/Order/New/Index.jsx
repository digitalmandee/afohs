import FoodIcon from '@/components/App/Icons/Food';
import ShopIcon from '@/components/App/Icons/ShoppingBag';
import SofaIcon from '@/components/App/Icons/Sofa';
import POSLayout from "@/components/POSLayout";
import { useOrderStore } from '@/stores/useOrderStore';
import { Box, Button, List, ListItem, ListItemSecondaryAction, ListItemText, Paper, Radio, ToggleButton, ToggleButtonGroup, Typography, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Autocomplete, CircularProgress, FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import { router } from '@inertiajs/react';
import dayjs from 'dayjs';
import { useEffect, useRef, useState } from 'react';
import DineDialog from './Dine';
import ReservationDialog from './Reservation';
import TakeAwayDialog from './Takeaway';
import RoomDialog from './RoomDialog';
import axios from 'axios';
import { CiDeliveryTruck } from 'react-icons/ci';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import CakeIcon from '@mui/icons-material/Cake';
import ShiftGate from '@/components/Pos/ShiftGate';
import BedroomParentIcon from '@mui/icons-material/BedroomParent';
import { routeNameForContext } from '@/lib/utils';


const drawerWidthOpen = 240;
const drawerWidthClosed = 110;

const NewOrder = ({ orderNo, guestTypes, allrestaurants, activeTenantId, activePosLocation }) => {
    const { orderDetails, weeks, initWeeks, selectedWeek, monthYear, setInitialOrder, handleOrderTypeChange, handleWeekChange, resetOrderDetails, handleOrderDetailChange } = useOrderStore();

    const [open, setOpen] = useState(true);
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

    useEffect(() => {
        if (!selectedRestaurant && Array.isArray(allrestaurants) && allrestaurants.length > 0) {
            setSelectedRestaurant(activeTenantId || allrestaurants[0].id);
        }
    }, [activeTenantId, allrestaurants, selectedRestaurant]);

    // Booking Search State
    const [bookingSearchTerm, setBookingSearchTerm] = useState('');
    const [bookingSearchResult, setBookingSearchResult] = useState(null); // Selected booking
    const [bookingOptions, setBookingOptions] = useState([]);
    const [bookingSearchLoading, setBookingSearchLoading] = useState(false);

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
            if (Array.isArray(response.data)) {
                setBookingOptions(response.data);
            } else {
                setBookingOptions([]);
            }
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

    // Fetch Active Shift Info
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

    // get weeks in month
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
                table: table ? table : null,
                time: dayjs().format('HH:mm'),
            });

            // Auto-select order type from URL
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
            setTablesReloadKey((k) => k + 1);
        }

        loadFloorTables(selectedRestaurant, { resetSelection: shouldResetSelection });

        prevRestaurantRef.current = selectedRestaurant;
        prevOrderTypeRef.current = orderDetails.order_type;
    }, [orderDetails.order_type, selectedRestaurant]);

    return (
        <>
            <ShiftGate>
                {/* <SideNav open={open} setOpen={setOpen} /> */}
                <div
                    style={{
                        minHeight:'100vh',
                        backgroundColor: '#f5f5f5',
                        padding:'20px'
                    }}
                >
                    {Array.isArray(allrestaurants) &&
                        allrestaurants.length > 1 &&
                        orderDetails.order_type !== 'dineIn' &&
                        orderDetails.order_type !== 'reservation' && (
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                                <FormControl size="small" sx={{ minWidth: 260 }}>
                                    <InputLabel id="restaurant-label">Restaurant</InputLabel>
                                    <Select
                                        labelId="restaurant-label"
                                        value={selectedRestaurant || ''}
                                        label="Restaurant"
                                        onChange={(e) => handleRestaurantChange(e.target.value)}
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
                    {/* Active Shift Info */}
                    {shiftInfo && (
                        <Paper
                            elevation={0}
                            sx={{
                                p: 2,
                                mb: -3,
                                mt: 5,
                                mx: 'auto',
                                maxWidth: orderDetails.order_type === 'reservation' ? '1000px' : '732px',
                                border: '1px solid #E3E3E3',
                                bgcolor: '#fff',
                            }}
                        >
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box>
                                    <Typography variant="caption" color="text.secondary" display="block">
                                        Operational Date (Shift)
                                    </Typography>
                                    <Typography variant="h6" color="primary.main" fontWeight="bold">
                                        {dayjs(shiftInfo.start_date).format('DD MMM YYYY')}
                                    </Typography>
                                </Box>
                                <Box sx={{ textAlign: 'right' }}>
                                    <Typography variant="caption" color="text.secondary" display="block">
                                        POS Location
                                    </Typography>
                                    <Typography variant="h6" color="primary.main" fontWeight="bold">
                                        {shiftInfo.posLocation?.name || activePosLocation?.name || 'Unknown Location'}
                                    </Typography>
                                </Box>
                            </Box>
                        </Paper>
                    )}

                    {/* Order Detailss */}
                    <Box
                        sx={{
                            display: 'flex',
                            gap: 2,
                            maxWidth: orderDetails.order_type === 'reservation' ? '1000px' : '732px',
                            mx: 'auto',
                            mt: 5,
                            mb: 5,
                        }}
                    >
                        {/* Select Week Panel - Only shown when reservation is selected */}
                        {orderDetails.order_type === 'reservation' && (
                            <Box sx={{ width: '320px', flexShrink: 0, mt: 35 }}>
                                <Paper
                                    elevation={5}
                                    sx={{
                                        width: '100%',
                                        borderRadius: 1,
                                        overflow: 'hidden',
                                        px: 2,
                                        py: 1,
                                    }}
                                >
                                    {/* Header */}
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            // px: 1,
                                            py: 2,
                                        }}
                                    >
                                        <Typography
                                            variant="h6"
                                            sx={{
                                                fontWeight: 'medium',
                                                fontSize: '20px',
                                                color: '#121212',
                                            }}
                                        >
                                            Select Week
                                        </Typography>
                                        <img
                                            src="/assets/angle-right-circle.png"
                                            alt=""
                                            style={{
                                                height: 20,
                                                width: 20,
                                            }}
                                        />
                                    </Box>

                                    {/* Week List */}
                                    <List disablePadding>
                                        {weeks.length > 0 &&
                                            weeks.map((week) => (
                                                <ListItem
                                                    key={week.id}
                                                    disablePadding
                                                    onClick={() => handleWeekChange(week.id)}
                                                    sx={{
                                                        px: 2.5,
                                                        py: 1.5,
                                                        borderRadius: '4px',
                                                        bgcolor: selectedWeek === week.id ? '#B0DEFF' : 'transparent',

                                                        border: selectedWeek === week.id ? '1px solid #063455' : '1px solid #E3E3E3',
                                                        cursor: 'pointer',
                                                        mb: 1.5,
                                                        '&:last-child': {
                                                            mb: 0,
                                                        },
                                                        '&:hover': {
                                                            bgcolor: selectedWeek === week.id ? '#B0DEFF' : '#FFFFFF',
                                                        },
                                                    }}
                                                >
                                                    <ListItemText
                                                        primary={
                                                            <Typography
                                                                variant="body1"
                                                                sx={{
                                                                    fontWeight: 'medium',
                                                                }}
                                                            >
                                                                {week.label}
                                                            </Typography>
                                                        }
                                                        secondary={
                                                            <Typography
                                                                variant="body2"
                                                                color="text.secondary"
                                                                sx={{
                                                                    fontSize: '0.75rem',
                                                                }}
                                                            >
                                                                {week.dateRange}
                                                            </Typography>
                                                        }
                                                    />
                                                    <ListItemSecondaryAction>
                                                        <Radio
                                                            checked={selectedWeek === week.id}
                                                            onChange={() => handleWeekChange(week.id)}
                                                            size="small"
                                                            sx={{
                                                                '&.Mui-checked': {
                                                                    color: '#1976d2',
                                                                },
                                                            }}
                                                        />
                                                    </ListItemSecondaryAction>
                                                </ListItem>
                                            ))}
                                    </List>

                                    {/* Select Button */}
                                    <Box sx={{ p: 2 }}>
                                        <Button
                                            fullWidth
                                            variant="contained"
                                            sx={{
                                                bgcolor: '#063455',
                                                color: 'white',
                                                py: 1.5,
                                                textTransform: 'none',
                                                '&:hover': {
                                                    bgcolor: '#063455',
                                                },
                                            }}
                                        >
                                            Select
                                        </Button>
                                    </Box>
                                </Paper>
                            </Box>
                        )}

                        {/* Main Content */}
                        <Paper
                            elevation={0}
                            sx={{
                                width: '100%',
                                maxWidth: '732px',
                                overflow: 'hidden',
                                p: 2,
                                border: '2px solid #E3E3E3',
                                flexGrow: 1,
                            }}
                        >
                            <Box sx={{ px: 2, mb: 2 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            color: '#121212',
                                            fontSize: '14px',
                                        }}
                                    >
                                        Choose Order Type
                                    </Typography>
                                </Box>
                                <ToggleButtonGroup
                                    value={orderDetails.order_type}
                                    exclusive
                                    onChange={(e, value) => handleOrderTypeChange(value)}
                                    aria-label="order type"
                                    sx={{
                                        width: '100%',
                                        height: '100px',
                                        gap: 2,
                                        '& .MuiToggleButtonGroup-grouped:not(:first-of-type)': {
                                            borderLeft: '1px solid #063455',
                                        },
                                    }}
                                >
                                    <ToggleButton
                                        value="dineIn"
                                        aria-label="dine in"
                                        sx={{
                                            flex: 1,
                                            py: 1.5,
                                            flexDirection: 'column',
                                            textTransform: 'none',
                                            border: '1px solid #063455',
                                            backgroundColor: orderDetails.order_type === 'dineIn' ? '#B0DEFF' : 'transparent',
                                            color: orderDetails.order_type === 'dineIn' ? '#1976d2' : 'inherit',
                                            '&.Mui-selected': {
                                                backgroundColor: '#B0DEFF',
                                                color: '#1976d2',
                                                '&:hover': {
                                                    backgroundColor: '#B0DEFF',
                                                },
                                            },
                                        }}
                                    >
                                        <FoodIcon
                                            sx={{
                                                mb: 0.5,
                                                color: orderDetails.order_type === 'dineIn' ? '#063455' : 'inherit',
                                            }}
                                        />
                                        <Typography variant="body2">Dine In</Typography>
                                    </ToggleButton>

                                    <ToggleButton
                                        value="delivery"
                                        aria-label="delivery"
                                        sx={{
                                            flex: 1,
                                            py: 1.5,
                                            flexDirection: 'column',
                                            textTransform: 'none',
                                            border: '1px solid #063455',
                                            '&.Mui-selected': {
                                                backgroundColor: '#B0DEFF',
                                                color: '#1976d2',
                                                '&:hover': {
                                                    backgroundColor: '#B0DEFF',
                                                },
                                            },
                                        }}
                                    >
                                        {/* <ShopIcon
                                        sx={{
                                            mb: 0.5,
                                            fill: orderDetails.order_type === 'delivery' ? '#063455' : 'inherit',
                                        }}
                                    /> */}
                                        <CiDeliveryTruck
                                            style={{
                                                height: '35px',
                                                width: '35px',
                                                // marginBottom: "2px",
                                                fill: orderDetails.order_type === 'delivery' ? '#063455' : 'inherit',
                                            }}
                                        />
                                        <Typography variant="body2">Delivery</Typography>
                                    </ToggleButton>

                                    <ToggleButton
                                        value="takeaway"
                                        aria-label="takeaway"
                                        sx={{
                                            flex: 1,
                                            py: 1.5,
                                            flexDirection: 'column',
                                            textTransform: 'none',
                                            border: '1px solid #063455',
                                            '&.Mui-selected': {
                                                backgroundColor: '#B0DEFF',
                                                color: '#1976d2',
                                                '&:hover': {
                                                    backgroundColor: '#B0DEFF',
                                                },
                                            },
                                        }}
                                    >
                                        <ShopIcon
                                            sx={{
                                                mb: 0.5,
                                                fill: orderDetails.order_type === 'takeaway' ? '#063455' : 'inherit',
                                            }}
                                        />
                                        <Typography variant="body2">Takeaway</Typography>
                                    </ToggleButton>

                                    <ToggleButton
                                        value="reservation"
                                        aria-label="reservation"
                                        sx={{
                                            flex: 1,
                                            py: 1.5,
                                            flexDirection: 'column',
                                            textTransform: 'none',
                                            border: '1px solid #063455',
                                            '&.Mui-selected': {
                                                backgroundColor: '#B0DEFF',
                                                color: '#1976d2',
                                                '&:hover': {
                                                    backgroundColor: '#B0DEFF',
                                                },
                                            },
                                        }}
                                    >
                                        <SofaIcon
                                            sx={{
                                                mb: 0.5,
                                                fill: orderDetails.order_type === 'reservation' ? '#063455' : 'inherit',
                                            }}
                                        />
                                        <Typography variant="body2">Reservation</Typography>
                                    </ToggleButton>

                                    <ToggleButton
                                        value="room"
                                        aria-label="room"
                                        sx={{
                                            flex: 1,
                                            py: 1.5,
                                            flexDirection: 'column',
                                            textTransform: 'none',
                                            border: '1px solid #063455',
                                            '&.Mui-selected': {
                                                backgroundColor: '#B0DEFF',
                                                color: '#1976d2',
                                                '&:hover': {
                                                    backgroundColor: '#B0DEFF',
                                                },
                                            },
                                        }}
                                    >
                                        <BedroomParentIcon
                                            sx={{
                                                height: '25px',
                                                width: '25px',
                                                mb: 0.5,
                                                color: orderDetails.order_type === 'room' ? '#063455' : 'inherit',
                                            }}
                                        />
                                        <Typography variant="body2">Room</Typography>
                                    </ToggleButton>

                                    <ToggleButton
                                        value="load_booking"
                                        aria-label="load_booking"
                                        sx={{
                                            flex: 1,
                                            py: 1.5,
                                            flexDirection: 'column',
                                            textTransform: 'none',
                                            border: '1px solid #063455',
                                            '&.Mui-selected': {
                                                backgroundColor: '#B0DEFF',
                                                color: '#1976d2',
                                                '&:hover': {
                                                    backgroundColor: '#B0DEFF',
                                                },
                                            },
                                        }}
                                    >
                                        <CakeIcon
                                            sx={{
                                                mb: 0.5,
                                                color: orderDetails.order_type === 'load_booking' ? '#063455' : 'inherit',
                                            }}
                                        />
                                        <Typography variant="body2">Load Booking</Typography>
                                    </ToggleButton>
                                </ToggleButtonGroup>
                            </Box>

                            {/* =====  */}
                            {orderDetails.order_type === 'dineIn' && (
                                <DineDialog
                                    guestTypes={guestTypes}
                                    floorTables={floorTables}
                                    allrestaurants={allrestaurants}
                                    selectedRestaurant={selectedRestaurant}
                                    onRestaurantChange={handleRestaurantChange}
                                />
                            )}
                            {(orderDetails.order_type === 'takeaway' || orderDetails.order_type === 'delivery') && <TakeAwayDialog guestTypes={guestTypes} selectedRestaurant={selectedRestaurant} />}
                            {orderDetails.order_type === 'reservation' && (
                                <ReservationDialog
                                    guestTypes={guestTypes}
                                    floorTables={floorTables}
                                    tablesReloadKey={tablesReloadKey}
                                    allrestaurants={allrestaurants}
                                    selectedRestaurant={selectedRestaurant}
                                    onRestaurantChange={handleRestaurantChange}
                                />
                            )}
                            {orderDetails.order_type === 'room' && <RoomDialog guestTypes={guestTypes} roomTypes={roomTypes} loading={loading} selectedRestaurant={selectedRestaurant} reloadRooms={loadRooms} />}

                            {orderDetails.order_type === 'load_booking' && (
                                <Box sx={{ mt: 3, px: 2 }}>
                                    <Typography variant="h6" sx={{ mb: 2, color: '#063455' }}>
                                        Search Cake Booking
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
                                                label="Search Booking (ID, Name, Phone)"
                                                size="small"
                                                InputProps={{
                                                    ...params.InputProps,
                                                    endAdornment: (
                                                        <>
                                                            {bookingSearchLoading ? <CircularProgress color="inherit" size={20} /> : null}
                                                            {params.InputProps.endAdornment}
                                                        </>
                                                    ),
                                                }}
                                            />
                                        )}
                                        renderOption={(props, option) => (
                                            <li {...props} key={option.id}>
                                                <Box>
                                                    <Typography variant="body2" fontWeight="bold">
                                                        #{option.booking_number} - {option.customer_name}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        Phone: {option.customer_phone || 'N/A'} | Cake: {option.cake_type?.name}
                                                    </Typography>
                                                </Box>
                                            </li>
                                        )}
                                    />

                                    {bookingSearchResult && (
                                        <Box sx={{ mt: 2, p: 2, border: '1px solid #ddd', borderRadius: 2 }}>
                                            <Typography variant="subtitle1" fontWeight="bold">
                                                Booking #{bookingSearchResult.booking_number}
                                            </Typography>
                                            <Typography variant="body2">Customer: {bookingSearchResult.customer_name}</Typography>
                                            <Typography variant="body2">
                                                Cake: {bookingSearchResult.cake_type?.name} ({bookingSearchResult.weight || '-'} lbs)
                                            </Typography>
                                            <Typography variant="body2">Total: Rs {bookingSearchResult.total_price}</Typography>
                                            <Typography variant="body2" color="primary">
                                                Advance: Rs {bookingSearchResult.advance_amount}
                                            </Typography>
                                            <Typography variant="body2" color="error">
                                                Balance: Rs {bookingSearchResult.balance_amount}
                                            </Typography>

                                            <Button variant="contained" fullWidth sx={{ mt: 2, bgcolor: '#2e7d32' }} onClick={handleLoadBooking}>
                                                Load to Order
                                            </Button>
                                        </Box>
                                    )}
                                </Box>
                            )}
                        </Paper>
                    </Box>
                </div>

                {/* <div
                style={{
                    position: 'fixed',
                    bottom: '0',
                    left: '0',
                    backgroundColor: 'white',
                    zIndex: '9999',
                    maxWidth: '300px',
                    overflow: 'auto',
                    border: '1px solid #ccc',
                }}
            >
                <div style={{ width: '40px', height: '40px', backgroundColor: 'red', borderRadius: '50%', cursor: 'pointer' }} onClick={() => setShowData(!showData)}></div>
                {showData && <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(orderDetails, null, 2)}</pre>}
            </div> */}
            </ShiftGate>
        </>
    );
};
NewOrder.layout = (page) => <POSLayout>{page}</POSLayout>;
export default NewOrder;
