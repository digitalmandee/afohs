import { useState, useRef, useEffect } from 'react';
import { TextField, Button, Select, MenuItem, FormControl, Paper, Typography, Grid, Box, IconButton, InputAdornment, OutlinedInput, CircularProgress, Autocomplete } from '@mui/material';
import { ArrowBack, Add, Delete, Edit, KeyboardArrowRight, KeyboardArrowDown, Check, CloseRounded } from '@mui/icons-material';
import 'bootstrap/dist/css/bootstrap.min.css';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
dayjs.extend(customParseFormat);
import { router, usePage } from '@inertiajs/react';
import axios from 'axios';

const AddForm1 = ({ data, handleChange, onNext }) => {
    const { props } = usePage();
    const isEditMode = !!props.user?.id;

    // Handle profile_photo object {id, file_path}
    const initialImage = data?.profile_photo?.file_path || null;

    const [memberImage, setMemberImage] = useState(initialImage);
    const [showImageButtons, setShowImageButtons] = useState(!!initialImage);
    const [dateError, setDateError] = useState(''); // New state for date validation
    const [dobOpen, setDobOpen] = useState(false); // State for Date of Birth picker
    const fileInputRef = useRef(null);
    const [formErrors, setFormErrors] = useState({});
    const [isValidatingCnic, setIsValidatingCnic] = useState(false);
    const [cnicStatus, setCnicStatus] = useState(null); // 'available', 'exists', 'error'
    const [cnicValidationTimeout, setCnicValidationTimeout] = useState(null);

    // Guardian Search State
    const [guardianSearchResults, setGuardianSearchResults] = useState([]);
    const [guardianSearchLoading, setGuardianSearchLoading] = useState(false);
    const [guardianStatus, setGuardianStatus] = useState(null); // 'valid', 'invalid', null
    const [guardianSearchTimeout, setGuardianSearchTimeout] = useState(null);

    const handleImageUpload = (event) => {
        if (event.target.files && event.target.files[0]) {
            handleChange({ target: { name: 'profile_photo', value: event.target.files[0] } });
            const reader = new FileReader();
            reader.onload = (e) => {
                setMemberImage(e.target.result);
                setShowImageButtons(true);
            };
            reader.readAsDataURL(event.target.files[0]);
        }
    };

    const handleDeleteImage = () => {
        setMemberImage(null);
        setShowImageButtons(false);
        handleChange({ target: { name: 'profile_photo', value: null } });
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleChangeImage = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    // Real-time CNIC validation function
    const validateCnicRealTime = async (cnicValue) => {
        // Clear previous timeout
        if (cnicValidationTimeout) {
            clearTimeout(cnicValidationTimeout);
        }

        // Clear previous CNIC errors
        setFormErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors.cnic_no;
            return newErrors;
        });

        // Reset status
        setCnicStatus(null);

        // Check CNIC format first
        if (!cnicValue) {
            return;
        }

        if (!/^\d{5}-\d{7}-\d{1}$/.test(cnicValue)) {
            setFormErrors((prev) => ({
                ...prev,
                cnic_no: 'CNIC must be in the format XXXXX-XXXXXXX-X',
            }));
            return;
        }

        // Set timeout for API call (debounce)
        const timeoutId = setTimeout(async () => {
            setIsValidatingCnic(true);
            try {
                const response = await axios.post('/api/check-duplicate-cnic', {
                    cnic_no: cnicValue,
                    member_id: data.member_id || null, // Exclude current member if editing
                });

                if (response.data.exists) {
                    setCnicStatus('exists');
                    setFormErrors((prev) => ({
                        ...prev,
                        cnic_no: 'This CNIC number is already registered with another member',
                    }));
                } else {
                    // CNIC is valid and available
                    setCnicStatus('available');
                    setFormErrors((prev) => {
                        const newErrors = { ...prev };
                        delete newErrors.cnic_no;
                        return newErrors;
                    });
                }
            } catch (error) {
                console.error('Error checking CNIC:', error);
                setCnicStatus('error');
                setFormErrors((prev) => ({
                    ...prev,
                    cnic_no: 'Error validating CNIC. Please try again.',
                }));
            } finally {
                setIsValidatingCnic(false);
            }
        }, 800); // 800ms delay for debouncing

        setCnicValidationTimeout(timeoutId);
    };

    // Enhanced handleChange to include real-time CNIC validation
    const handleInputChange = (event) => {
        const { name, value } = event.target;

        // Call the original handleChange
        handleChange(event);

        // If it's CNIC field, validate in real-time
        if (name === 'cnic_no') {
            validateCnicRealTime(value);
        }
    };

    const handleGuardianSearch = async (query) => {
        if (!query) {
            setGuardianSearchResults([]);
            setGuardianStatus(null);
            return;
        }
        setGuardianSearchLoading(true);
        try {
            const response = await axios.get(route('api.members.search'), { params: { query } });
            setGuardianSearchResults(response.data.members);

            // Check if exact match exists in results
            const exactMatch = response.data.members.find((m) => m.membership_no === query);
            if (exactMatch) {
                setGuardianStatus('valid');
            } else {
                // If we have results but no exact match yet, status is neutral until selection
                // If query is long enough and no results, maybe invalid?
                // For now, let's rely on selection for 'valid' status
                if (response.data.members.length === 0 && query.length > 3) {
                    setGuardianStatus('invalid');
                } else {
                    setGuardianStatus(null);
                }
            }
        } catch (error) {
            console.error('Error searching members:', error);
            setGuardianStatus('invalid');
        } finally {
            setGuardianSearchLoading(false);
        }
    };

    const handleSubmit = async () => {
        const errors = {};

        // if (!data.coa_category_id) errors.coa_category_id = 'COA Account is required';
        if (!data.first_name) errors.first_name = 'First Name is required';
        // if (!data.last_name) errors.last_name = 'Last Name is required';
        if (!data.guardian_name) errors.guardian_name = 'This Name is required';
        // if (!data.nationality) errors.nationality = 'Nationality is required';
        if (!data.gender) errors.gender = 'Gender is required';
        if (!data.cnic_no) {
            errors.cnic_no = 'CNIC No is required';
        } else if (!/^\d{5}-\d{7}-\d{1}$/.test(data.cnic_no)) {
            errors.cnic_no = 'CNIC must be in the format XXXXX-XXXXXXX-X';
        }
        if (!data.date_of_birth) errors.date_of_birth = 'Date of Birth is required';
        else if (dateError) errors.date_of_birth = dateError;

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return; // Stop submission if errors exist
        }

        // Check if there are any existing CNIC validation errors
        if (formErrors.cnic_no) {
            return; // Stop submission if CNIC has validation errors
        }

        // Check if CNIC is still being validated
        if (isValidatingCnic) {
            return; // Stop submission if CNIC is still being validated
        }

        onNext();
    };

    return (
        <>
            {/* Main Form */}
            <Paper sx={{ p: 3, mb: 3, boxShadow: 'none' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6" component="h2" sx={{ fontWeight: 500, color: '#063455' }}>
                        Personal Information
                    </Typography>
                    <Box sx={{ borderBottom: '1px dashed #ccc', flexGrow: 1, ml: 2 }}></Box>
                </Box>

                <Grid container spacing={2}>
                    {/* Application Number */}
                    {isEditMode && (
                        <Grid item xs={6}>
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    backgroundColor: '#f5f5f5',
                                    borderRadius: '8px',
                                    padding: '12px 16px',
                                    border: '1px solid #ddd',
                                }}
                            >
                                <Typography variant="body1" sx={{ color: '#777' }}>
                                    Membership No:
                                </Typography>
                                <Typography variant="body1" sx={{ color: '#0a2b4f' }}>
                                    #{data.membership_no}
                                </Typography>
                                {/* add member status woth proper background design accordng */}
                                <Typography variant="body1" sx={{ ml: 2, color: data.status === 'active' ? '#2e7d32' : data.status === 'suspended' || data.status === 'cancelled' ? '#FFA90B' : '#d32f2f', textTransform: 'capitalize', fontWeight: 700 }}>
                                    ( {data.status} )
                                </Typography>
                            </Box>
                        </Grid>
                    )}

                    {/* Two column layout */}
                    <Grid item xs={12} container spacing={3}>
                        {/* Left Column */}
                        <Grid item xs={12} md={6} container spacing={3}>
                            {/* Member Picture */}
                            <Grid item xs={12}>
                                <Box sx={{ mb: 1, display: 'flex', gap: '10px' }}>
                                    <Box
                                        sx={{
                                            border: '2px dashed #a5d8ff',
                                            borderRadius: '4px',
                                            width: 120,
                                            height: 120,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            position: 'relative',
                                            backgroundColor: memberImage ? 'transparent' : '#e6f7ff',
                                            overflow: 'hidden',
                                            cursor: 'pointer',
                                        }}
                                        onClick={() => !memberImage && fileInputRef.current?.click()}
                                    >
                                        {memberImage ? <img src={memberImage} alt="Member" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Add sx={{ color: '#a5d8ff', fontSize: 30 }} />}

                                        <input type="file" hidden ref={fileInputRef} onChange={handleImageUpload} accept="image/*" />
                                    </Box>
                                    <Typography variant="caption" sx={{ display: 'block', mt: 1, color: '#666' }}>
                                        <Typography variant="body1" sx={{ mb: 1 }}>
                                            Member Picture
                                        </Typography>
                                        Click upload to profile picture (4 MB max)
                                    </Typography>
                                    {showImageButtons && (
                                        <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Button size="small" startIcon={<Edit />} onClick={handleChangeImage} sx={{ textTransform: 'none', borderColor: '#ccc', color: '#333' }}>
                                                Change
                                            </Button>
                                            <Button size="small" color="error" startIcon={<Delete />} onClick={handleDeleteImage} sx={{ textTransform: 'none' }}>
                                                Delete
                                            </Button>
                                        </Box>
                                    )}
                                </Box>
                            </Grid>

                            {/* COA Account */}
                            <Grid item xs={6}>
                                <Typography variant="body2" sx={{ mb: 1 }}>
                                    COA Account
                                </Typography>
                                <TextField fullWidth variant="outlined" placeholder="Enter to search" size="small" name="coa_category_id" value={data.coa_category_id} error={!!formErrors.coa_category_id} helperText={formErrors.coa_category_id} onChange={handleChange} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '4px' } }} />
                            </Grid>

                            {/* Title */}
                            <Grid item xs={6}>
                                <Typography variant="body2" sx={{ mb: 1 }}>
                                    Title
                                </Typography>
                                <FormControl fullWidth size="small">
                                    <Select
                                        value={data.title}
                                        name="title"
                                        onChange={handleChange}
                                        displayEmpty
                                        renderValue={(selected) => {
                                            if (!selected) {
                                                return 'Choose Option';
                                            }
                                            return selected;
                                        }}
                                        IconComponent={() => <KeyboardArrowDown sx={{ position: 'absolute', right: 8, pointerEvents: 'none' }} />}
                                    >
                                        <MenuItem value="">
                                            <em>None (Clear)</em>
                                        </MenuItem>
                                        {['Dr.', 'Major', 'Gp Capt', 'Air Cdre', 'Lt Col', 'Col', 'Capt', 'Brig', 'Sq Ldr', 'Prof.', 'Flt. Lt', 'AVM', 'AM', 'Wg Cdr', 'Lt', 'AMC', '2/Lt', 'Capt. Dr.', 'Flg Off', 'Sub. Lt', 'Comd (PN)', 'Cdr (PN)', 'Lt (PN)', 'Cdr', 'Lt. Cdr', 'Cdre', 'Rear Admiral', 'Air Marshal', 'Mr'].map((item, index) => (
                                            <MenuItem key={index} value={item}>
                                                {item}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            {/* First Name */}
                            <Grid item xs={4}>
                                <Typography variant="body2" sx={{ mb: 1 }}>
                                    First Name*
                                </Typography>
                                <TextField fullWidth variant="outlined" placeholder="Enter first name" size="small" name="first_name" value={data.first_name} error={!!formErrors.first_name} helperText={formErrors.first_name} onChange={handleChange} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '4px' } }} />
                            </Grid>

                            {/* Middle Name */}
                            <Grid item xs={4}>
                                <Typography variant="body2" sx={{ mb: 1 }}>
                                    Middle Name
                                </Typography>
                                <TextField fullWidth variant="outlined" placeholder="Enter middle name" size="small" name="middle_name" value={data.middle_name} onChange={handleChange} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '4px' } }} />
                            </Grid>

                            {/* Last Name */}
                            <Grid item xs={4}>
                                <Typography variant="body2" sx={{ mb: 1 }}>
                                    Last Name*
                                </Typography>
                                <TextField fullWidth variant="outlined" placeholder="Enter last name" size="small" name="last_name" value={data.last_name} error={!!formErrors.last_name} helperText={formErrors.last_name} onChange={handleChange} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '4px' } }} />
                            </Grid>

                            {/* Father/Husband Name */}
                            <Grid item xs={5}>
                                <Typography variant="body2" sx={{ mb: 1 }}>
                                    Father/Husband Name*
                                </Typography>
                                <TextField fullWidth variant="outlined" placeholder="Enter name" size="small" name="guardian_name" value={data.guardian_name} error={!!formErrors.guardian_name} helperText={formErrors.guardian_name} onChange={handleChange} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '4px' } }} />
                            </Grid>

                            {/* Father Membership No */}
                            <Grid item xs={7}>
                                <Typography variant="body2" sx={{ mb: 1 }}>
                                    If father is a member then membership No
                                </Typography>
                                <Autocomplete
                                    freeSolo
                                    options={guardianSearchResults}
                                    getOptionLabel={(option) => (typeof option === 'string' ? option : option.membership_no)}
                                    renderOption={(props, option) => (
                                        <li {...props}>
                                            <Box>
                                                <Typography variant="body1">{option.membership_no}</Typography>
                                                <Typography variant="caption" color="textSecondary">
                                                    {option.full_name}
                                                </Typography>
                                            </Box>
                                        </li>
                                    )}
                                    loading={guardianSearchLoading}
                                    inputValue={data.guardian_membership || ''}
                                    onInputChange={(event, newInputValue) => {
                                        // Update form data
                                        handleChange({ target: { name: 'guardian_membership', value: newInputValue } });

                                        // Reset status if cleared
                                        if (!newInputValue) {
                                            setGuardianStatus(null);
                                            setGuardianSearchResults([]);
                                            return;
                                        }

                                        // Debounce search
                                        if (guardianSearchTimeout) clearTimeout(guardianSearchTimeout);
                                        const timeoutId = setTimeout(() => {
                                            handleGuardianSearch(newInputValue);
                                        }, 500);
                                        setGuardianSearchTimeout(timeoutId);
                                    }}
                                    onChange={(event, newValue) => {
                                        if (newValue && typeof newValue === 'object') {
                                            // Selected from dropdown
                                            handleChange({ target: { name: 'guardian_membership', value: newValue.membership_no } });
                                            handleChange({ target: { name: 'guardian_name', value: newValue.full_name } });
                                            setGuardianStatus('valid');
                                        } else {
                                            // Free text or cleared
                                            // If free text, we rely on onInputChange
                                        }
                                    }}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            fullWidth
                                            variant="outlined"
                                            placeholder="Enter membership Number"
                                            size="small"
                                            name="guardian_membership"
                                            InputProps={{
                                                ...params.InputProps,
                                                endAdornment: (
                                                    <>
                                                        {guardianSearchLoading ? <CircularProgress color="inherit" size={20} /> : null}
                                                        {!guardianSearchLoading && guardianStatus === 'valid' && <Check sx={{ color: '#4caf50' }} />}
                                                        {!guardianSearchLoading && guardianStatus === 'invalid' && <CloseRounded sx={{ color: '#f44336' }} />}
                                                        {params.InputProps.endAdornment}
                                                    </>
                                                ),
                                            }}
                                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '4px' } }}
                                        />
                                    )}
                                />
                                {guardianStatus === 'valid' && (
                                    <Typography variant="caption" sx={{ color: '#4caf50', mt: 0.5, display: 'block' }}>
                                        Member Found: {data.guardian_name}
                                    </Typography>
                                )}
                                {guardianStatus === 'invalid' && (
                                    <Typography variant="caption" sx={{ color: '#f44336', mt: 0.5, display: 'block' }}>
                                        Member Not Found
                                    </Typography>
                                )}
                            </Grid>
                        </Grid>

                        {/* Right Column */}
                        <Grid item xs={12} md={6} container spacing={2.5}>
                            {/* Nationality */}
                            <Grid item xs={6}>
                                <Typography variant="body2">Nationality*</Typography>
                                <TextField fullWidth variant="outlined" placeholder="Enter Nationality e.g. Pakistan" size="small" name="nationality" value={data.nationality} error={!!formErrors.nationality} helperText={formErrors.nationality} onChange={handleChange} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '4px' } }} />
                            </Grid>

                            {/* CNIC No */}
                            <Grid item xs={6}>
                                <Typography variant="body2" sx={{ mb: 0.5 }}>
                                    CNIC No*
                                </Typography>
                                <TextField
                                    fullWidth
                                    variant="outlined"
                                    placeholder="XXXXX-XXXXXXX-X"
                                    size="small"
                                    name="cnic_no"
                                    value={data.cnic_no}
                                    error={!!formErrors.cnic_no}
                                    helperText={isValidatingCnic ? 'Checking CNIC availability...' : cnicStatus === 'available' ? <span style={{ color: '#4caf50' }}>CNIC is available</span> : formErrors.cnic_no}
                                    onChange={(e) => {
                                        let value = e.target.value;
                                        // Auto-format the input as the user types
                                        value = value.replace(/\D/g, ''); // Remove non-digits
                                        if (value.length > 5 && value[5] !== '-') value = value.slice(0, 5) + '-' + value.slice(5);
                                        if (value.length > 13 && value[13] !== '-') value = value.slice(0, 13) + '-' + value.slice(13);
                                        if (value.length > 15) value = value.slice(0, 15); // Limit to 15 characters
                                        handleInputChange({ target: { name: 'cnic_no', value } });
                                    }}
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                {isValidatingCnic && <CircularProgress size={20} />}
                                                {!isValidatingCnic && cnicStatus === 'available' && <Check sx={{ color: '#4caf50' }} />}
                                                {!isValidatingCnic && cnicStatus === 'exists' && <CloseRounded sx={{ color: '#f44336' }} />}
                                                {!isValidatingCnic && cnicStatus === 'error' && <CloseRounded sx={{ color: '#ff9800' }} />}
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: '4px',
                                            '& fieldset': {
                                                borderColor: cnicStatus === 'available' ? '#4caf50' : cnicStatus === 'exists' ? '#f44336' : '#ccc',
                                            },
                                        },
                                    }}
                                />
                            </Grid>

                            {/* Passport No */}
                            <Grid item xs={6}>
                                <Typography variant="body2" sx={{ mb: 0.5 }}>
                                    Passport No
                                </Typography>
                                <TextField fullWidth variant="outlined" placeholder="Enter passport number" size="small" name="passport_no" value={data.passport_no} onChange={handleChange} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '4px' } }} />
                            </Grid>

                            {/* Gender */}
                            <Grid item xs={6}>
                                <Typography variant="body2" sx={{ mb: 0.5 }}>
                                    Gender*
                                </Typography>
                                <FormControl fullWidth size="small" error={!!formErrors.gender}>
                                    <Select
                                        value={data.gender || ''}
                                        name="gender"
                                        onChange={handleChange}
                                        displayEmpty
                                        renderValue={(selected) => {
                                            if (!selected) {
                                                return 'Choose Gender';
                                            }
                                            return selected;
                                        }}
                                        inputProps={{ 'aria-label': 'Without label' }}
                                        IconComponent={() => <KeyboardArrowDown sx={{ position: 'absolute', right: 8, pointerEvents: 'none' }} />}
                                    >
                                        <MenuItem value="">
                                            <em>None (Clear)</em>
                                        </MenuItem>
                                        <MenuItem value="Male">Male</MenuItem>
                                        <MenuItem value="Female">Female</MenuItem>
                                        <MenuItem value="Other">Other</MenuItem>
                                    </Select>
                                    {formErrors.gender && (
                                        <Typography variant="caption" color="error">
                                            {formErrors.gender}
                                        </Typography>
                                    )}
                                </FormControl>
                            </Grid>

                            {/* NTN */}
                            <Grid item xs={6}>
                                <Typography variant="body2" sx={{ mb: 0.5 }}>
                                    NTN (if any)
                                </Typography>
                                <TextField fullWidth variant="outlined" placeholder="Enter national NTN number" size="small" name="ntn" value={data.ntn} onChange={(e) => handleChange({ target: { name: 'ntn', value: e.target.value.replace(/[^0-9\-]/g, '') } })} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '4px' } }} />
                            </Grid>

                            {/* Date of Birth */}
                            <Grid item xs={6}>
                                <Typography variant="body2" sx={{ mb: 0.5 }}>
                                    Date of Birth*
                                </Typography>
                                <LocalizationProvider dateAdapter={AdapterDayjs}>
                                    <DatePicker
                                        label="Date of Birth"
                                        format="DD-MM-YYYY"
                                        value={data.date_of_birth ? dayjs(data.date_of_birth, 'DD-MM-YYYY') : null}
                                        onChange={(newValue) =>
                                            handleChange({
                                                target: {
                                                    name: 'date_of_birth',
                                                    value: newValue ? newValue.format('DD-MM-YYYY') : '',
                                                },
                                            })
                                        }
                                        maxDate={dayjs()}
                                        slotProps={{
                                            textField: {
                                                fullWidth: true,
                                                variant: 'outlined',
                                                size: 'small',
                                                name: 'date_of_birth',
                                                error: !!formErrors.date_of_birth || !!dateError,
                                                helperText: formErrors.date_of_birth || dateError,
                                                sx: { '& .MuiOutlinedInput-root': { borderRadius: '4px' } },
                                                onClick: () => setDobOpen(true), // 👈 Open on click
                                            },
                                            actionBar: {
                                                actions: ['clear', 'today', 'cancel', 'accept'],
                                            },
                                        }}
                                        open={dobOpen}
                                        onClose={() => setDobOpen(false)}
                                        onOpen={() => setDobOpen(true)}
                                    />
                                </LocalizationProvider>
                            </Grid>

                            <Grid item xs={12}>
                                <Typography variant="body2" sx={{ mb: 0.5 }}>
                                    Marital Status
                                </Typography>
                                <FormControl fullWidth size="small" error={!!formErrors.martial_status}>
                                    <Select
                                        value={data.martial_status || ''}
                                        name="martial_status"
                                        onChange={handleChange}
                                        displayEmpty
                                        renderValue={(selected) => {
                                            if (!selected) {
                                                return 'Choose Marital Status';
                                            }
                                            return selected;
                                        }}
                                        inputProps={{ 'aria-label': 'Without label' }}
                                        IconComponent={() => <KeyboardArrowDown sx={{ position: 'absolute', right: 8, pointerEvents: 'none' }} />}
                                    >
                                        <MenuItem value="" disabled>
                                            Choose Marital Status
                                        </MenuItem>
                                        <MenuItem value="Single">Single</MenuItem>
                                        <MenuItem value="Married">Married</MenuItem>
                                        <MenuItem value="Divorced">Divorced</MenuItem>
                                        <MenuItem value="Widowed">Widowed</MenuItem>
                                    </Select>
                                    {formErrors.martial_status && (
                                        <Typography variant="caption" color="error">
                                            {formErrors.martial_status}
                                        </Typography>
                                    )}
                                </FormControl>
                            </Grid>

                            {/* Education */}
                            <Grid item xs={12}>
                                <Typography variant="body2" sx={{ mb: 0.5 }}>
                                    Education
                                </Typography>
                                <TextField
                                    fullWidth
                                    variant="outlined"
                                    placeholder="Enter complete education of the applicant"
                                    size="small"
                                    name="education"
                                    value={data.education}
                                    onChange={handleChange}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '4px' } }}
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton edge="end" sx={{ color: '#666' }}>
                                                    <KeyboardArrowRight />
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Grid>
                        </Grid>
                    </Grid>
                </Grid>
            </Paper>

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button
                    variant="outlined"
                    sx={{
                        textTransform: 'none',
                        borderColor: '#ccc',
                        color: '#333',
                        '&:hover': { borderColor: '#999', backgroundColor: '#f5f5f5' },
                    }}
                    onClick={() => router.visit(route('membership.dashboard'))}
                >
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    sx={{
                        textTransform: 'none',
                        backgroundColor: '#0c4b6e',
                        '&:hover': { backgroundColor: '#083854' },
                    }}
                    onClick={handleSubmit}
                    disabled={isValidatingCnic}
                >
                    {isValidatingCnic ? 'Saving...' : 'Save & Next'}
                </Button>
            </Box>
        </>
    );
};

export default AddForm1;
