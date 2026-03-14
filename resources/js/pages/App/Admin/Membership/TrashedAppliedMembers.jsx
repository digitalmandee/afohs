import React, { useState } from 'react';
import { Typography, Button, TextField, Table, TableContainer, TableHead, TableRow, TableCell, TableBody, Paper, IconButton, Box, InputAdornment } from '@mui/material';
import { Search, RestoreFromTrash, ArrowBack } from '@mui/icons-material';
import { router } from '@inertiajs/react';
import { useSnackbar } from 'notistack';
import dayjs from 'dayjs';

const TrashedAppliedMembers = ({ members, filters: initialFilters }) => {
    const { enqueueSnackbar } = useSnackbar();
    const [search, setSearch] = useState(initialFilters?.search || '');
    const [processingId, setProcessingId] = useState(null);

    const handleSearch = () => {
        router.get(
            route('applied-member.trashed'),
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
            route('applied-member.restore', id),
            {},
            {
                onSuccess: () => {
                    enqueueSnackbar('Applied member restored successfully', { variant: 'success' });
                    setProcessingId(null);
                },
                onError: () => {
                    enqueueSnackbar('Failed to restore applied member', { variant: 'error' });
                    setProcessingId(null);
                },
            },
        );
    };

    return (
        <div className="container-fluid px-4 pt-4" style={{ backgroundColor: '#f5f5f5', minHeight: '100vh', overflowX: 'hidden' }}>
            <div className="mx-3">
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <IconButton onClick={() => router.get(route('applied-member.index'))}>
                            <ArrowBack sx={{ color: '#063455' }} />
                        </IconButton>
                        <Typography sx={{ fontWeight: 700, fontSize: '30px', color: '#063455' }}>Deleted Applied Members</Typography>
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
                            <TableRow style={{ backgroundColor: '#063455', height: '60px' }}>
                                <TableCell sx={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>Name</TableCell>
                                <TableCell sx={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>Email</TableCell>
                                <TableCell sx={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>Phone</TableCell>
                                <TableCell sx={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>CNIC</TableCell>
                                <TableCell sx={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>Deleted At</TableCell>
                                <TableCell sx={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {members.data.length > 0 ? (
                                members.data.map((member) => (
                                    <TableRow key={member.id} style={{ borderBottom: '1px solid #eee' }}>
                                        <TableCell sx={{ color: '#7F7F7F' }}>{member.name}</TableCell>
                                        <TableCell sx={{ color: '#7F7F7F' }}>{member.email}</TableCell>
                                        <TableCell sx={{ color: '#7F7F7F' }}>{member.phone_number}</TableCell>
                                        <TableCell sx={{ color: '#7F7F7F' }}>{member.cnic}</TableCell>
                                        <TableCell sx={{ color: '#7F7F7F' }}>{dayjs(member.deleted_at).format('DD-MM-YYYY HH:mm')}</TableCell>
                                        <TableCell>
                                            <Button variant="outlined" color="primary" startIcon={<RestoreFromTrash />} onClick={() => handleRestore(member.id)} disabled={processingId === member.id}>
                                                {processingId === member.id ? 'Restoring...' : 'Restore'}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                                        No deleted applied members found.
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

export default TrashedAppliedMembers;
