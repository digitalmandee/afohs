import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Button, Typography, IconButton, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from '@mui/material';
import { ArrowBack as ArrowBackIcon, Edit as EditIcon, Delete as DeleteIcon, Add } from '@mui/icons-material';
import { router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { enqueueSnackbar } from 'notistack';
import POSLayout from "@/components/POSLayout";
import { FaEdit } from 'react-icons/fa';
import { routeNameForContext } from '@/lib/utils';

// const drawerWidthOpen = 240;
// const drawerWidthClosed = 110;

const ManageCustomer = ({ customerData }) => {
    const [open, setOpen] = useState(true);
    const [customers, setCustomers] = useState(customerData || []);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [customerToDelete, setCustomerToDelete] = useState(null);
    const { props } = usePage();
    const csrfToken = props._token;

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
            await axios.delete(route(routeNameForContext('customers.destroy'), customerToDelete.id), {
                headers: { 'X-CSRF-TOKEN': csrfToken },
            });
            setCustomers((prev) => prev.filter((c) => c.id !== customerToDelete.id));
            enqueueSnackbar('Customer deleted successfully.', { variant: 'success' });
        } catch (error) {
            enqueueSnackbar('Failed to delete: ' + (error.response?.data?.message || error.message), {
                variant: 'error',
            });
        } finally {
            cancelDelete();
        }
    };

    return (
        <>
            {/* <SideNav open={open} setOpen={setOpen} />
            <div
                style={{

                    marginLeft: open ? `${drawerWidthOpen}px` : `${drawerWidthClosed}px`,
                    transition: 'margin-left 0.3s ease-in-out',
                    marginTop: '5rem',
                    minHeight: '100vh',
                    backgroundColor: '#f5f5f5',
                    padding: '20px',
                }}
            > */}
            <Box sx={{
                bgcolor: '#f5f5f5',
                p: 2,
                minHeight: '100vh'
            }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography sx={{ fontWeight: '600', color: '#063455', fontSize: '30px' }}>
                            Customers
                        </Typography>
                    </Box>
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        sx={{
                            backgroundColor: '#063455',
                            borderRadius: '16px',
                            height: 35,
                            textTransform: 'none'
                        }} onClick={() => router.visit(route(routeNameForContext('customers.create')))}>
                        Add Customer
                    </Button>
                </Box>

                <TableContainer component={Paper} style={{ boxShadow: 'none' }}>
                    <Table>
                        <TableHead>
                            <TableRow style={{ backgroundColor: '#063455', }}>
                                <TableCell sx={{ color: '#fff', fontWeight: 600 }}>ID</TableCell>
                                <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Customer No</TableCell>
                                <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Name</TableCell>
                                <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Email</TableCell>
                                <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Action</TableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {customers.length > 0 ? (
                                customers.map((customer, index) => (
                                    <TableRow key={customer.id} style={{ borderBottom: '1px solid #eee' }}>
                                        <TableCell sx={{ color: '#7F7F7F', fontSize: '14px' }}>{index + 1}</TableCell>
                                        <TableCell sx={{ color: '#7F7F7F', fontSize: '14px' }}>{customer.customer_no}</TableCell>
                                        <TableCell sx={{ color: '#7F7F7F', fontSize: '14px' }}>{customer.name}</TableCell>
                                        <TableCell sx={{ color: '#7F7F7F', fontSize: '14px' }}>{customer.email}</TableCell>
                                        <TableCell>
                                            <IconButton onClick={() => router.visit(route(routeNameForContext('customers.edit'), customer.id))} size="small" title="Edit">
                                                <FaEdit size={16} style={{ marginRight: 8, color: '#f57c00' }} />
                                            </IconButton>
                                            <IconButton onClick={() => confirmDelete(customer)} size="small" color='error' title="Delete">
                                                <DeleteIcon fontSize="small" />
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
                {/* </div> */}
            </Box>

            {/* Delete Confirmation Dialog */}
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
ManageCustomer.layout = (page) => <POSLayout>{page}</POSLayout>;
export default ManageCustomer;
