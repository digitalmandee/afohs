import { router } from '@inertiajs/react';
import AddIcon from '@mui/icons-material/Add';
import { FaRegEdit } from 'react-icons/fa';
import { RiDeleteBin6Line } from 'react-icons/ri';
import SearchIcon from '@mui/icons-material/Search';
import { Box, Button, IconButton, TextField, DialogActions, InputBase, Dialog, DialogContent, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, CircularProgress, MenuItem, Select, FormControl, InputLabel, TablePagination, Autocomplete, Chip, OutlinedInput, Checkbox, ListItemText } from '@mui/material';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import { FaTrash } from 'react-icons/fa';
import { FaEdit } from 'react-icons/fa';
import { Delete } from '@mui/icons-material';

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Helper to format 24-hour time to 12-hour AM/PM format
const formatTime = (timeString) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
};

const ShiftIndex = ({ shifts: initialShifts }) => {
    const { enqueueSnackbar } = useSnackbar();
    const [loading, setLoading] = useState(false);
    // If passed from controller as prop, usage depends on implementation.
    // Here we might fetch via API or use props. Designation.jsx fetches via API.
    // Let's stick to API for pagination consistency if controller uses API for data.
    // Controller `index` returns `shifts` prop. Designation.jsx calls `designations.data` API.
    // ShiftController currently passing `shifts` prop to Index. let's use that or setup API.
    // Designation.jsx setup:
    //   useEffect -> fetchDesignations via `designations.data` route.
    // ShiftController.php `index`: returns `shifts` (paginated).
    // So we can use initialShifts directly, but searching/pagination usually requires router.visit or API.
    // Designation.jsx uses API for sorting/searching without full reload? No, it looks like it does client side or async fetch.
    // Let's use router visit for pagination/searching to keep it simple with Inertia or stick to API if prefer SPA feel.
    // Designation.jsx uses `axios` to fetch data. Let's replicate that pattern since it likely matches other admin pages.
    // But, ShiftController doesn't have a specific `data` route yet?
    // Wait, DesignationController had `fetchData`. ShiftController needs `list` (for dropdowns) but maybe I didn't add a `fetchData` equivalent for the table?
    // ShiftController `index` returns Inertia render.
    // I will use Inertia router for pagination/search to avoid needing a separate API route right now.
    // It is cleaner for standard CRUD.

    // Actually, looking at Designation.jsx, it sets `designations` from `res.data.data.data`.
    // I should probably stick to Inertia props if I can, it's easier.
    // But let's check what I wrote in ShiftController.
    // `public function index() { $shifts = Shift::latest()->paginate(10); return Inertia::render(..., ['shifts' => $shifts]); }`
    // So I have `shifts` as prop.

    const { data: shiftsData, current_page, per_page, total, last_page } = initialShifts;
    const [search, setSearch] = useState('');

    // Modal States
    const [openAddModal, setOpenAddModal] = useState(false);
    const [openDeleteModal, setOpenDeleteModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedShift, setSelectedShift] = useState(null);

    // Form States
    const [formData, setFormData] = useState({
        name: '',
        start_time: '',
        end_time: '',
        relaxation_time: 0,
        weekend_days: [],
        status: true,
    });

    const handleSearch = (e) => {
        if (e.key === 'Enter') {
            router.visit(route('shifts.index'), {
                data: { search: search },
                preserveState: true,
                preserveScroll: true,
            });
        }
    };

    const handlePageChange = (event, newPage) => {
        router.visit(route('shifts.index'), {
            data: { page: newPage + 1, search }, // MUI Page is 0-indexed
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleOpen = () => {
        setFormData({
            name: '',
            start_time: '09:00',
            end_time: '18:00',
            relaxation_time: 0,
            weekend_days: [],
            status: true,
        });
        setEditMode(false);
        setOpenAddModal(true);
    };

    const handleEdit = (shift) => {
        setFormData({
            name: shift.name,
            start_time: shift.start_time,
            end_time: shift.end_time,
            relaxation_time: shift.relaxation_time,
            weekend_days: shift.weekend_days || [],
            status: shift.status,
        });
        setSelectedShift(shift);
        setEditMode(true);
        setOpenAddModal(true);
    };

    const handleClose = () => {
        setOpenAddModal(false);
        setEditMode(false);
        setSelectedShift(null);
    };

    const handleSubmit = () => {
        if (!formData.name || !formData.start_time || !formData.end_time) {
            enqueueSnackbar('Please fill required fields', { variant: 'error' });
            return;
        }

        const url = editMode ? route('shifts.update', selectedShift.id) : route('shifts.store');
        const method = editMode ? 'put' : 'post';

        router[method](url, formData, {
            onSuccess: () => {
                enqueueSnackbar(editMode ? 'Shift updated successfully' : 'Shift created successfully', { variant: 'success' });
                handleClose();
            },
            onError: (errors) => {
                console.error(errors);
                enqueueSnackbar('Operation failed. Check inputs.', { variant: 'error' });
            },
        });
    };

    const handleDeleteClick = (shift) => {
        setSelectedShift(shift);
        setOpenDeleteModal(true);
    };

    const confirmDelete = () => {
        router.delete(route('shifts.destroy', selectedShift.id), {
            onSuccess: () => {
                enqueueSnackbar('Shift deleted successfully', { variant: 'success' });
                setOpenDeleteModal(false);
            },
            onError: () => {
                enqueueSnackbar('Failed to delete shift', { variant: 'error' });
            },
        });
    };

    return (
        <Box sx={{ p: 2, height: '100vh', bgcolor: '#f5f5f5' }}>
            <div style={{ paddingTop: '1rem', backgroundColor: 'transparent' }}>
                <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <Typography sx={{ fontWeight: 700, fontSize: '30px', color: '#063455' }}>Shift Management</Typography>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.1rem', marginLeft: 'auto' }}>
                        <Button variant='contained' style={{ color: '#fff', backgroundColor: '#063455', textTransform: 'none', borderRadius: '16px' }} startIcon={<AddIcon />} onClick={handleOpen}>
                            Add Shift
                        </Button>

                        <Button
                            onClick={() => router.visit(route('shifts.trashed'))}
                            style={{
                                // color: '#063455',
                                // backgroundColor: 'white',
                                borderRadius: '16px',
                                height: 35,
                                marginLeft: '10px',
                                textTransform: 'none',
                                // border: '1px solid #063455',
                            }}
                            variant="outlined"
                            color='error'
                            startIcon={<FaTrash size={14} />}
                        >
                            Trashed
                        </Button>
                    </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <TextField
                        placeholder="Search shift..."
                        size="small"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={handleSearch}
                        sx={{
                            width: '280px',
                            '& .MuiOutlinedInput-root': {
                                borderRadius: '16px',
                            },
                        }}
                        InputProps={{
                            startAdornment: <SearchIcon sx={{ color: '#7f7f7f', mr: 1 }} />,
                            style: { backgroundColor: 'transparent' },
                        }}
                    />
                </div>

                <TableContainer component={Paper} style={{ width: '100%', borderRadius: '12px', boxShadow: 'none', marginTop: '24px' }}>
                    <Table>
                        <TableHead style={{ backgroundColor: '#063455' }}>
                            <TableRow>
                                <TableCell style={{ color: '#fff', fontWeight: '600', }}>Name</TableCell>
                                <TableCell style={{ color: '#fff', fontWeight: '600', }}>Time</TableCell>
                                <TableCell style={{ color: '#fff', fontWeight: '600', }}>Weekends</TableCell>
                                <TableCell style={{ color: '#fff', fontWeight: '600', }}>Relaxation</TableCell>
                                <TableCell style={{ color: '#fff', fontWeight: '600', }}>Status</TableCell>
                                <TableCell style={{ color: '#fff', fontWeight: '600', }}>
                                    Action
                                </TableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {shiftsData.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center">
                                        No shifts found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                shiftsData.map((item, index) => (
                                    <TableRow key={index}>
                                        <TableCell style={{ fontSize: '14px', color: '#7f7f7f' }}>{item.name}</TableCell>
                                        <TableCell style={{ fontSize: '14px', color: '#7f7f7f' }}>
                                            {formatTime(item.start_time)} - {formatTime(item.end_time)}
                                        </TableCell>
                                        <TableCell style={{ fontSize: '14px', color: '#7f7f7f' }}>
                                            {item.weekend_days?.map((d) => (
                                                <Chip key={d} label={d.substring(0, 3)} size="small" sx={{ mr: 0.5 }} />
                                            ))}
                                        </TableCell>
                                        <TableCell style={{ fontSize: '14px', color: '#7f7f7f' }}>{item.relaxation_time} min</TableCell>
                                        <TableCell style={{ fontSize: '14px', color: item.status ? 'green' : 'red' }}>{item.status ? 'Active' : 'Inactive'}</TableCell>
                                        <TableCell>
                                            <IconButton onClick={() => handleEdit(item)}
                                            >
                                                <FaEdit size={18} style={{ marginRight: 10, color: '#f57c00' }} />
                                            </IconButton>
                                            <Button startIcon={<Delete />} onClick={() => handleDeleteClick(item)}
                                                color="error" />
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                <TablePagination rowsPerPageOptions={[10, 25, 50]} component="div" count={total} rowsPerPage={per_page} page={current_page - 1} onPageChange={handlePageChange} />

                {/* Add/Edit Modal */}
                <Dialog open={openAddModal} onClose={handleClose} maxWidth="sm" fullWidth>
                    <DialogContent sx={{ pt: 3, pb: 2 }}>
                        <Typography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>
                            {editMode ? 'Edit Shift' : 'Add Shift'}
                        </Typography>

                        <Typography variant="body1" sx={{ mb: 1, fontWeight: 500 }}>
                            Name
                        </Typography>
                        <TextField fullWidth value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} variant="outlined" sx={{ mb: 2 }} />

                        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="body1" sx={{ mb: 1, fontWeight: 500 }}>
                                    Start Time
                                </Typography>
                                <TextField fullWidth type="time" value={formData.start_time} onChange={(e) => setFormData({ ...formData, start_time: e.target.value })} variant="outlined" />
                            </Box>
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="body1" sx={{ mb: 1, fontWeight: 500 }}>
                                    End Time
                                </Typography>
                                <TextField fullWidth type="time" value={formData.end_time} onChange={(e) => setFormData({ ...formData, end_time: e.target.value })} variant="outlined" />
                            </Box>
                        </Box>

                        <Typography variant="body1" sx={{ mb: 1, fontWeight: 500 }}>
                            Weekend Days
                        </Typography>
                        <FormControl fullWidth sx={{ mb: 2 }}>
                            <Select
                                multiple
                                value={formData.weekend_days}
                                onChange={(e) => {
                                    const {
                                        target: { value },
                                    } = e;
                                    setFormData({ ...formData, weekend_days: typeof value === 'string' ? value.split(',') : value });
                                }}
                                input={<OutlinedInput />}
                                renderValue={(selected) => (
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                        {selected.map((value) => (
                                            <Chip key={value} label={value} size="small" />
                                        ))}
                                    </Box>
                                )}
                            >
                                {WEEKDAYS.map((day) => (
                                    <MenuItem key={day} value={day}>
                                        <Checkbox checked={formData.weekend_days.indexOf(day) > -1} />
                                        <ListItemText primary={day} />
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <Typography variant="body1" sx={{ mb: 1, fontWeight: 500 }}>
                            Relaxation Time (Minutes)
                        </Typography>
                        <TextField fullWidth type="number" value={formData.relaxation_time} onChange={(e) => setFormData({ ...formData, relaxation_time: parseInt(e.target.value) || 0 })} variant="outlined" sx={{ mb: 2 }} />

                        <FormControl fullWidth>
                            <InputLabel id="status-label">Status</InputLabel>
                            <Select labelId="status-label" value={formData.status} label="Status" onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                                <MenuItem value={true}>Active</MenuItem>
                                <MenuItem value={false}>Inactive</MenuItem>
                            </Select>
                        </FormControl>
                    </DialogContent>

                    <DialogActions sx={{ px: 3, pb: 2 }}>
                        <Button onClick={handleClose}>Cancel</Button>
                        <Button onClick={handleSubmit} variant="contained" sx={{ backgroundColor: '#063455' }}>
                            {editMode ? 'Update' : 'Add'}
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Delete Modal */}
                <Dialog open={openDeleteModal} onClose={() => setOpenDeleteModal(false)} maxWidth="xs">
                    <DialogContent sx={{ pt: 3 }}>
                        <Typography variant="h6" align="center" sx={{ mb: 2 }}>
                            Delete Shift?
                        </Typography>
                        <Typography variant="body2" align="center" color="textSecondary">
                            This action cannot be undone.
                        </Typography>
                    </DialogContent>
                    <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
                        <Button onClick={() => setOpenDeleteModal(false)} variant="outlined">
                            Close
                        </Button>
                        <Button onClick={confirmDelete} variant="contained" color="error">
                            Delete
                        </Button>
                    </DialogActions>
                </Dialog>
            </div>
        </Box>
    );
};

export default ShiftIndex;
