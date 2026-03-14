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

export default function PendingMaintenanceReportPrint({ members, statistics, filters, all_categories }) {
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
                const [day, month, year] = dateString.split('-').map(Number);
                return format(new Date(year, month - 1, day), 'dd-MM-yyyy');
            }

            return format(new Date(dateString), 'dd-MM-yyyy');
        } catch (error) {
            return dateString || '-';
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 }).format(amount || 0);
    };

    const getFilterText = () => {
        let filterText = [];

        if (filters.date) {
            filterText.push(`As-of: ${formatDate(filters.date)}`);
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

        if (filters.member_search) {
            filterText.push(`Member: ${filters.member_search}`);
        }

        if (filters.cnic_search) {
            filterText.push(`CNIC: ${filters.cnic_search}`);
        }

        if (filters.contact_search) {
            filterText.push(`Contact: ${filters.contact_search}`);
        }

        if (filters.quarters_pending) {
            const q = filters.quarters_pending === '6+' ? '6+' : `${filters.quarters_pending}`;
            filterText.push(`Quarters Pending: ${q}`);
        }

        return filterText.length > 0 ? filterText.join(' | ') : 'All Records';
    };

    return (
        <>
            <Head title="Pending Maintenance Report - Print" />

            <style jsx global>{`
                @media print {
                    body {
                        margin: 0;
                        padding: 15px;
                        font-family: Arial, sans-serif;
                        font-size: 10px;
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
                        font-size: 9px;
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
                        font-size: 12px;
                        font-weight: bold;
                        margin-bottom: 3px;
                    }

                    .summary-label {
                        font-size: 8px;
                        color: #666;
                    }

                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin: 20px 0;
                        font-size: 8px;
                    }

                    th, td {
                        border: 1px solid #000;
                        padding: 4px 2px;
                        text-align: left;
                        vertical-align: top;
                    }

                    th {
                        background-color: #000;
                        color: #fff;
                        font-weight: bold;
                        text-align: center;
                        font-size: 8px;
                    }

                    .total-row {
                        background-color: #000;
                        color: #fff;
                        font-weight: bold;
                    }

                    .total-row td {
                        font-size: 9px;
                    }

                    .text-center { text-align: center; }
                    .text-right { text-align: right; }
                    .font-bold { font-weight: bold; }

                    .member-row:nth-child(even) {
                        background-color: #f9f9f9;
                    }

                    .status-active { color: #059669; font-weight: bold; }
                    .status-inactive { color: #dc2626; font-weight: bold; }
                    .status-suspended { color: #f59e0b; font-weight: bold; }
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
                    <div className="report-subtitle">Pending Maintenance Report</div>
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
                            <div className="summary-label">Members with Pending</div>
                        </div>
                        <div className="summary-item">
                            <div className="summary-value">{formatCurrency(statistics?.total_debit || 0)}</div>
                            <div className="summary-label">Total Debit</div>
                        </div>
                        <div className="summary-item">
                            <div className="summary-value">{formatCurrency(statistics?.total_pending_amount || 0)}</div>
                            <div className="summary-label">Total Pending Amount</div>
                        </div>
                        <div className="summary-item">
                            <div className="summary-value">{formatCurrency(statistics?.total_balance || 0)}</div>
                            <div className="summary-label">Total Balance</div>
                        </div>
                    </div>
                </div>

                {/* Detailed Table */}
                <table>
                    <thead>
                        <tr>
                            <th style={{ width: '3%' }}>SR #</th>
                            <th style={{ width: '5%' }}>ID</th>
                            <th style={{ width: '7%' }}>Membership Date</th>
                            <th style={{ width: '8%' }}>Member #</th>
                            <th style={{ width: '12%' }}>Name</th>
                            <th style={{ width: '8%' }}>Contact</th>
                            <th style={{ width: '12%' }}>Address</th>
                            <th style={{ width: '8%' }}>Maintenance Per Quarter</th>
                            <th style={{ width: '7%' }}>Discount</th>
                            <th style={{ width: '7%' }}>Debit</th>
                            <th style={{ width: '7%' }}>Credit</th>
                            <th style={{ width: '8%' }}>Balance</th>
                            <th style={{ width: '8%' }}>Pending</th>
                            <th style={{ width: '7%' }}>Invoice #</th>
                            <th style={{ width: '6%' }}>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {members.map((member, index) => (
                            <tr key={member.id} className="member-row">
                                <td className="text-center">{index + 1}</td>
                                <td className="font-bold">{member.id}</td>
                                <td className="text-center">{formatDate(member.membership_date)}</td>
                                <td className="font-bold">{member.membership_no}</td>
                                <td className="font-bold">{member.full_name}</td>
                                <td>{member.contact || '-'}</td>
                                <td>{member.address || 'N/A'}</td>
                                <td className="text-right" style={{ color: '#059669', fontWeight: 'bold' }}>
                                    {formatCurrency(member.quarterly_fee)}
                                </td>
                                <td className="text-right" style={{ color: '#374151', fontWeight: 'bold' }}>
                                    {formatCurrency(member.discount || 0)}
                                </td>
                                <td className="text-right" style={{ color: '#dc2626', fontWeight: 'bold' }}>
                                    {formatCurrency(member.debit || 0)}
                                </td>
                                <td className="text-right" style={{ color: '#059669', fontWeight: 'bold' }}>
                                    {formatCurrency(member.credit || 0)}
                                </td>
                                <td className="text-right font-bold" style={{ color: '#111827' }}>
                                    {formatCurrency(member.balance || 0)}
                                </td>
                                <td className="text-right font-bold" style={{ color: '#111827' }}>
                                    {formatCurrency(member.total_pending_amount || 0)}
                                </td>
                                <td className="text-center font-bold">{member.invoice_no || '-'}</td>
                                <td className={`text-center status-${member.status}`}>
                                    {member.status?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </td>
                            </tr>
                        ))}

                        {/* Total Row */}
                        <tr className="total-row">
                            <td colSpan="8" className="text-center font-bold">TOTAL ({statistics?.total_members || 0} Members)</td>
                            <td className="text-right font-bold">{formatCurrency(statistics?.total_discount || 0)}</td>
                            <td className="text-right font-bold">{formatCurrency(statistics?.total_debit || 0)}</td>
                            <td className="text-right font-bold">{formatCurrency(statistics?.total_credit || 0)}</td>
                            <td className="text-right font-bold">{formatCurrency(statistics?.total_balance || 0)}</td>
                            <td className="text-right font-bold">{formatCurrency(statistics?.total_pending_amount || 0)}</td>
                            <td className="text-center font-bold">-</td>
                            <td className="text-center font-bold">-</td>
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
                                Total Records: {members.length} | Page 1 of 1
                            </Typography>
                        </Grid>
                    </Grid>
                </Box>
            </Box>
        </>
    );
}
PendingMaintenanceReportPrint.layout = (page) => page;
