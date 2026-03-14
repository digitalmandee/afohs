import { useState } from 'react';
import { Typography, Button, Card, CardContent, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Avatar, InputAdornment, Tooltip, Box, MenuItem, Tabs, Tab, CircularProgress, LinearProgress, Chip, Autocomplete } from '@mui/material';
import { router } from '@inertiajs/react';
import { Search, FilterAlt, People, CreditCard, ExpandMore, ExpandLess } from '@mui/icons-material';
import PrintIcon from '@mui/icons-material/Print';
import 'bootstrap/dist/css/bootstrap.min.css';
import CardFilter from './Filter';
import UserCardComponent from './UserCard';
import SubscriptionUserCard from './SubscriptionUserCard';
import MembershipCardComponent from '../Membership/UserCard';
import MembershipDashboardFilter from '../Membership/MembershipDashboardFilter';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

// const drawerWidthOpen = 240;
// const drawerWidthClosed = 110;

const CardsDashboard = ({ members, subscriptions, total_active_members, total_active_family_members, total_active_subscriptions, total_expired_subscriptions, total_pending_subscriptions, filters, memberCategories, subscriptionCategories, subscriptionTypes, cardType = 'members' }) => {
    // Modal state
    const [openCardModal, setOpenCardModal] = useState(false);
    const [selectMember, setSelectMember] = useState(null);
    const [selectedMember, setSelectedMember] = useState(null);
    const [filteredMembers, setFilteredMembers] = useState(members?.data || []);
    const [searchQuery, setSearchQuery] = useState(filters?.search || '');

    // Determine active tab based on cardType
    const getActiveTab = () => {
        if (cardType === 'subscriptions') return 2;
        if (cardType === 'corporate') return 3;
        if (cardType === 'corporate_family') return 4;
        if (cardType === 'family') return 1;
        return 0;
    };

    const [activeTab, setActiveTab] = useState(getActiveTab());
    const [isLoading, setIsLoading] = useState(false);

    // Filter states
    const [filterValues, setFilterValues] = useState({
        card_status: filters?.card_status || 'all',
        status: filters?.status || 'all',
        member_category: filters?.member_category || 'all',
        subscription_category: filters?.subscription_category || 'all',
        subscription_type: filters?.subscription_type || 'all',
    });

    // Extract unique status and member type values from members

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
            <div className="container-fluid p-4" style={{ backgroundColor: '#f5f5f5', minHeight: '100vh', overflowX: 'hidden' }}>
                {/* Header */}
                <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center">
                        <Typography sx={{ fontWeight: 700, color: '#063455', fontSize: '30px' }}>Card Dashboard</Typography>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="row mb-4 mt-4">
                    <div className="col-md-4 mb-3">
                        <Card style={{ backgroundColor: '#063455', color: 'white', height: '150px', borderRadius: '16px' }}>
                            <CardContent className="text-center py-4">
                                <div className="mb-2">
                                    <Avatar style={{ backgroundColor: 'transparent', margin: '0 auto' }}>
                                        <People />
                                    </Avatar>
                                </div>
                                <Typography sx={{ mt: 1, marginBottom: '5px', fontSize: '16px', fontWeight: 400, color: '#C6C6C6' }}>Total Active Members</Typography>
                                <Typography sx={{ fontWeight: 700, fontSize: '24px', color: '#FFFFFF' }}>{total_active_members}</Typography>
                            </CardContent>
                        </Card>
                    </div>
                    <div className="col-md-4 mb-3">
                        <Card style={{ backgroundColor: '#063455', color: 'white', height: '150px', borderRadius: '16px' }}>
                            <CardContent className="text-center py-4">
                                <div className="mb-2">
                                    <Avatar style={{ backgroundColor: 'transparent', margin: '0 auto' }}>
                                        <People />
                                    </Avatar>
                                </div>
                                <Typography sx={{ mt: 1, marginBottom: '5px', fontSize: '16px', fontWeight: 400, color: '#C6C6C6' }}>Active Family Members</Typography>
                                <Typography sx={{ fontWeight: 700, fontSize: '24px', color: '#FFFFFF' }}>{total_active_family_members || 0}</Typography>
                            </CardContent>
                        </Card>
                    </div>
                    <div className="col-md-4 mb-3">
                        <Card style={{ backgroundColor: '#063455', color: 'white', height: '150px', borderRadius: '16px' }}>
                            <CardContent className="text-center py-4">
                                <div className="mb-2">
                                    <Avatar style={{ backgroundColor: 'transparent', margin: '0 auto' }}>
                                        <CreditCard />
                                    </Avatar>
                                </div>
                                <Typography sx={{ mt: 1, marginBottom: '5px', fontSize: '16px', fontWeight: 400, color: '#C6C6C6' }}>Total Revenue</Typography>
                                <Typography sx={{ fontWeight: 700, fontSize: '24px', color: '#FFFFFF' }}>0</Typography>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Recently Joined Section */}
                <div className="mx-0">
                    {/* Tabs for Members and Family Members */}
                    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                        <Tabs
                            value={activeTab}
                            onChange={(e, newValue) => {
                                setActiveTab(newValue);
                                setIsLoading(true);
                                const params = new URLSearchParams(window.location.search);

                                // Set card_type based on tab
                                if (newValue === 0) {
                                    params.set('card_type', 'members');
                                    params.delete('member_type_filter');
                                } else if (newValue === 1) {
                                    params.set('card_type', 'family');
                                    params.delete('member_type_filter');
                                } else if (newValue === 2) {
                                    params.set('card_type', 'subscriptions');
                                    params.delete('member_type_filter');
                                } else if (newValue === 3) {
                                    params.set('card_type', 'corporate');
                                    params.delete('member_type_filter');
                                } else if (newValue === 4) {
                                    params.set('card_type', 'corporate_family');
                                    params.delete('member_type_filter');
                                }

                                router.visit(`${window.location.pathname}?${params.toString()}`, {
                                    preserveState: true,
                                    preserveScroll: true,
                                    onFinish: () => setIsLoading(false),
                                });
                            }}
                            sx={{
                                '& .MuiTab-root': {
                                    textTransform: 'none',
                                    fontSize: '16px',
                                    fontWeight: 500,
                                    minWidth: 120,
                                },
                                '& .Mui-selected': {
                                    color: '#063455',
                                },
                                '& .MuiTabs-indicator': {
                                    backgroundColor: '#063455',
                                },
                            }}
                        >
                            <Tab label="Member Cards" />
                            <Tab label="Family Member Cards" />
                            <Tab label="Subscription Cards" />
                            <Tab label="Corporate Cards" />
                            <Tab label="Corporate Family Cards" />
                        </Tabs>
                    </Box>

                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <Typography style={{ fontWeight: 500, fontSize: '24px', color: '#000000' }}>{activeTab === 0 ? 'Member Cards' : activeTab === 1 ? 'Family Member Cards' : activeTab === 2 ? 'Subscription Cards' : activeTab === 3 ? 'Corporate Cards' : 'Corporate Family Cards'}</Typography>
                        <Button
                            variant="contained"
                            startIcon={<PrintIcon />}
                            sx={{
                                backgroundColor: '#063455',
                                textTransform: 'none',
                                color: '#fff',
                                borderRadius: '16px',
                            }}
                        >
                            Print
                        </Button>
                    </div>

                    {/* Conditional Filter Section */}
                    <Box sx={{ mb: 3, mt: 5, backgroundColor: 'transparent' }}>
                        {activeTab === 2 ? (
                            /* Subscription Filters */
                            <>
                                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2 }}>
                                    <TextField
                                        placeholder="Search by name, membership no, phone..."
                                        variant="outlined"
                                        size="small"
                                        value={searchQuery}
                                        onChange={(e) => {
                                            setSearchQuery(e.target.value);
                                            const params = new URLSearchParams(window.location.search);
                                            if (e.target.value) {
                                                params.set('search', e.target.value);
                                            } else {
                                                params.delete('search');
                                            }
                                            router.visit(`${window.location.pathname}?${params.toString()}`, {
                                                preserveState: true,
                                                preserveScroll: true,
                                            });
                                        }}
                                        fullWidth
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <Search />
                                                </InputAdornment>
                                            ),
                                        }}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: '16px',
                                            },
                                        }}
                                    />
                                    {/* <TextField
                                            select
                                            label="Card Status"
                                            size="small"
                                            value={filterValues.card_status || 'all'}
                                            onChange={(e) => setFilterValues({ ...filterValues, card_status: e.target.value })}
                                            fullWidth
                                        >
                                            <MenuItem value="all">All Status</MenuItem>
                                            <MenuItem value="active">Active</MenuItem>
                                            <MenuItem value="expired">Expired</MenuItem>
                                            <MenuItem value="suspended">Suspended</MenuItem>
                                            <MenuItem value="cancelled">Cancelled</MenuItem>
                                        </TextField> */}
                                    <Autocomplete
                                        size="small"
                                        options={['all', 'active', 'expired', 'suspended', 'cancelled']}
                                        value={filterValues.card_status || 'all'}
                                        onChange={(e, newValue) => setFilterValues({ ...filterValues, card_status: newValue })}
                                        renderInput={(params) => <TextField {...params} label="Card Status" fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }} />}
                                        renderOption={(props, option) => (
                                            <MenuItem {...props} value={option}>
                                                {option === 'all' ? 'All Status' : option === 'active' ? 'Active' : option === 'expired' ? 'Expired' : option === 'suspended' ? 'Suspended' : 'Cancelled'}
                                            </MenuItem>
                                        )}
                                        fullWidth
                                    />
                                    {/* <TextField
                                        select
                                        label="Subscription Category"
                                        size="small"
                                        value={filterValues.subscription_category || 'all'}
                                        onChange={(e) => setFilterValues({ ...filterValues, subscription_category: e.target.value })}
                                        fullWidth
                                    >
                                        <MenuItem value="all">All Categories</MenuItem>
                                        {subscriptionCategories?.map((category) => (
                                            <MenuItem key={category.id} value={category.id}>
                                                {category.name}
                                            </MenuItem>
                                        ))}
                                    </TextField> */}
                                    <Autocomplete
                                        size="small"
                                        options={[{ id: 'all', name: 'All Categories' }, ...(subscriptionCategories || [])]}
                                        getOptionLabel={(option) => option.name || ''}
                                        value={filterValues.subscription_category === 'all' ? { id: 'all', name: 'All Categories' } : subscriptionCategories?.find((cat) => cat.id === filterValues.subscription_category) || null}
                                        onChange={(e, newValue) =>
                                            setFilterValues({
                                                ...filterValues,
                                                subscription_category: newValue?.id || 'all',
                                            })
                                        }
                                        renderInput={(params) => <TextField {...params} label="Subscription Category" fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }} />}
                                        fullWidth
                                    />
                                    {/* <TextField
                                        select
                                        label="Subscription Type"
                                        size="small"
                                        value={filterValues.subscription_type || 'all'}
                                        onChange={(e) => setFilterValues({ ...filterValues, subscription_type: e.target.value })}
                                        fullWidth
                                    >
                                        <MenuItem value="all">All Types</MenuItem>
                                        {subscriptionTypes?.map((type) => (
                                            <MenuItem key={type.id} value={type.id}>
                                                {type.name}
                                            </MenuItem>
                                        ))}
                                    </TextField> */}
                                    <Autocomplete
                                        size="small"
                                        options={[{ id: 'all', name: 'All Types' }, ...(subscriptionTypes || [])]}
                                        getOptionLabel={(option) => option.name || ''}
                                        value={filterValues.subscription_type === 'all' ? { id: 'all', name: 'All Types' } : subscriptionTypes?.find((type) => type.id === filterValues.subscription_type) || null}
                                        onChange={(e, newValue) =>
                                            setFilterValues({
                                                ...filterValues,
                                                subscription_type: newValue?.id || 'all',
                                            })
                                        }
                                        renderInput={(params) => <TextField {...params} label="Subscription Type" fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }} />}
                                        fullWidth
                                    />
                                </Box>
                            </>
                        ) : (
                            /* Member/Family Filters */
                            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2 }}>
                                <TextField
                                    placeholder="Search by name, membership no, contact"
                                    variant="outlined"
                                    size="small"
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        const params = new URLSearchParams(window.location.search);
                                        if (e.target.value) {
                                            params.set('search', e.target.value);
                                        } else {
                                            params.delete('search');
                                        }
                                        router.visit(`${window.location.pathname}?${params.toString()}`, {
                                            preserveState: true,
                                            preserveScroll: true,
                                        });
                                    }}
                                    fullWidth
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Search />
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: '16px',
                                        },
                                    }}
                                />
                                {/* <TextField
                                    select
                                    label="Card Status"
                                    size="small"
                                    value={filterValues.card_status}
                                    onChange={(e) => setFilterValues({ ...filterValues, card_status: e.target.value })}
                                    fullWidth
                                >
                                    <MenuItem value="all">All</MenuItem>
                                    {['In-Process', 'Printed', 'Received', 'Issued', 'Applied', 'Re-Printed', 'Not Applied', 'Expired', 'Not Applicable', 'E-Card Issued'].map((status, idx) => (
                                        <MenuItem key={idx} value={status}>
                                            {status}
                                        </MenuItem>
                                    ))}
                                </TextField> */}
                                <Autocomplete size="small" options={['All', 'In-Process', 'Printed', 'Received', 'Issued', 'Applied', 'Re-Printed', 'Not Applied', 'Expired', 'Not Applicable', 'E-Card Issued']} value={filterValues.card_status || 'All'} onChange={(e, newValue) => setFilterValues({ ...filterValues, card_status: newValue || 'All' })} renderInput={(params) => <TextField {...params} label="Card Status" fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }} />} fullWidth />
                                {/* <TextField
                                    select
                                    label="Member Status"
                                    size="small"
                                    value={filterValues.status}
                                    onChange={(e) => setFilterValues({ ...filterValues, status: e.target.value })}
                                    fullWidth
                                >
                                    <MenuItem value="all">All Member Status</MenuItem>
                                    <MenuItem value="active">Active</MenuItem>
                                    <MenuItem value="suspended">Suspended</MenuItem>
                                    <MenuItem value="cancelled">Cancelled</MenuItem>
                                    <MenuItem value="pause">Pause</MenuItem>
                                </TextField> */}
                                <Autocomplete size="small" options={['All', 'active', 'suspended', 'cancelled', 'pause']} value={filterValues.status || 'All'} onChange={(e, newValue) => setFilterValues({ ...filterValues, status: newValue || 'All' })} renderInput={(params) => <TextField {...params} label="Member Status" fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }} />} fullWidth />
                                {/* <TextField
                                    select
                                    label="Member Category"
                                    size="small"
                                    value={filterValues.member_category}
                                    onChange={(e) => setFilterValues({ ...filterValues, member_category: e.target.value })}
                                    fullWidth
                                >
                                    <MenuItem value="all">All Member Categories</MenuItem>
                                    {memberCategories?.map((category) => (
                                        <MenuItem key={category.id} value={category.id}>
                                            {category.description}
                                        </MenuItem>
                                    ))}
                                </TextField> */}
                                <Autocomplete
                                    size="small"
                                    options={[{ id: 'All', description: 'All Member Categories' }, ...(memberCategories || [])]}
                                    getOptionLabel={(option) => option.description || ''}
                                    value={filterValues.member_category === 'All' ? { id: 'All', description: 'All Member Categories' } : memberCategories?.find((cat) => cat.id === filterValues.member_category) || null}
                                    onChange={(e, newValue) =>
                                        setFilterValues({
                                            ...filterValues,
                                            member_category: newValue?.id || 'All',
                                        })
                                    }
                                    renderInput={(params) => <TextField {...params} label="Member Category" fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }} />}
                                    fullWidth
                                />
                            </Box>
                        )}

                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
                            <Button
                                variant="outlined"
                                // size="small"
                                style={{
                                    color: '#063455',
                                    border: '1px solid #063455',
                                    borderRadius: '16px',
                                    paddingLeft: 25,
                                    paddingRight: 25
                                }}
                                onClick={() => {
                                    setFilterValues({
                                        card_status: 'all',
                                        status: 'all',
                                        member_category: 'all',
                                        subscription_category: 'all',
                                        subscription_type: 'all',
                                    });
                                    router.visit(window.location.pathname, {
                                        preserveState: false,
                                    });
                                }}
                                sx={{ textTransform: 'none' }}
                            >
                                Reset
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<Search />}
                                // size="small"
                                style={{ borderRadius: '16px', color: '#fff', paddingLeft: 25, paddingRight: 25 }}
                                onClick={() => {
                                    const params = new URLSearchParams(window.location.search);

                                    // Add filters to URL
                                    Object.keys(filterValues).forEach((key) => {
                                        if (filterValues[key] && filterValues[key] !== 'all') {
                                            params.set(key, filterValues[key]);
                                        } else {
                                            params.delete(key);
                                        }
                                    });

                                    router.visit(`${window.location.pathname}?${params.toString()}`, {
                                        preserveState: true,
                                        preserveScroll: true,
                                    });
                                }}
                                sx={{
                                    backgroundColor: '#063455',
                                    textTransform: 'none',
                                    border: 'none',
                                    '&:hover': { backgroundColor: '#052d45' },
                                }}
                            >
                                Search
                            </Button>
                        </Box>
                    </Box>

                    {/* Loading Indicator */}
                    {isLoading && (
                        <Box sx={{ width: '100%', mb: 2 }}>
                            <LinearProgress
                                sx={{
                                    backgroundColor: '#e0e0e0',
                                    '& .MuiLinearProgress-bar': {
                                        backgroundColor: '#063455',
                                    },
                                }}
                            />
                        </Box>
                    )}

                    {/* Conditional Table Rendering */}
                    {activeTab === 2 ? (
                        /* Subscription Cards Table */
                        <TableContainer component={Paper} style={{ boxShadow: 'none', overflowX: 'auto', borderRadius: '12px' }}>
                            <Table>
                                <TableHead>
                                    <TableRow style={{ backgroundColor: '#063455', height: '30px' }}>
                                        <TableCell sx={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>Member</TableCell>
                                        <TableCell sx={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>Subscription</TableCell>
                                        <TableCell sx={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>Amount</TableCell>
                                        <TableCell sx={{ color: '#fff', fontSize: '14px', fontWeight: 600, whiteSpace: 'nowrap' }}>Card Status</TableCell>
                                        <TableCell sx={{ color: '#fff', fontSize: '14px', fontWeight: 600, whiteSpace: 'nowrap' }}>Valid From</TableCell>
                                        <TableCell sx={{ color: '#fff', fontSize: '14px', fontWeight: 600, whiteSpace: 'nowrap' }}>Valid To</TableCell>
                                        <TableCell sx={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>Card</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody sx={{ opacity: isLoading ? 0.5 : 1, transition: 'opacity 0.3s' }}>
                                    {subscriptions?.data?.map((subscription) => {
                                        const getCardStatus = (subscription) => {
                                            if (subscription.status === 'paid') {
                                                if (!subscription.valid_to) return 'active';
                                                const now = new Date();
                                                const validToDate = new Date(subscription.valid_to);
                                                return validToDate >= now ? 'active' : 'expired';
                                            } else if (subscription.status === 'partial') {
                                                return 'suspended';
                                            } else if (subscription.status === 'unpaid') {
                                                return 'cancelled';
                                            }
                                            return 'cancelled';
                                        };

                                        const getCardStatusColor = (status) => {
                                            switch (status) {
                                                case 'active':
                                                    return '#4caf50';
                                                case 'expired':
                                                    return '#f44336';
                                                case 'suspended':
                                                    return '#ff9800';
                                                case 'cancelled':
                                                    return '#9e9e9e';
                                                default:
                                                    return '#757575';
                                            }
                                        };

                                        const formatCurrency = (amount) => {
                                            return new Intl.NumberFormat('en-PK', {
                                                style: 'currency',
                                                currency: 'PKR',
                                            })
                                                .format(amount)
                                                .replace('PKR', 'Rs');
                                        };

                                        const formatDate = (dateString) => {
                                            if (!dateString) return 'N/A';
                                            return new Date(dateString).toLocaleDateString('en-GB');
                                        };

                                        return (
                                            <TableRow key={subscription.id} style={{ borderBottom: '1px solid #eee' }}>
                                                <TableCell>
                                                    <div className="d-flex align-items-center">
                                                        <Avatar src={subscription.member?.profile_photo?.file_path ? `/storage/${subscription.member.profile_photo.file_path}` : null} alt={subscription.member?.full_name} style={{ marginRight: '10px', width: 40, height: 40 }}>
                                                            {subscription.member?.full_name?.charAt(0)}
                                                        </Avatar>
                                                        <div>
                                                            <Typography sx={{
                                                                color: '#7F7F7F', fontWeight: 400, fontSize: '14px', maxWidth: '120px',
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                whiteSpace: 'nowrap'
                                                            }}>
                                                                <Tooltip
                                                                    title={subscription.member?.full_name}
                                                                    arrow
                                                                >
                                                                    <span>
                                                                        {subscription.member?.full_name}
                                                                    </span>
                                                                </Tooltip>
                                                            </Typography>
                                                            <Typography sx={{
                                                                color: '#7f7f7f', fontSize: '14px', maxWidth: '120px',
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                whiteSpace: 'nowrap'
                                                            }}>

                                                                <Tooltip
                                                                    title={subscription.member?.membership_no}
                                                                    arrow
                                                                >
                                                                    <span>
                                                                        {subscription.member?.membership_no}
                                                                    </span>
                                                                </Tooltip>
                                                            </Typography>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        <Typography sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px' }}>{subscription.subscription_category?.name}</Typography>
                                                        <Typography sx={{ color: '#999', fontSize: '12px' }}>{subscription.subscription_type?.name}</Typography>
                                                    </div>
                                                </TableCell>
                                                <TableCell sx={{ color: '#7F7F7F', fontWeight: 500, fontSize: '14px' }}>{formatCurrency(subscription.total_price)}</TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={getCardStatus(subscription)}
                                                        size="small"
                                                        sx={{
                                                            color: getCardStatusColor(getCardStatus(subscription)),
                                                            backgroundColor: 'transparent',
                                                            fontWeight: 500,
                                                            fontSize: '14px',
                                                            // textTransform: 'capitalize',
                                                        }}
                                                    />
                                                </TableCell>
                                                <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px' }}>{formatDate(subscription.valid_from)}</TableCell>
                                                <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px' }}>{formatDate(subscription.valid_to)}</TableCell>
                                                <TableCell>
                                                    <Button
                                                        variant="contained"
                                                        // size="small"
                                                        style={{ color: '#063455', border: '1px solid #063455', backgroundColor: 'transparent', boxShadow:'none' }}
                                                        onClick={() => {
                                                            setSelectMember(subscription);
                                                            setOpenCardModal(true);
                                                        }}
                                                    >
                                                        View
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                    {!isLoading && (!subscriptions?.data || subscriptions.data.length === 0) && (
                                        <TableRow>
                                            <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4 }}>
                                                <Typography sx={{ color: '#999', fontSize: '14px' }}>No subscription cards found</Typography>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                    {isLoading && (
                                        <TableRow>
                                            <TableCell colSpan={8} sx={{ textAlign: 'center', py: 8 }}>
                                                <CircularProgress sx={{ color: '#063455' }} />
                                                <Typography sx={{ color: '#999', fontSize: '14px', mt: 2 }}>Loading subscription cards...</Typography>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                            <Box display="flex" justifyContent="center" mt={2}>
                                {subscriptions?.links?.map((link, index) => (
                                    <Button
                                        key={index}
                                        onClick={() => link.url && router.visit(link.url)}
                                        disabled={!link.url}
                                        variant={link.active ? 'contained' : 'outlined'}
                                        size="small"
                                        style={{
                                            margin: '0 5px',
                                            minWidth: '36px',
                                            padding: '6px 10px',
                                            fontWeight: link.active ? 'bold' : 'normal',
                                            backgroundColor: link.active ? '#333' : '#fff',
                                        }}
                                    >
                                        <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                    </Button>
                                ))}
                            </Box>
                        </TableContainer>
                    ) : (
                        /* Members/Family Table */
                        <TableContainer component={Paper} style={{ boxShadow: 'none', overflowX: 'auto', borderRadius: '12px' }}>
                            <Table>
                                <TableHead>
                                    <TableRow style={{ backgroundColor: '#063455', height: '30px' }}>
                                        <TableCell sx={{ color: '#fff', fontSize: '14px', fontWeight: 600, whiteSpace: 'nowrap' }}>Membership No</TableCell>
                                        <TableCell sx={{ color: '#fff', fontSize: '14px', fontWeight: 600, whiteSpace: 'nowrap' }}>Member Name</TableCell>
                                        <TableCell sx={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>Category</TableCell>
                                        <TableCell sx={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>Type</TableCell>
                                        <TableCell sx={{ color: '#fff', fontSize: '14px', fontWeight: 600, whiteSpace: 'nowrap' }}>Card Status</TableCell>
                                        <TableCell sx={{ color: '#fff', fontSize: '14px', fontWeight: 600, whiteSpace: 'nowrap' }}>Member Status</TableCell>
                                        <TableCell sx={{ color: '#fff', fontSize: '14px', fontWeight: 600, whiteSpace: 'nowrap' }}>Card Issue Date</TableCell>
                                        <TableCell sx={{ color: '#fff', fontSize: '14px', fontWeight: 600, whiteSpace: 'nowrap' }}>Card Expiry</TableCell>
                                        <TableCell sx={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>Card</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody sx={{ opacity: isLoading ? 0.5 : 1, transition: 'opacity 0.3s' }}>
                                    {members?.data?.map((member) => (
                                        <TableRow key={member.id} style={{ borderBottom: '1px solid #eee' }}>
                                            <TableCell sx={{ color: '#000', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>
                                                {member.membership_no || 'N/A'}
                                                {member.parent_id && member.parent && <Typography sx={{ fontSize: '12px', color: '#999', fontStyle: 'italic' }}>(Parent: {member.parent.membership_no})</Typography>}
                                            </TableCell>
                                            <TableCell>
                                                <div className="d-flex align-items-center">
                                                    <Avatar src={member.profile_photo?.file_path || '/placeholder.svg?height=40&width=40'} alt={member.full_name} style={{ marginRight: '10px' }} />
                                                    <div>
                                                        {/* <Typography sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px' }} className="d-flex align-items-center gap-2">
                                                            {member.full_name}
                                                            {member.parent_id && <span style={{ fontSize: '12px', color: '#999' }}>(Family)</span>}

                                                            {member.is_document_enabled && (
                                                                <Tooltip title="Documents missing" arrow>
                                                                    <WarningAmberIcon color="warning" fontSize="small" />
                                                                </Tooltip>
                                                            )}
                                                        </Typography> */}
                                                        <Typography sx={{
                                                            color: '#7F7F7F',
                                                            fontWeight: 400,
                                                            fontSize: '14px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 1  // MUI gap instead of Bootstrap class
                                                        }}>
                                                            {/* Truncated Name */}
                                                            <Tooltip title={member.full_name} arrow>
                                                                <span style={{
                                                                    maxWidth: '120px',  // ~20 chars
                                                                    overflow: 'hidden',
                                                                    textOverflow: 'ellipsis',
                                                                    whiteSpace: 'nowrap'
                                                                }}>
                                                                    {member.full_name}
                                                                </span>
                                                            </Tooltip>

                                                            {/* Family tag - unaffected */}
                                                            {member.parent_id && (
                                                                <span style={{ fontSize: '12px', color: '#999' }}>
                                                                    (Family)
                                                                </span>
                                                            )}

                                                            {/* Warning icon - unaffected */}
                                                            {member.is_document_enabled && (
                                                                <Tooltip title="Documents missing" arrow>
                                                                    <WarningAmberIcon color="warning" fontSize="small" />
                                                                </Tooltip>
                                                            )}
                                                        </Typography>

                                                        {/* <Typography sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px' }}>
                                                            {member.mobile_number_a || 'N/A'}
                                                            {member.parent_id && member.parent && <span style={{ fontSize: '12px', color: '#999', marginLeft: '8px' }}>• Parent: {member.parent.full_name}</span>}
                                                        </Typography> */}
                                                        <Typography sx={{
                                                            color: '#7F7F7F',
                                                            fontWeight: 400,
                                                            fontSize: '14px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 1
                                                        }}>
                                                            {/* Truncated Mobile Number */}
                                                            <Tooltip
                                                                title={member.mobile_number_a || 'N/A'}
                                                                arrow
                                                            >
                                                                <span style={{
                                                                    maxWidth: '140px',  // ~12 digits
                                                                    overflow: 'hidden',
                                                                    textOverflow: 'ellipsis',
                                                                    whiteSpace: 'nowrap'
                                                                }}>
                                                                    {member.mobile_number_a || 'N/A'}
                                                                </span>
                                                            </Tooltip>

                                                            {/* Parent info - fully visible */}
                                                            {member.parent_id && member.parent && (
                                                                <span style={{ fontSize: '12px', color: '#999' }}>
                                                                    • Parent: {member.parent.full_name}
                                                                </span>
                                                            )}
                                                        </Typography>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px' }}>{member.member_category?.name || 'N/A'}</TableCell>
                                            <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px' }}>{member.member_type?.name || 'N/A'}</TableCell>
                                            <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px' }}>
                                                {member.card_status ? (
                                                    <Chip
                                                        label={member.card_status}
                                                        size="small"
                                                        sx={{
                                                            backgroundColor: 'transparent',
                                                            // backgroundColor: member.card_status === 'Issued' ? '#4caf50' : member.card_status === 'E-Card Issued' ? '#2196f3' : member.card_status === 'Printed' ? '#9c27b0' : member.card_status === 'Received' ? '#ff9800' : member.card_status === 'In-Process' ? '#ffc107' : member.card_status === 'Applied' ? '#00bcd4' : member.card_status === 'Re-Printed' ? '#673ab7' : member.card_status === 'Expired' ? '#f44336' : member.card_status === 'Not Applied' ? '#9e9e9e' : member.card_status === 'Not Applicable' ? '#607d8b' : '#757575',
                                                            color: '#7f7f7f',
                                                            // fontWeight: 500,
                                                            // fontSize: '12px',
                                                        }}
                                                    />
                                                ) : (
                                                    'N/A'
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {member.status ? (
                                                    <Chip
                                                        label={member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                                                        size="small"
                                                        sx={{
                                                            backgroundColor: 'transparent',
                                                            color: member.status === 'active' ? '#2E7D32' : member.status === 'suspended' ? '#ff9800' : member.status === 'cancelled' ? '#f44336' : member.status === 'pause' ? '#2196f3' : '#757575',
                                                            // color: '#fff',
                                                            fontWeight: 500,
                                                            fontSize: '14px',
                                                        }}
                                                    />
                                                ) : (
                                                    'N/A'
                                                )}
                                            </TableCell>
                                            <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px' }}>{member.card_issue_date || 'N/A'}</TableCell>
                                            <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px' }}>{member.card_expiry_date || 'N/A'}</TableCell>
                                            <TableCell>
                                                <Button
                                                    variant='contained'
                                                    style={{ color: '#063455', border: '1px solid #063455', backgroundColor: 'transparent', textTransform: 'none', boxShadow:'none' }}
                                                    onClick={() => {
                                                        setSelectMember(member);
                                                        setOpenCardModal(true);
                                                    }}
                                                >
                                                    View
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {!isLoading && (!members?.data || members.data.length === 0) && (
                                        <TableRow>
                                            <TableCell colSpan={9} sx={{ textAlign: 'center', py: 4 }}>
                                                <Typography sx={{ color: '#999', fontSize: '14px' }}>No {activeTab === 0 || activeTab === 3 ? 'primary/corporate members' : 'family members'} found</Typography>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                    {isLoading && (
                                        <TableRow>
                                            <TableCell colSpan={9} sx={{ textAlign: 'center', py: 8 }}>
                                                <CircularProgress sx={{ color: '#063455' }} />
                                                <Typography sx={{ color: '#999', fontSize: '14px', mt: 2 }}>Loading {activeTab === 0 || activeTab === 3 ? 'member' : 'family member'} cards...</Typography>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                            <Box display="flex" justifyContent="center" mt={2}>
                                {members?.links?.map((link, index) => (
                                    <Button
                                        key={index}
                                        onClick={() => link.url && router.visit(link.url)}
                                        disabled={!link.url}
                                        variant={link.active ? 'contained' : 'outlined'}
                                        size="small"
                                        style={{
                                            margin: '0 5px',
                                            minWidth: '36px',
                                            padding: '6px 10px',
                                            fontWeight: link.active ? 'bold' : 'normal',
                                            backgroundColor: link.active ? '#333' : '#fff',
                                        }}
                                    >
                                        <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                    </Button>
                                ))}
                            </Box>
                        </TableContainer>
                    )}
                </div>

                {activeTab === 2 ? (
                    <SubscriptionUserCard
                        open={openCardModal}
                        onClose={() => {
                            setOpenCardModal(false);
                            setSelectMember(null);
                        }}
                        subscription={selectMember}
                    />
                ) : (
                    <MembershipCardComponent
                        open={openCardModal}
                        onClose={() => {
                            setOpenCardModal(false);
                            setSelectMember(null);
                        }}
                        member={selectMember}
                        memberData={members?.data || []}
                    />
                )}
            </div>
            {/* </div> */}
        </>
    );
};

export default CardsDashboard;
