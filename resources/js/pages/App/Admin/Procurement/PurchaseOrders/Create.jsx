import React from 'react';
import { useForm } from '@inertiajs/react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  MenuItem,
  IconButton,
  TextField,
  Typography,
} from '@mui/material';
import { DeleteOutline } from '@mui/icons-material';

export default function Create({ vendors, warehouses, products }) {
  const { data, setData, post, processing, errors } = useForm({
    vendor_id: '',
    warehouse_id: '',
    order_date: new Date().toISOString().slice(0, 10),
    expected_date: '',
    currency: 'PKR',
    remarks: '',
    items: [{ product_id: '', qty_ordered: 1, unit_cost: 0 }],
  });

  const productMap = React.useMemo(() => {
    const map = new Map();
    (products || []).forEach((product) => map.set(Number(product.id), product));
    return map;
  }, [products]);

  const updateItem = (index, field, value) => {
    const items = [...data.items];
    items[index] = { ...items[index], [field]: value };

    if (field === 'product_id') {
      const selected = productMap.get(Number(value));
      if (selected) {
        items[index].unit_cost = selected.price || 0;
      }
    }

    setData('items', items);
  };

  const addItem = () => {
    setData('items', [...data.items, { product_id: '', qty_ordered: 1, unit_cost: 0 }]);
  };

  const removeItem = (index) => {
    setData(
      'items',
      data.items.filter((_, idx) => idx !== index)
    );
  };

  const totalAmount = data.items.reduce(
    (sum, item) => sum + Number(item.qty_ordered || 0) * Number(item.unit_cost || 0),
    0
  );
  const selectedWarehouse = React.useMemo(
    () => (warehouses || []).find((warehouse) => String(warehouse.id) === String(data.warehouse_id)),
    [warehouses, data.warehouse_id]
  );

  const submit = (e) => {
    e.preventDefault();
    post(route('procurement.purchase-orders.store'));
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 2 }}>Create Purchase Order</Typography>
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
                  {vendors.map((v) => (
                    <MenuItem key={v.id} value={v.id}>{v.name}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  select
                  label="Warehouse"
                  value={data.warehouse_id}
                  onChange={(e) => setData('warehouse_id', e.target.value)}
                  error={!!errors.warehouse_id}
                  helperText={errors.warehouse_id}
                  fullWidth
                >
                  {warehouses.map((w) => (
                    <MenuItem key={w.id} value={w.id}>{w.name}{w.tenant ? ` · ${w.tenant.name}` : ''}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField
                  label="Order Date"
                  type="date"
                  value={data.order_date}
                  onChange={(e) => setData('order_date', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField
                  label="Expected"
                  type="date"
                  value={data.expected_date}
                  onChange={(e) => setData('expected_date', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Remarks"
                  value={data.remarks}
                  onChange={(e) => setData('remarks', e.target.value)}
                  fullWidth
                />
              </Grid>
              {selectedWarehouse && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Restaurant scope will be set from the selected warehouse: {selectedWarehouse.tenant?.name || 'Shared / global warehouse'}.
                  </Typography>
                </Grid>
              )}
            </Grid>

            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" sx={{ mb: 1 }}>Items</Typography>
              {data.items.map((item, index) => (
                <Grid container spacing={2} key={index} sx={{ mb: 2 }}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      select
                      label="Product"
                      value={item.product_id}
                      onChange={(e) => updateItem(index, 'product_id', e.target.value)}
                      fullWidth
                    >
                      {products.map((p) => (
                        <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      label="Qty"
                      type="number"
                      value={item.qty_ordered}
                      onChange={(e) => updateItem(index, 'qty_ordered', e.target.value)}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <TextField
                      label="Unit Cost"
                      type="number"
                      value={item.unit_cost}
                      onChange={(e) => updateItem(index, 'unit_cost', e.target.value)}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <TextField
                      label="Line Total"
                      value={(Number(item.qty_ordered || 0) * Number(item.unit_cost || 0)).toFixed(2)}
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
                <Typography variant="body2" color="text.secondary">Estimated Grand Total</Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
                  {Number(totalAmount || 0).toFixed(2)}
                </Typography>
              </CardContent>
            </Card>

            <Box sx={{ mt: 3 }}>
              <Button type="submit" variant="contained" disabled={processing}>
                Save PO
              </Button>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
