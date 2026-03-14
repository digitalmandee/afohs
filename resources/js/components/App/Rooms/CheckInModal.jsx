import React, { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, CircularProgress, Stack, Typography, Divider, Grid } from '@mui/material';
import axios from 'axios';
import { enqueueSnackbar } from 'notistack';
import dayjs from 'dayjs';

const RoomCheckInModal = ({ open, onClose, bookingId }) => {
    const [loading, setLoading] = useState(false);
    const [checkInDate, setCheckInDate] = useState('');
    const [checkInTime, setCheckInTime] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [bookingInfo, setBookingInfo] = useState(null);

    useEffect(() => {
        if (!bookingId || !open) return;

        setCheckInTime(dayjs().format('HH:mm'));
        setLoading(true);
        axios
            .get(route('api.room.booking.show', { id: bookingId }))
            .then((res) => {
                const booking = res.data.booking;
                setCheckInDate(booking.check_in_date || booking.booking_date);
                setBookingInfo({
                    customerName: booking.customer ? booking.customer.name : booking.member ? booking.member.full_name : booking.corporateMember || booking.corporate_member ? (booking.corporateMember || booking.corporate_member).full_name : 'N/A',
                    email: booking.customer ? booking.customer.email : booking.member ? booking.member.personal_email : booking.corporateMember || booking.corporate_member ? (booking.corporateMember || booking.corporate_member).personal_email : 'N/A',
                    bookingId: booking.booking_no,
                    roomName: (booking.room?.room_type?.name || '') + ' - ' + (booking.room?.name || ''),
                    charges: booking.grand_total,
                    invoiceStatus: booking.invoice?.status,
                    paidAmount: booking.invoice?.paid_amount || 0,
                    status: booking.status,
                });
            })
            .catch((error) => {
                console.log(error);

                enqueueSnackbar('Failed to load booking data.', { variant: 'error' });
            })
            .finally(() => setLoading(false));
    }, [bookingId, open]);

    const handleSubmit = () => {
        if (!checkInTime) return enqueueSnackbar('Check-in time is required.', { variant: 'warning' });

        setSubmitting(true);
        axios
            .post(route('api.room.booking.checkin'), {
                booking_id: bookingId,
                check_in_date: checkInDate,
                check_in_time: checkInTime,
            })
            .then(() => {
                enqueueSnackbar('Check-in successful.', { variant: 'success' });
                onClose('success');
            })
            .catch((err) => {
                if (err.response?.data?.message) {
                    enqueueSnackbar(err.response.data.message, { variant: 'error' });
                } else {
                    enqueueSnackbar('Check-in failed.', { variant: 'error' });
                }
            })
            .finally(() => setSubmitting(false));
    };

    const isStatusAllowed = ['pending', 'confirmed'].includes(bookingInfo?.status);

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>Check In Room</DialogTitle>
            <DialogContent>
                {loading ? (
                    <Stack alignItems="center" py={3}>
                        <CircularProgress />
                    </Stack>
                ) : (
                    <>
                        {bookingInfo && (
                            <Stack spacing={1} mb={2}>
                                <Typography variant="subtitle2" color="text.secondary">
                                    Booking Details
                                </Typography>
                                <Divider />
                                <Grid container spacing={1}>
                                    <Grid item xs={6}>
                                        <strong>Customer:</strong> {bookingInfo.customerName}
                                    </Grid>
                                    <Grid item xs={6}>
                                        <strong>Email:</strong> {bookingInfo.email}
                                    </Grid>
                                    <Grid item xs={6}>
                                        <strong>Booking ID:</strong> {bookingInfo.bookingId}
                                    </Grid>
                                    <Grid item xs={6}>
                                        <strong>Room:</strong> {bookingInfo.roomName}
                                    </Grid>
                                    <Grid item xs={6}>
                                        <strong>Charges:</strong> {parseFloat(bookingInfo.charges).toFixed(2)}
                                    </Grid>
                                    <Grid item xs={6}>
                                        <strong>Paid Amount:</strong> {parseFloat(bookingInfo.paidAmount || 0).toFixed(2)}
                                    </Grid>
                                    <Grid item xs={6}>
                                        <strong>Balance:</strong> {(parseFloat(bookingInfo.charges) - parseFloat(bookingInfo.paidAmount || 0)).toFixed(2)}
                                    </Grid>
                                    <Grid item xs={6}>
                                        <strong>Invoice Status:</strong> <span style={{ textTransform: 'capitalize', fontWeight: 'bold', color: parseFloat(bookingInfo.paidAmount || 0) >= parseFloat(bookingInfo.charges) ? 'green' : 'red' }}>{parseFloat(bookingInfo.paidAmount || 0) >= parseFloat(bookingInfo.charges) ? 'Paid' : 'Unpaid'}</span>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <strong>Booking Status:</strong> <span style={{ textTransform: 'capitalize' }}>{bookingInfo.status}</span>
                                    </Grid>
                                </Grid>
                                <Divider sx={{ my: 1 }} />
                            </Stack>
                        )}
                        <Stack spacing={2}>
                            <TextField label="Check In Date" value={checkInDate} disabled fullWidth />
                            <TextField label="Select Check In Time" type="time" value={checkInTime} onChange={(e) => setCheckInTime(e.target.value)} fullWidth InputLabelProps={{ shrink: true }} disabled={loading || submitting || !isStatusAllowed} />
                        </Stack>
                    </>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} variant="outlined" disabled={submitting}>
                    Cancel
                </Button>
                <Button onClick={handleSubmit} variant="contained" style={{ backgroundColor: '#063455', color: '#fff' }} disabled={loading || submitting || !isStatusAllowed}>
                    {submitting ? 'Submitting...' : 'Submit'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default RoomCheckInModal;
