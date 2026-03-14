import React, { useState } from 'react';
import { Box, Button, Card, CardContent, Grid, IconButton, Menu, MenuItem, Typography } from '@mui/material';
import { ArrowBack as ArrowBackIcon, Add as AddIcon, MoreVert as MoreVertIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { enqueueSnackbar } from 'notistack';
import { FaEdit } from 'react-icons/fa';

const SubscriptionCategories = ({ subscriptionCategories }) => {
    // const [open, setOpen] = useState(true);
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [categories, setCategories] = useState(subscriptionCategories || []);
    const { props } = usePage();
    const csrfToken = props._token;

    const handleMenuOpen = (event, category) => {
        setAnchorEl(event.currentTarget);
        setSelectedCategory(category);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedCategory(null);
    };

    const handleEdit = () => {
        if (selectedCategory) {
            router.visit(route('subscription-categories.edit', selectedCategory.id));
        }
        handleMenuClose();
    };

    const handleDelete = async () => {
        if (selectedCategory) {
            try {
                await axios.delete(route('subscription-categories.destroy', selectedCategory.id), {
                    headers: { 'X-CSRF-TOKEN': csrfToken },
                });
                setCategories((prev) => prev.filter((cat) => cat.id !== selectedCategory.id));
                enqueueSnackbar('Subscription Category deleted successfully.', { variant: 'success' });
            } catch (error) {
                enqueueSnackbar('Failed to delete Subscription Category', { variant: 'error' });
            }
        }
        handleMenuClose();
    };

    return (
        <>
            {/* <SideNav open={open} setOpen={setOpen} /> */}
            <Box
                sx={{
                    minHeight: '100vh',
                    padding: '20px',
                    backgroundColor: '#f5f5f5'
                }}
            >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {/* <IconButton onClick={()=>window.history.back()}>
                            <ArrowBackIcon sx={{color:'#063455'}} />
                        </IconButton> */}
                        <Typography sx={{ color: '#063455', fontWeight: '700', fontSize: '30px' }}>Subscription Categories</Typography>
                    </Box>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon sx={{ mb: 0.5 }} />}
                        onClick={() => router.visit(route('subscription-categories.create'))}
                        sx={{
                            backgroundColor: '#063455',
                            borderRadius: '16px',
                            textTransform: 'none',
                            '&:hover': { backgroundColor: '#063455' },
                        }}
                    >
                        Add Category
                    </Button>
                </Box>
                <Typography sx={{ color: '#063455', fontSize: '15px', fontWeight: '600' }}>
                    Helps in reporting and structured subscription management
                </Typography>

                <Grid container spacing={3} sx={{mt:2}}>
                    {categories.map((category) => (
                        <Grid item xs={12} sm={6} md={4} key={category.id}>
                            <Card sx={{ borderRadius: '16px' }}>
                                <Box
                                    sx={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        p: 2,
                                        borderBottom: '1px solid #eee',
                                        bgcolor:'#063455',
                                        color:'#fff'
                                    }}
                                >
                                    <Typography fontWeight={600}>
                                        {category.name} ({category.subscription_type?.name})
                                    </Typography>
                                    <IconButton onClick={(e) => handleMenuOpen(e, category)}>
                                        <MoreVertIcon style={{color:'#fff'}} />
                                    </IconButton>
                                </Box>
                                <CardContent>
                                    <Typography variant="body2" color="text.secondary" mb={1}>
                                        <strong>Description:</strong> {category.description || 'N/A'}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" mb={1}>
                                        <strong>Payment Type:</strong>
                                        <span style={{
                                            backgroundColor: '#f3e5f5',
                                            color: '#7b1fa2',
                                            padding: '2px 8px',
                                            borderRadius: '12px',
                                            fontSize: '11px',
                                            marginLeft: '8px'
                                        }}>
                                            Monthly
                                        </span>
                                    </Typography>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            <strong>Monthly Fee:</strong> Rs {category.fee?.toLocaleString() || 0}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            <strong>Daily Fee:</strong> Rs {category.fee ? Math.round(category.fee / 30) : 0}
                                        </Typography>
                                    </Box>
                                    <Typography variant="body2" color="text.secondary" mb={1}>
                                        <strong>Status:</strong> {category.status}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>

                <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }}>
                    <MenuItem onClick={handleEdit}>
                        <FaEdit size={16} style={{ marginRight: 20, color: '#f57c00' }} />
                        Edit
                    </MenuItem>
                    <MenuItem onClick={handleDelete}>
                        <DeleteIcon color='error' sx={{ mr: 1.5 }} />
                        Delete
                    </MenuItem>
                </Menu>
            </Box>
        </>
    );
};

export default SubscriptionCategories;
