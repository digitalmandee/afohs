import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Grid, Autocomplete, IconButton, List, ListItem, ListItemText, ListItemSecondaryAction, Typography, CircularProgress, Box, Chip } from '@mui/material';
import { Delete as DeleteIcon, AttachFile as AttachFileIcon } from '@mui/icons-material';
import axios from 'axios';

const Edit = ({ open, onClose, asset, onSuccess }) => {
    const [data, setData] = useState({
        name: '',
        classification: '',
        type: '',
        acquisition_date: '',
        location: '',
        quantity: 1,
        cost: '',
        status: 'active',
        documents: [],
    });

    const [deletedMediaIds, setDeletedMediaIds] = useState([]);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    // Options for autocomplete
    const [options, setOptions] = useState({
        classifications: [],
        types: [],
        locations: [],
    });

    const [optionsLoading, setOptionsLoading] = useState(false);

    useEffect(() => {
        if (open) {
            setOptionsLoading(true);
            axios
                .get(route('employees.assets.options'))
                .then((res) => {
                    setOptions({
                        classifications: res.data.classifications || [],
                        types: res.data.types || [],
                        locations: res.data.locations || [],
                    });
                })
                .catch((err) => console.error(err))
                .finally(() => setOptionsLoading(false));

            // Reset form with new asset data when modal opens or asset changes
            setData({
                name: asset?.name || '',
                classification: asset?.classification ? asset.classification.split(',').map((s) => s.trim()) : [],
                type: asset?.type ? asset.type.split(',').map((s) => s.trim()) : [],
                acquisition_date: asset?.acquisition_date || '',
                location: asset?.location || '',
                quantity: asset?.quantity || '',
                cost: asset?.cost || '',
                status: asset?.status || 'active',
                documents: [],
            });
            setDeletedMediaIds([]); // Also reset deleted media IDs
        }
    }, [open, asset]); // Only re-fetch if open/asset changes

    const handleChange = (e) => {
        setData({ ...data, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        setData({ ...data, documents: [...data.documents, ...Array.from(e.target.files)] });
    };

    const handleRemoveNewFile = (index) => {
        const newDocs = [...data.documents];
        newDocs.splice(index, 1);
        setData({ ...data, documents: newDocs });
    };

    const handleMarkForDeletion = (mediaId) => {
        setDeletedMediaIds([...deletedMediaIds, mediaId]);
    };

    const handleSubmit = async () => {
        setLoading(true);
        setErrors({});

        const formData = new FormData();
        formData.append('_method', 'PUT');
        formData.append('name', data.name);
        formData.append('classification', Array.isArray(data.classification) ? data.classification.join(', ') : data.classification);
        formData.append('type', Array.isArray(data.type) ? data.type.join(', ') : data.type);
        formData.append('acquisition_date', data.acquisition_date);
        formData.append('location', data.location || '');
        formData.append('quantity', data.quantity);
        formData.append('cost', data.cost || '');
        formData.append('status', data.status);

        if (data.documents) {
            data.documents.forEach((file) => {
                formData.append('documents[]', file);
            });
        }

        if (deletedMediaIds.length > 0) {
            deletedMediaIds.forEach((id) => {
                formData.append('deleted_media_ids[]', id);
            });
        }

        try {
            const res = await axios.post(route('employees.assets.update', asset.id), formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            if (res.data.success) {
                onSuccess();
                onClose();
            }
        } catch (error) {
            if (error.response && error.response.status === 422) {
                setErrors(error.response.data.errors);
            } else {
                console.error(error);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ backgroundColor: '#063455', color: 'white' }}>Edit Asset</DialogTitle>
            <DialogContent sx={{ pt: 3 }}>
                {optionsLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <TextField fullWidth label="Asset Name" name="name" value={data.name} onChange={handleChange} error={!!errors.name} helperText={errors.name?.[0]} size="small" />
                        </Grid>
                        <Grid item xs={6}>
                            <Autocomplete multiple freeSolo options={options.classifications} value={Array.isArray(data.classification) ? data.classification : []} onChange={(e, newVal) => setData({ ...data, classification: newVal })} renderTags={(value, getTagProps) => value.map((option, index) => <Chip variant="outlined" label={option} {...getTagProps({ index })} />)} renderInput={(params) => <TextField {...params} label="Classification" error={!!errors.classification} helperText={errors.classification?.[0]} size="small" placeholder="Select or type..." />} />
                        </Grid>
                        <Grid item xs={6}>
                            <Autocomplete multiple freeSolo options={options.types} value={Array.isArray(data.type) ? data.type : []} onChange={(e, newVal) => setData({ ...data, type: newVal })} renderTags={(value, getTagProps) => value.map((option, index) => <Chip variant="outlined" label={option} {...getTagProps({ index })} />)} renderInput={(params) => <TextField {...params} label="Type" error={!!errors.type} helperText={errors.type?.[0]} size="small" placeholder="Select or type..." />} />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField fullWidth label="Acquisition Date" type="date" name="acquisition_date" value={data.acquisition_date} onChange={handleChange} error={!!errors.acquisition_date} helperText={errors.acquisition_date?.[0]} size="small" InputLabelProps={{ shrink: true }} />
                        </Grid>
                        <Grid item xs={6}>
                            <Autocomplete freeSolo options={options.locations} value={data.location} onChange={(e, newVal) => setData({ ...data, location: newVal })} onInputChange={(e, newVal) => setData({ ...data, location: newVal })} renderInput={(params) => <TextField {...params} label="Location" name="location" error={!!errors.location} helperText={errors.location?.[0]} size="small" />} />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField fullWidth label="Quantity" type="number" name="quantity" value={data.quantity} onChange={handleChange} error={!!errors.quantity} helperText={errors.quantity?.[0]} size="small" />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField fullWidth label="Cost" type="number" name="cost" value={data.cost} onChange={handleChange} error={!!errors.cost} helperText={errors.cost?.[0]} size="small" />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField select fullWidth label="Status" name="status" value={data.status} onChange={handleChange} error={!!errors.status} helperText={errors.status?.[0]} size="small">
                                <MenuItem value="active">Active</MenuItem>
                                <MenuItem value="maintenance">Maintenance</MenuItem>
                                <MenuItem value="retired">Retired</MenuItem>
                                <MenuItem value="lost">Lost</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid item xs={12}>
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                Existing Documents:
                            </Typography>
                            {asset?.media?.filter((file) => !deletedMediaIds.includes(file.id)).length > 0 ? (
                                <List dense sx={{ bgcolor: 'background.paper', border: '1px solid #e0e0e0', borderRadius: 1 }}>
                                    {asset.media
                                        .filter((file) => !deletedMediaIds.includes(file.id))
                                        .map((file) => (
                                            <ListItem key={file.id} divider>
                                                <AttachFileIcon sx={{ mr: 2, color: 'action.active' }} />
                                                <ListItemText
                                                    primary={file.file_name}
                                                    secondary={
                                                        <a href={`/storage/${file.file_path}`} target="_blank" rel="noopener noreferrer">
                                                            View File
                                                        </a>
                                                    }
                                                />
                                                <ListItemSecondaryAction>
                                                    <IconButton edge="end" aria-label="delete" onClick={() => handleMarkForDeletion(file.id)}>
                                                        <DeleteIcon color="error" />
                                                    </IconButton>
                                                </ListItemSecondaryAction>
                                            </ListItem>
                                        ))}
                                </List>
                            ) : (
                                <Typography variant="caption" color="textSecondary" display="block" sx={{ mb: 1 }}>
                                    No existing documents.
                                </Typography>
                            )}

                            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                                New Documents:
                            </Typography>
                            {data.documents.length > 0 && (
                                <List dense sx={{ bgcolor: 'background.paper', border: '1px solid #e0e0e0', borderRadius: 1, mb: 1 }}>
                                    {data.documents.map((file, index) => (
                                        <ListItem key={index} divider>
                                            <AttachFileIcon sx={{ mr: 2, color: 'action.active' }} />
                                            <ListItemText primary={file.name} secondary={`${(file.size / 1024).toFixed(2)} KB`} />
                                            <ListItemSecondaryAction>
                                                <IconButton edge="end" aria-label="delete" onClick={() => handleRemoveNewFile(index)}>
                                                    <DeleteIcon />
                                                </IconButton>
                                            </ListItemSecondaryAction>
                                        </ListItem>
                                    ))}
                                </List>
                            )}

                            <Button variant="outlined" component="label" fullWidth startIcon={<AttachFileIcon />}>
                                Upload Documents
                                <input type="file" hidden multiple onChange={handleFileChange} />
                            </Button>
                        </Grid>
                    </Grid>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="inherit">
                    Cancel
                </Button>
                <Button onClick={handleSubmit} variant="contained" style={{ backgroundColor: '#063455' }} disabled={loading}>
                    {loading ? 'Update Asset' : 'Update Asset'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default Edit;
