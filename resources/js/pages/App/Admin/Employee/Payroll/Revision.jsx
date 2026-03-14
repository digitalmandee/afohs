import React, { useState } from 'react'
import {
    Box,
    Typography,
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
    Dialog,
    TextField,
} from "@mui/material"
import { ArrowBack, AccessTime, Settings, GetApp, Description, ChevronLeft, ChevronRight } from "@mui/icons-material"
import SearchIcon from '@mui/icons-material/Search';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';


const SalaryRevision = () => {
    // const [open, setOpen] = useState(true);
    const [formData, setFormData] = useState({
        guestName: '',
        phone: '',
        clubName: '',
        authorizedBy: '',
        checkInDate: '',
        checkInTime: ''
    });
    const [openSalaryEditModal, setOpenSalaryEditModal] = useState(false);
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
            ctc_year: '-',
            ctc_month: '-',
            join_date: 'Apr 01-2025',
            total_year: 4,
            salary: 500,
            status: 'paid',
            updated: "Apr 01-2025"
        },
        {
            name: 'John Doe',
            ctc_year: '-',
            ctc_month: '-',
            join_date: 'Apr 01-2025',
            total_year: 4,
            salary: 500,
            status: 'unpaid',
            updated: "Apr 01-2025"
        },
        {
            name: 'John Doe',
            ctc_year: '-',
            ctc_month: '-',
            join_date: 'Apr 01-2025',
            total_year: 4,
            salary: 500,
            status: 'unpaid',
            updated: "Apr 01-2025"
        },
        {
            name: 'John Doe',
            ctc_year: '-',
            ctc_month: '-',
            join_date: 'Apr 01-2025',
            total_year: 4,
            salary: 500,
            status: 'paid',
            updated: "Apr 01-2025"
        },
        {
            name: 'John Doe',
            ctc_year: '-',
            ctc_month: '-',
            join_date: 'Apr 01-2025',
            total_year: 4,
            salary: 500,
            status: 'unpaid',
            updated: "Apr 01-2025"
        },
    ];
    return (
        <>
            {/* <SideNav open={open} setOpen={setOpen} /> */}
            <div
                style={{
                    minHeight:'100vh',
                    backgroundColor: '#F6F6F6'
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
                            <Typography sx={{ color: '#063455', fontWeight: 500, fontSize: '30px' }}>
                                Salary Revision
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
                                onClick={() => {
                                    setOpenFilter(true);
                                }}
                            >
                                <ArrowDownwardIcon />
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
                                        <TableCell style={{ color: '#000000', fontWeight: '500', fontSize: '16px' }}>Name</TableCell>
                                        <TableCell style={{ color: '#000000', fontWeight: '500', fontSize: '16px' }}>CTC per year</TableCell>
                                        <TableCell style={{ color: '#000000', fontWeight: '500', fontSize: '16px' }}>CTC per month</TableCell>
                                        <TableCell style={{ color: '#000000', fontWeight: '500', fontSize: '16px' }}>Date of Join</TableCell>
                                        <TableCell style={{ color: '#000000', fontWeight: '500', fontSize: '16px' }}>Total Year</TableCell>
                                        <TableCell style={{ color: '#000000', fontWeight: '500', fontSize: '16px' }}>Salary</TableCell>
                                        <TableCell style={{ color: '#000000', fontWeight: '500', fontSize: '16px' }}>Status</TableCell>
                                        <TableCell style={{ color: '#000000', fontWeight: '500', fontSize: '16px' }}>Updated</TableCell>
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
                                                <TableCell style={{ fontWeight: 500, fontSize: '16px', color: '#6C6C6C', cursor:'pointer' }}
                                                    onClick={() => {
                                                        setOpenSalaryEditModal(true); // open the modal
                                                    }}
                                                >
                                                    {employee.name}
                                                </TableCell>
                                                <TableCell style={{ fontWeight: 500, fontSize: '16px', color: '#6C6C6C' }}>
                                                    {employee.ctc_year}
                                                </TableCell>
                                                <TableCell style={{ fontWeight: 500, fontSize: '16px', color: '#6C6C6C' }}>
                                                    {employee.ctc_month}
                                                </TableCell>
                                                <TableCell style={{ fontWeight: 500, fontSize: '16px', color: '#6C6C6C' }}>
                                                    {employee.join_date}
                                                </TableCell>
                                                <TableCell style={{ fontWeight: 500, fontSize: '16px', color: '#6C6C6C' }}>
                                                    {employee.total_year}
                                                </TableCell>
                                                <TableCell style={{ fontWeight: 500, fontSize: '16px', color: '#6C6C6C' }}>
                                                    {employee.salary}
                                                </TableCell>
                                                <TableCell>
                                                    <span
                                                        style={{
                                                            backgroundColor:
                                                                employee.status === 'paid' ? '#063455' : '#B0DEFF',
                                                            color: employee.status === 'paid' ? "#FFFFFF" : "black",
                                                            borderRadius: '12px',
                                                            padding: '2px 12px',
                                                            fontSize: '12px',
                                                            fontWeight: '500',
                                                            display: 'inline-block',
                                                        }}>
                                                        {employee.status}
                                                    </span>
                                                </TableCell>
                                                <TableCell style={{ fontWeight: 500, fontSize: '16px', color: '#6C6C6C' }}>
                                                    {employee.updated}
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
                    open={openSalaryEditModal}
                    onClose={() => setOpenSalaryEditModal(false)}
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
                                Edit Salary
                            </Typography>
                        </div>

                        {/* Form Card */}
                        <Paper
                            elevation={0}
                            style={{
                                maxWidth: '600px',
                                margin: '0 auto',
                                padding: '10px',
                                borderRadius: '4px'
                            }}
                        >
                            <form>
                                {/* Guest Name */}
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
                                        Name
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        name="guestName"
                                        value={formData.guestName}
                                        onChange={handleChange}
                                        placeholder="e.g. Name"
                                        variant="outlined"
                                        size="small"
                                        style={{ marginBottom: '8px' }}
                                        InputProps={{
                                            style: { fontSize: '14px' }
                                        }}
                                    />
                                </Box>

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
                                        Salary
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
                                        Status
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder="e.g. Status"
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

                                {/* Action Buttons */}
                                <Box display="flex"
                                    justifyContent="flex-end">
                                    <Button
                                        variant="text"
                                        style={{
                                            backgroundColor:'#F14C35',
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
            </div>
        </>
    )
}

export default SalaryRevision
