import React from 'react';
import { Head } from '@inertiajs/react';
import { Box, Button, Typography, Paper, Divider } from '@mui/material';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import 'bootstrap/dist/css/bootstrap.min.css';

export default function TenantNotFound({ message }) {
    return (
        <Box
            className="d-flex align-items-center justify-content-center"
            sx={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
                padding: 2,
            }}
        >
            <Head title="Tenant Not Found" />
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
                    404
                </Typography>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                    Page Not Found
                </Typography>

                {/* Divider */}
                <Divider sx={{ my: 3 }} />

                {/* Message */}
                {/* <Typography variant="body1" color="textSecondary" paragraph sx={{ maxWidth: 450, margin: '0 auto 24px auto' }}>
                    {message || 'The tenant you are looking for does not exist or is unavailable. Please check the URL or return to the home page.'}
                </Typography> */}

                {/* CTA */}
                <Button
                    href="/"
                    variant="contained"
                    size="large"
                    sx={{
                        borderRadius: 3,
                        textTransform: 'none',
                        fontSize: '1rem',
                        paddingX: 4,
                        paddingY: 1.5,
                        background: 'linear-gradient(90deg, #063455, #0c67a7ff)',
                        boxShadow: '0 6px 12px rgba(25,118,210,0.3)',
                        '&:hover': {
                            background: 'linear-gradient(90deg, #083555ff, #0c5488ff)',
                        },
                    }}
                >
                    Go Home
                </Button>
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
    );
}
