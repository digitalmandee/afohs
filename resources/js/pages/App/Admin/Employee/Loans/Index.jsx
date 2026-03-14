import { useState } from 'react';
import { router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import AdminLayout from '@/layouts/AdminLayout';
import { Search, Visibility } from '@mui/icons-material';
import { Box, Card, CardContent, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, FormControl, InputLabel, Select, MenuItem, Grid, Chip, TextField, Pagination, LinearProgress, Autocomplete } from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Check as CheckIcon, Close as CloseIcon, Payment as PaymentIcon, LocalAtm as DisbursedIcon } from '@mui/icons-material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';

const formatCurrency = (amount) => `Rs ${parseFloat(amount || 0).toLocaleString()}`;

const getStatusColor = (status) => {
    const colors = { pending: 'warning', approved: 'info', rejected: 'error', disbursed: 'primary', completed: 'success' };
    return colors[status] || 'default';
};

const Index = ({ loans, employees = [], stats = {}, filters = {} }) => {
    const [selectedEmployee, setSelectedEmployee] = useState(filters.employee_id || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || '');
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');

    const handleFilter = () => {
        router.get(
            route('employees.loans.index'),
            {
                employee_id: selectedEmployee || undefined,
                status: selectedStatus || undefined,
                date_from: dateFrom || undefined,
                date_to: dateTo || undefined,
            },
            { preserveState: true },
        );
    };

    const handleApprove = (id) => {
        if (confirm('Approve this loan application?')) {
            router.post(route('employees.loans.approve', id));
        }
    };

    const handleReject = (id) => {
        if (confirm('Reject this loan application?')) {
            router.post(route('employees.loans.reject', id));
        }
    };

    const handleDisburse = (id) => {
        if (confirm('Mark this loan as disbursed? Monthly deductions will start from next month.')) {
            router.post(route('employees.loans.disburse', id));
        }
    };

    const handleDelete = (id) => {
        if (confirm('Delete this loan application?')) {
            router.delete(route('employees.loans.destroy', id));
        }
    };

    return (
        <AdminLayout>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
                <Box sx={{ bgcolor: '#f5f5f5', minHeight: '100vh', p: 3 }}>
                    {/* Header */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography sx={{ color: '#063455', fontWeight: 700, fontSize: '30px' }}>
                            Employee Loans
                        </Typography>
                        <Button variant="contained" startIcon={<AddIcon />} onClick={() => router.visit(route('employees.loans.create'))}
                            sx={{ backgroundColor: '#063455', textTransform: 'none', borderRadius: '16px' }}>
                            New Loan Application
                        </Button>
                    </Box>

                    {/* Stats Cards */}
                    <Grid container spacing={2}>
                        <Grid item xs={6} sm={2}>
                            <Card sx={{ borderRadius: '12px', textAlign: 'center', p: 2, bgcolor: "#063455" }}>
                                <Typography sx={{ color: '#fff', fontSize: '14px' }}>
                                    Total Loans
                                </Typography>
                                <Typography variant="h5" sx={{ fontWeight: 600, color: '#fff' }}>
                                    {stats.total_loans || 0}
                                </Typography>
                            </Card>
                        </Grid>
                        <Grid item xs={6} sm={2}>
                            <Card sx={{ borderRadius: '12px', textAlign: 'center', p: 2, bgcolor: "#063455" }}>
                                <Typography sx={{ color: '#fff', fontSize: '14px' }}>
                                    Pending
                                </Typography>
                                <Typography variant="h5" sx={{ fontWeight: 600, color: '#fff' }}>
                                    {stats.pending_count || 0}
                                </Typography>
                            </Card>
                        </Grid>
                        <Grid item xs={6} sm={2}>
                            <Card sx={{ borderRadius: '12px', textAlign: 'center', p: 2, bgcolor: "#063455" }}>
                                <Typography sx={{ color: '#fff', fontSize: '14px' }}>
                                    Active
                                </Typography>
                                <Typography variant="h5" sx={{ fontWeight: 600, color: '#fff' }}>
                                    {stats.active_count || 0}
                                </Typography>
                            </Card>
                        </Grid>
                        <Grid item xs={6} sm={2}>
                            <Card sx={{ borderRadius: '12px', textAlign: 'center', p: 2, bgcolor: "#063455" }}>
                                <Typography sx={{ color: '#fff', fontSize: '14px' }}>
                                    Disbursed
                                </Typography>
                                <Typography variant="h6" sx={{ fontWeight: 600, color: '#fff' }}>
                                    {formatCurrency(stats.total_disbursed)}
                                </Typography>
                            </Card>
                        </Grid>
                        <Grid item xs={6} sm={2}>
                            <Card sx={{ borderRadius: '12px', textAlign: 'center', p: 2, backgroundColor: '#063455' }}>
                                <Typography variant="body2" sx={{ color: '#fff' }}>
                                    Outstanding
                                </Typography>
                                <Typography variant="h6" sx={{ fontWeight: 700, color: '#fff' }}>
                                    {formatCurrency(stats.total_outstanding)}
                                </Typography>
                            </Card>
                        </Grid>
                        <Grid item xs={6} sm={2}>
                            <Card sx={{ borderRadius: '12px', textAlign: 'center', p: 2, backgroundColor: '#063455' }}>
                                <Typography variant="body2" sx={{ color: '#ccc' }}>
                                    Recovered
                                </Typography>
                                <Typography variant="h6" sx={{ fontWeight: 700, color: '#fff' }}>
                                    {formatCurrency(stats.total_recovered)}
                                </Typography>
                            </Card>
                        </Grid>
                    </Grid>

                    {/* Filters */}
                    <Card sx={{ mb: 3, pt: 5, borderRadius: '12px', bgcolor: 'transparent', boxShadow: 'none' }}>
                        {/* <CardContent> */}
                        <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} sm={2.5}>
                                <Autocomplete
                                    options={employees}
                                    getOptionLabel={(option) => `${option.name} (${option.employee_id || option.id})`}
                                    value={employees.find((e) => e.id === selectedEmployee) || null}
                                    onChange={(event, newValue) => {
                                        setSelectedEmployee(newValue ? newValue.id : '');
                                    }}
                                    ListboxProps={{
                                        sx: {
                                            maxHeight: '350px',
                                            overflowY: 'auto',
                                            '& .MuiAutocomplete-option': {
                                                borderRadius: '16px',
                                                mx: '8px',
                                                my: '0.3px',
                                                // transition: 'all 0.2s ease',
                                            },
                                            '& .MuiAutocomplete-option:hover': {
                                                backgroundColor: '#063455',
                                                color: '#fff',
                                            },
                                            '& .MuiAutocomplete-option[aria-selected="true"]': {
                                                backgroundColor: '#063455',
                                                color: '#fff',
                                            },
                                            '& .MuiAutocomplete-option.Mui-focused': {
                                                backgroundColor: '#063455',
                                                color: '#fff',
                                            },
                                        },
                                    }}
                                    renderInput={(params) => <TextField {...params} label="Employee" size="small"
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: '16px',

                                                '& fieldset': {
                                                    borderRadius: '16px',
                                                },
                                            },
                                        }} />}
                                />
                            </Grid>
                            <Grid item xs={12} sm={2.5}>
                                <FormControl fullWidth size="small"
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: '16px',

                                            '& fieldset': {
                                                borderRadius: '16px',
                                            },
                                        },
                                    }}>
                                    <InputLabel>Status</InputLabel>
                                    <Select value={selectedStatus}
                                        label="Status"
                                        onChange={(e) => setSelectedStatus(e.target.value)}
                                        MenuProps={{
                                            PaperProps: {
                                                sx: {
                                                    borderRadius: '16px',
                                                    maxHeight: '300px',
                                                    overflowY: 'auto', 
                                                },
                                            },
                                            MenuListProps: {
                                                sx: {
                                                    '& .MuiMenuItem-root': {
                                                        borderRadius: '16px',
                                                        mx: '8px',
                                                        my:'1px'
                                                        // transition: 'all 0.2s ease',
                                                    },
                                                    '& .MuiMenuItem-root:hover': {
                                                        backgroundColor: '#063455',
                                                        color: '#fff',
                                                    },
                                                    '& .MuiMenuItem-root.Mui-selected': {
                                                        backgroundColor: '#063455',
                                                        color: '#fff',
                                                    },
                                                    '& .MuiMenuItem-root.Mui-selected:hover': {
                                                        backgroundColor: '#063455',
                                                        color: '#fff',
                                                    },
                                                },
                                            },
                                        }}>
                                        <MenuItem value="">All Status</MenuItem>
                                        <MenuItem value="pending">Pending</MenuItem>
                                        <MenuItem value="approved">Approved</MenuItem>
                                        <MenuItem value="rejected">Rejected</MenuItem>
                                        <MenuItem value="disbursed">Disbursed</MenuItem>
                                        <MenuItem value="completed">Completed</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={2}>
                                <DatePicker
                                    label="From"
                                    value={dateFrom ? dayjs(dateFrom) : null}
                                    onChange={(newValue) => setDateFrom(newValue ? newValue.format('YYYY-MM-DD') : '')}
                                    slotProps={{
                                        textField: {
                                            size: 'small',
                                            fullWidth: true,
                                            onClick: (e) => e.target.closest('.MuiFormControl-root').querySelector('button')?.click(),
                                        },
                                        actionBar: { actions: ['clear', 'today', 'cancel', 'accept'] },
                                    }}
                                    sx={{
                                        '& .MuiInputBase-root, & .MuiOutlinedInput-root, & fieldset': {
                                            borderRadius: '16px !important',
                                        },
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={2}>
                                <DatePicker
                                    label="To"
                                    value={dateTo ? dayjs(dateTo) : null}
                                    onChange={(newValue) => setDateTo(newValue ? newValue.format('YYYY-MM-DD') : '')}
                                    slotProps={{
                                        textField: {
                                            size: 'small',
                                            fullWidth: true,
                                            onClick: (e) => e.target.closest('.MuiFormControl-root').querySelector('button')?.click(),
                                        },
                                        actionBar: { actions: ['clear', 'today', 'cancel', 'accept'] },
                                    }}
                                    sx={{
                                        '& .MuiInputBase-root, & .MuiOutlinedInput-root, & fieldset': {
                                            borderRadius: '16px !important',
                                        },
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={2.5} sx={{ display: 'flex', gap: 1 }}>
                                <Button variant="contained" startIcon={<Search />} onClick={handleFilter} sx={{ backgroundColor: '#063455', borderRadius: '16px', px: 4, textTransform: 'none' }}>
                                    Search
                                </Button>
                                <Button variant="outlined" onClick={() => router.visit(route('employees.loans.index'))} sx={{ border: '1px solid #063455', color: '#063455', borderRadius: '16px', px: 4, textTransform: 'none' }}>
                                    Reset
                                </Button>
                            </Grid>
                        </Grid>
                        {/* </CardContent> */}
                    </Card>

                    {/* Table */}
                    <Card sx={{ borderRadius: '12px' }}>
                        <TableContainer component={Paper}>
                            <Table>
                                <TableHead>
                                    <TableRow sx={{ backgroundColor: '#063455' }}>
                                        <TableCell sx={{ color: '#fff', fontWeight: 600 }}>ID</TableCell>
                                        <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Employee</TableCell>
                                        <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Date</TableCell>
                                        <TableCell sx={{ color: '#fff', fontWeight: 600 }} align="right">
                                            Amount
                                        </TableCell>
                                        <TableCell sx={{ color: '#fff', fontWeight: 600 }} align="center">
                                            Installments
                                        </TableCell>
                                        <TableCell sx={{ color: '#fff', fontWeight: 600 }} align="right">
                                            Paid
                                        </TableCell>
                                        <TableCell sx={{ color: '#fff', fontWeight: 600 }} align="right">
                                            Pending
                                        </TableCell>
                                        <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Progress</TableCell>
                                        <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Status</TableCell>
                                        <TableCell sx={{ color: '#fff', fontWeight: 600 }} align="center">
                                            Actions
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {loans.data?.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                                                <Typography color="textSecondary">No loans found</Typography>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        loans.data?.map((loan, index) => (
                                            <TableRow key={loan.id} sx={{ '&:hover': { backgroundColor: '#f5f5f5' } }}>
                                                <TableCell>{index + 1}</TableCell>
                                                <TableCell sx={{ fontWeight: 500 }}>{loan.employee?.name}</TableCell>
                                                <TableCell>{loan.loan_date}</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 600 }}>
                                                    {formatCurrency(loan.amount)}
                                                </TableCell>
                                                <TableCell align="center">
                                                    {loan.installments_paid || 0}/{loan.installments}
                                                </TableCell>
                                                <TableCell align="right" sx={{ color: '#4caf50' }}>
                                                    {formatCurrency(loan.total_paid)}
                                                </TableCell>
                                                <TableCell align="right" sx={{ color: '#d32f2f' }}>
                                                    {formatCurrency(loan.remaining_amount)}
                                                </TableCell>
                                                <TableCell sx={{ minWidth: 120 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <LinearProgress variant="determinate" value={(loan.total_paid / loan.amount) * 100 || 0} sx={{ flex: 1, height: 8, borderRadius: 4 }} />
                                                        <Typography variant="caption">{Math.round((loan.total_paid / loan.amount) * 100) || 0}%</Typography>
                                                    </Box>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip label={loan.status} size="small" color={getStatusColor(loan.status)} />
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                                                        {loan.status === 'pending' && (
                                                            <>
                                                                <IconButton size="small" color="success" onClick={() => handleApprove(loan.id)} title="Approve">
                                                                    <CheckIcon fontSize="small" />
                                                                </IconButton>
                                                                <IconButton size="small" color="error" onClick={() => handleReject(loan.id)} title="Reject">
                                                                    <CloseIcon fontSize="small" />
                                                                </IconButton>
                                                                <IconButton size="small" onClick={() => router.visit(route('employees.loans.edit', loan.id))} title="Edit">
                                                                    <EditIcon fontSize="small" />
                                                                </IconButton>
                                                            </>
                                                        )}
                                                        {loan.status === 'approved' && (
                                                            <IconButton size="small" color="primary" onClick={() => handleDisburse(loan.id)} title="Mark Disbursed">
                                                                <DisbursedIcon fontSize="small" />
                                                            </IconButton>
                                                        )}
                                                        {['pending', 'rejected'].includes(loan.status) && (
                                                            <IconButton size="small" color="error" onClick={() => handleDelete(loan.id)} title="Delete">
                                                                <DeleteIcon fontSize="small" />
                                                            </IconButton>
                                                        )}
                                                    </Box>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        {loans.last_page > 1 && (
                            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                                <Pagination count={loans.last_page} page={loans.current_page} onChange={(e, page) => router.get(route('employees.loans.index'), { ...filters, page })} />
                            </Box>
                        )}
                    </Card>
                </Box>
            </LocalizationProvider>
        </AdminLayout>
    );
};

export default Index;
