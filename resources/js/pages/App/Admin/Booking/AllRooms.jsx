import React from 'react';
import { usePage, router } from '@inertiajs/react';
import { Box, Typography, Paper, Grid, IconButton, Dialog, Button } from '@mui/material';
import ArrowBack from '@mui/icons-material/ArrowBack';
import Bed from '@mui/icons-material/Bed';
import Person from '@mui/icons-material/Person';
import Bathroom from '@mui/icons-material/Bathroom';
import Edit from '@mui/icons-material/Edit';
import Delete from '@mui/icons-material/Delete';
import RestoreFromTrash from '@mui/icons-material/RestoreFromTrash';
import { enqueueSnackbar } from 'notistack';
import { FaEdit, FaTrash } from 'react-icons/fa';

const AllRooms = ({ rooms }) => {
    // const [open, setOpen] = React.useState(true);
    const [confirmDialog, setConfirmDialog] = React.useState({ open: false, roomId: null });

    const handleEdit = (id) => {
        router.visit(route('rooms.edit', id));
    };

    const handleDelete = (id) => {
        setConfirmDialog({ open: true, roomId: id });
    };

    return (
        <>
            {/* <SideNav open={open} setOpen={setOpen} />
            <div
                style={{
                    marginLeft: open ? `${drawerWidthOpen}px` : `${drawerWidthClosed}px`,
                    transition: 'margin-left 0.3s ease-in-out',
                    marginTop: '5rem',
                }}
            > */}
            <div style={{ backgroundColor: '#f5f5f5', minHeight: '100vh', padding: '20px' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {/* <IconButton sx={{ color: '#063455', mr: 1 }} onClick={() => window.history.back()}>
                            <ArrowBack />
                        </IconButton> */}
                        <Typography sx={{ fontWeight: 700, fontSize: '30px', color: '#063455' }}>All Rooms ({rooms.length})</Typography>
                    </Box>
                    <Button
                        variant="outlined"
                        startIcon={<FaTrash size={14} />}
                        color='error'
                        onClick={() => router.visit(route('rooms.trashed'))}
                        style={{
                            borderRadius: '16px',
                            height: 35,
                            // marginLeft: '10px',
                            textTransform: 'none',
                        }}>
                        Trashed
                    </Button>
                </Box>
                <Typography style={{ color: '#063455', fontSize: '15px', fontWeight: '600', marginLeft: 5 }}>Comprehensive list of every room with filters for type and availability</Typography>
                <Box sx={{ mb: 2, mt: 4 }}>
                    <Grid container spacing={2}>
                        {rooms.map((room) => (
                            <Grid item xs={12} key={room.id}>
                                <Paper
                                    elevation={0}
                                    sx={{
                                        borderRadius: 1,
                                        overflow: 'hidden',
                                        display: 'flex',
                                        height: '100px',
                                        bgcolor: '#FFFFFF',
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
                                        <img src={room?.photo_path} alt={room.name} style={{ width: '117px', height: '77px', borderRadius: '16px' }} />
                                    </Box>

                                    <Box sx={{ p: 2, flexGrow: 1 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                            <Typography variant="h6" fontWeight="medium">
                                                {room.name}
                                            </Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <IconButton onClick={() => handleEdit(room.id)} sx={{ color: '#0a3d62' }}>
                                                    <FaEdit size={16} style={{ marginRight: 8, color: '#f57c00' }} />
                                                </IconButton>
                                                <IconButton onClick={() => handleDelete(room.id)} sx={{ color: '#f44336' }}>
                                                    <Delete fontSize="small" />
                                                </IconButton>
                                            </Box>
                                        </Box>

                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <Bed fontSize="small" sx={{ color: '#666', mr: 0.5 }} />
                                                <Typography variant="body2" color="text.secondary">
                                                    {room.number_of_beds} Beds
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <Person fontSize="small" sx={{ color: '#666', mr: 0.5 }} />
                                                <Typography variant="body2" color="text.secondary">
                                                    {room.max_capacity} Guest
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <Bathroom fontSize="small" sx={{ color: '#666', mr: 0.5 }} />
                                                <Typography variant="body2" color="text.secondary">
                                                    {room.number_of_bathrooms} Bathroom
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Box>
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            </div>
            {/* </div> */}

            {/* Delete Confirmation Dialog */}
            <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog({ open: false, roomId: null })}>
                <Box sx={{ p: 3, width: 300 }}>
                    <Typography variant="h6" gutterBottom>
                        Confirm Deletion
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        Are you sure you want to delete this room?
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                        <Button onClick={() => setConfirmDialog({ open: false, roomId: null })} color="inherit">
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            color="error"
                            onClick={() => {
                                router.delete(route('rooms.destroy', confirmDialog.roomId), {
                                    onSuccess: () => {
                                        enqueueSnackbar('Room deleted successfully', { variant: 'success' });
                                        setConfirmDialog({ open: false, roomId: null });
                                    },
                                    onError: () => {
                                        enqueueSnackbar('Failed to delete room', { variant: 'error' });
                                        setConfirmDialog({ open: false, roomId: null });
                                    },
                                });
                            }}
                        >
                            Delete
                        </Button>
                    </Box>
                </Box>
            </Dialog>
        </>
    );
};

export default AllRooms;
