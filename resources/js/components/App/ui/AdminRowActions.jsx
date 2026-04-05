import React from 'react';
import { Button, IconButton, Stack, Tooltip } from '@mui/material';

export function AdminRowActionGroup({ children, justify = 'flex-start', wrap = true }) {
    return (
        <Stack
            direction="row"
            spacing={0.35}
            useFlexGap
            flexWrap={wrap ? 'wrap' : 'nowrap'}
            alignItems="center"
            justifyContent={justify}
            sx={{
                maxWidth: '100%',
                overflow: wrap ? 'visible' : 'hidden',
                '& .MuiButton-root, & .MuiIconButton-root': {
                    flexShrink: 0,
                },
            }}
        >
            {children}
        </Stack>
    );
}

export function AdminIconAction({ title, onClick, children, color = 'primary', disabled = false, size = 'small' }) {
    return (
        <Tooltip title={title} arrow>
            <span>
                <IconButton
                    size={size}
                    color={color}
                    disabled={disabled}
                    onClick={onClick}
                    aria-label={title}
                    sx={{
                        width: 28,
                        height: 28,
                        borderRadius: '8px',
                        p: 0.4,
                        border: '1px solid rgba(203, 213, 225, 0.9)',
                        backgroundColor: 'rgba(255,255,255,0.96)',
                        '&:hover': {
                            backgroundColor: 'rgba(241,245,249,0.96)',
                        },
                    }}
                >
                    {children}
                </IconButton>
            </span>
        </Tooltip>
    );
}

export function AdminPillAction({ label, onClick, color = 'primary', disabled = false }) {
    return (
        <Button
            size="small"
            variant="outlined"
            color={color}
            disabled={disabled}
            onClick={onClick}
            sx={{
                minWidth: 0,
                px: 0.9,
                py: 0.3,
                borderRadius: '999px',
                lineHeight: 1.15,
                fontSize: '0.72rem',
                fontWeight: 700,
                whiteSpace: 'nowrap',
            }}
        >
            {label}
        </Button>
    );
}
