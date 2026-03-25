import React from 'react';
import { router } from '@inertiajs/react';
import { CircularProgress, Stack, Typography } from '@mui/material';
import AppPage from '@/components/App/ui/AppPage';
import SurfaceCard from '@/components/App/ui/SurfaceCard';

const AddGuestInformation = () => {
    React.useEffect(() => {
        router.visit(route('guests.create'), {
            replace: true,
            preserveScroll: true,
        });
    }, []);

    return (
        <AppPage eyebrow="Guest Management" title="Redirecting Guest Form" subtitle="This legacy add-guest page now forwards to the live guest create form.">
            <SurfaceCard title="Opening Guest Create Form">
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ py: 2 }}>
                    <CircularProgress size={20} />
                    <Typography color="text.secondary">Taking you to the real guest create screen.</Typography>
                </Stack>
            </SurfaceCard>
        </AppPage>
    );
};

export default AddGuestInformation;
