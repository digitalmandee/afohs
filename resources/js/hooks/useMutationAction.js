import React from 'react';
import { router } from '@inertiajs/react';
import { useSnackbar } from 'notistack';

function firstErrorMessage(errors, fallback) {
    if (!errors) return fallback;
    if (typeof errors === 'string') return errors;
    if (typeof errors?.message === 'string') return errors.message;
    if (typeof errors === 'object') {
        const values = Object.values(errors).flat();
        const first = values.find((value) => typeof value === 'string' && value.trim().length > 0);
        if (first) return first;
    }
    return fallback;
}

export default function useMutationAction() {
    const { enqueueSnackbar } = useSnackbar();
    const [pendingKeys, setPendingKeys] = React.useState({});
    const [confirmState, setConfirmState] = React.useState(null);

    const setPending = React.useCallback((key, value) => {
        setPendingKeys((prev) => {
            if (value) {
                return { ...prev, [key]: true };
            }
            const next = { ...prev };
            delete next[key];
            return next;
        });
    }, []);

    const isPending = React.useCallback((key) => Boolean(pendingKeys[key]), [pendingKeys]);

    const execute = React.useCallback((config) => {
        if (!config || typeof config.action !== 'function') return;
        const key = config.key || 'default';
        if (isPending(key)) return;

        setPending(key, true);
        let finished = false;
        const safeFinish = () => {
            if (finished) return;
            finished = true;
            setPending(key, false);
            setConfirmState((prev) => (prev?.key === key ? null : prev));
        };

        const safeError = (errors) => {
            const message = firstErrorMessage(errors, config.errorMessage || 'Action failed.');
            enqueueSnackbar(message, { variant: 'error' });
        };

        const run = {
            onSuccess: () => {
                if (config.successMessage) {
                    enqueueSnackbar(config.successMessage, { variant: 'success' });
                }
            },
            onError: safeError,
            onFinish: safeFinish,
        };

        try {
            const result = config.action(run);
            if (result && typeof result.then === 'function') {
                result.catch((error) => {
                    safeError(error);
                }).finally(() => {
                    safeFinish();
                });
            }
        } catch (error) {
            safeError(error);
            safeFinish();
        }
    }, [enqueueSnackbar, isPending, setPending]);

    const runAction = React.useCallback((config) => {
        const next = config || {};
        if (next.requireConfirm) {
            setConfirmState({
                ...next.confirmConfig,
                key: next.key || 'default',
                executeConfig: next,
            });
            return;
        }
        execute(next);
    }, [execute]);

    const runRouterAction = React.useCallback((config) => {
        const {
            key = 'default',
            method = 'post',
            url,
            data = {},
            options = {},
            requireConfirm = true,
            confirmConfig = {},
            successMessage = '',
            errorMessage = 'Action failed.',
        } = config || {};

        runAction({
            key,
            requireConfirm,
            confirmConfig,
            successMessage,
            errorMessage,
            action: ({ onSuccess, onError, onFinish }) => {
                router[method](url, data, {
                    ...options,
                    onSuccess: (...args) => {
                        options.onSuccess?.(...args);
                        onSuccess();
                    },
                    onError: (errors, ...args) => {
                        options.onError?.(errors, ...args);
                        onError(errors);
                    },
                    onFinish: (...args) => {
                        options.onFinish?.(...args);
                        onFinish();
                    },
                });
            },
        });
    }, [runAction]);

    const closeConfirm = React.useCallback(() => {
        if (confirmState?.key && isPending(confirmState.key)) return;
        setConfirmState(null);
    }, [confirmState, isPending]);

    const confirmDialogProps = {
        open: Boolean(confirmState),
        title: confirmState?.title || 'Confirm Action',
        message: confirmState?.message || 'Are you sure you want to continue?',
        confirmLabel: confirmState?.confirmLabel || 'Confirm',
        cancelLabel: confirmState?.cancelLabel || 'Cancel',
        severity: confirmState?.severity || 'warning',
        loading: confirmState?.key ? isPending(confirmState.key) : false,
        onClose: closeConfirm,
        onConfirm: () => execute(confirmState?.executeConfig),
    };

    return {
        runAction,
        runRouterAction,
        isPending,
        confirmDialogProps,
    };
}
