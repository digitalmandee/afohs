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

export default function SubscriptionsMaintenanceSummaryPrint({ summary, grand_totals, filters, all_categories }) {
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
            <Head title="MEMBER REVENUE BY PAYMENT METHOD REPORT - Print" />
            
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
                        font-size: 10px;
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
                        font-size: 11px;
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
                    <div className="report-subtitle">MEMBER REVENUE BY PAYMENT METHOD REPORT</div>
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
                            <div className="summary-value">{formatCurrency(grand_totals?.cash || 0)}</div>
                            <div className="summary-label">Total Cash Revenue</div>
                        </div>
                        <div className="summary-item">
                            <div className="summary-value">{formatCurrency(grand_totals?.credit_card || 0)}</div>
                            <div className="summary-label">Total Credit Card Revenue</div>
                        </div>
                        <div className="summary-item">
                            <div className="summary-value">{formatCurrency(grand_totals?.bank_online || 0)}</div>
                            <div className="summary-label">Total Bank/Online Revenue</div>
                        </div>
                        <div className="summary-item">
                            <div className="summary-value">{formatCurrency(grand_totals?.total || 0)}</div>
                            <div className="summary-label">Grand Total Revenue</div>
                        </div>
                    </div>
                </div>

                {/* Detailed Summary Table */}
                <table>
                    <thead>
                        <tr>
                            <th style={{ width: '10%' }}>SR #</th>
                            <th style={{ width: '30%' }}>CATEGORY</th>
                            <th style={{ width: '15%' }}>CASH</th>
                            <th style={{ width: '15%' }}>CREDIT CARD</th>
                            <th style={{ width: '15%' }}>BANK / ONLINE</th>
                            <th style={{ width: '15%' }}>TOTAL REVENUE</th>
                        </tr>
                    </thead>
                    <tbody>
                        {summary && Object.keys(summary).length > 0 ? (
                            Object.entries(summary).map(([categoryName, amounts], index) => (
                                <tr key={categoryName}>
                                    <td className="text-center font-bold">{index + 1}</td>
                                    <td className="font-bold">{categoryName}</td>
                                    <td className="text-center">{amounts.cash > 0 ? formatCurrency(amounts.cash) : '0'}</td>
                                    <td className="text-center">{amounts.credit_card > 0 ? formatCurrency(amounts.credit_card) : '0'}</td>
                                    <td className="text-center">{amounts.bank_online > 0 ? formatCurrency(amounts.bank_online) : '0'}</td>
                                    <td className="text-center font-bold">{formatCurrency(amounts.total)}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" className="text-center">No subscription or maintenance fee records found</td>
                            </tr>
                        )}
                        
                        {/* Grand Total Row */}
                        {summary && Object.keys(summary).length > 0 && (
                            <tr className="total-row">
                                <td className="text-center"></td>
                                <td className="font-bold">GRAND TOTAL</td>
                                <td className="text-center font-bold">
                                    {grand_totals?.cash > 0 ? formatCurrency(grand_totals.cash) : '0'}
                                </td>
                                <td className="text-center font-bold">
                                    {grand_totals?.credit_card > 0 ? formatCurrency(grand_totals.credit_card) : '0'}
                                </td>
                                <td className="text-center font-bold">
                                    {grand_totals?.bank_online > 0 ? formatCurrency(grand_totals.bank_online) : '0'}
                                </td>
                                <td className="text-center font-bold">
                                    {formatCurrency(grand_totals?.total || 0)}
                                </td>
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
SubscriptionsMaintenanceSummaryPrint.layout = (page) => page;
