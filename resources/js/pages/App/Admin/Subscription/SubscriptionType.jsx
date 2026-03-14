import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Button, Typography, IconButton, Box, Menu, MenuItem, Grid, Card } from '@mui/material';
import { ArrowBack as ArrowBackIcon, Add as AddIcon, MoreVert as MoreVertIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { enqueueSnackbar } from 'notistack';
import AddSubscriptionTypeModal from '@/components/App/SubscriptionTypes/AddModal';
import { FaEdit } from 'react-icons/fa';

const SubscriptionType = ({ subscriptionTypesData }) => {
    // const [open, setOpen] = useState(true);
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedSubscriptionType, setSelectedSubscriptionType] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingSubscriptionType, setEditingSubscriptionType] = useState(null);
    const [subscriptionTypes, setSubscriptionTypes] = useState(subscriptionTypesData || []);
    const { props } = usePage();
    const csrfToken = props._token;

    const handleMenuOpen = (event, subscriptionType) => {
        setAnchorEl(event.currentTarget);
        setSelectedSubscriptionType(subscriptionType);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedSubscriptionType(null);
    };

    const handleAdd = () => {
        setEditingSubscriptionType(null);
        setModalOpen(true);
    };

    const handleEdit = () => {
        if (selectedSubscriptionType) {
            setEditingSubscriptionType(selectedSubscriptionType);
            setModalOpen(true);
        }
        handleMenuClose();
    };

    const handleDelete = async () => {
        if (selectedSubscriptionType) {
            try {
                await axios.delete(route('subscription-types.destroy', selectedSubscriptionType.id), {
                    headers: { 'X-CSRF-TOKEN': csrfToken },
                });
                setSubscriptionTypes((prev) => prev.filter((type) => type.id !== selectedSubscriptionType.id));
                enqueueSnackbar('Subscription Type deleted successfully.', { variant: 'success' });
            } catch (error) {
                enqueueSnackbar('Failed to delete: ' + (error.response?.data?.message || error.message), { variant: 'error' });
            }
        }
        handleMenuClose();
    };

    const handleSuccess = (data) => {
        setSubscriptionTypes((prev) => {
            const exists = prev.find((p) => p.id === data.id);
            return exists ? prev.map((p) => (p.id === data.id ? data : p)) : [...prev, data];
        });
        setModalOpen(false);
        setEditingSubscriptionType(null);
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
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {/* <IconButton onClick={()=> window.history.back()}>
                            <ArrowBackIcon sx={{ color: '#063455' }} />
                        </IconButton> */}
                        <Typography sx={{ fontWeight: 700, fontSize: '30px', color: '#063455' }}>
                            Subscription Type
                        </Typography>
                    </Box>
                    <Button variant="contained" startIcon={<AddIcon />} sx={{ backgroundColor: '#063455', textTransform: 'none', height: 35, borderRadius: '16px' }} onClick={handleAdd}>
                        Add Type
                    </Button>
                </Box>
                <Typography sx={{ color: '#063455', fontSize: '15px', fontWeight: '600' }}>
                    Define different subscription types or plans
                </Typography>

                <Grid container spacing={3} sx={{mt:2}}>
                    {subscriptionTypes.map((type) => (
                        <Grid item xs={12} sm={6} md={4} key={type.id}>
                            <Card sx={{ p: 2, border: '1px solid #ddd', borderRadius: '16px' }}>
                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                    <Typography fontWeight={500}>{type.name}</Typography>
                                    <IconButton onClick={(e) => handleMenuOpen(e, type)}>
                                        <MoreVertIcon />
                                    </IconButton>
                                </Box>
                            </Card>
                        </Grid>
                    ))}
                </Grid>

                <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
                    <MenuItem onClick={handleEdit}>
                        <FaEdit size={16} style={{ marginRight: 20, color: '#f57c00' }} /> Edit
                    </MenuItem>
                    <MenuItem onClick={handleDelete}>
                        <DeleteIcon color='error' sx={{ mr: 1 }} /> Delete
                    </MenuItem>
                </Menu>
            </Box>

            <AddSubscriptionTypeModal open={modalOpen} handleClose={() => setModalOpen(false)} subscriptionType={editingSubscriptionType} onSuccess={handleSuccess} />
        </>
    );
};

export default SubscriptionType;
