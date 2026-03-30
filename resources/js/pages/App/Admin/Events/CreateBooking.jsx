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

const steps = ['Booking Details', 'Charges', 'Upload'];

const EventBooking = ({ bookingNo, editMode = false, bookingData = null }) => {
    // Main state for booking type
    // const [open, setOpen] = useState(true);
    const [activeStep, setActiveStep] = useState(0);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Check for completion mode from URL
    const isCompletionMode = new URLSearchParams(window.location.search).get('mode') === 'complete';

    const [guestTypes, setGuestTypes] = useState([]);
    const [showGuestModal, setShowGuestModal] = useState(false);

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

    const [formData, setFormData] = useState({
        bookingNo: bookingNo || '',
        bookingDate: new Date().toISOString().split('T')[0],
        bookingType: 0,
        persons: 0,
        guest: '',
        familyMember: '',
        perDayCharge: '',
        nights: '',
        roomCharge: '',
        bookedBy: '',
        natureOfEvent: '',
        eventDate: '',
        eventTimeFrom: '',
        eventTimeTo: '',
        venue: '',
        discountType: 'fixed',
        discount: '',
        totalOtherCharges: '',
        totalMiniBar: '',
        grandTotal: '',
        selectedMenu: '',
        menuAmount: 0,
        menuItems: [],
        numberOfGuests: 1,
        mini_bar_items: [{ item: '', amount: '', qty: '', total: '' }],
        menu_addons: [{ type: '', details: '', amount: '', is_complementary: false }],
        other_charges: [{ type: '', details: '', amount: '', is_complementary: false }],
        documents: [],
        previewFiles: [],
        notes: '',
        advanceAmount: '',
        securityDeposit: '',
        paymentOption: 'advance',
        completionPaymentAmount: '',
        paymentMode: 'Cash',
        paymentAccount: '',
    });

    const [paymentAccounts, setPaymentAccounts] = useState([]);
    const [paymentAccountsLoading, setPaymentAccountsLoading] = useState(false);

    useEffect(() => {
        const paymentMethodByMode = {
            Cash: 'cash',
            'Bank Transfer': 'bank_transfer',
            'Credit Card': 'credit_card',
            Online: 'online',
        };

        const payment_method = paymentMethodByMode[formData.paymentMode] || 'cash';

        setPaymentAccountsLoading(true);
        axios
            .get(route('api.finance.payment-accounts'), { params: { payment_method } })
            .then((res) => setPaymentAccounts(Array.isArray(res.data) ? res.data : []))
            .catch(() => setPaymentAccounts([]))
            .finally(() => setPaymentAccountsLoading(false));
    }, [formData.paymentMode]);

    // Auto-populate form from URL parameters (from calendar)
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const date = urlParams.get('date');
        const timeFrom = urlParams.get('time_from');
        const timeTo = urlParams.get('time_to');
        const venue = urlParams.get('venue');

        if (date || timeFrom || timeTo || venue) {
            setFormData((prev) => ({
                ...prev,
                ...(date && { eventDate: date }),
                // ...(timeFrom && { eventTimeFrom: decodeURIComponent(timeFrom) }),
                // ...(timeTo && { eventTimeTo: decodeURIComponent(timeTo) }),
                ...(venue && { venue: parseInt(venue) }),
            }));
        }
    }, []);

    // Populate form data when in edit mode
    useEffect(() => {
        if (editMode && bookingData) {
            // Prepare guest object for member/customer
            let guestObject = null;
            if (bookingData.member) {
                guestObject = {
                    id: bookingData.member.id,
                    membership_no: bookingData.member.membership_no,
                    name: bookingData.name,
                    email: bookingData.email,
                    cnic: bookingData.cnic,
                    address: bookingData.address,
                    phone: bookingData.mobile,
                    booking_type: 'member',
                };
            } else if (bookingData.corporateMember) {
                guestObject = {
                    id: bookingData.corporateMember.id,
                    membership_no: bookingData.corporateMember.membership_no,
                    name: bookingData.name,
                    email: bookingData.email,
                    cnic: bookingData.cnic,
                    address: bookingData.address,
                    phone: bookingData.mobile,
                    booking_type: '2', // Corporate
                };
            } else if (bookingData.customer) {
                const guestTypeId = bookingData.customer.guest_type_id;
                guestObject = {
                    id: bookingData.customer.id,
                    customer_no: bookingData.customer.customer_no,
                    name: bookingData.name,
                    email: bookingData.email,
                    cnic: bookingData.cnic,
                    address: bookingData.address,
                    phone: bookingData.mobile,
                    booking_type: guestTypeId ? `guest` : 'customer', // Mark as generic guest if type exists
                    guest_type_id: guestTypeId,
                };
            }

            // Determine booking type logic
            let resolvedBookingType = bookingData.booking_type || 0;
            if (bookingData.customer?.guest_type_id) {
                resolvedBookingType = `guest-${bookingData.customer.guest_type_id}`;
            }

            setFormData({
                bookingNo: bookingData.booking_no || '',
                bookingDate: bookingData.booking_date || new Date().toISOString().split('T')[0],
                bookingType: resolvedBookingType,
                guest: guestObject,
                familyMember: bookingData.family_id || '',
                bookedBy: bookingData.booked_by || '',
                natureOfEvent: bookingData.nature_of_event || '',
                eventDate: bookingData.event_date || '',
                eventTimeFrom: bookingData.event_time_from || '',
                eventTimeTo: bookingData.event_time_to || '',
                venue: bookingData.event_venue_id || '',
                numberOfGuests: bookingData.no_of_guests || 1,
                selectedMenu: bookingData.menu?.event_menu_id || '',
                menuAmount: bookingData.menu?.amount || 0,
                menuItems: bookingData.menu?.items || [],
                menu_addons:
                    Array.isArray(bookingData.menuAddOns) && bookingData.menuAddOns.length > 0
                        ? bookingData.menuAddOns.map((addon) => ({
                              type: addon.type || '',
                              details: addon.details || '',
                              amount: addon.amount || '',
                              is_complementary: Boolean(addon.is_complementary),
                          }))
                        : [{ type: '', details: '', amount: '', is_complementary: false }],
                other_charges:
                    Array.isArray(bookingData.otherCharges) && bookingData.otherCharges.length > 0
                        ? bookingData.otherCharges.map((charge) => ({
                              type: charge.type || '',
                              details: charge.details || '',
                              amount: charge.amount || '',
                              is_complementary: Boolean(charge.is_complementary),
                          }))
                        : [{ type: '', details: '', amount: '', is_complementary: false }],
                discountType: bookingData.reduction_type || 'fixed',
                discount: bookingData.reduction_amount || '',
                grandTotal: bookingData.total_price || '',
                notes: bookingData.additional_notes || '',
                documents: [],
                previewFiles: (() => {
                    try {
                        return bookingData.booking_docs ? JSON.parse(bookingData.booking_docs) : [];
                    } catch (e) {
                        console.error('Error parsing booking_docs:', e);
                        return [];
                    }
                })(),
                // Keep other fields with defaults
                persons: 0,
                perDayCharge: '',
                nights: '',
                roomCharge: '',
                totalOtherCharges: '',
                totalMiniBar: '',
                mini_bar_items: [{ item: '', amount: '', qty: '', total: '' }],
                advanceAmount: bookingData.advance_amount || '',
                securityDeposit: bookingData.security_deposit || '',
                paymentOption: 'advance',
                completionPaymentAmount: '',
                paymentMode: 'Cash',
                paymentAccount: '',
            });
        }
    }, [editMode, bookingData]);

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
            // Auto-fill guest details
            bookedBy: newGuest.name,
            guestFirstName: newGuest.name.split(' ')[0] || '',
            guestLastName: newGuest.name.split(' ').slice(1).join(' ') || '',
            mobile: newGuest.contact,
            email: newGuest.email,
            address: newGuest.address,
            cnic: newGuest.cnic,
        }));
        setShowGuestModal(false);
    };

    const handleNext = () => {
        const newErrors = {};

        // Step 0: Booking Details
        if (activeStep === 0) {
            // Member/Guest validation
            if (!formData.guest || Object.keys(formData.guest).length === 0) {
                newErrors.guest = 'Member is required';
            }

            // Event Details validation
            if (!formData.bookedBy) {
                newErrors.bookedBy = 'Booked By is required';
            }
            if (!formData.natureOfEvent) {
                newErrors.natureOfEvent = 'Nature of Event is required';
            }
            if (!formData.eventDate) {
                newErrors.eventDate = 'Event Date is required';
            }
            if (!formData.eventTimeFrom) {
                newErrors.eventTimeFrom = 'Timing (From) is required';
            }
            if (!formData.eventTimeTo) {
                newErrors.eventTimeTo = 'Timing (To) is required';
            }
            if (!formData.venue) {
                newErrors.venue = 'Venue is required';
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
            const updatedPreviewFiles = [...(prev.previewFiles || [])];
            const removedFile = updatedPreviewFiles[index];

            // Remove from preview files
            updatedPreviewFiles.splice(index, 1);

            // Update documents array (only keep File objects, not string paths)
            const updatedDocuments = (prev.documents || []).filter((doc) => doc instanceof File);

            return {
                ...prev,
                previewFiles: updatedPreviewFiles,
                documents: updatedDocuments,
            };
        });
    };

    const handleSubmit = () => {
        const newErrors = {};

        // Final validation before submission
        if (!formData.guest || Object.keys(formData.guest).length === 0) {
            newErrors.guest = 'Member is required';
        }

        if (!isCompletionMode && (formData.paymentOption || 'advance') === 'advance' && Number(formData.advanceAmount || 0) <= 0) {
            newErrors.advanceAmount = 'Advance amount is required';
        }

        if (isCompletionMode) {
            const alreadyPaid = bookingData?.invoice
                ? Number(bookingData.invoice.paid_amount ?? 0) + Number(bookingData.invoice.advance_payment ?? 0) + Number(bookingData.security_deposit ?? 0)
                : Number(formData.advanceAmount ?? 0) + Number(formData.securityDeposit ?? 0);
            const remainingDue = Math.max(0, Number(formData.grandTotal || 0) - alreadyPaid);
            if (remainingDue > 0 && Number(formData.completionPaymentAmount || 0) < remainingDue) {
                newErrors.completionPaymentAmount = 'Full payment is required to complete the event';
            }
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        // Proceed with actual submission
        const formDataToSubmit = { ...formData };

        // Separate new files from existing document paths
        const newFiles = formDataToSubmit.documents || [];
        const existingDocs = [];

        // Process previewFiles to separate new files from existing paths
        if (formDataToSubmit.previewFiles) {
            formDataToSubmit.previewFiles.forEach((file) => {
                if (typeof file === 'string') {
                    // It's an existing document path
                    existingDocs.push(file);
                }
                // New File objects are already in formDataToSubmit.documents
            });
        }

        // Add existing documents to form data
        formDataToSubmit.existingDocuments = existingDocs;

        // Remove previewFiles as it's not needed on backend
        delete formDataToSubmit.previewFiles;

        const payload = objectToFormData(formDataToSubmit);

        if (isCompletionMode) {
            payload.append('status', 'completed');
        }

        setIsSubmitting(true);

        const url = editMode ? route('events.booking.update', { id: bookingData.id }) : route('events.booking.store');
        const method = editMode ? 'put' : 'post';

        axios
            .post(url, payload)
            .then((res) => {
                const successMessage = isCompletionMode ? 'Event completed successfully' : editMode ? 'Booking updated successfully' : 'Booking submitted successfully';
                enqueueSnackbar(successMessage, { variant: 'success' });

                if (editMode) {
                    // Redirect back to events dashboard after edit
                    router.visit(route('events.dashboard'));
                } else {
                    if ((formData.paymentOption || 'advance') === 'full') {
                        router.visit(route('events.dashboard'));
                    } else {
                        // Redirect to payment for new bookings
                        router.visit(route('booking.payment', { invoice_no: res.data.invoice_no }));
                    }
                }
            })
            .catch((err) => {
                console.error('Submit error:', err);
                if (err.response && err.response.status === 422) {
                    setErrors(err.response.data.errors);
                    enqueueSnackbar('Please correct the errors in the form.', { variant: 'error' });
                } else if (err.response && err.response.data && err.response.data.message) {
                    // Check if there are specific errors in the message object (like from ValidationException withMessages)
                    if (err.response.data.errors) {
                        setErrors(err.response.data.errors);
                        const firstError = Object.values(err.response.data.errors)[0];
                        enqueueSnackbar(Array.isArray(firstError) ? firstError[0] : firstError, { variant: 'error' });
                    } else {
                        enqueueSnackbar(err.response.data.message, { variant: 'error' });
                    }
                } else {
                    enqueueSnackbar('Failed to ' + (editMode ? 'update' : 'create') + ' booking', { variant: 'error' });
                }
            })
            .finally(() => {
                setIsSubmitting(false);
            });
    };

    const renderStepContent = (step) => {
        switch (step) {
            case 0:
                return <BookingDetails formData={formData} handleChange={handleChange} errors={errors} editMode={editMode} isCompletionMode={isCompletionMode} onAddGuest={() => setShowGuestModal(true)} />;
            case 1:
                return (
                    <ChargesInfo
                        formData={formData}
                        handleChange={handleChange}
                        errors={errors}
                        isCompletionMode={isCompletionMode}
                        editMode={editMode}
                        bookingData={bookingData}
                        paymentAccounts={paymentAccounts}
                        paymentAccountsLoading={paymentAccountsLoading}
                    />
                );
            case 2:
                return <UploadInfo formData={formData} handleChange={handleChange} handleFileChange={handleFileChange} handleFileRemove={handleFileRemove} isCompletionMode={isCompletionMode} />;
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
                <Box sx={{ display: 'flex', alignItems: 'center', ml: 5, pt: 3 }}>
                    <IconButton style={{ color: '#063455' }} onClick={() => router.visit(route('events.dashboard'))}>
                        <ArrowBack />
                    </IconButton>
                    <Typography style={{ color: '#063455', fontSize: '30px', fontWeight: '700' }}>Event Booking</Typography>
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
                    {/* <div className="mx-4 my-4 p-4 bg-white rounded border"> */}
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
                                <Button style={{ backgroundColor: '#063455', color: '#fff' }} onClick={activeStep === steps.length - 1 ? handleSubmit : handleNext} disabled={isSubmitting} loading={isSubmitting} loadingPosition="start">
                                    {activeStep === steps.length - 1 ? (isCompletionMode ? 'Complete Event' : 'Finish') : 'Next'}
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
export default EventBooking;

const BookingDetails = ({ formData, handleChange, errors, editMode, onAddGuest, isCompletionMode }) => {
    const { props } = usePage();

    const [familyMembers, setFamilyMembers] = useState([]);
    // Autocomplete states
    const [open, setOpen] = useState(false);
    const [options, setOptions] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (formData.guest) {
            if (formData.guest.booking_type == 'guest') {
                setFamilyMembers([]);
                return;
            }

            axios
                .get(route('admin.family-members', { id: formData.guest?.id }), {
                    params: { type: formData.bookingType },
                })
                .then((res) => {
                    setFamilyMembers(res.data.results);
                })
                .catch((err) => {
                    setFamilyMembers([]);
                });
        }
    }, [formData.guest, formData.bookingType]);

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
                {/* {JSON.stringify(formData.guest)} */}
                <Grid item xs={12} sm={3}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DatePicker
                            label="Booking Date"
                            format="DD-MM-YYYY"
                            value={formData.bookingDate ? dayjs(formData.bookingDate) : null}
                            onChange={(newValue) => handleChange({ target: { name: 'bookingDate', value: newValue ? newValue.format('YYYY-MM-DD') : '' } })}
                            slotProps={{
                                textField: {
                                    fullWidth: true,
                                    name: 'bookingDate',
                                    onClick: (e) => e.target.closest('.MuiFormControl-root').querySelector('button')?.click(),
                                },
                                actionBar: { actions: ['clear', 'today', 'cancel', 'accept'] },
                            }}
                        />
                    </LocalizationProvider>
                </Grid>
                <Grid item xs={6}>
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
                        <FormControlLabel value="0" control={<Radio disabled={isCompletionMode} />} label="Member" />
                        <FormControlLabel value="2" control={<Radio disabled={isCompletionMode} />} label="Corporate Member" />
                        {guestTypes.map((type) => (
                            <FormControlLabel key={type.id} value={`guest-${type.id}`} control={<Radio />} label={type.name} />
                        ))}
                    </RadioGroup>
                </Grid>

                <Grid item xs={12} sm={12} display="flex" gap={1}>
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
                            disabled={isCompletionMode}
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
                                        <Box display="flex" justifyContent="space-between">
                                            <Typography variant="caption">{option.full_name || option.name}</Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {option.cnic_no || option.cnic || option.mobile_number_a || option.contact}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </li>
                            )}
                        />
                    </Box>
                    <Button variant="contained" onClick={onAddGuest} sx={{ backgroundColor: '#063455', color: '#fff', height: '56px', minWidth: '100px' }}>
                        + Add
                    </Button>
                </Grid>

                <Grid item xs={12}>
                    {formData.guest && (
                        <Box sx={{ mt: 1, p: 1, border: '1px solid #ccc', borderRadius: 1 }}>
                            <Typography variant="h5" sx={{ mb: 1 }}>
                                Member Information
                            </Typography>
                            {formData.guest?.name}
                            <Typography variant="body1">{formData.guest?.booking_type == 'member' ? `Member # ${formData.guest?.membership_no}` : formData.guest?.booking_type == '2' || formData.bookingType == 2 ? `Corporate # ${formData.guest?.membership_no}` : `Guest # ${formData.guest?.customer_no}`}</Typography>
                            <Typography variant="body1">Email: {formData.guest?.email || formData.guest?.personal_email}</Typography>
                            <Typography variant="body1">Phone: {formData.guest?.phone || formData.guest?.mobile_number_a}</Typography>
                            <Typography variant="body1">Usage: {formData.guest?.usage_type || 'N/A'}</Typography>
                            <Typography variant="body1">Cnic / Passport: {formData.guest?.cnic || formData.guest?.cnic_no}</Typography>
                            <Typography variant="body1">Address: {formData.guest?.address || formData.guest?.current_address}</Typography>
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
                Event Details
            </Typography>
            <Grid container spacing={2}>
                <Grid item xs={12} sm={3}>
                    <TextField label="Booked By*" name="bookedBy" value={formData.bookedBy} onChange={handleChange} fullWidth error={!!errors.bookedBy} helperText={errors.bookedBy} disabled={isCompletionMode} />
                </Grid>
                <Grid item xs={6} sm={3}>
                    <TextField label="Nature of Event*" name="natureOfEvent" value={formData.natureOfEvent} onChange={handleChange} fullWidth error={!!errors.natureOfEvent} helperText={errors.natureOfEvent} disabled={isCompletionMode} />
                </Grid>
                <Grid item xs={6} sm={3}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DatePicker
                            label="Event Date*"
                            format="DD-MM-YYYY"
                            value={formData.eventDate ? dayjs(formData.eventDate) : null}
                            onChange={(newValue) => handleChange({ target: { name: 'eventDate', value: newValue ? newValue.format('YYYY-MM-DD') : '' } })}
                            disabled={isCompletionMode}
                            slotProps={{
                                textField: {
                                    fullWidth: true,
                                    name: 'eventDate',
                                    error: !!errors.eventDate,
                                    helperText: errors.eventDate,
                                    onClick: (e) => e.target.closest('.MuiFormControl-root').querySelector('button')?.click(),
                                },
                                actionBar: { actions: ['clear', 'today', 'cancel', 'accept'] },
                            }}
                        />
                    </LocalizationProvider>
                </Grid>
                <Grid item xs={6} sm={3}>
                    <TextField label="Timing (From)*" type="time" name="eventTimeFrom" value={formData.eventTimeFrom} onChange={handleChange} fullWidth InputLabelProps={{ shrink: true }} error={!!errors.eventTimeFrom} helperText={errors.eventTimeFrom} onClick={(e) => !isCompletionMode && e.target.showPicker && e.target.showPicker()} disabled={isCompletionMode} />
                </Grid>
                <Grid item xs={6} sm={3}>
                    <TextField label="Timing (To)*" type="time" name="eventTimeTo" value={formData.eventTimeTo} onChange={handleChange} fullWidth InputLabelProps={{ shrink: true }} error={!!errors.eventTimeTo} helperText={errors.eventTimeTo} onClick={(e) => !isCompletionMode && e.target.showPicker && e.target.showPicker()} disabled={isCompletionMode} />
                </Grid>
                <Grid item xs={6} sm={4}>
                    <FormControl fullWidth error={!!errors.venue}>
                        <InputLabel>Venue*</InputLabel>
                        <Select value={Number(formData.venue)} onChange={handleChange} name="venue" label="Venue*" disabled={isCompletionMode}>
                            <MenuItem value="">Choose Venue</MenuItem>
                            {props.eventVenues?.map((venue) => (
                                <MenuItem key={venue.id} value={venue.id}>
                                    {venue.name}
                                </MenuItem>
                            ))}
                        </Select>
                        {errors.venue && (
                            <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                                {errors.venue}
                            </Typography>
                        )}
                    </FormControl>
                </Grid>
            </Grid>
        </>
    );
};

const ChargesInfo = ({ formData, handleChange, errors, isCompletionMode, editMode, bookingData, paymentAccounts, paymentAccountsLoading }) => {
    const { props } = usePage();

    // Handle menu selection
    const handleMenuChange = (menuId) => {
        const selectedMenu = props.eventMenus?.find((menu) => menu.id == menuId);
        if (selectedMenu) {
            handleChange({ target: { name: 'selectedMenu', value: menuId } });
            handleChange({ target: { name: 'menuAmount', value: selectedMenu.amount } });
            handleChange({ target: { name: 'menuItems', value: selectedMenu.items || [] } });
        } else {
            handleChange({ target: { name: 'selectedMenu', value: '' } });
            handleChange({ target: { name: 'menuAmount', value: 0 } });
            handleChange({ target: { name: 'menuItems', value: [] } });
        }
    };

    // Handle menu item changes
    const handleMenuItemChange = (index, id) => {
        const item = props.menuCategoryItems?.find((i) => i.id === id);
        const updated = [...formData.menuItems];
        // Ensure we preserve the structure expected by Select (menu_category_id)
        updated[index] = item ? { ...item, menu_category_id: item.id } : { id: '', name: '' };
        handleChange({ target: { name: 'menuItems', value: updated } });
    };

    // Add new menu item
    const addMenuItem = () => {
        const newItem = { id: '', name: '' };
        handleChange({ target: { name: 'menuItems', value: [...formData.menuItems, newItem] } });
    };

    // Remove menu item
    const removeMenuItem = (index) => {
        if (formData.menuItems.length <= 1) return;
        const updated = [...formData.menuItems];
        updated.splice(index, 1);
        handleChange({ target: { name: 'menuItems', value: updated } });
    };

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

    const handleMenuAddOnChange = (index, field, value) => {
        const updated = [...formData.menu_addons];
        const item = { ...updated[index] };

        if (field === 'type') {
            const selected = props.menuAddOnItems.find((addon) => addon.name === value);
            item.type = value;
            item.amount = selected ? selected.amount : '';
        } else {
            item[field] = value;
        }

        updated[index] = item;
        handleChange({ target: { name: 'menu_addons', value: updated } });
    };

    const addMenuAddOn = () => {
        const newAddOn = { type: '', details: '', amount: '', is_complementary: false };
        handleChange({ target: { name: 'menu_addons', value: [...formData.menu_addons, newAddOn] } });
    };

    const removeMenuAddOn = (index) => {
        const updated = formData.menu_addons.filter((_, i) => i !== index);
        handleChange({ target: { name: 'menu_addons', value: updated } });
    };

    const removeOtherCharge = (index) => {
        const updated = formData.other_charges.filter((_, i) => i !== index);
        handleChange({ target: { name: 'other_charges', value: updated } });
    };

    const calculateTotals = () => {
        const totalOther = formData.other_charges.reduce((sum, chg) => sum + (chg.is_complementary ? 0 : parseFloat(chg.amount) || 0), 0);
        const totalMenuAddOns = formData.menu_addons.reduce((sum, addon) => sum + (addon.is_complementary ? 0 : parseFloat(addon.amount) || 0), 0);
        const menuAmount = parseFloat(formData.menuAmount || 0);
        const numberOfGuests = parseInt(formData.numberOfGuests || 1);

        // Calculate per person menu charges (Menu + Add-Ons)
        const perPersonMenuCharges = menuAmount + totalMenuAddOns;
        const totalMenuCharges = perPersonMenuCharges * numberOfGuests;

        const discountVal = parseFloat(formData.discount || 0);
        const discountType = formData.discountType || 'fixed';

        const baseTotal = totalOther + totalMenuCharges;
        const discountAmount = discountType === 'percentage' ? (discountVal / 100) * baseTotal : discountVal;

        const grandTotal = baseTotal - discountAmount;

        return { totalOther, totalMenuAddOns, menuAmount, perPersonMenuCharges, totalMenuCharges, numberOfGuests, grandTotal };
    };

    useEffect(() => {
        const { totalOther, totalMenuAddOns, grandTotal } = calculateTotals();

        handleChange({ target: { name: 'totalOtherCharges', value: Math.round(totalOther) } });
        handleChange({ target: { name: 'grandTotal', value: Math.round(grandTotal) } });
    }, [formData.other_charges, formData.menu_addons, formData.discount, formData.discountType, formData.menuAmount, formData.numberOfGuests]);

    const { totalOther, totalMenuAddOns, menuAmount, perPersonMenuCharges, totalMenuCharges, numberOfGuests, grandTotal } = calculateTotals();

    const alreadyPaidAmount =
        editMode && bookingData?.invoice
            ? Number(bookingData.invoice.paid_amount ?? 0) + Number(bookingData.invoice.advance_payment ?? 0) + Number(bookingData.security_deposit ?? 0)
            : Number(formData.advanceAmount ?? 0) + Number(formData.securityDeposit ?? 0);
    const remainingDue = Math.max(0, Math.round(grandTotal) - alreadyPaidAmount);

    useEffect(() => {
        if (!isCompletionMode) return;
        const current = Number(formData.completionPaymentAmount ?? 0);
        if (current !== remainingDue) {
            handleChange({ target: { name: 'completionPaymentAmount', value: remainingDue } });
        }
    }, [isCompletionMode, remainingDue]);

    return (
        <Grid container spacing={2}>
            {/* Menu Selection Section */}
            <Grid item xs={12}>
                <Typography variant="h6">Event Menu</Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                    <InputLabel>Select Menu</InputLabel>
                    <Select value={formData.selectedMenu} label="Select Menu" onChange={(e) => handleMenuChange(e.target.value)} disabled={isCompletionMode}>
                        <MenuItem value="">Choose Menu</MenuItem>
                        {props.eventMenus?.map((menu) => (
                            <MenuItem key={menu.id} value={menu.id}>
                                {menu.name} - Rs. {menu.amount}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
                <TextField label="Menu Amount (Per Person)" type="number" value={formData.menuAmount} fullWidth disabled />
            </Grid>

            {/* Menu Items Section */}
            {formData.selectedMenu && formData.menuItems.length > 0 && (
                <>
                    <Grid item xs={12}>
                        <Typography variant="h6" sx={{ mb: 2 }}>
                            Menu Items
                        </Typography>
                    </Grid>

                    {formData.menuItems.map((item, index) => (
                        <Grid item xs={6} container key={index} alignItems="center" sx={{ mb: 1, ml: 0 }}>
                            <Grid item xs={11}>
                                <FormControl fullWidth>
                                    <InputLabel>Select Item</InputLabel>
                                    <Select value={item.menu_category_id || ''} onChange={(e) => handleMenuItemChange(index, e.target.value)}>
                                        {props.menuCategoryItems?.map((opt) => (
                                            <MenuItem key={opt.id} value={opt.id}>
                                                {opt.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={1}>
                                {formData.menuItems.length > 1 && (
                                    <IconButton onClick={() => removeMenuItem(index)} color="error">
                                        <CloseIcon />
                                    </IconButton>
                                )}
                            </Grid>
                        </Grid>
                    ))}

                    {/* <Grid item xs={12}>
                        <Button
                            onClick={addMenuItem}
                            style={{ backgroundColor: '#063455', color: '#fff' }} variant="contained"
                            sx={{ mt: 1 }}
                        >
                            Add Menu Item
                        </Button>
                    </Grid> */}
                </>
            )}

            {/* Menu Add-Ons Section */}
            <Grid item xs={12}>
                <Typography variant="h6" sx={{ mt: 3 }}>
                    Menu Add-Ons
                </Typography>
            </Grid>

            {formData.menu_addons.map((item, index) => (
                <React.Fragment key={index}>
                    <Grid item xs={3}>
                        <FormControl fullWidth>
                            <InputLabel>Add-On Type</InputLabel>
                            <Select value={item.type} label="Add-On Type" onChange={(e) => handleMenuAddOnChange(index, 'type', e.target.value)}>
                                <MenuItem value="">Select Add-On</MenuItem>
                                {props.menuAddOnItems?.map((addon, i) => (
                                    <MenuItem key={i} value={addon.name}>
                                        {addon.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={3}>
                        <TextField label="Details" fullWidth value={item.details} onChange={(e) => handleMenuAddOnChange(index, 'details', e.target.value)} />
                    </Grid>
                    <Grid item xs={2}>
                        <TextField label="Amount" type="number" fullWidth value={item.amount} onChange={(e) => handleMenuAddOnChange(index, 'amount', e.target.value)} />
                    </Grid>
                    <Grid item xs={3}>
                        <FormControlLabel control={<Checkbox checked={item.is_complementary} onChange={(e) => handleMenuAddOnChange(index, 'is_complementary', e.target.checked)} />} label="Complementary" />
                    </Grid>
                    <Grid item xs={1}>
                        <IconButton onClick={() => removeMenuAddOn(index)} color="error">
                            <CloseIcon />
                        </IconButton>
                    </Grid>
                </React.Fragment>
            ))}
            <Grid item xs={12}>
                <Button style={{ backgroundColor: '#063455', color: '#fff' }} variant="contained" onClick={addMenuAddOn}>
                    Add Menu Add-On
                </Button>
            </Grid>

            {/* Other Charges Section */}
            <Grid item xs={12}>
                <Typography variant="h6" sx={{ mt: 3 }}>
                    Other Charges
                </Typography>
            </Grid>

            {formData.other_charges.map((item, index) => (
                <React.Fragment key={index}>
                    <Grid item xs={3}>
                        <FormControl fullWidth>
                            <InputLabel>Charges Type</InputLabel>
                            <Select value={item.type} label="Charges Type" onChange={(e) => handleOtherChange(index, 'type', e.target.value)}>
                                <MenuItem value="">Select Type</MenuItem>
                                {props.chargesTypeItems?.map((type, i) => (
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
                    <Grid item xs={3}>
                        <FormControlLabel control={<Checkbox checked={item.is_complementary} onChange={(e) => handleOtherChange(index, 'is_complementary', e.target.checked)} />} label="Complementary" />
                    </Grid>
                    <Grid item xs={1}>
                        <IconButton onClick={() => removeOtherCharge(index)} color="error">
                            <CloseIcon />
                        </IconButton>
                    </Grid>
                </React.Fragment>
            ))}
            <Grid item xs={12}>
                <Button style={{ backgroundColor: '#063455', color: '#fff' }} variant="contained" onClick={() => handleChange({ target: { name: 'other_charges', value: [...formData.other_charges, { type: '', details: '', amount: '', is_complementary: false }] } })}>
                    Add More Charges
                </Button>
            </Grid>

            <Grid item xs={12}>
                <Typography variant="h6" sx={{ mt: 3 }}>
                    Number of Guests
                </Typography>
            </Grid>

            <Grid item xs={12} mt={3} sm={6}>
                <TextField label="Number of Guests" type="number" name="numberOfGuests" value={formData.numberOfGuests} onChange={handleChange} fullWidth inputProps={{ min: 1 }} />
            </Grid>

            {/* Summary Fields */}
            <Grid item xs={12}>
                <Typography variant="h6" sx={{ mt: 3 }}>
                    Summary
                </Typography>
            </Grid>
            <Grid item xs={2}>
                <TextField label="Number of Guests" value={numberOfGuests} fullWidth disabled />
            </Grid>
            <Grid item xs={2}>
                <TextField label="Menu Add-Ons (Per Person)" value={Math.round(totalMenuAddOns)} fullWidth disabled />
            </Grid>
            <Grid item xs={2}>
                <TextField label="Per Person Menu" value={Math.round(perPersonMenuCharges)} fullWidth disabled />
            </Grid>
            <Grid item xs={2}>
                <TextField label="Total Menu Charges" value={Math.round(totalMenuCharges)} fullWidth disabled />
            </Grid>
            <Grid item xs={2}>
                <TextField label="Other Charges" value={Math.round(totalOther)} fullWidth disabled />
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
                <TextField label="Grand Total" value={Math.round(grandTotal)} fullWidth disabled />
            </Grid>
            <Grid item xs={3}>
                <TextField label="Security Deposit" type="number" name="securityDeposit" value={formData.securityDeposit} onChange={handleChange} fullWidth disabled={isCompletionMode} />
            </Grid>
            <Grid item xs={3}>
                <TextField
                    label="Advance Amount"
                    type="number"
                    name="advanceAmount"
                    value={formData.advanceAmount}
                    onChange={handleChange}
                    fullWidth
                    disabled={isCompletionMode || formData.paymentOption === 'full'}
                    error={!!errors?.advanceAmount}
                    helperText={errors?.advanceAmount}
                />
            </Grid>
            {!isCompletionMode && (
                <Grid item xs={3}>
                    <FormControl fullWidth>
                        <InputLabel>Payment Option</InputLabel>
                        <Select
                            name="paymentOption"
                            value={formData.paymentOption || 'advance'}
                            onChange={(e) => {
                                handleChange(e);
                                if (e.target.value === 'full') {
                                    handleChange({ target: { name: 'advanceAmount', value: 0 } });
                                }
                            }}
                            label="Payment Option"
                        >
                            <MenuItem value="advance">Advance</MenuItem>
                            <MenuItem value="full">Full Payment</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
            )}
            {isCompletionMode && (
                <>
                    <Grid item xs={3}>
                        <TextField label="Already Paid" value={alreadyPaidAmount} fullWidth disabled />
                    </Grid>
                    <Grid item xs={3}>
                        <TextField label="Remaining Amount" value={remainingDue} fullWidth disabled />
                    </Grid>
                    <Grid item xs={3}>
                        <TextField
                            label="Payment Now"
                            type="number"
                            name="completionPaymentAmount"
                            value={formData.completionPaymentAmount}
                            onChange={handleChange}
                            fullWidth
                            error={!!errors?.completionPaymentAmount}
                            helperText={errors?.completionPaymentAmount}
                        />
                    </Grid>
                </>
            )}
            <Grid item xs={3}>
                <FormControl fullWidth>
                    <InputLabel>Payment Mode</InputLabel>
                    <Select name="paymentMode" value={formData.paymentMode || 'Cash'} onChange={handleChange} label="Payment Mode">
                        <MenuItem value="Cash">Cash</MenuItem>
                        <MenuItem value="Bank Transfer">Bank Transfer</MenuItem>
                        <MenuItem value="Credit Card">Credit Card</MenuItem>
                        <MenuItem value="Online">Online</MenuItem>
                    </Select>
                </FormControl>
            </Grid>
            <Grid item xs={3}>
                <FormControl fullWidth>
                    <InputLabel>Payment Account</InputLabel>
                    <Select
                        name="paymentAccount"
                        value={formData.paymentAccount || ''}
                        onChange={handleChange}
                        label="Payment Account"
                        disabled={paymentAccountsLoading}
                    >
                        <MenuItem value="">
                            {paymentAccountsLoading ? 'Loading...' : paymentAccounts.length > 0 ? 'Select Payment Account' : 'No Accounts Found'}
                        </MenuItem>
                        {paymentAccounts.map((a) => (
                            <MenuItem key={a.id} value={a.id}>
                                {a.name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
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
            // Create a synthetic event to match the existing handleFileChange function
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

        // Create preview URL for File objects
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
                {/* Delete Icon */}
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

                {/* Preview Content */}
                {['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp'].includes(ext) ? (
                    // Image Preview
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
                    // PDF Preview
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
                    // Word Document Preview
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
                    // Generic File Preview
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
                        p: 2,
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
                    {/* Hidden file input */}
                    <input ref={fileInputRef} type="file" multiple accept=".pdf,.doc,.docx,image/*" name="documents" onChange={handleFileChange} style={{ display: 'none' }} />

                    {/* Upload Icon */}
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

            {/* Document Previews */}
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
                <TextField label="Additional Notes" name="notes" value={formData.notes} onChange={handleChange} fullWidth multiline rows={3} placeholder="Enter any additional notes or instructions..." />
            </Grid>
        </Grid>
    );
};
