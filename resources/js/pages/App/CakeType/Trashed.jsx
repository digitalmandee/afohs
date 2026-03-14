import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import POSLayout from "@/components/POSLayout";
import { Box, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography, IconButton, Pagination, Tooltip, Backdrop, CircularProgress, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Chip } from '@mui/material';
import { RestoreFromTrash as RestoreIcon, DeleteForever as DeleteForeverIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { enqueueSnackbar } from 'notistack';
import dayjs from 'dayjs';
import { routeNameForContext } from '@/lib/utils';

// const drawerWidthOpen = 240;
// const drawerWidthClosed = 110;

const CakeTypesTrashed = ({ trashedTypes, filters }) => {
    // const [open, setOpen] = useState(true);
    const [search, setSearch] = useState(filters.search || '');
    const [processing, setProcessing] = useState(false);

    // Modal States
    const [restoreModalOpen, setRestoreModalOpen] = useState(false);
    const [forceDeleteModalOpen, setForceDeleteModalOpen] = useState(false);
    const [selectedType, setSelectedType] = useState(null);

    const handleSearch = (e) => {
        setSearch(e.target.value);
        router.get(route(routeNameForContext('cake-types.trashed')), { search: e.target.value }, { preserveState: true, replace: true });
    };

    // --- Restore Handlers ---
    const handleOpenRestoreModal = (type) => {
        setSelectedType(type);
        setRestoreModalOpen(true);
    };

    const handleCloseRestoreModal = () => {
        setRestoreModalOpen(false);
        setSelectedType(null);
    };

    const handleRestore = () => {
        if (!selectedType) return;
        setProcessing(true);
        router.post(
            route(routeNameForContext('cake-types.restore'), selectedType.id),
            {},
            {
                onSuccess: () => {
                    enqueueSnackbar('Cake Type restored successfully!', { variant: 'success' });
                    handleCloseRestoreModal();
                },
                onError: () => enqueueSnackbar('Failed to restore Cake Type.', { variant: 'error' }),
                onFinish: () => setProcessing(false),
            },
        );
    };

    // --- Force Delete Handlers ---
    const handleOpenForceDeleteModal = (type) => {
        setSelectedType(type);
        setForceDeleteModalOpen(true);
    };

    const handleCloseForceDeleteModal = () => {
        setForceDeleteModalOpen(false);
        setSelectedType(null);
    };

    const handleForceDelete = () => {
        if (!selectedType) return;
        setProcessing(true);
        router.delete(route(routeNameForContext('cake-types.force-delete'), selectedType.id), {
            onSuccess: () => {
                enqueueSnackbar('Cake Type permanently deleted!', { variant: 'success' });
                handleCloseForceDeleteModal();
            },
            onError: () => enqueueSnackbar('Failed to delete Cake Type.', { variant: 'error' }),
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <>
            {/* <Head title="Trashed Cake Types" />
            <SideNav open={open} setOpen={setOpen} /> */}

            <Backdrop sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1000 }} open={processing}>
                <CircularProgress color="inherit" />
            </Backdrop>

            {/* <Box
                sx={{
                    marginLeft: open ? `${drawerWidthOpen}px` : `${drawerWidthClosed}px`,
                    transition: 'margin-left 0.3s ease-in-out',
                    padding: '1rem',
                    marginTop: '5rem',
                }}
            > */}
            <Box sx={{
                p: 2,
                bgcolor: '#f5f5f5',
                minHeight: '100vh'
            }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Box display="flex" alignItems="center">
                        <IconButton>
                            <ArrowBackIcon sx={{ color: '#063455' }} onClick={() => router.visit(route(routeNameForContext('cake-types.index')))} />
                        </IconButton>
                        <Typography sx={{ fontWeight: '600', fontSize: '30px', color: '#063455' }}>
                            Trashed Cake Types
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
                                "& .MuiOutlinedInput-root": {
                                    borderRadius: "16px",
                                },
                            }} />
                    </Box>
                </Box>

                <TableContainer component={Paper} sx={{ borderRadius: '12px' }}>
                    <Table>
                        <TableHead sx={{ bgcolor: '#063455' }}>
                            <TableRow>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Name</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Price</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Deleted At</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Deleted By</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">
                                    Actions
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {trashedTypes.data.length > 0 ? (
                                trashedTypes.data.map((type) => (
                                    <TableRow key={type.id} hover>
                                        <TableCell>{type.name}</TableCell>
                                        <TableCell>{type.price}</TableCell>
                                        <TableCell>{dayjs(type.deleted_at).format('DD MMM YYYY, h:mm A')}</TableCell>
                                        <TableCell>{type.deleted_by || 'N/A'}</TableCell>
                                        <TableCell align="right">
                                            <Tooltip title="Restore">
                                                <IconButton onClick={() => handleOpenRestoreModal(type)} color="success">
                                                    <RestoreIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Delete Permanently">
                                                <IconButton onClick={() => handleOpenForceDeleteModal(type)} color="error">
                                                    <DeleteForeverIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} align="center">
                                        No trashed cake types found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                <Box mt={3} display="flex" justifyContent="center">
                    <Pagination count={trashedTypes.last_page} page={trashedTypes.current_page} onChange={(e, p) => router.get(route(routeNameForContext('cake-types.trashed')), { page: p, search }, { preserveState: true })} color="primary" />
                </Box>
            </Box >

            {/* Restore Confirmation Modal */}
            < Dialog open={restoreModalOpen} onClose={handleCloseRestoreModal} >
                <DialogTitle>Confirm Restore</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to restore Cake Type <b>{selectedType?.name}</b>?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseRestoreModal} disabled={processing}>
                        Cancel
                    </Button>
                    <Button onClick={handleRestore} color="success" variant="contained" disabled={processing}>
                        Restore
                    </Button>
                </DialogActions>
            </Dialog >

            {/* Force Delete Confirmation Modal */}
            < Dialog open={forceDeleteModalOpen} onClose={handleCloseForceDeleteModal} >
                <DialogTitle sx={{ color: 'error.main' }}>Permanent Delete</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to <b>PERMANENTLY DELETE</b> Cake Type <b>{selectedType?.name}</b>?<br />
                        This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseForceDeleteModal} disabled={processing}>
                        Cancel
                    </Button>
                    <Button onClick={handleForceDelete} color="error" variant="contained" disabled={processing}>
                        Delete Permanently
                    </Button>
                </DialogActions>
            </Dialog >
        </>
    );
};

CakeTypesTrashed.layout = (page) => <POSLayout>{page}</POSLayout>;

export default CakeTypesTrashed;
