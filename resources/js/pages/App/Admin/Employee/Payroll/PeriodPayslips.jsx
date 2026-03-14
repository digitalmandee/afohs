import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import AdminLayout from '@/layouts/AdminLayout';
import { Box, Card, CardContent, Autocomplete, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Grid, Pagination, CircularProgress, Alert, Snackbar, TextField, InputAdornment, Tooltip, FormControl, InputLabel, Select, MenuItem, Checkbox, Avatar } from '@mui/material';
import { ArrowBack as ArrowBackIcon, Visibility as VisibilityIcon, Print as PrintIcon, Download as DownloadIcon, Search as SearchIcon, CheckCircle as CheckCircleIcon, Cancel as CancelIcon, Assignment as AssignmentIcon, FilterList as FilterListIcon, Person as PersonIcon, GetApp as GetAppIcon } from '@mui/icons-material';
import axios from 'axios';

const drawerWidth = 240;

const PeriodPayslips = ({ period }) => {
    const [payslips, setPayslips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [selectedPayslips, setSelectedPayslips] = useState([]);
    const [selectedPayslip, setSelectedPayslip] = useState(null);
    const [showPayslipDialog, setShowPayslipDialog] = useState(false);
    const [showOrdersDialog, setShowOrdersDialog] = useState(false);
    const [ordersForDialog, setOrdersForDialog] = useState([]);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    useEffect(() => {
        fetchPayslips();
    }, [currentPage, searchTerm, statusFilter]);

    const fetchPayslips = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`/api/payroll/periods/${period.id}/payslips`, {
                params: {
                    page: currentPage,
                    per_page: 15,
                    search: searchTerm,
                    status: statusFilter,
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
            console.error('Error fetching payslip:', error);
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

    const handleRejectPayslip = async (payslipId) => {
        if (window.confirm('Are you sure you want to reject this payslip?')) {
            try {
                const response = await axios.post(`/api/payroll/payslips/${payslipId}/reject`);
                if (response.data.success) {
                    showSnackbar('Payslip rejected successfully!', 'success');
                    fetchPayslips();
                }
            } catch (error) {
                console.error('Error rejecting payslip:', error);
                showSnackbar('Error rejecting payslip', 'error');
            }
        }
    };

    const handleRevertToDraft = async (payslipId) => {
        if (window.confirm('Are you sure you want to revert this payslip back to draft status?')) {
            try {
                const response = await axios.post(`/api/payroll/payslips/${payslipId}/revert-to-draft`);
                if (response.data.success) {
                    showSnackbar('Payslip reverted to draft successfully!', 'success');
                    fetchPayslips();
                }
            } catch (error) {
                console.error('Error reverting payslip:', error);
                showSnackbar('Error reverting payslip', 'error');
            }
        }
    };

    const handleBulkApprove = async () => {
        if (selectedPayslips.length === 0) {
            showSnackbar('Please select payslips to approve', 'warning');
            return;
        }

        try {
            const response = await axios.post('/api/payroll/payslips/bulk-approve', {
                payslip_ids: selectedPayslips,
            });
            if (response.data.success) {
                showSnackbar(`${selectedPayslips.length} payslips approved successfully!`, 'success');
                setSelectedPayslips([]);
                fetchPayslips();
            }
        } catch (error) {
            console.error('Error bulk approving payslips:', error);
            showSnackbar('Error approving payslips', 'error');
        }
    };

    const handleSelectPayslip = (payslipId) => {
        setSelectedPayslips((prev) => (prev.includes(payslipId) ? prev.filter((id) => id !== payslipId) : [...prev, payslipId]));
    };

    const handleSelectAll = () => {
        if (selectedPayslips.length === payslips.length) {
            setSelectedPayslips([]);
        } else {
            setSelectedPayslips(payslips.map((p) => p.id));
        }
    };

    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
        setCurrentPage(1);
    };

    const handlePageChange = (event, page) => {
        setCurrentPage(page);
    };

    const showSnackbar = (message, severity = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'approved':
                return 'success';
            case 'paid':
                return 'primary';
            case 'draft':
                return 'warning';
            case 'rejected':
                return 'error';
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
            case 'rejected':
                return 'Rejected';
            default:
                return status;
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

    const statusOptions = [
        { value: '', label: 'All Status' },
        { value: 'draft', label: 'Draft' },
        { value: 'approved', label: 'Approved' },
        { value: 'paid', label: 'Paid' },
        { value: 'rejected', label: 'Rejected' }
    ];

    return (
        <AdminLayout>
            <div style={{
                minHeight: '100vh',
                backgroundColor: '#f5f5f5',
                padding: '1rem'
            }}>

                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <IconButton onClick={() => window.history.back()}>
                            <ArrowBackIcon sx={{ color: '#063455' }} />
                        </IconButton>
                        <Box>
                            <Typography sx={{ color: '#063455', fontWeight: 700, fontSize: '30px' }}>
                                Period Payslips
                            </Typography>
                        </Box>
                        <Typography sx={{ ml: 5, color: '#063455', fontSize: '15px', fontWeight: '600' }}>
                            {period?.period_name} - {period ? new Date(period.start_date).toLocaleDateString() : ''} to {period ? new Date(period.end_date).toLocaleDateString() : ''}
                        </Typography>
                    </Box>
                    {/* <AssignmentIcon sx={{ fontSize: 40, color: '#063455', opacity: 0.7 }} /> */}
                </Box>

                {/* Filters and Actions */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={12} md={3}>
                        <TextField
                            fullWidth
                            placeholder="Search employees..."
                            value={searchTerm}
                            onChange={handleSearchChange}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon sx={{ color: '#063455' }} />
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
                                    borderRadius: '16px'
                                },
                                "& .MuiInputBase-input": {
                                    display: 'flex',
                                    alignItems: 'center',
                                    paddingY: 0,
                                    paddingTop: '2px',
                                },
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} md={3}>
                        {/* <FormControl fullWidth>
                            <InputLabel>Status Filter</InputLabel>
                            <Select value={statusFilter} label="Status Filter" onChange={(e) => setStatusFilter(e.target.value)}
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
                                }}>
                                <MenuItem value="">All Status</MenuItem>
                                <MenuItem value="draft">Draft</MenuItem>
                                <MenuItem value="approved">Approved</MenuItem>
                                <MenuItem value="paid">Paid</MenuItem>
                                <MenuItem value="rejected">Rejected</MenuItem>
                            </Select>
                        </FormControl> */}
                        <Autocomplete
                            value={statusOptions.find(s => s.value === statusFilter) || null}
                            onChange={(e, newValue) => setStatusFilter(newValue?.value || '')}
                            options={statusOptions}
                            getOptionLabel={(option) => option.label}
                            isOptionEqualToValue={(option, value) => option.value === value?.value}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Status Filter"
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
                    <Grid item xs={12} md={3}>
                        <Box sx={{ display: 'flex', gap: 1, height: '100%', alignItems: 'center' }}>
                            {selectedPayslips.length > 0 && (
                                <Button
                                    variant="contained"
                                    startIcon={<CheckCircleIcon />}
                                    onClick={handleBulkApprove}
                                    sx={{
                                        backgroundColor: '#2e7d32',
                                        '&:hover': { backgroundColor: '#1b5e20' },
                                    }}
                                >
                                    Approve ({selectedPayslips.length})
                                </Button>
                            )}
                        </Box>
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <Card sx={{ backgroundColor: '#063455', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between', px:2, height: 40 }}>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                {payslips.length}
                            </Typography>
                            <Typography variant="body2">Total Payslips</Typography>
                        </Card>
                    </Grid>
                </Grid>

                {/* Payslips Table */}
                {/* <Card> */}
                    <TableContainer component={Paper} sx={{borderRadius:'16px', overflowX:'auto'}}>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ backgroundColor: '#063455' }}>
                                    <TableCell sx={{ fontWeight: 600, color: '#fff' }}>
                                        <Checkbox checked={selectedPayslips.length === payslips.length && payslips.length > 0} indeterminate={selectedPayslips.length > 0 && selectedPayslips.length < payslips.length} onChange={handleSelectAll} sx={{ color: '#063455' }} />
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#fff', whiteSpace:'nowrap' }}>Employee</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#fff', whiteSpace:'nowrap' }}>Employee ID</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#fff', whiteSpace:'nowrap' }}>Department</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#fff', whiteSpace:'nowrap' }}>Gross Salary</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#fff', whiteSpace:'nowrap' }}>Deductions</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#fff', whiteSpace:'nowrap' }}>Net Salary</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#fff', whiteSpace:'nowrap' }}>Status</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#fff', whiteSpace:'nowrap' }}>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                                            <CircularProgress sx={{ color: '#063455' }} />
                                        </TableCell>
                                    </TableRow>
                                ) : payslips.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                                            <Typography color="textSecondary">No payslips found for this period</Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    payslips.map((payslip) => (
                                        <TableRow
                                            key={payslip.id}
                                            sx={{
                                                '&:hover': { backgroundColor: '#f5f5f5' },
                                                backgroundColor: selectedPayslips.includes(payslip.id) ? '#e3f2fd' : 'inherit',
                                            }}
                                        >
                                            <TableCell sx={{ fontWeight: 400, color: '#7f7f7f', fontSize:'14px' }}>
                                                <Checkbox checked={selectedPayslips.includes(payslip.id)} onChange={() => handleSelectPayslip(payslip.id)} sx={{ color: '#063455' }} />
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 400, color: '#7f7f7f', fontSize:'14px' }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Avatar sx={{ width: 32, height: 32, backgroundColor: '#063455' }}>
                                                        <PersonIcon fontSize="small" />
                                                    </Avatar>
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                                        {payslip.employee?.user?.name || payslip.employee?.name || 'N/A'}
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 400, color: '#7f7f7f', fontSize:'14px' }}>{payslip.employee?.employee_id || 'N/A'}</TableCell>
                                            <TableCell sx={{ fontWeight: 400, color: '#7f7f7f', fontSize:'14px' }}>{payslip.employee?.department?.name || 'N/A'}</TableCell>
                                            <TableCell>
                                                <Typography sx={{ fontWeight: 400, color: '#2e7d32', borderRadius: '4px' }}>{formatCurrency(payslip.gross_salary)}</Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography sx={{ fontWeight: 600, color: '#d32f2f', borderRadius: '4px' }}>{formatCurrency(payslip.total_deductions)}</Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography sx={{ fontWeight: 600, color: '#063455', borderRadius: '4px' }}>{formatCurrency(payslip.net_salary)}</Typography>
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 400, color: '#7f7f7f', fontSize:'14px' }}>
                                                <Chip label={getStatusText(payslip.status)} size="small" color={getStatusColor(payslip.status)} sx={{ fontWeight: 600 }} />
                                            </TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', gap: 1 }}>
                                                    <Tooltip title="View Details">
                                                        <IconButton size="small" onClick={() => handleViewPayslip(payslip.id)} sx={{ color: '#063455' }}>
                                                            <VisibilityIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    {payslip.status === 'draft' && (
                                                        <>
                                                            <Tooltip title="Approve Payslip">
                                                                <IconButton size="small" onClick={() => handleApprovePayslip(payslip.id)} sx={{ color: '#063455' }}>
                                                                    <CheckCircleIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                            <Tooltip title="Reject Payslip">
                                                                <IconButton size="small" onClick={() => handleRejectPayslip(payslip.id)} sx={{ color: '#d32f2f' }}>
                                                                    <CancelIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        </>
                                                    )}
                                                    {payslip.status === 'approved' && (
                                                        <Tooltip title="Revert to Draft">
                                                            <IconButton size="small" onClick={() => handleRevertToDraft(payslip.id)} sx={{ color: '#ff9800' }}>
                                                                <CancelIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    )}
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
                                onChange={(event, page) => setCurrentPage(page)}
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
                            Payslip Details
                        </Typography>
                    </DialogTitle>
                    <DialogContent>
                        {selectedPayslip && (
                            <Box sx={{ mt: 2 }}>
                                <Grid container spacing={3}>
                                    <Grid item xs={12} md={6}>
                                        <Typography variant="subtitle2" color="textSecondary">
                                            Employee Name
                                        </Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 600, mb: 2 }}>
                                            {selectedPayslip.employee?.user?.name || selectedPayslip.employee?.name || 'N/A'}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <Typography variant="subtitle2" color="textSecondary">
                                            Employee ID
                                        </Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 600, mb: 2 }}>
                                            {selectedPayslip.employee?.employee_id || 'N/A'}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <Typography variant="subtitle2" color="textSecondary">
                                            Basic Salary
                                        </Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 600, mb: 2 }}>
                                            {formatCurrency(selectedPayslip.basic_salary)}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <Typography variant="subtitle2" color="textSecondary">
                                            Total Allowances
                                        </Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 600, mb: 2, color: '#2e7d32' }}>
                                            {formatCurrency(selectedPayslip.total_allowances)}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <Typography variant="subtitle2" color="textSecondary">
                                            Total Deductions
                                        </Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 600, mb: 2, color: '#d32f2f' }}>
                                            {formatCurrency(selectedPayslip.total_deductions)}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <Typography variant="subtitle2" color="textSecondary">
                                            Net Salary
                                        </Typography>
                                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#063455' }}>
                                            {formatCurrency(selectedPayslip.net_salary)}
                                        </Typography>
                                    </Grid>
                                </Grid>
                            </Box>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setShowPayslipDialog(false)}>Close</Button>
                        <Button
                            variant="contained"
                            sx={{
                                backgroundColor: '#063455',
                                '&:hover': { backgroundColor: '#052d45' },
                            }}
                        >
                            Print Payslip
                        </Button>
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

                {/* Snackbar */}
                <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                    <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                        {snackbar.message}
                    </Alert>
                </Snackbar>
            </div>
        </AdminLayout>
    );
};

export default PeriodPayslips;
