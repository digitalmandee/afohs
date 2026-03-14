import { useState, useEffect } from 'react';
import { TextField, Button, Typography, Box, Modal, CircularProgress, MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import axios from 'axios';
import { enqueueSnackbar } from 'notistack';
import { usePage } from '@inertiajs/react';

const AddEventMenuCategoryModal = ({ open, handleClose, onSuccess, eventMenuCategory }) => {
    const [name, setName] = useState('');
    const [status, setStatus] = useState('active'); // ✅ Add status
    const { props } = usePage();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (eventMenuCategory) {
            setName(eventMenuCategory.name || '');
            setStatus(eventMenuCategory.status || 'active'); // ✅ prefill status if editing
        } else {
            setName('');
            setStatus('active');
        }
    }, [eventMenuCategory]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const isEditing = !!eventMenuCategory;
        const url = isEditing ? route('event-menu-category.update', { id: eventMenuCategory.id }) : route('event-menu-category.store');
        const method = isEditing ? 'put' : 'post';

        setLoading(true);

        try {
            const res = await axios[method](url, { name, status });

            enqueueSnackbar(eventMenuCategory ? 'Event Menu Category updated.' : 'Event Menu Category created.', {
                variant: 'success',
            });

            setName('');
            setStatus('active');
            onSuccess(res.data?.data || { id: eventMenuCategory?.id || Date.now(), name, status });
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
                    {eventMenuCategory ? 'Edit Event Menu Category' : 'Add Event Menu Category'}
                </Typography>

                <TextField fullWidth label="Name of Category" value={name} onChange={(e) => setName(e.target.value)} required size="small" sx={{ mb: 3 }} />

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
                        {eventMenuCategory ? 'Update' : 'Create'}
                    </Button>
                </Box>
            </Box>
        </Modal>
    );
};

export default AddEventMenuCategoryModal;
