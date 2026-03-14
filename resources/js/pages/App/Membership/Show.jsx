import React from 'react';
import { Head } from '@inertiajs/react';
import { Box, Card, CardContent, Typography, Avatar, Grid, styled, Chip } from '@mui/material';

// Styled components from UserCard.jsx
const MembershipCard = styled(Card)(({ theme }) => ({
    width: '100%',
    maxWidth: 600,
    borderRadius: 12,
    boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
    backgroundColor: 'white',
    position: 'relative',
}));

const MembershipFooter = styled(Box)(() => ({
    backgroundColor: '#0a3d62',
    color: 'white',
    padding: 10,
    textAlign: 'center',
}));

export default function MemberProfile({ member }) {
    const normalizeImageUrl = (value) => {
        if (!value) return null;
        const raw = String(value).replace(/\\/g, '/');
        if (/^(https?:|data:|blob:)/i.test(raw)) return raw;
        return raw.startsWith('/') ? raw : `/${raw}`;
    };

    if (!member) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-700">Member Not Found</h2>
                </div>
            </div>
        );
    }

    return (
        <>
            <Head title={`${member.full_name} - Member Profile`} />
            <Box
                sx={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: '#f5f5f5',
                    p: 2,
                }}
            >
                <MembershipCard>
                    <CardContent sx={{ py: 3 }}>
                        <Grid container spacing={2}>
                            {/* Left Column: Avatar + Name + Status */}
                            <Grid item xs={12} sm={4}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', height: '100%', justifyContent: 'center' }}>
                                    <Avatar
                                        src={normalizeImageUrl(member.profile_photo_url) || undefined}
                                        alt={member.full_name}
                                        imgProps={{
                                            onError: (event) => {
                                                event.currentTarget.onerror = null;
                                                event.currentTarget.src = '/placeholder.svg?height=100&width=100';
                                            },
                                        }}
                                        sx={{
                                            width: 100,
                                            height: 100,
                                            borderRadius: 1,
                                            border: '1px solid #0a3d62',
                                            mb: 1,
                                        }}
                                        variant="square"
                                    >
                                        {!member.profile_photo_url && member.full_name.charAt(0)}
                                    </Avatar>
                                    <Typography sx={{ fontSize: '14px', fontWeight: 'bold', color: '#0a3d62', lineHeight: 1.2, mb: 1 }}>{member.full_name}</Typography>

                                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', justifyContent: 'center' }}>
                                        <Chip label={member.status} size="small" color={member.status === 'active' ? 'success' : 'default'} sx={{ height: 20, fontSize: '0.65rem' }} />
                                        {member.card_status && <Chip label={member.card_status} size="small" variant="outlined" color={member.card_status === 'active' ? 'primary' : 'default'} sx={{ height: 20, fontSize: '0.65rem' }} />}
                                    </Box>
                                </Box>
                            </Grid>

                            {/* Center Column: Logo + Membership ID + Main Member Info */}
                            <Grid item xs={12} sm={4}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                    <img src="/assets/Logo.png" alt="AFOHS CLUB" style={{ height: 80, objectFit: 'contain', marginBottom: 16 }} />

                                    <Typography variant="caption" color="text.secondary">
                                        Membership ID
                                    </Typography>
                                    <Typography variant="subtitle1" fontWeight="bold" color="#0a3d62" sx={{ mb: 2 }}>
                                        {member.membership_no || 'N/A'}
                                    </Typography>

                                    {/* Main Member Info for Family Members */}
                                    {member.is_family_member && member.parent_member && (
                                        <Box sx={{ mt: 1, p: 1, bgcolor: '#f0f7ff', borderRadius: 1, width: '100%', textAlign: 'center' }}>
                                            <Typography variant="caption" display="block" color="text.secondary" sx={{ fontSize: '0.65rem', textTransform: 'uppercase' }}>
                                                Main Member
                                            </Typography>
                                            <Typography variant="body2" fontWeight="bold" color="#0a3d62" sx={{ fontSize: '0.8rem' }}>
                                                {member.parent_member.full_name}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                                {member.parent_member.membership_no}
                                            </Typography>
                                        </Box>
                                    )}
                                </Box>
                            </Grid>

                            {/* Right Column: QR + Valid Until */}
                            <Grid item xs={12} sm={4}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                    {/* QR Code - Using a placeholder or the actual QR path if available */}
                                    {/* Note: In the controller, we didn't explicitly pass qr_code path, but usually it's stored.
                                        If not passed, we might need to rely on the ID or fetch it.
                                        For now, assuming we can use the ID to generate a QR or if the backend passes it.
                                        The UserCard used member.qr_code. Let's assume the backend passes it or we use a placeholder.
                                    */}
                                    <Box
                                        sx={{
                                            width: 80,
                                            height: 80,
                                            p: 0.5,
                                            borderRadius: 1,
                                            border: '1px solid #0a3d62',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            mb: 2,
                                        }}
                                    >
                                        {/* Since we are on the profile page itself, the QR code on the card usually points TO this page.
                                             Displaying it recursively might be redundant but it's part of the design.
                                             If member.qr_code is available (path), use it.
                                         */}
                                        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${window.location.href}`} alt="QR Code" style={{ width: '100%', height: '100%' }} />
                                    </Box>

                                    <Typography variant="caption" color="text.secondary">
                                        Valid Until
                                    </Typography>
                                    <Typography variant="subtitle1" fontWeight="bold" color="#0a3d62">
                                        {member.card_expiry_date ? new Date(member.card_expiry_date).toLocaleDateString() : 'N/A'}
                                    </Typography>
                                </Box>
                            </Grid>
                        </Grid>
                    </CardContent>
                    <MembershipFooter>
                        <Typography variant="h6" fontWeight="medium" sx={{ fontSize: '1.1rem' }}>
                            {member.is_family_member ? 'Supplementary Member' : member.is_corporate ? 'Corporate Member' : 'Primary Member'}
                        </Typography>
                    </MembershipFooter>
                </MembershipCard>
            </Box>
        </>
    );
}

MemberProfile.layout = (page) => page;
