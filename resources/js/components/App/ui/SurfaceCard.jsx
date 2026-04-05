import React from 'react';
import { Card, CardContent, Stack, Typography } from '@mui/material';

export default function SurfaceCard({
    title,
    subtitle,
    actions,
    children,
    contentSx = {},
    cardSx = {},
    compact = true,
    lowChrome = false,
}) {
    return (
        <Card
            sx={{
                borderRadius: lowChrome ? 0 : undefined,
                border: lowChrome ? 'none' : undefined,
                boxShadow: lowChrome ? 'none' : undefined,
                backgroundColor: lowChrome ? 'transparent' : undefined,
                ...cardSx,
            }}
        >
            <CardContent
                sx={{
                    p: compact ? { xs: 1.35, md: 1.6 } : { xs: 2, md: 2.5 },
                    '&:last-child': {
                        pb: compact ? { xs: 1.35, md: 1.6 } : { xs: 2, md: 2.5 },
                    },
                    ...contentSx,
                }}
            >
                {(title || subtitle || actions) ? (
                    <Stack
                        direction={{ xs: 'column', md: 'row' }}
                        justifyContent="space-between"
                        alignItems={{ xs: 'flex-start', md: 'center' }}
                        spacing={compact ? 0.75 : 1.5}
                        sx={{ mb: compact ? 1.2 : 2.5 }}
                    >
                        <div>
                            {title ? <Typography variant={compact ? 'h6' : 'h5'} sx={{ color: 'text.primary' }}>{title}</Typography> : null}
                            {subtitle ? <Typography variant="body2" sx={{ mt: compact ? 0.25 : 0.5, color: 'text.secondary' }}>{subtitle}</Typography> : null}
                        </div>
                        {actions}
                    </Stack>
                ) : null}
                {children}
            </CardContent>
        </Card>
    );
}
