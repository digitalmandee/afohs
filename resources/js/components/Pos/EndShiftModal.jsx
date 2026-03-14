import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box } from '@mui/material';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import { routeNameForContext } from '@/lib/utils';

const EndShiftModal = ({ open, onClose, onSuccess }) => {
    const { enqueueSnackbar } = useSnackbar();
    const [loading, setLoading] = useState(false);

    const handleEndShift = async () => {
        setLoading(true);
        try {
            const response = await axios.post(route(routeNameForContext('pos-shifts.end')));

            if (response.data.success) {
                enqueueSnackbar('Shift ended successfully.', { variant: 'success' });
                onSuccess?.();
                onClose();
            }
        } catch (error) {
            console.error(error);
            const msg = error.response?.data?.message || 'Failed to end shift.';
            enqueueSnackbar(msg, { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>End POS Shift</DialogTitle>
            <DialogContent>
                <Box sx={{ pt: 1 }}>
                    <Typography variant="body1">Are you sure you want to end your shift?</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        This will mark your session as closed. You will need to start a new shift to take further orders.
                    </Typography>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={loading} color="inherit">
                    Cancel
                </Button>
                <Button variant="contained" onClick={handleEndShift} disabled={loading} color="error">
                    {loading ? 'Ending...' : 'End Shift'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default EndShiftModal;
