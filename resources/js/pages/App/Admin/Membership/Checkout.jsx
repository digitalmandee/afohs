import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Box } from '@mui/material';
import { ArrowBack as ArrowBackIcon, Print as PrintIcon } from '@mui/icons-material';
import { router } from '@inertiajs/react';

const CheckOut = () => {
    // const [open, setOpen] = useState(true);
    // Guest details
    const guestDetails = {
        name: 'Zahid Ullah',
        authorizedBy: 'Bilal Ahad',
        phone: '04635463546',
        date: '28-Apr-2025',
        branch: 'Officer Club',
        totalBill: 'Rs. 18.50',
    };

    // Guest activities
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
    ];

    // Handle check-out
    const handleCheckOut = () => {
        console.log('Guest checked out');
        // Add your check-out logic here
    };

    // Handle cancel
    const handleCancel = () => {
        console.log('Check-out cancelled');
        // Add your cancel logic here
    };

    // Handle print
    const handlePrint = () => {
        console.log('Printing check-out details');
        // Add your print logic here
        window.print();
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
            <div style={{ fontFamily: 'Arial, sans-serif', padding: '20px' }}>
                {/* Header with back button, title, and print button */}
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
                            Check-Out
                        </Typography>
                    </div>
                    <Button
                        variant="contained"
                        startIcon={<PrintIcon />}
                        onClick={handlePrint}
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

                {/* Guest Information Section */}
                <Paper
                    elevation={0}
                    style={{
                        padding: '20px',
                        marginBottom: '20px',
                        borderRadius: '4px',
                        backgroundColor: '#fff',
                    }}
                >
                    <div className="row">
                        <div className="col-md-6">
                            <Box mb={1}>
                                <Typography component="span" style={{ color: '#555', fontSize: '14px' }}>
                                    Guest Name :
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
                                    {guestDetails.name}
                                </Typography>
                            </Box>
                            <Box mb={1}>
                                <Typography component="span" style={{ color: '#555', fontSize: '14px' }}>
                                    Authorized by :
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
                                    {guestDetails.authorizedBy}
                                </Typography>
                            </Box>
                            <Box>
                                <Typography component="span" style={{ color: '#555', fontSize: '14px' }}>
                                    Phone :
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
                                    {guestDetails.phone}
                                </Typography>
                            </Box>
                        </div>
                        <div className="col-md-6">
                            <Box mb={1}>
                                <Typography component="span" style={{ color: '#555', fontSize: '14px' }}>
                                    Date :
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
                                    {guestDetails.date}
                                </Typography>
                            </Box>
                            <Box mb={1}>
                                <Typography component="span" style={{ color: '#555', fontSize: '14px' }}>
                                    Company :
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
                                    {guestDetails.branch}
                                </Typography>
                            </Box>
                            <Box>
                                <Typography component="span" style={{ color: '#555', fontSize: '14px' }}>
                                    Total Bill :
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
                                    {guestDetails.totalBill}
                                </Typography>
                            </Box>
                        </div>
                    </div>
                </Paper>

                {/* Activities Table */}
                <TableContainer
                    component={Paper}
                    style={{
                        boxShadow: 'none',
                        borderRadius: '4px',
                        overflow: 'hidden',
                        marginBottom: '20px',
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

                {/* Action Buttons */}
                <div className="d-flex justify-content-end">
                    <Button
                        onClick={handleCancel}
                        style={{
                            marginRight: '10px',
                            textTransform: 'none',
                            color: '#333',
                            fontSize: '14px',
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleCheckOut}
                        style={{
                            textTransform: 'none',
                            backgroundColor: '#063455',
                            color: 'white',
                            fontSize: '14px',
                            padding: '6px 16px',
                        }}
                        variant="contained"
                    >
                        Check-Out
                    </Button>
                </div>
            </div>
            {/* </div> */}
        </>
    );
};

export default CheckOut;
