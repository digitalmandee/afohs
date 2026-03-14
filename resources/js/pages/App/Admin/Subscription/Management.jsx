import { useState, useEffect } from 'react';
import PeopleIcon from '@mui/icons-material/People';
import PrintIcon from '@mui/icons-material/Print';
import SearchIcon from '@mui/icons-material/Search';
import ReceiptIcon from '@mui/icons-material/Receipt';
import { Typography, Button, Card, CardContent, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Avatar, Box, InputAdornment, Pagination, Tooltip } from '@mui/material';
import { ArrowBack, Search, FilterAlt, MoreVert, People, CreditCard, Warning } from '@mui/icons-material';
import 'bootstrap/dist/css/bootstrap.min.css';
import { router } from '@inertiajs/react';
import SubscriptionFilter from './Filter';
import MembershipInvoiceSlip from '../Membership/Invoice';

const ManagementDashboard = ({ statistics, subscriptions, filters }) => {
    // Modal state
    // const [open, setOpen] = useState(true);
    const [openFilterModal, setOpenFilterModal] = useState(false);
    const [openInvoiceModal, setOpenInvoiceModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState(filters?.search || '');
    const [selectedMemberUserId, setSelectedMemberUserId] = useState(null);
    const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);

    const handleOpenModal = (member, event, type = 'actions') => {
        const rect = event.currentTarget.getBoundingClientRect();
        const position = {
            top: rect.top + window.scrollY,
            left: rect.left + window.scrollX,
        };
        setSelectedMember(member);
        setModalPosition(position);
        setModalType(type);
        setOpenModal(true);
    };

    const handleCloseModal = () => {
        setOpenModal(false);
    };

    const showMemberDetails = (member, event) => {
        handleOpenModal(member, event, 'details');
    };

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(
            route('subscriptions.management'),
            { search: searchTerm },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const handlePageChange = (event, page) => {
        router.get(
            route('subscriptions.management'),
            {
                search: searchTerm,
                page: page,
            },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
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
            <div className="container-fluid px-4" style={{ backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
                {/* Header */}
                <div className="d-flex justify-content-between align-items-center pt-3">
                    <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography
                            sx={{
                                fontWeight: 700,
                                fontSize: '30px',
                                color: '#063455',
                            }}
                        >
                            Subscription Management
                        </Typography>
                    </div>
                </div>
                <Typography sx={{ color: '#063455', fontSize: '15px', fontWeight: '600' }}>Create, update, and manage subscriber records</Typography>

                {/* Stats Cards */}
                <div
                    style={{
                        display: 'flex',
                        width: '100%',
                        justifyContent: 'space-between',
                        gap: '1rem',
                        marginBottom: '24px',
                        marginTop: '24px',
                    }}
                >
                    {[
                        { title: 'Total Subscriptions', value: statistics?.total_subscriptions || 0, icon: PeopleIcon },
                        { title: 'Active', value: statistics?.active_subscriptions || 0, image: '/assets/ticks.png' },
                        { title: 'Expired', value: statistics?.expired_subscriptions || 0, image: '/assets/cross.png' },
                        { title: 'Total Revenue', value: `Rs. ${statistics?.total_revenue?.toLocaleString() || 0}`, image: '/assets/refresh.png' },
                    ].map((item, index) => (
                        <div key={index} style={{ flex: 1 }}>
                            <Card
                                style={{
                                    backgroundColor: '#063455',
                                    color: '#fff',
                                    borderRadius: '16px',
                                    height: '150px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '1rem',
                                    boxShadow: 'none',
                                    border: 'none',
                                    textAlign: 'center',
                                }}
                            >
                                <div
                                    style={{
                                        // backgroundColor: '#1E2C2F',
                                        borderRadius: '50%',
                                        width: '50px',
                                        height: '50px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginBottom: '0.5rem',
                                    }}
                                >
                                    {item.icon ? <item.icon style={{ color: '#fff', fontSize: '28px' }} /> : <img src={item.image} alt={item.title} style={{ width: '28px', height: '28px', objectFit: 'contain' }} />}
                                </div>
                                <Typography variant="body2" style={{ color: '#DDE6E8', marginBottom: '0.25rem' }}>
                                    {item.title}
                                </Typography>
                                <Typography variant="h6" style={{ fontWeight: 'bold', color: '#fff' }}>
                                    {item.value}
                                </Typography>
                            </Card>
                        </div>
                    ))}
                </div>

                {/* Recently Joined Section */}
                <Box sx={{ pb: 2 }}>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <Typography sx={{ fontWeight: 500, fontSize: '24px', color: '#000000' }}>All Subscriptions</Typography>
                        <div className="d-flex">
                            <form onSubmit={handleSearch} style={{ display: 'flex' }}>
                                <TextField
                                    placeholder="Search by member name or membership no"
                                    variant="outlined"
                                    size="small"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    sx={{
                                        width: '300px',
                                        mr: '10px',
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: '16px',
                                        },
                                        '& .MuiOutlinedInput-notchedOutline': {
                                            borderRadius: '16px',
                                        },
                                    }}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Search />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </form>
                            <Button
                                variant="outlined"
                                startIcon={<FilterAlt sx={{ color: '#fff' }} />}
                                style={{
                                    borderColor: '#063455',
                                    color: '#fff',
                                    textTransform: 'none',
                                    backgroundColor: '#063455',
                                    borderRadius: '16px',
                                    marginRight: 10,
                                }}
                                onClick={() => {
                                    setOpenFilterModal(true); // open the modal
                                }}
                            >
                                Filter
                            </Button>

                            <Button
                                variant="contained"
                                startIcon={<PrintIcon />}
                                sx={{
                                    backgroundColor: '#063455',
                                    textTransform: 'none',
                                    color: 'white',
                                    borderRadius: '16px',
                                }}
                            >
                                Print
                            </Button>
                        </div>
                    </div>

                    {/* Members Table */}
                    <TableContainer component={Paper} style={{ boxShadow: 'none', overflowX: 'auto', borderRadius: '12px' }}>
                        <Table>
                            <TableHead>
                                <TableRow style={{ backgroundColor: '#063455', height: '30px' }}>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600, whiteSpace: 'nowrap' }}>Invoice No</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600, whiteSpace: 'nowrap' }}>Member</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600, whiteSpace: 'nowrap' }}>Subscription Type</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600, whiteSpace: 'nowrap' }}>Category</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600, whiteSpace: 'nowrap' }}>Amount</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600, whiteSpace: 'nowrap' }}>Valid From</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600, whiteSpace: 'nowrap' }}>Valid To</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600, whiteSpace: 'nowrap' }}>Status</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600, whiteSpace: 'nowrap' }}>Payment Date</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600, whiteSpace: 'nowrap' }}>Invoice</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {subscriptions?.data &&
                                    subscriptions.data.length > 0 &&
                                    subscriptions.data.map((subscription) => (
                                        <TableRow key={subscription.id} style={{ borderBottom: '1px solid #eee' }}>
                                            <TableCell
                                                sx={{
                                                    color: '#000',
                                                    fontWeight: 600,
                                                    fontSize: '14px',
                                                    maxWidth: '80px',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                }}
                                            >
                                                <Tooltip title={subscription.invoice_no} arrow>
                                                    {subscription.invoice_no}
                                                </Tooltip>
                                            </TableCell>
                                            <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px', whiteSpace: 'nowrap' }}>
                                                <div>
                                                    <div
                                                        style={{
                                                            color: '#7f7f7f',
                                                            fontWeight: 400,
                                                            fontSize: '14px',
                                                            maxWidth: '120px',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap',
                                                        }}
                                                    >
                                                        <Tooltip title={subscription.member?.full_name || 'N/A'} arrow>
                                                            {subscription.member?.full_name || 'N/A'}
                                                        </Tooltip>
                                                    </div>
                                                    <div style={{ fontSize: '14px', color: '#7f7f7f' }}>{subscription.member?.membership_no}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px' }}>{subscription.subscription_type?.name || '-'}</TableCell>
                                            <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px' }}>
                                                <div>
                                                    <div
                                                        style={{
                                                            color: '#7f7f7f',
                                                            fontWeight: 400,
                                                            fontSize: '14px',
                                                            maxWidth: '120px',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap',
                                                        }}
                                                    >
                                                        <Tooltip title={subscription.subscription_category?.name} arrow>
                                                            {subscription.subscription_category?.name}
                                                        </Tooltip>
                                                    </div>
                                                    <div
                                                        style={{
                                                            color: '#7f7f7f',
                                                            fontWeight: 400,
                                                            fontSize: '14px',
                                                            maxWidth: '100px',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap',
                                                        }}
                                                    >
                                                        <Tooltip title={subscription.subscription_category?.fee} arrow>
                                                            Rs. {subscription.subscription_category?.fee}
                                                        </Tooltip>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell
                                                sx={{
                                                    color: '#7F7F7F',
                                                    fontWeight: 400,
                                                    fontSize: '14px',
                                                    maxWidth: '100px',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                }}
                                            >
                                                <Tooltip title={subscription.total_price?.toLocaleString()} arrow>
                                                    Rs. {subscription.total_price?.toLocaleString()}
                                                </Tooltip>
                                            </TableCell>
                                            <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px' }}>{subscription.valid_from ? new Date(subscription.valid_from).toLocaleDateString() : '-'}</TableCell>
                                            <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px' }}>{subscription.valid_to ? new Date(subscription.valid_to).toLocaleDateString() : 'Unlimited'}</TableCell>
                                            <TableCell>
                                                <span
                                                    style={{
                                                        color: subscription.status === 'paid' ? '#2e7d32' : subscription.status === 'unpaid' ? '#FFA90B' : '#d32f2f',
                                                        fontWeight: 'medium',
                                                        textTransform: 'uppercase',
                                                        fontSize: '12px',
                                                        padding: '4px 8px',
                                                        borderRadius: '4px',
                                                        backgroundColor: subscription.status === 'paid' ? '#dcfce7' : subscription.status === 'unpaid' ? '#fef3c7' : '#fecaca',
                                                    }}
                                                >
                                                    {subscription.status}
                                                </span>
                                            </TableCell>
                                            <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px' }}>{subscription.payment_date ? new Date(subscription.payment_date).toLocaleDateString() : '-'}</TableCell>
                                            <TableCell>
                                                <Button
                                                    size="small"
                                                    variant="contained"
                                                    // startIcon={<ReceiptIcon />}
                                                    sx={{
                                                        bgcolor: 'transparent',
                                                        color: '#063455',
                                                        border: '1px solid #063455',
                                                        textTransform: 'none',
                                                        boxShadow: 'none',
                                                        '&:hover': {
                                                            backgroundColor: 'transparent',
                                                        },
                                                    }}
                                                    onClick={() => {
                                                        setSelectedMemberUserId(subscription.member?.id);
                                                        setSelectedInvoiceId(subscription.invoice_id);
                                                        setOpenInvoiceModal(true);
                                                    }}
                                                >
                                                    View
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                {(!subscriptions?.data || subscriptions.data.length === 0) && (
                                    <TableRow>
                                        <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                                            <Typography color="textSecondary">{filters?.search ? `No subscriptions found matching "${filters.search}"` : 'No subscription transactions found'}</Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {/* Pagination */}
                    {subscriptions?.data && subscriptions.data.length > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                            <Pagination
                                count={subscriptions.last_page}
                                page={subscriptions.current_page}
                                onChange={handlePageChange}
                                color="primary"
                                size="large"
                                showFirstButton
                                showLastButton
                                sx={{
                                    '& .MuiPaginationItem-root': {
                                        fontSize: '16px',
                                    },
                                }}
                            />
                        </Box>
                    )}

                    {/* Pagination Info */}
                    {subscriptions?.data && subscriptions.data.length > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                            <Typography variant="body2" color="textSecondary">
                                Showing {subscriptions.from} to {subscriptions.to} of {subscriptions.total} results
                            </Typography>
                        </Box>
                    )}
                </Box>
                <SubscriptionFilter open={openFilterModal} onClose={() => setOpenFilterModal(false)} />

                {/* Membership Invoice Modal - Used for Subscription Fees */}
                <MembershipInvoiceSlip
                    open={openInvoiceModal}
                    onClose={() => {
                        setOpenInvoiceModal(false);
                        setSelectedMemberUserId(null);
                        setSelectedInvoiceId(null);
                    }}
                    invoiceNo={selectedMemberUserId}
                    invoiceId={selectedInvoiceId}
                />
            </div>
            {/* </div> */}
        </>
    );
};

export default ManagementDashboard;
