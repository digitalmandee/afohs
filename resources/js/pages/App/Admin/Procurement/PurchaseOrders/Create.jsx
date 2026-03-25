import React from 'react';
import { useForm } from '@inertiajs/react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  MenuItem,
  IconButton,
  TextField,
  Typography,
  Stack,
} from '@mui/material';
import { DeleteOutline } from '@mui/icons-material';

export default function Create({ vendors, warehouses, products, inventorySummary = {} }) {
  const { data, setData, post, processing, errors } = useForm({
    vendor_id: '',
    warehouse_id: '',
    order_date: new Date().toISOString().slice(0, 10),
    expected_date: '',
    currency: 'PKR',
    remarks: '',
    items: [{ inventory_item_id: '', qty_ordered: 1, unit_cost: 0 }],
  });

  const productMap = React.useMemo(() => {
    const map = new Map();
    (products || []).forEach((product) => map.set(Number(product.id), product));
    return map;
  }, [products]);

  const updateItem = (index, field, value) => {
    const items = [...data.items];
    items[index] = { ...items[index], [field]: value };

    if (field === 'inventory_item_id') {
      const selected = productMap.get(Number(value));
      if (selected) {
        items[index].unit_cost = Number(selected.base_price ?? selected.price ?? 0) || 0;
      }
    }

    setData('items', items);
  };

  const addItem = () => {
    setData('items', [...data.items, { inventory_item_id: '', qty_ordered: 1, unit_cost: 0 }]);
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
  const warehouseStockForProduct = React.useCallback((product) => {
    if (!product || !data.warehouse_id) return null;
    return Number(product.stock_by_warehouse?.[String(data.warehouse_id)] ?? 0);
  }, [data.warehouse_id]);

  const submit = (e) => {
    e.preventDefault();
    post(route('procurement.purchase-orders.store'));
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 2 }}>Create Purchase Order</Typography>
      <Card>
        <CardContent>
          {errors.error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errors.error}
            </Alert>
          )}
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
                    <MenuItem key={w.id} value={w.id} disabled={w.status !== 'active'}>
                      {w.name}{w.tenant ? ` · ${w.tenant.name}` : ' · Shared'}
                      {w.status !== 'active' ? ' (Inactive)' : ''}
                    </MenuItem>
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
              {products.length === 0 && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {inventorySummary.empty_reason || 'No stock-managed raw-material inventory items are ready for purchasing yet.'}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    Create an Inventory Item first, then mark it purchasable so it can appear in Purchase Orders.
                  </Typography>
                  <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 1.5 }}>
                    <Button size="small" variant="contained" onClick={() => window.location.href = route('inventory.items.create')}>
                      Add Inventory Item
                    </Button>
                    <Button size="small" variant="outlined" onClick={() => window.location.href = route('inventory.ingredients.index')}>
                      Review Ingredients
                    </Button>
                  </Stack>
                </Alert>
              )}
              {inventorySummary.legacy_only_ingredients > 0 && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  {inventorySummary.legacy_only_ingredients} ingredient{inventorySummary.legacy_only_ingredients === 1 ? '' : 's'} are not linked to inventory items yet, so they will not appear in Purchase Orders or warehouse stock until linked.
                </Alert>
              )}
              {data.items.map((item, index) => (
                <Grid container spacing={2} key={index} sx={{ mb: 2 }}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      select
                      label="Inventory Item"
                      value={item.inventory_item_id}
                      onChange={(e) => updateItem(index, 'inventory_item_id', e.target.value)}
                      fullWidth
                    >
                      {products.length === 0 && <MenuItem value="" disabled>No items available</MenuItem>}
                      {products.map((p) => (
                        <MenuItem key={p.id} value={p.id}>
                          {p.menu_code ? `${p.menu_code} · ` : ''}{p.name}
                          {p.unit_name ? ` · ${p.unit_name}` : ''}
                        </MenuItem>
                      ))}
                    </TextField>
                    {(() => {
                      const selected = productMap.get(Number(item.inventory_item_id));
                      if (!selected) return null;
                      const currentWarehouseStock = warehouseStockForProduct(selected);

                      return (
                        <Box sx={{ mt: 1, display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                          {selected.unit_name ? (
                            <Chip size="small" variant="outlined" label={`Unit: ${selected.unit_name}`} />
                          ) : null}
                          <Chip size="small" variant="outlined" label={`Total on hand: ${Number(selected.stock_on_hand_total || 0).toFixed(3)}`} />
                          {currentWarehouseStock !== null ? (
                            <Chip
                              size="small"
                              color="primary"
                              variant="outlined"
                              label={`In ${selectedWarehouse?.name || 'warehouse'}: ${currentWarehouseStock.toFixed(3)}`}
                            />
                          ) : null}
                          {selected.linked_ingredient_count > 0 ? (
                            <Chip
                              size="small"
                              color="secondary"
                              variant="outlined"
                              label={`Feeds ${selected.linked_ingredient_count} ingredient${selected.linked_ingredient_count === 1 ? '' : 's'}`}
                            />
                          ) : (
                            <Chip size="small" variant="outlined" label="No linked ingredients yet" />
                          )}
                        </Box>
                      );
                    })()}
                    {(() => {
                      const selected = productMap.get(Number(item.inventory_item_id));
                      if (!selected || !selected.linked_ingredient_names?.length) return null;

                      return (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
                          Linked ingredients: {selected.linked_ingredient_names.join(', ')}
                        </Typography>
                      );
                    })()}
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
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Inventory items available: {inventorySummary.product_count || 0} · Linked ingredients: {inventorySummary.linked_ingredients || 0} · Not linked to inventory: {inventorySummary.legacy_only_ingredients || 0}
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
