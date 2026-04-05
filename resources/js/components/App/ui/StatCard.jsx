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

export default function StatCard({ label, value, caption, icon = null, tone = 'dark', accent = false, compact = false, minimal = false, white = false, cardSx = {} }) {
    const resolvedTone = accent ? 'dark' : toneStyles[tone] ? tone : 'light';
    const styles = toneStyles[resolvedTone];
    const minimalAsBrand = minimal && resolvedTone === 'dark';
    const minimalNeutralStyle = {
        border: '1px solid rgba(203,213,225,0.85)',
        background: 'linear-gradient(180deg, #ffffff 0%, #ffffff 100%)',
        boxShadow: '0 2px 8px rgba(15,23,42,0.04)',
        labelColor: '#637083',
        valueColor: '#1f2937',
        captionColor: '#6b7280',
        iconBg: 'rgba(6,52,85,0.06)',
        iconColor: '#063455',
    };
    const displayStyles = minimal && !minimalAsBrand ? minimalNeutralStyle : styles;

    return (
        <Card
            sx={{
                height: '100%',
                border: displayStyles.border,
                background: white ? 'linear-gradient(180deg, #ffffff 0%, #ffffff 100%)' : displayStyles.background,
                backgroundColor: white ? '#ffffff !important' : undefined,
                boxShadow: white ? '0 2px 8px rgba(15,23,42,0.04)' : displayStyles.boxShadow,
                ...cardSx,
            }}
        >
            <CardContent sx={{ p: compact ? 1.5 : 2, '&:last-child': { pb: compact ? 1.5 : 2 } }}>
                <Stack spacing={compact ? 0.6 : 1}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                        <Box>
                            <Typography
                                variant="body2"
                                sx={{
                                    color: displayStyles.labelColor,
                                    fontWeight: 700,
                                    letterSpacing: '0.02em',
                                    fontSize: compact ? '0.8rem' : undefined,
                                }}
                            >
                                {label}
                            </Typography>
                        </Box>
                        {icon ? (
                            <Box
                                sx={{
                                    width: compact ? 34 : 42,
                                    height: compact ? 34 : 42,
                                    display: 'grid',
                                    placeItems: 'center',
                                    borderRadius: compact ? '12px' : '14px',
                                    bgcolor: displayStyles.iconBg,
                                    color: displayStyles.iconColor,
                                    '& svg': { fontSize: compact ? '1rem' : '1.25rem' },
                                }}
                            >
                                {icon}
                            </Box>
                        ) : null}
                    </Stack>
                    <Typography
                        variant="h4"
                        sx={{
                            color: displayStyles.valueColor,
                            fontWeight: 800,
                            letterSpacing: '-0.03em',
                            lineHeight: 1.15,
                            fontSize: compact ? '1.5rem' : undefined,
                        }}
                    >
                        {value}
                    </Typography>
                    {caption ? (
                        <Typography
                            variant="caption"
                            sx={{
                                color: displayStyles.captionColor,
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
