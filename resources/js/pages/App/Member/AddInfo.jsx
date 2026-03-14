import SideNav from '@/components/App/SideBar/SideNav';
import { router } from '@inertiajs/react';
import { Add, ArrowBack, Close, LocationOn } from '@mui/icons-material';
import { Box, Button, Chip, FormControlLabel, Grid, IconButton, MenuItem, Paper, Radio, RadioGroup, Select, TextField, Typography } from '@mui/material';
import { useState } from 'react';

const drawerWidthOpen = 240;
const drawerWidthClosed = 110;

export default function CustomerInformationForm() {
    const [open, setOpen] = useState(true);
    const [customerType, setCustomerType] = useState('silver');
    const [selectedType, setSelectedType] = useState('apartment');

    return (
        <>
            <SideNav open={open} setOpen={setOpen} />
            <div
                style={{
                    marginLeft: open ? `${drawerWidthOpen}px` : `${drawerWidthClosed}px`,
                    transition: 'margin-left 0.3s ease-in-out',
                    marginTop: '5rem',
                }}
            >
                <Box sx={{ maxWidth: 800, mx: 'auto', p: 3, bgcolor: '#f9f9f9', minHeight: '100vh' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        <IconButton sx={{ mr: 1 }} onClick={() => router.visit('/members')}>
                            <ArrowBack />
                        </IconButton>
                        <Typography variant="h5" component="h1" sx={{ color: '#2e4052', fontWeight: 500 }}>
                            Add Customer Information
                        </Typography>
                    </Box>

                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <Paper sx={{ p: 3, mb: 3 }}>
                                <Box sx={{ mb: 3 }}>
                                    <Typography variant="body2" sx={{ mb: 1, color: '#666' }}>
                                        Member Id
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        disabled
                                        defaultValue="MEMBER520"
                                        InputProps={{
                                            sx: { bgcolor: '#f5f5f5' },
                                        }}
                                    />
                                </Box>

                                <Box sx={{ mb: 3 }}>
                                    <Typography variant="body2" sx={{ mb: 1 }}>
                                        Profile Picture
                                    </Typography>
                                    <Box
                                        sx={{
                                            width: 84,
                                            height: 84,
                                            border: '1px dashed #a0d2eb',
                                            borderRadius: 1,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            bgcolor: '#e6f4ff',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        <Add sx={{ color: '#a0d2eb' }} />
                                        <Typography variant="caption" sx={{ color: '#999', mt: 0.5, fontSize: '10px', textAlign: 'center', px: 1 }}>
                                            Click upload to change profile picture (4 MB max)
                                        </Typography>
                                    </Box>
                                </Box>

                                <Box sx={{ mb: 3 }}>
                                    <Typography variant="body2" sx={{ mb: 1 }}>
                                        Customer Type
                                    </Typography>
                                    <RadioGroup row value={customerType} onChange={(e) => setCustomerType(e.target.value)}>
                                        <FormControlLabel
                                            value="silver"
                                            control={<Radio />}
                                            label={
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <Box component="span" sx={{ mr: 1, display: 'inline-flex' }}>
                                                        🥈
                                                    </Box>
                                                    <Typography>Silver</Typography>
                                                </Box>
                                            }
                                        />
                                        <FormControlLabel
                                            value="gold"
                                            control={<Radio />}
                                            label={
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <Box component="span" sx={{ mr: 1, display: 'inline-flex' }}>
                                                        🏆
                                                    </Box>
                                                    <Typography>Gold</Typography>
                                                </Box>
                                            }
                                        />
                                    </RadioGroup>
                                </Box>

                                <Box sx={{ mb: 3 }}>
                                    <Typography variant="body2" sx={{ mb: 1 }}>
                                        Customer Name
                                    </Typography>
                                    <TextField fullWidth placeholder="e.g. Dianne Russell" />
                                </Box>

                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="body2" sx={{ mb: 1 }}>
                                            Email
                                        </Typography>
                                        <TextField fullWidth placeholder="e.g. dianne.russell@gmail.com" />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="body2" sx={{ mb: 1 }}>
                                            Phone Number
                                        </Typography>
                                        <Box sx={{ display: 'flex' }}>
                                            <Select defaultValue="+702" sx={{ width: 100, mr: 1 }}>
                                                <MenuItem value="+702">+702</MenuItem>
                                                <MenuItem value="+1">+1</MenuItem>
                                                <MenuItem value="+44">+44</MenuItem>
                                            </Select>
                                            <TextField fullWidth placeholder="892 000 000 000" />
                                        </Box>
                                    </Grid>
                                </Grid>
                            </Paper>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <Paper sx={{ p: 3, mb: 3, bgcolor: '#e6f4ff', border: '1px solid #a0d2eb', borderRadius: 1 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <LocationOn sx={{ color: '#0072c6', mr: 1 }} />
                                        <Box>
                                            <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                                                Add Address
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: '#666' }}>
                                                Click to add new address for delivery order
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <IconButton>
                                        <Close />
                                    </IconButton>
                                </Box>
                            </Paper>

                            <Paper sx={{ p: 3 }}>
                                <Box sx={{ mb: 3 }}>
                                    <Typography variant="body2" sx={{ mb: 1 }}>
                                        Type
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <Chip
                                            label="House"
                                            onClick={() => handleTypeClick('house')}
                                            sx={{
                                                bgcolor: selectedType === 'house' ? '#e6f4ff' : 'transparent',
                                                border: '1px solid #ccc',
                                                borderColor: selectedType === 'house' ? '#a0d2eb' : '#ccc',
                                                color: selectedType === 'house' ? '#0072c6' : 'inherit',
                                            }}
                                        />
                                        <Chip
                                            label="Apartment"
                                            onClick={() => handleTypeClick('apartment')}
                                            sx={{
                                                bgcolor: selectedType === 'apartment' ? '#e6f4ff' : 'transparent',
                                                border: '1px solid #ccc',
                                                borderColor: selectedType === 'apartment' ? '#a0d2eb' : '#ccc',
                                                color: selectedType === 'apartment' ? '#0072c6' : 'inherit',
                                            }}
                                        />
                                        <Chip
                                            label="Office"
                                            onClick={() => handleTypeClick('office')}
                                            sx={{
                                                bgcolor: selectedType === 'office' ? '#e6f4ff' : 'transparent',
                                                border: '1px solid #ccc',
                                                borderColor: selectedType === 'office' ? '#a0d2eb' : '#ccc',
                                                color: selectedType === 'office' ? '#0072c6' : 'inherit',
                                            }}
                                        />
                                    </Box>
                                </Box>

                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="body2" sx={{ mb: 1 }}>
                                            Country
                                        </Typography>
                                        <Select
                                            fullWidth
                                            displayEmpty
                                            renderValue={(selected) => {
                                                if (!selected) {
                                                    return <Typography sx={{ color: '#999' }}>Select country</Typography>;
                                                }
                                                return selected;
                                            }}
                                        >
                                            <MenuItem value="USA">USA</MenuItem>
                                            <MenuItem value="Canada">Canada</MenuItem>
                                            <MenuItem value="UK">UK</MenuItem>
                                        </Select>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="body2" sx={{ mb: 1 }}>
                                            Province / Street
                                        </Typography>
                                        <Select
                                            fullWidth
                                            displayEmpty
                                            renderValue={(selected) => {
                                                if (!selected) {
                                                    return <Typography sx={{ color: '#999' }}>Select province</Typography>;
                                                }
                                                return selected;
                                            }}
                                        >
                                            <MenuItem value="Hawaii">Hawaii</MenuItem>
                                            <MenuItem value="California">California</MenuItem>
                                            <MenuItem value="New York">New York</MenuItem>
                                        </Select>
                                    </Grid>
                                </Grid>

                                <Grid container spacing={2} sx={{ mt: 1 }}>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="body2" sx={{ mb: 1 }}>
                                            City
                                        </Typography>
                                        <Select
                                            fullWidth
                                            displayEmpty
                                            renderValue={(selected) => {
                                                if (!selected) {
                                                    return <Typography sx={{ color: '#999' }}>Select city</Typography>;
                                                }
                                                return selected;
                                            }}
                                        >
                                            <MenuItem value="Honolulu">Honolulu</MenuItem>
                                            <MenuItem value="Kailua">Kailua</MenuItem>
                                            <MenuItem value="Hilo">Hilo</MenuItem>
                                        </Select>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="body2" sx={{ mb: 1 }}>
                                            Zip Code / Postal Code
                                        </Typography>
                                        <TextField fullWidth placeholder="e.g. 96815" />
                                    </Grid>
                                </Grid>

                                <Box sx={{ mt: 2 }}>
                                    <Typography variant="body2" sx={{ mb: 1 }}>
                                        Full Address / Street
                                    </Typography>
                                    <TextField fullWidth placeholder="e.g. 1901 Thornridge Cir. Shiloh, Hawaii 81063" />
                                </Box>

                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3, gap: 2 }}>
                                    <Button variant="text">Cancel</Button>
                                    <Button
                                        variant="contained"
                                        sx={{
                                            bgcolor: '#0a3d62',
                                            '&:hover': { bgcolor: '#0c2461' },
                                        }}
                                    >
                                        Save Changes
                                    </Button>
                                </Box>
                            </Paper>
                        </Grid>
                    </Grid>
                </Box>
            </div>
        </>
    );
}
CustomerInformationForm.layout = (page) => page;
