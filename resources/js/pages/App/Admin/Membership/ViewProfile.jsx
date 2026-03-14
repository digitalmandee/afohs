import React, { useState, useEffect } from 'react';
import { Box, Typography, Tooltip, Tabs, Tab, Card, CardContent, Grid, Avatar, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Pagination, CircularProgress, Button, Divider, Alert, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, IconButton } from '@mui/material';
import { ArrowBack as ArrowBackIcon, Person, Groups, Edit, Phone, Email, LocationOn, CalendarToday, CreditCard, Badge, Warning, Receipt, Visibility } from '@mui/icons-material';
import { router } from '@inertiajs/react';
import axios from 'axios';
import ReceiptComponent from '@/components/App/Invoice/Receipt';
import { FaEdit } from 'react-icons/fa';

function TabPanel({ children, value, index, ...other }) {
    return (
        <div role="tabpanel" hidden={value !== index} id={`member-tabpanel-${index}`} aria-labelledby={`member-tab-${index}`} {...other}>
            {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
        </div>
    );
}

const ViewProfile = ({ member }) => {
    const normalizeImageUrl = (value) => {
        if (!value) return null;
        const raw = String(value).replace(/\\/g, '/');
        if (/^(https?:|data:|blob:)/i.test(raw)) return raw;
        return raw.startsWith('/') ? raw : `/${raw}`;
    };

    const withAvatarFallback = {
        onError: (event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = '/placeholder.svg?height=100&width=100';
        },
    };

    // const [open, setOpen] = useState(true);
    const [tabValue, setTabValue] = useState(0);
    const [familyMembers, setFamilyMembers] = useState([]);
    const [familyLoading, setFamilyLoading] = useState(false);
    const [familyPagination, setFamilyPagination] = useState({
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: 0,
    });

    // Order History State
    const [orderHistory, setOrderHistory] = useState([]);
    const [orderLoading, setOrderLoading] = useState(false);
    const [orderPagination, setOrderPagination] = useState({
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: 0,
    });

    // Receipt Dialog State
    const [openReceiptModal, setOpenReceiptModal] = useState(false);
    const [selectedOrderForReceipt, setSelectedOrderForReceipt] = useState(null);

    // Comment Dialog State
    const [openCommentModal, setOpenCommentModal] = useState(false);
    const [selectedComment, setSelectedComment] = useState('');

    // Helper function to format status
    const formatStatus = (status) => {
        if (!status) return '';
        return status
            .replace(/[_-]/g, ' ')
            .split(' ')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    };

    // Helper function to format date
    const formatDate = (date) => {
        if (!date) return 'N/A';
        try {
            return new Date(date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            });
        } catch (error) {
            return date;
        }
    };

    // Helper function to format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-PK', {
            style: 'currency',
            currency: 'PKR',
        })
            .format(amount)
            .replace('PKR', 'Rs');
    };

    // Get status color
    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'active':
                return 'success';
            case 'suspended':
            case 'in_suspension_process':
                return 'warning';
            case 'cancelled':
            case 'terminated':
                return 'error';
            case 'expired':
                return 'info';
            default:
                return 'default';
        }
    };

    // Load family members
    const loadFamilyMembers = async (page = 1) => {
        setFamilyLoading(true);
        try {
            const response = await axios.get(route('membership.profile.family-members', member.id), {
                params: { page, per_page: familyPagination.per_page },
            });
            setFamilyMembers(response.data.data);
            setFamilyPagination({
                current_page: response.data.current_page,
                last_page: response.data.last_page,
                per_page: response.data.per_page,
                total: response.data.total,
            });
        } catch (error) {
            console.error('Error loading family members:', error);
        } finally {
            setFamilyLoading(false);
        }
    };

    // Load order history
    const loadOrderHistory = async (page = 1) => {
        setOrderLoading(true);
        try {
            const response = await axios.get(route('membership.profile.order-history', member.id), {
                params: { page, per_page: orderPagination.per_page },
            });
            setOrderHistory(response.data.data);
            setOrderPagination({
                current_page: response.data.current_page,
                last_page: response.data.last_page,
                per_page: response.data.per_page,
                total: response.data.total,
            });
        } catch (error) {
            console.error('Error loading order history:', error);
        } finally {
            setOrderLoading(false);
        }
    };

    useEffect(() => {
        if (tabValue === 1) {
            loadFamilyMembers();
        } else if (tabValue === 2) {
            loadOrderHistory();
        }
    }, [tabValue]);

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const handleFamilyPageChange = (event, page) => {
        loadFamilyMembers(page);
    };

    const handleOrderPageChange = (event, page) => {
        loadOrderHistory(page);
    };

    const handleViewReceipt = (order) => {
        // Open receipt in dialog modal
        setSelectedOrderForReceipt(order);
        setOpenReceiptModal(true);
    };

    const handleCloseReceiptModal = () => {
        setOpenReceiptModal(false);
        setSelectedOrderForReceipt(null);
    };

    const handleViewComment = (comment) => {
        setSelectedComment(comment);
        setOpenCommentModal(true);
    };

    const handleCloseCommentModal = () => {
        setOpenCommentModal(false);
        setSelectedComment('');
    };

    const handleBack = () => {
        router.visit(route('membership.dashboard'));
    };

    const handleEdit = () => {
        router.visit(route('membership.edit', member.id));
    };

    return (
        <>
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 2,
                    bgcolor: '#f5f5f5',
                }}
            >
                {/* Header */}
                <Box sx={{ mb: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <IconButton onClick={() => window.history.back()}>
                                <ArrowBackIcon sx={{ color: '#063455' }} />
                            </IconButton>
                            <Typography sx={{ fontWeight: 700, fontSize: '30px', color: '#063455' }}>Member Profile</Typography>
                        </Box>
                        <Button
                            startIcon={<FaEdit />}
                            onClick={handleEdit}
                            variant="contained"
                            size="large"
                            sx={{
                                backgroundColor: '#063455',
                                borderRadius: '16px',
                                textTransform: 'none',
                                // px: 3,
                                // py: 1.5,
                                '&:hover': {
                                    backgroundColor: '#052a42',
                                },
                            }}
                        >
                            Edit Profile
                        </Button>
                    </Box>

                    {/* Missing Documents Alert */}
                    {member.is_document_missing && (
                        <Alert
                            severity="warning"
                            sx={{
                                mb: 3,
                                borderRadius: '12px',
                                border: '1px solid #ff9800',
                                backgroundColor: '#fff3e0',
                                '& .MuiAlert-icon': {
                                    color: '#f57c00',
                                },
                            }}
                            icon={<Warning />}
                        >
                            <Box>
                                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: '#e65100' }}>
                                    Missing Documents Alert
                                </Typography>
                                <Typography variant="body1" sx={{ mb: 1 }}>
                                    This member has missing documents that need to be submitted:
                                </Typography>
                                <Typography
                                    variant="body1"
                                    sx={{
                                        fontWeight: 600,
                                        color: '#d84315',
                                        backgroundColor: '#ffccbc',
                                        padding: '8px 12px',
                                        borderRadius: '6px',
                                        display: 'inline-block',
                                    }}
                                >
                                    {member.missing_documents || 'Documents not specified'}
                                </Typography>
                            </Box>
                        </Alert>
                    )}

                    {/* Member Header Card */}
                    <Card
                        sx={{
                            mb: 4,
                            borderRadius: '16px',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                            border: '1px solid #E5E5EA',
                        }}
                    >
                        <CardContent sx={{ p: 4 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Box sx={{ position: 'relative' }}>
                                    <Avatar
                                        src={normalizeImageUrl(member.profile_photo?.file_path) || '/placeholder.svg?height=100&width=100'}
                                        alt={member.full_name}
                                        imgProps={withAvatarFallback}
                                        sx={{
                                            width: 100,
                                            height: 100,
                                            border: '4px solid #E5E5EA',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                        }}
                                    />
                                    {member.profile_photos_count > 1 && (
                                        <Chip
                                            label={`${member.profile_photos_count} Photos`}
                                            size="small"
                                            color="warning"
                                            sx={{
                                                position: 'absolute',
                                                bottom: -10,
                                                left: '50%',
                                                transform: 'translateX(-50%)',
                                                zIndex: 2,
                                                fontWeight: 600,
                                                fontSize: '0.7rem',
                                                height: '20px',
                                            }}
                                        />
                                    )}
                                </Box>
                                <Box sx={{ flexGrow: 1 }}>
                                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 2, color: '#063455' }}>
                                        {member.full_name}
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 2 }}>
                                        <Box
                                            sx={{
                                                backgroundColor: '#E5E5EA',
                                                px: 2,
                                                py: 1,
                                                borderRadius: '8px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 1,
                                            }}
                                        >
                                            <Badge sx={{ color: '#063455', fontSize: '16px' }} />
                                            <Typography variant="body1" sx={{ fontWeight: 600, color: '#063455' }}>
                                                {member.membership_no || 'N/A'}
                                            </Typography>
                                        </Box>
                                        <Chip
                                            label={formatStatus(member.status)}
                                            color={getStatusColor(member.status)}
                                            size="medium"
                                            sx={{
                                                fontWeight: 600,
                                                fontSize: '14px',
                                                height: '36px',
                                            }}
                                        />
                                    </Box>
                                    <Box sx={{ display: 'flex', gap: 4 }}>
                                        <Box>
                                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '12px', mb: 0.5 }}>
                                                CATEGORY
                                            </Typography>
                                            <Typography variant="body1" sx={{ fontWeight: 600, color: '#063455' }}>
                                                {member.member_category?.name || 'N/A'}
                                            </Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '12px', mb: 0.5 }}>
                                                TYPE
                                            </Typography>
                                            <Typography variant="body1" sx={{ fontWeight: 600, color: '#063455' }}>
                                                {member.member_type?.name || 'N/A'}
                                            </Typography>
                                        </Box>
                                        {member.kinship && (
                                            <Box>
                                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '12px', mb: 0.5 }}>
                                                    KINSHIP
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 600, color: '#063455' }}>
                                                    {member.kinship_member?.full_name ? `${member.kinship_member.full_name}${member.kinship_member.membership_no ? ` (${member.kinship_member.membership_no})` : ''}` : 'Primary Member'}
                                                </Typography>
                                            </Box>
                                        )}
                                    </Box>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Box>

                {/* Tabs */}
                <Card
                    sx={{
                        borderRadius: '16px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                        border: '1px solid #E5E5EA',
                        overflow: 'hidden',
                    }}
                >
                    <Box
                        sx={{
                            backgroundColor: '#E5E5EA',
                            borderBottom: 1,
                            borderColor: 'divider',
                        }}
                    >
                        <Tabs
                            value={tabValue}
                            onChange={handleTabChange}
                            aria-label="member profile tabs"
                            sx={{
                                '& .MuiTab-root': {
                                    fontWeight: 600,
                                    fontSize: '16px',
                                    textTransform: 'none',
                                    minHeight: '72px',
                                    color: '#063455',
                                    '&.Mui-selected': {
                                        color: '#063455',
                                        backgroundColor: 'rgba(6, 52, 85, 0.1)',
                                    },
                                },
                                '& .MuiTabs-indicator': {
                                    backgroundColor: '#063455',
                                    height: '3px',
                                },
                            }}
                        >
                            <Tab icon={<Person sx={{ fontSize: '24px' }} />} label="Profile Details" id="member-tab-0" aria-controls="member-tabpanel-0" sx={{ px: 4 }} />
                            <Tab icon={<Groups sx={{ fontSize: '24px' }} />} label="Family Members" id="member-tab-1" aria-controls="member-tabpanel-1" sx={{ px: 4 }} />
                            <Tab icon={<Receipt sx={{ fontSize: '24px' }} />} label="Order History" id="member-tab-2" aria-controls="member-tabpanel-2" sx={{ px: 4 }} />
                        </Tabs>
                    </Box>

                    {/* Profile Tab */}
                    <TabPanel value={tabValue} index={0}>
                        <Grid container spacing={3}>
                            {/* Personal Information */}
                            <Grid item xs={12} md={6}>
                                <Card
                                    sx={{
                                        borderRadius: '12px',
                                        border: '1px solid #E5E5EA',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                                        height: 'fit-content',
                                    }}
                                >
                                    <CardContent sx={{ p: 3 }}>
                                        <Box
                                            sx={{
                                                backgroundColor: '#E5E5EA',
                                                borderRadius: '8px',
                                                p: 2,
                                                mb: 3,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 2,
                                            }}
                                        >
                                            <Person sx={{ color: '#063455', fontSize: '24px' }} />
                                            <Typography variant="h6" sx={{ fontWeight: 700, color: '#063455' }}>
                                                Personal Information
                                            </Typography>
                                        </Box>
                                        <Grid container spacing={2}>
                                            <Grid item xs={12} sm={6}>
                                                <Typography variant="body2" color="text.secondary">
                                                    First Name
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                    {member.first_name || 'N/A'}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={12} sm={6}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Middle Name
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                    {member.middle_name || 'N/A'}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={12} sm={6}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Last Name
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                    {member.last_name || 'N/A'}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={12} sm={6}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Gender
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                    {member.gender || 'N/A'}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={12} sm={6}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Date of Birth
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                    {formatDate(member.date_of_birth)}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={12} sm={6}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Marital Status
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                    {member.martial_status || 'N/A'}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={12} sm={6}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Nationality
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                    {member.nationality || 'N/A'}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={12} sm={6}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Education
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                    {member.education || 'N/A'}
                                                </Typography>
                                            </Grid>
                                        </Grid>
                                    </CardContent>
                                </Card>
                            </Grid>

                            {/* Contact Information */}
                            <Grid item xs={12} md={6}>
                                <Card
                                    sx={{
                                        borderRadius: '12px',
                                        border: '1px solid #E5E5EA',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                                        height: 'fit-content',
                                    }}
                                >
                                    <CardContent sx={{ p: 3 }}>
                                        <Box
                                            sx={{
                                                backgroundColor: '#E5E5EA',
                                                borderRadius: '8px',
                                                p: 2,
                                                mb: 3,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 2,
                                            }}
                                        >
                                            <Phone sx={{ color: '#063455', fontSize: '24px' }} />
                                            <Typography variant="h6" sx={{ fontWeight: 700, color: '#063455' }}>
                                                Contact Information
                                            </Typography>
                                        </Box>
                                        <Grid container spacing={2}>
                                            <Grid item xs={12}>
                                                <Typography variant="body2" color="text.secondary">
                                                    CNIC Number
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                    {member.cnic_no || 'N/A'}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={12}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Passport Number
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                    {member.passport_no || 'N/A'}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={12} sm={6}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Mobile A
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                    {member.mobile_number_a || 'N/A'}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={12} sm={6}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Mobile B
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                    {member.mobile_number_b || 'N/A'}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={12} sm={6}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Mobile C
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                    {member.mobile_number_c || 'N/A'}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={12} sm={6}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Telephone
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                    {member.telephone_number || 'N/A'}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={12}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Personal Email
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                    {member.personal_email || 'N/A'}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={12}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Critical Email
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                    {member.critical_email || 'N/A'}
                                                </Typography>
                                            </Grid>
                                        </Grid>
                                    </CardContent>
                                </Card>
                            </Grid>

                            {/* Address Information */}
                            <Grid item xs={12} md={6}>
                                <Card
                                    sx={{
                                        borderRadius: '12px',
                                        border: '1px solid #E5E5EA',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                                        height: 'fit-content',
                                    }}
                                >
                                    <CardContent sx={{ p: 3 }}>
                                        <Box
                                            sx={{
                                                backgroundColor: '#E5E5EA',
                                                borderRadius: '8px',
                                                p: 2,
                                                mb: 3,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 2,
                                            }}
                                        >
                                            <LocationOn sx={{ color: '#063455', fontSize: '24px' }} />
                                            <Typography variant="h6" sx={{ fontWeight: 700, color: '#063455' }}>
                                                Address Information
                                            </Typography>
                                        </Box>
                                        <Grid container spacing={2}>
                                            <Grid item xs={12}>
                                                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                                                    Current Address
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    Address
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                                                    {member.current_address || 'N/A'}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    City
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                                                    {member.current_city || 'N/A'}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    Country
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                    {member.current_country || 'N/A'}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={12}>
                                                <Divider sx={{ my: 2 }} />
                                                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                                                    Permanent Address
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    Address
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                                                    {member.permanent_address || 'N/A'}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    City
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                                                    {member.permanent_city || 'N/A'}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    Country
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                    {member.permanent_country || 'N/A'}
                                                </Typography>
                                            </Grid>
                                        </Grid>
                                    </CardContent>
                                </Card>
                            </Grid>

                            {/* Membership Information */}
                            <Grid item xs={12} md={6}>
                                <Card
                                    sx={{
                                        borderRadius: '12px',
                                        border: '1px solid #E5E5EA',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                                        height: 'fit-content',
                                    }}
                                >
                                    <CardContent sx={{ p: 3 }}>
                                        <Box
                                            sx={{
                                                backgroundColor: '#E5E5EA',
                                                borderRadius: '8px',
                                                p: 2,
                                                mb: 3,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 2,
                                            }}
                                        >
                                            <Badge sx={{ color: '#063455', fontSize: '24px' }} />
                                            <Typography variant="h6" sx={{ fontWeight: 700, color: '#063455' }}>
                                                Membership Information
                                            </Typography>
                                        </Box>
                                        <Grid container spacing={2}>
                                            <Grid item xs={12} sm={6}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Application No
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                    {member.application_no || 'N/A'}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={12} sm={6}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Barcode No
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                    {member.barcode_no || 'N/A'}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={12} sm={6}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Membership Date
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                    {formatDate(member.membership_date)}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={12} sm={6}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Card Issue Date
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                    {formatDate(member.card_issue_date)}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={12} sm={6}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Card Expiry Date
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                    {formatDate(member.card_expiry_date)}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={12} sm={6}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Card Status
                                                </Typography>
                                                <Chip label={formatStatus(member.card_status)} size="small" variant="outlined" />
                                            </Grid>
                                            <Grid item xs={12} sm={6}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Membership Duration
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                    {member.membership_duration || 'N/A'}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={12}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Father Name
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                    {member.guardian_name || 'N/A'}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={12}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Father Membership
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                    {member.guardian_membership || 'N/A'}
                                                </Typography>
                                            </Grid>
                                        </Grid>
                                    </CardContent>
                                </Card>
                            </Grid>

                            {/* Emergency Contact */}
                            <Grid item xs={12}>
                                <Card
                                    sx={{
                                        borderRadius: '12px',
                                        border: '1px solid #E5E5EA',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                                        height: 'fit-content',
                                    }}
                                >
                                    <CardContent sx={{ p: 3 }}>
                                        <Box
                                            sx={{
                                                backgroundColor: '#E5E5EA',
                                                borderRadius: '8px',
                                                p: 2,
                                                mb: 3,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 2,
                                            }}
                                        >
                                            <Phone sx={{ color: '#063455', fontSize: '24px' }} />
                                            <Typography variant="h6" sx={{ fontWeight: 700, color: '#063455' }}>
                                                Emergency Contact
                                            </Typography>
                                        </Box>
                                        <Grid container spacing={2}>
                                            <Grid item xs={12} sm={4}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Emergency Contact Name
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                    {member.emergency_name || 'N/A'}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={12} sm={4}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Relation
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                    {member.emergency_relation || 'N/A'}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={12} sm={4}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Contact Number
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                    {member.emergency_contact || 'N/A'}
                                                </Typography>
                                            </Grid>
                                        </Grid>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>
                    </TabPanel>

                    {/* Family Members Tab */}
                    <TabPanel value={tabValue} index={1}>
                        <Box sx={{ mb: 4 }}>
                            <Box
                                sx={{
                                    backgroundColor: '#E5E5EA',
                                    borderRadius: '12px',
                                    p: 3,
                                    mb: 3,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                }}
                            >
                                <Box>
                                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#063455', mb: 1 }}>
                                        Family Members ({familyPagination.total})
                                    </Typography>
                                    <Typography variant="body1" color="text.secondary">
                                        All family members associated with this membership
                                    </Typography>
                                </Box>
                                <Groups sx={{ color: '#063455', fontSize: '32px' }} />
                            </Box>
                        </Box>

                        {familyLoading ? (
                            <Box
                                sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    py: 8,
                                    backgroundColor: '#E5E5EA',
                                    borderRadius: '12px',
                                }}
                            >
                                <CircularProgress sx={{ color: '#063455', mb: 2 }} size={40} />
                                <Typography variant="body1" sx={{ color: '#063455', fontWeight: 500 }}>
                                    Loading family members...
                                </Typography>
                            </Box>
                        ) : familyMembers.length > 0 ? (
                            <>
                                <TableContainer
                                    component={Paper}
                                    sx={{
                                        overflowX: 'auto',
                                        borderRadius: '16px',
                                    }}
                                >
                                    <Table>
                                        <TableHead>
                                            <TableRow sx={{ backgroundColor: '#063455', height: '30px' }}>
                                                <TableCell sx={{ fontWeight: 600, color: '#fff', fontSize: '14px' }}>Photo</TableCell>
                                                <TableCell sx={{ fontWeight: 600, color: '#fff', fontSize: '14px' }}>Name</TableCell>
                                                <TableCell sx={{ fontWeight: 600, color: '#fff', fontSize: '14px', whiteSpace: 'nowrap' }}>Membership No</TableCell>
                                                <TableCell sx={{ fontWeight: 600, color: '#fff', fontSize: '14px' }}>Relation</TableCell>
                                                <TableCell sx={{ fontWeight: 600, color: '#fff', fontSize: '14px' }}>Gender</TableCell>
                                                <TableCell sx={{ fontWeight: 600, color: '#fff', fontSize: '14px', whiteSpace: 'nowrap' }}>Card Expiry</TableCell>
                                                <TableCell sx={{ fontWeight: 600, color: '#fff', fontSize: '14px' }}>Passport</TableCell>
                                                <TableCell sx={{ fontWeight: 600, color: '#fff', fontSize: '14px' }}>Nationality</TableCell>
                                                <TableCell sx={{ fontWeight: 600, color: '#fff', fontSize: '14px', whiteSpace: 'nowrap' }}>Marital Status</TableCell>
                                                <TableCell sx={{ fontWeight: 600, color: '#fff', fontSize: '14px' }}>Status</TableCell>
                                                <TableCell sx={{ fontWeight: 600, color: '#fff', fontSize: '14px', whiteSpace: 'nowrap' }}>Card Status</TableCell>
                                                <TableCell sx={{ fontWeight: 700, color: '#063455', fontSize: '14px' }}>Comments</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {familyMembers.map((familyMember) => (
                                                <TableRow key={familyMember.id} hover>
                                                    <TableCell>
                                                        <Avatar
                                                            src={normalizeImageUrl(familyMember.profile_photo?.file_path) || '/placeholder.svg?height=40&width=40'}
                                                            alt={familyMember.full_name}
                                                            imgProps={withAvatarFallback}
                                                            sx={{ width: 40, height: 40 }}
                                                        />
                                                    </TableCell>
                                                    <TableCell style={{ color: '#7f7f7f', fontWeight: 400, fontSize: '14px', maxWidth: '120px', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                                                        <Tooltip title={familyMember.full_name} arrow>
                                                            <span>{familyMember.full_name}</span>
                                                        </Tooltip>
                                                    </TableCell>
                                                    <TableCell style={{ color: '#7f7f7f', fontWeight: 400, fontSize: '14px', maxWidth: '100px', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                                                        <Tooltip title={familyMember.membership_no || 'N/A'} arrow>
                                                            <span>{familyMember.membership_no || 'N/A'}</span>
                                                        </Tooltip>
                                                    </TableCell>
                                                    <TableCell style={{ color: '#7f7f7f', fontWeight: 400, fontSize: '14px', whiteSpace: 'nowrap' }}>{familyMember.relation || 'N/A'}</TableCell>
                                                    <TableCell style={{ color: '#7f7f7f', fontWeight: 400, fontSize: '14px', whiteSpace: 'nowrap' }}>{familyMember.gender || 'N/A'}</TableCell>
                                                    <TableCell style={{ color: '#7f7f7f', fontWeight: 400, fontSize: '14px', whiteSpace: 'nowrap' }}>{formatDate(familyMember.card_expiry_date)}</TableCell>
                                                    <TableCell style={{ color: '#7f7f7f', fontWeight: 400, fontSize: '14px', maxWidth: '100px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                                        <Tooltip title={familyMember.passport_no || 'N/A'} arrow>
                                                            <span>{familyMember.passport_no || 'N/A'}</span>
                                                        </Tooltip>
                                                    </TableCell>
                                                    <TableCell style={{ color: '#7f7f7f', fontWeight: 400, fontSize: '14px', whiteSpace: 'nowrap' }}>{familyMember.nationality || 'N/A'}</TableCell>
                                                    <TableCell style={{ color: '#7f7f7f', fontWeight: 400, fontSize: '14px', whiteSpace: 'nowrap' }}>{familyMember.martial_status || 'N/A'}</TableCell>
                                                    <TableCell>
                                                        <Chip label={formatStatus(familyMember.status)} color={getStatusColor(familyMember.status)} size="small" />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip label={formatStatus(familyMember.card_status)} size="small" variant="outlined" />
                                                    </TableCell>
                                                    <TableCell>
                                                        {familyMember.comment_box && (
                                                            <IconButton onClick={() => handleViewComment(familyMember.comment_box)} size="small">
                                                                <Visibility sx={{ color: '#063455' }} />
                                                            </IconButton>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>

                                {familyPagination.last_page > 1 && (
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            justifyContent: 'center',
                                            mt: 4,
                                            p: 3,
                                            backgroundColor: '#E5E5EA',
                                            borderRadius: '12px',
                                        }}
                                    >
                                        <Pagination
                                            count={familyPagination.last_page}
                                            page={familyPagination.current_page}
                                            onChange={handleFamilyPageChange}
                                            sx={{
                                                '& .MuiPaginationItem-root': {
                                                    color: '#063455',
                                                    fontWeight: 600,
                                                    '&.Mui-selected': {
                                                        backgroundColor: '#063455',
                                                        color: 'white',
                                                        '&:hover': {
                                                            backgroundColor: '#052a42',
                                                        },
                                                    },
                                                    '&:hover': {
                                                        backgroundColor: 'rgba(6, 52, 85, 0.1)',
                                                    },
                                                },
                                            }}
                                        />
                                    </Box>
                                )}
                            </>
                        ) : (
                            <Box
                                sx={{
                                    backgroundColor: '#E5E5EA',
                                    borderRadius: '12px',
                                    p: 4,
                                    textAlign: 'center',
                                    border: '1px solid #E5E5EA',
                                }}
                            >
                                <Groups sx={{ color: '#063455', fontSize: '48px', mb: 2 }} />
                                <Typography variant="h6" sx={{ color: '#063455', fontWeight: 600, mb: 1 }}>
                                    No Family Members
                                </Typography>
                                <Typography variant="body1" color="text.secondary">
                                    This member doesn't have any family members associated with their membership.
                                </Typography>
                            </Box>
                        )}
                    </TabPanel>

                    {/* Order History Tab */}
                    <TabPanel value={tabValue} index={2}>
                        <Box sx={{ mb: 4 }}>
                            <Typography variant="h5" sx={{ fontWeight: 700, color: '#063455', mb: 3 }}>
                                Order History
                            </Typography>
                        </Box>

                        {orderLoading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
                                <CircularProgress size={40} sx={{ color: '#063455' }} />
                            </Box>
                        ) : orderHistory && orderHistory.length > 0 ? (
                            <>
                                <Grid container spacing={3}>
                                    {orderHistory.map((order) => (
                                        <Grid item xs={12} md={6} lg={4} key={order.id}>
                                            <Card
                                                sx={{
                                                    borderRadius: '12px',
                                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                                    border: '1px solid #E5E5EA',
                                                    transition: 'all 0.3s ease',
                                                    '&:hover': {
                                                        boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                                                        transform: 'translateY(-2px)',
                                                    },
                                                }}
                                            >
                                                <CardContent sx={{ p: 3 }}>
                                                    {/* Order Header */}
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                                        <Box>
                                                            <Typography variant="h6" sx={{ fontWeight: 600, color: '#063455', mb: 0.5 }}>
                                                                Order #{order.invoice_id || order.id}
                                                            </Typography>
                                                            <Typography variant="body2" color="text.secondary">
                                                                {formatDate(order.created_at)}
                                                            </Typography>
                                                        </Box>
                                                        <Chip label={formatStatus(order.status)} color={order.status === 'completed' ? 'success' : order.status === 'pending' ? 'warning' : 'default'} size="small" sx={{ fontWeight: 600 }} />
                                                    </Box>

                                                    {/* Order Details */}
                                                    <Box sx={{ mb: 2 }}>
                                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                                            Order Type: <strong>{formatStatus(order.order_type)}</strong>
                                                        </Typography>
                                                        {order.table_no && (
                                                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                                                Table: <strong>{order.table_no}</strong>
                                                            </Typography>
                                                        )}
                                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                                            Items: <strong>{order.order_items?.length || 0}</strong>
                                                        </Typography>
                                                    </Box>

                                                    {/* Amount */}
                                                    <Box sx={{ mb: 2 }}>
                                                        <Typography variant="h5" sx={{ fontWeight: 700, color: '#063455' }}>
                                                            {formatCurrency(order.amount)}
                                                        </Typography>
                                                        {order.payment_status && <Chip label={order.payment_status === 'paid' ? 'Paid' : 'Unpaid'} color={order.payment_status === 'paid' ? 'success' : 'error'} size="small" sx={{ mt: 1, fontWeight: 600 }} />}
                                                    </Box>

                                                    {/* Action Button */}
                                                    <Button
                                                        variant="outlined"
                                                        startIcon={<Visibility />}
                                                        onClick={() => handleViewReceipt(order)}
                                                        fullWidth
                                                        sx={{
                                                            borderColor: '#063455',
                                                            color: '#063455',
                                                            fontWeight: 600,
                                                            '&:hover': {
                                                                backgroundColor: '#063455',
                                                                color: 'white',
                                                            },
                                                        }}
                                                    >
                                                        View Receipt
                                                    </Button>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    ))}
                                </Grid>

                                {/* Pagination */}
                                {orderPagination.last_page > 1 && (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                                        <Pagination
                                            count={orderPagination.last_page}
                                            page={orderPagination.current_page}
                                            onChange={handleOrderPageChange}
                                            color="primary"
                                            size="large"
                                            sx={{
                                                '& .MuiPaginationItem-root': {
                                                    color: '#063455',
                                                    fontWeight: 600,
                                                    '&.Mui-selected': {
                                                        backgroundColor: '#063455',
                                                        color: 'white',
                                                    },
                                                },
                                            }}
                                        />
                                    </Box>
                                )}
                            </>
                        ) : (
                            <Box
                                sx={{
                                    backgroundColor: '#E5E5EA',
                                    borderRadius: '12px',
                                    p: 4,
                                    textAlign: 'center',
                                    border: '1px solid #E5E5EA',
                                }}
                            >
                                <Receipt sx={{ color: '#063455', fontSize: '48px', mb: 2 }} />
                                <Typography variant="h6" sx={{ color: '#063455', fontWeight: 600, mb: 1 }}>
                                    No Order History
                                </Typography>
                                <Typography variant="body1" color="text.secondary">
                                    This member hasn't placed any orders yet.
                                </Typography>
                            </Box>
                        )}
                    </TabPanel>
                </Card>
            </Box>

            {/* Receipt Modal Dialog */}
            <Dialog
                open={openReceiptModal}
                onClose={handleCloseReceiptModal}
                PaperProps={{
                    style: {
                        position: 'fixed',
                        top: 0,
                        right: 0,
                        margin: 0,
                        height: '100vh',
                        maxHeight: '100vh',
                        width: '100%',
                        maxWidth: '300px',
                        borderRadius: 0,
                        overflow: 'auto',
                    },
                }}
            >
                <Box sx={{ display: 'flex', height: '100vh' }}>
                    {/* Receipt Component */}
                    <ReceiptComponent invoiceId={selectedOrderForReceipt?.invoice_id || selectedOrderForReceipt?.id} invoiceRoute="member.orderhistory.invoice" openModal={openReceiptModal} closeModal={handleCloseReceiptModal} />
                </Box>
            </Dialog>

            {/* Comment Dialog */}
            <Dialog open={openCommentModal} onClose={handleCloseCommentModal} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ color: '#063455', fontWeight: 600 }}>Family Member Comment</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ color: 'text.primary', whiteSpace: 'pre-wrap' }}>{selectedComment}</DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseCommentModal} variant="contained" sx={{ backgroundColor: '#063455', '&:hover': { backgroundColor: '#052a42' } }}>
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default ViewProfile;
