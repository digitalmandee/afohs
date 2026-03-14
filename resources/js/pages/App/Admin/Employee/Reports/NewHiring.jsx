import { useState } from 'react';
import { router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import AdminLayout from '@/layouts/AdminLayout';
import { Box, Card, CardContent, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, TextField, Grid, Chip } from '@mui/material';
import { ArrowBack as ArrowBackIcon, Print as PrintIcon, PersonAdd as PersonAddIcon, FileDownload as FileDownloadIcon, Search } from '@mui/icons-material';

const NewHiring = ({ employees = [], departments = [], stats = {}, filters = {} }) => {
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');

    const handleFilter = () => {
        router.get(
            route('employees.reports.new-hiring'),
            {
                date_from: dateFrom,
                date_to: dateTo,
            },
            { preserveState: true },
        );
    };

    const handlePrint = () => {
        const printUrl = route('employees.reports.new-hiring.print', {
            date_from: dateFrom,
            date_to: dateTo,
        });
        window.open(printUrl, '_blank');
    };

    const handleExport = () => {
        const params = new URLSearchParams({ date_from: dateFrom || '', date_to: dateTo || '' }).toString();
        window.open(`/admin/employees/reports/api/new-hiring/export?${params}`, '_blank');
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
                            New Hiring Report
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

                {/* Stats Cards */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={12} sm={4}>
                        <Card sx={{ borderRadius: '12px', backgroundColor: '#063455' }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <PersonAddIcon sx={{ color: '#fff', fontSize: 40, mr: 2 }} />
                                    <Box>
                                        <Typography variant="h4" sx={{ color: '#fff', fontWeight: 700 }}>
                                            {stats.total_new_hires || 0}
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: '#ccc' }}>
                                            Total New Hires
                                        </Typography>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* Filters */}
                <Card sx={{ mb: 3, pt: 2, boxShadow:'none', bgcolor:'transparent' }}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={2}>
                            <TextField fullWidth size="small" type="date" label="From Date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} InputLabelProps={{ shrink: true }} />
                        </Grid>
                        <Grid item xs={12} sm={2}>
                            <TextField fullWidth size="small" type="date" label="To Date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} InputLabelProps={{ shrink: true }} />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <Button
                                variant="contained"
                                startIcon={<Search/>}
                                onClick={handleFilter}
                                sx={{
                                    backgroundColor: '#063455',
                                    borderRadius: '16px',
                                    textTransform: 'capitalize',
                                    '&:hover': { backgroundColor: '#052d45' }
                                }}>
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
                                    <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Employee ID</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Name</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Department</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Designation</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Joining Date</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Employment Type</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {employees.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                                            <Typography color="textSecondary">No new hires found in selected period</Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    employees.map((employee, index) => (
                                        <TableRow key={employee.id} sx={{ '&:hover': { backgroundColor: '#f5f5f5' } }}>
                                            <TableCell>{index + 1}</TableCell>
                                            <TableCell>{employee.employee_id || employee.id}</TableCell>
                                            <TableCell sx={{ fontWeight: 500 }}>{employee.name}</TableCell>
                                            <TableCell>{employee.department?.name || '-'}</TableCell>
                                            <TableCell>{employee.designation || '-'}</TableCell>
                                            <TableCell>{employee.joining_date || '-'}</TableCell>
                                            <TableCell>
                                                <Chip label={employee.employment_type?.replace('_', ' ') || 'Full Time'} size="small" color="primary" />
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

export default NewHiring;
