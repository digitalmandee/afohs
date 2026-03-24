import React from 'react';
import { router, useForm } from '@inertiajs/react';
import { Box, Button, Card, CardContent, Grid, MenuItem, TextField, Typography } from '@mui/material';
import POSLayout from '@/components/POSLayout';
import { routeNameForContext } from '@/lib/utils';

export default function InventoryItemForm({ inventoryItem, categories = [], manufacturers = [], units = [] }) {
    const isEdit = Boolean(inventoryItem?.id);
    const { data, setData, post, put, processing, errors } = useForm({
        name: inventoryItem?.name || '',
        sku: inventoryItem?.sku || '',
        description: inventoryItem?.description || '',
        category_id: inventoryItem?.category_id || '',
        manufacturer_id: inventoryItem?.manufacturer_id || '',
        unit_id: inventoryItem?.unit_id || '',
        default_unit_cost: inventoryItem?.default_unit_cost || 0,
        minimum_stock: inventoryItem?.minimum_stock || 0,
        is_purchasable: inventoryItem?.is_purchasable ?? true,
        manage_stock: inventoryItem?.manage_stock ?? true,
        status: inventoryItem?.status || 'active',
    });

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
                            <Grid item xs={12}>
                                <TextField fullWidth multiline minRows={3} label="Description" value={data.description} onChange={(e) => setData('description', e.target.value)} />
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

InventoryItemForm.layout = (page) => <POSLayout>{page}</POSLayout>;
