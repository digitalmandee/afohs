import React, { useState, useEffect } from 'react';
import { Box, Typography, Tabs, Tab, Card, CardContent, Grid, Avatar, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Pagination, CircularProgress, Button, Divider, Alert, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, IconButton } from '@mui/material';
import { ArrowBack as ArrowBackIcon, Person, Groups, Edit, Phone, Email, LocationOn, CalendarToday, CreditCard, Badge, Warning, Receipt, Visibility } from '@mui/icons-material';
import { router } from '@inertiajs/react';
import axios from 'axios';
import ReceiptComponent from '@/components/App/Invoice/Receipt';

function TabPanel({ children, value, index, ...other }) {
    return (
        <div role="tabpanel" hidden={value !== index} id={`member-tabpanel-${index}`} aria-labelledby={`member-tab-${index}`} {...other}>
            {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
        </div>
    );
}

const CorporateViewProfile = ({ member }) => {
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
            const response = await axios.get(route('corporate-membership.profile.family-members', member.id), {
                params: { page, per_page: familyPagination.per_page },
            });
            setFamilyMembers(response.data.data || []);
            setFamilyPagination({
                current_page: response.data.current_page || 1,
                last_page: response.data.last_page || 1,
                per_page: response.data.per_page || 10,
                total: response.data.total || 0,
            });
        } catch (error) {
            console.error('Error loading family members:', error);
            setFamilyMembers([]);
        } finally {
            setFamilyLoading(false);
        }
    };

    useEffect(() => {
        if (tabValue === 1) {
            loadFamilyMembers();
        }
    }, [tabValue]);

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const handleFamilyPageChange = (event, page) => {
        loadFamilyMembers(page);
    };

    const handleBack = () => {
        router.visit(route('membership.dashboard'));
    };

    const handleEdit = () => {
        router.visit(route('corporate-membership.edit', member.id));
    };

    const handleViewComment = (comment) => {
        setSelectedComment(comment);
        setOpenCommentModal(true);
    };

    const handleCloseCommentModal = () => {
        setOpenCommentModal(false);
        setSelectedComment('');
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
                            <Typography variant="h5" sx={{ fontWeight: 600, color: '#063455' }}>
                                Corporate Member Profile
                            </Typography>
                        </Box>
                        <Button
                            startIcon={<Edit />}
                            onClick={handleEdit}
                            variant="contained"
                            size="large"
                            sx={{
                                backgroundColor: '#063455',
                                borderRadius: '12px',
                                px: 3,
                                py: 1.5,
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
                                        <Chip
                                            label="Corporate"
                                            size="medium"
                                            sx={{
                                                fontWeight: 600,
                                                fontSize: '14px',
                                                height: '36px',
                                                backgroundColor: '#1976d2',
                                                color: 'white',
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
                            aria-label="corporate member profile tabs"
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
                                                    Nationality
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                    {member.nationality || 'N/A'}
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
                                                <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                                                    {member.current_address || 'N/A'}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    {member.current_city || ''} {member.current_country ? `, ${member.current_country}` : ''}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={12}>
                                                <Divider sx={{ my: 2 }} />
                                                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                                                    Permanent Address
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                                                    {member.permanent_address || 'N/A'}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    {member.permanent_city || ''} {member.permanent_country ? `, ${member.permanent_country}` : ''}
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
                        {familyLoading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                                <CircularProgress />
                            </Box>
                        ) : familyMembers.length === 0 ? (
                            <Box sx={{ textAlign: 'center', py: 4 }}>
                                <Typography variant="body1" color="text.secondary">
                                    No family members found.
                                </Typography>
                            </Box>
                        ) : (
                            <>
                                <TableContainer component={Paper} sx={{ borderRadius: '12px', border: '1px solid #E5E5EA' }}>
                                    <Table>
                                        <TableHead>
                                            <TableRow sx={{ backgroundColor: '#E5E5EA' }}>
                                                <TableCell sx={{ fontWeight: 700, color: '#063455' }}>Photo</TableCell>
                                                <TableCell sx={{ fontWeight: 700, color: '#063455' }}>Name</TableCell>
                                                <TableCell sx={{ fontWeight: 700, color: '#063455' }}>Membership No</TableCell>
                                                <TableCell sx={{ fontWeight: 700, color: '#063455' }}>Relation</TableCell>
                                                <TableCell sx={{ fontWeight: 700, color: '#063455' }}>Gender</TableCell>
                                                <TableCell sx={{ fontWeight: 700, color: '#063455' }}>Card Expiry Date</TableCell>
                                                <TableCell sx={{ fontWeight: 700, color: '#063455' }}>Passport</TableCell>
                                                <TableCell sx={{ fontWeight: 700, color: '#063455' }}>Nationality</TableCell>
                                                <TableCell sx={{ fontWeight: 700, color: '#063455' }}>Marital Status</TableCell>
                                                <TableCell sx={{ fontWeight: 700, color: '#063455' }}>Status</TableCell>
                                                <TableCell sx={{ fontWeight: 700, color: '#063455' }}>Card Status</TableCell>
                                                <TableCell sx={{ fontWeight: 700, color: '#063455' }}>Comments</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {familyMembers.map((fm) => (
                                                <TableRow key={fm.id}>
                                                    <TableCell>
                                                        <Avatar
                                                            src={normalizeImageUrl(fm.profile_photo?.file_path) || '/placeholder.svg'}
                                                            imgProps={withAvatarFallback}
                                                            sx={{ width: 40, height: 40 }}
                                                        />
                                                    </TableCell>
                                                    <TableCell>{fm.full_name}</TableCell>
                                                    <TableCell>{fm.membership_no || 'N/A'}</TableCell>
                                                    <TableCell>{fm.relation || 'N/A'}</TableCell>
                                                    <TableCell>{fm.gender || 'N/A'}</TableCell>
                                                    <TableCell>{formatDate(fm.card_expiry_date)}</TableCell>
                                                    <TableCell>{fm.passport_no || 'N/A'}</TableCell>
                                                    <TableCell>{fm.nationality || 'N/A'}</TableCell>
                                                    <TableCell>{fm.martial_status || 'N/A'}</TableCell>
                                                    <TableCell>
                                                        <Chip label={formatStatus(fm.status)} size="small" color={getStatusColor(fm.status)} />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip label={formatStatus(fm.card_status)} size="small" variant="outlined" />
                                                    </TableCell>
                                                    <TableCell>
                                                        {fm.comment_box && (
                                                            <IconButton onClick={() => handleViewComment(fm.comment_box)} size="small">
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
                                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                                        <Pagination count={familyPagination.last_page} page={familyPagination.current_page} onChange={handleFamilyPageChange} color="primary" />
                                    </Box>
                                )}
                            </>
                        )}
                    </TabPanel>
                </Card>
            </Box>

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

export default CorporateViewProfile;
