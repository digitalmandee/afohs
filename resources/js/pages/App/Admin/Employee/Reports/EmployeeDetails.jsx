import { useState } from 'react';
import { router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import AdminLayout from '@/layouts/AdminLayout';
import { Box, Card, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, FormControl, InputLabel, Select, MenuItem, Chip, Grid } from '@mui/material';
import { ArrowBack as ArrowBackIcon, Print as PrintIcon, FileDownload as FileDownloadIcon, Search } from '@mui/icons-material';

const EmployeeDetails = ({ employees = [], departments = [], filters = {} }) => {
    const [selectedDepartment, setSelectedDepartment] = useState(filters.department_id || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || '');
    const [selectedEmploymentType, setSelectedEmploymentType] = useState(filters.employment_type || '');

    const handleFilter = () => {
        router.get(
            route('employees.reports.employee-details'),
            {
                department_id: selectedDepartment || undefined,
                status: selectedStatus || undefined,
                employment_type: selectedEmploymentType || undefined,
            },
            { preserveState: true },
        );
    };

    const handlePrint = () => {
        const printUrl = route('employees.reports.employee-details.print', {
            department_id: selectedDepartment || undefined,
            status: selectedStatus || undefined,
            employment_type: selectedEmploymentType || undefined,
        });
        window.open(printUrl, '_blank');
    };

    const handleExport = () => {
        const params = new URLSearchParams({
            department_id: selectedDepartment || '',
            status: selectedStatus || '',
            employment_type: selectedEmploymentType || '',
        }).toString();
        window.open(`/admin/employees/reports/api/employee-details/export?${params}`, '_blank');
    };

    const getStatusColor = (status) => {
        const colors = {
            active: 'success',
            inactive: 'error',
            on_leave: 'warning',
            terminated: 'default',
        };
        return colors[status] || 'default';
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
                            Employee Details Report
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
                                color: '#063455',
                                borderRadius: '16px',
                                textTransform: 'capitalize',
                            }}>
                            Print
                        </Button>
                    </Box>
                </Box>

                {/* Filters */}
                <Card sx={{ mb: 3, pt: 2, bgcolor: 'transparent', boxShadow: 'none' }}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={3}>
                            <FormControl
                                fullWidth
                                size="small"
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: '16px',
                                    },
                                }}>
                                <InputLabel>Department</InputLabel>
                                <Select
                                    value={selectedDepartment}
                                    label="Department"
                                    onChange={(e) => setSelectedDepartment(e.target.value)}
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
                                    <MenuItem value="">All Departments</MenuItem>
                                    {departments.map((dept) => (
                                        <MenuItem key={dept.id} value={dept.id}>
                                            {dept.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={3}>
                            <FormControl
                                fullWidth
                                size="small"
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
                                    <MenuItem value="active">Active</MenuItem>
                                    <MenuItem value="inactive">Inactive</MenuItem>
                                    <MenuItem value="on_leave">On Leave</MenuItem>
                                    <MenuItem value="terminated">Terminated</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={3}>
                            <FormControl
                                fullWidth
                                size="small"
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: '16px',
                                    },
                                }}>
                                <InputLabel>Employment Type</InputLabel>
                                <Select
                                    value={selectedEmploymentType}
                                    label="Employment Type"
                                    onChange={(e) => setSelectedEmploymentType(e.target.value)}
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
                                    <MenuItem value="">All Types</MenuItem>
                                    <MenuItem value="full_time">Full Time</MenuItem>
                                    <MenuItem value="part_time">Part Time</MenuItem>
                                    <MenuItem value="contract">Contract</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={3}>
                            <Button
                                variant="contained"
                                startIcon={<Search />}
                                onClick={handleFilter}
                                sx={{
                                    backgroundColor: '#063455',
                                    borderRadius: '16px',
                                    textTransform: 'none',
                                    '&:hover': { backgroundColor: '#052d45' }
                                }}>
                                Search
                            </Button>
                        </Grid>
                    </Grid>
                </Card>

                {/* Results Summary */}
                <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="textSecondary">
                        Showing {employees.length} employees
                    </Typography>
                </Box>

                {/* Table */}
                <Card sx={{ borderRadius: '12px' }}>
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ backgroundColor: '#063455' }}>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600 }}>ID</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Name</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Department</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Designation</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Phone</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Email</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Joining Date</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Status</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {employees.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                                            <Typography color="textSecondary">No employees found</Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    employees.map((employee) => (
                                        <TableRow key={employee.id} sx={{ '&:hover': { backgroundColor: '#f5f5f5' } }}>
                                            <TableCell>{employee.employee_id || employee.id}</TableCell>
                                            <TableCell sx={{ fontWeight: 500 }}>{employee.name}</TableCell>
                                            <TableCell>{employee.department?.name || '-'}</TableCell>
                                            <TableCell>{employee.designation || '-'}</TableCell>
                                            <TableCell>{employee.phone || '-'}</TableCell>
                                            <TableCell>{employee.email || '-'}</TableCell>
                                            <TableCell>{employee.joining_date || '-'}</TableCell>
                                            <TableCell>
                                                <Chip label={employee.status || 'Active'} size="small" color={getStatusColor(employee.status)} />
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

export default EmployeeDetails;
