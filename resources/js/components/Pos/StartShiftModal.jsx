import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box } from '@mui/material';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import dayjs from 'dayjs';
import { routeNameForContext } from '@/lib/utils';

const StartShiftModal = ({ open, onSuccess }) => {
    const { enqueueSnackbar } = useSnackbar();
    const [loading, setLoading] = useState(false);

    const handleStartShift = async () => {
        setLoading(true);
        try {
            const response = await axios.post(route(routeNameForContext('pos-shifts.start'))); // No data needed

            if (response.data.success) {
                enqueueSnackbar('Shift started successfully!', { variant: 'success' });
                onSuccess?.(response.data.shift);
            }
        } catch (error) {
            console.error(error);
            const msg = error.response?.data?.message || 'Failed to start shift.';
            enqueueSnackbar(msg, { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} maxWidth="sm" fullWidth disableEscapeKeyDown>
            <DialogTitle>Start POS Shift</DialogTitle>
            <DialogContent>
                <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Typography variant="body1">You must start a shift before taking any orders today.</Typography>
                    <Typography variant="h6" color="primary">
                        {dayjs().format('dddd, D MMMM YYYY')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Click below to start your shift for today.
                    </Typography>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button variant="contained" onClick={handleStartShift} disabled={loading} sx={{ backgroundColor: '#063455' }}>
                    {loading ? 'Starting...' : 'Start Shift'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default StartShiftModal;
