import React, { useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { Box, Typography, Grid, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button } from '@mui/material';
import { Print } from '@mui/icons-material';
import dayjs from 'dayjs';

export default function Invoice({ booking }) {
    useEffect(() => {
        // Optional: Auto print on load
        // window.print();
    }, []);

    const handlePrint = () => {
        window.print();
    };

    const customerName = booking.customer_name || booking.member?.full_name || booking.corporate_member?.full_name || 'N/A';
    const customerPhone = booking.customer_phone || booking.member?.mobile_number_a || booking.corporate_member?.mobile_number || 'N/A';
    const customerAddress = booking.receiver_address || booking.member?.current_address || 'N/A';

    // Calculate totals
    const total = parseFloat(booking.total_price || 0);
    const tax = parseFloat(booking.tax_amount || 0);
    const discount = parseFloat(booking.discount_amount || 0);
    const advance = parseFloat(booking.advance_amount || 0);
    const grandTotal = total + tax - discount;
    const balance = grandTotal - advance;

    return (
        <>
            <Head title={`Invoice #${booking.booking_number}`} />
            <Box sx={{ p: 4, maxWidth: '800px', margin: '0 auto', bgcolor: 'white', minHeight: '100vh' }}>
                {/* Print Button (Hidden in Print) */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2, '@media print': { display: 'none' } }}>
                    <Button variant="contained" startIcon={<Print />} onClick={handlePrint} sx={{ bgcolor: '#063455' }}>
                        Print Invoice
                    </Button>
                </Box>

                <Paper elevation={0} sx={{ p: 0, border: '1px solid #eee' }}>
                    {/* Header */}
                    <Box sx={{ p: 3, borderBottom: '1px solid #eee' }}>
                        <Grid container alignItems="center">
                            <Grid item xs={2}>
                                {/* Logo placeholder */}
                                <img src="/images/logo.png" alt="Logo" style={{ maxHeight: 60, maxWidth: '100%' }} />
                            </Grid>
                            <Grid item xs={8} textAlign="center">
                                <Typography variant="h5" fontWeight="bold" color="#063455">
                                    AFOHS CLUB
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    PAF Falcon Complex, Gulberg III, Lahore
                                </Typography>
                            </Grid>
                            <Grid item xs={2} textAlign="right">
                                <Typography variant="h6" color="#333">
                                    INVOICE
                                </Typography>
                                <Typography variant="caption" display="block" color="text.secondary">
                                    #{booking.booking_number}
                                </Typography>
                            </Grid>
                        </Grid>
                    </Box>

                    {/* Bill To & Info */}
                    <Box sx={{ p: 3 }}>
                        <Grid container spacing={4}>
                            <Grid item xs={6}>
                                <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ color: '#063455', textTransform: 'uppercase' }}>
                                    Bill To:
                                </Typography>
                                <Typography variant="body2">
                                    <strong>Name:</strong> {customerName}
                                </Typography>
                                <Typography variant="body2">
                                    <strong>Phone:</strong> {customerPhone}
                                </Typography>
                                <Typography variant="body2">
                                    <strong>Address:</strong> {customerAddress}
                                </Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ color: '#063455', textTransform: 'uppercase' }}>
                                    Booking Details:
                                </Typography>
                                <Typography variant="body2">
                                    <strong>Booking Date:</strong> {dayjs(booking.booking_date).format('DD/MM/YYYY')}
                                </Typography>
                                <Typography variant="body2">
                                    <strong>Delivery Date:</strong> {booking.delivery_date ? dayjs(booking.delivery_date).format('DD/MM/YYYY') : 'N/A'}
                                </Typography>
                                <Typography variant="body2">
                                    <strong>Pickup Time:</strong> {booking.pickup_time || 'N/A'}
                                </Typography>
                                <Typography variant="body2">
                                    <strong>Payment Mode:</strong> {booking.payment_mode || 'N/A'}
                                </Typography>
                            </Grid>
                        </Grid>
                    </Box>

                    {/* Cake Details Table */}
                    <TableContainer sx={{ px: 3, mb: 3 }}>
                        <Table size="small">
                            <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                                <TableRow>
                                    <TableCell>
                                        <strong>Description</strong>
                                    </TableCell>
                                    <TableCell align="right">
                                        <strong>Amount (Rs)</strong>
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                <TableRow>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight="bold">
                                            {booking.cake_type?.name || 'Cake'}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" display="block">
                                            {booking.weight ? `Weight: ${booking.weight} lbs` : ''}
                                            {booking.flavor ? `, Flavor: ${booking.flavor}` : ''}
                                            {booking.filling ? `, Filling: ${booking.filling}` : ''}
                                        </Typography>
                                        {booking.message && (
                                            <Typography variant="caption" display="block">
                                                Message: {booking.message}
                                            </Typography>
                                        )}
                                        {booking.special_instructions && (
                                            <Typography variant="caption" display="block">
                                                Note: {booking.special_instructions}
                                            </Typography>
                                        )}
                                    </TableCell>
                                    <TableCell align="right">{total.toLocaleString()}</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {/* Summary */}
                    <Box sx={{ px: 3, mb: 3 }}>
                        <Grid container justifyContent="flex-end">
                            <Grid item xs={5}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography variant="body2">Total Amount:</Typography>
                                    <Typography variant="body2" fontWeight="bold">
                                        {total.toLocaleString()}
                                    </Typography>
                                </Box>
                                {discount > 0 && (
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="body2">Discount:</Typography>
                                        <Typography variant="body2">- {discount.toLocaleString()}</Typography>
                                    </Box>
                                )}
                                {tax > 0 && (
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="body2">Tax:</Typography>
                                        <Typography variant="body2">+ {tax.toLocaleString()}</Typography>
                                    </Box>
                                )}
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, borderTop: '1px solid #ddd', pt: 1 }}>
                                    <Typography variant="body2" fontWeight="bold">
                                        Grand Total:
                                    </Typography>
                                    <Typography variant="body2" fontWeight="bold">
                                        {grandTotal.toLocaleString()}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography variant="body2">Advance:</Typography>
                                    <Typography variant="body2">{advance.toLocaleString()}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, bgcolor: '#f5f5f5', p: 1, borderRadius: 1 }}>
                                    <Typography variant="subtitle2" fontWeight="bold">
                                        Balance Due:
                                    </Typography>
                                    <Typography variant="subtitle2" fontWeight="bold" color="error">
                                        {balance.toLocaleString()}
                                    </Typography>
                                </Box>
                            </Grid>
                        </Grid>
                    </Box>

                    {/* Footer */}
                    <Box sx={{ p: 3, borderTop: '1px solid #eee', marginTop: 4 }}>
                        <Grid container>
                            <Grid item xs={6}>
                                <Typography variant="caption" color="text.secondary">
                                    <strong>Created By:</strong> {booking.created_by?.name || 'Admin'}
                                </Typography>
                            </Grid>
                            <Grid item xs={6} textAlign="right">
                                <Typography variant="caption" color="text.secondary">
                                    Thank you for your business!
                                </Typography>
                            </Grid>
                        </Grid>
                    </Box>
                </Paper>
            </Box>
        </>
    );
}
