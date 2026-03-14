import React, { useState } from 'react';
import { Typography, Button, TextField, Table, TableContainer, TableHead, TableRow, TableCell, TableBody, Paper, IconButton, Box, InputAdornment, Chip } from '@mui/material';
import { Search, RestoreFromTrash, ArrowBack, DeleteForever } from '@mui/icons-material';
import { router } from '@inertiajs/react'; // ensure correct import
import { useSnackbar } from 'notistack';
import dayjs from 'dayjs';

const Trashed = ({ rooms, filters: initialFilters }) => {
    const { enqueueSnackbar } = useSnackbar();
    const [search, setSearch] = useState(initialFilters?.search || '');
    const [processingId, setProcessingId] = useState(null);

    const handleSearch = () => {
        router.get(
            route('rooms.trashed'),
            { search },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const handleRestore = (id) => {
        setProcessingId(id);
        router.post(
            route('rooms.restore', id),
            {},
            {
                onSuccess: () => {
                    enqueueSnackbar('Room restored successfully', { variant: 'success' });
                    setProcessingId(null);
                },
                onError: () => {
                    enqueueSnackbar('Failed to restore room', { variant: 'error' });
                    setProcessingId(null);
                },
            },
        );
    };

    return (
        <div className="container-fluid px-4 pt-4" style={{ backgroundColor: '#f5f5f5', minHeight: '100vh', overflowX: 'hidden' }}>
            <div>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <IconButton onClick={() => router.get(route('rooms.manage'))}>
                            <ArrowBack sx={{ color: '#063455' }} />
                        </IconButton>
                        <Typography sx={{ fontWeight: 700, fontSize: '30px', color: '#063455' }}>Deleted Rooms</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField
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
                                },
                            }}
                        />
                        <Button variant="contained" startIcon={<Search />} onClick={handleSearch} sx={{ backgroundColor: '#063455', borderRadius: '16px' }}>
                            Search
                        </Button>
                    </Box>
                </Box>

                <TableContainer component={Paper} style={{ boxShadow: 'none', overflowX: 'auto', borderRadius: '16px' }}>
                    <Table>
                        <TableHead>
                            <TableRow style={{ backgroundColor: '#063455', height: '60px' }}>
                                <TableCell sx={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>Room Name</TableCell>
                                <TableCell sx={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>Type</TableCell>
                                <TableCell sx={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>Deleted At</TableCell>
                                <TableCell sx={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {rooms.data.length > 0 ? (
                                rooms.data.map((room) => (
                                    <TableRow key={room.id} style={{ borderBottom: '1px solid #eee' }}>
                                        <TableCell sx={{ color: '#7F7F7F' }}>{room.name}</TableCell>
                                        <TableCell sx={{ color: '#7F7F7F' }}>
                                            <Chip label={room.room_type?.name || 'N/A'} size="small" />
                                        </TableCell>
                                        <TableCell sx={{ color: '#7F7F7F' }}>{dayjs(room.deleted_at).format('DD-MM-YYYY HH:mm')}</TableCell>
                                        <TableCell>
                                            <Button variant="outlined" color="primary" startIcon={<RestoreFromTrash />} onClick={() => handleRestore(room.id)} disabled={processingId === room.id}>
                                                {processingId === room.id ? 'Restoring...' : 'Restore'}
                                            </Button>
                                            <Button
                                                variant="outlined"
                                                color="error"
                                                startIcon={<DeleteForever />}
                                                onClick={() => {
                                                    if (confirm('Are you sure you want to permanently delete this room? This action cannot be undone.')) {
                                                        router.delete(route('rooms.force-delete', room.id), {
                                                            onSuccess: () => enqueueSnackbar('Room deleted permanently', { variant: 'success' }),
                                                            onError: () => enqueueSnackbar('Failed to delete room', { variant: 'error' }),
                                                        });
                                                    }
                                                }}
                                                sx={{ ml: 1 }}
                                            >
                                                Delete Completely
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                                        No deleted rooms found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </div>
        </div>
    );
};

export default Trashed;
