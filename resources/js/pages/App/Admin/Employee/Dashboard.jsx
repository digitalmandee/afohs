import React, { useState, useEffect } from 'react';
import { usePage, router } from '@inertiajs/react';
import { Autocomplete, Tooltip, Button, Card, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Paper, CircularProgress, Pagination, IconButton, FormControl, InputLabel, Select, MenuItem, TextField, Grid, Box, Chip, Avatar } from '@mui/material';
import EventSeatIcon from '@mui/icons-material/EventSeat';
import PeopleIcon from '@mui/icons-material/People';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PrintIcon from '@mui/icons-material/Print';
import Search from '@mui/icons-material/Search';
import { FaEdit, FaTrash } from 'react-icons/fa';
import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import axios from 'axios';
import TransferModal from './TransferModal';
import { FaExchangeAlt } from 'react-icons/fa';

const EmployeeDashboard = () => {
    const { props } = usePage();
    const { employees, companyStats, departments: initialDepartments, overviewStats } = props;
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });
    const [transferModal, setTransferModal] = useState({ open: false, employee: null });

    const handleTransferClick = (employee) => {
        setTransferModal({ open: true, employee });
    };

    const handleDeleteClick = (id) => {
        setDeleteDialog({ open: true, id });
    };

    const handleConfirmDelete = () => {
        router.delete(route('employees.destroy', deleteDialog.id), {
            onSuccess: () => setDeleteDialog({ open: false, id: null }),
            onError: () => setDeleteDialog({ open: false, id: null }), // Handle error properly if needed
        });
    };

    // Filter states with Autocomplete
    const [departments, setDepartments] = useState(initialDepartments || []);
    const [subdepartments, setSubdepartments] = useState([]);
    const [branches, setBranches] = useState([]);
    const [shifts, setShifts] = useState([]);
    const [designations, setDesignations] = useState([]);

    const [filters, setFilters] = useState({
        department_id: null,
        subdepartment_id: null,
        branch_id: null,
        shift_id: null,
        designation_id: null,
    });

    // Fetch filter options on mount
    useEffect(() => {
        const fetchFilterData = async () => {
            try {
                const [branchesRes, shiftsRes, designationsRes, departmentsRes] = await Promise.all([axios.get(route('branches.list')), axios.get(route('shifts.list')), axios.get(route('designations.list')), axios.get(route('api.departments.listAll'))]);

                if (branchesRes.data.success) setBranches(branchesRes.data.branches || []);
                if (shiftsRes.data.success) setShifts(shiftsRes.data.shifts || []);
                if (designationsRes.data.success) setDesignations(designationsRes.data.data || []);
                if (departmentsRes.data.results) setDepartments(departmentsRes.data.results || []);
            } catch (error) {
                console.error('Error fetching filter data:', error);
            }
        };
        fetchFilterData();
    }, []);

    // Fetch subdepartments when department changes
    useEffect(() => {
        if (filters.department_id) {
            axios
                .get(route('api.subdepartments.listAll', { department_id: filters.department_id.id }))
                .then((res) => setSubdepartments(res.data.results || []))
                .catch((err) => console.error(err));
        } else {
            setSubdepartments([]);
            setFilters((prev) => ({ ...prev, subdepartment_id: null }));
        }
    }, [filters.department_id]);

    const handleFilter = () => {
        setIsLoading(true);
        router.get(
            route('employees.dashboard'),
            {
                search: searchTerm,
                department_id: filters.department_id?.id,
                subdepartment_id: filters.subdepartment_id?.id,
                branch_id: filters.branch_id?.id,
                shift_id: filters.shift_id?.id,
                designation_id: filters.designation_id?.id,
                page: 1,
            },
            {
                preserveState: true,
                preserveScroll: true,
                onFinish: () => setIsLoading(false),
                onError: () => setIsLoading(false),
            },
        );
    };

    const handleClearFilters = () => {
        setSearchTerm('');
        setFilters({
            department_id: null,
            subdepartment_id: null,
            branch_id: null,
            shift_id: null,
            designation_id: null,
        });
        router.get(
            route('employees.dashboard'),
            {},
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const autocompleteStyle = {
        minWidth: 160,
        '& .MuiOutlinedInput-root': {
            borderRadius: '16px',
        },
    };

    const capitalizeFirst = (text = '') =>
        text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();

    return (
        <>
            <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
                <Box sx={{ px: 2, py: 2 }}>
                    <div style={{ paddingTop: '1rem' }}>
                        {/* Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography style={{ color: '#063455', fontWeight: '700', fontSize: '30px' }}>Employee Management</Typography>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <Button variant="contained" startIcon={<span style={{ fontSize: '1.5rem', marginBottom: 5 }}>+</span>} style={{ color: 'white', backgroundColor: '#063455', borderRadius: '16px', height: 35, textTransform: 'none' }} onClick={() => router.visit(route('employees.create'))}>
                                    Add Employee
                                </Button>
                                <Button
                                    onClick={() => router.visit(route('employees.trashed'))}
                                    style={{
                                        // color: '#063455',
                                        // backgroundColor: 'white',
                                        borderRadius: '16px',
                                        height: 35,
                                        marginLeft: '10px',
                                        textTransform: 'none',
                                        // border: '1px solid #063455',
                                    }}
                                    variant="outlined"
                                    color='error'
                                    startIcon={<FaTrash size={14} />}
                                >
                                    Trashed
                                </Button>
                            </div>
                        </div>
                        <Typography sx={{ color: '#063455', fontSize: '15px', fontWeight: '600' }}>Overview of staff strength, attendance status, and pending HR actions</Typography>

                        <Grid container spacing={3} sx={{ mb: 4, mt: 1 }}>
                            <Grid item xs={12} sm={6} md={3}>
                                <Card sx={{ borderRadius: '16px', border: '1px solid #E9E9E9' }}>
                                    <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <Box>
                                            <Typography sx={{ color: '#063455', fontWeight: 700, fontSize: '20px' }}>{overviewStats?.total_employees ?? 0}</Typography>
                                            <Typography sx={{ color: '#7F7F7F', fontWeight: 600, fontSize: '14px' }}>Total Employees</Typography>
                                        </Box>
                                        <PeopleIcon sx={{ color: '#063455' }} />
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Card sx={{ borderRadius: '16px', border: '1px solid #E9E9E9' }}>
                                    <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <Box>
                                            <Typography sx={{ color: '#2E7D32', fontWeight: 700, fontSize: '20px' }}>{overviewStats?.present_today ?? 0}</Typography>
                                            <Typography sx={{ color: '#7F7F7F', fontWeight: 600, fontSize: '14px' }}>Present Today</Typography>
                                        </Box>
                                        <EventSeatIcon sx={{ color: '#2E7D32' }} />
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Card sx={{ borderRadius: '16px', border: '1px solid #E9E9E9' }}>
                                    <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <Box>
                                            <Typography sx={{ color: '#d32f2f', fontWeight: 700, fontSize: '20px' }}>{overviewStats?.absent_today ?? 0}</Typography>
                                            <Typography sx={{ color: '#7F7F7F', fontWeight: 600, fontSize: '14px' }}>Absent Today</Typography>
                                        </Box>
                                        <AssignmentIcon sx={{ color: '#d32f2f' }} />
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Card sx={{ borderRadius: '16px', border: '1px solid #E9E9E9' }}>
                                    <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <Box>
                                            <Typography sx={{ color: '#063455', fontWeight: 700, fontSize: '20px' }}>{overviewStats?.active_salary_structures ?? 0}</Typography>
                                            <Typography sx={{ color: '#7F7F7F', fontWeight: 600, fontSize: '14px' }}>Active Salary Structures</Typography>
                                        </Box>
                                        <PrintIcon sx={{ color: '#063455' }} />
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>

                        {/* Company Stats Grid */}
                        <Typography sx={{ fontWeight: 600, fontSize: '20px', color: '#063455', mb: 2, mt: 3 }}>Company Overview</Typography>
                        <Grid container spacing={3} sx={{ mb: 4 }}>
                            {companyStats?.map((company) => (
                                <Grid item xs={12} sm={6} md={3} key={company.id}>
                                    <Card
                                        sx={{
                                            borderRadius: '16px',
                                            boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.05)',
                                            border: '1px solid #E9E9E9',
                                            height: '100%',
                                            backgroundColor: '#063455',
                                        }}
                                    >
                                        <CardContent>
                                            <Typography sx={{ color: '#ffffff', fontSize: '16px', fontWeight: 600, mb: 1 }}>{company.name}</Typography>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                                <Typography sx={{ color: '#ffffff', fontSize: '14px' }}>Total Employees</Typography>
                                                <Typography sx={{ color: '#ffffff', fontSize: '18px', fontWeight: 700 }}>{company.total_employees}</Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                                <Typography sx={{ color: '#81c784', fontSize: '13px' }}>Present: {company.present}</Typography>
                                                <Typography sx={{ color: '#e57373', fontSize: '13px' }}>Absent: {company.absent}</Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                                                <Typography sx={{ color: '#ffb74d', fontSize: '13px' }}>Weekend: {company.weekend}</Typography>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>

                        {/* Filter Section */}
                        <Box sx={{ mb: 3 }}>
                            {/* Search and Filters - Single Row */}
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>
                                <TextField
                                    size="small"
                                    placeholder="Search by Name, ID, CNIC..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') handleFilter();
                                    }}
                                    sx={{
                                        minWidth: 250,
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: '16px',
                                            // backgroundColor: '#fff',
                                        },
                                    }}
                                />
                                <Autocomplete
                                    size="small"
                                    options={branches}
                                    getOptionLabel={(option) => option.name || ''}
                                    value={filters.branch_id}
                                    onChange={(e, value) => setFilters({ ...filters, branch_id: value })}
                                    renderInput={(params) => <TextField {...params} placeholder="Company" />}
                                    sx={{
                                        minWidth: 250,
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: '16px',
                                            // backgroundColor: '#fff',
                                        },
                                    }}
                                    ListboxProps={{
                                        sx: {

                                            '& .MuiAutocomplete-option': {
                                                borderRadius: '16px',
                                                mx: '8px',
                                            },
                                            '& .MuiAutocomplete-option:hover': {
                                                backgroundColor: '#063455',
                                                color: '#fff',
                                            },
                                            '& .MuiAutocomplete-option[aria-selected="true"]': {
                                                backgroundColor: '#063455',
                                                color: '#fff',
                                            },
                                        },
                                    }}
                                />
                                <Autocomplete
                                    size="small"
                                    options={departments}
                                    getOptionLabel={(option) => option.name || ''}
                                    value={filters.department_id}
                                    onChange={(e, value) => setFilters({ ...filters, department_id: value, subdepartment_id: null })}
                                    renderInput={(params) => <TextField {...params} placeholder="Department" />}
                                    sx={{
                                        minWidth: 250,
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: '16px',
                                        },
                                    }}
                                    ListboxProps={{
                                        sx: {

                                            '& .MuiAutocomplete-option': {
                                                borderRadius: '16px',
                                                mx: '8px',
                                            },
                                            '& .MuiAutocomplete-option:hover': {
                                                backgroundColor: '#063455',
                                                color: '#fff',
                                            },
                                            '& .MuiAutocomplete-option[aria-selected="true"]': {
                                                backgroundColor: '#063455',
                                                color: '#fff',
                                            },
                                        },
                                    }}
                                />
                                <Autocomplete
                                    size="small"
                                    options={subdepartments}
                                    getOptionLabel={(option) => option.name || ''}
                                    value={filters.subdepartment_id}
                                    disabled={!filters.department_id}
                                    onChange={(e, value) => setFilters({ ...filters, subdepartment_id: value })}
                                    renderInput={(params) => <TextField {...params} placeholder="SubDept" />}
                                    sx={{
                                        minWidth: 250,
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: '16px',
                                            // backgroundColor: '#fff',
                                        },
                                    }}
                                    ListboxProps={{
                                        sx: {

                                            '& .MuiAutocomplete-option': {
                                                borderRadius: '16px',
                                                mx: '8px',
                                            },
                                            '& .MuiAutocomplete-option:hover': {
                                                backgroundColor: '#063455',
                                                color: '#fff',
                                            },
                                            '& .MuiAutocomplete-option[aria-selected="true"]': {
                                                backgroundColor: '#063455',
                                                color: '#fff',
                                            },
                                        },
                                    }}
                                />
                                <Autocomplete
                                    size="small"
                                    options={designations}
                                    getOptionLabel={(option) => option.name || ''}
                                    value={filters.designation_id}
                                    onChange={(e, value) => setFilters({ ...filters, designation_id: value })}
                                    renderInput={(params) => <TextField {...params} placeholder="Designation" />}
                                    sx={{
                                        minWidth: 250,
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: '16px',
                                            // backgroundColor: '#fff',
                                        },
                                    }}
                                    ListboxProps={{
                                        sx: {

                                            '& .MuiAutocomplete-option': {
                                                borderRadius: '16px',
                                                mx: '8px',
                                            },
                                            '& .MuiAutocomplete-option:hover': {
                                                backgroundColor: '#063455',
                                                color: '#fff',
                                            },
                                            '& .MuiAutocomplete-option[aria-selected="true"]': {
                                                backgroundColor: '#063455',
                                                color: '#fff',
                                            },
                                        },
                                    }}
                                />
                                <Autocomplete
                                    size="small"
                                    options={shifts}
                                    getOptionLabel={(option) => option.name || ''}
                                    value={filters.shift_id}
                                    onChange={(e, value) => setFilters({ ...filters, shift_id: value })}
                                    renderInput={(params) => <TextField {...params} placeholder="Shift" />}
                                    sx={{
                                        minWidth: 250,
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: '16px',
                                            // backgroundColor: '#fff',
                                        },
                                    }}
                                    ListboxProps={{
                                        sx: {

                                            '& .MuiAutocomplete-option': {
                                                borderRadius: '16px',
                                                mx: '8px',
                                            },
                                            '& .MuiAutocomplete-option:hover': {
                                                backgroundColor: '#063455',
                                                color: '#fff',
                                            },
                                            '& .MuiAutocomplete-option[aria-selected="true"]': {
                                                backgroundColor: '#063455',
                                                color: '#fff',
                                            },
                                        },
                                    }}
                                />
                                <Button
                                    startIcon={<Search />}
                                    variant="contained"
                                    onClick={handleFilter}
                                    disabled={isLoading}
                                    sx={{
                                        backgroundColor: '#063455',
                                        color: 'white',
                                        textTransform: 'none',
                                        borderRadius: '20px',
                                        height: '40px',
                                        px: 3,
                                        '&:hover': { backgroundColor: '#052d45' },
                                        '&:disabled': { backgroundColor: '#ccc', color: '#666' },
                                    }}
                                >
                                    {isLoading ? <CircularProgress size={16} sx={{ color: 'inherit' }} /> : 'Search'}
                                </Button>
                                {/* {(searchTerm || filters.department_id || filters.branch_id || filters.shift_id || filters.designation_id) && ( */}
                                <Button
                                    variant="outlined"
                                    onClick={handleClearFilters}
                                    sx={{
                                        color: '#063455',
                                        borderColor: '#063455',
                                        textTransform: 'none',
                                        borderRadius: '20px',
                                        height: '40px',
                                        px: 4,
                                        '&:hover': { borderColor: '#052d45', backgroundColor: 'rgba(6,52,85,0.05)' },
                                    }}
                                >
                                    Reset
                                </Button>

                            </Box>
                        </Box>

                        {/* Employees Table */}
                        <TableContainer component={Paper} style={{ borderRadius: '12px', overflowX: 'auto' }}>
                            <Table>
                                <TableHead style={{ backgroundColor: '#063455', height: 30 }}>
                                    <TableRow>
                                        <TableCell style={{ color: '#fff', fontWeight: '600', whiteSpace: 'nowrap' }}>EMP ID</TableCell>
                                        <TableCell style={{ color: '#fff', fontWeight: '600', whiteSpace: 'nowrap' }}>Name</TableCell>
                                        <TableCell style={{ color: '#fff', fontWeight: '600', whiteSpace: 'nowrap' }}>Department</TableCell>
                                        <TableCell style={{ color: '#fff', fontWeight: '600', whiteSpace: 'nowrap' }}>Sub-department</TableCell>
                                        <TableCell style={{ color: '#fff', fontWeight: '600', whiteSpace: 'nowrap' }}>Designation</TableCell>
                                        <TableCell style={{ color: '#fff', fontWeight: '600', whiteSpace: 'nowrap' }}>Joining Date</TableCell>
                                        <TableCell style={{ color: '#fff', fontWeight: '600', whiteSpace: 'nowrap' }}>Email Address</TableCell>
                                        <TableCell style={{ color: '#fff', fontWeight: '600', whiteSpace: 'nowrap' }}>Contact</TableCell>
                                        <TableCell style={{ color: '#fff', fontWeight: '600', whiteSpace: 'nowrap' }}>Employee Status</TableCell>
                                        <TableCell style={{ color: '#fff', fontWeight: '600', whiteSpace: 'nowrap' }}>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {employees?.data?.length > 0 ? (
                                        employees.data.map((emp) => {
                                            // Check if department is deleted OR not assigned at all
                                            const isDepartmentDeleted = emp.department?.deleted_at !== null && emp.department?.deleted_at !== undefined;
                                            const hasNoDepartment = !emp.department_id || !emp.department;
                                            const needsAttention = isDepartmentDeleted || hasNoDepartment;

                                            const rowStyle = needsAttention
                                                ? {
                                                    backgroundColor: '#ffebee',
                                                }
                                                : {};

                                            const cellStyle = needsAttention ? { color: '#d32f2f', fontWeight: 400, fontSize: '14px' } : { color: '#7F7F7F', fontWeight: 400, fontSize: '14px' };

                                            return (
                                                <TableRow key={emp.id} style={rowStyle}>
                                                    <TableCell
                                                        style={{
                                                            color: '#000',
                                                            fontWeight: '600',
                                                            fontSize: '14px',
                                                            textOverflow: 'ellipsis',
                                                            overflow: 'hidden',
                                                            maxWidth: '100px',
                                                            whiteSpace: 'nowrap'
                                                        }}>
                                                        <Tooltip title={emp.employee_id} arrow>
                                                            {emp.employee_id}
                                                        </Tooltip>
                                                    </TableCell>
                                                    <TableCell style={cellStyle}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                            <Avatar src={emp.photo_url} alt={emp.name} sx={{ width: 40, height: 40, mr: 2, border: '1px solid #eee' }}>
                                                                {emp.name.charAt(0)}
                                                            </Avatar>
                                                            <div style={{
                                                                textOverflow: 'ellipsis',
                                                                overflow: 'hidden',
                                                                maxWidth: '100px',
                                                                whiteSpace: 'nowrap'
                                                            }}>
                                                                <Tooltip title={emp.name} arrow>
                                                                    {emp.name}
                                                                </Tooltip>
                                                            </div>
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell style={cellStyle}>
                                                        {emp.department?.name ? (
                                                            <>
                                                                {emp.department.name}
                                                                {isDepartmentDeleted && (
                                                                    <Typography
                                                                        variant="caption"
                                                                        style={{
                                                                            color: '#d32f2f',
                                                                            fontStyle: 'italic',
                                                                            display: 'block',
                                                                            fontSize: '0.7rem',
                                                                        }}
                                                                    >
                                                                        (Department Deleted)
                                                                    </Typography>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <Typography variant="caption" style={{ color: '#d32f2f', fontStyle: 'italic' }}>
                                                                No Department
                                                            </Typography>
                                                        )}
                                                    </TableCell>
                                                    <TableCell style={cellStyle}>
                                                        {emp.subdepartment?.name ? (
                                                            <>
                                                                {emp.subdepartment.name}
                                                                {emp.subdepartment?.deleted_at && (
                                                                    <Typography variant="caption" style={{ color: '#d32f2f', fontStyle: 'italic', display: 'block', fontSize: '0.7rem' }}>
                                                                        (Sub-dept Deleted)
                                                                    </Typography>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <Typography variant="caption" style={{ color: '#d32f2f', fontStyle: 'italic' }}>
                                                                No Sub-dept
                                                            </Typography>
                                                        )}
                                                    </TableCell>
                                                    <TableCell style={{
                                                        fontSize: '14px',
                                                        fontWeight: 400,
                                                        color: '#7f7f7f',
                                                        textOverflow: 'ellipsis',
                                                        overflow: 'hidden',
                                                        maxWidth: '100px',
                                                        whiteSpace: 'nowrap'
                                                    }}>
                                                        <Tooltip title={emp.designation?.name || emp.designation || '-'} arrow>
                                                            {emp.designation?.name || emp.designation || '-'}
                                                        </Tooltip>
                                                    </TableCell>
                                                    <TableCell style={cellStyle}>{emp.joining_date}</TableCell>
                                                    <TableCell style={{
                                                        fontSize: '14px',
                                                        fontWeight: 400,
                                                        color: '#7f7f7f',
                                                        textOverflow: 'ellipsis',
                                                        overflow: 'hidden',
                                                        maxWidth: '150px',
                                                        whiteSpace: 'nowrap'
                                                    }}>
                                                        <Tooltip title={emp.email} arrow>
                                                            {emp.email}
                                                        </Tooltip>
                                                    </TableCell>
                                                    <TableCell style={cellStyle}>
                                                        <Tooltip title={emp.phone_no || '-'} arrow>
                                                            {emp.phone_no || '-'}
                                                        </Tooltip>
                                                    </TableCell>
                                                    {/* <TableCell style={cellStyle}>
                                                        {needsAttention ? (
                                                            <Typography
                                                                variant="caption"
                                                                style={{
                                                                    color: '#d32f2f',
                                                                    fontWeight: 'bold',
                                                                    backgroundColor: '#ffcdd2',
                                                                    padding: '2px 8px',
                                                                    borderRadius: '4px',
                                                                }}
                                                            >
                                                                {hasNoDepartment ? 'No Department' : 'Dept Deleted'}
                                                            </Typography>
                                                        ) : (
                                                            (emp.status ?? 'Active')
                                                        )}
                                                    </TableCell> */}
                                                    <TableCell style={cellStyle}>
                                                        {needsAttention ? (
                                                            <Typography
                                                                variant="caption"
                                                                sx={{
                                                                    color: '#d32f2f',
                                                                    fontWeight: 'bold',
                                                                    backgroundColor: '#ffcdd2',
                                                                    px: 2,
                                                                    py: 0.7,
                                                                    borderRadius: '16px',
                                                                    display: 'inline-block',
                                                                    fontSize: '14px'
                                                                }}
                                                            >
                                                                {hasNoDepartment ? 'No Department' : 'Dept Deleted'}
                                                            </Typography>
                                                        ) : (
                                                            <Typography
                                                                variant="caption"
                                                                sx={{
                                                                    fontWeight: 'bold',
                                                                    px: 2,
                                                                    py: 0.7,
                                                                    borderRadius: '16px',
                                                                    fontSize: '14px',
                                                                    display: 'inline-block',
                                                                    color: emp.status === 'inactive' ? '#d32f2f' : '#2E7D32',
                                                                    border: `1px solid ${emp.status === 'inactive' ? '#d32f2f' : '#2E7D32'
                                                                        }`,
                                                                }}
                                                            >
                                                                {capitalizeFirst(emp.status ?? 'active')}
                                                            </Typography>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <IconButton
                                                            onClick={() => router.visit(route('employees.edit', emp.id))}
                                                            size="small"
                                                            sx={{
                                                                color: '#0a3d62',
                                                                '&:hover': { backgroundColor: '#f5f5f5' },
                                                            }}
                                                        >
                                                            <FaEdit size={18} style={{ color: '#f57c00' }} />
                                                        </IconButton>
                                                        <IconButton
                                                            onClick={() => handleDeleteClick(emp.id)}
                                                            size="small"
                                                            sx={{
                                                                color: '#d32f2f',
                                                                '&:hover': { backgroundColor: '#ffebee' },
                                                            }}
                                                        >
                                                            <FaTrash size={16} />
                                                        </IconButton>

                                                        <IconButton
                                                            onClick={() => handleTransferClick(emp)}
                                                            size="small"
                                                            title="Transfer Employee"
                                                            sx={{
                                                                color: '#1976d2',
                                                                '&:hover': { backgroundColor: '#e3f2fd' },
                                                            }}
                                                        >
                                                            <FaExchangeAlt size={16} />
                                                        </IconButton>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={10} align="center">
                                                No employees found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        {/* Pagination */}
                        <Box sx={{ display: 'flex', justifyContent: 'end', mt: 3 }}>
                            <Pagination
                                count={employees?.last_page || 1}
                                page={employees?.current_page || 1}
                                onChange={(e, page) =>
                                    router.get(route('employees.dashboard'), {
                                        page,
                                        search: searchTerm,
                                        department_id: filters.department_id?.id,
                                        subdepartment_id: filters.subdepartment_id?.id,
                                        branch_id: filters.branch_id?.id,
                                        shift_id: filters.shift_id?.id,
                                        designation_id: filters.designation_id?.id,
                                    })
                                }
                            />
                        </Box>
                    </div>
                </Box>
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, id: null })} aria-labelledby="alert-dialog-title" aria-describedby="alert-dialog-description">
                <DialogTitle id="alert-dialog-title">{'Delete Employee?'}</DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">Are you sure you want to delete this employee? They can be restored later from the Trashed Employees page.</DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialog({ open: false, id: null })} color="primary">
                        Cancel
                    </Button>
                    <Button onClick={handleConfirmDelete} color="error" autoFocus>
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            <TransferModal
                open={transferModal.open}
                onClose={() => setTransferModal({ open: false, employee: null })}
                employee={transferModal.employee}
                onSuccess={() => {
                    router.visit(window.location.href, {
                        preserveScroll: true,
                        preserveState: true,
                        only: ['employees', 'companyStats'],
                    });
                }}
            />
        </>
    );
};

export default EmployeeDashboard;
