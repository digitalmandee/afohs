import { useState, useRef, useEffect } from 'react';
import { Box, Button, Container, FormControl, Grid, IconButton, MenuItem, Radio, Select, TextField, Typography, Checkbox, FormControlLabel, InputLabel, Dialog, DialogTitle, DialogContent, DialogActions, InputAdornment, CircularProgress, Autocomplete } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import CheckIcon from '@mui/icons-material/Check';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import 'bootstrap/dist/css/bootstrap.min.css';
import { router } from '@inertiajs/react';
import AsyncSearchTextField from '@/components/AsyncSearchTextField';
import { enqueueSnackbar } from 'notistack';
import axios from 'axios';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
dayjs.extend(customParseFormat);

const AddForm3 = ({ data, handleChange, handleChangeData, onSubmit, onBack, memberTypesData, loading, membercategories, setCurrentFamilyMember, currentFamilyMember, isMembershipNoEditable = false, isCorporate = false }) => {
    const [showFamilyMember, setShowFamilyMember] = useState(false);
    const [openFamilyMember, setOpenFamilyMember] = useState(false);
    const [openDocumentsDialog, setOpenDocumentsDialog] = useState(false);
    const [selectedKinshipUser, setSelectedKinshipUser] = useState(null);
    const [submitError, setSubmitError] = useState('');
    const [familyMemberErrors, setFamilyMemberErrors] = useState({});
    const [fieldErrors, setFieldErrors] = useState({});
    const [isDragOver, setIsDragOver] = useState(false);
    const [isValidatingFamilyCnic, setIsValidatingFamilyCnic] = useState(false);
    const [familyCnicValidationTimeout, setFamilyCnicValidationTimeout] = useState(null);
    const [isValidatingMembershipNo, setIsValidatingMembershipNo] = useState(false);
    const [membershipNoStatus, setMembershipNoStatus] = useState(null); // 'available', 'exists', 'error'
    const [familyCnicStatus, setFamilyCnicStatus] = useState(null); // 'available', 'exists', 'error'
    const [membershipNoSuggestion, setMembershipNoSuggestion] = useState(null);
    const fileInputRef = useRef(null);
    const prevCategoryRef = useRef(data.membership_category);

    // Corporate Company State
    const [corporateCompanies, setCorporateCompanies] = useState([]);
    const [corporateCompanySearch, setCorporateCompanySearch] = useState('');
    const [corporateCompanyLoading, setCorporateCompanyLoading] = useState(false);
    const [selectedCorporateCompany, setSelectedCorporateCompany] = useState(null);

    // Fetch Corporate Companies
    useEffect(() => {
        if (!isCorporate) return;

        const fetchCorporateCompanies = async () => {
            setCorporateCompanyLoading(true);
            try {
                const response = await axios.get('/api/corporate-companies', {
                    params: { search: corporateCompanySearch },
                });
                setCorporateCompanies(response.data);
            } catch (error) {
                console.error('Error fetching corporate companies:', error);
            } finally {
                setCorporateCompanyLoading(false);
            }
        };

        const timeoutId = setTimeout(() => {
            fetchCorporateCompanies();
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [corporateCompanySearch, isCorporate]);

    // Auto-select Corporate Category
    useEffect(() => {
        if (isCorporate && membercategories?.length > 0) {
            // Try to find "Corporate" or "CE"
            const corporateCategory = membercategories.find((c) => c.name.toLowerCase().includes('corporate') || c.name.toLowerCase().includes('ce'));

            if (corporateCategory && data.membership_category !== corporateCategory.id) {
                handleChange({
                    target: {
                        name: 'membership_category',
                        value: corporateCategory.id,
                    },
                });

                // Auto-prefix membership number with category name if empty or just prefix
                const prefix = corporateCategory.name + ' ';
                if (!data.membership_no || !data.membership_no.startsWith(prefix)) {
                    // Only set if not already set or different
                    if (!data.membership_no) {
                        handleChange({
                            target: {
                                name: 'membership_no',
                                value: prefix,
                            },
                        });
                    }
                }
            }
        }
    }, [isCorporate, membercategories]);

    // Business Developer State
    const [bdSearch, setBdSearch] = useState('');
    const [bdOptions, setBdOptions] = useState([]);
    const [bdLoading, setBdLoading] = useState(false);
    const [selectedBd, setSelectedBd] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [membershipDateOpen, setMembershipDateOpen] = useState(false);
    const [cardIssueDateOpen, setCardIssueDateOpen] = useState(false);
    const [cardExpiryDateOpen, setCardExpiryDateOpen] = useState(false);
    const [familyDobOpen, setFamilyDobOpen] = useState(false);
    const [familyCardIssueOpen, setFamilyCardIssueOpen] = useState(false);
    const [familyCardExpiryOpen, setFamilyCardExpiryOpen] = useState(false);
    const [startDateOpen, setStartDateOpen] = useState(false);
    const [endDateOpen, setEndDateOpen] = useState(false);

    // Barcode Validation State
    const [barcodeStatus, setBarcodeStatus] = useState(null); // 'available', 'exists', 'error'
    const [isValidatingBarcode, setIsValidatingBarcode] = useState(false);
    const [barcodeValidationTimeout, setBarcodeValidationTimeout] = useState(null);
    const [familyBarcodeStatus, setFamilyBarcodeStatus] = useState(null); // 'available', 'exists', 'error'
    const [isValidatingFamilyBarcode, setIsValidatingFamilyBarcode] = useState(false);
    const [familyBarcodeValidationTimeout, setFamilyBarcodeValidationTimeout] = useState(null);

    const calculateAge = (dateOfBirth) => {
        if (!dateOfBirth) return 0;
        const today = new Date();
        // Parse DD-MM-YYYY
        const birthDate = dayjs(dateOfBirth, 'DD-MM-YYYY', true).isValid() ? dayjs(dateOfBirth, 'DD-MM-YYYY').toDate() : new Date(dateOfBirth);

        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        return age;
    };

    const validateMembershipNumber = async (membershipNo) => {
        if (!membershipNo || membershipNo.trim() === '') {
            setMembershipNoStatus(null);
            setMembershipNoSuggestion(null);
            return;
        }

        setIsValidatingMembershipNo(true);
        setMembershipNoStatus(null);

        try {
            // Ensure we send the correct member_id for exclusion during edit
            const memberId = data.member_id || data.id || null;
            console.log(memberId);
            const response = await axios.post('/api/check-duplicate-membership-no', {
                membership_no: membershipNo,
                member_id: memberId,
            });

            if (response.data.exists) {
                setMembershipNoStatus('exists');
                setMembershipNoSuggestion(response.data.suggestion);
            } else {
                setMembershipNoStatus('available');
                setMembershipNoSuggestion(null);
            }
        } catch (error) {
            console.error('Error checking membership number:', error);
            setMembershipNoStatus('error');
            setMembershipNoSuggestion(null);
        }

        setIsValidatingMembershipNo(false);
    };

    const validateBarcodeRealTime = async (barcodeValue) => {
        if (barcodeValidationTimeout) {
            clearTimeout(barcodeValidationTimeout);
        }

        if (!barcodeValue || barcodeValue.trim() === '') {
            setBarcodeStatus(null);
            return;
        }

        setBarcodeStatus(null);

        const timeoutId = setTimeout(async () => {
            setIsValidatingBarcode(true);
            try {
                const memberId = data.member_id || data.id || null;
                const response = await axios.post('/api/check-duplicate-barcode', {
                    barcode_no: barcodeValue,
                    member_id: memberId,
                });

                if (response.data.exists) {
                    setBarcodeStatus('exists');
                } else {
                    setBarcodeStatus('available');
                }
            } catch (error) {
                console.error('Error checking barcode:', error);
                setBarcodeStatus('error');
            } finally {
                setIsValidatingBarcode(false);
            }
        }, 500);

        setBarcodeValidationTimeout(timeoutId);
    };

    const validateFamilyBarcodeRealTime = async (barcodeValue) => {
        if (familyBarcodeValidationTimeout) {
            clearTimeout(familyBarcodeValidationTimeout);
        }

        if (!barcodeValue || barcodeValue.trim() === '') {
            setFamilyBarcodeStatus(null);
            return;
        }

        setFamilyBarcodeStatus(null);

        const timeoutId = setTimeout(async () => {
            setIsValidatingFamilyBarcode(true);

            // Check against primary member's barcode
            if (data.barcode_no && barcodeValue === data.barcode_no) {
                setFamilyBarcodeStatus('exists'); // Same as primary
                setIsValidatingFamilyBarcode(false);
                return;
            }

            try {
                // Attempt to get ID if editing a saved family member
                const familyMemberId = currentFamilyMember.id || null;

                const response = await axios.post('/api/check-duplicate-barcode', {
                    barcode_no: barcodeValue,
                    member_id: familyMemberId,
                });

                if (response.data.exists) {
                    setFamilyBarcodeStatus('exists');
                } else {
                    setFamilyBarcodeStatus('available');
                }
            } catch (error) {
                console.error('Error checking family barcode:', error);
                setFamilyBarcodeStatus('error');
            } finally {
                setIsValidatingFamilyBarcode(false);
            }
        }, 500);

        setFamilyBarcodeValidationTimeout(timeoutId);
    };

    const generateUniqueMembershipNumber = async (categoryName, isKinship = false) => {
        try {
            // Get the next available number from the backend
            const response = await axios.get('/api/get-next-membership-number');
            const nextNumber = response.data.next_number;

            // Format: "CATEGORY_NAME NUMBER" or "CATEGORY_NAME NUMBER-1" for kinship
            const membershipNo = isKinship ? `${categoryName} ${nextNumber}-1` : `${categoryName} ${nextNumber}`;

            return membershipNo;
        } catch (error) {
            console.error('Error generating membership number:', error);
            // Fallback to timestamp-based number
            const timestamp = Date.now().toString().slice(-4);
            return isKinship ? `${categoryName} ${timestamp}-1` : `${categoryName} ${timestamp}`;
        }
    };

    const calculateExpiryDate = (dateOfBirth) => {
        if (!dateOfBirth) return '';
        // Parse DD-MM-YYYY
        const birthDate = dayjs(dateOfBirth, 'DD-MM-YYYY', true).isValid() ? dayjs(dateOfBirth, 'DD-MM-YYYY').toDate() : new Date(dateOfBirth);

        const expiryDate = new Date(birthDate);
        expiryDate.setFullYear(birthDate.getFullYear() + 25);
        return dayjs(expiryDate).format('DD-MM-YYYY');
    };

    // --- Fee Calculation Logic ---
    useEffect(() => {
        if (!membercategories) return;

        // Prevent overwrite on initial load if category is same as initialized data
        if (data.membership_category == prevCategoryRef.current && prevCategoryRef.current !== undefined && prevCategoryRef.current !== '') {
            // Only return if we have a valid previous category (meaning it's an edit or stable state)
            // But if we are switching from empty to something, prev might be empty.
            return;
        }

        // If switching TO empty
        if (!data.membership_category) {
            // Reset if no category selected
            handleChangeData('membership_fee', '');
            handleChangeData('maintenance_fee', '');
            handleChangeData('additional_membership_charges', '');
            handleChangeData('membership_fee_additional_remarks', '');
            handleChangeData('membership_fee_discount', '');
            handleChangeData('membership_fee_discount_remarks', '');
            handleChangeData('total_membership_fee', '');

            handleChangeData('maintenance_fee', '');
            handleChangeData('additional_maintenance_charges', '');
            handleChangeData('maintenance_fee_additional_remarks', '');
            handleChangeData('maintenance_fee_discount', '');
            handleChangeData('maintenance_fee_discount_remarks', '');
            handleChangeData('total_maintenance_fee', '');
            handleChangeData('per_day_maintenance_fee', '');
            prevCategoryRef.current = data.membership_category;
            return;
        }

        const category = membercategories.find((c) => c.id == data.membership_category);
        if (category) {
            // Update fees on category change
            handleChangeData('membership_fee', category.fee || 0);
            handleChangeData('maintenance_fee', category.subscription_fee || 0);
        }

        prevCategoryRef.current = data.membership_category;
    }, [data.membership_category, membercategories]);

    // Recalculate Total Membership Fee
    useEffect(() => {
        const fee = parseFloat(data.membership_fee || 0);
        const add = parseFloat(data.additional_membership_charges || 0);
        const disc = parseFloat(data.membership_fee_discount || 0);
        const total = fee + add - disc;
        handleChangeData('total_membership_fee', total);
    }, [data.membership_fee, data.additional_membership_charges, data.membership_fee_discount]);

    // Recalculate Total Maintenance Fee & Per Day
    useEffect(() => {
        const fee = parseFloat(data.maintenance_fee || 0);
        const add = parseFloat(data.additional_maintenance_charges || 0);
        const disc = parseFloat(data.maintenance_fee_discount || 0);
        const total = fee + add - disc;
        handleChangeData('total_maintenance_fee', total);
        handleChangeData('per_day_maintenance_fee', (total / 30).toFixed(2));
    }, [data.maintenance_fee, data.additional_maintenance_charges, data.maintenance_fee_discount]);

    const numberToWords = (amount) => {
        // Basic implementation or placeholder. Ideally use a library like 'number-to-words'
        // For now returning simple string
        if (!amount) return '';
        return `${amount} (Amount in Words)`; // Placeholder
    };

    const validateEmailFormat = (email) => {
        if (!email || email.trim() === '') return null;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email.trim());
    };

    // Real-time CNIC validation function for family members
    const validateFamilyCnicRealTime = async (cnicValue) => {
        // Clear previous timeout
        if (familyCnicValidationTimeout) {
            clearTimeout(familyCnicValidationTimeout);
        }

        // Clear previous CNIC errors
        setFamilyMemberErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors.cnic;
            return newErrors;
        });

        // Reset status
        setFamilyCnicStatus(null);

        // Check CNIC format first
        if (!cnicValue) {
            return;
        }

        if (!/^\d{5}-\d{7}-\d{1}$/.test(cnicValue)) {
            setFamilyMemberErrors((prev) => ({
                ...prev,
                cnic: 'CNIC must be in the format XXXXX-XXXXXXX-X',
            }));
            return;
        }

        // Check if CNIC matches primary member's CNIC
        if (cnicValue === data.cnic_no) {
            setFamilyMemberErrors((prev) => ({
                ...prev,
                cnic: 'Family member CNIC must not be the same as the primary user CNIC',
            }));
            return;
        }

        // Set timeout for API call (debounce)
        const timeoutId = setTimeout(async () => {
            setIsValidatingFamilyCnic(true);
            try {
                const response = await axios.post('/api/check-duplicate-cnic', {
                    cnic_no: cnicValue,
                    member_id: currentFamilyMember.id && !String(currentFamilyMember.id).startsWith('new-') ? currentFamilyMember.id : null,
                });

                if (response.data.exists) {
                    setFamilyCnicStatus('exists');
                    setFamilyMemberErrors((prev) => ({
                        ...prev,
                        cnic: 'This CNIC number is already registered with another member',
                    }));
                } else {
                    // CNIC is valid and available
                    setFamilyCnicStatus('available');
                    setFamilyMemberErrors((prev) => {
                        const newErrors = { ...prev };
                        delete newErrors.cnic;
                        return newErrors;
                    });
                }
            } catch (error) {
                console.error('Error checking family member CNIC:', error);
                setFamilyCnicStatus('error');
                setFamilyMemberErrors((prev) => ({
                    ...prev,
                    cnic: 'Error validating CNIC. Please try again.',
                }));
            } finally {
                setIsValidatingFamilyCnic(false);
            }
        }, 800); // 800ms delay for debouncing

        setFamilyCnicValidationTimeout(timeoutId);
    };

    const handleFamilyMemberChange = (field, value) => {
        let updatedMember = {
            ...currentFamilyMember,
            [field]: value,
        };

        // Real-time email validation
        if (field === 'email') {
            const currentErrors = { ...familyMemberErrors };
            if (value && value.trim() !== '') {
                const isValidFormat = validateEmailFormat(value);
                if (!isValidFormat) {
                    currentErrors.email = 'Please enter a valid email address';
                } else {
                    delete currentErrors.email;
                }
            } else {
                delete currentErrors.email;
            }
            setFamilyMemberErrors(currentErrors);
        }

        // Real-time CNIC validation
        if (field === 'cnic') {
            validateFamilyCnicRealTime(value);
        }

        // Auto-generate full name when first, middle, or last name changes
        if (['first_name', 'middle_name', 'last_name'].includes(field)) {
            const firstName = field === 'first_name' ? value : updatedMember.first_name || '';
            const middleName = field === 'middle_name' ? value : updatedMember.middle_name || '';
            const lastName = field === 'last_name' ? value : updatedMember.last_name || '';

            // Generate full name by combining all parts and removing extra spaces
            const fullName = [firstName, middleName, lastName]
                .filter((name) => name && name.trim())
                .join(' ')
                .trim();

            updatedMember.full_name = fullName;
        }

        setCurrentFamilyMember(updatedMember);
    };

    const handleFamilyPictureDelete = () => {
        setCurrentFamilyMember({
            ...currentFamilyMember,
            picture: null,
            picture_preview: null,
        });
    };

    const AddFamilyMember = () => {
        const maxApplicationNo = data.family_members.length ? Math.max(...data.family_members.map((f) => f.application_no)) : data.application_no;

        const existingCount = data.family_members.length;
        const suffix = String.fromCharCode(65 + existingCount); // A, B, C...
        const uniqueId = `new-${existingCount + 1}`;

        setCurrentFamilyMember((prev) => ({
            ...prev,
            id: uniqueId,
            family_suffix: suffix,
            application_no: Number(maxApplicationNo) + 1,
            member_type_id: data.member_type_id,
            membership_category: data.membership_category,
            card_issue_date: data.card_issue_date,
            card_expiry_date: data.card_expiry_date,
        }));
        setShowFamilyMember(true);
    };

    const handleSaveFamilyMember = async () => {
        const errors = {};

        const isEdit = data.family_members.some((fm) => fm.id === currentFamilyMember.id);

        // --- Validation ---
        if (!currentFamilyMember.first_name) {
            errors.first_name = 'First Name is required';
        }
        if (!currentFamilyMember.relation) {
            errors.relation = 'Relation is required';
        }
        // if (!currentFamilyMember.email) {
        //     errors.email = 'Email is required';
        // }
        if (!currentFamilyMember.date_of_birth) {
            errors.date_of_birth = 'Date of Birth is required';
        }
        if (currentFamilyMember.cnic && !/^\d{5}-\d{7}-\d{1}$/.test(currentFamilyMember.cnic)) {
            errors.cnic = 'CNIC must be in the format XXXXX-XXXXXXX-X';
        }
        if (currentFamilyMember.cnic && currentFamilyMember.cnic === data.cnic_no) {
            errors.cnic = 'Family member CNIC must not be the same as the primary member CNIC';
        }

        if (!currentFamilyMember.status) {
            errors.status = 'Status is required';
        }

        // Check for basic validation errors first
        if (Object.keys(errors).length > 0) {
            setFamilyMemberErrors(errors);
            return;
        }

        // Check if there are any existing CNIC validation errors
        if (familyMemberErrors.cnic) {
            return; // Stop submission if CNIC has validation errors
        }

        // Check if CNIC is still being validated
        if (isValidatingFamilyCnic) {
            return; // Stop submission if CNIC is still being validated
        }

        // Email validation (format only)
        if (currentFamilyMember.email && currentFamilyMember.email.trim() !== '') {
            const memberEmail = currentFamilyMember.email.trim();

            // Email format validation only
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(memberEmail)) {
                errors.email = 'Please enter a valid email address';
            }
        }

        // Date validations
        const issueDate = new Date(data.card_issue_date);
        const expiryDate = new Date(data.card_expiry_date);

        // if (!currentFamilyMember.start_date || currentFamilyMember.end_date) {
        //     errors.date = 'Start and End dates are beyond card expiry';
        // }

        if (Object.keys(errors).length > 0) {
            setFamilyMemberErrors(errors);
            return;
        }

        // --- Save or Update Logic ---
        let updatedMember = { ...currentFamilyMember };

        // Assign ID if it's new
        if (!currentFamilyMember.id) {
            const newId = `new-${data.family_members.length + 1}`;
            updatedMember.id = newId;
        }

        let updatedFamilyMembers;

        if (isEdit) {
            updatedFamilyMembers = data.family_members.map((fm) => (fm.id === currentFamilyMember.id ? updatedMember : fm));
        } else {
            updatedFamilyMembers = [...data.family_members, updatedMember];
        }

        handleChangeData('family_members', updatedFamilyMembers);

        // Reset form
        setCurrentFamilyMember({
            application_no: '',
            family_suffix: '',
            full_name: '',
            barcode_no: '',
            relation: '',
            cnic: '',
            phone_number: '',
            email: '',
            member_type_id: '',
            date_of_birth: '',
            membership_category: '',
            start_date: '',
            end_date: '',
            card_issue_date: '',
            card_expiry_date: '',
            status: 'active',
            picture: null,
            picture_preview: null,
            is_document_missing: false,
            documents: '',
            comments: '',
        });
        setShowFamilyMember(false);
        setFamilyMemberErrors({});
    };

    const handleImageUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            if (file.size > 4 * 1024 * 1024) {
                alert('Image size must be less than 4MB');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setCurrentFamilyMember({
                    ...currentFamilyMember,
                    picture: file,
                    picture_preview: reader.result,
                });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDeleteFamilyMember = (family, index) => {
        if (family.id) {
            // Existing record → mark for deletion
            const updatedDeleted = [...data.deleted_family_members, family.id];
            handleChangeData('deleted_family_members', updatedDeleted);
        }

        // Remove from UI regardless
        const updatedMembers = [...data.family_members];
        updatedMembers.splice(index, 1);
        handleChangeData('family_members', updatedMembers);

        // Reset form
        setCurrentFamilyMember({
            application_no: '',
            family_suffix: '',
            full_name: '',
            barcode_no: '',
            relation: '',
            cnic: '',
            phone_number: '',
            email: '',
            member_type_id: '',
            date_of_birth: '',
            membership_category: '',
            start_date: '',
            end_date: '',
            card_issue_date: '',
            card_expiry_date: '',
            status: 'active',
            picture: null,
            picture_preview: null,
            is_document_missing: false,
            documents: '',
            comments: '',
        });
    };

    const handleEditFamilyMember = (index) => {
        const family = data.family_members[index];
        setCurrentFamilyMember({ ...family, picture_preview: family.picture });
        setShowFamilyMember(true);
    };

    const handleCancelFamilyMember = () => {
        setCurrentFamilyMember({
            application_no: '',
            family_suffix: '',
            full_name: '',
            relation: '',
            cnic: '',
            phone_number: '',
            email: '',
            member_type_id: '',
            date_of_birth: '',
            membership_category: '',
            start_date: '',
            end_date: '',
            card_issue_date: '',
            card_expiry_date: '',
            status: 'active',
            picture: null,
            picture_preview: null,
            is_document_missing: false,
            documents: '',
            comments: '',
        });
        setShowFamilyMember(false);
    };

    // Upload documents
    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);

        // documents: array of media IDs (numbers) and new File objects
        // previewFiles: array of media objects {id, file_name, ...} and new File objects
        const existingDocs = data.documents || [];
        const existingPreviews = data.previewFiles || [];

        // Add new files to both arrays
        handleChangeData('documents', [...existingDocs, ...files]);
        handleChangeData('previewFiles', [...existingPreviews, ...files]);
    };

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
            const existingDocs = data.documents || [];
            const existingPreviews = data.previewFiles || [];

            handleChangeData('documents', [...existingDocs, ...files]);
            handleChangeData('previewFiles', [...existingPreviews, ...files]);
        }
    };

    const handleBoxClick = () => {
        fileInputRef.current?.click();
    };

    const getFilePreview = (file, index) => {
        const isFileObject = file instanceof File;
        let fileName = '';
        let previewUrl = '';

        if (isFileObject) {
            fileName = file.name;
            previewUrl = URL.createObjectURL(file);
        } else if (typeof file === 'object' && file?.file_name) {
            fileName = file.file_name;
            previewUrl = file.file_path || '';
        } else if (typeof file === 'string') {
            fileName = file.split('/').pop();
            previewUrl = file;
        }

        const ext = fileName.split('.').pop().toLowerCase();

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

    const handleFileRemove = (index) => {
        // Clone both arrays
        const updatedPreviewFiles = [...(data.previewFiles || [])];
        const updatedDocuments = [...(data.documents || [])];

        // Remove from both arrays at the same index
        // This works because both arrays are kept in sync:
        // - previewFiles[i] is the display object (media object or File)
        // - documents[i] is the value to send (media ID or File)
        updatedPreviewFiles.splice(index, 1);
        updatedDocuments.splice(index, 1);

        handleChangeData('previewFiles', updatedPreviewFiles);
        handleChangeData('documents', updatedDocuments);
    };

    const handleSubmit = async () => {
        const errors = {};

        // Category example (add your real logic here)
        if (!data.membership_category) {
            errors.membership_category = 'Member Category is required.';
        }

        // Document logic
        if (data.is_document_missing && !data.missing_documents) {
            errors.missing_documents = 'Please specify the missing document(s).';
        }

        // Membership date
        if (!data.membership_date) {
            errors.membership_date = 'Membership Date is required.';
        } else {
            // Regex for DD-MM-YYYY
            const dateRegex = /^\d{2}-\d{2}-\d{4}$/;
            if (!dateRegex.test(data.membership_date)) {
                errors.membership_date = 'Membership Date must be in DD-MM-YYYY format.';
            }
        }

        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            return;
        }

        try {
            await onSubmit();
            setFieldErrors({});
        } catch (error) {
            console.error('Submission Error:', error);
            enqueueSnackbar('Submission failed. Please try again.', { variant: 'error' });
        }
    };

    // Initialize BD selection from data
    useEffect(() => {
        if (data.business_developer) {
            setSelectedBd(data.business_developer);
        } else if (data.business_developer_id && !selectedBd) {
            // If we have ID but no object, we might want to fetch or just leave it.
            // But MembershipForm passes the object now if available.
        }
    }, [data.business_developer]);

    // Fetch Business Developers
    useEffect(() => {
        const fetchBusinessDevelopers = async () => {
            setBdLoading(true);
            try {
                const response = await axios.get(route('employees.business-developers'), {
                    params: { search: bdSearch },
                });
                setBdOptions(response.data);
            } catch (error) {
                console.error('Error fetching business developers:', error);
            } finally {
                setBdLoading(false);
            }
        };

        const timeoutId = setTimeout(() => {
            fetchBusinessDevelopers();
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [bdSearch]);

    return (
        <>
            <>
                {submitError && (
                    <Box sx={{ mb: 2, p: 2, bgcolor: '#ffebee', borderRadius: '4px', border: '1px solid #ef5350' }}>
                        <Typography variant="body2" sx={{ color: '#d32f2f' }}>
                            {submitError}
                        </Typography>
                    </Box>
                )}

                <Box sx={{ p: 3, bgcolor: '#FFFFFF', border: '1px solid #e0e0e0' }}>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={12}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                <Typography variant="h6" component="h2" sx={{ fontWeight: 500, color: '#063455' }}>
                                    Membership Information
                                </Typography>
                                <Box sx={{ borderBottom: '1px dashed #ccc', flexGrow: 1, ml: 2 }}></Box>
                                <Button
                                    variant="contained"
                                    startIcon={<AddIcon />}
                                    sx={{
                                        bgcolor: '#0c4b6e',
                                        '&:hover': {
                                            bgcolor: '#083854',
                                        },
                                        textTransform: 'none',
                                        ml: 2,
                                    }}
                                    onClick={() => setOpenDocumentsDialog(true)}
                                >
                                    Add Documents
                                </Button>
                                <Button
                                    variant="contained"
                                    startIcon={<AddIcon />}
                                    sx={{
                                        bgcolor: '#0c4b6e',
                                        '&:hover': {
                                            bgcolor: '#083854',
                                        },
                                        textTransform: 'none',
                                        ml: 2,
                                    }}
                                    onClick={() => setOpenFamilyMember(true)}
                                >
                                    Add Family Member
                                </Button>
                            </Box>
                            {/* Membership Details */}
                            <Grid container spacing={3}>
                                {!isCorporate && (
                                    <Grid item xs={4}>
                                        <Box>
                                            <Typography sx={{ mb: 1, fontWeight: 500 }}>Membership Category *</Typography>
                                            {isCorporate ? (
                                                <TextField fullWidth variant="outlined" value={membercategories?.find((c) => c.id == data.membership_category)?.name || 'Corporate'} InputProps={{ readOnly: true }} size="small" sx={{ bgcolor: '#f5f5f5' }} />
                                            ) : (
                                                <FormControl fullWidth variant="outlined">
                                                    <Select
                                                        name="membership_category"
                                                        value={data.membership_category}
                                                        onChange={async (e) => {
                                                            const selectedCategoryId = e.target.value;
                                                            const selectedCategory = membercategories.find((item) => item.id === Number(selectedCategoryId));
                                                            const categoryName = selectedCategory?.name || '';

                                                            handleChange({
                                                                target: {
                                                                    name: 'membership_category',
                                                                    value: selectedCategoryId,
                                                                },
                                                            });

                                                            // Generate unique membership number when category changes
                                                            // Generate unique membership number when category changes - ONLY if not manually editable
                                                            if (categoryName && !isMembershipNoEditable) {
                                                                const isKinship = !!selectedKinshipUser;

                                                                // If there's an existing membership number, preserve the number part
                                                                let existingNumber = null;
                                                                if (data.membership_no) {
                                                                    const parts = data.membership_no.split(' ');
                                                                    if (parts.length >= 2) {
                                                                        existingNumber = parts[parts.length - 1]; // Get the number part
                                                                    }
                                                                }

                                                                let newMembershipNo;
                                                                if (existingNumber) {
                                                                    // Keep existing number, just change category
                                                                    newMembershipNo = `${categoryName} ${existingNumber}`;
                                                                } else {
                                                                    // Generate new unique number
                                                                    newMembershipNo = await generateUniqueMembershipNumber(categoryName, isKinship);
                                                                }

                                                                handleChange({
                                                                    target: {
                                                                        name: 'membership_no',
                                                                        value: newMembershipNo,
                                                                    },
                                                                });

                                                                // Validate the new membership number
                                                                setTimeout(() => validateMembershipNumber(newMembershipNo), 500);
                                                            }
                                                        }}
                                                        displayEmpty
                                                        renderValue={(selected) => {
                                                            if (!selected) {
                                                                return <span style={{ color: '#757575', fontSize: '14px' }}>Choose Category</span>;
                                                            }
                                                            const item = membercategories.find((item) => item.id == Number(selected));
                                                            return item ? item.description + ' (' + item.name + ')' : '';
                                                        }}
                                                        SelectProps={{
                                                            displayEmpty: true,
                                                        }}
                                                        sx={{
                                                            height: 40,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            '& .MuiSelect-select': {
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                paddingY: 0,
                                                            },
                                                            '& .MuiOutlinedInput-notchedOutline': {
                                                                borderColor: '#ccc',
                                                            },
                                                        }}
                                                    >
                                                        <MenuItem value="">
                                                            <em>None</em>
                                                        </MenuItem>
                                                        {membercategories?.map((item) => (
                                                            <MenuItem value={item.id} key={item.id}>
                                                                {item.description} ({item.name})
                                                            </MenuItem>
                                                        ))}
                                                    </Select>
                                                    {fieldErrors.membership_category && (
                                                        <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                                                            {fieldErrors.membership_category}
                                                        </Typography>
                                                    )}
                                                </FormControl>
                                            )}
                                        </Box>
                                    </Grid>
                                )}

                                {isCorporate && (
                                    <Grid item xs={4}>
                                        <Box sx={{ width: '100%' }}>
                                            <Typography sx={{ mb: 1, fontWeight: 500 }}>Corporate Company</Typography>
                                            <Autocomplete
                                                options={corporateCompanies}
                                                getOptionLabel={(option) => option.name}
                                                value={corporateCompanies.find((c) => c.id === data.corporate_company_id) || null}
                                                onChange={(event, newValue) => {
                                                    if (newValue) {
                                                        handleChange({ target: { name: 'corporate_company_id', value: newValue.id } });
                                                    } else {
                                                        handleChange({ target: { name: 'corporate_company_id', value: '' } });
                                                    }
                                                }}
                                                onInputChange={(event, newInputValue) => {
                                                    setCorporateCompanySearch(newInputValue);
                                                }}
                                                loading={corporateCompanyLoading}
                                                renderInput={(params) => (
                                                    <TextField
                                                        {...params}
                                                        placeholder="Search Corporate Company"
                                                        variant="outlined"
                                                        size="small"
                                                        InputProps={{
                                                            ...params.InputProps,
                                                            endAdornment: (
                                                                <>
                                                                    {corporateCompanyLoading ? <CircularProgress color="inherit" size={20} /> : null}
                                                                    {params.InputProps.endAdornment}
                                                                </>
                                                            ),
                                                        }}
                                                    />
                                                )}
                                            />
                                        </Box>
                                    </Grid>
                                )}

                                <Grid item xs={4}>
                                    <Box sx={{ width: '100%', '& .MuiInputBase-root': { height: 40, alignItems: 'center' }, '& .MuiInputBase-input': { padding: '0 14px' } }}>
                                        <Typography sx={{ mb: 1, fontWeight: 500 }}>Kinship</Typography>
                                        <AsyncSearchTextField
                                            label=""
                                            name="kinship"
                                            value={data.kinship}
                                            onChange={async (e) => {
                                                const kinshipUser = e.target.value;
                                                setSelectedKinshipUser(kinshipUser);
                                                handleChange({ target: { name: 'kinship', value: e.target.value } });

                                                const selectedCategory = membercategories.find((item) => item.id === Number(data.membership_category));
                                                const prefix = selectedCategory?.name || '';

                                                if (kinshipUser && kinshipUser.membership_no) {
                                                    const kinshipParts = kinshipUser.membership_no.split(' ');
                                                    const kinshipNum = kinshipParts[1];

                                                    const existingMembers = [];
                                                    let suffix = kinshipUser.total_kinships + 1;
                                                    while (existingMembers.includes(`${prefix} ${kinshipNum}-${suffix}`)) {
                                                        suffix++;
                                                    }

                                                    const newMembershipNo = `${prefix} ${kinshipNum}-${suffix}`;

                                                    handleChange({
                                                        target: {
                                                            name: 'membership_no',
                                                            value: newMembershipNo,
                                                        },
                                                    });
                                                }
                                            }}
                                            endpoint="admin.api.search-users"
                                            placeholder="Search Kinship..."
                                            disabled={!data.membership_category}
                                            // textFieldProps={{
                                            //     sx: { '& .MuiInputBase-root': { height: 40, alignItems: 'center' } }
                                            // }}
                                        />
                                    </Box>
                                </Grid>

                                <Grid item xs={4}>
                                    <Box sx={{ width: '100%', '& .MuiInputBase-root': { height: 40, alignItems: 'center' }, '& .MuiInputBase-input': { padding: '0 14px' } }}>
                                        <Typography sx={{ mb: 1, fontWeight: 500 }}>Membership Number *</Typography>
                                        <TextField
                                            fullWidth
                                            placeholder="e.g. 12345-24"
                                            variant="outlined"
                                            name="membership_no"
                                            value={data.membership_no}
                                            onChange={(e) => {
                                                const selectedCategory = membercategories.find((c) => c.id === data.membership_category);
                                                const prefix = selectedCategory ? selectedCategory.name + ' ' : '';

                                                // If trying to delete prefix, strictly enforce it
                                                if (isCorporate && selectedCategory && !e.target.value.startsWith(prefix)) {
                                                    // Only allow adding to it, or if completely cleared, reset to prefix
                                                    if (e.target.value.length < prefix.length) {
                                                        handleChange({ target: { name: 'membership_no', value: prefix } });
                                                    } else {
                                                        // If user types somewhere else or pastes without prefix, prepend it (best effort)
                                                        handleChange({ target: { name: 'membership_no', value: prefix + e.target.value.replace(prefix.trim(), '').trim() } });
                                                    }
                                                } else {
                                                    handleChange(e);
                                                }

                                                // Validate membership number after a short delay
                                                setTimeout(() => validateMembershipNumber(e.target.value), 500);
                                            }}
                                            inputProps={{
                                                inputMode: 'numeric',
                                            }}
                                            InputProps={{
                                                endAdornment: (
                                                    <InputAdornment position="end">
                                                        {isValidatingMembershipNo && <CircularProgress size={20} />}
                                                        {!isValidatingMembershipNo && membershipNoStatus === 'available' && <CheckIcon sx={{ color: '#4caf50' }} />}
                                                        {!isValidatingMembershipNo && membershipNoStatus === 'exists' && <CloseRoundedIcon sx={{ color: '#f44336' }} />}
                                                        {!isValidatingMembershipNo && membershipNoStatus === 'error' && <CloseRoundedIcon sx={{ color: '#ff9800' }} />}
                                                    </InputAdornment>
                                                ),
                                            }}
                                            error={membershipNoStatus === 'exists'}
                                            helperText={isValidatingMembershipNo ? 'Checking availability...' : membershipNoStatus === 'available' ? <span style={{ color: '#4caf50' }}>Membership number is available</span> : membershipNoStatus === 'exists' ? `Membership number already exists${membershipNoSuggestion ? `. Try: ${membershipNoSuggestion}` : ''}` : membershipNoStatus === 'error' ? 'Error checking membership number' : ''}
                                            sx={{
                                                '& .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: membershipNoStatus === 'available' ? '#4caf50' : membershipNoStatus === 'exists' ? '#f44336' : '#ccc',
                                                },
                                            }}
                                        />
                                    </Box>
                                </Grid>

                                <Grid item xs={4}>
                                    <Box sx={{ width: '100%', '& .MuiInputBase-root': { height: 40, alignItems: 'center' }, '& .MuiInputBase-input': { padding: '0 14px' } }}>
                                        <Typography sx={{ mb: 1, fontWeight: 500 }}>Barcode Number</Typography>
                                        <TextField
                                            fullWidth
                                            placeholder="e.g. 12345-24"
                                            variant="outlined"
                                            name="barcode_no"
                                            value={data.barcode_no}
                                            onChange={(e) => {
                                                handleChange(e);
                                                validateBarcodeRealTime(e.target.value);
                                            }}
                                            InputProps={{
                                                endAdornment: (
                                                    <InputAdornment position="end">
                                                        {isValidatingBarcode && <CircularProgress size={20} />}
                                                        {!isValidatingBarcode && barcodeStatus === 'available' && <CheckIcon sx={{ color: '#4caf50' }} />}
                                                        {!isValidatingBarcode && barcodeStatus === 'exists' && <CloseRoundedIcon sx={{ color: '#f44336' }} />}
                                                        {!isValidatingBarcode && barcodeStatus === 'error' && <CloseRoundedIcon sx={{ color: '#ff9800' }} />}
                                                    </InputAdornment>
                                                ),
                                            }}
                                            error={barcodeStatus === 'exists'}
                                            helperText={isValidatingBarcode ? 'Checking availability...' : barcodeStatus === 'available' ? <span style={{ color: '#4caf50' }}>Barcode is available</span> : barcodeStatus === 'exists' ? 'Barcode already exists' : barcodeStatus === 'error' ? 'Error checking barcode' : ''}
                                            sx={{
                                                // height: 10,
                                                display: 'flex',
                                                alignItems: 'center',
                                                '& .MuiSelect-select': {
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    paddingY: 0,
                                                },
                                                '& .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: barcodeStatus === 'available' ? '#4caf50' : barcodeStatus === 'exists' ? '#f44336' : '#ccc',
                                                },
                                            }}
                                        />
                                    </Box>
                                </Grid>

                                <Grid item xs={4}>
                                    <Box sx={{ width: '100%', '& .MuiInputBase-root': { height: 40, alignItems: 'center' }, '& .MuiInputBase-input': { padding: '0 14px' } }}>
                                        <Typography sx={{ mb: 1, fontWeight: 500 }}>Membership Date *</Typography>
                                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                                            <DatePicker
                                                format="DD-MM-YYYY"
                                                value={data.membership_date ? dayjs(data.membership_date, 'DD-MM-YYYY') : null}
                                                onChange={(newValue) => {
                                                    const formatted = newValue ? newValue.format('DD-MM-YYYY') : '';
                                                    handleChange({ target: { name: 'membership_date', value: formatted } });
                                                }}
                                                slotProps={{
                                                    textField: {
                                                        fullWidth: true,
                                                        variant: 'outlined',
                                                        size: 'small',
                                                        error: !!fieldErrors.membership_date,
                                                        helperText: fieldErrors.membership_date,
                                                        sx: {
                                                            '& .MuiOutlinedInput-notchedOutline': { borderColor: '#ccc' },
                                                            '& .MuiInputBase-root': { height: 40, paddingRight: 0 },
                                                        },
                                                        onClick: () => setMembershipDateOpen(true),
                                                    },
                                                    actionBar: { actions: ['clear', 'today', 'cancel', 'accept'] },
                                                }}
                                                open={membershipDateOpen}
                                                onClose={() => setMembershipDateOpen(false)}
                                                onOpen={() => setMembershipDateOpen(true)}
                                            />
                                        </LocalizationProvider>
                                    </Box>
                                </Grid>
                                <Grid item xs={4}>
                                    <Box sx={{ width: '100%', '& .MuiInputBase-root': { height: 40, alignItems: 'center' }, '& .MuiInputBase-input': { padding: '0 14px' } }}>
                                        <Typography sx={{ mb: 1, fontWeight: 500 }}>Status of Card</Typography>
                                        <FormControl fullWidth variant="outlined">
                                            <Select
                                                name="card_status"
                                                value={data.card_status}
                                                onChange={handleChange}
                                                displayEmpty
                                                renderValue={(selected) => {
                                                    if (!selected) {
                                                        return <Typography sx={{ color: '#757575' }}>Choose Status</Typography>;
                                                    }
                                                    return selected;
                                                }}
                                                sx={{
                                                    height: 40,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    '& .MuiSelect-select': {
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        paddingY: 0,
                                                    },
                                                    '& .MuiOutlinedInput-notchedOutline': {
                                                        borderColor: '#ccc',
                                                    },
                                                }}
                                            >
                                                {['In-Process', 'Printed', 'Received', 'Issued', 'Re-Printed', 'E-Card Issued', 'Expired'].map((status) => (
                                                    <MenuItem key={status} value={status}>
                                                        {status}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Box>
                                </Grid>

                                <Grid item xs={4}>
                                    <Box sx={{ width: '100%', '& .MuiInputBase-root': { height: 40, alignItems: 'center' }, '& .MuiInputBase-input': { padding: '0 14px' } }}>
                                        <Typography sx={{ mb: 1, fontWeight: 500 }}>Card Issue Date</Typography>
                                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                                            <DatePicker
                                                format="DD-MM-YYYY"
                                                value={data.card_issue_date ? dayjs(data.card_issue_date, 'DD-MM-YYYY') : null}
                                                onChange={(newValue) => {
                                                    const formatted = newValue ? newValue.format('DD-MM-YYYY') : '';
                                                    handleChange({ target: { name: 'card_issue_date', value: formatted } });
                                                }}
                                                slotProps={{
                                                    textField: {
                                                        fullWidth: true,
                                                        variant: 'outlined',
                                                        size: 'small',
                                                        sx: {
                                                            '& .MuiOutlinedInput-notchedOutline': { borderColor: '#ccc' },
                                                            '& .MuiInputBase-root': { height: 40, paddingRight: 0 },
                                                        },
                                                        onClick: () => setCardIssueDateOpen(true),
                                                    },
                                                    actionBar: { actions: ['clear', 'today', 'cancel', 'accept'] },
                                                }}
                                                open={cardIssueDateOpen}
                                                onClose={() => setCardIssueDateOpen(false)}
                                                onOpen={() => setCardIssueDateOpen(true)}
                                            />
                                        </LocalizationProvider>
                                    </Box>
                                </Grid>
                                <Grid item xs={4}>
                                    <Box sx={{ width: '100%', '& .MuiInputBase-root': { height: 40, alignItems: 'center' }, '& .MuiInputBase-input': { padding: '0 14px' } }}>
                                        <Typography sx={{ mb: 1, fontWeight: 500 }}>Card Expiry Date</Typography>
                                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                                            <DatePicker
                                                format="DD-MM-YYYY"
                                                value={data.card_expiry_date ? dayjs(data.card_expiry_date, 'DD-MM-YYYY') : null}
                                                onChange={(newValue) => {
                                                    const formatted = newValue ? newValue.format('DD-MM-YYYY') : '';
                                                    handleChange({ target: { name: 'card_expiry_date', value: formatted } });
                                                }}
                                                slotProps={{
                                                    textField: {
                                                        fullWidth: true,
                                                        variant: 'outlined',
                                                        size: 'small',
                                                        sx: {
                                                            '& .MuiOutlinedInput-notchedOutline': { borderColor: '#ccc' },
                                                            '& .MuiInputBase-root': { height: 40, paddingRight: 0 },
                                                        },
                                                        onClick: () => setCardExpiryDateOpen(true),
                                                    },
                                                    actionBar: { actions: ['clear', 'today', 'cancel', 'accept'] },
                                                }}
                                                open={cardExpiryDateOpen}
                                                onClose={() => setCardExpiryDateOpen(false)}
                                                onOpen={() => setCardExpiryDateOpen(true)}
                                            />
                                        </LocalizationProvider>
                                    </Box>
                                </Grid>
                                <Grid item xs={4}>
                                    <Box sx={{ width: '100%', '& .MuiInputBase-root': { height: 40, alignItems: 'center' }, '& .MuiInputBase-input': { padding: '0 14px' } }}>
                                        <Typography sx={{ mb: 1, fontWeight: 500 }}>Membership Status</Typography>
                                        <FormControl fullWidth variant="outlined">
                                            <Select
                                                name="status"
                                                value={data.status}
                                                onChange={handleChange}
                                                displayEmpty
                                                renderValue={() => {
                                                    const status = data.status;
                                                    const label = status ? status.replace(/_/g, ' ') : '';
                                                    return status ? <Typography sx={{ textTransform: 'capitalize' }}>{label}</Typography> : <Typography sx={{ color: '#757575' }}>Choose Status</Typography>;
                                                }}
                                                sx={{
                                                    '& .MuiOutlinedInput-notchedOutline': {
                                                        borderColor: '#ccc',
                                                    },
                                                }}
                                            >
                                                {['active', 'suspended', 'cancelled', 'absent', 'expired', 'terminated', 'not_assign', 'in_suspension_process'].map((status) => {
                                                    const label = status.replace(/_/g, ' ');
                                                    return (
                                                        <MenuItem key={status} value={status} sx={{ textTransform: 'capitalize' }}>
                                                            {label}
                                                        </MenuItem>
                                                    );
                                                })}
                                            </Select>
                                        </FormControl>
                                    </Box>
                                </Grid>

                                {['suspended', 'cancelled', 'absent', 'in_suspension_process'].includes(data.status) && (
                                    <Grid item xs={12} container spacing={2} sx={{ mt: 2, p: 2, bgcolor: '#fff4e5', borderRadius: 1, border: '1px solid #ffcc80', ml: 2, width: 'calc(100% - 16px)' }}>
                                        <Grid item xs={12}>
                                            <Typography variant="subtitle2" color="warning.main" gutterBottom sx={{ fontWeight: 'bold' }}>
                                                {data.status.charAt(0).toUpperCase() + data.status.slice(1)} Details
                                            </Typography>
                                        </Grid>

                                        {/* Reason */}
                                        <Grid item xs={12}>
                                            <Typography variant="body2" sx={{ mb: 1 }}>
                                                Reason
                                            </Typography>
                                            <TextField fullWidth multiline rows={2} variant="outlined" placeholder={`Enter reason for ${data.status} status`} size="small" name="reason" value={data.reason || ''} onChange={handleChange} sx={{ bgcolor: 'white' }} />
                                        </Grid>

                                        {/* Start Date */}
                                        <Grid item xs={6}>
                                            <Typography variant="body2" sx={{ mb: 1 }}>
                                                Start Date
                                            </Typography>
                                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                                <DatePicker
                                                    format="DD-MM-YYYY"
                                                    value={data.start_date ? dayjs(data.start_date, 'DD-MM-YYYY') : null}
                                                    onChange={(newValue) =>
                                                        handleChange({
                                                            target: {
                                                                name: 'start_date',
                                                                value: newValue ? newValue.format('DD-MM-YYYY') : '',
                                                            },
                                                        })
                                                    }
                                                    slotProps={{
                                                        textField: {
                                                            fullWidth: true,
                                                            size: 'small',
                                                            name: 'start_date',
                                                            sx: { bgcolor: 'white', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#ccc' }, '& .MuiInputBase-root': { height: 40, paddingRight: 0 } },
                                                            onClick: () => setStartDateOpen(true),
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
                                        <Grid item xs={6}>
                                            <Typography variant="body2" sx={{ mb: 1 }}>
                                                End Date
                                            </Typography>
                                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                                <DatePicker
                                                    format="DD-MM-YYYY"
                                                    value={data.end_date ? dayjs(data.end_date, 'DD-MM-YYYY') : null}
                                                    onChange={(newValue) =>
                                                        handleChange({
                                                            target: {
                                                                name: 'end_date',
                                                                value: newValue ? newValue.format('DD-MM-YYYY') : '',
                                                            },
                                                        })
                                                    }
                                                    slotProps={{
                                                        textField: {
                                                            fullWidth: true,
                                                            size: 'small',
                                                            name: 'end_date',
                                                            sx: { bgcolor: 'white', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#ccc' }, '& .MuiInputBase-root': { height: 40, paddingRight: 0 } },
                                                            onClick: () => setEndDateOpen(true),
                                                        },
                                                        actionBar: { actions: ['clear', 'today', 'cancel', 'accept'] },
                                                    }}
                                                    open={endDateOpen}
                                                    onClose={() => setEndDateOpen(false)}
                                                    onOpen={() => setEndDateOpen(true)}
                                                />
                                            </LocalizationProvider>
                                        </Grid>
                                    </Grid>
                                )}
                                <Grid item xs={12}>
                                    {data.previewFiles && data.previewFiles.length > 0 && (
                                        <Box>
                                            <Typography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>
                                                Uploaded Documents ({data.previewFiles.length})
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
                                                {data.previewFiles.map((file, index) => getFilePreview(file, index))}
                                            </div>
                                        </Box>
                                    )}
                                </Grid>

                                {/* Document Missing */}
                                <Grid item xs={12}>
                                    <Box sx={{ mb: 2 }}>
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    checked={data.is_document_missing || false}
                                                    onChange={(e) =>
                                                        handleChange({
                                                            target: {
                                                                name: 'is_document_missing',
                                                                value: e.target.checked,
                                                            },
                                                        })
                                                    }
                                                    sx={{ color: '#1976d2' }}
                                                />
                                            }
                                            label="Document Missing"
                                        />
                                    </Box>
                                    {data.is_document_missing && (
                                        <Box>
                                            <Typography sx={{ mb: 1, fontWeight: 500 }}>Which document is missing?</Typography>
                                            <TextField
                                                fullWidth
                                                multiline
                                                rows={4}
                                                placeholder="Enter missing documents"
                                                variant="outlined"
                                                name="missing_documents"
                                                value={data.missing_documents || ''}
                                                onChange={handleChange}
                                                sx={{
                                                    '& .MuiOutlinedInput-notchedOutline': {
                                                        borderColor: '#ccc',
                                                    },
                                                }}
                                            />
                                        </Box>
                                    )}
                                    {fieldErrors.missing_documents && (
                                        <Typography variant="caption" color="error">
                                            {fieldErrors.missing_documents}
                                        </Typography>
                                    )}
                                </Grid>

                                {/* --- Membership Fee Section --- */}
                                <Grid item xs={12}>
                                    <Typography variant="h6" sx={{ mt: 2, mb: 1, color: '#0c4b6e' }}>
                                        MEMBERSHIP FEE
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField fullWidth label="Membership Fee *" name="membership_fee" type="number" value={data.membership_fee || ''} onChange={handleChange} size="small" />
                                </Grid>
                                <Grid item xs={12} md={6}></Grid>

                                <Grid item xs={12} md={4}>
                                    <TextField fullWidth label="Additional Membership Charges" name="additional_membership_charges" type="number" value={data.additional_membership_charges || ''} onChange={handleChange} size="small" placeholder="(if any)" />
                                </Grid>
                                <Grid item xs={12} md={8}>
                                    <TextField fullWidth label="Remarks for Additional Charges" name="membership_fee_additional_remarks" multiline rows={1} value={data.membership_fee_additional_remarks || ''} onChange={handleChange} size="small" />
                                </Grid>

                                <Grid item xs={12} md={4}>
                                    <TextField fullWidth label="Discount Amount" name="membership_fee_discount" type="number" value={data.membership_fee_discount || ''} onChange={handleChange} size="small" placeholder="(if any)" />
                                </Grid>
                                <Grid item xs={12} md={8}>
                                    <TextField fullWidth label="Remarks for Discount" name="membership_fee_discount_remarks" multiline rows={1} value={data.membership_fee_discount_remarks || ''} onChange={handleChange} size="small" />
                                </Grid>

                                <Grid item xs={12}>
                                    <TextField fullWidth label="Total Membership Fee *" name="total_membership_fee" value={data.total_membership_fee || ''} InputProps={{ readOnly: true }} size="small" sx={{ bgcolor: '#f5f5f5' }} />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField fullWidth label="Amount in Words" value={numberToWords(data.total_membership_fee)} InputProps={{ readOnly: true }} size="small" sx={{ bgcolor: '#cfd8dc' }} />
                                </Grid>

                                {/* --- Maintenance Charges Section --- */}
                                <Grid item xs={12}>
                                    <Typography variant="h6" sx={{ mt: 3, mb: 1, color: '#0c4b6e' }}>
                                        MAINTENANCE CHARGES
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField fullWidth label="Maintenance Charges *" name="maintenance_fee" type="number" value={data.maintenance_fee || ''} onChange={handleChange} size="small" />
                                </Grid>
                                <Grid item xs={12} md={6}></Grid>

                                <Grid item xs={12} md={4}>
                                    <TextField fullWidth label="Additional Maintenance Charges" name="additional_maintenance_charges" type="number" value={data.additional_maintenance_charges || ''} onChange={handleChange} size="small" placeholder="(if any)" />
                                </Grid>
                                <Grid item xs={12} md={8}>
                                    <TextField fullWidth label="Remarks for Additional Charges" name="maintenance_fee_additional_remarks" multiline rows={1} value={data.maintenance_fee_additional_remarks || ''} onChange={handleChange} size="small" />
                                </Grid>

                                <Grid item xs={12} md={4}>
                                    <TextField fullWidth label="Discount Amount" name="maintenance_fee_discount" type="number" value={data.maintenance_fee_discount || ''} onChange={handleChange} size="small" placeholder="(if any)" />
                                </Grid>
                                <Grid item xs={12} md={8}>
                                    <TextField fullWidth label="Remarks for Discount" name="maintenance_fee_discount_remarks" multiline rows={1} value={data.maintenance_fee_discount_remarks || ''} onChange={handleChange} size="small" />
                                </Grid>

                                <Grid item xs={12}>
                                    <TextField fullWidth label="Total Maintenance Charges *" name="total_maintenance_fee" value={data.total_maintenance_fee || ''} InputProps={{ readOnly: true }} size="small" sx={{ bgcolor: '#f5f5f5' }} />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField fullWidth label="Amount in Words" value={numberToWords(data.total_maintenance_fee)} InputProps={{ readOnly: true }} size="small" sx={{ bgcolor: '#cfd8dc' }} />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField fullWidth label="Per Day Maintenance Charges *" name="per_day_maintenance_fee" value={data.per_day_maintenance_fee || ''} InputProps={{ readOnly: true }} size="small" sx={{ bgcolor: '#cfd8dc' }} />
                                </Grid>

                                {/* Business Developer Field */}
                                <Grid item xs={12} md={6} sx={{ mt: 3 }}>
                                    <Autocomplete
                                        options={bdOptions}
                                        getOptionLabel={(option) => `${option.name} (${option.employee_id})`}
                                        value={selectedBd}
                                        onChange={(event, newValue) => {
                                            setSelectedBd(newValue);
                                            // Handle direct data update or use handleChange
                                            // Assuming handleChange treats name/value:
                                            if (handleChangeData) {
                                                handleChangeData('business_developer_id', newValue ? newValue.id : '');
                                                handleChangeData('business_developer', newValue);
                                            } else {
                                                handleChange({ target: { name: 'business_developer_id', value: newValue ? newValue.id : '' } });
                                            }
                                        }}
                                        onInputChange={(event, newInputValue) => {
                                            setBdSearch(newInputValue);
                                        }}
                                        loading={bdLoading}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                label="Membership Done By (Business Developer)"
                                                fullWidth
                                                size="small"
                                                InputProps={{
                                                    ...params.InputProps,
                                                    endAdornment: (
                                                        <>
                                                            {bdLoading ? <CircularProgress color="inherit" size={20} /> : null}
                                                            {params.InputProps.endAdornment}
                                                        </>
                                                    ),
                                                }}
                                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '4px' } }}
                                            />
                                        )}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}></Grid>

                                {/* Comment Box */}
                                <Grid item xs={12} sx={{ mt: 2 }}>
                                    <TextField fullWidth label="Comment Box" name="comment_box" multiline rows={3} value={data.comment_box || ''} onChange={handleChange} placeholder="Enter Remarks" />
                                </Grid>
                            </Grid>
                        </Grid>

                        {/* Documents Upload Dialog */}
                        <Dialog open={openDocumentsDialog} onClose={() => setOpenDocumentsDialog(false)} fullWidth maxWidth="md">
                            <DialogTitle
                                sx={{
                                    fontWeight: 600,
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    pr: 2,
                                }}
                            >
                                Upload Documents
                                <IconButton
                                    onClick={() => setOpenDocumentsDialog(false)}
                                    sx={{
                                        color: '#666',
                                        '&:hover': { color: '#000' },
                                    }}
                                >
                                    <CloseIcon />
                                </IconButton>
                            </DialogTitle>
                            <DialogContent>
                                <Grid container spacing={2} sx={{ mt: 1 }}>
                                    <Grid item xs={12}>
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

                                    {data.previewFiles && data.previewFiles.length > 0 && (
                                        <Grid item xs={12}>
                                            <Typography variant="h6" sx={{ mb: 2 }}>
                                                Uploaded Documents ({data.previewFiles.length})
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
                                                {data.previewFiles.map((file, index) => getFilePreview(file, index))}
                                            </div>
                                        </Grid>
                                    )}
                                </Grid>
                            </DialogContent>
                            <DialogActions sx={{ p: 2 }}>
                                <Button
                                    onClick={() => setOpenDocumentsDialog(false)}
                                    sx={{
                                        textTransform: 'none',
                                        color: '#666',
                                        '&:hover': { backgroundColor: '#f5f5f5' },
                                    }}
                                >
                                    Close
                                </Button>
                            </DialogActions>
                        </Dialog>

                        {/* FamilyMember Popup */}

                        <Dialog open={openFamilyMember} onClose={() => setOpenFamilyMember(false)} fullWidth maxWidth="lg">
                            <DialogTitle
                                sx={{
                                    fontWeight: 600,
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    pr: 2,
                                }}
                            >
                                Family Member Information
                                <IconButton
                                    onClick={() => setOpenFamilyMember(false)}
                                    sx={{
                                        color: '#666',
                                        '&:hover': { color: '#000' },
                                    }}
                                >
                                    <CloseIcon />
                                </IconButton>
                            </DialogTitle>
                            <DialogContent>
                                <Grid container spacing={3}>
                                    <Grid item xs={12} md={showFamilyMember ? 4 : 12}>
                                        <Button
                                            variant="contained"
                                            sx={{
                                                mt: 2,
                                                bgcolor: showFamilyMember ? '#90caf9' : '#e3f2fd',
                                                color: '#000',
                                                textTransform: 'none',
                                                '&:hover': {
                                                    bgcolor: '#90caf9',
                                                },
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                width: '100%',
                                                py: 1.5,
                                            }}
                                            onClick={AddFamilyMember}
                                        >
                                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                                <Typography sx={{ fontWeight: 500 }}>Add Family Member</Typography>
                                                <Typography variant="body2" sx={{ color: '#666' }}>
                                                    If you add family members then click
                                                </Typography>
                                            </Box>
                                            <ChevronRightIcon />
                                        </Button>
                                        {data.family_members.length > 0 && (
                                            <Box sx={{ mt: 3 }}>
                                                <Typography sx={{ mb: 1, fontWeight: 500 }}>Added Family Members</Typography>
                                                {data.family_members.map((family, index) => (
                                                    <Box
                                                        key={index}
                                                        sx={{
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center',
                                                            p: 1,
                                                            border: '1px solid #ccc',
                                                            borderRadius: 1,
                                                            mb: 1,
                                                        }}
                                                    >
                                                        <Typography>
                                                            {family.full_name} ({family.relation})
                                                        </Typography>
                                                        <Box>
                                                            <IconButton size="small" onClick={() => handleEditFamilyMember(index)} sx={{ mr: 1 }}>
                                                                <EditIcon fontSize="small" />
                                                            </IconButton>
                                                            <IconButton size="small" onClick={() => handleDeleteFamilyMember(family, index)}>
                                                                <DeleteIcon fontSize="small" />
                                                            </IconButton>
                                                        </Box>
                                                    </Box>
                                                ))}
                                            </Box>
                                        )}
                                    </Grid>
                                    <Grid item xs={12} md={showFamilyMember ? 8 : 0}>
                                        {showFamilyMember && (
                                            <>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                                    <Typography variant="h6" component="h2" sx={{ fontWeight: 500, color: '#063455' }}>
                                                        Family Member Information
                                                    </Typography>
                                                    <Box sx={{ borderBottom: '1px dashed #ccc', flexGrow: 1, ml: 2 }}></Box>
                                                </Box>

                                                <Box sx={{ mb: 3, display: 'flex', gap: '10px', justifyContent: 'space-between' }}>
                                                    <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                                                        <Box component="span" sx={{ mr: 1, fontWeight: 500 }}>
                                                            Family Membership Number :
                                                        </Box>
                                                        <Box component="span" sx={{ color: '#666' }}>
                                                            {data.membership_no}-{currentFamilyMember.family_suffix}
                                                        </Box>
                                                    </Box>
                                                </Box>

                                                <Box sx={{ mb: 3, display: 'flex', gap: '10px' }}>
                                                    <Box
                                                        sx={{
                                                            border: '1px dashed #90caf9',
                                                            borderRadius: 1,
                                                            p: 2,
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            bgcolor: '#e3f2fd',
                                                            height: '100px',
                                                            width: '100px',
                                                            position: 'relative',
                                                        }}
                                                    >
                                                        {currentFamilyMember.picture_preview ? (
                                                            <>
                                                                <img src={currentFamilyMember.picture_preview} alt="Family member" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                                <Box sx={{ position: 'absolute', top: 0, right: 0 }}>
                                                                    <IconButton size="small" sx={{ bgcolor: 'white', '&:hover': { bgcolor: '#f5f5f5' } }} onClick={handleFamilyPictureDelete}>
                                                                        <DeleteIcon fontSize="small" />
                                                                    </IconButton>
                                                                </Box>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <input accept="image/*" type="file" id="upload-family-picture" style={{ display: 'none' }} onChange={handleImageUpload} />
                                                                <label htmlFor="upload-family-picture">
                                                                    <IconButton component="span" sx={{ color: '#90caf9' }}>
                                                                        <AddIcon />
                                                                    </IconButton>
                                                                </label>
                                                            </>
                                                        )}
                                                    </Box>
                                                    <Box>
                                                        <Typography sx={{ mb: 1, fontWeight: 500 }}>Family Member Picture</Typography>
                                                        <Typography variant="body2" sx={{ color: '#666', mt: 1 }}>
                                                            Click upload to profile picture (4 MB max)
                                                        </Typography>
                                                    </Box>
                                                </Box>

                                                <Grid container spacing={2}>
                                                    {/* First Name */}
                                                    <Grid item xs={4}>
                                                        <Box sx={{ width: '100%', '& .MuiInputBase-root': { height: 40, alignItems: 'center' }, '& .MuiInputBase-input': { padding: '0 14px' } }}>
                                                            <Typography sx={{ mb: 1, fontWeight: 500 }}>First Name*</Typography>
                                                            <TextField
                                                                fullWidth
                                                                placeholder="Enter First Name"
                                                                variant="outlined"
                                                                value={currentFamilyMember.first_name || ''}
                                                                onChange={(e) => handleFamilyMemberChange('first_name', e.target.value)}
                                                                error={!!familyMemberErrors.first_name}
                                                                helperText={familyMemberErrors.first_name}
                                                                sx={{
                                                                    '& .MuiOutlinedInput-notchedOutline': {
                                                                        borderColor: '#ccc',
                                                                    },
                                                                }}
                                                            />
                                                        </Box>
                                                    </Grid>

                                                    {/* Middle Name */}
                                                    <Grid item xs={4}>
                                                        <Box sx={{ width: '100%', '& .MuiInputBase-root': { height: 40, alignItems: 'center' }, '& .MuiInputBase-input': { padding: '0 14px' } }}>
                                                            <Typography sx={{ mb: 1, fontWeight: 500 }}>Middle Name</Typography>
                                                            <TextField
                                                                fullWidth
                                                                placeholder="Enter Middle Name"
                                                                variant="outlined"
                                                                value={currentFamilyMember.middle_name || ''}
                                                                onChange={(e) => handleFamilyMemberChange('middle_name', e.target.value)}
                                                                sx={{
                                                                    '& .MuiOutlinedInput-notchedOutline': {
                                                                        borderColor: '#ccc',
                                                                    },
                                                                }}
                                                            />
                                                        </Box>
                                                    </Grid>

                                                    {/* Last Name */}
                                                    <Grid item xs={4}>
                                                        <Box sx={{ width: '100%', '& .MuiInputBase-root': { height: 40, alignItems: 'center' }, '& .MuiInputBase-input': { padding: '0 14px' } }}>
                                                            <Typography sx={{ mb: 1, fontWeight: 500 }}>Last Name</Typography>
                                                            <TextField
                                                                fullWidth
                                                                placeholder="Enter Last Name"
                                                                variant="outlined"
                                                                value={currentFamilyMember.last_name || ''}
                                                                onChange={(e) => handleFamilyMemberChange('last_name', e.target.value)}
                                                                sx={{
                                                                    '& .MuiOutlinedInput-notchedOutline': {
                                                                        borderColor: '#ccc',
                                                                    },
                                                                }}
                                                            />
                                                        </Box>
                                                    </Grid>
                                                    <Grid item xs={4}>
                                                        <Box sx={{ width: '100%', '& .MuiInputBase-root': { height: 40, alignItems: 'center' }, '& .MuiInputBase-input': { padding: '0 14px' } }}>
                                                            <Typography sx={{ mb: 1, fontWeight: 500 }}>Relation with Primary*</Typography>
                                                            <FormControl fullWidth variant="outlined" error={!!familyMemberErrors.relation}>
                                                                <Select
                                                                    displayEmpty
                                                                    value={currentFamilyMember.relation}
                                                                    onChange={(e) => handleFamilyMemberChange('relation', e.target.value)}
                                                                    renderValue={(selected) => {
                                                                        if (!selected) {
                                                                            return <Typography sx={{ color: '#757575' }}>Choose Relation</Typography>;
                                                                        }
                                                                        return selected;
                                                                    }}
                                                                    sx={{
                                                                        '& .MuiOutlinedInput-notchedOutline': {
                                                                            borderColor: '#ccc',
                                                                        },
                                                                    }}
                                                                >
                                                                    {['Father', 'Son', 'Daughter', 'Wife', 'Mother', 'Grand Son', 'Grand Daughter', 'Second Wife', 'Husband', 'Sister', 'Brother', 'Nephew', 'Niece', 'Father in law', 'Mother in Law'].map((item, index) => (
                                                                        <MenuItem key={index} value={item} sx={{ textTransform: 'capitalize' }}>
                                                                            {item}
                                                                        </MenuItem>
                                                                    ))}
                                                                </Select>
                                                                {!!familyMemberErrors.relation && (
                                                                    <Typography variant="caption" color="error">
                                                                        {familyMemberErrors.relation}
                                                                    </Typography>
                                                                )}
                                                            </FormControl>
                                                        </Box>
                                                    </Grid>

                                                    {/* Passport No */}
                                                    <Grid item xs={4}>
                                                        <Box sx={{ width: '100%', '& .MuiInputBase-root': { height: 40, alignItems: 'center' }, '& .MuiInputBase-input': { padding: '0 14px' } }}>
                                                            <Typography sx={{ mb: 1, fontWeight: 500 }}>Passport No</Typography>
                                                            <TextField
                                                                fullWidth
                                                                placeholder="Enter Passport Number"
                                                                variant="outlined"
                                                                value={currentFamilyMember.passport_no || ''}
                                                                onChange={(e) => handleFamilyMemberChange('passport_no', e.target.value)}
                                                                sx={{
                                                                    '& .MuiOutlinedInput-notchedOutline': {
                                                                        borderColor: '#ccc',
                                                                    },
                                                                }}
                                                            />
                                                        </Box>
                                                    </Grid>
                                                    {/* Nationality */}
                                                    <Grid item xs={4}>
                                                        <Box sx={{ width: '100%', '& .MuiInputBase-root': { height: 40, alignItems: 'center' }, '& .MuiInputBase-input': { padding: '0 14px' } }}>
                                                            <Typography sx={{ mb: 1, fontWeight: 500 }}>Nationality</Typography>
                                                            <TextField
                                                                fullWidth
                                                                placeholder="Enter Nationality"
                                                                variant="outlined"
                                                                value={currentFamilyMember.nationality || ''}
                                                                onChange={(e) => handleFamilyMemberChange('nationality', e.target.value)}
                                                                sx={{
                                                                    '& .MuiOutlinedInput-notchedOutline': {
                                                                        borderColor: '#ccc',
                                                                    },
                                                                }}
                                                            />
                                                        </Box>
                                                    </Grid>
                                                </Grid>

                                                <Grid container spacing={2} sx={{ mt: 1 }}>
                                                    {/* Gender */}
                                                    <Grid item xs={4}>
                                                        <Box sx={{ width: '100%', '& .MuiInputBase-root': { height: 40, mb: 3, alignItems: 'center' }, '& .MuiInputBase-input': { padding: '0 14px' } }}>
                                                            <Typography sx={{ mb: 1, fontWeight: 500 }}>Gender</Typography>
                                                            <FormControl fullWidth variant="outlined">
                                                                <Select
                                                                    displayEmpty
                                                                    value={currentFamilyMember.gender || ''}
                                                                    onChange={(e) => handleFamilyMemberChange('gender', e.target.value)}
                                                                    renderValue={(selected) => {
                                                                        if (!selected) {
                                                                            return <Typography sx={{ color: '#757575' }}>Choose Gender</Typography>;
                                                                        }
                                                                        return selected;
                                                                    }}
                                                                    sx={{
                                                                        '& .MuiOutlinedInput-notchedOutline': {
                                                                            borderColor: '#ccc',
                                                                        },
                                                                    }}
                                                                >
                                                                    <MenuItem value="Male">Male</MenuItem>
                                                                    <MenuItem value="Female">Female</MenuItem>
                                                                    <MenuItem value="Other">Other</MenuItem>
                                                                </Select>
                                                            </FormControl>
                                                        </Box>
                                                    </Grid>

                                                    {/* Marital Status */}
                                                    <Grid item xs={4}>
                                                        <Box sx={{ width: '100%', '& .MuiInputBase-root': { height: 40, mb: 3, alignItems: 'center' }, '& .MuiInputBase-input': { padding: '0 14px' } }}>
                                                            <Typography sx={{ mb: 1, fontWeight: 500 }}>Marital Status</Typography>
                                                            <FormControl fullWidth variant="outlined">
                                                                <Select
                                                                    displayEmpty
                                                                    value={currentFamilyMember.martial_status || ''}
                                                                    onChange={(e) => handleFamilyMemberChange('martial_status', e.target.value)}
                                                                    renderValue={(selected) => {
                                                                        if (!selected) {
                                                                            return <Typography sx={{ color: '#757575' }}>Choose Marital Status</Typography>;
                                                                        }
                                                                        return selected;
                                                                    }}
                                                                    sx={{
                                                                        '& .MuiOutlinedInput-notchedOutline': {
                                                                            borderColor: '#ccc',
                                                                        },
                                                                    }}
                                                                >
                                                                    <MenuItem value="Single">Single</MenuItem>
                                                                    <MenuItem value="Married">Married</MenuItem>
                                                                    <MenuItem value="Divorced">Divorced</MenuItem>
                                                                    <MenuItem value="Widowed">Widowed</MenuItem>
                                                                </Select>
                                                            </FormControl>
                                                        </Box>
                                                    </Grid>
                                                    <Grid item xs={4}>
                                                        <Box sx={{ width: '100%', '& .MuiInputBase-root': { height: 40, alignItems: 'center' }, '& .MuiInputBase-input': { padding: '0 14px' } }}>
                                                            <Typography sx={{ mb: 1, fontWeight: 500 }}>Email</Typography>
                                                            <TextField
                                                                fullWidth
                                                                placeholder="Enter Email"
                                                                variant="outlined"
                                                                name="email"
                                                                type="email"
                                                                value={currentFamilyMember.email}
                                                                error={!!familyMemberErrors.email}
                                                                helperText={familyMemberErrors.email}
                                                                onChange={(e) => handleFamilyMemberChange('email', e.target.value)}
                                                                sx={{
                                                                    '& .MuiOutlinedInput-notchedOutline': {
                                                                        borderColor: '#ccc',
                                                                    },
                                                                }}
                                                            />
                                                        </Box>
                                                    </Grid>
                                                </Grid>

                                                <Grid container spacing={2}>
                                                    <Grid item xs={4}>
                                                        <Box sx={{ width: '100%', '& .MuiInputBase-root': { height: 40, alignItems: 'center' }, '& .MuiInputBase-input': { padding: '0 14px' } }}>
                                                            <Typography sx={{ mb: 1, fontWeight: 500 }}>Barcode Number</Typography>
                                                            <TextField
                                                                fullWidth
                                                                placeholder="e.g. 12345-24"
                                                                variant="outlined"
                                                                name="barcode_no"
                                                                value={currentFamilyMember.barcode_no}
                                                                onChange={(e) => {
                                                                    handleFamilyMemberChange('barcode_no', e.target.value);
                                                                    validateFamilyBarcodeRealTime(e.target.value);
                                                                }}
                                                                inputProps={{
                                                                    maxLength: 12,
                                                                    inputMode: 'numeric',
                                                                }}
                                                                InputProps={{
                                                                    endAdornment: (
                                                                        <InputAdornment position="end">
                                                                            {isValidatingFamilyBarcode && <CircularProgress size={20} />}
                                                                            {!isValidatingFamilyBarcode && familyBarcodeStatus === 'available' && <CheckIcon sx={{ color: '#4caf50' }} />}
                                                                            {!isValidatingFamilyBarcode && familyBarcodeStatus === 'exists' && <CloseRoundedIcon sx={{ color: '#f44336' }} />}
                                                                            {!isValidatingFamilyBarcode && familyBarcodeStatus === 'error' && <CloseRoundedIcon sx={{ color: '#ff9800' }} />}
                                                                        </InputAdornment>
                                                                    ),
                                                                }}
                                                                error={familyBarcodeStatus === 'exists'}
                                                                helperText={isValidatingFamilyBarcode ? 'Checking availability...' : familyBarcodeStatus === 'available' ? <span style={{ color: '#4caf50' }}>Barcode is available</span> : familyBarcodeStatus === 'exists' ? 'Barcode already exists' : familyBarcodeStatus === 'error' ? 'Error checking barcode' : ''}
                                                                sx={{
                                                                    '& .MuiOutlinedInput-notchedOutline': {
                                                                        borderColor: familyBarcodeStatus === 'available' ? '#4caf50' : familyBarcodeStatus === 'exists' ? '#f44336' : '#ccc',
                                                                    },
                                                                }}
                                                            />
                                                        </Box>
                                                    </Grid>
                                                    <Grid item xs={4}>
                                                        <Box sx={{ width: '100%', '& .MuiInputBase-root': { height: 40, alignItems: 'center' }, '& .MuiInputBase-input': { padding: '0 14px' } }}>
                                                            <Typography sx={{ mb: 1, fontWeight: 500 }}>Phone Number</Typography>
                                                            <TextField
                                                                fullWidth
                                                                placeholder="Enter Phone Number"
                                                                variant="outlined"
                                                                value={currentFamilyMember.phone_number}
                                                                onChange={(e) => handleFamilyMemberChange('phone_number', e.target.value.replace(/[^0-9+\-]/g, ''))}
                                                                sx={{
                                                                    '& .MuiOutlinedInput-notchedOutline': {
                                                                        borderColor: '#ccc',
                                                                    },
                                                                }}
                                                            />
                                                        </Box>
                                                    </Grid>
                                                    <Grid item xs={4}>
                                                        <Box sx={{ width: '100%', '& .MuiInputBase-root': { height: 40, alignItems: 'center' }, '& .MuiInputBase-input': { padding: '0 14px' } }}>
                                                            <Typography sx={{ mb: 1, fontWeight: 500 }}>CNIC</Typography>
                                                            <TextField
                                                                fullWidth
                                                                placeholder="XXXXX-XXXXXXX-X"
                                                                variant="outlined"
                                                                value={currentFamilyMember.cnic}
                                                                error={!!familyMemberErrors.cnic}
                                                                helperText={isValidatingFamilyCnic ? 'Checking CNIC availability...' : familyCnicStatus === 'available' ? 'CNIC is available' : familyMemberErrors.cnic}
                                                                onChange={(e) => {
                                                                    let value = e.target.value;
                                                                    value = value.replace(/\D/g, ''); // Remove non-digits
                                                                    if (value.length > 5 && value[5] !== '-') value = value.slice(0, 5) + '-' + value.slice(5);
                                                                    if (value.length > 13 && value[13] !== '-') value = value.slice(0, 13) + '-' + value.slice(13);
                                                                    if (value.length > 15) value = value.slice(0, 15);
                                                                    handleFamilyMemberChange('cnic', value);
                                                                }}
                                                                InputProps={{
                                                                    endAdornment: (
                                                                        <InputAdornment position="end">
                                                                            {isValidatingFamilyCnic && <CircularProgress size={20} />}
                                                                            {!isValidatingFamilyCnic && familyCnicStatus === 'available' && <CheckIcon sx={{ color: '#4caf50' }} />}
                                                                            {!isValidatingFamilyCnic && familyCnicStatus === 'exists' && <CloseRoundedIcon sx={{ color: '#f44336' }} />}
                                                                            {!isValidatingFamilyCnic && familyCnicStatus === 'error' && <CloseRoundedIcon sx={{ color: '#ff9800' }} />}
                                                                        </InputAdornment>
                                                                    ),
                                                                }}
                                                                sx={{
                                                                    '& .MuiOutlinedInput-notchedOutline': {
                                                                        borderColor: familyCnicStatus === 'available' ? '#4caf50' : familyCnicStatus === 'exists' ? '#f44336' : '#ccc',
                                                                    },
                                                                }}
                                                            />
                                                        </Box>
                                                    </Grid>
                                                </Grid>

                                                <Grid container spacing={2} sx={{ mt: 1 }}>
                                                    <Grid item xs={4}>
                                                        <Box sx={{ width: '100%', '& .MuiInputBase-root': { height: 40, alignItems: 'center' }, '& .MuiInputBase-input': { padding: '0 14px' } }}>
                                                            <Typography sx={{ mb: 1, fontWeight: 500 }}>Date of Birth *</Typography>
                                                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                                                <DatePicker
                                                                    format="DD-MM-YYYY"
                                                                    value={currentFamilyMember.date_of_birth ? dayjs(currentFamilyMember.date_of_birth, 'DD-MM-YYYY') : null}
                                                                    onChange={(newValue) => {
                                                                        const formatted = newValue ? newValue.format('DD-MM-YYYY') : '';
                                                                        handleFamilyMemberChange('date_of_birth', formatted);
                                                                    }}
                                                                    slotProps={{
                                                                        textField: {
                                                                            fullWidth: true,
                                                                            variant: 'outlined',
                                                                            size: 'small',
                                                                            error: !!familyMemberErrors.date_of_birth,
                                                                            helperText: familyMemberErrors.date_of_birth || (currentFamilyMember.date_of_birth ? `Age: ${calculateAge(currentFamilyMember.date_of_birth)} years` : ''),
                                                                            sx: {
                                                                                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#ccc' },
                                                                                '& .MuiInputBase-root': { height: 40, paddingRight: 0 },
                                                                            },
                                                                            onClick: () => setFamilyDobOpen(true),
                                                                        },
                                                                        actionBar: { actions: ['clear', 'today', 'cancel', 'accept'] },
                                                                    }}
                                                                    open={familyDobOpen}
                                                                    onClose={() => setFamilyDobOpen(false)}
                                                                    onOpen={() => setFamilyDobOpen(true)}
                                                                />
                                                            </LocalizationProvider>
                                                            {currentFamilyMember.date_of_birth &&
                                                                ['son', 'daughter'].includes(String(currentFamilyMember.relation || '').toLowerCase()) &&
                                                                calculateAge(currentFamilyMember.date_of_birth) >= 25 && (
                                                                <Typography variant="caption" sx={{ color: '#ff9800', mt: 1, display: 'block' }}>
                                                                    ⚠️ Member is 25+ years old. Membership will expire automatically unless extended by Super Admin.
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                    </Grid>
                                                    <Grid item xs={4}>
                                                        <Box sx={{ width: '100%', '& .MuiInputBase-root': { height: 40, alignItems: 'center' }, '& .MuiInputBase-input': { padding: '0 14px' } }}>
                                                            <Typography sx={{ mb: 1, fontWeight: 500 }}>Card Issue Date</Typography>
                                                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                                                <DatePicker
                                                                    format="DD-MM-YYYY"
                                                                    value={currentFamilyMember.card_issue_date ? dayjs(currentFamilyMember.card_issue_date, 'DD-MM-YYYY') : null}
                                                                    onChange={(newValue) => {
                                                                        const formatted = newValue ? newValue.format('DD-MM-YYYY') : '';
                                                                        handleFamilyMemberChange('card_issue_date', formatted);
                                                                    }}
                                                                    slotProps={{
                                                                        textField: {
                                                                            fullWidth: true,
                                                                            variant: 'outlined',
                                                                            size: 'small',
                                                                            sx: {
                                                                                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#ccc' },
                                                                                '& .MuiInputBase-root': { height: 40, paddingRight: 0 },
                                                                            },
                                                                            onClick: () => setFamilyCardIssueOpen(true),
                                                                        },
                                                                        actionBar: { actions: ['clear', 'today', 'cancel', 'accept'] },
                                                                    }}
                                                                    open={familyCardIssueOpen}
                                                                    onClose={() => setFamilyCardIssueOpen(false)}
                                                                    onOpen={() => setFamilyCardIssueOpen(true)}
                                                                />
                                                            </LocalizationProvider>
                                                        </Box>
                                                    </Grid>
                                                    <Grid item xs={4}>
                                                        <Box sx={{ width: '100%', '& .MuiInputBase-root': { height: 40, alignItems: 'center' }, '& .MuiInputBase-input': { padding: '0 14px' } }}>
                                                            <Typography sx={{ mb: 1, fontWeight: 500 }}>Card Expiry Date</Typography>
                                                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                                                <DatePicker
                                                                    format="DD-MM-YYYY"
                                                                    value={currentFamilyMember.card_expiry_date ? dayjs(currentFamilyMember.card_expiry_date, 'DD-MM-YYYY') : null}
                                                                    onChange={(newValue) => {
                                                                        const formatted = newValue ? newValue.format('DD-MM-YYYY') : '';
                                                                        handleFamilyMemberChange('card_expiry_date', formatted);
                                                                    }}
                                                                    slotProps={{
                                                                        textField: {
                                                                            fullWidth: true,
                                                                            variant: 'outlined',
                                                                            size: 'small',
                                                                            sx: {
                                                                                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#ccc' },
                                                                                '& .MuiInputBase-root': { height: 40, paddingRight: 0 },
                                                                            },
                                                                            onClick: () => setFamilyCardExpiryOpen(true),
                                                                        },
                                                                        actionBar: { actions: ['clear', 'today', 'cancel', 'accept'] },
                                                                    }}
                                                                    open={familyCardExpiryOpen}
                                                                    onClose={() => setFamilyCardExpiryOpen(false)}
                                                                    onOpen={() => setFamilyCardExpiryOpen(true)}
                                                                />
                                                            </LocalizationProvider>
                                                        </Box>
                                                    </Grid>
                                                    <Grid item xs={4}>
                                                        <Box sx={{ width: '100%', '& .MuiInputBase-root': { height: 40, alignItems: 'center' }, '& .MuiInputBase-input': { padding: '0 14px' } }}>
                                                            <Typography sx={{ mb: 1, fontWeight: 500 }}>Card Status</Typography>
                                                            <Select
                                                                name="status"
                                                                value={currentFamilyMember.status}
                                                                onChange={(e) => handleFamilyMemberChange('status', e.target.value)}
                                                                displayEmpty
                                                                renderValue={() => {
                                                                    const status = currentFamilyMember.status;
                                                                    const label = status ? status.replace(/_/g, ' ') : '';
                                                                    return status ? <Typography sx={{ textTransform: 'capitalize' }}>{status}</Typography> : <Typography sx={{ color: '#757575' }}>Choose Status</Typography>;
                                                                }}
                                                                sx={{
                                                                    width: '100%',
                                                                    '& .MuiOutlinedInput-notchedOutline': {
                                                                        borderColor: '#ccc',
                                                                    },
                                                                }}
                                                            >
                                                                {['active', 'suspended', 'cancelled', 'absent', 'expired', 'terminated', 'not_assign', 'in_suspension_process'].map((status) => {
                                                                    const label = status.replace(/_/g, ' ');
                                                                    return (
                                                                        <MenuItem key={status} value={status} sx={{ textTransform: 'capitalize' }}>
                                                                            {label}
                                                                        </MenuItem>
                                                                    );
                                                                })}
                                                            </Select>
                                                        </Box>
                                                    </Grid>
                                                    <Grid item xs={4}>
                                                        <Box sx={{ width: '100%', '& .MuiInputBase-root': { height: 40, alignItems: 'center' }, '& .MuiInputBase-input': { padding: '0 14px' } }}>
                                                            <Typography sx={{ mb: 1, fontWeight: 500 }}>Status of Card</Typography>
                                                            <FormControl fullWidth variant="outlined">
                                                                <Select
                                                                    name="card_status"
                                                                    value={currentFamilyMember.card_status}
                                                                    onChange={(e) => handleFamilyMemberChange('card_status', e.target.value)}
                                                                    displayEmpty
                                                                    renderValue={(selected) => {
                                                                        if (!selected) {
                                                                            return <Typography sx={{ color: '#757575' }}>Choose Status</Typography>;
                                                                        }
                                                                        return selected;
                                                                    }}
                                                                    sx={{
                                                                        height: 40,
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        '& .MuiSelect-select': {
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            paddingY: 0,
                                                                        },
                                                                        '& .MuiOutlinedInput-notchedOutline': {
                                                                            borderColor: '#ccc',
                                                                        },
                                                                    }}
                                                                >
                                                                    {['In-Process', 'Printed', 'Received', 'Issued', 'Re-Printed', 'E-Card Issued', 'Expired'].map((status) => (
                                                                        <MenuItem key={status} value={status}>
                                                                            {status}
                                                                        </MenuItem>
                                                                    ))}
                                                                </Select>
                                                            </FormControl>
                                                        </Box>
                                                    </Grid>
                                                    <Grid item xs={12}>
                                                        <Box sx={{ width: '100%', mt: 2 }}>
                                                            <Typography sx={{ mb: 1, fontWeight: 500 }}>Comments</Typography>
                                                            <TextField
                                                                fullWidth
                                                                multiline
                                                                rows={2}
                                                                placeholder="Enter Comments"
                                                                variant="outlined"
                                                                value={currentFamilyMember.comments || ''}
                                                                onChange={(e) => handleFamilyMemberChange('comments', e.target.value)}
                                                                sx={{
                                                                    '& .MuiOutlinedInput-root': {
                                                                        backgroundColor: '#fff',
                                                                        borderRadius: '8px',
                                                                        '& fieldset': { borderColor: '#E0E0E0' },
                                                                        '&:hover fieldset': { borderColor: '#BDBDBD' },
                                                                        '&.Mui-focused fieldset': { borderColor: '#0c4b6e' },
                                                                    },
                                                                    '& .MuiInputBase-input': {
                                                                        color: '#333',
                                                                    },
                                                                }}
                                                            />
                                                        </Box>
                                                    </Grid>
                                                </Grid>

                                                {familyMemberErrors.date && (
                                                    <Typography color="error" variant="body2">
                                                        {familyMemberErrors.date}
                                                    </Typography>
                                                )}

                                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                                                    <Button
                                                        variant="outlined"
                                                        sx={{
                                                            mr: 2,
                                                            textTransform: 'none',
                                                            borderColor: '#ccc',
                                                            color: '#333',
                                                            '&:hover': { borderColor: '#999', backgroundColor: '#f5f5f5' },
                                                        }}
                                                        onClick={handleCancelFamilyMember}
                                                    >
                                                        Cancel
                                                    </Button>
                                                    <Button
                                                        variant="contained"
                                                        sx={{
                                                            bgcolor: '#0c4b6e',
                                                            '&:hover': {
                                                                bgcolor: '#083854',
                                                            },
                                                            textTransform: 'none',
                                                        }}
                                                        onClick={handleSaveFamilyMember}
                                                        disabled={isValidatingFamilyCnic}
                                                    >
                                                        {isValidatingFamilyCnic ? 'Validating CNIC...' : 'Save Members'}
                                                    </Button>
                                                </Box>
                                            </>
                                        )}
                                    </Grid>
                                </Grid>
                            </DialogContent>
                        </Dialog>
                    </Grid>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                        <Button
                            variant="contained"
                            sx={{
                                bgcolor: '#0c4b6e',
                                '&:hover': {
                                    bgcolor: '#083854',
                                },
                                textTransform: 'none',
                            }}
                            onClick={handleSubmit}
                            loading={loading}
                            loadingPosition="start"
                            disabled={loading}
                        >
                            Save & Submit
                        </Button>
                    </Box>
                </Box>
                {/* </Container> */}
            </>
        </>
    );
};

export default AddForm3;
