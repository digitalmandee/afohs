import { router } from '@inertiajs/react';
import { FilterAlt, Search, Visibility, Cancel, Edit } from '@mui/icons-material';
import { Box, Button, Paper, InputAdornment, Table, TableBody, TextField, TableCell, TableContainer, TableHead, TableRow, ThemeProvider, Typography, createTheme, Tooltip } from '@mui/material';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useEffect, useMemo, useState } from 'react';
import { Badge, Col, Container, Form, Modal, Row } from 'react-bootstrap';
import RoomBookingFilter from './BookingFilter';
import dayjs from 'dayjs'; // Added for duration calculation
import BookingInvoiceModal from '@/components/App/Rooms/BookingInvoiceModal';
import ViewDocumentsModal from '@/components/App/Rooms/ViewDocumentsModal';
import BookingActionModal from '@/components/App/Rooms/BookingActionModal';
import RoomCheckInModal from '@/components/App/Rooms/CheckInModal';
import debounce from 'lodash.debounce';
import { FaEdit } from 'react-icons/fa';

// const drawerWidthOpen = 240;
// const drawerWidthClosed = 110;

const theme = createTheme({
    palette: {
        primary: {
            main: '#0e3c5f',
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

const dialogStyles = `
.custom-dialog-right.modal-dialog {
  position: fixed;
  top: 20px;
  right: 20px;
  margin: 0;
  width: 600px;
  max-width: 600px;
  transform: none;
  z-index: 1050;
}

.custom-dialog-right .modal-content {
  height: auto;
  max-height: calc(100vh - 40px);
  overflow-y: auto;
  border-radius: 6px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  scrollbar-width: none;         /* Firefox */
  -ms-overflow-style: none;      /* IE 10+ */
}

.custom-dialog-right .modal-content::-webkit-scrollbar {
  display: none;                 /* Chrome, Safari */
}
.dialog-top-right {
  position: fixed !important;
  top: 20px !important;
  right: 20px !important;
  margin: 0 !important;
  transform: none !important;
  height: auto;
  max-height: calc(100vh - 40px); /* prevent going off screen */
}

.dialog-top-right .modal-dialog {
  margin: 0 !important;
  max-width: 600px !important;
  width: 600px !important;
}

.dialog-top-right .modal-content {
  box-shadow: 0 5px 15px rgba(0,0,0,0.2);
  border-radius: 0px;
  border: 1px solid rgba(0,0,0,0.1);
  height: 100%;
  max-height: calc(100vh - 40px);
  overflow-y: auto;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none;  /* IE 10+ */
}

.dialog-top-right .modal-content::-webkit-scrollbar {
  display: none; /* Chrome, Safari */
}

@media (max-width: 600px) {
  .dialog-top-right .modal-dialog {
    width: 90% !important;
    max-width: 90% !important;
  }
}
`;

const RoomScreen = ({ bookings }) => {
    // const [open, setOpen] = useState(true);
    // const [searchTerm, setSearchTerm] = useState('');
    // const [showFilter, setShowFilter] = useState(false);

    const [filteredBookings, setFilteredBookings] = useState(bookings.data || []); // Initialize with all bookings

    // TODO: Remove invoice modal state when reverting to original print functionality
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    // TODO: Remove selected booking state when reverting to original print functionality
    const [selectedBooking, setSelectedBooking] = useState(null);

    // View Documents Modal state
    const [showDocsModal, setShowDocsModal] = useState(false);
    const [selectedBookingForDocs, setSelectedBookingForDocs] = useState(null);

    const debouncedSearch = useMemo(
        () =>
            debounce((value) => {
                const currentFilters = { ...(bookings.filters || {}) }; // Ensure we get filters from props if available
                delete currentFilters.search;
                router.get(route('rooms.manage'), { ...currentFilters, search: value }, { preserveState: true });
            }, 500), // 500ms delay
        [bookings.filters],
    );

    // ✅ Handle input change
    // const handleSearchChange = (e) => {
    //     setSearchTerm(e.target.value);
    //     debouncedSearch(e.target.value);
    // };

    // TODO: Remove invoice modal handler when reverting to original print functionality
    const handleShowInvoice = (booking) => {
        setSelectedBooking(booking);
        setShowInvoiceModal(true);
    };

    // TODO: Remove invoice modal close handler when reverting to original print functionality
    const handleCloseInvoice = () => {
        setShowInvoiceModal(false);
        setSelectedBooking(null);
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

    // Check-In Modal State
    const [checkInModalOpen, setCheckInModalOpen] = useState(false);
    const [selectedCheckInBooking, setSelectedCheckInBooking] = useState(null);

    const handleOpenCheckIn = (booking) => {
        setSelectedCheckInBooking(booking);
        setCheckInModalOpen(true);
    };

    const handleCloseCheckIn = (result) => {
        setCheckInModalOpen(false);
        setSelectedCheckInBooking(null);
        if (result === 'success') {
            router.reload();
        }
    };

    // Action Modal State
    const [actionModalOpen, setActionModalOpen] = useState(false);
    const [actionType, setActionType] = useState(null);
    const [selectedActionBooking, setSelectedActionBooking] = useState(null);

    const handleOpenActionModal = (booking, type) => {
        setSelectedActionBooking(booking);
        setActionType(type); // 'cancel'
        setActionModalOpen(true);
    };

    const handleConfirmAction = (bookingId, reason, refundData) => {
        if (actionType === 'cancel') {
            const data = { cancellation_reason: reason };

            router.put(route('rooms.booking.cancel', bookingId), data, {
                onSuccess: () => {
                    setActionModalOpen(false);
                    // maybe show toast
                },
            });
        } else if (actionType === 'refund') {
            const data = {
                refund_amount: refundData.amount,
                refund_mode: refundData.mode,
                refund_account: refundData.account,
                notes: reason, // Optional note from modal
            };
            router.put(route('rooms.booking.refund', bookingId), data, {
                onSuccess: () => setActionModalOpen(false),
            });
        } else {
            router.put(
                route('rooms.booking.undo-cancel', bookingId),
                {},
                {
                    onSuccess: () => setActionModalOpen(false),
                },
            );
        }
    };

    useEffect(() => {
        setFilteredBookings(bookings.data || []);
    }, [bookings]);

    const statusColors = {
        checkedout: '#008000', // Green
        checkedin: '#FFFF00', // Yellow
        confirmed: '#800080', // Purple
        cancelled: '#FF0000', // Red
        // fallback for others
    };

    return (
        <>
            {/* <SideNav open={open} setOpen={setOpen} />
            <div
                style={{
                    marginLeft: open ? `${drawerWidthOpen}px` : `${drawerWidthClosed}px`,
                    transition: 'margin-left 0.3s ease-in-out',
                    marginTop: '5rem',
                }}
            > */}
            <ThemeProvider theme={theme}>
                {/* <style>{dialogStyles}</style> */}
                <Container
                    fluid
                    className="p-4"
                    style={{
                        backgroundColor: '#F6F6F6',
                    }}
                >
                    {/* Search and Filter */}
                    <Row className="align-items-center mt-2 mb-3">
                        <Col>
                            <Typography style={{ color: '#063455', fontWeight: 700, fontSize: '30px' }}>Room Bookings</Typography>
                        </Col>
                        <Col xs="auto">{/* Space for future actions if needed */}</Col>
                        <Typography style={{ color: '#063455', fontSize: '15px', fontWeight: '600' }}>List and edit details of all rooms in the system</Typography>
                    </Row>

                    {/* Inline Filter */}
                    <RoomBookingFilter showStatus={false} />

                    {/* TODO: Updated to use filteredBookings from data.bookings */}

                    <TableContainer sx={{ marginTop: '20px' }} component={Paper} style={{ boxShadow: 'none', overflowX: 'auto', borderRadius: '12px' }}>
                        <Table>
                            <TableHead>
                                <TableRow style={{ backgroundColor: '#063455', height: '30px' }}>
                                    <TableCell sx={{ fontWeight: 600, color: '#fff', whiteSpace: 'nowrap' }}>Booking ID</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#fff', whiteSpace: 'nowrap' }}>Member / Guest</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#fff', whiteSpace: 'nowrap' }}>Membership No</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#fff', whiteSpace: 'nowrap' }}>Occupied By</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#fff', whiteSpace: 'nowrap' }}>Booking Date</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#fff', whiteSpace: 'nowrap' }}>Check-In</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#fff', whiteSpace: 'nowrap' }}>Check-Out</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#fff' }}>Room</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#fff' }}>Persons</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#fff' }}>Duration</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#fff', whiteSpace: 'nowrap' }}>Per Day Charge</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#fff', whiteSpace: 'nowrap' }}>Security Deposit</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#fff', whiteSpace: 'nowrap' }}>Advance Paid</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#fff', whiteSpace: 'nowrap' }}>Payment Mode</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#fff', whiteSpace: 'nowrap' }}>Payment Account</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#fff', whiteSpace: 'nowrap' }}>Total Amount</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#fff' }}>Status</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#fff' }}>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredBookings.length > 0 ? (
                                    filteredBookings.map((booking, index) => {
                                        const durationInDays = dayjs(booking.check_out_date).diff(dayjs(booking.check_in_date), 'day') + 1;

                                        return (
                                            <TableRow key={booking.id} style={{ borderBottom: '1px solid #eee' }}>
                                                <TableCell sx={{ color: '#000', fontWeight: 600, fontSize: '14px' }}>{booking.booking_no}</TableCell>
                                                {/* <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px' }}>{booking.customer ? booking.customer.name : booking.member ? booking.member.full_name : booking.corporateMember || booking.corporate_member ? (booking.corporateMember || booking.corporate_member).full_name : ''}</TableCell> */}
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
                                                    <Tooltip title={booking.customer ? booking.customer.name : booking.member ? booking.member.full_name : booking.corporateMember || booking.corporate_member ? (booking.corporateMember || booking.corporate_member).full_name : ''} arrow>
                                                        <span>{booking.customer ? booking.customer.name : booking.member ? booking.member.full_name : booking.corporateMember || booking.corporate_member ? (booking.corporateMember || booking.corporate_member).full_name : ''}</span>
                                                    </Tooltip>
                                                </TableCell>
                                                <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px' }}>{booking.member ? booking.member.membership_no : booking.corporateMember || booking.corporate_member ? (booking.corporateMember || booking.corporate_member).membership_no : booking.customer ? booking.customer.customer_no : '-'}</TableCell>
                                                <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px' }}>{`${booking.guest_first_name || ''} ${booking.guest_last_name || ''}`.trim() || '-'}</TableCell>
                                                <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px' }}>{booking.booking_date ? dayjs(booking.booking_date).format('DD-MM-YYYY') : ''}</TableCell>
                                                <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px', whiteSpace: 'nowrap' }}>{booking.check_in_date ? dayjs(booking.check_in_date).format('DD-MM-YYYY') : ''}</TableCell>
                                                <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px', whiteSpace: 'nowrap' }}>{booking.check_out_date ? dayjs(booking.check_out_date).format('DD-MM-YYYY') : ''}</TableCell>
                                                <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px' }}>{booking.room?.name}</TableCell>
                                                <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px' }}>{booking.persons}</TableCell>
                                                <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px' }}>{booking.nights}</TableCell>
                                                <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px' }}>{Math.round(booking.per_day_charge)}</TableCell>
                                                <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px' }}>{Math.round(booking.security_deposit)}</TableCell>
                                                <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px' }}>{Math.round(booking.advance_amount)}</TableCell>
                                                <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px' }}>{booking.invoice ? booking.invoice.payment_method : '-'}</TableCell>
                                                <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px' }}>{booking.invoice?.payment_account || booking.invoice?.data?.payment_account || '-'}</TableCell>
                                                <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px' }}>{Math.round(booking.grand_total)}</TableCell>
                                                {/* <TableCell>
                                                    <Badge
                                                        bg=""
                                                        style={{
                                                            backgroundColor: booking.status.replace(/_/g, '').toLowerCase() === 'confirmed' ? '#0e5f3c' : '#842029',
                                                            color: 'white',
                                                            // padding: '5px 10px',
                                                            // borderRadius: '2px',
                                                            fontSize: '0.8rem',
                                                            fontWeight: 500,
                                                            minWidth: '100px',
                                                            textAlign: 'center',
                                                            borderRadius: '4px',
                                                            textTransform: 'capitalize',
                                                        }}
                                                    >
                                                        {booking.status.replace(/_/g, ' ')}
                                                    </Badge>
                                                </TableCell> */}
                                                <TableCell>
                                                    <Badge
                                                        bg=""
                                                        style={{
                                                            backgroundColor: statusColors[booking.status.replace(/_/g, '').toLowerCase()] || '#842029',
                                                            color: 'white',
                                                            fontSize: '0.8rem',
                                                            fontWeight: 500,
                                                            minWidth: '100px',
                                                            textAlign: 'center',
                                                            borderRadius: '4px',
                                                            textTransform: 'capitalize',
                                                        }}
                                                    >
                                                        {booking.status.replace(/_/g, ' ')}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                                        <Button size="small" onClick={() => handleShowDocs(booking)} title="View Documents" sx={{ minWidth: 'auto', color: '#063455' }}>
                                                            <Visibility fontSize="small" />
                                                        </Button>
                                                        <Button size="small" onClick={() => router.visit(route('rooms.edit.booking', { id: booking.id }))} title="Edit Booking" sx={{ minWidth: 'auto', color: '#f57c00' }}>
                                                            <FaEdit size={18} />
                                                        </Button>
                                                        <Button variant="outlined" size="small" color="#063455" onClick={() => handleShowInvoice(booking)} style={{ textTransform: 'none' }}>
                                                            View
                                                        </Button>
                                                        {['pending', 'confirmed'].includes(booking.status) && (
                                                            <Button variant="outlined" size="small" color="#063455" onClick={() => handleOpenCheckIn(booking)} style={{ textTransform: 'none', whiteSpace: 'nowrap' }}>
                                                                Check In
                                                            </Button>
                                                        )}
                                                        {!['cancelled', 'refunded'].includes(booking.status) && (
                                                            <Button
                                                                size="small"
                                                                variant="outlined"
                                                                color="error" // Use predefined error color
                                                                onClick={() => handleOpenActionModal(booking, 'cancel')}
                                                                title="Cancel Booking"
                                                                sx={{ minWidth: 'auto', p: '4px', color: '#d32f2f', borderColor: '#d32f2f' }}
                                                            >
                                                                <Cancel fontSize="small" />
                                                            </Button>
                                                        )}
                                                        {booking.status === 'cancelled' &&
                                                            Number(booking.invoice?.advance_payment || booking.invoice?.paid_amount || 0) > 0 &&
                                                            (booking.booking_date || booking.created_at) &&
                                                            dayjs().diff(dayjs(booking.booking_date || booking.created_at), 'day') <= 2 && (
                                                            <Button size="small" variant="outlined" color="error" onClick={() => handleOpenActionModal(booking, 'refund')} title="Return Advance" sx={{ textTransform: 'none' }}>
                                                                Return Advance
                                                            </Button>
                                                        )}
                                                    </Box>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={11} align="center">
                                            No bookings found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    <Box display="flex" justifyContent="center" mt={2}>
                        {bookings.links?.map((link, index) => (
                            <Button
                                key={index}
                                onClick={() => link.url && router.visit(link.url)}
                                disabled={!link.url}
                                variant={link.active ? 'contained' : 'outlined'}
                                size="small"
                                style={{
                                    margin: '0 5px',
                                    minWidth: '36px',
                                    padding: '6px 10px',
                                    fontWeight: link.active ? 'bold' : 'normal',
                                    backgroundColor: link.active ? '#333' : '#fff',
                                }}
                            >
                                <span dangerouslySetInnerHTML={{ __html: link.label }} />
                            </Button>
                        ))}
                    </Box>

                    {/* Booking Invoice Modal */}
                    <BookingInvoiceModal open={showInvoiceModal} onClose={() => handleCloseInvoice()} bookingId={selectedBooking?.id} setBookings={setFilteredBookings} type="ROOM_BOOKING" />

                    {/* View Documents Modal */}
                    <ViewDocumentsModal open={showDocsModal} onClose={handleCloseDocs} bookingId={selectedBookingForDocs?.id} />

                    {/* Check-In Modal */}
                    <RoomCheckInModal open={checkInModalOpen} onClose={handleCloseCheckIn} bookingId={selectedCheckInBooking?.id} />

                    <BookingActionModal open={actionModalOpen} onClose={() => setActionModalOpen(false)} booking={selectedActionBooking} action={actionType} onConfirm={handleConfirmAction} />
                </Container>
            </ThemeProvider>
            {/* </div> */}
        </>
    );
};

export default RoomScreen;
