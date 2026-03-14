import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import AdminLayout from '@/layouts/AdminLayout';
import { Box, Card, CardContent, Typography, Button, Grid, Table, TableBody, IconButton, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, Checkbox, FormControlLabel, LinearProgress, Alert, Snackbar, Divider, Step, Stepper, StepLabel, StepContent, CircularProgress, Pagination, TextField } from '@mui/material';
import { PlayArrow as PlayArrowIcon, Preview as PreviewIcon, ArrowBack as ArrowBackIcon, CheckCircle as CheckCircleIcon, Warning as WarningIcon, Error as ErrorIcon } from '@mui/icons-material';
import axios from 'axios';

const ProcessPayroll = () => {
    const [currentPeriod, setCurrentPeriod] = useState(null);
    const [employees, setEmployees] = useState([]);
    const [selectedEmployees, setSelectedEmployees] = useState([]);
    const [empPage, setEmpPage] = useState(1);
    const [empPerPage, setEmpPerPage] = useState(10);
    const [empTotal, setEmpTotal] = useState(0);
    const [empLastPage, setEmpLastPage] = useState(1);
    const [search, setSearch] = useState('');
    const [searchDebounce, setSearchDebounce] = useState(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [previewing, setPreviewing] = useState(false);
    const [activeStep, setActiveStep] = useState(0);

    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const steps = ['Select Payroll Period', 'Select Employees', 'Preview Calculations', 'Process Payroll'];

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        // refetch employees when pagination changes
        if (currentPeriod !== null) {
            fetchEmployees(empPage, empPerPage, search);
        }
    }, [empPage, empPerPage]);

    useEffect(() => {
        // debounce search
        if (searchDebounce) clearTimeout(searchDebounce);
        const t = setTimeout(() => {
            setEmpPage(1);
            fetchEmployees(1, empPerPage, search);
        }, 450);
        setSearchDebounce(t);
        return () => clearTimeout(t);
    }, [search]);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            // Fetch current period
            const periodResponse = await axios.get('/api/payroll/periods?status=draft');

            if (periodResponse.data.success && periodResponse.data.periods.data.length > 0) {
                setCurrentPeriod(periodResponse.data.periods.data[0]);
                setActiveStep(1);
            }

            // Fetch first page of employees
            await fetchEmployees(empPage, empPerPage);
        } catch (error) {
            console.error('Error fetching data:', error);
            showSnackbar('Error loading data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchEmployees = async (page = 1, perPage = 10, searchTerm = '') => {
        try {
            const res = await axios.get('/api/payroll/employees/salaries', { params: { page, per_page: perPage, has_salary: 1, active_salary: 1, search: searchTerm } });
            if (res.data.success) {
                const data = res.data.employees;
                const employeesWithSalary = data.data.filter((emp) => emp.salary_structure);
                setEmployees(employeesWithSalary);
                setEmpPage(data.current_page || page);
                setEmpPerPage(data.per_page || perPage);
                setEmpTotal(data.total || employeesWithSalary.length);
                setEmpLastPage(data.last_page || 1);

                // Default select visible employees on first load
                setSelectedEmployees(employeesWithSalary.map((emp) => emp.id));
            }
        } catch (err) {
            console.error('Error fetching employees:', err);
        }
    };

    const handleSelectAllAcrossPages = async () => {
        // Fetch all matching employee ids from server and select them
        try {
            showSnackbar('Selecting all employees...', 'info');
            const res = await axios.get('/api/payroll/employees/salaries', { params: { page: 1, per_page: 0, has_salary: 1, active_salary: 1, search } });
            if (res.data.success) {
                const all = res.data.employees.data || [];
                const ids = all.map((e) => e.id);
                setSelectedEmployees(ids);
                showSnackbar(`${ids.length} employees selected`, 'success');
            }
        } catch (err) {
            console.error('Error selecting all employees:', err);
            showSnackbar('Error selecting all employees', 'error');
        }
    };

    const handlePreviewPayroll = async () => {
        if (!currentPeriod || selectedEmployees.length === 0) {
            showSnackbar('Please select a period and employees', 'warning');
            return;
        }
        setPreviewing(true);
        try {
            const response = await axios.post('/api/payroll/preview-session', {
                period_id: currentPeriod.id,
                employee_ids: selectedEmployees,
            });

            if (response.data.success && response.data.token) {
                const token = response.data.token;
                router.visit(route('employees.payroll.preview') + '?token=' + token);
            } else {
                showSnackbar('Could not create preview session', 'error');
            }
        } catch (err) {
            console.error('Error creating preview session:', err);
            showSnackbar('Error creating preview session', 'error');
        } finally {
            setPreviewing(false);
        }
    };

    const handleProcessPayroll = async () => {
        if (!currentPeriod || selectedEmployees.length === 0) {
            showSnackbar('Please select a period and employees', 'warning');
            return;
        }

        setProcessing(true);
        try {
            const response = await axios.post(`/api/payroll/periods/${currentPeriod.id}/process`, {
                employee_ids: selectedEmployees,
            });

            if (response.data.success) {
                showSnackbar(`Payroll processed successfully for ${response.data.data.total_employees} employees!`, 'success');
                setActiveStep(3);

                // Redirect to payslips after successful processing
                setTimeout(() => {
                    router.visit(route('employees.payroll.payslips'));
                }, 2000);
            } else {
                showSnackbar(response.data.message || 'Error processing payroll', 'error');
            }
        } catch (error) {
            console.error('Error processing payroll:', error);
            showSnackbar('Error processing payroll', 'error');
        } finally {
            setProcessing(false);
        }
    };

    const handleEmployeeSelection = (employeeId, checked) => {
        if (checked) {
            setSelectedEmployees((prev) => [...prev, employeeId]);
        } else {
            setSelectedEmployees((prev) => prev.filter((id) => id !== employeeId));
        }
    };

    const handleSelectAll = (checked) => {
        const visibleIds = employees.map((emp) => emp.id);
        if (checked) {
            // add visible ids to selectedEmployees (avoid duplicates)
            setSelectedEmployees((prev) => Array.from(new Set([...prev, ...visibleIds])));
        } else {
            // remove visible ids from selectedEmployees
            setSelectedEmployees((prev) => prev.filter((id) => !visibleIds.includes(id)));
        }
    };

    const showSnackbar = (message, severity = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-PK', {
            style: 'currency',
            currency: 'PKR',
        })
            .format(amount || 0)
            .replace('PKR', 'Rs');
    };

    if (loading) {
        return (
            <AdminLayout>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                    <CircularProgress size={60} sx={{ color: '#063455' }} />
                </Box>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <Box sx={{bgcolor:'#f5f5f5', p: 2 }}>
                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <IconButton onClick={() => window.history.back()}>
                            <ArrowBackIcon sx={{color:'#063455'}} />
                        </IconButton>
                        <Typography sx={{ color: '#063455', fontWeight: 700, fontSize:'30px' }}>
                            Process Payroll
                        </Typography>
                    </Box>
                </Box>

                <Grid container spacing={2}>
                    {/* Stepper */}
                    <Grid item xs={12} md={3}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" sx={{ color: '#063455', fontWeight: 600, mb: 3 }}>
                                    Process Steps
                                </Typography>
                                <Stepper activeStep={activeStep} orientation="vertical">
                                    {steps.map((label, index) => (
                                        <Step key={label}>
                                            <StepLabel
                                                StepIconProps={{
                                                    sx: {
                                                        color: index <= activeStep ? '#063455' : '#ccc',
                                                        '&.Mui-active': { color: '#063455' },
                                                        '&.Mui-completed': { color: '#2e7d32' },
                                                    },
                                                }}
                                            >
                                                {label}
                                            </StepLabel>
                                        </Step>
                                    ))}
                                </Stepper>
                            </CardContent>
                        </Card>

                        {/* Summary Card */}
                        {currentPeriod && (
                            <Card sx={{ mt: 3 }}>
                                <CardContent>
                                    <Typography variant="h6" sx={{ color: '#063455', fontWeight: 600, mb: 2 }}>
                                        Current Period
                                    </Typography>
                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="subtitle2" color="textSecondary">
                                            Period Name
                                        </Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                            {currentPeriod.period_name}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="subtitle2" color="textSecondary">
                                            Date Range
                                        </Typography>
                                        <Typography variant="body2">
                                            {new Date(currentPeriod.start_date).toLocaleDateString()} - {new Date(currentPeriod.end_date).toLocaleDateString()}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="subtitle2" color="textSecondary">
                                            Selected Employees
                                        </Typography>
                                        <Typography variant="h6" sx={{ color: '#063455', fontWeight: 600 }}>
                                            {selectedEmployees.length} / {empTotal}
                                        </Typography>
                                    </Box>
                                </CardContent>
                            </Card>
                        )}
                    </Grid>

                    {/* Main Content */}
                    <Grid item xs={12} md={9}>
                        {!currentPeriod ? (
                            <Card>
                                <CardContent sx={{ textAlign: 'center', py: 6 }}>
                                    <WarningIcon sx={{ fontSize: 64, color: '#ed6c02', mb: 2 }} />
                                    <Typography variant="h6" sx={{ mb: 2 }}>
                                        No Active Payroll Period
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                                        Please create a payroll period before processing payroll.
                                    </Typography>
                                    <Button
                                        variant="contained"
                                        onClick={() => router.visit(route('employees.payroll.periods.create'))}
                                        sx={{
                                            backgroundColor: '#063455',
                                            '&:hover': { backgroundColor: '#052d45' },
                                        }}
                                    >
                                        Create Payroll Period
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : (
                            <Card>
                                <CardContent>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                        <Typography variant="h6" sx={{ color: '#063455', fontWeight: 600 }}>
                                            Select Employees ({selectedEmployees.length} selected)
                                        </Typography>
                                        <Box sx={{ display: 'flex', gap: 2 }}>
                                            <FormControlLabel control={<Checkbox checked={employees.length > 0 && employees.every((emp) => selectedEmployees.includes(emp.id))} indeterminate={selectedEmployees.length > 0 && selectedEmployees.some((id) => employees.map((e) => e.id).includes(id)) && !employees.every((emp) => selectedEmployees.includes(emp.id))} onChange={(e) => handleSelectAll(e.target.checked)} sx={{ color: '#063455' }} />} label="Select Page" />
                                            <Button
                                                startIcon={<PreviewIcon />}
                                                onClick={handlePreviewPayroll}
                                                disabled={selectedEmployees.length === 0 || previewing}
                                                variant="outlined"
                                                sx={{
                                                    color: '#063455',
                                                    borderColor: '#063455',
                                                    '&:hover': { borderColor: '#052d45' },
                                                }}
                                            >
                                                {previewing ? 'Generating Preview...' : 'Preview Payroll'}
                                            </Button>
                                        </Box>
                                    </Box>

                                    <TableContainer component={Paper} sx={{ maxHeight: 500 }}>
                                        <Table stickyHeader>
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell padding="checkbox">
                                                        <Checkbox checked={employees.length > 0 && employees.every((emp) => selectedEmployees.includes(emp.id))} indeterminate={selectedEmployees.length > 0 && selectedEmployees.some((id) => employees.map((e) => e.id).includes(id)) && !employees.every((emp) => selectedEmployees.includes(emp.id))} onChange={(e) => handleSelectAll(e.target.checked)} sx={{ color: '#063455' }} />
                                                    </TableCell>
                                                    <TableCell sx={{ fontWeight: 600, color: '#063455' }}>Employee</TableCell>
                                                    <TableCell sx={{ fontWeight: 600, color: '#063455' }}>Department</TableCell>
                                                    <TableCell sx={{ fontWeight: 600, color: '#063455' }}>Basic Salary</TableCell>
                                                    <TableCell sx={{ fontWeight: 600, color: '#063455' }}>Status</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {employees.map((employee) => (
                                                    <TableRow key={employee.id}>
                                                        <TableCell padding="checkbox">
                                                            <Checkbox checked={selectedEmployees.includes(employee.id)} onChange={(e) => handleEmployeeSelection(employee.id, e.target.checked)} sx={{ color: '#063455' }} />
                                                        </TableCell>
                                                        <TableCell>
                                                            <Box>
                                                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                                                    {employee.name}
                                                                </Typography>
                                                                <Typography variant="caption" color="textSecondary">
                                                                    ID: {employee.employee_id}
                                                                </Typography>
                                                            </Box>
                                                        </TableCell>
                                                        <TableCell>{employee.department?.name || 'N/A'}</TableCell>
                                                        <TableCell>
                                                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                                                {formatCurrency(employee.salary_structure?.basic_salary)}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Chip label="Ready" size="small" color="success" />
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>

                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <TextField size="small" placeholder="Search employees" value={search} onChange={(e) => setSearch(e.target.value)} />
                                            <Typography variant="body2" color="textSecondary">
                                                Per page:
                                            </Typography>
                                            <select
                                                value={empPerPage}
                                                onChange={(e) => {
                                                    setEmpPerPage(parseInt(e.target.value));
                                                    setEmpPage(1);
                                                }}
                                                style={{ padding: '6px 8px', borderRadius: 4 }}
                                            >
                                                <option value={10}>10</option>
                                                <option value={20}>20</option>
                                                <option value={50}>50</option>
                                                <option value={0}>All</option>
                                            </select>
                                            <Button variant="text" onClick={handleSelectAllAcrossPages} sx={{ textTransform: 'none' }}>
                                                Select All
                                            </Button>
                                            <Typography variant="body2" color="textSecondary">
                                                Total: {empTotal}
                                            </Typography>
                                        </Box>

                                        <Box>
                                            <Pagination count={empLastPage} page={empPage} onChange={(e, value) => setEmpPage(value)} color="primary" showFirstButton showLastButton />
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        )}
                    </Grid>
                </Grid>

                {/* Preview moved to full page: employees/payroll/preview */}

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

export default ProcessPayroll;
