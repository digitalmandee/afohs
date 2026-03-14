import React, { useState } from 'react';
import { Typography, Button, TextField, Table, TableContainer, TableHead, TableRow, TableCell, TableBody, Paper, IconButton, Avatar, Box, InputAdornment } from '@mui/material';
import { Search, RestoreFromTrash, ArrowBack } from '@mui/icons-material';
import { router, usePage } from '@inertiajs/react';
import { useSnackbar } from 'notistack';
import dayjs from 'dayjs';

const TrashedMembers = ({ members, filters: initialFilters }) => {
    const { enqueueSnackbar } = useSnackbar();
    const [search, setSearch] = useState(initialFilters?.search || '');
    const [processingId, setProcessingId] = useState(null);

    const handleSearch = () => {
        router.get(
            route('membership.trashed'),
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
            route('membership.restore', id),
            {},
            {
                onSuccess: () => {
                    enqueueSnackbar('Member restored successfully', { variant: 'success' });
                    setProcessingId(null);
                },
                onError: () => {
                    enqueueSnackbar('Failed to restore member', { variant: 'error' });
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
                        <IconButton onClick={() => router.get(route('membership.members'))}>
                            <ArrowBack sx={{ color: '#063455' }} />
                        </IconButton>
                        <Typography sx={{ fontWeight: 700, fontSize: '30px', color: '#063455' }}>Deleted Members</Typography>
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
                                <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Membership No</TableCell>
                                <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Member</TableCell>
                                <TableCell sx={{ color: '#fff', fontWeight: 600 }}>CNIC</TableCell>
                                <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Email</TableCell>
                                <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Deleted At</TableCell>
                                <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {members.data.length > 0 ? (
                                members.data.map((member) => (
                                    <TableRow key={member.id} style={{ borderBottom: '1px solid #eee' }}>
                                        <TableCell sx={{ color: '#7F7F7F' }}>{member.membership_no || 'N/A'}</TableCell>
                                        <TableCell>
                                            <div className="d-flex align-items-center">
                                                <Avatar src={member.profile_photo?.file_path || '/placeholder.svg'} style={{ marginRight: '10px' }} />
                                                <Typography sx={{ color: '#7F7F7F' }}>{member.full_name}</Typography>
                                            </div>
                                        </TableCell>
                                        <TableCell sx={{ color: '#7F7F7F' }}>{member.cnic_no || 'N/A'}</TableCell>
                                        <TableCell sx={{ color: '#7F7F7F' }}>{member.personal_email || 'N/A'}</TableCell>
                                        <TableCell sx={{ color: '#7F7F7F' }}>{dayjs(member.deleted_at).format('DD-MM-YYYY HH:mm')}</TableCell>
                                        <TableCell>
                                            <Button 
                                            variant="outlined" 
                                            color="primary" 
                                            startIcon={<RestoreFromTrash />} 
                                            onClick={() => 
                                            handleRestore(member.id)} 
                                            disabled={processingId === member.id}
                                            sx={{textTransform:'none'}}>
                                                {processingId === member.id ? 'Restoring...' : 'Restore'}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                                        No deleted members found.
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

export default TrashedMembers;
