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
    Typography,
    Dialog,
    TextField
} from "@mui/material"
import { Add, CalendarToday, FilterAlt, ArrowBack } from "@mui/icons-material"
import SearchIcon from '@mui/icons-material/Search';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import AddIcon from '@mui/icons-material/Add';
import { router } from '@inertiajs/react';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';


const LeavesList = () => {
    // const [open, setOpen] = useState(true);
    const [formData, setFormData] = useState({
        guestName: '',
        phone: '',
        clubName: '',
        authorizedBy: '',
        checkInDate: '',
        checkInTime: ''
    });
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const employeeData = [
        {
            ID: "0123",
            name: 'John Doe',
            start_date: 'Dec 02-2024',
            end_date: 'Dec 09-2025',
            leave_type: 'Annual',
            leave_reason: 'Annual',
            status: "Accepted",
            action: 'edit'
        },
        {
            ID: "0123",
            name: 'John Doe',
            start_date: 'Dec 02-2024',
            end_date: 'Dec 09-2025',
            leave_type: 'Annual',
            leave_reason: 'Annual',
            status: "Accepted",
            action: 'edit'
        },
        {
            ID: "0123",
            name: 'John Doe',
            start_date: 'Dec 02-2024',
            end_date: 'Dec 09-2025',
            leave_type: 'Annual',
            leave_reason: 'Annual',
            status: "Accepted",
            action: 'edit'
        },
        {
            ID: "0123",
            name: 'John Doe',
            start_date: 'Dec 02-2024',
            end_date: 'Dec 09-2025',
            leave_type: 'Annual',
            leave_reason: 'Annual',
            status: "Accepted",
            action: 'edit'
        },
        {
            ID: "0123",
            name: 'John Doe',
            start_date: 'Dec 02-2024',
            end_date: 'Dec 09-2025',
            leave_type: 'Annual',
            leave_reason: 'Annual',
            status: "Accepted",
            action: 'edit'
        },
    ];
    return (
        <>
            {/* <SideNav open={open} setOpen={setOpen} /> */}
            <div
                style={{
                    minHeight: '100vh',
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
                            <IconButton style={{ color: "#063455", height: 24, width: 24 }} onClick={() => window.history.back()}>
                                <ArrowBack />
                            </IconButton>
                            <Typography sx={{ color: '#063455', fontWeight: 500, fontSize: '30px', marginLeft: 2 }}>
                                Leaves List
                            </Typography>
                        </Box>

                        {/* Right: Search + Filter */}
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {/* Search Bar */}
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Box
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        border: "1px solid #121212",
                                        borderRadius: "4px",
                                        width: "280px",
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
                                        height: 40
                                    }}
                                >
                                    Filter
                                </Button>
                            </Box>
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
                                        <TableCell style={{ color: '#000000', fontWeight: '500', fontSize: '16px' }}>Start-Date</TableCell>
                                        <TableCell style={{ color: '#000000', fontWeight: '500', fontSize: '16px' }}>End-Date</TableCell>
                                        <TableCell style={{ color: '#000000', fontWeight: '500', fontSize: '16px' }}>Leave-Type</TableCell>
                                        <TableCell style={{ color: '#000000', fontWeight: '500', fontSize: '16px' }}>Leave-Reason</TableCell>
                                        <TableCell style={{ color: '#000000', fontWeight: '500', fontSize: '16px' }}>Status</TableCell>
                                        <TableCell style={{ color: '#000000', fontWeight: '500', fontSize: '16px' }}>Action</TableCell>
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
                                                <TableCell style={{ fontWeight: 500, fontSize: '16px', color: '#6C6C6C', cursor: 'pointer' }}
                                                    onClick={() => router.visit('/employee/payroll/leaves/Initialize')}
                                                >
                                                    {employee.ID}
                                                </TableCell>
                                                <TableCell style={{ fontWeight: 500, fontSize: '16px', color: '#6C6C6C' }}>
                                                    {employee.name}
                                                </TableCell>
                                                <TableCell style={{ fontWeight: 500, fontSize: '16px', color: '#6C6C6C' }}>
                                                    {employee.start_date}
                                                </TableCell>
                                                <TableCell style={{ fontWeight: 500, fontSize: '16px', color: '#6C6C6C' }}>
                                                    {employee.end_date}
                                                </TableCell>
                                                <TableCell style={{ fontWeight: 500, fontSize: '16px', color: '#6C6C6C' }}>
                                                    {employee.leave_type}
                                                </TableCell>
                                                <TableCell style={{ fontWeight: 500, fontSize: '16px', color: '#6C6C6C' }}>
                                                    {employee.leave_reason}
                                                </TableCell>
                                                <TableCell style={{ fontWeight: 500, fontSize: '16px', color: '#6C6C6C' }}>
                                                    {employee.status}
                                                </TableCell>
                                                <TableCell style={{ fontWeight: 500, fontSize: '16px', color: '#6C6C6C' }}>
                                                    <img src="/assets/edit.png" alt="edit" style={{ cursor: 'pointer', width: 20, height: 20 }} />
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

export default LeavesList
