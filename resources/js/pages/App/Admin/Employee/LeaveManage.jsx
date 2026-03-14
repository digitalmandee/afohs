import React, { useState } from 'react'
import {
    Box,
    Typography,
    TextField,
    Button,
    Table,
    TableContainer,
    TableHead,
    Paper,
    TableRow,
    TableCell,
    TableBody,
    InputBase,
    IconButton
} from "@mui/material"
import { Add, CalendarToday, FilterAlt, ArrowBack } from "@mui/icons-material"
import SearchIcon from '@mui/icons-material/Search';

// const drawerWidthOpen = 240;
// const drawerWidthClosed = 110;
const LeaveApplicationManagement = () => {
    // const [open, setOpen] = useState(true);

    const employeeData = [
        {
            employee_id: 'EMP001',
            name: 'John Doe',
            start_date: 'Jan 5, 2020',
            end_date: 'Mar 20, 2023',
            leave_days: 8,
            leave_category: 'absent',
            created_at: 'Jan 6, 2021',
            status: 'Accepted'
        },
        {
            employee_id: 'EMP001',
            name: 'John Doe',
            start_date: 'Jan 5, 2020',
            end_date: 'Mar 20, 2023',
            leave_days: 8,
            leave_category: 'absent',
            created_at: 'Jan 6, 2021',
            status: 'Rejected'
        },
        {
            employee_id: 'EMP001',
            name: 'John Doe',
            start_date: 'Jan 5, 2020',
            end_date: 'Mar 20, 2023',
            leave_days: 8,
            leave_category: 'absent',
            created_at: 'Jan 6, 2021',
            status: 'Rejected'
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
                    backgroundColor: '#F6F6F6'
                }}
            > */}
                <Box sx={{
                    px: 3,
                    py: 2
                }}>
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            pt: 2
                        }}
                    >
                        {/* Left: Back + Title */}
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                            {/* <IconButton style={{ color: "#063455" }} onClick={() => window.history.back()}>
                                <ArrowBack />
                            </IconButton> */}
                            <h2
                                className="mb-0"
                                style={{
                                    color: "#063455",
                                    fontSize: '30px',
                                    fontWeight: 500
                                }}
                            >
                                Leave Application Management
                            </h2>
                        </Box>

                        {/* Right: Search + Filter */}
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {/* Search Bar */}
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    border: "1px solid #121212",
                                    borderRadius: "4px",
                                    width: "350px",
                                    height: '40px',
                                    padding: "4px 8px",
                                    backgroundColor: '#FFFFFF',
                                    mr: 2  // <-- Add margin to the right of search bar
                                }}
                            >
                                <SearchIcon style={{ color: "#121212", marginRight: "8px" }} />
                                <InputBase
                                    placeholder="Search employee member here"
                                    fullWidth
                                    sx={{ fontSize: "14px" }}
                                    inputProps={{ style: { padding: 0 } }}
                                />
                            </Box>

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
                        </Box>
                    </Box>
                    <div style={{ marginTop: '2rem' }}>
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
                            }}
                        >
                            <Table>
                                <TableHead style={{ backgroundColor: '#E5E5EA' }}>
                                    <TableRow>
                                        <TableCell style={{ color: '#000000', fontWeight: '500', fontSize: '16px' }}>EMP ID</TableCell>
                                        <TableCell style={{ color: '#000000', fontWeight: '500', fontSize: '16px' }}>Employee Name</TableCell>
                                        <TableCell style={{ color: '#000000', fontWeight: '500', fontSize: '16px' }}>Start Date</TableCell>
                                        <TableCell style={{ color: '#000000', fontWeight: '500', fontSize: '16px' }}>End Date</TableCell>
                                        <TableCell style={{ color: '#000000', fontWeight: '500', fontSize: '16px' }}>Leave Days</TableCell>
                                        <TableCell style={{ color: '#000000', fontWeight: '500', fontSize: '16px' }}>Leave Category</TableCell>
                                        <TableCell style={{ color: '#000000', fontWeight: '500', fontSize: '16px' }}>Created At</TableCell>
                                        <TableCell style={{ color: '#000000', fontWeight: '500', fontSize: '16px' }}>Status</TableCell>
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
                                                <TableCell style={{ fontWeight: 500, fontSize: '16px', color: '#363636' }}>
                                                    {employee.name}
                                                </TableCell>
                                                <TableCell style={{ fontWeight: 500, fontSize: '16px', color: '#363636' }}>
                                                    {employee.start_date}
                                                </TableCell>
                                                <TableCell style={{ fontWeight: 500, fontSize: '16px', color: '#363636' }}>
                                                    {employee.end_date}
                                                </TableCell>
                                                <TableCell style={{ fontWeight: 500, fontSize: '16px', color: '#363636' }}>
                                                    {employee.leave_days}
                                                </TableCell>
                                                <TableCell style={{ fontWeight: 500, fontSize: '16px', color: '#363636' }}>
                                                    {employee.leave_category}
                                                </TableCell>
                                                <TableCell style={{ fontWeight: 500, fontSize: '16px', color: '#363636' }}>
                                                    {employee.created_at}
                                                </TableCell>
                                                <TableCell>
                                                    <span
                                                        style={{
                                                            display: 'inline-block',
                                                            padding: '4px 12px',
                                                            borderRadius: '12px',
                                                            fontWeight: 500,
                                                            fontSize: '14px',
                                                            color: employee.status === 'Accepted'
                                                                ? '#FFFFFF'
                                                                : employee.status === 'Rejected'
                                                                    ? '#1E293B'
                                                                    : '#1E293B',
                                                            backgroundColor: employee.status === 'Accepted'
                                                                ? '#0D2B4E'
                                                                : employee.status === 'Rejected'
                                                                    ? '#D8E8FA'
                                                                    : '#E2E8F0',
                                                        }}
                                                    >
                                                        {employee.status}
                                                    </span>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </div>
                </Box>
            {/* </div> */}
        </>
    )
}

export default LeaveApplicationManagement
