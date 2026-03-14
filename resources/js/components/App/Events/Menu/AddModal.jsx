import React, { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Grid, Select, MenuItem, IconButton, InputLabel, FormControl, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import axios from 'axios';
import { enqueueSnackbar } from 'notistack';

const AddEventMenuModal = ({ open, handleClose, eventMenu = null, onSuccess }) => {
    const [form, setForm] = useState({
        name: '',
        status: 'active',
        amount: '',
        items: [{ id: '', name: '' }],
    });
    const [allItems, setAllItems] = useState([]);

    useEffect(() => {
        if (eventMenu) {
            setForm({
                name: eventMenu.name,
                status: eventMenu.status,
                amount: eventMenu.amount,
                items: eventMenu.items || [],
            });
        } else {
            setForm({ name: '', status: 'active', amount: '', items: [{ id: '', name: '' }] });
        }

        axios.get('/admin/api/all-menu-items').then((res) => setAllItems(res.data));
    }, [eventMenu]);

    const handleItemChange = (index, id) => {
        const item = allItems.find((i) => i.id === id);
        const updated = [...form.items];
        updated[index] = item;
        setForm({ ...form, items: updated });
    };

    const addItem = () => setForm({ ...form, items: [...form.items, { id: '', name: '' }] });

    const removeItem = (index) => {
        if (index === 0) return;
        const updated = [...form.items];
        updated.splice(index, 1);
        setForm({ ...form, items: updated });
    };

    const handleSubmit = () => {
        const url = eventMenu ? `/admin/event-menus/${eventMenu.id}` : '/admin/event-menus';
        const method = eventMenu ? 'put' : 'post';

        axios[method](url, form)
            .then((res) => {
                enqueueSnackbar(`Menu ${eventMenu ? 'updated' : 'created'} successfully!`, { variant: 'success' });
                onSuccess(res.data);
            })
            .catch((err) => {
                enqueueSnackbar('Failed to submit', { variant: 'error' });
            });
    };

    return (
        <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
            <DialogTitle>{eventMenu ? 'Update Menu' : 'Create Menu'}</DialogTitle>
            <DialogContent dividers>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                        <TextField label="Menu Name" fullWidth value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField label="Amount" type="number" fullWidth value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                            <InputLabel>Status</InputLabel>
                            <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                                <MenuItem value="active">Active</MenuItem>
                                <MenuItem value="inactive">Inactive</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                        <Typography variant="h6" sx={{ mb: 1 }}>
                            Menu Items
                        </Typography>
                        {form.items.map((item, index) => (
                            <Grid container spacing={1} key={index} alignItems="center" sx={{ mb: 1 }}>
                                <Grid item xs={11}>
                                    <FormControl fullWidth>
                                        <InputLabel>Select Item</InputLabel>
                                        <Select value={item.id || ''} onChange={(e) => handleItemChange(index, e.target.value)}>
                                            {allItems.map((opt) => (
                                                <MenuItem key={opt.id} value={opt.id}>
                                                    {opt.name}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={1}>
                                    {index > 0 && (
                                        <IconButton onClick={() => removeItem(index)}>
                                            <CloseIcon />
                                        </IconButton>
                                    )}
                                </Grid>
                            </Grid>
                        ))}
                        <Button onClick={addItem} sx={{ mt: 1 }} variant="outlined">
                            Add More
                        </Button>
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>Cancel</Button>
                <Button onClick={handleSubmit} variant="contained" color="primary">
                    {eventMenu ? 'Update' : 'Create'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AddEventMenuModal;
