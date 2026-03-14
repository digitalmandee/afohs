import React, { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { ArrowBack, DeleteForever, RestoreFromTrash } from '@mui/icons-material';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton, Pagination, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material';
import AdminLayout from '@/layouts/AdminLayout';
import dayjs from 'dayjs';
import { useSnackbar } from 'notistack';

const PosLocationsTrashed = () => {
    const { props } = usePage();
    const { locations, filters } = props;
    const { enqueueSnackbar } = useSnackbar();

    const [search, setSearch] = useState(filters?.search || '');
    const [confirmDialog, setConfirmDialog] = useState({ open: false, id: null });

    const handleSearch = () => {
        router.get(
            route('pos-locations.trashed'),
            { search: search || undefined },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const handlePageChange = (e, page) => {
        router.get(
            route('pos-locations.trashed'),
            { ...filters, page },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const handleRestore = (id) => {
        router.post(route('pos-locations.restore', id), {}, {
            onSuccess: () => enqueueSnackbar('POS location restored successfully.', { variant: 'success' }),
            onError: () => enqueueSnackbar('Failed to restore POS location.', { variant: 'error' }),
        });
    };

    const askForceDelete = (id) => {
        setConfirmDialog({ open: true, id });
    };

    const cancelForceDelete = () => {
        setConfirmDialog({ open: false, id: null });
    };

    const handleForceDelete = () => {
        if (!confirmDialog.id) return;
        router.delete(route('pos-locations.force-delete', confirmDialog.id), {
            onSuccess: () => {
                cancelForceDelete();
                enqueueSnackbar('POS location permanently deleted.', { variant: 'success' });
            },
            onError: () => {
                cancelForceDelete();
                enqueueSnackbar('Failed to permanently delete POS location.', { variant: 'error' });
            },
        });
    };

    return (
        <AdminLayout>
            {/* <Head title="Trashed POS Locations" /> */}

            <Box sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <IconButton href={route('pos-locations.index')} sx={{ color: '#063455' }}>
                        <ArrowBack />
                    </IconButton>
                    <Box>
                        <Typography sx={{ fontWeight: 700, fontSize: '30px', color: '#063455' }}>Trashed POS Locations</Typography>
                    </Box>
                </Box>
                <Typography sx={{ fontWeight: 600, fontSize: '15px', color: '#063455' }}>Restore or permanently delete removed POS locations.</Typography>

                <Box sx={{ mt: 2, mb: 2 }}>
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
                        <Button 
                        variant="contained" 
                        startIcon={<Search/>}
                        onClick={handleSearch} sx={{ bgcolor: '#063455', textTransform: 'none', borderRadius: 16 }}>
                            Search
                        </Button>
                    </Box>
                </Box>

                <Paper>
                    <TableContainer sx={{ borderRadius: '12px', overflowX: 'auto' }}>
                        <Table>
                            <TableHead sx={{ bgcolor: '#063455' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 600, color: '#fff' }}>Name</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#fff' }}>Deleted At</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#fff' }}>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {locations?.data?.length ? (
                                    locations.data.map((loc) => (
                                        <TableRow key={loc.id}>
                                            <TableCell>{loc.name}</TableCell>
                                            <TableCell>{loc.deleted_at ? dayjs(loc.deleted_at).format('YYYY-MM-DD HH:mm') : '-'}</TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', gap: 1 }}>
                                                    <IconButton size="small" onClick={() => handleRestore(loc.id)} sx={{ color: '#2e7d32' }}>
                                                        <RestoreFromTrash fontSize="small" />
                                                    </IconButton>
                                                    <IconButton size="small" onClick={() => askForceDelete(loc.id)} sx={{ color: '#c62828' }}>
                                                        <DeleteForever fontSize="small" />
                                                    </IconButton>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={3} align="center" sx={{ py: 3, color: '#999' }}>
                                            No trashed POS Locations found.
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

                <Dialog open={confirmDialog.open} onClose={cancelForceDelete} maxWidth="xs" fullWidth>
                    <DialogTitle>Permanently delete?</DialogTitle>
                    <DialogContent>
                        <DialogContentText>This action cannot be undone.</DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={cancelForceDelete} sx={{ textTransform: 'none' }}>
                            Cancel
                        </Button>
                        <Button onClick={handleForceDelete} color="error" variant="contained" sx={{ textTransform: 'none' }}>
                            Delete Forever
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </AdminLayout>
    );
};

export default PosLocationsTrashed;

