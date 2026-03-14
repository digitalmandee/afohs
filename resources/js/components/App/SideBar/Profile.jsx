import { usePage } from '@inertiajs/react';
import { ChevronRight, Edit, History as HistoryIcon, Logout as LogoutIcon } from '@mui/icons-material';
import { Box, Button, IconButton, Paper, Typography } from '@mui/material';

const EmployeeProfileScreen = ({ setProfileView, onClose }) => {
    const { auth } = usePage().props;
    const user = auth?.user || {};
    const employee = user?.employee || null;
    const employeeId = employee?.employee_id || user?.employee_id || 'N/A';
    const phoneNo = employee?.phone_no || user?.phone_no || user?.phone || 'N/A';
    const address = employee?.address || user?.address || 'N/A';
    return (
        <Paper
            elevation={1}
            sx={{
                width: '100%',
                // height:'100vh',
                // maxWidth: 360,
                borderRadius: 1,
                overflow: 'hidden',
            }}
        >
            {/* Header Image */}
            <Box sx={{ position: 'relative' }}>
                <Box
                    component="img"
                    src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxzZWFyY2h8M3x8Y2FzaGllcnxlbnwwfHwwfHw%3D&auto=format&fit=crop&w=500&q=60"
                    alt="Cashier working"
                    sx={{
                        width: '100%',
                        height: 280,
                        objectFit: 'cover',
                    }}
                />
            </Box>
            <Box
                sx={{
                    bgcolor: '#0e3151',
                    px: 2,
                    color: 'white',
                    height: '116px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {user?.name}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.8, display: 'block', textAlign: 'right' }}>
                    {auth?.role}
                </Typography>
            </Box>

            {/* Profile Details */}
            <Box sx={{ p: 3, bgcolor: '#e6f2f5' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                        Profile Details
                    </Typography>
                    <IconButton size="small">
                        <Edit fontSize="small" />
                    </IconButton>
                </Box>

                <Box sx={{ mb: 1.5 }}>
                    <Typography variant="caption" sx={{ color: '#6b7280', display: 'block' }}>
                        Employee ID
                    </Typography>
                    <Typography variant="body2">{employeeId}</Typography>
                </Box>

                <Box sx={{ mb: 1.5 }}>
                    <Typography variant="caption" sx={{ color: '#6b7280', display: 'block' }}>
                        Email
                    </Typography>
                    <Typography variant="body2">{user?.email || 'N/A'}</Typography>
                </Box>

                <Box sx={{ mb: 1.5 }}>
                    <Typography variant="caption" sx={{ color: '#6b7280', display: 'block' }}>
                        Phone number
                    </Typography>
                    <Typography variant="body2">{phoneNo}</Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" sx={{ color: '#6b7280', display: 'block' }}>
                        Address
                    </Typography>
                    <Typography variant="body2">{address}</Typography>
                </Box>
            </Box>

            {/* Action Buttons */}
            <Box sx={{ px: 2, pb: 2, bgcolor: '#e6f2f5' }}>
                <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<HistoryIcon />}
                    endIcon={<ChevronRight />}
                    sx={{
                        justifyContent: 'space-between',
                        textTransform: 'none',
                        color: '#4b5563',
                        borderColor: '#0f0f0f',
                        mb: 2,
                        py: 1.5,
                    }}
                    onClick={() => setProfileView('loginActivity')}
                >
                    Login Activity
                </Button>

                <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<HistoryIcon />}
                    endIcon={<ChevronRight />}
                    sx={{
                        justifyContent: 'space-between',
                        textTransform: 'none',
                        color: '#4b5563',
                        borderColor: '#0f0f0f',
                        mb: 2,
                        py: 1.5,
                    }}
                    onClick={() => setProfileView('shiftActivity')}
                >
                    Shift Activity
                </Button>

                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        variant="outlined"
                        sx={{
                            flex: 1,
                            textTransform: 'none',
                            color: '#4b5563',
                            borderColor: '#0f0f0f',
                            py: 1,
                        }}
                        onClick={onClose}
                    >
                        Close
                    </Button>
                    <Button
                        variant="contained"
                        endIcon={<LogoutIcon />}
                        sx={{
                            flex: 1,
                            textTransform: 'none',
                            bgcolor: '#ef4444',
                            color: 'white',
                            py: 1,
                            '&:hover': {
                                bgcolor: '#dc2626',
                            },
                        }}
                        onClick={() => setProfileView('logoutSuccess')}
                    >
                        Logout
                    </Button>
                </Box>
            </Box>
        </Paper>
    );
};

export default EmployeeProfileScreen;
