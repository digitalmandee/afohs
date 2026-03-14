import { Box, Button, Chip, Paper, Typography } from '@mui/material';

const CancelOrder = ({ onClose, onConfirm }) => {
    return (
        <Box
            sx={{
                position: 'fixed', // Ensures it's positioned relative to the viewport
                top: '1px',
                left: '50%',
                transform: 'translate(-50%, 0)', // Centers it horizontally
                zIndex: 2000, // Ensures it appears above other content
                bgcolor: 'rgba(0,0,0,0.5)', // Semi-transparent background
                width: '100vw',
                height: '100vh',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'flex-start', // Aligns it near the top
                pt: 5, // Adds padding to move it slightly down
            }}
        >
            <Paper
                sx={{
                    width: '100%',
                    maxWidth: 400,
                    borderRadius: 1,
                    overflow: 'hidden',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}
            >
                {/* Header */}
                <Box sx={{ p: 3, pb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        Cancel Order
                    </Typography>

                    <Typography variant="body2" sx={{ color: '#6b7280', mt: 1 }}>
                        Orders that have been canceled cannot be revert this!
                    </Typography>
                </Box>

                {/* Order Details */}
                <Box sx={{ px: 3, pb: 3 }}>
                    <Typography
                        variant="subtitle2"
                        sx={{
                            fontWeight: 'bold',
                            color: '#0e3151',
                            fontSize: '0.75rem',
                            mb: 1.5,
                        }}
                    >
                        DINE IN ORDER
                    </Typography>

                    <Box
                        sx={{
                            bgcolor: '#f8f9fa',
                            borderRadius: 1,
                            p: 2,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }}
                    >
                        <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                Annette Black
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#6b7280' }}>
                                Revenue Lost{' '}
                                <Box component="span" sx={{ color: '#ef4444' }}>
                                    Rs 25,00
                                </Box>
                            </Typography>
                        </Box>

                        <Chip
                            label="#Order002"
                            size="small"
                            sx={{
                                bgcolor: '#f0f0f0',
                                borderRadius: 1,
                                fontSize: '0.75rem',
                                fontWeight: 'medium',
                                color: '#4b5563',
                            }}
                        />
                    </Box>
                </Box>

                {/* Action Buttons */}
                <Box
                    sx={{
                        display: 'flex',
                        borderTop: '1px solid #f0f0f0',
                        //   width:'99%',
                        p: 2,
                        justifyContent: 'space-evenly',
                    }}
                >
                    <Button
                        fullWidth
                        sx={{
                            py: 1.5,
                            width: '150px',
                            border: '1px solid black',
                            borderRadius: 0,
                            color: '#4b5563',
                            textTransform: 'none',
                            fontSize: '0.875rem',
                            fontWeight: 'medium',
                            '&:hover': {
                                bgcolor: '#f8f9fa',
                            },
                        }}
                        onClick={onClose}
                    >
                        Close
                    </Button>

                    {/* <Divider orientation="vertical" flexItem /> */}

                    <Button
                        fullWidth
                        sx={{
                            py: 1.5,
                            width: '150px',
                            bgcolor: '#f44336',
                            color: 'white',
                            borderRadius: 0,
                            textTransform: 'none',
                            fontSize: '0.875rem',
                            fontWeight: 'medium',
                            '&:hover': {
                                bgcolor: '#e53935',
                            },
                        }}
                        onClick={onConfirm}
                    >
                        Confirm Cancel
                    </Button>
                </Box>
            </Paper>
        </Box>
    );
};
CancelOrder.layout = (page) => page;
export default CancelOrder;
