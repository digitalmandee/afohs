import { useEffect, useState } from 'react';
import { TextField, Button, Paper, Typography, Box, IconButton, MenuItem } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { enqueueSnackbar } from 'notistack';


const AddEditSubscriptionCategory = ({ onBack }) => {
    // const [open, setOpen] = useState(true);
    const [loading, setLoading] = useState(false);
    const { props } = usePage();
    const csrfToken = props._token;
    const subscriptionCategory = props.subscriptionCategory ?? null;

    const isEditMode = Boolean(subscriptionCategory);

    const [formData, setFormData] = useState({
        subscription_type_id: '',
        name: '',
        description: '',
        fee: '',
        status: 'active',
    });

    useEffect(() => {
        if (isEditMode) {
            setFormData({
                name: subscriptionCategory.name || '',
                subscription_type_id: subscriptionCategory.subscription_type_id || '',
                description: subscriptionCategory.description || '',
                fee: subscriptionCategory.fee ?? '',
                subscription_fee: subscriptionCategory.subscription_fee ?? '',
                status: subscriptionCategory.status || 'active',
            });
        }
    }, [subscriptionCategory]);

    // Calculate day fee
    const calculateDayFee = (monthlyFee) => {
        if (!monthlyFee || monthlyFee <= 0) return 0;
        return Math.round(monthlyFee / 30); // Round to whole number
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const dataToSubmit = {
            subscription_type_id: formData.subscription_type_id,
            name: formData.name,
            description: formData.description || null,
            fee: parseInt(formData.fee, 10) || 0,
            status: formData.status,
        };

        try {
            setLoading(true);

            if (isEditMode) {
                console.log(route('subscription-categories.update', subscriptionCategory.id));

                await axios.put(route('subscription-categories.update', subscriptionCategory.id), dataToSubmit, {
                    headers: {
                        'X-CSRF-TOKEN': csrfToken,
                    },
                });
                enqueueSnackbar('Subscription category updated successfully.', { variant: 'success' });
            } else {
                await axios.post(route('subscription-categories.store'), dataToSubmit, {
                    headers: {
                        'X-CSRF-TOKEN': csrfToken,
                    },
                });
                enqueueSnackbar('Subscription category created successfully.', { variant: 'success' });
            }

            router.visit(route('subscription-categories.index'));
        } catch (error) {
            enqueueSnackbar('Failed to save subscription category.', { variant: 'error' });
            console.error(error.response?.data);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* <SideNav open={open} setOpen={setOpen} /> */}
            <div
                style={{
                    minHeight: '100vh',
                    backgroundColor: '#f5f5f5',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    width: '100%',
                    // maxWidth: '600px',
                    justifyContent: 'flex-start',
                    mb: 2,
                    mt: 2
                }}>
                    <IconButton onClick={()=>window.history.back()} sx={{ color: '#000' }}>
                        <ArrowBack />
                    </IconButton>
                    <Typography variant="h5" sx={{ ml: 1 }}>
                        {isEditMode ? 'Edit Subscription Category' : 'Add Subscription Category'}
                    </Typography>
                </Box>
                <Paper sx={{ p: 3, maxWidth: '600px', width: '100%' }}>
                    <form onSubmit={handleSubmit}>
                        <Box sx={{ mb: 2 }}>
                            <Typography>Name</Typography>
                            <TextField fullWidth size="small" name="name" value={formData.name} onChange={handleInputChange} required />
                        </Box>
                        <Box sx={{ mb: 2 }}>
                            <Typography>Subscription Type</Typography>
                            <TextField select fullWidth size="small" name="subscription_type_id" value={formData.subscription_type_id} onChange={handleInputChange} required>
                                <MenuItem value="">Select Type</MenuItem>
                                {props.subscriptionTypes?.map((type) => (
                                    <MenuItem key={type.id} value={type.id}>
                                        {type.name}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Box>
                        <Box sx={{ mb: 2 }}>
                            <Typography>Description</Typography>
                            <TextField fullWidth size="small" name="description" value={formData.description} onChange={handleInputChange} multiline rows={2} />
                        </Box>
                        <Box sx={{ mb: 2 }}>
                            <Typography>Monthly Fee</Typography>
                            <TextField fullWidth size="small" name="fee" value={formData.fee} onChange={handleInputChange} type="number" required />
                            <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                                Daily fee will be auto-calculated as: Monthly Fee ÷ 30 days = Rs {calculateDayFee(formData.fee)} per day
                            </Typography>
                        </Box>
                        <Box sx={{ mb: 2 }}>
                            <Typography>Status</Typography>
                            <TextField select fullWidth size="small" name="status" value={formData.status} onChange={handleInputChange}>
                                <MenuItem value="active">Active</MenuItem>
                                <MenuItem value="inactive">Inactive</MenuItem>
                            </TextField>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                            <Button variant="outlined" onClick={onBack}>
                                Cancel
                            </Button>
                            <Button disabled={loading} variant="contained" type="submit" sx={{ backgroundColor: '#0c4b6e', '&:hover': { backgroundColor: '#083854' } }}>
                                {loading ? 'Saving...' : 'Save'}
                            </Button>
                        </Box>
                    </form>
                </Paper>
            </div>
        </>
    );
};

export default AddEditSubscriptionCategory;
