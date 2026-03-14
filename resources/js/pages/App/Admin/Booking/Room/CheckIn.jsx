import React, { useState } from 'react';
import RoomBookingFilter from '../BookingFilter';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import { usePage, router } from '@inertiajs/react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, TextField, InputAdornment, Tooltip, createTheme, ThemeProvider } from '@mui/material';
import { Search, Visibility, Edit } from '@mui/icons-material';
import 'bootstrap/dist/css/bootstrap.min.css';
import { styled } from '@mui/material/styles';
import { generateInvoiceContent, JSONParse } from '@/helpers/generateTemplate';
import BookingInvoiceModal from '@/components/App/Rooms/BookingInvoiceModal';
import ViewDocumentsModal from '@/components/App/Rooms/ViewDocumentsModal';
import RoomOrderHistoryModal from '@/components/App/Rooms/RoomOrderHistoryModal';
import { FaEdit } from 'react-icons/fa';

const RoomCheckIn = ({ bookings, filters }) => {
    // const [open, setOpen] = useState(true);

    // ✅ State for Invoice Modal
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);

    // ✅ Filter States
    // const [searchQuery, setSearchQuery] = useState(filters?.search || '');
    // const [startDate, setStartDate] = useState(filters?.start_date || '');
    // const [endDate, setEndDate] = useState(filters?.end_date || '');

    // View Documents Modal state
    const [showDocsModal, setShowDocsModal] = useState(false);
    const [selectedBookingForDocs, setSelectedBookingForDocs] = useState(null);

    // Order History Modal state
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [selectedBookingForHistory, setSelectedBookingForHistory] = useState(null);
    const [invoiceType, setInvoiceType] = useState('STANDARD');

    const handleShowHistory = (booking) => {
        setSelectedBookingForHistory(booking);
        setShowHistoryModal(true);
    };

    // ✅ Open Invoice Modal
    const handleOpenInvoice = (booking) => {
        setSelectedBooking(booking);
        setShowInvoiceModal(true);
    };

    // ✅ Close Invoice Modal
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

    // ✅ Handle Filter/Search - Send to backend
    // const handleSearch = () => {
    //     router.get(
    //         route('rooms.checkin'),
    //         {
    //             search: searchQuery,
    //             start_date: startDate,
    //             end_date: endDate,
    //         },
    //         {
    //             preserveState: true,
    //             preserveScroll: true,
    //         },
    //     );
    // };

    // ✅ Reset Filters
    // const handleReset = () => {
    //     setSearchQuery('');
    //     setStartDate('');
    //     setEndDate('');
    //     router.get(route('rooms.checkin'), {}, { preserveState: true, preserveScroll: true });
    // };
    // const RoundedTextField = styled(TextField)({
    //     '& .MuiOutlinedInput-root': {
    //         borderRadius: '16px',
    //     },
    // });

    return (
        <>
            {/* <SideNav open={open} setOpen={setOpen} /> */}

            <div
                style={{
                    minHeight: '100vh',
                    backgroundColor: '#f5f5f5',
                    overflowX: 'hidden',
                }}
            >
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <Box sx={{ p: 3 }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography
                                sx={{
                                    // marginLeft: '10px',
                                    fontWeight: 700,
                                    color: '#063455',
                                    fontSize: '30px',
                                }}
                            >
                                Room CheckIn
                            </Typography>
                        </Box>
                        <Typography style={{ color: '#063455', fontSize: '15px', fontWeight: '600' }}>Register an arriving guest into an allocated room</Typography>

                        {/* Filter Section */}
                        {/* Filter Section */}
                        <RoomBookingFilter routeName="rooms.checkin" showStatus={false} showRoomType={true} showDates={{ booking: true, checkIn: true, checkOut: true }} />

                        <TableContainer sx={{ marginTop: '20px' }} component={Paper} style={{ boxShadow: 'none', overflowX: 'auto', borderRadius: '16px' }}>
                            <Table>
                                <TableHead>
                                    <TableRow style={{ backgroundColor: '#063455', height: '60px' }}>
                                        <TableCell sx={{ fontWeight: 600, color: '#fff' }}>ID</TableCell>
                                        <TableCell sx={{ fontWeight: 600, color: '#fff', whiteSpace: 'nowrap' }}>Booking Date</TableCell>
                                        <TableCell sx={{ fontWeight: 600, color: '#fff', whiteSpace: 'nowrap' }}>Check-In</TableCell>
                                        <TableCell sx={{ fontWeight: 600, color: '#fff', whiteSpace: 'nowrap' }}>Check-Out</TableCell>
                                        <TableCell sx={{ fontWeight: 600, color: '#fff', whiteSpace: 'nowrap' }}>Member / Guest</TableCell>
                                        <TableCell sx={{ fontWeight: 600, color: '#fff', whiteSpace: 'nowrap' }}>Membership No</TableCell>
                                        <TableCell sx={{ fontWeight: 600, color: '#fff', whiteSpace: 'nowrap' }}>Member Type</TableCell>
                                        <TableCell sx={{ fontWeight: 600, color: '#fff', whiteSpace: 'nowrap' }}>Occupied By</TableCell>
                                        <TableCell sx={{ fontWeight: 600, color: '#fff', whiteSpace: 'nowrap' }}>Room</TableCell>
                                        <TableCell sx={{ fontWeight: 600, color: '#fff' }}>Persons</TableCell>
                                        <TableCell sx={{ fontWeight: 600, color: '#fff', whiteSpace: 'nowrap' }}>Per Day Charge</TableCell>
                                        <TableCell sx={{ fontWeight: 600, color: '#fff', whiteSpace: 'nowrap' }}>Security Deposit</TableCell>
                                        <TableCell sx={{ fontWeight: 600, color: '#fff', whiteSpace: 'nowrap' }}>Advance Paid</TableCell>
                                        <TableCell sx={{ fontWeight: 600, color: '#fff', whiteSpace: 'nowrap' }}>Payment Mode</TableCell>
                                        <TableCell sx={{ fontWeight: 600, color: '#fff', whiteSpace: 'nowrap' }}>Payment Account</TableCell>
                                        <TableCell sx={{ fontWeight: 600, color: '#fff' }}>Status</TableCell>
                                        <TableCell sx={{ fontWeight: 600, color: '#fff' }}>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {bookings.data && bookings.data.length > 0 ? (
                                        bookings.data.map((booking) => (
                                            <TableRow key={booking.id} style={{ borderBottom: '1px solid #eee' }}>
                                                <TableCell sx={{ color: '#000', fontWeight: 600, fontSize: '14px', whiteSpace: 'nowrap' }}>{booking.id}</TableCell>
                                                <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px', whiteSpace: 'nowrap' }}>{booking.booking_date ? dayjs(booking.booking_date).format('DD-MM-YYYY') : ''}</TableCell>
                                                <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px', whiteSpace: 'nowrap' }}>{booking.check_in_date ? dayjs(booking.check_in_date).format('DD-MM-YYYY') : ''}</TableCell>
                                                <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px', whiteSpace: 'nowrap' }}>{booking.check_out_date ? dayjs(booking.check_out_date).format('DD-MM-YYYY') : ''}</TableCell>
                                                {/* <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px', whiteSpace: 'nowrap' }}>{booking.customer ? booking.customer.name : booking.member ? booking.member.full_name : booking.corporateMember || booking.corporate_member ? (booking.corporateMember || booking.corporate_member).full_name : ''}</TableCell> */}
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
                                                <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px', whiteSpace: 'nowrap' }}>{booking.member ? booking.member.membership_no : booking.corporateMember || booking.corporate_member ? (booking.corporateMember || booking.corporate_member).membership_no : booking.customer ? booking.customer.customer_no : '-'}</TableCell>
                                                <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px', whiteSpace: 'nowrap' }}>{booking.member ? 'Member' : booking.corporateMember || booking.corporate_member ? 'Corporate' : booking.customer ? 'Guest' : booking.employee ? 'Employee' : 'Unknown'}</TableCell>
                                                <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px', whiteSpace: 'nowrap' }}>{`${booking.guest_first_name || ''} ${booking.guest_last_name || ''}`.trim() || '-'}</TableCell>
                                                <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px', whiteSpace: 'nowrap' }}>{booking.room?.name}</TableCell>
                                                <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px', whiteSpace: 'nowrap' }}>{booking.persons}</TableCell>
                                                <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px', whiteSpace: 'nowrap' }}>{booking.per_day_charge}</TableCell>
                                                <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px', whiteSpace: 'nowrap' }}>{booking.security_deposit || '-'}</TableCell>
                                                <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px', whiteSpace: 'nowrap' }}>{booking.advance_amount || '-'}</TableCell>
                                                <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px', whiteSpace: 'nowrap' }}>{booking.invoice ? booking.invoice.payment_method : '-'}</TableCell>
                                                <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px', whiteSpace: 'nowrap' }}>{booking.invoice?.payment_account || booking.invoice?.data?.payment_account || '-'}</TableCell>
                                                <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px', whiteSpace: 'nowrap' }}>{booking.status.replace(/_/g, ' ')}</TableCell>
                                                <TableCell>
                                                    <Box
                                                        sx={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 1, // adds space between buttons
                                                            flexWrap: 'nowrap', // ensures they stay on the same line
                                                        }}
                                                    >
                                                        <Button size="small" onClick={() => handleShowDocs(booking)} title="View Documents" sx={{ minWidth: 'auto', p: '4px', mr: 1, color: '#063455' }}>
                                                            <Visibility fontSize="small" />
                                                        </Button>
                                                        <Button size="small" onClick={() => router.visit(route('rooms.edit.booking', { id: booking.id }))} title="Edit Booking" sx={{ minWidth: 'auto', mr: 1, color: '#f57c00' }}>
                                                            <FaEdit size={18} />
                                                        </Button>
                                                        <Button variant="outlined" size="small" color="#063455" style={{ marginRight: '8px', width: 100, textTransform: 'none', color: '#063455' }} onClick={() => router.visit(route('rooms.edit.booking', { id: booking.id, type: 'checkout' }))}>
                                                            Check Out
                                                        </Button>
                                                        {/* <Button variant="outlined" size="small" color="#063455" onClick={() => handleOpenInvoice(booking)} sx={{ textTransform: 'none', color: '#063455' }}>
                                                            View
                                                        </Button> */}
                                                        <Button variant="outlined" size="small" color="#063455" onClick={() => handleShowHistory(booking)} title="Order History" sx={{ textTransform: 'none', color: '#063455' }}>
                                                            Orders
                                                        </Button>
                                                    </Box>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={16} align="center" sx={{ py: 4, color: '#7F7F7F' }}>
                                                No bookings found
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
                    </Box>
                </LocalizationProvider>
            </div>

            <BookingInvoiceModal open={showInvoiceModal} onClose={() => setShowInvoiceModal(false)} bookingId={selectedBooking?.id} type="CHECK_IN" />

            {/* View Documents Modal */}
            <ViewDocumentsModal open={showDocsModal} onClose={handleCloseDocs} bookingId={selectedBookingForDocs?.id} />

            {/* Room Order History Modal */}
            <RoomOrderHistoryModal
                open={showHistoryModal}
                onClose={() => {
                    setShowHistoryModal(false);
                    setSelectedBookingForHistory(null);
                }}
                bookingId={selectedBookingForHistory?.id}
            />
        </>
    );
};

export default RoomCheckIn;
