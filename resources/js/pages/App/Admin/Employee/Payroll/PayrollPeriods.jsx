import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import AdminLayout from '@/layouts/AdminLayout';
import { Box, Card, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, IconButton, Pagination, CircularProgress, Alert, Snackbar, Tooltip, Menu, MenuItem } from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Visibility as VisibilityIcon, MoreVert as MoreVertIcon, ArrowBack as ArrowBackIcon, PlayArrow as PlayArrowIcon, Assessment as AssessmentIcon, Payment as PaymentIcon } from '@mui/icons-material';
import axios from 'axios';
const PayrollPeriods = () => {
    const [periods, setPeriods] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedPeriod, setSelectedPeriod] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    useEffect(() => {
        fetchPeriods();
    }, [currentPage]);

    const fetchPeriods = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/payroll/periods', {
                params: {
                    page: currentPage,
                    per_page: 15,
                },
            });

            if (response.data.success) {
                setPeriods(response.data.periods.data || []);
                setTotalPages(response.data.periods.last_page || 1);
            }
        } catch (error) {
            console.error('Error fetching periods:', error);
            showSnackbar('Error loading payroll periods', 'error');
            setLoading(false);
        } finally {
            setLoading(false);
        }
    };

    const handleDeletePeriod = async (period) => {
        if (window.confirm(`Are you sure you want to delete the payroll period "${period.period_name}"?`)) {
            try {
                const response = await axios.delete(`/api/payroll/periods/${period.id}`);

                if (response.data.success) {
                    showSnackbar('Payroll period deleted successfully!', 'success');
                    fetchPeriods();
                }
            } catch (error) {
                console.error('Error deleting period:', error);
                showSnackbar('Error deleting payroll period', 'error');
            }
        }
        handleCloseMenu();
    };

    const handleMarkAsPaid = async (period) => {
        if (window.confirm(`Are you sure you want to mark the payroll period "${period.period_name}" as PAID?\n\nThis confirms that salaries have been transferred to employee accounts and will lock the period from further changes.`)) {
            try {
                const response = await axios.post(`/api/payroll/periods/${period.id}/mark-as-paid`);

                if (response.data.success) {
                    showSnackbar('Period marked as paid successfully!', 'success');
                    fetchPeriods();
                }
            } catch (error) {
                console.error('Error marking period as paid:', error);
                const message = error.response?.data?.message || 'Error marking period as paid';
                showSnackbar(message, 'error');
            }
        }
        handleCloseMenu();
    };

    const resetForm = () => {
        setFormData({
            period_name: '',
            start_date: null,
            end_date: null,
            pay_date: null,
        });
    };

    const handleEdit = (period) => {
        handleCloseMenu();
        router.visit(route('employees.payroll.periods.edit', period.id));
    };

    const handleMenuClick = (event, period) => {
        setAnchorEl(event.currentTarget);
        setSelectedPeriod(period);
    };

    const handleCloseMenu = () => {
        setAnchorEl(null);
        setSelectedPeriod(null);
    };

    const showSnackbar = (message, severity = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    const handlePageChange = (event, page) => {
        setCurrentPage(page);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed':
                return 'success';
            case 'processing':
                return 'warning';
            case 'paid':
                return 'primary';
            default:
                return 'default';
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

    return (
        <AdminLayout>
            <Box sx={{ bgcolor: '#f5f5f5', p: 2 }}>
                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <IconButton onClick={() => window.history.back()}>
                            <ArrowBackIcon sx={{color:'#063455'}} />
                        </IconButton>
                        <Typography sx={{ color: '#063455', fontWeight: 700, fontSize:'30px' }}>
                            Payroll Periods
                        </Typography>
                    </Box>
                    <Button
                        startIcon={<AddIcon />}
                        onClick={() => router.visit(route('employees.payroll.periods.create'))}
                        variant="contained"
                        sx={{
                            backgroundColor: '#063455',
                            borderRadius:'16px',
                            textTransform:'capitalize',
                            '&:hover': { backgroundColor: '#052d45' },
                        }}
                    >
                        Create New Period
                    </Button>
                </Box>

                {/* Periods Table */}
                {/* <Card> */}
                    <TableContainer component={Paper} sx={{borderRadius:'16px', overflowX:'auto'}}>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ backgroundColor: '#063455' }}>
                                    <TableCell sx={{ fontWeight: 600, color: '#fff' }}>Period Name</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#fff' }}>Date Range</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#fff' }}>Pay Date</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#fff' }}>Status</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#fff' }}>Employees</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#fff' }}>Net Amount</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#fff' }}>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                                            <CircularProgress sx={{ color: '#063455' }} />
                                        </TableCell>
                                    </TableRow>
                                ) : periods.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                                            <Typography color="textSecondary">No payroll periods found</Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    periods.map((period) => (
                                        <TableRow key={period.id} sx={{ '&:hover': { backgroundColor: '#f5f5f5' } }}>
                                            <TableCell sx={{ fontWeight: 400, color: '#7f7f7f', fontSize:'14px' }}>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                                    {period.period_name}
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 400, color: '#7f7f7f', fontSize:'14px' }}>
                                                {new Date(period.start_date).toLocaleDateString()} - {new Date(period.end_date).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 400, color: '#7f7f7f', fontSize:'14px' }}>{period.pay_date ? new Date(period.pay_date).toLocaleDateString() : 'Not Set'}</TableCell>
                                            <TableCell sx={{ fontWeight: 400, color: '#7f7f7f', fontSize:'14px' }}>
                                                <Chip label={period.status} size="small" color={getStatusColor(period.status)} />
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 400, color: '#7f7f7f', fontSize:'14px' }}>{period.total_employees || 0}</TableCell>
                                            <TableCell>{formatCurrency(period.total_net_amount || 0)}</TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', gap: 1 }}>
                                                    <Tooltip title="View Payslips">
                                                        <IconButton size="small" onClick={() => router.visit(route('employees.payroll.payslips.period', period.id))} sx={{ color: '#063455' }}>
                                                            <VisibilityIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>

                                                    {period.status === 'draft' && (
                                                        <Tooltip title="Process Payroll">
                                                            <IconButton size="small" onClick={() => router.visit(route('employees.payroll.process'))} sx={{ color: '#063455' }}>
                                                                <PlayArrowIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    )}

                                                    <Tooltip title="More Actions">
                                                        <IconButton size="small" onClick={(e) => handleMenuClick(e, period)} sx={{ color: '#063455' }}>
                                                            <MoreVertIcon fontSize="small" sx={{color:'#063455'}} />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                            <Pagination
                                count={totalPages}
                                page={currentPage}
                                onChange={handlePageChange}
                                color="primary"
                                sx={{
                                    '& .MuiPaginationItem-root': {
                                        color: '#063455',
                                    },
                                    '& .Mui-selected': {
                                        backgroundColor: '#063455',
                                        color: 'white',
                                    },
                                }}
                            />
                        </Box>
                    )}
                {/* </Card> */}

                {/* Context Menu */}
                <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleCloseMenu}>
                    <MenuItem onClick={() => handleEdit(selectedPeriod)}>
                        <EditIcon sx={{ mr: 1, fontSize: 20 }} />
                        Edit Period
                    </MenuItem>
                    <MenuItem onClick={() => router.visit(route('employees.payroll.reports.summary', selectedPeriod?.id))}>
                        <AssessmentIcon sx={{ mr: 1, fontSize: 20 }} />
                        View Reports
                    </MenuItem>
                    {selectedPeriod?.status === 'completed' && (
                        <MenuItem onClick={() => handleMarkAsPaid(selectedPeriod)} sx={{ color: '#2e7d32' }}>
                            <PaymentIcon sx={{ mr: 1, fontSize: 20 }} />
                            Mark as Paid
                        </MenuItem>
                    )}
                    <MenuItem onClick={() => handleDeletePeriod(selectedPeriod)} sx={{ color: 'error.main' }}>
                        <DeleteIcon sx={{ mr: 1, fontSize: 20 }} />
                        Delete Period
                    </MenuItem>
                </Menu>

                {/* Snackbar for notifications */}
                <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                    <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                        {snackbar.message}
                    </Alert>
                </Snackbar>
            </Box>
        </AdminLayout>
    );
};

export default PayrollPeriods;
