import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import {
    TextField,
    Button,
    Typography,
    Box,
    Paper,
    InputAdornment,
    Select,
    MenuItem,
    FormControl
} from '@mui/material';
import {
    ArrowBack as ArrowBackIcon,
    KeyboardArrowDown as KeyboardArrowDownIcon
} from '@mui/icons-material';
import { router } from '@inertiajs/react';

const AddGuestInformation = () => {
    // const [open, setOpen] = useState(true);
    // State for form fields
    const [formData, setFormData] = useState({
        guestName: '',
        phone: '',
        clubName: '',
        authorizedBy: '',
        checkInDate: '',
        checkInTime: ''
    });

    // Handle input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    // Handle form submission
    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Form submitted:', formData);
        // Add your form submission logic here
    };

    return (
        <>
            {/* <SideNav open={open} setOpen={setOpen} />
            <div
                style={{
                    marginLeft: open ? `${drawerWidthOpen}px` : `${drawerWidthClosed}px`,
                    transition: 'margin-left 0.3s ease-in-out',
                    marginTop: '5rem',
                    backgroundColor: '#F6F6F6',
                }}
            > */}
                <div style={{
                    fontFamily: 'Arial, sans-serif',
                    padding: '20px',
                    backgroundColor: '#f5f5f5',
                    minHeight: '100vh'
                }}>
                    {/* Header with back button and title */}
                    <div className="d-flex align-items-center mb-4">
                        <ArrowBackIcon style={{
                            cursor: 'pointer',
                            marginRight: '10px',
                            color: '#555',
                            fontSize: '24px'
                        }} />
                        <Typography variant="h5" style={{
                            fontWeight: 500,
                            color: '#333',
                            fontSize: '24px'
                        }}>
                            Add Guest Information
                        </Typography>
                    </div>

                    {/* Form Card */}
                    <Paper
                        elevation={1}
                        style={{
                            maxWidth: '630px',
                            margin: '0 auto',
                            padding: '30px',
                            borderRadius: '4px'
                        }}
                    >
                        <form onSubmit={handleSubmit}>
                            {/* Guest Name */}
                            <Box mb={3}>
                                <Typography
                                    variant="body1"
                                    style={{
                                        marginBottom: '8px',
                                        color: '#333',
                                        fontSize: '14px',
                                        fontWeight: 500
                                    }}
                                >
                                    Guest Name
                                </Typography>
                                <TextField
                                    fullWidth
                                    name="guestName"
                                    value={formData.guestName}
                                    onChange={handleChange}
                                    placeholder="e.g. Zahid Ullah"
                                    variant="outlined"
                                    size="small"
                                    style={{ marginBottom: '8px' }}
                                    InputProps={{
                                        style: { fontSize: '14px' }
                                    }}
                                />
                            </Box>

                            {/* Phone */}
                            <Box mb={3}>
                                <Typography
                                    variant="body1"
                                    style={{
                                        marginBottom: '8px',
                                        color: '#333',
                                        fontSize: '14px',
                                        fontWeight: 500
                                    }}
                                >
                                    Phone
                                </Typography>
                                <TextField
                                    fullWidth
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="e.g. 03645374563"
                                    variant="outlined"
                                    size="small"
                                    style={{ marginBottom: '8px' }}
                                    InputProps={{
                                        style: { fontSize: '14px' }
                                    }}
                                />
                            </Box>

                            {/* Club Name */}
                            <Box mb={3}>
                                <Typography
                                    variant="body1"
                                    style={{
                                        marginBottom: '8px',
                                        color: '#333',
                                        fontSize: '14px',
                                        fontWeight: 500
                                    }}
                                >
                                    Club Name
                                </Typography>
                                <TextField
                                    fullWidth
                                    name="clubName"
                                    value={formData.clubName}
                                    onChange={handleChange}
                                    placeholder="e.g. Airforce Club"
                                    variant="outlined"
                                    size="small"
                                    style={{ marginBottom: '8px' }}
                                    InputProps={{
                                        style: { fontSize: '14px' }
                                    }}
                                />
                            </Box>

                            {/* Authorized By */}
                            <Box mb={3}>
                                <Typography
                                    variant="body1"
                                    style={{
                                        marginBottom: '8px',
                                        color: '#333',
                                        fontSize: '14px',
                                        fontWeight: 500
                                    }}
                                >
                                    Authorized By
                                </Typography>
                                <FormControl fullWidth size="small">
                                    <TextField
                                        select
                                        fullWidth
                                        name="authorizedBy"
                                        value={formData.authorizedBy}
                                        onChange={handleChange}
                                        placeholder="e.g. Select member from list type name / ID"
                                        variant="outlined"
                                        size="small"
                                        style={{ marginBottom: '8px' }}
                                        SelectProps={{
                                            displayEmpty: true,
                                            renderValue: (selected) => {
                                                if (!selected) {
                                                    return <span style={{ color: '#757575', fontSize: '14px' }}>e.g. Select member from list type name / ID</span>;
                                                }
                                                return selected;
                                            },
                                            IconComponent: KeyboardArrowDownIcon
                                        }}
                                        InputProps={{
                                            style: { fontSize: '14px' }
                                        }}
                                    >
                                        <MenuItem value="">
                                            <em>None</em>
                                        </MenuItem>
                                        <MenuItem value="Member 1">Member 1</MenuItem>
                                        <MenuItem value="Member 2">Member 2</MenuItem>
                                        <MenuItem value="Member 3">Member 3</MenuItem>
                                    </TextField>
                                </FormControl>
                            </Box>

                            {/* Check-In Date and Time */}
                            <Box mb={4} className="d-flex gap-3">
                                <div style={{ flex: 1 }}>
                                    <Typography
                                        variant="body1"
                                        style={{
                                            marginBottom: '8px',
                                            color: '#333',
                                            fontSize: '14px',
                                            fontWeight: 500
                                        }}
                                    >
                                        Check-In Date
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        name="checkInDate"
                                        type="date"
                                        value={formData.checkInDate}
                                        onChange={handleChange}
                                        placeholder="Default"
                                        variant="outlined"
                                        size="small"
                                        InputProps={{
                                            style: { fontSize: '14px' }
                                        }}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <Typography
                                        variant="body1"
                                        style={{
                                            marginBottom: '8px',
                                            color: '#333',
                                            fontSize: '14px',
                                            fontWeight: 500
                                        }}
                                    >
                                        Check-In Time
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        name="checkInTime"
                                        type="time"
                                        value={formData.checkInTime}
                                        onChange={handleChange}
                                        placeholder="Default"
                                        variant="outlined"
                                        size="small"
                                        InputProps={{
                                            style: { fontSize: '14px' }
                                        }}
                                    />
                                </div>
                            </Box>
                            {/* Action Buttons */}
                            <Box className="d-flex justify-content-end">
                                <Button
                                    variant="text"
                                    style={{
                                        marginRight: '10px',
                                        color: '#333',
                                        textTransform: 'none',
                                        fontSize: '14px'
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    style={{
                                        backgroundColor: '#063455',
                                        color: 'white',
                                        textTransform: 'none',
                                        fontSize: '14px',
                                        padding: '6px 16px'
                                    }}
                                >
                                    Save
                                </Button>
                            </Box>
                        </form>
                    </Paper>
                </div>
            {/* </div> */}
        </>
    );
};

export default AddGuestInformation;