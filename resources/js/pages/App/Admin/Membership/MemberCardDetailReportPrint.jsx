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

export default function MemberCardDetailReportPrint({ categories, statistics, filters, all_categories }) {
    useEffect(() => {
        // Auto-print when page loads
        const timer = setTimeout(() => {
            window.print();
        }, 1000);

        return () => clearTimeout(timer);
    }, []);

    const getFilterText = () => {
        let filterText = [];
        
        if (filters.card_status && filters.card_status.length > 0) {
            filterText.push(`Card Status: ${filters.card_status.join(', ')}`);
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

    // Ensure categories is always an array
    const safeCategories = Array.isArray(categories) ? categories : [];

    return (
        <>
            <Head title="Member Card Detail Report - Print" />
            
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
                    <div className="report-subtitle">Member Card Detail Report</div>
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
                            <div className="summary-value">{statistics?.total_cards_applied || 0}</div>
                            <div className="summary-label">Total Cards</div>
                        </div>
                        <div className="summary-item">
                            <div className="summary-value">{statistics?.issued_primary_members || 0}</div>
                            <div className="summary-label">Issued</div>
                        </div>
                        <div className="summary-item">
                            <div className="summary-value">{statistics?.printed_primary_members || 0}</div>
                            <div className="summary-label">Printed</div>
                        </div>
                        <div className="summary-item">
                            <div className="summary-value">{statistics?.re_printed_primary_members || 0}</div>
                            <div className="summary-label">Re-Printed</div>
                        </div>
                        <div className="summary-item">
                            <div className="summary-value">{statistics?.e_card_issued_primary_members || 0}</div>
                            <div className="summary-label">E-Card Issued</div>
                        </div>
                        <div className="summary-item">
                            <div className="summary-value">{statistics?.pending_cards || 0}</div>
                            <div className="summary-label">Pending</div>
                        </div>
                    </div>
                </div>

                {/* Detailed Category Table */}
                <table>
                    <thead>
                        <tr>
                            <th style={{ width: '20%' }}>Category</th>
                            <th style={{ width: '13%' }}>Total Cards</th>
                            <th style={{ width: '13%' }}>Issued</th>
                            <th style={{ width: '13%' }}>Printed</th>
                            <th style={{ width: '13%' }}>Re-Printed</th>
                            <th style={{ width: '14%' }}>E-Card Issued</th>
                            <th style={{ width: '14%' }}>Pending</th>
                        </tr>
                    </thead>
                    <tbody>
                        {safeCategories.length > 0 ? (
                            safeCategories.map((category, index) => (
                                <tr key={category.id}>
                                    <td className="font-bold">{category.name}</td>
                                    <td className="text-center">{category.total_cards_applied}</td>
                                    <td className="text-center">{category.issued_primary_members}</td>
                                    <td className="text-center">{category.printed_primary_members}</td>
                                    <td className="text-center">{category.re_printed_primary_members}</td>
                                    <td className="text-center">{category.e_card_issued_primary_members}</td>
                                    <td className="text-center">{category.pending_cards}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="7" className="text-center">No member card data found</td>
                            </tr>
                        )}
                        
                        {/* Total Row */}
                        {safeCategories.length > 0 && (
                            <tr className="total-row">
                                <td className="text-center font-bold">GRAND TOTAL</td>
                                <td className="text-center font-bold">{statistics?.total_cards_applied || 0}</td>
                                <td className="text-center font-bold">{statistics?.issued_primary_members || 0}</td>
                                <td className="text-center font-bold">{statistics?.printed_primary_members || 0}</td>
                                <td className="text-center font-bold">{statistics?.re_printed_primary_members || 0}</td>
                                <td className="text-center font-bold">{statistics?.e_card_issued_primary_members || 0}</td>
                                <td className="text-center font-bold">{statistics?.pending_cards || 0}</td>
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
                                Total Categories: {safeCategories.length}
                            </Typography>
                        </Grid>
                    </Grid>
                </Box>
            </Box>
        </>
    );
}
MemberCardDetailReportPrint.layout = (page) => page;