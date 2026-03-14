import React, { useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Grid } from '@mui/material';
import { format } from 'date-fns';

export default function SportsSubscriptionsReportPrint({ transactions, statistics, filters, all_categories }) {
    useEffect(() => {
        // Auto-print when page loads
        const timer = setTimeout(() => {
            window.print();
        }, 1000);

        return () => clearTimeout(timer);
    }, []);

    const formatDate = (dateString) => {
        try {
            return format(new Date(dateString), 'MM/dd/yyyy');
        } catch (error) {
            return dateString || '-';
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-PK', {
            style: 'currency',
            currency: 'PKR',
            minimumFractionDigits: 0,
        })
            .format(amount || 0)
            .replace('PKR', 'Rs');
    };

    const getPaymentMethodLabel = (method) => {
        const normalized = (method || '').toString().trim().toLowerCase();
        if (!normalized) return 'N/A';

        if (normalized === 'cash') return 'Cash';
        if (['credit_card', 'credit card', 'debit_card', 'debit card'].includes(normalized)) return 'Credit Card';
        if (['bank_online', 'online', 'bank transfer'].includes(normalized)) return 'Online';
        if (normalized === 'cheque') return 'Cheque';

        return method;
    };

    const getFilterText = () => {
        let filterText = [];

        if (filters.date_from && filters.date_to) {
            filterText.push(`Period: ${formatDate(filters.date_from)} to ${formatDate(filters.date_to)}`);
        } else if (filters.date_from) {
            filterText.push(`From: ${formatDate(filters.date_from)}`);
        } else if (filters.date_to) {
            filterText.push(`Until: ${formatDate(filters.date_to)}`);
        }

        if (filters.member_search) {
            filterText.push(`Member: ${filters.member_search}`);
        }

        if (filters.membership_no_search) {
            filterText.push(`Membership #: ${filters.membership_no_search}`);
        }

        if (filters.invoice_search) {
            filterText.push(`Invoice: ${filters.invoice_search}`);
        }

        if (filters.city) {
            filterText.push(`City: ${filters.city}`);
        }

        if (filters.payment_method) {
            filterText.push(`Payment: ${filters.payment_method}`);
        }

        if (filters.gender) {
            filterText.push(`Gender: ${filters.gender}`);
        }

        if (filters.family_member) {
            filterText.push(`Family Member: ${filters.family_member}`);
        }

        if (filters.categories && filters.categories.length > 0) {
            const categoryNames = filters.categories.map((catId) => {
                const category = all_categories?.find((cat) => cat.id == catId);
                return category ? category.name : catId;
            });
            filterText.push(`Categories: ${categoryNames.join(', ')}`);
        }

        return filterText.length > 0 ? filterText.join(' | ') : 'All Records';
    };

    return (
        <>
            <Head title="Sports Subscriptions Report - Print" />

            <style jsx global>{`
                @media print {
                    body {
                        margin: 0;
                        padding: 15px;
                        font-family: Arial, sans-serif;
                        font-size: 11px;
                        line-height: 1.2;
                    }
                    .no-print {
                        display: none !important;
                    }

                    .report-header {
                        text-align: center;
                        margin-bottom: 20px;
                        border-bottom: 2px solid #000;
                        padding-bottom: 10px;
                    }

                    .report-title {
                        font-size: 18px;
                        font-weight: bold;
                        margin: 5px 0;
                        color: #000;
                    }

                    .report-subtitle {
                        font-size: 14px;
                        font-weight: bold;
                        margin: 3px 0;
                        color: #333;
                    }

                    .report-info {
                        font-size: 10px;
                        margin: 2px 0;
                        color: #666;
                    }

                    .summary-section {
                        margin: 20px 0;
                        padding: 10px;
                        border: 1px solid #000;
                        background-color: #f9f9f9;
                    }

                    .summary-grid {
                        display: grid;
                        grid-template-columns: repeat(3, 1fr);
                        gap: 15px;
                        margin: 10px 0;
                    }

                    .summary-item {
                        text-align: center;
                        padding: 8px;
                        border: 1px solid #ccc;
                        background-color: #fff;
                    }

                    .summary-value {
                        font-size: 14px;
                        font-weight: bold;
                        margin-bottom: 3px;
                    }

                    .summary-label {
                        font-size: 9px;
                        color: #666;
                    }

                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin: 20px 0;
                    }

                    th,
                    td {
                        border: 1px solid #000;
                        padding: 6px 4px;
                        text-align: left;
                        font-size: 8px;
                    }

                    th {
                        background-color: #000;
                        color: #fff;
                        font-weight: bold;
                        text-align: center;
                    }

                    .total-row {
                        background-color: #000;
                        color: #fff;
                        font-weight: bold;
                    }

                    .total-row td {
                        font-size: 9px;
                    }

                    .text-center {
                        text-align: center;
                    }
                    .text-right {
                        text-align: right;
                    }
                    .font-bold {
                        font-weight: bold;
                    }
                }

                @media screen {
                    body {
                        background-color: #f5f5f5;
                        padding: 20px;
                    }
                }
            `}</style>

            <Box sx={{ maxWidth: '100%', mx: 'auto', bgcolor: 'white', p: 3 }}>
                {/* Header */}
                <div className="report-header">
                    <div className="report-title">AFOHS CLUB</div>
                    <div className="report-subtitle">Sports Subscriptions Report</div>
                    <div className="report-info">Generated on: {format(new Date(), 'MM/dd/yyyy HH:mm:ss')}</div>
                    <div className="report-info">Filters: {getFilterText()}</div>
                    {transactions?.current_page && (
                        <div className="report-info">
                            Page {transactions.current_page} of {transactions.last_page}
                            (Showing {transactions.from} to {transactions.to} of {transactions.total} records)
                        </div>
                    )}
                </div>

                {/* Summary Statistics */}
                <div className="summary-section">
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', textAlign: 'center' }}>
                        Summary Statistics
                    </Typography>
                    <div className="summary-grid">
                        <div className="summary-item">
                            <div className="summary-value">{statistics?.total_transactions || 0}</div>
                            <div className="summary-label">Total Subscriptions</div>
                        </div>
                        <div className="summary-item">
                            <div className="summary-value">{formatCurrency(statistics?.total_amount || 0)}</div>
                            <div className="summary-label">Total Amount Collected</div>
                        </div>
                        <div className="summary-item">
                            <div className="summary-value">{formatCurrency(statistics?.average_amount || 0)}</div>
                            <div className="summary-label">Average per Subscription</div>
                        </div>
                    </div>
                </div>

                {/* Detailed Transaction Table */}
                <table>
                    <thead>
                        <tr>
                            <th style={{ width: '8%' }}>Invoice #</th>
                            <th style={{ width: '12%' }}>Subscriber</th>
                            <th style={{ width: '12%' }}>Member</th>
                            <th style={{ width: '9%' }}>Member #</th>
                            <th style={{ width: '10%' }}>Type</th>
                            <th style={{ width: '10%' }}>Family</th>
                            <th style={{ width: '9%' }}>Start Date</th>
                            <th style={{ width: '9%' }}>End Date</th>
                            <th style={{ width: '9%' }}>Amount</th>
                            <th style={{ width: '12%' }}>Payment</th>
                            <th style={{ width: '10%' }}>Category</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions?.data && transactions.data.length > 0 ? (
                            transactions.data.map((transaction, index) => (
                                <tr key={transaction.id}>
                                    <td className="text-center font-bold">{transaction.invoice?.invoice_no}</td>
                                    <td className="font-bold">{transaction.invoice?.member?.full_name || transaction.invoice?.corporateMember?.full_name || transaction.invoice?.customer?.name || 'N/A'}</td>
                                    <td>{transaction.invoice?.member?.full_name || transaction.invoice?.corporateMember?.full_name || transaction.invoice?.customer?.name || 'N/A'}</td>
                                    <td className="text-center">{transaction.invoice?.member?.membership_no || transaction.invoice?.corporateMember?.membership_no || transaction.invoice?.customer?.customer_no || 'N/A'}</td>
                                    <td className="text-center">{transaction.subscription_category?.name || transaction.data?.subscription_category_name || transaction.data?.subscription_type_name || 'N/A'}</td>
                                    <td className="text-center">{transaction.family_member?.relation || 'SELF'}</td>
                                    <td className="text-center">{formatDate(transaction.start_date || transaction.valid_from)}</td>
                                    <td className="text-center">{formatDate(transaction.end_date || transaction.valid_to)}</td>
                                    <td className="text-right font-bold">{formatCurrency(transaction.total)}</td>
                                    <td className="text-center">{getPaymentMethodLabel(transaction.invoice?.payment_method)}</td>
                                    <td className="text-center">{transaction.invoice?.member?.member_category?.name || transaction.invoice?.member?.memberCategory?.name || transaction.invoice?.corporateMember?.member_category?.name || transaction.invoice?.corporateMember?.memberCategory?.name || ''}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="11" className="text-center">
                                    No sports subscription records found
                                </td>
                            </tr>
                        )}

                        {/* Total Row */}
                        {transactions?.data && transactions.data.length > 0 && (
                            <tr className="total-row">
                                <td colSpan="8" className="text-center font-bold">
                                    TOTAL ({statistics?.total_transactions || 0} Subscriptions)
                                </td>
                                <td className="text-right font-bold">{formatCurrency(statistics?.total_amount || 0)}</td>
                                <td colSpan="2" className="text-center font-bold">
                                    Sports Subscriptions Collection
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {/* Footer */}
                <Box sx={{ mt: 4, pt: 2, borderTop: '1px solid #ccc', fontSize: '10px', color: '#666' }}>
                    <Grid container spacing={2}>
                        <Grid item xs={6}>
                            <Typography variant="caption">Report Generated By: AFOHS Club Management System</Typography>
                        </Grid>
                        <Grid item xs={6} sx={{ textAlign: 'right' }}>
                            <Typography variant="caption">{transactions?.current_page ? `Page ${transactions.current_page} of ${transactions.last_page} | Records: ${transactions.from}-${transactions.to} of ${transactions.total}` : `Total Records: ${transactions?.data?.length || 0}`}</Typography>
                        </Grid>
                    </Grid>
                </Box>
            </Box>
        </>
    );
}
SportsSubscriptionsReportPrint.layout = (page) => page;
