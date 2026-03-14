import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import AdminLayout from '@/layouts/AdminLayout';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Grid,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Divider,
    CircularProgress,
    Alert
} from '@mui/material';
import {
    Print as PrintIcon,
    ArrowBack as ArrowBackIcon,
    Assessment as AssessmentIcon,
    PieChart as PieChartIcon,
    TrendingUp as TrendingUpIcon,
    People as PeopleIcon,
    AccountBalance as AccountBalanceIcon
} from '@mui/icons-material';
import axios from 'axios';

const PrintReports = ({ periodId, reportType }) => {
    const [reportData, setReportData] = useState(null);
    const [period, setPeriod] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchReportData();
        // Auto-print after 1 second delay
        setTimeout(() => {
            window.print();
        }, 1000);
    }, [periodId, reportType]);

    const fetchReportData = async () => {
        setLoading(true);
        try {
            const endpoint = reportType === 'summary' 
                ? `/api/payroll/reports/summary/${periodId}`
                : `/api/payroll/reports/detailed/${periodId}`;
                
            const response = await axios.get(endpoint);
            
            if (response.data.success) {
                setReportData(response.data.report);
                setPeriod(response.data.period);
            } else {
                setError('Report data not found');
            }
        } catch (error) {
            console.error('Error fetching report data:', error);
            setError('Error loading report data');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-PK', {
            style: 'currency',
            currency: 'PKR'
        }).format(amount || 0).replace('PKR', 'Rs');
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-PK', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const numberToWords = (num) => {
        const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
        const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
        const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

        if (num === 0) return 'Zero';
        if (num < 0) return 'Negative ' + numberToWords(-num);

        let words = '';

        if (Math.floor(num / 10000000) > 0) {
            words += numberToWords(Math.floor(num / 10000000)) + ' Crore ';
            num %= 10000000;
        }

        if (Math.floor(num / 100000) > 0) {
            words += numberToWords(Math.floor(num / 100000)) + ' Lakh ';
            num %= 100000;
        }

        if (Math.floor(num / 1000) > 0) {
            words += numberToWords(Math.floor(num / 1000)) + ' Thousand ';
            num %= 1000;
        }

        if (Math.floor(num / 100) > 0) {
            words += numberToWords(Math.floor(num / 100)) + ' Hundred ';
            num %= 100;
        }

        if (num > 0) {
            if (num < 10) {
                words += ones[num];
            } else if (num >= 10 && num < 20) {
                words += teens[num - 10];
            } else {
                words += tens[Math.floor(num / 10)];
                if (num % 10 > 0) {
                    words += ' ' + ones[num % 10];
                }
            }
        }

        return words.trim();
    };

    const renderSummaryReport = () => {
        return (
            <Box>
                {/* Summary Statistics */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card sx={{ textAlign: 'center', p: 2, backgroundColor: '#f8f9fa' }}>
                            <PeopleIcon sx={{ fontSize: 32, color: '#063455', mb: 1 }} />
                            <Typography variant="h5" sx={{ fontWeight: 600, color: '#063455' }}>
                                {reportData.total_employees || 0}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                Total Employees
                            </Typography>
                        </Card>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={3}>
                        <Card sx={{ textAlign: 'center', p: 2, backgroundColor: '#f8f9fa' }}>
                            <AccountBalanceIcon sx={{ fontSize: 32, color: '#2e7d32', mb: 1 }} />
                            <Typography variant="h6" sx={{ fontWeight: 600, color: '#2e7d32' }}>
                                {formatCurrency(reportData.total_gross_salary)}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                Total Gross
                            </Typography>
                        </Card>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={3}>
                        <Card sx={{ textAlign: 'center', p: 2, backgroundColor: '#f8f9fa' }}>
                            <TrendingUpIcon sx={{ fontSize: 32, color: '#1976d2', mb: 1 }} />
                            <Typography variant="h6" sx={{ fontWeight: 600, color: '#1976d2' }}>
                                {formatCurrency(reportData.total_net_salary)}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                Total Net
                            </Typography>
                        </Card>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={3}>
                        <Card sx={{ textAlign: 'center', p: 2, backgroundColor: '#f8f9fa' }}>
                            <PieChartIcon sx={{ fontSize: 32, color: '#ed6c02', mb: 1 }} />
                            <Typography variant="h6" sx={{ fontWeight: 600, color: '#ed6c02' }}>
                                {formatCurrency(reportData.total_deductions)}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                Total Deductions
                            </Typography>
                        </Card>
                    </Grid>
                </Grid>

                {/* Department-wise Breakdown */}
                {reportData.department_breakdown && (
                    <Box sx={{ mb: 4 }}>
                        <Typography variant="h6" sx={{ color: '#063455', fontWeight: 600, mb: 2 }}>
                            Department-wise Breakdown
                        </Typography>
                        <TableContainer component={Paper}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                                        <TableCell sx={{ fontWeight: 600 }}>Department</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 600 }}>Employees</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 600 }}>Total Gross</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 600 }}>Total Deductions</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 600 }}>Total Net</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {Object.entries(reportData.department_breakdown).map(([department, data]) => (
                                        <TableRow key={department}>
                                            <TableCell sx={{ fontWeight: 600 }}>{department}</TableCell>
                                            <TableCell align="right">{data.employee_count}</TableCell>
                                            <TableCell align="right">{formatCurrency(data.total_gross)}</TableCell>
                                            <TableCell align="right">{formatCurrency(data.total_deductions)}</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 600 }}>
                                                {formatCurrency(data.total_net)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                )}

                {/* Allowances & Deductions Summary */}
                <Grid container spacing={3}>
                    {reportData.allowances_summary && (
                        <Grid item xs={12} md={6}>
                            <Typography variant="h6" sx={{ color: '#063455', fontWeight: 600, mb: 2 }}>
                                Allowances Summary
                            </Typography>
                            <TableContainer component={Paper}>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                                            <TableCell sx={{ fontWeight: 600 }}>Allowance Type</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 600 }}>Amount</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {Object.entries(reportData.allowances_summary).map(([allowance, amount]) => (
                                            <TableRow key={allowance}>
                                                <TableCell>{allowance}</TableCell>
                                                <TableCell align="right" sx={{ color: '#2e7d32', fontWeight: 600 }}>
                                                    {formatCurrency(amount)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Grid>
                    )}

                    {reportData.deductions_summary && (
                        <Grid item xs={12} md={6}>
                            <Typography variant="h6" sx={{ color: '#063455', fontWeight: 600, mb: 2 }}>
                                Deductions Summary
                            </Typography>
                            <TableContainer component={Paper}>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                                            <TableCell sx={{ fontWeight: 600 }}>Deduction Type</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 600 }}>Amount</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {Object.entries(reportData.deductions_summary).map(([deduction, amount]) => (
                                            <TableRow key={deduction}>
                                                <TableCell>{deduction}</TableCell>
                                                <TableCell align="right" sx={{ color: '#d32f2f', fontWeight: 600 }}>
                                                    {formatCurrency(amount)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Grid>
                    )}
                </Grid>
            </Box>
        );
    };

    const renderDetailedReport = () => {
        if (!reportData.payslips) return null;

        return (
            <Box>
                <Typography variant="h6" sx={{ color: '#063455', fontWeight: 600, mb: 3 }}>
                    Detailed Employee Report
                </Typography>
                <TableContainer component={Paper}>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                                <TableCell sx={{ fontWeight: 600 }}>Employee</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Department</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 600 }}>Basic Salary</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 600 }}>Allowances</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 600 }}>Deductions</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 600 }}>Gross Salary</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 600 }}>Net Salary</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {reportData.payslips.map((payslip) => (
                                <TableRow key={payslip.id}>
                                    <TableCell>
                                        <Box>
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                {payslip.employee?.name}
                                            </Typography>
                                            <Typography variant="caption" color="textSecondary">
                                                ID: {payslip.employee?.employee_id}
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell>{payslip.employee?.department?.name || 'N/A'}</TableCell>
                                    <TableCell align="right">{formatCurrency(payslip.basic_salary)}</TableCell>
                                    <TableCell align="right">{formatCurrency(payslip.total_allowances)}</TableCell>
                                    <TableCell align="right">{formatCurrency(payslip.total_deductions)}</TableCell>
                                    <TableCell align="right">{formatCurrency(payslip.gross_salary)}</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 600, color: '#2e7d32' }}>
                                        {formatCurrency(payslip.net_salary)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>
        );
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

    if (error || !reportData) {
        return (
            <AdminLayout>
                <Box sx={{ p: 3 }}>
                    <Alert severity="error">{error || 'Report data not found'}</Alert>
                </Box>
            </AdminLayout>
        );
    }

    return (
        <Box sx={{ 
            p: 3, 
            '@media print': {
                p: 2,
                '& .no-print': {
                    display: 'none !important'
                }
            }
        }}>
            {/* Print Controls - Hidden in print */}
            <Box className="no-print" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => router.visit(route('employees.payroll.reports'))}
                    sx={{ color: '#063455' }}
                >
                    Back to Reports
                </Button>
                <Button
                    startIcon={<PrintIcon />}
                    onClick={() => window.print()}
                    variant="contained"
                    sx={{ 
                        backgroundColor: '#063455',
                        '&:hover': { backgroundColor: '#052d45' }
                    }}
                >
                    Print Report
                </Button>
            </Box>

            {/* Report Content */}
            <Card sx={{ 
                maxWidth: '297mm',
                margin: '0 auto',
                '@media print': {
                    boxShadow: 'none',
                    border: 'none',
                    maxWidth: 'none',
                    margin: 0
                }
            }}>
                <CardContent sx={{ p: 4 }}>
                    {/* Header */}
                    <Box sx={{ textAlign: 'center', mb: 4 }}>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: '#063455', mb: 1 }}>
                            AFOHS CLUB
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 600, color: '#063455', mb: 1 }}>
                            {reportType === 'summary' ? 'PAYROLL SUMMARY REPORT' : 'DETAILED PAYROLL REPORT'}
                        </Typography>
                        {period && (
                            <Box>
                                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                                    {period.period_name}
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                    Period: {formatDate(period.start_date)} - {formatDate(period.end_date)}
                                </Typography>
                            </Box>
                        )}
                        <Typography variant="body2" color="textSecondary">
                            Generated on: {formatDate(new Date())}
                        </Typography>
                    </Box>

                    <Divider sx={{ mb: 4 }} />

                    {/* Report Content */}
                    {reportType === 'summary' ? renderSummaryReport() : renderDetailedReport()}

                    <Divider sx={{ my: 4 }} />

                    {/* Total Amount in Words */}
                    {reportData.total_net_salary && (
                        <Box sx={{ backgroundColor: '#f8f9fa', p: 3, borderRadius: 1, mb: 3 }}>
                            <Typography variant="h6" sx={{ fontWeight: 600, color: '#063455', mb: 1 }}>
                                Total Net Salary: {formatCurrency(reportData.total_net_salary)}
                            </Typography>
                            <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                                Amount in Words:
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 600, fontStyle: 'italic' }}>
                                {numberToWords(Math.floor(reportData.total_net_salary))} Rupees Only
                            </Typography>
                        </Box>
                    )}

                    {/* Footer */}
                    <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid #eee' }}>
                        <Grid container spacing={3}>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="body2" color="textSecondary">
                                    This is a computer-generated report and does not require a signature.
                                </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6} sx={{ textAlign: 'right' }}>
                                <Typography variant="body2" color="textSecondary">
                                    Generated by AFOHS Club Payroll System
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                    {formatDate(new Date())}
                                </Typography>
                            </Grid>
                        </Grid>
                    </Box>
                </CardContent>
            </Card>

            {/* Print Styles */}
            <style jsx global>{`
                @media print {
                    body {
                        margin: 0;
                        padding: 0;
                        font-size: 11px;
                    }
                    
                    .MuiCard-root {
                        box-shadow: none !important;
                        border: none !important;
                    }
                    
                    .MuiTableContainer-root {
                        box-shadow: none !important;
                    }
                    
                    .no-print {
                        display: none !important;
                    }
                    
                    @page {
                        margin: 1cm;
                        size: A4 landscape;
                    }
                    
                    table {
                        page-break-inside: auto;
                    }
                    
                    tr {
                        page-break-inside: avoid;
                        page-break-after: auto;
                    }
                }
            `}</style>
        </Box>
    );
};

export default PrintReports;
