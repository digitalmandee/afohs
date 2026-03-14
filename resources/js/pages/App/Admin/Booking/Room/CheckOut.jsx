import React, { useState } from 'react';
import RoomBookingFilter from '../BookingFilter';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import { usePage, router } from '@inertiajs/react';
import { Box, Typography, Paper, Table, TableBody, TableCell, Tooltip, TableContainer, TableHead, TableRow, TableFooter, Button, TextField, InputAdornment, createTheme, ThemeProvider } from '@mui/material';
import { Search, Visibility, Edit } from '@mui/icons-material';
import 'bootstrap/dist/css/bootstrap.min.css';
import { styled } from '@mui/material/styles';
import { generateInvoiceContent, JSONParse } from '@/helpers/generateTemplate';
import BookingInvoiceModal from '@/components/App/Rooms/BookingInvoiceModal';
import ViewDocumentsModal from '@/components/App/Rooms/ViewDocumentsModal';
import RoomOrderHistoryModal from '@/components/App/Rooms/RoomOrderHistoryModal';
import { FaEdit } from 'react-icons/fa';

const RoomCheckOut = ({ bookings, filters }) => {
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
    //         route('rooms.checkout'),
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
    //     router.get(route('rooms.checkout'), {}, { preserveState: true, preserveScroll: true });
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
                                Room CheckOut
                            </Typography>
                        </Box>
                        <Typography style={{ color: '#063455', fontSize: '15px', fontWeight: '600' }}>Finalize bills, log checkout times, and free up room availability</Typography>

                        {/* Filter Section */}
                        {/* Filter Section */}
                        <RoomBookingFilter routeName="rooms.checkout" showStatus={false} showRoomType={true} showDates={{ booking: false, checkIn: true, checkOut: true }} dateLabels={{ checkIn: 'Check-In Date', checkOut: 'Check-Out Date' }} dateMode={{ checkIn: 'single', checkOut: 'single' }} />

                        <TableContainer sx={{ marginTop: '20px' }} component={Paper} style={{ boxShadow: 'none', overflowX: 'auto', borderRadius: '16px' }}>
                            <Table>
                                <TableHead>
                                    <TableRow style={{ backgroundColor: '#063455', height: '30px' }}>
                                        <TableCell sx={{ fontWeight: 600, color: '#fff', whiteSpace: 'nowrap' }}>ID</TableCell>
                                        <TableCell sx={{ fontWeight: 600, color: '#fff', whiteSpace: 'nowrap' }}>Date</TableCell>
                                        {/* <TableCell sx={{ fontWeight: 600, color: '#fff', whiteSpace: 'nowrap' }}>Check-In</TableCell>
                                        <TableCell sx={{ fontWeight: 600, color: '#fff', whiteSpace: 'nowrap' }}>Check-Out</TableCell> */}
                                        <TableCell sx={{ fontWeight: 600, color: '#fff', whiteSpace: 'nowrap' }}>Member / Guest</TableCell>
                                        <TableCell sx={{ fontWeight: 600, color: '#fff', whiteSpace: 'nowrap' }}>Membership No</TableCell>
                                        <TableCell sx={{ fontWeight: 600, color: '#fff', whiteSpace: 'nowrap' }}>Member Type</TableCell>
                                        <TableCell sx={{ fontWeight: 600, color: '#fff', whiteSpace: 'nowrap' }}>Room</TableCell>

                                        <TableCell sx={{ fontWeight: 600, color: '#fff', whiteSpace: 'nowrap' }}>Rent</TableCell>
                                        <TableCell sx={{ fontWeight: 600, color: '#fff', whiteSpace: 'nowrap' }}>Nights</TableCell>
                                        <TableCell sx={{ fontWeight: 600, color: '#fff', whiteSpace: 'nowrap' }}>Room Charges</TableCell>

                                        <TableCell sx={{ fontWeight: 600, color: '#fff', whiteSpace: 'nowrap' }}>Other Charges</TableCell>
                                        <TableCell sx={{ fontWeight: 600, color: '#fff', whiteSpace: 'nowrap' }}>Food Bill</TableCell>

                                        <TableCell sx={{ fontWeight: 600, color: '#fff', whiteSpace: 'nowrap' }}>Advance</TableCell>
                                        <TableCell sx={{ fontWeight: 600, color: '#fff', whiteSpace: 'nowrap' }}>Discount</TableCell>

                                        <TableCell sx={{ fontWeight: 600, color: '#fff', whiteSpace: 'nowrap' }}>Inv Total</TableCell>
                                        <TableCell sx={{ fontWeight: 600, color: '#fff', whiteSpace: 'nowrap' }}>Paid</TableCell>
                                        <TableCell sx={{ fontWeight: 600, color: '#fff', whiteSpace: 'nowrap' }}>Payment Account</TableCell>
                                        <TableCell sx={{ fontWeight: 600, color: '#fff', whiteSpace: 'nowrap' }}>Balance</TableCell>

                                        <TableCell sx={{ fontWeight: 600, color: '#fff', whiteSpace: 'nowrap' }}>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {bookings.data && bookings.data.length > 0 ? (
                                        bookings.data.map((booking) => {
                                            const roomCharge = parseFloat(booking.room_charge || 0);
                                            const otherCharges = parseFloat(booking.other_charges_sum_amount || 0) + parseFloat(booking.mini_bar_items_sum_amount || 0);
                                            const foodBill = (booking.orders || []).reduce((sum, order) => sum + parseFloat(order.total_price || 0), 0);
                                            const advance = parseFloat(booking.advance_amount || 0);
                                            const discount = parseFloat(booking.discount_value || 0);
                                            const paidOrdersSum = (booking.orders || []).filter((o) => o.payment_status === 'paid').reduce((sum, order) => sum + parseFloat(order.total_price || 0), 0);

                                            const invoiceTotal = parseFloat(booking.grand_total || 0) + foodBill;
                                            const paid = parseFloat(booking.invoice?.paid_amount || 0) + paidOrdersSum;
                                            const balance = Math.max(0, invoiceTotal - paid);

                                            const memberType = booking.member ? 'Member' : booking.corporateMember || booking.corporate_member ? 'Corporate' : booking.customer ? 'Guest' : booking.employee ? 'Employee' : 'Unknown';
                                            const membershipNo = booking.member
                                                ? booking.member.membership_no
                                                : booking.corporateMember || booking.corporate_member
                                                  ? (booking.corporateMember || booking.corporate_member).membership_no
                                                  : booking.customer
                                                    ? booking.customer.customer_no
                                                    : booking.employee
                                                      ? booking.employee.employee_id || booking.employee.employee_no || booking.employee.id
                                                      : '-';

                                            return (
                                                <TableRow key={booking.id} style={{ borderBottom: '1px solid #eee' }}>
                                                    <TableCell sx={{ color: '#000', fontWeight: 600, fontSize: '13px', whiteSpace: 'nowrap' }}>{booking.id}</TableCell>
                                                    <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '13px', whiteSpace: 'nowrap' }}>{booking.booking_date ? dayjs(booking.booking_date).format('DD-MM-YYYY') : ''}</TableCell>
                                                    {/* <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px', whiteSpace: 'nowrap' }}>{booking.check_in_date ? dayjs(booking.check_in_date).format('DD-MM-YYYY') : ''}</TableCell>
                                                    <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px', whiteSpace: 'nowrap' }}>{booking.check_out_date ? dayjs(booking.check_out_date).format('DD-MM-YYYY') : ''}</TableCell> */}

                                                    <TableCell
                                                        sx={{
                                                            color: '#7F7F7F',
                                                            fontWeight: 400,
                                                            fontSize: '13px',
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
                                                    <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '13px', whiteSpace: 'nowrap' }}>{membershipNo || '-'}</TableCell>
                                                    <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '13px', whiteSpace: 'nowrap' }}>{memberType}</TableCell>
                                                    <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '13px', whiteSpace: 'nowrap' }}>{booking.room?.name}</TableCell>

                                                    <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '13px', whiteSpace: 'nowrap' }}>{Math.round(booking.per_day_charge)}</TableCell>
                                                    <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '13px', whiteSpace: 'nowrap' }}>{booking.nights || 1}</TableCell>
                                                    <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '13px', whiteSpace: 'nowrap' }}>{Math.round(roomCharge)}</TableCell>

                                                    <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '13px', whiteSpace: 'nowrap' }}>{Math.round(booking.total_other_charges)}</TableCell>
                                                    <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '13px', whiteSpace: 'nowrap' }}>{Math.round(foodBill)}</TableCell>

                                                    <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '13px', whiteSpace: 'nowrap' }}>{Math.round(advance)}</TableCell>
                                                    <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '13px', whiteSpace: 'nowrap' }}>{Math.round(discount)}</TableCell>

                                                    <TableCell sx={{ color: '#000', fontWeight: 600, fontSize: '13px', whiteSpace: 'nowrap' }}>{Math.round(invoiceTotal)}</TableCell>
                                                    <TableCell sx={{ color: 'green', fontWeight: 600, fontSize: '13px', whiteSpace: 'nowrap' }}>{Math.round(paid)}</TableCell>
                                                    <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '13px', whiteSpace: 'nowrap' }}>{booking.invoice?.payment_account || booking.invoice?.data?.payment_account || '-'}</TableCell>
                                                    <TableCell sx={{ color: 'red', fontWeight: 600, fontSize: '13px', whiteSpace: 'nowrap' }}>{Math.round(balance)}</TableCell>

                                                    <TableCell>
                                                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                                            <Button size="small" onClick={() => handleShowDocs(booking)} title="View Documents" sx={{ minWidth: 'auto', p: '4px', color: '#063455' }}>
                                                                <Visibility fontSize="small" />
                                                            </Button>
                                                            <Button size="small" onClick={() => router.visit(route('rooms.edit.booking', { id: booking.id }))} title="Edit Booking" sx={{ minWidth: 'auto', color: '#f57c00' }}>
                                                                <FaEdit size={18} />
                                                            </Button>
                                                            <Button variant="outlined" size="small" color="#063455" onClick={() => handleOpenInvoice(booking)} sx={{ textTransform: 'none', color: '#063455' }}>
                                                                View
                                                            </Button>
                                                            <Button variant="outlined" size="small" color="#063455" onClick={() => handleShowHistory(booking)} title="Order History" sx={{ textTransform: 'none', color: '#063455' }}>
                                                                Orders
                                                            </Button>
                                                        </Box>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={18} align="center" sx={{ py: 4, color: '#7F7F7F' }}>
                                                No bookings found
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                                <TableFooter>
                                    <TableRow style={{ backgroundColor: '#f0f0f0' }}>
                                        <TableCell colSpan={7} sx={{ fontWeight: 'bold' }}>
                                            Grand Total
                                        </TableCell>
                                        {/* Nights Total */}
                                        <TableCell sx={{ fontWeight: 'bold' }}>{Math.round(bookings.data.reduce((sum, b) => sum + (b.nights || 1), 0))}</TableCell>
                                        {/* Room Charges Total */}
                                        <TableCell sx={{ fontWeight: 'bold' }}>{Math.round(bookings.data.reduce((sum, b) => sum + parseFloat(b.room_charge || 0), 0))}</TableCell>
                                        {/* Other Charges Total */}
                                        <TableCell sx={{ fontWeight: 'bold' }}>{Math.round(bookings.data.reduce((sum, b) => sum + (parseFloat(b.other_charges_sum_amount || 0) + parseFloat(b.mini_bar_items_sum_amount || 0)), 0))}</TableCell>
                                        {/* Food Bill Total */}
                                        <TableCell sx={{ fontWeight: 'bold' }}>{Math.round(bookings.data.reduce((sum, b) => sum + (b.orders || []).reduce((s, o) => s + parseFloat(o.total_price || 0), 0), 0))}</TableCell>
                                        {/* Advance Total */}
                                        <TableCell sx={{ fontWeight: 'bold' }}>{Math.round(bookings.data.reduce((sum, b) => sum + parseFloat(b.advance_amount || 0), 0))}</TableCell>
                                        {/* Discount Total */}
                                        <TableCell sx={{ fontWeight: 'bold' }}>{Math.round(bookings.data.reduce((sum, b) => sum + parseFloat(b.discount_value || 0), 0))}</TableCell>
                                        {/* Inv Total Total */}
                                        <TableCell sx={{ fontWeight: 'bold' }}>
                                            {Math.round(
                                                bookings.data.reduce((sum, b) => {
                                                    const fb = (b.orders || []).reduce((s, o) => s + parseFloat(o.total_price || 0), 0);
                                                    return sum + parseFloat(b.grand_total || 0) + fb;
                                                }, 0),
                                            )}
                                        </TableCell>
                                        {/* Paid Total */}
                                        <TableCell sx={{ fontWeight: 'bold', color: 'green' }}>
                                            {Math.round(
                                                bookings.data.reduce((sum, b) => {
                                                    const paidOrders = (b.orders || []).filter((o) => o.payment_status === 'paid').reduce((s, o) => s + parseFloat(o.total_price || 0), 0);
                                                    return sum + parseFloat(b.invoice?.paid_amount || 0) + paidOrders;
                                                }, 0),
                                            )}
                                        </TableCell>
                                        <TableCell />
                                        {/* Balance Total */}
                                        <TableCell sx={{ fontWeight: 'bold', color: 'red' }}>
                                            {Math.round(
                                                bookings.data.reduce((sum, b) => {
                                                    const paidOrdersSum = (b.orders || []).filter((o) => o.payment_status === 'paid').reduce((s, o) => s + parseFloat(o.total_price || 0), 0);
                                                    const pd = parseFloat(b.invoice?.paid_amount || 0) + paidOrdersSum;
                                                    const fb = (b.orders || []).reduce((s, o) => s + parseFloat(o.total_price || 0), 0);
                                                    return sum + Math.max(0, parseFloat(b.grand_total || 0) + fb - pd);
                                                }, 0),
                                            )}
                                        </TableCell>
                                        <TableCell />
                                    </TableRow>
                                </TableFooter>
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

            <BookingInvoiceModal open={showInvoiceModal} onClose={() => setShowInvoiceModal(false)} bookingId={selectedBooking?.id} type="CHECK_OUT" />

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

export default RoomCheckOut;
