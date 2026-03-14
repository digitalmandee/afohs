import React, { useState, useEffect } from 'react';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import { usePage, router } from '@inertiajs/react';
import { Box, Typography, Paper, Grid, IconButton, Button, TextField, FormLabel, RadioGroup, FormControlLabel, Radio, MenuItem, Select, InputLabel, FormControl, Chip } from '@mui/material';
import ArrowBack from '@mui/icons-material/ArrowBack';
import { enqueueSnackbar } from 'notistack';
import AsyncSearchTextField from '@/components/AsyncSearchTextField';
import axios from 'axios';

const RoomBookingRequestForm = ({ mode }) => {
    const { props } = usePage();
    const { roomTypes, errors, request } = props;

    // Use axios to fetch guest types
    const [guestTypes, setGuestTypes] = useState([]);

    useEffect(() => {
        const fetchGuestTypes = async () => {
            try {
                const response = await axios.get(route('api.guest-types.active'));
                setGuestTypes(response.data);
            } catch (error) {
                console.error('Error fetching guest types:', error);
            }
        };
        fetchGuestTypes();
    }, []);

    // const [open, setOpen] = useState(true);
    const [familyMembers, setFamilyMembers] = useState([]);

    const [formData, setFormData] = useState({
        bookingDate: request?.booking_date || new Date().toISOString().split('T')[0], // Auto-select current date
        checkInDate: request?.check_in_date || '',
        checkOutDate: request?.check_out_date || '',
        bookingType: request?.booking_type || '',
        guest: request?.member || request?.customer || request?.corporate_member || '',
        roomTypeId: request?.room_type_id || '',
        additionalNotes: request?.additional_notes || '',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleGuestSelect = (guest) => {
        setFormData({ ...formData, guest });
        if (guest?.family_members) {
            const formattedMembers = guest.family_members.map((member) => ({
                id: member.id,
                label: `${member.name} (${member.relation})`,
            }));
            setFamilyMembers(formattedMembers);
        } else {
            setFamilyMembers([]);
        }
    };

    // Auto update per day charge removed as room specific selection is gone

    const handleSubmit = (e) => {
        e.preventDefault();

        const payload = {
            booking_date: formData.bookingDate,
            check_in_date: formData.checkInDate,
            check_out_date: formData.checkOutDate,
            booking_type: formData.bookingType,
            room_type_id: formData.roomTypeId,
            additional_notes: formData.additionalNotes,
        };
        console.log(formData.guest);

        if (formData.bookingType.startsWith('guest-')) {
            payload.customer_id = formData.guest?.id || null;
        } else if (formData.bookingType == '2') {
            payload.corporate_member_id = formData.guest?.id || null;
        } else {
            payload.member_id = formData.guest?.id || null;
        }

        if (mode === 'create') {
            router.post(route('rooms.request.store'), payload, {
                onSuccess: () => {
                    enqueueSnackbar('Booking Request Created!', { variant: 'success' });
                    setFormData({
                        bookingDate: new Date().toISOString().split('T')[0],
                        checkInDate: '',
                        checkOutDate: '',
                        bookingType: '',
                        guest: '',
                        roomTypeId: '',
                        additionalNotes: '',
                    });
                },
                onError: () => enqueueSnackbar('Please check the errors', { variant: 'error' }),
            });
        } else {
            router.put(route('rooms.request.update', request.id), payload, {
                onSuccess: () => enqueueSnackbar('Booking Request Updated!', { variant: 'success' }),
                onError: () => enqueueSnackbar('Please check the errors', { variant: 'error' }),
            });
        }
    };

    return (
        <>
            {/* <SideNav open={open} setOpen={setOpen} />
            <div
                style={{
                    marginLeft: open ? `${drawerWidthOpen}px` : `${drawerWidthClosed}px`,
                    transition: 'margin-left 0.3s ease-in-out',
                    marginTop: '5rem',
                }}
            > */}
            <Box sx={{ backgroundColor: '#f5f5f5', minHeight: '100vh', p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <IconButton sx={{ color: '#063455', mr: 1 }} onClick={() => window.history.back()}>
                        <ArrowBack />
                    </IconButton>
                    <Typography sx={{ fontWeight: 700, fontSize: '30px', color: '#063455' }}>{mode === 'create' ? 'Add Room Booking Request' : 'Edit Room Booking Request'}</Typography>
                </Box>

                <Paper
                    sx={{
                        width: '70%',
                        mx: 'auto',
                        my: 4,
                        p: 4,
                        bgcolor: '#fff',
                        borderRadius: 2,
                        border: '1px solid #e0e0e0',
                    }}
                >
                    <form onSubmit={handleSubmit}>
                        <Grid container spacing={2}>
                            {/* Booking Date - Auto-selected, read-only */}
                            <Grid item xs={12} sm={4}>
                                <LocalizationProvider dateAdapter={AdapterDayjs}>
                                    <DatePicker
                                        label="Date"
                                        format="DD-MM-YYYY"
                                        value={formData.bookingDate ? dayjs(formData.bookingDate) : null}
                                        onChange={(newValue) => handleChange({ target: { name: 'bookingDate', value: newValue ? newValue.format('YYYY-MM-DD') : '' } })}
                                        disabled
                                        slotProps={{
                                            textField: { fullWidth: true, name: 'bookingDate', error: !!errors.booking_date, helperText: errors.booking_date || "Auto-selected to today's date" },
                                        }}
                                    />
                                </LocalizationProvider>
                            </Grid>

                            {/* Check-In Date */}
                            <Grid item xs={12} sm={4}>
                                <LocalizationProvider dateAdapter={AdapterDayjs}>
                                    <DatePicker
                                        label="Check-In Date"
                                        format="DD-MM-YYYY"
                                        value={formData.checkInDate ? dayjs(formData.checkInDate) : null}
                                        onChange={(newValue) => handleChange({ target: { name: 'checkInDate', value: newValue ? newValue.format('YYYY-MM-DD') : '' } })}
                                        minDate={dayjs().subtract(1, 'day')}
                                        slotProps={{
                                            textField: {
                                                fullWidth: true,
                                                name: 'checkInDate',
                                                error: !!errors.check_in_date,
                                                helperText: errors.check_in_date,
                                                onClick: (e) => e.target.closest('.MuiFormControl-root').querySelector('button')?.click(),
                                            },
                                            actionBar: { actions: ['clear', 'today', 'cancel', 'accept'] },
                                        }}
                                    />
                                </LocalizationProvider>
                            </Grid>

                            {/* Check-Out Date */}
                            <Grid item xs={12} sm={4}>
                                <LocalizationProvider dateAdapter={AdapterDayjs}>
                                    <DatePicker
                                        label="Check-Out Date"
                                        format="DD-MM-YYYY"
                                        value={formData.checkOutDate ? dayjs(formData.checkOutDate) : null}
                                        onChange={(newValue) => handleChange({ target: { name: 'checkOutDate', value: newValue ? newValue.format('YYYY-MM-DD') : '' } })}
                                        minDate={formData.checkInDate ? dayjs(formData.checkInDate).add(1, 'day') : dayjs()}
                                        slotProps={{
                                            textField: {
                                                fullWidth: true,
                                                name: 'checkOutDate',
                                                error: !!errors.check_out_date,
                                                helperText: errors.check_out_date,
                                                onClick: (e) => e.target.closest('.MuiFormControl-root').querySelector('button')?.click(),
                                            },
                                            actionBar: { actions: ['clear', 'today', 'cancel', 'accept'] },
                                        }}
                                    />
                                </LocalizationProvider>
                            </Grid>

                            {/* Booking Type */}
                            <Grid item xs={12}>
                                <FormLabel>Booking Type</FormLabel>
                                {mode === 'edit' ? (
                                    <TextField value={formData.bookingType == 0 ? 'Member' : formData.bookingType == 2 ? 'Corporate Member' : formData.bookingType == 'guest-1' ? 'Applied Member' : formData.bookingType == 'guest-2' ? 'Affiliated Member' : 'VIP Guest'} fullWidth InputProps={{ readOnly: true }} disabled sx={{ mt: 1 }} />
                                ) : (
                                    <RadioGroup
                                        row
                                        name="bookingType"
                                        value={formData.bookingType}
                                        onChange={(e) => {
                                            handleChange(e);
                                            setFormData((prev) => ({ ...prev, bookingType: e.target.value, guest: '' }));
                                            setFamilyMembers([]);
                                        }}
                                    >
                                        <FormControlLabel value="0" control={<Radio />} label="Member" />
                                        <FormControlLabel value="2" control={<Radio />} label="Corporate Member" />
                                        {guestTypes.map((type) => (
                                            <FormControlLabel key={type.id} value={`guest-${type.id}`} control={<Radio />} label={type.name} />
                                        ))}
                                    </RadioGroup>
                                )}
                                {errors.booking_type && <Typography color="error">{errors.booking_type}</Typography>}
                            </Grid>

                            {/* Member / Guest Search */}
                            <Grid item xs={12}>
                                {mode === 'edit' ? (
                                    <TextField label="Member / Guest Name" value={request?.member ? `${request.member.full_name} (${request.member.membership_no})` : request?.customer ? `${request.customer.name} (ID: ${request.customer.customer_no})` : request?.corporate_member ? `${request.corporate_member.full_name} (${request.corporate_member.membership_no})` : 'No member/guest selected'} fullWidth InputProps={{ readOnly: true }} disabled />
                                ) : (
                                    <AsyncSearchTextField
                                        label="Member / Guest Name"
                                        name="guest"
                                        value={formData.guest}
                                        onChange={(guest) => handleGuestSelect(guest.target.value)}
                                        params={{ type: formData.bookingType }}
                                        endpoint="admin.api.search-users"
                                        placeholder="Search members..."
                                        resultFormat={(option) => (
                                            <Box sx={{ width: '100%' }}>
                                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                                    <Typography variant="body2" fontWeight="bold">
                                                        {option.membership_no || option.customer_no || option.employee_id}
                                                    </Typography>
                                                    {option.status && (
                                                        <Chip
                                                            label={option.status}
                                                            size="small"
                                                            sx={{
                                                                height: '20px',
                                                                fontSize: '10px',
                                                                backgroundColor: option.status === 'active' ? '#e8f5e9' : option.status === 'suspended' ? '#fff3e0' : '#ffebee',
                                                                color: option.status === 'active' ? '#2e7d32' : option.status === 'suspended' ? '#ef6c00' : '#c62828',
                                                                textTransform: 'capitalize',
                                                                ml: 1,
                                                            }}
                                                        />
                                                    )}
                                                </Box>
                                                <Typography variant="caption" color="text.secondary">
                                                    {option.name}
                                                </Typography>
                                            </Box>
                                        )}
                                    />
                                )}
                            </Grid>

                            {/* Select Room */}
                            {/* Room Type */}
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth error={!!errors.room_type_id}>
                                    <InputLabel>Room Type</InputLabel>
                                    <Select name="roomTypeId" value={formData.roomTypeId} onChange={handleChange}>
                                        <MenuItem value="">Select Room Type</MenuItem>
                                        {roomTypes &&
                                            roomTypes.map((type) => (
                                                <MenuItem key={type.id} value={type.id}>
                                                    {type.name}
                                                </MenuItem>
                                            ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            {/* Additional Notes */}
                            <Grid item xs={12}>
                                <TextField label="Additional Notes" name="additionalNotes" value={formData.additionalNotes} onChange={handleChange} fullWidth multiline rows={4} />
                            </Grid>

                            {/* Submit */}
                            <Grid item xs={12}>
                                <Button type="submit" variant="contained" color="primary" disabled={router.processing}>
                                    {router.processing ? 'Saving...' : mode === 'create' ? 'Submit Request' : 'Update Request'}
                                </Button>
                            </Grid>
                        </Grid>
                    </form>
                </Paper>
            </Box>
            {/* </div> */}
        </>
    );
};

export default RoomBookingRequestForm;
