import React from 'react';
import { Box, Grid, Stack, Typography } from '@mui/material';
import { router } from '@inertiajs/react';
import AppPage from '@/components/App/ui/AppPage';
import SurfaceCard from '@/components/App/ui/SurfaceCard';
import ReportHubCard from '@/components/App/ui/ReportHubCard';

export default function Hub({ categories = [] }) {
    return (
        <AppPage
            eyebrow="Accounting Reports"
            title="Report Hub"
            subtitle="Centralized report access across finance, procurement, and inventory with quick card-based navigation."
        >
            <Grid container spacing={2.25}>
                {categories.map((category) => (
                    <Grid item xs={12} key={category.name}>
                        <SurfaceCard
                            lowChrome
                            cardSx={{
                                borderRadius: 3,
                                border: '1px solid rgba(6, 52, 85, 0.10)',
                                background: 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,250,253,0.95) 100%)',
                            }}
                            contentSx={{ p: { xs: 1.5, md: 1.8 }, '&:last-child': { pb: { xs: 1.5, md: 1.8 } } }}
                        >
                            <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ xs: 'flex-start', md: 'center' }} justifyContent="space-between" spacing={0.8} sx={{ mb: 1.4 }}>
                                <Box>
                                    <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary' }}>
                                        {category.name}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                                        {(category.count ?? category.items?.length ?? 0)} Reports
                                    </Typography>
                                </Box>
                            </Stack>

                            <Grid container spacing={1.5}>
                                {category.items?.map((item) => (
                                    <Grid item xs={12} sm={6} md={4} lg={3} key={item.label}>
                                        <ReportHubCard
                                            title={item.label}
                                            description={item.description}
                                            badge={item.badge}
                                            iconKey={item.iconKey}
                                            disabled={!item.route}
                                            onClick={() => router.get(item.route)}
                                        />
                                    </Grid>
                                ))}
                            </Grid>
                        </SurfaceCard>
                    </Grid>
                ))}
            </Grid>
        </AppPage>
    );
}
