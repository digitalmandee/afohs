'use client';
import { router } from '@inertiajs/react';
import { ArrowBack as ArrowBackIcon, ArrowForward as ArrowForwardIcon } from '@mui/icons-material';
import { Box, Button, Link, TextField, Typography } from '@mui/material';
import { enqueueSnackbar } from 'notistack';
import { useEffect, useRef, useState } from 'react';

const EmployeeSignIn = ({ setActiveTab, data, setData, post, processing, errors, transform, routes }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    // Create refs for input fields
    const inputRefs = useRef([]);

    // Initialize refs array
    useEffect(() => {
        inputRefs.current = inputRefs.current.slice(0, 6);
    }, []);

    // Focus the input when currentIndex changes
    useEffect(() => {
        if (inputRefs.current[currentIndex]) {
            inputRefs.current[currentIndex].focus();
        }
    }, [currentIndex]);

    const handlePinChange = (index, value) => {
        if (value.length <= 1) {
            const newPin = [...data.password];
            newPin[index] = value || '';
            setData((prevData) => ({ ...prevData, password: newPin }));

            if (value && index < 5) {
                // Move to next input and focus
                setCurrentIndex(index + 1);
                inputRefs.current[index + 1]?.focus();
            }
        }
    };

    const handleSignIn = () => {
        transform((data) => ({
            ...data,
            password: data.password.join(''),
        }));

        post(route(routes.login), {
            onError: (errors) => {
                // Show specific backend error if available
                const message = errors.employee_id || errors.password || 'Login failed. Please check your credentials and try again.';
                enqueueSnackbar(message, { variant: 'error' });
            },
        });
    };

    return (
        <>
            <Box
                component="form"
                onSubmit={(e) => {
                    e.preventDefault();
                    handleSignIn();
                }}
            >
                {/* Logo */}
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'flex-start',
                        mb: 1,
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
                <Box
                    sx={{
                        p: 2,
                    }}
                >
                    <Typography
                        variant="h5"
                        sx={{
                            fontWeight: 500,
                            color: '#063455',
                            fontSize: '30px',
                            mb: 3,
                        }}
                    >
                        Employee Sign In
                    </Typography>

                    {/* PIN Entry */}
                    <Box sx={{ mb: 3 }}>
                        <Typography
                            sx={{
                                color: '#121212',
                                mb: 1,
                                fontSize: '14px',
                            }}
                        >
                            Enter PIN
                        </Typography>
                        <Box
                            sx={{
                                display: 'flex',
                                gap: 2,
                                width: '100%',
                                justifyContent: 'space-between',
                            }}
                        >
                            {data.password &&
                                data.password.map((digit, index) => (
                                    <TextField
                                        key={index}
                                        variant="outlined"
                                        type={'password'}
                                        value={digit}
                                        inputProps={{
                                            maxLength: 1,
                                            style: {
                                                textAlign: 'center',
                                                // bgcolor:'black',
                                                padding: '1rem',
                                                fontSize: '1rem',
                                                // width:'200%'
                                            },
                                        }}
                                        sx={{
                                            width: '100%',
                                            height: 70,
                                            '.MuiOutlinedInput-notchedOutline': {
                                                borderColor: '#063455',
                                            },
                                        }}
                                        // Store ref to the input element
                                        inputRef={(el) => (inputRefs.current[index] = el)}
                                        onChange={(e) => handlePinChange(index, e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Backspace') {
                                                if (digit) {
                                                    // Just clear the value
                                                    const newPin = [...data.password];
                                                    newPin[index] = '';
                                                    setData((prevData) => ({ ...prevData, password: newPin }));
                                                } else if (index > 0) {
                                                    // Move to previous input and focus
                                                    setCurrentIndex(index - 1);
                                                    inputRefs.current[index - 1]?.focus();
                                                }
                                            }
                                        }}
                                    />
                                ))}
                        </Box>
                        {errors.password && (
                            <Typography variant="body2" sx={{ color: 'red', mt: 1 }}>
                                {errors.password}
                            </Typography>
                        )}
                        <Link
                            href="#"
                            underline="hover"
                            sx={{
                                color: '#129BFF',
                                fontSize: '0.875rem',
                                mt: 1.5,
                                display: 'inline-block',
                            }}
                            onClick={() => router.visit('/forget-pin')}
                        >
                            Forgot Pin?
                        </Link>
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
                                bgcolor: '#FFFFFF',
                                color: '#121212',
                                border: '1px solid #E3E3E3',
                                '&:hover': {
                                    bgcolor: 'rgba(0,0,0,0.04)',
                                },
                            }}
                            onClick={() => setActiveTab('signin')}
                        >
                            Back
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            endIcon={<ArrowForwardIcon />}
                            sx={{
                                borderRadius: '0',
                                width: '215px',
                                height: '46px',
                                color: '#FFFFFF',
                                bgcolor: '#063455',
                                '&:hover': {
                                    bgcolor: '#083654',
                                },
                                px: 3,
                            }}
                            disabled={processing}
                            loading={processing}
                            loadingPosition="start"
                            onClick={handleSignIn}
                        >
                            Sign In
                        </Button>
                    </Box>
                </Box>
            </Box>
        </>
    );
};

export default EmployeeSignIn;
