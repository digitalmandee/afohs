import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react'; // Inertia Link/Head
import { Box, Typography, Card, CardContent, Tabs, Tab, TextField, InputAdornment, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, Pagination, IconButton } from '@mui/material';
import AdminLayout from '@/layouts/AdminLayout'; // Adjust path if needed
import { Search as SearchIcon, Visibility as VisibilityIcon } from '@mui/icons-material';

const ActivityIndex = ({ activities, filters }) => {
    const [tabValue, setTabValue] = useState(filters.category || 'All');
    const [searchTerm, setSearchTerm] = useState(filters.search || '');

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
        applyFilters(newValue, searchTerm);
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        // Debounce could be added here preferably, but for now exact search on Enter or direct Apply
    };

    const handleSearchKeyDown = (e) => {
        if (e.key === 'Enter') {
            applyFilters(tabValue, searchTerm);
        }
    };

    const applyFilters = (category, search) => {
        router.get(
            route('activity-log'),
            {
                category: category,
                search: search,
                page: 1, // Reset to first page
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    };

    const handlePageChange = (event, value) => {
        router.get(
            route('activity-log'),
            {
                category: tabValue,
                search: searchTerm,
                page: value,
            },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    return (
        <>
            <Head title="Activity Log" />
            <Box sx={{ p: 3 }}>
                <Typography variant="h5" sx={{ mb: 3, fontWeight: 600, color: '#063455' }}>
                    Activity Log
                </Typography>

                <Card sx={{ mb: 3 }}>
                    <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Tabs value={tabValue} onChange={handleTabChange} textColor="primary" indicatorColor="primary" sx={{ '& .MuiTab-root': { fontWeight: 600 } }}>
                                <Tab label="All" value="All" />
                                <Tab label="Membership" value="Membership" />
                                <Tab label="Finance" value="Finance" />
                            </Tabs>

                            <TextField
                                size="small"
                                placeholder="Search activities..."
                                value={searchTerm}
                                onChange={handleSearch}
                                onKeyDown={handleSearchKeyDown}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon color="action" />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{ width: 300 }}
                            />
                        </Box>
                    </CardContent>
                </Card>

                <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 2, border: '1px solid #e0e0e0' }}>
                    <Table>
                        <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                            <TableRow>
                                <TableCell>Actor</TableCell>
                                <TableCell>Action</TableCell>
                                <TableCell>Category</TableCell>
                                <TableCell>Date & Time</TableCell>
                                <TableCell>Details</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {activities.data.length > 0 ? (
                                activities.data.map((activity) => (
                                    <TableRow key={activity.id} hover>
                                        <TableCell>
                                            <Typography variant="subtitle2" fontWeight="600">
                                                {activity.actor_name}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#063455' }}>
                                                {activity.title}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {activity.text}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip label={activity.category} size="small" color={activity.category === 'Finance' ? 'success' : activity.category === 'Membership' ? 'primary' : 'default'} variant="outlined" />
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">{activity.time}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            {activity.link && activity.link !== '#' && (
                                                <IconButton size="small" component="a" href={activity.link} target="_blank">
                                                    <VisibilityIcon fontSize="small" />
                                                </IconButton>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                                        <Typography variant="body1" color="text.secondary">
                                            No recent activity found.
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                    <Pagination count={activities.last_page} page={activities.current_page} onChange={handlePageChange} color="primary" />
                </Box>
            </Box>
        </>
    );
};

export default ActivityIndex;
