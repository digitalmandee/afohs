import POSLayout from '@/components/POSLayout';
import { router, usePage } from '@inertiajs/react';
import { Add, Delete as DeleteIcon } from '@mui/icons-material';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton, Pagination, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import axios from 'axios';
import { enqueueSnackbar } from 'notistack';
import React, { useEffect, useState } from 'react';
import { FaEdit } from 'react-icons/fa';
import Tooltip from '@mui/material/Tooltip';

const CustomersIndex = ({ customerData }) => {
    const [customers, setCustomers] = useState(customerData.data || []);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [customerToDelete, setCustomerToDelete] = useState(null);
    const { props } = usePage();
    const csrfToken = props._token;

    useEffect(() => {
        setCustomers(customerData.data || []);
    }, [customerData]);

    const confirmDelete = (customer) => {
        setCustomerToDelete(customer);
        setDeleteDialogOpen(true);
    };

    const cancelDelete = () => {
        setCustomerToDelete(null);
        setDeleteDialogOpen(false);
    };

    const handleDelete = async () => {
        if (!customerToDelete) return;

        try {
            await axios.delete(route('pos.customers.destroy', customerToDelete.id), {
                headers: { 'X-CSRF-TOKEN': csrfToken },
            });
            router.reload({ only: ['customerData'] });
            enqueueSnackbar('Customer deleted successfully.', { variant: 'success' });
        } catch (error) {
            enqueueSnackbar('Failed to delete: ' + (error.response?.data?.message || error.message), {
                variant: 'error',
            });
        } finally {
            cancelDelete();
        }
    };

    const handlePageChange = (event, value) => {
        router.get(
            route('pos.customers.index'),
            { page: value },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    return (
        <>
            <Box
                sx={{
                    minHeight: '100vh',
                    backgroundColor: '#f5f5f5',
                    padding: '20px',
                }}
            >
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }} onClick={() => router.visit(route('pos.dashboard'))}>
                        <Typography sx={{ fontWeight: 700, fontSize: '30px', color: '#063455' }}>Customers</Typography>
                    </Box>

                    <Button variant="contained" startIcon={<Add />} sx={{ backgroundColor: '#063455', borderRadius: '16px', height: 35, textTransform: 'none' }} onClick={() => router.visit(route('pos.customers.create'))}>
                        Add Customer
                    </Button>
                </Box>

                <Typography style={{ color: '#063455', fontSize: '15px', fontWeight: '600' }}>View and manage registered guests currently staying or scheduled to arrive</Typography>

                <TableContainer style={{ overflowX: 'auto', borderRadius: '16px', marginTop: '2rem' }}>
                    <Table>
                        
                        <TableHead>
                            <TableRow style={{ backgroundColor: '#063455', }}>
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
                                        <TableCell
                                            sx={{
                                                color: '#000',
                                                fontSize: '14px',
                                                fontWeight: '600',
                                                width: 100,
                                                minWidth: 100,
                                                maxWidth: 100,
                                                padding: '8px',
                                                boxSizing: 'border-box',
                                            }}>
                                            {customer.customer_no}
                                        </TableCell>
                                        <TableCell
                                            sx={{
                                                color: '#7F7F7F',
                                                fontSize: '14px',
                                                fontWeight: '400',
                                                maxWidth: '70px',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                            }}
                                        >
                                            <Tooltip title={customer.name} placement="top">
                                                <span>{customer.name}</span>
                                            </Tooltip>
                                        </TableCell>
                                        <TableCell
                                            sx={{
                                                color: '#7F7F7F',
                                                fontSize: '14px',
                                                fontWeight: '400',
                                                maxWidth: '100px',
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
                                            <IconButton onClick={() => router.visit(route('pos.customers.edit', customer.id))} size="small" title="Edit">
                                                <FaEdit size={16} style={{ marginRight: 8, color: '#f57c00' }} />
                                            </IconButton>
                                            <IconButton onClick={() => confirmDelete(customer)} size="small" title="Delete">
                                                <DeleteIcon fontSize="small" sx={{ color: '#d32f2f' }} />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 3, color: '#999' }}>
                                        No customers found.
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

            <Dialog open={deleteDialogOpen} onClose={cancelDelete} aria-labelledby="delete-dialog-title">
                <DialogTitle id="delete-dialog-title">Delete Customer</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete <strong>{customerToDelete?.name}</strong>?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={cancelDelete}>Cancel</Button>
                    <Button onClick={handleDelete} color="error" variant="contained">
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default CustomersIndex;

CustomersIndex.layout = (page) => <POSLayout>{page}</POSLayout>;
