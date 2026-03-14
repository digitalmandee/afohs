"use client"
import { useState } from "react"
import {
    Box,
    Typography,
    IconButton,
    MenuItem,
    Button,
    Dialog,
    Collapse,
    TextField,
    InputAdornment
} from "@mui/material"
import {
    CheckCircle as CheckCircleIcon,
    Check as CheckIcon,
    Circle as CircleIcon,
    Close as CloseIcon,
    TwoWheeler as DeliveryIcon,
    Diamond as DiamondIcon,
    LocalDining as DiningIcon,
    FilterAlt as FilterIcon,
    KeyboardArrowDown as KeyboardArrowDownIcon,
    Receipt as ReceiptIcon,
    EventSeat as ReservationIcon,
    Restaurant as RestaurantIcon,
    Search as SearchIcon,
    TakeoutDining as TakeoutIcon,
} from '@mui/icons-material';

const styles = {
    root: {
        backgroundColor: '#f5f5f5',
        minHeight: '100vh',
        fontFamily: 'Arial, sans-serif',
    },
    tabButton: {
        borderRadius: '20px',
        margin: '0 5px',
        textTransform: 'none',
        fontWeight: 'normal',
        padding: '6px 16px',
        border: '1px solid #00274D',
        color: '#00274D',
    },
    activeTabButton: {
        backgroundColor: '#0a3d62',
        color: 'white',
        borderRadius: '20px',
        margin: '0 5px',
        textTransform: 'none',
        fontWeight: 'normal',
        padding: '6px 16px',
    },

};

const HoledEmployeeFilter = ({ open, onClose }) => {
    const [expandedSections, setExpandedSections] = useState({
        sorting: true,
        leaveType: true,
        memberStatus: true,
        orderStatus: true,
    });

    const [filters, setFilters] = useState({
        sort: 'asc',
        leaveType: 'all',
        memberStatus: 'all',
        orderStatus: 'all',
    });

    const toggleSection = (section) => {
        setExpandedSections((prev) => ({
            ...prev,
            [section]: !prev[section],
        }));
    };

    const handleFilterChange = (key, value) => {
        setFilters((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    const handleResetFilters = () => {
        setFilters({
            sort: 'asc',
            leaveType: 'all',
            memberStatus: 'all',
            orderStatus: 'all',
        });
    };

    const handleApplyFilters = () => {
        setOpenFilterModal(false);
    };

    return (
        <>
            <Dialog
                open={open}
                onClose={onClose}
                fullWidth
                maxWidth="sm"
                PaperProps={{
                    style: {
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        m: 0,
                        width: '600px',
                        borderRadius: 2,
                        p: 2
                    },
                }}
            >
                <Box sx={{ p: 3 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                        <Typography sx={{ color: '#121212', fontWeight: 500, fontSize: '32px' }}>
                            Hold Employee Filter
                        </Typography>
                        <IconButton edge="end">
                            <CloseIcon />
                        </IconButton>
                    </Box>

                    {/* Sorting Section */}
                    <Box
                        className={styles.filterSection}
                        sx={{
                            mb: 3,
                            border: '1px solid #eee',
                            borderRadius: '8px',
                            p: 2,
                            backgroundColor: '#fff',
                            boxShadow: '0px 1px 4px rgba(0, 0, 0, 0.05)',
                        }}
                    >
                        <Box
                            className={styles.filterHeader}
                            onClick={() => toggleSection('sorting')}
                            sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                cursor: 'pointer',
                            }}
                        >
                            <Typography sx={{
                                color: '#121212',
                                fontWeight: 500,
                                fontSize: '16px'
                            }}>Sorting</Typography>
                            <KeyboardArrowDownIcon
                                sx={{
                                    transform: expandedSections.sorting ? 'rotate(180deg)' : 'rotate(0deg)',
                                    transition: 'transform 0.3s ease',
                                }}
                            />
                        </Box>

                        <Collapse in={expandedSections.sorting}>
                            <Box
                                sx={{
                                    mt: 2,
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'baseline',
                                }}
                            >
                                <Typography sx={{ mb: 1, color: '#121212', fontSize: '14px', fontWeight: 400 }}>
                                    By Member Id
                                </Typography>
                                <Box display="flex" gap={2}>
                                    <Button
                                        variant="contained"
                                        onClick={() => handleFilterChange('sort', 'asc')}
                                        sx={{
                                            backgroundColor: filters.sort === 'asc' ? '#063455' : '#B0DEFF',
                                            color: filters.sort === 'asc' ? 'white' : 'black',
                                            borderRadius: '20px',
                                            textTransform: 'none',
                                            fontWeight: 500,
                                            minWidth: '130px',
                                        }}
                                        startIcon={
                                            <span
                                                style={{
                                                    fontSize: '16px',
                                                }}
                                            >
                                                ↑
                                            </span>
                                        }
                                    >
                                        Ascending
                                    </Button>
                                    <Button
                                        variant="contained"
                                        onClick={() => handleFilterChange('sort', 'desc')}
                                        sx={{
                                            backgroundColor: filters.sort === 'desc' ? '#063455' : '#B0DEFF',
                                            color: filters.sort === 'desc' ? 'white' : 'black',
                                            borderRadius: '20px',
                                            textTransform: 'none',
                                            fontWeight: 500,
                                            minWidth: '130px',
                                        }}
                                        startIcon={
                                            <span
                                                style={{
                                                    fontSize: '16px',
                                                }}
                                            >
                                                ↓
                                            </span>
                                        }
                                    >
                                        Descending
                                    </Button>
                                </Box>
                            </Box>
                        </Collapse>

                        <Collapse in={expandedSections.sorting}>
                            <Box
                                sx={{
                                    mt: 2,
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'baseline',
                                }}
                            >
                                <Typography sx={{ mb: 1, color: '#121212', fontSize: '14px', fontWeight: 400 }}>
                                    By Member Name
                                </Typography>
                                <Box display="flex" gap={2}>
                                    <Button
                                        variant="contained"
                                        onClick={() => handleFilterChange('sort', 'asc')}
                                        sx={{
                                            backgroundColor: filters.sort === 'asc' ? '#063455' : '#B0DEFF',
                                            color: filters.sort === 'asc' ? 'white' : 'black',
                                            borderRadius: '20px',
                                            textTransform: 'none',
                                            fontWeight: 500,
                                            minWidth: '130px',
                                        }}
                                        startIcon={
                                            <span
                                                style={{
                                                    fontSize: '16px',
                                                }}
                                            >
                                                ↑
                                            </span>
                                        }
                                    >
                                        Ascending
                                    </Button>
                                    <Button
                                        variant="contained"
                                        onClick={() => handleFilterChange('sort', 'desc')}
                                        sx={{
                                            backgroundColor: filters.sort === 'desc' ? '#063455' : '#B0DEFF',
                                            color: filters.sort === 'desc' ? 'white' : 'black',
                                            borderRadius: '20px',
                                            textTransform: 'none',
                                            fontWeight: 500,
                                            minWidth: '130px',
                                        }}
                                        startIcon={
                                            <span
                                                style={{
                                                    fontSize: '16px',
                                                }}
                                            >
                                                ↓
                                            </span>
                                        }
                                    >
                                        Descending
                                    </Button>
                                </Box>
                            </Box>
                        </Collapse>
                    </Box>

                    {/* Member Status Section */}
                    <Box
                        className={styles.filterSection}
                        sx={{
                            mb: 3,
                            border: '1px solid #eee',
                            borderRadius: '8px',
                            p: 2,
                            backgroundColor: '#fff',
                            boxShadow: '0px 1px 4px rgba(0, 0, 0, 0.05)',
                        }}
                    >
                        <Box
                            className={styles.filterHeader}
                            onClick={() => toggleSection('memberStatus')}
                            sx={{
                                p: 0,
                                mb: 1,
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}
                        >
                            <Typography sx={{ color: '#121212', fontSize: '14px', fontWeight: 500 }}>Check by Employee Detail</Typography>
                            <KeyboardArrowDownIcon
                                sx={{
                                    cursor: 'pointer',
                                    transform: expandedSections.memberStatus ? 'rotate(180deg)' : 'rotate(0deg)',
                                    transition: 'transform 0.3s',
                                }}
                            />
                        </Box>
                        <Collapse in={expandedSections.memberStatus}>
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    flexWrap: 'wrap',
                                    gap: 2,
                                    mt: 2,
                                    px: 1
                                }}
                            >
                                <Typography sx={{ fontWeight: 400, fontSize: '14px' }}>
                                    Department
                                </Typography>

                                <TextField
                                    select
                                    value={filters.department || ''}
                                    onChange={(e) => handleFilterChange('department', e.target.value)}
                                    displayEmpty
                                    variant="outlined"
                                    sx={{
                                        width: 250,
                                        height: 42, // controls outer wrapper
                                        '& .MuiOutlinedInput-root': {
                                            height: 42,
                                            fontSize: '14px',
                                            paddingRight: '8px',
                                            '& .MuiSelect-select': {
                                                display: 'flex',
                                                alignItems: 'center',
                                            },
                                        },
                                    }}
                                    SelectProps={{
                                        displayEmpty: true,
                                    }}
                                >
                                    <MenuItem value="" disabled>
                                        Select Department
                                    </MenuItem>
                                    <MenuItem value="HR">HR</MenuItem>
                                    <MenuItem value="Finance">Finance</MenuItem>
                                    <MenuItem value="IT">IT</MenuItem>
                                    <MenuItem value="Marketing">Marketing</MenuItem>
                                </TextField>
                            </Box>

                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    flexWrap: 'wrap',
                                    gap: 2,
                                    mt: 2,
                                    px: 1
                                }}
                            >
                                <Typography sx={{ fontWeight: 400, fontSize: '14px' }}>
                                    Designation
                                </Typography>

                                <TextField
                                    select
                                    value={filters.department || ''}
                                    onChange={(e) => handleFilterChange('department', e.target.value)}
                                    displayEmpty
                                    variant="outlined"
                                    sx={{
                                        width: 250,
                                        height: 42, // controls outer wrapper
                                        '& .MuiOutlinedInput-root': {
                                            height: 42,
                                            fontSize: '14px',
                                            paddingRight: '8px',
                                            '& .MuiSelect-select': {
                                                display: 'flex',
                                                alignItems: 'center',
                                            },
                                        },
                                    }}
                                    SelectProps={{
                                        displayEmpty: true,
                                    }}
                                >
                                    <MenuItem value="" disabled>
                                        Select Designation
                                    </MenuItem>
                                    <MenuItem value="HR">HR</MenuItem>
                                    <MenuItem value="Finance">Finance</MenuItem>
                                    <MenuItem value="IT">IT</MenuItem>
                                    <MenuItem value="Marketing">Marketing</MenuItem>
                                </TextField>
                            </Box>

                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    flexWrap: 'wrap',
                                    gap: 2,
                                    mt: 2,
                                    px: 1
                                }}
                            >
                                <Typography sx={{ fontWeight: 400, fontSize: '14px' }}>
                                    Active
                                </Typography>

                                <TextField
                                    select
                                    value={filters.department || ''}
                                    onChange={(e) => handleFilterChange('department', e.target.value)}
                                    displayEmpty
                                    variant="outlined"
                                    sx={{
                                        width: 250,
                                        height: 42, // controls outer wrapper
                                        '& .MuiOutlinedInput-root': {
                                            height: 42,
                                            fontSize: '14px',
                                            paddingRight: '8px',
                                            '& .MuiSelect-select': {
                                                display: 'flex',
                                                alignItems: 'center',
                                            },
                                        },
                                    }}
                                    SelectProps={{
                                        displayEmpty: true,
                                    }}
                                >
                                    <MenuItem value="" disabled>
                                        Select Status
                                    </MenuItem>
                                    <MenuItem value="HR">HR</MenuItem>
                                    <MenuItem value="Finance">Finance</MenuItem>
                                    <MenuItem value="IT">IT</MenuItem>
                                    <MenuItem value="Marketing">Marketing</MenuItem>
                                </TextField>
                            </Box>

                        </Collapse>
                    </Box>

                    {/* Footer Buttons */}
                    <Box display="flex" justifyContent="flex-end" gap={1} mt={3}>
                        <Button
                            variant="outlined"
                            onClick={handleResetFilters}
                            sx={{
                                color: '#333',
                                borderColor: '#ddd',
                                textTransform: 'none',
                            }}
                        >
                            Reset Filter
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleApplyFilters}
                            sx={{
                                backgroundColor: '#0a3d62',
                                color: 'white',
                                textTransform: 'none',
                                '&:hover': {
                                    backgroundColor: '#083352',
                                },
                            }}
                        >
                            Apply Filters
                        </Button>
                    </Box>
                </Box>
            </Dialog>
        </>
    )
}

export default HoledEmployeeFilter
