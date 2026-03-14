import { useState, useEffect } from 'react';
import axios from 'axios';
import { Typography, Button, Box, Dialog, Collapse, Chip, IconButton, TextField, MenuItem, Autocomplete, CircularProgress } from '@mui/material';
import { Close as CloseIcon, KeyboardArrowDown as KeyboardArrowDownIcon, Search } from '@mui/icons-material';
import { router, usePage } from '@inertiajs/react';

const CorporateMembershipDashboardFilter = () => {
    const props = usePage().props;

    const [filters, setFilters] = useState({
        sort: props.filters?.sort || 'asc',
        sortBy: props.filters?.sortBy || 'id',
        membership_no: props.filters?.membership_no || '',
        barcode: props.filters?.barcode || '',
        name: props.filters?.name || '',
        cnic: props.filters?.cnic || '',
        contact: props.filters?.contact || '',
        city: props.filters?.city || '',
        duration: props.filters?.duration || 'all',
        card_status: props.filters?.card_status || 'all',
        status: props.filters?.status || 'all',
        member_category: props.filters?.member_category || 'all', // Changed from member_type
    });

    const handleFilterChange = (key, value) => {
        setFilters((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    const handleResetFilters = () => {
        const reset = {
            sort: 'asc',
            sortBy: 'id',
            membership_no: '',
            barcode: '',
            name: '',
            cnic: '',
            contact: '',
            city: '',
            duration: 'all',
            card_status: 'all',
            status: 'all',
            member_category: 'all',
        };
        setFilters(reset);

        router.get(route('corporate-membership.members'));
    };

    const handleApplyFilters = () => {
        router.get(route('corporate-membership.members'), filters, {
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

    const [membershipNoOpen, setMembershipNoOpen] = useState(false);
    const [membershipNoOptions, setMembershipNoOptions] = useState([]);
    const [membershipNoLoading, setMembershipNoLoading] = useState(false);

    // Debounce for Membership #
    useEffect(() => {
        const timer = setTimeout(() => {
            if (membershipNoOpen) {
                if (filters.membership_no) {
                    fetchMembersByMembershipNo(filters.membership_no);
                }
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [filters.membership_no, membershipNoOpen]);

    const fetchMembersByMembershipNo = async (query) => {
        setMembershipNoLoading(true);
        try {
            const response = await axios.get(route('api.corporate-members.search'), {
                params: { query },
            });
            setMembershipNoOptions(response.data.members || []);
        } catch (error) {
            console.error('Failed to fetch members', error);
        } finally {
            setMembershipNoLoading(false);
        }
    };

    const fetchMembers = async (query) => {
        setLoading(true);
        try {
            const response = await axios.get(route('api.corporate-members.search'), {
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
        <Box backgroundColor="transparent" mb={3} mt={2}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(4, 1fr)' } }} gap={2} mb={2}>
                <Autocomplete
                    open={membershipNoOpen}
                    onOpen={() => setMembershipNoOpen(true)}
                    onClose={() => setMembershipNoOpen(false)}
                    isOptionEqualToValue={(option, value) => option.membership_no === value.membership_no}
                    getOptionLabel={(option) => option.membership_no || ''}
                    options={membershipNoOptions}
                    loading={membershipNoLoading}
                    value={membershipNoOptions.find((opt) => opt.membership_no === filters.membership_no) || (filters.membership_no ? { membership_no: filters.membership_no } : null)}
                    onInputChange={(event, newInputValue) => {
                        handleFilterChange('membership_no', newInputValue);
                    }}
                    onChange={(event, newValue) => {
                        handleFilterChange('membership_no', newValue ? newValue.membership_no : '');
                    }}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Membership #"
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
                                        {membershipNoLoading ? <CircularProgress color="inherit" size={20} /> : null}
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
                                        {option.membership_no}
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
                                    {option.full_name}
                                </Typography>
                            </Box>
                        </li>
                    )}
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
                    label="Barcode"
                    size="small"
                    value={filters.barcode}
                    onChange={(e) => handleFilterChange('barcode', e.target.value)}
                    fullWidth
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            borderRadius: '16px',
                        },
                    }}
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
                <TextField
                    label="City"
                    size="small"
                    value={filters.city}
                    onChange={(e) => handleFilterChange('city', e.target.value)}
                    fullWidth
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            borderRadius: '16px',
                        },
                    }}
                />
                <TextField
                    select
                    label="Duration"
                    size="small"
                    value={filters.duration}
                    onChange={(e) => handleFilterChange('duration', e.target.value)}
                    fullWidth
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            borderRadius: '16px',
                        },
                    }}
                    SelectProps={{
                        MenuProps: {
                            sx: {
                                mt: 0.5,
                                '& .MuiPaper-root': {
                                    borderRadius: '16px !important',
                                    boxShadow: 'none !important',
                                    maxHeight: '200px',
                                    overflowY: 'auto'
                                },
                            },
                        },
                    }}
                >
                    <MenuItem value="all" sx={{ borderRadius: '16px' }}>
                        All
                    </MenuItem>
                    <MenuItem value="lt1y" sx={{ borderRadius: '16px' }}>
                        Less than 1 year
                    </MenuItem>
                    <MenuItem value="1to3y" sx={{ borderRadius: '16px' }}>
                        1 to 3 years
                    </MenuItem>
                    <MenuItem value="3to5y" sx={{ borderRadius: '16px' }}>
                        3 to 5 years
                    </MenuItem>
                    <MenuItem value="gt5y" sx={{ borderRadius: '16px' }}>
                        More than 5 years
                    </MenuItem>
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
                    {['active', 'suspended', 'cancelled', 'absent', 'expired', 'terminated', 'not_assign', 'in_suspension_process'].map((status, idx) => (
                        <MenuItem key={idx} value={status} sx={{ textTransform: 'capitalize' }}>
                            {status.replace(/_/g, ' ')}
                        </MenuItem>
                    ))}
                </TextField>
                <TextField
                    select
                    label="Member Category"
                    size="small"
                    value={filters.member_category}
                    onChange={(e) => handleFilterChange('member_category', e.target.value)}
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
                    {props.memberCategories &&
                        props.memberCategories.map((cat, idx) => (
                            <MenuItem key={idx} value={cat.id}>
                                {cat.name}
                            </MenuItem>
                        ))}
                </TextField>

                <Box display="flex" justifyContent="flex-end" gap={1}>
                    <Button variant="outlined" size="small" onClick={handleResetFilters} sx={{ color: '#063455', borderColor: '#063455', textTransform: 'none', width: '100%', borderRadius: '16px' }}>
                        Reset
                    </Button>
                    <Button variant="contained" startIcon={<Search />} size="small" onClick={handleApplyFilters} sx={{ width: '100%', backgroundColor: '#0a3d62', borderRadius: '16px', color: 'white', textTransform: 'none', '&:hover': { backgroundColor: '#083352' } }}>
                        Search
                    </Button>
                </Box>
            </Box>
        </Box>
    );
};

export default CorporateMembershipDashboardFilter;
