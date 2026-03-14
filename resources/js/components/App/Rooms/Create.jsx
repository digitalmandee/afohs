import React, { useRef, useState } from 'react';
import { Box, Typography, TextField, Button, MenuItem, FormControl, InputLabel, Select, Grid } from '@mui/material';
import { router, usePage } from '@inertiajs/react';
import { enqueueSnackbar } from 'notistack';

const CreateRoom = () => {
    const { props } = usePage();
    const [photoUrl, setPhotoUrl] = useState(props.room?.photo_path ? `/${props.room.photo_path}` : null);
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef(null);

    const [categoryCharges, setCategoryCharges] = useState(
        props.categories.map((cat) => ({
            ...cat,
            amount: props.room?.category_charges?.find((c) => c.room_category_id === cat.id)?.amount || '',
        })),
    );

    // Room Form state
    const [roomForm, setRoomForm] = useState({
        name: props.room?.name || '',
        number_of_beds: props.room?.number_of_beds?.toString() || '',
        max_capacity: props.room?.max_capacity?.toString() || '',
        number_of_bathrooms: props.room?.number_of_bathrooms?.toString() || '',
        room_type_id: props.room?.room_type_id?.toString() || '',
        photo: null,
    });

    const [roomErrors, setRoomErrors] = useState({
        name: '',
        number_of_beds: '',
        max_capacity: '',
        number_of_bathrooms: '',
        room_type_id: '',
    });

    const handleRoomInputChange = (e) => {
        const { name, value } = e.target;
        setRoomForm({ ...roomForm, [name]: value });
        setRoomErrors({ ...roomErrors, [name]: '' });
    };

    const handlePhotoChange = (e, formType) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => setPhotoUrl(e.target.result);
            reader.readAsDataURL(file);
            setRoomForm({ ...roomForm, photo: file });
        }
    };

    const handleRoomSubmit = (e) => {
        e.preventDefault();

        const newErrors = {};
        let hasErrors = false;

        // Client-side validation
        if (!roomForm.name.trim()) {
            newErrors.name = 'Room name is required';
            hasErrors = true;
        }
        if (!roomForm.number_of_beds.trim()) {
            newErrors.number_of_beds = 'Number of beds is required';
            hasErrors = true;
        }
        if (!roomForm.max_capacity.trim()) {
            newErrors.max_capacity = 'Max capacity is required';
            hasErrors = true;
        }
        if (!roomForm.number_of_bathrooms.trim()) {
            newErrors.number_of_bathrooms = 'Number of bathrooms is required';
            hasErrors = true;
        }

        if (!roomForm.room_type_id) {
            newErrors.room_type_id = 'Room type is required';
            hasErrors = true;
        }

        if (hasErrors) {
            setRoomErrors(newErrors);
            return;
        }

        // Create FormData and ensure numeric fields are converted
        const data = new FormData();
        data.append('name', roomForm.name);
        data.append('number_of_beds', parseInt(roomForm.number_of_beds) || 0);
        data.append('max_capacity', parseInt(roomForm.max_capacity) || 0);
        data.append('number_of_bathrooms', parseInt(roomForm.number_of_bathrooms) || 0);
        data.append('room_type_id', roomForm.room_type_id);
        categoryCharges.forEach((charge, i) => {
            data.append(`category_charges[${i}][id]`, charge.id);
            data.append(`category_charges[${i}][amount]`, charge.amount || 0);
        });

        if (roomForm.photo) {
            data.append('photo', roomForm.photo);
        }

        setLoading(true);

        const method = 'post';
        const url = props.room ? route('rooms.update', props.room.id) : route('rooms.store');

        router[method](url, data, {
            forceFormData: true,
            onSuccess: () => {
                setRoomForm({
                    name: '',
                    number_of_beds: '',
                    max_capacity: '',
                    number_of_bathrooms: '',
                    photo: null,
                });
                setPhotoUrl(null);
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
                setRoomErrors({
                    name: '',
                    number_of_beds: '',
                    max_capacity: '',
                    number_of_bathrooms: '',
                });
                enqueueSnackbar('Room added successfully', { variant: 'success' });
                router.visit(route('rooms.all'));
            },
            onError: (serverErrors) => {
                console.error('Server errors:', serverErrors); // Log errors for debugging
                setRoomErrors({ ...roomErrors, ...serverErrors });
                enqueueSnackbar('Failed to add room. Please check the form.', { variant: 'error' });
            },
            onFinish: () => {
                setLoading(false);
                console.log('Request completed'); // Log request completion
            },
        });
    };

    const handlePhotoUpload = (e) => {
        handlePhotoChange(e, 'room');
    };

    const handleChoosePhoto = () => {
        fileInputRef.current.click();
    };

    const handleDeletePhoto = () => {
        setPhotoUrl(null);
        setRoomForm({ ...roomForm, photo: null });
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };
    return (
        <>
            {/* Photo Upload Section */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Box
                    sx={{
                        width: 80,
                        height: 80,
                        backgroundColor: '#d4a88e',
                        borderRadius: '4px',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        overflow: 'hidden',
                    }}
                >
                    {photoUrl ? (
                        <img src={photoUrl || '/placeholder.svg'} alt="Uploaded" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                        <Box
                            sx={{
                                width: 40,
                                height: 40,
                                border: '2px solid white',
                                borderRadius: '50%',
                                position: 'relative',
                            }}
                        >
                            <Box
                                sx={{
                                    width: 20,
                                    height: 20,
                                    border: '2px solid white',
                                    borderRadius: '50%',
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    transform: 'translate(-50%, -50%)',
                                }}
                            />
                        </Box>
                    )}
                </Box>
                <Box sx={{ ml: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Button
                            variant="text"
                            onClick={handleChoosePhoto}
                            sx={{
                                color: '#1976d2',
                                textTransform: 'none',
                                p: 0,
                                minWidth: 'auto',
                                fontWeight: 'normal',
                                fontSize: '0.9rem',
                            }}
                        >
                            Choose Photo
                        </Button>
                        <Typography sx={{ mx: 1, color: '#ccc' }}>|</Typography>
                        <Button
                            variant="text"
                            onClick={handleDeletePhoto}
                            sx={{
                                color: '#f44336',
                                textTransform: 'none',
                                p: 0,
                                minWidth: 'auto',
                                fontWeight: 'normal',
                                fontSize: '0.9rem',
                            }}
                        >
                            Delete
                        </Button>
                        <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} style={{ display: 'none' }} accept="image/*" />
                    </Box>
                    <Typography variant="body2" color="textSecondary" sx={{ fontSize: '0.8rem' }}>
                        Click upload to room image (4 MB max)
                    </Typography>
                </Box>
            </Box>
            <Box component="form" onSubmit={handleRoomSubmit}>
                <Box sx={{ mb: 2 }}>
                    <Typography
                        sx={{
                            mb: 1,
                            color: '#121212',
                            fontWeight: 400,
                            fontSize: '14px',
                        }}
                    >
                        Room No.
                    </Typography>
                    <TextField fullWidth name="name" value={roomForm.name} onChange={handleRoomInputChange} placeholder="Enter Room Number" variant="outlined" size="small" error={!!roomErrors.name} helperText={roomErrors.name} />
                </Box>

                <Grid container spacing={2}>
                    <Grid item xs={6}>
                        <Box sx={{ mb: 2 }}>
                            <Typography
                                sx={{
                                    mb: 1,
                                    color: '#121212',
                                    fontWeight: 400,
                                    fontSize: '14px',
                                }}
                            >
                                Room Type
                            </Typography>
                            <FormControl fullWidth size="small" error={!!roomErrors.room_type_id}>
                                <Select name="room_type_id" value={roomForm.room_type_id} onChange={handleRoomInputChange} displayEmpty>
                                    <MenuItem value="" disabled>
                                        {props.roomTypes.length > 0 ? 'Select Room Type' : 'None'}
                                    </MenuItem>
                                    {props.roomTypes.map((type) => (
                                        <MenuItem key={type.id} value={type.id}>
                                            {type.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                                {roomErrors.room_type_id && (
                                    <Typography variant="caption" color="error">
                                        {roomErrors.room_type_id}
                                    </Typography>
                                )}
                            </FormControl>
                        </Box>
                    </Grid>
                    <Grid item xs={6}>
                        <Box sx={{ mb: 2 }}>
                            <Typography
                                sx={{
                                    mb: 1,
                                    color: '#121212',
                                    fontWeight: 400,
                                    fontSize: '14px',
                                }}
                            >
                                No. of Beds
                            </Typography>
                            <TextField fullWidth name="number_of_beds" type="number" inputProps={{ min: 0 }} value={roomForm.number_of_beds} onChange={handleRoomInputChange} placeholder="e.g : 3" variant="outlined" size="small" error={!!roomErrors.number_of_beds} helperText={roomErrors.number_of_beds} />
                        </Box>
                    </Grid>
                    <Grid item xs={6}>
                        <Box sx={{ mb: 2 }}>
                            <Typography
                                sx={{
                                    mb: 1,
                                    color: '#121212',
                                    fontWeight: 400,
                                    fontSize: '14px',
                                }}
                            >
                                Max Capacity
                            </Typography>
                            <TextField fullWidth name="max_capacity" type="number" inputProps={{ min: 0 }} value={roomForm.max_capacity} onChange={handleRoomInputChange} placeholder="e.g : 2 Adults" variant="outlined" size="small" error={!!roomErrors.max_capacity} helperText={roomErrors.max_capacity} />
                        </Box>
                    </Grid>

                    <Grid item xs={6}>
                        <Box sx={{ mb: 2 }}>
                            <Typography
                                sx={{
                                    mb: 1,
                                    color: '#121212',
                                    fontWeight: 400,
                                    fontSize: '14px',
                                }}
                            >
                                No. of Bathroom
                            </Typography>
                            <TextField fullWidth name="number_of_bathrooms" type="number" inputProps={{ min: 0 }} value={roomForm.number_of_bathrooms} onChange={handleRoomInputChange} placeholder="e.g : 1" variant="outlined" size="small" error={!!roomErrors.number_of_bathrooms} helperText={roomErrors.number_of_bathrooms} />
                        </Box>
                    </Grid>
                </Grid>

                <Box>
                    <Typography sx={{ mb: 3 }}>Room Category Charges</Typography>
                    <Grid container spacing={2}>
                        {categoryCharges?.map((cat, index) => (
                            <Grid item xs={6} key={cat.id}>
                                <TextField
                                    label={cat.name}
                                    inputProps={{ min: 0 }}
                                    type="number"
                                    variant="outlined"
                                    size="small"
                                    value={cat.amount}
                                    onChange={(e) => {
                                        const updated = [...categoryCharges];
                                        updated[index].amount = e.target.value;
                                        setCategoryCharges(updated);
                                    }}
                                    InputProps={{ startAdornment: <span>Rs&nbsp;</span> }}
                                />
                            </Grid>
                        ))}
                    </Grid>
                </Box>

                {/* Action Buttons */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
                    <Button
                        variant="text"
                        sx={{
                            color: '#000',
                            mr: 2,
                            textTransform: 'none',
                            fontWeight: 'normal',
                        }}
                        onClick={() => window.history.back()}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        variant="contained"
                        onClick={handleRoomSubmit}
                        disabled={loading}
                        loading={loading}
                        loadingPosition="start"
                        sx={{
                            backgroundColor: '#0a3d62',
                            color: 'white',
                            textTransform: 'none',
                            '&:hover': {
                                backgroundColor: '#0c2d48',
                            },
                            fontWeight: 'normal',
                            px: 4,
                        }}
                    >
                        {props.room ? 'Update Room' : 'Save'}
                    </Button>
                </Box>
            </Box>
        </>
    );
};

export default CreateRoom;
