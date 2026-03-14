import React, { useEffect, useState } from 'react';
import { usePage, router } from '@inertiajs/react';
import { Autocomplete, IconButton, TextField, Button, Alert, Select, MenuItem, FormHelperText, FormControl, InputLabel, Snackbar, Typography, Grid } from '@mui/material';
import { Box } from '@mui/system';
import { ArrowBack } from "@mui/icons-material"
import axios from 'axios';


const LeaveApplication = () => {
	const { props } = usePage();
	const { leaveApplication, employees, leaveCategories } = props;

	// const [open, setOpen] = useState(true);
	const [formData, setFormData] = useState({
		employee: null,
		leave_category_id: '',
		start_date: '',
		end_date: '',
		reason: '',
		status: 'pending',
	});
	const [isLoading, setIsLoading] = useState(false);
	const [errors, setErrors] = useState({});
	const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

	useEffect(() => {
		if (leaveApplication) {
			setFormData({
				employee: leaveApplication.employee || null,
				leave_category_id: leaveApplication.leave_category?.id || '',
				start_date: leaveApplication.start_date || '',
				end_date: leaveApplication.end_date || '',
				reason: leaveApplication.reason || '',
				status: leaveApplication.status || 'pending',
			});
		}
	}, [leaveApplication]);

	const handleChange = (e) => {
		setFormData({ ...formData, [e.target.name]: e.target.value });
	};

	const handleAutocompleteChange = (event, value, field) => {
		setFormData({ ...formData, [field]: value });
	};

	const validateForm = () => {
		let tempErrors = {};
		if (!formData.employee) tempErrors.employee = "Employee is required";
		if (!formData.leave_category_id) tempErrors.leave_category_id = "Category is required";
		if (!formData.start_date) tempErrors.start_date = "Start date is required";
		if (!formData.end_date) tempErrors.end_date = "End date is required";
		if (formData.start_date && formData.end_date && formData.start_date > formData.end_date) {
			tempErrors.end_date = "End date must be after start date";
		}
		if (!formData.reason) tempErrors.reason = "Reason is required";
		setErrors(tempErrors);
		return Object.keys(tempErrors).length === 0;
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!validateForm()) return;

		try {
			setIsLoading(true);
			const response = leaveApplication
				? await axios.put(`/api/leave-applications/${leaveApplication.id}`, { ...formData, employee_id: formData.employee.id })
				: await axios.post('/api/leave-applications/', { ...formData, employee_id: formData.employee.id });
			setSnackbar({ open: true, message: response.data.message, severity: 'success' });
			setTimeout(() => router.visit(route('employees.leaves.application.index')), 1500);
		} catch (error) {
			setSnackbar({ open: true, message: error.response?.data?.message ?? 'Something went wrong', severity: 'error' });
		} finally {
			setIsLoading(false);
		}
	};

	const handleCloseSnackbar = () => {
		setSnackbar({ ...snackbar, open: false });
	};

	return (
		<>
			{/* <SideNav open={open} setOpen={setOpen} /> */}
			<div
				style={{
					backgroundColor: '#f5f5f5',
				}}
			>
				<Box sx={{ px: 2, py: 2 }}>
					<div style={{ paddingTop: '0.5rem' }}>
						<div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
							<IconButton
								onClick={() => window.history.back()}>
								<ArrowBack sx={{ color: '#063455' }} />
							</IconButton>
							<Typography style={{ fontWeight: '600', color: '#063455', fontSize:'30px' }}>
								{leaveApplication ? 'Edit Leave Application' : 'New Leave Application'}
							</Typography>
						</div>
						<form onSubmit={handleSubmit} style={{ maxWidth: '600px', margin: 'auto', padding: '24px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
							<Autocomplete
								className="mb-3"
								options={employees || []}
								getOptionLabel={(option) => {
									if (option.user?.name) {
										return `${option.user.name} (${option.employee_id || 'N/A'})`;
									}
									return option.name || '';
								}}
								value={formData.employee}
								onChange={(event, value) => handleAutocompleteChange(event, value, 'employee')}
								renderInput={(params) => (
									<TextField
										{...params}
										label="Select Employee"
										variant="outlined"
										error={!!errors.employee}
										helperText={errors.employee}
										style={{ marginBottom: '16px' }}
									/>
								)}
							/>

							<FormControl fullWidth error={!!errors.leave_category_id} style={{ marginBottom: '16px' }}>
								<InputLabel id="leave-category-label">Leave Category</InputLabel>
								<Select
									labelId="leave-category-label"
									value={formData.leave_category_id}
									label="Leave Category"
									name="leave_category_id"
									onChange={handleChange}
								>
									<MenuItem value="">Select one</MenuItem>
									{(leaveCategories || []).map((item) => (
										<MenuItem key={item.id} value={item.id}>
											{item.name}
										</MenuItem>
									))}
								</Select>
								<FormHelperText>{errors.leave_category_id}</FormHelperText>
							</FormControl>

							<Grid container spacing={2}>
								<Grid item xs={12} sm={6}>
									<TextField
										type="date"
										label="Start Date"
										InputLabelProps={{ shrink: true }}
										fullWidth
										name="start_date"
										value={formData.start_date}
										onChange={handleChange}
										error={!!errors.start_date}
										helperText={errors.start_date}
									/>
								</Grid>

								<Grid item xs={12} sm={6}>
									<TextField
										type="date"
										label="End Date"
										InputLabelProps={{ shrink: true }}
										fullWidth
										name="end_date"
										value={formData.end_date}
										onChange={handleChange}
										error={!!errors.end_date}
										helperText={errors.end_date}
									/>
								</Grid>
							</Grid>
							<TextField multiline rows={3} label="Reason" fullWidth name="reason" value={formData.reason} onChange={handleChange} margin="normal" error={!!errors.reason} helperText={errors.reason} />

							{leaveApplication && (
								<FormControl fullWidth error={!!errors.status} style={{ marginBottom: '16px' }}>
									<InputLabel id="status-label">Status</InputLabel>
									<Select
										labelId="status-label"
										value={formData.status}
										onChange={handleChange}
										name="status"
										label="Status"
									>
										<MenuItem value="pending">Pending</MenuItem>
										<MenuItem value="approved">Approved</MenuItem>
										<MenuItem value="rejected">Rejected</MenuItem>
									</Select>
								</FormControl>
							)}

							<div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
								<button
									type="button"
									style={{
										padding: '8px 16px',
										fontSize: '14px',
										border: '1px solid #E0E0E0',
										borderRadius: '4px',
										backgroundColor: 'white',
										color: '#666',
										cursor: 'pointer',
									}}
									onClick={() => router.visit(route('employees.leaves.application.index'))}
								>
									Cancel
								</button>
								<Button
									type="submit"
									disabled={isLoading}
									variant="contained"
									sx={{ backgroundColor: '#063455', color: 'white' }}
								>
									{leaveApplication ? 'Update' : 'Add'}
								</Button>
							</div>
						</form>
					</div>
				</Box>
			</div>

			<Snackbar open={snackbar.open} autoHideDuration={3000} onClose={handleCloseSnackbar}>
				<Alert onClose={handleCloseSnackbar} severity={snackbar.severity} variant="filled">
					{snackbar.message}
				</Alert>
			</Snackbar>
		</>
	);
};

export default LeaveApplication;
