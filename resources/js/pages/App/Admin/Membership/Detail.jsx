import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import {
    Button,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    IconButton
} from '@mui/material';
import {
    ArrowBack as ArrowBackIcon,
    Print as PrintIcon
} from '@mui/icons-material';
import { router } from '@inertiajs/react';


const VisitDetails = () => {
    // const [open, setOpen] = useState(true);
    // Sample data for visits
    const visits = [
        {
            date: '28-Apr-25',
            checkIn: '3:00 PM',
            checkOut: '6:10 PM',
            duration: '3h 10m',
            totalBill: 'Rs. 18,20'
        },
        {
            date: '24-Apr-25',
            checkIn: '2:00 PM',
            checkOut: '5:45 PM',
            duration: '3h 45m',
            totalBill: 'Rs. 10,200'
        },
        {
            date: '14-Apr-25',
            checkIn: '4:00 PM',
            checkOut: '7:20 PM',
            duration: '3h 20m',
            totalBill: 'Rs. 18,000'
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
                    backgroundColor: '#F6F6F6',
                }}
            > */}
                <div style={{ fontFamily: 'Arial, sans-serif', padding: '20px' }}>
                    {/* Header with back button and title */}
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <div className="d-flex align-items-center">
                            <ArrowBackIcon style={{
                                cursor: 'pointer',
                                marginRight: '10px',
                                color: '#555',
                                fontSize: '24px'
                            }} />
                            <Typography variant="h5" style={{
                                fontWeight: 500,
                                color: '#333',
                                fontSize: '24px'
                            }}>
                                Visit Details
                            </Typography>
                        </div>
                        <Button
                            variant="contained"
                            startIcon={<PrintIcon />}
                            style={{
                                backgroundColor: '#063455',
                                textTransform: 'none',
                                color: 'white',
                                borderRadius: '4px',
                                padding: '6px 16px',
                                fontSize: '14px'
                            }}
                        >
                            Print
                        </Button>
                    </div>

                    {/* Visits table */}
                    <TableContainer component={Paper} style={{
                        boxShadow: 'none',
                        borderRadius: '4px',
                        overflow: 'hidden'
                    }}>
                        <Table>
                            <TableHead>
                                <TableRow style={{ backgroundColor: '#f0f0f5' }}>
                                    <TableCell style={{
                                        fontWeight: 'bold',
                                        color: '#333',
                                        padding: '16px',
                                        fontSize: '14px'
                                    }}>
                                        Visited Date
                                    </TableCell>
                                    <TableCell style={{
                                        fontWeight: 'bold',
                                        color: '#333',
                                        padding: '16px',
                                        fontSize: '14px'
                                    }}>
                                        Check-In
                                    </TableCell>
                                    <TableCell style={{
                                        fontWeight: 'bold',
                                        color: '#333',
                                        padding: '16px',
                                        fontSize: '14px'
                                    }}>
                                        Check-Out
                                    </TableCell>
                                    <TableCell style={{
                                        fontWeight: 'bold',
                                        color: '#333',
                                        padding: '16px',
                                        fontSize: '14px'
                                    }}>
                                        Duration
                                    </TableCell>
                                    <TableCell style={{
                                        fontWeight: 'bold',
                                        color: '#333',
                                        padding: '16px',
                                        fontSize: '14px'
                                    }}>
                                        Total Bill
                                    </TableCell>
                                    <TableCell style={{
                                        fontWeight: 'bold',
                                        color: '#333',
                                        padding: '16px',
                                        fontSize: '14px'
                                    }}
                                    >
                                        View Details
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {visits.map((visit, index) => (
                                    <TableRow key={index} style={{
                                        borderBottom: index === visits.length - 1 ? 'none' : '1px solid #e0e0e0'
                                    }}>
                                        <TableCell style={{
                                            color: '#555',
                                            padding: '16px',
                                            fontSize: '14px'
                                        }}>
                                            {visit.date}
                                        </TableCell>
                                        <TableCell style={{
                                            color: '#555',
                                            padding: '16px',
                                            fontSize: '14px'
                                        }}>
                                            {visit.checkIn}
                                        </TableCell>
                                        <TableCell style={{
                                            color: '#555',
                                            padding: '16px',
                                            fontSize: '14px'
                                        }}>
                                            {visit.checkOut}
                                        </TableCell>
                                        <TableCell style={{
                                            color: '#555',
                                            padding: '16px',
                                            fontSize: '14px'
                                        }}>
                                            {visit.duration}
                                        </TableCell>
                                        <TableCell style={{
                                            color: '#555',
                                            padding: '16px',
                                            fontSize: '14px'
                                        }}>
                                            {visit.totalBill}
                                        </TableCell>
                                        <TableCell style={{
                                            padding: '16px',
                                            fontSize: '14px'
                                        }}>
                                            <Button
                                                style={{
                                                    color: '#0066cc',
                                                    textTransform: 'none',
                                                    padding: '0',
                                                    fontWeight: 500,
                                                    fontSize: '14px'
                                                }}
                                                onClick={() => router.visit('/admin/membership/full/detail')}
                                            >
                                                Full Details
                                            </Button>
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

export default VisitDetails;