import React from 'react';
import POSLayout from "@/components/POSLayout";
import { Head, useForm, Link, router } from '@inertiajs/react';
import { Box, Paper, Typography, Button, IconButton, TextField, Select, MenuItem, FormControl, InputLabel, Grid, InputAdornment } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { routeNameForContext } from '@/lib/utils';

// const drawerWidthOpen = 240;
// const drawerWidthClosed = 110;

function Create({ cakeType, isEdit, units }) {
    // const [open, setOpen] = React.useState(true);
    const { data, setData, post, put, processing, errors } = useForm({
        name: cakeType?.name || '',
        base_price: cakeType?.base_price || '',
        unit_id: cakeType?.unit_id || '',
        status: cakeType?.status || 'active',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isEdit) {
            put(route(routeNameForContext('cake-types.update'), cakeType.id));
        } else {
            post(route(routeNameForContext('cake-types.store')));
        }
    };

    return (
        <>
            {/* <Head title={isEdit ? 'Edit Cake Type' : 'Add Cake Type'} /> */}
            {/* <SideNav open={open} setOpen={setOpen} /> */}
            <Box
                sx={{
                    bgcolor: '#f5f5f5',
                    minHeight: '100vh',
                    p: 2,
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <IconButton>
                        <ArrowBackIcon sx={{ color: '#063455' }} onClick={() => router.visit(route(routeNameForContext('cake-types.index')))} />
                    </IconButton>
                    <Typography sx={{ color: '#063455', fontWeight: '600', fontSize: '30px' }}>
                        {isEdit ? 'Edit Cake Type' : 'Add Cake Type'}
                    </Typography>
                </Box>
                <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>

                    <Paper sx={{ p: 4 }} component="form" onSubmit={handleSubmit}>
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <Typography variant="subtitle2" sx={{ mb: 2, color: '#666' }}>
                                    Details
                                </Typography>
                            </Grid>

                            <Grid item xs={12}>
                                <TextField label="Cake Type Name" fullWidth required value={data.name} onChange={(e) => setData('name', e.target.value)} error={!!errors.name} helperText={errors.name} />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <TextField
                                    label="Price"
                                    fullWidth
                                    required
                                    type="number"
                                    value={data.base_price}
                                    onChange={(e) => setData('base_price', e.target.value)}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start">Rs</InputAdornment>,
                                    }}
                                    error={!!errors.base_price}
                                    helperText={errors.base_price}
                                />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth required error={!!errors.unit_id}>
                                    <InputLabel>Unit of Measurement</InputLabel>
                                    <Select value={data.unit_id} label="Unit of Measurement" onChange={(e) => setData('unit_id', e.target.value)}>
                                        {units.map((unit) => (
                                            <MenuItem key={unit.id} value={unit.id}>
                                                {unit.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid item xs={12}>
                                <FormControl fullWidth required>
                                    <InputLabel>Status</InputLabel>
                                    <Select value={data.status} label="Status" onChange={(e) => setData('status', e.target.value)}>
                                        <MenuItem value="active">Active</MenuItem>
                                        <MenuItem value="inactive">Inactive</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    size="large"
                                    // startIcon={<Save />} 
                                    disabled={processing}
                                    sx={{
                                        bgcolor: '#063455',
                                        textTransform: 'none',
                                        borderRadius: '16px',
                                        '&:hover': { bgcolor: '#063455' }
                                    }}>
                                    {isEdit ? 'Update' : 'Save'}
                                </Button>
                            </Grid>
                        </Grid>
                    </Paper>
                </Box>
            </Box>
        </>
    );
}

Create.layout = (page) => <POSLayout>{page}</POSLayout>;
export default Create;
