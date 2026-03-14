import { Backspace } from '@mui/icons-material';
import { Box, Button, Grid, InputAdornment, TextField, Typography } from '@mui/material';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useState } from 'react';

const CashScreen = () => {
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
        <>
            <Box>
                <Box sx={{ px: 2, py: 1 }}>
                    <Grid container spacing={2}>
                        <Grid item xs={6}>
                            <Typography variant="body2" sx={{ mb: 1, color: '#666' }}>
                                Input Amount
                            </Typography>
                            <TextField
                                fullWidth
                                value={inputAmount}
                                onChange={(e) => setInputAmount(e.target.value)}
                                InputProps={{
                                    startAdornment: <InputAdornment position="start">Rs</InputAdornment>,
                                }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: '4px',
                                    },
                                }}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <Typography variant="body2" sx={{ mb: 1, color: '#666' }}>
                                Customer Changes
                            </Typography>
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    height: '56px',
                                }}
                            >
                                <Typography variant="h6" sx={{ color: '#333' }}>
                                    Rs {customerChanges}
                                </Typography>
                            </Box>
                        </Grid>
                    </Grid>
                </Box>

                {/* Quick Amount Buttons */}
                <Box sx={{ px: 2, py: 1 }}>
                    <Grid container spacing={1}>
                        <Grid item>
                            <Button
                                variant="outlined"
                                onClick={() => handleQuickAmountClick('52.64')}
                                sx={{
                                    borderColor: '#ccc',
                                    color: '#333',
                                    '&:hover': {
                                        borderColor: '#aaa',
                                        bgcolor: '#f5f5f5',
                                    },
                                }}
                            >
                                Exact money
                            </Button>
                        </Grid>
                        <Grid item>
                            <Button
                                variant="outlined"
                                onClick={() => handleQuickAmountClick('10.00')}
                                sx={{
                                    borderColor: '#ccc',
                                    color: '#333',
                                    '&:hover': {
                                        borderColor: '#aaa',
                                        bgcolor: '#f5f5f5',
                                    },
                                }}
                            >
                                Rs 10.00
                            </Button>
                        </Grid>
                        <Grid item>
                            <Button
                                variant="outlined"
                                onClick={() => handleQuickAmountClick('20.00')}
                                sx={{
                                    borderColor: '#ccc',
                                    color: '#333',
                                    '&:hover': {
                                        borderColor: '#aaa',
                                        bgcolor: '#f5f5f5',
                                    },
                                }}
                            >
                                Rs 20.00
                            </Button>
                        </Grid>
                        <Grid item>
                            <Button
                                variant="outlined"
                                onClick={() => handleQuickAmountClick('50.00')}
                                sx={{
                                    borderColor: '#ccc',
                                    color: '#333',
                                    '&:hover': {
                                        borderColor: '#aaa',
                                        bgcolor: '#f5f5f5',
                                    },
                                }}
                            >
                                Rs 50.00
                            </Button>
                        </Grid>
                        <Grid item>
                            <Button
                                variant="outlined"
                                onClick={() => handleQuickAmountClick('100.00')}
                                sx={{
                                    borderColor: '#ccc',
                                    color: '#333',
                                    '&:hover': {
                                        borderColor: '#aaa',
                                        bgcolor: '#f5f5f5',
                                    },
                                }}
                            >
                                Rs 100.00
                            </Button>
                        </Grid>
                    </Grid>
                </Box>

                {/* Numeric Keypad */}
                <Box sx={{ p: 2, mb: 1 }}>
                    <Grid container spacing={0}>
                        <Grid
                            item
                            xs={4}
                            sx={
                                {
                                    // p:5
                                }
                            }
                        >
                            <Button
                                fullWidth
                                variant="outlined"
                                onClick={() => handleNumberClick('1')}
                                sx={{
                                    width: '180px',
                                    height: '50px',
                                    fontSize: '1.5rem',
                                    borderColor: '#eee',
                                    color: '#333',
                                    '&:hover': {
                                        borderColor: '#ddd',
                                        bgcolor: '#f5f5f5',
                                    },
                                }}
                            >
                                1
                            </Button>
                        </Grid>
                        <Grid item xs={4}>
                            <Button
                                fullWidth
                                variant="outlined"
                                onClick={() => handleNumberClick('2')}
                                sx={{
                                    width: '180px',
                                    height: '50px',
                                    fontSize: '1.5rem',
                                    borderColor: '#eee',
                                    color: '#333',
                                    '&:hover': {
                                        borderColor: '#ddd',
                                        bgcolor: '#f5f5f5',
                                    },
                                }}
                            >
                                2
                            </Button>
                        </Grid>
                        <Grid item xs={4}>
                            <Button
                                fullWidth
                                variant="outlined"
                                onClick={() => handleNumberClick('3')}
                                sx={{
                                    width: '180px',
                                    height: '50px',
                                    fontSize: '1.5rem',
                                    borderColor: '#eee',
                                    color: '#333',
                                    '&:hover': {
                                        borderColor: '#ddd',
                                        bgcolor: '#f5f5f5',
                                    },
                                }}
                            >
                                3
                            </Button>
                        </Grid>
                        <Grid
                            item
                            xs={4}
                            sx={{
                                mt: 1,
                            }}
                        >
                            <Button
                                fullWidth
                                variant="outlined"
                                onClick={() => handleNumberClick('4')}
                                sx={{
                                    width: '180px',
                                    height: '50px',
                                    fontSize: '1.5rem',
                                    borderColor: '#eee',
                                    color: '#333',
                                    '&:hover': {
                                        borderColor: '#ddd',
                                        bgcolor: '#f5f5f5',
                                    },
                                }}
                            >
                                4
                            </Button>
                        </Grid>
                        <Grid
                            item
                            xs={4}
                            sx={{
                                mt: 1,
                            }}
                        >
                            <Button
                                fullWidth
                                variant="outlined"
                                onClick={() => handleNumberClick('5')}
                                sx={{
                                    width: '180px',
                                    height: '50px',
                                    fontSize: '1.5rem',
                                    borderColor: '#eee',
                                    color: '#333',
                                    '&:hover': {
                                        borderColor: '#ddd',
                                        bgcolor: '#f5f5f5',
                                    },
                                }}
                            >
                                5
                            </Button>
                        </Grid>
                        <Grid
                            item
                            xs={4}
                            sx={{
                                mt: 1,
                            }}
                        >
                            <Button
                                fullWidth
                                variant="outlined"
                                onClick={() => handleNumberClick('6')}
                                sx={{
                                    width: '180px',
                                    height: '50px',
                                    fontSize: '1.5rem',
                                    borderColor: '#eee',
                                    color: '#333',
                                    '&:hover': {
                                        borderColor: '#ddd',
                                        bgcolor: '#f5f5f5',
                                    },
                                }}
                            >
                                6
                            </Button>
                        </Grid>
                        <Grid
                            item
                            xs={4}
                            sx={{
                                mt: 1,
                            }}
                        >
                            <Button
                                fullWidth
                                variant="outlined"
                                onClick={() => handleNumberClick('7')}
                                sx={{
                                    width: '180px',
                                    height: '50px',
                                    fontSize: '1.5rem',
                                    borderColor: '#eee',
                                    color: '#333',
                                    '&:hover': {
                                        borderColor: '#ddd',
                                        bgcolor: '#f5f5f5',
                                    },
                                }}
                            >
                                7
                            </Button>
                        </Grid>
                        <Grid
                            item
                            xs={4}
                            sx={{
                                mt: 1,
                            }}
                        >
                            <Button
                                fullWidth
                                variant="outlined"
                                onClick={() => handleNumberClick('8')}
                                sx={{
                                    width: '180px',
                                    height: '50px',
                                    fontSize: '1.5rem',
                                    borderColor: '#eee',
                                    color: '#333',
                                    '&:hover': {
                                        borderColor: '#ddd',
                                        bgcolor: '#f5f5f5',
                                    },
                                }}
                            >
                                8
                            </Button>
                        </Grid>
                        <Grid
                            item
                            xs={4}
                            sx={{
                                mt: 1,
                            }}
                        >
                            <Button
                                fullWidth
                                variant="outlined"
                                onClick={() => handleNumberClick('9')}
                                sx={{
                                    width: '180px',
                                    height: '50px',
                                    fontSize: '1.5rem',
                                    borderColor: '#eee',
                                    color: '#333',
                                    '&:hover': {
                                        borderColor: '#ddd',
                                        bgcolor: '#f5f5f5',
                                    },
                                }}
                            >
                                9
                            </Button>
                        </Grid>
                        <Grid
                            item
                            xs={4}
                            sx={{
                                mt: 1,
                            }}
                        >
                            <Button
                                fullWidth
                                variant="outlined"
                                onClick={handleDecimalClick}
                                sx={{
                                    width: '180px',
                                    height: '50px',
                                    fontSize: '1.5rem',
                                    borderColor: '#eee',
                                    color: '#333',
                                    '&:hover': {
                                        borderColor: '#ddd',
                                        bgcolor: '#f5f5f5',
                                    },
                                }}
                            >
                                .
                            </Button>
                        </Grid>
                        <Grid
                            item
                            xs={4}
                            sx={{
                                mt: 1,
                            }}
                        >
                            <Button
                                fullWidth
                                variant="outlined"
                                onClick={() => handleNumberClick('0')}
                                sx={{
                                    width: '180px',
                                    height: '50px',
                                    fontSize: '1.5rem',
                                    borderColor: '#eee',
                                    color: '#333',
                                    '&:hover': {
                                        borderColor: '#ddd',
                                        bgcolor: '#f5f5f5',
                                    },
                                }}
                            >
                                0
                            </Button>
                        </Grid>
                        <Grid
                            item
                            xs={4}
                            sx={{
                                mt: 1,
                            }}
                        >
                            <Button
                                fullWidth
                                variant="outlined"
                                onClick={handleDeleteClick}
                                sx={{
                                    width: '180px',
                                    height: '50px',
                                    fontSize: '1.5rem',
                                    borderColor: '#ffcdd2',
                                    bgcolor: '#ffebee',
                                    color: '#d32f2f',
                                    '&:hover': {
                                        borderColor: '#ef9a9a',
                                        bgcolor: '#ffcdd2',
                                    },
                                }}
                            >
                                <Backspace />
                            </Button>
                        </Grid>
                    </Grid>
                </Box>
            </Box>
        </>
    );
};
CashScreen.layout = (page) => page;
export default CashScreen;
