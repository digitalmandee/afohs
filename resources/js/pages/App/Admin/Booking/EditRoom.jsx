import React, { useState, useRef } from 'react';
import { router } from '@inertiajs/react';
import {
    Box,
    Typography,
    TextField,
    Button,
    Paper,
    IconButton,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

// const drawerWidthOpen = 240;
// const drawerWidthClosed = 110;

const EditRoom = ({ room }) => {
    // const [open, setOpen] = useState(true);
    const [photoUrl, setPhotoUrl] = useState(room.photo_path ? `/${room.photo_path}` : null);
    const fileInputRef = useRef(null);

    // Room Form state
    const [roomForm, setRoomForm] = useState({
        name: room.name || '',
        number_of_beds: room.number_of_beds || '',
        max_capacity: room.max_capacity || '',
        price_per_night: room.price_per_night || '',
        number_of_bathrooms: room.number_of_bathrooms || '',
        photo: null,
    });

    const [roomErrors, setRoomErrors] = useState({
        name: '',
        number_of_beds: '',
        max_capacity: '',
        price_per_night: '',
        number_of_bathrooms: '',
    });

    const handleRoomInputChange = (e) => {
        const { name, value } = e.target;
        // Convert numeric fields to appropriate types
        const newValue = name === 'price_per_night' ? value : value;
        setRoomForm((prev) => ({
            ...prev,
            [name]: newValue,
        }));
        setRoomErrors((prev) => ({ ...prev, [name]: '' }));
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => setPhotoUrl(e.target.result);
            reader.readAsDataURL(file);
            setRoomForm((prev) => ({ ...prev, photo: file }));
        }
    };

    const handleRoomSubmit = (e) => {
        e.preventDefault();

        const newErrors = {};
        let hasErrors = false;

        if (!roomForm.name.trim()) {
            newErrors.name = 'Room name is required';
            hasErrors = true;
        }
        if (!roomForm.number_of_beds || isNaN(parseInt(roomForm.number_of_beds)) || parseInt(roomForm.number_of_beds) < 1) {
            newErrors.number_of_beds = 'Number of beds is required and must be a positive number';
            hasErrors = true;
        }
        if (!roomForm.max_capacity || isNaN(parseInt(roomForm.max_capacity)) || parseInt(roomForm.max_capacity) < 1) {
            newErrors.max_capacity = 'Max capacity is required and must be a positive number';
            hasErrors = true;
        }
        if (!roomForm.price_per_night || isNaN(parseFloat(roomForm.price_per_night)) || parseFloat(roomForm.price_per_night) < 0) {
            newErrors.price_per_night = 'Price per night is required and must be a non-negative number';
            hasErrors = true;
        }
        if (!roomForm.number_of_bathrooms || isNaN(parseInt(roomForm.number_of_bathrooms)) || parseInt(roomForm.number_of_bathrooms) < 0) {
            newErrors.number_of_bathrooms = 'Number of bathrooms is required and must be a non-negative number';
            hasErrors = true;
        }

        if (hasErrors) {
            setRoomErrors(newErrors);
            return;
        }

        const data = new FormData();
        data.append('name', roomForm.name);
        data.append('number_of_beds', parseInt(roomForm.number_of_beds));
        data.append('max_capacity', parseInt(roomForm.max_capacity));
        data.append('price_per_night', parseFloat(roomForm.price_per_night));
        data.append('number_of_bathrooms', parseInt(roomForm.number_of_bathrooms));
        if (roomForm.photo) data.append('photo', roomForm.photo);

        data.append('_method', 'PUT'); // Spoof PUT request for Inertia

        router.post(`/rooms/${room.id}`, data, {
            onSuccess: () => {
                setPhotoUrl(null);
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
                setRoomErrors({
                    name: '',
                    number_of_beds: '',
                    max_capacity: '',
                    price_per_night: '',
                    number_of_bathrooms: '',
                });
            },
            onError: (serverErrors) => {
                setRoomErrors((prev) => ({ ...prev, ...serverErrors }));
            },
        });
    };

    const handleChoosePhoto = () => {
        fileInputRef.current.click();
    };

    const handleDeletePhoto = () => {
        setPhotoUrl(null);
        setRoomForm((prev) => ({ ...prev, photo: null }));
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <>
            {/* <SideNav open={open} setOpen={setOpen} />
            <div
                style={{
                    marginLeft: open ? `${drawerWidthOpen}px` : `${drawerWidthClosed}px`,
                    transition: 'margin-left 0.3s ease-in-out',
                    marginTop: '5rem',
                }}
            > */}
                <div style={{ backgroundColor: '#f5f5f5', minHeight: '100vh', padding: '20px' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <IconButton
                            sx={{ color: '#063455' }}
                            onClick={() => window.history.back()}
                        >
                            <ArrowBackIcon />
                        </IconButton>
                        <Typography variant="h5" component="h1" sx={{ ml: 1, fontWeight: 500, fontSize: '30px', color: '#063455' }}>
                            Edit Room
                        </Typography>
                    </Box>
                    <Box sx={{ maxWidth: 600, margin: '0 auto', border: '1px solid #E3E3E3', bgcolor: '#FFFFFF' }}>
                        <Paper sx={{ p: 3 }}>
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
                                        <img src={photoUrl} alt="Uploaded" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handlePhotoChange}
                                            style={{ display: 'none' }}
                                            accept="image/*"
                                        />
                                    </Box>
                                    <Typography variant="body2" color="textSecondary" sx={{ fontSize: '0.8rem' }}>
                                        Click upload to room image (4 MB max)
                                    </Typography>
                                </Box>
                            </Box>

                            {/* Room Form */}
                            <Box component="form" onSubmit={handleRoomSubmit}>
                                <Box sx={{ mb: 2 }}>
                                    <Typography sx={{ mb: 1, color: '#121212', fontWeight: 400, fontSize: '14px' }}>
                                        Room Name
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        name="name"
                                        value={roomForm.name}
                                        onChange={handleRoomInputChange}
                                        placeholder="e.g : Standard"
                                        variant="outlined"
                                        size="small"
                                        error={!!roomErrors.name}
                                        helperText={roomErrors.name}
                                    />
                                </Box>

                                <Box sx={{ mb: 2 }}>
                                    <Typography sx={{ mb: 1, color: '#121212', fontWeight: 400, fontSize: '14px' }}>
                                        No. of Beds
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        name="number_of_beds"
                                        value={roomForm.number_of_beds}
                                        onChange={handleRoomInputChange}
                                        placeholder="e.g : 3"
                                        variant="outlined"
                                        size="small"
                                        error={!!roomErrors.number_of_beds}
                                        helperText={roomErrors.number_of_beds}
                                        type="number"
                                    />
                                </Box>

                                <Box sx={{ mb: 2 }}>
                                    <Typography sx={{ mb: 1, color: '#121212', fontWeight: 400, fontSize: '14px' }}>
                                        Max Capacity
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        name="max_capacity"
                                        value={roomForm.max_capacity}
                                        onChange={handleRoomInputChange}
                                        placeholder="e.g : 2 Adults"
                                        variant="outlined"
                                        size="small"
                                        error={!!roomErrors.max_capacity}
                                        helperText={roomErrors.max_capacity}
                                        type="number"
                                    />
                                </Box>

                                <Box sx={{ mb: 2 }}>
                                    <Typography sx={{ mb: 1, color: '#121212', fontWeight: 400, fontSize: '14px' }}>
                                        Price Per Night
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        name="price_per_night"
                                        value={roomForm.price_per_night}
                                        onChange={handleRoomInputChange}
                                        placeholder="e.g : 100$"
                                        variant="outlined"
                                        size="small"
                                        error={!!roomErrors.price_per_night}
                                        helperText={roomErrors.price_per_night}
                                        type="number"
                                    />
                                </Box>

                                <Box sx={{ mb: 2 }}>
                                    <Typography sx={{ mb: 1, color: '#121212', fontWeight: 400, fontSize: '14px' }}>
                                        No. of Bathrooms
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        name="number_of_bathrooms"
                                        value={roomForm.number_of_bathrooms}
                                        onChange={handleRoomInputChange}
                                        placeholder="e.g : 1"
                                        variant="outlined"
                                        size="small"
                                        error={!!roomErrors.number_of_bathrooms}
                                        helperText={roomErrors.number_of_bathrooms}
                                        type="number"
                                    />
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
                                        type="submit"
                                        variant="contained"
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
                                        Save
                                    </Button>
                                </Box>
                            </Box>
                        </Paper>
                    </Box>
                </div>
            {/* </div> */}
        </>
    );
};

export default EditRoom;
