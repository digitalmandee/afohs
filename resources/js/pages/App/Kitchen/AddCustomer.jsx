import SideNav from '@/components/App/SideBar/SideNav';
import { router } from '@inertiajs/react';
import { Add as AddIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { Alert, Box, Button, Chip, CircularProgress, FormControl, Grid, IconButton, MenuItem, Paper, Select, Stack, TextField, Typography } from '@mui/material';
import 'bootstrap/dist/css/bootstrap.min.css';
import { enqueueSnackbar } from 'notistack';
import axios from 'axios';
import { useState, useEffect } from 'react';
import { routeNameForContext } from '@/lib/utils';

const drawerWidthOpen = 240;
const drawerWidthClosed = 110;

export default function AddKitchen({ userNo, customer = null, printerProfiles = [] }) {
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
        printer_profile_id: customer?.kitchen_detail?.printer_profile_id || '',
    });

    const [errors, setErrors] = useState({});
    const [profileImage, setProfileImage] = useState(customer?.profile_photo || null);
    const [discoveredPrinters, setDiscoveredPrinters] = useState([]);
    const [scanLoading, setScanLoading] = useState(false);
    const [testingSavedPrinter, setTestingSavedPrinter] = useState(false);
    const [testingCandidateId, setTestingCandidateId] = useState(null);
    const [printerMessage, setPrinterMessage] = useState(null);

    const handleCloseAddForm = () => {
        setErrors({});
        setIsEditMode(false);
        setNewCustomer({
            id: null,
            name: '',
            email: '',
            phone_number: '',
            profile_photo: null,
            printer_profile_id: '',
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

    const navigateBack = () => {
        window.history.back();
    };

    const scanPrinters = async () => {
        setScanLoading(true);
        setPrinterMessage(null);
        try {
            const response = await axios.get(route(routeNameForContext('printers.discover')));
            const printers = (response.data?.printers || []).filter((printer) => printer.source === 'network_scan');
            setDiscoveredPrinters(printers);
            setPrinterMessage({
                type: 'success',
                text: printers.length ? 'Printer discovery completed. Choose a printer to assign to this kitchen.' : 'No network or system printers were found from the current scan.',
            });
        } catch (error) {
            setDiscoveredPrinters([]);
            setPrinterMessage({
                type: 'error',
                text: error.response?.data?.message || 'Printer scan failed.',
            });
        } finally {
            setScanLoading(false);
        }
    };

    const assignPrinterToThisKitchen = (printer) => {
        setPrinterMessage({
            type: 'info',
            text: `Scanned ${printer.label || printer.printer_ip}. Create a saved printer profile in Printer Management first, then assign that profile here.`,
        });
    };

    const testSavedPrinter = async () => {
        if (!isEditMode || !newCustomer.id) {
            return;
        }

        setTestingSavedPrinter(true);
        setPrinterMessage(null);
        try {
            const response = await axios.post(route(routeNameForContext('printers.test-kitchen')), {
                kitchen_id: newCustomer.id,
            });
            setPrinterMessage({
                type: 'success',
                text: response.data?.message || 'Kitchen test print sent successfully.',
            });
        } catch (error) {
            setPrinterMessage({
                type: 'error',
                text: error.response?.data?.message || 'Kitchen test print failed.',
            });
        } finally {
            setTestingSavedPrinter(false);
        }
    };

    const testCandidatePrinter = async (printer) => {
        setTestingCandidateId(printer.id);
        setPrinterMessage(null);
        try {
            const response = await axios.post(route(routeNameForContext('printer.test')), {
                printer_source: printer.source,
                printer_ip: printer.printer_ip || null,
                printer_port: printer.printer_port ? Number(printer.printer_port) || 9100 : null,
                printer_name: printer.printer_name || null,
                printer_connector: printer.printer_connector || null,
            });
            setPrinterMessage({
                type: 'success',
                text: response.data?.message || 'Printer test sent successfully.',
            });
        } catch (error) {
            setPrinterMessage({
                type: 'error',
                text: error.response?.data?.message || 'Printer test failed.',
            });
        } finally {
            setTestingCandidateId(null);
        }
    };

    const handleSaveCustomer = () => {
        // Clear previous errors
        const newErrors = {};

        // Client-side validation for required fields
        if (!newCustomer.name) newErrors.name = 'Kitchen Name is required.';
        if (!newCustomer.email) newErrors.email = 'Email is required.';
        if (!newCustomer.phone_number) newErrors.phone = 'Phone Number is required.';
        if (!newCustomer.printer_profile_id) newErrors.printer_profile_id = 'Printer profile is required.';

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
                navigateBack();
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
                    <IconButton onClick={navigateBack}>
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

                                <Grid item xs={12}>
                                    <Box sx={{ p: 2.5, border: '1px solid #e5e7eb', borderRadius: 3, backgroundColor: '#f8fbff' }}>
                                        <Stack spacing={2}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 1.5, flexWrap: 'wrap' }}>
                                                <Box>
                                                    <Typography variant="h6" sx={{ color: '#063455', fontWeight: 700 }}>
                                                        Printer Configuration
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        This kitchen should be linked to one saved network printer profile from Printer Management.
                                                    </Typography>
                                                </Box>
                                                <Chip
                                                    label={newCustomer.printer_profile_id ? 'Configured' : 'Not Configured'}
                                                    color={newCustomer.printer_profile_id ? 'success' : 'default'}
                                                    variant={newCustomer.printer_profile_id ? 'filled' : 'outlined'}
                                                />
                                            </Box>

                                            {printerMessage ? (
                                                <Alert severity={printerMessage.type}>
                                                    {printerMessage.text}
                                                </Alert>
                                            ) : null}

                                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25}>
                                                <Button variant="outlined" onClick={scanPrinters} disabled={scanLoading}>
                                                    {scanLoading ? 'Scanning...' : 'Scan Printers'}
                                                </Button>
                                                {isEditMode ? (
                                                    <Button variant="outlined" onClick={testSavedPrinter} disabled={testingSavedPrinter || !newCustomer.printer_profile_id}>
                                                        {testingSavedPrinter ? 'Testing Saved Printer...' : 'Test Assigned Printer'}
                                                    </Button>
                                                ) : null}
                                            </Stack>

                                            <Grid container spacing={2}>
                                                <Grid item xs={12}>
                                                    <Typography variant="subtitle1" sx={{ mb: 1 }}>
                                                        Assigned Printer Profile
                                                    </Typography>
                                                    <TextField
                                                        select
                                                        fullWidth
                                                        name="printer_profile_id"
                                                        value={newCustomer.printer_profile_id}
                                                        onChange={handleInputChange}
                                                        margin="normal"
                                                        variant="outlined"
                                                        error={!!errors.printer_profile_id}
                                                        helperText={errors.printer_profile_id || 'Create and manage profiles in Printer Management, then assign one here.'}
                                                    >
                                                        <MenuItem value="">Select Printer Profile</MenuItem>
                                                        {printerProfiles.map((profile) => (
                                                            <MenuItem key={profile.id} value={profile.id}>
                                                                {profile.name} ({profile.printer_ip}:{profile.printer_port})
                                                            </MenuItem>
                                                        ))}
                                                    </TextField>
                                                </Grid>
                                            </Grid>

                                            <Box>
                                                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                                                    Discovered Printers
                                                </Typography>
                                                {discoveredPrinters.length === 0 ? (
                                                    <Alert severity="info">
                                                        No printers scanned yet. Use Scan Printers to discover network printers and system-installed printer queues for this kitchen profile.
                                                    </Alert>
                                                ) : (
                                                    <Stack spacing={1.25}>
                                                        {discoveredPrinters.map((printer) => (
                                                            <Paper key={printer.id} variant="outlined" sx={{ p: 1.5, borderRadius: 2.5 }}>
                                                                <Grid container spacing={1.5} alignItems="center">
                                                                    <Grid item xs={12} md={4}>
                                                                        <Typography sx={{ fontWeight: 700 }}>
                                                                            {printer.label}
                                                                        </Typography>
                                                                        <Typography variant="body2" color="text.secondary">
                                                                            {printer.printer_ip}:{printer.printer_port}
                                                                        </Typography>
                                                                    </Grid>
                                                                    <Grid item xs={12} md={3}>
                                                                        <Chip
                                                                            label={printer.assignment_label || 'Discovered network printer'}
                                                                            color={
                                                                                printer.status === 'assigned_to_kitchen'
                                                                                    ? 'success'
                                                                                    : printer.status === 'assigned_as_receipt'
                                                                                        ? 'info'
                                                                                        : 'default'
                                                                            }
                                                                            size="small"
                                                                            variant={printer.status === 'found' ? 'outlined' : 'filled'}
                                                                        />
                                                                    </Grid>
                                                                    <Grid item xs={12} md={5}>
                                                                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                                                                            <Button variant="outlined" onClick={() => assignPrinterToThisKitchen(printer)}>
                                                                                Assign to This Kitchen
                                                                            </Button>
                                                                            <Button
                                                                                variant="contained"
                                                                                onClick={() => testCandidatePrinter(printer)}
                                                                                disabled={testingCandidateId === printer.id}
                                                                            >
                                                                                {testingCandidateId === printer.id ? <CircularProgress size={18} /> : 'Test'}
                                                                            </Button>
                                                                        </Stack>
                                                                    </Grid>
                                                                </Grid>
                                                            </Paper>
                                                        ))}
                                                    </Stack>
                                                )}
                                            </Box>
                                        </Stack>
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
AddKitchen.layout = (page) => page;
