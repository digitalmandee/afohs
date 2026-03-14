import React, { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress, Stack, TextField, FormControl, InputLabel, Select, MenuItem, ThemeProvider, createTheme, Button, Typography, Box, Grid } from '@mui/material';
import axios from 'axios';
import { enqueueSnackbar } from 'notistack';
import { generateEventInvoiceContent, JSONParse } from '@/helpers/generateEventTemplate';
import { router } from '@inertiajs/react';

// Create Material-UI theme to ensure consistent styling
const theme = createTheme({
    palette: {
        primary: {
            main: '#063455',
        },
        secondary: {
            main: '#063455',
        },
    },
});

const EventBookingInvoiceModal = ({ open, onClose, bookingId, setBookings, financeView = false }) => {
    const [loading, setLoading] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [newStatus, setNewStatus] = useState('');
    const [cancelReason, setCancelReason] = useState('');
    const [completedTime, setCompletedTime] = useState(new Date().toTimeString().slice(0, 5));

    useEffect(() => {
        if (!bookingId || !open) return;
        console.log(bookingId);

        setLoading(true);
        axios
            .get(route('events.booking.invoice', { id: bookingId }))
            .then((res) => {
                console.log(res);

                console.log('Event Booking Invoice Data:', res.data.booking);
                console.log('Invoice Status:', res.data.booking?.invoice?.status);
                setSelectedBooking(res.data.booking);
            })
            .catch((error) => {
                enqueueSnackbar('Failed to load booking data.', { variant: 'error' });
            })
            .finally(() => setLoading(false));
    }, [bookingId, open]);

    // Force Material-UI styles to be injected when modal opens
    useEffect(() => {
        if (open) {
            // Force a re-render to ensure styles are applied
            const timer = setTimeout(() => {
                // This forces the component to re-evaluate styles
                document.body.classList.add('mui-modal-open');
                return () => document.body.classList.remove('mui-modal-open');
            }, 10);
            return () => clearTimeout(timer);
        }
    }, [open]);

    const handleStatusUpdate = (status) => {
        if (status === 'cancelled') {
            setShowCancelModal(true);
            return;
        }

        if (status === 'completed') {
            router.visit(route('events.booking.edit', { id: selectedBooking.id, mode: 'complete' }));
            return;
        }

        updateBookingStatus(status);
    };

    const updateBookingStatus = async (status, additionalData = {}) => {
        try {
            const payload = {
                status: status,
                ...additionalData,
            };

            await axios.put(route('events.booking.update.status', { id: selectedBooking.id }), payload);

            setSelectedBooking((prev) => ({ ...prev, status: status }));

            if (setBookings) {
                setBookings((prev) => prev.map((booking) => (booking.id === selectedBooking.id ? { ...booking, status: status } : booking)));
            }

            enqueueSnackbar(`Booking ${status} successfully!`, { variant: 'success' });

            // Close modals
            setShowStatusModal(false);
            setShowCancelModal(false);
            setCancelReason('');
        } catch (error) {
            enqueueSnackbar('Failed to update booking status.', { variant: 'error' });
        }
    };

    const handleCompleteBooking = () => {
        updateBookingStatus('completed', { completed_time: completedTime });
    };

    const handleCancelBooking = () => {
        if (!cancelReason.trim()) {
            enqueueSnackbar('Please provide a cancellation reason.', { variant: 'error' });
            return;
        }
        updateBookingStatus('cancelled', { cancellation_reason: cancelReason });
    };

    const getAvailableActions = (status) => {
        switch (status) {
            case 'pending':
                return ['confirmed'];
            case 'confirmed':
                return ['completed'];
            case 'completed':
            case 'cancelled':
                return [];
            default:
                return [];
        }
    };

    return (
        <ThemeProvider theme={theme}>
            <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
                <DialogContent>
                    {loading ? (
                        <Stack alignItems="center" py={3}>
                            <CircularProgress />
                        </Stack>
                    ) : (
                        <>
                            {selectedBooking && (
                                <>
                                    <div dangerouslySetInnerHTML={{ __html: selectedBooking ? generateEventInvoiceContent(selectedBooking) : '' }} />

                                    {/* Documents Preview */}
                                    {JSONParse(selectedBooking?.booking_docs) && JSONParse(selectedBooking?.booking_docs).length > 0 && (
                                        <div style={{ marginTop: '20px' }}>
                                            <h5>Attached Documents</h5>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                                                {JSONParse(selectedBooking?.booking_docs).map((doc, index) => {
                                                    const ext = doc.split('.').pop().toLowerCase();

                                                    // For images
                                                    if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
                                                        return (
                                                            <div key={index} style={{ width: '100px', textAlign: 'center' }}>
                                                                <img src={doc} alt={`Document ${index + 1}`} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px', cursor: 'pointer' }} onClick={() => window.open(doc, '_blank')} />
                                                                <p style={{ fontSize: '12px', marginTop: '5px' }}>Image</p>
                                                            </div>
                                                        );
                                                    }

                                                    // For PDF
                                                    if (ext === 'pdf') {
                                                        return (
                                                            <div key={index} style={{ width: '100px', textAlign: 'center' }}>
                                                                <img src="/assets/pdf-icon.png" alt="PDF" style={{ width: '60px', cursor: 'pointer' }} onClick={() => window.open(doc, '_blank')} />
                                                                <p style={{ fontSize: '12px', marginTop: '5px' }}>PDF</p>
                                                            </div>
                                                        );
                                                    }

                                                    // For DOCX
                                                    if (ext === 'docx' || ext === 'doc') {
                                                        return (
                                                            <div key={index} style={{ width: '100px', textAlign: 'center' }}>
                                                                <img src="/assets/word-icon.png" alt="DOCX" style={{ width: '60px', cursor: 'pointer' }} onClick={() => window.open(doc, '_blank')} />
                                                                <p style={{ fontSize: '12px', marginTop: '5px' }}>Word</p>
                                                            </div>
                                                        );
                                                    }

                                                    return null;
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button variant="contained" color="secondary" onClick={onClose}>
                        Close
                    </Button>

                    {!financeView && (
                        <>
                            {/* Status Action Buttons */}
                            {getAvailableActions(selectedBooking?.status).map((action) => (
                                <Button key={action} variant="contained" color={action === 'cancelled' ? 'error' : 'success'} onClick={() => handleStatusUpdate(action)}>
                                    {action === 'confirmed' ? 'Confirm' : action === 'completed' ? 'Complete' : 'Cancel'}
                                </Button>
                            ))}

                            {/* Edit Button - only for non-completed/cancelled bookings */}
                            {!['completed', 'cancelled'].includes(selectedBooking?.status) && (
                                <Button variant="contained" color="secondary" onClick={() => router.visit(route('events.booking.edit', { id: selectedBooking?.id }))}>
                                    Edit
                                </Button>
                            )}
                        </>
                    )}

                    {/* Payment Button */}
                    {selectedBooking?.status !== 'cancelled' && selectedBooking?.invoice?.status === 'unpaid' ? (
                        <Button variant="contained" color="success" onClick={() => router.visit(route('booking.payment', { invoice_no: selectedBooking?.invoice?.id }))}>
                            Pay Now
                        </Button>
                    ) : selectedBooking?.status !== 'cancelled' && selectedBooking?.invoice?.status === 'paid' ? (
                        <Button variant="outlined" color="success" disabled>
                            Paid
                        </Button>
                    ) : null}

                    {/* Print Button */}
                    <Button
                        style={{ backgroundColor: '#063455', color: 'white' }}
                        onClick={() => {
                            const printWindow = window.open('', '_blank');
                            printWindow.document.write(`${generateEventInvoiceContent(selectedBooking)}`);
                            printWindow.document.close();
                            printWindow.focus();
                            setTimeout(() => {
                                printWindow.print();
                                printWindow.close();
                            }, 250);
                        }}
                    >
                        Print
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Complete Booking Modal */}
            <Dialog open={showStatusModal} onClose={() => setShowStatusModal(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Complete Event Booking</DialogTitle>
                <DialogContent>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                        Mark this event booking as completed?
                    </Typography>
                    <TextField label="Completion Time" type="time" value={completedTime} onChange={(e) => setCompletedTime(e.target.value)} fullWidth InputLabelProps={{ shrink: true }} sx={{ mt: 2 }} />
                </DialogContent>
                <DialogActions>
                    <Button variant="outlined" onClick={() => setShowStatusModal(false)}>
                        Cancel
                    </Button>
                    <Button variant="contained" onClick={handleCompleteBooking} sx={{ backgroundColor: '#28a745', '&:hover': { backgroundColor: '#1e7e34' } }}>
                        Complete Booking
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Cancel Booking Modal */}
            <Dialog open={showCancelModal} onClose={() => setShowCancelModal(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Cancel Event Booking</DialogTitle>
                <DialogContent>
                    {/* Booking Details */}
                    {selectedBooking && (
                        <Box sx={{ mb: 3, p: 2, backgroundColor: '#f8f9fa', borderRadius: 1 }}>
                            <Typography variant="h6" sx={{ mb: 2, color: '#495057' }}>
                                Booking Details
                            </Typography>
                            <Grid container spacing={2} sx={{ fontSize: '14px' }}>
                                <Grid item xs={6}>
                                    <Typography variant="body2">
                                        <strong>Name:</strong> {selectedBooking.name || selectedBooking.customer?.name || selectedBooking.member?.full_name || 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2">
                                        <strong>Mobile:</strong> {selectedBooking.mobile || selectedBooking.customer?.phone_number || selectedBooking.member?.mobile || 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2">
                                        <strong>Address:</strong> {selectedBooking.address || selectedBooking.customer?.address || selectedBooking.member?.address || 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2">
                                        <strong>Contact:</strong> {selectedBooking.contact || selectedBooking.customer?.email || selectedBooking.member?.personal_email || 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2">
                                        <strong>{selectedBooking.member_id ? 'Membership No:' : 'Customer No:'}</strong> {selectedBooking.member_id ? selectedBooking.member?.membership_no : selectedBooking.customer?.customer_no || 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2">
                                        <strong>Event:</strong> {selectedBooking.nature_of_event || 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2">
                                        <strong>Event Date:</strong> {selectedBooking.event_date || 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2">
                                        <strong>Guests:</strong> {selectedBooking.no_of_guests || 'N/A'}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </Box>
                    )}

                    <Typography variant="body1" sx={{ mb: 2 }}>
                        Please provide a reason for cancelling this booking:
                    </Typography>
                    <TextField label="Cancellation Reason" multiline rows={3} value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} fullWidth required autoFocus sx={{ mt: 2 }} />
                </DialogContent>
                <DialogActions>
                    <Button variant="outlined" onClick={() => setShowCancelModal(false)}>
                        Close
                    </Button>
                    <Button variant="contained" onClick={handleCancelBooking} sx={{ backgroundColor: '#dc3545', '&:hover': { backgroundColor: '#c82333' } }}>
                        Cancel Booking
                    </Button>
                </DialogActions>
            </Dialog>
        </ThemeProvider>
    );
};

export default EventBookingInvoiceModal;
