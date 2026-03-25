import React from 'react';
import { router } from '@inertiajs/react';
import { CircularProgress, Stack, Typography } from '@mui/material';
import AppPage from '@/components/App/ui/AppPage';
import SurfaceCard from '@/components/App/ui/SurfaceCard';

const GuestHistory = () => {
    React.useEffect(() => {
        router.visit(route('guests.index'), {
            replace: true,
            preserveScroll: true,
        });
    }, []);

    return (
        <AppPage eyebrow="Guest Management" title="Redirecting Guests" subtitle="This legacy guest screen has been retired in favor of the compact real-data guest register.">
            <SurfaceCard title="Opening Guest Register">
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ py: 2 }}>
                    <CircularProgress size={20} />
                    <Typography color="text.secondary">Taking you to the live guest management screen.</Typography>
                </Stack>
            </SurfaceCard>
        </AppPage>
    );
};

export default GuestHistory;
