import React from 'react';
import { Link, useForm } from '@inertiajs/react';
import {
    Alert,
    Box,
    Button,
    Chip,
    Grid,
    IconButton,
    MenuItem,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { Add, DeleteOutline } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import AppPage from '@/components/App/ui/AppPage';
import SurfaceCard from '@/components/App/ui/SurfaceCard';
import { compactDateActionBar, compactDateFieldSx, compactDateTextFieldProps } from '@/components/App/ui/dateFieldStyles';

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

    const selectedWarehouse = React.useMemo(
        () => (warehouses || []).find((warehouse) => String(warehouse.id) === String(data.warehouse_id)),
        [warehouses, data.warehouse_id],
    );

    const warehouseStockForProduct = React.useCallback(
        (product) => {
            if (!product || !data.warehouse_id) return null;
            return Number(product.stock_by_warehouse?.[String(data.warehouse_id)] ?? 0);
        },
        [data.warehouse_id],
    );

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
            data.items.filter((_, idx) => idx !== index),
        );
    };

    const totalAmount = data.items.reduce((sum, item) => sum + Number(item.qty_ordered || 0) * Number(item.unit_cost || 0), 0);

    const submit = (event) => {
        event.preventDefault();
        post(route('procurement.purchase-orders.store'));
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <AppPage
                eyebrow="Procurement"
                title="Create Purchase Order"
                subtitle="Create a draft purchase order from inventory-controlled stock items with clearer procurement context and cleaner item entry."
                actions={[
                    <Button key="back" component={Link} href={route('procurement.purchase-orders.index')} variant="outlined">
                        Back to Orders
                    </Button>,
                ]}
            >
                {errors.error ? <Alert severity="error">{errors.error}</Alert> : null}

                <form onSubmit={submit}>
                    <Stack spacing={2.25}>
                        <SurfaceCard title="Order Details" subtitle="Choose the vendor, warehouse, and procurement dates before adding line items.">
                            <Grid container spacing={1.5}>
                                <Grid item xs={12} md={4}>
                                    <TextField
                                        select
                                        size="small"
                                        label="Vendor"
                                        value={data.vendor_id}
                                        onChange={(event) => setData('vendor_id', event.target.value)}
                                        error={!!errors.vendor_id}
                                        helperText={errors.vendor_id}
                                        fullWidth
                                    >
                                        {vendors.map((vendor) => (
                                            <MenuItem key={vendor.id} value={vendor.id}>
                                                {vendor.name}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <TextField
                                        select
                                        size="small"
                                        label="Warehouse"
                                        value={data.warehouse_id}
                                        onChange={(event) => setData('warehouse_id', event.target.value)}
                                        error={!!errors.warehouse_id}
                                        helperText={errors.warehouse_id}
                                        fullWidth
                                    >
                                        {warehouses.map((warehouse) => (
                                            <MenuItem key={warehouse.id} value={warehouse.id} disabled={warehouse.status !== 'active'}>
                                                {warehouse.name}
                                                {warehouse.tenant ? ` · ${warehouse.tenant.name}` : ' · Shared'}
                                                {warehouse.status !== 'active' ? ' (Inactive)' : ''}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                </Grid>
                                <Grid item xs={12} md={2}>
                                    <DatePicker
                                        label="Order Date"
                                        value={data.order_date ? dayjs(data.order_date) : null}
                                        onChange={(nextValue) => setData('order_date', nextValue ? nextValue.format('YYYY-MM-DD') : '')}
                                        format="DD/MM/YYYY"
                                        slotProps={{
                                            textField: { ...compactDateTextFieldProps, error: !!errors.order_date, helperText: errors.order_date },
                                            actionBar: compactDateActionBar,
                                        }}
                                        sx={compactDateFieldSx}
                                    />
                                </Grid>
                                <Grid item xs={12} md={2}>
                                    <DatePicker
                                        label="Expected Date"
                                        value={data.expected_date ? dayjs(data.expected_date) : null}
                                        onChange={(nextValue) => setData('expected_date', nextValue ? nextValue.format('YYYY-MM-DD') : '')}
                                        format="DD/MM/YYYY"
                                        slotProps={{
                                            textField: { ...compactDateTextFieldProps, error: !!errors.expected_date, helperText: errors.expected_date },
                                            actionBar: compactDateActionBar,
                                        }}
                                        sx={compactDateFieldSx}
                                    />
                                </Grid>
                                <Grid item xs={12} md={3}>
                                    <TextField
                                        size="small"
                                        label="Currency"
                                        value={data.currency}
                                        onChange={(event) => setData('currency', event.target.value)}
                                        error={!!errors.currency}
                                        helperText={errors.currency}
                                        fullWidth
                                    />
                                </Grid>
                                <Grid item xs={12} md={9}>
                                    <TextField
                                        size="small"
                                        label="Remarks"
                                        value={data.remarks}
                                        onChange={(event) => setData('remarks', event.target.value)}
                                        error={!!errors.remarks}
                                        helperText={errors.remarks}
                                        fullWidth
                                    />
                                </Grid>
                                {selectedWarehouse ? (
                                    <Grid item xs={12}>
                                        <Alert severity="info" variant="outlined">
                                            Restaurant scope will be inherited from <strong>{selectedWarehouse.name}</strong>: {selectedWarehouse.tenant?.name || 'Shared / global warehouse'}.
                                        </Alert>
                                    </Grid>
                                ) : null}
                            </Grid>
                        </SurfaceCard>

                        <SurfaceCard
                            title="PO Items"
                            subtitle="Add purchasable inventory items, adjust quantity and cost, and keep warehouse stock context visible while building the PO."
                            actions={
                                <Button startIcon={<Add />} onClick={addItem} variant="outlined">
                                    Add Item
                                </Button>
                            }
                        >
                            {products.length === 0 ? (
                                <Alert severity="info" sx={{ mb: 2 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                        {inventorySummary.empty_reason || 'No stock-managed raw-material inventory items are ready for purchasing yet.'}
                                    </Typography>
                                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                                        Create an inventory item first, then mark it purchasable so it can appear in purchase orders.
                                    </Typography>
                                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 1.5 }}>
                                        <Button size="small" variant="contained" component={Link} href={route('inventory.items.create')}>
                                            Add Inventory Item
                                        </Button>
                                        <Button size="small" variant="outlined" component={Link} href={route('inventory.ingredients.index')}>
                                            Review Ingredients
                                        </Button>
                                    </Stack>
                                </Alert>
                            ) : null}

                            {inventorySummary.legacy_only_ingredients > 0 ? (
                                <Alert severity="warning" sx={{ mb: 2 }}>
                                    {inventorySummary.legacy_only_ingredients} ingredient{inventorySummary.legacy_only_ingredients === 1 ? '' : 's'} are still not linked to inventory items, so they will not appear in purchase orders until linked.
                                </Alert>
                            ) : null}

                            <Stack spacing={1.5}>
                                {data.items.map((item, index) => {
                                    const selected = productMap.get(Number(item.inventory_item_id));
                                    const currentWarehouseStock = warehouseStockForProduct(selected);

                                    return (
                                        <Box
                                            key={index}
                                            sx={{
                                                border: '1px solid rgba(226,232,240,0.95)',
                                                borderRadius: '14px',
                                                p: 1.5,
                                                backgroundColor: '#fff',
                                            }}
                                        >
                                            <Grid container spacing={1.5} alignItems="flex-start">
                                                <Grid item xs={12} md={5}>
                                                    <TextField
                                                        select
                                                        size="small"
                                                        label="Inventory Item"
                                                        value={item.inventory_item_id}
                                                        onChange={(event) => updateItem(index, 'inventory_item_id', event.target.value)}
                                                        error={!!errors[`items.${index}.inventory_item_id`]}
                                                        helperText={errors[`items.${index}.inventory_item_id`]}
                                                        fullWidth
                                                    >
                                                        {products.length === 0 ? <MenuItem value="" disabled>No items available</MenuItem> : null}
                                                        {products.map((product) => (
                                                            <MenuItem key={product.id} value={product.id}>
                                                                {product.menu_code ? `${product.menu_code} · ` : ''}
                                                                {product.name}
                                                                {product.unit_name ? ` · ${product.unit_name}` : ''}
                                                            </MenuItem>
                                                        ))}
                                                    </TextField>
                                                    {selected ? (
                                                        <>
                                                            <Box sx={{ mt: 1, display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                                                                {selected.unit_name ? <Chip size="small" variant="outlined" label={`Unit: ${selected.unit_name}`} /> : null}
                                                                <Chip size="small" variant="outlined" label={`Total on hand: ${Number(selected.stock_on_hand_total || 0).toFixed(3)}`} />
                                                                {currentWarehouseStock !== null ? (
                                                                    <Chip size="small" color="primary" variant="outlined" label={`In ${selectedWarehouse?.name || 'warehouse'}: ${currentWarehouseStock.toFixed(3)}`} />
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
                                                            {selected.linked_ingredient_names?.length ? (
                                                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
                                                                    Linked ingredients: {selected.linked_ingredient_names.join(', ')}
                                                                </Typography>
                                                            ) : null}
                                                        </>
                                                    ) : null}
                                                </Grid>
                                                <Grid item xs={12} md={2}>
                                                    <TextField
                                                        size="small"
                                                        label="Qty"
                                                        type="number"
                                                        value={item.qty_ordered}
                                                        onChange={(event) => updateItem(index, 'qty_ordered', event.target.value)}
                                                        error={!!errors[`items.${index}.qty_ordered`]}
                                                        helperText={errors[`items.${index}.qty_ordered`]}
                                                        fullWidth
                                                    />
                                                </Grid>
                                                <Grid item xs={12} md={2}>
                                                    <TextField
                                                        size="small"
                                                        label="Unit Cost"
                                                        type="number"
                                                        value={item.unit_cost}
                                                        onChange={(event) => updateItem(index, 'unit_cost', event.target.value)}
                                                        error={!!errors[`items.${index}.unit_cost`]}
                                                        helperText={errors[`items.${index}.unit_cost`]}
                                                        fullWidth
                                                    />
                                                </Grid>
                                                <Grid item xs={12} md={2}>
                                                    <TextField
                                                        size="small"
                                                        label="Line Total"
                                                        value={(Number(item.qty_ordered || 0) * Number(item.unit_cost || 0)).toFixed(2)}
                                                        fullWidth
                                                        disabled
                                                    />
                                                </Grid>
                                                <Grid item xs={12} md={1} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'center' }, pt: { md: 0.5 } }}>
                                                    <IconButton color="error" onClick={() => removeItem(index)} disabled={data.items.length <= 1}>
                                                        <DeleteOutline />
                                                    </IconButton>
                                                </Grid>
                                            </Grid>
                                        </Box>
                                    );
                                })}
                            </Stack>
                        </SurfaceCard>

                        <SurfaceCard title="PO Summary" subtitle="Review the estimated value before saving the draft purchase order.">
                            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }}>
                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        Estimated Grand Total
                                    </Typography>
                                    <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main' }}>
                                        {Number(totalAmount || 0).toFixed(2)}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                                        Inventory items available: {inventorySummary.product_count || 0} · Linked ingredients: {inventorySummary.linked_ingredients || 0} · Not linked to inventory: {inventorySummary.legacy_only_ingredients || 0}
                                    </Typography>
                                </Box>
                                <Stack direction="row" spacing={1.25} useFlexGap flexWrap="wrap">
                                    <Button component={Link} href={route('procurement.purchase-orders.index')} variant="outlined">
                                        Cancel
                                    </Button>
                                    <Button type="submit" variant="contained" disabled={processing}>
                                        {processing ? 'Saving…' : 'Save PO'}
                                    </Button>
                                </Stack>
                            </Stack>
                        </SurfaceCard>
                    </Stack>
                </form>
            </AppPage>
        </LocalizationProvider>
    );
}
