import React from 'react';
import { useForm } from '@inertiajs/react';
import { Box, Button, Card, CardContent, Grid, IconButton, MenuItem, TextField, Typography, Alert } from '@mui/material';
import { DeleteOutline } from '@mui/icons-material';

export default function Create({ receipt, vendors, receipts, procurementPolicy = {} }) {
  const billRequiresGrn = Boolean(procurementPolicy.bill_requires_grn ?? true);

  const presetItems = (receipt?.items || []).map((item) => ({
    inventory_item_id: item.inventory_item_id || '',
    description: item.inventory_item?.name || item.description || '',
    qty: item.qty_received || 1,
    unit_cost: item.unit_cost || 0,
    tax_amount: 0,
    discount_amount: 0,
  }));

  const { data, setData, post, processing, errors } = useForm({
    vendor_id: receipt?.vendor_id || '',
    goods_receipt_id: receipt?.id || '',
    bill_date: new Date().toISOString().slice(0, 10),
    due_date: '',
    remarks: '',
    items: presetItems.length > 0 ? presetItems : [{ inventory_item_id: '', description: '', qty: 1, unit_cost: 0, tax_amount: 0, discount_amount: 0 }],
    other_charges: [],
  });

  const selectedReceipt = React.useMemo(
    () => (receipts || []).find((row) => String(row.id) === String(data.goods_receipt_id)),
    [receipts, data.goods_receipt_id]
  );

  const handleReceiptChange = (value) => {
    const selected = (receipts || []).find((row) => String(row.id) === String(value));
    const nextItems = (selected?.items || []).map((item) => ({
      inventory_item_id: item.inventory_item_id || '',
      description: item.inventory_item?.name || '',
      qty: item.qty_received || 1,
      unit_cost: item.unit_cost || 0,
      tax_amount: 0,
      discount_amount: 0,
    }));

    setData('goods_receipt_id', value);
    setData('vendor_id', selected?.vendor_id || '');
    setData('items', nextItems.length > 0 ? nextItems : [{ inventory_item_id: '', description: '', qty: 1, unit_cost: 0, tax_amount: 0, discount_amount: 0 }]);
  };

  const updateItem = (index, field, value) => {
    const next = [...data.items];
    next[index] = { ...next[index], [field]: value };
    setData('items', next);
  };

  const addItem = () => {
    setData('items', [...data.items, { inventory_item_id: '', description: '', qty: 1, unit_cost: 0, tax_amount: 0, discount_amount: 0 }]);
  };

  const removeItem = (index) => {
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
    post(route('procurement.vendor-bills.store'));
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
                  {(vendors || []).map((vendor) => (
                    <MenuItem key={vendor.id} value={vendor.id}>{vendor.name}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  select
                  label={`Goods Receipt${billRequiresGrn ? '' : ' (optional)'}`}
                  value={data.goods_receipt_id}
                  onChange={(e) => handleReceiptChange(e.target.value)}
                  error={!!errors.goods_receipt_id}
                  helperText={errors.goods_receipt_id}
                  fullWidth
                >
                  {!billRequiresGrn ? <MenuItem value="">None</MenuItem> : null}
                  {(receipts || []).map((row) => (
                    <MenuItem key={row.id} value={row.id}>{row.grn_no} - {row.vendor?.name}</MenuItem>
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

            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" sx={{ mb: 1, color: 'primary.main' }}>Items</Typography>
              {data.items.map((item, index) => (
                <Grid container spacing={2} key={index} sx={{ mb: 2 }}>
                  <Grid item xs={12} md={2}>
                    <TextField
                      label="Item ID"
                      value={item.inventory_item_id}
                      onChange={(e) => updateItem(index, 'inventory_item_id', e.target.value)}
                      error={!!errors[`items.${index}.inventory_item_id`]}
                      helperText={errors[`items.${index}.inventory_item_id`]}
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
              <Button onClick={addItem}>Add Item</Button>
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
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>{Number(grandTotal || 0).toFixed(2)}</Typography>
              </CardContent>
            </Card>

            <Box sx={{ mt: 3 }}>
              <Button type="submit" variant="contained" disabled={processing}>Save Bill</Button>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
