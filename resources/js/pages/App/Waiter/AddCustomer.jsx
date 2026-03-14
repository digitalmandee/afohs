import SideNav from '@/components/App/Sidebar/SideNav';

import { router } from '@inertiajs/react';
import { Add as AddIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { Alert, Box, Button, FormControl, Grid, IconButton, MenuItem, Select, Snackbar, TextField, Typography } from '@mui/material';
import 'bootstrap/dist/css/bootstrap.min.css';
import { enqueueSnackbar } from 'notistack';
import { useEffect, useState } from 'react';
import { routeNameForContext } from '@/lib/utils';

export default function AddWaiter({ users, memberTypes, customer = null }) {
    const drawerWidthOpen = 240;
    const drawerWidthClosed = 110;

    const [open, setOpen] = useState(true);

    const [isEditMode, setIsEditMode] = useState(!!customer);

    const [newCustomer, setNewCustomer] = useState({
        id: customer?.id || null,
        name: customer?.name || '',
        email: customer?.email || '',
        phone_number: customer?.phone_number || '',
        customer_type: customer?.memberType?.name || memberTypes[0]?.name || 'Silver',
        profile_photo: customer?.profile_photo || null,
    });

    const [errors, setErrors] = useState({});

    const [profileImage, setProfileImage] = useState(customer?.profile_photo || null);
    const [phoneCountryCode, setPhoneCountryCode] = useState('+702');

    const handleCloseAddForm = () => {
        setErrors({});
        setIsEditMode(false);
        setNewCustomer({
            id: null,
            name: '',
            email: '',
            phone_number: '',
            customer_type: memberTypes[0]?.name || 'Silver',
            profile_photo: null,
        });
        setProfileImage(null);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewCustomer({
            ...newCustomer,
            [name]: value,
        });
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: null }));
        }
    };

    const handlePhoneCountryCodeChange = (e) => {
        setPhoneCountryCode(e.target.value);
    };

    const handleImageUpload = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfileImage(reader.result);
            };
            reader.readAsDataURL(file);
            if (errors.profile_photo) {
                setErrors((prev) => ({ ...prev, profile_photo: null }));
            }
        }
    };

    const handleDeleteImage = () => {
        setProfileImage(null);
    };

    const handleSaveCustomer = () => {
        // Clear previous errors
        const newErrors = {};

        // Client-side validation for required fields
        if (!newCustomer.name) newErrors.name = 'Waiter Name is required.';
        if (!newCustomer.email) newErrors.email = 'Email is required.';
        if (!newCustomer.phone_number) newErrors.phone = 'Phone Number is required.';
        if (!newCustomer.customer_type) newErrors.customer_type = 'Customer Type is required.';

        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (newCustomer.email && !emailRegex.test(newCustomer.email)) {
            newErrors.email = 'Email is not valid.';
        }

        // Phone number format validation (digits only, min 7 digits)
        // const phoneRegex = /^\d{7,}$/;
        // if (newCustomer.phone_number && !phoneRegex.test(newCustomer.phone_number)) {
        //     newErrors.phone = 'Phone number must be at least 7 digits.';
        // }

        // Profile image validation (only if uploading a file object, not base64 string)
        // Assuming profileImage is base64, so skipping file validations here.
        // You can add this if you handle File object elsewhere.

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            enqueueSnackbar('Please fix the errors before submitting.', { variant: 'error' });
            return; // Don't proceed if errors exist
        }

        const method = isEditMode ? 'put' : 'post';
        const url = isEditMode
            ? route(routeNameForContext('waiters.update'), { id: newCustomer.id })
            : route(routeNameForContext('waiters.store'));

        const payload = {
            _method: method,
            ...newCustomer,
            phone: `${phoneCountryCode}-${newCustomer.phone_number}`,
        };

        router.post(url, payload, {
            forceFormData: true,
            onSuccess: () => {
                enqueueSnackbar(isEditMode ? 'Waiter updated successfully!' : 'Waiter added successfully!', { variant: 'success' });
                handleCloseAddForm();
                router.visit(route(routeNameForContext('waiters.index')));
            },
            onError: (errors) => {
                setErrors(errors);
            },
        });
    };

    const lastUserId = users.data.length > 0 ? parseInt(users.data[0].user_id) : 0;
    const newMemberId = lastUserId + 1;

    return (
        <>
            <SideNav open={open} setOpen={setOpen} />
            <div
                style={{
                    marginLeft: open ? `${drawerWidthOpen}px` : `${drawerWidthClosed}px`,
                    transition: 'margin-left 0.3s ease-in-out',
                    marginTop: '5rem',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                    <IconButton onClick={() => router.visit(route(routeNameForContext('waiters.index')))}>
                        <ArrowBackIcon />
                    </IconButton>
                    <Typography variant="h6" style={{ marginLeft: '10px' }}>
                        {isEditMode ? 'Edit Waiter Information' : 'Add Waiter Information'}
                    </Typography>
                </div>
                <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '5px' }}>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <Box sx={{ p: 2, backgroundColor: '#F6F6F6', border: '1px solid #e0e0e0', borderRadius: '4px', mb: 2 }}>
                                <Typography variant="body1">
                                    Member Id: <strong>MEMBER{newMemberId}</strong>
                                </Typography>
                            </Box>
                            <Box style={{ display: 'flex', gap: '10px' }}>
                                <Box sx={{ mb: 2 }}>
                                    {profileImage ? (
                                        <div style={{ position: 'relative', width: '150px', height: '150px' }}>
                                            <img src={profileImage} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }} />
                                        </div>
                                    ) : (
                                        <Box>
                                            <input accept="image/*" style={{ display: 'none' }} id="profile-image-upload-add" type="file" onChange={handleImageUpload} />
                                            <label htmlFor="profile-image-upload-add">
                                                <AddIcon
                                                    sx={{
                                                        p: 2,
                                                        border: '1px dashed #1976d2',
                                                        borderRadius: '4px',
                                                        height: '80px',
                                                        width: '80px',
                                                        cursor: 'pointer',
                                                    }}
                                                    color="primary"
                                                />
                                            </label>
                                        </Box>
                                    )}
                                    {errors.profile_photo && (
                                        <Typography color="error" variant="caption">
                                            {errors.profile_photo}
                                        </Typography>
                                    )}
                                </Box>
                                <Box style={{ display: 'flex', flexDirection: 'column' }}>
                                    {(isEditMode || profileImage) && (
                                        <div style={{ display: 'flex', gap: '5px', padding: '5px' }}>
                                            <label htmlFor="profile-image-upload-edit">
                                                <Button size="small" sx={{ minWidth: 'auto', fontSize: '14px' }} component="span">
                                                    Choose Photo
                                                </Button>
                                            </label>
                                            <input accept="image/*" style={{ display: 'none' }} id="profile-image-upload-edit" type="file" onChange={handleImageUpload} />
                                            <Button size="small" color="error" onClick={handleDeleteImage} sx={{ minWidth: 'auto', fontSize: '14px' }}>
                                                Delete
                                            </Button>
                                        </div>
                                    )}
                                    {!isEditMode && (
                                        <Typography variant="body2" sx={{ mt: 1 }}>
                                            Profile Picture
                                        </Typography>
                                    )}
                                    <Typography variant="caption" color="textSecondary">
                                        Click upload to change profile picture (4 MB max)
                                    </Typography>
                                </Box>
                            </Box>

                            {errors.customer_type && (
                                <Typography color="error" variant="caption">
                                    {errors.customer_type}
                                </Typography>
                            )}
                            <Typography variant="subtitle1" sx={{ mb: 1 }}>
                                Waiter Name
                            </Typography>
                            <TextField fullWidth placeholder="e.g. Dianne Russell" name="name" value={newCustomer.name} onChange={handleInputChange} margin="normal" variant="outlined" sx={{ mb: 2 }} error={!!errors.name} helperText={errors.name} />
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle1" sx={{ mb: 1 }}>
                                        Email
                                    </Typography>
                                    <TextField fullWidth placeholder="e.g. dianne.russell@gmail.com" name="email" value={newCustomer.email} onChange={handleInputChange} margin="normal" variant="outlined" error={!!errors.email} helperText={errors.email} />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle1" sx={{ mb: 1 }}>
                                        Phone Number
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <FormControl variant="outlined" margin="normal" sx={{ minWidth: '90px' }}>
                                            <Select value={phoneCountryCode} onChange={handlePhoneCountryCodeChange}>
                                                <MenuItem value="+702">+702</MenuItem>
                                                <MenuItem value="+1">+1</MenuItem>
                                                <MenuItem value="+44">+44</MenuItem>
                                                <MenuItem value="+91">+91</MenuItem>
                                            </Select>
                                        </FormControl>
                                        <TextField fullWidth placeholder="e.g. 123 456 7890" name="phone_number" value={newCustomer.phone_number} onChange={handleInputChange} margin="normal" variant="outlined" error={!!errors.phone} helperText={errors.phone} />
                                    </Box>
                                </Grid>
                            </Grid>
                        </Grid>
                        <Grid item xs={12}>
                            <Box sx={{ display: 'flex', justifyContent: 'flex-start', mt: 0 }}>
                                <Button variant="contained" onClick={handleSaveCustomer} sx={{ backgroundColor: '#063455' }}>
                                    {isEditMode ? 'Save Changes' : 'Save'}
                                </Button>
                            </Box>
                        </Grid>
                    </Grid>
                </div>
            </div>
        </>
    );
}
AddWaiter.layout = (page) => page;
