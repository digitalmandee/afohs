import React, { useEffect } from 'react';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import { useForm, usePage } from '@inertiajs/react';
import { Box, TextField, Button, Grid, Typography, MenuItem, Paper, Divider } from '@mui/material';
import { useSnackbar } from 'notistack';

const CreatePartnerAffiliate = ({ partner }) => {
    const { enqueueSnackbar } = useSnackbar();

    const { data, setData, post, processing, errors, transform } = useForm({
        type: partner?.type || '',
        organization_name: partner?.organization_name || '',
        facilitation_details: partner?.facilitation_details || '',
        address: partner?.address || '',
        telephone: partner?.telephone || '',
        mobile_a: partner?.mobile_a || '',
        mobile_b: partner?.mobile_b || '',
        email: partner?.email || '',
        website: partner?.website || '',

        focal_person_name: partner?.focal_person_name || '',
        focal_mobile_a: partner?.focal_mobile_a || '',
        focal_mobile_b: partner?.focal_mobile_b || '',
        focal_telephone: partner?.focal_telephone || '',
        focal_email: partner?.focal_email || '',

        agreement_date: partner?.agreement_date ? partner.agreement_date.split('T')[0] : '',
        agreement_end_date: partner?.agreement_end_date ? partner.agreement_end_date.split('T')[0] : '',
        status: partner?.status || 'Active',
        comments: partner?.comments || '',
        documents: [], // For new file uploads
        _method: partner ? 'put' : 'post', // Spoof method for Laravel
    });

    const handleSubmit = (e) => {
        e.preventDefault();

        const routeName = partner ? route('admin.membership.partners-affiliates.update', partner.id) : route('admin.membership.partners-affiliates.store');

        post(routeName, {
            forceFormData: true, // Required for file uploads with PUT/POST
            onSuccess: () => {
                enqueueSnackbar(`Partner/Affiliate ${partner ? 'updated' : 'created'} successfully`, { variant: 'success' });
            },
            onError: (err) => {
                console.error('Validation Errors:', err);
                enqueueSnackbar('Please check the form for errors.', { variant: 'error' });
            },
        });
    };

    return (
        <div className="container-fluid px-4 pt-4" style={{ backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
            <Box component={Paper} elevation={0} sx={{ p: 4, maxWidth: '1200px', mx: 'auto', backgroundColor: '#fff', borderRadius: 2 }}>
                <Typography variant="h5" sx={{ mb: 3, fontWeight: 600, color: '#063455' }}>
                    {partner ? 'Edit Partner / Affiliate' : 'Add Partner / Affiliate'}
                </Typography>

                <form onSubmit={handleSubmit}>
                    <Grid container spacing={4}>
                        {/* Left Column: Partner Info */}
                        <Grid item xs={12} md={6}>
                            <Typography variant="h6" sx={{ mb: 2, color: '#333' }}>
                                PARTNER / AFFILIATE INFORMATION
                            </Typography>

                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <TextField select fullWidth label="Type" size="small" value={data.type} onChange={(e) => setData('type', e.target.value)} error={!!errors.type} helperText={errors.type} required>
                                        <MenuItem value="Club">Club</MenuItem>
                                        <MenuItem value="Company">Company</MenuItem>
                                        <MenuItem value="Other">Other</MenuItem>
                                    </TextField>
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField fullWidth label="Partner / Affiliate Name" size="small" value={data.organization_name} onChange={(e) => setData('organization_name', e.target.value)} error={!!errors.organization_name} helperText={errors.organization_name} required />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField fullWidth label="Facilitation / Discount" size="small" value={data.facilitation_details} onChange={(e) => setData('facilitation_details', e.target.value)} error={!!errors.facilitation_details} helperText={errors.facilitation_details} />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField fullWidth label="Address" size="small" multiline rows={2} value={data.address} onChange={(e) => setData('address', e.target.value)} error={!!errors.address} helperText={errors.address} required />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField fullWidth label="Telephone" size="small" value={data.telephone} onChange={(e) => setData('telephone', e.target.value.replace(/[^0-9+\-]/g, ''))} error={!!errors.telephone} helperText={errors.telephone} required />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField fullWidth label="Mobile (a)" size="small" value={data.mobile_a} onChange={(e) => setData('mobile_a', e.target.value.replace(/[^0-9+\-]/g, ''))} error={!!errors.mobile_a} helperText={errors.mobile_a} required />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField fullWidth label="Mobile (b)" size="small" value={data.mobile_b} onChange={(e) => setData('mobile_b', e.target.value.replace(/[^0-9+\-]/g, ''))} error={!!errors.mobile_b} helperText={errors.mobile_b} />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField fullWidth label="Email" size="small" value={data.email} onChange={(e) => setData('email', e.target.value)} error={!!errors.email} helperText={errors.email} required />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField fullWidth label="Website" size="small" value={data.website} onChange={(e) => setData('website', e.target.value)} error={!!errors.website} helperText={errors.website} />
                                </Grid>
                            </Grid>
                        </Grid>

                        {/* Right Column: Focal Person Info */}
                        <Grid item xs={12} md={6}>
                            <Typography variant="h6" sx={{ mb: 2, color: '#333' }}>
                                FOCAL PERSON INFORMATION
                            </Typography>

                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <TextField fullWidth label="Focal Person Name" size="small" value={data.focal_person_name} onChange={(e) => setData('focal_person_name', e.target.value)} error={!!errors.focal_person_name} helperText={errors.focal_person_name} required />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField fullWidth label="Mobile (a)" size="small" value={data.focal_mobile_a} onChange={(e) => setData('focal_mobile_a', e.target.value.replace(/[^0-9+\-]/g, ''))} error={!!errors.focal_mobile_a} helperText={errors.focal_mobile_a} required />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField fullWidth label="Mobile (b)" size="small" value={data.focal_mobile_b} onChange={(e) => setData('focal_mobile_b', e.target.value.replace(/[^0-9+\-]/g, ''))} error={!!errors.focal_mobile_b} helperText={errors.focal_mobile_b} />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField fullWidth label="Telephone" size="small" value={data.focal_telephone} onChange={(e) => setData('focal_telephone', e.target.value.replace(/[^0-9+\-]/g, ''))} error={!!errors.focal_telephone} helperText={errors.focal_telephone} />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField fullWidth label="Email" size="small" value={data.focal_email} onChange={(e) => setData('focal_email', e.target.value)} error={!!errors.focal_email} helperText={errors.focal_email} required />
                                </Grid>

                                <Grid item xs={12} sx={{ mt: 2 }}>
                                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                        Agreement / Documents
                                    </Typography>
                                    <Button variant="outlined" component="label" fullWidth sx={{ justifyContent: 'flex-start', textTransform: 'none', color: '#666', borderColor: '#ccc' }}>
                                        Choose Files
                                        <input type="file" hidden multiple onChange={(e) => setData('documents', Array.from(e.target.files))} />
                                    </Button>
                                    {errors.documents && (
                                        <Typography variant="caption" color="error" display="block" sx={{ mt: 1 }}>
                                            {errors.documents}
                                        </Typography>
                                    )}
                                    {Object.keys(errors)
                                        .filter((key) => key.startsWith('documents.'))
                                        .map((key) => (
                                            <Typography key={key} variant="caption" color="error" display="block" sx={{ mt: 1 }}>
                                                {errors[key]}
                                            </Typography>
                                        ))}
                                    {data.documents.length > 0 && (
                                        <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                                            {data.documents.length} files selected
                                        </Typography>
                                    )}
                                    {/* Show existing documents if any */}
                                    {partner?.media && (
                                        <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                            {partner.media.map((file, idx) => (
                                                <a key={idx} href={`/storage/${file.file_path}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', textDecoration: 'none', color: '#0C67AA' }}>
                                                    📄 {file.file_name}
                                                </a>
                                            ))}
                                        </Box>
                                    )}
                                </Grid>

                                <Grid item xs={12}>
                                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                                        <DatePicker
                                            label="Agreement Date"
                                            format="DD-MM-YYYY"
                                            value={data.agreement_date ? dayjs(data.agreement_date) : null}
                                            onChange={(newValue) => setData('agreement_date', newValue ? newValue.format('YYYY-MM-DD') : '')}
                                            slotProps={{
                                                textField: { fullWidth: true, size: 'small', error: !!errors.agreement_date, helperText: errors.agreement_date, required: true, onClick: (e) => e.target.closest('.MuiFormControl-root').querySelector('button')?.click() },
                                                actionBar: { actions: ['clear', 'today', 'cancel', 'accept'] },
                                            }}
                                        />
                                    </LocalizationProvider>
                                </Grid>
                                <Grid item xs={12}>
                                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                                        <DatePicker
                                            label="Agreement End Date"
                                            format="DD-MM-YYYY"
                                            value={data.agreement_end_date ? dayjs(data.agreement_end_date) : null}
                                            onChange={(newValue) => setData('agreement_end_date', newValue ? newValue.format('YYYY-MM-DD') : '')}
                                            slotProps={{
                                                textField: { fullWidth: true, size: 'small', error: !!errors.agreement_end_date, helperText: errors.agreement_end_date, onClick: (e) => e.target.closest('.MuiFormControl-root').querySelector('button')?.click() },
                                                actionBar: { actions: ['clear', 'today', 'cancel', 'accept'] },
                                            }}
                                        />
                                    </LocalizationProvider>
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField select fullWidth label="Status" size="small" value={data.status} onChange={(e) => setData('status', e.target.value)} error={!!errors.status} helperText={errors.status} required>
                                        <MenuItem value="Active">Active</MenuItem>
                                        <MenuItem value="Inactive">Inactive</MenuItem>
                                    </TextField>
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField fullWidth label="Comment Box" multiline rows={3} size="small" value={data.comments} onChange={(e) => setData('comments', e.target.value)} error={!!errors.comments} helperText={errors.comments} />
                                </Grid>
                            </Grid>
                        </Grid>
                    </Grid>

                    <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center' }}>
                        <Button variant="contained" type="submit" disabled={processing} sx={{ backgroundColor: '#063455', color: '#fff', px: 4 }}>
                            SAVE
                        </Button>
                        <Button variant="contained" sx={{ backgroundColor: '#7E8299', color: '#fff', px: 4 }} onClick={() => window.history.back()}>
                            CANCEL
                        </Button>
                    </Box>
                </form>
            </Box>
        </div>
    );
};

export default CreatePartnerAffiliate;
