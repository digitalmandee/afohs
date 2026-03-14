import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Box, IconButton, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Tooltip } from '@mui/material';
import { RestoreFromTrash, DeleteForever, ArrowBack, Inventory } from '@mui/icons-material';
import AdminLayout from '@/layouts/AdminLayout';

export default function Trashed({ designations }) {
    const handleRestore = (id) => {
        if (confirm('Are you sure you want to restore this designation?')) {
            router.post(route('designations.restore', id));
        }
    };

    const handleForceDelete = (id) => {
        if (confirm('This action cannot be undone. Are you sure you want to permanently delete this designation?')) {
            router.delete(route('designations.force-delete', id));
        }
    };

    return (
        <AdminLayout>
            <Head title="Trashed Designations" />
            <Box sx={{ display: 'flex', alignItems: 'flex-start', pt: 2.5, pl: 2 }}>
                <Link href={route('designations.index')}>
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
                    <Typography sx={{ fontWeight: '700', fontSize: '30px', color: '#063455' }}>Trashed Designations</Typography>
                    <Typography sx={{ fontWeight: '600', fontSize: '15px', color: '#063455' }}>Restore or permanently delete removed designations.</Typography>
                </Box>
            </Box>
            <Box sx={{ p: 3 }}>
                <Box>
                    <TableContainer sx={{ borderRadius: '12px', overflowX: 'auto', bgcolor: 'white' }}>
                        <Table>
                            <TableHead sx={{ bgcolor: '#063455' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 600, color: '#fff' }}>Name</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#fff' }}>Description</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#fff' }}>Status</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#ffff', textAlign: 'right' }}>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {designations.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} align="center" sx={{ py: 8 }}>
                                            <Box sx={{ color: 'text.secondary' }}>
                                                <Inventory sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
                                                <Typography>No trashed designations found.</Typography>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    designations.data.map((designation) => (
                                        <TableRow key={designation.id} hover>
                                            <TableCell sx={{ fontWeight: 400, color: '#7f7f7f' }}>
                                                <Typography variant="subtitle2">{designation.name}</Typography>
                                            </TableCell>
                                            <TableCell>{designation.description || 'N/A'}</TableCell>
                                            <TableCell>
                                                <Chip label="Deleted" size="small" color="error" sx={{ textTransform: 'capitalize', height: 24 }} />
                                            </TableCell>
                                            <TableCell align="right">
                                                <Box display="flex" justifyContent="flex-end" gap={1}>
                                                    <Tooltip title="Restore">
                                                        <IconButton size="small" color="success" onClick={() => handleRestore(designation.id)}>
                                                            <RestoreFromTrash fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Delete Permanently">
                                                        <IconButton size="small" color="error" onClick={() => handleForceDelete(designation.id)}>
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
