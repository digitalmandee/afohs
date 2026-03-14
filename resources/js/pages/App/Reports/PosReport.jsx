import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    Box,
    Paper,
    Typography,
    Button,
    TextField,
    Grid,
    Divider,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Card,
    CardContent,
    Stack
} from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import FilterListIcon from '@mui/icons-material/FilterList';
import { format } from 'date-fns';

export default function PosReport({ reportData, restaurantName, startDate, endDate, filters }) {
    const [dateFilters, setDateFilters] = useState({
        start_date: filters?.start_date || startDate,
        end_date: filters?.end_date || endDate
    });

    const handleFilterChange = (field, value) => {
        setDateFilters(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const applyFilters = () => {
        router.get(route('reports.pos'), dateFilters);
    };

    const handlePrint = () => {
        const printUrl = route('reports.pos.print', dateFilters);
        window.open(printUrl, '_blank');
    };

    const formatDate = (dateString) => {
        try {
            return format(new Date(dateString), 'dd/MM/yyyy');
        } catch (error) {
            return dateString;
        }
    };

    return (
        <>
            <Head title="POS Report - Dish Breakdown Summary" />
            
            <Box sx={{ p: 3 }}>
                {/* Header */}
                <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
                    <Grid container justifyContent="space-between" alignItems="center">
                        <Grid item>
                            <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
                                POS Report - Dish Breakdown Summary
                            </Typography>
                            <Typography variant="h6" color="text.secondary">
                                {restaurantName.toUpperCase()}
                            </Typography>
                        </Grid>
                        <Grid item>
                            <Button
                                variant="contained"
                                startIcon={<PrintIcon />}
                                onClick={handlePrint}
                                sx={{ 
                                    bgcolor: '#1976d2',
                                    '&:hover': { bgcolor: '#1565c0' }
                                }}
                            >
                                Print Report
                            </Button>
                        </Grid>
                    </Grid>
                </Paper>

                {/* Filters */}
                <Card sx={{ mb: 3 }}>
                    <CardContent>
                        <Stack direction="row" spacing={2} alignItems="center">
                            <FilterListIcon color="primary" />
                            <Typography variant="h6">Filters</Typography>
                            <TextField
                                label="Start Date"
                                type="date"
                                size="small"
                                value={dateFilters.start_date}
                                onChange={(e) => handleFilterChange('start_date', e.target.value)}
                                InputLabelProps={{ shrink: true }}
                            />
                            <TextField
                                label="End Date"
                                type="date"
                                size="small"
                                value={dateFilters.end_date}
                                onChange={(e) => handleFilterChange('end_date', e.target.value)}
                                InputLabelProps={{ shrink: true }}
                            />
                            <Button
                                variant="contained"
                                onClick={applyFilters}
                                size="small"
                            >
                                Apply Filters
                            </Button>
                        </Stack>
                    </CardContent>
                </Card>

                {/* Report Summary */}
                <Grid container spacing={3} sx={{ mb: 3 }}>
                    <Grid item xs={12} md={4}>
                        <Card>
                            <CardContent sx={{ textAlign: 'center' }}>
                                <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
                                    {reportData.total_quantity}
                                </Typography>
                                <Typography variant="body1" color="text.secondary">
                                    Total Items Sold
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Card>
                            <CardContent sx={{ textAlign: 'center' }}>
                                <Typography variant="h4" color="success.main" sx={{ fontWeight: 'bold' }}>
                                    {reportData.categories?.length || 0}
                                </Typography>
                                <Typography variant="body1" color="text.secondary">
                                    Categories
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Card>
                            <CardContent sx={{ textAlign: 'center' }}>
                                <Typography variant="h4" color="info.main" sx={{ fontWeight: 'bold' }}>
                                    {formatDate(startDate)} - {formatDate(endDate)}
                                </Typography>
                                <Typography variant="body1" color="text.secondary">
                                    Date Range
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* Report Content */}
                <Paper elevation={2} sx={{ p: 3 }}>
                    <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold', textAlign: 'center' }}>
                        DISH BREAKDOWN SUMMARY (SOLD QUANTITY)
                    </Typography>
                    
                    <Typography variant="subtitle1" sx={{ mb: 2, textAlign: 'center', color: 'text.secondary' }}>
                        Report Date: {formatDate(startDate)} {startDate !== endDate ? `to ${formatDate(endDate)}` : ''}
                    </Typography>

                    <Divider sx={{ mb: 3 }} />

                    {reportData.categories && reportData.categories.length > 0 ? (
                        <Grid container spacing={3}>
                            {reportData.categories.map((category, categoryIndex) => (
                                <Grid item xs={12} md={6} key={categoryIndex}>
                                    <Paper 
                                        elevation={1} 
                                        sx={{ 
                                            p: 2, 
                                            border: '1px solid #e0e0e0',
                                            borderRadius: 2
                                        }}
                                    >
                                        {/* Category Header */}
                                        <Box sx={{ 
                                            bgcolor: '#f5f5f5', 
                                            p: 1.5, 
                                            mb: 2, 
                                            borderRadius: 1,
                                            border: '1px solid #ddd'
                                        }}>
                                            <Typography 
                                                variant="h6" 
                                                sx={{ 
                                                    fontWeight: 'bold',
                                                    textAlign: 'center',
                                                    textTransform: 'uppercase'
                                                }}
                                            >
                                                {category.category_name}
                                            </Typography>
                                        </Box>

                                        {/* Items List */}
                                        <TableContainer>
                                            <Table size="small">
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
                                                            ITEM NAME
                                                        </TableCell>
                                                        <TableCell 
                                                            align="center" 
                                                            sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}
                                                        >
                                                            QTY SOLD
                                                        </TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {category.items.map((item, itemIndex) => (
                                                        <TableRow 
                                                            key={itemIndex}
                                                            sx={{ 
                                                                '&:nth-of-type(odd)': { 
                                                                    backgroundColor: '#fafafa' 
                                                                }
                                                            }}
                                                        >
                                                            <TableCell sx={{ fontSize: '0.85rem' }}>
                                                                {item.name}
                                                            </TableCell>
                                                            <TableCell 
                                                                align="center" 
                                                                sx={{ 
                                                                    fontSize: '0.85rem',
                                                                    fontWeight: 'bold',
                                                                    color: '#1976d2'
                                                                }}
                                                            >
                                                                {item.quantity}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                    {/* Category Total */}
                                                    <TableRow sx={{ bgcolor: '#e3f2fd' }}>
                                                        <TableCell sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
                                                            CATEGORY TOTAL:
                                                        </TableCell>
                                                        <TableCell 
                                                            align="center" 
                                                            sx={{ 
                                                                fontWeight: 'bold',
                                                                fontSize: '0.9rem',
                                                                color: '#1976d2'
                                                            }}
                                                        >
                                                            {category.total_quantity}
                                                        </TableCell>
                                                    </TableRow>
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    </Paper>
                                </Grid>
                            ))}
                        </Grid>
                    ) : (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            <Typography variant="h6" color="text.secondary">
                                No data available for the selected date range
                            </Typography>
                        </Box>
                    )}

                    {/* Grand Total */}
                    {reportData.categories && reportData.categories.length > 0 && (
                        <Box sx={{ mt: 4, p: 2, bgcolor: '#f0f7ff', borderRadius: 2, border: '2px solid #1976d2' }}>
                            <Typography 
                                variant="h5" 
                                sx={{ 
                                    textAlign: 'center',
                                    fontWeight: 'bold',
                                    color: '#1976d2'
                                }}
                            >
                                GRAND TOTAL: {reportData.total_quantity} Items
                            </Typography>
                        </Box>
                    )}
                </Paper>
            </Box>
        </>
    );
}
PosReport.layout = (page) => page;