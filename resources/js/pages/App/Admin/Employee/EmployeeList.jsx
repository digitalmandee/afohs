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
import { Add, CalendarToday, ArrowBack } from "@mui/icons-material"
import SearchIcon from '@mui/icons-material/Search';

// const drawerWidthOpen = 240;
// const drawerWidthClosed = 110;
const EmployeeList = () => {
    // const [open, setOpen] = useState(true);
    const employeeData = [
        {
            employee_id: "EMP001",
            name: "John Doe",
            departmentname: "Engineering",
            designation: "Software Engineer",
            joining_date: "2021-06-15",
            email: "john.doe@example.com",
            status: "Active"
        },
        {
            employee_id: "EMP002",
            name: "Jane Smith",
            departmentname: "Human Resources",
            designation: "HR Manager",
            joining_date: "2020-03-10",
            email: "jane.smith@example.com",
            status: "Not Active"
        },
        {
            employee_id: "EMP003",
            name: "Robert Brown",
            departmentname: "Finance",
            designation: "Accountant",
            joining_date: "2019-08-22",
            email: "robert.brown@example.com",
            status: "Active"
        },
        {
            employee_id: "EMP003",
            name: "Robert Brown",
            departmentname: "Finance",
            designation: "Accountant",
            joining_date: "2019-08-22",
            email: "robert.brown@example.com",
            status: "Active"
        },
        {
            employee_id: "EMP003",
            name: "Robert Brown",
            departmentname: "Finance",
            designation: "Accountant",
            joining_date: "2019-08-22",
            email: "robert.brown@example.com",
            status: "Active"
        }
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
                    <Box sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        // px: 2,
                        pt: 5
                    }}>
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                            <IconButton style={{ color: "#063455" }}
                                onClick={() => window.history.back()}
                            >
                                <ArrowBack />
                            </IconButton>
                            <h2 className="mb-0 fw-normal" style={{ color: "#063455", fontSize: '30px' }}>
                                All Employees List
                            </h2>
                        </Box>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                border: "1px solid #121212",
                                borderRadius: "4px",
                                width: "350px",
                                height: '40px',
                                padding: "4px 8px",
                                backgroundColor: '#FFFFFF'
                            }}
                        >
                            <SearchIcon style={{ color: "#121212", marginRight: "8px" }} />
                            <InputBase
                                placeholder="Search employee member here"
                                fullWidth
                                sx={{ fontSize: "14px" }}
                                inputProps={{ style: { padding: 0 } }}
                            />
                        </div>
                    </Box>
                    <div style={{ marginTop: "2rem" }}>
                        {/* Booking Table */}
                        <TableContainer component={Paper} style={{ width: "100%", backgroundColor: "#FFFFFF", borderRadius: "1rem", boxShadow: "none", border: "1px solid #ccc", marginBottom: "2rem" }}>
                            <Table>
                                <TableHead style={{ backgroundColor: "#E5E5EA" }}>
                                    <TableRow>
                                        <TableCell style={{ color: "#000000", fontWeight: "500", fontSize: '16px' }}>EMP ID</TableCell>
                                        <TableCell style={{ color: "#000000", fontWeight: "500", fontSize: '16px' }}>Name</TableCell>
                                        <TableCell style={{ color: "#000000", fontWeight: "500", fontSize: '16px' }}>Department</TableCell>
                                        <TableCell style={{ color: "#000000", fontWeight: "500", fontSize: '16px' }}>Designation</TableCell>
                                        <TableCell style={{ color: "#000000", fontWeight: "500", fontSize: '16px' }}>Joining Date</TableCell>
                                        <TableCell style={{ color: "#000000", fontWeight: "500", fontSize: '16px' }}>Email Address</TableCell>
                                        <TableCell style={{ color: "#000000", fontWeight: "500", fontSize: '16px' }}>Employee Status</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {employeeData.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} align="center">
                                                <CircularProgress sx={{ color: "#0F172A" }} />
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        employeeData.map((employee, index) => (
                                            <TableRow key={index}>
                                                <TableCell style={{ cursor: "pointer", fontWeight: 500, fontSize: '16px', color: '#6C6C6C' }}>
                                                    {employee.employee_id}
                                                </TableCell>
                                                <TableCell style={{ fontWeight: 500, fontSize: '16px', color: '#6C6C6C' }}>{employee.name}</TableCell>
                                                <TableCell style={{ fontWeight: 500, fontSize: '16px', color: '#6C6C6C' }}>{employee.departmentname}</TableCell>
                                                <TableCell style={{ fontWeight: 500, fontSize: '16px', color: '#6C6C6C' }}>{employee.designation}</TableCell>
                                                <TableCell style={{ fontWeight: 500, fontSize: '16px', color: '#6C6C6C' }}>{employee.joining_date}</TableCell>
                                                <TableCell style={{ fontWeight: 500, fontSize: '16px', color: '#6C6C6C' }}>{employee.email}</TableCell>
                                                <TableCell style={{ fontWeight: 500, fontSize: '16px', color: '#6C6C6C' }}>{employee.status}</TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        {/* Pagination */}
                        {/* <Box sx={{ display: "flex", justifyContent: "end", mt: 3, paddingBottom: "10px" }}>
                            <Pagination count={totalPages} page={currentPage} onChange={(e, page) => setCurrentPage(page)} />
                        </Box> */}
                    </div>
                </Box>
            {/* </div> */}
        </>
    )
}

export default EmployeeList
