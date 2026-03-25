import React from 'react';
import { router, usePage } from '@inertiajs/react';
import { Box, Button, Card, CardContent, Chip, Grid, IconButton, InputAdornment, Pagination, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Search as SearchIcon, Delete as DeleteIcon } from '@mui/icons-material';
import POSLayout from '@/components/POSLayout';
import { isPosPath, routeNameForContext } from '@/lib/utils';

export default function InventoryItemsIndex({ items, filters = {}, summary = {} }) {
    const { flash = {} } = usePage().props;
    const [search, setSearch] = React.useState(filters.search || '');
    const [status, setStatus] = React.useState(filters.status || '');

    const submit = (payload = {}) => {
        router.get(route(routeNameForContext('inventory.index')), payload, { preserveState: true, preserveScroll: true, replace: true });
    };

    return (
        <Box sx={{ minHeight: '100vh', p: 2.5, backgroundColor: '#f5f5f5' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                <Box>
                    <Typography sx={{ fontWeight: 700, fontSize: 30, color: '#063455' }}>Inventory Items</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, maxWidth: 760 }}>
                        Inventory Items are the stock masters used by warehouses, procurement, and ingredient links. Products remain separate sellable records.
                    </Typography>
                </Box>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => router.visit(route(routeNameForContext('inventory.create')))} sx={{ textTransform: 'none', borderRadius: '16px', backgroundColor: '#063455' }}>
                    Add Inventory Item
                </Button>
            </Box>

            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={3}><Card sx={{ borderRadius: 3 }}><CardContent><Typography color="text.secondary">Total Items</Typography><Typography variant="h5" fontWeight={700}>{summary.count || 0}</Typography></CardContent></Card></Grid>
                <Grid item xs={12} md={3}><Card sx={{ borderRadius: 3 }}><CardContent><Typography color="text.secondary">Active</Typography><Typography variant="h5" fontWeight={700}>{summary.active || 0}</Typography></CardContent></Card></Grid>
                <Grid item xs={12} md={3}><Card sx={{ borderRadius: 3 }}><CardContent><Typography color="text.secondary">Purchasable</Typography><Typography variant="h5" fontWeight={700}>{summary.purchasable || 0}</Typography></CardContent></Card></Grid>
                <Grid item xs={12} md={3}><Card sx={{ borderRadius: 3 }}><CardContent><Typography color="text.secondary">Linked Ingredients</Typography><Typography variant="h5" fontWeight={700}>{summary.linked_ingredients || 0}</Typography></CardContent></Card></Grid>
            </Grid>

            <Card sx={{ borderRadius: 3, mb: 3 }}>
                <CardContent>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={5}>
                            <TextField
                                fullWidth
                                size="small"
                                placeholder="Search inventory item"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                onBlur={() => submit({ search, status })}
                                InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
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
                                <option value="">All</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </TextField>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            <TableContainer component={Card} sx={{ borderRadius: 3 }}>
                {flash.error ? (
                    <Box sx={{ px: 2, pt: 2 }}>
                        <Typography variant="body2" color="error.main">
                            {flash.error}
                        </Typography>
                    </Box>
                ) : null}
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Item</TableCell>
                            <TableCell>Category</TableCell>
                            <TableCell>Unit</TableCell>
                            <TableCell>Default Cost</TableCell>
                            <TableCell>Minimum Stock</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Ingredients</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {(items?.data || []).map((item) => (
                            <TableRow key={item.id} hover>
                                <TableCell>
                                    <Typography fontWeight={700}>{item.sku ? `${item.sku} · ${item.name}` : item.name}</Typography>
                                </TableCell>
                                <TableCell>{item.category?.name || '-'}</TableCell>
                                <TableCell>{item.unit?.name || '-'}</TableCell>
                                <TableCell>{Number(item.default_unit_cost || 0).toFixed(2)}</TableCell>
                                <TableCell>{Number(item.minimum_stock || 0).toFixed(3)}</TableCell>
                                <TableCell><Chip size="small" label={item.status} color={item.status === 'active' ? 'success' : 'default'} /></TableCell>
                                <TableCell>{item.ingredients?.length || 0}</TableCell>
                                <TableCell align="right">
                                    <IconButton size="small" onClick={() => router.visit(route(routeNameForContext('inventory.show'), item.id))}><EditIcon /></IconButton>
                                    <IconButton size="small" color="error" onClick={() => router.delete(route(routeNameForContext('inventory.destroy'), item.id))}><DeleteIcon /></IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {(items?.last_page || 1) > 1 ? (
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                    <Pagination count={items.last_page} page={items.current_page} onChange={(_, page) => submit({ search, status, page })} />
                </Box>
            ) : null}
        </Box>
    );
}

InventoryItemsIndex.layout = (page) => (isPosPath(typeof window !== 'undefined' ? window.location.pathname : '') ? <POSLayout>{page}</POSLayout> : page);
