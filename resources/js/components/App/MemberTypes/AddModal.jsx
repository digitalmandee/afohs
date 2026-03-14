import { useState, useEffect } from 'react';
import { TextField, Button, Typography, Box, Modal, CircularProgress } from '@mui/material';
import axios from 'axios';
import { enqueueSnackbar } from 'notistack';
import { usePage } from '@inertiajs/react';

const AddMemberModal = ({ open, handleClose, onSuccess, memberType }) => {
    const [name, setName] = useState('');
    const { props } = usePage();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (memberType) {
            setName(memberType.name || '');
        } else {
            setName('');
        }
    }, [memberType]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const url = memberType ? route('member-types.update2', { id: memberType.id }) : route('member-types.store');

        setLoading(true);

        try {
            const res = await axios.post(url, { name });

            enqueueSnackbar(memberType ? 'Member Type updated.' : 'Member Type created.', {
                variant: 'success',
            });
            setName('');

            onSuccess(res.data?.data || { id: memberType?.id || Date.now(), name });
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
                    {memberType ? 'Edit Member Type' : 'Add Member Type'}
                </Typography>

                <TextField fullWidth label="Name of Type" value={name} onChange={(e) => setName(e.target.value)} required size="small" sx={{ mb: 3 }} />

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                    <Button onClick={handleClose} variant="outlined">
                        Cancel
                    </Button>
                    <Button type="submit" variant="contained" sx={{ backgroundColor: '#0c4b6e' }} disabled={loading} loading={loading} loadingPosition="start">
                        {memberType ? 'Update' : 'Create'}
                    </Button>
                </Box>
            </Box>
        </Modal>
    );
};

export default AddMemberModal;
