import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import AdminLayout from '@/layouts/AdminLayout';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    TextField,
    Grid,
    Alert,
    Snackbar,
    CircularProgress
} from '@mui/material';
import {
    ArrowBack as ArrowBackIcon,
    Save as SaveIcon,
    Edit as EditIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import axios from 'axios';

const EditPeriod = ({ period }) => {
    const [formData, setFormData] = useState({
        period_name: '',
        start_date: null,
        end_date: null,
        pay_date: null
    });
    const [loading, setLoading] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    useEffect(() => {
        if (period) {
            setFormData({
                period_name: period.period_name || '',
                start_date: period.start_date ? new Date(period.start_date) : null,
                end_date: period.end_date ? new Date(period.end_date) : null,
                pay_date: period.pay_date ? new Date(period.pay_date) : null
            });
        }
    }, [period]);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.period_name || !formData.start_date || !formData.end_date) {
            showSnackbar('Please fill in all required fields', 'error');
            return;
        }

        setLoading(true);
        try {
            const response = await axios.put(`/api/payroll/periods/${period.id}`, {
                period_name: formData.period_name,
                start_date: formData.start_date.toISOString().split('T')[0],
                end_date: formData.end_date.toISOString().split('T')[0],
                pay_date: formData.pay_date ? formData.pay_date.toISOString().split('T')[0] : null
            });

            if (response.data.success) {
                showSnackbar('Payroll period updated successfully!', 'success');
                setTimeout(() => {
                    router.visit(route('employees.payroll.periods'));
                }, 1500);
            }
        } catch (error) {
            console.error('Error updating period:', error);
            showSnackbar('Error updating payroll period', 'error');
        } finally {
            setLoading(false);
        }
    };

    const showSnackbar = (message, severity = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    if (!period) {
        return (
            <AdminLayout>
                <Box sx={{ p: 3 }}>
                    <Alert severity="error">Period not found</Alert>
                </Box>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <Box sx={{ p: 3 }}>
                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Button
                            startIcon={<ArrowBackIcon />}
                            onClick={() => router.visit(route('employees.payroll.periods'))}
                            sx={{ color: '#063455' }}
                        >
                            Back to Periods
                        </Button>
                        <Typography variant="h4" sx={{ color: '#063455', fontWeight: 600 }}>
                            Edit Payroll Period
                        </Typography>
                    </Box>
                    <EditIcon sx={{ fontSize: 40, color: '#063455', opacity: 0.7 }} />
                </Box>

                {/* Edit Form */}
                <Card>
                    <CardContent sx={{ p: 4 }}>
                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                            <form onSubmit={handleSubmit}>
                                <Grid container spacing={3}>
                                    <Grid item xs={12}>
                                        <Typography variant="h6" sx={{ color: '#063455', fontWeight: 600, mb: 3 }}>
                                            Period Information
                                        </Typography>
                                    </Grid>

                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            fullWidth
                                            label="Period Name"
                                            value={formData.period_name}
                                            onChange={(e) => handleInputChange('period_name', e.target.value)}
                                            required
                                            placeholder="e.g., January 2024"
                                        />
                                    </Grid>

                                    <Grid item xs={12} md={6}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography variant="body2" color="textSecondary">
                                                Status: 
                                            </Typography>
                                            <Typography 
                                                variant="body2" 
                                                sx={{ 
                                                    fontWeight: 600,
                                                    color: period.status === 'draft' ? '#ed6c02' : 
                                                           period.status === 'processing' ? '#1976d2' : '#2e7d32'
                                                }}
                                            >
                                                {period.status?.toUpperCase()}
                                            </Typography>
                                        </Box>
                                    </Grid>

                                    <Grid item xs={12} md={4}>
                                        <DatePicker
                                            label="Start Date"
                                            value={formData.start_date}
                                            onChange={(date) => handleInputChange('start_date', date)}
                                            renderInput={(params) => <TextField {...params} fullWidth required />}
                                        />
                                    </Grid>

                                    <Grid item xs={12} md={4}>
                                        <DatePicker
                                            label="End Date"
                                            value={formData.end_date}
                                            onChange={(date) => handleInputChange('end_date', date)}
                                            renderInput={(params) => <TextField {...params} fullWidth required />}
                                        />
                                    </Grid>

                                    <Grid item xs={12} md={4}>
                                        <DatePicker
                                            label="Pay Date (Optional)"
                                            value={formData.pay_date}
                                            onChange={(date) => handleInputChange('pay_date', date)}
                                            renderInput={(params) => <TextField {...params} fullWidth />}
                                        />
                                    </Grid>

                                    <Grid item xs={12}>
                                        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
                                            <Button
                                                variant="outlined"
                                                onClick={() => router.visit(route('employees.payroll.periods'))}
                                                sx={{ 
                                                    color: '#666',
                                                    borderColor: '#666',
                                                    '&:hover': { borderColor: '#333' }
                                                }}
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                type="submit"
                                                variant="contained"
                                                startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                                                disabled={loading}
                                                sx={{ 
                                                    backgroundColor: '#063455',
                                                    '&:hover': { backgroundColor: '#052d45' }
                                                }}
                                            >
                                                {loading ? 'Updating...' : 'Update Period'}
                                            </Button>
                                        </Box>
                                    </Grid>
                                </Grid>
                            </form>
                        </LocalizationProvider>
                    </CardContent>
                </Card>

                {/* Snackbar for notifications */}
                <Snackbar
                    open={snackbar.open}
                    autoHideDuration={6000}
                    onClose={handleCloseSnackbar}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                >
                    <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                        {snackbar.message}
                    </Alert>
                </Snackbar>
            </Box>
        </AdminLayout>
    );
};

export default EditPeriod;
