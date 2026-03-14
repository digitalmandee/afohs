'use client';
import { useState } from 'react';
import { Box, Typography, IconButton, Chip, TextField, Button, Dialog, DialogContent, DialogActions, InputAdornment, Collapse } from '@mui/material';
import { Close as CloseIcon, ExpandMore as ExpandMoreIcon, ExpandLess as ExpandLessIcon, CalendarToday as CalendarIcon } from '@mui/icons-material';

const BookingFilter = () => {
    const [open, setOpen] = useState(true);
    const [roomType, setRoomType] = useState('deluxe');
    const [bookingStatus, setBookingStatus] = useState('all');
    const [eventDate, setEventDate] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // State to track which sections are expanded
    const [expanded, setExpanded] = useState({
        roomType: true,
        bookingStatus: true,
        eventDate: true,
        dateRange: true,
    });

    const handleClose = () => {
        setOpen(false);
    };

    const handleRoomTypeChange = (type) => {
        setRoomType(type);
    };

    const handleBookingStatusChange = (status) => {
        setBookingStatus(status);
    };

    const handleResetFilter = () => {
        setRoomType('deluxe');
        setBookingStatus('all');
        setEventDate('');
        setStartDate('');
        setEndDate('');
    };

    const handleApplyFilters = () => {
        // Apply filters logic here
        console.log({
            roomType,
            bookingStatus,
            eventDate,
            dateRange: { startDate, endDate },
        });
        handleClose();
    };

    // Toggle section expansion
    const toggleSection = (section) => {
        setExpanded({
            ...expanded,
            [section]: !expanded[section],
        });
    };

    return (
        <>
            <Box
                sx={{
                    px: 2,
                    py: 1,
                }}
            >
                <Box sx={{ px: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography
                        variant="h6"
                        fontWeight="500"
                        fontSize="32px"
                        sx={{
                            color: '#121212',
                        }}
                    >
                        Booking Filter
                    </Typography>
                    <IconButton onClick={handleClose} size="small">
                        <CloseIcon />
                    </IconButton>
                </Box>

                <DialogContent sx={{ p: 2 }}>
                    {/* Room Type */}
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
                                Room Type
                            </Typography>
                            {expanded.roomType ? <ExpandMoreIcon fontSize="small" sx={{ color: '#999' }} /> : <ExpandLessIcon fontSize="small" sx={{ color: '#999' }} />}
                        </Box>
                        <Collapse in={expanded.roomType}>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                <Chip
                                    label="Deluxe room"
                                    onClick={() => handleRoomTypeChange('deluxe')}
                                    sx={{
                                        bgcolor: roomType === 'deluxe' ? '#0a3d62' : '#e3f2fd',
                                        color: roomType === 'deluxe' ? 'white' : '#333',
                                        borderRadius: 1,
                                        fontWeight: roomType === 'deluxe' ? 500 : 400,
                                        '&:hover': {
                                            bgcolor: roomType === 'deluxe' ? '#0a3d62' : '#d0e8fd',
                                        },
                                    }}
                                />
                                <Chip
                                    label="Standard room"
                                    onClick={() => handleRoomTypeChange('standard')}
                                    sx={{
                                        bgcolor: roomType === 'standard' ? '#0a3d62' : '#e3f2fd',
                                        color: roomType === 'standard' ? 'white' : '#333',
                                        borderRadius: 1,
                                        fontWeight: roomType === 'standard' ? 500 : 400,
                                        '&:hover': {
                                            bgcolor: roomType === 'standard' ? '#0a3d62' : '#d0e8fd',
                                        },
                                    }}
                                />
                                <Chip
                                    label="Suit room"
                                    onClick={() => handleRoomTypeChange('suit')}
                                    sx={{
                                        bgcolor: roomType === 'suit' ? '#0a3d62' : '#e3f2fd',
                                        color: roomType === 'suit' ? 'white' : '#333',
                                        borderRadius: 1,
                                        fontWeight: roomType === 'suit' ? 500 : 400,
                                        '&:hover': {
                                            bgcolor: roomType === 'suit' ? '#0a3d62' : '#d0e8fd',
                                        },
                                    }}
                                />
                                <Chip
                                    label="Family room"
                                    onClick={() => handleRoomTypeChange('family')}
                                    sx={{
                                        bgcolor: roomType === 'family' ? '#0a3d62' : '#e3f2fd',
                                        color: roomType === 'family' ? 'white' : '#333',
                                        borderRadius: 1,
                                        fontWeight: roomType === 'family' ? 500 : 400,
                                        '&:hover': {
                                            bgcolor: roomType === 'family' ? '#0a3d62' : '#d0e8fd',
                                        },
                                    }}
                                />
                            </Box>
                        </Collapse>
                    </Box>

                    {/* Booking Status */}
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
                                Booking Status
                            </Typography>
                            {expanded.bookingStatus ? <ExpandMoreIcon fontSize="small" sx={{ color: '#999' }} /> : <ExpandLessIcon fontSize="small" sx={{ color: '#999' }} />}
                        </Box>
                        <Collapse in={expanded.bookingStatus}>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                <Chip
                                    label="All type"
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
                                    label="Confirmed"
                                    onClick={() => handleBookingStatusChange('confirmed')}
                                    sx={{
                                        bgcolor: bookingStatus === 'confirmed' ? '#0a3d62' : '#e3f2fd',
                                        color: bookingStatus === 'confirmed' ? 'white' : '#333',
                                        borderRadius: 1,
                                        fontWeight: bookingStatus === 'confirmed' ? 500 : 400,
                                        '&:hover': {
                                            bgcolor: bookingStatus === 'confirmed' ? '#0a3d62' : '#d0e8fd',
                                        },
                                    }}
                                />
                                <Chip
                                    label="Pending"
                                    onClick={() => handleBookingStatusChange('pending')}
                                    sx={{
                                        bgcolor: bookingStatus === 'pending' ? '#0a3d62' : '#e3f2fd',
                                        color: bookingStatus === 'pending' ? 'white' : '#333',
                                        borderRadius: 1,
                                        fontWeight: bookingStatus === 'pending' ? 500 : 400,
                                        '&:hover': {
                                            bgcolor: bookingStatus === 'pending' ? '#0a3d62' : '#d0e8fd',
                                        },
                                    }}
                                />
                            </Box>
                        </Collapse>
                    </Box>

                    {/* Event by date */}
                    <Box sx={{ mb: 3, px: 2, py: 2, border: '1px solid #E3E3E3' }}>
                        <Box
                            sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                mb: expanded.eventDate ? 1.5 : 0,
                                cursor: 'pointer',
                            }}
                            onClick={() => toggleSection('eventDate')}
                        >
                            <Typography variant="body1" fontWeight="medium">
                                Event by date
                            </Typography>
                            {expanded.eventDate ? <ExpandMoreIcon fontSize="small" sx={{ color: '#999' }} /> : <ExpandLessIcon fontSize="small" sx={{ color: '#999' }} />}
                        </Box>
                        <Collapse in={expanded.eventDate}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                <Typography variant="body2" color="text.secondary">
                                    Date
                                </Typography>
                                <TextField
                                    placeholder="Select date"
                                    value={eventDate}
                                    onChange={(e) => setEventDate(e.target.value)}
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <CalendarIcon fontSize="small" sx={{ color: '#999' }} />
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{
                                        '.MuiOutlinedInput-root': {
                                            borderRadius: 1,
                                        },
                                    }}
                                />
                            </Box>
                        </Collapse>
                    </Box>

                    {/* Date Range */}
                    <Box sx={{ px: 2, py: 2, border: '1px solid #E3E3E3' }}>
                        <Box
                            sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                mb: expanded.dateRange ? 1.5 : 0,
                                cursor: 'pointer',
                            }}
                            onClick={() => toggleSection('dateRange')}
                        >
                            <Typography variant="body1" fontWeight="medium">
                                Date Range
                            </Typography>
                            {expanded.dateRange ? <ExpandMoreIcon fontSize="small" sx={{ color: '#999' }} /> : <ExpandLessIcon fontSize="small" sx={{ color: '#999' }} />}
                        </Box>

                        <Collapse in={expanded.dateRange}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {/* Start Date */}
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Typography variant="body2" color="text.secondary" sx={{ width: 80 }}>
                                        Start date
                                    </Typography>
                                    <TextField
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        fullWidth
                                        size="small"
                                        sx={{ maxWidth: 300 }}
                                        InputLabelProps={{
                                            shrink: true,
                                        }}
                                    />
                                </Box>

                                {/* End Date */}
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Typography variant="body2" color="text.secondary" sx={{ width: 80 }}>
                                        End date
                                    </Typography>
                                    <TextField
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        fullWidth
                                        size="small"
                                        sx={{ maxWidth: 300 }}
                                        InputLabelProps={{
                                            shrink: true,
                                        }}
                                    />
                                </Box>
                            </Box>
                        </Collapse>
                    </Box>
                </DialogContent>

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

export default BookingFilter;
