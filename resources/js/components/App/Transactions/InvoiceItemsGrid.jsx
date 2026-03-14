import React, { useEffect, useState } from 'react';
import { Box, Button, Grid, IconButton, Paper, styled, TextField, Typography, MenuItem, Divider, FormControl, InputLabel, Select, InputAdornment, ListSubheader } from '@mui/material';
import { Add, Delete, ReceiptLong } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { useSnackbar } from 'notistack';
import { TRANSACTION_TYPES } from '@/constants';

export default function InvoiceItemsGrid({ items, setItems, transactionTypes = [], selectedMember, subscriptionCategories = [], onQuickSelectMaintenance, membershipCharges = [], maintenanceCharges = [], subscriptionCharges = [], otherCharges = [], financialChargeTypes = [], bookingType = '', paymentMode = false, invoice = null }) {
    const { enqueueSnackbar } = useSnackbar();
    const [openPickers, setOpenPickers] = useState({});

    const togglePicker = (index, field, isOpen) => {
        setOpenPickers((prev) => {
            const key = `${index}_${field}`;
            // If state matches, return prev to avoid re-render
            if (!!prev[key] === isOpen) return prev;
            return {
                ...prev,
                [key]: isOpen,
            };
        });
    };

    const handleAddItem = () => {
        setItems([
            ...items,
            {
                id: Date.now(),
                fee_type: '',
                fee_type_name: '',
                description: '',
                qty: 1,
                amount: '',
                tax_percentage: '',
                overdue_percentage: 0,
                discount_type: 'fixed',
                discount_value: '',
                discount_amount: 0,
                additional_charges: '',
                extra_percentage: '',
                valid_from: null,
                valid_to: null,
                days: '',
                remarks: '',
                subscription_type_id: '',
                subscription_category_id: '',
                family_member_id: '',
                financial_charge_type_id: '', // New field
                total: 0,
            },
        ]);
    };

    // Remove a row
    const handleRemoveItem = (index) => {
        const newItems = [...items];
        newItems.splice(index, 1);
        setItems(newItems);
    };

    // Handle field changes
    const handleChange = (index, field, value) => {
        const newItems = [...items];
        const item = { ...newItems[index] };

        // Handle Fee Type Change special logic
        if (field === 'fee_type') {
            const allTypes = [...membershipCharges, ...maintenanceCharges, ...subscriptionCharges, ...otherCharges, ...transactionTypes];
            const selectedType = allTypes.find((t) => t.id == value);
            const typeId = selectedType ? parseInt(selectedType.type) : null; // 3: Mem, 4: Maint, 5: Sub, 6: Other

            if (typeId === TRANSACTION_TYPES.MAINTENANCE) {
                // Maintenance
                // Check if any OTHER item is also Maintenance (Type 4)
                const hasMaintenance = newItems.some((i, iIdx) => {
                    if (iIdx === index) return false;
                    const iType = allTypes.find((t) => t.id == i.fee_type);
                    return iType && parseInt(iType.type) === TRANSACTION_TYPES.MAINTENANCE;
                });

                if (hasMaintenance) {
                    enqueueSnackbar('Only one Maintenance Fee item is allowed per invoice.', { variant: 'warning' });
                    return; // Prevent change
                }
            }

            // Auto-fill logic
            let autoAmount = '';
            let isFixed = false;
            let feeName = selectedType ? selectedType.name : '';

            if (selectedType) {
                // Default from Type
                autoAmount = selectedType.default_amount || selectedType.amount || '';
                isFixed = !!selectedType.is_fixed;
            }

            if (typeId === TRANSACTION_TYPES.MEMBERSHIP && selectedMember) {
                // Membership
                autoAmount = selectedMember.total_membership_fee || selectedMember.membership_fee || selectedMember.member_category?.fee || '';
                isFixed = false;
            } else if (typeId === TRANSACTION_TYPES.MAINTENANCE && selectedMember) {
                // Maintenance
                autoAmount = selectedMember.total_maintenance_fee || selectedMember.maintenance_fee || '';
                isFixed = false;
            } else if (typeId === TRANSACTION_TYPES.SUBSCRIPTION) {
                // Subscription
                autoAmount = ''; // Reset
            }

            // Update local item variable
            item.fee_type = value;
            item.fee_type_name = feeName;
            item.amount = autoAmount !== '' ? autoAmount : '';
            item.is_fixed = isFixed;
            item.description = feeName;

            // Cleanup fields based on type
            if (typeId !== TRANSACTION_TYPES.FINANCIAL_CHARGE) {
                item.financial_charge_type_id = '';
            }
            if (typeId !== TRANSACTION_TYPES.SUBSCRIPTION) {
                item.subscription_type_id = '';
                item.subscription_category_id = '';
                item.family_member_id = '';
            }
        } else if (field === 'valid_from' || field === 'valid_to') {
            // Update state with formatted date if valid, otherwise keep null or invalid
            // Note: If we don't update state on invalid input, the input might revert.
            // But storing "Invalid Date" string is also bad.
            // Compromise: We update 'item[field]' if valid. If invalid/partial, we expect DatePicker internal state to handle it?
            // Actually, for controlled component, we must update value.
            // If we assume user input is correct, we let it flow.
            item[field] = value ? (dayjs(value).isValid() ? dayjs(value).format('YYYY-MM-DD') : null) : null;

            // Update 'days' if both dates are present and valid
            if (item.valid_from && item.valid_to) {
                const from = dayjs(item.valid_from);
                const to = dayjs(item.valid_to);
                if (from.isValid() && to.isValid()) {
                    const diff = to.diff(from, 'day') + 1;
                    item.days = diff > 0 ? diff : 0;
                }
            }

            // Auto-calc logic
            const allTypes = [...membershipCharges, ...maintenanceCharges, ...subscriptionCharges, ...otherCharges, ...transactionTypes];
            const currentType = allTypes.find((t) => t.id == item.fee_type);
            const typeId = currentType ? parseInt(currentType.type) : null;

            // Maintenance Logic (Type 4)
            if (typeId === TRANSACTION_TYPES.MAINTENANCE && item.valid_from && item.valid_to && selectedMember) {
                const from = dayjs(item.valid_from);
                const to = dayjs(item.valid_to);
                if (from.isValid() && to.isValid() && (to.isAfter(from) || to.isSame(from))) {
                    const monthlyFee = parseFloat(String(selectedMember.total_maintenance_fee || 0).replace(/,/g, ''));

                    // Check if dates represent complete months
                    // Complete month = starts on 1st day AND ends on last day of a month
                    const isFromFirstOfMonth = from.date() === 1;
                    const isToLastOfMonth = to.date() === to.endOf('month').date();
                    const isCompleteMonths = isFromFirstOfMonth && isToLastOfMonth;

                    let totalAmount;
                    let description;

                    if (isCompleteMonths) {
                        // Complete months - use monthly rate
                        const monthsDiff = (to.year() - from.year()) * 12 + (to.month() - from.month()) + 1;
                        totalAmount = Math.round(monthlyFee * (monthsDiff > 0 ? monthsDiff : 1));
                        description = `${item.fee_type_name} (${from.format('MMM YYYY')} - ${to.format('MMM YYYY')}) - ${monthsDiff} Month(s)`;
                    } else {
                        // Partial period - calculate daily rate
                        const days = to.diff(from, 'day') + 1;
                        const dailyRate = Math.round(monthlyFee / 30); // Daily rate based on 30-day month
                        totalAmount = Math.round(dailyRate * days);
                        description = `${item.fee_type_name} (${from.format('DD MMM YYYY')} - ${to.format('DD MMM YYYY')}) - ${days} Day(s) @ Rs ${dailyRate}/day`;
                    }

                    item.amount = totalAmount;
                    item.qty = 1;
                    item.description = description;
                }
            } else if (typeId === TRANSACTION_TYPES.SUBSCRIPTION && item.valid_from && item.valid_to && item.subscription_category_id) {
                // Subscription Logic (Type 5)
                const cat = subscriptionCategories.find((c) => c.id == item.subscription_category_id);
                if (cat && cat.fee) {
                    const from = dayjs(item.valid_from);
                    const to = dayjs(item.valid_to);
                    if (to.isAfter(from) || to.isSame(from)) {
                        const monthlyFee = parseFloat(cat.fee);

                        // Check if dates represent complete months
                        const isFromFirstOfMonth = from.date() === 1;
                        const isToLastOfMonth = to.date() === to.endOf('month').date();
                        const isCompleteMonths = isFromFirstOfMonth && isToLastOfMonth;

                        if (isCompleteMonths) {
                            // Complete months - use monthly rate
                            const monthsDiff = (to.year() - from.year()) * 12 + (to.month() - from.month()) + 1;
                            item.amount = Math.round(monthlyFee * (monthsDiff > 0 ? monthsDiff : 1));
                            item.description = `${item.fee_type_name} - ${cat.name} - ${monthsDiff} Month(s)`;
                        } else {
                            // Partial period - calculate daily rate
                            const days = to.diff(from, 'day') + 1;
                            const dailyRate = Math.round(monthlyFee / 30);
                            item.amount = Math.round(dailyRate * days);
                            item.description = `${item.fee_type_name} - ${cat.name} - ${days} Day(s) @ Rs ${dailyRate}/day`;
                        }
                        item.qty = 1;
                    }
                }
            }
        } else if (field === 'subscription_category_id') {
            item[field] = value;
            const cat = subscriptionCategories.find((c) => c.id == value);
            if (cat) {
                item.subscription_type_id = cat.subscription_type_id;
                item.amount = cat.fee;
                item.description = `${item.fee_type_name} - ${cat.name}`;
            }
        } else if (field === 'financial_charge_type_id') {
            item[field] = value;
            const chargeType = financialChargeTypes.find((t) => t.id == value);
            if (!value) {
                item.amount = '';
                item.is_fixed = false;
                item.description = item.fee_type_name || '';
            } else if (chargeType) {
                const autoAmount = chargeType.default_amount ?? chargeType.amount ?? '';
                item.amount = autoAmount !== null && autoAmount !== undefined ? autoAmount : '';
                item.is_fixed = !!chargeType.is_fixed;
                item.description = item.fee_type_name ? `${item.fee_type_name} - ${chargeType.name}` : chargeType.name;
            }
        } else {
            item[field] = value;
        }

        // Recalculate Totals
        const qty = Math.round(parseFloat(item.qty) || 0);
        const rate = Math.round(parseFloat(item.amount) || 0);
        const baseSubTotal = qty * rate;
        const extraPct = Math.round(parseFloat(item.extra_percentage) || 0);
        let addCharges = Math.round(parseFloat(item.additional_charges) || 0);
        const extraCleared = field === 'extra_percentage' && (value === '' || value === null || Number(value) === 0);
        if (extraCleared) {
            item.additional_charges = '';
            addCharges = 0;
        }
        if (extraPct > 0) {
            addCharges = Math.round((baseSubTotal * extraPct) / 100);
            item.additional_charges = addCharges;
        }
        let subTotal = baseSubTotal + addCharges;

        // Discount
        let discountAmt = 0;
        const discVal = Math.round(parseFloat(item.discount_value) || 0);
        if (item.discount_type === 'percent') {
            discountAmt = Math.round((subTotal * discVal) / 100);
        } else {
            discountAmt = Math.round(discVal);
        }
        item.discount_amount = discountAmt;

        // Net before tax
        const netAmount = subTotal - discountAmt;

        // Tax
        const taxPct = Math.round(parseFloat(item.tax_percentage) || 0);
        const taxAmt = Math.round((netAmount * taxPct) / 100);

        // Overdue
        const overduePct = Math.round(parseFloat(item.overdue_percentage) || 0);
        const overdueAmt = Math.round((netAmount * overduePct) / 100);

        item.total = Math.round(netAmount + taxAmt + overdueAmt);

        newItems[index] = item;
        setItems(newItems);
    };

    // Calculate Grand Total
    const grandTotal = items.reduce((sum, item) => sum + (item.total || 0), 0);
    const invoiceTotal = invoice ? parseFloat(String(invoice.total_price || 0).replace(/,/g, '')) || 0 : 0;

    const num = (val) => {
        if (val === null || val === undefined || val === '') return 0;
        const n = parseFloat(String(val).replace(/,/g, ''));
        return Number.isFinite(n) ? n : 0;
    };

    const summarySubtotal = items.reduce((sum, item) => sum + num(item.sub_total ?? item.amount), 0);
    const summaryDiscount = Math.max(
        items.reduce((sum, item) => sum + num(item.discount_amount), 0),
        num(invoice?.discount_amount),
    );
    const summaryTax = Math.max(
        items.reduce((sum, item) => sum + num(item.tax_amount), 0),
        num(invoice?.tax_amount),
    );
    const summaryOverdue = Math.max(
        items.reduce((sum, item) => sum + num(item.overdue_amount), 0),
        num(invoice?.overdue_amount),
    );
    const summaryAdditional = Math.max(
        items.reduce((sum, item) => sum + num(item.additional_charges), 0),
        num(invoice?.additional_charges),
    );
    const summaryPaid = num(invoice?.paid_amount) || items.reduce((sum, item) => sum + num(item.paid_amount), 0);
    const computedRemaining = Math.max(0, (invoiceTotal || grandTotal) - summaryPaid);
    const rawCustomerCharges = invoice?.customer_charges !== null && invoice?.customer_charges !== undefined ? num(invoice.customer_charges) : null;
    const summaryRemaining = invoice?.status === 'paid' ? 0 : rawCustomerCharges === null ? computedRemaining : rawCustomerCharges === 0 && computedRemaining > 0 ? computedRemaining : rawCustomerCharges;
    const payingNow = items.reduce((sum, item) => sum + (parseFloat(item.payment_amount) || 0), 0);

    const formatMoney = (value) => new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(Math.round(value || 0));

    const RoundedTextField = styled(TextField)(() => ({
        '& .MuiOutlinedInput-root': {
            borderRadius: 16,
        },
        '& .MuiOutlinedInput-notchedOutline': {
            borderRadius: 16,
        },
    }));

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Paper sx={{ width: '100%', mb: 0, p: 2, borderRadius: 2, boxShadow: 'none', border: '1px solid #e2e8f0' }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Box display="flex" alignItems="center">
                        <Box sx={{ bgcolor: '#e0f2fe', p: 1, borderRadius: 1, mr: 2 }}>
                            <ReceiptLong sx={{ color: '#063455' }} />
                        </Box>
                        <Typography sx={{ fontWeight: 'bold', color: '#063455', fontSize: '16px' }}>Invoice Items</Typography>
                    </Box>
                    {!paymentMode && (
                        <Button startIcon={<Add />} variant="outlined" size="small" onClick={handleAddItem} sx={{ borderRadius: '16px', textTransform: 'none', fontWeight: 600, color: '#fff', bgcolor: '#063455' }}>
                            Add Another Item
                        </Button>
                    )}
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {items.length === 0 ? (
                        <Box sx={{ p: 4, textAlign: 'center', bgcolor: '#f8fafc', borderRadius: 2, border: '1px dashed #cbd5e1' }}>
                            <Typography color="text.secondary">No items added to this invoice.</Typography>
                            <Button startIcon={<Add />} onClick={handleAddItem} sx={{ mt: 1 }}>
                                Add Item
                            </Button>
                        </Box>
                    ) : (
                        items.map((item, index) => (
                            <Box key={item.id} sx={{ p: 1.5, bgcolor: '#f8fafc', borderRadius: 2, position: 'relative', border: '1px solid #e2e8f0' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography variant="subtitle2" fontWeight="bold" color="text.secondary">
                                        Item #{index + 1}
                                    </Typography>
                                    {items.length > 1 && !paymentMode && (
                                        <IconButton size="small" color="error" onClick={() => handleRemoveItem(index)}>
                                            <Delete fontSize="small" />
                                        </IconButton>
                                    )}
                                </Box>

                                <Grid container rowSpacing={2} columnSpacing={1}>
                                    {/* Row 1: Fee Type, Description, Dates */}
                                    <Grid item xs={12} md={4}>
                                        <TextField
                                            select
                                            fullWidth
                                            size="small"
                                            label="Fee Type"
                                            value={item.fee_type || ''}
                                            onChange={(e) => handleChange(index, 'fee_type', e.target.value)}
                                            sx={{
                                                // bgcolor: 'white',
                                                '& .MuiOutlinedInput-root': {
                                                    borderRadius: '16px',
                                                },
                                            }}
                                            disabled={paymentMode}
                                        >
                                            {[
                                                // Show Membership Charges ONLY if NOT Guest
                                                ...(!String(bookingType).startsWith('guest') && membershipCharges.length > 0
                                                    ? [
                                                          //   <ListSubheader key="hdr-mem" sx={{ fontWeight: 'bold', bgcolor: '#f1f5f9', lineHeight: '36px' }}>
                                                          //       Membership Charges
                                                          //   </ListSubheader>,
                                                          ...membershipCharges.map((type) => (
                                                              <MenuItem key={type.id} value={type.id}>
                                                                  {type.name}
                                                              </MenuItem>
                                                          )),
                                                      ]
                                                    : []),

                                                // Show Maintenance Charges ONLY if NOT Guest
                                                ...(!String(bookingType).startsWith('guest') && maintenanceCharges.length > 0
                                                    ? [
                                                          <Divider key="div-maint" />,
                                                          //   <ListSubheader key="hdr-maint" sx={{ fontWeight: 'bold', bgcolor: '#f1f5f9', lineHeight: '36px' }}>
                                                          //       Maintenance Charges
                                                          //   </ListSubheader>,
                                                          ...maintenanceCharges.map((type) => (
                                                              <MenuItem key={type.id} value={type.id}>
                                                                  {type.name}
                                                              </MenuItem>
                                                          )),
                                                      ]
                                                    : []),

                                                ...(subscriptionCharges.length > 0
                                                    ? [
                                                          <Divider key="div-sub" />,
                                                          //   <ListSubheader key="hdr-sub" sx={{ fontWeight: 'bold', bgcolor: '#f1f5f9', lineHeight: '36px' }}>
                                                          //       Subscription Charges
                                                          //   </ListSubheader>,
                                                          ...subscriptionCharges.map((type) => (
                                                              <MenuItem key={type.id} value={type.id}>
                                                                  {type.name}
                                                              </MenuItem>
                                                          )),
                                                      ]
                                                    : []),
                                                ...(otherCharges.length > 0
                                                    ? [
                                                          <Divider key="div-other" />,
                                                          //   <ListSubheader key="hdr-other" sx={{ fontWeight: 'bold', bgcolor: '#f1f5f9', lineHeight: '36px' }}>
                                                          //       Other Charges
                                                          //   </ListSubheader>,
                                                          ...otherCharges.map((type) => (
                                                              <MenuItem key={type.id} value={type.id}>
                                                                  {type.name}
                                                              </MenuItem>
                                                          )),
                                                      ]
                                                    : []),
                                            ]}
                                        </TextField>
                                    </Grid>
                                    <Grid item xs={12} md={3}>
                                        <DatePicker
                                            format="DD-MM-YYYY"
                                            label="From"
                                            open={openPickers[`${index}_valid_from`] || false}
                                            onOpen={() => togglePicker(index, 'valid_from', true)}
                                            onClose={() => togglePicker(index, 'valid_from', false)}
                                            sx={{
                                                '& .MuiInputBase-root, & .MuiOutlinedInput-root, & fieldset': {
                                                    borderRadius: '16px !important',
                                                },
                                            }}
                                            slotProps={{
                                                textField: {
                                                    size: 'small',
                                                    fullWidth: true,
                                                },
                                                actionBar: {
                                                    actions: ['clear', 'today', 'cancel', 'accept'],
                                                },
                                            }}
                                            value={item.valid_from ? dayjs(item.valid_from) : null}
                                            onChange={(val) => handleChange(index, 'valid_from', val)}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={3}>
                                        <DatePicker
                                            format="DD-MM-YYYY"
                                            label="To"
                                            open={openPickers[`${index}_valid_to`] || false}
                                            onOpen={() => togglePicker(index, 'valid_to', true)}
                                            onClose={() => togglePicker(index, 'valid_to', false)}
                                            value={item.valid_to ? dayjs(item.valid_to) : null}
                                            onChange={(val) => handleChange(index, 'valid_to', val)}
                                            sx={{
                                                '& .MuiInputBase-root, & .MuiOutlinedInput-root, & fieldset': {
                                                    borderRadius: '16px !important',
                                                },
                                            }}
                                            slotProps={{
                                                textField: {
                                                    size: 'small',
                                                    fullWidth: true,
                                                    variant: 'outlined',
                                                },
                                                actionBar: {
                                                    actions: ['clear', 'today', 'cancel', 'accept'],
                                                },
                                            }}
                                        />
                                    </Grid>
                                    <Grid item xs={6} md={2}>
                                        <TextField
                                            label="Days"
                                            size="small"
                                            value={item.days || ''}
                                            // onChange={(e) => handleChange(index, 'days', e.target.value)}
                                            // sx={{ flexShrink: 0 }}
                                            sx={{
                                                // bgcolor: 'white',
                                                '& .MuiOutlinedInput-root': {
                                                    borderRadius: '16px',
                                                },
                                            }}
                                            disabled
                                        />
                                        {/* Quick Select Buttons */}
                                        {(() => {
                                            const allTypes = [...membershipCharges, ...maintenanceCharges, ...subscriptionCharges, ...otherCharges, ...transactionTypes];
                                            const currentType = allTypes.find((t) => t.id == item.fee_type);
                                            const typeId = currentType ? parseInt(currentType.type) : null;
                                            return (
                                                typeId === TRANSACTION_TYPES.MAINTENANCE &&
                                                onQuickSelectMaintenance && (
                                                    <Box sx={{ display: 'flex', gap: 0.5, mt: 1, flexWrap: 'wrap' }}>
                                                        <Button size="small" sx={{ fontSize: '0.7rem', px: 1, minWidth: 'auto' }} variant="outlined" onClick={() => onQuickSelectMaintenance('monthly', index)}>
                                                            1 Mo
                                                        </Button>
                                                        <Button size="small" sx={{ fontSize: '0.7rem', px: 1, minWidth: 'auto' }} variant="outlined" onClick={() => onQuickSelectMaintenance('quarterly', index)}>
                                                            1 Qtr
                                                        </Button>
                                                        <Button size="small" sx={{ fontSize: '0.7rem', px: 1, minWidth: 'auto' }} variant="outlined" onClick={() => onQuickSelectMaintenance('half_yearly', index)}>
                                                            6 Mo
                                                        </Button>
                                                        <Button size="small" sx={{ fontSize: '0.7rem', px: 1, minWidth: 'auto' }} variant="outlined" onClick={() => onQuickSelectMaintenance('annually', index)}>
                                                            1 Yr
                                                        </Button>
                                                    </Box>
                                                )
                                            );
                                        })()}
                                    </Grid>
                                    <Grid item xs={6} md={1}>
                                        <TextField
                                            type="number"
                                            fullWidth
                                            size="small"
                                            label="Qty"
                                            value={item.qty}
                                            onChange={(e) => handleChange(index, 'qty', e.target.value)}
                                            sx={{
                                                // bgcolor: 'white',
                                                '& .MuiOutlinedInput-root': {
                                                    borderRadius: '16px',
                                                },
                                            }}
                                            disabled={paymentMode}
                                        />
                                    </Grid>
                                    <Grid item xs={6} md={3}>
                                        <TextField
                                            type="number"
                                            fullWidth
                                            size="small"
                                            label="Rate"
                                            InputProps={{
                                                startAdornment: <InputAdornment position="start">Rs</InputAdornment>,
                                                readOnly: item.is_fixed, // Lock if fixed
                                            }}
                                            disabled={item.is_fixed || paymentMode} // Visual disable
                                            value={item.amount}
                                            onChange={(e) => handleChange(index, 'amount', e.target.value)}
                                            // sx={{ bgcolor: item.is_fixed ? '#f1f5f9' : 'white' }}
                                            sx={{
                                                // bgcolor: 'white',
                                                '& .MuiOutlinedInput-root': {
                                                    borderRadius: '16px',
                                                },
                                            }}
                                        />
                                    </Grid>

                                    {/* Row 1b: Subscription Details */}
                                    {/* Row 1b: Subscription Details */}
                                    {(() => {
                                        const allTypes = [...membershipCharges, ...maintenanceCharges, ...subscriptionCharges, ...otherCharges, ...transactionTypes];
                                        const currentType = allTypes.find((t) => t.id == item.fee_type);
                                        const typeId = currentType ? parseInt(currentType.type) : null;
                                        return (
                                            typeId === TRANSACTION_TYPES.SUBSCRIPTION && (
                                                <>
                                                    <Grid item xs={12} md={3}>
                                                        <TextField
                                                            select
                                                            fullWidth
                                                            size="small"
                                                            label="Category"
                                                            value={item.subscription_category_id}
                                                            onChange={(e) => handleChange(index, 'subscription_category_id', e.target.value)}
                                                            sx={{
                                                                // bgcolor: 'white',
                                                                '& .MuiOutlinedInput-root': {
                                                                    borderRadius: '16px',
                                                                },
                                                            }}
                                                            disabled={paymentMode}
                                                        >
                                                            {subscriptionCategories.map((c) => (
                                                                <MenuItem key={c.id} value={c.id}>
                                                                    {c.name}
                                                                </MenuItem>
                                                            ))}
                                                        </TextField>
                                                    </Grid>
                                                    <Grid item xs={12} md={3}>
                                                        <TextField
                                                            select
                                                            fullWidth
                                                            size="small"
                                                            label="Member/Family"
                                                            value={item.family_member_id}
                                                            onChange={(e) => handleChange(index, 'family_member_id', e.target.value)}
                                                            sx={{
                                                                // bgcolor: 'white',
                                                                '& .MuiOutlinedInput-root': {
                                                                    borderRadius: '16px',
                                                                },
                                                            }}
                                                            disabled={paymentMode}
                                                        >
                                                            <MenuItem value="">Self ({selectedMember?.full_name})</MenuItem>
                                                            {selectedMember?.family_members?.map((fm) => (
                                                                <MenuItem key={fm.id} value={fm.id}>
                                                                    {fm.full_name} ({fm.relation})
                                                                </MenuItem>
                                                            ))}
                                                        </TextField>
                                                    </Grid>
                                                    {/* <Grid item xs={12} md={3} /> */}
                                                </>
                                            )
                                        );
                                    })()}

                                    {/* Financial Charge Type Dropdown for Other Charges */}
                                    {(() => {
                                        const allTypes = [...membershipCharges, ...maintenanceCharges, ...subscriptionCharges, ...otherCharges, ...transactionTypes];
                                        const currentType = allTypes.find((t) => t.id == item.fee_type);
                                        const typeId = currentType ? parseInt(currentType.type) : null;
                                        return (
                                            typeId === TRANSACTION_TYPES.FINANCIAL_CHARGE && (
                                                <Grid item xs={12} md={4}>
                                                    <TextField
                                                        select
                                                        fullWidth
                                                        size="small"
                                                        label="Financial Charge Type"
                                                        value={item.financial_charge_type_id || ''}
                                                        onChange={(e) => handleChange(index, 'financial_charge_type_id', e.target.value)}
                                                        sx={{
                                                            // bgcolor: 'white',
                                                            '& .MuiOutlinedInput-root': {
                                                                borderRadius: '16px',
                                                            },
                                                        }}
                                                        helperText="Select specific financial charge type"
                                                        disabled={paymentMode}
                                                    >
                                                        {financialChargeTypes.map((type) => (
                                                            <MenuItem key={type.id} value={type.id}>
                                                                {type.name}
                                                            </MenuItem>
                                                        ))}
                                                    </TextField>
                                                </Grid>
                                            )
                                        );
                                    })()}

                                    {/* Row 3: Financials & Calculator */}
                                    <Grid item xs={6} md={3}>
                                        <TextField
                                            type="number"
                                            fullWidth
                                            size="small"
                                            label="Add. Chrgs"
                                            value={item.additional_charges}
                                            onChange={(e) => handleChange(index, 'additional_charges', e.target.value)}
                                            sx={{
                                                // bgcolor: 'white',
                                                '& .MuiOutlinedInput-root': {
                                                    borderRadius: '16px',
                                                },
                                            }}
                                            disabled={paymentMode}
                                        />
                                    </Grid>
                                    <Grid item xs={6} md={3}>
                                        <TextField
                                            type="number"
                                            fullWidth
                                            size="small"
                                            label="Add. %"
                                            value={item.extra_percentage ?? ''}
                                            onChange={(e) => handleChange(index, 'extra_percentage', e.target.value)}
                                            sx={{
                                                '& .MuiOutlinedInput-root': {
                                                    borderRadius: '16px',
                                                },
                                            }}
                                            helperText="Percentage of base subtotal"
                                            disabled={paymentMode}
                                        />
                                    </Grid>
                                    <Grid item xs={6} md={3}>
                                        <TextField
                                            type="number"
                                            fullWidth
                                            size="small"
                                            label="Tax%"
                                            value={item.tax_percentage ?? ''}
                                            onChange={(e) => handleChange(index, 'tax_percentage', e.target.value)}
                                            sx={{
                                                // bgcolor: 'white',
                                                '& .MuiOutlinedInput-root': {
                                                    borderRadius: '16px',
                                                },
                                            }}
                                            disabled={paymentMode}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={2}>
                                        {/* <Box display="flex" gap={1}> */}
                                        <TextField
                                            select
                                            size="small"
                                            fullWidth
                                            label="Disc Type"
                                            value={item.discount_type}
                                            onChange={(e) => handleChange(index, 'discount_type', e.target.value)}
                                            sx={{
                                                // bgcolor: 'white',
                                                '& .MuiOutlinedInput-root': {
                                                    borderRadius: '16px',
                                                },
                                            }}
                                            disabled={paymentMode}
                                        >
                                            <MenuItem value="fixed">Fixed</MenuItem>
                                            <MenuItem value="percent">%</MenuItem>
                                        </TextField>
                                        {/* </Box> */}
                                    </Grid>
                                    <Grid item xs={12} md={2}>
                                        <TextField
                                            type="number"
                                            size="small"
                                            label="Disc Val"
                                            value={item.discount_value ?? ''}
                                            onChange={(e) => handleChange(index, 'discount_value', e.target.value)}
                                            sx={{
                                                // bgcolor: 'white',
                                                '& .MuiOutlinedInput-root': {
                                                    borderRadius: '16px',
                                                },
                                            }}
                                            disabled={paymentMode}
                                        />
                                    </Grid>
                                    <Grid item xs={6} md={3}>
                                        <Box sx={{ p: 1, borderRadius: '16px', textAlign: 'right', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', border: '1px solid #d3cfcf' }}>
                                            <Typography fontWeight="bold" color="primary">
                                                {new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(item.total)}
                                            </Typography>
                                        </Box>
                                    </Grid>

                                    {/* Payment Mode Columns */}
                                    {paymentMode && (
                                        <>
                                            <Grid item xs={12} md={12}>
                                                <Divider sx={{ my: 1 }} />
                                            </Grid>
                                            <Grid item xs={6} md={3}>
                                                <TextField
                                                    size="small"
                                                    fullWidth
                                                    label="Already Paid"
                                                    value={new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(item.paid_amount || 0)}
                                                    disabled
                                                    sx={{
                                                        // bgcolor: 'white',
                                                        '& .MuiOutlinedInput-root': {
                                                            borderRadius: '16px',
                                                        },
                                                    }}
                                                />
                                            </Grid>
                                            <Grid item xs={6} md={3}>
                                                <TextField
                                                    size="small"
                                                    fullWidth
                                                    label="Balance"
                                                    value={new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(item.balance || 0)}
                                                    disabled
                                                    sx={{
                                                        '& .MuiInputBase-input': { color: 'error.main', fontWeight: 'bold' },
                                                        '& .MuiOutlinedInput-root': {
                                                            borderRadius: '16px',
                                                        },
                                                    }}
                                                />
                                            </Grid>
                                            <Grid item xs={12} md={6}>
                                                <TextField
                                                    type="number"
                                                    fullWidth
                                                    size="small"
                                                    label="Payment Amount (Now)"
                                                    value={item.payment_amount}
                                                    onChange={(e) => handleChange(index, 'payment_amount', e.target.value)}
                                                    sx={{
                                                        '& .MuiOutlinedInput-root': {
                                                            borderColor: 'success.main',
                                                            borderWidth: 2,
                                                            borderRadius: '16px',
                                                        },
                                                    }}
                                                    InputProps={{
                                                        startAdornment: <InputAdornment position="start">Rs</InputAdornment>,
                                                    }}
                                                />
                                            </Grid>
                                        </>
                                    )}

                                    {/* Row 3: Remarks */}
                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            size="small"
                                            label="Item Remarks"
                                            placeholder="Optional details..."
                                            value={item.remarks}
                                            onChange={(e) => handleChange(index, 'remarks', e.target.value)}
                                            sx={{
                                                // bgcolor: 'white',
                                                '& .MuiOutlinedInput-root': {
                                                    borderRadius: '16px',
                                                },
                                            }}
                                        />
                                    </Grid>
                                </Grid>
                            </Box>
                        ))
                    )}
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box display="flex" justifyContent="flex-end">
                    <Box sx={{ minWidth: 200 }}>
                        <Box display="flex" justifyContent="space-between" mb={1}>
                            <Typography color="text.secondary">Total Items:</Typography>
                            <Typography fontWeight="600">{items.length}</Typography>
                        </Box>
                        {paymentMode && (
                            <>
                                <Box display="flex" justifyContent="space-between" mb={1}>
                                    <Typography color="text.secondary">Subtotal:</Typography>
                                    <Typography fontWeight="600">{formatMoney(summarySubtotal)}</Typography>
                                </Box>
                                {summaryDiscount > 0 && (
                                    <Box display="flex" justifyContent="space-between" mb={1}>
                                        <Typography color="text.secondary">Discount:</Typography>
                                        <Typography fontWeight="600" color="error.main">
                                            - {formatMoney(summaryDiscount)}
                                        </Typography>
                                    </Box>
                                )}
                                {summaryTax > 0 && (
                                    <Box display="flex" justifyContent="space-between" mb={1}>
                                        <Typography color="text.secondary">Tax:</Typography>
                                        <Typography fontWeight="600">{formatMoney(summaryTax)}</Typography>
                                    </Box>
                                )}
                                {summaryOverdue > 0 && (
                                    <Box display="flex" justifyContent="space-between" mb={1}>
                                        <Typography color="text.secondary">Overdue:</Typography>
                                        <Typography fontWeight="600">{formatMoney(summaryOverdue)}</Typography>
                                    </Box>
                                )}
                                {summaryAdditional > 0 && (
                                    <Box display="flex" justifyContent="space-between" mb={1}>
                                        <Typography color="text.secondary">Additional:</Typography>
                                        <Typography fontWeight="600">{formatMoney(summaryAdditional)}</Typography>
                                    </Box>
                                )}
                                <Box display="flex" justifyContent="space-between" mb={1}>
                                    <Typography color="text.secondary">Remaining:</Typography>
                                    <Typography fontWeight="700">{formatMoney(summaryRemaining)}</Typography>
                                </Box>
                                <Box display="flex" justifyContent="space-between" mb={1}>
                                    <Typography color="text.secondary" fontWeight="bold">
                                        Paying Now:
                                    </Typography>
                                    <Typography fontWeight="bold" color="success.main">
                                        {formatMoney(payingNow)}
                                    </Typography>
                                </Box>
                                <Box display="flex" justifyContent="space-between" mb={1}>
                                    <Typography color="text.secondary">Already Paid:</Typography>
                                    <Typography fontWeight="600">{formatMoney(summaryPaid)}</Typography>
                                </Box>
                            </>
                        )}
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="h6" fontWeight="bold" color="#0a3d62">
                                Grand Total:
                            </Typography>
                            <Typography variant="h6" fontWeight="bold" color="#0a3d62">
                                {formatMoney(invoiceTotal || grandTotal)}
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            </Paper>
        </LocalizationProvider>
    );
}
