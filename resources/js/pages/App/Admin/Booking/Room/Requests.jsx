import React, { useState } from 'react';
import { usePage, router } from '@inertiajs/react';
import { Box, Typography, Paper, IconButton, Table, TableBody, Tooltip, TableCell, TableContainer, TableHead, TableRow, Button, MenuItem, Select } from '@mui/material';
import { enqueueSnackbar } from 'notistack';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FaEdit } from 'react-icons/fa';
import { Search, Add } from '@mui/icons-material';
// const drawerWidthOpen = 240;
// const drawerWidthClosed = 110;

import dayjs from 'dayjs';

const BookingRequests = () => {
    const { props } = usePage();
    const { requests } = props;

    // const [open, setOpen] = useState(true);

    const handleStatusChange = (id, newStatus) => {
        router.put(
            route('rooms.request.update.status', id),
            { status: newStatus },
            {
                onSuccess: () => enqueueSnackbar('Status updated successfully', { variant: 'success' }),
                onError: () => enqueueSnackbar('Error updating status', { variant: 'error' }),
            },
        );
    };

    return (
        <>
            {/* <SideNav open={open} setOpen={setOpen} /> */}

            <div
                style={{
                    minHeight: '100vh',
                    backgroundColor: '#f5f5f5',
                }}
            >
                <Box sx={{ p: 3 }}>
                    <Box display="flex" justifyContent="space-between">
                        <div className="d-flex align-items-center">
                            <Typography sx={{ fontWeight: 700, color: '#063455', fontSize: '30px' }}>Room Request</Typography>
                        </div>
                        <Button
                            variant="contained"
                            startIcon={<Add />}
                            style={{
                                backgroundColor: '#063455',
                                textTransform: 'none',
                                borderRadius: '16px',
                                height: 35,
                                color: '#fff'
                            }}
                            onClick={() => router.visit(route('rooms.request.create'))}
                        >
                            Add Room Request
                        </Button>
                    </Box>
                    <Typography style={{ color: '#063455', fontSize: '15px', fontWeight: '600' }}>View and approve special room requests from members or guests</Typography>

                    <TableContainer sx={{ marginTop: '20px' }} component={Paper} style={{ boxShadow: 'none', overflowX: 'auto', borderRadius: '16px', marginTop: '2rem' }}>
                        <Table>
                            <TableHead>
                                <TableRow style={{ backgroundColor: '#063455', height: '60px' }}>
                                    <TableCell sx={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>ID</TableCell>
                                    <TableCell sx={{ color: '#fff', fontSize: '14px', fontWeight: 600, whiteSpace: 'nowrap' }}>Date</TableCell>
                                    <TableCell sx={{ color: '#fff', fontSize: '14px', fontWeight: 600, whiteSpace: 'nowrap' }}>Check In</TableCell>
                                    <TableCell sx={{ color: '#fff', fontSize: '14px', fontWeight: 600, whiteSpace: 'nowrap' }}>Check Out</TableCell>
                                    <TableCell sx={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>Type</TableCell>
                                    <TableCell sx={{ color: '#fff', fontSize: '14px', fontWeight: 600, whiteSpace: 'nowrap' }}>Guest/Member</TableCell>
                                    <TableCell sx={{ color: '#fff', fontSize: '14px', fontWeight: 600, whiteSpace:'nowrap' }}>Room Type</TableCell>
                                    <TableCell sx={{ color: '#fff', fontSize: '14px', fontWeight: 600, maxWidth: '200px' }}>Persons</TableCell>
                                    <TableCell sx={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>Status</TableCell>
                                    <TableCell sx={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {requests.map((req) => (
                                    <TableRow key={req.id} style={{ borderBottom: '1px solid #eee' }}>
                                        <TableCell sx={{ color: '#000', fontWeight: 600, fontSize: '14px', whiteSpace: 'nowrap' }}>{req.id}</TableCell>
                                        <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px', whiteSpace: 'nowrap' }}>{req.booking_date ? dayjs(req.booking_date).format('DD-MM-YYYY') : ''}</TableCell>
                                        <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px', whiteSpace: 'nowrap' }}>{req.check_in_date ? dayjs(req.check_in_date).format('DD-MM-YYYY') : 'N/A'}</TableCell>
                                        <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px', whiteSpace: 'nowrap' }}>{req.check_out_date ? dayjs(req.check_out_date).format('DD-MM-YYYY') : 'N/A'}</TableCell>
                                        <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px', whiteSpace: 'nowrap' }}>{req.booking_type == 0 ? 'Member' : req.booking_type == 2 ? 'Corporate Member' : req.booking_type == 'guest-1' ? 'Applied Member' : req.booking_type == 'guest-2' ? 'Affiliated Member' : 'VIP Guest'}</TableCell>
                                        {/* <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px', whiteSpace: 'nowrap' }}>{req.booking_type.startsWith('guest-') ? req.customer?.name : req.member?.full_name ? `${req.member.full_name} (${req.member.membership_no})` : req.corporate_member ? `${req.corporate_member.full_name} (${req.corporate_member.membership_no})` : 'N/A'}</TableCell> */}
                                        <TableCell sx={{
                                            color: '#7F7F7F',
                                            fontWeight: 400,
                                            fontSize: '14px',
                                            maxWidth: '120px',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap'
                                        }}>
                                            <Tooltip
                                                title={
                                                    req.booking_type.startsWith('guest-')
                                                        ? req.customer?.name
                                                        : req.member?.full_name
                                                            ? `${req.member.full_name} (${req.member.membership_no})`
                                                            : req.corporate_member
                                                                ? `${req.corporate_member.full_name} (${req.corporate_member.membership_no})`
                                                                : 'N/A'
                                                }
                                                arrow
                                            >
                                                <span>
                                                    {req.booking_type.startsWith('guest-') ? req.customer?.name : req.member?.full_name ? `${req.member.full_name} (${req.member.membership_no})` : req.corporate_member ? `${req.corporate_member.full_name} (${req.corporate_member.membership_no})` : 'N/A'}
                                                </span>
                                            </Tooltip>
                                        </TableCell>
                                        <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px', whiteSpace: 'nowrap' }}>{req.room?.name || 'N/A'}</TableCell>
                                        <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px', whiteSpace: 'nowrap' }}>{req.persons}</TableCell>
                                        {/* <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px', whiteSpace: 'nowrap' }}>{req.per_day_charge}</TableCell> */}
                                        {/* <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px', whiteSpace: 'nowrap' }}>
                                            <Select value={req.status} onChange={(e) => handleStatusChange(req.id, e.target.value)} size="small" sx={{ borderRadius: '16px' }}>
                                                <MenuItem value="pending">Pending</MenuItem>
                                                <MenuItem value="approved">Approved</MenuItem>
                                                <MenuItem value="rejected">Rejected</MenuItem>
                                            </Select>
                                        </TableCell> */}
                                        <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px', whiteSpace: 'nowrap' }}>
                                            <Select
                                                value={req.status}
                                                onChange={(e) => handleStatusChange(req.id, e.target.value)}
                                                size="small"
                                                sx={{
                                                    borderRadius: '16px',
                                                    backgroundColor: req.status === 'pending' ? '#800080' :
                                                        req.status === 'approved' ? '#008000' :
                                                            req.status === 'rejected' ? '#FF0000' : 'transparent',
                                                    color: 'white',
                                                    '& .MuiSelect-select': {
                                                        color: 'white',
                                                        fontSize: '14px'
                                                    },
                                                    '&:hover': {
                                                        backgroundColor: req.status === 'pending' ? '#6b006b' :
                                                            req.status === 'approved' ? '#006600' :
                                                                req.status === 'rejected' ? '#cc0000' : 'transparent',
                                                    }
                                                }}
                                            >
                                                <MenuItem value="pending">Pending</MenuItem>
                                                <MenuItem value="approved">Approved</MenuItem>
                                                <MenuItem value="rejected">Rejected</MenuItem>
                                            </Select>
                                        </TableCell>
                                        <TableCell>
                                            {/* <Button variant="contained" size="small" onClick={() => router.get(route('rooms.request.edit', req.id))}>
                                                Edit
                                            </Button> */}
                                            <IconButton onClick={() => router.get(route('rooms.request.edit', req.id))} size="small" title="Edit">
                                                <FaEdit size={16} style={{ marginRight: 8, color: '#f57c00' }} />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            </div>
        </>
    );
};

export default BookingRequests;
