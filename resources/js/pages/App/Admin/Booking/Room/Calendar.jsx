import React, { useEffect, useRef, useState } from 'react';
import { DayPilot, DayPilotScheduler } from 'daypilot-pro-react';
import axios from 'axios';
import moment from 'moment';
import { FormControl, InputLabel, MenuItem, Select, Box, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { router } from '@inertiajs/react';
import RoomCheckInModal from '@/components/App/Rooms/CheckInModal';
import BookingActionModal from '@/components/App/Rooms/BookingActionModal';

// const drawerWidthOpen = 240;
// const drawerWidthClosed = 110;

const RoomCalendar = () => {
    const schedulerRef = useRef();
    // const [open, setOpen] = useState(true);
    const [month, setMonth] = useState(''); // Default to 'Rolling 30 Days' view
    const [year, setYear] = useState(moment().format('YYYY'));
    const [resources, setResources] = useState([]);
    const [events, setEvents] = useState([]);
    const [checkInDialogOpen, setCheckInDialogOpen] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);

    // Action Modal State
    const [actionModalOpen, setActionModalOpen] = useState(false);
    const [selectedActionBooking, setSelectedActionBooking] = useState(null);

    // Determine View Mode
    const isDefaultView = month === '';

    // Calculate dynamic days
    // Default View: Start from Today, Show 30 days
    // Month View: Start from 1st of selected month, Show full month
    const startDate = isDefaultView ? moment() : moment(`${year}-${month}-01`);
    const totalDays = isDefaultView ? 30 : startDate.daysInMonth();

    // Update fetchData to use 'from' and 'to'
    const fetchData = async () => {
        try {
            const startStr = startDate.format('YYYY-MM-DD');
            const endStr = startDate.clone().add(totalDays, 'days').format('YYYY-MM-DD');

            const { data } = await axios.get(route('api.bookings.calendar'), {
                params: {
                    from: startStr,
                    to: endStr,
                },
            });

            setResources(data.rooms);
            const evs = data.bookings.map((b) => ({
                id: b.id,
                booking: b,
                resource: 'R' + b.room_number,
                start: b.check_in_date,
                end: moment(b.check_out_date).format('YYYY-MM-DD'), // Exclusive end date (stops at 00:00 of checkout day)
                text: `#${b.booking_no}: ${b.guest_name}`,
                backColor: statusBack(b.status),
                barColor: statusBar(b.status),
                fontColor: statusTextColor(b.status),
                bubbleHtml: `
                    <div style="padding: 10px; font-family: Arial, sans-serif; line-height: 1.4;">
                        <strong style="color: #333;">${b.guest_name}</strong><br/>
                        <span style="color: #666;">Status: <span style="color: ${getStatusColor(b.status)}; font-weight: bold;">${b.status?.charAt(0).toUpperCase() + b.status?.slice(1).replace('_', ' ')}</span></span><br/>

                        <div style="margin: 8px 0; padding: 6px; background: #f0f8ff; border-radius: 4px;">
                            ${
                                b.status === 'booked' || b.status === 'confirmed'
                                    ? `<a href="#" onclick="window.checkIn(${b.id}); return false;"
                                    style="display: inline-block; background: #007bff; color: white; padding: 4px 8px; text-decoration: none; border-radius: 3px; font-size: 11px; margin-right: 4px;">Check-in</a>`
                                    : ''
                            }
                            ${
                                b.status === 'checked_in'
                                    ? `<a href="/booking-management/rooms/booking/edit/${b.id}?type=checkout" target="_blank"
                                    style="display: inline-block; background: #28a745; color: white; padding: 4px 8px; text-decoration: none; border-radius: 3px; font-size: 11px; margin-right: 4px;">Check-out</a>`
                                    : ''
                            }
                            ${
                                b.status !== 'cancelled' && b.status !== 'checked_out' && b.status !== 'refunded'
                                    ? `
                            <a href="#" onclick="window.cancelBooking(${b.id}); return false;"
                                style="display: inline-block; background: #dc3545; color: white; padding: 4px 8px; text-decoration: none; border-radius: 3px; font-size: 11px;">Cancel</a>
                            `
                                    : ''
                            }
                        </div>

                        <div style="margin-top: 8px; padding: 6px; background: #e3f2fd; border-radius: 4px;">
                            <strong style="color: #1976d2; font-style: italic; font-size: 12px;">Booking Dates</strong><br/>
                            <span style="font-size: 11px;">Check-in: ${b.check_in_date}</span><br/>
                            <span style="font-size: 11px;">Check-out: ${b.check_out_date}</span>
                        </div>
                    </div>
                `,
            }));

            setEvents(evs);
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        fetchData();
    }, [month, year]);

    useEffect(() => {
        // Register global checkIn function
        window.checkIn = (bookingId) => {
            const booking = events.find((e) => e.id === bookingId)?.booking;
            if (booking) {
                setSelectedBooking(booking);
                setCheckInDialogOpen(true);
            }
        };

        window.cancelBooking = (bookingId) => {
            const booking = events.find((e) => e.id === bookingId)?.booking;
            if (booking) {
                setSelectedActionBooking(booking);
                setActionModalOpen(true);
            }
        };

        return () => {
            delete window.checkIn;
            delete window.cancelBooking;
        };
    }, [events]);

    const statusBack = (s) => ({ booked: 'purple', checked_in: 'yellow', checked_out: '#5bc0de', confirmed: 'green', refund: 'green', cancelled: 'red' })[s] || 'gray';

    const statusBar = (s) => ({ booked: 'white', checked_in: 'black', checked_out: 'white', confirmed: 'white', refund: 'white', cancelled: 'white' })[s] || 'black';

    const statusTextColor = (s) => ({ booked: 'white', checked_in: 'black', checked_out: 'white', confirmed: 'white', refund: 'white', cancelled: 'white' })[s] || 'black';

    const getStatusColor = (status) => {
        const colors = {
            booked: '#6f42c1', // Purple (Waiting for Check-in)
            confirmed: '#28a745', // Green (Advance Paid)
            checked_in: '#ffc107', // Yellow
            checked_out: '#5bc0de', // Light Blue (Info)
            cancelled: '#dc3545',
            refund: '#17a2b8',
        };
        return colors[status] || '#6c757d';
    };

    const dpConfig = {
        startDate: startDate.format('YYYY-MM-DD'),
        days: totalDays,
        scale: 'Day',
        cellWidth: 120, // Wider cells for better visibility
        treeEnabled: true,
        treePreventParentUsage: true,
        timeHeaders: [
            { groupBy: 'Month', format: 'MMMM yyyy' },
            { groupBy: 'Day', format: 'd' },
        ],
        resources: resources.map((r) => ({
            id: 'R' + r.room_number,
            name: `Room no: ${r.room_number}`,
            expanded: true,
        })),
        events,
        eventHoverHandling: 'Bubble',
        bubble: new DayPilot.Bubble(),
        // Disable drag and drop functionality
        eventMoveHandling: 'Disabled',
        eventResizeHandling: 'Disabled',
        eventDeleteHandling: 'Disabled',
        eventClickHandling: 'Enabled',
        onEventClick: (args) => {
            const booking = args.e.data.booking;
            setSelectedBooking(booking);
            setCheckInDialogOpen(true);
        },
    };

    const handleCloseCheckIn = () => {
        setCheckInDialogOpen(false);
        setSelectedBooking(null);
    };

    return (
        <>
            {/* <SideNav open={open} setOpen={setOpen} /> */}
            <div
                style={{
                    minHeight: '100vh',
                    backgroundColor: '#f5f5f5',
                }}
            >
                <Box px={2}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {/* <IconButton style={{ color: '#063455' }} onClick={() => router.visit(route('rooms.dashboard'))}>
                            <ArrowBack />
                        </IconButton> */}
                        <Typography style={{ color: '#063455', fontSize: '30px', fontWeight: '700' }}>Room Booking Calendar</Typography>
                    </Box>
                    <Typography style={{ color: '#063455', fontSize: '15px', fontWeight: '600', marginLeft: 5 }}>Helps avoid double-booking and see occupancy trends at a glance</Typography>

                    <Box display="flex" gap={2} mb={2} mt={3}>
                        <FormControl
                            variant="outlined"
                            size="small"
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '16px',
                                    minWidth: '120px',
                                },
                            }}
                        >
                            <InputLabel id="month-label">Month</InputLabel>
                            <Select labelId="month-label" value={month} onChange={(e) => setMonth(e.target.value)} label="Month">
                                <MenuItem value="">Rolling 30 Days</MenuItem>
                                {moment.months().map((m, i) => (
                                    <MenuItem key={i} value={String(i + 1).padStart(2, '0')}>
                                        {m}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl
                            variant="outlined"
                            size="small"
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '16px',
                                },
                            }}
                        >
                            <InputLabel id="year-label">Year</InputLabel>
                            <Select labelId="year-label" value={year} onChange={(e) => setYear(e.target.value)} label="Year">
                                {Array.from({ length: 5 }, (_, i) => 2023 + i).map((y) => (
                                    <MenuItem key={y} value={y}>
                                        {y}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>

                    <DayPilotScheduler ref={schedulerRef} {...dpConfig} style={{ height: '650px' }} />
                </Box>
            </div>

            {/* Check-in Modal */}
            <RoomCheckInModal open={checkInDialogOpen} onClose={handleCloseCheckIn} bookingId={selectedBooking?.id} />

            <BookingActionModal
                open={actionModalOpen}
                onClose={() => setActionModalOpen(false)}
                booking={selectedActionBooking}
                action="cancel"
                onConfirm={(bookingId, reason, refundData) => {
                    const data = { cancellation_reason: reason };
                    if (refundData && refundData.amount) {
                        data.refund_amount = refundData.amount;
                        data.refund_mode = refundData.mode;
                        data.refund_account = refundData.account;
                    }
                    router.put(route('rooms.booking.cancel', bookingId), data, {
                        onSuccess: () => {
                            setActionModalOpen(false);
                            fetchData();
                        },
                    });
                }}
            />
        </>
    );
};

export default RoomCalendar;
