import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import BackspaceIcon from '@mui/icons-material/Backspace';
import { Box, Button, Link, TextField, Typography, useMediaQuery, useTheme } from '@mui/material';

const SignIn = ({ setActiveTab, post, errors, data, setData, processing, routes }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const handleNumberClick = (number) => {
        setData({ employee_id: data.employee_id + number });
    };

    const handleBackspace = () => {
        setData({ employee_id: data.employee_id.slice(0, -1) });
    };

    const handleSubmit = () => {
        post(route(routes.checkUserId), {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                setActiveTab('employee-signin');
            },
        });
    };

    return (
        <>
            <Box
                component="form"
                onSubmit={(e) => {
                    e.preventDefault();
                    handleSubmit();
                }}
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-start',
                    height: '100vh',
                    overflowY: 'auto',
                    pb: '100px',
                    '&::-webkit-scrollbar': {
                        display: 'none',
                    },
                }}
            >
                <Box
                    component="img"
                    src="/assets/Logo.png"
                    alt="AFOHS Club Logo"
                    sx={{
                        width: 150,
                        height: 114,
                        mb: 2,
                        ml: -1,
                    }}
                />
                <Typography
                    variant="h5"
                    component="h1"
                    sx={{
                        fontWeight: 500,
                        fontSize: '30px',
                        mb: 1,
                        color: '#063455',
                    }}
                >
                    Sign In
                </Typography>
                <Typography
                    variant="body2"
                    sx={{
                        color: '#7F7F7F',
                        textAlign: 'flex-start',
                        mb: 2,
                        fontSize: '16px',
                    }}
                >
                    Get started now, enter your company Id to access your account
                </Typography>

                <Box sx={{ mb: 3 }}>
                    <Typography
                        variant="subtitle2"
                        sx={{
                            mb: 1,
                            fontWeight: 500,
                            color: '#121212',
                            fontSize: '14px',
                        }}
                    >
                        Employee Id
                    </Typography>
                    <TextField
                        fullWidth
                        placeholder="Your employee id"
                        value={data.employee_id}
                        onChange={(e) => setData('employee_id', e.target.value)}
                        variant="outlined"
                        size="small"
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 1,
                            },
                        }}
                    />
                    {errors.employee_id && (
                        <Typography variant="body2" sx={{ color: 'red', mt: 1 }}>
                            {errors.employee_id}
                        </Typography>
                    )}
                </Box>

                <Button
                    variant="contained"
                    fullWidth
                    endIcon={<ArrowForwardIcon />}
                    sx={{
                        mb: 1,
                        py: 1.5,
                        backgroundColor: '#063455',
                        '&:hover': {
                            backgroundColor: '#0D3B66',
                        },
                        borderRadius: 1,
                        textTransform: 'none',
                    }}
                    onClick={() => handleSubmit()}
                    disabled={processing}
                    loading={processing}
                    loadingPosition="start"
                >
                    Next
                </Button>

                <Typography
                    variant="body2"
                    sx={{
                        textAlign: 'center',
                        mb: 2,
                        mt: 1,
                        color: '#7F7F7F',
                    }}
                >
                    Don't have account?{' '}
                    <Link href="#" underline="none" sx={{ color: '#063455', fontWeight: 500 }}>
                        Sign Up
                    </Link>
                </Typography>

                {/* Numeric keypad */}
                <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                    {/* Row 1: 1,2,3 */}
                    <Box sx={{ display: 'flex', width: '100%', mb: 1 }}>
                        {[1, 2, 3].map((number) => (
                            <Button
                                key={number}
                                variant="text"
                                onClick={() => handleNumberClick(number.toString())}
                                sx={{
                                    flex: 1,
                                    py: 2,
                                    mx: 0.5,
                                    borderRadius: 0,
                                    color: '#333',
                                    fontSize: '20px',
                                    fontWeight: 500,
                                    backgroundColor: '#f5f5f5',
                                    '&:hover': {
                                        backgroundColor: '#e0e0e0',
                                    },
                                    '&:first-of-type': {
                                        ml: 0,
                                    },
                                    '&:last-of-type': {
                                        mr: 0,
                                    },
                                }}
                            >
                                {number}
                            </Button>
                        ))}
                    </Box>

                    {/* Row 2: 4,5,6 */}
                    <Box sx={{ display: 'flex', width: '100%', mb: 1 }}>
                        {[4, 5, 6].map((number) => (
                            <Button
                                key={number}
                                variant="text"
                                onClick={() => handleNumberClick(number.toString())}
                                sx={{
                                    flex: 1,
                                    py: 2,
                                    mx: 0.5,
                                    borderRadius: 0,
                                    color: '#333',
                                    fontSize: '20px',
                                    fontWeight: 500,
                                    backgroundColor: '#f5f5f5',
                                    '&:hover': {
                                        backgroundColor: '#e0e0e0',
                                    },
                                    '&:first-of-type': {
                                        ml: 0,
                                    },
                                    '&:last-of-type': {
                                        mr: 0,
                                    },
                                }}
                            >
                                {number}
                            </Button>
                        ))}
                    </Box>

                    {/* Row 3: 7,8,9 */}
                    <Box sx={{ display: 'flex', width: '100%', mb: 1 }}>
                        {[7, 8, 9].map((number) => (
                            <Button
                                key={number}
                                variant="text"
                                onClick={() => handleNumberClick(number.toString())}
                                sx={{
                                    flex: 1,
                                    py: 2,
                                    mx: 0.5,
                                    borderRadius: 0,
                                    color: '#333',
                                    fontSize: '20px',
                                    fontWeight: 500,
                                    backgroundColor: '#f5f5f5',
                                    '&:hover': {
                                        backgroundColor: '#e0e0e0',
                                    },
                                    '&:first-of-type': {
                                        ml: 0,
                                    },
                                    '&:last-of-type': {
                                        mr: 0,
                                    },
                                }}
                            >
                                {number}
                            </Button>
                        ))}
                    </Box>

                    {/* Row 4: .,0,backspace */}
                    <Box sx={{ display: 'flex', width: '100%' }}>
                        <Button
                            variant="text"
                            onClick={() => handleNumberClick('.')}
                            sx={{
                                flex: 1,
                                py: 2,
                                mr: 0.5,
                                borderRadius: 0,
                                color: '#333',
                                fontSize: '20px',
                                fontWeight: 500,
                                backgroundColor: '#f5f5f5',
                                '&:hover': {
                                    backgroundColor: '#e0e0e0',
                                },
                            }}
                        >
                            .
                        </Button>
                        <Button
                            variant="text"
                            onClick={() => handleNumberClick('0')}
                            sx={{
                                flex: 1,
                                py: 2,
                                mx: 0.5,
                                borderRadius: 0,
                                color: '#333',
                                fontSize: '20px',
                                fontWeight: 500,
                                backgroundColor: '#f5f5f5',
                                '&:hover': {
                                    backgroundColor: '#e0e0e0',
                                },
                            }}
                        >
                            0
                        </Button>
                        <Button
                            variant="text"
                            onClick={handleBackspace}
                            sx={{
                                flex: 1,
                                py: 2,
                                ml: 0.5,
                                borderRadius: 0,
                                color: '#fff',
                                fontSize: '20px',
                                backgroundColor: '#ffcdd2',
                                '&:hover': {
                                    backgroundColor: '#ef9a9a',
                                },
                            }}
                        >
                            <BackspaceIcon />
                        </Button>
                    </Box>
                </Box>
            </Box>
        </>
    );
};

export default SignIn;
