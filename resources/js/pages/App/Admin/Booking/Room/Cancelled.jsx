import { router } from '@inertiajs/react';
import { ArrowBack, Search, Restore } from '@mui/icons-material';
import { Box, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, ThemeProvider, Typography, createTheme, IconButton, TextField, Grid, Chip } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { styled } from '@mui/material/styles';
import debounce from 'lodash.debounce';
import BookingInvoiceModal from '@/components/App/Rooms/BookingInvoiceModal';
import RoomBookingFilter from '../BookingFilter';
import BookingActionModal from '@/components/App/Rooms/BookingActionModal';

const RoundedTextField = styled(TextField)({
    '& .MuiOutlinedInput-root': { borderRadius: '16px' },
});

const RoomCancelled = ({ bookings, filters = {} }) => {
    // const [searchTerm, setSearchTerm] = useState(filters.search_name || '');
    // const [searchId, setSearchId] = useState(filters.search_id || '');
    // const [bookingDateFrom, setBookingDateFrom] = useState(filters.booking_date_from || '');
    // const [bookingDateTo, setBookingDateTo] = useState(filters.booking_date_to || '');
    const [filteredBookings, setFilteredBookings] = useState(bookings.data || []);

    // Invoice Modal
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);

    const handleOpenInvoice = (booking) => {
        setSelectedBooking(booking);
        setShowInvoiceModal(true);
    };

    // Action Modal State
    const [actionModalOpen, setActionModalOpen] = useState(false);
    const [actionType, setActionType] = useState(null);
    const [selectedActionBooking, setSelectedActionBooking] = useState(null);

    const handleOpenActionModal = (booking, type) => {
        setSelectedActionBooking(booking);
        setActionType(type); // 'undo'
        setActionModalOpen(true);
    };

    const handleConfirmAction = (bookingId, reason, refundData) => {
        if (actionType === 'cancel') {
            const data = { cancellation_reason: reason };
            if (refundData && refundData.amount) {
                data.refund_amount = refundData.amount;
                data.refund_mode = refundData.mode;
                data.refund_account = refundData.account;
            }
            router.put(route('rooms.booking.cancel', bookingId), data, {
                onSuccess: () => setActionModalOpen(false),
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
    // const debouncedSearch = useMemo(
    //     () =>
    //         debounce((value) => {
    //             router.get(route('rooms.booking.cancelled'), { search_name: value }, { preserveState: true });
    //         }, 500),
    //     [],
    // );

    // const handleSearchChange = (e) => {
    //     setSearchTerm(e.target.value);
    //     debouncedSearch(e.target.value);
    // };

    // const handleReset = () => {
    //     setSearchTerm('');
    //     setSearchId('');
    //     setBookingDateFrom('');
    //     setBookingDateTo('');

    //     router.get(route('rooms.booking.cancelled'), {}, { preserveState: true, preserveScroll: true });
    // };

    // const handleApply = () => {
    //     const filterParams = {};
    //     if (searchTerm) filterParams.search_name = searchTerm;
    //     if (searchId) filterParams.search_id = searchId;
    //     if (bookingDateFrom) filterParams.booking_date_from = bookingDateFrom;
    //     if (bookingDateTo) filterParams.booking_date_to = bookingDateTo;

    //     router.get(route('rooms.booking.cancelled'), filterParams, { preserveState: true, preserveScroll: true });
    // };

    // const handleUndo = (id) => {
    //     if (confirm('Are you sure you want to undo this cancellation?')) {
    //         router.put(route('rooms.booking.undo-cancel', id));
    //     }
    // };

    useEffect(() => {
        setFilteredBookings(bookings.data || []);
    }, [bookings]);

    useEffect(() => {
        setFilteredBookings(bookings.data || []);
    }, [bookings]);

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
                <Box sx={{ p: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        {/* <IconButton onClick={() => router.visit(route('rooms.dashboard'))} sx={{ color: '#063455' }}>
                                <ArrowBack />
                            </IconButton> */}
                        <Typography style={{ color: '#063455', fontWeight: 700, fontSize: '30px' }}>Cancelled & Refunded Room Bookings</Typography>
                    </Box>

                    {/* Filters */}
                    {/* Filters */}
                    <RoomBookingFilter routeName="rooms.booking.cancelled" showStatus={false} showRoomType={true} showDates={{ booking: true, checkIn: true, checkOut: true }} />

                    <TableContainer component={Paper} style={{ boxShadow: 'none', borderRadius: '16px' }}>
                        <Table>
                            <TableHead>
                                <TableRow style={{ backgroundColor: '#063455', height: '60px' }}>
                                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>ID</TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 600, whiteSpace: 'nowrap' }}>Booking Date</TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 600, whiteSpace: 'nowrap' }}>Check-In</TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 600, whiteSpace: 'nowrap' }}>Check-Out</TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 600, whiteSpace: 'nowrap' }}>Member / Guest</TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 600, whiteSpace: 'nowrap' }}>Membership No</TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 600, whiteSpace: 'nowrap' }}>Occupied By</TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 600, whiteSpace: 'nowrap' }}>Room</TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>Persons</TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 600, whiteSpace: 'nowrap' }}>Per Day Charge</TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 600, whiteSpace: 'nowrap' }}>Security Deposit</TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 600, whiteSpace: 'nowrap' }}>Payment Mode</TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 600, whiteSpace: 'nowrap' }}>Account</TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>Status</TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredBookings.length > 0 ? (
                                    filteredBookings.map((booking) => (
                                        <TableRow key={booking.id} hover style={{ borderBottom: '1px solid #eee' }}>
                                            <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px', whiteSpace: 'nowrap' }}>{booking.id}</TableCell>
                                            <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px', whiteSpace: 'nowrap' }}>{booking.booking_date ? dayjs(booking.booking_date).format('DD-MM-YYYY') : ''}</TableCell>
                                            <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px', whiteSpace: 'nowrap' }}>{booking.check_in_date ? dayjs(booking.check_in_date).format('DD-MM-YYYY') : ''}</TableCell>
                                            <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px', whiteSpace: 'nowrap' }}>{booking.check_out_date ? dayjs(booking.check_out_date).format('DD-MM-YYYY') : ''}</TableCell>
                                            <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px', whiteSpace: 'nowrap' }}>{booking.customer ? booking.customer.name : booking.member ? booking.member.full_name : booking.corporateMember?.full_name || 'N/A'}</TableCell>
                                            <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px', whiteSpace: 'nowrap' }}>{booking.member ? booking.member.membership_no : booking.corporateMember ? booking.corporateMember.membership_no : booking.customer ? booking.customer.customer_no : '-'}</TableCell>
                                            <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px', whiteSpace: 'nowrap' }}>{`${booking.guest_first_name || ''} ${booking.guest_last_name || ''}`.trim() || '-'}</TableCell>
                                            <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px', whiteSpace: 'nowrap' }}>{booking.room?.name || 'N/A'}</TableCell>
                                            <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px', whiteSpace: 'nowrap' }}>{booking.persons}</TableCell>
                                            <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px', whiteSpace: 'nowrap' }}>{booking.per_day_charge}</TableCell>
                                            <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px', whiteSpace: 'nowrap' }}>{booking.invoice ? booking.invoice.advance_payment || booking.invoice.paid_amount : '-'}</TableCell>
                                            <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px', whiteSpace: 'nowrap' }}>{booking.invoice ? booking.invoice.payment_method : '-'}</TableCell>
                                            <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px', whiteSpace: 'nowrap' }}>{booking.invoice && booking.invoice.data ? booking.invoice.data.payment_account : '-'}</TableCell>
                                            <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px', whiteSpace: 'nowrap' }}>
                                                {booking.status.replace(/_/g, ' ')}
                                                {booking.status === 'refunded' &&
                                                    (() => {
                                                        const match = booking.notes && booking.notes.match(/Refund Processed: (\d+)/);
                                                        return match ? <div style={{ fontSize: '11px', color: '#063455', fontWeight: 'bold' }}>Refunded: Rs {match[1]}</div> : null;
                                                    })()}
                                            </TableCell>
                                            <TableCell style={{ whiteSpace: 'nowrap' }}>
                                                <Button size="small" variant="outlined" color="#063455" startIcon={<Restore />} onClick={() => handleOpenActionModal(booking, 'undo')} sx={{ textTransform: 'none' }}>
                                                    Undo
                                                </Button>
                                                {booking.status === 'cancelled' &&
                                                    Number(booking.invoice?.advance_payment || booking.invoice?.paid_amount || 0) > 0 &&
                                                    (booking.booking_date || booking.created_at) &&
                                                    dayjs().diff(dayjs(booking.booking_date || booking.created_at), 'day') <= 2 && (
                                                    <Button size="small" variant="outlined" color="error" onClick={() => handleOpenActionModal(booking, 'refund')} sx={{ textTransform: 'none', ml: 1, color: '#d32f2f' }}>
                                                        Return Advance
                                                    </Button>
                                                )}
                                                <Button variant="outlined" size="small" color="#063455" onClick={() => handleOpenInvoice(booking)} sx={{ textTransform: 'none', color: '#063455', ml: 1 }}>
                                                    View
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={10} align="center">
                                            No cancelled bookings found
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
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
                </Box>
            </LocalizationProvider>

            <BookingInvoiceModal open={showInvoiceModal} onClose={() => setShowInvoiceModal(false)} bookingId={selectedBooking?.id} type="CANCELLATION" />

            <BookingActionModal open={actionModalOpen} onClose={() => setActionModalOpen(false)} booking={selectedActionBooking} action={actionType} onConfirm={handleConfirmAction} />
        </div>
    );
};

export default RoomCancelled;
