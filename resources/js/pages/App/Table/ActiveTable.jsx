import { useState } from 'react';
import { Add as AddIcon, ChevronRight as ChevronRightIcon, Close as CloseIcon, CallMerge as MergeIcon, OpenWith as MoveIcon } from '@mui/icons-material';
import { Box, Dialog, Divider, IconButton, List, ListItem, ListItemIcon, ListItemSecondaryAction, ListItemText, Paper, Typography } from '@mui/material';
import OrderDetails from './OrderDetails';

const ActiveTable = ({ table, floorName, onClose }) => {
    const [orderDrawerOpen, setOrderDrawerOpen] = useState(false);

    const toggleOrderDrawer = (open) => () => {
        setOrderDrawerOpen(open);
    };

    // Extract the correct order id (from reservation or direct order)
    const orderId = table?.reservations?.[0]?.order?.id || table?.orders?.[0]?.id || table?.booked_by?.order_id;

    const orderType = table?.reservations?.[0]?.order?.order_type || table?.orders?.[0]?.order_type;

    // Counts
    const reservationCount = table?.reservations?.length || 0;
    const orderCount = table?.orders?.length || 0;

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
                <Typography variant="h5" sx={{ fontWeight: 500 }}>
                    Table #{table.table_no}
                </Typography>
                <IconButton onClick={onClose} size="small">
                    <CloseIcon fontSize="small" />
                </IconButton>
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem', px: 2.5, py: 1 }}>
                {floorName}
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem', px: 2.5 }}>
                Capacity: {table.capacity}
            </Typography>

            {orderType && (
                <Typography variant="body2" color="text.primary" sx={{ fontSize: '0.9rem', px: 2.5 }}>
                    Order Type: {orderType}
                </Typography>
            )}

            {/* Reservation & Orders Count */}
            <Typography variant="body2" color="text.primary" sx={{ fontSize: '0.9rem', px: 2.5, pb: 1 }}>
                Reservations: {reservationCount} | Direct Orders: {orderCount}
            </Typography>

            <Divider />

            {/* Action Items */}
            <List sx={{ py: 0 }}>
                {/* View Order Details */}
                <ListItem
                    button
                    onClick={toggleOrderDrawer(true)}
                    sx={{
                        py: 1.5,
                        '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' },
                    }}
                >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                        <AddIcon sx={{ color: 'primary.main' }} />
                    </ListItemIcon>
                    <ListItemText
                        primary={
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                Order Details
                            </Typography>
                        }
                    />
                    <ListItemSecondaryAction>
                        <ChevronRightIcon color="action" />
                    </ListItemSecondaryAction>
                </ListItem>

                <Divider />

                {/* Merge Table */}
                <ListItem
                    button
                    sx={{
                        py: 1.5,
                        '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' },
                    }}
                >
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
                <ListItem
                    button
                    sx={{
                        py: 1.5,
                        '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' },
                    }}
                >
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
            </List>

            {/* Order Details Drawer */}
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
                {orderId ? <OrderDetails orderId={orderId} onClose={toggleOrderDrawer(false)} /> : <Typography sx={{ p: 3 }}>No order found for this table.</Typography>}
            </Dialog>
        </Paper>
    );
};
ActiveTable.layout = (page) => page;
export default ActiveTable;
