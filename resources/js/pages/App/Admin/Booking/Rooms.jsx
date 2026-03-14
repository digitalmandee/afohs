import React, { useState } from 'react';
import dayjs from 'dayjs';
import { Row, Col, Badge } from 'react-bootstrap';
import { Popover, Button, Box, Checkbox, Divider, FormControlLabel, FormGroup, Typography } from '@mui/material';
import { router, usePage } from '@inertiajs/react';
import HotelIcon from '@mui/icons-material/Hotel';
import PeopleIcon from '@mui/icons-material/People';
import BathtubIcon from '@mui/icons-material/Bathtub';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import HistoryIcon from '@mui/icons-material/History';

const AvailableRooms = ({ data, type, checkin, checkout, persons }) => {
    const { roomTypes } = usePage().props;

    const [anchorEl, setAnchorEl] = useState(null);
    const [hoveredRoom, setHoveredRoom] = useState(null);
    const [closeTimeout, setCloseTimeout] = useState(null);

    const handlePopoverOpen = (event, room) => {
        if (closeTimeout) clearTimeout(closeTimeout); // Cancel any pending close
        setAnchorEl(event.currentTarget);
        setHoveredRoom(room);
    };

    const handlePopoverClose = () => {
        setAnchorEl(null);
        setHoveredRoom(null);
    };

    const startCloseTimer = () => {
        const timeout = setTimeout(() => {
            handlePopoverClose();
        }, 400); // Increased delay for smoother experience
        setCloseTimeout(timeout);
    };

    const cancelCloseTimer = () => {
        if (closeTimeout) clearTimeout(closeTimeout);
    };

    const open = Boolean(anchorEl);

    const [selectedRoomTypes, setSelectedRoomTypes] = useState([]);

    const handleCheckboxChange = (id) => {
        setSelectedRoomTypes((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
    };

    const filteredRooms = selectedRoomTypes.length === 0 ? data : data.filter((room) => selectedRoomTypes.includes(room.room_type_id));

    const nights = Math.max(1, dayjs(checkout).diff(dayjs(checkin), 'day') + 1);

    return (
        <>
            <Box sx={{ px: 2, py: 1, pt: 2, display: 'flex', gap: 2 }}>
                {/* Left Filter Panel */}
                <Box sx={{ width: 250, borderRight: '1px solid #ddd', pr: 2 }}>
                    <Typography variant="h6" gutterBottom>
                        Filter
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                        Room Type
                    </Typography>
                    <FormGroup>
                        {roomTypes.map((roomType) => (
                            <FormControlLabel key={roomType.id} control={<Checkbox checked={selectedRoomTypes.includes(roomType.id)} onChange={() => handleCheckboxChange(roomType.id)} />} label={roomType.name} />
                        ))}
                    </FormGroup>
                </Box>

                {/* Room Listings */}
                <Box sx={{ flex: 1 }}>
                    <Typography sx={{ px: 2, fontSize: '20px', fontWeight: 500, color: '#121212' }}>{type === 'room' ? 'Available Rooms' : 'Available Events'}</Typography>
                    <Box sx={{ p: 1, mt: 3, maxHeight: 'calc(100vh - 120px)', overflowY: 'auto' }}>
                        {filteredRooms && filteredRooms.length > 0 ? (
                            filteredRooms.map((item, index) => (
                                <div
                                    key={index}
                                    className="border mb-3 p-2"
                                    style={{
                                        height: 88,
                                        border: '1px solid #E3E3E3',
                                        borderRadius: '16px',
                                        transition: 'box-shadow 0.3s ease-in-out',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)'; // ✅ Hover shadow
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)'; // ✅ Back to default
                                    }}
                                    onClick={() => router.visit(route('rooms.create.booking', { room_id: item.id, checkin, checkout, persons }))}
                                >
                                    <Row style={{ cursor: 'pointer' }}>
                                        <Col xs={2}>
                                            <img src={item.image ? '/' + item.image : '/placeholder.svg'} alt={type === 'room' ? item.type : item.name} style={{ width: 100, height: 67, borderRadius: '26px' }} />
                                        </Col>
                                        <Col xs={9}>
                                            {type === 'room' ? (
                                                <>
                                                    <div className="d-flex justify-content-between">
                                                        <h5 style={{ fontWeight: 400, fontSize: '18px', color: '#121212', marginBottom: '5px' }}>
                                                            {item.name} ({checkin && checkout && <span style={{ fontWeight: 'bold', color: '#121212' }}>{item.room_type?.name}</span>})
                                                        </h5>
                                                        <div>
                                                            <Button size="small" variant="outlined" onMouseEnter={(e) => handlePopoverOpen(e, item)} sx={{ textTransform: 'capitalize', fontSize: 13, ml: 1, color: '#063455', borderRadius: '12px' }}>
                                                                Per night charges
                                                            </Button>
                                                        </div>
                                                    </div>
                                                    <div className="d-flex mt-3" style={{ gap: 5 }}>
                                                        <div className="me-4">
                                                            <HotelIcon style={{ color: '#A5A5A5', width: 20, height: 14 }} />
                                                            <small style={{ color: '#6c757d' }}>{item.number_of_beds} Beds</small>
                                                        </div>
                                                        <div className="me-4">
                                                            <PeopleIcon style={{ color: '#A5A5A5', width: 20, height: 14 }} />
                                                            <small style={{ color: '#6c757d' }}>{item.max_capacity} Guests</small>
                                                        </div>
                                                        <div>
                                                            <BathtubIcon style={{ color: '#A5A5A5', width: 20, height: 14 }} />
                                                            <small style={{ color: '#6c757d' }}>{item.number_of_bathrooms} Bathroom</small>
                                                        </div>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="d-flex justify-content-between align-items-start">
                                                        <h5 style={{ fontWeight: 400, fontSize: '20px', color: '#121212' }}>{item.event_name}</h5>
                                                        <div>
                                                            <Badge bg={item.status === 'Complete' ? 'success' : 'primary'} style={{ padding: '5px 10px', borderRadius: '0px' }}>
                                                                {item.status}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                    <div style={{ marginTop: '-12px' }}>
                                                        <span style={{ fontWeight: '400', fontSize: '12px' }}>{item.price_per_person} Rs</span>
                                                        <span style={{ color: '#A5A5A5', fontSize: '12px' }}>/Per Person</span>
                                                    </div>
                                                    <div className="d-flex mt-1">
                                                        <div className="me-3">
                                                            <LocationOnIcon style={{ color: '#A5A5A5', width: '20px', height: '14px' }} />
                                                            <small style={{ color: '#6c757d' }}>{item.location}</small>
                                                        </div>
                                                        <div className="me-3">
                                                            <PeopleIcon style={{ color: '#A5A5A5', width: '20px', height: '14px' }} />
                                                            <small style={{ color: '#6c757d' }}>{item.max_capacity} Capacity</small>
                                                        </div>
                                                        <div>
                                                            <HistoryIcon style={{ color: '#A5A5A5', width: '20px', height: '14px' }} />
                                                            <small style={{ color: '#6c757d' }}>{item.date_time ? dayjs(item.date_time).format('DD-MM-YYYY') : ''}</small>
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </Col>
                                    </Row>
                                </div>
                            ))
                        ) : (
                            <Typography sx={{ px: 2, mt: 3, color: ' #6c757d' }}>{type === 'room' ? 'No rooms available' : 'No events available'}</Typography>
                        )}
                    </Box>
                </Box>
            </Box>

            {/* Popover for Category Charges */}
            <Popover
                open={Boolean(anchorEl)}
                anchorEl={anchorEl}
                onClose={handlePopoverClose}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                PaperProps={{
                    onMouseEnter: cancelCloseTimer,
                    onMouseLeave: startCloseTimer,
                    sx: {
                        p: 2,
                        pointerEvents: 'auto',
                        maxWidth: 250,
                    },
                }}
            >
                {hoveredRoom?.category_charges?.length > 0 ? (
                    <Box>
                        <Typography style={{ fontSize: '14px', color: '#063455', fontWeight: '600' }} gutterBottom>
                            Per Night Category Charges:
                        </Typography>
                        {hoveredRoom.category_charges.map((charge, idx) => (
                            <Typography key={idx} style={{ fontSize: '14px' }}>
                                <span style={{ fontWeight: 'bold' }}>{charge.category?.name || 'N/A'}</span> : {charge.amount} Rs
                            </Typography>
                        ))}
                    </Box>
                ) : (
                    <Typography>No category charges found</Typography>
                )}
            </Popover>
        </>
    );
};

export default AvailableRooms;
