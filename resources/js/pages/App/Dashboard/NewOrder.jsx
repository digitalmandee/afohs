import { Clear, LocalShipping, Lock, Person, Search } from '@mui/icons-material';
import { Box, Button, Chip, Divider, IconButton, InputBase, Paper, Tab, Tabs, Typography } from '@mui/material';
import { useState } from 'react';

const NewSelfOrder = () => {
    const [tabValue, setTabValue] = useState(0);

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const orders = [
        {
            id: '001',
            name: 'Miles Esther',
            items: 2,
            icon: 'truck',
        },
        {
            id: '001',
            name: 'Annette Black',
            items: 2,
            icon: 'lock',
        },
        {
            id: '001',
            name: 'Bessie Cooper',
            items: 3,
            icon: 'truck',
        },
        {
            id: '001',
            name: 'Darrell Steward',
            items: 2,
            icon: 'person',
        },
        {
            id: '001',
            name: 'Jerome Bell',
            items: 2,
            icon: 'person',
        },
    ];

    const getIcon = (iconType) => {
        switch (iconType) {
            case 'truck':
                return <LocalShipping sx={{ fontSize: 20 }} />;
            case 'lock':
                return <Lock sx={{ fontSize: 20 }} />;
            case 'person':
                return <Person sx={{ fontSize: 20 }} />;
            default:
                return <LocalShipping sx={{ fontSize: 20 }} />;
        }
    };

    return (
        <Paper
            sx={{
                height: '100%',
                // maxWidth: 500,
                mx: 'auto',
                // overflow: 'hidden',
                // boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                // borderRadius: 1
                // p:1
            }}
        >
            {/* Header */}
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    p: 2,
                    // borderBottom: '1px solid #f0f0f0',
                    mt: 1,
                }}
            >
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    New Self Order
                </Typography>
            </Box>

            {/* Search Bar */}
            <Box sx={{ p: 2 }}>
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        border: '1px solid #e0e0e0',
                        borderRadius: 1,
                        px: 2,
                        py: 0.5,
                    }}
                >
                    <Search sx={{ color: '#9ca3af', mr: 1 }} />
                    <InputBase placeholder="Search Id Order or scan QR Code Customer" fullWidth sx={{ fontSize: '0.875rem' }} />
                    <IconButton size="small">
                        <Clear fontSize="small" sx={{ color: '#9ca3af' }} />
                    </IconButton>
                </Box>
            </Box>

            {/* Filter Tabs */}
            <Tabs
                value={tabValue}
                onChange={handleTabChange}
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                    px: 2,
                    '& .MuiTab-root': {
                        textTransform: 'none',
                        fontSize: '0.875rem',
                        minWidth: 'auto',
                        px: 2,
                        py: 1,
                    },
                    '& .Mui-selected': {
                        color: '#1976d2',
                        fontWeight: 'bold',
                    },
                    '& .MuiTabs-indicator': {
                        backgroundColor: '#1976d2',
                    },
                }}
            >
                <Tab label="All Type" />
                <Tab label="Dine In" />
                <Tab label="Pick Up" />
                <Tab label="Delivery" />
                <Tab label="Takeaway" />
                <Tab label="Reservation" />
            </Tabs>

            <Divider />

            {/* Orders List */}
            <Box sx={{ maxHeight: 500, p: 2, overflow: 'auto', bgcolor: '#f8f9fa' }}>
                {orders.map((order, index) => (
                    <Box
                        key={index}
                        sx={{
                            p: 1,
                            mb: 1,
                            bgcolor: 'white',
                            display: 'flex',
                            flexDirection: 'column',
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Box
                                sx={{
                                    // p:1,
                                    mr: 2,
                                    bgcolor: '#f0f0f0',
                                    borderRadius: '50%',
                                    width: 40,
                                    height: 40,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#6b7280',
                                }}
                            >
                                {getIcon(order.icon)}
                            </Box>

                            <Box sx={{ flexGrow: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mr: 1 }}>
                                        {order.name}
                                    </Typography>
                                    <Box
                                        component="span"
                                        sx={{
                                            color: '#f59e0b',
                                            fontSize: '1.2rem',
                                            bgcolor: '#FEF3C7',
                                            borderRadius: '50%',
                                            width: 24,
                                            height: 24,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        😊
                                    </Box>
                                </Box>

                                <Typography variant="caption" sx={{ color: '#666' }}>
                                    {order.items} Items
                                </Typography>
                            </Box>
                        </Box>

                        <Box
                            sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Chip
                                    label={`#${order.id}`}
                                    size="small"
                                    sx={{
                                        mr: 1,
                                        bgcolor: '#f5f5f5',
                                        borderRadius: 1,
                                        height: 24,
                                        fontSize: '0.75rem',
                                        fontWeight: 'medium',
                                    }}
                                />
                                <IconButton size="small" sx={{ p: 0 }}>
                                    <Box component="span" sx={{ color: '#ef4444', fontSize: '1rem' }}>
                                        🗑️
                                    </Box>
                                </IconButton>
                            </Box>
                            <Button
                                variant="contained"
                                size="small"
                                startIcon={
                                    <Box component="span" sx={{ fontSize: '0.875rem' }}>
                                        ✓
                                    </Box>
                                }
                                sx={{
                                    bgcolor: '#0e3151',
                                    color: 'white',
                                    textTransform: 'none',
                                    borderRadius: 0,
                                    px: 2,
                                    py: 0.5,
                                    fontSize: '0.875rem',
                                    '&:hover': {
                                        bgcolor: '#0a2540',
                                    },
                                }}
                            >
                                Process Order
                            </Button>
                        </Box>
                    </Box>
                ))}
            </Box>
        </Paper>
    );
};
NewSelfOrder.layout = (page) => page;
export default NewSelfOrder;
