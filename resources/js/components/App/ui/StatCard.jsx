import React from 'react';
import { Box, Card, CardContent, Stack, Typography } from '@mui/material';

export default function StatCard({ label, value, caption, icon = null, tone = 'dark' }) {
    const dark = tone === 'dark';

    return (
        <Card
            sx={{
                height: '100%',
                border: dark ? '1px solid rgba(7, 56, 88, 0.24)' : '1px solid #e5e7eb',
                background: dark
                    ? 'linear-gradient(135deg, #063455 0%, #0a3d62 58%, #0c67a7 100%)'
                    : 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(249,251,255,0.98) 100%)',
                boxShadow: dark ? '0 18px 32px rgba(6, 52, 85, 0.14)' : 'var(--shadow-card)',
            }}
        >
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Stack spacing={1}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                        <Box>
                            <Typography
                                variant="body2"
                                sx={{
                                    color: dark ? 'rgba(255,255,255,0.72)' : 'text.secondary',
                                    fontWeight: 700,
                                    letterSpacing: '0.02em',
                                }}
                            >
                                {label}
                            </Typography>
                        </Box>
                        {icon ? (
                            <Box
                                sx={{
                                    width: 42,
                                    height: 42,
                                    display: 'grid',
                                    placeItems: 'center',
                                    borderRadius: '14px',
                                    bgcolor: dark ? 'rgba(255,255,255,0.12)' : 'rgba(6,52,85,0.06)',
                                    color: dark ? '#ffffff' : '#063455',
                                    '& svg': { fontSize: '1.25rem' },
                                }}
                            >
                                {icon}
                            </Box>
                        ) : null}
                    </Stack>
                    <Typography
                        variant="h4"
                        sx={{
                            color: dark ? '#ffffff' : 'text.primary',
                            fontWeight: 800,
                            letterSpacing: '-0.03em',
                            lineHeight: 1.15,
                        }}
                    >
                        {value}
                    </Typography>
                    {caption ? (
                        <Typography
                            variant="caption"
                            sx={{
                                color: dark ? 'rgba(255,255,255,0.68)' : 'text.secondary',
                                fontSize: '0.76rem',
                            }}
                        >
                            {caption}
                        </Typography>
                    ) : null}
                </Stack>
            </CardContent>
        </Card>
    );
}
