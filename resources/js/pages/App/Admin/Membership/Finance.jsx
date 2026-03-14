import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Avatar, Dialog, DialogContent, Select, MenuItem, FormControl, Chip, InputAdornment, Grid, Card, CardContent } from '@mui/material';
import { ArrowBack, Search, FilterAlt, CreditCard, CalendarMonth, PendingActions, Close, KeyboardArrowDown } from '@mui/icons-material';
import 'bootstrap/dist/css/bootstrap.min.css';
import { router } from '@inertiajs/react';


const MembersFinance = ({ membersdata = [] }) => {
    // const [open, setOpen] = useState(true);
    // State for filter modal
    const [openFilter, setOpenFilter] = useState(false);

    // State for payment data
    const [payments, setPayments] = useState([
        {
            id: 'AFOHS-12345',
            name: 'Zahid Ullah',
            email: 'user@gmail.com',
            memberType: 'Member',
            amount: 1000,
            date: 'Apr 7, 2025',
            status: 'Paid',
            avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
        },
        {
            id: 'AFOHS-12345',
            name: 'Zahid Ullah',
            email: 'user@gmail.com',
            memberType: 'Affiliated Member',
            amount: 2000,
            date: 'Apr 4, 2025',
            status: 'Paid',
            avatar: 'https://randomuser.me/api/portraits/men/33.jpg',
        },
        {
            id: 'AFOHS-12345',
            name: 'Zahid Ullah',
            email: 'user@gmail.com',
            memberType: 'Applied Member',
            amount: 3000,
            date: 'Apr 3, 2025',
            status: 'Pending',
            avatar: 'https://randomuser.me/api/portraits/men/34.jpg',
        },
        {
            id: 'AFOHS-12345',
            name: 'Zahid Ullah',
            email: 'user@gmail.com',
            memberType: 'VIP Guest',
            amount: 4000,
            date: 'Apr 2, 2025',
            status: 'Paid',
            avatar: 'https://randomuser.me/api/portraits/men/35.jpg',
        },
        {
            id: 'AFOHS-12345',
            name: 'Zahid Ullah',
            email: 'user@gmail.com',
            memberType: 'Member',
            amount: 5000,
            date: 'Apr 2, 2025',
            status: 'Paid',
            avatar: 'https://randomuser.me/api/portraits/men/36.jpg',
        },
    ]);

    // State for filtered payments
    const [filteredPayments, setFilteredPayments] = useState([]);

    // State for search query
    const [searchQuery, setSearchQuery] = useState('');

    // State for filter options
    const [filterOptions, setFilterOptions] = useState({
        paymentType: 'All Type',
        month: '',
        year: '',
    });

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
            const filtered = payments.filter((payment) => payment.name.toLowerCase().includes(query) || payment.memberType.toLowerCase().includes(query));
            setFilteredPayments(filtered);
        }
    };

    // Handle filter modal open/close - FIXED
    const handleFilterOpen = () => {
        setOpenFilter(true);
    };

    const handleFilterClose = () => {
        setOpenFilter(false);
    };

    // Handle filter changes
    const handleFilterChange = (field, value) => {
        setFilterOptions({
            ...filterOptions,
            [field]: value,
        });
    };

    // Apply filters
    const applyFilters = () => {
        let filtered = [...payments];

        // Filter by payment type
        if (filterOptions.paymentType !== 'All Type') {
            const statusMap = {
                Paid: 'Paid',
                Pending: 'Pending',
                Refunded: 'Refunded',
            };

            filtered = filtered.filter((payment) => payment.status === statusMap[filterOptions.paymentType]);
        }

        // Additional filters for month/year could be added here

        setFilteredPayments(filtered);
        handleFilterClose(); // Close modal after applying filters
    };

    // Reset filters
    const resetFilters = () => {
        setFilterOptions({
            paymentType: 'All Type',
            month: '',
            year: '',
        });
        setFilteredPayments(payments);
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
            <Box sx={{ bgcolor: '#f9f9f9', minHeight: '100vh', pb: 4 }}>
                {/* Header */}
                <Box sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
                    <Typography sx={{ fontWeight: 700, color: '#063455', fontSize: '30px' }}>
                        Finance
                    </Typography>

                    <Typography sx={{ color: '#063455', fontSize: '15px', fontWeight: 600 }}>
                        Handle membership fees, payments, and financial records.
                    </Typography>
                </Box>
                {/* Summary Cards */}
                <Box sx={{ px: 2, mb: 4, mt: 5 }}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={4}>
                            <Card sx={{ bgcolor: '#063455', color: 'white', height: '100%', borderRadius: '16px' }}>
                                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                                    <Box
                                        sx={{
                                            bgcolor: 'transparent',
                                            width: 40,
                                            height: 40,
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            margin: '0 auto',
                                            mb: 1,
                                        }}
                                    >
                                        <CreditCard />
                                    </Box>
                                    <Typography sx={{ fontSize: 14, mb: 1 }}>Total Payments</Typography>
                                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                                        0
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <Card sx={{ bgcolor: '#063455', color: 'white', height: '100%', borderRadius: '16px' }}>
                                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                                    <Box
                                        sx={{
                                            bgcolor: 'transparent',
                                            width: 40,
                                            height: 40,
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            margin: '0 auto',
                                            mb: 1,
                                        }}
                                    >
                                        <CalendarMonth />
                                    </Box>
                                    <Typography sx={{ fontSize: 14, mb: 1 }}>This Month</Typography>
                                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                                        0
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <Card sx={{ bgcolor: '#063455', color: 'white', height: '100%', borderRadius: '16px' }}>
                                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                                    <Box
                                        sx={{
                                            bgcolor: 'transparent',
                                            width: 40,
                                            height: 40,
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            margin: '0 auto',
                                            mb: 1,
                                        }}
                                    >
                                        <PendingActions />
                                    </Box>
                                    <Typography sx={{ fontSize: 14, mb: 1 }}>Pending</Typography>
                                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                                        0
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </Box>

                {/* Membership Payments Section */}
                <Box sx={{ px: 2 }}>
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            mb: 3,
                            flexWrap: 'wrap',
                            gap: 2,
                        }}
                    >
                        {/* Left side text */}
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                            New Membership Payment
                        </Typography>

                        {/* Right side controls */}
                        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                            <TextField
                                placeholder="Search name or membership type"
                                variant="outlined"
                                size="small"
                                sx={{
                                    maxWidth: { xs: '100%', md: '400px' },
                                    bgcolor: 'white',
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
                                startIcon={<FilterAlt />}
                                onClick={handleFilterOpen}
                                sx={{
                                    borderColor: '#ddd',
                                    color: '#333',
                                    bgcolor: 'white',
                                    borderRadius: '16px',
                                    '&:hover': {
                                        bgcolor: '#f5f5f5',
                                        borderColor: '#ccc',
                                    },
                                }}
                            >
                                Filter
                            </Button>

                            <Button
                                variant="outlined"
                                sx={{
                                    borderColor: '#ddd',
                                    color: '#333',
                                    bgcolor: 'white',
                                    borderRadius: '16px',
                                    '&:hover': {
                                        bgcolor: '#f5f5f5',
                                        borderColor: '#ccc',
                                    },
                                }}
                                onClick={() => router.visit(route('membership.allpayment'))}
                            >
                                View All
                            </Button>
                        </Box>
                    </Box>

                    {/* Payments Table */}
                    <TableContainer component={Paper} sx={{ boxShadow: 'none', borderRadius: '16px' }}>
                        <Table sx={{ minWidth: 650 }}>
                            <TableHead sx={{ bgcolor: '#063455' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: '600', fontSize: '14px', color: '#fff' }}>Membership ID</TableCell>
                                    <TableCell sx={{ fontWeight: '600', fontSize: '14px', color: '#fff' }}>Members</TableCell>
                                    <TableCell sx={{ fontWeight: '600', fontSize: '14px', color: '#fff' }}>Member Type</TableCell>
                                    <TableCell sx={{ fontWeight: '600', fontSize: '14px', color: '#fff' }}>Amount</TableCell>
                                    <TableCell sx={{ fontWeight: '600', fontSize: '14px', color: '#fff' }}>Date</TableCell>
                                    <TableCell sx={{ fontWeight: '600', fontSize: '14px', color: '#fff' }}>Status</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {membersdata.map((payment, index) => (
                                    <TableRow key={index} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                        <TableCell component="th" scope="row" sx={{ color: '#666' }}>
                                            {payment.user_id}
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
                                        <TableCell sx={{ color: '#666' }}>{payment.memberType || 'N/A'}</TableCell>
                                        <TableCell sx={{ color: '#666' }}>{payment.amount || 'N/A'}</TableCell>
                                        <TableCell sx={{ color: '#666' }}>{payment.date || 'N/A'}</TableCell>
                                        <TableCell>
                                            {payment.status === 'Paid' ? (
                                                <Chip
                                                    label="Paid"
                                                    size="small"
                                                    sx={{
                                                        bgcolor: '#e6f9f1',
                                                        color: '#00c07f',
                                                        fontWeight: 'bold',
                                                        borderRadius: '16px',
                                                    }}
                                                />
                                            ) : (
                                                <Button
                                                    variant="contained"
                                                    size="small"
                                                    sx={{
                                                        bgcolor: '#003b5c',
                                                        '&:hover': {
                                                            bgcolor: '#002b42',
                                                        },
                                                        textTransform: 'none',
                                                        borderRadius: '16px',
                                                        fontSize: '0.75rem',
                                                        py: 0.5,
                                                    }}
                                                >
                                                    Send Remind
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>

                {/* Filter Modal - FIXED */}
                <Dialog
                    open={openFilter}
                    onClose={handleFilterClose}
                    maxWidth="sm"
                    PaperProps={{
                        sx: {
                            position: 'absolute',
                            top: 20,
                            right: 20,
                            m: 0,
                            width: 400,
                            maxWidth: '90vw',
                            borderRadius: 1,
                            p: 2,
                        },
                    }}
                    BackdropProps={{
                        onClick: handleFilterClose, // Ensure clicking backdrop closes modal
                    }}
                >
                    <DialogContent sx={{ p: 0 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                Finance Filter
                            </Typography>
                            <IconButton
                                onClick={handleFilterClose}
                                size="small"
                                sx={{ p: 1 }} // Increase padding for better touch target
                            >
                                <Close />
                            </IconButton>
                        </Box>

                        <Box sx={{ mb: 3 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                                    Payment Type
                                </Typography>
                                <KeyboardArrowDown sx={{ color: '#999' }} />
                            </Box>

                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                <Chip
                                    label="All Type"
                                    onClick={() => handleFilterChange('paymentType', 'All Type')}
                                    sx={{
                                        bgcolor: filterOptions.paymentType === 'All Type' ? '#003b5c' : '#e8f4fd',
                                        color: filterOptions.paymentType === 'All Type' ? 'white' : '#333',
                                        borderRadius: '16px',
                                        '&:hover': {
                                            bgcolor: filterOptions.paymentType === 'All Type' ? '#002b42' : '#d8eafc',
                                        },
                                    }}
                                />
                                <Chip
                                    label="Paid"
                                    onClick={() => handleFilterChange('paymentType', 'Paid')}
                                    sx={{
                                        bgcolor: filterOptions.paymentType === 'Paid' ? '#003b5c' : '#e8f4fd',
                                        color: filterOptions.paymentType === 'Paid' ? 'white' : '#333',
                                        borderRadius: '16px',
                                        '&:hover': {
                                            bgcolor: filterOptions.paymentType === 'Paid' ? '#002b42' : '#d8eafc',
                                        },
                                    }}
                                />
                                <Chip
                                    label="Pending"
                                    onClick={() => handleFilterChange('paymentType', 'Pending')}
                                    sx={{
                                        bgcolor: filterOptions.paymentType === 'Pending' ? '#003b5c' : '#e8f4fd',
                                        color: filterOptions.paymentType === 'Pending' ? 'white' : '#333',
                                        borderRadius: '16px',
                                        '&:hover': {
                                            bgcolor: filterOptions.paymentType === 'Pending' ? '#002b42' : '#d8eafc',
                                        },
                                    }}
                                />
                                <Chip
                                    label="Refunded"
                                    onClick={() => handleFilterChange('paymentType', 'Refunded')}
                                    sx={{
                                        bgcolor: filterOptions.paymentType === 'Refunded' ? '#003b5c' : '#e8f4fd',
                                        color: filterOptions.paymentType === 'Refunded' ? 'white' : '#333',
                                        borderRadius: '16px',
                                        '&:hover': {
                                            bgcolor: filterOptions.paymentType === 'Refunded' ? '#002b42' : '#d8eafc',
                                        },
                                    }}
                                />
                            </Box>
                        </Box>

                        <Box sx={{ mb: 4 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                                    Check by Month/Year
                                </Typography>
                                <KeyboardArrowDown sx={{ color: '#999' }} />
                            </Box>

                            <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" sx={{ mb: 1 }}>
                                    Select Month
                                </Typography>
                                <FormControl fullWidth size="small">
                                    <Select
                                        value={filterOptions.month}
                                        onChange={(e) => handleFilterChange('month', e.target.value)}
                                        displayEmpty
                                        renderValue={(selected) => {
                                            if (!selected) {
                                                return <Typography sx={{ color: '#999' }}>Select month</Typography>;
                                            }
                                            return selected;
                                        }}
                                        sx={{
                                            bgcolor: 'white',
                                            '& .MuiOutlinedInput-notchedOutline': {
                                                borderColor: '#ddd',
                                            },
                                        }}
                                    >
                                        <MenuItem value="January">January</MenuItem>
                                        <MenuItem value="February">February</MenuItem>
                                        <MenuItem value="March">March</MenuItem>
                                        <MenuItem value="April">April</MenuItem>
                                        <MenuItem value="May">May</MenuItem>
                                        <MenuItem value="June">June</MenuItem>
                                        <MenuItem value="July">July</MenuItem>
                                        <MenuItem value="August">August</MenuItem>
                                        <MenuItem value="September">September</MenuItem>
                                        <MenuItem value="October">October</MenuItem>
                                        <MenuItem value="November">November</MenuItem>
                                        <MenuItem value="December">December</MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>

                            <Box>
                                <Typography variant="body2" sx={{ mb: 1 }}>
                                    Select Year
                                </Typography>
                                <FormControl fullWidth size="small">
                                    <Select
                                        value={filterOptions.year}
                                        onChange={(e) => handleFilterChange('year', e.target.value)}
                                        displayEmpty
                                        renderValue={(selected) => {
                                            if (!selected) {
                                                return <Typography sx={{ color: '#999' }}>Select year</Typography>;
                                            }
                                            return selected;
                                        }}
                                        sx={{
                                            bgcolor: 'white',
                                            '& .MuiOutlinedInput-notchedOutline': {
                                                borderColor: '#ddd',
                                            },
                                        }}
                                    >
                                        <MenuItem value="2023">2023</MenuItem>
                                        <MenuItem value="2024">2024</MenuItem>
                                        <MenuItem value="2025">2025</MenuItem>
                                        <MenuItem value="2026">2026</MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>
                        </Box>

                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                            <Button
                                variant="outlined"
                                onClick={handleFilterClose} // Ensure this calls the close function
                                sx={{
                                    borderColor: '#ddd',
                                    color: '#333',
                                    '&:hover': {
                                        bgcolor: '#f5f5f5',
                                        borderColor: '#ccc',
                                    },
                                    textTransform: 'none',
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="outlined"
                                onClick={resetFilters}
                                sx={{
                                    borderColor: '#ddd',
                                    color: '#333',
                                    '&:hover': {
                                        bgcolor: '#f5f5f5',
                                        borderColor: '#ccc',
                                    },
                                    textTransform: 'none',
                                }}
                            >
                                Reset Filter
                            </Button>
                            <Button
                                variant="contained"
                                onClick={applyFilters} // This will apply filters and close the modal
                                sx={{
                                    bgcolor: '#003b5c',
                                    '&:hover': {
                                        bgcolor: '#002b42',
                                    },
                                    textTransform: 'none',
                                }}
                            >
                                Apply Filters
                            </Button>
                        </Box>
                    </DialogContent>
                </Dialog>
            </Box>
            {/* </div> */}
        </>
    );
};

export default MembersFinance;
