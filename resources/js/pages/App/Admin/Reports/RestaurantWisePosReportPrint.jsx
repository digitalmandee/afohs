import React, { useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { format } from 'date-fns';

export default function RestaurantWisePosReportPrint({ allReportsData, startDate, endDate, grandTotal, grandSubTotal, grandDiscount, grandTax, grandTotalSale }) {
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
        Number(grandTax || 0) > 0 ||
        (allReportsData || []).some((r) => Number(r?.report_data?.total_tax || 0) > 0);

    return (
        <>
            {/* <Head title="Restaurant-Wise POS Reports - Print" /> */}
            
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
                        padding: 8px 4px;
                        font-weight: bold;
                        font-size: 10px;
                        text-align: center;
                    }
                    
                    .main-table td {
                        border-bottom: 1px solid #000;
                        padding: 4px;
                        font-size: 9px;
                        text-align: center;
                    }
                    
                    .category-header-row {
                        background-color: #f8f8f8;
                        font-weight: bold;
                        text-transform: uppercase;
                    }
                    
                    .category-header-row td {
                        padding: 6px;
                        font-size: 10px;
                        border-bottom: 1px solid #000;
                        text-align: left;
                    }
                    
                    .item-code-col {
                        width: 60px;
                        text-align: center;
                        font-weight: bold;
                    }
                    
                    .item-name-col {
                        text-align: left;
                        width: 150px;
                    }
                    
                    .item-qty-col {
                        width: 50px;
                        text-align: center;
                        font-weight: bold;
                    }
                    
                    .price-col {
                        width: 70px;
                        text-align: center;
                        font-weight: bold;
                    }
                    
                    .subtotal-col {
                        width: 80px;
                        text-align: center;
                        font-weight: bold;
                    }
                    
                    .discount-col {
                        width: 70px;
                        text-align: center;
                        font-weight: bold;
                    }
                    
                    .total-col {
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
                        padding: 6px 4px;
                    }
                    
                    .grand-total {
                        background-color: #000;
                        color: white;
                        font-weight: bold;
                        text-align: center;
                        padding: 15px;
                        margin-top: 30px;
                        font-size: 12px;
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
                    <div className="report-subtitle">DISH BREAKDOWN SUMMARY (RESTAURANT-WISE)</div>
                    <div className="report-info">
                        Date = Between {formatDate(startDate)} To {formatDate(endDate)}, Name = Category = [], Sub-Category = [], Item Code = ,
                    </div>
                    <div className="report-info">
                        Restaurant = [], Table = [], Waiter = [], Cashier = [], Discount/Taxes = All, Item Code = 
                    </div>
                    <div className="report-title" style={{ marginTop: '10px' }}>
                        RESTAURANT-WISE FINANCIAL REPORT
                    </div>
                </div>

                {/* Report Content */}
                {allReportsData && Array.isArray(allReportsData) && allReportsData.length > 0 ? (
                    allReportsData.map((restaurantData, restaurantIndex) => (
                        <div key={restaurantIndex} className="restaurant-section">
                            {/* Restaurant Header */}
                            <div className="restaurant-header">
                                {restaurantData.tenant_name} - Total Sale: {formatCurrency(restaurantData.report_data.total_sale)}
                            </div>

                            {/* Financial Table for Restaurant */}
                            <table className="main-table">
                                <thead>
                                    <tr>
                                        <th className="item-code-col">ITEM CODE</th>
                                        <th className="item-name-col">ITEM NAME</th>
                                        <th className="item-qty-col">QTY SOLD</th>
                                        <th className="price-col">SALE PRICE</th>
                                        <th className="subtotal-col">SUB TOTAL</th>
                                        <th className="discount-col">DISCOUNT</th>
                                        {showTaxColumn && <th className="tax-col">TAX</th>}
                                        <th className="total-col">TOTAL SALE</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {restaurantData.report_data && Array.isArray(restaurantData.report_data.categories) && restaurantData.report_data.categories.map((category, categoryIndex) => (
                                        <React.Fragment key={categoryIndex}>
                                            {/* Category Header Row */}
                                            <tr className="category-header-row">
                                                <td colSpan={showTaxColumn ? 8 : 7} style={{ fontWeight: 'bold', textAlign: 'left' }}>
                                                    {category.category_name}
                                                </td>
                                            </tr>
                                            
                                            {/* Category Items */}
                                            {Array.isArray(category.items) && category.items.map((item, itemIndex) => (
                                                <tr key={itemIndex}>
                                                    <td className="item-code-col">{item.menu_code || 'N/A'}</td>
                                                    <td className="item-name-col" style={{ textAlign: 'left' }}>{item.name}</td>
                                                    <td className="item-qty-col">{item.quantity}</td>
                                                    <td className="price-col">{formatCurrency(item.price)}</td>
                                                    <td className="subtotal-col">{formatCurrency(item.sub_total)}</td>
                                                    <td className="discount-col">{formatCurrency(item.discount)}</td>
                                                    {showTaxColumn && <td className="tax-col">{formatCurrency(item.tax)}</td>}
                                                    <td className="total-col">{formatCurrency(item.total_sale)}</td>
                                                </tr>
                                            ))}
                                            
                                            {/* Category Total Row */}
                                            <tr className="category-total-row">
                                                <td className="item-code-col"></td>
                                                <td className="item-name-col" style={{ fontWeight: 'bold', textAlign: 'left' }}>
                                                    {category.category_name.toUpperCase()} TOTAL:
                                                </td>
                                                <td className="item-qty-col" style={{ fontWeight: 'bold' }}>
                                                    {category.total_quantity}
                                                </td>
                                                <td className="price-col" style={{ fontWeight: 'bold' }}>
                                                    -
                                                </td>
                                                <td className="subtotal-col" style={{ fontWeight: 'bold' }}>
                                                    {formatCurrency(category.total_sub_total)}
                                                </td>
                                                <td className="discount-col" style={{ fontWeight: 'bold' }}>
                                                    {formatCurrency(category.total_discount)}
                                                </td>
                                                {showTaxColumn && (
                                                    <td className="tax-col" style={{ fontWeight: 'bold' }}>
                                                        {formatCurrency(category.total_tax)}
                                                    </td>
                                                )}
                                                <td className="total-col" style={{ fontWeight: 'bold' }}>
                                                    {formatCurrency(category.total_sale)}
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
                        <div>GRAND TOTALS ACROSS ALL RESTAURANTS</div>
                        <div style={{ marginTop: '10px' }}>
                            Items: {grandTotal} | Sub Total: {formatCurrency(grandSubTotal)} | 
                            Discount: {formatCurrency(grandDiscount)}
                            {showTaxColumn ? ` | Tax: ${formatCurrency(grandTax)}` : ''} | Total Sale: {formatCurrency(grandTotalSale)}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
RestaurantWisePosReportPrint.layout = (page) => page;
