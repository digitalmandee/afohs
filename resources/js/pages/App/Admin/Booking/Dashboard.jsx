import React from 'react';
import axios from 'axios';
import { router } from '@inertiajs/react';
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    CircularProgress,
    Grid,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { AddCircleOutline, BedOutlined, CalendarMonthOutlined, HotelOutlined, VisibilityOutlined } from '@mui/icons-material';
import AppPage from '@/components/App/ui/AppPage';
import StatCard from '@/components/App/ui/StatCard';
import SurfaceCard from '@/components/App/ui/SurfaceCard';
import { AdminIconAction, AdminRowActionGroup } from '@/components/App/ui/AdminRowActions';

function RoomResultCard({ room, checkin, checkout }) {
    return (
        <Card
            sx={{
                borderRadius: '20px',
                border: '1px solid rgba(226,232,240,0.95)',
                boxShadow: '0 14px 30px rgba(15, 23, 42, 0.05)',
            }}
        >
            <CardContent sx={{ p: 2 }}>
                <Stack direction="row" spacing={2} alignItems="flex-start">
                    <Box
                        component="img"
                        src={room.image ? `/${room.image}` : '/placeholder.svg'}
                        alt={room.name}
                        sx={{
                            width: 92,
                            height: 72,
                            borderRadius: '18px',
                            objectFit: 'cover',
                            bgcolor: 'rgba(226,232,240,0.65)',
                        }}
                    />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Stack direction="row" justifyContent="space-between" spacing={1} alignItems="flex-start">
                            <Box sx={{ minWidth: 0 }}>
                                <Typography sx={{ fontWeight: 800, color: 'text.primary' }}>{room.name}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {room.room_type?.name || 'Room'}
                                </Typography>
                            </Box>
                            <AdminRowActionGroup justify="flex-end">
                                <AdminIconAction title="View Room" onClick={() => router.visit(route('rooms.edit', room.id))}>
                                    <VisibilityOutlined fontSize="small" />
                                </AdminIconAction>
                                <AdminIconAction
                                    title="Create Booking"
                                    onClick={() =>
                                        router.visit(
                                            route('rooms.create.booking', {
                                                room_id: room.id,
                                                checkin,
                                                checkout,
                                            }),
                                        )
                                    }
                                >
                                    <AddCircleOutline fontSize="small" />
                                </AdminIconAction>
                            </AdminRowActionGroup>
                        </Stack>

                        <Stack direction="row" spacing={1.5} useFlexGap flexWrap="wrap" sx={{ mt: 1.25 }}>
                            <Typography variant="body2" color="text.secondary">
                                <BedOutlined sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'text-bottom' }} />
                                {room.number_of_beds || 0} beds
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                <HotelOutlined sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'text-bottom' }} />
                                {room.number_of_bathrooms || 0} baths
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Max {room.max_capacity || 0} guests
                            </Typography>
                        </Stack>
                    </Box>
                </Stack>
            </CardContent>
        </Card>
    );
}

export default function RoomBookingDashboard({ data, roomTypes = [] }) {
    const [checkin, setCheckin] = React.useState('');
    const [checkout, setCheckout] = React.useState('');
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState('');
    const [searched, setSearched] = React.useState(false);
    const [searchResults, setSearchResults] = React.useState([]);

    const handleSearch = React.useCallback(async () => {
        if (!checkin || !checkout) {
            setError('Select both check-in and check-out dates.');
            return;
        }

        if (checkin >= checkout) {
            setError('Check-out must be after check-in.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await axios.get(route('rooms.booking.search'), {
                params: {
                    bookingType: 'room',
                    checkin,
                    checkout,
                },
            });

            setSearchResults(Array.isArray(response.data) ? response.data : []);
            setSearched(true);
        } catch (searchError) {
            setError(searchError?.response?.data?.message || 'Unable to load available rooms.');
            setSearchResults([]);
            setSearched(true);
        } finally {
            setLoading(false);
        }
    }, [checkin, checkout]);

    const resetSearch = React.useCallback(() => {
        setCheckin('');
        setCheckout('');
        setSearchResults([]);
        setError('');
        setSearched(false);
    }, []);

    return (
        <AppPage
            eyebrow="Rooms"
            title="Rooms Dashboard"
            subtitle="Current occupancy, live availability search, and direct booking actions in the upgraded room operations shell."
            actions={[
                <Button key="manage" variant="outlined" onClick={() => router.visit(route('rooms.manage'))}>
                    Manage Bookings
                </Button>,
                <Button key="calendar" variant="outlined" onClick={() => router.visit(route('rooms.booking.calendar'))}>
                    Calendar
                </Button>,
                <Button key="create" variant="contained" onClick={() => router.visit(route('rooms.create.booking'))}>
                    New Booking
                </Button>,
            ]}
        >
            <Grid container spacing={2.25}>
                <Grid item xs={12} md={3}>
                    <StatCard label="Total Bookings" value={data?.totalBookings || 0} accent />
                </Grid>
                <Grid item xs={12} md={3}>
                    <StatCard label="Room Bookings" value={data?.totalRoomBookings || 0} tone="light" />
                </Grid>
                <Grid item xs={12} md={3}>
                    <StatCard label="Available Today" value={data?.availableRoomsToday || 0} tone="muted" />
                </Grid>
                <Grid item xs={12} md={3}>
                    <StatCard label="Room Types" value={roomTypes.length} tone="light" />
                </Grid>
            </Grid>

            <SurfaceCard title="Availability Search" subtitle="Search available rooms by date range and open the booking flow directly from compact card actions.">
                <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                        <TextField
                            fullWidth
                            label="Check-In"
                            type="date"
                            InputLabelProps={{ shrink: true }}
                            value={checkin}
                            onChange={(event) => setCheckin(event.target.value)}
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <TextField
                            fullWidth
                            label="Check-Out"
                            type="date"
                            InputLabelProps={{ shrink: true }}
                            value={checkout}
                            onChange={(event) => setCheckout(event.target.value)}
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Stack direction="row" spacing={1} sx={{ height: '100%', alignItems: 'center', pt: { xs: 0, md: 1 } }}>
                            <Button variant="outlined" onClick={resetSearch}>
                                Reset
                            </Button>
                            <Button variant="contained" startIcon={<CalendarMonthOutlined />} onClick={handleSearch} disabled={loading}>
                                Search Rooms
                            </Button>
                        </Stack>
                    </Grid>
                </Grid>
                {error ? <Alert severity="warning" sx={{ mt: 2 }}>{error}</Alert> : null}
            </SurfaceCard>

            <SurfaceCard title="Available Rooms" subtitle="Search results stay compact and icon-driven, with direct booking links and no oversized action rows.">
                {loading ? (
                    <Box sx={{ py: 6, display: 'grid', placeItems: 'center' }}>
                        <CircularProgress />
                    </Box>
                ) : searched && searchResults.length === 0 ? (
                    <Alert severity="info">No rooms are available for the selected dates.</Alert>
                ) : searched ? (
                    <Grid container spacing={2}>
                        {searchResults.map((room) => (
                            <Grid item xs={12} md={6} key={room.id}>
                                <RoomResultCard room={room} checkin={checkin} checkout={checkout} />
                            </Grid>
                        ))}
                    </Grid>
                ) : (
                    <Typography color="text.secondary">Run an availability search to see bookable rooms here.</Typography>
                )}
            </SurfaceCard>
        </AppPage>
    );
}
