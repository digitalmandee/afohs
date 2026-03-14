import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react'; // Correct imports for V2
import { Box, Button, Card, CardContent, Chip, IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Tooltip, Pagination } from '@mui/material'; // MUI components
import { Add, Edit, Delete, Restaurant, CheckCircle, Warning, Lock, LockOpen } from '@mui/icons-material'; // Icons
import AdminLayout from '@/layouts/AdminLayout'; // Layout

export default function Index({ types }) {
    const handleDelete = (id) => {
        if (confirm('Are you sure you want to delete this charge type?')) {
            router.delete(route('finance.charge-types.destroy', id));
        }
    };

    const handlePageChange = (event, value) => {
        router.get(
            route('finance.charge-types.index'),
            { page: value },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    return (
        <AdminLayout>
            <Head title="Charge Types" />
            <Box sx={{ p: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Box>
                        <Typography sx={{ fontWeight: '700', fontSize: '30px', color: '#063455' }}>Charge Types</Typography>
                        <Typography sx={{ fontWeight: '600', fontSize: '15px', color: '#063455' }}>Manage transaction fee types, default amounts, and fixed pricing rules.</Typography>
                    </Box>
                    <Box>
                        <Link href={route('finance.charge-types.trashed')}>
                            <Button
                                variant="outlined"
                                color="error"
                                startIcon={<Delete />}
                                sx={{
                                    mr: 2,
                                    textTransform: 'none',
                                    borderRadius: 16,
                                }}
                            >
                                Deleted Items
                            </Button>
                        </Link>
                        <Link href={route('finance.charge-types.create')}>
                            <Button
                                variant="contained"
                                startIcon={<Add />}
                                sx={{
                                    bgcolor: '#063455',
                                    '&:hover': { bgcolor: '#063455' },
                                    textTransform: 'none',
                                    borderRadius: 16,
                                }}
                            >
                                Add Charge Type
                            </Button>
                        </Link>
                    </Box>
                </Box>

                <Paper>
                    <TableContainer sx={{ borderRadius: '12px', overflowX: 'auto' }}>
                        <Table>
                            <TableHead sx={{ bgcolor: '#063455' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 600, color: '#fff' }}>Name</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#fff', whiteSpace: 'nowrap' }}>Default Amount</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#fff', whiteSpace: 'nowrap' }}>Pricing Mode</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#fff' }}>Status</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#fff' }}>System</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 600, color: '#fff' }}>
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
                                                <Typography>No charge types found.</Typography>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    types.data.map((type) => (
                                        <TableRow key={type.id} hover>
                                            <TableCell>
                                                <Typography variant="subtitle2" fontWeight={600} color="#1e293b">
                                                    {type.name}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {type.type || 'Generic'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                {type.default_amount > 0 ? (
                                                    <Typography variant="body2" fontWeight={600} color="primary.main">
                                                        Rs {parseFloat(type.default_amount).toLocaleString()}
                                                    </Typography>
                                                ) : (
                                                    <Typography variant="caption" color="text.secondary">
                                                        -
                                                    </Typography>
                                                )}
                                            </TableCell>
                                            <TableCell>{type.is_fixed ? <Chip icon={<Lock sx={{ fontSize: '14px !important' }} />} label="Fixed Price" size="small" color="warning" variant="outlined" sx={{ borderRadius: 1, height: 24 }} /> : <Chip icon={<LockOpen sx={{ fontSize: '14px !important' }} />} label="Dynamic / Editable" size="small" color="success" variant="outlined" sx={{ borderRadius: 1, height: 24 }} />}</TableCell>
                                            <TableCell>
                                                <Chip label={type.status} size="small" color={type.status === 'active' ? 'success' : 'default'} sx={{ textTransform: 'capitalize', height: 24 }} />
                                            </TableCell>
                                            <TableCell>{type.is_system ? <Chip label="System" size="small" color="info" sx={{ height: 24 }} /> : <Chip label="Custom" size="small" variant="outlined" sx={{ height: 24 }} />}</TableCell>
                                            <TableCell align="right">
                                                <Box display="flex" justifyContent="flex-end" gap={1}>
                                                    <Link href={route('finance.charge-types.edit', type.id)}>
                                                        <IconButton size="small" color="primary">
                                                            <Edit fontSize="small" />
                                                        </IconButton>
                                                    </Link>
                                                    {!type.is_system && (
                                                        <IconButton size="small" color="error" onClick={() => handleDelete(type.id)}>
                                                            <Delete fontSize="small" />
                                                        </IconButton>
                                                    )}
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, mb: 3 }}>
                    <Pagination count={types.last_page} page={types.current_page} onChange={handlePageChange} color="primary" />
                </Box>
            </Box>
        </AdminLayout>
    );
}
