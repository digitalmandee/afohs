'use client';

import { Check as CheckIcon } from '@mui/icons-material';
import { Box, Dialog, Grid, Typography } from '@mui/material';
import 'bootstrap/dist/css/bootstrap.min.css';

const drawerWidthOpen = 240;
const drawerWidthClosed = 110;
export default function SuccessModal() {
    return (
        <>
            <Dialog
                // open={openPaymentSuccessModal}
                // onClose={handleClosePaymentSuccess}
                fullWidth
                maxWidth="md"
                PaperProps={{
                    style: {
                        position: 'fixed',
                        top: 0,
                        right: 0,
                        margin: 0,
                        height: '100vh',
                        maxHeight: '100vh',
                        width: '100%',
                        maxWidth: '800px',
                        borderRadius: 0,
                        overflow: 'auto',
                    },
                }}
            >
                <Box sx={{ display: 'flex', height: '100vh' }}>
                    {/* Left Side - Receipt */}
                    <Receipt orderData={paymentOrderDetail} />

                    {/* Right Side - Success Message */}
                    <Box
                        sx={{
                            flex: 1,
                            p: 5,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}
                    >
                        <Box sx={styles.successIcon}>
                            <CheckIcon sx={{ fontSize: 40 }} />
                        </Box>

                        <Typography variant="h4" fontWeight="bold" mb={2} textAlign="center">
                            Payment Success!
                        </Typography>

                        <Typography variant="body1" color="text.secondary" mb={4} textAlign="center">
                            You've successfully pay your bill. Well done!
                        </Typography>

                        <Box sx={{ width: '100%', maxWidth: 400 }}>
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="subtitle2" color="text.secondary" mb={1} textAlign="center">
                                    Total Amount
                                </Typography>
                                <Typography variant="h4" fontWeight="bold" color="#0a3d62" textAlign="center">
                                    Rs {paymentOrderDetail.total.toFixed(2)}
                                </Typography>
                            </Box>

                            <Grid container spacing={2} mb={4}>
                                <Grid item xs={6}>
                                    <Typography variant="subtitle2" color="text.secondary" mb={1}>
                                        Payment Method
                                    </Typography>
                                    <Typography variant="body1">Cash</Typography>
                                </Grid>
                                <Grid item xs={6} sx={{ textAlign: 'right' }}>
                                    <Typography variant="subtitle2" color="text.secondary" mb={1}>
                                        Cash
                                    </Typography>
                                    <Typography variant="body1">Rs {paymentOrderDetail.payment.amount.toFixed(2)}</Typography>
                                </Grid>
                            </Grid>

                            <Box sx={{ mb: 3 }}>
                                <Box
                                    sx={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                    }}
                                >
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Customer Changes
                                    </Typography>
                                    <Typography variant="body1" fontWeight="medium">
                                        Rs {paymentOrderDetail.payment.change.toFixed(2)}
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>
                    </Box>
                </Box>
            </Dialog>
        </>
    );
}
