import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Typography, CircularProgress } from '@mui/material';
import { enqueueSnackbar } from 'notistack';
import { router } from '@inertiajs/react';

const EventCompletionModal = ({ open, onClose, bookingId, onSuccess }) => {
    const [completedTime, setCompletedTime] = useState(new Date().toTimeString().slice(0, 5));
    const [loading, setLoading] = useState(false);

    const handleCompleteBooking = async () => {
        if (!bookingId) return;

        setLoading(true);
        try {
            router.visit(route('events.booking.edit', { id: bookingId, mode: 'complete' }));
            onClose();
            if (onSuccess) onSuccess();
        } catch (error) {
            console.error('Error completing booking:', error);
            enqueueSnackbar('Error completing booking. Please try again.', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setCompletedTime(new Date().toTimeString().slice(0, 5));
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>Complete Event Booking</DialogTitle>
            <DialogContent>
                <Typography variant="body1" sx={{ mb: 2 }}>
                    Mark this event booking as completed?
                </Typography>
                <TextField
                    label="Completion Time"
                    type="time"
                    value={completedTime}
                    onChange={(e) => setCompletedTime(e.target.value)}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    sx={{ mt: 2 }}
                />
            </DialogContent>
            <DialogActions>
                <Button variant="outlined" onClick={handleClose} disabled={loading}>
                    Cancel
                </Button>
                <Button 
                    variant="contained" 
                    onClick={handleCompleteBooking}
                    disabled={loading}
                    sx={{ backgroundColor: '#28a745', '&:hover': { backgroundColor: '#1e7e34' } }}
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
                >
                    {loading ? 'Completing...' : 'Complete Booking'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default EventCompletionModal;
