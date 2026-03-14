import { router } from '@inertiajs/react';
import AddIcon from '@mui/icons-material/Add';
import { FaRegEdit } from 'react-icons/fa';
import { RiDeleteBin6Line } from 'react-icons/ri';
import SearchIcon from '@mui/icons-material/Search';
import { Box, Button, IconButton, TextField, DialogActions, Dialog, DialogContent, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, MenuItem, Select, FormControl, InputLabel, TablePagination } from '@mui/material';
import { useState } from 'react';
import { useSnackbar } from 'notistack';
import { FaTrash } from 'react-icons/fa';
import { FaEdit } from 'react-icons/fa';
import { Delete } from '@mui/icons-material';

const BranchIndex = ({ branches: initialData }) => {
    const { enqueueSnackbar } = useSnackbar();
    const { data: branchesData, current_page, per_page, total } = initialData;
    const [search, setSearch] = useState('');

    // Modal States
    const [openAddModal, setOpenAddModal] = useState(false);
    const [openDeleteModal, setOpenDeleteModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedBranch, setSelectedBranch] = useState(null);

    // Form States
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        status: true,
    });

    const handleSearch = (e) => {
        if (e.key === 'Enter') {
            router.visit(route('branches.index'), {
                data: { search: search },
                preserveState: true,
                preserveScroll: true,
            });
        }
    };

    const handlePageChange = (event, newPage) => {
        router.visit(route('branches.index'), {
            data: { page: newPage + 1, search },
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleOpen = () => {
        setFormData({ name: '', address: '', status: true });
        setEditMode(false);
        setOpenAddModal(true);
    };

    const handleEdit = (branch) => {
        setFormData({
            name: branch.name,
            address: branch.address || '',
            status: branch.status,
        });
        setSelectedBranch(branch);
        setEditMode(true);
        setOpenAddModal(true);
    };

    const handleClose = () => {
        setOpenAddModal(false);
        setEditMode(false);
        setSelectedBranch(null);
    };

    const handleSubmit = () => {
        if (!formData.name) {
            enqueueSnackbar('Name is required', { variant: 'error' });
            return;
        }

        const url = editMode ? route('branches.update', selectedBranch.id) : route('branches.store');
        const method = editMode ? 'put' : 'post';

        router[method](url, formData, {
            onSuccess: () => {
                enqueueSnackbar(editMode ? 'Company updated successfully' : 'Company created successfully', { variant: 'success' });
                handleClose();
            },
            onError: (errors) => {
                enqueueSnackbar('Operation failed. Check inputs.', { variant: 'error' });
            },
        });
    };

    const handleDeleteClick = (branch) => {
        setSelectedBranch(branch);
        setOpenDeleteModal(true);
    };

    const confirmDelete = () => {
        router.delete(route('branches.destroy', selectedBranch.id), {
            onSuccess: () => {
                enqueueSnackbar('Company deleted successfully', { variant: 'success' });
                setOpenDeleteModal(false);
            },
            onError: () => {
                enqueueSnackbar('Failed to delete branch', { variant: 'error' });
            },
        });
    };

    return (
        <Box sx={{ p: 2, height: '100vh', bgcolor: '#f5f5f5' }}>
            <div style={{ paddingTop: '1rem', backgroundColor: 'transparent' }}>
                <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <Typography sx={{ fontWeight: 700, fontSize: '30px', color: '#063455' }}>Company Management</Typography>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.1rem', marginLeft: 'auto' }}>
                        <Button variant='contained' style={{ color: '#fff', backgroundColor: '#063455', borderRadius: '16px', textTransform: 'none' }} startIcon={<AddIcon />} onClick={handleOpen}>
                            Add Company
                        </Button>
                        <Button
                            onClick={() => router.visit(route('branches.trashed'))}
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
                    </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <TextField
                        fullWidth
                        placeholder="Search company..."
                        size="small"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={handleSearch}
                        sx={{
                            width: '280px',
                            '& .MuiOutlinedInput-root': {
                                borderRadius: '16px',
                            },
                        }}
                        InputProps={{
                            startAdornment: <SearchIcon style={{ color: '#7f7f7f', marginRight: '1px' }} />,
                            style: { backgroundColor: 'transparent' },
                        }}
                    />
                </div>

                <TableContainer component={Paper} style={{ width: '100%', borderRadius: '12px', boxShadow: 'none', marginTop: '24px' }}>
                    <Table>
                        <TableHead style={{ backgroundColor: '#063455' }}>
                            <TableRow>
                                <TableCell style={{ color: '#fff', fontWeight: '600', }}>Name</TableCell>
                                <TableCell style={{ color: '#fff', fontWeight: '600', }}>Address</TableCell>
                                <TableCell style={{ color: '#fff', fontWeight: '600', }}>Status</TableCell>
                                <TableCell style={{ color: '#fff', fontWeight: '600', }} >
                                    Action
                                </TableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {branchesData.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} align="center">
                                        No branches found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                branchesData.map((item, index) => (
                                    <TableRow key={index}>
                                        <TableCell style={{ fontSize: '14px', color: '#7f7f7f' }}>{item.name}</TableCell>
                                        <TableCell style={{ fontSize: '14px', color: '#7f7f7f' }}>{item.address || '-'}</TableCell>
                                        <TableCell style={{ fontSize: '14px', color: item.status ? 'green' : 'red' }}>{item.status ? 'Active' : 'Inactive'}</TableCell>
                                        <TableCell>
                                            <IconButton onClick={() => handleEdit(item)}
                                            >
                                                <FaEdit size={18} style={{ marginRight: 10, color: '#f57c00' }} />
                                            </IconButton>
                                            <Button startIcon={<Delete />}
                                                onClick={() => handleDeleteClick(item)}
                                                color="error" />
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                <TablePagination rowsPerPageOptions={[10, 25, 50]} component="div" count={total} rowsPerPage={per_page} page={current_page - 1} onPageChange={handlePageChange} />

                {/* Add/Edit Modal */}
                <Dialog open={openAddModal} onClose={handleClose} maxWidth="sm" fullWidth>
                    <DialogContent sx={{ pt: 3, pb: 2 }}>
                        <Typography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>
                            {editMode ? 'Edit Company' : 'Add Company'}
                        </Typography>

                        <Typography variant="body1" sx={{ mb: 1, fontWeight: 500 }}>
                            Name
                        </Typography>
                        <TextField fullWidth value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} variant="outlined" sx={{ mb: 2 }} />

                        <Typography variant="body1" sx={{ mb: 1, fontWeight: 500 }}>
                            Address
                        </Typography>
                        <TextField fullWidth value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} variant="outlined" multiline rows={2} sx={{ mb: 2 }} />

                        <FormControl fullWidth>
                            <InputLabel id="status-label">Status</InputLabel>
                            <Select labelId="status-label" value={formData.status} label="Status" onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                                <MenuItem value={true}>Active</MenuItem>
                                <MenuItem value={false}>Inactive</MenuItem>
                            </Select>
                        </FormControl>
                    </DialogContent>

                    <DialogActions sx={{ px: 3, pb: 2 }}>
                        <Button onClick={handleClose}>Cancel</Button>
                        <Button onClick={handleSubmit} variant="contained" sx={{ backgroundColor: '#063455' }}>
                            {editMode ? 'Update' : 'Add'}
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Delete Modal */}
                <Dialog open={openDeleteModal} onClose={() => setOpenDeleteModal(false)} maxWidth="xs">
                    <DialogContent sx={{ pt: 3 }}>
                        <Typography variant="h6" align="center" sx={{ mb: 2 }}>
                            Delete Company?
                        </Typography>
                        <Typography variant="body2" align="center" color="textSecondary">
                            This action cannot be undone.
                        </Typography>
                    </DialogContent>
                    <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
                        <Button onClick={() => setOpenDeleteModal(false)} variant="outlined">
                            Close
                        </Button>
                        <Button onClick={confirmDelete} variant="contained" color="error">
                            Delete
                        </Button>
                    </DialogActions>
                </Dialog>
            </div>
        </Box>
    );
};

export default BranchIndex;
