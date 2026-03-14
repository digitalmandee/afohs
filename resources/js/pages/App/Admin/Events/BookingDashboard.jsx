import React, { useEffect, useRef, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Container, Row, Form, Badge, Card, Col, Modal } from 'react-bootstrap';
import { Search, Add } from '@mui/icons-material';
import { ThemeProvider, Button, createTheme, Box, Typography } from '@mui/material';
import { router } from '@inertiajs/react';
import axios from 'axios';
import dayjs from 'dayjs';
import EventBookingInvoiceModal from '@/components/App/Events/EventBookingInvoiceModal';



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


const EventBookingDashboard = ({ data, eventVenues }) => {
    // const [open, setOpen] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);

    const [filteredBookings, setFilteredBookings] = useState(data.bookingsData || []);

    const displayedBookings = filteredBookings.filter((booking) => {
        const term = searchTerm.toLowerCase();
        return (
            (booking.customer?.name || '').toLowerCase().includes(term) ||
            (booking.member?.full_name || '').toLowerCase().includes(term) ||
            (booking.event_venue?.name || '').toLowerCase().includes(term) ||
            booking.booking_no?.toString().includes(term) ||
            (booking.nature_of_event || '').toLowerCase().includes(term)
        );
    });

    const handleShowInvoice = (booking) => {
        setSelectedBooking(booking);
        setShowInvoiceModal(true);
    };

    const handleCloseInvoice = () => {
        setShowInvoiceModal(false);
        setSelectedBooking(null);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'confirmed':
                return '#0e5f3c';
            case 'completed':
                return '#0066cc';
            case 'cancelled':
                return '#842029';
            default:
                return '#6c757d';
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
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography style={{ color: '#063455', fontWeight: 700, fontSize: '30px' }}>Dashboard</Typography>
                        <Button variant="contained" startIcon={<Add />} sx={{ backgroundColor: '#063455', textTransform: 'none', borderRadius: '16px', height: 35 }}
                            onClick={() => router.visit(route('events.booking.create'))}>
                            <Typography>Event Booking</Typography>
                        </Button>
                    </Box>
                    <Typography style={{ color: '#063455', fontSize: '15px', fontWeight: '600' }}>
                        Overview of upcoming, ongoing, and recent events</Typography>

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
                                            <Typography sx={{ color: '#C6C6C6', fontSize: '14px' }}>Total Event Bookings</Typography>
                                            <Typography sx={{ fontSize: '24px' }} className="m-0">
                                                {data?.totalEventBookings || 0}
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
                                            <Typography sx={{ color: '#C6C6C6', fontSize: '14px' }}>Available Venues</Typography>
                                            <Typography sx={{ fontSize: '24px' }} className="m-0">
                                                {data?.availableVenuesToday || 0}
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <hr className="border-top mt-2" />
                                    <Row>
                                        <Col>
                                            <Typography sx={{ color: '#C6C6C6', fontSize: '12px' }}>Confirmed</Typography>
                                            <Typography variant="h6">{data?.confirmedBookings || 0}</Typography>
                                        </Col>
                                        <Col>
                                            <Typography sx={{ color: '#C6C6C6', fontSize: '12px' }}>Completed</Typography>
                                            <Typography variant="h6">{data?.completedBookings || 0}</Typography>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    <Row className="mb-3 align-items-center">
                        <Col>
                            <Typography variant="h6" component="h2" style={{ color: '#000000', fontWeight: 500, fontSize: '24px' }}>
                                Recent Event Bookings
                            </Typography>
                        </Col>
                        <Col xs="auto" className="d-flex gap-3">
                            <div style={{ position: 'relative' }}>
                                <Form.Control
                                    placeholder="Search for event bookings"
                                    aria-label="Search"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{
                                        paddingLeft: '2rem',
                                        // borderColor: '#ced4da',
                                        borderRadius: '16px',
                                        height: '38px',
                                        fontSize: '0.9rem',
                                        // width:'50%'
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
                        </Col>
                    </Row>

                    {displayedBookings.length > 0 ? (
                        displayedBookings.map((booking, index) => {
                            const eventDuration = dayjs(booking.event_time_to, 'HH:mm').diff(dayjs(booking.event_time_from, 'HH:mm'), 'hour');

                            return (
                                <Card key={index} className="mb-2" style={{ border: '1px solid #e0e0e0', cursor: 'pointer' }} onClick={() => handleShowInvoice(booking)}>
                                    <Card.Body className="p-3">
                                        <Row>
                                            <Col md={12}>
                                                <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap">
                                                    <div>
                                                        <Typography style={{ fontWeight: 500, fontSize: '20px', color: '#121212' }}>
                                                            {booking.customer ? booking.customer.name : booking.member ? booking.member.full_name : ''}
                                                        </Typography>
                                                        <Typography variant="body2" style={{ color: '#7F7F7F', fontSize: '14px', fontWeight: 400 }}>
                                                            Created on {booking.booking_date}
                                                        </Typography>
                                                    </div>
                                                    <Badge
                                                        bg=""
                                                        style={{
                                                            backgroundColor: getStatusColor(booking.status),
                                                            color: 'white',
                                                            // padding: '6px 14px',
                                                            fontSize: '0.85rem',
                                                            fontWeight: 500,
                                                            minWidth: '100px',
                                                            textAlign: 'center',
                                                            cursor: 'pointer',
                                                            borderRadius: '12px',
                                                            textTransform: 'capitalize'
                                                        }}
                                                    >
                                                        {booking.status}
                                                    </Badge>
                                                </div>
                                                <Row className="text-start mt-2">
                                                    <Col md={2} sm={6} className="mb-2">
                                                        <Typography variant="body2" style={{ color: '#7F7F7F', fontSize: '14px' }}>
                                                            Booking ID
                                                        </Typography>
                                                        <Typography variant="body1" style={{ fontWeight: 400, color: '#121212', fontSize: '14px' }}>
                                                            # {booking.booking_no}
                                                        </Typography>
                                                    </Col>
                                                    <Col md={2} sm={6} className="mb-2">
                                                        <Typography variant="body2" style={{ color: '#7F7F7F', fontSize: '14px' }}>
                                                            Event Date
                                                        </Typography>
                                                        <Typography variant="body1" style={{ fontWeight: 400, color: '#121212', fontSize: '14px' }}>
                                                            {booking.event_date}
                                                        </Typography>
                                                    </Col>
                                                    <Col md={2} sm={6} className="mb-2">
                                                        <Typography variant="body2" style={{ color: '#7F7F7F', fontSize: '14px' }}>
                                                            Event Time
                                                        </Typography>
                                                        <Typography variant="body1" style={{ fontWeight: 400, color: '#121212', fontSize: '14px' }}>
                                                            {booking.event_time_from} - {booking.event_time_to}
                                                        </Typography>
                                                    </Col>
                                                    <Col md={2} sm={6} className="mb-2">
                                                        <Typography variant="body2" style={{ color: '#7F7F7F', fontSize: '14px' }}>
                                                            Venue
                                                        </Typography>
                                                        <Typography variant="body1" style={{ fontWeight: 400, color: '#121212', fontSize: '14px' }}>
                                                            {booking.event_venue?.name || 'N/A'}
                                                        </Typography>
                                                    </Col>
                                                    <Col md={2} sm={6} className="mb-2">
                                                        <Typography variant="body2" style={{ color: '#7F7F7F', fontSize: '14px' }}>
                                                            Guests
                                                        </Typography>
                                                        <Typography variant="body1" style={{ fontWeight: 400, color: '#121212', fontSize: '14px' }}>
                                                            {booking.no_of_guests}
                                                        </Typography>
                                                    </Col>
                                                    <Col md={2} sm={6} className="mb-2">
                                                        <Typography variant="body2" style={{ color: '#7F7F7F', fontSize: '14px' }}>
                                                            Total Payment
                                                        </Typography>
                                                        <Typography variant="body1" style={{ fontWeight: 400, color: '#121212', fontSize: '14px' }}>
                                                            Rs. {booking.total_price}
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
                        <Typography>No event bookings found for the selected criteria.</Typography>
                    )}

                    {/* Event Booking Invoice Modal */}
                    <EventBookingInvoiceModal
                        open={showInvoiceModal}
                        onClose={() => setShowInvoiceModal(false)}
                        bookingId={selectedBooking?.id}
                        setBookings={setFilteredBookings}
                    />
                </Container>
            </ThemeProvider>
            {/* </div> */}
        </>
    );
};

export default EventBookingDashboard;
