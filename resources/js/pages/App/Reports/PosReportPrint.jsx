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

export default function PosReportPrint({ reportData, restaurantName, startDate, endDate }) {
    useEffect(() => {
        // Auto-print when page loads
        const timer = setTimeout(() => {
            window.print();
        }, 1000);

        return () => clearTimeout(timer);
    }, []);

    const formatDate = (dateString) => {
        try {
            return format(new Date(dateString), 'dd/MM/yyyy');
        } catch (error) {
            return dateString;
        }
    };

    return (
        <>
            <Head title="POS Report - Print" />
            
            <style jsx global>{`
                @media print {
                    body { 
                        margin: 0; 
                        padding: 20px;
                        font-family: Arial, sans-serif;
                        font-size: 12px;
                    }
                    .no-print { display: none !important; }
                    .print-page-break { page-break-before: always; }
                    table { 
                        border-collapse: collapse; 
                        width: 100%;
                        margin-bottom: 20px;
                    }
                    th, td { 
                        border: 1px solid #000; 
                        padding: 8px; 
                        text-align: left;
                    }
                    th { 
                        background-color: #f0f0f0; 
                        font-weight: bold;
                    }
                    .category-header {
                        background-color: #e0e0e0;
                        font-weight: bold;
                        text-align: center;
                        text-transform: uppercase;
                        padding: 10px;
                        border: 2px solid #000;
                        margin: 20px 0 10px 0;
                    }
                    .total-row {
                        background-color: #f5f5f5;
                        font-weight: bold;
                    }
                    .grand-total {
                        background-color: #d0d0d0;
                        font-weight: bold;
                        text-align: center;
                        padding: 15px;
                        border: 3px solid #000;
                        margin-top: 30px;
                        font-size: 16px;
                    }
                }
                @media screen {
                    body {
                        background-color: white;
                        padding: 20px;
                    }
                }
            `}</style>

            <Box sx={{ maxWidth: '210mm', margin: '0 auto', bgcolor: 'white', p: 3 }}>
                {/* Header */}
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                        {restaurantName.toUpperCase()}
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
                        POS REPORT - DISH BREAKDOWN SUMMARY (SOLD QUANTITY)
                    </Typography>
                    <Typography variant="h6" sx={{ mb: 1 }}>
                        Report Date: {formatDate(startDate)} {startDate !== endDate ? `to ${formatDate(endDate)}` : ''}
                    </Typography>
                    <Typography variant="body1">
                        Generated on: {format(new Date(), 'dd/MM/yyyy HH:mm')}
                    </Typography>
                </Box>

                <Divider sx={{ mb: 3, borderColor: '#000', borderWidth: 2 }} />

                {/* Summary Stats */}
                <Box sx={{ mb: 4, textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        Total Items Sold: {reportData.total_quantity} | Categories: {reportData.categories?.length || 0}
                    </Typography>
                </Box>

                {/* Report Content */}
                {reportData.categories && reportData.categories.length > 0 ? (
                    <Grid container spacing={2}>
                        {reportData.categories.map((category, categoryIndex) => (
                            <Grid item xs={12} md={6} key={categoryIndex}>
                                {/* Category Header */}
                                <Box className="category-header">
                                    <Typography variant="h6" sx={{ fontWeight: 'bold', m: 0 }}>
                                        {category.category_name}
                                    </Typography>
                                </Box>

                                {/* Items Table */}
                                <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #000' }}>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell sx={{ 
                                                    fontWeight: 'bold', 
                                                    border: '1px solid #000',
                                                    bgcolor: '#f0f0f0'
                                                }}>
                                                    ITEM NAME
                                                </TableCell>
                                                <TableCell 
                                                    align="center" 
                                                    sx={{ 
                                                        fontWeight: 'bold',
                                                        border: '1px solid #000',
                                                        bgcolor: '#f0f0f0',
                                                        width: '80px'
                                                    }}
                                                >
                                                    QTY SOLD
                                                </TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {category.items.map((item, itemIndex) => (
                                                <TableRow key={itemIndex}>
                                                    <TableCell sx={{ border: '1px solid #000' }}>
                                                        {item.name}
                                                    </TableCell>
                                                    <TableCell 
                                                        align="center" 
                                                        sx={{ 
                                                            border: '1px solid #000',
                                                            fontWeight: 'bold'
                                                        }}
                                                    >
                                                        {item.quantity}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {/* Category Total */}
                                            <TableRow className="total-row">
                                                <TableCell sx={{ 
                                                    fontWeight: 'bold', 
                                                    border: '1px solid #000',
                                                    bgcolor: '#f5f5f5'
                                                }}>
                                                    CATEGORY TOTAL:
                                                </TableCell>
                                                <TableCell 
                                                    align="center" 
                                                    sx={{ 
                                                        fontWeight: 'bold',
                                                        border: '1px solid #000',
                                                        bgcolor: '#f5f5f5'
                                                    }}
                                                >
                                                    {category.total_quantity}
                                                </TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Grid>
                        ))}
                    </Grid>
                ) : (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="h6">
                            No data available for the selected date range
                        </Typography>
                    </Box>
                )}

                {/* Grand Total */}
                {reportData.categories && reportData.categories.length > 0 && (
                    <Box className="grand-total">
                        <Typography variant="h5" sx={{ fontWeight: 'bold', m: 0 }}>
                            GRAND TOTAL: {reportData.total_quantity} Items
                        </Typography>
                    </Box>
                )}

                {/* Footer */}
                <Box sx={{ mt: 4, pt: 2, borderTop: '1px solid #000', textAlign: 'center' }}>
                    <Typography variant="body2">
                        This report was generated automatically by the POS system
                    </Typography>
                </Box>
            </Box>
        </>
    );
}
