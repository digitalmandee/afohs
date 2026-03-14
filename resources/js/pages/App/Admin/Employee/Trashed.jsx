import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react'; // Import router
import { Box, Paper, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Snackbar, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Pagination, Chip, CircularProgress } from '@mui/material';
import { RestoreFromTrash, DeleteForever, ArrowBack } from '@mui/icons-material';

const Trashed = ({ employees }) => {
    const [confirmDialog, setConfirmDialog] = useState({ open: false, id: null, type: null }); // type: 'restore' | 'delete'
    const [snackbar, setSnackbar] = useState({ open: false, message: '' });
    const [processing, setProcessing] = useState(false);

    const handleRestore = (id) => {
        setConfirmDialog({ open: true, id, type: 'restore' });
    };

    const handleDelete = (id) => {
        setConfirmDialog({ open: true, id, type: 'delete' });
    };

    const handleConfirm = () => {
        setProcessing(true);
        const { id, type } = confirmDialog;
        const routeName = type === 'restore' ? 'employees.restore' : 'employees.force-delete';
        const method = type === 'restore' ? 'post' : 'delete';

        router[method](route(routeName, id), {
            onSuccess: () => {
                setSnackbar({
                    open: true,
                    message: type === 'restore' ? 'Employee restored successfully' : 'Employee permanently deleted',
                });
                setConfirmDialog({ open: false, id: null, type: null });
                setProcessing(false);
            },
            onError: () => {
                setSnackbar({ open: true, message: 'An error occurred' });
                setProcessing(false);
            },
        });
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    return (
        <>
            <Head title="Trashed Employees" />
            <div>
                <Box
                    component="main"
                    sx={{
                        flexGrow: 1,
                        p: 3,
                        backgroundColor: '#f5f5f5',
                        minHeight: '100vh',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                        <IconButton onClick={() => router.visit(route('employees.dashboard'))} sx={{ mr: 1, color: '#063455' }}>
                            <ArrowBack />
                        </IconButton>
                        <h2 style={{ margin: 0, fontWeight: '600', color: '#0A3D62' }}>Trashed Employees</h2>
                    </div>

                    <TableContainer component={Paper} style={{ borderRadius: '12px', boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.05)' }}>
                        <Table>
                            <TableHead style={{ backgroundColor: '#063455' }}>
                                <TableRow>
                                    <TableCell style={{ color: '#fff', fontWeight: 'bold' }}>EMP ID</TableCell>
                                    <TableCell style={{ color: '#fff', fontWeight: 'bold' }}>Name</TableCell>
                                    <TableCell style={{ color: '#fff', fontWeight: 'bold' }}>Company</TableCell>
                                    <TableCell style={{ color: '#fff', fontWeight: 'bold' }}>Deleted At</TableCell>
                                    <TableCell style={{ color: '#fff', fontWeight: 'bold' }}>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {employees?.data?.length > 0 ? (
                                    employees.data.map((emp) => (
                                        <TableRow key={emp.id} hover>
                                            <TableCell>{emp.employee_id}</TableCell>
                                            <TableCell>
                                                <Box>
                                                    <Typography variant="body2" fontWeight={600}>
                                                        {emp.name}
                                                    </Typography>
                                                    <Typography variant="caption" color="textSecondary">
                                                        {emp.email}
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell>{emp.branch ? emp.branch.name : 'N/A'}</TableCell>
                                            <TableCell>{new Date(emp.deleted_at).toLocaleDateString()}</TableCell>
                                            <TableCell>
                                                <IconButton onClick={() => handleRestore(emp.id)} color="primary" title="Restore">
                                                    <RestoreFromTrash />
                                                </IconButton>
                                                <IconButton onClick={() => handleDelete(emp.id)} color="error" title="Permanently Delete">
                                                    <DeleteForever />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center" style={{ py: 3 }}>
                                            No trshed employees found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {/* Pagination */}
                    {employees?.last_page > 1 && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                            <Pagination count={employees.last_page} page={employees.current_page} onChange={(e, page) => router.get(route('employees.trashed'), { page })} color="primary" />
                        </Box>
                    )}

                    {/* Confirmation Dialog */}
                    <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}>
                        <DialogTitle>{confirmDialog.type === 'restore' ? 'Restore Employee?' : 'Permanently Delete?'}</DialogTitle>
                        <DialogContent>
                            <DialogContentText>{confirmDialog.type === 'restore' ? 'Are you sure you want to restore this employee?' : 'This action cannot be undone. All data associated with this employee will be permanently removed.'}</DialogContentText>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}>Cancel</Button>
                            <Button onClick={handleConfirm} color={confirmDialog.type === 'restore' ? 'primary' : 'error'} disabled={processing} variant="contained">
                                {processing ? <CircularProgress size={24} /> : confirmDialog.type === 'restore' ? 'Restore' : 'Delete'}
                            </Button>
                        </DialogActions>
                    </Dialog>

                    {/* Snackbar */}
                    <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={handleCloseSnackbar} message={snackbar.message} />
                </Box>
            </div>
        </>
    );
};

export default Trashed;
