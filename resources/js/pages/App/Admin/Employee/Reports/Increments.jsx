import { useState } from 'react';
import { router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import AdminLayout from '@/layouts/AdminLayout';
import { Box, Card, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, TextField, Grid, Chip } from '@mui/material';
import { ArrowBack as ArrowBackIcon, Print as PrintIcon, TrendingUp as TrendingUpIcon, FileDownload as FileDownloadIcon, Search } from '@mui/icons-material';

const formatCurrency = (amount) => {
    return `Rs ${parseFloat(amount || 0).toLocaleString()}`;
};

const Increments = ({ increments = [], filters = {} }) => {
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');

    const handleFilter = () => {
        router.get(
            route('employees.reports.increments'),
            {
                date_from: dateFrom,
                date_to: dateTo,
            },
            { preserveState: true },
        );
    };

    const handlePrint = () => {
        const printUrl = route('employees.reports.increments.print', {
            date_from: dateFrom,
            date_to: dateTo,
        });
        window.open(printUrl, '_blank');
    };

    const handleExport = () => {
        const params = new URLSearchParams({ date_from: dateFrom || '', date_to: dateTo || '' }).toString();
        window.open(`/admin/employees/reports/api/increments/export?${params}`, '_blank');
    };

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
                            Increments Report
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button
                            variant="contained"
                            startIcon={<FileDownloadIcon />}
                            onClick={handleExport}
                            sx={{
                                backgroundColor: '#28a745',
                                borderRadius: '16px',
                                textTransform: 'capitalize',
                                '&:hover': { backgroundColor: '#218838' }
                            }}>
                            Export Excel
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<PrintIcon />}
                            onClick={handlePrint}
                            sx={{
                                borderColor: '#063455',
                                borderRadius: '16px',
                                textTransform: 'capitalize',
                                color: '#063455'
                            }}>
                            Print
                        </Button>
                    </Box>
                </Box>

                {/* Filters */}
                <Card sx={{ mb: 3, pt: 2, boxShadow:'none', bgcolor:'transparent'}}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={2}>
                            <TextField fullWidth size="small" type="date" label="From Date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} InputLabelProps={{ shrink: true }} />
                        </Grid>
                        <Grid item xs={12} sm={2}>
                            <TextField fullWidth size="small" type="date" label="To Date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} InputLabelProps={{ shrink: true }} />
                        </Grid>
                        <Grid item xs={12} sm={2}>
                            <Button 
                            variant="contained"
                            startIcon={<Search/>} 
                            onClick={handleFilter} 
                            sx={{ backgroundColor: '#063455', 
                            borderRadius:'16px',
                            textTransform:'capitalize',
                            '&:hover': { backgroundColor: '#052d45' } }}>
                                Search
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
                                    <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Effective Date</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600 }} align="right">
                                        Previous Salary
                                    </TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600 }} align="right">
                                        Current Salary
                                    </TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600 }} align="right">
                                        Increment
                                    </TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600 }} align="center">
                                        %
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {increments.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                                            <Typography color="textSecondary">No salary changes found in selected period</Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    increments.map((item, index) => (
                                        <TableRow key={item.id} sx={{ '&:hover': { backgroundColor: '#f5f5f5' } }}>
                                            <TableCell>{index + 1}</TableCell>
                                            <TableCell sx={{ fontWeight: 500 }}>{item.employee?.name || '-'}</TableCell>
                                            <TableCell>{item.employee?.department?.name || '-'}</TableCell>
                                            <TableCell>{item.effective_date}</TableCell>
                                            <TableCell align="right">{formatCurrency(item.previous_salary)}</TableCell>
                                            <TableCell align="right">{formatCurrency(item.current_salary)}</TableCell>
                                            <TableCell align="right" sx={{ color: item.increment >= 0 ? 'green' : 'red', fontWeight: 500 }}>
                                                {item.increment >= 0 ? '+' : ''}
                                                {formatCurrency(item.increment)}
                                            </TableCell>
                                            <TableCell align="center">
                                                <Chip icon={<TrendingUpIcon sx={{ fontSize: 16 }} />} label={`${item.increment_percentage || 0}%`} size="small" color={item.increment >= 0 ? 'success' : 'error'} />
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

export default Increments;
