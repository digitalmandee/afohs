import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import POSLayout from "@/components/POSLayout";
import { Box, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography, IconButton, Pagination, Tooltip, Backdrop, CircularProgress, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from '@mui/material';
import { RestoreFromTrash as RestoreIcon, DeleteForever as DeleteForeverIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { enqueueSnackbar } from 'notistack';
import dayjs from 'dayjs';
import { routeNameForContext } from '@/lib/utils';

// const drawerWidthOpen = 240;
// const drawerWidthClosed = 110;

const UnitsTrashed = ({ trashedUnits, filters }) => {
    const [open, setOpen] = useState(true);
    const [search, setSearch] = useState(filters.search || '');
    const [processing, setProcessing] = useState(false);

    // Modal States
    const [restoreModalOpen, setRestoreModalOpen] = useState(false);
    const [forceDeleteModalOpen, setForceDeleteModalOpen] = useState(false);
    const [selectedUnit, setSelectedUnit] = useState(null); // Shared for both modals

    const handleSearch = (e) => {
        setSearch(e.target.value);
        router.get(route(routeNameForContext('units.trashed')), { search: e.target.value }, { preserveState: true, replace: true });
    };

    // --- Restore Handlers ---
    const handleOpenRestoreModal = (unit) => {
        setSelectedUnit(unit);
        setRestoreModalOpen(true);
    };

    const handleCloseRestoreModal = () => {
        setRestoreModalOpen(false);
        setSelectedUnit(null);
    };

    const handleRestore = () => {
        if (!selectedUnit) return;
        setProcessing(true);
        router.post(
            route(routeNameForContext('units.restore'), selectedUnit.id),
            {},
            {
                onSuccess: () => {
                    enqueueSnackbar('Unit restored successfully!', { variant: 'success' });
                    handleCloseRestoreModal();
                },
                onError: () => enqueueSnackbar('Failed to restore unit.', { variant: 'error' }),
                onFinish: () => setProcessing(false),
            },
        );
    };

    // --- Force Delete Handlers ---
    const handleOpenForceDeleteModal = (unit) => {
        setSelectedUnit(unit);
        setForceDeleteModalOpen(true);
    };

    const handleCloseForceDeleteModal = () => {
        setForceDeleteModalOpen(false);
        setSelectedUnit(null);
    };

    const handleForceDelete = () => {
        if (!selectedUnit) return;
        setProcessing(true);
        router.delete(route(routeNameForContext('units.force-delete'), selectedUnit.id), {
            onSuccess: () => {
                enqueueSnackbar('Unit permanently deleted!', { variant: 'success' });
                handleCloseForceDeleteModal();
            },
            onError: () => enqueueSnackbar('Failed to delete unit.', { variant: 'error' }),
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <>
            {/* <Head title="Trashed Units" />
            <SideNav open={open} setOpen={setOpen} /> */}

            {/* Global Loader */}
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
                        <IconButton>
                            <ArrowBackIcon sx={{
                                color: '#063455'
                            }} onClick={() => router.visit(route(routeNameForContext('units.index')))} />
                        </IconButton>
                        <Typography sx={{ fontWeight: '600', fontSize: '30px', color: '#063455' }}>
                            Trashed Units
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

                <TableContainer component={Paper} sx={{ borderRadius: '12px', }}>
                    <Table>
                        <TableHead sx={{ bgcolor: '#063455' }}>
                            <TableRow>
                                <TableCell sx={{ color: 'white', fontWeight: '600' }}>Name</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: '600' }}>Deleted At</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: '600' }}>Deleted By</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: '600' }}>
                                    Actions
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {trashedUnits.data.length > 0 ? (
                                trashedUnits.data.map((unit) => (
                                    <TableRow key={unit.id} hover>
                                        <TableCell>{unit.name}</TableCell>
                                        <TableCell>{dayjs(unit.deleted_at).format('DD MMM YYYY, h:mm A')}</TableCell>
                                        <TableCell>{unit.deleted_by || 'N/A'}</TableCell>
                                        <TableCell align="right">
                                            <Tooltip title="Restore">
                                                <IconButton onClick={() => handleOpenRestoreModal(unit)} color="success">
                                                    <RestoreIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Delete Permanently">
                                                <IconButton onClick={() => handleOpenForceDeleteModal(unit)} color="error">
                                                    <DeleteForeverIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} align="center">
                                        No trashed units found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                <Box mt={3} display="flex" justifyContent="center">
                    <Pagination count={trashedUnits.last_page} page={trashedUnits.current_page} onChange={(e, p) => router.get(route(routeNameForContext('units.trashed')), { page: p, search }, { preserveState: true })} color="primary" />
                </Box>
            </Box>

            {/* Restore Confirmation Modal */}
            <Dialog open={restoreModalOpen} onClose={handleCloseRestoreModal}>
                <DialogTitle>Confirm Restore</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to restore unit <b>{selectedUnit?.name}</b>?
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
            </Dialog>

            {/* Force Delete Confirmation Modal */}
            <Dialog open={forceDeleteModalOpen} onClose={handleCloseForceDeleteModal}>
                <DialogTitle sx={{ color: 'error.main' }}>Permanent Delete</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to <b>PERMANENTLY DELETE</b> unit <b>{selectedUnit?.name}</b>?<br />
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
            </Dialog>
        </>
    );
};

UnitsTrashed.layout = (page) => <POSLayout>{page}</POSLayout>;

export default UnitsTrashed;
