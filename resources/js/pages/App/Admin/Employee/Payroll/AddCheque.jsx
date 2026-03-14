import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import {
    TextField,
    Button,
    Typography,
    Box,
    Paper,
} from '@mui/material'
import {
    ArrowBack as ArrowBackIcon,
    KeyboardArrowDown as KeyboardArrowDownIcon
} from '@mui/icons-material';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';

const AddEmployeeCheque = () => {
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
                            color: '#063455',
                            fontSize: '24px',
                        }}
                            onClick={() => window.history.back()}
                        />
                        <Typography variant="h5" style={{
                            fontWeight: 500,
                            color: '#063455',
                            fontSize: '30px'
                        }}>
                            Add Cheque
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
                            <Box mb={2}>
                                <Typography
                                    variant="body1"
                                    style={{
                                        marginBottom: '8px',
                                        color: '#121212',
                                        fontSize: '14px',
                                        fontWeight: 500
                                    }}
                                >
                                    Employee Name
                                </Typography>
                                <TextField
                                    fullWidth
                                    name="guestName"
                                    value={formData.guestName}
                                    onChange={handleChange}
                                    placeholder="e.g. Micheal Douglas"
                                    variant="outlined"
                                    size="small"
                                    style={{ marginBottom: '8px' }}
                                    InputProps={{
                                        style: { fontSize: '14px' }
                                    }}
                                />
                            </Box>

                            <Box mb={2}>
                                <Typography
                                    variant="body1"
                                    style={{
                                        marginBottom: '8px',
                                        color: '#121212',
                                        fontSize: '14px',
                                        fontWeight: 500
                                    }}
                                >
                                    Amount
                                </Typography>
                                <TextField
                                    fullWidth
                                    name="guestName"
                                    value={formData.guestName}
                                    onChange={handleChange}
                                    placeholder="Enter Amount"
                                    variant="outlined"
                                    size="small"
                                    style={{ marginBottom: '8px' }}
                                    InputProps={{
                                        style: { fontSize: '14px' }
                                    }}
                                />
                            </Box>

                            <Box mb={2}>
                                <Typography
                                    variant="body1"
                                    style={{
                                        marginBottom: '8px',
                                        color: '#121212',
                                        fontSize: '14px',
                                        fontWeight: 500
                                    }}
                                >
                                    Cheque Number
                                </Typography>
                                <TextField
                                    fullWidth
                                    name="guestName"
                                    value={formData.guestName}
                                    onChange={handleChange}
                                    placeholder="Enter Cheque Number"
                                    variant="outlined"
                                    size="small"
                                    style={{ marginBottom: '8px' }}
                                    InputProps={{
                                        style: { fontSize: '14px' }
                                    }}
                                />
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

export default AddEmployeeCheque;