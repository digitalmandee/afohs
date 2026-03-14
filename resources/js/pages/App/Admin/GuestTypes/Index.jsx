import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { Box, Button, Container, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Switch, IconButton, TextField, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { FaEdit } from 'react-icons/fa';

export default function GuestTypesIndex({ guestTypes }) {
    const { enqueueSnackbar } = useSnackbar();
    const [openDialog, setOpenDialog] = useState(false);
    const [editingType, setEditingType] = useState(null);
    const [formData, setFormData] = useState({ name: '', status: true });

    const handleOpen = (type = null) => {
        if (type) {
            setEditingType(type);
            setFormData({ name: type.name, status: !!type.status });
        } else {
            setEditingType(null);
            setFormData({ name: '', status: true });
        }
        setOpenDialog(true);
    };

    const handleClose = () => {
        setOpenDialog(false);
        setEditingType(null);
    };

    const handleSubmit = () => {
        if (editingType) {
            router.put(route('guest-types.update', editingType.id), formData, {
                onSuccess: () => {
                    enqueueSnackbar('Guest Type updated successfully', { variant: 'success' });
                    handleClose();
                },
            });
        } else {
            router.post(route('guest-types.store'), formData, {
                onSuccess: () => {
                    enqueueSnackbar('Guest Type created successfully', { variant: 'success' });
                    handleClose();
                },
            });
        }
    };

    const handleStatusChange = (type) => {
        router.put(
            route('guest-types.update', type.id),
            {
                ...type,
                status: !type.status,
            },
            {
                onSuccess: () => enqueueSnackbar('Status updated', { variant: 'success' }),
            },
        );
    };

    const handleDelete = (id) => {
        if (confirm('Are you sure you want to delete this guest type?')) {
            router.delete(route('guest-types.destroy', id), {
                onSuccess: () => enqueueSnackbar('Guest Type deleted', { variant: 'success' }),
            });
        }
    };

    return (
        <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f5f5', p: 3 }}>
            <Head title="Guest Types" />

            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                {/* <IconButton onClick={() => window.history.back()}>
                    <ArrowBackIcon sx={{ color: '#063455' }} />
                </IconButton> */}
                <Typography sx={{ fontWeight: 700, fontSize: '30px', color: '#063455' }}>Guest Types</Typography>
                <Button startIcon={<AddIcon />}
                    onClick={() => handleOpen()}
                    sx={{ ml: 'auto', borderRadius: '16px', backgroundColor: '#063455', textTransform: 'none', color: '#fff' }}>
                    Add Guest Type
                </Button>
            </Box>

            <TableContainer component={Paper} sx={{ borderRadius: '16px' }}>
                <Table>
                    <TableHead sx={{ backgroundColor: '#063455' }}>
                        <TableRow>
                            <TableCell sx={{ color: '#fff', fontWeight: 600, fontSize: '14px' }}>Name</TableCell>
                            <TableCell sx={{ color: '#fff', fontWeight: 600, fontSize: '14px' }}>Status</TableCell>
                            <TableCell sx={{ color: '#fff', fontWeight: 600, fontSize: '14px' }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {guestTypes.map((type) => (
                            <TableRow key={type.id}>
                                <TableCell sx={{ color: '#7f7f7f', fontSize: '14px' }}>{type.name}</TableCell>
                                <TableCell sx={{ color: '#7f7f7f', fontSize: '14px' }}>
                                    <Switch checked={!!type.status} onChange={() => handleStatusChange(type)} color="primary" />
                                    {type.status ? 'Active' : 'Inactive'}
                                </TableCell>
                                <TableCell>
                                    <IconButton onClick={() => handleOpen(type)} style={{ color: '#f57c00' }}>
                                        <FaEdit size={18} />
                                    </IconButton>
                                    {/* <IconButton onClick={() => handleDelete(type.id)} color="error">
                                        <DeleteIcon />
                                    </IconButton> */}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={openDialog} onClose={handleClose} maxWidth="sm" fullWidth
                sx={{
                    '& .MuiDialog-paper': {
                        borderRadius: '16px'
                    }
                }}>
                <DialogTitle>{editingType ? 'Edit Guest Type' : 'Add Guest Type'}</DialogTitle>
                <DialogContent>
                    <TextField autoFocus margin="dense" label="Name" fullWidth value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                    <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
                        <Typography sx={{ mr: 2 }}>Status:</Typography>
                        <Switch checked={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.checked })} />
                        <Typography>{formData.status ? 'Active' : 'Inactive'}</Typography>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose} sx={{ borderRadius: '12px' }}>Cancel</Button>
                    <Button onClick={handleSubmit} variant="contained" sx={{ backgroundColor: '#063455', borderRadius: '12px' }}>
                        {editingType ? 'Update' : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
