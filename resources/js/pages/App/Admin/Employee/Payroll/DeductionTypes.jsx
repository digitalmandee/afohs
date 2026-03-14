import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import AdminLayout from '@/layouts/AdminLayout';
import { Box, Card, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Grid, FormControl, InputLabel, Select, MenuItem, Chip, Alert, Snackbar, Tooltip } from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, ArrowBack as ArrowBackIcon, TrendingDown as TrendingDownIcon } from '@mui/icons-material';
import axios from 'axios';

const DeductionTypes = () => {
    const [deductionTypes, setDeductionTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showDialog, setShowDialog] = useState(false);
    const [editingType, setEditingType] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const [formData, setFormData] = useState({
        name: '',
        type: 'fixed',
        description: '',
        is_mandatory: false,
        is_active: true,
        calculation_base: 'basic_salary',
        is_global: false,
        default_amount: '',
        percentage: '',
    });

    useEffect(() => {
        fetchDeductionTypes();
    }, []);

    const fetchDeductionTypes = async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('api.payroll.deduction-types'));
            if (response.data.success) {
                setDeductionTypes(response.data.deductionTypes || []);
            }
        } catch (error) {
            console.error('Error fetching deduction types:', error);
            showSnackbar('Error loading deduction types', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            let response;
            if (editingType) {
                response = await axios.put(route('api.payroll.deduction-types.update', editingType.id), formData);
            } else {
                response = await axios.post(route('api.payroll.deduction-types.store'), formData);
            }

            if (response.data.success) {
                showSnackbar(editingType ? 'Deduction type updated successfully!' : 'Deduction type created successfully!', 'success');
                handleCloseDialog();
                fetchDeductionTypes();
            }
        } catch (error) {
            console.error('Error saving deduction type:', error);
            if (error.response?.data?.errors) {
                const errorMessages = Object.values(error.response.data.errors).flat().join(', ');
                showSnackbar(`Validation errors: ${errorMessages}`, 'error');
            } else {
                showSnackbar('Error saving deduction type', 'error');
            }
        }
    };

    const handleEdit = (deductionType) => {
        setEditingType(deductionType);
        setFormData({
            name: deductionType.name,
            type: deductionType.type,
            description: deductionType.description || '',
            is_mandatory: deductionType.is_mandatory,
            is_active: deductionType.is_active,
            calculation_base: deductionType.calculation_base || 'basic_salary',
            is_global: deductionType.is_global || false,
            default_amount: deductionType.default_amount || '',
            percentage: deductionType.percentage || '',
        });
        setShowDialog(true);
    };

    const handleDelete = async (deductionType) => {
        if (window.confirm(`Are you sure you want to delete "${deductionType.name}"?`)) {
            try {
                const response = await axios.delete(route('api.payroll.deduction-types.delete', deductionType.id));
                if (response.data.success) {
                    showSnackbar('Deduction type deleted successfully!', 'success');
                    fetchDeductionTypes();
                }
            } catch (error) {
                console.error('Error deleting deduction type:', error);
                showSnackbar('Error deleting deduction type', 'error');
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
            is_mandatory: false,
            is_active: true,
            calculation_base: 'basic_salary',
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
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <IconButton onClick={() => window.history.back()}>
                            <ArrowBackIcon sx={{ color: '#063455' }} />
                        </IconButton>
                        <Typography sx={{ color: '#063455', fontWeight: 700, fontSize:'30px' }}>
                            Deduction Types
                        </Typography>
                    </Box>
                    <Button
                        startIcon={<AddIcon />}
                        onClick={() => setShowDialog(true)}
                        variant="contained"
                        sx={{
                            backgroundColor: '#063455',
                            textTransform:'capitalize',
                            borderRadius:'16px',
                            '&:hover': { backgroundColor: '#052d45' },
                        }}
                    >
                        Add Deduction Type
                    </Button>
                </Box>

                {/* Deduction Types Table */}
                <Card>
                    <TableContainer component={Paper} sx={{borderRadius:'12px'}}>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ backgroundColor: '#063455' }}>
                                    <TableCell sx={{ fontWeight: 600, color: '#fff' }}>Name</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#fff' }}>Type</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#fff' }}>Amount/Rate</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#fff' }}>Global</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#fff' }}>Mandatory</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#fff' }}>Status</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#fff' }}>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                                            Loading...
                                        </TableCell>
                                    </TableRow>
                                ) : deductionTypes.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                                            <Box sx={{ textAlign: 'center' }}>
                                                <TrendingDownIcon sx={{ fontSize: 64, color: '#ccc', mb: 2 }} />
                                                <Typography color="textSecondary">No deduction types found</Typography>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    deductionTypes.map((deductionType) => (
                                        <TableRow key={deductionType.id} sx={{ '&:hover': { backgroundColor: '#f5f5f5' } }}>
                                            <TableCell>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                                    {deductionType.name}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip label={deductionType.type} size="small" color={getTypeColor(deductionType.type)} />
                                            </TableCell>
                                            <TableCell>{deductionType.type === 'fixed' ? (deductionType.default_amount ? `Rs ${parseFloat(deductionType.default_amount).toLocaleString()}` : '-') : deductionType.percentage ? `${deductionType.percentage}%` : '-'}</TableCell>
                                            <TableCell>
                                                <Chip label={deductionType.is_global ? 'Yes' : 'No'} size="small" color={deductionType.is_global ? 'info' : 'default'} />
                                            </TableCell>
                                            <TableCell>
                                                <Chip label={deductionType.is_mandatory ? 'Yes' : 'No'} size="small" color={deductionType.is_mandatory ? 'error' : 'default'} />
                                            </TableCell>
                                            <TableCell>
                                                <Chip label={deductionType.is_active ? 'Active' : 'Inactive'} size="small" color={getStatusColor(deductionType.is_active)} />
                                            </TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', gap: 1 }}>
                                                    <Tooltip title="Edit">
                                                        <IconButton size="small" onClick={() => handleEdit(deductionType)} sx={{ color: '#ed6c02' }}>
                                                            <EditIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Delete">
                                                        <IconButton size="small" onClick={() => handleDelete(deductionType)} sx={{ color: '#d32f2f' }}>
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
                            {editingType ? 'Edit Deduction Type' : 'Add New Deduction Type'}
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
                                    <InputLabel>Calculation Base</InputLabel>
                                    <Select value={formData.calculation_base} label="Calculation Base" onChange={(e) => setFormData({ ...formData, calculation_base: e.target.value })}>
                                        <MenuItem value="basic_salary">Basic Salary</MenuItem>
                                        <MenuItem value="gross_salary">Gross Salary</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth>
                                    <InputLabel>Mandatory</InputLabel>
                                    <Select value={formData.is_mandatory} label="Mandatory" onChange={(e) => setFormData({ ...formData, is_mandatory: e.target.value })}>
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
                                    <TextField fullWidth label="Default Amount" type="number" value={formData.default_amount} onChange={(e) => setFormData({ ...formData, default_amount: e.target.value })} helperText="Fixed amount to deduct" />
                                </Grid>
                            )}
                            {formData.type === 'percentage' && (
                                <Grid item xs={12} sm={6}>
                                    <TextField fullWidth label="Percentage" type="number" value={formData.percentage} onChange={(e) => setFormData({ ...formData, percentage: e.target.value })} helperText="Percentage of calculation base" inputProps={{ min: 0, max: 100, step: 0.01 }} />
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

export default DeductionTypes;
