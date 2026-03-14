import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Box, IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Tooltip, Chip } from '@mui/material';
import { ArrowBack, DeleteForever, RestoreFromTrash, Restaurant } from '@mui/icons-material';
import AdminLayout from '@/layouts/AdminLayout';

export default function Trashed({ accounts }) {
    const handleRestore = (id) => {
        if (confirm('Are you sure you want to restore this payment account?')) {
            router.post(route('finance.payment-accounts.restore', id));
        }
    };

    const handleForceDelete = (id) => {
        if (confirm('This action cannot be undone. Are you sure you want to permanently delete this payment account?')) {
            router.delete(route('finance.payment-accounts.force-delete', id));
        }
    };

    return (
        <AdminLayout>
            <Head title="Trashed Payment Accounts" />

            <Box sx={{ display: 'flex', alignItems: 'flex-start', pt: 2.5, pl: 2 }}>
                <IconButton
                    href={route('finance.payment-accounts.index')}
                    sx={{
                        mt: 0.5,
                        color: '#063455',
                        '&:hover': { bgcolor: 'rgba(6, 52, 85, 0.1)' },
                    }}
                >
                    <ArrowBack />
                </IconButton>
                <Box>
                    <Typography sx={{ fontWeight: '700', fontSize: '30px', color: '#063455' }}>Trashed Payment Accounts</Typography>
                    <Typography sx={{ fontWeight: '600', fontSize: '15px', color: '#063455' }}>Restore or permanently delete removed payment accounts.</Typography>
                </Box>
            </Box>

            <Box sx={{ p: 3 }}>
                <Paper>
                    <TableContainer sx={{ borderRadius: '12px', overflowX: 'auto' }}>
                        <Table>
                            <TableHead sx={{ bgcolor: '#063455' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 600, color: '#fff' }}>Name</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#fff' }}>Payment Method</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#fff' }}>Status</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 600, color: '#fff' }}>
                                        Actions
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {accounts.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} align="center" sx={{ py: 8 }}>
                                            <Box sx={{ color: 'text.secondary' }}>
                                                <Restaurant sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
                                                <Typography>No trashed items found.</Typography>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    accounts.data.map((account) => (
                                        <TableRow key={account.id} hover>
                                            <TableCell sx={{ fontWeight: 400, color: '#7f7f7f' }}>
                                                <Typography>{account.name}</Typography>
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 400, color: '#7f7f7f' }}>{account.payment_method || '-'}</TableCell>
                                            <TableCell>
                                                <Chip label="Deleted" size="small" color="error" sx={{ textTransform: 'capitalize', height: 24 }} />
                                            </TableCell>
                                            <TableCell align="right">
                                                <Box display="flex" justifyContent="flex-end" gap={1}>
                                                    <Tooltip title="Restore">
                                                        <IconButton size="small" color="success" onClick={() => handleRestore(account.id)}>
                                                            <RestoreFromTrash fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Delete Permanently">
                                                        <IconButton size="small" color="error" onClick={() => handleForceDelete(account.id)}>
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
                </Paper>
            </Box>
        </AdminLayout>
    );
}
