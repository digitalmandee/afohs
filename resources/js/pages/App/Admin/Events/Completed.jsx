import { router } from '@inertiajs/react';
import { ArrowBack, Search, Visibility } from '@mui/icons-material';
import { Box, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, ThemeProvider, Typography, createTheme, IconButton, Tooltip, TableFooter } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useEffect, useState } from 'react';
import { Badge, Container } from 'react-bootstrap';
import dayjs from 'dayjs';
import EventBookingInvoiceModal from '@/components/App/Events/EventBookingInvoiceModal';
import EventViewDocumentsModal from '@/components/App/Events/EventViewDocumentsModal';
import axios from 'axios';
import { FaEdit } from 'react-icons/fa';
import RoomBookingFilter from '../Booking/BookingFilter';

const theme = createTheme({
    palette: {
        primary: {
            main: '#063455',
        },
        secondary: {
            main: '#063455',
        },
        success: {
            main: '#0e5f3c',
        },
        warning: {
            main: '#5f0e0e',
        },
    },
});

const EventsCompleted = ({ bookings, filters = {}, aggregates }) => {
    // const [open, setOpen] = useState(true);
    const [filteredBookings, setFilteredBookings] = useState(bookings.data || []);
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const [selectedBookingId, setSelectedBookingId] = useState(null);
    const [venues, setVenues] = useState([]);

    // View Documents Modal state
    const [showDocsModal, setShowDocsModal] = useState(false);
    const [selectedBookingForDocs, setSelectedBookingForDocs] = useState(null);

    const handleShowInvoice = (booking) => {
        setSelectedBookingId(booking.id);
        setShowInvoiceModal(true);
    };

    const handleCloseInvoice = () => {
        setShowInvoiceModal(false);
        setSelectedBookingId(null);
    };

    const handleBookingUpdate = () => {
        router.reload({ only: ['bookings'] });
    };

    // View Documents handlers
    const handleShowDocs = (booking) => {
        setSelectedBookingForDocs(booking);
        setShowDocsModal(true);
    };

    const handleCloseDocs = () => {
        setShowDocsModal(false);
        setSelectedBookingForDocs(null);
    };

    // Load venues on component mount
    useEffect(() => {
        const loadVenues = async () => {
            try {
                const response = await axios.get('/api/events/venues');
                setVenues(response.data);
            } catch (error) {
                console.error('Error loading venues:', error);
            }
        };
        loadVenues();
    }, []);

    useEffect(() => {
        setFilteredBookings(bookings.data || []);
    }, [bookings]);

    return (
        <>
            {/* <SideNav open={open} setOpen={setOpen} /> */}
            <div
                style={{
                    minHeight: '100vh',
                    backgroundColor: '#f5f5f5',
                }}
            >
                <ThemeProvider theme={theme}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <Container fluid className="p-4 bg-light">
                            {/* Header */}
                            <Box className="d-flex justify-content-between align-items-center">
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    {/* <IconButton onClick={() => router.visit(route('events.dashboard'))} sx={{ color: '#063455' }}>
                                        <ArrowBack />
                                    </IconButton> */}
                                    <Typography style={{ color: '#063455', fontWeight: 700, fontSize: '30px' }}>Completed Events</Typography>
                                </Box>
                            </Box>
                            <Typography style={{ color: '#063455', fontSize: '15px', fontWeight: '600' }}>Useful for reporting, billing review, and historical reference</Typography>

                            {/* Filter Section */}
                            <RoomBookingFilter routeName="events.completed" showRoomType={false} showVenues={true} venues={venues} showStatus={false} showDates={{ booking: true, checkIn: true, checkOut: false }} dateLabels={{ booking: 'Booking Date', checkIn: 'Event Date' }} />

                            {/* Bookings Table */}
                            <TableContainer component={Paper} style={{ boxShadow: 'none', borderRadius: '16px' }}>
                                <Table>
                                    <TableHead>
                                        <TableRow style={{ backgroundColor: '#063455', height: '30px' }}>
                                            <TableCell sx={{ color: '#fff', fontSize: '14px', fontWeight: 600, whiteSpace: 'nowrap' }}>Booking No</TableCell>
                                            <TableCell sx={{ color: '#fff', fontSize: '14px', fontWeight: 600, whiteSpace: 'nowrap' }}>Membership / Guest ID</TableCell>
                                            <TableCell sx={{ color: '#fff', fontSize: '14px', fontWeight: 600, whiteSpace: 'nowrap' }}>Guest Name</TableCell>
                                            <TableCell sx={{ color: '#fff', fontSize: '14px', fontWeight: 600, whiteSpace: 'nowrap' }}>Guest Type</TableCell>
                                            <TableCell sx={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>Event</TableCell>
                                            <TableCell sx={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>Venue</TableCell>
                                            <TableCell sx={{ color: '#fff', fontSize: '14px', fontWeight: 600, whiteSpace: 'nowrap' }}>Timing</TableCell>
                                            <TableCell sx={{ color: '#fff', fontSize: '14px', fontWeight: 600, whiteSpace: 'nowrap' }}>Menu</TableCell>
                                            <TableCell sx={{ color: '#fff', fontSize: '14px', fontWeight: 600, whiteSpace: 'nowrap' }}>Booking Date</TableCell>
                                            <TableCell sx={{ color: '#fff', fontSize: '14px', fontWeight: 600, whiteSpace: 'nowrap' }}>Event Date</TableCell>
                                            <TableCell sx={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>Total</TableCell>
                                            <TableCell sx={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>Advance</TableCell>
                                            <TableCell sx={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>Paid</TableCell>
                                            <TableCell sx={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>Balance</TableCell>
                                            <TableCell sx={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>Actions</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {filteredBookings.length > 0 ? (
                                            filteredBookings.map((booking) => {
                                                const invoicePaid = Number(booking.invoice?.paid_amount ?? 0) + Number(booking.invoice?.advance_payment ?? 0);
                                                const totalReceived = invoicePaid + Number(booking.security_deposit ?? 0);
                                                const totalPrice = Number(booking.total_price ?? 0);
                                                const membershipOrGuestId = booking.member?.membership_no || booking.corporateMember?.membership_no || booking.corporate_member?.membership_no || booking.customer?.customer_no || '-';
                                                const guestTypeName =
                                                    booking.member
                                                        ? 'Member'
                                                        : booking.corporateMember || booking.corporate_member
                                                          ? 'Corporate Member'
                                                          : booking.customer
                                                            ? booking.customer?.guest_type?.name || booking.customer?.guestType?.name || 'Guest'
                                                            : '-';
                                                const timing = booking.event_time_from && booking.event_time_to ? `${booking.event_time_from} - ${booking.event_time_to}` : booking.event_time_from || booking.event_time_to || 'N/A';
                                                const menuName = booking.menu?.name || 'N/A';
                                                return (
                                                <TableRow key={booking.id} hover>
                                                    <TableCell sx={{ color: '#000', fontWeight: 600, fontSize: '14px', whiteSpace: 'nowrap' }}>{booking.booking_no}</TableCell>
                                                    <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px', whiteSpace: 'nowrap' }}>{membershipOrGuestId}</TableCell>
                                                    {/* <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px', whiteSpace: 'nowrap' }}>{booking.name || booking.customer?.name || booking.member?.full_name || booking.corporateMember?.full_name || booking.corporate_member?.full_name || 'N/A'}</TableCell> */}
                                                    <TableCell
                                                        sx={{
                                                            color: '#7F7F7F',
                                                            fontWeight: 400,
                                                            fontSize: '14px',
                                                            maxWidth: '120px',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap',
                                                        }}
                                                    >
                                                        <Tooltip title={booking.name || booking.customer?.name || booking.member?.full_name || booking.corporateMember?.full_name || booking.corporate_member?.full_name || 'N/A'} arrow>
                                                            <span>{booking.name || booking.customer?.name || booking.member?.full_name || booking.corporateMember?.full_name || booking.corporate_member?.full_name || 'N/A'}</span>
                                                        </Tooltip>
                                                    </TableCell>
                                                    <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px', whiteSpace: 'nowrap' }}>{guestTypeName}</TableCell>
                                                    {/* <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px', whiteSpace: 'nowrap' }}>{booking.nature_of_event}</TableCell> */}
                                                    <TableCell
                                                        sx={{
                                                            color: '#7F7F7F',
                                                            fontWeight: 400,
                                                            fontSize: '14px',
                                                            maxWidth: '100px',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap',
                                                        }}
                                                    >
                                                        {/* {booking.nature_of_event} */}
                                                        <Tooltip title={booking.nature_of_event || 'N/A'} arrow>
                                                            <span>{booking.nature_of_event || 'N/A'}</span>
                                                        </Tooltip>
                                                    </TableCell>
                                                    {/* <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px', whiteSpace: 'nowrap' }}>{booking.event_venue?.name || 'N/A'}</TableCell> */}
                                                    <TableCell
                                                        sx={{
                                                            color: '#7F7F7F',
                                                            fontWeight: 400,
                                                            fontSize: '14px',
                                                            maxWidth: '100px',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap',
                                                        }}
                                                    >
                                                        <Tooltip title={booking.event_venue?.name || 'N/A'} arrow>
                                                            <span>{booking.event_venue?.name || 'N/A'}</span>
                                                        </Tooltip>
                                                    </TableCell>
                                                    <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px', whiteSpace: 'nowrap' }}>{timing}</TableCell>
                                                    <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px', whiteSpace: 'nowrap' }}>
                                                        <Tooltip title={menuName} arrow>
                                                            <span>{menuName}</span>
                                                        </Tooltip>
                                                    </TableCell>
                                                    <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px', whiteSpace: 'nowrap' }}>{booking.created_at ? dayjs(booking.created_at).format('DD-MM-YYYY') : 'N/A'}</TableCell>
                                                    <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px', whiteSpace: 'nowrap' }}>{booking.event_date ? dayjs(booking.event_date).format('DD-MM-YYYY') : 'N/A'}</TableCell>
                                                    <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px' }}>{booking.total_price}</TableCell>
                                                    <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px' }}>{booking.advance_amount ?? 0}</TableCell>
                                                    <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px' }}>{totalReceived}</TableCell>
                                                    <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px' }}>{totalPrice - invoicePaid}</TableCell>
                                                    <TableCell>
                                                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                                            <Button size="small" onClick={() => handleShowDocs(booking)} title="View Documents" sx={{ minWidth: 'auto', p: '4px', color: '#063455' }}>
                                                                <Visibility fontSize="small" />
                                                            </Button>
                                                            <IconButton onClick={() => router.visit(route('events.booking.edit', booking.id))} size="small" title="Edit">
                                                                <FaEdit size={16} style={{ marginRight: 8, color: '#f57c00' }} />
                                                            </IconButton>
                                                            <Button
                                                                variant="outlined"
                                                                size="small"
                                                                color='#063455'
                                                                onClick={() => handleShowInvoice(booking)}
                                                                style={{
                                                                    // border: '1px solid #063455',
                                                                    color: '#063455',
                                                                    textTransform: 'none'
                                                                }}
                                                            >
                                                                View
                                                            </Button>
                                                            {/* <Button
                                                                variant="contained"
                                                                size="small"
                                                                onClick={() => router.visit(route('events.booking.edit', booking.id))}
                                                                style={{
                                                                    backgroundColor: '#063455',
                                                                    border: 'none',
                                                                    color: 'white',
                                                                }}
                                                            >
                                                                Edit
                                                            </Button> */}
                                                        </Box>
                                                    </TableCell>
                                                </TableRow>
                                                );
                                            })
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={11} align="center">
                                                    <Typography variant="body1" color="textSecondary">
                                                        No completed event bookings found
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                    {aggregates && (
                                        <TableFooter>
                                            <TableRow>
                                                <TableCell colSpan={6} sx={{ fontWeight: 'bold', fontSize: '15px' }}>
                                                    Grand Total
                                                </TableCell>
                                                <TableCell sx={{ fontWeight: 'bold', fontSize: '15px' }}>{aggregates.total_amount}</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold', fontSize: '15px' }}>{aggregates.total_advance}</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold', fontSize: '15px' }}>{aggregates.total_paid}</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold', fontSize: '15px' }}>{aggregates.total_balance}</TableCell>
                                                <TableCell />
                                            </TableRow>
                                        </TableFooter>
                                    )}
                                </Table>
                            </TableContainer>

                            {/* Pagination */}
                            {bookings.links && (
                                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                                    {bookings.links.map((link, index) => (
                                        <Button key={index} variant={link.active ? 'contained' : 'outlined'} size="small" onClick={() => link.url && router.visit(link.url)} disabled={!link.url} sx={{ mx: 0.5 }}>
                                            <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                        </Button>
                                    ))}
                                </Box>
                            )}
                        </Container>

                        {/* Event Booking Invoice Modal */}
                        <EventBookingInvoiceModal open={showInvoiceModal} onClose={handleCloseInvoice} bookingId={selectedBookingId} setBookings={handleBookingUpdate} />

                        {/* View Documents Modal */}
                        <EventViewDocumentsModal open={showDocsModal} onClose={handleCloseDocs} bookingId={selectedBookingForDocs?.id} />
                    </LocalizationProvider>
                </ThemeProvider>
            </div>
        </>
    );
};

export default EventsCompleted;
