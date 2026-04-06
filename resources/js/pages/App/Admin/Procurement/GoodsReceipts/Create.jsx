import React from 'react';
import { useForm } from '@inertiajs/react';
import { Box, Button, Card, CardContent, Chip, Grid, MenuItem, TextField, Typography, Alert } from '@mui/material';
import { useSnackbar } from 'notistack';
import AppLoadingButton from '@/components/App/ui/AppLoadingButton';
import AppPage from '@/components/App/ui/AppPage';
import ConfirmActionDialog from '@/components/App/ui/ConfirmActionDialog';
import SurfaceCard from '@/components/App/ui/SurfaceCard';
import useMutationAction from '@/hooks/useMutationAction';

export default function Create({ purchaseOrder, purchaseOrders, prefillError = null, acceptanceWorkflowEnabled = true }) {
  const { enqueueSnackbar } = useSnackbar();
  const mutation = useMutationAction();
  const selectedOrder = purchaseOrder || null;
const defaultItems = selectedOrder?.items?.map((item) => ({
    purchase_order_item_id: item.id,
    inventory_item_id: item.resolved_inventory_item_id || item.inventory_item_id || item.product_id || '',
    qty_ordered: item.qty_ordered || 0,
    qty_received_before: item.qty_received || 0,
    qty_available: Math.max(0, Number(item.qty_ordered || 0) - Number(item.qty_received || 0)),
    qty_received: Math.max(0, Number(item.qty_ordered || 0) - Number(item.qty_received || 0)),
    unit_cost: item.unit_cost,
    product_name: item.inventory_item?.name || item.product?.name || `Inventory Item #${item.inventory_item_id || item.product_id}`,
    mapping_issue: item.mapping_issue || '',
  })) || [];

  const { data, setData, post, processing, errors } = useForm({
    purchase_order_id: purchaseOrder?.id || '',
    warehouse_location_id: '',
    received_date: new Date().toISOString().slice(0, 10),
    remarks: '',
    items: defaultItems,
  });

  const orders = purchaseOrders || [];
  const currentOrder = React.useMemo(
    () => orders.find((order) => String(order.id) === String(data.purchase_order_id)),
    [orders, data.purchase_order_id]
  );
  const currentLocations = currentOrder?.warehouse?.locations || [];

  const handleOrderChange = (value) => {
    const nextOrder = orders.find((order) => String(order.id) === String(value));
    const nextItems = (nextOrder?.items || []).map((item) => ({
      purchase_order_item_id: item.id,
      inventory_item_id: item.resolved_inventory_item_id || item.inventory_item_id || item.product_id || '',
      qty_ordered: item.qty_ordered || 0,
      qty_received_before: item.qty_received || 0,
      qty_available: Math.max(0, Number(item.qty_ordered || 0) - Number(item.qty_received || 0)),
      qty_received: Math.max(0, Number(item.qty_ordered || 0) - Number(item.qty_received || 0)),
      unit_cost: item.unit_cost,
      product_name: item.inventory_item?.name || item.product?.name || `Inventory Item #${item.inventory_item_id || item.product_id}`,
      mapping_issue: item.mapping_issue || '',
    }));

    setData('purchase_order_id', value);
    setData('warehouse_location_id', nextOrder?.warehouse?.locations?.find((location) => location.is_primary)?.id || '');
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
  const unresolvedLines = data.items.filter((item) => !item.inventory_item_id || item.mapping_issue);

  React.useEffect(() => {
    if (prefillError) {
      enqueueSnackbar(prefillError, { variant: 'warning' });
    }
  }, [enqueueSnackbar, prefillError]);

  return (
    <AppPage eyebrow="Procurement" title="Create Goods Receipt" subtitle="Receive stock into a restaurant warehouse and internal location while preserving procurement and accounting linkage.">
      <SurfaceCard title="Receipt Details" subtitle="Select the purchase order, warehouse location, and actual received quantities.">
          {orders.length === 0 && (
            <Box sx={{ py: 3 }}>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                No approved purchase orders are available for receiving yet.
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                Approve a purchase order first, then return here to create the GRN.
              </Typography>
            </Box>
          )}
          {orders.length > 0 && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              mutation.runAction({
                key: 'grn-create',
                requireConfirm: true,
                confirmConfig: {
                  title: 'Submit GRN',
                  message: 'Submit this GRN for requester acceptance?',
                  confirmLabel: 'Submit',
                  severity: 'warning',
                },
                action: ({ onSuccess, onError, onFinish }) => {
                  post(route('procurement.goods-receipts.store'), {
                    onSuccess: () => {
                      onSuccess();
                      enqueueSnackbar('GRN submitted for acceptance.', { variant: 'success' });
                    },
                    onError: (formErrors) => {
                      const firstMessage = Object.values(formErrors || {}).flat().find((msg) => typeof msg === 'string' && msg.trim().length > 0);
                      enqueueSnackbar(firstMessage || 'Failed to create GRN. Please review the form.', { variant: 'error' });
                      onError(formErrors);
                    },
                    onFinish,
                  });
                },
              });
            }}
          >
            {prefillError ? <Alert severity="warning" sx={{ mb: 2 }}>{prefillError}</Alert> : null}
            {errors.error ? <Alert severity="error" sx={{ mb: 2 }}>{errors.error}</Alert> : null}
            {unresolvedLines.length > 0 ? (
              <Alert severity="error" sx={{ mb: 2 }}>
                {unresolvedLines.length} PO line(s) have invalid inventory mapping. Fix mapping before GRN submission.
              </Alert>
            ) : null}
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
              <Grid item xs={12} md={4}>
                <TextField
                  select
                  label="Warehouse Location"
                  value={data.warehouse_location_id}
                  onChange={(e) => setData('warehouse_location_id', e.target.value)}
                  error={!!errors.warehouse_location_id}
                  helperText={errors.warehouse_location_id || 'Choose the internal location that will receive the stock.'}
                  fullWidth
                >
                  <MenuItem value="">No specific location</MenuItem>
                  {currentLocations.map((location) => (
                    <MenuItem key={location.id} value={location.id}>
                      {location.code} - {location.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField
                  label="Status"
                  value={acceptanceWorkflowEnabled ? 'pending_acceptance' : 'received'}
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
                    Vendor: {currentOrder.vendor?.name || '-'} | Warehouse: {currentOrder.warehouse?.name || '-'} | Restaurant: {currentOrder.tenant?.name || currentOrder.warehouse?.tenant?.name || '-'} | PO Date: {currentOrder.order_date || '-'}
                  </Typography>
                  {currentLocations.length > 0 && (
                    <Grid container spacing={1} sx={{ mt: 1 }}>
                      {currentLocations.map((location) => (
                        <Grid item key={location.id}>
                          <Chip
                            size="small"
                            label={`${location.code} · ${location.name}`}
                            color={location.is_primary ? 'primary' : 'default'}
                            variant={location.is_primary ? 'filled' : 'outlined'}
                          />
                        </Grid>
                      ))}
                    </Grid>
                  )}
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
                      label="Inventory Item"
                      value={item.product_name || `Inventory Item #${item.inventory_item_id}`}
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
                      label="Available Qty"
                      value={Number(item.qty_available ?? (Number(item.qty_ordered || 0) - Number(item.qty_received_before || 0)))}
                      fullWidth
                      disabled
                    />
                  </Grid>
                  <Grid item xs={12} md={1}>
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
                  <Grid item xs={12} md={1}>
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
                  {item.mapping_issue ? (
                    <Grid item xs={12}>
                      <Alert severity="warning">{item.mapping_issue}</Alert>
                    </Grid>
                  ) : null}
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
              <AppLoadingButton
                type="submit"
                variant="contained"
                loading={processing || mutation.isPending('grn-create')}
                loadingLabel="Submitting..."
                disabled={!data.purchase_order_id || data.items.length === 0 || unresolvedLines.length > 0}
              >
                Submit GRN
              </AppLoadingButton>
            </Box>
          </form>
          )}
      </SurfaceCard>
      <ConfirmActionDialog {...mutation.confirmDialogProps} />
    </AppPage>
  );
}
