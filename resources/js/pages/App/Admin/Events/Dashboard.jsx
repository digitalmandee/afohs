import React, { useEffect, useRef, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Container, Row, Button, Form, Badge, Card, Col, Modal } from 'react-bootstrap'; // Added Modal import for popup
import { Search, FilterAlt, Add, CalendarMonth } from '@mui/icons-material';
import { ThemeProvider, createTheme, Box, Typography, FormControl, InputLabel, Select, MenuItem, Popper } from '@mui/material';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import { router } from '@inertiajs/react';
import DatePicker from 'react-multi-date-picker';
import { DateObject } from 'react-multi-date-picker';
import axios from 'axios';
import dayjs from 'dayjs';
import { DateRange, DateRangePicker } from 'react-date-range';
import 'react-date-range/dist/styles.css'; // main css file
import 'react-date-range/dist/theme/default.css'; // theme css file
import { addDays, format } from 'date-fns';


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
  box-shadow: 0 5px 15px rgba(0, 0,0, 0.3);
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.custom-dialog-right .modal-content::-webkit-scrollbar {
  display: none;
}
.dialog-top-right {
  position: fixed !important;
  top: 20px !important;
  right: 20px !important;
  margin: 0 !important;
  transform: none !important;
  height: auto;
  max-height: calc(100vh - 40px);
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
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.dialog-top-right .modal-content::-webkit-scrollbar {
  display: none;
}

@media (max-width: 600px) {
  .dialog-top-right .modal-dialog {
    width: 90% !important;
    max-width: 90% !important;
  }
}
`;

// TODO: Remove invoice popup logic and revert to original handlePrintReceipt after testing
const generateInvoiceContent = (booking) => {
    if (!booking) return '';

    return `<!doctype html>
<html>
    <head>
        <title>Booking Invoice</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                padding: 20px;
                max-width: 930px;
                margin: 0 auto;
            }
            .container {
                margin-top: 16px;

            }
            .paper {
                border-radius: 4px;
                position: relative;
                overflow: hidden;
            }
            .grid-container {
                display: flex;
                flex-wrap: wrap;
                margin-bottom: 32px;
                padding-bottom: 16px;
                border-bottom: 1px solid #f0f0f0;
            }
            .grid-item-left {
                flex: 0 0 33.33%;
                display: flex;
                align-items: center;
            }
            .grid-item-center {
                flex: 0 0 33.33%;
                text-align: center;
            }
            .logo {
                height: 60px;
            }
            .typography-h6 {
                font-size: 18px;
                font-weight: bold;
            }
            .typography-body3 {
                font-size: 12px;
                color: #555;
                line-height: 1.4;
            }
            .typography-body2 {
                font-size: 12px;
                color: #555;
                line-height: 0.6;
            }
            .typography-body2-bold {
                font-size: 13px;
                font-weight: bold;
            }
            .subtitle1 {
                font-size: 14px;
                font-weight: bold;
                margin-bottom: 12px;
            }
            .summary-container {
                display: flex;
                justify-content: flex-end;
                margin-bottom: 24px;
            }
            .summary-box {
                width: 33.33%;
                padding-top: 8px;
            }
            .summary-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 16px;
                border-bottom: 1px solid #eee;
            }
            .notes-container {
                display: flex;
                gap: 16px;
                margin-bottom: 24px;
            }
            .notes-item {
                flex: 0 0 50%;
            }
            .amount-in-words {
                font-size: 13px;
                font-weight: bold;
                margin-top: 4px;
                text-transform: uppercase;
            }
            .two-column {
                display: flex;
                flex-wrap: wrap;
                gap: 16px;
            }
            .two-column > div {
                flex: 0 0 48%;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="paper">
                <!-- Header -->
                <div class="grid-container">
                    <div class="grid-item-left">
                        <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/1c95d02f2c4a986d4f386920c76ff57c18c81985-YeMq5tNsLWF62HBaZY1Gz1HsT7RyLX.png" alt="Afohs Club Logo" class="logo" />
                    </div>
                    <div class="grid-item-center">
                        <div class="typography-h6" style="color: #063455">Afohs Club</div>
                        <div class="typography-body3">
                            PAF Falcon complex, Gulberg III,<br />
                            Lahore, Pakistan
                        </div>
                    </div>
                    <div class="grid-item-center"><div class="typography-h6" style="color: #333; margin-top: 20px">${(booking.booking_type || 'Booking').charAt(0).toUpperCase() + (booking.booking_type || 'Booking').slice(1)} Booking</div></div>
                </div>

                <!-- Bill To Section -->
                <div style="margin-bottom: 20px">
                    <div class="subtitle1">Bill To - #${booking.booking_no || 'N/A'}</div>
                    <div class="two-column">
                        <div class="typography-body2"><span style="font-weight: bold">Guest Name: </span>${booking.customer?.first_name || 'N/A'}</div>
                        <div class="typography-body2"><span style="font-weight: bold">Membership ID: </span>${booking.customer?.member?.membership_no || 'N/A'}</div>
                        <div class="typography-body2"><span style="font-weight: bold">Phone Number: </span>${booking.customer?.phone_number || 'N/A'}</div>
                        <div class="typography-body2"><span style="font-weight: bold">Email: </span>${booking.customer?.email || 'N/A'}</div>
                    </div>
                </div>

                <!-- Booking Details Section -->
                <div style="margin-bottom: 2px">
                    <div class="subtitle1">Booking Details</div>
                    <div class="two-column">
                        <div class="typography-body2"><span style="font-weight: bold">Booking ID: </span>#${booking.booking_no ? booking.booking_no.padStart(6, '0') : 'N/A'}</div>
                        <div class="typography-body2"><span style="font-weight: bold">Booking For: </span>${(booking.booking_For || 'N/A').replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())}</div>
                        <div class="typography-body2"><span style="font-weight: bold">Issue Date: </span>${booking.booking_date ? dayjs(booking.created_at).format('MMMM D, YYYY') : 'N/A'}</div>
                        <div class="typography-body2"><span style="font-weight: bold">Booking Type: </span>${booking.booking_type || 'N/A'}</div>
                        <div class="typography-body2"><span style="font-weight: bold">Room Name: </span>${booking.room?.name || 'N/A'}</div>
                        <div class="typography-body2"><span style="font-weight: bold">Max Capacity: </span>${booking.typeable?.max_capacity || 'N/A'}</div>
                        <div class="typography-body2"><span style="font-weight: bold">Number of Beds: </span>${booking.room?.number_of_beds || 'N/A'}</div>
                        <div class="typography-body2"><span style="font-weight: bold">No of Bathrooms: </span>${booking.room?.number_of_bathrooms}</div>
                        <div class="typography-body2"><span style="font-weight: bold">Check-in: </span>${booking.check_in_date ? dayjs(booking.check_in_date).format('MMMM D, YYYY') : 'N/A'}</div>
                        <div class="typography-body2"><span style="font-weight: bold">Check-out: </span>${booking.check_out_date ? dayjs(booking.check_out_date).format('MMMM D, YYYY') : 'N/A'}</div>
                        <div class="typography-body2"><span style="font-weight: bold">Guests: </span>${booking.persons || 'N/A'}</div>
                        <div class="typography-body2"><span style="font-weight: bold">Status: </span>${booking.status || 'N/A'}</div>
                    </div>
                </div>

                <!-- Summary and Notes sections remain unchanged -->
                 <div class="summary-container">
            <div class="summary-box">
                <div class="summary-row">
                    <span class="typography-body2-bold">Total Amount</span>
                    <span class="typography-body2">Rs ${booking.grand_total || '0'}</span>
                </div>
                <div class="summary-row">
                    <span class="typography-body2-bold">Balance Due</span>
                    <span class="typography-body2">Rs ${booking.remaining_amount || '0'}</span>
                </div>
                <div class="summary-row">
                    <span class="typography-body2-bold">Amount Paid</span>
                    <span class="typography-body2">Rs ${booking.paid_amount || booking.total_payment || '0'}</span>
                </div>
            </div>
        </div>

        <div class="notes-container">
            <div class="notes-item">
                <div class="typography-body2-bold" style="margin-bottom: 4px">Note:</div>
                <div class="typography-body3">This is a computer-generated receipt. It does not require any signature or stamp.</div>
                <div style="margin-top: 16px">
                    <div class="typography-body2-bold" style="margin-bottom: 4px">Sent By: Admin</div>
                </div>
            </div>
            <div class="notes-item">
                <div class="amount-in-words">AMOUNT IN WORDS: ${numberToWords(booking.grand_total || 0)} RUPEES ONLY</div>
            </div>
            </div>
        </div>
    </body>
</html>
`;
};

// TODO: Remove this utility function when reverting to original print functionality
const numberToWords = (num) => {
    const units = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE'];
    const teens = ['TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'];
    const tens = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];
    const thousands = ['', 'THOUSAND', 'MILLION', 'BILLION'];

    if (num === 0) return 'ZERO';
    let word = '';
    let i = 0;

    while (num > 0) {
        let chunk = num % 1000;
        if (chunk) {
            let chunkWord = '';
            if (chunk >= 100) {
                chunkWord += units[Math.floor(chunk / 100)] + ' HUNDRED ';
                chunk %= 100;
            }
            if (chunk >= 20) {
                chunkWord += tens[Math.floor(chunk / 10)] + ' ';
                chunk %= 10;
            }
            if (chunk >= 10) {
                chunkWord += teens[chunk - 10] + ' ';
            } else if (chunk > 0) {
                chunkWord += units[chunk] + ' ';
            }
            word = chunkWord + thousands[i] + (word ? ' ' : '') + word;
        }
        num = Math.floor(num / 1000);
        i++;
    }
    return word.trim();
};

const EventBookingDashboard = ({ data, roomTypes }) => {
    // const [open, setOpen] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
    const [showFilter, setShowFilter] = useState(false);
    const [loading, setLoading] = useState(false);
    const [searchResultsFilter, setSearchResultsFilter] = useState(false);
    const [adults, setAdults] = useState(2);
    const [checkin, setCheckIn] = useState('');
    const [checkout, setCheckOut] = useState('');
    const [bookingType, setBookingType] = useState('room');
    const [searchResults, setSearchResults] = useState([]);
    // TODO: Remove invoice modal state when reverting to original print functionality
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    // TODO: Remove selected booking state when reverting to original print functionality
    const [selectedBooking, setSelectedBooking] = useState(null);

    const handleOpenBookingModal = () => {
        setShowAvailabilityModal(true);
    };

    const handleFilterShow = () => setShowFilter(true);

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

    const handleSearch = async (searchParams) => {
        setLoading(true);
        try {
            const response = await axios.get(route('rooms.booking.search'), {
                params: searchParams,
            });
            setBookingType(searchParams.bookingType);
            console.log(searchParams.checkin, searchParams.checkout);

            setCheckIn(searchParams.checkin);
            setCheckOut(searchParams.checkout);
            setSearchResultsFilter(true);
            setSearchResults(response.data);
        } catch (error) {
            console.error('Error fetching search results', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* <SideNav open={open} setOpen={setOpen} /> */}
            <div
                style={{
                    minHeight:'100vh',
                    backgroundColor:'#f5f5f5'
                }}
            >
                <ThemeProvider theme={theme}>
                    <style>{dialogStyles}</style>
                    <Container fluid className="p-4 bg-light">
                        <Box className="mb-4 d-flex justify-content-between align-items-center">
                            <Typography style={{ color: '#063455', fontWeight: 500, fontSize: '30px' }}>Dashboard</Typography>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <Button
                                    variant="outlined"
                                    startIcon={<CalendarMonth />}
                                    style={{
                                        border: '1px solid #063455',
                                        color: '#333',
                                        bgcolor: 'white',
                                        '&:hover': {
                                            border: '1px solid #063455',
                                            bgcolor: '#FFFFFF',
                                        },
                                    }}
                                    onClick={() => router.visit(route('events.calendar'))}
                                >
                                    Event Calendar
                                </Button>
                                <Button
                                    variant="outlined"
                                    startIcon={<Add />}
                                    style={{
                                        border: '1px solid #063455',
                                        color: '#333',
                                        bgcolor: 'white',
                                        '&:hover': {
                                            border: '1px solid #063455',
                                            bgcolor: '#FFFFFF',
                                        },
                                    }}
                                    onClick={() => router.visit(route('events.booking.create'))}
                                >
                                    Create Booking
                                </Button>
                            </Box>
                        </Box>

                        <Row className="mb-4">
                            <Col md={6}>
                                <Card
                                    style={{
                                        backgroundColor: '#063455',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '2px',
                                        height: '150px',
                                    }}
                                >
                                    <Card.Body
                                        className="p-4"
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            height: '100%',
                                        }}
                                    >
                                        <Box className="d-flex align-items-center gap-3">
                                            <Box
                                                sx={{
                                                    backgroundColor: '#202728',
                                                    borderRadius: '50%',
                                                    width: 60,
                                                    height: 60,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                }}
                                            >
                                                <img
                                                    src="/assets/Frame.png"
                                                    alt=""
                                                    style={{
                                                        width: '35px',
                                                        height: '35px',
                                                    }}
                                                />
                                            </Box>
                                            <Box>
                                                <Typography sx={{ color: '#C6C6C6', fontSize: '14px' }}>Total Booking</Typography>
                                                <Typography sx={{ fontSize: '24px' }} className="m-0">
                                                    {data?.totalBookings || 0}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Card.Body>
                                </Card>
                            </Col>

                            <Col md={6}>
                                <Card
                                    style={{
                                        backgroundColor: '#063455',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '2px',
                                        height: '150px',
                                    }}
                                >
                                    <Card.Body
                                        className="px-3 py-2"
                                        style={{
                                            height: '100%',
                                        }}
                                    >
                                        <Box className="d-flex align-items-center gap-3">
                                            <Box
                                                sx={{
                                                    backgroundColor: '#202728',
                                                    borderRadius: '50%',
                                                    width: '45px',
                                                    height: '45px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                }}
                                            >
                                                <img
                                                    src="/assets/receipt2.png"
                                                    alt=""
                                                    style={{
                                                        width: '25px',
                                                        height: '25px',
                                                    }}
                                                />
                                            </Box>
                                            <Box>
                                                <Typography sx={{ color: '#C6C6C6', fontSize: '14px' }}>Total Event Booking</Typography>
                                                <Typography sx={{ fontSize: '24px' }} className="m-0">
                                                    {data?.totalRoomBookings || 0}
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <hr className="border-top mt-2" />
                                        <Row>
                                            <Col>
                                                <Typography sx={{ color: '#C6C6C6', fontSize: '12px' }}>Available Events</Typography>
                                                <Typography variant="h6">{data?.availableRoomsToday || 0}</Typography>
                                            </Col>
                                            <Col>
                                                <Typography sx={{ color: '#C6C6C6', fontSize: '12px' }}>Total Events</Typography>
                                                <Typography variant="h6">{data?.totalRooms || 0}</Typography>
                                            </Col>
                                        </Row>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>

                        {/* TODO: Remove invoice modal when reverting to original print functionality */}
                        <Modal show={showInvoiceModal} onHide={handleCloseInvoice} className="custom-dialog-right" size="lg" aria-labelledby="invoice-modal-title">
                            <Modal.Body>
                                <div dangerouslySetInnerHTML={{ __html: selectedBooking ? generateInvoiceContent(selectedBooking) : '' }} />
                            </Modal.Body>
                            <Modal.Footer>
                                <Button variant="secondary" onClick={handleCloseInvoice}>
                                    Close
                                </Button>
                                {/* TODO: Optional - Keep print button if needed during testing */}
                                <Button
                                    style={{ backgroundColor: '#063455', color: 'white' }}
                                    onClick={() => {
                                        const printWindow = window.open('', '_blank');
                                        printWindow.document.write(`${generateInvoiceContent(selectedBooking)}`);
                                        printWindow.document.close();
                                        printWindow.focus();
                                        setTimeout(() => {
                                            printWindow.print();
                                            printWindow.close();
                                        }, 250);
                                    }}
                                >
                                    Print
                                </Button>
                            </Modal.Footer>
                        </Modal>

                        {loading && (
                            <div className="p-4">
                                <Typography>Loading...</Typography>
                            </div>
                        )}

                        {!loading && !searchResultsFilter && (
                            <>
                                <Row className="mb-3 align-items-center">
                                    <Col>
                                        <Typography variant="h6" component="h2" style={{ color: '#000000', fontWeight: 500, fontSize: '24px' }}>
                                            Recently Booking
                                        </Typography>
                                    </Col>
                                    <Col xs="auto" className="d-flex gap-3">
                                        <div style={{ position: 'relative', width: '400px', border: '1px solid #121212' }}>
                                            <Form.Control
                                                placeholder="Search"
                                                aria-label="Search"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                style={{
                                                    paddingLeft: '2rem',
                                                    borderColor: '#ced4da',
                                                    borderRadius: '4px',
                                                    height: '38px',
                                                    fontSize: '0.9rem',
                                                }}
                                            />
                                            <Search
                                                style={{
                                                    position: 'absolute',
                                                    left: '8px',
                                                    top: '53%',
                                                    transform: 'translateY(-50%)',
                                                    color: '#adb5bd',
                                                    fontSize: '1.5rem',
                                                    pointerEvents: 'none',
                                                }}
                                            />
                                        </div>
                                        <Button
                                            variant="outline-secondary"
                                            className="d-flex align-items-center gap-1"
                                            style={{
                                                border: '1px solid #063455',
                                                borderRadius: '0px',
                                                backgroundColor: 'transparent',
                                                color: '#495057',
                                            }}
                                            onClick={handleFilterShow}
                                        >
                                            <FilterAlt fontSize="small" /> Filter
                                        </Button>
                                    </Col>
                                </Row>

                                {!searchResultsFilter && data.bookingsData.length > 0 ? (
                                    data.bookingsData.map((booking, index) => {
                                        const durationInDays = dayjs(booking.check_in_date).diff(dayjs(booking.check_out_date), 'day');

                                        return (
                                            <Card key={index} className="mb-2" style={{ border: '1px solid #e0e0e0', cursor: 'pointer' }} onClick={() => handleShowInvoice(booking)}>
                                                <Card.Body className="p-2">
                                                    <Row>
                                                        <Col md={2} className="d-flex justify-content-center">
                                                            <img
                                                                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-IuCtZ2a4wrWMZXu6pYSfLcMMwigfuK.png"
                                                                alt={booking.type}
                                                                style={{
                                                                    width: '100%',
                                                                    objectFit: 'cover',
                                                                }}
                                                            />
                                                        </Col>
                                                        <Col md={10}>
                                                            <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap">
                                                                <div>
                                                                    <Typography style={{ fontWeight: 500, fontSize: '20px', color: '#121212' }}>{booking.booking_type ? booking.booking_type.charAt(0).toUpperCase() + booking.booking_type.slice(1) : 'Booking'}</Typography>
                                                                    <Typography variant="body2" style={{ color: '#7F7F7F', fontSize: '14px', fontWeight: 400 }}>
                                                                        Created on {booking.booking_date}
                                                                    </Typography>
                                                                </div>
                                                                <Badge
                                                                    onClick={() => router.visit(route('rooms.dashboard'))}
                                                                    bg=""
                                                                    style={{
                                                                        backgroundColor: booking.status === 'confirmed' ? '#0e5f3c' : '#842029',
                                                                        color: 'white',
                                                                        padding: '6px 14px',
                                                                        borderRadius: '6px',
                                                                        fontSize: '0.85rem',
                                                                        fontWeight: 500,
                                                                        minWidth: '100px',
                                                                        textAlign: 'center',
                                                                        cursor: 'pointer',
                                                                    }}
                                                                >
                                                                    {booking.status}
                                                                </Badge>
                                                            </div>
                                                            <Row className="text-start mt-2">
                                                                <Col md={3} sm={6} className="mb-2">
                                                                    <Typography variant="body2" style={{ color: '#7F7F7F', fontSize: '12px' }}>
                                                                        Booking ID
                                                                    </Typography>
                                                                    <Typography variant="body1" style={{ fontWeight: 400, color: '#121212', fontSize: '12px' }}>
                                                                        # {booking.booking_no}
                                                                    </Typography>
                                                                </Col>
                                                                <Col md={4} sm={6} className="mb-2">
                                                                    <Typography variant="body2" style={{ color: '#7F7F7F', fontSize: '12px' }}>
                                                                        Duration
                                                                    </Typography>
                                                                    <Typography variant="body1" style={{ fontWeight: 400, color: '#121212', fontSize: '12px' }}>
                                                                        {durationInDays}
                                                                    </Typography>
                                                                </Col>
                                                                <Col md={2} sm={6} className="mb-2">
                                                                    <Typography variant="body2" style={{ color: '#7F7F7F', fontSize: '12px' }}>
                                                                        Room
                                                                    </Typography>
                                                                    <Typography variant="body1" style={{ fontWeight: 400, color: '#121212', fontSize: '12px' }}>
                                                                        {booking.room?.name}
                                                                    </Typography>
                                                                </Col>
                                                                <Col md={2} sm={6} className="mb-2">
                                                                    <Typography variant="body2" style={{ color: '#7F7F7F', fontSize: '12px' }}>
                                                                        {booking.booking_type === 'room' ? 'Price Per Night' : 'Price Per Person'}
                                                                    </Typography>
                                                                    <Typography variant="body1" style={{ fontWeight: 400, color: '#121212', fontSize: '12px' }}>
                                                                        {booking.per_day_charge}
                                                                    </Typography>
                                                                </Col>
                                                                <Col md={2} sm={6} className="mb-2">
                                                                    <Typography variant="body2" style={{ color: '#7F7F7F', fontSize: '12px' }}>
                                                                        Total Payment
                                                                    </Typography>
                                                                    <Typography variant="body1" style={{ fontWeight: 400, color: '#121212', fontSize: '12px' }}>
                                                                        {booking.grand_total}
                                                                    </Typography>
                                                                </Col>
                                                                <Col md={2} sm={6} className="mb-2">
                                                                    <Typography variant="body2" style={{ color: '#7F7F7F', fontSize: '12px' }}>
                                                                        Adults
                                                                    </Typography>
                                                                    <Typography variant="body1" style={{ fontWeight: 400, color: '#121212', fontSize: '12px' }}>
                                                                        {booking.persons}
                                                                    </Typography>
                                                                </Col>
                                                            </Row>
                                                        </Col>
                                                    </Row>
                                                </Card.Body>
                                            </Card>
                                        );
                                    })
                                ) : (
                                    <Typography>No bookings found for the selected criteria.</Typography>
                                )}
                            </>
                        )}
                    </Container>
                </ThemeProvider>
            </div>
        </>
    );
};

export default EventBookingDashboard;
