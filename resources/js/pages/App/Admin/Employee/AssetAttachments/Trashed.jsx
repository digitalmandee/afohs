import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Box, Button, Chip, IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Tooltip } from '@mui/material';
import { RestoreFromTrash, DeleteForever, ArrowBack, Assignment, Inventory } from '@mui/icons-material';
import AdminLayout from '@/layouts/AdminLayout';
import dayjs from 'dayjs';

export default function Trashed({ attachments }) {
    const handleRestore = (id) => {
        if (confirm('Are you sure you want to restore this assignment?')) {
            router.post(route('employees.asset-attachments.restore', id));
        }
    };

    const handleForceDelete = (id) => {
        if (confirm('This action cannot be undone. Are you sure you want to permanently delete this assignment?')) {
            router.delete(route('employees.asset-attachments.force-delete', id));
        }
    };

    return (
        <AdminLayout>
            <Head title="Trashed Assignments" />
            <Box sx={{ display: 'flex', alignItems: 'flex-start', pt: 2.5, pl: 2 }}>
                <Link href={route('employees.asset-attachments.index')}>
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
                    <Typography sx={{ fontWeight: '700', fontSize: '30px', color: '#063455' }}>Trashed Assignments</Typography>
                    <Typography sx={{ fontWeight: '600', fontSize: '15px', color: '#063455' }}>Restore or permanently delete removed asset assignments.</Typography>
                </Box>
            </Box>
            <Box sx={{ p: 3 }}>
                <Box>
                    <TableContainer sx={{ borderRadius: '12px', overflowX: 'auto', bgcolor: 'white' }}>
                        <Table>
                            <TableHead sx={{ bgcolor: '#063455' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 600, color: '#fff' }}>Employee</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#fff' }}>Asset</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#fff' }}>Date</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#fff' }}>Status</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#ffff', textAlign: 'right' }}>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {attachments.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                                            <Box sx={{ color: 'text.secondary' }}>
                                                <Assignment sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
                                                <Typography>No trashed assignments found.</Typography>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    attachments.data.map((item) => (
                                        <TableRow key={item.id} hover>
                                            <TableCell sx={{ fontWeight: 400, color: '#7f7f7f' }}>
                                                <Typography variant="subtitle2">{item.employee?.name || 'Unknown'}</Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {item.employee?.employee_id || '-'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 400, color: '#7f7f7f' }}>
                                                <div style={{ fontWeight: 600, marginBottom: '4px', fontSize: '0.875rem' }}>{item.asset?.name || 'Unknown'}</div>
                                                {item.asset?.type && <Chip label={item.asset?.type} size="small" variant="outlined" color="primary" sx={{ height: 20, fontSize: '0.7rem' }} />}
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 400, color: '#7f7f7f' }}>{dayjs(item.attachment_date).format('DD MMM YYYY')}</TableCell>
                                            <TableCell>
                                                <Chip label="Deleted" size="small" color="error" sx={{ textTransform: 'capitalize', height: 24 }} />
                                            </TableCell>
                                            <TableCell align="right">
                                                <Box display="flex" justifyContent="flex-end" gap={1}>
                                                    <Tooltip title="Restore">
                                                        <IconButton size="small" color="success" onClick={() => handleRestore(item.id)}>
                                                            <RestoreFromTrash fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Delete Permanently">
                                                        <IconButton size="small" color="error" onClick={() => handleForceDelete(item.id)}>
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
