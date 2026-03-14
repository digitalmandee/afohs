import React, { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { Box, Typography, TextField, Grid, Paper, Button, Alert, MenuItem } from '@mui/material';
import { enqueueSnackbar } from 'notistack';

export default function Billing({ settings, tax }) {
    // const [open, setOpen] = useState(true);

    const { data, setData, post, processing, errors } = useForm({
        tax: tax ?? 12,
        service_charges_percentage: settings.service_charges_percentage ?? 0,
        bank_charges_type: settings.bank_charges_type ?? 'percentage',
        bank_charges_value: settings.bank_charges_value ?? 0,
        overdue_charge_pct: settings.overdue_charge_pct ?? 0,
        penalty_quarter_pct: {
            Q1: settings.penalty_quarter_pct?.Q1 ?? 0,
            Q2: settings.penalty_quarter_pct?.Q2 ?? 0,
            Q3: settings.penalty_quarter_pct?.Q3 ?? 0,
            Q4: settings.penalty_quarter_pct?.Q4 ?? 0,
        },
        reinstatement_fees: {
            Q1: settings.reinstatement_fees?.Q1 ?? 0,
            Q2: settings.reinstatement_fees?.Q2 ?? 0,
            Q3: settings.reinstatement_fees?.Q3 ?? 0,
            Q4: settings.reinstatement_fees?.Q4 ?? 0,
        },
    });

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === 'bank_charges_type') {
            setData(name, value);
            return;
        }

        const numericValue = value === '' ? '' : parseFloat(value); // Keep empty string for input UX

        if (name.startsWith('penalty_')) {
            const q = name.split('_')[1];
            setData('penalty_quarter_pct', {
                ...data.penalty_quarter_pct,
                [q]: numericValue === '' ? 0 : numericValue,
            });
        } else if (name.startsWith('reinstatement_')) {
            const q = name.split('_')[1];
            setData('reinstatement_fees', {
                ...data.reinstatement_fees,
                [q]: numericValue === '' ? 0 : numericValue,
            });
        } else {
            setData(name, numericValue === '' ? 0 : numericValue);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        post(route('admin.billing-settings.update'), {
            onSuccess: () => {
                enqueueSnackbar('Billing settings updated successfully.', { variant: 'success' });
            },
            onError: () => {
                enqueueSnackbar('Something went wrong. Please check your input.', { variant: 'error' });
            },
        });
    };

    return (
        <>
            {/* <SideNav open={open} setOpen={setOpen} /> */}
            <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
                <Typography sx={{ fontWeight: 700, color: '#063455', ml: 4, pt: 3, fontSize: '30px' }}>Billing & Financial Settings</Typography>
                <Paper sx={{ p: 2, maxWidth: '800px', mx: 'auto', mt: 5 }}>
                    <form onSubmit={handleSubmit}>
                        <Grid container spacing={3}>
                            {/* General Finance Settings */}
                            <Grid item xs={12}>
                                <Typography variant="h6" mt={2} mb={2}>
                                    General Financial Settings
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} md={6}>
                                        <TextField label="Tax Rate (%)" name="tax" type="number" fullWidth value={data.tax} onChange={(e) => setData('tax', e.target.value)} onWheel={(e) => e.target.blur()} error={!!errors.tax} helperText={errors.tax} inputProps={{ step: '0.01', min: 0, max: 100 }} />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <TextField label="Service Charges (%)" name="service_charges_percentage" type="number" fullWidth value={data.service_charges_percentage} onChange={(e) => setData('service_charges_percentage', e.target.value)} onWheel={(e) => e.target.blur()} error={!!errors.service_charges_percentage} helperText={errors.service_charges_percentage} inputProps={{ step: '0.01', min: 0, max: 100 }} />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <Grid container spacing={2}>
                                            <Grid item xs={6}>
                                                <TextField select label="Bank Charges Type" name="bank_charges_type" fullWidth value={data.bank_charges_type} onChange={handleChange}>
                                                    <MenuItem value="percentage">Percentage (%)</MenuItem>
                                                    <MenuItem value="fixed">Fixed Amount</MenuItem>
                                                </TextField>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <TextField label={data.bank_charges_type === 'percentage' ? 'Percentage (%)' : 'Amount'} name="bank_charges_value" type="number" fullWidth value={data.bank_charges_value} onChange={(e) => setData('bank_charges_value', e.target.value)} onWheel={(e) => e.target.blur()} error={!!errors.bank_charges_value} helperText={errors.bank_charges_value} inputProps={{ step: '0.01', min: 0 }} />
                                            </Grid>
                                        </Grid>
                                    </Grid>
                                </Grid>
                            </Grid>

                            {/* Penalty Per Quarter */}
                            <Grid item xs={12}>
                                <Typography variant="h6" mt={4}>
                                    One-time Penalty per Quarter (%)
                                </Typography>
                                <Grid container spacing={2} mt={1}>
                                    {['Q1', 'Q2', 'Q3', 'Q4'].map((q) => (
                                        <Grid item xs={6} md={3} key={`penalty-${q}`}>
                                            <TextField label={`Penalty ${q}`} name={`penalty_${q}`} type="number" fullWidth value={data.penalty_quarter_pct[q] || ''} onChange={handleChange} onWheel={(e) => e.target.blur()} error={!!errors[`penalty_quarter_pct.${q}`]} helperText={errors[`penalty_quarter_pct.${q}`]} />
                                        </Grid>
                                    ))}
                                </Grid>
                            </Grid>

                            {/* Reinstatement Fees Per Quarter */}
                            <Grid item xs={12}>
                                <Typography variant="h6" mt={4}>
                                    Reinstatement Fees (PKR)
                                </Typography>
                                <Grid container spacing={2} mt={1}>
                                    {['Q1', 'Q2', 'Q3', 'Q4'].map((q) => (
                                        <Grid item xs={6} md={3} key={`reinstatement-${q}`}>
                                            <TextField label={`Reinstatement ${q}`} name={`reinstatement_${q}`} type="number" fullWidth value={data.reinstatement_fees[q] || ''} onChange={handleChange} onWheel={(e) => e.target.blur()} error={!!errors[`reinstatement_fees.${q}`]} helperText={errors[`reinstatement_fees.${q}`]} />
                                        </Grid>
                                    ))}
                                </Grid>
                            </Grid>

                            <Grid item xs={12} mt={4}>
                                <Box mt={2} display="flex" justifyContent="flex-end">
                                    <Button variant="contained" color="primary" type="submit" disabled={processing} sx={{ textTransform: 'none', borderRadius: '16px' }}>
                                        Save Settings
                                    </Button>
                                </Box>
                            </Grid>
                        </Grid>
                    </form>
                </Paper>
            </div>
        </>
    );
}
