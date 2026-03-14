import React, { useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { format } from 'date-fns';

export default function RunningSalesOrdersPrint({ runningOrders, totalOrders, totalAmount, reportDate, startDate, endDate }) {
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

    const formatTime = (dateString) => {
        try {
            return format(new Date(dateString), 'HH:mm:ss');
        } catch (error) {
            return dateString;
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-PK', {
            style: 'currency',
            currency: 'PKR',
        }).format(amount).replace('PKR', 'Rs');
    };

    const formatOrderType = (type) => {
        const types = {
            dineIn: 'Dine-In',
            delivery: 'Delivery',
            takeaway: 'Takeaway',
            reservation: 'Reservation',
            room_service: 'Room Service',
        };
        return types[type] || type || '-';
    };

    const getCustomerType = (order) => {
        if (order.employee) return 'Employee';
        if (order.member) return order.member?.memberType?.name === 'Corporate' ? 'Corporate' : 'Member';
        if (order.customer) return order.customer?.guestType?.name || order.customer?.guest_type?.name || 'Guest';
        return 'Guest';
    };

    const getCustomerNo = (order) => {
        if (order.member) return order.member.membership_no || '-';
        if (order.customer) return order.customer.customer_no || '-';
        if (order.employee) return order.employee.employee_id || '-';
        return '-';
    };

    const getCustomerName = (order) => {
        if (order.member) return order.member.full_name || '-';
        if (order.customer) return order.customer.name || '-';
        if (order.employee) return order.employee.name || '-';
        return '-';
    };

    return (
        <>
            <Head title="Running Sales Orders - Print" />

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
                        font-size: 10px;
                        margin: 2px 0;
                    }

                    .main-table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 20px;
                        font-size: 8px;
                        border: 1px solid #000;
                    }

                    .main-table th {
                        background-color: #f0f0f0;
                        border-bottom: 1px solid #000;
                        padding: 4px 2px;
                        font-weight: bold;
                        text-align: center;
                        font-size: 8px;
                    }

                    .main-table td {
                        border-bottom: 1px solid #000;
                        padding: 3px 2px;
                        text-align: center;
                        font-size: 8px;
                    }

                    .text-left {
                        text-align: left !important;
                    }

                    .text-right {
                        text-align: right !important;
                    }

                    .font-bold {
                        font-weight: bold;
                    }

                    .summary-footer {
                        background-color: #000;
                        color: white;
                        font-weight: bold;
                        text-align: center;
                        padding: 10px;
                        margin-top: 20px;
                        font-size: 11px;
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
                    <div className="report-subtitle">RUNNING SALES ORDERS REPORT</div>
                    <div className="report-info">
                        Date: Between {formatDate(startDate || reportDate)} To {formatDate(endDate || reportDate)} | Generated: {formatDate(new Date())} {formatTime(new Date())}
                    </div>
                    <div className="report-info">
                        Total Orders: {totalOrders} | Total Amount: {formatCurrency(totalAmount)}
                    </div>
                </div>

                {/* Orders Table */}
                {runningOrders && Array.isArray(runningOrders) && runningOrders.length > 0 ? (
                    <table className="main-table">
                        <thead>
                            <tr>
                                <th style={{ width: '30px' }}>SR</th>
                                <th style={{ width: '70px' }}>INVOICE #</th>
                                <th style={{ width: '60px' }}>DATE</th>
                                <th style={{ width: '50px' }}>TIME</th>
                                <th style={{ width: '50px' }}>TABLE #</th>
                                <th style={{ width: '100px' }}>RESTAURANT</th>
                                <th style={{ width: '90px' }}>ORDER TAKER</th>
                                <th style={{ width: '80px' }}>CUSTOMER TYPE</th>
                                <th style={{ width: '70px' }}>CUSTOMER #</th>
                                <th style={{ width: '110px' }}>CUSTOMER NAME</th>
                                <th style={{ width: '80px' }}>GRAND TOTAL</th>
                                <th style={{ width: '60px' }}>CASHIER</th>
                                <th style={{ width: '70px' }}>ORDER MODE</th>
                            </tr>
                        </thead>
                        <tbody>
                            {runningOrders.map((order, index) => (
                                <tr key={order.id}>
                                    <td className="font-bold">{index + 1}</td>
                                    <td className="font-bold">{order.invoice_no || order.id}</td>
                                    <td>{formatDate(order.start_date || order.created_at)}</td>
                                    <td>{order.start_time || formatTime(order.created_at)}</td>
                                    <td className="font-bold">{order.table?.table_no || order.table_id || 'N/A'}</td>
                                    <td className="text-left">{order.tenant?.name || 'N/A'}</td>
                                    <td>{order.waiter?.name || 'N/A'}</td>
                                    <td>{getCustomerType(order)}</td>
                                    <td>{getCustomerNo(order)}</td>
                                    <td className="text-left">{getCustomerName(order)}</td>
                                    <td className="font-bold text-right">{formatCurrency(order.total_price || 0)}</td>
                                    <td>{order.cashier?.name || order.cashier_name || 'N/A'}</td>
                                    <td className="font-bold">{formatOrderType(order.order_type)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                        <div style={{ fontSize: '14px' }}>No running orders found for today</div>
                        <div style={{ fontSize: '12px', marginTop: '10px' }}>All orders have been completed or there are no orders yet.</div>
                    </div>
                )}

                {/* Summary Footer */}
                {runningOrders && runningOrders.length > 0 && (
                    <div className="summary-footer">
                        TOTAL RUNNING ORDERS: {totalOrders} | TOTAL AMOUNT: {formatCurrency(totalAmount)}
                    </div>
                )}
            </div>
        </>
    );
}
RunningSalesOrdersPrint.layout = (page) => page;
