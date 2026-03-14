import { router, usePage } from '@inertiajs/react';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import LogoutIcon from '@mui/icons-material/Logout';
import { Box, Button, Paper, Table, TableBody, TableCell, TableContainer, TableRow, Typography } from '@mui/material';
import { isPosPath } from '@/lib/utils';

const LogoutScreen = ({ setProfileView }) => {
    const { url } = usePage();
    const isPos = isPosPath(url);

    const revenueDetails = [
        { method: 'Cash', amount: 'Rs 0' },
        { method: 'Bank Transfer', amount: 'Rs 0' },
        { method: 'QR Code', amount: 'Rs 0' },
    ];

    const handleLogout = () => {
        router.post(route(isPos ? 'pos.logout' : 'tenant.logout'));
    };

    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                bgcolor: '#ffffff',
                p: 2,
            }}
        >
            <Paper
                elevation={0}
                sx={{
                    width: '100%',
                    //   maxWidth: 400,
                    //   border: '1px solid #e0e0e0',
                    borderRadius: 2,
                    p: 3,
                    textAlign: 'center',
                }}
            >
                {/* Icon */}
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        mb: 2,
                    }}
                >
                    <Box
                        sx={{
                            position: 'relative',
                            width: 80,
                            height: 80,
                        }}
                    >
                        <Box
                            sx={{
                                position: 'absolute',
                                width: '100%',
                                height: '100%',
                                borderRadius: '50%',
                                bgcolor: 'rgba(244, 67, 54, 0.1)',
                            }}
                        />
                        <Box
                            sx={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                width: 50,
                                height: 50,
                                borderRadius: '50%',
                                bgcolor: '#f44336',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                            }}
                        >
                            <ErrorOutlineIcon sx={{ color: 'white', fontSize: 28 }} />
                        </Box>

                        {/* Small circles around the main icon */}
                        {[45, 135, 225, 315].map((angle, index) => (
                            <Box
                                key={index}
                                sx={{
                                    position: 'absolute',
                                    top: `calc(50% + ${40 * Math.sin((angle * Math.PI) / 180)}px)`,
                                    left: `calc(50% + ${40 * Math.cos((angle * Math.PI) / 180)}px)`,
                                    width: 6,
                                    height: 6,
                                    borderRadius: '50%',
                                    border: '1px solid #f44336',
                                }}
                            />
                        ))}

                        {/* Small plus signs */}
                        {[0, 90, 180, 270].map((angle, index) => (
                            <Box
                                key={`plus-${index}`}
                                sx={{
                                    position: 'absolute',
                                    top: `calc(50% + ${45 * Math.sin((angle * Math.PI) / 180)}px)`,
                                    left: `calc(50% + ${45 * Math.cos((angle * Math.PI) / 180)}px)`,
                                    color: '#f44336',
                                    fontSize: 10,
                                    transform: 'translate(-50%, -50%)',
                                }}
                            >
                                +
                            </Box>
                        ))}
                    </Box>
                </Box>

                {/* Title */}
                <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Logout?
                </Typography>

                {/* Description */}
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Ensure the total revenue from your shift's orders is accurate for reporting.
                </Typography>

                {/* Revenue Box */}
                <Box
                    sx={{
                        bgcolor: '#f9f9f9',
                        borderRadius: 1,
                        p: 2,
                        mb: 3,
                    }}
                >
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        Total Revenue
                    </Typography>

                    <Typography variant="h4" sx={{ color: '#0c3b5c', fontWeight: 'bold', mb: 2 }}>
                        Rs 0
                    </Typography>

                    <Box sx={{ textAlign: 'left' }}>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                            Revenue Detail :
                        </Typography>

                        <TableContainer component={Box}>
                            <Table size="small">
                                <TableBody>
                                    {revenueDetails.map((item) => (
                                        <TableRow
                                            key={item.method}
                                            sx={{
                                                '& td': {
                                                    border: 0,
                                                    py: 0.5,
                                                },
                                            }}
                                        >
                                            <TableCell sx={{ pl: 0 }}>
                                                <Typography variant="body2">{item.method}</Typography>
                                            </TableCell>
                                            <TableCell align="right" sx={{ pr: 0 }}>
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        fontWeight: 'medium',
                                                    }}
                                                >
                                                    {item.amount}
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                </Box>

                {/* Action Buttons */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Button
                        variant="text"
                        sx={{
                            color: '#666',
                            textTransform: 'none',
                            px: 3,
                        }}
                        onClick={() => setProfileView('profile')}
                    >
                        Cancel
                    </Button>

                    <Button
                        variant="contained"
                        endIcon={<LogoutIcon />}
                        sx={{
                            bgcolor: '#f44336',
                            '&:hover': {
                                bgcolor: '#d32f2f',
                            },
                            textTransform: 'none',
                            px: 3,
                        }}
                        onClick={handleLogout}
                        // onClick={() => router.visit("/")}
                    >
                        Yes, Logout
                    </Button>
                </Box>
            </Paper>
        </Box>
    );
};

export default LogoutScreen;
