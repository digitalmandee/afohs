import React from 'react';
import { Button, CircularProgress } from '@mui/material';

export default function AppLoadingButton({
    loading = false,
    loadingLabel = 'Processing...',
    children,
    disabled,
    startIcon,
    ...props
}) {
    return (
        <Button
            {...props}
            disabled={loading || disabled}
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : startIcon}
        >
            {loading ? loadingLabel : children}
        </Button>
    );
}

