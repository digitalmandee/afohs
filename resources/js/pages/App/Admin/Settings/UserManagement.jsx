import React, { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import UserAutocomplete from '@/components/UserAutocomplete';
import {
    Avatar,
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    Grid,
    IconButton,
    InputAdornment,
    InputLabel,
    MenuItem,
    Select,
    Tab,
    TableCell,
    TableRow,
    Tabs,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import {
    ArrowBack,
    Delete as DeleteIcon,
    DeleteForever,
    Edit as EditIcon,
    RestoreFromTrash,
    Search as SearchIcon,
    Person as PersonIcon,
    AdminPanelSettings as AdminIcon,
    Work as WorkIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import AppPage from '@/components/App/ui/AppPage';
import SurfaceCard from '@/components/App/ui/SurfaceCard';
import AdminDataTable from '@/components/App/ui/AdminDataTable';
import FilterToolbar from '@/components/App/ui/FilterToolbar';
import StatCard from '@/components/App/ui/StatCard';

const UserManagement = () => {
    const { users, roles, filters, can, showTrashed } = usePage().props;
    const { enqueueSnackbar } = useSnackbar();
    const [search, setSearch] = useState(filters.search || '');
    const [createUserOpen, setCreateUserOpen] = useState(false);
    const [createUserTab, setCreateUserTab] = useState(0);
    const [editEmployeeUserOpen, setEditEmployeeUserOpen] = useState(false);
    const [editUserOpen, setEditUserOpen] = useState(false);
    const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: '' });
    const [employeeUser, setEmployeeUser] = useState({ employee_id: '', password: '', role: 'pos' });
    const [employeeLookup, setEmployeeLookup] = useState(null);
    const [editingUser, setEditingUser] = useState({ id: null, name: '', employee_id: '', password: '' });
    const [editingUserAllowedTenants, setEditingUserAllowedTenants] = useState([]);
    const [editingGeneralUser, setEditingGeneralUser] = useState({ id: null, name: '', email: '', employee_id: '', password: '' });
    const [deleteUserConfirm, setDeleteUserConfirm] = useState({ open: false, user: null });
    const [forceDeleteUserConfirm, setForceDeleteUserConfirm] = useState({ open: false, user: null });

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route(showTrashed ? 'admin.users.trashed' : 'admin.users.index'), { search }, { preserveState: true });
    };

    const resetCreateUserDialog = () => {
        setCreateUserOpen(false);
        setCreateUserTab(0);
        setNewUser({ name: '', email: '', password: '', role: '' });
        setEmployeeUser({ employee_id: '', password: '', role: 'pos' });
        setEmployeeLookup(null);
    };

    const handleCreateSuperAdminUser = () => {
        router.post(route('admin.users.create-super-admin'), newUser, {
            onSuccess: () => {
                resetCreateUserDialog();
                enqueueSnackbar('Super Admin user created successfully!', { variant: 'success' });
            },
            onError: (errors) => {
                if (typeof errors === 'object' && errors !== null) {
                    Object.values(errors).forEach((error) => enqueueSnackbar(error, { variant: 'error' }));
                } else {
                    enqueueSnackbar('Error creating user', { variant: 'error' });
                }
            },
        });
    };

    const handleCreateEmployeeUser = () => {
        const employeeId = employeeLookup?.employee_id || employeeUser.employee_id;
        router.post(
            route('admin.users.create-employee'),
            {
                employee_id: employeeId,
                password: employeeUser.password,
                role: employeeUser.role,
            },
            {
                onSuccess: () => {
                    resetCreateUserDialog();
                    enqueueSnackbar('Employee user created successfully!', { variant: 'success' });
                },
                onError: (errors) => {
                    if (typeof errors === 'object' && errors !== null) {
                        Object.values(errors).forEach((error) => enqueueSnackbar(error, { variant: 'error' }));
                    } else {
                        enqueueSnackbar('Error creating employee user', { variant: 'error' });
                    }
                },
            },
        );
    };

    const handleEditEmployeeUserClick = (user) => {
        setEditingUser({
            id: user.id,
            name: user.name,
            employee_id: user.employee?.employee_id || '',
            password: '',
        });
        setEditingUserAllowedTenants(user.allowed_tenants || []);
        setEditEmployeeUserOpen(true);
    };

    const handleEditClick = (user) => {
        if (user?.employee) {
            handleEditEmployeeUserClick(user);
            return;
        }
        setEditingGeneralUser({
            id: user.id,
            name: user.name || '',
            email: user.email || '',
            employee_id: user.employee?.employee_id || '',
            password: '',
        });
        setEditUserOpen(true);
    };

    const handleUpdateEmployeeUser = () => {
        router.post(route('admin.users.update-employee', editingUser.id), { password: editingUser.password }, {
            onSuccess: () => {
                setEditEmployeeUserOpen(false);
                setEditingUser({ id: null, name: '', employee_id: '', password: '' });
                setEditingUserAllowedTenants([]);
                enqueueSnackbar('Employee user updated successfully!', { variant: 'success' });
            },
            onError: (errors) => {
                if (typeof errors === 'object' && errors !== null) {
                    Object.values(errors).forEach((error) => enqueueSnackbar(error, { variant: 'error' }));
                } else {
                    enqueueSnackbar('Error updating employee user', { variant: 'error' });
                }
            },
        });
    };

    const handleUpdateUser = () => {
        router.post(
            route('admin.users.update', editingGeneralUser.id),
            {
                name: editingGeneralUser.name,
                email: editingGeneralUser.email,
                password: editingGeneralUser.password,
            },
            {
                onSuccess: () => {
                    setEditUserOpen(false);
                    setEditingGeneralUser({ id: null, name: '', email: '', employee_id: '', password: '' });
                    enqueueSnackbar('User updated successfully!', { variant: 'success' });
                },
                onError: (errors) => {
                    if (typeof errors === 'object' && errors !== null) {
                        Object.values(errors).forEach((error) => enqueueSnackbar(error, { variant: 'error' }));
                    } else {
                        enqueueSnackbar('Error updating user', { variant: 'error' });
                    }
                },
            },
        );
    };

    const openDeleteUserConfirm = (user) => setDeleteUserConfirm({ open: true, user });
    const closeDeleteUserConfirm = () => setDeleteUserConfirm({ open: false, user: null });
    const openForceDeleteUserConfirm = (user) => setForceDeleteUserConfirm({ open: true, user });
    const closeForceDeleteUserConfirm = () => setForceDeleteUserConfirm({ open: false, user: null });

    const handleDeleteUser = () => {
        const userId = deleteUserConfirm.user?.id;
        if (!userId) return;
        router.delete(route('admin.users.destroy', userId), {
            onSuccess: () => {
                closeDeleteUserConfirm();
                enqueueSnackbar('User deleted successfully!', { variant: 'success' });
            },
            onError: (errors) => {
                closeDeleteUserConfirm();
                if (typeof errors === 'object' && errors !== null) {
                    Object.values(errors).forEach((error) => enqueueSnackbar(error, { variant: 'error' }));
                } else {
                    enqueueSnackbar('Error deleting user', { variant: 'error' });
                }
            },
        });
    };

    const handleRestoreUser = (user) => {
        if (!user?.id) return;
        router.post(route('admin.users.restore', user.id), {}, {
            onSuccess: () => enqueueSnackbar('User restored successfully!', { variant: 'success' }),
            onError: (errors) => {
                if (typeof errors === 'object' && errors !== null) {
                    Object.values(errors).forEach((error) => enqueueSnackbar(error, { variant: 'error' }));
                } else {
                    enqueueSnackbar('Error restoring user', { variant: 'error' });
                }
            },
        });
    };

    const handleForceDeleteUser = () => {
        const userId = forceDeleteUserConfirm.user?.id;
        if (!userId) return;
        router.delete(route('admin.users.force-delete', userId), {
            onSuccess: () => {
                closeForceDeleteUserConfirm();
                enqueueSnackbar('User permanently deleted successfully!', { variant: 'success' });
            },
            onError: (errors) => {
                closeForceDeleteUserConfirm();
                if (typeof errors === 'object' && errors !== null) {
                    Object.values(errors).forEach((error) => enqueueSnackbar(error, { variant: 'error' }));
                } else {
                    enqueueSnackbar('Error deleting user', { variant: 'error' });
                }
            },
        });
    };

    const handleAssignRole = (userId, roleName) => {
        router.post(route('admin.users.assign-role'), { user_id: userId, role_name: roleName }, {
            onSuccess: () => enqueueSnackbar('Role assigned successfully!', { variant: 'success' }),
            onError: () => enqueueSnackbar('Error assigning role', { variant: 'error' }),
        });
    };

    const handleRemoveRole = (userId, roleName) => {
        router.post(route('admin.users.remove-role'), { user_id: userId, role_name: roleName }, {
            onSuccess: () => enqueueSnackbar('Role removed successfully!', { variant: 'success' }),
            onError: () => enqueueSnackbar('Error removing role', { variant: 'error' }),
        });
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

    const getUserTypeIcon = (user) => {
        if (user.roles.some((role) => ['super-admin', 'admin'].includes(role.name))) {
            return <AdminIcon sx={{ color: '#d32f2f' }} />;
        }
        if (user.employee) {
            return <WorkIcon sx={{ color: '#1976d2' }} />;
        }
        return <PersonIcon sx={{ color: '#757575' }} />;
    };

    const formatDateTime = (value) => {
        if (!value) return '';
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return value;
        return d.toLocaleString();
    };

    const capitalizeFirstLetter = (text = '') => text.charAt(0).toUpperCase() + text.slice(1);

    const columns = [
        { key: 'user', label: 'User', minWidth: 220, sticky: 'left' },
        { key: 'type', label: 'Type', minWidth: 150 },
        { key: 'email', label: 'Email', minWidth: 220 },
        { key: 'roles', label: 'Roles', minWidth: 220 },
        { key: 'meta', label: showTrashed ? 'Deleted At' : 'Employee Info', minWidth: 180 },
        { key: 'actions', label: 'Actions', minWidth: 220, sticky: 'right' },
    ];

    const userRows = users?.data || [];

    return (
        <>
            <Head title={showTrashed ? 'Trashed Users' : 'User Management'} />
            <AppPage
                eyebrow="Settings"
                title={showTrashed ? 'Trashed Users' : 'User Management'}
                subtitle="Manage login accounts, employee access, roles, and restore workflows inside the shared premium settings workspace."
                actions={[
                    !showTrashed && can.delete ? (
                        <Button key="trashed" variant="outlined" startIcon={<RestoreFromTrash />} onClick={() => router.get(route('admin.users.trashed'))}>
                            Trashed
                        </Button>
                    ) : null,
                    showTrashed ? (
                        <Button key="back" variant="outlined" startIcon={<ArrowBack />} onClick={() => router.get(route('admin.users.index'))}>
                            Back
                        </Button>
                    ) : null,
                    can.create ? (
                        <Button key="create" variant="contained" startIcon={<AdminIcon />} onClick={() => setCreateUserOpen(true)} disabled={showTrashed}>
                            Create User
                        </Button>
                    ) : null,
                ].filter(Boolean)}
            >
                <Grid container spacing={2.25}>
                    <Grid item xs={12} md={4}><StatCard label="Users" value={userRows.length} accent /></Grid>
                    <Grid item xs={12} md={4}><StatCard label="Roles Available" value={roles.length} tone="light" /></Grid>
                    <Grid item xs={12} md={4}><StatCard label="View" value={showTrashed ? 'Trashed' : 'Active'} tone="muted" /></Grid>
                </Grid>

                <SurfaceCard title="Find Users" subtitle="Search by name or email and keep the register aligned with the same shared settings filter pattern.">
                    <FilterToolbar onReset={() => { setSearch(''); router.get(route(showTrashed ? 'admin.users.trashed' : 'admin.users.index'), {}, { preserveState: true }); }}>
                        <Box component="form" onSubmit={handleSearch}>
                            <TextField
                                placeholder="Search users by name or email..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                sx={{ width: { xs: '100%', md: 360 } }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Box>
                    </FilterToolbar>
                </SurfaceCard>

                <SurfaceCard title="Users Register" subtitle="Review account types, assigned roles, employee linkage, and account actions through the shared admin table shell.">
                    <AdminDataTable
                        columns={columns}
                        rows={userRows}
                        emptyMessage={showTrashed ? 'No trashed users.' : 'No users found.'}
                        stickyFirstColumn
                        stickyLastColumn
                        tableMinWidth={1350}
                        renderRow={(user) => (
                            <TableRow key={user.id} hover>
                                <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        <Avatar sx={{ bgcolor: '#063455' }}>{user.name.charAt(0).toUpperCase()}</Avatar>
                                        <Box sx={{ minWidth: 0 }}>
                                            <Typography sx={{ fontWeight: 700 }} noWrap>{user.name}</Typography>
                                            <Typography variant="caption" color="text.secondary">ID: {user.id}</Typography>
                                        </Box>
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        {getUserTypeIcon(user)}
                                        <Typography variant="body2" noWrap>
                                            {user.roles.some((role) => ['super-admin', 'admin'].includes(role.name)) ? 'Admin User' : user.employee ? 'Employee User' : 'Regular User'}
                                        </Typography>
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    <Tooltip title={user.email} arrow>
                                        <Typography noWrap>{user.email}</Typography>
                                    </Tooltip>
                                </TableCell>
                                <TableCell>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                        {user.roles.map((role) => (
                                            <Chip
                                                key={role.id}
                                                label={capitalizeFirstLetter(role.name)}
                                                color={getRoleColor(role.name)}
                                                size="small"
                                                variant="outlined"
                                                onDelete={can.edit ? () => handleRemoveRole(user.id, role.name) : undefined}
                                            />
                                        ))}
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    {showTrashed ? (
                                        <Typography variant="body2" color="text.secondary">
                                            {formatDateTime(user.deleted_at)}
                                        </Typography>
                                    ) : user.employee ? (
                                        <Box>
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                {user.employee.designation}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Emp ID: {user.employee.employee_id}
                                            </Typography>
                                        </Box>
                                    ) : (
                                        <Typography variant="body2" color="text.secondary">
                                            No employee record
                                        </Typography>
                                    )}
                                </TableCell>
                                <TableCell align="right">
                                    {showTrashed ? (
                                        can.delete ? (
                                            <Box sx={{ display: 'inline-flex', gap: 1 }}>
                                                <Tooltip title="Restore User">
                                                    <IconButton size="small" onClick={() => handleRestoreUser(user)} sx={{ color: '#2e7d32' }}>
                                                        <RestoreFromTrash fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Force Delete">
                                                    <IconButton size="small" onClick={() => openForceDeleteUserConfirm(user)} sx={{ color: '#c62828' }}>
                                                        <DeleteForever fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        ) : null
                                    ) : (
                                        <Box sx={{ display: 'inline-flex', gap: 1, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                            {can.edit ? (
                                                <>
                                                    <Tooltip title="Edit User">
                                                        <IconButton size="small" onClick={() => handleEditClick(user)} sx={{ color: '#1976d2' }}>
                                                            <EditIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <FormControl size="small" sx={{ minWidth: 130 }}>
                                                        <InputLabel>Assign Role</InputLabel>
                                                        <Select label="Assign Role" onChange={(e) => handleAssignRole(user.id, e.target.value)} displayEmpty>
                                                            {roles
                                                                .filter((role) => !user.roles.some((userRole) => userRole.name === role.name))
                                                                .map((role) => (
                                                                    <MenuItem key={role.id} value={role.name}>
                                                                        {role.name}
                                                                    </MenuItem>
                                                                ))}
                                                        </Select>
                                                    </FormControl>
                                                </>
                                            ) : null}
                                            {can.delete ? (
                                                <Tooltip title="Delete User">
                                                    <IconButton size="small" onClick={() => openDeleteUserConfirm(user)} sx={{ color: '#c62828' }}>
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            ) : null}
                                        </Box>
                                    )}
                                </TableCell>
                            </TableRow>
                        )}
                        pagination={users}
                    />
                </SurfaceCard>

                <Dialog open={createUserOpen} onClose={resetCreateUserDialog} maxWidth="sm" fullWidth>
                    <DialogTitle>Create User</DialogTitle>
                    <DialogContent>
                        <Tabs
                            value={createUserTab}
                            onChange={(e, value) => {
                                setCreateUserTab(value);
                                setEmployeeLookup(null);
                                setEmployeeUser({ employee_id: '', password: '', role: 'pos' });
                            }}
                            sx={{ borderBottom: 1, borderColor: 'divider' }}
                        >
                            <Tab label="Normal User" />
                            <Tab label="Employee User" />
                        </Tabs>

                        {createUserTab === 0 ? (
                            <Grid container spacing={2} sx={{ mt: 1 }}>
                                <Grid item xs={12}>
                                    <TextField fullWidth label="Full Name" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField fullWidth label="Email" type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField fullWidth label="Password" type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} autoComplete="new-password" />
                                </Grid>
                                <Grid item xs={12}>
                                    <FormControl fullWidth>
                                        <InputLabel>Role</InputLabel>
                                        <Select value={newUser.role} label="Role" onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}>
                                            {roles.map((role) => (
                                                <MenuItem key={role.id} value={role.name}>{role.name}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                            </Grid>
                        ) : (
                            <>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                                    Search employee by employee ID, then create login access.
                                </Typography>
                                <Grid container spacing={2} sx={{ mt: 1 }}>
                                    <Grid item xs={12}>
                                        <UserAutocomplete
                                            memberType="3"
                                            label="Employee"
                                            placeholder="Search by name, email, or employee ID"
                                            value={employeeLookup}
                                            onChange={(employee) => {
                                                setEmployeeLookup(employee);
                                                setEmployeeUser((prev) => ({ ...prev, employee_id: employee?.employee_id || '' }));
                                            }}
                                        />
                                    </Grid>
                                    {employeeLookup ? (
                                        <>
                                            <Grid item xs={12}>
                                                <TextField fullWidth label="Employee Name" value={employeeLookup.name || ''} InputProps={{ readOnly: true }} />
                                            </Grid>
                                            <Grid item xs={12}>
                                                <TextField fullWidth label="Employee Email" value={employeeLookup.email || ''} InputProps={{ readOnly: true }} />
                                            </Grid>
                                        </>
                                    ) : null}
                                    <Grid item xs={12}>
                                        <TextField fullWidth label="Password" type="password" value={employeeUser.password} onChange={(e) => setEmployeeUser({ ...employeeUser, password: e.target.value })} autoComplete="new-password" />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <FormControl fullWidth>
                                            <InputLabel>Role</InputLabel>
                                            <Select value={employeeUser.role} label="Role" onChange={(e) => setEmployeeUser({ ...employeeUser, role: e.target.value })}>
                                                {roles.map((role) => (
                                                    <MenuItem key={role.id} value={role.name}>{role.name}</MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                </Grid>
                            </>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={resetCreateUserDialog} variant="outlined">Cancel</Button>
                        {createUserTab === 0 ? (
                            <Button onClick={handleCreateSuperAdminUser} variant="contained">Create User</Button>
                        ) : (
                            <Button onClick={handleCreateEmployeeUser} variant="contained" disabled={!employeeUser.employee_id || !employeeUser.password || !employeeUser.role}>
                                Create Employee User
                            </Button>
                        )}
                    </DialogActions>
                </Dialog>

                <Dialog open={editEmployeeUserOpen} onClose={() => setEditEmployeeUserOpen(false)} maxWidth="sm" fullWidth>
                    <DialogTitle>Edit Employee User Access</DialogTitle>
                    <DialogContent>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Update password for <strong>{editingUser.name}</strong> ({editingUser.employee_id}).
                        </Typography>
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={12}>
                                {editingUserAllowedTenants.length > 0 ? (
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                        {editingUserAllowedTenants.map((tenant) => (
                                            <Chip key={tenant.id} label={tenant.name} size="small" variant="outlined" />
                                        ))}
                                    </Box>
                                ) : (
                                    <Typography variant="body2" color="text.secondary">
                                        No restaurants assigned
                                    </Typography>
                                )}
                            </Grid>
                            <Grid item xs={12}>
                                <TextField fullWidth label="New Password" type="password" value={editingUser.password} onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })} helperText="Leave empty to keep current password" autoComplete="new-password" />
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setEditEmployeeUserOpen(false)} variant="outlined">Cancel</Button>
                        <Button onClick={handleUpdateEmployeeUser} variant="contained">Update User</Button>
                    </DialogActions>
                </Dialog>

                <Dialog open={editUserOpen} onClose={() => setEditUserOpen(false)} maxWidth="sm" fullWidth>
                    <DialogTitle>Edit User</DialogTitle>
                    <DialogContent>
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={12}>
                                <TextField fullWidth label="Full Name" value={editingGeneralUser.name} onChange={(e) => setEditingGeneralUser({ ...editingGeneralUser, name: e.target.value })} />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField fullWidth label="Email" type="email" value={editingGeneralUser.email} onChange={(e) => setEditingGeneralUser({ ...editingGeneralUser, email: e.target.value })} />
                            </Grid>
                            {editingGeneralUser.employee_id ? (
                                <Grid item xs={12}>
                                    <TextField fullWidth label="Employee ID" value={editingGeneralUser.employee_id} InputProps={{ readOnly: true }} />
                                </Grid>
                            ) : null}
                            <Grid item xs={12}>
                                <TextField fullWidth label="New Password" type="password" value={editingGeneralUser.password} onChange={(e) => setEditingGeneralUser({ ...editingGeneralUser, password: e.target.value })} helperText="Leave empty to keep current password" autoComplete="new-password" />
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setEditUserOpen(false)} variant="outlined">Cancel</Button>
                        <Button onClick={handleUpdateUser} variant="contained" disabled={!editingGeneralUser.name || !editingGeneralUser.email}>Update User</Button>
                    </DialogActions>
                </Dialog>

                <Dialog open={deleteUserConfirm.open} onClose={closeDeleteUserConfirm} maxWidth="xs" fullWidth>
                    <DialogTitle>Delete user?</DialogTitle>
                    <DialogContent>
                        <Typography variant="body2">
                            Are you sure you want to delete <strong>{deleteUserConfirm.user?.name}</strong>?
                        </Typography>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={closeDeleteUserConfirm} variant="outlined">Cancel</Button>
                        <Button onClick={handleDeleteUser} variant="contained" color="error">Delete</Button>
                    </DialogActions>
                </Dialog>

                <Dialog open={forceDeleteUserConfirm.open} onClose={closeForceDeleteUserConfirm} maxWidth="xs" fullWidth>
                    <DialogTitle>Permanently delete user?</DialogTitle>
                    <DialogContent>
                        <Typography variant="body2">
                            This will permanently delete <strong>{forceDeleteUserConfirm.user?.name}</strong> and cannot be undone.
                        </Typography>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={closeForceDeleteUserConfirm} variant="outlined">Cancel</Button>
                        <Button onClick={handleForceDeleteUser} variant="contained" color="error">Delete Forever</Button>
                    </DialogActions>
                </Dialog>
            </AppPage>
        </>
    );
};

export default UserManagement;
