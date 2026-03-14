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

export default function AllPosReportsPrint({ allReportsData, startDate, endDate, grandTotal }) {
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
            <Head title="All Restaurants POS Reports - Print" />
            
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
                    .print-page-break { page-break-before: always; }
                    
                    .report-header {
                        text-align: center;
                        margin-bottom: 20px;
                        border-bottom: 2px solid #000;
                        padding-bottom: 10px;
                    }
                    
                    .report-title {
                        font-size: 16px;
                        font-weight: bold;
                        margin: 5px 0;
                    }
                    
                    .report-subtitle {
                        font-size: 14px;
                        font-weight: bold;
                        margin: 3px 0;
                    }
                    
                    .report-info {
                        font-size: 10px;
                        margin: 2px 0;
                    }
                    
                    .restaurant-section {
                        margin-bottom: 40px;
                        page-break-inside: avoid;
                    }
                    
                    .restaurant-header {
                        background-color: #000;
                        color: white;
                        font-weight: bold;
                        text-align: center;
                        text-transform: uppercase;
                        padding: 12px;
                        margin: 20px 0 10px 0;
                        font-size: 14px;
                    }
                    
                    .main-table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 20px;
                    }
                    
                    .main-table th {
                        background-color: #f0f0f0;
                        border-bottom: 1px solid #000;
                        padding: 8px;
                        font-weight: bold;
                        font-size: 11px;
                        text-align: center;
                    }
                    
                    .main-table td {
                        border-bottom: 1px solid #000;
                        padding: 6px 8px;
                        font-size: 10px;
                    }
                    
                    .category-header-row {
                        background-color: #f8f8f8;
                        font-weight: bold;
                        text-transform: uppercase;
                    }
                    
                    .category-header-row td {
                        padding: 8px;
                        font-size: 11px;
                        border-bottom: 1px solid #000;
                    }
                    
                    .item-code-col {
                        width: 80px;
                        text-align: center;
                        font-weight: bold;
                    }
                    
                    .item-name-col {
                        text-align: left;
                    }
                    
                    .item-qty-col {
                        width: 80px;
                        text-align: center;
                        font-weight: bold;
                    }
                    
                    .category-total-row {
                        background-color: #f0f0f0;
                        font-weight: bold;
                    }
                    
                    .category-total-row td {
                        border-top: 2px solid #000;
                        padding: 6px 8px;
                    }
                    
                    .restaurant-total {
                        background-color: #e0e0e0;
                        font-weight: bold;
                        text-align: center;
                        padding: 10px;
                        margin: 10px 0;
                        border-bottom: 2px solid #000;
                        font-size: 12px;
                    }
                    
                    .grand-total {
                        background-color: #000;
                        color: white;
                        font-weight: bold;
                        text-align: center;
                        padding: 15px;
                        margin-top: 30px;
                        font-size: 16px;
                    }
                }
                @media screen {
                    body {
                        background-color: white;
                        padding: 20px;
                        font-family: Arial, sans-serif;
                    }
                }
            `}</style>

            <div style={{ margin: '0 auto', backgroundColor: 'white', padding: '20px' }}>
                {/* Header */}
                <div className="report-header">
                    <div className="report-title">AFOHS</div>
                    <div className="report-subtitle">ALL RESTAURANTS - DISH BREAKDOWN SUMMARY (SOLD QUANTITY)</div>
                    <div className="report-info">
                        Date = Between {formatDate(startDate)} To {formatDate(endDate)}, Name = Category = [], Sub-Category = [], Item Code = ,
                    </div>
                    <div className="report-info">
                        Restaurant = [], Table = [], Waiter = [], Cashier = [], Discount/Taxes = All, Item Code = 
                    </div>
                    <div className="report-title" style={{ marginTop: '10px' }}>
                        ALL RESTAURANTS CONSOLIDATED REPORT
                    </div>
                </div>

                {/* Report Content */}
                {allReportsData && allReportsData.length > 0 ? (
                    allReportsData.map((restaurantData, restaurantIndex) => (
                        <div key={restaurantIndex} className="restaurant-section">
                            {/* Restaurant Header */}
                            <div className="restaurant-header">
                                {restaurantData.tenant_name} - Total Items: {restaurantData.report_data.total_quantity}
                            </div>

                            {/* Single Table for Restaurant */}
                            <table className="main-table">
                                <thead>
                                    <tr>
                                        <th className="item-code-col">ITEM CODE</th>
                                        <th className="item-name-col">ITEM NAME</th>
                                        <th className="item-qty-col">QTY SOLD</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {restaurantData.report_data.categories.map((category, categoryIndex) => (
                                        <React.Fragment key={categoryIndex}>
                                            {/* Category Header Row */}
                                            <tr className="category-header-row">
                                                <td colSpan="3" style={{ fontWeight: 'bold', textAlign: 'left' }}>
                                                    {category.category_name}
                                                </td>
                                            </tr>
                                            
                                            {/* Category Items */}
                                            {category.items.map((item, itemIndex) => (
                                                <tr key={itemIndex}>
                                                    <td className="item-code-col">{item.menu_code || 'N/A'}</td>
                                                    <td className="item-name-col">{item.name}</td>
                                                    <td className="item-qty-col">{item.quantity}</td>
                                                </tr>
                                            ))}
                                            
                                            {/* Category Total Row */}
                                            <tr className="category-total-row">
                                                <td className="item-code-col"></td>
                                                <td className="item-name-col" style={{ fontWeight: 'bold' }}>
                                                    {category.category_name.toUpperCase()} TOTAL:
                                                </td>
                                                <td className="item-qty-col" style={{ fontWeight: 'bold' }}>
                                                    {category.total_quantity}
                                                </td>
                                            </tr>
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ))
                ) : (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                        <div style={{ fontSize: '14px' }}>
                            No restaurant data available for the selected date range
                        </div>
                    </div>
                )}

                {/* Grand Total */}
                {allReportsData && allReportsData.length > 0 && (
                    <div className="grand-total">
                        GRAND TOTAL: {grandTotal} Items Across All Restaurants
                    </div>
                )}
            </div>
        </>
    );
}
AllPosReportsPrint.layout = (page) => page;