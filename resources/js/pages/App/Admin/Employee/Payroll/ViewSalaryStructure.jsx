import { useState } from 'react';
import { router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import AdminLayout from '@/layouts/AdminLayout';
import { Box, Card, CardContent, Typography, Button, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Alert, Snackbar, Divider, Chip, Avatar, IconButton, CircularProgress } from '@mui/material';
import { ArrowBack as ArrowBackIcon, Edit as EditIcon, Person as PersonIcon, AccountBalance as AccountBalanceIcon, TrendingUp as TrendingUpIcon, TrendingDown as TrendingDownIcon, CalendarToday as CalendarTodayIcon } from '@mui/icons-material';
import axios from 'axios';

const ViewSalaryStructure = ({ employee }) => {
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    // Helper function to get salary structure (handles both camelCase and snake_case)
    const getSalaryStructure = () => {
        return employee?.salaryStructure || employee?.salary_structure;
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

    const calculateAllowanceAmount = (allowance, basicSalary) => {
        const type = allowance?.allowance_type?.type || allowance?.type;
        if (type === 'percentage') {
            const percentage = parseFloat(allowance?.percentage ?? allowance?.amount ?? 0);
            return (basicSalary * percentage) / 100;
        }
        return parseFloat(allowance?.amount ?? 0);
    };

    const calculateDeductionAmount = (deduction, basicSalary, grossSalary) => {
        const type = deduction?.deduction_type?.type || deduction?.type;
        if (type === 'percentage') {
            const percentage = parseFloat(deduction?.percentage ?? deduction?.amount ?? 0);
            const calculationBase = (deduction?.deduction_type?.calculation_base || 'basic_salary') === 'gross_salary' ? grossSalary : basicSalary;
            return (calculationBase * percentage) / 100;
        }
        return parseFloat(deduction?.amount ?? 0);
    };

    const calculateTotalAllowances = () => {
        if (!employee?.allowances) return 0;
        const salaryStructure = getSalaryStructure();
        const basicSalary = parseFloat(salaryStructure?.basic_salary || 0);
        return employee.allowances.reduce((total, allowance) => total + calculateAllowanceAmount(allowance, basicSalary), 0);
    };

    const calculateTotalDeductions = () => {
        if (!employee?.deductions) return 0;
        const salaryStructure = getSalaryStructure();
        const basicSalary = parseFloat(salaryStructure?.basic_salary || 0);
        const grossSalary = basicSalary + calculateTotalAllowances();
        return employee.deductions.reduce((total, deduction) => total + calculateDeductionAmount(deduction, basicSalary, grossSalary), 0);
    };

    const calculateGrossSalary = () => {
        const salaryStructure = getSalaryStructure();
        const basicSalary = parseFloat(salaryStructure?.basic_salary || 0);
        return basicSalary + calculateTotalAllowances();
    };

    const calculateNetSalary = () => {
        return calculateGrossSalary() - calculateTotalDeductions();
    };

    if (!employee) {
        return (
            <AdminLayout>
                <Box sx={{ p: 3 }}>
                    <Alert severity="error">Employee not found</Alert>
                </Box>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <Box sx={{ bgcolor: '#f5f5f5', p: 2 }}>
                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <IconButton onClick={() => window.history.back()}>
                            <ArrowBackIcon sx={{color: '#063455'}} />
                        </IconButton>
                        <Typography variant="h5" sx={{ color: '#063455', fontWeight: 600 }}>
                            Salary Structure Details
                        </Typography>
                    </Box>

                    {getSalaryStructure() && (
                        <Button
                            startIcon={<EditIcon />}
                            onClick={() => router.visit(route('employees.payroll.salaries.edit', employee.id))}
                            variant="contained"
                            sx={{
                                backgroundColor: '#063455',
                                '&:hover': { backgroundColor: '#052d45' },
                            }}
                        >
                            Edit Structure
                        </Button>
                    )}
                </Box>

                <Grid container spacing={2}>
                    {/* Employee Information */}
                    <Grid item xs={12} md={3}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                                    <Avatar sx={{ bgcolor: '#063455', width: 56, height: 56, mr: 2 }}>
                                        <PersonIcon sx={{ fontSize: 32 }} />
                                    </Avatar>
                                    <Box>
                                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                            {employee.name}
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            ID: {employee.employee_id}
                                        </Typography>
                                    </Box>
                                </Box>

                                <Grid container spacing={2}>
                                    <Grid item xs={12}>
                                        <Box sx={{ mb: 2 }}>
                                            <Typography variant="subtitle2" color="textSecondary">
                                                Department
                                            </Typography>
                                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                                {employee.department?.name || 'N/A'}
                                            </Typography>
                                        </Box>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Box sx={{ mb: 2 }}>
                                            <Typography variant="subtitle2" color="textSecondary">
                                                Designation
                                            </Typography>
                                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                                {employee.designation || 'N/A'}
                                            </Typography>
                                        </Box>
                                    </Grid>

                                    <Grid item xs={12}>
                                        <Box>
                                            <Typography variant="subtitle2" color="textSecondary">
                                                Status
                                            </Typography>
                                            <Chip label={getSalaryStructure() ? 'Active Structure' : 'No Structure'} size="small" color={getSalaryStructure() ? 'success' : 'error'} />
                                        </Box>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>

                        {/* Salary Summary Cards */}
                        {getSalaryStructure() && (
                            <Box sx={{ mt: 3 }}>
                                <Grid container spacing={2}>
                                    <Grid item xs={12}>
                                        <Card sx={{ background: 'linear-gradient(135deg, #063455 0%, #0a4a6b 100%)', color: 'white' }}>
                                            <CardContent sx={{ textAlign: 'center', py: 3 }}>
                                                <AccountBalanceIcon sx={{ fontSize: 40, mb: 1 }} />
                                                <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                                                    {formatCurrency(getSalaryStructure().basic_salary)}
                                                </Typography>
                                                <Typography variant="body2">Basic Salary</Typography>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Card sx={{ background: 'linear-gradient(135deg, #2e7d32 0%, #388e3c 100%)', color: 'white' }}>
                                            <CardContent sx={{ textAlign: 'center', py: 2 }}>
                                                <TrendingUpIcon sx={{ fontSize: 32, mb: 1 }} />
                                                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                                                    {formatCurrency(calculateTotalAllowances())}
                                                </Typography>
                                                <Typography variant="caption">Allowances</Typography>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Card sx={{ background: 'linear-gradient(135deg, #d32f2f 0%, #f44336 100%)', color: 'white' }}>
                                            <CardContent sx={{ textAlign: 'center', py: 2 }}>
                                                <TrendingDownIcon sx={{ fontSize: 32, mb: 1 }} />
                                                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                                                    {formatCurrency(calculateTotalDeductions())}
                                                </Typography>
                                                <Typography variant="caption">Deductions</Typography>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                </Grid>
                            </Box>
                        )}
                    </Grid>

                    {/* Salary Structure Details */}
                    <Grid item xs={12} md={9}>
                        {getSalaryStructure() ? (
                            <Box>
                                {/* Basic Information */}
                                <Card sx={{ mb: 3 }}>
                                    <CardContent>
                                        <Typography variant="h6" sx={{ color: '#063455', fontWeight: 600, mb: 3 }}>
                                            Salary Structure Information
                                        </Typography>

                                        <Grid container spacing={3}>
                                            <Grid item xs={12} sm={6}>
                                                <Box sx={{ mb: 2 }}>
                                                    <Typography variant="subtitle2" color="textSecondary">
                                                        Basic Salary
                                                    </Typography>
                                                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#063455' }}>
                                                        {formatCurrency(getSalaryStructure().basic_salary)}
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                            <Grid item xs={12} sm={6}>
                                                <Box sx={{ mb: 2 }}>
                                                    <Typography variant="subtitle2" color="textSecondary">
                                                        Effective From
                                                    </Typography>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <CalendarTodayIcon sx={{ fontSize: 16, color: '#063455' }} />
                                                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                                            {new Date(getSalaryStructure().effective_from).toLocaleDateString()}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </Grid>
                                        </Grid>

                                        <Divider sx={{ my: 3 }} />

                                        {/* Salary Calculation */}
                                        <Box>
                                            <Typography variant="h6" sx={{ color: '#063455', fontWeight: 600, mb: 2 }}>
                                                Salary Calculation
                                            </Typography>
                                            <Grid container spacing={2}>
                                                <Grid item xs={12} sm={6}>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                                        <Typography variant="body2">Basic Salary</Typography>
                                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                            {formatCurrency(getSalaryStructure().basic_salary)}
                                                        </Typography>
                                                    </Box>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                                        <Typography variant="body2">Total Allowances</Typography>
                                                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#2e7d32' }}>
                                                            + {formatCurrency(calculateTotalAllowances())}
                                                        </Typography>
                                                    </Box>
                                                    <Divider sx={{ my: 1 }} />
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                                            Gross Salary
                                                        </Typography>
                                                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                                            {formatCurrency(calculateGrossSalary())}
                                                        </Typography>
                                                    </Box>
                                                </Grid>
                                                <Grid item xs={12} sm={6}>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                                        <Typography variant="body2">Total Deductions</Typography>
                                                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#d32f2f' }}>
                                                            - {formatCurrency(calculateTotalDeductions())}
                                                        </Typography>
                                                    </Box>
                                                    <Divider sx={{ my: 1 }} />
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                        <Typography variant="h6" sx={{ fontWeight: 600, color: '#063455' }}>
                                                            Net Salary
                                                        </Typography>
                                                        <Typography variant="h6" sx={{ fontWeight: 600, color: '#063455' }}>
                                                            {formatCurrency(calculateNetSalary())}
                                                        </Typography>
                                                    </Box>
                                                </Grid>
                                            </Grid>
                                        </Box>
                                    </CardContent>
                                </Card>

                                {/* Allowances */}
                                {employee.allowances && employee.allowances.length > 0 && (
                                    <Card sx={{ mb: 3 }}>
                                        <CardContent>
                                            <Typography variant="h6" sx={{ color: '#063455', fontWeight: 600, mb: 3 }}>
                                                Allowances ({employee.allowances.length})
                                            </Typography>
                                            <TableContainer component={Paper}>
                                                <Table>
                                                    <TableHead>
                                                        <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                                                            <TableCell sx={{ fontWeight: 600, color: '#063455' }}>Allowance Type</TableCell>
                                                            <TableCell sx={{ fontWeight: 600, color: '#063455' }}>Type</TableCell>
                                                            <TableCell sx={{ fontWeight: 600, color: '#063455' }}>Amount</TableCell>
                                                            <TableCell sx={{ fontWeight: 600, color: '#063455' }}>Description</TableCell>
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        {employee.allowances.map((allowance, index) => (
                                                            <TableRow key={index}>
                                                                <TableCell>
                                                                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                                                        {allowance.allowance_type?.name}
                                                                    </Typography>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Chip label={allowance.allowance_type?.type} size="small" color="primary" />
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#2e7d32' }}>
                                                                        {formatCurrency(calculateAllowanceAmount(allowance, parseFloat(getSalaryStructure()?.basic_salary || 0)))}
                                                                    </Typography>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Typography variant="body2" color="textSecondary">
                                                                        {allowance.allowance_type?.description || 'N/A'}
                                                                    </Typography>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Deductions */}
                                {employee.deductions && employee.deductions.length > 0 && (
                                    <Card>
                                        <CardContent>
                                            <Typography variant="h6" sx={{ color: '#063455', fontWeight: 600, mb: 3 }}>
                                                Deductions ({employee.deductions.length})
                                            </Typography>
                                            <TableContainer component={Paper}>
                                                <Table>
                                                    <TableHead>
                                                        <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                                                            <TableCell sx={{ fontWeight: 600, color: '#063455' }}>Deduction Type</TableCell>
                                                            <TableCell sx={{ fontWeight: 600, color: '#063455' }}>Type</TableCell>
                                                            <TableCell sx={{ fontWeight: 600, color: '#063455' }}>Amount</TableCell>
                                                            <TableCell sx={{ fontWeight: 600, color: '#063455' }}>Description</TableCell>
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        {employee.deductions.map((deduction, index) => (
                                                            <TableRow key={index}>
                                                                <TableCell>
                                                                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                                                        {deduction.deduction_type?.name}
                                                                    </Typography>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Chip label={deduction.deduction_type?.type} size="small" color="secondary" />
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#d32f2f' }}>
                                                                        {formatCurrency(calculateDeductionAmount(deduction, parseFloat(getSalaryStructure()?.basic_salary || 0), calculateGrossSalary()))}
                                                                    </Typography>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Typography variant="body2" color="textSecondary">
                                                                        {deduction.deduction_type?.description || 'N/A'}
                                                                    </Typography>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>
                                        </CardContent>
                                    </Card>
                                )}
                            </Box>
                        ) : (
                            <Card>
                                <CardContent sx={{ textAlign: 'center', py: 6 }}>
                                    <AccountBalanceIcon sx={{ fontSize: 64, color: '#ccc', mb: 2 }} />
                                    <Typography variant="h6" color="textSecondary" sx={{ mb: 1 }}>
                                        No Salary Structure Found
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                                        This employee doesn't have a salary structure configured yet.
                                    </Typography>
                                    <Button
                                        variant="contained"
                                        onClick={() => router.visit(route('employees.payroll.salaries.create', employee.id))}
                                        sx={{
                                            backgroundColor: '#063455',
                                            '&:hover': { backgroundColor: '#052d45' },
                                        }}
                                    >
                                        Create Salary Structure
                                    </Button>
                                </CardContent>
                            </Card>
                        )}
                    </Grid>
                </Grid>

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

export default ViewSalaryStructure;
