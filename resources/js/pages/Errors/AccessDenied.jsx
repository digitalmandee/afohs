import React from 'react';
import { Head } from '@inertiajs/react';
import { Box, Button, Typography, Paper, Divider } from '@mui/material';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useState } from 'react';


const AccessDenied = ({ message }) => {
    // const [open, setOpen] = useState(true);

    return (
        <>
            <Head title="Access Denied" />
            {/* <SideNav open={open} setOpen={setOpen} />
            <div
                style={{
                    marginLeft: open ? `${drawerWidthOpen}px` : `${drawerWidthClosed}px`,
                    transition: 'margin-left 0.3s ease-in-out',
                    marginTop: '5.5rem',
                }}
            > */}
                <Box
                    className="d-flex align-items-center justify-content-center"
                    sx={{
                        minHeight: 'calc(100vh - 5.5rem)',
                        background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
                        padding: 2,
                    }}
                >
                    <Paper
                        elevation={8}
                        className="text-center p-5"
                        sx={{
                            maxWidth: 600,
                            width: '100%',
                            borderRadius: 4,
                            backgroundColor: '#ffffff',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                        }}
                    >
                        {/* Animated Icon */}
                        <Box
                            sx={{
                                display: 'inline-flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                backgroundColor: '#ffe5e5',
                                borderRadius: '50%',
                                width: 100,
                                height: 100,
                                marginBottom: 3,
                                animation: 'pulse 1.5s infinite',
                            }}
                        >
                            <ReportProblemIcon sx={{ fontSize: 40, color: '#d32f2f' }} />
                        </Box>

                        {/* Heading */}
                        <Typography variant="h2" color="error" gutterBottom sx={{ fontWeight: 'bold' }}>
                            403
                        </Typography>
                        <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                            {message || 'Access Denied'}
                        </Typography>
                    </Paper>

                    {/* Animation Keyframes */}
                    <style>
                        {`
                         @keyframes pulse {
                           0% { transform: scale(1); opacity: 1; }
                           50% { transform: scale(1.1); opacity: 0.8; }
                           100% { transform: scale(1); opacity: 1; }
                         }
                       `}
                    </style>
                </Box>
            {/* </div> */}
        </>
    );
};

export default AccessDenied;
