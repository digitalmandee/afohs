'use client';

import OrderDetail from '@/components/App/Invoice/OrderDetail';
import PaymentNow from '@/components/App/Invoice/PaymentNow';
import Receipt from '@/components/App/Invoice/Receipt';
import SideNav from '@/components/App/SideBar/SideNav';
import { router } from '@inertiajs/react';
import { CheckCircle as CheckCircleIcon, Check as CheckIcon, Circle as CircleIcon, Close as CloseIcon, TwoWheeler as DeliveryIcon, Diamond as DiamondIcon, LocalDining as DiningIcon, FilterAlt as FilterIcon, KeyboardArrowDown as KeyboardArrowDownIcon, Receipt as ReceiptIcon, EventSeat as ReservationIcon, Restaurant as RestaurantIcon, Search as SearchIcon, TakeoutDining as TakeoutIcon } from '@mui/icons-material';
import RoomServiceIcon from '@mui/icons-material/RoomService';
import { Avatar, Box, Button, Card, CardContent, Chip, Collapse, Dialog, DialogContent, Grid, IconButton, InputAdornment, Pagination, TextField, Typography } from '@mui/material';
import 'bootstrap/dist/css/bootstrap.min.css';
import debounce from 'lodash.debounce';
import { useMemo, useState } from 'react';
import { routeNameForContext } from '@/lib/utils';

const drawerWidthOpen = 240;
const drawerWidthClosed = 110;

// Custom CSS
const styles = {
    root: {
        backgroundColor: '#f5f5f5',
        minHeight: '100vh',
        fontFamily: 'Arial, sans-serif',
    },
    tabButton: {
        borderRadius: '20px',
        margin: '0 5px',
        textTransform: 'none',
        fontWeight: 'normal',
        padding: '6px 16px',
        border: '1px solid #00274D',
        color: '#00274D',
    },
    activeTabButton: {
        backgroundColor: '#0a3d62',
        color: 'white',
        borderRadius: '20px',
        margin: '0 5px',
        textTransform: 'none',
        fontWeight: 'normal',
        padding: '6px 16px',
    },
    revenueCard: {
        backgroundColor: '#0a3d62',
        color: 'white',
        borderRadius: '8px',
        padding: '15px',
    },
    transactionCard: {
        backgroundColor: '#1e4258',
        color: 'white',
        borderRadius: '8px',
        padding: '15px',
    },
    orderCard: {
        marginBottom: '10px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        cursor: 'pointer',
    },
    tableAvatar: {
        backgroundColor: '#0a3d62',
        color: 'white',
        width: '36px',
        height: '36px',
        fontSize: '14px',
    },
    deliveryAvatar: {
        backgroundColor: '#3498db',
        color: 'white',
        width: '36px',
        height: '36px',
        fontSize: '14px',
    },
    pickupAvatar: {
        backgroundColor: '#27ae60',
        color: 'white',
        width: '36px',
        height: '36px',
        fontSize: '14px',
    },
    statusChip: {
        borderRadius: '4px',
        height: '24px',
        fontSize: '12px',
    },
    filterButton: {
        backgroundColor: 'white',
        color: '#333',
        border: '1px solid #ddd',
        boxShadow: 'none',
        textTransform: 'none',
    },
    filterChip: {
        backgroundColor: '#e3f2fd',
        color: '#0a3d62',
        margin: '0 4px',
        borderRadius: '16px',
    },
    activeFilterChip: {
        backgroundColor: '#0a3d62',
        color: 'white',
        margin: '0 4px',
        borderRadius: '16px',
    },
    modalTitle: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 24px',
        borderBottom: '1px solid #eee',
    },
    modalFooter: {
        display: 'flex',
        justifyContent: 'flex-end',
        padding: '16px 24px',
        borderTop: '1px solid #eee',
    },
    applyButton: {
        backgroundColor: '#0a3d62',
        color: 'white',
        textTransform: 'none',
    },
    resetButton: {
        backgroundColor: 'white',
        color: '#333',
        border: '1px solid #ddd',
        marginRight: '8px',
        textTransform: 'none',
    },
    cancelButton: {
        backgroundColor: 'white',
        color: '#333',
        border: '1px solid #ddd',
        textTransform: 'none',
    },
    orderDetailHeader: {
        display: 'flex',
        alignItems: 'center',
        marginBottom: '16px',
    },
    orderDetailAvatar: {
        backgroundColor: '#0a3d62',
        color: 'white',
        width: '40px',
        height: '40px',
    },
    orderItemImage: {
        width: '50px',
        height: '50px',
        borderRadius: '8px',
        objectFit: 'cover',
    },
    trackOrderStep: {
        display: 'flex',
        marginBottom: '16px',
    },
    trackOrderStepIcon: {
        color: '#0a3d62',
        marginRight: '16px',
    },
    trackOrderStepContent: {
        flex: 1,
    },
    trackOrderStepTitle: {
        fontWeight: 'bold',
        marginBottom: '4px',
    },
    trackOrderStepTime: {
        color: '#666',
        fontSize: '12px',
    },
    printReceiptButton: {
        backgroundColor: '#0a3d62',
        color: 'white',
        textTransform: 'none',
    },
    shareReceiptButton: {
        backgroundColor: 'white',
        color: '#333',
        border: '1px solid #ddd',
        textTransform: 'none',
    },
    closeButton: {
        color: '#333',
    },
    orderIdChip: {
        backgroundColor: '#f0f0f0',
        borderRadius: '4px',
        padding: '4px 8px',
        fontSize: '14px',
    },
    orderInfoGrid: {
        marginBottom: '16px',
    },
    orderInfoLabel: {
        color: '#666',
        fontSize: '14px',
    },
    orderInfoValue: {
        fontWeight: 'bold',
        fontSize: '14px',
    },
    orderItemVariant: {
        color: '#666',
        fontSize: '12px',
        marginTop: '4px',
    },
    orderItemPrice: {
        textAlign: 'right',
        fontWeight: 'bold',
    },
    orderItemQuantity: {
        color: '#666',
        fontSize: '14px',
        textAlign: 'right',
    },
    orderSummaryRow: {
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '8px',
    },
    orderTotal: {
        fontWeight: 'bold',
        fontSize: '16px',
    },
    paymentInfo: {
        display: 'flex',
        justifyContent: 'space-between',
        padding: '16px 0',
        borderTop: '1px solid #eee',
        borderBottom: '1px solid #eee',
        marginBottom: '16px',
    },
    paymentMethod: {
        display: 'flex',
        alignItems: 'center',
    },
    paymentIcon: {
        marginRight: '8px',
        color: '#0a3d62',
    },
    trackOrderImage: {
        width: '100%',
        height: '120px',
        objectFit: 'cover',
        borderRadius: '8px',
        marginTop: '8px',
    },
    productSoldCard: {
        backgroundColor: '#1e4258',
        color: 'white',
        borderRadius: '8px',
        padding: '15px',
        height: '100%',
    },
    totalOrderCard: {
        backgroundColor: '#1e4258',
        color: 'white',
        borderRadius: '8px',
        padding: '15px',
        height: '100%',
    },
    filterSection: {
        marginBottom: '16px',
        border: '1px solid #e0e0e0',
        borderRadius: '4px',
    },
    filterHeader: {
        padding: '12px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        cursor: 'pointer',
    },
    filterContent: {
        padding: '0 16px 16px 16px',
    },
    filterChipNew: {
        margin: '4px',
        borderRadius: '16px',
        backgroundColor: '#e3f2fd',
        color: '#0a3d62',
        border: 'none',
    },
    activeFilterChipNew: {
        margin: '4px',
        borderRadius: '16px',
        backgroundColor: '#0a3d62',
        color: 'white',
        border: 'none',
    },
    successIcon: {
        backgroundColor: '#4caf50',
        color: 'white',
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        margin: '0 auto 24px auto',
    },
};

const trackingSteps = [
    {
        title: 'Successfully Delivered',
        time: 'Thursday, 4 April 2024, 08:17 AM',
        completed: true,
        hasProof: true,
        proofImage: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-O8EAr4Sr4VdJp28I2jkRandb7W6KeU.png',
        proofText: 'Photo Proof of Delivery',
        proofAddedBy: 'Added at 12:23 PM by Jhon Andi (Courier)',
    },
    {
        title: 'Processed at Delivered Center',
        time: 'Thursday, 4 April 2024, 03:07 AM',
        completed: true,
    },
    {
        title: 'Arrived at Sorting Center',
        time: 'Monday, 4 April 2024, 22:45 PM',
        completed: true,
    },
    {
        title: 'Shipment En Route',
        time: 'Monday, 4 April 2024, 22:24 PM',
        completed: true,
    },
    {
        title: 'Arrived At Sorting Center',
        time: 'Monday, 4 April 2024, 15:13 PM',
        completed: true,
    },
    {
        title: 'Shipment En Route',
        time: 'Monday, 3 April 2024, 12:14 PM',
        completed: true,
    },
];

function TransactionDashboard({ Invoices, totalOrders }) {
    const [open, setOpen] = useState(true);
    const [activeTab, setActiveTab] = useState('all');
    const [openFilterModal, setOpenFilterModal] = useState(false);
    const [openOrderDetailModal, setOpenOrderDetailModal] = useState(false);
    const [openTrackOrderModal, setOpenTrackOrderModal] = useState(false);
    const [openPaymentModal, setOpenPaymentModal] = useState(false);
    const [openPaymentSuccessModal, setOpenPaymentSuccessModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [search, setSearch] = useState('');

    const [filters, setFilters] = useState({
        sort: 'desc',
        orderType: 'all',
        orderStatus: 'all',
        memberStatus: 'all',
    });

    // Filter sections expand/collapse state
    const [expandedSections, setExpandedSections] = useState({
        sorting: true,
        orderType: true,
        memberStatus: true,
        orderStatus: true,
    });

    const handleTabChange = (type) => {
        setActiveTab(type);
        router.get(route(routeNameForContext('transaction.index')), { orderType: type, search, page: 1 }, { preserveState: true });
    };

    // Debounced function to trigger search after user stops typing
    const triggerSearch = useMemo(
        () =>
            debounce((value) => {
                router.get(route(routeNameForContext('transaction.index')), { orderType: activeTab, search: value, page: 1 }, { preserveState: true });
            }, 500), // 500ms delay
        [activeTab],
    );

    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearch(value);
        triggerSearch(value); // call debounced function
    };

    const handleOpenFilterModal = () => {
        setOpenFilterModal(true);
    };

    const handleCloseFilterModal = () => {
        setOpenFilterModal(false);
    };

    const handleOpenOrderDetail = (order) => {
        setSelectedOrder(order);
        setOpenOrderDetailModal(true);
    };

    const handleCloseOrderDetail = () => {
        setOpenOrderDetailModal(false);
    };

    const handleOpenTrackOrder = () => {
        setOpenTrackOrderModal(true);
        setOpenOrderDetailModal(false);
    };

    const handleCloseTrackOrder = () => {
        setOpenTrackOrderModal(false);
    };

    const handleOpenPayment = (order) => {
        setSelectedOrder(order);
        if (order.invoice?.status === 'paid') {
            setOpenPaymentSuccessModal(true);
        } else if (order.invoice?.status === 'unpaid') {
            setOpenPaymentModal(true);
            setOpenOrderDetailModal(false);
        }
    };

    const handleSuccessPayment = () => {
        setOpenPaymentSuccessModal(true);
        setOpenPaymentModal(false);
    };

    const handleClosePayment = () => {
        setOpenPaymentModal(false);
    };

    const handleClosePaymentSuccess = () => {
        setOpenPaymentSuccessModal(false);
    };

    const handleFilterChange = (key, value) => {
        setFilters((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    const handleApplyFilters = () => {
        router.get(
            route(routeNameForContext('transaction.index')),
            {
                ...filters,
                search,
                page: 1,
            },
            { preserveState: true },
        );
        handleCloseFilterModal();
    };

    const handleResetFilters = () => {
        const reset = {
            sort: 'desc',
            orderType: 'all',
            orderStatus: 'all',
            memberStatus: 'all',
        };
        setFilters(reset);
        router.get(
            route(routeNameForContext('transaction.index')),
            {
                ...reset,
                search,
                page: 1,
            },
            { preserveState: true },
        );
        handleCloseFilterModal();
    };

    const toggleSection = (section) => {
        setExpandedSections((prev) => ({
            ...prev,
            [section]: !prev[section],
        }));
    };

    const getStatusChipColor = (status) => {
        switch (status) {
            case 'pending':
                return '#e3f2fd';
            case 'completed':
                return '#e8f5e9';
            case 'cancelled':
                return '#ffebee';
            case 'refund':
                return '#ffebee';
            default:
                return '#e0e0e0';
        }
    };

    const getStatusChipTextColor = (status) => {
        switch (status) {
            case 'pending':
                return '#0288d1';
            case 'completed':
                return '#388e3c';
            case 'cancelled':
                return '#d32f2f';
            case 'refund':
                return '#d32f2f';
            default:
                return '#616161';
        }
    };

    const getAvatarStyle = (type) => {
        switch (type) {
            case 'delivery':
                return styles.deliveryAvatar;
            case 'pickup':
                return styles.pickupAvatar;
            default:
                return styles.tableAvatar;
        }
    };

    return (
        <>
            <SideNav open={open} setOpen={setOpen} />
            <div
                style={{
                    marginLeft: open ? `${drawerWidthOpen}px` : `${drawerWidthClosed}px`,
                    transition: 'margin-left 0.3s ease-in-out',
                    marginTop: '5rem',
                }}
            >
                <div style={styles.root}>
                    <Box p={2}>
                        {/* Tab Navigation */}
                        <Box
                            display="flex"
                            mb={2}
                            overflow="auto"
                            pb={1}
                            style={{
                                background: '#f0f0f0',
                                padding: '20px',
                                borderRadius: '10px',
                            }}
                        >
                            <Box display="flex" gap={1} mb={2}>
                                {['all', 'dineIn', 'delivery', 'takeaway', 'reservation', 'room_service'].map((type) => (
                                    <Button key={type} style={activeTab === type ? styles.activeTabButton : styles.tabButton} variant={activeTab === type ? 'contained' : 'outlined'} onClick={() => handleTabChange(type)}>
                                        {type === 'all' ? 'All Transactions' : type === 'room_service' ? 'Room Service' : type.charAt(0).toUpperCase() + type.slice(1)}
                                    </Button>
                                ))}
                            </Box>
                        </Box>
                        <Box
                            p={2}
                            style={{
                                background: '#fbfbfb',
                                padding: '20px',
                                borderRadius: '10px',
                            }}
                        >
                            {/* Header */}
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                <Typography
                                    variant="h4"
                                    fontWeight="bold"
                                    sx={{
                                        fontWeight: 500,
                                        fontSize: '36px',
                                    }}
                                >
                                    {Invoices ? Invoices.data.length : 0}{' '}
                                    <span
                                        style={{
                                            fontSize: '16px',
                                            fontWeight: '400',
                                            color: '#7F7F7F',
                                        }}
                                    >
                                        Transactions in your Shift
                                    </span>
                                </Typography>
                                <Box display="flex" gap={1}>
                                    <TextField
                                        placeholder="Search by member or order id"
                                        size="small"
                                        value={search}
                                        onChange={handleSearchChange}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <SearchIcon />
                                                </InputAdornment>
                                            ),
                                        }}
                                        sx={{ width: '300px' }}
                                    />
                                    <Button variant="contained" startIcon={<FilterIcon />} style={styles.filterButton} onClick={handleOpenFilterModal}>
                                        Filter
                                    </Button>
                                </Box>
                            </Box>

                            {/* Main Content */}
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    {/* <pre>{JSON.stringify(Invoices, null, 2)}</pre> */}
                                    {Invoices?.data?.map((order) => (
                                        <Card
                                            sx={{
                                                ...styles.orderCard,
                                                borderRadius: 0,
                                                boxShadow: 'none',
                                                border: '1px solid #E3E3E3',
                                                transition: 'background-color 0.3s ease',
                                                '&:hover': {
                                                    backgroundColor: '#eeeeee',
                                                    cursor: 'pointer',
                                                },
                                            }}
                                            key={order.id}
                                            onClick={() => handleOpenPayment(order)}
                                        >
                                            <CardContent>
                                                <Box display="flex" alignItems="center">
                                                    <Avatar style={getAvatarStyle(order.order_type)}>{order.order_type === 'room_service' ? order.room_booking?.room?.name || 'R' : order.table?.table_no}</Avatar>

                                                    <Avatar
                                                        style={{
                                                            marginLeft: 8,
                                                            backgroundColor: '#E3E3E3',
                                                            width: 32,
                                                            height: 32,
                                                        }}
                                                    >
                                                        <RoomServiceIcon
                                                            style={{
                                                                color: '#000',
                                                                fontSize: 20,
                                                            }}
                                                        />
                                                    </Avatar>
                                                    <Box ml={2} flex={1}>
                                                        <Box display="flex" alignItems="center">
                                                            <Typography
                                                                variant="subtitle1"
                                                                sx={{
                                                                    fontWeight: 500,
                                                                    fontSize: '18px',
                                                                }}
                                                            >
                                                                {order.member ? `${order.member?.full_name} (${order.member?.membership_no})` : `${order.customer ? order.customer.name : order.employee?.name}`}
                                                            </Typography>
                                                            {/* {order.isVIP && <Box component="span" ml={1} display="inline-block" width={16} height={16} borderRadius="50%" bgcolor="#ffc107" />} */}
                                                        </Box>
                                                        <Typography
                                                            variant="body2"
                                                            color="#7F7F7F"
                                                            sx={{
                                                                fontWeight: 400,
                                                                fontSize: '14px',
                                                            }}
                                                        >
                                                            {order.order_items_count} Items ({order.member_id ? 'Member' : order.customer_id ? 'Guest' : 'Employee'})
                                                        </Typography>
                                                    </Box>
                                                    <Box textAlign="right">
                                                        <Typography
                                                            variant="subtitle1"
                                                            fontWeight="bold"
                                                            display="flex"
                                                            gap="5px"
                                                            alignItems="center"
                                                            sx={{
                                                                fontWeight: 500,
                                                                fontSize: '20px',
                                                            }}
                                                        >
                                                            <Typography
                                                                color="#7F7F7F"
                                                                sx={{
                                                                    fontWeight: 400,
                                                                    fontSize: '16px',
                                                                }}
                                                            >
                                                                Rs{' '}
                                                            </Typography>
                                                            {order.total_price}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                                <Box display="flex" alignItems="center" justifyContent="space-between" mt={1}>
                                                    <Box display="flex" alignItems="center">
                                                        <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                                                            #{order?.id}
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary" sx={{ mr: 1, fontSize: '12px', fontWeight: 'bold' }}>
                                                            {order.tenant?.name || 'Unknown'}
                                                        </Typography>

                                                        <Chip
                                                            label={
                                                                order?.status === 'pending'
                                                                    ? 'Pending'
                                                                    : order?.status === 'in_progress'
                                                                      ? 'In Progress'
                                                                      : order?.status === 'completed' && order.invoice?.status === 'paid'
                                                                        ? 'Completed'
                                                                        : order?.status === 'completed'
                                                                          ? 'Ready to Serve' // Don't show label if completed
                                                                          : order?.status === 'cancelled'
                                                                            ? 'Order Cancelled'
                                                                            : order?.status === 'refund'
                                                                              ? 'Refunded'
                                                                              : 'Unknown' // Default if status is not recognized
                                                            }
                                                            size="small"
                                                            style={{
                                                                ...styles.statusChip,
                                                                backgroundColor: getStatusChipColor(order?.status),
                                                                color: getStatusChipTextColor(order?.status),
                                                            }}
                                                        />
                                                    </Box>
                                                    <Box>
                                                        <Button
                                                            size="small"
                                                            variant="contained"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleOpenPayment(order);
                                                            }}
                                                            sx={{
                                                                borderRadius: '4px',
                                                                fontSize: '12px',
                                                                textTransform: 'none',
                                                                backgroundColor: '#0a3d62',
                                                                color: 'white',
                                                            }}
                                                        >
                                                            {order.invoice?.status === 'paid' ? 'Paid' : order.invoice?.status == 'unpaid' ? 'Payment Now' : 'Cancelled'}
                                                        </Button>
                                                    </Box>
                                                </Box>
                                            </CardContent>
                                        </Card>
                                    ))}

                                    <Box sx={{ display: 'flex', justifyContent: 'end', mt: 3 }}>
                                        <Pagination
                                            count={Invoices.last_page}
                                            page={Invoices.current_page}
                                            onChange={(e, page) =>
                                                router.get(
                                                    route(routeNameForContext('transaction.index')),
                                                    {
                                                        page,
                                                        search,
                                                        orderType: activeTab,
                                                        ...filters,
                                                    },
                                                    { preserveState: true },
                                                )
                                            }
                                        />
                                    </Box>
                                </Grid>
                            </Grid>
                        </Box>
                    </Box>

                    {/* Filter Modal */}
                    <Dialog
                        open={openFilterModal}
                        onClose={handleCloseFilterModal}
                        fullWidth
                        maxWidth="sm"
                        PaperProps={{
                            style: {
                                position: 'fixed',
                                top: 0,
                                right: 0,
                                margin: 0,
                                height: '100vh',
                                maxHeight: '100vh',
                                width: '100%',
                                maxWidth: '600px',
                                borderRadius: 0,
                                overflow: 'auto',
                            },
                        }}
                    >
                        <Box sx={{ p: 3 }}>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                                <Typography variant="h6" fontWeight="bold">
                                    Menu Filter
                                </Typography>
                                <IconButton onClick={handleCloseFilterModal} edge="end">
                                    <CloseIcon />
                                </IconButton>
                            </Box>

                            {/* Sorting Section */}
                            <Box
                                className={styles.filterSection}
                                sx={{
                                    mb: 3,
                                    border: '1px solid #eee',
                                    borderRadius: '8px',
                                    p: 2,
                                    backgroundColor: '#fff',
                                    boxShadow: '0px 1px 4px rgba(0, 0, 0, 0.05)',
                                }}
                            >
                                <Box
                                    className={styles.filterHeader}
                                    onClick={() => toggleSection('sorting')}
                                    sx={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <Typography variant="subtitle1">Sorting</Typography>
                                    <KeyboardArrowDownIcon
                                        sx={{
                                            transform: expandedSections.sorting ? 'rotate(180deg)' : 'rotate(0deg)',
                                            transition: 'transform 0.3s ease',
                                        }}
                                    />
                                </Box>

                                <Collapse in={expandedSections.sorting}>
                                    <Box
                                        sx={{
                                            mt: 2,
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'baseline',
                                        }}
                                    >
                                        <Typography variant="body2" sx={{ mb: 1, color: '#555' }}>
                                            By Order Id
                                        </Typography>
                                        <Box display="flex" gap={2}>
                                            <Button
                                                variant="contained"
                                                onClick={() => handleFilterChange('sort', 'asc')}
                                                sx={{
                                                    backgroundColor: filters.sort === 'asc' ? '#b3e5fc' : '#e3f2fd',
                                                    color: '#000',
                                                    borderRadius: '20px',
                                                    textTransform: 'none',
                                                    fontWeight: 500,
                                                    '&:hover': {
                                                        backgroundColor: '#b3e5fc',
                                                    },
                                                    minWidth: '130px',
                                                }}
                                                startIcon={
                                                    <span
                                                        style={{
                                                            fontSize: '16px',
                                                        }}
                                                    >
                                                        ↑
                                                    </span>
                                                }
                                            >
                                                Ascending
                                            </Button>
                                            <Button
                                                variant="contained"
                                                onClick={() => handleFilterChange('sort', 'desc')}
                                                sx={{
                                                    backgroundColor: filters.sort === 'desc' ? '#b3e5fc' : '#e3f2fd',
                                                    color: '#000',
                                                    borderRadius: '20px',
                                                    textTransform: 'none',
                                                    fontWeight: 500,
                                                    '&:hover': {
                                                        backgroundColor: '#b3e5fc',
                                                    },
                                                    minWidth: '130px',
                                                }}
                                                startIcon={
                                                    <span
                                                        style={{
                                                            fontSize: '16px',
                                                        }}
                                                    >
                                                        ↓
                                                    </span>
                                                }
                                            >
                                                Descending
                                            </Button>
                                        </Box>
                                    </Box>
                                </Collapse>
                            </Box>

                            {/* Order Type Section */}
                            <Box
                                className={styles.filterSection}
                                sx={{
                                    mb: 3,
                                    border: '1px solid #eee',
                                    borderRadius: '8px',
                                    p: 2,
                                    backgroundColor: '#fff',
                                    boxShadow: '0px 1px 4px rgba(0, 0, 0, 0.05)',
                                }}
                            >
                                <Box
                                    className={styles.filterHeader}
                                    onClick={() => toggleSection('orderType')}
                                    sx={{
                                        p: 0,
                                        mb: 1,
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                    }}
                                >
                                    <Typography variant="subtitle1">Order Type</Typography>
                                    <KeyboardArrowDownIcon
                                        sx={{
                                            transform: expandedSections.orderType ? 'rotate(180deg)' : 'rotate(0deg)',
                                            transition: 'transform 0.3s',
                                        }}
                                    />
                                </Box>

                                <Collapse in={expandedSections.orderType}>
                                    <Box sx={{ mb: 1 }}>
                                        <Box display="flex" flexWrap="wrap" gap={1}>
                                            {[
                                                {
                                                    label: 'All Status',
                                                    value: 'all',
                                                    icon: null,
                                                },
                                                {
                                                    label: 'Dine In',
                                                    value: 'dineIn',
                                                    icon: <DiningIcon />,
                                                },
                                                {
                                                    label: 'Delivery',
                                                    value: 'delivery',
                                                    icon: <DiningIcon />,
                                                },
                                                {
                                                    label: 'Takeaway',
                                                    value: 'takeaway',
                                                    icon: <TakeoutIcon />,
                                                },
                                                {
                                                    label: 'Reservation',
                                                    value: 'reservation',
                                                    icon: <ReservationIcon />,
                                                },
                                            ].map((item) => (
                                                <Chip
                                                    key={item.value}
                                                    label={item.label}
                                                    onClick={() => handleFilterChange('orderType', item.value)}
                                                    sx={{
                                                        backgroundColor: filters.orderType === item.value ? '#0a3d62' : '#b3e5fc', // light blue for unselected
                                                        color: filters.orderType === item.value ? 'white' : '#0a3d62',
                                                        fontWeight: 500,
                                                        borderRadius: '16px', // more round
                                                        px: 2,
                                                        py: 0.5,
                                                        fontSize: '0.875rem',
                                                    }}
                                                />
                                            ))}
                                        </Box>
                                    </Box>
                                </Collapse>
                            </Box>
                            {/* Order Status Section */}
                            <Box
                                className={styles.filterSection}
                                sx={{
                                    mb: 3,
                                    border: '1px solid #eee',
                                    borderRadius: '8px',
                                    p: 2,
                                    backgroundColor: '#fff',
                                    boxShadow: '0px 1px 4px rgba(0, 0, 0, 0.05)',
                                }}
                            >
                                <Box
                                    className={styles.filterHeader}
                                    onClick={() => toggleSection('orderStatus')}
                                    sx={{
                                        p: 0,
                                        mb: 1,
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                    }}
                                >
                                    <Typography variant="subtitle1">Order Status</Typography>
                                    <KeyboardArrowDownIcon
                                        sx={{
                                            transform: expandedSections.orderStatus ? 'rotate(180deg)' : 'rotate(0deg)',
                                            transition: 'transform 0.3s',
                                        }}
                                    />
                                </Box>
                                <Collapse in={expandedSections.orderStatus}>
                                    <Box sx={{ mb: 1 }}>
                                        <Box display="flex" flexWrap="wrap" gap={1}>
                                            <Chip
                                                label="All Status"
                                                onClick={() => handleFilterChange('orderStatus', 'all')}
                                                sx={{
                                                    backgroundColor: filters.orderStatus === 'all' ? '#003049' : '#cce5ff',
                                                    color: filters.orderStatus === 'all' ? '#fff' : '#003049',
                                                    fontWeight: 500,
                                                    borderRadius: '20px',
                                                    px: 2,
                                                }}
                                                icon={
                                                    filters.orderStatus === 'all' ? (
                                                        <CheckIcon
                                                            style={{
                                                                color: 'white',
                                                            }}
                                                        />
                                                    ) : null
                                                }
                                            />
                                            <Chip
                                                label="Order done"
                                                onClick={() => handleFilterChange('orderStatus', 'completed')}
                                                sx={{
                                                    backgroundColor: filters.orderStatus === 'completed' ? '#003049' : '#cce5ff',
                                                    color: filters.orderStatus === 'completed' ? '#fff' : '#003049',
                                                    fontWeight: 500,
                                                    borderRadius: '20px',
                                                    px: 2,
                                                }}
                                                icon={
                                                    <CheckCircleIcon
                                                        style={{
                                                            color: filters.orderStatus === 'completed' ? 'white' : '#003049',
                                                        }}
                                                    />
                                                }
                                            />
                                            <Chip
                                                label="Order Canceled"
                                                onClick={() => handleFilterChange('orderStatus', 'cancelled')}
                                                sx={{
                                                    backgroundColor: filters.orderStatus === 'cancelled' ? '#003049' : '#cce5ff',
                                                    color: filters.orderStatus === 'cancelled' ? '#fff' : '#003049',
                                                    fontWeight: 500,
                                                    borderRadius: '20px',
                                                    px: 2,
                                                }}
                                                icon={
                                                    <CloseIcon
                                                        style={{
                                                            color: filters.orderStatus === 'cancelled' ? 'white' : '#003049',
                                                        }}
                                                    />
                                                }
                                            />
                                        </Box>
                                    </Box>
                                </Collapse>
                            </Box>
                            {/* Member Status Section */}
                            {/* <Box
                                className={styles.filterSection}
                                sx={{
                                    mb: 3,
                                    border: '1px solid #eee',
                                    borderRadius: '8px',
                                    p: 2,
                                    backgroundColor: '#fff',
                                    boxShadow: '0px 1px 4px rgba(0, 0, 0, 0.05)',
                                }}
                            >
                                <Box
                                    className={styles.filterHeader}
                                    onClick={() => toggleSection('memberStatus')}
                                    sx={{
                                        p: 0,
                                        mb: 1,
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                    }}
                                >
                                    <Typography variant="subtitle1">Member Status</Typography>
                                    <KeyboardArrowDownIcon
                                        sx={{
                                            transform: expandedSections.memberStatus ? 'rotate(180deg)' : 'rotate(0deg)',
                                            transition: 'transform 0.3s',
                                        }}
                                    />
                                </Box>
                                <Collapse in={expandedSections.memberStatus}>
                                    <Box sx={{ mb: 1 }}>
                                        <Box display="flex" flexWrap="wrap" gap={1}>
                                            <Chip
                                                label="All Status"
                                                onClick={() => handleFilterChange('memberStatus', 'all')}
                                                sx={{
                                                    backgroundColor: filters.memberStatus === 'all' ? '#003049' : '#cce5ff',
                                                    color: filters.memberStatus === 'all' ? '#fff' : '#003049',
                                                    fontWeight: 500,
                                                    borderRadius: '20px',
                                                    px: 2,
                                                }}
                                                icon={
                                                    filters.memberStatus === 'all' ? (
                                                        <CheckIcon
                                                            style={{
                                                                color: 'white',
                                                            }}
                                                        />
                                                    ) : null
                                                }
                                            />
                                            <Chip
                                                label="Guest"
                                                onClick={() => handleFilterChange('memberStatus', 'guest')}
                                                sx={{
                                                    backgroundColor: filters.memberStatus === 'guest' ? '#003049' : '#cce5ff',
                                                    color: filters.memberStatus === 'guest' ? '#fff' : '#003049',
                                                    fontWeight: 500,
                                                    borderRadius: '20px',
                                                    px: 2,
                                                }}
                                            />
                                            <Chip
                                                label="Star"
                                                onClick={() => handleFilterChange('memberStatus', 'star')}
                                                sx={{
                                                    backgroundColor: filters.memberStatus === 'star' ? '#003049' : '#cce5ff',
                                                    color: filters.memberStatus === 'star' ? '#fff' : '#003049',
                                                    fontWeight: 500,
                                                    borderRadius: '20px',
                                                    px: 2,
                                                }}
                                            />
                                            <Chip
                                                label="Diamond"
                                                onClick={() => handleFilterChange('memberStatus', 'diamond')}
                                                sx={{
                                                    backgroundColor: filters.memberStatus === 'diamond' ? '#003049' : '#cce5ff',
                                                    color: filters.memberStatus === 'diamond' ? '#fff' : '#003049',
                                                    fontWeight: 500,
                                                    borderRadius: '20px',
                                                    px: 2,
                                                }}
                                                icon={
                                                    <DiamondIcon
                                                        style={{
                                                            color: filters.memberStatus === 'diamond' ? 'white' : '#003049',
                                                        }}
                                                    />
                                                }
                                            />
                                        </Box>
                                    </Box>
                                </Collapse>
                            </Box> */}

                            {/* Footer Buttons */}
                            <Box display="flex" justifyContent="flex-end" gap={1} mt={3}>
                                <Button
                                    variant="outlined"
                                    onClick={handleResetFilters}
                                    sx={{
                                        color: '#333',
                                        borderColor: '#ddd',
                                        textTransform: 'none',
                                    }}
                                >
                                    Reset Filter
                                </Button>
                                <Button
                                    variant="contained"
                                    onClick={handleApplyFilters}
                                    sx={{
                                        backgroundColor: '#0a3d62',
                                        color: 'white',
                                        textTransform: 'none',
                                        '&:hover': {
                                            backgroundColor: '#083352',
                                        },
                                    }}
                                >
                                    Apply Filters
                                </Button>
                            </Box>
                        </Box>
                    </Dialog>

                    {/* Order Detail Modal */}
                    {/* <OrderDetail invoiceId={selectedOrder?.id} openModal={openOrderDetailModal} closeModal={handleCloseOrderDetail} handleOpenTrackOrder={handleOpenTrackOrder} /> */}

                    {/* Payment Modal */}
                    <PaymentNow invoiceData={selectedOrder} openSuccessPayment={handleSuccessPayment} openPaymentModal={openPaymentModal} handleClosePayment={handleClosePayment} setSelectedOrder={setSelectedOrder} />

                    {/* Payment Success Modal */}
                    <Dialog
                        open={openPaymentSuccessModal}
                        onClose={handleClosePaymentSuccess}
                        fullWidth
                        maxWidth="md"
                        PaperProps={{
                            style: {
                                position: 'fixed',
                                top: 0,
                                right: 0,
                                margin: 0,
                                height: '100vh',
                                maxHeight: '100vh',
                                width: '100%',
                                maxWidth: '800px',
                                borderRadius: 0,
                                overflow: 'auto',
                            },
                        }}
                    >
                        <Box sx={{ display: 'flex', height: '100vh' }}>
                            {/* Left Side - Receipt */}
                            <Receipt invoiceId={selectedOrder?.id} openModal={openPaymentSuccessModal} closeModal={handleClosePaymentSuccess} />

                            {/* Right Side - Success Message */}
                            <Box
                                sx={{
                                    flex: 1,
                                    p: 5,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                }}
                            >
                                <Box sx={styles.successIcon}>
                                    <CheckIcon sx={{ fontSize: 40 }} />
                                </Box>

                                <Typography variant="h4" fontWeight="bold" mb={2} textAlign="center">
                                    Payment Success!
                                </Typography>

                                <Typography variant="body1" color="text.secondary" mb={4} textAlign="center">
                                    You've successfully pay your bill. Well done!
                                </Typography>

                                <Box sx={{ width: '100%', maxWidth: 400 }}>
                                    <Box sx={{ mb: 3 }}>
                                        <Typography variant="subtitle2" color="text.secondary" mb={1} textAlign="center">
                                            Total Amount
                                        </Typography>
                                        <Typography variant="h4" fontWeight="bold" color="#0a3d62" textAlign="center">
                                            Rs {selectedOrder?.total_price}
                                        </Typography>
                                    </Box>
                                    <Grid container spacing={2} mb={4}>
                                        <Grid item xs={6}>
                                            <Typography variant="subtitle2" color="text.secondary" mb={1}>
                                                Payment Method
                                            </Typography>
                                            <Typography variant="subtitle2" color="text.secondary">
                                                Total Cash
                                            </Typography>
                                            {/* <Typography variant="body1">Total Cash</Typography> */}
                                        </Grid>
                                        <Grid item xs={6} sx={{ textAlign: 'right' }}>
                                            <Typography variant="subtitle2" color="text.secondary" mb={1} textTransform="capitalize">
                                                {selectedOrder?.payment_method ? selectedOrder.payment_method.replace(/_/g, ' ') : ''}
                                            </Typography>
                                            <Typography variant="body1">Rs {selectedOrder?.paid_amount}</Typography>
                                        </Grid>
                                    </Grid>

                                    <Box sx={{ mb: 3 }}>
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                            }}
                                        >
                                            <Typography variant="subtitle2" color="text.secondary">
                                                Customer Changes
                                            </Typography>
                                            <Typography variant="body1" fontWeight="medium">
                                                Rs {selectedOrder?.paid_amount - selectedOrder?.total_price}
                                            </Typography>
                                        </Box>
                                        {/* Bank Charges in Success Modal */}
                                        {selectedOrder?.invoice?.data?.bank_charges_amount > 0 && (
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    mt: 1,
                                                }}
                                            >
                                                <Typography variant="subtitle2" color="text.secondary">
                                                    Bank Charges ({selectedOrder.invoice.data.bank_charges_type === 'percentage' ? selectedOrder.invoice.data.bank_charges_value + '%' : 'Fixed'})
                                                </Typography>
                                                <Typography variant="body1" fontWeight="medium">
                                                    Rs {selectedOrder.invoice.data.bank_charges_amount}
                                                </Typography>
                                            </Box>
                                        )}
                                    </Box>
                                </Box>
                            </Box>
                        </Box>
                    </Dialog>

                    {/* Track Order Modal */}
                    <Dialog
                        open={openTrackOrderModal}
                        onClose={handleCloseTrackOrder}
                        fullWidth
                        maxWidth="sm"
                        PaperProps={{
                            style: {
                                position: 'fixed',
                                top: 0,
                                right: 0,
                                margin: 0,
                                height: '100vh',
                                maxHeight: '100vh',
                                overflow: 'auto',
                                borderRadius: 0,
                            },
                        }}
                    >
                        <Box style={styles.modalTitle}>
                            <Typography variant="h6" fontWeight="bold">
                                Track Order
                            </Typography>
                            <IconButton onClick={handleCloseTrackOrder} style={styles.closeButton}>
                                <CloseIcon />
                            </IconButton>
                        </Box>
                        <DialogContent>
                            {trackingSteps.map((step, index) => (
                                <Box key={index} style={styles.trackOrderStep}>
                                    {step.completed ? <CheckCircleIcon style={styles.trackOrderStepIcon} /> : <CircleIcon style={styles.trackOrderStepIcon} />}
                                    <Box style={styles.trackOrderStepContent}>
                                        <Typography variant="body1" style={styles.trackOrderStepTitle}>
                                            {step.title}
                                        </Typography>
                                        <Typography variant="body2" style={styles.trackOrderStepTime}>
                                            {step.time}
                                        </Typography>
                                        {step.hasProof && (
                                            <Box mt={1}>
                                                <Typography variant="body2" fontWeight="bold">
                                                    {step.proofText}
                                                </Typography>
                                                <Typography variant="body2" style={styles.trackOrderStepTime}>
                                                    {step.proofAddedBy}
                                                </Typography>
                                                <img src={step.proofImage || '/placeholder.svg'} alt="Delivery Proof" style={styles.trackOrderImage} />
                                            </Box>
                                        )}
                                    </Box>
                                </Box>
                            ))}
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
        </>
    );
}
TransactionDashboard.layout = (page) => page;
export default TransactionDashboard;
