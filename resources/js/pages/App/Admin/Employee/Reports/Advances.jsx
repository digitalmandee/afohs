import { useState } from 'react';
import { router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import AdminLayout from '@/layouts/AdminLayout';
import { Box, Card, CardContent, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, FormControl, InputLabel, Select, MenuItem, Grid, Chip, TextField, Alert } from '@mui/material';
import { ArrowBack as ArrowBackIcon, Print as PrintIcon, FileDownload as FileDownloadIcon, OpenInNew as OpenInNewIcon, Search } from '@mui/icons-material';

const formatCurrency = (amount) => `Rs ${parseFloat(amount || 0).toLocaleString()}`;

const getStatusColor = (status) => {
    const colors = { pending: 'warning', approved: 'info', rejected: 'error', paid: 'primary', deducted: 'success' };
    return colors[status] || 'default';
};

const Advances = ({ advances = [], employees = [], summary = null, hasAdvancesTable = true, filters = {}, message = null }) => {
    const [selectedEmployee, setSelectedEmployee] = useState(filters.employee_id || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || '');
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');

    const handleFilter = () => {
        router.get(
            route('employees.reports.advances'),
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

    if (!hasAdvancesTable) {
        return (
            <AdminLayout>
                <Box sx={{ bgcolor: '#f5f5f5', minHeight: '100vh', p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        <IconButton onClick={() => router.visit(route('employees.reports'))}>
                            <ArrowBackIcon sx={{ color: '#063455' }} />
                        </IconButton>
                        <Typography variant="h5" sx={{ color: '#063455', fontWeight: 700, ml: 1 }}>
                            Advances Report
                        </Typography>
                    </Box>
                    <Alert severity="warning" sx={{ mb: 3 }}>
                        {message || 'Advances module not configured.'}
                    </Alert>
                </Box>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <Box sx={{ bgcolor: '#f5f5f5', minHeight: '100vh', p: 3 }}>
                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <IconButton onClick={() => router.visit(route('employees.reports'))}>
                            <ArrowBackIcon sx={{ color: '#063455' }} />
                        </IconButton>
                        <Typography sx={{ color: '#063455', fontWeight: 700, fontSize: '30px' }}>
                            Advances Report
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button
                            variant="contained"
                            startIcon={<OpenInNewIcon />}
                            onClick={() => router.visit(route('employees.advances.index'))}
                            sx={{ backgroundColor: '#28a745', textTransform: 'none', borderRadius: '16px' }}>
                            Manage Advances
                        </Button>

                        <Button
                            variant="contained"
                            href={route('employees.reports.api.advances.export', {
                                employee_id: selectedEmployee || undefined,
                                status: selectedStatus || undefined,
                                date_from: dateFrom || undefined,
                                date_to: dateTo || undefined,
                            })}
                            sx={{
                                backgroundColor: '#28a745',
                                textTransform: 'none', borderRadius: '16px',
                                color: '#fff', '&:hover': { backgroundColor: '#00642b' }
                            }}
                        >
                            Export Excel
                        </Button>

                        <Button
                            variant="outlined"
                            startIcon={<PrintIcon />}
                            href={route('employees.reports.advances.print', {
                                employee_id: selectedEmployee || undefined,
                                status: selectedStatus || undefined,
                                date_from: dateFrom || undefined,
                                date_to: dateTo || undefined,
                            })}
                            target="_blank"
                            sx={{ borderColor: '#063455', color: '#063455', textTransform: 'none', borderRadius: '16px' }}
                        >
                            Print
                        </Button>
                    </Box>
                </Box>

                {/* Summary Cards */}
                {summary && (
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid item xs={6} sm={2.4}>
                            <Card sx={{ borderRadius: '12px', textAlign: 'center', p: 2, bgcolor: '#063455' }}>
                                <Typography sx={{ color: '#fff', fontSize: '16px' }}>
                                    Total Advances
                                </Typography>
                                <Typography sx={{ fontWeight: 600, color: '#fff', fontSize: '18px' }}>
                                    {summary.count}
                                </Typography>
                            </Card>
                        </Grid>
                        <Grid item xs={6} sm={2.4}>
                            <Card sx={{ borderRadius: '12px', textAlign: 'center', p: 2, bgcolor: '#063455' }}>
                                <Typography sx={{ color: '#fff', fontSize: '16px' }}>
                                    Total Amount
                                </Typography>
                                <Typography sx={{ fontWeight: 600, color: '#fff', fontSize: '18px' }}>
                                    {formatCurrency(summary.total_amount)}
                                </Typography>
                            </Card>
                        </Grid>
                        <Grid item xs={6} sm={2.4}>
                            <Card sx={{ borderRadius: '12px', textAlign: 'center', p: 2, bgcolor: '#063455' }}>
                                <Typography sx={{ color: '#fff', fontSize: '16px' }}>
                                    Outstanding
                                </Typography>
                                <Typography sx={{ fontWeight: 600, color: '#fff', fontSize: '18px' }}>
                                    {formatCurrency(summary.total_remaining)}
                                </Typography>
                            </Card>
                        </Grid>
                        <Grid item xs={6} sm={2.4}>
                            <Card sx={{ borderRadius: '12px', textAlign: 'center', p: 2, bgcolor: '#063455' }}>
                                <Typography sx={{ color: '#fff', fontSize: '16px' }}>
                                    Pending
                                </Typography>
                                <Typography sx={{ fontWeight: 600, color: '#fff', fontSize: '18px' }}>
                                    {summary.pending_count}
                                </Typography>
                            </Card>
                        </Grid>
                        <Grid item xs={6} sm={2.4}>
                            <Card sx={{ borderRadius: '12px', textAlign: 'center', p: 2, backgroundColor: '#063455' }}>
                                <Typography sx={{ color: '#fff', fontSize: '16px' }}>
                                    Deducted
                                </Typography>
                                <Typography sx={{ fontWeight: 600, color: '#fff', fontSize: '18px' }}>
                                    {summary.paid_count}
                                </Typography>
                            </Card>
                        </Grid>
                    </Grid>
                )}

                {/* Filters */}
                <Card sx={{ mb: 3, pt: 2, boxShadow: 'none', bgcolor: 'transparent' }}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={3}>
                            <FormControl fullWidth size="small"
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: '16px',
                                    },
                                }}>
                                <InputLabel>Employee</InputLabel>
                                <Select
                                    value={selectedEmployee}
                                    label="Employee"
                                    onChange={(e) => setSelectedEmployee(e.target.value)}
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
                                    <MenuItem value="">All Employees</MenuItem>
                                    {employees.map((emp) => (
                                        <MenuItem key={emp.id} value={emp.id}>
                                            {emp.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={2}>
                            <FormControl fullWidth size="small"
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: '16px',
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
                                    <MenuItem value="approved">Approved</MenuItem>
                                    <MenuItem value="paid">Paid</MenuItem>
                                    <MenuItem value="deducted">Deducted</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={2}>
                            <TextField fullWidth size="small" type="date" label="From" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} InputLabelProps={{ shrink: true }} />
                        </Grid>
                        <Grid item xs={12} sm={2}>
                            <TextField fullWidth size="small" type="date" label="To" value={dateTo} onChange={(e) => setDateTo(e.target.value)} InputLabelProps={{ shrink: true }} />
                        </Grid>
                        <Grid item xs={12} sm={3} sx={{ display: 'flex', gap: 1 }}>
                            <Button
                                variant="contained"
                                startIcon={<Search />}
                                onClick={handleFilter}
                                sx={{
                                    backgroundColor: '#063455',
                                    borderRadius: '16px',
                                    textTransform: 'capitalize',
                                }}>
                                Search
                            </Button>
                            <Button
                                variant="outlined"
                                onClick={() => router.visit(route('employees.reports.advances'))}
                                sx={{
                                    borderColor: '#063455', color: '#063455',
                                    borderRadius: '16px',
                                    textTransform: 'capitalize',
                                }}>
                                Reset
                            </Button>
                        </Grid>
                    </Grid>
                </Card>

                {/* Table */}
                <Card sx={{ borderRadius: '12px' }}>
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ backgroundColor: '#063455' }}>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600 }}>#</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Employee</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Department</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Date</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600 }} align="right">
                                        Amount
                                    </TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Reason</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600 }} align="center">
                                        Months
                                    </TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600 }} align="right">
                                        Remaining
                                    </TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Status</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {advances.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                                            <Typography color="textSecondary">No advances found</Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    advances.map((advance, index) => (
                                        <TableRow key={advance.id} sx={{ '&:hover': { backgroundColor: '#f5f5f5' } }}>
                                            <TableCell>{index + 1}</TableCell>
                                            <TableCell sx={{ fontWeight: 500 }}>{advance.employee?.name}</TableCell>
                                            <TableCell>{advance.employee?.department?.name || '-'}</TableCell>
                                            <TableCell>{advance.advance_date}</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 600 }}>
                                                {formatCurrency(advance.amount)}
                                            </TableCell>
                                            <TableCell>{advance.reason || '-'}</TableCell>
                                            <TableCell align="center">{advance.deduction_months}</TableCell>
                                            <TableCell align="right" sx={{ color: 'red' }}>
                                                {formatCurrency(advance.remaining_amount)}
                                            </TableCell>
                                            <TableCell>
                                                <Chip label={advance.status} size="small" color={getStatusColor(advance.status)} />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Card>
            </Box>
        </AdminLayout>
    );
};

export default Advances;
