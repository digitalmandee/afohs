import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import { Alert, Button, IconButton, Snackbar, Typography } from '@mui/material';
import { Box } from '@mui/system';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import axios from 'axios';

const CreateCategory = () => {
    // const [open, setOpen] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        color: '#000000',
        short_code: '',
        description: 'Can be avoiled once a year',
    });
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    // Handle input change
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    // Validate form fields
    const validateForm = () => {
        let newErrors = {};
        if (!formData.name.trim()) newErrors.name = 'Category name is required.';
        if (!formData.short_code.trim()) newErrors.short_code = 'Abbreviation is required.';
        if (!formData.description.trim()) newErrors.description = 'Description is required.';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsLoading(true);
        try {
            await axios.post('/api/leave-categories/', formData);
            setSnackbar({ open: true, message: 'Leave category added successfully!', severity: 'success' });
            setTimeout(() => router.visit(route('employees.leaves.category.index')), 1500);
        } catch (error) {
            // console.log(error.response.data);
            setSnackbar({ open: true, message: error.response.data.message ?? 'Something went wrong', severity: 'error' });
        } finally {
            setIsLoading(false);
        }

        // Clear form after submission
        // setFormData({ name: "", color: "#000000", description: "" });
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    return (
        <>
            {/* <SideNav open={open} setOpen={setOpen} /> */}
            <div
                style={{
                    backgroundColor: '#f5f5f5',
                }}
            >
                <Box sx={{ px: 2, py: 2 }}>
                    <div style={{ paddingTop: '0.5rem' }}>
                        {/* Header */}
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
                            <IconButton sx={{ color: '#063455' }} onClick={() => window.history.back()}>
                                <ArrowBackIcon />
                            </IconButton>
                            <Typography style={{ fontWeight: '600', color: '#063455', fontSize:'30px' }}>
                                New Leave Category
                            </Typography>
                        </div>
                        <form
                            onSubmit={handleSubmit}
                            style={{
                                maxWidth: '600px',
                                margin: '20px auto',
                                padding: '24px',
                                backgroundColor: 'white',
                                borderRadius: '8px',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                            }}
                        >
                            {/* Name */}
                            <div style={{ marginBottom: '12px' }}>
                                <label style={{ fontSize: '14px', color: '#333', marginBottom: '8px', display: 'block' }}>
                                    Name <span style={{ color: '#FF0000' }}>*</span>
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Category Name"
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        fontSize: '14px',
                                        border: '1px solid #E0E0E0',
                                        borderRadius: '4px',
                                        margin: 0,
                                    }}
                                />
                                {errors.name && <p style={{ color: 'red', fontSize: '12px', marginTop: '5px' }}>{errors.name}</p>}
                            </div>

                            {/* Color */}
                            <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: '14px', color: '#333', marginBottom: '8px', display: 'block' }}>
                                        Abbreviation <span style={{ color: '#FF0000' }}>*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="short_code"
                                        value={formData.short_code}
                                        onChange={handleChange}
                                        placeholder="Abbreviation"
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            fontSize: '14px',
                                            border: '1px solid #E0E0E0',
                                            borderRadius: '4px',
                                            margin: 0,
                                        }}
                                    />
                                    {errors.short_code && <p style={{ color: 'red', fontSize: '12px', marginTop: '5px' }}>{errors.short_code}</p>}
                                </div>
                                <div>
                                    <label style={{ fontSize: '14px', color: '#333', marginBottom: '8px', display: 'block' }}>
                                        Color <span style={{ color: '#FF0000' }}>*</span>
                                    </label>
                                    <input
                                        type="color"
                                        name="color"
                                        value={formData.color}
                                        onChange={handleChange}
                                        style={{
                                            width: '100px',
                                            height: '40px',
                                            border: 'none',
                                            cursor: 'pointer',
                                            margin: 0,
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Description */}
                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ fontSize: '14px', color: '#333', marginBottom: '8px', display: 'block' }}>
                                    Description <span style={{ color: '#FF0000' }}>*</span>
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    placeholder="Enter description..."
                                    style={{
                                        width: '100%',
                                        height: '100px',
                                        padding: '12px',
                                        fontSize: '14px',
                                        border: '1px solid #E0E0E0',
                                        borderRadius: '4px',
                                        resize: 'none',
                                    }}
                                />
                                {errors.description && <p style={{ color: 'red', fontSize: '12px', marginTop: '5px' }}>{errors.description}</p>}
                            </div>

                            {/* Buttons */}
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                                <button
                                    type="button"
                                    onClick={() => router.visit(route('employees.leaves.category.index'))}
                                    style={{
                                        padding: '8px 16px',
                                        fontSize: '14px',
                                        border: '1px solid #E0E0E0',
                                        borderRadius: '4px',
                                        backgroundColor: 'white',
                                        color: '#666',
                                        cursor: 'pointer',
                                    }}
                                >
                                    Cancel
                                </button>
                                <Button type="submit" disabled={isLoading} variant="contained" sx={{ backgroundColor: '#063455', color: 'white' }}>
                                    Add
                                </Button>
                            </div>
                        </form>
                    </div>
                </Box>
            </div>
            <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={handleCloseSnackbar}>
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} variant="filled">
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </>
    );
};

export default CreateCategory;
