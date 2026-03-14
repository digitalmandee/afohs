import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Button, Typography, IconButton, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, TextField, InputAdornment, Chip } from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Search, DeleteForever } from '@mui/icons-material';
import { router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { enqueueSnackbar } from 'notistack';
import AddEventVenueModal from '@/components/App/Events/Venue/AddModal';
import { FaEdit, FaTrash } from 'react-icons/fa';
import Pagination from '@/components/Pagination';

const EventVenues = ({ eventVenuesData, filters: initialFilters }) => {
    const [modalOpen, setModalOpen] = useState(false);
    const [editingVenue, setEditingVenue] = useState(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [venueToDelete, setVenueToDelete] = useState(null);
    const { props } = usePage();
    const csrfToken = props._token;
    const [search, setSearch] = useState(initialFilters?.search || '');

    const handleSearch = () => {
        router.get(
            route('event-venues.index'),
            { search },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const handleAdd = () => {
        setEditingVenue(null);
        setModalOpen(true);
    };

    const handleEdit = (venue) => {
        setEditingVenue(venue);
        setModalOpen(true);
    };

    const confirmDelete = (venue) => {
        setVenueToDelete(venue);
        setDeleteDialogOpen(true);
    };

    const cancelDelete = () => {
        setVenueToDelete(null);
        setDeleteDialogOpen(false);
    };

    const handleDelete = async () => {
        if (!venueToDelete) return;

        try {
            await axios.delete(route('event-venues.destroy', venueToDelete.id), {
                headers: { 'X-CSRF-TOKEN': csrfToken },
            });
            // Refresh the page to reflect changes since we are using Inertia data now
            router.reload();
            enqueueSnackbar('Event Venue deleted successfully.', { variant: 'success' });
        } catch (error) {
            enqueueSnackbar('Failed to delete: ' + (error.response?.data?.message || error.message), {
                variant: 'error',
            });
        } finally {
            cancelDelete();
        }
    };

    const handleSuccess = (data) => {
        // Reload to get updated data from backend
        router.reload();
        setModalOpen(false);
        setEditingVenue(null);
    };

    return (
        <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f5f5', padding: '20px' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography sx={{ fontWeight: 700, fontSize: '30px', color: '#063455' }}>Event Venues</Typography>
                    <Typography style={{ color: '#063455', fontSize: '15px', fontWeight: '600' }}>Define capacity, availability, and venue-specific rules</Typography>
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
                    variant="contained" 
                    startIcon={<AddIcon />} sx={{ backgroundColor: '#063455', textTransform: 'none', borderRadius: '16px' }} onClick={handleAdd}>
                        Add Venue
                    </Button>
                    <Button 
                    variant="outlined" 
                    color="error" 
                    startIcon={<FaTrash size={14} />} 
                    onClick={() => router.visit(route('event-venues.trashed'))} 
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
                            <TableCell sx={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>Venue</TableCell>
                            <TableCell sx={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>Status</TableCell>
                            <TableCell sx={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>Action</TableCell>
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {eventVenuesData.data.length > 0 ? (
                            eventVenuesData.data.map((venue, index) => (
                                <TableRow key={venue.id} style={{ borderBottom: '1px solid #eee' }}>
                                    <TableCell sx={{ color: '#000', fontSize: '14px', fontWeight: 600 }}>{index + 1 + (eventVenuesData.current_page - 1) * eventVenuesData.per_page}</TableCell>
                                    <TableCell sx={{ color: '#7F7F7F', fontSize: '14px' }}>{venue.name}</TableCell>
                                    <TableCell>
                                        <Chip label={venue.status} size="small" color={venue.status === 'active' ? 'success' : 'default'} sx={{ textTransform: 'capitalize' }} />
                                    </TableCell>
                                    <TableCell>
                                        <IconButton onClick={() => handleEdit(venue)} size="small" title="Edit">
                                            <FaEdit size={16} style={{ marginRight: 8, color: '#f57c00' }} />
                                        </IconButton>
                                        <IconButton onClick={() => confirmDelete(venue)} size="small" title="Delete">
                                            <DeleteIcon fontSize="small" color="error" />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} align="center" sx={{ py: 3, color: '#999' }}>
                                    No Event Venues found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
            <Pagination className="mt-6" links={eventVenuesData.links} />

            <AddEventVenueModal open={modalOpen} handleClose={() => setModalOpen(false)} eventVenue={editingVenue} onSuccess={handleSuccess} />

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onClose={cancelDelete} aria-labelledby="delete-dialog-title">
                <DialogTitle id="delete-dialog-title">Delete Event Venue</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete <strong>{venueToDelete?.name}</strong>?
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

export default EventVenues;
