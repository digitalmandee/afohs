import { router } from '@inertiajs/react';
import { ArrowBack as ArrowBackIcon, ArrowForward as ArrowForwardIcon } from '@mui/icons-material';
import { Box, Button, Paper, TextField, Typography, useTheme } from '@mui/material';
import { useState } from 'react';

const ForgetPin = () => {
    const [companyId, setCompanyId] = useState('');
    const theme = useTheme();
    const [pin, setPin] = useState(['•', '', '', '', '', '']);

    return (
        <>
            <Box
                sx={{
                    display: 'flex',
                    height: '100vh',
                    width: '100%',
                    position: 'relative',
                    overflow: 'hidden',
                    backgroundImage: `url(/assets/bgimage1.png)`,
                    backgroundSize: 'contain',
                    backgroundPosition: 'center',
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                    },
                }}
            >
                {/* Left side with text */}
                {/* <Box
                    sx={{
                        flex: 1,
                        display: { xs: 'none', md: 'flex' },
                        flexDirection: 'column',
                        justifyContent: 'flex-end',
                        p: 4,
                        zIndex: 2,
                    }}
                >
                    <Typography
                        variant="h5"
                        component="div"
                        sx={{
                            color: 'white',
                            maxWidth: '70%',
                            mb: 6,
                            fontWeight: 500,
                            lineHeight: 1.5,
                        }}
                    >
                        AFOHS Club was established in Pakistan Air Force Falcon Complex. A total of 25.5 Kanal of land was demarcated by Air Headquarters in PAF Falcon Complex for the establishment of "Community Centre and Club".
                    </Typography>
                    <Box
                        sx={{
                            display: 'flex',
                            gap: 1,
                        }}
                    >
                        {[1, 2, 3, 4, 5].map((_, index) => (
                            <Box
                                key={index}
                                sx={{
                                    width: 12,
                                    height: 12,
                                    borderRadius: '50%',
                                    backgroundColor: index === 0 ? 'white' : 'rgba(255, 255, 255, 0.5)',
                                }}
                            />
                        ))}
                    </Box>
                </Box> */}

                {/* Right side with login form */}
                <Box
                    sx={{
                        width: { xs: '100%', md: '540px' },
                        display: 'flex',
                        flexDirection: 'column',
                        p: 1,
                        //   m: { xs: 1, md: 1 },
                        mt: { xs: 1, md: 1 },
                        mb: { xs: 1, md: 1 },
                        mx: 'auto',
                        zIndex: 1,
                    }}
                >
                    <Paper
                        elevation={4}
                        sx={{
                            borderRadius: 2,
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            backdropFilter: 'blur(10px)',
                            overflow: 'hidden',
                        }}
                    >
                        <Box
                            sx={{
                                width: '100%',
                                // maxWidth: 550,
                                p: 4,
                                // bgcolor: 'white',
                                borderRadius: 1,
                                boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                                border: '1px solid #e0e0e0',
                            }}
                        >
                            {/* Logo */}
                            <Box
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'flex-start',
                                    mb: 2,
                                }}
                            >
                                <Box
                                    component="img"
                                    src="/assets/Logo.png"
                                    alt="AFOHS Club Logo"
                                    sx={{
                                        width: 150,
                                        height: 114,
                                    }}
                                />
                            </Box>

                            {/* Heading */}
                            <Typography
                                variant="h5"
                                sx={{
                                    fontWeight: 500,
                                    color: '#063455',
                                    fontSize: '30px',
                                    mb: 0.5,
                                }}
                            >
                                Forgot Pin ?
                            </Typography>

                            <Typography
                                sx={{
                                    color: '#7F7F7F',
                                    mb: 3,
                                    mt: 1,
                                    fontSize: '16px',
                                }}
                            >
                                No worries, we'll send you reset instructions
                            </Typography>

                            {/* Account Selection */}
                            <Box sx={{ mb: 3 }}>
                                <Typography
                                    sx={{
                                        color: '#121212',
                                        mb: 1,
                                        fontSize: '14px',
                                    }}
                                >
                                    Business Name
                                </Typography>
                                <Box
                                    component="span"
                                    sx={{
                                        color: '#063455',
                                        fontSize: '18px',
                                        fontWeight: 500,
                                    }}
                                >
                                    Afohs Club Shop (IMAJI101010)
                                </Box>
                            </Box>

                            {/* PIN Entry */}
                            <Box sx={{ mb: 3 }}>
                                <Typography
                                    sx={{
                                        color: '#121212',
                                        mb: 1,
                                        mt: 1,
                                        fontSize: '0.9rem',
                                    }}
                                >
                                    Employee Email
                                </Typography>
                                <Box
                                    sx={{
                                        display: 'flex',
                                        gap: 1.3,
                                        width: '100%',
                                    }}
                                >
                                    <TextField
                                        fullWidth
                                        placeholder="e.g: Jamal@gmail.com"
                                        value={companyId}
                                        onChange={(e) => setCompanyId(e.target.value)}
                                        size="small"
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                '& fieldset': {
                                                    borderColor: '#121212',
                                                },
                                                '&:hover fieldset': {
                                                    borderColor: '#121212',
                                                },
                                                '&.Mui-focused fieldset': {
                                                    borderColor: '#121212',
                                                },
                                            },
                                        }}
                                    />
                                </Box>
                            </Box>

                            {/* Navigation Buttons */}
                            <Box
                                sx={{
                                    display: 'flex',
                                    width: '100%',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                }}
                            >
                                <Button
                                    startIcon={<ArrowBackIcon />}
                                    sx={{
                                        borderRadius: '0',
                                        width: '215px',
                                        height: '48px',
                                        border: '1px solid #E3E3E3',
                                        bgcolor: '#FFFFFF',
                                        color: '#121212',
                                        // fontSize:'16px',
                                        '&:hover': {
                                            bgcolor: 'rgba(0,0,0,0.04)',
                                        },
                                    }}
                                    onClick={() => router.visit('/employee/sign-in')}
                                >
                                    Back
                                </Button>
                                <Button
                                    variant="contained"
                                    endIcon={<ArrowForwardIcon />}
                                    sx={{
                                        borderRadius: '0',
                                        width: '215px',
                                        height: '46px',
                                        bgcolor: '#063455',
                                        color: '#FFFFFF',
                                        // fontSize:'16px',
                                        '&:hover': {
                                            bgcolor: '#083654',
                                        },
                                        px: 3,
                                    }}
                                    onClick={() => router.visit('/reset/pin')}
                                >
                                    Reset Pin
                                </Button>
                            </Box>
                        </Box>
                    </Paper>
                </Box>
            </Box>
        </>
    );
};
ForgetPin.layout = (page) => page;
export default ForgetPin;
