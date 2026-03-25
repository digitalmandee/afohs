import React, { useEffect, useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import POSLayout from "@/components/POSLayout";
import { Box, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography, Chip, IconButton, Pagination, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem, Backdrop, CircularProgress, DialogContentText, Autocomplete } from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, DeleteSweep as DeleteSweepIcon } from '@mui/icons-material';
import { enqueueSnackbar } from 'notistack';
import dayjs from 'dayjs';
import { isPosPath, routeNameForContext } from '@/lib/utils';
import axios from 'axios';

// const drawerWidthOpen = 240;
// const drawerWidthClosed = 110;

const SubCategoriesIndex = ({ subCategories, categories, filters }) => {
    const { flash = {} } = usePage().props;
    // const [open, setOpen] = useState(true);
    const [search, setSearch] = useState(filters.search || '');
    const [processing, setProcessing] = useState(false);
    const [categoryOptions, setCategoryOptions] = useState(categories || []);

    // Create/Edit Modal State
    const [modalOpen, setModalOpen] = useState(false);
    const [editingSubCategory, setEditingSubCategory] = useState(null);
    const [formData, setFormData] = useState({
        category_id: '',
        name: '',
        status: 'active',
    });

    // Delete Modal State
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [subCategoryToDelete, setSubCategoryToDelete] = useState(null);

    useEffect(() => {
        setCategoryOptions(categories || []);
    }, [categories]);

    useEffect(() => {
        if (flash?.error) {
            enqueueSnackbar(flash.error, { variant: 'error' });
        }
    }, [flash]);

    useEffect(() => {
        if (!modalOpen || editingSubCategory) return;
        axios.get(route(routeNameForContext('inventory.categories'))).then((response) => {
            const nextCategories = response.data?.categories || [];
            setCategoryOptions(nextCategories);
            setFormData((prev) => {
                const exists = nextCategories.some((c) => c.id === prev.category_id);
                return exists ? prev : { ...prev, category_id: '' };
            });
        });
    }, [modalOpen, editingSubCategory]);

    const handleSearch = (e) => {
        setSearch(e.target.value);
        router.get(
            route(routeNameForContext('sub-categories.index')),
            { search: e.target.value },
            { preserveState: true, replace: true },
        );
    };

    // --- Create / Edit Handlers ---
    const handleOpenModal = (subCategory = null) => {
        if (subCategory) {
            setEditingSubCategory(subCategory);
            setFormData({
                category_id: subCategory.category_id,
                name: subCategory.name,
                status: subCategory.status,
            });
        } else {
            setEditingSubCategory(null);
            setFormData({ category_id: '', name: '', status: 'active' });
        }
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setEditingSubCategory(null);
    };

    const handleSubmit = () => {
        if (!formData.category_id) {
            enqueueSnackbar('Please select a main category.', { variant: 'error' });
            return;
        }
        if (!formData.name.trim()) {
            enqueueSnackbar('Please enter a sub category name.', { variant: 'error' });
            return;
        }

        setProcessing(true);
        if (editingSubCategory) {
            router.put(route(routeNameForContext('sub-categories.update'), { id: editingSubCategory.id }), formData, {
                onSuccess: () => {
                    enqueueSnackbar('Sub Category updated successfully!', { variant: 'success' });
                    handleCloseModal();
                },
                onError: (errors) => {
                    enqueueSnackbar(errors.name || errors.category_id || 'Failed to update sub category.', { variant: 'error' });
                },
                onFinish: () => setProcessing(false),
            });
        } else {
            router.post(route(routeNameForContext('sub-categories.store')), formData, {
                onSuccess: () => {
                    enqueueSnackbar('Sub Category created successfully!', { variant: 'success' });
                    handleCloseModal();
                },
                onError: (errors) => {
                    enqueueSnackbar(errors.name || errors.category_id || 'Failed to create sub category.', { variant: 'error' });
                },
                onFinish: () => setProcessing(false),
            });
        }
    };

    // --- Delete Handlers ---
    const handleOpenDeleteModal = (subCategory) => {
        setSubCategoryToDelete(subCategory);
        setDeleteModalOpen(true);
    };

    const handleCloseDeleteModal = () => {
        setDeleteModalOpen(false);
        setSubCategoryToDelete(null);
    };

    const handleDelete = () => {
        if (!subCategoryToDelete) return;
        setProcessing(true);
        router.delete(route(routeNameForContext('sub-categories.destroy'), { id: subCategoryToDelete.id }), {
            onSuccess: () => {
                enqueueSnackbar('Sub Category deleted successfully!', { variant: 'success' });
                handleCloseDeleteModal();
            },
            onError: () => enqueueSnackbar('Failed to delete sub category.', { variant: 'error' }),
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <>
            {/* <SideNav open={open} setOpen={setOpen} /> */}

            {/* Global Loader */}
            <Backdrop sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1000 }} open={processing}>
                <CircularProgress color="inherit" />
            </Backdrop>

            {/* <Box
                sx={{
                    marginLeft: open ? `${drawerWidthOpen}px` : `${drawerWidthClosed}px`,
                    transition: 'margin-left 0.3s ease-in-out',
                    // padding: '1rem',
                    marginTop: '5rem',
                }}
            > */}
                <Box sx={{
                    minHeight: '100vh',
                    bgcolor: '#f5f5f5',
                    p: 2
                }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                        <Typography sx={{ fontWeight: '600', fontSize: '30px', color: '#063455' }}>
                            Sub Categories
                        </Typography>
                        <Box display="flex" gap={2}>
                            <TextField
                                size="small"
                                placeholder="Search..."
                                value={search}
                                onChange={handleSearch}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: '16px',
                                    },
                                    '& .MuiOutlinedInput-notchedOutline': {
                                        borderRadius: '16px',
                                    },
                                }} />
                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={() => handleOpenModal()}
                                sx={{
                                    bgcolor: '#063455',
                                    textTransform: 'none',
                                    borderRadius: '16px',
                                    height: 35,
                                    '&:hover': { bgcolor: '#063455' }
                                }}>
                                Add Sub Category
                            </Button>
                            <Button
                                variant="outlined"
                                color="error"
                                startIcon={<DeleteIcon />}
                            onClick={() => router.visit(route(routeNameForContext('sub-categories.trashed')))}
                                sx={{
                                    bgcolor: 'transparent',
                                    textTransform: 'none',
                                    borderRadius: '16px',
                                    height: 35,
                                    '&:hover': { bgcolor: 'transparent' }
                                }}>
                                Deleted
                            </Button>

                        </Box>
                    </Box>

                    <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 3 }}>
                        <Table>
                            <TableHead sx={{ bgcolor: '#063455' }}>
                                <TableRow>
                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Main Category</TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Sub Category Name</TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Status</TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Updated At</TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">
                                        Actions
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {subCategories.data.length > 0 ? (
                                    subCategories.data.map((subCategory) => (
                                        <TableRow key={subCategory.id} hover>
                                            <TableCell>{subCategory.category?.name || 'N/A'}</TableCell>
                                            <TableCell>{subCategory.name}</TableCell>
                                            <TableCell>
                                                <Chip label={subCategory.status} size="small" color={subCategory.status === 'active' ? 'success' : 'default'} sx={{ textTransform: 'capitalize' }} />
                                            </TableCell>
                                            <TableCell>{dayjs(subCategory.updated_at).format('DD MMM YYYY, h:mm A')}</TableCell>
                                            <TableCell align="right">
                                                <IconButton onClick={() => handleOpenModal(subCategory)} color="primary">
                                                    <EditIcon />
                                                </IconButton>
                                                <IconButton onClick={() => handleOpenDeleteModal(subCategory)} color="error">
                                                    <DeleteIcon />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center">
                                            No sub categories found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    <Box mt={3} display="flex" justifyContent="center">
                    <Pagination
                        count={subCategories.last_page}
                        page={subCategories.current_page}
                        onChange={(e, p) =>
                            router.get(
                                route(routeNameForContext('sub-categories.index')),
                                { page: p, search },
                                { preserveState: true },
                            )
                        }
                        color="primary"
                    />
                    </Box>
                </Box>
            {/* </Box> */}

            {/* Create/Edit Modal */}
            <Dialog open={modalOpen} onClose={handleCloseModal} maxWidth="sm" fullWidth>
                <DialogTitle>{editingSubCategory ? 'Edit Sub Category' : 'Add New Sub Category'}</DialogTitle>
                <DialogContent>
                    <Box component="form" sx={{ mt: 1 }}>
                        <FormControl fullWidth margin="normal">
                            <Autocomplete
                                options={categoryOptions}
                                getOptionLabel={(option) => option.name}
                                value={categoryOptions.find((c) => c.id === formData.category_id) || null}
                                onChange={(event, newValue) => {
                                    setFormData({ ...formData, category_id: newValue ? newValue.id : '' });
                                }}
                                renderInput={(params) => <TextField {...params} label="Main Category" />}
                            />
                        </FormControl>

                        <TextField fullWidth label="Sub Category Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} margin="normal" />

                        <FormControl fullWidth margin="normal">
                            <InputLabel>Status</InputLabel>
                            <Select value={formData.status} label="Status" onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                                <MenuItem value="active">Active</MenuItem>
                                <MenuItem value="inactive">Inactive</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseModal} disabled={processing}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} variant="contained" sx={{ bgcolor: '#063455' }} disabled={processing}>
                        {editingSubCategory ? 'Update' : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Modal */}
            <Dialog open={deleteModalOpen} onClose={handleCloseDeleteModal}>
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete sub category <b>{subCategoryToDelete?.name}</b>? It will be moved to Trash.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDeleteModal} disabled={processing}>
                        Cancel
                    </Button>
                    <Button onClick={handleDelete} color="error" variant="contained" disabled={processing}>
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

SubCategoriesIndex.layout = (page) => (isPosPath(typeof window !== 'undefined' ? window.location.pathname : '') ? <POSLayout>{page}</POSLayout> : page);

export default SubCategoriesIndex;
