import React from 'react';
import { useForm } from '@inertiajs/react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid, MenuItem, TableCell, TableRow, TextField } from '@mui/material';
import AppPage from '@/components/App/ui/AppPage';
import SurfaceCard from '@/components/App/ui/SurfaceCard';
import AdminDataTable from '@/components/App/ui/AdminDataTable';

export default function WarehouseCategoriesIndex({ categories = [] }) {
    const [open, setOpen] = React.useState(false);
    const [editing, setEditing] = React.useState(null);
    const form = useForm({
        name: '',
        slug: '',
        color: '#1D4ED8',
        status: 'active',
        sort_order: 0,
    });

    const submit = (event) => {
        event.preventDefault();
        const onSuccess = () => {
            form.reset();
            form.setData('status', 'active');
            form.setData('color', '#1D4ED8');
            setEditing(null);
            setOpen(false);
        };

        if (editing) {
            form.put(route('inventory.categories.update', editing.id), { onSuccess });
            return;
        }

        form.post(route('inventory.categories.store'), { onSuccess });
    };

    const startEdit = (category) => {
        setEditing(category);
        form.setData({
            name: category.name || '',
            slug: category.slug || '',
            color: category.color || '#1D4ED8',
            status: category.status || 'active',
            sort_order: category.sort_order ?? 0,
        });
        setOpen(true);
    };

    const onClose = () => {
        setEditing(null);
        form.reset();
        form.setData('status', 'active');
        form.setData('color', '#1D4ED8');
        setOpen(false);
    };

    return (
        <>
            <AppPage
                eyebrow="Inventory"
                title="Warehouse Categories"
                subtitle="Define strategic warehouse groups for reporting and operational defaults."
                actions={[
                    <Button key="add" variant="contained" onClick={() => setOpen(true)}>
                        Add Category
                    </Button>,
                ]}
            >
                <SurfaceCard title="Category Register" subtitle="Central, back-store, sellable, production, transit, and custom warehouse groups.">
                    <AdminDataTable
                        columns={[
                            { key: 'name', label: 'Name', minWidth: 220 },
                            { key: 'slug', label: 'Slug', minWidth: 180 },
                            { key: 'color', label: 'Color', minWidth: 140 },
                            { key: 'status', label: 'Status', minWidth: 120 },
                            { key: 'warehouses', label: 'Warehouses', minWidth: 120, align: 'right' },
                            { key: 'action', label: 'Action', minWidth: 140, align: 'right' },
                        ]}
                        rows={categories}
                        tableMinWidth={920}
                        emptyMessage="No warehouse categories configured yet."
                        renderRow={(category) => (
                            <TableRow hover key={category.id}>
                                <TableCell>{category.name}</TableCell>
                                <TableCell>{category.slug}</TableCell>
                                <TableCell>{category.color || '-'}</TableCell>
                                <TableCell>{category.status}</TableCell>
                                <TableCell align="right">{category.warehouses_count || 0}</TableCell>
                                <TableCell align="right">
                                    <Button size="small" variant="outlined" onClick={() => startEdit(category)}>Edit</Button>
                                </TableCell>
                            </TableRow>
                        )}
                    />
                </SurfaceCard>
            </AppPage>

            <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
                <DialogTitle>{editing ? 'Edit Warehouse Category' : 'Add Warehouse Category'}</DialogTitle>
                <form onSubmit={submit}>
                    <DialogContent>
                        <Grid container spacing={2} sx={{ mt: 0 }}>
                            <Grid item xs={12}>
                                <TextField label="Name" value={form.data.name} onChange={(event) => form.setData('name', event.target.value)} error={!!form.errors.name} helperText={form.errors.name} fullWidth />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField label="Slug" value={form.data.slug} onChange={(event) => form.setData('slug', event.target.value)} error={!!form.errors.slug} helperText={form.errors.slug} fullWidth />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField label="Color" value={form.data.color} onChange={(event) => form.setData('color', event.target.value)} error={!!form.errors.color} helperText={form.errors.color} fullWidth />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    select
                                    label="Status"
                                    value={form.data.status}
                                    onChange={(event) => form.setData('status', event.target.value)}
                                    fullWidth
                                >
                                    <MenuItem value="active">Active</MenuItem>
                                    <MenuItem value="inactive">Inactive</MenuItem>
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    label="Sort Order"
                                    type="number"
                                    value={form.data.sort_order}
                                    onChange={(event) => form.setData('sort_order', event.target.value)}
                                    fullWidth
                                />
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={onClose}>Cancel</Button>
                        <Button type="submit" variant="contained" disabled={form.processing}>Save</Button>
                    </DialogActions>
                </form>
            </Dialog>
        </>
    );
}
