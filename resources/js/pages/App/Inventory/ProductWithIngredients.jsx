import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Card, CardContent, TextField, MenuItem, Grid, Alert, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Autocomplete, Chip, Divider } from '@mui/material';
import { Save as SaveIcon, ArrowBack as BackIcon, Add as AddIcon, Delete as DeleteIcon, Warning as WarningIcon } from '@mui/icons-material';
import { router } from '@inertiajs/react';
import { useForm } from '@inertiajs/react';
import axios from 'axios';
import { routeNameForContext } from '@/lib/utils';

const ProductWithIngredients = ({ categories, product, id }) => {
    const [ingredients, setIngredients] = useState([]);
    const [selectedIngredients, setSelectedIngredients] = useState([]);
    const [availabilityCheck, setAvailabilityCheck] = useState(null);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: product?.name || '',
        menu_code: product?.menu_code || '',
        description: product?.description || '',
        category_id: product?.category_id || '',
        base_price: product?.base_price || '',
        cost_of_goods_sold: product?.cost_of_goods_sold || '',
        current_stock: product?.current_stock || '',
        minimal_stock: product?.minimal_stock || '',
        status: product?.status || 'active',
        available_order_types: product?.available_order_types || [],
        ingredients: product?.ingredients || [],
    });

    // Load available ingredients
    useEffect(() => {
        loadIngredients();
        if (product?.ingredients) {
            setSelectedIngredients(
                product.ingredients.map((ing) => ({
                    id: ing.id,
                    name: ing.name,
                    unit: ing.unit,
                    remaining_quantity: ing.remaining_quantity,
                    quantity_used: ing.pivot?.quantity_used || 0,
                    cost: ing.pivot?.cost || 0,
                })),
            );
        }
    }, []);

    const loadIngredients = async () => {
        try {
            const response = await axios.get(route(routeNameForContext('api.ingredients')));
            setIngredients(response.data);
        } catch (error) {
            console.error('Error loading ingredients:', error);
        }
    };

    // Add ingredient to product
    const addIngredient = (ingredient) => {
        if (!selectedIngredients.find((ing) => ing.id === ingredient.id)) {
            setSelectedIngredients([
                ...selectedIngredients,
                {
                    id: ingredient.id,
                    name: ingredient.name,
                    unit: ingredient.unit,
                    remaining_quantity: ingredient.remaining_quantity,
                    quantity_used: 0,
                    cost: 0,
                },
            ]);
        }
    };

    // Remove ingredient from product
    const removeIngredient = (ingredientId) => {
        setSelectedIngredients(selectedIngredients.filter((ing) => ing.id !== ingredientId));
    };

    // Update ingredient quantity
    const updateIngredientQuantity = (ingredientId, field, value) => {
        setSelectedIngredients(selectedIngredients.map((ing) => (ing.id === ingredientId ? { ...ing, [field]: parseFloat(value) || 0 } : ing)));
    };

    // Check ingredient availability
    const checkAvailability = async () => {
        if (selectedIngredients.length === 0) return;

        try {
            const response = await axios.post(route(routeNameForContext('api.ingredients.check-availability')), {
                ingredients: selectedIngredients.map((ing) => ({
                    id: ing.id,
                    quantity: ing.quantity_used * (data.current_stock || 1),
                })),
            });
            setAvailabilityCheck(response.data);
        } catch (error) {
            console.error('Error checking availability:', error);
        }
    };

    // Calculate total ingredient cost
    const calculateTotalIngredientCost = () => {
        return selectedIngredients.reduce((total, ing) => total + (ing.cost || 0), 0);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const formData = {
            ...data,
            ingredients: selectedIngredients.map((ing) => ({
                id: ing.id,
                quantity_used: ing.quantity_used,
                cost: ing.cost,
            })),
        };

        if (id) {
            put(route(routeNameForContext('inventory.update'), id), formData);
        } else {
            post(route(routeNameForContext('inventory.store')), formData);
        }
    };

    const orderTypes = [
        { value: 'dine_in', label: 'Dine In' },
        { value: 'takeaway', label: 'Takeaway' },
        { value: 'delivery', label: 'Delivery' },
    ];

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Button startIcon={<BackIcon />} onClick={() => router.visit(route(routeNameForContext('inventory.index')))} sx={{ mr: 2 }}>
                    Back to Products
                </Button>
                <Typography variant="h4" fontWeight="bold">
                    {id ? 'Edit Product' : 'Add New Product'}
                </Typography>
            </Box>

            <form onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                    {/* Basic Product Information */}
                    <Grid item xs={12}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Basic Information
                                </Typography>

                                <Grid container spacing={2}>
                                    <Grid item xs={12} md={6}>
                                        <TextField fullWidth label="Product Name" value={data.name} onChange={(e) => setData('name', e.target.value)} error={!!errors.name} helperText={errors.name} required />
                                    </Grid>

                                    <Grid item xs={12} md={6}>
                                        <TextField fullWidth label="Menu Code" value={data.menu_code} onChange={(e) => setData('menu_code', e.target.value)} error={!!errors.menu_code} helperText={errors.menu_code} />
                                    </Grid>

                                    <Grid item xs={12} md={6}>
                                        <TextField fullWidth select label="Category" value={data.category_id} onChange={(e) => setData('category_id', e.target.value)} error={!!errors.category_id} helperText={errors.category_id} required>
                                            {categories?.map((category) => (
                                                <MenuItem key={category.id} value={category.id}>
                                                    {category.name}
                                                </MenuItem>
                                            ))}
                                        </TextField>
                                    </Grid>

                                    <Grid item xs={12} md={6}>
                                        <TextField fullWidth select label="Status" value={data.status} onChange={(e) => setData('status', e.target.value)}>
                                            <MenuItem value="active">Active</MenuItem>
                                            <MenuItem value="inactive">Inactive</MenuItem>
                                        </TextField>
                                    </Grid>

                                    <Grid item xs={12}>
                                        <TextField fullWidth label="Description" multiline rows={3} value={data.description} onChange={(e) => setData('description', e.target.value)} error={!!errors.description} helperText={errors.description} />
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Pricing & Stock */}
                    <Grid item xs={12}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Pricing & Stock
                                </Typography>

                                <Grid container spacing={2}>
                                    <Grid item xs={12} md={3}>
                                        <TextField fullWidth label="Base Price (PKR)" type="number" value={data.base_price} onChange={(e) => setData('base_price', e.target.value)} error={!!errors.base_price} helperText={errors.base_price} inputProps={{ min: 0, step: 0.01 }} required />
                                    </Grid>

                                    <Grid item xs={12} md={3}>
                                        <TextField fullWidth label="Cost of Goods Sold (PKR)" type="number" value={data.cost_of_goods_sold} onChange={(e) => setData('cost_of_goods_sold', e.target.value)} error={!!errors.cost_of_goods_sold} helperText={errors.cost_of_goods_sold} inputProps={{ min: 0, step: 0.01 }} />
                                    </Grid>

                                    <Grid item xs={12} md={3}>
                                        <TextField fullWidth label="Current Stock" type="number" value={data.current_stock} onChange={(e) => setData('current_stock', e.target.value)} error={!!errors.current_stock} helperText={errors.current_stock} inputProps={{ min: 0 }} />
                                    </Grid>

                                    <Grid item xs={12} md={3}>
                                        <TextField fullWidth label="Minimal Stock" type="number" value={data.minimal_stock} onChange={(e) => setData('minimal_stock', e.target.value)} error={!!errors.minimal_stock} helperText={errors.minimal_stock} inputProps={{ min: 0 }} />
                                    </Grid>

                                    <Grid item xs={12}>
                                        <Autocomplete
                                            multiple
                                            options={orderTypes}
                                            getOptionLabel={(option) => option.label}
                                            value={orderTypes.filter((type) => data.available_order_types.includes(type.value))}
                                            onChange={(event, newValue) => {
                                                setData(
                                                    'available_order_types',
                                                    newValue.map((item) => item.value),
                                                );
                                            }}
                                            renderTags={(value, getTagProps) => value.map((option, index) => <Chip variant="outlined" label={option.label} {...getTagProps({ index })} />)}
                                            renderInput={(params) => <TextField {...params} label="Available Order Types" placeholder="Select order types" />}
                                        />
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Ingredients Section */}
                    <Grid item xs={12}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Typography variant="h6">Ingredients</Typography>
                                    <Button variant="outlined" onClick={checkAvailability} disabled={selectedIngredients.length === 0}>
                                        Check Availability
                                    </Button>
                                </Box>

                                {/* Add Ingredient */}
                                <Box sx={{ mb: 3 }}>
                                    <Autocomplete
                                        options={ingredients.filter((ing) => !selectedIngredients.find((sel) => sel.id === ing.id))}
                                        getOptionLabel={(option) => `${option.name} (${option.remaining_quantity} ${option.unit})`}
                                        onChange={(event, newValue) => {
                                            if (newValue) {
                                                addIngredient(newValue);
                                            }
                                        }}
                                        renderInput={(params) => <TextField {...params} label="Add Ingredient" placeholder="Search and select ingredients..." />}
                                    />
                                </Box>

                                {/* Availability Check Results */}
                                {availabilityCheck && (
                                    <Alert severity={availabilityCheck.all_available ? 'success' : 'warning'} sx={{ mb: 2 }}>
                                        {availabilityCheck.all_available ? 'All ingredients are available for the current stock quantity!' : 'Some ingredients may not have sufficient quantity!'}
                                    </Alert>
                                )}

                                {/* Selected Ingredients Table */}
                                {selectedIngredients.length > 0 && (
                                    <TableContainer component={Paper} variant="outlined">
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>
                                                        <strong>Ingredient</strong>
                                                    </TableCell>
                                                    <TableCell>
                                                        <strong>Available</strong>
                                                    </TableCell>
                                                    <TableCell>
                                                        <strong>Quantity Used</strong>
                                                    </TableCell>
                                                    <TableCell>
                                                        <strong>Cost (PKR)</strong>
                                                    </TableCell>
                                                    <TableCell>
                                                        <strong>Total Needed</strong>
                                                    </TableCell>
                                                    <TableCell>
                                                        <strong>Actions</strong>
                                                    </TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {selectedIngredients.map((ingredient) => {
                                                    const totalNeeded = ingredient.quantity_used * (data.current_stock || 1);
                                                    const hasEnough = ingredient.remaining_quantity >= totalNeeded;

                                                    return (
                                                        <TableRow key={ingredient.id}>
                                                            <TableCell>{ingredient.name}</TableCell>
                                                            <TableCell>
                                                                {ingredient.remaining_quantity} {ingredient.unit}
                                                            </TableCell>
                                                            <TableCell>
                                                                <TextField size="small" type="number" value={ingredient.quantity_used} onChange={(e) => updateIngredientQuantity(ingredient.id, 'quantity_used', e.target.value)} inputProps={{ min: 0, step: 0.01 }} sx={{ width: '100px' }} />
                                                                <Typography variant="caption" sx={{ ml: 1 }}>
                                                                    {ingredient.unit}
                                                                </Typography>
                                                            </TableCell>
                                                            <TableCell>
                                                                <TextField size="small" type="number" value={ingredient.cost} onChange={(e) => updateIngredientQuantity(ingredient.id, 'cost', e.target.value)} inputProps={{ min: 0, step: 0.01 }} sx={{ width: '100px' }} />
                                                            </TableCell>
                                                            <TableCell>
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                    {!hasEnough && <WarningIcon color="warning" fontSize="small" />}
                                                                    <Typography color={hasEnough ? 'text.primary' : 'warning.main'} variant="body2">
                                                                        {totalNeeded} {ingredient.unit}
                                                                    </Typography>
                                                                </Box>
                                                            </TableCell>
                                                            <TableCell>
                                                                <IconButton size="small" color="error" onClick={() => removeIngredient(ingredient.id)}>
                                                                    <DeleteIcon />
                                                                </IconButton>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                                <TableRow>
                                                    <TableCell colSpan={3}>
                                                        <strong>Total Ingredient Cost:</strong>
                                                    </TableCell>
                                                    <TableCell>
                                                        <strong>Rs {calculateTotalIngredientCost().toFixed(2)}</strong>
                                                    </TableCell>
                                                    <TableCell colSpan={2}></TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                )}

                                {selectedIngredients.length === 0 && <Alert severity="info">No ingredients selected. Add ingredients to track usage and costs.</Alert>}
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Action Buttons */}
                    <Grid item xs={12}>
                        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                            <Button variant="outlined" onClick={() => router.visit(route(routeNameForContext('inventory.index')))} disabled={processing}>
                                Cancel
                            </Button>
                            <Button type="submit" variant="contained" startIcon={<SaveIcon />} disabled={processing} sx={{ backgroundColor: '#063455' }}>
                                {processing ? 'Saving...' : id ? 'Update Product' : 'Create Product'}
                            </Button>
                        </Box>
                    </Grid>
                </Grid>
            </form>
        </Box>
    );
};

export default ProductWithIngredients;
