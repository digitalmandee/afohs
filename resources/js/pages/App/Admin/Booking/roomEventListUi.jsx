import React from 'react';
import { Box, Chip, Stack, TableCell, TableRow, Tooltip, Typography } from '@mui/material';
import { AssignmentReturnOutlined, MeetingRoomOutlined, ReceiptLongOutlined, UndoOutlined, VisibilityOutlined } from '@mui/icons-material';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import AppPage from '@/components/App/ui/AppPage';
import SurfaceCard from '@/components/App/ui/SurfaceCard';
import { AdminIconAction, AdminPillAction, AdminRowActionGroup } from '@/components/App/ui/AdminRowActions';

export function formatDate(value) {
    return value ? new Date(value).toLocaleDateString('en-GB') : 'N/A';
}

export function formatAmount(value) {
    const numeric = Number(value || 0);
    return Number.isFinite(numeric) ? Math.round(numeric) : 0;
}

export function valueOrDash(value) {
    return value === null || value === undefined || value === '' ? '-' : value;
}

export function TruncatedValue({ value, fallback = 'N/A', maxWidth = 160 }) {
    const resolved = valueOrDash(value) || fallback;
    return (
        <Tooltip title={resolved}>
            <Typography
                component="span"
                sx={{
                    display: 'inline-block',
                    maxWidth,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    verticalAlign: 'bottom',
                }}
            >
                {resolved}
            </Typography>
        </Tooltip>
    );
}

const ROOM_STATUS_TONES = {
    confirmed: { label: 'Confirmed', color: '#0e5f3c', background: 'rgba(14, 95, 60, 0.12)' },
    checkedin: { label: 'Checked In', color: '#8a6d00', background: 'rgba(217, 164, 0, 0.14)' },
    checkedout: { label: 'Checked Out', color: '#0b5ed7', background: 'rgba(11, 94, 215, 0.12)' },
    cancelled: { label: 'Cancelled', color: '#b42318', background: 'rgba(180, 35, 24, 0.12)' },
    refunded: { label: 'Refunded', color: '#7c3aed', background: 'rgba(124, 58, 237, 0.12)' },
    pending: { label: 'Pending', color: '#475467', background: 'rgba(71, 84, 103, 0.12)' },
};

const EVENT_STATUS_TONES = {
    confirmed: { label: 'Confirmed', color: '#0e5f3c', background: 'rgba(14, 95, 60, 0.12)' },
    completed: { label: 'Completed', color: '#0b5ed7', background: 'rgba(11, 94, 215, 0.12)' },
    cancelled: { label: 'Cancelled', color: '#b42318', background: 'rgba(180, 35, 24, 0.12)' },
    refunded: { label: 'Refunded', color: '#7c3aed', background: 'rgba(124, 58, 237, 0.12)' },
    paid: { label: 'Paid', color: '#0e5f3c', background: 'rgba(14, 95, 60, 0.12)' },
    unpaid: { label: 'Unpaid', color: '#8a6d00', background: 'rgba(217, 164, 0, 0.14)' },
    pending: { label: 'Pending', color: '#475467', background: 'rgba(71, 84, 103, 0.12)' },
};

function buildStatusChip(toneMap, status) {
    const key = String(status || 'pending')
        .replace(/[_\s]+/g, '')
        .toLowerCase();
    const tone = toneMap[key] || {
        label: String(status || 'Pending').replace(/_/g, ' '),
        color: '#475467',
        background: 'rgba(71, 84, 103, 0.12)',
    };

    return (
        <Chip
            size="small"
            label={tone.label}
            sx={{
                fontWeight: 700,
                color: tone.color,
                backgroundColor: tone.background,
                borderRadius: '999px',
                textTransform: 'capitalize',
            }}
        />
    );
}

export function RoomStatusChip({ status }) {
    return buildStatusChip(ROOM_STATUS_TONES, status);
}

export function EventStatusChip({ status }) {
    return buildStatusChip(EVENT_STATUS_TONES, status);
}

export function TableActionStack({ children }) {
    return <AdminRowActionGroup>{children}</AdminRowActionGroup>;
}

export function IconActionButton({ title, onClick, children, color = '#063455' }) {
    const muiColor = color === '#f57c00' ? 'warning' : color === '#d32f2f' ? 'error' : 'primary';
    return <AdminIconAction title={title} onClick={onClick} color={muiColor}>{children}</AdminIconAction>;
}

const compactActionIconMap = {
    View: { title: 'View', icon: <VisibilityOutlined fontSize="small" />, color: 'primary' },
    'Check In': { title: 'Check In', icon: <MeetingRoomOutlined fontSize="small" />, color: 'primary' },
    'Check Out': { title: 'Check Out', icon: <LogoutOutlinedIcon fontSize="small" />, color: 'primary' },
    Orders: { title: 'Orders', icon: <ReceiptLongOutlined fontSize="small" />, color: 'primary' },
    Undo: { title: 'Undo', icon: <UndoOutlined fontSize="small" />, color: 'primary' },
    Refund: { title: 'Refund', icon: <AssignmentReturnOutlined fontSize="small" />, color: 'error' },
    'Return Advance': { title: 'Return Advance', icon: <AssignmentReturnOutlined fontSize="small" />, color: 'error' },
};

export function OutlineActionButton({ label, onClick, color = 'primary', disabled = false }) {
    const mappedAction = compactActionIconMap[label];

    if (mappedAction) {
        return (
            <AdminIconAction
                title={mappedAction.title}
                onClick={onClick}
                color={mappedAction.color}
                disabled={disabled}
            >
                {mappedAction.icon}
            </AdminIconAction>
        );
    }

    return <AdminPillAction label={label} onClick={onClick} color={color} disabled={disabled} />;
}

export function TotalsRow({ items = [] }) {
    if (!items.length) {
        return null;
    }

    return (
        <Box
            sx={{
                mt: 2,
                px: { xs: 1.5, md: 2 },
                py: 1.5,
                borderRadius: '16px',
                border: '1px solid rgba(191, 219, 254, 0.75)',
                background: 'linear-gradient(180deg, rgba(239,246,255,0.92) 0%, rgba(248,250,252,0.98) 100%)',
            }}
        >
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.25} alignItems={{ xs: 'flex-start', md: 'center' }} flexWrap="wrap" useFlexGap>
                <Typography variant="body2" sx={{ fontWeight: 800, color: '#0a3d62', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    Grand Total
                </Typography>
                {items.map((item) => (
                    <Chip
                        key={item.label}
                        variant="outlined"
                        label={`${item.label}: ${item.value}`}
                        sx={{
                            borderRadius: '999px',
                            fontWeight: 700,
                            color: '#0f172a',
                            backgroundColor: 'rgba(255,255,255,0.88)',
                        }}
                    />
                ))}
            </Stack>
        </Box>
    );
}

export function PageShell({ eyebrow, title, subtitle, filterTitle = 'Live Filters', filterSubtitle, filterContent, tableTitle, tableSubtitle, children }) {
    return (
        <AppPage eyebrow={eyebrow} title={title} subtitle={subtitle}>
            <SurfaceCard title={filterTitle} subtitle={filterSubtitle}>
                {filterContent}
            </SurfaceCard>
            <SurfaceCard title={tableTitle} subtitle={tableSubtitle}>
                {children}
            </SurfaceCard>
        </AppPage>
    );
}

export function SummaryRow({ label, value, tone = 'default' }) {
    const toneSx =
        tone === 'success'
            ? { color: '#0e5f3c' }
            : tone === 'danger'
              ? { color: '#b42318' }
              : { color: 'text.primary' };

    return (
        <TableRow>
            <TableCell colSpan={2} sx={{ fontWeight: 700 }}>
                {label}
            </TableCell>
            <TableCell align="right" sx={{ fontWeight: 700, ...toneSx }}>
                {value}
            </TableCell>
        </TableRow>
    );
}
