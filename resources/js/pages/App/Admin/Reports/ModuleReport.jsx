import React from 'react';
import { router } from '@inertiajs/react';
import {
    Button,
    Grid,
    MenuItem,
    Stack,
    TableCell,
    TableRow,
    TextField,
} from '@mui/material';
import AppPage from '@/components/App/ui/AppPage';
import SurfaceCard from '@/components/App/ui/SurfaceCard';
import FilterToolbar from '@/components/App/ui/FilterToolbar';
import AdminDataTable from '@/components/App/ui/AdminDataTable';
import StatCard from '@/components/App/ui/StatCard';

const emptyFilters = {
    from: '',
    to: '',
    vendor_id: '',
    item_id: '',
    warehouse_id: '',
    location_id: '',
    department_id: '',
    tenant_id: '',
    request_for: '',
    status: '',
    search: '',
    per_page: 25,
    page: 1,
};

export default function ModuleReport({
    title,
    subtitle,
    columns = [],
    rows,
    summary = {},
    filters = {},
    options = {},
    routeNames = {},
    routeParams = {},
}) {
    const [localFilters, setLocalFilters] = React.useState({
        ...emptyFilters,
        ...filters,
        per_page: filters.per_page || rows?.per_page || 25,
    });

    React.useEffect(() => {
        setLocalFilters({
            ...emptyFilters,
            ...filters,
            per_page: filters.per_page || rows?.per_page || 25,
        });
    }, [filters, rows?.per_page]);

    const sanitize = (value) => Object.fromEntries(
        Object.entries(value || {}).filter(([, v]) => v !== '' && v !== null && v !== undefined)
    );

    const apply = (next = localFilters) => {
        router.get(route(routeNames.index, routeParams), sanitize(next), {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const reset = () => {
        const next = { ...emptyFilters, per_page: localFilters.per_page || 25 };
        setLocalFilters(next);
        apply(next);
    };

    const download = (name, extras = {}) => {
        const routeName = routeNames[name];
        if (!routeName) return;
        window.open(route(routeName, { ...routeParams, ...sanitize(localFilters), ...extras }), '_blank', 'noopener,noreferrer');
    };

    const summaryCards = Object.entries(summary || {});

    return (
        <AppPage eyebrow="Reports" title={title} subtitle={subtitle}>
            <Stack direction="row" spacing={1.25} justifyContent="flex-end" flexWrap="wrap" useFlexGap>
                <Button variant="outlined" onClick={() => download('print')}>Print</Button>
                <Button variant="outlined" onClick={() => download('pdf')}>PDF</Button>
                <Button variant="outlined" onClick={() => download('csv')}>CSV</Button>
                <Button variant="contained" onClick={() => download('xlsx')}>Excel</Button>
            </Stack>

            {summaryCards.length > 0 ? (
                <Grid container spacing={2.25}>
                    {summaryCards.map(([key, value], index) => (
                        <Grid item xs={12} md={3} key={key}>
                            <StatCard
                                label={key.replaceAll('_', ' ')}
                                value={typeof value === 'number' ? value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : value}
                                accent={index === 0}
                                tone={index === 0 ? 'default' : 'light'}
                            />
                        </Grid>
                    ))}
                </Grid>
            ) : null}

            <SurfaceCard title="Filters" subtitle="Use standard reporting filters and export the exact same filtered dataset.">
                <FilterToolbar onApply={() => apply()} onReset={reset} lowChrome title="Filters" subtitle="Apply filters then export PDF/CSV/Excel with parity.">
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={3}>
                            <TextField label="Search" value={localFilters.search || ''} onChange={(event) => setLocalFilters((prev) => ({ ...prev, search: event.target.value }))} fullWidth />
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <TextField label="From" type="date" value={localFilters.from || ''} onChange={(event) => setLocalFilters((prev) => ({ ...prev, from: event.target.value }))} InputLabelProps={{ shrink: true }} fullWidth />
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <TextField label="To" type="date" value={localFilters.to || ''} onChange={(event) => setLocalFilters((prev) => ({ ...prev, to: event.target.value }))} InputLabelProps={{ shrink: true }} fullWidth />
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <TextField select label="Status" value={localFilters.status || ''} onChange={(event) => setLocalFilters((prev) => ({ ...prev, status: event.target.value }))} fullWidth>
                                <MenuItem value="">All</MenuItem>
                                {(options.statuses || []).map((item) => (
                                    <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <TextField select label="Request For" value={localFilters.request_for || ''} onChange={(event) => setLocalFilters((prev) => ({ ...prev, request_for: event.target.value }))} fullWidth>
                                <MenuItem value="">All Types</MenuItem>
                                {(options.requestForOptions || []).map((item) => (
                                    <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <TextField select label="Vendor" value={localFilters.vendor_id || ''} onChange={(event) => setLocalFilters((prev) => ({ ...prev, vendor_id: event.target.value }))} fullWidth>
                                <MenuItem value="">All Vendors</MenuItem>
                                {(options.vendors || []).map((item) => (
                                    <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <TextField select label="Item" value={localFilters.item_id || ''} onChange={(event) => setLocalFilters((prev) => ({ ...prev, item_id: event.target.value }))} fullWidth>
                                <MenuItem value="">All Items</MenuItem>
                                {(options.items || []).map((item) => (
                                    <MenuItem key={item.id} value={item.id}>{item.sku ? `${item.sku} · ` : ''}{item.name}</MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <TextField select label="Warehouse" value={localFilters.warehouse_id || ''} onChange={(event) => setLocalFilters((prev) => ({ ...prev, warehouse_id: event.target.value }))} fullWidth>
                                <MenuItem value="">All Warehouses</MenuItem>
                                {(options.warehouses || []).map((item) => (
                                    <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <TextField select label="Department" value={localFilters.department_id || ''} onChange={(event) => setLocalFilters((prev) => ({ ...prev, department_id: event.target.value }))} fullWidth>
                                <MenuItem value="">All Departments</MenuItem>
                                {(options.departments || []).map((item) => (
                                    <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <TextField select label="Restaurant" value={localFilters.tenant_id || ''} onChange={(event) => setLocalFilters((prev) => ({ ...prev, tenant_id: event.target.value }))} fullWidth>
                                <MenuItem value="">All Restaurants</MenuItem>
                                {(options.tenants || []).map((item) => (
                                    <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                    </Grid>
                </FilterToolbar>
            </SurfaceCard>

            <SurfaceCard title="Report Data" subtitle="Summary to detail drill-ready register.">
                <AdminDataTable
                    columns={columns}
                    rows={rows?.data || []}
                    pagination={rows}
                    tableMinWidth={1200}
                    emptyMessage="No rows found for the selected filters."
                    renderRow={(row) => (
                        <TableRow hover key={row.id}>
                            {columns.map((column) => (
                                <TableCell key={`${row.id}-${column.key}`}>
                                    {column.key === 'Drilldown' && row[column.key] ? (
                                        <Button size="small" variant="text" component="a" href={row[column.key]} target="_blank" rel="noreferrer">
                                            Open
                                        </Button>
                                    ) : (
                                        row[column.key] ?? '-'
                                    )}
                                </TableCell>
                            ))}
                        </TableRow>
                    )}
                />
            </SurfaceCard>
        </AppPage>
    );
}
