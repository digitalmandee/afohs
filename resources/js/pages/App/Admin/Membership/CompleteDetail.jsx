import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Grid, Box } from '@mui/material';
import { ArrowBack as ArrowBackIcon, Print as PrintIcon, Email as EmailIcon } from '@mui/icons-material';
import { router } from '@inertiajs/react';

const ViewFullDetails = () => {
    // const [open, setOpen] = useState(true);
    // Member details
    const memberDetails = {
        name: 'Zahid Ullah',
        type: 'Applied Member',
        contact: '03434343434 / user@gmail.com',
        date: '28-Apr-2025',
        branch: 'Afohs Club',
        totalBill: 'Rs. 18.50',
    };

    // Visit activities
    const activities = [
        {
            time: '3:02 PM',
            type: 'Check-In',
            details: 'At main entrance',
        },
        {
            time: '3:15 PM',
            type: 'Food Order',
            details: 'Chicken Sandwich x 1',
        },
        {
            time: '3:45 PM',
            type: 'Drink',
            details: 'Pepsi x 1',
        },
        {
            time: '4:00 PM',
            type: 'Sports',
            details: 'GYP-30m',
        },
        {
            time: '5:15 PM',
            type: 'Food Order',
            details: 'Fries x1',
        },
        {
            time: '6:15 PM',
            type: 'Check-Out',
            details: 'Total Duration: 3h 15m',
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
                    backgroundColor: '#F6F6F6',
                }}
            > */}
            <div style={{ fontFamily: 'Arial, sans-serif', padding: '20px' }}>
                {/* Header with back button and title */}
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div className="d-flex align-items-center">
                        <ArrowBackIcon
                            style={{
                                cursor: 'pointer',
                                marginRight: '10px',
                                color: '#555',
                                fontSize: '24px',
                            }}
                        />
                        <Typography
                            variant="h5"
                            style={{
                                fontWeight: 500,
                                color: '#333',
                                fontSize: '24px',
                            }}
                        >
                            View Full Details
                        </Typography>
                    </div>
                    <div>
                        <Button
                            variant="outlined"
                            startIcon={<EmailIcon />}
                            style={{
                                marginRight: '10px',
                                textTransform: 'none',
                                color: '#333',
                                borderColor: '#ccc',
                                fontSize: '14px',
                            }}
                        >
                            Send via Email
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<PrintIcon />}
                            style={{
                                backgroundColor: '#063455',
                                textTransform: 'none',
                                color: 'white',
                                borderRadius: '4px',
                                padding: '6px 16px',
                                fontSize: '14px',
                            }}
                        >
                            Print
                        </Button>
                    </div>
                </div>

                {/* Member Information Section */}
                <Paper
                    elevation={0}
                    style={{
                        padding: '20px',
                        marginBottom: '20px',
                        borderRadius: '4px',
                        backgroundColor: '#fff',
                    }}
                >
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                            <Box mb={1}>
                                <Typography component="span" style={{ color: '#555', fontSize: '14px' }}>
                                    Member Name:
                                </Typography>
                                <Typography
                                    component="span"
                                    style={{
                                        color: '#000',
                                        fontWeight: 500,
                                        marginLeft: '5px',
                                        fontSize: '14px',
                                    }}
                                >
                                    {memberDetails.name}
                                </Typography>
                            </Box>
                            <Box mb={1}>
                                <Typography component="span" style={{ color: '#555', fontSize: '14px' }}>
                                    Member Type:
                                </Typography>
                                <Typography
                                    component="span"
                                    style={{
                                        color: '#000',
                                        fontWeight: 500,
                                        marginLeft: '5px',
                                        fontSize: '14px',
                                    }}
                                >
                                    {memberDetails.type}
                                </Typography>
                            </Box>
                            <Box>
                                <Typography component="span" style={{ color: '#555', fontSize: '14px' }}>
                                    Contact:
                                </Typography>
                                <Typography
                                    component="span"
                                    style={{
                                        color: '#000',
                                        fontWeight: 500,
                                        marginLeft: '5px',
                                        fontSize: '14px',
                                    }}
                                >
                                    {memberDetails.contact}
                                </Typography>
                            </Box>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Box mb={1}>
                                <Typography component="span" style={{ color: '#555', fontSize: '14px' }}>
                                    Date:
                                </Typography>
                                <Typography
                                    component="span"
                                    style={{
                                        color: '#000',
                                        fontWeight: 500,
                                        marginLeft: '5px',
                                        fontSize: '14px',
                                    }}
                                >
                                    {memberDetails.date}
                                </Typography>
                            </Box>
                            <Box mb={1}>
                                <Typography component="span" style={{ color: '#555', fontSize: '14px' }}>
                                    Company:
                                </Typography>
                                <Typography
                                    component="span"
                                    style={{
                                        color: '#000',
                                        fontWeight: 500,
                                        marginLeft: '5px',
                                        fontSize: '14px',
                                    }}
                                >
                                    {memberDetails.branch}
                                </Typography>
                            </Box>
                            <Box>
                                <Typography component="span" style={{ color: '#555', fontSize: '14px' }}>
                                    Total Bill:
                                </Typography>
                                <Typography
                                    component="span"
                                    style={{
                                        color: '#000',
                                        fontWeight: 500,
                                        marginLeft: '5px',
                                        fontSize: '14px',
                                    }}
                                >
                                    {memberDetails.totalBill}
                                </Typography>
                            </Box>
                        </Grid>
                    </Grid>
                </Paper>

                {/* Activities Table */}
                <TableContainer
                    component={Paper}
                    style={{
                        boxShadow: 'none',
                        borderRadius: '4px',
                        overflow: 'hidden',
                    }}
                >
                    <Table>
                        <TableHead>
                            <TableRow style={{ backgroundColor: '#f0f0f5' }}>
                                <TableCell
                                    style={{
                                        fontWeight: 'bold',
                                        color: '#333',
                                        padding: '16px',
                                        fontSize: '14px',
                                        width: '33%',
                                    }}
                                >
                                    Time
                                </TableCell>
                                <TableCell
                                    style={{
                                        fontWeight: 'bold',
                                        color: '#333',
                                        padding: '16px',
                                        fontSize: '14px',
                                        width: '33%',
                                    }}
                                >
                                    Type
                                </TableCell>
                                <TableCell
                                    style={{
                                        fontWeight: 'bold',
                                        color: '#333',
                                        padding: '16px',
                                        fontSize: '14px',
                                        width: '34%',
                                    }}
                                >
                                    Details
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {activities.map((activity, index) => (
                                <TableRow
                                    key={index}
                                    style={{
                                        borderBottom: index === activities.length - 1 ? 'none' : '1px solid #e0e0e0',
                                    }}
                                >
                                    <TableCell
                                        style={{
                                            color: '#555',
                                            padding: '16px',
                                            fontSize: '14px',
                                        }}
                                    >
                                        {activity.time}
                                    </TableCell>
                                    <TableCell
                                        style={{
                                            color: '#555',
                                            padding: '16px',
                                            fontSize: '14px',
                                        }}
                                    >
                                        {activity.type}
                                    </TableCell>
                                    <TableCell
                                        style={{
                                            color: '#555',
                                            padding: '16px',
                                            fontSize: '14px',
                                        }}
                                    >
                                        {activity.details}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </div>
            {/* </div> */}
        </>
    );
};

export default ViewFullDetails;
