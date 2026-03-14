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

const SubscriptionFilter = ({ 
    filters, 
    onFilterChange, 
    onSearch, 
    onClear,
    subscriptionCategories = [],
    subscriptionTypes = []
}) => {
    const cardStatusOptions = [
        { label: 'All Status', value: 'all' },
        { label: 'Active', value: 'active' },
        { label: 'Expired', value: 'expired' },
        { label: 'Suspended', value: 'suspended' },
        { label: 'Cancelled', value: 'cancelled' },
    ];

    const paymentStatusOptions = [
        { label: 'All Payment Status', value: 'all' },
        { label: 'Paid', value: 'paid' },
        { label: 'Unpaid', value: 'unpaid' },
        { label: 'Partial', value: 'partial' },
    ];

    return (
        <Card sx={{ mb: 3 }}>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    Filter Subscription Cards
                </Typography>
                
                <Grid container spacing={2} alignItems="center">
                    {/* Search */}
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

                    {/* Card Status */}
                    <Grid item xs={12} md={2}>
                        <TextField
                            fullWidth
                            select
                            label="Card Status"
                            value={filters.card_status || 'all'}
                            onChange={(e) => onFilterChange('card_status', e.target.value)}
                        >
                            {cardStatusOptions.map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                    {option.label}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>

                    {/* Payment Status */}
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

                    {/* Subscription Category */}
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

                    {/* Subscription Type */}
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

                    {/* Search Button */}
                    <Grid item xs={12} md={1}>
                        <Button
                            variant="contained"
                            onClick={onSearch}
                            startIcon={<Search />}
                            fullWidth
                            sx={{ backgroundColor: '#063455' }}
                        >
                            Search
                        </Button>
                    </Grid>
                </Grid>

                {/* Date Range Filters */}
                <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom sx={{ color: '#063455', fontWeight: 600 }}>
                        Date Range Filters
                    </Typography>
                    <Grid container spacing={2}>
                        {/* Valid From Range */}
                        <Grid item xs={12} md={3}>
                            <TextField
                                fullWidth
                                type="date"
                                label="Valid From - Start"
                                value={filters.valid_from_start || ''}
                                onChange={(e) => onFilterChange('valid_from_start', e.target.value)}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <TextField
                                fullWidth
                                type="date"
                                label="Valid From - End"
                                value={filters.valid_from_end || ''}
                                onChange={(e) => onFilterChange('valid_from_end', e.target.value)}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>

                        {/* Valid To Range */}
                        <Grid item xs={12} md={3}>
                            <TextField
                                fullWidth
                                type="date"
                                label="Valid To - Start"
                                value={filters.valid_to_start || ''}
                                onChange={(e) => onFilterChange('valid_to_start', e.target.value)}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <TextField
                                fullWidth
                                type="date"
                                label="Valid To - End"
                                value={filters.valid_to_end || ''}
                                onChange={(e) => onFilterChange('valid_to_end', e.target.value)}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                    </Grid>
                </Box>

                {/* Clear Filters Button */}
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

export default SubscriptionFilter;
