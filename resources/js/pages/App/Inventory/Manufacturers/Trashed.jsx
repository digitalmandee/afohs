import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import POSLayout from "@/components/POSLayout";
import { Box, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography, IconButton, Pagination, Dialog, DialogTitle, DialogContent, DialogActions, Backdrop, CircularProgress, DialogContentText } from '@mui/material';
import { RestoreFromTrash as RestoreIcon, DeleteForever as DeleteForeverIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { enqueueSnackbar } from 'notistack';
import dayjs from 'dayjs';
import { routeNameForContext } from '@/lib/utils';

// const drawerWidthOpen = 240;
// const drawerWidthClosed = 110;

const ManufacturersTrashed = ({ trashedManufacturers, filters }) => {
    const [open, setOpen] = useState(true);
    const [search, setSearch] = useState(filters.search || '');
    const [processing, setProcessing] = useState(false);

    // Confirm Modals
    const [restoreModalOpen, setRestoreModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

    const handleSearch = (e) => {
        setSearch(e.target.value);
        router.get(route(routeNameForContext('manufacturers.trashed')), { search: e.target.value }, { preserveState: true, replace: true });
    };

    // Restore
    const handleOpenRestoreModal = (item) => {
        setSelectedItem(item);
        setRestoreModalOpen(true);
    };

    const handleRestore = () => {
        if (!selectedItem) return;
        setProcessing(true);
        router.post(
            route(routeNameForContext('manufacturers.restore'), selectedItem.id),
            {},
            {
                onSuccess: () => {
                    enqueueSnackbar('Manufacturer restored successfully!', { variant: 'success' });
                    setRestoreModalOpen(false);
                    setSelectedItem(null);
                },
                onError: () => enqueueSnackbar('Failed to restore manufacturer.', { variant: 'error' }),
                onFinish: () => setProcessing(false),
            },
        );
    };

    // Force Delete
    const handleOpenDeleteModal = (item) => {
        setSelectedItem(item);
        setDeleteModalOpen(true);
    };

    const handleForceDelete = () => {
        if (!selectedItem) return;
        setProcessing(true);
        router.delete(route(routeNameForContext('manufacturers.force-delete'), selectedItem.id), {
            onSuccess: () => {
                enqueueSnackbar('Manufacturer permanently deleted!', { variant: 'success' });
                setDeleteModalOpen(false);
                setSelectedItem(null);
            },
            onError: () => enqueueSnackbar('Failed to delete manufacturer.', { variant: 'error' }),
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <>
            {/* <Head title="Trashed Manufacturers" />
            <SideNav open={open} setOpen={setOpen} /> */}

            <Backdrop sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1000 }} open={processing}>
                <CircularProgress color="inherit" />
            </Backdrop>

            <Box
                sx={{
                    p: 2,
                    bgcolor: '#f5f5f5',
                    minHeight: '100vh'
                }}
            >
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Box display="flex" alignItems="center">
                        <IconButton sx={{color:'#063455'}} onClick={() => router.visit(route(routeNameForContext('manufacturers.index')))}>
                            <ArrowBackIcon />
                        </IconButton>
                        <Typography sx={{fontWeight:'600', fontSize:'30px', color:'#063455'}}>
                            Trashed Manufacturers
                        </Typography>
                    </Box>
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
                    </Box>
                </Box>

                <TableContainer component={Paper} sx={{ borderRadius: '12px' }}>
                    <Table>
                        <TableHead sx={{ bgcolor: '#063455' }}>
                            <TableRow>
                                <TableCell sx={{ color: 'white', fontWeight: '600' }}>Name</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: '600' }}>Deleted At</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: '600' }}>
                                    Actions
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {trashedManufacturers.data.length > 0 ? (
                                trashedManufacturers.data.map((item) => (
                                    <TableRow key={item.id} hover>
                                        <TableCell>{item.name}</TableCell>
                                        <TableCell>{dayjs(item.deleted_at).format('DD MMM YYYY, h:mm A')}</TableCell>
                                        <TableCell align="right">
                                            <IconButton onClick={() => handleOpenRestoreModal(item)} color="success" title="Restore">
                                                <RestoreIcon />
                                            </IconButton>
                                            <IconButton onClick={() => handleOpenDeleteModal(item)} color="error" title="Permanently Delete">
                                                <DeleteForeverIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={3} align="center">
                                        No trashed manufacturers found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                <Box mt={3} display="flex" justifyContent="center">
                    <Pagination count={trashedManufacturers.last_page} page={trashedManufacturers.current_page} onChange={(e, p) => router.get(route(routeNameForContext('manufacturers.trashed')), { page: p, search }, { preserveState: true })} color="primary" />
                </Box>
            </Box>

            {/* Restore Confirm Modal */}
            <Dialog open={restoreModalOpen} onClose={() => setRestoreModalOpen(false)}>
                <DialogTitle>Confirm Restore</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to restore <b>{selectedItem?.name}</b>?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setRestoreModalOpen(false)} disabled={processing}>
                        Cancel
                    </Button>
                    <Button onClick={handleRestore} color="success" variant="contained" disabled={processing}>
                        Restore
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Force Delete Confirm Modal */}
            <Dialog open={deleteModalOpen} onClose={() => setDeleteModalOpen(false)}>
                <DialogTitle>Confirm Permanent Delete</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to permanently delete <b>{selectedItem?.name}</b>? This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteModalOpen(false)} disabled={processing}>
                        Cancel
                    </Button>
                    <Button onClick={handleForceDelete} color="error" variant="contained" disabled={processing}>
                        Delete Forever
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

ManufacturersTrashed.layout = (page) => <POSLayout>{page}</POSLayout>;

export default ManufacturersTrashed;
