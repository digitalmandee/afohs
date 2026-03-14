import React, { useState, useEffect, useRef } from 'react';
import { TextField, Button, IconButton, Typography, Box, FormHelperText, Snackbar, Alert, Paper, RadioGroup, FormControlLabel, Radio, Divider, Checkbox } from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import { router, usePage } from '@inertiajs/react';
import { ArrowBack, Add as AddIcon, Close as CloseIcon } from '@mui/icons-material';
import { MdArrowBackIos } from 'react-icons/md';
import { enqueueSnackbar } from 'notistack';
import axios from 'axios';
import { countries } from '@/constants/countries';

const EmployeeCreate = () => {
    const { props } = usePage();
    const { employee, isEdit, next_employee_id } = props;

    const [formData, setFormData] = useState({
        // Basic Information
        name: employee?.name || '',
        father_name: employee?.father_name || '',
        employee_id: employee?.employee_id || next_employee_id || '',
        email: employee?.email || '',
        designation: employee?.designation || '',
        designation_id: employee?.designation_id || null,
        date_of_birth: employee?.date_of_birth || '',
        age: '',
        gender: employee?.gender || '',
        marital_status: employee?.marital_status || '',
        national_id: employee?.national_id || '',
        nationality: employee?.nationality || '',

        // Employment Details
        department: employee?.department || null,
        subdepartment: employee?.subdepartment || null,
        employment_type: employee?.employment_type || 'full_time',
        status: employee?.status || 'active',
        company: employee?.company || '',
        joining_date: employee?.joining_date || '',
        contract_start_date: employee?.contract_start_date || '',
        contract_end_date: employee?.contract_end_date || '',
        salary: employee?.salary || '',
        barcode: employee?.barcode || '',
        shift_id: employee?.shift_id || null,
        branch_id: employee?.branch_id || null,

        // Contact Information
        phone_no: employee?.phone_no || '',
        mob_b: employee?.mob_b || '',
        tel_a: employee?.tel_a || '',
        tel_b: employee?.tel_b || '',
        emergency_no: employee?.emergency_no || '',

        // Current Address
        address: employee?.address || '',
        cur_city: employee?.cur_city || '',
        cur_country: employee?.cur_country || '',

        // Permanent Address
        per_address: employee?.per_address || '',
        per_city: employee?.per_city || '',
        per_country: employee?.per_country || '',

        // License & Vehicle
        license: employee?.license || '',
        license_no: employee?.license_no || '',
        vehicle_details: employee?.vehicle_details || '',

        // Bank & Financial
        account_no: employee?.account_no || '',
        bank_details: employee?.bank_details || '',
        payment_method: employee?.payment_method || 'bank',

        // Academic Information
        academic_qualification: employee?.academic_qualification || '',
        academic_institution: employee?.academic_institution || '',
        academic_year: employee?.academic_year || '',

        // Work Experience
        work_experience_years: employee?.work_experience_years || '',
        previous_employer: employee?.previous_employer || '',
        previous_position: employee?.previous_position || '',

        // Organizational Background
        learn_of_org: employee?.learn_of_org || '',
        anyone_in_org: employee?.anyone_in_org || '',

        // Criminal Background
        crime: employee?.crime || '',
        crime_details: employee?.crime_details || '',

        // Additional
        remarks: employee?.remarks || '',
    });

    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [departments, setDepartments] = useState([]);
    const [subdepartments, setSubdepartments] = useState([]);
    const [designations, setDesignations] = useState([]);
    const [branches, setBranches] = useState([]);
    const [shifts, setShifts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [subdepartmentSearchTerm, setSubdepartmentSearchTerm] = useState('');

    useEffect(() => {
        // Fetch Designations
        axios
            .get(route('designations.list'))
            .then((res) => {
                if (res.data.success) setDesignations(res.data.data);
            })
            .catch((err) => console.error(err));

        // Fetch Branches
        axios
            .get(route('branches.list'))
            .then((res) => {
                if (res.data.success) setBranches(res.data.branches || []);
            })
            .catch((err) => console.error(err));

        // Fetch Shifts
        axios
            .get(route('shifts.list'))
            .then((res) => {
                if (res.data.success) setShifts(res.data.shifts || []);
            })
            .catch((err) => console.error(err));
    }, []);

    // File upload states
    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(employee?.photo?.file_path || null);
    const [documentFiles, setDocumentFiles] = useState([]);
    const [existingDocuments, setExistingDocuments] = useState(employee?.documents || []);
    const [deletedDocumentIds, setDeletedDocumentIds] = useState([]);
    const fileInputRef = useRef(null);
    const [sameAsCurrent, setSameAsCurrent] = useState(false);

    // Calculate age from date of birth
    const calculateAge = (dateOfBirth) => {
        if (!dateOfBirth) return '';
        const today = new Date();
        const birthDate = new Date(dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    // Update age when date of birth changes
    useEffect(() => {
        if (formData.date_of_birth) {
            const calculatedAge = calculateAge(formData.date_of_birth);
            setFormData((prev) => ({ ...prev, age: calculatedAge }));
        }
    }, [formData.date_of_birth]);

    // Handle photo upload
    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setPhotoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    // Handle document upload
    const handleDocumentChange = (e) => {
        const files = Array.from(e.target.files);
        setDocumentFiles((prev) => [...prev, ...files]);
    };

    // Remove new document from list
    const removeDocument = (index) => {
        setDocumentFiles((prev) => prev.filter((_, i) => i !== index));
    };

    // Remove existing document
    const removeExistingDocument = (documentId) => {
        setExistingDocuments((prev) => prev.filter((doc) => doc.id !== documentId));
        setDeletedDocumentIds((prev) => [...prev, documentId]);
    };

    // Handle same as current address
    const handleSameAddress = (e) => {
        const checked = e.target.checked;
        setSameAsCurrent(checked);

        if (checked) {
            setFormData((prev) => ({
                ...prev,
                per_address: prev.address || '',
                per_city: prev.cur_city || '',
                per_country: prev.cur_country || '',
            }));
        }
    };

    // Auto-update permanent address when current address changes (if checkbox is active)
    useEffect(() => {
        if (sameAsCurrent) {
            setFormData((prev) => ({
                ...prev,
                per_address: prev.address || '',
                per_city: prev.cur_city || '',
                per_country: prev.cur_country || '',
            }));
        }
    }, [formData.address, formData.cur_city, formData.cur_country, sameAsCurrent]);

    useEffect(() => {
        if (formData.branch_id) {
            axios
                .get(route('api.departments.listAll', { type: 'search', query: searchTerm, branch_id: formData.branch_id }))
                .then((res) => setDepartments(res.data.results))
                .catch((err) => console.error('Error fetching departments', err));
        } else {
            setDepartments([]);
        }
    }, [searchTerm, formData.branch_id]);

    useEffect(() => {
        if (formData.department?.id) {
            axios
                .get(route('api.subdepartments.listAll', { type: 'search', department_id: formData.department.id, query: subdepartmentSearchTerm }))
                .then((res) => setSubdepartments(res.data.results))
                .catch((err) => console.error('Error fetching subdepartments', err));
        } else {
            setSubdepartments([]);
        }
    }, [formData.department, subdepartmentSearchTerm]);

    const validate = () => {
        let newErrors = {};
        if (!formData.name) newErrors.name = 'Name is required';
        if (!formData.employee_id) newErrors.employee_id = 'Employee ID is required';
        if (!formData.email) newErrors.email = 'Email is required';

        if (!formData.phone_no) {
            newErrors.phone_no = 'Phone number is required';
        } else if (!/^[0-9+\-\(\) ]+$/.test(formData.phone_no)) {
            newErrors.phone_no = 'Invalid phone number format';
        }

        if (formData.national_id && !/^[0-9-]+$/.test(formData.national_id)) {
            newErrors.national_id = 'Invalid National ID format (digits and dashes only)';
        }

        if (formData.mob_b && !/^[0-9+\-\(\) ]+$/.test(formData.mob_b)) {
            newErrors.mob_b = 'Invalid format';
        }
        if (formData.tel_a && !/^[0-9+\-\(\) ]+$/.test(formData.tel_a)) {
            newErrors.tel_a = 'Invalid format';
        }
        if (formData.tel_b && !/^[0-9+\-\(\) ]+$/.test(formData.tel_b)) {
            newErrors.tel_b = 'Invalid format';
        }
        if (formData.emergency_no && !/^[0-9+\-\(\) ]+$/.test(formData.emergency_no)) {
            newErrors.emergency_no = 'Invalid format';
        }

        if (!formData.salary) newErrors.salary = 'Salary is required';
        if (!formData.joining_date) newErrors.joining_date = 'Joining date is required';
        if (!formData.department) newErrors.department = 'Department is required';
        if (!formData.gender) newErrors.gender = 'Gender is required';
        if (!formData.marital_status) newErrors.marital_status = 'Marital status is required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;

        setIsLoading(true);
        try {
            // Create FormData for file uploads
            const formDataToSend = new FormData();

            // Add all form fields
            Object.keys(formData).forEach((key) => {
                if (key === 'department' || key === 'subdepartment') {
                    if (formData[key]) {
                        formDataToSend.append(key + '_id', formData[key].id);
                    }
                } else if (formData[key] !== null && formData[key] !== '') {
                    formDataToSend.append(key, formData[key]);
                }
            });

            // Add photo if selected
            if (photoFile) {
                formDataToSend.append('photo', photoFile);
            }

            // Add documents if selected
            documentFiles.forEach((file, index) => {
                formDataToSend.append(`documents[${index}]`, file);
            });

            // Add deleted documents IDs
            deletedDocumentIds.forEach((id, index) => {
                formDataToSend.append(`deleted_documents[${index}]`, id);
            });

            if (isEdit) {
                formDataToSend.append('_method', 'PUT');
                await axios.post(route('api.employees.update', employee.employee_id), formDataToSend, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                enqueueSnackbar('Employee updated successfully!', { variant: 'success' });
            } else {
                await axios.post(route('api.employees.store'), formDataToSend, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                enqueueSnackbar('Employee added successfully!', { variant: 'success' });
            }

            setTimeout(() => router.visit(route('employees.dashboard')), 1500);
        } catch (error) {
            enqueueSnackbar(error.response?.data?.message || `Failed to ${isEdit ? 'update' : 'add'} employee.`, { variant: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    const textFieldStyle = {
        backgroundColor: '#FFFFFF',
        '& .MuiOutlinedInput-root': {
            '& fieldset': { border: '1px solid #E9E9E9' },
            '&:hover fieldset': { border: '1px solid #E9E9E9' },
            '&.Mui-focused fieldset': { border: '1px solid #E9E9E9' },
        },
    };

    const handleRestrictedInput = (e, fieldName) => {
        const value = e.target.value;

        // Numeric only fields (Salary, Account No) - allow digits only (and maybe decimals for salary if needed, though strictly int usually)
        if (['salary', 'account_no'].includes(fieldName)) {
            if (value === '' || /^[0-9.]+$/.test(value)) {
                setFormData({ ...formData, [fieldName]: value });
            }
            return;
        }

        // Contact fields - allow digits, +, -, (, ), space
        if (['phone_no', 'mob_b', 'tel_a', 'tel_b', 'emergency_no'].includes(fieldName)) {
            if (value === '' || /^[0-9+\-\(\) ]+$/.test(value)) {
                setFormData({ ...formData, [fieldName]: value });
            }
            return;
        }

        // National ID - allow digits and dashes
        if (fieldName === 'national_id') {
            if (value === '' || /^[0-9-]+$/.test(value)) {
                setFormData({ ...formData, [fieldName]: value });
            }
            return;
        }

        // Default behavior for other fields
        setFormData({ ...formData, [fieldName]: value });
    };

    const renderTextField = (field) => (
        <Box key={field.name}>
            <Typography variant="body1" sx={{ fontWeight: 500, color: '#000000' }} mb={1}>
                {field.label}
            </Typography>
            <TextField
                sx={textFieldStyle}
                name={field.name}
                value={formData[field.name]}
                onChange={(e) => handleRestrictedInput(e, field.name)}
                placeholder={field.placeholder}
                variant="outlined"
                size="small"
                fullWidth
                error={!!errors[field.name]}
                helperText={errors[field.name]}
                type={field.type || 'text'}
                disabled={field.disabled || false}
                multiline={field.multiline || false}
                rows={field.rows || 1}
                select={field.select || false}
                SelectProps={field.select ? { native: true } : undefined}
                inputProps={{
                    min: field.min || undefined,
                }}
            >
                {field.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </TextField>
        </Box>
    );

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
            <Box sx={{ p: 2 }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                    <div onClick={() => router.visit(route('employees.dashboard'))} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                        <IconButton>
                            <ArrowBack sx={{ color: '#063455' }} />
                        </IconButton>
                    </div>
                    <h2 style={{ margin: 0, fontWeight: '600', color: '#0A3D62' }}>{isEdit ? 'Edit Employee' : 'Personal Detail'}</h2>
                </div>
                <Paper
                    sx={{
                        padding: '2rem',
                        borderRadius: '1rem',
                        maxWidth: '65rem',
                        margin: 'auto',
                        // boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
                    }}
                >
                    {/* Employment Type & Employee Type */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                        <Box>
                            <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                                Employment Type*
                            </Typography>
                            <RadioGroup row value={formData.employment_type} onChange={(e) => setFormData({ ...formData, employment_type: e.target.value })}>
                                {['full_time', 'part_time', 'contract'].map((type) => (
                                    <FormControlLabel key={type} value={type} control={<Radio />} label={type.replace('_', ' ').toUpperCase()} />
                                ))}
                            </RadioGroup>
                        </Box>

                        {/* Employee Status */}
                        <Box>
                            <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                                Employment Status*
                            </Typography>
                            <TextField size="small" sx={textFieldStyle} select name="status" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} fullWidth SelectProps={{ native: true }}>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </TextField>
                        </Box>
                    </Box>

                    {/* Basic Information */}
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, mt: 3 }}>
                        Basic Information
                    </Typography>
                    <Divider sx={{ mb: 3 }} />
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', mb: 4 }}>
                        {[
                            { label: 'Employee Name*', name: 'name', placeholder: 'Full Name' },
                            { label: 'Father Name', name: 'father_name', placeholder: 'Father Name' },
                            { label: 'Employee ID*', name: 'employee_id', placeholder: '12345', disabled: isEdit },
                            { label: 'National ID (CNIC)', name: 'national_id', placeholder: 'XXXXX-XXXXXXX-X' },
                            { label: 'Nationality', name: 'nationality', placeholder: 'e.g., Pakistani' },
                            { label: 'Email*', name: 'email', placeholder: 'email@example.com' },
                        ].map(renderTextField)}

                        {/* Designation Autocomplete */}
                        <Box>
                            <Typography variant="body1" sx={{ fontWeight: 500, color: '#000000' }} mb={1}>
                                Designation
                            </Typography>
                            <Autocomplete
                                size="small"
                                options={designations}
                                getOptionLabel={(option) => option.name}
                                value={designations.find((d) => d.id === formData.designation_id) || (formData.designation ? { name: formData.designation, id: 'temp' } : null)}
                                isOptionEqualToValue={(option, value) => option.id === value.id}
                                onInputChange={(event, value) => {
                                    // Optional: Handle free-text if you still want to allow creating new ones via this input,
                                    // but standard is dropdown. If typing doesn't match, we can just clear or keep search.
                                }}
                                onChange={(event, value) => {
                                    setFormData({
                                        ...formData,
                                        designation_id: value ? value.id : null,
                                        designation: value ? value.name : '', // Keep string for legacy/display
                                    });
                                }}
                                renderInput={(params) => <TextField {...params} sx={textFieldStyle} placeholder="Select Job Title" />}
                            />
                        </Box>

                        {[{ label: 'Barcode', name: 'barcode', placeholder: 'Barcode Number' }].map(renderTextField)}

                        {/* Date of Birth with Auto-calculated Age */}
                        <Box>
                            <Typography variant="body1" sx={{ fontWeight: 500, color: '#000000' }} mb={1}>
                                Date of Birth
                            </Typography>
                            <TextField size="small" sx={textFieldStyle} type="date" name="date_of_birth" value={formData.date_of_birth} onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })} fullWidth InputLabelProps={{ shrink: true }} />
                        </Box>

                        {/* Display Calculated Age */}
                        <Box>
                            <Typography variant="body1" sx={{ fontWeight: 500, color: '#000000' }} mb={1}>
                                Age
                            </Typography>
                            <TextField
                                size="small"
                                sx={textFieldStyle}
                                name="age"
                                value={formData.age}
                                placeholder="Auto-calculated"
                                fullWidth
                                disabled
                                InputProps={{
                                    readOnly: true,
                                }}
                            />
                        </Box>

                        <Box>
                            <Typography variant="body1" sx={{ fontWeight: 500, color: '#000000' }} mb={1}>
                                Gender*
                            </Typography>
                            <TextField size="small" sx={textFieldStyle} select name="gender" value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })} fullWidth error={!!errors.gender} helperText={errors.gender} SelectProps={{ native: true }}>
                                <option value="">Select Gender</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                            </TextField>
                        </Box>

                        <Box>
                            <Typography variant="body1" sx={{ fontWeight: 500, color: '#000000' }} mb={1}>
                                Marital Status*
                            </Typography>
                            <TextField size="small" sx={textFieldStyle} select name="marital_status" value={formData.marital_status} onChange={(e) => setFormData({ ...formData, marital_status: e.target.value })} fullWidth error={!!errors.marital_status} helperText={errors.marital_status} SelectProps={{ native: true }}>
                                <option value="">Select Status</option>
                                <option value="single">Single</option>
                                <option value="married">Married</option>
                                <option value="divorced">Divorced</option>
                                <option value="widowed">Widowed</option>
                            </TextField>
                        </Box>
                    </Box>

                    {/* Department, Shift & Employment Details */}
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, mt: 3 }}>
                        Department, Shift & Employment
                    </Typography>
                    <Divider sx={{ mb: 3 }} />
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', mb: 4 }}>
                        {/* Company Selection */}
                        <Box>
                            <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                                Company (Location)
                            </Typography>
                            <Autocomplete
                                size="small"
                                options={branches}
                                getOptionLabel={(option) => option.name}
                                value={branches.find((b) => b.id === formData.branch_id) || null}
                                onChange={(event, value) => {
                                    setFormData({
                                        ...formData,
                                        branch_id: value ? value.id : null,
                                        department: null,
                                        subdepartment: null,
                                    });
                                }}
                                renderInput={(params) => <TextField {...params} sx={textFieldStyle} placeholder="Select Company" />}
                            />
                        </Box>

                        <Box>
                            <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                                Department*
                            </Typography>
                            <Autocomplete
                                size="small"
                                options={departments}
                                getOptionLabel={(option) => option.name}
                                value={formData.department}
                                onInputChange={(event, value) => setSearchTerm(value)}
                                disabled={!formData.branch_id}
                                onChange={(event, value) => {
                                    setFormData({ ...formData, department: value, subdepartment: null });
                                    setSubdepartmentSearchTerm('');
                                }}
                                renderInput={(params) => (
                                    <>
                                        <TextField {...params} sx={textFieldStyle} label="Search Department" placeholder={!formData.branch_id ? 'Select company first' : 'Search Department'} />
                                        {errors.department && <FormHelperText error>{errors.department}</FormHelperText>}
                                    </>
                                )}
                            />
                        </Box>

                        <Box>
                            <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                                Subdepartment
                            </Typography>
                            <Autocomplete size="small" options={subdepartments} getOptionLabel={(option) => option.name} value={formData.subdepartment} disabled={!formData.department} onInputChange={(event, value) => setSubdepartmentSearchTerm(value)} onChange={(event, value) => setFormData({ ...formData, subdepartment: value })} renderInput={(params) => <TextField {...params} sx={textFieldStyle} label="Search Subdepartment" placeholder={!formData.department ? 'Select department first' : 'Search'} />} />
                        </Box>

                        {/* Shift Selection */}
                        <Box>
                            <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                                Shift
                            </Typography>
                            <Autocomplete
                                size="small"
                                options={shifts}
                                getOptionLabel={(option) => `${option.name} (${option.start_time}-${option.end_time})`}
                                value={shifts.find((s) => s.id === formData.shift_id) || null}
                                onChange={(event, value) => {
                                    setFormData({ ...formData, shift_id: value ? value.id : null });
                                }}
                                renderInput={(params) => <TextField {...params} sx={textFieldStyle} placeholder="Select Shift" />}
                            />
                        </Box>

                        {[
                            { label: 'Joining Date*', name: 'joining_date', type: 'date' },
                            { label: 'Salary*', name: 'salary', placeholder: '30000', type: 'number', min: 0 },
                        ].map(renderTextField)}

                        {/* Contract Dates - Only show for contract employees */}
                        {formData.employment_type === 'contract' && (
                            <>
                                <Box>
                                    <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                                        Contract Start Date
                                    </Typography>
                                    <TextField size="small" sx={textFieldStyle} type="date" name="contract_start_date" value={formData.contract_start_date} onChange={(e) => setFormData({ ...formData, contract_start_date: e.target.value })} fullWidth InputLabelProps={{ shrink: true }} />
                                </Box>
                                <Box>
                                    <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                                        Contract End Date
                                    </Typography>
                                    <TextField size="small" sx={textFieldStyle} type="date" name="contract_end_date" value={formData.contract_end_date} onChange={(e) => setFormData({ ...formData, contract_end_date: e.target.value })} fullWidth InputLabelProps={{ shrink: true }} />
                                </Box>
                            </>
                        )}

                        {[].map(renderTextField)}
                    </Box>

                    {/* Contact Information */}
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, mt: 3 }}>
                        Contact Information
                    </Typography>
                    <Divider sx={{ mb: 3 }} />
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', mb: 4 }}>
                        {[
                            { label: 'Phone Number*', name: 'phone_no', placeholder: '03XXXXXXXXX' },
                            { label: 'Secondary Mobile', name: 'mob_b', placeholder: '03XXXXXXXXX' },
                            { label: 'Telephone A', name: 'tel_a', placeholder: '042XXXXXXX' },
                            { label: 'Telephone B', name: 'tel_b', placeholder: '042XXXXXXX' },
                            { label: 'Emergency Contact', name: 'emergency_no', placeholder: '03XXXXXXXXX' },
                        ].map(renderTextField)}
                    </Box>

                    {/* Current Address */}
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, mt: 3 }}>
                        Current Address
                    </Typography>
                    <Divider sx={{ mb: 3 }} />
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', mb: 4 }}>
                        {[
                            { label: 'Address', name: 'address', placeholder: 'Complete Address' },
                            { label: 'City', name: 'cur_city', placeholder: 'City' },
                        ].map(renderTextField)}

                        {/* Country Autocomplete */}
                        <Box>
                            <Typography variant="body1" sx={{ fontWeight: 500, color: '#000000' }} mb={1}>
                                Country
                            </Typography>
                            <Autocomplete
                                size="small"
                                fullWidth
                                options={countries}
                                getOptionLabel={(option) => option.label}
                                value={countries.find((c) => c.label === formData.cur_country) || null}
                                onChange={(e, newValue) => {
                                    setFormData({
                                        ...formData,
                                        cur_country: newValue ? newValue.label : '',
                                    });
                                }}
                                renderInput={(params) => <TextField {...params} sx={textFieldStyle} placeholder="Select Country" />}
                            />
                        </Box>
                    </Box>

                    {/* Permanent Address */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, mt: 3 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            Permanent Address
                        </Typography>
                        <FormControlLabel control={<Checkbox checked={sameAsCurrent} onChange={handleSameAddress} />} label="Use Current Address" />
                    </Box>
                    <Divider sx={{ mb: 3 }} />
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', mb: 4 }}>
                        {[
                            { label: 'Permanent Address', name: 'per_address', placeholder: 'Complete Address', disabled: sameAsCurrent },
                            { label: 'City', name: 'per_city', placeholder: 'City', disabled: sameAsCurrent },
                        ].map(renderTextField)}

                        {/* Country Autocomplete */}
                        <Box>
                            <Typography variant="body1" sx={{ fontWeight: 500, color: '#000000' }} mb={1}>
                                Country
                            </Typography>
                            <Autocomplete
                                size="small"
                                fullWidth
                                options={countries}
                                getOptionLabel={(option) => option.label}
                                value={countries.find((c) => c.label === formData.per_country) || null}
                                onChange={(e, newValue) => {
                                    setFormData({
                                        ...formData,
                                        per_country: newValue ? newValue.label : '',
                                    });
                                }}
                                disabled={sameAsCurrent}
                                renderInput={(params) => <TextField {...params} sx={textFieldStyle} placeholder="Select Country" />}
                            />
                        </Box>
                    </Box>

                    {/* License, Vehicle & Bank Details */}
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, mt: 3 }}>
                        License, Vehicle & Bank Details
                    </Typography>
                    <Divider sx={{ mb: 3 }} />
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', mb: 4 }}>
                        <Box>
                            <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                                Have License?
                            </Typography>
                            <TextField size="small" sx={textFieldStyle} select name="license" value={formData.license} onChange={(e) => setFormData({ ...formData, license: e.target.value })} fullWidth SelectProps={{ native: true }}>
                                <option value="">Select</option>
                                <option value="Yes">Yes</option>
                                <option value="No">No</option>
                            </TextField>
                        </Box>

                        {[
                            { label: 'License Number', name: 'license_no', placeholder: 'License Number' },
                            { label: 'Vehicle Details', name: 'vehicle_details', placeholder: 'Vehicle Information' },
                            { label: 'Account Number', name: 'account_no', placeholder: 'Bank Account Number' },
                            { label: 'Bank Details', name: 'bank_details', placeholder: 'Bank Name & Branch' },
                        ].map(renderTextField)}

                        {/* Payment Method */}
                        <Box>
                            <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                                Payment Method
                            </Typography>
                            <TextField size="small" sx={textFieldStyle} select name="payment_method" value={formData.payment_method} onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })} fullWidth SelectProps={{ native: true }}>
                                <option value="bank">Bank Transfer</option>
                                <option value="cash">Cash</option>
                            </TextField>
                        </Box>
                    </Box>

                    {/* Academic Information */}
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, mt: 3 }}>
                        Academic Information
                    </Typography>
                    <Divider sx={{ mb: 3 }} />
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', mb: 4 }}>
                        {[
                            { label: 'Highest Qualification', name: 'academic_qualification', placeholder: "e.g., Bachelor's Degree" },
                            { label: 'Institution Name', name: 'academic_institution', placeholder: 'University/College Name' },
                            { label: 'Year of Completion', name: 'academic_year', placeholder: '2020' },
                        ].map(renderTextField)}
                    </Box>

                    {/* Work Experience */}
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, mt: 3 }}>
                        Work Experience
                    </Typography>
                    <Divider sx={{ mb: 3 }} />
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', mb: 4 }}>
                        {[
                            { label: 'Years of Experience', name: 'work_experience_years', placeholder: '5', type: 'number', min: 0 },
                            { label: 'Previous Employer', name: 'previous_employer', placeholder: 'Company Name' },
                            { label: 'Previous Position', name: 'previous_position', placeholder: 'Job Title' },
                        ].map(renderTextField)}
                    </Box>

                    {/* Organizational Background */}
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, mt: 3 }}>
                        Organizational Background
                    </Typography>
                    <Divider sx={{ mb: 3 }} />
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', mb: 4 }}>
                        {[
                            { label: 'How did you learn about us?', name: 'learn_of_org', placeholder: 'e.g., Job Portal, Referral' },
                            { label: 'Anyone in our organization?', name: 'anyone_in_org', placeholder: 'Name & Relationship' },
                        ].map(renderTextField)}
                    </Box>

                    {/* Criminal Background */}
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, mt: 3 }}>
                        Criminal Background Check
                    </Typography>
                    <Divider sx={{ mb: 3 }} />
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', mb: 4 }}>
                        <Box>
                            <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                                Any Criminal History?
                            </Typography>
                            <TextField size="small" sx={textFieldStyle} select name="crime" value={formData.crime} onChange={(e) => setFormData({ ...formData, crime: e.target.value })} fullWidth SelectProps={{ native: true }}>
                                <option value="">Select</option>
                                <option value="Yes">Yes</option>
                                <option value="No">No</option>
                            </TextField>
                        </Box>

                        {renderTextField({ label: 'Crime Details (if any)', name: 'crime_details', placeholder: 'Details', multiline: true, rows: 3 })}
                    </Box>

                    {/* Additional Information */}
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, mt: 3 }}>
                        Additional Information
                    </Typography>
                    <Divider sx={{ mb: 3 }} />
                    <Box sx={{ mb: 4 }}>{renderTextField({ label: 'Remarks / Notes', name: 'remarks', placeholder: 'Any additional notes', multiline: true, rows: 4 })}</Box>

                    {/* Photo Upload */}
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, mt: 3 }}>
                        Employee Photo
                    </Typography>
                    <Divider sx={{ mb: 3 }} />
                    <Box sx={{ mb: 4 }}>
                        <input accept="image/*" style={{ display: 'none' }} id="photo-upload" type="file" onChange={handlePhotoChange} />
                        <label htmlFor="photo-upload">
                            <Button variant="outlined" component="span" sx={{ mb: 2 }}>
                                Upload Photo
                            </Button>
                        </label>
                        {photoPreview && (
                            <Box sx={{ mt: 2 }}>
                                <img src={photoPreview} alt="Employee Preview" style={{ maxWidth: '200px', maxHeight: '200px', borderRadius: '8px', border: '1px solid #E9E9E9' }} />
                            </Box>
                        )}
                    </Box>

                    {/* Employment Documents */}
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, mt: 3 }}>
                        Employment Documents
                    </Typography>
                    <Divider sx={{ mb: 3 }} />
                    <Box sx={{ mb: 4 }}>
                        <input ref={fileInputRef} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" style={{ display: 'none' }} id="document-upload" type="file" multiple onChange={handleDocumentChange} />
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            component="label"
                            htmlFor="document-upload"
                            sx={{
                                bgcolor: '#0c4b6e',
                                '&:hover': {
                                    bgcolor: '#083854',
                                },
                                textTransform: 'none',
                                mb: 1,
                            }}
                        >
                            Add Documents
                        </Button>

                        {(documentFiles.length > 0 || existingDocuments.length > 0) && (
                            <Box sx={{ mt: 3 }}>
                                <Typography variant="h6" sx={{ mb: 1, fontWeight: 500 }}>
                                    Uploaded Documents ({documentFiles.length + existingDocuments.length})
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
                                    {/* Existing Documents */}
                                    {existingDocuments.map((doc, index) => {
                                        const fileName = doc.file_name;
                                        const ext = fileName.split('.').pop().toLowerCase();
                                        const fileUrl = `${doc.file_path}`;

                                        return (
                                            <div
                                                key={`existing-${doc.id}`}
                                                style={{
                                                    position: 'relative',
                                                    width: '100px',
                                                    textAlign: 'center',
                                                    marginBottom: '10px',
                                                }}
                                            >
                                                <IconButton
                                                    size="small"
                                                    onClick={() => removeExistingDocument(doc.id)}
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
                                                            src={fileUrl}
                                                            alt={fileName}
                                                            style={{
                                                                width: '60px',
                                                                height: '60px',
                                                                objectFit: 'cover',
                                                                borderRadius: '6px',
                                                                cursor: 'pointer',
                                                                border: '2px solid #ddd',
                                                            }}
                                                            onClick={() => window.open(fileUrl, '_blank')}
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
                                                            onClick={() => window.open(fileUrl, '_blank')}
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
                                                            onClick={() => window.open(fileUrl, '_blank')}
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
                                                            onClick={() => window.open(fileUrl, '_blank')}
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
                                    })}

                                    {/* New Documents */}
                                    {documentFiles.map((file, index) => {
                                        const fileName = file.name;
                                        const ext = fileName.split('.').pop().toLowerCase();
                                        const previewUrl = URL.createObjectURL(file);

                                        return (
                                            <div
                                                key={`new-${index}`}
                                                style={{
                                                    position: 'relative',
                                                    width: '100px',
                                                    textAlign: 'center',
                                                    marginBottom: '10px',
                                                }}
                                            >
                                                <IconButton
                                                    size="small"
                                                    onClick={() => removeDocument(index)}
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
                                    })}
                                </div>
                            </Box>
                        )}
                    </Box>

                    {/* Action Buttons */}
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px', gap: '12px' }}>
                        <Button variant="contained" sx={{ backgroundColor: 'white', color: 'black', border: '1px solid #ccc' }} onClick={() => router.visit(route('employees.dashboard'))}>
                            Cancel
                        </Button>
                        <Button disabled={isLoading} variant="contained" onClick={handleSubmit} sx={{ backgroundColor: '#0a3d62', color: 'white' }}>
                            {isEdit ? 'Update Employee' : 'Add Employee'}
                        </Button>
                    </Box>
                </Paper>
            </Box>
        </div>
    );
};

export default EmployeeCreate;
