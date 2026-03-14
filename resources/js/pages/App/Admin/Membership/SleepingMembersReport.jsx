import { useMemo, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { router, usePage } from '@inertiajs/react';
import { TextField, Chip, Box, IconButton, Paper, Table, Autocomplete, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Button, InputAdornment, Grid, FormControl, InputLabel, Select, MenuItem, Pagination } from '@mui/material';
import { Search, Print, ArrowBack } from '@mui/icons-material';
import axios from 'axios';
import debounce from 'lodash.debounce';

const SleepingMembersReport = () => {
    // Get props first
    const { categories, primary_members, statistics, filters, all_categories, all_member_statuses } = usePage().props;

    // Modal state
    // const [open, setOpen] = useState(true);
    const [allFilters, setAllFilters] = useState({
        member_search: filters?.member_search || '',
        categories: filters?.categories || [],
        status: filters?.status || []
    });

    const [memberSuggestions, setMemberSuggestions] = useState([]);

    const fetchMemberSuggestions = useMemo(
        () =>
            debounce(async (query) => {
                if (!query) {
                    setMemberSuggestions([]);
                    return;
                }
                try {
                    const response = await axios.get(route('api.bookings.search-customers'), {
                        params: { query, type: 'member' },
                    });
                    setMemberSuggestions(response.data || []);
                } catch {
                    setMemberSuggestions([]);
                }
            }, 300),
        [],
    );

    const handleSearch = () => {
        router.get(route('membership.sleeping-members-report'), allFilters, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handlePageChange = (event, page) => {
        router.get(route('membership.sleeping-members-report'), {
            ...allFilters,
            page: page
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleFilterChange = (field, value) => {
        setAllFilters(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleReset = () => {
        setAllFilters({
            member_search: '',
            categories: [],
            status: []
        });
        router.get(route('membership.sleeping-members-report'));
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'active':
                return '#059669'; // Green
            case 'suspended':
                return '#dc2626'; // Red
            case 'cancelled':
                return '#6b7280'; // Gray
            case 'absent':
                return '#f59e0b'; // Orange
            case 'expired':
                return '#dc2626'; // Red
            case 'terminated':
                return '#374151'; // Dark Gray
            case 'not_assign':
                return '#9ca3af'; // Light Gray
            case 'in_suspension_process':
                return '#d97706'; // Orange
            default:
                return '#6b7280';
        }
    };

    const formatDate = (date) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('en-GB');
    };

    const renderMemberOption = (props, option) => (
        <li {...props} key={option.id || option.label}>
            <Box sx={{ width: '100%' }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" fontWeight="bold">
                        {option.membership_no || option.customer_no}
                    </Typography>
                    {option.status && (
                        <Chip
                            label={option.status}
                            size="small"
                            sx={{
                                height: '20px',
                                fontSize: '10px',
                                backgroundColor: option.status === 'active' ? '#e8f5e9' : option.status === 'suspended' ? '#fff3e0' : '#ffebee',
                                color: option.status === 'active' ? '#2e7d32' : option.status === 'suspended' ? '#ef6c00' : '#c62828',
                                textTransform: 'capitalize',
                                ml: 1,
                            }}
                        />
                    )}
                </Box>
                <Typography variant="caption" color="text.secondary">
                    {option.name || option.full_name || option.label}
                </Typography>
            </Box>
        </li>
    );

    const handlePrint = () => {
        // Build query string with current filters and page
        const params = new URLSearchParams();

        if (allFilters.member_search) {
            params.append('member_search', allFilters.member_search);
        }

        if (allFilters.categories && allFilters.categories.length > 0) {
            allFilters.categories.forEach(cat => params.append('categories[]', cat));
        }

        if (allFilters.status && allFilters.status.length > 0) {
            allFilters.status.forEach(status => params.append('status[]', status));
        }

        // Add current page number
        if (primary_members?.current_page) {
            params.append('page', primary_members.current_page);
        }

        // Open print page in new window
        const printUrl = route('membership.sleeping-members-report.print') + (params.toString() ? '?' + params.toString() : '');
        window.open(printUrl, '_blank');
    };

    return (
        <>
            {/* <SideNav open={open} setOpen={setOpen} />
            <div
                style={{
                    marginLeft: open ? `${drawerWidthOpen}px` : `${drawerWidthClosed}px`,
                    transition: 'margin-left 0.3s ease-in-out',
                    marginTop: '5rem',
                    backgroundColor: '#F6F6F6',
                }}
            > */}
            <div className="container-fluid px-4 py-4" style={{ backgroundColor: '#f5f5f5', minHeight: '100vh', overflowX: 'hidden' }}>
                {/* Top Bar */}
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div className="d-flex align-items-center">
                        <IconButton onClick={() => window.history.back()}>
                            <ArrowBack sx={{ color: '#063455' }} />
                        </IconButton>
                        <Typography sx={{ fontWeight: 600, fontSize: '24px', color: '#063455' }}>
                            Sleeping Members Report
                        </Typography>
                    </div>
                    <Button
                        variant="contained"
                        startIcon={<Print />}
                        onClick={handlePrint}
                        sx={{
                            backgroundColor: '#063455',
                            color: 'white',
                            textTransform: 'none',
                            borderRadius:'16px',
                            '&:hover': {
                                backgroundColor: '#052d47',
                            },
                        }}
                    >
                        Print
                    </Button>
                </div>

                {/* Filter Options */}
                <Box sx={{ mb: 3, pt: 2 }}>
                    <Typography sx={{ fontWeight: 600, fontSize: '18px', color: '#063455', mb: 3 }}>
                        Filter Options
                    </Typography>

                    {/* Filter Fields */}
                    <Grid container spacing={3} alignItems="center">
                        <Grid item xs={12} md={3}>
                            <Autocomplete
                                freeSolo
                                disablePortal
                                options={memberSuggestions}
                                getOptionLabel={(option) => {
                                    if (typeof option === 'string') return option;
                                    return option.membership_no || option.customer_no || option.value || option.label || '';
                                }}
                                inputValue={allFilters.member_search}
                                onChange={(event, newValue) => {
                                    if (!newValue) {
                                        handleFilterChange('member_search', '');
                                        return;
                                    }
                                    if (typeof newValue === 'string') {
                                        handleFilterChange('member_search', newValue);
                                        return;
                                    }
                                    handleFilterChange('member_search', newValue.membership_no || newValue.name || newValue.full_name || '');
                                }}
                                onInputChange={(event, newInputValue) => {
                                    handleFilterChange('member_search', newInputValue);
                                    fetchMemberSuggestions(newInputValue);
                                }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        fullWidth
                                        size="small"
                                        label="Member"
                                        placeholder="Membership # / Name"
                                        InputProps={{
                                            ...params.InputProps,
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <Search />
                                                </InputAdornment>
                                            ),
                                        }}
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }}
                                    />
                                )}
                                renderOption={renderMemberOption}
                                ListboxProps={{
                                    sx: {
                                        maxHeight: 300,
                                        px: 1,
                                        '& .MuiAutocomplete-option': { borderRadius: '16px', mx: 0.5, my: 0.5 },
                                        '& .MuiAutocomplete-option:hover': { backgroundColor: '#063455', color: '#fff' },
                                        "& .MuiAutocomplete-option[aria-selected='true']": { backgroundColor: '#063455', color: '#fff' },
                                        "& .MuiAutocomplete-option[aria-selected='true']:hover": { backgroundColor: '#063455', color: '#fff' },
                                    },
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} md={3}>
                            {/* <FormControl fullWidth size="small">
                                    <InputLabel>Member Category</InputLabel>
                                    <Select
                                        multiple
                                        value={allFilters.categories}
                                        onChange={(e) => handleFilterChange('categories', e.target.value)}
                                        renderValue={(selected) => (
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                {selected.map((value) => {
                                                    const category = all_categories?.find(cat => cat.id === value);
                                                    return (
                                                        <Chip key={value} label={category?.name || value} size="small" />
                                                    );
                                                })}
                                            </Box>
                                        )}
                                    >
                                        {all_categories && all_categories.map((category) => (
                                            <MenuItem key={category.id} value={category.id}>
                                                {category.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl> */}
                            <Autocomplete
                                multiple
                                value={all_categories?.filter(cat => allFilters.categories?.includes(cat.id)) || []}
                                onChange={(event, newValue) => {
                                    const categoryIds = newValue.map(cat => cat.id);
                                    handleFilterChange('categories', categoryIds);
                                }}
                                ListboxProps={{
                                    sx: {
                                        maxHeight: 300, // optional height
                                        px: 1,

                                        "& .MuiAutocomplete-option": {
                                            borderRadius: "16px",
                                            mx: 0.5,
                                            my: 0.5,
                                        },

                                        "& .MuiAutocomplete-option:hover": {
                                            backgroundColor: "#063455",
                                            color: "#fff",
                                        },

                                        "& .MuiAutocomplete-option[aria-selected='true']": {
                                            backgroundColor: "#063455",
                                            color: "#fff",
                                        },

                                        "& .MuiAutocomplete-option[aria-selected='true']:hover": {
                                            backgroundColor: "#063455",
                                            color: "#fff",
                                        },
                                    },
                                }}
                                options={all_categories || []}
                                getOptionLabel={(option) => option.name || ''}
                                isOptionEqualToValue={(option, value) => option.id === value?.id}
                                renderTags={(value, getTagProps) =>
                                    value.map((option, index) => (
                                        <Chip
                                            key={option.id}
                                            label={option.name}
                                            size="small"
                                            {...getTagProps({ index })}
                                        />
                                    ))
                                }
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Member Category"
                                        placeholder="Select categories"
                                        size="small"
                                        fullWidth
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }}
                                    />
                                )}
                            />
                        </Grid>
                        <Grid item xs={12} md={3}>
                            {/* <FormControl fullWidth size="small">
                                <InputLabel>Member Status</InputLabel>
                                <Select
                                    multiple
                                    value={allFilters.status}
                                    onChange={(e) => handleFilterChange('status', e.target.value)}
                                    renderValue={(selected) => (
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                            {selected.map((value) => (
                                                <Chip
                                                    key={value}
                                                    label={value.replace('_', ' ').toUpperCase()}
                                                    size="small"
                                                    sx={{
                                                        backgroundColor: `${getStatusColor(value)}20`,
                                                        color: getStatusColor(value),
                                                    }}
                                                />
                                            ))}
                                        </Box>
                                    )}
                                >
                                    {all_member_statuses && all_member_statuses.map((status) => (
                                        <MenuItem key={status} value={status}>
                                            {status.replace('_', ' ').toUpperCase()}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl> */}
                            <Autocomplete
                                multiple
                                value={all_member_statuses?.filter(status => allFilters.status?.includes(status)) || []}
                                onChange={(event, newValue) => {
                                    const statusValues = newValue.map(status => status);
                                    handleFilterChange('status', statusValues);
                                }}
                                ListboxProps={{
                                    sx: {
                                        maxHeight: 300, // optional height
                                        px: 1,

                                        "& .MuiAutocomplete-option": {
                                            borderRadius: "16px",
                                            mx: 0.5,
                                            my: 0.5,
                                        },

                                        "& .MuiAutocomplete-option:hover": {
                                            backgroundColor: "#063455",
                                            color: "#fff",
                                        },

                                        "& .MuiAutocomplete-option[aria-selected='true']": {
                                            backgroundColor: "#063455",
                                            color: "#fff",
                                        },

                                        "& .MuiAutocomplete-option[aria-selected='true']:hover": {
                                            backgroundColor: "#063455",
                                            color: "#fff",
                                        },
                                    },
                                }}
                                options={all_member_statuses || []}
                                getOptionLabel={(option) => option.replace('_', ' ').toUpperCase()}
                                isOptionEqualToValue={(option, value) => option === value}
                                renderTags={(value, getTagProps) =>
                                    value.map((option, index) => (
                                        <Chip
                                            key={option}
                                            label={option.replace('_', ' ').toUpperCase()}
                                            size="small"
                                            {...getTagProps({ index })}
                                            sx={{
                                                backgroundColor: `${getStatusColor(option)}20`,
                                                color: getStatusColor(option),
                                            }}
                                        />
                                    ))
                                }
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Member Status"
                                        placeholder="Select statuses"
                                        size="small"
                                        fullWidth
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }}
                                    />
                                )}
                            />
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <Button
                                    variant="contained"
                                    startIcon={<Search />}
                                    onClick={handleSearch}
                                    sx={{
                                        backgroundColor: '#063455',
                                        textTransform: 'none',
                                        borderRadius: '16px',
                                        '&:hover': {
                                            backgroundColor: '#063455',
                                        },
                                    }}
                                >
                                    Search
                                </Button>
                                <Button
                                    variant="outlined"
                                    onClick={handleReset}
                                    sx={{
                                        borderColor: '#063455',
                                        color: '#063455',
                                        textTransform: 'none',
                                        borderRadius: '16px',
                                        '&:hover': {
                                            // backgroundColor: '#fef2f2',
                                            borderColor: '#063455',
                                        },
                                    }}
                                >
                                    Reset
                                </Button>
                            </Box>
                        </Grid>
                    </Grid>
                </Box>

                {/* Members Detail Table */}
                <Box sx={{ mb: 3 }}>
                    <Typography sx={{ fontWeight: 600, fontSize: '20px', color: '#063455', mb: 2 }}>
                        Sleeping Members Details
                    </Typography>
                    <TableContainer sx={{ borderRadius: '16px', overflowX: 'auto' }}>
                        <Table>
                            <TableHead>
                                <TableRow style={{ backgroundColor: '#063455' }}>
                                    <TableCell sx={{ color: 'white', fontSize: '14px', fontWeight: 600, }}>SR</TableCell>
                                    <TableCell sx={{ color: 'white', fontSize: '14px', fontWeight: 600, }}>ID</TableCell>
                                    <TableCell sx={{ color: 'white', fontSize: '14px', fontWeight: 600, whiteSpace:'nowrap' }}>Membership No</TableCell>
                                    <TableCell sx={{ color: 'white', fontSize: '14px', fontWeight: 600, whiteSpace:'nowrap' }}>Member Name</TableCell>
                                    <TableCell sx={{ color: 'white', fontSize: '14px', fontWeight: 600, }}>Category</TableCell>
                                    <TableCell sx={{ color: 'white', fontSize: '14px', fontWeight: 600, whiteSpace:'nowrap' }}>Membership Date</TableCell>
                                    <TableCell sx={{ color: 'white', fontSize: '14px', fontWeight: 600, whiteSpace:'nowrap' }}>Member Type</TableCell>
                                    <TableCell sx={{ color: 'white', fontSize: '14px', fontWeight: 600, }}>Status</TableCell>
                                    <TableCell sx={{ color: 'white', fontSize: '14px', fontWeight: 600, whiteSpace:'nowrap' }}>Last Activity Date</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {primary_members?.data && primary_members.data.length > 0 ? (
                                    primary_members.data.map((member, index) => (
                                        <TableRow
                                            key={member.id}
                                            sx={{
                                                '&:nth-of-type(odd)': { backgroundColor: '#f9fafb' },
                                                '&:hover': { backgroundColor: '#f3f4f6' },
                                                borderBottom: '1px solid #e5e7eb'
                                            }}
                                        >
                                            <TableCell sx={{ color: '#374151', fontWeight: 500, fontSize: '14px' }}>
                                                {index + 1}
                                            </TableCell>
                                            <TableCell sx={{ color: '#374151', fontWeight: 600, fontSize: '14px' }}>
                                                {member.id}
                                            </TableCell>
                                            <TableCell sx={{ color: '#374151', fontWeight: 500, fontSize: '14px' }}>
                                                {member.membership_no}
                                            </TableCell>
                                            <TableCell sx={{ color: '#374151', fontWeight: 600, fontSize: '14px' }}>
                                                {member.full_name}
                                            </TableCell>
                                            <TableCell sx={{ color: '#6B7280', fontWeight: 400, fontSize: '14px' }}>
                                                {member.member_category?.name || 'N/A'}
                                            </TableCell>
                                            <TableCell sx={{ color: '#6B7280', fontWeight: 400, fontSize: '14px' }}>
                                                {formatDate(member.membership_date_display || member.membership_date || member.created_at)}
                                            </TableCell>
                                            <TableCell sx={{ color: '#6B7280', fontWeight: 400, fontSize: '14px' }}>
                                                Provisional
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={member.status?.replace('_', ' ').toUpperCase()}
                                                    size="small"
                                                    sx={{
                                                        backgroundColor: `${getStatusColor(member.status)}20`,
                                                        color: getStatusColor(member.status),
                                                        fontWeight: 600,
                                                        textTransform: 'uppercase'
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ color: '#6B7280', fontWeight: 400, fontSize: '14px' }}>
                                                {formatDate(member.last_activity_date)}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                                            <Typography color="textSecondary">
                                                No sleeping members found
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                )}

                                {/* Footer Row */}
                                {primary_members?.data && primary_members.data.length > 0 && (
                                    <TableRow sx={{ backgroundColor: '#063455', borderTop: '2px solid #374151' }}>
                                        <TableCell sx={{ fontWeight: 700, color: 'white', fontSize: '16px' }} colSpan={4}>
                                            TOTAL ({statistics?.total_members || 0} Members)
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: 'white', fontSize: '14px' }}>
                                            Active: {statistics?.active || 0}
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: 'white', fontSize: '14px' }}>
                                            Suspended: {statistics?.suspended || 0}
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: 'white', fontSize: '14px' }}>
                                            Expired: {statistics?.expired || 0}
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: 'white', fontSize: '14px' }}>
                                            Others: {(statistics?.cancelled || 0) + (statistics?.absent || 0) + (statistics?.terminated || 0)}
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: 'white', fontSize: '14px' }}>
                                            In Process: {statistics?.in_suspension_process || 0}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {/* Pagination */}
                    {primary_members?.data && primary_members.data.length > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                            <Pagination
                                count={primary_members.last_page}
                                page={primary_members.current_page}
                                onChange={handlePageChange}
                                color="primary"
                                size="large"
                                showFirstButton
                                showLastButton
                                sx={{
                                    '& .MuiPaginationItem-root': {
                                        fontSize: '16px',
                                    },
                                }}
                            />
                        </Box>
                    )}

                    {/* Pagination Info */}
                    {primary_members?.data && primary_members.data.length > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                            <Typography variant="body2" color="textSecondary">
                                Showing {primary_members.from} to {primary_members.to} of {primary_members.total} results
                            </Typography>
                        </Box>
                    )}
                </Box>
            </div>
            {/* </div> */}
        </>
    );
};

export default SleepingMembersReport;
