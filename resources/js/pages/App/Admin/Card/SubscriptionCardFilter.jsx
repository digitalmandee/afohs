import React from 'react';
import {
    Box,
    TextField,
    MenuItem,
    Button,
    Card,
    CardContent,
    Typography,
    Grid
} from '@mui/material';
import { Search, FilterAlt, Clear } from '@mui/icons-material';

const SubscriptionCardFilter = ({ 
    filters, 
    onFilterChange, 
    onSearch, 
    onClear,
    subscriptionCategories = [],
    subscriptionTypes = []
}) => {
    const paymentStatusOptions = [
        { label: 'All Status', value: 'all' },
        { label: 'Paid', value: 'paid' },
        { label: 'Unpaid', value: 'unpaid' },
        { label: 'Partial', value: 'partial' },
    ];

    const validityStatusOptions = [
        { label: 'All Validity', value: 'all' },
        { label: 'Active', value: 'active' },
        { label: 'Expired', value: 'expired' },
    ];

    return (
        <Card sx={{ mb: 3 }}>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    Filter Subscriptions
                </Typography>
                
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={3}>
                        <TextField
                            fullWidth
                            label="Search"
                            placeholder="Name, membership no, phone..."
                            value={filters.search || ''}
                            onChange={(e) => onFilterChange('search', e.target.value)}
                            InputProps={{
                                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
                            }}
                        />
                    </Grid>

                    <Grid item xs={12} md={2}>
                        <TextField
                            fullWidth
                            select
                            label="Payment Status"
                            value={filters.payment_status || 'all'}
                            onChange={(e) => onFilterChange('payment_status', e.target.value)}
                        >
                            {paymentStatusOptions.map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                    {option.label}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>

                    <Grid item xs={12} md={2}>
                        <TextField
                            fullWidth
                            select
                            label="Validity Status"
                            value={filters.validity_status || 'all'}
                            onChange={(e) => onFilterChange('validity_status', e.target.value)}
                        >
                            {validityStatusOptions.map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                    {option.label}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>

                    <Grid item xs={12} md={2}>
                        <TextField
                            fullWidth
                            select
                            label="Category"
                            value={filters.subscription_category || 'all'}
                            onChange={(e) => onFilterChange('subscription_category', e.target.value)}
                        >
                            <MenuItem value="all">All Categories</MenuItem>
                            {subscriptionCategories.map((category) => (
                                <MenuItem key={category.id} value={category.id}>
                                    {category.name}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>

                    <Grid item xs={12} md={2}>
                        <TextField
                            fullWidth
                            select
                            label="Type"
                            value={filters.subscription_type || 'all'}
                            onChange={(e) => onFilterChange('subscription_type', e.target.value)}
                        >
                            <MenuItem value="all">All Types</MenuItem>
                            {subscriptionTypes.map((type) => (
                                <MenuItem key={type.id} value={type.id}>
                                    {type.name}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>

                    <Grid item xs={12} md={1}>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                                variant="contained"
                                onClick={onSearch}
                                startIcon={<Search />}
                                fullWidth
                            >
                                Search
                            </Button>
                        </Box>
                    </Grid>
                </Grid>

                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                        variant="outlined"
                        onClick={onClear}
                        startIcon={<Clear />}
                        size="small"
                    >
                        Clear Filters
                    </Button>
                </Box>
            </CardContent>
        </Card>
    );
};

export default SubscriptionCardFilter;
