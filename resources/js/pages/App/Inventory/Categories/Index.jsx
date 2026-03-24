import POSLayout from "@/components/POSLayout";
import { tenantAsset } from '@/helpers/asset';
import { router, useForm, usePage } from '@inertiajs/react';
import { Add as AddIcon, Close as CloseIcon, Delete as DeleteIcon, Edit as EditIcon, Search as SearchIcon, DeleteSweep as DeleteSweepIcon } from '@mui/icons-material';
import { Alert, Box, Button, Card, CardContent, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, FormControl, Grid, IconButton, InputAdornment, InputLabel, MenuItem, Select, Snackbar, TextField, Typography, useMediaQuery, useTheme } from '@mui/material';
import 'bootstrap/dist/css/bootstrap.min.css';
import { enqueueSnackbar } from 'notistack';
import { useCallback, useEffect, useState } from 'react';
import { routeNameForContext } from '@/lib/utils';

export default function CategoryIndex({ categories, filters }) {
    // Note: Converted categoriesList to categories (paginated object) from controller
    // If controller sends 'categories' variable as pagination object: { data: [...], ... }

    // To maintain compatibility if the controller was updated to match other modules:
    const categoriesList = categories.data || [];
    const categoriesMeta = categories;

    const [open, setOpen] = useState(true);
    const [openAddMenu, setOpenAddMenu] = useState(false);
    const [editingCategoryId, setEditingCategoryId] = useState(null);
    const [searchTerm, setSearchTerm] = useState(filters?.search || '');
    const [reassignCategoryId, setReassignCategoryId] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const [showConfirmation, setShowConfirmation] = useState(false);
    const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
    const [showError, setShowError] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [pendingDeleteCategory, setPendingDeleteCategory] = useState(null);
    const { flash } = usePage().props;
    const theme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down('lg'));

    const { data, setData, post, reset, errors, processing } = useForm({
        name: '',
        status: 'active',
        image: null,
        existingImage: null,
    });
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const handleAddMenuOpen = useCallback(() => {
        setOpenAddMenu(true);
        reset();
        setEditingCategoryId(null);
    }, [reset]);

    const handleAddMenuClose = useCallback(() => {
        setOpenAddMenu(false);
        setEditingCategoryId(null);
        reset();
        setShowError(false);
        setErrorMessage('');
    }, [reset]);

    const handleInputChange = useCallback(
        (e) => {
            const { name, value } = e.target;
            setData(name, value);
        },
        [setData],
    );

    const handleImageChange = useCallback(
        (e) => {
            const file = e.target.files[0];
            if (file) {
                setData('image', file);
            }
        },
        [setData],
    );

    const handleSave = useCallback(
        (e) => {
            e.preventDefault();

            // Basic frontend validation
            if (!data.name.trim()) {
                setErrorMessage('Category name is required.');
                setShowError(true);
                return;
            }

            const formData = new FormData();
            formData.append('name', data.name);
            formData.append('status', data.status);
            if (data.image) {
                formData.append('image', data.image);
            } else if (data.existingImage) {
                formData.append('existingImage', data.existingImage);
            }

            if (editingCategoryId) {
                formData.append('_method', 'PUT');
                router.post(route(routeNameForContext('category.update'), { category: editingCategoryId }), formData, {
                    forceFormData: true,
                    onSuccess: () => {
                        setShowConfirmation(true);
                        handleAddMenuClose();
                        router.visit(route(routeNameForContext('inventory.category')));
                    },
                    onError: (errors) => {
                        setErrorMessage(errors.name || errors.image || 'An error occurred while updating the category.');
                        setShowError(true);
                    },
                });
                setSnackbar({ open: true, message: 'Category updated successfully!', severity: 'success' });
            } else {
                post(route(routeNameForContext('inventory.category.store')), {
                    data: formData,
                    onSuccess: () => {
                        setShowConfirmation(true);
                        handleAddMenuClose();
                        router.visit(route(routeNameForContext('inventory.category')));
                    },
                    onError: (errors) => {
                        setErrorMessage(errors.name || errors.image || errors.message || 'An error occurred while creating the category.');
                        setShowError(true);
                    },
                });
            }
        },
        [data, editingCategoryId, post, handleAddMenuClose],
    );

    const handleEdit = useCallback(
        (category) => {
            setData({
                name: category.name,
                status: category.status || 'active',
                image: null,
                existingImage: category.image,
            });
            setEditingCategoryId(category.id);
            setOpenAddMenu(true);
        },
        [setData],
    );

    const handleDeleteClick = useCallback((category) => {
        setPendingDeleteCategory(category);
        setReassignCategoryId(null); // reset on each delete open
        // Remove strict null check for reassignCategoryId if necessary, logic below handles it
    }, []);

    const handleConfirmDelete = useCallback(() => {
        if (pendingDeleteCategory) {
            setDeleting(true);

            router.delete(route(routeNameForContext('category.destroy'), { category: pendingDeleteCategory.id }), {
                data: {
                    new_category_id: reassignCategoryId || null,
                },
                onSuccess: () => {
                    enqueueSnackbar('Category deleted successfully', { variant: 'success' });
                    setPendingDeleteCategory(null);
                    setReassignCategoryId(null);
                    setDeleting(false);
                    router.visit(route(routeNameForContext('inventory.category')));
                },
                onError: (errors) => {
                    setErrorMessage(errors.message || 'An error occurred while deleting the category.');
                    setShowError(true);
                    setPendingDeleteCategory(null);
                    setReassignCategoryId(null);
                    setDeleting(false);
                },
            });
        }
    }, [pendingDeleteCategory, reassignCategoryId]);

    const handleCancelDelete = useCallback(() => {
        setPendingDeleteCategory(null);
    }, []);

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        router.get(
            route(routeNameForContext('inventory.category')),
            { search: e.target.value },
            { preserveState: true, replace: true },
        );
    };

    useEffect(() => {
        if (flash?.success) {
            setShowConfirmation(true);
        }
        if (flash?.error) {
            setErrorMessage(flash.error);
            setShowError(true);
        }
    }, [flash]);

    // Client-side filtering is no longer primary due to pagination, but keeping for immediate feedback if needed or replace with server search
    // const filteredCategories = categoriesList.filter((category) => category.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <>
            {/* <SideNav open={open} setOpen={setOpen} />
            <div
                style={{
                    marginLeft: open ? `${drawerWidthOpen}px` : `${drawerWidthClosed}px`,
                    transition: 'margin-left 0.3s ease-in-out',
                    marginTop: '5rem',
                }}
            > */}
                <div style={{
                    // height:'100vh',
                    backgroundColor:'#f5f5f5',
                    padding: '20px'
                }}>
                    <div style={{ background: '#ffff', padding: '20px', borderRadius: '10px' }}>
                        <div className="d-flex align-items-center mb-4">
                            <Typography variant="h4" sx={{ mr: 2 }}>
                                {categoriesMeta.total}
                            </Typography>
                            <Typography variant="body1" color="#7F7F7F">
                                Categories
                            </Typography>
                            <TextField
                                placeholder="Search"
                                variant="outlined"
                                size="small"
                                value={searchTerm}
                                onChange={handleSearch}
                                sx={{
                                    ml: 3,
                                    width: 450,
                                    '& .MuiOutlinedInput-root': { borderRadius: '16px' },
                                }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                            <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>

                                <Button
                                    variant="contained"
                                    startIcon={<AddIcon />}
                                    onClick={handleAddMenuOpen}
                                    sx={{
                                        borderRadius: '16px',
                                        textTransform: 'none',
                                        height: 35,
                                        backgroundColor: '#063455',
                                        '&:hover': { backgroundColor: '#002A41' },
                                    }}
                                >
                                    Add Category
                                </Button>
                                <Button
                                variant="outlined"
                                color="error"
                                startIcon={<DeleteIcon />} onClick={() => router.visit(route(routeNameForContext('category.trashed')))}
                                    sx={{
                                        bgcolor: 'transparent',
                                        borderRadius: '16px',
                                        textTransform: 'none',
                                        height: 35,
                                        '&:hover': { bgcolor: 'transparent' }
                                    }}>
                                    Deleted
                                </Button>
                            </Box>
                        </div>
                        <Grid container spacing={2}>
                            {categoriesList.map((category) => (
                                <Grid item xs={12} sm={6} md={4} key={category.id}>
                                    <Card
                                        key={category.id}
                                        sx={{
                                            mb: 1,
                                            borderRadius: 1,
                                            border: '1px solid #E3E3E3',
                                            boxShadow: 'none',
                                            '&:hover': { background: '#F6F6F6' },
                                        }}
                                    >
                                        <CardContent sx={{ p: 2 }}>
                                            <Grid
                                                item
                                                xs={12}
                                                sx={{ display: 'flex', justifyContent: 'space-between', cursor: 'pointer' }}
                                                onClick={() => router.visit(route(routeNameForContext('products.index'), { category_id: category.id }))}
                                            >
                                                <div style={{ display: 'flex' }}>
                                                    <Box sx={{ width: 70, height: 70, mr: 2 }}>
                                                        <img
                                                            src={category.image ? tenantAsset(category.image) : '/assets/dish.png'}
                                                            alt={category.name}
                                                            style={{
                                                                width: '100%',
                                                                height: '100%',
                                                                objectFit: 'contain',
                                                                borderRadius: '50%',
                                                            }}
                                                        />
                                                    </Box>
                                                    <Box>
                                                        <Typography sx={{ fontSize: '18px', fontWeight: 500, color: '#121212' }}>{category.name}</Typography>
                                                        <Typography sx={{ fontSize: '14px', fontWeight: 500, color: '#121212' }}>Products ({category.products_count ?? 0})</Typography>
                                                    </Box>
                                                </div>
                                                <div style={{ display: 'flex' }}>
                                                    <IconButton
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleEdit(category);
                                                        }}
                                                    >
                                                        <EditIcon />
                                                    </IconButton>
                                                    <IconButton
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteClick(category);
                                                        }}
                                                    >
                                                        <DeleteIcon color="error" />
                                                    </IconButton>
                                                </div>
                                            </Grid>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    </div>
                </div>
            {/* </div> */}

            {/* Add/Edit Modal */}
            <Dialog
                open={openAddMenu}
                onClose={handleAddMenuClose}
                fullWidth
                maxWidth="sm"
                PaperProps={{
                    sx: {
                        borderRadius: 1,
                        m: 0,
                        position: 'fixed',
                        right: 0,
                        top: 0,
                        height: '100%',
                        maxHeight: '100%',
                    },
                }}
            >
                <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h5" fontWeight="bold">
                        {editingCategoryId ? 'Edit Category' : 'Add Category'}
                    </Typography>
                    <IconButton onClick={handleAddMenuClose}>
                        <CloseIcon />
                    </IconButton>
                </Box>
                <DialogContent sx={{ p: 0 }}>
                    <Box sx={{ px: 3, pb: 3 }}>
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <Typography variant="body1" sx={{ mb: 1 }}>
                                    Category Name
                                </Typography>
                                <TextField fullWidth placeholder="Enter category name" name="name" value={data.name} onChange={handleInputChange} variant="outlined" size="small" error={!!errors.name} helperText={errors.name} />
                            </Grid>
                            <Grid item xs={12}>
                                <FormControl fullWidth margin="normal">
                                    <InputLabel>Status</InputLabel>
                                    <Select value={data.status} label="Status" onChange={(e) => setData('status', e.target.value)}>
                                        <MenuItem value="active">Active</MenuItem>
                                        <MenuItem value="inactive">Inactive</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12}>
                                <Typography variant="body1" sx={{ mb: 1 }}>
                                    Category Image
                                </Typography>
                                <Button variant="outlined" component="label" size="medium" fullWidth>
                                    {data.image || data.existingImage ? 'Replace Image' : 'Upload Image'}
                                    <input type="file" accept="image/*" hidden onChange={handleImageChange} />
                                </Button>
                                {errors.image && (
                                    <Typography color="error" variant="caption">
                                        {errors.image}
                                    </Typography>
                                )}
                                {(data.image || data.existingImage) && (
                                    <Box sx={{ mb: 1, mt: 2 }}>
                                        <img src={data.image ? URL.createObjectURL(data.image) : tenantAsset(data.existingImage)} alt="Preview" style={{ width: '100%', height: 100, objectFit: 'contain', borderRadius: 8 }} />
                                    </Box>
                                )}
                            </Grid>
                        </Grid>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 3, justifyContent: 'space-between' }}>
                    <Button onClick={handleAddMenuClose}>Cancel</Button>
                    <Button
                        variant="contained"
                        disabled={processing || !data.name.trim()}
                        onClick={handleSave}
                        sx={{
                            backgroundColor: '#003B5C',
                            '&:hover': { backgroundColor: '#002A41' },
                        }}
                    >
                        {processing ? 'Saving...' : 'Save'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation */}
            <Dialog fullScreen={fullScreen} open={!!pendingDeleteCategory} onClose={handleCancelDelete}>
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete the category "{pendingDeleteCategory?.name}"?
                        <br />
                        You can optionally move its products to another category:
                    </DialogContentText>

                    <FormControl fullWidth>
                        <InputLabel id="delete-category">Reassign Products To</InputLabel>
                        <Select labelId="delete-category" id="demo-delete-category" value={reassignCategoryId || ''} onChange={(e) => setReassignCategoryId(e.target.value)} label="Reassign Products To">
                            <MenuItem value=" ">— Leave products uncategorized —</MenuItem>
                            {categoriesList
                                .filter((cat) => cat.id !== pendingDeleteCategory?.id)
                                .map((cat) => (
                                    <MenuItem key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </MenuItem>
                                ))}
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCancelDelete}>Cancel</Button>
                    <Button onClick={handleConfirmDelete} sx={{ color: '#c62828' }} disabled={deleting}>
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar: Success */}
            <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={handleCloseSnackbar}>
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} variant="filled">
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </>
    );
}
CategoryIndex.layout = (page) => <POSLayout>{page}</POSLayout>;
