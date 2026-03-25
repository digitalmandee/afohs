import React from 'react';
import { router, usePage } from '@inertiajs/react';
import {
    Alert,
    Box,
    Button,
    Chip,
    Grid,
    IconButton,
    InputAdornment,
    MenuItem,
    TableCell,
    TableRow,
    TextField,
    Typography,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon, Search as SearchIcon } from '@mui/icons-material';
import POSLayout from '@/components/POSLayout';
import AppPage from '@/components/App/ui/AppPage';
import SurfaceCard from '@/components/App/ui/SurfaceCard';
import StatCard from '@/components/App/ui/StatCard';
import AdminDataTable from '@/components/App/ui/AdminDataTable';
import FilterToolbar from '@/components/App/ui/FilterToolbar';
import { isPosPath, routeNameForContext } from '@/lib/utils';

export default function InventoryItemsIndex({ items, filters = {}, summary = {} }) {
    const { flash = {} } = usePage().props;
    const [search, setSearch] = React.useState(filters.search || '');
    const [status, setStatus] = React.useState(filters.status || '');

    const rows = items?.data || [];

    const submit = (payload = {}) => {
        router.get(route(routeNameForContext('inventory.index')), payload, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const resetFilters = () => {
        setSearch('');
        setStatus('');
        submit({ search: '', status: '' });
    };

    return (
        <AppPage
            eyebrow="Inventory"
            title="Inventory Items"
            subtitle="Stock masters used by warehouses, procurement, and ingredient links. Products remain separate sellable records."
            actions={[
                <Button
                    key="create"
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => router.visit(route(routeNameForContext('inventory.create')))}
                >
                    Add Inventory Item
                </Button>,
            ]}
        >
            <Grid container spacing={2.25}>
                <Grid item xs={12} md={3}>
                    <StatCard label="Total Items" value={summary.count || 0} accent />
                </Grid>
                <Grid item xs={12} md={3}>
                    <StatCard label="Active" value={summary.active || 0} tone="light" />
                </Grid>
                <Grid item xs={12} md={3}>
                    <StatCard label="Purchasable" value={summary.purchasable || 0} tone="light" />
                </Grid>
                <Grid item xs={12} md={3}>
                    <StatCard label="Linked Ingredients" value={summary.linked_ingredients || 0} tone="muted" />
                </Grid>
            </Grid>

            <FilterToolbar onReset={resetFilters}>
                <Grid container spacing={1.5}>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Search inventory item"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            onBlur={() => submit({ search, status })}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter') {
                                    submit({ search, status });
                                }
                            }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <TextField
                            select
                            fullWidth
                            size="small"
                            label="Status"
                            value={status}
                            onChange={(event) => {
                                const next = event.target.value;
                                setStatus(next);
                                submit({ search, status: next });
                            }}
                        >
                            <MenuItem value="">All</MenuItem>
                            <MenuItem value="active">Active</MenuItem>
                            <MenuItem value="inactive">Inactive</MenuItem>
                        </TextField>
                    </Grid>
                </Grid>
            </FilterToolbar>

            <SurfaceCard
                title="Inventory Register"
                subtitle="Browse configured stock items, status, cost, and ingredient linkage."
                contentSx={{ p: { xs: 1.5, md: 2 }, '&:last-child': { pb: { xs: 1.5, md: 2 } } }}
            >
                {flash.error ? (
                    <Alert severity="error" variant="outlined" sx={{ mb: 1.5 }}>
                        {flash.error}
                    </Alert>
                ) : null}

                <AdminDataTable
                    columns={[
                        { key: 'item', label: 'Item', minWidth: 280 },
                        { key: 'category', label: 'Category', minWidth: 170 },
                        { key: 'unit', label: 'Unit', minWidth: 120 },
                        { key: 'default_cost', label: 'Default Cost', minWidth: 140 },
                        { key: 'minimum_stock', label: 'Minimum Stock', minWidth: 160 },
                        { key: 'status', label: 'Status', minWidth: 140 },
                        { key: 'ingredients', label: 'Ingredients', minWidth: 140 },
                        { key: 'actions', label: 'Actions', minWidth: 140, align: 'right' },
                    ]}
                    rows={rows}
                    pagination={items}
                    tableMinWidth={1180}
                    emptyMessage="No inventory items found."
                    renderRow={(item) => (
                        <TableRow hover key={item.id}>
                            <TableCell>
                                <Typography fontWeight={700}>
                                    {item.sku ? `${item.sku} · ${item.name}` : item.name}
                                </Typography>
                            </TableCell>
                            <TableCell>{item.category?.name || '-'}</TableCell>
                            <TableCell>{item.unit?.name || '-'}</TableCell>
                            <TableCell>{Number(item.default_unit_cost || 0).toFixed(2)}</TableCell>
                            <TableCell>{Number(item.minimum_stock || 0).toFixed(3)}</TableCell>
                            <TableCell>
                                <Chip
                                    size="small"
                                    label={item.status}
                                    color={item.status === 'active' ? 'success' : 'default'}
                                    variant={item.status === 'active' ? 'filled' : 'outlined'}
                                />
                            </TableCell>
                            <TableCell>{item.ingredients?.length || 0}</TableCell>
                            <TableCell align="right">
                                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.35 }}>
                                    <IconButton size="small" onClick={() => router.visit(route(routeNameForContext('inventory.show'), item.id))}>
                                        <EditIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton size="small" color="error" onClick={() => router.delete(route(routeNameForContext('inventory.destroy'), item.id))}>
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                </Box>
                            </TableCell>
                        </TableRow>
                    )}
                />
            </SurfaceCard>
        </AppPage>
    );
}

InventoryItemsIndex.layout = (page) => (isPosPath(typeof window !== 'undefined' ? window.location.pathname : '') ? <POSLayout>{page}</POSLayout> : page);
