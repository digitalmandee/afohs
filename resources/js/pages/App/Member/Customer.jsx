import SideNav from '@/components/App/SideBar/SideNav';
import { FilterAlt, Search } from '@mui/icons-material';
import { Avatar, Box, Button, Drawer, Grid, InputAdornment, Paper, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import badge from '../../../../../public/assets/Badge.png';
import crown from '../../../../../public/assets/Diamond.png';
import guest from '../../../../../public/assets/Guest.png';
import CustomerProfile from './Detail';
import CustomerFilter from './Filter';
import OrderHistory from './History';
// Customer data
const customers = [
    {
        id: 'MEMBER1234',
        name: 'Bessie Cooper',
        avatar: '/assets/userimg.png',
        badge: 'gold',
        favoriteDish: 'Cappuccino Hot Medium Size',
        spent: 'Rs 3,540',
    },
    {
        id: 'MEMBER1242',
        name: 'Dianne Russell',
        avatar: '/assets/userimg.png',
        badge: 'gold',
        favoriteDish: 'Cappuccino Hot Medium Size',
        spent: 'Rs 3,540',
    },
    {
        id: 'MEMBER1244',
        name: 'Robert Fox',
        avatar: '/assets/userimg.png',
        badge: 'gold',
        favoriteDish: 'Cappuccino Hot Medium Size',
        spent: 'Rs 3,540',
    },
    {
        id: 'MEMBER1253',
        name: 'Marvin McKinney',
        avatar: '/assets/userimg.png',
        badge: 'silver',
        favoriteDish: 'Cappuccino Hot Medium Size',
        spent: 'Rs 3,540',
    },
    {
        id: 'MEMBER1262',
        name: 'Savannah Nguyen',
        avatar: '/assets/userimg.png',
        badge: 'gold',
        favoriteDish: 'Cappuccino Hot Medium Size',
        spent: 'Rs 3,540',
    },
    {
        id: 'MEMBER1234',
        name: 'Theresa Webb',
        avatar: '/assets/userimg.png',
        badge: 'gold',
        favoriteDish: 'Cappuccino Hot Medium Size',
        spent: 'Rs 3,540',
    },
    {
        id: 'MEMBER1253',
        name: 'Dianne Russell',
        avatar: '/assets/userimg.png',
        badge: 'silver',
        favoriteDish: 'Cappuccino Hot Medium Size',
        spent: 'Rs 3,540',
    },
    {
        id: 'MEMBER1254',
        name: 'Kristin Watson',
        avatar: '/assets/userimg.png',
        badge: 'silver',
        favoriteDish: 'Cappuccino Hot Medium Size',
        spent: 'Rs 3,540',
    },
    {
        id: 'MEMBER1255',
        name: 'Jerome Bell',
        avatar: '/assets/userimg.png',
        badge: 'silver',
        favoriteDish: 'Cappuccino Hot Medium Size',
        spent: 'Rs 3,540',
    },
];

// Stats data
const stats = [
    { value: 280, img: { src: crown } },
    { value: 100, img: { src: badge } },
    { value: 400, img: { src: guest } },
];

const drawerWidthOpen = 240;
const drawerWidthClosed = 110;

const CustomerDashboard = () => {
    const [open, setOpen] = useState(true);
    const [openFilter, setOpenFilter] = useState(false);
    const [openProfile, setOpenProfile] = useState(false);
    const [profileView, setProfileView] = useState('customer');

    const handleGoToHistory = () => {
        setProfileView('history');
    };

    const handleProfileClose = () => {
        setOpenProfile(false);
        setProfileView('customer'); // Reset to default on close
    };
    const handleProfileOpen = () => setOpenProfile(true);

    const handleFilterOpen = () => setOpenFilter(true);
    const handleFilterClose = () => setOpenFilter(false);

    return (
        <>
            {/* <SideNav open={open} setOpen={setOpen} /> */}
            <div
                style={{minHeight:'100vh', backgroundColor:'#f5f5f5'
                }}
            >
                <Box sx={{ p: 3, bgcolor: '#f5f7fa', minHeight: '100vh' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="h5" fontWeight="500" sx={{ mr: 1, color: '#063455', fontSize: '34px' }}>
                                780
                            </Typography>
                            <Typography variant="h5" fontWeight="500" sx={{ mr: 3, color: '#7F7F7F', fontSize: '16px' }}>
                                Customers
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                {stats.map((stat, index) => (
                                    <Box
                                        key={index}
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            bgcolor: 'transparent',
                                            // borderRadius: 1,
                                            p: 0.5,
                                            width: 90,
                                            height: 40,
                                            border: '1px solid #063455',
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                width: 24,
                                                height: 24,
                                                borderRadius: '50%',
                                                bgcolor: stat.color,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'white',
                                                fontSize: 12,
                                                fontWeight: 'bold',
                                                mr: 2,
                                            }}
                                        >
                                            {<img src={stat.img.src} alt="Stat Icon" style={{ width: '26px', height: '24px' }} />}
                                        </Box>
                                        <Typography
                                            variant="body2"
                                            fontWeight="500"
                                            sx={{
                                                color: '#063455',
                                                fontSize: '16px',
                                            }}
                                        >
                                            {stat.value}
                                        </Typography>
                                    </Box>
                                ))}
                            </Box>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField
                                placeholder="Search member ID or name"
                                size="small"
                                sx={{
                                    width: 380,
                                    bgcolor: '#FFFFFF',
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 1,
                                        '& fieldset': {
                                            border: '1px solid #121212', // force 1px black border
                                        },
                                        '&:hover fieldset': {
                                            border: '1px solid #121212',
                                        },
                                        '&.Mui-focused fieldset': {
                                            border: '1px solid #121212',
                                        },
                                    },
                                }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Search fontSize="small" />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                            <Button
                                variant="outlined"
                                startIcon={<FilterAlt />}
                                onClick={handleFilterOpen}
                                sx={{
                                    border: '1px solid #063455',
                                    color: '#063455',
                                    bgcolor: 'transparent',
                                    '&:hover': {
                                        borderColor: '#063455',
                                        bgcolor: 'transparent',
                                    },
                                }}
                            >
                                Filter
                            </Button>
                            <Drawer
                                anchor="right"
                                open={openFilter}
                                onClose={handleFilterClose}
                                PaperProps={{
                                    sx: {
                                        width: 600, // Adjust width as needed
                                        padding: 2,
                                    },
                                }}
                            >
                                <CustomerFilter handleClose={handleFilterClose} />
                            </Drawer>
                        </Box>
                    </Box>

                    <Grid container spacing={2}>
                        {customers.map((customer, index) => (
                            <Grid item xs={12} sm={6} md={4} key={index}>
                                <Paper
                                    elevation={0}
                                    sx={{
                                        // width:'390px',
                                        height: '220px',
                                        p: 2,
                                        borderRadius: 2,
                                        border: '1px solid #e0e0e0',
                                        bgcolor: '#FBFBFB',
                                        cursor: 'pointer',
                                    }}
                                    onClick={handleProfileOpen}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                        <Avatar src={customer.avatar} sx={{ width: 40, height: 40, mr: 1.5 }} />
                                        <Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <Typography
                                                    variant="subtitle1"
                                                    fontWeight="500"
                                                    sx={{
                                                        color: '#121212',
                                                        fontSize: '16px',
                                                    }}
                                                >
                                                    {customer.name}
                                                </Typography>
                                                {customer.badge === 'gold' ? (
                                                    <img
                                                        src={crown}
                                                        alt=""
                                                        style={{
                                                            width: 24,
                                                            height: 24,
                                                            marginLeft: 10,
                                                        }}
                                                    />
                                                ) : (
                                                    <img
                                                        src={badge}
                                                        alt=""
                                                        style={{
                                                            width: 24,
                                                            height: 24,
                                                            marginLeft: 10,
                                                        }}
                                                    />
                                                )}
                                            </Box>
                                            <Typography
                                                variant="caption"
                                                color="#7F7F7F"
                                                sx={{
                                                    fontSize: '12px',
                                                }}
                                            >
                                                {customer.id}
                                            </Typography>
                                        </Box>
                                    </Box>

                                    <Box sx={{ mb: 1 }}>
                                        <Typography
                                            variant="caption"
                                            color="#7F7F7F"
                                            sx={{
                                                fontSize: '14px',
                                            }}
                                        >
                                            Favorite Dish
                                        </Typography>
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                color: '#121212',
                                                fontSize: '14px',
                                            }}
                                        >
                                            {customer.favoriteDish}
                                        </Typography>
                                    </Box>

                                    <Box
                                        sx={{
                                            display: 'flex',
                                            // width:'340px',
                                            height: '40px',
                                            mt: 4,
                                            justifyContent: 'center',
                                            border: '1px solid #E3E3E3',
                                            bgcolor: 'transparent',
                                            alignItems: 'center',
                                        }}
                                    >
                                        <Typography
                                            variant="caption"
                                            color="#7F7F7F"
                                            sx={{
                                                mr: 1,
                                                fontSize: '14px',
                                            }}
                                        >
                                            Spent:
                                        </Typography>
                                        <Typography
                                            variant="caption"
                                            fontWeight="medium"
                                            sx={{
                                                color: '#063455',
                                                fontSize: '14px',
                                            }}
                                        >
                                            {customer.spent}
                                        </Typography>
                                    </Box>
                                </Paper>
                            </Grid>
                        ))}
                        <Drawer
                            anchor="right"
                            open={openProfile}
                            onClose={handleProfileClose}
                            PaperProps={{
                                sx: {
                                    width: 550,
                                    top: 0,
                                    padding: 2,
                                    bgcolor: '#E3F2FD',
                                },
                            }}
                        >
                            {profileView === 'customer' ? (
                                <CustomerProfile handleGoToHistory={handleGoToHistory} />
                            ) : (
                                <OrderHistory handleBackToProfile={() => setProfileView('customer')} />
                            )}
                        </Drawer>
                    </Grid>
                </Box>
            </div>
        </>
    );
};
CustomerDashboard.layout = (page) => page;
export default CustomerDashboard;
