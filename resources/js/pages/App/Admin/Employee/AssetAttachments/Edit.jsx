import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Grid, Autocomplete, IconButton, List, ListItem, ListItemText, ListItemSecondaryAction, Typography, CircularProgress, Box } from '@mui/material';
import { Delete as DeleteIcon, AttachFile as AttachFileIcon } from '@mui/icons-material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import axios from 'axios';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);

const Edit = ({ open, onClose, attachment, onSuccess }) => {
    const [data, setData] = useState({
        employee_id: null,
        employee_asset_id: null,
        attachment_date: '',
        comments: '',
        status: 'assigned',
        return_date: '',
        documents: [],
    });

    const [deletedMediaIds, setDeletedMediaIds] = useState([]);

    const [options, setOptions] = useState({
        employees: [],
        assets: [],
    });

    const [loading, setLoading] = useState(false);
    const [optionsLoading, setOptionsLoading] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (open) {
            fetchOptions();
        }
    }, [open]);

    // Pre-fill data when attachment or options change
    useEffect(() => {
        if (open && attachment && options.employees.length > 0 && options.assets.length > 0) {
            // Find employee object
            const selectedEmployee = options.employees.find((e) => e.id === attachment.employee_id) || null;
            // Find asset object (even if not active in list, might need to handle this differently if list only returns active)
            // For now, assuming list might contain it or we accept null if not in list
            const selectedAsset = options.assets.find((a) => a.id === attachment.employee_asset_id) || (attachment.asset ? { id: attachment.asset.id, name: attachment.asset.name, type: attachment.asset.type, classification: attachment.asset.classification } : null);

            setData({
                employee_id: selectedEmployee,
                employee_asset_id: selectedAsset,
                // Parse date if it's in DD/MM/YYYY format or YYYY-MM-DD
                attachment_date: attachment.attachment_date ? (dayjs(attachment.attachment_date, 'DD/MM/YYYY').isValid() ? dayjs(attachment.attachment_date, 'DD/MM/YYYY').format('YYYY-MM-DD') : attachment.attachment_date) : '',
                comments: attachment.comments || '',
                status: attachment.status,
                return_date: attachment.return_date || '',
                documents: [],
            });
            setDeletedMediaIds([]);
        }
    }, [open, attachment, options]);

    const fetchOptions = async () => {
        setOptionsLoading(true);
        try {
            const res = await axios.get(route('employees.asset-attachments.form-data'));
            if (res.data.success) {
                setOptions({
                    employees: res.data.employees,
                    assets: res.data.assets,
                });
            }
        } catch (error) {
            console.error(error);
        } finally {
            setOptionsLoading(false);
        }
    };

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
        formData.append('employee_id', data.employee_id?.id || '');
        formData.append('employee_asset_id', data.employee_asset_id?.id || '');
        formData.append('attachment_date', data.attachment_date);
        formData.append('comments', data.comments || '');
        formData.append('status', data.status);
        formData.append('return_date', data.return_date || '');

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
            const res = await axios.post(route('employees.asset-attachments.update', attachment.id), formData, {
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
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ backgroundColor: '#063455', color: 'white' }}>Edit Assignment</DialogTitle>
                <DialogContent sx={{ pt: 3 }}>
                    {optionsLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
                            <CircularProgress />
                        </Box>
                    ) : (
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={12}>
                                <Autocomplete options={options.employees} getOptionLabel={(option) => (option ? `${option.name} (${option.employee_id})` : '')} value={data.employee_id} onChange={(e, newVal) => setData({ ...data, employee_id: newVal })} renderInput={(params) => <TextField {...params} label="Employee" error={!!errors.employee_id} helperText={errors.employee_id?.[0]} size="small" />} />
                            </Grid>
                            <Grid item xs={12}>
                                <Autocomplete options={options.assets} getOptionLabel={(option) => (option ? `${option.name} - ${option.type} (${option.classification})` : '')} value={data.employee_asset_id} onChange={(e, newVal) => setData({ ...data, employee_asset_id: newVal })} renderInput={(params) => <TextField {...params} label="Assigned Asset" error={!!errors.employee_asset_id} helperText={errors.employee_asset_id?.[0]} size="small" />} />
                            </Grid>
                            <Grid item xs={6}>
                                <DatePicker
                                    label="Attachment Date"
                                    value={data.attachment_date ? dayjs(data.attachment_date, 'YYYY-MM-DD') : null}
                                    onChange={(newValue) => setData({ ...data, attachment_date: newValue ? newValue.format('YYYY-MM-DD') : '' })}
                                    format="DD/MM/YYYY"
                                    slotProps={{
                                        textField: { fullWidth: true, size: 'small', error: !!errors.attachment_date, helperText: errors.attachment_date?.[0], InputLabelProps: { shrink: true } },
                                    }}
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField select fullWidth label="Status" name="status" value={data.status} onChange={handleChange} error={!!errors.status} helperText={errors.status?.[0]} size="small">
                                    <MenuItem value="assigned">Assigned</MenuItem>
                                    <MenuItem value="returned">Returned</MenuItem>
                                </TextField>
                            </Grid>

                            {data.status === 'returned' && (
                                <Grid item xs={6}>
                                    <DatePicker
                                        label="Return Date"
                                        value={data.return_date ? dayjs(data.return_date, 'YYYY-MM-DD') : null}
                                        onChange={(newValue) => setData({ ...data, return_date: newValue ? newValue.format('YYYY-MM-DD') : '' })}
                                        format="DD/MM/YYYY"
                                        slotProps={{
                                            textField: { fullWidth: true, size: 'small', error: !!errors.return_date, helperText: errors.return_date?.[0], InputLabelProps: { shrink: true } },
                                        }}
                                    />
                                </Grid>
                            )}

                            <Grid item xs={12}>
                                <TextField fullWidth label="Comments" name="comments" value={data.comments} onChange={handleChange} multiline rows={3} error={!!errors.comments} helperText={errors.comments?.[0]} size="small" />
                            </Grid>
                            <Grid item xs={12}>
                                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                    Existing Documents:
                                </Typography>
                                {attachment?.media?.filter((file) => !deletedMediaIds.includes(file.id)).length > 0 ? (
                                    <List dense sx={{ bgcolor: 'background.paper', border: '1px solid #e0e0e0', borderRadius: 1 }}>
                                        {attachment.media
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
                        {loading ? 'Update' : 'Update Assignment'}
                    </Button>
                </DialogActions>
            </Dialog>
        </LocalizationProvider>
    );
};

export default Edit;
