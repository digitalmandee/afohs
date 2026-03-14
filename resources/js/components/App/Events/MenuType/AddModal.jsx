import { useState, useEffect } from 'react';
import { TextField, Button, Typography, Box, Modal, CircularProgress, MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import axios from 'axios';
import { enqueueSnackbar } from 'notistack';
import { usePage } from '@inertiajs/react';

const AddEventMenuTypeModal = ({ open, handleClose, onSuccess, eventMenuType }) => {
    const [name, setName] = useState('');
    const [status, setStatus] = useState('active'); //
    const { props } = usePage();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (eventMenuType) {
            setName(eventMenuType.name || '');
            setStatus(eventMenuType.status || 'active'); //  status if editing
        } else {
            setName('');
            setStatus('active');
        }
    }, [eventMenuType]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const isEditing = !!eventMenuType;
        const url = isEditing ? route('event-menu-type.update', { id: eventMenuType.id }) : route('event-menu-type.store');
        const method = isEditing ? 'put' : 'post';

        setLoading(true);

        try {
            const res = await axios[method](url, { name, status });

            enqueueSnackbar(eventMenuType ? 'Event Menu Type updated.' : 'Event Menu Type created.', {
                variant: 'success',
            });

            setName('');
            setStatus('active');
            onSuccess(res.data?.data || { id: eventMenuType?.id || Date.now(), name, status });
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
                    {eventMenuType ? 'Edit Event Menu Type' : 'Add Event Menu Type'}
                </Typography>

                <TextField fullWidth label="Name of Type" value={name} onChange={(e) => setName(e.target.value)} required size="small" sx={{ mb: 3 }} />

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
                        {eventMenuType ? 'Update' : 'Create'}
                    </Button>
                </Box>
            </Box>
        </Modal>
    );
};

export default AddEventMenuTypeModal;
