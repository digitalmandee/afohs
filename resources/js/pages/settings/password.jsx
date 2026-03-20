import { useForm } from '@inertiajs/react';
import React, { useRef } from 'react';
import { Alert, Box, Button, TextField } from '@mui/material';
import AppPage from '@/components/App/ui/AppPage';
import SurfaceCard from '@/components/App/ui/SurfaceCard';

const Password = () => {
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
            onError: (formErrors) => {
                if (formErrors.password) {
                    reset('password', 'password_confirmation');
                    passwordInput.current?.focus();
                }
                if (formErrors.current_password) {
                    reset('current_password');
                    currentPasswordInput.current?.focus();
                }
            },
        });
    };

    return (
        <Box sx={{ p: { xs: 2, md: 3 } }}>
            <AppPage
                eyebrow="Account Settings"
                title="Password"
                subtitle="Use a strong password and manage it from the same premium settings experience as the rest of the product."
                maxWidth={920}
                actions={[
                    <Button key="save" variant="contained" type="submit" form="password-settings-form" disabled={processing}>
                        Save Password
                    </Button>,
                ]}
            >
                <Box component="form" id="password-settings-form" onSubmit={updatePassword}>
                    <SurfaceCard
                        title="Update Password"
                        subtitle="Ensure your account is using a long, random password to stay secure."
                    >
                        <Box sx={{ display: 'grid', gap: 2 }}>
                            <TextField
                                id="current_password"
                                label="Current Password"
                                inputRef={currentPasswordInput}
                                type="password"
                                value={data.current_password}
                                onChange={(e) => setData('current_password', e.target.value)}
                                autoComplete="current-password"
                                fullWidth
                                error={!!errors.current_password}
                                helperText={errors.current_password}
                            />
                            <TextField
                                id="password"
                                label="New Password"
                                inputRef={passwordInput}
                                type="password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                autoComplete="new-password"
                                fullWidth
                                error={!!errors.password}
                                helperText={errors.password}
                            />
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
                            />

                            {recentlySuccessful ? (
                                <Alert severity="success" sx={{ width: 'fit-content' }}>
                                    Saved
                                </Alert>
                            ) : null}
                        </Box>
                    </SurfaceCard>
                </Box>
            </AppPage>
        </Box>
    );
};

export default Password;
