import React from 'react';
import { router } from '@inertiajs/react';
import {
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Grid,
    MenuItem,
    TableCell,
    TableRow,
    TextField,
    Typography,
} from '@mui/material';
import { DeleteOutline, EditOutlined, VisibilityOutlined } from '@mui/icons-material';
import debounce from 'lodash.debounce';
import { useSnackbar } from 'notistack';
import AppPage from '@/components/App/ui/AppPage';
import AdminDataTable from '@/components/App/ui/AdminDataTable';
import FilterToolbar from '@/components/App/ui/FilterToolbar';
import StatCard from '@/components/App/ui/StatCard';
import SurfaceCard from '@/components/App/ui/SurfaceCard';
import { AdminIconAction, AdminRowActionGroup } from '@/components/App/ui/AdminRowActions';

export default function GuestIndex({ customerData, filters = {}, guestTypes = [] }) {
    const { enqueueSnackbar } = useSnackbar();
    const rows = customerData?.data || [];
    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
    const [guestToDelete, setGuestToDelete] = React.useState(null);
    const [localFilters, setLocalFilters] = React.useState({
        search: filters?.search || '',
        guest_type_id: filters?.guest_type_id || '',
        page: 1,
    });
    const filtersRef = React.useRef(localFilters);

    const submitFilters = React.useCallback((nextFilters) => {
        const payload = {};

        if (nextFilters.search?.trim()) {
            payload.search = nextFilters.search.trim();
        }

        if (nextFilters.guest_type_id) {
            payload.guest_type_id = nextFilters.guest_type_id;
        }

        if (Number(nextFilters.page) > 1) {
            payload.page = Number(nextFilters.page);
        }

        router.get(route('guests.index'), payload, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    }, []);

    const debouncedSubmit = React.useMemo(() => debounce((nextFilters) => submitFilters(nextFilters), 350), [submitFilters]);

    React.useEffect(() => () => debouncedSubmit.cancel(), [debouncedSubmit]);

    React.useEffect(() => {
        const next = {
            search: filters?.search || '',
            guest_type_id: filters?.guest_type_id || '',
            page: 1,
        };

        filtersRef.current = next;
        setLocalFilters(next);
    }, [filters?.guest_type_id, filters?.search]);

    const updateFilters = React.useCallback(
        (partial, { immediate = false } = {}) => {
            const next = {
                ...filtersRef.current,
                ...partial,
            };

            if (!Object.prototype.hasOwnProperty.call(partial, 'page')) {
                next.page = 1;
            }

            filtersRef.current = next;
            setLocalFilters(next);

            if (immediate) {
                debouncedSubmit.cancel();
                submitFilters(next);
                return;
            }

            debouncedSubmit(next);
        },
        [debouncedSubmit, submitFilters],
    );

    const resetFilters = React.useCallback(() => {
        const next = {
            search: '',
            guest_type_id: '',
            page: 1,
        };

        debouncedSubmit.cancel();
        filtersRef.current = next;
        setLocalFilters(next);
        submitFilters(next);
    }, [debouncedSubmit, submitFilters]);

    const confirmDelete = React.useCallback(() => {
        if (!guestToDelete) {
            return;
        }

        router.delete(route('guests.destroy', guestToDelete.id), {
            preserveScroll: true,
            onSuccess: () => {
                enqueueSnackbar('Guest deleted successfully.', { variant: 'success' });
                setDeleteDialogOpen(false);
                setGuestToDelete(null);
            },
            onError: () => {
                enqueueSnackbar('Failed to delete guest.', { variant: 'error' });
            },
        });
    }, [enqueueSnackbar, guestToDelete]);

    return (
        <>
            <AppPage
                eyebrow="Guest Management"
                title="Guests"
                subtitle="Search, review, and manage real guest records backed by the customer and guest-type master data."
                actions={[
                    <Button key="trashed" variant="outlined" color="error" onClick={() => router.visit(route('guests.trashed'))}>
                        Trashed
                    </Button>,
                    <Button key="add" variant="contained" onClick={() => router.visit(route('guests.create'))}>
                        Add Guest
                    </Button>,
                ]}
            >
                <Grid container spacing={2.25}>
                    <Grid item xs={12} md={4}>
                        <StatCard label="Guests" value={customerData?.total || 0} accent />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <StatCard label="Showing" value={rows.length} tone="light" />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <StatCard label="Active Guest Types" value={guestTypes.length} tone="muted" />
                    </Grid>
                </Grid>

                <SurfaceCard title="Live Filters" subtitle="Refine guest records by guest number, name, contact, email, sponsor, or guest type.">
                    <FilterToolbar
                        title="Filters"
                        subtitle="Refine guest records and click Apply."
                        lowChrome
                        onApply={() => submitFilters(localFilters)}
                        onReset={resetFilters}
                    >
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={7}>
                                <TextField
                                    size="small"
                                    label="Search guests"
                                    placeholder="Guest #, name, contact, email, or sponsor"
                                    value={localFilters.search}
                                    onChange={(event) => updateFilters({ search: event.target.value })}
                                    fullWidth
                                />
                            </Grid>
                            <Grid item xs={12} md={5}>
                                <TextField
                                    size="small"
                                    select
                                    label="Guest Type"
                                    value={localFilters.guest_type_id}
                                    onChange={(event) => updateFilters({ guest_type_id: event.target.value }, { immediate: true })}
                                    fullWidth
                                >
                                    <MenuItem value="">All guest types</MenuItem>
                                    {guestTypes.map((guestType) => (
                                        <MenuItem key={guestType.id} value={guestType.id}>
                                            {guestType.name}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                        </Grid>
                    </FilterToolbar>
                </SurfaceCard>

                <SurfaceCard title="Guest Register" subtitle="Guest profiles with linked type, sponsor information, and compact operational actions.">
                    <AdminDataTable
                        columns={[
                            { key: 'customer_no', label: 'Guest #', minWidth: 130 },
                            { key: 'name', label: 'Guest', minWidth: 220 },
                            { key: 'guest_type', label: 'Guest Type', minWidth: 150 },
                            { key: 'contact', label: 'Contact', minWidth: 220 },
                            { key: 'member', label: 'Authorized By', minWidth: 220 },
                            { key: 'actions', label: 'Actions', minWidth: 96, align: 'right' },
                        ]}
                        rows={rows}
                        pagination={customerData}
                        emptyMessage="No guest records found."
                        tableMinWidth={1180}
                        stickyLastColumn
                        renderRow={(guest) => (
                            <TableRow key={guest.id} hover>
                                <TableCell sx={{ fontWeight: 700, color: 'text.primary' }}>{guest.customer_no}</TableCell>
                                <TableCell>
                                    <Typography sx={{ fontWeight: 700, color: 'text.primary' }}>{guest.name}</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {guest.gender || 'Unspecified'}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    {guest.guest_type?.name ? <Chip size="small" label={guest.guest_type.name} color="primary" variant="outlined" /> : '-'}
                                </TableCell>
                                <TableCell>
                                    <Typography>{guest.contact || '-'}</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {guest.email || '-'}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography>{guest.member_name || '-'}</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {guest.member_no || '-'}
                                    </Typography>
                                </TableCell>
                                <TableCell align="right">
                                    <AdminRowActionGroup justify="flex-end">
                                        <AdminIconAction title="View Guest" onClick={() => router.visit(route('guests.show', guest.id))}>
                                            <VisibilityOutlined fontSize="small" />
                                        </AdminIconAction>
                                        <AdminIconAction title="Edit Guest" color="warning" onClick={() => router.visit(route('guests.edit', guest.id))}>
                                            <EditOutlined fontSize="small" />
                                        </AdminIconAction>
                                        <AdminIconAction
                                            title="Delete Guest"
                                            color="error"
                                            onClick={() => {
                                                setGuestToDelete(guest);
                                                setDeleteDialogOpen(true);
                                            }}
                                        >
                                            <DeleteOutline fontSize="small" />
                                        </AdminIconAction>
                                    </AdminRowActionGroup>
                                </TableCell>
                            </TableRow>
                        )}
                    />
                </SurfaceCard>
            </AppPage>

            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Delete Guest</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Delete <strong>{guestToDelete?.name}</strong>? This will move the guest to trash.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                    <Button color="error" variant="contained" onClick={confirmDelete}>
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
