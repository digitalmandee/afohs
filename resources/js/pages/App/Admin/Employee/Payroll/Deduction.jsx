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

const DeductionList = () => {
    // const [open, setOpen] = useState(true);
    const [openEmployeeEditModal, setOpenEmployeeEditModal] = useState(false);
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
            name: 'John Doe',
            department: 'Finance',
            reason: 'Bank detail missing',
            deduction: "10,000"
        },
        {
            name: 'John Doe',
            department: 'Finance',
            reason: 'Bank detail missing',
            deduction: "10,000"
        },
        {
            name: 'John Doe',
            department: 'Finance',
            reason: 'Bank detail missing',
            deduction: "10,000"
        },
        {
            name: 'John Doe',
            department: 'Finance',
            reason: 'Bank detail missing',
            deduction: "10,000"
        },
        {
            name: 'John Doe',
            department: 'Finance',
            reason: 'Bank detail missing',
            deduction: "10,000"
        },
    ];
    return (
        <>
            {/* <SideNav open={open} setOpen={setOpen} /> */}
            <div
                style={{
                    minHeight: '100vh',
                    backgroundColor: '#F5f5f5'
                }}
            >
                <Box sx={{
                    px: 3,
                    pt: 2
                }}>
                    <Box sx={{ pt: 2 }}>
                        {/* Top Row: Title + Button */}
                        <Box
                            sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                mb: 2,
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <IconButton
                                    style={{ color: "#063455", height: 24, width: 24 }}
                                    onClick={() => window.history.back()}
                                >
                                    <ArrowBack />
                                </IconButton>
                                <Typography sx={{ color: '#063455', fontWeight: 500, fontSize: '30px', marginLeft: 2 }}>
                                    Deduction List
                                </Typography>
                            </Box>

                            <Button
                                style={{
                                    color: 'white',
                                    backgroundColor: '#063455',
                                    textTransform: 'none',
                                    height: 40
                                }}
                                onClick={() => router.visit('/employee/payroll/reimbursements')}
                            >
                                Reimbursement
                            </Button>
                        </Box>

                        {/* Bottom Row: Search + Filter + Icon Buttons */}
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                {/* Search Bar */}
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
                                        height: 40,
                                    }}
                                    onClick={() => setOpenFilterModal(true)}
                                >
                                    Filter
                                </Button>

                                {/* Add Icon Button */}
                                <Button
                                    variant="outlined"
                                    style={{
                                        border: '1px solid #063455',
                                        color: '#333',
                                        textTransform: 'none',
                                        backgroundColor: 'transparent',
                                        minWidth: '40px',
                                        padding: '7px',
                                    }}
                                    onClick={() => router.visit('/employee/payroll/add/deduction')}
                                >
                                    <AddIcon />
                                </Button>

                                {/* Download Icon Button */}
                                <Button
                                    variant="outlined"
                                    style={{
                                        border: '1px solid #063455',
                                        color: '#333',
                                        textTransform: 'none',
                                        backgroundColor: 'transparent',
                                        minWidth: '40px',
                                        padding: '7px',
                                    }}
                                    onClick={() => setOpenFilter(true)}
                                >
                                    <ArrowDownwardIcon />
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
                                        <TableCell style={{ color: '#000000', fontWeight: '500', fontSize: '16px' }}>Name</TableCell>
                                        <TableCell style={{ color: '#000000', fontWeight: '500', fontSize: '16px' }}>Department</TableCell>
                                        <TableCell style={{ color: '#000000', fontWeight: '500', fontSize: '16px' }}>Reason</TableCell>
                                        <TableCell style={{ color: '#000000', fontWeight: '500', fontSize: '16px' }}>Deduction</TableCell>
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
                                                <TableCell style={{ fontWeight: 500, fontSize: '16px', color: '#6C6C6C', cursor: 'pointer' }}>
                                                    {employee.name}
                                                </TableCell>
                                                <TableCell style={{ fontWeight: 500, fontSize: '16px', color: '#6C6C6C' }}>
                                                    {employee.department}
                                                </TableCell>
                                                <TableCell style={{ fontWeight: 500, fontSize: '16px', color: '#6C6C6C' }}>
                                                    {employee.reason}
                                                </TableCell>
                                                <TableCell style={{ fontWeight: 500, fontSize: '16px', color: '#6C6C6C' }}>
                                                    {employee.deduction}
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

export default DeductionList
