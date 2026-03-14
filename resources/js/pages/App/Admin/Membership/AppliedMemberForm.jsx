import { useEffect, useState } from 'react';
import { TextField, Button, Paper, Grid, Typography, Box, IconButton, Checkbox, FormControlLabel } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { enqueueSnackbar } from 'notistack';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

dayjs.extend(customParseFormat);

// const drawerWidthOpen = 240;
// const drawerWidthClosed = 110;

export default function AppliedMemberForm({ memberData = null, onBack }) {
    const [open, setOpen] = useState(true);
    const [loading, setLoading] = useState(false);
    const [startDateOpen, setStartDateOpen] = useState(false);
    const [endDateOpen, setEndDateOpen] = useState(false);
    const { props } = usePage();
    const csrfToken = props._token;

    const isEditMode = Boolean(memberData);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone_number: '',
        address: '',
        cnic: '',
        amount_paid: '',
        start_date: '',
        end_date: '',
        is_permanent_member: false,
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (isEditMode) {
            setFormData({
                name: memberData.name || '',
                email: memberData.email || '',
                phone_number: memberData.phone_number || '',
                address: memberData.address || '',
                cnic: memberData.cnic || '',
                amount_paid: memberData.amount_paid !== null ? memberData.amount_paid.toString() : '',
                start_date: memberData.start_date ? dayjs(memberData.start_date).format('DD-MM-YYYY') : '',
                end_date: memberData.end_date ? dayjs(memberData.end_date).format('DD-MM-YYYY') : '',
                is_permanent_member: memberData.is_permanent_member || false,
            });
        } else {
            setFormData((prev) => ({
                ...prev,
                start_date: dayjs().format('DD-MM-YYYY'),
                end_date: '',
            }));
        }
    }, [memberData, isEditMode]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: '' }));
    };

    const handlePhoneChange = (e) => {
        const value = e.target.value;
        if (value.length <= 11 && /^[0-9]*$/.test(value)) {
            setFormData((prev) => ({ ...prev, phone_number: value }));
            setErrors((prev) => ({ ...prev, phone_number: '' }));
        } else {
            setErrors((prev) => ({ ...prev, phone_number: 'Phone number must be exactly 11 digits.' }));
        }
    };

    const handleCnicChange = (e) => {
        let value = e.target.value.replace(/[^0-9]/g, '');

        if (value.length > 13) {
            value = value.slice(0, 13);
        }

        let formatted = value;
        if (value.length >= 6 && value.length <= 12) {
            formatted = `${value.slice(0, 5)}-${value.slice(5)}`;
        } else if (value.length === 13) {
            formatted = `${value.slice(0, 5)}-${value.slice(5, 12)}-${value.slice(12)}`;
        }

        setFormData((prev) => ({ ...prev, cnic: formatted }));
        setErrors((prev) => ({ ...prev, cnic: '' }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log('handleSubmit called', { formData, isEditMode, route: isEditMode ? route('applied-member.update', memberData.id) : route('applied-member.store') });

        // Validate phone number
        if (formData.phone_number.length !== 11) {
            setErrors((prev) => ({ ...prev, phone_number: 'Phone number must be exactly 11 digits.' }));
            enqueueSnackbar('Phone number must be exactly 11 digits.', { variant: 'error' });
            return;
        }

        // Validate CNIC (only if provided)
        const cnicDigits = formData.cnic.replace(/[^0-9]/g, '');
        if (formData.cnic && cnicDigits.length !== 13) {
            setErrors((prev) => ({ ...prev, cnic: 'CNIC must be exactly 13 digits.' }));
            enqueueSnackbar('CNIC must be exactly 13 digits.', { variant: 'error' });
            return;
        }

        // Validate amount paid (only if provided and not empty)
        if (formData.amount_paid && isNaN(parseFloat(formData.amount_paid))) {
            setErrors((prev) => ({ ...prev, amount_paid: 'Amount paid must be a valid number.' }));
            enqueueSnackbar('Amount paid must be a valid number.', { variant: 'error' });
            return;
        }

        // Validate member_id (but validation skipped in original too?) - leaving as is just looser checks

        const dataToSubmit = {
            name: formData.name,
            email: formData.email,
            phone_number: formData.phone_number,
            address: formData.address || null,
            cnic: formData.cnic,
            amount_paid: formData.amount_paid ? parseFloat(formData.amount_paid) : 0,
            start_date: formData.start_date,
            end_date: formData.end_date,
            is_permanent_member: formData.is_permanent_member,
        };

        try {
            setLoading(true);
            setErrors({});

            if (isEditMode) {
                const response = await axios.put(route('applied-member.update', memberData.id), dataToSubmit, {
                    headers: {
                        'X-CSRF-TOKEN': csrfToken,
                    },
                });
                const data = response.data;

                enqueueSnackbar('Applied member updated successfully.', { variant: 'success' });
                if (data.is_permanent_member) {
                    router.visit(route('membership.edit', data.member_id));
                } else {
                    router.visit(route('applied-member.index'));
                }
            } else {
                await axios.post(route('applied-member.store'), dataToSubmit, {
                    headers: {
                        'X-CSRF-TOKEN': csrfToken,
                    },
                });
                enqueueSnackbar('Applied member created successfully.', { variant: 'success' });
                router.visit(route('applied-member.index'));
            }
        } catch (error) {
            console.error('Submission error:', {
                status: error.response?.status,
                data: error.response?.data,
                message: error.message,
            });

            if (error.response?.status === 422) {
                setErrors(error.response.data.errors);
                // Display the first server-side validation error
                const firstError = Object.values(error.response.data.errors)[0][0];
                enqueueSnackbar(firstError, { variant: 'error' });
            } else if (error.response?.status === 419) {
                enqueueSnackbar('CSRF token mismatch. Please refresh the page.', { variant: 'error' });
            } else if (error.response?.status === 404) {
                enqueueSnackbar('API route not found. Please check the backend configuration.', { variant: 'error' });
            } else {
                enqueueSnackbar('Failed to save applied member: ' + (error.response?.data?.error || error.message), { variant: 'error' });
            }
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
                    // padding: '20px',
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        width: '100%',
                        // maxWidth: '600px',
                        justifyContent: 'flex-start',
                        mb: 2,
                    }}
                >
                    <IconButton onClick={() => router.get(route('applied-member.index'))} sx={{ color: '#000' }}>
                        <ArrowBack sx={{ color: '#063455' }} />
                    </IconButton>
                    <Typography sx={{ color: '#063455', fontWeight: 700, fontSize: '30px' }}>{isEditMode ? 'Edit Applied Member' : 'Add Applied Member'}</Typography>
                </Box>
                <Paper sx={{ p: 3, maxWidth: '600px', width: '100%', mx: 'auto' }}>
                    <form onSubmit={handleSubmit}>
                        <Grid container spacing={2}>
                            {/* Name */}
                            <Grid item xs={12} sm={6}>
                                <Typography>Name *</Typography>
                                <TextField fullWidth size="small" name="name" value={formData.name} onChange={handleInputChange} required error={!!errors.name} helperText={errors.name} />
                            </Grid>

                            {/* Email */}
                            <Grid item xs={12} sm={6}>
                                <Typography>Email</Typography>
                                <TextField type="email" fullWidth size="small" name="email" value={formData.email} onChange={handleInputChange} error={!!errors.email} helperText={errors.email} />
                            </Grid>

                            {/* Phone Number */}
                            <Grid item xs={12} sm={6}>
                                <Typography>Phone Number *</Typography>
                                <TextField type="tel" inputProps={{ maxLength: 11 }} fullWidth size="small" name="phone_number" placeholder="Enter 11-digit phone number" value={formData.phone_number} onChange={handlePhoneChange} required error={!!errors.phone_number} helperText={errors.phone_number} />
                            </Grid>

                            {/* Address */}
                            <Grid item xs={12} sm={6}>
                                <Typography>Address</Typography>
                                <TextField fullWidth size="small" name="address" value={formData.address} onChange={handleInputChange} error={!!errors.address} helperText={errors.address} />
                            </Grid>

                            {/* CNIC */}
                            <Grid item xs={12} sm={6}>
                                <Typography>CNIC</Typography>
                                <TextField fullWidth variant="outlined" placeholder="XXXXX-XXXXXXX-X" size="small" name="cnic" value={formData.cnic} error={!!errors.cnic} helperText={errors.cnic} onChange={handleCnicChange} inputProps={{ maxLength: 15 }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '4px' } }} />
                            </Grid>

                            {/* Amount Paid */}
                            <Grid item xs={12} sm={6}>
                                <Typography>Amount Paid</Typography>
                                <TextField fullWidth size="small" name="amount_paid" value={formData.amount_paid} onChange={handleInputChange} type="number" inputProps={{ min: 0, step: '0.01' }} error={!!errors.amount_paid} helperText={errors.amount_paid} />
                            </Grid>

                            {/* Start Date */}
                            <Grid item xs={12} sm={6}>
                                <Typography sx={{ mb: 1, fontWeight: 500 }}>Start Date</Typography>
                                <LocalizationProvider dateAdapter={AdapterDayjs}>
                                    <DatePicker
                                        value={formData.start_date ? dayjs(formData.start_date, 'DD-MM-YYYY') : null}
                                        onChange={(newValue) => {
                                            const formattedDate = newValue ? newValue.format('DD-MM-YYYY') : '';
                                            setFormData((prev) => ({ ...prev, start_date: formattedDate }));
                                            setErrors((prev) => ({ ...prev, start_date: '' }));
                                        }}
                                        format="DD-MM-YYYY"
                                        slotProps={{
                                            textField: {
                                                fullWidth: true,
                                                size: 'small',
                                                name: 'start_date',
                                                disabled: isEditMode,
                                                error: !!errors.start_date,
                                                helperText: errors.start_date,
                                                onClick: () => setStartDateOpen(true),
                                                sx: {
                                                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#ccc' },
                                                    '& .MuiInputBase-root': { height: 40, paddingRight: 0 },
                                                },
                                            },
                                            actionBar: { actions: ['clear', 'today', 'cancel', 'accept'] },
                                        }}
                                        open={startDateOpen}
                                        onClose={() => setStartDateOpen(false)}
                                        onOpen={() => setStartDateOpen(true)}
                                    />
                                </LocalizationProvider>
                            </Grid>

                            {/* End Date */}
                            <Grid item xs={12} sm={6}>
                                <Typography sx={{ mb: 1, fontWeight: 500 }}>End Date</Typography>
                                <LocalizationProvider dateAdapter={AdapterDayjs}>
                                    <DatePicker
                                        value={formData.end_date ? dayjs(formData.end_date, 'DD-MM-YYYY') : null}
                                        onChange={(newValue) => {
                                            const formattedDate = newValue ? newValue.format('DD-MM-YYYY') : '';
                                            setFormData((prev) => ({ ...prev, end_date: formattedDate }));
                                            setErrors((prev) => ({ ...prev, end_date: '' }));
                                        }}
                                        format="DD-MM-YYYY"
                                        slotProps={{
                                            textField: {
                                                fullWidth: true,
                                                size: 'small',
                                                name: 'end_date',
                                                error: !!errors.end_date,
                                                helperText: errors.end_date,
                                                onClick: () => setEndDateOpen(true),
                                                sx: {
                                                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#ccc' },
                                                    '& .MuiInputBase-root': { height: 40, paddingRight: 0 },
                                                },
                                            },
                                            actionBar: { actions: ['clear', 'today', 'cancel', 'accept'] },
                                        }}
                                        open={endDateOpen}
                                        onClose={() => setEndDateOpen(false)}
                                        onOpen={() => setEndDateOpen(true)}
                                    />
                                </LocalizationProvider>
                            </Grid>

                            {/* Checkbox only for edit mode */}
                            {isEditMode && (
                                <Grid item xs={12}>
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                name="is_permanent_member"
                                                checked={formData.is_permanent_member}
                                                onChange={(e) =>
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        is_permanent_member: e.target.checked,
                                                    }))
                                                }
                                            />
                                        }
                                        label="Make Permanent Member"
                                    />
                                </Grid>
                            )}
                        </Grid>

                        {/* Buttons */}
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
                            <Button variant="outlined" onClick={() => router.get(route('applied-member.index'))}>
                                Cancel
                            </Button>
                            <Button
                                disabled={loading}
                                variant="contained"
                                type="submit"
                                sx={{
                                    backgroundColor: '#0c4b6e',
                                    '&:hover': { backgroundColor: '#083854' },
                                }}
                            >
                                {isEditMode ? (loading ? 'Updating...' : 'Update') : loading ? 'Saving...' : 'Save'}
                            </Button>
                        </Box>
                    </form>
                </Paper>
            </div>
        </>
    );
}
