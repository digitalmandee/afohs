import React from 'react';
import { Box, Card, CardContent, Stack, Typography } from '@mui/material';

const toneStyles = {
    dark: {
        border: '1px solid rgba(7, 56, 88, 0.24)',
        background: 'linear-gradient(135deg, #063455 0%, #0a3d62 58%, #0c67a7 100%)',
        boxShadow: '0 18px 32px rgba(6, 52, 85, 0.14)',
        labelColor: 'rgba(255,255,255,0.72)',
        valueColor: '#ffffff',
        captionColor: 'rgba(255,255,255,0.68)',
        iconBg: 'rgba(255,255,255,0.12)',
        iconColor: '#ffffff',
    },
    light: {
        border: '1px solid #e5e7eb',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(249,251,255,0.98) 100%)',
        boxShadow: 'var(--shadow-card)',
        labelColor: 'text.secondary',
        valueColor: 'text.primary',
        captionColor: 'text.secondary',
        iconBg: 'rgba(6,52,85,0.06)',
        iconColor: '#063455',
    },
    muted: {
        border: '1px solid rgba(12, 103, 167, 0.14)',
        background: 'linear-gradient(180deg, rgba(248,250,253,0.98) 0%, rgba(255,255,255,0.98) 100%)',
        boxShadow: 'var(--shadow-card)',
        labelColor: '#52606d',
        valueColor: '#102a43',
        captionColor: '#6b7280',
        iconBg: 'rgba(12,103,167,0.08)',
        iconColor: '#0c67a7',
    },
};

export default function StatCard({ label, value, caption, icon = null, tone = 'dark', accent = false }) {
    const resolvedTone = accent ? 'dark' : toneStyles[tone] ? tone : 'light';
    const styles = toneStyles[resolvedTone];

    return (
        <Card
            sx={{
                height: '100%',
                border: styles.border,
                background: styles.background,
                boxShadow: styles.boxShadow,
            }}
        >
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Stack spacing={1}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                        <Box>
                            <Typography
                                variant="body2"
                                sx={{
                                    color: styles.labelColor,
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
                                    bgcolor: styles.iconBg,
                                    color: styles.iconColor,
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
                            color: styles.valueColor,
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
                                color: styles.captionColor,
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
