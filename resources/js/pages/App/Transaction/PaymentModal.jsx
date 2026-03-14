'use client';

import {
    AccountBalance as AccountBalanceIcon,
    ArrowForward as ArrowForwardIcon,
    Backspace as BackspaceIcon,
    CreditCard as CreditCardIcon,
} from '@mui/icons-material';
import { Box, Button, Dialog, Grid, InputAdornment, TextField, Typography } from '@mui/material';
import 'bootstrap/dist/css/bootstrap.min.css';

const drawerWidthOpen = 240;
const drawerWidthClosed = 110;
export default function PaymentModal() {
    return (
        <>
            <Dialog
                // open={openPaymentModal}
                // onClose={handleClosePayment}
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
                    {/* <Receipt orderData={paymentOrderDetail} showButtons={false} /> */}

                    {/* Right Side - Payment */}
                    <Box sx={{ flex: 1, p: 3 }}>
                        <Typography variant="h5" fontWeight="bold" mb={4}>
                            Payment
                        </Typography>

                        {/* Payment Method Tabs */}
                        <Box
                            sx={{
                                display: 'flex',
                                borderBottom: '1px solid #e0e0e0',
                                mb: 3,
                            }}
                        >
                            <Box
                                sx={activePaymentMethod === 'cash' ? styles.activePaymentMethodTab : styles.paymentMethodTab}
                                onClick={() => handlePaymentMethodChange('cash')}
                            >
                                <CreditCardIcon
                                    sx={{
                                        fontSize: 24,
                                        mb: 1,
                                        color: activePaymentMethod === 'cash' ? '#0a3d62' : '#666',
                                    }}
                                />
                                <Typography variant="body1" fontWeight={activePaymentMethod === 'cash' ? 'medium' : 'normal'}>
                                    Cash
                                </Typography>
                            </Box>
                            <Box
                                sx={activePaymentMethod === 'bank' ? styles.activePaymentMethodTab : styles.paymentMethodTab}
                                onClick={() => handlePaymentMethodChange('bank')}
                            >
                                <AccountBalanceIcon
                                    sx={{
                                        fontSize: 24,
                                        mb: 1,
                                        color: activePaymentMethod === 'bank' ? '#0a3d62' : '#666',
                                    }}
                                />
                                <Typography variant="body1" fontWeight={activePaymentMethod === 'bank' ? 'medium' : 'normal'}>
                                    Bank Transfer
                                </Typography>
                            </Box>
                        </Box>

                        {/* Cash Payment Form */}
                        {activePaymentMethod === 'cash' && (
                            <Grid container spacing={3}>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle1" mb={1}>
                                        Input Amount
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        value={inputAmount}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <Typography variant="body1">Rs</Typography>
                                                </InputAdornment>
                                            ),
                                            readOnly: true,
                                        }}
                                        sx={{ mb: 2 }}
                                    />

                                    <Typography variant="subtitle1" mb={1}>
                                        Customer Changes
                                    </Typography>
                                    <Box
                                        sx={{
                                            mb: 3,
                                            display: 'flex',
                                            alignItems: 'center',
                                        }}
                                    >
                                        <Typography
                                            variant="h5"
                                            fontWeight="bold"
                                            color={Number.parseFloat(customerChanges) < 0 ? '#f44336' : '#333'}
                                        >
                                            Rs {customerChanges}
                                        </Typography>
                                    </Box>

                                    {/* Quick Amount Buttons */}
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            gap: 1,
                                            mb: 3,
                                            flexWrap: 'wrap',
                                        }}
                                    >
                                        <Button
                                            variant="outlined"
                                            onClick={() => handleQuickAmountClick(paymentOrderDetail.total.toString())}
                                            sx={styles.quickAmountButton}
                                        >
                                            Exact money
                                        </Button>
                                        <Button variant="outlined" onClick={() => handleQuickAmountClick('10.00')} sx={styles.quickAmountButton}>
                                            Rs 10.00
                                        </Button>
                                        <Button variant="outlined" onClick={() => handleQuickAmountClick('20.00')} sx={styles.quickAmountButton}>
                                            Rs 20.00
                                        </Button>
                                        <Button variant="outlined" onClick={() => handleQuickAmountClick('50.00')} sx={styles.quickAmountButton}>
                                            Rs 50.00
                                        </Button>
                                        <Button variant="outlined" onClick={() => handleQuickAmountClick('100.00')} sx={styles.quickAmountButton}>
                                            Rs 100.00
                                        </Button>
                                    </Box>

                                    {/* Numpad */}
                                    <Grid container spacing={1}>
                                        <Grid item xs={4}>
                                            <Button fullWidth sx={styles.numpadButton} onClick={() => handleNumberClick('1')}>
                                                1
                                            </Button>
                                        </Grid>
                                        <Grid item xs={4}>
                                            <Button fullWidth sx={styles.numpadButton} onClick={() => handleNumberClick('2')}>
                                                2
                                            </Button>
                                        </Grid>
                                        <Grid item xs={4}>
                                            <Button fullWidth sx={styles.numpadButton} onClick={() => handleNumberClick('3')}>
                                                3
                                            </Button>
                                        </Grid>
                                        <Grid item xs={4}>
                                            <Button fullWidth sx={styles.numpadButton} onClick={() => handleNumberClick('4')}>
                                                4
                                            </Button>
                                        </Grid>
                                        <Grid item xs={4}>
                                            <Button fullWidth sx={styles.numpadButton} onClick={() => handleNumberClick('5')}>
                                                5
                                            </Button>
                                        </Grid>
                                        <Grid item xs={4}>
                                            <Button fullWidth sx={styles.numpadButton} onClick={() => handleNumberClick('6')}>
                                                6
                                            </Button>
                                        </Grid>
                                        <Grid item xs={4}>
                                            <Button fullWidth sx={styles.numpadButton} onClick={() => handleNumberClick('7')}>
                                                7
                                            </Button>
                                        </Grid>
                                        <Grid item xs={4}>
                                            <Button fullWidth sx={styles.numpadButton} onClick={() => handleNumberClick('8')}>
                                                8
                                            </Button>
                                        </Grid>
                                        <Grid item xs={4}>
                                            <Button fullWidth sx={styles.numpadButton} onClick={() => handleNumberClick('9')}>
                                                9
                                            </Button>
                                        </Grid>
                                        <Grid item xs={4}>
                                            <Button fullWidth sx={styles.numpadButton} onClick={handleDecimalClick}>
                                                .
                                            </Button>
                                        </Grid>
                                        <Grid item xs={4}>
                                            <Button fullWidth sx={styles.numpadButton} onClick={() => handleNumberClick('0')}>
                                                0
                                            </Button>
                                        </Grid>
                                        <Grid item xs={4}>
                                            <Button
                                                fullWidth
                                                sx={{
                                                    ...styles.numpadButton,
                                                    backgroundColor: '#ffebee',
                                                    color: '#f44336',
                                                    '&:hover': {
                                                        backgroundColor: '#ffcdd2',
                                                    },
                                                }}
                                                onClick={handleDeleteClick}
                                            >
                                                <BackspaceIcon />
                                            </Button>
                                        </Grid>
                                    </Grid>
                                </Grid>
                            </Grid>
                        )}

                        {/* Bank Transfer Form */}
                        {activePaymentMethod === 'bank' && (
                            <Grid container spacing={3}>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle1" mb={2}>
                                        Choose Bank
                                    </Typography>
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            gap: 1,
                                            mb: 3,
                                        }}
                                    >
                                        <Button
                                            variant="outlined"
                                            onClick={() => handleBankSelection('bca')}
                                            sx={selectedBank === 'bca' ? styles.activeBankButton : styles.bankButton}
                                        >
                                            BCA Bank
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            onClick={() => handleBankSelection('citi')}
                                            sx={selectedBank === 'citi' ? styles.activeBankButton : styles.bankButton}
                                        >
                                            CITI Bank
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            onClick={() => handleBankSelection('hbl')}
                                            sx={selectedBank === 'hbl' ? styles.activeBankButton : styles.bankButton}
                                        >
                                            HBL Bank
                                        </Button>
                                    </Box>

                                    <Typography variant="subtitle1" mb={1}>
                                        Account Number
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        placeholder="e.g. 222-29863902-2"
                                        value={accountNumber}
                                        onChange={(e) => setAccountNumber(e.target.value)}
                                        sx={{ mb: 3 }}
                                    />

                                    <Typography variant="subtitle1" mb={1}>
                                        Card Holder Name
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        placeholder="e.g. Zahid Ullah"
                                        value={cardHolderName}
                                        onChange={(e) => setCardHolderName(e.target.value)}
                                        sx={{ mb: 3 }}
                                    />

                                    <Typography variant="subtitle1" mb={1}>
                                        CVV Code
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        placeholder="e.g. 234"
                                        value={cvvCode}
                                        onChange={(e) => setCvvCode(e.target.value)}
                                        sx={{ mb: 3 }}
                                        type="password"
                                    />
                                </Grid>
                            </Grid>
                        )}

                        {/* Footer Buttons */}
                        <Box
                            sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                mt: 4,
                            }}
                        >
                            <Button
                                variant="outlined"
                                onClick={handleClosePayment}
                                sx={{
                                    color: '#333',
                                    borderColor: '#ddd',
                                    textTransform: 'none',
                                }}
                            >
                                Cancel
                            </Button>
                            <Button variant="contained" endIcon={<ArrowForwardIcon />} onClick={handlePayNow} sx={styles.payNowButton}>
                                Pay Now
                            </Button>
                        </Box>
                    </Box>
                </Box>
            </Dialog>
        </>
    );
}
PaymentModal.layout = (page) => page;