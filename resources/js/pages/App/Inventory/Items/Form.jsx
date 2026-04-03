import React from 'react';
import { router, useForm } from '@inertiajs/react';
import { Add, DeleteOutline } from '@mui/icons-material';
import { Box, Button, Card, CardContent, Grid, IconButton, MenuItem, TextField, Typography } from '@mui/material';
import POSLayout from '@/components/POSLayout';
import { isPosPath, routeNameForContext } from '@/lib/utils';

export default function InventoryItemForm({ inventoryItem, categories = [], manufacturers = [], units = [], coaAccounts = [], vendors = [] }) {
    const isEdit = Boolean(inventoryItem?.id);
    const { data, setData, post, put, processing, errors } = useForm({
        name: inventoryItem?.name || '',
        sku: inventoryItem?.sku || '',
        description: inventoryItem?.description || '',
        category_id: inventoryItem?.category_id || '',
        manufacturer_id: inventoryItem?.manufacturer_id || '',
        unit_id: inventoryItem?.unit_id || '',
        inventory_account_id: inventoryItem?.inventory_account_id || '',
        cogs_account_id: inventoryItem?.cogs_account_id || '',
        purchase_account_id: inventoryItem?.purchase_account_id || '',
        default_unit_cost: inventoryItem?.default_unit_cost || 0,
        minimum_stock: inventoryItem?.minimum_stock || 0,
        is_purchasable: inventoryItem?.is_purchasable ?? true,
        manage_stock: inventoryItem?.manage_stock ?? true,
        is_expiry_tracked: inventoryItem?.is_expiry_tracked ?? false,
        purchase_price_mode: inventoryItem?.purchase_price_mode || 'open',
        fixed_purchase_price: inventoryItem?.fixed_purchase_price || '',
        allow_price_override: inventoryItem?.allow_price_override ?? true,
        max_price_variance_percent: inventoryItem?.max_price_variance_percent || '',
        vendor_mappings: inventoryItem?.vendor_mappings?.map((mapping) => ({
            vendor_id: mapping.vendor_id,
            is_preferred: Boolean(mapping.is_preferred),
            is_active: Boolean(mapping.is_active ?? true),
            contract_price: mapping.contract_price || '',
            lead_time_days: mapping.lead_time_days || '',
            minimum_order_qty: mapping.minimum_order_qty || '',
            currency: mapping.currency || 'PKR',
        })) || [],
        status: inventoryItem?.status || 'active',
    });

    const addVendorMapping = () => {
        setData('vendor_mappings', [...data.vendor_mappings, {
            vendor_id: '',
            is_preferred: false,
            is_active: true,
            contract_price: '',
            lead_time_days: '',
            minimum_order_qty: '',
            currency: 'PKR',
        }]);
    };

    const updateVendorMapping = (index, field, value) => {
        const next = [...data.vendor_mappings];
        next[index] = { ...next[index], [field]: value };
        if (field === 'is_preferred' && value) {
            for (let i = 0; i < next.length; i += 1) {
                if (i !== index) {
                    next[i].is_preferred = false;
                }
            }
        }
        setData('vendor_mappings', next);
    };

    const removeVendorMapping = (index) => {
        setData('vendor_mappings', data.vendor_mappings.filter((_, idx) => idx !== index));
    };

    const submit = (event) => {
        event.preventDefault();
        if (isEdit) {
            put(route(routeNameForContext('inventory.update'), inventoryItem.id));
            return;
        }
        post(route(routeNameForContext('inventory.store')));
    };

    return (
        <Box sx={{ minHeight: '100vh', p: 2.5, backgroundColor: '#f5f5f5' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography sx={{ fontWeight: 700, fontSize: 30, color: '#063455' }}>{isEdit ? 'Edit Inventory Item' : 'Add Inventory Item'}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                        Create stock masters here. Products and recipes should reference these items instead of turning products into inventory records.
                    </Typography>
                </Box>
                <Button variant="outlined" onClick={() => router.visit(route(routeNameForContext('inventory.index')))} sx={{ textTransform: 'none' }}>
                    Back to Inventory Items
                </Button>
            </Box>

            <Card sx={{ borderRadius: 3 }}>
                <CardContent>
                    <form onSubmit={submit}>
                        <Grid container spacing={2.25}>
                            <Grid item xs={12} md={6}>
                                <TextField fullWidth label="Inventory Item Name" value={data.name} onChange={(e) => setData('name', e.target.value)} error={!!errors.name} helperText={errors.name} />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField fullWidth label="SKU / Item Code" value={data.sku} onChange={(e) => setData('sku', e.target.value)} error={!!errors.sku} helperText={errors.sku} />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField select fullWidth label="Category" value={data.category_id} onChange={(e) => setData('category_id', e.target.value)}>
                                    <MenuItem value="">None</MenuItem>
                                    {categories.map((category) => <MenuItem key={category.id} value={category.id}>{category.name}</MenuItem>)}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField select fullWidth label="Manufacturer" value={data.manufacturer_id} onChange={(e) => setData('manufacturer_id', e.target.value)}>
                                    <MenuItem value="">None</MenuItem>
                                    {manufacturers.map((manufacturer) => <MenuItem key={manufacturer.id} value={manufacturer.id}>{manufacturer.name}</MenuItem>)}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField select fullWidth label="Unit" value={data.unit_id} onChange={(e) => setData('unit_id', e.target.value)}>
                                    <MenuItem value="">None</MenuItem>
                                    {units.map((unit) => <MenuItem key={unit.id} value={unit.id}>{unit.name}</MenuItem>)}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField fullWidth type="number" label="Default Unit Cost" value={data.default_unit_cost} onChange={(e) => setData('default_unit_cost', e.target.value)} error={!!errors.default_unit_cost} helperText={errors.default_unit_cost} />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField fullWidth type="number" label="Minimum Stock" value={data.minimum_stock} onChange={(e) => setData('minimum_stock', e.target.value)} error={!!errors.minimum_stock} helperText={errors.minimum_stock} />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField select fullWidth label="Status" value={data.status} onChange={(e) => setData('status', e.target.value)} error={!!errors.status} helperText={errors.status}>
                                    <MenuItem value="active">Active</MenuItem>
                                    <MenuItem value="inactive">Inactive</MenuItem>
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField select fullWidth label="Inventory Account" value={data.inventory_account_id} onChange={(e) => setData('inventory_account_id', e.target.value)} error={!!errors.inventory_account_id} helperText={errors.inventory_account_id}>
                                    <MenuItem value="">None</MenuItem>
                                    {coaAccounts.map((account) => <MenuItem key={account.id} value={account.id}>{account.full_code} - {account.name}</MenuItem>)}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField select fullWidth label="COGS Account" value={data.cogs_account_id} onChange={(e) => setData('cogs_account_id', e.target.value)} error={!!errors.cogs_account_id} helperText={errors.cogs_account_id}>
                                    <MenuItem value="">None</MenuItem>
                                    {coaAccounts.map((account) => <MenuItem key={account.id} value={account.id}>{account.full_code} - {account.name}</MenuItem>)}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField select fullWidth label="Purchase Account" value={data.purchase_account_id} onChange={(e) => setData('purchase_account_id', e.target.value)} error={!!errors.purchase_account_id} helperText={errors.purchase_account_id}>
                                    <MenuItem value="">None</MenuItem>
                                    {coaAccounts.map((account) => <MenuItem key={account.id} value={account.id}>{account.full_code} - {account.name}</MenuItem>)}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField select fullWidth label="Expiry Tracking" value={data.is_expiry_tracked ? 'yes' : 'no'} onChange={(e) => setData('is_expiry_tracked', e.target.value === 'yes')}>
                                    <MenuItem value="no">Not Tracked</MenuItem>
                                    <MenuItem value="yes">Tracked by Batch</MenuItem>
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField select fullWidth label="Purchase Price Policy" value={data.purchase_price_mode} onChange={(e) => setData('purchase_price_mode', e.target.value)} error={!!errors.purchase_price_mode} helperText={errors.purchase_price_mode}>
                                    <MenuItem value="open">Open Price</MenuItem>
                                    <MenuItem value="fixed">Fixed Price</MenuItem>
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField fullWidth type="number" label="Fixed Purchase Price" value={data.fixed_purchase_price} onChange={(e) => setData('fixed_purchase_price', e.target.value)} error={!!errors.fixed_purchase_price} helperText={errors.fixed_purchase_price} disabled={data.purchase_price_mode !== 'fixed'} />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField select fullWidth label="Allow Price Override" value={data.allow_price_override ? 'yes' : 'no'} onChange={(e) => setData('allow_price_override', e.target.value === 'yes')} disabled={data.purchase_price_mode !== 'fixed'}>
                                    <MenuItem value="yes">Allowed</MenuItem>
                                    <MenuItem value="no">Blocked</MenuItem>
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField fullWidth type="number" label="Max Variance (%)" value={data.max_price_variance_percent} onChange={(e) => setData('max_price_variance_percent', e.target.value)} error={!!errors.max_price_variance_percent} helperText={errors.max_price_variance_percent} disabled={data.purchase_price_mode !== 'fixed' || !data.allow_price_override} />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField fullWidth multiline minRows={3} label="Description" value={data.description} onChange={(e) => setData('description', e.target.value)} />
                            </Grid>
                            <Grid item xs={12}>
                                <Box sx={{ border: '1px solid #e7ecf2', borderRadius: 2, p: 2 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                                        <Typography sx={{ fontWeight: 700, color: '#063455' }}>Vendor Mappings</Typography>
                                        <Button size="small" startIcon={<Add />} onClick={addVendorMapping}>Add Vendor</Button>
                                    </Box>
                                    {data.vendor_mappings.map((mapping, index) => (
                                        <Grid container spacing={1.25} key={index} sx={{ mb: 0.75 }}>
                                            <Grid item xs={12} md={4}>
                                                <TextField select fullWidth label="Vendor" value={mapping.vendor_id} onChange={(e) => updateVendorMapping(index, 'vendor_id', e.target.value)}>
                                                    <MenuItem value="">Select</MenuItem>
                                                    {vendors.map((vendor) => <MenuItem key={vendor.id} value={vendor.id}>{vendor.name}</MenuItem>)}
                                                </TextField>
                                            </Grid>
                                            <Grid item xs={12} md={2}>
                                                <TextField fullWidth type="number" label="Contract Price" value={mapping.contract_price} onChange={(e) => updateVendorMapping(index, 'contract_price', e.target.value)} />
                                            </Grid>
                                            <Grid item xs={12} md={2}>
                                                <TextField fullWidth type="number" label="Lead Days" value={mapping.lead_time_days} onChange={(e) => updateVendorMapping(index, 'lead_time_days', e.target.value)} />
                                            </Grid>
                                            <Grid item xs={12} md={2}>
                                                <TextField select fullWidth label="Preferred" value={mapping.is_preferred ? 'yes' : 'no'} onChange={(e) => updateVendorMapping(index, 'is_preferred', e.target.value === 'yes')}>
                                                    <MenuItem value="no">No</MenuItem>
                                                    <MenuItem value="yes">Yes</MenuItem>
                                                </TextField>
                                            </Grid>
                                            <Grid item xs={12} md={2} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                                                <IconButton onClick={() => removeVendorMapping(index)}><DeleteOutline /></IconButton>
                                            </Grid>
                                        </Grid>
                                    ))}
                                </Box>
                            </Grid>
                            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.25 }}>
                                <Button variant="outlined" onClick={() => router.visit(route(routeNameForContext('inventory.index')))} disabled={processing}>Cancel</Button>
                                <Button type="submit" variant="contained" disabled={processing} sx={{ backgroundColor: '#063455', textTransform: 'none' }}>
                                    {isEdit ? 'Update Inventory Item' : 'Create Inventory Item'}
                                </Button>
                            </Grid>
                        </Grid>
                    </form>
                </CardContent>
            </Card>
        </Box>
    );
}

InventoryItemForm.layout = (page) => (isPosPath(typeof window !== 'undefined' ? window.location.pathname : '') ? <POSLayout>{page}</POSLayout> : page);
