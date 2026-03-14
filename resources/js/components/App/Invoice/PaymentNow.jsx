import { router } from '@inertiajs/react';
import axios from 'axios';
import { routeNameForContext } from '@/lib/utils';
import { AccountBalance as AccountBalanceIcon, ArrowForward as ArrowForwardIcon, CreditCard as CreditCardIcon } from '@mui/icons-material';
import { Box, Button, Dialog, Grid, InputAdornment, MenuItem, Select, Switch, TextField, Typography } from '@mui/material';
import { enqueueSnackbar } from 'notistack';
import { useEffect, useState } from 'react';
import Receipt from './Receipt';

const PaymentNow = ({ invoiceData, openSuccessPayment, openPaymentModal, handleClosePayment, setSelectedOrder, isLoading, mode = 'payment', handleSendToKitchen }) => {
    const round0 = (n) => Math.round(typeof n === 'string' ? parseFloat(n) || 0 : n || 0);
    const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
    // Payment state
    const [inputAmount, setInputAmount] = useState('0');
    const [customerChanges, setCustomerChanges] = useState('0');
    const [activePaymentMethod, setActivePaymentMethod] = useState('cash');
    const [selectedBank, setSelectedBank] = useState('mcb');
    const [paymentAccounts, setPaymentAccounts] = useState([]);
    const [paymentAccountId, setPaymentAccountId] = useState('');
    const [splitPaymentAccounts, setSplitPaymentAccounts] = useState({ cash: [], credit_card: [], bank: [] });
    const [splitPaymentAccountIds, setSplitPaymentAccountIds] = useState({ cash: '', credit_card: '', bank: '' });
    // Bank transfer form state
    const [accountNumber, setAccountNumber] = useState('');
    const [cardHolderName, setCardHolderName] = useState('');
    const [cvvCode, setCvvCode] = useState('');

    // Credit card states
    const [creditCardType, setCreditCardType] = useState('visa');
    const [receiptFile, setReceiptFile] = useState(null);

    // Split Payment
    const [cashAmount, setCashAmount] = useState('0');
    const [creditCardAmount, setCreditCardAmount] = useState('0');
    const [bankTransferAmount, setBankTransferAmount] = useState('0');

    // ENT - Now as toggle, not payment method
    const [entEnabled, setEntEnabled] = useState(false);
    const [entReason, setEntReason] = useState('');
    const [entComment, setEntComment] = useState('');
    const [selectedEntItems, setSelectedEntItems] = useState([]);
    const [entAmount, setEntAmount] = useState('0');

    // CTS - Now as toggle, not payment method
    const [ctsEnabled, setCtsEnabled] = useState(false);
    const [ctsComment, setCtsComment] = useState('');
    const [ctsAmount, setCtsAmount] = useState('0');
    const [employeePaymentPreview, setEmployeePaymentPreview] = useState(null);

    // Fetch Settings
    useEffect(() => {
        // No longer fetching bank charges here as they are part of order total
    }, []);

    useEffect(() => {
        const restaurantId = invoiceData?.tenant_id ?? invoiceData?.restaurant_id ?? invoiceData?.location_id ?? invoiceData?.invoice?.tenant_id ?? null;
        setPaymentAccountId('');

        if (activePaymentMethod === 'split_payment') {
            setSplitPaymentAccountIds({ cash: '', credit_card: '', bank: '' });

            const fetchFor = (paymentMethod) =>
                axios
                    .get(route(routeNameForContext('api.payment-accounts')), {
                        params: {
                            payment_method: paymentMethod,
                            ...(restaurantId ? { restaurant_id: restaurantId } : {}),
                        },
                    })
                    .then((res) => (Array.isArray(res.data) ? res.data : []))
                    .catch(() => []);

            Promise.all([fetchFor('cash'), fetchFor('credit_card'), fetchFor('bank_transfer')]).then(([cash, credit_card, bank]) => {
                setSplitPaymentAccounts({ cash, credit_card, bank });
            });

            return;
        }

        axios
            .get(route(routeNameForContext('api.payment-accounts')), {
                params: {
                    payment_method: activePaymentMethod,
                    ...(restaurantId ? { restaurant_id: restaurantId } : {}),
                },
            })
            .then((res) => setPaymentAccounts(Array.isArray(res.data) ? res.data : []))
            .catch(() => setPaymentAccounts([]));
    }, [activePaymentMethod, invoiceData?.tenant_id, invoiceData?.restaurant_id, invoiceData?.location_id, invoiceData?.invoice?.tenant_id]);

    // Helper to parse price safely
    const parsePrice = (price) => {
        if (typeof price === 'number') return price;
        if (!price) return 0;
        const parsed = parseFloat(price.toString().replace(/,/g, ''));
        return Number.isFinite(parsed) ? parsed : 0;
    };

    const getOrderItems = () => {
        const items = invoiceData?.order_items ?? invoiceData?.orderItems ?? invoiceData?.invoice?.order_items ?? invoiceData?.invoice?.orderItems ?? [];
        return Array.isArray(items) ? items : [];
    };
    const isEmployeeOrder = Boolean(invoiceData?.employee_id || invoiceData?.employee?.id || invoiceData?.member?.booking_type === 'employee');
    useEffect(() => {
        if (!isEmployeeOrder || !invoiceData?.id) {
            setEmployeePaymentPreview(null);
            return;
        }

        axios
            .get(route(routeNameForContext('transaction.invoice'), { invoiceId: invoiceData.id }))
            .then((res) => {
                const preview = res?.data?.employee_payment_preview;
                setEmployeePaymentPreview(preview && typeof preview === 'object' ? preview : null);
            })
            .catch(() => setEmployeePaymentPreview(null));
    }, [isEmployeeOrder, invoiceData?.id]);

    const getEntItemKey = (item, index = 0) => String(item?.id ?? item?.order_item?.id ?? `ent-${index}`);
    const getOrderItemsTotal = () =>
        getOrderItems()
            .filter((item) => item?.status !== 'cancelled')
            .reduce((sum, item) => {
                const itemTotal = item?.order_item?.total_price || (item?.order_item?.quantity || item?.quantity) * (item?.order_item?.price || item?.price);
                return sum + parsePrice(itemTotal || 0);
            }, 0);
    const getTotalPrice = () => {
        const explicitTotal = parsePrice(invoiceData?.invoice?.total_price ?? invoiceData?.invoice?.total ?? invoiceData?.invoice?.grand_total ?? invoiceData?.invoice?.grandTotal ?? invoiceData?.total_price ?? invoiceData?.totalPrice ?? invoiceData?.amount ?? invoiceData?.invoice?.amount ?? 0);
        if (explicitTotal > 0) return explicitTotal;
        return getOrderItemsTotal();
    };
    const getPaymentStatus = () => String(invoiceData?.invoice?.status ?? invoiceData?.invoice?.payment_status ?? invoiceData?.payment_status ?? '').toLowerCase();
    const getDueFromInvoiceField = () => {
        const dueCandidates = [invoiceData?.invoice?.customer_charges, invoiceData?.invoice?.customerCharges, invoiceData?.customer_charges, invoiceData?.customerCharges, invoiceData?.invoice?.remaining_amount, invoiceData?.invoice?.remainingAmount, invoiceData?.remaining_amount, invoiceData?.remainingAmount, invoiceData?.invoice?.due_amount, invoiceData?.invoice?.dueAmount, invoiceData?.due_amount, invoiceData?.dueAmount];

        for (const value of dueCandidates) {
            if (value === null || value === undefined) continue;
            const parsed = parsePrice(value);
            if (parsed > 0) return parsed;
        }

        const hasExplicitZero = dueCandidates.some((value) => value !== null && value !== undefined && parsePrice(value) === 0);
        return hasExplicitZero ? 0 : null;
    };
    const getAdvancePaid = () => {
        if (invoiceData?.invoice) {
            return parsePrice(invoiceData?.invoice?.advance_payment ?? invoiceData?.invoice?.advancePayment ?? invoiceData?.invoice?.data?.advance_deducted ?? 0);
        }
        return parsePrice(invoiceData?.advance_payment ?? invoiceData?.advancePayment ?? invoiceData?.down_payment ?? invoiceData?.downPayment ?? invoiceData?.data?.advance_deducted ?? 0);
    };
    const getPaidCash = () => parsePrice(invoiceData?.invoice?.paid_amount ?? invoiceData?.invoice?.paidAmount ?? invoiceData?.paid_amount ?? invoiceData?.paidAmount ?? 0);
    const getDueTotal = () => {
        const dueFromInvoice = getDueFromInvoiceField();
        const status = getPaymentStatus();
        const shouldTrustZeroDue = ['paid', 'settled'].includes(status);

        if (dueFromInvoice > 0) {
            return dueFromInvoice;
        }
        if (dueFromInvoice === 0 && shouldTrustZeroDue) {
            return 0;
        }
        const alreadyPaid = getPaidCash() + getAdvancePaid();
        return Math.max(0, round2(getTotalPrice() - alreadyPaid));
    };
    const employeeFoodAllowanceApplied = round2(employeePaymentPreview?.food_allowance_applied ?? invoiceData?.employee_payment_preview?.food_allowance_applied ?? 0);
    const employeeRemainingAfterAllowance = round2(
        employeePaymentPreview?.remaining_after_food_allowance ??
            invoiceData?.employee_payment_preview?.remaining_after_food_allowance ??
            Math.max(0, getDueTotal() - employeeFoodAllowanceApplied),
    );
    const employeeCtsAllowed = Boolean(employeePaymentPreview?.cts_allowed ?? invoiceData?.employee_payment_preview?.cts_allowed ?? false);
    const employeeMaxCtsAmount = round2(
        employeePaymentPreview?.max_cts_amount ?? invoiceData?.employee_payment_preview?.max_cts_amount ?? employeeRemainingAfterAllowance,
    );
    const getEffectiveEntDeduction = () => (isEmployeeOrder ? employeeFoodAllowanceApplied : entEnabled ? round2(entAmount || 0) : 0);
    const getEffectiveCtsDeduction = () => {
        if (isEmployeeOrder) {
            if (!ctsEnabled || !employeeCtsAllowed) {
                return 0;
            }
            return Math.min(round2(ctsAmount || 0), employeeMaxCtsAmount);
        }
        return ctsEnabled ? round2(ctsAmount || 0) : 0;
    };
    const getRemainingBalance = () => Math.max(0, round2(getDueTotal() - getEffectiveEntDeduction() - getEffectiveCtsDeduction()));

    // Calculate ENT Amount when items selected
    useEffect(() => {
        const entItems = getOrderItems();
        if (entEnabled && entItems.length > 0) {
            const selected = entItems.filter((item, index) => selectedEntItems.includes(getEntItemKey(item, index)));
            const totalEnt = selected.reduce((sum, item) => {
                const itemTotal = item.order_item?.total_price || (item.order_item?.quantity || item.quantity) * (item.order_item?.price || item.price);
                return sum + parsePrice(itemTotal || 0);
            }, 0);
            setEntAmount(totalEnt.toFixed(2));
        } else {
            setEntAmount('0');
        }
    }, [selectedEntItems, invoiceData, entEnabled]);

    // Calculate Remaining Balance or Total with Charges
    useEffect(() => {
        const targetAmount = round0(getRemainingBalance());
        setInputAmount(String(Math.round(targetAmount)));
        setCustomerChanges('0');
    }, [entAmount, ctsAmount, entEnabled, ctsEnabled, invoiceData, employeePaymentPreview]);

    const handlePaymentMethodChange = (method) => {
        setActivePaymentMethod(method);
        // No special handling needed - due amount is calculated based on ENT/CTS toggles
    };

    const handleBankSelection = (bank) => {
        setSelectedBank(bank);
    };

    const handleQuickAmountClick = (amount) => {
        // Sanitize the input amount (remove commas if present)
        const cleanAmount = Math.max(0, parsePrice(amount));
        setInputAmount(cleanAmount.toString());

        // Calculate customer changes based on remaining after ENT/CTS and including Bank Charges
        const dueAmount = Math.max(0, round0(getRemainingBalance()));

        const changes = round0(cleanAmount - dueAmount);
        setCustomerChanges(String(Math.round(changes < 0 ? 0 : changes)));
    };

    const handleFileChange = (e) => {
        if (e.target.files.length > 0) {
            setReceiptFile(e.target.files[0]);
        } else {
            setReceiptFile(null);
        }
    };

    const handleOrderAndPay = async () => {
        const entDeduction = getEffectiveEntDeduction();
        const ctsDeduction = getEffectiveCtsDeduction();
        const remainingBalance = getRemainingBalance();

        // Amount validation - input should cover remaining balance
        // Note: Using a small epsilon for float comparison safety, though simple < works usually
        if (remainingBalance > 0 && parseFloat(inputAmount) < remainingBalance - 0.01) {
            enqueueSnackbar('Please enter amount to cover remaining balance of Rs ' + remainingBalance.toFixed(2), { variant: 'warning' });
            return;
        }

        let payload = {};

        // Prepare form data for credit card (with file)
        if (activePaymentMethod === 'credit_card') {
            payload = {
                payment: {
                    paid_amount: inputAmount,
                    payment_method: 'credit_card',
                    credit_card_type: creditCardType,
                    ...(paymentAccountId ? { payment_account_id: paymentAccountId } : {}),
                },
                ...(receiptFile ? { receipt: receiptFile } : {}),
            };
        } else {
            // For other payment methods (cash, bank) use regular payload
            const paidAmount = activePaymentMethod === 'split_payment' ? (parseFloat(cashAmount || 0) + parseFloat(creditCardAmount || 0) + parseFloat(bankTransferAmount || 0)).toFixed(2) : inputAmount;

            payload = {
                payment: {
                    paid_amount: paidAmount,
                    customer_changes: customerChanges,
                    payment_method: activePaymentMethod,
                    ...(activePaymentMethod === 'split_payment' && {
                        cash: cashAmount,
                        credit_card: creditCardAmount,
                        bank_transfer: bankTransferAmount,
                        ...(Object.values(splitPaymentAccountIds).some(Boolean)
                            ? {
                                  split_payment_accounts: Object.fromEntries(Object.entries(splitPaymentAccountIds).filter(([, v]) => v)),
                              }
                            : {}),
                    }),
                    ...(activePaymentMethod !== 'split_payment' && paymentAccountId ? { payment_account_id: paymentAccountId } : {}),
                },
            };
        }

        // Add ENT data if enabled
        if (entEnabled) {
            payload.payment.ent_enabled = true;
            payload.payment.ent_reason = entReason;
            payload.payment.ent_comment = entComment;
            payload.payment.ent_items = selectedEntItems;
            payload.payment.ent_amount = entDeduction;
        }

        // Add CTS data if enabled
        if (ctsEnabled) {
            payload.payment.cts_enabled = true;
            payload.payment.cts_comment = ctsComment;
            payload.payment.cts_amount = ctsDeduction;
        }

        await handleSendToKitchen(payload);
    };

    const handlePayNow = () => {
        const entDeduction = getEffectiveEntDeduction();
        const ctsDeduction = getEffectiveCtsDeduction();
        const remainingBalance = getRemainingBalance();

        // Amount validation - input should cover remaining balance
        if (remainingBalance > 0 && parseFloat(inputAmount) < remainingBalance - 0.01) {
            enqueueSnackbar('Please enter amount to cover remaining balance of Rs ' + remainingBalance.toFixed(2), { variant: 'warning' });
            return;
        }

        // Handle overpayment logic: paid_amount should be exactly what's due (or grandTotal if paying full),
        // and difference is change. We shouldn't send more than remaining balance as paid_amount.
        const inputVal = parseFloat(inputAmount);
        const actualPaidAmount = inputVal > remainingBalance ? remainingBalance : inputVal;

        // Prepare form data for credit card (with file)
        if (activePaymentMethod === 'credit_card') {
            const formData = new FormData();
            formData.append('order_id', invoiceData.id);
            formData.append('paid_amount', actualPaidAmount.toFixed(2)); // Send exact due amount
            formData.append('payment_method', 'credit_card');
            formData.append('credit_card_type', creditCardType);
            if (receiptFile) {
                formData.append('receipt', receiptFile);
            }
            if (paymentAccountId) {
                formData.append('payment_account_id', paymentAccountId);
            }

            // Add ENT/CTS data to FormData
            if (entEnabled) {
                formData.append('ent_enabled', 'true');
                formData.append('ent_reason', entReason);
                formData.append('ent_comment', entComment);
                formData.append('ent_amount', entDeduction);
                selectedEntItems.forEach((item, idx) => formData.append(`ent_items[${idx}]`, item));
            }
            if (ctsEnabled) {
                formData.append('cts_enabled', 'true');
                formData.append('cts_comment', ctsComment);
                formData.append('cts_amount', ctsDeduction);
            }

            router.post(route(routeNameForContext('order.payment')), formData, {
                onSuccess: () => {
                    enqueueSnackbar('Payment successful', { variant: 'success' });
                    setSelectedOrder((prev) => ({ ...prev, paid_amount: actualPaidAmount.toFixed(2), payment_status: 'paid' }));
                    openSuccessPayment();
                },
                onError: (errors) => {
                    enqueueSnackbar(
                        typeof errors === 'object' && errors !== null
                            ? Object.entries(errors)
                                  .map(([field, message]) => message)
                                  .join(', ')
                            : 'Something went wrong',
                        { variant: 'error' },
                    );
                },
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
        } else {
            // For other payment methods (cash, bank) use regular payload
            // For split payment, logic might differ, but assuming cash payment mostly for change logic
            let paidAmount = activePaymentMethod === 'split_payment' ? parseFloat(cashAmount || 0) + parseFloat(creditCardAmount || 0) + parseFloat(bankTransferAmount || 0) : inputVal;

            // Apply same capping logic for non-split payments (Cash)
            if (activePaymentMethod !== 'split_payment' && paidAmount > remainingBalance) {
                paidAmount = remainingBalance;
            }

            const payload = {
                order_id: invoiceData?.id,
                paid_amount: paidAmount.toFixed(2),
                customer_changes: customerChanges,
                payment_method: activePaymentMethod,
                ...(activePaymentMethod === 'split_payment' && {
                    cash: cashAmount,
                    credit_card: creditCardAmount,
                    bank_transfer: bankTransferAmount,
                    ...(Object.values(splitPaymentAccountIds).some(Boolean)
                        ? {
                              split_payment_accounts: Object.fromEntries(Object.entries(splitPaymentAccountIds).filter(([, v]) => v)),
                          }
                        : {}),
                }),
                ...(activePaymentMethod !== 'split_payment' && paymentAccountId ? { payment_account_id: paymentAccountId } : {}),
            };

            // Add ENT data if enabled
            if (entEnabled) {
                payload.ent_enabled = true;
                payload.ent_reason = entReason;
                payload.ent_comment = entComment;
                payload.ent_items = selectedEntItems;
                payload.ent_amount = entDeduction;
            }

            // Add CTS data if enabled
            if (ctsEnabled) {
                payload.cts_enabled = true;
                payload.cts_comment = ctsComment;
                payload.cts_amount = ctsDeduction;
            }

            router.post(route(routeNameForContext('order.payment')), payload, {
                onSuccess: () => {
                    setSelectedOrder((prev) => ({ ...prev, paid_amount: paidAmount.toFixed(2), payment_status: 'paid' }));
                    enqueueSnackbar('Payment successful', { variant: 'success' });
                    openSuccessPayment();
                },
                onError: (errors) => {
                    enqueueSnackbar(
                        typeof errors === 'object' && errors !== null
                            ? Object.entries(errors)
                                  .map(([field, message]) => message)
                                  .join(', ')
                            : 'Something went wrong',
                        { variant: 'error' },
                    );
                },
            });
        }
    };

    useEffect(() => {
        if (!openPaymentModal) return;

        const handleKeyDown = (e) => {
            if (e.isComposing) return;
            if (String(e.key || '').toLowerCase() !== 'enter') return;
            e.preventDefault();
            handlePayNow();
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [openPaymentModal, handlePayNow]);

    useEffect(() => {
        if (activePaymentMethod === 'split_payment') {
            const totalPaid = Number(cashAmount) + Number(creditCardAmount) + Number(bankTransferAmount);
            const due = getRemainingBalance();
            const change = totalPaid - due;
            setCustomerChanges((change < 0 ? 0 : change).toFixed(2));
            setInputAmount(totalPaid.toString()); // Optional: track total paid in inputAmount too
        }
    }, [cashAmount, creditCardAmount, bankTransferAmount, invoiceData, activePaymentMethod, entAmount, ctsAmount, entEnabled, ctsEnabled, employeePaymentPreview]);

    useEffect(() => {
        if (!isEmployeeOrder) return;
        setEntEnabled(false);
        setCtsEnabled(false);
        setSelectedEntItems([]);
        setEntAmount('0');
        setCtsAmount('0');
    }, [invoiceData?.id, isEmployeeOrder]);

    return (
        <Dialog
            open={openPaymentModal}
            onClose={handleClosePayment}
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
                    maxWidth: '1000px',
                    borderRadius: 0,
                    overflow: 'auto',
                },
            }}
        >
            <Box sx={{ display: 'flex', height: '100vh' }}>
                {/* Left Side - Receipt */}
                <Receipt
                    invoiceData={
                        invoiceData
                            ? {
                                  ...invoiceData,
                                  invoice_no: invoiceData.invoice_no ?? invoiceData.invoice?.invoice_no,
                                  total_price: getTotalPrice(),
                                  paid_amount: getPaidCash(),
                                  advance_payment: getAdvancePaid(),
                                  data: invoiceData.data ?? invoiceData.invoice?.data,
                              }
                            : null
                    }
                    openModal={openPaymentModal}
                    showButtons={false}
                />

                {/* Right Side - Payment */}
                <Box sx={{ flex: 1, p: 3 }}>
                    <Typography variant="h5" fontWeight="bold" mb={4}>
                        Payment
                    </Typography>
                    {/* Payment Method Tabs */}
                    <Box
                        sx={{
                            display: 'flex',
                            borderBottom: '1px solid #e0e0e0',
                            mb: 2,
                        }}
                    >
                        <Box sx={activePaymentMethod === 'cash' ? styles.activePaymentMethodTab : styles.paymentMethodTab} onClick={() => handlePaymentMethodChange('cash')}>
                            <CreditCardIcon
                                sx={{
                                    fontSize: 24,
                                    mb: 1,
                                    color: activePaymentMethod === 'cash' ? '#0a3d62' : '#666',
                                }}
                            />
                            <Typography variant="body1" fontWeight={activePaymentMethod === 'cash' ? 'medium' : 'normal'}>
                                Cash
                            </Typography>
                        </Box>

                        {/* New Credit Card Tab */}
                        <Box sx={activePaymentMethod === 'credit_card' ? styles.activePaymentMethodTab : styles.paymentMethodTab} onClick={() => handlePaymentMethodChange('credit_card')}>
                            <CreditCardIcon
                                sx={{
                                    fontSize: 24,
                                    mb: 1,
                                    color: activePaymentMethod === 'credit_card' ? '#0a3d62' : '#666',
                                }}
                            />
                            <Typography variant="body1" fontWeight={activePaymentMethod === 'credit_card' ? 'medium' : 'normal'}>
                                Credit Card
                            </Typography>
                        </Box>

                        <Box sx={activePaymentMethod === 'bank_transfer' ? styles.activePaymentMethodTab : styles.paymentMethodTab} onClick={() => handlePaymentMethodChange('bank_transfer')}>
                            <AccountBalanceIcon
                                sx={{
                                    fontSize: 24,
                                    mb: 1,
                                    color: activePaymentMethod === 'bank_transfer' ? '#0a3d62' : '#666',
                                }}
                            />
                            <Typography variant="body1" fontWeight={activePaymentMethod === 'bank_transfer' ? 'medium' : 'normal'}>
                                Bank Transfer
                            </Typography>
                        </Box>

                        <Box sx={activePaymentMethod === 'split_payment' ? styles.activePaymentMethodTab : styles.paymentMethodTab} onClick={() => handlePaymentMethodChange('split_payment')}>
                            <AccountBalanceIcon
                                sx={{
                                    fontSize: 24,
                                    mb: 1,
                                    color: activePaymentMethod === 'split_payment' ? '#0a3d62' : '#666',
                                }}
                            />
                            <Typography variant="body1" fontWeight={activePaymentMethod === 'split_payment' ? 'medium' : 'normal'}>
                                Split Payment
                            </Typography>
                        </Box>
                    </Box>

                    {/* ENT/CTS/Bank Charges Toggles - Deductions & Adjustments Section */}
                    <Box sx={{ mb: 3, pt: 2, borderTop: '1px dashed #e0e0e0' }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontWeight: 'bold' }}>
                            Deductions & Adjustments
                        </Typography>

                        {isEmployeeOrder && (
                            <Box sx={{ mb: 2, p: 1.5, border: '1px dashed #0a3d62', borderRadius: 1, backgroundColor: '#f5f9fc' }}>
                                <Typography variant="body2" sx={{ color: '#0a3d62', fontWeight: 500 }}>
                                    Employee order: Food Allowance is auto-applied first. You can choose CTS deduction from remaining amount.
                                </Typography>
                                <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Food Allowance Applied
                                    </Typography>
                                    <Typography variant="body2" fontWeight="bold">
                                        Rs {employeeFoodAllowanceApplied.toFixed(2)}
                                    </Typography>
                                </Box>
                                <Box sx={{ mt: 0.5, display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Remaining After Allowance
                                    </Typography>
                                    <Typography variant="body2" fontWeight="bold">
                                        Rs {employeeRemainingAfterAllowance.toFixed(2)}
                                    </Typography>
                                </Box>
                            </Box>
                        )}

                        {/* ENT, CTS, Bank Charges Toggles */}
                        {!isEmployeeOrder && <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                            {/* ENT Toggle */}
                            <Box
                                sx={{
                                    flex: 1,
                                    p: 1.5,
                                    border: '1px solid #e0e0e0',
                                    borderRadius: 1,
                                    backgroundColor: entEnabled ? '#f5f9fc' : 'transparent',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    minWidth: '150px',
                                }}
                            >
                                <Switch
                                    checked={entEnabled}
                                    onChange={(e) => {
                                        const checked = e.target.checked;
                                        setEntEnabled(checked);
                                        if (checked) {
                                            setCtsEnabled(false);
                                            setCtsAmount('0');
                                        } else {
                                            setSelectedEntItems([]);
                                        }
                                    }}
                                    size="small"
                                    sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#0a3d62' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#0a3d62' } }}
                                />
                                <Typography variant="body2" fontWeight="medium">
                                    ENT
                                </Typography>
                            </Box>

                            {/* CTS Toggle - Only for employees */}
                            {(invoiceData?.employee_id || invoiceData?.member?.booking_type === 'employee') && (
                                <Box
                                    sx={{
                                        flex: 1,
                                        p: 1.5,
                                        border: '1px solid #e0e0e0',
                                        borderRadius: 1,
                                        backgroundColor: ctsEnabled ? '#f5f9fc' : 'transparent',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        minWidth: '150px',
                                    }}
                                >
                                    <Switch
                                        checked={ctsEnabled}
                                        onChange={(e) => {
                                            const checked = e.target.checked;
                                            setCtsEnabled(checked);
                                            if (checked) {
                                                setEntEnabled(false);
                                                setSelectedEntItems([]);
                                                setCtsAmount(getTotalPrice().toString());
                                            } else {
                                                setCtsAmount('0');
                                            }
                                        }}
                                        size="small"
                                        sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#0a3d62' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#0a3d62' } }}
                                    />
                                    <Typography variant="body2" fontWeight="medium">
                                        CTS
                                    </Typography>
                                </Box>
                            )}
                        </Box>}

                        {isEmployeeOrder && employeeCtsAllowed && employeeRemainingAfterAllowance > 0 && (
                            <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                                <Box
                                    sx={{
                                        flex: 1,
                                        p: 1.5,
                                        border: '1px solid #e0e0e0',
                                        borderRadius: 1,
                                        backgroundColor: ctsEnabled ? '#f5f9fc' : 'transparent',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        minWidth: '150px',
                                    }}
                                >
                                    <Switch
                                        checked={ctsEnabled}
                                        onChange={(e) => {
                                            const checked = e.target.checked;
                                            setCtsEnabled(checked);
                                            if (checked) {
                                                setCtsAmount(Math.round(employeeMaxCtsAmount).toString());
                                            } else {
                                                setCtsAmount('0');
                                            }
                                        }}
                                        size="small"
                                        sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#0a3d62' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#0a3d62' } }}
                                    />
                                    <Typography variant="body2" fontWeight="medium">
                                        CTS Deduction
                                    </Typography>
                                </Box>
                            </Box>
                        )}

                        {/* ENT Item Selection - Shows when enabled */}
                        {entEnabled && getOrderItems().length > 0 && (
                            <Box sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1, backgroundColor: '#f5f9fc' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Select Items for ENT:
                                    </Typography>
                                    <Typography variant="body2" color="success.main" fontWeight="bold">
                                        Rs {entAmount}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                    <input
                                        type="checkbox"
                                        checked={getOrderItems().length > 0 && selectedEntItems.length === getOrderItems().length}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedEntItems(getOrderItems().map((item, index) => getEntItemKey(item, index)));
                                            } else {
                                                setSelectedEntItems([]);
                                            }
                                        }}
                                        style={{ marginRight: 8 }}
                                    />
                                    <Typography variant="body2" fontWeight="medium">
                                        Select All
                                    </Typography>
                                </Box>
                                {getOrderItems().map((item, index) => (
                                    <Box key={getEntItemKey(item, index)} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 0.5 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <input
                                                type="checkbox"
                                                checked={selectedEntItems.includes(getEntItemKey(item, index))}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedEntItems([...selectedEntItems, getEntItemKey(item, index)]);
                                                    } else {
                                                        setSelectedEntItems(selectedEntItems.filter((id) => id !== getEntItemKey(item, index)));
                                                    }
                                                }}
                                                style={{ marginRight: 8 }}
                                            />
                                            <Typography variant="body2">
                                                {item.order_item?.name || item.order_item?.product?.name || item.name || 'Item'} (x{item.order_item?.quantity || item.quantity || 1})
                                            </Typography>
                                        </Box>
                                        <Typography variant="body2" fontWeight="medium">
                                            Rs {item.order_item?.total_price || (item.order_item?.quantity || item.quantity) * (item.order_item?.price || item.price)}
                                        </Typography>
                                    </Box>
                                ))}
                                <Select fullWidth value={entReason} onChange={(e) => setEntReason(e.target.value)} size="small" sx={{ mt: 2 }} displayEmpty>
                                    <MenuItem value="" disabled>
                                        Select ENT Reason
                                    </MenuItem>
                                    <MenuItem value="Marketing">Marketing</MenuItem>
                                    <MenuItem value="Director/CEO">Director/CEO</MenuItem>
                                    <MenuItem value="Club Guest">Club Guest</MenuItem>
                                    <MenuItem value="Rooms Guest">Rooms Guest</MenuItem>
                                    <MenuItem value="Others">Others</MenuItem>
                                    <MenuItem value="Discover Pakistan">Discover Pakistan</MenuItem>
                                    <MenuItem value="FnB Management">FnB Management</MenuItem>
                                    <MenuItem value="Front Office">Front Office</MenuItem>
                                    <MenuItem value="Front Vouchers">Front Vouchers</MenuItem>
                                    <MenuItem value="Labour ENT">Labour ENT</MenuItem>
                                    <MenuItem value="iTRIP ENT">iTRIP ENT</MenuItem>
                                    <MenuItem value="Food Complain">Food Complain</MenuItem>
                                </Select>
                                <TextField fullWidth label="ENT Comment" value={entComment} onChange={(e) => setEntComment(e.target.value)} size="small" multiline rows={2} sx={{ mt: 1 }} />
                            </Box>
                        )}

                        {/* CTS Amount Input - Shows when enabled */}
                        {ctsEnabled && (
                            <Box sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1, backgroundColor: '#f5f9fc' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        CTS Amount:
                                    </Typography>
                                    <Typography variant="body2" color="success.main" fontWeight="bold">
                                        Rs {getEffectiveCtsDeduction().toFixed(2)}
                                    </Typography>
                                </Box>
                                <WholeNumberInput
                                    value={ctsAmount}
                                    onChange={(val) => {
                                        const numeric = round2(val || 0);
                                        const capped = isEmployeeOrder ? Math.min(numeric, employeeMaxCtsAmount) : numeric;
                                        setCtsAmount(String(Math.round(capped)));
                                    }}
                                    sx={{ mb: 1 }}
                                />
                                <TextField fullWidth label="CTS Comment" value={ctsComment} onChange={(e) => setCtsComment(e.target.value)} size="small" multiline rows={2} sx={{ mt: 1 }} />
                            </Box>
                        )}

                        {/* Remaining Balance Display */}
                        {(entEnabled || ctsEnabled || isEmployeeOrder) && (
                            <Box sx={{ p: 2, backgroundColor: '#fff3e0', borderRadius: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="body1" fontWeight="medium">
                                    Remaining Balance to Pay:
                                </Typography>
                                <Typography variant="h6" fontWeight="bold" color="warning.main">
                                    Rs {getRemainingBalance().toFixed(2)}
                                </Typography>
                            </Box>
                        )}
                    </Box>

                    {/* Cash Payment Form */}
                    {activePaymentMethod === 'cash' && (
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <Typography variant="subtitle1" mb={1}>
                                    Input Amount
                                </Typography>
                                <WholeNumberInput value={inputAmount} onChange={handleQuickAmountClick} />

                                <Typography variant="subtitle1" mb={1} sx={{ mt: 2 }}>
                                    Payment Account
                                </Typography>
                                <Select fullWidth value={paymentAccountId} onChange={(e) => setPaymentAccountId(e.target.value)} sx={{ mb: 3 }}>
                                    <MenuItem value="">Select Payment Account</MenuItem>
                                    {paymentAccounts.map((account) => (
                                        <MenuItem key={account.id} value={account.id}>
                                            {account.name}
                                        </MenuItem>
                                    ))}
                                </Select>

                                <Typography variant="subtitle1" mb={1}>
                                    Customer Changes
                                </Typography>
                                <Box
                                    sx={{
                                        mb: 3,
                                        display: 'flex',
                                        alignItems: 'center',
                                    }}
                                >
                                    <Typography variant="h5" fontWeight="bold" color={Number.parseFloat(customerChanges) < 0 ? '#f44336' : '#333'}>
                                        Rs {customerChanges}
                                    </Typography>
                                </Box>

                            </Grid>
                        </Grid>
                    )}

                    {/* Bank Transfer Form */}
                    {activePaymentMethod === 'bank_transfer' && (
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <Typography variant="subtitle1" mb={1}>
                                    Payment Account
                                </Typography>
                                <Select fullWidth value={paymentAccountId} onChange={(e) => setPaymentAccountId(e.target.value)} sx={{ mb: 3 }}>
                                    <MenuItem value="">Select Payment Account</MenuItem>
                                    {paymentAccounts.map((account) => (
                                        <MenuItem key={account.id} value={account.id}>
                                            {account.name}
                                        </MenuItem>
                                    ))}
                                </Select>

                                <Typography variant="subtitle1" mb={2}>
                                    Choose Bank
                                </Typography>
                                <Box
                                    sx={{
                                        display: 'flex',
                                        gap: 1,
                                        mb: 3,
                                    }}
                                >
                                    <Button variant="outlined" onClick={() => handleBankSelection('mcb')} sx={selectedBank === 'mcb' ? styles.activeBankButton : styles.bankButton}>
                                        MCB Bank
                                    </Button>
                                    <Button variant="outlined" onClick={() => handleBankSelection('ubl')} sx={selectedBank === 'ubl' ? styles.activeBankButton : styles.bankButton}>
                                        UBL Bank
                                    </Button>
                                    <Button variant="outlined" onClick={() => handleBankSelection('hbl')} sx={selectedBank === 'hbl' ? styles.activeBankButton : styles.bankButton}>
                                        HBL Bank
                                    </Button>
                                </Box>

                                <Typography variant="subtitle1" mb={1}>
                                    Account Number
                                </Typography>
                                <TextField fullWidth placeholder="e.g. 222-29863902-2" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} sx={{ mb: 3 }} />

                                <Typography variant="subtitle1" mb={1}>
                                    Card Holder Name
                                </Typography>
                                <TextField fullWidth placeholder="e.g. Zahid Ullah" value={cardHolderName} onChange={(e) => setCardHolderName(e.target.value)} sx={{ mb: 3 }} />

                                <Typography variant="subtitle1" mb={1}>
                                    CVV Code
                                </Typography>
                                <TextField fullWidth placeholder="e.g. 234" value={cvvCode} onChange={(e) => setCvvCode(e.target.value)} sx={{ mb: 3 }} type="password" />
                            </Grid>
                        </Grid>
                    )}

                    {/* Credit Card Form */}
                    {/* Bank Transfer Form */}
                    {activePaymentMethod === 'credit_card' && (
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <Typography variant="subtitle1" mb={1}>
                                    Amount
                                </Typography>
                                <WholeNumberInput value={inputAmount} onChange={setInputAmount} />

                                <Typography variant="subtitle1" mb={1} sx={{ mt: 2 }}>
                                    Payment Account
                                </Typography>
                                <Select fullWidth value={paymentAccountId} onChange={(e) => setPaymentAccountId(e.target.value)} sx={{ mb: 3 }}>
                                    <MenuItem value="">Select Payment Account</MenuItem>
                                    {paymentAccounts.map((account) => (
                                        <MenuItem key={account.id} value={account.id}>
                                            {account.name}
                                        </MenuItem>
                                    ))}
                                </Select>

                                <Typography variant="subtitle1" mb={1}>
                                    Credit Card Type
                                </Typography>
                                <Select fullWidth value={creditCardType} onChange={(e) => setCreditCardType(e.target.value)} sx={{ mb: 3 }}>
                                    <MenuItem value="visa">Visa</MenuItem>
                                    <MenuItem value="mastercard">MasterCard</MenuItem>
                                </Select>

                                <Typography variant="subtitle1" mb={1}>
                                    Upload Receipt
                                </Typography>
                                <input type="file" accept="image/*,application/pdf" onChange={handleFileChange} />
                            </Grid>
                        </Grid>
                    )}

                    {/* Split Payment */}
                    {activePaymentMethod === 'split_payment' && (
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <Typography variant="subtitle1" mb={1}>
                                    Cash
                                </Typography>
                                <WholeNumberInput value={cashAmount} onChange={setCashAmount} />
                                <Select fullWidth value={splitPaymentAccountIds.cash} onChange={(e) => setSplitPaymentAccountIds((prev) => ({ ...prev, cash: e.target.value }))} sx={{ mb: 3, mt: 1 }}>
                                    <MenuItem value="">Select Cash Account</MenuItem>
                                    {splitPaymentAccounts.cash.map((account) => (
                                        <MenuItem key={account.id} value={account.id}>
                                            {account.name}
                                        </MenuItem>
                                    ))}
                                </Select>

                                <Typography variant="subtitle1" mb={1}>
                                    Credit Card
                                </Typography>
                                <WholeNumberInput value={creditCardAmount} onChange={setCreditCardAmount} />
                                <Select fullWidth value={splitPaymentAccountIds.credit_card} onChange={(e) => setSplitPaymentAccountIds((prev) => ({ ...prev, credit_card: e.target.value }))} sx={{ mb: 3, mt: 1 }}>
                                    <MenuItem value="">Select Card Account</MenuItem>
                                    {splitPaymentAccounts.credit_card.map((account) => (
                                        <MenuItem key={account.id} value={account.id}>
                                            {account.name}
                                        </MenuItem>
                                    ))}
                                </Select>

                                <Typography variant="subtitle1" mb={1}>
                                    Bank Transfer
                                </Typography>
                                <WholeNumberInput value={bankTransferAmount} onChange={setBankTransferAmount} />
                                <Select fullWidth value={splitPaymentAccountIds.bank} onChange={(e) => setSplitPaymentAccountIds((prev) => ({ ...prev, bank: e.target.value }))} sx={{ mb: 3, mt: 1 }}>
                                    <MenuItem value="">Select Bank Account</MenuItem>
                                    {splitPaymentAccounts.bank.map((account) => (
                                        <MenuItem key={account.id} value={account.id}>
                                            {account.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                                <Typography variant="subtitle1" mb={1}>
                                    Customer Changes
                                </Typography>
                                <Box
                                    sx={{
                                        mb: 3,
                                        display: 'flex',
                                        alignItems: 'center',
                                    }}
                                >
                                    <Typography variant="h5" fontWeight="bold" color={Number.parseInt(customerChanges, 10) < 0 ? '#f44336' : '#333'}>
                                        Rs {customerChanges}
                                    </Typography>
                                </Box>
                            </Grid>
                        </Grid>
                    )}

                    {/* Footer Buttons */}
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            py: 4,
                        }}
                    >
                        <Button
                            variant="outlined"
                            onClick={handleClosePayment}
                            sx={{
                                color: '#333',
                                borderColor: '#ddd',
                                textTransform: 'none',
                            }}
                        >
                            Cancel
                        </Button>
                        <Button variant="contained" endIcon={<ArrowForwardIcon />} onClick={mode === 'payment' ? handlePayNow : handleOrderAndPay} sx={styles.payNowButton} disabled={isLoading} loading={isLoading} loadingPosition="start">
                            {mode === 'payment' ? 'Pay Now' : 'Order & Pay'}
                        </Button>
                    </Box>
                </Box>
            </Box>
        </Dialog>
    );
};

export default PaymentNow;

// Custom CSS
const styles = {
    payNowButton: {
        backgroundColor: '#0a3d62',
        color: 'white',
        borderRadius: '4px',
        padding: '12px 24px',
        textTransform: 'none',
        '&:hover': {
            backgroundColor: '#083352',
        },
    },
    paymentMethodTab: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8px 10px',
        cursor: 'pointer',
        borderBottom: '2px solid transparent',
    },
    activePaymentMethodTab: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8px 10px',
        cursor: 'pointer',
        borderBottom: '2px solid #0a3d62',
        backgroundColor: '#e3f2fd',
    },
    bankButton: {
        borderRadius: '4px',
        border: '1px solid #e0e0e0',
        backgroundColor: 'white',
        color: '#333',
        padding: '8px 16px',
        margin: '4px',
        textTransform: 'none',
        '&:hover': {
            backgroundColor: '#f5f5f5',
        },
    },
    activeBankButton: {
        borderRadius: '4px',
        border: '1px solid #0a3d62',
        backgroundColor: '#e3f2fd',
        color: '#0a3d62',
        padding: '8px 16px',
        margin: '4px',
        textTransform: 'none',
    },
};

function WholeNumberInput({ label, value, onChange, sx = {} }) {
    const handleChange = (e) => {
        const val = e.target.value;
        if (/^\d*$/.test(val)) {
            onChange(val);
        }
    };

    return (
        <TextField
            fullWidth
            type="number"
            label={label}
            value={value}
            onChange={handleChange}
            onKeyDown={(e) => {
                if (e.key === '.' || e.key === ',' || e.key === 'e') {
                    e.preventDefault();
                }
            }}
            inputProps={{
                inputMode: 'numeric',
                pattern: '[0-9]*',
                min: '0',
                step: '1',
            }}
            InputProps={{
                startAdornment: <InputAdornment position="start">Rs</InputAdornment>,
            }}
            sx={{ mb: 3, ...sx }}
        />
    );
}
