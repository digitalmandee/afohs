'use client';

import SideNav from '@/components/App/SideBar/SideNav';
import { router } from '@inertiajs/react';
import { Close as CloseIcon, FilterAlt as FilterIcon, KeyboardArrowDown, KeyboardArrowUp, Print as PrintIcon } from '@mui/icons-material';
import DeliveryDiningIcon from '@mui/icons-material/DeliveryDining'; // delivery
import RestaurantIcon from '@mui/icons-material/Restaurant'; // dine_in
import TakeoutDiningIcon from '@mui/icons-material/TakeoutDining'; // take_away
import { Alert, Box, Button, Checkbox, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, Grid, IconButton, MenuItem, Paper, Select, Snackbar, Typography } from '@mui/material';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useCallback, useEffect, useState } from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { enqueueSnackbar } from 'notistack';
import { routeNameForContext } from '@/lib/utils';
dayjs.extend(utc);

const drawerWidthOpen = 240;
const drawerWidthClosed = 110;

const OrderManagement = ({ kitchenOrders, flash }) => {
    const [open, setOpen] = useState(true);
    const [filterOpen, setFilterOpen] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [activeTab, setActiveTab] = useState('All Order');
    const [checkedItems, setCheckedItems] = useState([]);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('success');
    const [datePeriod, setDatePeriod] = useState('');
    const [fromDate, setFromDate] = useState('Jan 01, 2024');
    const [toDate, setToDate] = useState('August 01, 2024');
    const [statusFilters, setStatusFilters] = useState(['All']);
    const [orderTypeFilters, setOrderTypeFilters] = useState(['All']);
    const [filteredOrder, setFilteredOrder] = useState(kitchenOrders || []);
    const [loadingOrders, setLoadingOrders] = useState({}); // Track loading state per order
    const [expandedItems, setExpandedItems] = useState({}); // Track expanded state per item

    // Function to format seconds into HH:MM:SS
    const formatTime = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Function to calculate total time from order_time and end_time
    const calculateTotalTime = (order_time, end_time) => {
        if (!order_time || !end_time) return '00:00:00';
        const start = dayjs.utc(order_time);
        const end = dayjs.utc(end_time);
        const diffSeconds = end.diff(start, 'second');
        return formatTime(diffSeconds);
    };

    useEffect(() => {
        setCheckedItems((prev) => {
            return (filteredOrder || []).reduce((acc, order) => {
                acc[order.id] = order.order_items.map((item) => ({
                    id: item.id,
                    checked: item.status === 'completed',
                }));
                return acc;
            }, {});
        });
    }, [filteredOrder]);

    // State to track timers for each order
    const [timers, setTimers] = useState({});

    useEffect(() => {
        setTimers(
            (filteredOrder || []).reduce((acc, order) => {
                let seconds = 0;
                if (order.status === 'in_progress' && order.order_time) {
                    try {
                        const startTime = new Date(order.order_time);

                        const currentTime = new Date();

                        seconds = Math.floor((currentTime - startTime) / 1000);
                        if (seconds < 0) seconds = 0; // Prevent negative time
                    } catch (e) {
                        console.error(`Invalid order_time for order ${order.id}: ${order.order_time}`, e);
                        seconds = 0;
                    }
                }
                // console.log(order.id, order.status, order.order_time, order.end_time);

                acc[order.id] = {
                    running: order.status === 'in_progress',
                    seconds,
                    totalTime: order.status === 'completed' && order.order_time && order.end_time ? calculateTotalTime(order.order_time, order.end_time) : '00:00:00',
                };
                return acc;
            }, {}),
        );
    }, [filteredOrder]);

    // Timer effect to update running timers
    useEffect(() => {
        const interval = setInterval(() => {
            setTimers((prev) => {
                const updated = { ...prev };

                filteredOrder.forEach((order) => {
                    if (order.status === 'in_progress' && order.order_time) {
                        try {
                            const startTime = dayjs.utc(order.order_time);
                            const currentTime = dayjs.utc();
                            let seconds = Math.floor(currentTime.diff(startTime, 'second'));
                            // console.log(seconds);
                            if (seconds < 0) seconds = 0;
                            updated[order.id] = {
                                ...updated[order.id],
                                seconds,
                            };
                        } catch (e) {
                            console.error(`Invalid time for order ${order.id}`, e);
                        }
                    }
                });

                return updated;
            });
        }, 1000); // Update every second
        return () => clearInterval(interval); // Clean up on unmount
    }, [filteredOrder]);

    useEffect(() => {
        if (flash?.success) {
            enqueueSnackbar(flash.success, { variant: 'success' });
        } else if (flash?.error) {
            enqueueSnackbar(flash.error, { variant: 'error' });
        }
    }, [flash]);

    const handleSnackbarClose = () => {
        setSnackbarOpen(false);
    };

    const handleFilterOpen = () => {
        setFilterOpen(true);
    };

    const handleFilterClose = () => {
        setFilterOpen(false);
    };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
    };

    const handleDatePeriodChange = (period) => {
        setDatePeriod(period);
    };

    const handleStatusFilterChange = (status) => {
        if (status === 'All') {
            setStatusFilters(['All']);
        } else {
            const newFilters = statusFilters.includes('All') ? [status] : statusFilters.includes(status) ? statusFilters.filter((s) => s !== status) : [...statusFilters, status];
            setStatusFilters(newFilters.length ? newFilters : ['All']);
        }
    };

    const handleOrderTypeFilterChange = (type) => {
        if (type === 'All') {
            setOrderTypeFilters(['All']);
        } else {
            const newFilters = orderTypeFilters.includes('All') ? [type] : orderTypeFilters.includes(type) ? orderTypeFilters.filter((t) => t !== type) : [...orderTypeFilters, type];
            setOrderTypeFilters(newFilters.length ? newFilters : ['All']);
        }
    };

    const resetFilters = () => {
        setDatePeriod('');
        setFromDate('Jan 01, 2024');
        setToDate('August 01, 2024');
        setStatusFilters(['All']);
        setOrderTypeFilters(['All']);
    };

    const applyFilters = () => {
        handleFilterClose();
    };

    const tabs = [
        { id: 'All Order', count: null },
        { id: 'pending', count: filteredOrder?.filter((o) => o.status === 'pending').length || 0 },
        { id: 'in_progress', count: filteredOrder?.filter((o) => o.status === 'in_progress').length || 0 },
        { id: 'completed', count: filteredOrder?.filter((o) => o.status === 'completed').length || 0 },
        { id: 'refund', count: filteredOrder?.filter((o) => o.status === 'refund').length || 0 },
    ];

    const datePeriods = ['Yesterday', 'Last Week', 'Last Month', 'Last 3 Month', 'Last Year', 'Custom Date'];
    const statusOptions = ['All', 'New Order', 'Refund', 'Process', 'Done'];
    const orderTypeOptions = ['All', 'Dine', 'Pickup', 'Delivery', 'Takeaway', 'Reservation'];

    const filteredOrders = (filteredOrder || []).filter((order) => {
        if (activeTab === 'All Order') {
            return true;
        } else {
            return order.status === activeTab;
        }
    });

    const handleCheckboxChange = (orderId, itemId, checked) => {
        setCheckedItems((prev) => ({
            ...prev,
            [orderId]: prev[orderId].map((item) => (item.id === itemId ? { ...item, checked } : item)),
        }));

        const formData = new FormData();
        formData.append('status', checked ? 'completed' : 'pending');

        router.post(route(routeNameForContext('kitchen.item.update-status'), { order: orderId, item: itemId }), formData, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setFilteredOrder((prev) =>
                    prev.map((order) =>
                        order.id === orderId
                            ? {
                                  ...order,
                                  order_items: order.order_items.map((item) => (item.id === itemId ? { ...item, status: checked ? 'completed' : 'pending' } : item)),
                              }
                            : order,
                    ),
                );
            },
            onError: (errors) => {
                console.error('Item status update error:', errors);
                setSnackbarMessage('Failed to update item status: ' + (errors.status || 'Unknown error'));
                setSnackbarSeverity('error');
                setSnackbarOpen(true);

                setCheckedItems((prev) => ({
                    ...prev,
                    [orderId]: prev[orderId].map((item) => (item.id === itemId ? { ...item, checked: !checked } : item)),
                }));
            },
        });
    };

    const handleStatusChange = useCallback(
        (e, orderId) => {
            e.preventDefault();
            setLoadingOrders((prev) => ({ ...prev, [orderId]: true })); // Set loading for this order

            const order = filteredOrder.find((o) => o.id === orderId);
            const newOrderStatus = order.status === 'pending' ? 'in_progress' : 'completed';

            // Preserve cancelled status for items
            const itemStatuses = checkedItems[orderId].map((item) => {
                const orderItem = order.order_items.find((orderItem) => orderItem.id === item.id);
                return {
                    id: item.id,
                    status: orderItem.status === 'cancelled' ? 'cancelled' : item.checked ? 'completed' : 'pending',
                };
            });

            const formData = new FormData();
            formData.append('status', newOrderStatus);
            formData.append('items', JSON.stringify(itemStatuses));

            let formattedTime = null;
            if (newOrderStatus === 'in_progress') {
                formData.append('order_time', new Date().toISOString());
            } else if (newOrderStatus === 'completed') {
                formData.append('end_time', new Date().toISOString());
                formattedTime = new Date().toISOString();
            }

            router.post(route(routeNameForContext('kitchen.update-all'), orderId), formData, {
                forceFormData: true,
                preserveScroll: true,
                onSuccess: () => {
                    setFilteredOrder((prev) =>
                        prev.map((order) =>
                            order.id === orderId
                                ? {
                                      ...order,
                                      status: newOrderStatus,
                                      order_time: newOrderStatus === 'in_progress' ? formattedTime : order.order_time,
                                      end_time: newOrderStatus === 'completed' ? formattedTime : order.end_time,
                                      order_items: order.order_items.map((item) => {
                                          const updatedItem = itemStatuses.find((i) => i.id === item.id);
                                          return updatedItem ? { ...item, status: updatedItem.status } : item;
                                      }),
                                  }
                                : order,
                        ),
                    );

                    // Update timer state
                    setTimers((prev) => {
                        const updated = { ...prev };
                        if (newOrderStatus === 'in_progress') {
                            updated[orderId] = { running: true, seconds: 0, totalTime: null };
                        } else if (newOrderStatus === 'completed') {
                            const updatedOrderTime = order.order_time ?? new Date().toISOString(); // fallback if null
                            const totalTime = calculateTotalTime(updatedOrderTime, formattedTime);
                            updated[orderId] = { running: false, seconds: prev[orderId]?.seconds || 0, totalTime };
                        }
                        return updated;
                    });
                },
                onError: (errors) => {
                    // console.error('Status update error:', errors);
                    enqueueSnackbar('Failed to update statuses: ' + (errors.status || 'Unknown error'), { variant: 'error' });
                },
                onFinish: () => {
                    setLoadingOrders((prev) => ({ ...prev, [orderId]: false })); // Reset loading for this order
                },
            });
        },
        [checkedItems, setFilteredOrder, filteredOrder],
    );

    const handleToggle = (itemId, variants) => {
        // Only toggle if variants exist and are non-empty
        if (variants && Object.keys(variants).length > 0) {
            setExpandedItems((prev) => ({
                ...prev,
                [itemId]: !prev[itemId],
            }));
        }
    };

    useEffect(() => {
        // Listen for new orders
        const channel = window.Echo.channel('orders');

        channel.listen('.order.created', (e) => {
            // console.log('New order received:', e);

            // Add new order to the top
            setFilteredOrder((prev) => [{ ...e, checked: e.status === 'completed' }, ...prev]);

            // Play notification sound
            try {
                new Audio('/notifications.wav').play().catch(console.error);
            } catch (e) {
                console.log('Audio notification not available');
            }
        });

        // Listen for order status updates
        // channel.listen('.order.status.updated', (e) => {
        //     console.log('Order status updated:', e);

        //     setOrders((prevOrders) =>
        //         prevOrders.map((order) =>
        //             order.id === e.id
        //                 ? {
        //                       ...order,
        //                       status: e.status,
        //                       order_time: e.order_time || order.order_time,
        //                       end_time: e.end_time || order.end_time,
        //                       order_items: e.order_items || order.order_items,
        //                       updated_at: e.updated_at,
        //                   }
        //                 : order,
        //         ),
        //     );

        //     // Update timer based on status
        //     setTimers((prev) => {
        //         const updated = { ...prev };
        //         if (e.status === 'in_progress') {
        //             updated[e.id] = {
        //                 running: true,
        //                 seconds: 0,
        //             };
        //         } else if (e.status === 'completed') {
        //             updated[e.id] = {
        //                 running: false,
        //                 seconds: prev[e.id]?.seconds || 0,
        //             };
        //         }
        //         return updated;
        //     });
        // });

        // Connection status listeners
        window.Echo.connector.pusher.connection.bind('connected', () => {
            console.log('Connected to Pusher');
            setIsConnected(true);
        });

        window.Echo.connector.pusher.connection.bind('disconnected', () => {
            console.log('Disconnected from Pusher');
            setIsConnected(false);
        });

        return () => {
            window.Echo.leaveChannel('orders');
        };
    }, []);

    return (
        <>
            <SideNav open={open} setOpen={setOpen} />
            <div
                style={{
                    marginLeft: open ? `${drawerWidthOpen}px` : `${drawerWidthClosed}px`,
                    transition: 'margin-left 0.3s ease-in-out',
                    marginTop: '5rem',
                }}
            >
                <div className="container-fluid p-3">
                    <div className="d-flex justify-content-between align-items-center mb-3 p-3" style={{ backgroundColor: '#eeeeee', borderRadius: '10px' }}>
                        <div className="d-flex">
                            {tabs.map((tab) => (
                                <Button
                                    key={tab.id}
                                    variant={activeTab === tab.id ? 'contained' : 'outlined'}
                                    style={{
                                        marginRight: '10px',
                                        borderRadius: '20px',
                                        backgroundColor: activeTab === tab.id ? '#063455' : 'white',
                                        color: activeTab === tab.id ? 'white' : '#063455',
                                        textTransform: 'none',
                                        padding: '6px 16px',
                                        border: '1px solid #063455',
                                    }}
                                    onClick={() => handleTabChange(tab.id)}
                                >
                                    {tab.id.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())}
                                    {tab.count !== null && `(${tab.count})`}
                                </Button>
                            ))}
                        </div>
                        <Button
                            variant="outlined"
                            startIcon={<FilterIcon />}
                            onClick={handleFilterOpen}
                            style={{
                                borderRadius: '0px',
                                color: '#063455',
                                border: '1px solid #063455',
                                textTransform: 'none',
                            }}
                        >
                            Filter
                        </Button>
                    </div>

                    <div className="row m-1 p-2" style={{ backgroundColor: '#fbfbfb', borderRadius: '10px' }}>
                        {filteredOrders.map((order) => {
                            return (
                                <div key={order.id} className="col-md-3 mb-3">
                                    <Paper elevation={1} style={{ borderRadius: '8px', overflow: 'hidden' }}>
                                        <div
                                            style={{
                                                backgroundColor: order.status === 'completed' ? '#4CAF50' : order.status === 'pending' ? '#1565C0' : order.status === 'cancelled' && order.status === 'Refund' ? '#00BCD4' : order.status === 'in_progress' ? '#063455' : '#00BCD4',
                                                color: 'white',
                                                padding: '12px',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                            }}
                                        >
                                            <div>
                                                <Typography variant="h6" style={{ fontWeight: 'bold' }}>
                                                    #{order.id}
                                                </Typography>
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    {order.status !== 'completed' && <Typography variant="body2">Timer: {formatTime(timers[order.id]?.seconds || 0)}</Typography>}
                                                    {order.status === 'completed' && timers[order.id]?.totalTime && <Typography variant="body2">Timer: {timers[order.id].totalTime}</Typography>}
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                                <div
                                                    style={{
                                                        backgroundColor: '#ffff',
                                                        color: '#000',
                                                        width: '36px',
                                                        height: '36px',
                                                        borderRadius: '50%',
                                                        display: 'flex',
                                                        justifyContent: 'center',
                                                        alignItems: 'center',
                                                        marginRight: '8px',
                                                    }}
                                                >
                                                    <Typography variant="body2">{order.table?.table_no}</Typography>
                                                </div>
                                                <IconButton size="small" style={{ color: 'white' }}>
                                                    {order.order_type === 'dine_in' ? <RestaurantIcon /> : order.order_type === 'delivery' ? <DeliveryDiningIcon /> : order.order_type === 'take_away' ? <TakeoutDiningIcon /> : null}
                                                </IconButton>
                                            </div>
                                        </div>

                                        <div style={{ padding: '12px' }}>
                                            {order.order_items.map((item, idx) => {
                                                const isEditable = order.status === 'in_progress';
                                                const isCancelled = item.status === 'cancelled';
                                                const isChecked = checkedItems[order.id]?.find((i) => i.id === item.id)?.checked || false;
                                                const variants = item.order_item?.variants || {};
                                                const hasVariants = Object.keys(variants).length > 0;

                                                return (
                                                    <div key={idx} style={{ marginBottom: '8px' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <Box sx={{ cursor: hasVariants ? 'pointer' : 'default' }}>
                                                                <Box display="flex" justifyContent="space-between" alignItems="start">
                                                                    <Box display="flex" alignItems="center">
                                                                        <Typography
                                                                            onClick={() => hasVariants && handleToggle(item.id, variants)}
                                                                            variant="body1"
                                                                            sx={{
                                                                                textDecoration: isCancelled ? 'line-through' : 'none',
                                                                                color: isCancelled ? 'red' : item.status === 'completed' ? 'green' : 'inherit',
                                                                            }}
                                                                        >
                                                                            {item.order_item.name}
                                                                        </Typography>
                                                                        {hasVariants && (
                                                                            <IconButton size="small" onClick={() => handleToggle(item.id, variants)} sx={{ ml: 1 }}>
                                                                                {expandedItems[item.id] ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                                                                            </IconButton>
                                                                        )}
                                                                    </Box>
                                                                </Box>

                                                                {expandedItems[item.id] && hasVariants && (
                                                                    <Grid container spacing={1} mt={1}>
                                                                        {variants.map((variant, index) => (
                                                                            <Grid item xs={6} key={index}>
                                                                                <Typography variant="body2">{variant.value}</Typography>
                                                                            </Grid>
                                                                        ))}
                                                                    </Grid>
                                                                )}
                                                            </Box>
                                                            <div style={{ display: 'flex', alignItems: 'top' }}>
                                                                <Typography variant="body2" style={{ marginRight: '8px' }}>
                                                                    {item.order_item.quantity}x
                                                                </Typography>
                                                                <Checkbox
                                                                    disabled={isCancelled || !isEditable}
                                                                    checked={isChecked}
                                                                    onChange={(e) => handleCheckboxChange(order.id, item.id, e.target.checked)}
                                                                    size="small"
                                                                    style={{
                                                                        color: isChecked ? '#1976D2' : undefined,
                                                                        padding: '2px',
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        <div
                                            style={{
                                                borderTop: '1px solid #eee',
                                                padding: '8px',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                            }}
                                        >
                                            <IconButton size="small">
                                                <PrintIcon fontSize="small" />
                                            </IconButton>
                                            {['pending', 'in_progress'].includes(order.status) && (
                                                <Button
                                                    variant="contained"
                                                    fullWidth
                                                    disabled={loadingOrders[order.id] || false}
                                                    style={{
                                                        marginLeft: '8px',
                                                        backgroundColor: order.status === 'pending' ? '#1565C0' : '#063455',
                                                        textTransform: 'none',
                                                    }}
                                                    onClick={(e) => handleStatusChange(e, order.id)}
                                                >
                                                    {loadingOrders[order.id] ? (
                                                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                                            <CircularProgress size={24} sx={{ color: '#fff' }} />
                                                        </Box>
                                                    ) : order.status === 'pending' ? (
                                                        'Start'
                                                    ) : (
                                                        'Finish'
                                                    )}
                                                </Button>
                                            )}
                                            {['cancelled', 'refund'].includes(order.status) && (
                                                <>
                                                    <div style={{ display: 'flex', marginLeft: '8px' }}>
                                                        <Button
                                                            variant="outlined"
                                                            style={{
                                                                marginRight: '4px',
                                                                textTransform: 'none',
                                                                borderColor: '#e0e0e0',
                                                                color: '#333',
                                                            }}
                                                        >
                                                            Reject
                                                        </Button>
                                                        <Button
                                                            variant="contained"
                                                            style={{
                                                                backgroundColor: '#00BCD4',
                                                                textTransform: 'none',
                                                                color: 'white',
                                                            }}
                                                        >
                                                            Refund
                                                        </Button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </Paper>
                                </div>
                            );
                        })}
                    </div>

                    <Dialog
                        open={filterOpen}
                        onClose={handleFilterClose}
                        maxWidth="sm"
                        fullWidth
                        PaperProps={{
                            style: {
                                borderRadius: '10px',
                                position: 'fixed',
                                right: '0px',
                                margin: '0',
                                width: '400px',
                                maxHeight: '100vh',
                                overflowY: 'auto',
                            },
                        }}
                    >
                        <DialogTitle
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '20px 24px 12px',
                            }}
                        >
                            <Typography variant="h6" style={{ fontWeight: 600 }}>
                                Menu Filter
                            </Typography>
                            <IconButton onClick={handleFilterClose} size="small">
                                <CloseIcon />
                            </IconButton>
                        </DialogTitle>
                        <DialogContent style={{ padding: '0 24px' }}>
                            <div style={{ marginBottom: '24px' }}>
                                <Typography variant="subtitle2" style={{ marginBottom: '12px' }}>
                                    Date Period
                                </Typography>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {datePeriods.slice(0, 5).map((period) => (
                                        <Chip
                                            key={period}
                                            label={period}
                                            onClick={() => handleDatePeriodChange(period)}
                                            variant={datePeriod === period ? 'filled' : 'outlined'}
                                            style={{
                                                backgroundColor: datePeriod === period ? '#1976D2' : '#E3F2FD',
                                                color: datePeriod === period ? 'white' : '#1976D2',
                                                borderRadius: '16px',
                                                fontSize: '13px',
                                            }}
                                        />
                                    ))}
                                    <Chip
                                        label="Custom Date"
                                        onClick={() => handleDatePeriodChange('Custom Date')}
                                        variant={datePeriod === 'Custom Date' ? 'filled' : 'outlined'}
                                        style={{
                                            backgroundColor: datePeriod === 'Custom Date' ? '#063455' : 'transparent',
                                            color: datePeriod === 'Custom Date' ? 'white' : '#063455',
                                            borderRadius: '16px',
                                            border: '1px solid #063455',
                                            fontSize: '13px',
                                        }}
                                    />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                                <div style={{ flex: 1 }}>
                                    <Typography variant="body2" style={{ marginBottom: '8px' }}>
                                        From
                                    </Typography>
                                    <FormControl fullWidth variant="outlined" size="small">
                                        <Select value={fromDate} onChange={(e) => setFromDate(e.target.value)} style={{ borderRadius: '6px' }}>
                                            <MenuItem value="Jan 01, 2024">Jan 01, 2024</MenuItem>
                                            <MenuItem value="Feb 01, 2024">Feb 01, 2024</MenuItem>
                                            <MenuItem value="Mar 01, 2024">Mar 01, 2024</MenuItem>
                                        </Select>
                                    </FormControl>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <Typography variant="body2" style={{ marginBottom: '8px' }}>
                                        To
                                    </Typography>
                                    <FormControl fullWidth variant="outlined" size="small">
                                        <Select value={toDate} onChange={(e) => setToDate(e.target.value)} style={{ borderRadius: '6px' }}>
                                            <MenuItem value="August 01, 2024">August 01, 2024</MenuItem>
                                            <MenuItem value="July 01, 2024">July 01, 2024</MenuItem>
                                            <MenuItem value="June 01, 2024">June 01, 2024</MenuItem>
                                        </Select>
                                    </FormControl>
                                </div>
                            </div>
                            <div style={{ marginBottom: '24px' }}>
                                <Typography variant="subtitle2" style={{ marginBottom: '12px' }}>
                                    Status
                                </Typography>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {statusOptions.map((status) => (
                                        <Chip
                                            key={status}
                                            label={status}
                                            onClick={() => handleStatusFilterChange(status)}
                                            variant={statusFilters.includes(status) ? 'filled' : 'outlined'}
                                            style={{
                                                backgroundColor: statusFilters.includes(status) ? (status === 'All' ? '#063455' : status === 'New Order' ? '#1976D2' : '#E3F2FD') : 'transparent',
                                                color: statusFilters.includes(status) ? (status === 'All' || status === 'New Order' ? 'white' : '#1976D2') : 'inherit',
                                                borderRadius: '16px',
                                                fontSize: '13px',
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                            <div style={{ marginBottom: '24px' }}>
                                <Typography variant="subtitle2" style={{ marginBottom: '12px' }}>
                                    Order Type
                                </Typography>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {orderTypeOptions.map((type) => (
                                        <Chip
                                            key={type}
                                            label={type}
                                            onClick={() => handleOrderTypeFilterChange(type)}
                                            variant={orderTypeFilters.includes(type) ? 'filled' : 'outlined'}
                                            style={{
                                                backgroundColor: orderTypeFilters.includes(type) ? (type === 'All' ? '#063455' : '#E3F2FD') : 'transparent',
                                                color: orderTypeFilters.includes(type) ? (type === 'All' ? 'white' : '#1976D2') : 'inherit',
                                                borderRadius: '16px',
                                                fontSize: '13px',
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </DialogContent>
                        <DialogActions style={{ padding: '16px 24px', justifyContent: 'space-between' }}>
                            <Button onClick={handleFilterClose} style={{ color: '#666', textTransform: 'none' }}>
                                Cancel
                            </Button>
                            <div>
                                <Button
                                    onClick={resetFilters}
                                    variant="outlined"
                                    style={{
                                        marginRight: '8px',
                                        textTransform: 'none',
                                        borderColor: '#e0e0e0',
                                    }}
                                >
                                    Reset Filter
                                </Button>
                                <Button
                                    onClick={applyFilters}
                                    variant="contained"
                                    style={{
                                        backgroundColor: '#063455',
                                        color: '#fff',
                                        textTransform: 'none',
                                    }}
                                >
                                    Apply Filters
                                </Button>
                            </div>
                        </DialogActions>
                    </Dialog>
                </div>
            </div>
            <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
                <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </>
    );
};
OrderManagement.layout = (page) => page;
export default OrderManagement;
