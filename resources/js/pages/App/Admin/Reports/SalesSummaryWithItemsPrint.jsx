import React, { useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { format } from 'date-fns';

export default function SalesSummaryWithItemsPrint({ salesData, startDate, endDate, grandTotalQty, grandTotalAmount, grandTotalDiscount, grandTotalTax, grandTotalSale }) {
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
        return new Intl.NumberFormat('en-PK', {
            style: 'currency',
            currency: 'PKR'
        }).format(amount).replace('PKR', 'Rs');
    };

    const showTaxColumn =
        Number(grandTotalTax || 0) > 0 || (salesData || []).some((inv) => Number(inv?.total_tax || 0) > 0);

    return (
        <>
            <Head title="Sales Summary (With Items) - Print" />
            
            <style jsx global>{`
                @media print {
                    body {
                        margin: 0;
                        padding: 10px;
                        font-family: Arial, sans-serif;
                        font-size: 9px;
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
                        font-size: 8px;
                        margin: 1px 0;
                    }
                    
                    .invoice-section {
                        margin-bottom: 20px;
                        page-break-inside: avoid;
                        border: 1px solid #000;
                    }
                    
                    .invoice-header {
                        background-color: #f0f0f0;
                        padding: 6px;
                        border-bottom: 1px solid #000;
                        font-size: 8px;
                        font-weight: bold;
                    }
                    
                    .invoice-info {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 2px;
                    }
                    
                    .items-table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 5px;
                    }
                    
                    .items-table th {
                        background-color: #f8f8f8;
                        border: 1px solid #000;
                        padding: 3px 2px;
                        font-weight: bold;
                        font-size: 7px;
                        text-align: center;
                    }
                    
                    .items-table td {
                        border: 1px solid #000;
                        padding: 2px;
                        font-size: 7px;
                        text-align: center;
                    }
                    
                    .item-name {
                        text-align: left !important;
                        max-width: 120px;
                    }
                    
                    .total-row {
                        background-color: #e8f4fd;
                        font-weight: bold;
                    }
                    
                    .grand-total {
                        background-color: #000;
                        color: white;
                        font-weight: bold;
                        text-align: center;
                        padding: 8px;
                        margin-top: 15px;
                        font-size: 9px;
                    }
                    
                    .text-right {
                        text-align: right !important;
                    }
                    
                    .text-left {
                        text-align: left !important;
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
                    <div className="report-subtitle">SALES SUMMARY (WITH ITEMS)</div>
                    <div className="report-info">
                        Date = Between {formatDate(startDate)} To {formatDate(endDate)}, Name = , Category = [], Sub-Category = [], Item Code = ,
                    </div>
                    <div className="report-info">
                        Restaurant = [], Table = [], Waiter = [], Cashier = [], Discount/Taxes = All, Item Code = 
                    </div>
                </div>

                {/* Sales Data */}
                {salesData && Array.isArray(salesData) && salesData.length > 0 ? (
                    <div>
                        {salesData.map((invoice, index) => (
                            <div key={index} className="invoice-section">
                                {/* Invoice Header */}
                                <div className="invoice-header">
                                    <div className="invoice-info">
                                        <div>
                                            <strong>INVOICE#:</strong> {invoice.invoice_no} | 
                                            <strong> DATE:</strong> {invoice.date} | 
                                            <strong> CUSTOMER:</strong> {invoice.customer} | 
                                            <strong> ORDER VIA:</strong> {invoice.order_via}
                                        </div>
                                        <div>
                                            <strong>KOT:</strong> {invoice.kot} | 
                                        </div>
                                    </div>
                                    <div className="invoice-info">
                                        <div>
                                            <strong>WAITER:</strong> {invoice.waiter} | 
                                            <strong> TABLE#:</strong> {invoice.table} | 
                                            <strong> COVERS:</strong> {invoice.covers}
                                        </div>
                                    </div>
                                </div>

                                {/* Items Table */}
                                <table className="items-table">
                                    <thead>
                                        <tr>
                                            <th style={{ width: '45px' }}>TIME</th>
                                            <th style={{ width: '50px' }}>ITEM CODE</th>
                                            <th style={{ width: '120px' }}>ITEM NAME</th>
                                            <th style={{ width: '40px' }}>QTY SOLD</th>
                                            <th style={{ width: '50px' }}>SALE PRICE</th>
                                            <th style={{ width: '50px' }}>SUB TOTAL</th>
                                            <th style={{ width: '50px' }}>DISCOUNT</th>
                                            {showTaxColumn && <th style={{ width: '45px' }}>TAX</th>}
                                            <th style={{ width: '50px' }}>TOTAL SALE</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {invoice.items.map((item, itemIndex) => (
                                            <tr key={itemIndex}>
                                                <td>{item.time || '-'}</td>
                                                <td>{item.code}</td>
                                                <td className="item-name">{item.name}</td>
                                                <td>{item.qty}</td>
                                                <td className="text-right">{formatCurrency(item.sale_price)}</td>
                                                <td className="text-right">{formatCurrency(item.sub_total)}</td>
                                                <td className="text-right">{formatCurrency(item.discount)}</td>
                                                {showTaxColumn && <td className="text-right">{formatCurrency(item.tax)}</td>}
                                                <td className="text-right">{formatCurrency(item.total_sale)}</td>
                                            </tr>
                                        ))}
                                        {/* Invoice Total Row */}
                                        <tr className="total-row">
                                            <td><strong>TOTAL:</strong></td>
                                            <td></td>
                                            <td></td>
                                            <td><strong>{invoice.total_qty}</strong></td>
                                            <td></td>
                                            <td className="text-right"><strong>{formatCurrency(invoice.total_amount)}</strong></td>
                                            <td className="text-right"><strong>{formatCurrency(invoice.total_discount)}</strong></td>
                                            {showTaxColumn && <td className="text-right"><strong>{formatCurrency(invoice.total_tax)}</strong></td>}
                                            <td className="text-right"><strong>{formatCurrency(invoice.total_sale)}</strong></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        ))}

                        {/* Grand Total */}
                        <div className="grand-total">
                            <div>GRAND TOTALS</div>
                            <div style={{ marginTop: '5px' }}>
                                Invoices: {salesData.length} | Quantity: {grandTotalQty} | 
                                Sub Total: {formatCurrency(grandTotalAmount)} | 
                                Discount: {formatCurrency(grandTotalDiscount)}{showTaxColumn ? ` | Tax: ${formatCurrency(grandTotalTax)}` : ''} | 
                                Total Sale: {formatCurrency(grandTotalSale)}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                        <div style={{ fontSize: '12px' }}>
                            No sales data found for the selected date range
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
SalesSummaryWithItemsPrint.layout = (page) => page;
