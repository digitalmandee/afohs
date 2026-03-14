import { useState } from 'react';
import { router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import AdminLayout from '@/layouts/AdminLayout';
import { Box, Card, Typography, Button, TextField, FormControl, InputLabel, Select, MenuItem, Grid, IconButton } from '@mui/material';
import { ArrowBack as ArrowBackIcon, Save as SaveIcon } from '@mui/icons-material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';

const Edit = ({ advance, employees = [] }) => {
    const [formData, setFormData] = useState({
        employee_id: advance.employee_id || '',
        amount: advance.amount || '',
        advance_date: advance.advance_date || '', // Fixed backend date format
        reason: advance.reason || '',
        deduction_months: advance.deduction_months || 1,
        deduction_start_date: advance.deduction_start_date || '', // Fixed backend date format
        notes: advance.notes || '',
    });
    const [errors, setErrors] = useState({});

    const handleChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        setErrors((prev) => ({ ...prev, [field]: null }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        router.put(route('employees.advances.update', advance.id), formData, {
            onError: (errors) => setErrors(errors),
        });
    };

    const monthlyDeduction = formData.amount && formData.deduction_months ? Math.round(parseFloat(formData.amount) / parseInt(formData.deduction_months)) : 0;

    return (
        <AdminLayout>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
                <Box sx={{ bgcolor: '#f5f5f5', minHeight: '100vh', p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        <IconButton onClick={() => router.visit(route('employees.advances.index'))}>
                            <ArrowBackIcon sx={{ color: '#063455' }} />
                        </IconButton>
                        <Typography variant="h5" sx={{ color: '#063455', fontWeight: 700, ml: 1 }}>
                            Edit Advance Request
                        </Typography>
                    </Box>

                    <Card sx={{ borderRadius: '12px', p: 3 }}>
                        <form onSubmit={handleSubmit}>
                            <Grid container spacing={3}>
                                <Grid item xs={12} sm={6}>
                                    <FormControl fullWidth error={!!errors.employee_id}>
                                        <InputLabel>Employee *</InputLabel>
                                        <Select value={formData.employee_id} label="Employee *" onChange={(e) => handleChange('employee_id', e.target.value)}>
                                            {employees.map((emp) => (
                                                <MenuItem key={emp.id} value={emp.id}>
                                                    {emp.name}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField fullWidth type="number" label="Advance Amount *" value={formData.amount} onChange={(e) => handleChange('amount', e.target.value)} error={!!errors.amount} helperText={errors.amount} />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <DatePicker
                                        label="Advance Date *"
                                        value={formData.advance_date ? dayjs(formData.advance_date) : null}
                                        onChange={(newValue) => handleChange('advance_date', newValue ? newValue.format('YYYY-MM-DD') : '')}
                                        format="DD/MM/YYYY"
                                        slotProps={{
                                            textField: { fullWidth: true, InputLabelProps: { shrink: true } },
                                            actionBar: { actions: ['clear', 'today', 'cancel', 'accept'] },
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField fullWidth label="Reason" value={formData.reason} onChange={(e) => handleChange('reason', e.target.value)} />
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <TextField fullWidth type="number" label="Deduction Months" value={formData.deduction_months} onChange={(e) => handleChange('deduction_months', e.target.value)} InputProps={{ inputProps: { min: 1, max: 24 } }} />
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <DatePicker
                                        label="Deduction Start Date"
                                        value={formData.deduction_start_date ? dayjs(formData.deduction_start_date) : null}
                                        onChange={(newValue) => handleChange('deduction_start_date', newValue ? newValue.format('YYYY-MM-DD') : '')}
                                        format="DD/MM/YYYY"
                                        slotProps={{
                                            textField: { fullWidth: true, InputLabelProps: { shrink: true } },
                                            actionBar: { actions: ['clear', 'today', 'cancel', 'accept'] },
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <Card sx={{ p: 2, backgroundColor: '#e3f2fd', textAlign: 'center' }}>
                                        <Typography variant="body2" color="textSecondary">
                                            Monthly Deduction
                                        </Typography>
                                        <Typography variant="h6" sx={{ fontWeight: 600, color: '#1976d2' }}>
                                            Rs {monthlyDeduction}
                                        </Typography>
                                    </Card>
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField fullWidth multiline rows={3} label="Notes" value={formData.notes} onChange={(e) => handleChange('notes', e.target.value)} />
                                </Grid>
                                <Grid item xs={12}>
                                    <Box sx={{ display: 'flex', gap: 2 }}>
                                        <Button type="submit" variant="contained" startIcon={<SaveIcon />} sx={{ backgroundColor: '#063455' }}>
                                            Update
                                        </Button>
                                        <Button variant="outlined" onClick={() => router.visit(route('employees.advances.index'))} sx={{ borderColor: '#063455', color: '#063455' }}>
                                            Cancel
                                        </Button>
                                    </Box>
                                </Grid>
                            </Grid>
                        </form>
                    </Card>
                </Box>
            </LocalizationProvider>
        </AdminLayout>
    );
};

export default Edit;
