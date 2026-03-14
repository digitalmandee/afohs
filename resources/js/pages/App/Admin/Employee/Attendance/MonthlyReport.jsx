import React, { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';
import { ArrowBack } from '@mui/icons-material';
import axios from 'axios';
import { CircularProgress, FormControl, MenuItem, Pagination, Select, Box, Typography, Button } from '@mui/material';

const MonthlyReport = () => {
    // const [open, setOpen] = useState(true);

    const currentDate = new Date();
    const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    const [month, setMonth] = useState(currentMonth);
    const [employees, setEmployees] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [limit, setLimit] = useState(10);

    const getMonthlyReport = async (page = 1) => {
        setIsLoading(true);
        try {
            const res = await axios.get('/api/attendances/leaves/reports/monthly', {
                params: { page, limit, month },
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

    // Generate months dynamically
    const months = Array.from({ length: 12 }, (_, i) => {
        const monthValue = `${currentDate.getFullYear()}-${String(i + 1).padStart(2, '0')}`;
        return { value: monthValue, label: new Date(currentDate.getFullYear(), i, 1).toLocaleString('en-US', { month: 'long' }) };
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
                <Box sx={{ px: 2, py: 2 }}>
                    <div style={{ paddingTop: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography style={{ fontWeight: '700', color: '#063455', fontSize: '30px' }}>
                                Monthly Attendance Report
                            </Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mb: 3 }}>
                                {/* <Box sx={{ display: 'flex', gap: 2 }}>Search Input - can be implemented later</Box> */}
                                <FormControl size="small">
                                    <Select value={month} onChange={(e) => setMonth(e.target.value)} sx={{ minWidth: 120, height: '35px', borderRadius: '16px' }}>
                                        {months.map((m) => (
                                            <MenuItem key={m.value} value={m.value}>
                                                {m.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                <Button
                                    variant="contained"
                                    style={{ backgroundColor: '#063455', color: 'white', textTransform: 'none', height: '35px', borderRadius: '16px' }}
                                    onClick={() => {
                                        const url = route('employees.attendances.monthly.report.print', {
                                            month: month,
                                        });
                                        window.open(url, '_blank');
                                    }}
                                >
                                    Print Report
                                </Button>
                                <Button
                                    variant="contained"
                                    style={{ backgroundColor: '#4caf50', color: 'white', textTransform: 'none', height: '35px', borderRadius: '16px' }}
                                    onClick={() => {
                                        const url = route('api.attendances.leaves.reports.monthly.export', {
                                            month: month,
                                        });
                                        window.location.href = url;
                                    }}
                                >
                                    Export Excel
                                </Button>
                                {/* Employee Cards Grid */}
                            </Box>
                        </div>
                        <Typography sx={{ color: '#063455', fontSize: '15px', fontWeight: '600' }}>Supports planning, payroll preparation, and management review</Typography>
                        <Box sx={{ padding: 3, borderRadius: 2, marginTop: '0.1rem' }}>

                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                                    gap: '24px',
                                }}
                            >
                                {isLoading ? (
                                    <div style={{ gridColumn: 'span 4', marginTop: '2rem' }} className="d-flex justify-content-center">
                                        <CircularProgress sx={{ color: '#E0E8F0' }} />
                                    </div>
                                ) : employees.length > 0 ? (
                                    employees.map((employee, index) => (
                                        <div
                                            key={index}
                                            style={{
                                                backgroundColor: '#063455',
                                                borderRadius: '8px',
                                                overflow: 'hidden',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                            }}
                                        >
                                            {/* Employee Info */}
                                            <div
                                                style={{
                                                    padding: '24px',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    borderBottom: '1px solid #E0E0E0',
                                                }}
                                            >
                                                {employee.profile_image ? (
                                                    <img
                                                        src={import.meta.env.VITE_ASSET_API + employee.profile_image || '/placeholder.svg'}
                                                        alt={employee.employee_name}
                                                        style={{
                                                            width: '50px',
                                                            height: '50px',
                                                            borderRadius: '50%',
                                                            marginBottom: '12px',
                                                            objectFit: 'contain',
                                                        }}
                                                    />
                                                ) : (
                                                    <div
                                                        style={{
                                                            width: '64px',
                                                            height: '64px',
                                                            borderRadius: '50%',
                                                            backgroundColor: '#fff',
                                                            marginBottom: '12px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                        }}
                                                    >
                                                        <span style={{ color: '#063455' }}>👤</span>
                                                    </div>
                                                )}
                                                <div style={{ color: '#fff', fontSize: '14px', marginBottom: '4px' }}>Employ ID : {employee.employee_id}</div>
                                                <div style={{ fontSize: '16px', color: '#fff', fontWeight: '500', marginBottom: '4px' }}>{employee.employee_name}</div>
                                                <div style={{ color: '#fff', fontSize: '14px' }}>{employee.designation}</div>
                                            </div>

                                            {/* Statistics */}
                                            <div style={{ backgroundColor: '#FFFFFF' }}>
                                                <div style={{ padding: '16px 24px' }}>
                                                    <div
                                                        style={{
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            marginBottom: '16px',
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                backgroundColor: '#063455',
                                                                width: '100%',
                                                                maxWidth: '120px',
                                                                borderRadius: '10px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                flexDirection: 'column',
                                                                padding: '10px',
                                                            }}
                                                        >
                                                            <div style={{ fontSize: '20px', color: '#fff', fontWeight: '500' }}>{employee.total_leave}</div>
                                                            <div style={{ color: '#fff', fontSize: '12px' }}>Total Leave</div>
                                                        </div>
                                                        <div
                                                            style={{
                                                                backgroundColor: '#063455',
                                                                width: '100%',
                                                                maxWidth: '120px',
                                                                borderRadius: '10px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                flexDirection: 'column',
                                                                padding: '10px',
                                                            }}
                                                        >
                                                            <div style={{ fontSize: '20px', color: '#fff', fontWeight: '500' }}>{employee.total_attendance}</div>
                                                            <div style={{ color: '#fff', fontSize: '12px' }}>Total Attendance</div>
                                                        </div>
                                                    </div>
                                                    <div
                                                        style={{
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                backgroundColor: '#063455',
                                                                width: '100%',
                                                                maxWidth: '120px',
                                                                borderRadius: '10px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                flexDirection: 'column',
                                                                padding: '10px',
                                                            }}
                                                        >
                                                            <div style={{ fontSize: '20px', color: '#fff', fontWeight: '500' }}>{employee.time_present}</div>
                                                            <div style={{ color: '#fff', fontSize: '12px' }}>Time Present</div>
                                                        </div>
                                                        <div
                                                            style={{
                                                                backgroundColor: '#063455',
                                                                width: '100%',
                                                                maxWidth: '120px',
                                                                borderRadius: '10px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                flexDirection: 'column',
                                                                padding: '10px',
                                                            }}
                                                        >
                                                            <div style={{ fontSize: '20px', color: '#fff', fontWeight: '500' }}>{employee.time_late}</div>
                                                            <div style={{ color: '#fff', fontSize: '12px' }}>Time Late</div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div style={{ height: '8px', backgroundColor: '#063455' }} />
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div
                                        style={{
                                            gridColumn: 'span 4',
                                            marginTop: '2rem',
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            height: '100%',
                                            fontSize: '16px',
                                            fontWeight: '500',
                                            color: '#666',
                                        }}
                                    >
                                        No data found
                                    </div>
                                )}
                            </div>

                            {/* Pagination */}
                            <div className="d-flex justify-content-end mt-4" style={{ marginTop: '4rem' }}>
                                <Pagination count={totalPages} page={currentPage} onChange={(e, page) => setCurrentPage(page)} shape="rounded" style={{ color: '#E0E8F0' }} />
                            </div>
                        </Box>
                    </div>
                </Box>
            </div>
        </>
    );
};

export default MonthlyReport;
