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

    return (
        <Box className="app-shell" sx={{ display: 'flex', overflowX: 'clip' }}>
            <NotificationSubscriber userId={auth?.user?.id} />
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

const NotificationSubscriber = React.memo(function NotificationSubscriber({ userId }) {
    const { enqueueSnackbar } = useSnackbar();

    useEffect(() => {
        if (!userId || !window.Echo) return undefined;

        const channelName = `App.Models.User.${userId}`;
        const channel = window.Echo.private(channelName);

        channel.notification((notification) => {
            enqueueSnackbar(notification.title || 'New Notification', {
                variant: 'info',
                anchorOrigin: { vertical: 'top', horizontal: 'right' },
            });
        });

        return () => {
            window.Echo.leave(channelName);
        };
    }, [enqueueSnackbar, userId]);

    return null;
});
