import React, { useState } from 'react';
import { Box } from '@mui/material';
import SideNav, {
    POS_DRAWER_WIDTH_CLOSED,
    POS_DRAWER_WIDTH_OPEN,
    POS_TOPBAR_HEIGHT,
} from '@/components/App/SideBar/SideNav';
import { useRenderProfiler } from '@/lib/navigationProfiler';

export default function POSLayout({ children }) {
    const [open, setOpen] = useState(true);
    const resolvedDrawerWidth = open ? POS_DRAWER_WIDTH_OPEN : POS_DRAWER_WIDTH_CLOSED;
    useRenderProfiler('POSLayout', () => ({
        open,
        drawerWidth: resolvedDrawerWidth,
    }));

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', overflow: 'hidden', bgcolor: '#f4f8fc' }}>
            <SideNav open={open} setOpen={setOpen} />

            <Box
                sx={{
                    flexGrow: 1,
                    minWidth: 0,
                    pl: 0,
                    pt: `${POS_TOPBAR_HEIGHT}px`,
                    transition: 'padding-left 0.25s ease',
                }}
            >
                <Box
                    sx={{
                        minHeight: `calc(100vh - ${POS_TOPBAR_HEIGHT}px)`,
                        px: { xs: 1.5, md: 2.5 },
                        py: { xs: 1.5, md: 2 },
                        overflowX: 'hidden',
                    }}
                >
                    <Box
                        sx={{
                            width: '100%',
                            maxWidth: '100%',
                            minHeight: '100%',
                        }}
                        data-pos-shell-width={resolvedDrawerWidth}
                    >
                        {children}
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}
