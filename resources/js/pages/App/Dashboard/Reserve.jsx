import { AccessTime, Close, KeyboardArrowDown, KeyboardArrowLeft, KeyboardArrowRight } from '@mui/icons-material';
import { Box, Button, Chip, CircularProgress, Grid, IconButton, Paper, Typography, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import CancelIcon from '@mui/icons-material/Cancel';
import { router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { enqueueSnackbar } from 'notistack';
import axios from 'axios';
import { routeNameForContext } from '@/lib/utils';

const ReservationOrder = ({ selectedDate, onClose, weekDays, onDateChange }) => {
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentDate, setCurrentDate] = useState(selectedDate || new Date());
    const [currentMonth, setCurrentMonth] = useState(selectedDate || new Date());
    const [monthDays, setMonthDays] = useState([]);
    const scrollContainerRef = useState(null);

    // Cancel reservation state
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [selectedReservation, setSelectedReservation] = useState(null);
    const [cancelReason, setCancelReason] = useState('');

    // Format time helper
    const formatTime = (time) => {
        if (!time) return '';
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    };

    // Generate all days for current month
    const generateWeekDays = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();

        const days = [];

        // Generate all days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const currentDay = new Date(year, month, day);
            const dateString = currentDay.toISOString().split('T')[0];

            // Try to get count from weekDays prop if available
            let count = 0;
            if (weekDays && weekDays.length > 0) {
                const matchingDay = weekDays.find(wd => wd.date === dateString);
                count = matchingDay?.orders_count || 0;
            }

            days.push({
                label: currentDay.toLocaleDateString('en-US', { weekday: 'short' }),
                date: dateString,
                dayNum: day,
                orders_count: count,
            });
        }

        setMonthDays(days);
    };

    // Scroll functions
    const scrollLeft = () => {
        if (scrollContainerRef[0]) {
            scrollContainerRef[0].scrollBy({ left: -200, behavior: 'smooth' });
        }
    };

    const scrollRight = () => {
        if (scrollContainerRef[0]) {
            scrollContainerRef[0].scrollBy({ left: 200, behavior: 'smooth' });
        }
    };

    // Navigate to previous month
    const handlePrevMonth = () => {
        const newMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
        setCurrentMonth(newMonth);
        // Don't auto-change selected date, keep current selection if in same month
        generateWeekDays(newMonth);
    };

    // Navigate to next month
    const handleNextMonth = () => {
        const newMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
        setCurrentMonth(newMonth);
        // Don't auto-change selected date, keep current selection if in same month
        generateWeekDays(newMonth);
    };

    // Fetch reservations for selected date
    const fetchReservations = (date) => {
        setLoading(true);
        const dateString = date.toISOString().split('T')[0];
        axios
            .get(route(routeNameForContext('order.reservations'), { date: dateString }))
            .then((res) => setReservations(res.data.orders || []))
            .catch((err) => console.error(err))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchReservations(currentDate);
    }, [currentDate]);

    useEffect(() => {
        generateWeekDays(currentMonth);
    }, [currentMonth]);

    // Handle date change from calendar
    const handleDateClick = (dateString) => {
        if (!dateString) return;
        const newDate = new Date(dateString); // Ensure proper date parsing
        setCurrentDate(newDate);
        if (onDateChange) {
            onDateChange(newDate);
        }
    };

    // Handle cancel reservation
    const handleCancelClick = (reservation) => {
        setSelectedReservation(reservation);
        setCancelReason('');
        setShowCancelModal(true);
    };

    const confirmCancelReservation = () => {
        if (!selectedReservation) return;
        if (!cancelReason.trim()) {
            enqueueSnackbar('Please provide a cancellation reason.', { variant: 'error' });
            return;
        }

        router.post(
            route(routeNameForContext('reservations.cancel'), selectedReservation.id),
            { cancellation_reason: cancelReason },
            {
                onSuccess: () => {
                    setShowCancelModal(false);
                    setSelectedReservation(null);
                    setCancelReason('');
                    enqueueSnackbar('Reservation cancelled successfully', { variant: 'success' });
                    // Refresh reservations
                    fetchReservations(currentDate);
                },
                onError: () => {
                    setShowCancelModal(false);
                    setSelectedReservation(null);
                    setCancelReason('');
                    enqueueSnackbar('Failed to cancel reservation', { variant: 'error' });
                },
            },
        );
    };

    // Print receipt
    const handlePrintReceipt = (reservation) => {
        const printWindow = window.open('', '_blank');
        const content = `
            <html>
                <head>
                    <title>Reservation Receipt</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 20px; max-width: 300px; margin: auto; }
                        h5 { margin: 5px 0; }
                        p { margin: 5px 0; font-size: 12px; }
                        hr { margin: 10px 0; }
                        .center { text-align: center; }
                    </style>
                </head>
                <body>
                    <div class="center">
                        <h5>AFOHS CLUB</h5>
                        <p>Enjoy the Pride</p>
                        <p>PAF Falcon Complex</p>
                    </div>
                    <h6 class="center">RESERVATION RECEIPT</h6>
                    <p>Reservation #: ${reservation.id}</p>
                    <p>Date: ${reservation.date}</p>
                    <p>Time: ${formatTime(reservation.start_time)} - ${formatTime(reservation.end_time)}</p>
                    <p>Table: ${reservation.table?.table_no || 'N/A'}</p>
                    <p>Name: ${reservation.member?.full_name || reservation.customer?.name}</p>
                    <p>Persons: ${reservation.person_count}</p>
                    <hr />
                    <h6>Down Payment: Rs ${reservation.down_payment || '0'}</h6>
                    <p class="center">Thank you for your reservation!</p>
                </body>
            </html>
        `;
        printWindow.document.write(content);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 300);
    };

    return (
        <Paper sx={{ mx: 'auto', height: '100%', p: 2 }}>
            {/* Header */}
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    p: 2,
                    borderBottom: '1px solid #e0e0e0',
                }}
            >
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Reservation Order
                </Typography>
                <IconButton onClick={onClose} size="small">
                    <Close />
                </IconButton>
            </Box>

            {/* Month Navigation */}
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    px: 2,
                    py: 1.5,
                    borderBottom: '1px solid #e0e0e0',
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <IconButton size="small" onClick={handlePrevMonth}>
                        <KeyboardArrowLeft fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={handleNextMonth}>
                        <KeyboardArrowRight fontSize="small" />
                    </IconButton>
                    <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                        {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </Typography>
                </Box>
            </Box>

            {/* Reservation Count Header */}
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    px: 2,
                    py: 1.5,
                    bgcolor: '#f5f5f5',
                    borderBottom: '1px solid #e0e0e0',
                }}
            >
                <Typography variant="subtitle2" sx={{ fontWeight: 500, color: '#121212' }}>
                    {new Date(currentDate).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
                </Typography>
                <Chip
                    label={`${reservations.length} Reservation${reservations.length !== 1 ? 's' : ''}`}
                    size="small"
                    sx={{
                        bgcolor: '#1976d2',
                        color: 'white',
                        fontWeight: 600,
                    }}
                />
            </Box>

            {/* Month Calendar Slider with Arrows */}
            <Box sx={{ position: 'relative', mb: 2 }}>
                {/* Left Arrow */}
                <IconButton
                    onClick={scrollLeft}
                    sx={{
                        position: 'absolute',
                        left: 0,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        zIndex: 10,
                        bgcolor: 'white',
                        boxShadow: 2,
                        '&:hover': { bgcolor: '#f5f5f5' },
                    }}
                    size="small"
                >
                    <KeyboardArrowLeft />
                </IconButton>

                {/* Scrollable Container */}
                <Box
                    ref={(el) => (scrollContainerRef[0] = el)}
                    sx={{
                        display: 'flex',
                        overflowX: 'auto',
                        scrollBehavior: 'smooth',
                        mx: 5,
                        '&::-webkit-scrollbar': {
                            height: 6,
                        },
                        '&::-webkit-scrollbar-track': {
                            bgcolor: '#f1f1f1',
                        },
                        '&::-webkit-scrollbar-thumb': {
                            bgcolor: '#888',
                            borderRadius: 3,
                        },
                        '&::-webkit-scrollbar-thumb:hover': {
                            bgcolor: '#555',
                        },
                    }}
                >
                {monthDays && monthDays.map((day, index) => {
                    const isSelected = currentDate.toDateString() === new Date(day.date).toDateString();
                    return (
                        <Box
                            key={index}
                            onClick={() => handleDateClick(day.date)}
                            sx={{
                                cursor: 'pointer',
                                textAlign: 'center',
                                p: 1.5,
                                minWidth: 80,
                                border: '1px solid #e0e0e0',
                                bgcolor: isSelected ? '#e6f0fa' : 'white',
                                position: 'relative',
                                flexShrink: 0,
                                '&:hover': {
                                    bgcolor: isSelected ? '#e6f0fa' : '#f5f5f5',
                                },
                            }}
                        >
                            <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 500, display: 'block', mb: 0.5 }}>
                                {day.label}
                            </Typography>

                            {/* Badge at top right */}
                            {day.orders_count > 0 && (
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        top: 2,
                                        right: 2,
                                        width: 18,
                                        height: 18,
                                        bgcolor: '#f44336',
                                        color: 'white',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '0.6rem',
                                        fontWeight: 'bold',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                                        border: '2px solid white',
                                    }}
                                >
                                    {day.orders_count}
                                </Box>
                            )}

                            <Typography variant="h6" sx={{ fontWeight: 500 }}>
                                {day.dayNum}
                            </Typography>
                        </Box>
                    );
                })}
                </Box>

                {/* Right Arrow */}
                <IconButton
                    onClick={scrollRight}
                    sx={{
                        position: 'absolute',
                        right: 0,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        zIndex: 10,
                        bgcolor: 'white',
                        boxShadow: 2,
                        '&:hover': { bgcolor: '#f5f5f5' },
                    }}
                    size="small"
                >
                    <KeyboardArrowRight />
                </IconButton>
            </Box>

            {/* Reservations List */}
            <Box sx={{ maxHeight: 500, overflow: 'auto' }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : reservations.length > 0 ? (
                    reservations.map((item, index) => (
                        <Box
                            key={index}
                            sx={{
                                bgcolor: '#FFFFFF',
                                borderRadius: 2,
                                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                overflow: 'hidden',
                                mb: 1.5,
                                mx: 1,
                                border: '1px solid #E0E0E0',
                            }}
                        >
                            <Box
                                sx={{
                                    p: 1.5,
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: 1.5,
                                }}
                            >
                                {/* Table badge */}
                                {item.table_id && (
                                    <Box
                                        sx={{
                                            bgcolor: '#0C67AA',
                                            color: 'white',
                                            borderRadius: '50%',
                                            minWidth: 36,
                                            height: 36,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontWeight: '600',
                                            fontSize: '0.813rem',
                                            flexShrink: 0,
                                        }}
                                    >
                                        {item.table?.table_no}
                                    </Box>
                                )}

                                {/* Icon */}
                                <Box
                                    sx={{
                                        mr: 2,
                                        bgcolor: '#E3E3E3',
                                        borderRadius: '50%',
                                        width: 40,
                                        height: 40,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                    }}
                                >
                                    <img
                                        src="/assets/sofa.png"
                                        alt=""
                                        style={{
                                            height: 22,
                                            width: 22,
                                        }}
                                    />
                                </Box>

                                {/* Info */}
                                <Box sx={{ flexGrow: 1 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Typography
                                                variant="subtitle1"
                                                sx={{
                                                    fontWeight: '500',
                                                    fontSize: '16px',
                                                    color: '#121212',
                                                    mr: 1,
                                                }}
                                            >
                                                {item.member ? `${item.member?.full_name} (${item.member?.membership_no})` : `${item.customer?.name}`}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Box component="span" sx={{ mr: 0.5, fontSize: '1rem' }}>
                                                🕙
                                            </Box>
                                            <Typography variant="caption">
                                                {formatTime(item.start_time)} - {formatTime(item.end_time)}
                                            </Typography>
                                        </Box>
                                    </Box>

                                    <Typography
                                        variant="caption"
                                        sx={{
                                            color: '#7F7F7F',
                                            fontSize: '12px',
                                        }}
                                    >
                                        {item.person_count} Person
                                    </Typography>

                                    {/* Action section */}
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            mt: 1,
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Chip
                                                label={`#${item.id}`}
                                                size="small"
                                                variant="outlined"
                                                sx={{
                                                    mr: 1,
                                                    color: '#121212',
                                                    bgcolor: '#E3E3E3',
                                                    borderRadius: 1,
                                                    height: 24,
                                                    fontSize: '0.75rem',
                                                    fontWeight: 'medium',
                                                }}
                                            />
                                            <Chip
                                                label={`DP: Rs ${item.down_payment || '0'}`}
                                                size="small"
                                                variant="outlined"
                                                sx={{
                                                    mr: 1,
                                                    bgcolor: '#E3E3E3',
                                                    color: '#121212',
                                                    borderRadius: 1,
                                                    height: 24,
                                                    fontSize: '0.75rem',
                                                }}
                                            />
                                            <Box sx={{ ml: 'auto', mr: 1 }}>
                                                <img
                                                    src="/assets/trash.png"
                                                    alt=""
                                                    onClick={() => handleCancelClick(item)}
                                                    style={{
                                                        height: 20,
                                                        width: 20,
                                                        cursor: item.status === 'cancelled' ? 'not-allowed' : 'pointer',
                                                        opacity: item.status === 'cancelled' ? 0.5 : 1,
                                                    }}
                                                />
                                            </Box>
                                        </Box>
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                onClick={() => handlePrintReceipt(item)}
                                                sx={{
                                                    borderColor: '#0e3151',
                                                    color: '#0e3151',
                                                    textTransform: 'none',
                                                    borderRadius: 0,
                                                    px: 1.5,
                                                    py: 0.5,
                                                    fontSize: '0.75rem',
                                                    minWidth: 'auto',
                                                    '&:hover': {
                                                        borderColor: '#0a2540',
                                                        bgcolor: '#f5f5f5',
                                                    },
                                                }}
                                            >
                                                Print
                                            </Button>
                                            <Button
                                                variant="contained"
                                                size="small"
                                                onClick={() => {
                                                    if (item.status === 'pending') {
                                                        router.visit(route(routeNameForContext('order.menu'), { reservation_id: item.id, order_type: 'reservation' }));
                                                    }
                                                }}
                                                startIcon={
                                                    <Box component="span" sx={{ fontSize: '0.875rem' }}>
                                                        ✓
                                                    </Box>
                                                }
                                                sx={{
                                                    bgcolor: '#0e3151',
                                                    color: 'white',
                                                    textTransform: 'none',
                                                    borderRadius: 0,
                                                    px: 2,
                                                    py: 0.5,
                                                    fontSize: '0.875rem',
                                                    '&:hover': {
                                                        bgcolor: '#0a2540',
                                                    },
                                                }}
                                            >
                                                {item.status === 'saved' ? 'Process Order' : item.status === 'cancelled' ? 'Cancelled' : item.status === 'completed' ? 'Completed' : item.status === 'in_progress' ? 'Cooking process' : 'Process Order'}
                                            </Button>
                                        </Box>
                                    </Box>
                                </Box>
                            </Box>
                        </Box>
                    ))
                ) : (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="body2" color="text.secondary">
                            No reservations found for this date.
                        </Typography>
                    </Box>
                )}
            </Box>

            {/* Cancel Confirmation Modal */}
            <Dialog open={showCancelModal} onClose={() => setShowCancelModal(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
                    Cancel Reservation
                    <IconButton onClick={() => setShowCancelModal(false)} size="small">
                        <Close />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ pt: 2 }}>
                    <Typography>
                        Are you sure you want to cancel reservation #{selectedReservation?.id}?
                    </Typography>
                    {selectedReservation && (
                        <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                            <Typography variant="body2" sx={{ mb: 0.5 }}>
                                <strong>Name:</strong> {selectedReservation.member?.full_name || selectedReservation.customer?.name}
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 0.5 }}>
                                <strong>Date:</strong> {selectedReservation.date}
                            </Typography>
                            <Typography variant="body2">
                                <strong>Time:</strong> {formatTime(selectedReservation.start_time)} - {formatTime(selectedReservation.end_time)}
                            </Typography>
                        </Box>
                    )}
                    <TextField
                        fullWidth
                        sx={{ mt: 2 }}
                        label="Cancellation Reason"
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        multiline
                        minRows={3}
                        required
                    />
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button variant="outlined" onClick={() => setShowCancelModal(false)}>
                        No, Keep It
                    </Button>
                    <Button variant="contained" color="error" onClick={confirmCancelReservation}>
                        Yes, Cancel Reservation
                    </Button>
                </DialogActions>
            </Dialog>
        </Paper>
    );
};
ReservationOrder.layout = (page) => page;
export default ReservationOrder;
