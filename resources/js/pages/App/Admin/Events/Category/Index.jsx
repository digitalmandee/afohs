import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Button, Typography, IconButton, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, TextField, InputAdornment, Chip } from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Search, DeleteForever } from '@mui/icons-material';
import { router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { enqueueSnackbar } from 'notistack';
import AddEventMenuCategoryModal from '@/components/App/Events/MenuCategory/AddModal';
import { FaEdit, FaTrash } from 'react-icons/fa';
import Pagination from '@/components/Pagination';

const EventMenuCategories = ({ eventMenuCategoriesData, filters: initialFilters }) => {
    const [modalOpen, setModalOpen] = useState(false);
    const [editingMenuCategory, setEditingMenuCategory] = useState(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [menuCategoryToDelete, setMenuCategoryToDelete] = useState(null);
    const { props } = usePage();
    const csrfToken = props._token;
    const [search, setSearch] = useState(initialFilters?.search || '');

    const handleSearch = () => {
        router.get(
            route('event-menu-category.index'),
            { search },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const handleAdd = () => {
        setEditingMenuCategory(null);
        setModalOpen(true);
    };

    const handleEdit = (menuCategory) => {
        setEditingMenuCategory(menuCategory);
        setModalOpen(true);
    };

    const confirmDelete = (menuCategory) => {
        setMenuCategoryToDelete(menuCategory);
        setDeleteDialogOpen(true);
    };

    const cancelDelete = () => {
        setMenuCategoryToDelete(null);
        setDeleteDialogOpen(false);
    };

    const handleDelete = async () => {
        if (!menuCategoryToDelete) return;

        try {
            await axios.delete(route('event-menu-category.destroy', menuCategoryToDelete.id), {
                headers: { 'X-CSRF-TOKEN': csrfToken },
            });
            // Refresh
            router.reload();
            enqueueSnackbar('Event Menu Category deleted successfully.', { variant: 'success' });
        } catch (error) {
            enqueueSnackbar('Failed to delete: ' + (error.response?.data?.message || error.message), {
                variant: 'error',
            });
        } finally {
            cancelDelete();
        }
    };

    const handleSuccess = (data) => {
        // Refresh
        router.reload();
        setModalOpen(false);
        setEditingMenuCategory(null);
    };

    return (
        <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f5f5', padding: '20px' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography sx={{ fontWeight: 700, fontSize: '30px', color: '#063455' }}>Menu Categories</Typography>
                    <Typography style={{ color: '#063455', fontSize: '15px', fontWeight: '600' }}>Organize menu items into logical categories (e.g., Starters, Main Course)</Typography>
                </Box>
                <div className="flex items-center gap-2">
                    {/* <TextField
                        placeholder="Search..."
                        size="small"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search />
                                </InputAdornment>
                            ),
                        }}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: '16px',
                                backgroundColor: 'white',
                            },
                        }}
                    />
                    <Button variant="contained" startIcon={<Search />} onClick={handleSearch} sx={{ backgroundColor: '#063455', borderRadius: '16px', textTransform: 'none' }}>
                        Search
                    </Button> */}
                    <Button variant="contained" startIcon={<AddIcon />} sx={{ backgroundColor: '#063455', height: 35, borderRadius: '16px', textTransform: 'none' }} onClick={handleAdd}>
                        Add Menu Category
                    </Button>
                    <Button 
                    variant="outlined" 
                    color="error" 
                    startIcon={<FaTrash size={14} />} 
                    onClick={() => router.visit(route('event-menu-category.trashed'))} 
                    sx={{ borderRadius: '16px', textTransform:'none', ml:2 }}>
                        Trashed
                    </Button>
                </div>
            </Box>

            <TableContainer component={Paper} style={{ boxShadow: 'none', borderRadius: '16px' }}>
                <Table>
                    <TableHead>
                        <TableRow style={{ backgroundColor: '#063455', height: '60px' }}>
                            <TableCell sx={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>#</TableCell>
                            <TableCell sx={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>Menu Category</TableCell>
                            <TableCell sx={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>Status</TableCell>
                            <TableCell sx={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>Action</TableCell>
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {eventMenuCategoriesData.data.length > 0 ? (
                            eventMenuCategoriesData.data.map((menuCategory, index) => (
                                <TableRow key={menuCategory.id} style={{ borderBottom: '1px solid #eee' }}>
                                    <TableCell sx={{ color: '#000', fontSize: '14px', fontWeight: 600 }}>{index + 1 + (eventMenuCategoriesData.current_page - 1) * eventMenuCategoriesData.per_page}</TableCell>
                                    <TableCell sx={{ color: '#7F7F7F', fontSize: '14px' }}>{menuCategory.name}</TableCell>
                                    <TableCell>
                                        <Chip label={menuCategory.status} size="small" color={menuCategory.status === 'active' ? 'success' : 'default'} sx={{ textTransform: 'capitalize' }} />
                                    </TableCell>
                                    <TableCell>
                                        <IconButton onClick={() => handleEdit(menuCategory)} size="small" title="Edit">
                                            <FaEdit size={16} style={{ marginRight: 8, color: '#f57c00' }} />{' '}
                                        </IconButton>
                                        <IconButton onClick={() => confirmDelete(menuCategory)} size="small" title="Delete">
                                            <DeleteIcon fontSize="small" color="error" />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} align="center" sx={{ py: 3, color: '#999' }}>
                                    No Event Menu Categories found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
            <Pagination className="mt-6" links={eventMenuCategoriesData.links} />

            <AddEventMenuCategoryModal open={modalOpen} handleClose={() => setModalOpen(false)} eventMenuCategory={editingMenuCategory} onSuccess={handleSuccess} />

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onClose={cancelDelete} aria-labelledby="delete-dialog-title">
                <DialogTitle id="delete-dialog-title">Delete Event Menu Category</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete <strong>{menuCategoryToDelete?.name}</strong>?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={cancelDelete}>Cancel</Button>
                    <Button onClick={handleDelete} color="error" variant="contained">
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default EventMenuCategories;
