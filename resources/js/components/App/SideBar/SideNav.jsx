import * as React from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import {
    Avatar,
    Box,
    Button,
    CssBaseline,
    Divider,
    IconButton,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Modal,
    Slide,
    Tooltip,
    Typography,
} from '@mui/material';
import MuiAppBar from '@mui/material/AppBar';
import MuiDrawer from '@mui/material/Drawer';
import Toolbar from '@mui/material/Toolbar';
import { styled } from '@mui/material/styles';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded';
import EventSeatRoundedIcon from '@mui/icons-material/EventSeatRounded';
import TableRestaurantRoundedIcon from '@mui/icons-material/TableRestaurantRounded';
import RestaurantMenuRoundedIcon from '@mui/icons-material/RestaurantMenuRounded';
import CategoryRoundedIcon from '@mui/icons-material/CategoryRounded';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import ScaleRoundedIcon from '@mui/icons-material/ScaleRounded';
import CakeRoundedIcon from '@mui/icons-material/CakeRounded';
import PrintRoundedIcon from '@mui/icons-material/PrintRounded';
import PaymentsRoundedIcon from '@mui/icons-material/PaymentsRounded';
import GroupRoundedIcon from '@mui/icons-material/GroupRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import KitchenRoundedIcon from '@mui/icons-material/KitchenRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import MenuOpenRoundedIcon from '@mui/icons-material/MenuOpenRounded';
import LoginActivityScreen from './Activity';
import ShiftActivityScreen from './ShiftActivity';
import LogoutScreen from './Logout';
import NotificationsPanel from './Notification';
import EmployeeProfileScreen from './Profile';
import { isPosPath, safeRouteForContext } from '@/lib/utils';

export const POS_DRAWER_WIDTH_OPEN = 224;
export const POS_DRAWER_WIDTH_CLOSED = 78;
export const POS_TOPBAR_HEIGHT = 76;

const openedMixin = (theme) => ({
    width: POS_DRAWER_WIDTH_OPEN,
    transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
    }),
    overflowX: 'hidden',
});

const closedMixin = (theme) => ({
    width: POS_DRAWER_WIDTH_CLOSED,
    transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
    }),
    overflowX: 'hidden',
});

const Drawer = styled(MuiDrawer, {
    shouldForwardProp: (prop) => prop !== 'open',
})(({ theme, open }) => ({
    width: open ? POS_DRAWER_WIDTH_OPEN : POS_DRAWER_WIDTH_CLOSED,
    flexShrink: 0,
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
    '& .MuiDrawer-paper': {
        width: open ? POS_DRAWER_WIDTH_OPEN : POS_DRAWER_WIDTH_CLOSED,
        borderRight: '1px solid rgba(226, 232, 240, 0.85)',
        background: 'linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)',
        boxShadow: '0 22px 48px rgba(6, 52, 85, 0.08)',
        ...(open ? openedMixin(theme) : closedMixin(theme)),
    },
}));

const AppBar = styled(MuiAppBar, {
    shouldForwardProp: (prop) => prop !== 'open',
})(({ theme, open }) => ({
    zIndex: theme.zIndex.drawer + 1,
    background: 'rgba(255,255,255,0.88)',
    backdropFilter: 'blur(14px)',
    borderBottom: '1px solid rgba(226, 232, 240, 0.92)',
    boxShadow: 'none',
    height: POS_TOPBAR_HEIGHT,
    justifyContent: 'center',
    marginLeft: open ? POS_DRAWER_WIDTH_OPEN : POS_DRAWER_WIDTH_CLOSED,
    width: `calc(100% - ${open ? POS_DRAWER_WIDTH_OPEN : POS_DRAWER_WIDTH_CLOSED}px)`,
    transition: theme.transitions.create(['width', 'margin-left'], {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.standard,
    }),
}));

const normalizePath = (fullPath) => {
    try {
        return new URL(fullPath, window.location.origin).pathname;
    } catch (error) {
        return fullPath;
    }
};

const isItemActive = (itemPath, currentPath) => {
    const normalizedItemPath = normalizePath(itemPath);
    const normalizedCurrentPath = normalizePath(currentPath);

    if (normalizedCurrentPath === normalizedItemPath) return true;
    if (normalizedItemPath === '/' || normalizedItemPath === '') return false;

    return normalizedCurrentPath.startsWith(`${normalizedItemPath}/`);
};

const createMenuGroups = (url) => ([
    {
        label: 'Workspace',
        items: [
            {
                text: 'Dashboard',
                icon: <DashboardRoundedIcon />,
                path: isPosPath(url) ? safeRouteForContext('pos.dashboard', url) : safeRouteForContext('tenant.dashboard', url),
            },
            {
                text: 'Orders',
                icon: <ReceiptLongRoundedIcon />,
                path: safeRouteForContext('order.management', url),
            },
            {
                text: 'Order History',
                icon: <HistoryRoundedIcon />,
                path: safeRouteForContext('order.history', url),
            },
            {
                text: 'Reservations',
                icon: <EventSeatRoundedIcon />,
                path: safeRouteForContext('reservations.index', url),
            },
            {
                text: 'Tables',
                icon: <TableRestaurantRoundedIcon />,
                path: safeRouteForContext('table.management', url),
            },
            {
                text: 'Kitchen',
                icon: <KitchenRoundedIcon />,
                path: safeRouteForContext('kitchen.index', url),
                permission: 'kitchen',
            },
            {
                text: 'Transactions',
                icon: <PaymentsRoundedIcon />,
                path: safeRouteForContext('transaction.history', url),
            },
        ],
    },
    {
        label: 'Catalog',
        items: [
            {
                text: 'Inventory Items',
                icon: <RestaurantMenuRoundedIcon />,
                path: safeRouteForContext('inventory.index', url),
            },
            {
                text: 'Products & Menu',
                icon: <RestaurantMenuRoundedIcon />,
                path: safeRouteForContext('products.index', url),
            },
            {
                text: 'Categories',
                icon: <CategoryRoundedIcon />,
                path: safeRouteForContext('inventory.category', url),
            },
            {
                text: 'Sub Categories',
                icon: <CategoryRoundedIcon />,
                path: safeRouteForContext('sub-categories.index', url),
            },
            {
                text: 'Ingredients',
                icon: <Inventory2RoundedIcon />,
                path: safeRouteForContext('ingredients.index', url),
            },
            {
                text: 'Units',
                icon: <ScaleRoundedIcon />,
                path: safeRouteForContext('units.index', url),
            },
            {
                text: 'Manufacturers',
                icon: <Inventory2RoundedIcon />,
                path: safeRouteForContext('manufacturers.index', url),
            },
        ],
    },
    {
        label: 'Service',
        items: [
            {
                text: 'Cake Bookings',
                icon: <CakeRoundedIcon />,
                path: safeRouteForContext('cake-bookings.index', url),
            },
            {
                text: 'Cake Types',
                icon: <CakeRoundedIcon />,
                path: safeRouteForContext('cake-types.index', url),
            },
            {
                text: 'Guests',
                icon: <GroupRoundedIcon />,
                path: safeRouteForContext('customers.index', url),
            },
            {
                text: 'Printer Management',
                icon: <PrintRoundedIcon />,
                path: safeRouteForContext('printers.index', url, undefined, true, {
                    menu_source: 'pos_sidebar',
                    menu_item: 'Printer Management',
                }),
            },
            {
                text: 'Settings',
                icon: <SettingsRoundedIcon />,
                path: safeRouteForContext('setting.index', url, undefined, true, {
                    menu_source: 'pos_sidebar',
                    menu_item: 'Settings',
                }),
            },
        ],
    },
]);

const canAccessItem = (item, role, permissions) => {
    if (!item.permission) return true;
    if (role === 'super') return true;
    if (permissions.includes(item.permission)) return true;
    if ((role === 'admin' || role === 'kitchen') && item.permission === 'kitchen') return true;
    return false;
};

export default function SideNav({ open, setOpen }) {
    const { url, props } = usePage();
    const auth = props?.auth || {};
    const role = auth.role || '';
    const permissions = Array.isArray(auth.permissions) ? auth.permissions : [];
    const posContext = isPosPath(url);
    const workspaceTitle = posContext ? 'POS Workspace' : 'Restaurant Workspace';
    const workspaceSubtitle = posContext ? 'Faster restaurant operations and cashier flow.' : 'Operational tools for service, kitchen, and restaurant staff.';
    const [showNotification, setShowNotification] = React.useState(false);
    const [showProfile, setShowProfile] = React.useState(false);
    const [profileView, setProfileView] = React.useState('profile');

    const menuGroups = React.useMemo(
        () => createMenuGroups(url).map((group) => ({
            ...group,
            items: group.items.filter((item) => canAccessItem(item, role, permissions)),
        })).filter((group) => group.items.length > 0),
        [permissions, role, url],
    );

    React.useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'F12') {
                event.preventDefault();
                const orderManagementPath = safeRouteForContext('order.management', url);
                if (!orderManagementPath) return;
                router.visit(orderManagementPath);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [url]);

    const renderMenuItem = (item) => {
        const active = item.path && isItemActive(item.path, url);
        const disabled = !item.path;

        return (
            <ListItem key={item.text} disablePadding sx={{ display: 'block' }}>
                <Tooltip title={disabled ? `${item.text} · Unavailable` : (!open ? item.text : '')} placement="right">
                    <ListItemButton
                        component={disabled ? 'button' : Link}
                        href={disabled ? undefined : item.path}
                        disabled={disabled}
                        sx={{
                            minHeight: 46,
                            mx: open ? 1.5 : 1,
                            mb: 0.5,
                            px: open ? 1.5 : 0,
                            justifyContent: open ? 'flex-start' : 'center',
                            borderRadius: '14px',
                            color: active ? '#fff' : '#496173',
                            background: active ? 'linear-gradient(135deg, #063455 0%, #0c67a7 100%)' : 'transparent',
                            boxShadow: active ? '0 16px 28px rgba(6, 52, 85, 0.18)' : 'none',
                            '&:hover': {
                                background: active ? 'linear-gradient(135deg, #063455 0%, #0c67a7 100%)' : 'rgba(12, 103, 167, 0.08)',
                            },
                            '&.Mui-disabled': {
                                opacity: 0.5,
                            },
                        }}
                    >
                        <ListItemIcon
                            sx={{
                                minWidth: 0,
                                width: 36,
                                height: 36,
                                mr: open ? 1.25 : 0,
                                borderRadius: '12px',
                                justifyContent: 'center',
                                color: active ? '#fff' : '#5f7182',
                                bgcolor: active ? 'rgba(255,255,255,0.14)' : 'rgba(6,52,85,0.04)',
                            }}
                        >
                            {item.icon}
                        </ListItemIcon>
                        {open ? (
                            <ListItemText
                                primary={item.text}
                                primaryTypographyProps={{
                                    fontSize: '0.95rem',
                                    fontWeight: active ? 700 : 600,
                                    whiteSpace: 'nowrap',
                                }}
                            />
                        ) : null}
                    </ListItemButton>
                </Tooltip>
            </ListItem>
        );
    };

    return (
        <Box sx={{ display: 'flex' }}>
            <CssBaseline />
            <AppBar position="fixed" open={open}>
                <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 1.5, md: 2.25 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                        <IconButton
                            color="primary"
                            onClick={() => setOpen((prev) => !prev)}
                            sx={{
                                width: 42,
                                height: 42,
                                bgcolor: 'rgba(6,52,85,0.06)',
                                border: '1px solid rgba(12, 103, 167, 0.12)',
                                '&:hover': { bgcolor: 'rgba(6,52,85,0.1)' },
                            }}
                        >
                            {open ? <MenuOpenRoundedIcon /> : <MenuRoundedIcon />}
                        </IconButton>
                        <Box>
                            <Typography variant="h6" sx={{ color: '#0f2940', fontWeight: 800, letterSpacing: '-0.02em' }}>
                                {workspaceTitle}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#6b7a89' }}>
                                {workspaceSubtitle}
                            </Typography>
                        </Box>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                        <IconButton
                            onClick={() => setShowNotification(true)}
                            sx={{
                                width: 44,
                                height: 44,
                                bgcolor: 'rgba(6,52,85,0.06)',
                                border: '1px solid rgba(12, 103, 167, 0.12)',
                            }}
                        >
                            <NotificationsRoundedIcon sx={{ color: '#063455' }} />
                        </IconButton>
                        <Button
                            onClick={() => setShowProfile(true)}
                            sx={{
                                minWidth: 0,
                                px: 1,
                                py: 0.75,
                                borderRadius: '18px',
                                border: '1px solid rgba(226,232,240,0.95)',
                                color: '#0f2940',
                                textTransform: 'none',
                                gap: 1,
                            }}
                        >
                            <Avatar sx={{ width: 38, height: 38, bgcolor: '#063455', fontWeight: 700 }}>
                                {(auth.user?.name || 'U').slice(0, 1).toUpperCase()}
                            </Avatar>
                            <Box sx={{ textAlign: 'left', display: { xs: 'none', md: 'block' } }}>
                                <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, lineHeight: 1.2 }}>
                                    {auth.user?.name || 'User'}
                                </Typography>
                                <Typography sx={{ fontSize: '0.77rem', color: '#6b7a89', lineHeight: 1.2 }}>
                                    {auth.role || 'staff'}
                                </Typography>
                            </Box>
                        </Button>
                    </Box>
                </Toolbar>
            </AppBar>

            <Drawer variant="permanent" open={open}>
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        height: '100%',
                        overflow: 'hidden',
                    }}
                >
                    <Box
                        sx={{
                            minHeight: POS_TOPBAR_HEIGHT,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: open ? 'flex-start' : 'center',
                            px: open ? 2.25 : 1,
                            borderBottom: '1px solid rgba(226,232,240,0.82)',
                        }}
                    >
                        {open ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                                <Box
                                    component="img"
                                    src="/assets/slogo.png"
                                    alt="AFOHS Club"
                                    sx={{ width: 44, height: 44, objectFit: 'contain' }}
                                />
                                <Box sx={{ minWidth: 0 }}>
                                    <Typography sx={{ color: '#0f2940', fontWeight: 800, fontSize: '1rem', lineHeight: 1.2 }}>
                                        AFOHS Club
                                    </Typography>
                                    <Typography sx={{ color: '#6b7a89', fontSize: '0.76rem' }}>
                                        Restaurant & POS
                                    </Typography>
                                </Box>
                            </Box>
                        ) : (
                            <Box
                                component="img"
                                src="/assets/slogo.png"
                                alt="AFOHS Club"
                                sx={{ width: 38, height: 38, objectFit: 'contain' }}
                            />
                        )}
                    </Box>

                    <Box
                        className="premium-scroll"
                        sx={{
                            flexGrow: 1,
                            overflowY: 'auto',
                            overflowX: 'hidden',
                            px: open ? 1 : 0.5,
                            py: 1.5,
                            scrollbarWidth: 'none',
                            '&::-webkit-scrollbar': { display: 'none' },
                        }}
                    >
                        {role !== 'kitchen' ? (
                            <Box sx={{ px: open ? 0.75 : 0.5, pb: 1.5 }}>
                                <Tooltip title={!open ? 'New Order' : ''} placement="right">
                                    <Button
                                        fullWidth
                                        variant="contained"
                                        startIcon={open ? <AddRoundedIcon /> : null}
                                        onClick={() => {
                                            const newOrderPath = safeRouteForContext('order.new', url);
                                            if (!newOrderPath) return;
                                            router.visit(newOrderPath);
                                        }}
                                        sx={{
                                            minWidth: 0,
                                            minHeight: 42,
                                            justifyContent: 'center',
                                            borderRadius: '14px',
                                            boxShadow: '0 16px 24px rgba(6, 52, 85, 0.16)',
                                        }}
                                    >
                                        {open ? 'New Order' : <AddRoundedIcon />}
                                    </Button>
                                </Tooltip>
                            </Box>
                        ) : null}

                        {menuGroups.map((group, index) => (
                            <Box key={group.label} sx={{ mb: 1.5 }}>
                                {open ? (
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            display: 'block',
                                            px: 1.75,
                                            pb: 0.75,
                                            color: '#8a99a8',
                                            fontWeight: 700,
                                            letterSpacing: '0.12em',
                                            textTransform: 'uppercase',
                                        }}
                                    >
                                        {group.label}
                                    </Typography>
                                ) : index > 0 ? (
                                    <Divider sx={{ mx: 1.5, my: 1.25, borderColor: 'rgba(226,232,240,0.88)' }} />
                                ) : null}
                                <List disablePadding>
                                    {group.items.map(renderMenuItem)}
                                </List>
                            </Box>
                        ))}
                    </Box>
                </Box>
            </Drawer>

            <Modal open={showNotification} onClose={() => setShowNotification(false)} closeAfterTransition>
                <Slide direction="left" in={showNotification} mountOnEnter unmountOnExit>
                    <Box
                        sx={{
                            position: 'fixed',
                            top: 12,
                            bottom: 12,
                            right: 12,
                            width: { xs: 'calc(100% - 24px)', sm: 560 },
                            bgcolor: '#fff',
                            boxShadow: '0 24px 48px rgba(15, 23, 42, 0.18)',
                            zIndex: 1300,
                            overflowY: 'auto',
                            borderRadius: '20px',
                        }}
                    >
                        <NotificationsPanel onClose={() => setShowNotification(false)} />
                    </Box>
                </Slide>
            </Modal>

            <Modal open={showProfile} onClose={() => setShowProfile(false)} sx={{ zIndex: 1300 }}>
                <Box
                    sx={{
                        position: 'fixed',
                        top: 12,
                        bottom: 12,
                        right: 12,
                        width: { xs: 'calc(100% - 24px)', sm: 420 },
                        bgcolor: '#fff',
                        boxShadow: '0 24px 48px rgba(15, 23, 42, 0.18)',
                        zIndex: 1300,
                        overflowY: 'auto',
                        borderRadius: '20px',
                    }}
                >
                    {profileView === 'profile' ? <EmployeeProfileScreen setProfileView={setProfileView} onClose={() => setShowProfile(false)} /> : null}
                    {profileView === 'loginActivity' ? <LoginActivityScreen setProfileView={setProfileView} /> : null}
                    {profileView === 'shiftActivity' ? <ShiftActivityScreen setProfileView={setProfileView} /> : null}
                    {profileView === 'logoutSuccess' ? <LogoutScreen setProfileView={setProfileView} /> : null}
                </Box>
            </Modal>
        </Box>
    );
}
