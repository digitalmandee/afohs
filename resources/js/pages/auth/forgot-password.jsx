import { Head, useForm } from '@inertiajs/react';
import { CircularProgress, Link } from '@mui/material';
import { Button, TextField, Typography, Box, Stack } from '@mui/material';

import AuthLayout from '@/layouts/auth-layout';

export default function ForgotPassword({ status }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('password.email'));
    };

    return (
        <AuthLayout
            title="Forgot password"
            description="Enter your email to receive a password reset link"
        >
            <Head title="Forgot password" />

            {status && (
                <Typography
                    variant="body2"
                    textAlign="center"
                    fontWeight={500}
                    color="success.main"
                    mb={2}
                >
                    {status}
                </Typography>
            )}

            <Stack spacing={4}>
                <form onSubmit={submit}>
                    <Stack spacing={2}>
                        <TextField
                            id="email"
                            label="Email address"
                            type="email"
                            name="email"
                            autoComplete="off"
                            autoFocus
                            fullWidth
                            placeholder="email@example.com"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            error={Boolean(errors.email)}
                            helperText={errors.email}
                        />
                    </Stack>

                    <Box mt={4} display="flex" justifyContent="flex-start">
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            disabled={processing}
                            fullWidth
                        >
                            {processing && (
                                <CircularProgress size={18} sx={{ mr: 1 }} />
                            )}
                            Email password reset link
                        </Button>
                    </Box>
                </form>

                <Typography variant="body2" color="text.secondary" textAlign="center">
                    <span>Or, return to </span>
                    <Link href={route('login')}>log in</Link>
                </Typography>
            </Stack>
        </AuthLayout>
    );
}
ForgotPassword.layout = (page) => page;
