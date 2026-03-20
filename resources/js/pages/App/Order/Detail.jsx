import { useOrderStore } from '@/stores/useOrderStore';
import { router } from '@inertiajs/react';
import { routeNameForContext } from '@/lib/utils';
import { Close as CloseIcon, Edit as EditIcon, Print as PrintIcon, Save as SaveIcon } from '@mui/icons-material';
import { Avatar, Box, Button, Chip, Divider, Grid, IconButton, TextField, Dialog, Paper, Typography, MenuItem, DialogContent, DialogTitle, Autocomplete, InputAdornment, Switch } from '@mui/material';
import { enqueueSnackbar } from 'notistack';
import { useEffect, useState } from 'react';
import ClearIcon from '@mui/icons-material/Clear';
import axios from 'axios';
import DescriptionIcon from '@mui/icons-material/Description';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import PaymentNow from '@/components/App/Invoice/PaymentNow';
import { objectToFormData } from '@/helpers/objectToFormData';

import CancelItemDialog from './Management/CancelItemDialog';

const OrderDetail = ({ handleEditItem, is_new_order }) => {
    const { orderDetails, handleOrderDetailChange, clearOrderItems } = useOrderStore();

    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
    const [itemToCancel, setItemToCancel] = useState(null);
    const [cancelIndex, setCancelIndex] = useState(null);

    const [editingDiscountIndex, setEditingDiscountIndex] = useState(null);
    const [itemDiscountForm, setItemDiscountForm] = useState({ value: '', type: 'percentage' });
    const [openDiscountModal, setOpenDiscountModal] = useState(false);

    const [editingQtyIndex, setEditingQtyIndex] = useState(null);
    const [tempQty, setTempQty] = useState(null);
    const [setting, setSetting] = useState(null);
    const [loadingSetting, setLoadingSetting] = useState(true);
    const [isEditingTax, setIsEditingTax] = useState(false);
    const [tempTax, setTempTax] = useState('');
    const [isEditingServiceCharge, setIsEditingServiceCharge] = useState(false);
    const [serviceChargeRate, setServiceChargeRate] = useState('0');
    const [isBankChargesEnabled, setIsBankChargesEnabled] = useState(false);
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [waiters, setWaiters] = useState([]);
    const [notes, setNotes] = useState({
        kitchen_note: '',
        staff_note: '',
        payment_note: '',
    });

    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [openPaymentModal, setOpenPaymentModal] = useState(false);
    const [collectiveDiscountPct, setCollectiveDiscountPct] = useState('');

    const handleOpenPopup = () => setIsPopupOpen(true);
    const handleClosePopup = () => setIsPopupOpen(false);

    const handleOpenPayment = () => {
        setOpenPaymentModal(true);
    };

    const handleSuccessPayment = () => {
        setOpenPaymentModal(false);
    };

    const handleClosePayment = () => {
        setOpenPaymentModal(false);
    };

    const handleInputChange = (e) => {
        // No global discount form data needed anymore
    };

    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    const handleNoteChange = (e) => {
        setNotes({
            ...notes,
            [e.target.name]: e.target.value,
        });
    };

    useEffect(() => {
        axios
            .get(route(routeNameForContext('setting.showTax')))
            .then((response) => {
                setSetting(response.data);
                setTempTax(response.data.tax?.toString() || '0');

                // Use saved service charge if available, otherwise default
                const savedServicePct = orderDetails.service_charges_percentage;
                const defaultServicePct = response.data.service_charges_percentage?.toString() || '0';
                setServiceChargeRate(savedServicePct !== undefined ? savedServicePct.toString() : defaultServicePct);

                // Initialize Bank Charges toggle based on saved order or default to false
                const hasBankCharges = Number(orderDetails.bank_charges) > 0;
                setIsBankChargesEnabled(hasBankCharges);

                setLoadingSetting(false);
            })
            .catch((error) => {
                console.error('Failed to load setting:', error);
                enqueueSnackbar('Failed to load tax settings. Please try again.', { variant: 'error' });
                setLoadingSetting(false);
            });
    }, []);

    const handleOpenItemDiscount = (index, item) => {
        setEditingDiscountIndex(index);
        setItemDiscountForm({
            value: item.discount_value || '',
            type: item.discount_type || 'percentage',
        });
        setOpenDiscountModal(true);
    };

    const handleAutocompleteChange = (event, value, field) => {
        handleOrderDetailChange(field, value);
    };

    // Calculate totals based on item discounts
    const subtotal = Math.round(orderDetails.order_items.reduce((total, item) => total + item.total_price, 0));

    // Sum of all item discounts
    const discountAmount = orderDetails.order_items.reduce((total, item) => total + (item.discount_amount || 0), 0);

    // Subtotal after discount
    const discountedSubtotal = subtotal - discountAmount;

    // Now apply tax on the discounted amount
    const taxRate = setting?.tax ? setting.tax / 100 : 0;

    // Calculate tax per item (round per item)
    const taxAmount = orderDetails.order_items.reduce((acc, item) => {
        if (item.is_taxable) {
            // Only apply if item is taxable
            const itemTotal = item.total_price - (item.discount_amount || 0);
            return acc + Math.round(itemTotal * taxRate);
        }
        return acc;
    }, 0);

    // Service Charges
    const serviceChargePct = parseFloat(serviceChargeRate) || 0;
    const serviceCharges = Math.round(discountedSubtotal * (serviceChargePct / 100));

    // Bank Charges
    const bankChargeBase = discountedSubtotal + taxAmount + serviceCharges;
    let bankCharges = 0;
    if (isBankChargesEnabled && setting?.bank_charges_value > 0) {
        if (setting.bank_charges_type === 'percentage') {
            bankCharges = Math.round(bankChargeBase * (setting.bank_charges_value / 100));
        } else {
            bankCharges = Math.round(setting.bank_charges_value);
        }
    }

    // Final total
    const total = Math.round(discountedSubtotal + taxAmount + serviceCharges + bankCharges);
    const advanceAmount = Number(orderDetails.advance_amount || 0);
    const payableTotal = Math.max(0, total - advanceAmount);

    const handleSendToKitchen = async (extra = {}) => {
        setIsLoading(true);

        const collectivePct = collectiveDiscountPct === '' ? null : Number(collectiveDiscountPct);

        const newPayload = {
            ...orderDetails,
            ...extra, // include waiter + time if passed
            price: subtotal,
            tax: taxRate,
            service_charges: serviceCharges,
            service_charges_percentage: serviceChargePct,
            bank_charges: bankCharges,
            bank_charges_percentage: isBankChargesEnabled && setting?.bank_charges_type === 'percentage' ? setting.bank_charges_value : 0,
            discount_type: 'amount', // global discount is now just the sum amount
            discount_value: discountAmount,
            discount: discountAmount,
            total_price: total,
            kitchen_note: notes.kitchen_note,
            staff_note: notes.staff_note,
            payment_note: notes.payment_note,
            is_new_order: is_new_order,
            collective_discount_percent: Number.isFinite(collectivePct) && collectivePct > 0 ? collectivePct : undefined,
        };

        const payload = objectToFormData(newPayload);

        await axios
            .post(route(routeNameForContext('order.send-to-kitchen')), payload)
            .then((res) => {
                console.log('Server response:', res.data);
                const hasPrintFailures = Array.isArray(res.data?.print_failures) && res.data.print_failures.length > 0;
                enqueueSnackbar(res.data?.message || 'Your order has been successfully sent to the kitchen!', { variant: hasPrintFailures ? 'warning' : 'success' });
                router.visit(route(routeNameForContext('order.new')));
            })
            .catch((error) => {
                console.log(error);
                if (error.response) {
                    if (error.response.status === 422) {
                        const errors = error.response.data.errors;
                        const errorMessage = Object.values(errors).flat().join(', ');
                        enqueueSnackbar(`Validation failed: ${errorMessage}`, { variant: 'error' });
                    } else {
                        enqueueSnackbar(error.response.data?.message || 'Something went wrong on server.', { variant: 'error' });
                    }
                } else {
                    enqueueSnackbar('Network error. Please try again.', { variant: 'error' });
                }
            })
            .finally(() => {
                setIsLoading(false);
            });
    };

    function formatTime(timeStr) {
        if (!timeStr) return '';
        const [hour, minute] = timeStr.split(':');
        const date = new Date();
        date.setHours(parseInt(hour), parseInt(minute));

        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    }

    const handleServiceChargeEditClick = () => {
        setIsEditingServiceCharge(true);
    };

    const handleServiceChargeChange = (e) => {
        const value = e.target.value;
        if (/^\d*\.?\d*$/.test(value)) {
            setServiceChargeRate(value);
        }
    };

    const handleSaveServiceCharge = () => {
        setIsEditingServiceCharge(false);
    };

    const handleTaxEditClick = () => {
        setIsEditingTax(true);
        setTempTax(setting?.tax?.toString() || '0');
    };

    const handleTaxChange = (e) => {
        const value = e.target.value;
        if (/^\d*\.?\d*$/.test(value)) {
            setTempTax(value);
        }
    };

    const handleSaveTax = () => {
        const newTax = parseFloat(tempTax);
        if (!isNaN(newTax) && newTax >= 0 && newTax <= 100) {
            setSetting({ ...setting, tax: newTax });
        } else {
            enqueueSnackbar('Tax must be a number between 0 and 100.', { variant: 'error' });
        }
        setIsEditingTax(false);
    };

    const handleApplyCollectiveDiscount = () => {
        const raw = collectiveDiscountPct === '' ? NaN : Number(collectiveDiscountPct);
        if (!Number.isFinite(raw) || raw < 0 || raw > 100) {
            enqueueSnackbar('Collective discount must be a number between 0 and 100.', { variant: 'error' });
            return;
        }

        const updatedItems = orderDetails.order_items.map((item) => {
            if (!item.is_discountable) return item;

            const grossTotal = Number(item.total_price || 0);
            if (grossTotal <= 0) {
                return {
                    ...item,
                    discount_value: 0,
                    discount_type: 'percentage',
                    discount_amount: 0,
                };
            }

            let effectivePct = raw;
            const maxDisc = item.max_discount != null ? Number(item.max_discount) : null;
            const maxDiscType = item.max_discount_type || 'percentage';

            if (Number.isFinite(maxDisc) && maxDisc > 0) {
                if (maxDiscType === 'percentage') {
                    effectivePct = Math.min(effectivePct, maxDisc);
                } else {
                    const qty = Number(item.quantity || 1);
                    const maxAmount = maxDisc * (qty > 0 ? qty : 1);
                    const maxPctEquivalent = (maxAmount / grossTotal) * 100;
                    effectivePct = Math.min(effectivePct, maxPctEquivalent);
                }
            }

            const safePct = Number.isFinite(effectivePct) ? Math.round(effectivePct * 100) / 100 : 0;
            let disc = Math.round(grossTotal * (safePct / 100));
            if (disc > grossTotal) disc = grossTotal;

            return {
                ...item,
                discount_value: safePct,
                discount_type: 'percentage',
                discount_amount: disc,
            };
        });

        handleOrderDetailChange('order_items', updatedItems);
    };

    const handleClearOrderItems = () => {
        clearOrderItems();
        setCollectiveDiscountPct('');
        setNotes({ kitchen_note: '', staff_note: '', payment_note: '' });
    };

    const handleApplyItemDiscount = () => {
        if (editingDiscountIndex === null) return;

        const updatedItems = [...orderDetails.order_items];
        const item = updatedItems[editingDiscountIndex];

        const val = Number(itemDiscountForm.value || 0);
        const type = itemDiscountForm.type;

        // Check for max discount limit
        if (item.max_discount != null && parseFloat(item.max_discount) > 0) {
            const maxDisc = parseFloat(item.max_discount);
            const maxDiscType = item.max_discount_type || 'percentage';

            let exceedsLimit = false;

            if (maxDiscType === 'percentage') {
                if (type === 'percentage') {
                    if (val > maxDisc) exceedsLimit = true;
                } else {
                    // type is amount, check if amount is > maxDisc% of price
                    const equivalentPercent = (val / item.price) * 100;
                    if (equivalentPercent > maxDisc) exceedsLimit = true;
                }
            } else {
                // maxDiscType is amount (Fixed Amount per unit)
                if (type === 'amount') {
                    if (val > maxDisc) exceedsLimit = true;
                } else {
                    // type is percentage, check if calculated amount > maxDisc
                    const calculatedAmount = (val / 100) * item.price;
                    if (calculatedAmount > maxDisc) exceedsLimit = true;
                }
            }

            if (exceedsLimit) {
                enqueueSnackbar(`Maximum discount allowed is ${maxDisc}${maxDiscType === 'percentage' ? '%' : ' Rs'}`, { variant: 'error' });
                return;
            }
        }

        // Update item with new discount settings
        item.discount_value = val;
        item.discount_type = type;

        // Recalculate discount amount
        const grossTotal = item.total_price;
        let discountAmount = 0;

        if (type === 'percentage') {
            discountAmount = Math.round(grossTotal * (val / 100));
        } else {
            // Fixed amount is per unit, so multiply by qty
            discountAmount = Math.round(val * item.quantity);
        }

        // Cap discount at gross total
        if (discountAmount > grossTotal) discountAmount = grossTotal;

        item.discount_amount = discountAmount;

        handleOrderDetailChange('order_items', updatedItems);
        setOpenDiscountModal(false);
        setEditingDiscountIndex(null);
    };

    const handleOpenCancelDialog = (item, index, e) => {
        e.stopPropagation();

        // If item is saved (from DB) for a reservation, require cancellation reason.
        if (orderDetails.reservation_id && item.is_saved) {
            setItemToCancel({ order_item: item });
            setCancelIndex(index);
            setCancelDialogOpen(true);
        } else {
            // New item, just remove it directly
            const updatedItems = [...orderDetails.order_items];
            updatedItems.splice(index, 1);
            handleOrderDetailChange('order_items', updatedItems);
        }
    };

    const handleConfirmCancel = (cancelData) => {
        const item = orderDetails.order_items[cancelIndex];
        const updatedItems = [...orderDetails.order_items];

        // Remove from active list
        updatedItems.splice(cancelIndex, 1);
        handleOrderDetailChange('order_items', updatedItems);

        // If it's a reservation order, track as "cancelled" to send to backend
        if (orderDetails.reservation_id) {
            const cancelledItem = {
                ...item,
                quantity: cancelData.quantity, // actually we removed full item, so full qty
                // If partial cancel supported, logic is complex. Dialog supports qty input.
                // For now assume full removal of the line item if quantity matches.
                // If quantity < item.quantity, we should split item?
                // Let's assume full line cancellation for simplicity first or handle split.
            };

            // If cancel qty < item qty, we should keep the remaining in updatedItems!
            if (cancelData.quantity < item.quantity) {
                // Add back remaining
                const remaining = { ...item, quantity: item.quantity - cancelData.quantity };
                remaining.total_price = remaining.quantity * remaining.price; // simplified recalc
                updatedItems.splice(cancelIndex, 0, remaining); // put back at index
                handleOrderDetailChange('order_items', updatedItems);
            }

            const cancelledRecord = {
                ...item,
                quantity: cancelData.quantity,
                remark: cancelData.remark,
                instructions: cancelData.instructions,
                cancelType: cancelData.cancelType,
                status: 'cancelled',
            };

            const currentCancelled = orderDetails.cancelled_items || [];
            handleOrderDetailChange('cancelled_items', [...currentCancelled, cancelledRecord]);
        }

        setCancelDialogOpen(false);
        setItemToCancel(null);
        setCancelIndex(null);
    };

    useEffect(() => {
        if (!openDiscountModal) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleApplyItemDiscount();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [openDiscountModal, itemDiscountForm, editingDiscountIndex]);

    // Keyboard shortcuts - updated
    useEffect(() => {
        const handleKeyDown = (e) => {
            const tag = document.activeElement.tagName.toLowerCase();
            if (tag === 'input' || tag === 'textarea') return;

            const key = e.key.toLowerCase();

            if (e.ctrlKey && !e.shiftKey) {
                switch (key) {
                    case 'e':
                        e.preventDefault();
                        handleTaxEditClick();
                        break;
                    case 'k':
                        if (orderDetails.order_items.length > 0 && orderDetails.member) {
                            e.preventDefault();
                            handleSendToKitchen();
                        }
                        break;
                    case 'l':
                        e.preventDefault();
                        handleClearOrderItems();
                        break;
                    default:
                        break;
                }
            }

            if (e.shiftKey && key === 'n') {
                e.preventDefault();
                handleOpen(); // open note/description dialog
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleTaxEditClick, handleSendToKitchen, handleClearOrderItems, handleOpen, orderDetails]);

    useEffect(() => {
        axios.get(route(routeNameForContext('waiters.all'))).then((res) => setWaiters(res.data.waiters));
    }, []);

    return (
        <>
            <Box sx={{ display: 'flex', justifyContent: 'center', minHeight: '80vh' }}>
                <Paper elevation={0} sx={{ width: '100%', maxWidth: 500, borderRadius: 1, overflow: 'hidden' }}>
                    {/* Header */}
                    {orderDetails.member && (
                        <Box sx={{ border: '1px solid #E3E3E3', p: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">
                                        Member
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                                        <Avatar sx={{ width: 24, height: 24, bgcolor: '#e0e0e0', fontSize: 12, mr: 1 }}>{orderDetails.member.name?.charAt(0) || 'Q'}</Avatar>
                                        <Typography variant="body2" fontWeight="medium">
                                            {orderDetails.member.name}
                                        </Typography>
                                    </Box>
                                </Box>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    {orderDetails.table && <Avatar sx={{ width: 28, height: 28, bgcolor: '#0C67AA', fontSize: 12 }}>{orderDetails.table?.table_no}</Avatar>}
                                    {orderDetails.room && <Avatar sx={{ width: 'auto', height: 28, bgcolor: '#0C67AA', fontSize: 12, px: 1 }}>Room {orderDetails.room.name}</Avatar>}
                                    <Box
                                        sx={{
                                            height: 30,
                                            width: 30,
                                            borderRadius: '50%',
                                            bgcolor: '#E3E3E3',
                                        }}
                                    >
                                        <img src="/assets/food-tray.png" alt="" style={{ width: 20, height: 20, marginLeft: 4 }} />
                                    </Box>
                                    <IconButton size="small" sx={{ width: 28, height: 28, bgcolor: '#f5f5f5' }}>
                                        <ClearIcon fontSize="small" />
                                    </IconButton>
                                </Box>
                            </Box>

                            <Grid container sx={{ border: '1px solid transparent' }}>
                                <Grid item xs={4} sx={{ pr: 2, borderRight: '1px solid #e0e0e0' }}>
                                    <Typography sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '12px' }}>Order Date</Typography>
                                    <Typography variant="body2" fontWeight="medium" sx={{ mt: 1 }}>
                                        {new Intl.DateTimeFormat('en-US', {
                                            day: '2-digit',
                                            month: 'short',
                                            year: 'numeric',
                                        }).format(new Date(orderDetails.date))}
                                    </Typography>
                                </Grid>

                                <Grid item xs={4} sx={{ px: 1, borderRight: '1px solid #e0e0e0' }}>
                                    <Typography sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '12px' }}>Waiter</Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                        {/* <Avatar sx={{ width: 20, height: 20, mr: 1, fontSize: 10 }}>{orderDetails.waiter?.name?.charAt(0) || 'N'}</Avatar> */}
                                        <Typography variant="body2" fontWeight="medium">
                                            {orderDetails.waiter?.name || 'N/A'}
                                        </Typography>
                                    </Box>
                                </Grid>

                                <Grid item xs={4} sx={{ px: 1, mt: -0.5 }}>
                                    <Typography variant="caption" color="text.secondary">
                                        Order Time
                                    </Typography>
                                    <Typography variant="body2" fontWeight="medium">
                                        {formatTime(orderDetails.time)}
                                    </Typography>
                                </Grid>
                            </Grid>
                            <Box sx={{ mt: 2 }}>
                                <Chip
                                    label={
                                        <span>
                                            <span style={{ color: '#7F7F7F' }}>Order Id: </span>
                                            <span style={{ color: '#000' }}>#{orderDetails.order_no}</span>
                                        </span>
                                    }
                                    size="small"
                                    sx={{
                                        bgcolor: '#E3E3E3',
                                        height: '24px',
                                        fontSize: '0.75rem',
                                        borderRadius: '4px',
                                    }}
                                />
                            </Box>
                        </Box>
                    )}
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'end',
                            alignItems: 'center',
                            p: 1,
                            borderBottom: '1px solid #E3E3E3',
                        }}
                    >
                        <Button
                            size="small"
                            onClick={handleClearOrderItems}
                            sx={{
                                textTransform: 'none',
                                color: '#0c3b5c',
                                display: 'flex',
                                alignItems: 'center',
                                padding: 0,
                                minWidth: 0,
                                marginRight: 0,
                            }}
                        >
                            <HighlightOffIcon sx={{ fontSize: 24 }} />
                        </Button>
                        <Button
                            size="small"
                            onClick={handleOpen}
                            sx={{
                                textTransform: 'none',
                                color: '#0c3b5c',
                                display: 'flex',
                                alignItems: 'center',
                                padding: 0,
                                minWidth: 0,
                                marginLeft: 2,
                            }}
                        >
                            <DescriptionIcon sx={{ fontSize: 24 }} />
                        </Button>
                    </Box>

                    {/* Order Items */}
                    <Box sx={{ mt: 1, p: 1 }}>
                        {orderDetails.order_items.length > 0 &&
                            orderDetails.order_items.map((item, index) => {
                                const isEditing = editingQtyIndex === index;

                                const handleQtyClick = (e) => {
                                    e.stopPropagation();
                                    setEditingQtyIndex(index);
                                    setTempQty(item.quantity.toString());
                                };

                                const handleQtyChange = (e) => {
                                    const value = e.target.value;
                                    if (/^\d*$/.test(value)) {
                                        setTempQty(value);
                                    }
                                };

                                const handleQtyBlur = () => {
                                    const newQty = Number(tempQty);
                                    if (newQty > 0 && newQty !== item.quantity) {
                                        const updatedItems = [...orderDetails.order_items];
                                        updatedItems[index].quantity = newQty;
                                        updatedItems[index].total_price = newQty * updatedItems[index].price;

                                        // Recalculate discount if exists
                                        if (updatedItems[index].discount_value > 0) {
                                            const gross = updatedItems[index].total_price;
                                            let disc = 0;
                                            if (updatedItems[index].discount_type === 'percentage') {
                                                disc = Math.round(gross * (updatedItems[index].discount_value / 100));
                                            } else {
                                                disc = Math.round(updatedItems[index].discount_value * newQty);
                                            }
                                            if (disc > gross) disc = gross;
                                            updatedItems[index].discount_amount = disc;
                                        }

                                        handleOrderDetailChange('order_items', updatedItems);
                                    }
                                    setEditingQtyIndex(null);
                                    setTempQty('');
                                };
                                return (
                                    <Box
                                        key={index}
                                        onClick={() => handleEditItem(item, index)}
                                        sx={{
                                            mb: 2,
                                            borderBottom: '1px solid #E3E3E3',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', mb: 1 }}>
                                            <Avatar src={item.image} variant="rounded" sx={{ width: 36, height: 36, mr: 1.5, bgcolor: '#f8c291' }} />
                                            <Box sx={{ flexGrow: 1 }}>
                                                <Typography variant="body2" fontWeight="medium">
                                                    {item.name}
                                                </Typography>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {item.category}
                                                    </Typography>
                                                    {item.is_discountable && (
                                                        <Chip
                                                            label={item.discount_value > 0 ? `-${item.discount_type === 'percentage' ? item.discount_value + '%' : 'Rs ' + item.discount_value}` : 'Add Disc.'}
                                                            size="small"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleOpenItemDiscount(index, item);
                                                            }}
                                                            sx={{
                                                                height: '18px',
                                                                fontSize: '0.65rem',
                                                                bgcolor: item.discount_value > 0 ? '#ffebee' : '#f5f5f5',
                                                                color: item.discount_value > 0 ? '#c62828' : '#757575',
                                                                cursor: 'pointer',
                                                                '&:hover': { bgcolor: '#e0e0e0' },
                                                            }}
                                                        />
                                                    )}
                                                </Box>
                                            </Box>
                                            <Box sx={{ textAlign: 'right' }}>
                                                <Typography variant="caption" color="text.secondary" onClick={handleQtyClick}>
                                                    Qty :{' '}
                                                    {isEditing ? (
                                                        <input
                                                            type="text"
                                                            value={tempQty}
                                                            onChange={handleQtyChange}
                                                            onBlur={handleQtyBlur}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    handleQtyBlur();
                                                                }
                                                            }}
                                                            autoFocus
                                                            style={{
                                                                width: '40px',
                                                                fontSize: '0.8rem',
                                                                textAlign: 'center',
                                                                marginLeft: '4px',
                                                                border: '1px solid #ccc',
                                                                borderRadius: '4px',
                                                                padding: '2px 4px',
                                                            }}
                                                        />
                                                    ) : (
                                                        item.quantity
                                                    )}{' '}
                                                    x Rs {item.price}
                                                </Typography>
                                                <Typography variant="body2" fontWeight="medium">
                                                    Rs. {(item.total_price - (item.discount_amount || 0)).toFixed(2)}
                                                </Typography>
                                                {item.discount_amount > 0 && (
                                                    <Typography variant="caption" sx={{ color: '#ef5350', display: 'block' }}>
                                                        (Saved Rs {item.discount_amount})
                                                    </Typography>
                                                )}
                                            </Box>
                                            <IconButton size="small" color="error" onClick={(e) => handleOpenCancelDialog(item, index, e)} sx={{ mt: 1 }}>
                                                <HighlightOffIcon fontSize="small" />
                                            </IconButton>
                                        </Box>
                                        {item.variants.length > 0 &&
                                            item.variants.map((variant, variantIndex) => (
                                                <Button
                                                    key={variantIndex}
                                                    sx={{
                                                        border: '1px solid #e0e0e0 !important',
                                                        borderRadius: '4px !important',
                                                        mb: 2,
                                                        mx: 0.5,
                                                        minWidth: '2px',
                                                        fontSize: '0.7rem',
                                                        py: 0.5,
                                                        px: 1.5,
                                                        color: '#555',
                                                    }}
                                                >
                                                    {variant.value}
                                                </Button>
                                            ))}
                                    </Box>
                                );
                            })}
                    </Box>

                    {/* Order Summary */}
                    <Box sx={{ px: 1, py: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                                Subtotal
                            </Typography>
                            <Typography variant="body2">Rs {subtotal.toFixed(2)}</Typography>
                        </Box>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, alignItems: 'center' }}>
                            <Typography variant="body2" color="text.secondary">
                                Discount
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2" color="#4caf50">
                                    Rs {discountAmount}
                                </Typography>
                                <TextField
                                    size="small"
                                    value={collectiveDiscountPct}
                                    onChange={(e) => setCollectiveDiscountPct(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleApplyCollectiveDiscount();
                                        }
                                    }}
                                    placeholder="0"
                                    sx={{ width: '90px' }}
                                    inputProps={{ inputMode: 'decimal', min: 0, max: 100 }}
                                    InputProps={{
                                        endAdornment: <InputAdornment position="end">%</InputAdornment>,
                                    }}
                                />
                                <Button
                                    variant="contained"
                                    size="small"
                                    onClick={handleApplyCollectiveDiscount}
                                    disabled={orderDetails.order_items.length === 0}
                                    sx={{ textTransform: 'none' }}
                                >
                                    Apply
                                </Button>
                            </Box>
                        </Box>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, alignItems: 'center' }}>
                            {isEditingTax ? (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <TextField
                                        size="small"
                                        value={tempTax}
                                        onChange={handleTaxChange}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                handleSaveTax();
                                            }
                                        }}
                                        autoFocus
                                        sx={{ width: '80px' }}
                                        inputProps={{ style: { textAlign: 'center' } }}
                                    />
                                    <IconButton size="small" onClick={handleSaveTax}>
                                        <SaveIcon fontSize="small" />
                                    </IconButton>
                                </Box>
                            ) : (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Tax {setting?.tax || 0}%
                                    </Typography>
                                    <IconButton size="small" onClick={handleTaxEditClick}>
                                        <EditIcon fontSize="small" />
                                    </IconButton>
                                </Box>
                            )}
                            <Typography variant="body2">Rs {taxAmount.toFixed(2)}</Typography>
                        </Box>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, alignItems: 'center' }}>
                            <Typography variant="body2" color="text.secondary">
                                Service Charges
                            </Typography>
                            {isEditingServiceCharge ? (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <TextField
                                        size="small"
                                        value={serviceChargeRate}
                                        onChange={handleServiceChargeChange}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                handleSaveServiceCharge();
                                            }
                                        }}
                                        autoFocus
                                        sx={{ width: '80px' }}
                                        inputProps={{ style: { textAlign: 'center' } }}
                                    />
                                    <IconButton size="small" onClick={handleSaveServiceCharge}>
                                        <SaveIcon fontSize="small" />
                                    </IconButton>
                                </Box>
                            ) : (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        {serviceChargeRate}%
                                    </Typography>
                                    <IconButton size="small" onClick={handleServiceChargeEditClick}>
                                        <EditIcon fontSize="small" />
                                    </IconButton>
                                </Box>
                            )}
                            <Typography variant="body2">Rs {serviceCharges.toFixed(2)}</Typography>
                        </Box>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, alignItems: 'center' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2" color="text.secondary">
                                    Bank Charges
                                </Typography>
                                <Switch size="small" checked={isBankChargesEnabled} onChange={(e) => setIsBankChargesEnabled(e.target.checked)} />
                            </Box>
                            <Typography variant="body2">Rs {bankCharges.toFixed(2)}</Typography>
                        </Box>

                        <Divider sx={{ my: 1 }} />
                        {orderDetails.advance_amount > 0 && (
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="body2" color="primary">
                                    Advance
                                </Typography>
                                <Typography variant="body2" color="primary">
                                    - Rs {advanceAmount.toFixed(2)}
                                </Typography>
                            </Box>
                        )}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="subtitle2">Total</Typography>
                            <Typography variant="subtitle2">Rs {payableTotal.toFixed(2)}</Typography>
                        </Box>
                        <Divider sx={{ my: 2 }} />
                    </Box>
                </Paper>

                <Dialog
                    open={openDiscountModal}
                    onClose={() => setOpenDiscountModal(false)}
                    fullWidth
                    maxWidth="sm"
                    PaperProps={{
                        style: {
                            position: 'absolute',
                            m: 0,
                            width: '600px',
                            borderRadius: 2,
                            p: 2,
                        },
                    }}
                >
                    <Box sx={{ padding: 3 }}>
                        <Typography variant="h5" sx={{ fontWeight: 500, color: '#063455', fontSize: '30px', mb: 3 }}>
                            Apply Item Discount
                        </Typography>

                        <Box mb={2}>
                            <Typography variant="body1" sx={{ mb: 1, fontSize: '14px', fontWeight: 500 }}>
                                Discount Rate
                            </Typography>
                            <TextField fullWidth name="value" type="number" value={itemDiscountForm.value} onChange={(e) => setItemDiscountForm((prev) => ({ ...prev, value: e.target.value }))} placeholder={itemDiscountForm.type === 'percentage' ? 'Enter % discount' : 'Enter amount in Rs (per unit)'} size="small" />
                        </Box>

                        <Box mb={3}>
                            <Typography variant="body1" sx={{ mb: 1, fontSize: '14px', fontWeight: 500 }}>
                                Discount Method
                            </Typography>
                            <TextField select fullWidth name="type" value={itemDiscountForm.type} onChange={(e) => setItemDiscountForm((prev) => ({ ...prev, type: e.target.value }))} size="small">
                                <MenuItem key="percentage" value="percentage">
                                    Percentage (%)
                                </MenuItem>
                                <MenuItem key="amount" value="amount">
                                    Fixed Amount (Rs per unit)
                                </MenuItem>
                            </TextField>
                        </Box>

                        <Box display="flex" justifyContent="flex-end">
                            <Button
                                variant="contained"
                                onClick={() => setOpenDiscountModal(false)}
                                sx={{
                                    backgroundColor: '#F14C35',
                                    color: '#FFFFFF',
                                    textTransform: 'none',
                                    fontSize: '14px',
                                    mr: 1,
                                    '&:hover': { backgroundColor: '#d8432f' },
                                }}
                            >
                                Cancel
                            </Button>

                            <Button
                                variant="contained"
                                onClick={handleApplyItemDiscount}
                                sx={{
                                    backgroundColor: '#063455',
                                    color: '#FFFFFF',
                                    textTransform: 'none',
                                    fontSize: '14px',
                                    px: 3,
                                    '&:hover': { backgroundColor: '#002244' },
                                }}
                            >
                                Apply
                            </Button>
                        </Box>
                    </Box>
                </Dialog>

                {/* Notes Popup Modal */}
                <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
                    <DialogContent sx={{ position: 'relative' }}>
                        {/* Close Icon */}
                        <IconButton
                            onClick={handleClose}
                            sx={{
                                position: 'absolute',
                                top: 8,
                                right: 8,
                                color: '#888',
                                zIndex: 1,
                            }}
                        >
                            <CloseIcon />
                        </IconButton>

                        {/* Note Fields */}
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#0c3b5c' }}>
                                    Kitchen Note
                                </Typography>
                                <TextField fullWidth multiline minRows={6} name="kitchen_note" placeholder="Instructions to chef will be displayed in kitchen along order details" value={notes.kitchen_note} onChange={handleNoteChange} />
                            </Box>
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#0c3b5c' }}>
                                    Staff Note
                                </Typography>
                                <TextField fullWidth multiline minRows={6} name="staff_note" placeholder="Staff note for internal use" value={notes.staff_note} onChange={handleNoteChange} />
                            </Box>
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#0c3b5c' }}>
                                    Payment Note
                                </Typography>
                                <TextField fullWidth multiline minRows={6} name="payment_note" placeholder="Payment note for internal use" value={notes.payment_note} onChange={handleNoteChange} />
                            </Box>
                        </Box>
                    </DialogContent>
                </Dialog>
            </Box>
            {/* Action Buttons */}
            <Box sx={{ mt: 1, position: 'sticky', bottom: 16, display: 'flex', gap: 1, px: 1, bgcolor: '#fff' }}>
                {/* <Button
                    variant="outlined"
                    sx={{
                        flex: 1,
                        borderColor: '#e0e0e0',
                        color: '#555',
                        textTransform: 'none',
                    }}
                >
                    Close
                </Button> */}
                <Button
                    variant="outlined"
                    disabled={orderDetails.order_items.length === 0 || !orderDetails.member || isLoading}
                    onClick={() => {
                        if (orderDetails.order_type === 'reservation') {
                            handleOpenPopup(); // open popup first
                        } else {
                            handleSendToKitchen(); // directly send
                        }
                    }}
                    sx={{
                        flex: 2,
                        borderColor: '#063455',
                        color: '#555',
                        textTransform: 'none',
                    }}
                >
                    {orderDetails.order_type === 'reservation' ? 'Proceed' : 'Send to kitchen'}
                </Button>
                {orderDetails.order_type === 'takeaway' ? (
                    <Button
                        variant="contained"
                        disabled={orderDetails.order_items.length === 0 || !orderDetails.member || isLoading}
                        onClick={handleOpenPayment}
                        sx={{
                            flex: 2,
                            bgcolor: '#063455',
                            '&:hover': { bgcolor: '#063455' },
                            textTransform: 'none',
                        }}
                    >
                        Pay Now
                    </Button>
                ) : ('')}
            </Box>

            {/* Reservation Popup */}
            <Dialog open={isPopupOpen} onClose={handleClosePopup} maxWidth="md" fullWidth>
                <DialogTitle>Continue Reservation Order</DialogTitle>
                <DialogContent>
                    <Typography sx={{ mb: 2 }}>Are you sure you want to continue with reservation order #{orderDetails.order_no}?</Typography>

                    {/* Select Waiter */}
                    <Autocomplete
                        fullWidth
                        size="small"
                        options={waiters}
                        value={orderDetails.waiter}
                        getOptionLabel={(option) => option?.name || ''}
                        onChange={(event, value) => handleAutocompleteChange(event, value, 'waiter')}
                        renderInput={(params) => <TextField {...params} fullWidth sx={{ p: 0 }} placeholder="Select Waiter" variant="outlined" />}
                        filterOptions={(options, state) => options.filter((option) => `${option.name} ${option.email} ${option.employee_id}`.toLowerCase().includes(state.inputValue.toLowerCase()))}
                        renderOption={(props, option) => {
                            const getStatusChipStyles = (status) => {
                                const s = (status || '').toLowerCase();
                                if (s === 'active') return { backgroundColor: '#e8f5e9', color: '#2e7d32' };
                                if (s === 'suspended' || s === 'inactive') return { backgroundColor: '#fff3e0', color: '#ef6c00' };
                                return { backgroundColor: '#ffebee', color: '#c62828' };
                            };
                            return (
                                <li {...props} key={option.id}>
                                    <Box sx={{ width: '100%' }}>
                                        <Box display="flex" justifyContent="space-between" alignItems="center">
                                            <Typography variant="body2" fontWeight="bold">
                                                {option.employee_id}
                                            </Typography>
                                            {option.status && (
                                                <Box
                                                    component="span"
                                                    sx={{
                                                        height: '20px',
                                                        fontSize: '10px',
                                                        px: 1,
                                                        borderRadius: '10px',
                                                        ...getStatusChipStyles(option.status),
                                                        textTransform: 'capitalize',
                                                        ml: 1,
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                    }}
                                                >
                                                    {option.status}
                                                </Box>
                                            )}
                                        </Box>
                                        <Typography variant="caption" color="text.secondary">
                                            {option.name}
                                        </Typography>
                                        {(option.department_name || option.subdepartment_name || option.company) && (
                                            <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '10px' }}>
                                                {[option.department_name, option.subdepartment_name, option.company].filter(Boolean).join(' • ')}
                                            </Typography>
                                        )}
                                    </Box>
                                </li>
                            );
                        }}
                    />

                    {/* Select Time */}
                    <TextField label="Select Time" name="time" type="time" value={orderDetails.time} onChange={handleInputChange} fullWidth margin="normal" InputLabelProps={{ shrink: true }} />

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                        <Button onClick={handleClosePopup} sx={{ mr: 1 }}>
                            Cancel
                        </Button>
                        <Button
                            disabled={!orderDetails.time}
                            variant="contained"
                            onClick={() => {
                                // merge waiter/time into order and send
                                handleSendToKitchen();
                                handleClosePopup();
                            }}
                        >
                            {is_new_order ? 'Save Pre-Order' : 'Send to Kitchen'}
                        </Button>
                    </Box>
                </DialogContent>
            </Dialog>

            {/* Payment Modal */}
            <PaymentNow
                invoiceData={{
                    ...orderDetails,
                    tax: taxRate,
                    service_charges: serviceCharges,
                    service_charges_percentage: serviceChargePct,
                    bank_charges: bankCharges,
                    bank_charges_percentage: isBankChargesEnabled && setting?.bank_charges_type === 'percentage' ? setting.bank_charges_value : 0,
                    discount_type: 'amount',
                    discount_value: discountAmount,
                    discount: discountAmount,
                    price: subtotal,
                    total_price: total - (orderDetails.advance_amount || 0),
                }}
                openSuccessPayment={handleSuccessPayment}
                openPaymentModal={openPaymentModal}
                handleClosePayment={handleClosePayment}
                mode="order"
                isLoading={isLoading}
                handleSendToKitchen={handleSendToKitchen}
            />

            <CancelItemDialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)} onConfirm={handleConfirmCancel} item={itemToCancel} />
        </>
    );
};
OrderDetail.layout = (page) => page;
export default OrderDetail;
