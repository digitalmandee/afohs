import React, { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Box,
    Button,
    Checkbox,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    FormGroup,
    Grid,
    IconButton,
    InputAdornment,
    MenuItem,
    TableCell,
    TableRow,
    TextField,
    Typography,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, ExpandMore as ExpandMoreIcon, Search as SearchIcon } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { FaEdit } from 'react-icons/fa';
import AppPage from '@/components/App/ui/AppPage';
import SurfaceCard from '@/components/App/ui/SurfaceCard';
import AdminDataTable from '@/components/App/ui/AdminDataTable';
import FilterToolbar from '@/components/App/ui/FilterToolbar';
import StatCard from '@/components/App/ui/StatCard';

const RoleManagement = () => {
    const { roles, allPermissions, filters, can } = usePage().props;
    const { enqueueSnackbar } = useSnackbar();
    const [search, setSearch] = useState(filters.search || '');
    const [createRoleOpen, setCreateRoleOpen] = useState(false);
    const [editRoleOpen, setEditRoleOpen] = useState(false);
    const [selectedRole, setSelectedRole] = useState(null);
    const [newRole, setNewRole] = useState({ name: '', permissions: [] });

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('admin.roles.index'), { search }, { preserveState: true });
    };

    const handleCreateRole = () => {
        router.post(route('admin.roles.store'), newRole, {
            onSuccess: () => {
                setCreateRoleOpen(false);
                setNewRole({ name: '', permissions: [] });
                enqueueSnackbar('Role created successfully!', { variant: 'success' });
            },
            onError: () => enqueueSnackbar('Error creating role', { variant: 'error' }),
        });
    };

    const handleEditRole = () => {
        router.put(
            route('admin.roles.update', selectedRole.id),
            {
                name: selectedRole.name,
                permissions: selectedRole.permissions.map((p) => p.name),
            },
            {
                onSuccess: () => {
                    setEditRoleOpen(false);
                    setSelectedRole(null);
                    enqueueSnackbar('Role updated successfully!', { variant: 'success' });
                },
                onError: () => enqueueSnackbar('Error updating role', { variant: 'error' }),
            },
        );
    };

    const handleDeleteRole = (role) => {
        if (confirm(`Are you sure you want to delete the role "${role.name}"?`)) {
            router.delete(route('admin.roles.destroy', role.id), {
                onSuccess: () => enqueueSnackbar('Role deleted successfully!', { variant: 'success' }),
                onError: () => enqueueSnackbar('Error deleting role', { variant: 'error' }),
            });
        }
    };

    const handlePermissionChange = (permissionName, isChecked, isEdit = false) => {
        if (isEdit && selectedRole) {
            const updatedPermissions = isChecked
                ? [...selectedRole.permissions, { name: permissionName }]
                : selectedRole.permissions.filter((p) => p.name !== permissionName);
            setSelectedRole({ ...selectedRole, permissions: updatedPermissions });
            return;
        }

        const updatedPermissions = isChecked
            ? [...newRole.permissions, permissionName]
            : newRole.permissions.filter((p) => p !== permissionName);
        setNewRole({ ...newRole, permissions: updatedPermissions });
    };

    const getRoleColor = (roleName) => {
        switch (roleName) {
            case 'super-admin':
                return 'error';
            case 'admin':
                return 'warning';
            case 'manager':
                return 'info';
            case 'staff':
                return 'success';
            case 'user':
                return 'primary';
            default:
                return 'default';
        }
    };

    const formatPermissionLabel = (permissionName) =>
        permissionName
            .split('.')
            .slice(1)
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' → ');

    const columns = [
        { key: 'role', label: 'Role', minWidth: 180, sticky: 'left' },
        { key: 'permissions_count', label: 'Permissions' },
        { key: 'users_count', label: 'Users' },
        { key: 'actions', label: 'Actions', minWidth: 120, sticky: 'right' },
    ];

    const renderPermissionAccordions = (selected, isEdit = false) => (
        <>
            <TextField
                fullWidth
                label="Role Name"
                value={isEdit ? selectedRole?.name || '' : newRole.name}
                onChange={(e) => (isEdit ? setSelectedRole({ ...selectedRole, name: e.target.value }) : setNewRole({ ...newRole, name: e.target.value }))}
                sx={{ mb: 3, mt: 1 }}
            />

            <Typography variant="h6" sx={{ mb: 2 }}>
                Permissions
            </Typography>
            {Object.entries(allPermissions).map(([module, permissions]) => (
                <Accordion key={module}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="subtitle1" sx={{ textTransform: 'capitalize' }}>
                            {module.replace('-', ' ')}
                        </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <FormGroup>
                            <Grid container spacing={1}>
                                {permissions.map((permission) => (
                                    <Grid item xs={12} sm={6} md={4} key={permission.name}>
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    checked={
                                                        isEdit
                                                            ? selectedRole?.permissions?.some((p) => p.name === permission.name)
                                                            : newRole.permissions.includes(permission.name)
                                                    }
                                                    onChange={(e) => handlePermissionChange(permission.name, e.target.checked, isEdit)}
                                                />
                                            }
                                            label={formatPermissionLabel(permission.name)}
                                        />
                                    </Grid>
                                ))}
                            </Grid>
                        </FormGroup>
                    </AccordionDetails>
                </Accordion>
            ))}
        </>
    );

    const roleRows = roles?.data || [];

    return (
        <>
            <Head title="Role Management" />
            <AppPage
                eyebrow="Settings"
                title="Role Management"
                subtitle="Manage access roles in the same premium admin shell used across the rest of the product."
                actions={can.create ? [<Button key="create" variant="contained" startIcon={<AddIcon />} onClick={() => setCreateRoleOpen(true)}>Create Role</Button>] : []}
            >
                <Grid container spacing={2.25}>
                    <Grid item xs={12} md={4}><StatCard label="Roles" value={roleRows.length} accent /></Grid>
                    <Grid item xs={12} md={4}><StatCard label="Permissions Catalog" value={Object.keys(allPermissions || {}).length} tone="light" /></Grid>
                    <Grid item xs={12} md={4}><StatCard label="Search Filter" value={search || 'All roles'} tone="muted" /></Grid>
                </Grid>

                <SurfaceCard title="Find Roles" subtitle="Search the role register and manage access without leaving the standardized settings workspace.">
                    <FilterToolbar onReset={() => { setSearch(''); router.get(route('admin.roles.index'), {}, { preserveState: true }); }}>
                        <Box component="form" onSubmit={handleSearch}>
                            <TextField
                                placeholder="Search roles..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                sx={{ width: { xs: '100%', md: 320 } }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon fontSize="small" />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Box>
                    </FilterToolbar>
                </SurfaceCard>

                <SurfaceCard title="Roles Register" subtitle="View role usage, permission coverage, and management actions with the shared admin table shell.">
                    <AdminDataTable
                        columns={columns}
                        rows={roleRows}
                        emptyMessage="No roles found."
                        stickyFirstColumn
                        stickyLastColumn
                        renderRow={(role) => (
                            <TableRow key={role.id} hover>
                                <TableCell>
                                    <Chip label={role.name ? role.name.charAt(0).toUpperCase() + role.name.slice(1) : ''} color={getRoleColor(role.name)} variant="outlined" />
                                </TableCell>
                                <TableCell>{role.permissions.length}</TableCell>
                                <TableCell>{role.users_count || 0}</TableCell>
                                <TableCell align="right">
                                    <Box sx={{ display: 'inline-flex', gap: 1 }}>
                                        {can.edit ? (
                                            <IconButton
                                                size="small"
                                                onClick={() => {
                                                    setSelectedRole(role);
                                                    setEditRoleOpen(true);
                                                }}
                                            >
                                                <FaEdit size={18} style={{ color: '#f57c00' }} />
                                            </IconButton>
                                        ) : null}
                                        {can.delete && role.name !== 'super-admin' ? (
                                            <IconButton size="small" onClick={() => handleDeleteRole(role)} sx={{ color: '#d32f2f' }}>
                                                <DeleteIcon />
                                            </IconButton>
                                        ) : null}
                                    </Box>
                                </TableCell>
                            </TableRow>
                        )}
                        pagination={roles}
                    />
                </SurfaceCard>

                <Dialog open={createRoleOpen} onClose={() => setCreateRoleOpen(false)} maxWidth="md" fullWidth>
                    <DialogTitle>Create New Role</DialogTitle>
                    <DialogContent>{renderPermissionAccordions(newRole)}</DialogContent>
                    <DialogActions>
                        <Button onClick={() => setCreateRoleOpen(false)} variant="outlined">Cancel</Button>
                        <Button onClick={handleCreateRole} variant="contained">Create</Button>
                    </DialogActions>
                </Dialog>

                <Dialog open={editRoleOpen} onClose={() => setEditRoleOpen(false)} maxWidth="md" fullWidth>
                    <DialogTitle>Edit Role</DialogTitle>
                    <DialogContent>{selectedRole ? renderPermissionAccordions(selectedRole, true) : null}</DialogContent>
                    <DialogActions>
                        <Button onClick={() => setEditRoleOpen(false)} variant="outlined">Cancel</Button>
                        <Button onClick={handleEditRole} variant="contained">Update</Button>
                    </DialogActions>
                </Dialog>
            </AppPage>
        </>
    );
};

export default RoleManagement;
