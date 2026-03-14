import { useEffect, useState } from 'react';
import { TextField, Button, Paper, Typography, Box, IconButton, MenuItem, FormControlLabel, Checkbox, FormControl, FormLabel, FormGroup } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { enqueueSnackbar } from 'notistack';

// Available category types - add new types here in the future
const AVAILABLE_TYPES = [
    { value: 'primary', label: 'Primary' },
    { value: 'corporate', label: 'Corporate' },
];

const AddEditMembershipCategory = ({ onBack }) => {
    const [loading, setLoading] = useState(false);
    const { props } = usePage();
    const csrfToken = props._token;
    const memberCategory = props.memberCategory ?? null;

    const isEditMode = Boolean(memberCategory);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        fee: '',
        subscription_fee: '',
        status: 'active',
        category_types: ['primary'], // Default selection
    });

    useEffect(() => {
        if (isEditMode) {
            setFormData({
                name: memberCategory.name || '',
                description: memberCategory.description || '',
                fee: memberCategory.fee ?? '',
                subscription_fee: memberCategory.subscription_fee ?? '',
                status: memberCategory.status || 'active',
                category_types: memberCategory.category_types || ['primary'],
            });
        }
    }, [memberCategory]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleCheckboxChange = (typeValue) => {
        setFormData((prev) => {
            const currentTypes = prev.category_types || [];
            if (currentTypes.includes(typeValue)) {
                // Remove type
                return { ...prev, category_types: currentTypes.filter((t) => t !== typeValue) };
            } else {
                // Add type
                return { ...prev, category_types: [...currentTypes, typeValue] };
            }
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate at least one type is selected
        if (!formData.category_types || formData.category_types.length === 0) {
            enqueueSnackbar('Please select at least one category type.', { variant: 'warning' });
            return;
        }

        const dataToSubmit = {
            name: formData.name,
            description: formData.description || null,
            fee: formData.fee ? parseInt(formData.fee, 10) : 0,
            subscription_fee: formData.subscription_fee ? parseInt(formData.subscription_fee, 10) : 0,
            status: formData.status,
            category_types: formData.category_types,
        };

        try {
            setLoading(true);

            if (isEditMode) {
                await axios.put(route('member-categories.update', memberCategory.id), dataToSubmit, {
                    headers: {
                        'X-CSRF-TOKEN': csrfToken,
                    },
                });
                enqueueSnackbar('Membership category updated successfully.', { variant: 'success' });
            } else {
                await axios.post(route('member-categories.store'), dataToSubmit, {
                    headers: {
                        'X-CSRF-TOKEN': csrfToken,
                    },
                });
                enqueueSnackbar('Membership category created successfully.', { variant: 'success' });
            }

            router.visit(route('member-categories.index'));
        } catch (error) {
            enqueueSnackbar('Failed to save membership category.', { variant: 'error' });
            console.error(error.response?.data);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div
                style={{
                    minHeight: '100vh',
                    backgroundColor: '#f5f5f5',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    paddingTop: '1rem',
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        width: '100%',
                        justifyContent: 'flex-start',
                        ml: 4,
                        mb: 2,
                    }}
                >
                    <IconButton onClick={() => window.history.back()} sx={{ color: '#000' }}>
                        <ArrowBack />
                    </IconButton>
                    <Typography variant="h5">{isEditMode ? 'Edit Membership Category' : 'Add Membership Category'}</Typography>
                </Box>
                <Paper sx={{ p: 3, maxWidth: '600px', width: '100%' }}>
                    <form onSubmit={handleSubmit}>
                        <Box sx={{ mb: 2 }}>
                            <Typography>Name</Typography>
                            <TextField fullWidth size="small" name="name" value={formData.name} onChange={handleInputChange} required />
                        </Box>
                        <Box sx={{ mb: 2 }}>
                            <Typography>Description</Typography>
                            <TextField fullWidth size="small" name="description" value={formData.description} onChange={handleInputChange} multiline rows={2} />
                        </Box>
                        <Box sx={{ mb: 2 }}>
                            <Typography>Fee</Typography>
                            <TextField fullWidth size="small" name="fee" value={formData.fee} onChange={handleInputChange} type="number" required />
                        </Box>
                        <Box sx={{ mb: 2 }}>
                            <Typography>Maintenance Fee</Typography>
                            <TextField fullWidth size="small" name="subscription_fee" value={formData.subscription_fee} onChange={handleInputChange} type="number" required />
                        </Box>
                        <Box sx={{ mb: 2 }}>
                            <Typography>Status</Typography>
                            <TextField select fullWidth size="small" name="status" value={formData.status} onChange={handleInputChange}>
                                <MenuItem value="active">Active</MenuItem>
                                <MenuItem value="inactive">Inactive</MenuItem>
                            </TextField>
                        </Box>
                        <Box sx={{ mb: 2 }}>
                            <FormControl component="fieldset">
                                <FormLabel component="legend" sx={{ color: '#000', fontWeight: 500, mb: 1 }}>
                                    Category Type (select at least one)
                                </FormLabel>
                                <FormGroup row>
                                    {AVAILABLE_TYPES.map((type) => (
                                        <FormControlLabel key={type.value} control={<Checkbox checked={formData.category_types?.includes(type.value) || false} onChange={() => handleCheckboxChange(type.value)} />} label={type.label} />
                                    ))}
                                </FormGroup>
                            </FormControl>
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

export default AddEditMembershipCategory;
