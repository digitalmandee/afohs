import React from 'react';
import { Box, Stack, Typography } from '@mui/material';

export default function AppPage({
    eyebrow,
    title,
    subtitle,
    actions,
    children,
    maxWidth = '100%',
    compact = true,
    hideSubtitle = false,
}) {
    return (
        <Box sx={{ width: '100%', maxWidth, mx: 'auto' }}>
            <Stack
                direction={{ xs: 'column', lg: 'row' }}
                justifyContent="space-between"
                alignItems={{ xs: 'flex-start', lg: 'flex-end' }}
                spacing={compact ? 1 : 1.5}
                sx={{ mb: compact ? 1.5 : 2.5 }}
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
                                mb: compact ? 0.4 : 0.75,
                                lineHeight: compact ? 1.3 : 1.5,
                            }}
                        >
                            {eyebrow}
                        </Typography>
                    ) : null}
                    <Typography
                        variant={compact ? 'h4' : 'h3'}
                        sx={{
                            color: 'text.primary',
                            mb: subtitle && !hideSubtitle ? (compact ? 0.25 : 0.5) : 0,
                            fontWeight: compact ? 750 : undefined,
                        }}
                    >
                        {title}
                    </Typography>
                    {subtitle && !hideSubtitle ? (
                        <Typography variant={compact ? 'body2' : 'body1'} sx={{ color: 'text.secondary', maxWidth: 760 }}>
                            {subtitle}
                        </Typography>
                    ) : null}
                </Box>
                {actions ? <Stack direction="row" spacing={1.25} flexWrap="wrap" useFlexGap>{actions}</Stack> : null}
            </Stack>

            <Stack spacing={compact ? 1.5 : 2.25}>{children}</Stack>
        </Box>
    );
}
