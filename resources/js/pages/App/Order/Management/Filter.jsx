'use client';

import { useState } from 'react';
import { Box, Typography, IconButton, Chip, Button, DialogContent, DialogActions, Collapse } from '@mui/material';
import { Close as CloseIcon, ExpandMore as ExpandMoreIcon, ExpandLess as ExpandLessIcon } from '@mui/icons-material';
import { router, usePage } from '@inertiajs/react';
import { routeNameForContext } from '@/lib/utils';

const OrderFilter = ({ onClose }) => {
    const { filters } = usePage().props;

    const [roomType, setRoomType] = useState(filters.time || 'all');
    const [bookingStatus, setBookingStatus] = useState(filters.type || 'all');
    const [eventDate, setEventDate] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Expanded sections
    const [expanded, setExpanded] = useState({
        roomType: true,
        bookingStatus: true,
        eventDate: true,
        dateRange: true,
    });

    const handleResetFilter = () => {
        setRoomType('all');
        setBookingStatus('all');
        setEventDate('');
        setStartDate('');
        setEndDate('');

        // 🚀 Reload orders without filters
        router.get(route(routeNameForContext('order.management')), {}, { preserveState: true, replace: true });
        onClose();
    };

    const handleApplyFilters = () => {
        const filters = {
            time: roomType,
            type: bookingStatus,
            start_date: startDate || undefined,
            end_date: endDate || undefined,
        };

        // 🚀 Trigger Inertia request with filters
        router.get(route(routeNameForContext('order.management')), filters, {
            preserveScroll: true,
            preserveState: true,
            replace: true,
        });

        onClose();
    };

    const toggleSection = (section) => {
        setExpanded({
            ...expanded,
            [section]: !expanded[section],
        });
    };

    // 🚀 Handlers for filters
    const handleRoomTypeChange = (value) => {
        setRoomType(value);
    };

    const handleBookingStatusChange = (value) => {
        setBookingStatus(value);
    };

    return (
        <>
            <Box
                sx={{
                    px: 2,
                    py: 1,
                    height: '416px',
                    maxWidth: '600px',
                    overflowY: 'auto',
                    scrollbarWidth: 'none',
                    '&::-webkit-scrollbar': {
                        display: 'none',
                    },
                }}
            >
                {/* Header */}
                <Box sx={{ px: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography
                        variant="h6"
                        fontWeight="500"
                        fontSize="32px"
                        sx={{
                            color: '#121212',
                        }}
                    >
                        Order Filter
                    </Typography>
                    <IconButton onClick={onClose} size="small">
                        <CloseIcon />
                    </IconButton>
                </Box>

                <DialogContent sx={{ p: 2 }}>
                    {/* Find By Time */}
                    <Box sx={{ mb: 3, px: 2, py: 2, border: '1px solid #E3E3E3' }}>
                        <Box
                            sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                mb: expanded.roomType ? 1.5 : 0,
                                cursor: 'pointer',
                            }}
                            onClick={() => toggleSection('roomType')}
                        >
                            <Typography variant="body1" fontWeight="medium">
                                Find By Time
                            </Typography>
                            {expanded.roomType ? <ExpandMoreIcon fontSize="small" sx={{ color: '#999' }} /> : <ExpandLessIcon fontSize="small" sx={{ color: '#999' }} />}
                        </Box>
                        <Collapse in={expanded.roomType}>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                <Chip
                                    label="All"
                                    onClick={() => handleRoomTypeChange('all')}
                                    sx={{
                                        bgcolor: roomType === 'all' ? '#0a3d62' : '#e3f2fd',
                                        color: roomType === 'all' ? 'white' : '#333',
                                        borderRadius: 1,
                                        fontWeight: roomType === 'all' ? 500 : 400,
                                        '&:hover': {
                                            bgcolor: roomType === 'all' ? '#0a3d62' : '#d0e8fd',
                                        },
                                    }}
                                />
                                <Chip
                                    label="Today"
                                    onClick={() => handleRoomTypeChange('today')}
                                    sx={{
                                        bgcolor: roomType === 'today' ? '#0a3d62' : '#e3f2fd',
                                        color: roomType === 'today' ? 'white' : '#333',
                                        borderRadius: 1,
                                        fontWeight: roomType === 'today' ? 500 : 400,
                                        '&:hover': {
                                            bgcolor: roomType === 'today' ? '#0a3d62' : '#d0e8fd',
                                        },
                                    }}
                                />
                                <Chip
                                    label="Yesterday"
                                    onClick={() => handleRoomTypeChange('yesterday')}
                                    sx={{
                                        bgcolor: roomType === 'yesterday' ? '#0a3d62' : '#e3f2fd',
                                        color: roomType === 'yesterday' ? 'white' : '#333',
                                        borderRadius: 1,
                                        fontWeight: roomType === 'yesterday' ? 500 : 400,
                                        '&:hover': {
                                            bgcolor: roomType === 'yesterday' ? '#0a3d62' : '#d0e8fd',
                                        },
                                    }}
                                />
                                <Chip
                                    label="This Week"
                                    onClick={() => handleRoomTypeChange('this_week')}
                                    sx={{
                                        bgcolor: roomType === 'this_week' ? '#0a3d62' : '#e3f2fd',
                                        color: roomType === 'this_week' ? 'white' : '#333',
                                        borderRadius: 1,
                                        fontWeight: roomType === 'this_week' ? 500 : 400,
                                        '&:hover': {
                                            bgcolor: roomType === 'this_week' ? '#0a3d62' : '#d0e8fd',
                                        },
                                    }}
                                />
                            </Box>
                        </Collapse>
                    </Box>

                    {/* Order Type */}
                    <Box sx={{ mb: 3, px: 2, py: 2, border: '1px solid #E3E3E3' }}>
                        <Box
                            sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                mb: expanded.bookingStatus ? 1.5 : 0,
                                cursor: 'pointer',
                            }}
                            onClick={() => toggleSection('bookingStatus')}
                        >
                            <Typography variant="body1" fontWeight="medium">
                                Order Type
                            </Typography>
                            {expanded.bookingStatus ? <ExpandMoreIcon fontSize="small" sx={{ color: '#999' }} /> : <ExpandLessIcon fontSize="small" sx={{ color: '#999' }} />}
                        </Box>
                        <Collapse in={expanded.bookingStatus}>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                <Chip
                                    label="All"
                                    onClick={() => handleBookingStatusChange('all')}
                                    sx={{
                                        bgcolor: bookingStatus === 'all' ? '#0a3d62' : '#e3f2fd',
                                        color: bookingStatus === 'all' ? 'white' : '#333',
                                        borderRadius: 1,
                                        fontWeight: bookingStatus === 'all' ? 500 : 400,
                                        '&:hover': {
                                            bgcolor: bookingStatus === 'all' ? '#0a3d62' : '#d0e8fd',
                                        },
                                    }}
                                />
                                <Chip
                                    label="Dine"
                                    onClick={() => handleBookingStatusChange('dineIn')}
                                    sx={{
                                        bgcolor: bookingStatus === 'dineIn' ? '#0a3d62' : '#e3f2fd',
                                        color: bookingStatus === 'dineIn' ? 'white' : '#333',
                                        borderRadius: 1,
                                        fontWeight: bookingStatus === 'dineIn' ? 500 : 400,
                                        '&:hover': {
                                            bgcolor: bookingStatus === 'dineIn' ? '#0a3d62' : '#d0e8fd',
                                        },
                                    }}
                                />
                                <Chip
                                    label="Delivery"
                                    onClick={() => handleBookingStatusChange('delivery')}
                                    sx={{
                                        bgcolor: bookingStatus === 'delivery' ? '#0a3d62' : '#e3f2fd',
                                        color: bookingStatus === 'delivery' ? 'white' : '#333',
                                        borderRadius: 1,
                                        fontWeight: bookingStatus === 'delivery' ? 500 : 400,
                                        '&:hover': {
                                            bgcolor: bookingStatus === 'delivery' ? '#0a3d62' : '#d0e8fd',
                                        },
                                    }}
                                />
                                <Chip
                                    label="Takeaway"
                                    onClick={() => handleBookingStatusChange('takeaway')}
                                    sx={{
                                        bgcolor: bookingStatus === 'takeaway' ? '#0a3d62' : '#e3f2fd',
                                        color: bookingStatus === 'takeaway' ? 'white' : '#333',
                                        borderRadius: 1,
                                        fontWeight: bookingStatus === 'takeaway' ? 500 : 400,
                                        '&:hover': {
                                            bgcolor: bookingStatus === 'takeaway' ? '#0a3d62' : '#d0e8fd',
                                        },
                                    }}
                                />
                                <Chip
                                    label="Reservation"
                                    onClick={() => handleBookingStatusChange('reservation')}
                                    sx={{
                                        bgcolor: bookingStatus === 'reservation' ? '#0a3d62' : '#e3f2fd',
                                        color: bookingStatus === 'reservation' ? 'white' : '#333',
                                        borderRadius: 1,
                                        fontWeight: bookingStatus === 'reservation' ? 500 : 400,
                                        '&:hover': {
                                            bgcolor: bookingStatus === 'reservation' ? '#0a3d62' : '#d0e8fd',
                                        },
                                    }}
                                />
                                <Chip
                                    label="Rooms Orders"
                                    onClick={() => handleBookingStatusChange('room_service')}
                                    sx={{
                                        bgcolor: bookingStatus === 'room_service' ? '#0a3d62' : '#e3f2fd',
                                        color: bookingStatus === 'room_service' ? 'white' : '#333',
                                        borderRadius: 1,
                                        fontWeight: bookingStatus === 'room_service' ? 500 : 400,
                                        '&:hover': {
                                            bgcolor: bookingStatus === 'room_service' ? '#0a3d62' : '#d0e8fd',
                                        },
                                    }}
                                />
                            </Box>
                        </Collapse>
                    </Box>
                </DialogContent>

                {/* Footer buttons */}
                <DialogActions sx={{ p: 2, justifyContent: 'flex-end' }}>
                    <Button
                        variant="outlined"
                        onClick={handleResetFilter}
                        sx={{
                            borderColor: '#ccc',
                            color: '#333',
                            borderRadius: 1,
                            textTransform: 'none',
                            mr: 1,
                            '&:hover': {
                                borderColor: '#999',
                                bgcolor: 'rgba(0,0,0,0.04)',
                            },
                        }}
                    >
                        Reset Filter
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleApplyFilters}
                        sx={{
                            bgcolor: '#0a3d62',
                            color: 'white',
                            borderRadius: 1,
                            textTransform: 'none',
                            '&:hover': {
                                bgcolor: '#0c2461',
                            },
                        }}
                    >
                        Apply Filters
                    </Button>
                </DialogActions>
            </Box>
        </>
    );
};
OrderFilter.layout = (page) => page;
export default OrderFilter;
