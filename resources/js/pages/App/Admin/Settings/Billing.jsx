import React from 'react';
import { useForm } from '@inertiajs/react';
import { Alert, Box, Button, Grid, MenuItem, TextField } from '@mui/material';
import { enqueueSnackbar } from 'notistack';
import AppPage from '@/components/App/ui/AppPage';
import SurfaceCard from '@/components/App/ui/SurfaceCard';

export default function Billing({ settings, tax }) {
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

        const numericValue = value === '' ? '' : parseFloat(value);

        if (name.startsWith('penalty_')) {
            const quarter = name.split('_')[1];
            setData('penalty_quarter_pct', {
                ...data.penalty_quarter_pct,
                [quarter]: numericValue === '' ? 0 : numericValue,
            });
            return;
        }

        if (name.startsWith('reinstatement_')) {
            const quarter = name.split('_')[1];
            setData('reinstatement_fees', {
                ...data.reinstatement_fees,
                [quarter]: numericValue === '' ? 0 : numericValue,
            });
            return;
        }

        setData(name, numericValue === '' ? 0 : numericValue);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        post(route('admin.billing-settings.update'), {
            onSuccess: () => enqueueSnackbar('Billing settings updated successfully.', { variant: 'success' }),
            onError: () => enqueueSnackbar('Something went wrong. Please check your input.', { variant: 'error' }),
        });
    };

    return (
        <AppPage
            eyebrow="Settings"
            title="Billing"
            subtitle="Manage financial defaults, service charges, penalties, and reinstatement policies from one standardized settings surface."
            actions={[
                <Button key="save" variant="contained" type="submit" form="billing-settings-form" disabled={processing}>
                    {processing ? 'Saving...' : 'Save Settings'}
                </Button>,
            ]}
        >
            <Box component="form" id="billing-settings-form" onSubmit={handleSubmit}>
                <Grid container spacing={2.25}>
                    <Grid item xs={12}>
                        <SurfaceCard
                            title="General Financial Settings"
                            subtitle="Configure the default tax, service charge, overdue charge, and bank charge behavior used across the system."
                        >
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={4}>
                                    <TextField
                                        label="Tax Rate (%)"
                                        name="tax"
                                        type="number"
                                        fullWidth
                                        value={data.tax}
                                        onChange={(e) => setData('tax', e.target.value)}
                                        error={!!errors.tax}
                                        helperText={errors.tax}
                                        inputProps={{ step: '0.01', min: 0, max: 100 }}
                                    />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <TextField
                                        label="Service Charges (%)"
                                        name="service_charges_percentage"
                                        type="number"
                                        fullWidth
                                        value={data.service_charges_percentage}
                                        onChange={(e) => setData('service_charges_percentage', e.target.value)}
                                        error={!!errors.service_charges_percentage}
                                        helperText={errors.service_charges_percentage}
                                        inputProps={{ step: '0.01', min: 0, max: 100 }}
                                    />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <TextField
                                        label="Overdue Charge (%)"
                                        name="overdue_charge_pct"
                                        type="number"
                                        fullWidth
                                        value={data.overdue_charge_pct}
                                        onChange={(e) => setData('overdue_charge_pct', e.target.value)}
                                        error={!!errors.overdue_charge_pct}
                                        helperText={errors.overdue_charge_pct}
                                        inputProps={{ step: '0.01', min: 0 }}
                                    />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <TextField
                                        select
                                        label="Bank Charges Type"
                                        name="bank_charges_type"
                                        fullWidth
                                        value={data.bank_charges_type}
                                        onChange={handleChange}
                                    >
                                        <MenuItem value="percentage">Percentage (%)</MenuItem>
                                        <MenuItem value="fixed">Fixed Amount</MenuItem>
                                    </TextField>
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <TextField
                                        label={data.bank_charges_type === 'percentage' ? 'Bank Charges (%)' : 'Bank Charges Amount'}
                                        name="bank_charges_value"
                                        type="number"
                                        fullWidth
                                        value={data.bank_charges_value}
                                        onChange={(e) => setData('bank_charges_value', e.target.value)}
                                        error={!!errors.bank_charges_value}
                                        helperText={errors.bank_charges_value}
                                        inputProps={{ step: '0.01', min: 0 }}
                                    />
                                </Grid>
                            </Grid>
                        </SurfaceCard>
                    </Grid>

                    <Grid item xs={12} lg={6}>
                        <SurfaceCard
                            title="Quarterly Penalties"
                            subtitle="Apply one-time penalty percentages by quarter with a consistent grouped layout."
                        >
                            <Grid container spacing={2}>
                                {['Q1', 'Q2', 'Q3', 'Q4'].map((quarter) => (
                                    <Grid item xs={12} sm={6} key={`penalty-${quarter}`}>
                                        <TextField
                                            label={`Penalty ${quarter} (%)`}
                                            name={`penalty_${quarter}`}
                                            type="number"
                                            fullWidth
                                            value={data.penalty_quarter_pct[quarter] || ''}
                                            onChange={handleChange}
                                            error={!!errors[`penalty_quarter_pct.${quarter}`]}
                                            helperText={errors[`penalty_quarter_pct.${quarter}`]}
                                        />
                                    </Grid>
                                ))}
                            </Grid>
                        </SurfaceCard>
                    </Grid>

                    <Grid item xs={12} lg={6}>
                        <SurfaceCard
                            title="Reinstatement Fees"
                            subtitle="Define reinstatement charges per quarter in PKR using the same settings-card pattern."
                        >
                            <Grid container spacing={2}>
                                {['Q1', 'Q2', 'Q3', 'Q4'].map((quarter) => (
                                    <Grid item xs={12} sm={6} key={`reinstatement-${quarter}`}>
                                        <TextField
                                            label={`Reinstatement ${quarter} (PKR)`}
                                            name={`reinstatement_${quarter}`}
                                            type="number"
                                            fullWidth
                                            value={data.reinstatement_fees[quarter] || ''}
                                            onChange={handleChange}
                                            error={!!errors[`reinstatement_fees.${quarter}`]}
                                            helperText={errors[`reinstatement_fees.${quarter}`]}
                                        />
                                    </Grid>
                                ))}
                            </Grid>
                        </SurfaceCard>
                    </Grid>

                    {Object.keys(errors).length > 0 ? (
                        <Grid item xs={12}>
                            <Alert severity="error">
                                Please review the highlighted settings fields before saving.
                            </Alert>
                        </Grid>
                    ) : null}
                </Grid>
            </Box>
        </AppPage>
    );
}
