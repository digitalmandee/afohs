import { router } from '@inertiajs/react';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Box, Button, Chip, IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import axios from 'axios';
import { useEffect, useState } from 'react';
import StartShiftModal from '@/components/Pos/StartShiftModal';
import EndShiftModal from '@/components/Pos/EndShiftModal';
import dayjs from 'dayjs';
import { routeNameForContext } from '@/lib/utils';

const ShiftActivityScreen = ({ setProfileView }) => {
    const [shifts, setShifts] = useState([]);
    const [openStartModal, setOpenStartModal] = useState(false);
    const [openEndModal, setOpenEndModal] = useState(false);
    const [activeShift, setActiveShift] = useState(null);
    const [loading, setLoading] = useState(false);

    const fetchShifts = async () => {
        try {
            const response = await axios.get(route(routeNameForContext('pos-shifts.history')));
            setShifts(response.data);

            // Check for active shift in history (or fetch status ref)
            // Assuming the latest shift might be active
            const active = response.data.find((s) => s.status === 'active');
            setActiveShift(active || null);
        } catch (error) {
            console.error('Failed to fetch shifts:', error);
        }
    };

    useEffect(() => {
        fetchShifts();
    }, []);

    const handleShiftSuccess = () => {
        setOpenStartModal(false);
        fetchShifts();
    };

    const handleEndShiftSuccess = () => {
        setOpenEndModal(false);
        fetchShifts();
    };

    return (
        <Box
            sx={{
                bgcolor: '#e6f2f5',
                minHeight: '100vh',
                pt: 1,
            }}
        >
            <Paper
                elevation={0}
                sx={{
                    width: '100%',
                    mx: 'auto',
                    bgcolor: 'transparent',
                    boxShadow: 'none',
                }}
            >
                {/* Header */}
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        p: 2,
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <IconButton size="small" sx={{ mr: 1, color: '#333' }} onClick={() => setProfileView('profile')}>
                            <ArrowBackIcon fontSize="small" />
                        </IconButton>
                        <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
                            Shift Activity
                        </Typography>
                    </Box>

                    {/* Action Button */}
                    <Box>
                        {activeShift ? (
                            <Button variant="contained" color="error" size="small" onClick={() => setOpenEndModal(true)} sx={{ textTransform: 'none' }}>
                                End Shift
                            </Button>
                        ) : (
                            <Button variant="contained" color="primary" size="small" onClick={() => setOpenStartModal(true)} sx={{ textTransform: 'none', bgcolor: '#063455' }}>
                                Start Shift
                            </Button>
                        )}
                    </Box>
                </Box>

                {/* Shifts Table */}
                <TableContainer component={Box} sx={{ p: 2 }}>
                    <Table sx={{ minWidth: '100%' }}>
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#0c4a6e' }}>
                                <TableCell sx={{ color: 'white', fontWeight: 'medium', py: 1.5 }}>Date</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 'medium', py: 1.5 }}>Start Time</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 'medium', py: 1.5 }}>End Time</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 'medium', py: 1.5 }}>Status</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {shifts.map((shift, index) => {
                                const showDivider = index < shifts.length - 1;

                                // Formatting dates
                                const start = new Date(shift.start_time || shift.created_at);
                                const end = shift.end_time ? new Date(shift.end_time) : null;

                                return (
                                    <TableRow
                                        key={shift.id}
                                        sx={{
                                            bgcolor: 'transparent',
                                            '&:last-child td, &:last-child th': { border: 0 },
                                        }}
                                    >
                                        <TableCell sx={{ py: 1.5, borderBottom: showDivider ? '1px solid #ccd7dd' : 'none', color: '#333' }}>{dayjs(shift.start_date).format('DD/MM/YYYY')}</TableCell>
                                        <TableCell sx={{ py: 1.5, borderBottom: showDivider ? '1px solid #ccd7dd' : 'none', color: '#333' }}>{start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</TableCell>
                                        <TableCell sx={{ py: 1.5, borderBottom: showDivider ? '1px solid #ccd7dd' : 'none', color: '#333' }}>{end ? end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</TableCell>
                                        <TableCell sx={{ py: 1.5, borderBottom: showDivider ? '1px solid #ccd7dd' : 'none' }}>
                                            <Chip label={shift.status} size="small" color={shift.status === 'active' ? 'success' : 'default'} variant={shift.status === 'active' ? 'filled' : 'outlined'} />
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            {shifts.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} align="center" sx={{ py: 3, color: '#666' }}>
                                        No shift history found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            <StartShiftModal open={openStartModal} onSuccess={handleShiftSuccess} />
            <EndShiftModal open={openEndModal} onClose={() => setOpenEndModal(false)} onSuccess={handleEndShiftSuccess} />
        </Box>
    );
};

export default ShiftActivityScreen;
