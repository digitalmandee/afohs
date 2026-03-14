import React from 'react';
import { Card, CardContent, Stack, Typography } from '@mui/material';

export default function SurfaceCard({ title, subtitle, actions, children, contentSx = {}, cardSx = {} }) {
    return (
        <Card sx={cardSx}>
            <CardContent sx={{ p: { xs: 2, md: 2.5 }, '&:last-child': { pb: { xs: 2, md: 2.5 } }, ...contentSx }}>
                {(title || subtitle || actions) ? (
                    <Stack
                        direction={{ xs: 'column', md: 'row' }}
                        justifyContent="space-between"
                        alignItems={{ xs: 'flex-start', md: 'center' }}
                        spacing={1.5}
                        sx={{ mb: 2.5 }}
                    >
                        <div>
                            {title ? <Typography variant="h5" sx={{ color: 'text.primary' }}>{title}</Typography> : null}
                            {subtitle ? <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>{subtitle}</Typography> : null}
                        </div>
                        {actions}
                    </Stack>
                ) : null}
                {children}
            </CardContent>
        </Card>
    );
}
