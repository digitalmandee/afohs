import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { TbCashBanknoteOff } from 'react-icons/tb';
import AdminLayout from '@/layouts/AdminLayout';
import { Box, Card, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, TextField, InputAdornment, IconButton, Pagination, CircularProgress, Alert, Snackbar, Tooltip, Avatar } from '@mui/material';
import { Search as SearchIcon, Add as AddIcon, Edit as EditIcon, Visibility as VisibilityIcon, ArrowBack as ArrowBackIcon, AccountBalance as AccountBalanceIcon, Person as PersonIcon } from '@mui/icons-material';
import axios from 'axios';

const EmployeeSalaries = () => {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    useEffect(() => {
        fetchEmployees();
    }, [currentPage, searchTerm]);

    const fetchEmployees = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/payroll/employees/salaries', {
                params: {
                    page: currentPage,
                    search: searchTerm,
                    per_page: 15,
                },
            });

            if (response.data.success) {
                setEmployees(response.data.employees.data || []);
                setTotalPages(response.data.employees.last_page || 1);
            }
        } catch (error) {
            console.error('Error fetching employees:', error);
            showSnackbar('Error loading employees', 'error');
        } finally {
            setLoading(false);
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

    const getSalaryStatusColor = (employee) => {
        if (!employee.salary_structure) return 'error';
        return 'success';
    };

    const getSalaryStatusText = (employee) => {
        if (!employee.salary_structure) return 'No Salary Structure';
        return 'Active';
    };

    return (
        <AdminLayout>
            <div
                style={{
                    minHeight: '100vh',
                    backgroundColor: '#f5f5f5',
                }}
            >
                <Box sx={{ p: 2 }}>
                    {/* Header */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <IconButton onClick={() => window.history.back()}>
                                <ArrowBackIcon sx={{color: '#063455'}} />
                            </IconButton>
                            <Typography sx={{ color: '#063455', fontWeight: 700, fontSize:'30px' }}>
                                Employee Salaries
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <Button
                                variant="contained"
                                startIcon={<AccountBalanceIcon />}
                                onClick={() => router.visit(route('employees.payroll.allowance-types'))}
                                sx={{
                                    backgroundColor: '#063455',
                                    borderRadius:'16px',
                                    '&:hover': { backgroundColor: '#052d45' },
                                }}
                            >
                                Manage Allowances
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<TbCashBanknoteOff />}
                                onClick={() => router.visit(route('employees.payroll.deduction-types'))}
                                sx={{
                                    color: '#063455',
                                    borderColor: '#063455',
                                    borderRadius:'16px',
                                    '&:hover': { borderColor: '#052d45' },
                                }}
                            >
                                Manage Deductions
                            </Button>
                        </Box>
                    </Box>

                    {/* Search and Actions */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, mt:2 }}>
                        <TextField
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
                                '& .MuiInputBase-root': {
                                    height: 40, // 🔥 Controls total height
                                    borderRadius: '16px',
                                    width: 215,
                                },
                                '& .MuiInputBase-input': {
                                    padding: '0 14px', // 🔥 Centers placeholder vertically
                                },
                            }}
                        />
                    </Box>

                    {/* Employees Table */}
                    {/* <Card> */}
                        <TableContainer component={Paper} sx={{borderRadius:'16px'}}>
                            <Table>
                                <TableHead>
                                    <TableRow sx={{ backgroundColor: '#063455' }}>
                                        <TableCell sx={{ fontWeight: 600, color: '#fff' }}>Employee</TableCell>
                                        <TableCell sx={{ fontWeight: 600, color: '#fff' }}>Department</TableCell>
                                        <TableCell sx={{ fontWeight: 600, color: '#fff' }}>Basic Salary</TableCell>
                                        <TableCell sx={{ fontWeight: 600, color: '#fff' }}>Allowances</TableCell>
                                        <TableCell sx={{ fontWeight: 600, color: '#fff' }}>Deductions</TableCell>
                                        <TableCell sx={{ fontWeight: 600, color: '#fff' }}>Gross</TableCell>
                                        <TableCell sx={{ fontWeight: 600, color: '#fff' }}>Net</TableCell>
                                        <TableCell sx={{ fontWeight: 600, color: '#fff' }}>Status</TableCell>
                                        <TableCell sx={{ fontWeight: 600, color: '#fff' }}>Effective From</TableCell>
                                        <TableCell sx={{ fontWeight: 600, color: '#fff' }}>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                                                <CircularProgress sx={{ color: '#063455' }} />
                                            </TableCell>
                                        </TableRow>
                                    ) : employees.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                                                <Typography color="textSecondary">No employees found</Typography>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        employees.map((employee) => (
                                            (() => {
                                                const computed = employee.computed_salary || {};
                                                const basicSalary = computed.basic_salary ?? employee.salary_structure?.basic_salary ?? 0;
                                                const totalAllowances = computed.total_allowances ?? 0;
                                                const totalDeductions = computed.total_deductions ?? 0;
                                                const grossSalary = computed.gross_salary ?? (Number(basicSalary || 0) + Number(totalAllowances || 0));
                                                const netSalary = computed.net_salary ?? (Number(grossSalary || 0) - Number(totalDeductions || 0));

                                                return (
                                            <TableRow key={employee.id} sx={{ '&:hover': { backgroundColor: '#f5f5f5' } }}>
                                                <TableCell>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                        <Avatar sx={{ bgcolor: '#063455', width: 40, height: 40 }}>
                                                            <PersonIcon />
                                                        </Avatar>
                                                        <Box>
                                                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                                                {employee.name}
                                                            </Typography>
                                                            <Typography variant="caption" color="textSecondary">
                                                                ID: {employee.employee_id}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                </TableCell>
                                                <TableCell>{employee.department?.name || 'N/A'}</TableCell>
                                                <TableCell>
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                                        {employee.salary_structure ? formatCurrency(basicSalary) : 'Not Set'}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#2e7d32' }}>
                                                        {employee.salary_structure ? formatCurrency(totalAllowances) : '—'}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#d32f2f' }}>
                                                        {employee.salary_structure ? formatCurrency(totalDeductions) : '—'}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                                        {employee.salary_structure ? formatCurrency(grossSalary) : '—'}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                                        {employee.salary_structure ? formatCurrency(netSalary) : '—'}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip label={getSalaryStatusText(employee)} size="small" color={getSalaryStatusColor(employee)} sx={{ borderRadius: '4px' }} />
                                                </TableCell>
                                                <TableCell>{employee.salary_structure ? new Date(employee.salary_structure.effective_from).toLocaleDateString() : 'N/A'}</TableCell>
                                                <TableCell>
                                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                                        <Tooltip title="View Details">
                                                            <IconButton size="small" onClick={() => router.visit(route('employees.payroll.salaries.view', employee.id))} sx={{ color: '#063455' }}>
                                                                <VisibilityIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>

                                                        {employee.salary_structure ? (
                                                            <Tooltip title="Edit Salary">
                                                                <IconButton size="small" onClick={() => router.visit(route('employees.payroll.salaries.edit', employee.id))} sx={{ color: '#ed6c02' }}>
                                                                    <EditIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        ) : (
                                                            <Tooltip title="Create Salary Structure">
                                                                <IconButton size="small" onClick={() => router.visit(route('employees.payroll.salaries.create', employee.id))} sx={{ color: '#2e7d32' }}>
                                                                    <AddIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        )}
                                                    </Box>
                                                </TableCell>
                                            </TableRow>
                                                );
                                            })()
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

                    {/* Snackbar for notifications */}
                    <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                            {snackbar.message}
                        </Alert>
                    </Snackbar>
                </Box>
            </div>
        </AdminLayout>
    );
};

export default EmployeeSalaries;
