import React, { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { Autocomplete, Box, Grid, TextField, Select, MenuItem, FormControl, InputLabel, Typography, Button, IconButton } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import CloseIcon from '@mui/icons-material/Close';

const CreateOrEditMenu = ({ eventMenu = null, menuItems }) => {
    // const [open, setOpen] = useState(true);

    const [allItems, setAllItems] = useState(menuItems || []);

    const { data, setData, post, put, processing, errors } = useForm({
        name: eventMenu?.name || '',
        status: eventMenu?.status || 'active',
        amount: eventMenu?.amount || '',
        items: eventMenu?.items?.map((i) => ({
            id: i.menu_category_id || menuItems?.find((m) => m.name === i.name)?.id,
            name: i.name,
        })) || [{ id: '', name: '' }],
    });

    const handleItemChange = (index, id) => {
        const item = allItems.find((i) => i.id === id);
        const updated = [...data.items];
        updated[index] = item ? { id: item.id, name: item.name } : { id: '', name: '' };
        setData('items', updated);
    };

    const addItem = () => setData('items', [...data.items, { id: '', name: '' }]);
    const removeItem = (index) => {
        if (index === 0) return;
        const updated = [...data.items];
        updated.splice(index, 1);
        setData('items', updated);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (eventMenu) {
            put(route('event-menu.update', { id: eventMenu.id }));
        } else {
            post(route('event-menu.store'));
        }
    };

    return (
        <>
            {/* <SideNav open={open} setOpen={setOpen} /> */}
            <Box
                sx={{
                    minHeight: '100vh',
                    padding: '20px',
                    backgroundColor: '#f5f5f5',
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <IconButton onClick={() => window.history.back()}>
                        <ArrowBackIcon sx={{ color: '#063455' }} />
                    </IconButton>
                    <Typography sx={{ fontWeight: 700, fontSize: '30px', color: '#063455' }}>{eventMenu ? 'Edit Event Menu' : 'Create Event Menu'}</Typography>
                </Box>
                <Box sx={{ p: 3 }}>
                    <form onSubmit={handleSubmit}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={4}>
                                <TextField
                                    label="Menu Name"
                                    fullWidth
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    error={!!errors.name}
                                    helperText={errors.name}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: '16px',
                                            // height: '35px',
                                            // border:'1px solid #063455'
                                            // '& fieldset': {
                                            //     border: 'none'  // Optional: cleaner look
                                            // }
                                        },
                                        '& .MuiInputLabel-root': {
                                            fontSize: '14px',
                                        },
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <TextField
                                    label="Amount"
                                    type="number"
                                    fullWidth
                                    value={data.amount}
                                    onChange={(e) => setData('amount', e.target.value)}
                                    error={!!errors.amount}
                                    helperText={errors.amount}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: '16px',
                                            // height: '35px',
                                            // border:'1px solid #063455'
                                            // '& fieldset': {
                                            //     border: 'none'  // Optional: cleaner look
                                            // }
                                        },
                                        '& .MuiInputLabel-root': {
                                            fontSize: '14px',
                                        },
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <FormControl fullWidth>
                                    <InputLabel>Status</InputLabel>
                                    <Select value={data.status} onChange={(e) => setData('status', e.target.value)}>
                                        <MenuItem value="active">Active</MenuItem>
                                        <MenuItem value="inactive">Inactive</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid item xs={12} sm={4}>
                                <Typography variant="h6" sx={{ mt: 2 }}>
                                    Menu Items
                                </Typography>
                                {data.items.map((item, index) => (
                                    <Grid container spacing={1} key={index} alignItems="center" sx={{ mb: 1 }}>
                                        <Grid item xs={11}>
                                            <Autocomplete
                                                options={allItems}
                                                getOptionLabel={(option) => option?.name || ''}
                                                value={allItems.find((opt) => opt.id === item.id) || null}
                                                onChange={(_, newValue) => handleItemChange(index, newValue?.id || '')}
                                                filterOptions={(options, state) => {
                                                    const input = (state.inputValue || '').trim().toLowerCase();
                                                    if (!input) return options;

                                                    const startsWith = [];
                                                    const includes = [];

                                                    for (const opt of options) {
                                                        const name = (opt?.name || '').toLowerCase();
                                                        if (!name) continue;
                                                        if (name.startsWith(input)) startsWith.push(opt);
                                                        else if (name.includes(input)) includes.push(opt);
                                                    }

                                                    return [...startsWith, ...includes].slice(0, 50);
                                                }}
                                                renderInput={(params) => <TextField {...params} label="Select Item" size="small" />}
                                                isOptionEqualToValue={(option, value) => option?.id === value?.id}
                                            />
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
                                <Button onClick={addItem} variant="outlined" sx={{ mt: 1 }}>
                                    Add More
                                </Button>
                            </Grid>

                            <Grid item xs={12}>
                                <Button type="submit" variant="contained" style={{ backgroundColor: '#063455', textTransform: 'none' }} disabled={processing} size="large" sx={{ mt: 2 }}>
                                    {eventMenu ? 'Update' : 'Create'}
                                </Button>
                            </Grid>
                        </Grid>
                    </form>
                </Box>
            </Box>
        </>
    );
};

export default CreateOrEditMenu;
