import React, { useState } from 'react';
import { Box, Typography, Button, Card, CardContent, TextField, MenuItem, Grid, Alert, IconButton, Stack } from '@mui/material';
import { Save as SaveIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { router } from '@inertiajs/react';
import { useForm } from '@inertiajs/react';
import SideNav from '@/components/App/SideBar/SideNav';
import POSLayout from "@/components/POSLayout";
import { isPosPath, routeNameForContext } from '@/lib/utils';

const drawerWidthOpen = 240;
const drawerWidthClosed = 110;

const EditIngredient = ({ ingredient, rawMaterialProducts = [] }) => {
    const posContext = isPosPath(typeof window !== 'undefined' ? window.location.pathname : '');
    const [open, setOpen] = useState(true);
    const { data, setData, put, processing, errors, reset } = useForm({
        name: ingredient.name || '',
        inventory_item_id: ingredient.inventory_item_id || '',
        description: ingredient.description || '',
        total_quantity: ingredient.total_quantity || '',
        unit: ingredient.unit || 'grams',
        cost_per_unit: ingredient.cost_per_unit || '',
        expiry_date: ingredient.expiry_date || '',
        status: ingredient.status || 'active',
    });

    const units = [
        { value: 'grams', label: 'Grams (g)' },
        { value: 'kilograms', label: 'Kilograms (kg)' },
        { value: 'liters', label: 'Liters (L)' },
        { value: 'milliliters', label: 'Milliliters (mL)' },
        { value: 'pieces', label: 'Pieces (pcs)' },
        { value: 'cups', label: 'Cups' },
        { value: 'tablespoons', label: 'Tablespoons (tbsp)' },
        { value: 'teaspoons', label: 'Teaspoons (tsp)' },
    ];

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route(routeNameForContext('ingredients.update'), ingredient.id), {
            onSuccess: () => {
                // Will redirect automatically on success
            },
        });
    };

    return (
        <>
            {posContext ? <SideNav open={open} setOpen={setOpen} /> : null}
            <div
                style={{
                    marginLeft: posContext ? (open ? `${drawerWidthOpen}px` : `${drawerWidthClosed}px`) : 0,
                    transition: 'margin-left 0.3s ease-in-out',
                    marginTop: posContext ? '5rem' : 0,
                    backgroundColor: '#f5f5f5',
                }}
            >
                <Box sx={{ p: 3 }}>
                    {/* Header */}
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <IconButton onClick={() => window.history.back()}>
                                <ArrowBackIcon sx={{ color: '#063455' }} />
                            </IconButton>
                            <Box>
                                <Typography variant="h5" sx={{ fontWeight: '600' }}>
                                    Edit Ingredient
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                    Link this ingredient to an Inventory Item when warehouse stock should drive usage and replenishment.
                                </Typography>
                            </Box>
                        </Box>
                        <Stack direction="row" spacing={1.25} useFlexGap flexWrap="wrap">
                            <Button variant="outlined" onClick={() => router.visit(route(routeNameForContext('inventory.index')))} sx={{ textTransform: 'none' }}>
                                View Inventory Items
                            </Button>
                            <Button variant="contained" onClick={() => router.visit(route(routeNameForContext('inventory.create')))} sx={{ backgroundColor: '#063455', textTransform: 'none' }}>
                                Create Inventory Item
                            </Button>
                        </Stack>
                    </Box>

                    <Card>
                        <CardContent>
                            <form onSubmit={handleSubmit}>
                                <Grid container spacing={3}>
                                    {/* Basic Information */}
                                    <Grid item xs={12}>
                                        <Typography variant="h6" gutterBottom>
                                            Basic Information
                                        </Typography>
                                    </Grid>

                                    <Grid item xs={12} md={6}>
                                        <TextField fullWidth label="Ingredient Name" value={data.name} onChange={(e) => setData('name', e.target.value)} error={!!errors.name} helperText={errors.name} required />
                                    </Grid>

                                    <Grid item xs={12} md={6}>
                                        <TextField fullWidth select label="Status" value={data.status} onChange={(e) => setData('status', e.target.value)} error={!!errors.status} helperText={errors.status}>
                                            <MenuItem value="active">Active</MenuItem>
                                            <MenuItem value="inactive">Inactive</MenuItem>
                                            <MenuItem value="expired">Expired</MenuItem>
                                        </TextField>
                                    </Grid>

                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            select
                                            label="Inventory Item"
                                            value={data.inventory_item_id}
                                            onChange={(e) => setData('inventory_item_id', e.target.value)}
                                            error={!!errors.inventory_item_id}
                                        helperText={errors.inventory_item_id || 'Link an inventory item when this ingredient should consume warehouse stock.'}
                                        >
                                            <MenuItem value="">Not linked yet</MenuItem>
                                            {rawMaterialProducts.map((inventoryItem) => (
                                                <MenuItem key={inventoryItem.id} value={inventoryItem.id}>
                                                    {inventoryItem.menu_code ? `${inventoryItem.menu_code} · ` : ''}{inventoryItem.name}
                                                </MenuItem>
                                            ))}
                                        </TextField>
                                    </Grid>

                                    <Grid item xs={12}>
                                        <Stack direction="row" spacing={1.25} useFlexGap flexWrap="wrap">
                                            <Button variant="outlined" size="small" onClick={() => router.visit(route(routeNameForContext('inventory.index')))} sx={{ textTransform: 'none' }}>
                                                Link Existing Inventory Item
                                            </Button>
                                            <Button variant="text" size="small" onClick={() => router.visit(route(routeNameForContext('inventory.create')))} sx={{ textTransform: 'none' }}>
                                                Create Inventory Item
                                            </Button>
                                        </Stack>
                                    </Grid>

                                    <Grid item xs={12}>
                                        <Alert severity={data.inventory_item_id ? 'info' : 'warning'}>
                                            {data.inventory_item_id
                                                ? 'This ingredient is linked to inventory. Stock should move through warehouse operations, not direct ingredient quantity edits.'
                                                : 'This ingredient is not linked to inventory yet, so it is still using manual ingredient quantities.'}
                                        </Alert>
                                    </Grid>

                                    <Grid item xs={12}>
                                        <TextField fullWidth label="Description" multiline rows={3} value={data.description} onChange={(e) => setData('description', e.target.value)} error={!!errors.description} helperText={errors.description} />
                                    </Grid>

                                    {/* Stock Information */}
                                    <Grid item xs={12}>
                                        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                                            Stock Information
                                        </Typography>
                                    </Grid>

                                    <Grid item xs={12} md={4}>
                                        <TextField fullWidth label="Total Quantity" type="number" value={data.total_quantity} onChange={(e) => setData('total_quantity', e.target.value)} error={!!errors.total_quantity} helperText={errors.total_quantity} inputProps={{ min: 0, step: 0.01 }} required />
                                    </Grid>

                                    <Grid item xs={12} md={4}>
                                        <TextField fullWidth select label="Unit" value={data.unit} onChange={(e) => setData('unit', e.target.value)} error={!!errors.unit} helperText={errors.unit} required>
                                            {units.map((unit) => (
                                                <MenuItem key={unit.value} value={unit.value}>
                                                    {unit.label}
                                                </MenuItem>
                                            ))}
                                        </TextField>
                                    </Grid>

                                    <Grid item xs={12} md={4}>
                                        <TextField fullWidth label="Cost Per Unit (PKR)" type="number" value={data.cost_per_unit} onChange={(e) => setData('cost_per_unit', e.target.value)} error={!!errors.cost_per_unit} helperText={errors.cost_per_unit} inputProps={{ min: 0, step: 0.01 }} />
                                    </Grid>

                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            fullWidth
                                            label="Expiry Date"
                                            type="date"
                                            value={data.expiry_date}
                                            onChange={(e) => setData('expiry_date', e.target.value)}
                                            error={!!errors.expiry_date}
                                            helperText={errors.expiry_date}
                                            InputLabelProps={{
                                                shrink: true,
                                            }}
                                        />
                                    </Grid>

                                    {/* Action Buttons */}
                                    <Grid item xs={12}>
                                        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                                            <Button variant="outlined" onClick={() => router.visit(route(routeNameForContext('ingredients.index')))} disabled={processing}>
                                                Cancel
                                            </Button>
                                            <Button type="submit" variant="contained" startIcon={<SaveIcon />} disabled={processing} sx={{ backgroundColor: '#063455' }}>
                                                {processing ? 'Updating...' : 'Update Ingredient'}
                                            </Button>
                                        </Box>
                                    </Grid>
                                </Grid>
                            </form>
                        </CardContent>
                    </Card>
                </Box>
            </div>
        </>
    );
};

EditIngredient.layout = (page) => (isPosPath(typeof window !== 'undefined' ? window.location.pathname : '') ? <POSLayout>{page}</POSLayout> : page);
export default EditIngredient;
