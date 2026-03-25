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

const UnitsIndex = ({ units, filters }) => {
    const { flash = {} } = usePage().props;
    // const [open, setOpen] = useState(true);
    const [search, setSearch] = useState(filters.search || '');
    const [processing, setProcessing] = useState(false);

    // Create/Edit Modal State
    const [modalOpen, setModalOpen] = useState(false);
    const [editingUnit, setEditingUnit] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        status: 'active',
    });

    // Delete Modal State
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [unitToDelete, setUnitToDelete] = useState(null);

    React.useEffect(() => {
        if (flash?.error) {
            enqueueSnackbar(flash.error, { variant: 'error' });
        }
    }, [flash]);

    const handleSearch = (e) => {
        setSearch(e.target.value);
        router.get(route(routeNameForContext('units.index')), { search: e.target.value }, { preserveState: true, replace: true });
    };

    // --- Create / Edit Handlers ---
    const handleOpenModal = (unit = null) => {
        if (unit) {
            setEditingUnit(unit);
            setFormData({ name: unit.name, code: unit.code, status: unit.status });
        } else {
            setEditingUnit(null);
            setFormData({ name: '', code: '', status: 'active' });
        }
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setEditingUnit(null);
    };

    const handleSubmit = () => {
        if (!formData.name.trim()) {
            enqueueSnackbar('Please enter a unit name.', { variant: 'error' });
            return;
        }

        setProcessing(true);
        if (editingUnit) {
            router.put(route(routeNameForContext('units.update'), editingUnit.id), formData, {
                onSuccess: () => {
                    enqueueSnackbar('Unit updated successfully!', { variant: 'success' });
                    handleCloseModal();
                },
                onError: (errors) => {
                    enqueueSnackbar(errors.name || 'Failed to update unit.', { variant: 'error' });
                },
                onFinish: () => setProcessing(false),
            });
        } else {
            router.post(route(routeNameForContext('units.store')), formData, {
                onSuccess: () => {
                    enqueueSnackbar('Unit created successfully!', { variant: 'success' });
                    handleCloseModal();
                },
                onError: (errors) => {
                    enqueueSnackbar(errors.name || 'Failed to create unit.', { variant: 'error' });
                },
                onFinish: () => setProcessing(false),
            });
        }
    };

    // --- Delete Handlers ---
    const handleOpenDeleteModal = (unit) => {
        setUnitToDelete(unit);
        setDeleteModalOpen(true);
    };

    const handleCloseDeleteModal = () => {
        setDeleteModalOpen(false);
        setUnitToDelete(null);
    };

    const handleDelete = () => {
        if (!unitToDelete) return;
        setProcessing(true);
        router.delete(route(routeNameForContext('units.destroy'), unitToDelete.id), {
            onSuccess: () => {
                enqueueSnackbar('Unit deleted successfully!', { variant: 'success' });
                handleCloseDeleteModal();
            },
            onError: () => enqueueSnackbar('Failed to delete unit.', { variant: 'error' }),
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <>
            {/* <SideNav open={open} setOpen={setOpen} /> */}

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
                    p: 2,
                    minHeight: '100vh',
                    bgcolor: '#f5f5f5'
                }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                        <Typography sx={{ fontWeight: 600, fontSize: '30px', color: '#063455' }}>
                            Units of Measurement
                        </Typography>
                        <Box display="flex" gap={2}>
                            <TextField
                                size="small"
                                placeholder="Search..."
                                value={search}
                                onChange={handleSearch}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: '16px',
                                        '&:hover fieldset': {
                                            borderRadius: '16px',
                                        },
                                        '&.Mui-focused fieldset': {
                                            borderRadius: '16px',
                                        },
                                    },
                                }} />
                            <Button
                                variant="outlined"
                                color="error"
                                startIcon={<DeleteIcon />}
                            onClick={() => router.visit(route(routeNameForContext('units.trashed')))}
                                sx={{
                                    bgcolor: 'transparent',
                                    height: 35,
                                    borderRadius: '16px',
                                    textTransform: 'none',
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
                                    height: 35,
                                    borderRadius: '16px',
                                    textTransform: 'none',
                                    '&:hover': { bgcolor: '#04243a' }
                                }}>
                                Add Unit
                            </Button>
                        </Box>
                    </Box>

                    <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 3 }}>
                        <Table>
                            <TableHead sx={{ bgcolor: '#063455' }}>
                                <TableRow>
                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Name</TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Code</TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Products</TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Status</TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Updated At</TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                                        Actions
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {units.data.length > 0 ? (
                                    units.data.map((unit) => (
                                        <TableRow key={unit.id} hover>
                                            <TableCell>{unit.name}</TableCell>
                                            <TableCell>{unit.code}</TableCell>
                                            <TableCell>{unit.products_count ?? 0}</TableCell>
                                            <TableCell>
                                                <Chip label={unit.status} size="small" color={unit.status === 'active' ? 'success' : 'default'} sx={{ textTransform: 'capitalize' }} />
                                            </TableCell>
                                            <TableCell>{dayjs(unit.updated_at).format('DD MMM YYYY, h:mm A')}</TableCell>
                                            <TableCell align="right">
                                                <IconButton onClick={() => handleOpenModal(unit)} color="primary">
                                                    <EditIcon />
                                                </IconButton>
                                                <IconButton onClick={() => handleOpenDeleteModal(unit)} color="error">
                                                    <DeleteIcon />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center">
                                            No units found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    <Box mt={3} display="flex" justifyContent="center">
                        <Pagination count={units.last_page} page={units.current_page} onChange={(e, p) => router.get(route(routeNameForContext('units.index')), { page: p, search }, { preserveState: true })} color="primary" />
                    </Box>
                </Box>
            {/* </Box> */}

            {/* Create/Edit Modal */}
            <Dialog open={modalOpen} onClose={handleCloseModal} maxWidth="sm" fullWidth>
                <DialogTitle>{editingUnit ? 'Edit Unit' : 'Add New Unit'}</DialogTitle>
                <DialogContent>
                    <Box component="form" sx={{ mt: 1 }}>
                        <TextField fullWidth label="Unit Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} margin="normal" autoFocus required />
                        <TextField fullWidth label="Unit Code" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} margin="normal" required />
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
                        {editingUnit ? 'Update' : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Modal */}
            <Dialog open={deleteModalOpen} onClose={handleCloseDeleteModal}>
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete unit <b>{unitToDelete?.name}</b>? It will be moved to text Trash.
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

UnitsIndex.layout = (page) => (isPosPath(typeof window !== 'undefined' ? window.location.pathname : '') ? <POSLayout>{page}</POSLayout> : page);

export default UnitsIndex;
