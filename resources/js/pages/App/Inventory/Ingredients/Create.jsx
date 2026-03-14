import React, { useState } from 'react';
import { Box, Typography, IconButton, Button, Card, CardContent, TextField, MenuItem, Grid, Alert } from '@mui/material';
import { Save as SaveIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { router } from '@inertiajs/react';
import { useForm } from '@inertiajs/react';
import POSLayout from "@/components/POSLayout";
import { routeNameForContext } from '@/lib/utils';

// const drawerWidthOpen = 240;
// const drawerWidthClosed = 110;

const CreateIngredient = () => {
    const [open, setOpen] = useState(true);
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        description: '',
        total_quantity: '',
        unit: 'grams',
        cost_per_unit: '',
        expiry_date: '',
        status: 'active',
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
        post(route(routeNameForContext('ingredients.store')), {
            onSuccess: () => {
                // Will redirect automatically on success
            },
        });
    };

    return (
        <>
            {/* <SideNav open={open} setOpen={setOpen} /> */}
            <div
                style={{
                    backgroundColor: '#f5f5f5',
                    padding: '20px',
                    minHeight: '100vh'
                }}
            >

                {/* Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <IconButton onClick={() => router.visit(route(routeNameForContext('ingredients.index')))}>
                        <ArrowBackIcon sx={{ color: '#063455' }} />
                    </IconButton>
                    <Typography sx={{ fontWeight: '600', fontSize: '30px', color: '#063455' }}>
                        Add New Ingredient
                    </Typography>
                </Box>

                {/* Form */}
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
                                    </TextField>
                                </Grid>

                                <Grid item xs={12}>
                                    <TextField fullWidth label="Description" multiline rows={3} value={data.description} onChange={(e) => setData('description', e.target.value)} error={!!errors.description} helperText={errors.description} />
                                </Grid>

                                {/* Quantity Information */}
                                <Grid item xs={12}>
                                    <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                                        Quantity & Unit
                                    </Typography>
                                </Grid>

                                <Grid item xs={12} md={4}>
                                    <TextField fullWidth label="Total Quantity" type="number" value={data.total_quantity} onChange={(e) => setData('total_quantity', e.target.value)} error={!!errors.total_quantity} helperText={errors.total_quantity} inputProps={{ min: 0, step: 0.01 }} required />
                                </Grid>

                                <Grid item xs={12} md={4}>
                                    <TextField fullWidth select label="Unit of Measurement" value={data.unit} onChange={(e) => setData('unit', e.target.value)} error={!!errors.unit} helperText={errors.unit}>
                                        {units.map((unit) => (
                                            <MenuItem key={unit.value} value={unit.value}>
                                                {unit.label}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                </Grid>

                                <Grid item xs={12} md={4}>
                                    <TextField fullWidth label="Cost per Unit (PKR)" type="number" value={data.cost_per_unit} onChange={(e) => setData('cost_per_unit', e.target.value)} error={!!errors.cost_per_unit} helperText={errors.cost_per_unit} inputProps={{ min: 0, step: 0.01 }} />
                                </Grid>

                                {/* Additional Information */}
                                <Grid item xs={12}>
                                    <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                                        Additional Information
                                    </Typography>
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <TextField fullWidth label="Expiry Date" type="date" value={data.expiry_date} onChange={(e) => setData('expiry_date', e.target.value)} error={!!errors.expiry_date} helperText={errors.expiry_date} InputLabelProps={{ shrink: true }} />
                                </Grid>

                                {/* Information Alert */}
                                <Grid item xs={12}>
                                    <Alert severity="info">
                                        <Typography variant="body2">
                                            <strong>Note:</strong> The remaining quantity will be automatically set to the total quantity. You can add more stock later or track usage when ingredients are used in products.
                                        </Typography>
                                    </Alert>
                                </Grid>

                                {/* Action Buttons */}
                                <Grid item xs={12}>
                                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
                                        <Button
                                            variant="outlined"
                                            onClick={() => router.visit(route(routeNameForContext('ingredients.index')))}
                                            disabled={processing}
                                            sx={{ textTransform: 'none', border: '1px solid #063455', borderRadius: '16px' }}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            variant="contained"
                                            // startIcon={<SaveIcon />}
                                            disabled={processing}
                                            sx={{
                                                backgroundColor: '#063455',
                                                textTransform: 'none',
                                                borderRadius: '16px'
                                            }}>
                                            {processing ? 'Creating...' : 'Create Ingredient'}
                                        </Button>
                                    </Box>
                                </Grid>
                            </Grid>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </>
    );
};

CreateIngredient.layout = (page) => <POSLayout>{page}</POSLayout>;
export default CreateIngredient;
