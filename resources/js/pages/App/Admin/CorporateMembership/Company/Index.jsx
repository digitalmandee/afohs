import React, { useState } from 'react';
import { Box, Button, Card, CardContent, Grid, IconButton, Menu, MenuItem, Typography, Chip } from '@mui/material';
import { ArrowBack as ArrowBackIcon, Add as AddIcon, MoreVert as MoreVertIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { enqueueSnackbar } from 'notistack';
import { FaEdit } from 'react-icons/fa';

const CorporateCompanies = ({ companies }) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [companyList, setCompanyList] = useState(companies || []);
    const { props } = usePage();
    const csrfToken = props._token;

    const handleMenuOpen = (event, company) => {
        setAnchorEl(event.currentTarget);
        setSelectedCompany(company);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedCompany(null);
    };

    const handleEdit = () => {
        if (selectedCompany) {
            router.visit(route('corporate-companies.edit', selectedCompany.id));
        }
        handleMenuClose();
    };

    const handleDelete = async () => {
        if (selectedCompany) {
            if (!confirm('Are you sure you want to delete this company?')) {
                handleMenuClose();
                return;
            }
            try {
                await axios.delete(route('corporate-companies.destroy', selectedCompany.id), {
                    headers: { 'X-CSRF-TOKEN': csrfToken },
                });
                setCompanyList((prev) => prev.filter((c) => c.id !== selectedCompany.id));
                enqueueSnackbar('Corporate Company deleted successfully.', { variant: 'success' });
            } catch (error) {
                enqueueSnackbar('Failed to delete Corporate Company', { variant: 'error' });
            }
        }
        handleMenuClose();
    };

    return (
        <Box
            sx={{
                backgroundColor: '#f5f5f5',
                minHeight: '100vh',
                padding: '20px',
            }}
        >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {/* <IconButton onClick={() => window.history.back()}>
                        <ArrowBackIcon sx={{ color: '#063455' }} />
                    </IconButton> */}
                    <Typography sx={{ color: '#063455', fontWeight: 700, fontSize: '30px' }}>Corporate Companies</Typography>
                </Box>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <Button
                        variant="outlined"
                        startIcon={<DeleteIcon />}
                        onClick={() => router.get(route('corporate-companies.trashed'))}
                        sx={{
                            color: '#d32f2f',
                            borderColor: '#d32f2f',
                            borderRadius: '16px',
                            textTransform: 'none',
                            '&:hover': {
                                backgroundColor: '#ffebee',
                                borderColor: '#d32f2f',
                            },
                        }}
                    >
                        Deleted Companies
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon sx={{ fontSize: '1.5rem', marginBottom: 0.3 }} />}
                        onClick={() => router.visit(route('corporate-companies.create'))}
                        sx={{
                            backgroundColor: '#063455',
                            borderRadius: '16px',
                            textTransform: 'none',
                            '&:hover': { backgroundColor: '#002244' },
                        }}
                    >
                        Add Company
                    </Button>
                </div>
            </Box>
            <Typography style={{ color: '#063455', fontSize: '15px', fontWeight: '600' }}>Manage corporate entities for memberships.</Typography>

            <Grid container spacing={3} style={{ marginTop: 5 }}>
                {companyList.map((company) => (
                    <Grid item xs={12} sm={6} md={4} key={company.id}>
                        <Card sx={{
                            borderRadius: '16px'
                        }}>
                            <Box
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    p: 2,
                                    bgcolor: '#063455',
                                    borderBottom: '1px solid #eee',
                                }}
                            >
                                <Typography fontWeight={600} color='#fff'>{company.name} </Typography>
                                <IconButton onClick={(e) => handleMenuOpen(e, company)}>
                                    <MoreVertIcon sx={{color:'#fff'}} />
                                </IconButton>
                            </Box>
                            {/* <CardContent>
                                <Typography variant="body2" color="text.secondary" mb={1}>
                                    <strong>Status:</strong> <Chip label={company.status} size="small" color={company.status === 'active' ? 'success' : 'default'} />
                                </Typography>
                            </CardContent> */}
                            <CardContent>
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    mb={1}
                                    sx={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}
                                >
                                    <strong>Status:</strong>
                                    <Chip
                                        label={company.status ? company.status.charAt(0).toUpperCase() + company.status.slice(1) : company.status}
                                        size="small"
                                        color={company.status === 'active' ? 'success' : 'default'}
                                    />
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
                {companyList.length === 0 && (
                    <Grid item xs={12}>
                        <Typography align="center" color="text.secondary">
                            No companies found. Create one to get started.
                        </Typography>
                    </Grid>
                )}
            </Grid>

            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }}>
                <MenuItem onClick={handleEdit}>
                    <FaEdit size={18} style={{ color: '#f57c00', marginRight: 15 }} />
                    Edit
                </MenuItem>
                <MenuItem onClick={handleDelete}>
                    <DeleteIcon color='error' style={{ marginRight: 5 }} />
                    Delete
                </MenuItem>
            </Menu>
        </Box>
    );
};

export default CorporateCompanies;
