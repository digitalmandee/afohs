import { router } from '@inertiajs/react';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import { Box, Button, Container, Dialog, Divider, Grid, IconButton, InputAdornment, TextField, Typography } from '@mui/material';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useState } from 'react';

// const drawerWidthOpen = 240;
// const drawerWidthClosed = 110;

const BookingDetail = () => {
    // const [open, setOpen] = useState(true);
    const [openPrice, setOpenPrice] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const handleClickOpen = () => {
        setOpenPrice(true);
    };

    const handleClose = () => {
        setOpenPrice(false);
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        // Add your search functionality here
        console.log('Searching for:', e.target.value);
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
                <Container sx={{ px: 4, py: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 4 }}>
                        <IconButton edge="start" sx={{ mr: 1 }} onClick={() => router.visit(route('rooms.dashboard'))}>
                            <ArrowBackIcon />
                        </IconButton>
                        <Typography variant="body1" sx={{ fontWeight: 500, fontSize: '30px', color: '#063455' }}>
                            Booking Detail
                        </Typography>
                    </Box>
                    <Box
                        sx={{
                            margin: '0 auto',
                            maxWidth: '600px',
                            bgcolor: '#FFFFFF',
                            borderRadius: '4px',
                        }}
                    >
                        <Box
                            sx={{
                                px: 2,
                                py: 2,
                            }}
                        >
                            <Box sx={{ p: 2, bgcolor: '#F6F6F6', border: '1px solid #E3E3E3', borderRadius: '4px' }}>
                                <Typography variant="body2" sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '16px' }}>
                                    Booking ID: <span style={{ color: '#063455', fontWeight: 700, fontSize: '16px' }}>ROMG2323</span>
                                </Typography>
                            </Box>
                            <Grid container spacing={3} sx={{ py: 2, px: 0.5 }}>
                                <Grid item xs={3}>
                                    <Typography variant="body2" sx={{ color: '#121212', mb: 2, fontSize: '14px', fontWeight: 400 }}>
                                        Check In
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 400, fontSize: '14px', color: '#7F7F7F' }}>
                                        20th March 2023
                                    </Typography>
                                </Grid>
                                <Grid item xs={3}>
                                    <Typography variant="body2" sx={{ color: '#121212', mb: 2, fontSize: '14px', fontWeight: 400 }}>
                                        Check Out
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 400, fontSize: '14px', color: '#7F7F7F' }}>
                                        25th March 2023
                                    </Typography>
                                </Grid>
                                <Grid item xs={3}>
                                    <Typography variant="body2" sx={{ color: '#121212', mb: 2, fontSize: '14px', fontWeight: 400 }}>
                                        Total Nights
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 400, fontSize: '14px', color: '#7F7F7F' }}>
                                        5
                                    </Typography>
                                </Grid>
                                <Grid item xs={3}>
                                    <Typography variant="body2" sx={{ color: '#121212', mb: 2, fontSize: '14px', fontWeight: 400 }}>
                                        Rooms
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 400, fontSize: '14px', color: '#7F7F7F' }}>
                                        1
                                    </Typography>
                                </Grid>
                            </Grid>

                            <Grid container spacing={3} sx={{ py: 2, px: 0.5, pt: 0 }}>
                                <Grid item xs={4}>
                                    <Typography variant="body2" sx={{ color: '#121212', mb: 2, fontSize: '14px', fontWeight: 400 }}>
                                        Adults
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 400, fontSize: '14px', color: '#7F7F7F' }}>
                                        1
                                    </Typography>
                                </Grid>
                                <Grid item xs={4}>
                                    <Typography variant="body2" sx={{ color: '#121212', mb: 2, fontSize: '14px', fontWeight: 400 }}>
                                        Children
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 400, fontSize: '14px', color: '#7F7F7F' }}>
                                        0
                                    </Typography>
                                </Grid>
                                <Grid item xs={4}>
                                    <Typography variant="body2" sx={{ color: '#121212', mb: 2, fontSize: '14px', fontWeight: 400 }}>
                                        Infants
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 400, fontSize: '14px', color: '#7F7F7F' }}>
                                        0
                                    </Typography>
                                </Grid>
                            </Grid>
                        </Box>

                        <Box sx={{ p: 2, pt: 0 }}>
                            <Box sx={{ p: 2, bgcolor: '#F6F6F6', border: '1px solid #E3E3E3', borderRadius: '4px' }}>
                                <Typography variant="body1" sx={{ fontWeight: 700, fontSize: '16px', color: '#063455' }}>
                                    Customer Detail
                                </Typography>
                            </Box>
                            <Grid
                                container
                                spacing={2}
                                sx={{
                                    px: 0.5,
                                    mt: 0,
                                }}
                            >
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 400, fontSize: '14px', color: '#121212' }}>
                                        Customer Name
                                    </Typography>
                                    <TextField fullWidth size="small" placeholder="Please input" variant="outlined" sx={{ mb: 2 }} />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 400, fontSize: '14px', color: '#121212' }}>
                                        Phone Number
                                    </Typography>
                                    <TextField fullWidth size="small" placeholder="000-000-000-0" variant="outlined" sx={{ mb: 2 }} />
                                </Grid>
                                <Grid item xs={12} sm={6} sx={{ mt: -2 }}>
                                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 400, fontSize: '14px', color: '#121212' }}>
                                        Email
                                    </Typography>
                                    <TextField fullWidth size="small" placeholder="dummy@email.com" variant="outlined" sx={{ mb: 2 }} />
                                </Grid>
                                <Grid item xs={12} sm={6} sx={{ mt: -2 }}>
                                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 400, fontSize: '14px', color: '#121212' }}>
                                        Phone Number
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        placeholder="000 000 000 000"
                                        variant="outlined"
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <Box
                                                        component="span"
                                                        sx={{
                                                            borderRight: '1px solid #ccc',
                                                            // borderRadius: "4px",
                                                            px: 1,
                                                            py: 1.1,
                                                            ml: -2,
                                                            fontSize: '0.75rem',
                                                        }}
                                                    >
                                                        +92
                                                    </Box>
                                                </InputAdornment>
                                            ),
                                        }}
                                        sx={{ mb: 2 }}
                                    />
                                </Grid>
                            </Grid>
                        </Box>

                        <Box
                            sx={{
                                mx: 2,
                                mb: 2,
                                border: '1px solid #E3E3E3',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                bgcolor: '#F6F6F6',
                            }}
                            onClick={handleClickOpen}
                        >
                            <Box
                                sx={{
                                    p: 2,
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <img
                                        src="/assets/price-tag.png"
                                        alt=""
                                        style={{
                                            width: 32,
                                            height: 32,
                                        }}
                                    />
                                    <Box
                                        sx={{
                                            ml: 2,
                                        }}
                                    >
                                        <Typography sx={{ fontWeight: 500, fontSize: '16px', color: '#121212' }}>Price Detail</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 400, fontSize: '14px', color: '#7F7F7F' }}>
                                            View total price details
                                        </Typography>
                                    </Box>
                                </Box>
                                <KeyboardArrowRightIcon />
                            </Box>
                        </Box>

                        <Box sx={{ display: 'flex', justifyContent: 'end', gap: '10px', mt: 4, px: 2, pb: 4 }}>
                            <Button
                                variant="outlined"
                                sx={{
                                    px: 4,
                                    borderColor: '#ccc',
                                    color: '#333',
                                    textTransform: 'none',
                                    '&:hover': {
                                        borderColor: '#999',
                                        backgroundColor: 'transparent',
                                    },
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="contained"
                                sx={{
                                    px: 4,
                                    bgcolor: '#063455',
                                    '&:hover': {
                                        bgcolor: '#002244',
                                    },
                                    textTransform: 'none',
                                }}
                            >
                                Save Change
                            </Button>
                        </Box>
                        {/* Price Detail Modal */}
                        <Dialog
                            open={openPrice}
                            onClose={handleClose}
                            maxWidth="sm"
                            fullWidth
                            PaperProps={{
                                sx: {
                                    position: 'absolute',
                                    right: 10,
                                    top: 10,
                                    // bottom: 0,
                                    m: 0,
                                    height: 'calc(100% - 100px)',
                                    // maxHeight: "100%",
                                    borderRadius: 0,
                                },
                            }}
                        >
                            <Typography sx={{ px: 3, mt: 2, fontWeight: 500, fontSize: '32px', color: '#121212' }}>Price Detail</Typography>
                            <Box sx={{ px: 3, pt: 2 }}>
                                <Box sx={{ p: 2, bgcolor: '#F6F6F6', border: '1px solid #E3E3E3', borderRadius: '4px' }}>
                                    <Typography variant="body1" sx={{ color: '#666' }}>
                                        Hotel : <span style={{ color: '#063455', fontWeight: 'bold' }}>Afohs Club</span>
                                    </Typography>
                                </Box>
                                <Box
                                    sx={{
                                        pt: 2,
                                    }}
                                >
                                    <Typography sx={{ fontWeight: 700, fontSize: '14px', color: '#121212' }}>Sub Total</Typography>

                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 1 }}>
                                        <Typography
                                            sx={{
                                                fontWeight: 500,
                                                fontSize: '14px',
                                                color: '#121212',
                                            }}
                                        >
                                            Room Price
                                        </Typography>
                                        <Typography
                                            sx={{
                                                fontWeight: 400,
                                                fontSize: '14px',
                                                color: '#121212',
                                            }}
                                        >
                                            Rs 20,10
                                        </Typography>
                                    </Box>

                                    <Divider
                                        sx={{
                                            pt: 2,
                                            borderBottomWidth: '2px', // controls thickness
                                            borderColor: '#E3E3E3',
                                        }}
                                    />

                                    <Typography sx={{ fontWeight: 700, fontSize: '14px', color: '#121212', pt: 2 }}>Extra</Typography>

                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 1 }}>
                                        <Typography
                                            sx={{
                                                fontWeight: 500,
                                                fontSize: '14px',
                                                color: '#121212',
                                            }}
                                        >
                                            Service Fees
                                        </Typography>
                                        <Typography
                                            sx={{
                                                fontWeight: 500,
                                                fontSize: '14px',
                                                color: '#121212',
                                            }}
                                        >
                                            Rs 100
                                        </Typography>
                                    </Box>

                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 1 }}>
                                        <Typography
                                            sx={{
                                                fontWeight: 500,
                                                fontSize: '14px',
                                                color: '#121212',
                                            }}
                                        >
                                            Payment Charges
                                        </Typography>
                                        <Typography
                                            sx={{
                                                fontWeight: 500,
                                                fontSize: '14px',
                                                color: '#121212',
                                            }}
                                        >
                                            Rs 100
                                        </Typography>
                                    </Box>

                                    <Divider
                                        sx={{
                                            pt: 2,
                                            borderBottomWidth: '2px', // controls thickness
                                            borderColor: '#E3E3E3',
                                        }}
                                    />

                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography sx={{ fontWeight: 700, fontSize: '14px', color: '#121212', pt: 2 }}>Total</Typography>
                                        <Typography sx={{ fontWeight: 700, fontSize: '14px', color: '#121212', pt: 2 }}>Rs 5,110</Typography>
                                    </Box>

                                    <Divider
                                        sx={{
                                            pt: 2,
                                            borderBottomWidth: '2px', // controls thickness
                                            borderColor: '#E3E3E3',
                                        }}
                                    />
                                </Box>

                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 5 }}>
                                    <Button
                                        variant="outlined"
                                        onClick={handleClose}
                                        sx={{
                                            mr: 2,
                                            px: 4,
                                            borderColor: '#ccc',
                                            color: '#333',
                                            textTransform: 'none',
                                            '&:hover': {
                                                borderColor: '#999',
                                                backgroundColor: 'transparent',
                                            },
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        variant="contained"
                                        sx={{
                                            px: 4,
                                            bgcolor: '#063455',
                                            '&:hover': {
                                                bgcolor: '#002244',
                                            },
                                            textTransform: 'none',
                                        }}
                                    >
                                        Continue
                                    </Button>
                                </Box>
                            </Box>
                        </Dialog>
                    </Box>
                </Container>
            {/* </div> */}
        </>
    );
};

export default BookingDetail;
