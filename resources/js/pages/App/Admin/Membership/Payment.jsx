import { useEffect, useState } from 'react';
import { TextField, Button, Typography, Box, IconButton, Radio, RadioGroup, FormControlLabel, Paper, Grid } from '@mui/material';
import { ArrowBack, ArrowForward, Check } from '@mui/icons-material';
import 'bootstrap/dist/css/bootstrap.min.css';
import { router } from '@inertiajs/react';
import axios from 'axios';
import { enqueueSnackbar } from 'notistack';


const Payment = ({ invoice, onBack }) => {
    // const [open, setOpen] = useState(true);
    const [loading, setLoading] = useState(false);
    const [availableQuarters, setAvailableQuarters] = useState([]);
    const [selectedQuarters, setSelectedQuarters] = useState([]);
    const [formData, setFormData] = useState({
        user_id: invoice.user_id,
        subscriptionType: 'one_time',
        inputAmount: '0',
        customerCharges: '0.00',
        paymentMethod: 'cash',
        receipt: null,
        discountType: '', // 'fixed' or 'percentage'
        discountValue: '', // value of the discount
        remarks: '',
    });

    const [error, setError] = useState('');

    const subscriptionTypes = [
        { label: 'One Time', value: 'one_time' },
        // { label: 'Monthly', value: 'monthly' },
        { label: 'Quarter', value: 'quarter' },
        { label: 'Annual', value: 'annual' },
    ];

    const getAvailableQuarters = (membershipDate) => {
        const quarters = [];
        const startDate = new Date(membershipDate);
        const currentDate = new Date();
        const year = currentDate.getFullYear();

        const quarterRanges = [
            { label: `${year}-Q1`, start: new Date(`${year}-01-01`), end: new Date(`${year}-03-31`) },
            { label: `${year}-Q2`, start: new Date(`${year}-04-01`), end: new Date(`${year}-06-30`) },
            { label: `${year}-Q3`, start: new Date(`${year}-07-01`), end: new Date(`${year}-09-30`) },
            { label: `${year}-Q4`, start: new Date(`${year}-10-01`), end: new Date(`${year}-12-31`) },
        ];

        return quarterRanges.filter((q) => startDate <= q.end).map((q) => q.label);
    };

    const getCurrentQuarterLabel = () => {
        const now = new Date();
        const month = now.getMonth();
        const year = now.getFullYear();
        const q = Math.floor(month / 3) + 1;
        return `${year}-Q${q}`;
    };

    useEffect(() => {
        const memberDate = invoice.member?.membership_date;
        const quarters = getAvailableQuarters(memberDate);
        setAvailableQuarters(quarters);

        if (formData.subscriptionType === 'annual') {
            setSelectedQuarters(quarters);
        } else if (formData.subscriptionType === 'quarter') {
            const currentQ = getCurrentQuarterLabel();
            if (quarters.includes(currentQ)) {
                setSelectedQuarters([currentQ]);
            } else {
                setSelectedQuarters([]);
            }
        } else {
            setSelectedQuarters([]);
        }
    }, [formData.subscriptionType]);

    useEffect(() => {
        if (formData.subscriptionType === 'quarter' && availableQuarters.length > 0 && selectedQuarters.length === availableQuarters.length) {
            setFormData((prev) => ({ ...prev, subscriptionType: 'annual' }));
        }
    }, [selectedQuarters]);

    const getMinimumAmount = () => {
        const { subscriptionType, discountType, discountValue } = formData;

        const memberData = invoice.data?.find((d) => d.invoice_type === 'membership');

        let membershipTotal = 0;
        let duration = 1;

        if (memberData) {
            const category = memberData || {};
            const baseFee = parseFloat(category.fee || 0);
            const subFee = parseFloat(category.subscription_fee || 0);

            if (subscriptionType === 'one_time') {
                membershipTotal = baseFee;
            } else if (subscriptionType === 'monthly') {
                membershipTotal = subFee;
            } else if (subscriptionType === 'quarter') {
                membershipTotal = subFee * selectedQuarters.length;
                duration = selectedQuarters.length * 3;
            } else if (subscriptionType === 'annual') {
                membershipTotal = subFee * availableQuarters.length;
                duration = availableQuarters.length * 3;
            }

            duration = subscriptionType === 'one_time' ? 1 : subscriptionType === 'monthly' ? 1 : subscriptionType === 'quarter' ? 3 : subscriptionType === 'annual' ? 12 : duration;
        }

        let discountAmount = 0;
        const discountVal = parseFloat(discountValue || 0);
        if (discountType === 'fixed') {
            discountAmount = discountVal;
        } else if (discountType === 'percentage') {
            discountAmount = (membershipTotal * discountVal) / 100;
        }

        const total = membershipTotal - discountAmount;

        return {
            amount: membershipTotal,
            total: total > 0 ? total : 0,
            duration,
            membershipTotal,
        };
    };

    const { amount, total, membershipTotal } = getMinimumAmount();
    const minAmount = total;

    const handleInputChange = (e) => {
        const { name, value, files } = e.target;

        if (name === 'receipt') {
            setFormData((prev) => ({ ...prev, receipt: files[0] }));
            return;
        }

        if (name === 'inputAmount') {
            let inputValue = parseFloat(value) || 0;
            inputValue = Math.round(inputValue); // Round to nearest whole number
            const charges = inputValue - Math.round(minAmount);
            setFormData((prev) => ({
                ...prev,
                inputAmount: inputValue.toString(),
                customerCharges: charges > 0 ? charges.toString() : '0',
            }));
            return;
        } else if (name === 'subscriptionType') {
            let updatedData = { ...formData, subscriptionType: value };
            if (value === 'one_time') {
                updatedData.expiryDate = '';
            } else if (formData.startDate) {
                const newDate = new Date(formData.startDate);
                if (value === 'monthly') newDate.setMonth(newDate.getMonth() + 1);
                else if (value === 'quarter') newDate.setMonth(newDate.getMonth() + 3);
                else if (value === 'annual') newDate.setFullYear(newDate.getFullYear() + 1);
                updatedData.expiryDate = newDate.toISOString().split('T')[0];
            }

            const { total: newMinAmount } = getMinimumAmount();
            const inputValue = Math.round(parseFloat(updatedData.inputAmount) || 0);
            const charges = inputValue - Math.round(newMinAmount);

            setFormData({
                ...updatedData,
                inputAmount: inputValue.toString(),
                customerCharges: charges > 0 ? charges.toString() : '0',
            });

            return;
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }

        if (name === 'startDate' && formData.subscriptionType !== 'one_time') {
            const newDate = new Date(value);
            if (formData.subscriptionType === 'monthly') newDate.setMonth(newDate.getMonth() + 1);
            else if (formData.subscriptionType === 'quarter') newDate.setMonth(newDate.getMonth() + 3);
            else if (formData.subscriptionType === 'annual') newDate.setFullYear(newDate.getFullYear() + 1);
            setFormData((prev) => ({ ...prev, startDate: value, expiryDate: newDate.toISOString().split('T')[0] }));
            return;
        }
    };

    const handleQuickAmount = (value) => {
        setFormData((prev) => ({ ...prev, inputAmount: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (invoice.status === 'paid') return;
        const inputAmount = parseFloat(formData.inputAmount || '0');
        const { amount, total, duration } = getMinimumAmount();

        if (inputAmount < 0) {
            setError('Amount cannot be negative.');
            return;
        }

        if (inputAmount === 0 && (!formData.remarks || formData.remarks.trim() === '')) {
            setError('Remarks are required when the amount is 0.');
            return;
        }

        const data = new FormData();
        data.append('invoice_no', invoice.invoice_no);
        data.append('subscription_type', formData.subscriptionType);
        data.append('membership_amount', Math.round(membershipTotal));
        data.append('amount', amount);
        data.append('total_amount', inputAmount);
        data.append('member_type_id', invoice.member?.member_type?.id);
        data.append('customer_charges', parseFloat(formData.customerCharges));
        data.append('discount_type', formData.discountType || '');
        data.append('discount_value', formData.discountValue || '');
        data.append('payment_method', formData.paymentMethod);
        // Determine duration based on quarters
        let effectiveQuarters = selectedQuarters.length;
        if (formData.subscriptionType === 'annual') {
            effectiveQuarters = availableQuarters.length;
        }
        const durationInMonths = effectiveQuarters * 3;
        data.append('duration', durationInMonths);

        data.append('remarks', formData.remarks || '');
        selectedQuarters.forEach((q, i) => data.append(`paid_for_quarter[${i}]`, q));

        if (formData.paymentMethod === 'credit_card' && formData.receipt) {
            data.append('receipt', formData.receipt);
        }

        setLoading(true);
        try {
            const response = await axios.post(route('membership.payment.store'), data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.status === 200) {
                enqueueSnackbar('Payment successful.', { variant: 'success' });
                setError('');
                router.visit(route('membership.dashboard'));
            } else {
                setError('Payment failed: ' + (response.data?.message || 'Please check the form data.'));
            }
        } catch (error) {
            setError('Payment failed: ' + (error.response?.data?.message || 'Please check the form data.'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* <SideNav open={open} setOpen={setOpen} /> */}
            <div
                style={{
                    minHeight: '100vh',
                    backgroundColor:'#f5f5f5',
                    padding: '2rem',
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                    <IconButton onClick={()=>window.history.back()} sx={{ color: '#000' }}>
                        <ArrowBack />
                    </IconButton>
                    <Typography variant="h5" sx={{ ml: 1, fontWeight: 500, color: '#333' }}>
                        Cash Payment
                    </Typography>
                </Box>
                <Box sx={{ maxWidth: '650px', width: '100%', margin: '0 auto' }}>
                    {/* Progress Steps */}
                    <Paper
                        elevation={0}
                        sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            p: 2,
                            mb: 4,
                            backgroundColor: '#e0e0e0',
                            borderRadius: '4px',
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box
                                sx={{
                                    width: 24,
                                    height: 24,
                                    borderRadius: '50%',
                                    backgroundColor: '#fff',
                                    color: '#333',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    mr: 1,
                                    border: '2px solid #333',
                                }}
                            >
                                <Check sx={{ fontSize: 16 }} />
                            </Box>
                            <Typography sx={{ fontWeight: 500, color: '#666' }}>Member Detail</Typography>
                        </Box>
                        <Box sx={{ width: '50%', height: '2px', backgroundColor: '#333' }} />
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box
                                sx={{
                                    width: 24,
                                    height: 24,
                                    borderRadius: '50%',
                                    backgroundColor: '#063455',
                                    color: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    mr: 1,
                                }}
                            >
                                2
                            </Box>
                            <Typography sx={{ fontWeight: 500, color: '#063455' }}>Payment Detail</Typography>
                        </Box>
                    </Paper>

                    {/* Member Details */}
                    {invoice && (
                        <Paper sx={{ p: 2, mb: 4, boxShadow: 'none', border: '1px solid #e0e0e0', borderRadius: '4px' }}>
                            <Typography variant="h6" sx={{ mb: 2, color: '#333' }}>
                                Member Details
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <Typography sx={{ mb: 1 }}>
                                        <strong>Membership no:</strong> {invoice.member?.membership_no}
                                    </Typography>
                                    <Typography sx={{ mb: 1 }}>
                                        <strong>Name:</strong> {invoice.member?.first_name} {invoice.member?.last_name}
                                    </Typography>
                                    <Typography sx={{ mb: 1 }}>
                                        <strong>Email:</strong> {invoice.member?.personal_email}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    {membershipTotal > 0 && (
                                        <>
                                            <Typography sx={{ mb: 1 }}>
                                                <strong>Membership Fee:</strong> Rs {Math.round(membershipTotal)}
                                            </Typography>
                                        </>
                                    )}
                                    <Typography>
                                        <strong>Total Payable:</strong> Rs {Math.round(total)}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </Paper>
                    )}

                    {/* Main Form */}
                    <Box className="bg-white p-4" sx={{ border: '1px solid #e0e0e0', borderRadius: '4px' }}>
                        <Box sx={{ my: 4 }}>
                            <Typography variant="h4" sx={{ fontSize: '1.5rem', fontWeight: 600, mb: 2, color: '#333' }}>
                                Payment Method
                            </Typography>
                        </Box>
                        <Typography variant="h6" sx={{ fontSize: '1.125rem', mb: 2, color: '#666' }}>
                            Payment Method
                        </Typography>

                        <RadioGroup row name="paymentMethod" value={formData.paymentMethod} onChange={handleInputChange} sx={{ mb: 4 }}>
                            <FormControlLabel value="cash" control={<Radio />} label="Cash" />
                            <FormControlLabel value="credit_card" control={<Radio />} label="Credit Card" />
                        </RadioGroup>

                        <Typography variant="h6" sx={{ fontSize: '1.125rem', mb: 3, color: '#666' }}>
                            Payment Subscription
                        </Typography>

                        <Box className="d-flex gap-3 mb-4">
                            <RadioGroup row name="subscriptionType" value={formData.subscriptionType} onChange={handleInputChange}>
                                {subscriptionTypes.map(({ label, value }) => (
                                    <Box
                                        key={value}
                                        className="d-flex align-items-center p-2 border"
                                        sx={{
                                            borderRadius: '4px',
                                            bgcolor: formData.subscriptionType === value ? '#f0f0f0' : 'transparent',
                                            borderColor: '#ccc',
                                        }}
                                    >
                                        <FormControlLabel value={value} control={<Radio sx={{ color: '#1976d2' }} />} label={label} sx={{ margin: 0, '& .MuiTypography-root': { fontSize: '0.875rem' } }} />
                                    </Box>
                                ))}
                            </RadioGroup>
                        </Box>

                        <Box className="d-flex gap-5 mb-4">
                            <Box className="d-flex flex-column w-50">
                                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500, color: '#666' }}>
                                    Input Amount
                                </Typography>
                                <Box className="d-flex">
                                    <Box className="py-2 px-3 border border-end-0" sx={{ bgcolor: '#dbdbdb', borderColor: '#ccc', display: 'flex', alignItems: 'center' }}>
                                        Rs
                                    </Box>
                                    <TextField
                                        name="inputAmount"
                                        value={formData.inputAmount}
                                        onChange={handleInputChange}
                                        placeholder="10.00"
                                        variant="outlined"
                                        size="small"
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: '0 4px 4px 0',
                                                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#ccc' },
                                                width: '100%',
                                            },
                                        }}
                                        inputProps={{ type: 'number', step: '1', min: '0' }}
                                    />
                                </Box>
                                {/* Show minimum amount below input */}
                                {minAmount > 0 && (
                                    <Typography variant="body2" sx={{ color: 'gray', mt: 1 }}>
                                        Minimum Amount: Rs {Math.round(minAmount)}
                                    </Typography>
                                )}
                            </Box>
                            <Box className="d-flex flex-column w-50">
                                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500, color: '#666' }}>
                                    Customer Charges
                                </Typography>
                                <Typography variant="h5" sx={{ fontWeight: 500, color: '#333' }}>
                                    Rs {Math.round(formData.customerCharges)}
                                </Typography>
                            </Box>
                        </Box>

                        <Box className="d-flex gap-5 mb-4">
                            <Box className="d-flex flex-column w-50">
                                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500, color: '#666' }}>
                                    Discount Type
                                </Typography>
                                <TextField select name="discountType" value={formData.discountType} onChange={handleInputChange} SelectProps={{ native: true }} size="small" variant="outlined">
                                    <option value="">None</option>
                                    <option value="fixed">Fixed</option>
                                    <option value="percentage">Percentage</option>
                                </TextField>
                            </Box>

                            <Box className="d-flex flex-column w-50">
                                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500, color: '#666' }}>
                                    Discount Value
                                </Typography>
                                <TextField name="discountValue" value={formData.discountValue} onChange={handleInputChange} placeholder="0" variant="outlined" size="small" inputProps={{ type: 'number', min: 0 }} />
                            </Box>
                        </Box>

                        <Box className="d-flex gap-3 mb-4">
                            {['Exact money', '10.00', '20.00', '50.00', '100.00'].map((value) => (
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
                        </Box>

                        <Box className="d-flex flex-column mb-4">
                            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500, color: '#666' }}>
                                Remarks
                            </Typography>
                            <TextField name="remarks" value={formData.remarks} onChange={handleInputChange} placeholder="e.g., Overseas, Out of country" variant="outlined" size="small" />
                        </Box>
                        {(formData.subscriptionType === 'quarter' || formData.subscriptionType === 'annual') && (
                            <Box className="mb-4">
                                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500, color: '#666' }}>
                                    {formData.subscriptionType === 'annual' ? 'Selected Quarters (Auto)' : 'Select Quarters'}
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                    {availableQuarters.map((quarter) => (
                                        <Button
                                            key={quarter}
                                            variant={selectedQuarters.includes(quarter) ? 'contained' : 'outlined'}
                                            onClick={() => {
                                                if (formData.subscriptionType === 'annual') return;
                                                setSelectedQuarters((prev) => (prev.includes(quarter) ? prev.filter((q) => q !== quarter) : [...prev, quarter]));
                                            }}
                                            disabled={formData.subscriptionType === 'annual'}
                                            sx={{
                                                textTransform: 'none',
                                                minWidth: '80px',
                                                bgcolor: selectedQuarters.includes(quarter) ? '#1976d2' : 'transparent',
                                                color: selectedQuarters.includes(quarter) ? '#fff' : '#333',
                                                borderColor: '#ccc',
                                            }}
                                        >
                                            {quarter}
                                        </Button>
                                    ))}
                                </Box>
                            </Box>
                        )}

                        {error && (
                            <Typography color="error" sx={{ mb: 2 }}>
                                {error}
                            </Typography>
                        )}

                        {formData.paymentMethod === 'credit_card' && (
                            <Box sx={{ mb: 4 }}>
                                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500, color: '#666' }}>
                                    Upload Receipt
                                </Typography>
                                <input type="file" name="receipt" accept="image/*,application/pdf" onChange={handleInputChange} style={{ display: 'block' }} />
                            </Box>
                        )}

                        <Box className="d-flex justify-content-end">
                            <Button
                                variant="contained"
                                className="d-flex align-items-center"
                                onClick={handleSubmit}
                                loading={loading}
                                disabled={invoice.status === 'paid' || loading}
                                loadingPosition="start"
                                sx={{
                                    bgcolor: '#0c4b6e',
                                    '&:hover': {
                                        bgcolor: '#083854',
                                    },
                                    textTransform: 'none',
                                }}
                            >
                                Pay Now
                                <ArrowForward sx={{ ml: 1, fontSize: '16px' }} />
                            </Button>
                        </Box>
                    </Box>
                </Box>
            </div>
        </>
    );
};

export default Payment;
