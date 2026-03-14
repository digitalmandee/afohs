'use client';

import { Box, Button, Container, Divider, Grid, Typography } from '@mui/material';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useState } from 'react';
import RegularBill from './Regular';
import SplitBill from './Split';

const PaymentPage = () => {
    const [selectedTab, setSelectedTab] = useState('Regular Bill');
    const [selectedPayment, setSelectedPayment] = useState('Cash');
    const [inputAmount, setInputAmount] = useState('10.00');
    const [customerChanges, setCustomerChanges] = useState('0,00');

    const orderItems = [
        { name: 'Cappuccino', quantity: 2, price: 5.0, total: 10.0 },
        { name: 'Soda Beverage', quantity: 3, price: 5.0, total: 15.0 },
        { name: 'Chocolate Croissant', quantity: 2, price: 5.0, total: 10.0 },
        { name: 'French Toast Sugar', quantity: 3, price: 4.0, total: 12.0 },
    ];

    const handleTabClick = (tab) => {
        setSelectedTab(tab);
    };

    const handlePaymentMethodClick = (method) => {
        setSelectedPayment(method);
    };

    const handleQuickAmountClick = (amount) => {
        setInputAmount(amount);
    };

    const handleNumberClick = (number) => {
        if (inputAmount === '10.00') {
            setInputAmount(number);
        } else {
            setInputAmount(inputAmount + number);
        }
    };

    const handleDeleteClick = () => {
        if (inputAmount.length > 1) {
            setInputAmount(inputAmount.slice(0, -1));
        } else {
            setInputAmount('0');
        }
    };

    const handleDecimalClick = () => {
        if (!inputAmount.includes('.')) {
            setInputAmount(inputAmount + '.');
        }
    };

    return (
        <Container maxWidth="lg" disableGutters>
            <Box
                sx={{
                    display: 'flex',
                    height: '100%',
                    // overflow: "hidden",
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    boxShadow: '0 0 10px rgba(0,0,0,0.1)',
                    // mb: 15
                }}
            >
                {/* Left Sidebar */}
                <Box
                    sx={{
                        width: '250px',
                        bgcolor: '#e3f2fd',
                        p: 2,
                        borderRight: '1px solid #ccc',
                        display: 'flex',
                        flexDirection: 'column',
                        // justifyContent:'center',
                        alignItems: 'center',
                        height: '100%',
                    }}
                >
                    {/* Logo */}
                    <Typography
                        variant="h6"
                        sx={{
                            fontWeight: 'bold',
                            color: '#0a4b78',
                            mb: 1,
                        }}
                    >
                        Afohs Club.
                    </Typography>

                    {/* Date and Time */}
                    <Typography
                        variant="caption"
                        sx={{
                            color: '#666',
                            mb: 2,
                        }}
                    >
                        Wed, May 27, 2020 • 9:27:53 AM
                    </Typography>

                    {/* Order ID */}
                    <Box
                        sx={{
                            border: '1px dashed #90caf9',
                            borderRadius: '4px',
                            p: 2,
                            mb: 2,
                            textAlign: 'center',
                        }}
                    >
                        <Typography
                            variant="caption"
                            sx={{
                                color: '#666',
                                display: 'block',
                                mb: 0.5,
                            }}
                        >
                            Order Id
                        </Typography>
                        <Typography
                            variant="body1"
                            sx={{
                                fontWeight: 'bold',
                                color: '#333',
                            }}
                        >
                            ORDER001
                        </Typography>
                    </Box>

                    {/* Order Details */}
                    <Grid container spacing={1} sx={{ mb: 1 }}>
                        <Grid item xs={4}>
                            <Typography variant="caption" sx={{ color: '#666' }}>
                                Cashier
                            </Typography>
                        </Grid>
                        <Grid item xs={8} sx={{ textAlign: 'right' }}>
                            <Typography variant="caption" sx={{ color: '#333' }}>
                                Tynisha Obey
                            </Typography>
                        </Grid>
                    </Grid>

                    <Grid container spacing={1} sx={{ mb: 1 }}>
                        <Grid item xs={4}>
                            <Typography variant="caption" sx={{ color: '#666' }}>
                                Working Time
                            </Typography>
                        </Grid>
                        <Grid item xs={8} sx={{ textAlign: 'right' }}>
                            <Typography variant="caption" sx={{ color: '#333' }}>
                                15.00 - 22.00 PM
                            </Typography>
                        </Grid>
                    </Grid>

                    <Divider sx={{ my: 2, bgcolor: 'black' }} />

                    <Grid container spacing={1} sx={{ mb: 1 }}>
                        <Grid item xs={4}>
                            <Typography variant="caption" sx={{ color: '#666' }}>
                                Customer Name
                            </Typography>
                        </Grid>
                        <Grid item xs={8} sx={{ textAlign: 'right' }}>
                            <Typography variant="caption" sx={{ color: '#333' }}>
                                Ravi Kamil
                            </Typography>
                        </Grid>
                    </Grid>

                    <Grid container spacing={1} sx={{ mb: 1 }}>
                        <Grid item xs={4}>
                            <Typography variant="caption" sx={{ color: '#666' }}>
                                Number Id Card
                            </Typography>
                        </Grid>
                        <Grid item xs={8} sx={{ textAlign: 'right' }}>
                            <Typography variant="caption" sx={{ color: '#333' }}>
                                -
                            </Typography>
                        </Grid>
                    </Grid>

                    <Grid container spacing={1} sx={{ mb: 1 }}>
                        <Grid item xs={4}>
                            <Typography variant="caption" sx={{ color: '#666' }}>
                                Order Type
                            </Typography>
                        </Grid>
                        <Grid item xs={8} sx={{ textAlign: 'right' }}>
                            <Typography variant="caption" sx={{ color: '#333' }}>
                                Dine In
                            </Typography>
                        </Grid>
                    </Grid>

                    <Grid container spacing={1} sx={{ mb: 1 }}>
                        <Grid item xs={4}>
                            <Typography variant="caption" sx={{ color: '#666' }}>
                                Table Number
                            </Typography>
                        </Grid>
                        <Grid item xs={8} sx={{ textAlign: 'right' }}>
                            <Typography variant="caption" sx={{ color: '#333' }}>
                                T2
                            </Typography>
                        </Grid>
                    </Grid>

                    <Divider sx={{ my: 1.5 }} />

                    {/* Order Items */}
                    <Box sx={{ mb: 2, flex: 1, overflow: 'auto' }}>
                        {orderItems.map((item, index) => (
                            <Grid container spacing={1} key={index} sx={{ mb: 1 }}>
                                <Grid item xs={12}>
                                    <Typography variant="caption" sx={{ color: '#666', display: 'block' }}>
                                        {item.name}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="caption" sx={{ color: '#666' }}>
                                        {item.quantity} x Rs {item.price.toFixed(2)}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6} sx={{ textAlign: 'right' }}>
                                    <Typography variant="caption" sx={{ color: '#333' }}>
                                        Rs {item.total.toFixed(2)}
                                    </Typography>
                                </Grid>
                            </Grid>
                        ))}
                    </Box>

                    {/* <Divider sx={{ my: 1.5 }} /> */}

                    {/* Order Summary */}
                    <Grid container spacing={1} sx={{ mb: 1 }}>
                        <Grid item xs={6}>
                            <Typography variant="caption" sx={{ color: '#666' }}>
                                Subtotal
                            </Typography>
                        </Grid>
                        <Grid item xs={6} sx={{ textAlign: 'right' }}>
                            <Typography variant="caption" sx={{ color: '#333' }}>
                                Rs 47.00
                            </Typography>
                        </Grid>
                    </Grid>

                    <Grid container spacing={1} sx={{ mb: 1 }}>
                        <Grid item xs={6}>
                            <Typography variant="caption" sx={{ color: '#666' }}>
                                Discount
                            </Typography>
                        </Grid>
                        <Grid item xs={6} sx={{ textAlign: 'right' }}>
                            <Typography variant="caption" sx={{ color: '#333' }}>
                                Rs 0
                            </Typography>
                        </Grid>
                    </Grid>

                    <Grid container spacing={1} sx={{ mb: 1 }}>
                        <Grid item xs={6}>
                            <Typography variant="caption" sx={{ color: '#666' }}>
                                Tax (12%)
                            </Typography>
                        </Grid>
                        <Grid item xs={6} sx={{ textAlign: 'right' }}>
                            <Typography variant="caption" sx={{ color: '#333' }}>
                                Rs 5.64
                            </Typography>
                        </Grid>
                    </Grid>

                    <Divider sx={{ my: 1.5 }} />

                    <Grid container spacing={1} sx={{ mb: 2 }}>
                        <Grid item xs={6}>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#0a4b78' }}>
                                Total Amount
                            </Typography>
                        </Grid>
                        <Grid item xs={6} sx={{ textAlign: 'right' }}>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#0a4b78' }}>
                                Rs 52.64
                            </Typography>
                        </Grid>
                    </Grid>

                    <Typography variant="caption" sx={{ color: '#666', mb: 2, fontSize: '0.65rem' }}>
                        Thanks for having our passion. Drop by again. If your orders aren't still visible, you're always welcome here!
                    </Typography>

                    {/* Bottom Logo */}
                    <Typography
                        variant="h6"
                        sx={{
                            fontWeight: 'bold',
                            color: '#0a4b78',
                            mt: 'auto',
                        }}
                    >
                        Afohs club.
                    </Typography>
                </Box>

                {/* Main Content */}
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    {/* Header */}
                    <Box
                        sx={{
                            display: 'flex',
                            // justifyContent: "space-between",
                            alignItems: 'center',
                            p: 2,
                            borderBottom: '1px solid #eee',
                        }}
                    >
                        <Typography
                            variant="h5"
                            sx={{
                                fontWeight: 'bold',
                                color: '#333',
                            }}
                        >
                            Payment
                        </Typography>

                        {/* Tabs */}
                        <Box sx={{ display: 'flex', gap: 1, marginLeft: 5 }}>
                            <Button
                                variant={selectedTab === 'Regular Bill' ? 'contained' : 'text'}
                                onClick={() => handleTabClick('Regular Bill')}
                                sx={{
                                    bgcolor: selectedTab === 'Regular Bill' ? '#0a4b78' : 'transparent',
                                    color: selectedTab === 'Regular Bill' ? 'white' : '#666',
                                    borderRadius: '4px 0 0 4px',
                                    textTransform: 'none',
                                    '&:hover': {
                                        bgcolor: selectedTab === 'Regular Bill' ? '#0a4b78' : 'rgba(0,0,0,0.04)',
                                    },
                                }}
                            >
                                Regular Bill
                            </Button>

                            <Button
                                variant={selectedTab === 'Split Bill' ? 'contained' : 'text'}
                                onClick={() => handleTabClick('Split Bill')}
                                sx={{
                                    bgcolor: selectedTab === 'Split Bill' ? '#0a4b78' : 'transparent',
                                    color: selectedTab === 'Split Bill' ? 'white' : '#666',
                                    borderRadius: '0 4px 4px 0',
                                    textTransform: 'none',
                                    '&:hover': {
                                        bgcolor: selectedTab === 'Split Bill' ? '#0a4b78' : 'rgba(0,0,0,0.04)',
                                    },
                                }}
                            >
                                Split Bill
                            </Button>
                        </Box>
                    </Box>
                    <Box sx={{ mt: 3 }}>
                        {selectedTab === 'Regular Bill' && <RegularBill />}
                        {selectedTab === 'Split Bill' && <SplitBill />}
                    </Box>
                </Box>
            </Box>
        </Container>
    );
};
PaymentPage.layout = (page) => page;
export default PaymentPage;
