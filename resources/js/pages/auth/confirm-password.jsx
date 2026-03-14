import { Head, useForm } from '@inertiajs/react';
import {
    TextField,
    Button,
    CircularProgress,
    Stack
} from '@mui/material';

import AuthLayout from '@/layouts/auth-layout';

export default function ConfirmPassword() {
    const { data, setData, post, processing, errors, reset } = useForm({
        password: '',
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('password.confirm'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <AuthLayout
            title="Confirm your password"
            description="This is a secure area of the application. Please confirm your password before continuing."
        >
            <Head title="Confirm password" />

            <form onSubmit={submit}>
                <Stack spacing={4}>
                    <TextField
                        id="password"
                        label="Password"
                        type="password"
                        name="password"
                        placeholder="Password"
                        autoComplete="current-password"
                        fullWidth
                        value={data.password}
                        autoFocus
                        onChange={(e) => setData('password', e.target.value)}
                        error={Boolean(errors.password)}
                        helperText={errors.password}
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
                        Confirm password
                    </Button>
                </Stack>
            </form>
        </AuthLayout>
    );
}
ConfirmPassword.layout = (page) => page;