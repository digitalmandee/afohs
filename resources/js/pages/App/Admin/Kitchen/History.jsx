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
    Drawer,
    TextField
} from "@mui/material"
import { Add, CalendarToday, FilterAlt, ArrowBack } from "@mui/icons-material"
import SearchIcon from '@mui/icons-material/Search';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import AddIcon from '@mui/icons-material/Add';
import { router } from '@inertiajs/react';
import CustomerDetail from './Detail';
import OrderHistory from './Order';

const CustomerHistory = () => {
    // const [open, setOpen] = useState(true);
    const [openProfile, setOpenProfile] = useState(false);
    const [profileView, setProfileView] = useState('customer');

    const handleGoToHistory = () => {
        setProfileView('history');
    };

    const handleProfileClose = () => {
        setOpenProfile(false);
        setProfileView('customer'); // Reset to default on close
    };
    const handleProfileOpen = () => setOpenProfile(true);

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
            id: '0123',
            name: 'John Doe',
            payment_method: 'Cash',
            amount: '5000',
            date: "Apr 09-2024",
            status: "Complete",
            details: "View"
        },
        {
            id: '0123',
            name: 'John Doe',
            payment_method: 'Cash',
            amount: '5000',
            date: "Apr 09-2024",
            status: "Complete",
            details: "View"
        },
        {
            id: '0123',
            name: 'John Doe',
            payment_method: 'Cash',
            amount: '5000',
            date: "Apr 09-2024",
            status: "Complete",
            details: "View"
        },
        {
            id: '0123',
            name: 'John Doe',
            payment_method: 'Cash',
            amount: '5000',
            date: "Apr 09-2024",
            status: "Complete",
            details: "View"
        },
        {
            id: '0123',
            name: 'John Doe',
            payment_method: 'Cash',
            amount: '5000',
            date: "Apr 09-2024",
            status: "Complete",
            details: "View"
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
                                    Customer History
                                </Typography>
                            </Box>
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
                                // onClick={() => setOpenFilterModal(true)}
                                >
                                    Filter
                                </Button>

                                {/* Add Icon Button */}
                                <Button
                                    style={{
                                        color: 'white',
                                        backgroundColor: '#063455',
                                        textTransform: 'none',
                                        height: 40
                                    }}
                                // onClick={() => router.visit('/employee/payroll/reimbursements')}
                                >
                                    Print
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
                                        <TableCell style={{ color: '#000000', fontWeight: '500', fontSize: '16px' }}>Invoice ID</TableCell>
                                        <TableCell style={{ color: '#000000', fontWeight: '500', fontSize: '16px' }}>Customer Name</TableCell>
                                        <TableCell style={{ color: '#000000', fontWeight: '500', fontSize: '16px' }}>Payment Method</TableCell>
                                        <TableCell style={{ color: '#000000', fontWeight: '500', fontSize: '16px' }}>Amount</TableCell>
                                        <TableCell style={{ color: '#000000', fontWeight: '500', fontSize: '16px' }}>Date&Time</TableCell>
                                        <TableCell style={{ color: '#000000', fontWeight: '500', fontSize: '16px' }}>Status</TableCell>
                                        <TableCell style={{ color: '#000000', fontWeight: '500', fontSize: '16px' }}>View Details</TableCell>
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
                                                    {employee.id}
                                                </TableCell>
                                                <TableCell style={{ fontWeight: 500, fontSize: '16px', color: '#6C6C6C' }}>
                                                    {employee.name}
                                                </TableCell>
                                                <TableCell style={{ fontWeight: 500, fontSize: '16px', color: '#6C6C6C' }}>
                                                    {employee.payment_method}
                                                </TableCell>
                                                <TableCell style={{ fontWeight: 500, fontSize: '16px', color: '#6C6C6C' }}>
                                                    {employee.amount}
                                                </TableCell>
                                                <TableCell style={{ fontWeight: 500, fontSize: '16px', color: '#6C6C6C', cursor: 'pointer' }}>
                                                    {employee.date}
                                                </TableCell>
                                                <TableCell style={{ fontWeight: 500, fontSize: '16px', color: '#6C6C6C', cursor: 'pointer' }}>
                                                    {employee.status}
                                                </TableCell>
                                                <TableCell style={{ fontWeight: 500, fontSize: '16px', color: '#6C6C6C', cursor: 'pointer' }}
                                                    onClick={handleProfileOpen}
                                                >
                                                    {employee.details}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </div>
                </Box>
                <Drawer
                    anchor="right"
                    open={openProfile}
                    onClose={handleProfileClose}
                    PaperProps={{
                        sx: {
                            width: 550,
                            height:'97vh',
                            top: 10,
                            right:10,
                            padding: 2,
                            bgcolor: '#E3F2FD',
                        },
                    }}
                >
                    {profileView === 'customer' ? (
                        <CustomerDetail handleGoToHistory={handleGoToHistory} />
                    ) : (
                        <OrderHistory handleBackToProfile={() => setProfileView('customer')} />
                    )}
                </Drawer>
            {/* </div> */}
        </>
    )
}

export default CustomerHistory
