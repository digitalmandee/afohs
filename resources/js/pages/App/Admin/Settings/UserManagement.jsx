import React, { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import UserAutocomplete from '@/components/UserAutocomplete';
import { Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, IconButton, TextField, InputAdornment, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem, Grid, Pagination, Avatar, Tooltip, Tabs, Tab } from '@mui/material';
import { ArrowBack, Delete as DeleteIcon, DeleteForever, Edit as EditIcon, RestoreFromTrash, Search as SearchIcon, Person as PersonIcon, AdminPanelSettings as AdminIcon, Work as WorkIcon } from '@mui/icons-material';
import { useSnackbar } from 'notistack';

const UserManagement = () => {
    const { users, roles, tenants, filters, can, showTrashed } = usePage().props;
    const { enqueueSnackbar } = useSnackbar();
    // const [open, setOpen] = useState(true);
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
                // Show specific validation errors
                if (typeof errors === 'object' && errors !== null) {
                    Object.values(errors).forEach((error) => {
                        enqueueSnackbar(error, { variant: 'error' });
                    });
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
                // Show specific validation errors
                if (typeof errors === 'object' && errors !== null) {
                    Object.values(errors).forEach((error) => {
                        enqueueSnackbar(error, { variant: 'error' });
                    });
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
            password: '', // Password empty by default to keep existing
        });
        setEditingUserAllowedTenants(user.allowed_tenants || []);
        setEditEmployeeUserOpen(true);
    };

    const handleEditClick = (user) => {
        if (user?.employee) {
            handleEditEmployeeUserClick(user);
            return;
        }
        handleEditUserClick(user);
    };

    const handleUpdateEmployeeUser = () => {
        router.post(
            route('admin.users.update-employee', editingUser.id),
            {
                password: editingUser.password,
            },
            {
                onSuccess: () => {
                    setEditEmployeeUserOpen(false);
                    setEditingUser({ id: null, name: '', employee_id: '', password: '' });
                    setEditingUserAllowedTenants([]);
                    enqueueSnackbar('Employee user updated successfully!', { variant: 'success' });
                },
                onError: (errors) => {
                    if (typeof errors === 'object' && errors !== null) {
                        Object.values(errors).forEach((error) => {
                            enqueueSnackbar(error, { variant: 'error' });
                        });
                    } else {
                        enqueueSnackbar('Error updating employee user', { variant: 'error' });
                    }
                },
            },
        );
    };

    const handleEditUserClick = (user) => {
        setEditingGeneralUser({
            id: user.id,
            name: user.name || '',
            email: user.email || '',
            employee_id: user.employee?.employee_id || '',
            password: '',
        });
        setEditUserOpen(true);
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
                        Object.values(errors).forEach((error) => {
                            enqueueSnackbar(error, { variant: 'error' });
                        });
                    } else {
                        enqueueSnackbar('Error updating user', { variant: 'error' });
                    }
                },
            },
        );
    };

    const openDeleteUserConfirm = (user) => {
        setDeleteUserConfirm({ open: true, user });
    };

    const closeDeleteUserConfirm = () => {
        setDeleteUserConfirm({ open: false, user: null });
    };

    const openForceDeleteUserConfirm = (user) => {
        setForceDeleteUserConfirm({ open: true, user });
    };

    const closeForceDeleteUserConfirm = () => {
        setForceDeleteUserConfirm({ open: false, user: null });
    };

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
                    Object.values(errors).forEach((error) => {
                        enqueueSnackbar(error, { variant: 'error' });
                    });
                } else {
                    enqueueSnackbar('Error deleting user', { variant: 'error' });
                }
            },
        });
    };

    const handleRestoreUser = (user) => {
        if (!user?.id) return;
        router.post(
            route('admin.users.restore', user.id),
            {},
            {
                onSuccess: () => {
                    enqueueSnackbar('User restored successfully!', { variant: 'success' });
                },
                onError: (errors) => {
                    if (typeof errors === 'object' && errors !== null) {
                        Object.values(errors).forEach((error) => {
                            enqueueSnackbar(error, { variant: 'error' });
                        });
                    } else {
                        enqueueSnackbar('Error restoring user', { variant: 'error' });
                    }
                },
            },
        );
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
                    Object.values(errors).forEach((error) => {
                        enqueueSnackbar(error, { variant: 'error' });
                    });
                } else {
                    enqueueSnackbar('Error deleting user', { variant: 'error' });
                }
            },
        });
    };

    const handleAssignRole = (userId, roleName) => {
        router.post(
            route('admin.users.assign-role'),
            { user_id: userId, role_name: roleName },
            {
                onSuccess: () => {
                    enqueueSnackbar('Role assigned successfully!', { variant: 'success' });
                },
                onError: () => {
                    enqueueSnackbar('Error assigning role', { variant: 'error' });
                },
            },
        );
    };

    const handleRemoveRole = (userId, roleName) => {
        router.post(
            route('admin.users.remove-role'),
            { user_id: userId, role_name: roleName },
            {
                onSuccess: () => {
                    enqueueSnackbar('Role removed successfully!', { variant: 'success' });
                },
                onError: () => {
                    enqueueSnackbar('Error removing role', { variant: 'error' });
                },
            },
        );
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

    return (
        <>
            <Head title={showTrashed ? 'Trashed Users' : 'User Management'} />
            {/* <SideNav open={open} setOpen={setOpen} /> */}
            <Box
                sx={{
                    minHeight: '100vh',
                    p: 3,
                    backgroundColor: '#f5f5f5',
                }}
            >
                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography sx={{ fontWeight: 700, color: '#063455', fontSize: '30px' }}>{showTrashed ? 'Trashed Users' : 'User Management'}</Typography>
                    </Box>
                    {(can.create || can.delete) && (
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            {showTrashed ? (
                                <Button
                                    variant="outlined"
                                    startIcon={<ArrowBack />}
                                    onClick={() => router.get(route('admin.users.index'))}
                                    sx={{
                                        color: '#063455',
                                        borderColor: '#063455',
                                        textTransform: 'none',
                                        borderRadius: '16px',
                                        '&:hover': { borderColor: '#063455' },
                                    }}
                                >
                                    Back
                                </Button>
                            ) : (
                                can.delete && (
                                    <Button
                                        variant="outlined"
                                        startIcon={<RestoreFromTrash />}
                                        onClick={() => router.get(route('admin.users.trashed'))}
                                        sx={{
                                            color: '#063455',
                                            borderColor: '#063455',
                                            textTransform: 'none',
                                            borderRadius: '16px',
                                            '&:hover': { borderColor: '#063455' },
                                        }}
                                    >
                                        Trashed
                                    </Button>
                                )
                            )}
                            <Button
                                variant="contained"
                                startIcon={<AdminIcon />}
                                onClick={() => setCreateUserOpen(true)}
                                disabled={showTrashed || !can.create}
                                sx={{
                                    backgroundColor: '#063455',
                                    textTransform: 'none',
                                    borderRadius: '16px',
                                    '&:hover': { backgroundColor: '#063455' },
                                }}
                            >
                                Create User
                            </Button>
                        </Box>
                    )}
                </Box>

                {/* Search */}
                <Box sx={{ mb: 3 }}>
                    <form onSubmit={handleSearch}>
                        <TextField
                            fullWidth
                            placeholder="Search users by name or email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            sx={{
                                width: '300px',
                                backgroundColor: 'transparent',

                                '& .MuiInputBase-root': {
                                    height: 40, // 🔥 set height
                                    backgroundColor: 'transparent', // remove white background
                                    paddingRight: 0,
                                    borderRadius: '16px',
                                },

                                '& .MuiInputBase-input': {
                                    padding: '0 8px', // vertically center input text
                                },

                                '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#999', // border color (optional)
                                },
                            }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </form>
                </Box>

                {/* Users Table */}
                <TableContainer sx={{ borderRadius: '12px', overflowX: 'auto' }}>
                    <Table>
                        <TableHead sx={{ bgcolor: '#063455' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 600, color: '#fff' }}>User</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: '#fff' }}>Type</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: '#fff' }}>Email</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: '#fff' }}>Roles</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: '#fff' }}>{showTrashed ? 'Deleted At' : 'Employee Info'}</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: '#fff' }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {users.data.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Avatar sx={{ mr: 2, bgcolor: '#063455' }}>{user.name.charAt(0).toUpperCase()}</Avatar>
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    fontWeight: 600,
                                                    textOverflow: 'ellipsis',
                                                    overflow: 'hidden',
                                                    maxWidth: '100px',
                                                    whiteSpace: 'nowrap',
                                                }}
                                            >
                                                <Tooltip title={user.name} arrow>
                                                    <Box sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</Box>
                                                </Tooltip>

                                                <Typography variant="caption" color="textSecondary">
                                                    ID: {user.id}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            {getUserTypeIcon(user)}
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    ml: 1,
                                                    textOverflow: 'ellipsis',
                                                    overflow: 'hidden',
                                                    maxWidth: '100px',
                                                    whiteSpace: 'nowrap',
                                                }}
                                            >
                                                {user.roles.some((role) => ['super-admin', 'admin'].includes(role.name)) ? 'Admin User' : user.employee ? 'Employee User' : 'Regular User'}
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell
                                        sx={{
                                            textOverflow: 'ellipsis',
                                            overflow: 'hidden',
                                            maxWidth: '150px',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        <Tooltip title={user.email} arrow>
                                            {user.email}
                                        </Tooltip>
                                    </TableCell>
                                    {/* <TableCell>
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                            {user.roles.map((role) => (
                                                <Chip key={role.id} label={role.name} color={getRoleColor(role.name)} size="small" variant="outlined" onDelete={can.edit ? () => handleRemoveRole(user.id, role.name) : undefined} />
                                            ))}
                                        </Box>
                                    </TableCell> */}
                                    <TableCell>
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                            {user.roles.map((role) => (
                                                <Chip key={role.id} label={capitalizeFirstLetter(role.name)} color={getRoleColor(role.name)} size="small" variant="outlined" onDelete={can.edit ? () => handleRemoveRole(user.id, role.name) : undefined} />
                                            ))}
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        {showTrashed ? (
                                            <Typography variant="body2" color="textSecondary">
                                                {formatDateTime(user.deleted_at)}
                                            </Typography>
                                        ) : user.employee ? (
                                            <Box>
                                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                    {user.employee.designation}
                                                </Typography>
                                                <Typography variant="caption" color="textSecondary">
                                                    Emp ID: {user.employee.employee_id}
                                                </Typography>
                                            </Box>
                                        ) : (
                                            <Typography variant="body2" color="textSecondary">
                                                No employee record
                                            </Typography>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {showTrashed ? (
                                            can.delete && (
                                                <Box sx={{ display: 'flex', gap: 1 }}>
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
                                            )
                                        ) : (
                                        (can.edit || can.delete) && (
                                            <Box sx={{ display: 'flex', gap: 1 }}>
                                                {can.edit && (
                                                    <>
                                                        <Tooltip title="Edit User">
                                                            <IconButton size="small" onClick={() => handleEditClick(user)} sx={{ color: '#1976d2' }}>
                                                                <EditIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <FormControl size="small" sx={{ minWidth: 120 }}>
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
                                                )}
                                                {can.delete && (
                                                    <Tooltip title="Delete User">
                                                        <IconButton size="small" onClick={() => openDeleteUserConfirm(user)} sx={{ color: '#c62828' }}>
                                                            <DeleteIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                            </Box>
                                        ))}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Pagination */}
                {users.last_page > 1 && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                        <Pagination
                            count={users.last_page}
                            page={users.current_page}
                            onChange={(e, page) => {
                                router.get(route(showTrashed ? 'admin.users.trashed' : 'admin.users.index'), { ...filters, page });
                            }}
                            color="primary"
                        />
                    </Box>
                )}

                {/* Create User Dialog */}
                <Dialog open={createUserOpen} onClose={resetCreateUserDialog} maxWidth="sm" fullWidth>
                    <DialogTitle sx={{ display: 'flex', alignItems: 'center' }}>
                        <AdminIcon sx={{ mr: 1, color: '#063455' }} />
                        Create User
                    </DialogTitle>
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

                        {createUserTab === 0 && (
                            <Grid container spacing={2} sx={{ mt: 1 }}>
                                <Grid item xs={12}>
                                    <TextField fullWidth label="Full Name" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField fullWidth label="Email" type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Password"
                                        type="password"
                                        value={newUser.password}
                                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                        autoComplete="new-password"
                                        inputProps={{
                                            autoComplete: 'new-password',
                                            form: {
                                                autoComplete: 'off',
                                            },
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <FormControl fullWidth>
                                        <InputLabel>Role</InputLabel>
                                        <Select value={newUser.role} label="Role" onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}>
                                            {roles.map((role) => (
                                                <MenuItem key={role.id} value={role.name}>
                                                    <Chip label={role.name} color={getRoleColor(role.name)} size="small" sx={{ mr: 1 }} />
                                                    {role.name}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                            </Grid>
                        )}

                        {createUserTab === 1 && (
                            <>
                                <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
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
                                                setEmployeeUser((prev) => ({
                                                    ...prev,
                                                    employee_id: employee?.employee_id || '',
                                                }));
                                            }}
                                        />
                                    </Grid>

                                    {employeeLookup && (
                                        <>
                                            <Grid item xs={12}>
                                                <TextField fullWidth label="Employee Name" value={employeeLookup.name || ''} InputProps={{ readOnly: true }} />
                                            </Grid>
                                            <Grid item xs={12}>
                                                <TextField fullWidth label="Employee Email" value={employeeLookup.email || ''} InputProps={{ readOnly: true }} />
                                            </Grid>
                                        </>
                                    )}

                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            label="Password"
                                            type="password"
                                            value={employeeUser.password}
                                            onChange={(e) => setEmployeeUser({ ...employeeUser, password: e.target.value })}
                                            autoComplete="new-password"
                                            inputProps={{
                                                autoComplete: 'new-password',
                                                form: {
                                                    autoComplete: 'off',
                                                },
                                            }}
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <FormControl fullWidth>
                                            <InputLabel>Role</InputLabel>
                                            <Select value={employeeUser.role} label="Role" onChange={(e) => setEmployeeUser({ ...employeeUser, role: e.target.value })}>
                                                {roles.map((role) => (
                                                    <MenuItem key={role.id} value={role.name}>
                                                        <Chip label={role.name} color={getRoleColor(role.name)} size="small" sx={{ mr: 1 }} />
                                                        {role.name}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                </Grid>
                            </>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={resetCreateUserDialog} sx={{ border: '1px solid #063455', color: '#063455', textTransform: 'none' }}>
                            Cancel
                        </Button>
                        {createUserTab === 0 && (
                            <Button onClick={handleCreateSuperAdminUser} variant="contained" sx={{ bgcolor: '#063455', textTransform: 'none' }}>
                                Create User
                            </Button>
                        )}
                        {createUserTab === 1 && (
                            <Button onClick={handleCreateEmployeeUser} variant="contained" sx={{ bgcolor: '#063455', textTransform: 'none' }} disabled={!employeeUser.employee_id || !employeeUser.password || !employeeUser.role}>
                                Create Employee User
                            </Button>
                        )}
                    </DialogActions>
                </Dialog>

                {/* Edit Employee User Dialog */}
                <Dialog open={editEmployeeUserOpen} onClose={() => setEditEmployeeUserOpen(false)} maxWidth="sm" fullWidth>
                    <DialogTitle sx={{ display: 'flex', alignItems: 'center' }}>
                        <EditIcon sx={{ mr: 1, color: '#063455' }} />
                        Edit Employee User access
                    </DialogTitle>
                    <DialogContent>
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                            Update password for <strong>{editingUser.name}</strong> ({editingUser.employee_id}).
                        </Typography>
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={12}>
                                {editingUserAllowedTenants.length > 0 ? (
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                        {editingUserAllowedTenants.map((t) => (
                                            <Chip key={t.id} label={t.name} size="small" variant="outlined" />
                                        ))}
                                    </Box>
                                ) : (
                                    <Typography variant="body2" color="textSecondary">
                                        No restaurants assigned
                                    </Typography>
                                )}
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="New Password"
                                    type="password"
                                    value={editingUser.password}
                                    onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                                    helperText="Leave empty to keep current password"
                                    autoComplete="new-password"
                                    inputProps={{
                                        autoComplete: 'new-password',
                                        form: {
                                            autoComplete: 'off',
                                        },
                                    }}
                                />
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setEditEmployeeUserOpen(false)} autoFocus sx={{ color: '#063455', border: '1px solid #063455', textTransform: 'none' }}>
                            Cancel
                        </Button>
                        <Button onClick={handleUpdateEmployeeUser} variant="contained" sx={{ bgcolor: '#063455', textTransform: 'none' }}>
                            Update User
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Edit User Dialog */}
                <Dialog open={editUserOpen} onClose={() => setEditUserOpen(false)} maxWidth="sm" fullWidth>
                    <DialogTitle sx={{ display: 'flex', alignItems: 'center' }}>
                        <EditIcon sx={{ mr: 1, color: '#063455' }} />
                        Edit User
                    </DialogTitle>
                    <DialogContent>
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={12}>
                                <TextField fullWidth label="Full Name" value={editingGeneralUser.name} onChange={(e) => setEditingGeneralUser({ ...editingGeneralUser, name: e.target.value })} />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField fullWidth label="Email" type="email" value={editingGeneralUser.email} onChange={(e) => setEditingGeneralUser({ ...editingGeneralUser, email: e.target.value })} />
                            </Grid>
                            {editingGeneralUser.employee_id && (
                                <Grid item xs={12}>
                                    <TextField fullWidth label="Employee ID" value={editingGeneralUser.employee_id} InputProps={{ readOnly: true }} />
                                </Grid>
                            )}
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="New Password"
                                    type="password"
                                    value={editingGeneralUser.password}
                                    onChange={(e) => setEditingGeneralUser({ ...editingGeneralUser, password: e.target.value })}
                                    helperText="Leave empty to keep current password"
                                    autoComplete="new-password"
                                    inputProps={{
                                        autoComplete: 'new-password',
                                        form: {
                                            autoComplete: 'off',
                                        },
                                    }}
                                />
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setEditUserOpen(false)} autoFocus sx={{ color: '#063455', border: '1px solid #063455', textTransform: 'none' }}>
                            Cancel
                        </Button>
                        <Button onClick={handleUpdateUser} variant="contained" sx={{ bgcolor: '#063455', textTransform: 'none' }} disabled={!editingGeneralUser.name || !editingGeneralUser.email}>
                            Update User
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Delete User Confirm */}
                <Dialog open={deleteUserConfirm.open} onClose={closeDeleteUserConfirm} maxWidth="xs" fullWidth>
                    <DialogTitle>Delete user?</DialogTitle>
                    <DialogContent>
                        <Typography variant="body2">
                            Are you sure you want to delete <strong>{deleteUserConfirm.user?.name}</strong>?
                        </Typography>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={closeDeleteUserConfirm} sx={{ color: '#063455', border: '1px solid #063455', textTransform: 'none' }}>
                            Cancel
                        </Button>
                        <Button onClick={handleDeleteUser} variant="contained" sx={{ bgcolor: '#c62828', textTransform: 'none' }}>
                            Delete
                        </Button>
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
                        <Button onClick={closeForceDeleteUserConfirm} sx={{ color: '#063455', border: '1px solid #063455', textTransform: 'none' }}>
                            Cancel
                        </Button>
                        <Button onClick={handleForceDeleteUser} variant="contained" sx={{ bgcolor: '#c62828', textTransform: 'none' }}>
                            Delete Forever
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </>
    );
};

export default UserManagement;
