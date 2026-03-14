import React from 'react';
import { Box, Button, Stack } from '@mui/material';

export default function FilterToolbar({ children, onReset, actions = null }) {
    return (
        <Box
            sx={{
                p: 2,
                borderRadius: '18px',
                border: '1px solid rgba(229,231,235,0.9)',
                background: 'linear-gradient(180deg, rgba(248,250,253,0.96) 0%, rgba(255,255,255,0.98) 100%)',
            }}
        >
            <Stack spacing={1.5}>
                {children}
                <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1.5} flexWrap="wrap" useFlexGap>
                    <Button variant="outlined" onClick={onReset}>
                        Reset Filters
                    </Button>
                    {actions}
                </Stack>
            </Stack>
        </Box>
    );
}
