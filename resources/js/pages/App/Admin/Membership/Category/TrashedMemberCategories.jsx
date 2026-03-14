import React, { useState } from 'react';
import { Typography, Button, TextField, Table, TableContainer, TableHead, TableRow, TableCell, TableBody, Paper, IconButton, Box, InputAdornment } from '@mui/material';
import { Search, RestoreFromTrash, ArrowBack } from '@mui/icons-material';
import { router } from '@inertiajs/react';
import { useSnackbar } from 'notistack';
import dayjs from 'dayjs';

const TrashedMemberCategories = ({ categories, filters: initialFilters }) => {
    const { enqueueSnackbar } = useSnackbar();
    const [search, setSearch] = useState(initialFilters?.search || '');
    const [processingId, setProcessingId] = useState(null);

    const handleSearch = () => {
        router.get(
            route('member-categories.trashed'),
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
            route('member-categories.restore', id),
            {},
            {
                onSuccess: () => {
                    enqueueSnackbar('Category restored successfully', { variant: 'success' });
                    setProcessingId(null);
                },
                onError: () => {
                    enqueueSnackbar('Failed to restore category', { variant: 'error' });
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
                        <IconButton onClick={() => router.get(route('member-categories.index'))}>
                            <ArrowBack sx={{ color: '#063455' }} />
                        </IconButton>
                        <Typography sx={{ fontWeight: 700, fontSize: '30px', color: '#063455' }}>Deleted Categories</Typography>
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
                        <Button variant="contained" 
                        startIcon={<Search/>}
                        onClick={handleSearch} sx={{ backgroundColor: '#063455', borderRadius:'16px' }}>
                            Search
                        </Button>
                    </Box>
                </Box>

                <TableContainer component={Paper} style={{ boxShadow: 'none', overflowX: 'auto', borderRadius:'16px' }}>
                    <Table>
                        <TableHead>
                            <TableRow style={{ backgroundColor: '#063455' }}>
                                <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Name</TableCell>
                                <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Description</TableCell>
                                <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Deleted At</TableCell>
                                <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {categories.data.length > 0 ? (
                                categories.data.map((category) => (
                                    <TableRow key={category.id} style={{ borderBottom: '1px solid #eee' }}>
                                        <TableCell sx={{ color: '#7F7F7F' }}>{category.name}</TableCell>
                                        <TableCell sx={{ color: '#7F7F7F' }}>{category.description}</TableCell>
                                        <TableCell sx={{ color: '#7F7F7F' }}>{dayjs(category.deleted_at).format('DD-MM-YYYY HH:mm')}</TableCell>
                                        <TableCell>
                                            <Button 
                                            variant="outlined" 
                                            color="primary" 
                                            startIcon={<RestoreFromTrash />} 
                                            onClick={() => handleRestore(category.id)} 
                                            disabled={processingId === category.id}
                                            sx={{textTransform:'none'}}>
                                                {processingId === category.id ? 'Restoring...' : 'Restore'}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                                        No deleted categories found.
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

export default TrashedMemberCategories;
