import { useState } from 'react';
import { router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import AdminLayout from '@/layouts/AdminLayout';
import { Box, Card, CardContent, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, FormControl, InputLabel, Select, MenuItem, Grid } from '@mui/material';
import { ArrowBack as ArrowBackIcon, Print as PrintIcon, FileDownload as FileDownloadIcon } from '@mui/icons-material';

const formatCurrency = (amount) => {
    return `Rs ${parseFloat(amount || 0).toLocaleString()}`;
};

const Deductions = ({ deductions = [], periods = [], summary = null, filters = {} }) => {
    const [selectedPeriod, setSelectedPeriod] = useState(filters.period_id || '');

    const handleFilter = () => {
        router.get(
            route('employees.reports.deductions'),
            {
                period_id: selectedPeriod,
            },
            { preserveState: true },
        );
    };

    const handlePrint = () => {
        if (!selectedPeriod) return;
        const printUrl = route('employees.reports.deductions.print', {
            period_id: selectedPeriod,
        });
        window.open(printUrl, '_blank');
    };

    const handleExport = () => {
        if (!selectedPeriod) return;
        window.open(`/admin/employees/reports/api/deductions/export?period_id=${selectedPeriod}`, '_blank');
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
                        <Typography variant="h5" sx={{ color: '#063455', fontWeight: 700, ml: 1 }}>
                            Deductions Report
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button variant="contained" startIcon={<FileDownloadIcon />} onClick={handleExport} disabled={!selectedPeriod} sx={{ backgroundColor: '#28a745', '&:hover': { backgroundColor: '#218838' } }}>
                            Export Excel
                        </Button>
                        <Button variant="outlined" startIcon={<PrintIcon />} onClick={handlePrint} disabled={!selectedPeriod} sx={{ borderColor: '#063455', color: '#063455' }}>
                            Print
                        </Button>
                    </Box>
                </Box>

                {/* Filters */}
                <Card sx={{ mb: 3, p: 2, borderRadius: '12px' }}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Payroll Period</InputLabel>
                                <Select value={selectedPeriod} label="Payroll Period" onChange={(e) => setSelectedPeriod(e.target.value)}>
                                    <MenuItem value="">Select Period</MenuItem>
                                    {periods.map((period) => (
                                        <MenuItem key={period.id} value={period.id}>
                                            {period.name} ({period.start_date} to {period.end_date})
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={3}>
                            <Button variant="contained" onClick={handleFilter} sx={{ backgroundColor: '#063455', '&:hover': { backgroundColor: '#052d45' } }}>
                                Generate Report
                            </Button>
                        </Grid>
                    </Grid>
                </Card>

                {/* Summary Cards */}
                {summary && summary.length > 0 && (
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                        {summary.map((item, index) => (
                            <Grid item xs={6} sm={3} key={index}>
                                <Card sx={{ borderRadius: '12px', textAlign: 'center', p: 2 }}>
                                    <Typography variant="body2" color="textSecondary">
                                        {item.name}
                                    </Typography>
                                    <Typography variant="h6" sx={{ fontWeight: 600, color: 'red' }}>
                                        {formatCurrency(item.total)}
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">
                                        {item.count} employees
                                    </Typography>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                )}

                {/* Table */}
                <Card sx={{ borderRadius: '12px' }}>
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ backgroundColor: '#063455' }}>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600 }}>#</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Employee ID</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Employee Name</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Department</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Deduction Type</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600 }} align="right">
                                        Amount
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {deductions.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                                            <Typography color="textSecondary">{selectedPeriod ? 'No deductions found for this period' : 'Please select a payroll period'}</Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    deductions.map((deduction, index) => (
                                        <TableRow key={index} sx={{ '&:hover': { backgroundColor: '#f5f5f5' } }}>
                                            <TableCell>{index + 1}</TableCell>
                                            <TableCell>{deduction.employee_id_number}</TableCell>
                                            <TableCell sx={{ fontWeight: 500 }}>{deduction.employee_name}</TableCell>
                                            <TableCell>{deduction.department_name || '-'}</TableCell>
                                            <TableCell>{deduction.deduction_name}</TableCell>
                                            <TableCell align="right" sx={{ color: 'red', fontWeight: 500 }}>
                                                {formatCurrency(deduction.amount)}
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

export default Deductions;
