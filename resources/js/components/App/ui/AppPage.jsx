import React from 'react';
import { Box, Stack, Typography } from '@mui/material';

export default function AppPage({ eyebrow, title, subtitle, actions, children, maxWidth = '100%' }) {
    return (
        <Box sx={{ width: '100%', maxWidth, mx: 'auto' }}>
            <Stack
                direction={{ xs: 'column', lg: 'row' }}
                justifyContent="space-between"
                alignItems={{ xs: 'flex-start', lg: 'flex-end' }}
                spacing={1.5}
                sx={{ mb: 2.5 }}
            >
                <Box>
                    {eyebrow ? (
                        <Typography
                            variant="overline"
                            sx={{
                                letterSpacing: '0.18em',
                                color: 'primary.main',
                                fontWeight: 700,
                                display: 'block',
                                mb: 0.75,
                            }}
                        >
                            {eyebrow}
                        </Typography>
                    ) : null}
                    <Typography variant="h3" sx={{ color: 'text.primary', mb: subtitle ? 0.5 : 0 }}>
                        {title}
                    </Typography>
                    {subtitle ? (
                        <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 760 }}>
                            {subtitle}
                        </Typography>
                    ) : null}
                </Box>
                {actions ? <Stack direction="row" spacing={1.25} flexWrap="wrap" useFlexGap>{actions}</Stack> : null}
            </Stack>

            <Stack spacing={2.25}>{children}</Stack>
        </Box>
    );
}
