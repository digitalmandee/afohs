import { useEffect } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import dayjs from 'dayjs';

const CheckOutPrint = ({ bookings = [], filters = {}, generatedAt = '' }) => {
    useEffect(() => {
        setTimeout(() => window.print(), 500);
    }, []);

    const getGuestName = (booking) => {
        if (booking.customer) return booking.customer.name;
        if (booking.member) return booking.member.full_name;
        if (booking.corporateMember) return booking.corporateMember.full_name;
        if (booking.corporate_member) return booking.corporate_member.full_name;
        return 'Unknown';
    };

    const getMemberType = (booking) => {
        if (booking.member) return 'Member';
        if (booking.corporateMember || booking.corporate_member) return 'Corporate';
        if (booking.customer) return 'Guest';
        if (booking.employee) return 'Employee';
        return 'Unknown';
    };

    const getMembershipNo = (booking) => {
        if (booking.member) return booking.member.membership_no;
        if (booking.corporateMember) return booking.corporateMember.membership_no;
        if (booking.corporate_member) return booking.corporate_member.membership_no;
        if (booking.customer) return booking.customer.customer_no;
        if (booking.employee) return booking.employee.employee_id || booking.employee.employee_no || booking.employee.id;
        return '-';
    };

    return (
        <Box sx={{ p: 3, backgroundColor: '#fff' }}>
            <style>{`@media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }`}</style>

            <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    Check-out Report
                </Typography>
                <Typography variant="body2" color="textSecondary">
                    {(filters.check_in_from || '') + (filters.check_in_to ? ` to ${filters.check_in_to}` : '') + (filters.check_out_from ? ` | ${filters.check_out_from}` : '') + (filters.check_out_to ? ` to ${filters.check_out_to}` : '')}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                    Generated: {generatedAt}
                </Typography>
            </Box>

            <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid #ddd' }}>
                <Table size="small">
                    <TableHead>
                        <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                            <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Check-In Date</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Check-Out Date</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Member / Guest</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Membership No</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Member Type</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Room</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Rent</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Nights</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Room Charges</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Other Charges</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Food Bill</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Advance</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Discount</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Inv Total</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Paid</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Balance</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {bookings.map((booking) => {
                            const roomCharge = parseFloat(booking.room_charge || 0);
                            const foodBill = (booking.orders || []).reduce((sum, order) => sum + parseFloat(order.total_price || 0), 0);
                            const advance = parseFloat(booking.advance_amount || 0);
                            const discount = parseFloat(booking.discount_value || 0);
                            const paidOrdersSum = (booking.orders || []).filter((o) => o.payment_status === 'paid').reduce((sum, order) => sum + parseFloat(order.total_price || 0), 0);

                            const invoiceTotal = parseFloat(booking.grand_total || 0) + foodBill;
                            const paid = parseFloat(booking.invoice?.paid_amount || 0) + paidOrdersSum;
                            const balance = Math.max(0, invoiceTotal - paid);

                            return (
                                <TableRow key={booking.id}>
                                    <TableCell>{booking.id}</TableCell>
                                    <TableCell>{booking.check_in_date ? dayjs(booking.check_in_date).format('DD-MM-YYYY') : ''}</TableCell>
                                    <TableCell>{booking.check_out_date ? dayjs(booking.check_out_date).format('DD-MM-YYYY') : ''}</TableCell>
                                    <TableCell>{getGuestName(booking)}</TableCell>
                                    <TableCell>{getMembershipNo(booking)}</TableCell>
                                    <TableCell>{getMemberType(booking)}</TableCell>
                                    <TableCell>{booking.room?.name || '-'}</TableCell>
                                    <TableCell>{Math.round(booking.per_day_charge || 0)}</TableCell>
                                    <TableCell>{booking.nights || 1}</TableCell>
                                    <TableCell>{Math.round(roomCharge)}</TableCell>
                                    <TableCell>{Math.round(booking.total_other_charges || 0)}</TableCell>
                                    <TableCell>{Math.round(foodBill)}</TableCell>
                                    <TableCell>{Math.round(advance)}</TableCell>
                                    <TableCell>{Math.round(discount)}</TableCell>
                                    <TableCell>{Math.round(invoiceTotal)}</TableCell>
                                    <TableCell>{Math.round(paid)}</TableCell>
                                    <TableCell>{Math.round(balance)}</TableCell>
                                </TableRow>
                            );
                        })}
                        {bookings.length > 0 && (
                            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                                <TableCell colSpan={8} sx={{ fontWeight: 700 }}>
                                    Grand Total
                                </TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>{Math.round(bookings.reduce((sum, b) => sum + (b.nights || 1), 0))}</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>{Math.round(bookings.reduce((sum, b) => sum + parseFloat(b.room_charge || 0), 0))}</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>{Math.round(bookings.reduce((sum, b) => sum + (parseFloat(b.other_charges_sum_amount || 0) + parseFloat(b.mini_bar_items_sum_amount || 0)), 0))}</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>{Math.round(bookings.reduce((sum, b) => sum + (b.orders || []).reduce((s, o) => s + parseFloat(o.total_price || 0), 0), 0))}</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>{Math.round(bookings.reduce((sum, b) => sum + parseFloat(b.advance_amount || 0), 0))}</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>{Math.round(bookings.reduce((sum, b) => sum + parseFloat(b.discount_value || 0), 0))}</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>
                                    {Math.round(
                                        bookings.reduce((sum, b) => {
                                            const fb = (b.orders || []).reduce((s, o) => s + parseFloat(o.total_price || 0), 0);
                                            return sum + parseFloat(b.grand_total || 0) + fb;
                                        }, 0),
                                    )}
                                </TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>
                                    {Math.round(
                                        bookings.reduce((sum, b) => {
                                            const paidOrders = (b.orders || []).filter((o) => o.payment_status === 'paid').reduce((s, o) => s + parseFloat(o.total_price || 0), 0);
                                            return sum + parseFloat(b.invoice?.paid_amount || 0) + paidOrders;
                                        }, 0),
                                    )}
                                </TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>
                                    {Math.round(
                                        bookings.reduce((sum, b) => {
                                            const paidOrdersSum = (b.orders || []).filter((o) => o.payment_status === 'paid').reduce((s, o) => s + parseFloat(o.total_price || 0), 0);
                                            const pd = parseFloat(b.invoice?.paid_amount || 0) + paidOrdersSum;
                                            const fb = (b.orders || []).reduce((s, o) => s + parseFloat(o.total_price || 0), 0);
                                            return sum + Math.max(0, parseFloat(b.grand_total || 0) + fb - pd);
                                        }, 0),
                                    )}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <Box sx={{ mt: 3, textAlign: 'right' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Total Records: {bookings.length}
                </Typography>
            </Box>
        </Box>
    );
};

CheckOutPrint.layout = (page) => page;

export default CheckOutPrint;
