import React, { useState } from "react";
import { Grid, Typography, MenuItem, Divider, TextField, Box } from "@mui/material";

const PersonalDetails = () => {
    const [personalDetails, setPersonalDetails] = useState({
        employee_name: "Jhon Doe",
        employee_id: "",
        address: null,
        emergency_no: null,
        gender: "male",
        marital_status: "single",
        national_id: null,
        account_no: null,
        salary: 0,
        joining_date: "",
        user: {
            name: "",
            email: "",
            designation: "",
            phone_no: "",
        },
        department: {
            name: "",
        },
    });

    return (
        <>
            <Box sx={{
                px: 2
            }}>
                <Box sx={{
                    width: '100%',
                    bgcolor: '#E3E3E3',
                    height: '52px',
                    px: 2,
                    py: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    mt: 2
                }}>
                    <Typography sx={{
                        color: '#063455',
                        fontWeight: 700,
                        fontSize: '16px'
                    }}>
                        Personal Detail
                    </Typography>
                </Box>
                <Grid
                    container
                    spacing={2}
                    style={{
                        marginTop: "0.5rem",
                        marginBottom: "1rem"
                    }}>
                    <Grid item xs={12} md={6}>
                        <Typography sx={{
                            color: '#121212',
                            fontWeight: 400,
                            fontSize: '14px'
                        }}>
                            Employee Name
                        </Typography>
                        <TextField fullWidth value={personalDetails.employee_name}
                            onChange={(e) =>
                                setPersonalDetails({ ...personalDetails, employee_name: e.target.value })
                            } sx={{
                                mt: 1,
                                '& .MuiInputBase-root': {
                                    height: 40,
                                },
                                '& .MuiInputBase-input': {
                                    padding: '0 14px',
                                },
                            }} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Typography sx={{
                            color: '#121212',
                            fontWeight: 400,
                            fontSize: '14px'
                        }}>
                            Employee ID
                        </Typography>
                        <TextField fullWidth value={personalDetails.employee_id}
                            onChange={(e) => setPersonalDetails({ ...personalDetails, employee_id: e.target.value })}
                            sx={{
                                mt: 1,
                                '& .MuiInputBase-root': {
                                    height: 40,
                                },
                                '& .MuiInputBase-input': {
                                    padding: '0 14px',
                                },
                            }} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Typography sx={{
                            color: '#121212',
                            fontWeight: 400,
                            fontSize: '14px'
                        }}>
                            National ID
                        </Typography>
                        <TextField fullWidth value={personalDetails.national_id}
                            onChange={(e) => setPersonalDetails({ ...personalDetails, national_id: e.target.value })}
                            sx={{
                                mt: 1,
                                '& .MuiInputBase-root': {
                                    height: 40,
                                },
                                '& .MuiInputBase-input': {
                                    padding: '0 14px',
                                },
                            }} />
                    </Grid>

                    {/* Bank Account Number */}
                    <Grid item xs={12} md={6}>
                        <Typography sx={{
                            color: '#121212',
                            fontWeight: 400,
                            fontSize: '14px'
                        }}>
                            Bank Account Number
                        </Typography>
                        <TextField fullWidth value={personalDetails.account_no}
                            onChange={(e) => setPersonalDetails({ ...personalDetails, account_no: e.target.value })}
                            sx={{
                                mt: 1,
                                '& .MuiInputBase-root': {
                                    height: 40,
                                },
                                '& .MuiInputBase-input': {
                                    padding: '0 14px',
                                },
                            }}
                        />
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <Typography
                            sx={{
                                color: '#121212',
                                fontWeight: 400,
                                fontSize: '14px',
                            }}
                        >
                            Gender
                        </Typography>
                        <TextField
                            select
                            name="gender"
                            value={personalDetails.gender}
                            onChange={(e) =>
                                setPersonalDetails({ ...personalDetails, gender: e.target.value })
                            }
                            sx={{
                                mt: 2,
                                width: '275px',
                                '& .MuiInputBase-root': {
                                    height: 40,
                                },
                                '& .MuiSelect-select': {
                                    paddingY: '10px',
                                },
                            }}
                        >
                            <MenuItem value="">Select Gender</MenuItem>
                            <MenuItem value="male">Male</MenuItem>
                            <MenuItem value="female">Female</MenuItem>
                        </TextField>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Typography sx={{
                            color: '#121212',
                            fontWeight: 400,
                            fontSize: '14px'
                        }}>
                            Marital Status
                        </Typography>
                        <TextField select name="gender" value={personalDetails.marital_status}
                            onChange={(e) => setPersonalDetails({ ...personalDetails, marital_status: e.target.value })}
                            sx={{
                                mt: 2,
                                width: '275px',
                                '& .MuiInputBase-root': {
                                    height: 40,
                                },
                                '& .MuiSelect-select': {
                                    paddingY: '10px', // Vertically center text
                                },
                            }}
                        >
                            <MenuItem value="">Select</MenuItem>
                            <MenuItem value="single">Single</MenuItem>
                            <MenuItem value="married">Married</MenuItem>
                            <MenuItem value="divorced">Divorced</MenuItem>
                            <MenuItem value="widowed">Widowed</MenuItem>
                        </TextField>
                    </Grid>

                    <Grid item xs={12}>
                        <Box sx={{
                            width: '100%',
                            bgcolor: '#E3E3E3',
                            height: '52px',
                            px: 2,
                            py: 1.5,
                            display: 'flex',
                            alignItems: 'center',
                            mt: 2
                        }}>
                            <Typography sx={{
                                color: '#063455',
                                fontWeight: 700,
                                fontSize: '16px'
                            }}>
                                Contact Detail
                            </Typography>
                        </Box>
                    </Grid>

                    {/* Email */}
                    <Grid item xs={12} md={6}>
                        <Typography sx={{
                            color: '#121212',
                            fontWeight: 400,
                            fontSize: '14px'
                        }}>
                            Email
                        </Typography>
                        <TextField fullWidth value={personalDetails.user.email}
                            onChange={(e) =>
                                setPersonalDetails({
                                    ...personalDetails,
                                    user: { ...personalDetails.user, email: e.target.value },
                                })
                            }
                            sx={{
                                mt: 1,
                                '& .MuiInputBase-root': {
                                    height: 40,
                                },
                                '& .MuiInputBase-input': {
                                    padding: '0 14px',
                                },
                            }} />
                    </Grid>

                    {/* Contact Number */}
                    <Grid item xs={12} md={6}>
                        <Typography sx={{
                            color: '#121212',
                            fontWeight: 400,
                            fontSize: '14px'
                        }}>
                            Contact Number
                        </Typography>
                        <TextField fullWidth value={personalDetails.user.phone_no}
                            onChange={(e) =>
                                setPersonalDetails({
                                    ...personalDetails,
                                    user: { ...personalDetails.user, phone_no: e.target.value },
                                })
                            } sx={{
                                mt: 1,
                                '& .MuiInputBase-root': {
                                    height: 40,
                                },
                                '& .MuiInputBase-input': {
                                    padding: '0 14px',
                                },
                            }} />
                    </Grid>

                    {/* Emergency Contact */}
                    <Grid item xs={12} md={6}>
                        <Typography sx={{
                            color: '#121212',
                            fontWeight: 400,
                            fontSize: '14px'
                        }}>
                            Emergency Number
                        </Typography>
                        <TextField fullWidth value={personalDetails.emergency_no}
                            onChange={(e) => setPersonalDetails({ ...personalDetails, emergency_no: e.target.value })}
                            sx={{
                                mt: 1,
                                '& .MuiInputBase-root': {
                                    height: 40,
                                },
                                '& .MuiInputBase-input': {
                                    padding: '0 14px',
                                },
                            }}
                        />
                    </Grid>

                    <Divider sx={{ backgroundColor: "black", height: 5, marginTop: 1 }} />

                    {/* Address (Full width to avoid cramping) */}
                    <Grid item xs={12} md={6}>
                        <Typography sx={{
                            color: '#121212',
                            fontWeight: 400,
                            fontSize: '14px'
                        }}>
                            Address
                        </Typography>
                        <TextField fullWidth value={personalDetails.address}
                            onChange={(e) => setPersonalDetails({ ...personalDetails, address: e.target.value })}
                            sx={{
                                mt: 1,
                                '& .MuiInputBase-root': {
                                    height: 40,
                                },
                                '& .MuiInputBase-input': {
                                    padding: '0 14px',
                                },
                            }}
                        />
                    </Grid>
                </Grid>
            </Box>
        </>
    );
};

export default PersonalDetails;
