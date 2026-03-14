import React, { useState } from 'react';
import { Typography, Button, createTheme, ThemeProvider, IconButton, Table, Tooltip, TableContainer, TableHead, TableRow, TableCell, TableBody, Paper, InputAdornment, TextField } from '@mui/material';
import { Search, FilterAlt, Delete } from '@mui/icons-material';
import 'bootstrap/dist/css/bootstrap.min.css';
import { router } from '@inertiajs/react';
import AppliedMemberInvoice from './AppliedMemberInvoice';
import AppliedMemberForm from './AppliedMemberForm';
import AppliedMemberFilter from './AppliedMemberFilter';
import dayjs from 'dayjs';
import { FaEdit } from 'react-icons/fa';

const AppliedMember = ({ familyGroups = [], memberData = null, mode = 'list' }) => {
    const [open, setOpen] = useState(true);
    const [openInvoiceModal, setOpenInvoiceModal] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);

    const formatCnic = (cnic) => {
        if (!cnic || cnic.length !== 13) return 'N/A';
        return `${cnic.slice(0, 5)}- ${cnic.slice(5, 12)}- ${cnic.slice(12)}`;
    };

    const handleViewInvoice = (member) => {
        if (member.invoice) {
            // Attach member details to invoice object for the modal
            const invoiceWithMember = {
                ...member.invoice,
                invoiceable: member,
            };
            setSelectedInvoice(invoiceWithMember);
            setOpenInvoiceModal(true);
        } else {
            alert('No invoice found for this member.');
        }
    };

    return (
        <>
            {/* <SideNav open={open} setOpen={setOpen} />
            <div
                style={{
                    marginLeft: open ? `${drawerWidthOpen}px` : `${drawerWidthClosed}px`,
                    transition: 'margin-left 0.3s ease-in-out',
                    marginTop: '5rem',
                    backgroundColor: '#F6F6F6',
                }}
            > */}
            <div className="container-fluid p-4" style={{ backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
                
                    {mode === 'create' || mode === 'edit' ? (
                        <AppliedMemberForm memberData={memberData} />
                    ) : (
                        <>
                            <div className="d-flex justify-content-between align-items-center">
                                <div className="d-flex align-items-center">
                                    <Typography sx={{ fontWeight: 700, color: '#063455', fontSize: '30px' }}>Applied Member</Typography>
                                    {/* <pre>{JSON.stringify(familyGroups, null, 2)}</pre> */}
                                </div>
                                <div className="d-flex align-items-center gap-2">
                                    {/* <Button
                                    variant="outlined"
                                    startIcon={<Delete />}
                                    onClick={() => router.get(route('applied-member.trashed'))}
                                    sx={{
                                        color: '#d32f2f',
                                        borderColor: '#d32f2f',
                                        borderRadius: '16px',
                                        textTransform: 'none',
                                        '&:hover': {
                                            backgroundColor: '#ffebee',
                                            borderColor: '#d32f2f',
                                        },
                                    }}
                                >
                                    Deleted Applied Members
                                </Button> */}
                                    <Button
                                        variant="contained"
                                        startIcon={<span style={{ fontSize: '1.5rem', marginBottom: 5 }}>+</span>}
                                        style={{
                                            backgroundColor: '#063455',
                                            textTransform: 'none',
                                            height: 40,
                                            // width: 240,
                                            borderRadius: '16px',
                                        }}
                                        onClick={() => router.visit(route('applied-member.index'), { data: { mode: 'create' } })}
                                    >
                                        Add Applied Member
                                    </Button>
                                </div>
                            </div>
                            <Typography style={{ color: '#063455', fontSize: '15px', fontWeight: '600' }}>
                                View and process new membership applications
                            </Typography>
                            <div className="mb-4 mt-5">
                                <AppliedMemberFilter open={true} />

                                <div style={{ overflowX: 'auto', width: '100%' }}>
                                    <TableContainer component={Paper} style={{ boxShadow: 'none', borderRadius: '16px' }}>
                                        <Table>
                                            <TableHead>
                                                <TableRow style={{ backgroundColor: '#063455', height: '60px' }}>
                                                    <TableCell sx={{ color: '#fff', fontSize: '14px', fontWeight: 600, whiteSpace: 'nowrap' }}>ID</TableCell>
                                                    <TableCell sx={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>Name</TableCell>
                                                    <TableCell sx={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>Email</TableCell>
                                                    <TableCell sx={{ color: '#fff', fontSize: '14px', fontWeight: 600, whiteSpace: 'nowrap' }}>Phone Number</TableCell>
                                                    <TableCell sx={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>Address</TableCell>
                                                    <TableCell sx={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>CNIC</TableCell>
                                                    <TableCell sx={{ color: '#fff', fontSize: '14px', fontWeight: 600, whiteSpace: 'nowrap' }}>Amount Paid</TableCell>
                                                    <TableCell sx={{ color: '#fff', fontSize: '14px', fontWeight: 600, whiteSpace: 'nowrap' }}>Start Date</TableCell>
                                                    <TableCell sx={{ color: '#fff', fontSize: '14px', fontWeight: 600, whiteSpace: 'nowrap' }}>End Date</TableCell>
                                                    <TableCell sx={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>Invoice</TableCell>
                                                    <TableCell sx={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>Actions</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {familyGroups.map((member, index) => (
                                                    <TableRow key={member.id} style={{ borderBottom: '1px solid #eee' }}>
                                                        <TableCell sx={{ color: '#000', fontWeight: 600, fontSize: '14px' }}>{member.id}</TableCell>
                                                        {/* <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px' }}>{member.name}</TableCell> */}
                                                        <TableCell sx={{
                                                            color: '#7F7F7F',
                                                            fontWeight: 400,
                                                            fontSize: '14px',
                                                            maxWidth: '150px',
                                                            whiteSpace: 'nowrap',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis'
                                                        }}>
                                                            <Tooltip title={member.name} placement="top">
                                                                <span>{member.name}</span>
                                                            </Tooltip>
                                                        </TableCell>
                                                        {/* <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px' }}>{member.email}</TableCell> */}
                                                        <TableCell sx={{
                                                            color: '#7F7F7F',
                                                            fontWeight: 400,
                                                            fontSize: '14px',
                                                            maxWidth: '150px',
                                                            whiteSpace: 'nowrap',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis'
                                                        }}>
                                                            <Tooltip title={member.email} placement="top">
                                                                <span>{member.email}</span>
                                                            </Tooltip>
                                                        </TableCell>
                                                        {/* <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px' }}>{member.phone_number || 'N/A'}</TableCell> */}
                                                        <TableCell sx={{
                                                            color: '#7F7F7F',
                                                            fontWeight: 400,
                                                            fontSize: '14px',
                                                            maxWidth: '150px',
                                                            whiteSpace: 'nowrap',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis'
                                                        }}>
                                                            <Tooltip title={member.phone_number || 'N/A'} placement="top">
                                                                <span>{member.phone_number || 'N/A'}</span>
                                                            </Tooltip>
                                                        </TableCell>
                                                        {/* <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px' }}>{member.address || 'N/A'}</TableCell> */}
                                                        <TableCell sx={{
                                                            color: '#7F7F7F',
                                                            fontWeight: 400,
                                                            fontSize: '14px',
                                                            maxWidth: '150px',
                                                            whiteSpace: 'nowrap',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis'
                                                        }}>
                                                            <Tooltip title={member.address || 'N/A'} placement="top">
                                                                <span>{member.address || 'N/A'}</span>
                                                            </Tooltip>
                                                        </TableCell>
                                                        <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px', whiteSpace: 'nowrap' }}>{member.cnic}</TableCell>
                                                        {/* <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px' }}>{member.amount_paid}</TableCell> */}
                                                        <TableCell sx={{
                                                            color: '#7F7F7F',
                                                            fontWeight: 400,
                                                            fontSize: '14px',
                                                            maxWidth: '150px',
                                                            whiteSpace: 'nowrap',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis'
                                                        }}>
                                                            <Tooltip title={member.amount_paid} placement="top">
                                                                <span>{member.amount_paid}</span>
                                                            </Tooltip>
                                                        </TableCell>
                                                        <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px', whiteSpace: 'nowrap' }}>{member.start_date ? dayjs(member.start_date).format('DD-MM-YYYY') : 'N/A'}</TableCell>
                                                        <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px', whiteSpace: 'nowrap' }}>{member.end_date ? dayjs(member.end_date).format('DD-MM-YYYY') : 'N/A'}</TableCell>
                                                        <TableCell>
                                                            <Button variant="outlined" onClick={() => handleViewInvoice(member)} sx={{ color: '#063455', border: '1px solid #063455', textTransform: 'none' }}>
                                                                View
                                                            </Button>
                                                        </TableCell>
                                                        {/* {member.is_permanent_member ? (
                                                        <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px' }}>Permanent Member</TableCell>
                                                    ) : (
                                                        <TableCell>
                                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                                {/* <Button
                                                                    variant="text"
                                                                    disabled={member.is_permanent_member}
                                                                    onClick={() =>
                                                                        router.visit(route('applied-member.index'), {
                                                                            data: { mode: 'edit', id: member.id },
                                                                        })
                                                                    }
                                                                >
                                                                    Edit
                                                                </Button>
                                                                <Tooltip title="Edit">
                                                                    <IconButton
                                                                        size="small"
                                                                        disabled={member.is_permanent_member}
                                                                        onClick={() =>
                                                                            router.visit(route('applied-member.index'), {
                                                                                data: { mode: 'edit', id: member.id },
                                                                            })
                                                                        }
                                                                        sx={{
                                                                            color: member.is_permanent_member ? '#7f7f7f' : '#f57c00'
                                                                        }}
                                                                    >
                                                                        <FaEdit />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            </div>
                                                        </TableCell>
                                                    )} */}
                                                        <TableCell>
                                                            <Tooltip title={member.is_permanent_member ? "Permanent Member" : "Edit"}>
                                                                <IconButton
                                                                    size="small"
                                                                    disabled={member.is_permanent_member}
                                                                    onClick={() =>
                                                                        !member.is_permanent_member &&
                                                                        router.visit(route('applied-member.index'), {
                                                                            data: { mode: 'edit', id: member.id },
                                                                        })
                                                                    }
                                                                    sx={{
                                                                        color: member.is_permanent_member ? '#7f7f7f' : '#f57c00'
                                                                    }}
                                                                >
                                                                    <FaEdit />
                                                                </IconButton>
                                                            </Tooltip>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </div>
                            </div>
                        </>
                    )}
                    <AppliedMemberInvoice open={openInvoiceModal} onClose={() => setOpenInvoiceModal(false)} invoice={selectedInvoice} />
                
            </div>
            {/* </div> */}
        </>
    );
};

export default AppliedMember;
