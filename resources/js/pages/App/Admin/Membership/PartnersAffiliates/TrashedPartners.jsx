import React, { useState } from 'react';
import { Typography, Button, TextField, Table, TableContainer, TableHead, TableRow, TableCell, TableBody, Paper, IconButton, Box, InputAdornment, Chip } from '@mui/material';
import { Search, RestoreFromTrash, ArrowBack } from '@mui/icons-material';
import { router } from '@inertiajs/react';
import { useSnackbar } from 'notistack';
import dayjs from 'dayjs';

const TrashedPartners = ({ partners, filters: initialFilters }) => {
    const { enqueueSnackbar } = useSnackbar();
    const [search, setSearch] = useState(initialFilters?.search || '');
    const [processingId, setProcessingId] = useState(null);

    const handleSearch = () => {
        router.get(
            route('admin.membership.partners-affiliates.trashed'),
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
            route('admin.membership.partners-affiliates.restore', id),
            {},
            {
                onSuccess: () => {
                    enqueueSnackbar('Partner restored successfully', { variant: 'success' });
                    setProcessingId(null);
                },
                onError: () => {
                    enqueueSnackbar('Failed to restore partner', { variant: 'error' });
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
                        <IconButton onClick={() => router.get(route('admin.membership.partners-affiliates.index'))}>
                            <ArrowBack sx={{ color: '#063455' }} />
                        </IconButton>
                        <Typography sx={{ fontWeight: 700, fontSize: '30px', color: '#063455' }}>Deleted Partners & Affiliates</Typography>
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
                        onClick={handleSearch} sx={{ backgroundColor: '#063455', borderRadius: '16px' }}>
                            Search
                        </Button>
                    </Box>
                </Box>

                <TableContainer component={Paper} style={{ boxShadow: 'none', overflowX: 'auto', borderRadius: '16px' }}>
                    <Table>
                        <TableHead>
                            <TableRow style={{ backgroundColor: '#063455' }}>
                                <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Logo/Image</TableCell>
                                <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Organization Name</TableCell>
                                <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Focal Person</TableCell>
                                <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Type</TableCell>
                                <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Deleted At</TableCell>
                                <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {partners.data.length > 0 ? (
                                partners.data.map((partner) => (
                                    <TableRow key={partner.id} style={{ borderBottom: '1px solid #eee' }}>
                                        <TableCell>
                                            <div style={{ width: 25, height: 25, borderRadius: '50%', overflow: 'hidden', backgroundColor: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                {/* Placeholder since media isn't eagerly loaded in trashed method in controller yet, or standard image logic */}
                                                <Typography variant="caption">{partner.organization_name?.charAt(0)}</Typography>
                                            </div>
                                        </TableCell>
                                        <TableCell sx={{ color: '#7F7F7F' }}>{partner.organization_name}</TableCell>
                                        <TableCell sx={{ color: '#7F7F7F' }}>{partner.focal_person_name}</TableCell>
                                        <TableCell>
                                            <Chip label={partner.type} size="small" variant="outlined" />
                                        </TableCell>
                                        <TableCell sx={{ color: '#7F7F7F' }}>{dayjs(partner.deleted_at).format('DD-MM-YYYY HH:mm')}</TableCell>
                                        <TableCell>
                                            <Button 
                                            variant="outlined" 
                                            color="primary" 
                                            startIcon={<RestoreFromTrash />} 
                                            onClick={() => handleRestore(partner.id)} 
                                            disabled={processingId === partner.id}
                                            sx={{textTransform:'none'}}
                                            >
                                                {processingId === partner.id ? 'Restoring...' : 'Restore'}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                                        No deleted partners found.
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

export default TrashedPartners;
