import { useState } from 'react';
import axios from 'axios';
import { Dialog, DialogContent, DialogActions, Box, Typography, IconButton, Button, Snackbar, TextField } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

const ActivateMembershipDialog = ({ open, onClose, memberId, onSuccess, updateUrl }) => {
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', error: false });

    const handleActivate = async () => {
        if (!memberId) return;

        if (!reason.trim()) {
            setSnackbar({ open: true, message: 'Reason is required', error: true });
            return;
        }

        setLoading(true);
        try {
            const payload = {
                member_id: memberId,
                status: 'active',
                reason,
            };
            const url = updateUrl || route('membership.update-status');
            await axios.post(url, payload);
            setSnackbar({ open: true, message: 'Membership activated', error: false });
            onClose();
            onSuccess?.('active'); // Send back updated status
        } catch (err) {
            console.log(err);

            setSnackbar({ open: true, message: 'Failed to activate member', error: true });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <Box sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="h5">Activate Membership</Typography>
                    <IconButton onClick={onClose}>
                        <CloseIcon />
                    </IconButton>
                </Box>

                <DialogContent>
                    <Typography sx={{ mb: 1, fontWeight: 500 }}>Reason</Typography>
                    <TextField fullWidth placeholder="Enter activation reason" value={reason} onChange={(e) => setReason(e.target.value)} variant="outlined" />
                </DialogContent>

                <DialogActions>
                    <Button onClick={onClose} variant="outlined">
                        Cancel
                    </Button>
                    <Button onClick={handleActivate} disabled={loading} variant="contained" sx={{ bgcolor: '#003153' }}>
                        {loading ? 'Processing...' : 'Confirm Activate'}
                    </Button>
                </DialogActions>
            </Box>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                message={snackbar.message}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                ContentProps={{
                    sx: {
                        bgcolor: snackbar.error ? 'error.main' : 'success.main',
                        color: '#fff',
                    },
                }}
            />
        </Dialog>
    );
};

export default ActivateMembershipDialog;
