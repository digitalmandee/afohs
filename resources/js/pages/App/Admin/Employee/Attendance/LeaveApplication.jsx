import React, { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';
import { Alert, CircularProgress, InputAdornment, Snackbar, Button } from '@mui/material';
import { Search, Add } from '@mui/icons-material';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Pagination, IconButton, TextField, Box, Typography, Tooltip } from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';
import axios from 'axios';
import dayjs from 'dayjs';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { styled } from '@mui/material/styles';
import { FaEdit } from 'react-icons/fa';

const LeaveApplication = () => {
    // const [open, setOpen] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [date, setDate] = useState(null);
    const [applications, setApplications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    // Fetch applications on component mount
    useEffect(() => {
        fetchApplications(1);
    }, []);

    const fetchApplications = async (page = 1, customSearch = null, customDate = null) => {
        setIsLoading(true);
        try {
            const params = {
                page,
            };

            // Use custom values if provided, otherwise use state
            const searchValue = customSearch !== null ? customSearch : searchTerm;
            const dateValue = customDate !== null ? customDate : date;

            // Only add search if it's not empty
            if (searchValue && searchValue.trim() !== '') {
                params.search = searchValue;
            }

            // Only add date if it's not null
            if (dateValue) {
                params.date = dateValue.format('YYYY-MM-DD');
            }

            const res = await axios.get('/api/employees/leaves/applications', { params });

            if (res.data.success) {
                setApplications(res.data.applications.data);
                setCurrentPage(res.data.applications.current_page);
                setTotalPages(res.data.applications.last_page);
            }
        } catch (error) {
            console.error('Error fetching applications:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = () => {
        setCurrentPage(1);
        fetchApplications(1);
    };

    const handleClearSearch = () => {
        setSearchTerm('');
        setCurrentPage(1);
        // Pass empty search explicitly
        fetchApplications(1, '', date);
    };

    const handleClearAllFilters = () => {
        setSearchTerm('');
        setDate(null);
        setCurrentPage(1);
        // Pass cleared values explicitly to avoid state delay
        fetchApplications(1, '', null);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    useEffect(() => {
        if (currentPage > 1) {
            fetchApplications(currentPage);
        }
    }, [currentPage]);

    // Fetch when date changes (but not on initial mount or when clearing all filters)
    useEffect(() => {
        // Only fetch if date is set (not null) and we have already loaded data
        if (date !== null && applications.length >= 0) {
            fetchApplications(1);
            setCurrentPage(1);
        }
    }, [date]);

    const RoundedTextField = styled(TextField)({
        '& .MuiOutlinedInput-root': {
            borderRadius: '16px',
        },
    });

    return (
        <>
            {/* <SideNav open={open} setOpen={setOpen} /> */}
            <div
                style={{
                    minHeight: '100vh',
                    backgroundColor: '#f5f5f5',
                }}
            >
                <div style={{ padding: '2rem' }}>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography style={{ fontWeight: '700', fontSize: '30px', color: '#063455' }}>Leave Applications</Typography>
                        <Button
                            variant="contained"
                            startIcon={<Add />}
                            onClick={() => router.visit(route('employees.leaves.application.create'))}
                            style={{
                                backgroundColor: '#063455',
                                color: 'white',
                                textTransform: 'none',
                                borderRadius: '16px',
                            }}
                        >
                            New Application
                        </Button>
                    </div>
                    <Typography sx={{ color: '#063455', fontSize: '15px', fontWeight: '600' }}>Approve, reject, or hold applications with proper tracking</Typography>
                    <Box sx={{ mb: 2, mt: '2rem' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                <TextField
                                    variant="outlined"
                                    placeholder="Search by employee name or ID..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    size="small"
                                    // sx={{ width: 350 }}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Search color="action" />
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: '16px',
                                        },
                                    }}
                                />
                                {/* <LocalizationProvider dateAdapter={AdapterDayjs}>
                                    <DatePicker
                                        label="Select Date"
                                        value={date}
                                        onChange={(newValue) => setDate(newValue)}
                                        renderInput={(params) => <TextField {...params} size="small"
                                            sx={{
                                                '& .MuiOutlinedInput-root': {
                                                    borderRadius: '16px',
                                                },
                                                '& .MuiOutlinedInput-notchedOutline': {
                                                    borderRadius: '16px',
                                                },
                                            }} />}
                                        slotProps={{
                                            field: { clearable: true },
                                        }}
                                    />
                                </LocalizationProvider> */}
                                <TextField
                                    label="Select Date"
                                    type="date"
                                    size="small"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    InputLabelProps={{
                                        shrink: true,
                                    }}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: '16px',
                                        },
                                        '& .MuiOutlinedInput-notchedOutline': {
                                            borderRadius: '16px',
                                        },
                                    }}
                                />
                                <Button
                                    variant="contained"
                                    startIcon={<Search />}
                                    onClick={handleSearch}
                                    sx={{
                                        backgroundColor: '#063455',
                                        color: 'white',
                                        textTransform: 'none',
                                        borderRadius: '16px',
                                        '&:hover': {
                                            backgroundColor: '#052d45',
                                        },
                                    }}
                                >
                                    Search
                                </Button>
                                {/* {searchTerm && ( */}
                                <Button
                                    variant="outlined"
                                    onClick={handleClearSearch}
                                    sx={{
                                        color: '#063455',
                                        borderColor: '#063455',
                                        textTransform: 'none',
                                        borderRadius: '16px',
                                        px: 3,
                                        '&:hover': {
                                            borderColor: '#052d45',
                                            // backgroundColor: 'rgba(6, 52, 85, 0.04)',
                                        },
                                    }}
                                >
                                    Reset
                                </Button>
                                {/* )} */}
                            </Box>

                            {/* <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                {(searchTerm || date) && (
                                    <Button
                                        variant="outlined"
                                        onClick={handleClearAllFilters}
                                        sx={{
                                            color: '#d32f2f',
                                            borderColor: '#d32f2f',
                                            textTransform: 'none',
                                            '&:hover': {
                                                borderColor: '#b71c1c',
                                                backgroundColor: 'rgba(211, 47, 47, 0.04)',
                                            },
                                        }}
                                    >
                                        Clear All Filters
                                    </Button>
                                )}
                            </Box> */}
                        </Box>
                    </Box>

                    <TableContainer component={Paper} sx={{ borderRadius: '12px', overflowX: 'auto' }}>
                        <Table>
                            <TableHead>
                                <TableRow style={{ backgroundColor: '#063455', height: 30 }}>
                                    <TableCell sx={{ fontWeight: '600', color: '#fff' }}>ID</TableCell>
                                    <TableCell sx={{ fontWeight: '600', color: '#fff', whiteSpace: 'nowrap' }}>Employee Name</TableCell>
                                    <TableCell sx={{ fontWeight: '600', color: '#fff', whiteSpace: 'nowrap' }}>Start Date</TableCell>
                                    <TableCell sx={{ fontWeight: '600', color: '#fff', whiteSpace: 'nowrap' }}>End Date</TableCell>
                                    <TableCell sx={{ fontWeight: '600', color: '#fff', whiteSpace: 'nowrap' }}>Leave Days</TableCell>
                                    <TableCell sx={{ fontWeight: '600', color: '#fff', whiteSpace: 'nowrap' }}>Leave Category</TableCell>
                                    <TableCell sx={{ fontWeight: '600', color: '#fff', whiteSpace: 'nowrap' }}>Created At</TableCell>
                                    <TableCell sx={{ fontWeight: '600', color: '#fff' }}>Status</TableCell>
                                    <TableCell sx={{ fontWeight: '600', color: '#fff' }}>Action</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={9} align="center">
                                            <CircularProgress sx={{ color: '#E0E8F0' }} />
                                        </TableCell>
                                    </TableRow>
                                ) : applications.length > 0 ? (
                                    applications.map((application) => (
                                        <TableRow key={application.id}>
                                            <TableCell sx={{ fontWeight: '600', color: '#000', fontSize: '14px' }}>{application.id}</TableCell>
                                            <TableCell
                                                sx={{
                                                    fontWeight: '400',
                                                    color: '#7f7f7f',
                                                    fontSize: '14px',
                                                    textOverflow: 'ellipsis',
                                                    overflow: 'hidden',
                                                    maxWidth: '150px',
                                                    whiteSpace: 'nowrap',
                                                }}
                                            >
                                                <Tooltip title={application.employee?.name} arrow>
                                                    {application.employee?.name}
                                                </Tooltip>
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: '400', color: '#7f7f7f', fontSize: '14px' }}>{application.start_date}</TableCell>
                                            <TableCell sx={{ fontWeight: '400', color: '#7f7f7f', fontSize: '14px' }}>{application.end_date}</TableCell>
                                            <TableCell sx={{ fontWeight: '400', color: '#7f7f7f', fontSize: '14px' }}>{application.number_of_days}</TableCell>
                                            <TableCell sx={{ fontWeight: '400', color: '#7f7f7f', fontSize: '14px' }}>{application.leave_category?.name}</TableCell>
                                            <TableCell sx={{ fontWeight: '400', color: '#7f7f7f', fontSize: '14px' }}>{dayjs(application.created_at).format('DD/MM/YYYY')}</TableCell>
                                            <TableCell>
                                                <span
                                                    style={{
                                                        backgroundColor: application.status === 'approved' ? '#063455' : application.status === 'pending' ? '#FFA726' : '#F44336',
                                                        color: 'white',
                                                        padding: '4px 12px',
                                                        borderRadius: '50px',
                                                        textTransform: 'capitalize',
                                                        display: 'inline-block',
                                                    }}
                                                >
                                                    {application.status}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <IconButton size="small" onClick={() => router.visit(route('employees.leaves.application.edit', application.id))}>
                                                    <FaEdit size={18} style={{ marginRight: 10, color: '#f57c00' }} />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={9} align="center">
                                            No applications found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {/* Pagination */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
                        <Pagination count={totalPages} page={currentPage} onChange={(e, page) => setCurrentPage(page)} shape="rounded" />
                    </div>
                </div>
            </div>
        </>
    );
};

export default LeaveApplication;
