import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Box, IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { routeNameForContext } from '@/lib/utils';

const LoginActivityScreen = ({ setProfileView }) => {
    const [loginActivities, setLoginActivities] = useState([]);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const response = await axios.get(route(routeNameForContext('api.employee-logs')));

                // Map API data if needed
                const activities = response.data.map((log) => {
                    // Server is in US timezone, convert to Pakistan timezone (UTC+5)
                    // Format: "2025-10-02 12:34:59"
                    const serverDateTime = new Date(log.logged_at);
                    
                    // Convert to Pakistan timezone (Asia/Karachi)
                    const pakistanTime = new Date(serverDateTime.toLocaleString("en-US", {timeZone: "Asia/Karachi"}));
                    
                    // Format date for Pakistan timezone
                    const formattedDate = pakistanTime.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short', 
                        day: '2-digit',
                        timeZone: 'Asia/Karachi'
                    });
                    
                    // Format time for Pakistan timezone
                    const formattedTime = pakistanTime.toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                        timeZone: 'Asia/Karachi'
                    });
                    
                    return {
                        date: formattedDate,
                        time: formattedTime,
                        activity: log.type === 'login' ? 'Login' : log.type === 'logout' ? 'Logout' : log.type.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
                    };
                });
                setLoginActivities(activities);
            } catch (error) {
                console.error('Failed to fetch logs:', error);
            }
        };

        fetchLogs();
    }, []);

    return (
        <Box
            sx={{
                bgcolor: '#e6f2f5',
                minHeight: '100vh',
                // p: 2,
                pt: 1,
            }}
        >
            <Paper
                elevation={0}
                sx={{
                    width: '100%',
                    // maxWidth: 500,
                    mx: 'auto',
                    bgcolor: 'transparent',
                    boxShadow: 'none',
                    // p:2
                }}
            >
                {/* Header */}
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        p: 2,
                    }}
                >
                    <IconButton
                        size="small"
                        sx={{
                            mr: 1,
                            color: '#333',
                        }}
                        onClick={() => setProfileView('profile')}
                    >
                        <ArrowBackIcon fontSize="small" />
                    </IconButton>
                    <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
                        Login Activity
                    </Typography>
                </Box>

                {/* Activity Table */}
                <TableContainer component={Box} sx={{ p: 2 }}>
                    <Table sx={{ minWidth: '100%' }}>
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#0c4a6e' }}>
                                <TableCell
                                    sx={{
                                        color: 'white',
                                        fontWeight: 'medium',
                                        py: 1.5,
                                        width: '33%',
                                    }}
                                >
                                    Date
                                </TableCell>
                                <TableCell
                                    sx={{
                                        color: 'white',
                                        fontWeight: 'medium',
                                        py: 1.5,
                                        width: '33%',
                                    }}
                                >
                                    Activity
                                </TableCell>
                                <TableCell
                                    sx={{
                                        color: 'white',
                                        fontWeight: 'medium',
                                        py: 1.5,
                                        width: '33%',
                                    }}
                                >
                                    Login Time
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loginActivities.map((activity, index) => {
                                const isLogout = activity.activity === 'Logout';
                                const showDivider = isLogout && index < loginActivities.length - 1;

                                return (
                                    <TableRow
                                        key={index}
                                        sx={{
                                            bgcolor: 'transparent',
                                            '&:last-child td, &:last-child th': { border: 0 },
                                        }}
                                    >
                                        <TableCell
                                            sx={{
                                                py: 1.5,
                                                borderBottom: showDivider ? '1px solid #ccd7dd' : 'none',
                                                color: '#333',
                                            }}
                                        >
                                            {activity.date}
                                        </TableCell>
                                        <TableCell
                                            sx={{
                                                py: 1.5,
                                                borderBottom: showDivider ? '1px solid #ccd7dd' : 'none',
                                                color: isLogout ? '#ef4444' : '#1976d2',
                                                fontWeight: 'medium',
                                            }}
                                        >
                                            {activity.activity}
                                        </TableCell>
                                        <TableCell
                                            sx={{
                                                py: 1.5,
                                                borderBottom: showDivider ? '1px solid #ccd7dd' : 'none',
                                                color: '#333',
                                            }}
                                        >
                                            {activity.time}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Box>
    );
};

export default LoginActivityScreen;
