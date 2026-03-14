import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Button, IconButton, Typography, Box, Grid, Card, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from '@mui/material';
import { ArrowBack as ArrowBackIcon, Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, RestoreFromTrash } from '@mui/icons-material';
import { router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { enqueueSnackbar } from 'notistack';
import AddRoomModal from '@/components/App/Rooms/Types/AddModal';
import { FaEdit, FaTrash } from 'react-icons/fa';

const RoomTypes = ({ roomTypesData }) => {
    // const [open, setOpen] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingRoom, setEditingRoom] = useState(null);
    const [roomTypes, setRoomTypes] = useState(roomTypesData || []);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [roomToDelete, setRoomToDelete] = useState(null);
    const { props } = usePage();
    const csrfToken = props._token;

    const handleAdd = () => {
        setEditingRoom(null);
        setModalOpen(true);
    };

    const handleEdit = (room) => {
        setEditingRoom(room);
        setModalOpen(true);
    };

    const confirmDelete = (room) => {
        setRoomToDelete(room);
        setDeleteDialogOpen(true);
    };

    const cancelDelete = () => {
        setRoomToDelete(null);
        setDeleteDialogOpen(false);
    };

    const handleDelete = async () => {
        if (!roomToDelete) return;

        try {
            await axios.delete(route('room-types.destroy', roomToDelete.id), {
                headers: { 'X-CSRF-TOKEN': csrfToken },
            });
            setRoomTypes((prev) => prev.filter((type) => type.id !== roomToDelete.id));
            enqueueSnackbar('Room Type deleted successfully.', { variant: 'success' });
        } catch (error) {
            enqueueSnackbar('Failed to delete: ' + (error.response?.data?.message || error.message), {
                variant: 'error',
            });
        } finally {
            cancelDelete();
        }
    };

    const handleSuccess = (data) => {
        setRoomTypes((prev) => {
            const exists = prev.find((p) => p.id === data.id);
            return exists ? prev.map((p) => (p.id === data.id ? data : p)) : [...prev, data];
        });
        setModalOpen(false);
        setEditingRoom(null);
    };

    return (
        <>
            {/* <SideNav open={open} setOpen={setOpen} /> */}
            <Box
                sx={{
                    minHeight: '100vh',
                    backgroundColor: '#f5f5f5',
                    padding: '20px',
                }}
            >
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }} onClick={() => router.visit(route('rooms.manage'))}>
                        {/* <IconButton>
                            <ArrowBackIcon sx={{ color: '#063455' }} />
                        </IconButton> */}
                        <Typography sx={{ fontWeight: 700, fontSize: '30px', color: '#063455' }}>Room Types</Typography>
                    </Box>
                    <Box>
                        <Button variant="contained" startIcon={<AddIcon />} sx={{ backgroundColor: '#063455', height: 35, borderRadius: '16px', textTransform: 'none' }} onClick={handleAdd}>
                            Add Type
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<FaTrash size={14} />}
                            color='error'
                            style={{
                                borderRadius: '16px',
                                height: 35,
                                marginLeft: '10px',
                                textTransform: 'none',
                            }} onClick={() => router.visit(route('room-types.trashed'))}>
                            Trashed
                        </Button>
                    </Box>
                </Box>
                <Typography style={{ color: '#063455', fontSize: '15px', fontWeight: '600' }}>Manage and define room categories (e.g., Deluxe, Suite, Guest Room)</Typography>

                <TableContainer component={Paper} style={{ boxShadow: 'none', borderRadius: '16px', marginTop: '2rem' }}>
                    <Table>
                        <TableHead>
                            <TableRow style={{ backgroundColor: '#063455', height: '30px' }}>
                                <TableCell sx={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>#</TableCell>
                                <TableCell sx={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>Room Type</TableCell>
                                <TableCell sx={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>Status</TableCell>
                                <TableCell sx={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>Action</TableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {roomTypes.length > 0 ? (
                                roomTypes.map((type, index) => (
                                    <TableRow key={type.id} style={{ borderBottom: '1px solid #eee' }}>
                                        <TableCell sx={{ color: '#000', fontSize: '14px', fontWeight: 600 }}>{index + 1}</TableCell>
                                        <TableCell sx={{ color: '#7F7F7F', fontSize: '14px' }}>{type.name}</TableCell>
                                        <TableCell sx={{ color: '#7F7F7F', fontSize: '14px', textTransform: 'capitalize' }}>{type.status}</TableCell>
                                        <TableCell>
                                            <IconButton onClick={() => handleEdit(type)} size="small" title="Edit">
                                                {/* <EditIcon fontSize="small" /> */}
                                                <FaEdit size={16} style={{ marginRight: 8, color: '#f57c00' }} />
                                            </IconButton>
                                            <IconButton onClick={() => confirmDelete(type)} size="small" title="Delete">
                                                <DeleteIcon fontSize="small" color="error" />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} align="center" sx={{ py: 3, color: '#999' }}>
                                        No Room Types found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>

            <AddRoomModal open={modalOpen} handleClose={() => setModalOpen(false)} roomType={editingRoom} onSuccess={handleSuccess} />

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onClose={cancelDelete} aria-labelledby="delete-dialog-title">
                <DialogTitle id="delete-dialog-title">Delete Room Type</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete <strong>{roomToDelete?.name}</strong>?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={cancelDelete}>Cancel</Button>
                    <Button onClick={handleDelete} color="error" variant="contained">
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default RoomTypes;
