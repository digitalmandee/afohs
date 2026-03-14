import React, { useState } from 'react';
import { Box, Typography, Button, Card, CardContent, Grid, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Divider, IconButton } from '@mui/material';
import { ArrowBack as ArrowBackIcon, Edit as EditIcon, Add as AddIcon } from '@mui/icons-material';
import { router } from '@inertiajs/react';
import SideNav from '@/components/App/SideBar/SideNav';
import { routeNameForContext } from '@/lib/utils';

const drawerWidthOpen = 240;
const drawerWidthClosed = 110;

const ShowIngredient = ({ ingredient }) => {
    const [open, setOpen] = useState(true);

    // Get status color
    const getStatusColor = (status) => {
        switch (status) {
            case 'active':
                return 'success';
            case 'inactive':
                return 'default';
            case 'expired':
                return 'error';
            default:
                return 'default';
        }
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

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    return (
        <>
            <SideNav open={open} setOpen={setOpen} />
            <div
                style={{
                    marginLeft: open ? `${drawerWidthOpen}px` : `${drawerWidthClosed}px`,
                    transition: 'margin-left 0.3s ease-in-out',
                    marginTop: '5rem',
                    backgroundColor: '#f5f5f5',
                }}
            >
                <Box sx={{ p: 3 }}>
                    {/* Header */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <IconButton onClick={() => window.history.back()}>
                                <ArrowBackIcon sx={{ color: '#063455' }} />
                            </IconButton>
                            <Typography variant="h5" sx={{ fontWeight: '600' }}>
                                {ingredient.name}
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <Button variant="outlined" startIcon={<EditIcon />} onClick={() => router.visit(route(routeNameForContext('ingredients.edit'), ingredient.id))}>
                                Edit Ingredient
                            </Button>
                            <Button variant="contained" startIcon={<AddIcon />} onClick={() => router.visit(route(routeNameForContext('ingredients.add-stock.form'), ingredient.id))} sx={{ backgroundColor: '#063455' }}>
                                Add Stock
                            </Button>
                        </Box>
                    </Box>

                    <Grid container spacing={3}>
                        {/* Basic Information */}
                        <Grid item xs={12} md={8}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        Basic Information
                                    </Typography>
                                    <Divider sx={{ mb: 2 }} />

                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={6}>
                                            <Typography variant="body2" color="text.secondary">
                                                Name
                                            </Typography>
                                            <Typography variant="body1" fontWeight="medium">
                                                {ingredient.name}
                                            </Typography>
                                        </Grid>

                                        <Grid item xs={12} sm={6}>
                                            <Typography variant="body2" color="text.secondary">
                                                Status
                                            </Typography>
                                            <Chip label={ingredient.status} color={getStatusColor(ingredient.status)} size="small" sx={{ mt: 0.5 }} />
                                        </Grid>

                                        <Grid item xs={12}>
                                            <Typography variant="body2" color="text.secondary">
                                                Description
                                            </Typography>
                                            <Typography variant="body1">{ingredient.description || 'No description provided'}</Typography>
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Stock Information */}
                        <Grid item xs={12} md={4}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        Stock Information
                                    </Typography>
                                    <Divider sx={{ mb: 2 }} />

                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            Total Quantity
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

                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            Cost Per Unit
                                        </Typography>
                                        <Typography variant="body1" fontWeight="medium">
                                            {formatCurrency(ingredient.cost_per_unit)}
                                        </Typography>
                                    </Box>

                                    <Box>
                                        <Typography variant="body2" color="text.secondary">
                                            Expiry Date
                                        </Typography>
                                        <Typography variant="body1">{formatDate(ingredient.expiry_date)}</Typography>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Used in Products */}
                        {ingredient.products && ingredient.products.length > 0 && (
                            <Grid item xs={12}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom>
                                            Used in Products
                                        </Typography>
                                        <Divider sx={{ mb: 2 }} />

                                        <TableContainer component={Paper} variant="outlined">
                                            <Table>
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell>
                                                            <strong>Product Name</strong>
                                                        </TableCell>
                                                        <TableCell>
                                                            <strong>Quantity Used</strong>
                                                        </TableCell>
                                                        <TableCell>
                                                            <strong>Cost</strong>
                                                        </TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {ingredient.products.map((product) => (
                                                        <TableRow key={product.id}>
                                                            <TableCell>{product.name}</TableCell>
                                                            <TableCell>
                                                                {product.pivot.quantity_used} {ingredient.unit}
                                                            </TableCell>
                                                            <TableCell>{formatCurrency(product.pivot.cost)}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    </CardContent>
                                </Card>
                            </Grid>
                        )}
                    </Grid>
                </Box>
            </div>
        </>
    );
};

ShowIngredient.layout = (page) => page;
export default ShowIngredient;
