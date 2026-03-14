import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Table, CircularProgress, Typography, Box } from '@mui/material';

const AttendanceReportPrint = ({ queryParams }) => {
    const currentDate = new Date();
    // Use query params or default
    const [month, setMonth] = useState(queryParams?.month ? parseInt(queryParams.month.split('-')[1]) : currentDate.getMonth() + 1);
    const [year, setYear] = useState(queryParams?.month ? parseInt(queryParams.month.split('-')[0]) : currentDate.getFullYear());

    const [employees, setEmployees] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const getDaysInMonth = (month, year) => new Date(year, month, 0).getDate();
    const getWeekdayIndex = (day, month, year) => new Date(year, month - 1, day).getDay();

    const [leaveCategories, setLeaveCategories] = useState([
        { id: 123, name: 'Present', color: '#6FC3AF', short_code: 'P' },
        { id: 124, name: 'Absent', color: '#FF6B6B', short_code: 'A' },
        { id: 125, name: 'Late', color: '#FFA500', short_code: 'L' },
    ]);

    const getLeaveCategories = async () => {
        try {
            const res = await axios.get('/api/leave-categories');
            if (res.data.success) {
                setLeaveCategories((prev) => [...prev, ...res.data.categories]);
            }
        } catch (error) {
            console.log(error);
        }
    };

    const getAttendances = async () => {
        setIsLoading(true);
        try {
            // Fetch ALL data for the month (large limit)
            const res = await axios.get('/api/attendances/reports', {
                params: {
                    limit: 1000,
                    month: `${year}-${month.toString().padStart(2, '0')}`,
                },
            });

            if (res.data.success) {
                setEmployees(res.data.report_data.employees);
            }
        } catch (error) {
            console.log(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        getLeaveCategories();
    }, []);

    useEffect(() => {
        getAttendances();
    }, [month, year]);

    useEffect(() => {
        if (!isLoading && employees.length > 0) {
            setTimeout(() => {
                window.print();
            }, 1000);
        }
    }, [isLoading, employees]);

    const calculateTotalPresent = (attendance) => attendance.filter((status) => status.status === 'present' || status.status === 'late').length;

    return (
        <Box sx={{ p: 4, bgcolor: 'white', minHeight: '100vh' }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <Typography variant="h4" style={{ fontWeight: 'bold', color: '#000' }}>
                    Attendance Report
                </Typography>
                <Typography variant="h6" style={{ color: '#555' }}>
                    {new Date(year, month - 1).toLocaleString('default', { month: 'long' })} {year}
                </Typography>
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '16px', justifyContent: 'center' }}>
                {leaveCategories.map((item) => (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '5px', border: '1px solid #ddd', padding: '2px 8px', borderRadius: '4px' }}>
                        <div style={{ width: '12px', height: '12px', backgroundColor: item.color, borderRadius: '2px' }}></div>
                        <span style={{ fontSize: '12px' }}>
                            {item.name} ({item.short_code})
                        </span>
                    </div>
                ))}
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto', width: '100%' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                        <tr>
                            <th rowSpan={2} style={{ border: '1px solid #000', padding: '4px' }}>
                                ID
                            </th>
                            <th rowSpan={2} style={{ border: '1px solid #000', padding: '4px', textAlign: 'left' }}>
                                Employee Name
                            </th>
                            {[...Array(getDaysInMonth(month, year))].map((_, i) => (
                                <th key={i} style={{ border: '1px solid #000', padding: '2px', width: '25px', textAlign: 'center' }}>
                                    {(i + 1).toString().padStart(2, '0')}
                                </th>
                            ))}
                            <th rowSpan={2} style={{ border: '1px solid #000', padding: '4px' }}>
                                Pres
                            </th>
                        </tr>
                        <tr>
                            {[...Array(getDaysInMonth(month, year))].map((_, i) => {
                                let dayIndex = getWeekdayIndex(i + 1, month, year);
                                return (
                                    <th key={i} style={{ border: '1px solid #000', padding: '2px', textAlign: 'center', backgroundColor: dayIndex === 0 || dayIndex === 6 ? '#eee' : 'white' }}>
                                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'][dayIndex]}
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr>
                                <td colSpan={getDaysInMonth(month, year) + 3} style={{ textAlign: 'center', padding: '20px' }}>
                                    <CircularProgress size={24} />
                                </td>
                            </tr>
                        ) : employees.length > 0 ? (
                            employees.map((employee, idx) => (
                                <tr key={idx}>
                                    <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'center' }}>{employee.employee_id}</td>
                                    <td style={{ border: '1px solid #000', padding: '4px' }}>{employee.name}</td>
                                    {employee.attendances.map((attendance, i) => {
                                        const leaveCategory = attendance.status === 'leave' ? attendance.leave_category : null;
                                        const displayStatus = leaveCategory ? leaveCategory : attendance.status;
                                        const status = displayStatus ? leaveCategories.find((item) => item.name.toLocaleLowerCase() === displayStatus.toLocaleLowerCase()) : null;

                                        return (
                                            <td key={i} style={{ border: '1px solid #000', padding: '2px', textAlign: 'center', backgroundColor: status?.color || 'white', color: '#000', opacity: 0.8 }}>
                                                {status?.short_code || ''}
                                            </td>
                                        );
                                    })}
                                    <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'center' }}>{calculateTotalPresent(employee.attendances)}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={getDaysInMonth(month, year) + 3} style={{ textAlign: 'center', padding: '10px' }}>
                                    No data found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div style={{ marginTop: '20px', fontSize: '10px', textAlign: 'right', color: '#666' }}>Printed on {new Date().toLocaleDateString('en-GB')}</div>
        </Box>
    );
};

export default AttendanceReportPrint;

AttendanceReportPrint.layout = (page) => page;
