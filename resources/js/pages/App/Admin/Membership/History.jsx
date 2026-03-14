import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { TextField, Button, Modal, Box, Typography, IconButton, Paper, Table, TableBody, TableCell, Container, TableContainer, TableHead, TableRow, Chip, InputAdornment, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import { Search as SearchIcon, FilterAlt as FilterIcon, Print as PrintIcon, ArrowBack as ArrowBackIcon, Close as CloseIcon, KeyboardArrowDown as KeyboardArrowDownIcon, CalendarMonth as CalendarMonthIcon } from '@mui/icons-material';
import { router } from '@inertiajs/react';


const MembersHistory = ({ membersdata = [] }) => {
    // const [open, setOpen] = useState(true);
    // State for search input
    const [searchTerm, setSearchTerm] = useState('');

    // State for filter modal
    const [openFilter, setOpenFilter] = useState(false);

    // State for selected filter options
    const [selectedMembershipType, setSelectedMembershipType] = useState('All Type');
    const [selectedDate, setSelectedDate] = useState('');
    console.log('membersdata', membersdata);

    // Sample data for members
    const [members, setMembers] = useState([
        {
            id: 'AFOHS-1235',
            name: 'Zahid Ullah',
            email: 'user@gmail.com',
            membershipType: 'Member',
            contact: '0323423342',
            totalVisit: 12,
            lastVisit: '28-Apr-2025',
        },
        {
            id: 'AFOHS-1234',
            name: 'Zahid Ullah',
            email: 'user@gmail.com',
            membershipType: 'Applied Member',
            contact: '0323423342',
            totalVisit: 10,
            lastVisit: '10-Apr-2024',
        },
        {
            id: 'AFOHS-1245',
            name: 'Zahid Ullah',
            email: 'user@gmail.com',
            membershipType: 'Affiliated Member',
            contact: '0323423342',
            totalVisit: 30,
            lastVisit: '05-Jan-2025',
        },
        {
            id: 'AFOHS-1345',
            name: 'Zahid Ullah',
            email: 'user@gmail.com',
            membershipType: 'VIP Guest',
            contact: '0323423342',
            totalVisit: 12,
            lastVisit: '28-Apr-2021',
        },
        {
            id: 'AFOHS-2345',
            name: 'Zahid Ullah',
            email: 'user@gmail.com',
            membershipType: 'Member',
            contact: '0323423342',
            totalVisit: 20,
            lastVisit: '26-Apr-2023',
        },
        {
            id: 'AFOHS-2345',
            name: 'Zahid Ullah',
            email: 'user@gmail.com',
            membershipType: 'Applied Member',
            contact: '0323423342',
            totalVisit: 5,
            lastVisit: '10-Oct-2024',
        },
    ]);

    // Filter members based on search term
    const filteredMembers = members.filter((member) => member.name.toLowerCase().includes(searchTerm.toLowerCase()));

    // Handle opening and closing filter modal
    const handleOpenFilter = () => setOpenFilter(true);
    const handleCloseFilter = () => setOpenFilter(false);

    // Handle applying filters
    const handleApplyFilters = () => {
        // In a real app, you would filter the data here
        handleCloseFilter();
    };

    // Handle resetting filters
    const handleResetFilter = () => {
        setSelectedMembershipType('All Type');
        setSelectedDate('');
    };

    // Membership type options
    const membershipTypes = ['All Type', 'Member', 'Affiliated Member', 'VIP Guest'];

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
                <Container maxWidth="lg" sx={{ py: 4 }}>
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between', // keeps extreme left / extreme right
                            flexWrap: 'wrap',
                            mb: 4,
                        }}
                    >
                        {/* ◀️ LEFT  – back + title */}
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 1, md: 0 } }}>
                            <ArrowBackIcon sx={{ mr: 1, cursor: 'pointer' }} />
                            <Typography variant="h5" sx={{ fontWeight: 500, color: '#333' }}>
                                Members History
                                {/* <pre>{JSON.stringify(membersdata, null, 2)}</pre> */}
                            </Typography>
                        </Box>

                        {/* ▶️ RIGHT – everything that should sit on the right  */}
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 2, // space between search / filter / print
                                ml: 'auto', // <-- pushes this group to the far right
                                flexWrap: 'wrap',
                            }}
                        >
                            <TextField
                                placeholder="Search by name, member type etc"
                                variant="outlined"
                                size="small"
                                sx={{ width: { xs: '220px', sm: '300px', md: '350px' } }}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon />
                                        </InputAdornment>
                                    ),
                                }}
                            />

                            <Button
                                variant="outlined"
                                startIcon={<FilterIcon />}
                                onClick={handleOpenFilter}
                                sx={{
                                    textTransform: 'none',
                                    borderColor: '#ccc',
                                    color: '#333',
                                }}
                            >
                                Filter
                            </Button>

                            <Button
                                variant="contained"
                                startIcon={<PrintIcon />}
                                sx={{
                                    backgroundColor: '#063455',
                                    textTransform: 'none',
                                    color: 'white',
                                }}
                            >
                                Print
                            </Button>
                        </Box>
                    </Box>

                    {/* Members table */}
                    <TableContainer component={Paper} style={{ boxShadow: 'none', borderRadius: '4px' }}>
                        <Table>
                            <TableHead>
                                <TableRow style={{ backgroundColor: '#f0f0f5' }}>
                                    <TableCell style={{ fontWeight: 'bold', color: '#333' }}>Membership ID</TableCell>
                                    <TableCell style={{ fontWeight: 'bold', color: '#333' }}>Member Name</TableCell>
                                    <TableCell style={{ fontWeight: 'bold', color: '#333' }}>Membership Type</TableCell>
                                    <TableCell style={{ fontWeight: 'bold', color: '#333' }}>Contact</TableCell>
                                    <TableCell style={{ fontWeight: 'bold', color: '#333' }}>Total Visit</TableCell>
                                    <TableCell style={{ fontWeight: 'bold', color: '#333' }}>Last Visit</TableCell>
                                    <TableCell style={{ fontWeight: 'bold', color: '#333' }}>Action</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {membersdata.map((member, index) => (
                                    <TableRow key={index} style={{ borderBottom: '1px solid #e0e0e0' }}>
                                        <TableCell>{member.user_id}</TableCell>
                                        <TableCell>
                                            <div className="d-flex align-items-center">
                                                <div
                                                    style={{
                                                        width: '40px',
                                                        height: '40px',
                                                        borderRadius: '50%',
                                                        overflow: 'hidden',
                                                        marginRight: '10px',
                                                        backgroundColor: '#f0f0f0',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                    }}
                                                >
                                                    {/* <img src={`https://randomuser.me/api/portraits/men/${index + 1}.jpg`} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> */}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 500 }}>{member.name}</div>
                                                    <div style={{ color: '#666', fontSize: '0.85rem' }}>{member.email}</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>{member.membershipType || 'N/A'}</TableCell>
                                        <TableCell>{member.phone_number}</TableCell>
                                        <TableCell>{member.totalVisit || 'N/A'}</TableCell>
                                        <TableCell>{member.lastVisit || 'N/A'}</TableCell>
                                        <TableCell>
                                            <Button
                                                style={{
                                                    color: '#0066cc',
                                                    textTransform: 'none',
                                                    padding: '2px 8px',
                                                    fontWeight: 500,
                                                }}
                                                onClick={() => router.visit('/admin/membership/visit/detail')}
                                            >
                                                View Detail
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {/* Filter Modal */}
                    <Modal open={openFilter} onClose={handleCloseFilter} aria-labelledby="filter-modal-title" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end' }}>
                        <Box
                            sx={{
                                width: 600,
                                bgcolor: 'background.paper',
                                boxShadow: 24,
                                p: 3,
                                mt: 2,
                                mr: 2,
                                borderRadius: 1,
                            }}
                        >
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <Typography id="filter-modal-title" variant="h6" component="h2">
                                    Members History Filter
                                </Typography>
                                <IconButton onClick={handleCloseFilter} size="small">
                                    <CloseIcon />
                                </IconButton>
                            </div>

                            {/* Membership Type Filter */}
                            <Accordion
                                elevation={0}
                                style={{
                                    border: '1px solid #e0e0e0',
                                    marginBottom: '20px',
                                    borderRadius: '4px',
                                    '&:before': {
                                        display: 'none',
                                    },
                                }}
                            >
                                <AccordionSummary expandIcon={<KeyboardArrowDownIcon />} aria-controls="panel1a-content" id="panel1a-header">
                                    <Typography>Membership Type</Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <div className="d-flex flex-wrap gap-2">
                                        {membershipTypes.map((type) => (
                                            <Chip
                                                key={type}
                                                label={type}
                                                onClick={() => setSelectedMembershipType(type)}
                                                style={{
                                                    backgroundColor: selectedMembershipType === type ? (type === 'All Type' ? '#063455' : '#cce5ff') : type === 'All Type' ? '#063455' : '#f0f0f0',
                                                    color: selectedMembershipType === type ? (type === 'All Type' ? 'white' : '#0066cc') : type === 'All Type' ? 'white' : '#333',
                                                    border: 'none',
                                                    marginRight: '8px',
                                                    marginBottom: '8px',
                                                    fontWeight: 400,
                                                }}
                                            />
                                        ))}
                                    </div>
                                </AccordionDetails>
                            </Accordion>

                            {/* Date Filter */}
                            <Accordion
                                elevation={0}
                                style={{
                                    border: '1px solid #e0e0e0',
                                    marginBottom: '20px',
                                    borderRadius: '4px',
                                    '&:before': {
                                        display: 'none',
                                    },
                                }}
                            >
                                <AccordionSummary expandIcon={<KeyboardArrowDownIcon />} aria-controls="panel2a-content" id="panel2a-header">
                                    <Typography>Check by Date</Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <Typography variant="body2" color="text.secondary" style={{ marginBottom: '10px' }}>
                                        Select your target date
                                    </Typography>
                                    <TextField
                                        type="date"
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        InputProps={{
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <CalendarMonthIcon />
                                                </InputAdornment>
                                            ),
                                        }}
                                        fullWidth
                                    />
                                </AccordionDetails>
                            </Accordion>

                            {/* Action Buttons */}
                            <div className="d-flex justify-content-end mt-4">
                                <Button
                                    onClick={handleCloseFilter}
                                    style={{
                                        marginRight: '10px',
                                        textTransform: 'none',
                                        color: '#333',
                                        border: '1px solid #ccc',
                                    }}
                                    variant="outlined"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleResetFilter}
                                    style={{
                                        marginRight: '10px',
                                        textTransform: 'none',
                                        color: '#333',
                                        border: '1px solid #ccc',
                                    }}
                                    variant="outlined"
                                >
                                    Reset Filter
                                </Button>
                                <Button
                                    onClick={handleApplyFilters}
                                    style={{
                                        textTransform: 'none',
                                        backgroundColor: '#063455',
                                        color: 'white',
                                    }}
                                    variant="contained"
                                >
                                    Apply Filters
                                </Button>
                            </div>
                        </Box>
                    </Modal>
                </Container>
            {/* </div> */}
        </>
    );
};

export default MembersHistory;
