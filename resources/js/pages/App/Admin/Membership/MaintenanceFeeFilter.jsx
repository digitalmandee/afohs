import { useState } from 'react';
import { Box, Typography, TextField, MenuItem, Button, Grid, FormControl, InputLabel, Select, Chip } from '@mui/material';
import { Search } from '@mui/icons-material';
import { router, usePage } from '@inertiajs/react';
import OutlinedInput from '@mui/material/OutlinedInput';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);

const MaintenanceFeeFilter = ({ filters: initialFilters }) => {
    const { all_categories } = usePage().props;

    // Define status options locally
    const all_statuses = ['active', 'suspended', 'cancelled', 'absent', 'expired', 'terminated', 'not_assign', 'in_suspension_process'].map((status) => {
        const label = status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        return { value: status, label: label };
    });

    const [filters, setFilters] = useState({
        status: initialFilters?.status || [],
        categories: initialFilters?.categories ? initialFilters.categories.map(id => parseInt(id)) : [],
        date_from: initialFilters?.date_from || '',
        date_to: initialFilters?.date_to || '',
    });

    const handleFilterChange = (key, value) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
    };

    const handleReset = () => {
        setFilters({
            status: [],
            categories: [],
            date_from: '',
            date_to: '',
        });
        router.get(route('membership.maintanance-fee-revenue'));
    };

    const handleApply = () => {
        router.get(route('membership.maintanance-fee-revenue'), filters, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    return (
        <Box sx={{ mb: 3, pt: 2, }}>
            <Typography sx={{ fontWeight: 600, fontSize: '18px', color: '#063455', mb: 3 }}>
                Search & Filter Options
            </Typography>

            <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={3}>
                    {/* <TextField
                        fullWidth
                        size="small"
                        type="date"
                        label="From Date"
                        value={filters.date_from}
                        onChange={(e) => handleFilterChange('date_from', e.target.value)}
                        InputLabelProps={{
                            shrink: true,
                        }}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                            },
                        }}
                    /> */}
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DatePicker
                            label="From Date"
                            format="MM-DD-YYYY"
                            value={filters.date_from ? dayjs(filters.date_from, "MM-DD-YYYY") : null}
                            onChange={(newValue) =>
                                handleFilterChange(
                                    "date_from",
                                    newValue ? newValue.format("MM-DD-YYYY") : ""
                                )
                            }
                            slotProps={{
                                textField: {
                                    fullWidth: true,
                                    size: "small",
                                    sx: {
                                        "& .MuiOutlinedInput-root": {
                                            borderRadius: "16px",
                                        },
                                        "& fieldset": {
                                            borderRadius: "16px",
                                        },
                                    },
                                },
                            }}
                        />
                    </LocalizationProvider>

                </Grid>
                <Grid item xs={12} md={3}>
                    {/* <TextField
                        fullWidth
                        size="small"
                        type="date"
                        label="To Date"
                        value={filters.date_to}
                        onChange={(e) => handleFilterChange('date_to', e.target.value)}
                        InputLabelProps={{
                            shrink: true,
                        }}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                            },
                        }}
                    /> */}
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DatePicker
                            label="To Date"
                            format="MM-DD-YYYY"
                            value={filters.date_to ? dayjs(filters.date_to, "MM-DD-YYYY") : null}
                            onChange={(newValue) =>
                                handleFilterChange(
                                    "date_to",
                                    newValue ? newValue.format("MM-DD-YYYY") : ""
                                )
                            }
                            slotProps={{
                                textField: {
                                    fullWidth: true,
                                    size: "small",
                                    sx: {
                                        "& .MuiOutlinedInput-root": {
                                            borderRadius: "16px",
                                        },
                                        "& fieldset": {
                                            borderRadius: "16px",
                                        },
                                    },
                                },
                            }}
                        />
                    </LocalizationProvider>
                </Grid>
                <Grid item xs={12} md={3}>
                    {/* <FormControl fullWidth size="small" variant="outlined">
                        <InputLabel shrink={filters.status.length > 0 ? true : false}>
                            Member Status
                        </InputLabel>
                        <Select
                            multiple
                            value={filters.status}
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                            renderValue={(selected) => (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {selected.map((value) => {
                                        const statusObj = all_statuses.find(s => s.value === value);
                                        return <Chip key={value} label={statusObj?.label || value} size="small" />;
                                    })}
                                </Box>
                            )}
                        >
                            {all_statuses && all_statuses.map((status) => (
                                <MenuItem key={status.value} value={status.value}>
                                    {status.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl> */}
                    {/* <TextField
                        select
                        label="Member Status"
                        size="small"
                        fullWidth
                        value={filters.status}
                        SelectProps={{
                            multiple: true,
                            renderValue: (selected) => (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {selected.map((value) => {
                                        const statusObj = all_statuses.find((s) => s.value === value);
                                        return (
                                            <Chip
                                                key={value}
                                                label={statusObj?.label || value}
                                                size="small"
                                            />
                                        );
                                    })}
                                </Box>
                            ),
                            
                        }}
                        onChange={(e) => handleFilterChange("status", e.target.value)}
                        
                    >
                        {all_statuses?.map((status) => (
                            <MenuItem key={status.value} value={status.value}>
                                {status.label}
                            </MenuItem>
                        ))}
                    </TextField> */}
                    <TextField
                        select
                        label="Member Status"
                        size="small"
                        fullWidth
                        value={filters.status}
                        onChange={(e) => handleFilterChange("status", e.target.value)}
                        SelectProps={{
                            multiple: true,
                            renderValue: (selected) => (
                                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                                    {selected.map((value) => {
                                        const statusObj = all_statuses.find(
                                            (s) => s.value === value
                                        );
                                        return (
                                            <Chip
                                                key={value}
                                                label={statusObj?.label || value}
                                                size="small"
                                            />
                                        );
                                    })}
                                </Box>
                            ),
                            MenuProps: {
                                PaperProps: {
                                    sx: {
                                        maxHeight: 300, mt: 0.1,
                                        borderRadius: "16px",
                                    },
                                },
                                MenuListProps: {
                                    sx: {
                                        px: 1,
                                    },
                                },
                            },
                        }}
                        sx={{
                            "& .MuiOutlinedInput-root": {
                                borderRadius: "16px",
                            },
                            "& fieldset": {
                                borderRadius: "16px",
                            },
                        }}
                    >
                        {all_statuses?.map((status) => (
                            <MenuItem
                                key={status.value}
                                value={status.value}
                                sx={{
                                    borderRadius: "16px",
                                    mx: 1,
                                    my: 0.5,

                                    "&:hover": {
                                        backgroundColor: "#063455",
                                        color: "#fff",
                                    },

                                    "&.Mui-selected": {
                                        backgroundColor: "#063455",
                                        color: "#fff",
                                    },

                                    "&.Mui-selected:hover": {
                                        backgroundColor: "#063455",
                                        color: "#fff",
                                    },
                                }}
                            >
                                {status.label}
                            </MenuItem>
                        ))}
                    </TextField>

                </Grid>
                <Grid item xs={12} md={3}>
                    <TextField
                        select
                        label="Member Categories"
                        size="small"
                        fullWidth
                        value={filters.categories}
                        onChange={(e) => handleFilterChange("categories", e.target.value)}
                        SelectProps={{
                            multiple: true,
                            renderValue: (selected) => (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {selected.map((value) => {
                                        const category = all_categories?.find((cat) => cat.id === value);
                                        return (
                                            <Chip
                                                key={value}
                                                label={category?.name || value}
                                                size="small"
                                            />
                                        );
                                    })}
                                </Box>
                            ),
                            MenuProps: {
                                PaperProps: {
                                    sx: {
                                        maxHeight: 300, mt: 0.1,
                                        borderRadius: "16px",
                                    },
                                },
                                MenuListProps: {
                                    sx: {
                                        px: 1,
                                    },
                                },
                            },
                        }}
                        sx={{
                            "& .MuiOutlinedInput-root": {
                                borderRadius: "16px",
                            },
                            "& fieldset": {
                                borderRadius: "16px",
                            },
                        }}
                    >
                        {all_categories?.map((category) => (
                            <MenuItem
                                key={category.id}
                                value={category.id}
                                sx={{
                                    borderRadius: "16px",
                                    mx: 1,
                                    my: 0.5,

                                    "&:hover": {
                                        backgroundColor: "#063455",
                                        color: "#fff",
                                    },

                                    "&.Mui-selected": {
                                        backgroundColor: "#063455",
                                        color: "#fff",
                                    },

                                    "&.Mui-selected:hover": {
                                        backgroundColor: "#063455",
                                        color: "#fff",
                                    },
                                }}
                            >
                                {category.name}
                            </MenuItem>
                        ))}
                    </TextField>
                </Grid>
            </Grid>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3 }}>
                <Button
                    variant="outlined"
                    onClick={handleReset}
                    sx={{
                        borderColor: '#063455',
                        color: '#063455',
                        textTransform: 'none',
                        borderRadius:'16px',
                        '&:hover': {
                            borderColor: '#063455',
                        },
                    }}
                >
                    Reset
                </Button>
                <Button
                    variant="contained"
                    startIcon={<Search />}
                    onClick={handleApply}
                    sx={{
                        backgroundColor: '#063455',
                        textTransform: 'none',
                        borderRadius:'16px',
                        '&:hover': {
                            backgroundColor: '#063455',
                        },
                    }}
                >
                    Search
                </Button>
            </Box>
        </Box>
    );
};

export default MaintenanceFeeFilter;
