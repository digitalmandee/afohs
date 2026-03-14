import { router } from '@inertiajs/react';
import AddIcon from '@mui/icons-material/Add';
import PeopleIcon from '@mui/icons-material/People';
import PermIdentityIcon from '@mui/icons-material/PermIdentity';
import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt';
import SearchIcon from '@mui/icons-material/Search';
import { ArrowBack, Search, FilterAlt, MoreVert, People, CreditCard, Warning } from "@mui/icons-material"
import {
    Box,
    Button,
    Card,
    CircularProgress,
    InputBase,
    Modal,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material';
import { useState } from 'react';
import EmployeeDetail from './Detail';
import AttendanceFilter from './Filter';

// const drawerWidthOpen = 240;
// const drawerWidthClosed = 110;

const AttendanceDashboard = () => {
    // const [open, setOpen] = useState(true);
    const [openFilter, setOpenFilter] = useState(false);

    const employeeData = [
        {
            employee_id: 'EMP001',
            name: 'John Doe',
            casual_leave: 0,
            sick_leave: 2,
            total_leave: 8,
            total_absent: 4,
            total: 12,
        },
        {
            employee_id: 'EMP001',
            name: 'John Doe',
            casual_leave: 0,
            sick_leave: 2,
            total_leave: 8,
            total_absent: 4,
            total: 12,
        },
        {
            employee_id: 'EMP001',
            name: 'John Doe',
            casual_leave: 0,
            sick_leave: 2,
            total_leave: 8,
            total_absent: 4,
            total: 12,
        },
    ];
    return (
        <>
            {/* <SideNav open={open} setOpen={setOpen} />
            <div
                style={{
                    marginLeft: open ? `${drawerWidthOpen}px` : `${drawerWidthClosed}px`,
                    transition: 'margin-left 0.3s ease-in-out',
                    marginTop: '5rem',
                    backgroundColor: '#F6F6F6',
                }}
            > */}
                <Box
                    sx={{
                        px: 4,
                        py: 2,
                    }}
                >
                    <div style={{ paddingTop: '1rem', backgroundColor: 'transparent' }}>
                        {/* Header */}
                        <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <Typography
                                sx={{
                                    fontWeight: 500,
                                    fontSize: '30px',
                                    color: '#063455',
                                }}
                            >
                                Attendance Dashboard
                            </Typography>
                            <Button
                                style={{ color: 'white', width: '180px', backgroundColor: '#063455', textTransform: 'none' }}
                                startIcon={<AddIcon />}
                                onClick={() => router.visit('/employee/attendance/add/leave/application')}
                            >
                                Add New Application
                            </Button>
                        </div>

                        {/* Metric Cards */}
                        <div
                            style={{
                                display: 'flex',
                                width: '100%',
                                justifyContent: 'space-between',
                                gap: '1rem',
                                marginBottom: '24px',
                            }}
                        >
                            {[
                                { title: 'Total Employee', value: 320, icon: PeopleIcon },
                                { title: 'Total Present', value: 200, icon: PersonAddAltIcon },
                                { title: 'Total Absent', value: 120, icon: PermIdentityIcon },
                            ].map((item, index) => (
                                <div key={index} style={{ flex: 1 }}>
                                    <Card
                                        style={{
                                            backgroundColor: '#063455',
                                            color: '#fff',
                                            borderRadius: '2px',
                                            height: '120px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            padding: '1rem',
                                            boxShadow: 'none',
                                            border: 'none',
                                        }}
                                    >
                                        <div
                                            style={{
                                                backgroundColor: '#202728',
                                                borderRadius: '50%',
                                                width: '50px',
                                                height: '50px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                marginRight: '1rem',
                                            }}
                                        >
                                            <item.icon style={{ color: '#fff', fontSize: '28px' }} />
                                        </div>
                                        <div>
                                            <Typography variant="body2" style={{ color: '#DDE6E8' }}>
                                                {item.title}
                                            </Typography>
                                            <Typography variant="h6" style={{ fontWeight: 'bold', color: '#fff' }}>
                                                {item.value}
                                            </Typography>
                                        </div>
                                    </Card>
                                </div>
                            ))}
                        </div>
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '24px',
                            }}
                        >
                            {/* Left Group: Search and Filter */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                {/* Search Field with Icon */}
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        border: '1px solid #121212',
                                        borderRadius: '4px',
                                        width: '350px',
                                        padding: '4px 8px',
                                        backgroundColor: '#FFFFFF',
                                    }}
                                >
                                    <SearchIcon style={{ color: '#121212', marginRight: '8px' }} />
                                    <InputBase
                                        placeholder="Search employee member here"
                                        fullWidth
                                        sx={{ fontSize: '14px' }}
                                        inputProps={{ style: { padding: 0 } }}
                                    />
                                </div>

                                {/* Filter Button */}
                                <Button
                                    variant="outlined"
                                    startIcon={<FilterAlt />}
                                    style={{
                                        border: '1px solid #063455',
                                        color: '#333',
                                        textTransform: 'none',
                                        backgroundColor: 'transparent',
                                    }}
                                    onClick={() => {
                                        setOpenFilter(true);
                                    }}
                                >
                                    Filter
                                </Button>
                            </div>

                            {/* View All Link (Right Side) */}
                            <div
                                style={{
                                    textDecoration: 'underline',
                                    cursor: 'pointer',
                                    color: '#063455',
                                    fontWeight: 500,
                                    fontSize: '18px',
                                }}
                            onClick={() => router.visit('/employee/all/attendance')}
                            >
                                View all
                            </div>
                        </div>
                        <div style={{ marginBottom: '1rem' }}>
                            {/* Booking Table */}
                            <TableContainer
                                component={Paper}
                                style={{
                                    width: '100%',
                                    backgroundColor: '#FFFFFF',
                                    borderRadius: '1rem',
                                    boxShadow: 'none',
                                    border: '1px solid #ccc',
                                    marginBottom: '24px',
                                    overflowX: 'auto',
                                }}
                            >
                                <Table>
                                    <TableHead style={{ backgroundColor: '#E5E5EA' }}>
                                        <TableRow>
                                            <TableCell style={{ color: '#000000', fontWeight: '500', fontSize: '16px' }}>EMP ID</TableCell>
                                            <TableCell style={{ color: '#000000', fontWeight: '500', fontSize: '16px' }}>Name</TableCell>
                                            <TableCell style={{ color: '#000000', fontWeight: '500', fontSize: '16px' }}>Casual Leave</TableCell>
                                            <TableCell style={{ color: '#000000', fontWeight: '500', fontSize: '16px' }}>Sick Leave</TableCell>
                                            <TableCell style={{ color: '#000000', fontWeight: '500', fontSize: '16px' }}>Total Leave</TableCell>
                                            <TableCell style={{ color: '#000000', fontWeight: '500', fontSize: '16px' }}>Total Absent</TableCell>
                                            <TableCell style={{ color: '#000000', fontWeight: '500', fontSize: '16px' }}>Total Attendance</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {employeeData.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={7} align="center">
                                                    <CircularProgress sx={{ color: '#0F172A' }} />
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            employeeData.map((employee, index) => (
                                                <TableRow key={index}>
                                                    <TableCell
                                                        // onClick={handleOpenDetails}
                                                        style={{
                                                            cursor: 'pointer',
                                                            fontWeight: 500,
                                                            fontSize: '16px',
                                                            color: '#6C6C6C',
                                                        }}
                                                    >
                                                        {employee.employee_id}
                                                    </TableCell>
                                                    <TableCell style={{ fontWeight: 500, fontSize: '16px', color: '#6C6C6C' }}>
                                                        {employee.name}
                                                    </TableCell>
                                                    <TableCell style={{ fontWeight: 500, fontSize: '16px', color: '#6C6C6C' }}>
                                                        {employee.casual_leave}
                                                    </TableCell>
                                                    <TableCell style={{ fontWeight: 500, fontSize: '16px', color: '#6C6C6C' }}>
                                                        {employee.sick_leave}
                                                    </TableCell>
                                                    <TableCell style={{ fontWeight: 500, fontSize: '16px', color: '#6C6C6C' }}>
                                                        {employee.total_leave}
                                                    </TableCell>
                                                    <TableCell style={{ fontWeight: 500, fontSize: '16px', color: '#6C6C6C' }}>
                                                        {employee.total_absent}
                                                    </TableCell>
                                                    <TableCell style={{ fontWeight: 500, fontSize: '16px', color: '#6C6C6C' }}>
                                                        {employee.total}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                            <AttendanceFilter
                                open={openFilter}
                                onClose={() => setOpenFilter(false)}
                            />
                        </div>
                    </div>
                </Box>
            {/* </div> */}
        </>
    );
};

export default AttendanceDashboard;
