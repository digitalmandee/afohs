import React from 'react';
import { Box, Button, Stack, Typography } from '@mui/material';

export default function FilterToolbar({
    children,
    onReset,
    onApply = null,
    actions = null,
    compact = true,
    inlineActions = true,
    lowChrome = true,
    showReset = true,
    showApply = true,
    applyLabel = 'Apply',
    title = '',
    subtitle = '',
}) {
    const handleApply = React.useCallback(() => {
        if (typeof onApply === 'function') onApply();
    }, [onApply]);

    return (
        <Box
            sx={{
                p: compact ? (lowChrome ? 1.15 : 0.65) : 1.35,
                borderRadius: compact ? '12px' : '16px',
                border: lowChrome ? '1px solid rgba(210,220,233,0.92)' : '1px solid rgba(226,232,240,0.95)',
                background: lowChrome ? 'rgba(255,255,255,0.56)' : '#ffffff',
                boxShadow: lowChrome ? 'none' : compact ? '0 6px 18px rgba(15, 23, 42, 0.035)' : '0 10px 24px rgba(15, 23, 42, 0.045)',
                '& .MuiGrid-container': {
                    alignItems: 'center',
                },
                '& .MuiFormControl-root, & .MuiAutocomplete-root': {
                    width: '100%',
                },
                '& .MuiInputLabel-root': {
                    fontSize: compact ? '0.82rem' : '0.92rem',
                    fontWeight: 600,
                    color: 'text.secondary',
                },
                '& .MuiOutlinedInput-root': {
                    minHeight: compact ? 38 : 46,
                    borderRadius: compact ? '10px' : '14px',
                    backgroundColor: 'rgba(255,255,255,0.98)',
                    transition: 'border-color 160ms ease, box-shadow 160ms ease, background-color 160ms ease',
                    '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(203,213,225,0.92)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(148,163,184,0.9)',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(12,103,167,0.55)',
                        borderWidth: 1.5,
                    },
                },
                '& .MuiInputBase-input, & .MuiSelect-select': {
                    fontSize: compact ? '0.88rem' : '0.98rem',
                    paddingTop: compact ? '8px' : '11px',
                    paddingBottom: compact ? '8px' : '11px',
                },
                '& .MuiSelect-select': {
                    minHeight: 'unset !important',
                },
                '& .MuiInputAdornment-root .MuiSvgIcon-root, & .MuiIconButton-root .MuiSvgIcon-root': {
                    fontSize: '1.12rem',
                },
                '& .MuiInputBase-input[type="date"]': {
                    minHeight: 'unset',
                },
                '& .MuiButton-root': {
                    borderRadius: '10px',
                    textTransform: 'none',
                    fontWeight: 700,
                },
            }}
        >
            <Stack spacing={compact ? 0.6 : 1.25}>
                {title ? (
                    <Box sx={{ px: compact ? 0.25 : 0 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0a3d62', letterSpacing: '0.02em' }}>
                            {title}
                        </Typography>
                        {subtitle ? (
                            <Typography variant="caption" sx={{ display: 'block', mt: 0.15, color: 'text.secondary' }}>
                                {subtitle}
                            </Typography>
                        ) : null}
                    </Box>
                ) : null}
                <Box>{children}</Box>
                {showReset || showApply || actions ? (
                    <Stack
                        direction={{ xs: 'column', md: 'row' }}
                        justifyContent={inlineActions ? 'flex-end' : 'space-between'}
                        alignItems={{ xs: 'stretch', sm: 'center' }}
                        spacing={compact ? 0.65 : 1.1}
                        flexWrap="wrap"
                        useFlexGap
                    >
                        {showReset ? (
                            <Button size="small" variant="outlined" onClick={onReset} sx={{ alignSelf: { xs: 'flex-start', sm: 'center' }, minHeight: 34 }}>
                                Reset Filters
                            </Button>
                        ) : null}
                        {showApply ? (
                            <Button
                                size="small"
                                variant="contained"
                                onClick={handleApply}
                                sx={{ alignSelf: { xs: 'flex-start', sm: 'center' }, minHeight: 34 }}
                            >
                                {applyLabel}
                            </Button>
                        ) : null}
                        {actions ? (
                            <Box
                                sx={{
                                    ml: inlineActions ? { sm: 0 } : { sm: 'auto' },
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.75,
                                    flexWrap: 'wrap',
                                    justifyContent: { xs: 'flex-start', sm: 'flex-end' },
                                }}
                            >
                                {actions}
                            </Box>
                        ) : null}
                    </Stack>
                ) : null}
            </Stack>
        </Box>
    );
}
