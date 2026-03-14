import React, { useMemo, useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Add, Delete, Edit, Search } from '@mui/icons-material';
import { Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, FormControl, IconButton, InputLabel, MenuItem, Pagination, Paper, Select, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material';
import AdminLayout from '@/layouts/AdminLayout';
import { useSnackbar } from 'notistack';
import { FaEdit } from 'react-icons/fa';

const PosLocationsIndex = () => {
    const { props } = usePage();
    const { locations, filters } = props;
    const { enqueueSnackbar } = useSnackbar();

    const [search, setSearch] = useState(filters?.search || '');
    const [status, setStatus] = useState(filters?.status || '');

    const [modalOpen, setModalOpen] = useState(false);
    const [editingLocation, setEditingLocation] = useState(null);
    const [name, setName] = useState('');
    const [formStatus, setFormStatus] = useState('active');

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [locationToDelete, setLocationToDelete] = useState(null);

    const resetModal = () => {
        setModalOpen(false);
        setEditingLocation(null);
        setName('');
        setFormStatus('active');
    };

    const openCreate = () => {
        setEditingLocation(null);
        setName('');
        setFormStatus('active');
        setModalOpen(true);
    };

    const openEdit = (loc) => {
        setEditingLocation(loc);
        setName(loc?.name || '');
        setFormStatus(loc?.status || 'active');
        setModalOpen(true);
    };

    const handleSubmit = () => {
        const payload = { name, status: formStatus };

        if (editingLocation?.id) {
            router.put(route('pos-locations.update', editingLocation.id), payload, {
                onSuccess: () => {
                    resetModal();
                    enqueueSnackbar('POS location updated successfully.', { variant: 'success' });
                },
            });
            return;
        }

        router.post(route('pos-locations.store'), payload, {
            onSuccess: () => {
                resetModal();
                enqueueSnackbar('POS location created successfully.', { variant: 'success' });
            },
        });
    };

    const confirmDelete = (loc) => {
        setLocationToDelete(loc);
        setDeleteDialogOpen(true);
    };

    const cancelDelete = () => {
        setLocationToDelete(null);
        setDeleteDialogOpen(false);
    };

    const handleDelete = () => {
        if (!locationToDelete?.id) return;
        router.delete(route('pos-locations.destroy', locationToDelete.id), {
            onSuccess: () => {
                cancelDelete();
                enqueueSnackbar('POS location deleted successfully.', { variant: 'success' });
            },
            onError: () => {
                cancelDelete();
                enqueueSnackbar('Failed to delete POS location.', { variant: 'error' });
            },
        });
    };

    const handleSearch = () => {
        router.get(
            route('pos-locations.index'),
            { search: search || undefined, status: status || undefined },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const handlePageChange = (e, page) => {
        router.get(
            route('pos-locations.index'),
            { ...filters, page },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const statusChip = useMemo(() => {
        return (value) => <Chip label={value === 'active' ? 'Active' : 'Inactive'} color={value === 'active' ? 'success' : 'default'} size="small" variant="outlined" />;
    }, []);

    return (
        <AdminLayout>
            {/* <Head title="POS Locations" /> */}

            <Box sx={{ p: 2 }}>
                <Typography sx={{ fontWeight: 700, fontSize: '30px', color: '#063455', mb: 2 }}>POS Locations</Typography>

                <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                            <TextField
                                label="Search"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                size="small"
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: '16px',
                                    },
                                }}
                            />
                            <FormControl
                                size="small"
                                sx={{
                                    minWidth: 160,
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: '16px',
                                    },
                                }}>
                                <InputLabel>Status</InputLabel>
                                <Select
                                    label="Status"
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    MenuProps={{
                                        PaperProps: {
                                            sx: {
                                                borderRadius: '16px', // dropdown container rounded
                                                padding: '8px',
                                            },
                                        },
                                    }}>
                                    <MenuItem
                                        value=""
                                        sx={{
                                            borderRadius: '16px',
                                            '&:hover': {
                                                backgroundColor: '#063455',
                                                color: '#fff',
                                            },
                                        }}
                                    >
                                        All
                                    </MenuItem>

                                    <MenuItem
                                        value="active"
                                        sx={{
                                            borderRadius: '16px',
                                            '&:hover': {
                                                backgroundColor: '#063455',
                                                color: '#fff',
                                            },
                                        }}
                                    >
                                        Active
                                    </MenuItem>

                                    <MenuItem
                                        value="inactive"
                                        sx={{
                                            borderRadius: '16px',
                                            '&:hover': {
                                                backgroundColor: '#063455',
                                                color: '#fff',
                                            },
                                        }}
                                    >
                                        Inactive
                                    </MenuItem>
                                </Select>
                            </FormControl>
                            <Button 
                            variant="contained" 
                            startIcon={<Search/>}
                            onClick={handleSearch} 
                            sx={{ bgcolor: '#063455', textTransform: 'none', borderRadius: 16 }}>
                                Search
                            </Button>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <Link href={route('pos-locations.trashed')}>
                                <Button variant="outlined" color="error" startIcon={<Delete />} sx={{ textTransform: 'none', borderRadius: 16 }}>
                                    Deleted Items
                                </Button>
                            </Link>
                            <Button variant="contained" startIcon={<Add />} onClick={openCreate} sx={{ bgcolor: '#063455', textTransform: 'none', borderRadius: 16 }}>
                                Add Location
                            </Button>
                        </Box>
                    </Box>
                </Box>

                <Paper>
                    <TableContainer sx={{ borderRadius: '12px', overflowX: 'auto' }}>
                        <Table>
                            <TableHead sx={{ bgcolor: '#063455' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 600, color: '#fff' }}>Name</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#fff' }}>Status</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#fff' }}>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {locations?.data?.length ? (
                                    locations.data.map((loc) => (
                                        <TableRow key={loc.id}>
                                            <TableCell>{loc.name}</TableCell>
                                            <TableCell>{statusChip(loc.status)}</TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', gap: 1 }}>
                                                    <IconButton size="small" color="primary" onClick={() => openEdit(loc)}>
                                                        <FaEdit size={16} style={{ marginRight: 8, color: '#f57c00' }} />
                                                    </IconButton>
                                                    <IconButton size="small" color="error" onClick={() => confirmDelete(loc)}>
                                                        <Delete fontSize="small" />
                                                    </IconButton>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={3} align="center" sx={{ py: 3, color: '#999' }}>
                                            No POS Locations found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>

                {!!locations?.last_page && locations.last_page > 1 && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, mb: 3 }}>
                        <Pagination count={locations.last_page} page={locations.current_page} onChange={handlePageChange} color="primary" />
                    </Box>
                )}

                <Dialog open={modalOpen} onClose={resetModal} maxWidth="xs" fullWidth>
                    <DialogTitle>{editingLocation ? 'Edit POS Location' : 'Add POS Location'}</DialogTitle>
                    <DialogContent>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                            <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} fullWidth />
                            <FormControl fullWidth>
                                <InputLabel>Status</InputLabel>
                                <Select label="Status" value={formStatus} onChange={(e) => setFormStatus(e.target.value)}>
                                    <MenuItem value="active">Active</MenuItem>
                                    <MenuItem value="inactive">Inactive</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={resetModal} sx={{ textTransform: 'none' }}>
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit} variant="contained" sx={{ bgcolor: '#063455', textTransform: 'none' }} disabled={!name}>
                            Save
                        </Button>
                    </DialogActions>
                </Dialog>

                <Dialog open={deleteDialogOpen} onClose={cancelDelete} maxWidth="xs" fullWidth>
                    <DialogTitle>Delete POS Location</DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            Are you sure you want to delete <strong>{locationToDelete?.name}</strong>?
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={cancelDelete} sx={{ textTransform: 'none' }}>
                            Cancel
                        </Button>
                        <Button onClick={handleDelete} color="error" variant="contained" sx={{ textTransform: 'none' }}>
                            Delete
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </AdminLayout>
    );
};

export default PosLocationsIndex;

