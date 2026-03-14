import React, { useState } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Avatar,
    Button,
    Stack,
    Drawer,
    Grid,
    styled,
    Dialog,
    DialogTitle,
    DialogContent
} from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';

const MembershipCard = styled(Card)(({ theme }) => ({
    maxWidth: 450,
    borderRadius: 12,
    boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden'
}));

const MembershipFooter = styled(Box)(({ theme }) => ({
    backgroundColor: '#0a3d62',
    color: 'white',
    padding: theme.spacing(2),
    textAlign: 'center'
}));

const handlePrintMembershipCard = (member) => {
    if (!member) return;

    const printWindow = window.open('', '_blank');

    const content = `
        <!doctype html>
        <html>
            <head>
                <title>Membership Card</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        margin: 0;
                        padding: 20px;
                        display: flex;
                        justify-content: center;
                        background-color: #f5f5f5;
                    }
                    .membership-card {
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
                    .logo {
                        height: 40px;
                        margin-bottom: 16px;
                    }
                    .info-grid {
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                        gap: 20px;
                    }
                    .section {
                        flex: 1;
                    }
                    .avatar-section {
                        max-width: 100px;
                    }
                    .avatar {
                        width: 100px;
                        height: 120px;
                        border-radius: 4px;
                        border: 1px solid #eee;
                        object-fit: cover;
                    }
                    .qr-code {
                        width: 100px;
                        height: 100px;
                        object-fit: contain;
                        margin-top: 8px;
                    }
                    .label {
                        font-size: 12px;
                        color: #757575;
                        margin-bottom: 4px;
                    }
                    .value {
                        font-size: 16px;
                        font-weight: bold;
                        color: #0a3d62;
                        margin-bottom: 16px;
                    }
                    .footer {
                        background-color: #0a3d62;
                        color: white;
                        padding: 16px;
                        text-align: center;
                        font-size: 20px;
                        font-weight: 500;
                    }
                    @media print {
                        body {
                            background-color: white;
                            padding: 0;
                        }
                        .membership-card {
                            box-shadow: none;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="membership-card">
                    <div class="card-content">
                        <img src="/assets/Logo.png" alt="AFOHS CLUB" class="logo" />
                        <div class="info-grid">
                            <!-- Avatar -->
                            <div class="section avatar-section">
                                <img src="${member.user?.profile_photo || 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/1.PNG-DAILsdTgi3B4Lf6K9sR35Uu3o71eJ6.png'}" alt="Member Photo" class="avatar" />
                            </div>
                            <!-- Info -->
                            <div class="section">
                                <div class="label">Name</div>
                                <div class="value">${member.user?.name || 'N/A'}</div>
                                <div class="label">Membership ID</div>
                                <div class="value">${member.member_id || '101837'}</div>
                            </div>
                            <!-- Valid Until and QR Code -->
                            <div class="section">
                                <div class="label">Valid Until</div>
                                <div class="value">${member.expiry_date ? new Date(member.expiry_date).toLocaleDateString() : '10/08/2027'}</div>
                                <div class="label">QR Code</div>
                                 <img src="/${member?.member?.qr_code || ''}" alt="QR Code" class="qr-code" />
                            </div>
                        </div>
                    </div>
                    <div class="footer">${member.subscription_type || 'GYM'} Subscription</div>
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

const formatExpiryMMYY = (value) => {
    if (!value) return '06/25';

    // MM/YYYY
    if (typeof value === 'string' && value.includes('/')) {
        const [mm, yyyy] = value.split('/');
        return `${mm}/${yyyy.slice(-2)}`;
    }

    // ISO / YYYY-MM-DD
    if (typeof value === 'string' && value.includes('-')) {
        const parts = value.split('-');
        return `${parts[1]}/${parts[0].slice(-2)}`;
    }

    return value;
};

const UserCardComponent = ({ open, onClose, member }) => {
    const [openJsonModal, setOpenJsonModal] = useState(false);

    if (!member) return null;


    return (
        <>
            <Drawer
                anchor="top"
                open={open}
                onClose={onClose}
                ModalProps={{
                    keepMounted: true,
                }}
                PaperProps={{
                    sx: {
                        margin: '20px auto 0',
                        width: 600,
                        borderRadius: '8px',
                    }
                }}
            >
                <Box sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    py: 2
                }}>
                    <MembershipCard sx={{
                        width: '100%', maxWidth: 560, border: '1px solid #E3E3E3'
                    }}>
                        <CardContent sx={{ px: 3 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
                                <img
                                    src="/assets/Logo.png"
                                    alt="AFOHS CLUB"
                                    style={{ height: 40 }}
                                />
                            </Box>

                            <Grid container spacing={2}>
                                <Grid item xs={4}>
                                    <Avatar
                                        src={member.user?.profile_photo || 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/1.PNG-DAILsdTgi3B4Lf6K9sR35Uu3o71eJ6.png'}
                                        alt="Member Photo"
                                        sx={{
                                            width: 100,
                                            height: 120,
                                            borderRadius: 1,
                                            border: '1px solid #eee'
                                        }}
                                        variant="square"
                                    />
                                </Grid>
                                <Grid item xs={4}>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">
                                            Name
                                        </Typography>
                                        <Typography variant="subtitle1" fontWeight="bold" color="#0a3d62">
                                            {member.name || 'N/A'}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ mt: 2 }}>
                                        <Typography variant="caption" color="text.secondary">
                                            Membership ID
                                        </Typography>
                                        <Typography variant="subtitle1" fontWeight="bold" color="#0a3d62">
                                            {member.member_id || '101837'}
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={4}>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">
                                            Valid Until
                                        </Typography>
                                        <Typography variant="subtitle1" fontWeight="bold" color="#0a3d62">
                                            {formatExpiryMMYY(member.expiry_date)}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ mt: 1 }}>
                                        <img
                                            src={'/' + member?.member?.qr_code}
                                            alt="QR Code"
                                            style={{
                                                width: 100,
                                                height: 100,
                                                objectFit: 'contain',
                                                border: 'none',
                                            }}
                                        />
                                    </Box>
                                </Grid>
                            </Grid>
                        </CardContent>

                        <MembershipFooter>
                            <Typography variant="h6" fontWeight="medium">
                                {member.subscription_type || 'GYM'} Subscription
                            </Typography>
                        </MembershipFooter>
                    </MembershipCard>
                </Box>
                <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                    <Button variant="text" color="inherit" onClick={onClose}>
                        Close
                    </Button>
                    <Button variant="text" color="primary">
                        Send Remind
                    </Button>
                    <Button variant="contained" startIcon={<PrintIcon />} onClick={() => handlePrintMembershipCard(member)} >
                        Print
                    </Button>

                </Box>
            </Drawer>
            <Dialog open={openJsonModal} onClose={() => setOpenJsonModal(false)}>
                <DialogTitle>Member Data</DialogTitle>
                <DialogContent>
                    <pre>{JSON.stringify(member, null, 2)}</pre>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default UserCardComponent;
