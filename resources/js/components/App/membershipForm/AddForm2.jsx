import { useState } from 'react';
import { TextField, Button, Paper, Typography, Grid, Box, IconButton, Checkbox, FormControlLabel, Autocomplete, MenuItem, Select, FormControl } from '@mui/material';
import { ArrowBack, KeyboardArrowDown } from '@mui/icons-material';
import 'bootstrap/dist/css/bootstrap.min.css';
import { countries } from '@/constants/countries';

const AddForm2 = ({ data, handleChange, onNext, onBack, setSameAsCurrent, sameAsCurrent }) => {
    const [formErrors, setFormErrors] = useState({});

    const handleSameAddress = (e) => {
        const checked = e.target.checked;
        setSameAsCurrent(checked);

        if (checked) {
            handleChange({
                target: {
                    name: 'permanent_address',
                    value: data.current_address || '',
                },
            });
            handleChange({
                target: {
                    name: 'permanent_city',
                    value: data.current_city || '',
                },
            });
            handleChange({
                target: {
                    name: 'permanent_country',
                    value: data.current_country || '',
                },
            });
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault(); // Prevent default form submission
        // Basic validation
        const errors = {};
        // if (!data.mobile_number_a) errors.mobile_number_a = 'Mobile Number (A) is required';
        // if (!data.personal_email) errors.personal_email = 'Personal Email is required';
        if (!data.current_address) errors.current_address = 'Address is required';
        if (!data.current_city) errors.current_city = 'City is required';
        if (!data.current_country) errors.current_country = 'Country is required';

        setFormErrors(errors);

        if (Object.keys(errors).length > 0) {
            return; // Stop submission if errors exist
        }

        onNext();
    };

    return (
        <>
            {/* Main Form */}
            <form>
                <Grid container>
                    {/* Contact Information Section */}
                    <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 3, boxShadow: 'none', border: '1px solid #e0e0e0' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                <Typography variant="h6" component="h2" sx={{ fontWeight: 500, color: '#063455' }}>
                                    Contact Information
                                </Typography>
                                <Box sx={{ borderBottom: '1px dashed #ccc', flexGrow: 1, ml: 2 }}></Box>
                            </Box>

                            <Grid container spacing={3}>
                                {/* Mobile Number (A) */}
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="body2" sx={{ mb: 1 }}>
                                        Mobile Number (A)*
                                    </Typography>
                                    <TextField fullWidth variant="outlined" placeholder="03XXXXXXXX" size="small" name="mobile_number_a" value={data.mobile_number_a} error={!!formErrors.mobile_number_a} helperText={formErrors.mobile_number_a} onChange={(e) => handleChange({ target: { name: 'mobile_number_a', value: e.target.value.replace(/[^0-9+\-]/g, '') } })} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '4px' } }} />
                                </Grid>

                                {/* Mobile Number (B) */}
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="body2" sx={{ mb: 1 }}>
                                        Mobile Number (B)
                                    </Typography>
                                    <TextField fullWidth variant="outlined" placeholder="03XXXXXXXX" size="small" name="mobile_number_b" value={data.mobile_number_b} onChange={(e) => handleChange({ target: { name: 'mobile_number_b', value: e.target.value.replace(/[^0-9+\-]/g, '') } })} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '4px' } }} />
                                </Grid>

                                {/* Mobile Number (C) */}
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="body2" sx={{ mb: 1 }}>
                                        Mobile Number (C)
                                    </Typography>
                                    <TextField fullWidth variant="outlined" placeholder="03XXXXXXXX" size="small" name="mobile_number_c" value={data.mobile_number_c} onChange={(e) => handleChange({ target: { name: 'mobile_number_c', value: e.target.value.replace(/[^0-9+\-]/g, '') } })} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '4px' } }} />
                                </Grid>

                                {/* Telephone Number */}
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="body2" sx={{ mb: 1 }}>
                                        Telephone Number
                                    </Typography>
                                    <TextField fullWidth variant="outlined" placeholder="Enter telephone number" size="small" name="telephone_number" value={data.telephone_number} onChange={(e) => handleChange({ target: { name: 'telephone_number', value: e.target.value.replace(/[^0-9+\-]/g, '') } })} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '4px' } }} />
                                </Grid>

                                {/* Personal Email */}
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="body2" sx={{ mb: 1 }}>
                                        Personal Email*
                                    </Typography>
                                    <TextField fullWidth variant="outlined" type="email" placeholder="member1@gmail.com" size="small" name="personal_email" value={data.personal_email} error={!!formErrors.personal_email} helperText={formErrors.personal_email} onChange={handleChange} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '4px' } }} />
                                </Grid>

                                {/* Critical Email */}
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="body2" sx={{ mb: 1 }}>
                                        Critical Email
                                    </Typography>
                                    <TextField fullWidth variant="outlined" placeholder="member2@gmail.com" size="small" name="critical_email" value={data.critical_email} onChange={handleChange} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '4px' } }} />
                                </Grid>
                            </Grid>

                            {/* In Case of Emergency Section */}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, mt: 3 }}>
                                <Typography variant="h6" component="h2" sx={{ fontWeight: 500, color: '#063455' }}>
                                    In Case of Emergency
                                </Typography>
                                <Box sx={{ borderBottom: '1px dashed #ccc', flexGrow: 1, ml: 2 }}></Box>
                            </Box>

                            <Grid container spacing={3}>
                                {/* Name */}
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="body2" sx={{ mb: 1 }}>
                                        Name
                                    </Typography>
                                    <TextField fullWidth variant="outlined" placeholder="Enter Full Name" size="small" name="emergency_name" value={data.emergency_name} onChange={handleChange} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '4px' } }} />
                                </Grid>

                                {/* Relation */}
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="body2" sx={{ mb: 1 }}>
                                        Relation
                                    </Typography>
                                    <FormControl fullWidth size="small" error={!!formErrors.emergency_relation}>
                                        <Select
                                            value={data.emergency_relation || ''}
                                            name="emergency_relation"
                                            onChange={handleChange}
                                            displayEmpty
                                            renderValue={(selected) => {
                                                if (!selected) {
                                                    return 'Choose Relation';
                                                }
                                                return selected;
                                            }}
                                            inputProps={{ 'aria-label': 'Without label' }}
                                            IconComponent={() => <KeyboardArrowDown sx={{ position: 'absolute', right: 8, pointerEvents: 'none' }} />}
                                        >
                                            <MenuItem value="" disabled>
                                                Choose Relation
                                            </MenuItem>
                                            {['Father', 'Son', 'Daughter', 'Wife', 'Mother', 'Grand Son', 'Grand Daughter', 'Second Wife', 'Husband', 'Sister', 'Brother', 'Nephew', 'Niece', 'Father in law', 'Mother in Law', 'Cousin', 'Friend'].map((item, index) => (
                                                <MenuItem key={index} value={item} sx={{ textTransform: 'capitalize' }}>
                                                    {item}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                        {formErrors.emergency_relation && (
                                            <Typography variant="caption" color="error">
                                                {formErrors.emergency_relation}
                                            </Typography>
                                        )}
                                    </FormControl>
                                </Grid>

                                {/* Contact Number */}
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="body2" sx={{ mb: 1 }}>
                                        Contact Number
                                    </Typography>
                                    <TextField fullWidth variant="outlined" placeholder="03XXXXXXXX" size="small" name="emergency_contact" value={data.emergency_contact} onChange={(e) => handleChange({ target: { name: 'emergency_contact', value: e.target.value.replace(/[^0-9+\-]/g, '') } })} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '4px' } }} />
                                </Grid>
                            </Grid>
                        </Paper>
                    </Grid>

                    {/* Current Address and Permanent Address Sections */}
                    <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 3, boxShadow: 'none', border: '1px solid #e0e0e0' }}>
                            {/* Current Address Section */}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                <Typography variant="h6" component="h2" sx={{ fontWeight: 500, color: '#063455' }}>
                                    Current Address
                                </Typography>
                                <Box sx={{ borderBottom: '1px dashed #ccc', flexGrow: 1, ml: 2 }}></Box>
                            </Box>

                            <Grid container spacing={3}>
                                {/* Address */}
                                <Grid item xs={12}>
                                    <Typography variant="body2" sx={{ mb: 1 }}>
                                        Address*
                                    </Typography>
                                    <TextField fullWidth variant="outlined" placeholder="Enter complete address" size="small" name="current_address" value={data.current_address} error={!!formErrors.current_address} helperText={formErrors.current_address} onChange={handleChange} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '4px' } }} />
                                </Grid>

                                {/* City */}
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="body2" sx={{ mb: 1 }}>
                                        City*
                                    </Typography>
                                    <TextField fullWidth variant="outlined" placeholder="Enter city name" size="small" name="current_city" value={data.current_city} error={!!formErrors.current_city} helperText={formErrors.current_city} onChange={handleChange} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '4px' } }} />
                                </Grid>

                                {/* Country */}
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="body2" sx={{ mb: 1 }}>
                                        Country*
                                    </Typography>
                                    <Autocomplete
                                        size="small"
                                        fullWidth
                                        options={countries}
                                        getOptionLabel={(option) => option.label}
                                        value={countries.find((c) => c.label === data.current_country) || null}
                                        onChange={(e, newValue) => {
                                            handleChange({
                                                target: {
                                                    name: 'current_country',
                                                    value: newValue ? newValue.label : '',
                                                },
                                            });
                                        }}
                                        renderInput={(params) => <TextField {...params} label="Country*" error={!!formErrors.current_country} helperText={formErrors.current_country} />}
                                    />
                                </Grid>
                            </Grid>

                            {/* Permanent Address Section */}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, mt: 3 }}>
                                <Typography variant="h6" component="h2" sx={{ fontWeight: 500, color: '#063455' }}>
                                    Permanent Address
                                </Typography>
                                <Box sx={{ borderBottom: '1px dashed #ccc', flexGrow: 1, ml: 2 }}></Box>
                                <Box>
                                    <FormControlLabel control={<Checkbox checked={sameAsCurrent} onChange={handleSameAddress} />} label="Same as Current Address" />
                                </Box>
                            </Box>

                            <Grid container spacing={3}>
                                {/* Address */}
                                <Grid item xs={12}>
                                    <Typography variant="body2" sx={{ mb: 1 }}>
                                        Address
                                    </Typography>
                                    <TextField fullWidth variant="outlined" placeholder="Enter complete address" size="small" name="permanent_address" value={data.permanent_address} onChange={handleChange} disabled={sameAsCurrent} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '4px' } }} />
                                </Grid>

                                {/* City */}
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="body2" sx={{ mb: 1 }}>
                                        City
                                    </Typography>
                                    <TextField fullWidth variant="outlined" placeholder="Enter city name" size="small" name="permanent_city" value={data.permanent_city} onChange={handleChange} disabled={sameAsCurrent} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '4px' } }} />
                                </Grid>

                                {/* Country */}
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="body2" sx={{ mb: 1 }}>
                                        Country
                                    </Typography>
                                    <Autocomplete
                                        size="small"
                                        fullWidth
                                        options={countries}
                                        getOptionLabel={(option) => option.label}
                                        value={countries.find((c) => c.label === data.permanent_country) || null}
                                        onChange={(e, newValue) => {
                                            handleChange({
                                                target: {
                                                    name: 'permanent_country',
                                                    value: newValue ? newValue.label : '',
                                                },
                                            });
                                        }}
                                        disabled={sameAsCurrent}
                                        renderInput={(params) => <TextField {...params} label="Country" />}
                                    />
                                </Grid>
                            </Grid>

                            {/* Action Buttons */}
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4, mb: 1.5 }}>
                                <Button
                                    variant="outlined"
                                    sx={{
                                        textTransform: 'none',
                                        borderColor: '#ccc',
                                        color: '#333',
                                        '&:hover': { borderColor: '#999', backgroundColor: '#f5f5f5' },
                                    }}
                                    onClick={onBack}
                                >
                                    Back
                                </Button>
                                <Button
                                    variant="contained"
                                    sx={{
                                        textTransform: 'none',
                                        backgroundColor: '#0c4b6e',
                                        '&:hover': { backgroundColor: '#083854' },
                                    }}
                                    onClick={handleSubmit}
                                >
                                    Save & Next
                                </Button>
                            </Box>
                        </Paper>
                    </Grid>
                </Grid>
            </form>
        </>
    );
};

export default AddForm2;
