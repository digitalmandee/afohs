import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Grid, TextField, Typography, Box, CircularProgress, Autocomplete } from '@mui/material';
import { useForm } from '@inertiajs/react';
import axios from 'axios';
import { enqueueSnackbar } from 'notistack';

const TransferModal = ({ open, onClose, employee, onSuccess }) => {
    // We store objects for Autocomplete, but the form data needs IDs
    const { data, setData, post, processing, errors, reset } = useForm({
        employee_id: null,

        to_department_id: '',
        to_subdepartment_id: '',
        to_designation_id: '',
        to_branch_id: '',
        to_shift_id: '',

        transfer_date: new Date().toISOString().split('T')[0],
        reason: '',
    });

    // Local state for Autocomplete values (Objects) to control the inputs
    const [selectedBranch, setSelectedBranch] = useState(null);
    const [selectedDepartment, setSelectedDepartment] = useState(null);
    const [selectedSubDepartment, setSelectedSubDepartment] = useState(null);
    const [selectedDesignation, setSelectedDesignation] = useState(null);
    const [selectedShift, setSelectedShift] = useState(null);

    const [departments, setDepartments] = useState([]);
    const [subdepartments, setSubdepartments] = useState([]);
    const [designations, setDesignations] = useState([]);
    const [branches, setBranches] = useState([]);
    const [shifts, setShifts] = useState([]);
    const [isLoadingData, setIsLoadingData] = useState(false);

    // Initial Data Load
    useEffect(() => {
        if (open && employee) {
            // Reset form data with employee current details or empty
            setData({
                employee_id: employee.id,
                to_department_id: employee.department_id || '',
                to_subdepartment_id: employee.subdepartment_id || '',
                to_designation_id: employee.designation_id || '',
                to_branch_id: employee.branch_id || '',
                to_shift_id: employee.shift_id || '',
                transfer_date: new Date().toISOString().split('T')[0],
                reason: '',
            });

            // Trigger fetches
            fetchDropdownData();

            // Note: We don't pre-fill the "Selected" states (Branch, Dept, etc.)
            // because the user wants to transfer TO somewhere else.
            // Keeping them empty forces the user to choose the new location.
            // OR if you want them to start with current values, you'd need to find the objects in the arrays
            // which is complex because arrays might not be loaded yet.
            // Better to leave empty for "New Transfer Details".
            setSelectedBranch(null);
            setSelectedDepartment(null);
            setSelectedSubDepartment(null);
            setSelectedDesignation(null);
            setSelectedShift(null);
        }
    }, [open, employee]);

    const fetchDropdownData = async () => {
        setIsLoadingData(true);
        try {
            const [branchesRes, shiftsRes, designationsRes, departmentsRes] = await Promise.all([
                axios.get(route('branches.list')),
                axios.get(route('shifts.list')),
                axios.get(route('designations.list')),
                axios.get(route('api.departments.listAll', { type: 'search' })), // Force search type to get simple list
            ]);

            // Branches
            if (branchesRes.data.success) setBranches(branchesRes.data.branches || []);
            else if (Array.isArray(branchesRes.data)) setBranches(branchesRes.data);

            // Shifts
            if (shiftsRes.data.success) setShifts(shiftsRes.data.shifts || []);
            else if (Array.isArray(shiftsRes.data)) setShifts(shiftsRes.data);

            // Designations
            if (designationsRes.data.success) setDesignations(designationsRes.data.data || []);
            else if (designationsRes.data.data) setDesignations(designationsRes.data.data);
            else if (Array.isArray(designationsRes.data)) setDesignations(designationsRes.data);

            // Departments
            if (departmentsRes.data.results) setDepartments(departmentsRes.data.results || []);
        } catch (error) {
            console.error('Error fetching transfer data', error);
            enqueueSnackbar('Error loading transfer options', { variant: 'error' });
        }
        setIsLoadingData(false);
    };

    // Fetch Subdepartments when Department changes
    useEffect(() => {
        if (selectedDepartment?.id) {
            setData('to_department_id', selectedDepartment.id);
            // Reset subdepartment when dept changes
            setSelectedSubDepartment(null);
            setData('to_subdepartment_id', '');

            axios
                .get(route('api.subdepartments.listAll', { department_id: selectedDepartment.id, type: 'search' }))
                .then((res) => setSubdepartments(res.data.results || []))
                .catch((err) => console.error(err));
        } else {
            setSubdepartments([]);
            setData('to_department_id', '');
        }
    }, [selectedDepartment]);

    // Handlers for other autocomplete changes
    const handleBranchChange = (event, newValue) => {
        setSelectedBranch(newValue);
        setData('to_branch_id', newValue ? newValue.id : '');
    };

    const handleSubDeptChange = (event, newValue) => {
        setSelectedSubDepartment(newValue);
        setData('to_subdepartment_id', newValue ? newValue.id : '');
    };

    const handleDesignationChange = (event, newValue) => {
        setSelectedDesignation(newValue);
        setData('to_designation_id', newValue ? newValue.id : '');
    };

    const handleShiftChange = (event, newValue) => {
        setSelectedShift(newValue);
        setData('to_shift_id', newValue ? newValue.id : '');
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>Transfer Employee: {employee?.name}</DialogTitle>
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    post(route('employees.transfers.store'), {
                        onSuccess: () => {
                            enqueueSnackbar('Employee Transferred Successfully', { variant: 'success' });
                            onSuccess && onSuccess();
                            onClose();
                        },
                        onError: () => {
                            enqueueSnackbar('Failed to transfer', { variant: 'error' });
                        },
                    });
                }}
            >
                <DialogContent dividers>
                    <Box sx={{ p: 2 }}>
                        <Typography variant="subtitle2" gutterBottom color="textSecondary">
                            Current Location: {employee?.branch?.name || 'N/A'} | Dept: {employee?.department?.name || 'N/A'} | Sub: {employee?.subdepartment?.name || 'N/A'}
                        </Typography>

                        <Grid container spacing={2} sx={{ mt: 2 }}>
                            {/* Branch */}
                            <Grid item xs={6}>
                                <Autocomplete options={branches} getOptionLabel={(option) => option.name || ''} value={selectedBranch} onChange={handleBranchChange} renderInput={(params) => <TextField {...params} label="New Branch" fullWidth />} isOptionEqualToValue={(option, value) => option.id === value.id} />
                            </Grid>

                            {/* Department */}
                            <Grid item xs={6}>
                                <Autocomplete options={departments} getOptionLabel={(option) => option.name || ''} value={selectedDepartment} onChange={(event, newValue) => setSelectedDepartment(newValue)} renderInput={(params) => <TextField {...params} label="New Department" fullWidth />} isOptionEqualToValue={(option, value) => option.id === value.id} />
                            </Grid>

                            {/* SubDepartment */}
                            <Grid item xs={6}>
                                <Autocomplete
                                    options={subdepartments}
                                    getOptionLabel={(option) => option.name || ''}
                                    value={selectedSubDepartment}
                                    onChange={handleSubDeptChange}
                                    disabled={!selectedDepartment} // Disable if no department selected
                                    renderInput={(params) => <TextField {...params} label="New Sub Department" fullWidth />}
                                    isOptionEqualToValue={(option, value) => option.id === value.id}
                                />
                            </Grid>

                            {/* Designation */}
                            <Grid item xs={6}>
                                <Autocomplete options={designations} getOptionLabel={(option) => option.name || ''} value={selectedDesignation} onChange={handleDesignationChange} renderInput={(params) => <TextField {...params} label="New Designation" fullWidth />} isOptionEqualToValue={(option, value) => option.id === value.id} />
                            </Grid>

                            {/* Shift */}
                            <Grid item xs={6}>
                                <Autocomplete options={shifts} getOptionLabel={(option) => `${option.name} (${option.start_time}-${option.end_time})`} value={selectedShift} onChange={handleShiftChange} renderInput={(params) => <TextField {...params} label="New Shift" fullWidth />} isOptionEqualToValue={(option, value) => option.id === value.id} />
                            </Grid>

                            <Grid item xs={12}>
                                <TextField fullWidth label="Transfer Date" type="date" InputLabelProps={{ shrink: true }} value={data.transfer_date} onChange={(e) => setData('transfer_date', e.target.value)} error={!!errors.transfer_date} helperText={errors.transfer_date} />
                            </Grid>

                            <Grid item xs={12}>
                                <TextField fullWidth label="Reason" multiline rows={3} value={data.reason} onChange={(e) => setData('reason', e.target.value)} />
                            </Grid>
                        </Grid>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>Cancel</Button>
                    <Button type="submit" variant="contained" disabled={processing}>
                        Confirm Transfer
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default TransferModal;
