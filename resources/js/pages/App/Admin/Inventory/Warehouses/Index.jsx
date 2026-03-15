import React from 'react';
import { router, useForm } from '@inertiajs/react';
import {
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    Grid,
    MenuItem,
    Stack,
    TableCell,
    TableRow,
    TextField,
    Typography,
} from '@mui/material';
import debounce from 'lodash.debounce';
import AppPage from '@/components/App/ui/AppPage';
import AdminDataTable from '@/components/App/ui/AdminDataTable';
import FilterToolbar from '@/components/App/ui/FilterToolbar';
import StatCard from '@/components/App/ui/StatCard';
import SurfaceCard from '@/components/App/ui/SurfaceCard';

export default function Index({ warehouses, assignmentWarehouses: allAssignmentWarehouses = [], filters, tenants = [], locationSummary = {} }) {
    const list = warehouses?.data || [];
    const [openWarehouseModal, setOpenWarehouseModal] = React.useState(false);
    const [locationWarehouse, setLocationWarehouse] = React.useState(null);
    const [openAssignmentModal, setOpenAssignmentModal] = React.useState(false);
    const [localFilters, setLocalFilters] = React.useState({
        search: filters?.search || '',
        status: filters?.status || '',
        scope: filters?.scope || '',
        tenant_id: filters?.tenant_id || '',
        per_page: filters?.per_page || warehouses?.per_page || 25,
        page: 1,
    });
    const filtersRef = React.useRef(localFilters);

    const warehouseForm = useForm({
        code: '',
        name: '',
        address: '',
        is_global: false,
        tenant_id: '',
        status: 'active',
    });

    const locationForm = useForm({
        code: '',
        name: '',
        description: '',
        is_primary: false,
        status: 'active',
    });

    const assignmentForm = useForm({
        restaurant_id: '',
        warehouse_id: '',
        warehouse_location_id: '',
        role: 'sellable',
        is_primary: false,
        is_active: true,
    });

    const submitFilters = React.useCallback((nextFilters) => {
        const payload = {};

        if (nextFilters.search?.trim()) payload.search = nextFilters.search.trim();
        if (nextFilters.status) payload.status = nextFilters.status;
        if (nextFilters.scope) payload.scope = nextFilters.scope;
        if (nextFilters.tenant_id) payload.tenant_id = nextFilters.tenant_id;
        payload.per_page = nextFilters.per_page || 25;
        if (Number(nextFilters.page) > 1) payload.page = Number(nextFilters.page);

        router.get(route('inventory.warehouses.index'), payload, {
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
            status: filters?.status || '',
            scope: filters?.scope || '',
            tenant_id: filters?.tenant_id || '',
            per_page: filters?.per_page || warehouses?.per_page || 25,
            page: 1,
        };
        filtersRef.current = next;
        setLocalFilters(next);
    }, [filters?.per_page, filters?.scope, filters?.search, filters?.status, filters?.tenant_id, warehouses?.per_page]);

    const updateFilters = React.useCallback(
        (partial, { immediate = false } = {}) => {
            const next = { ...filtersRef.current, ...partial };

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
        const cleared = {
            search: '',
            status: '',
            scope: '',
            tenant_id: '',
            per_page: filtersRef.current.per_page || warehouses?.per_page || 25,
            page: 1,
        };
        debouncedSubmit.cancel();
        filtersRef.current = cleared;
        setLocalFilters(cleared);
        submitFilters(cleared);
    }, [debouncedSubmit, submitFilters, warehouses?.per_page]);

    const submitWarehouse = (event) => {
        event.preventDefault();
        warehouseForm.post(route('inventory.warehouses.store'), {
            onSuccess: () => {
                warehouseForm.reset();
                warehouseForm.setData('status', 'active');
                warehouseForm.setData('is_global', false);
                setOpenWarehouseModal(false);
            },
        });
    };

    const submitLocation = (event) => {
        event.preventDefault();
        if (!locationWarehouse) return;

        locationForm.post(route('inventory.warehouses.locations.store', locationWarehouse.id), {
            onSuccess: () => {
                locationForm.reset();
                locationForm.setData('status', 'active');
                locationForm.setData('is_primary', false);
                setLocationWarehouse(null);
            },
        });
    };

    const availableAssignmentWarehouses = React.useMemo(() => {
        if (!assignmentForm.data.restaurant_id) {
            return allAssignmentWarehouses;
        }

        return allAssignmentWarehouses.filter((warehouse) => String(warehouse.tenant_id || '') === String(assignmentForm.data.restaurant_id) || warehouse.is_global);
    }, [assignmentForm.data.restaurant_id, allAssignmentWarehouses]);

    const assignmentLocations = React.useMemo(() => {
        const selectedWarehouse = availableAssignmentWarehouses.find((warehouse) => String(warehouse.id) === String(assignmentForm.data.warehouse_id));
        return selectedWarehouse?.locations || [];
    }, [assignmentForm.data.warehouse_id, availableAssignmentWarehouses]);

    const submitAssignment = (event) => {
        event.preventDefault();
        assignmentForm.post(route('inventory.warehouse-assignments.store'), {
            onSuccess: () => {
                assignmentForm.reset();
                assignmentForm.setData('role', 'sellable');
                assignmentForm.setData('is_active', true);
                setOpenAssignmentModal(false);
            },
        });
    };

    const columns = [
        { key: 'code', label: 'Code', minWidth: 110 },
        { key: 'name', label: 'Warehouse', minWidth: 220 },
        { key: 'restaurant', label: 'Restaurant', minWidth: 180 },
        { key: 'locations', label: 'Locations', minWidth: 260 },
        { key: 'status', label: 'Status', minWidth: 120 },
        { key: 'address', label: 'Address', minWidth: 220 },
        { key: 'action', label: 'Action', minWidth: 150, align: 'right' },
    ];

    const activeCount = list.filter((warehouse) => warehouse.status === 'active').length;
    const restaurantScopedCount = list.filter((warehouse) => !warehouse.is_global).length;

    return (
        <>
            <AppPage
                eyebrow="Inventory"
                title="Warehouses"
                subtitle="Manage restaurant warehouses and create internal locations inside each warehouse for the new multi-warehouse operating model."
                actions={[
                    <Button key="ops" variant="outlined" onClick={() => router.visit(route('inventory.operations.index'))}>
                        Stock Operations
                    </Button>,
                    <Button key="add" variant="contained" onClick={() => setOpenWarehouseModal(true)}>
                        Add Warehouse
                    </Button>,
                ]}
            >
                <Grid container spacing={2.25}>
                    <Grid item xs={12} md={3}><StatCard label="Warehouses" value={warehouses?.total || list.length} accent /></Grid>
                    <Grid item xs={12} md={3}><StatCard label="Active Warehouses" value={activeCount} tone="light" /></Grid>
                    <Grid item xs={12} md={3}><StatCard label="Restaurant Scoped" value={restaurantScopedCount} tone="light" /></Grid>
                    <Grid item xs={12} md={3}><StatCard label="Internal Locations" value={locationSummary.total_locations || 0} tone="muted" /></Grid>
                </Grid>

                <SurfaceCard title="Warehouse Coverage" subtitle="Restaurant-level warehouse and location visibility for stock movement readiness.">
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={4}>
                            <StatCard label="Active Locations" value={locationSummary.active_locations || 0} tone="light" />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <StatCard label="Tracked Products" value={locationSummary.tracked_products || 0} tone="light" />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Box sx={{ p: 2.25, borderRadius: 4, border: '1px solid', borderColor: 'divider', backgroundColor: 'rgba(6, 52, 85, 0.04)', height: '100%' }}>
                                <Typography sx={{ fontSize: 13, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.6 }}>
                                    Model
                                </Typography>
                                <Typography sx={{ mt: 1, fontSize: 18, fontWeight: 800, color: 'text.primary' }}>
                                    Warehouse → Location
                                </Typography>
                                <Typography sx={{ mt: 1, color: 'text.secondary' }}>
                                    Restaurant is the reporting scope. POS location stays operational metadata only.
                                </Typography>
                            </Box>
                        </Grid>
                    </Grid>
                </SurfaceCard>

                <SurfaceCard
                    title="Restaurant Inventory Assignments"
                    subtitle="Control which warehouse/location is sellable in POS and which remains a back-store source until stock is transferred."
                    actions={<Button variant="contained" onClick={() => setOpenAssignmentModal(true)}>Assign Warehouse</Button>}
                >
                    <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid item xs={12} md={4}><StatCard label="Sellable Sources" value={locationSummary.sellable_assignments || 0} tone="light" /></Grid>
                        <Grid item xs={12} md={4}><StatCard label="Back Stores" value={locationSummary.back_store_assignments || 0} tone="light" /></Grid>
                        <Grid item xs={12} md={4}>
                            <Box sx={{ p: 2.25, borderRadius: 4, border: '1px solid', borderColor: 'divider', backgroundColor: 'rgba(6, 52, 85, 0.04)', height: '100%' }}>
                                <Typography sx={{ fontSize: 13, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.6 }}>
                                    POS Rule
                                </Typography>
                                <Typography sx={{ mt: 1, fontSize: 18, fontWeight: 800, color: 'text.primary' }}>
                                    Back store requires transfer
                                </Typography>
                                <Typography sx={{ mt: 1, color: 'text.secondary' }}>
                                    POS can only sell from assigned sellable or primary issue sources for the active restaurant.
                                </Typography>
                            </Box>
                        </Grid>
                    </Grid>
                    <AdminDataTable
                        columns={[
                            { key: 'restaurant', label: 'Restaurant', minWidth: 180 },
                            { key: 'warehouse', label: 'Warehouse', minWidth: 220 },
                            { key: 'location', label: 'Location', minWidth: 200 },
                            { key: 'role', label: 'Role', minWidth: 160 },
                            { key: 'state', label: 'State', minWidth: 180 },
                            { key: 'action', label: 'Action', align: 'right', minWidth: 120 },
                        ]}
                        rows={locationSummary.assignments || []}
                        emptyMessage="No restaurant inventory assignments yet."
                        tableMinWidth={980}
                        renderRow={(assignment) => (
                            <TableRow key={assignment.id} hover>
                                <TableCell sx={{ fontWeight: 700, color: 'text.primary' }}>{assignment.restaurant?.name || '-'}</TableCell>
                                <TableCell>{assignment.warehouse ? `${assignment.warehouse.code} · ${assignment.warehouse.name}` : '-'}</TableCell>
                                <TableCell>{assignment.warehouse_location ? `${assignment.warehouse_location.code} · ${assignment.warehouse_location.name}` : 'Whole warehouse'}</TableCell>
                                <TableCell>
                                    <Chip size="small" label={String(assignment.role || '').replace(/_/g, ' ')} color={assignment.role === 'back_store' ? 'warning' : 'primary'} variant="outlined" />
                                </TableCell>
                                <TableCell>
                                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                                        <Chip size="small" label={assignment.is_active ? 'Active' : 'Inactive'} color={assignment.is_active ? 'success' : 'default'} variant="outlined" />
                                        {assignment.is_primary && <Chip size="small" label="Primary" color="primary" />}
                                    </Stack>
                                </TableCell>
                                <TableCell align="right">
                                    <Button size="small" color="error" variant="outlined" onClick={() => router.delete(route('inventory.warehouse-assignments.destroy', assignment.id))}>
                                        Remove
                                    </Button>
                                </TableCell>
                            </TableRow>
                        )}
                    />
                </SurfaceCard>

                <SurfaceCard title="Live Filters" subtitle="Refine warehouse records by code, scope, operational status, and restaurant.">
                    <FilterToolbar onReset={resetFilters}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={4}>
                                <TextField
                                    label="Search code, name, or address"
                                    value={localFilters.search}
                                    onChange={(event) => updateFilters({ search: event.target.value })}
                                    fullWidth
                                />
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <TextField
                                    select
                                    label="Restaurant"
                                    value={localFilters.tenant_id}
                                    onChange={(event) => updateFilters({ tenant_id: event.target.value }, { immediate: true })}
                                    fullWidth
                                >
                                    <MenuItem value="">All restaurants</MenuItem>
                                    {tenants.map((tenant) => (
                                        <MenuItem key={tenant.id} value={tenant.id}>{tenant.name}</MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={2.5}>
                                <TextField
                                    select
                                    label="Status"
                                    value={localFilters.status}
                                    onChange={(event) => updateFilters({ status: event.target.value }, { immediate: true })}
                                    fullWidth
                                >
                                    <MenuItem value="">All</MenuItem>
                                    <MenuItem value="active">Active</MenuItem>
                                    <MenuItem value="inactive">Inactive</MenuItem>
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={2.5}>
                                <TextField
                                    select
                                    label="Scope"
                                    value={localFilters.scope}
                                    onChange={(event) => updateFilters({ scope: event.target.value }, { immediate: true })}
                                    fullWidth
                                >
                                    <MenuItem value="">All scopes</MenuItem>
                                    <MenuItem value="tenant">Restaurant</MenuItem>
                                    <MenuItem value="global">Global</MenuItem>
                                </TextField>
                            </Grid>
                        </Grid>
                    </FilterToolbar>
                </SurfaceCard>

                <SurfaceCard title="Warehouse Register" subtitle="Warehouse master with internal location management built into the same premium workflow.">
                    <AdminDataTable
                        columns={columns}
                        rows={list}
                        pagination={warehouses}
                        emptyMessage="No warehouses found."
                        tableMinWidth={1220}
                        renderRow={(warehouse) => (
                            <TableRow key={warehouse.id} hover>
                                <TableCell sx={{ fontWeight: 700, color: 'text.primary' }}>{warehouse.code}</TableCell>
                                <TableCell>
                                    <Typography sx={{ fontWeight: 700, color: 'text.primary' }}>{warehouse.name}</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {warehouse.is_global ? 'Global warehouse' : 'Restaurant warehouse'}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    {warehouse.tenant ? (
                                        <Chip size="small" label={warehouse.tenant.name} color="primary" variant="outlined" />
                                    ) : (
                                        <Chip size="small" label="Global" variant="outlined" />
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                                        {(warehouse.locations || []).slice(0, 3).map((location) => (
                                            <Chip
                                                key={location.id}
                                                size="small"
                                                label={`${location.code} · ${location.name}`}
                                                color={location.is_primary ? 'primary' : 'default'}
                                                variant={location.is_primary ? 'filled' : 'outlined'}
                                            />
                                        ))}
                                        {(warehouse.locations || []).length > 3 && (
                                            <Chip size="small" label={`+${warehouse.locations.length - 3} more`} variant="outlined" />
                                        )}
                                        {(warehouse.locations || []).length === 0 && (
                                            <Typography variant="body2" color="text.secondary">No locations yet</Typography>
                                        )}
                                    </Stack>
                                </TableCell>
                                <TableCell>
                                    <Chip label={warehouse.status} size="small" color={warehouse.status === 'active' ? 'success' : 'default'} variant="outlined" />
                                </TableCell>
                                <TableCell>{warehouse.address || '-'}</TableCell>
                                <TableCell align="right">
                                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                                        <Button size="small" variant="outlined" onClick={() => setLocationWarehouse(warehouse)}>
                                            Add Location
                                        </Button>
                                        <Button size="small" color="error" variant="outlined" onClick={() => router.delete(route('inventory.warehouses.destroy', warehouse.id))}>
                                            Delete
                                        </Button>
                                    </Stack>
                                </TableCell>
                            </TableRow>
                        )}
                    />
                </SurfaceCard>
            </AppPage>

            <Dialog open={openWarehouseModal} onClose={() => setOpenWarehouseModal(false)} maxWidth="md" fullWidth>
                <DialogTitle>Add Warehouse</DialogTitle>
                <form onSubmit={submitWarehouse}>
                    <DialogContent>
                        <Grid container spacing={2} sx={{ mt: 0 }}>
                            <Grid item xs={12} md={4}>
                                <TextField
                                    label="Code"
                                    value={warehouseForm.data.code}
                                    onChange={(event) => warehouseForm.setData('code', event.target.value)}
                                    error={!!warehouseForm.errors.code}
                                    helperText={warehouseForm.errors.code}
                                    fullWidth
                                />
                            </Grid>
                            <Grid item xs={12} md={8}>
                                <TextField
                                    label="Name"
                                    value={warehouseForm.data.name}
                                    onChange={(event) => warehouseForm.setData('name', event.target.value)}
                                    error={!!warehouseForm.errors.name}
                                    helperText={warehouseForm.errors.name}
                                    fullWidth
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    label="Address"
                                    value={warehouseForm.data.address}
                                    onChange={(event) => warehouseForm.setData('address', event.target.value)}
                                    fullWidth
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField
                                    select
                                    label="Scope"
                                    value={warehouseForm.data.is_global ? 'global' : 'tenant'}
                                    onChange={(event) => {
                                        const isGlobal = event.target.value === 'global';
                                        warehouseForm.setData('is_global', isGlobal);
                                        if (isGlobal) {
                                            warehouseForm.setData('tenant_id', '');
                                        }
                                    }}
                                    fullWidth
                                >
                                    <MenuItem value="tenant">Restaurant</MenuItem>
                                    <MenuItem value="global">Global</MenuItem>
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField
                                    select
                                    label="Restaurant"
                                    value={warehouseForm.data.tenant_id}
                                    onChange={(event) => warehouseForm.setData('tenant_id', event.target.value)}
                                    error={!!warehouseForm.errors.tenant_id}
                                    helperText={warehouseForm.errors.tenant_id}
                                    disabled={warehouseForm.data.is_global}
                                    fullWidth
                                >
                                    <MenuItem value="">Select restaurant</MenuItem>
                                    {tenants.map((tenant) => (
                                        <MenuItem key={tenant.id} value={tenant.id}>{tenant.name}</MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField select label="Status" value={warehouseForm.data.status} onChange={(event) => warehouseForm.setData('status', event.target.value)} fullWidth>
                                    <MenuItem value="active">Active</MenuItem>
                                    <MenuItem value="inactive">Inactive</MenuItem>
                                </TextField>
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 2 }}>
                        <Button onClick={() => setOpenWarehouseModal(false)}>Cancel</Button>
                        <Button type="submit" variant="contained" disabled={warehouseForm.processing}>
                            Create Warehouse
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            <Dialog open={!!locationWarehouse} onClose={() => setLocationWarehouse(null)} maxWidth="sm" fullWidth>
                <DialogTitle>{locationWarehouse ? `Add Location · ${locationWarehouse.name}` : 'Add Location'}</DialogTitle>
                <form onSubmit={submitLocation}>
                    <DialogContent>
                        {locationWarehouse && (
                            <Box sx={{ mb: 2 }}>
                                <Typography sx={{ fontWeight: 700, color: 'text.primary' }}>
                                    {locationWarehouse.tenant?.name || 'Global warehouse'}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Create internal stock locations inside this warehouse for receiving, transfer, and valuation flows.
                                </Typography>
                            </Box>
                        )}
                        <Divider sx={{ mb: 2 }} />
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={4}>
                                <TextField
                                    label="Code"
                                    value={locationForm.data.code}
                                    onChange={(event) => locationForm.setData('code', event.target.value)}
                                    error={!!locationForm.errors.code}
                                    helperText={locationForm.errors.code}
                                    fullWidth
                                />
                            </Grid>
                            <Grid item xs={12} md={8}>
                                <TextField
                                    label="Name"
                                    value={locationForm.data.name}
                                    onChange={(event) => locationForm.setData('name', event.target.value)}
                                    error={!!locationForm.errors.name}
                                    helperText={locationForm.errors.name}
                                    fullWidth
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    label="Description"
                                    value={locationForm.data.description}
                                    onChange={(event) => locationForm.setData('description', event.target.value)}
                                    fullWidth
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    select
                                    label="Status"
                                    value={locationForm.data.status}
                                    onChange={(event) => locationForm.setData('status', event.target.value)}
                                    fullWidth
                                >
                                    <MenuItem value="active">Active</MenuItem>
                                    <MenuItem value="inactive">Inactive</MenuItem>
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    select
                                    label="Primary"
                                    value={locationForm.data.is_primary ? 'yes' : 'no'}
                                    onChange={(event) => locationForm.setData('is_primary', event.target.value === 'yes')}
                                    fullWidth
                                >
                                    <MenuItem value="yes">Primary location</MenuItem>
                                    <MenuItem value="no">Standard location</MenuItem>
                                </TextField>
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 2 }}>
                        <Button onClick={() => setLocationWarehouse(null)}>Cancel</Button>
                        <Button type="submit" variant="contained" disabled={locationForm.processing}>
                            Create Location
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            <Dialog open={openAssignmentModal} onClose={() => setOpenAssignmentModal(false)} maxWidth="md" fullWidth>
                <DialogTitle>Assign Restaurant Inventory Source</DialogTitle>
                <form onSubmit={submitAssignment}>
                    <DialogContent>
                        <Grid container spacing={2} sx={{ mt: 0 }}>
                            <Grid item xs={12} md={4}>
                                <TextField
                                    select
                                    label="Restaurant"
                                    value={assignmentForm.data.restaurant_id}
                                    onChange={(event) => {
                                        assignmentForm.setData('restaurant_id', event.target.value);
                                        assignmentForm.setData('warehouse_id', '');
                                        assignmentForm.setData('warehouse_location_id', '');
                                    }}
                                    error={!!assignmentForm.errors.restaurant_id}
                                    helperText={assignmentForm.errors.restaurant_id}
                                    fullWidth
                                >
                                    <MenuItem value="">Select restaurant</MenuItem>
                                    {tenants.map((tenant) => (
                                        <MenuItem key={tenant.id} value={tenant.id}>{tenant.name}</MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField
                                    select
                                    label="Warehouse"
                                    value={assignmentForm.data.warehouse_id}
                                    onChange={(event) => {
                                        assignmentForm.setData('warehouse_id', event.target.value);
                                        assignmentForm.setData('warehouse_location_id', '');
                                    }}
                                    error={!!assignmentForm.errors.warehouse_id}
                                    helperText={assignmentForm.errors.warehouse_id}
                                    fullWidth
                                >
                                    <MenuItem value="">Select warehouse</MenuItem>
                                    {availableAssignmentWarehouses.map((warehouse) => (
                                        <MenuItem key={warehouse.id} value={warehouse.id}>{warehouse.code} · {warehouse.name}</MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField
                                    select
                                    label="Location"
                                    value={assignmentForm.data.warehouse_location_id}
                                    onChange={(event) => assignmentForm.setData('warehouse_location_id', event.target.value)}
                                    error={!!assignmentForm.errors.warehouse_location_id}
                                    helperText={assignmentForm.errors.warehouse_location_id || 'Optional. Leave empty to use the warehouse scope.'}
                                    fullWidth
                                >
                                    <MenuItem value="">Whole warehouse</MenuItem>
                                    {assignmentLocations.map((location) => (
                                        <MenuItem key={location.id} value={location.id}>{location.code} · {location.name}</MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField
                                    select
                                    label="Role"
                                    value={assignmentForm.data.role}
                                    onChange={(event) => assignmentForm.setData('role', event.target.value)}
                                    error={!!assignmentForm.errors.role}
                                    helperText={assignmentForm.errors.role}
                                    fullWidth
                                >
                                    <MenuItem value="sellable">Sellable / POS usable</MenuItem>
                                    <MenuItem value="back_store">Back store</MenuItem>
                                    <MenuItem value="primary_issue_source">Primary issue source</MenuItem>
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField
                                    select
                                    label="Primary"
                                    value={assignmentForm.data.is_primary ? 'yes' : 'no'}
                                    onChange={(event) => assignmentForm.setData('is_primary', event.target.value === 'yes')}
                                    fullWidth
                                >
                                    <MenuItem value="no">Standard assignment</MenuItem>
                                    <MenuItem value="yes">Primary assignment</MenuItem>
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField
                                    select
                                    label="Status"
                                    value={assignmentForm.data.is_active ? 'active' : 'inactive'}
                                    onChange={(event) => assignmentForm.setData('is_active', event.target.value === 'active')}
                                    fullWidth
                                >
                                    <MenuItem value="active">Active</MenuItem>
                                    <MenuItem value="inactive">Inactive</MenuItem>
                                </TextField>
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 2 }}>
                        <Button onClick={() => setOpenAssignmentModal(false)}>Cancel</Button>
                        <Button type="submit" variant="contained" disabled={assignmentForm.processing}>
                            Save Assignment
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </>
    );
}
