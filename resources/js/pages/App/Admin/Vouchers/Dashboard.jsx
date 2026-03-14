import React, { useState } from 'react';
import { Box, Typography, ThemeProvider, createTheme, Button, Card, CardContent, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, TextField, MenuItem, InputAdornment, IconButton, Tooltip, Alert } from '@mui/material';
import { Add as AddIcon, Search as SearchIcon, Edit as EditIcon, Delete as DeleteIcon, Visibility as ViewIcon, CheckCircle as CheckCircleIcon, Cancel as CancelIcon, AccessTime as AccessTimeIcon } from '@mui/icons-material';
import { router } from '@inertiajs/react';
import { FaEdit } from 'react-icons/fa';


const VoucherDashboard = ({ vouchers, stats, filters }) => {
    const [searchQuery, setSearchQuery] = useState(filters?.search || '');
    const [typeFilter, setTypeFilter] = useState(filters?.type || 'all');
    const [statusFilter, setStatusFilter] = useState(filters?.status || 'all');

    // Handle search
    const handleSearch = () => {
        const params = new URLSearchParams();
        if (searchQuery) params.set('search', searchQuery);
        if (typeFilter !== 'all') params.set('type', typeFilter);
        if (statusFilter !== 'all') params.set('status', statusFilter);

        router.visit(`${route('vouchers.dashboard')}?${params.toString()}`);
    };

    // Handle filter reset
    const handleReset = () => {
        setSearchQuery('');
        setTypeFilter('all');
        setStatusFilter('all');
        router.visit(route('vouchers.dashboard'));
    };

    // Get status color
    const getStatusColor = (status) => {
        switch (status) {
            case 'active':
                return 'success';
            case 'inactive':
                return 'default';
            case 'expired':
                return 'error';
            case 'used':
                return 'info';
            default:
                return 'default';
        }
    };

    // Get voucher type color
    const getTypeColor = (type) => {
        return type === 'member' ? '#063455' : '#063455';
    };

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-PK', {
            style: 'currency',
            currency: 'PKR',
        })
            .format(amount)
            .replace('PKR', 'Rs');
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Mark voucher as used
    const handleMarkAsUsed = (voucherId) => {
        if (confirm('Are you sure you want to mark this voucher as used?')) {
            router.post(route('vouchers.mark-used', voucherId));
        }
    };

    // Delete voucher
    const handleDelete = (voucherId) => {
        if (confirm('Are you sure you want to delete this voucher?')) {
            router.delete(route('vouchers.destroy', voucherId));
        }
    };

    return (
        <Box sx={{ p: 3, bgcolor: '#f5f5f5' }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography sx={{ color: '#063455', fontWeight: '700', fontSize: '30px' }}>
                    Voucher Management
                </Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => router.visit(route('vouchers.create'))} sx={{ backgroundColor: '#063455', borderRadius: '16px', textTransform: 'none' }}>
                    Create Voucher
                </Button>
            </Box>
            <Typography sx={{ color: '#063455', fontSize: '15px', fontWeight: '600' }}>
                Ensures proper documentation for accounting and audits
            </Typography>

            {/* Statistics Cards */}
            <Grid container spacing={3} sx={{ mb: 3, mt: 2 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ bgcolor: '#063455', borderRadius: '16px', color: '#fff' }}>
                        <CardContent>
                            <Typography sx={{ fontWeight: '600', fontSize: '14px' }}>
                                Total Vouchers
                            </Typography>
                            <Typography sx={{ fontWeight: '600', fontSize: '24px' }}>
                                {stats.total_vouchers}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ bgcolor: '#063455', borderRadius: '16px', color: '#fff' }}>
                        <CardContent>
                            <Typography sx={{ fontWeight: '600', fontSize: '14px' }}>
                                Active Vouchers
                            </Typography>
                            <Typography sx={{ fontWeight: '600', fontSize: '24px' }}>
                                {stats.active_vouchers}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ bgcolor: '#063455', borderRadius: '16px', color: '#fff' }}>
                        <CardContent>
                            <Typography sx={{ fontWeight: '600', fontSize: '14px' }}>
                                Used Vouchers
                            </Typography>
                            <Typography sx={{ fontWeight: '600', fontSize: '24px' }}>
                                {stats.used_vouchers}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ bgcolor: '#063455', borderRadius: '16px', color: '#fff' }}>
                        <CardContent>
                            <Typography sx={{ fontWeight: '600', fontSize: '14px' }}>
                                Total Value
                            </Typography>
                            <Typography sx={{ fontWeight: '600', fontSize: '24px' }}>
                                {formatCurrency(stats.total_value).replace(/\.00$/, '')}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Additional Stats */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ bgcolor: '#063455', borderRadius: '16px', color: '#fff' }}>
                        <CardContent>
                            <Typography sx={{ fontWeight: '600', fontSize: '14px' }}>
                                Member Vouchers
                            </Typography>
                            <Typography sx={{ fontWeight: '600', fontSize: '24px' }}>
                                {stats.member_vouchers}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ bgcolor: '#063455', borderRadius: '16px', color: '#fff' }}>
                        <CardContent>
                            <Typography sx={{ fontWeight: '600', fontSize: '14px' }}>
                                Employee Vouchers
                            </Typography>
                            <Typography sx={{ fontWeight: '600', fontSize: '24px' }}>
                                {stats.employee_vouchers}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ bgcolor: '#063455', borderRadius: '16px', color: '#fff' }}>
                        <CardContent>
                            <Typography sx={{ fontWeight: '600', fontSize: '14px' }}>
                                Expired Vouchers
                            </Typography>
                            <Typography sx={{ fontWeight: '600', fontSize: '24px' }}>
                                {stats.expired_vouchers}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ bgcolor: '#063455', borderRadius: '16px', color: '#fff' }}>
                        <CardContent>
                            <Typography sx={{ fontWeight: '600', fontSize: '14px' }}>
                                Active Value
                            </Typography>
                            <Typography sx={{ fontWeight: '600', fontSize: '24px' }}>
                                {formatCurrency(stats.active_value).replace(/\.00$/, '')}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Filters */}
            <Box sx={{ mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={4}>
                        <TextField
                            fullWidth
                            placeholder="Search vouchers..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '16px',
                                    height: 40,
                                },
                                '& .MuiOutlinedInput-notchedOutline': {
                                    borderRadius: '16px',
                                },
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} md={2}>
                        <TextField fullWidth select label="Type" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '16px',
                                    height: 40,
                                },
                                '& .MuiOutlinedInput-notchedOutline': {
                                    borderRadius: '16px',
                                },
                            }}
                            SelectProps={{
                                MenuProps: {
                                    sx: {
                                        '& .MuiPaper-root': {
                                            borderRadius: '16px',
                                            mt: 0.5,
                                            // pt: 1,
                                        },
                                        '& .MuiMenuItem-root': {
                                            borderRadius: '16px',
                                            mx: 0.5,
                                            '&:hover': {
                                                backgroundColor: '#063455 !important',
                                                color: '#fff !important'
                                            }
                                        }
                                    }
                                }
                            }}>
                            <MenuItem value="all">All Types</MenuItem>
                            <MenuItem value="member">Member</MenuItem>
                            <MenuItem value="employee">Employee</MenuItem>
                        </TextField>
                    </Grid>
                    <Grid item xs={12} md={2}>
                        <TextField fullWidth select label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '16px',
                                    height: 40,
                                },
                                '& .MuiOutlinedInput-notchedOutline': {
                                    borderRadius: '16px',
                                },
                            }}
                            SelectProps={{
                                MenuProps: {
                                    sx: {
                                        '& .MuiPaper-root': {
                                            borderRadius: '16px',
                                            mt: 0.5,
                                            // pt: 1,
                                        },
                                        '& .MuiMenuItem-root': {
                                            borderRadius: '16px',
                                            mx: 0.5,
                                            '&:hover': {
                                                backgroundColor: '#063455 !important',
                                                color: '#fff !important'
                                            }
                                        }
                                    }
                                }
                            }}>
                            <MenuItem value="all">All Status</MenuItem>
                            <MenuItem value="active">Active</MenuItem>
                            <MenuItem value="inactive">Inactive</MenuItem>
                            <MenuItem value="expired">Expired</MenuItem>
                            <MenuItem value="used">Used</MenuItem>
                        </TextField>
                    </Grid>
                    <Grid item xs={12} md={1.5}>
                        <Button
                            startIcon={<SearchIcon />}
                            fullWidth variant="contained" onClick={handleSearch} sx={{ borderRadius: '16px', bgcolor: '#063455', border: '1px solid #063455', color: '#fff', textTransform: 'none' }}>
                            Search
                        </Button>
                    </Grid>
                    <Grid item xs={12} md={1.5}>
                        <Button fullWidth variant="outlined" onClick={handleReset} sx={{ borderRadius: '16px', border: '1px solid #063455', color: '#063455', textTransform: 'none' }}>
                            Reset
                        </Button>
                    </Grid>
                </Grid>
            </Box>

            {/* Vouchers Table */}
            <TableContainer component={Paper} sx={{ borderRadius: '16px', }}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ backgroundColor: '#063455' }}>
                            <TableCell sx={{ color: '#fff', fontWeight: '600' }}><strong>Voucher Code</strong></TableCell>
                            <TableCell sx={{ color: '#fff', fontWeight: '600' }}><strong>Name</strong></TableCell>
                            <TableCell sx={{ color: '#fff', fontWeight: '600' }}><strong>Type</strong></TableCell>
                            <TableCell sx={{ color: '#fff', fontWeight: '600' }}><strong>Recipient</strong></TableCell>
                            <TableCell sx={{ color: '#fff', fontWeight: '600' }}><strong>Amount</strong></TableCell>
                            <TableCell sx={{ color: '#fff', fontWeight: '600' }}><strong>Valid Period</strong></TableCell>
                            <TableCell sx={{ color: '#fff', fontWeight: '600' }}><strong>Status</strong></TableCell>
                            <TableCell sx={{ color: '#fff', fontWeight: '600' }}><strong>Actions</strong></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {vouchers.data.map((voucher) => {
                            const dateRange = `${formatDate(voucher.valid_from)} - ${formatDate(voucher.valid_to)}`
                            return (
                                <TableRow key={voucher.id}>
                                    <TableCell sx={{ color: '#000', fontWeight: '600' }}>
                                        <Tooltip title={voucher.voucher_code}>
                                            <div
                                                style={{
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    maxWidth: '100px',  // ≈ 10 characters width
                                                }}
                                            >
                                                {voucher.voucher_code}
                                            </div>
                                        </Tooltip>
                                    </TableCell>
                                    <TableCell sx={{ color: '#7f7f7f', fontWeight: '400' }}>
                                        <Tooltip title={voucher.voucher_name}>
                                            <div
                                                style={{
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    maxWidth: '100px',  // ≈ 10 characters width
                                                }}
                                            >
                                                {voucher.voucher_name}
                                            </div>
                                        </Tooltip>
                                        {voucher.description && (
                                            <Tooltip title={voucher.description}>
                                                <div
                                                    style={{
                                                        whiteSpace: 'nowrap',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        maxWidth: '100px',  // ≈ 10 characters width
                                                    }}
                                                >
                                                    {voucher.description}
                                                </div>
                                            </Tooltip>
                                        )}
                                    </TableCell>
                                    {/* <TableCell>
                                    <Chip
                                        label={voucher.voucher_type}
                                        color={getTypeColor(voucher.voucher_type)}
                                        size="small"
                                        sx={{ textTransform: 'capitalize', color: '#fff' }}
                                    />
                                </TableCell> */}
                                    <TableCell>
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                px: 1.5,
                                                py: 0.5,
                                                borderRadius: '12px',
                                                fontSize: '12px',
                                                fontWeight: 500,
                                                textTransform: 'capitalize',
                                                color: '#fff',
                                                backgroundColor: getTypeColor(voucher.voucher_type)?.main || '#063455',
                                                minWidth: 'fit-content'
                                            }}
                                        >
                                            {voucher.voucher_type}
                                        </Typography>
                                    </TableCell>
                                    <TableCell sx={{ color: '#7f7f7f', fontWeight: '400' }}>
                                        {voucher.recipient}
                                        {voucher.voucher_type === 'member' && voucher.member && (
                                            <Tooltip title={voucher.member.membership_no || 'N/A'}>
                                                <Typography
                                                    sx={{
                                                        color: '#7f7f7f',
                                                        fontWeight: 400,
                                                        fontSize: '14px',
                                                        whiteSpace: 'nowrap',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        maxWidth: '80px'
                                                    }}
                                                >
                                                    ID: {voucher.member.membership_no || 'N/A'}
                                                </Typography>
                                            </Tooltip>
                                        )}
                                        {voucher.voucher_type === 'employee' && voucher.employee && (
                                            <Tooltip title={voucher.employee.employee_id || 'N/A'}>
                                                <div
                                                    style=
                                                    {{
                                                        color: '#7f7f7f',
                                                        fontWeight: 400,
                                                        fontSize: '14px',
                                                        textOverflow: 'ellipsis',
                                                        overflow: 'hidden',
                                                        maxWidth: '80px',
                                                        whiteSpace: 'nowrap'
                                                    }}>
                                                    ID: {voucher.employee.employee_id || 'N/A'}
                                                </div>
                                            </Tooltip>
                                        )}
                                    </TableCell>
                                    <TableCell sx={{ color: '#7f7f7f', fontWeight: '400', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '100px' }}>
                                        <Tooltip title={formatCurrency(voucher.amount)}>
                                            {formatCurrency(voucher.amount)}
                                        </Tooltip>
                                    </TableCell>
                                    <TableCell sx={{ color: '#7f7f7f', fontWeight: '400', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '100px' }}>
                                        <Tooltip title={dateRange}>
                                            {dateRange}
                                        </Tooltip>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={voucher.status}
                                            color={getStatusColor(voucher.status)}
                                            size="small"
                                            sx={{ textTransform: 'capitalize' }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            <Tooltip title="View Details">
                                                <IconButton size="small" onClick={() => router.visit(route('vouchers.show', voucher.id))}>
                                                    <ViewIcon sx={{ color: '#063455' }} />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Edit">
                                                <IconButton size="small" onClick={() => router.visit(route('vouchers.edit', voucher.id))}>
                                                    <FaEdit size={16} style={{ marginRight: 8, color: '#f57c00' }} />
                                                </IconButton>
                                            </Tooltip>
                                            {voucher.status === 'active' && !voucher.is_used && (
                                                <Tooltip title="Mark as Used">
                                                    <IconButton
                                                        size="small"
                                                        color="success"
                                                        onClick={() => handleMarkAsUsed(voucher.id)}
                                                    >
                                                        <CheckCircleIcon />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                            <Tooltip title="Delete">
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={() => handleDelete(voucher.id)}
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                        {vouchers.data.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4 }}>
                                    <Typography color="textSecondary">No vouchers found</Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Pagination */}
            {vouchers.links && (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                    {vouchers.links.map((link, index) => (
                        <Button
                            key={index}
                            onClick={() => link.url && router.visit(link.url)}
                            disabled={!link.url}
                            variant={link.active ? 'contained' : 'outlined'}
                            size="small"
                            sx={{ mx: 0.5, minWidth: '36px' }}
                        >
                            <span dangerouslySetInnerHTML={{ __html: link.label }} />
                        </Button>
                    ))}
                </Box>
            )}
        </Box>
    );
};

export default VoucherDashboard;
