import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Box, Button, Chip, IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Tooltip } from '@mui/material';
import { RestoreFromTrash, DeleteForever, ArrowBack, Restaurant, Inventory } from '@mui/icons-material';
import AdminLayout from '@/layouts/AdminLayout';

export default function Trashed({ assets }) {
    const handleRestore = (id) => {
        if (confirm('Are you sure you want to restore this asset?')) {
            router.post(route('employees.assets.restore', id));
        }
    };

    const handleForceDelete = (id) => {
        if (confirm('This action cannot be undone. Are you sure you want to permanently delete this asset and its files?')) {
            router.delete(route('employees.assets.force-delete', id));
        }
    };

    return (
        <AdminLayout>
            <Head title="Trashed Assets" />
            <Box sx={{ display: 'flex', alignItems: 'flex-start', pt: 2.5, pl: 2 }}>
                <Link href={route('employees.assets.index')}>
                    <IconButton
                        component="span"
                        sx={{
                            mt: 0.5,
                            color: '#063455',
                            '&:hover': { bgcolor: 'rgba(6, 52, 85, 0.1)' },
                        }}
                    >
                        <ArrowBack />
                    </IconButton>
                </Link>
                <Box>
                    <Typography sx={{ fontWeight: '700', fontSize: '30px', color: '#063455' }}>Trashed Assets</Typography>
                    <Typography sx={{ fontWeight: '600', fontSize: '15px', color: '#063455' }}>Restore or permanently delete removed assets.</Typography>
                </Box>
            </Box>
            <Box sx={{ p: 3 }}>
                <Box>
                    <TableContainer sx={{ borderRadius: '12px', overflowX: 'auto', bgcolor: 'white' }}>
                        <Table>
                            <TableHead sx={{ bgcolor: '#063455' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 600, color: '#fff' }}>Name</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#fff' }}>Classification</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#fff' }}>Type</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#fff' }}>Status</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#ffff', textAlign: 'right' }}>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {assets.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                                            <Box sx={{ color: 'text.secondary' }}>
                                                <Inventory sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
                                                <Typography>No trashed assets found.</Typography>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    assets.data.map((asset) => (
                                        <TableRow key={asset.id} hover>
                                            <TableCell sx={{ fontWeight: 400, color: '#7f7f7f' }}>
                                                <Typography variant="subtitle2">{asset.name}</Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip label={asset.classification} size="small" variant="outlined" color="primary" />
                                            </TableCell>
                                            <TableCell>
                                                <Chip label={asset.type} size="small" variant="outlined" color="secondary" />
                                            </TableCell>
                                            <TableCell>
                                                <Chip label="Deleted" size="small" color="error" sx={{ textTransform: 'capitalize', height: 24 }} />
                                            </TableCell>
                                            <TableCell align="right">
                                                <Box display="flex" justifyContent="flex-end" gap={1}>
                                                    <Tooltip title="Restore">
                                                        <IconButton size="small" color="success" onClick={() => handleRestore(asset.id)}>
                                                            <RestoreFromTrash fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Delete Permanently">
                                                        <IconButton size="small" color="error" onClick={() => handleForceDelete(asset.id)}>
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
