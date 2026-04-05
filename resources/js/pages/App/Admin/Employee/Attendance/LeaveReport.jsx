import React, { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';
import { CircularProgress, FormControl, InputAdornment, MenuItem, Select } from '@mui/material';
import { Search, ArrowBack } from '@mui/icons-material';
import { Table, TableBody, TableCell, TableContainer, TableHead, Button, TableRow, Paper, Pagination, TextField, Box, Typography } from '@mui/material';
import axios from 'axios';
import debounce from 'lodash.debounce';
import SurfaceCard from '@/components/App/ui/SurfaceCard';
import FilterToolbar from '@/components/App/ui/FilterToolbar';
import EmployeeHrPageShell from '@/components/App/Admin/EmployeeHrPageShell';

const LeaveReport = () => {
    // const [open, setOpen] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const currentDate = new Date();
    const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    const [month, setMonth] = useState(currentMonth);
    const [employees, setEmployees] = useState([]);
    const [leaveCategories, setLeaveCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [limit, setLimit] = useState(10);

    const getMonthlyReport = async (page = 1) => {
        setIsLoading(true);
        try {
            const res = await axios.get('/api/employees/leaves/reports', {
                params: { page, limit, month, search: searchTerm },
            });
            if (res.data.success) {
                setEmployees(res.data.report_data.employees);
                setLeaveCategories(res.data.report_data.leave_categories || []);
                setTotalPages(res.data.report_data.last_page);
                setCurrentPage(res.data.report_data.current_page);
            }
        } catch (error) {
            console.log(error);
        } finally {
            setIsLoading(false);
        }
    };

    const debouncedSearch = React.useMemo(
        () =>
            debounce((page = 1) => {
                setCurrentPage(page);
                getMonthlyReport(page);
            }, 300),
        [limit, month, searchTerm]
    );

    const handleClearSearch = async () => {
        setSearchTerm('');
        setCurrentPage(1);
        // Directly call API with empty search term
        setIsLoading(true);
        try {
            const res = await axios.get('/api/employees/leaves/reports', {
                params: { page: 1, limit, month, search: '' }, // Explicitly pass empty search
            });
            if (res.data.success) {
                setEmployees(res.data.report_data.employees);
                setTotalPages(res.data.report_data.last_page);
                setCurrentPage(res.data.report_data.current_page);
            }
        } catch (error) {
            console.log(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        getMonthlyReport(currentPage);
    }, [currentPage, limit, month]);

    useEffect(() => {
        debouncedSearch(1);
        return () => debouncedSearch.cancel();
    }, [searchTerm, debouncedSearch]);

    // Generate months dynamically
    const months = Array.from({ length: 12 }, (_, i) => {
        const monthValue = `${currentDate.getFullYear()}-${String(i + 1).padStart(2, '0')}`;
        return { value: monthValue, label: new Date(currentDate.getFullYear(), i, 1).toLocaleString('en-US', { month: 'long' }) };
    });

    return (
        <EmployeeHrPageShell
            title="Leave Report"
            subtitle="View detailed reports of employee leave history."
            actions={(
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <FormControl
                                size="small"
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: '16px',
                                    },
                                }}
                            >
                                <Select value={month}
                                    onChange={(e) => setMonth(e.target.value)}
                                    sx={{ minWidth: 150 }}
                                    MenuProps={{
                                        PaperProps: {
                                            sx: {
                                                borderRadius: '16px',
                                                maxHeight: '300px',
                                                overflowY: 'auto',
                                                py:1
                                            },
                                        },
                                        MenuListProps: {
                                            sx: {
                                                '& .MuiMenuItem-root': {
                                                    borderRadius: '16px',
                                                    mx: '8px',
                                                    my:0.3,
                                                    transition: 'all 0.2s ease',
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
                                    }}>
                                    {months.map((m) => (
                                        <MenuItem key={m.value} value={m.value}>
                                            {m.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <Button
                                variant="contained"
                                style={{ backgroundColor: '#063455', color: 'white', textTransform: 'none', borderRadius: '16px' }}
                                onClick={() => {
                                    const url = route('employees.leaves.application.report.print', {
                                        month: month,
                                    });
                                    window.open(url, '_blank');
                                }}
                            >
                                Print Report
                            </Button>
                            <Button
                                variant="contained"
                                style={{ backgroundColor: '#4caf50', color: 'white', textTransform: 'none', borderRadius: '16px' }}
                                onClick={() => {
                                    const url = route('api.leave-reports.export', {
                                        month: month,
                                    });
                                    window.location.href = url;
                                }}
                            >
                                Export Excel
                            </Button>
                        </Box>
            )}
        >
                    <FilterToolbar
                        title="Filters"
                        subtitle="Set leave report filters and click Apply."
                        lowChrome
                        onApply={() => {
                            setCurrentPage(1);
                            getMonthlyReport(1);
                        }}
                        onReset={handleClearSearch}
                    >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                                <TextField
                                    variant="outlined"
                                    placeholder="Search by name or employee ID..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
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
                            </Box>
                        </Box>
                    </FilterToolbar>
                    <SurfaceCard title="Leave Summary" subtitle="Monthly totals refresh without leaving the report.">
                    <TableContainer component={Paper} sx={{ borderRadius: '16px', overflowX: 'auto', boxShadow: 'none' }}>
                        <Table>
                            <TableHead>
                                <TableRow style={{ backgroundColor: '#063455' }}>
                                    <TableCell sx={{ fontWeight: '600', color: '#fff', }}>ID</TableCell>
                                    <TableCell sx={{ fontWeight: '600', color: '#fff', }}>Employee Name</TableCell>
                                    {leaveCategories.map((category) => (
                                        <TableCell key={category.id} sx={{ fontWeight: '600', color: '#fff', }}>
                                            {category.name}
                                        </TableCell>
                                    ))}
                                    <TableCell sx={{ fontWeight: '600', color: '#fff', }}>Total Attendance</TableCell>
                                    <TableCell sx={{ fontWeight: '600', color: '#fff', }}>Total Absence</TableCell>
                                    <TableCell sx={{ fontWeight: '600', color: '#fff', }}>Total Leave</TableCell>
                                </TableRow>
                            </TableHead>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={5 + leaveCategories.length} align="center">
                                        <CircularProgress sx={{ color: '#063455' }} />
                                    </TableCell>
                                </TableRow>
                            ) : employees.length > 0 ? (
                                employees.map((employee, index) => (
                                    <TableRow key={employee.employee_id}>
                                        <TableCell sx={{ fontWeight: '600', color: '#000', fontSize: '14px' }}>{employee.employee_id}</TableCell>
                                        <TableCell sx={{ fontWeight: '400', color: '#7f7f7f', fontSize: '14px' }}>{employee.employee_name}</TableCell>
                                        {leaveCategories.map((category) => {
                                            const categoryKey = category.name.replace(/\s+/g, '_');
                                            return <TableCell key={category.id}>{employee.leave_categories?.[categoryKey] || 0}</TableCell>;
                                        })}
                                        <TableCell sx={{ fontWeight: '400', color: '#7f7f7f', fontSize: '14px' }}>{employee.total_attendance}</TableCell>
                                        <TableCell sx={{ fontWeight: '400', color: '#7f7f7f', fontSize: '14px' }}>{employee.total_absence}</TableCell>
                                        <TableCell sx={{ fontWeight: '400', color: '#7f7f7f', fontSize: '14px' }}>{employee.total_leave}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5 + leaveCategories.length} align="center">
                                        No employees found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </Table>
                    </TableContainer>

                    {/* Pagination */}
                    <Box sx={{ display: 'flex', justifyContent: 'end', mt: 3 }}>
                        <Pagination count={totalPages} page={currentPage} onChange={(e, page) => setCurrentPage(page)} />
                    </Box>
                    </SurfaceCard>
        </EmployeeHrPageShell>
    );
};

export default LeaveReport;
