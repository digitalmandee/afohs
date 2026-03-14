import { useState } from 'react';
import { Box, Typography, TextField, Button, Radio, RadioGroup, FormControlLabel, Paper, Grid, Select, MenuItem, InputAdornment, FormControl, IconButton } from '@mui/material';
import { Add, ArrowBack } from '@mui/icons-material';

const AddNewKitchen = () => {
    // const [open, setOpen] = useState(true);

    return (
        <>
            {/* <SideNav open={open} setOpen={setOpen} /> */}
            <div
                style={{
                    minHeight: '100vh',
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', ml: 3, pt: 2 }}>
                    <IconButton style={{ color: '#063455' }} onClick={() => window.history.back()}>
                        <ArrowBack />
                    </IconButton>
                    <h2 className="mb-0 fw-normal" style={{ color: '#063455', fontSize: '30px', fontWeight: 500 }}>
                        Add New Kitchen
                    </h2>
                </Box>
                <Box sx={{ maxWidth: 600, mx: 'auto', px: 3, py: 5, border: '1px solid #E3E3E3', bgcolor: '#FFFFFF' }}>
                    {/* <Paper elevation={0} sx={{ px: 3, borderRadius: 1 }}> */}
                    <Grid container spacing={2}>
                        {/* Profile Picture */}
                        <Grid item xs={12}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                {/* Upload Box */}
                                <Box
                                    sx={{
                                        width: 80,
                                        height: 80,
                                        border: '1px dashed #063455',
                                        borderRadius: 1,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        bgcolor: '#B0DEFF',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <Add sx={{ color: '#063455', fontSize: 20 }} />
                                </Box>

                                {/* Text content next to box */}
                                <Box
                                    sx={{
                                        mt: -5,
                                    }}
                                >
                                    <Typography variant="body2" sx={{ color: '#121212', fontWeight: 500 }}>
                                        Profile Picture
                                    </Typography>
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            color: '#7F7F7F',
                                            fontWeight: 400,
                                            mt: 0.5,
                                            fontSize: '14px',
                                        }}
                                    >
                                        Click upload to change profile picture (4 MB max)
                                    </Typography>
                                </Box>
                            </Box>
                        </Grid>

                        {/* Employee Name */}
                        <Grid item xs={12}>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                                Kitchen Name
                            </Typography>
                            <TextField
                                fullWidth
                                placeholder="Enter Kitchen"
                                InputProps={{
                                    sx: {
                                        height: 40,
                                        '& input': {
                                            height: 40,
                                            padding: '0 14px',
                                            boxSizing: 'border-box',
                                        },
                                    },
                                }}
                            />
                        </Grid>

                        {/* Department */}
                        <Grid item xs={12}>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                                Item
                            </Typography>
                            <TextField
                                fullWidth
                                placeholder="Enter Item"
                                InputProps={{
                                    sx: {
                                        height: 40,
                                        '& input': {
                                            height: 40,
                                            padding: '0 14px',
                                            boxSizing: 'border-box',
                                        },
                                    },
                                }}
                            />
                        </Grid>

                        {/* Action Buttons */}
                        <Grid item xs={12}>
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, gap: 2 }}>
                                <Button variant="text" sx={{ color: '#666' }}>
                                    Cancel
                                </Button>
                                <Button
                                    variant="contained"
                                    sx={{
                                        bgcolor: '#0a3d62',
                                        '&:hover': { bgcolor: '#0c2461' },
                                    }}
                                >
                                    Create
                                </Button>
                            </Box>
                        </Grid>
                    </Grid>
                    {/* </Paper> */}
                </Box>
            </div>
        </>
    );
};
export default AddNewKitchen;
