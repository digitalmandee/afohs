import { useState } from 'react';
import { Typography, Button, Card, CardContent, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Avatar, InputAdornment, Tooltip } from '@mui/material';
import { Search, FilterAlt, People, CreditCard, Add } from '@mui/icons-material';
import ReceiptIcon from '@mui/icons-material/Receipt';
import 'bootstrap/dist/css/bootstrap.min.css';
import { router } from '@inertiajs/react';
import SubscriptionFilter from './Filter';
import SubscriptionCardComponent from './UserCard';
import MembershipInvoiceSlip from '../Membership/Invoice';

const SubscriptionDashboard = ({ statistics, recent_subscriptions }) => {
    // Modal state
    // const [open, setOpen] = useState(true);
    const [openInvoiceModal, setOpenInvoiceModal] = useState(false);
    const [openCardModal, setOpenCardModal] = useState(false);
    const [openFilterModal, setOpenFilterModal] = useState(false);
    const [selectedSubscription, setSelectedSubscription] = useState(null);
    const [selectedMemberUserId, setSelectedMemberUserId] = useState(null);
    const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);

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
            <div className="container-fluid p-4" style={{ backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
                {/* Header */}
                <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center">
                        {/* <IconButton>
                                <ArrowBack />
                            </IconButton> */}
                        <Typography sx={{ fontWeight: 700, color: '#063455', fontSize: '30px' }}>Subscription Dashboard</Typography>
                    </div>
                    <Button startIcon={<Add />} sx={{ backgroundColor: '#063455', color: 'white', textTransform: 'none', borderRadius: '16px' }} onClick={() => router.visit(route('finance.transaction.create'))}>
                        Add Subscription
                    </Button>
                </div>
                <Typography sx={{ color: '#063455', fontSize: '15px', fontWeight: '600' }}>Snapshot of active, expired, and upcoming subscriptions</Typography>

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
                                <Typography sx={{ mt: 1, marginBottom: '5px', fontSize: '16px', fontWeight: 400, color: '#C6C6C6' }}>Total Active Subscriptions</Typography>
                                <Typography sx={{ fontWeight: 700, fontSize: '24px', color: '#FFFFFF' }}>{statistics?.total_active_subscriptions || 0}</Typography>
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
                                <Typography sx={{ mt: 1, marginBottom: '5px', fontSize: '16px', fontWeight: 400, color: '#C6C6C6' }}>New Subscriptions Today</Typography>
                                <Typography sx={{ fontWeight: 700, fontSize: '24px', color: '#FFFFFF' }}>{statistics?.new_subscriptions_today || 0}</Typography>
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
                                <Typography sx={{ fontWeight: 700, fontSize: '24px', color: '#FFFFFF' }}>Rs. {statistics?.total_revenue?.toLocaleString() || 0}</Typography>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Recently Joined Section */}
                <div className="mx-0">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <Typography style={{ fontWeight: 500, fontSize: '24px', color: '#000000' }}>Recent Transactions</Typography>

                        <div className="d-flex">
                            <TextField
                                placeholder="Search by name, member type etc"
                                variant="outlined"
                                size="small"
                                sx={{
                                    width: '300px',
                                    marginRight: '10px',
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
                            <Button
                                // variant="outlined"
                                startIcon={<FilterAlt sx={{ color: '#fff' }} />}
                                style={{
                                    border: '1px solid #063455',
                                    color: '#fff',
                                    textTransform: 'none',
                                    backgroundColor: '#063455',
                                    borderRadius: '16px',
                                }}
                                onClick={() => {
                                    setOpenFilterModal(true); // open the modal
                                }}
                            >
                                Filter
                            </Button>
                        </div>
                    </div>

                    {/* Members Table */}
                    <TableContainer component={Paper} style={{ boxShadow: 'none', borderRadius: '16px' }}>
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
                                {recent_subscriptions &&
                                    recent_subscriptions.length > 0 &&
                                    recent_subscriptions.map((subscription) => (
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
                                                    <div>{subscription.member?.membership_no}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px', whiteSpace: 'nowrap' }}>{subscription.subscription_type?.name || '-'}</TableCell>
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
                                            <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px', whiteSpace: 'nowrap' }}>{subscription.valid_from ? new Date(subscription.valid_from).toLocaleDateString() : '-'}</TableCell>
                                            <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px', whiteSpace: 'nowrap' }}>{subscription.valid_to ? new Date(subscription.valid_to).toLocaleDateString() : 'Unlimited'}</TableCell>
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
                                {(!recent_subscriptions || recent_subscriptions.length === 0) && (
                                    <TableRow>
                                        <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                                            <Typography color="textSecondary">No subscription transactions found</Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </div>
                <SubscriptionCardComponent open={openCardModal} onClose={() => setOpenCardModal(false)} subscription={selectedSubscription} />

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

export default SubscriptionDashboard;
