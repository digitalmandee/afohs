import { useState, useEffect } from 'react';
import { Typography, Button, Menu, MenuItem, TextField, createTheme, ThemeProvider, Table, TableContainer, TableHead, TableRow, TableCell, TableBody, Paper, IconButton, Box, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Tooltip, Autocomplete, CircularProgress, Chip } from '@mui/material';
import { router, usePage } from '@inertiajs/react';
import { Search, FilterAlt, Delete } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { FaEdit } from 'react-icons/fa';
import axios from 'axios';

import 'bootstrap/dist/css/bootstrap.min.css';

const PartnersAffiliatesIndex = ({ partners, filters = {} }) => {
    const { enqueueSnackbar } = useSnackbar();
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    // Filter State
    const [filterValues, setFilterValues] = useState({
        search: filters.search || '',
        type: filters.type || 'all',
        status: filters.status || 'all',
    });

    const handleFilterChange = (key, value) => {
        setFilterValues({ ...filterValues, [key]: value });
    };

    const handleApplyFilters = () => {
        router.get(route('admin.membership.partners-affiliates.index'), filterValues, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const handleResetFilters = () => {
        setFilterValues({
            search: '',
            type: 'all',
            status: 'all',
        });
        router.get(
            route('admin.membership.partners-affiliates.index'),
            {},
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    };

    const handleDeleteClick = (item) => {
        setItemToDelete(item);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (itemToDelete) {
            router.delete(route('admin.membership.partners-affiliates.destroy', itemToDelete.id), {
                onSuccess: () => {
                    enqueueSnackbar('Partner/Affiliate deleted successfully', { variant: 'success' });
                    setDeleteDialogOpen(false);
                    setItemToDelete(null);
                },
                onError: () => {
                    enqueueSnackbar('Failed to delete.', { variant: 'error' });
                },
            });
        }
    };

    const [open, setOpen] = useState(false);
    const [options, setOptions] = useState([]);
    const [loading, setLoading] = useState(false);

    // Debounce function to fetch partners
    useEffect(() => {
        const timer = setTimeout(() => {
            if (open) {
                if (filterValues.search) {
                    fetchPartners(filterValues.search);
                }
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [filterValues.search, open]);

    const fetchPartners = async (query) => {
        setLoading(true);
        try {
            const response = await axios.get(route('admin.membership.partners-affiliates.search'), {
                params: { query },
            });
            setOptions(response.data.partners || []);
        } catch (error) {
            console.error('Failed to fetch partners', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container-fluid px-4 pt-4" style={{ backgroundColor: '#f5f5f5', minHeight: '100vh', overflowX: 'hidden' }}>
           
                <div>
                    <div className="d-flex justify-content-between align-items-center">
                        <Typography sx={{ fontWeight: 700, fontSize: '30px', color: '#063455' }}>Partners & Affiliates</Typography>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <Button
                                variant="outlined"
                                startIcon={<Delete />}
                                onClick={() => router.get(route('admin.membership.partners-affiliates.trashed'))}
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
                                Deleted Partners
                            </Button>
                            {/* <Button variant="contained" style={{ backgroundColor: '#063455', textTransform: 'none', borderRadius: '16px', color: '#fff' }} onClick={() => router.visit(route('admin.membership.partners-affiliates.create'))}>
                            Add New
                        </Button> */}
                            <Button
                                variant="contained"
                                startIcon={<span style={{ fontSize: '1.5rem', marginBottom: 5 }}>+</span>}
                                style={{
                                    backgroundColor: '#063455',
                                    textTransform: 'none',
                                    height: 40,
                                    width: 120,
                                    borderRadius: '16px',
                                }}
                                onClick={() => router.visit(route('admin.membership.partners-affiliates.create'))}
                            >
                                Add New
                            </Button>
                        </div>
                    </div>
                    <Typography style={{ color: '#063455', fontSize: '15px', fontWeight: '600' }}>
                        Supports collaborations, discounts, and special access programs
                    </Typography>
                    {/* Filters */}
                    <Box component={Paper} elevation={0} sx={{ mb: 3, mt: 5, bgcolor: 'transparent', display: 'flex', gap: 2, alignItems: 'center' }}>
                        <Autocomplete
                            sx={{
                                minWidth: 250,
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '16px'
                                }
                            }}
                            open={open}
                            onOpen={() => setOpen(true)}
                            onClose={() => setOpen(false)}
                            isOptionEqualToValue={(option, value) => option.organization_name === value.organization_name}
                            getOptionLabel={(option) => option.organization_name || ''}
                            options={options}
                            loading={loading}
                            value={options.find((opt) => opt.organization_name === filterValues.search) || (filterValues.search ? { organization_name: filterValues.search } : null)}
                            onInputChange={(event, newInputValue) => {
                                handleFilterChange('search', newInputValue);
                            }}
                            onChange={(event, newValue) => {
                                handleFilterChange('search', newValue ? newValue.organization_name : '');
                            }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    placeholder="Search..."
                                    size="small"
                                    InputProps={{
                                        ...params.InputProps,
                                        endAdornment: (
                                            <>
                                                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                                                {params.InputProps.endAdornment}
                                            </>
                                        ),
                                    }}
                                />
                            )}
                            renderOption={(props, option) => (
                                <li {...props} key={option.id}>
                                    <Box sx={{ width: '100%' }}>
                                        <Box display="flex" justifyContent="space-between" alignItems="center">
                                            <Typography variant="body2" fontWeight="bold">
                                                {option.organization_name}
                                            </Typography>
                                            <Chip
                                                component="span"
                                                label={option.status}
                                                size="small"
                                                sx={{
                                                    height: '20px',
                                                    fontSize: '10px',
                                                    backgroundColor: option.status === 'Active' ? '#e8f5e9' : '#ffebee',
                                                    color: option.status === 'Active' ? '#2e7d32' : '#c62828',
                                                    textTransform: 'capitalize',
                                                }}
                                            />
                                        </Box>
                                        <Typography variant="caption" color="text.secondary">
                                            {option.email} | {option.focal_person_name}
                                        </Typography>
                                    </Box>
                                </li>
                            )}
                        />
                        <TextField select size="small" label="Type" value={filterValues.type} onChange={(e) => handleFilterChange('type', e.target.value)}
                            sx={{
                                // minWidth: 150,
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '16px'
                                }
                            }}
                            SelectProps={{
                                MenuProps: {
                                    sx: {
                                        mt: 1,
                                        '& .MuiPaper-root': {
                                            borderRadius: '16px !important',
                                            boxShadow: 'none !important'
                                        },
                                        '& .MuiMenuItem-root': {
                                            '&:hover': {
                                                backgroundColor: '#063455 !important',
                                                color: '#fff !important'
                                            }
                                        }
                                    }
                                }
                            }}>
                            <MenuItem value="all">All Types</MenuItem>
                            <MenuItem value="Club">Club</MenuItem>
                            <MenuItem value="Company">Company</MenuItem>
                            <MenuItem value="Other">Other</MenuItem>
                        </TextField>
                        <TextField select size="small" label="Status" value={filterValues.status} onChange={(e) => handleFilterChange('status', e.target.value)}
                            sx={{
                                // minWidth: 150,
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '16px'
                                }
                            }}
                            SelectProps={{
                                MenuProps: {
                                    sx: {
                                        mt: 1,  // ✅ Top margin
                                        '& .MuiPaper-root': {
                                            borderRadius: '16px !important',
                                            boxShadow: 'none !important'
                                        },
                                        '& .MuiMenuItem-root': {
                                            '&:hover': {
                                                backgroundColor: '#063455 !important',
                                                color: '#fff !important'
                                            }
                                        }
                                    }
                                }
                            }}>
                            <MenuItem value="all">All Status</MenuItem>
                            <MenuItem value="Active">Active</MenuItem>
                            <MenuItem value="Inactive">Inactive</MenuItem>
                        </TextField>

                        <div style={{ display: 'flex', gap: '8px' }}>
                            <Button variant="outlined" size="small" onClick={handleResetFilters} sx={{ color: '#063455', borderRadius: '16px', borderColor: '#063455', textTransform: 'none', height: 35, paddingLeft: 2, paddingRight: 2 }}>
                                Reset
                            </Button>
                            <Button variant="contained"
                                startIcon={<Search />}
                                size="small" onClick={handleApplyFilters} sx={{ backgroundColor: '#063455', borderRadius: '16px', color: 'white', textTransform: 'none', '&:hover': { backgroundColor: '#083352' } }}>
                                Search
                            </Button>
                        </div>
                    </Box>

                    <TableContainer style={{ boxShadow: 'none', overflowX: 'auto', borderRadius: '16px' }}>
                        <Table>
                            <TableHead>
                                <TableRow style={{ backgroundColor: '#063455', height: '30px' }}>
                                    <TableCell sx={{ color: '#fff', fontSize: '14px', fontWeight: 600, whiteSpace: 'nowrap' }}>SR #</TableCell>
                                    {/* <TableCell sx={{ color: '#fff', fontSize: '14px', fontWeight: 600, padding: '6px' }}>ID</TableCell> */}
                                    <TableCell sx={{ color: '#fff', fontSize: '14px', fontWeight: 600, whiteSpace: 'nowrap' }}>Partner / Affiliate</TableCell>
                                    <TableCell sx={{ color: '#fff', fontSize: '14px', fontWeight: 600, whiteSpace: 'nowrap' }}>Address</TableCell>
                                    <TableCell sx={{ color: '#fff', fontSize: '14px', fontWeight: 600, whiteSpace: 'nowrap' }}>Telephone</TableCell>
                                    <TableCell sx={{ color: '#fff', fontSize: '14px', fontWeight: 600, whiteSpace: 'nowrap' }}>Email</TableCell>
                                    <TableCell sx={{ color: '#fff', fontSize: '14px', fontWeight: 600, whiteSpace: 'nowrap' }}>Focal person</TableCell>
                                    <TableCell sx={{ color: '#fff', fontSize: '14px', fontWeight: 600, whiteSpace: 'nowrap' }}>Focal person Mobile</TableCell>
                                    <TableCell sx={{ color: '#fff', fontSize: '14px', fontWeight: 600, whiteSpace: 'nowrap' }}> Focal Person Email</TableCell>
                                    <TableCell sx={{ color: '#fff', fontSize: '14px', fontWeight: 600, whiteSpace: 'nowrap' }}>Status</TableCell>
                                    <TableCell sx={{ color: '#fff', fontSize: '14px', fontWeight: 600, whiteSpace: 'nowrap' }}>Action</TableCell>
                                    {/* <TableCell sx={{ color: '#fff', fontSize: '14px', fontWeight: 600, whiteSpace:'nowrap' }}>Delete</TableCell> */}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {partners.data.length > 0 ? (
                                    partners.data.map((partner, index) => (
                                        <TableRow key={partner.id} style={{ borderBottom: '1px solid #eee' }}>
                                            <TableCell sx={{ color: '#000', fontWeight: 600, fontSize: '14px' }}>{index + 1}</TableCell>
                                            {/* <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px' }}>{partner.id}</TableCell> */}
                                            <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px' }}>
                                                <Typography sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px' }}>{partner.organization_name}</Typography>
                                                <Typography sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px' }}>({partner.type})</Typography>
                                            </TableCell>
                                            {/* <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px', whiteSpace: 'nowrap' }}>{partner.address}</TableCell> */}
                                            <TableCell sx={{
                                                color: '#7F7F7F',
                                                fontWeight: 400,
                                                fontSize: '14px',
                                                maxWidth: '150px',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis'
                                            }}>
                                                <Tooltip title={partner.address} placement="top">
                                                    <span>{partner.address}</span>
                                                </Tooltip>
                                            </TableCell>
                                            {/* <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px' }}>{partner.telephone}</TableCell> */}
                                            <TableCell sx={{
                                                color: '#7F7F7F',
                                                fontWeight: 400,
                                                fontSize: '14px',
                                                maxWidth: '150px',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis'
                                            }}>
                                                <Tooltip title={partner.telephone} placement="top">
                                                    <span>{partner.telephone}</span>
                                                </Tooltip>
                                            </TableCell>
                                            {/* <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px' }}>{partner.email}</TableCell> */}
                                            <TableCell sx={{
                                                color: '#7F7F7F',
                                                fontWeight: 400,
                                                fontSize: '14px',
                                                maxWidth: '150px',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis'
                                            }}>
                                                <Tooltip title={partner.email} placement="top">
                                                    <span>{partner.email}</span>
                                                </Tooltip>
                                            </TableCell>
                                            {/* <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px' }}>{partner.focal_person_name}</TableCell> */}
                                            <TableCell sx={{
                                                color: '#7F7F7F', fontWeight: 400, fontSize: '14px', maxWidth: '150px',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis'
                                            }}>
                                                <Tooltip title={partner.focal_person_name} placement="top">
                                                    <span>{partner.focal_person_name}</span>
                                                </Tooltip>
                                            </TableCell>
                                            <TableCell sx={{
                                                color: '#7F7F7F', fontWeight: 400, fontSize: '14px', maxWidth: '150px',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis'
                                            }}>
                                                <Tooltip title={partner.focal_mobile_a} placement="top">
                                                    <span>{partner.focal_mobile_a}</span>
                                                </Tooltip>
                                            </TableCell>
                                            <TableCell sx={{
                                                color: '#7F7F7F',
                                                fontWeight: 400,
                                                fontSize: '14px',
                                                maxWidth: '150px',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis'
                                            }}>
                                                <Tooltip title={partner.focal_email} placement="top">
                                                    <span>{partner.focal_email}</span>
                                                </Tooltip>
                                            </TableCell>
                                            <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px' }}>
                                                <span
                                                    style={{
                                                        padding: '2px 6px',
                                                        borderRadius: '16px',
                                                        fontSize: '14px',
                                                        // fontWeight: 600,
                                                        backgroundColor: 'transparent',
                                                        border: partner.status === 'Active' ? '1px solid #2e7d32' : '1px solid #c62828',
                                                        color: partner.status === 'Active' ? '#2e7d32' : '#c62828',
                                                    }}
                                                >
                                                    {partner.status}
                                                </span>
                                            </TableCell>
                                            <TableCell sx={{ padding: '6px' }}>
                                                <Tooltip title="Edit">
                                                    <IconButton size="small" onClick={() => router.visit(route('admin.membership.partners-affiliates.edit', partner.id))} sx={{ color: '#f57c00' }}>
                                                        <FaEdit />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Delete">
                                                    <IconButton size="small" onClick={() => handleDeleteClick(partner)} sx={{ color: '#d32f2f' }}>
                                                        <Delete />
                                                    </IconButton>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={12} align="center" sx={{ py: 3 }}>
                                            No partners or affiliates found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>

                        {/* Pagination */}
                        <Box display="flex" justifyContent="center" mt={2} mb={2}>
                            {partners.links?.map((link, index) => (
                                <Button
                                    key={index}
                                    onClick={() => link.url && router.visit(link.url)}
                                    disabled={!link.url}
                                    variant={link.active ? 'contained' : 'outlined'}
                                    size="small"
                                    style={{
                                        margin: '0 5px',
                                        minWidth: '36px',
                                        padding: '6px 10px',
                                        fontWeight: link.active ? 'bold' : 'normal',
                                        backgroundColor: link.active ? '#333' : '#fff',
                                        color: link.active ? '#fff' : '#333',
                                        borderColor: '#ccc',
                                    }}
                                >
                                    <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                </Button>
                            ))}
                        </Box>
                    </TableContainer>

                    <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                        <DialogTitle>{'Confirm Deletion'}</DialogTitle>
                        <DialogContent>
                            <DialogContentText>Are you sure you want to delete this record?</DialogContentText>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setDeleteDialogOpen(false)} color="primary">
                                Cancel
                            </Button>
                            <Button onClick={confirmDelete} color="error" autoFocus>
                                Delete
                            </Button>
                        </DialogActions>
                    </Dialog>
                </div>
        </div>
    );
};

export default PartnersAffiliatesIndex;
