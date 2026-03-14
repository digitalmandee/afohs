import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import axios from 'axios';
import AdminLayout from '@/layouts/AdminLayout';
import { Box, Card, CardContent, Typography, Button, TextField, FormControl, InputLabel, Select, MenuItem, Grid, IconButton, Alert, Autocomplete } from '@mui/material';
import { ArrowBack as ArrowBackIcon, Save as SaveIcon } from '@mui/icons-material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';

const formatCurrency = (amount) => `Rs ${parseFloat(amount || 0).toLocaleString()}`;

const Create = ({ employees = [] }) => {
    const [formData, setFormData] = useState({
        employee_id: '',
        amount: '',
        advance_date: dayjs().format('YYYY-MM-DD'),
        reason: '',
        deduction_months: 1,
        deduction_start_date: '',
        notes: '',
    });
    const [errors, setErrors] = useState({});
    const [employeeSalary, setEmployeeSalary] = useState(0);

    const fetchEmployeeSalary = async (empId) => {
        if (!empId) {
            setEmployeeSalary(0);
            return;
        }
        try {
            const response = await axios.get(route('employees.advances.salary', empId));
            if (response.data.success) {
                setEmployeeSalary(response.data.salary);
            }
        } catch (error) {
            console.error('Error fetching salary:', error);
        }
    };

    useEffect(() => {
        fetchEmployeeSalary(formData.employee_id);
    }, [formData.employee_id]);

    const handleChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        setErrors((prev) => ({ ...prev, [field]: null }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        router.post(route('employees.advances.store'), formData, {
            onError: (errors) => setErrors(errors),
        });
    };

    const monthlyDeduction = formData.amount && formData.deduction_months ? Math.round(parseFloat(formData.amount) / parseInt(formData.deduction_months)) : 0;

    return (
        <AdminLayout>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
                <Box sx={{ bgcolor: '#f5f5f5', minHeight: '100vh', p: 3 }}>
                    {/* Header */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        <IconButton onClick={() => router.visit(route('employees.advances.index'))}>
                            <ArrowBackIcon sx={{ color: '#063455' }} />
                        </IconButton>
                        <Typography sx={{ color: '#063455', fontWeight: 700, fontSize: '30px' }}>New Advance Request</Typography>
                    </Box>

                    <Card sx={{ borderRadius: '12px', p: 3 }}>
                        <form onSubmit={handleSubmit}>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <Autocomplete
                                        options={employees}
                                        getOptionLabel={(option) => `${option.name} (${option.employee_id || option.id})`}
                                        value={employees.find((e) => e.id === formData.employee_id) || null}
                                        onChange={(event, newValue) => {
                                            handleChange('employee_id', newValue ? newValue.id : '');
                                        }}
                                        renderInput={(params) => <TextField {...params} label="Employee *" error={!!errors.employee_id} helperText={errors.employee_id} />}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={3}>
                                    <TextField fullWidth type="number" label="Advance Amount *" value={formData.amount} onChange={(e) => handleChange('amount', e.target.value)} error={!!errors.amount || (employeeSalary > 0 && parseFloat(formData.amount) > employeeSalary)} helperText={errors.amount || (employeeSalary > 0 ? (parseFloat(formData.amount) > employeeSalary ? `Error: Exceeds salary (${formatCurrency(employeeSalary)})` : `Max allowed: ${formatCurrency(employeeSalary)}`) : '')} InputProps={{ inputProps: { min: 1 } }} />
                                </Grid>
                                <Grid item xs={12} sm={3}>
                                    <DatePicker
                                        label="Advance Date *"
                                        value={formData.advance_date ? dayjs(formData.advance_date) : null}
                                        onChange={(newValue) => handleChange('advance_date', newValue ? newValue.format('YYYY-MM-DD') : '')}
                                        format="DD/MM/YYYY"
                                        slotProps={{
                                            textField: { fullWidth: true, error: !!errors.advance_date, helperText: errors.advance_date, InputLabelProps: { shrink: true } },
                                            actionBar: { actions: ['clear', 'today', 'cancel', 'accept'] },
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField fullWidth label="Reason" value={formData.reason} onChange={(e) => handleChange('reason', e.target.value)} error={!!errors.reason} helperText={errors.reason} />
                                </Grid>
                                <Grid item xs={12} sm={3}>
                                    <TextField fullWidth type="number" label="Deduction Months *" value={formData.deduction_months} onChange={(e) => handleChange('deduction_months', e.target.value)} error={!!errors.deduction_months} helperText={errors.deduction_months || 'Number of months to deduct'} InputProps={{ inputProps: { min: 1, max: 24 } }} />
                                </Grid>
                                <Grid item xs={12} sm={3}>
                                    <DatePicker
                                        label="Deduction Start Date"
                                        value={formData.deduction_start_date ? dayjs(formData.deduction_start_date) : null}
                                        onChange={(newValue) => handleChange('deduction_start_date', newValue ? newValue.format('YYYY-MM-DD') : '')}
                                        format="DD/MM/YYYY"
                                        slotProps={{
                                            textField: { fullWidth: true, helperText: 'Leave empty for next payroll', InputLabelProps: { shrink: true } },
                                            actionBar: { actions: ['clear', 'today', 'cancel', 'accept'] },
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <Card sx={{ py: 1, backgroundColor: '#063455', textAlign: 'center' }}>
                                        <Typography sx={{ color: '#fff', fontSize: '18px', fontWeight: '600' }}>Monthly Deduction</Typography>
                                        <Typography sx={{ color: '#fff', fontSize: '18px', fontWeight: '600' }}>Rs {monthlyDeduction}</Typography>
                                    </Card>
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField fullWidth multiline rows={3} label="Notes" value={formData.notes} onChange={(e) => handleChange('notes', e.target.value)} />
                                </Grid>
                                <Grid item xs={12}>
                                    <Box sx={{ display: 'flex', gap: 2 }}>
                                        <Button type="submit" variant="contained" startIcon={<SaveIcon />} sx={{ backgroundColor: '#063455', textTransform: 'capitalize', borderRadius: '16px' }}>
                                            Submit Request
                                        </Button>
                                        <Button variant="outlined" onClick={() => router.visit(route('employees.advances.index'))} sx={{ borderColor: '#063455', color: '#063455', textTransform: 'capitalize', borderRadius: '16px' }}>
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

export default Create;
