import React from 'react';
import { useForm } from '@inertiajs/react';
import { Box, Button, Card, CardContent, Grid, IconButton, MenuItem, TextField, Typography } from '@mui/material';
import { DeleteOutline } from '@mui/icons-material';

export default function Create({ receipt, vendors, receipts }) {
  const presetItems = (receipt?.items || []).map((item) => ({
    description: item.product?.name || item.description || '',
    qty: item.qty_received || 1,
    unit_cost: item.unit_cost || 0,
  }));

  const { data, setData, post, processing, errors } = useForm({
    vendor_id: receipt?.vendor_id || '',
    goods_receipt_id: receipt?.id || '',
    bill_date: new Date().toISOString().slice(0, 10),
    due_date: '',
    remarks: '',
    items: presetItems.length > 0 ? presetItems : [{ description: '', qty: 1, unit_cost: 0 }],
  });

  const selectedReceipt = React.useMemo(
    () => (receipts || []).find((row) => String(row.id) === String(data.goods_receipt_id)),
    [receipts, data.goods_receipt_id]
  );

  const handleReceiptChange = (value) => {
    const selected = (receipts || []).find((row) => String(row.id) === String(value));
    const nextItems = (selected?.items || []).map((item) => ({
      description: item.product?.name || '',
      qty: item.qty_received || 1,
      unit_cost: item.unit_cost || 0,
    }));

    setData('goods_receipt_id', value);
    setData('vendor_id', selected?.vendor_id || '');
    setData('items', nextItems.length > 0 ? nextItems : [{ description: '', qty: 1, unit_cost: 0 }]);
  };

  const addItem = () => {
    setData('items', [...data.items, { description: '', qty: 1, unit_cost: 0 }]);
  };

  const removeItem = (index) => {
    setData(
      'items',
      data.items.filter((_, idx) => idx !== index)
    );
  };

  const updateItem = (index, field, value) => {
    const next = [...data.items];
    next[index] = { ...next[index], [field]: value };
    setData('items', next);
  };

  const grandTotal = data.items.reduce(
    (sum, item) => sum + Number(item.qty || 0) * Number(item.unit_cost || 0),
    0
  );

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
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField
                  select
                  label="Vendor"
                  value={data.vendor_id}
                  onChange={(e) => setData('vendor_id', e.target.value)}
                  error={!!errors.vendor_id}
                  helperText={errors.vendor_id}
                  fullWidth
                >
                  {(vendors || []).map((vendor) => (
                    <MenuItem key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  select
                  label="Goods Receipt (optional)"
                  value={data.goods_receipt_id}
                  onChange={(e) => handleReceiptChange(e.target.value)}
                  fullWidth
                >
                  <MenuItem value="">None</MenuItem>
                  {(receipts || []).map((row) => (
                    <MenuItem key={row.id} value={row.id}>
                      {row.grn_no} - {row.vendor?.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField
                  label="Bill Date"
                  type="date"
                  value={data.bill_date}
                  onChange={(e) => setData('bill_date', e.target.value)}
                  error={!!errors.bill_date}
                  helperText={errors.bill_date}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField
                  label="Due Date"
                  type="date"
                  value={data.due_date}
                  onChange={(e) => setData('due_date', e.target.value)}
                  error={!!errors.due_date}
                  helperText={errors.due_date}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ min: data.bill_date }}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Remarks"
                  value={data.remarks}
                  onChange={(e) => setData('remarks', e.target.value)}
                  error={!!errors.remarks}
                  helperText={errors.remarks}
                  fullWidth
                />
              </Grid>
            </Grid>

            {selectedReceipt && (
              <Card sx={{ mt: 2, border: '1px solid', borderColor: 'divider' }}>
                <CardContent sx={{ py: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Linked GRN: {selectedReceipt.grn_no} | Vendor: {selectedReceipt.vendor?.name || '-'} | Date: {selectedReceipt.received_date || '-'}
                  </Typography>
                </CardContent>
              </Card>
            )}

            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" sx={{ mb: 1, color: 'primary.main' }}>Items</Typography>
              {data.items.map((item, index) => (
                <Grid container spacing={2} key={index} sx={{ mb: 2 }}>
                  <Grid item xs={12} md={5}>
                    <TextField
                      label="Description"
                      value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                      error={!!errors[`items.${index}.description`]}
                      helperText={errors[`items.${index}.description`]}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <TextField
                      label="Qty"
                      type="number"
                      value={item.qty}
                      onChange={(e) => updateItem(index, 'qty', e.target.value)}
                      error={!!errors[`items.${index}.qty`]}
                      helperText={errors[`items.${index}.qty`]}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <TextField
                      label="Unit Cost"
                      type="number"
                      value={item.unit_cost}
                      onChange={(e) => updateItem(index, 'unit_cost', e.target.value)}
                      error={!!errors[`items.${index}.unit_cost`]}
                      helperText={errors[`items.${index}.unit_cost`]}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <TextField
                      label="Line Total"
                      value={(Number(item.qty || 0) * Number(item.unit_cost || 0)).toFixed(2)}
                      fullWidth
                      disabled
                    />
                  </Grid>
                  <Grid item xs={12} md={1} sx={{ display: 'flex', alignItems: 'center' }}>
                    <IconButton color="error" onClick={() => removeItem(index)} disabled={data.items.length <= 1}>
                      <DeleteOutline />
                    </IconButton>
                  </Grid>
                </Grid>
              ))}
              <Button onClick={addItem}>Add Item</Button>
            </Box>

            <Card sx={{ mt: 3, border: '1px solid', borderColor: 'divider' }}>
              <CardContent sx={{ py: 2 }}>
                <Typography variant="body2" color="text.secondary">Estimated Bill Total</Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
                  {Number(grandTotal || 0).toFixed(2)}
                </Typography>
              </CardContent>
            </Card>

            <Box sx={{ mt: 3 }}>
              <Button type="submit" variant="contained" disabled={processing}>
                Save Bill
              </Button>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
