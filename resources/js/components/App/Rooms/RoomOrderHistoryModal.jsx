import React, { useState, useEffect } from 'react';
import { Modal, Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip } from '@mui/material';
import { Close } from '@mui/icons-material';
import axios from 'axios';

import dayjs from 'dayjs';

const RoomOrderHistoryModal = ({ open, onClose, bookingId }) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && bookingId) {
            fetchOrders();
        } else {
            setOrders([]);
        }
    }, [open, bookingId]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const response = await axios.get(route('api.room.booking.orders', bookingId));
            if (response.data.success) {
                setOrders(response.data.orders);
            }
        } catch (error) {
            console.error('Failed to fetch orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'paid':
                return 'success';
            case 'unpaid':
            case 'pending':
                return 'warning';
            case 'cancelled':
                return 'error';
            default:
                return 'default';
        }
    };

    return (
        <Modal open={open} onClose={onClose}>
            <Box
                sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '80%',
                    maxWidth: 900,
                    bgcolor: 'background.paper',
                    boxShadow: 24,
                    p: 4,
                    borderRadius: 2,
                    maxHeight: '90vh',
                    overflowY: 'auto',
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <Typography variant="h6" component="h2" style={{ fontWeight: 600, color: '#063455' }}>
                        Room Order History
                    </Typography>
                    <Button onClick={onClose} style={{ minWidth: 'auto' }}>
                        <Close />
                    </Button>
                </div>

                {loading ? (
                    <Typography>Loading...</Typography>
                ) : (
                    <TableContainer component={Paper} elevation={0} variant="outlined">
                        <Table>
                            <TableHead style={{ backgroundColor: '#f5f5f5' }}>
                                <TableRow>
                                    <TableCell>
                                        <strong>Order ID</strong>
                                    </TableCell>
                                    <TableCell>
                                        <strong>Date & Time</strong>
                                    </TableCell>
                                    <TableCell>
                                        <strong>Items</strong>
                                    </TableCell>
                                    <TableCell>
                                        <strong>Total</strong>
                                    </TableCell>
                                    <TableCell>
                                        <strong>Payment Status</strong>
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {orders.length > 0 ? (
                                    orders.map((order) => (
                                        <TableRow key={order.id}>
                                            <TableCell>#{order.id}</TableCell>
                                            <TableCell>{dayjs(order.created_at).format('DD-MM-YYYY')}</TableCell>
                                            <TableCell>
                                                <ul style={{ paddingLeft: '20px', margin: 0 }}>
                                                    {order.order_items &&
                                                        order.order_items.map((detail, index) => (
                                                            <li key={index}>
                                                                {detail.order_item?.name} (x{detail.order_item?.quantity})
                                                            </li>
                                                        ))}
                                                </ul>
                                            </TableCell>
                                            <TableCell>Rs {order.total_price}</TableCell>
                                            <TableCell>
                                                <Chip label={(order.payment_status || 'unpaid').toUpperCase()} color={getStatusColor(order.payment_status || 'unpaid')} size="small" variant="outlined" />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center">
                                            No orders found for this booking.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}

                <Box mt={3} display="flex" justifyContent="flex-end">
                    <Button variant="contained" onClick={onClose} style={{ backgroundColor: '#063455' }}>
                        Close
                    </Button>
                </Box>
            </Box>
        </Modal>
    );
};

export default RoomOrderHistoryModal;
