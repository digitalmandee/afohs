import { useState } from 'react';
import axios from 'axios';
import { Box, Typography, TextField, Dialog, DialogContent, DialogActions, IconButton, Radio, RadioGroup, FormControlLabel, FormControl, Button } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { enqueueSnackbar } from 'notistack';

const MembershipSuspensionDialog = ({ open, onClose, memberId, onSuccess, updateUrl }) => {
    const [suspensionReason, setSuspensionReason] = useState('');
    const [suspensionDuration, setSuspensionDuration] = useState('1Day');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const handleSuspend = async () => {
        const newErrors = {};

        if (!suspensionReason.trim()) {
            newErrors.reason = 'Suspension reason is required.';
        }

        if (suspensionDuration === 'CustomDate' && (!customStartDate || !customEndDate)) {
            if (!customStartDate) newErrors.customStartDate = 'Please select a start date.';
            if (!customEndDate) newErrors.customEndDate = 'Please select an end date.';
        }

        if (suspensionDuration === 'CustomDate' && customStartDate && customEndDate && new Date(customStartDate) >= new Date(customEndDate)) {
            newErrors.customEndDate = 'End date must be after start date.';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        if (!memberId) return;

        setLoading(true);
        setErrors({});
        try {
            const payload = {
                member_id: memberId,
                status: 'suspended',
                reason: suspensionReason,
                duration_type: suspensionDuration,
                custom_start_date: suspensionDuration === 'CustomDate' ? customStartDate : null,
                custom_end_date: suspensionDuration === 'CustomDate' ? customEndDate : null,
            };

            const url = updateUrl || route('membership.update-status');
            await axios.post(url, payload);
            enqueueSnackbar('Membership suspended successfully', { variant: 'success' });
            onClose();
            onSuccess?.('suspended');
        } catch (err) {
            enqueueSnackbar('Failed to suspend membership', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    position: 'absolute',
                    m: 0,
                    width: '600px',
                    borderRadius: 2,
                    p: 2,
                },
            }}
        >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 500, fontSize: 28 }}>
                    Suspend Membership
                </Typography>
                <IconButton size="large" sx={{ p: 0 }} onClick={onClose}>
                    <CloseIcon />
                </IconButton>
            </Box>

            <DialogContent sx={{ p: 0 }}>
                <Typography variant="body1" sx={{ mb: 1, fontWeight: 500 }}>
                    Reason For Suspension
                </Typography>
                <TextField
                    fullWidth
                    placeholder="Enter suspension reason"
                    value={suspensionReason}
                    onChange={(e) => setSuspensionReason(e.target.value)}
                    variant="outlined"
                    error={!!errors.reason}
                    helperText={errors.reason}
                    sx={{
                        mb: 3,
                        '& .MuiOutlinedInput-root': {
                            borderRadius: 1,
                        },
                    }}
                />

                <Typography variant="body1" sx={{ mb: 1, fontWeight: 500 }}>
                    Suspension Duration
                </Typography>
                <FormControl component="fieldset">
                    <RadioGroup row value={suspensionDuration} onChange={(e) => setSuspensionDuration(e.target.value)} sx={{ gap: 1 }}>
                        {[
                            { label: '1 Day', value: '1Day' },
                            { label: '1 Monthly', value: '1Monthly' },
                            { label: '1 Year', value: '1Year' },
                            { label: 'Custom Date', value: 'CustomDate' },
                        ].map((opt) => (
                            <FormControlLabel
                                key={opt.value}
                                value={opt.value}
                                control={<Radio sx={{ '&.Mui-checked': { color: '#003153' } }} />}
                                label={opt.label}
                                sx={{
                                    border: '1px solid #e0e0e0',
                                    borderRadius: 1,
                                    m: 0,
                                    px: 1,
                                    '&:has(.Mui-checked)': {
                                        borderColor: '#003153',
                                    },
                                }}
                            />
                        ))}
                    </RadioGroup>
                </FormControl>

                {suspensionDuration === 'CustomDate' && (
                    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            type="date"
                            fullWidth
                            label="Start Date"
                            value={customStartDate}
                            onChange={(e) => setCustomStartDate(e.target.value)}
                            error={!!errors.customStartDate}
                            helperText={errors.customStartDate}
                            InputLabelProps={{
                                shrink: true,
                            }}
                            inputProps={{
                                min: new Date().toISOString().split('T')[0],
                            }}
                        />
                        <TextField
                            type="date"
                            fullWidth
                            label="End Date"
                            value={customEndDate}
                            onChange={(e) => setCustomEndDate(e.target.value)}
                            error={!!errors.customEndDate}
                            helperText={errors.customEndDate}
                            InputLabelProps={{
                                shrink: true,
                            }}
                            inputProps={{
                                min: customStartDate || new Date().toISOString().split('T')[0],
                            }}
                        />
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{ p: 0, mt: 4, justifyContent: 'flex-end' }}>
                <Button
                    variant="outlined"
                    onClick={onClose}
                    sx={{
                        borderColor: '#003153',
                        color: '#003153',
                        textTransform: 'none',
                        px: 3,
                        py: 1,
                        mr: 1,
                        borderRadius: 0.5,
                    }}
                >
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    onClick={handleSuspend}
                    disabled={loading}
                    sx={{
                        bgcolor: '#003153',
                        '&:hover': { bgcolor: '#00254d' },
                        textTransform: 'none',
                        px: 3,
                        py: 1,
                        borderRadius: 0.5,
                    }}
                >
                    {loading ? 'Processing...' : 'Confirm Suspend'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default MembershipSuspensionDialog;
