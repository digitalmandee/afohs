import { useState, useEffect } from 'react';
import { TextField, Button, Typography, Box, Modal, CircularProgress, MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import axios from 'axios';
import { enqueueSnackbar } from 'notistack';
import { usePage } from '@inertiajs/react';

const AddEventMenuAddonModal = ({ open, handleClose, onSuccess, eventMenuAddon }) => {
    const [name, setName] = useState('');
    const [amount, setAmount] = useState('');
    const [status, setStatus] = useState('active');
    const { props } = usePage();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (eventMenuAddon) {
            setName(eventMenuAddon.name || '');
            setAmount(eventMenuAddon.amount || 0);
            setStatus(eventMenuAddon.status || 'active');
        } else {
            setName('');
            setAmount(0);
            setStatus('active');
        }
    }, [eventMenuAddon]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const isEditing = !!eventMenuAddon;
        const url = isEditing ? route('event-menu-addon.update', { id: eventMenuAddon.id }) : route('event-menu-addon.store');
        const method = isEditing ? 'put' : 'post';

        setLoading(true);

        try {
            const res = await axios[method](url, { name, amount, status });

            enqueueSnackbar(eventMenuAddon ? 'Event Menu Addon updated.' : 'Event Menu Addon created.', {
                variant: 'success',
            });

            setName('');
            setAmount(0);
            setStatus('active');
            onSuccess(res.data?.data || { id: eventMenuAddon?.id || Date.now(), name, amount, status });
            handleClose();
        } catch (err) {
            enqueueSnackbar('Failed to save: ' + (err.response?.data?.message || err.message), {
                variant: 'error',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal open={open} onClose={handleClose}>
            <Box
                component="form"
                onSubmit={handleSubmit}
                sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 500,
                    bgcolor: 'background.paper',
                    boxShadow: 24,
                    p: 3,
                    borderRadius: 2,
                }}
            >
                <Typography variant="h6" sx={{ mb: 3 }}>
                    {eventMenuAddon ? 'Edit Event Menu Addon' : 'Add Event Menu Addon'}
                </Typography>

                <TextField fullWidth label="Name of Addon" value={name} onChange={(e) => setName(e.target.value)} required size="small" sx={{ mb: 3 }} />

                <TextField fullWidth label="Charges" inputProps={{ min: 0 }} type="number" placeholder="Enter per day charges" value={amount} onChange={(e) => setAmount(e.target.value)} required size="small" sx={{ mb: 3 }} />

                <FormControl fullWidth size="small" sx={{ mb: 3 }}>
                    <InputLabel>Status</InputLabel>
                    <Select value={status} onChange={(e) => setStatus(e.target.value)} label="Status" required>
                        <MenuItem value="active">Active</MenuItem>
                        <MenuItem value="inactive">Inactive</MenuItem>
                    </Select>
                </FormControl>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                    <Button onClick={handleClose} variant="outlined">
                        Cancel
                    </Button>
                    <Button type="submit" variant="contained" sx={{ backgroundColor: '#0c4b6e' }} disabled={loading}>
                        {loading ? <CircularProgress size={22} sx={{ color: 'white', mr: 1 }} /> : null}
                        {eventMenuAddon ? 'Update' : 'Create'}
                    </Button>
                </Box>
            </Box>
        </Modal>
    );
};

export default AddEventMenuAddonModal;
