import React, { useState } from 'react';
import { Typography, Button, TextField, Table, TableContainer, TableHead, TableRow, TableCell, TableBody, Paper, IconButton, Box, InputAdornment, Chip } from '@mui/material';
import { Search, RestoreFromTrash, ArrowBack, DeleteForever } from '@mui/icons-material';
import { router } from '@inertiajs/react';
import { useSnackbar } from 'notistack';
import dayjs from 'dayjs';
import Pagination from '@/components/Pagination';

const Trashed = ({ roomTypes, filters: initialFilters }) => {
    const { enqueueSnackbar } = useSnackbar();
    const [search, setSearch] = useState(initialFilters?.search || '');
    const [processingId, setProcessingId] = useState(null);

    const handleSearch = () => {
        router.get(
            route('room-types.trashed'),
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
            route('room-types.restore', id),
            {},
            {
                onSuccess: () => {
                    enqueueSnackbar('Room Type restored successfully', { variant: 'success' });
                    setProcessingId(null);
                },
                onError: () => {
                    enqueueSnackbar('Failed to restore room type', { variant: 'error' });
                    setProcessingId(null);
                },
            },
        );
    };

    return (
        <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f5f5', padding: '20px' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <IconButton onClick={() => router.get(route('room-types.index'))}>
                        <ArrowBack sx={{ color: '#063455' }} />
                    </IconButton>
                    <Typography sx={{ fontWeight: 700, fontSize: '30px', color: '#063455' }}>Deleted Room Types</Typography>
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
                            <TableCell sx={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>Name</TableCell>
                            <TableCell sx={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>Status</TableCell>
                            <TableCell sx={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>Deleted At</TableCell>
                            <TableCell sx={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {roomTypes.data.length > 0 ? (
                            roomTypes.data.map((item) => (
                                <TableRow key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                                    <TableCell sx={{ color: '#7F7F7F' }}>{item.name}</TableCell>
                                    <TableCell>
                                        <Chip label={item.status} size="small" color={item.status === 'active' ? 'success' : 'default'} />
                                    </TableCell>
                                    <TableCell sx={{ color: '#7F7F7F' }}>{dayjs(item.deleted_at).format('DD-MM-YYYY HH:mm')}</TableCell>
                                    <TableCell>
                                        <Button variant="outlined" color="primary" startIcon={<RestoreFromTrash />} onClick={() => handleRestore(item.id)} disabled={processingId === item.id}>
                                            {processingId === item.id ? 'Restoring...' : 'Restore'}
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            color="error"
                                            startIcon={<DeleteForever />}
                                            onClick={() => {
                                                if (confirm('Are you sure you want to permanently delete this room type? This action cannot be undone.')) {
                                                    router.delete(route('room-types.force-delete', item.id), {
                                                        onSuccess: () => enqueueSnackbar('Room Type deleted permanently', { variant: 'success' }),
                                                        onError: () => enqueueSnackbar('Failed to delete room type', { variant: 'error' }),
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
                                <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                                    No deleted room types found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
            <Pagination className="mt-6" links={roomTypes.links} />
        </Box>
    );
};

export default Trashed;
