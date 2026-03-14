import { useForm } from '@inertiajs/react';
import { useRef, useState } from 'react';

import { Alert, Box, Button, TextField, Typography } from '@mui/material'; // MUI components
import { Col, Container, Row } from 'react-bootstrap'; // Bootstrap Grid System


const Password = () => {
    // const [open, setOpen] = useState(true);
    const passwordInput = useRef(null);
    const currentPasswordInput = useRef(null);

    const { data, setData, errors, put, reset, processing, recentlySuccessful } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const updatePassword = (e) => {
        e.preventDefault();

        put(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => reset(),
            onError: (errors) => {
                if (errors.password) {
                    reset('password', 'password_confirmation');
                    passwordInput.current?.focus();
                }
                if (errors.current_password) {
                    reset('current_password');
                    currentPasswordInput.current?.focus();
                }
            },
        });
    };

    return (
        <>
            {/* <SideNav open={open} setOpen={setOpen} /> */}
            <div
                style={{
                    minHeight: '100vh',
                    backgroundColor: '#f5f5f5',
                    paddingTop:'1rem'
                }}
            >
                <Typography style={{ color: '#063455', fontWeight: 700, marginLeft:'30px', fontSize:'30px' }}>
                    Password
                </Typography>
                <Box style={{ maxWidth: '600px', margin:'0 auto', padding: '2rem' }}>

                    <Box
                        sx={{
                            borderRadius: '20px',
                            border: '1px solid #ccc',
                            backgroundColor: '#fff',
                            padding: '2rem',
                            boxShadow: '0 0 10px rgba(0,0,0,0.05)',
                        }}
                    >
                        <header>
                            <h3>Update Password</h3>
                            <p>Ensure your account is using a long, random password to stay secure.</p>
                        </header>

                        <form onSubmit={updatePassword} style={{ marginTop: '1.5rem' }}>
                            <div style={{ marginBottom: '1rem' }}>
                                <TextField
                                    id="current_password"
                                    label="Current Password"
                                    ref={currentPasswordInput}
                                    type="password"
                                    value={data.current_password}
                                    onChange={(e) => setData('current_password', e.target.value)}
                                    autoComplete="current-password"
                                    fullWidth
                                    error={!!errors.current_password}
                                    helperText={errors.current_password}
                                    variant="outlined"
                                />
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <TextField
                                    id="password"
                                    label="New Password"
                                    ref={passwordInput}
                                    type="password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    autoComplete="new-password"
                                    fullWidth
                                    error={!!errors.password}
                                    helperText={errors.password}
                                    variant="outlined"
                                />
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <TextField
                                    id="password_confirmation"
                                    label="Confirm Password"
                                    type="password"
                                    value={data.password_confirmation}
                                    onChange={(e) => setData('password_confirmation', e.target.value)}
                                    autoComplete="new-password"
                                    fullWidth
                                    error={!!errors.password_confirmation}
                                    helperText={errors.password_confirmation}
                                    variant="outlined"
                                />
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <Button type="submit" variant="contained" color="primary" disabled={processing} sx={{textTransform:'none'}}>
                                    Save Password
                                </Button>
                                {recentlySuccessful && (
                                    <Alert variant="filled" severity="success" style={{ padding: '0.25rem 0.75rem', marginBottom: 0 }}>
                                        Saved
                                    </Alert>
                                )}
                            </div>
                        </form>
                    </Box>
                </Box>
            </div>
        </>
    );
};

export default Password;
