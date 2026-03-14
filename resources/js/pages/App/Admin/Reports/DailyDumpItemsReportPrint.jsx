import React, { useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { format } from 'date-fns';

export default function DailyDumpItemsReportPrint({ 
    dumpItemsData, 
    startDate, 
    endDate, 
    totalQuantity, 
    totalSalePrice, 
    totalFoodValue 
}) {
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

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'decimal',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    return (
        <>
            <Head title="Daily Dump Items Report - Print" />
            
            <style jsx global>{`
                @media print {
                    body {
                        margin: 0;
                        padding: 10px;
                        font-family: Arial, sans-serif;
                        font-size: 8px;
                        line-height: 1.1;
                    }
                    .no-print {
                        display: none !important;
                    }
                    
                    .report-header {
                        text-align: center;
                        margin-bottom: 15px;
                        border-bottom: 2px solid #000;
                        padding-bottom: 8px;
                    }
                    
                    .report-title {
                        font-size: 14px;
                        font-weight: bold;
                        margin: 3px 0;
                    }
                    
                    .report-subtitle {
                        font-size: 12px;
                        font-weight: bold;
                        margin: 2px 0;
                    }
                    
                    .report-info {
                        font-size: 7px;
                        margin: 1px 0;
                    }
                    
                    .main-table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 15px;
                        font-size: 6px;
                    }
                    
                    .main-table th {
                        background-color: #f0f0f0;
                        border: 1px solid #000;
                        padding: 2px 1px;
                        font-weight: bold;
                        font-size: 6px;
                        text-align: center;
                    }
                    
                    .main-table td {
                        border: 1px solid #000;
                        padding: 1px;
                        font-size: 6px;
                        text-align: center;
                    }
                    
                    .text-left {
                        text-align: left !important;
                    }
                    
                    .text-right {
                        text-align: right !important;
                    }
                    
                    .grand-total-row {
                        background-color: #000;
                        color: white;
                        font-weight: bold;
                    }
                    
                    .grand-total-row td {
                        color: white;
                        font-weight: bold;
                    }
                    
                    .status-cancelled {
                        background-color: #ffcdd2;
                        color: #c62828;
                        padding: 1px 2px;
                        border-radius: 2px;
                        font-weight: bold;
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

            <div style={{ margin: '0 auto', backgroundColor: 'white', padding: '15px' }}>
                {/* Header */}
                <div className="report-header">
                    <div className="report-title">AFOHS</div>
                    <div className="report-subtitle">DAILY DUMP ITEMS REPORT</div>
                    <div className="report-info">
                        Date = Between {formatDate(startDate)} To {formatDate(endDate)}, Name = , Category = [], Sub-Category = [], Item Code = , Restaurant = [],
                    </div>
                    <div className="report-info">
                        Table # = [], Waiter = [],Cashier = [], Cancelled By = [], Discounted/Taxed = All, Status = All
                    </div>
                </div>

                {/* Dump Items Table */}
                {dumpItemsData && Array.isArray(dumpItemsData) && dumpItemsData.length > 0 ? (
                    <table className="main-table">
                        <thead>
                            <tr>
                                <th style={{ width: '60px' }}>ORDER #</th>
                                <th style={{ width: '40px' }}>TABLE #</th>
                                <th style={{ width: '55px' }}>DATE</th>
                                <th style={{ width: '45px' }}>ITEM CODE</th>
                                <th style={{ width: '100px' }}>ITEM NAME</th>
                                <th style={{ width: '30px' }}>QTY</th>
                                <th style={{ width: '50px' }}>STATUS</th>
                                <th style={{ width: '70px' }}>INSTRUCTIONS</th>
                                <th style={{ width: '80px' }}>REASON</th>
                                <th style={{ width: '70px' }}>REMARKS</th>
                                <th style={{ width: '50px' }}>SALE PRICE</th>
                                <th style={{ width: '50px' }}>FOOD VALUE</th>
                                <th style={{ width: '70px' }}>CANCELLED BY</th>
                            </tr>
                        </thead>
                        <tbody>
                            {dumpItemsData.map((item, index) => (
                                <tr key={index}>
                                    <td>{item.invoice_kot}</td>
                                    <td>{item.table_no}</td>
                                    <td>{item.date}</td>
                                    <td>{item.item_code}</td>
                                    <td className="text-left">{item.item_name}</td>
                                    <td>{item.qty}</td>
                                    <td>
                                        <span className="status-cancelled">{item.status}</span>
                                    </td>
                                    <td className="text-left">{item.instructions}</td>
                                    <td className="text-left">{item.reason}</td>
                                    <td className="text-left">{item.remarks}</td>
                                    <td className="text-right">{formatCurrency(item.sale_price)}</td>
                                    <td className="text-right">{formatCurrency(item.food_value)}</td>
                                    <td>{item.cancelled_by}</td>
                                </tr>
                            ))}
                            
                            {/* Grand Total Row */}
                            <tr className="grand-total-row">
                                <td colSpan={5}><strong>GRAND TOTAL:</strong></td>
                                <td><strong>{formatCurrency(totalQuantity)}</strong></td>
                                <td colSpan={5}></td>
                                <td className="text-right"><strong>{formatCurrency(totalSalePrice)}</strong></td>
                                <td className="text-right"><strong>{formatCurrency(totalFoodValue)}</strong></td>
                            </tr>
                        </tbody>
                    </table>
                ) : (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                        <div style={{ fontSize: '12px' }}>
                            No dumped items found for the selected date range
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
DailyDumpItemsReportPrint.layout = (page) => page;
