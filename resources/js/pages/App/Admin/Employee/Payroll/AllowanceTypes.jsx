import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import AdminLayout from '@/layouts/AdminLayout';
import { FaEdit } from 'react-icons/fa';
import { Box, Card, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Grid, FormControl, InputLabel, Select, MenuItem, Chip, Alert, Snackbar, Tooltip } from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, ArrowBack as ArrowBackIcon, TrendingUp as TrendingUpIcon } from '@mui/icons-material';
import axios from 'axios';

const AllowanceTypes = () => {
    const [allowanceTypes, setAllowanceTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showDialog, setShowDialog] = useState(false);
    const [editingType, setEditingType] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const [formData, setFormData] = useState({
        name: '',
        type: 'fixed',
        description: '',
        is_taxable: false,
        is_active: true,
        is_global: false,
        default_amount: '',
        percentage: '',
    });

    useEffect(() => {
        fetchAllowanceTypes();
    }, []);

    const fetchAllowanceTypes = async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('api.payroll.allowance-types'));
            if (response.data.success) {
                setAllowanceTypes(response.data.allowanceTypes || []);
            } else {
                setAllowanceTypes([]);
                showSnackbar('Failed to load allowance types', 'error');
            }
        } catch (error) {
            console.error('Error fetching allowance types:', error);
            setAllowanceTypes([]);
            showSnackbar('Error loading allowance types', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            let response;
            if (editingType) {
                response = await axios.put(`/api/payroll/allowance-types/${editingType.id}`, formData);
            } else {
                response = await axios.post('/api/payroll/allowance-types', formData);
            }

            if (response.data.success) {
                showSnackbar(editingType ? 'Allowance type updated successfully!' : 'Allowance type created successfully!', 'success');
                handleCloseDialog();
                fetchAllowanceTypes();
            }
        } catch (error) {
            console.error('Error saving allowance type:', error);
            if (error.response?.data?.errors) {
                const errorMessages = Object.values(error.response.data.errors).flat().join(', ');
                showSnackbar(`Validation errors: ${errorMessages}`, 'error');
            } else {
                showSnackbar('Error saving allowance type', 'error');
            }
        }
    };

    const handleEdit = (allowanceType) => {
        setEditingType(allowanceType);
        setFormData({
            name: allowanceType.name,
            type: allowanceType.type,
            description: allowanceType.description || '',
            is_taxable: allowanceType.is_taxable,
            is_active: allowanceType.is_active,
            is_global: allowanceType.is_global || false,
            default_amount: allowanceType.default_amount || '',
            percentage: allowanceType.percentage || '',
        });
        setShowDialog(true);
    };

    const handleDelete = async (allowanceType) => {
        if (window.confirm(`Are you sure you want to delete "${allowanceType.name}"?`)) {
            try {
                const response = await axios.delete(`/api/payroll/allowance-types/${allowanceType.id}`);
                if (response.data.success) {
                    showSnackbar('Allowance type deleted successfully!', 'success');
                    fetchAllowanceTypes();
                }
            } catch (error) {
                console.error('Error deleting allowance type:', error);
                showSnackbar('Error deleting allowance type', 'error');
            }
        }
    };

    const handleCloseDialog = () => {
        setShowDialog(false);
        setEditingType(null);
        setFormData({
            name: '',
            type: 'fixed',
            description: '',
            is_taxable: false,
            is_active: true,
            is_global: false,
            default_amount: '',
            percentage: '',
        });
    };

    const showSnackbar = (message, severity = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'fixed':
                return 'primary';
            case 'percentage':
                return 'secondary';
            case 'conditional':
                return 'warning';
            default:
                return 'default';
        }
    };

    const getStatusColor = (isActive) => {
        return isActive ? 'success' : 'error';
    };

    return (
        <AdminLayout>
            <Box sx={{ bgcolor: '#f5f5f5', p: 2 }}>
                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <IconButton onClick={() => window.history.back()}>
                            <ArrowBackIcon sx={{ color: '#063455' }} />
                        </IconButton>
                        <Typography sx={{ color: '#063455', fontWeight: 700, fontSize: '30px' }}>Allowance Types</Typography>
                    </Box>
                    <Button
                        startIcon={<AddIcon />}
                        onClick={() => setShowDialog(true)}
                        variant="contained"
                        sx={{
                            backgroundColor: '#063455',
                            borderRadius: '16px',
                            '&:hover': { backgroundColor: '#052d45' },
                        }}
                    >
                        Add Allowance Type
                    </Button>
                </Box>

                {/* Allowance Types Table */}
                <Card>
                    <TableContainer component={Paper} sx={{ borderRadius: '16px', overflowX: 'auto' }}>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ backgroundColor: '#063455' }}>
                                    <TableCell sx={{ fontWeight: 600, color: '#fff', fontSize: '16px' }}>Name</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#fff', fontSize: '16px' }}>Type</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#fff', fontSize: '16px' }}>Amount/Rate</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#fff', fontSize: '16px' }}>Global</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#fff', fontSize: '16px' }}>Taxable</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#fff', fontSize: '16px' }}>Status</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#fff', fontSize: '16px' }}>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                                            Loading...
                                        </TableCell>
                                    </TableRow>
                                ) : (allowanceTypes || []).length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                                            <Box sx={{ textAlign: 'center' }}>
                                                <TrendingUpIcon sx={{ fontSize: 64, color: '#ccc', mb: 2 }} />
                                                <Typography color="textSecondary">No allowance types found</Typography>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    (allowanceTypes || []).map((allowanceType) => (
                                        <TableRow key={allowanceType.id} sx={{ '&:hover': { backgroundColor: '#f5f5f5' } }}>
                                            <TableCell sx={{ fontWeight: 400, color: '#7f7f7f', fontSize: '14px' }}>
                                                <Typography variant="subtitle2">{allowanceType.name}</Typography>
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 400, color: '#7f7f7f', fontSize: '14px' }}>
                                                <Chip label={allowanceType.type} size="small" color={getTypeColor(allowanceType.type)} />
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 400, color: '#7f7f7f', fontSize: '14px' }}>{allowanceType.type === 'fixed' ? (allowanceType.default_amount ? `Rs ${parseFloat(allowanceType.default_amount).toLocaleString()}` : '-') : allowanceType.percentage ? `${allowanceType.percentage}%` : '-'}</TableCell>
                                            <TableCell sx={{ fontWeight: 400, color: '#7f7f7f', fontSize: '14px' }}>
                                                <Chip label={allowanceType.is_global ? 'Yes' : 'No'} size="small" color={allowanceType.is_global ? 'info' : 'default'} />
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 400, color: '#7f7f7f', fontSize: '14px' }}>
                                                <Chip label={allowanceType.is_taxable ? 'Yes' : 'No'} size="small" color={allowanceType.is_taxable ? 'warning' : 'success'} />
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 400, color: '#7f7f7f', fontSize: '14px' }}>
                                                <Chip label={allowanceType.is_active ? 'Active' : 'Inactive'} size="small" color={getStatusColor(allowanceType.is_active)} />
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 400, color: '#7f7f7f', fontSize: '14px' }}>
                                                <Box sx={{ display: 'flex', gap: 1 }}>
                                                    <Tooltip title="Edit">
                                                        <IconButton
                                                            // size="small"
                                                            onClick={() => handleEdit(allowanceType)}
                                                            // sx={{ color: '#ed6c02' }}
                                                        >
                                                            <FaEdit size={18} style={{ marginRight: 10, color: '#f57c00' }} />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Delete">
                                                        <IconButton
                                                            size="small"
                                                            color="error"
                                                            onClick={() => handleDelete(allowanceType)}
                                                            // sx={{ color: '#d32f2f' }}
                                                        >
                                                            <DeleteIcon fontSize="small" />
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
                </Card>

                {/* Add/Edit Dialog */}
                <Dialog open={showDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                    <DialogTitle>
                        <Typography variant="h6" sx={{ color: '#063455', fontWeight: 600 }}>
                            {editingType ? 'Edit Allowance Type' : 'Add New Allowance Type'}
                        </Typography>
                    </DialogTitle>
                    <DialogContent>
                        <Grid container spacing={3} sx={{ mt: 1 }}>
                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth label="Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth>
                                    <InputLabel>Type</InputLabel>
                                    <Select value={formData.type} label="Type" onChange={(e) => setFormData({ ...formData, type: e.target.value })}>
                                        <MenuItem value="fixed">Fixed Amount</MenuItem>
                                        <MenuItem value="percentage">Percentage</MenuItem>
                                        <MenuItem value="conditional">Conditional</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12}>
                                <TextField fullWidth label="Description" multiline rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth>
                                    <InputLabel>Taxable</InputLabel>
                                    <Select value={formData.is_taxable} label="Taxable" onChange={(e) => setFormData({ ...formData, is_taxable: e.target.value })}>
                                        <MenuItem value={false}>No</MenuItem>
                                        <MenuItem value={true}>Yes</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth>
                                    <InputLabel>Status</InputLabel>
                                    <Select value={formData.is_active} label="Status" onChange={(e) => setFormData({ ...formData, is_active: e.target.value })}>
                                        <MenuItem value={true}>Active</MenuItem>
                                        <MenuItem value={false}>Inactive</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth>
                                    <InputLabel>Apply Globally</InputLabel>
                                    <Select value={formData.is_global} label="Apply Globally" onChange={(e) => setFormData({ ...formData, is_global: e.target.value })}>
                                        <MenuItem value={false}>No (Per Employee)</MenuItem>
                                        <MenuItem value={true}>Yes (All Employees)</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            {formData.type === 'fixed' && (
                                <Grid item xs={12} sm={6}>
                                    <TextField fullWidth label="Default Amount" type="number" value={formData.default_amount} onChange={(e) => setFormData({ ...formData, default_amount: e.target.value })} helperText="Fixed amount to apply" />
                                </Grid>
                            )}
                            {formData.type === 'percentage' && (
                                <Grid item xs={12} sm={6}>
                                    <TextField fullWidth label="Percentage" type="number" value={formData.percentage} onChange={(e) => setFormData({ ...formData, percentage: e.target.value })} helperText="Percentage of basic salary" inputProps={{ min: 0, max: 100, step: 0.01 }} />
                                </Grid>
                            )}
                        </Grid>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDialog}>Cancel</Button>
                        <Button
                            onClick={handleSave}
                            variant="contained"
                            sx={{
                                backgroundColor: '#063455',
                                '&:hover': { backgroundColor: '#052d45' },
                            }}
                        >
                            {editingType ? 'Update' : 'Create'}
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Snackbar for notifications */}
                <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                    <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                        {snackbar.message}
                    </Alert>
                </Snackbar>
            </Box>
        </AdminLayout>
    );
};

export default AllowanceTypes;
