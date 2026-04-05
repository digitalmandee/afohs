import React, { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';
import { ArrowBack, Search } from '@mui/icons-material';
import { Button, TextField, Checkbox, Pagination, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress, Select, MenuItem, Snackbar, Alert, Box, Typography, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Tooltip, Grid, Autocomplete } from '@mui/material';
import axios from 'axios';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { FaEdit } from 'react-icons/fa';
import debounce from 'lodash.debounce';
import EmployeeHrPageShell from '@/components/App/Admin/EmployeeHrPageShell';
import FilterToolbar from '@/components/App/ui/FilterToolbar';
import SurfaceCard from '@/components/App/ui/SurfaceCard';
import { compactDateActionBar, compactDateFieldSx, compactDateTextFieldProps } from '@/components/App/ui/dateFieldStyles';
// import { DemoContainer } from "@mui/x-date-pickers/internals/demo";
// import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
// import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
// import { DatePicker } from "@mui/x-date-pickers/DatePicker";

const ManageAttendance = () => {
    // const [open, setOpen] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [date, setDate] = useState(dayjs());
    const [selectedStatus, setSelectedStatus] = useState('');

    const [attendances, setAttendances] = useState([]);
    const [leavecategories, setLeaveCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [limit, setLimit] = useState(10);
    const [loadingRows, setLoadingRows] = useState({});
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [applyLoading, setApplyLoading] = useState(false);

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    const [branches, setBranches] = useState([]);
    const [designations, setDesignations] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [subdepartments, setSubdepartments] = useState([]);

    const [filters, setFilters] = useState({
        branch_id: null,
        designation_id: null,
        department_id: null,
        subdepartment_id: null,
    });

    const getAttendances = async (page = 1) => {
        setIsLoading(true);
        try {
            const res = await axios.get('/api/attendances', {
                params: {
                    page,
                    limit,
                    date: date.format('YYYY-MM-DD'),
                    search: searchQuery,
                    status: selectedStatus,
                    branch_id: filters.branch_id?.id,
                    designation_id: filters.designation_id?.id,
                    department_id: filters.department_id?.id,
                    subdepartment_id: filters.subdepartment_id?.id,
                },
            });

            if (res.data.success) {
                setAttendances(res.data.attendance.data);
                setTotalPages(res.data.attendance.last_page);
                setCurrentPage(res.data.attendance.current_page);
            }
        } catch (error) {
            console.log(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        getAttendances(currentPage);
    }, [currentPage, limit, date, filters, selectedStatus]);

    const debouncedSearch = React.useMemo(
        () =>
            debounce(() => {
                setCurrentPage(1);
                getAttendances(1);
            }, 300),
        [limit, date, filters, selectedStatus, searchQuery]
    );

    useEffect(() => {
        debouncedSearch();
        return () => debouncedSearch.cancel();
    }, [searchQuery, debouncedSearch]);

    const getLeaveCatgories = async () => {
        try {
            const res = await axios.get('/api/leave-categories');
            if (res.data.success) {
                setLeaveCategories(res.data.categories);
            }
        } catch (error) {
            console.log(error);
        }
    };

    const fetchFiltersData = async () => {
        try {
            const [branchesRes, designationsRes, departmentsRes] = await Promise.all([axios.get(route('branches.list')), axios.get(route('designations.list')), axios.get(route('api.departments.listAll'))]);

            if (branchesRes.data.success) setBranches(branchesRes.data.branches || []);
            if (designationsRes.data.success) setDesignations(designationsRes.data.data || []);
            if (departmentsRes.data.results) setDepartments(departmentsRes.data.results || []);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        if (filters.department_id) {
            axios
                .get(route('api.subdepartments.listAll', { department_id: filters.department_id.id }))
                .then((res) => setSubdepartments(res.data.results))
                .catch((err) => console.error(err));
        } else {
            setSubdepartments([]);
        }
    }, [filters.department_id]);

    useEffect(() => {
        getLeaveCatgories();
        fetchFiltersData();
    }, []);

    const handleClearSearch = () => {
        setSearchQuery('');
        setSelectedStatus('');
        setFilters({
            branch_id: null,
            designation_id: null,
            department_id: null,
            subdepartment_id: null,
        });
        setCurrentPage(1);
        // getAttendances(1) called by useEffect on filters change
    };

    const handleApplyStandardAttendance = async () => {
        setApplyLoading(true);
        try {
            const res = await axios.post(route('employees.attendances.apply-standard'), {
                date: date.format('YYYY-MM-DD'),
                branch_id: filters.branch_id?.id,
                designation_id: filters.designation_id?.id,
                department_id: filters.department_id?.id,
                subdepartment_id: filters.subdepartment_id?.id,
            });

            if (res.data.success) {
                setSnackbar({ open: true, message: res.data.message, severity: 'success' });
                getAttendances(currentPage);
            } else {
                setSnackbar({ open: true, message: res.data.message || 'Failed to apply standard attendance', severity: 'error' });
            }
        } catch (error) {
            console.error(error);
            const errorMessage = error.response?.data?.message || 'Failed to apply standard attendance. Make sure employees have shifts assigned.';
            setSnackbar({ open: true, message: errorMessage, severity: 'error' });
        } finally {
            setApplyLoading(false);
            setConfirmModalOpen(false);
        }
    };

    // Handle check-in, check-out, and leave category updates
    const handleUpdate = async (id, updatedData) => {
        setLoadingRows((prev) => ({ ...prev, [id]: true })); // loading for the specific row
        try {
            await axios.put(`/api/attendances/${id}`, updatedData);
            // getAttendances(currentPage);
            setSnackbar({ open: true, message: 'Attendance updated successfully!', severity: 'success' });
        } catch (error) {
            // console.log("Error updating attendance:", error);
            setSnackbar({ open: true, message: error.response.data.message ?? 'Something went wrong', severity: 'error' });
        } finally {
            setLoadingRows((prev) => ({ ...prev, [id]: false })); // Reset only that row’s loading state
        }
    };

    const handleInputChange = (id, field, value) => {
        setAttendances((prev) =>
            prev.map((att) => {
                if (att.id === id) {
                    let updatedStatus = att.status;

                    if (field === 'attendance') {
                        // If checked, set "present" by default, allow "late" later
                        updatedStatus = value ? 'present' : 'absent';
                    }

                    if (field === 'leave_category_id') {
                        updatedStatus = value ? 'leave' : 'absent'; // If leave is selected, status = "leave", else "absent"
                    }

                    return { ...att, [field]: value, status: updatedStatus };
                }
                return att;
            }),
        );
    };

    // Styles for Autocomplete
    const autocompleteStyle = {
        width: 200,
        backgroundColor: '#fff',
        borderRadius: '16px',
        '& .MuiOutlinedInput-root': {
            borderRadius: '16px',
        },
    };

    return (
        <>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
                <EmployeeHrPageShell
                    title="Manage Attendance"
                    subtitle="Review attendance, apply standard shifts, and update employee attendance statuses."
                >
                    <Box sx={{ mb: 2 }}>
                        <FilterToolbar
                            title="Filters"
                            subtitle="Adjust attendance criteria and click Apply."
                            lowChrome
                            onApply={() => getAttendances(1)}
                            showApply={false}
                            onReset={handleClearSearch}
                            actions={(
                                <Button
                                    variant="contained"
                                    onClick={() => setConfirmModalOpen(true)}
                                    disabled={applyLoading}
                                    sx={{ minHeight: 40, backgroundColor: '#063455' }}
                                >
                                    {applyLoading ? 'Applying…' : 'Apply Standard Attendance'}
                                </Button>
                            )}
                        >
                            <Grid container spacing={1.25}>
                                <Grid item xs={12} md={3}>
                                    <TextField
                                        size="small"
                                        placeholder="Search by name or ID..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        fullWidth
                                        InputProps={{
                                            startAdornment: <Search color="action" sx={{ mr: 0.75 }} />,
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12} md={2.25}>
                                    <DatePicker
                                        label="Select Date"
                                        value={date}
                                        onChange={(newValue) => setDate(newValue)}
                                        slotProps={{
                                            textField: compactDateTextFieldProps,
                                            actionBar: compactDateActionBar,
                                        }}
                                        sx={compactDateFieldSx}
                                    />
                                </Grid>
                                <Grid item xs={12} md={2}>
                                    <Select
                                        size="small"
                                        fullWidth
                                        displayEmpty
                                        value={selectedStatus}
                                        onChange={(e) => setSelectedStatus(e.target.value)}
                                        renderValue={(selected) => {
                                            if (!selected) return <span style={{ color: '#aaa' }}>Attendance Status</span>;
                                            return selected;
                                        }}
                                    >
                                        <MenuItem value="">All</MenuItem>
                                        <MenuItem value="present">Present</MenuItem>
                                        <MenuItem value="absent">Absent</MenuItem>
                                        <MenuItem value="late">Late</MenuItem>
                                        <MenuItem value="leave">Leave</MenuItem>
                                        <MenuItem value="weekend">Weekend</MenuItem>
                                    </Select>
                                </Grid>
                                <Grid item xs={12} md={2.25}>
                                    <Select
                                        size="small"
                                        fullWidth
                                        displayEmpty
                                        value={filters.branch_id || ''}
                                        onChange={(e) => setFilters({ ...filters, branch_id: e.target.value })}
                                        renderValue={(selected) => {
                                            if (!selected) return <span style={{ color: '#aaa' }}>Company</span>;
                                            return selected.name;
                                        }}
                                    >
                                        <MenuItem value="">None</MenuItem>
                                        {branches.map((b) => (
                                            <MenuItem key={b.id} value={b}>
                                                {b.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </Grid>
                                <Grid item xs={12} md={2.5}>
                                    <Select
                                        size="small"
                                        fullWidth
                                        displayEmpty
                                        value={filters.designation_id || ''}
                                        onChange={(e) => setFilters({ ...filters, designation_id: e.target.value })}
                                        renderValue={(selected) => {
                                            if (!selected) return <span style={{ color: '#aaa' }}>Designation</span>;
                                            return selected.name;
                                        }}
                                    >
                                        <MenuItem value="">None</MenuItem>
                                        {designations.map((designation) => (
                                            <MenuItem key={designation.id} value={designation}>
                                                {designation.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </Grid>
                                <Grid item xs={12} md={3}>
                                    <Select
                                        size="small"
                                        fullWidth
                                        displayEmpty
                                        value={filters.department_id || ''}
                                        onChange={(e) => setFilters({ ...filters, department_id: e.target.value, subdepartment_id: null })}
                                        renderValue={(selected) => {
                                            if (!selected) return <span style={{ color: '#aaa' }}>Department</span>;
                                            return selected.name;
                                        }}
                                    >
                                        <MenuItem value="">None</MenuItem>
                                        {departments.map((department) => (
                                            <MenuItem key={department.id} value={department}>
                                                {department.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </Grid>
                                <Grid item xs={12} md={3}>
                                    <Select
                                        size="small"
                                        fullWidth
                                        displayEmpty
                                        value={filters.subdepartment_id || ''}
                                        onChange={(e) => setFilters({ ...filters, subdepartment_id: e.target.value })}
                                        renderValue={(selected) => {
                                            if (!selected) return <span style={{ color: '#aaa' }}>Subdepartment</span>;
                                            return selected.name;
                                        }}
                                        disabled={!filters.department_id}
                                    >
                                        <MenuItem value="">None</MenuItem>
                                        {subdepartments.map((subdepartment) => (
                                            <MenuItem key={subdepartment.id} value={subdepartment}>
                                                {subdepartment.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </Grid>
                            </Grid>
                        </FilterToolbar>
                    </Box>

                    <SurfaceCard
                        title="Attendance Register"
                        subtitle="Attendance rows stay visible while filters update and shift defaults can be applied."
                    >
                        <TableContainer component={Paper} sx={{ borderRadius: '12px', overflowX: 'auto', boxShadow: 'none' }}>
                                <Table>
                                    <TableHead style={{ backgroundColor: '#063455' }}>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: '600', color: '#fff' }}>ID</TableCell>
                                            <TableCell sx={{ fontWeight: '600', color: '#fff', whiteSpace: 'nowrap' }}>Employee Name</TableCell>
                                            <TableCell sx={{ fontWeight: '600', color: '#fff', whiteSpace: 'nowrap' }}>Designation</TableCell>
                                            <TableCell sx={{ fontWeight: '600', color: '#fff', whiteSpace: 'nowrap' }}>Attendance</TableCell>
                                            <TableCell sx={{ fontWeight: '600', color: '#fff', whiteSpace: 'nowrap' }}>Leave Category</TableCell>
                                            <TableCell sx={{ fontWeight: '600', color: '#fff', whiteSpace: 'nowrap' }}>Check-In</TableCell>
                                            <TableCell sx={{ fontWeight: '600', color: '#fff', whiteSpace: 'nowrap' }}>Check-Out</TableCell>
                                            <TableCell sx={{ fontWeight: '600', color: '#fff', whiteSpace: 'nowrap' }}>Action</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {isLoading ? (
                                            <TableRow>
                                                <TableCell colSpan={8} align="center">
                                                    <CircularProgress sx={{ color: '#E0E8F0' }} />
                                                </TableCell>
                                            </TableRow>
                                        ) : attendances.length > 0 ? (
                                            attendances.map((row, index) => (
                                                <TableRow key={row.id}>
                                                    <TableCell sx={{ fontWeight: '600', color: '#000', fontSize: '14px' }}>{(currentPage - 1) * limit + index + 1}</TableCell>
                                                    <TableCell
                                                        sx={{
                                                            fontWeight: '400',
                                                            color: '#7f7f7f',
                                                            fontSize: '14px',
                                                            textOverflow: 'ellipsis',
                                                            overflow: 'hidden',
                                                            maxWidth: '120px',
                                                            whiteSpace: 'nowrap',
                                                        }}
                                                    >
                                                        <Tooltip title={row.employee.name} arrow>
                                                            {row.employee.name}
                                                        </Tooltip>
                                                    </TableCell>
                                                    <TableCell sx={{ fontWeight: '400', color: '#7f7f7f', fontSize: '14px' }}>{row.employee.designation}</TableCell>
                                                    <TableCell>
                                                        {row.status === 'weekend' ? (
                                                            <Typography
                                                                variant="caption"
                                                                sx={{
                                                                    backgroundColor: '#e3f2fd',
                                                                    color: '#1565c0',
                                                                    px: 1.5,
                                                                    py: 0.5,
                                                                    borderRadius: '12px',
                                                                    fontWeight: 600,
                                                                }}
                                                            >
                                                                Weekend
                                                            </Typography>
                                                        ) : (
                                                            <Checkbox checked={['present', 'late'].includes(row.status)} onChange={(e) => handleInputChange(row.id, 'attendance', e.target.checked)} disabled={row.status === 'leave'} color="primary" />
                                                        )}
                                                    </TableCell>

                                                    <TableCell>
                                                        <Select value={row.leave_category_id || ''} onChange={(e) => handleInputChange(row.id, 'leave_category_id', e.target.value)} size="small" style={{ minWidth: '120px' }}>
                                                            <MenuItem value="">Select</MenuItem>
                                                            {leavecategories.map((category) => (
                                                                <MenuItem key={category.id} value={category.id}>
                                                                    {category.name}
                                                                </MenuItem>
                                                            ))}
                                                        </Select>
                                                    </TableCell>

                                                    <TableCell sx={{ fontWeight: '400', color: '#7f7f7f', fontSize: '14px' }}>
                                                        <TextField size="small" type="time" value={row.check_in || ''} onChange={(e) => handleInputChange(row.id, 'check_in', e.target.value)} style={{ width: '140px' }} />
                                                    </TableCell>
                                                    <TableCell sx={{ fontWeight: '400', color: '#7f7f7f', fontSize: '14px' }}>
                                                        <TextField size="small" type="time" value={row.check_out || ''} onChange={(e) => handleInputChange(row.id, 'check_out', e.target.value)} style={{ width: '140px' }} />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button
                                                            onClick={() =>
                                                                handleUpdate(row.id, {
                                                                    leave_category_id: row.leave_category_id ?? '',
                                                                    check_in: row.check_in,
                                                                    check_out: row.check_out,
                                                                    status: row.status,
                                                                })
                                                            }
                                                            variant="contained"
                                                            size="small"
                                                            disabled={loadingRows[row.id] || false} // Disable only if that row is loading
                                                            style={{
                                                                backgroundColor: row.check_in && row.check_out ? '#e3f2fd' : '#063455',
                                                                color: row.check_in && row.check_out ? '#063455' : 'white',
                                                                textTransform: 'none',
                                                            }}
                                                        >
                                                            {loadingRows[row.id] ? <CircularProgress size={20} color="inherit" /> : row.check_in && row.check_out ? 'Update' : 'Save'}
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={8} align="center">
                                                    No attendances found.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                        </TableContainer>

                        <Box sx={{ display: 'flex', justifyContent: 'end', mt: 2 }}>
                            <Pagination count={totalPages} page={currentPage} onChange={(e, page) => setCurrentPage(page)} shape="rounded" />
                        </Box>
                    </SurfaceCard>
                </EmployeeHrPageShell>
            </LocalizationProvider>

            <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={handleCloseSnackbar}>
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} variant="filled">
                    {snackbar.message}
                </Alert>
            </Snackbar>

            {/* Confirmation Modal for Apply Standard Attendance */}
            <Dialog open={confirmModalOpen} onClose={() => setConfirmModalOpen(false)} aria-labelledby="confirm-dialog-title" aria-describedby="confirm-dialog-description">
                <DialogTitle id="confirm-dialog-title" sx={{ fontWeight: 600, color: '#063455' }}>
                    Confirm Apply Standard Attendance
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="confirm-dialog-description">
                        Are you sure you want to apply standard attendance for <strong>{date.format('DD/MM/YYYY')}</strong>?
                        <br />
                        <br />
                        This will:
                        <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                            <li>
                                Mark all employees with assigned shifts as <strong>Present</strong> with their shift times
                            </li>
                            <li>
                                Mark employees whose shift has today as a weekend as <strong>Weekend</strong>
                            </li>
                            <li>Overwrite any existing attendance for the selected date</li>
                        </ul>
                        <strong>Note:</strong> Only employees with assigned shifts will be affected.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setConfirmModalOpen(false)} variant="outlined" sx={{ borderRadius: '16px', textTransform: 'none' }}>
                        Cancel
                    </Button>
                    <Button onClick={handleApplyStandardAttendance} variant="contained" color="success" disabled={applyLoading} sx={{ borderRadius: '16px', textTransform: 'none' }}>
                        {applyLoading ? <CircularProgress size={20} sx={{ color: 'white', mr: 1 }} /> : null}
                        Apply Now
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default ManageAttendance;
