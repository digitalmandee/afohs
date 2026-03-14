import { Head, useForm } from '@inertiajs/react';
import { CircularProgress, Button, Typography, Stack, Link as MuiLink } from '@mui/material';
import AuthLayout from '@/layouts/auth-layout';

export default function VerifyEmail({ status }) {
    const { post, processing } = useForm({});

    const submit = (e) => {
        e.preventDefault();
        post(route('verification.send'));
    };

    return (
        <AuthLayout
            title="Verify email"
            description="Please verify your email address by clicking on the link we just emailed to you."
        >
            <Head title="Email verification" />

            {status === 'verification-link-sent' && (
                <Typography
                    variant="body2"
                    color="success.main"
                    align="center"
                    sx={{ mb: 2 }}
                >
                    A new verification link has been sent to the email address you provided during registration.
                </Typography>
            )}

            <form onSubmit={submit}>
                <Stack spacing={3} alignItems="center">
                    <Button
                        type="submit"
                        variant="outlined"
                        disabled={processing}
                        startIcon={processing && <CircularProgress size={16} />}
                    >
                        Resend verification email
                    </Button>

                    <MuiLink
                        component="button"
                        variant="body2"
                        onClick={() => {
                            post(route('logout'), { method: 'post' });
                        }}
                    >
                        Log out
                    </MuiLink>
                </Stack>
            </form>
        </AuthLayout>
    );
}
VerifyEmail.layout = (page) => page;