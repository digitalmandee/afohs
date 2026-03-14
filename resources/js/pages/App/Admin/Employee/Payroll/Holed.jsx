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
import HoledEmployeeFilter from './HoledFilter';

const HoledSalary = () => {
    // const [open, setOpen] = useState(true);
    const [openEmployeeEditModal, setOpenEmployeeEditModal] = useState(false);
    const [openFilterModal, setOpenFilterModal] = useState(false);
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
            reason: 'Bank detail missing',
            status: "Pending"
        },
        {
            name: 'John Doe',
            reason: 'Bank detail missing issue arised yesterday',
            status: "Resolve"
        },
        {
            name: 'John Doe',
            reason: 'Bank detail missing issue arised yesterday',
            status: "Resolve"
        },
        {
            name: 'John Doe',
            reason: 'Bank detail missing issue arised yesterday',
            status: "Resolve"
        },
        {
            name: 'John Doe',
            reason: 'Bank detail missing issue arised yesterday',
            status: "Resolve"
        },
    ];
    return (
        <>
            {/* <SideNav open={open} setOpen={setOpen} /> */}
            <div
                style={{
                    minHeight:'100vh',
                    backgroundColor: '#F5f5f5'
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
                                Holed Salary
                            </Typography>
                        </Box>

                        {/* Right: Search + Filter */}
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {/* Search Bar */}
                            <Box sx={{ display: 'flex', alignItems: 'center', marginRight: 10 }}>
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
                                    onClick={() => {
                                        setOpenFilterModal(true);
                                    }}
                                >
                                    Filter
                                </Button>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
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
                                    onClick={() => router.visit('/employee/payroll/add/holed/employee')}
                                >
                                    <AddIcon />
                                </Button>

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
                                    onClick={() => {
                                        setOpenFilter(true);
                                    }}
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
                                        <TableCell style={{ color: '#000000', fontWeight: '500', fontSize: '16px' }}>Reason</TableCell>
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
                                                <TableCell style={{ fontWeight: 500, fontSize: '16px', color: '#6C6C6C', cursor: 'pointer' }}
                                                    onClick={() => {
                                                        setOpenEmployeeEditModal(true); // open the modal
                                                    }}
                                                >
                                                    {employee.name}
                                                </TableCell>
                                                <TableCell style={{ fontWeight: 500, fontSize: '16px', color: '#6C6C6C' }}>
                                                    {employee.reason}
                                                </TableCell>
                                                <TableCell>
                                                    <span
                                                        style={{
                                                            backgroundColor: employee.status === 'Pending' ? "#B0DEFF" : "#063455",
                                                            color: employee.status === 'Pending' ? "black" : "#FFFFFF",
                                                            borderRadius: '12px',
                                                            padding: '2px 12px',
                                                            fontSize: '12px',
                                                            fontWeight: '500',
                                                            display: 'inline-block',
                                                        }}>
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
                <Dialog
                    open={openEmployeeEditModal}
                    onClose={() => setOpenEmployeeEditModal(false)}
                    fullWidth
                    maxWidth="sm"
                    PaperProps={{
                        style: {
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            m: 0,
                            width: '600px',
                            borderRadius: 2,
                            p: 2
                        },
                    }}
                >
                    <div style={{
                        fontFamily: 'Arial, sans-serif',
                        padding: '20px',
                        backgroundColor: '#FFFFFF',
                        // minHeight: '100vh'
                    }}>
                        {/* Header with back button and title */}
                        <div className="d-flex align-items-center mb-4">
                            <Typography variant="h5" style={{
                                fontWeight: 500,
                                color: '#063455',
                                fontSize: '30px'
                            }}>
                                Hold Employee Edit
                            </Typography>
                        </div>

                        {/* Form Card */}
                        <Paper
                            elevation={0}
                            style={{
                                maxWidth: '600px',
                                margin: '0 auto',
                                borderRadius: '4px',
                                marginTop: 12
                            }}
                        >
                            <form>

                                {/* Phone */}
                                <Box mb={2}>
                                    <Typography
                                        variant="body1"
                                        style={{
                                            marginBottom: '8px',
                                            color: '#121212',
                                            fontSize: '14px',
                                            fontWeight: 500
                                        }}
                                    >
                                        Status
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder="e.g. Salary"
                                        variant="outlined"
                                        size="small"
                                        style={{ marginBottom: '8px' }}
                                        InputProps={{
                                            style: { fontSize: '14px' },
                                            endAdornment: (
                                                <ArrowDropDownIcon style={{ color: '#121212' }} />
                                            ),
                                        }}
                                    />
                                </Box>

                                <Box mb={2}>
                                    <Typography
                                        variant="body1"
                                        style={{
                                            marginBottom: '8px',
                                            color: '#121212',
                                            fontSize: '14px',
                                            fontWeight: 500
                                        }}
                                    >
                                        Reason
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        name="guestName"
                                        value={formData.guestName}
                                        onChange={handleChange}
                                        placeholder="e.g. Enter Bank Details"
                                        variant="outlined"
                                        size="small"
                                        multiline
                                        minRows={4} // adjust until it's around 90px in height
                                        style={{ marginBottom: '8px' }}
                                        InputProps={{
                                            style: { fontSize: '14px' }
                                        }}
                                    />
                                </Box>

                                {/* Action Buttons */}
                                <Box display="flex"
                                    justifyContent="flex-end">
                                    <Button
                                        variant="text"
                                        style={{
                                            backgroundColor: '#F14C35',
                                            marginRight: '10px',
                                            color: '#FFFFFF',
                                            textTransform: 'none',
                                            fontSize: '14px'
                                        }}
                                    >
                                        Delete
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        style={{
                                            backgroundColor: '#063455',
                                            color: 'white',
                                            textTransform: 'none',
                                            fontSize: '14px',
                                            padding: '6px 16px'
                                        }}
                                    >
                                        Save
                                    </Button>
                                </Box>
                            </form>
                        </Paper>
                    </div>
                </Dialog>
                <HoledEmployeeFilter
                    open={openFilterModal}
                    onClose={() => setOpenFilterModal(false)} />
            </div>
        </>
    )
}

export default HoledSalary
