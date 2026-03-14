import React from 'react';
import {
    Box,
    Typography,
    Avatar,
    Card,
    CardContent,
    Button,
    Grid,
    styled,
    Drawer
} from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';

const SubscriptionCard = styled(Card)(() => ({
    width: '100%',
    marginLeft: 20,
    marginRight: 20,
    borderRadius: 12,
    boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
}));

const SubscriptionFooter = styled(Box)(() => ({
    backgroundColor: '#063455',
    color: 'white',
    padding: 16,
    textAlign: 'center',
}));

const handlePrintSubscriptionCard = (subscription) => {
    if (!subscription) return;

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-PK', {
            style: 'currency',
            currency: 'PKR'
        }).format(amount).replace('PKR', 'Rs');
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-GB');
    };

    const printWindow = window.open('', '_blank');

    const content = `
        <!doctype html>
        <html>
        <head>
            <title>Subscription Card</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 20px;
                    display: flex;
                    justify-content: center;
                    background-color: #f5f5f5;
                }
                .subscription-card {
                    width: 560px;
                    border: 1px solid #e3e3e3;
                    border-radius: 12px;
                    box-shadow: 0px 2px 10px rgba(0, 0, 0, 0.1);
                    background-color: white;
                    overflow: hidden;
                }
                .card-content {
                    padding: 24px;
                }
                .header {
                    display: flex;
                    align-items: center;
                    margin-bottom: 16px;
                }
                .logo {
                    height: 40px;
                }
                .member-info {
                    display: flex;
                    gap: 16px;
                    margin-bottom: 16px;
                }
                .member-photo {
                    width: 100px;
                    height: 120px;
                    border-radius: 4px;
                    border: 1px solid #eee;
                    object-fit: cover;
                }
                .info-section {
                    flex: 1;
                }
                .info-group {
                    margin-bottom: 16px;
                }
                .label {
                    font-size: 12px;
                    color: #666;
                    margin-bottom: 4px;
                }
                .value {
                    font-size: 16px;
                    font-weight: bold;
                    color: #063455;
                }
                .footer {
                    background-color: #063455;
                    color: white;
                    padding: 16px;
                    text-align: center;
                    font-size: 18px;
                    font-weight: 500;
                }
                .qr-section {
                    text-align: center;
                }
                .qr-code {
                    width: 100px;
                    height: 100px;
                }
            </style>
        </head>
        <body>
            <div class="subscription-card">
                <div class="card-content">
                    <div class="header">
                        <img src="/assets/Logo.png" alt="AFOHS CLUB" class="logo" />
                    </div>
                    
                    <div class="member-info">
                        <div>
                            <img src="${subscription.member?.profile_photo?.file_path ? `/storage/${subscription.member.profile_photo.file_path}` : '/placeholder-avatar.png'}" 
                                 alt="Member Photo" class="member-photo" />
                        </div>
                        
                        <div class="info-section">
                            <div class="info-group">
                                <div class="label">Name</div>
                                <div class="value">${subscription.member?.full_name || 'N/A'}</div>
                            </div>
                            <div class="info-group">
                                <div class="label">Membership ID</div>
                                <div class="value">${subscription.member?.membership_no || 'N/A'}</div>
                            </div>
                            <div class="info-group">
                                <div class="label">Category</div>
                                <div class="value">${subscription.subscription_category?.name || 'N/A'}</div>
                            </div>
                        </div>
                        
                        <div class="qr-section">
                            <div class="info-group">
                                <div class="label">Valid Until</div>
                                <div class="value">${formatDate(subscription.valid_to)}</div>
                            </div>
                            <div class="info-group">
                                <div class="label">Amount</div>
                                <div class="value">${formatCurrency(subscription.total_price)}</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="footer">
                    ${subscription.subscription_category?.name || 'Subscription Card'}
                </div>
            </div>
        </body>
        </html>
    `;

    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 250);
};

const SubscriptionUserCard = ({ open, onClose, subscription }) => {
    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-PK', {
            style: 'currency',
            currency: 'PKR'
        }).format(amount).replace('PKR', 'Rs');
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-GB');
    };

    if (!subscription) return null;

    return (
        <Drawer
            anchor="right"
            open={open}
            onClose={onClose}
            PaperProps={{
                sx: {
                    margin: '20px auto 0',
                    width: 600,
                    borderRadius: '8px',
                },
            }}
        >
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <SubscriptionCard>
                    <CardContent sx={{ px: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
                            <img src="/assets/Logo.png" alt="AFOHS CLUB" style={{ height: 40 }} />
                        </Box>

                        <Grid container spacing={2}>
                            <Grid item xs={4}>
                                <Avatar 
                                    src={subscription.member?.profile_photo?.file_path ? 
                                        `/storage/${subscription.member.profile_photo.file_path}` : null}
                                    alt="Member Photo" 
                                    sx={{ width: 100, height: 120, borderRadius: 1, border: '1px solid #eee' }} 
                                    variant="square"
                                >
                                    {subscription.member?.full_name?.charAt(0)}
                                </Avatar>
                            </Grid>
                            <Grid item xs={4}>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">
                                        Name
                                    </Typography>
                                    <Typography variant="subtitle1" fontWeight="bold" color="#063455">
                                        {subscription.member?.full_name || 'N/A'}
                                    </Typography>
                                </Box>
                                <Box sx={{ mt: 2 }}>
                                    <Typography variant="caption" color="text.secondary">
                                        Membership ID
                                    </Typography>
                                    <Typography variant="subtitle1" fontWeight="bold" color="#063455">
                                        {subscription.member?.membership_no || 'N/A'}
                                    </Typography>
                                </Box>
                                <Box sx={{ mt: 2 }}>
                                    <Typography variant="caption" color="text.secondary">
                                        Category
                                    </Typography>
                                    <Typography variant="subtitle1" fontWeight="bold" color="#063455">
                                        {subscription.subscription_category?.name || 'N/A'}
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={4}>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">
                                        Valid Until
                                    </Typography>
                                    <Typography variant="subtitle1" fontWeight="bold" color="#063455">
                                        {formatDate(subscription.valid_to)}
                                    </Typography>
                                </Box>
                                <Box sx={{ mt: 2 }}>
                                    <Typography variant="caption" color="text.secondary">
                                        Amount Paid
                                    </Typography>
                                    <Typography variant="subtitle1" fontWeight="bold" color="#063455">
                                        {formatCurrency(subscription.total_price)}
                                    </Typography>
                                </Box>
                            </Grid>
                        </Grid>
                    </CardContent>
                    <SubscriptionFooter>
                        <Typography variant="h6" fontWeight="medium">
                            {subscription.subscription_category?.name || 'Subscription Card'}
                        </Typography>
                    </SubscriptionFooter>
                </SubscriptionCard>
            </Box>

            <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button variant="text" color="inherit" onClick={onClose}>
                    Close
                </Button>
                <Button 
                    onClick={() => handlePrintSubscriptionCard(subscription)} 
                    variant="contained" 
                    startIcon={<PrintIcon />} 
                    sx={{ bgcolor: '#063455', '&:hover': { bgcolor: '#052d45' } }}
                >
                    Print
                </Button>
            </Box>
        </Drawer>
    );
};

export default SubscriptionUserCard;
