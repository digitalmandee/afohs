import AppAuthLayout from '@/layouts/app/app-auth-layout';
import { Head, router } from '@inertiajs/react';
import { Box, Button, Typography } from '@mui/material';
import React, { useState } from 'react';

const SelectRestaurant = ({ restaurants, title = 'Select POS Location', postRouteName = 'pos.set-pos-location', fieldName = 'pos_location_id', redirectTo = null }) => {
    const [selectedId, setSelectedId] = useState('');
    const [processing, setProcessing] = useState(false);

    const handleSelect = (id) => {
        if (processing) return;
        setSelectedId(String(id));

        const payload = {
            [fieldName]: id,
            ...(redirectTo ? { redirect_to: redirectTo } : {}),
        };

        router.post(
            route(postRouteName),
            payload,
            {
                onStart: () => setProcessing(true),
                onFinish: () => setProcessing(false),
            },
        );
    };

    return (
        <>
            <Head title={title} />
            <AppAuthLayout>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box
                        component="img"
                        src="/assets/Logo.png"
                        alt="AFOHS Club Logo"
                        sx={{
                            width: 150,
                            height: 114,
                            mb: 1,
                            ml: -1,
                        }}
                    />

                    <Typography
                        variant="h5"
                        sx={{
                            fontWeight: 500,
                            color: '#063455',
                            fontSize: '30px',
                        }}
                    >
                        {title}
                    </Typography>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25, mt: 1 }}>
                        {(restaurants || []).map((restaurant) => (
                            <Button
                                key={restaurant.id}
                                variant={String(selectedId) === String(restaurant.id) ? 'contained' : 'outlined'}
                                onClick={() => handleSelect(restaurant.id)}
                                disabled={processing}
                                sx={{
                                    justifyContent: 'space-between',
                                    borderRadius: 1,
                                    textTransform: 'none',
                                    bgcolor: String(selectedId) === String(restaurant.id) ? '#063455' : undefined,
                                    borderColor: '#063455',
                                    color: String(selectedId) === String(restaurant.id) ? '#FFFFFF' : '#063455',
                                    '&:hover': {
                                        bgcolor: String(selectedId) === String(restaurant.id) ? '#083654' : 'rgba(6,52,85,0.06)',
                                        borderColor: '#063455',
                                    },
                                }}
                            >
                                {restaurant.name}
                            </Button>
                        ))}
                    </Box>
                </Box>
            </AppAuthLayout>
        </>
    );
};

SelectRestaurant.layout = (page) => page;
export default SelectRestaurant;
