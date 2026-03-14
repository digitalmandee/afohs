// MembersType.jsx
import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Button, Typography, IconButton, Box, Menu, MenuItem, Grid, Card } from '@mui/material';
import { ArrowBack as ArrowBackIcon, Add as AddIcon, MoreVert as MoreVertIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { enqueueSnackbar } from 'notistack';
import AddMemberModal from '@/components/App/MemberTypes/AddModal';
import { FaEdit } from 'react-icons/fa';
const MembersType = ({ memberTypesData }) => {
    // const [open, setOpen] = useState(true);
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedMember, setSelectedMember] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingMember, setEditingMember] = useState(null);
    const [memberTypes, setMemberTypes] = useState(memberTypesData || []);
    const { props } = usePage();
    const csrfToken = props._token;

    const handleMenuOpen = (event, member) => {
        setAnchorEl(event.currentTarget);
        setSelectedMember(member);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedMember(null);
    };

    const handleAdd = () => {
        setEditingMember(null);
        setModalOpen(true);
    };

    const handleEdit = () => {
        if (selectedMember) {
            setEditingMember(selectedMember);
            setModalOpen(true);
        }
        handleMenuClose();
    };

    const handleDelete = async () => {
        if (selectedMember) {
            try {
                await axios.delete(route('member-types.destroy', selectedMember.id), {
                    headers: { 'X-CSRF-TOKEN': csrfToken },
                });
                setMemberTypes((prev) => prev.filter((type) => type.id !== selectedMember.id));
                enqueueSnackbar('Member Type deleted successfully.', { variant: 'success' });
            } catch (error) {
                enqueueSnackbar('Failed to delete: ' + (error.response?.data?.message || error.message), { variant: 'error' });
            }
        }
        handleMenuClose();
    };

    const handleSuccess = (data) => {
        setMemberTypes((prev) => {
            const exists = prev.find((p) => p.id === data.id);
            return exists ? prev.map((p) => (p.id === data.id ? data : p)) : [...prev, data];
        });
        setModalOpen(false);
        setEditingMember(null);
    };

    return (
        <>
            {/* <SideNav open={open} setOpen={setOpen} /> */}
            <Box
                sx={{
                    // marginLeft: open ? `${drawerWidthOpen}px` : `${drawerWidthClosed}px`,
                    // transition: 'margin-left 0.3s ease-in-out',
                    // marginTop: '5rem',
                    backgroundColor: '#f5f5f5',
                    minHeight: '100vh',
                    padding: '20px',
                }}
            >
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {/* <IconButton onClick={() => window.history.back()}>
                            <ArrowBackIcon sx={{ color: '#063455' }} />
                        </IconButton> */}
                        <Typography variant="h5" sx={{ fontWeight: 700, fontSize: '30px', color: '#063455' }}>
                            Members Type
                        </Typography>
                    </Box>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <Button
                            variant="outlined"
                            startIcon={<DeleteIcon />}
                            onClick={() => router.get(route('member-types.trashed'))}
                            sx={{
                                color: '#d32f2f',
                                borderColor: '#d32f2f',
                                borderRadius: '16px',
                                textTransform:'none',
                                '&:hover': {
                                    backgroundColor: '#ffebee',
                                    borderColor: '#d32f2f',
                                },
                            }}
                        >
                            Deleted Member Types
                        </Button>
                        <Button variant="contained" startIcon={<AddIcon sx={{ fontSize: '20px' }} />} sx={{ backgroundColor: '#063455', borderRadius: '16px', textTransform:'none' }} onClick={handleAdd}>
                            Add Type
                        </Button>
                    </div>
                </Box>
                <Typography style={{ color: '#063455', fontSize: '15px', fontWeight: '600' }}>
                    Define and manage different membership types offered by the club.
                </Typography>

                <Grid container spacing={3} style={{ marginTop: 5 }}>
                    {memberTypes.map((type) => (
                        <Grid item xs={12} sm={6} md={4} key={type.id}>
                            <Card sx={{ p: 2, border: '1px solid #ddd', borderRadius:'16px' }}>
                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                    <Typography fontWeight={500}>{type.name}</Typography>
                                    <IconButton onClick={(e) => handleMenuOpen(e, type)}>
                                        <MoreVertIcon />
                                    </IconButton>
                                </Box>
                            </Card>
                        </Grid>
                    ))}
                </Grid>

                <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
                    <MenuItem onClick={handleEdit}>
                        <FaEdit size={16} style={{ marginRight: 15, color:'#f57c00' }} /> Edit
                    </MenuItem>
                    <MenuItem onClick={handleDelete}>
                        <DeleteIcon color='error' sx={{ mr: 1 }} /> Delete
                    </MenuItem>
                </Menu>
            </Box>

            <AddMemberModal open={modalOpen} handleClose={() => setModalOpen(false)} memberType={editingMember} onSuccess={handleSuccess} />
        </>
    );
};

export default MembersType;
