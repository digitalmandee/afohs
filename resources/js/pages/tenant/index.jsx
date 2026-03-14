import { router } from '@inertiajs/react';
import { Box, Button, Tooltip, IconButton, MenuItem, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import { FaEdit, FaToggleOff, FaToggleOn, FaTrash, FaUndo } from 'react-icons/fa';

const Index = ({ tenants, showTrashed }) => {
    // const [open, setOpen] = useState(true);
    const isTrashedView = Boolean(showTrashed);

    return (
        <>
            {/* <SideNav open={open} setOpen={setOpen} /> */}
            <div
                style={{
                    minHeight: '100vh',
                    padding: '2rem',
                    backgroundColor: '#f5f5f5'
                }}
            >
                {/* Page Header */}
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                    <Typography sx={{ fontWeight: 700, fontSize: '30px', color: '#063455' }}>
                        Restaurant Dashboard
                    </Typography>
                    <Box display="flex" gap={1}>
                        {/* <Button
                            variant="outlined"
                            sx={{ textTransform: 'none' }}
                            onClick={() => router.visit(isTrashedView ? route('locations.index') : route('locations.trashed'))}
                        >
                            {isTrashedView ? 'Back to Active' : 'Trashed'}
                        </Button> */}
                        <Button
                            variant="outlined"
                            sx={{
                                textTransform: 'none',
                                borderColor: isTrashedView ? '#000' : '#d32f2f',
                                color: isTrashedView ? '#000' : '#d32f2f',
                                '&:hover': {
                                    borderColor: isTrashedView ? '#000' : '#d32f2f',
                                    backgroundColor: isTrashedView ? 'transparent' : 'rgba(211, 47, 47, 0.04)'
                                }
                            }}
                            onClick={() => router.visit(isTrashedView ? route('locations.index') : route('locations.trashed'))}
                            startIcon={!isTrashedView && <FaTrash size={16} />}
                        >
                            {isTrashedView ? 'Back to Active' : 'Trashed'}
                        </Button>
                    </Box>
                </Box>

                {/* Tenant Table */}
                <TableContainer
                    // component={Paper}
                    sx={{
                        // backgroundColor: '#FFFFFF',
                        borderRadius: '16px',
                        boxShadow: 'none',
                        border: '1px solid #ccc',
                    }}
                >
                    <Table>
                        <TableHead sx={{ backgroundColor: '#063455' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 600, color: '#fff' }}>Name</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: '#fff' }}>Status</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: '#fff' }}>Action</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {tenants.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={3} align="center" sx={{ padding: '2rem' }}>
                                        No tenants found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                tenants.map((tenant) => (
                                    <TableRow key={tenant.id}>
                                        <TableCell sx={{ fontSize: '14px', color: '#7f7f7f' }}>{tenant.name}</TableCell>
                                        <TableCell sx={{ fontSize: '14px', color: '#7f7f7f' }}>{tenant.status ?? '-'}</TableCell>
                                        {/* <TableCell>
                                            {isTrashedView ? (
                                                <MenuItem
                                                    onClick={() => {
                                                        if (!confirm('Restore this restaurant?')) return;
                                                        router.post(route('locations.restore', tenant.id));
                                                    }}
                                                >
                                                    <FaUndo size={16} style={{ marginRight: 20, color: '#2e7d32' }} />
                                                    Restore
                                                </MenuItem>
                                            ) : (
                                                <>
                                                    <MenuItem onClick={() => router.visit(route('locations.edit', tenant.id))}>
                                                        <FaEdit size={16} style={{ marginRight: 20, color: '#f57c00' }} />
                                                        Edit
                                                    </MenuItem>
                                                    <MenuItem
                                                        onClick={() => {
                                                            router.put(route('locations.status', tenant.id));
                                                        }}
                                                    >
                                                        {tenant.status === 'active' ? (
                                                            <FaToggleOn size={18} style={{ marginRight: 20, color: '#2e7d32' }} />
                                                        ) : (
                                                            <FaToggleOff size={18} style={{ marginRight: 20, color: '#d32f2f' }} />
                                                        )}
                                                        {tenant.status === 'active' ? 'Deactivate' : 'Activate'}
                                                    </MenuItem>
                                                    <MenuItem
                                                        onClick={() => {
                                                            if (!confirm('Delete this restaurant?')) return;
                                                            router.delete(route('locations.destroy', tenant.id));
                                                        }}
                                                    >
                                                        <FaTrash size={16} style={{ marginRight: 20, color: '#d32f2f' }} />
                                                        Delete
                                                    </MenuItem>
                                                </>
                                            )}
                                        </TableCell> */}
                                        <TableCell>
                                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                                {isTrashedView ? (
                                                    <Tooltip title="Restore">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => {
                                                                if (!confirm('Restore this restaurant?')) return;
                                                                router.post(route('locations.restore', tenant.id));
                                                            }}
                                                        >
                                                            <FaUndo size={16} style={{ color: '#2e7d32' }} />
                                                        </IconButton>
                                                    </Tooltip>
                                                ) : (
                                                    <>
                                                        <Tooltip title="Edit">
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => router.visit(route('locations.edit', tenant.id))}
                                                            >
                                                                <FaEdit size={16} style={{ color: '#f57c00' }} />
                                                            </IconButton>
                                                        </Tooltip>

                                                        <Tooltip title={tenant.status === 'active' ? 'Deactivate' : 'Activate'}>
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => {
                                                                    router.put(route('locations.status', tenant.id));
                                                                }}
                                                            >
                                                                {tenant.status === 'active' ? (
                                                                    <FaToggleOn size={18} style={{ color: '#2e7d32' }} />
                                                                ) : (
                                                                    <FaToggleOff size={18} style={{ color: '#d32f2f' }} />
                                                                )}
                                                            </IconButton>
                                                        </Tooltip>

                                                        <Tooltip title="Delete">
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => {
                                                                    if (!confirm('Delete this restaurant?')) return;
                                                                    router.delete(route('locations.destroy', tenant.id));
                                                                }}
                                                            >
                                                                <FaTrash size={16} style={{ color: '#d32f2f' }} />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </>
                                                )}
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </div>
        </>
    );
};

export default Index;
