import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import POSLayout from "@/components/POSLayout";
import { Box, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography, IconButton, Pagination, Dialog, DialogTitle, DialogContent, DialogActions, Backdrop, CircularProgress, DialogContentText } from '@mui/material';
import { RestoreFromTrash as RestoreIcon, DeleteForever as DeleteForeverIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { enqueueSnackbar } from 'notistack';
import dayjs from 'dayjs';
import { routeNameForContext } from '@/lib/utils';

const SubCategoriesTrashed = ({ trashedSubCategories, filters }) => {
    // const [open, setOpen] = useState(true);
    const [search, setSearch] = useState(filters.search || '');
    const [processing, setProcessing] = useState(false);

    // Confirm Modals
    const [restoreModalOpen, setRestoreModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

    const handleSearch = (e) => {
        setSearch(e.target.value);
        router.get(route(routeNameForContext('sub-categories.trashed')), { search: e.target.value }, { preserveState: true, replace: true });
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
            route(routeNameForContext('sub-categories.restore'), selectedItem.id),
            {},
            {
                onSuccess: () => {
                    enqueueSnackbar('Sub Category restored successfully!', { variant: 'success' });
                    setRestoreModalOpen(false);
                    setSelectedItem(null);
                },
                onError: () => enqueueSnackbar('Failed to restore sub category.', { variant: 'error' }),
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
        router.delete(route(routeNameForContext('sub-categories.force-delete'), selectedItem.id), {
            onSuccess: () => {
                enqueueSnackbar('Sub Category permanently deleted!', { variant: 'success' });
                setDeleteModalOpen(false);
                setSelectedItem(null);
            },
            onError: () => enqueueSnackbar('Failed to delete sub category.', { variant: 'error' }),
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <>
            {/* <Head title="Trashed Sub Categories" />
            <SideNav open={open} setOpen={setOpen} /> */}

            <Backdrop sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1000 }} open={processing}>
                <CircularProgress color="inherit" />
            </Backdrop>

            <Box
                sx={{
                    bgcolor: '#f5f5f5',
                    p: 2,
                    minHeight: '100vh'
                }}
            >
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Box display="flex" alignItems="center" gap={1}>
                        <IconButton onClick={() => router.visit(route(routeNameForContext('sub-categories.index')))}>
                            <ArrowBackIcon />
                        </IconButton>
                        <Typography sx={{ color: '#063455', fontWeight: '600', fontSize: '30px' }}>
                            Trashed Sub Categories
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

                <TableContainer component={Paper} sx={{ borderRadius: '12px', boxShadow: 3 }}>
                    <Table>
                        <TableHead sx={{ bgcolor: '#063455' }}>
                            <TableRow>
                                <TableCell sx={{ color: 'white', fontWeight: '600' }}>Main Category</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: '600' }}>Name</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: '600' }}>Deleted At</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: '600' }}>
                                    Actions
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {trashedSubCategories.data.length > 0 ? (
                                trashedSubCategories.data.map((item) => (
                                    <TableRow key={item.id} hover>
                                        <TableCell>{item.category?.name || 'N/A'}</TableCell>
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
                                    <TableCell colSpan={4} align="center">
                                        No trashed sub categories found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                <Box mt={3} display="flex" justifyContent="center">
                    <Pagination count={trashedSubCategories.last_page} page={trashedSubCategories.current_page} onChange={(e, p) => router.get(route(routeNameForContext('sub-categories.trashed')), { page: p, search }, { preserveState: true })} color="primary" />
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

SubCategoriesTrashed.layout = (page) => <POSLayout>{page}</POSLayout>;

export default SubCategoriesTrashed;
