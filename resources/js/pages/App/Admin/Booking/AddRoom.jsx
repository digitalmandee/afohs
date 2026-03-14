import React, { useState, useRef, useEffect } from 'react';
import { router, usePage } from '@inertiajs/react';
import { Box, Typography, Paper, IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import 'bootstrap/dist/css/bootstrap.min.css';
import CreateRoom from '@/components/App/Rooms/Create';

const AddRoom = () => {
    // const [open, setOpen] = useState(true);
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
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {/* <IconButton sx={{ color: '#063455' }} onClick={() => router.visit(route('rooms.manage'))}>
                        <ArrowBackIcon />
                    </IconButton> */}
                    <Typography sx={{ ml: 1, fontWeight: 700, fontSize: '30px', color: '#063455' }}>
                        Add Room
                    </Typography>
                </Box>
                <Typography style={{ color: '#063455', fontSize: '15px', fontWeight: '600', marginLeft: 5 }}>
                    Enter room number, type, rates, and facility details</Typography>
                <Box sx={{ maxWidth: 600, margin: '0 auto', marginTop:'2rem', border: '1px solid #E3E3E3', bgcolor: '#FFFFFF' }}>
                    <Paper sx={{ p: 3 }}>
                        {/* Form Fields */}
                        <CreateRoom />
                    </Paper>
                </Box>
            </div>
            {/* </div> */}
        </>
    );
};

export default AddRoom;
