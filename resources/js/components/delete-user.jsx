import { useForm } from '@inertiajs/react';
import { useRef, useState } from 'react';

import { Box, Button, Paper, TextField, Typography } from '@mui/material'; // MUI components

import { Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material'; // MUI Dialog

const DeleteUser = () => {
    const passwordInput = useRef(null);
    const [open, setOpen] = useState(false); // State to control the dialog visibility

    const {
        data,
        setData,
        delete: destroy,
        processing,
        reset,
        errors,
        clearErrors,
    } = useForm({
        password: '',
    });

    const deleteUser = (e) => {
        e.preventDefault();

        destroy(route('profile.destroy'), {
            preserveScroll: true,
            onSuccess: () => closeModal(),
            onError: () => passwordInput.current?.focus(),
            onFinish: () => reset(),
        });
    };

    const closeModal = () => {
        clearErrors();
        reset();
        setOpen(false); // Close the dialog after the form submission
    };

    const openModal = () => setOpen(true); // Function to open the dialog

    return (
        <Box sx={{ mb: 4 }}>
        <header>
            <h3>Delete account</h3>
            <p>Delete your account and all of its resources</p>
        </header>

            {/* Warning Box */}
            <Paper sx={{ p: 4, borderRadius: 2, backgroundColor: '#f8d7da', borderColor: '#f5c6cb', boxShadow: 3 }}>
                <Typography variant="body2" color="error" fontWeight="bold">
                    Warning
                </Typography>
                <Typography variant="body2" color="textSecondary">
                    Please proceed with caution, this cannot be undone.
                </Typography>
            </Paper>

            {/* Dialog for Confirming Deletion */}
            <Dialog open={open} onClose={closeModal}>
                <DialogTitle>Are you sure you want to delete your account?</DialogTitle>
                <DialogContent>
                    <Typography variant="body2">
                        Once your account is deleted, all of its resources and data will also be permanently deleted. Please enter your password to
                        confirm you would like to permanently delete your account.
                    </Typography>
                    <form onSubmit={deleteUser} style={{ marginTop: 16 }}>
                        <TextField
                            id="password"
                            type="password"
                            name="password"
                            ref={passwordInput}
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            placeholder="Password"
                            autoComplete="current-password"
                            fullWidth
                            margin="normal"
                            variant="outlined"
                            sx={{ mb: 2 }}
                        />
                        {errors.password && <Typography variant="body2" color="error">{errors.password}</Typography>}
                        <DialogActions>
                            <Button onClick={closeModal} color="secondary">
                                Cancel
                            </Button>
                            <Button type="submit" variant="contained" color="error" disabled={processing} sx={{textTransform:'none'}}>
                                Delete account
                            </Button>
                        </DialogActions>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Button to Trigger the Dialog */}
            <Button variant="contained" color="error" onClick={openModal} sx={{ mt: 2 }}>
                Delete Account
            </Button>
        </Box>
    );
};

export default DeleteUser;

