import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Button, Typography, IconButton, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from '@mui/material';
import { ArrowBack as ArrowBackIcon, Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, RestoreFromTrash } from '@mui/icons-material';
import { router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { enqueueSnackbar } from 'notistack';
import AddRoomModal from '@/components/App/Rooms/MiniBar/AddModal'; // Rename this if needed
import { FaEdit, FaTrash } from 'react-icons/fa';

const RoomMiniBar = ({ roomMiniBarData }) => {
    // const [open, setOpen] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [miniBarItems, setMiniBarItems] = useState(roomMiniBarData || []);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const { props } = usePage();
    const csrfToken = props._token;

    const handleAdd = () => {
        setEditingItem(null);
        setModalOpen(true);
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setModalOpen(true);
    };

    const confirmDelete = (item) => {
        setItemToDelete(item);
        setDeleteDialogOpen(true);
    };

    const cancelDelete = () => {
        setItemToDelete(null);
        setDeleteDialogOpen(false);
    };

    const handleDelete = async () => {
        if (!itemToDelete) return;

        try {
            await axios.delete(route('room-minibar.destroy', itemToDelete.id), {
                headers: { 'X-CSRF-TOKEN': csrfToken },
            });
            setMiniBarItems((prev) => prev.filter((item) => item.id !== itemToDelete.id));
            enqueueSnackbar('Mini Bar item deleted successfully.', { variant: 'success' });
        } catch (error) {
            enqueueSnackbar('Failed to delete: ' + (error.response?.data?.message || error.message), {
                variant: 'error',
            });
        } finally {
            cancelDelete();
        }
    };

    const handleSuccess = (data) => {
        setMiniBarItems((prev) => {
            const exists = prev.find((p) => p.id === data.id);
            return exists ? prev.map((p) => (p.id === data.id ? data : p)) : [...prev, data];
        });
        setModalOpen(false);
        setEditingItem(null);
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
                        <Typography sx={{ fontWeight: 700, fontSize: '30px', color: '#063455' }}>Room Mini Bar</Typography>
                    </Box>
                    <Box>

                        <Button variant="contained" startIcon={<AddIcon />} sx={{ backgroundColor: '#063455', borderRadius: '16px', height: 35, textTransform: 'none' }} onClick={handleAdd}>
                            Add Item
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
                            }} onClick={() => router.visit(route('room-minibar.trashed'))}>
                            Trashed
                        </Button>
                    </Box>
                </Box>
                <Typography style={{ color: '#063455', fontSize: '15px', fontWeight: '600' }}>Track item pricing, consumption, and billing during check-out</Typography>

                <TableContainer component={Paper} style={{ boxShadow: 'none', borderRadius: '16px', marginTop: '2rem' }}>
                    <Table>
                        <TableHead>
                            <TableRow style={{ backgroundColor: '#063455', height: '30px' }}>
                                <TableCell sx={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>#</TableCell>
                                <TableCell sx={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>Mini Bar Item</TableCell>
                                <TableCell sx={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>Amount</TableCell>
                                <TableCell sx={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>Status</TableCell>
                                <TableCell sx={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>Action</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {miniBarItems.length > 0 ? (
                                miniBarItems.map((item, index) => (
                                    <TableRow key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                                        <TableCell sx={{ color: '#000', fontWeight: 600, fontSize: '14px' }}>{index + 1}</TableCell>
                                        <TableCell sx={{ color: '#7F7F7F', fontSize: '14px' }}>{item.name}</TableCell>
                                        <TableCell sx={{ color: '#7F7F7F', fontSize: '14px' }}>{item.amount}</TableCell>
                                        <TableCell sx={{ color: '#7F7F7F', fontSize: '14px', textTransform: 'capitalize' }}>{item.status}</TableCell>
                                        <TableCell>
                                            <IconButton onClick={() => handleEdit(item)} size="small" title="Edit">
                                                {/* <EditIcon fontSize="small" /> */}
                                                <FaEdit size={16} style={{ marginRight: 8, color: '#f57c00' }} />
                                            </IconButton>
                                            <IconButton onClick={() => confirmDelete(item)} size="small" title="Delete">
                                                <DeleteIcon fontSize="small" color="error" />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 3, color: '#999' }}>
                                        No Mini Bar items found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>

            <AddRoomModal
                open={modalOpen}
                handleClose={() => setModalOpen(false)}
                roomMinibar={editingItem} // Rename to miniBarItem if you're updating modal
                onSuccess={handleSuccess}
            />

            <Dialog open={deleteDialogOpen} onClose={cancelDelete} aria-labelledby="delete-dialog-title">
                <DialogTitle id="delete-dialog-title">Delete Mini Bar Item</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete <strong>{itemToDelete?.name}</strong> from the mini bar?
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

export default RoomMiniBar;
