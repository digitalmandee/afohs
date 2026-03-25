import React from 'react';
import { router } from '@inertiajs/react';
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    Grid,
    Switch,
    TableCell,
    TableRow,
    TextField,
    Typography,
} from '@mui/material';
import { Add, EditOutlined } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import AppPage from '@/components/App/ui/AppPage';
import AdminDataTable from '@/components/App/ui/AdminDataTable';
import StatCard from '@/components/App/ui/StatCard';
import SurfaceCard from '@/components/App/ui/SurfaceCard';
import { AdminIconAction, AdminRowActionGroup } from '@/components/App/ui/AdminRowActions';

export default function GuestTypesIndex({ guestTypes = [] }) {
    const { enqueueSnackbar } = useSnackbar();
    const [openDialog, setOpenDialog] = React.useState(false);
    const [editingType, setEditingType] = React.useState(null);
    const [formData, setFormData] = React.useState({ name: '', status: true });

    const handleOpen = React.useCallback((type = null) => {
        if (type) {
            setEditingType(type);
            setFormData({ name: type.name, status: !!type.status });
        } else {
            setEditingType(null);
            setFormData({ name: '', status: true });
        }

        setOpenDialog(true);
    }, []);

    const handleClose = React.useCallback(() => {
        setOpenDialog(false);
        setEditingType(null);
        setFormData({ name: '', status: true });
    }, []);

    const handleSubmit = React.useCallback(() => {
        if (editingType) {
            router.put(route('guest-types.update', editingType.id), formData, {
                preserveScroll: true,
                onSuccess: () => {
                    enqueueSnackbar('Guest type updated successfully.', { variant: 'success' });
                    handleClose();
                },
            });
            return;
        }

        router.post(route('guest-types.store'), formData, {
            preserveScroll: true,
            onSuccess: () => {
                enqueueSnackbar('Guest type created successfully.', { variant: 'success' });
                handleClose();
            },
        });
    }, [editingType, enqueueSnackbar, formData, handleClose]);

    const handleStatusChange = React.useCallback(
        (type) => {
            router.put(
                route('guest-types.update', type.id),
                {
                    name: type.name,
                    status: !type.status,
                },
                {
                    preserveScroll: true,
                    onSuccess: () => enqueueSnackbar('Guest type status updated.', { variant: 'success' }),
                },
            );
        },
        [enqueueSnackbar],
    );

    const activeCount = guestTypes.filter((type) => !!type.status).length;

    return (
        <>
            <AppPage
                eyebrow="Guest Management"
                title="Guest Types"
                subtitle="Maintain the active guest-type dictionary used by Room, Event, and Guest profile workflows."
                actions={[
                    <Button key="add" variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>
                        Add Guest Type
                    </Button>,
                ]}
            >
                <Grid container spacing={2.25}>
                    <Grid item xs={12} md={6}>
                        <StatCard label="Guest Types" value={guestTypes.length} accent />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <StatCard label="Active" value={activeCount} tone="light" />
                    </Grid>
                </Grid>

                <SurfaceCard title="Guest Type Register" subtitle="Compact icon-only actions with operational status control kept inline.">
                    <AdminDataTable
                        columns={[
                            { key: 'name', label: 'Name', minWidth: 280 },
                            { key: 'status', label: 'Status', minWidth: 180 },
                            { key: 'actions', label: 'Actions', minWidth: 84, align: 'right' },
                        ]}
                        rows={guestTypes}
                        emptyMessage="No guest types found."
                        tableMinWidth={760}
                        stickyLastColumn
                        renderRow={(type) => (
                            <TableRow key={type.id} hover>
                                <TableCell>
                                    <Typography sx={{ fontWeight: 700, color: 'text.primary' }}>{type.name}</Typography>
                                </TableCell>
                                <TableCell>
                                    <FormControlLabel
                                        control={<Switch checked={!!type.status} onChange={() => handleStatusChange(type)} color="primary" />}
                                        label={type.status ? 'Active' : 'Inactive'}
                                        sx={{ m: 0 }}
                                    />
                                </TableCell>
                                <TableCell align="right">
                                    <AdminRowActionGroup justify="flex-end">
                                        <AdminIconAction title="Edit Guest Type" color="warning" onClick={() => handleOpen(type)}>
                                            <EditOutlined fontSize="small" />
                                        </AdminIconAction>
                                    </AdminRowActionGroup>
                                </TableCell>
                            </TableRow>
                        )}
                    />
                </SurfaceCard>
            </AppPage>

            <Dialog open={openDialog} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '22px' } }}>
                <DialogTitle>{editingType ? 'Edit Guest Type' : 'Add Guest Type'}</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 0 }}>
                        <Grid item xs={12}>
                            <TextField
                                autoFocus
                                fullWidth
                                label="Name"
                                value={formData.name}
                                onChange={(event) => setFormData((current) => ({ ...current, name: event.target.value }))}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <FormControlLabel
                                control={<Switch checked={!!formData.status} onChange={(event) => setFormData((current) => ({ ...current, status: event.target.checked }))} />}
                                label={formData.status ? 'Active' : 'Inactive'}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button onClick={handleSubmit} variant="contained">
                        {editingType ? 'Update' : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
