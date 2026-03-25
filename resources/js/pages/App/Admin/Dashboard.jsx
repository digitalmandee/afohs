import React, { useEffect, useMemo, useState } from 'react';
import { usePage, router } from '@inertiajs/react';
import {
    Avatar,
    Box,
    Button,
    Chip,
    CircularProgress,
    Divider,
    Grid,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    MenuItem,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { CalendarToday as CalendarIcon, Print as PrintIcon } from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import usePermission from '@/hooks/usePermission';
import AppPage from '@/components/App/ui/AppPage';
import SurfaceCard from '@/components/App/ui/SurfaceCard';
import StatCard from '@/components/App/ui/StatCard';

const money = (amount) => `Rs ${Number(amount || 0).toLocaleString()}`;

const generateMonths = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    return Array.from({ length: 12 }, (_, index) => {
        const monthIndex = (currentMonth - index + 12) % 12;
        const year = currentMonth - index < 0 ? currentYear - 1 : currentYear;
        return `${monthNames[monthIndex]}-${year}`;
    });
};

export default function Dashboard() {
    const { hasPermission } = usePermission();
    const { auth, recentActivities: initialActivities = [] } = usePage().props;
    const [activities, setActivities] = useState(initialActivities);
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const now = new Date();
        return `${now.toLocaleString('default', { month: 'short' })}-${now.getFullYear()}`;
    });
    const [revenueType, setRevenueType] = useState('Revenue');
    const [chartYear] = useState(String(new Date().getFullYear()));
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

    useEffect(() => {
        const fetchDashboardStats = async () => {
            setIsLoading(true);
            try {
                const response = await axios.get('/api/dashboard/stats', {
                    params: { month: selectedMonth, year: chartYear },
                });

                if (response.data.success) {
                    setStats(response.data.stats || {});
                    setChartData(response.data.chartData || []);
                }
            } catch (error) {
                console.error('dashboard.stats.fetch_failed', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardStats();
    }, [selectedMonth, chartYear]);

    useEffect(() => {
        if (!auth?.user?.id || !window.Echo) {
            return undefined;
        }

        const channelName = `App.Models.User.${auth.user.id}`;
        window.Echo.private(channelName).notification((notification) => {
            const newActivity = {
                id: notification.id,
                text: notification.description,
                time: 'Just now',
                title: notification.title,
                read_at: null,
                actor_name: notification.actor_name,
            };

            setActivities((previous) => [newActivity, ...previous].slice(0, 15));
        });

        return () => {
            window.Echo.leave(channelName);
        };
    }, [auth?.user?.id]);

    const months = useMemo(() => generateMonths(), []);

    const chartTotals = useMemo(() => {
        return chartData.reduce(
            (accumulator, row) => ({
                income: accumulator.income + Number(row.income || 0),
                expenses: accumulator.expenses + Number(row.expenses || 0),
                profit: accumulator.profit + Number(row.profit || 0),
            }),
            { income: 0, expenses: 0, profit: 0 }
        );
    }, [chartData]);

    const summaryCards = [
        { label: 'Total Revenue', value: isLoading ? '...' : money(stats.totalRevenue), caption: 'Current period revenue', accent: true },
        { label: 'Total Profit', value: isLoading ? '...' : money(stats.totalProfit), caption: 'Net profit after expenses', tone: 'muted' },
        { label: 'Total Bookings', value: isLoading ? '...' : stats.totalBookings, caption: `${stats.totalRoomBookings || 0} room / ${stats.totalEventBookings || 0} event`, tone: 'light' },
        { label: 'Total Members', value: isLoading ? '...' : stats.totalMembers, caption: `${stats.totalCustomers || 0} customers`, tone: 'light' },
        { label: 'Employees', value: isLoading ? '...' : stats.totalEmployees, caption: 'Active people in system', tone: 'light' },
        { label: 'Product Orders', value: isLoading ? '...' : stats.totalProductOrders, caption: 'Menu item orders', tone: 'muted' },
        { label: 'Subscription Orders', value: isLoading ? '...' : stats.totalSubscriptionOrders, caption: 'Recurring service orders', tone: 'muted' },
    ];

    const handlePrint = () => {
        const params = new URLSearchParams({
            month: selectedMonth,
            year: chartYear,
        });
        window.open(`/dashboard/print?${params.toString()}`, '_blank');
    };

    return (
        <AppPage
            eyebrow="Overview"
            title="Operations Dashboard"
            subtitle="Revenue, bookings, members, and recent activity in the same visual language as the rest of Admin."
            actions={[
                <TextField
                    key="month"
                    select
                    size="small"
                    value={selectedMonth}
                    onChange={(event) => setSelectedMonth(event.target.value)}
                    sx={{ minWidth: 170 }}
                    InputProps={{
                        endAdornment: <CalendarIcon fontSize="small" />,
                    }}
                >
                    {months.map((month) => (
                        <MenuItem key={month} value={month}>
                            {month}
                        </MenuItem>
                    ))}
                </TextField>,
                <Button key="print" variant="contained" startIcon={<PrintIcon />} onClick={handlePrint}>
                    Print
                </Button>,
            ]}
        >
            {hasPermission('dashboard.stats.view') ? (
                <>
                    <Grid container spacing={2.25}>
                        {summaryCards.map((card) => (
                            <Grid item xs={12} sm={6} lg={card.accent ? 4 : 2.666} key={card.label}>
                                <StatCard
                                    label={card.label}
                                    value={card.value}
                                    caption={card.caption}
                                    tone={card.tone || 'light'}
                                    accent={Boolean(card.accent)}
                                />
                            </Grid>
                        ))}
                    </Grid>

                    <Grid container spacing={2.25}>
                        <Grid item xs={12} lg={8}>
                            <SurfaceCard
                                title="Revenue Overview"
                                subtitle="Income, expenses, and profit trend for the selected period."
                                actions={
                                    <TextField
                                        select
                                        size="small"
                                        value={revenueType}
                                        onChange={(event) => setRevenueType(event.target.value)}
                                        sx={{ minWidth: 150 }}
                                    >
                                        <MenuItem value="Revenue">Revenue</MenuItem>
                                        <MenuItem value="Profit">Profit</MenuItem>
                                        <MenuItem value="Expenses">Expenses</MenuItem>
                                    </TextField>
                                }
                            >
                                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} useFlexGap flexWrap="wrap" sx={{ mb: 2 }}>
                                    <Chip size="small" variant="outlined" label={`Income ${money(chartTotals.income)}`} />
                                    <Chip size="small" variant="outlined" color="error" label={`Expenses ${money(chartTotals.expenses)}`} />
                                    <Chip size="small" variant="outlined" color="success" label={`Profit ${money(chartTotals.profit)}`} />
                                </Stack>

                                <Box sx={{ height: 320 }}>
                                    {isLoading ? (
                                        <Box sx={{ height: '100%', display: 'grid', placeItems: 'center' }}>
                                            <CircularProgress size={24} />
                                        </Box>
                                    ) : (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                <XAxis dataKey="name" />
                                                <YAxis tickFormatter={(value) => `Rs ${value}`} />
                                                <Tooltip formatter={(value) => [`Rs ${Number(value || 0).toLocaleString()}`, '']} />
                                                <Bar dataKey="income" fill="#0d3c61" radius={[6, 6, 0, 0]} barSize={12} />
                                                <Bar dataKey="expenses" fill="#e74c3c" radius={[6, 6, 0, 0]} barSize={12} />
                                                <Bar dataKey="profit" fill="#2ecc71" radius={[6, 6, 0, 0]} barSize={12} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    )}
                                </Box>
                            </SurfaceCard>
                        </Grid>

                        <Grid item xs={12} lg={4}>
                            <SurfaceCard title="Recent Activity" subtitle="Notifications and system actions from the latest workflows.">
                                <Box
                                    sx={{
                                        maxHeight: { xs: 420, lg: 640 },
                                        overflowY: 'auto',
                                        pr: 0.5,
                                    }}
                                >
                                    <List sx={{ p: 0 }}>
                                        {activities.length === 0 ? (
                                            <Typography color="text.secondary">No recent activity yet.</Typography>
                                        ) : (
                                            activities.map((activity, index) => (
                                                <React.Fragment key={activity.id || index}>
                                                    <ListItem disablePadding>
                                                        <ListItemButton
                                                            alignItems="flex-start"
                                                            sx={{
                                                                alignItems: 'flex-start',
                                                                borderRadius: 2,
                                                                bgcolor: !activity.read_at ? 'rgba(240,247,255,0.85)' : 'transparent',
                                                                borderLeft: !activity.read_at ? '3px solid #063455' : '3px solid transparent',
                                                                px: 1.25,
                                                            }}
                                                            onClick={() => {
                                                                setActivities((previous) =>
                                                                    previous.map((entry) => (
                                                                        entry.id === activity.id ? { ...entry, read_at: new Date().toISOString() } : entry
                                                                    ))
                                                                );
                                                                if (!activity.read_at && activity.id) {
                                                                    router.post(`/notifications/${activity.id}/read`, {}, { preserveScroll: true });
                                                                }
                                                            }}
                                                        >
                                                            <Avatar sx={{ width: 34, height: 34, mr: 1.25, bgcolor: '#063455', fontSize: '0.95rem' }}>
                                                                {(activity.actor_name || 'S').charAt(0).toUpperCase()}
                                                            </Avatar>
                                                            <ListItemText
                                                                primary={
                                                                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                                                        {activity.title}
                                                                    </Typography>
                                                                }
                                                                secondary={
                                                                    <Stack spacing={0.6} sx={{ mt: 0.45 }}>
                                                                        <Typography variant="body2" color="text.primary">
                                                                            {activity.text}
                                                                        </Typography>
                                                                        <Stack direction="row" justifyContent="space-between" spacing={1}>
                                                                            <Typography variant="caption" color="text.secondary">
                                                                                by {activity.actor_name || 'System'}
                                                                            </Typography>
                                                                            <Typography variant="caption" color="text.secondary">
                                                                                {activity.time}
                                                                            </Typography>
                                                                        </Stack>
                                                                    </Stack>
                                                                }
                                                            />
                                                        </ListItemButton>
                                                    </ListItem>
                                                    {index < activities.length - 1 ? <Divider component="li" sx={{ my: 0.6 }} /> : null}
                                                </React.Fragment>
                                            ))
                                        )}
                                    </List>
                                </Box>
                            </SurfaceCard>
                        </Grid>
                    </Grid>
                </>
            ) : null}
        </AppPage>
    );
}
