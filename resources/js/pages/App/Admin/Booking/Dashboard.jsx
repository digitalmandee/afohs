import React, { useEffect, useRef, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Container, Row, Button, Form, Badge, Card, Col, Modal } from 'react-bootstrap'; // Added Modal import for popup
import { Search, FilterAlt } from '@mui/icons-material';
import { ThemeProvider, createTheme, Box, Typography, FormControl, InputLabel, Select, MenuItem, Popper } from '@mui/material';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import { router } from '@inertiajs/react';
import AvailableRooms from './Rooms';
import axios from 'axios';
import dayjs from 'dayjs';
import { DateRange } from 'react-date-range';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import 'react-date-range/dist/styles.css'; // main css file
import 'react-date-range/dist/theme/default.css'; // theme css file
import { addDays, format } from 'date-fns';
import RoomCheckInModal from '@/components/App/Rooms/CheckInModal';
import BookingInvoiceModal from '@/components/App/Rooms/BookingInvoiceModal';

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

const CustomDateRangePicker = ({ onSearch, clearFilter }) => {
    const [bookingType, setBookingType] = useState('room');
    const [filterApplied, setFilterApplied] = useState(false);
    const [errors, setErrors] = useState({
        date: '',
    });

    const [open, setOpen] = useState(false);
    const anchorRef = useRef(null);
    const popperRef = useRef(null);

    const [range, setRange] = useState([
        {
            startDate: null,
            endDate: null,
            key: 'selection',
        },
    ]);

    const handleClick = () => setOpen((prev) => !prev);

    const handleClickAway = (event) => {
        if (popperRef.current && !popperRef.current.contains(event.target) && anchorRef.current && !anchorRef.current.contains(event.target)) {
            setOpen(false);
        }
    };

    useEffect(() => {
        document.addEventListener('mousedown', handleClickAway);
        return () => document.removeEventListener('mousedown', handleClickAway);
    }, []);

    const handleSearch = () => {
        const checkin = range[0]?.startDate;
        const checkout = range[0]?.endDate;

        const newErrors = {
            date: '',
        };

        let hasError = false;

        if (!checkin || !checkout) {
            newErrors.date = 'Please select both check-in and check-out dates.';
            hasError = true;
        }

        if (checkin && checkout && checkin.getTime() === checkout.getTime()) {
            newErrors.date = 'Check-out date must be after check-in date (minimum 1 night).';
            hasError = true;
        }

        setErrors(newErrors);

        if (hasError) return;

        const payload = {
            bookingType,
            checkin: checkin.toLocaleDateString('en-CA'),
            checkout: checkout.toLocaleDateString('en-CA'),
        };

        onSearch(payload);
        setFilterApplied(true);
    };

    const handleClear = () => {
        setBookingType('room');
        setErrors({ date: '' });
        // setRange([]);
        setRange([
            {
                startDate: null,
                endDate: null,
                key: 'selection',
            },
        ]);
        setFilterApplied(false);
        clearFilter(false);
        onSearch({ bookingType: 'room', checkin: '', checkout: '' });
    };

    const startDate = range[0]?.startDate;
    const endDate = range[0]?.endDate;
    const displayText = startDate && endDate ? `${format(startDate, 'dd-MM-yyyy')} — ${format(endDate, 'dd-MM-yyyy')}` : 'Check-in date — Check-out date';

    return (
        <div
            style={{
                display: 'flex',
                justifyContent: 'center', // ✅ centers horizontally
                alignItems: 'center', // ✅ centers vertically
                // height: '100vh',
                backgroundColor: '#f5f5f5', // optional nice background
            }}
        >
            <div style={{ padding: '10px', borderRadius: '4px', width: '95%' }}>
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 160px 60px',
                        alignItems: 'center',
                        border: '3px solid #063455',
                        borderRadius: '6px',
                        marginBottom: '10px',
                    }}
                >
                    {/* Calendar Range */}
                    <Box
                        style={{
                            flex: '1',
                            backgroundColor: '#fff',
                            padding: '8px 12px',
                            height: '100%',
                            borderRight: '2px solid #063455',
                        }}
                    >
                        <Box
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                justifyContent: 'center',
                            }}
                        >
                            <span>
                                <CalendarMonthIcon fontSize="medium" sx={{ color: '#063455' }} />
                            </span>
                            <div className="date-range" style={{ width: '100%' }}>
                                <Box>
                                    <Box>
                                        <Button ref={anchorRef} onClick={handleClick} variant="outlined">
                                            {displayText}
                                        </Button>
                                    </Box>

                                    {/* <Popper open={open} anchorEl={anchorRef.current} placement="bottom-start">
                                        <Box ref={popperRef} sx={{ bgcolor: 'background.paper', zIndex: 1300 }}>
                                            <DateRange editableDateInputs={true} onChange={(item) => setRange([item.selection])} moveRangeOnFirstSelection={false} ranges={range} months={2} showSelectionPreview={false} showDateDisplay={false} direction="horizontal" />
                                        </Box>
                                    </Popper> */}
                                    <Popper open={open} anchorEl={anchorRef.current} placement="bottom-start" sx={{border:'2px solid #063455', borderRadius:'16px'}}>
                                        <Box ref={popperRef} sx={{ bgcolor: 'background.paper', zIndex: 1300 }}>
                                            <DateRange
                                                editableDateInputs={true}
                                                onChange={(item) => setRange([item.selection])}
                                                // onChange={handleRangeChange}
                                                moveRangeOnFirstSelection={false}
                                                ranges={range}
                                                months={2}
                                                showSelectionPreview={false}
                                                showDateDisplay={false}
                                                direction="horizontal"
                                                minDate={addDays(new Date(), -1)}
                                            />
                                        </Box>
                                    </Popper>
                                </Box>
                            </div>
                        </Box>
                        {errors.date && (
                            <Typography color="error" variant="caption" sx={{ ml: 1, display: 'block' }}>
                                {errors.date}
                            </Typography>
                        )}
                    </Box>

                    {/* Search Button */}
                    <Button
                        style={{
                            backgroundColor: '#063455',
                            color: '#fff',
                            padding: '10px 15px',
                            borderRadius: '0px',
                            height: '100%',
                        }}
                        onClick={handleSearch}
                    >
                        Search
                    </Button>

                    {/* Clear Filter */}
                    <Button variant="danger" style={{ padding: '10px', borderRadius: '0px', height: '100%' }} onClick={handleClear}>
                        <HighlightOffIcon />
                    </Button>
                </div>
            </div>
        </div>
    );
};

const RoomBookingDashboard = ({ data, roomTypes }) => {
    // const [open, setOpen] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [searchResultsFilter, setSearchResultsFilter] = useState(false);
    const [checkin, setCheckIn] = useState('');
    const [checkout, setCheckOut] = useState('');
    const [bookingType, setBookingType] = useState('room');
    const [searchResults, setSearchResults] = useState([]);
    // TODO: Remove invoice modal state when reverting to original print functionality
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    // TODO: Remove selected booking state when reverting to original print functionality
    const [selectedBooking, setSelectedBooking] = useState(null);

    // TODO: Remove invoice modal handler when reverting to original print functionality
    const handleShowInvoice = (booking) => {
        setSelectedBooking(booking);
        setShowInvoiceModal(true);
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
            {/* <SideNav open={open} setOpen={setOpen} />
            <div
                style={{
                    marginLeft: open ? `${drawerWidthOpen}px` : `${drawerWidthClosed}px`,
                    transition: 'margin-left 0.3s ease-in-out',
                    marginTop: '5rem',
                }}
            > */}
            <ThemeProvider theme={theme}>
                <style>{dialogStyles}</style>
                <Container fluid className="p-4 bg-light">
                    <Row className="align-items-center">
                        <Col>
                            <Typography style={{ color: '#063455', fontWeight: 700, fontSize: '30px' }}>Dashboard</Typography>
                        </Col>
                    </Row>
                    <Typography style={{ color: '#063455', fontSize: '15px', fontWeight: '600' }}>Shows key statistics on room occupancy, upcoming check-ins, and recent bookings</Typography>

                    <Row className="mb-4 mt-4">
                        <Col md={6}>
                            <Card
                                style={{
                                    backgroundColor: '#063455',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '16px',
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
                                                // backgroundColor: '#202728',
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
                                    borderRadius: '16px',
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
                                                // backgroundColor: '#202728',
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
                                            <Typography sx={{ color: '#C6C6C6', fontSize: '14px' }}>Total Room Booking</Typography>
                                            <Typography sx={{ fontSize: '24px' }} className="m-0">
                                                {data?.totalRoomBookings || 0}
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <hr className="border-top mt-2" />
                                    <Row>
                                        <Col>
                                            <Typography sx={{ color: '#C6C6C6', fontSize: '12px' }}>Available Rooms</Typography>
                                            <Typography variant="h6">{data?.availableRoomsToday || 0}</Typography>
                                        </Col>
                                        <Col>
                                            <Typography sx={{ color: '#C6C6C6', fontSize: '12px' }}>Total Rooms</Typography>
                                            <Typography variant="h6">{data?.totalRooms || 0}</Typography>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    <Row className="mb-4 align-items-center">
                        <Col>
                            <CustomDateRangePicker onSearch={handleSearch} clearFilter={setSearchResultsFilter} />
                        </Col>
                    </Row>

                    {loading && (
                        <div className="p-4">
                            <Typography>Loading...</Typography>
                        </div>
                    )}

                    {!loading && searchResultsFilter && <AvailableRooms data={searchResults} type={bookingType} checkin={checkin} checkout={checkout} />}
                </Container>
            </ThemeProvider>
            {/* </div> */}
        </>
    );
};

export default RoomBookingDashboard;
