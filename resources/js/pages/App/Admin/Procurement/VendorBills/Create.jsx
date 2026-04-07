import React from 'react';
import { useForm } from '@inertiajs/react';
import { Box, Button, Card, CardContent, Chip, Grid, IconButton, MenuItem, TextField, Typography, Alert, Stack } from '@mui/material';
import { DeleteOutline } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import AppLoadingButton from '@/components/App/ui/AppLoadingButton';
import ConfirmActionDialog from '@/components/App/ui/ConfirmActionDialog';
import useMutationAction from '@/hooks/useMutationAction';
import { formatAmount } from '@/lib/formatting';

export default function Create({ receipt, vendors, receipts, vendorReceiptStatus = {}, availableAdvances = [], procurementPolicy = {} }) {
  const { enqueueSnackbar } = useSnackbar();
  const mutation = useMutationAction();
  const billRequiresGrn = Boolean(procurementPolicy.bill_requires_grn ?? true);
  const pendingReceipts = receipts || [];

  const buildItemsFromReceipt = React.useCallback((sourceReceipt) => (sourceReceipt?.items || []).map((item) => ({
    inventory_item_id: item.inventory_item_id || '',
    description: item.inventory_item?.name || item.description || '',
    qty: item.qty_received || 1,
    unit_cost: item.unit_cost || 0,
    tax_amount: 0,
    discount_amount: 0,
  })), []);

  const presetItems = buildItemsFromReceipt(receipt);

  const { data, setData, post, processing, errors } = useForm({
    vendor_id: receipt?.vendor_id || '',
    goods_receipt_id: receipt?.id || '',
    bill_date: new Date().toISOString().slice(0, 10),
    due_date: '',
    remarks: '',
    items: presetItems.length > 0 ? presetItems : [{ inventory_item_id: '', description: '', qty: 1, unit_cost: 0, tax_amount: 0, discount_amount: 0 }],
    other_charges: [],
  });

  const filteredReceipts = React.useMemo(() => {
    if (!data.vendor_id) {
      return [];
    }
    return pendingReceipts
      .filter((row) => String(row.vendor_id) === String(data.vendor_id))
      .sort((a, b) => new Date(a.received_date || 0) - new Date(b.received_date || 0));
  }, [pendingReceipts, data.vendor_id]);

  const selectedReceipt = React.useMemo(() => (
    filteredReceipts.find((row) => String(row.id) === String(data.goods_receipt_id)) || null
  ), [filteredReceipts, data.goods_receipt_id]);
  const selectedVendorReceiptStatus = React.useMemo(() => {
    if (!data.vendor_id) {
      return null;
    }

    return vendorReceiptStatus?.[String(data.vendor_id)] || null;
  }, [data.vendor_id, vendorReceiptStatus]);
  const availableVendorAdvances = React.useMemo(() => {
    if (!data.vendor_id) {
      return [];
    }
    const selectedPoId = selectedReceipt?.purchase_order_id ? String(selectedReceipt.purchase_order_id) : null;
    return (availableAdvances || [])
      .filter((advance) => String(advance.vendor_id) === String(data.vendor_id))
      .map((advance) => ({
        ...advance,
        poLockMatch: !selectedPoId || !advance.purchase_order_id || String(advance.purchase_order_id) === selectedPoId,
      }));
  }, [availableAdvances, data.vendor_id, selectedReceipt?.purchase_order_id]);

  const handleReceiptChange = (value) => {
    const selected = filteredReceipts.find((row) => String(row.id) === String(value));
    const nextItems = buildItemsFromReceipt(selected);

    setData('goods_receipt_id', value);
    setData('items', nextItems.length > 0 ? nextItems : [{ inventory_item_id: '', description: '', qty: 1, unit_cost: 0, tax_amount: 0, discount_amount: 0 }]);
  };

  React.useEffect(() => {
    if (!data.vendor_id) {
      setData('goods_receipt_id', '');
      if (billRequiresGrn) {
        setData('items', []);
      }
      return;
    }

    if (filteredReceipts.length === 0) {
      setData('goods_receipt_id', '');
      if (billRequiresGrn) {
        setData('items', []);
      }
      return;
    }

    const exists = filteredReceipts.some((row) => String(row.id) === String(data.goods_receipt_id));
    if (!exists) {
      const oldest = filteredReceipts[0];
      setData('goods_receipt_id', oldest.id);
      setData('items', buildItemsFromReceipt(oldest));
    }
  }, [billRequiresGrn, buildItemsFromReceipt, data.goods_receipt_id, data.vendor_id, filteredReceipts, setData]);

  const updateItem = (index, field, value) => {
    const next = [...data.items];
    next[index] = { ...next[index], [field]: value };
    setData('items', next);
  };

  const addItem = () => {
    if (billRequiresGrn) return;
    setData('items', [...data.items, { inventory_item_id: '', description: '', qty: 1, unit_cost: 0, tax_amount: 0, discount_amount: 0 }]);
  };

  const removeItem = (index) => {
    if (billRequiresGrn) return;
    setData('items', data.items.filter((_, idx) => idx !== index));
  };

  const updateCharge = (index, field, value) => {
    const next = [...data.other_charges];
    next[index] = { ...next[index], [field]: value };
    setData('other_charges', next);
  };

  const addCharge = () => {
    setData('other_charges', [...data.other_charges, { account_id: '', party_vendor_id: '', description: '', amount: 0 }]);
  };

  const removeCharge = (index) => {
    setData('other_charges', data.other_charges.filter((_, idx) => idx !== index));
  };

  const grandTotal = data.items.reduce((sum, item) => {
    const base = Number(item.qty || 0) * Number(item.unit_cost || 0);
    return sum + base + Number(item.tax_amount || 0) - Number(item.discount_amount || 0);
  }, 0) + data.other_charges.reduce((sum, c) => sum + Number(c.amount || 0), 0);

  const submit = (e) => {
    e.preventDefault();
    mutation.runAction({
      key: 'vendor-bill-create',
      requireConfirm: true,
      confirmConfig: {
        title: 'Create Vendor Bill',
        message: 'Save this bill as draft?',
        confirmLabel: 'Save Draft',
        severity: 'info',
      },
      action: ({ onSuccess, onError, onFinish }) => {
        post(route('procurement.vendor-bills.store'), {
          onSuccess: () => {
            enqueueSnackbar('Vendor bill saved.', { variant: 'success' });
            onSuccess();
          },
          onError: (formErrors) => {
            const firstMessage = Object.values(formErrors || {}).flat().find((msg) => typeof msg === 'string' && msg.trim().length > 0);
            enqueueSnackbar(firstMessage || 'Failed to save vendor bill.', { variant: 'error' });
            onError(formErrors);
          },
          onFinish,
        });
      },
    });
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 2 }}>Create Vendor Bill</Typography>
      <Card>
        <CardContent>
          <form onSubmit={submit}>
            {billRequiresGrn ? (
              <Alert severity="info" sx={{ mb: 2 }}>
                Procurement policy is set to strict mode. A Goods Receipt is required for billing.
              </Alert>
            ) : null}

            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField select label="Vendor" value={data.vendor_id} onChange={(e) => setData('vendor_id', e.target.value)} error={!!errors.vendor_id} helperText={errors.vendor_id} fullWidth>
                  <MenuItem value="">Select Vendor</MenuItem>
                  {(vendors || []).map((vendor) => (
                    <MenuItem key={vendor.id} value={vendor.id}>{vendor.name}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  select
                  label={`Pending GRN${billRequiresGrn ? '' : ' (optional)'}`}
                  value={data.goods_receipt_id}
                  onChange={(e) => handleReceiptChange(e.target.value)}
                  error={!!errors.goods_receipt_id}
                  helperText={errors.goods_receipt_id || (selectedReceipt?.billable_summary
                    ? `Remaining qty: ${Number(selectedReceipt.billable_summary.remaining_qty || 0).toFixed(3)}`
                    : '')}
                  fullWidth
                  disabled={!data.vendor_id}
                >
                  {!billRequiresGrn ? <MenuItem value="">None</MenuItem> : null}
                  {filteredReceipts.map((row) => (
                    <MenuItem key={row.id} value={row.id}>
                      {row.grn_no} - {row.vendor?.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField label="Bill Date" type="date" value={data.bill_date} onChange={(e) => setData('bill_date', e.target.value)} error={!!errors.bill_date} helperText={errors.bill_date} InputLabelProps={{ shrink: true }} fullWidth />
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField label="Due Date" type="date" value={data.due_date} onChange={(e) => setData('due_date', e.target.value)} error={!!errors.due_date} helperText={errors.due_date} InputLabelProps={{ shrink: true }} inputProps={{ min: data.bill_date }} fullWidth />
              </Grid>
              <Grid item xs={12}>
                <TextField label="Remarks" value={data.remarks} onChange={(e) => setData('remarks', e.target.value)} error={!!errors.remarks} helperText={errors.remarks} fullWidth />
              </Grid>
            </Grid>
            {data.vendor_id && selectedVendorReceiptStatus ? (
              <Card sx={{ mt: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'grey.50' }}>
                <CardContent sx={{ py: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                    Vendor GRN Readiness
                  </Typography>
                  <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                    <Chip size="small" color="success" variant="outlined" label={`Billable: ${selectedVendorReceiptStatus.billable_count || 0}`} />
                    <Chip size="small" color="warning" variant="outlined" label={`Fully billed: ${selectedVendorReceiptStatus.fully_billed_count || 0}`} />
                    <Chip size="small" color="info" variant="outlined" label={`Pending acceptance: ${selectedVendorReceiptStatus.pending_acceptance_count || 0}`} />
                    <Chip size="small" variant="outlined" label={`Other: ${selectedVendorReceiptStatus.other_status_count || 0}`} />
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {selectedVendorReceiptStatus.message}
                  </Typography>
                </CardContent>
              </Card>
            ) : null}
            {data.vendor_id && filteredReceipts.length === 0 ? (
              <Alert severity="warning" sx={{ mt: 2 }}>
                {selectedVendorReceiptStatus?.message || 'No pending accepted GRN found for this vendor.'}
              </Alert>
            ) : null}
            {availableVendorAdvances.length > 0 ? (
              <Alert severity="info" sx={{ mt: 2 }}>
                Available advances: {availableVendorAdvances.map((advance) => (
                  `${advance.advance_no} (${formatAmount(advance.remaining_amount)}${advance.poLockMatch ? '' : ', PO lock mismatch'})`
                )).join(' · ')}
              </Alert>
            ) : null}

            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" sx={{ mb: 1, color: 'primary.main' }}>Items</Typography>
              {data.items.map((item, index) => (
                <Grid container spacing={2} key={index} sx={{ mb: 2 }}>
                  <Grid item xs={12} md={2}>
                    <TextField
                      label="Item"
                      value={item.inventory_item_id}
                      onChange={(e) => updateItem(index, 'inventory_item_id', e.target.value)}
                      error={!!errors[`items.${index}.inventory_item_id`]}
                      helperText={errors[`items.${index}.inventory_item_id`]}
                      disabled={billRequiresGrn}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField label="Description" value={item.description} onChange={(e) => updateItem(index, 'description', e.target.value)} fullWidth />
                  </Grid>
                  <Grid item xs={12} md={1.5}>
                    <TextField label="Qty" type="number" value={item.qty} onChange={(e) => updateItem(index, 'qty', e.target.value)} fullWidth />
                  </Grid>
                  <Grid item xs={12} md={1.5}>
                    <TextField label="Unit Cost" type="number" value={item.unit_cost} onChange={(e) => updateItem(index, 'unit_cost', e.target.value)} fullWidth />
                  </Grid>
                  <Grid item xs={12} md={1.5}>
                    <TextField label="Tax" type="number" value={item.tax_amount} onChange={(e) => updateItem(index, 'tax_amount', e.target.value)} fullWidth />
                  </Grid>
                  <Grid item xs={12} md={1.5}>
                    <TextField label="Discount" type="number" value={item.discount_amount} onChange={(e) => updateItem(index, 'discount_amount', e.target.value)} fullWidth />
                  </Grid>
                  <Grid item xs={12} md={1}>
                    <IconButton color="error" onClick={() => removeItem(index)} disabled={data.items.length <= 1}><DeleteOutline /></IconButton>
                  </Grid>
                </Grid>
              ))}
              {!billRequiresGrn ? <Button onClick={addItem}>Add Item</Button> : null}
            </Box>

            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" sx={{ mb: 1, color: 'primary.main' }}>Other Charges</Typography>
              {data.other_charges.map((charge, index) => (
                <Grid container spacing={2} key={index} sx={{ mb: 2 }}>
                  <Grid item xs={12} md={2}>
                    <TextField label="Account ID" value={charge.account_id} onChange={(e) => updateCharge(index, 'account_id', e.target.value)} fullWidth />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <TextField label="Party Vendor ID" value={charge.party_vendor_id} onChange={(e) => updateCharge(index, 'party_vendor_id', e.target.value)} fullWidth />
                  </Grid>
                  <Grid item xs={12} md={5}>
                    <TextField label="Description" value={charge.description} onChange={(e) => updateCharge(index, 'description', e.target.value)} fullWidth />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <TextField label="Amount" type="number" value={charge.amount} onChange={(e) => updateCharge(index, 'amount', e.target.value)} fullWidth />
                  </Grid>
                  <Grid item xs={12} md={1}>
                    <IconButton color="error" onClick={() => removeCharge(index)}><DeleteOutline /></IconButton>
                  </Grid>
                </Grid>
              ))}
              <Button onClick={addCharge}>Add Charge</Button>
            </Box>

            <Card sx={{ mt: 3, border: '1px solid', borderColor: 'divider' }}>
              <CardContent sx={{ py: 2 }}>
                <Typography variant="body2" color="text.secondary">Estimated Bill Total</Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>{formatAmount(grandTotal)}</Typography>
                <Chip
                  size="small"
                  label="Draft (non-posting)"
                  variant="outlined"
                  color="warning"
                  sx={{ mt: 1 }}
                />
              </CardContent>
            </Card>

            <Box sx={{ mt: 3 }}>
              <AppLoadingButton
                type="submit"
                variant="contained"
                loading={processing || mutation.isPending('vendor-bill-create')}
                loadingLabel="Saving..."
                disabled={billRequiresGrn && (!data.goods_receipt_id || filteredReceipts.length === 0)}
              >
                Save Draft
              </AppLoadingButton>
            </Box>
          </form>
        </CardContent>
      </Card>
      <ConfirmActionDialog {...mutation.confirmDialogProps} />
    </Box>
  );
}
