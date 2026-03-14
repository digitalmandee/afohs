import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { CircularProgress, Typography, Box } from '@mui/material';

const LeaveReportPrint = ({ queryParams }) => {
    const currentDate = new Date();
    const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    const [month, setMonth] = useState(queryParams?.month || currentMonth);
    const [employees, setEmployees] = useState([]);
    const [leaveCategories, setLeaveCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const getLeaveReport = async () => {
        setIsLoading(true);
        try {
            const res = await axios.get('/api/employees/leaves/reports', {
                params: {
                    limit: 1000,
                    month,
                },
            });
            if (res.data.success) {
                setEmployees(res.data.report_data.employees);
                setLeaveCategories(res.data.report_data.leave_categories || []);
            }
        } catch (error) {
            console.log(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        getLeaveReport();
    }, [month]);

    useEffect(() => {
        if (!isLoading && employees.length > 0) {
            setTimeout(() => {
                window.print();
            }, 1000);
        }
    }, [isLoading, employees]);

    const formattedMonth = new Date(month + '-01').toLocaleString('default', { month: 'long', year: 'numeric' });

    return (
        <Box sx={{ p: 4, bgcolor: 'white', minHeight: '100vh' }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <Typography variant="h4" style={{ fontWeight: 'bold', color: '#000' }}>
                    Leave Report
                </Typography>
                <Typography variant="h6" style={{ color: '#555' }}>
                    {formattedMonth}
                </Typography>
            </div>

            <div style={{ overflowX: 'auto', width: '100%' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                        <tr>
                            <th style={{ border: '1px solid #000', padding: '8px' }}>Name / ID</th>
                            {leaveCategories.map((category) => (
                                <th key={category.id} style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>
                                    {category.name}
                                </th>
                            ))}
                            <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>Total Attendance</th>
                            <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>Total Absence</th>
                            <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>Total Leave</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr>
                                <td colSpan={4 + leaveCategories.length} style={{ textAlign: 'center', padding: '20px' }}>
                                    <CircularProgress size={24} />
                                </td>
                            </tr>
                        ) : employees.length > 0 ? (
                            employees.map((employee, idx) => (
                                <tr key={idx}>
                                    <td style={{ border: '1px solid #000', padding: '8px' }}>
                                        <div style={{ fontWeight: 'bold' }}>{employee.employee_name}</div>
                                        <div style={{ color: '#666' }}>ID: {employee.employee_id}</div>
                                    </td>
                                    {leaveCategories.map((category) => {
                                        const categoryKey = category.name.replace(/\s+/g, '_');
                                        return (
                                            <td key={category.id} style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>
                                                {employee.leave_categories?.[categoryKey] || 0}
                                            </td>
                                        );
                                    })}
                                    <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{employee.total_attendance}</td>
                                    <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{employee.total_absence}</td>
                                    <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{employee.total_leave}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={4 + leaveCategories.length} style={{ textAlign: 'center', padding: '10px' }}>
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

export default LeaveReportPrint;

LeaveReportPrint.layout = (page) => page;
