import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Box, Button, Chip, IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Tooltip } from '@mui/material';
import { RestoreFromTrash, DeleteForever, ArrowBack, Restaurant, Lock, LockOpen } from '@mui/icons-material';
import AdminLayout from '@/layouts/AdminLayout';

export default function Trashed({ types }) {
    const handleRestore = (id) => {
        if (confirm('Are you sure you want to restore this charge type?')) {
            router.post(route('finance.charge-types.restore', id));
        }
    };

    const handleForceDelete = (id) => {
        if (confirm('This action cannot be undone. Are you sure you want to permanently delete this charge type?')) {
            router.delete(route('finance.charge-types.force-delete', id));
        }
    };

    return (
        <AdminLayout>
            <Head title="Trashed Charge Types" />
            <Box sx={{ display: 'flex', alignItems: 'flex-start', pt:2.5, pl:2 }}>
            
                <IconButton
                    href={route('finance.charge-types.index')}
                    sx={{
                        mt: 0.5,
                        color: '#063455',
                        '&:hover': { bgcolor: 'rgba(6, 52, 85, 0.1)' }
                    }}
                >
                    <ArrowBack />
                </IconButton>
                <Box>
                    <Typography sx={{ fontWeight: '700', fontSize: '30px', color: '#063455' }}>
                        Trashed Charge Types
                    </Typography>
                    <Typography sx={{ fontWeight: '600', fontSize: '15px', color: '#063455' }}>
                        Restore or permanently delete removed charge types.
                    </Typography>
                </Box>
            </Box>
            <Box sx={{ p: 3 }}>
                <Box>
                    <TableContainer sx={{ borderRadius: '12px', overflowX: 'auto' }}>
                        <Table>
                            <TableHead sx={{ bgcolor: '#063455' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 600, color: '#fff' }}>Name</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#fff' }}>Default Amount</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#fff' }}>Pricing Mode</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#fff' }}>Status</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#ffff' }}>
                                        Actions
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {types.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                                            <Box sx={{ color: 'text.secondary' }}>
                                                <Restaurant sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
                                                <Typography>No trashed items found.</Typography>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    types.data.map((type) => (
                                        <TableRow key={type.id} hover>
                                            <TableCell sx={{ fontWeight: 400, color: '#7f7f7f' }}>
                                                <Typography>
                                                    {type.name}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {type.type || 'Generic'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 400, color: '#7f7f7f' }}>
                                                {type.default_amount > 0 ? (
                                                    <Typography>
                                                        Rs {parseFloat(type.default_amount).toLocaleString()}
                                                    </Typography>
                                                ) : (
                                                    <Typography variant="caption" color="text.secondary">
                                                        -
                                                    </Typography>
                                                )}
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 400, color: '#7f7f7f' }}>{type.is_fixed ? <Chip icon={<Lock sx={{ fontSize: '14px !important' }} />} label="Fixed Price" size="small" color="warning" variant="outlined" sx={{ borderRadius: 1, height: 24 }} /> : <Chip icon={<LockOpen sx={{ fontSize: '14px !important' }} />} label="Dynamic / Editable" size="small" color="success" variant="outlined" sx={{ borderRadius: 1, height: 24 }} />}</TableCell>
                                            <TableCell>
                                                <Chip label="Deleted" size="small" color="error" sx={{ textTransform: 'capitalize', height: 24 }} />
                                            </TableCell>
                                            <TableCell align="right">
                                                <Box display="flex" justifyContent="flex-end" gap={1}>
                                                    <Tooltip title="Restore">
                                                        <IconButton size="small" color="success" onClick={() => handleRestore(type.id)}>
                                                            <RestoreFromTrash fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Delete Permanently">
                                                        <IconButton size="small" color="error" onClick={() => handleForceDelete(type.id)}>
                                                            <DeleteForever fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            </Box>
        </AdminLayout>
    );
}
