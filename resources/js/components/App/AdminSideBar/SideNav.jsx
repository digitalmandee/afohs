import * as React from 'react';
import { Link, router, usePage, useRemember } from '@inertiajs/react';
import {
    AppBar as MuiAppBar,
    Avatar,
    Box,
    CssBaseline,
    Divider,
    Drawer as MuiDrawer,
    IconButton,
    List,
    ListItemButton,
    Tooltip,
    Typography,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import Toolbar from '@mui/material/Toolbar';
import HomeIcon from '@mui/icons-material/Home';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PeopleIcon from '@mui/icons-material/People';
import AssessmentIcon from '@mui/icons-material/Assessment';
import PaymentsIcon from '@mui/icons-material/Payments';
import SubscriptionsIcon from '@mui/icons-material/Subscriptions';
import LogoutIcon from '@mui/icons-material/Logout';
import SettingsIcon from '@mui/icons-material/Settings';
import StorageIcon from '@mui/icons-material/Storage';
import PlaceIcon from '@mui/icons-material/Place';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import KeyboardArrowRightRoundedIcon from '@mui/icons-material/KeyboardArrowRightRounded';
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded';
import { MdOutlinePointOfSale } from 'react-icons/md';
import { TiBusinessCard } from 'react-icons/ti';
import { FaRegAddressCard } from 'react-icons/fa';
import { FaKitchenSet } from 'react-icons/fa6';

const drawerWidthOpen = 248;
const drawerWidthClosed = 76;

const openedMixin = (theme) => ({
    width: drawerWidthOpen,
    transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
    }),
    overflowX: 'hidden',
});

const closedMixin = (theme) => ({
    width: drawerWidthClosed,
    transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
    }),
    overflowX: 'hidden',
});

const Drawer = styled(MuiDrawer, {
    shouldForwardProp: (prop) => prop !== 'open',
})(({ theme, open }) => ({
    width: open ? drawerWidthOpen : drawerWidthClosed,
    flexShrink: 0,
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
    '& .MuiDrawer-paper': {
        width: open ? drawerWidthOpen : drawerWidthClosed,
        borderRight: '1px solid rgba(207, 216, 227, 0.72)',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(247,249,252,0.98) 100%)',
        boxShadow: 'none',
        ...(open ? openedMixin(theme) : closedMixin(theme)),
    },
}));

const AppBar = styled(MuiAppBar, {
    shouldForwardProp: (prop) => prop !== 'open',
})(({ theme, open }) => ({
    zIndex: theme.zIndex.drawer + 1,
    marginLeft: open ? drawerWidthOpen : drawerWidthClosed,
    width: `calc(100% - ${open ? drawerWidthOpen : drawerWidthClosed}px)`,
    transition: theme.transitions.create(['width', 'margin'], {
        easing: theme.transitions.easing.sharp,
        duration: open ? theme.transitions.duration.enteringScreen : theme.transitions.duration.leavingScreen,
    }),
    background: 'rgba(255,255,255,0.82)',
    backdropFilter: 'blur(18px)',
    WebkitBackdropFilter: 'blur(18px)',
    borderBottom: '1px solid rgba(207,216,227,0.56)',
    boxShadow: 'none',
}));

const normalizePath = (fullPath) => new URL(fullPath, window.location.origin).pathname;

const isItemActive = (item, url) => {
    if (item.path && normalizePath(item.path) === url) {
        return true;
    }

    return Array.isArray(item.children) ? item.children.some((child) => isItemActive(child, url)) : false;
};

const findFirstActiveModule = (items, url) => items.find((item) => isItemActive(item, url)) || items[0] || null;

const buildPanelSections = (item) => {
    if (!item?.children?.length) {
        return [];
    }

    const overview = [];
    const sections = [];

    item.children.forEach((child) => {
        if (child.children?.length) {
            sections.push({
                key: child.text,
                title: child.text,
                items: child.children,
                collapsible: child.children.length > 6,
            });
            return;
        }

        overview.push(child);
    });

    if (overview.length > 0) {
        sections.unshift({
            key: 'overview',
            title: 'Overview',
            items: overview,
            collapsible: false,
        });
    }

    return sections;
};

const groupOrder = ['core', 'operations', 'system'];

const groupMeta = {
    core: { label: 'Core' },
    operations: { label: 'Operations' },
    system: { label: 'System' },
};

const groupMenuItems = (items) =>
    groupOrder
        .map((groupKey) => ({
            key: groupKey,
            label: groupMeta[groupKey].label,
            items: items.filter((item) => (item.group || 'operations') === groupKey),
        }))
        .filter((group) => group.items.length > 0);

const topLevelMenu = (permissions) => {
    const hasPermission = (itemPermission) => {
        if (!itemPermission) return true;
        const permissionList = Array.isArray(itemPermission) ? itemPermission : String(itemPermission).split('|');
        return permissionList.some((p) => permissions.includes(String(p).trim()));
    };

    const filterMenuItems = (items) =>
        items
            .filter((item) => {
                if (item.permission && !hasPermission(item.permission)) {
                    return false;
                }

                if (item.children) {
                    return filterMenuItems(item.children).length > 0;
                }

                return true;
            })
            .map((item) => ({
                ...item,
                children: item.children ? filterMenuItems(item.children) : undefined,
            }));

    return filterMenuItems([
        {
            text: 'Dashboard',
            short: 'Home',
            icon: <HomeIcon />,
            path: route('dashboard'),
            permission: 'dashboard.view',
            group: 'core',
        },
        {
            text: 'Room & Event',
            short: 'Stay',
            icon: <CalendarMonthIcon />,
            group: 'core',
            children: [
                { text: 'Guests', path: route('guests.index'), permission: 'guests.view' },
                { text: 'Guest Types', path: route('guest-types.index'), permission: 'guest-types.view' },
                {
                    text: 'Rooms',
                    children: [
                        { text: 'Dashboard', path: route('rooms.dashboard'), permission: 'rooms.bookings.view' },
                        { text: 'Calendar', path: route('rooms.booking.calendar'), permission: 'rooms.bookings.calendar' },
                        { text: 'Room Bookings', path: route('rooms.manage'), permission: 'rooms.bookings.view' },
                        { text: 'Check-In', path: route('rooms.checkin'), permission: 'rooms.bookings.checkin' },
                        { text: 'Check-Out', path: route('rooms.checkout'), permission: 'rooms.bookings.checkout' },
                        { text: 'Cancelled', path: route('rooms.booking.cancelled'), permission: 'rooms.bookings.cancelled' },
                        { text: 'Request', path: route('rooms.request'), permission: 'rooms.bookings.requests' },
                        { text: 'Add Room', path: route('rooms.add'), permission: 'rooms.create' },
                        { text: 'All Rooms', path: route('rooms.all'), permission: 'rooms.view' },
                        { text: 'Types', path: route('room-types.index'), permission: 'rooms.types.view' },
                        { text: 'Categories', path: route('room-categories.index'), permission: 'rooms.categories.view' },
                        { text: 'Charges Type', path: route('room-charges-type.index'), permission: 'rooms.chargesTypes.view' },
                        { text: 'MiniBar', path: route('room-minibar.index'), permission: 'rooms.miniBar.view' },
                        { text: 'Reports', path: route('rooms.reports'), permission: 'rooms.reports.view' },
                    ],
                },
                {
                    text: 'Events',
                    children: [
                        { text: 'Dashboard', path: route('events.dashboard'), permission: 'events.bookings.view' },
                        { text: 'Event Bookings', path: route('events.manage'), permission: 'events.bookings.view' },
                        { text: 'Completed', path: route('events.completed'), permission: 'events.bookings.completed' },
                        { text: 'Cancelled', path: route('events.cancelled'), permission: 'events.bookings.cancelled' },
                        { text: 'Calendar', path: route('events.calendar'), permission: 'events.bookings.calendar' },
                        { text: 'Venues', path: route('event-venues.index'), permission: 'events.venue.view' },
                        { text: 'Menu', path: route('event-menu.index'), permission: 'events.menu.view' },
                        { text: 'Menu Category', path: route('event-menu-category.index'), permission: 'events.menuCategories.view' },
                        { text: 'Menu Type', path: route('event-menu-type.index'), permission: 'events.menuTypes.view' },
                        { text: 'Charges Type', path: route('event-charges-type.index'), permission: 'events.chargesTypes.view' },
                        { text: 'Menu AddOn', path: route('event-menu-addon.index'), permission: 'events.menuAdons.view' },
                        { text: 'Reports', path: route('events.reports'), permission: 'events.reports.view' },
                    ],
                },
            ],
        },
        {
            text: 'Membership',
            short: 'Club',
            icon: <TiBusinessCard style={{ width: 21, height: 21 }} />,
            permission: 'members.view',
            group: 'core',
            children: [
                { text: 'Dashboard', path: route('membership.dashboard'), permission: 'members.view' },
                {
                    text: 'Primary Members',
                    children: [
                        { text: 'Add Member', path: route('membership.add'), permission: 'members.create' },
                        { text: 'All Members', path: route('membership.members'), permission: 'members.view' },
                        { text: 'Family Members', path: route('membership.family-members'), permission: 'family-members.view' },
                    ],
                },
                {
                    text: 'Corporate Members',
                    children: [
                        { text: 'Add Corporate', path: route('corporate-membership.add'), permission: 'corporate-companies.create' },
                        { text: 'All Corporate', path: route('corporate-membership.members'), permission: 'corporate-members.view' },
                        { text: 'Family Members', path: route('corporate-membership.family-members'), permission: 'corporate-members.view' },
                        { text: 'Companies', path: route('corporate-companies.index'), permission: 'corporate-companies.view' },
                    ],
                },
                { text: 'Category', path: route('member-categories.index'), permission: 'member-categories.view' },
                { text: 'Applied Member', path: route('applied-member.index'), permission: 'applied-members.view' },
                { text: 'Partners / Affiliates', path: route('admin.membership.partners-affiliates.index'), permission: 'partners-affiliates.view' },
            ],
        },
        {
            text: 'Employee HR',
            short: 'People',
            icon: <PeopleIcon />,
            permission: 'employees.view',
            group: 'operations',
            children: [
                { text: 'Dashboard', path: route('employees.dashboard'), permission: 'employees.view' },
                { text: 'Transfers', path: route('employees.transfers.index'), permission: 'employees.transfers.view' },
                { text: 'Departments', path: route('employees.departments'), permission: 'employees.departments.view' },
                { text: 'Sub Departments', path: route('employees.subdepartments'), permission: 'employees.departments.view' },
                { text: 'Designations', path: route('designations.index'), permission: 'employees.designations.view' },
                { text: 'Shifts', path: route('shifts.index'), permission: 'employees.shifts.view' },
                { text: 'Companies', path: route('branches.index'), permission: 'employees.branches.view' },
                { text: 'Leave Category', path: route('employees.leaves.category.index'), permission: 'employees.leaves.view' },
                { text: 'Leave Application', path: route('employees.leaves.application.index'), permission: 'employees.leaves.view' },
                { text: 'Leave Report', path: route('employees.leaves.application.report'), permission: 'employees.leaves.view' },
                { text: 'Attendance', path: route('employees.attendances.dashboard'), permission: 'employees.attendance.view' },
                { text: 'Management', path: route('employees.attendances.management'), permission: 'employees.attendance.view' },
                { text: 'Report', path: route('employees.attendances.report'), permission: 'employees.attendance.view' },
                { text: 'Monthly Report', path: route('employees.attendances.monthly.report'), permission: 'employees.attendance.view' },
                { text: 'Loans', path: route('employees.loans.index'), permission: 'employees.loans.view' },
                { text: 'Advances', path: route('employees.advances.index'), permission: 'employees.advances.view' },
                { text: 'Reports', path: route('employees.reports'), permission: 'employees.reports.view' },
                { text: 'Payroll', path: route('employees.payroll.dashboard'), permission: 'employees.payroll.view' },
                { text: 'Payroll History', path: route('employee.payroll.history'), permission: 'employees.payroll.view' },
                { text: 'Salary Sheet', path: route('employees.payroll.salary-sheet'), permission: 'employees.payroll.view' },
                { text: 'Assets Inventory', path: route('employees.assets.index'), permission: 'employees.assets.view' },
                { text: 'Asset Assignments', path: route('employees.asset-attachments.index'), permission: 'employees.assets.view' },
            ],
        },
        {
            text: 'POS',
            short: 'POS',
            icon: <MdOutlinePointOfSale style={{ width: 20, height: 20 }} />,
            path: '/pos',
            permission: 'pos.view',
            group: 'core',
        },
        {
            text: 'Reports',
            short: 'Report',
            icon: <AssessmentIcon />,
            permission: 'reports.view',
            group: 'operations',
            children: [
                { text: 'Membership Reports', path: route('membership.reports'), permission: 'reports.view' },
                { text: 'POS Reports', path: route('admin.reports.pos.all'), permission: 'reports.pos.view' },
            ],
        },
        {
            text: 'Finance',
            short: 'Funds',
            icon: <PaymentsIcon />,
            permission: 'financial.view',
            group: 'operations',
            children: [
                { text: 'Dashboard', path: route('finance.dashboard'), permission: 'financial.dashboard.view' },
                { text: 'Add Transaction', path: route('finance.transaction.create'), permission: 'financial.create' },
                { text: 'Transaction', path: route('finance.transaction'), permission: 'financial.view' },
                { text: 'Bulk Fee', path: route('finance.maintenance.create'), permission: 'financial.create' },
                { text: 'Charge Types', path: route('finance.charge-types.index'), permission: 'finance.charge-types.view' },
                { text: 'Payment Accounts', path: route('finance.payment-accounts.index'), permission: 'finance.payment-accounts.view' },
                { text: 'Vouchers', path: route('vouchers.dashboard'), permission: 'finance.vouchers.view' },
            ],
        },
        {
            text: 'Accounting',
            short: 'Books',
            icon: <StorageIcon />,
            permission: 'financial.view',
            group: 'operations',
            children: [
                {
                    text: 'Operations',
                    children: [
                        { text: 'Dashboard', path: route('accounting.dashboard'), permission: 'financial.view' },
                        { text: 'Chart of Accounts', path: route('accounting.coa.index'), permission: 'financial.view' },
                        { text: 'Journal Entries', path: route('accounting.journals.index'), permission: 'financial.view' },
                        { text: 'Journal Approvals', path: route('accounting.journals.approvals'), permission: 'financial.view' },
                        { text: 'Reminder Delivery', path: route('accounting.journals.deliveries'), permission: 'financial.view' },
                        { text: 'General Ledger', path: route('accounting.general-ledger'), permission: 'financial.view' },
                        { text: 'Receivables', path: route('accounting.receivables'), permission: 'financial.view' },
                        { text: 'Outstanding', path: route('accounting.outstanding'), permission: 'financial.view' },
                        { text: 'Payables', path: route('accounting.payables'), permission: 'financial.view' },
                        { text: 'Expense Management', path: route('accounting.expenses'), permission: 'financial.view' },
                    ],
                },
                {
                    text: 'Banking & Control',
                    children: [
                        { text: 'Bank Accounts', path: route('accounting.bank-accounts.index'), permission: 'financial.view' },
                        { text: 'Bank Reconciliation', path: route('accounting.bank-reconciliation.index'), permission: 'financial.view' },
                        { text: 'Period Close', path: route('accounting.periods.index'), permission: 'financial.view' },
                        { text: 'Budgets', path: route('accounting.budgets.index'), permission: 'financial.view' },
                        { text: 'Posting Rules', path: route('accounting.rules.index'), permission: 'financial.view' },
                    ],
                },
                {
                    text: 'Reports',
                    children: [
                        { text: 'Trial Balance', path: route('accounting.reports.trial-balance'), permission: 'financial.view' },
                        { text: 'Balance Sheet', path: route('accounting.reports.balance-sheet'), permission: 'financial.view' },
                        { text: 'Profit & Loss', path: route('accounting.reports.profit-loss'), permission: 'financial.view' },
                        { text: 'Financial Statements', path: route('accounting.reports.financial-statements'), permission: 'financial.view' },
                        { text: 'Management Pack', path: route('accounting.reports.management-pack'), permission: 'financial.view' },
                        { text: 'AR Aging', path: route('accounting.reports.receivables-aging'), permission: 'financial.view' },
                        { text: 'AR by Source', path: route('accounting.reports.receivables-by-source'), permission: 'financial.view' },
                        { text: 'AP Aging', path: route('accounting.reports.payables-aging'), permission: 'financial.view' },
                    ],
                },
            ],
        },
        {
            text: 'Procurement',
            short: 'Supply',
            icon: <PaymentsIcon />,
            permission: 'financial.view',
            group: 'operations',
            children: [
                {
                    text: 'Transactions',
                    children: [
                        { text: 'Vendors', path: route('procurement.vendors.index'), permission: 'financial.view' },
                        { text: 'Purchase Orders', path: route('procurement.purchase-orders.index'), permission: 'financial.view' },
                        { text: 'Goods Receipts', path: route('procurement.goods-receipts.index'), permission: 'financial.view' },
                        { text: 'Vendor Bills', path: route('procurement.vendor-bills.index'), permission: 'financial.view' },
                        { text: 'Vendor Payments', path: route('procurement.vendor-payments.index'), permission: 'financial.view' },
                    ],
                },
                {
                    text: 'Controls',
                    children: [
                        { text: '3-Way Match', path: route('procurement.insights.discrepancies'), permission: 'financial.view' },
                        { text: 'Payment Run', path: route('procurement.payment-run.index'), permission: 'financial.view' },
                    ],
                },
            ],
        },
        {
            text: 'Inventory',
            short: 'Stock',
            icon: <PlaceIcon />,
            permission: 'pos.inventory.view',
            group: 'operations',
            children: [
                { text: 'Dashboard', path: route('inventory.dashboard'), permission: 'pos.inventory.view' },
                { text: 'Inventory Items', path: route('inventory.items.index'), permission: 'pos.inventory.view' },
                { text: 'Ingredients', path: route('inventory.ingredients.index'), permission: 'pos.inventory.ingredients.view' },
                { text: 'Item Categories', path: route('inventory.item-categories.index'), permission: 'pos.inventory.categories.view' },
                { text: 'Subcategories', path: route('inventory.sub-categories.index'), permission: 'pos.inventory.sub-categories.view' },
                { text: 'Manufacturers', path: route('inventory.manufacturers.index'), permission: 'pos.inventory.manufacturers.view' },
                { text: 'Units', path: route('inventory.units.index'), permission: 'pos.inventory.units.view' },
                { text: 'Warehouse Master', path: route('inventory.warehouses.index'), permission: 'pos.inventory.view' },
                { text: 'Warehouse Coverage', path: route('inventory.coverage.index'), permission: 'pos.inventory.view' },
                { text: 'Warehouse Categories', path: route('inventory.categories.index'), permission: 'pos.inventory.view' },
                { text: 'Locations', path: route('inventory.locations.index'), permission: 'pos.inventory.view' },
                { text: 'Stock Operations', path: route('inventory.operations.index'), permission: 'pos.inventory.view' },
                { text: 'Stock Documents', path: route('inventory.documents.index'), permission: 'pos.inventory.view' },
                { text: 'Valuation & Reconcile', path: route('inventory.valuation.index'), permission: 'pos.inventory.view' },
            ],
        },
        {
            text: 'Subscription',
            short: 'Sub',
            icon: <SubscriptionsIcon />,
            permission: 'subscriptions.view',
            group: 'operations',
            children: [
                { text: 'Dashboard', path: route('subscription.dashboard'), permission: 'subscriptions.dashboard.view' },
                { text: 'Management', path: route('subscriptions.management'), permission: 'subscriptions.view' },
                { text: 'Type', path: route('subscription-types.index'), permission: 'subscriptions.types.view' },
                { text: 'Categories', path: route('subscription-categories.index'), permission: 'subscriptions.categories.view' },
            ],
        },
        {
            text: 'Cards',
            short: 'Cards',
            icon: <FaRegAddressCard style={{ width: 20, height: 20 }} />,
            path: route('cards.dashboard'),
            permission: 'cards.view',
            group: 'operations',
        },
        {
            text: 'Restaurants',
            short: 'Food',
            icon: <FaKitchenSet style={{ width: 20, height: 20 }} />,
            permission: 'restaurant.locations.view|kitchen.locations.view',
            group: 'core',
            children: [
                { text: 'Dashboard', path: route('locations.index'), permission: 'restaurant.locations.view|kitchen.locations.view' },
                { text: 'Create New', path: route('locations.create'), permission: 'restaurant.locations.create|kitchen.locations.create' },
            ],
        },
        {
            text: 'Settings',
            short: 'Setup',
            icon: <SettingsIcon />,
            permission: 'settings.view',
            group: 'system',
            children: [
                { text: 'Role Management', path: route('admin.roles.index'), permission: 'roles.view' },
                { text: 'User Management', path: route('admin.users.index'), permission: 'users.view' },
                { text: 'Billing', path: route('admin.billing-settings.edit'), permission: 'settings.edit' },
                { text: 'Profile Settings', path: route('profile.edit') },
                { text: 'Password', path: route('password.edit') },
            ],
        },
        {
            text: 'Logout',
            short: 'Exit',
            icon: <LogoutIcon />,
            path: route('logout'),
            group: 'system',
        },
    ]);
};

function RailItem({ item, active, open, expanded, onClick }) {
    return (
        <Tooltip title={open ? '' : item.text} placement="right">
            <ListItemButton
                onClick={onClick}
                sx={{
                    width: open ? '100%' : 48,
                    minHeight: 48,
                    mb: 0.75,
                    mx: open ? 0 : 'auto',
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: open ? 'flex-start' : 'center',
                    px: open ? 1.15 : 0,
                    gap: open ? 1.1 : 0,
                    color: active ? '#ffffff' : '#66758a',
                    background: active
                        ? 'linear-gradient(135deg, #063455 0%, #0c4b6e 55%, #0c67a7 100%)'
                        : 'transparent',
                    border: active ? '1px solid rgba(6, 52, 85, 0.18)' : '1px solid transparent',
                    boxShadow: active ? '0 16px 30px rgba(6, 52, 85, 0.18)' : 'none',
                    '&:hover': {
                        backgroundColor: active ? 'transparent' : 'rgba(6, 52, 85, 0.06)',
                    },
                    '& svg': {
                        fontSize: '1.22rem',
                        fill: 'currentColor',
                        flexShrink: 0,
                    },
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>
                    {item.icon}
                </Box>
                {open ? (
                    <>
                        <Typography
                            sx={{
                                fontSize: '0.91rem',
                                fontWeight: active ? 700 : 600,
                                color: 'inherit',
                                flex: 1,
                                lineHeight: 1.2,
                            }}
                        >
                            {item.text}
                        </Typography>
                        {item.children?.length ? (
                            expanded ? (
                                <KeyboardArrowDownRoundedIcon sx={{ fontSize: '1rem !important' }} />
                            ) : (
                                <KeyboardArrowRightRoundedIcon sx={{ fontSize: '1rem !important' }} />
                            )
                        ) : null}
                    </>
                ) : null}
            </ListItemButton>
        </Tooltip>
    );
}

function PanelSection({ section, activePath, rememberedKey, openGroups, setOpenGroups }) {
    const hasActiveChild = section.items.some((child) => isItemActive(child, activePath));
    const isOpen = section.collapsible ? openGroups[rememberedKey] ?? hasActiveChild : true;

    return (
        <Box sx={{ mb: 1.5 }}>
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: 0.5,
                    px: 1.1,
                }}
            >
                <Typography
                    sx={{
                        fontSize: '0.66rem',
                        fontWeight: 800,
                        letterSpacing: '0.14em',
                        textTransform: 'uppercase',
                        color: '#8a94a6',
                    }}
                >
                    {section.title}
                </Typography>
                {section.collapsible ? (
                    <IconButton
                        size="small"
                        onClick={() =>
                            setOpenGroups((prev) => ({
                                ...prev,
                                [rememberedKey]: !(prev[rememberedKey] ?? hasActiveChild),
                            }))
                        }
                        sx={{ width: 24, height: 24, color: '#7b8794' }}
                    >
                        {isOpen ? <KeyboardArrowDownRoundedIcon fontSize="small" /> : <KeyboardArrowRightRoundedIcon fontSize="small" />}
                    </IconButton>
                ) : null}
            </Box>

            {!isOpen ? null : (
                <List disablePadding sx={{ display: 'flex', flexDirection: 'column', gap: 0.35 }}>
                    {section.items.map((entry) => {
                        const active = isItemActive(entry, activePath);
                        return (
                            <ListItemButton
                                key={entry.text}
                                component={Link}
                                href={entry.path}
                                sx={{
                                    minHeight: 36,
                                    px: 1.25,
                                    py: 0.55,
                                    borderRadius: '12px',
                                    background: active
                                        ? 'linear-gradient(135deg, rgba(6,52,85,0.09) 0%, rgba(12,103,167,0.10) 100%)'
                                        : 'transparent',
                                    color: active ? '#102a43' : '#52606d',
                                    border: active ? '1px solid rgba(6,52,85,0.09)' : '1px solid transparent',
                                    '&:hover': {
                                        backgroundColor: active ? 'transparent' : 'rgba(6,52,85,0.05)',
                                    },
                                }}
                            >
                                <Box
                                    sx={{
                                        width: active ? 18 : 5,
                                        height: 5,
                                        borderRadius: '999px',
                                        mr: 1,
                                        bgcolor: active ? '#0c67a7' : '#d3dae6',
                                        flexShrink: 0,
                                        transition: 'all 180ms ease',
                                    }}
                                />
                                <Typography
                                    sx={{
                                        fontSize: '0.84rem',
                                        fontWeight: active ? 700 : 600,
                                        color: 'inherit',
                                        lineHeight: 1.35,
                                    }}
                                >
                                    {entry.text}
                                </Typography>
                            </ListItemButton>
                        );
                    })}
                </List>
            )}
        </Box>
    );
}

export default function SideNav({ open, setOpen }) {
    const { url, props } = usePage();
    const auth = props?.auth || {};
    const permissions = Array.isArray(auth.permissions) ? auth.permissions : [];
    const menuItems = React.useMemo(() => topLevelMenu(permissions), [permissions]);
    const defaultModule = React.useMemo(() => findFirstActiveModule(menuItems, url), [menuItems, url]);
    const [expandedModuleKey, setExpandedModuleKey] = useRemember(defaultModule?.text || '', 'sidebarExpandedModuleV2');
    const [openGroups, setOpenGroups] = useRemember({}, 'sidebarPanelGroupsV2');
    const groupedMenuItems = React.useMemo(() => groupMenuItems(menuItems), [menuItems]);

    const expandedModule = menuItems.find((item) => item.text === expandedModuleKey) || null;
    const panelSections = buildPanelSections(expandedModule);

    const handlePrimaryAction = (item) => {
        if (item.text === 'Logout') {
            router.post(route('logout'));
            return;
        }

        if (item.children?.length) {
            setExpandedModuleKey((prev) => (prev === item.text ? '' : item.text));
            if (!open) {
                setOpen(true);
            }
            return;
        }

        if (item.path) {
            router.visit(item.path);
        }
    };

    return (
        <Box sx={{ display: 'flex' }}>
            <CssBaseline />

            <AppBar position="fixed" open={open}>
                <Toolbar sx={{ minHeight: '88px !important', px: 3, display: 'flex', justifyContent: 'space-between' }}>
                    <Box>
                        <Typography sx={{ fontWeight: 800, fontSize: '1.08rem', color: '#102a43', letterSpacing: '-0.02em' }}>
                            AFOHS Club Operations
                        </Typography>
                        <Typography sx={{ fontSize: '0.8rem', color: '#7b8794' }}>
                            Minimal workspace for operations, finance, and member management
                        </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <IconButton
                            sx={{
                                width: 44,
                                height: 44,
                                borderRadius: '16px',
                                background: 'linear-gradient(135deg, #063455 0%, #0c67a7 100%)',
                                color: '#fff',
                                boxShadow: '0 10px 22px rgba(6, 52, 85, 0.18)',
                            }}
                        >
                            <NotificationsNoneRoundedIcon />
                        </IconButton>

                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1.2,
                                px: 1,
                                py: 0.75,
                                borderRadius: '18px',
                                border: '1px solid rgba(207,216,227,0.56)',
                                bgcolor: 'rgba(255,255,255,0.75)',
                            }}
                        >
                            <Avatar sx={{ width: 40, height: 40, bgcolor: '#063455', borderRadius: '16px' }}>
                                {String(auth?.user?.name || 'S').charAt(0).toUpperCase()}
                            </Avatar>
                            <Box>
                                <Typography sx={{ fontWeight: 700, color: '#111827', lineHeight: 1.15 }}>
                                    {auth?.user?.name || 'User'}
                                </Typography>
                                <Typography sx={{ fontSize: '0.78rem', color: '#6b7280', textTransform: 'lowercase' }}>
                                    {auth?.role || ''}
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                </Toolbar>
            </AppBar>

            <Drawer variant="permanent" open={open}>
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        height: '100%',
                        width: '100%',
                        py: 1.5,
                        px: open ? 1 : 0.75,
                        background: 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(249,251,253,0.98) 100%)',
                    }}
                >
                    <Box
                        sx={{
                            minHeight: 64,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: open ? 'space-between' : 'center',
                            px: open ? 0.5 : 0,
                            mb: 1,
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.1 }}>
                            <img src="/assets/slogo.png" alt="AFOHS Club" style={{ width: 34, height: 34, objectFit: 'contain' }} />
                            {open ? (
                                <Box>
                                    <Typography sx={{ fontSize: '0.88rem', fontWeight: 800, color: '#102a43', lineHeight: 1.1 }}>
                                        AFOHS Club
                                    </Typography>
                                    <Typography sx={{ fontSize: '0.68rem', color: '#7b8794', lineHeight: 1.2 }}>
                                        Operations
                                    </Typography>
                                </Box>
                            ) : null}
                        </Box>

                        {open ? (
                            <IconButton
                                onClick={() => setOpen(false)}
                                sx={{
                                    width: 34,
                                    height: 34,
                                    borderRadius: '12px',
                                    color: '#063455',
                                    border: '1px solid rgba(207,216,227,0.88)',
                                    bgcolor: '#fff',
                                }}
                            >
                                <ChevronLeftIcon fontSize="small" />
                            </IconButton>
                        ) : null}
                    </Box>

                    <Divider sx={{ width: '100%', mb: 1.1 }} />

                    <Box className="premium-scroll" sx={{ flex: 1, width: '100%', overflowY: 'auto', pr: 0.1 }}>
                        {groupedMenuItems
                            .filter((group) => group.key !== 'system')
                            .map((group) => (
                                <Box key={group.key} sx={{ mb: 1.2 }}>
                                    {open ? (
                                        <Typography
                                            sx={{
                                                px: 1.15,
                                                mb: 0.65,
                                                fontSize: '0.63rem',
                                                fontWeight: 800,
                                                letterSpacing: '0.14em',
                                                textTransform: 'uppercase',
                                                color: '#98a3b3',
                                            }}
                                        >
                                            {group.label}
                                        </Typography>
                                    ) : null}
                                    <List disablePadding sx={{ display: 'flex', flexDirection: 'column', gap: 0.2 }}>
                                        {group.items.map((item) => {
                                            const itemActive = isItemActive(item, url);
                                            const expanded = open && expandedModule?.text === item.text && item.children?.length;

                                            return (
                                                <Box key={item.text}>
                                                    <RailItem
                                                        item={item}
                                                        open={open}
                                                        active={itemActive || expandedModule?.text === item.text}
                                                        expanded={expanded}
                                                        onClick={() => {
                                                            if (!open) {
                                                                setOpen(true);
                                                                if (item.children?.length) {
                                                                    setExpandedModuleKey(item.text);
                                                                    return;
                                                                }
                                                            }
                                                            handlePrimaryAction(item);
                                                        }}
                                                    />

                                                    {expanded ? (
                                                        <Box sx={{ pl: 0.2, pr: 0, py: 0.45 }}>
                                                            {panelSections.map((section) => (
                                                                <PanelSection
                                                                    key={section.key}
                                                                    section={section}
                                                                    activePath={url}
                                                                    rememberedKey={`${expandedModule.text}:${section.key}`}
                                                                    openGroups={openGroups}
                                                                    setOpenGroups={setOpenGroups}
                                                                />
                                                            ))}
                                                        </Box>
                                                    ) : null}
                                                </Box>
                                            );
                                        })}
                                    </List>
                                </Box>
                            ))}
                    </Box>

                    <Divider sx={{ width: '100%', my: 1.1 }} />

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.2 }}>
                        {groupedMenuItems
                            .filter((group) => group.key === 'system')
                            .flatMap((group) => group.items)
                            .map((item) => {
                                const itemActive = isItemActive(item, url);
                                const expanded = open && expandedModule?.text === item.text && item.children?.length;

                                return (
                                    <Box key={item.text}>
                                        <RailItem
                                            item={item}
                                            open={open}
                                            active={itemActive || expandedModule?.text === item.text}
                                            expanded={expanded}
                                            onClick={() => {
                                                if (!open && item.children?.length) {
                                                    setOpen(true);
                                                    setExpandedModuleKey(item.text);
                                                    return;
                                                }
                                                handlePrimaryAction(item);
                                            }}
                                        />

                                        {expanded ? (
                                            <Box sx={{ pl: 0.2, pr: 0, py: 0.45 }}>
                                                {panelSections.map((section) => (
                                                    <PanelSection
                                                        key={section.key}
                                                        section={section}
                                                        activePath={url}
                                                        rememberedKey={`${expandedModule.text}:${section.key}`}
                                                        openGroups={openGroups}
                                                        setOpenGroups={setOpenGroups}
                                                    />
                                                ))}
                                            </Box>
                                        ) : null}
                                    </Box>
                                );
                            })}

                        {!open ? (
                            <Tooltip title="Expand navigation" placement="right">
                                <IconButton
                                    onClick={() => setOpen(true)}
                                    sx={{
                                        width: 42,
                                        height: 42,
                                        borderRadius: '14px',
                                        border: '1px solid rgba(207,216,227,0.9)',
                                        background: '#fff',
                                        boxShadow: '0 10px 24px rgba(15, 23, 42, 0.08)',
                                        color: '#063455',
                                        alignSelf: 'center',
                                        mt: 0.25,
                                    }}
                                >
                                    <ChevronRightIcon />
                                </IconButton>
                            </Tooltip>
                        ) : null}
                    </Box>
                </Box>
            </Drawer>
        </Box>
    );
}
