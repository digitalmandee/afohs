import UserAutocomplete from '@/components/UserAutocomplete';
import GuestCreateModal from '@/components/GuestCreateModal';
import { useOrderStore } from '@/stores/useOrderStore';
import { router } from '@inertiajs/react';
import { routeNameForContext } from '@/lib/utils';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { Box, Button, FormControl, FormControlLabel, Grid, Radio, RadioGroup, TextField, Typography, Autocomplete } from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { enqueueSnackbar } from 'notistack';

const TakeAwayDialog = ({ guestTypes, selectedRestaurant }) => {
    const { orderDetails, handleOrderDetailChange } = useOrderStore();
    const [riders, setRiders] = useState([]);
    const [showGuestModal, setShowGuestModal] = useState(false);

    const handleGuestCreated = (newGuest) => {
        const formattedGuest = {
            ...newGuest,
            label: `${newGuest.name} (Guest - ${newGuest.customer_no})`,
            booking_type: 'guest',
        };

        handleOrderDetailChange('member_type', `guest-${newGuest.guest_type_id}`);
        handleOrderDetailChange('member', formattedGuest);
        handleOrderDetailChange('address', formattedGuest?.address || '');
        setShowGuestModal(false);
    };

    useEffect(() => {
        if (orderDetails.order_type === 'delivery') {
            axios.get(route(routeNameForContext('riders.all'))).then((res) => {
                if (res.data.success) {
                    setRiders(res.data.riders);
                }
            });
        }
    }, [orderDetails.order_type]);

    const isMemberSelected = !!orderDetails.member && Object.keys(orderDetails.member).length > 0;
    const requiresAddress = orderDetails.order_type === 'delivery';
    const isDisabled = !isMemberSelected || (requiresAddress && !orderDetails.address);

    const goToMenu = useCallback(() => {
        router.visit(
            route(routeNameForContext('order.menu'), {
                restaurant_id: selectedRestaurant || undefined,
                member_id: orderDetails.member.id,
                member_type: orderDetails.member_type,
                order_type: orderDetails.order_type,
                address: orderDetails.address || null,
                rider_id: orderDetails.rider_id || null,
            }),
        );
    }, [orderDetails.address, orderDetails.member, orderDetails.member_type, orderDetails.order_type, orderDetails.rider_id, selectedRestaurant]);

    const handleMemberType = (value) => {
        handleOrderDetailChange('member_type', value);
        handleOrderDetailChange('member', {});
    };

    const handleMemberChange = (value) => {
        if (!value) {
            handleOrderDetailChange('member', {});
            handleOrderDetailChange('address', '');
            return;
        }

        if (value.booking_type === 'member') {
            const status = String(value.status || '')
                .trim()
                .toLowerCase()
                .replace(/\s+/g, '_');
            const reason = value.status_reason || value.reason || '';

            if (status === 'expired') {
                enqueueSnackbar(`The membership has EXPIRED!${reason ? ` Reason: ${reason}` : ''}`, { variant: 'warning' });
            } else {
                const blocked = new Set(['absent', 'suspended', 'terminated', 'not_assign', 'not_assigned', 'cancelled', 'inactive', 'in_suspension_process']);
                if (blocked.has(status)) {
                    enqueueSnackbar(`Please consult Accounts Manager in order to continue with this Order.${reason ? ` Reason: ${reason}` : ''}`, { variant: 'error' });
                    handleOrderDetailChange('member', {});
                    handleOrderDetailChange('address', '');
                    return;
                }
            }
        }

        handleOrderDetailChange('member', value);
        handleOrderDetailChange('address', value?.address || '');
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'F10' && !isDisabled) {
                e.preventDefault();
                goToMenu();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [goToMenu, isDisabled]);

    return (
        <>
            <Box>
            {/* Order Header */}
            <Box sx={{ px: 2, mb: 2 }}>
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
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

            {/* Customer Search */}
            <Box sx={{ px: 2, mb: 2 }}>
                <FormControl component="fieldset">
                    <Grid container spacing={2} sx={{ px: 2, mb: 2 }}>
                        <Grid item xs={12}>
                            <RadioGroup
                                row
                                value={orderDetails.member_type}
                                onChange={(e) => {
                                    handleOrderDetailChange('member_type', e.target.value);
                                    handleOrderDetailChange('member', {});
                                }}
                                sx={{ gap: 1 }}
                            >
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
                            </RadioGroup>
                        </Grid>
                        <Grid item xs={12}>
                            <Box display="flex" alignItems="center" gap={1}>
                                <Box sx={{ flexGrow: 1 }}>
                                    <UserAutocomplete routeUri={route(routeNameForContext('api.users.global-search'))} memberType={orderDetails.member_type} value={orderDetails.member && orderDetails.member.id ? orderDetails.member : null} onChange={(newValue) => handleMemberChange(newValue || null)} label="Member / Guest Name" placeholder="Search by Name, ID, or CNIC..." />
                                </Box>
                                <Button variant="contained" onClick={() => setShowGuestModal(true)} sx={{ backgroundColor: '#063455', color: '#fff', height: '40px' }}>
                                    + Add
                                </Button>
                            </Box>
                        </Grid>

                        {/* Delivery Address */}
                        {requiresAddress && (
                            <Grid item xs={12}>
                                <Typography variant="body2" sx={{ mb: 0.5, fontSize: '14px', color: '#121212' }}>
                                    Delivery Address
                                </Typography>
                                <TextField placeholder="Enter delivery address" fullWidth size="small" value={orderDetails.address || ''} onChange={(e) => handleOrderDetailChange('address', e.target.value)} />
                            </Grid>
                        )}

                        {/* Rider Selection for Delivery */}
                        {orderDetails.order_type === 'delivery' && (
                            <Grid item xs={12}>
                                <Typography variant="body2" sx={{ mb: 0.5, fontSize: '14px', color: '#121212' }}>
                                    Assign Rider
                                </Typography>
                                <Autocomplete
                                    fullWidth
                                    size="small"
                                    options={riders}
                                    value={riders.find((r) => r.id === orderDetails.rider_id) || null}
                                    getOptionLabel={(option) => option.name || ''}
                                    onChange={(event, newValue) => {
                                        handleOrderDetailChange('rider_id', newValue ? newValue.id : null);
                                    }}
                                    filterOptions={(options, state) => options.filter((option) => `${option.name} ${option.email} ${option.employee_id}`.toLowerCase().includes(state.inputValue.toLowerCase()))}
                                    renderInput={(params) => <TextField {...params} fullWidth placeholder="Select Rider" variant="outlined" size="small" />}
                                    renderOption={(props, option) => {
                                        const getStatusChipStyles = (status) => {
                                            const s = (status || '').toLowerCase();
                                            if (s === 'active') return { backgroundColor: '#e8f5e9', color: '#2e7d32' };
                                            if (s === 'suspended' || s === 'inactive') return { backgroundColor: '#fff3e0', color: '#ef6c00' };
                                            return { backgroundColor: '#ffebee', color: '#c62828' };
                                        };
                                        return (
                                            <li {...props} key={option.id}>
                                                <Box sx={{ width: '100%' }}>
                                                    <Box display="flex" justifyContent="space-between" alignItems="center">
                                                        <Typography variant="body2" fontWeight="bold">
                                                            {option.employee_id}
                                                        </Typography>
                                                        {option.status && (
                                                            <Box
                                                                component="span"
                                                                sx={{
                                                                    height: '20px',
                                                                    fontSize: '10px',
                                                                    px: 1,
                                                                    borderRadius: '10px',
                                                                    ...getStatusChipStyles(option.status),
                                                                    textTransform: 'capitalize',
                                                                    ml: 1,
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                }}
                                                            >
                                                                {option.status}
                                                            </Box>
                                                        )}
                                                    </Box>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {option.name}
                                                    </Typography>
                                                    {(option.department_name || option.subdepartment_name || option.company) && (
                                                        <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '10px' }}>
                                                            {[option.department_name, option.subdepartment_name, option.company].filter(Boolean).join(' • ')}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            </li>
                                        );
                                    }}
                                />
                            </Grid>
                        )}
                    </Grid>
                </FormControl>
            </Box>

            {/* Footer */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 2 }}>
                <Button sx={{ color: '#666', textTransform: 'none', mr: 1 }}>Cancel</Button>
                <Button
                    variant="contained"
                    endIcon={<ArrowForwardIcon />}
                    sx={{
                        bgcolor: '#0c3b5c',
                        '&:hover': { bgcolor: '#072a42' },
                        textTransform: 'none',
                    }}
                    disabled={isDisabled}
                    onClick={goToMenu}
                >
                    Choose Menu
                </Button>
            </Box>
            </Box>

            <GuestCreateModal open={showGuestModal} onClose={() => setShowGuestModal(false)} onSuccess={handleGuestCreated} guestTypes={guestTypes} storeRouteName={routeNameForContext('customers.store')} memberSearchRouteName={routeNameForContext('api.users.global-search')} memberSearchParams={{ type: '0' }} />
        </>
    );
};
TakeAwayDialog.layout = (page) => page;
export default TakeAwayDialog;
