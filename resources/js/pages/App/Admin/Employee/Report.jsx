import React, { useState } from 'react'
import {
    Box,
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
import { FilterAlt, ArrowBack } from "@mui/icons-material"
import SearchIcon from '@mui/icons-material/Search';

// const drawerWidthOpen = 240;
// const drawerWidthClosed = 110;
const AttendanceReport = () => {
    // const [open, setOpen] = useState(true);

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
                    backgroundColor: '#F6F6F6'
                }}
            > */}
                <Box sx={{
                    px: 3
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
                            <IconButton style={{ color: "#063455" }} onClick={() => window.history.back()}>
                                <ArrowBack />
                            </IconButton>
                            <h2
                                className="mb-0"
                                style={{
                                    color: "#063455",
                                    fontSize: '30px',
                                    fontWeight: 500
                                }}
                            >
                                Leave Reports
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
                    </div>
                </Box>
            {/* </div> */}
        </>
    )
}

export default AttendanceReport
