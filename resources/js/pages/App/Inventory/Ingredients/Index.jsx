import React, { useState } from 'react';
import { Box, Typography, Button, Card, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, TextField, MenuItem, Grid, InputAdornment, IconButton, Tooltip } from '@mui/material';
import { Add as AddIcon, Search as SearchIcon, Edit as EditIcon, Delete as DeleteIcon, Visibility as ViewIcon, AddBox as AddStockIcon, Warning as WarningIcon, CheckCircle as CheckCircleIcon } from '@mui/icons-material';
import { router } from '@inertiajs/react';
import POSLayout from "@/components/POSLayout";
import { routeNameForContext } from '@/lib/utils';

// const drawerWidthOpen = 240;
// const drawerWidthClosed = 110;

const IngredientsIndex = ({ ingredients, stats, filters }) => {
    // const [open, setOpen] = useState(true);
    const [searchQuery, setSearchQuery] = useState(filters?.search || '');
    const [statusFilter, setStatusFilter] = useState(filters?.status || 'all');
    const [stockFilter, setStockFilter] = useState(filters?.stock_level || 'all');

    // Handle search
    const handleSearch = () => {
        const params = new URLSearchParams();
        if (searchQuery) params.set('search', searchQuery);
        if (statusFilter !== 'all') params.set('status', statusFilter);
        if (stockFilter !== 'all') params.set('stock_level', stockFilter);

        router.visit(`${route(routeNameForContext('ingredients.index'))}?${params.toString()}`);
    };

    // Handle filter reset
    const handleReset = () => {
        setSearchQuery('');
        setStatusFilter('all');
        setStockFilter('all');
        router.visit(route(routeNameForContext('ingredients.index')));
    };

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

    // Get stock level color and icon
    const getStockInfo = (remaining, total) => {
        const percentage = (remaining / total) * 100;
        if (remaining <= 0) {
            return { color: 'error', icon: <WarningIcon />, text: 'Out of Stock' };
        } else if (percentage <= 20) {
            return { color: 'warning', icon: <WarningIcon />, text: 'Low Stock' };
        } else {
            return { color: 'success', icon: <CheckCircleIcon />, text: 'In Stock' };
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

    return (
        <>
            {/* <SideNav open={open} setOpen={setOpen} />
            <div
                style={{
                    marginLeft: open ? `${drawerWidthOpen}px` : `${drawerWidthClosed}px`,
                    transition: 'margin-left 0.3s ease-in-out',
                    marginTop: '5rem',
                }}
            > */}
            <Box sx={{
                minHeight: '100vh',
                p: 2,
                backgroundColor: '#f5f5f5'
            }}>
                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography sx={{
                        fontWeight: '600',
                        fontSize: '30px',
                        color: '#063455'
                    }}>
                        Ingredients Management
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => router.visit(route(routeNameForContext('ingredients.create')))}
                        sx={{
                            backgroundColor: '#063455',
                            borderRadius: '16px',
                            height: 35,
                            textTransform: 'none'
                        }}>
                        Add Ingredient
                    </Button>
                </Box>

                {/* Statistics Cards */}
                <Grid container spacing={3} sx={{ mb: 3 }}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card sx={{ bgcolor: '#063455', borderRadius: '16px' }}>
                            <CardContent
                                sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                }}>
                                <Typography sx={{ color: '#fff', fontSize: '14px', fontWeight: 500 }}>
                                    Total Ingredients
                                </Typography>
                                <Typography sx={{ color: '#fff', fontSize: '20px', fontWeight: 600 }}>
                                    {stats.total_ingredients}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card sx={{ bgcolor: '#063455', borderRadius: '16px' }}>
                            <CardContent
                                sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                }}>
                                <Typography sx={{ color: '#fff', fontSize: '14px', fontWeight: 500 }}>
                                    Active Ingredients
                                </Typography>
                                <Typography sx={{ color: '#fff', fontSize: '20px', fontWeight: 600 }}>
                                    {stats.active_ingredients}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card sx={{ bgcolor: '#063455', borderRadius: '16px' }}>
                            <CardContent
                                sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                }}>
                                <Typography sx={{ color: '#fff', fontSize: '14px', fontWeight: 500 }}>
                                    Low Stock
                                </Typography>
                                <Typography sx={{ color: '#fff', fontSize: '20px', fontWeight: 600 }}>
                                    {stats.low_stock}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card sx={{ bgcolor: '#063455', borderRadius: '16px' }}>
                            <CardContent
                                sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                }}>
                                <Typography sx={{ color: '#fff', fontSize: '14px', fontWeight: 500 }}>
                                    Out of Stock
                                </Typography>
                                <Typography sx={{ color: '#fff', fontSize: '20px', fontWeight: 600 }}>
                                    {stats.out_of_stock}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* Filters */}
                <Card sx={{ pt: 2, mb: 2, bgcolor: 'transparent', boxShadow: 'none', px: 0 }}>

                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                placeholder="Search ingredients..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: '16px',
                                        height: 40
                                    },
                                    '& .MuiOutlinedInput-notchedOutline': {
                                        borderRadius: '16px',
                                    },
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <TextField fullWidth select label="Status" value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: '16px',
                                        height: 40
                                    },
                                    '& .MuiOutlinedInput-notchedOutline': {
                                        borderRadius: '16px',
                                    },
                                }}
                                SelectProps={{
                                    MenuProps: {
                                        sx: {
                                            '& .MuiMenuItem-root': {
                                                borderRadius: '16px',
                                                margin: '4px 8px',
                                                '&:hover': {
                                                    backgroundColor: '#063455 !important',
                                                    color: '#fff !important',
                                                    borderRadius: '16px',
                                                },
                                                '&.Mui-selected': {
                                                    backgroundColor: '#063455',
                                                    color: '#fff',
                                                    borderRadius: '16px',
                                                    '&:hover': {
                                                        backgroundColor: '#063455',
                                                        color: '#fff',
                                                    },
                                                },
                                            },
                                        },
                                    },
                                }}
                            >
                                <MenuItem value="all">All Status</MenuItem>
                                <MenuItem value="active">Active</MenuItem>
                                <MenuItem value="inactive">Inactive</MenuItem>
                                <MenuItem value="expired">Expired</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <TextField fullWidth select label="Stock Level" value={stockFilter}
                                onChange={(e) => setStockFilter(e.target.value)}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: '16px',
                                        height: 40
                                    },
                                    '& .MuiOutlinedInput-notchedOutline': {
                                        borderRadius: '16px',
                                    },
                                }}
                                SelectProps={{
                                    MenuProps: {
                                        sx: {
                                            '& .MuiMenuItem-root': {
                                                borderRadius: '16px',
                                                margin: '4px 8px',
                                                '&:hover': {
                                                    backgroundColor: '#063455 !important',
                                                    color: '#fff !important',
                                                    borderRadius: '16px',
                                                },
                                                '&.Mui-selected': {
                                                    backgroundColor: '#063455',
                                                    color: '#fff',
                                                    borderRadius: '16px',
                                                    '&:hover': {
                                                        backgroundColor: '#063455',
                                                        color: '#fff',
                                                    },
                                                },
                                            },
                                        },
                                    },
                                }}
                            >
                                <MenuItem value="all">All Stock</MenuItem>
                                <MenuItem value="available">Available</MenuItem>
                                <MenuItem value="low">Low Stock</MenuItem>
                                <MenuItem value="out">Out of Stock</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={3} sx={{ display: 'flex', gap: 2 }}>
                            <Button
                                fullWidth
                                variant="outlined"
                                onClick={handleReset}
                                sx={{
                                    borderRadius: '16px',
                                    textTransform: 'none',
                                    border: '1px solid #063455'
                                }}
                            >
                                Reset
                            </Button>
                            <Button
                                fullWidth
                                variant="contained"
                                startIcon={<SearchIcon />}
                                onClick={handleSearch}
                                sx={{
                                    backgroundColor: '#063455',
                                    borderRadius: '16px',
                                    textTransform: 'none',
                                    height: 40
                                }}>
                                Search
                            </Button>
                        </Grid>
                    </Grid>
                </Card>

                {/* Ingredients Table */}

                <TableContainer component={Paper} sx={{ borderRadius: '12px' }}>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ backgroundColor: '#063455' }}>
                                <TableCell sx={{ fontWeight: '600', color: '#fff' }}>
                                    Name
                                </TableCell>
                                <TableCell sx={{ fontWeight: '600', color: '#fff' }}>
                                    Total Quantity
                                </TableCell>
                                <TableCell sx={{ fontWeight: '600', color: '#fff' }}>
                                    Used
                                </TableCell>
                                <TableCell sx={{ fontWeight: '600', color: '#fff' }}>
                                    Remaining
                                </TableCell>
                                <TableCell sx={{ fontWeight: '600', color: '#fff' }}>
                                    Unit
                                </TableCell>
                                <TableCell sx={{ fontWeight: '600', color: '#fff' }}>
                                    Cost/Unit
                                </TableCell>
                                <TableCell sx={{ fontWeight: '600', color: '#fff' }}>
                                    Stock Status
                                </TableCell>
                                <TableCell sx={{ fontWeight: '600', color: '#fff' }}>
                                    Status
                                </TableCell>
                                <TableCell sx={{ fontWeight: '600', color: '#fff' }}>
                                    Actions
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {ingredients.data.map((ingredient) => {
                                const stockInfo = getStockInfo(ingredient.remaining_quantity, ingredient.total_quantity);
                                return (
                                    <TableRow key={ingredient.id} hover>
                                        <TableCell>
                                            <Box>
                                                <Typography variant="subtitle2" fontWeight="bold">
                                                    {ingredient.name}
                                                </Typography>
                                                {ingredient.description && (
                                                    <Typography variant="caption" color="textSecondary">
                                                        {ingredient.description}
                                                    </Typography>
                                                )}
                                            </Box>
                                        </TableCell>
                                        <TableCell>{ingredient.total_quantity}</TableCell>
                                        <TableCell>{ingredient.used_quantity}</TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                {stockInfo.icon}
                                                <Typography color={`${stockInfo.color}.main`}>{ingredient.remaining_quantity}</Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>{ingredient.unit}</TableCell>
                                        <TableCell>{ingredient.cost_per_unit ? formatCurrency(ingredient.cost_per_unit) : 'N/A'}</TableCell>
                                        <TableCell>
                                            <Chip label={stockInfo.text} color={stockInfo.color} size="small" />
                                        </TableCell>
                                        <TableCell>
                                            <Chip label={ingredient.status} color={getStatusColor(ingredient.status)} size="small" sx={{ textTransform: 'capitalize' }} />
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', gap: 1 }}>
                                                <Tooltip title="View Details">
                                                    <IconButton size="small" onClick={() => router.visit(route(routeNameForContext('ingredients.show'), ingredient.id))}>
                                                        <ViewIcon />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Edit">
                                                    <IconButton size="small" onClick={() => router.visit(route(routeNameForContext('ingredients.edit'), ingredient.id))}>
                                                        <EditIcon />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Add Stock">
                                                    <IconButton
                                                        size="small"
                                                        color="success"
                                                        onClick={() => router.visit(route(routeNameForContext('ingredients.add-stock.form'), ingredient.id))}
                                                    >
                                                        <AddStockIcon />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Delete">
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={() => {
                                                            if (confirm('Are you sure you want to delete this ingredient?')) {
                                                                router.delete(route(routeNameForContext('ingredients.destroy'), ingredient.id));
                                                            }
                                                        }}
                                                    >
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            {ingredients.data.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={9} sx={{ textAlign: 'center', py: 4 }}>
                                        <Typography color="textSecondary">No ingredients found</Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Pagination */}
                {ingredients.links && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                        {ingredients.links.map((link, index) => (
                            <Button key={index} onClick={() => link.url && router.visit(link.url)} disabled={!link.url} variant={link.active ? 'contained' : 'outlined'} size="small" sx={{ mx: 0.5, minWidth: '36px' }}>
                                <span dangerouslySetInnerHTML={{ __html: link.label }} />
                            </Button>
                        ))}
                    </Box>
                )}

            </Box>
            {/* </div > */}
        </>
    );
};

IngredientsIndex.layout = (page) => <POSLayout>{page}</POSLayout>;
export default IngredientsIndex;
