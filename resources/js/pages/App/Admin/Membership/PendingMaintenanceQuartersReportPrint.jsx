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

export default function PendingMaintenanceQuartersReportPrint({ summary, grand_totals, filters, all_categories }) {
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
        
        if (filters.category) {
            const category = all_categories?.find(cat => cat.id == filters.category);
            filterText.push(`Category: ${category ? category.name : filters.category}`);
        }
        
        return filterText.length > 0 ? filterText.join(' | ') : 'All Records';
    };

    return (
        <>
            <Head title="Pending Maintenance Quarters Report - Print" />
            
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
                        grid-template-columns: repeat(6, 1fr);
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
                        font-size: 8px;
                        color: #666;
                    }
                    
                    .total-amount {
                        text-align: center;
                        padding: 15px;
                        border: 2px solid #000;
                        background-color: #f3f4f6;
                        margin-top: 10px;
                    }
                    
                    .total-amount-value {
                        font-size: 20px;
                        font-weight: bold;
                        color: #dc2626;
                        margin-bottom: 5px;
                    }
                    
                    .total-amount-label {
                        font-size: 12px;
                        font-weight: bold;
                        color: #374151;
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
                    <div className="report-subtitle">Pending Maintenance Report (Category-wise)</div>
                    <div className="report-info">Generated on: {format(new Date(), 'MM/dd/yyyy HH:mm:ss')}</div>
                    <div className="report-info">Filters: {getFilterText()}</div>
                </div>

                {/* Summary Statistics */}
                <div className="summary-section">
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', textAlign: 'center' }}>
                        Pending Quarters Summary
                    </Typography>
                    <div className="summary-grid">
                        <div className="summary-item">
                            <div className="summary-value">{grand_totals?.['1_quarter_pending']?.count || 0}</div>
                            <div className="summary-label">1 Quarter Pending</div>
                        </div>
                        <div className="summary-item">
                            <div className="summary-value">{grand_totals?.['2_quarters_pending']?.count || 0}</div>
                            <div className="summary-label">2 Quarters Pending</div>
                        </div>
                        <div className="summary-item">
                            <div className="summary-value">{grand_totals?.['3_quarters_pending']?.count || 0}</div>
                            <div className="summary-label">3 Quarters Pending</div>
                        </div>
                        <div className="summary-item">
                            <div className="summary-value">{grand_totals?.['4_quarters_pending']?.count || 0}</div>
                            <div className="summary-label">4 Quarters Pending</div>
                        </div>
                        <div className="summary-item">
                            <div className="summary-value">{grand_totals?.['5_quarters_pending']?.count || 0}</div>
                            <div className="summary-label">5 Quarters Pending</div>
                        </div>
                        <div className="summary-item">
                            <div className="summary-value">{grand_totals?.['6_quarters_pending']?.count || 0}</div>
                            <div className="summary-label">6 Quarters Pending</div>
                        </div>
                        <div className="summary-item">
                            <div className="summary-value">{grand_totals?.['more_than_6_quarters_pending']?.count || 0}</div>
                            <div className="summary-label">6+ Quarters Pending</div>
                        </div>
                    </div>
                    <div className="total-amount">
                        <div className="total-amount-value">{formatCurrency(grand_totals?.total_values || 0)}</div>
                        <div className="total-amount-label">Total Pending Amount</div>
                    </div>
                </div>

                {/* Detailed Summary Table */}
                <table>
                    <thead>
                        <tr>
                            <th style={{ width: '5%' }}>SR #</th>
                            <th style={{ width: '15%' }}>CATEGORY</th>
                            <th style={{ width: '10%' }}>1 QTR</th>
                            <th style={{ width: '10%' }}>2 QTRS</th>
                            <th style={{ width: '10%' }}>3 QTRS</th>
                            <th style={{ width: '10%' }}>4 QTRS</th>
                            <th style={{ width: '10%' }}>5 QTRS</th>
                            <th style={{ width: '10%' }}>6 QTRS</th>
                            <th style={{ width: '10%' }}>6+ QTRS</th>
                            <th style={{ width: '10%' }}>FEE (QTR)</th>
                            <th style={{ width: '10%' }}>TOTAL</th>
                        </tr>
                    </thead>
                    <tbody>
                        {summary && Object.keys(summary).length > 0 ? (
                            Object.entries(summary).map(([categoryName, data], index) => (
                                <tr key={categoryName}>
                                    <td className="text-center font-bold">{index + 1}</td>
                                    <td className="font-bold">{categoryName}</td>
                                    <td className="text-center">{data['1_quarter_pending']?.count || 0}</td>
                                    <td className="text-center">{data['2_quarters_pending']?.count || 0}</td>
                                    <td className="text-center">{data['3_quarters_pending']?.count || 0}</td>
                                    <td className="text-center">{data['4_quarters_pending']?.count || 0}</td>
                                    <td className="text-center">{data['5_quarters_pending']?.count || 0}</td>
                                    <td className="text-center">{data['6_quarters_pending']?.count || 0}</td>
                                    <td className="text-center">{data['more_than_6_quarters_pending']?.count || 0}</td>
                                    <td className="text-center">{formatCurrency(data['maintenance_fee_quarterly'] || 0)}</td>
                                    <td className="text-center font-bold">{formatCurrency(data['total_values'] || 0)}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="11" className="text-center">No pending maintenance records found</td>
                            </tr>
                        )}
                        
                        {/* Grand Total Row */}
                        {summary && Object.keys(summary).length > 0 && (
                            <tr className="total-row">
                                <td className="text-center"></td>
                                <td className="font-bold">GRAND TOTAL</td>
                                <td className="text-center font-bold">{grand_totals?.['1_quarter_pending']?.count || 0}</td>
                                <td className="text-center font-bold">{grand_totals?.['2_quarters_pending']?.count || 0}</td>
                                <td className="text-center font-bold">{grand_totals?.['3_quarters_pending']?.count || 0}</td>
                                <td className="text-center font-bold">{grand_totals?.['4_quarters_pending']?.count || 0}</td>
                                <td className="text-center font-bold">{grand_totals?.['5_quarters_pending']?.count || 0}</td>
                                <td className="text-center font-bold">{grand_totals?.['6_quarters_pending']?.count || 0}</td>
                                <td className="text-center font-bold">{grand_totals?.['more_than_6_quarters_pending']?.count || 0}</td>
                                <td className="text-center font-bold">{formatCurrency(grand_totals?.maintenance_fee_quarterly || 0)}</td>
                                <td className="text-center font-bold">{formatCurrency(grand_totals?.total_values || 0)}</td>
                            </tr>
                        )}
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
                                Total Categories: {summary ? Object.keys(summary).length : 0}
                            </Typography>
                        </Grid>
                    </Grid>
                </Box>
            </Box>
        </>
    );
}
PendingMaintenanceQuartersReportPrint.layout = (page) => page;
