import React from 'react';
import { Link, router } from '@inertiajs/react';
import { Button, Chip, Grid, MenuItem, TableCell, TableRow, TextField, Typography } from '@mui/material';
import debounce from 'lodash.debounce';
import AppPage from '@/components/App/ui/AppPage';
import AdminDataTable from '@/components/App/ui/AdminDataTable';
import CompactDateRangePicker from '@/components/App/ui/CompactDateRangePicker';
import FilterToolbar from '@/components/App/ui/FilterToolbar';
import StatCard from '@/components/App/ui/StatCard';
import SurfaceCard from '@/components/App/ui/SurfaceCard';

export default function Index({ receipts, filters, summary = {}, vendors = [], warehouses = [], warehouseLocations = [], tenants = [] }) {
    const data = receipts?.data || [];
    const [localFilters, setLocalFilters] = React.useState({
        search: filters?.search || '',
        status: filters?.status || '',
        vendor_id: filters?.vendor_id || '',
        warehouse_id: filters?.warehouse_id || '',
        tenant_id: filters?.tenant_id || '',
        from: filters?.from || '',
        to: filters?.to || '',
        per_page: filters?.per_page || receipts?.per_page || 25,
        page: 1,
    });
    const filtersRef = React.useRef(localFilters);

    const submitFilters = React.useCallback((nextFilters) => {
        const payload = {};

        if (nextFilters.search?.trim()) payload.search = nextFilters.search.trim();
        if (nextFilters.status) payload.status = nextFilters.status;
        if (nextFilters.vendor_id) payload.vendor_id = nextFilters.vendor_id;
        if (nextFilters.warehouse_id) payload.warehouse_id = nextFilters.warehouse_id;
        if (nextFilters.tenant_id) payload.tenant_id = nextFilters.tenant_id;
        if (nextFilters.from) payload.from = nextFilters.from;
        if (nextFilters.to) payload.to = nextFilters.to;
        payload.per_page = nextFilters.per_page || 25;
        if (Number(nextFilters.page) > 1) payload.page = Number(nextFilters.page);

        router.get(route('procurement.goods-receipts.index'), payload, {
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
            vendor_id: filters?.vendor_id || '',
            warehouse_id: filters?.warehouse_id || '',
            tenant_id: filters?.tenant_id || '',
            from: filters?.from || '',
            to: filters?.to || '',
            per_page: filters?.per_page || receipts?.per_page || 25,
            page: 1,
        };
        filtersRef.current = next;
        setLocalFilters(next);
    }, [filters?.from, filters?.per_page, filters?.search, filters?.status, filters?.tenant_id, filters?.to, filters?.vendor_id, filters?.warehouse_id, receipts?.per_page]);

    const updateFilters = React.useCallback(
        (partial, { immediate = false } = {}) => {
            const next = { ...filtersRef.current, ...partial };
            if (!Object.prototype.hasOwnProperty.call(partial, 'page')) next.page = 1;

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
            status: '',
            vendor_id: '',
            warehouse_id: '',
            tenant_id: '',
            from: '',
            to: '',
            per_page: filtersRef.current.per_page || receipts?.per_page || 25,
            page: 1,
        };
        debouncedSubmit.cancel();
        filtersRef.current = next;
        setLocalFilters(next);
        submitFilters(next);
    }, [debouncedSubmit, receipts?.per_page, submitFilters]);

    const columns = [
        { key: 'grn_no', label: 'GRN No', minWidth: 120 },
        { key: 'vendor', label: 'Vendor', minWidth: 200 },
        { key: 'restaurant', label: 'Restaurant', minWidth: 180 },
        { key: 'warehouse', label: 'Warehouse', minWidth: 200 },
        { key: 'received_date', label: 'Date', minWidth: 120 },
        { key: 'status', label: 'Status', minWidth: 120 },
        { key: 'gl', label: 'Accounting', minWidth: 150 },
    ];

    return (
        <AppPage
            eyebrow="Procurement"
            title="Goods Receipts"
            subtitle="Receive stock into a restaurant warehouse and internal location while keeping the inventory ledger and accounting posting in sync."
            actions={[
                <Button key="new" variant="contained" component={Link} href={route('procurement.goods-receipts.create')}>
                    New GRN
                </Button>,
            ]}
        >
            <Grid container spacing={2.25}>
                <Grid item xs={12} md={3}><StatCard label="Receipts" value={summary.count || 0} /></Grid>
                <Grid item xs={12} md={3}><StatCard label="Received" value={summary.received || 0} tone="light" /></Grid>
                <Grid item xs={12} md={3}><StatCard label="Draft" value={summary.draft || 0} tone="light" /></Grid>
                <Grid item xs={12} md={3}><StatCard label="Cancelled" value={summary.cancelled || 0} tone="muted" /></Grid>
            </Grid>

            <SurfaceCard title="Live Filters" subtitle="Filter by restaurant, warehouse, vendor, and date range with immediate updates.">
                <FilterToolbar onReset={resetFilters}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={3}>
                            <TextField label="Search GRN or vendor" value={localFilters.search} onChange={(e) => updateFilters({ search: e.target.value })} fullWidth />
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <TextField select label="Status" value={localFilters.status} onChange={(e) => updateFilters({ status: e.target.value }, { immediate: true })} fullWidth>
                                <MenuItem value="">All</MenuItem>
                                <MenuItem value="draft">Draft</MenuItem>
                                <MenuItem value="received">Received</MenuItem>
                                <MenuItem value="cancelled">Cancelled</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={2.5}>
                            <TextField select label="Restaurant" value={localFilters.tenant_id} onChange={(e) => updateFilters({ tenant_id: e.target.value }, { immediate: true })} fullWidth>
                                <MenuItem value="">All restaurants</MenuItem>
                                {tenants.map((tenant) => (
                                    <MenuItem key={tenant.id} value={tenant.id}>{tenant.name}</MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={2.5}>
                            <TextField select label="Warehouse" value={localFilters.warehouse_id} onChange={(e) => updateFilters({ warehouse_id: e.target.value }, { immediate: true })} fullWidth>
                                <MenuItem value="">All warehouses</MenuItem>
                                {warehouses.map((warehouse) => (
                                    <MenuItem key={warehouse.id} value={warehouse.id}>{warehouse.name}</MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <TextField select label="Vendor" value={localFilters.vendor_id} onChange={(e) => updateFilters({ vendor_id: e.target.value }, { immediate: true })} fullWidth>
                                <MenuItem value="">All vendors</MenuItem>
                                {vendors.map((vendor) => (
                                    <MenuItem key={vendor.id} value={vendor.id}>{vendor.name}</MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <CompactDateRangePicker
                                from={localFilters.from}
                                to={localFilters.to}
                                onChange={({ from, to }) => updateFilters({ from, to }, { immediate: true })}
                                label="Receipt Date Range"
                            />
                        </Grid>
                    </Grid>
                </FilterToolbar>
            </SurfaceCard>

            <SurfaceCard title="Receipt Register" subtitle="Warehouse receipts with restaurant context, internal location visibility, and accounting status.">
                <AdminDataTable
                    columns={columns}
                    rows={data}
                    pagination={receipts}
                    emptyMessage="No receipts found."
                    tableMinWidth={1260}
                    renderRow={(grn) => {
                        const warehouseLocation = warehouseLocations.find((location) => String(location.id) === String(grn.warehouse_location_id));

                        return (
                            <TableRow key={grn.id} hover>
                                <TableCell sx={{ fontWeight: 700, color: 'text.primary' }}>{grn.grn_no}</TableCell>
                                <TableCell>{grn.vendor?.name || '-'}</TableCell>
                                <TableCell>{grn.tenant?.name || '-'}</TableCell>
                                <TableCell>
                                    <Typography sx={{ fontWeight: 700, color: 'text.primary' }}>{grn.warehouse?.name || '-'}</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {warehouseLocation ? `${warehouseLocation.code} · ${warehouseLocation.name}` : 'No internal location'}
                                    </Typography>
                                </TableCell>
                                <TableCell>{grn.received_date}</TableCell>
                                <TableCell>
                                    <Chip size="small" label={grn.status} color={grn.status === 'received' ? 'success' : 'default'} variant="outlined" />
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        size="small"
                                        label={grn.gl_posted ? 'Posted' : 'Pending'}
                                        color={grn.gl_posted ? 'success' : 'warning'}
                                        variant={grn.gl_posted ? 'filled' : 'outlined'}
                                    />
                                </TableCell>
                            </TableRow>
                        );
                    }}
                />
            </SurfaceCard>
        </AppPage>
    );
}
