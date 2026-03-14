import { useState } from 'react';
import { router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import AdminLayout from '@/layouts/AdminLayout';
import { Box, Card, Typography, Button, TextField, FormControl, InputLabel, Select, MenuItem, Grid, IconButton, Slider } from '@mui/material';
import { ArrowBack as ArrowBackIcon, Save as SaveIcon, Calculate as CalculateIcon } from '@mui/icons-material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';

const formatCurrency = (amount) => `Rs ${parseFloat(amount || 0).toLocaleString()}`;

const Edit = ({ loan, employees = [] }) => {
    const [formData, setFormData] = useState({
        employee_id: loan.employee_id || '',
        amount: loan.amount || '',
        loan_date: loan.loan_date ? loan.loan_date.split('T')[0] : '',
        reason: loan.reason || '',
        installments: loan.installments || 12,
        notes: loan.notes || '',
    });
    const [errors, setErrors] = useState({});

    const handleChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        setErrors((prev) => ({ ...prev, [field]: null }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        router.put(route('employees.loans.update', loan.id), formData, {
            onError: (errors) => setErrors(errors),
        });
    };

    const monthlyDeduction = formData.amount && formData.installments ? Math.round(parseFloat(formData.amount) / parseInt(formData.installments)) : 0;

    return (
        <AdminLayout>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
                <Box sx={{ bgcolor: '#f5f5f5', minHeight: '100vh', p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        <IconButton onClick={() => router.visit(route('employees.loans.index'))}>
                            <ArrowBackIcon sx={{ color: '#063455' }} />
                        </IconButton>
                        <Typography variant="h5" sx={{ color: '#063455', fontWeight: 700, ml: 1 }}>
                            Edit Loan Application
                        </Typography>
                    </Box>

                    <Grid container spacing={3}>
                        <Grid item xs={12} md={8}>
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
                                            <DatePicker
                                                label="Loan Date *"
                                                value={formData.loan_date ? dayjs(formData.loan_date) : null}
                                                onChange={(newValue) => handleChange('loan_date', newValue ? newValue.format('YYYY-MM-DD') : '')}
                                                slotProps={{
                                                    textField: {
                                                        fullWidth: true,
                                                        // error: !!errors.loan_date, // Original file didn't have error prop on this field, but good to have. Keeping simple for now.
                                                        InputLabelProps: { shrink: true },
                                                    },
                                                    actionBar: { actions: ['clear', 'today', 'cancel', 'accept'] },
                                                }}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <TextField fullWidth type="number" label="Loan Amount *" value={formData.amount} onChange={(e) => handleChange('amount', e.target.value)} error={!!errors.amount} helperText={errors.amount} />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <TextField fullWidth label="Reason" value={formData.reason} onChange={(e) => handleChange('reason', e.target.value)} />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Typography gutterBottom>Number of Installments: {formData.installments} months</Typography>
                                            <Slider value={formData.installments} onChange={(e, val) => handleChange('installments', val)} min={1} max={60} step={1} valueLabelDisplay="auto" sx={{ color: '#063455' }} />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <TextField fullWidth multiline rows={3} label="Notes" value={formData.notes} onChange={(e) => handleChange('notes', e.target.value)} />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Box sx={{ display: 'flex', gap: 2 }}>
                                                <Button type="submit" variant="contained" startIcon={<SaveIcon />} sx={{ backgroundColor: '#063455' }}>
                                                    Update
                                                </Button>
                                                <Button variant="outlined" onClick={() => router.visit(route('employees.loans.index'))} sx={{ borderColor: '#063455', color: '#063455' }}>
                                                    Cancel
                                                </Button>
                                            </Box>
                                        </Grid>
                                    </Grid>
                                </form>
                            </Card>
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <Card sx={{ borderRadius: '12px', p: 3, backgroundColor: '#063455', color: '#fff' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <CalculateIcon sx={{ mr: 1 }} />
                                    <Typography variant="h6">Loan Summary</Typography>
                                </Box>
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" sx={{ color: '#ccc' }}>
                                        Loan Amount
                                    </Typography>
                                    <Typography variant="h5">{formatCurrency(formData.amount)}</Typography>
                                </Box>
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" sx={{ color: '#ccc' }}>
                                        Number of Installments
                                    </Typography>
                                    <Typography variant="h5">{formData.installments} months</Typography>
                                </Box>
                                <Box sx={{ p: 2, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 1 }}>
                                    <Typography variant="body2" sx={{ color: '#ccc' }}>
                                        Monthly Deduction
                                    </Typography>
                                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                                        {formatCurrency(monthlyDeduction)}
                                    </Typography>
                                </Box>
                            </Card>
                        </Grid>
                    </Grid>
                </Box>
            </LocalizationProvider>
        </AdminLayout>
    );
};

export default Edit;
