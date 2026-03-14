import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { Box, Paper, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Snackbar, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Pagination, CircularProgress } from '@mui/material';
import { RestoreFromTrash, DeleteForever, ArrowBack } from '@mui/icons-material';

const Trashed = ({ subdepartments }) => {
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
        const routeName = type === 'restore' ? 'employees.subdepartments.restore' : 'employees.subdepartments.force-delete';
        const method = type === 'restore' ? 'post' : 'delete';

        router[method](route(routeName, id), {
            onSuccess: () => {
                setSnackbar({
                    open: true,
                    message: type === 'restore' ? 'Subdepartment restored successfully' : 'Subdepartment permanently deleted',
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
            <Head title="Trashed Subdepartments" />
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
                        <IconButton onClick={() => router.visit(route('employees.subdepartments'))} sx={{ mr: 1, color: '#063455' }}>
                            <ArrowBack />
                        </IconButton>
                        <h2 style={{ margin: 0, fontWeight: '600', color: '#063455' }}>Trashed Subdepartments</h2>
                    </div>

                    <TableContainer component={Paper} style={{ borderRadius: '12px', boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.05)' }}>
                        <Table>
                            <TableHead style={{ backgroundColor: '#063455' }}>
                                <TableRow>
                                    <TableCell style={{ color: '#fff', fontWeight: 'bold' }}>Subdepartment Name</TableCell>
                                    <TableCell style={{ color: '#fff', fontWeight: 'bold' }}>Department</TableCell>
                                    <TableCell style={{ color: '#fff', fontWeight: 'bold' }}>Deleted At</TableCell>
                                    <TableCell style={{ color: '#fff', fontWeight: 'bold' }}>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {subdepartments?.data?.length > 0 ? (
                                    subdepartments.data.map((sub) => (
                                        <TableRow key={sub.id} hover>
                                            <TableCell>{sub.name}</TableCell>
                                            <TableCell>{sub.department ? sub.department.name : 'N/A'}</TableCell>
                                            <TableCell>{new Date(sub.deleted_at).toLocaleDateString()}</TableCell>
                                            <TableCell>
                                                <IconButton onClick={() => handleRestore(sub.id)} color="primary" title="Restore">
                                                    <RestoreFromTrash />
                                                </IconButton>
                                                <IconButton onClick={() => handleDelete(sub.id)} color="error" title="Permanently Delete">
                                                    <DeleteForever />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} align="center" style={{ py: 3 }}>
                                            No trashed subdepartments found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {/* Pagination */}
                    {subdepartments?.last_page > 1 && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                            <Pagination count={subdepartments.last_page} page={subdepartments.current_page} onChange={(e, page) => router.get(route('employees.subdepartments.trashed'), { page })} color="primary" />
                        </Box>
                    )}

                    {/* Confirmation Dialog */}
                    <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}>
                        <DialogTitle>{confirmDialog.type === 'restore' ? 'Restore Subdepartment?' : 'Permanently Delete?'}</DialogTitle>
                        <DialogContent>
                            <DialogContentText>{confirmDialog.type === 'restore' ? 'Are you sure you want to restore this subdepartment?' : 'This action cannot be undone. All data associated with this subdepartment will be permanently removed.'}</DialogContentText>
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
