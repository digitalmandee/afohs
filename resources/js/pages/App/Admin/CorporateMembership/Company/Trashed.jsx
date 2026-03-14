import React, { useState } from 'react';
import { Box, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, IconButton, TextField, InputAdornment, Pagination } from '@mui/material';
import { ArrowBack, RestoreFromTrash, Search } from '@mui/icons-material';
import { router } from '@inertiajs/react';
import axios from 'axios';
import { enqueueSnackbar } from 'notistack';

const TrashedCorporateCompanies = ({ companies, filters }) => {
    const [search, setSearch] = useState(filters.search || '');

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('corporate-companies.trashed'), { search }, { preserveState: true });
    };

    const handleRestore = async (id) => {
        if (!confirm('Are you sure you want to restore this company?')) return;
        try {
            await axios.post(route('corporate-companies.restore', id));
            enqueueSnackbar('Company restored successfully.', { variant: 'success' });
            router.reload();
        } catch (error) {
            enqueueSnackbar('Failed to restore company.', { variant: 'error' });
        }
    };

    return (
        <Box sx={{ bgcolor: '#f5f5f5', minHeight: '100vh', p: 2 }}>
            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <IconButton onClick={() => window.history.back()} sx={{ mr: 1 }}>
                        <ArrowBack sx={{ color: '#063455' }} />
                    </IconButton>
                    <Typography sx={{ color: '#063455', fontWeight: '700', fontSize: '30px' }}>
                        Deleted Corporate Companies
                    </Typography>
                </Box>

                <Box sx={{ p: 2, mb: 3, display: 'flex', alignItems: 'center' }}>
                    <form onSubmit={handleSearch} style={{ width: '100%' }}>
                        <TextField
                            fullWidth
                            placeholder="Search deleted companies..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
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
                            size="small"
                        />
                    </form>
                </Box>
            </Box>

            <TableContainer sx={{borderRadius:'12px'}}>
                <Table>
                    <TableHead sx={{ bgcolor: '#063455' }}>
                        <TableRow>
                            <TableCell sx={{color:'#fff', fontWeight:600}}>
                                Name
                            </TableCell>
                            <TableCell sx={{color:'#fff', fontWeight:600}}>
                                Deleted At
                            </TableCell>
                            <TableCell sx={{color:'#fff', fontWeight:600}}>
                                Actions
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {companies.data.map((company) => (
                            <TableRow key={company.id}>
                                <TableCell>{company.name}</TableCell>
                                <TableCell>{new Date(company.deleted_at).toLocaleDateString()}</TableCell>
                                <TableCell align="right">
                                    <Button variant="outlined" startIcon={<RestoreFromTrash />} 
                                    onClick={() => handleRestore(company.id)}
                                    size='small' 
                                    sx={{
                                        border:'1px solid #063455',
                                        color:'#063455',
                                        textTransform:'none'
                                    }}>
                                        Restore
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {companies.data.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={3} align="center" sx={{ py: 3 }}>
                                    No deleted companies found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {companies.links && (
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                    {/* Simplified Pagination for now, ideally use a specific Pagination component */}
                    <Pagination count={companies.last_page} page={companies.current_page} onChange={(e, p) => router.get(companies.path + '?page=' + p)} />
                </Box>
            )}
        </Box>
    );
};

export default TrashedCorporateCompanies;
