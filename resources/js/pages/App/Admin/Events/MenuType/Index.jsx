import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Button, Typography, IconButton, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, TextField, InputAdornment, Chip } from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Search, DeleteForever } from '@mui/icons-material';
import { router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { enqueueSnackbar } from 'notistack';
import AddEventMenuTypeModal from '@/components/App/Events/MenuType/AddModal';
import { FaEdit, FaTrash } from 'react-icons/fa';
import Pagination from '@/components/Pagination';

const EventMenuTypes = ({ eventMenuTypesData, filters: initialFilters }) => {
    const [modalOpen, setModalOpen] = useState(false);
    const [editingMenuType, setEditingMenuType] = useState(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [menuTypeToDelete, setMenuTypeToDelete] = useState(null);
    const { props } = usePage();
    const csrfToken = props._token;
    const [search, setSearch] = useState(initialFilters?.search || '');

    const handleSearch = () => {
        router.get(
            route('event-menu-type.index'),
            { search },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const handleAdd = () => {
        setEditingMenuType(null);
        setModalOpen(true);
    };

    const handleEdit = (menuType) => {
        setEditingMenuType(menuType);
        setModalOpen(true);
    };

    const confirmDelete = (menuType) => {
        setMenuTypeToDelete(menuType);
        setDeleteDialogOpen(true);
    };

    const cancelDelete = () => {
        setMenuTypeToDelete(null);
        setDeleteDialogOpen(false);
    };

    const handleDelete = async () => {
        if (!menuTypeToDelete) return;

        try {
            await axios.delete(route('event-menu-type.destroy', menuTypeToDelete.id), {
                headers: { 'X-CSRF-TOKEN': csrfToken },
            });
            // Refresh
            router.reload();
            enqueueSnackbar('Event Menu Type deleted successfully.', { variant: 'success' });
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
        setEditingMenuType(null);
    };

    return (
        <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f5f5', padding: '20px' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography sx={{ fontWeight: 700, fontSize: '30px', color: '#063455' }}>Menu Types</Typography>
                    <Typography style={{ color: '#063455', fontSize: '15px', fontWeight: '600' }}>Define menu formats such as Buffet, Hi-Tea, or Plated Service</Typography>
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
                    <Button 
                    variant="contained" startIcon={<AddIcon />} sx={{ backgroundColor: '#063455', height: 35, borderRadius: '16px', textTransform: 'none' }} onClick={handleAdd}>
                        Add Menu Type
                    </Button>
                    <Button 
                    variant="outlined" 
                    color="error" 
                    startIcon={<FaTrash size={14} />} 
                    onClick={() => router.visit(route('event-menu-type.trashed'))} 
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
                            <TableCell sx={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>Menu Type</TableCell>
                            <TableCell sx={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>Status</TableCell>
                            <TableCell sx={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>Action</TableCell>
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {eventMenuTypesData.data.length > 0 ? (
                            eventMenuTypesData.data.map((menuType, index) => (
                                <TableRow key={menuType.id} style={{ borderBottom: '1px solid #eee' }}>
                                    <TableCell sx={{ color: '#000', fontSize: '14px', fontWeight: 600 }}>{index + 1 + (eventMenuTypesData.current_page - 1) * eventMenuTypesData.per_page}</TableCell>
                                    <TableCell sx={{ color: '#7F7F7F', fontSize: '14px' }}>{menuType.name}</TableCell>
                                    <TableCell>
                                        <Chip label={menuType.status} size="small" color={menuType.status === 'active' ? 'success' : 'default'} sx={{ textTransform: 'capitalize' }} />
                                    </TableCell>
                                    <TableCell>
                                        <IconButton onClick={() => handleEdit(menuType)} size="small" title="Edit">
                                            <FaEdit size={16} style={{ marginRight: 8, color: '#f57c00' }} />{' '}
                                        </IconButton>
                                        <IconButton onClick={() => confirmDelete(menuType)} size="small" title="Delete">
                                            <DeleteIcon fontSize="small" color="error" />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} align="center" sx={{ py: 3, color: '#999' }}>
                                    No Event Menu Types found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
            <Pagination className="mt-6" links={eventMenuTypesData.links} />

            <AddEventMenuTypeModal open={modalOpen} handleClose={() => setModalOpen(false)} eventMenuType={editingMenuType} onSuccess={handleSuccess} />

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onClose={cancelDelete} aria-labelledby="delete-dialog-title">
                <DialogTitle id="delete-dialog-title">Delete Event Menu Type</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete <strong>{menuTypeToDelete?.name}</strong>?
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

export default EventMenuTypes;
