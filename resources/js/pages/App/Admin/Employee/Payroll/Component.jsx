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
    IconButton,
    Typography
} from "@mui/material"
import { Add, CalendarToday, FilterAlt, ArrowBack } from "@mui/icons-material"
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import { router } from '@inertiajs/react';


const SalaryComponent = () => {
    // const [open, setOpen] = useState(true);

    const employeeData = [
        {
            component: 'Basic Salary',
            unit: 'Fixed Salary',
            deduction: 'In-Active',
            status: "Active"
        },
        {
            component: 'Basic Salary',
            unit: 'Fixed Salary',
            deduction: 'In-Active',
            status: "In-Active"
        },
        {
            component: 'Basic Salary',
            unit: 'Fixed Salary',
            deduction: 'In-Active',
            status: "Active"
        },
        {
            component: 'Basic Salary',
            unit: 'Fixed Salary',
            deduction: 'In-Active',
            status: "Active"
        },
        {
            component: 'Basic Salary',
            unit: 'Fixed Salary',
            deduction: 'In-Active',
            status: "In-Active"
        },
    ];
    return (
        <>
            {/* <SideNav open={open} setOpen={setOpen} /> */}
            <div
                style={{
                    minHeight:'100vh',
                    backgroundColor: '#f5f5f5'
                }}
            >
                <Box sx={{
                    px: 3,
                    pt: 2
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
                            <Typography sx={{ color: '#063455', fontWeight: 700, fontSize: '30px' }}>
                                Salary Component
                            </Typography>
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
                                style={{
                                    border: '1px solid #063455',
                                    color: '#333',
                                    textTransform: 'none',
                                    backgroundColor: 'transparent',
                                    minWidth: '40px', // optional: makes it more icon-sized
                                    padding: '7px',    // optional: tighter padding for icon-only button
                                }}
                                onClick={() => router.visit('/employee/payroll/add/salary/component')}
                            >
                                <AddIcon />
                            </Button>
                        </Box>
                    </Box>
                    <div style={{ marginTop: '2rem' }}>
                        {/* Booking Table */}
                        <TableContainer
                            component={Paper}
                            style={{
                                width: '100%',
                                // backgroundColor: '#FFFFFF',
                                borderRadius: '16px',
                                // boxShadow: 'none',
                                // border: '1px solid #ccc',
                                // marginBottom: '24px',
                            }}
                        >
                            <Table>
                                <TableHead style={{ backgroundColor: '#063455' }}>
                                    <TableRow>
                                        <TableCell style={{ color: '#fff', fontWeight: '600', fontSize: '16px' }}>Component Name</TableCell>
                                        <TableCell style={{ color: '#fff', fontWeight: '600', fontSize: '16px' }}>Unit Type</TableCell>
                                        <TableCell style={{ color: '#fff', fontWeight: '600', fontSize: '16px' }}>Deduction</TableCell>
                                        <TableCell style={{ color: '#fff', fontWeight: '600', fontSize: '16px' }}>Status</TableCell>
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
                                                <TableCell style={{ cursor: 'pointer', fontWeight: 400, fontSize: '14px', color: '#7f7f7f' }}>
                                                    {employee.component}
                                                </TableCell>
                                                <TableCell style={{ fontWeight: 400, fontSize: '14px', color: '#7f7f7f' }}>
                                                    {employee.unit}
                                                </TableCell>

                                                {/* Deduction with red pill */}
                                                <TableCell>
                                                    <span
                                                        style={{
                                                            backgroundColor: '#F14C35',
                                                            color: '#fff',
                                                            borderRadius: '16px',
                                                            padding: '2px 12px',
                                                            fontSize: '12px',
                                                            fontWeight: '500',
                                                            display: 'inline-block',
                                                        }}
                                                    >
                                                        {employee.deduction}
                                                    </span>
                                                </TableCell>

                                                {/* Status with conditional pill */}
                                                <TableCell>
                                                    <span
                                                        style={{
                                                            backgroundColor:
                                                                employee.status === 'Active' ? '#063455' : '#B0DEFF',
                                                            color:
                                                                employee.status === 'Active' ? '#fff' : 'black',
                                                            borderRadius: '16px',
                                                            padding: '2px 12px',
                                                            fontSize: '12px',
                                                            fontWeight: '500',
                                                            display: 'inline-block',
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
            </div>
        </>
    )
}

export default SalaryComponent
