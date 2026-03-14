import React, { useEffect } from 'react';
import { Head } from '@inertiajs/react';
import {
    Box,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Grid,
    Divider
} from '@mui/material';
import { format } from 'date-fns';
import { toWords } from 'number-to-words';

export default function MaintenanceFeeRevenuePrint({ categories, statistics, filters, all_categories }) {
    useEffect(() => {
        // Auto-print when page loads
        const timer = setTimeout(() => {
            window.print();
        }, 1000);

        return () => clearTimeout(timer);
    }, []);

    const formatDate = (dateString) => {
        try {
            if (!dateString) return '-';

            if (/^\d{2}-\d{2}-\d{4}$/.test(dateString)) {
                const [a, b, year] = dateString.split('-').map(Number);
                const mm = a;
                const dd = b;
                return format(new Date(year, mm - 1, dd), 'MM-dd-yyyy');
            }

            return format(new Date(dateString), 'MM-dd-yyyy');
        } catch (error) {
            return dateString;
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-PK', {
            style: 'currency',
            currency: 'PKR',
            minimumFractionDigits: 0,
        }).format(amount || 0).replace('PKR', 'Rs');
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

        if (filters.status && filters.status.length > 0) {
            const statusLabels = filters.status.map(status =>
                status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
            );
            filterText.push(`Status: ${statusLabels.join(', ')}`);
        }

        if (filters.categories && filters.categories.length > 0) {
            const categoryNames = filters.categories.map(catId => {
                const category = all_categories?.find(cat => cat.id == catId);
                return category ? category.name : catId;
            });
            filterText.push(`Categories: ${categoryNames.join(', ')}`);
        }

        return filterText.length > 0 ? filterText.join(' | ') : 'All Records';
    };

    return (
        <>
            <Head title="Maintenance Fee Revenue Report - Print" />

            <style jsx global>{`
                @media print {
                    body {
                        margin: 0;
                        padding: 15px;
                        font-family: Arial, sans-serif;
                        font-size: 11px;
                        line-height: 1.2;
                    }
                    .no-print { display: none !important; }

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
                        grid-template-columns: repeat(4, 1fr);
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

                    th, td {
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

                    .text-center { text-align: center; }
                    .text-right { text-align: right; }
                    .font-bold { font-weight: bold; }
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
                    <div className="report-subtitle">Maintenance Fee Revenue Report</div>
                    <div className="report-info">Generated on: {format(new Date(), 'MM/dd/yyyy HH:mm:ss')}</div>
                    <div className="report-info">Filters: {getFilterText()}</div>
                </div>

                {/* Summary Statistics */}
                <div className="summary-section">
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', textAlign: 'center' }}>
                        Summary Statistics
                    </Typography>
                    <div className="summary-grid">
                        <div className="summary-item">
                            <div className="summary-value">{statistics?.total_members || 0}</div>
                            <div className="summary-label">Total Members</div>
                        </div>
                        <div className="summary-item">
                            <div className="summary-value">{statistics?.total_members_with_maintenance || 0}</div>
                            <div className="summary-label">Paying Members</div>
                        </div>
                        <div className="summary-item">
                            <div className="summary-value">
                                {statistics?.total_members > 0
                                    ? `${((statistics.total_members_with_maintenance / statistics.total_members) * 100).toFixed(1)}%`
                                    : '0%'
                                }
                            </div>
                            <div className="summary-label">Payment Rate</div>
                        </div>
                        <div className="summary-item">
                            <div className="summary-value">{formatCurrency(statistics?.total_maintenance_revenue || 0)}</div>
                            <div className="summary-label">Total Revenue</div>
                        </div>
                    </div>
                </div>

                {/* Detailed Table */}
                <table>
                    <thead>
                        <tr>
                            <th style={{ width: '5%' }}>SR #</th>
                            <th style={{ width: '20%' }}>Category</th>
                            <th style={{ width: '10%' }}>Code</th>
                            <th style={{ width: '10%' }}>Total Members</th>
                            <th style={{ width: '10%' }}>Paying Members</th>
                            <th style={{ width: '10%' }}>Payment Rate</th>
                            <th style={{ width: '15%' }}>Total Revenue</th>
                            <th style={{ width: '10%' }}>Amount In Words</th>
                        </tr>
                    </thead>
                    <tbody>
                        {categories.map((categoryFee, index) => {
                            const paymentRate = categoryFee.total_members > 0
                                ? ((categoryFee.members_with_maintenance / categoryFee.total_members) * 100).toFixed(1)
                                : 0;

                            return (
                                <tr key={categoryFee.id}>
                                    <td className="text-center">{index + 1}</td>
                                    <td className="font-bold">{categoryFee.name}</td>
                                    <td className="text-center">{categoryFee.code}</td>
                                    <td className="text-center">{categoryFee.total_members}</td>
                                    <td className="text-center">{categoryFee.members_with_maintenance}</td>
                                    <td className="text-center">{paymentRate}%</td>
                                    <td className="text-right font-bold">{formatCurrency(categoryFee.total_maintenance_fee)}</td>
                                    <td style={{ fontSize: '8px', fontStyle: 'italic' }}>
                                        {categoryFee.total_maintenance_fee > 0 ? toWords(categoryFee.total_maintenance_fee) : 'Zero'}
                                    </td>
                                </tr>
                            );
                        })}

                        {/* Total Row */}
                        <tr className="total-row">
                            <td colSpan="3" className="text-center font-bold">TOTAL</td>
                            <td className="text-center font-bold">{statistics?.total_members || 0}</td>
                            <td className="text-center font-bold">{statistics?.total_members_with_maintenance || 0}</td>
                            <td className="text-center font-bold">
                                {statistics?.total_members > 0
                                    ? `${((statistics.total_members_with_maintenance / statistics.total_members) * 100).toFixed(1)}%`
                                    : '0%'
                                }
                            </td>
                            <td className="text-right font-bold">{formatCurrency(statistics?.total_maintenance_revenue || 0)}</td>
                            <td style={{ fontSize: '8px', fontStyle: 'italic' }}>
                                {statistics?.total_maintenance_revenue > 0 ? toWords(statistics.total_maintenance_revenue) : 'Zero'}
                            </td>
                        </tr>
                    </tbody>
                </table>

                {/* Footer */}
                <Box sx={{ mt: 4, pt: 2, borderTop: '1px solid #ccc', fontSize: '10px', color: '#666' }}>
                    <Grid container spacing={2}>
                        <Grid item xs={6}>
                            <Typography variant="caption">
                                Report Generated By: AFOHS Club Management System
                            </Typography>
                        </Grid>
                        <Grid item xs={6} sx={{ textAlign: 'right' }}>
                            <Typography variant="caption">
                                Page 1 of 1
                            </Typography>
                        </Grid>
                    </Grid>
                </Box>
            </Box>
        </>
    );
}
MaintenanceFeeRevenuePrint.layout = (page) => page;
