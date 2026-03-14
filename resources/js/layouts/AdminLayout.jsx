import React, { useState } from 'react';
import { Box, ThemeProvider, createTheme } from '@mui/material';
import SideNav from '@/components/App/AdminSideBar/SideNav';

const drawerWidthOpen = 240;
const drawerWidthClosed = 110;

const AdminLayout = ({ children }) => {
    const [open, setOpen] = useState(true);

    return (
            <Box>
                <div style={{ backgroundColor: '#f5f5f5' }}>{children}</div>
            </Box>
    );
};

export default AdminLayout;
