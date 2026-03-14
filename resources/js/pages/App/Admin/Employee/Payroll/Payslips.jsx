import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import AdminLayout from '@/layouts/AdminLayout';
import { Box, Card, Typography, Autocomplete, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, TextField, InputAdornment, IconButton, Pagination, CircularProgress, Alert, Snackbar, Tooltip, Avatar, FormControl, InputLabel, Select, MenuItem, Grid, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { Search as SearchIcon, Visibility as VisibilityIcon, GetApp as GetAppIcon, CheckCircle as CheckCircleIcon, ArrowBack as ArrowBackIcon, Person as PersonIcon, FilterList as FilterListIcon, Print as PrintIcon, FilterAlt } from '@mui/icons-material';
import axios from 'axios';

const Payslips = () => {
    const [payslips, setPayslips] = useState([]);
    const [periods, setPeriods] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPeriod, setSelectedPeriod] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedPayslip, setSelectedPayslip] = useState(null);
    const [showPayslipDialog, setShowPayslipDialog] = useState(false);
    const [showOrdersDialog, setShowOrdersDialog] = useState(false);
    const [ordersForDialog, setOrdersForDialog] = useState([]);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    useEffect(() => {
        fetchPeriods();
    }, []);

    useEffect(() => {
        if (periods.length > 0 && !selectedPeriod) {
            // Auto-select the most recent period
            const recentPeriod = periods.find((p) => p.status === 'processing') || periods[0];
            setSelectedPeriod(recentPeriod?.id || '');
        }
    }, [periods]);

    useEffect(() => {
        if (selectedPeriod) {
            fetchPayslips();
        }
    }, [currentPage, searchTerm, selectedPeriod, statusFilter]);

    const fetchPeriods = async () => {
        try {
            const response = await axios.get('/api/payroll/periods');
            if (response.data.success) {
                setPeriods(response.data.periods.data || []);
            }
        } catch (error) {
            console.error('Error fetching periods:', error);
            showSnackbar('Error loading payroll periods', 'error');
        }
    };

    const fetchPayslips = async () => {
        if (!selectedPeriod) return;

        setLoading(true);
        try {
            const response = await axios.get(`/api/payroll/periods/${selectedPeriod}/payslips`, {
                params: {
                    page: currentPage,
                    search: searchTerm,
                    status: statusFilter,
                    per_page: 15,
                },
            });

            if (response.data.success) {
                setPayslips(response.data.payslips.data || []);
                setTotalPages(response.data.payslips.last_page || 1);
            }
        } catch (error) {
            console.error('Error fetching payslips:', error);
            showSnackbar('Error loading payslips', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleViewPayslip = async (payslipId) => {
        try {
            const response = await axios.get(`/api/payroll/payslips/${payslipId}`);
            if (response.data.success) {
                setSelectedPayslip(response.data.payslip);
                setShowPayslipDialog(true);
            }
        } catch (error) {
            console.error('Error fetching payslip details:', error);
            showSnackbar('Error loading payslip details', 'error');
        }
    };

    const handleApprovePayslip = async (payslipId) => {
        try {
            const response = await axios.post(`/api/payroll/payslips/${payslipId}/approve`);
            if (response.data.success) {
                showSnackbar('Payslip approved successfully!', 'success');
                fetchPayslips();
            }
        } catch (error) {
            console.error('Error approving payslip:', error);
            showSnackbar('Error approving payslip', 'error');
        }
    };

    const showSnackbar = (message, severity = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
        setCurrentPage(1);
    };

    const handlePageChange = (event, page) => {
        setCurrentPage(page);
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-PK', {
            style: 'currency',
            currency: 'PKR',
        })
            .format(amount || 0)
            .replace('PKR', 'Rs');
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'approved':
                return 'success';
            case 'paid':
                return 'primary';
            case 'draft':
                return 'warning';
            default:
                return 'default';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'approved':
                return 'Approved';
            case 'paid':
                return 'Paid';
            case 'draft':
                return 'Draft';
            default:
                return status;
        }
    };

    const statusOptions = [
        { value: '', label: 'All Status' },
        { value: 'draft', label: 'Draft' },
        { value: 'approved', label: 'Approved' },
        { value: 'paid', label: 'Paid' }
    ];

    return (
        <AdminLayout>
            <Box sx={{ bgcolor: '#f5f5f5', p: 2 }}>
                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <IconButton onClick={() => window.history.back()}>
                            <ArrowBackIcon sx={{ color: '#063455' }} />
                        </IconButton>
                        <Typography sx={{ color: '#063455', fontWeight: 700, fontSize: '30px' }}>
                            Payslips
                        </Typography>
                    </Box>
                </Box>

                {/* Filters */}
                <Box sx={{ mb: 3, bgcolor: 'transparent', border: 'none' }}>
                    <Grid container spacing={3} alignItems="center">
                        <Grid item xs={12} sm={6} md={3}>
                            {/* <FormControl fullWidth>
                                <InputLabel>Payroll Period</InputLabel>
                                <Select
                                    value={selectedPeriod}
                                    label="Payroll Period"
                                    onChange={(e) => {
                                        setSelectedPeriod(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    sx={{
                                        height: 40,
                                        display: 'flex',
                                        alignItems: 'center',
                                        "& .MuiInputBase-root": {
                                            height: 40,
                                            display: 'flex',
                                            alignItems: 'center',
                                        },
                                        "& .MuiInputBase-input": {
                                            display: 'flex',
                                            alignItems: 'center',
                                            paddingY: 0,
                                            paddingTop: '2px',
                                        },
                                    }}
                                >
                                    {periods.map((period) => (
                                        <MenuItem key={period.id} value={period.id}>
                                            {period.period_name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl> */}
                            <Autocomplete
                                value={periods.find(p => p.id === selectedPeriod) || null}
                                onChange={(e, newValue) => {
                                    setSelectedPeriod(newValue?.id || '');
                                    setCurrentPage(1);
                                }}
                                options={periods}
                                getOptionLabel={(option) => option.period_name}
                                isOptionEqualToValue={(option, value) => option.id === value?.id}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Payroll Period"
                                        size="small"
                                        fullWidth
                                        sx={{
                                            height: 40,
                                            '& .MuiOutlinedInput-root': {
                                                height: 40,
                                                borderRadius: '16px',
                                                display: 'flex',
                                                alignItems: 'center',
                                            },
                                            '& .MuiInputBase-input': {
                                                display: 'flex',
                                                alignItems: 'center',
                                                paddingY: 0,
                                                paddingTop: '2px',
                                            },
                                        }}
                                    />
                                )}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6} md={3}>
                            {/* <FormControl fullWidth>
                                <InputLabel>Status</InputLabel>
                                <Select
                                    value={statusFilter}
                                    label="Status"
                                    onChange={(e) => {
                                        setStatusFilter(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    sx={{
                                        height: 40,
                                        display: 'flex',
                                        alignItems: 'center',
                                        "& .MuiInputBase-root": {
                                            height: 40,
                                            display: 'flex',
                                            alignItems: 'center',
                                        },
                                        "& .MuiInputBase-input": {
                                            display: 'flex',
                                            alignItems: 'center',
                                            // paddingBottom: "20rem",
                                            // paddingBottom: '2rem',
                                        },
                                    }}
                                >
                                    <MenuItem value="">All Status</MenuItem>
                                    <MenuItem value="draft">Draft</MenuItem>
                                    <MenuItem value="approved">Approved</MenuItem>
                                    <MenuItem value="paid">Paid</MenuItem>
                                </Select>
                            </FormControl> */}
                            <Autocomplete
                                value={statusOptions.find(s => s.value === statusFilter) || null}
                                onChange={(e, newValue) => {
                                    setStatusFilter(newValue?.value || '');
                                    setCurrentPage(1);
                                }}
                                options={statusOptions}
                                getOptionLabel={(option) => option.label}
                                isOptionEqualToValue={(option, value) => option.value === value?.value}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Status"
                                        size="small"
                                        fullWidth
                                        sx={{
                                            height: 40,
                                            '& .MuiOutlinedInput-root': {
                                                height: 40,
                                                borderRadius: '16px',
                                                display: 'flex',
                                                alignItems: 'center',
                                            },
                                            '& .MuiInputBase-input': {
                                                display: 'flex',
                                                alignItems: 'center',
                                            },
                                        }}
                                    />
                                )}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6} md={4}>
                            <TextField
                                fullWidth
                                placeholder="Search employees..."
                                value={searchTerm}
                                onChange={handleSearchChange}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{
                                    height: 40,
                                    display: 'flex',
                                    alignItems: 'center',
                                    "& .MuiInputBase-root": {
                                        height: 40,
                                        display: 'flex',
                                        alignItems: 'center',
                                        borderRadius:'16px',
                                    },
                                    "& .MuiInputBase-input": {
                                        display: 'flex',
                                        alignItems: 'center',
                                        paddingY: 0,
                                        // paddingTop: '2px',
                                    },
                                }}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6} md={2}>
                            <Button
                                // fullWidth
                                variant="outlined"
                                // startIcon={<FilterListIcon />}
                                onClick={fetchPayslips}
                                sx={{
                                    bgcolor: '#063455',
                                    borderColor: '#063455',
                                    color: '#fff',
                                    borderRadius: '16px',
                                    gap: 2,
                                    textTransform:'none',
                                    '&:hover': { borderColor: '#052d45' },
                                }}
                            >
                                <SearchIcon fontSize="small" style={{ color: '#fff' }} />
                                Search
                            </Button>
                        </Grid>
                    </Grid>
                </Box>

                {/* Payslips Table */}
                {/* <Card> */}
                    <TableContainer sx={{ borderRadius: '16px', overflowX: 'auto' }}>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ backgroundColor: '#063455' }}>
                                    <TableCell sx={{ fontWeight: 600, color: '#fff' }}>Employee</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#fff' }}>Department</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#fff' }}>Basic Salary</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#fff' }}>Gross Salary</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#fff' }}>Net Salary</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#fff' }}>Status</TableCell>
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
                                ) : payslips.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                                            <Typography color="textSecondary">{selectedPeriod ? 'No payslips found for selected period' : 'Please select a payroll period'}</Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    payslips.map((payslip) => (
                                        <TableRow key={payslip.id} sx={{ '&:hover': { backgroundColor: '#f5f5f5' } }}>
                                            <TableCell sx={{ fontWeight: 400, color: '#7f7f7f', fontSize: '14px' }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                    <Avatar sx={{ bgcolor: '#063455', width: 40, height: 40 }}>
                                                        <PersonIcon />
                                                    </Avatar>
                                                    <Box>
                                                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                                            {payslip.employee?.name || 'N/A'}
                                                        </Typography>
                                                        <Typography variant="caption" color="textSecondary">
                                                            ID: {payslip.employee?.employee_id || 'N/A'}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 400, color: '#7f7f7f', fontSize: '14px' }}>{payslip.employee?.department?.name || 'N/A'}</TableCell>
                                            <TableCell sx={{ fontWeight: 400, color: '#7f7f7f', fontSize: '14px' }}>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                                    {formatCurrency(payslip.basic_salary)}
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 400, color: '#7f7f7f', fontSize: '14px' }}>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                                    {formatCurrency(payslip.gross_salary)}
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 400, color: '#7f7f7f', fontSize: '14px' }}>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#2e7d32' }}>
                                                    {formatCurrency(payslip.net_salary)}
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 400, color: '#7f7f7f', fontSize: '14px' }}>
                                                <Chip label={getStatusText(payslip.status)} size="small" color={getStatusColor(payslip.status)} />
                                            </TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', gap: 1 }}>
                                                    <Tooltip title="View Payslip">
                                                        <IconButton size="small" onClick={() => handleViewPayslip(payslip.id)} sx={{ color: '#063455' }}>
                                                            <VisibilityIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>

                                                    <Tooltip title="View Orders">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => {
                                                                setOrdersForDialog(payslip.order_deductions || []);
                                                                setShowOrdersDialog(true);
                                                            }}
                                                            sx={{ color: '#063455' }}
                                                        >
                                                            <GetAppIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Print Payslip">
                                                        <IconButton size="small" onClick={() => window.open(`/admin/employees/payroll/payslips/${payslip.id}/print`, '_blank')} sx={{ color: '#063455' }}>
                                                            <PrintIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>

                                                    {payslip.status === 'draft' && (
                                                        <Tooltip title="Approve Payslip">
                                                            <IconButton size="small" onClick={() => handleApprovePayslip(payslip.id)} sx={{ color: '#063455' }}>
                                                                <CheckCircleIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    )}
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

                {/* Payslip Details Dialog */}
                <Dialog open={showPayslipDialog} onClose={() => setShowPayslipDialog(false)} maxWidth="md" fullWidth>
                    <DialogTitle>
                        <Typography variant="h6" sx={{ color: '#063455', fontWeight: 600 }}>
                            Payslip Details - {selectedPayslip?.employee?.name}
                        </Typography>
                    </DialogTitle>
                    <DialogContent>
                        {selectedPayslip && (
                            <Grid container spacing={3} sx={{ mt: 1 }}>
                                {/* Employee Information */}
                                <Grid item xs={12} md={6}>
                                    <Card sx={{ p: 2 }}>
                                        <Typography variant="h6" sx={{ color: '#063455', mb: 2 }}>
                                            Employee Information
                                        </Typography>
                                        <Box sx={{ mb: 1 }}>
                                            <Typography variant="subtitle2" color="textSecondary">
                                                Name
                                            </Typography>
                                            <Typography variant="body1">{selectedPayslip.employee?.name}</Typography>
                                        </Box>
                                        <Box sx={{ mb: 1 }}>
                                            <Typography variant="subtitle2" color="textSecondary">
                                                Employee ID
                                            </Typography>
                                            <Typography variant="body1">{selectedPayslip.employee?.employee_id}</Typography>
                                        </Box>
                                        <Box sx={{ mb: 1 }}>
                                            <Typography variant="subtitle2" color="textSecondary">
                                                Department
                                            </Typography>
                                            <Typography variant="body1">{selectedPayslip.employee?.department?.name}</Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="subtitle2" color="textSecondary">
                                                Designation
                                            </Typography>
                                            <Typography variant="body1">{selectedPayslip.employee?.designation}</Typography>
                                        </Box>
                                    </Card>
                                </Grid>

                                {/* Salary Breakdown */}
                                <Grid item xs={12} md={6}>
                                    <Card sx={{ p: 2 }}>
                                        <Typography variant="h6" sx={{ color: '#063455', mb: 2 }}>
                                            Salary Breakdown
                                        </Typography>
                                        <Box sx={{ mb: 1 }}>
                                            <Typography variant="subtitle2" color="textSecondary">
                                                Basic Salary
                                            </Typography>
                                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                                {formatCurrency(selectedPayslip.basic_salary)}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ mb: 1 }}>
                                            <Typography variant="subtitle2" color="textSecondary">
                                                Total Allowances
                                            </Typography>
                                            <Typography variant="body1" sx={{ fontWeight: 600, color: '#2e7d32' }}>
                                                {formatCurrency(selectedPayslip.total_allowances)}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ mb: 1 }}>
                                            <Typography variant="subtitle2" color="textSecondary">
                                                Total Deductions
                                            </Typography>
                                            <Typography variant="body1" sx={{ fontWeight: 600, color: '#d32f2f' }}>
                                                {formatCurrency(selectedPayslip.total_deductions)}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ mb: 1 }}>
                                            <Typography variant="subtitle2" color="textSecondary">
                                                Gross Salary
                                            </Typography>
                                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                                {formatCurrency(selectedPayslip.gross_salary)}
                                            </Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="subtitle2" color="textSecondary">
                                                Net Salary
                                            </Typography>
                                            <Typography variant="h6" sx={{ fontWeight: 600, color: '#063455' }}>
                                                {formatCurrency(selectedPayslip.net_salary)}
                                            </Typography>
                                        </Box>
                                    </Card>
                                </Grid>

                                {/* Allowances */}
                                {selectedPayslip.allowances && selectedPayslip.allowances.length > 0 && (
                                    <Grid item xs={12} md={6}>
                                        <Card sx={{ p: 2 }}>
                                            <Typography variant="h6" sx={{ color: '#063455', mb: 2 }}>
                                                Allowances
                                            </Typography>
                                            {selectedPayslip.allowances.map((allowance, index) => (
                                                <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                                    <Typography variant="body2">{allowance.allowance_type?.name}</Typography>
                                                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#2e7d32' }}>
                                                        {formatCurrency(allowance.amount)}
                                                    </Typography>
                                                </Box>
                                            ))}
                                        </Card>
                                    </Grid>
                                )}

                                {/* Deductions */}
                                {selectedPayslip.deductions && selectedPayslip.deductions.length > 0 && (
                                    <Grid item xs={12} md={6}>
                                        <Card sx={{ p: 2 }}>
                                            <Typography variant="h6" sx={{ color: '#063455', mb: 2 }}>
                                                Deductions
                                            </Typography>
                                            {selectedPayslip.deductions.map((deduction, index) => (
                                                <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                                    <Typography variant="body2">{deduction.deduction_type?.name}</Typography>
                                                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#d32f2f' }}>
                                                        {formatCurrency(deduction.amount)}
                                                    </Typography>
                                                </Box>
                                            ))}
                                        </Card>
                                    </Grid>
                                )}
                            </Grid>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setShowPayslipDialog(false)}>Close</Button>
                        {selectedPayslip && (
                            <Button
                                onClick={() => window.open(`/admin/employees/payroll/payslips/${selectedPayslip.id}/print`, '_blank')}
                                variant="contained"
                                startIcon={<PrintIcon />}
                                sx={{
                                    backgroundColor: '#063455',
                                    '&:hover': { backgroundColor: '#052d45' },
                                }}
                            >
                                Print Payslip
                            </Button>
                        )}
                    </DialogActions>
                </Dialog>

                {/* Orders Dialog */}
                <Dialog open={showOrdersDialog} onClose={() => setShowOrdersDialog(false)} maxWidth="sm" fullWidth>
                    <DialogTitle>
                        <Typography variant="h6" sx={{ color: '#063455', fontWeight: 600 }}>
                            CTS Order Deductions
                        </Typography>
                    </DialogTitle>
                    <DialogContent>
                        {ordersForDialog.length === 0 ? (
                            <Box sx={{ py: 3 }}>
                                <Typography color="textSecondary">No CTS orders found for this payslip.</Typography>
                            </Box>
                        ) : (
                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Date</TableCell>
                                            <TableCell>Order ID</TableCell>
                                            <TableCell>Amount</TableCell>
                                            <TableCell>Note</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {ordersForDialog.map((o) => {
                                            const alreadyDeducted = !!o.deducted_at;
                                            return (
                                                <TableRow key={o.id} sx={{ opacity: alreadyDeducted ? 0.6 : 1, fontStyle: alreadyDeducted ? 'italic' : 'normal' }}>
                                                    <TableCell>{o.paid_at ? new Date(o.paid_at).toLocaleDateString() : '—'}</TableCell>
                                                    <TableCell>{o.id}</TableCell>
                                                    <TableCell>{formatCurrency(o.amount)}</TableCell>
                                                    <TableCell>
                                                        <Box>
                                                            <Typography variant="body2">{o.note || '—'}</Typography>
                                                            {o.deducted_at && (
                                                                <Typography variant="caption" color="textSecondary">
                                                                    Deducted: {new Date(o.deducted_at).toLocaleString()}
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setShowOrdersDialog(false)}>Close</Button>
                    </DialogActions>
                </Dialog>

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

export default Payslips;
