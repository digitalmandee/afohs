import { router, usePage } from '@inertiajs/react';
import { Box, Button, Container, Paper, Typography } from '@mui/material';

export default function Welcome() {
    const { auth } = usePage().props;

    return (
        <Container maxWidth="md" sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', px: 4 }}>
            <Paper elevation={4} sx={{ p: 6, width: '100%', borderRadius: 4, textAlign: 'center' }}>
                <Typography variant="h3" gutterBottom>
                    Welcome to Afohs Club Restaurant
                </Typography>
                <Typography variant="h6" gutterBottom sx={{ color: 'text.secondary', mb: 4 }}>
                    Experience the finest culinary delights with us.
                </Typography>

                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
                    {auth.user ? (
                        <Button variant="contained" color="primary" size="large" onClick={() => router.visit(route('dashboard'))}>
                            Go to Dashboard
                        </Button>
                    ) : (
                        <Button variant="contained" color="primary" size="large" onClick={() => router.visit(route('login'))}>
                            Log in
                        </Button>
                    )}
                </Box>
            </Paper>
        </Container>
    );
}
Welcome.layout = (page) => page;