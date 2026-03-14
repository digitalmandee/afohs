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
    Stack,
    Breadcrumbs,
    Link
} from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import FilterListIcon from '@mui/icons-material/FilterList';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import { format } from 'date-fns';

export default function SinglePosReport({ reportData, tenant, startDate, endDate, filters }) {
    const [open, setOpen] = useState(true);
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
        router.get(route('admin.reports.pos.single', tenant.id), dateFilters);
    };

    const handlePrint = () => {
        const printUrl = route('admin.reports.pos.single.print', tenant.id, dateFilters);
        window.open(printUrl, '_blank');
    };

    const goBackToAll = () => {
        router.get(route('admin.reports.pos.all'), dateFilters);
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
            <Head title={`POS Report - ${tenant.name}`} />
            {/* <SideNav open={open} setOpen={setOpen} /> */}

            <div
                style={{
                    minHeight: '100vh',
                }}
            >
                <Box sx={{ p: 3 }}>
                {/* Breadcrumbs */}
                <Breadcrumbs sx={{ mb: 2 }}>
                    <Link 
                        color="inherit" 
                        href="#" 
                        onClick={goBackToAll}
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                    >
                        All Restaurants Reports
                    </Link>
                    <Typography color="text.primary">{tenant.name}</Typography>
                </Breadcrumbs>

                {/* Header */}
                <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
                    <Grid container justifyContent="space-between" alignItems="center">
                        <Grid item>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                                <RestaurantIcon color="primary" sx={{ fontSize: 40 }} />
                                <Box>
                                    <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
                                        {tenant.name.toUpperCase()}
                                    </Typography>
                                    <Typography variant="h6" color="text.secondary">
                                        POS Report - Dish Breakdown Summary
                                    </Typography>
                                </Box>
                            </Box>
                        </Grid>
                        <Grid item>
                            <Stack direction="row" spacing={2}>
                                <Button
                                    variant="outlined"
                                    startIcon={<ArrowBackIcon />}
                                    onClick={goBackToAll}
                                    sx={{
                                        mr: 2,
                                        borderColor: '#0a3d62',
                                        color: '#0a3d62',
                                        '&:hover': { borderColor: '#083049', backgroundColor: '#f5f5f5' }
                                    }}
                                >
                                    Back to All Reports
                                </Button>
                                <Button
                                    variant="contained"
                                    startIcon={<PrintIcon />}
                                    onClick={handlePrint}
                                    sx={{
                                        backgroundColor: '#0a3d62',
                                        color: 'white',
                                        '&:hover': { backgroundColor: '#083049' }
                                    }}
                                >
                                    Print Report
                                </Button>
                            </Stack>
                        </Grid>
                    </Grid>
                </Paper>
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
                                sx={{ 
                                    backgroundColor: '#0a3d62',
                                    color: 'white',
                                    '&:hover': { backgroundColor: '#083049' }
                                }}
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
                        <TableContainer component={Paper} elevation={2}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold', fontSize: '0.875rem', width: '120px', textAlign: 'center' }}>
                                            ITEM CODE
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>
                                            ITEM NAME
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', fontSize: '0.875rem', width: '120px', textAlign: 'center' }}>
                                            QTY SOLD
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {reportData.categories.map((category, categoryIndex) => (
                                        <React.Fragment key={categoryIndex}>
                                            {/* Category Header Row */}
                                            <TableRow sx={{ bgcolor: '#f8f8f8' }}>
                                                <TableCell 
                                                    colSpan={3} 
                                                    sx={{ 
                                                        fontWeight: 'bold', 
                                                        fontSize: '0.95rem',
                                                        textTransform: 'uppercase',
                                                        py: 1.5,
                                                        borderTop: '2px solid #ddd'
                                                    }}
                                                >
                                                    {category.category_name}
                                                </TableCell>
                                            </TableRow>
                                            
                                            {/* Category Items */}
                                            {category.items.map((item, itemIndex) => (
                                                <TableRow 
                                                    key={itemIndex}
                                                    sx={{ 
                                                        '&:nth-of-type(odd)': { 
                                                            backgroundColor: '#fafafa' 
                                                        }
                                                    }}
                                                >
                                                    <TableCell sx={{ fontSize: '0.9rem', textAlign: 'center', fontWeight: 'bold' }}>
                                                        {item.menu_code || 'N/A'}
                                                    </TableCell>
                                                    <TableCell sx={{ fontSize: '0.9rem' }}>
                                                        {item.name}
                                                    </TableCell>
                                                    <TableCell sx={{ fontSize: '0.9rem', textAlign: 'center', fontWeight: 'bold', color: '#1976d2' }}>
                                                        {item.quantity}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            
                                            {/* Category Total Row */}
                                            <TableRow sx={{ bgcolor: '#e3f2fd', borderTop: '2px solid #1976d2' }}>
                                                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.95rem' }}>
                                                </TableCell>
                                                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.95rem' }}>
                                                    {category.category_name.toUpperCase()} TOTAL:
                                                </TableCell>
                                                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.95rem', textAlign: 'center', color: '#1976d2' }}>
                                                    {category.total_quantity}
                                                </TableCell>
                                            </TableRow>
                                        </React.Fragment>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
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
            </div>
        </>
    );
}
