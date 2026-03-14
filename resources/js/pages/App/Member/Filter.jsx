import { CalendarToday as CalendarIcon, Close as CloseIcon, ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { Accordion, AccordionDetails, AccordionSummary, Box, Button, Chip, FormControl, IconButton, InputAdornment, MenuItem, Select, TextField, Typography } from '@mui/material';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useState } from 'react';

const CustomerFilter = () => {
    // State for modal visibility
    const [open, setOpen] = useState(false);

    // States for different filter sections
    const [sortingExpanded, setSortingExpanded] = useState(true);
    const [statusExpanded, setStatusExpanded] = useState(true);
    const [spendingExpanded, setSpendingExpanded] = useState(true);
    const [registeredExpanded, setRegisteredExpanded] = useState(true);

    // Filter states
    const [filters, setFilters] = useState({
        customerNameSort: null,
        memberIdSort: null,
        memberStatus: 'All Status',
        activeStatus: 'All Status',
        lastActive: '',
        lastInactive: '',
        spendingSort: null,
        spendingSuggest: null,
        minSpending: '',
        maxSpending: '',
        registeredSort: null,
        registeredSuggest: null,
        startPeriod: '',
        endPeriod: '',
    });

    // Handle modal open/close
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    // Handle filter changes
    const handleFilterChange = (section, value) => {
        setFilters({
            ...filters,
            [section]: value,
        });
    };

    // Reset all filters
    const handleReset = () => {
        setFilters({
            customerNameSort: null,
            memberIdSort: null,
            memberStatus: 'All Status',
            activeStatus: 'All Status',
            lastActive: '',
            lastInactive: '',
            spendingSort: null,
            spendingSuggest: null,
            minSpending: '',
            maxSpending: '',
            registeredSort: null,
            registeredSuggest: null,
            startPeriod: '',
            endPeriod: '',
        });
    };

    // Apply filters
    const handleApply = () => {
        handleClose();
    };

    // Custom chip component for filter options
    const FilterChip = ({ label, active, onClick, color = 'primary', icon }) => (
        <Chip
            label={label}
            onClick={onClick}
            sx={{
                backgroundColor: active ? (color === 'dark' ? '#063455' : '#063455') : '#B0DEFF',
                color: active ? 'white' : '#063455',
                border: 'none',
                borderRadius: '20px',
                margin: '0 4px 4px 0',
                '&:hover': {
                    backgroundColor: active ? (color === 'dark' ? '#052e4a' : '#052e4a') : '#9ecbea',
                },
            }}
            icon={icon}
        />
    );

    return (
        <div className="container">
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    // p: 2,
                    borderBottom: '1px solid #eee',
                }}
            >
                <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold' }}>
                    Customer Filter
                </Typography>
                <IconButton onClick={handleClose} size="small">
                    <CloseIcon />
                </IconButton>
            </Box>

            <Box sx={{ p: 2 }}>
                {/* Sorting Section */}
                <Accordion
                    expanded={sortingExpanded}
                    onChange={() => setSortingExpanded(!sortingExpanded)}
                    elevation={0}
                    sx={{
                        '&:before': { display: 'none' },
                        borderBottom: '1px solid #eee',
                    }}
                >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ padding: '0px', minHeight: '48px' }}>
                        <Typography sx={{ fontWeight: 'medium' }}>Sorting</Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ padding: '0px 0px 16px 0px' }}>
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                                By Customer Name
                            </Typography>
                            <Box>
                                <FilterChip label="↑ Ascending" active={filters.customerNameSort === 'asc'} onClick={() => handleFilterChange('customerNameSort', 'asc')} />
                                <FilterChip label="↓ Descending" active={filters.customerNameSort === 'desc'} onClick={() => handleFilterChange('customerNameSort', 'desc')} />
                            </Box>
                        </Box>

                        <Box>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                                By Member Id
                            </Typography>
                            <Box>
                                <FilterChip label="↑ Ascending" active={filters.memberIdSort === 'asc'} onClick={() => handleFilterChange('memberIdSort', 'asc')} />
                                <FilterChip label="↓ Descending" active={filters.memberIdSort === 'desc'} onClick={() => handleFilterChange('memberIdSort', 'desc')} />
                            </Box>
                        </Box>
                    </AccordionDetails>
                </Accordion>

                {/* Status Section */}
                <Accordion
                    expanded={statusExpanded}
                    onChange={() => setStatusExpanded(!statusExpanded)}
                    elevation={0}
                    sx={{
                        '&:before': { display: 'none' },
                        borderBottom: '1px solid #eee',
                    }}
                >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ padding: '0px', minHeight: '48px' }}>
                        <Typography sx={{ fontWeight: 'medium' }}>Status</Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ padding: '0px 0px 16px 0px' }}>
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                                Member Status
                            </Typography>
                            <Box>
                                <FilterChip label="All Status" active={filters.memberStatus === 'All Status'} onClick={() => handleFilterChange('memberStatus', 'All Status')} color="dark" />
                                <FilterChip label="Guest" active={filters.memberStatus === 'Guest'} onClick={() => handleFilterChange('memberStatus', 'Guest')} />
                                <FilterChip label="Star" active={filters.memberStatus === 'Star'} onClick={() => handleFilterChange('memberStatus', 'Star')} />
                                <FilterChip label="Diamond" active={filters.memberStatus === 'Diamond'} onClick={() => handleFilterChange('memberStatus', 'Diamond')} />
                            </Box>
                        </Box>

                        <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                                Active Status
                            </Typography>
                            <Box>
                                <FilterChip label="All Status" active={filters.activeStatus === 'All Status'} onClick={() => handleFilterChange('activeStatus', 'All Status')} color="dark" />
                                <FilterChip label="Active" active={filters.activeStatus === 'Active'} onClick={() => handleFilterChange('activeStatus', 'Active')} />
                                <FilterChip label="Inactive" active={filters.activeStatus === 'Inactive'} onClick={() => handleFilterChange('activeStatus', 'Inactive')} />
                            </Box>
                        </Box>

                        <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                                Last Active
                            </Typography>
                            <FormControl fullWidth size="small">
                                <Select
                                    value={filters.lastActive}
                                    onChange={(e) => handleFilterChange('lastActive', e.target.value)}
                                    displayEmpty
                                    renderValue={(selected) => {
                                        if (selected === '') {
                                            return 'Select period';
                                        }
                                        return selected;
                                    }}
                                    sx={{
                                        '.MuiOutlinedInput-notchedOutline': { borderColor: '#ddd' },
                                        borderRadius: '4px',
                                    }}
                                >
                                    <MenuItem value="">
                                        <em>Select period</em>
                                    </MenuItem>
                                    <MenuItem value="Last 7 days">Last 7 days</MenuItem>
                                    <MenuItem value="Last 30 days">Last 30 days</MenuItem>
                                    <MenuItem value="Last 90 days">Last 90 days</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>

                        <Box>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                                Last Inactive
                            </Typography>
                            <FormControl fullWidth size="small">
                                <Select
                                    value={filters.lastInactive}
                                    onChange={(e) => handleFilterChange('lastInactive', e.target.value)}
                                    displayEmpty
                                    renderValue={(selected) => {
                                        if (selected === '') {
                                            return 'Select period';
                                        }
                                        return selected;
                                    }}
                                    sx={{
                                        '.MuiOutlinedInput-notchedOutline': { borderColor: '#ddd' },
                                        borderRadius: '4px',
                                    }}
                                >
                                    <MenuItem value="">
                                        <em>Select period</em>
                                    </MenuItem>
                                    <MenuItem value="Last 7 days">Last 7 days</MenuItem>
                                    <MenuItem value="Last 30 days">Last 30 days</MenuItem>
                                    <MenuItem value="Last 90 days">Last 90 days</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                    </AccordionDetails>
                </Accordion>

                {/* Total Spending Section */}
                <Accordion
                    expanded={spendingExpanded}
                    onChange={() => setSpendingExpanded(!spendingExpanded)}
                    elevation={0}
                    sx={{
                        '&:before': { display: 'none' },
                        borderBottom: '1px solid #eee',
                    }}
                >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ padding: '0px', minHeight: '48px' }}>
                        <Typography sx={{ fontWeight: 'medium' }}>Total Spending</Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ padding: '0px 0px 16px 0px' }}>
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                                Sorting
                            </Typography>
                            <Box>
                                <FilterChip label="↑ Ascending" active={filters.spendingSort === 'asc'} onClick={() => handleFilterChange('spendingSort', 'asc')} />
                                <FilterChip label="↓ Descending" active={filters.spendingSort === 'desc'} onClick={() => handleFilterChange('spendingSort', 'desc')} />
                            </Box>
                        </Box>

                        <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                                Suggest
                            </Typography>
                            <Box>
                                <FilterChip label="Rs 50 - Rs 100" active={filters.spendingSuggest === 'range1'} onClick={() => handleFilterChange('spendingSuggest', 'range1')} />
                                <FilterChip label="Rs 100 - Rs 500" active={filters.spendingSuggest === 'range2'} onClick={() => handleFilterChange('spendingSuggest', 'range2')} />
                                <FilterChip label="Rs 500 - Rs 1000" active={filters.spendingSuggest === 'range3'} onClick={() => handleFilterChange('spendingSuggest', 'range3')} />
                            </Box>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="body2" sx={{ mb: 1 }}>
                                    Minimum
                                </Typography>
                                <TextField
                                    size="small"
                                    value={filters.minSpending}
                                    onChange={(e) => handleFilterChange('minSpending', e.target.value)}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start">Rs</InputAdornment>,
                                    }}
                                    sx={{
                                        '.MuiOutlinedInput-notchedOutline': { borderColor: '#ddd' },
                                        width: '100%',
                                    }}
                                />
                            </Box>
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="body2" sx={{ mb: 1 }}>
                                    Maximum
                                </Typography>
                                <TextField
                                    size="small"
                                    value={filters.maxSpending}
                                    onChange={(e) => handleFilterChange('maxSpending', e.target.value)}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start">Rs</InputAdornment>,
                                    }}
                                    sx={{
                                        '.MuiOutlinedInput-notchedOutline': { borderColor: '#ddd' },
                                        width: '100%',
                                    }}
                                />
                            </Box>
                        </Box>
                    </AccordionDetails>
                </Accordion>

                {/* Registered Period Section */}
                <Accordion
                    expanded={registeredExpanded}
                    onChange={() => setRegisteredExpanded(!registeredExpanded)}
                    elevation={0}
                    sx={{
                        '&:before': { display: 'none' },
                        borderBottom: '1px solid #eee',
                    }}
                >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ padding: '0px', minHeight: '48px' }}>
                        <Typography sx={{ fontWeight: 'medium' }}>Registered Period</Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ padding: '0px 0px 16px 0px' }}>
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                                Sorting
                            </Typography>
                            <Box>
                                <FilterChip label="↑ Ascending" active={filters.registeredSort === 'asc'} onClick={() => handleFilterChange('registeredSort', 'asc')} />
                                <FilterChip label="↓ Descending" active={filters.registeredSort === 'desc'} onClick={() => handleFilterChange('registeredSort', 'desc')} />
                            </Box>
                        </Box>

                        <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                                Suggest
                            </Typography>
                            <Box>
                                <FilterChip label="By Date" active={filters.registeredSuggest === 'date'} onClick={() => handleFilterChange('registeredSuggest', 'date')} />
                                <FilterChip label="By Month" active={filters.registeredSuggest === 'month'} onClick={() => handleFilterChange('registeredSuggest', 'month')} />
                                <FilterChip label="By Year" active={filters.registeredSuggest === 'year'} onClick={() => handleFilterChange('registeredSuggest', 'year')} />
                            </Box>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="body2" sx={{ mb: 1 }}>
                                    Start Period
                                </Typography>
                                <TextField
                                    size="small"
                                    value={filters.startPeriod}
                                    onChange={(e) => handleFilterChange('startPeriod', e.target.value)}
                                    placeholder="Select date"
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <CalendarIcon fontSize="small" sx={{ color: '#999' }} />
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{
                                        '.MuiOutlinedInput-notchedOutline': { borderColor: '#ddd' },
                                        width: '100%',
                                    }}
                                />
                            </Box>
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="body2" sx={{ mb: 1 }}>
                                    End Period
                                </Typography>
                                <TextField
                                    size="small"
                                    value={filters.endPeriod}
                                    onChange={(e) => handleFilterChange('endPeriod', e.target.value)}
                                    placeholder="Select date"
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <CalendarIcon fontSize="small" sx={{ color: '#999' }} />
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{
                                        '.MuiOutlinedInput-notchedOutline': { borderColor: '#ddd' },
                                        width: '100%',
                                    }}
                                />
                            </Box>
                        </Box>
                    </AccordionDetails>
                </Accordion>
            </Box>

            {/* Footer Buttons */}
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    p: 2,
                    borderTop: '1px solid #eee',
                    gap: 1,
                }}
            >
                <Button
                    onClick={handleClose}
                    sx={{
                        color: '#666',
                        textTransform: 'none',
                        '&:hover': {
                            backgroundColor: 'transparent',
                            textDecoration: 'underline',
                        },
                    }}
                >
                    Cancel
                </Button>
                <Button
                    variant="outlined"
                    onClick={handleReset}
                    sx={{
                        borderColor: '#ddd',
                        color: '#333',
                        textTransform: 'none',
                    }}
                >
                    Reset Filter
                </Button>
                <Button
                    variant="contained"
                    onClick={handleApply}
                    sx={{
                        backgroundColor: '#063455',
                        color: 'white',
                        textTransform: 'none',
                        '&:hover': {
                            backgroundColor: '#052e4a',
                        },
                    }}
                >
                    Apply Filters
                </Button>
            </Box>
        </div>
    );
};
CustomerFilter.layout = (page) => page;
export default CustomerFilter;
