import React, { useState, useEffect } from 'react';
import SideNav from '@/components/App/SideBar/SideNav';
import UserAutocomplete from '@/components/UserAutocomplete';
import { Head, useForm, usePage } from '@inertiajs/react';
import { Box, Paper, Typography, Button, Grid, TextField, MenuItem, Select, FormControl, InputLabel, Divider, Autocomplete, RadioGroup, FormControlLabel, Radio, FormLabel, InputAdornment, IconButton } from '@mui/material';
import { Save, ArrowBack, AttachFile, Close } from '@mui/icons-material';
import dayjs from 'dayjs';
import axios from 'axios';
import { routeNameForContext } from '@/lib/utils';
import POSLayout from "@/components/POSLayout";

export default function Create({ cakeTypes, nextBookingNumber, booking, isEdit, guestTypes }) {
    const { props } = usePage();
    const [open, setOpen] = React.useState(true);

    // Initial Form State
    const { data, setData, post, put, processing, errors } = useForm({
        booking_number: booking?.booking_number || nextBookingNumber || '',
        customer_type: booking?.customer_type || '0',
        member_id: booking?.member_id || '',
        customer_id: booking?.customer_id || '', // Guest ID if exists
        customer_name: booking?.customer_name || '', // For Guest
        customer_phone: booking?.customer_phone || '',
        family_member_id: booking?.family_member_id || '',

        booking_date: booking?.booking_date || dayjs().format('YYYY-MM-DD'),
        delivery_date: booking?.delivery_date || '',
        pickup_time: booking?.pickup_time || '',

        cake_type_id: booking?.cake_type_id || '',
        flavor: booking?.flavor || '',
        topping: booking?.topping || '',
        filling: booking?.filling || '',
        icing: booking?.icing || '',
        color: booking?.color || '',
        weight: booking?.weight || '',
        message: booking?.message || '',
        special_instructions: booking?.special_instructions || '',
        special_display: booking?.special_display || '',

        documents: [], // Array of files
        attachment: null, // Legacy support
        has_attachment: booking?.has_attachment || false,
        attachment_path: booking?.attachment_path || '',

        receiver_name: booking?.receiver_name || '',
        receiver_phone: booking?.receiver_phone || '',

        total_price: booking?.total_price || '',
        advance_amount: booking?.advance_amount || '',
        payment_mode: booking?.payment_mode || 'cash', // Renamed from payment_method
        branch_id: booking?.branch_id || props.auth.user.branch_id || '',
        deleted_media_ids: [], // Track deleted existing media
    });

    const [members, setMembers] = useState([]);
    const [familyMembers, setFamilyMembers] = useState([]);

    // Fetch family members when member is selected
    useEffect(() => {
        if (data.member_id) {
            axios
                .get(route(routeNameForContext('api.members.family'), { id: data.member_id, type: data.customer_type }))
                .then((res) => {
                    setFamilyMembers(res.data);
                })
                .catch((err) => console.error(err));
        } else {
            setFamilyMembers([]);
        }
    }, [data.member_id, data.customer_type]);

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        // Add new files to existing documents array
        setData('documents', [...data.documents, ...files]);
    };

    const handleRemoveNewFile = (indexToRemove) => {
        setData(
            'documents',
            data.documents.filter((_, index) => index !== indexToRemove),
        );
    };

    const handleRemoveExistingFile = (mediaId) => {
        // Add to deleted_media_ids
        setData((prev) => ({
            ...prev,
            deleted_media_ids: [...prev.deleted_media_ids, mediaId],
        }));
    };

    const getPreviewUrl = (file) => {
        if (file.type && file.type.startsWith('image/')) {
            return URL.createObjectURL(file);
        }
        return null; // Handle other types if needed
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isEdit) {
            router.post(route(routeNameForContext('cake-bookings.update'), booking.id), {
                ...data,
                _method: 'put',
            });
        } else {
            post(route(routeNameForContext('cake-bookings.store')));
        }
    };

    return (
        <>
            {/* <Head title={isEdit ? 'Edit Cake Booking' : 'New Cake Booking'} /> */}
            {/* <SideNav open={open} setOpen={setOpen} /> */}
            <Box
                sx={{
                    p: 2,
                    minHeight: '100vh',
                    bgcolor: '#f5f5f5'
                }}
            >
                <Box>
                    {/* Header */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        {/* <Button startIcon={<ArrowBack />} component={'a'} href={route(routeNameForContext('cake-bookings.index'))} sx={{ mr: 2 }}>
                            Back
                        </Button> */}
                        <ArrowBack
                            sx={{ color: '#063455', cursor: 'pointer' }}
                            onClick={() => router.visit(route(routeNameForContext('cake-bookings.index')))}
                        />
                        <Typography sx={{ color: '#063455', fontWeight:'700', fontSize:'30px' }}>
                            {isEdit ? 'Edit Cake Booking' : 'New Cake Booking'}
                        </Typography>
                    </Box>

                    <Paper sx={{ p: 4 }} component="form" onSubmit={handleSubmit}>
                        <Grid container spacing={3}>
                            {/* Booking Info */}
                            <Grid item xs={12}>
                                <Typography variant="h6" sx={{ color: '#003B5C', mb: 1 }}>
                                    Booking Details
                                </Typography>
                                <Divider />
                            </Grid>

                            <Grid item xs={12} md={4}>
                                <TextField label="Booking Number" fullWidth value={data.booking_number} InputProps={{ readOnly: true }} disabled helperText="Auto-generated" />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField label="Booking Date" type="date" fullWidth InputLabelProps={{ shrink: true }} value={data.booking_date} onChange={(e) => setData('booking_date', e.target.value)} required error={!!errors.booking_date} helperText={errors.booking_date} />
                            </Grid>

                            {/* Customer Type Selection */}
                            <Grid item xs={12} md={12}>
                                <FormControl component="fieldset">
                                    <Grid item xs={12}>
                                        <RadioGroup
                                            row
                                            value={data.customer_type}
                                            onChange={(e) => {
                                                setData('customer_type', e.target.value);
                                                // Clear related data on type change
                                                setData((prev) => ({
                                                    ...prev,
                                                    customer_type: e.target.value,
                                                    member_id: '',
                                                    customer_name: '',
                                                    customer_phone: '',
                                                    family_member_id: '',
                                                }));
                                            }}
                                        >
                                            <FormControlLabel value="0" control={<Radio />} label="Member" sx={{ border: data.customer_type == '0' || data.customer_type == 'Member' ? '1px solid #A27B5C' : '1px solid #E3E3E3', borderRadius: 1, px: 1, m: 0, bgcolor: data.customer_type == '0' || data.customer_type == 'Member' ? '#FCF7EF' : 'transparent' }} />
                                            <FormControlLabel value="2" control={<Radio />} label="Corporate Member" sx={{ border: data.customer_type == '2' ? '1px solid #A27B5C' : '1px solid #E3E3E3', borderRadius: 1, px: 1, m: 0, bgcolor: data.customer_type == '2' ? '#FCF7EF' : 'transparent' }} />
                                            <FormControlLabel value="3" control={<Radio />} label="Employee" sx={{ border: data.customer_type == '3' ? '1px solid #A27B5C' : '1px solid #E3E3E3', borderRadius: 1, px: 1, m: 0, bgcolor: data.customer_type == '3' ? '#FCF7EF' : 'transparent' }} />
                                            {guestTypes &&
                                                guestTypes.map((type) => (
                                                    <FormControlLabel
                                                        key={type.id}
                                                        value={`guest-${type.id}`}
                                                        control={<Radio />}
                                                        label={type.name}
                                                        sx={{
                                                            border: data.customer_type == `guest-${type.id}` ? '1px solid #A27B5C' : '1px solid #E3E3E3',
                                                            borderRadius: 1,
                                                            px: 1,
                                                            m: 0,
                                                            bgcolor: data.customer_type == `guest-${type.id}` ? '#FCF7EF' : 'transparent',
                                                        }}
                                                    />
                                                ))}
                                            {(!guestTypes || guestTypes.length === 0) && <FormControlLabel value="Guest" control={<Radio />} label="Guest" />}
                                        </RadioGroup>
                                    </Grid>
                                </FormControl>
                            </Grid>

                            {/* Customer Search (UserAutocomplete) */}
                            <Grid item xs={12}>
                                <Typography variant="h6" sx={{ color: '#003B5C', mb: 1 }}>
                                    Customer Info
                                </Typography>
                                <UserAutocomplete
                                    routeUri={route(routeNameForContext('api.users.global-search'))}
                                    memberType={data.customer_type}
                                    value={data.member_id ? { id: data.member_id, name: data.customer_name } : null}
                                    onChange={(newValue) => {
                                        if (newValue) {
                                            const phone = newValue.phone || newValue.contact || newValue.mobile_number_a || newValue.phone_number || newValue.telephone_number || '';
                                            setData((prev) => ({
                                                ...prev,
                                                member_id: newValue.id,
                                                customer_name: newValue.name || newValue.full_name,
                                                customer_phone: phone,
                                                customer_id: newValue.id,
                                            }));
                                        } else {
                                            setData((prev) => ({
                                                ...prev,
                                                member_id: '',
                                                customer_name: '',
                                                customer_phone: '',
                                                customer_id: '',
                                            }));
                                        }
                                    }}
                                    label="Customer Name / ID"
                                    placeholder="Search by Name, ID, or CNIC..."
                                    error={!!errors.member_id}
                                    helperText={errors.member_id}
                                />
                            </Grid>

                            {/* Family Member Selection (For Members & Corporate Members) */}
                            {['0', 'Member', '2', 'Corporate Member'].includes(String(data.customer_type)) && (
                                <Grid item xs={12} md={6}>
                                    <FormControl fullWidth>
                                        <InputLabel>Family Member (Optional)</InputLabel>
                                        <Select value={data.family_member_id} label="Family Member (Optional)" onChange={(e) => setData('family_member_id', e.target.value)}>
                                            <MenuItem value="">
                                                <em>None</em>
                                            </MenuItem>
                                            {familyMembers.map((fm) => (
                                                <MenuItem key={fm.id} value={fm.id}>
                                                    {fm.name || fm.full_name} ({fm.relation})
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                            )}

                            <Grid item xs={12} md={6}>
                                <TextField label="Customer Name" fullWidth value={data.customer_name} onChange={(e) => setData('customer_name', e.target.value)} required error={!!errors.customer_name} helperText={errors.customer_name} InputProps={{ readOnly: ['0', '2', '3', 'Member'].includes(String(data.customer_type)) }} />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField label="Phone Number" fullWidth value={data.customer_phone} onChange={(e) => setData('customer_phone', e.target.value)} required error={!!errors.customer_phone} helperText={errors.customer_phone} />
                            </Grid>

                            {/* Cake Details */}
                            <Grid item xs={12} sx={{ mt: 2 }}>
                                <Typography variant="h6" sx={{ color: '#003B5C', mb: 1 }}>
                                    Cake Customization
                                </Typography>
                                <Divider />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <Grid item xs={12} md={6}>
                                    <Autocomplete
                                        fullWidth
                                        options={cakeTypes}
                                        getOptionLabel={(option) => option.name}
                                        value={cakeTypes.find((c) => c.id === data.cake_type_id) || null}
                                        onChange={(event, newValue) => {
                                            if (newValue) {
                                                setData((prev) => ({
                                                    ...prev,
                                                    cake_type_id: newValue.id,
                                                    total_price: newValue.base_price || '',
                                                }));
                                            } else {
                                                setData((prev) => ({
                                                    ...prev,
                                                    cake_type_id: '',
                                                    total_price: '',
                                                }));
                                            }
                                        }}
                                        renderInput={(params) => <TextField {...params} label="Cake Type" required error={!!errors.cake_type_id} helperText={errors.cake_type_id} />}
                                    />
                                </Grid>
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <TextField label="Weight (Lbs/Kg)" fullWidth value={data.weight} onChange={(e) => setData('weight', e.target.value)} error={!!errors.weight} helperText={errors.weight} />
                            </Grid>

                            <Grid item xs={12} md={4}>
                                <TextField label="Flavor" fullWidth value={data.flavor} onChange={(e) => setData('flavor', e.target.value)} />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField label="Filling" fullWidth value={data.filling} onChange={(e) => setData('filling', e.target.value)} />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField label="Icing" fullWidth value={data.icing} onChange={(e) => setData('icing', e.target.value)} />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField label="Topping" fullWidth value={data.topping} onChange={(e) => setData('topping', e.target.value)} />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField label="Color Theme" fullWidth value={data.color} onChange={(e) => setData('color', e.target.value)} />
                            </Grid>

                            <Grid item xs={12}>
                                <TextField label="Message on Cake" fullWidth multiline rows={2} value={data.message} onChange={(e) => setData('message', e.target.value)} placeholder="Happy Birthday..." />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField label="Special Instructions" fullWidth multiline rows={2} value={data.special_instructions} onChange={(e) => setData('special_instructions', e.target.value)} />
                            </Grid>

                            {/* Attachment (Documents / Media) */}
                            <Grid item xs={12}>
                                <Typography variant="subtitle2" gutterBottom>
                                    Reference Images / Documents (Optional)
                                </Typography>
                                <Button variant="outlined" component="label" startIcon={<AttachFile />}>
                                    Upload Files
                                    <input type="file" hidden multiple onChange={handleFileChange} />
                                </Button>
                                {data.documents && data.documents.length > 0 && (
                                    <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                                        {data.documents.map((file, index) => (
                                            <Box key={index} sx={{ position: 'relative', border: '1px solid #ddd', borderRadius: 1, p: 1, width: 100, height: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                                <IconButton size="small" sx={{ position: 'absolute', top: -10, right: -10, bgcolor: 'error.main', color: 'white', '&:hover': { bgcolor: 'error.dark' } }} onClick={() => handleRemoveNewFile(index)}>
                                                    <Close fontSize="small" sx={{ fontSize: 14 }} />
                                                </IconButton>
                                                {file.type && file.type.startsWith('image/') ? <img src={URL.createObjectURL(file)} alt={file.name} style={{ width: '100%', height: '60px', objectFit: 'cover', borderRadius: '4px' }} /> : <AttachFile fontSize="large" color="action" />}
                                                <Typography variant="caption" noWrap sx={{ width: '100%', textAlign: 'center', mt: 0.5, fontSize: '10px' }}>
                                                    {file.name}
                                                </Typography>
                                            </Box>
                                        ))}
                                    </Box>
                                )}
                                {isEdit && booking.media && booking.media.length > 0 && (
                                    <Box sx={{ mt: 2 }}>
                                        <Typography variant="caption" sx={{ ml: 1, fontWeight: 'bold' }} color="primary">
                                            Existing Files:
                                        </Typography>
                                        <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                                            {booking.media
                                                .filter((m) => !data.deleted_media_ids.includes(m.id))
                                                .map((file, index) => (
                                                    <Box key={file.id} sx={{ position: 'relative', border: '1px solid #ddd', borderRadius: 1, p: 1, width: 100, height: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                                        <IconButton size="small" sx={{ position: 'absolute', top: -10, right: -10, bgcolor: 'error.main', color: 'white', '&:hover': { bgcolor: 'error.dark' } }} onClick={() => handleRemoveExistingFile(file.id)}>
                                                            <Close fontSize="small" sx={{ fontSize: 14 }} />
                                                        </IconButton>
                                                        {file.mime_type && file.mime_type.startsWith('image/') ? <img src={`/${file.file_path}`} alt={file.file_name} style={{ width: '100%', height: '60px', objectFit: 'cover', borderRadius: '4px' }} /> : <AttachFile fontSize="large" color="action" />}
                                                        <Typography variant="caption" noWrap sx={{ width: '100%', textAlign: 'center', mt: 0.5, fontSize: '10px' }}>
                                                            {file.file_name}
                                                        </Typography>
                                                    </Box>
                                                ))}
                                        </Box>
                                    </Box>
                                )}
                                {isEdit && data.has_attachment && !data.attachment && (!booking.media || booking.media.length === 0) && (
                                    <Typography variant="caption" sx={{ ml: 2 }} color="primary">
                                        Existing legacy attachment present
                                    </Typography>
                                )}
                            </Grid>

                            {/* Delivery & Payment */}
                            <Grid item xs={12} sx={{ mt: 2 }}>
                                <Typography variant="h6" sx={{ color: '#003B5C', mb: 1 }}>
                                    Delivery & Payment
                                </Typography>
                                <Divider />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <TextField label="Delivery/Pickup Date" type="date" fullWidth InputLabelProps={{ shrink: true }} value={data.delivery_date} onChange={(e) => setData('delivery_date', e.target.value)} required error={!!errors.delivery_date} helperText={errors.delivery_date} />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField label="Pickup Time" type="time" fullWidth InputLabelProps={{ shrink: true }} value={data.pickup_time} onChange={(e) => setData('pickup_time', e.target.value)} />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <TextField label="Receiver Name (If different)" fullWidth value={data.receiver_name} onChange={(e) => setData('receiver_name', e.target.value)} />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField label="Receiver Phone" fullWidth value={data.receiver_phone} onChange={(e) => setData('receiver_phone', e.target.value)} />
                            </Grid>

                            <Grid item xs={12} md={3}>
                                <TextField
                                    label="Total Price"
                                    fullWidth
                                    required
                                    type="number"
                                    value={data.total_price}
                                    onChange={(e) => setData('total_price', e.target.value)}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start">Rs</InputAdornment>,
                                    }}
                                    error={!!errors.total_price}
                                    helperText={errors.total_price}
                                />
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <TextField
                                    label="Advance Amount"
                                    fullWidth
                                    type="number"
                                    required
                                    value={data.advance_amount}
                                    onChange={(e) => setData('advance_amount', e.target.value)}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start">Rs</InputAdornment>,
                                    }}
                                    error={!!errors.advance_amount}
                                    helperText={errors.advance_amount}
                                />
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <FormControl fullWidth>
                                    <InputLabel>Payment Mode</InputLabel>
                                    <Select value={data.payment_mode} label="Payment Mode" onChange={(e) => setData('payment_mode', e.target.value)} required={parseFloat(data.advance_amount) > 0}>
                                        <MenuItem value="cash">Cash</MenuItem>
                                        <MenuItem value="credit_card">Credit Card</MenuItem>
                                        <MenuItem value="online">Online Transfer</MenuItem>
                                        <MenuItem value="cheque">Cheque</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <TextField
                                    label="Remaining Balance"
                                    fullWidth
                                    type="number"
                                    value={data.total_price - data.advance_amount}
                                    InputProps={{
                                        readOnly: true,
                                        startAdornment: <InputAdornment position="start">Rs</InputAdornment>,
                                    }}
                                    disabled
                                />
                            </Grid>

                            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                                <Button type="submit" variant="contained" size="large" startIcon={<Save />} disabled={processing} sx={{ bgcolor: '#003B5C', '&:hover': { bgcolor: '#002a41' } }}>
                                    {isEdit ? 'Update Booking' : 'Create Booking'}
                                </Button>
                            </Grid>
                        </Grid>
                    </Paper>
                </Box>
            </Box>
        </>
    );
}

Create.layout = (page) => <POSLayout>{page}</POSLayout>;
