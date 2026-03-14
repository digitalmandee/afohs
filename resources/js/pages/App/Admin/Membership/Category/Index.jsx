import React, { useState } from 'react';
import { Box, Button, Card, CardContent, Grid, IconButton, Menu, MenuItem, Typography } from '@mui/material';
import { ArrowBack as ArrowBackIcon, Add as AddIcon, MoreVert as MoreVertIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { enqueueSnackbar } from 'notistack';
import { FaEdit } from 'react-icons/fa';

const MemberCategories = ({ memberCategories }) => {
    // const [open, setOpen] = useState(true);
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [categories, setCategories] = useState(memberCategories || []);
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
            router.visit(route('member-categories.edit', selectedCategory.id));
        }
        handleMenuClose();
    };

    const handleDelete = async () => {
        if (selectedCategory) {
            try {
                await axios.delete(route('member-categories.destroy', selectedCategory.id), {
                    headers: { 'X-CSRF-TOKEN': csrfToken },
                });
                setCategories((prev) => prev.filter((cat) => cat.id !== selectedCategory.id));
                enqueueSnackbar('Member Category deleted successfully.', { variant: 'success' });
            } catch (error) {
                enqueueSnackbar('Failed to delete Member Category', { variant: 'error' });
            }
        }
        handleMenuClose();
    };

    return (
        <>
            {/* <SideNav open={open} setOpen={setOpen} /> */}
            <Box
                sx={{
                    // marginLeft: open ? `${drawerWidthOpen}px` : `${drawerWidthClosed}px`,
                    // transition: 'margin-left 0.3s ease-in-out',
                    // marginTop: '5rem',
                    backgroundColor: '#f5f5f5',
                    minHeight: '100vh',
                    padding: '20px',
                }}
            >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {/* <IconButton onClick={() => window.history.back()}>
                            <ArrowBackIcon sx={{ color: '#063455' }} />
                        </IconButton> */}
                        <Typography sx={{ color: '#063455', fontWeight: 700, fontSize: '30px' }}>Member Categories</Typography>
                    </Box>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <Button
                            variant="outlined"
                            startIcon={<DeleteIcon />}
                            onClick={() => router.get(route('member-categories.trashed'))}
                            sx={{
                                color: '#d32f2f',
                                borderColor: '#d32f2f',
                                borderRadius: '16px',
                                textTransform:'none',
                                '&:hover': {
                                    backgroundColor: '#ffebee',
                                    borderColor: '#d32f2f',
                                },
                            }}
                        >
                            Deleted Categories
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon sx={{ fontSize: '1.5rem', marginBottom: 0.3 }} />}
                            onClick={() => router.visit(route('member-categories.create'))}
                            sx={{
                                backgroundColor: '#063455',
                                borderRadius: '16px',
                                textTransform:'none',
                                '&:hover': { backgroundColor: '#002244' },
                            }}
                        >
                            Add Category
                        </Button>
                    </div>
                </Box>
                <Typography style={{ color: '#063455', fontSize: '15px', fontWeight: '600' }}>Helps in filtering, reporting, and targeted communication</Typography>

                <Grid container spacing={3} style={{ marginTop: 5 }}>
                    {categories.map((category) => (
                        <Grid item xs={12} sm={6} md={4} key={category.id}>
                            <Card sx={{borderRadius:'16px'}}>
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
                                    <Typography fontWeight={600}>{category.name}</Typography>
                                    <IconButton onClick={(e) => handleMenuOpen(e, category)}>
                                        <MoreVertIcon sx={{color:'#fff'}} />
                                    </IconButton>
                                </Box>
                                <CardContent>
                                    <Typography variant="body2" color="text.secondary" mb={1}>
                                        <strong>Description:</strong> {category.description || 'N/A'}
                                    </Typography>
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">
                                            <strong>Fee:</strong> {category.fee.toLocaleString()} Rs
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                          <strong>Maintenance Fee: </strong> {category.subscription_fee.toLocaleString()} Rs
                                        </Typography>
                                    </Box>
                                    <Typography variant="body2" color="text.secondary">
                                        <strong>Category Type:</strong> {category.category_types?.map((t) => t.charAt(0).toUpperCase() + t.slice(1)).join(', ') || 'None'}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        <strong>Status:</strong> {category.status}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>

                <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }}>
                    <MenuItem onClick={handleEdit}>
                        <FaEdit size={16} style={{ marginRight: 15, color: '#f57c00' }} />
                        Edit
                    </MenuItem>
                    <MenuItem onClick={handleDelete}>
                        <DeleteIcon color='error' sx={{ pr: 0.5 }}/>
                        Delete
                    </MenuItem>
                </Menu>
            </Box>
        </>
    );
};

export default MemberCategories;
