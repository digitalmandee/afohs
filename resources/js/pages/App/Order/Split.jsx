import { Add, ContentCopy, KeyboardArrowDown, KeyboardArrowRight, Remove } from '@mui/icons-material';
import { Box, Button, IconButton, InputAdornment, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import AmountForm from './Amount';
import QRScreen from './Qr';

const SplitBill = () => {
    const [tabValue, setTabValue] = useState(0);
    const [people, setPeople] = useState(2);
    const [activeTab, setActiveTab] = useState('product');
    const [showQRScreen, setShowQRScreen] = useState(false);

    const handleTabChange = (tab) => {
        setActiveTab(tab);
    };

    const customers = [
        {
            id: 1,
            items: [
                { name: 'Cappuccino', price: 4.0, quantity: 1, totalPrice: 5.0, discount: null },
                { name: 'Soda Beverage', price: 5.0, quantity: 2, totalPrice: 10.0, discount: null },
                { name: 'French Toast Sugar', price: 4.0, quantity: 2, totalPrice: 8.0, discount: 50 },
                { name: 'Chocolate Croissant', price: 5.0, quantity: 1, totalPrice: 5.0, discount: null },
            ],
            subtotal: 20.0,
            discount: { percent: 5, amount: 0.0 },
            tax: { percent: 12, amount: 3.36 },
            total: 24.64,
        },
        {
            id: 2,
            items: [
                { name: 'Cappuccino', price: 4.0, quantity: 1, totalPrice: 5.0, discount: null },
                { name: 'Soda Beverage', price: 5.0, quantity: 1, totalPrice: 5.0, discount: null },
                { name: 'Chocolate Croissant', price: 5.0, quantity: 1, totalPrice: 5.0, discount: null },
                { name: 'French Toast Sugar', price: 4.0, quantity: 1, totalPrice: 4.0, discount: 50 },
            ],
            total: 16.72,
        },
    ];

    return (
        <Box>
            {/* Tabs and People Count */}
            {showQRScreen ? (
                <QRScreen />
            ) : (
                <>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 2 }}>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                                onClick={() => handleTabChange('product')}
                                sx={{
                                    bgcolor: activeTab === 'product' ? '#0c4a6e' : '#f0f0f0',
                                    color: activeTab === 'product' ? 'white' : '#333',
                                    borderRadius: 10,
                                    py: 1,
                                    px: 2.5,
                                    textTransform: 'none',
                                    fontWeight: 'medium',
                                    '&:hover': {
                                        bgcolor: activeTab === 'product' ? '#0c4a6e' : '#e0e0e0',
                                    },
                                }}
                            >
                                By product
                            </Button>
                            <Button
                                onClick={() => handleTabChange('amount')}
                                sx={{
                                    bgcolor: activeTab === 'amount' ? '#0c4a6e' : '#f0f0f0',
                                    color: activeTab === 'amount' ? 'white' : '#333',
                                    borderRadius: 10,
                                    py: 1,
                                    px: 2.5,
                                    textTransform: 'none',
                                    fontWeight: 'medium',
                                    '&:hover': {
                                        bgcolor: activeTab === 'amount' ? '#0c4a6e' : '#e0e0e0',
                                    },
                                }}
                            >
                                By Amount
                            </Button>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', px: 2 }}>
                            <Typography variant="body2" sx={{ mr: 1, color: '#6b7280', whiteSpace: 'nowrap' }}>
                                Number of people
                            </Typography>
                            <TextField
                                value={people}
                                size="small"
                                sx={{
                                    width: 60,
                                    mr: 1,
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 1,
                                    },
                                }}
                            />
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: '1px solid rgba(0, 0, 0, 0.23)',
                                    borderRadius: 1,
                                    px: 2,
                                    py: 0.5,
                                    bgcolor: '#f5f5f5',
                                }}
                            >
                                <Typography variant="body2">Person</Typography>
                            </Box>
                        </Box>
                    </Box>

                    {/* Customer Sections */}
                    {activeTab === 'product' ? (
                        customers.map((customer, index) => (
                            <Box key={index} sx={{ p: 2, borderBottom: '1px solid #f0f0f0' }}>
                                {/* Customer Header */}
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                        Customer #{customer.id}
                                    </Typography>
                                    <TextField
                                        placeholder="e.g. Andy"
                                        size="small"
                                        variant="outlined"
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <Typography variant="body2" sx={{ color: '#9e9e9e' }}>
                                                        Enter Name
                                                    </Typography>
                                                </InputAdornment>
                                            ),
                                        }}
                                        sx={{
                                            width: 220,
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 1,
                                            },
                                        }}
                                    />
                                </Box>

                                {/* Order Items */}
                                {customer.items.map((item, itemIndex) => (
                                    <Box
                                        key={itemIndex}
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            py: 1.5,
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center', width: 28, mr: 1 }}>
                                            <Box
                                                sx={{
                                                    width: 8,
                                                    height: 8,
                                                    borderRadius: '50%',
                                                    bgcolor: '#9e9e9e',
                                                    mx: 'auto',
                                                }}
                                            />
                                            <Box
                                                sx={{
                                                    width: 8,
                                                    height: 8,
                                                    borderRadius: '50%',
                                                    bgcolor: '#9e9e9e',
                                                    mx: 'auto',
                                                }}
                                            />
                                        </Box>

                                        <Box sx={{ width: 180 }}>
                                            <Typography variant="body2">{item.name}</Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <Typography variant="caption" sx={{ color: '#6b7280' }}>
                                                    Rs {item.price.toFixed(2)}
                                                </Typography>
                                                {item.discount && (
                                                    <Box
                                                        component="span"
                                                        sx={{
                                                            ml: 1,
                                                            bgcolor: '#0c4a6e',
                                                            color: 'white',
                                                            px: 0.5,
                                                            py: 0.1,
                                                            borderRadius: 0.5,
                                                            fontSize: '0.7rem',
                                                        }}
                                                    >
                                                        -{item.discount}%
                                                    </Box>
                                                )}
                                            </Box>
                                        </Box>

                                        <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                                            <IconButton
                                                size="small"
                                                sx={{
                                                    border: '1px solid #e0e0e0',
                                                    borderRadius: 0.5,
                                                    p: 0.5,
                                                }}
                                            >
                                                <Remove fontSize="small" />
                                            </IconButton>
                                            <Typography sx={{ mx: 2 }}>{item.quantity}</Typography>
                                            <IconButton
                                                size="small"
                                                sx={{
                                                    bgcolor: '#0c4a6e',
                                                    color: 'white',
                                                    borderRadius: 0.5,
                                                    p: 0.5,
                                                    '&:hover': {
                                                        bgcolor: '#083654',
                                                    },
                                                }}
                                            >
                                                <Add fontSize="small" />
                                            </IconButton>
                                        </Box>

                                        <Box sx={{ flexGrow: 1, textAlign: 'right', mr: 1 }}>
                                            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                                Rs {item.totalPrice.toFixed(2)}
                                            </Typography>
                                        </Box>

                                        <IconButton size="small">
                                            <ContentCopy fontSize="small" sx={{ color: '#9e9e9e' }} />
                                        </IconButton>
                                    </Box>
                                ))}

                                {/* Totals */}
                                {customer.subtotal && (
                                    <Box sx={{ mt: 2 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 0.5 }}>
                                            <Typography variant="body2" sx={{ color: '#6b7280', width: 100 }}>
                                                Subtotal
                                            </Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 'medium', width: 100, textAlign: 'right' }}>
                                                Rs {customer.subtotal.toFixed(2)}
                                            </Typography>
                                        </Box>

                                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 0.5 }}>
                                            <Typography variant="body2" sx={{ color: '#6b7280', width: 100 }}>
                                                Discount
                                            </Typography>
                                            <Box sx={{ width: 100, textAlign: 'right' }}>
                                                <Typography variant="body2" sx={{ color: '#10b981', display: 'inline' }}>
                                                    {customer.discount.percent}%
                                                </Typography>
                                                <Typography variant="body2" sx={{ display: 'inline', ml: 1 }}>
                                                    Rs {customer.discount.amount.toFixed(2)}
                                                </Typography>
                                            </Box>
                                        </Box>

                                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 0.5 }}>
                                            <Typography variant="body2" sx={{ color: '#6b7280', width: 100 }}>
                                                Tax {customer.tax.percent}%
                                            </Typography>
                                            <Typography variant="body2" sx={{ width: 100, textAlign: 'right' }}>
                                                Rs {customer.tax.amount.toFixed(2)}
                                            </Typography>
                                        </Box>
                                    </Box>
                                )}

                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mt: 1 }}>
                                    <Typography variant="body1" sx={{ fontWeight: 'bold', mr: 1 }}>
                                        Total
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 'bold', mr: 1 }}>
                                        Rs {customer.total.toFixed(2)}
                                    </Typography>
                                    <KeyboardArrowDown sx={{ color: '#6b7280' }} />
                                </Box>
                            </Box>
                        ))
                    ) : (
                        <AmountForm />
                    )}

                    {/* Action Buttons */}
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 2, gap: 2 }}>
                        <Button
                            variant="text"
                            sx={{
                                color: '#616161',
                                textTransform: 'none',
                                fontWeight: 'medium',
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            endIcon={<KeyboardArrowRight />}
                            sx={{
                                bgcolor: '#0c4a6e',
                                textTransform: 'none',
                                fontWeight: 'medium',
                                '&:hover': {
                                    bgcolor: '#083654',
                                },
                            }}
                            onClick={() => setShowQRScreen(true)}
                        >
                            Choose Payment
                        </Button>
                    </Box>
                </>
            )}
        </Box>
    );
};
SplitBill.layout = (page) => page;
export default SplitBill;
