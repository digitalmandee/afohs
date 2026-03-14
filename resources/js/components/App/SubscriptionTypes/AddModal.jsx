import { useState, useEffect } from 'react';
import { TextField, Button, Typography, Box, Modal, CircularProgress } from '@mui/material';
import axios from 'axios';
import { enqueueSnackbar } from 'notistack';
import { usePage } from '@inertiajs/react';

const AddSubscriptionModal = ({ open, handleClose, onSuccess, subscriptionType }) => {
    const [name, setName] = useState('');
    const { props } = usePage();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (subscriptionType) {
            setName(subscriptionType.name || '');
        } else {
            setName('');
        }
    }, [subscriptionType]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const url = subscriptionType ? route('subscription-types.update2', { id: subscriptionType.id }) : route('subscription-types.store');

        setLoading(true);

        try {
            const res = await axios.post(url, { name });

            enqueueSnackbar(subscriptionType ? 'Subscription Type updated.' : 'Subscription Type created.', {
                variant: 'success',
            });
            setName('');

            onSuccess(res.data?.data || { id: subscriptionType?.id || Date.now(), name });
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
                    {subscriptionType ? 'Edit Subscription Type' : 'Add Subscription Type'}
                </Typography>

                <TextField fullWidth label="Name of Type" value={name} onChange={(e) => setName(e.target.value)} required size="small" sx={{ mb: 3 }} />

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                    <Button onClick={handleClose} variant="outlined">
                        Cancel
                    </Button>
                    <Button type="submit" variant="contained" sx={{ backgroundColor: '#0c4b6e' }} disabled={loading} loading={loading} loadingPosition="start">
                        {subscriptionType ? 'Update' : 'Create'}
                    </Button>
                </Box>
            </Box>
        </Modal>
    );
};

export default AddSubscriptionModal;
