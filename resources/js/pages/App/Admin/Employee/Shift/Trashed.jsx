import { router } from '@inertiajs/react';
import { Box, Button, Dialog, DialogActions, DialogContent, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, Typography, IconButton } from '@mui/material';
import { useState } from 'react';
import { useSnackbar } from 'notistack';
import { MdRestore } from 'react-icons/md';
import { RiDeleteBin6Line } from 'react-icons/ri';
import { RestoreFromTrash, DeleteForever, ArrowBack } from '@mui/icons-material';

const Trashed = ({ shifts }) => {
    const { enqueueSnackbar } = useSnackbar();
    const { data, total, per_page, current_page } = shifts;

    const [openDeleteModal, setOpenDeleteModal] = useState(false);
    const [selectedId, setSelectedId] = useState(null);

    const handleRestore = (id) => {
        router.post(
            route('shifts.restore', id),
            {},
            {
                onSuccess: () => enqueueSnackbar('Shift restored successfully', { variant: 'success' }),
                onError: () => enqueueSnackbar('Failed to restore shift', { variant: 'error' }),
            },
        );
    };

    const handleForceDelete = () => {
        router.delete(route('shifts.force-delete', selectedId), {
            onSuccess: () => {
                enqueueSnackbar('Shift permanently deleted', { variant: 'success' });
                setOpenDeleteModal(false);
            },
            onError: () => enqueueSnackbar('Failed to delete shift', { variant: 'error' }),
        });
    };

    return (
        <Box sx={{ p: 2, bgcolor: '#f5f5f5', height: '100vh' }}>
            <Box sx={{ display: 'flex', mb: 3 }}>
                <IconButton onClick={() => router.visit(route('shifts.index'))} sx={{ color: '#063455' }}>
                    <ArrowBack />
                </IconButton>
                <Typography sx={{ color: '#063455', fontWeight: 600, fontSize: '30px' }}>
                    Trashed Shifts
                </Typography>
            </Box>

            <TableContainer component={Paper} elevation={0} sx={{ borderRadius: '12px' }}>
                <Table>
                    <TableHead sx={{ bgcolor: '#063455' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 600, color: '#fff' }}>Name</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: '#fff' }}>Time</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: '#fff' }}>Action</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} align="center">
                                    No trashed shifts found
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell>{item.name}</TableCell>
                                    <TableCell>
                                        {item.start_time} - {item.end_time}
                                    </TableCell>
                                    <TableCell>
                                        <IconButton onClick={() => handleRestore(item.id)} color="primary" title="Restore">
                                            <MdRestore />
                                        </IconButton>
                                        <IconButton
                                            onClick={() => {
                                                setSelectedId(item.id);
                                                setOpenDeleteModal(true);
                                            }}
                                            color="error"
                                            title="Delete Permanently"
                                        >
                                            <RiDeleteBin6Line />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <TablePagination component="div" count={total} page={current_page - 1} onPageChange={(e, p) => router.visit(route('shifts.trashed', { page: p + 1 }))} rowsPerPage={per_page} rowsPerPageOptions={[10]} />

            <Dialog open={openDeleteModal} onClose={() => setOpenDeleteModal(false)}>
                <DialogContent>
                    <Typography>Are you sure you want to permanently delete this shift?</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDeleteModal(false)}>Cancel</Button>
                    <Button onClick={handleForceDelete} color="error" variant="contained">
                        Delete Forever
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Trashed;
