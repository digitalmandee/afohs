import { Head, useForm } from '@inertiajs/react';
import { Button, TextField, CircularProgress, Stack } from '@mui/material';

import AuthLayout from '@/layouts/auth-layout';

export default function ResetPassword({ token, email }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        token: token,
        email: email,
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('password.store'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <AuthLayout
            title="Reset password"
            description="Please enter your new password below"
        >
            <Head title="Reset password" />

            <form onSubmit={submit}>
                <Stack spacing={4}>
                    <TextField
                        id="email"
                        label="Email"
                        type="email"
                        name="email"
                        value={data.email}
                        autoComplete="email"
                        fullWidth
                        InputProps={{ readOnly: true }}
                        onChange={(e) => setData('email', e.target.value)}
                        error={Boolean(errors.email)}
                        helperText={errors.email}
                    />

                    <TextField
                        id="password"
                        label="Password"
                        type="password"
                        name="password"
                        autoComplete="new-password"
                        fullWidth
                        autoFocus
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        placeholder="Password"
                        error={Boolean(errors.password)}
                        helperText={errors.password}
                    />

                    <TextField
                        id="password_confirmation"
                        label="Confirm Password"
                        type="password"
                        name="password_confirmation"
                        autoComplete="new-password"
                        fullWidth
                        value={data.password_confirmation}
                        onChange={(e) => setData('password_confirmation', e.target.value)}
                        placeholder="Confirm password"
                        error={Boolean(errors.password_confirmation)}
                        helperText={errors.password_confirmation}
                    />

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
                        Reset password
                    </Button>
                </Stack>
            </form>
        </AuthLayout>
    );
}
ResetPassword.layout = (page) => page;