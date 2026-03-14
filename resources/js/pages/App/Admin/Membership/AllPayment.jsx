import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    TextField,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Avatar,
    InputAdornment,
} from '@mui/material';
import {
    ArrowBack,
    Search,
} from '@mui/icons-material';
import { router } from '@inertiajs/react';


const MembersFinance = () => {
    // const [open, setOpen] = useState(true);
    // State for payment data
    const [payments, setPayments] = useState([
        {
            id: 'AFOHS-12345',
            name: 'Zahid Ullah',
            email: 'user@gmail.com',
            memberType: 'Applied Member',
            amount: 1000,
            date: 'Apr 7, 2023',
            status: 'Paid',
            avatar: '/avatar1.jpg'
        },
        {
            id: 'AFOHS-12345',
            name: 'Zahid Ullah',
            email: 'user@gmail.com',
            memberType: 'Member',
            amount: 2000,
            date: 'Apr 4, 2023',
            status: 'Paid',
            avatar: '/avatar2.jpg'
        },
        {
            id: 'AFOHS-12345',
            name: 'Zahid Ullah',
            email: 'user@gmail.com',
            memberType: 'Affiliated Member',
            amount: 3000,
            date: 'Apr 3, 2023',
            status: 'Send remind',
            avatar: '/avatar3.jpg'
        },
        {
            id: 'AFOHS-12345',
            name: 'Zahid Ullah',
            email: 'user@gmail.com',
            memberType: 'VIP Guest',
            amount: 4000,
            date: 'Apr 2, 2023',
            status: 'Paid',
            avatar: '/avatar4.jpg'
        },
        {
            id: 'AFOHS-12345',
            name: 'Zahid Ullah',
            email: 'user@gmail.com',
            memberType: 'Member',
            amount: 5000,
            date: 'Apr 2, 2023',
            status: 'Paid',
            avatar: '/avatar5.jpg'
        },
        {
            id: 'AFOHS-12345',
            name: 'Zahid Ullah',
            email: 'user@gmail.com',
            memberType: 'VIP Guest',
            amount: 5000,
            date: 'Apr 2, 2023',
            status: 'Send remind',
            avatar: '/avatar6.jpg'
        },
        {
            id: 'AFOHS-12345',
            name: 'Zahid Ullah',
            email: 'user@gmail.com',
            memberType: 'Member',
            amount: 5000,
            date: 'Apr 2, 2023',
            status: 'Paid',
            avatar: '/avatar7.jpg'
        },
        {
            id: 'AFOHS-12345',
            name: 'Zahid Ullah',
            email: 'user@gmail.com',
            memberType: 'VIP Guest',
            amount: 5000,
            date: 'Apr 2, 2023',
            status: 'Paid',
            avatar: '/avatar8.jpg'
        },
        {
            id: 'AFOHS-12345',
            name: 'Zahid Ullah',
            email: 'user@gmail.com',
            memberType: 'Member',
            amount: 5000,
            date: 'Apr 2, 2023',
            status: 'Paid',
            avatar: '/avatar9.jpg'
        }
    ]);

    // State for filtered payments
    const [filteredPayments, setFilteredPayments] = useState([]);

    // State for search query
    const [searchQuery, setSearchQuery] = useState('');

    // Initialize filtered payments with all payments
    useEffect(() => {
        setFilteredPayments(payments);
    }, [payments]);

    // Handle search
    const handleSearch = (e) => {
        const query = e.target.value.toLowerCase();
        setSearchQuery(query);

        if (query.trim() === '') {
            setFilteredPayments(payments);
        } else {
            const filtered = payments.filter(
                payment =>
                    payment.name.toLowerCase().includes(query) ||
                    payment.memberType.toLowerCase().includes(query)
            );
            setFilteredPayments(filtered);
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
                <Box sx={{ bgcolor: '#f6f6f6', minHeight: '100vh', p: 2 }}>
                    {/* Header */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        <ArrowBack sx={{ mr: 1, color: '#666' }} />
                        <Typography sx={{ color: '#063455', fontWeight:500, fontSize:'30px' }}>
                            View All Payment Status
                        </Typography>
                    </Box>

                    {/* Search and Filter */}
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                        <TextField
                            placeholder="Search name or membership type"
                            variant="outlined"
                            size="small"
                            sx={{
                                width: '350px',
                                bgcolor: 'white',
                                marginRight:3,
                                '& .MuiOutlinedInput-root': {
                                    '& fieldset': {
                                        borderColor: '#ddd',
                                    },
                                },
                            }}
                            value={searchQuery}
                            onChange={handleSearch}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Search sx={{ color: '#999' }} />
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <Button
                            variant="outlined"
                            sx={{
                                borderColor: '#ddd',
                                color: '#333',
                                bgcolor: 'white',
                                '&:hover': {
                                    bgcolor: '#f5f5f5',
                                    borderColor: '#ccc',
                                },
                            }}
                        >
                            Filter
                        </Button>
                    </Box>

                    {/* Payments Table */}
                    <TableContainer component={Paper} sx={{ boxShadow: 'none', borderRadius: 1 }}>
                        <Table sx={{ minWidth: 650 }}>
                            <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 'bold', color: '#333' }}>Membership ID</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', color: '#333' }}>Members</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', color: '#333' }}>Member Type</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', color: '#333' }}>Amount</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', color: '#333' }}>Date</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', color: '#333' }}>Status</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredPayments.map((payment, index) => (
                                    <TableRow key={index} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                        <TableCell component="th" scope="row" sx={{ color: '#666' }}>
                                            {payment.id}
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <Avatar src={payment.avatar} sx={{ mr: 1, width: 36, height: 36 }} />
                                                <Box>
                                                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                                        {payment.name}
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ color: '#666' }}>
                                                        {payment.email}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </TableCell>
                                        <TableCell sx={{ color: '#666' }}>{payment.memberType}</TableCell>
                                        <TableCell sx={{ color: '#666' }}>{payment.amount}</TableCell>
                                        <TableCell sx={{ color: '#666' }}>{payment.date}</TableCell>
                                        <TableCell>
                                            {payment.status === 'Paid' ? (
                                                <Button
                                                    size="small"
                                                    sx={{
                                                        bgcolor: '#e6f9f1',
                                                        color: '#00c07f',
                                                        fontWeight: 'bold',
                                                        borderRadius: '16px',
                                                        textTransform: 'none',
                                                        '&:hover': {
                                                            bgcolor: '#d5f0e5',
                                                        },
                                                        minWidth: '60px',
                                                        px: 2
                                                    }}
                                                >
                                                    Paid
                                                </Button>
                                            ) : (
                                                <Button
                                                    variant="contained"
                                                    size="small"
                                                    sx={{
                                                        bgcolor: '#003b5c',
                                                        '&:hover': {
                                                            bgcolor: '#002b42'
                                                        },
                                                        textTransform: 'none',
                                                        borderRadius: '16px',
                                                        fontSize: '0.75rem',
                                                        py: 0.5
                                                    }}
                                                >
                                                    Send remind
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            {/* </div> */}
        </>
    );
};

export default MembersFinance;