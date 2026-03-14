import { useState } from 'react';
import { router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import AdminLayout from '@/layouts/AdminLayout';
import { Box, Card, CardContent, Typography, TextField, Button, Grid, Alert, Snackbar, FormControl, InputLabel, Select, MenuItem, Divider, Paper, IconButton } from '@mui/material';
import { ArrowBack as ArrowBackIcon, Save as SaveIcon, CalendarMonth as CalendarIcon, Schedule as ScheduleIcon } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import axios from 'axios';

const drawerWidth = 240;

const CreatePeriod = () => {
    const [formData, setFormData] = useState({
        period_name: '',
        start_date: null,
        end_date: null,
        pay_date: null,
        status: 'draft',
        description: '',
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success',
    });

    const handleInputChange = (field, value) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));

        // Clear error when user starts typing
        if (errors[field]) {
            setErrors((prev) => ({
                ...prev,
                [field]: null,
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.period_name.trim()) {
            newErrors.period_name = 'Period name is required';
        }

        if (!formData.start_date) {
            newErrors.start_date = 'Start date is required';
        }

        if (!formData.end_date) {
            newErrors.end_date = 'End date is required';
        }

        if (formData.start_date && formData.end_date) {
            if (new Date(formData.start_date) >= new Date(formData.end_date)) {
                newErrors.end_date = 'End date must be after start date';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            setSnackbar({
                open: true,
                message: 'Please fix the errors before submitting',
                severity: 'error',
            });
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post('/api/payroll/periods', {
                ...formData,
                start_date: formData.start_date,
                end_date: formData.end_date,
                pay_date: formData.pay_date,
            });

            if (response.data.success) {
                setSnackbar({
                    open: true,
                    message: 'Payroll period created successfully!',
                    severity: 'success',
                });

                // Redirect to periods list after short delay
                setTimeout(() => {
                    router.visit(route('employees.payroll.periods'));
                }, 1500);
            } else {
                throw new Error(response.data.message || 'Failed to create period');
            }
        } catch (error) {
            console.error('Error creating period:', error);
            setSnackbar({
                open: true,
                message: error.response?.data?.message || 'Error creating payroll period',
                severity: 'error',
            });
        } finally {
            setLoading(false);
        }
    };

    const generatePeriodName = () => {
        if (formData.start_date && formData.end_date) {
            const startMonth = new Date(formData.start_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
            const endMonth = new Date(formData.end_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

            if (startMonth === endMonth) {
                return startMonth;
            } else {
                return `${startMonth} - ${endMonth}`;
            }
        }
        return '';
    };

    const handleAutoGenerateName = () => {
        const generatedName = generatePeriodName();
        if (generatedName) {
            handleInputChange('period_name', generatedName);
        }
    };

    return (
        <AdminLayout>
            <div
                style={{
                    minHeight: '100vh',
                    backgroundColor: '#f5f5f5',
                    padding: '1rem',
                }}
            >
                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <IconButton onClick={() => window.history.back()}>
                            <ArrowBackIcon sx={{ color: '#063455' }} />
                        </IconButton>
                        <Box>
                            <Typography sx={{ fontWeight: 700, fontSize: '30px', color: '#063455' }}>
                                Create Payroll Period
                            </Typography>
                            {/* <Typography variant="body2" color="textSecondary">
                            Set up a new payroll processing period
                        </Typography> */}
                        </Box>
                    </Box>
                    {/* <CalendarIcon sx={{ fontSize: 40, color: '#063455', opacity: 0.7 }} /> */}
                </Box>

                {/* Main Form */}
                <Card sx={{ maxWidth: 600, mx: 'auto', p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <ScheduleIcon sx={{ color: '#063455' }} />
                        <Typography variant="h6" sx={{ fontWeight: 600, color: '#063455' }}>
                            Period Information
                        </Typography>
                    </Box>

                    <form onSubmit={handleSubmit}>
                        <Grid container spacing={2}>
                            {/* Period Dates */}
                            <Grid item xs={12} sm={4}>
                                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                                    Start Date
                                </Typography>
                                <TextField
                                    type="date"
                                    value={formData.start_date || ''}
                                    onChange={(e) => handleInputChange('start_date', e.target.value)}
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                    error={!!errors.start_date}
                                    helperText={errors.start_date}
                                    sx={{
                                        minWidth: 0,
                                        height: 40,
                                        '& .MuiInputBase-root': {
                                            minWidth: 0,
                                            height: 40,
                                        },
                                        '& .MuiFormControl-root': {
                                            minWidth: 0,
                                            height: 40,
                                        },
                                    }}
                                />
                            </Grid>

                            <Grid item xs={12} sm={4}>
                                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                                    End Date
                                </Typography>
                                <TextField
                                    type="date"
                                    value={formData.end_date || ''}
                                    onChange={(e) => handleInputChange('end_date', e.target.value)}
                                    inputProps={{ min: formData.start_date }}
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                    error={!!errors.end_date}
                                    helperText={errors.end_date}
                                    sx={{
                                        minWidth: 0,
                                        height: 40,
                                        '& .MuiInputBase-root': {
                                            minWidth: 0,
                                            height: 40,
                                        },
                                        '& .MuiFormControl-root': {
                                            minWidth: 0,
                                            height: 40,
                                        },
                                    }}
                                />
                            </Grid>

                            {/* Pay Date */}
                            <Grid item xs={12} sm={4}>
                                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                                    Pay Date (optional)
                                </Typography>
                                <TextField
                                    type="date"
                                    value={formData.pay_date || ''}
                                    onChange={(e) => handleInputChange('pay_date', e.target.value)}
                                    inputProps={{ min: formData.end_date }}
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                    error={!!errors.pay_date}
                                    helperText={errors.pay_date}
                                    sx={{
                                        minWidth: 0,
                                        height: 40,
                                        '& .MuiInputBase-root': {
                                            minWidth: 0,
                                            height: 40,
                                        },
                                        '& .MuiFormControl-root': {
                                            minWidth: 0,
                                            height: 40,
                                        },
                                    }}
                                />
                            </Grid>

                            {/* Period Name */}
                            <Grid item xs={12}>
                                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
                                    <TextField
                                        fullWidth
                                        label="Period Name"
                                        value={formData.period_name}
                                        onChange={(e) => handleInputChange('period_name', e.target.value)}
                                        error={!!errors.period_name}
                                        helperText={errors.period_name}
                                        placeholder="e.g., January 2024, Q1 2024"
                                        sx={{
                                            minWidth: 0,
                                            height: 50,
                                            '& .MuiInputBase-root': {
                                                minWidth: 0,
                                                height: 50,
                                            },
                                            '& .MuiFormControl-root': {
                                                minWidth: 0,
                                                height: 50,
                                            },
                                        }}
                                    />
                                    <Button
                                        variant="outlined"
                                        onClick={handleAutoGenerateName}
                                        disabled={!formData.start_date || !formData.end_date}
                                        sx={{
                                            minWidth: 120,
                                            height: 50,
                                            borderColor: '#063455',
                                            color: '#063455',
                                            '&:hover': { borderColor: '#052d45', backgroundColor: 'rgba(6, 52, 85, 0.04)' },
                                        }}
                                    >
                                        Auto Generate
                                    </Button>
                                </Box>
                            </Grid>

                            {/* Status */}
                            <Grid item xs={12} md={4}>
                                <FormControl fullWidth>
                                    <InputLabel>Status</InputLabel>
                                    <Select
                                        value={formData.status}
                                        onChange={(e) => handleInputChange('status', e.target.value)}
                                        label="Status"
                                        sx={{
                                            minWidth: 0,
                                            height: 40,
                                            '& .MuiInputBase-root': {
                                                minWidth: 0,
                                                height: 40,
                                            },
                                            '& .MuiFormControl-root': {
                                                minWidth: 0,
                                                height: 40,
                                            },
                                        }}
                                    >
                                        <MenuItem value="draft">Draft</MenuItem>
                                        <MenuItem value="active">Active</MenuItem>
                                        <MenuItem value="processing">Processing</MenuItem>
                                        <MenuItem value="completed">Completed</MenuItem>
                                        <MenuItem value="paid">Paid</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>

                            {/* Description */}
                            <Grid item xs={12}>
                                <TextField fullWidth label="Description (Optional)" value={formData.description} onChange={(e) => handleInputChange('description', e.target.value)} multiline rows={3} placeholder="Add any notes or description for this payroll period..." />
                            </Grid>

                            {/* Period Preview */}
                            {formData.start_date && formData.end_date && (
                                <Grid item xs={12}>
                                    <Paper sx={{ p: 3, backgroundColor: '#f8f9fa', border: '1px solid #e0e0e0' }}>
                                        <Typography variant="h6" sx={{ fontWeight: 600, color: '#063455', mb: 2 }}>
                                            Period Preview
                                        </Typography>
                                        <Grid container spacing={2}>
                                            <Grid item xs={12} sm={4}>
                                                <Typography variant="body2" color="textSecondary">
                                                    Period Name:
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                                    {formData.period_name || 'Not set'}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={12} sm={4}>
                                                <Typography variant="body2" color="textSecondary">
                                                    Duration:
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                                    {Math.ceil((new Date(formData.end_date) - new Date(formData.start_date)) / (1000 * 60 * 60 * 24))} days
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={12} sm={4}>
                                                <Typography variant="body2" color="textSecondary">
                                                    Status:
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 600, textTransform: 'capitalize' }}>
                                                    {formData.status}
                                                </Typography>
                                            </Grid>
                                        </Grid>
                                    </Paper>
                                </Grid>
                            )}

                            {/* Action Buttons */}
                            <Grid item xs={12}>
                                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
                                    <Button
                                        variant="outlined"
                                        onClick={() => router.visit(route('employees.payroll.periods'))}
                                        disabled={loading}
                                        sx={{
                                            borderColor: '#063455',
                                            color: '#063455',
                                            borderRadius: '16px',
                                            textTransform: 'capitalize',
                                            '&:hover': { borderColor: '#052d45', backgroundColor: 'rgba(6, 52, 85, 0.04)' },
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        startIcon={<SaveIcon />}
                                        disabled={loading}
                                        sx={{
                                            backgroundColor: '#063455',
                                            borderRadius: '16px',
                                            textTransform: 'capitalize',
                                            '&:hover': { backgroundColor: '#052d45' },
                                            minWidth: 120,
                                        }}
                                    >
                                        {loading ? 'Creating...' : 'Create Period'}
                                    </Button>
                                </Box>
                            </Grid>
                        </Grid>
                    </form>
                </Card>

                {/* Snackbar */}
                <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}>
                    <Alert onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))} severity={snackbar.severity} sx={{ width: '100%' }}>
                        {snackbar.message}
                    </Alert>
                </Snackbar>
            </div>
        </AdminLayout>
    );
};

export default CreatePeriod;
