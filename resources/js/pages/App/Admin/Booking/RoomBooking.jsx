import React, { useEffect, useState, useRef } from 'react';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import { Stepper, Step, StepLabel, Box, Typography, Grid, TextField, Radio, RadioGroup, FormControlLabel, FormLabel, Checkbox, InputLabel, Button, IconButton, Select, MenuItem, FormControl, Autocomplete, Chip, CircularProgress } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import 'bootstrap/dist/css/bootstrap.min.css';
import { router, usePage } from '@inertiajs/react';
// import AsyncSearchTextField from '@/components/AsyncSearchTextField';
import { differenceInCalendarDays } from 'date-fns';
import CloseIcon from '@mui/icons-material/Close';
import axios from 'axios';
import { objectToFormData } from '@/helpers/objectToFormData';
import { enqueueSnackbar } from 'notistack';
import GuestCreateModal from '@/components/GuestCreateModal';

// const drawerWidthOpen = 240;
// const drawerWidthClosed = 110;

const steps = ['Booking Details', 'Room Selection', 'Charges', 'Upload'];

const RoomBooking = ({ room, bookingNo, roomCategories }) => {
    // Access query parameters
    const { props } = usePage();
    const urlParams = new URLSearchParams(window.location.search);
    const urlParamsObject = Object.fromEntries([...urlParams.entries()].map(([key, value]) => [key, value]));
    const initialBookingType = urlParamsObject?.type === 'event' ? 'events' : 'room';

    // Main state for booking type
    // const [open, setOpen] = useState(true);
    const [activeStep, setActiveStep] = useState(0);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        bookingNo: bookingNo || '',
        bookingDate: new Date().toISOString().split('T')[0],
        checkInDate: urlParamsObject?.checkin || '',
        checkOutDate: urlParamsObject?.checkout || '',
        persons: urlParamsObject?.persons || '',
        arrivalDetails: '',
        departureDetails: '',
        bookingType: 0,
        guest: '',
        familyMember: '',
        room: room || '',
        bookingCategory: '',
        perDayCharge: '',
        nights: '',
        roomCharge: '',
        securityDeposit: '',
        bookedBy: '',
        guestFirstName: '',
        guestLastName: '',
        company: '',
        address: '',
        country: '',
        city: '',
        mobile: '',
        email: '',
        cnic: '',
        guestRelation: '',
        accompaniedGuest: '',
        discountType: 'fixed',
        discount: '',
        totalOtherCharges: '',
        totalMiniBar: '',
        grandTotal: '',
        mini_bar_items: [{ item: '', amount: '', qty: '', total: '' }],
        other_charges: [{ type: '', details: '', amount: '', is_complementary: false }],
        documents: [],
        previewFiles: [],
        notes: '',
    });

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

    const [showGuestModal, setShowGuestModal] = useState(false);

    const handleGuestCreated = (newGuest) => {
        // Format the guest object to match Autocomplete option structure if needed
        // The search API returns {label, value, ...} but Autocomplete mainly needs id and label for display
        const formattedGuest = {
            ...newGuest,
            label: `${newGuest.name} (Guest - ${newGuest.customer_no})`,
            booking_type: `guest-${newGuest.guest_type_id}`,
        };

        setFormData((prev) => ({
            ...prev,
            guest: formattedGuest,
            bookingType: `guest-${newGuest.guest_type_id}`,
        }));
        setShowGuestModal(false);
    };

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

        // Proceed with actual submission
        const sanitizedFormData = { ...formData };
        ['securityDeposit', 'roomCharge', 'discount', 'perDayCharge', 'nights', 'persons', 'totalOtherCharges', 'totalMiniBar', 'grandTotal', 'bookingDate', 'checkInDate', 'checkOutDate'].forEach((field) => {
            if (sanitizedFormData[field] === '') {
                sanitizedFormData[field] = null;
            }
        });

        const payload = objectToFormData(sanitizedFormData);

        setIsSubmitting(true);
        axios
            .post(route('rooms.store.booking'), payload, {
                headers: { 'Content-Type': 'multipart/form-data' },
            })
            .then((res) => {
                enqueueSnackbar('Booking submitted successfully', { variant: 'success' });
                // Redirect or show success
                router.visit(route('booking.payment', { invoice_no: res.data.invoice_id }));
            })
            .catch((err) => {
                console.error('Submit error:', err);
                if (err.response && err.response.data) {
                    console.error('Validation errors:', err.response.data);
                }
                // Optionally show backend validation errors
            })
            .finally(() => {
                setIsSubmitting(false);
            });
    };

    const renderStepContent = (step) => {
        switch (step) {
            case 0:
                return <BookingDetails formData={formData} handleChange={handleChange} errors={errors} guestTypes={guestTypes} onAddGuest={() => setShowGuestModal(true)} />;
            case 1:
                return <RoomSelection formData={formData} handleChange={handleChange} errors={errors} />;
            case 2:
                return <ChargesInfo formData={formData} handleChange={handleChange} />;
            case 3:
                return <UploadInfo formData={formData} handleChange={handleChange} handleFileChange={handleFileChange} handleFileRemove={handleFileRemove} />;
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
                <Box sx={{ display: 'flex', alignItems: 'center', pt: 2, ml: 2 }}>
                    <IconButton style={{ color: '#063455' }} onClick={() => router.visit(route('rooms.dashboard'))}>
                        <ArrowBack />
                    </IconButton>
                    <h2 className="mb-0 fw-normal" style={{ color: '#063455', fontSize: '30px' }}>
                        Room Booking
                    </h2>
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
                                <Button style={{ backgroundColor: '#063455', color: '#fff' }} disabled={isSubmitting} loading={isSubmitting} loadingPosition="start" onClick={activeStep === steps.length - 1 ? handleSubmit : handleNext}>
                                    {activeStep === steps.length - 1 ? 'Finish' : 'Next'}
                                </Button>
                            </Box>
                        </Box>
                    </Box>
                </Box>
            </div>
            <GuestCreateModal open={showGuestModal} onClose={() => setShowGuestModal(false)} onSuccess={handleGuestCreated} guestTypes={guestTypes} />
        </>
    );
};
export default RoomBooking;

const BookingDetails = ({ formData, handleChange, errors, guestTypes, onAddGuest }) => {
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
                <Grid item xs={12} sm={4}>
                    <TextField label="Booking No." name="bookingNo" value={formData.bookingNo} inputProps={{ readOnly: true }} fullWidth />
                </Grid>
                <Grid item xs={12} sm={4}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DatePicker
                            label="Booking Date"
                            format="DD-MM-YYYY"
                            disablePast
                            value={formData.bookingDate ? dayjs(formData.bookingDate) : null}
                            onChange={(newValue) => handleChange({ target: { name: 'bookingDate', value: newValue ? newValue.format('YYYY-MM-DD') : '' } })}
                            slotProps={{
                                textField: { fullWidth: true, name: 'bookingDate', onClick: (e) => e.target.closest('.MuiFormControl-root').querySelector('button')?.click() },
                                actionBar: { actions: ['clear', 'today', 'cancel', 'accept'] },
                            }}
                        />
                    </LocalizationProvider>
                </Grid>
                <Grid item xs={6} sm={4}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DatePicker
                            label="Check-In Date"
                            format="DD-MM-YYYY"
                            minDate={dayjs().subtract(1, 'day')}
                            value={formData.checkInDate ? dayjs(formData.checkInDate) : null}
                            onChange={(newValue) => handleChange({ target: { name: 'checkInDate', value: newValue ? newValue.format('YYYY-MM-DD') : '' } })}
                            slotProps={{
                                textField: { fullWidth: true, name: 'checkInDate', onClick: (e) => e.target.closest('.MuiFormControl-root').querySelector('button')?.click() },
                                actionBar: { actions: ['clear', 'today', 'cancel', 'accept'] },
                            }}
                        />
                    </LocalizationProvider>
                </Grid>
                <Grid item xs={6} sm={4}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DatePicker
                            label="Check-Out Date"
                            format="DD-MM-YYYY"
                            disablePast
                            value={formData.checkOutDate ? dayjs(formData.checkOutDate) : null}
                            minDate={formData.checkInDate ? dayjs(formData.checkInDate).add(1, 'day') : null}
                            onChange={(newValue) => handleChange({ target: { name: 'checkOutDate', value: newValue ? newValue.format('YYYY-MM-DD') : '' } })}
                            slotProps={{
                                textField: { fullWidth: true, name: 'checkOutDate', onClick: (e) => e.target.closest('.MuiFormControl-root').querySelector('button')?.click() },
                                actionBar: { actions: ['clear', 'today', 'cancel', 'accept'] },
                            }}
                        />
                    </LocalizationProvider>
                </Grid>
                <Grid item xs={6} sm={4}>
                    <TextField label="Arrival Details" name="arrivalDetails" value={formData.arrivalDetails} onChange={handleChange} fullWidth multiline rows={1} />
                </Grid>
                <Grid item xs={6} sm={4}>
                    <TextField label="Departure Details" name="departureDetails" value={formData.departureDetails} onChange={handleChange} fullWidth multiline rows={1} />
                </Grid>
                <Grid item xs={12}>
                    <FormLabel>Booking Type</FormLabel>
                    <RadioGroup
                        row
                        name="bookingType"
                        value={formData.bookingType}
                        onChange={(e) => {
                            handleChange(e);
                            handleChange({ target: { name: 'guest', value: null } });
                            handleChange({ target: { name: 'familyMember', value: '' } });
                            setOptions([]);
                        }}
                    >
                        <FormControlLabel value="0" control={<Radio />} label="Member" />
                        <FormControlLabel value="2" control={<Radio />} label="Corporate Member" />
                        {guestTypes.map((type) => (
                            <FormControlLabel key={type.id} value={`guest-${type.id}`} control={<Radio />} label={type.name} />
                        ))}
                    </RadioGroup>
                </Grid>

                <Grid item xs={12} sm={12} display="flex" alignItems="center" gap={1}>
                    <Box sx={{ flexGrow: 1 }}>
                        <Autocomplete
                            open={open}
                            onOpen={() => setOpen(true)}
                            onClose={() => setOpen(false)}
                            isOptionEqualToValue={(option, value) => option.id === value?.id}
                            getOptionLabel={(option) => option.label || ''}
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
                                                <Chip // Chip for status
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
                                </li>
                            )}
                        />
                    </Box>
                    <Button variant="contained" onClick={onAddGuest} sx={{ backgroundColor: '#063455', color: '#fff', height: '56px' }}>
                        + Add
                    </Button>
                </Grid>
                <Grid item xs={12} sm={12} gap={1}>
                    {formData.guest && (
                        <Box sx={{ mt: 1, p: 1, border: '1px solid #ccc', borderRadius: 1 }}>
                            <Typography variant="h5" sx={{ mb: 1 }}>
                                Member Information
                            </Typography>
                            <Typography variant="body1">{formData.guest?.booking_type == 'member' ? `Member # ${formData.guest?.membership_no}` : `Guest # ${formData.guest?.customer_no}`}</Typography>
                            <Typography variant="body1">Email: {formData.guest?.email}</Typography>
                            <Typography variant="body1">Phone: {formData.guest?.phone}</Typography>
                            <Typography variant="body1">Cnic / Passport: {formData.guest?.cnic}</Typography>
                            <Typography variant="body1">Address: {formData.guest?.address}</Typography>
                            {formData.guest?.booking_type == 'member' || formData.guest?.booking_type == '2' || formData.bookingType == '2' ? (
                                <FormControl fullWidth sx={{ mt: 2 }}>
                                    <InputLabel>Select Family Member</InputLabel>
                                    <Select value={formData.familyMember} onChange={handleChange} name="familyMember" label="Select Family Member">
                                        <MenuItem value="">Select Family Member</MenuItem>
                                        {familyMembers?.map((member) => (
                                            <MenuItem key={member.id} value={member.id}>
                                                {member.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            ) : (
                                ''
                            )}
                        </Box>
                    )}
                </Grid>
            </Grid>
            <Typography sx={{ my: 3 }} variant="h6">
                Guest Info
            </Typography>
            <Grid container spacing={2}>
                <Grid item xs={12} sm={3}>
                    <TextField label="Booked By" name="bookedBy" value={formData.bookedBy} onChange={handleChange} fullWidth />
                </Grid>
                <Grid item xs={6} sm={3}>
                    <TextField label="Guest First Name" name="guestFirstName" value={formData.guestFirstName} onChange={handleChange} fullWidth />
                </Grid>
                <Grid item xs={6} sm={3}>
                    <TextField label="Guest Last Name" name="guestLastName" value={formData.guestLastName} onChange={handleChange} fullWidth />
                </Grid>
                <Grid item xs={6} sm={3}>
                    <TextField label="Company / Institution" name="company" value={formData.company} onChange={handleChange} fullWidth />
                </Grid>
                <Grid item xs={6} sm={4}>
                    <TextField label="Address" name="address" value={formData.address} onChange={handleChange} fullWidth />
                </Grid>
                <Grid item xs={6} sm={2}>
                    <TextField label="Country" name="country" value={formData.country} onChange={handleChange} fullWidth />
                </Grid>
                <Grid item xs={6} sm={2}>
                    <TextField label="City" name="city" value={formData.city} onChange={handleChange} fullWidth />
                </Grid>
                <Grid item xs={4}>
                    <TextField label="Mobile" name="mobile" value={formData.mobile} onChange={(e) => handleChange({ target: { name: 'mobile', value: e.target.value.replace(/\D/g, '') } })} inputProps={{ maxLength: 11 }} fullWidth />
                </Grid>
                <Grid item xs={6} sm={4}>
                    <TextField label="Email" name="email" value={formData.email} onChange={handleChange} fullWidth />
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
                        placeholder="XXXXX-XXXXXXX-X"
                    />
                </Grid>
                <Grid item xs={6} sm={4}>
                    <TextField label="Enter Relationship" name="guestRelation" value={formData.guestRelation} onChange={handleChange} fullWidth />
                </Grid>
                <Grid item xs={12} sm={4}>
                    <TextField label="Accompanied Guest Name" name="accompaniedGuest" value={formData.accompaniedGuest} onChange={handleChange} fullWidth />
                </Grid>
            </Grid>
        </>
    );
};

const RoomSelection = ({ formData, handleChange, errors }) => {
    const { props } = usePage();

    // Automatically calculate nights between check-in and check-out
    // Automatically calculate nights between check-in and check-out
    const nights = formData.checkInDate && formData.checkOutDate ? Math.max(1, dayjs(formData.checkOutDate).diff(dayjs(formData.checkInDate), 'day')) : 0;

    // Find charge by selected booking category
    const selectedCategory = props.roomCategories.find((cat) => cat.id == formData.bookingCategory);
    const matchedCharge = props.room.category_charges.find((charge) => charge.room_category_id == formData.bookingCategory);

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
                <Typography variant="h6">
                    <b>Selected Room:</b> {props.room.name} ({props.room.room_type.name})
                </Typography>
            </Grid>

            <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                    <InputLabel>Booking Category</InputLabel>
                    <Select value={formData.bookingCategory} onChange={handleChange} name="bookingCategory" label="Booking Category">
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
            <Grid item xs={3}>
                <TextField label="No. of Nights" name="nights" value={formData.nights} fullWidth InputProps={{ readOnly: true }} disabled />
            </Grid>
            <Grid item xs={3}>
                <TextField label="Room Charges" name="roomCharge" value={formData.roomCharge} fullWidth InputProps={{ readOnly: true }} disabled />
            </Grid>
            <Grid container spacing={2} item xs={12}>
                <Grid item xs={3}>
                    <TextField type="number" label="Security Deposit" placeholder="Amount" name="securityDeposit" value={formData.securityDeposit} onChange={handleChange} onKeyDown={(e) => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()} fullWidth />
                </Grid>
                <Grid item xs={3}>
                    <TextField type="number" label="Advance Paid" placeholder="Amount" name="advanceAmount" value={formData.advanceAmount} onChange={handleChange} onKeyDown={(e) => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()} fullWidth />
                </Grid>
                {(Number(formData.securityDeposit) > 0 || Number(formData.advanceAmount) > 0) && (
                    <>
                        <Grid item xs={3}>
                            <FormControl fullWidth>
                                <InputLabel>Payment Mode</InputLabel>
                                <Select name="paymentMode" value={formData.paymentMode || 'Cash'} label="Payment Mode" onChange={handleChange}>
                                    <MenuItem value="Cash">Cash</MenuItem>
                                    <MenuItem value="Credit Card">Credit Card</MenuItem>
                                    <MenuItem value="Bank Transfer">Bank Transfer</MenuItem>
                                    <MenuItem value="Cheque">Cheque</MenuItem>
                                    <MenuItem value="Online">Online</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        {formData.paymentMode !== 'Cash' && (
                            <Grid item xs={3}>
                                <TextField label="Payment Account / Reference" name="paymentAccount" placeholder="Bank Name - Account No / Trx ID" value={formData.paymentAccount || ''} onChange={handleChange} fullWidth />
                            </Grid>
                        )}
                    </>
                )}
            </Grid>
        </Grid>
    );
};

const ChargesInfo = ({ formData, handleChange }) => {
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

const UploadInfo = ({ formData, handleChange, handleFileChange, handleFileRemove }) => {
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
