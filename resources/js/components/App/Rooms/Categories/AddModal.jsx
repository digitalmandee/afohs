import { useState, useEffect } from 'react';
import { TextField, Button, Typography, Box, Modal, Select, MenuItem, InputLabel, FormControl } from '@mui/material';
import axios from 'axios';
import { enqueueSnackbar } from 'notistack';
import { usePage } from '@inertiajs/react';

const AddRoomCategoryModal = ({ open, handleClose, onSuccess, roomCategory }) => {
    const [name, setName] = useState('');
    const [status, setStatus] = useState('active');
    const { props } = usePage();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (roomCategory) {
            setName(roomCategory.name || '');
            setStatus(roomCategory.status || 'active');
        } else {
            setName('');
            setStatus('active');
        }
    }, [roomCategory]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const isEditing = !!roomCategory;
        const url = isEditing ? route('room-categories.update', { id: roomCategory.id }) : route('room-categories.store');
        const method = isEditing ? 'put' : 'post';

        setLoading(true);

        try {
            const res = await axios[method](url, { name, status });

            enqueueSnackbar(isEditing ? 'Room category updated.' : 'Room category created.', {
                variant: 'success',
            });

            setName('');
            setStatus('active');
            onSuccess(res.data?.data || { id: roomCategory?.id || Date.now(), name, status });
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
                    {roomCategory ? 'Edit Room Category' : 'Add Room Category'}
                </Typography>

                <TextField fullWidth label="Name of Category" value={name} onChange={(e) => setName(e.target.value)} required size="small" sx={{ mb: 3 }} />

                <FormControl fullWidth size="small" sx={{ mb: 3 }}>
                    <InputLabel>Status</InputLabel>
                    <Select value={status} onChange={(e) => setStatus(e.target.value)} label="Status">
                        <MenuItem value="active">Active</MenuItem>
                        <MenuItem value="inactive">Inactive</MenuItem>
                    </Select>
                </FormControl>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                    <Button onClick={handleClose} variant="outlined">
                        Cancel
                    </Button>
                    <Button type="submit" variant="contained" sx={{ backgroundColor: '#0c4b6e' }} disabled={loading}>
                        {roomCategory ? 'Update' : 'Create'}
                    </Button>
                </Box>
            </Box>
        </Modal>
    );
};

export default AddRoomCategoryModal;
