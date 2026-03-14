import { router } from '@inertiajs/react';
import AddIcon from '@mui/icons-material/Add';
import { FaRegEdit } from "react-icons/fa";
import { RiDeleteBin6Line } from "react-icons/ri";
import SearchIcon from '@mui/icons-material/Search';
import {
    Box,
    Button,
    IconButton,
    TextField,
    DialogActions,
    InputBase,
    Dialog,
    DialogContent,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material';
import { useState } from 'react';

// const drawerWidthOpen = 240;
// const drawerWidthClosed = 110;

const DashboardList = () => {
    // const [open, setOpen] = useState(true);
    const [openAddModal, setOpenAddModal] = useState(false);
    const [departmentName, setDepartmentName] = useState('');

    const handleOpen = () => setOpenAddModal(true);
    const handleClose = () => {
        setOpenAddModal(false);
        setDepartmentName('');
    };
    const handleAdd = () => {
        console.log('Adding department:', departmentName);
        handleClose();
    };

    const [openDeleteModal, setOpenDeleteModal] = useState(false);
    const handleOpenModal = (e) => {
        setOpenDeleteModal(true);
    };

    const handleCloseModal = () => {
        setOpenDeleteModal(false);
    };

    const confirmDelete = () => {
        setOpenDeleteModal(false);
    };

    const departmentData = [
        {
            name: 'Engineering',
            id: 1
        },
        {
            name: 'Finance',
            id: 2
        },
    ];
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
                <Box
                    sx={{
                        px: 4,
                        py: 2,
                    }}
                >
                    <div style={{ paddingTop: '1rem', backgroundColor: 'transparent' }}>
                        {/* Header */}
                        <div
                            style={{
                                display: 'flex',
                                width: '100%',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '24px',
                            }}
                        >
                            <Typography
                                sx={{
                                    fontWeight: 500,
                                    fontSize: '30px',
                                    color: '#063455',
                                }}
                            >
                                Department List
                            </Typography>

                            {/* Right side group */}
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1.5rem',
                                    marginLeft: 'auto',
                                }}
                            >
                                {/* Search Bar */}
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        border: '1px solid #121212',
                                        borderRadius: '4px',
                                        width: '350px',
                                        padding: '4px 8px',
                                        backgroundColor: '#FFFFFF',
                                    }}
                                >
                                    <SearchIcon style={{ color: '#121212', marginRight: '8px' }} />
                                    <InputBase
                                        placeholder="Search employee member here"
                                        fullWidth
                                        sx={{ fontSize: '14px' }}
                                        inputProps={{ style: { padding: 0 } }}
                                    />
                                </div>

                                {/* Add Department Button */}
                                <Button
                                    style={{
                                        color: 'white',
                                        width: '180px',
                                        backgroundColor: '#063455',
                                        textTransform: 'none',
                                    }}
                                    startIcon={<AddIcon />}
                                    onClick={handleOpen}
                                >
                                    Add Department
                                </Button>
                            </div>
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            {/* Booking Table */}
                            <TableContainer
                                component={Paper}
                                style={{
                                    width: '100%',
                                    backgroundColor: '#FFFFFF',
                                    borderRadius: '1rem',
                                    boxShadow: 'none',
                                    border: '1px solid #ccc',
                                    marginBottom: '24px',
                                }}
                            >
                                <Table>
                                    <TableHead style={{ backgroundColor: '#E5E5EA' }}>
                                        <TableRow>
                                            <TableCell style={{ color: '#000000', fontWeight: '500', fontSize: '18px' }}>
                                                Name
                                            </TableCell>
                                            <TableCell style={{ color: '#000000', fontWeight: '500', fontSize: '18px' }} align="right">
                                                Action
                                            </TableCell>
                                        </TableRow>
                                    </TableHead>

                                    <TableBody>
                                        {departmentData.map((dept, index) => (
                                            <TableRow key={index}>
                                                <TableCell style={{ fontSize: '16px', color: '#6C6C6C' }}>
                                                    {dept.name}
                                                </TableCell>
                                                <TableCell align="right">
                                                    <IconButton onClick={() => handleEdit(dept.id)}>
                                                        <FaRegEdit style={{
                                                            width: 15,
                                                            height: 15
                                                        }} />
                                                    </IconButton>
                                                    <IconButton onClick={handleOpenModal}>
                                                        <RiDeleteBin6Line style={{
                                                            width: 15,
                                                            height: 15
                                                        }} />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                            {/*add department modal*/}
                            <Dialog
                                open={openAddModal}
                                onClose={handleClose}
                                maxWidth="sm"
                                fullWidth
                                PaperProps={{
                                    sx: {
                                        borderRadius: 1,
                                        boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
                                    }
                                }}
                            >
                                <DialogContent sx={{ pt: 3, pb: 2 }}>
                                    {/* Name label and input field */}
                                    <Typography
                                        variant="body1"
                                        sx={{
                                            mb: 1,
                                            fontWeight: 500,
                                            color: '#121212'
                                        }}
                                    >
                                        Name
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        placeholder="e.g. Cleaning"
                                        value={departmentName}
                                        onChange={(e) => setDepartmentName(e.target.value)}
                                        variant="outlined"
                                        sx={{
                                            mb: 2,
                                            '& .MuiOutlinedInput-root': {
                                                '& fieldset': {
                                                    borderColor: '#e0e0e0',
                                                },
                                                '&:hover fieldset': {
                                                    borderColor: '#000000',
                                                },
                                            }
                                        }}
                                    />
                                </DialogContent>

                                {/* Action buttons */}
                                <DialogActions sx={{ px: 3, pb: 2 }}>
                                    <Button
                                        onClick={handleClose}
                                        sx={{
                                            color: '#666',
                                            textTransform: 'none',
                                            '&:hover': {
                                                backgroundColor: 'rgba(0, 0, 0, 0.04)'
                                            }
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleAdd}
                                        sx={{
                                            backgroundColor: '#063455',
                                            color: 'white',
                                            textTransform: 'none',
                                            px: 3,
                                            '&:hover': {
                                                backgroundColor: '#052c47'
                                            }
                                        }}
                                    >
                                        Add
                                    </Button>
                                </DialogActions>
                            </Dialog>

                            {/* Detele Modal */}
                            <Dialog
                                open={openDeleteModal}
                                onClose={handleCloseModal}
                                maxWidth="xs"
                                PaperProps={{
                                    sx: {
                                        borderRadius: 1,
                                        boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
                                        width: '300px'
                                    }
                                }}
                            >
                                <DialogContent sx={{ pt: 3 }}>
                                    <Typography
                                        variant="h6"
                                        sx={{
                                            textAlign: 'center',
                                            fontWeight: 500,
                                            mb: 2
                                        }}
                                    >
                                        Delete Department?
                                    </Typography>
                                </DialogContent>

                                <DialogActions sx={{ px: 2, pb: 2, justifyContent: 'center', gap: 1 }}>
                                    <Button
                                        onClick={handleCloseModal}
                                        variant="outlined"
                                        sx={{
                                            color: '#666',
                                            borderColor: '#ddd',
                                            textTransform: 'none',
                                            px: 3,
                                            flex: 1,
                                            '&:hover': {
                                                borderColor: '#bbb',
                                                backgroundColor: 'rgba(0, 0, 0, 0.04)'
                                            }
                                        }}
                                    >
                                        Close
                                    </Button>
                                    <Button
                                        onClick={confirmDelete}
                                        variant="contained"
                                        sx={{
                                            backgroundColor: '#f44336',
                                            color: 'white',
                                            textTransform: 'none',
                                            px: 3,
                                            flex: 1,
                                            '&:hover': {
                                                backgroundColor: '#d32f2f'
                                            }
                                        }}
                                    >
                                        Delete
                                    </Button>
                                </DialogActions>
                            </Dialog>
                        </div>
                    </div>
                </Box>
            {/* </div> */}
        </>
    );
};

export default DashboardList;
