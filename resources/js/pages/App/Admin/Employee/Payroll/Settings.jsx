import { useState, useEffect } from 'react';
import AdminLayout from '@/layouts/AdminLayout';
import AppPage from '@/components/App/ui/AppPage';
import SurfaceCard from '@/components/App/ui/SurfaceCard';
import AdminDataTable from '@/components/App/ui/AdminDataTable';
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Grid,
    IconButton,
    InputAdornment,
    MenuItem,
    Select,
    Snackbar,
    TableCell,
    TableRow,
    TextField,
    Typography,
} from '@mui/material';
import { Save as SaveIcon, ArrowBack as ArrowBackIcon, Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import axios from 'axios';

const PayrollSettings = () => {
    const [settings, setSettings] = useState({
        company_name: 'Afohs Club',
        pay_frequency: 'monthly',
        currency: 'PKR',
        working_days_per_month: 26,
        working_hours_per_day: 8.0,
        overtime_rate_multiplier: 1.5,
        late_deduction_per_minute: 5.0,
        absent_deduction_type: 'full_day',
        absent_deduction_amount: 0.0,
        max_allowed_absents: 3,
        grace_period_minutes: 15,
        tax_slabs: [],
    });

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/payroll/settings');
            if (response.data.success && response.data.settings) {
                setSettings(response.data.settings);
            }
        } catch (error) {
            showSnackbar('Error loading settings', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const response = await axios.post('/api/payroll/settings', settings);
            if (response.data.success) {
                showSnackbar('Settings saved successfully!', 'success');
                setSettings(response.data.settings);
            } else {
                showSnackbar('Failed to save settings', 'error');
            }
        } catch (error) {
            if (error.response?.data?.errors) {
                const errorMessages = Object.values(error.response.data.errors).flat().join(', ');
                showSnackbar(`Validation errors: ${errorMessages}`, 'error');
            } else {
                showSnackbar('Error saving settings', 'error');
            }
        } finally {
            setSaving(false);
        }
    };

    const showSnackbar = (message, severity = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    const handleCloseSnackbar = () => {
        setSnackbar((prev) => ({ ...prev, open: false }));
    };

    const handleInputChange = (field, value) => {
        setSettings((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleAddSlab = () => {
        setSettings((prev) => ({
            ...prev,
            tax_slabs: [
                ...(prev.tax_slabs || []),
                {
                    name: '',
                    frequency: 'monthly',
                    min_salary: 0,
                    max_salary: '',
                    tax_rate: 0,
                    fixed_amount: 0,
                },
            ],
        }));
    };

    const handleRemoveSlab = (index) => {
        setSettings((prev) => ({
            ...prev,
            tax_slabs: prev.tax_slabs.filter((_, i) => i !== index),
        }));
    };

    const handleSlabChange = (index, field, value) => {
        setSettings((prev) => {
            const newSlabs = [...(prev.tax_slabs || [])];
            newSlabs[index] = { ...newSlabs[index], [field]: value };
            return { ...prev, tax_slabs: newSlabs };
        });
    };

    const slabColumns = [
        { key: 'name', label: 'Name', minWidth: 180 },
        { key: 'frequency', label: 'Frequency', minWidth: 140 },
        { key: 'min_salary', label: 'Min Salary', minWidth: 140 },
        { key: 'max_salary', label: 'Max Salary', minWidth: 140 },
        { key: 'tax_rate', label: 'Tax Rate (%)', minWidth: 140 },
        { key: 'fixed_amount', label: 'Fixed Amount', minWidth: 150 },
        { key: 'actions', label: 'Actions', minWidth: 90 },
    ];

    if (loading) {
        return (
            <AdminLayout>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                    <CircularProgress size={60} sx={{ color: '#063455' }} />
                </Box>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <Box sx={{ p: { xs: 2, md: 3 } }}>
                <AppPage
                    eyebrow="Payroll"
                    title="Payroll Settings"
                    subtitle="Standardize payroll defaults, attendance deductions, and tax configuration inside the same premium settings framework as the rest of admin."
                    actions={[
                        <Button key="back" variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => window.history.back()}>
                            Back
                        </Button>,
                        <Button key="save" variant="contained" startIcon={<SaveIcon />} onClick={handleSave} disabled={saving}>
                            {saving ? 'Saving...' : 'Save Settings'}
                        </Button>,
                    ]}
                >
                    <Grid container spacing={2.25}>
                        <Grid item xs={12} lg={6}>
                            <SurfaceCard title="Company Information" subtitle="Core payroll identity and frequency defaults.">
                                <Grid container spacing={2}>
                                    <Grid item xs={12}>
                                        <TextField fullWidth label="Company Name" value={settings.company_name} onChange={(e) => handleInputChange('company_name', e.target.value)} />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            select
                                            fullWidth
                                            label="Pay Frequency"
                                            value={settings.pay_frequency}
                                            onChange={(e) => handleInputChange('pay_frequency', e.target.value)}
                                        >
                                            <MenuItem value="monthly">Monthly</MenuItem>
                                            <MenuItem value="bi-weekly">Bi-Weekly</MenuItem>
                                            <MenuItem value="weekly">Weekly</MenuItem>
                                        </TextField>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField fullWidth label="Currency" value={settings.currency} disabled helperText="Currency is fixed to PKR" />
                                    </Grid>
                                </Grid>
                            </SurfaceCard>
                        </Grid>

                        <Grid item xs={12} lg={6}>
                            <SurfaceCard title="Working Hours Configuration" subtitle="Baseline working-day and overtime rules for payroll calculations.">
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <TextField fullWidth label="Working Days per Month" type="number" value={settings.working_days_per_month} onChange={(e) => handleInputChange('working_days_per_month', parseInt(e.target.value, 10))} inputProps={{ min: 20, max: 31 }} />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField fullWidth label="Working Hours per Day" type="number" value={settings.working_hours_per_day} onChange={(e) => handleInputChange('working_hours_per_day', parseFloat(e.target.value))} inputProps={{ min: 6, max: 12, step: 0.5 }} />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField fullWidth label="Overtime Rate Multiplier" type="number" value={settings.overtime_rate_multiplier} onChange={(e) => handleInputChange('overtime_rate_multiplier', parseFloat(e.target.value))} inputProps={{ min: 1, max: 3, step: 0.1 }} helperText="e.g. 1.5 means 150% of regular hourly rate" />
                                    </Grid>
                                </Grid>
                            </SurfaceCard>
                        </Grid>

                        <Grid item xs={12}>
                            <SurfaceCard title="Attendance and Deductions" subtitle="Control grace periods, absence behavior, and deduction rules in one denser settings section.">
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6} md={3}>
                                        <TextField fullWidth label="Grace Period (Minutes)" type="number" value={settings.grace_period_minutes} onChange={(e) => handleInputChange('grace_period_minutes', parseInt(e.target.value, 10))} inputProps={{ min: 0, max: 60 }} />
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={3}>
                                        <TextField
                                            fullWidth
                                            label="Late Deduction per Minute"
                                            type="number"
                                            value={settings.late_deduction_per_minute}
                                            onChange={(e) => handleInputChange('late_deduction_per_minute', parseFloat(e.target.value))}
                                            InputProps={{ startAdornment: <InputAdornment position="start">Rs</InputAdornment> }}
                                            inputProps={{ min: 0, step: 0.01 }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={3}>
                                        <TextField fullWidth label="Max Allowed Absents" type="number" value={settings.max_allowed_absents} onChange={(e) => handleInputChange('max_allowed_absents', parseInt(e.target.value, 10))} inputProps={{ min: 0, max: 10 }} />
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={3}>
                                        <TextField
                                            select
                                            fullWidth
                                            label="Absent Deduction Type"
                                            value={settings.absent_deduction_type}
                                            onChange={(e) => handleInputChange('absent_deduction_type', e.target.value)}
                                        >
                                            <MenuItem value="full_day">Full Day Salary</MenuItem>
                                            <MenuItem value="hourly">Hourly Rate</MenuItem>
                                            <MenuItem value="fixed_amount">Fixed Amount</MenuItem>
                                        </TextField>
                                    </Grid>
                                    {settings.absent_deduction_type === 'fixed_amount' ? (
                                        <Grid item xs={12} md={4}>
                                            <TextField
                                                fullWidth
                                                label="Fixed Absent Deduction Amount"
                                                type="number"
                                                value={settings.absent_deduction_amount}
                                                onChange={(e) => handleInputChange('absent_deduction_amount', parseFloat(e.target.value))}
                                                InputProps={{ startAdornment: <InputAdornment position="start">Rs</InputAdornment> }}
                                                inputProps={{ min: 0, step: 0.01 }}
                                            />
                                        </Grid>
                                    ) : null}
                                </Grid>
                            </SurfaceCard>
                        </Grid>

                        <Grid item xs={12}>
                            <SurfaceCard
                                title="Tax Configuration"
                                subtitle="Define income tax slabs in a shared table shell with inline editing and a clearer add/remove workflow."
                                actions={
                                    <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddSlab}>
                                        Add Slab
                                    </Button>
                                }
                            >
                                <Alert severity="info" sx={{ mb: 2 }}>
                                    Define tax slabs based on salary ranges. Yearly values are automatically converted to monthly equivalents for calculation.
                                </Alert>
                                    <AdminDataTable
                                    columns={slabColumns}
                                    rows={settings.tax_slabs || []}
                                    emptyMessage='No tax slabs defined. Click "Add Slab" to create one.'
                                    tableMinWidth={1100}
                                    renderRow={(slab, index) => (
                                        <TableRow key={`slab-${index}`} hover>
                                            <TableCell><TextField size="small" value={slab.name} onChange={(e) => handleSlabChange(index, 'name', e.target.value)} placeholder="e.g. Tier 1" /></TableCell>
                                            <TableCell>
                                                <Select size="small" value={slab.frequency} onChange={(e) => handleSlabChange(index, 'frequency', e.target.value)} sx={{ minWidth: 110 }}>
                                                    <MenuItem value="monthly">Monthly</MenuItem>
                                                    <MenuItem value="yearly">Yearly</MenuItem>
                                                </Select>
                                            </TableCell>
                                            <TableCell>
                                                <TextField size="small" type="number" value={slab.min_salary} onChange={(e) => handleSlabChange(index, 'min_salary', parseFloat(e.target.value))} />
                                                {slab.frequency === 'yearly' ? (
                                                    <Typography variant="caption" display="block" color="text.secondary">
                                                        Monthly: {(Number(slab.min_salary || 0) / 12).toFixed(0)}
                                                    </Typography>
                                                ) : null}
                                            </TableCell>
                                            <TableCell>
                                                <TextField size="small" type="number" value={slab.max_salary === null ? '' : slab.max_salary} onChange={(e) => handleSlabChange(index, 'max_salary', e.target.value === '' ? null : parseFloat(e.target.value))} placeholder="Above" />
                                                {slab.frequency === 'yearly' && slab.max_salary ? (
                                                    <Typography variant="caption" display="block" color="text.secondary">
                                                        Monthly: {(Number(slab.max_salary || 0) / 12).toFixed(0)}
                                                    </Typography>
                                                ) : null}
                                            </TableCell>
                                            <TableCell><TextField size="small" type="number" value={slab.tax_rate} onChange={(e) => handleSlabChange(index, 'tax_rate', parseFloat(e.target.value))} /></TableCell>
                                            <TableCell><TextField size="small" type="number" value={slab.fixed_amount} onChange={(e) => handleSlabChange(index, 'fixed_amount', parseFloat(e.target.value))} /></TableCell>
                                            <TableCell>
                                                <IconButton size="small" color="error" onClick={() => handleRemoveSlab(index)}>
                                                    <DeleteIcon />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                />
                            </SurfaceCard>
                        </Grid>
                    </Grid>

                    <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                            {snackbar.message}
                        </Alert>
                    </Snackbar>
                </AppPage>
            </Box>
        </AdminLayout>
    );
};

export default PayrollSettings;
