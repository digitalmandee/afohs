import React, { useState } from 'react';
import { Box, Button, TextField, Typography, MenuItem, Paper, Grid, IconButton, CircularProgress } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import axios from 'axios';
import { enqueueSnackbar } from 'notistack';
import { router } from '@inertiajs/react';

const AddEditCompany = ({ company }) => {
    const isEditMode = !!company;
    const [formData, setFormData] = useState({
        name: company?.name || '',
        status: company?.status || 'active',
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setErrors({ ...errors, [e.target.name]: '' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        try {
            const url = isEditMode ? route('corporate-companies.update', company.id) : route('corporate-companies.store');

            const method = isEditMode ? 'put' : 'post';

            await axios[method](url, formData);

            enqueueSnackbar(`Corporate Company ${isEditMode ? 'updated' : 'created'} successfully!`, { variant: 'success' });
            router.visit(route('corporate-companies.index'));
        } catch (error) {
            console.error(error);
            if (error.response && error.response.status === 422) {
                setErrors(error.response.data.errors);
            } else {
                enqueueSnackbar('Something went wrong. Please try again.', { variant: 'error' });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ bgcolor: '#f5f5f5', minHeight: '100vh', p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <IconButton onClick={() => window.history.back()} sx={{ mr: 1 }}>
                    <ArrowBack style={{color:'#063455'}} />
                </IconButton>
                <Typography style={{fontWeight:'700', fontSize:'30px', color:'#063455'}}>
                    {isEditMode ? 'Edit Corporate Company' : 'Add Corporate Company'}
                </Typography>
            </Box>

            <Paper sx={{ p: 4, borderRadius: 2, maxWidth: 600, mx: 'auto' }}>
                <form onSubmit={handleSubmit}>
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <TextField fullWidth label="Company Name" name="name" value={formData.name} onChange={handleChange} error={!!errors.name} helperText={errors.name && errors.name[0]} required />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField select fullWidth label="Status" name="status" value={formData.status} onChange={handleChange} error={!!errors.status} helperText={errors.status && errors.status[0]}>
                                <MenuItem value="active">Active</MenuItem>
                                <MenuItem value="inactive">Inactive</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid item xs={12}>
                            <Button
                                type="submit"
                                variant="contained"
                                fullWidth
                                disabled={loading}
                                sx={{
                                    bgcolor: '#063455',
                                    height: 48,
                                    '&:hover': { bgcolor: '#04243b' },
                                }}
                            >
                                {loading ? <CircularProgress size={24} color="inherit" /> : isEditMode ? 'Update Company' : 'Create Company'}
                            </Button>
                        </Grid>
                    </Grid>
                </form>
            </Paper>
        </Box>
    );
};

export default AddEditCompany;
