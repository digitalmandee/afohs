import React from 'react';
import { useForm } from '@inertiajs/react';
import { Box, Button, Card, CardContent, Grid, MenuItem, TextField, Typography } from '@mui/material';

export default function Create({ purchaseOrder, purchaseOrders }) {
  const selectedOrder = purchaseOrder || null;
  const defaultItems = selectedOrder?.items?.map((item) => ({
    purchase_order_item_id: item.id,
    product_id: item.product_id,
    qty_ordered: item.qty_ordered || 0,
    qty_received_before: item.qty_received || 0,
    qty_received: Math.max(0, Number(item.qty_ordered || 0) - Number(item.qty_received || 0)),
    unit_cost: item.unit_cost,
    product_name: item.product?.name || `Product #${item.product_id}`,
  })) || [];

  const { data, setData, post, processing, errors } = useForm({
    purchase_order_id: purchaseOrder?.id || '',
    received_date: new Date().toISOString().slice(0, 10),
    remarks: '',
    items: defaultItems,
  });

  const orders = purchaseOrders || [];
  const currentOrder = React.useMemo(
    () => orders.find((order) => String(order.id) === String(data.purchase_order_id)),
    [orders, data.purchase_order_id]
  );

  const handleOrderChange = (value) => {
    const nextOrder = orders.find((order) => String(order.id) === String(value));
    const nextItems = (nextOrder?.items || []).map((item) => ({
      purchase_order_item_id: item.id,
      product_id: item.product_id,
      qty_ordered: item.qty_ordered || 0,
      qty_received_before: item.qty_received || 0,
      qty_received: Math.max(0, Number(item.qty_ordered || 0) - Number(item.qty_received || 0)),
      unit_cost: item.unit_cost,
      product_name: item.product?.name || `Product #${item.product_id}`,
    }));

    setData('purchase_order_id', value);
    setData('items', nextItems);
  };

  const updateItem = (index, field, value) => {
    const next = [...data.items];
    next[index] = { ...next[index], [field]: value };
    setData('items', next);
  };

  const totalValue = data.items.reduce(
    (sum, item) => sum + Number(item.qty_received || 0) * Number(item.unit_cost || 0),
    0
  );

  const submit = (e) => {
    e.preventDefault();
    post(route('procurement.goods-receipts.store'));
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 2 }}>Create Goods Receipt</Typography>
      <Card>
        <CardContent>
          <form onSubmit={submit}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={7}>
                <TextField
                  select
                  label="Purchase Order"
                  value={data.purchase_order_id}
                  onChange={(e) => handleOrderChange(e.target.value)}
                  error={!!errors.purchase_order_id}
                  helperText={errors.purchase_order_id}
                  fullWidth
                >
                  {orders.map((order) => (
                    <MenuItem key={order.id} value={order.id}>
                      {order.po_no} - {order.vendor?.name} ({order.warehouse?.name})
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  label="Received Date"
                  type="date"
                  value={data.received_date}
                  onChange={(e) => setData('received_date', e.target.value)}
                  error={!!errors.received_date}
                  helperText={errors.received_date}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField
                  label="Status"
                  value="received"
                  fullWidth
                  disabled
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

            {currentOrder && (
              <Card sx={{ mt: 2, border: '1px solid', borderColor: 'divider' }}>
                <CardContent sx={{ py: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Vendor: {currentOrder.vendor?.name || '-'} | Warehouse: {currentOrder.warehouse?.name || '-'} | PO Date: {currentOrder.order_date || '-'}
                  </Typography>
                </CardContent>
              </Card>
            )}

            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" sx={{ mb: 1, color: 'primary.main' }}>Items</Typography>
              {data.items.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  Select a purchase order to load items.
                </Typography>
              )}
              {data.items.map((item, index) => (
                <Grid container spacing={2} key={index} sx={{ mb: 2 }}>
                  <Grid item xs={12} md={4}>
                    <TextField
                      label="Product"
                      value={item.product_name || `Product #${item.product_id}`}
                      fullWidth
                      disabled
                    />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <TextField
                      label="Ordered Qty"
                      value={Number(item.qty_ordered || 0)}
                      fullWidth
                      disabled
                    />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <TextField
                      label="Previously Received"
                      value={Number(item.qty_received_before || 0)}
                      fullWidth
                      disabled
                    />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <TextField
                      label="Qty Received"
                      type="number"
                      value={item.qty_received}
                      onChange={(e) => updateItem(index, 'qty_received', e.target.value)}
                      error={!!errors[`items.${index}.qty_received`]}
                      helperText={errors[`items.${index}.qty_received`]}
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
                </Grid>
              ))}
            </Box>

            <Card sx={{ mt: 3, border: '1px solid', borderColor: 'divider' }}>
              <CardContent sx={{ py: 2 }}>
                <Typography variant="body2" color="text.secondary">Estimated Receipt Value</Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
                  {Number(totalValue || 0).toFixed(2)}
                </Typography>
              </CardContent>
            </Card>

            <Box sx={{ mt: 3 }}>
              <Button type="submit" variant="contained" disabled={processing || !data.purchase_order_id || data.items.length === 0}>
                Save GRN
              </Button>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
