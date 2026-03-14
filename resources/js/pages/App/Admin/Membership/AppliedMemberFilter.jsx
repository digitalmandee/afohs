import { useState, useEffect } from 'react';
import { Button, Box, TextField, MenuItem, Collapse, Autocomplete, CircularProgress, Typography, Chip } from '@mui/material';
import { router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { Search, FilterAlt, Delete } from '@mui/icons-material';

const AppliedMemberFilter = () => {
    const props = usePage().props;

    const [filters, setFilters] = useState({
        name: props.filters?.name || '',
        email: props.filters?.email || '',
        phone_number: props.filters?.phone_number || '',
        cnic: props.filters?.cnic || '',
        status: props.filters?.status || 'all', // 'all', 'permanent', 'not_permanent'
    });

    const handleFilterChange = (key, value) => {
        setFilters((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    const handleResetFilters = () => {
        const reset = {
            name: '',
            email: '',
            phone_number: '',
            cnic: '',
            status: 'all',
        };
        setFilters(reset);

        router.get(route('applied-member.index'));
    };

    const handleApplyFilters = () => {
        router.get(route('applied-member.index'), filters, {
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
            const response = await axios.get(route('api.applied-members.search'), {
                params: { query },
            });
            setOptions(response.data.members || []);
        } catch (error) {
            console.error('Failed to fetch members', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Collapse in={true}>
            <Box backgroundColor="transparent" mb={3}>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(4, 1fr)' } }} gap={2} mb={2}>
                    <Autocomplete
                        open={open}
                        onOpen={() => setOpen(true)}
                        onClose={() => setOpen(false)}
                        isOptionEqualToValue={(option, value) => option.name === value.name}
                        getOptionLabel={(option) => option.name || ''}
                        options={options}
                        loading={loading}
                        value={options.find((opt) => opt.name === filters.name) || (filters.name ? { name: filters.name } : null)}
                        onInputChange={(event, newInputValue) => {
                            handleFilterChange('name', newInputValue);
                        }}
                        onChange={(event, newValue) => {
                            handleFilterChange('name', newValue ? newValue.name : '');
                        }}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Name"
                                size="small"
                                fullWidth
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: '16px'
                                    }
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
                                            {option.name}
                                        </Typography>
                                        <Chip
                                            component="span"
                                            label={option.is_permanent_member ? 'Permanent' : 'Applied'}
                                            size="small"
                                            sx={{
                                                height: '20px',
                                                fontSize: '10px',
                                                backgroundColor: option.is_permanent_member ? '#e8f5e9' : '#fff3e0',
                                                color: option.is_permanent_member ? '#2e7d32' : '#ef6c00',
                                                textTransform: 'capitalize',
                                            }}
                                        />
                                    </Box>
                                    <Typography variant="caption" color="text.secondary">
                                        {option.email} | {option.phone_number}
                                    </Typography>
                                </Box>
                            </li>
                        )}
                    />
                    <TextField label="Email" size="small" value={filters.email} onChange={(e) => handleFilterChange('email', e.target.value)} fullWidth sx={{
                        '& .MuiOutlinedInput-root': {
                            borderRadius: '16px'
                        }
                    }} />
                    <TextField label="Phone Number" size="small" value={filters.phone_number} onChange={(e) => handleFilterChange('phone_number', e.target.value)} fullWidth sx={{
                        '& .MuiOutlinedInput-root': {
                            borderRadius: '16px'
                        }
                    }} />
                    <TextField label="CNIC" size="small" value={filters.cnic} onChange={(e) => handleFilterChange('cnic', e.target.value)} fullWidth sx={{
                        '& .MuiOutlinedInput-root': {
                            borderRadius: '16px'
                        }
                    }} />
                    <TextField select label="Status" size="small" value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)} fullWidth
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
                        <MenuItem value="all">All</MenuItem>
                        <MenuItem value="permanent">Permanent Member</MenuItem>
                        <MenuItem value="not_permanent">Not Permanent</MenuItem>
                    </TextField>
                    <Box display="flex" gap={2}>
                        <Button variant="outlined" size="small" onClick={handleResetFilters} sx={{ color: '#063455', borderRadius: '16px', borderColor: '#063455', textTransform: 'none', paddingLeft: 5, paddingRight: 5 }}>
                            Reset
                        </Button>
                        <Button variant="contained"
                            startIcon={<Search />}
                            size="small" onClick={handleApplyFilters} sx={{ backgroundColor: '#063455', borderRadius: '16px', color: 'white', textTransform: 'none', paddingLeft: 5, paddingRight: 5, '&:hover': { backgroundColor: '#083352' } }}>
                            Search
                        </Button>
                    </Box>
                </Box>
            </Box>
        </Collapse>
    );
};

export default AppliedMemberFilter;
