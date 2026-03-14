import SideNav from '@/components/App/SideBar/SideNav';
import { router } from '@inertiajs/react';
import { Add as AddIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { Box, Button, FormControl, Grid, IconButton, MenuItem, Select, TextField, Typography } from '@mui/material';
import 'bootstrap/dist/css/bootstrap.min.css';
import { enqueueSnackbar } from 'notistack';
import { useState, useEffect } from 'react';

const drawerWidthOpen = 240;
const drawerWidthClosed = 110;

export default function AddKitchen({ userNo, customer = null }) {
    const phoneNumber = customer?.phone_number || '';
    const [phoneCountryCodeFromData, phoneNumberWithoutCode] = phoneNumber.includes('-') ? phoneNumber.split('-') : [phoneNumber.match(/^\+\d+/)?.[0] || '+702', phoneNumber.replace(/^\+\d+/, '').trim()];

    const [open, setOpen] = useState(true);
    const [isEditMode, setIsEditMode] = useState(!!customer);
    const [phoneCountryCode, setPhoneCountryCode] = useState(phoneCountryCodeFromData);

    const [newCustomer, setNewCustomer] = useState({
        id: customer?.id || null,
        name: customer?.name || '',
        email: customer?.email || '',
        phone_number: phoneNumberWithoutCode || '',
        profile_photo: customer?.profile_photo || null,
        printer_ip: customer?.kitchen_detail?.printer_ip || '',
        printer_port: customer?.kitchen_detail?.printer_port || '',
    });

    const [errors, setErrors] = useState({});
    const [profileImage, setProfileImage] = useState(customer?.profile_photo || null);

    const handleCloseAddForm = () => {
        setErrors({});
        setIsEditMode(false);
        setNewCustomer({
            id: null,
            name: '',
            email: '',
            phone_number: '',
            profile_photo: null,
            printer_ip: '',
            printer_port: '',
        });
        setProfileImage(null);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewCustomer((prev) => ({
            ...prev,
            [name]: value,
        }));
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
            setNewCustomer((prev) => ({
                ...prev,
                profile_photo: file,
            }));
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
        if (!newCustomer.name) newErrors.name = 'Kitchen Name is required.';
        if (!newCustomer.email) newErrors.email = 'Email is required.';
        if (!newCustomer.phone_number) newErrors.phone = 'Phone Number is required.';
        if (!newCustomer.printer_ip) newErrors.printer_ip = 'Printer IP is required.';
        if (!newCustomer.printer_port) newErrors.printer_port = 'Printer Port is required.';

        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (newCustomer.email && !emailRegex.test(newCustomer.email)) {
            newErrors.email = 'Email is not valid.';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return; // Don't proceed if errors exist
        }

        const method = isEditMode ? 'put' : 'post';
        const url = isEditMode ? route('kitchens.update', { id: newCustomer.id }) : route('kitchens.store');

        const payload = {
            _method: method,
            ...newCustomer,
            phone: `${phoneCountryCode}-${newCustomer.phone_number}`,
        };

        router.post(url, payload, {
            forceFormData: true,
            onSuccess: () => {
                enqueueSnackbar(isEditMode ? 'Kitchen updated successfully!' : 'Kitchen added successfully!', { variant: 'success' });
                handleCloseAddForm();
                router.visit(route('kitchens.index'));
            },
            onError: (errors) => {
                setErrors(errors);
                // No snackbar here to avoid popup for validation errors
            },
        });
    };

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
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
                    <IconButton onClick={() => router.visit(route('kitchens.index'))}>
                        <ArrowBackIcon />
                    </IconButton>
                    <Typography variant="h6" sx={{ ml: 1 }}>
                        {isEditMode ? 'Edit Kitchen Information' : 'Add Kitchen Information'}
                    </Typography>
                </div>

                <div style={{ backgroundColor: 'white', padding: 20, borderRadius: 5 }}>
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <Box sx={{ p: 2, backgroundColor: '#F6F6F6', border: '1px solid #e0e0e0', borderRadius: 1, mb: 2 }}>
                                <Typography variant="body1">
                                    Member Id: <strong>#{userNo}</strong>
                                </Typography>
                            </Box>

                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <Box sx={{ mb: 2 }}>
                                    {profileImage ? (
                                        <div style={{ position: 'relative', width: 150, height: 150 }}>
                                            <img src={profileImage} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 4 }} />
                                        </div>
                                    ) : (
                                        <Box>
                                            <input accept="image/*" style={{ display: 'none' }} id="profile-image-upload-add" type="file" onChange={handleImageUpload} />
                                            <label htmlFor="profile-image-upload-add">
                                                <AddIcon
                                                    sx={{
                                                        p: 2,
                                                        border: '1px dashed #1976d2',
                                                        borderRadius: 1,
                                                        height: 80,
                                                        width: 80,
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

                                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                    {(isEditMode || profileImage) && (
                                        <Box sx={{ display: 'flex', gap: 1, p: 1 }}>
                                            <label htmlFor="profile-image-upload-edit">
                                                <Button size="small" sx={{ minWidth: 'auto', fontSize: 14 }} component="span">
                                                    Choose Photo
                                                </Button>
                                            </label>
                                            <input accept="image/*" style={{ display: 'none' }} id="profile-image-upload-edit" type="file" onChange={handleImageUpload} />
                                            <Button size="small" color="error" onClick={handleDeleteImage} sx={{ minWidth: 'auto', fontSize: 14 }}>
                                                Delete
                                            </Button>
                                        </Box>
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

                            <Typography variant="subtitle1" sx={{ mt: 3, mb: 1 }}>
                                Kitchen Name
                            </Typography>
                            <TextField fullWidth placeholder="e.g. Dianne Russell" name="name" value={newCustomer.name} onChange={handleInputChange} margin="normal" variant="outlined" error={!!errors.name} helperText={errors.name} />

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
                                        <FormControl variant="outlined" margin="normal" sx={{ minWidth: 90 }}>
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

                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle1" sx={{ mb: 1 }}>
                                        Printer IP
                                    </Typography>
                                    <TextField fullWidth placeholder="e.g. 192.168.1.100" name="printer_ip" value={newCustomer.printer_ip} onChange={handleInputChange} margin="normal" variant="outlined" error={!!errors.printer_ip} helperText={errors.printer_ip} />
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle1" sx={{ mb: 1 }}>
                                        Printer Port
                                    </Typography>
                                    <TextField fullWidth placeholder="e.g. 9100" name="printer_port" value={newCustomer.printer_port} onChange={handleInputChange} margin="normal" variant="outlined" error={!!errors.printer_port} helperText={errors.printer_port} />
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
AddKitchen.layout = (page) => page;