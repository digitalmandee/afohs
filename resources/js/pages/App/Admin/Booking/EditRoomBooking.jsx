import React, { useEffect, useState, useRef } from 'react';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import { Button } from 'react-bootstrap';
import { Stepper, Step, StepLabel, Box, Typography, Grid, TextField, Radio, RadioGroup, FormControlLabel, FormLabel, Checkbox, InputLabel, IconButton, Select, MenuItem, FormControl, Autocomplete, Chip, CircularProgress } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import 'bootstrap/dist/css/bootstrap.min.css';
import { router, usePage } from '@inertiajs/react';
// import AsyncSearchTextField from '@/components/AsyncSearchTextField';
import { differenceInCalendarDays } from 'date-fns';
import CloseIcon from '@mui/icons-material/Close';
import axios from 'axios';
import { objectToFormData } from '@/helpers/objectToFormData';
import { enqueueSnackbar } from 'notistack';
import RoomOrderHistoryModal from '@/components/App/Rooms/RoomOrderHistoryModal';
import BookingActionModal from '@/components/App/Rooms/BookingActionModal';

// const drawerWidthOpen = 240;
// const drawerWidthClosed = 110;

const steps = ['Booking Details', 'Room Selection', 'Charges', 'Upload'];

const EditRoomBooking = ({ booking, room, bookingNo, roomCategories }) => {
    // Access query parameters
    const { url } = usePage();
    const urlParams = new URLSearchParams(url.split('?')[1] || '');
    const isCheckout = urlParams.get('type') === 'checkout';

    // Get current time in HH:mm format for checkout
    const getCurrentTime = () => {
        const now = new Date();
        return now.toTimeString().slice(0, 5); // Returns "HH:mm"
    };

    // Get current date in YYYY-MM-DD format for checkout
    const getCurrentDate = () => {
        return dayjs().format('YYYY-MM-DD');
    };

    // Order History Modal
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    // Action Modal State
    const [actionModalOpen, setActionModalOpen] = useState(false);

    // Main state for booking type
    // const [open, setOpen] = useState(true);
    const [activeStep, setActiveStep] = useState(0);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        bookingNo: booking.bookingNo,
        bookingDate: booking.bookingDate,
        checkInDate: booking.checkInDate,
        checkInTime: booking.checkInTime,
        checkOutDate: isCheckout && !booking.checkOutDate ? getCurrentDate() : booking.checkOutDate,
        checkOutTime: isCheckout && !booking.checkOutTime ? getCurrentTime() : booking.checkOutTime,
        arrivalDetails: booking.arrivalDetails,
        departureDetails: booking.departureDetails,
        bookingType: booking.bookingType,
        guest: booking.guest, // contains id, name, etc.
        guestFirstName: booking.guestFirstName,
        guestLastName: booking.guestLastName,
        company: booking.company,
        address: booking.address,
        country: booking.country,
        city: booking.city,
        mobile: booking.mobile,
        email: booking.email,
        cnic: booking.cnic,
        accompaniedGuest: booking.accompaniedGuest,
        guestRelation: booking.guestRelation,
        bookedBy: booking.bookedBy,
        familyMember: booking.familyMember,
        room: booking.room, // contains id (and optionally label)
        persons: booking.persons,
        bookingCategory: booking.bookingCategory,
        nights: booking.nights,
        perDayCharge: booking.perDayCharge,
        roomCharge: booking.roomCharge,
        securityDeposit: booking.securityDeposit,
        advanceAmount: booking.advanceAmount,
        discountType: booking.discountType,
        discount: booking.discount,
        totalOtherCharges: booking.totalOtherCharges,
        totalMiniBar: booking.totalMiniBar,
        grandTotal: booking.grandTotal,
        notes: booking.notes,
        documents: booking.documents ?? [],
        previewFiles: booking.documents ?? [],
        mini_bar_items: booking.mini_bar_items ?? [],
        other_charges: booking.other_charges ?? [],
        paymentMode: 'Cash',
        paymentAccount: '',
    });

    const handleNext = () => {
        const newErrors = {};

        // Step 0: Booking Details
        if (activeStep === 0) {
            if (!formData.guest || Object.keys(formData.guest).length === 0) {
                newErrors.guest = 'Member is required';
            }
        }

        // Step 1: Room Selection
        if (activeStep === 1) {
            if (!formData.bookingCategory) {
                newErrors.bookingCategory = 'Booking category is required';
            }
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setErrors({});
        setActiveStep((prev) => prev + 1);
    };

    const handleCancelBooking = () => {
        setActionModalOpen(true);
    };

    const handleConfirmAction = (bookingId, reason, refundData) => {
        const data = { cancellation_reason: reason };
        if (refundData && refundData.amount) {
            data.refund_amount = refundData.amount;
            data.refund_mode = refundData.mode;
            data.refund_account = refundData.account;
        }

        router.put(route('rooms.booking.cancel', bookingId), data, {
            onSuccess: () => {
                setActionModalOpen(false);
                router.visit(route('rooms.dashboard'));
            },
        });
    };

    const handleBack = () => setActiveStep((prev) => prev - 1);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        setFormData((prev) => ({
            ...prev,
            documents: [...(prev.documents || []), ...files],
            previewFiles: [...(prev.previewFiles || []), ...files],
        }));
    };

    const handleFileRemove = (index) => {
        setFormData((prev) => {
            const updatedFiles = [...(prev.previewFiles || [])];
            updatedFiles.splice(index, 1);
            return {
                ...prev,
                previewFiles: updatedFiles,
                documents: updatedFiles,
            };
        });
    };

    const handleSubmit = () => {
        const newErrors = {};

        // Final validation before submission
        if (!formData.guest || Object.keys(formData.guest).length === 0) {
            newErrors.guest = 'Member is required';
        }

        if (!formData.bookingCategory) {
            newErrors.bookingCategory = 'Booking category is required';
        }

        // Add more validations as needed for other fields...

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        const newData = {
            ...formData,
            statusType: isCheckout ? 'checked_out' : '',
        };

        // Proceed with actual submission
        const payload = objectToFormData(newData);

        setIsSubmitting(true);
        axios
            .post(route('rooms.update.booking', { id: booking.id }), payload)
            .then((res) => {
                enqueueSnackbar('Booking Updated successfully', { variant: 'success' });
                // Redirect or show success
                if (isCheckout && res.data.invoice && res.data.invoice.status === 'unpaid') {
                    router.visit(route('booking.payment', { invoice_no: res.data.invoice.id }));
                } else {
                    router.visit(route('rooms.dashboard'));
                }
            })
            .catch((err) => {
                console.error('Submit error:', err);
                if (err.response && err.response.data) {
                    if (err.response.data.error) {
                        enqueueSnackbar(err.response.data.error, { variant: 'error' });
                    } else if (err.response.data.message) {
                        enqueueSnackbar(err.response.data.message, { variant: 'error' });
                    } else {
                        enqueueSnackbar('An error occurred. Please try again.', { variant: 'error' });
                    }
                } else {
                    enqueueSnackbar('An error occurred. Please try again.', { variant: 'error' });
                }
            })
            .finally(() => {
                setIsSubmitting(false);
            });
    };

    const renderStepContent = (step) => {
        switch (step) {
            case 0:
                return <BookingDetails formData={formData} handleChange={handleChange} isCheckout={isCheckout} errors={errors} />;
            case 1:
                return <RoomSelection formData={formData} handleChange={handleChange} isCheckout={isCheckout} errors={errors} bookingId={booking.id} />;
            case 2:
                return <ChargesInfo formData={formData} handleChange={handleChange} isCheckout={isCheckout} />;
            case 3:
                return <UploadInfo formData={formData} handleChange={handleChange} handleFileChange={handleFileChange} handleFileRemove={handleFileRemove} isCheckout={isCheckout} />;
            default:
                return <Typography>Step not implemented yet</Typography>;
        }
    };

    return (
        <>
            {/* <SideNav open={open} setOpen={setOpen} /> */}
            <div
                style={{
                    minHeight: '100vh',
                    backgroundColor: '#f5f5f5',
                }}
            >
                {/* Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
                    <IconButton style={{ color: '#063455' }} onClick={() => router.visit(route('rooms.dashboard'))}>
                        <ArrowBack />
                    </IconButton>
                    <h2 className="mb-0 fw-normal" style={{ color: '#063455', fontSize: '30px' }}>
                        Room Booking
                    </h2>
                    <Button variant="outlined" size="small" onClick={() => setShowHistoryModal(true)} sx={{ ml: 'auto', mr: 2, borderColor: '#063455', color: '#063455' }}>
                        View Orders
                    </Button>
                </Box>

                <Box
                    sx={{
                        margin: '0 auto',
                        // bgcolor: '#FFFFFF',
                        borderRadius: '4px',
                        marginTop: 5,
                    }}
                >
                    <Box sx={{ px: 4 }}>
                        <Stepper
                            activeStep={activeStep}
                            sx={{
                                '& .MuiStepIcon-root.Mui-active': {
                                    color: '#063455',
                                },
                                '& .MuiStepIcon-root.Mui-completed': {
                                    color: 'gray',
                                },
                            }}
                        >
                            {steps.map((label) => (
                                <Step key={label}>
                                    <StepLabel>{label}</StepLabel>
                                </Step>
                            ))}
                        </Stepper>
                    </Box>
                    {/* Main Content */}
                    <Box
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
                        <Box sx={{ width: '100%', p: 0 }}>
                            <Box sx={{ mb: 4 }}>{renderStepContent(activeStep)}</Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Button variant="outlined" disabled={activeStep === 0} onClick={handleBack}>
                                    Back
                                </Button>
                                {booking.status !== 'cancelled' && (
                                    <Button variant="outlined" color="error" onClick={handleCancelBooking} sx={{ mr: 'auto', ml: 2, borderColor: '#d32f2f', color: '#d32f2f' }}>
                                        Cancel Booking
                                    </Button>
                                )}
                                <Button style={{ backgroundColor: '#063455', color: '#fff' }} onClick={activeStep === steps.length - 1 ? handleSubmit : handleNext} disabled={isSubmitting} loading={isSubmitting} loadingPosition="start">
                                    {activeStep === steps.length - 1 ? (isCheckout ? 'Checkout' : 'Finish') : 'Next'}
                                </Button>
                            </Box>
                        </Box>
                    </Box>
                </Box>
            </div>

            <RoomOrderHistoryModal open={showHistoryModal} onClose={() => setShowHistoryModal(false)} bookingId={booking.id} />
            <BookingActionModal open={actionModalOpen} onClose={() => setActionModalOpen(false)} booking={booking} action="cancel" onConfirm={handleConfirmAction} />
        </>
    );
};
export default EditRoomBooking;

const BookingDetails = ({ formData, handleChange, errors, isCheckout }) => {
    const [familyMembers, setFamilyMembers] = useState([]);
    // Autocomplete states
    const [open, setOpen] = useState(false);
    const [options, setOptions] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (formData.guest) {
            axios
                .get(route('admin.family-members', { id: formData.guest?.id }), {
                    params: { type: formData.bookingType },
                })
                .then((res) => {
                    setFamilyMembers(res.data.results);
                });
        }
    }, [formData.guest, formData.bookingType]);

    // Handle search input change
    const handleSearch = async (event, query) => {
        if (!query) {
            setOptions([]);
            return;
        }
        setLoading(true);
        try {
            const response = await axios.get(route('admin.api.search-users'), {
                params: {
                    q: query,
                    type: formData.bookingType,
                },
            });
            setOptions(response.data.results || []);
        } catch (error) {
            console.error('Error fetching members:', error);
            setOptions([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Grid container spacing={2}>
                <Grid item xs={12} sm={3}>
                    <TextField label="Booking No." name="bookingNo" value={formData.bookingNo} inputProps={{ readOnly: true }} fullWidth />
                </Grid>
                <Grid item xs={12} sm={3}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DatePicker
                            label="Booking Date"
                            format="DD-MM-YYYY"
                            value={formData.bookingDate ? dayjs(formData.bookingDate) : null}
                            onChange={(newValue) => handleChange({ target: { name: 'bookingDate', value: newValue ? newValue.format('YYYY-MM-DD') : '' } })}
                            slotProps={{
                                textField: { fullWidth: true, name: 'bookingDate' },
                                actionBar: { actions: ['clear', 'today', 'cancel', 'accept'] },
                            }}
                            readOnly
                        />
                    </LocalizationProvider>
                </Grid>
                <Grid item xs={6} sm={3}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DatePicker
                            label="Check-In Date"
                            format="DD-MM-YYYY"
                            value={formData.checkInDate ? dayjs(formData.checkInDate) : null}
                            onChange={(newValue) => handleChange({ target: { name: 'checkInDate', value: newValue ? newValue.format('YYYY-MM-DD') : '' } })}
                            minDate={isCheckout ? undefined : dayjs().subtract(1, 'day')}
                            slotProps={{
                                textField: { fullWidth: true, name: 'checkInDate', onClick: (e) => !isCheckout && e.target.closest('.MuiFormControl-root').querySelector('button')?.click() },
                                actionBar: { actions: ['clear', 'today', 'cancel', 'accept'] },
                            }}
                            disabled={isCheckout}
                        />
                    </LocalizationProvider>
                </Grid>
                {isCheckout && (
                    <Grid item xs={6} sm={3}>
                        <TextField label="Check-In Time" name="checkInTime" type="time" value={formData.checkInTime} onChange={handleChange} fullWidth InputLabelProps={{ shrink: true }} />
                    </Grid>
                )}
                <Grid item xs={6} sm={3}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DatePicker
                            label="Check-Out Date"
                            format="DD-MM-YYYY"
                            value={formData.checkOutDate ? dayjs(formData.checkOutDate) : null}
                            onChange={(newValue) => handleChange({ target: { name: 'checkOutDate', value: newValue ? newValue.format('YYYY-MM-DD') : '' } })}
                            slotProps={{
                                textField: { fullWidth: true, name: 'checkOutDate', onClick: (e) => e.target.closest('.MuiFormControl-root').querySelector('button')?.click() },
                                actionBar: { actions: ['clear', 'today', 'cancel', 'accept'] },
                            }}
                            minDate={formData.checkInDate ? dayjs(formData.checkInDate).add(1, 'day') : null}
                        />
                    </LocalizationProvider>
                </Grid>
                {isCheckout && (
                    <Grid item xs={6} sm={3}>
                        <TextField label="Check-Out Time" name="checkOutTime" type="time" value={formData.checkOutTime} onChange={handleChange} fullWidth InputLabelProps={{ shrink: true }} />
                    </Grid>
                )}
                <Grid item xs={6} sm={3}>
                    <TextField label="Arrival Details" name="arrivalDetails" value={formData.arrivalDetails} onChange={handleChange} fullWidth multiline rows={1} />
                </Grid>
                <Grid item xs={6} sm={3}>
                    <TextField label="Departure Details" name="departureDetails" value={formData.departureDetails} onChange={handleChange} fullWidth multiline rows={1} />
                </Grid>
                <Grid item xs={12}>
                    <FormLabel>Booking Type</FormLabel>
                    <RadioGroup row name="bookingType" value={formData.bookingType} onChange={handleChange}>
                        <FormControlLabel value="0" control={<Radio />} label="Member" disabled />
                        <FormControlLabel value="2" control={<Radio />} label="Corporate Member" disabled />
                        <FormControlLabel value="guest-1" control={<Radio />} label="Applied Member" disabled />
                        <FormControlLabel value="guest-2" control={<Radio />} label="Affiliated Member" disabled />
                        <FormControlLabel value="guest-3" control={<Radio />} label="VIP Guest" disabled />
                    </RadioGroup>
                </Grid>

                <Grid item xs={12}>
                    <Autocomplete
                        open={open}
                        onOpen={() => setOpen(true)}
                        onClose={() => setOpen(false)}
                        isOptionEqualToValue={(option, value) => option.id === value?.id}
                        getOptionLabel={(option) => option.label || option.name || ''}
                        options={options}
                        loading={loading}
                        value={formData.guest || null}
                        onInputChange={(event, newInputValue, reason) => {
                            if (reason === 'input') {
                                handleSearch(event, newInputValue);
                            }
                        }}
                        onChange={(event, newValue) => {
                            handleChange({ target: { name: 'guest', value: newValue } });
                        }}
                        disabled={true} // Keep disabled for Edit mode as per original logic? Or align with RoomBooking.jsx which disables it if editMode is true? Original code had disabled={true}.
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Member / Guest Name"
                                placeholder="Search members..."
                                error={!!errors.guest}
                                helperText={errors.guest}
                                InputProps={{
                                    ...params.InputProps,
                                    endAdornment: (
                                        <React.Fragment>
                                            {loading ? <CircularProgress color="inherit" size={20} /> : null}
                                            {params.InputProps.endAdornment}
                                        </React.Fragment>
                                    ),
                                }}
                            />
                        )}
                        renderOption={(props, option) => (
                            <li {...props} key={option.id}>
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
                                    <Typography variant="body2">{option.full_name || option.name}</Typography>
                                    <Typography variant="caption" color="textSecondary">
                                        {option.cnic_no || option.cnic} | {option.mobile_number_a || option.contact}
                                    </Typography>
                                </Box>
                            </li>
                        )}
                    />
                    {errors.guest && (
                        <Typography variant="body2" color="error">
                            {errors.guest}
                        </Typography>
                    )}

                    {formData.guest && (
                        <Box sx={{ mt: 1, p: 1, border: '1px solid #ccc', borderRadius: 1 }}>
                            <Typography variant="h5" sx={{ mb: 1 }}>
                                Member Information
                            </Typography>
                            <Typography variant="body1">
                                {formData.bookingType == '2' ? 'Corporate #' : 'Member #'}: {formData.guest?.membership_no || formData.guest?.customer_no}
                            </Typography>
                            <Typography variant="body1">Email: {formData.guest?.email}</Typography>
                            <Typography variant="body1">Phone: {formData.guest?.phone}</Typography>
                            <Typography variant="body1">Address: {formData.guest?.address}</Typography>
                            <FormControl fullWidth sx={{ mt: 2 }}>
                                <InputLabel>Select Family Member</InputLabel>
                                <Select value={formData.familyMember} onChange={handleChange} name="familyMember" label="Select Family Member" disabled={isCheckout}>
                                    <MenuItem value="">Select Family Member</MenuItem>
                                    {familyMembers?.map((member) => (
                                        <MenuItem key={member.id} value={member.id}>
                                            {member.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>
                    )}
                </Grid>
            </Grid>
            <Typography sx={{ my: 3 }} variant="h6">
                Guest Info
            </Typography>
            <Grid container spacing={2}>
                <Grid item xs={12} sm={3}>
                    <TextField label="Booked By" name="bookedBy" value={formData.bookedBy} onChange={handleChange} fullWidth disabled={isCheckout} />
                </Grid>
                <Grid item xs={6} sm={3}>
                    <TextField label="Guest First Name" name="guestFirstName" value={formData.guestFirstName} onChange={handleChange} fullWidth disabled={isCheckout} />
                </Grid>
                <Grid item xs={6} sm={3}>
                    <TextField label="Guest Last Name" name="guestLastName" value={formData.guestLastName} onChange={handleChange} fullWidth disabled={isCheckout} />
                </Grid>
                <Grid item xs={6} sm={3}>
                    <TextField label="Company / Institution" name="company" value={formData.company} onChange={handleChange} fullWidth disabled={isCheckout} />
                </Grid>
                <Grid item xs={6}>
                    <TextField label="Address" name="address" value={formData.address} onChange={handleChange} fullWidth disabled={isCheckout} />
                </Grid>
                <Grid item xs={6} sm={3}>
                    <TextField label="Country" name="country" value={formData.country} onChange={handleChange} fullWidth disabled={isCheckout} />
                </Grid>
                <Grid item xs={6} sm={3}>
                    <TextField label="City" name="city" value={formData.city} onChange={handleChange} fullWidth disabled={isCheckout} />
                </Grid>
                <Grid item xs={6} sm={3}>
                    <TextField label="Mobile" name="mobile" value={formData.mobile} onChange={(e) => handleChange({ target: { name: 'mobile', value: e.target.value.replace(/\D/g, '') } })} inputProps={{ maxLength: 11 }} fullWidth disabled={isCheckout} />
                </Grid>
                <Grid item xs={6} sm={5}>
                    <TextField label="Email" name="email" value={formData.email} onChange={handleChange} fullWidth disabled={isCheckout} />
                </Grid>
                <Grid item xs={6} sm={4}>
                    <TextField
                        label="CNIC / Passport No."
                        name="cnic"
                        value={formData.cnic}
                        onChange={(e) => {
                            let value = e.target.value.replace(/\D/g, '');
                            if (value.length > 5 && value[5] !== '-') value = value.slice(0, 5) + '-' + value.slice(5);
                            if (value.length > 13 && value[13] !== '-') value = value.slice(0, 13) + '-' + value.slice(13);
                            if (value.length > 15) value = value.slice(0, 15);
                            handleChange({ target: { name: 'cnic', value } });
                        }}
                        fullWidth
                        disabled={isCheckout}
                        placeholder="XXXXX-XXXXXXX-X"
                    />
                </Grid>
                <Grid item xs={6}>
                    <TextField label="Enter Relationship" name="guestRelation" value={formData.guestRelation} onChange={handleChange} fullWidth disabled={isCheckout} />
                </Grid>
                <Grid item xs={6}>
                    <TextField label="Accompanied Guest Name" name="accompaniedGuest" value={formData.accompaniedGuest} onChange={handleChange} fullWidth disabled={isCheckout} />
                </Grid>
            </Grid>
        </>
    );
};

const RoomSelection = ({ formData, handleChange, errors, isCheckout, bookingId }) => {
    const { props } = usePage();
    const [availableRooms, setAvailableRooms] = useState([]);
    const [loadingRooms, setLoadingRooms] = useState(false);

    // Automatically calculate nights between check-in and check-out
    const nights = formData.checkInDate && formData.checkOutDate ? Math.max(1, dayjs(formData.checkOutDate).diff(dayjs(formData.checkInDate), 'day')) : 0;

    // Fetch available rooms when dates change
    useEffect(() => {
        if (formData.checkInDate && formData.checkOutDate) {
            setLoadingRooms(true);
            axios
                .get(route('rooms.booking.search'), {
                    params: {
                        checkin: formData.checkInDate,
                        checkout: formData.checkOutDate,
                        exclude_booking_id: bookingId,
                    },
                })
                .then((res) => {
                    setAvailableRooms(res.data);

                    // If the currently selected room is NOT in the available list (e.g. date conflict created elsewhere),
                    // we might want to warn or handle it.
                    // However, because we exclude the current booking ID, the current room *should* appear in the list
                    // if it's not booked by *another* overlapping booking.
                })
                .catch((err) => {
                    console.error('Error fetching rooms', err);
                })
                .finally(() => {
                    setLoadingRooms(false);
                });
        }
    }, [formData.checkInDate, formData.checkOutDate, bookingId]);

    // Handle Room Change
    const handleRoomChange = (e) => {
        const roomId = e.target.value;
        const selectedRoom = availableRooms.find((r) => r.id === roomId);
        if (selectedRoom) {
            handleChange({ target: { name: 'room', value: selectedRoom } });
        }
    };

    // Find charge by selected booking category
    const selectedCategory = props.roomCategories.find((cat) => cat.id == formData.bookingCategory);
    const matchedCharge = formData.room?.category_charges?.find((charge) => charge.room_category_id == formData.bookingCategory);

    const perDayCharge = matchedCharge?.amount || 0;
    const totalCharge = nights * perDayCharge;

    // Sync calculated values into parent form state
    useEffect(() => {
        if (formData.nights !== nights || formData.perDayCharge !== perDayCharge || formData.roomCharge !== totalCharge) {
            handleChange({ target: { name: 'nights', value: nights } });
            handleChange({ target: { name: 'perDayCharge', value: perDayCharge } });
            handleChange({ target: { name: 'roomCharge', value: totalCharge } });
        }
    }, [formData.bookingCategory, formData.checkInDate, formData.checkOutDate, nights, perDayCharge, totalCharge]);

    return (
        <Grid container spacing={2}>
            <Grid item xs={12}>
                <FormControl fullWidth disabled={isCheckout || loadingRooms}>
                    <InputLabel id="select-room-label">Select Room</InputLabel>
                    <Select labelId="select-room-label" value={formData.room?.id || ''} label="Select Room" onChange={handleRoomChange}>
                        {loadingRooms ? (
                            <MenuItem disabled>Loading available rooms...</MenuItem>
                        ) : availableRooms.length > 0 ? (
                            availableRooms.map((room) => (
                                <MenuItem key={room.id} value={room.id}>
                                    {room.name} ({room.room_type?.name})
                                </MenuItem>
                            ))
                        ) : (
                            <MenuItem disabled>No rooms available for these dates</MenuItem>
                        )}

                        {/* Fallback to show current room if list is empty or doesn't contain it yet (e.g. initial load lag) */}
                        {!loadingRooms && formData.room && !availableRooms.find((r) => r.id === formData.room.id) && (
                            <MenuItem value={formData.room.id}>
                                {formData.room.name} ({formData.room.room_type?.name}) - <em>(Current)</em>
                            </MenuItem>
                        )}
                    </Select>
                </FormControl>
                {/* Debug Info or Helper Text */}
                {/* <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                    <b>Current:</b> {formData.room?.name} ({formData.room?.room_type?.name})
                </Typography> */}
            </Grid>

            <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                    <InputLabel>Booking Category</InputLabel>
                    <Select value={formData.bookingCategory} onChange={handleChange} name="bookingCategory" label="Booking Category" disabled={isCheckout}>
                        <MenuItem value="">Booking Category</MenuItem>
                        {props.roomCategories.map((item) => (
                            <MenuItem key={item.id} value={item.id}>
                                {item.name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                {errors.bookingCategory && (
                    <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                        {errors.bookingCategory}
                    </Typography>
                )}
            </Grid>

            <Grid item xs={2}>
                <TextField label="Per Day Room Charges" name="perDayCharge" value={formData.perDayCharge} fullWidth InputProps={{ readOnly: true }} disabled />
            </Grid>
            <Grid item xs={2}>
                <TextField label="No. of Nights" name="nights" value={formData.nights} fullWidth InputProps={{ readOnly: true }} disabled />
            </Grid>
            <Grid item xs={3}>
                <TextField label="Room Charges" name="roomCharge" value={formData.roomCharge} fullWidth InputProps={{ readOnly: true }} disabled />
            </Grid>
            <Grid item xs={2}>
                <TextField type="number" label="Security" placeholder="Security" name="securityDeposit" value={formData.securityDeposit} onChange={handleChange} onKeyDown={(e) => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()} fullWidth disabled={isCheckout} />
            </Grid>
            <Grid item xs={3}>
                <TextField type="number" label="Advance" placeholder="Advance" name="advanceAmount" value={formData.advanceAmount} onChange={handleChange} onKeyDown={(e) => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()} fullWidth disabled={isCheckout} />
            </Grid>

            {/* Payment Details - Shown if Security/Advance > 0 */}
            {(formData.securityDeposit > 0 || formData.advanceAmount > 0) && (
                <>
                    <Grid item xs={6}>
                        <FormControl fullWidth>
                            <InputLabel>Payment Mode</InputLabel>
                            <Select name="paymentMode" value={formData.paymentMode || 'Cash'} onChange={handleChange} label="Payment Mode" disabled={isCheckout}>
                                <MenuItem value="Cash">Cash</MenuItem>
                                <MenuItem value="Bank Transfer">Bank Transfer</MenuItem>
                                <MenuItem value="Credit Card">Credit Card</MenuItem>
                                <MenuItem value="Online">Online</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    {formData.paymentMode !== 'Cash' && ( // Only show reference if not Cash
                        <Grid item xs={6}>
                            <TextField label="Payment Account / Reference" name="paymentAccount" value={formData.paymentAccount || ''} onChange={handleChange} fullWidth disabled={isCheckout} />
                        </Grid>
                    )}
                </>
            )}
        </Grid>
    );
};

const ChargesInfo = ({ formData, handleChange, isCheckout }) => {
    const { props } = usePage();

    const [miniBarItems, setMiniBarItems] = useState();

    const handleOtherChange = (index, field, value) => {
        const updated = [...formData.other_charges];
        const item = { ...updated[index] };

        if (field === 'type') {
            const selected = props.chargesTypeItems.find((c) => c.name === value);
            item.type = value;
            item.amount = selected ? selected.amount : '';
        } else {
            item[field] = value;
        }

        updated[index] = item;
        handleChange({ target: { name: 'other_charges', value: updated } });
    };

    const handleMiniBarChange = (index, field, value) => {
        const updated = [...formData.mini_bar_items];
        const item = { ...updated[index] };

        if (field === 'item') {
            const selected = props.miniBarItems.find((m) => m.name === value);
            item.item = value;
            item.qty = 1;
            item.amount = selected ? selected.amount : '';
        } else {
            item[field] = value;
        }

        const qty = parseFloat(item.qty) || 0;
        const amt = parseFloat(item.amount) || 0;
        item.total = (qty * amt).toFixed(2);

        updated[index] = item;
        handleChange({ target: { name: 'mini_bar_items', value: updated } });
    };

    const calculateTotals = () => {
        const totalOther = formData.other_charges.reduce((sum, chg) => sum + (chg.is_complementary ? 0 : parseFloat(chg.amount) || 0), 0);

        const totalMini = formData.mini_bar_items.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0);

        const room = parseFloat(formData.roomCharge || 0);
        const discountVal = parseFloat(formData.discount || 0);
        const discountType = formData.discountType || 'fixed';

        const baseTotal = room + totalOther + totalMini;
        const discountAmount = discountType === 'percentage' ? (discountVal / 100) * baseTotal : discountVal;

        const grandTotal = baseTotal - discountAmount;

        return { totalOther, totalMini, grandTotal };
    };

    useEffect(() => {
        const { totalOther, totalMini, grandTotal } = calculateTotals();

        handleChange({ target: { name: 'totalOtherCharges', value: totalOther } });
        handleChange({ target: { name: 'totalMiniBar', value: totalMini } });
        handleChange({ target: { name: 'grandTotal', value: grandTotal.toFixed(2) } });
    }, [formData.other_charges, formData.mini_bar_items, formData.discount, formData.discountType, formData.roomCharge]);

    const { totalOther, totalMini, grandTotal } = calculateTotals();

    return (
        <Grid container spacing={2}>
            <Grid item xs={12}>
                <Typography variant="h6">Other Charges</Typography>
            </Grid>

            {formData.other_charges.map((item, index) => (
                <React.Fragment key={index}>
                    <Grid item xs={3}>
                        <FormControl fullWidth>
                            <InputLabel>Charges Type</InputLabel>
                            <Select value={item.type} label="Charges Type" onChange={(e) => handleOtherChange(index, 'type', e.target.value)}>
                                <MenuItem value="">Select Type</MenuItem>
                                {props.chargesTypeItems.map((type, i) => (
                                    <MenuItem key={i} value={type.name}>
                                        {type.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={3}>
                        <TextField label="Bill Details" fullWidth value={item.details} onChange={(e) => handleOtherChange(index, 'details', e.target.value)} />
                    </Grid>
                    <Grid item xs={2}>
                        <TextField label="Amount" type="number" fullWidth value={item.amount} onChange={(e) => handleOtherChange(index, 'amount', e.target.value)} />
                    </Grid>
                    <Grid item xs={2}>
                        <FormControlLabel control={<Checkbox checked={item.is_complementary == 1 || item.is_complementary === true} onChange={(e) => handleOtherChange(index, 'is_complementary', e.target.checked)} />} label="Complementary" />
                    </Grid>
                </React.Fragment>
            ))}
            <Grid item xs={12}>
                <Button style={{ backgroundColor: '#063455', color: '#fff' }} variant="contained" onClick={() => handleChange({ target: { name: 'other_charges', value: [...formData.other_charges, { type: '', details: '', amount: '', is_complementary: false }] } })}>
                    Add More
                </Button>
            </Grid>

            <Grid item xs={12}>
                <Typography variant="h6">Mini Bar</Typography>
            </Grid>

            {formData.mini_bar_items.map((item, index) => (
                <Grid key={index} container spacing={2} sx={{ mb: 2, px: 2 }} alignItems="center">
                    <Grid item xs={3}>
                        <FormControl fullWidth>
                            <InputLabel>Item</InputLabel>
                            <Select value={item.item} label="Item" onChange={(e) => handleMiniBarChange(index, 'item', e.target.value)}>
                                <MenuItem value="">Select Item</MenuItem>
                                {props.miniBarItems.map((mb, i) => (
                                    <MenuItem key={i} value={mb.name}>
                                        {mb.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={3}>
                        <TextField label="Amount" type="number" fullWidth value={item.amount} onChange={(e) => handleMiniBarChange(index, 'amount', e.target.value)} />
                    </Grid>
                    <Grid item xs={3}>
                        <TextField label="Qty" type="number" fullWidth value={item.qty} onChange={(e) => handleMiniBarChange(index, 'qty', e.target.value)} />
                    </Grid>
                    <Grid item xs={3}>
                        <TextField label="Total" fullWidth disabled value={item.total} />
                    </Grid>
                </Grid>
            ))}
            <Grid item xs={12}>
                <Button style={{ backgroundColor: '#063455', color: '#fff' }} variant="contained" onClick={() => handleChange({ target: { name: 'mini_bar_items', value: [...formData.mini_bar_items, { item: '', amount: '', qty: '', total: '' }] } })}>
                    Add More
                </Button>
            </Grid>

            {/* Summary Fields */}
            <Grid item xs={2}>
                <TextField label="Total Other Charges" value={totalOther} fullWidth disabled />
            </Grid>
            <Grid item xs={2}>
                <TextField label="Total Mini Bar Charges" value={totalMini} fullWidth disabled />
            </Grid>
            <Grid item xs={2}>
                <TextField label="Room Charges" value={formData.roomCharge} fullWidth disabled />
            </Grid>
            <Grid item xs={2}>
                <FormControl fullWidth>
                    <InputLabel>Discount Type</InputLabel>
                    <Select value={formData.discountType || 'fixed'} onChange={(e) => handleChange({ target: { name: 'discountType', value: e.target.value } })}>
                        <MenuItem value="fixed">Fixed</MenuItem>
                        <MenuItem value="percentage">Percentage</MenuItem>
                    </Select>
                </FormControl>
            </Grid>
            <Grid item xs={2}>
                <TextField label="Discount" type="number" name="discount" value={formData.discount} onChange={handleChange} fullWidth />
            </Grid>
            <Grid item xs={2}>
                <TextField label="Grand Total" value={grandTotal.toFixed(2)} fullWidth disabled />
            </Grid>
        </Grid>
    );
};

const UploadInfo = ({ formData, handleChange, handleFileChange, handleFileRemove, isCheckout }) => {
    const [isDragOver, setIsDragOver] = useState(false);
    const fileInputRef = useRef(null);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragOver(false);

        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            const syntheticEvent = {
                target: {
                    name: 'documents',
                    files: files,
                },
            };
            handleFileChange(syntheticEvent);
        }
    };

    const handleBoxClick = () => {
        fileInputRef.current?.click();
    };

    const getFilePreview = (file, index) => {
        const isFileObject = file instanceof File;
        const fileName = isFileObject ? file.name : file.split('/').pop();
        const ext = fileName.split('.').pop().toLowerCase();

        const previewUrl = isFileObject ? URL.createObjectURL(file) : file;

        return (
            <div
                key={index}
                style={{
                    position: 'relative',
                    width: '100px',
                    textAlign: 'center',
                    marginBottom: '10px',
                }}
            >
                <IconButton
                    size="small"
                    onClick={() => handleFileRemove(index)}
                    sx={{
                        position: 'absolute',
                        top: -8,
                        right: -8,
                        backgroundColor: '#f44336',
                        color: 'white',
                        width: 24,
                        height: 24,
                        '&:hover': {
                            backgroundColor: '#d32f2f',
                        },
                        zIndex: 1,
                    }}
                >
                    <CloseIcon fontSize="small" />
                </IconButton>

                {['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp'].includes(ext) ? (
                    <div>
                        <img
                            src={previewUrl}
                            alt={`Document ${index + 1}`}
                            style={{
                                width: '60px',
                                height: '60px',
                                objectFit: 'cover',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                border: '2px solid #ddd',
                            }}
                            onClick={() => window.open(previewUrl, '_blank')}
                        />
                        <p style={{ fontSize: '12px', marginTop: '5px', margin: 0 }}>Image</p>
                    </div>
                ) : ext === 'pdf' ? (
                    <div>
                        <div
                            style={{
                                width: '60px',
                                height: '60px',
                                backgroundColor: '#f44336',
                                borderRadius: '6px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                margin: '0 auto',
                            }}
                            onClick={() => window.open(previewUrl, '_blank')}
                        >
                            <Typography variant="body2" sx={{ color: 'white', fontWeight: 'bold', fontSize: '10px' }}>
                                PDF
                            </Typography>
                        </div>
                        <p style={{ fontSize: '12px', marginTop: '5px', margin: 0 }}>PDF</p>
                    </div>
                ) : ['docx', 'doc'].includes(ext) ? (
                    <div>
                        <div
                            style={{
                                width: '60px',
                                height: '60px',
                                backgroundColor: '#2196f3',
                                borderRadius: '6px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                margin: '0 auto',
                            }}
                            onClick={() => window.open(previewUrl, '_blank')}
                        >
                            <Typography variant="body2" sx={{ color: 'white', fontWeight: 'bold', fontSize: '10px' }}>
                                DOC
                            </Typography>
                        </div>
                        <p style={{ fontSize: '12px', marginTop: '5px', margin: 0 }}>Word</p>
                    </div>
                ) : (
                    <div>
                        <div
                            style={{
                                width: '60px',
                                height: '60px',
                                backgroundColor: '#757575',
                                borderRadius: '6px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                margin: '0 auto',
                            }}
                            onClick={() => window.open(previewUrl, '_blank')}
                        >
                            <Typography variant="body2" sx={{ color: 'white', fontWeight: 'bold', fontSize: '8px' }}>
                                FILE
                            </Typography>
                        </div>
                        <p style={{ fontSize: '12px', marginTop: '5px', margin: 0 }}>{ext.toUpperCase()}</p>
                    </div>
                )}
            </div>
        );
    };

    return (
        <Grid container spacing={2}>
            <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                    Upload Documents
                </Typography>
                <Box
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={handleBoxClick}
                    sx={{
                        border: isDragOver ? '2px dashed #0a3d62' : '2px dashed #ccc',
                        borderRadius: 2,
                        p: 4,
                        textAlign: 'center',
                        backgroundColor: isDragOver ? '#e3f2fd' : '#fafafa',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                            borderColor: '#0a3d62',
                            backgroundColor: '#f5f5f5',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        },
                    }}
                >
                    <input ref={fileInputRef} type="file" multiple accept=".pdf,.doc,.docx,image/*" name="documents" onChange={handleFileChange} style={{ display: 'none' }} />

                    <Box sx={{ mb: 2 }}>
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2Z" fill="#2196f3" opacity="0.3" />
                            <path d="M14 2L20 8H14V2Z" fill="#2196f3" />
                            <path d="M12 11L8 15H10.5V19H13.5V15H16L12 11Z" fill="#2196f3" />
                        </svg>
                    </Box>

                    <Typography variant="h6" sx={{ mb: 1, color: isDragOver ? '#2196f3' : '#666' }}>
                        {isDragOver ? 'Drop files here' : 'Upload Documents'}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                        Drag and drop files here or click to browse
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                        Supported formats: PDF, DOC, DOCX, Images (JPG, PNG, etc.)
                    </Typography>
                </Box>
            </Grid>

            {formData.previewFiles && formData.previewFiles.length > 0 && (
                <Grid item xs={12}>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        Uploaded Documents ({formData.previewFiles.length})
                    </Typography>
                    <div
                        style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '15px',
                            padding: '15px',
                            backgroundColor: '#f9f9f9',
                            borderRadius: '8px',
                            border: '1px solid #e0e0e0',
                        }}
                    >
                        {formData.previewFiles.map((file, index) => getFilePreview(file, index))}
                    </div>
                </Grid>
            )}

            <Grid item xs={12}>
                <TextField label="Additional Notes" name="notes" value={formData.notes || ''} onChange={handleChange} multiline rows={4} fullWidth />
            </Grid>
        </Grid>
    );
};
