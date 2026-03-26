import UserAutocomplete from '@/components/UserAutocomplete';
import GuestCreateModal from '@/components/GuestCreateModal';
import { useOrderStore } from '@/stores/useOrderStore';
import { router } from '@inertiajs/react';
import { routeNameForContext } from '@/lib/utils';
import { Autocomplete, Box, FormControl, Grid, TextField, Typography } from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { enqueueSnackbar } from 'notistack';
import { OrderActionFooter, OrderMemberTypeSelector, OrderMetaStrip, OrderSection } from './Shared';

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
            axios.get(route(routeNameForContext('riders.all'))).then((response) => {
                if (response.data.success) {
                    setRiders(response.data.riders);
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
        const handleKeyDown = (event) => {
            if (event.key === 'F10' && !isDisabled) {
                event.preventDefault();
                goToMenu();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [goToMenu, isDisabled]);

    return (
        <>
            <Box sx={{ py: 0.6 }}>
                <Box sx={{ px: { xs: 1.5, md: 1.8 }, pb: 0.9 }}>
                    <OrderMetaStrip
                        value={`#${orderDetails.order_no}`}
                        secondaryLabel="Mode"
                        secondaryValue={orderDetails.order_type === 'delivery' ? 'Delivery' : 'Takeaway'}
                    />
                </Box>

                <OrderSection
                    title={orderDetails.order_type === 'delivery' ? 'Customer & Delivery Setup' : 'Customer Setup'}
                    subtitle="Identify the customer first, then capture delivery details only when required."
                >
                    <Grid container spacing={1.25}>
                        <Grid item xs={12}>
                            <OrderMemberTypeSelector
                                guestTypes={guestTypes}
                                value={orderDetails.member_type}
                                onChange={(value) => {
                                    handleOrderDetailChange('member_type', value);
                                    handleOrderDetailChange('member', {});
                                }}
                            />
                        </Grid>

                        <Grid item xs={12} lg={8}>
                            <Typography variant="body2" sx={{ mb: 0.45, fontWeight: 700, color: '#243b53', fontSize: '0.82rem' }}>
                                Customer Name
                            </Typography>
                            <Box display="flex" alignItems="center" gap={0.8}>
                                <Box sx={{ flexGrow: 1 }}>
                                    <UserAutocomplete
                                        routeUri={route(routeNameForContext('api.users.global-search'))}
                                        memberType={orderDetails.member_type}
                                        value={orderDetails.member && orderDetails.member.id ? orderDetails.member : null}
                                        onChange={(newValue) => handleMemberChange(newValue || null)}
                                        label="Member / Guest Name"
                                        placeholder="Search by Name, ID, or CNIC..."
                                    />
                                </Box>
                                <Box sx={{ minWidth: { xs: 82, sm: 94 } }}>
                                    <Box
                                        component="button"
                                        type="button"
                                        onClick={() => setShowGuestModal(true)}
                                        style={{
                                            width: '100%',
                                            height: 38,
                                            borderRadius: 10,
                                            border: 'none',
                                            background: '#063455',
                                            color: '#fff',
                                            fontWeight: 800,
                                            cursor: 'pointer',
                                        }}
                                    >
                                        + Add
                                    </Box>
                                </Box>
                            </Box>
                        </Grid>

                        {requiresAddress ? (
                            <Grid item xs={12} lg={4}>
                                <Typography variant="body2" sx={{ mb: 0.45, fontWeight: 700, color: '#243b53', fontSize: '0.82rem' }}>
                                    Delivery Address
                                </Typography>
                                <TextField
                                    placeholder="Enter delivery address"
                                    fullWidth
                                    size="small"
                                    value={orderDetails.address || ''}
                                    onChange={(event) => handleOrderDetailChange('address', event.target.value)}
                                />
                            </Grid>
                        ) : null}

                        {orderDetails.order_type === 'delivery' ? (
                            <Grid item xs={12} lg={6}>
                                <Typography variant="body2" sx={{ mb: 0.45, fontWeight: 700, color: '#243b53', fontSize: '0.82rem' }}>
                                    Assign Rider
                                </Typography>
                                <Autocomplete
                                    fullWidth
                                    size="small"
                                    options={riders}
                                    value={riders.find((rider) => rider.id === orderDetails.rider_id) || null}
                                    getOptionLabel={(option) => option.name || ''}
                                    onChange={(event, newValue) => {
                                        handleOrderDetailChange('rider_id', newValue ? newValue.id : null);
                                    }}
                                    filterOptions={(options, state) =>
                                        options.filter((option) =>
                                            `${option.name} ${option.email} ${option.employee_id}`.toLowerCase().includes(state.inputValue.toLowerCase()),
                                        )
                                    }
                                    renderInput={(params) => <TextField {...params} fullWidth placeholder="Select Rider" variant="outlined" size="small" />}
                                    renderOption={(props, option) => {
                                        const getStatusChipStyles = (status) => {
                                            const normalized = (status || '').toLowerCase();
                                            if (normalized === 'active') return { backgroundColor: '#e8f5e9', color: '#2e7d32' };
                                            if (normalized === 'suspended' || normalized === 'inactive') return { backgroundColor: '#fff3e0', color: '#ef6c00' };
                                            return { backgroundColor: '#ffebee', color: '#c62828' };
                                        };
                                        return (
                                            <li {...props} key={option.id}>
                                                <Box sx={{ width: '100%' }}>
                                                    <Box display="flex" justifyContent="space-between" alignItems="center">
                                                        <Typography variant="body2" fontWeight={700}>
                                                            {option.employee_id}
                                                        </Typography>
                                                        {option.status ? (
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
                                                        ) : null}
                                                    </Box>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {option.name}
                                                    </Typography>
                                                </Box>
                                            </li>
                                        );
                                    }}
                                />
                            </Grid>
                        ) : null}
                    </Grid>
                </OrderSection>

                <OrderActionFooter primaryDisabled={isDisabled} onPrimary={goToMenu} />
            </Box>

            <GuestCreateModal
                open={showGuestModal}
                onClose={() => setShowGuestModal(false)}
                onSuccess={handleGuestCreated}
                guestTypes={guestTypes}
                storeRouteName={routeNameForContext('customers.store')}
                memberSearchRouteName={routeNameForContext('api.users.global-search')}
                memberSearchParams={{ type: '0' }}
            />
        </>
    );
};

TakeAwayDialog.layout = (page) => page;
export default TakeAwayDialog;
