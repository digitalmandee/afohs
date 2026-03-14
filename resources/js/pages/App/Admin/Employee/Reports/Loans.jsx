import { useState } from 'react';
import { router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import AdminLayout from '@/layouts/AdminLayout';
import { Box, Card, CardContent, Typography, Button, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, FormControl, InputLabel, Select, MenuItem, TextField, IconButton, Autocomplete } from '@mui/material';
import { Print as PrintIcon, ArrowBack as ArrowBackIcon, AccountBalance as LoanIcon, Search } from '@mui/icons-material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';

const formatCurrency = (amount) => `Rs ${parseFloat(amount || 0).toLocaleString()}`;

const Loans = ({ loans, employees, summary, filters, hasLoansTable }) => {
    const [selectedEmployee, setSelectedEmployee] = useState(filters.employee_id || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || '');
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');

    const handleFilter = () => {
        router.get(
            route('employees.reports.loans'),
            {
                employee_id: selectedEmployee || undefined,
                status: selectedStatus || undefined,
                date_from: dateFrom || undefined,
                date_to: dateTo || undefined,
            },
            { preserveState: true },
        );
    };

    const handlePrint = () => {
        window.print();
    };

    if (!hasLoansTable) {
        return (
            <AdminLayout>
                <Box sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="h5" color="error">
                        Loan Module Not Installed
                    </Typography>
                    <Typography>The 'employee_loans' table is missing from the database.</Typography>
                </Box>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
                <Box sx={{ bgcolor: '#f5f5f5', minHeight: '100vh', p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, '@media print': { display: 'none' } }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <IconButton onClick={() => window.history.back()} sx={{ mr: 1 }}>
                                <ArrowBackIcon sx={{ color: '#063455' }} />
                            </IconButton>
                            <Box>
                                <Typography sx={{ fontWeight: 700, fontSize: '30px', color: '#063455' }}>
                                    Employee Loans Report
                                </Typography>
                                {/* <Typography variant="body2" color="textSecondary">
                                    Track loan disbursements and recovery
                                </Typography> */}
                            </Box>
                        </Box>
                        <Box>
                            <Button
                                variant="outlined"
                                startIcon={<PrintIcon />}
                                href={route('employees.reports.loans.print', {
                                    employee_id: selectedEmployee || undefined,
                                    status: selectedStatus || undefined,
                                    date_from: dateFrom || undefined,
                                    date_to: dateTo || undefined,
                                })}
                                target="_blank"
                                sx={{
                                    borderColor: '#063455',
                                    color: '#063455', mr: 1,
                                    textTransform: 'capitalize',
                                    borderRadius: '16px'
                                }}
                            >
                                Print
                            </Button>
                            <Button
                                variant="contained"
                                href={route('employees.reports.api.loans.export', {
                                    employee_id: selectedEmployee || undefined,
                                    status: selectedStatus || undefined,
                                    date_from: dateFrom || undefined,
                                    date_to: dateTo || undefined,
                                })}
                                sx={{
                                    backgroundColor: '#008f3d',
                                    borderRadius: '16px',
                                    textTransform: 'capitalize',
                                    color: '#fff', '&:hover': { backgroundColor: '#00642b' }
                                }}
                            >
                                Export Excel
                            </Button>
                        </Box>
                    </Box>

                    {/* Filters */}
                    <Card sx={{ mb: 4, boxShadow: 'none', bgcolor: 'transparent', '@media print': { display: 'none' }, borderRadius: '12px' }}>
                        <CardContent>
                            <Grid container spacing={2} alignItems="center">
                                <Grid item xs={12} sm={3}>
                                    <Autocomplete
                                        options={employees}
                                        getOptionLabel={(option) => `${option.name} (${option.employee_id || option.id})`}
                                        value={employees.find((e) => e.id === selectedEmployee) || null}
                                        onChange={(event, newValue) => {
                                            setSelectedEmployee(newValue ? newValue.id : '');
                                        }}
                                        ListboxProps={{
                                            sx: {
                                                '& .MuiAutocomplete-option': {
                                                    borderRadius: '16px',
                                                    mx: '8px',
                                                    transition: 'all 0.2s ease',
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
                                        renderInput={(params) =>
                                            <TextField {...params} label="Employee" size="small"
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        borderRadius: '16px',
                                                        '& fieldset': {
                                                            borderRadius: '16px',
                                                        },
                                                    },
                                                }}
                                            />}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={2}>
                                    <FormControl fullWidth size="small"
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: '16px',
                                            },
                                        }}>
                                        <InputLabel>Status</InputLabel>
                                        <Select
                                            value={selectedStatus}
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
                                                            my: '1px'
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
                                            <MenuItem value="disbursed">Disbursed (Active)</MenuItem>
                                            <MenuItem value="completed">Completed</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} sm={2}>
                                    <DatePicker
                                        label="From Date"
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
                                        label="To Date"
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
                                <Grid item xs={12} sm={3} sx={{ display: 'flex', gap: 1 }}>
                                    <Button
                                        fullWidth
                                        variant="contained"
                                        startIcon={<Search />}
                                        onClick={handleFilter}
                                        sx={{
                                            backgroundColor: '#063455',
                                            borderRadius: '16px',
                                            textTransform: 'capitalize'
                                        }}>
                                        Search
                                    </Button>
                                    <Button
                                        fullWidth
                                        variant="outlined"
                                        onClick={() => router.visit(route('employees.reports.loans'))}
                                        sx={{
                                            borderColor: '#063455',
                                            color: '#063455',
                                            borderRadius: '16px',
                                            textTransform: 'capitalize'
                                        }}>
                                        Reset
                                    </Button>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>

                    {/* Summary Cards */}
                    <Grid container spacing={3} sx={{ mb: 4 }}>
                        <Grid item xs={12} sm={3}>
                            <Card sx={{ borderRadius: '12px', bgcolor: '#063455' }}>
                                <CardContent sx={{ textAlign: 'center' }}>
                                    {/* <LoanIcon sx={{ fontSize: 40, color: '#fff', mb: 1 }} /> */}
                                    <Typography sx={{ color: '#fff', fontWeight: 600, fontSize: '14px' }}>
                                        Total Loaned Amount
                                    </Typography>
                                    <Typography sx={{ fontWeight: 700, color: '#fff', fontSize: '18px' }}>
                                        {formatCurrency(summary?.total_amount)}
                                    </Typography>

                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} sm={3}>
                            <Card sx={{ borderRadius: '12px', bgcolor: '#063455' }}>
                                <CardContent sx={{ textAlign: 'center' }}>
                                    <Typography sx={{ color: '#fff', fontWeight: 600, fontSize: '14px' }}>
                                        Total Recovered
                                    </Typography>
                                    <Typography sx={{ fontWeight: 700, color: '#fff', fontSize: '18px' }}>
                                        {formatCurrency(summary?.total_recovered)}
                                    </Typography>

                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} sm={3}>
                            <Card sx={{ borderRadius: '12px', bgcolor: '#063455' }}>
                                <CardContent sx={{ textAlign: 'center' }}>
                                    <Typography sx={{ color: '#fff', fontWeight: 600, fontSize: '14px' }}>
                                        Outstanding Balance
                                    </Typography>
                                    <Typography sx={{ fontWeight: 700, color: '#fff', fontSize: '18px' }}>
                                        {formatCurrency(summary?.total_remaining)}
                                    </Typography>

                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} sm={3}>
                            <Card sx={{ borderRadius: '12px', bgcolor: '#063455' }}>
                                <CardContent sx={{ textAlign: 'center' }}>
                                    <Typography sx={{ color: '#fff', fontWeight: 600, fontSize: '14px' }}>
                                        Active Loans
                                    </Typography>
                                    <Typography sx={{ fontWeight: 700, color: '#fff', fontSize: '18px' }}>
                                        {summary?.active_count || 0}
                                    </Typography>

                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>

                    {/* Printable Header */}
                    <Box sx={{ display: 'none', '@media print': { display: 'block', mb: 4, textAlign: 'center' } }}>
                        <Typography variant="h5" sx={{ fontWeight: 700 }}>
                            Employee Loans Report
                        </Typography>
                        <Typography variant="body2">Generated on: {new Date().toLocaleDateString()}</Typography>
                    </Box>

                    {/* Table */}
                    <Card sx={{ borderRadius: '12px', overflow: 'hidden' }}>
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ backgroundColor: '#063455' }}>
                                        <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Date</TableCell>
                                        <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Employee</TableCell>
                                        <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Department</TableCell>
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
                                            Balance
                                        </TableCell>
                                        <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Status</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {loans.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                                                No loans found matching the criteria
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        loans.map((loan) => (
                                            <TableRow key={loan.id} sx={{ '&:nth-of-type(odd)': { backgroundColor: '#f9f9f9' } }}>
                                                <TableCell>{new Date(loan.loan_date).toLocaleDateString()}</TableCell>
                                                <TableCell sx={{ fontWeight: 500 }}>
                                                    {loan.employee?.name}
                                                    <Typography variant="caption" display="block" color="textSecondary">
                                                        {loan.employee?.employee_id}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>{loan.employee?.department?.name || '-'}</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 600 }}>
                                                    {formatCurrency(loan.amount)}
                                                </TableCell>
                                                <TableCell align="center">
                                                    {loan.installments_paid}/{loan.installments}
                                                    <br />
                                                    <Typography variant="caption">{formatCurrency(loan.monthly_deduction)}/mo</Typography>
                                                </TableCell>
                                                <TableCell align="right" sx={{ color: 'success.main' }}>
                                                    {formatCurrency(loan.total_paid)}
                                                </TableCell>
                                                <TableCell align="right" sx={{ color: 'error.main', fontWeight: 600 }}>
                                                    {formatCurrency(loan.remaining_amount)}
                                                </TableCell>
                                                <TableCell>
                                                    <Box
                                                        sx={{
                                                            display: 'inline-block',
                                                            px: 1,
                                                            py: 0.5,
                                                            borderRadius: 1,
                                                            fontSize: '0.75rem',
                                                            fontWeight: 600,
                                                            bgcolor: loan.status === 'disbursed' ? '#e3f2fd' : loan.status === 'completed' ? '#e8f5e9' : '#fff3e0',
                                                            color: loan.status === 'disbursed' ? '#1976d2' : loan.status === 'completed' ? '#2e7d32' : '#ef6c00',
                                                        }}
                                                    >
                                                        {loan.status.toUpperCase()}
                                                    </Box>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Card>
                </Box>
            </LocalizationProvider>
        </AdminLayout>
    );
};

export default Loans;
