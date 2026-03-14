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
    Grid,
} from '@mui/material';
import { format } from 'date-fns';

export default function SleepingMembersReportPrint({ categories, primary_members, statistics, filters, all_categories }) {
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

    const getFilterText = () => {
        let filterText = [];

        if (filters.member_search) {
            filterText.push(`Member: ${filters.member_search}`);
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
            <Head title="Sleeping Members Report - Print" />

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
                        grid-template-columns: repeat(5, 1fr);
                        gap: 10px;
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

                    .page-break {
                        page-break-after: always;
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
                    <div className="report-subtitle">Sleeping Members Report</div>
                    <div className="report-info">Generated on: {format(new Date(), 'MM/dd/yyyy HH:mm:ss')}</div>
                    <div className="report-info">Filters: {getFilterText()}</div>
                    {primary_members?.current_page && (
                        <div className="report-info">
                            Page {primary_members.current_page} of {primary_members.last_page}
                            (Showing {primary_members.from} to {primary_members.to} of {primary_members.total} records)
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
                            <div className="summary-value">{statistics?.total_members || 0}</div>
                            <div className="summary-label">Total Members</div>
                        </div>
                        <div className="summary-item">
                            <div className="summary-value">{statistics?.active || 0}</div>
                            <div className="summary-label">Active</div>
                        </div>
                        <div className="summary-item">
                            <div className="summary-value">{statistics?.suspended || 0}</div>
                            <div className="summary-label">Suspended</div>
                        </div>
                        <div className="summary-item">
                            <div className="summary-value">{statistics?.expired || 0}</div>
                            <div className="summary-label">Expired</div>
                        </div>
                        <div className="summary-item">
                            <div className="summary-value">{statistics?.in_suspension_process || 0}</div>
                            <div className="summary-label">In Process</div>
                        </div>
                    </div>
                </div>

                {/* Detailed Member Table */}
                <table>
                    <thead>
                        <tr>
                            <th style={{ width: '5%' }}>SR #</th>
                            <th style={{ width: '8%' }}>ID</th>
                            <th style={{ width: '12%' }}>Membership No</th>
                            <th style={{ width: '20%' }}>Member Name</th>
                            <th style={{ width: '15%' }}>Category</th>
                            <th style={{ width: '12%' }}>Membership Date</th>
                            <th style={{ width: '10%' }}>Member Type</th>
                            <th style={{ width: '10%' }}>Status</th>
                            <th style={{ width: '8%' }}>Last Activity Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {primary_members?.data && primary_members.data.length > 0 ? (
                            primary_members.data.map((member, index) => (
                                <tr key={member.id}>
                                    <td className="text-center">{(primary_members.from || 0) + index}</td>
                                    <td className="text-center font-bold">{member.id}</td>
                                    <td className="text-center">{member.membership_no}</td>
                                    <td className="font-bold">{member.full_name}</td>
                                    <td>{member.member_category?.name || 'N/A'}</td>
                                    <td className="text-center">{formatDate(member.membership_date_display || member.membership_date || member.created_at)}</td>
                                    <td className="text-center">Provisional</td>
                                    <td className="text-center font-bold">
                                        {member.status?.replace('_', ' ').toUpperCase()}
                                    </td>
                                    <td className="text-center">{formatDate(member.last_activity_date)}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="9" className="text-center">No sleeping members found</td>
                            </tr>
                        )}

                        {/* Total Row */}
                        {primary_members?.data && primary_members.data.length > 0 && (
                            <tr className="total-row">
                                <td colSpan="4" className="text-center font-bold">
                                    TOTAL ({statistics?.total_members || 0} Members)
                                </td>
                                <td className="text-center font-bold">
                                    Active: {statistics?.active || 0}
                                </td>
                                <td className="text-center font-bold">
                                    Suspended: {statistics?.suspended || 0}
                                </td>
                                <td className="text-center font-bold">
                                    Expired: {statistics?.expired || 0}
                                </td>
                                <td className="text-center font-bold">
                                    Others: {(statistics?.cancelled || 0) + (statistics?.absent || 0) + (statistics?.terminated || 0)}
                                </td>
                                <td className="text-center font-bold">
                                    In Process: {statistics?.in_suspension_process || 0}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {/* Category Breakdown Section */}
                {categories && categories.length > 0 && (
                    <>
                        <div style={{ marginTop: '30px', pageBreakBefore: 'auto' }}>
                            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', textAlign: 'center', borderBottom: '2px solid #000', pb: 1 }}>
                                Category-wise Breakdown
                            </Typography>
                        </div>

                        <table>
                            <thead>
                                <tr>
                                    <th style={{ width: '5%' }}>SR #</th>
                                    <th style={{ width: '20%' }}>Category</th>
                                    <th style={{ width: '10%' }}>Code</th>
                                    <th style={{ width: '10%' }}>Total</th>
                                    <th style={{ width: '10%' }}>Active</th>
                                    <th style={{ width: '10%' }}>Suspended</th>
                                    <th style={{ width: '10%' }}>Expired</th>
                                    <th style={{ width: '10%' }}>In Process</th>
                                    <th style={{ width: '15%' }}>Others</th>
                                </tr>
                            </thead>
                            <tbody>
                                {categories.map((category, index) => (
                                    <tr key={category.id}>
                                        <td className="text-center">{index + 1}</td>
                                        <td className="font-bold">{category.name}</td>
                                        <td className="text-center">{category.code}</td>
                                        <td className="text-center font-bold">{category.total_members}</td>
                                        <td className="text-center">{category.active}</td>
                                        <td className="text-center">{category.suspended}</td>
                                        <td className="text-center">{category.expired}</td>
                                        <td className="text-center">{category.in_suspension_process}</td>
                                        <td className="text-center">
                                            {category.cancelled + category.absent + category.terminated + category.not_assign}
                                        </td>
                                    </tr>
                                ))}

                                {/* Category Total Row */}
                                <tr className="total-row">
                                    <td colSpan="3" className="text-center font-bold">TOTAL</td>
                                    <td className="text-center font-bold">{statistics?.total_members || 0}</td>
                                    <td className="text-center font-bold">{statistics?.active || 0}</td>
                                    <td className="text-center font-bold">{statistics?.suspended || 0}</td>
                                    <td className="text-center font-bold">{statistics?.expired || 0}</td>
                                    <td className="text-center font-bold">{statistics?.in_suspension_process || 0}</td>
                                    <td className="text-center font-bold">
                                        {(statistics?.cancelled || 0) + (statistics?.absent || 0) + (statistics?.terminated || 0) + (statistics?.not_assign || 0)}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </>
                )}

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
                                {primary_members?.current_page
                                    ? `Page ${primary_members.current_page} of ${primary_members.last_page} | Records: ${primary_members.from}-${primary_members.to} of ${primary_members.total}`
                                    : `Total Records: ${primary_members?.data?.length || 0}`
                                }
                            </Typography>
                        </Grid>
                    </Grid>
                </Box>
            </Box>
        </>
    );
}
SleepingMembersReportPrint.layout = (page) => page;
