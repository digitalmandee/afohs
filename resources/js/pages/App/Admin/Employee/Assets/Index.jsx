import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Box, Button, Chip, IconButton, InputAdornment, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TextField, Tooltip, Typography, Pagination, CircularProgress, Snackbar, Alert } from '@mui/material';
import { Add, Delete, Edit, Search, Visibility, DeleteSweep } from '@mui/icons-material';
import axios from 'axios';
import Create from './Create';
import EditAsset from './Edit';
import { FaEdit, FaTrash } from 'react-icons/fa';

const Index = () => {
    const [open, setOpen] = useState(true); // Helper state for sidebar if needed
    const [assets, setAssets] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [limit, setLimit] = useState(10);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Modal states
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [selectedAsset, setSelectedAsset] = useState(null);

    const getAssets = async () => {
        setIsLoading(true);
        try {
            const res = await axios.get(route('employees.assets.list'), {
                params: {
                    limit,
                    page,
                    search: searchTerm,
                },
            });
            if (res.data.success) {
                setAssets(res.data.assets.data);
                setTotalPages(res.data.assets.last_page);
            }
        } catch (error) {
            console.error('Error fetching assets:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            getAssets();
        }, 300);
        return () => clearTimeout(timer);
    }, [page, searchTerm, limit]);

    // Handle Delete
    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this asset?')) return;
        try {
            const res = await axios.delete(route('employees.assets.destroy', id));
            if (res.data.success) {
                getAssets();
                showSnackbar('Asset deleted successfully');
            }
        } catch (error) {
            console.error('Error deleting asset:', error);
            showSnackbar('Error deleting asset', 'error');
        }
    };

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

    return (
        <>
            <div style={{
                height: '100vh',
                backgroundColor: '#f5f5f5'
            }}>
                {/* <Head title="Asset Inventory" /> */}
                <Box sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography sx={{ color: '#063455', fontWeight: 700, fontSize: '30px' }}>
                            Asset Inventory
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
                                    height: 35
                                }}
                            >
                                Add New Asset
                            </Button>
                            <Button
                                onClick={() => router.visit(route('employees.assets.trashed'))}
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
                            placeholder="Search assets..."
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
                                width: '270px',

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
                        <Tooltip title="View Trashed Assets">
                            <Link href={route('employees.assets.trashed')}>
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
                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Name</TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Classification</TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Type</TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Location</TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Qty</TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Status</TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                                            <CircularProgress size={30} />
                                        </TableCell>
                                    </TableRow>
                                ) : assets.length > 0 ? (
                                    assets.map((asset) => (
                                        <TableRow key={asset.id} hover>
                                            <TableCell>{asset.name}</TableCell>
                                            <TableCell>
                                                {asset.classification.split(',').map((item, index) => (
                                                    <Chip key={index} label={item.trim()} size="small" variant="outlined" color="primary" sx={{ mr: 0.5, mb: 0.5 }} />
                                                ))}
                                            </TableCell>
                                            <TableCell>
                                                {asset.type.split(',').map((item, index) => (
                                                    <Chip key={index} label={item.trim()} size="small" variant="outlined" color="secondary" sx={{ mr: 0.5, mb: 0.5 }} />
                                                ))}
                                            </TableCell>
                                            <TableCell>{asset.location || '-'}</TableCell>
                                            <TableCell>{asset.quantity}</TableCell>
                                            <TableCell>
                                                <Chip label={asset.status} size="small" color={asset.status === 'active' ? 'success' : 'default'} sx={{ textTransform: 'capitalize' }} />
                                            </TableCell>
                                            <TableCell align="center">
                                                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                                                    <Button
                                                        size="small"
                                                        sx={{ minWidth: 0, p: 1 }}
                                                        onClick={() => {
                                                            setSelectedAsset(asset);
                                                            setEditModalOpen(true);
                                                        }}
                                                    >
                                                        <Edit fontSize="small" color="primary" />
                                                    </Button>
                                                    <Button size="small" sx={{ minWidth: 0, p: 1 }} color="error" onClick={() => handleDelete(asset.id)}>
                                                        <Delete fontSize="small" />
                                                    </Button>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                                            No assets found.
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
                        getAssets();
                        showSnackbar('Asset created successfully');
                    }}
                />
                {selectedAsset && (
                    <EditAsset
                        open={editModalOpen}
                        onClose={() => {
                            setEditModalOpen(false);
                            setSelectedAsset(null);
                        }}
                        asset={selectedAsset}
                        onSuccess={() => {
                            getAssets();
                            showSnackbar('Asset updated successfully');
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
