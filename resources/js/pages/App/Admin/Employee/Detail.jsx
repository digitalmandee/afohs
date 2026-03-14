import React, { useEffect, useState } from 'react';
import { usePage, router } from '@inertiajs/react';
import { Grid, Typography, Card, IconButton, FormControlLabel, Radio, RadioGroup, Select, Chip, FormControl, CardContent, TableCell, TableHead, Link, TableContainer, Table, TableBody, TableRow, Avatar, Button, Divider, List, ListItem, ListItemText, Paper, TextField, MenuItem, Snackbar, Alert } from '@mui/material';
import { FileDownload } from '@mui/icons-material';
import { Box } from '@mui/system';
import PersonalDetails from '@/components/App/Employee/PersonalDetails';
import AttendanceReport from '@/components/App/Employee/AttendanceReport';
import axios from 'axios';

// const drawerWidthOpen = 240;
// const drawerWidthClosed = 110;

const EmployeeDetails = () => {
    const { props } = usePage();
    const { employee } = props; // Get employee data from Laravel controller

    // const [open, setOpen] = useState(true);
    const [selectedTab, setSelectedTab] = useState('personal');
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

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
            <Box sx={{ px: 2, py: 2 }}>
                <div style={{ paddingTop: '1rem' }}>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                        <Typography variant="h5" style={{ fontWeight: 'bold' }}>
                            Employee Details
                        </Typography>
                    </div>

                    <Grid
                        container
                        spacing={2}
                        style={{
                            display: 'flex',
                            width: '100%',
                            alignItems: 'stretch',
                        }}
                    >
                        {/* Left Panel - Profile Section */}
                        <Grid
                            item
                            xs={12}
                            md={3.5}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                height: '100%',
                            }}
                        >
                            <Paper style={{ paddingTop: '2rem', textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', borderRadius: '8px', border: '1px solid #ccc' }}>
                                <Avatar src={'/assets/userimg.png'} alt="Profile" sx={{ width: 100, height: 100, margin: 'auto' }} />
                                <Typography variant="text" sx={{ mt: 2, fontWeight: '600', fontSize: '20px', font: 'Nunito Sans' }}>
                                    {employee?.user?.name || employee?.name}
                                </Typography>
                                {/* Navigation Menu */}
                                <List sx={{ flexGrow: 1, mt: 1 }}>
                                    {menuOptions.map((option) => (
                                        <ListItem
                                            button
                                            key={option.key}
                                            onClick={() => setSelectedTab(option.key)}
                                            selected={selectedTab === option.key}
                                            sx={{
                                                width: '100%',
                                                background: selectedTab === option.key ? '#063455' : 'transparent',
                                                color: selectedTab === option.key ? '#FFFFFF' : '#242220',
                                                paddingLeft: '2rem',
                                                paddingBottom: '1rem',
                                                cursor: 'pointer',
                                                borderRadius: '8px',
                                                margin: '0.2rem',
                                                '&:hover': {
                                                    backgroundColor: '#063455',
                                                    color: '#FFFFFF',
                                                },
                                            }}
                                        >
                                            <ListItemText primary={option.label} />
                                        </ListItem>
                                    ))}
                                </List>
                            </Paper>
                        </Grid>

                        {/* Right Panel - Dynamic Form Section */}
                        <Grid item xs={12} md={8} style={{ display: 'flex', flexDirection: 'column', height: '100%', marginBottom: '1rem' }}>
                            <Paper style={{ padding: '1.5rem', height: '100%', display: 'flex', flexDirection: 'column', borderRadius: '8px', border: '1px solid #ccc' }}>
                                <div style={{ flexGrow: 1, overflowY: 'auto', paddingRight: '1rem' }}>
                                    {selectedTab === 'personal' && <PersonalDetails employee={employee} />}

                                    {selectedTab === 'salary' && (
                                        <>
                                            <Grid container justifyContent="center">
                                                <Grid item xs={12}>
                                                    {/* Salary Detail Section */}

                                                    <CardContent>
                                                        <Typography variant="h6" gutterBottom>
                                                            Salary Detail
                                                        </Typography>
                                                        <Divider sx={{ backgroundColor: 'black', height: 0.01, marginTop: 1 }} />

                                                        <TableContainer component={Paper} elevation={0} sx={{ marginTop: '1rem' }}>
                                                            <Table>
                                                                {/* Table Header */}
                                                                <TableHead>
                                                                    <TableRow sx={{ backgroundColor: '#DDEAFB' }}>
                                                                        <TableCell sx={{ fontWeight: 'bold', border: '1px solid #B0BEC5' }}>Category</TableCell>
                                                                        <TableCell sx={{ fontWeight: 'bold', border: '1px solid #B0BEC5' }} align="left">
                                                                            Amount
                                                                        </TableCell>
                                                                    </TableRow>
                                                                </TableHead>

                                                                {/* Table Body */}
                                                                <TableBody>
                                                                    {salaryDetails.map((row) => (
                                                                        <TableRow key={row.category}>
                                                                            <TableCell
                                                                                component="th"
                                                                                scope="row"
                                                                                sx={{
                                                                                    width: '50%',
                                                                                    border: '1px solid #B0BEC5',
                                                                                }}
                                                                            >
                                                                                {row.category}
                                                                            </TableCell>
                                                                            <TableCell align="left" sx={{ border: '1px solid #B0BEC5' }}>
                                                                                {row.amount.toLocaleString()}
                                                                            </TableCell>
                                                                        </TableRow>
                                                                    ))}
                                                                </TableBody>
                                                            </Table>
                                                        </TableContainer>
                                                    </CardContent>

                                                    {/* Payment Information Section */}
                                                    <Grid item xs={12}>
                                                        <CardContent>
                                                            <Grid container justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                                                                <Grid item>
                                                                    <Typography variant="h6">Payment Information</Typography>
                                                                </Grid>
                                                                <Grid item>
                                                                    <Link href="#" underline="show" sx={{ color: 'black' }}>
                                                                        View all
                                                                    </Link>
                                                                </Grid>
                                                            </Grid>
                                                            <Divider sx={{ backgroundColor: 'black', height: 0.01, marginTop: 1 }} />

                                                            <TableContainer
                                                                component={Paper}
                                                                elevation={0}
                                                                style={{
                                                                    marginTop: '1rem',
                                                                }}
                                                            >
                                                                <Table>
                                                                    <TableHead>
                                                                        <TableRow>
                                                                            <TableCell sx={{ backgroundColor: '#DDEAFB' }}>Payment Method</TableCell>
                                                                            <TableCell sx={{ backgroundColor: '#DDEAFB' }}>Bank Account</TableCell>
                                                                            <TableCell sx={{ backgroundColor: '#DDEAFB' }}>Payment Date</TableCell>
                                                                            <TableCell sx={{ backgroundColor: '#DDEAFB' }}>Status</TableCell>
                                                                        </TableRow>
                                                                    </TableHead>
                                                                    <TableBody>
                                                                        <TableRow>
                                                                            <TableCell>{paymentInfo.method}</TableCell>
                                                                            <TableCell>{paymentInfo.accountNumber}</TableCell>
                                                                            <TableCell>{paymentInfo.date}</TableCell>
                                                                            <TableCell>{paymentInfo.status}</TableCell>
                                                                        </TableRow>
                                                                    </TableBody>
                                                                </Table>
                                                            </TableContainer>

                                                            <Grid container justifyContent="flex-end" spacing={2} sx={{ mt: 3 }}>
                                                                <Grid item>
                                                                    <Button variant="outlined" sx={{ textTransform: 'none' }}>
                                                                        Export
                                                                    </Button>
                                                                </Grid>
                                                                <Grid item>
                                                                    <Button
                                                                        variant="contained"
                                                                        sx={{
                                                                            bgcolor: '#063455',
                                                                            color: '#FFFFFF',
                                                                            '&:hover': {
                                                                                bgcolor: '#063455',
                                                                            },
                                                                            textTransform: 'none',
                                                                        }}
                                                                    >
                                                                        Save
                                                                    </Button>
                                                                </Grid>
                                                            </Grid>
                                                        </CardContent>
                                                    </Grid>
                                                </Grid>
                                            </Grid>
                                        </>
                                    )}

                                    {selectedTab === 'notice' && (
                                        <Grid container justifyContent="center">
                                            <Grid item xs={12}>
                                                <CardContent>
                                                    <Grid container justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                                                        <Grid item>
                                                            <Typography variant="h6">Notice</Typography>
                                                        </Grid>
                                                    </Grid>
                                                    <Divider sx={{ backgroundColor: 'black', height: 0.01, marginTop: 1 }} />

                                                    <TableContainer
                                                        component={Paper}
                                                        elevation={0}
                                                        style={{
                                                            marginTop: '1rem',
                                                        }}
                                                    >
                                                        <Table>
                                                            <TableHead>
                                                                <TableRow>
                                                                    <TableCell sx={{ backgroundColor: '#DDEAFB' }}>Notice</TableCell>
                                                                    <TableCell sx={{ backgroundColor: '#DDEAFB' }}>Date</TableCell>
                                                                    <TableCell sx={{ backgroundColor: '#DDEAFB' }}>Status</TableCell>
                                                                </TableRow>
                                                            </TableHead>
                                                            <TableBody>
                                                                <TableRow>
                                                                    <TableCell>{noticeInfo.method}</TableCell>
                                                                    <TableCell>{noticeInfo.date}</TableCell>
                                                                    <TableCell>{paymentInfo.status}</TableCell>
                                                                </TableRow>
                                                            </TableBody>
                                                        </Table>
                                                    </TableContainer>
                                                </CardContent>
                                            </Grid>
                                        </Grid>
                                    )}

                                    {selectedTab === 'attendance' && <AttendanceReport employee={employee} />}
                                </div>
                            </Paper>
                        </Grid>
                    </Grid>
                </div>
            </Box>
            {/* </div> */}

            <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={handleCloseSnackbar}>
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} variant="filled">
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </>
    );
};

export default EmployeeDetails;

const menuOptions = [
    { key: 'personal', label: 'Personal Details' },
    { key: 'salary', label: 'Salary' },
    // { key: "notice", label: "Notice Period" },
    { key: 'attendance', label: 'Attendance' },
];

const salaryDetails = [
    { category: 'Basic Salary', amount: 30000 },
    { category: 'Bonus', amount: 200 },
    { category: 'Deductions', amount: -100 },
    { category: 'Net Salary', amount: 30000 },
];

const paymentInfo = {
    method: 'Bank transfer',
    accountNumber: '1234 5678 9012',
    date: '01/12/2024',
    status: 'Paid',
};

const noticeInfo = {
    method: 'Bank Transfer Problem',
    date: '01/12/2024',
    status: 'Read',
};
