import { ArrowBack as ArrowBackIcon, Check as CheckIcon } from '@mui/icons-material';
import { Avatar, Box, Chip, IconButton, Paper, Typography } from '@mui/material';

// Sample order history data updated to match the image
const orders = [
    {
        id: '1',
        initials: 'T3',
        initialsColor: '#0C67AA',
        date: '15 May 2020',
        time: '8:00 am',
        items: 4,
        price: 47.0,
        icon: '/assets/food-tray.png',
        orderNumber: '001',
        status: 'Order Done',
    },
    {
        id: '2',
        initials: 'T4',
        initialsColor: '#0C67AA',
        date: '14 May 2024',
        time: '9:30 am',
        items: 4,
        price: 47.0,
        icon: '/assets/truck.png',
        orderNumber: '001',
        status: 'Order Done',
    },
    {
        id: '3',
        initials: 'DE',
        initialsColor: '#22D7A6',
        date: '13 May 2020',
        time: '8:30 am',
        items: 4,
        price: 10.0,
        icon: '/assets/food-tray.png',
        orderNumber: '001',
        status: 'Order Done',
    },
    {
        id: '4',
        initials: 'T1',
        initialsColor: '#129BFF',
        date: '12 May 2020',
        time: '8:00 am',
        items: 4,
        price: 20.0,
        icon: '/assets/truck.png',
        orderNumber: '001',
        status: 'Order Done',
    },
    {
        id: '5',
        initials: 'T1',
        initialsColor: '#22D7A6',
        date: '10 May 2024',
        time: '9:00 am',
        items: 4,
        price: 25.0,
        icon: '/assets/food-tray.png',
        orderNumber: '001',
        status: 'Order Done',
    },
    {
        id: '6',
        initials: 'T2',
        initialsColor: '#0C67AA',
        date: '08 May 2024',
        time: '9:30 am',
        items: 4,
        price: 47.0,
        icon: '/assets/truck.png',
        orderNumber: '001',
        status: 'Order Done',
    },
];

const OrderHistory = ({ handleBackToProfile }) => {
    // Function to get avatar background color based on initials
    // const getAvatarColor = (initials) => {
    //     if (initials.startsWith("T1") || initials.startsWith("T")) {
    //         return "#4caf50" // Green for T1
    //     } else if (initials === "DE") {
    //         return "#2196f3" // Blue for DE
    //     } else {
    //         return "#1976d2" // Default blue
    //     }
    // }

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Header */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    position: 'sticky',
                    top: 0,
                    bgcolor: '#e6f2ff',
                    zIndex: 10,
                    // px: 2,
                    // py: 1.5,
                }}
            >
                <IconButton
                    size="small"
                    onClick={handleBackToProfile}
                    sx={{
                        mr: 1,
                        color: '#333',
                    }}
                >
                    <ArrowBackIcon fontSize="small" />
                </IconButton>
                <Typography variant="subtitle1" fontWeight="medium">
                    Order History
                </Typography>
            </Box>

            {/* Order List */}
            <Box
                sx={{
                    flexGrow: 1,
                    overflowY: 'auto',
                    px: 2,
                    pt: 2,
                    scrollbarWidth: 'none', // Firefox
                    '&::-webkit-scrollbar': {
                        display: 'none', // Chrome, Safari
                    },
                }}
            >
                {orders.map((order) => (
                    <Paper
                        key={order.id}
                        elevation={0}
                        sx={{
                            p: 1.5,
                            mb: 1.5,
                            borderRadius: '2px',
                            border: '1px solid #E3E3E3',
                        }}
                    >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Avatar
                                    sx={{
                                        bgcolor: order.initialsColor,
                                        width: 42,
                                        height: 42,
                                        mr: 1.5,
                                        fontSize: '0.875rem',
                                        fontWeight: 500,
                                    }}
                                >
                                    {order.initials}
                                </Avatar>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Avatar
                                        sx={{
                                            bgcolor: '#E3E3E3',
                                            width: 42,
                                            height: 42,
                                            mr: 1.5,
                                            color: '#555',
                                        }}
                                    >
                                        <img src={order.icon} alt="food tray" width={20} />
                                    </Avatar>
                                    <Box>
                                        <Typography
                                            sx={{
                                                color: '#121212',
                                                fontWeight: '500',
                                                fontSize: '16px',
                                            }}
                                        >
                                            {order.date} {order.time}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {order.items} items
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>
                            <Typography variant="body2" fontWeight="medium" sx={{ alignSelf: 'flex-start', color: '#121212', fontSize: '16px' }}>
                                <Box component="span" sx={{ color: '#7F7F7F', mr: 0.5 }}>
                                    Rs
                                </Box>
                                {order.price.toFixed(2)}
                            </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Chip
                                label={`#${order.orderNumber}`}
                                size="small"
                                sx={{
                                    bgcolor: '#E3E3E3',
                                    color: '#121212',
                                    height: '22px',
                                    fontSize: '0.7rem',
                                    fontWeight: 'normal',
                                    borderRadius: '4px',
                                }}
                            />
                            <Chip
                                icon={<CheckIcon style={{ fontSize: 12, color: '#555' }} />}
                                label={order.status}
                                size="small"
                                sx={{
                                    bgcolor: '#E3E3E3',
                                    color: '#121212',
                                    height: '22px',
                                    fontSize: '0.7rem',
                                    fontWeight: 'normal',
                                    borderRadius: '4px',
                                    '& .MuiChip-icon': {
                                        marginRight: '4px',
                                        marginLeft: '4px',
                                    },
                                }}
                            />
                        </Box>
                    </Paper>
                ))}
            </Box>
        </Box>
    );
};
OrderHistory.layout = (page) => page;
export default OrderHistory;
