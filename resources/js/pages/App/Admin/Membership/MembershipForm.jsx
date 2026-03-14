import { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { router } from '@inertiajs/react';
import { Box, IconButton, Avatar, Typography } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import AddForm1 from '@/components/App/membershipForm/AddForm1';
import AddForm2 from '@/components/App/membershipForm/AddForm2';
import AddForm3 from '@/components/App/membershipForm/AddForm3';
import AddForm4 from '@/components/App/membershipForm/AddForm4';
import MembershipStepper from '@/components/App/membershipForm/MembershipStepper';
import { enqueueSnackbar } from 'notistack';
import axios from 'axios';
import { objectToFormData } from '@/helpers/objectToFormData';

import { MembershipCardContent, handlePrintMembershipCard } from './UserCard';
import html2canvas from 'html2canvas';
import { Download as DownloadIcon, Print as PrintIcon, Visibility } from '@mui/icons-material';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button as MuiButton, Chip, Drawer } from '@mui/material';
import MembershipCardComponent from './UserCard';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
dayjs.extend(customParseFormat);

const LOCAL_STORAGE_KEY = 'membershipFormData';

const MembershipDashboard = ({ membershipNo, applicationNo, memberTypesData, membercategories, familyMembers, user, subscriptionTypes, subscriptionCategories }) => {
    // const [open, setOpen] = useState(true);
    const [loading, setLoading] = useState(false);
    const urlParams = new URLSearchParams(window.location.search);
    const initialStep = parseInt(urlParams.get('step')) || 1;
    const [step, setStep] = useState(initialStep);
    const [sameAsCurrent, setSameAsCurrent] = useState(false);
    const [createdMember, setCreatedMember] = useState(null);
    const [openFamilyCardModal, setOpenFamilyCardModal] = useState(false);
    const [selectedFamilyMember, setSelectedFamilyMember] = useState(null);

    const handleDownloadCard = async (elementId, memberNo) => {
        const element = document.getElementById(elementId);
        if (!element) return;

        try {
            const canvas = await html2canvas(element, {
                scale: 2,
                backgroundColor: '#ffffff',
                logging: false,
                useCORS: true,
            });

            const dataUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = `Membership_Card_${memberNo || 'card'}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Error downloading card:', error);
        }
    };

    const getNormalizedUserData = (user) => {
        if (!user) return defaultFormData;

        return {
            member_id: user.id || '',
            application_no: user.application_no || '',
            membership_no: user.membership_no || '',
            barcode_no: user.barcode_no || '',
            profile_photo: user.profile_photo || '',
            first_name: user.first_name || '',
            middle_name: user.middle_name || '',
            last_name: user.last_name || '',
            martial_status: user.martial_status || '',
            kinship: user.kinship || '',
            member_type_id: user.member_type_id || '',
            membership_category: user.member_category_id || '',
            membership_date: user.membership_date || '',
            card_issue_date: user.card_issue_date || '',
            card_expiry_date: user.card_expiry_date || '',
            is_document_missing: user.is_document_missing || false,
            missing_documents: user.missing_documents || [],
            card_status: user.card_status || 'In-Process',
            status: user.status || 'active',
            coa_category_id: user.coa_category_id || '',
            title: user.title || '',
            state: user.state || '',
            application_number: user.application_number || '',
            name_comments: user.name_comments || '',
            guardian_name: user.guardian_name || '',
            guardian_membership: user.guardian_membership || '',
            nationality: user.nationality || '',
            cnic_no: user.cnic_no || '',
            passport_no: user.passport_no || '',
            gender: user.gender || '',
            ntn: user.ntn || '',
            date_of_birth: user.date_of_birth || '',
            education: user.education || '',
            reason: user.reason || '',
            start_date: user.start_date ? dayjs(user.start_date).format('DD-MM-YYYY') : '',
            end_date: user.end_date ? dayjs(user.end_date).format('DD-MM-YYYY') : '',
            mobile_number_a: user.mobile_number_a || '',
            mobile_number_b: user.mobile_number_b || '',
            mobile_number_c: user.mobile_number_c || '',
            telephone_number: user.telephone_number || '',
            personal_email: user.personal_email || '',
            critical_email: user.critical_email || '',
            emergency_name: user.emergency_name || '',
            emergency_relation: user.emergency_relation || '',
            emergency_contact: user.emergency_contact || '',
            current_address: user.current_address || '',
            current_city: user.current_city || '',
            current_country: user.current_country || '',
            permanent_address: user.permanent_address || '',
            permanent_city: user.permanent_city || '',
            permanent_country: user.permanent_country || '',
            country: user.country || '',
            business_developer_id: user.business_developer_id || '',
            business_developer: user.business_developer || null,

            // Fee Fields
            membership_fee: user.membership_fee || '',
            additional_membership_charges: user.additional_membership_charges || '',
            membership_fee_additional_remarks: user.membership_fee_additional_remarks || '',
            membership_fee_discount: user.membership_fee_discount || '',
            membership_fee_discount_remarks: user.membership_fee_discount_remarks || '',
            total_membership_fee: user.total_membership_fee || '',

            maintenance_fee: user.maintenance_fee || '',
            additional_maintenance_charges: user.additional_maintenance_charges || '',
            maintenance_fee_additional_remarks: user.maintenance_fee_additional_remarks || '',
            maintenance_fee_discount: user.maintenance_fee_discount || '',
            maintenance_fee_discount_remarks: user.maintenance_fee_discount_remarks || '',
            total_maintenance_fee: user.total_maintenance_fee || '',
            per_day_maintenance_fee: user.per_day_maintenance_fee || '',
            comment_box: user.comment_box || '',
            documents: Array.isArray(user.documents) ? user.documents.map((doc) => doc.id) : [],
            // previewFiles is for display: keep full objects for showing file names
            previewFiles: Array.isArray(user.documents) ? user.documents : [],
            family_members: familyMembers || [],
            deleted_family_members: [],
        };
    };

    const defaultFormData = {
        profile_photo: '',
        membership_no: membershipNo,
        application_no: applicationNo,
        barcode_no: '',
        member_type_id: '',
        first_name: '',
        middle_name: '',
        last_name: '',
        martial_status: '',
        kinship: '',
        membership_category: '',
        is_document_missing: false,
        missing_documents: '',
        membership_date: '',
        card_issue_date: '',
        card_expiry_date: '',
        card_status: 'In-Process',
        status: 'active',
        coa_category_id: '',
        title: '',
        state: '',
        name_comments: '',
        guardian_name: '',
        guardian_membership: '',
        nationality: '',
        cnic_no: '',
        passport_no: '',
        gender: '',
        ntn: '',
        date_of_birth: '',
        education: '',
        reason: '',
        start_date: '',
        end_date: '',
        mobile_number_a: '',
        mobile_number_b: '',
        mobile_number_c: '',
        telephone_number: '',
        personal_email: '',
        critical_email: '',
        emergency_name: '',
        emergency_relation: '',
        emergency_contact: '',
        current_address: '',
        current_city: '',
        current_country: '',
        permanent_address: '',
        permanent_city: '',
        permanent_country: '',
        country: '',
        business_developer_id: '',

        // Fee Fields
        membership_fee: '',
        additional_membership_charges: '',
        membership_fee_additional_remarks: '',
        membership_fee_discount: '',
        membership_fee_discount_remarks: '',
        total_membership_fee: '',

        maintenance_fee: '',
        additional_maintenance_charges: '',
        maintenance_fee_additional_remarks: '',
        maintenance_fee_discount: '',
        maintenance_fee_discount_remarks: '',
        total_maintenance_fee: '',
        per_day_maintenance_fee: '',
        comment_box: '',
        documents: [],
        previewFiles: [],
        family_members: [],
        deleted_family_members: [],
    };

    const isEditMode = !!user?.id;

    const [formsData, setFormsData] = useState(() => {
        if (!isEditMode) {
            const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (savedData) {
                return JSON.parse(savedData);
            }
        }
        return getNormalizedUserData(user);
    });

    const handleChangeData = (name, value) => {
        addDataInState(name, value);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        addDataInState(name, value);
    };

    useEffect(() => {
        if (!isEditMode) {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(formsData));
        }
    }, [formsData, isEditMode]);

    useEffect(() => {
        if (!sameAsCurrent) return;

        setFormsData((prev) => ({
            ...prev,
            permanent_address: prev.current_address || '',
            permanent_city: prev.current_city || '',
            permanent_country: prev.current_country || '',
        }));
    }, [formsData.current_address, formsData.current_city, formsData.current_country, sameAsCurrent]);

    const addDataInState = (name, value) => {
        if (['member_type_id', 'membership_category'].includes(name)) {
            const updatedFamily = formsData.family_members.map((member) => ({
                ...member,
                [name]: value,
            }));
            setCurrentFamilyMember((prev) => ({ ...prev, [name]: value }));
            setFormsData((prev) => ({
                ...prev,
                [name]: value,
                family_members: updatedFamily,
            }));
        } else if (name.startsWith('family_members.')) {
            const index = parseInt(name.split('.')[1], 10);
            const field = name.split('.')[2];
            setFormsData((prev) => ({
                ...prev,
                family_members: prev.family_members.map((member, i) => (i === index ? { ...member, [field]: value } : member)),
            }));
        } else {
            setFormsData((prev) => ({ ...prev, [name]: value }));
        }
    };

    useEffect(() => {
        const { card_issue_date, card_expiry_date } = formsData;

        if (!card_issue_date || !card_expiry_date) return;

        const parseDate = (dateStr) => {
            const d = dayjs(dateStr, 'DD-MM-YYYY', true);
            return d.isValid() ? d.toDate() : new Date(dateStr);
        };

        const issueDate = parseDate(card_issue_date);
        const expiryDate = parseDate(card_expiry_date);

        formsData.family_members.forEach((fm, idx) => {
            const start = parseDate(fm.start_date);
            const end = parseDate(fm.end_date);

            if (isNaN(start.getTime()) || isNaN(end.getTime())) return;

            const isFuture = start > expiryDate && end > expiryDate;
            const isInRange = start >= issueDate && end <= expiryDate;

            if (isFuture) {
                console.error(`❌ Family member at index ${idx} has dates in the future`);
            } else if (!isInRange && end > expiryDate) {
                console.warn(`⚠️ Family member at index ${idx} is partly outside the range`);
            } else {
                console.log(`✅ Family member ${idx} is valid`);
            }
        });
    }, [formsData.card_issue_date, formsData.card_expiry_date, formsData.family_members]);

    const [currentFamilyMember, setCurrentFamilyMember] = useState({
        id: 'new',
        application_no: '',
        barcode_no: '',
        family_suffix: '',
        first_name: '',
        middle_name: '',
        last_name: '',
        full_name: '',
        relation: '',
        gender: '',
        nationality: '',
        passport_no: '',
        martial_status: '',
        cnic: '',
        phone_number: '',
        email: '',
        member_type_id: '',
        membership_category: '',
        date_of_birth: '',
        start_date: '',
        end_date: '',
        card_issue_date: '',
        card_expiry_date: '',
        card_status: 'In-Process',
        status: 'active',
        picture: null,
        picture_preview: null,
    });

    const handleFinalSubmit = async () => {
        setLoading(true);
        const formData2 = objectToFormData(formsData);

        const isEditMode = !!user?.id;
        const url = isEditMode ? route('membership.update', user.id) : route('membership.store');

        await axios
            .post(url, formData2)
            .then((response) => {
                enqueueSnackbar(`Membership ${isEditMode ? 'updated' : 'created'} successfully.`, { variant: 'success' });
                localStorage.removeItem(LOCAL_STORAGE_KEY);

                if (response.data.member) {
                    if (!isEditMode) {
                        // Redirect to edit page with step 4
                        router.visit(route('membership.edit', response.data.member.id) + '?step=4');
                    } else {
                        setCreatedMember(response.data.member);
                        setStep(4);
                        window.scrollTo(0, 0);
                    }
                } else {
                    router.visit(route('membership.dashboard'));
                }
            })
            .catch((error) => {
                if (error.response?.status === 422 && error.response.data.errors) {
                    Object.entries(error.response.data.errors).forEach(([field, messages]) => {
                        const label = field.replace(/\./g, ' → ');
                        messages.forEach((msg) => enqueueSnackbar(msg, { variant: 'error' }));
                    });
                } else {
                    enqueueSnackbar(error.response?.data?.error || 'Something went wrong.', { variant: 'error' });
                }
            })
            .finally(() => setLoading(false));
    };

    const isStep1Valid = (data) => {
        if (!data.first_name) return false;
        if (!data.guardian_name) return false;
        if (!data.gender) return false;
        if (!data.cnic_no) return false;
        if (!/^\d{5}-\d{7}-\d{1}$/.test(data.cnic_no)) return false;
        if (!data.date_of_birth) return false;
        return true;
    };

    const isStep2Valid = (data) => {
        if (!data.current_address) return false;
        if (!data.current_city) return false;
        if (!data.current_country) return false;
        return true;
    };

    const isStep3Valid = (data) => {
        if (!data.member_type_id) return false;
        if (!data.membership_category) return false;
        if (!data.membership_date) return false;
        if (data.is_document_missing && !data.missing_documents) return false;
        return true;
    };

    const handleStepClick = (targetStep) => {
        // Allow going back without validation
        if (targetStep < step) {
            setStep(targetStep);
            return;
        }

        if (isEditMode) {
            setStep(targetStep);
            return;
        }

        // Validate steps sequentially up to targetStep
        // Example: Current 1, Target 3. Check 1, then 2.
        let canProceed = true;
        let nextStep = step;

        for (let i = step; i < targetStep; i++) {
            if (i === 1) {
                if (!isStep1Valid(formsData)) {
                    canProceed = false;
                    enqueueSnackbar('Please complete Personal Information first.', { variant: 'error' });
                    break;
                }
            } else if (i === 2) {
                if (!isStep2Valid(formsData)) {
                    canProceed = false;
                    enqueueSnackbar('Please complete Contact Information first.', { variant: 'error' });
                    break;
                }
            } else if (i === 3) {
                if (!isStep3Valid(formsData)) {
                    canProceed = false;
                    enqueueSnackbar('Please complete Membership Information first.', { variant: 'error' });
                    break;
                }
                // Special check for Step 3 -> 4: Must have created member (unless in edit mode)
                // If we are in create mode and haven't saved (no createdMember), we can't go to 4, 5, 6
                if (!createdMember && !user) {
                    canProceed = false;
                    enqueueSnackbar('Please save the membership information first.', { variant: 'warning' });
                    break;
                }
            }
            nextStep = i + 1;
        }

        if (canProceed) {
            setStep(targetStep);
        } else {
            // If we failed at some intermediate step, we might want to go to that step
            // But the loop breaks at the failing step 'i'.
            // So if we are at 1, click 3. 1 is valid. 2 is invalid. Loop breaks at i=2.
            // We should probably go to 2?
            // The current logic stays at 'step' (1) if validation fails.
            // User asked: "if step 2 to first then it go easily but if gp frm first to third then vlaidaiton both first 2 step check"
            // If 2 fails, maybe we should move to 2 so user sees errors?
            // But AddForm components show errors on 'handleSubmit'.
            // If I just switch to step 2, the errors won't be visible immediately unless I trigger validation there.
            // For now, I'll just prevent navigation and show snackbar.
        }
    };

    const getStepLabel = (step) => {
        switch (step) {
            case 1:
                return 'Personal Information';
            case 2:
                return 'Contact Information';
            case 3:
                return 'Membership Information';
            case 4:
                return 'Profession & Referral';
            case 5:
                return 'Card';
            case 6:
                return 'Family Cards';
            default:
                return '';
        }
    };

    const getStepTitle = () => {
        switch (step) {
            case 1:
                return 'Personal Information';
            case 2:
                return 'Contact Information';
            case 3:
                return 'Membership Information';
            case 4:
                return 'Profession & Referral';
            case 5:
                return 'Card';
            case 6:
                return 'Family Cards';
            default:
                return '';
        }
    };

    const handleBack = () => {
        if (step === 1) {
            window.history.back();
        } else {
            setStep((prev) => prev - 1);
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
                    backgroundColor: '#F6F6F6',
                }}
            > */}
            <div style={{ backgroundColor: '#f5f5f5', minHeight: '100vh', padding: '20px' }}>
                {/* Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, mt: 2 }}>
                    <IconButton onClick={handleBack}>
                        <ArrowBack sx={{ color: '#063455' }} />
                    </IconButton>
                    <Typography variant="h5" component="h1" sx={{ fontWeight: 600, color: '#063455' }}>
                        {getStepTitle()}
                    </Typography>
                </Box>
                <Box sx={{ mb: 4 }}>
                    <MembershipStepper step={step} onStepClick={handleStepClick} />
                </Box>
                {step === 1 && <AddForm1 data={formsData} handleChange={handleChange} onNext={() => setStep(2)} />}
                {step === 2 && <AddForm2 data={formsData} handleChange={handleChange} onNext={() => setStep(3)} onBack={() => setStep(1)} sameAsCurrent={sameAsCurrent} setSameAsCurrent={setSameAsCurrent} />}
                {step === 3 && <AddForm3 data={formsData} handleChange={handleChange} handleChangeData={handleChangeData} setCurrentFamilyMember={setCurrentFamilyMember} currentFamilyMember={currentFamilyMember} memberTypesData={memberTypesData} onSubmit={handleFinalSubmit} onBack={() => setStep(2)} loading={loading} membercategories={membercategories} />}
                {step === 4 && <AddForm4 onNext={() => setStep(5)} onBack={() => setStep(3)} memberId={createdMember?.id || user?.id} initialData={createdMember || user} familyMembers={formsData.family_members} />}
                {step === 5 && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 4 }}>
                        <Box sx={{ mb: 3 }}>
                            <MembershipCardContent member={createdMember || user} id="main-member-card" />
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <MuiButton variant="contained" startIcon={<PrintIcon />} onClick={() => handlePrintMembershipCard(createdMember || user)} sx={{ bgcolor: '#0a3d62', '&:hover': { bgcolor: '#0c2461' } }}>
                                Print
                            </MuiButton>
                            <MuiButton variant="contained" startIcon={<DownloadIcon />} onClick={() => handleDownloadCard('main-member-card', (createdMember || user)?.membership_no)} sx={{ bgcolor: '#0a3d62', '&:hover': { bgcolor: '#0c2461' } }}>
                                Download
                            </MuiButton>
                        </Box>
                    </Box>
                )}
                {step === 6 && (
                    <Box sx={{ mt: 4 }}>
                        <Typography variant="h6" sx={{ mb: 2, color: '#063455', fontWeight: 600 }}>
                            Family Members Cards
                        </Typography>
                        <TableContainer component={Paper} sx={{ borderRadius: '12px', border: '1px solid #E5E5EA', boxShadow: 'none' }}>
                            <Table>
                                <TableHead>
                                    <TableRow sx={{ backgroundColor: '#063455' }}>
                                        <TableCell sx={{ fontWeight: 600, color: '#fff' }}>Photo</TableCell>
                                        <TableCell sx={{ fontWeight: 600, color: '#fff' }}>Name</TableCell>
                                        <TableCell sx={{ fontWeight: 600, color: '#fff', whiteSpace:'nowrap' }}>Membership No</TableCell>
                                        <TableCell sx={{ fontWeight: 600, color: '#fff' }}>Relation</TableCell>
                                        <TableCell sx={{ fontWeight: 600, color: '#fff' }}>Status</TableCell>
                                        <TableCell sx={{ fontWeight: 600, color: '#fff' }}>Action</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {(formsData.family_members || []).map((fm, index) => (
                                        <TableRow key={index}>
                                            <TableCell>
                                                <Avatar src={fm.picture || fm.picture_preview || '/placeholder.svg'} sx={{ width: 40, height: 40 }} />
                                            </TableCell>
                                            <TableCell>{fm.full_name}</TableCell>
                                            <TableCell>{fm.membership_no || 'N/A'}</TableCell>
                                            <TableCell>{fm.relation}</TableCell>
                                            <TableCell>
                                                <Chip label={fm.status || 'Active'} size="small" color={fm.status === 'active' ? 'success' : 'default'} />
                                            </TableCell>
                                            <TableCell>
                                                <MuiButton
                                                    size="small"
                                                    startIcon={<Visibility />}
                                                    onClick={() => {
                                                        setSelectedFamilyMember({ ...fm, parent_id: createdMember?.id || user?.id });
                                                        setOpenFamilyCardModal(true);
                                                    }}
                                                    sx={{ color: '#063455' }}
                                                >
                                                    View Card
                                                </MuiButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {(!formsData.family_members || formsData.family_members.length === 0) && (
                                        <TableRow>
                                            <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                                                No family members found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                )}
            </div>

            <MembershipCardComponent open={openFamilyCardModal} onClose={() => setOpenFamilyCardModal(false)} member={selectedFamilyMember} />
            {/* </div> */}
        </>
    );
};

export default MembershipDashboard;
