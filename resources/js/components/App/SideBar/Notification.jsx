import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import CloseIcon from '@mui/icons-material/Close';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import LockIcon from '@mui/icons-material/Lock';
import { Avatar, Badge, Box, Button, IconButton, Link, Paper, Typography } from '@mui/material';

const NotificationsPanel = ({ onClose }) => {
    const notifications = [
        {
            customer: {
                name: 'Miles Esther',
                icon: 'shipping',
                time: '2 mins ago',
                orderType: 'New Order',
                orderNumber: '357',
                items: 4,
            },
            orderItems: [
                {
                    name: 'Cappuccino',
                    variant: 'Ice, Large, Normal sugar',
                    quantity: 1,
                    price: 5.0,
                    image: '/cappuccino.jpg',
                },
                {
                    name: 'Buttermilk Waffle',
                    variant: 'Choco',
                    quantity: 2,
                    price: 5.0,
                    image: '/waffle.jpg',
                },
            ],
            hasMoreItems: true,
        },
        {
            customer: {
                name: 'Annette Black',
                icon: 'lock',
                time: '2 mins ago',
                orderType: 'New Order',
                orderNumber: '447',
                items: 2,
            },
            orderItems: [
                {
                    name: 'Cappuccino',
                    variant: 'Ice, Large, Normal sugar',
                    quantity: 1,
                    price: 5.0,
                    image: '/cappuccino.jpg',
                },
                {
                    name: 'Buttermilk Waffle',
                    variant: 'Choco',
                    quantity: 2,
                    price: 5.0,
                    image: '/waffle.jpg',
                },
            ],
            hasMoreItems: false,
        },
        {
            customer: {
                name: 'Bessie Cooper',
                icon: 'shipping',
                time: '2 mins ago',
                orderType: 'Order Cancelled',
                orderNumber: '392',
                items: 4,
            },
            orderItems: [],
            hasMoreItems: false,
        },
        {
            customer: {
                name: 'Bessie Cooper',
                icon: 'shipping',
                time: '2 mins ago',
                orderType: 'Order Cancelled',
                orderNumber: '432',
                items: 4,
            },
            orderItems: [],
            hasMoreItems: false,
        },
    ];

    const getCustomerIcon = (iconType) => {
        switch (iconType) {
            case 'shipping':
                return <LocalShippingIcon sx={{ fontSize: 16, color: 'white' }} />;
            case 'lock':
                return <LockIcon sx={{ fontSize: 16, color: 'white' }} />;
            default:
                return <LocalShippingIcon sx={{ fontSize: 16, color: 'white' }} />;
        }
    };

    return (
        <Paper
            elevation={0}
            sx={{
                width: '100%',
                maxWidth: 600,
                mx: 'auto',
                height: '100vh',
                borderRadius: 1,
                overflow: 'hidden', // Hide any overflow
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            {/* Header */}
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    px: 2.5,
                    py: 2,
                    position: 'sticky',
                    top: 0,
                    zIndex: 10,
                    bgcolor: 'white',
                    borderBottom: '1px solid #e0e0e0',
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        // justifyContent:'space-between'
                    }}
                >
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mr: 1, fontSize: '1.25rem' }}>
                        Notifications
                    </Typography>
                    <Badge
                        badgeContent="5"
                        color="primary"
                        sx={{
                            ml: 1.5, // 👈 Adds left margin between text and badge
                            '& .MuiBadge-badge': {
                                fontSize: '0.75rem',
                                fontWeight: 'bold',
                                bgcolor: '#1976d2',
                            },
                        }}
                    />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Link
                        href="#"
                        underline="none"
                        sx={{
                            color: '#6b7280',
                            fontSize: '0.875rem',
                            mr: 2,
                        }}
                    >
                        Mark all read
                    </Link>
                    <IconButton onClick={onClose} size="small">
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </Box>
            </Box>

            {/* Notifications List */}
            <Box
                sx={{
                    bgcolor: '#f1f5f9',
                    flexGrow: 1,
                    overflow: 'auto',
                    '&::-webkit-scrollbar': {
                        display: 'none',
                    },
                    msOverflowStyle: 'none',
                    scrollbarWidth: 'none',
                }}
            >
                {notifications.map((notification, index) => (
                    <Box key={index} sx={{ mb: 0.5 }}>
                        {/* Customer Info */}
                        <Box
                            sx={{
                                p: 2,
                                bgcolor: '#e3f2fd',
                                display: 'flex',
                                alignItems: 'flex-start',
                            }}
                        >
                            <Avatar
                                sx={{
                                    bgcolor: notification.customer.icon === 'lock' ? '#6b7280' : '#1976d2',
                                    width: 32,
                                    height: 32,
                                    mr: 1.5,
                                }}
                            >
                                {getCustomerIcon(notification.customer.icon)}
                            </Avatar>
                            <Box sx={{ flexGrow: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mr: 1, fontSize: '0.9rem' }}>
                                        {notification.customer.name}
                                    </Typography>
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            color: notification.customer.orderType === 'Order Cancelled' ? '#ef4444' : '#1976d2',
                                            fontWeight: 500,
                                            fontSize: '0.75rem',
                                        }}
                                    >
                                        • {notification.customer.orderType}
                                    </Typography>
                                </Box>
                                <Typography variant="caption" sx={{ color: '#6b7280', fontSize: '0.75rem' }}>
                                    Order #{notification.customer.orderNumber} • {notification.customer.items} items
                                </Typography>
                            </Box>
                            <Typography variant="caption" sx={{ color: '#6b7280', ml: 1, fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                                {notification.customer.time}
                            </Typography>
                        </Box>

                        {/* Order Items */}
                        {notification.orderItems.length > 0 && (
                            <Box sx={{ bgcolor: '#e3f2fd', px: 2, pb: notification.hasMoreItems ? 0 : 2 }}>
                                {notification.orderItems.map((item, itemIndex) => (
                                    <Box
                                        key={itemIndex}
                                        sx={{
                                            display: 'flex',
                                            py: 1.5,
                                            borderTop: '1px solid rgba(240, 240, 240, 0.5)',
                                        }}
                                    >
                                        <Avatar
                                            src={item.image}
                                            variant="rounded"
                                            sx={{
                                                width: 40,
                                                height: 40,
                                                mr: 1.5,
                                                bgcolor: '#f3f4f6',
                                            }}
                                        >
                                            {item.name.charAt(0)}
                                        </Avatar>
                                        <Box sx={{ flexGrow: 1 }}>
                                            <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>
                                                {item.name}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: '#6b7280', fontSize: '0.75rem' }}>
                                                Variant: {item.variant}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ textAlign: 'right' }}>
                                            <Typography variant="body2" sx={{ color: '#6b7280', fontSize: '0.75rem' }}>
                                                Qty: {item.quantity} x Rs {item.price.toFixed(2)}
                                            </Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>
                                                Rs {(item.quantity * item.price).toFixed(2)}
                                            </Typography>
                                        </Box>
                                    </Box>
                                ))}

                                {/* More menu and See Detail */}
                                <Box
                                    sx={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        py: 1.5,
                                        borderTop: '1px solid rgba(240, 240, 240, 0.5)',
                                    }}
                                >
                                    {notification.hasMoreItems ? (
                                        <Typography variant="body2" sx={{ color: '#6b7280', fontSize: '0.875rem' }}>
                                            + More menu
                                        </Typography>
                                    ) : (
                                        <Box />
                                    )}
                                    <Button
                                        variant="outlined"
                                        endIcon={<ArrowForwardIosIcon sx={{ fontSize: 12 }} />}
                                        sx={{
                                            color: '#1976d2',
                                            textTransform: 'none',
                                            fontSize: '0.75rem',
                                            borderColor: '#1976d2',
                                            borderRadius: 1,
                                            py: 0.5,
                                            px: 1.5,
                                        }}
                                    >
                                        See Detail
                                    </Button>
                                </Box>
                            </Box>
                        )}
                    </Box>
                ))}
            </Box>
        </Paper>
    );
};

export default NotificationsPanel;
