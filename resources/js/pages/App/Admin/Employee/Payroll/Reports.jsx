import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import AdminLayout from '@/layouts/AdminLayout';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    CircularProgress,
    Alert,
    Snackbar,
    Divider,
    Chip
} from '@mui/material';
import {
    ArrowBack as ArrowBackIcon,
    Assessment as AssessmentIcon,
    Print as PrintIcon,
    GetApp as GetAppIcon,
    TrendingUp as TrendingUpIcon,
    People as PeopleIcon,
    AccountBalance as AccountBalanceIcon,
    PieChart as PieChartIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import axios from 'axios';

const PayrollReports = () => {
    const [periods, setPeriods] = useState([]);
    const [selectedPeriod, setSelectedPeriod] = useState('');
    const [reportType, setReportType] = useState('summary'); // Default to summary
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    useEffect(() => {
        fetchPeriods();
    }, []);

    useEffect(() => {
        if (selectedPeriod && reportType) {
            generateReport();
        }
    }, [selectedPeriod, reportType]);

    const fetchPeriods = async () => {
        try {
            const response = await axios.get('/api/payroll/periods');
            console.log('Periods API response:', response.data);
            if (response.data.success) {
                // Include all periods that have payslips, regardless of status
                const availablePeriods = response.data.periods.data || [];
                console.log('Available periods:', availablePeriods);
                setPeriods(availablePeriods);
                if (availablePeriods.length > 0) {
                    // Auto-select the most recent period
                    const recentPeriod = availablePeriods.find(p => p.status === 'processing') || availablePeriods[0];
                    console.log('Selected period:', recentPeriod);
                    setSelectedPeriod(recentPeriod.id);
                }
            }
        } catch (error) {
            console.error('Error fetching periods:', error);
            showSnackbar('Error loading payroll periods', 'error');
        }
    };

    const generateReport = async () => {
        if (!selectedPeriod || !reportType) {
            console.log('Missing selectedPeriod or reportType:', { selectedPeriod, reportType });
            return;
        }

        console.log('Generating report for period:', selectedPeriod, 'type:', reportType);
        setLoading(true);
        try {
            const endpoint = reportType === 'summary' 
                ? `/api/payroll/reports/summary/${selectedPeriod}`
                : `/api/payroll/reports/detailed/${selectedPeriod}`;
                
            console.log('API endpoint:', endpoint);
            const response = await axios.get(endpoint);
            console.log('Report API response:', response.data);
            
            if (response.data.success) {
                setReportData(response.data.report);
                if (!response.data.report || (response.data.report.total_employees === 0)) {
                    showSnackbar('No payslips found for this period', 'warning');
                } else {
                    showSnackbar('Report generated successfully!', 'success');
                }
            } else {
                showSnackbar('Failed to generate report', 'error');
            }
        } catch (error) {
            console.error('Error generating report:', error);
            if (error.response?.status === 404) {
                showSnackbar('Period not found or no payslips available', 'error');
            } else {
                showSnackbar(`Error generating report: ${error.message}`, 'error');
            }
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

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-PK', {
            style: 'currency',
            currency: 'PKR'
        }).format(amount || 0).replace('PKR', 'Rs');
    };

    const handlePrintReport = () => {
        if (reportType === 'summary') {
            window.open(route('employees.payroll.reports.summary.print', selectedPeriod), '_blank');
        } else {
            window.open(route('employees.payroll.reports.detailed.print', selectedPeriod), '_blank');
        }
    };

    const renderSummaryReport = () => {
        if (!reportData) return null;

        return (
            <Box>
                {/* Summary Statistics */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card sx={{ textAlign: 'center', p: 3, background: 'linear-gradient(135deg, #063455 0%, #0a4a6b 100%)', color: 'white' }}>
                            <PeopleIcon sx={{ fontSize: 48, mb: 2 }} />
                            <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
                                {reportData.total_employees || 0}
                            </Typography>
                            <Typography variant="body2">
                                Total Employees
                            </Typography>
                        </Card>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={3}>
                        <Card sx={{ textAlign: 'center', p: 3, background: 'linear-gradient(135deg, #2e7d32 0%, #388e3c 100%)', color: 'white' }}>
                            <AccountBalanceIcon sx={{ fontSize: 48, mb: 2 }} />
                            <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
                                {formatCurrency(reportData.total_gross_salary)}
                            </Typography>
                            <Typography variant="body2">
                                Total Gross Salary
                            </Typography>
                        </Card>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={3}>
                        <Card sx={{ textAlign: 'center', p: 3, background: 'linear-gradient(135deg, #1976d2 0%, #1e88e5 100%)', color: 'white' }}>
                            <TrendingUpIcon sx={{ fontSize: 48, mb: 2 }} />
                            <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
                                {formatCurrency(reportData.total_net_salary)}
                            </Typography>
                            <Typography variant="body2">
                                Total Net Salary
                            </Typography>
                        </Card>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={3}>
                        <Card sx={{ textAlign: 'center', p: 3, background: 'linear-gradient(135deg, #ed6c02 0%, #f57c00 100%)', color: 'white' }}>
                            <PieChartIcon sx={{ fontSize: 48, mb: 2 }} />
                            <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
                                {formatCurrency(reportData.total_deductions)}
                            </Typography>
                            <Typography variant="body2">
                                Total Deductions
                            </Typography>
                        </Card>
                    </Grid>
                </Grid>

                {/* Department-wise Breakdown */}
                {reportData.department_breakdown && (
                    <Card sx={{ mb: 4 }}>
                        <CardContent>
                            <Typography variant="h6" sx={{ color: '#063455', fontWeight: 600, mb: 3 }}>
                                Department-wise Breakdown
                            </Typography>
                            <TableContainer component={Paper}>
                                <Table>
                                    <TableHead>
                                        <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                                            <TableCell sx={{ fontWeight: 600, color: '#063455' }}>Department</TableCell>
                                            <TableCell sx={{ fontWeight: 600, color: '#063455' }}>Employees</TableCell>
                                            <TableCell sx={{ fontWeight: 600, color: '#063455' }}>Total Gross</TableCell>
                                            <TableCell sx={{ fontWeight: 600, color: '#063455' }}>Total Deductions</TableCell>
                                            <TableCell sx={{ fontWeight: 600, color: '#063455' }}>Total Net</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {Object.entries(reportData.department_breakdown).map(([department, data]) => (
                                            <TableRow key={department}>
                                                <TableCell>
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                                        {department}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>{data.employee_count}</TableCell>
                                                <TableCell>{formatCurrency(data.total_gross)}</TableCell>
                                                <TableCell>{formatCurrency(data.total_deductions)}</TableCell>
                                                <TableCell>
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#2e7d32' }}>
                                                        {formatCurrency(data.total_net)}
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

                {/* Allowances & Deductions Summary */}
                <Grid container spacing={3}>
                    {reportData.allowances_summary && (
                        <Grid item xs={12} md={6}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" sx={{ color: '#063455', fontWeight: 600, mb: 3 }}>
                                        Allowances Summary
                                    </Typography>
                                    {Object.entries(reportData.allowances_summary).map(([allowance, amount]) => (
                                        <Box key={allowance} sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                            <Typography variant="body2">{allowance}</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#2e7d32' }}>
                                                {formatCurrency(amount)}
                                            </Typography>
                                        </Box>
                                    ))}
                                </CardContent>
                            </Card>
                        </Grid>
                    )}

                    {reportData.deductions_summary && (
                        <Grid item xs={12} md={6}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" sx={{ color: '#063455', fontWeight: 600, mb: 3 }}>
                                        Deductions Summary
                                    </Typography>
                                    {Object.entries(reportData.deductions_summary).map(([deduction, amount]) => (
                                        <Box key={deduction} sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                            <Typography variant="body2">{deduction}</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#d32f2f' }}>
                                                {formatCurrency(amount)}
                                            </Typography>
                                        </Box>
                                    ))}
                                </CardContent>
                            </Card>
                        </Grid>
                    )}
                </Grid>
            </Box>
        );
    };

    const renderDetailedReport = () => {
        if (!reportData || !reportData.payslips) return null;

        return (
            <Card>
                <CardContent>
                    <Typography variant="h6" sx={{ color: '#063455', fontWeight: 600, mb: 3 }}>
                        Detailed Employee Report
                    </Typography>
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                                    <TableCell sx={{ fontWeight: 600, color: '#063455' }}>Employee</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#063455' }}>Department</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#063455' }}>Basic Salary</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#063455' }}>Allowances</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#063455' }}>Deductions</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#063455' }}>Gross Salary</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#063455' }}>Net Salary</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#063455' }}>Status</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {reportData.payslips.map((payslip) => (
                                    <TableRow key={payslip.id}>
                                        <TableCell>
                                            <Box>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                                    {payslip.employee?.name}
                                                </Typography>
                                                <Typography variant="caption" color="textSecondary">
                                                    ID: {payslip.employee?.employee_id}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>{payslip.employee?.department?.name || 'N/A'}</TableCell>
                                        <TableCell>{formatCurrency(payslip.basic_salary)}</TableCell>
                                        <TableCell>{formatCurrency(payslip.total_allowances)}</TableCell>
                                        <TableCell>{formatCurrency(payslip.total_deductions)}</TableCell>
                                        <TableCell>{formatCurrency(payslip.gross_salary)}</TableCell>
                                        <TableCell>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#2e7d32' }}>
                                                {formatCurrency(payslip.net_salary)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={payslip.status}
                                                size="small"
                                                color={payslip.status === 'approved' ? 'success' : 'warning'}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </CardContent>
            </Card>
        );
    };

    return (
        <AdminLayout>
            <Box sx={{ p: 3 }}>
                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Button
                            startIcon={<ArrowBackIcon />}
                            onClick={() => router.visit(route('employees.payroll.dashboard'))}
                            sx={{ color: '#063455' }}
                        >
                            Back to Dashboard
                        </Button>
                        <Typography variant="h4" sx={{ color: '#063455', fontWeight: 600 }}>
                            Payroll Reports
                        </Typography>
                    </Box>
                    
                    {reportData && (
                        <Button
                            startIcon={<PrintIcon />}
                            onClick={handlePrintReport}
                            variant="contained"
                            sx={{ 
                                backgroundColor: '#063455',
                                '&:hover': { backgroundColor: '#052d45' }
                            }}
                        >
                            Print Report
                        </Button>
                    )}
                </Box>

                {/* Report Filters */}
                <Card sx={{ mb: 4, p: 3 }}>
                    <Grid container spacing={3} alignItems="center">
                        <Grid item xs={12} sm={6} md={4}>
                            <FormControl fullWidth>
                                <InputLabel>Payroll Period</InputLabel>
                                <Select
                                    value={selectedPeriod}
                                    label="Payroll Period"
                                    onChange={(e) => setSelectedPeriod(e.target.value)}
                                >
                                    {periods.map((period) => (
                                        <MenuItem key={period.id} value={period.id}>
                                            {period.period_name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        
                        <Grid item xs={12} sm={6} md={4}>
                            <FormControl fullWidth>
                                <InputLabel>Report Type</InputLabel>
                                <Select
                                    value={reportType}
                                    label="Report Type"
                                    onChange={(e) => setReportType(e.target.value)}
                                >
                                    <MenuItem value="summary">Summary Report</MenuItem>
                                    <MenuItem value="detailed">Detailed Report</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        
                        <Grid item xs={12} sm={6} md={4}>
                            <Button
                                fullWidth
                                variant="outlined"
                                startIcon={<AssessmentIcon />}
                                onClick={generateReport}
                                disabled={!selectedPeriod || !reportType || loading}
                                sx={{ 
                                    color: '#063455',
                                    borderColor: '#063455',
                                    '&:hover': { borderColor: '#052d45' }
                                }}
                            >
                                {loading ? 'Generating...' : 'Generate Report'}
                            </Button>
                        </Grid>
                    </Grid>
                </Card>

                {/* Report Content */}
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                        <CircularProgress size={60} sx={{ color: '#063455' }} />
                    </Box>
                ) : reportData ? (
                    <Box>
                        {/* Period Information */}
                        <Card sx={{ mb: 4, p: 3, backgroundColor: '#f8f9fa' }}>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="textSecondary">Period Name</Typography>
                                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                        {periods.find(p => p.id == selectedPeriod)?.period_name}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="textSecondary">Date Range</Typography>
                                    <Typography variant="body1">
                                        {periods.find(p => p.id == selectedPeriod) && (
                                            `${new Date(periods.find(p => p.id == selectedPeriod).start_date).toLocaleDateString()} - ${new Date(periods.find(p => p.id == selectedPeriod).end_date).toLocaleDateString()}`
                                        )}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </Card>

                        {/* Report Content */}
                        {reportType === 'summary' ? renderSummaryReport() : renderDetailedReport()}
                    </Box>
                ) : (
                    <Card sx={{ p: 6, textAlign: 'center' }}>
                        <AssessmentIcon sx={{ fontSize: 64, color: '#ccc', mb: 2 }} />
                        <Typography variant="h6" color="textSecondary" sx={{ mb: 1 }}>
                            No Report Generated
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                            Select a payroll period and report type to generate a report.
                        </Typography>
                    </Card>
                )}

                {/* Snackbar for notifications */}
                <Snackbar
                    open={snackbar.open}
                    autoHideDuration={6000}
                    onClose={handleCloseSnackbar}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                >
                    <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                        {snackbar.message}
                    </Alert>
                </Snackbar>
            </Box>
        </AdminLayout>
    );
};

export default PayrollReports;
