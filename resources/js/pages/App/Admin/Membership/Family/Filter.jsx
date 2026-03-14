import { useState, useEffect } from 'react';
import axios from 'axios';
import { Typography, Button, Box, Dialog, IconButton, TextField, MenuItem, FormControlLabel, Checkbox, Autocomplete, CircularProgress, Chip } from '@mui/material';
import { Close as CloseIcon, Search } from '@mui/icons-material';
import { router, usePage } from '@inertiajs/react';

const FamilyFilter = () => {
    const props = usePage().props;

    const [filters, setFilters] = useState({
        sort: props.filters?.sort || 'asc',
        sortBy: props.filters?.sortBy || 'id',
        membership_no: props.filters?.membership_no || '',
        name: props.filters?.name || '',
        cnic: props.filters?.cnic || '',
        contact: props.filters?.contact || '',
        status: props.filters?.status || 'all',
        parent_name: props.filters?.parent_name || '',
        relation: props.filters?.relation || 'all',
        card_status: props.filters?.card_status || 'all',
        min_age: props.filters?.min_age || '',
        max_age: props.filters?.max_age || '',
        age_over_25: props.filters?.age_over_25 || false,
    });

    const handleFilterChange = (key, value) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
    };

    const handleResetFilters = () => {
        const reset = {
            sort: 'asc',
            sortBy: 'id',
            membership_no: '',
            name: '',
            cnic: '',
            contact: '',
            status: 'all',
            parent_name: '',
            relation: 'all',
            card_status: 'all',
            min_age: '',
            max_age: '',
            age_over_25: false,
        };
        setFilters(reset);
        router.get(route('membership.family-members'));
    };

    const handleApplyFilters = () => {
        router.get(route('membership.family-members'), filters, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const [open, setOpen] = useState(false);
    const [options, setOptions] = useState([]);
    const [loading, setLoading] = useState(false);

    // Debounce function to limit API calls
    useEffect(() => {
        const timer = setTimeout(() => {
            if (open) {
                if (filters.name) {
                    fetchMembers(filters.name);
                }
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [filters.name, open]);

    const fetchMembers = async (query) => {
        setLoading(true);
        try {
            const response = await axios.get(route('membership.family-members.search'), {
                params: { query },
            });
            setOptions(response.data.members || []);
        } catch (error) {
            console.error('Failed to fetch members', error);
        } finally {
            setLoading(false);
        }
    };

    const [parentOpen, setParentOpen] = useState(false);
    const [parentOptions, setParentOptions] = useState([]);
    const [parentLoading, setParentLoading] = useState(false);

    // Debounce for parent member search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (parentOpen) {
                if (filters.parent_name) {
                    fetchParentMembers(filters.parent_name);
                }
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [filters.parent_name, parentOpen]);

    const fetchParentMembers = async (query) => {
        setParentLoading(true);
        try {
            const response = await axios.get(route('api.members.search'), {
                params: { query },
            });

            setParentOptions(response.data.members || []);
        } catch (error) {
            console.error('Failed to fetch parent members', error);
        } finally {
            setParentLoading(false);
        }
    };

    return (
        <Box backgroundColor="transparent" mb={3}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(5, 1fr)' } }} gap={2} mb={2}>
                <TextField
                    label="Membership #"
                    size="small"
                    value={filters.membership_no}
                    onChange={(e) => handleFilterChange('membership_no', e.target.value)}
                    fullWidth
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            borderRadius: '16px',
                        },
                    }}
                />

                <Autocomplete
                    open={open}
                    onOpen={() => setOpen(true)}
                    onClose={() => setOpen(false)}
                    isOptionEqualToValue={(option, value) => option.full_name === value.full_name}
                    getOptionLabel={(option) => option.full_name || ''}
                    options={options}
                    loading={loading}
                    value={options.find((opt) => opt.full_name === filters.name) || (filters.name ? { full_name: filters.name } : null)}
                    onInputChange={(event, newInputValue) => {
                        handleFilterChange('name', newInputValue);
                    }}
                    onChange={(event, newValue) => {
                        handleFilterChange('name', newValue ? newValue.full_name : '');
                    }}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Name"
                            size="small"
                            fullWidth
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '16px',
                                },
                            }}
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
                                        {option.full_name}
                                    </Typography>
                                    <Chip
                                        component="span"
                                        label={option.status}
                                        size="small"
                                        sx={{
                                            height: '20px',
                                            fontSize: '10px',
                                            backgroundColor: option.status === 'active' ? '#e8f5e9' : option.status === 'suspended' ? '#fff3e0' : '#ffebee',
                                            color: option.status === 'active' ? '#2e7d32' : option.status === 'suspended' ? '#ef6c00' : '#c62828',
                                            textTransform: 'capitalize',
                                        }}
                                    />
                                </Box>
                                <Typography variant="caption" color="text.secondary">
                                    {option.membership_no} | {option.mobile_number_a}
                                </Typography>
                            </Box>
                        </li>
                    )}
                />
                <TextField
                    label="CNIC"
                    size="small"
                    value={filters.cnic}
                    onChange={(e) => handleFilterChange('cnic', e.target.value)}
                    fullWidth
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            borderRadius: '16px',
                        },
                    }}
                />
                <TextField
                    label="Contact"
                    size="small"
                    value={filters.contact}
                    onChange={(e) => handleFilterChange('contact', e.target.value)}
                    fullWidth
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            borderRadius: '16px',
                        },
                    }}
                />

                <Autocomplete
                    open={parentOpen}
                    onOpen={() => setParentOpen(true)}
                    onClose={() => setParentOpen(false)}
                    isOptionEqualToValue={(option, value) => option.full_name === value.full_name}
                    getOptionLabel={(option) => option.full_name || ''}
                    options={parentOptions}
                    loading={parentLoading}
                    value={parentOptions.find((opt) => opt.full_name === filters.parent_name) || (filters.parent_name ? { full_name: filters.parent_name } : null)}
                    onInputChange={(event, newInputValue) => {
                        handleFilterChange('parent_name', newInputValue);
                    }}
                    onChange={(event, newValue) => {
                        handleFilterChange('parent_name', newValue ? newValue.full_name : '');
                    }}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Member Name"
                            size="small"
                            fullWidth
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '16px',
                                },
                            }}
                            InputProps={{
                                ...params.InputProps,
                                endAdornment: (
                                    <>
                                        {parentLoading ? <CircularProgress color="inherit" size={20} /> : null}
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
                                        {option.full_name}
                                    </Typography>
                                    <Chip
                                        component="span"
                                        label={option.status}
                                        size="small"
                                        sx={{
                                            height: '20px',
                                            fontSize: '10px',
                                            backgroundColor: option.status === 'active' ? '#e8f5e9' : option.status === 'suspended' ? '#fff3e0' : '#ffebee',
                                            color: option.status === 'active' ? '#2e7d32' : option.status === 'suspended' ? '#ef6c00' : '#c62828',
                                            textTransform: 'capitalize',
                                        }}
                                    />
                                </Box>
                                <Typography variant="caption" color="text.secondary">
                                    {option.membership_no} | {option.mobile_number_a}
                                </Typography>
                            </Box>
                        </li>
                    )}
                />
                <TextField
                    label="Min Age"
                    type="number"
                    size="small"
                    value={filters.min_age}
                    onChange={(e) => handleFilterChange('min_age', e.target.value)}
                    fullWidth
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            borderRadius: '16px',
                        },
                    }}
                />
                <TextField
                    label="Max Age"
                    type="number"
                    size="small"
                    value={filters.max_age}
                    onChange={(e) => handleFilterChange('max_age', e.target.value)}
                    fullWidth
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            borderRadius: '16px',
                        },
                    }}
                />
                <FormControlLabel control={<Checkbox checked={filters.age_over_25} onChange={(e) => handleFilterChange('age_over_25', e.target.checked)} />} label="Age over 25" />
                <TextField
                    select
                    label="Relation"
                    size="small"
                    value={filters.relation}
                    onChange={(e) => handleFilterChange('relation', e.target.value)}
                    fullWidth
                    sx={{
                        minWidth: 150,
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
                                    boxShadow: 'none !important',
                                    maxHeight: '200px',
                                    overflowY: 'auto'
                                },
                                '& .MuiMenuItem-root': {
                                    '&:hover': {
                                        backgroundColor: '#063455 !important',
                                        color: '#fff !important'
                                    }
                                }
                            }
                        }
                    }}
                >
                    <MenuItem value="all">All</MenuItem>
                    {['Father', 'Son', 'Daughter', 'Wife', 'Mother', 'Grand Son', 'Grand Daughter', 'Second Wife', 'Husband', 'Sister', 'Brother', 'Nephew', 'Niece', 'Father in law', 'Mother in Law'].map((relation, idx) => (
                        <MenuItem key={idx} value={relation}>
                            {relation}
                        </MenuItem>
                    ))}
                </TextField>
                <TextField
                    select
                    label="Card Status"
                    size="small"
                    value={filters.card_status}
                    onChange={(e) => handleFilterChange('card_status', e.target.value)}
                    fullWidth
                    sx={{
                        minWidth: 150,
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
                                    boxShadow: 'none !important',
                                    maxHeight: '200px',
                                    overflowY: 'auto'
                                },
                                '& .MuiMenuItem-root': {
                                    '&:hover': {
                                        backgroundColor: '#063455 !important',
                                        color: '#fff !important'
                                    }
                                }
                            }
                        }
                    }}
                >
                    <MenuItem value="all">All</MenuItem>
                    {['In-Process', 'Printed', 'Received', 'Issued', 'Applied', 'Re-Printed', 'Not Applied', 'Expired', 'Not Applicable', 'E-Card Issued'].map((status, idx) => (
                        <MenuItem key={idx} value={status}>
                            {status}
                        </MenuItem>
                    ))}
                </TextField>
                <TextField
                    select
                    label="Status"
                    size="small"
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    fullWidth
                    sx={{
                        minWidth: 150,
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
                                    boxShadow: 'none !important',
                                    maxHeight: '200px',
                                    overflowY: 'auto'
                                },
                                '& .MuiMenuItem-root': {
                                    '&:hover': {
                                        backgroundColor: '#063455 !important',
                                        color: '#fff !important'
                                    }
                                }
                            }
                        }
                    }}
                >
                    <MenuItem value="all">All</MenuItem>
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="suspended">Suspended</MenuItem>
                    <MenuItem value="cancelled">Cancelled</MenuItem>
                    <MenuItem value="pause">Pause</MenuItem>
                </TextField>
                {/* Member Type field removed */}
                <Box display="flex" justifyContent="flex-end" gap={1}>
                    <Button variant="outlined" size="small" onClick={handleResetFilters} sx={{ width: '100%', borderRadius: '16px', color: '#333', borderColor: '#ddd', textTransform: 'none' }}>
                        Reset
                    </Button>
                    <Button variant="contained" startIcon={<Search />} size="small" onClick={handleApplyFilters} sx={{ width: '100%', borderRadius: '16px', backgroundColor: '#0a3d62', color: 'white', textTransform: 'none', '&:hover': { backgroundColor: '#083352' } }}>
                        Search
                    </Button>
                </Box>
            </Box>
        </Box>
    );
};

export default FamilyFilter;
