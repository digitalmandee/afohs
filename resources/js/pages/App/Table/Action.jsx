import { useOrderStore } from '@/stores/useOrderStore';
import { router } from '@inertiajs/react';
import { routeNameForContext } from '@/lib/utils';
import { Add as AddIcon, ChevronRight as ChevronRightIcon, RadioButtonUnchecked as CircleIcon, Close as CloseIcon, CallMerge as MergeIcon, OpenWith as MoveIcon } from '@mui/icons-material';
import { Box, Dialog, Divider, IconButton, List, ListItem, ListItemIcon, ListItemSecondaryAction, ListItemText, Paper, Switch, Typography } from '@mui/material';
import { useState } from 'react';
import OrderDetails from './OrderDetails';

const ActiveTable = ({ table = {}, tableName = 'Table', selectedDate, onClose }) => {
    const { handleOrderTypeChange } = useOrderStore();
    const [notAvailableActive, setNotAvailableActive] = useState(false);
    const [orderDrawerOpen, setOrderDrawerOpen] = useState(false);

    const toggleOrderDrawer = (open) => () => setOrderDrawerOpen(open);

    const handleToggleNotAvailable = () => setNotAvailableActive(!notAvailableActive);

    const handleAddNewReservation = () => {
        handleOrderTypeChange('reservation');

        router.visit(route(routeNameForContext('order.new')), {
            data: {
                table: table?.id,
                floor: table?.floor_id,
                date: selectedDate?.full_date,
                type: 'reservation',
            },
            preserveScroll: true,
            preserveState: true,
        });
    };

    // 🔹 Extract order or reservation
    const currentReservation = table?.reservations?.[0];
    const currentOrder = table?.orders?.[0];

    const reservationId = currentReservation?.id;
    const orderId = currentReservation?.order?.id || currentOrder?.id || table?.booked_by?.order_id;

    const orderType = currentReservation?.order?.order_type || currentOrder?.order_type || (reservationId ? 'reservation' : null);

    const hasReservationOrOrder = !!reservationId || !!orderId;

    return (
        <Paper
            elevation={0}
            sx={{
                width: '100%',
                borderRadius: 2,
                overflow: 'hidden',
            }}
        >
            {/* Header */}
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    px: 2,
                    py: 1,
                }}
            >
                <Box>
                    <Typography variant="h6" sx={{ fontWeight: 500, fontSize: '1.1rem' }}>
                        Actions
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                        Actions for {table?.table_no}
                    </Typography>
                </Box>
                <IconButton onClick={onClose} size="small">
                    <CloseIcon fontSize="small" />
                </IconButton>
            </Box>

            <Divider />

            {/* Action Items */}
            <List sx={{ py: 0 }}>
                {/* Add New Reservation */}
                <ListItem button onClick={handleAddNewReservation} sx={{ py: 1.5, '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' } }}>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                        <AddIcon sx={{ color: 'primary.main' }} />
                    </ListItemIcon>
                    <ListItemText
                        primary={
                            <Typography variant="body1" sx={{ fontWeight: 500, cursor: 'pointer' }}>
                                Add New Reservation
                            </Typography>
                        }
                    />
                    <ListItemSecondaryAction>
                        <ChevronRightIcon color="action" />
                    </ListItemSecondaryAction>
                </ListItem>

                {/* Show if has order or reservation */}
                {hasReservationOrOrder && (
                    <ListItem button onClick={toggleOrderDrawer(true)} sx={{ py: 1.5, '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' } }}>
                        <ListItemIcon sx={{ minWidth: 40 }}>
                            <AddIcon sx={{ color: 'primary.main' }} />
                        </ListItemIcon>
                        <ListItemText
                            primary={
                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                    Order / Reservation Details
                                </Typography>
                            }
                        />
                        <ListItemSecondaryAction>
                            <ChevronRightIcon color="action" />
                        </ListItemSecondaryAction>
                    </ListItem>
                )}

                <Divider />

                {/* Merge Table */}
                <ListItem button sx={{ py: 1.5, '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' } }}>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                        <MergeIcon sx={{ transform: 'rotate(90deg)' }} />
                    </ListItemIcon>
                    <ListItemText
                        primary={
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                Merge Table
                            </Typography>
                        }
                    />
                    <ListItemSecondaryAction>
                        <ChevronRightIcon color="action" />
                    </ListItemSecondaryAction>
                </ListItem>

                <Divider />

                {/* Move Table */}
                <ListItem button sx={{ py: 1.5, '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' } }}>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                        <MoveIcon />
                    </ListItemIcon>
                    <ListItemText
                        primary={
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                Move Table
                            </Typography>
                        }
                    />
                    <ListItemSecondaryAction>
                        <ChevronRightIcon color="action" />
                    </ListItemSecondaryAction>
                </ListItem>

                <Divider />

                {/* Not Available */}
                <ListItem sx={{ py: 1.5 }}>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                        <CircleIcon sx={{ color: 'text.secondary' }} />
                    </ListItemIcon>
                    <ListItemText
                        primary={
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                Not Available
                            </Typography>
                        }
                    />
                    <ListItemSecondaryAction>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="body2" color="text.secondary" sx={{ mr: 1, fontSize: '0.85rem' }}>
                                Inactive
                            </Typography>
                            <Switch
                                size="small"
                                checked={notAvailableActive}
                                onChange={handleToggleNotAvailable}
                                sx={{
                                    '& .MuiSwitch-thumb': {
                                        backgroundColor: notAvailableActive ? 'primary.main' : 'grey.400',
                                    },
                                }}
                            />
                        </Box>
                    </ListItemSecondaryAction>
                </ListItem>
            </List>

            {/* Drawer/Dialog for Details */}
            <Dialog
                open={orderDrawerOpen}
                onClose={toggleOrderDrawer(false)}
                fullWidth
                maxWidth="sm"
                PaperProps={{
                    sx: {
                        borderRadius: 1,
                        m: 0,
                        position: 'fixed',
                        right: 0,
                        top: 0,
                        height: '100%',
                        maxHeight: '100%',
                    },
                }}
            >
                {hasReservationOrOrder ? <OrderDetails orderId={orderId || reservationId} type={orderId ? 'order' : 'reservation'} onClose={toggleOrderDrawer(false)} /> : <Typography sx={{ p: 3 }}>No active order or reservation for this table.</Typography>}
            </Dialog>
        </Paper>
    );
};
ActiveTable.layout = (page) => page;
export default ActiveTable;
