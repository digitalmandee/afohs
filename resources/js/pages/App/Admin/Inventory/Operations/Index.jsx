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

const movementTone = {
    purchase: 'success',
    adjustment_in: 'success',
    adjustment_out: 'warning',
    transfer_in: 'info',
    transfer_out: 'info',
    sale: 'error',
    return_in: 'success',
    return_out: 'warning',
};

const createInitialFilters = (filters, ledger) => ({
    search: filters?.search || '',
    tenant_id: filters?.tenant_id || '',
    warehouse_id: filters?.warehouse_id || '',
    warehouse_location_id: filters?.warehouse_location_id || '',
    inventory_item_id: filters?.inventory_item_id || '',
    type: filters?.type || '',
    from: filters?.from || '',
    to: filters?.to || '',
    per_page: filters?.per_page || ledger?.per_page || 25,
    page: 1,
});

export default function Index({
    ledger,
    summary = {},
    filters,
    tenants = [],
    warehouses = [],
    warehouseLocations = [],
    inventoryItems = [],
    typeOptions = [],
}) {
    const rows = ledger?.data || [];
    const [modal, setModal] = React.useState(null);
    const [localFilters, setLocalFilters] = React.useState(() => createInitialFilters(filters, ledger));
    const filtersRef = React.useRef(localFilters);

    const openingForm = useForm({
        tenant_id: '',
        warehouse_id: '',
        warehouse_location_id: '',
        inventory_item_id: '',
        transaction_date: new Date().toISOString().slice(0, 10),
        quantity: '',
        unit_cost: '',
        remarks: '',
    });

    const adjustmentForm = useForm({
        tenant_id: '',
        warehouse_id: '',
        warehouse_location_id: '',
        inventory_item_id: '',
        transaction_date: new Date().toISOString().slice(0, 10),
        direction: 'in',
        quantity: '',
        unit_cost: '',
        remarks: '',
    });

    const transferForm = useForm({
        tenant_id: '',
        source_warehouse_id: '',
        source_warehouse_location_id: '',
        destination_warehouse_id: '',
        destination_warehouse_location_id: '',
        inventory_item_id: '',
        transaction_date: new Date().toISOString().slice(0, 10),
        quantity: '',
        unit_cost: '',
        remarks: '',
    });

    const issueForm = useForm({
        tenant_id: '',
        warehouse_id: '',
        warehouse_location_id: '',
        inventory_item_id: '',
        transaction_date: new Date().toISOString().slice(0, 10),
        quantity: '',
        unit_cost: '',
        remarks: 'Manual stock issue',
    });

    const submitFilters = React.useCallback((nextFilters) => {
        const payload = {};
        if (nextFilters.search?.trim()) payload.search = nextFilters.search.trim();
        if (nextFilters.tenant_id) payload.tenant_id = nextFilters.tenant_id;
        if (nextFilters.warehouse_id) payload.warehouse_id = nextFilters.warehouse_id;
        if (nextFilters.warehouse_location_id) payload.warehouse_location_id = nextFilters.warehouse_location_id;
        if (nextFilters.inventory_item_id) payload.inventory_item_id = nextFilters.inventory_item_id;
        if (nextFilters.type) payload.type = nextFilters.type;
        if (nextFilters.from) payload.from = nextFilters.from;
        if (nextFilters.to) payload.to = nextFilters.to;
        payload.per_page = nextFilters.per_page || 25;
        if (Number(nextFilters.page) > 1) payload.page = Number(nextFilters.page);

        router.get(route('inventory.operations.index'), payload, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    }, []);

    const debouncedSubmit = React.useMemo(() => debounce((nextFilters) => submitFilters(nextFilters), 350), [submitFilters]);
    React.useEffect(() => () => debouncedSubmit.cancel(), [debouncedSubmit]);

    React.useEffect(() => {
        const next = createInitialFilters(filters, ledger);
        filtersRef.current = next;
        setLocalFilters(next);
    }, [
        filters?.from,
        filters?.per_page,
        filters?.inventory_item_id,
        filters?.search,
        filters?.tenant_id,
        filters?.to,
        filters?.type,
        filters?.warehouse_id,
        filters?.warehouse_location_id,
        ledger?.per_page,
    ]);

    const updateFilters = React.useCallback((partial, { immediate = false } = {}) => {
        const next = { ...filtersRef.current, ...partial };
        if (!Object.prototype.hasOwnProperty.call(partial, 'page')) {
            next.page = 1;
        }
        if (Object.prototype.hasOwnProperty.call(partial, 'warehouse_id') && partial.warehouse_id !== filtersRef.current.warehouse_id) {
            next.warehouse_location_id = '';
        }

        filtersRef.current = next;
        setLocalFilters(next);

        if (immediate) {
            debouncedSubmit.cancel();
            submitFilters(next);
            return;
        }

        debouncedSubmit(next);
    }, [debouncedSubmit, submitFilters]);

    const resetFilters = React.useCallback(() => {
        const next = createInitialFilters({}, { per_page: filtersRef.current.per_page });
        debouncedSubmit.cancel();
        filtersRef.current = next;
        setLocalFilters(next);
        submitFilters(next);
    }, [debouncedSubmit, submitFilters]);

    const locationOptions = React.useMemo(() => warehouseLocations.filter((location) => {
        if (!localFilters.warehouse_id) return true;
        return Number(location.warehouse_id) === Number(localFilters.warehouse_id);
    }), [localFilters.warehouse_id, warehouseLocations]);

    const openingLocations = React.useMemo(() => warehouseLocations.filter((location) => (
        !openingForm.data.warehouse_id || Number(location.warehouse_id) === Number(openingForm.data.warehouse_id)
    )), [openingForm.data.warehouse_id, warehouseLocations]);

    const adjustmentLocations = React.useMemo(() => warehouseLocations.filter((location) => (
        !adjustmentForm.data.warehouse_id || Number(location.warehouse_id) === Number(adjustmentForm.data.warehouse_id)
    )), [adjustmentForm.data.warehouse_id, warehouseLocations]);

    const transferSourceLocations = React.useMemo(() => warehouseLocations.filter((location) => (
        !transferForm.data.source_warehouse_id || Number(location.warehouse_id) === Number(transferForm.data.source_warehouse_id)
    )), [transferForm.data.source_warehouse_id, warehouseLocations]);

    const transferDestinationLocations = React.useMemo(() => warehouseLocations.filter((location) => (
        !transferForm.data.destination_warehouse_id || Number(location.warehouse_id) === Number(transferForm.data.destination_warehouse_id)
    )), [transferForm.data.destination_warehouse_id, warehouseLocations]);

    const issueLocations = React.useMemo(() => warehouseLocations.filter((location) => (
        !issueForm.data.warehouse_id || Number(location.warehouse_id) === Number(issueForm.data.warehouse_id)
    )), [issueForm.data.warehouse_id, warehouseLocations]);

    const columns = [
        { key: 'date', label: 'Date', minWidth: 110 },
        { key: 'inventory_item', label: 'Inventory Item', minWidth: 220 },
        { key: 'restaurant', label: 'Restaurant', minWidth: 180 },
        { key: 'warehouse', label: 'Warehouse', minWidth: 180 },
        { key: 'location', label: 'Location', minWidth: 160 },
        { key: 'movement', label: 'Movement', minWidth: 150 },
        { key: 'quantity', label: 'Qty', minWidth: 120, align: 'right' },
        { key: 'cost', label: 'Value', minWidth: 140, align: 'right' },
        { key: 'reference', label: 'Reference', minWidth: 150 },
        { key: 'reason', label: 'Reason', minWidth: 220 },
    ];

    const openModal = (name) => setModal(name);
    const closeModal = () => setModal(null);

    const submitOpening = (event) => {
        event.preventDefault();
        openingForm.post(route('inventory.operations.opening-balances.store'), {
            onSuccess: () => {
                openingForm.reset();
                openingForm.setData('transaction_date', new Date().toISOString().slice(0, 10));
                closeModal();
            },
        });
    };

    const submitAdjustment = (event) => {
        event.preventDefault();
        adjustmentForm.post(route('inventory.operations.adjustments.store'), {
            onSuccess: () => {
                adjustmentForm.reset();
                adjustmentForm.setData('transaction_date', new Date().toISOString().slice(0, 10));
                adjustmentForm.setData('direction', 'in');
                closeModal();
            },
        });
    };

    const submitTransfer = (event) => {
        event.preventDefault();
        transferForm.post(route('inventory.operations.transfers.store'), {
            onSuccess: () => {
                transferForm.reset();
                transferForm.setData('transaction_date', new Date().toISOString().slice(0, 10));
                closeModal();
            },
        });
    };

    const submitIssue = (event) => {
        event.preventDefault();
        issueForm.post(route('inventory.operations.issues.store'), {
            onSuccess: () => {
                issueForm.reset();
                issueForm.setData('transaction_date', new Date().toISOString().slice(0, 10));
                issueForm.setData('remarks', 'Manual stock issue');
                closeModal();
            },
        });
    };

    return (
        <>
            <AppPage
                eyebrow="Inventory"
                title="Stock Operations"
                subtitle="Post opening balances, adjustments, and warehouse transfers with restaurant-aware ledger visibility."
                actions={[
                    <Button key="master" variant="outlined" onClick={() => router.visit(route('inventory.warehouses.index'))}>
                        Warehouse Master
                    </Button>,
                    <Button key="dashboard" variant="outlined" onClick={() => router.visit(route('inventory.dashboard'))}>
                        Dashboard
                    </Button>,
                    <Button key="documents" variant="outlined" onClick={() => router.visit(route('inventory.documents.index'))}>
                        Stock Documents
                    </Button>,
                    <Button key="valuation" variant="outlined" onClick={() => router.visit(route('inventory.valuation.index'))}>
                        Valuation
                    </Button>,
                    <Button key="opening" variant="outlined" onClick={() => openModal('opening')}>
                        Opening Balance
                    </Button>,
                    <Button key="adjustment" variant="outlined" onClick={() => openModal('adjustment')}>
                        Stock Adjustment
                    </Button>,
                    <Button key="issue" variant="outlined" onClick={() => openModal('issue')}>
                        Stock Issue
                    </Button>,
                    <Button key="transfer" variant="contained" onClick={() => openModal('transfer')}>
                        Warehouse Transfer
                    </Button>,
                ]}
            >
                <Grid container spacing={2.25}>
                    <Grid item xs={12} md={3}><StatCard label="Net On-Hand Qty" value={summary.net_qty || 0} accent /></Grid>
                    <Grid item xs={12} md={3}><StatCard label="Transfers" value={summary.transfers || 0} tone="light" /></Grid>
                    <Grid item xs={12} md={3}><StatCard label="Adjustments" value={summary.adjustments || 0} tone="light" /></Grid>
                    <Grid item xs={12} md={3}><StatCard label="Opening Balances" value={summary.opening_balances || 0} tone="muted" /></Grid>
                    <Grid item xs={12} md={3}><StatCard label="Stock Issues" value={summary.issues || 0} tone="light" /></Grid>
                    <Grid item xs={12} md={3}><StatCard label="Valuation" value={Number(summary.valuation || 0).toFixed(2)} tone="light" /></Grid>
                </Grid>

                <SurfaceCard title="Stock Ledger" subtitle="Live movement history by restaurant, warehouse, location, inventory item, and movement type.">
                            <FilterToolbar
                                onReset={resetFilters}
                                onApply={() => submitFilters(localFilters)}
                                lowChrome
                                title="Filters"
                                subtitle="Refine stock ledger by search, warehouse context, item, movement type, and date range."
                            >
                                <Grid container spacing={2}>
                                    <Grid item xs={12} md={4}>
                                        <TextField
                                            label="Search inventory item or reason"
                                            value={localFilters.search}
                                            onChange={(event) => updateFilters({ search: event.target.value })}
                                            fullWidth
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={2.5}>
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
                                            label="Warehouse"
                                            value={localFilters.warehouse_id}
                                            onChange={(event) => updateFilters({ warehouse_id: event.target.value }, { immediate: true })}
                                            fullWidth
                                        >
                                            <MenuItem value="">All warehouses</MenuItem>
                                            {warehouses.map((warehouse) => (
                                                <MenuItem key={warehouse.id} value={warehouse.id}>{warehouse.name}</MenuItem>
                                            ))}
                                        </TextField>
                                    </Grid>
                                    <Grid item xs={12} md={3}>
                                        <TextField
                                            select
                                            label="Location"
                                            value={localFilters.warehouse_location_id}
                                            onChange={(event) => updateFilters({ warehouse_location_id: event.target.value }, { immediate: true })}
                                            fullWidth
                                        >
                                            <MenuItem value="">All locations</MenuItem>
                                            {locationOptions.map((location) => (
                                                <MenuItem key={location.id} value={location.id}>{location.code} · {location.name}</MenuItem>
                                            ))}
                                        </TextField>
                                    </Grid>
                                    <Grid item xs={12} md={3}>
                                        <TextField
                                            select
                                            label="Inventory Item"
                                            value={localFilters.inventory_item_id}
                                            onChange={(event) => updateFilters({ inventory_item_id: event.target.value }, { immediate: true })}
                                            fullWidth
                                        >
                                            <MenuItem value="">All inventory items</MenuItem>
                                            {inventoryItems.map((inventoryItem) => (
                                                <MenuItem key={inventoryItem.id} value={inventoryItem.id}>{inventoryItem.menu_code || inventoryItem.id} · {inventoryItem.name}</MenuItem>
                                            ))}
                                        </TextField>
                                    </Grid>
                                    <Grid item xs={12} md={2.5}>
                                        <TextField
                                            select
                                            label="Movement type"
                                            value={localFilters.type}
                                            onChange={(event) => updateFilters({ type: event.target.value }, { immediate: true })}
                                            fullWidth
                                        >
                                            <MenuItem value="">All types</MenuItem>
                                            {typeOptions.map((option) => (
                                                <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                                            ))}
                                        </TextField>
                                    </Grid>
                                    <Grid item xs={12} md={2}>
                                        <TextField
                                            label="From"
                                            type="date"
                                            value={localFilters.from}
                                            onChange={(event) => updateFilters({ from: event.target.value }, { immediate: true })}
                                            InputLabelProps={{ shrink: true }}
                                            fullWidth
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={2}>
                                        <TextField
                                            label="To"
                                            type="date"
                                            value={localFilters.to}
                                            onChange={(event) => updateFilters({ to: event.target.value }, { immediate: true })}
                                            InputLabelProps={{ shrink: true }}
                                            fullWidth
                                        />
                                    </Grid>
                                </Grid>
                            </FilterToolbar>

                            <Box sx={{ mt: 2.25 }}>
                                <AdminDataTable
                                    columns={columns}
                                    rows={rows}
                                    pagination={ledger}
                                    tableMinWidth={1420}
                                    emptyMessage="No stock movements found."
                                    renderRow={(row) => {
                                        const quantity = Number(row.qty_in || 0) > 0 ? Number(row.qty_in) : Number(row.qty_out || 0);
                                        const isOut = Number(row.qty_out || 0) > 0;

                                        return (
                                            <TableRow key={row.id} hover>
                                                <TableCell>{row.transaction_date}</TableCell>
                                                <TableCell>
                                                    <Stack spacing={0.35}>
                                                        <Typography sx={{ fontWeight: 700, color: 'text.primary' }}>
                                                            {row.inventory_item?.name || 'Inventory Item'}
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            {row.inventory_item?.menu_code || `#${row.inventory_item_id}`}
                                                        </Typography>
                                                    </Stack>
                                                </TableCell>
                                                <TableCell>{row.tenant?.name || 'Global'}</TableCell>
                                                <TableCell>{row.warehouse?.name || '-'}</TableCell>
                                                <TableCell>{row.warehouse_location ? `${row.warehouse_location.code} · ${row.warehouse_location.name}` : '-'}</TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={String(row.type).replaceAll('_', ' ')}
                                                        color={movementTone[row.type] || 'default'}
                                                        size="small"
                                                        sx={{ textTransform: 'capitalize' }}
                                                    />
                                                </TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 700, color: isOut ? 'warning.main' : 'success.main' }}>
                                                    {isOut ? '-' : '+'}{quantity}
                                                </TableCell>
                                                <TableCell align="right">{Number(row.total_cost || 0).toLocaleString()}</TableCell>
                                                <TableCell>
                                                    {row.reference_type ? `${String(row.reference_type).split('\\').pop()} #${row.reference_id}` : '-'}
                                                </TableCell>
                                                <TableCell>{row.reason || '-'}</TableCell>
                                            </TableRow>
                                        );
                                    }}
                                />
                            </Box>
                </SurfaceCard>
            </AppPage>

            <Dialog open={modal === 'opening'} onClose={closeModal} maxWidth="sm" fullWidth>
                <DialogTitle>Post Opening Balance</DialogTitle>
                <DialogContent dividers>
                    <Grid container spacing={2} component="form" id="opening-balance-form" onSubmit={submitOpening} sx={{ mt: 0.25 }}>
                        <Grid item xs={12} md={6}>
                            <TextField select label="Restaurant" value={openingForm.data.tenant_id} onChange={(event) => openingForm.setData('tenant_id', event.target.value)} fullWidth>
                                <MenuItem value="">None</MenuItem>
                                {tenants.map((tenant) => <MenuItem key={tenant.id} value={tenant.id}>{tenant.name}</MenuItem>)}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField select label="Warehouse" value={openingForm.data.warehouse_id} onChange={(event) => {
                                openingForm.setData('warehouse_id', event.target.value);
                                openingForm.setData('warehouse_location_id', '');
                            }} error={!!openingForm.errors.warehouse_id} helperText={openingForm.errors.warehouse_id} fullWidth>
                                {warehouses.map((warehouse) => <MenuItem key={warehouse.id} value={warehouse.id}>{warehouse.name}</MenuItem>)}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField select label="Location" value={openingForm.data.warehouse_location_id} onChange={(event) => openingForm.setData('warehouse_location_id', event.target.value)} error={!!openingForm.errors.warehouse_location_id} helperText={openingForm.errors.warehouse_location_id} fullWidth>
                                <MenuItem value="">No location</MenuItem>
                                {openingLocations.map((location) => <MenuItem key={location.id} value={location.id}>{location.code} · {location.name}</MenuItem>)}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField select label="Inventory Item" value={openingForm.data.inventory_item_id} onChange={(event) => openingForm.setData('inventory_item_id', event.target.value)} error={!!openingForm.errors.inventory_item_id} helperText={openingForm.errors.inventory_item_id} fullWidth>
                                {inventoryItems.map((inventoryItem) => <MenuItem key={inventoryItem.id} value={inventoryItem.id}>{inventoryItem.menu_code || inventoryItem.id} · {inventoryItem.name}</MenuItem>)}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TextField label="Date" type="date" value={openingForm.data.transaction_date} onChange={(event) => openingForm.setData('transaction_date', event.target.value)} InputLabelProps={{ shrink: true }} error={!!openingForm.errors.transaction_date} helperText={openingForm.errors.transaction_date} fullWidth />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TextField label="Quantity" type="number" value={openingForm.data.quantity} onChange={(event) => openingForm.setData('quantity', event.target.value)} inputProps={{ min: 0.001, step: 0.001 }} error={!!openingForm.errors.quantity} helperText={openingForm.errors.quantity} fullWidth />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TextField label="Unit cost" type="number" value={openingForm.data.unit_cost} onChange={(event) => openingForm.setData('unit_cost', event.target.value)} inputProps={{ min: 0, step: 0.0001 }} error={!!openingForm.errors.unit_cost} helperText={openingForm.errors.unit_cost} fullWidth />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField label="Remarks" value={openingForm.data.remarks} onChange={(event) => openingForm.setData('remarks', event.target.value)} error={!!openingForm.errors.remarks} helperText={openingForm.errors.remarks} fullWidth multiline minRows={3} />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeModal}>Cancel</Button>
                    <Button type="submit" form="opening-balance-form" variant="contained" disabled={openingForm.processing}>Post Opening Balance</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={modal === 'adjustment'} onClose={closeModal} maxWidth="sm" fullWidth>
                <DialogTitle>Post Stock Adjustment</DialogTitle>
                <DialogContent dividers>
                    <Grid container spacing={2} component="form" id="adjustment-form" onSubmit={submitAdjustment} sx={{ mt: 0.25 }}>
                        <Grid item xs={12} md={6}>
                            <TextField select label="Restaurant" value={adjustmentForm.data.tenant_id} onChange={(event) => adjustmentForm.setData('tenant_id', event.target.value)} fullWidth>
                                <MenuItem value="">None</MenuItem>
                                {tenants.map((tenant) => <MenuItem key={tenant.id} value={tenant.id}>{tenant.name}</MenuItem>)}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField select label="Direction" value={adjustmentForm.data.direction} onChange={(event) => adjustmentForm.setData('direction', event.target.value)} fullWidth>
                                <MenuItem value="in">Increase stock</MenuItem>
                                <MenuItem value="out">Decrease stock</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField select label="Warehouse" value={adjustmentForm.data.warehouse_id} onChange={(event) => {
                                adjustmentForm.setData('warehouse_id', event.target.value);
                                adjustmentForm.setData('warehouse_location_id', '');
                            }} error={!!adjustmentForm.errors.warehouse_id} helperText={adjustmentForm.errors.warehouse_id} fullWidth>
                                {warehouses.map((warehouse) => <MenuItem key={warehouse.id} value={warehouse.id}>{warehouse.name}</MenuItem>)}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField select label="Location" value={adjustmentForm.data.warehouse_location_id} onChange={(event) => adjustmentForm.setData('warehouse_location_id', event.target.value)} error={!!adjustmentForm.errors.warehouse_location_id} helperText={adjustmentForm.errors.warehouse_location_id} fullWidth>
                                <MenuItem value="">No location</MenuItem>
                                {adjustmentLocations.map((location) => <MenuItem key={location.id} value={location.id}>{location.code} · {location.name}</MenuItem>)}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField select label="Inventory Item" value={adjustmentForm.data.inventory_item_id} onChange={(event) => adjustmentForm.setData('inventory_item_id', event.target.value)} error={!!adjustmentForm.errors.inventory_item_id} helperText={adjustmentForm.errors.inventory_item_id} fullWidth>
                                {inventoryItems.map((inventoryItem) => <MenuItem key={inventoryItem.id} value={inventoryItem.id}>{inventoryItem.menu_code || inventoryItem.id} · {inventoryItem.name}</MenuItem>)}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <TextField label="Date" type="date" value={adjustmentForm.data.transaction_date} onChange={(event) => adjustmentForm.setData('transaction_date', event.target.value)} InputLabelProps={{ shrink: true }} error={!!adjustmentForm.errors.transaction_date} helperText={adjustmentForm.errors.transaction_date} fullWidth />
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <TextField label="Quantity" type="number" value={adjustmentForm.data.quantity} onChange={(event) => adjustmentForm.setData('quantity', event.target.value)} inputProps={{ min: 0.001, step: 0.001 }} error={!!adjustmentForm.errors.quantity} helperText={adjustmentForm.errors.quantity} fullWidth />
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <TextField label="Unit cost" type="number" value={adjustmentForm.data.unit_cost} onChange={(event) => adjustmentForm.setData('unit_cost', event.target.value)} inputProps={{ min: 0, step: 0.0001 }} error={!!adjustmentForm.errors.unit_cost} helperText={adjustmentForm.errors.unit_cost} fullWidth />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField label="Reason" value={adjustmentForm.data.remarks} onChange={(event) => adjustmentForm.setData('remarks', event.target.value)} error={!!adjustmentForm.errors.remarks} helperText={adjustmentForm.errors.remarks} fullWidth multiline minRows={3} />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeModal}>Cancel</Button>
                    <Button type="submit" form="adjustment-form" variant="contained" disabled={adjustmentForm.processing}>Post Adjustment</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={modal === 'issue'} onClose={closeModal} maxWidth="sm" fullWidth>
                <DialogTitle>Post Stock Issue</DialogTitle>
                <DialogContent dividers>
                    <Grid container spacing={2} component="form" id="issue-form" onSubmit={submitIssue} sx={{ mt: 0.25 }}>
                        <Grid item xs={12} md={6}>
                            <TextField select label="Restaurant" value={issueForm.data.tenant_id} onChange={(event) => issueForm.setData('tenant_id', event.target.value)} fullWidth>
                                <MenuItem value="">None</MenuItem>
                                {tenants.map((tenant) => <MenuItem key={tenant.id} value={tenant.id}>{tenant.name}</MenuItem>)}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField select label="Warehouse" value={issueForm.data.warehouse_id} onChange={(event) => {
                                issueForm.setData('warehouse_id', event.target.value);
                                issueForm.setData('warehouse_location_id', '');
                            }} error={!!issueForm.errors.warehouse_id} helperText={issueForm.errors.warehouse_id} fullWidth>
                                {warehouses.map((warehouse) => <MenuItem key={warehouse.id} value={warehouse.id}>{warehouse.name}</MenuItem>)}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField select label="Location" value={issueForm.data.warehouse_location_id} onChange={(event) => issueForm.setData('warehouse_location_id', event.target.value)} error={!!issueForm.errors.warehouse_location_id} helperText={issueForm.errors.warehouse_location_id} fullWidth>
                                <MenuItem value="">No location</MenuItem>
                                {issueLocations.map((location) => <MenuItem key={location.id} value={location.id}>{location.code} · {location.name}</MenuItem>)}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField select label="Inventory Item" value={issueForm.data.inventory_item_id} onChange={(event) => issueForm.setData('inventory_item_id', event.target.value)} error={!!issueForm.errors.inventory_item_id} helperText={issueForm.errors.inventory_item_id} fullWidth>
                                {inventoryItems.map((inventoryItem) => <MenuItem key={inventoryItem.id} value={inventoryItem.id}>{inventoryItem.menu_code || inventoryItem.id} · {inventoryItem.name}</MenuItem>)}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TextField label="Date" type="date" value={issueForm.data.transaction_date} onChange={(event) => issueForm.setData('transaction_date', event.target.value)} InputLabelProps={{ shrink: true }} error={!!issueForm.errors.transaction_date} helperText={issueForm.errors.transaction_date} fullWidth />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TextField label="Quantity" type="number" value={issueForm.data.quantity} onChange={(event) => issueForm.setData('quantity', event.target.value)} inputProps={{ min: 0.001, step: 0.001 }} error={!!issueForm.errors.quantity} helperText={issueForm.errors.quantity} fullWidth />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TextField label="Unit cost" type="number" value={issueForm.data.unit_cost} onChange={(event) => issueForm.setData('unit_cost', event.target.value)} inputProps={{ min: 0, step: 0.0001 }} error={!!issueForm.errors.unit_cost} helperText={issueForm.errors.unit_cost} fullWidth />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField label="Reason" value={issueForm.data.remarks} onChange={(event) => issueForm.setData('remarks', event.target.value)} error={!!issueForm.errors.remarks} helperText={issueForm.errors.remarks} fullWidth multiline minRows={3} />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeModal}>Cancel</Button>
                    <Button type="submit" form="issue-form" variant="contained" disabled={issueForm.processing}>Post Issue</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={modal === 'transfer'} onClose={closeModal} maxWidth="md" fullWidth>
                <DialogTitle>Post Warehouse Transfer</DialogTitle>
                <DialogContent dividers>
                    <Grid container spacing={2} component="form" id="transfer-form" onSubmit={submitTransfer} sx={{ mt: 0.25 }}>
                        <Grid item xs={12} md={4}>
                            <TextField select label="Restaurant" value={transferForm.data.tenant_id} onChange={(event) => transferForm.setData('tenant_id', event.target.value)} fullWidth>
                                <MenuItem value="">None</MenuItem>
                                {tenants.map((tenant) => <MenuItem key={tenant.id} value={tenant.id}>{tenant.name}</MenuItem>)}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TextField select label="Inventory Item" value={transferForm.data.inventory_item_id} onChange={(event) => transferForm.setData('inventory_item_id', event.target.value)} error={!!transferForm.errors.inventory_item_id} helperText={transferForm.errors.inventory_item_id} fullWidth>
                                {inventoryItems.map((inventoryItem) => <MenuItem key={inventoryItem.id} value={inventoryItem.id}>{inventoryItem.menu_code || inventoryItem.id} · {inventoryItem.name}</MenuItem>)}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TextField label="Date" type="date" value={transferForm.data.transaction_date} onChange={(event) => transferForm.setData('transaction_date', event.target.value)} InputLabelProps={{ shrink: true }} error={!!transferForm.errors.transaction_date} helperText={transferForm.errors.transaction_date} fullWidth />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField select label="Source warehouse" value={transferForm.data.source_warehouse_id} onChange={(event) => {
                                transferForm.setData('source_warehouse_id', event.target.value);
                                transferForm.setData('source_warehouse_location_id', '');
                            }} error={!!transferForm.errors.source_warehouse_id} helperText={transferForm.errors.source_warehouse_id} fullWidth>
                                {warehouses.map((warehouse) => <MenuItem key={warehouse.id} value={warehouse.id}>{warehouse.name}</MenuItem>)}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField select label="Source location" value={transferForm.data.source_warehouse_location_id} onChange={(event) => transferForm.setData('source_warehouse_location_id', event.target.value)} error={!!transferForm.errors.source_warehouse_location_id} helperText={transferForm.errors.source_warehouse_location_id} fullWidth>
                                <MenuItem value="">No location</MenuItem>
                                {transferSourceLocations.map((location) => <MenuItem key={location.id} value={location.id}>{location.code} · {location.name}</MenuItem>)}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField select label="Destination warehouse" value={transferForm.data.destination_warehouse_id} onChange={(event) => {
                                transferForm.setData('destination_warehouse_id', event.target.value);
                                transferForm.setData('destination_warehouse_location_id', '');
                            }} error={!!transferForm.errors.destination_warehouse_id} helperText={transferForm.errors.destination_warehouse_id} fullWidth>
                                {warehouses.map((warehouse) => <MenuItem key={warehouse.id} value={warehouse.id}>{warehouse.name}</MenuItem>)}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField select label="Destination location" value={transferForm.data.destination_warehouse_location_id} onChange={(event) => transferForm.setData('destination_warehouse_location_id', event.target.value)} error={!!transferForm.errors.destination_warehouse_location_id} helperText={transferForm.errors.destination_warehouse_location_id} fullWidth>
                                <MenuItem value="">No location</MenuItem>
                                {transferDestinationLocations.map((location) => <MenuItem key={location.id} value={location.id}>{location.code} · {location.name}</MenuItem>)}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TextField label="Quantity" type="number" value={transferForm.data.quantity} onChange={(event) => transferForm.setData('quantity', event.target.value)} inputProps={{ min: 0.001, step: 0.001 }} error={!!transferForm.errors.quantity} helperText={transferForm.errors.quantity} fullWidth />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TextField label="Unit cost" type="number" value={transferForm.data.unit_cost} onChange={(event) => transferForm.setData('unit_cost', event.target.value)} inputProps={{ min: 0, step: 0.0001 }} error={!!transferForm.errors.unit_cost} helperText={transferForm.errors.unit_cost} fullWidth />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField label="Remarks" value={transferForm.data.remarks} onChange={(event) => transferForm.setData('remarks', event.target.value)} error={!!transferForm.errors.remarks} helperText={transferForm.errors.remarks} fullWidth multiline minRows={3} />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeModal}>Cancel</Button>
                    <Button type="submit" form="transfer-form" variant="contained" disabled={transferForm.processing}>Post Transfer</Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
