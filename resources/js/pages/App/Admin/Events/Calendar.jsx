import React, { useEffect, useRef, useState } from 'react';
import { DayPilot, DayPilotScheduler } from 'daypilot-pro-react';
import axios from 'axios';
import moment from 'moment';
import { FormControl, InputLabel, MenuItem, Select, Box, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Typography, Autocomplete } from '@mui/material';
import { Modal } from 'react-bootstrap';
import { ArrowBack } from '@mui/icons-material';
import { router } from '@inertiajs/react';
import EventBookingInvoiceModal from '@/components/App/Events/EventBookingInvoiceModal';
import EventCompletionModal from '@/components/App/Events/EventCompletionModal';
import { enqueueSnackbar } from 'notistack';

const EventCalendar = () => {
    const schedulerRef = useRef();
    // const [open, setOpen] = useState(true);
    const [month, setMonth] = useState(moment().format('MM'));
    const [year, setYear] = useState(moment().format('YYYY'));
    const [resources, setResources] = useState([]);
    const [events, setEvents] = useState([]);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
    const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
    const [selectedBookingId, setSelectedBookingId] = useState(null);
    const [completionModalOpen, setCompletionModalOpen] = useState(false);
    const [completionBookingId, setCompletionBookingId] = useState(null);
    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const [cancelBookingId, setCancelBookingId] = useState(null);
    const [cancelReason, setCancelReason] = useState('');

    const fetchData = async () => {
        try {
            const start = moment(`${year}-${month}-01`, 'YYYY-MM-DD').isSame(moment(), 'month') ? moment().startOf('day') : moment(`${year}-${month}-01`, 'YYYY-MM-DD');
            const end = start.clone().add(30, 'days');

            const { data } = await axios.get(route('api.events.calendar'), {
                params: { from: start.format('YYYY-MM-DD'), to: end.format('YYYY-MM-DD') },
            });

            // Transform venues into resources
            const venueResources = data.venues.map((venue) => ({
                id: venue.id,
                name: venue.name,
                expanded: true,
            }));

            // Transform bookings into events
            const bookingEvents = data.bookings.map((booking) => {
                // Determine booking type and display info
                const isCustomerBooking = booking.customer && !booking.member;
                const isMemberBooking = booking.member && !booking.customer;
                const isCorporateBooking = booking.corporate_member || booking.corporateMember;

                let displayText = booking.booked_by || 'N/A';
                let bookingTypeInfo = '';
                let contactInfo = booking.mobile || 'N/A';

                if (isCustomerBooking) {
                    bookingTypeInfo = `Customer: ${booking.customer.name}`;
                } else if (isMemberBooking) {
                    bookingTypeInfo = `Member: ${booking.member.full_name} (${booking.membership_no})`;
                } else if (isCorporateBooking) {
                    const corp = booking.corporate_member || booking.corporateMember;
                    bookingTypeInfo = `Corporate: ${corp.full_name} (${corp.membership_no})`;
                } else {
                    bookingTypeInfo = 'General Booking';
                }

                const startMoment = moment(`${booking.event_date} ${booking.event_time_from}`, 'YYYY-MM-DD HH:mm');
                let endMoment = moment(`${booking.event_date} ${booking.event_time_to}`, 'YYYY-MM-DD HH:mm');

                if (!endMoment.isValid() || endMoment.isSameOrBefore(startMoment)) {
                    endMoment = startMoment.clone().add(15, 'minutes');
                }

                if (!endMoment.isSame(startMoment, 'day')) {
                    endMoment = startMoment.clone().endOf('day');
                }

                const startDateTime = startMoment.format('YYYY-MM-DDTHH:mm:ss');
                const endDateTime = endMoment.format('YYYY-MM-DDTHH:mm:ss');

                return {
                    id: booking.id,
                    booking: booking,
                    text: displayText,
                    start: startDateTime,
                    end: endDateTime,
                    resource: booking.event_venue_id,
                    backColor: getStatusColor(booking.status),
                    borderColor: getStatusBorderColor(booking.status),
                    fontColor: '#fff',
                    bubbleHtml: `
                        <div style="padding: 10px; font-family: Arial, sans-serif; line-height: 1.4;">
                            <strong style="color: #333;">Booked By: ${displayText}</strong><br/>
                            <span style="color: #666;">${bookingTypeInfo}</span><br/>
                            <span style="color: #666;">Contact: ${contactInfo}</span><br/>
                            <span style="color: #666;">Guests: ${booking.no_of_guests || 0}</span><br/>
                            <span style="color: #666;">Status: <span style="color: ${getStatusColor(booking.status)}; font-weight: bold;">${booking.status?.charAt(0).toUpperCase() + booking.status?.slice(1)}</span></span><br/>
                            ${booking.nature_of_event ? `<span style="color: #666;">Event: ${booking.nature_of_event}</span><br/>` : ''}

                            <div style="margin: 8px 0; padding: 6px; background: #f0f8ff; border-radius: 4px;">
                                <a href="#" onclick="window.updateEventBooking('${booking.id}'); return false;"
                                   style="display: inline-block; background: #007bff; color: white; padding: 4px 8px; text-decoration: none; border-radius: 3px; font-size: 11px; margin-right: 4px;">Update booking</a>
                                ${
                                    booking.status === 'confirmed'
                                        ? `
                                <a href="#" onclick="window.completeEventBooking('${booking.id}'); return false;"
                                   style="display: inline-block; background: #28a745; color: white; padding: 4px 8px; text-decoration: none; border-radius: 3px; font-size: 11px;">Complete Booking</a>
                                `
                                        : ''
                                }
                            </div>

                            <div style="margin-top: 8px; padding: 6px; background: #e3f2fd; border-radius: 4px;">
                                <strong style="color: #1976d2; font-style: italic; font-size: 12px;">Timings</strong><br/>
                                <span style="font-size: 11px;">From: ${booking.event_time_from}</span><br/>
                                <span style="font-size: 11px;">To: ${booking.event_time_to}</span>
                            </div>
                        </div>
                    `,
                };
            });

            setResources(venueResources);
            setEvents(bookingEvents);
        } catch (error) {
            enqueueSnackbar('Error fetching event calendar data. Please try again.', { variant: 'error' });
            console.error('Error fetching event calendar data:', error);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'confirmed':
                return '#28a745'; // Green
            case 'completed':
                return '#17a2b8'; // Blue
            case 'cancelled':
                return '#dc3545'; // Red
            case 'pending':
                return '#ffc107'; // Yellow
            default:
                return '#6c757d'; // Gray
        }
    };

    const getStatusBorderColor = (status) => {
        switch (status) {
            case 'confirmed':
                return '#1e7e34';
            case 'completed':
                return '#117a8b';
            case 'cancelled':
                return '#bd2130';
            case 'pending':
                return '#e0a800';
            default:
                return '#545b62';
        }
    };

    useEffect(() => {
        fetchData();
    }, [month, year]);

    // Update calendar when events or resources change
    useEffect(() => {
        if (schedulerRef.current && events.length > 0) {
            schedulerRef.current.control.update({
                resources: resources,
                events: events,
            });
        }
    }, [events, resources]);

    // Set up global functions for tooltip buttons
    useEffect(() => {
        window.updateEventBooking = (bookingId) => {
            router.visit(route('events.booking.edit', bookingId));
        };

        window.completeEventBooking = (bookingId) => {
            setCompletionBookingId(bookingId);
            setCompletionModalOpen(true);
        };

        window.openEventInvoice = (bookingId) => {
            setSelectedBookingId(bookingId);
            setInvoiceModalOpen(true);
        };

        // Cleanup function
        return () => {
            delete window.updateEventBooking;
            delete window.completeEventBooking;
            delete window.openEventInvoice;
        };
    }, []);

    const calendarStart = moment(`${year}-${month}-01`, 'YYYY-MM-DD').isSame(moment(), 'month') ? moment().startOf('day') : moment(`${year}-${month}-01`, 'YYYY-MM-DD');
    const startDate = calendarStart.format('YYYY-MM-DD');
    const days = 30;

    const config = {
        locale: 'en-us',
        timeHeaders: [{ groupBy: 'Month' }, { groupBy: 'Day', format: 'd' }],
        scale: 'Day',
        days: days,
        startDate: startDate,
        cellWidth: 50,
        cellHeight: 40,
        eventHeight: 35,
        headerHeight: 30,
        rowHeaderWidth: 150,
        resources: resources,
        events: events,
        eventMoveHandling: 'Disabled',
        eventResizeHandling: 'Disabled',
        eventDeleteHandling: 'Disabled',
        eventClickHandling: 'Enabled',
        onEventClick: (args) => {
            setSelectedBookingId(args.e.data.booking.id);
            setInvoiceModalOpen(true);
        },
        onTimeRangeSelected: (args) => {
            // Handle new booking creation
            const selectedVenue = resources.find((r) => r.id === args.resource);
            if (selectedVenue) {
                // Navigate to create booking with pre-filled data
                router.visit(route('events.booking.create'), {
                    data: {
                        venue: args.resource,
                        date: moment(args.start).format('YYYY-MM-DD'),
                        time_from: moment(args.start).format('HH:mm'),
                        time_to: moment(args.end).format('HH:mm'),
                    },
                });
            }
        },
        contextMenu: new DayPilot.Menu({
            items: [
                {
                    text: 'View Details',
                    onClick: (args) => {
                        setSelectedBookingId(args.source.data.booking.id);
                        setInvoiceModalOpen(true);
                    },
                },
                {
                    text: 'Edit Booking',
                    onClick: (args) => {
                        router.visit(route('events.booking.edit', args.source.data.booking.id));
                    },
                },
                { text: '-' },
                {
                    text: 'Complete Booking',
                    onClick: (args) => {
                        setCompletionBookingId(args.source.data.booking.id);
                        setCompletionModalOpen(true);
                    },
                    visible: (args) => args.source.data.booking.status === 'confirmed',
                },
                {
                    text: 'Cancel Booking',
                    onClick: (args) => {
                        setCancelBookingId(args.source.data.booking.id);
                        setCancelModalOpen(true);
                    },
                },
            ],
        }),
    };

    const handleMonthChange = (event) => {
        setMonth(event.target.value);
    };

    const handleYearChange = (event) => {
        setYear(event.target.value);
    };

    const toggleDrawer = () => {
        setOpen(!open);
    };

    const handleBookingDialogClose = () => {
        setBookingDialogOpen(false);
        setSelectedBooking(null);
    };

    const handleInvoiceModalClose = () => {
        setInvoiceModalOpen(false);
        setSelectedBookingId(null);
    };

    const handleBookingUpdate = () => {
        fetchData(); // Refresh calendar data
    };

    const handleCompletionModalClose = () => {
        setCompletionModalOpen(false);
        setCompletionBookingId(null);
    };

    const handleCompletionSuccess = () => {
        fetchData(); // Refresh calendar data
        handleCompletionModalClose();
    };

    const handleCancelModalClose = () => {
        setCancelModalOpen(false);
        setCancelBookingId(null);
        setCancelReason('');
    };

    const handleCancelBooking = async () => {
        if (!cancelReason.trim()) {
            alert('Please provide a cancellation reason.');
            return;
        }

        try {
            await axios.put(route('events.booking.update.status', cancelBookingId), {
                status: 'cancelled',
                cancellation_reason: cancelReason,
            });

            fetchData(); // Refresh calendar
            handleCancelModalClose();
        } catch (error) {
            console.error('Error cancelling booking:', error);
            enqueueSnackbar('Error cancelling booking. Please try again.', { variant: 'error' });
            // alert('Error cancelling booking. Please try again.');
        }
    };
    const monthNames = moment.months().map((monthName, index) => ({
        value: String(index + 1).padStart(2, '0'),
        label: monthName,
    }));

    const yearOptions = Array.from({ length: 10 }, (_, i) => {
        const yearNum = moment().year() - 5 + i;
        return {
            value: String(yearNum),
            label: yearNum,
        };
    });

    return (
        <>
            {/* <SideNav open={open} toggleDrawer={toggleDrawer} /> */}
            <div
                style={{
                    minHeight: '100vh',
                    backgroundColor: '#f5f5f5',
                }}
            >
                <Box sx={{ p: 2 }}>
                    {/* Header */}
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {/* <IconButton onClick={() => router.visit(route('events.dashboard'))} sx={{ color: '#063455' }}>
                            <ArrowBack />
                        </IconButton> */}
                        <Typography style={{ fontWeight: '700', fontSize: '30px', color: '#063455' }}>Event Calender</Typography>
                    </Box>
                    <Typography style={{ color: '#063455', fontSize: '15px', fontWeight: '600' }}>Helps avoid clashes and manage venue availability efficiently</Typography>

                    {/* Month and Year Selectors */}
                    <Box sx={{ display: 'flex', gap: 2, mb: 3, mt: 3 }}>
                        {/* <FormControl sx={{ minWidth: 150 }}>
                            <InputLabel>Select Month</InputLabel>
                            <Select value={month} onChange={handleMonthChange} label="Select Month">
                                {moment.months().map((monthName, index) => (
                                    <MenuItem key={index} value={String(index + 1).padStart(2, '0')}>
                                        {monthName}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl> */}
                        <Autocomplete
                            value={monthNames.find((m) => m.value === month) || null}
                            onChange={(e, newValue) => handleMonthChange({ target: { value: newValue?.value || '' } })}
                            options={monthNames}
                            getOptionLabel={(option) => option.label}
                            isOptionEqualToValue={(option, value) => option.value === value?.value}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Select Month"
                                    size="small"
                                    sx={{
                                        minWidth: 200,
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: '16px',
                                        },
                                    }}
                                />
                            )}
                        />

                        {/* <FormControl sx={{ minWidth: 150 }}>
                            <InputLabel>Select Year</InputLabel>
                            <Select value={year} onChange={handleYearChange} label="Select Year">
                                {Array.from({ length: 10 }, (_, i) => moment().year() - 5 + i).map((yearOption) => (
                                    <MenuItem key={yearOption} value={String(yearOption)}>
                                        {yearOption}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl> */}
                        <Autocomplete
                            value={yearOptions.find((y) => y.value === year) || null}
                            onChange={(e, newValue) => handleYearChange({ target: { value: newValue?.value || '' } })}
                            options={yearOptions}
                            getOptionLabel={(option) => option.label}
                            isOptionEqualToValue={(option, value) => option.value === value?.value}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Select Year"
                                    size="small"
                                    sx={{
                                        minWidth: 150,
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: '16px',
                                        },
                                    }}
                                />
                            )}
                        />
                    </Box>

                    {/* Legend */}
                    <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                        {/* <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ width: 16, height: 16, backgroundColor: '#ffc107', borderRadius: 1 }}></Box>
                            <span style={{ fontSize: '12px' }}>Pending</span>
                        </Box> */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ width: 16, height: 16, backgroundColor: '#28a745', borderRadius: 1 }}></Box>
                            <span style={{ fontSize: '12px' }}>Confirmed</span>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ width: 16, height: 16, backgroundColor: '#17a2b8', borderRadius: 1 }}></Box>
                            <span style={{ fontSize: '12px' }}>Completed</span>
                        </Box>
                        {/* <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ width: 16, height: 16, backgroundColor: '#dc3545', borderRadius: 1 }}></Box>
                            <span style={{ fontSize: '12px' }}>Cancelled</span>
                        </Box> */}
                    </Box>

                    {/* Calendar */}
                    <Box
                        sx={{
                            border: '1px solid #ddd',
                            borderRadius: 1,
                            overflow: 'hidden',
                            backgroundColor: '#fff',
                        }}
                    >
                        <DayPilotScheduler {...config} ref={schedulerRef} />
                    </Box>

                    {/* Booking Details Dialog */}
                    <Dialog open={bookingDialogOpen} onClose={handleBookingDialogClose} maxWidth="md" fullWidth>
                        <DialogTitle>Event Booking Details</DialogTitle>
                        <DialogContent>
                            {selectedBooking && (
                                <Box sx={{ pt: 1 }}>
                                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                                        <Box>
                                            <strong>Booking Number:</strong> {selectedBooking.booking_no}
                                        </Box>
                                        <Box>
                                            <strong>Status:</strong>
                                            <span
                                                style={{
                                                    color: getStatusColor(selectedBooking.status),
                                                    fontWeight: 'bold',
                                                    marginLeft: '8px',
                                                }}
                                            >
                                                {selectedBooking.status?.toUpperCase()}
                                            </span>
                                        </Box>
                                        <Box>
                                            <strong>Nature of Event:</strong> {selectedBooking.nature_of_event}
                                        </Box>
                                        <Box>
                                            <strong>Booked By:</strong> {selectedBooking.booked_by}
                                        </Box>
                                        <Box>
                                            <strong>Guest Name:</strong> {selectedBooking.name || 'N/A'}
                                        </Box>
                                        <Box>
                                            <strong>Number of Guests:</strong> {selectedBooking.no_of_guests}
                                        </Box>
                                        <Box>
                                            <strong>Event Date:</strong> {moment(selectedBooking.event_date).format('MMMM D, YYYY')}
                                        </Box>
                                        <Box>
                                            <strong>Event Time:</strong> {selectedBooking.event_time_from} - {selectedBooking.event_time_to}
                                        </Box>
                                        <Box>
                                            <strong>Venue:</strong> {selectedBooking.event_venue?.name || 'N/A'}
                                        </Box>
                                        <Box>
                                            <strong>Total Amount:</strong> Rs {selectedBooking.total_price}
                                        </Box>
                                    </Box>
                                    {selectedBooking.additional_notes && (
                                        <Box sx={{ mt: 2 }}>
                                            <strong>Additional Notes:</strong>
                                            <Box sx={{ mt: 1, p: 1, backgroundColor: '#f5f5f5', borderRadius: 1 }}>{selectedBooking.additional_notes}</Box>
                                        </Box>
                                    )}
                                </Box>
                            )}
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={handleBookingDialogClose}>Close</Button>
                            {selectedBooking && (
                                <>
                                    <Button onClick={() => router.visit(route('events.booking.edit', selectedBooking.id))} variant="outlined">
                                        Edit Booking
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            setSelectedBookingId(selectedBooking.id);
                                            setInvoiceModalOpen(true);
                                        }}
                                        variant="contained"
                                        sx={{ backgroundColor: '#063455' }}
                                    >
                                        View Invoice
                                    </Button>
                                </>
                            )}
                        </DialogActions>
                    </Dialog>

                    {/* Event Booking Invoice Modal */}
                    <EventBookingInvoiceModal open={invoiceModalOpen} onClose={handleInvoiceModalClose} bookingId={selectedBookingId} setBookings={handleBookingUpdate} />

                    {/* Event Completion Modal */}
                    <EventCompletionModal open={completionModalOpen} onClose={handleCompletionModalClose} bookingId={completionBookingId} onSuccess={handleCompletionSuccess} />

                    {/* Cancel Event Booking Modal */}
                    <Modal show={cancelModalOpen} onHide={handleCancelModalClose} centered>
                        <Modal.Header closeButton>
                            <Modal.Title>Cancel Event Booking</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <p>Please provide a reason for cancelling this booking:</p>
                            <TextField label="Cancellation Reason" multiline rows={3} value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} fullWidth required sx={{ mt: 2 }} />
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="outlined" onClick={handleCancelModalClose}>
                                Close
                            </Button>
                            <Button variant="contained" onClick={handleCancelBooking} sx={{ backgroundColor: '#dc3545', '&:hover': { backgroundColor: '#bd2130' } }}>
                                Cancel Booking
                            </Button>
                        </Modal.Footer>
                    </Modal>
                </Box>
            </div>
        </>
    );
};

export default EventCalendar;
