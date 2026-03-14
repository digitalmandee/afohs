import React, { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { Box, Typography, Button, Card, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, IconButton, TextField, InputAdornment, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, FormLabel, FormGroup, FormControlLabel, Checkbox, Accordion, AccordionSummary, AccordionDetails, Grid, Pagination } from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Search as SearchIcon, ExpandMore as ExpandMoreIcon, Security as SecurityIcon } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { FaEdit } from 'react-icons/fa';

const RoleManagement = () => {
    const { roles, allPermissions, filters, can } = usePage().props;
    const { enqueueSnackbar } = useSnackbar();
    // const [open, setOpen] = useState(true);
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
            onError: (errors) => {
                enqueueSnackbar('Error creating role', { variant: 'error' });
            },
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
                onError: (errors) => {
                    enqueueSnackbar('Error updating role', { variant: 'error' });
                },
            },
        );
    };

    const handleDeleteRole = (role) => {
        if (confirm(`Are you sure you want to delete the role "${role.name}"?`)) {
            router.delete(route('admin.roles.destroy', role.id), {
                onSuccess: () => {
                    enqueueSnackbar('Role deleted successfully!', { variant: 'success' });
                },
                onError: (errors) => {
                    enqueueSnackbar('Error deleting role', { variant: 'error' });
                },
            });
        }
    };

    const handlePermissionChange = (permissionName, isChecked, isEdit = false) => {
        if (isEdit && selectedRole) {
            const updatedPermissions = isChecked ? [...selectedRole.permissions, { name: permissionName }] : selectedRole.permissions.filter((p) => p.name !== permissionName);
            setSelectedRole({ ...selectedRole, permissions: updatedPermissions });
        } else {
            const updatedPermissions = isChecked ? [...newRole.permissions, permissionName] : newRole.permissions.filter((p) => p !== permissionName);
            setNewRole({ ...newRole, permissions: updatedPermissions });
        }
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

    const formatPermissionLabel = (permissionName) => {
        // Split by dots and remove the first part (module name)
        const parts = permissionName.split('.').slice(1);
        // Join with dots and capitalize each part
        return parts.map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' → ');
    };

    return (
        <>
            <Head title="Role Management" />
            {/* <SideNav open={open} setOpen={setOpen} /> */}
            <Box
                sx={{
                    minHeight: '100vh',
                    p: 3,
                    backgroundColor: '#f5f5f5'
                }}
            >
                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {/* <SecurityIcon sx={{ mr: 2, color: '#063455', fontSize: '2rem' }} /> */}
                        <Typography sx={{ fontWeight: 700, color: '#063455', fontSize: '30px' }}>
                            Role Management
                        </Typography>
                    </Box>
                    {can.create && (
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => setCreateRoleOpen(true)}
                            sx={{
                                backgroundColor: '#063455',
                                textTransform: 'none',
                                borderRadius: '16px',
                                '&:hover': { backgroundColor: '#052a44' },
                            }}
                        >
                            Create Role
                        </Button>
                    )}
                </Box>

                {/* Search */}
                <Box sx={{ mb: 5 }}>
                    <Box onSubmit={handleSearch}>
                        <TextField
                            placeholder="Search roles..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            sx={{
                                width: "300px",
                                height: 10,
                                backgroundColor: "transparent",
                                "& .MuiInputBase-root": {
                                    height: 40,
                                    backgroundColor: "transparent",
                                    paddingRight: 0,
                                    borderRadius: '16px',
                                },
                                "& .MuiOutlinedInput-notchedOutline": {
                                    borderColor: "#999", // optional border color
                                },
                            }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon fontSize="small" />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Box>
                </Box>

                {/* Roles Table */}
                <TableContainer sx={{ borderRadius: '12px' }}>
                    <Table>
                        <TableHead sx={{ bgcolor: '#063455' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 600, color: '#fff' }}>Role Name</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: '#fff' }}>Permissions Count</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: '#fff' }}>Users Count</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: '#fff' }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {roles.data.map((role) => (
                                <TableRow key={role.id}>
                                    {/* <TableCell>
                                        <Chip label={role.name} color={getRoleColor(role.name)} variant="outlined" />
                                    </TableCell> */}
                                    <TableCell>
                                        <Chip
                                            label={role.name ? role.name.charAt(0).toUpperCase() + role.name.slice(1) : ''}
                                            color={getRoleColor(role.name)}
                                            variant="outlined"
                                        />
                                    </TableCell>
                                    <TableCell>{role.permissions.length}</TableCell>
                                    <TableCell>{role.users_count || 0}</TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            {can.edit && (
                                                <IconButton
                                                    size="small"
                                                    onClick={() => {
                                                        setSelectedRole(role);
                                                        setEditRoleOpen(true);
                                                    }}
                                                    // sx={{ color: '#063455' }}
                                                >
                                                    <FaEdit size={18} style={{ color: '#f57c00' }} />
                                                </IconButton>
                                            )}
                                            {can.delete && role.name !== 'super-admin' && (
                                                <IconButton size="small" onClick={() => handleDeleteRole(role)} sx={{ color: '#d32f2f' }}>
                                                    <DeleteIcon />
                                                </IconButton>
                                            )}
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Pagination */}
                {roles.last_page > 1 && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                        <Pagination
                            count={roles.last_page}
                            page={roles.current_page}
                            onChange={(e, page) => {
                                router.get(route('admin.roles.index'), { ...filters, page });
                            }}
                            color="primary"
                        />
                    </Box>
                )}

                {/* Create Role Dialog */}
                <Dialog open={createRoleOpen} onClose={() => setCreateRoleOpen(false)} maxWidth="md" fullWidth style={{borderRadius:'16px'}}>
                    <DialogTitle sx={{color:'#063455', fontSize:'24px', fontWeight:600}}>Create New Role</DialogTitle>
                    <DialogContent>
                        <TextField fullWidth label="Role Name" value={newRole.name} onChange={(e) => setNewRole({ ...newRole, name: e.target.value })} sx={{ mb: 3, mt: 1 }} />

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
                                                <Grid item xs={6} sm={4} key={permission.name}>
                                                    <FormControlLabel control={<Checkbox checked={newRole.permissions.includes(permission.name)} onChange={(e) => handlePermissionChange(permission.name, e.target.checked)} />} label={formatPermissionLabel(permission.name)} />
                                                </Grid>
                                            ))}
                                        </Grid>
                                    </FormGroup>
                                </AccordionDetails>
                            </Accordion>
                        ))}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setCreateRoleOpen(false)}
                            sx={{color:'#063455', border:'1px solid #063455', textTransform:'none'}}>Cancel</Button>
                        <Button onClick={handleCreateRole} variant="contained" sx={{textTransform:'none'}}>
                            Create
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Edit Role Dialog */}
                <Dialog open={editRoleOpen} onClose={() => setEditRoleOpen(false)} maxWidth="md" fullWidth>
                    <DialogTitle>Edit Role</DialogTitle>
                    <DialogContent>
                        {selectedRole && (
                            <>
                                <TextField fullWidth label="Role Name" value={selectedRole.name} onChange={(e) => setSelectedRole({ ...selectedRole, name: e.target.value })} sx={{ mb: 3, mt: 1 }} />

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
                                                        <Grid item xs={6} sm={4} key={permission.name}>
                                                            <FormControlLabel control={<Checkbox checked={selectedRole.permissions.some((p) => p.name === permission.name)} onChange={(e) => handlePermissionChange(permission.name, e.target.checked, true)} />} label={formatPermissionLabel(permission.name)} />
                                                        </Grid>
                                                    ))}
                                                </Grid>
                                            </FormGroup>
                                        </AccordionDetails>
                                    </Accordion>
                                ))}
                            </>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setEditRoleOpen(false)}>Cancel</Button>
                        <Button onClick={handleEditRole} variant="contained">
                            Update
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </>
    );
};

export default RoleManagement;
