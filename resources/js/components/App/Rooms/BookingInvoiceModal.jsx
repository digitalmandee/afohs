import React, { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress, Stack, TextField, Typography, Box, Grid, ThemeProvider, createTheme, Button as MuiButton } from '@mui/material';
import { Button } from 'react-bootstrap'; // Added Modal import for popup

import axios from 'axios';
import { enqueueSnackbar } from 'notistack';
import { generateInvoiceContent, JSONParse } from '@/helpers/generateTemplate';
import RoomCheckInModal from './CheckInModal';
import { router, usePage } from '@inertiajs/react';
import dayjs from 'dayjs';

const BookingInvoiceModal = ({ open, onClose, bookingId, setBookings, financeView, type = false }) => {
    const props = usePage().props;
    const auth = props.auth;

    const [loading, setLoading] = useState(false);
    const [showCheckInModal, setShowCheckInModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [selectedBooking, setSelectedBooking] = useState(null);

    useEffect(() => {
        if (!bookingId || !open) return;

        setLoading(true);
        axios
            .get(route('rooms.invoice', { id: bookingId }))
            .then((res) => {
                setSelectedBooking(res.data.booking);
            })
            .catch((error) => {
                enqueueSnackbar('Failed to load booking data.', { variant: 'error' });
            })
            .finally(() => setLoading(false));
    }, [bookingId, open]);

    const handleStatusUpdate = (newStatus) => {
        if (!selectedBooking) return;

        setSelectedBooking((prev) => ({ ...prev, status: newStatus }));

        if (setBookings) {
            setBookings((prev) => prev.map((booking) => (booking.id === selectedBooking.id ? { ...booking, status: newStatus } : booking)));
        }
    };

    const handleCancelClick = () => {
        setShowCancelModal(true);
    };

    const handleCancelBooking = async () => {
        if (!cancelReason.trim()) {
            enqueueSnackbar('Please provide a cancellation reason.', { variant: 'error' });
            return;
        }

        try {
            await axios.put(route('rooms.update.status', { id: selectedBooking.id }), {
                status: 'cancelled',
                cancellation_reason: cancelReason,
            });

            setSelectedBooking((prev) => ({ ...prev, status: 'cancelled' }));

            if (setBookings) {
                setBookings((prev) => prev.map((booking) => (booking.id === selectedBooking.id ? { ...booking, status: 'cancelled' } : booking)));
            }

            enqueueSnackbar('Booking cancelled successfully!', { variant: 'success' });

            // Close modals
            setShowCancelModal(false);
            setCancelReason('');
        } catch (error) {
            enqueueSnackbar('Failed to cancel booking.', { variant: 'error' });
        }
    };

    return (
        <>
            <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
                <DialogContent>
                    {loading ? (
                        <Stack alignItems="center" py={3}>
                            <CircularProgress />
                        </Stack>
                    ) : (
                        <>
                            {selectedBooking && (
                                <>
                                    <div dangerouslySetInnerHTML={{ __html: selectedBooking ? generateInvoiceContent(selectedBooking, type) : '' }} />
                                    {/* ✅ Documents Preview */}
                                    {JSONParse(selectedBooking?.booking_docs) && JSONParse(selectedBooking?.booking_docs).length > 0 && (
                                        <div style={{ marginTop: '20px' }}>
                                            <h5>Attached Documents</h5>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                                                {JSONParse(selectedBooking?.booking_docs).map((doc, index) => {
                                                    const ext = doc.split('.').pop().toLowerCase();

                                                    // ✅ For images
                                                    if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
                                                        return (
                                                            <div key={index} style={{ width: '100px', textAlign: 'center' }}>
                                                                <img src={doc} alt={`Document ${index + 1}`} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px', cursor: 'pointer' }} onClick={() => window.open(doc, '_blank')} />
                                                                <p style={{ fontSize: '12px', marginTop: '5px' }}>Image</p>
                                                            </div>
                                                        );
                                                    }

                                                    // ✅ For PDF
                                                    if (ext === 'pdf') {
                                                        return (
                                                            <div key={index} style={{ width: '100px', textAlign: 'center' }}>
                                                                <img
                                                                    src="/assets/pdf-icon.png" // You can use a static icon
                                                                    alt="PDF"
                                                                    style={{ width: '60px', cursor: 'pointer' }}
                                                                    onClick={() => window.open(doc, '_blank')}
                                                                />
                                                                <p style={{ fontSize: '12px', marginTop: '5px' }}>PDF</p>
                                                            </div>
                                                        );
                                                    }

                                                    // ✅ For DOCX
                                                    if (ext === 'docx' || ext === 'doc') {
                                                        return (
                                                            <div key={index} style={{ width: '100px', textAlign: 'center' }}>
                                                                <img
                                                                    src="/assets/word-icon.png" // Use a static Word icon
                                                                    alt="DOCX"
                                                                    style={{ width: '60px', cursor: 'pointer' }}
                                                                    onClick={() => window.open(doc, '_blank')}
                                                                />
                                                                <p style={{ fontSize: '12px', marginTop: '5px' }}>Word</p>
                                                            </div>
                                                        );
                                                    }

                                                    return null; // For unknown file types
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
                    <Button variant="secondary" onClick={onClose}>
                        Close
                    </Button>

                    {!financeView && (
                        <>
                            {selectedBooking?.status === 'confirmed' && (
                                <Button variant="secondary" onClick={() => setShowCheckInModal(true)}>
                                    Check In
                                </Button>
                            )}
                            {selectedBooking?.status === 'checked_in' && (
                                <Button variant="secondary" onClick={() => router.visit(route('rooms.edit.booking', { id: selectedBooking.id, type: 'checkout' }))}>
                                    Check Out
                                </Button>
                            )}
                            {/* Cancel Button - Only show if not checked_in or checked_out */}
                            {!['checked_in', 'checked_out', 'cancelled', 'no_show', 'refunded'].includes(selectedBooking?.status) && (
                                <Button variant="danger" onClick={handleCancelClick}>
                                    Cancel Booking
                                </Button>
                            )}
                            {!['checked_out', 'cancelled', 'no_show', 'refunded'].includes(selectedBooking?.status) ? (
                                <Button variant="secondary" onClick={() => router.visit(route('rooms.edit.booking', { id: selectedBooking?.id }))}>
                                    Edit
                                </Button>
                            ) : (
                                ''
                            )}
                        </>
                    )}
                    {['cancelled', 'no_show', 'refunded'].includes(selectedBooking?.status) && <Button variant="danger">Cancelled</Button>}
                    {['checked_in', 'checked_out', 'confirmed'].includes(selectedBooking?.status) &&
                        (selectedBooking?.invoice?.status === 'unpaid' ? (
                            <Button variant="success" onClick={() => router.visit(route('booking.payment', { invoice_no: selectedBooking?.invoice?.id }))}>
                                Pay Now
                            </Button>
                        ) : selectedBooking?.invoice?.status === 'paid' ? (
                            <Button variant="outline-success" disabled>
                                Paid
                            </Button>
                        ) : null)}

                    {/* TODO: Optional - Keep print button if needed during testing */}
                    <Button
                        style={{ backgroundColor: '#063455', color: 'white' }}
                        onClick={() => {
                            const printWindow = window.open('', '_blank');
                            printWindow.document.write(`${generateInvoiceContent(selectedBooking, type)}`);
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

            {/* Room Checkin Modal  */}
            <RoomCheckInModal
                open={showCheckInModal}
                onClose={(status) => {
                    setShowCheckInModal(false);
                    if (status === 'success') {
                        handleStatusUpdate('checked_in');
                    }
                }}
                bookingId={selectedBooking?.id}
            />

            {/* Cancel Booking Modal */}
                <Dialog open={showCancelModal} onClose={() => setShowCancelModal(false)} maxWidth="sm" fullWidth>
                    <DialogTitle>Cancel Room Booking</DialogTitle>
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
                                            <strong>Mobile:</strong> {selectedBooking.mobile || selectedBooking.customer?.phone_number || selectedBooking.member?.mobile_number_a || 'N/A'}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="body2">
                                            <strong>Room:</strong> {selectedBooking.room?.name || 'N/A'}
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
                                            <strong>Check-in Date:</strong> {selectedBooking.check_in_date ? dayjs(selectedBooking.check_in_date).format('DD-MM-YYYY') : 'N/A'}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="body2">
                                            <strong>Check-out Date:</strong> {selectedBooking.check_out_date ? dayjs(selectedBooking.check_out_date).format('DD-MM-YYYY') : 'N/A'}
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
                        <MuiButton variant="outlined" onClick={() => setShowCancelModal(false)}>
                            Close
                        </MuiButton>
                        <MuiButton variant="contained" onClick={handleCancelBooking} sx={{ backgroundColor: '#dc3545', '&:hover': { backgroundColor: '#c82333' } }}>
                            Cancel Booking
                        </MuiButton>
                    </DialogActions>
                </Dialog>
        </>
    );
};

export default BookingInvoiceModal;
