import React, { useState, useEffect } from 'react';
import { Button, Typography, IconButton, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Pagination } from '@mui/material';
import { ArrowBack as ArrowBackIcon, Restore as RestoreIcon } from '@mui/icons-material';
import { router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { enqueueSnackbar } from 'notistack';
import Tooltip from '@mui/material/Tooltip';

const TrashedCustomers = ({ customerData }) => {
    const [customers, setCustomers] = useState(customerData.data || []);
    const { props } = usePage();
    const csrfToken = props._token;

    useEffect(() => {
        setCustomers(customerData.data || []);
    }, [customerData]);

    const handleRestore = async (id) => {
        if (!confirm('Are you sure you want to restore this customer?')) return;

        try {
            await axios.post(
                route('guests.restore', id),
                {},
                {
                    headers: { 'X-CSRF-TOKEN': csrfToken },
                },
            );
            router.reload({ only: ['customerData'] });
            enqueueSnackbar('Customer restored successfully.', { variant: 'success' });
        } catch (error) {
            enqueueSnackbar('Failed to restore: ' + (error.response?.data?.message || error.message), {
                variant: 'error',
            });
        }
    };

    const handlePageChange = (event, value) => {
        router.get(
            route('guests.trashed'),
            { page: value },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    return (
        <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f5f5', padding: '20px' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <IconButton onClick={() => window.history.back()}>
                        <ArrowBackIcon sx={{ color: '#063455' }} />
                    </IconButton>
                    <Typography sx={{ fontWeight: 700, fontSize: '30px', color: '#063455' }}>Trashed Customers</Typography>
                </Box>
            </Box>

            <TableContainer component={Paper} style={{ boxShadow: 'none', overflowX: 'auto', borderRadius: '16px' }}>
                <Table>
                    <TableHead>
                        <TableRow style={{ backgroundColor: '#dc3545', height: '60px' }}>
                            <TableCell sx={{ color: '#fff', fontSize: '16px', fontWeight: 600 }}>Customer No</TableCell>
                            <TableCell sx={{ color: '#fff', fontSize: '16px', fontWeight: 600 }}>Name</TableCell>
                            <TableCell sx={{ color: '#fff', fontSize: '16px', fontWeight: 600 }}>Email</TableCell>
                            <TableCell sx={{ color: '#fff', fontSize: '16px', fontWeight: 600 }}>Action</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {customers.length > 0 ? (
                            customers.map((customer) => (
                                <TableRow key={customer.id} style={{ borderBottom: '1px solid #eee' }}>
                                    <TableCell sx={{ color: '#7F7F7F', fontSize: '14px', fontWeight: '400' }}>{customer.customer_no}</TableCell>
                                    <TableCell sx={{ color: '#7F7F7F', fontSize: '14px', fontWeight: '400' }}>{customer.name}</TableCell>
                                    <TableCell
                                        sx={{
                                            color: '#7F7F7F',
                                            fontSize: '14px',
                                            fontWeight: '400',
                                            maxWidth: '150px',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                        }}
                                    >
                                        <Tooltip title={customer.email} placement="top">
                                            <span>{customer.email}</span>
                                        </Tooltip>
                                    </TableCell>
                                    <TableCell>
                                        <Button startIcon={<RestoreIcon />} onClick={() => handleRestore(customer.id)} size="small" variant="outlined" color="primary">
                                            Restore
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} align="center" sx={{ py: 3, color: '#999' }}>
                                    No trashed customers found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, mb: 3 }}>
                <Pagination count={customerData.last_page} page={customerData.current_page} onChange={handlePageChange} color="primary" />
            </Box>
        </Box>
    );
};

export default TrashedCustomers;
