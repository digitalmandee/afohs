import { useState } from 'react';
import { Box, Typography, Button, TextField, IconButton, DialogContent } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { router, usePage } from '@inertiajs/react';
import { routeNameForContext } from '@/lib/utils';

const ReservationFilter = ({ onClose }) => {
    const { filters } = usePage().props;

    const [status, setStatus] = useState(filters.status || 'all');
    const [startDate, setStartDate] = useState(filters.start_date || '');
    const [endDate, setEndDate] = useState(filters.end_date || '');

    const applyFilters = () => {
        router.get(
            route(routeNameForContext('reservations.index')),
            {
                status: status !== 'all' ? status : '',
                start_date: startDate,
                end_date: endDate,
            },
            { preserveScroll: true, preserveState: true, replace: true },
        );
        if (onClose) onClose();
    };

    const resetFilters = () => {
        setStatus('all');
        setStartDate('');
        setEndDate('');
        router.get(route(routeNameForContext('reservations.index')), {}, { preserveScroll: true, preserveState: true, replace: true });
    };

    return (
        <Box sx={{ p: 2 }}>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" fontWeight="500" fontSize="24px" sx={{ color: '#121212' }}>
                    Filter Reservations
                </Typography>
                <Button onClick={onClose} size="small">
                    <CloseIcon />
                </Button>
            </Box>

            {/* Status Filter */}
            <DialogContent sx={{ p: 2 }}>
                <Box mb={2}>
                    <Typography>Status</Typography>
                    <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ width: '100%', padding: '8px' }}>
                        <option value="all">All</option>
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </Box>

                {/* Date Range */}
                <Box mb={2}>
                    <Typography>Start Date</Typography>
                    <TextField type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} fullWidth size="small" />
                </Box>
                <Box mb={2}>
                    <Typography>End Date</Typography>
                    <TextField type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} fullWidth size="small" />
                </Box>

                <Box display="flex" justifyContent="flex-end" gap={1}>
                    <Button variant="outlined" onClick={resetFilters} sx={{ borderColor: '#ccc', color: '#333', borderRadius: 1, textTransform: 'none', mr: 1 }}>
                        Reset
                    </Button>
                    <Button
                        variant="contained"
                        onClick={applyFilters}
                        sx={{
                            bgcolor: '#0a3d62',
                            color: 'white',
                            borderRadius: 1,
                            textTransform: 'none',
                            '&:hover': { bgcolor: '#0c2461' },
                        }}
                    >
                        Apply
                    </Button>
                </Box>
            </DialogContent>
        </Box>
    );
};

export default ReservationFilter;
