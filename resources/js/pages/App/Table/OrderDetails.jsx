import { Avatar, Box, Button, Chip, CircularProgress, Divider, Grid, IconButton, Paper, Typography } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { routeNameForContext } from '@/lib/utils';

const OrderDetails = ({ orderId, onClose }) => {
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(null);

    const getOrderDetails = async () => {
        setLoading(true);
        try {
            console.log(orderId);

            const res = await axios.get(route(routeNameForContext('table.order.details'), orderId));

            if (res.data.success) {
                setDetails({
                    type: res.data.type, // "order" or "reservation"
                    data: res.data.data,
                });
            } else {
                setDetails(null);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (orderId) {
            getOrderDetails();
        }
    }, [orderId]);

    function formatTime(timeStr) {
        if (!timeStr) return '';
        const [hour, minute] = timeStr.split(':');
        const date = new Date();
        date.setHours(parseInt(hour), parseInt(minute));

        return date.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });
    }

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!details) {
        return (
            <Box sx={{ p: 3 }}>
                <Typography>No Order or Reservation Found</Typography>
            </Box>
        );
    }

    const { type, data } = details;

    return (
        <Box sx={{ p: 3, minHeight: '80vh' }}>
            <Paper
                elevation={0}
                sx={{
                    width: '100%',
                    borderRadius: 1,
                    pb: 5,
                    overflow: 'hidden',
                }}
            >
                {/* Header */}
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        py: 1,
                        mb: 3,
                    }}
                >
                    <Typography variant="h5" sx={{ fontWeight: 500 }}>
                        {type === 'order' ? 'Order Details' : 'Reservation Details'}
                    </Typography>
                    <IconButton size="small" onClick={onClose}>
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </Box>

                {/* Common Info */}
                <Box sx={{ border: '1px solid #E3E3E3', p: 1 }}>
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            mb: 2,
                        }}
                    >
                        <Box>
                            <Typography variant="caption" color="text.secondary">
                                {type === 'order' ? 'Member' : 'Reserved By'}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                                <Avatar
                                    sx={{
                                        width: 24,
                                        height: 24,
                                        bgcolor: '#e0e0e0',
                                        fontSize: 12,
                                        mr: 1,
                                    }}
                                >
                                    {data.member?.full_name?.charAt(0) || data.customer?.name?.charAt(0)}
                                </Avatar>
                                <Typography variant="body2" fontWeight="medium">
                                    {data.member?.full_name || data.customer?.name}
                                </Typography>
                            </Box>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            {data.table && (
                                <Avatar
                                    sx={{
                                        width: 28,
                                        height: 28,
                                        bgcolor: '#0C67AA',
                                        fontSize: 12,
                                    }}
                                >
                                    {data.table?.table_no}
                                </Avatar>
                            )}
                            <Box
                                sx={{
                                    height: 30,
                                    width: 30,
                                    borderRadius: '50%',
                                    bgcolor: '#E3E3E3',
                                }}
                            >
                                <img src="/assets/food-tray.png" alt="" style={{ width: 20, height: 20, marginLeft: 4 }} />
                            </Box>
                        </Box>
                    </Box>

                    <Grid container>
                        <Grid item xs={6} sx={{ pr: 2, borderRight: '1px solid #e0e0e0' }}>
                            <Typography
                                sx={{
                                    color: '#7F7F7F',
                                    fontWeight: 400,
                                    fontSize: '12px',
                                }}
                            >
                                {type === 'order' ? 'Order Date' : 'Reservation Date'}
                            </Typography>
                            <Typography variant="body2" fontWeight="medium" sx={{ mt: 1 }}>
                                {new Intl.DateTimeFormat('en-US', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                }).format(new Date(type === 'order' ? data.start_date : data.date))}
                            </Typography>
                        </Grid>

                        <Grid item xs={6} sx={{ pl: 2 }}>
                            <Typography variant="caption" color="text.secondary">
                                Time
                            </Typography>
                            <Typography variant="body2" fontWeight="medium">
                                {type === 'order' ? formatTime(data.start_time) : `${formatTime(data.start_time)} - ${formatTime(data.end_time)}`}
                            </Typography>
                        </Grid>
                    </Grid>

                    <Box sx={{ mt: 2 }}>
                        <Chip
                            label={
                                <span>
                                    <span style={{ color: '#7F7F7F' }}>{type === 'order' ? 'Order Id' : 'Reservation Id'}: </span>
                                    <span style={{ color: '#000' }}>#{data.id}</span>
                                </span>
                            }
                            size="small"
                            sx={{
                                bgcolor: '#E3E3E3',
                                height: '24px',
                                fontSize: '0.75rem',
                                borderRadius: '4px',
                            }}
                        />
                    </Box>
                </Box>

                {/* Order Items (only for orders or reservation->order) */}
                {((type === 'order' && data.order_items?.length > 0) || (type === 'reservation' && data.order && data.order.order_items?.length > 0)) && (
                    <Box sx={{ mt: 2, p: 1 }}>
                        {(type === 'order' ? data.order_items : data.order.order_items).map((item, index) => (
                            <Box
                                key={index}
                                sx={{
                                    mb: 2,
                                    borderBottom: '1px solid #E3E3E3',
                                }}
                            >
                                <Box sx={{ display: 'flex', mb: 1 }}>
                                    <Avatar
                                        src={item.order_item?.image}
                                        variant="rounded"
                                        sx={{
                                            width: 36,
                                            height: 36,
                                            mr: 1.5,
                                            bgcolor: '#f8c291',
                                        }}
                                    />
                                    <Box sx={{ flexGrow: 1 }}>
                                        <Typography variant="body2" fontWeight="medium">
                                            {item.order_item?.name}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {item.order_item?.category}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ textAlign: 'right' }}>
                                        <Typography variant="caption" color="text.secondary">
                                            Qty : {item.order_item?.quantity} x Rs {item.order_item?.price}
                                        </Typography>
                                        <Typography variant="body2" fontWeight="medium">
                                            Rs. {item.order_item?.total_price}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>
                        ))}
                    </Box>
                )}

                {/* Summary (if invoice exists) */}
                {((type === 'order' && data.invoice) || (type === 'reservation' && data.order && data.order.invoice)) && (
                    <Box sx={{ px: 1, py: 2 }}>
                        <Box
                            sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                mb: 1,
                            }}
                        >
                            <Typography variant="body2" color="text.secondary">
                                Subtotal
                            </Typography>
                            <Typography variant="body2">Rs {type === 'order' ? data.amount : data.order.amount}</Typography>
                        </Box>

                        <Box
                            sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                mb: 1,
                            }}
                        >
                            <Typography variant="body2" color="text.secondary">
                                Discount
                            </Typography>
                            <Typography variant="body2" color="#4caf50">
                                {type === 'order' ? data.invoice.discount : data.order.invoice.discount}
                            </Typography>
                        </Box>

                        <Box
                            sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                mb: 1,
                            }}
                        >
                            <Typography variant="body2" color="text.secondary">
                                Tax
                            </Typography>
                            <Typography variant="body2">Rs {type === 'order' ? data.invoice.tax : data.order.invoice.tax}</Typography>
                        </Box>

                        <Divider sx={{ my: 1 }} />
                        <Box
                            sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                            }}
                        >
                            <Typography variant="subtitle2">Total</Typography>
                            <Typography variant="subtitle2">Rs {type === 'order' ? data.invoice.total_price : data.order.invoice.total_price}</Typography>
                        </Box>
                    </Box>
                )}
            </Paper>
        </Box>
    );
};
OrderDetails.layout = (page) => page;
export default OrderDetails;
