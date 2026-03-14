import { useState } from 'react';
import { Typography, Button, Card, CardContent, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Avatar, InputAdornment, Tooltip, Box, MenuItem, Tabs, Tab, CircularProgress, LinearProgress, Chip } from '@mui/material';
import { router } from '@inertiajs/react';
import { Search, FilterAlt, People, CreditCard, ExpandMore, ExpandLess, Assignment, AccessTime, CheckCircle, Cancel } from '@mui/icons-material';
import PrintIcon from '@mui/icons-material/Print';
import 'bootstrap/dist/css/bootstrap.min.css';
import SubscriptionCardFilter from './SubscriptionCardFilter';
import SubscriptionUserCard from './SubscriptionUserCard';

const SubscriptionCardsDashboard = ({ 
    subscriptions, 
    total_active_subscriptions, 
    total_expired_subscriptions, 
    total_pending_subscriptions, 
    filters, 
    subscriptionCategories,
    subscriptionTypes 
}) => {
    // Modal state
    const [openCardModal, setOpenCardModal] = useState(false);
    const [selectSubscription, setSelectSubscription] = useState(null);
    const [selectedSubscription, setSelectedSubscription] = useState(null);
    const [filteredSubscriptions, setFilteredSubscriptions] = useState(subscriptions.data);
    const [searchQuery, setSearchQuery] = useState(filters?.search || '');
    const [isLoading, setIsLoading] = useState(false);
    
    // Filter states
    const [filterValues, setFilterValues] = useState({
        payment_status: filters?.payment_status || 'all',
        subscription_category: filters?.subscription_category || 'all',
        subscription_type: filters?.subscription_type || 'all',
        validity_status: filters?.validity_status || 'all',
    });

    // Extract unique status options
    const paymentStatusOptions = [
        { label: 'All Status', value: 'all', icon: null },
        { label: 'Paid', value: 'paid', icon: <CheckCircle /> },
        { label: 'Unpaid', value: 'unpaid', icon: <Cancel /> },
        { label: 'Partial', value: 'partial', icon: <AccessTime /> },
    ];

    const validityStatusOptions = [
        { label: 'All Validity', value: 'all', icon: null },
        { label: 'Active', value: 'active', icon: <CheckCircle /> },
        { label: 'Expired', value: 'expired', icon: <Cancel /> },
    ];

    // Handle search
    const handleSearch = (event) => {
        const query = event.target.value;
        setSearchQuery(query);
        
        if (query.trim() === '') {
            setFilteredSubscriptions(subscriptions.data);
        } else {
            const filtered = subscriptions.data.filter(subscription =>
                subscription.member?.full_name?.toLowerCase().includes(query.toLowerCase()) ||
                subscription.member?.membership_no?.toLowerCase().includes(query.toLowerCase()) ||
                subscription.member?.mobile_number_a?.toLowerCase().includes(query.toLowerCase()) ||
                subscription.subscription_category?.name?.toLowerCase().includes(query.toLowerCase()) ||
                subscription.subscription_type?.name?.toLowerCase().includes(query.toLowerCase())
            );
            setFilteredSubscriptions(filtered);
        }
    };

    // Handle filter changes
    const handleFilterChange = (filterName, value) => {
        const newFilters = { ...filterValues, [filterName]: value };
        setFilterValues(newFilters);
        
        // Apply filters via router
        const queryParams = {
            ...filters,
            [filterName]: value,
            search: searchQuery
        };
        
        // Remove 'all' values from query params
        Object.keys(queryParams).forEach(key => {
            if (queryParams[key] === 'all' || queryParams[key] === '') {
                delete queryParams[key];
            }
        });
        
        router.get(route('cards.subscriptions'), queryParams, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    // Handle search submit
    const handleSearchSubmit = () => {
        const queryParams = {
            ...filterValues,
            search: searchQuery
        };
        
        // Remove 'all' values from query params
        Object.keys(queryParams).forEach(key => {
            if (queryParams[key] === 'all' || queryParams[key] === '') {
                delete queryParams[key];
            }
        });
        
        router.get(route('cards.subscriptions'), queryParams, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    // Handle card modal
    const handleCardModal = (subscription) => {
        setSelectSubscription(subscription);
        setOpenCardModal(true);
    };

    const handleCloseCardModal = () => {
        setOpenCardModal(false);
        setSelectSubscription(null);
    };

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-PK', {
            style: 'currency',
            currency: 'PKR'
        }).format(amount).replace('PKR', 'Rs');
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-GB');
    };

    // Get validity status
    const getValidityStatus = (validTo) => {
        if (!validTo) return 'Active';
        const now = new Date();
        const validToDate = new Date(validTo);
        return validToDate >= now ? 'Active' : 'Expired';
    };

    // Get status color
    const getStatusColor = (status) => {
        switch (status) {
            case 'paid': return 'success';
            case 'unpaid': return 'error';
            case 'partial': return 'warning';
            default: return 'default';
        }
    };

    const getValidityColor = (validTo) => {
        const status = getValidityStatus(validTo);
        return status === 'Active' ? 'success' : 'error';
    };

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box>
                        <Typography variant="h4" component="h1" gutterBottom>
                            Subscription Cards Management
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            Manage and view all subscription cards
                        </Typography>
                    </Box>
                    <Button
                        variant="outlined"
                        onClick={() => router.visit(route('cards.dashboard'))}
                        startIcon={<People />}
                        sx={{ 
                            textTransform: 'none',
                            fontWeight: 500,
                            borderColor: '#063455',
                            color: '#063455',
                            '&:hover': { 
                                borderColor: '#0a4d73',
                                backgroundColor: 'rgba(6, 52, 85, 0.04)'
                            }
                        }}
                    >
                        Member Cards
                    </Button>
                </Box>
            </Box>

            {/* Statistics Cards */}
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2, mb: 3 }}>
                <Card>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box>
                                <Typography color="textSecondary" gutterBottom>
                                    Active Subscriptions
                                </Typography>
                                <Typography variant="h4">
                                    {total_active_subscriptions}
                                </Typography>
                            </Box>
                            <CheckCircle sx={{ fontSize: 40, color: 'success.main' }} />
                        </Box>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box>
                                <Typography color="textSecondary" gutterBottom>
                                    Expired Subscriptions
                                </Typography>
                                <Typography variant="h4">
                                    {total_expired_subscriptions}
                                </Typography>
                            </Box>
                            <Cancel sx={{ fontSize: 40, color: 'error.main' }} />
                        </Box>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box>
                                <Typography color="textSecondary" gutterBottom>
                                    Pending Payments
                                </Typography>
                                <Typography variant="h4">
                                    {total_pending_subscriptions}
                                </Typography>
                            </Box>
                            <AccessTime sx={{ fontSize: 40, color: 'warning.main' }} />
                        </Box>
                    </CardContent>
                </Card>
            </Box>

            {/* Search and Filters */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                        <TextField
                            placeholder="Search by name, membership no, phone..."
                            value={searchQuery}
                            onChange={handleSearch}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Search />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{ minWidth: 300 }}
                        />

                        <TextField
                            select
                            label="Payment Status"
                            value={filterValues.payment_status}
                            onChange={(e) => handleFilterChange('payment_status', e.target.value)}
                            sx={{ minWidth: 150 }}
                        >
                            {paymentStatusOptions.map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        {option.icon}
                                        {option.label}
                                    </Box>
                                </MenuItem>
                            ))}
                        </TextField>

                        <TextField
                            select
                            label="Validity Status"
                            value={filterValues.validity_status}
                            onChange={(e) => handleFilterChange('validity_status', e.target.value)}
                            sx={{ minWidth: 150 }}
                        >
                            {validityStatusOptions.map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        {option.icon}
                                        {option.label}
                                    </Box>
                                </MenuItem>
                            ))}
                        </TextField>

                        <TextField
                            select
                            label="Category"
                            value={filterValues.subscription_category}
                            onChange={(e) => handleFilterChange('subscription_category', e.target.value)}
                            sx={{ minWidth: 150 }}
                        >
                            <MenuItem value="all">All Categories</MenuItem>
                            {subscriptionCategories.map((category) => (
                                <MenuItem key={category.id} value={category.id}>
                                    {category.name}
                                </MenuItem>
                            ))}
                        </TextField>

                        <TextField
                            select
                            label="Type"
                            value={filterValues.subscription_type}
                            onChange={(e) => handleFilterChange('subscription_type', e.target.value)}
                            sx={{ minWidth: 150 }}
                        >
                            <MenuItem value="all">All Types</MenuItem>
                            {subscriptionTypes.map((type) => (
                                <MenuItem key={type.id} value={type.id}>
                                    {type.name}
                                </MenuItem>
                            ))}
                        </TextField>

                        <Button 
                            variant="contained" 
                            onClick={handleSearchSubmit}
                            startIcon={<Search />}
                        >
                            Search
                        </Button>
                    </Box>
                </CardContent>
            </Card>

            {/* Subscriptions Table */}
            <Card>
                <CardContent>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Member</TableCell>
                                    <TableCell>Subscription</TableCell>
                                    <TableCell>Amount</TableCell>
                                    <TableCell>Payment Status</TableCell>
                                    <TableCell>Validity</TableCell>
                                    <TableCell>Valid From</TableCell>
                                    <TableCell>Valid To</TableCell>
                                    <TableCell>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {subscriptions.data.map((subscription) => (
                                    <TableRow key={subscription.id}>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <Avatar
                                                    src={subscription.member?.profile_photo?.file_path ? 
                                                        `/storage/${subscription.member.profile_photo.file_path}` : null}
                                                    sx={{ width: 40, height: 40 }}
                                                >
                                                    {subscription.member?.full_name?.charAt(0)}
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="body2" fontWeight="bold">
                                                        {subscription.member?.full_name}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {subscription.member?.membership_no}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Box>
                                                <Typography variant="body2" fontWeight="bold">
                                                    {subscription.subscription_category?.name}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {subscription.subscription_type?.name}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight="bold">
                                                {formatCurrency(subscription.total_price)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={subscription.status}
                                                color={getStatusColor(subscription.status)}
                                                size="small"
                                                sx={{ textTransform: 'capitalize' }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={getValidityStatus(subscription.valid_to)}
                                                color={getValidityColor(subscription.valid_to)}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">
                                                {formatDate(subscription.valid_from)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">
                                                {formatDate(subscription.valid_to)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                startIcon={<CreditCard />}
                                                onClick={() => handleCardModal(subscription)}
                                            >
                                                View Card
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {/* Pagination */}
                    {subscriptions.links && (
                        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                            {subscriptions.links.map((link, index) => (
                                <Button
                                    key={index}
                                    size="small"
                                    variant={link.active ? "contained" : "outlined"}
                                    disabled={!link.url}
                                    onClick={() => link.url && router.visit(link.url)}
                                    sx={{ mx: 0.5 }}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </Box>
                    )}
                </CardContent>
            </Card>

            {/* Card Modal */}
            {openCardModal && selectSubscription && (
                <SubscriptionUserCard
                    open={openCardModal}
                    onClose={handleCloseCardModal}
                    subscription={selectSubscription}
                />
            )}
        </Box>
    );
};

export default SubscriptionCardsDashboard;
