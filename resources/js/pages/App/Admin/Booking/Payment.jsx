import { useState, useRef, useEffect, useCallback } from 'react';
import { Container, Button, Form, InputGroup, Modal, Card, Row, Col } from 'react-bootstrap';
import { ArrowBack, CheckCircle, Add, Remove, Print, CreditCard, EventNote, AccountBalance, KeyboardArrowRight, Check, MonetizationOn, ReceiptLong, AccountBalanceWallet } from '@mui/icons-material';
import { IconButton, Divider, Box, Autocomplete, TextField, Typography, Select, MenuItem, Grid } from '@mui/material';
import 'bootstrap/dist/css/bootstrap.min.css';
import { router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { enqueueSnackbar } from 'notistack';

// const drawerWidthOpen = 240;
// const drawerWidthClosed = 110;

const BookingPayment = ({ invoice, roomOrders }) => {
    // const [open, setOpen] = useState(true);
    const [loading, setLoading] = useState(false);

    const [paymentMethod, setPaymentMethod] = useState('cash');

    const advancePayment = parseFloat(invoice?.paid_amount || 0) + parseFloat(invoice?.advance_payment || 0);
    const totalPrice = parseFloat(invoice?.total_price || 0);

    // Calculate Orders Total
    const ordersTotal = roomOrders ? roomOrders.reduce((sum, order) => sum + parseFloat(order.total_price), 0) : 0;

    const [includeOrders, setIncludeOrders] = useState(true);
    const [ordersAmount, setOrdersAmount] = useState(0);

    // Update orders amount based on checkbox
    useEffect(() => {
        setOrdersAmount(includeOrders ? ordersTotal : 0);
    }, [includeOrders, ordersTotal]);

    const remainingAmount = totalPrice + ordersAmount - advancePayment;

    // Update input amount when remaining changes (auto-fill)
    useEffect(() => {
        const nextAmount = Math.round(Number(remainingAmount || 0));
        setInvoiceForm((prev) => ({ ...prev, inputAmount: nextAmount.toString(), customerCharges: '0' }));
    }, [remainingAmount]);

    const [invoiceForm, setInvoiceForm] = useState({
        user_id: invoice.customer ? invoice.customer.id : invoice.member ? invoice.member.id : invoice.corporateMember || invoice.corporate_member ? (invoice.corporateMember || invoice.corporate_member).id : '',
        inputAmount: remainingAmount.toString() || '0',
        customerCharges: '0.00',
        paymentMethod: 'cash',
        bookingStatus: '',
        receipt: null,
        bankName: '',
        accountNumber: '',
        accountName: '',
        bankBranch: '',
        bankAccount: '',
        notes: '',
        totalPayment: '0.00',
        credit_card_type: '',
        paymentAccount: '',
        payment_account_id: '',
    });

    const [paymentAccounts, setPaymentAccounts] = useState([]);

    useEffect(() => {
        const tenantId = invoice?.invoiceable?.tenant_id ?? invoice?.invoiceable?.location_id ?? invoice?.tenant_id ?? null;

        axios
            .get(route('api.finance.payment-accounts'), {
                params: {
                    payment_method: paymentMethod,
                    ...(tenantId ? { restaurant_id: tenantId } : {}),
                },
            })
            .then((res) => setPaymentAccounts(Array.isArray(res.data) ? res.data : []))
            .catch(() => setPaymentAccounts([]));
    }, [paymentMethod, invoice]);

    // Handle payment method selection
    const handlePaymentMethodSelect = (method) => {
        setPaymentMethod(method);
        setInvoiceForm((prev) => ({ ...prev, payment_account_id: '' }));
    };

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setInvoiceForm({
            ...invoiceForm,
            [name]: value,
        });

        // Calculate change if cash amount is entered
        if (name === 'cashAmount' && invoiceForm.totalPayment) {
            const change = Number.parseFloat(value) - Number.parseFloat(invoiceForm.totalPayment);
            setInvoiceForm((prev) => ({
                ...prev,
                customerChange: change > 0 ? change : 0,
            }));
        }
    };

    // Handle room/person count changes
    const handleCountChange = (field, operation) => {
        setInvoiceForm((prev) => ({
            ...prev,
            [field]: operation === 'add' ? prev[field] + 1 : Math.max(0, prev[field] - 1),
        }));
    };

    const [error, setError] = useState('');

    const minAmount = remainingAmount > 0 ? remainingAmount : 0;

    const handlePaymentChange = (e) => {
        const { name, value, files } = e.target;

        if (name === 'receipt') {
            setInvoiceForm((prev) => ({ ...prev, receipt: files[0] }));
            return;
        }

        if (name === 'inputAmount') {
            let inputValue = parseFloat(value) || 0;
            inputValue = Math.round(inputValue);
            const charges = inputValue - Math.round(minAmount);
            setInvoiceForm((prev) => ({
                ...prev,
                inputAmount: inputValue.toString(),
                customerCharges: charges > 0 ? charges.toString() : '0',
            }));
            return;
        }

        setInvoiceForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleQuickAmount = (value) => {
        const nextAmount = Math.round(Number(value || 0));
        const min = Math.round(Number(minAmount || 0));
        const charges = Math.max(0, nextAmount - min);
        setInvoiceForm((prev) => ({ ...prev, inputAmount: nextAmount.toString(), customerCharges: charges.toString() }));
    };

    const handlePayNow = async (e) => {
        e.preventDefault();

        const inputAmount = Math.round(invoiceForm.inputAmount || '0');

        if (!invoiceForm.inputAmount || inputAmount <= 0) {
            setError('Please enter a valid amount.');
            return;
        }

        if (inputAmount < minAmount) {
            if (advancePayment > 0) {
                setError(`Amount must be at least Rs ${minAmount.toFixed(2)} (remaining after advance).`);
            } else {
                setError(`Amount must be at least Rs ${minAmount.toFixed(2)}`);
            }
            return;
        }

        const data = new FormData();
        data.append('user_id', invoiceForm.user_id);
        data.append('amount', inputAmount);
        data.append('total_amount', inputAmount);
        data.append('advance_payment', advancePayment);
        data.append('remaining_amount', remainingAmount);
        data.append('invoice_no', invoice.invoice_no); // optionally link to invoice
        data.append('customer_charges', parseFloat(invoiceForm.customerCharges));
        data.append('booking_status', invoiceForm.bookingStatus);
        data.append('payment_method', paymentMethod);
        data.append('pay_orders', includeOrders ? 1 : 0);
        if (invoiceForm.payment_account_id) {
            data.append('payment_account_id', invoiceForm.payment_account_id);
        }

        if (paymentMethod === 'credit_card' || paymentMethod === 'debit_card') {
            // data.append('credit_card_type', invoiceForm.credit_card_type || '');
            // data.append('paymentAccount', invoiceForm.paymentAccount || '');
            if (invoiceForm.receipt) {
                data.append('receipt', invoiceForm.receipt);
            }
        }
        if (paymentMethod === 'cheque' || paymentMethod === 'online') {
            data.append('paymentAccount', invoiceForm.paymentAccount || '');
        }

        try {
            setLoading(true);
            const response = await axios.post(route('booking.payment.store'), data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.status === 200) {
                setError('');
                enqueueSnackbar('Payment successful', { variant: 'success' });
                router.visit(route(invoice.invoice_type === 'event_booking' ? 'events.dashboard' : 'rooms.dashboard'));
            } else {
                setError('Payment failed: ' + (response.data?.message || 'Please check the form data.'));
            }
        } catch (error) {
            console.log(error);
            setError('Payment failed: ' + (error.response?.data?.message || 'Please check the form data.'));
        } finally {
            setLoading(false);
        }
    };

    // Handle bank selection
    const handleBankSelect = (bank) => {
        setInvoiceForm((prev) => ({
            ...prev,
            bankName: bank,
        }));
    };

    const handleSkipNow = () => {
        // You can redirect or simply notify and move on
        enqueueSnackbar('Skipped payment for now', { variant: 'info' });

        // Example: go back to dashboard
        router.visit(route(invoice.invoice_type === 'event_booking' ? 'events.dashboard' : 'rooms.dashboard'));

        // Or optionally emit to backend that it's skipped
        // axios.post(route('booking.payment.skip'), { invoice_id: invoice.id })
    };

    return (
        <>
            {/* <SideNav open={open} setOpen={setOpen} /> */}
            <div
                style={{
                    minHeight: '100vh',
                    backgroundColor: '#f5f5f5',
                    // paddingBottom: '2rem',
                }}
            >
                <div
                    style={{
                        paddingBottom: '2rem',
                    }}
                >
                    {/* Header */}
                    <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
                        <IconButton style={{ color: '#063455' }} onClick={() => router.visit(route('rooms.dashboard'))}>
                            <ArrowBack />
                        </IconButton>
                        <h2 className="mb-0 fw-normal" style={{ color: '#063455', fontSize: '30px' }}>
                            {paymentMethod === 'cash' ? 'Cash Payment' : 'Bank Payment'}
                        </h2>
                    </Box>

                    <div className="my-4 p-4 bg-white rounded border" style={{ maxWidth: '700px', margin: '0 auto' }}>
                        <Card className="mb-4 p-3">
                            <Box>
                                <h5 style={{ color: '#063455', fontWeight: 600 }}>Customer Info</h5>
                            </Box>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <p className="mb-1">
                                        <strong>{invoice.customer ? 'Customer' : invoice.member ? 'Member' : 'Corporate Member'}: </strong>
                                        {invoice.customer ? invoice.customer?.customer_no : invoice.member ? invoice.member.membership_no : invoice.corporateMember || invoice.corporate_member ? (invoice.corporateMember || invoice.corporate_member).membership_no : 'N/A'}
                                    </p>
                                    <p className="mb-1">
                                        <strong>Name:</strong> {invoice.customer ? invoice.customer.name : invoice.member ? invoice.member.full_name : invoice.corporateMember || invoice.corporate_member ? (invoice.corporateMember || invoice.corporate_member).full_name : 'N/A'}
                                    </p>
                                    <p className="mb-1">
                                        <strong>Email:</strong> {invoice.customer ? invoice.customer.email : invoice.member ? invoice.member.personal_email : invoice.corporateMember || invoice.corporate_member ? (invoice.corporateMember || invoice.corporate_member).personal_email : 'N/A'}
                                    </p>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <p className="mb-1">
                                        <strong>Booking No:</strong> #{invoice?.invoiceable?.booking_no}
                                    </p>
                                    <p className="mb-1">
                                        <strong>Status:</strong> {invoice.status}
                                    </p>
                                    <p className="mb-1">
                                        <strong>Advance Paid:</strong> Rs {advancePayment.toFixed(2)}
                                    </p>
                                    <p className="mb-1">
                                        <strong>Remaining:</strong> Rs {remainingAmount.toFixed(2)}
                                    </p>
                                </Grid>
                            </Grid>
                        </Card>
                        <h6
                            className="mb-4"
                            style={{
                                color: '#121212',
                                fontWeight: 500,
                                fontSize: '20px',
                            }}
                        >
                            Choose Payment Method
                        </h6>
                        <div className="d-flex flex-wrap gap-3 mb-4">
                            {[
                                { id: 'cash', label: 'Cash', icon: <MonetizationOn sx={{ fontSize: 30 }} /> },
                                { id: 'credit_card', label: 'Credit Card', icon: <CreditCard sx={{ fontSize: 30 }} /> },
                                { id: 'debit_card', label: 'Debit Card', icon: <AccountBalanceWallet sx={{ fontSize: 30 }} /> },
                                { id: 'cheque', label: 'Cheque', icon: <ReceiptLong sx={{ fontSize: 30 }} /> },
                                { id: 'online', label: 'Online', icon: <AccountBalance sx={{ fontSize: 30 }} /> },
                            ].map((method) => (
                                <div
                                    key={method.id}
                                    className="border rounded p-3 text-center d-flex flex-column align-items-center justify-content-center"
                                    onClick={() => handlePaymentMethodSelect(method.id)}
                                    style={{
                                        cursor: 'pointer',
                                        minWidth: '120px',
                                        flex: '1 0 auto',
                                        maxWidth: '150px',
                                        backgroundColor: paymentMethod === method.id ? '#e3f2fd' : 'white',
                                        borderColor: paymentMethod === method.id ? '#063455' : '#e0e0e0',
                                        borderWidth: paymentMethod === method.id ? '2px' : '1px',
                                        transition: 'all 0.2s ease-in-out',
                                    }}
                                >
                                    <div className="mb-2" style={{ color: paymentMethod === method.id ? '#063455' : '#757575' }}>
                                        {method.icon}
                                    </div>
                                    <div style={{ fontWeight: 500, fontSize: '0.9rem', color: paymentMethod === method.id ? '#063455' : '#424242' }}>{method.label}</div>
                                </div>
                            ))}
                        </div>

                        {/* Room Orders Section */}
                        {roomOrders && roomOrders.length > 0 && (
                            <Card className="mb-4">
                                <Card.Body>
                                    <h6 style={{ color: '#063455', fontWeight: 600, marginBottom: '15px' }}>Unpaid Room Orders</h6>
                                    {roomOrders.map((order) => (
                                        <div key={order.id} className="d-flex justify-content-between border-bottom py-2">
                                            <div>
                                                <strong>Order #{order.id}</strong>
                                                <div style={{ fontSize: '0.85rem', color: '#666' }}>
                                                    {order.order_items &&
                                                        order.order_items.map((d) => (
                                                            <span key={d.id} className="me-2">
                                                                {d.order_item?.name} (x{d.order_item?.quantity})
                                                            </span>
                                                        ))}
                                                </div>
                                            </div>
                                            <span style={{ fontWeight: 500 }}>Rs {parseFloat(order.total_price).toFixed(2)}</span>
                                        </div>
                                    ))}
                                    <div className="d-flex justify-content-between mt-3 pt-2 border-top">
                                        <strong>Total Unpaid Orders:</strong>
                                        <strong style={{ color: '#d32f2f' }}>Rs {parseFloat(roomOrders.reduce((sum, o) => sum + parseFloat(o.total_price), 0)).toFixed(2)}</strong>
                                    </div>

                                    <Form.Group className="mt-3">
                                        <Form.Check type="checkbox" label="Include Unpaid Orders in Payment" checked={includeOrders} onChange={(e) => setIncludeOrders(e.target.checked)} />
                                    </Form.Group>
                                </Card.Body>
                            </Card>
                        )}

                        {/* Payment Inputs */}
                        <Row className="mb-3 gx-3">
                            <Col md={6} className="mb-3 mb-md-0">
                                <Form.Group>
                                    <Form.Label className="small">Input Amount</Form.Label>
                                    <InputGroup>
                                        <InputGroup.Text className="bg-white border">Rs</InputGroup.Text>
                                        <Form.Control type="text" name="inputAmount" value={invoiceForm.inputAmount} onChange={handlePaymentChange} className="border" />
                                    </InputGroup>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="small">Customer Charges</Form.Label>
                                    <h4>Rs {Math.round(invoiceForm.customerCharges)}</h4>
                                </Form.Group>
                            </Col>
                        </Row>

                        <div className="d-flex flex-wrap gap-2 mb-4">
                            {['Exact money', '100.00', '500.00', '1000.00', '5000.00'].map((value) => (
                                <Button
                                    key={value}
                                    variant="outlined"
                                    className="p-2"
                                    onClick={() => handleQuickAmount(value === 'Exact money' ? Math.round(minAmount) : parseInt(value))}
                                    sx={{
                                        textTransform: 'none',
                                        borderColor: '#ccc',
                                        color: '#333',
                                        fontSize: '0.875rem',
                                        '&:hover': { borderColor: '#999', bgcolor: '#f5f5f5' },
                                    }}
                                >
                                    {value === 'Exact money' ? 'Exact money' : `Rs ${value}`}
                                </Button>
                            ))}
                        </div>

                        {/* Conditional Fields based on Payment Method */}

                        {(paymentMethod === 'cheque' || paymentMethod === 'online') && (
                            <Form.Group className="mb-3">
                                <Form.Label className="small">{paymentMethod === 'cheque' ? 'Cheque No' : 'Transaction ID/Ref'}</Form.Label>
                                <Form.Control type="text" name="paymentAccount" placeholder={paymentMethod === 'cheque' ? 'Enter Cheque details' : 'Enter Transaction ID'} value={invoiceForm.paymentAccount || ''} onChange={(e) => setInvoiceForm({ ...invoiceForm, paymentAccount: e.target.value })} className="border" />
                            </Form.Group>
                        )}

                        <Form.Group className="mb-3">
                            <Form.Label className="small">Payment Account</Form.Label>
                            <Form.Select
                                name="payment_account_id"
                                value={invoiceForm.payment_account_id || ''}
                                onChange={(e) => setInvoiceForm({ ...invoiceForm, payment_account_id: e.target.value })}
                                className="border"
                            >
                                <option value="">Select Payment Account</option>
                                {paymentAccounts.map((account) => (
                                    <option key={account.id} value={account.id}>
                                        {account.name}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label className="small">Notes</Form.Label>
                            <Form.Control type="text" placeholder="Additional notes..." name="notes" value={invoiceForm.notes} onChange={handleInputChange} className="border" />
                        </Form.Group>

                        <div className="d-flex justify-content-end align-items-center mt-4">
                            <div className="d-flex gap-2">
                                <Button variant="outlined" color="secondary" onClick={handleSkipNow} className="d-flex align-items-center">
                                    Skip for Now
                                </Button>
                                <Button style={{ backgroundColor: '#063455', borderColor: '#063455' }} className="d-flex align-items-center" onClick={handlePayNow} disabled={loading}>
                                    Pay Now
                                    <KeyboardArrowRight fontSize="small" className="ms-1" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default BookingPayment;
