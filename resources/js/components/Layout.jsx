import React, { useState, useEffect } from 'react';
import SideNav from '@/components/App/AdminSideBar/SideNav';
import { usePage } from '@inertiajs/react'; // For auth info
import { useSnackbar } from 'notistack';
import { Box } from '@mui/material';

const drawerWidthOpen = 240;
const drawerWidthClosed = 110;

export default function Layout({ children }) {
    const [open, setOpen] = useState(true);
    const { auth } = usePage().props;
    const { enqueueSnackbar } = useSnackbar();

    useEffect(() => {
        if (auth?.user?.id) {
            console.log(`Global Layout Subscribing to: App.Models.User.${auth.user.id}`);
            window.Echo.private(`App.Models.User.${auth.user.id}`).notification((notification) => {
                console.log('Global Notification received:', notification);
                enqueueSnackbar(notification.title || 'New Notification', {
                    variant: 'info',
                    anchorOrigin: { vertical: 'top', horizontal: 'right' },
                });
            });
        }

        return () => {
            if (auth?.user?.id) {
                // We typically don't leave the channel here if other components (like Dashboard) might be using it,
                // but Echo.leave cleans up the subscription.
                // If we navigate away, Layout unmounts (or not? Inertia layouts persist).
                // Actually, in Inertia with persistent layouts, this component might remain mounted.
                // If it re-renders, useEffect cleanup runs.
                // It's safer to leave. Dashboard re-subscribing should be fine.
                window.Echo.leave(`App.Models.User.${auth.user.id}`);
            }
        };
    }, [auth?.user?.id]);

    return (
        <Box className="app-shell" sx={{ display: 'flex', overflowX: 'clip' }}>
            <SideNav open={open} setOpen={setOpen} />
            <Box
                className="app-content"
                sx={{
                    flexGrow: 1,
                    marginLeft: 0,
                    marginTop: '5.5rem',
                    minWidth: 0,
                    transition: 'all 0.3s ease-in-out',
                    overflowX: 'hidden',
                }}
            >
                <Box className="app-content-inner">{children}</Box>
            </Box>
        </Box>
    );
}
