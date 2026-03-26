import React, { useEffect, useMemo, useState } from 'react';
import { router } from '@inertiajs/react';
import { Alert, CircularProgress, InputAdornment, Snackbar, Button, Chip, FormControl, Grid, InputLabel, MenuItem, Paper, Select } from '@mui/material';
import { Search, Add } from '@mui/icons-material';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Pagination, IconButton, TextField, Box, Typography, Tooltip } from '@mui/material';
import axios from 'axios';
import dayjs from 'dayjs';
import { DateCalendar, DatePicker, LocalizationProvider, PickersDay } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { FaEdit } from 'react-icons/fa';
import debounce from 'lodash.debounce';
import SurfaceCard from '@/components/App/ui/SurfaceCard';
import FilterToolbar from '@/components/App/ui/FilterToolbar';
import EmployeeHrPageShell from '@/components/App/Admin/EmployeeHrPageShell';
import { compactCalendarSx, compactDateActionBar, compactDateFieldSx, compactDateTextFieldProps } from '@/components/App/ui/dateFieldStyles';

const LeaveApplication = () => {
    // const [open, setOpen] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [date, setDate] = useState(null);
    const [status, setStatus] = useState('');
    const [applications, setApplications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    // Fetch applications on component mount
    useEffect(() => {
        fetchApplications(1);
    }, []);

    const fetchApplications = async (page = 1, customSearch = null, customDate = null, customStatus = null) => {
        setIsLoading(true);
        try {
            const params = {
                page,
            };

            // Use custom values if provided, otherwise use state
            const searchValue = customSearch !== null ? customSearch : searchTerm;
            const dateValue = customDate !== null ? customDate : date;
            const statusValue = customStatus !== null ? customStatus : status;

            // Only add search if it's not empty
            if (searchValue && searchValue.trim() !== '') {
                params.search = searchValue;
            }

            // Only add date if it's not null
            if (dateValue) {
                params.date = dayjs(dateValue).format('YYYY-MM-DD');
            }

            if (statusValue) {
                params.status = statusValue;
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

    const debouncedFetch = useMemo(
        () =>
            debounce((nextSearch, nextDate, nextStatus) => {
                setCurrentPage(1);
                fetchApplications(1, nextSearch, nextDate, nextStatus);
            }, 300),
        []
    );

    const handleClearAllFilters = () => {
        setSearchTerm('');
        setDate(null);
        setStatus('');
        setCurrentPage(1);
        fetchApplications(1, '', null, '');
    };

    useEffect(() => {
        if (currentPage > 1) {
            fetchApplications(currentPage);
        }
    }, [currentPage]);

    useEffect(() => {
        debouncedFetch(searchTerm, date, status);
        return () => debouncedFetch.cancel();
    }, [searchTerm, date, status, debouncedFetch]);

    const highlightedDays = useMemo(() => {
        const map = new Map();

        applications.forEach((application) => {
            const start = dayjs(application.start_date, ['DD/MM/YYYY', 'YYYY-MM-DD'], true);
            const end = dayjs(application.end_date, ['DD/MM/YYYY', 'YYYY-MM-DD'], true);

            if (!start.isValid() || !end.isValid()) {
                return;
            }

            let cursor = start.startOf('day');
            const finish = end.startOf('day');

            while (cursor.isBefore(finish) || cursor.isSame(finish, 'day')) {
                const key = cursor.format('YYYY-MM-DD');
                if (!map.has(key) || map.get(key) === 'pending') {
                    map.set(key, application.status);
                }
                cursor = cursor.add(1, 'day');
            }
        });

        return map;
    }, [applications]);

    return (
        <EmployeeHrPageShell
            title="Leave Applications"
            subtitle="Approve, reject, or hold applications with proper tracking."
            actions={(
                <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => router.visit(route('employees.leaves.application.create'))}
                    sx={{
                        backgroundColor: '#063455',
                        color: 'white',
                        textTransform: 'none',
                        borderRadius: '16px',
                    }}
                >
                    New Application
                </Button>
            )}
        >
                    <Box sx={{ mb: 2 }}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} lg={8}>
                                <FilterToolbar onReset={handleClearAllFilters}>
                                <Grid container spacing={1.25}>
                                    <Grid item xs={12} md={5}>
                                        <TextField
                                            variant="outlined"
                                            placeholder="Search by employee name or ID..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            size="small"
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <Search color="action" />
                                                    </InputAdornment>
                                                ),
                                            }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={3}>
                                        <DatePicker
                                            label="Select Date"
                                            format="DD/MM/YYYY"
                                            value={date ? dayjs(date) : null}
                                            onChange={(newValue) => setDate(newValue ? newValue.format('YYYY-MM-DD') : null)}
                                            slotProps={{
                                                textField: compactDateTextFieldProps,
                                                actionBar: compactDateActionBar,
                                            }}
                                            sx={compactDateFieldSx}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={2.5}>
                                        <FormControl size="small" fullWidth>
                                            <InputLabel>Status</InputLabel>
                                            <Select value={status} label="Status" onChange={(e) => setStatus(e.target.value)}>
                                                <MenuItem value="">All Statuses</MenuItem>
                                                <MenuItem value="approved">Approved</MenuItem>
                                                <MenuItem value="pending">Pending</MenuItem>
                                                <MenuItem value="rejected">Rejected</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                </Grid>
                                </FilterToolbar>
                            </Grid>
                            <Grid item xs={12} lg={4}>
                                <SurfaceCard title="Leave Calendar" subtitle="Quick monthly view for approved and pending dates." cardSx={{ height: '100%' }}>
                                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                                        <DateCalendar
                                            value={date ? dayjs(date) : dayjs()}
                                            onChange={(newValue) => setDate(newValue ? newValue.format('YYYY-MM-DD') : null)}
                                            sx={compactCalendarSx}
                                            slots={{
                                                day: (dayProps) => {
                                                    const key = dayProps.day.format('YYYY-MM-DD');
                                                    const tone = highlightedDays.get(key);
                                                    const toneSx =
                                                        tone === 'approved'
                                                            ? { bgcolor: 'rgba(34,197,94,0.18)', '&:hover, &.Mui-selected': { bgcolor: 'rgba(34,197,94,0.32)' } }
                                                            : tone === 'pending'
                                                              ? { bgcolor: 'rgba(245,158,11,0.18)', '&:hover, &.Mui-selected': { bgcolor: 'rgba(245,158,11,0.32)' } }
                                                              : {};
                                                    return <PickersDay {...dayProps} sx={{ borderRadius: '10px', fontWeight: 600, ...toneSx }} />;
                                                },
                                            }}
                                        />
                                    </LocalizationProvider>
                                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
                                        <Chip size="small" label="Approved" sx={{ bgcolor: 'rgba(34,197,94,0.18)' }} />
                                        <Chip size="small" label="Pending" sx={{ bgcolor: 'rgba(245,158,11,0.18)' }} />
                                    </Box>
                                </SurfaceCard>
                            </Grid>
                        </Grid>
                    </Box>
                    <SurfaceCard title="Application Register" subtitle="Requests stay visible while search, date, and status filters update in place.">
                    <TableContainer component={Paper} sx={{ borderRadius: '12px', overflowX: 'auto', boxShadow: 'none' }}>
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
                    </SurfaceCard>
        </EmployeeHrPageShell>
    );
};

export default LeaveApplication;
