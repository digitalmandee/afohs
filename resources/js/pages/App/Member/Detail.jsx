import { ArrowForward, Close, Edit, ExpandMore, KeyboardArrowLeft, KeyboardArrowRight, Star } from '@mui/icons-material';
import {
    Avatar,
    Box,
    Button,
    Grid,
    IconButton,
    Paper,
    Switch,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material';

const CustomerProfile = ({ handleGoToHistory }) => {
    // Calendar data
    const days = Array.from({ length: 31 }, (_, i) => i + 1);
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Order types with colors for the calendar
    const orderTypes = [
        { name: 'Pickup', color: '#708871' },
        { name: 'Dine in', color: '#063455' },
        { name: 'Pick up & Delivery', color: '#B5CFB7' },
        { name: 'Delivery', color: '#CADABF' },
        { name: 'Catering', color: '#DEAC80' },
        { name: 'Reservation', color: '#063455' },
    ];

    // Calendar data - which days have which type of orders
    const calendarData = {
        8: { type: 0 }, // Pickup
        9: { type: 0 },
        10: { type: 1 }, // Dine in
        12: { type: 1 },
        14: { type: 2 }, // Pick up & Delivery
        15: { type: 2 },
        16: { type: 3 }, // Delivery
        20: { type: 4 }, // Catering
    };

    return (
        <Box sx={{ minHeight: '100vh' }}>
            <Paper elevation={0} sx={{ bgcolor: 'transparent', py: 2, px: 2, overflow: 'hidden' }}>
                {/* Header */}
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar src="/assets/userimg.png" sx={{ width: 70, height: 70, mr: 2 }} />
                    <Box sx={{ flexGrow: 1 }}>
                        <Typography
                            variant="h6"
                            sx={{
                                color: '#121212',
                                fontSize: '24px',
                            }}
                        >
                            Dianne Russell
                        </Typography>
                        <Typography
                            variant="caption"
                            color="#7F7F7F"
                            sx={{
                                fontSize: '14px',
                            }}
                        >
                            MEMBER1242
                        </Typography>
                    </Box>
                    <IconButton
                        size="small"
                        sx={{
                            mr: 3,
                        }}
                    >
                        <Edit fontSize="small" />
                    </IconButton>
                    <IconButton size="small">
                        <Close fontSize="small" />
                    </IconButton>
                </Box>

                {/* Contact Info */}
                <Box sx={{ mt: 2 }}>
                    <Grid container spacing={2}>
                        <Grid item xs={6}>
                            <Typography
                                variant="caption"
                                color="#7F7F7F"
                                sx={{
                                    fontSize: '14px',
                                }}
                            >
                                Email
                            </Typography>
                            <Typography
                                variant="body2"
                                sx={{
                                    color: '#121212',
                                    fontSize: '14px',
                                }}
                            >
                                dianne.russell@gmail.com
                            </Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <Typography
                                variant="caption"
                                color="#7F7F7F"
                                sx={{
                                    fontSize: '14px',
                                }}
                            >
                                Phone Number
                            </Typography>
                            <Typography
                                variant="body2"
                                sx={{
                                    color: '#121212',
                                    fontSize: '14px',
                                }}
                            >
                                (702) 555-0122
                            </Typography>
                        </Grid>
                    </Grid>
                </Box>

                {/* Stats */}
                <Box sx={{ mt: 3, pb: 2 }}>
                    <Grid
                        container
                        sx={{
                            border: '1px solid #7F7F7F',
                            height: '80px',
                            borderRadius: '4px',
                        }}
                    >
                        {/* First Column */}
                        <Grid item xs={4} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Box sx={{ textAlign: 'center', ml: 5 }}>
                                <Typography
                                    sx={{
                                        color: '#121212',
                                        fontWeight: 500,
                                        fontSize: '14px',
                                    }}
                                >
                                    Spent
                                </Typography>
                                <Typography
                                    sx={{
                                        color: '#063455',
                                        fontWeight: 500,
                                        fontSize: '14px',
                                    }}
                                >
                                    Rs 3,540
                                </Typography>
                            </Box>
                            <Box
                                sx={{
                                    height: '70%',
                                    borderRight: '2px solid #7F7F7F',
                                    ml: 5,
                                }}
                            />
                        </Grid>

                        {/* Second Column */}
                        <Grid item xs={4} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Box sx={{ textAlign: 'center' }}>
                                <Typography
                                    sx={{
                                        color: '#121212',
                                        fontWeight: 500,
                                        fontSize: '14px',
                                        ml: 5,
                                    }}
                                >
                                    Transactions
                                </Typography>
                                <Typography
                                    sx={{
                                        color: '#063455',
                                        fontWeight: 500,
                                        fontSize: '14px',
                                    }}
                                >
                                    52
                                </Typography>
                            </Box>
                            <Box
                                sx={{
                                    height: '70%',
                                    borderRight: '2px solid #7F7F7F',
                                    ml: 5,
                                }}
                            />
                        </Grid>

                        {/* Third Column */}
                        <Grid item xs={4} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Box sx={{ textAlign: 'center' }}>
                                <Typography
                                    sx={{
                                        color: '#121212',
                                        fontWeight: 500,
                                        fontSize: '14px',
                                    }}
                                >
                                    Points
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 0.5 }}>
                                    <Star sx={{ color: '#ffc107', fontSize: 16, mr: 0.5 }} />
                                    <Typography
                                        sx={{
                                            color: '#063455',
                                            fontWeight: 500,
                                            fontSize: '14px',
                                        }}
                                    >
                                        100
                                    </Typography>
                                </Box>
                            </Box>
                        </Grid>
                    </Grid>
                </Box>

                {/* Customer Status */}
                <Box sx={{ mt: 1, p: 2, border: '1px solid #7F7F7F', borderRadius: '4px' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                            <Typography variant="subtitle2">Customer Status</Typography>
                            <Typography variant="caption" color="text.secondary">
                                Active customers will see all member facilities
                            </Typography>
                        </Box>
                        <Switch defaultChecked />
                    </Box>
                </Box>

                {/* Address */}
                <Box
                    sx={{
                        mt: 2,
                        p: 2,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        border: '1px solid #7F7F7F',
                        borderRadius: '4px',
                    }}
                >
                    <Typography variant="subtitle2">Address (3)</Typography>
                    <IconButton size="small">
                        <ExpandMore fontSize="small" />
                    </IconButton>
                </Box>

                {/* Favorite Dish */}
                <Box sx={{ mt: 2, border: '1px solid #7F7F7F', px: 3, py: 3, borderRadius: '4px' }}>
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            mb: 2,
                        }}
                    >
                        <Typography
                            variant="subtitle2"
                            sx={{
                                color: '#121212',
                                fontSize: '14px',
                            }}
                        >
                            Favorite Dish
                        </Typography>
                        <Button
                            variant="contained"
                            size="small"
                            endIcon={<ArrowForward />}
                            onClick={handleGoToHistory}
                            sx={{
                                bgcolor: '#063455',
                                '&:hover': { bgcolor: '#063455' },
                                textTransform: 'none',
                                borderRadius: 1,
                            }}
                        >
                            Order History
                        </Button>
                    </Box>

                    {/* Dish Items */}
                    <Box>
                        {/* Cappuccino */}
                        <Box sx={{ display: 'flex', mb: 2, pb: 2, borderBottom: '1px solid #f0f0f0' }}>
                            <Avatar
                                src="/assets/bimage.png"
                                variant="rounded"
                                sx={{ width: 40, height: 40, borderRadius: '50%', mr: 2, bgcolor: '#f8c291' }}
                            />
                            <Box sx={{ flexGrow: 1 }}>
                                <Typography
                                    sx={{
                                        color: '#121212',
                                        fontWeight: '500',
                                        fontSize: '14px',
                                    }}
                                >
                                    Cappuccino
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <Typography
                                        sx={{
                                            color: '#7F7F7F',
                                            fontSize: '12px',
                                            fontWeight: 400,
                                        }}
                                    >
                                        Varient:
                                    </Typography>
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            color: '#121212',
                                            fontSize: '12px',
                                        }}
                                    >
                                        vanilla, less sugar, normal sugar
                                    </Typography>
                                </Box>
                            </Box>
                            <Box sx={{ textAlign: 'right', minWidth: 80 }}>
                                <Typography variant="caption" color="text.secondary">
                                    Coffee & Beverage
                                </Typography>
                                <Typography variant="body2" fontWeight="medium">
                                    10x
                                </Typography>
                            </Box>
                        </Box>

                        {/* Buttermilk Waffle */}
                        <Box sx={{ display: 'flex', mb: 2, pb: 2, borderBottom: '1px solid #f0f0f0' }}>
                            <Avatar
                                src="/assets/bimage.png"
                                variant="rounded"
                                sx={{ width: 40, height: 40, borderRadius: '50%', mr: 2, bgcolor: '#fab1a0' }}
                            />
                            <Box sx={{ flexGrow: 1 }}>
                                <Typography variant="body2" fontWeight="medium">
                                    Buttermilk Waffle
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <Typography
                                        sx={{
                                            color: '#7F7F7F',
                                            fontSize: '12px',
                                            fontWeight: 400,
                                        }}
                                    >
                                        Varient:
                                    </Typography>
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            color: '#121212',
                                            fontSize: '12px',
                                        }}
                                    >
                                        with Strawbery
                                    </Typography>
                                </Box>
                            </Box>
                            <Box sx={{ textAlign: 'right', minWidth: 80 }}>
                                <Typography variant="caption" color="text.secondary">
                                    Food & Snack
                                </Typography>
                                <Typography variant="body2" fontWeight="medium">
                                    15x
                                </Typography>
                            </Box>
                        </Box>

                        {/* XL Home Dinner */}
                        <Box sx={{ display: 'flex' }}>
                            <Avatar
                                src="/assets/bimage.png"
                                variant="rounded"
                                sx={{ width: 40, height: 40, borderRadius: '50%', mr: 2, bgcolor: '#55efc4' }}
                            />
                            <Box sx={{ flexGrow: 1 }}>
                                <Typography variant="body2" fontWeight="medium">
                                    XL Home Dinner
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <Typography
                                        sx={{
                                            color: '#7F7F7F',
                                            fontSize: '12px',
                                            fontWeight: 400,
                                        }}
                                    >
                                        Varient:
                                    </Typography>
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            color: '#121212',
                                            fontSize: '12px',
                                        }}
                                    >
                                        250g
                                    </Typography>
                                </Box>
                            </Box>
                            <Box sx={{ textAlign: 'right', minWidth: 80 }}>
                                <Typography variant="caption" color="text.secondary">
                                    Meal at Home
                                </Typography>
                                <Typography variant="body2" fontWeight="medium">
                                    5x
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                </Box>

                {/* Order Activity Monthly */}
                <Box sx={{ mt: 2, p: 2, border: '1px solid #7F7F7F', borderRadius: '4px' }}>
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            mb: 2,
                        }}
                    >
                        <Typography
                            sx={{
                                color: '#121212',
                                fontWeight: 500,
                                fontSize: '14px',
                            }}
                        >
                            Order Activity Monthly
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <IconButton size="small">
                                <KeyboardArrowLeft fontSize="small" />
                            </IconButton>
                            <Typography
                                variant="body2"
                                sx={{
                                    color: '#121212',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                }}
                            >
                                Jan 2022
                            </Typography>
                            <IconButton size="small">
                                <KeyboardArrowRight fontSize="small" />
                            </IconButton>
                        </Box>
                    </Box>

                    {/* Calendar */}
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    {weekdays.map((day) => (
                                        <TableCell key={day} align="center" sx={{ py: 1, px: 0 }}>
                                            <Typography variant="caption" fontWeight="medium">
                                                {day}
                                            </Typography>
                                        </TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {/* Calendar grid - 5 weeks */}
                                {[0, 1, 2, 3, 4].map((week) => (
                                    <TableRow key={week}>
                                        {weekdays.map((_, dayIndex) => {
                                            const dayNum = week * 7 + dayIndex + 1 - 6; // Adjust to start from correct day
                                            const hasOrder = calendarData[dayNum];

                                            return dayNum > 0 && dayNum <= 31 ? (
                                                <TableCell
                                                    key={dayIndex}
                                                    align="center"
                                                    sx={{
                                                        p: 0.5,
                                                        height: 32,
                                                        ...(hasOrder && {
                                                            bgcolor: orderTypes[hasOrder.type].color,
                                                            color: hasOrder.type === 3 || hasOrder.type === 5 ? 'white' : 'inherit',
                                                        }),
                                                        ...(dayNum === 20 && { border: '1px solid #000000' }),
                                                    }}
                                                >
                                                    <Typography variant="caption">{dayNum}</Typography>
                                                </TableCell>
                                            ) : (
                                                <TableCell key={dayIndex} />
                                            );
                                        })}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {/* Legend */}
                    <Box sx={{ mt: 2 }}>
                        <Grid container spacing={1}>
                            {orderTypes.map((type, index) => (
                                <Grid
                                    item
                                    xs={6}
                                    key={index}
                                    sx={{
                                        bgcolor: 'transparent',
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Box
                                            sx={{
                                                width: 12,
                                                height: 12,
                                                borderRadius: 1,
                                                bgcolor: type.color,
                                                mr: 1,
                                            }}
                                        />
                                        <Typography variant="caption" color="text.secondary">
                                            {type.name}
                                        </Typography>
                                    </Box>
                                </Grid>
                            ))}
                        </Grid>
                    </Box>
                </Box>
            </Paper>
        </Box>
    );
};
CustomerProfile.layout = (page) => page;
export default CustomerProfile;
