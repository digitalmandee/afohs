import React, { useState } from 'react';
import { Box, Typography, Button, Card, CardContent, IconButton, TextField, Grid, Alert, Divider } from '@mui/material';
import { Save as SaveIcon, ArrowBack as ArrowBackIcon, Add as AddIcon } from '@mui/icons-material';
import { router } from '@inertiajs/react';
import { useForm } from '@inertiajs/react';
import SideNav from '@/components/App/SideBar/SideNav';
import { routeNameForContext } from '@/lib/utils';

const drawerWidthOpen = 240;
const drawerWidthClosed = 110;

const AddStock = ({ ingredient }) => {
    const [open, setOpen] = useState(true);
    const { data, setData, post, processing, errors, reset } = useForm({
        quantity: '',
        cost_per_unit: ingredient.cost_per_unit || '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route(routeNameForContext('ingredients.add-stock'), ingredient.id), {
            onSuccess: () => {
                // Will redirect automatically on success
            },
        });
    };

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-PK', {
            style: 'currency',
            currency: 'PKR',
        })
            .format(amount)
            .replace('PKR', 'Rs');
    };

    return (
        <>
            <SideNav open={open} setOpen={setOpen} />
            <div
                style={{
                    marginLeft: open ? `${drawerWidthOpen}px` : `${drawerWidthClosed}px`,
                    transition: 'margin-left 0.3s ease-in-out',
                    marginTop: '5rem',
                    backgroundColor: '#f5f5f5'
                }}
            >
                <Box sx={{ p: 3 }}>
                    {/* Header */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        <IconButton onClick={() => window.history.back()}>
                            <ArrowBackIcon sx={{ color: '#063455' }} />
                        </IconButton>
                        <Typography variant="h5" sx={{fontWeight:'600'}}>
                            Add Stock - {ingredient.name}
                        </Typography>
                    </Box>

                    <Grid container spacing={3}>
                        {/* Current Stock Info */}
                        <Grid item xs={12} md={4}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        Current Stock Information
                                    </Typography>
                                    <Divider sx={{ mb: 2 }} />

                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            Ingredient Name
                                        </Typography>
                                        <Typography variant="body1" fontWeight="medium">
                                            {ingredient.name}
                                        </Typography>
                                    </Box>

                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            Current Total Quantity
                                        </Typography>
                                        <Typography variant="h6" color="primary">
                                            {ingredient.total_quantity} {ingredient.unit}
                                        </Typography>
                                    </Box>

                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            Remaining Quantity
                                        </Typography>
                                        <Typography variant="h6" color={ingredient.remaining_quantity <= 0 ? 'error' : 'success'}>
                                            {ingredient.remaining_quantity} {ingredient.unit}
                                        </Typography>
                                    </Box>

                                    <Box>
                                        <Typography variant="body2" color="text.secondary">
                                            Current Cost Per Unit
                                        </Typography>
                                        <Typography variant="body1" fontWeight="medium">
                                            {ingredient.cost_per_unit ? formatCurrency(ingredient.cost_per_unit) : 'Not set'}
                                        </Typography>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Add Stock Form */}
                        <Grid item xs={12} md={8}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        Add New Stock
                                    </Typography>
                                    <Divider sx={{ mb: 3 }} />

                                    <form onSubmit={handleSubmit}>
                                        <Grid container spacing={3}>
                                            <Grid item xs={12}>
                                                <Alert severity="info" sx={{ mb: 2 }}>
                                                    Adding stock will increase both total quantity and remaining quantity by the amount specified.
                                                </Alert>
                                            </Grid>

                                            <Grid item xs={12} md={6}>
                                                <TextField
                                                    fullWidth
                                                    label={`Quantity to Add (${ingredient.unit})`}
                                                    type="number"
                                                    value={data.quantity}
                                                    onChange={(e) => setData('quantity', e.target.value)}
                                                    error={!!errors.quantity}
                                                    helperText={errors.quantity || `Enter the amount in ${ingredient.unit} to add to stock`}
                                                    inputProps={{ min: 0.01, step: 0.01 }}
                                                    required
                                                />
                                            </Grid>

                                            <Grid item xs={12} md={6}>
                                                <TextField
                                                    fullWidth
                                                    label="Update Cost Per Unit (PKR) - Optional"
                                                    type="number"
                                                    value={data.cost_per_unit}
                                                    onChange={(e) => setData('cost_per_unit', e.target.value)}
                                                    error={!!errors.cost_per_unit}
                                                    helperText={errors.cost_per_unit || 'Leave empty to keep current cost'}
                                                    inputProps={{ min: 0, step: 0.01 }}
                                                />
                                            </Grid>

                                            {/* Preview */}
                                            {data.quantity && (
                                                <Grid item xs={12}>
                                                    <Card variant="outlined" sx={{ backgroundColor: '#f8f9fa' }}>
                                                        <CardContent>
                                                            <Typography variant="subtitle1" gutterBottom>
                                                                Stock Update Preview
                                                            </Typography>
                                                            <Grid container spacing={2}>
                                                                <Grid item xs={6}>
                                                                    <Typography variant="body2" color="text.secondary">
                                                                        New Total Quantity
                                                                    </Typography>
                                                                    <Typography variant="body1" fontWeight="bold" color="primary">
                                                                        {(parseFloat(ingredient.total_quantity) + parseFloat(data.quantity || 0)).toFixed(2)} {ingredient.unit}
                                                                    </Typography>
                                                                </Grid>
                                                                <Grid item xs={6}>
                                                                    <Typography variant="body2" color="text.secondary">
                                                                        New Remaining Quantity
                                                                    </Typography>
                                                                    <Typography variant="body1" fontWeight="bold" color="success">
                                                                        {(parseFloat(ingredient.remaining_quantity) + parseFloat(data.quantity || 0)).toFixed(2)} {ingredient.unit}
                                                                    </Typography>
                                                                </Grid>
                                                            </Grid>
                                                        </CardContent>
                                                    </Card>
                                                </Grid>
                                            )}

                                            {/* Action Buttons */}
                                            <Grid item xs={12}>
                                                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                                                    <Button variant="outlined" onClick={() => router.visit(route(routeNameForContext('ingredients.index')))} disabled={processing}>
                                                        Cancel
                                                    </Button>
                                                    <Button type="submit" variant="contained" startIcon={<AddIcon />} disabled={processing} sx={{ backgroundColor: '#063455' }}>
                                                        {processing ? 'Adding Stock...' : 'Add Stock'}
                                                    </Button>
                                                </Box>
                                            </Grid>
                                        </Grid>
                                    </form>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </Box>
            </div>
        </>
    );
};

AddStock.layout = (page) => page;
export default AddStock;
