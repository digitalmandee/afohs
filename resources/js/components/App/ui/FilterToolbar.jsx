import React from 'react';
import { Box, Button, Stack } from '@mui/material';

export default function FilterToolbar({ children, onReset, actions = null, compact = true }) {
    return (
        <Box
            sx={{
                p: compact ? 1 : 1.5,
                borderRadius: compact ? '12px' : '16px',
                border: '1px solid rgba(226,232,240,0.95)',
                background: compact ? '#fdfefe' : '#ffffff',
                boxShadow: compact ? '0 6px 18px rgba(15, 23, 42, 0.035)' : '0 10px 24px rgba(15, 23, 42, 0.045)',
                '& .MuiGrid-container': {
                    alignItems: 'center',
                },
                '& .MuiFormControl-root, & .MuiAutocomplete-root': {
                    width: '100%',
                },
                '& .MuiInputLabel-root': {
                    fontSize: compact ? '0.86rem' : '0.92rem',
                    fontWeight: 600,
                    color: 'text.secondary',
                },
                '& .MuiOutlinedInput-root': {
                    minHeight: compact ? 42 : 46,
                    borderRadius: compact ? '12px' : '14px',
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
                    fontSize: compact ? '0.93rem' : '0.98rem',
                    paddingTop: compact ? '10px' : '11px',
                    paddingBottom: compact ? '10px' : '11px',
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
            <Stack spacing={compact ? 0.9 : 1.25}>
                {children}
                <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    justifyContent="space-between"
                    alignItems={{ xs: 'stretch', sm: 'center' }}
                    spacing={compact ? 0.85 : 1.1}
                    flexWrap="wrap"
                    useFlexGap
                >
                    <Button size="small" variant="outlined" onClick={onReset} sx={{ alignSelf: { xs: 'flex-start', sm: 'center' } }}>
                        Reset Filters
                    </Button>
                    {actions ? (
                        <Box
                            sx={{
                                ml: { sm: 'auto' },
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
            </Stack>
        </Box>
    );
}
