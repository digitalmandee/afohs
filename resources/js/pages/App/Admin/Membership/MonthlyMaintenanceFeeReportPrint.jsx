import React, { useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Grid } from '@mui/material';
import { format } from 'date-fns';

export default function MonthlyMaintenanceFeeReportPrint({ transactions, statistics, filters, all_categories }) {
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
            <Head title="Monthly Maintenance Fee Report - Print" />

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
                        font-size: 9px;
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
                        font-size: 10px;
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
                    <div className="report-subtitle">Monthly Maintenance Fee Report</div>
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
                            <div className="summary-label">Total Transactions</div>
                        </div>
                        <div className="summary-item">
                            <div className="summary-value">{formatCurrency(statistics?.total_amount || 0)}</div>
                            <div className="summary-label">Total Amount Collected</div>
                        </div>
                        <div className="summary-item">
                            <div className="summary-value">{formatCurrency(statistics?.average_amount || 0)}</div>
                            <div className="summary-label">Average per Transaction</div>
                        </div>
                    </div>
                </div>

                {/* Detailed Transaction Table */}
                <table>
                    <thead>
                        <tr>
                            <th style={{ width: '8%' }}>Invoice #</th>
                            <th style={{ width: '10%' }}>City</th>
                            <th style={{ width: '15%' }}>Member Name</th>
                            <th style={{ width: '10%' }}>Membership #</th>
                            <th style={{ width: '10%' }}>Amount</th>
                            <th style={{ width: '10%' }}>Payment Method</th>
                            <th style={{ width: '12%' }}>Category</th>
                            <th style={{ width: '8%' }}>Dated</th>
                            <th style={{ width: '17%' }}>Duration</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions?.data && transactions.data.length > 0 ? (
                            transactions.data.map((transaction, index) => (
                                <tr key={transaction.id}>
                                    <td className="text-center font-bold">{transaction.invoice?.invoice_no}</td>
                                    <td className="text-center">{transaction.invoice?.member?.current_city || 'N/A'}</td>
                                    <td className="font-bold">{transaction.invoice?.member?.full_name}</td>
                                    <td className="text-center">{transaction.invoice?.member?.membership_no}</td>
                                    <td className="text-right font-bold">{formatCurrency(transaction.total)}</td>
                                    <td className="text-center">{transaction.invoice?.payment_method || 'N/A'}</td>
                                    <td>{transaction.invoice?.member?.member_category?.name || 'N/A'}</td>
                                    <td className="text-center">{formatDate(transaction.invoice?.issue_date || transaction.invoice?.created_at || transaction.created_at)}</td>
                                    <td className="text-center">{transaction.start_date && transaction.end_date ? `${formatDate(transaction.start_date)} - ${formatDate(transaction.end_date)}` : 'N/A'}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="9" className="text-center">
                                    No maintenance fee records found
                                </td>
                            </tr>
                        )}

                        {/* Total Row */}
                        {transactions?.data && transactions.data.length > 0 && (
                            <tr className="total-row">
                                <td colSpan="4" className="text-center font-bold">
                                    TOTAL ({statistics?.total_transactions || 0} Transactions)
                                </td>
                                <td className="text-right font-bold">{formatCurrency(statistics?.total_amount || 0)}</td>
                                <td colSpan="2" className="text-center font-bold">
                                    Avg: {formatCurrency(statistics?.average_amount || 0)}
                                </td>
                                <td colSpan="2" className="text-center font-bold">
                                    Monthly Maintenance Fee Collection Report
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
MonthlyMaintenanceFeeReportPrint.layout = (page) => page;
