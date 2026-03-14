import React, { useEffect, useState } from "react";
import { Grid, Typography, Button, Divider, TextField, Snackbar, Alert } from "@mui/material";
import { router } from '@inertiajs/react';
import axios from "axios";

const PersonalDetails = ({ employee }) => {

	const [isLoading, setIsLoading] = useState(false);
	const [errors, setErrors] = useState({});
	const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
	const [personalDetails, setPersonalDetails] = useState({
		employee_id: "",
		address: null,
		emergency_no: null,
		gender: "male",
		marital_status: "single",
		national_id: null,
		account_no: null,
		salary: 0,
		joining_date: "",
		name: "",
		email: "",
		designation: "",
		phone_no: "",
		department: {
			name: "",
		},
	});

	useEffect(() => {
		if (employee) {
			setPersonalDetails(employee);
		}
	}, [employee]);

	const validate = () => {
		let newErrors = {};
		if (!personalDetails.name) newErrors.name = "Name is required";
		if (!personalDetails.employee_id) newErrors.employee_id = "Employee ID is required";
		if (!personalDetails.email) newErrors.email = "Email is required";
		if (!personalDetails.phone_no) newErrors.phone_no = "Phone number is required";
		if (!personalDetails.salary) newErrors.salary = "Salary is required";
		if (!personalDetails.joining_date) newErrors.joining_date = "Joining date is required";
		if (!personalDetails.gender) newErrors.gender = "Gender is required";
		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = async () => {
		if (!validate()) return;

		setIsLoading(true);
		try {
			const payload = {
				...personalDetails,
			};
			await axios.put(`/api/employees/update/${employee.employee_id}`, payload);
			setSnackbar({ open: true, message: "Employee updated successfully!", severity: "success" });
			setTimeout(() => router.visit(route('employees.dashboard')), 1500);
		} catch (error) {
			// console.log(error.response.data);
			setSnackbar({ open: true, message: error.response.data.message, severity: "error" });
		} finally {
			setIsLoading(false);
		}
	};

	const handleCloseSnackbar = () => {
		setSnackbar({ ...snackbar, open: false });
	};
	return (
		<>
			<Typography variant="h6">Personal Detail</Typography>
			<Divider sx={{ backgroundColor: "black", height: 2, marginTop: 1 }} />
			<Grid
				container
				spacing={2}
				style={{
					marginTop: "0.5rem",
				}}>
				<Grid item xs={12} md={6}>
					<Typography variant="body2" fontWeight="bold">
						Employee Name
					</Typography>
					<TextField fullWidth value={personalDetails.name || "N/A"} onChange={(e) => setPersonalDetails({ ...personalDetails, name: e.target.value })} margin="normal" variant="outlined" />
				</Grid>
				<Grid item xs={12} md={6}>
					<Typography variant="body2" fontWeight="bold">
						Employee ID
					</Typography>
					<TextField fullWidth value={personalDetails.employee_id || "N/A"} onChange={(e) => setPersonalDetails({ ...personalDetails, employee_id: e.target.value })} margin="normal" variant="outlined" />
				</Grid>
				<Grid item xs={12} md={6}>
					<Typography variant="body2" fontWeight="bold">
						National ID
					</Typography>
					<TextField fullWidth value={personalDetails.national_id || "N/A"} onChange={(e) => setPersonalDetails({ ...personalDetails, national_id: e.target.value })} margin="normal" variant="outlined" />
				</Grid>

				{/* Bank Account Number */}
				<Grid item xs={12} md={6}>
					<Typography variant="body2" fontWeight="bold">
						Bank Account Number
					</Typography>
					<TextField fullWidth value={personalDetails.account_no || "N/A"} onChange={(e) => setPersonalDetails({ ...personalDetails, account_no: e.target.value })} margin="normal" variant="outlined" />
				</Grid>

				<Grid item xs={12} md={6}>
					<Typography variant="body2" fontWeight="bold">
						Gender
					</Typography>
					<TextField sx={{ mt: 2 }} select name="gender" value={personalDetails.gender} onChange={(e) => setPersonalDetails({ ...personalDetails, gender: e.target.value })} fullWidth variant="outlined" SelectProps={{ native: true }}>
						<option value="">Select Gender</option>
						<option value="male">Male</option>
						<option value="female">Female</option>
					</TextField>
				</Grid>
				<Grid item xs={12} md={6}>
					<Typography variant="body2" fontWeight="bold">
						Marital Status
					</Typography>
					<TextField sx={{ mt: 2 }} select name="gender" value={personalDetails.marital_status} onChange={(e) => setPersonalDetails({ ...personalDetails, marital_status: e.target.value })} fullWidth variant="outlined" SelectProps={{ native: true }}>
						<option value="">Select Marital Status</option>
						<option value="single">Single</option>
						<option value="married">Married</option>
						<option value="divorced">Divorced</option>
						<option value="widowed">Widowed</option>
					</TextField>
				</Grid>

				<Grid item xs={12}>
					<Divider sx={{ backgroundColor: "black", height: 0.01, marginY: 1 }} />
				</Grid>

				<Grid item xs={12}>
					<Typography variant="h6" fontWeight="">
						Contact Detail
					</Typography>
					<Divider sx={{ backgroundColor: "black", height: 2, marginTop: 1 }} />
				</Grid>

				{/* Email */}
				<Grid item xs={12} md={6}>
					<Typography variant="body2" fontWeight="bold">
						Email
					</Typography>
					<TextField fullWidth value={personalDetails.email || "N/A"} onChange={(e) => setPersonalDetails({ ...personalDetails, email: e.target.value })} margin="normal" variant="outlined" />
				</Grid>

				{/* Contact Number */}
				<Grid item xs={12} md={6}>
					<Typography variant="body2" fontWeight="bold">
						Contact Number
					</Typography>
					<TextField fullWidth value={personalDetails.phone_no || "N/A"} onChange={(e) => setPersonalDetails({ ...personalDetails, phone_no: e.target.value })} margin="normal" variant="outlined" />
				</Grid>

				{/* Emergency Contact */}
				<Grid item xs={12} md={6}>
					<Typography variant="body2" fontWeight="bold">
						Emergency Number
					</Typography>
					<TextField fullWidth value={personalDetails.emergency_no || "N/A"} onChange={(e) => setPersonalDetails({ ...personalDetails, emergency_no: e.target.value })} margin="normal" variant="outlined" />
				</Grid>

				<Divider sx={{ backgroundColor: "black", height: 5, marginTop: 1 }} />

				{/* Address (Full width to avoid cramping) */}
				<Grid item xs={12} md={6}>
					<Typography variant="body2" fontWeight="bold">
						Address
					</Typography>
					<TextField fullWidth value={personalDetails.address || "N/A"} onChange={(e) => setPersonalDetails({ ...personalDetails, address: e.target.value })} margin="normal" variant="outlined" />
				</Grid>

				<Grid item xs={12} style={{ display: "flex", justifyContent: "flex-end" }}>
					<Button disabled={isLoading} onClick={handleSubmit} variant="contained" sx={{ backgroundColor: '#063455', color: '#FFFFFF', "&:hover": { backgroundColor: '#063455' } }}>
						Save
					</Button>
				</Grid>
			</Grid>

			<Snackbar open={snackbar.open} autoHideDuration={3000} onClose={handleCloseSnackbar}>
				<Alert onClose={handleCloseSnackbar} severity={snackbar.severity} variant="filled">
					{snackbar.message}
				</Alert>
			</Snackbar>
		</>
	);
};

export default PersonalDetails;
