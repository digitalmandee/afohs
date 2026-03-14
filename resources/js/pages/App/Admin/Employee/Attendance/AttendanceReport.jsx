import React, { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';
import { ArrowBack } from '@mui/icons-material';
import { Button, TextField, MenuItem, Checkbox, Pagination, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Paper, CircularProgress, Box } from '@mui/material';
import axios from 'axios';

// const drawerWidthOpen = 240;
// const drawerWidthClosed = 110;

const AttendanceReport = () => {
    // const [open, setOpen] = useState(true);

    const currentDate = new Date();
    const [month, setMonth] = useState(currentDate.getMonth() + 1);
    const [year, setYear] = useState(currentDate.getFullYear());

    const getDaysInMonth = (month, year) => new Date(year, month, 0).getDate();

    const getWeekdayIndex = (day, month, year) => {
        return new Date(year, month - 1, day).getDay(); // 0 = Sunday, 6 = Saturday
    };

    const generateAttendance = (days, month, year) => {
        let attendance = Array(days).fill('');

        let weekdayIndexes = [];
        for (let i = 1; i <= days; i++) {
            let dayOfWeek = getWeekdayIndex(i, month, year);
            if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                // Only consider weekdays (Monday to Friday)
                weekdayIndexes.push(i - 1);
            }
        }

        let totalWeekdays = weekdayIndexes.length;
        let presentDays = Math.floor(totalWeekdays * 0.9); // 90% Present

        let shuffledIndexes = weekdayIndexes.sort(() => 0.5 - Math.random());
        shuffledIndexes.slice(0, presentDays).forEach((idx) => (attendance[idx] = 'P'));
        shuffledIndexes.slice(presentDays).forEach((idx) => {
            attendance[idx] = ['S', 'C', 'B', 'M', 'U'][Math.floor(Math.random() * 5)];
        });

        return attendance;
    };

    const [leaveCategories, setLeaveCategories] = useState([
        { id: 123, name: 'Present', color: '#6FC3AF', short_code: 'P' },
        { id: 124, name: 'Absent', color: '#FF6B6B', short_code: 'A' },
        { id: 125, name: 'Late', color: '#FFA500', short_code: 'L' },
    ]);
    const [employees, setEmployees] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [limit, setLimit] = useState(10);

    const getLeaveCatgories = async () => {
        try {
            const res = await axios.get('/api/leave-categories');

            if (res.data.success) {
                setLeaveCategories((prev) => [...prev, ...res.data.categories]);
            }
        } catch (error) {
            console.log(error);
        }
    };

    useEffect(() => {
        getLeaveCatgories();
    }, []);

    const getAttendances = async (page = 1) => {
        setIsLoading(true);
        try {
            const res = await axios.get('/api/attendances/reports', {
                params: { page, limit, month: `${year}-${month.toString().padStart(2, '0')}` },
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
        getAttendances(currentPage);
    }, [currentPage, limit, month, year]);

    const calculateTotalPresent = (attendance) => attendance.filter((status) => status.status === 'present' || status.status === 'late').length;

    const handleMonthChange = (event) => {
        const newMonth = parseInt(event.target.value);
        setMonth(newMonth);
        setEmployees(
            employees.map((emp) => ({
                ...emp,
                attendance: generateAttendance(getDaysInMonth(newMonth, year), newMonth, year),
            })),
        );
    };

    const handleYearChange = (event) => {
        const newYear = parseInt(event.target.value);
        setYear(newYear);
        setEmployees(
            employees.map((emp) => ({
                ...emp,
                attendance: generateAttendance(getDaysInMonth(month, newYear), month, newYear),
            })),
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
                <Box sx={{ px: 2, py: 2, overflowX: 'hidden' }}>
                    <div style={{ paddingTop: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography style={{ fontWeight: '700', color: '#063455', fontSize: '30px' }}>Attendance Report</Typography>
                        </div>
                        <Typography sx={{ color: '#063455', fontSize: '15px', fontWeight: '600' }}>Includes staff performance, attendance, and leave summaries</Typography>
                        <div style={{ display: 'flex', justifyContent: 'end', gap: '8px', marginTop: '1rem' }}>
                            {/* Month & Year Section */}
                            {/* <TextField
                                select
                                label="Month"
                                value={month}
                                onChange={handleMonthChange}
                                size="small"
                                SelectProps={{ native: true }}
                                sx={{
                                    backgroundColor: 'transparent',
                                    minWidth: '120px',
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: '16px',
                                    },
                                    '& .MuiOutlinedInput-notchedOutline': {
                                        borderRadius: '16px',
                                    },
                                }}
                            >
                                {[...Array(12)].map((_, i) => (
                                    <option key={i + 1} value={i + 1}>
                                        {new Date(0, i).toLocaleString('default', { month: 'long' })}
                                    </option>
                                ))}
                            </TextField> */}
                            <TextField
                                select
                                label="Month"
                                value={month}
                                onChange={handleMonthChange}
                                size="small"
                                sx={{
                                    backgroundColor: 'transparent',
                                    minWidth: '120px',
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: '16px',
                                    },
                                    '& .MuiOutlinedInput-notchedOutline': {
                                        borderRadius: '16px',
                                    },
                                }}
                                SelectProps={{
                                    MenuProps: {
                                        PaperProps: {
                                            sx: {
                                                borderRadius: '16px',
                                                maxHeight: '300px',
                                                overflowY: 'auto',
                                            },
                                        },
                                        MenuListProps: {
                                            sx: {
                                                '& .MuiMenuItem-root': {
                                                    borderRadius: '16px',
                                                    mx: '8px',
                                                    my:'1px',
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
                                    },
                                }}
                            >
                                {[...Array(12)].map((_, i) => (
                                    <MenuItem key={i + 1} value={i + 1}>
                                        {new Date(0, i).toLocaleString('default', { month: 'long' })}
                                    </MenuItem>
                                ))}
                            </TextField>


                            <TextField
                                type="number"
                                label="Year"
                                value={year}
                                onChange={handleYearChange}
                                size="small"
                                sx={{
                                    backgroundColor: 'transparent',
                                    width: '10%',
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: '16px',
                                    },
                                }} />
                            <Button
                                variant="contained"
                                style={{ backgroundColor: '#063455', color: 'white', textTransform: 'none', borderRadius: '16px' }}
                                onClick={() => {
                                    const url = route('employees.attendances.report.print', {
                                        month: `${year}-${month.toString().padStart(2, '0')}`,
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
                                    const url = route('api.attendances.reports.export', {
                                        month: `${year}-${month.toString().padStart(2, '0')}`,
                                    });
                                    window.location.href = url;
                                }}
                            >
                                Export Excel
                            </Button>
                        </div>

                        {/* Legend */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', marginTop: '1rem', marginBottom: '16px' }}>
                            {leaveCategories.map((item) => (
                                <div key={item.id} className="d-flex align-items-center px-3 py-1" style={{ width: '100%', maxWidth: '148px', backgroundColor: item.color, borderRadius: '6px', minWidth: 'fit-content', gap: '10px' }}>
                                    <span style={{ fontSize: '14px' }}>{item.name}</span>
                                    <span style={{ fontSize: '14px', fontWeight: '500', marginLeft: '4px' }}>{item.short_code}</span>
                                </div>
                            ))}
                        </div>

                        {/* Table */}
                        <div style={{ overflowX: 'auto', width: '100%' }}>
                            <Table
                                className="mb-0"
                                style={{
                                    width: '100%',
                                    backgroundColor: '#0a3d62',
                                    borderCollapse: 'separate',
                                    // borderSpacing: "2px",
                                    border: '1px solid #B9B9B9', // Light grey border around the table
                                    // borderRadius: "5px"
                                }}
                            >
                                <thead>
                                    <tr>
                                        <th
                                            rowSpan={2}
                                            style={{
                                                width: '60px',
                                                backgroundColor: '#0a3d62',
                                                color: 'white',
                                                padding: '10px',
                                                boxShadow: '0 0 0 1px #B9B9B9',
                                                textAlign: 'center',
                                                verticalAlign: 'middle',
                                            }}
                                        >
                                            ID
                                        </th>

                                        <th
                                            rowSpan={2}
                                            style={{
                                                // width: '100%',
                                                maxWidth: '200px',
                                                backgroundColor: '#0a3d62',
                                                color: 'white',
                                                padding: '10px',
                                                boxShadow: '0 0 0 1px #B9B9B9',
                                                textAlign: 'center',
                                                verticalAlign: 'middle',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                            }}
                                        >
                                            Employee Name
                                        </th>

                                        {/* Dates Row */}
                                        {[...Array(getDaysInMonth(month, year))].map((_, i) => (
                                            <th
                                                key={i}
                                                className="text-center"
                                                style={{
                                                    width: '40px',
                                                    padding: '8px 4px',
                                                    boxShadow: '0 0 0 1px #B9B9B9',
                                                    backgroundColor: '#0a3d62',
                                                    color: 'white',
                                                }}
                                            >
                                                {(i + 1).toString().padStart(2, '0')}
                                            </th>
                                        ))}

                                        <th
                                            rowSpan={2}
                                            className="text-center"
                                            style={{
                                                maxWidth: '100px',
                                                backgroundColor: '#0a3d62',
                                                color: 'white',
                                                boxShadow: '0 0 0 1px #B9B9B9',
                                                textAlign: 'center',
                                                verticalAlign: 'middle',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                            }}
                                        >
                                            Total Present
                                        </th>
                                    </tr>

                                    {/* Second Row - Weekdays */}
                                    <tr>
                                        {[...Array(getDaysInMonth(month, year))].map((_, i) => {
                                            let dayIndex = getWeekdayIndex(i + 1, month, year);
                                            return (
                                                <th
                                                    key={i}
                                                    className="text-center"
                                                    style={{
                                                        width: '40px',
                                                        padding: '8px 4px',
                                                        boxShadow: '0 0 0 1px #B9B9B9',
                                                        backgroundColor: dayIndex === 0 || dayIndex === 6 ? '#E0E8F0' : 'inherit',
                                                        color: dayIndex === 0 || dayIndex === 6 ? '#666' : 'white',
                                                    }}
                                                >
                                                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayIndex]}
                                                </th>
                                            );
                                        })}
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoading ? (
                                        <tr>
                                            <td className="py-2" style={{ textAlign: 'center' }} colSpan={getDaysInMonth(month, year) + 3}>
                                                <CircularProgress sx={{ color: '#E0E8F0' }} />
                                            </td>
                                        </tr>
                                    ) : employees.length > 0 ? (
                                        employees.map((employee, idx) => (
                                            <tr key={idx}>
                                                <td
                                                    style={{
                                                        padding: '10px',
                                                        backgroundColor: 'white',
                                                        boxShadow: '0 0 0 1px #B9B9B9',
                                                    }}
                                                >
                                                    {employee.employee_id}
                                                </td>
                                                <td
                                                    style={{
                                                        padding: '10px',
                                                        backgroundColor: 'white',
                                                        boxShadow: '0 0 0 1px #B9B9B9',
                                                    }}
                                                >
                                                    {employee.name}
                                                </td>
                                                {employee.attendances.map((attendance, i) => {
                                                    const leaveCategory = attendance.status === 'leave' ? attendance.leave_category : null;
                                                    const displayStatus = leaveCategory ? leaveCategory : attendance.status;

                                                    // Safely check for matching leave category
                                                    const status = displayStatus ? leaveCategories.find((item) => item.name.toLocaleLowerCase() === displayStatus.toLocaleLowerCase()) : null;

                                                    return (
                                                        <td
                                                            key={i}
                                                            className="text-center"
                                                            style={{
                                                                boxShadow: '0 0 0 1px #B9B9B9',
                                                                backgroundColor: status?.color || 'white',
                                                            }}
                                                        >
                                                            {status?.short_code || ''}
                                                        </td>
                                                    );
                                                })}

                                                <td
                                                    style={{
                                                        backgroundColor: 'white',
                                                        boxShadow: '0 0 0 1px #B9B9B9',
                                                    }}
                                                    className="text-center"
                                                >
                                                    {calculateTotalPresent(employee.attendances)}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td className="py-2 text-center" colSpan={getDaysInMonth(month, year) + 3}>
                                                No data found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </Table>
                        </div>
                        {/* Pagination */}
                        <div className="d-flex justify-content-end mt-4">
                            <Pagination count={totalPages} page={currentPage} onChange={(e, page) => setCurrentPage(page)} shape="rounded" style={{ color: '#E0E8F0' }} />
                        </div>
                    </div>
                </Box>
            </div>
        </>
    );
};

export default AttendanceReport;
