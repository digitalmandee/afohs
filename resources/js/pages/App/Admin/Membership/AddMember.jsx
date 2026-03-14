import { useState } from 'react';
import { TextField, Button, Typography, Box, Modal, Paper } from '@mui/material';
import axios from 'axios';
import { enqueueSnackbar } from 'notistack';
import { usePage } from '@inertiajs/react';

const AddMemberModal = ({ open, handleClose, onSuccess }) => {
    const [name, setName] = useState('');
    const { props } = usePage();
    const csrfToken = props._token;

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const res = await axios.post(
                route('member-types.store'),
                { name },
                {
                    headers: { 'X-CSRF-TOKEN': csrfToken },
                },
            );

            enqueueSnackbar('Member Type created successfully.', { variant: 'success' });
            setName('');
            handleClose();
            if (onSuccess) onSuccess(res.data?.data || { id: Date.now(), name });
        } catch (error) {
            console.error('Failed to save:', error.response?.data);
            enqueueSnackbar('Failed to create Member Type: ' + (error.response?.data?.message || error.message), { variant: 'error' });
        }
    };

    return (
        <Modal open={open} onClose={handleClose}>
            <Box
                sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 400,
                    bgcolor: 'background.paper',
                    boxShadow: 24,
                    p: 4,
                    borderRadius: 2,
                }}
            >
                <Typography variant="h6" sx={{ mb: 2 }}>
                    Add Membership Type
                </Typography>
                <form onSubmit={handleSubmit}>
                    <Box sx={{ mb: 2 }}>
                        <TextField fullWidth variant="outlined" placeholder="e.g. Affiliated" label="Name of Type" size="small" name="name" value={name} onChange={(e) => setName(e.target.value)} required />
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
                        <Button variant="outlined" onClick={handleClose}>
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            type="submit"
                            sx={{
                                textTransform: 'none',
                                backgroundColor: '#0c4b6e',
                                '&:hover': { backgroundColor: '#083854' },
                            }}
                        >
                            Create
                        </Button>
                    </Box>
                </form>
            </Box>
        </Modal>
    );
};

export default AddMemberModal;
