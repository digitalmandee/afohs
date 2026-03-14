import React, { useState, useEffect } from 'react';
import { Box, Typography, Avatar, IconButton, Radio, RadioGroup, FormControlLabel, Paper, Grid, Switch, Drawer, Card, CardContent } from '@mui/material';
import { Close as CloseIcon, Edit as EditIcon, MoreVert as MoreVertIcon } from '@mui/icons-material';
import axios from 'axios';
import { router } from '@inertiajs/react';

const MemberProfileModal = ({ open, onClose, member, memberData }) => {
    const [memberType, setMemberType] = useState(member?.member?.member_type?.id || 'Member');
    const [memberStatus, setMemberStatus] = useState(member?.member?.card_status || 'active');
    const [memberTypes, setMemberTypes] = useState([]);

    useEffect(() => {
        if (open && memberData) {
            const types = [...new Set(memberData.map((m) => m?.member?.member_type?.name).filter(Boolean))].map((name, index) => ({ id: index + 1, name }));

            setMemberTypes(
                types.length > 0
                    ? types
                    : [
                          { id: 1, name: 'Basic' },
                          { id: 2, name: 'Affiliated' },
                          { id: 3, name: 'Applied' },
                      ],
            );
        }
    }, [open, memberData]);

    const handleMemberTypeChange = async (event) => {
        const newType = event.target.value;
        setMemberType(newType);
        try {
            await axios.put(`/api/members/${member?.member?.id}/type`, { member_type: newType });
        } catch (err) {
            console.error('Failed to update member type:', err);
        }
    };

    const handleMemberStatusChange = async (event) => {
        const newStatus = event.target.value;
        setMemberStatus(newStatus);
        const memberId = member?.member?.id;
        if (!memberId) return;

        try {
            await axios.put(`/api/members/${memberId}/status`, { card_status: newStatus });
        } catch (err) {
            console.error('Failed to update member status:', err);
        }
    };

    return (
        <Drawer
            anchor="right"
            open={open}
            onClose={onClose}
            ModalProps={{ keepMounted: true }}
            PaperProps={{
                sx: {
                    width: 600,
                    m: 2,
                    borderRadius: 2,
                    maxHeight: 'calc(100% - 40px)',
                },
            }}
        >
            <Box sx={{ px: 2, py: 2 }}>
                <Paper elevation={0} sx={{ borderRadius: 2 }}>
                    {/* Header */}
                    <Box sx={{ px: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Avatar src={member?.profile_photo || '/placeholder.svg'} sx={{ width: 80, height: 80, border: '2px solid #e0e0e0', mr: 2 }} />
                                <Box>
                                    <Typography variant="h5" sx={{ fontWeight: 500 }}>
                                        {member?.first_name + ' ' + member?.last_name || 'N/A'}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Member ID: {member?.member?.member_category?.name} {member?.member?.membership_no || 'N/A'}
                                    </Typography>
                                </Box>
                            </Box>
                            <Box>
                                <IconButton size="small" onClick={() => router.visit(route('membership.edit', member?.id))}>
                                    <EditIcon fontSize="small" />
                                </IconButton>
                                <IconButton size="small" onClick={onClose}>
                                    <CloseIcon fontSize="small" />
                                </IconButton>
                            </Box>
                        </Box>

                        {/* Contact Info */}
                        <Grid container spacing={3}>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="body2" color="text.secondary">
                                    Email
                                </Typography>
                                <Typography variant="body1">{member?.email || 'N/A'}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="body2" color="text.secondary">
                                    Phone
                                </Typography>
                                <Typography variant="body1">{member?.phone_number || 'N/A'}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="body2" color="text.secondary">
                                    Joined
                                </Typography>
                                <Typography variant="body1">{member?.member?.created_at ? new Date(member.member.membership_date).toLocaleDateString() : 'N/A'}</Typography>
                            </Grid>
                        </Grid>
                    </Box>

                    {/* Member Type */}
                    <Box sx={{ px: 3, py: 2 }}>
                        <Typography variant="body1" sx={{ mb: 1, fontWeight: 500 }}>
                            Member Type
                        </Typography>
                        {memberTypes.length === 0 ? (
                            <Typography variant="body2" color="text.secondary">
                                No member types available
                            </Typography>
                        ) : (
                            <RadioGroup row value={memberType} onChange={handleMemberTypeChange}>
                                {memberTypes.map((type) => (
                                    <FormControlLabel
                                        key={type.id}
                                        value={type.id}
                                        control={<Radio />}
                                        label={type.name}
                                        sx={{
                                            mr: 2,
                                            border: '1px solid #e0e0e0',
                                            borderRadius: 1,
                                            px: 1,
                                            backgroundColor: memberType === type.name ? '#f8f9fa' : 'transparent',
                                        }}
                                    />
                                ))}
                            </RadioGroup>
                        )}
                    </Box>

                    {/* Member Status */}
                    <Box sx={{ px: 3, py: 2 }}>
                        <Card variant="outlined" sx={{ borderRadius: 1 }}>
                            <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
                                <Box sx={{ width: 250 }}>
                                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                        Member Status
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                                        If deactivated, member will not get membership facilities
                                    </Typography>
                                </Box>
                                <Box sx={{ ml: 2 }}>
                                    <Switch checked={memberStatus === 'active'} onChange={(e) => setMemberStatus(e.target.checked ? 'active' : 'inactive')} />
                                    <RadioGroup row value={memberStatus} onChange={handleMemberStatusChange}>
                                        <FormControlLabel value="active" control={<Radio size="small" />} label="Active" />
                                        <FormControlLabel value="inactive" control={<Radio size="small" />} label="Inactive" />
                                    </RadioGroup>
                                </Box>
                            </CardContent>
                        </Card>
                    </Box>

                    {/* Address */}
                    <Box sx={{ px: 3, py: 2, pb: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                Address
                            </Typography>
                            <IconButton size="small">
                                <MoreVertIcon fontSize="small" />
                            </IconButton>
                        </Box>
                        <Typography variant="body1">{member?.user_detail?.current_address || 'N/A'}</Typography>
                        <Typography variant="body2" color="text.secondary">
                            {member?.user_detail?.current_city && member?.user_detail?.current_country ? `${member.user_detail.current_city}, ${member.user_detail.current_country}` : 'Not Provided'}
                        </Typography>
                    </Box>
                </Paper>
            </Box>
        </Drawer>
    );
};

export default MemberProfileModal;
