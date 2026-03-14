import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Button, Typography, IconButton, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from '@mui/material';
import { ArrowBack as ArrowBackIcon, Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, RestoreFromTrash } from '@mui/icons-material';
import { router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { enqueueSnackbar } from 'notistack';
import AddRoomCategoryModal from '@/components/App/Rooms/Categories/AddModal'; // <-- use appropriate modal path
import { FaEdit, FaTrash } from 'react-icons/fa';

const RoomCategories = ({ roomCategoriesData }) => {
    // const [open, setOpen] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [roomCategories, setRoomCategories] = useState(roomCategoriesData || []);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState(null);
    const { props } = usePage();
    const csrfToken = props._token;

    const handleAdd = () => {
        setEditingCategory(null);
        setModalOpen(true);
    };

    const handleEdit = (category) => {
        setEditingCategory(category);
        setModalOpen(true);
    };

    const confirmDelete = (category) => {
        setCategoryToDelete(category);
        setDeleteDialogOpen(true);
    };

    const cancelDelete = () => {
        setCategoryToDelete(null);
        setDeleteDialogOpen(false);
    };

    const handleDelete = async () => {
        if (!categoryToDelete) return;

        try {
            await axios.delete(route('room-categories.destroy', categoryToDelete.id), {
                headers: { 'X-CSRF-TOKEN': csrfToken },
            });
            setRoomCategories((prev) => prev.filter((c) => c.id !== categoryToDelete.id));
            enqueueSnackbar('Room Category deleted successfully.', { variant: 'success' });
        } catch (error) {
            enqueueSnackbar('Failed to delete: ' + (error.response?.data?.message || error.message), {
                variant: 'error',
            });
        } finally {
            cancelDelete();
        }
    };

    const handleSuccess = (data) => {
        setRoomCategories((prev) => {
            const exists = prev.find((p) => p.id === data.id);
            return exists ? prev.map((p) => (p.id === data.id ? data : p)) : [...prev, data];
        });
        setModalOpen(false);
        setEditingCategory(null);
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
                        <Typography sx={{ fontWeight: 700, fontSize: '30px', color: '#063455' }}>Room Categories</Typography>
                    </Box>
                    <Box>
                        <Button variant="contained" startIcon={<AddIcon />} sx={{ backgroundColor: '#063455', height: 35, borderRadius: '16px', textTransform: 'none' }} onClick={handleAdd}>
                            Add Category
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
                            }} onClick={() => router.visit(route('room-categories.trashed'))}>
                            Trashed
                        </Button>
                    </Box>
                </Box>
                <Typography style={{ color: '#063455', fontSize: '15px', fontWeight: '600' }}>Define and manage room classifications based on comfort level and facilities</Typography>

                <TableContainer component={Paper} style={{ boxShadow: 'none', borderRadius: '16px', marginTop: '2rem' }}>
                    <Table>
                        <TableHead>
                            <TableRow style={{ backgroundColor: '#063455', height: '30px' }}>
                                <TableCell sx={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>#</TableCell>
                                <TableCell sx={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>Category Name</TableCell>
                                <TableCell sx={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>Status</TableCell>
                                <TableCell sx={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>Action</TableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {roomCategories.length > 0 ? (
                                roomCategories.map((category, index) => (
                                    <TableRow key={category.id} style={{ borderBottom: '1px solid #eee' }}>
                                        <TableCell sx={{ color: '#000', fontWeight: 600, fontSize: '14px' }}>{index + 1}</TableCell>
                                        <TableCell sx={{ color: '#7F7F7F', fontSize: '14px' }}>{category.name}</TableCell>
                                        <TableCell sx={{ color: '#7F7F7F', fontSize: '14px', textTransform: 'capitalize' }}>{category.status}</TableCell>
                                        <TableCell>
                                            <IconButton onClick={() => handleEdit(category)} size="small" title="Edit">
                                                {/* <EditIcon fontSize="small" /> */}
                                                <FaEdit size={16} style={{ marginRight: 8, color: '#f57c00' }} />
                                            </IconButton>
                                            <IconButton onClick={() => confirmDelete(category)} size="small" title="Delete">
                                                <DeleteIcon fontSize="small" color="error" />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={3} align="center" sx={{ py: 3, color: '#999' }}>
                                        No Room Categories found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>

            <AddRoomCategoryModal open={modalOpen} handleClose={() => setModalOpen(false)} roomCategory={editingCategory} onSuccess={handleSuccess} />

            <Dialog open={deleteDialogOpen} onClose={cancelDelete}>
                <DialogTitle>Delete Room Category</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete <strong>{categoryToDelete?.name}</strong>?
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

export default RoomCategories;
