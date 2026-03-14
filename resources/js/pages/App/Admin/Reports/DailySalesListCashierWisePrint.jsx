import React, { useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { format } from 'date-fns';

export default function DailySalesListCashierWisePrint({ 
    cashierData, 
    startDate, 
    endDate, 
    grandTotalSale, 
    grandTotalDiscount, 
    grandTotalSTax, 
    grandTotalCash, 
    grandTotalCredit, 
    grandTotalPaid, 
    grandTotalUnpaid, 
    grandTotal 
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
        return 'Rs ' + new Intl.NumberFormat('en-PK', {
            style: 'decimal',
            minimumFractionDigits: 1,
            maximumFractionDigits: 2
        }).format(amount);
    };

    return (
        <>
            
            <style jsx global>{`
                @media print {
                    body {
                        margin: 0;
                        padding: 15px;
                        font-family: Arial, sans-serif;
                        font-size: 10px;
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
                        font-size: 9px;
                        margin: 2px 0;
                    }
                    
                    .main-table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 20px;
                    }
                    
                    .main-table th {
                        background-color: #f0f0f0;
                        border: 1px solid #000;
                        padding: 6px 4px;
                        font-weight: bold;
                        font-size: 9px;
                        text-align: center;
                    }
                    
                    .main-table td {
                        border: 1px solid #000;
                        padding: 4px;
                        font-size: 9px;
                        text-align: center;
                    }
                    
                    .cashier-name {
                        text-align: left !important;
                        font-weight: bold;
                        width: 120px;
                    }
                    
                    .amount-col {
                        width: 60px;
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
                    <div className="report-subtitle">DAILY SALES LIST (CASHIER-WISE)</div>
                    <div className="report-info">
                        Date = Between {formatDate(startDate)} To {formatDate(endDate)}, Name = , Restaurant = [], Table # = [], Waiter = [], Cashier = [],
                    </div>
                    <div className="report-info">
                        Discounted/Taxed = All, Order Type = []
                    </div>
                </div>

                {/* Cashier Sales Table */}
                {cashierData && Array.isArray(cashierData) && cashierData.length > 0 ? (
                    <table className="main-table">
                        <thead>
                            <tr>
                                <th className="cashier-name">CASHIER NAME</th>
                                <th className="amount-col">SALE</th>
                                <th className="amount-col">DISC.</th>
                                <th className="amount-col">S.TAX AMT</th>
                                <th className="amount-col">Cash</th>
                                <th className="amount-col">Credit</th>
                                <th className="amount-col">Paid</th>
                                <th className="amount-col">Unpaid</th>
                                <th className="amount-col">TOTAL</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cashierData.map((cashier, index) => (
                                <tr key={index}>
                                    <td className="cashier-name">{cashier.name}</td>
                                    <td className="amount-col">{formatCurrency(cashier.sale)}</td>
                                    <td className="amount-col">{formatCurrency(cashier.discount)}</td>
                                    <td className="amount-col">{formatCurrency(cashier.s_tax_amt)}</td>
                                    <td className="amount-col">{formatCurrency(cashier.cash)}</td>
                                    <td className="amount-col">{formatCurrency(cashier.credit)}</td>
                                    <td className="amount-col">{formatCurrency(cashier.paid)}</td>
                                    <td className="amount-col">{formatCurrency(cashier.unpaid)}</td>
                                    <td className="amount-col">{formatCurrency(cashier.total)}</td>
                                </tr>
                            ))}
                            
                            {/* Grand Total Row */}
                            <tr className="grand-total-row">
                                <td className="cashier-name">GRAND TOTAL:</td>
                                <td className="amount-col">{formatCurrency(grandTotalSale)}</td>
                                <td className="amount-col">{formatCurrency(grandTotalDiscount)}</td>
                                <td className="amount-col">{formatCurrency(grandTotalSTax)}</td>
                                <td className="amount-col">{formatCurrency(grandTotalCash)}</td>
                                <td className="amount-col">{formatCurrency(grandTotalCredit)}</td>
                                <td className="amount-col">{formatCurrency(grandTotalPaid)}</td>
                                <td className="amount-col">{formatCurrency(grandTotalUnpaid)}</td>
                                <td className="amount-col">{formatCurrency(grandTotal)}</td>
                            </tr>
                        </tbody>
                    </table>
                ) : (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                        <div style={{ fontSize: '14px' }}>
                            No cashier sales data found for the selected date range
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
DailySalesListCashierWisePrint.layout = (page) => page;