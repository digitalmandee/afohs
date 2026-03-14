import { Box } from '@mui/material';

export default function AppAuthLayout({ children }) {
    return (
        <Box
            sx={{
                display: 'flex',
                minHeight: '100dvh',
                height: '100dvh',
                width: '100%',
                position: 'relative',
                overflowX: 'hidden',
                overflowY: 'auto',
                backgroundImage: `url(/assets/bgimage.webp)`,
                backgroundSize: 'cover',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                },
            }}
        >

            <Box
                sx={{
                    width: { xs: '100%', md: '500px' },
                    display: 'flex',
                    // flexDirection: 'column',
                    justifyContent: 'center',
                    mt: { xs: 1, md: 2 },
                    mb: { xs: 1, md: 2 },
                    mx: 'auto',
                    zIndex: 1,
                }}
            >
                <Box
                    sx={{
                        width: '100%',
                        maxWidth: 540,
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        p: 4,
                        borderRadius: 1,
                        boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                        border: '1px solid #e0e0e0',
                        maxHeight: { xs: 'calc(100dvh - 16px)', md: 'calc(100dvh - 32px)' },
                        overflowX: 'hidden',
                        overflowY: 'auto',
                    }}
                >
                    {children}
                </Box>
            </Box>
        </Box>
    );
}
