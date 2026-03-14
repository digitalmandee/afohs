import React, { useState, useEffect } from 'react';
import { Box, Typography, MenuList, Card, CardContent, Grid, Button, TextField, InputAdornment, MenuItem, List, ListItem, ListItemText, Divider, CircularProgress, ListItemAvatar, Avatar, ListItemButton } from '@mui/material';
import { CalendarToday as CalendarIcon, Print as PrintIcon, People as PeopleIcon, ShoppingBag as ShoppingBagIcon, CreditCard as CreditCardIcon } from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import usePermission from '@/hooks/usePermission';
import axios from 'axios';

// const drawerWidthOpen = 240;
// const drawerWidthClosed = 110;

import { usePage, router } from '@inertiajs/react';
import { useSnackbar } from 'notistack';

const Dashboard = () => {
    const { hasPermission } = usePermission();
    const { auth, recentActivities: initialActivities } = usePage().props;
    const { enqueueSnackbar } = useSnackbar();

    const [activities, setActivities] = useState(initialActivities || []);

    useEffect(() => {
        console.log('Dashboard mounted. Auth:', auth);
        console.log('Initial Activities:', initialActivities);
        console.log('Current Activities State:', activities);
    }, [activities, auth]);

    const currentMonth = new Date().toLocaleString('default', {
        month: 'short',
    });
    const currentYear = new Date().getFullYear();

    // Available months for the dropdown
    // const months = ['Jan-2025', 'Feb-2025', 'Mar-2025', 'Apr-2025', 'May-2025', 'Jun-2025', 'Jul-2025', 'Aug-2025', 'Sep-2025', 'Oct-2025', 'Nov-2025', 'Dec-2025'];
    const [selectedMonth, setSelectedMonth] = useState(`${currentMonth}-${currentYear}`);
    const [revenueType, setRevenueType] = useState('Revenue');
    const [chartYear, setChartYear] = useState('2025');
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalProfit: 0,
        totalBookings: 0,
        totalRoomBookings: 0,
        totalEventBookings: 0,
        totalMembers: 0,
        totalCustomers: 0,
        totalEmployees: 0,
        totalProductOrders: 0,
        totalSubscriptionOrders: 0,
    });
    const [chartData, setChartData] = useState([]);

    // Fetch dashboard stats
    const fetchDashboardStats = async () => {
        setIsLoading(true);
        try {
            const params = {
                month: selectedMonth,
                year: chartYear,
            };
            const res = await axios.get('/api/dashboard/stats', { params });
            if (res.data.success) {
                setStats(res.data.stats);
                setChartData(res.data.chartData);
            }
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardStats();
    }, [selectedMonth, chartYear]);

    useEffect(() => {
        if (auth?.user?.id) {
            console.log(`Subscribing to channel: App.Models.User.${auth.user.id}`);
            window.Echo.private(`App.Models.User.${auth.user.id}`).notification((notification) => {
                console.log('Notification received:', notification);
                const newActivity = {
                    id: notification.id, // Ensure ID is passed in broadcast if available, or fetch it
                    text: notification.description,
                    time: 'Just now',
                    title: notification.title,
                    read_at: null,
                    actor_name: notification.actor_name,
                };

                setActivities((prev) => [newActivity, ...prev].slice(0, 15));

                // enqueueSnackbar handled globally in Layout.jsx now
            });
        }

        return () => {
            if (auth?.user?.id) {
                window.Echo.leave(`App.Models.User.${auth.user.id}`);
            }
        };
    }, [auth?.user?.id]);

    // Format currency
    const formatCurrency = (amount) => {
        return `Rs ${amount.toLocaleString()}`;
    };

    // Print function - opens print route in new window
    const handlePrint = () => {
        const params = new URLSearchParams({
            month: selectedMonth,
            year: chartYear,
        });
        window.open(`/dashboard/print?${params.toString()}`, '_blank');
    };

    const getResponsiveFontSize = (value) => {
        const length = value?.toString()?.length || 0;

        if (length <= 10) return "36px";   // up to 1,000,000,000
        if (length <= 13) return "30px";   // millions
        if (length <= 16) return "26px";   // billions
        if (length <= 19) return "22px";   // very large
        return "20px";                     // extreme values
    };

    const generateMonths = () => {
        const now = new Date(); // Jan 5, 2026
        const currentMonth = now.getMonth(); // 0 (January)
        const currentYear = now.getFullYear(); // 2026

        const monthNames = [
            'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
        ];

        const months = [];
        for (let i = 0; i < 12; i++) {
            const monthIndex = (currentMonth - i + 12) % 12; // Subtract i instead of adding
            const year = currentMonth - i < 0 ? currentYear - 1 : currentYear; // Go back a year if needed
            months.push(`${monthNames[monthIndex]}-${year}`);
        }
        return months;
    };

    const months = generateMonths();

    return (
        <>
            {/* <SideNav open={open} setOpen={setOpen} /> */}
            {/* <div
                style={{
                    marginLeft: open ? `${drawerWidthOpen}px` : `${drawerWidthClosed}px`,
                    transition: 'margin-left 0.3s ease-in-out',
                    marginTop: '5rem',
                }}
            > */}
            <Box sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography sx={{ fontSize: '30px', fontWeight: 700, color: '#063455' }}>Dashboard</Typography>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        {/* <TextField
                            select
                            size="small"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            sx={{
                                width: '200px',
                                // bgcolor: 'white',
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '16px',
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: '4px',
                                        '& .MuiSelect-select': {
                                            color: '#7F7F7F',
                                        }
                                    },
                                },
                            }
                            }
                            SelectProps={{
                                IconComponent: () => null,
                            }}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <CalendarIcon fontSize="small" />
                                    </InputAdornment>
                                ),
                            }}
                        >
                            {months.map((month) => (
                                <MenuItem key={month} value={month}>
                                    {month}
                                </MenuItem>
                            ))}
                        </TextField> */}
                        <TextField
                            select
                            size="small"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            // renderValue={(selected) => selected || getCurrentMonth()}
                            // onChange={(e) => setSelectedMonth(e.target.value || '')}
                            SelectProps={{
                                IconComponent: () => null,
                                MenuProps: {
                                    sx: {
                                        mt: 0.5,
                                        '& .MuiMenu-paper': {
                                            borderRadius: '16px',
                                            '& .MuiMenuItem-root': {
                                                // transition: 'background-color 0.2s ease',
                                                '&:hover': {
                                                    backgroundColor: '#063455 !important',
                                                    color: 'white !important',
                                                    borderRadius: '16px !important',
                                                    mx: 1,
                                                    my: 0.3
                                                }
                                            }
                                        }
                                    }
                                }
                            }}
                            sx={{
                                width: '170px',
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '16px',
                                    '& .MuiSelect-select': {
                                        color: '#7F7F7F',
                                        '&:focus': {
                                            color: '#000'
                                        }
                                    }
                                }
                            }}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <CalendarIcon fontSize="small" style={{ cursor: 'pointer' }} />
                                    </InputAdornment>
                                ),
                            }}
                        >
                            {months.map((month) => (
                                <MenuItem key={month} value={month}>
                                    {month}
                                </MenuItem>
                            ))}
                        </TextField>

                        <Button
                            variant="contained"
                            startIcon={<PrintIcon />}
                            onClick={handlePrint}
                            sx={{
                                bgcolor: '#063455',
                                '&:hover': { bgcolor: '#063455' },
                                textTransform: 'none',
                                borderRadius: '16px',
                            }}
                        >
                            Print
                        </Button>
                    </Box>
                </Box>

                <Grid container spacing={1}>
                    {/* Left side content - 8/12 width */}
                    {hasPermission('dashboard.stats.view') ? (
                        <Grid item xs={12} md={9}>
                            <Grid container spacing={2}>
                                {/* Revenue and Profit */}
                                <Grid item xs={7}>
                                    <Card
                                        sx={{
                                            bgcolor: '#063455',
                                            color: 'white',
                                            borderRadius: '16px',
                                            // height: '166px',
                                            height: { xs: 'auto', md: '166px' },
                                        }}
                                    >
                                        <CardContent
                                            sx={{
                                                display: 'flex',
                                                flexDirection: { xs: 'column', md: 'row' }, // 👈 KEY FIX
                                                justifyContent: 'space-between',
                                                alignItems: 'stretch',
                                                px: 2,
                                                py: 3,
                                                gap: { xs: 2, md: 0 },
                                            }}
                                        >
                                            {/* Total Revenue */}
                                            <Box sx={{ flex: 1, textAlign: { xs: 'center', md: 'left' } }}>
                                                <Typography sx={{ mb: 1, fontWeight: 400, fontSize: '14px', color: '#FFFFFF' }}>Total Revenue</Typography>
                                                <Typography sx={{
                                                    fontWeight: 500,
                                                    fontSize: getResponsiveFontSize(formatCurrency(stats.totalRevenue)),
                                                    color: '#FFFFFF',
                                                    wordBreak: 'break-word',
                                                }}>{isLoading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : formatCurrency(stats.totalRevenue)}</Typography>
                                            </Box>

                                            {/* Divider */}
                                            <Divider orientation="vertical" flexItem sx={{ bgcolor: '#7F7F7F', mx: 1 }} />

                                            {/* Total Profit */}
                                            <Box sx={{ flex: 1, textAlign: 'right' }}>
                                                <Typography sx={{ mb: 1, fontWeight: 400, fontSize: '14px', color: '#FFFFFF' }}>Total Profit</Typography>
                                                <Typography sx={{
                                                    fontWeight: 500,
                                                    fontSize: getResponsiveFontSize(formatCurrency(stats.totalProfit)),
                                                    color: '#FFFFFF',
                                                    wordBreak: 'break-word',
                                                }}>{isLoading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : formatCurrency(stats.totalProfit)}</Typography>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>

                                {/* Bookings */}
                                <Grid item xs={5}>
                                    <Card
                                        sx={{
                                            bgcolor: '#063455',
                                            color: 'white',
                                            borderRadius: '16px',
                                            height: '166px',
                                        }}
                                    >
                                        <CardContent sx={{ px: 2 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                                <Box
                                                    sx={{
                                                        bgcolor: 'transparent',
                                                        width: 46,
                                                        height: 46,
                                                        borderRadius: '50%',
                                                        p: 2,
                                                        mr: 2,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                    }}
                                                >
                                                    <img
                                                        src="/assets/calendar.png"
                                                        alt=""
                                                        style={{
                                                            width: 20,
                                                            height: 20,
                                                        }}
                                                    />
                                                </Box>
                                                <Box>
                                                    <Typography sx={{ fontSize: '14px', fontWeight: 400, color: '#C6C6C6' }}>Total Booking</Typography>
                                                    <Typography sx={{ fontWeight: 500, fontSize: '20px', color: '#FFFFFF' }}>{isLoading ? <CircularProgress size={16} sx={{ color: 'white' }} /> : stats.totalBookings}</Typography>
                                                </Box>
                                            </Box>
                                            <Divider orientation="horizontal" flexItem sx={{ bgcolor: '#7F7F7F', height: '2px' }} />
                                            <Box sx={{ display: 'flex', mt: 2 }}>
                                                <Box sx={{ flex: 1 }}>
                                                    <Typography sx={{ fontWeight: 400, fontSize: '12px', color: '#C6C6C6' }}>Room Booking</Typography>
                                                    <Typography sx={{ fontWeight: 500, fontSize: '18px', color: '#FFFFFF' }}>{isLoading ? <CircularProgress size={14} sx={{ color: 'white' }} /> : stats.totalRoomBookings}</Typography>
                                                </Box>
                                                <Box sx={{ flex: 1 }}>
                                                    <Typography sx={{ fontWeight: 400, fontSize: '12px', color: '#C6C6C6' }}>Event Booking</Typography>
                                                    <Typography sx={{ fontWeight: 500, fontSize: '18px', color: '#FFFFFF' }}>{isLoading ? <CircularProgress size={14} sx={{ color: 'white' }} /> : stats.totalEventBookings}</Typography>
                                                </Box>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>

                                {/* Middle row with 3 cards */}
                                <Grid item xs={12} sm={7}>
                                    <Card
                                        sx={{
                                            bgcolor: '#063455',
                                            color: 'white',
                                            borderRadius: '16px',
                                            height: '166px',
                                        }}
                                    >
                                        <CardContent sx={{ px: 2 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                                <Box
                                                    sx={{
                                                        bgcolor: 'transparent',
                                                        height: 46,
                                                        width: 46,
                                                        borderRadius: '50%',
                                                        p: 1,
                                                        mr: 2,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                    }}
                                                >
                                                    <PeopleIcon />
                                                </Box>
                                                <Box>
                                                    <Typography sx={{ color: '#C6C6C6', fontSize: '14px', fontWeight: 400 }}>Total Members</Typography>
                                                    <Typography sx={{ fontWeight: 500, fontSize: '20px', color: '#FFFFFF' }}>{isLoading ? <CircularProgress size={16} sx={{ color: 'white' }} /> : stats.totalMembers}</Typography>
                                                </Box>
                                            </Box>
                                            <Divider orientation="horizontal" flexItem sx={{ bgcolor: '#7F7F7F', height: '2px' }} />
                                            <Box sx={{ display: 'flex', mt: 2 }}>
                                                <Box sx={{ flex: 1 }}>
                                                    <Typography sx={{ color: '#C6C6C6', fontSize: '12px', fontWeight: 400 }}>Total Customer</Typography>
                                                    <Typography sx={{ fontWeight: 500, fontSize: '18px', color: '#FFFFFF' }}>{isLoading ? <CircularProgress size={14} sx={{ color: 'white' }} /> : stats.totalCustomers}</Typography>
                                                </Box>
                                                <Box sx={{ flex: 1 }}>
                                                    <Typography sx={{ color: '#C6C6C6', fontSize: '12px', fontWeight: 400 }}>Total Employee</Typography>
                                                    <Typography sx={{ fontWeight: 500, fontSize: '18px', color: '#FFFFFF' }}>{isLoading ? <CircularProgress size={14} sx={{ color: 'white' }} /> : stats.totalEmployees}</Typography>
                                                </Box>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>

                                <Grid item xs={12} sm={2.5}>
                                    <Card
                                        sx={{
                                            bgcolor: '#063455',
                                            color: 'white',
                                            borderRadius: '16px',
                                            height: '166px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'flex-start',
                                        }}
                                    >
                                        <CardContent sx={{ p: 2, textAlign: 'left' }}>
                                            {/* Icon Circle */}
                                            <Box
                                                sx={{
                                                    bgcolor: 'transparent',
                                                    height: 46,
                                                    width: 46,
                                                    borderRadius: '50%',
                                                    p: 1,
                                                    mb: 2,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                }}
                                            >
                                                <img
                                                    src="/assets/box.png"
                                                    alt=""
                                                    style={{
                                                        height: 20,
                                                        width: 20,
                                                    }}
                                                />
                                            </Box>

                                            {/* Text Content */}
                                            <Typography sx={{ color: '#C6C6C6', fontWeight: 400, fontSize: '14px', mb: 1 }}>Total Product Order</Typography>
                                            <Typography sx={{ fontWeight: 500, fontSize: '20px', color: '#FFFFFF', display: 'inline' }}>{isLoading ? <CircularProgress size={16} sx={{ color: 'white' }} /> : stats.totalProductOrders}</Typography>
                                            <Typography sx={{ color: '#C6C6C6', fontWeight: 400, fontSize: '14px', display: 'inline', ml: 1 }}>Items</Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>

                                <Grid item xs={12} sm={2.5}>
                                    <Card
                                        sx={{
                                            bgcolor: '#063455',
                                            color: 'white',
                                            borderRadius: '16px',
                                            height: '166px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'flex-start',
                                        }}
                                    >
                                        <CardContent sx={{ p: 2, textAlign: 'left' }}>
                                            {/* Icon Circle */}
                                            <Box
                                                sx={{
                                                    bgcolor: 'transparent',
                                                    height: 46,
                                                    width: 46,
                                                    borderRadius: '50%',
                                                    p: 1,
                                                    mb: 2,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                }}
                                            >
                                                <CreditCardIcon />
                                            </Box>

                                            {/* Text Content */}
                                            <Typography sx={{ color: '#C6C6C6', fontWeight: 400, fontSize: '14px', mb: 1 }}>Total Subscription Order</Typography>
                                            <Typography sx={{ fontWeight: 500, fontSize: '20px', color: '#FFFFFF', display: 'inline' }}>{isLoading ? <CircularProgress size={16} sx={{ color: 'white' }} /> : stats.totalSubscriptionOrders}</Typography>
                                            <Typography sx={{ color: '#C6C6C6', fontWeight: 400, fontSize: '14px', display: 'inline', ml: 1 }}>Order</Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>

                                {/* Chart */}
                                <Grid item xs={12}>
                                    <Card sx={{ borderRadius: '16px' }}>
                                        <CardContent sx={{ p: 3 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                                <Box>
                                                    <Typography sx={{ fontWeight: 600, fontSize: '20px', color: '#1D1F2C' }}>Revenue</Typography>
                                                    <Typography sx={{ color: '#777980', fontWeight: 500, fontSize: '14px' }}>Your Revenue 2026 Year</Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', gap: 2 }}>
                                                    {/* <TextField select size="small" value={revenueType} onChange={(e) => setRevenueType(e.target.value)} sx={{ width: '160px' }}>
                                                        <MenuItem value="Revenue">Revenue</MenuItem>
                                                        <MenuItem value="Profit">Profit</MenuItem>
                                                        <MenuItem value="Expenses">Expenses</MenuItem>
                                                    </TextField> */}
                                                    <TextField
                                                        select
                                                        size="small"
                                                        value={revenueType}
                                                        onChange={(e) => setRevenueType(e.target.value)}
                                                        sx={{
                                                            width: "160px",
                                                            "& .MuiOutlinedInput-root": {
                                                                borderRadius: "16px",
                                                                "& fieldset": {
                                                                    borderRadius: "16px",
                                                                },
                                                            },
                                                        }}
                                                        SelectProps={{
                                                            MenuProps: {
                                                                sx: {
                                                                    "& .MuiPaper-root": {
                                                                        borderRadius: "16px",
                                                                    },
                                                                    "& .MuiMenuItem-root": {
                                                                        borderRadius: "16px",
                                                                        mx: 1,
                                                                        my: 0.3,
                                                                        transition: "all 0.2s ease",
                                                                        "&:hover": {
                                                                            backgroundColor: "#063455 !important",
                                                                            color: "#fff !important",
                                                                        },
                                                                        "&.Mui-selected": {
                                                                            backgroundColor: "#063455 !important",
                                                                            color: "#fff",
                                                                        },
                                                                    },
                                                                },
                                                            },
                                                        }}
                                                    >
                                                        <MenuItem value="Revenue">Revenue</MenuItem>
                                                        <MenuItem value="Profit">Profit</MenuItem>
                                                        <MenuItem value="Expenses">Expenses</MenuItem>
                                                    </TextField>

                                                    {/* <TextField
                                                        size="small"
                                                        value={chartYear}
                                                        onChange={(e) => setChartYear(e.target.value)}
                                                        InputProps={{
                                                            endAdornment: (
                                                                <InputAdornment position="end">
                                                                    <CalendarIcon fontSize="small" />
                                                                </InputAdornment>
                                                            ),
                                                        }}
                                                        sx={{ width: '160px' }}
                                                    /> */}
                                                </Box>
                                            </Box>

                                            <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <Box
                                                        sx={{
                                                            width: 12,
                                                            height: 12,
                                                            borderRadius: '50%',
                                                            bgcolor: '#0d3c61',
                                                            mr: 1,
                                                        }}
                                                    />
                                                    <Typography sx={{ color: '#667085', fontWeight: 400, fontSize: '14px' }}>Income</Typography>
                                                    <Typography sx={{ ml: 1, fontWeight: 500, fontSize: '16px', color: '#1D1F2C' }}>Rs.26,000</Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <Box
                                                        sx={{
                                                            width: 12,
                                                            height: 12,
                                                            borderRadius: '50%',
                                                            bgcolor: '#e74c3c',
                                                            mr: 1,
                                                        }}
                                                    />
                                                    <Typography sx={{ color: '#667085', fontWeight: 400, fontSize: '14px' }}>Expenses</Typography>
                                                    <Typography sx={{ ml: 1, fontWeight: 500, fontSize: '16px', color: '#1D1F2C' }}>Rs.18,000</Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <Box
                                                        sx={{
                                                            width: 12,
                                                            height: 12,
                                                            borderRadius: '50%',
                                                            bgcolor: '#2ecc71',
                                                            mr: 1,
                                                        }}
                                                    />
                                                    <Typography sx={{ color: '#667085', fontWeight: 400, fontSize: '14px' }}>Profit</Typography>
                                                    <Typography sx={{ ml: 1, fontWeight: 500, fontSize: '16px', color: '#1D1F2C' }}>Rs.8,000</Typography>
                                                </Box>
                                            </Box>

                                            <Box sx={{ height: 300 }}>
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                        <XAxis dataKey="name" />
                                                        <YAxis tickFormatter={(value) => `Rs ${value}`} ticks={[0, 200, 400, 600, 800, 1000, 1200, 1400]} />
                                                        <Tooltip formatter={(value) => [`Rs ${value}`, '']} />
                                                        <Bar dataKey="income" fill="#0d3c61" barSize={10} />
                                                        <Bar dataKey="expenses" fill="#e74c3c" barSize={10} />
                                                        <Bar dataKey="profit" fill="#2ecc71" barSize={10} />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>
                        </Grid>
                    ) : null}

                    {/* Right side - Recent Activity - 4/12 width */}
                    <Grid item xs={12} md={hasPermission('dashboard.stats.view') ? 3 : 12}>
                        <Card sx={{ borderRadius: '16px', height: '100%' }}>
                            <CardContent sx={{ p: 0 }}>
                                <Typography variant="h6" sx={{ p: 2, fontWeight: 'bold', borderBottom: '1px solid #eee' }}>
                                    Recent Activity
                                </Typography>
                                <Box
                                    sx={{
                                        maxHeight: 750,          // ≈ 5 items height (adjust if needed)
                                        overflowY: 'auto',
                                        // bgcolor:'pink'
                                    }}
                                >
                                    <List sx={{ p: 0 }}>
                                        {activities.map((activity, index) => (
                                            <React.Fragment key={index}>
                                                <ListItem
                                                    disablePadding
                                                    sx={{
                                                        borderLeft: !activity.read_at ? '4px solid #063455' : 'none',
                                                        bgcolor: !activity.read_at ? '#f0f7ff' : 'transparent',
                                                    }}
                                                >
                                                    <ListItemButton
                                                        alignItems="flex-start"
                                                        onClick={() => {
                                                            // Optimistic update
                                                            setActivities((prev) => prev.map((a) => (a.id === activity.id ? { ...a, read_at: new Date().toISOString() } : a)));
                                                            if (!activity.read_at && activity.id) {
                                                                router.post(`/notifications/${activity.id}/read`, {}, { preserveScroll: true });
                                                            }
                                                        }}
                                                    >
                                                        {/* <ListItemAvatar>
                                                        <Avatar sx={{ width: 40, height: 40, bgcolor: '#063455' }}>{activity.actor_name ? activity.actor_name.charAt(0).toUpperCase() : 'S'}</Avatar>
                                                    </ListItemAvatar> */}
                                                        <ListItemText
                                                            primary={
                                                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                                                    {activity.title}
                                                                </Typography>
                                                            }
                                                            secondary={
                                                                <React.Fragment>
                                                                    <Typography component="span" variant="body2" color="text.primary" sx={{ display: 'block', mb: 0.5 }}>
                                                                        {activity.text}
                                                                    </Typography>
                                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                        <Typography variant="caption" sx={{ color: '#666' }}>
                                                                            by {activity.actor_name || 'System'}
                                                                        </Typography>
                                                                        <Typography variant="caption" sx={{ color: '#999' }}>
                                                                            {activity.time}
                                                                        </Typography>
                                                                    </Box>
                                                                </React.Fragment>
                                                            }
                                                        />
                                                    </ListItemButton>
                                                </ListItem>
                                                {index < activities.length - 1 && <Divider component="li" />}
                                            </React.Fragment>
                                        ))}
                                    </List>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Box>
            {/* </div> */}
        </>
    );
};

export default Dashboard;
