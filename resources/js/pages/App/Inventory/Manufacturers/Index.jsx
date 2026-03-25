import React, { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import POSLayout from "@/components/POSLayout";
import { Box, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography, Chip, IconButton, Pagination, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem, Backdrop, CircularProgress, DialogContentText } from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, DeleteSweep as DeleteSweepIcon } from '@mui/icons-material';
import { enqueueSnackbar } from 'notistack';
import dayjs from 'dayjs';
import { isPosPath, routeNameForContext } from '@/lib/utils';

// const drawerWidthOpen = 240;
// const drawerWidthClosed = 110;

const ManufacturersIndex = ({ manufacturers, filters }) => {
    const { flash = {} } = usePage().props;
    // const [open, setOpen] = useState(true);
    const [search, setSearch] = useState(filters.search || '');
    const [processing, setProcessing] = useState(false);

    // Create/Edit Modal State
    const [modalOpen, setModalOpen] = useState(false);
    const [editingManufacturer, setEditingManufacturer] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        status: 'active',
    });

    // Delete Modal State
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [manufacturerToDelete, setManufacturerToDelete] = useState(null);

    React.useEffect(() => {
        if (flash?.error) {
            enqueueSnackbar(flash.error, { variant: 'error' });
        }
    }, [flash]);

    const handleSearch = (e) => {
        setSearch(e.target.value);
        router.get(route(routeNameForContext('manufacturers.index')), { search: e.target.value }, { preserveState: true, replace: true });
    };

    // --- Create / Edit Handlers ---
    const handleOpenModal = (manufacturer = null) => {
        if (manufacturer) {
            setEditingManufacturer(manufacturer);
            setFormData({ name: manufacturer.name, status: manufacturer.status });
        } else {
            setEditingManufacturer(null);
            setFormData({ name: '', status: 'active' });
        }
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setEditingManufacturer(null);
    };

    const handleSubmit = () => {
        if (!formData.name.trim()) {
            enqueueSnackbar('Please enter a manufacturer name.', { variant: 'error' });
            return;
        }

        setProcessing(true);
        if (editingManufacturer) {
            router.put(route(routeNameForContext('manufacturers.update'), editingManufacturer.id), formData, {
                onSuccess: () => {
                    enqueueSnackbar('Manufacturer updated successfully!', { variant: 'success' });
                    handleCloseModal();
                },
                onError: (errors) => {
                    enqueueSnackbar(errors.name || 'Failed to update manufacturer.', { variant: 'error' });
                },
                onFinish: () => setProcessing(false),
            });
        } else {
            router.post(route(routeNameForContext('manufacturers.store')), formData, {
                onSuccess: () => {
                    enqueueSnackbar('Manufacturer created successfully!', { variant: 'success' });
                    handleCloseModal();
                },
                onError: (errors) => {
                    enqueueSnackbar(errors.name || 'Failed to create manufacturer.', { variant: 'error' });
                },
                onFinish: () => setProcessing(false),
            });
        }
    };

    // --- Delete Handlers ---
    const handleOpenDeleteModal = (manufacturer) => {
        setManufacturerToDelete(manufacturer);
        setDeleteModalOpen(true);
    };

    const handleCloseDeleteModal = () => {
        setDeleteModalOpen(false);
        setManufacturerToDelete(null);
    };

    const handleDelete = () => {
        if (!manufacturerToDelete) return;
        setProcessing(true);
        router.delete(route(routeNameForContext('manufacturers.destroy'), manufacturerToDelete.id), {
            onSuccess: () => {
                enqueueSnackbar('Manufacturer deleted successfully!', { variant: 'success' });
                handleCloseDeleteModal();
            },
            onError: () => enqueueSnackbar('Failed to delete manufacturer.', { variant: 'error' }),
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <>
            {/* <Head title="Manufacturers" />
            <SideNav open={open} setOpen={setOpen} /> */}

            {/* Global Loader */}
            <Backdrop sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1000 }} open={processing}>
                <CircularProgress color="inherit" />
            </Backdrop>

            {/* <Box
                sx={{
                    marginLeft: open ? `${drawerWidthOpen}px` : `${drawerWidthClosed}px`,
                    transition: 'margin-left 0.3s ease-in-out',
                    // padding: '1rem',
                    marginTop: '5rem',
                }}
            > */}
            <Box sx={{
                minHeight: '100vh',
                bgcolor: '#f5f5f5',
                p: 2
            }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Typography sx={{ fontWeight: 600, fontSize: '30px', color: '#063455' }}>
                        Manufacturers
                    </Typography>
                    <Box display="flex" gap={2}>
                        <TextField
                            size="small"
                            placeholder="Search..."
                            value={search}
                            onChange={handleSearch}
                            sx={{
                                bgcolor: 'transparent',
                                '& .MuiOutlinedInput-root': { borderRadius: '16px' },
                            }} />
                        <Button
                            variant="outlined"
                            color="error"
                            startIcon={<DeleteIcon />}
                            onClick={() => router.visit(route(routeNameForContext('manufacturers.trashed')))}
                            sx={{
                                bgcolor: 'transparent',
                                borderRadius: '16px',
                                textTransform: 'none',
                                height: 35,
                                '&:hover': { bgcolor: 'transparent' }
                            }}>
                            Deleted
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => handleOpenModal()}
                            sx={{
                                bgcolor: '#063455',
                                borderRadius: '16px',
                                textTransform: 'none',
                                height: 35,
                                '&:hover': { bgcolor: '#04243a' }
                            }}>
                            Add Manufacturer
                        </Button>
                    </Box>
                </Box>

                <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 3 }}>
                    <Table>
                        <TableHead sx={{ bgcolor: '#063455' }}>
                            <TableRow>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Name</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Products</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Status</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Updated At</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                                    Actions
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {manufacturers.data.length > 0 ? (
                                manufacturers.data.map((manufacturer) => (
                                    <TableRow key={manufacturer.id} hover>
                                        <TableCell>{manufacturer.name}</TableCell>
                                        <TableCell>{manufacturer.products_count ?? 0}</TableCell>
                                        <TableCell>
                                            <Chip label={manufacturer.status} size="small" color={manufacturer.status === 'active' ? 'success' : 'default'} sx={{ textTransform: 'capitalize' }} />
                                        </TableCell>
                                        <TableCell>{dayjs(manufacturer.updated_at).format('DD MMM YYYY, h:mm A')}</TableCell>
                                        <TableCell align="right">
                                            <IconButton onClick={() => handleOpenModal(manufacturer)} color="primary">
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton onClick={() => handleOpenDeleteModal(manufacturer)} color="error">
                                                <DeleteIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} align="center">
                                        No manufacturers found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                <Box mt={3} display="flex" justifyContent="center">
                    <Pagination count={manufacturers.last_page} page={manufacturers.current_page} onChange={(e, p) => router.get(route(routeNameForContext('manufacturers.index')), { page: p, search }, { preserveState: true })} color="primary" />
                </Box>
            </Box>
            {/* </Box> */}

            {/* Create/Edit Modal */}
            <Dialog open={modalOpen} onClose={handleCloseModal} maxWidth="sm" fullWidth>
                <DialogTitle>{editingManufacturer ? 'Edit Manufacturer' : 'Add New Manufacturer'}</DialogTitle>
                <DialogContent>
                    <Box component="form" sx={{ mt: 1 }}>
                        <TextField fullWidth label="Manufacturer Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} margin="normal" autoFocus />
                        <FormControl fullWidth margin="normal">
                            <InputLabel>Status</InputLabel>
                            <Select value={formData.status} label="Status" onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                                <MenuItem value="active">Active</MenuItem>
                                <MenuItem value="inactive">Inactive</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseModal} disabled={processing}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} variant="contained" sx={{ bgcolor: '#063455' }} disabled={processing}>
                        {editingManufacturer ? 'Update' : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Modal */}
            <Dialog open={deleteModalOpen} onClose={handleCloseDeleteModal}>
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete manufacturer <b>{manufacturerToDelete?.name}</b>? It will be moved to text Trash.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDeleteModal} disabled={processing}>
                        Cancel
                    </Button>
                    <Button onClick={handleDelete} color="error" variant="contained" disabled={processing}>
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

ManufacturersIndex.layout = (page) => (isPosPath(typeof window !== 'undefined' ? window.location.pathname : '') ? <POSLayout>{page}</POSLayout> : page);

export default ManufacturersIndex;
