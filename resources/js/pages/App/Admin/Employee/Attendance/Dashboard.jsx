import React, { useEffect, useState } from 'react';
import { Button, Card, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Paper, CircularProgress, Pagination, IconButton, FormControl, InputLabel, Select, MenuItem, TextField, Grid, Box, Chip, Tooltip } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CategoryIcon from '@mui/icons-material/Category';
import AssignmentIcon from '@mui/icons-material/Assignment';
import SettingsIcon from '@mui/icons-material/Settings';
import BarChartIcon from '@mui/icons-material/BarChart';
import DescriptionIcon from '@mui/icons-material/Description';
import EventNoteIcon from '@mui/icons-material/EventNote';
import EventSeatIcon from '@mui/icons-material/EventSeat';
import PeopleIcon from '@mui/icons-material/People';
import PrintIcon from '@mui/icons-material/Print';
import EditIcon from '@mui/icons-material/Edit';
import Add from '@mui/icons-material/Add';
import Search from '@mui/icons-material/Search';
import { router, usePage } from '@inertiajs/react';
import { FaEdit } from 'react-icons/fa';
// const drawerWidthOpen = 240;
// const drawerWidthClosed = 110;

const AttendanceDashboard = () => {
    const { props } = usePage();
    const { employees, stats, departments, filters } = props; // coming from Laravel
    const [searchTerm, setSearchTerm] = useState(filters?.search || '');
    const [selectedDepartments, setSelectedDepartments] = useState(filters?.department_ids || []);
    const [isLoading, setIsLoading] = useState(false);
    // const [open, setOpen] = useState(true);

    const handleFilter = () => {
        setIsLoading(true);
        router.get(
            route('employees.attendances.dashboard'),
            {
                search: searchTerm,
                department_ids: selectedDepartments,
                page: 1, // Reset to first page when filtering
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
        setSelectedDepartments([]);
        setSearchTerm('');
        router.get(
            route('employees.attendances.dashboard'),
            {},
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const handleSearch = () => {
        router.get(
            route('employees.attendances.dashboard'),
            {
                search: searchTerm,
                department_ids: selectedDepartments,
                page: 1, // Reset to first page when searching
            },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const handleClearSearch = () => {
        setSearchTerm('');
        router.get(
            route('employees.attendances.dashboard'),
            {
                department_ids: selectedDepartments,
            },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    return (
        <>
            {/* <SideNav open={open} setOpen={setOpen} /> */}
            <div
                style={{
                    minHeight: '100vh',
                    backgroundColor: '#f5f5f5',
                }}
            >
                <div style={{ padding: '1rem' }}>
                    <div style={{ backgroundColor: 'transparent' }}>
                        <div style={{ display: 'flex', width: '98%', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography style={{ fontWeight: '700', color: '#063455', fontSize: '30px' }}>
                                Application Dashboard
                            </Typography>
                            <Button variant='contained' startIcon={<Add style={{ marginBottom: 3 }} />} style={{ color: 'white', backgroundColor: '#063455', borderRadius: '16px', textTransform: 'none' }} onClick={() => router.visit(route('employees.leaves.application.create'))}>
                                New Application
                            </Button>
                        </div>
                        <Typography sx={{ color: '#063455', fontSize: '15px', fontWeight: '600' }}>
                            Tracks presence, absence, late entries, and overtime
                        </Typography>

                        <div
                            style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                justifyContent: 'center',
                                gap: '50px',
                                width: '98%',
                                marginBottom: '24px',
                                marginTop: '2rem'
                            }}
                        >
                            {[
                                // {
                                //     label: 'Leave Category',
                                //     icon: <CategoryIcon style={{ color: '#fff' }} />,
                                //     // bgColor: '#063455',
                                //     // borderColor: '#FFE0C2',
                                //     path: route('employees.leaves.category.index'),
                                // },
                                // {
                                //     label: 'Leave Application',
                                //     icon: <AssignmentIcon style={{ color: '#fff' }} />,
                                //     // bgColor: '#063455',
                                //     // borderColor: '#FCCFEF',
                                //     path: route('employees.leaves.application.index'),
                                // },
                                {
                                    label: 'Leave Management',
                                    icon: <SettingsIcon style={{ color: '#fff' }} />,
                                    // bgColor: '#063455',
                                    // borderColor: '#A4FFBF',
                                    path: route('employees.leaves.application.index'),
                                },
                                // {
                                //     label: 'Leave Report',
                                //     icon: <BarChartIcon style={{ color: '#fff' }} />,
                                //     // bgColor: '#063455',
                                //     // borderColor: '#BEC0FF',
                                //     path: route('employees.leaves.application.report'),
                                // },
                                {
                                    label: 'Manage Attendance',
                                    icon: <AssignmentIcon style={{ color: '#fff' }} />,
                                    // bgColor: '#063455',
                                    // borderColor: '#F8EF91',
                                    path: route('employees.attendances.management'),
                                },
                                {
                                    label: 'Monthly Report',
                                    icon: <DescriptionIcon style={{ color: '#fff' }} />,
                                    // bgColor: '#063455',
                                    // borderColor: '#A6FFD7',
                                    path: route('employees.attendances.monthly.report'),
                                },
                                {
                                    label: 'Attendance Report',
                                    icon: <EventNoteIcon style={{ color: '#fff' }} />,
                                    // bgColor: '#063455',
                                    // borderColor: '#B8FF8F',
                                    path: route('employees.attendances.report'),
                                },
                                // {
                                //     label: 'Leave Reports',
                                //     icon: <BarChartIcon style={{ color: '#fff' }} />,
                                //     // bgColor: '#063455',
                                //     // borderColor: '#BEC0FF',
                                //     path: route('employees.leaves.application.report'),
                                // },
                            ].map((card, index) => (
                                <div
                                    key={index}
                                    style={{
                                        flex: '1 1 calc(25% - 50px)', // 4 items per row
                                        maxWidth: '220px',
                                        maxHeight: '160px',
                                        padding: '20px',
                                        backgroundColor: '#063455',
                                        borderRadius: '16px',
                                        border: `2px solid ${card.borderColor}`,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        textAlign: 'center',
                                    }}
                                    onClick={() => card.path && router.visit(card.path)}
                                >
                                    <div
                                        style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '50%',
                                            // backgroundColor: "#fff",
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            marginBottom: '12px',
                                        }}
                                    >
                                        {card.icon}
                                    </div>
                                    <div style={{ fontSize: '14px', color: '#fff' }}>{card.label}</div>
                                </div>
                            ))}
                        </div>

                        {/* Filter Section */}
                        <Box sx={{ mb: 3 }}>
                            <Typography sx={{ fontWeight: 600, fontSize: '18px', color: '#063455', mb: 3 }}>Search & Filter Options</Typography>

                            {/* Search Fields */}
                            <Grid container spacing={2} sx={{ mb: 3 }}>
                                <Grid item xs={12} md={3}>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        placeholder="Search by name, ID, email, or designation..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                                handleFilter();
                                            }
                                        }}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 16,
                                            },
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12} md={3}>
                                    {/* <FormControl fullWidth size="small">
                                        <InputLabel>Departments</InputLabel>
                                        <Select
                                            multiple
                                            value={selectedDepartments}
                                            label="Departments"
                                            onChange={(e) => setSelectedDepartments(e.target.value)}
                                            renderValue={(selected) => (
                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                    {selected.map((value) => {
                                                        const dept = departments?.find((d) => d.id === value);
                                                        return (
                                                            <Chip
                                                                key={value}
                                                                label={dept?.name || value}
                                                                size="small"
                                                                sx={{
                                                                    backgroundColor: '#063455',
                                                                    color: 'white',
                                                                    '& .MuiChip-deleteIcon': {
                                                                        color: 'white',
                                                                    },
                                                                }}
                                                            />
                                                        );
                                                    })}
                                                </Box>
                                            )}
                                            sx={{
                                                borderRadius: 16,
                                            }}
                                        >
                                            {departments?.map((dept) => (
                                                <MenuItem key={dept.id} value={dept.id}>
                                                    {dept.name}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl> */}
                                    <FormControl fullWidth size="small">
                                        <InputLabel>Departments</InputLabel>

                                        <Select
                                            multiple
                                            value={selectedDepartments}
                                            label="Departments"
                                            onChange={(e) => setSelectedDepartments(e.target.value)}
                                            renderValue={(selected) => (
                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                    {selected.map((value) => {
                                                        const dept = departments?.find((d) => d.id === value);
                                                        return (
                                                            <Chip
                                                                key={value}
                                                                label={dept?.name || value}
                                                                size="small"
                                                                sx={{
                                                                    backgroundColor: '#063455',
                                                                    color: '#fff',
                                                                    '& .MuiChip-deleteIcon': {
                                                                        color: '#fff',
                                                                    },
                                                                }}
                                                            />
                                                        );
                                                    })}
                                                </Box>
                                            )}
                                            sx={{
                                                borderRadius: 16,
                                            }}
                                            MenuProps={{
                                                PaperProps: {
                                                    sx: {
                                                        '& .MuiMenuItem-root': {
                                                            borderRadius: '16px',
                                                            mx: '8px',
                                                            my: '0.3px'
                                                        },
                                                        '& .MuiMenuItem-root:hover': {
                                                            backgroundColor: '#063455',
                                                            color: '#fff',
                                                        },
                                                        '& .MuiMenuItem-root.Mui-selected': {
                                                            backgroundColor: '#063455',
                                                            color: '#fff',
                                                        },
                                                        '& .MuiMenuItem-root.Mui-selected:hover': {
                                                            backgroundColor: '#063455',
                                                            color: '#fff',
                                                        },
                                                    },
                                                },
                                            }}
                                        >
                                            {departments?.map((dept) => (
                                                <MenuItem key={dept.id} value={dept.id}>
                                                    {dept.name}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>

                                </Grid>
                                <Grid item xs={12} md={1.5}>
                                    <Button
                                        fullWidth
                                        startIcon={<Search />}
                                        variant="contained"
                                        onClick={handleFilter}
                                        disabled={isLoading}
                                        sx={{
                                            backgroundColor: '#063455',
                                            color: 'white',
                                            textTransform: 'none',
                                            borderRadius: 16,
                                            height: '40px',
                                            '&:hover': {
                                                backgroundColor: '#052d45',
                                            },
                                            '&:disabled': {
                                                backgroundColor: '#ccc',
                                                color: '#666',
                                            },
                                        }}
                                    >
                                        {isLoading ? (
                                            <>
                                                <CircularProgress size={16} sx={{ mr: 1, color: 'inherit' }} />
                                                Loading...
                                            </>
                                        ) : (
                                            'Search'
                                        )}
                                    </Button>
                                </Grid>
                                {(selectedDepartments.length > 0 || searchTerm) && (
                                    // <Grid container spacing={2}>
                                    <Grid item xs={12} md={1.5}>
                                        <Button
                                            fullWidth
                                            variant="outlined"
                                            onClick={handleClearFilters}
                                            sx={{
                                                color: '#063455',
                                                borderColor: '#063455',
                                                textTransform: 'none',
                                                borderRadius: 16,
                                                height: '40px',
                                                '&:hover': {
                                                    borderColor: '#052d45',
                                                    backgroundColor: 'rgba(6, 52, 85, 0.04)',
                                                },
                                            }}
                                        >
                                            Reset
                                        </Button>
                                    </Grid>
                                    // </Grid>
                                )}
                            </Grid>
                        </Box>

                        {/* Employee List Section */}
                        <div style={{ backgroundColor: 'white', width: '98%', borderRadius: '12px', padding: '24px' }}>
                            <div style={{ marginBottom: '24px' }}>
                                <div style={{ fontSize: '18px', fontWeight: '500', padding: '0 1rem' }}>Employee List</div>
                            </div>

                            <TableContainer component={Paper} style={{ borderRadius: '12px' }}>
                                <Table>
                                    <TableHead style={{ backgroundColor: '#063455', height: 30 }}>
                                        <TableRow>
                                            <TableCell style={{ color: '#fff', fontWeight: '600', }}>EMP ID</TableCell>
                                            <TableCell style={{ color: '#fff', fontWeight: '600', }}>Name</TableCell>
                                            <TableCell style={{ color: '#fff', fontWeight: '600', }}>Department</TableCell>
                                            <TableCell style={{ color: '#fff', fontWeight: '600', }}>Designation</TableCell>
                                            <TableCell style={{ color: '#fff', fontWeight: '600', whiteSpace: 'nowrap' }}>Joining Date</TableCell>
                                            <TableCell style={{ color: '#fff', fontWeight: '600', whiteSpace: 'nowrap' }}>Email Address</TableCell>
                                            <TableCell style={{ color: '#fff', fontWeight: '600', whiteSpace: 'nowrap' }}>Employee Status</TableCell>
                                            <TableCell style={{ color: '#fff', fontWeight: '600', }}>Actions</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {employees.data.length > 0 ? (
                                            employees.data.map((emp) => {
                                                // Check if department or employee type is deleted (has deleted_at field)
                                                const isDepartmentDeleted = emp.department?.deleted_at !== null;
                                                const hasDeletedRelation = isDepartmentDeleted;

                                                const rowStyle = hasDeletedRelation
                                                    ? {
                                                        backgroundColor: '#ffebee', // Light red background
                                                        color: '#d32f2f', // Red text
                                                        opacity: 0.7,
                                                    }
                                                    : {};

                                                return (
                                                    <TableRow key={emp.id} style={rowStyle}>
                                                        <TableCell style={hasDeletedRelation ? { color: '#d32f2f' } : {
                                                            color: '#000', fontWeight: '600',
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
                                                        <TableCell style={hasDeletedRelation ? { color: '#d32f2f' } : {
                                                            color: '#7f7f7f', fontWeight: '400',
                                                            fontSize: '14px',
                                                            textOverflow: 'ellipsis',
                                                            overflow: 'hidden',
                                                            maxWidth: '120px',
                                                            whiteSpace: 'nowrap'
                                                        }}>
                                                            <Tooltip title={emp.name} arrow>
                                                                {emp.name}
                                                            </Tooltip>
                                                        </TableCell>
                                                        <TableCell style={hasDeletedRelation ? { color: '#d32f2f' } : { color: '#7f7f7f', fontWeight: '400', fontSize: '14px' }}>
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
                                                        <TableCell style={hasDeletedRelation ? { color: '#d32f2f' } : { color: '#7f7f7f', fontWeight: '400', fontSize: '14px' }}>{emp.designation}</TableCell>
                                                        <TableCell style={hasDeletedRelation ? { color: '#d32f2f' } : { color: '#7f7f7f', fontWeight: '400', fontSize: '14px' }}>{emp.joining_date}</TableCell>
                                                        <TableCell style={hasDeletedRelation ? { color: '#d32f2f' } : {
                                                            color: '#7f7f7f', fontWeight: '400',
                                                            fontSize: '14px',
                                                            textOverflow: 'ellipsis',
                                                            overflow: 'hidden',
                                                            maxWidth: '120px',
                                                            whiteSpace: 'nowrap'
                                                        }}>
                                                            <Tooltip title={emp.email} arrow>
                                                                {emp.email}
                                                            </Tooltip>
                                                        </TableCell>
                                                        <TableCell style={hasDeletedRelation ? { color: '#d32f2f' } : { color: '#7f7f7f', fontWeight: '400', fontSize: '14px' }}>
                                                            {hasDeletedRelation ? (
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
                                                                    Needs Attention
                                                                    {isDepartmentDeleted ? ' (Department)' : ''}
                                                                </Typography>
                                                            ) : (
                                                                (emp.status ?? 'Active')
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            <IconButton
                                                                onClick={() => router.visit(route('employees.edit', emp.id))}
                                                            >
                                                                <FaEdit size={18} style={{ marginRight: 10, color: '#f57c00' }} />
                                                            </IconButton>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={9} align="center">
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
                                    count={employees.last_page}
                                    page={employees.current_page}
                                    onChange={(e, page) =>
                                        router.get(route('employees.attendances.dashboard'), {
                                            page,
                                            search: searchTerm,
                                            department_ids: selectedDepartments,
                                        })
                                    }
                                />
                            </Box>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AttendanceDashboard;
