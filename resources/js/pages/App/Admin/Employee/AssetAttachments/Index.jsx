import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Box, Button, Chip, IconButton, InputAdornment, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TextField, Tooltip, Typography, Pagination, CircularProgress, Snackbar, Alert } from '@mui/material';
import { Add, Delete, Edit, Search, Visibility, DeleteSweep } from '@mui/icons-material';
import axios from 'axios';
import Create from './Create';
import EditAttachment from './Edit';
import { FaEdit, FaTrash } from 'react-icons/fa';

const Index = () => {
    const [open, setOpen] = useState(true);
    const [attachments, setAttachments] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [limit, setLimit] = useState(10);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Modal states
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [selectedAttachment, setSelectedAttachment] = useState(null);

    const getAttachments = async () => {
        setIsLoading(true);
        try {
            const res = await axios.get(route('employees.asset-attachments.list'), {
                params: {
                    limit,
                    page,
                    search: searchTerm,
                },
            });
            if (res.data.success) {
                setAttachments(res.data.attachments.data);
                setTotalPages(res.data.attachments.last_page);
            }
        } catch (error) {
            console.error('Error fetching attachments:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            getAttachments();
        }, 300);
        return () => clearTimeout(timer);
    }, [page, searchTerm, limit]);

    // Snackbar state
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success',
    });

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    const showSnackbar = (message, severity = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this assignment?')) return;
        try {
            const res = await axios.delete(route('employees.asset-attachments.destroy', id));
            if (res.data.success) {
                getAttachments();
                showSnackbar('Assignment deleted successfully');
            }
        } catch (error) {
            console.error('Error deleting assignment:', error);
            showSnackbar('Error deleting assignment', 'error');
        }
    };

    return (
        <>
            {/* <Head title="Asset Assignments" /> */}
            <div style={{ height: '100vh', backgroundColor: '#f5f5f5' }}>
                <Box sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography sx={{ color: '#063455', fontWeight: 700, fontSize: '30px' }}>
                            Asset Assignments
                        </Typography>
                        <Box>
                            <Button
                                variant="contained"
                                startIcon={<Add />}
                                onClick={() => setCreateModalOpen(true)}
                                sx={{
                                    backgroundColor: '#063455',
                                    textTransform: 'none',
                                    borderRadius: '16px',
                                }}
                            >
                                Assign Asset
                            </Button>
                            <Button
                                onClick={() => router.visit(route('employees.asset-attachments.trashed'))}
                                style={{
                                    // color: '#063455',
                                    // backgroundColor: 'white',
                                    borderRadius: '16px',
                                    height: 35,
                                    marginLeft: '10px',
                                    textTransform: 'none',
                                    // border: '1px solid #063455',
                                }}
                                variant="outlined"
                                color='error'
                                startIcon={<FaTrash size={14} />}
                            >
                                Trashed
                            </Button>
                        </Box>
                    </Box>

                    <Box sx={{ mb: 3, display:'flex', justifyContent:'flex-end' }}>
                        <TextField
                            variant="outlined"
                            placeholder="Search employee or asset..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setPage(1);
                            }}
                            size="small"
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Search color="action" />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{
                                width: '260px',
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '16px',

                                    '& fieldset': {
                                        borderRadius: '16px',
                                    },
                                },
                            }}
                        />
                    </Box>

                    {/* <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                        <Tooltip title="View Trashed Assignments">
                            <Link href={route('employees.asset-attachments.trashed')}>
                                <IconButton component="span" sx={{ mr: 1, color: 'error.main', bgcolor: 'rgba(211, 47, 47, 0.1)', '&:hover': { bgcolor: 'rgba(211, 47, 47, 0.2)' } }}>
                                    <DeleteSweep />
                                </IconButton>
                            </Link>
                        </Tooltip>
                    </Box> */}

                    <TableContainer component={Paper} sx={{ borderRadius: '12px', boxShadow: 2 }}>
                        <Table>
                            <TableHead sx={{ backgroundColor: '#063455' }}>
                                <TableRow>
                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Employee</TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Assets</TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Assignments Date</TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Comments</TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Status</TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                                            <CircularProgress size={30} />
                                        </TableCell>
                                    </TableRow>
                                ) : attachments.length > 0 ? (
                                    attachments.map((att) => (
                                        <TableRow key={att.id} hover>
                                            <TableCell>
                                                <div style={{ fontWeight: 600 }}>{att.employee?.name}</div>
                                                <div style={{ fontSize: '0.8rem', color: '#666' }}>ID: {att.employee?.employee_id}</div>
                                            </TableCell>
                                            <TableCell>
                                                <div style={{ fontWeight: 600, marginBottom: '4px' }}>{att.asset?.name}</div>
                                                <Chip label={att.asset?.type} size="small" variant="outlined" color="primary" sx={{ height: 20, fontSize: '0.7rem' }} />
                                            </TableCell>
                                            <TableCell>{att.attachment_date}</TableCell>
                                            <TableCell>{att.comments || '-'}</TableCell>
                                            <TableCell>
                                                <Chip label={att.status} size="small" color={att.status === 'assigned' ? 'success' : 'default'} sx={{ textTransform: 'capitalize' }} />
                                            </TableCell>
                                            <TableCell align="center">
                                                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                                                    <Button
                                                        size="small"
                                                        sx={{ minWidth: 0, p: 1 }}
                                                        onClick={() => {
                                                            setSelectedAttachment(att);
                                                            setEditModalOpen(true);
                                                        }}
                                                    >
                                                        <Edit fontSize="small" color="primary" />
                                                    </Button>
                                                    <Button size="small" sx={{ minWidth: 0, p: 1 }} color="error" onClick={() => handleDelete(att.id)}>
                                                        <Delete fontSize="small" />
                                                    </Button>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                                            No assignments found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                        <Pagination count={totalPages} page={page} onChange={(e, v) => setPage(v)} color="primary" />
                    </Box>
                </Box>

                <Create
                    open={createModalOpen}
                    onClose={() => setCreateModalOpen(false)}
                    onSuccess={() => {
                        getAttachments();
                        showSnackbar('Asset assigned successfully');
                    }}
                />
                {selectedAttachment && (
                    <EditAttachment
                        open={editModalOpen}
                        onClose={() => {
                            setEditModalOpen(false);
                            setSelectedAttachment(null);
                        }}
                        attachment={selectedAttachment}
                        onSuccess={() => {
                            getAttachments();
                            showSnackbar('Assignment updated successfully');
                        }}
                    />
                )}
                <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                    <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                        {snackbar.message}
                    </Alert>
                </Snackbar>
            </div>
        </>
    );
};

export default Index;
