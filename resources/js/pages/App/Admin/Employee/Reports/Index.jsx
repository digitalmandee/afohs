import { useState } from 'react';
import { router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import AdminLayout from '@/layouts/AdminLayout';
import { Box, Card, CardContent, Typography, Grid, IconButton, Chip } from '@mui/material';
import { ArrowBack as ArrowBackIcon, People as PeopleIcon, PersonAdd as PersonAddIcon, CalendarMonth as CalendarMonthIcon, Today as TodayIcon, EventBusy as EventBusyIcon, Receipt as ReceiptIcon, AccountBalance as AccountBalanceIcon, RemoveCircle as RemoveCircleIcon, TrendingUp as TrendingUpIcon, AccountBalanceWallet as AccountBalanceWalletIcon } from '@mui/icons-material';

const iconMap = {
    People: PeopleIcon,
    PersonAdd: PersonAddIcon,
    CalendarMonth: CalendarMonthIcon,
    Today: TodayIcon,
    EventBusy: EventBusyIcon,
    Receipt: ReceiptIcon,
    AccountBalance: AccountBalanceIcon,
    RemoveCircle: RemoveCircleIcon,
    TrendingUp: TrendingUpIcon,
    AccountBalanceWallet: AccountBalanceWalletIcon,
};

const ReportsIndex = ({ reports = [] }) => {
    const handleReportClick = (reportRoute) => {
        try {
            router.visit(route(reportRoute));
        } catch (e) {
            console.error('Route not found:', reportRoute);
        }
    };

    return (
        <AdminLayout>
            <Box sx={{ bgcolor: '#f5f5f5', minHeight: '100vh', p: 3 }}>
                {/* Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                    {/* <IconButton onClick={() => window.history.back()} sx={{ mr: 2 }}>
                        <ArrowBackIcon sx={{ color: '#063455' }} />
                    </IconButton> */}
                    <Typography sx={{ color: '#063455', fontWeight: 700, fontSize:'30px' }}>
                        Employee Reports
                    </Typography>
                </Box>

                {/* Reports Grid */}
                <Grid container spacing={3}>
                    {reports.map((report) => {
                        const IconComponent = iconMap[report.icon] || PeopleIcon;
                        return (
                            <Grid item xs={12} sm={6} md={4} lg={3} key={report.id}>
                                <Card
                                    sx={{
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease',
                                        height: '100%',
                                        borderRadius: '16px',
                                        bgcolor:'#063455',
                                        '&:hover': {
                                            transform: 'translateY(-4px)',
                                            boxShadow: '0 8px 24px rgba(6, 52, 85, 0.15)',
                                        },
                                    }}
                                    onClick={() => handleReportClick(report.route)}
                                >
                                    <CardContent sx={{ p: 3 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                }}
                                            >
                                                <IconComponent sx={{ color: '#fff', fontSize: 28 }} />
                                            </Box>
                                            <Chip
                                                label={report.stats}
                                                size="small"
                                                sx={{
                                                    backgroundColor: '#E8F4FD',
                                                    color: '#063455',
                                                    fontWeight: 500,
                                                }}
                                            />
                                        </Box>
                                        <Typography
                                            variant="h6"
                                            sx={{
                                                color: '#fff',
                                                fontWeight: 600,
                                                mb: 1,
                                                fontSize: '1rem',
                                            }}
                                        >
                                            {report.title}
                                        </Typography>
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                color: '#fff',
                                                lineHeight: 1.5,
                                            }}
                                        >
                                            {report.description}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        );
                    })}
                </Grid>
            </Box>
        </AdminLayout>
    );
};

export default ReportsIndex;
