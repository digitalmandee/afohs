import React from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';
import AppLoadingButton from '@/components/App/ui/AppLoadingButton';

const severityToColor = {
    info: 'primary',
    warning: 'warning',
    danger: 'error',
    critical: 'error',
};

export default function ConfirmActionDialog({
    open = false,
    title = 'Confirm Action',
    message = 'Are you sure you want to continue?',
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    severity = 'warning',
    loading = false,
    onClose,
    onConfirm,
}) {
    return (
        <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="xs" fullWidth>
            <DialogTitle>{title}</DialogTitle>
            <DialogContent>
                <Typography variant="body2" color="text.secondary">
                    {message}
                </Typography>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
                <Button onClick={onClose} disabled={loading}>
                    {cancelLabel}
                </Button>
                <AppLoadingButton
                    variant="contained"
                    color={severityToColor[severity] || 'primary'}
                    loading={loading}
                    loadingLabel="Processing..."
                    onClick={onConfirm}
                >
                    {confirmLabel}
                </AppLoadingButton>
            </DialogActions>
        </Dialog>
    );
}

