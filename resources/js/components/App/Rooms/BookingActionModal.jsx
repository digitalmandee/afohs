import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box, TextField, Grid, Divider, IconButton, FormControl, InputLabel, Select, MenuItem, InputAdornment } from '@mui/material';
import { Close } from '@mui/icons-material';
import dayjs from 'dayjs';

const BookingActionModal = ({ open, onClose, booking, action, onConfirm }) => {
    const [reason, setReason] = useState('');
    const [refundData, setRefundData] = useState({ amount: '', mode: 'Cash', account: '' });

    // Helper to get nested guest name
    const getGuestName = (b) => {
        if (!b) return 'N/A';
        // Check direct relationships first (from room booking model)
        if (b.customer) return b.customer.name;
        if (b.member) return b.member.full_name;
        if (b.corporateMember) return b.corporateMember.full_name;
        if (b.corporate_member) return b.corporate_member.full_name; // Check snake_case

        // Fallback for older structures or when 'guest' object is passed directly
        if (b.guest_name) return b.guest_name;

        return 'N/A';
    };

    if (!booking) return null;

    const isCancel = action === 'cancel';
    const isRefund = action === 'refund';
    const title = isCancel ? 'Cancel Booking' : isRefund ? 'Return Advance' : 'Undo Cancellation';
    const confirmText = isCancel ? 'Confirm Cancel' : isRefund ? 'Confirm Return' : 'Confirm Undo';
    const confirmColor = isCancel || isRefund ? 'error' : 'primary';

    const handleConfirm = () => {
        onConfirm(booking.id, reason, refundData);
        setReason('');
        setRefundData({ amount: '', mode: 'Cash', account: '' });
        onClose();
    };

    const guestName = getGuestName(booking);

    // Check if refund is applicable (Advance/Security Deposit was taken)
    // We check invoice.paid_amount. If > 0, we show refund form.
    const maxRefundable = booking.invoice?.advance_payment || booking.invoice?.paid_amount || 0;
    const bookingDate = booking.booking_date || booking.created_at;
    const withinTwoDays = bookingDate ? dayjs().diff(dayjs(bookingDate), 'day') <= 2 : false;
    const showRefundForm = isRefund && booking.status === 'cancelled' && withinTwoDays && maxRefundable > 0;
    const amountValue = parseFloat(refundData.amount);
    const canConfirm = isRefund ? showRefundForm && !Number.isNaN(amountValue) && amountValue >= 1 : true;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
            <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8f9fa' }}>
                <Typography variant="h6" component="div" fontWeight="bold" color="#063455">
                    {title}
                </Typography>
                <IconButton onClick={onClose} size="small">
                    <Close />
                </IconButton>
            </DialogTitle>
            <DialogContent dividers>
                <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                        Booking Details:
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">
                                Booking ID:
                            </Typography>
                            <Typography variant="body1" fontWeight="500">
                                #{booking.booking_no || booking.id}
                            </Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">
                                Guest Name:
                            </Typography>
                            <Typography variant="body1" fontWeight="500">
                                {guestName}
                            </Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">
                                Room:
                            </Typography>
                            <Typography variant="body1" fontWeight="500">
                                {booking.room?.name || 'N/A'}
                            </Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">
                                Dates:
                            </Typography>
                            <Typography variant="body2" fontWeight="500">
                                {dayjs(booking.check_in_date).format('DD/MM/YYYY')} - {dayjs(booking.check_out_date).format('DD/MM/YYYY')}
                            </Typography>
                        </Grid>
                    </Grid>
                </Box>

                <Divider sx={{ my: 2 }} />

                {showRefundForm && (
                    <Box sx={{ mb: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
                        <Typography variant="subtitle2" fontWeight="bold" gutterBottom color="primary">
                            Return Advance Details (Max Returnable: {maxRefundable})
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Return Amount"
                                    type="number"
                                    size="small"
                                    value={refundData.amount}
                                    onChange={(e) => {
                                        const val = parseFloat(e.target.value);
                                        if (!Number.isNaN(val) && val > maxRefundable) return;
                                        setRefundData({ ...refundData, amount: e.target.value });
                                    }}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start">Rs</InputAdornment>,
                                    }}
                                    helperText={`Max returnable: ${maxRefundable}`}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Mode of Return</InputLabel>
                                    <Select value={refundData.mode} label="Mode of Return" onChange={(e) => setRefundData({ ...refundData, mode: e.target.value })}>
                                        <MenuItem value="Cash">Cash</MenuItem>
                                        <MenuItem value="Bank Transfer">Bank Transfer</MenuItem>
                                        <MenuItem value="Cheque">Cheque</MenuItem>
                                        <MenuItem value="Other">Other</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            {refundData.mode !== 'Cash' && (
                                <Grid item xs={12}>
                                    <TextField fullWidth label="Account / Cheque Details" size="small" value={refundData.account} onChange={(e) => setRefundData({ ...refundData, account: e.target.value })} placeholder="Enter account no or cheque details" />
                                </Grid>
                            )}
                        </Grid>
                    </Box>
                )}

                <Typography variant="body1" sx={{ mb: 2 }}>
                    {isCancel
                        ? 'Are you sure you want to cancel this booking? This action can be undone later.'
                        : isRefund
                        ? 'Return advance for this cancelled booking.'
                        : 'Are you sure you want to undo the cancellation and restore this booking?'}
                </Typography>

                {isCancel && <TextField fullWidth label="Cancellation Reason" multiline rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Enter reason for cancellation..." variant="outlined" sx={{ mt: 1 }} />}

                {isRefund && <TextField fullWidth label="Return Note" multiline rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Enter note..." variant="outlined" sx={{ mt: 1 }} />}
            </DialogContent>
            <DialogActions sx={{ p: 2, backgroundColor: '#f8f9fa' }}>
                <Button onClick={onClose} variant="outlined" color="inherit" sx={{ borderRadius: '8px', textTransform: 'none' }}>
                    Close
                </Button>
                <Button onClick={handleConfirm} disabled={!canConfirm} variant="contained" color={confirmColor} sx={{ borderRadius: '8px', textTransform: 'none' }}>
                    {confirmText}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default BookingActionModal;
