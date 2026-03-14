import { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { Box, Typography, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Divider, CircularProgress, Alert } from '@mui/material';

const PrintPayslip = ({ payslip }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Auto-print after 1 second delay
        const timer = setTimeout(() => {
            window.print();
        }, 1000);

        return () => clearTimeout(timer);
    }, []);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-PK', {
            style: 'currency',
            currency: 'PKR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        })
            .format(amount || 0)
            .replace('PKR', '');
    };

    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('en-PK', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
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

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">{error || 'Payslip not found'}</Alert>
            </Box>
        );
    }

    return (
        <>
            <Head title="Payslip Print" />

            <style jsx global>{`
                @media print {
                    body {
                        margin: 0;
                        padding: 30px;
                        font-family: Arial, sans-serif;
                    }
                    @page {
                        margin: 0.5in;
                        size: A4;
                    }
                    * {
                        -webkit-print-color-adjust: exact !important;
                        color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                }
            `}</style>

            <Box
                sx={{
                    p: 4,
                    backgroundColor: 'white',
                    minHeight: '100vh',
                    maxWidth: '210mm',
                    margin: '0 auto',
                    '@media print': {
                        p: 0,
                        maxWidth: 'none',
                    },
                }}
            >
                {/* Header */}
                <Box sx={{ textAlign: 'center', mb: 5 }}>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#000', mb: 0.5 }}>
                        Payslip
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#000', mb: 0.5 }}>
                        AFOHS CLUB
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#000' }}>
                        Falcon Complex, Gulberg III, Lahore
                    </Typography>
                </Box>

                {/* Employee Info */}
                <Grid container spacing={2} sx={{ mb: 4 }}>
                    <Grid item xs={6}>
                        <Grid container>
                            <Grid item xs={5}>
                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                    Date of Joining
                                </Typography>
                            </Grid>
                            <Grid item xs={7}>
                                <Typography variant="body2">: {formatDate(payslip.employee?.joining_date)}</Typography>
                            </Grid>
                            <Grid item xs={5}>
                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                    Pay Period
                                </Typography>
                            </Grid>
                            <Grid item xs={7}>
                                <Typography variant="body2">: {payslip.payroll_period?.period_name}</Typography>
                            </Grid>
                            <Grid item xs={5}>
                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                    Worked Days
                                </Typography>
                            </Grid>
                            <Grid item xs={7}>
                                <Typography variant="body2">: {payslip.total_working_days || 0}</Typography>
                            </Grid>
                        </Grid>
                    </Grid>
                    <Grid item xs={6}>
                        <Grid container>
                            <Grid item xs={5}>
                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                    Employee Name
                                </Typography>
                            </Grid>
                            <Grid item xs={7}>
                                <Typography variant="body2">: {payslip.employee?.name}</Typography>
                            </Grid>
                            <Grid item xs={5}>
                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                    Designation
                                </Typography>
                            </Grid>
                            <Grid item xs={7}>
                                <Typography variant="body2">: {payslip.employee?.designation}</Typography>
                            </Grid>
                            <Grid item xs={5}>
                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                    Department
                                </Typography>
                            </Grid>
                            <Grid item xs={7}>
                                <Typography variant="body2">: {payslip.employee?.department?.name}</Typography>
                            </Grid>
                        </Grid>
                    </Grid>
                </Grid>

                {/* Salary Details */}
                <Box sx={{ mb: 4 }}>
                    <Grid container spacing={4}>
                        {/* Earnings */}
                        <Grid item xs={6}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #000', mb: 1, pb: 0.5 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                    Earnings
                                </Typography>
                                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                    Amount
                                </Typography>
                            </Box>
                            <Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography variant="body2">Basic</Typography>
                                    <Typography variant="body2">{formatCurrency(payslip.basic_salary)}</Typography>
                                </Box>
                                {payslip.allowances &&
                                    payslip.allowances.map((allowance, index) => (
                                        <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                            <Typography variant="body2">{allowance.allowance_type?.name}</Typography>
                                            <Typography variant="body2">{formatCurrency(allowance.amount)}</Typography>
                                        </Box>
                                    ))}
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                                <Typography variant="body2" sx={{ fontWeight: 'bold', mr: 4 }}>
                                    Total Earnings
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                    {formatCurrency(payslip.gross_salary)}
                                </Typography>
                            </Box>
                        </Grid>

                        {/* Deductions */}
                        <Grid item xs={6}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #000', mb: 1, pb: 0.5 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                    Deductions
                                </Typography>
                                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                    Amount
                                </Typography>
                            </Box>
                            <Box>
                                {payslip.deductions &&
                                    payslip.deductions.map((deduction, index) => (
                                        <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                            <Typography variant="body2">{deduction.deduction_type?.name}</Typography>
                                            <Typography variant="body2">{formatCurrency(deduction.amount)}</Typography>
                                        </Box>
                                    ))}
                                {payslip.order_deductions &&
                                    payslip.order_deductions.map((o) => (
                                        <Box key={`order-${o.id}`} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                            <Typography variant="body2">CTS Order #{o.id}</Typography>
                                            <Typography variant="body2">{formatCurrency(o.amount)}</Typography>
                                        </Box>
                                    ))}
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                                <Typography variant="body2" sx={{ fontWeight: 'bold', mr: 4 }}>
                                    Total Deductions
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                    {formatCurrency(payslip.total_deductions)}
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 'bold', mr: 4 }}>
                                    Net Pay
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                    {formatCurrency(payslip.net_salary)}
                                </Typography>
                            </Box>
                        </Grid>
                    </Grid>
                </Box>

                {/* Net Pay in Words */}
                <Box sx={{ textAlign: 'center', mb: 8 }}>
                    <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                        {formatCurrency(payslip.net_salary).replace('Rs', '').trim()}
                    </Typography>
                    <Typography variant="body2">{numberToWords(Math.floor(payslip.net_salary))} Rupees Only</Typography>
                </Box>

                {/* Signatures */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 4, mb: 4 }}>
                    <Box sx={{ textAlign: 'center', width: '200px' }}>
                        <Typography variant="body2" sx={{ mb: 4 }}>
                            Employer Signature
                        </Typography>
                        <Divider sx={{ borderColor: '#000' }} />
                    </Box>
                    <Box sx={{ textAlign: 'center', width: '200px' }}>
                        <Typography variant="body2" sx={{ mb: 4 }}>
                            Employee Signature
                        </Typography>
                        <Divider sx={{ borderColor: '#000' }} />
                    </Box>
                </Box>

                {/* Footer */}
                <Box sx={{ textAlign: 'center', mt: 4 }}>
                    <Typography variant="caption" sx={{ color: '#666' }}>
                        This is system generated payslip
                    </Typography>
                </Box>
            </Box>
        </>
    );
};

PrintPayslip.layout = (page) => page;

export default PrintPayslip;
