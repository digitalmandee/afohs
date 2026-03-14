import { router } from '@inertiajs/react';
import AdminLayout from '@/layouts/AdminLayout';
import PeopleIcon from '@mui/icons-material/People';
import { Box, Button, Card, CircularProgress, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Grid, Chip, IconButton, Alert, Snackbar } from '@mui/material';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { AccountBalance, TrendingUp, Schedule, MonetizationOn, Settings, Assessment, Refresh } from '@mui/icons-material';

const PayrollDashboard = ({ stats: initialStats }) => {
    const [stats, setStats] = useState(initialStats || {});
    const [loading, setLoading] = useState(false);
    const [recentPeriods, setRecentPeriods] = useState([]);
    const [error, setError] = useState('');
    const [snackbarOpen, setSnackbarOpen] = useState(false);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await axios.get('/api/payroll/dashboard/stats');
            if (response.data.success) {
                setStats(response.data.stats);
                setRecentPeriods(response.data.stats.recent_periods || []);
            } else {
                setError('Failed to fetch dashboard data');
                setSnackbarOpen(true);
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            setError('Error loading dashboard data. Please try again.');
            setSnackbarOpen(true);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-PK', {
            style: 'currency',
            currency: 'PKR',
        })
            .format(amount || 0)
            .replace('PKR', 'Rs');
    };

    const handleCloseSnackbar = () => {
        setSnackbarOpen(false);
    };

    return (
        <AdminLayout>
            <div
                style={{
                    minHeight: '100vh',
                    backgroundColor: '#f5f5f5',
                }}
            >
                <Box sx={{ p: 2 }}>
                    <div style={{ paddingTop: '1rem', backgroundColor: 'transparent' }}>
                        {/* Header */}
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                width: '100%',
                                // marginBottom: '24px',
                            }}
                        >
                            <Typography
                                sx={{
                                    fontWeight: 700,
                                    fontSize: '30px',
                                    color: '#063455',
                                }}
                            >
                                Payroll Dashboard
                            </Typography>

                            {/* Right-side buttons container */}
                            <div style={{ display: 'flex', gap: '12px', height: '40px' }}>
                                <IconButton
                                    onClick={fetchDashboardData}
                                    sx={{
                                        color: '#063455',
                                        border: '1px solid #063455',
                                        borderRadius: '16px',
                                    }}
                                    disabled={loading}
                                >
                                    <Refresh />
                                </IconButton>
                                <Button
                                    startIcon={<Settings />}
                                    style={{
                                        color: '#063455',
                                        // backgroundColor: '#FFFFFF',
                                        textTransform: 'none',
                                        border: '1px solid #7F7F7F',
                                        fontWeight: 500,
                                        fontSize: '14px',
                                        borderRadius: '16px'
                                    }}
                                    onClick={() => router.visit(route('employees.payroll.settings'))}
                                >
                                    Settings
                                </Button>
                                <Button
                                    startIcon={<Assessment />}
                                    style={{
                                        color: '#063455',
                                        // backgroundColor: '#FFFFFF',
                                        textTransform: 'none',
                                        border: '1px solid #7F7F7F',
                                        fontWeight: 500,
                                        fontSize: '14px',
                                        borderRadius: '16px'
                                    }}
                                    onClick={() => router.visit(route('employees.payroll.salaries'))}
                                >
                                    Manage Salaries
                                </Button>
                                <Button
                                    startIcon={<TrendingUp />}
                                    style={{
                                        color: 'white',
                                        backgroundColor: '#063455',
                                        textTransform: 'none',
                                        fontWeight: 500,
                                        fontSize: '14px',
                                        borderRadius: '16px'
                                    }}
                                    onClick={() => router.visit(route('employees.payroll.process'))}
                                >
                                    Process Payroll
                                </Button>
                            </div>
                        </div>
                        <Typography sx={{ color: '#063455', fontSize: '15px', fontWeight: '600' }}>
                            Manage allowances, overtime, taxes, and salary disbursement records
                        </Typography>

                        {/* Metric Cards */}
                        <Grid container spacing={3} sx={{ mb: 4, mt:'1rem' }}>
                            {[
                                {
                                    title: 'Total Employees',
                                    value: stats.total_employees || 0,
                                    icon: PeopleIcon,
                                    color: '#063455',
                                },
                                {
                                    title: 'Employees with Salary',
                                    value: stats.employees_with_salary || 0,
                                    icon: AccountBalance,
                                    color: '#063455',
                                },
                                {
                                    title: 'Current Period',
                                    value: stats.current_period?.period_name || 'No Active Period',
                                    icon: Schedule,
                                    color: '#063455',
                                    isText: true,
                                },
                                {
                                    title: 'Pending Payslips',
                                    value: stats.pending_payslips || 0,
                                    icon: Assessment,
                                    color: '#063455',
                                },
                                {
                                    title: 'This Month Payroll',
                                    value: stats.this_month_payroll ? formatCurrency(stats.this_month_payroll.total_net_amount) : 'Rs 0',
                                    icon: MonetizationOn,
                                    color: '#063455',
                                    isText: true,
                                },
                                {
                                    title: 'Active Employees',
                                    value: stats.active_employees || 0,
                                    icon: TrendingUp,
                                    color: '#063455',
                                },
                            ].map((item, index) => (
                                <Grid item xs={12} sm={6} md={4} key={index}>
                                    <Card
                                        sx={{
                                            background: item.color,
                                            color: 'white',
                                            borderRadius: '16px',
                                            height: '140px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            p: 3,
                                            boxShadow: `0 4px 20px ${item.color}40`,
                                            transition: 'transform 0.2s ease-in-out',
                                            '&:hover': {
                                                transform: 'translateY(-2px)',
                                                boxShadow: `0 6px 25px ${item.color}60`,
                                            },
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                // backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                                borderRadius: '50%',
                                                width: '60px',
                                                height: '60px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                mr: 2,
                                            }}
                                        >
                                            <item.icon style={{ color: '#fff', fontSize: '32px' }} />
                                        </Box>
                                        <Box>
                                            <Typography variant="body2" sx={{ opacity: 0.9, mb: 0.5 }}>
                                                {item.title}
                                            </Typography>
                                            <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#fff' }}>
                                                {loading ? '...' : item.isText ? item.value : item.value.toLocaleString()}
                                            </Typography>
                                        </Box>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>

                        {/* Recent Payroll Periods Section */}
                        <Box sx={{ mb: 4 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                <Typography variant="h5" sx={{ color: '#063455', fontWeight: 600 }}>
                                    Recent Payroll Periods
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Button
                                        variant="outlined"
                                        onClick={() => router.visit(route('employees.payroll.payslips'))}
                                        sx={{
                                            color: '#063455',
                                            borderColor: '#063455',
                                            textTransform: 'none',
                                            borderRadius: '16px',
                                            '&:hover': {
                                                borderColor: '#052d45',
                                                // backgroundColor: 'rgba(6, 52, 85, 0.04)',
                                            },
                                        }}
                                    >
                                        View All Payslips
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        onClick={() => router.visit(route('employees.payroll.periods'))}
                                        sx={{
                                            color: '#063455',
                                            borderColor: '#063455',
                                            textTransform: 'none',
                                            borderRadius: '16px',
                                            '&:hover': {
                                                borderColor: '#052d45',
                                                backgroundColor: 'rgba(6, 52, 85, 0.04)',
                                            },
                                        }}
                                    >
                                        View All Periods
                                    </Button>
                                </Box>
                            </Box>
                            <TableContainer
                                component={Paper}
                                sx={{
                                    borderRadius: '16px',
                                    // boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                                    // border: '1px solid #e0e0e0',
                                }}
                            >
                                <Table>
                                    <TableHead>
                                        <TableRow sx={{ backgroundColor: '#063455' }}>
                                            <TableCell sx={{ fontWeight: 600, color: '#fff', }}>Period Name</TableCell>
                                            <TableCell sx={{ fontWeight: 600, color: '#fff', }}>Date Range</TableCell>
                                            <TableCell sx={{ fontWeight: 600, color: '#fff', }}>Status</TableCell>
                                            <TableCell sx={{ fontWeight: 600, color: '#fff', }}>Employees</TableCell>
                                            <TableCell sx={{ fontWeight: 600, color: '#fff', }}>Net Amount</TableCell>
                                            <TableCell sx={{ fontWeight: 600, color: '#fff', }}>Actions</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {loading ? (
                                            <TableRow>
                                                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                                                    <CircularProgress sx={{ color: '#063455' }} />
                                                </TableCell>
                                            </TableRow>
                                        ) : recentPeriods.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                                                    <Typography color="textSecondary">No payroll periods found</Typography>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            recentPeriods.map((period, index) => (
                                                <TableRow
                                                    key={period.id}
                                                    sx={{
                                                        '&:hover': { backgroundColor: '#f5f5f5' },
                                                        cursor: 'pointer',
                                                    }}
                                                    onClick={() => router.visit(route('employees.payroll.payslips.period', period.id))}
                                                >
                                                    <TableCell sx={{ fontWeight: 400, color: '#7f7f7f', fontSize: '14px' }}>{period.period_name}</TableCell>
                                                    <TableCell sx={{ fontWeight: 400, color: '#7f7f7f', fontSize: '14px' }}>
                                                        {new Date(period.start_date).toLocaleDateString()} - {new Date(period.end_date).toLocaleDateString()}
                                                    </TableCell>
                                                    <TableCell sx={{ fontWeight: 400, color: '#7f7f7f', fontSize: '14px' }}>
                                                        <Chip label={period.status} size="small" color={period.status === 'completed' ? 'success' : period.status === 'processing' ? 'warning' : period.status === 'paid' ? 'primary' : 'default'} />
                                                    </TableCell>
                                                    <TableCell sx={{ fontWeight: 400, color: '#7f7f7f', fontSize: '14px' }}>{period.total_employees || 0}</TableCell>
                                                    <TableCell sx={{ fontWeight: 400, color: '#7f7f7f', fontSize: '14px' }}>{formatCurrency(period.total_net_amount || 0)}</TableCell>
                                                    <TableCell>
                                                        <Button
                                                            size="small"
                                                            variant="outlined"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                router.visit(route('employees.payroll.payslips.period', period.id));
                                                            }}
                                                            sx={{
                                                                color: '#063455',
                                                                borderColor: '#063455',
                                                                textTransform: 'none',
                                                                fontSize: '12px',
                                                            }}
                                                        >
                                                            View Payslips
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Box>
                    </div>
                </Box>
            </div>
            {/* Error Snackbar */}
            <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: '100%' }}>
                    {error}
                </Alert>
            </Snackbar>
        </AdminLayout>
    );
};

export default PayrollDashboard;
