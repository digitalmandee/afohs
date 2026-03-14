import { AccessTime, Add, Block, Restore } from '@mui/icons-material';
import { Avatar, Box, Button, Checkbox, Chip, Dialog, DialogContent, IconButton, List, ListItem, ListItemText, Paper, Typography, Slide, Select, MenuItem, InputLabel, FormControl, FormControlLabel, Radio, TextField, RadioGroup, Collapse } from '@mui/material';
import { enqueueSnackbar } from 'notistack';
import { useEffect, useState } from 'react';
import AddItems from './AddItem';
import VariantSelectorDialog from '../VariantSelectorDialog';
import CancelItemDialog from './CancelItemDialog';
import UserAutocomplete from '@/components/UserAutocomplete';
import { routeNameForContext } from '@/lib/utils';

function EditOrderModal({ open, onClose, order, orderItems, setOrderItems, onSave, onSaveAndPrint, allowUpdateAndPrint, allrestaurants }) {
    const [showAddItem, setShowAddItem] = useState(false);
    const [variantPopupOpen, setVariantPopupOpen] = useState(false);
    const [variantProductId, setVariantProductId] = useState(null);
    const [initialEditItem, setInitialEditItem] = useState(null);
    const [editingItemIndex, setEditingItemIndex] = useState(null);
    const [variantMinQuantity, setVariantMinQuantity] = useState(1);
    const [orderStatus, setOrderStatus] = useState(order?.status || 'pending');
    const [loading, setLoading] = useState(false);
    const [editingDiscountIndex, setEditingDiscountIndex] = useState(null);
    const [itemDiscountForm, setItemDiscountForm] = useState({ value: '', type: 'percentage' });
    const [openDiscountModal, setOpenDiscountModal] = useState(false);

    // Cancel Item State
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
    const [itemToCancel, setItemToCancel] = useState(null);

    const [openCancelDetails, setOpenCancelDetails] = useState({});
    const [selectedCustomerType, setSelectedCustomerType] = useState('member');
    const [selectedCustomer, setSelectedCustomer] = useState(null);

    const toggleCancelDetails = (index) => {
        setOpenCancelDetails((prev) => ({
            ...prev,
            [index]: !prev[index], // toggle only this item
        }));
    };

    const getUnitPrice = (orderItem) => {
        const base = parseFloat(orderItem?.price) || 0;
        const variants = Array.isArray(orderItem?.variants) ? orderItem.variants : [];
        const variantsSum = variants.reduce((sum, v) => sum + (parseFloat(v?.price) || 0), 0);
        return base + variantsSum;
    };

    const getDiscountAmountForQty = (orderItem, quantity, totalPrice) => {
        const discountValue = Number(orderItem?.discount_value || 0);
        if (!discountValue || discountValue <= 0) return 0;

        const discountType = orderItem?.discount_type || 'percentage';
        const gross = Number(totalPrice || 0);
        let discountAmount = 0;
        if (discountType === 'percentage') {
            discountAmount = Math.round(gross * (discountValue / 100));
        } else {
            discountAmount = Math.round(discountValue * quantity);
        }
        if (discountAmount > gross) discountAmount = gross;
        return discountAmount;
    };

    const handleOpenItemDiscount = (index, item) => {
        setEditingDiscountIndex(index);
        setItemDiscountForm({
            value: item.discount_value || '',
            type: item.discount_type || 'percentage',
        });
        setOpenDiscountModal(true);
    };

    const handleApplyItemDiscount = () => {
        if (editingDiscountIndex === null) return;

        const row = orderItems[editingDiscountIndex];
        const item = row?.order_item;
        if (!item) return;

        const val = Number(itemDiscountForm.value || 0);
        const type = itemDiscountForm.type;

        if (item.max_discount != null && parseFloat(item.max_discount) > 0) {
            const maxDisc = parseFloat(item.max_discount);
            const maxDiscType = item.max_discount_type || 'percentage';

            let exceedsLimit = false;

            if (maxDiscType === 'percentage') {
                if (type === 'percentage') {
                    if (val > maxDisc) exceedsLimit = true;
                } else {
                    const equivalentPercent = (val / item.price) * 100;
                    if (equivalentPercent > maxDisc) exceedsLimit = true;
                }
            } else {
                if (type === 'amount') {
                    if (val > maxDisc) exceedsLimit = true;
                } else {
                    const calculatedAmount = (val / 100) * item.price;
                    if (calculatedAmount > maxDisc) exceedsLimit = true;
                }
            }

            if (exceedsLimit) {
                enqueueSnackbar(`Maximum discount allowed is ${maxDisc}${maxDiscType === 'percentage' ? '%' : ' Rs'}`, { variant: 'error' });
                return;
            }
        }

        setOrderItems((prev) =>
            prev.map((row, i) => {
                if (i !== editingDiscountIndex) return row;

                const nextId = row?.id && typeof row.id === 'number' ? `update-${row.id}` : row.id;
                const quantity = Number(row?.order_item?.quantity) || 1;
                const grossTotal = Number(row?.order_item?.total_price || 0);
                let discountAmount = 0;
                if (type === 'percentage') {
                    discountAmount = Math.round(grossTotal * (val / 100));
                } else {
                    discountAmount = Math.round(val * quantity);
                }
                if (discountAmount > grossTotal) discountAmount = grossTotal;

                return {
                    ...row,
                    id: nextId,
                    order_item: {
                        ...row.order_item,
                        discount_value: val,
                        discount_type: type,
                        discount_amount: discountAmount,
                    },
                };
            }),
        );

        setOpenDiscountModal(false);
        setEditingDiscountIndex(null);
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

    const updateItem = (index, updates) => {
        setOrderItems((prev) =>
            prev.map((item, i) => {
                if (i !== index) return item;

                let updatedId = item.id;
                if (item.id && typeof item.id === 'number') {
                    updatedId = `update-${item.id}`;
                }

                return {
                    ...item,
                    id: updatedId,
                    ...updates, // merge root-level updates (instructions, remark, cancelType)
                };
            }),
        );
    };

    useEffect(() => {
        setOrderStatus(order?.status || 'pending');
        if (order?.member) {
            setSelectedCustomerType('member');
            setSelectedCustomer({
                ...order.member,
                id: order.member.id,
                name: order.member.full_name || order.member.name,
                label: `${order.member.full_name || order.member.name} (${order.member.membership_no || '-'})`,
            });
            return;
        }
        if (order?.customer) {
            setSelectedCustomerType('guest');
            setSelectedCustomer({
                ...order.customer,
                id: order.customer.id,
                name: order.customer.name,
                label: `${order.customer.name} (${order.customer.customer_no || '-'})`,
            });
            return;
        }
        if (order?.employee) {
            setSelectedCustomerType('employee');
            setSelectedCustomer({
                ...order.employee,
                id: order.employee.id,
                name: order.employee.name,
                label: `${order.employee.name} (${order.employee.employee_id || '-'})`,
            });
            return;
        }
        setSelectedCustomerType('member');
        setSelectedCustomer(null);
    }, [order]);

    const handleQuantityChange = (index, delta) => {
        if (Number(delta) < 0) {
            enqueueSnackbar('Quantity decrease is not allowed. Use cancellation process.', { variant: 'warning' });
            return;
        }
        setOrderItems((prev) =>
            prev.map((item, i) => {
                if (i !== index) return item;

                const currentQty = Number(item.order_item.quantity) || 1;
                const updatedQty = currentQty + Number(delta);

                let updatedId = item.id;
                if (item.id && typeof item.id === 'number') {
                    updatedId = `update-${item.id}`;
                }

                const unitPrice = getUnitPrice(item.order_item);
                const safeQty = updatedQty > 0 ? updatedQty : 1;
                const totalPrice = unitPrice * safeQty;
                const discountAmount = getDiscountAmountForQty(item.order_item, safeQty, totalPrice);

                return {
                    ...item,
                    id: updatedId,
                    order_item: {
                        ...item.order_item,
                        quantity: safeQty,
                        total_price: totalPrice,
                        discount_amount: discountAmount,
                    },
                };
            }),
        );
    };

    const handleCancelClick = (item) => {
        setItemToCancel(item);
        setCancelDialogOpen(true);
    };

    const handleRestoreItem = (index) => {
        setOrderItems((prev) =>
            prev.map((item, i) => {
                if (i !== index) return item;

                let updatedId = item.id;
                if (item.id && typeof item.id === 'number') {
                    updatedId = `update-${item.id}`;
                }

                return {
                    ...item,
                    id: updatedId,
                    status: 'pending',
                    remark: null,
                    instructions: null,
                    cancelType: null,
                };
            }),
        );
    };

    const handleConfirmCancel = (data) => {
        const { quantity: cancelQty, remark, instructions, cancelType } = data;
        if (!itemToCancel) return;

        const index = orderItems.findIndex((i) => i === itemToCancel);
        if (index === -1) return;

        const originalItem = orderItems[index];

        // Ensure we are working with numbers
        const currentQty = parseInt(originalItem.order_item.quantity, 10);
        const safeCancelQty = parseInt(cancelQty, 10);

        if (safeCancelQty >= currentQty) {
            // Cancel Entire Item
            updateItem(index, {
                status: 'cancelled',
                remark,
                instructions,
                cancelType,
            });
        } else {
            // Partial Cancel -> Split
            // 1. Reduce quantity of original item
            const reducedQty = currentQty - safeCancelQty;
            const unitPrice = getUnitPrice(originalItem.order_item);
            const reducedPrice = unitPrice * reducedQty;
            const reducedDiscountAmount = getDiscountAmountForQty(originalItem.order_item, reducedQty, reducedPrice);

            const updatedOriginal = {
                ...originalItem,
                id: originalItem.id && typeof originalItem.id === 'number' ? `update-${originalItem.id}` : originalItem.id,
                order_item: {
                    ...originalItem.order_item,
                    quantity: reducedQty,
                    total_price: reducedPrice,
                    discount_amount: reducedDiscountAmount,
                },
            };

            // 2. Create NEW item for cancelled part
            const cancelledPrice = unitPrice * safeCancelQty;
            const cancelledDiscountAmount = getDiscountAmountForQty(originalItem.order_item, safeCancelQty, cancelledPrice);
            const cancelledItem = {
                ...originalItem,
                id: 'new', // Treat as new item
                status: 'cancelled',
                remark,
                instructions,
                cancelType,
                order_item: {
                    ...originalItem.order_item,
                    quantity: safeCancelQty,
                    total_price: cancelledPrice,
                    discount_amount: cancelledDiscountAmount,
                },
            };

            setOrderItems((prev) => {
                const newItems = [...prev];
                newItems[index] = updatedOriginal; // Replace original with reduced
                newItems.splice(index + 1, 0, cancelledItem); // Insert cancelled right after
                return newItems;
            });
        }

        setCancelDialogOpen(false);
        setItemToCancel(null);
    };

    const handleItemClick = async (item, index) => {
        setVariantProductId(item.order_item.id);
        setVariantPopupOpen(true);
        setInitialEditItem(item.order_item);
        setEditingItemIndex(index);
        const isExistingRow = item?.id !== 'new';
        const baseQty = Number(item?.order_item?.quantity) || 1;
        setVariantMinQuantity(isExistingRow ? baseQty : 1);
    };

    const handleVariantConfirm = (updatedItem) => {
        setOrderItems((prevItems) =>
            prevItems.map((item, i) =>
                i === editingItemIndex
                    ? {
                          ...item,
                          order_item: (() => {
                              const nextOrderItem = {
                                  ...updatedItem,
                                  discount_value: updatedItem?.discount_value ?? item.order_item?.discount_value ?? 0,
                                  discount_type: updatedItem?.discount_type ?? item.order_item?.discount_type ?? 'percentage',
                              };
                              const quantity = Number(nextOrderItem?.quantity) || 1;
                              const totalPrice = Number(nextOrderItem?.total_price || 0);
                              return {
                                  ...nextOrderItem,
                                  discount_amount: getDiscountAmountForQty(nextOrderItem, quantity, totalPrice),
                              };
                          })(),
                          id: item.id && typeof item.id === 'number' ? `update-${item.id}` : item.id,
                      }
                    : item,
            ),
        );

        resetVariantState();
    };

    const resetVariantState = () => {
        setVariantPopupOpen(false);
        setInitialEditItem(null);
        setEditingItemIndex(null);
        setVariantMinQuantity(1);
    };

    const onSubmit = async () => {
        setLoading(true);
        try {
            await onSave(orderStatus, {
                customer_type: selectedCustomerType,
                customer: selectedCustomer,
            });
            setShowAddItem(false);
        } catch (error) {
            console.error('Failed to save order', error);
            // optionally show an error Snackbar here
        } finally {
            setLoading(false);
        }
    };

    const onSubmitAndPrint = async () => {
        if (!onSaveAndPrint) return;
        setLoading(true);
        try {
            await onSaveAndPrint(orderStatus, {
                customer_type: selectedCustomerType,
                customer: selectedCustomer,
            });
            setShowAddItem(false);
        } catch (error) {
            console.error('Failed to save order', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
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
            <Dialog open={open} onClose={onClose} fullScreen={showAddItem} TransitionComponent={Slide}>
                <DialogContent
                    sx={{
                        p: 0,
                        width: showAddItem ? '100%' : '600px', // expand when adding
                        maxWidth: '100vw',
                        height: '90vh',
                        display: 'flex',
                        flexDirection: 'row',
                    }}
                >
                    {/* Variant Popup */}
                    {variantPopupOpen && <VariantSelectorDialog open={variantPopupOpen} onClose={resetVariantState} productId={variantProductId} initialItem={initialEditItem} onConfirm={handleVariantConfirm} minQuantity={variantMinQuantity} />}
                    {cancelDialogOpen && <CancelItemDialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)} onConfirm={handleConfirmCancel} item={itemToCancel} />}

                    {/* Order Info Panel */}
                    <Paper
                        elevation={1}
                        sx={{
                            width: showAddItem ? '30%' : '100%',
                            transition: 'width 0.3s ease',
                            borderRight: showAddItem ? '1px solid #ccc' : 'none',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                            height: 'calc(100vh - 64px)',
                        }}
                    >
                        {/* Sticky Header */}
                        <Box
                            sx={{
                                bgcolor: '#063455',
                                color: 'white',
                                p: 2,
                                position: 'sticky',
                                top: 0,
                                zIndex: 1,
                            }}
                        >
                            <Typography variant="subtitle2" sx={{ fontWeight: 500, fontSize: '18px' }}>
                                #{order?.id ?? '—'}
                            </Typography>

                            <Typography variant="h6" sx={{ fontWeight: 500, fontSize: '18px' }}>
                                {order?.member ? `${order.member?.full_name} (${order.member?.membership_no})` : `${order?.customer ? order.customer.name : order?.employee?.name}`}
                            </Typography>
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    bgcolor: '#0066cc',
                                    width: 'fit-content',
                                    px: 1,
                                    py: 0.5,
                                    borderRadius: 0.5,
                                    mt: 1,
                                }}
                            >
                                <AccessTime fontSize="small" sx={{ fontSize: 16, mr: 0.5 }} />
                                <Typography variant="caption">
                                    {order?.start_date ? new Date(order.start_date).toLocaleDateString('en-GB') : ''} {order?.start_time ? new Date(`2000-01-01 ${order.start_time}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                </Typography>
                            </Box>
                            <Box
                                sx={{
                                    position: 'absolute',
                                    top: 16,
                                    right: 16,
                                    display: 'flex',
                                }}
                            >
                                <Avatar
                                    sx={{
                                        bgcolor: '#1976d2',
                                        width: 36,
                                        height: 36,
                                        fontSize: 14,
                                        fontWeight: 500,
                                        mr: 1,
                                    }}
                                >
                                    {order?.table?.table_no ?? '-'}
                                </Avatar>
                                <Avatar
                                    sx={{
                                        bgcolor: '#E3E3E3',
                                        width: 36,
                                        height: 36,
                                        color: '#666',
                                    }}
                                >
                                    <img
                                        src="/assets/food-tray.png"
                                        alt=""
                                        style={{
                                            width: 24,
                                            height: 24,
                                        }}
                                    />
                                </Avatar>
                            </Box>
                        </Box>

                        {/* Scrollable Order Items */}
                        <Box
                            sx={{
                                flex: 1,
                                overflowY: 'auto',
                                '&::-webkit-scrollbar': {
                                    width: '6px',
                                },
                                '&::-webkit-scrollbar-thumb': {
                                    backgroundColor: '#ccc',
                                    borderRadius: '3px',
                                },
                            }}
                        >
                            <Box p={2}>
                                <Typography variant="body2" sx={{ mb: 0.75 }}>
                                    Customer Type
                                </Typography>
                                <RadioGroup
                                    row
                                    value={selectedCustomerType}
                                    onChange={(e) => {
                                        setSelectedCustomerType(e.target.value);
                                        setSelectedCustomer(null);
                                    }}
                                    sx={{ mb: 1.5 }}
                                >
                                    <FormControlLabel value="member" control={<Radio size="small" />} label="Member" />
                                    <FormControlLabel value="guest" control={<Radio size="small" />} label="Guest" />
                                    <FormControlLabel value="employee" control={<Radio size="small" />} label="Employee" />
                                </RadioGroup>
                                <UserAutocomplete routeUri={route(routeNameForContext('api.users.global-search'))} memberType={selectedCustomerType === 'member' ? '0' : selectedCustomerType === 'guest' ? '1' : '3'} value={selectedCustomer && selectedCustomer.id ? selectedCustomer : null} onChange={(newValue) => setSelectedCustomer(newValue || null)} label="Customer Name" placeholder="Search by name, ID, or CNIC..." />
                            </Box>
                            <List sx={{ py: 0 }}>
                                {orderItems.length > 0 &&
                                    orderItems.map((item, index) => (
                                        <Box key={index}>
                                            <ListItem
                                                divider
                                                sx={{
                                                    py: 0,
                                                    px: 2,
                                                    ...(item.status === 'cancelled' && {
                                                        '& .MuiListItemText-primary': {
                                                            textDecoration: 'line-through',
                                                        },
                                                    }),
                                                }}
                                            >
                                                <ListItemText
                                                    primary={item.order_item?.name}
                                                    secondary={
                                                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 0.5 }}>
                                                            {item.order_item?.is_discountable && (
                                                                <Chip
                                                                    label={Number(item.order_item?.discount_value || 0) > 0 ? `-${item.order_item?.discount_type === 'percentage' ? item.order_item?.discount_value + '%' : 'Rs ' + item.order_item?.discount_value}` : 'Add Disc.'}
                                                                    size="small"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleOpenItemDiscount(index, item.order_item);
                                                                    }}
                                                                    sx={{
                                                                        height: '18px',
                                                                        fontSize: '0.65rem',
                                                                        bgcolor: Number(item.order_item?.discount_value || 0) > 0 ? '#ffebee' : '#f5f5f5',
                                                                        color: Number(item.order_item?.discount_value || 0) > 0 ? '#c62828' : '#757575',
                                                                        cursor: 'pointer',
                                                                        '&:hover': { bgcolor: '#e0e0e0' },
                                                                    }}
                                                                />
                                                            )}
                                                            {item.order_item?.is_taxable && <Chip label="Taxable" size="small" sx={{ height: '18px', fontSize: '0.65rem' }} />}
                                                        </Box>
                                                    }
                                                    onClick={() => handleItemClick(item, index)}
                                                    sx={{ cursor: 'pointer' }}
                                                />

                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <IconButton size="small" disabled onClick={() => handleQuantityChange(index, -1)} sx={{ color: '#003153' }}>
                                                        <Typography sx={{ fontSize: 16, fontWeight: 'bold' }}>-</Typography>
                                                    </IconButton>
                                                    <Typography sx={{ mx: 1 }}>{item.order_item.quantity}x</Typography>
                                                    <IconButton size="small" onClick={() => handleQuantityChange(index, 1)} sx={{ color: '#003153' }}>
                                                        <Typography sx={{ fontSize: 16, fontWeight: 'bold' }}>+</Typography>
                                                    </IconButton>
                                                    <Box sx={{ textAlign: 'right', ml: 1 }}>
                                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                            Rs. {Number((Number(item.order_item?.total_price || 0) - Number(item.order_item?.discount_amount || 0)).toFixed(2)).toLocaleString()}
                                                        </Typography>
                                                        {Number(item.order_item?.discount_amount || 0) > 0 && (
                                                            <Typography variant="caption" sx={{ color: '#ef5350', display: 'block' }}>
                                                                (Saved Rs {Number(item.order_item?.discount_amount || 0).toFixed(2)})
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                    {item.id === 'new' ? (
                                                        <IconButton
                                                            onClick={() => {
                                                                setOrderItems((prev) => prev.filter((_, i) => i !== index));
                                                            }}
                                                            sx={{ color: '#d32f2f', fontSize: 16 }}
                                                        >
                                                            ✕
                                                        </IconButton>
                                                    ) : item.status === 'cancelled' ? (
                                                        <IconButton size="small" onClick={() => handleRestoreItem(index)} sx={{ color: '#2e7d32' }} title="Restore Item">
                                                            <Restore />
                                                        </IconButton>
                                                    ) : (
                                                        <IconButton size="small" onClick={() => handleCancelClick(item)} sx={{ color: '#d32f2f' }} title="Cancel Item">
                                                            <Block />
                                                        </IconButton>
                                                    )}

                                                    {item.status === 'cancelled' && (
                                                        <Button variant="text" size="small" onClick={() => toggleCancelDetails(index)} sx={{ textTransform: 'none', color: '#d32f2f' }}>
                                                            Details
                                                        </Button>
                                                    )}
                                                </Box>
                                            </ListItem>
                                            {/* Inline Collapse for Cancel Details */}
                                            <Collapse in={openCancelDetails[index] && item.status === 'cancelled'}>
                                                <Box sx={{ px: 4, py: 2, bgcolor: '#f9f9f9' }}>
                                                    <FormControl fullWidth sx={{ mb: 2 }}>
                                                        <InputLabel>Remark</InputLabel>
                                                        <Select size="small" sx={{ py: 1 }} value={item.remark || ''} onChange={(e) => updateItem(index, { remark: e.target.value })}>
                                                            <MenuItem value="CANCELLED BY CUSTOMER">CANCELLED BY CUSTOMER</MenuItem>
                                                            <MenuItem value="GUEST MIND CHANGE">GUEST MIND CHANGE</MenuItem>
                                                            <MenuItem value="FOOD COMPLAIN">FOOD COMPLAIN</MenuItem>
                                                            <MenuItem value="GUEST DIDN'T PICK THE CALL">GUEST DIDN'T PICK THE CALL</MenuItem>
                                                            <MenuItem value="GUEST DIDN'T LIKE THE FOOD">GUEST DIDN'T LIKE THE FOOD</MenuItem>
                                                            <MenuItem value="OTHER">OTHER</MenuItem>
                                                            <MenuItem value="WRONG PUNCHING">WRONG PUNCHING</MenuItem>
                                                            <MenuItem value="RUN OUT">RUN OUT</MenuItem>
                                                            <MenuItem value="DIDN'T SERVED">DIDN'T SERVED</MenuItem>
                                                        </Select>
                                                    </FormControl>

                                                    <TextField size="small" label="Instructions" multiline rows={2} fullWidth sx={{ mb: 2 }} value={item.instructions || ''} onChange={(e) => updateItem(index, { instructions: e.target.value })} />
                                                </Box>
                                            </Collapse>
                                        </Box>
                                    ))}
                            </List>

                            {(() => {
                                const active = orderItems.filter((x) => x?.status !== 'cancelled');
                                const subtotal = Math.round(active.reduce((sum, x) => sum + Number(x?.order_item?.total_price || 0), 0));
                                const discountAmount = active.reduce((sum, x) => sum + Number(x?.order_item?.discount_amount || 0), 0);
                                const discountedSubtotal = subtotal - discountAmount;
                                const taxRate = Number(order?.tax || 0);
                                const taxAmount = active.reduce((sum, x) => {
                                    const isTaxable = x?.order_item?.is_taxable === true || x?.order_item?.is_taxable === 'true' || x?.order_item?.is_taxable === 1;
                                    if (!isTaxable) return sum;
                                    const itemNet = Number(x?.order_item?.total_price || 0) - Number(x?.order_item?.discount_amount || 0);
                                    return sum + Math.round(itemNet * taxRate);
                                }, 0);
                                const serviceCharges = Math.round(Number(order?.service_charges || 0));
                                const bankCharges = Math.round(Number(order?.bank_charges || 0));
                                const total = Math.round(discountedSubtotal + taxAmount + serviceCharges + bankCharges);

                                return (
                                    <Box sx={{ px: 2, py: 1.5, bgcolor: '#f5f5f5', borderTop: '1px solid #e0e0e0' }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Typography variant="body2" fontWeight="bold">
                                                Subtotal
                                            </Typography>
                                            <Typography variant="body2">{subtotal.toLocaleString()}</Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Typography variant="body2" fontWeight="bold">
                                                Discount
                                            </Typography>
                                            <Typography variant="body2">{Number(discountAmount || 0).toFixed(2)}</Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Typography variant="body2" fontWeight="bold">
                                                Tax {taxRate ? `(${Math.round(taxRate * 100)}%)` : ''}
                                            </Typography>
                                            <Typography variant="body2">{taxAmount.toLocaleString()}</Typography>
                                        </Box>
                                        {serviceCharges > 0 && (
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography variant="body2" fontWeight="bold">
                                                    Service Charges
                                                </Typography>
                                                <Typography variant="body2">{serviceCharges.toLocaleString()}</Typography>
                                            </Box>
                                        )}
                                        {bankCharges > 0 && (
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography variant="body2" fontWeight="bold">
                                                    Bank Charges
                                                </Typography>
                                                <Typography variant="body2">{bankCharges.toLocaleString()}</Typography>
                                            </Box>
                                        )}
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Typography variant="body2" fontWeight="bold">
                                                Total
                                            </Typography>
                                            <Typography variant="body2" fontWeight="bold">
                                                {total.toLocaleString()}
                                            </Typography>
                                        </Box>
                                    </Box>
                                );
                            })()}

                            {/* Add Item Button */}
                            {!showAddItem && (
                                <Box sx={{ px: 2 }}>
                                    <Button
                                        variant="outlined"
                                        fullWidth
                                        startIcon={<Add sx={{ color: '#063455' }} />}
                                        sx={{
                                            border: '1px solid #063455',
                                            color: '#063455',
                                            textTransform: 'none',
                                            py: 1,
                                            mb: 1,
                                        }}
                                        onClick={() => setShowAddItem(true)}
                                    >
                                        Add Item
                                    </Button>
                                </Box>
                            )}
                        </Box>

                        {/* Notes Section - Sticky at bottom before footer */}
                        {(order?.kitchen_note || order?.staff_note || order?.payment_note) && (
                            <Box
                                sx={{
                                    px: 2,
                                    py: 1.5,
                                    borderTop: '1px solid #e0e0e0',
                                    bgcolor: '#f9f9f9',
                                }}
                            >
                                <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#063455', mb: 1, display: 'block' }}>
                                    Notes:
                                </Typography>
                                {order.kitchen_note && (
                                    <Box sx={{ mb: 0.5 }}>
                                        <Typography variant="caption" component="span" fontWeight="bold" sx={{ color: '#555' }}>
                                            • Kitchen:{' '}
                                        </Typography>
                                        <Typography variant="caption" component="span" sx={{ color: '#666' }}>
                                            {order.kitchen_note}
                                        </Typography>
                                    </Box>
                                )}
                                {order.staff_note && (
                                    <Box sx={{ mb: 0.5 }}>
                                        <Typography variant="caption" component="span" fontWeight="bold" sx={{ color: '#555' }}>
                                            • Staff:{' '}
                                        </Typography>
                                        <Typography variant="caption" component="span" sx={{ color: '#666' }}>
                                            {order.staff_note}
                                        </Typography>
                                    </Box>
                                )}
                                {order.payment_note && (
                                    <Box sx={{ mb: 0.5 }}>
                                        <Typography variant="caption" component="span" fontWeight="bold" sx={{ color: '#555' }}>
                                            • Payment:{' '}
                                        </Typography>
                                        <Typography variant="caption" component="span" sx={{ color: '#666' }}>
                                            {order.payment_note}
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                        )}

                        {/* Footer */}
                        <Box sx={{ display: 'flex', p: 2, gap: 2, borderTop: '1px solid #e0e0e0' }}>
                            <Button
                                variant="outlined"
                                fullWidth
                                onClick={() => {
                                    onClose();
                                    setShowAddItem(false);
                                }}
                                sx={{
                                    borderColor: '#003153',
                                    color: '#003153',
                                    textTransform: 'none',
                                    py: 1,
                                }}
                            >
                                Cancel
                            </Button>
                            {Boolean(allowUpdateAndPrint && onSaveAndPrint) && (
                                <Button
                                    variant="outlined"
                                    fullWidth
                                    onClick={() => onSubmitAndPrint()}
                                    disabled={loading}
                                    sx={{
                                        borderColor: '#003153',
                                        color: '#003153',
                                        textTransform: 'none',
                                        py: 1,
                                    }}
                                >
                                    Update & Print
                                </Button>
                            )}
                            <Button
                                variant="contained"
                                fullWidth
                                onClick={() => onSubmit()}
                                disabled={loading}
                                loading={loading}
                                loadingPosition="start"
                                sx={{
                                    bgcolor: '#003153',
                                    '&:hover': { bgcolor: '#00254d' },
                                    textTransform: 'none',
                                    py: 1,
                                }}
                            >
                                Save Changes
                            </Button>
                        </Box>
                    </Paper>

                    {/* Add Items Panel (Full-screen right pane) */}
                    {showAddItem && (
                        <Box
                            sx={{
                                width: '70%',
                                transition: 'width 0.3s ease',
                                overflow: 'auto',
                            }}
                        >
                            <AddItems allrestaurants={allrestaurants} orderItems={orderItems} setOrderItems={setOrderItems} setShowAddItem={setShowAddItem} initialRestaurantId={order?.tenant_id} orderType={order?.order_type} disableRestaurantSelect={true} />
                        </Box>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
EditOrderModal.layout = (page) => page;
export default EditOrderModal;
