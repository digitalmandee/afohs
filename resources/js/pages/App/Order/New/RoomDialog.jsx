'use client';

import UserAutocomplete from '@/components/UserAutocomplete';
import GuestCreateModal from '@/components/GuestCreateModal';
import { useOrderStore } from '@/stores/useOrderStore';
import { router } from '@inertiajs/react';
import { routeNameForContext } from '@/lib/utils';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SearchIcon from '@mui/icons-material/Search';
import { Box, Button, CircularProgress, FormControl, FormControlLabel, Grid, IconButton, InputBase, InputLabel, MenuItem, Paper, Radio, RadioGroup, Select, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { enqueueSnackbar } from 'notistack';

const RoomDialog = ({ guestTypes, roomTypes, loading, selectedRestaurant, reloadRooms }) => {
    const { orderDetails, handleOrderDetailChange } = useOrderStore();

    const [filterOption, setFilterOption] = useState('occupied');
    const [searchTerm, setSearchTerm] = useState('');
    const [showGuestModal, setShowGuestModal] = useState(false);

    const getCurrentBooking = (room) => room?.current_booking || room?.currentBooking || null;

    useEffect(() => {
        if (!orderDetails.room_type && Array.isArray(roomTypes) && roomTypes.length > 0) {
            handleOrderDetailChange('room_type', roomTypes[0]?.id || '');
        }
    }, [orderDetails.room_type, roomTypes]);

    const handleGuestCreated = (newGuest) => {
        const formattedGuest = {
            ...newGuest,
            label: `${newGuest.name} (Guest - ${newGuest.customer_no})`,
            booking_type: 'guest',
        };

        const memberTypeValue = `guest-${newGuest.guest_type_id}`;
        handleOrderDetailChange('member_type', memberTypeValue);
        handleOrderDetailChange('member', formattedGuest);
        reloadRooms?.({ member_id: newGuest.id, member_type: memberTypeValue });
        setShowGuestModal(false);
    };

    const handleFilterOptionChange = (event, newFilterOption) => {
        if (newFilterOption !== null) {
            setFilterOption(newFilterOption);
        }
    };

    const handleRoomTypeChange = (value) => {
        handleOrderDetailChange('room_type', value);
        handleOrderDetailChange('room', null);
    };

    const handleMemberType = (value) => {
        handleOrderDetailChange('member_type', value);
        handleOrderDetailChange('member', {});
        handleOrderDetailChange('room', null);
        reloadRooms?.({ clear: true });
    };

    const handleMemberSelection = (newValue) => {
        if (!newValue) {
            handleOrderDetailChange('member', {});
            handleOrderDetailChange('room', null);
            reloadRooms?.({ clear: true });
            return;
        }

        if (newValue.booking_type !== 'member') {
            handleOrderDetailChange('member', newValue);
            handleOrderDetailChange('room', null);
            reloadRooms?.({ member_id: newValue.id, member_type: orderDetails.member_type });
            return;
        }

        const status = String(newValue.status || '')
            .trim()
            .toLowerCase()
            .replace(/\s+/g, '_');
        const reason = newValue.status_reason || newValue.reason || '';

        if (status === 'expired') {
            enqueueSnackbar(`The membership has EXPIRED!${reason ? ` Reason: ${reason}` : ''}`, { variant: 'warning' });
            handleOrderDetailChange('member', newValue);
            handleOrderDetailChange('room', null);
            reloadRooms?.({ member_id: newValue.id, member_type: orderDetails.member_type });
            return;
        }

        const blocked = new Set(['absent', 'suspended', 'terminated', 'not_assign', 'not_assigned', 'cancelled', 'inactive', 'in_suspension_process']);
        if (blocked.has(status)) {
            enqueueSnackbar(`Please consult Accounts Manager in order to continue with this Order.${reason ? ` Reason: ${reason}` : ''}`, { variant: 'error' });
            handleOrderDetailChange('member', {});
            handleOrderDetailChange('room', null);
            reloadRooms?.({ clear: true });
            return;
        }

        handleOrderDetailChange('member', newValue);
        handleOrderDetailChange('room', null);
        reloadRooms?.({ member_id: newValue.id, member_type: orderDetails.member_type });
    };

    const findCheckedInRoomForMember = (member, memberType) => {
        if (!member || !member.id) return null;
        for (const type of roomTypes) {
            if (!Array.isArray(type.rooms)) continue;
            const matched = type.rooms.find((r) => {
                const booking = getCurrentBooking(r);
                if (!booking || booking.status !== 'checked_in') return false;
                if (memberType == 0) return booking.member_id == member.id;
                if (memberType == 2) return booking.corporate_member_id == member.id;
                if (String(memberType).startsWith('guest-') || memberType == 1) return booking.customer_id == member.id;
                if (memberType == 3) return booking.employee_id == member.id;
                return false;
            });
            if (matched) {
                return { typeId: type.id, room: matched };
            }
        }
        return null;
    };

    // Auto-select room based on selected member
    useEffect(() => {
        if (orderDetails.member && orderDetails.member.id && roomTypes.length > 0) {
            const matched = findCheckedInRoomForMember(orderDetails.member, orderDetails.member_type);
            if (matched) {
                handleOrderDetailChange('room_type', matched.typeId);
                handleOrderDetailChange('room', matched.room);
            } else {
                handleOrderDetailChange('room', null);
            }
        }
    }, [orderDetails.member, orderDetails.member_type, roomTypes]);

    const currentRoomType = roomTypes.find((r) => r.id === orderDetails.room_type);

    const filteredRooms = currentRoomType?.rooms?.length
        ? currentRoomType.rooms.filter((room) => {
              const booking = getCurrentBooking(room);
              const isOccupied = !!booking;
              if (filterOption === 'occupied' && !isOccupied) return false;
              if (filterOption === 'vacant' && isOccupied) return false;

              // If a member is selected, filter by that member's booking
              if (orderDetails.member && orderDetails.member.id) {
                  if (!booking) return false;

                  // Check if booking matches selected member
                  if (orderDetails.member_type == 0) {
                      // Member
                      if (booking.member_id != orderDetails.member.id) return false;
                  } else if (orderDetails.member_type == 2) {
                      // Corporate Member
                      if (booking.corporate_member_id != orderDetails.member.id) return false;
                  } else if (String(orderDetails.member_type).startsWith('guest-') || orderDetails.member_type == 1) {
                      // Guest
                      if (booking.customer_id != orderDetails.member.id) return false;
                  } else if (orderDetails.member_type == 3) {
                      // Employee
                      if (booking.employee_id != orderDetails.member.id) return false;
                  }
              }

              const keyword = searchTerm.toLowerCase();
              const guestName = booking ? booking.guest_first_name + ' ' + booking.guest_last_name : '';

              return room.name.toLowerCase().includes(keyword) || guestName.toLowerCase().includes(keyword);
          })
        : [];

    const isDisabled = !orderDetails.room || !getCurrentBooking(orderDetails.room);

    return (
        <>
            <Box>
            <Box sx={{ px: 2, mb: 2 }}>
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: '',
                        bgcolor: '#F6F6F6',
                        px: 2,
                        py: 1.5,
                        borderRadius: 1,
                    }}
                >
                    <Typography sx={{ fontSize: '14px', color: '#7F7F7F' }}>Order ID</Typography>
                    <Typography
                        sx={{
                            fontWeight: 'bold',
                            fontSize: '14px',
                            color: '#063455',
                            marginLeft: 2,
                        }}
                    >
                        #{orderDetails.order_no}
                    </Typography>
                </Box>
            </Box>

            <Box sx={{ px: 2, mb: 2 }}>
                <FormControl component="fieldset">
                    <RadioGroup
                        row
                        name="membership-type"
                        value={orderDetails.member_type}
                        onChange={(e) => {
                            handleMemberType(e.target.value);
                            handleOrderDetailChange('member', {});
                        }}
                    >
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, width: '100%' }}>
                            <FormControlLabel value="0" control={<Radio />} label="Member" sx={{ border: orderDetails.member_type == '0' ? '1px solid #A27B5C' : '1px solid #E3E3E3', borderRadius: 1, px: 1, m: 0, bgcolor: orderDetails.member_type == '0' ? '#FCF7EF' : 'transparent' }} />
                            <FormControlLabel value="2" control={<Radio />} label="Corporate Member" sx={{ border: orderDetails.member_type == '2' ? '1px solid #A27B5C' : '1px solid #E3E3E3', borderRadius: 1, px: 1, m: 0, bgcolor: orderDetails.member_type == '2' ? '#FCF7EF' : 'transparent' }} />
                            <FormControlLabel value="3" control={<Radio />} label="Employee" sx={{ border: orderDetails.member_type == '3' ? '1px solid #A27B5C' : '1px solid #E3E3E3', borderRadius: 1, px: 1, m: 0, bgcolor: orderDetails.member_type == '3' ? '#FCF7EF' : 'transparent' }} />
                            {guestTypes.map((type) => (
                                <FormControlLabel
                                    key={type.id}
                                    value={`guest-${type.id}`}
                                    control={<Radio />}
                                    label={type.name}
                                    sx={{
                                        border: orderDetails.member_type == `guest-${type.id}` ? '1px solid #A27B5C' : '1px solid #E3E3E3',
                                        borderRadius: 1,
                                        px: 1,
                                        m: 0,
                                        bgcolor: orderDetails.member_type == `guest-${type.id}` ? '#FCF7EF' : 'transparent',
                                    }}
                                />
                            ))}
                        </Box>
                    </RadioGroup>
                </FormControl>
            </Box>

            {/* Customer Information */}
            <Grid container spacing={2} sx={{ px: 2, mb: 2 }}>
                <Grid item xs={12}>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                        Customer Name
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                        <Box sx={{ flexGrow: 1 }}>
                            <UserAutocomplete routeUri={route(routeNameForContext('api.users.global-search'))} memberType={orderDetails.member_type} value={orderDetails.member && orderDetails.member.id ? orderDetails.member : null} onChange={(newValue) => handleMemberSelection(newValue)} label="Member / Guest Name" placeholder="Search by Name, ID, or CNIC..." />
                        </Box>
                        <Button variant="contained" onClick={() => setShowGuestModal(true)} sx={{ backgroundColor: '#063455', color: '#fff', height: '40px' }}>
                            + Add
                        </Button>
                    </Box>
                </Grid>
            </Grid>

            {!orderDetails.member?.id ? (
                <Box sx={{ px: 2, mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
                        Search customer name to show checked-in rooms.
                    </Typography>
                </Box>
            ) : (
                <>
                    {/* Search and Filter */}
                    <Box sx={{ px: 2, mb: 2, display: 'flex' }}>
                        <Paper
                            component="form"
                            sx={{
                                p: '2px 4px',
                                display: 'flex',
                                alignItems: 'center',
                                flex: 1,
                                border: '1px solid #ddd',
                                boxShadow: 'none',
                            }}
                        >
                            <InputBase sx={{ ml: 1, flex: 1 }} placeholder="Search Room or Guest" inputProps={{ 'aria-label': 'search rooms' }} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                            <IconButton type="button" sx={{ p: '10px' }} aria-label="search">
                                <SearchIcon />
                            </IconButton>
                        </Paper>
                        {/* Select Room Type */}
                        <FormControl sx={{ marginLeft: 1, minWidth: 120 }}>
                            <InputLabel id="select-room-type">Room Type</InputLabel>
                            <Select labelId="select-room-type" id="room-type" value={orderDetails.room_type || ''} label="Room Type" onChange={(e) => handleRoomTypeChange(e.target.value)}>
                                {roomTypes.map((item, index) => (
                                    <MenuItem value={item.id} key={index}>
                                        {item.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <ToggleButtonGroup value={filterOption} exclusive onChange={handleFilterOptionChange} aria-label="filter option" size="small" sx={{ ml: 1 }}>
                            <ToggleButton value="all" aria-label="all" sx={{ textTransform: 'none', '&.Mui-selected': { bgcolor: '#063455', color: 'white', '&:hover': { bgcolor: '#063455' } } }}>
                                All
                            </ToggleButton>
                            <ToggleButton value="occupied" aria-label="occupied" sx={{ textTransform: 'none', '&.Mui-selected': { bgcolor: '#063455', color: 'white', '&:hover': { bgcolor: '#063455' } } }}>
                                Occupied
                            </ToggleButton>
                            <ToggleButton value="vacant" aria-label="vacant" sx={{ textTransform: 'none', '&.Mui-selected': { bgcolor: '#063455', color: 'white', '&:hover': { bgcolor: '#063455' } } }}>
                                Vacant
                            </ToggleButton>
                        </ToggleButtonGroup>
                    </Box>

                    {/* Room Selection */}
                    <Box sx={{ px: 2, mb: 2 }}>
                <RadioGroup
                    value={orderDetails.room ? JSON.stringify(orderDetails.room) : ''}
                    onChange={(e) => {
                        const room = JSON.parse(e.target.value);
                        handleOrderDetailChange('room', room);

                        // Extract member info from booking
                        const booking = getCurrentBooking(room);
                        if (booking) {
                            let memberData = null;
                            let memberType = null;

                            if (booking.member) {
                                memberType = 0; // Member
                                memberData = {
                                    ...booking.member,
                                    name: booking.member.full_name, // Map full_name to name for consistency
                                    type: 'Member',
                                };
                            } else if (booking.corporate_member || booking.corporateMember) {
                                const corporate = booking.corporate_member || booking.corporateMember;
                                memberType = 2; // Corporate
                                memberData = {
                                    ...corporate,
                                    name: corporate.full_name,
                                    type: 'Corporate Member',
                                };
                            } else if (booking.customer) {
                                memberType = booking.customer.guest_type_id ? `guest-${booking.customer.guest_type_id}` : 1; // Guest
                                memberData = {
                                    ...booking.customer,
                                    name: booking.customer.name,
                                    type: 'Guest',
                                };
                            } else {
                                // Fallback for walk-in guest in room? (Or handle accordingly)
                                memberType = 1;
                                memberData = {
                                    id: null,
                                    name: `${booking.guest_first_name} ${booking.guest_last_name}`,
                                    customer_no: 'N/A',
                                    type: 'Guest',
                                };
                            }

                            handleOrderDetailChange('member', memberData);
                            handleOrderDetailChange('member_type', memberType);
                        }
                    }}
                >
                    <Grid container spacing={1}>
                        {loading ? (
                            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
                                <CircularProgress />
                            </Grid>
                        ) : filteredRooms.length > 0 ? (
                            filteredRooms.map((room) => {
                                const booking = getCurrentBooking(room);
                                const isOccupied = !!booking;
                                const isSelected = orderDetails.room?.id === room.id;

                                const handleSelectRoom = () => {
                                    handleOrderDetailChange('room', room);
                                    if (booking) {
                                        let memberData = null;
                                        let memberType = null;

                                        if (booking.member) {
                                            memberType = 0;
                                            memberData = {
                                                ...booking.member,
                                                name: booking.member.full_name,
                                                type: 'Member',
                                            };
                                        } else if (booking.corporate_member || booking.corporateMember) {
                                            const corporate = booking.corporate_member || booking.corporateMember;
                                            memberType = 2;
                                            memberData = {
                                                ...corporate,
                                                name: corporate.full_name,
                                                type: 'Corporate Member',
                                            };
                                        } else if (booking.customer) {
                                            memberType = booking.customer.guest_type_id ? `guest-${booking.customer.guest_type_id}` : 1;
                                            memberData = {
                                                ...booking.customer,
                                                name: booking.customer.name,
                                                type: 'Guest',
                                            };
                                        } else {
                                            memberType = 1;
                                            memberData = {
                                                id: null,
                                                name: `${booking.guest_first_name} ${booking.guest_last_name}`,
                                                customer_no: 'N/A',
                                                type: 'Guest',
                                            };
                                        }

                                        handleOrderDetailChange('member', memberData);
                                        handleOrderDetailChange('member_type', memberType);
                                    }
                                };

                                return (
                                    <Grid item xs={6} key={room.id}>
                                        <Paper
                                            elevation={0}
                                            sx={{
                                                p: 1.5,
                                                bgcolor: isSelected ? '#FCF7EF' : isOccupied ? 'white' : '#f5f5f5',
                                                border: isSelected ? '1px solid #A27B5C' : '1px solid #e0e0e0',
                                                borderRadius: 1,
                                                opacity: 1,
                                                cursor: 'pointer',
                                                position: 'relative',
                                            }}
                                            onClick={handleSelectRoom}
                                        >
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                }}
                                            >
                                                <Box>
                                                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                                                        {room.name}
                                                    </Typography>
                                                    {isOccupied ? (
                                                        <Box>
                                                            <Typography variant="caption" sx={{ color: 'green', display: 'block' }}>
                                                                {booking.member ? 'Member: ' : booking.customer ? 'Guest: ' : booking.employee ? 'Employee: ' : 'Guest: '}
                                                                {booking.member ? booking.member.full_name : booking.customer ? booking.customer.name : booking.employee ? booking.employee.name : `${booking.guest_first_name} ${booking.guest_last_name}`}
                                                            </Typography>
                                                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: '0.7rem' }}>
                                                                Check-In: {booking.check_in_date}
                                                            </Typography>
                                                        </Box>
                                                    ) : (
                                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                            Vacant
                                                        </Typography>
                                                    )}
                                                </Box>

                                                <FormControlLabel value={JSON.stringify(room)} control={<Radio size="small" checked={isSelected} />} label="" sx={{ m: 0, color: '#063455' }} />
                                            </Box>
                                        </Paper>
                                    </Grid>
                                );
                            })
                        ) : (
                            <Grid item xs={12}>
                                <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
                                    No rooms found.
                                </Typography>
                            </Grid>
                        )}
                    </Grid>
                </RadioGroup>

                {/* Selected Member Details */}
                {orderDetails.member && (
                    <Box sx={{ px: 2, mb: 2 }}>
                        <Paper elevation={0} sx={{ p: 2, bgcolor: '#f5f5f5', border: '1px solid #e0e0e0', borderRadius: 1 }}>
                            <Typography variant="subtitle2" sx={{ mb: 1, color: '#063455' }}>
                                Selected {orderDetails.member_type == 0 ? 'Member' : orderDetails.member_type == 2 ? 'Corporate Member' : orderDetails.member_type == 3 ? 'Employee' : 'Guest'}
                            </Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box display="flex" justifyContent="space-between" width="100%">
                                    <Box>
                                        <Typography variant="body2" fontWeight="medium">
                                            {orderDetails.member.name}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {orderDetails.member_type == 0 || orderDetails.member_type == 2
                                                ? `Membership No: ${orderDetails.member.membership_no || 'N/A'}`
                                                : orderDetails.member_type == 3
                                                  ? `Employee ID: ${orderDetails.member.employee_id || 'N/A'}`
                                                  : `Customer No: ${orderDetails.member.customer_no || 'N/A'}`}
                                        </Typography>
                                        {orderDetails.member_type == 0 && (
                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', color: orderDetails.member.status === 'active' ? 'green' : 'red' }}>
                                                Status: {orderDetails.member.status || 'N/A'}
                                            </Typography>
                                        )}
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textTransform: 'capitalize' }}>
                                            Room Status: {getCurrentBooking(orderDetails.room)?.status?.replace('_', ' ') || 'Not Checked In'}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                            Check-In: {getCurrentBooking(orderDetails.room)?.check_in_date}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                            Check-Out: {getCurrentBooking(orderDetails.room)?.check_out_date}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>
                        </Paper>
                    </Box>
                )}
                    </Box>
                </>
            )}

            {/* Footer */}
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    p: 2,
                    borderTop: '1px solid #e0e0e0',
                }}
            >
                <Button sx={{ color: '#666', textTransform: 'none', mr: 1 }} onClick={() => router.visit(route(routeNameForContext('order.new')))}>
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    endIcon={<ArrowForwardIcon />}
                    sx={{
                        bgcolor: '#0c3b5c',
                        '&:hover': { bgcolor: '#072a42' },
                        textTransform: 'none',
                    }}
                    disabled={isDisabled}
                    onClick={() => {
                        const room = orderDetails.room;
                        // If room is occupied, pass booking id
                        const booking = room.current_booking;

                        router.visit(
                            route(routeNameForContext('order.menu'), {
                                restaurant_id: selectedRestaurant || undefined,
                                room_id: room.id,
                                room_booking_id: booking ? booking.id : null,
                                member_id: orderDetails.member ? orderDetails.member.id : null,
                                member_type: orderDetails.member_type,
                                order_type: 'room_service',
                            }),
                        );
                    }}
                >
                    Choose Menu
                </Button>
            </Box>
            </Box>

            <GuestCreateModal open={showGuestModal} onClose={() => setShowGuestModal(false)} onSuccess={handleGuestCreated} guestTypes={guestTypes} storeRouteName={routeNameForContext('customers.store')} memberSearchRouteName={routeNameForContext('api.users.global-search')} memberSearchParams={{ type: '0' }} />
        </>
    );
};

export default RoomDialog;
