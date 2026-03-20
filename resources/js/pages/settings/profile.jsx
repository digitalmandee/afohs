import { Transition } from '@headlessui/react';
import { Link, useForm, usePage } from '@inertiajs/react';
import React from 'react';
import { Alert, Box, Button, TextField, Typography } from '@mui/material';
import DeleteUser from '@/components/delete-user';
import AppPage from '@/components/App/ui/AppPage';
import SurfaceCard from '@/components/App/ui/SurfaceCard';

const Field = ({ label, children }) => (
    <Box>
        <Typography variant="body2" sx={{ mb: 0.75, fontWeight: 700, color: 'text.secondary' }}>
            {label}
        </Typography>
        {children}
    </Box>
);

const Profile = ({ mustVerifyEmail, status }) => {
    const { auth } = usePage().props;

    const { data, setData, patch, errors, processing, recentlySuccessful } = useForm({
        name: auth.user.name,
        email: auth.user.email,
    });

    const submit = (e) => {
        e.preventDefault();
        patch(route('profile.update'), {
            preserveScroll: true,
        });
    };

    return (
        <Box sx={{ p: { xs: 2, md: 3 } }}>
            <AppPage
                eyebrow="Account Settings"
                title="Profile Information"
                subtitle="Keep your identity and contact information current in the same premium settings shell used across the application."
                maxWidth={920}
                actions={[
                    <Button key="save" variant="contained" type="submit" form="profile-settings-form" disabled={processing}>
                        Save Profile
                    </Button>,
                ]}
            >
                <Box component="form" id="profile-settings-form" onSubmit={submit}>
                    <SurfaceCard
                        title="Account Details"
                        subtitle="Update your name and email address, then manage account deletion separately below."
                    >
                        <Box sx={{ display: 'grid', gap: 2 }}>
                            <Field label="Name">
                                <TextField
                                    fullWidth
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    required
                                    autoComplete="name"
                                    placeholder="Your full name"
                                    disabled={processing}
                                />
                                {errors.name ? <Typography sx={{ mt: 0.75, color: 'error.main', fontSize: '0.82rem' }}>{errors.name}</Typography> : null}
                            </Field>

                            <Field label="Email Address">
                                <TextField
                                    fullWidth
                                    id="email"
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    required
                                    autoComplete="email"
                                    placeholder="your@email.com"
                                    disabled={processing}
                                />
                                {errors.email ? <Typography sx={{ mt: 0.75, color: 'error.main', fontSize: '0.82rem' }}>{errors.email}</Typography> : null}
                            </Field>

                            {mustVerifyEmail && auth.user.email_verified_at === null ? (
                                <Alert severity="warning">
                                    Your email address is unverified.{' '}
                                    <Link href={route('verification.send')} method="post" as="button" style={{ textDecoration: 'underline', background: 'none', border: 'none', padding: 0 }}>
                                        Click here to resend the verification email.
                                    </Link>
                                    {status === 'verification-link-sent' ? (
                                        <Typography component="span" sx={{ ml: 1, fontWeight: 600 }}>
                                            A new verification link has been sent.
                                        </Typography>
                                    ) : null}
                                </Alert>
                            ) : null}

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Transition
                                    show={recentlySuccessful}
                                    enter="transition-opacity duration-300"
                                    enterFrom="opacity-0"
                                    leave="transition-opacity duration-300"
                                    leaveTo="opacity-0"
                                >
                                    <Typography sx={{ color: 'success.main', fontSize: '0.85rem', fontWeight: 700 }}>
                                        Saved
                                    </Typography>
                                </Transition>
                            </Box>
                        </Box>
                    </SurfaceCard>
                </Box>

                <SurfaceCard
                    title="Danger Zone"
                    subtitle="Remove your account only when you are sure; this action area stays visually separate from profile editing."
                >
                    <DeleteUser />
                </SurfaceCard>
            </AppPage>
        </Box>
    );
};

export default Profile;
