import { router } from '@inertiajs/react';
import { ArrowBack as ArrowBackIcon, ArrowForward as ArrowForwardIcon } from '@mui/icons-material';
import { Box, Button, Paper, TextField, Typography } from '@mui/material';
import { useState } from 'react';

const SetNewPin = () => {
    const [pin, setPin] = useState(['•', '', '', '', '', '']);
    const [currentIndex, setCurrentIndex] = useState(1);

    const handlePinChange = (index, value) => {
        if (value.length <= 1) {
            const newPin = [...pin];
            newPin[index] = value || '';
            setPin(newPin);

            // Move to next input if value is entered
            if (value && index < 5) {
                setCurrentIndex(index + 1);
            }
        }
    };
    return (
        <>
            <Box
                sx={{
                    display: 'flex',
                    height: '100vh',
                    width: '100%',
                    position: 'relative',
                    overflow: 'hidden',
                    backgroundImage: `url("/assets/bgimage1.png")`,
                    backgroundSize: 'contain',
                    backgroundPosition: 'center',
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        //   backgroundColor: "rgba(0, 0, 0, 0.3)",
                        //   backdropFilter: "blur(1px)",
                        //   zIndex: 1,
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
                                // maxWidth: 450,
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
                                    src={'/assets/Logo.png'}
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
                                    fontSize: '30px',
                                    color: '#063455',
                                    mb: 0.5,
                                }}
                            >
                                Set Up New Pin
                            </Typography>

                            <Typography
                                sx={{
                                    color: '#7F7F7F',
                                    fontSize: '16px',
                                    mb: 3,
                                    mt: 1,
                                }}
                            >
                                Enter the new pin to secure your account
                            </Typography>

                            {/* PIN Entry */}
                            <Box sx={{ mb: 2 }}>
                                <Typography
                                    sx={{
                                        color: '#121212',
                                        mb: 1,
                                        fontSize: '0.9rem',
                                    }}
                                >
                                    Enter New Pin
                                </Typography>
                                <Box
                                    sx={{
                                        display: 'flex',
                                        gap: 2,
                                        width: '100%',
                                        justifyContent: 'space-between',
                                    }}
                                >
                                    {pin.map((digit, index) => (
                                        <TextField
                                            key={index}
                                            variant="outlined"
                                            type={index === 0 ? 'text' : 'password'}
                                            value={digit}
                                            inputProps={{
                                                maxLength: 1,
                                                style: {
                                                    textAlign: 'center',
                                                    // padding: '12px 0x',
                                                    padding: '1rem',
                                                    fontSize: '1rem',
                                                },
                                            }}
                                            sx={{
                                                width: 60,
                                                height: 70,
                                                '.MuiOutlinedInput-notchedOutline': {
                                                    borderColor: '#121212',
                                                },
                                            }}
                                            InputProps={{
                                                readOnly: index === 0,
                                            }}
                                            autoFocus={index === currentIndex}
                                            onChange={(e) => handlePinChange(index, e.target.value)}
                                        />
                                    ))}
                                </Box>
                            </Box>

                            <Box sx={{ mb: 2 }}>
                                <Typography
                                    sx={{
                                        color: '#121212',
                                        mb: 1,
                                        fontSize: '0.9rem',
                                    }}
                                >
                                    Confirm New Pin
                                </Typography>
                                <Box
                                    sx={{
                                        display: 'flex',
                                        gap: 1.3,
                                        width: '100%',
                                        justifyContent: 'space-between',
                                    }}
                                >
                                    {pin.map((digit, index) => (
                                        <TextField
                                            key={index}
                                            variant="outlined"
                                            type={index === 0 ? 'text' : 'password'}
                                            value={digit}
                                            inputProps={{
                                                maxLength: 1,
                                                style: {
                                                    textAlign: 'center',
                                                    // padding: '12px 0x',
                                                    padding: '1rem',
                                                    fontSize: '1rem',
                                                },
                                            }}
                                            sx={{
                                                width: 60,
                                                height: 70,
                                                '.MuiOutlinedInput-notchedOutline': {
                                                    borderColor: '#121212',
                                                },
                                            }}
                                            InputProps={{
                                                readOnly: index === 0,
                                            }}
                                            autoFocus={index === currentIndex}
                                            onChange={(e) => handlePinChange(index, e.target.value)}
                                        />
                                    ))}
                                </Box>
                            </Box>

                            {/* Navigation Buttons */}
                            <Box
                                sx={{
                                    display: 'flex',
                                    width: '100%',
                                    justifyContent: 'space-between',
                                }}
                            >
                                <Button
                                    startIcon={<ArrowBackIcon />}
                                    sx={{
                                        color: '#121212',
                                        bgcolor: '#FFFFFF',
                                        width: '215px',
                                        height: '48px',
                                        textTransform: 'none',
                                        borderRadius: 0,
                                        border: '1px solid #D1D5DB',
                                        // px: 2,
                                        py: 1,
                                    }}
                                    onClick={() => router.visit('/forget-pin')}
                                >
                                    Change Email
                                </Button>

                                <Button
                                    variant="contained"
                                    endIcon={<ArrowForwardIcon />}
                                    sx={{
                                        bgcolor: '#063455',
                                        width: '215px',
                                        height: '46px',
                                        color: 'white',
                                        textTransform: 'none',
                                        borderRadius: 0,
                                        px: 4,
                                        py: 1,
                                        '&:hover': {
                                            bgcolor: '#083654',
                                        },
                                    }}
                                    onClick={() => router.visit('/success')}
                                >
                                    Verify
                                </Button>
                            </Box>
                        </Box>
                    </Paper>
                </Box>
            </Box>
        </>
    );
};
SetNewPin.layout = (page) => page;
export default SetNewPin;
