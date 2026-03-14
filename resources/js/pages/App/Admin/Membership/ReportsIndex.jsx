import { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Link, usePage } from '@inertiajs/react';
import { Box, Typography, Grid, Card, CardContent, CardActions, Button, Chip, Avatar } from '@mui/material';
import { AttachMoney, Schedule, CalendarMonth, FitnessCenter, Celebration, Refresh, Assessment, Timeline, CreditCard, PersonOff, Badge, TrendingUp } from '@mui/icons-material';

// Icon mapping
const iconMap = {
    AttachMoney,
    Schedule,
    CalendarMonth,
    FitnessCenter,
    Celebration,
    Refresh,
    Assessment,
    Timeline,
    CreditCard,
    PersonOff,
    Badge,
};

const ReportsIndex = () => {
    const { reports } = usePage().props;

    return (
        <>
            {/* <SideNav open={open} setOpen={setOpen} />
            <div
                style={{
                    marginLeft: open ? `${drawerWidthOpen}px` : `${drawerWidthClosed}px`,
                    transition: 'margin-left 0.3s ease-in-out',
                    marginTop: '5rem',
                    backgroundColor: '#F6F6F6',
                }}
            > */}
            <div className="container-fluid px-4 py-4" style={{ backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
                {/* Header Section */}
                <Box sx={{ mb: 4 }}>
                    <Typography
                        variant="h5"
                        sx={{
                            fontWeight: 600,
                            color: '#063455',
                            mb: 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                        }}
                    >
                        Reports Dashboard
                    </Typography>
                </Box>

                {/* Reports Grid */}
                <Grid container spacing={3}>
                    {reports &&
                        reports.map((report) => {
                            const IconComponent = iconMap[report.icon] || Assessment;

                            return (
                                <Grid item xs={12} sm={6} md={4} lg={3} key={report.id}>
                                    <Link href={route(report.route)} style={{ textDecoration: 'none' }}>
                                        <Card
                                            sx={{
                                                height: '100%',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                transition: 'all 0.3s ease-in-out',
                                                cursor: 'pointer',
                                                '&:hover': {
                                                    transform: 'translateY(-4px)',
                                                    boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                                                },
                                                borderRadius: 3,
                                                overflow: 'hidden',
                                            }}
                                        >
                                            {/* Card Header with Icon */}
                                            <Box
                                                sx={{
                                                    p: 3,
                                                    background: `linear-gradient(135deg, ${report.color}15 0%, ${report.color}25 100%)`,
                                                    borderBottom: `3px solid ${report.color}`,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                }}
                                            >
                                                <Avatar
                                                    sx={{
                                                        backgroundColor: report.color,
                                                        width: 56,
                                                        height: 56,
                                                        boxShadow: `0 4px 12px ${report.color}40`,
                                                    }}
                                                >
                                                    <IconComponent sx={{ fontSize: '1.8rem', color: 'white' }} />
                                                </Avatar>
                                                <Chip
                                                    label={report.stats}
                                                    size="small"
                                                    sx={{
                                                        backgroundColor: `${report.color}20`,
                                                        color: report.color,
                                                        fontWeight: 600,
                                                        fontSize: '0.75rem',
                                                    }}
                                                />
                                            </Box>

                                            {/* Card Content */}
                                            <CardContent sx={{ flexGrow: 1, p: 3 }}>
                                                <Typography
                                                    variant="h6"
                                                    sx={{
                                                        fontWeight: 700,
                                                        color: '#1F2937',
                                                        mb: 2,
                                                        fontSize: '1.1rem',
                                                        lineHeight: 1.3,
                                                    }}
                                                >
                                                    {report.title}
                                                </Typography>
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        color: '#6B7280',
                                                        lineHeight: 1.5,
                                                        fontSize: '0.875rem',
                                                    }}
                                                >
                                                    {report.description}
                                                </Typography>
                                            </CardContent>

                                            {/* Card Actions */}
                                            <CardActions sx={{ p: 3, pt: 0 }}>
                                                <Button
                                                    variant="contained"
                                                    fullWidth
                                                    sx={{
                                                        backgroundColor: report.color,
                                                        color: 'white',
                                                        fontWeight: 600,
                                                        textTransform: 'none',
                                                        borderRadius: 2,
                                                        py: 1.5,
                                                        '&:hover': {
                                                            backgroundColor: report.color,
                                                            filter: 'brightness(0.9)',
                                                        },
                                                    }}
                                                >
                                                    View Report
                                                </Button>
                                            </CardActions>
                                        </Card>
                                    </Link>
                                </Grid>
                            );
                        })}
                </Grid>
            </div>
            {/* </div> */}
        </>
    );
};

export default ReportsIndex;
