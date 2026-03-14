import React, { useEffect, useState } from 'react';
import { usePage, router } from '@inertiajs/react';
import { TextField, Select, MenuItem, Button, Card, CardContent, IconButton, Typography, FormControl, InputLabel, Menu, Snackbar, Alert, Pagination } from '@mui/material';
import { MoreVert } from '@mui/icons-material';
import { Box } from '@mui/system';
import axios from 'axios';
import dayjs from 'dayjs';

const Management = () => {
    const { props } = usePage();
    const { leaveCategories } = props;

    // const [open, setOpen] = useState(true);
    const [clientName, setClientName] = useState('');
    const [selectedOption, setSelectedOption] = useState('');
    const [categories, setCategories] = useState(leaveCategories?.data || []);
    const [isLoading, setIsLoading] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    useEffect(() => {
        if (leaveCategories?.data) {
            setCategories(leaveCategories.data);
        }
    }, [leaveCategories]);

    const LeaveCard = ({ data }) => {
        const [menuAnchor, setMenuAnchor] = useState(null);
        const [deleteLoading, setDeleteLoading] = useState(false);

        const handleMenuOpen = (event) => {
            setMenuAnchor(event.currentTarget);
        };

        const handleMenuClose = () => {
            setMenuAnchor(null);
        };

        const handleDeleteClick = async (id) => {
            setDeleteLoading(true);

            try {
                const res = await axios.delete('/api/leave-categories/' + id);

                if (res.data.success) {
                    setCategories((prevCategories) => prevCategories.filter((category) => category.id !== id));
                    setSnackbar({ open: true, message: 'Leave category deleted successfully!', severity: 'success' });
                }
            } catch (error) {
                // console.log(error);
                setSnackbar({ open: true, message: error.response.data.message ?? 'Something went wrong', severity: 'error' });
            } finally {
                setDeleteLoading(false);
            }
        };

        return (
            <Card
                style={{
                    flex: '1 1 calc(33.333% - 16px)',
                    minWidth: '250px',
                    padding: '16px',
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    border: '1px solid #ccc',
                    textAlign: 'left',
                    cursor: 'pointer',
                    boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
                }}
            >
                <CardContent>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <Typography variant="h6">{data.name}</Typography>
                        <div className="relative">
                            <IconButton size="small" onClick={handleMenuOpen}>
                                <MoreVert />
                            </IconButton>
                            <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={handleMenuClose}>
                                <MenuItem onClick={() => router.visit(route('employees.leaves.category.edit', data.id))}>Edit</MenuItem>
                                <MenuItem disabled={deleteLoading} onClick={() => handleDeleteClick(data.id)}>
                                    Delete
                                </MenuItem>
                            </Menu>
                        </div>
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                            <Typography variant="body2" color="textSecondary">
                                Added
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                Status
                            </Typography>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2">{dayjs(data.created_at).format('DD MMM YYYY')}</Typography>
                            <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                                {data.status}
                            </Typography>
                        </div>
                    </div>
                    <div>
                        <Typography variant="body2" color="textSecondary" style={{ marginBottom: '6px' }}>
                            Description
                        </Typography>
                        <Typography variant="body2">{data.description}</Typography>
                    </div>
                </CardContent>
            </Card>
        );
    };

    return (
        <>
            {/* <SideNav open={open} setOpen={setOpen} /> */}
            <div
                style={{
                    minHeight: '100vh',
                    backgroundColor: '#F6F6F6',
                }}
            >
                <div style={{ padding: '2rem' }}>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography style={{ fontWeight: '700', fontSize: '30px', color: '#063455' }}>
                            Leave Categories
                        </Typography>
                        <div>
                            <Button startIcon={<span style={{
                                fontSize: '1.5rem', marginBottom: 3
                            }}>+</span>}
                                onClick={() => router.visit(route('employees.leaves.category.create'))}
                                variant="contained"
                                fullWidth
                                style={{
                                    backgroundColor: '#063455',
                                    color: 'white',
                                    textTransform: 'none',
                                    // padding: '12px',
                                    // fontSize: '16px',
                                    height: 35,
                                    borderRadius: '16px'
                                }}
                            >
                                Add Leave
                            </Button>
                        </div>
                    </div>
                    <Typography sx={{ color: '#063455', fontSize: '15px', fontWeight: '600' }}>
                        Includes casual, sick, annual, and special leave types
                    </Typography>
                    {/* Cards Section */}
                    <div style={{ display: 'flex', width: '90%', flexWrap: 'wrap', gap: '16px', justifyContent: 'flex-start', marginTop:'2rem' }}>{categories.length > 0 && categories.map((category, index) => <LeaveCard key={index} data={category} />)}</div>
                </div>
            </div>
            <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={handleCloseSnackbar}>
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} variant="filled">
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </>
    );
};

export default Management;
