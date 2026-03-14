import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Container, Row, Col, Card, Button, Form } from 'react-bootstrap';
import { People, CheckCircle, Timer, Cancel, BarChart, EventNote, CardMembership, Fastfood, Print, Payment } from '@mui/icons-material';
import { Table, Typography, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TextField, Tooltip, MenuItem, ThemeProvider, createTheme } from '@mui/material';
import { router } from '@inertiajs/react';
import InvoiceSlip from '../Subscription/Invoice';
import MembershipInvoiceSlip from '../Membership/Invoice';
import BookingInvoiceModal from '@/components/App/Rooms/BookingInvoiceModal';
import EventBookingInvoiceModal from '@/components/App/Events/EventBookingInvoiceModal';
import PaymentDialog from '@/components/App/Transactions/PaymentDialog';
import axios from 'axios';
import { DemoContainer } from '@mui/x-date-pickers/internals/demo';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs from 'dayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

const Dashboard = ({ statistics, recent_transactions }) => {
    // const [open, setOpen] = useState(true);
    const [date, setDate] = useState('Apr-2025');
    const [openInvoiceModal, setOpenInvoiceModal] = useState(false);
    const [openMembershipInvoiceModal, setOpenMembershipInvoiceModal] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [selectedMemberUserId, setSelectedMemberUserId] = useState(null);
    const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);
    const [showRoomInvoiceModal, setShowRoomInvoiceModal] = useState(false);
    const [showEventInvoiceModal, setShowEventInvoiceModal] = useState(false);
    const [selectedBookingId, setSelectedBookingId] = useState(null);
    const [transactions, setTransactions] = useState(recent_transactions || []);

    const getCurrentMonthYear = () => {
        const now = new Date();
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${months[now.getMonth()]}-${now.getFullYear()}`; // "Jan-2026"
    };

    const generateMonthOptions = () => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        return Array.from({ length: 24 }, (_, i) => {
            const monthIndex = (currentMonth + i) % 12;
            const year = currentMonth + i >= 12 ? currentYear + 1 : currentYear;
            return [`${months[monthIndex]}-${year}`, `${year}-${String(monthIndex + 1).padStart(2, '0')}`];
        });
    };

    const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthYear());

    // Extract statistics from backend
    const { total_members = 0, active_members = 0, expired_members = 0, canceled_members = 0, total_revenue = 0, total_expenses = 0, room_revenue = 0, event_revenue = 0, total_membership_revenue = 0, subscription_fee_revenue = 0, food_revenue = 0, total_booking_revenue = 0 } = statistics || {};

    // Payment Confirmation State
    const [paymentConfirmationOpen, setPaymentConfirmationOpen] = useState(false);
    const [transactionToPay, setTransactionToPay] = useState(null);
    const [submittingPayment, setSubmittingPayment] = useState(false);

    // Payment Confirmation Handlers
    const handlePayClick = (transaction) => {
        setTransactionToPay(transaction);
        setPaymentConfirmationOpen(true);
    };

    const handleConfirmPayment = async (paymentData) => {
        if (!transactionToPay) return;

        setSubmittingPayment(true);
        const formData = new FormData();
        formData.append('status', 'paid');
        formData.append('payment_method', paymentData.payment_method);
        if (paymentData.payment_method === 'credit_card') {
            formData.append('credit_card_type', paymentData.credit_card_type);
            if (paymentData.receipt_file) {
                formData.append('receipt_file', paymentData.receipt_file);
            }
        }

        try {
            const response = await axios.post(route('finance.transaction.update-status', transactionToPay.id), formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            if (response.data.success) {
                // enqueueSnackbar('Invoice marked as paid successfully!', { variant: 'success' }); // Snackbar not imported yet
                // Refresh transactions using Inertia reload
                router.reload({ only: ['recent_transactions'] });
                setPaymentConfirmationOpen(false);
                setTransactionToPay(null);
            }
        } catch (error) {
            console.error('Error updating status:', error);
            // enqueueSnackbar('Failed to update status', { variant: 'error' });
        } finally {
            setSubmittingPayment(false);
        }
    };

    // Format number with commas
    const formatNumber = (num) => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    return (
        <>
            {/* <SideNav open={open} setOpen={setOpen} />
            <div
                style={{
                    marginLeft: open ? `${drawerWidthOpen}px` : `${drawerWidthClosed}px`,
                    transition: 'margin-left 0.3s ease-in-out',
                    marginTop: '5rem',
                }}
            > */}
            <div style={{ backgroundColor: '#f5f5f5', minHeight: '100vh', padding: '20px' }}>
                <Container fluid>
                    {/* Header */}
                    <Row className="align-items-center">
                        <Col xs="auto">
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <Typography style={{ margin: 0, fontWeight: '700', fontSize: '30px', color: '#063455' }}>Finance Dashboard</Typography>
                                {/* <pre>{JSON.stringify(FinancialInvoice, null, 2)}</pre> */}
                            </div>
                        </Col>
                        <Col className="d-flex justify-content-end align-items-center">
                            {/* <LocalizationProvider dateAdapter={AdapterDayjs}>
                                    <DemoContainer components={['DatePicker']}>
                                        <DatePicker
                                            views={['month']}
                                            // views={['year', 'month']},
                                            label="Select Month"
                                            sx={{ width: '100%' }}
                                            format="MMM-YYYY"
                                            value={dayjs(date)}
                                            onChange={(newValue) => setDate(newValue)}
                                            slotProps={{
                                                textField: {
                                                    size: 'small',
                                                    sx: {
                                                        '& .MuiInputBase-root': {
                                                            height: 40,
                                                        },
                                                    },
                                                },
                                            }}
                                        />
                                    </DemoContainer>
                                </LocalizationProvider> */}
                            <TextField
                                select
                                label="Select Month"
                                size="small"
                                fullWidth
                                value={selectedMonth || getCurrentMonthYear()} // ✅ Defaults to current month
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                sx={{
                                    width: '150px',
                                    marginRight: 2,
                                    '& .MuiOutlinedInput-root': {
                                        height: 40,
                                        borderRadius: '16px',
                                    },
                                }}
                                SelectProps={{
                                    MenuProps: {
                                        sx: {
                                            mt: 0.5,
                                            '& .MuiPaper-root': {
                                                borderRadius: '16px !important',
                                                maxHeight: '300px',
                                            },
                                            '& .MuiMenuItem-root': {
                                                '&:hover': {
                                                    backgroundColor: '#063455 !important',
                                                    color: '#fff !important',
                                                },
                                            },
                                        },
                                    },
                                }}
                            >
                                {generateMonthOptions().map(([monthYear]) => (
                                    <MenuItem key={monthYear} value={monthYear}>
                                        {monthYear}
                                    </MenuItem>
                                ))}
                            </TextField>

                            <Button
                                style={{
                                    backgroundColor: '#063455',
                                    border: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    // padding: '5px',
                                    // width: '200px',
                                    color: 'white',
                                    textTransform: 'none',
                                    borderRadius: '16px',
                                    height: 40,
                                }}
                                onClick={() => router.visit(route('finance.transaction.create'))}
                            >
                                <span style={{ marginRight: '5px', marginBottom: '5px', fontSize: '20px' }}>+</span> Add Transaction
                            </Button>
                        </Col>
                    </Row>
                    <Typography sx={{ color: '#063455', fontSize: '15px', fontWeight: '600' }}>Overview of recent transactions, balances, and financial summaries</Typography>

                    {/* Metrics Cards - First Row */}
                    <Row className="mb-3 gx-2 mt-4">
                        <Col md={3}>
                            <Card style={{ backgroundColor: '#063455', color: 'white', border: 'none', borderRadius: '16px' }}>
                                <Card.Body className="text-center" style={{ height: '150px' }}>
                                    <div className="d-flex justify-content-center mb-2">
                                        <div
                                            style={{
                                                // backgroundColor: '#202728',
                                                borderRadius: '50%',
                                                width: '40px',
                                                height: '40px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            <People />
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '16px', color: '#C6C6C6', fontWeight: 400, marginBottom: '5px' }}>Total Members</div>
                                    <div style={{ fontSize: '24px', fontWeight: 700, color: '#FFFFFF' }}>{total_members}</div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={3}>
                            <Card style={{ backgroundColor: '#063455', color: 'white', border: 'none', borderRadius: '16px' }}>
                                <Card.Body className="text-center" style={{ height: '150px' }}>
                                    <div className="d-flex justify-content-center mb-2">
                                        <div
                                            style={{
                                                // backgroundColor: '#202728',
                                                borderRadius: '50%',
                                                width: '40px',
                                                height: '40px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            <CheckCircle />
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '16px', color: '#C6C6C6', fontWeight: 400, marginBottom: '5px' }}>Active Members</div>
                                    <div style={{ fontSize: '24px', fontWeight: 700, color: '#FFFFFF' }}>{active_members}</div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={3}>
                            <Card style={{ backgroundColor: '#063455', color: 'white', border: 'none', borderRadius: '16px' }}>
                                <Card.Body className="text-center" style={{ height: '150px' }}>
                                    <div className="d-flex justify-content-center mb-2">
                                        <div
                                            style={{
                                                // backgroundColor: '#202728',
                                                borderRadius: '50%',
                                                width: '40px',
                                                height: '40px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            <Timer />
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '16px', color: '#C6C6C6', fontWeight: 400, marginBottom: '5px' }}>Expired Members</div>
                                    <div style={{ fontSize: '24px', fontWeight: 700, color: '#FFFFFF' }}>{expired_members}</div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={3}>
                            <Card style={{ backgroundColor: '#063455', color: 'white', border: 'none', borderRadius: '16px' }}>
                                <Card.Body className="text-center" style={{ height: '150px' }}>
                                    <div className="d-flex justify-content-center mb-2">
                                        <div
                                            style={{
                                                // backgroundColor: '#202728',
                                                borderRadius: '50%',
                                                width: '40px',
                                                height: '40px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            <Cancel />
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '16px', color: '#C6C6C6', fontWeight: 400, marginBottom: '5px' }}>Canceled Members</div>
                                    <div style={{ fontSize: '24px', fontWeight: 700, color: '#FFFFFF' }}>{canceled_members}</div>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    {/* Metrics Cards - Second Row */}
                    <Row className="mb-4 gx-2">
                        <Col md={3}>
                            <Card style={{ backgroundColor: '#063455', color: 'white', border: 'none', borderRadius: '16px' }}>
                                <Card.Body style={{ height: '150px', padding: 5 }}>
                                    <div className="d-flex gap-3">
                                        <div
                                            style={{
                                                // backgroundColor: '#202728',
                                                borderRadius: '50%',
                                                width: '40px',
                                                height: '40px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                marginTop: '10px',
                                            }}
                                        >
                                            <BarChart />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '14px', color: '#C6C6C6', fontWeight: 400 }}>Total Revenue</div>
                                            <div style={{ fontSize: '16px', fontWeight: 500, color: '#FFFFFF', marginBottom: '10px' }}>Rs {total_revenue?.toLocaleString() || 0}</div>
                                        </div>
                                    </div>
                                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.2)' }}>
                                        <div style={{ fontSize: '12px', color: '#C6C6C6', fontWeight: 400, marginTop: 10 }}>Total Expenses</div>
                                        <div style={{ fontSize: '16px', fontWeight: 500, color: '#FFFFFF' }}>Rs {total_expenses?.toLocaleString() || 0}</div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>

                        <Col md={3}>
                            <Card style={{ backgroundColor: '#063455', color: 'white', border: 'none', borderRadius: '16px' }}>
                                <Card.Body style={{ height: '150px', padding: 5 }}>
                                    <div className="d-flex gap-3">
                                        <div
                                            style={{
                                                // backgroundColor: '#202728',
                                                borderRadius: '50%',
                                                width: '40px',
                                                height: '40px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                marginTop: '10px',
                                            }}
                                        >
                                            <EventNote />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '14px', color: '#C6C6C6', fontWeight: 400 }}>Booking Revenue</div>
                                            <div style={{ fontSize: '16px', fontWeight: 500, color: '#FFFFFF', marginBottom: '10px' }}>Rs {total_booking_revenue?.toLocaleString() || 0}</div>
                                        </div>
                                    </div>
                                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.2)' }}>
                                        <Row>
                                            <Col>
                                                <div style={{ fontSize: '12px', color: '#C6C6C6', fontWeight: 400, marginTop: 10 }}>Room Rev</div>
                                                <div style={{ fontSize: '16px', fontWeight: 500, color: '#FFFFFF' }}>Rs {room_revenue?.toLocaleString() || 0}</div>
                                            </Col>
                                            <Col>
                                                <div style={{ fontSize: '12px', color: '#C6C6C6', fontWeight: 400, marginTop: 10 }}>Event Rev</div>
                                                <div style={{ fontSize: '16px', fontWeight: 500, color: '#FFFFFF' }}>Rs {event_revenue?.toLocaleString() || 0}</div>
                                            </Col>
                                        </Row>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>

                        <Col md={3}>
                            <Card style={{ backgroundColor: '#063455', color: 'white', border: 'none', borderRadius: '16px' }}>
                                <Card.Body style={{ height: '150px', padding: 5 }}>
                                    <div className="d-flex gap-3">
                                        <div
                                            style={{
                                                // backgroundColor: '#202728',
                                                borderRadius: '50%',
                                                width: '40px',
                                                height: '40px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                marginTop: '10px',
                                            }}
                                        >
                                            <CardMembership />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '14px', color: '#C6C6C6', fontWeight: 400 }}>Membership Revenue</div>
                                            <div style={{ fontSize: '16px', fontWeight: 500, marginBottom: '10px' }}>Rs {total_membership_revenue?.toLocaleString() || 0}</div>
                                        </div>
                                    </div>
                                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.2)' }}>
                                        <div style={{ fontSize: '12px', fontWeight: 400, color: '#C6C6C6', marginTop: '10px' }}>Subscription Revenue</div>
                                        <div style={{ fontSize: '16px', fontWeight: 500, color: '#FFFFFF' }}>Rs {subscription_fee_revenue?.toLocaleString() || 0}</div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>

                        <Col md={3}>
                            <Card style={{ backgroundColor: '#063455', color: 'white', border: 'none', borderRadius: '16px' }}>
                                <Card.Body className="d-flex flex-column justify-content-center align-items-center" style={{ height: '150px' }}>
                                    <div className="d-flex justify-content-center mb-2">
                                        <div
                                            style={{
                                                // backgroundColor: '#202728',
                                                borderRadius: '50%',
                                                width: '40px',
                                                height: '40px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            <Fastfood />
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '16px', color: '#C6C6C6', fontWeight: 500, marginTop: '10px' }}>Food Revenue</div>
                                    <div style={{ fontSize: '24px', fontWeight: 700, color: '#FFFFFF' }}>Rs {food_revenue?.toLocaleString() || 0}</div>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    {/* Recent Transactions */}
                    <Row className="mb-3">
                        <Col xs={6}>
                            <h5 style={{ fontWeight: '500', fontSize: '24px', color: '#000000' }}>Recent Transaction</h5>
                        </Col>
                        <Col xs={6} className="text-end">
                            <Button
                                style={{
                                    backgroundColor: '#063455',
                                    border: 'none',
                                    borderRadius: '16px',
                                    // padding: '8px 15px',
                                }}
                            >
                                <Print style={{ marginRight: '5px', fontSize: '18px' }} /> Print
                            </Button>
                        </Col>
                    </Row>

                    {/* Transactions Table */}
                    <Row>
                        <Col>
                            <TableContainer component={Paper} style={{ boxShadow: 'none', overflowX: 'auto', borderRadius: '16px' }}>
                                <Table>
                                    <TableHead>
                                        <TableRow style={{ backgroundColor: '#063455', height: '30px' }}>
                                            <TableCell sx={{ color: '#fff', fontWeight: 600, whiteSpace: 'nowrap' }}>Invoice No</TableCell>
                                            <TableCell sx={{ color: '#fff', fontWeight: 600, whiteSpace: 'nowrap' }}>Member</TableCell>
                                            <TableCell sx={{ color: '#fff', fontWeight: 600, whiteSpace: 'nowrap' }}>Fee Type</TableCell>
                                            <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Amount</TableCell>
                                            <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Paid</TableCell>
                                            <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Balance</TableCell>
                                            <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Status</TableCell>
                                            <TableCell sx={{ color: '#fff', fontWeight: 600, whiteSpace: 'nowrap' }}>Payment Method</TableCell>
                                            <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Date</TableCell>
                                            <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Days</TableCell>
                                            <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Invoice</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {(recent_transactions || []).length > 0 ? (
                                            recent_transactions.slice(0, 5).map((transaction) => {
                                                // Format fee type or invoice type for display
                                                const formatType = (type) => {
                                                    if (!type) return 'N/A';
                                                    return type
                                                        .replace(/_/g, ' ')
                                                        .split(' ')
                                                        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                                                        .join(' ');
                                                };
                                                const displayType = transaction.fee_type_formatted || transaction.fee_type || transaction.invoice_type;

                                                // Format payment method
                                                const formatPaymentMethod = (method) => {
                                                    if (!method) return 'N/A';
                                                    return method
                                                        .replace(/_/g, ' ')
                                                        .split(' ')
                                                        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                                                        .join(' ');
                                                };

                                                // Format date
                                                const formatDate = (date) => {
                                                    if (!date) return 'N/A';
                                                    try {
                                                        return dayjs(date).format('DD-MM-YYYY');
                                                    } catch (e) {
                                                        return 'N/A';
                                                    }
                                                };

                                                // Get status badge style
                                                const getStatusBadge = (status) => {
                                                    const styles = {
                                                        paid: { bg: '#d4edda', color: '#155724', text: 'Paid' },
                                                        unpaid: { bg: '#f8d7da', color: '#721c24', text: 'Unpaid' },
                                                        default: { bg: '#e2e3e5', color: '#383d41', text: status || 'N/A' },
                                                    };
                                                    return styles[status] || styles.default;
                                                };
                                                const statusStyle = getStatusBadge(transaction.status);

                                                return (
                                                    <TableRow key={transaction.id} style={{ borderBottom: '1px solid #eee' }}>
                                                        <TableCell sx={{ color: '#000', fontWeight: 600, fontSize: '14px' }}>{transaction.invoice_no || 'N/A'}</TableCell>
                                                        <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px', whiteSpace: 'nowrap' }}>
                                                            <div>
                                                                <Tooltip title={transaction.member?.full_name || transaction.customer?.name || transaction.invoiceable?.name || 'N/A'}>
                                                                    <div style={{ fontWeight: 400, color: '#7f7f7f', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }}>{transaction.member?.full_name || transaction.customer?.name || transaction.invoiceable?.name || 'N/A'}</div>
                                                                </Tooltip>
                                                                {transaction.member?.membership_no && <div style={{ fontSize: '12px', color: '#7F7F7F' }}>{transaction.member.membership_no}</div>}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px', whiteSpace: 'nowrap' }}>
                                                            <span style={{ backgroundColor: '#e3f2fd', color: '#1976d2', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 500 }}>
                                                                {displayType === 'Multiple Items' ? (
                                                                    <Tooltip
                                                                        title={
                                                                            transaction.items && transaction.items.length > 0 ? (
                                                                                <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
                                                                                    {transaction.items.map((item, idx) => (
                                                                                        <li key={idx}>
                                                                                            {formatType(item.fee_type)} {item.description ? ` - ${item.description}` : ''}
                                                                                        </li>
                                                                                    ))}
                                                                                </ul>
                                                                            ) : (
                                                                                'Multiple items'
                                                                            )
                                                                        }
                                                                        arrow
                                                                    >
                                                                        <span>{displayType}</span>
                                                                    </Tooltip>
                                                                ) : (
                                                                    formatType(displayType)
                                                                )}
                                                            </span>
                                                        </TableCell>

                                                        <TableCell sx={{ color: '#7F7F7F', fontWeight: 600, textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: '100px', whiteSpace: 'nowrap' }}>
                                                            <Tooltip title={(transaction.total_price || 0).toLocaleString()} arrow>
                                                                Rs {(transaction.total_price || 0).toLocaleString()}
                                                            </Tooltip>
                                                        </TableCell>
                                                        <TableCell sx={{ color: 'success.main', fontWeight: 600, textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: '100px', whiteSpace: 'nowrap' }}>
                                                            <Tooltip title={(transaction.paid_amount || 0).toLocaleString()} arrow>
                                                                Rs {(transaction.paid_amount || 0).toLocaleString()}
                                                            </Tooltip>
                                                        </TableCell>
                                                        <TableCell sx={{ color: 'error.main', fontWeight: 600, textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: '100px', whiteSpace: 'nowrap' }}>
                                                            <Tooltip title={(transaction.balance || 0).toLocaleString()} arrow>
                                                                Rs {(transaction.balance || 0).toLocaleString()}
                                                            </Tooltip>
                                                        </TableCell>

                                                        <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px' }}>
                                                            <span style={{ backgroundColor: statusStyle.bg, color: statusStyle.color, padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 500 }}>{statusStyle.text.toUpperCase()}</span>
                                                        </TableCell>
                                                        <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px' }}>{formatPaymentMethod(transaction.payment_method)}</TableCell>
                                                        <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px', whiteSpace:'nowrap' }}>{formatDate(transaction.created_at)}</TableCell>
                                                        <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px', whiteSpace:'nowrap' }}>{transaction.valid_from && transaction.valid_to ? dayjs(transaction.valid_to).diff(dayjs(transaction.valid_from), 'day') + 1 : '-'}</TableCell>
                                                        <TableCell>
                                                            <span
                                                                style={{
                                                                    color: '#063455',
                                                                    cursor: 'pointer',
                                                                    fontWeight: 500,
                                                                    border: '1px solid #063455',
                                                                    padding: 7,
                                                                }}
                                                                onClick={() => {
                                                                    if (transaction.invoice_type === 'room_booking' && transaction.invoiceable_id) {
                                                                        setSelectedBookingId(transaction.invoiceable_id);
                                                                        setShowRoomInvoiceModal(true);
                                                                    } else if (transaction.invoice_type === 'event_booking' && transaction.invoiceable_id) {
                                                                        setSelectedBookingId(transaction.invoiceable_id);
                                                                        setShowEventInvoiceModal(true);
                                                                    } else if (transaction.member || transaction.corporate_member) {
                                                                        setSelectedInvoiceId(transaction.id);
                                                                        setSelectedMemberUserId(null);
                                                                        setOpenMembershipInvoiceModal(true);
                                                                    } else {
                                                                        setSelectedInvoice(transaction);
                                                                        setOpenInvoiceModal(true);
                                                                    }
                                                                }}
                                                            >
                                                                View
                                                            </span>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={11} align="center" sx={{ py: 4, color: '#7F7F7F' }}>
                                                    No recent transactions
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Col>
                    </Row>
                </Container>
                {/* Fallback Invoice Modal (for non-member transactions) */}
                <InvoiceSlip open={openInvoiceModal} onClose={() => setOpenInvoiceModal(false)} data={selectedInvoice} />

                {/* Membership Invoice Modal - Used for Membership, Subscription & Maintenance Fees */}
                <MembershipInvoiceSlip
                    open={openMembershipInvoiceModal}
                    onClose={() => {
                        setOpenMembershipInvoiceModal(false);
                        setSelectedMemberUserId(null);
                        setSelectedInvoiceId(null);
                    }}
                    invoiceNo={selectedMemberUserId}
                    invoiceId={selectedInvoiceId}
                />

                {/* Room Booking Invoice Modal */}
                <BookingInvoiceModal
                    open={showRoomInvoiceModal}
                    onClose={() => {
                        setShowRoomInvoiceModal(false);
                        setSelectedBookingId(null);
                    }}
                    bookingId={selectedBookingId}
                    setBookings={setTransactions}
                    financeView={true}
                />

                {/* Event Booking Invoice Modal */}
                <EventBookingInvoiceModal
                    open={showEventInvoiceModal}
                    onClose={() => {
                        setShowEventInvoiceModal(false);
                        setSelectedBookingId(null);
                    }}
                    bookingId={selectedBookingId}
                    setBookings={setTransactions}
                    financeView={true}
                />

                {/* Payment Dialog */}
                <PaymentDialog
                    open={paymentConfirmationOpen}
                    onClose={() => {
                        setPaymentConfirmationOpen(false);
                        setTransactionToPay(null);
                    }}
                    transaction={transactionToPay}
                    onConfirm={handleConfirmPayment}
                    submitting={submittingPayment}
                />
            </div>
            {/* </div> */}
        </>
    );
};

export default Dashboard;
