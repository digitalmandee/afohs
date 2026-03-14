import React, { useState, useEffect } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { Box, Card, CardContent, Typography, Grid, TextField, Button, Select, MenuItem, FormControl, InputLabel, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, FormControlLabel, Checkbox, LinearProgress, IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, Chip, Autocomplete } from '@mui/material';
import { Save, Download, Upload, Refresh, Info, Help, DoneAll } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import axios from 'axios';
import { useSnackbar } from 'notistack';

export default function SalarySheet() {
    const { auth } = usePage().props;
    const { enqueueSnackbar } = useSnackbar();

    // Filters
    const [month, setMonth] = useState(dayjs());
    const [employeeType, setEmployeeType] = useState('all');
    const [designation, setDesignation] = useState('all');
    const [location, setLocation] = useState('all');
    const [datePickerOpen, setDatePickerOpen] = useState(false);
    const [helpOpen, setHelpOpen] = useState(false);

    const [periodStatus, setPeriodStatus] = useState('draft');

    // Data
    const [loading, setLoading] = useState(false);
    const [payslips, setPayslips] = useState([]);
    const [allowanceHeaders, setAllowanceHeaders] = useState([]);
    const [deductionHeaders, setDeductionHeaders] = useState([]);
    const [designations, setDesignations] = useState([]);
    const [locations, setLocations] = useState([]);
    const [employeeTypes, setEmployeeTypes] = useState([]);

    // Fetch Data
    const fetchData = () => {
        setLoading(true);
        const params = {
            month: month.format('YYYY-MM'),
            employee_type: employeeType,
            designation: designation, // Passing name here
            location: location,
        };

        axios
            .get(route('api.payroll.salary-sheet'), { params })
            .then((res) => {
                if (res.data.success) {
                    setPayslips(res.data.payslips);
                    setAllowanceHeaders(res.data.allowance_headers || []);
                    setDeductionHeaders(res.data.deduction_headers || []);
                    // setDesignations(res.data.designations || []); // Don't overwrite with strings, use master list
                    setLocations(res.data.locations || []);
                    setEmployeeTypes(res.data.employee_types || []);
                    setPeriodStatus(res.data.period_status || 'draft');
                }
            })
            .catch((err) => {
                console.error(err);
                enqueueSnackbar('Failed to fetch salary sheet', { variant: 'error' });
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchData();
        // Fetch Master Usage List
        axios.get(route('designations.list')).then((res) => {
            if (res.data.success) {
                setDesignations(res.data.data);
            }
        });
    }, [month]); // Auto fetch on month change

    // Handle Edit
    const handleValueChange = (payslipId, type, headerId, value) => {
        // Optimistic UI update
        const newPayslips = payslips.map((p) => {
            if (p.id === payslipId) {
                // Update specific allowance/deduction
                if (type === 'allowance') {
                    const updatedAllowances = p.allowances.map((a) => (a.allowance_type_id === headerId ? { ...a, amount: parseFloat(value) || 0 } : a));
                    // Recalculate Totals
                    const totalAllowances = updatedAllowances.reduce((sum, a) => sum + (parseFloat(a.amount) || 0), 0);
                    const gross = parseFloat(p.basic_salary) + totalAllowances;
                    const totalDeductions = p.deductions.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);
                    const net = gross - totalDeductions;

                    return { ...p, allowances: updatedAllowances, total_allowances: totalAllowances, gross_salary: gross, net_salary: net };
                } else if (type === 'deduction') {
                    const updatedDeductions = p.deductions.map((d) => (d.deduction_type_id === headerId ? { ...d, amount: parseFloat(value) || 0 } : d));
                    // Recalculate Totals
                    const totalDeductions = updatedDeductions.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);
                    const gross = parseFloat(p.gross_salary);
                    const net = gross - totalDeductions;

                    return { ...p, deductions: updatedDeductions, total_deductions: totalDeductions, net_salary: net };
                }
            }
            return p;
        });
        setPayslips(newPayslips);
    };

    const handleSave = () => {
        setLoading(true);
        axios
            .post(route('api.payroll.salary-sheet.update'), { payslips })
            .then((res) => {
                enqueueSnackbar('Salary Sheet Saved Successfully', { variant: 'success' });
                fetchData(); // Refresh to get server-side validations/calcs if any
            })
            .catch((err) => {
                enqueueSnackbar('Failed to save changes', { variant: 'error' });
            })
            .finally(() => setLoading(false));
    };

    const handlePost = () => {
        if (!confirm('Are you sure you want to POST this payroll? This will lock the period and generate financial transactions (Expenses).')) return;

        setLoading(true);
        axios
            .post(route('api.payroll.salary-sheet.post'), { month: month.format('YYYY-MM') })
            .then((res) => {
                enqueueSnackbar(res.data.message || 'Payroll Posted Successfully', { variant: 'success' });
                fetchData();
            })
            .catch((err) => {
                enqueueSnackbar(err.response?.data?.message || 'Failed to post payroll', { variant: 'error' });
            })
            .finally(() => setLoading(false));
    };

    // Excel handlers placeholder
    const handleImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('month', month.format('YYYY-MM'));

        setLoading(true);
        axios
            .post(route('api.payroll.salary-sheet.import'), formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            })
            .then((res) => {
                enqueueSnackbar(res.data.message || 'Import successful', { variant: 'success' });
                fetchData(); // Refresh grid
            })
            .catch((err) => {
                console.error(err);
                enqueueSnackbar(err.response?.data?.message || 'Import failed', { variant: 'error' });
            })
            .finally(() => {
                setLoading(false);
                e.target.value = ''; // Reset input
            });
    };

    const handleExport = () => {
        window.open(route('payroll.salary-sheet.export', { month: month.format('YYYY-MM') }), '_blank');
    };

    const handleDownloadTemplate = () => {
        window.open(route('payroll.salary-sheet.template'), '_blank');
    };

    return (
        <>
            {/* <Head title="Salary Sheet" /> */}
            <div style={{ backgroundColor: '#f5f5f5', height: '100vh' }}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <Box sx={{ p: 2 }}>
                        <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                            <Typography sx={{ fontWeight: 700, fontSize: '30px', color: '#063455' }}>
                                Salary Sheet Editor
                            </Typography>
                            <IconButton onClick={() => setHelpOpen(true)} color="primary">
                                <Help />
                            </IconButton>
                        </Box>

                        {/* Help Dialog */}
                        <Dialog open={helpOpen} onClose={() => setHelpOpen(false)} maxWidth="md" fullWidth>
                            <DialogTitle>Import/Export Guide</DialogTitle>
                            <DialogContent dividers>
                                <Typography variant="h6" gutterBottom>
                                    How to Import Data
                                </Typography>
                                <Typography variant="body2" paragraph>
                                    You can import allowance and deduction data from an Excel or CSV file. The system uses <b>Employee ID</b> or <b>Payslip ID</b> to match records.
                                </Typography>

                                <Typography variant="subtitle1" fontWeight="bold">
                                    Steps:
                                </Typography>
                                <ol>
                                    <li>
                                        <Typography variant="body2">
                                            <b>Download Template:</b> Click the "Template" button to get a blank file with the correct headers (Employee ID, Name, Allowances, Deductions).
                                        </Typography>
                                    </li>
                                    <li>
                                        <Typography variant="body2">
                                            <b>Fill Data:</b> Enter the amounts for each employee. You strictly need the <code style={{ backgroundColor: '#e0e0e0', padding: '2px 4px' }}>Employee ID</code> column.
                                        </Typography>
                                    </li>
                                    <li>
                                        <Typography variant="body2">
                                            <b>Upload:</b> Click "Import Excel" and select your file.
                                        </Typography>
                                    </li>
                                </ol>

                                <Typography variant="subtitle1" fontWeight="bold" mt={2}>
                                    Important Notes:
                                </Typography>
                                <ul>
                                    <li>
                                        <Typography variant="body2">
                                            Do not rename the column headers (e.g., <code>Medical (A-1)</code>). The system uses the ID in parentheses (e.g., <code>A-1</code>) to identify the allowance type.
                                        </Typography>
                                    </li>
                                    <li>
                                        <Typography variant="body2">
                                            You can also <b>Export</b> the current sheet, make changes offline, and re-import it.
                                        </Typography>
                                    </li>
                                </ul>
                            </DialogContent>
                            <DialogActions>
                                <Button onClick={() => setHelpOpen(false)}>Close</Button>
                            </DialogActions>
                        </Dialog>

                        {/* Filters */}
                        <Card sx={{ mb: 3, pt: 2, boxShadow: 'none', bgcolor: 'transparent' }}>
                            {/* <CardContent> */}
                            <Grid container spacing={2} alignItems="center">
                                <Grid item xs={12} md={3}>
                                    <DatePicker
                                        label="Select Month"
                                        views={['year', 'month']}
                                        value={month}
                                        onChange={(val) => setMonth(val)}
                                        open={datePickerOpen}
                                        onOpen={() => setDatePickerOpen(true)}
                                        onClose={() => setDatePickerOpen(false)}
                                        slotProps={{
                                            textField: {
                                                size: 'small',
                                                fullWidth: true,
                                                onClick: () => setDatePickerOpen(true),
                                                InputProps: { readOnly: true }, // Prevent manual typing to force picker use
                                            },
                                        }}
                                        sx={{
                                            '& .MuiInputBase-root, & .MuiOutlinedInput-root, & fieldset': {
                                                borderRadius: '16px !important',
                                            },
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12} md={2}>
                                    <Autocomplete
                                        size="small"
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: '16px',

                                                '& fieldset': {
                                                    borderRadius: '16px',
                                                },
                                            },
                                        }}
                                        options={[{ id: 'all', name: 'All' }, ...designations]}
                                        getOptionLabel={(option) => option.name || ''}
                                        value={designation === 'all' ? { id: 'all', name: 'All' } : designations.find((d) => d.name === designation) || { id: 'all', name: 'All' }}
                                        onChange={(e, newValue) => {
                                            setDesignation(newValue ? (newValue.id === 'all' ? 'all' : newValue.name) : 'all');
                                        }}
                                        ListboxProps={{
                                            sx: {
                                                maxHeight: '250px',
                                                overflowY: 'auto',

                                                '& .MuiAutocomplete-option': {
                                                    borderRadius: '16px',
                                                    mx: '8px',
                                                    my: '0.3px',
                                                    // transition: 'all 0.2s ease',
                                                },
                                                '& .MuiAutocomplete-option:hover': {
                                                    backgroundColor: '#063455',
                                                    color: '#fff',
                                                },
                                                '& .MuiAutocomplete-option[aria-selected="true"]': {
                                                    backgroundColor: '#063455',
                                                    color: '#fff',
                                                },
                                                '& .MuiAutocomplete-option.Mui-focused': {
                                                    backgroundColor: '#063455',
                                                    color: '#fff',
                                                },
                                            },
                                        }}
                                        renderInput={(params) => <TextField {...params} label="Designation" />}
                                    />
                                </Grid>
                                <Grid item xs={12} md={2}>
                                    <FormControl fullWidth size="small"
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: '16px',

                                                '& fieldset': {
                                                    borderRadius: '16px',
                                                },
                                            },
                                        }}>
                                        <InputLabel>Employee Type</InputLabel>
                                        <Select
                                            value={employeeType}
                                            label="Employee Type"
                                            onChange={(e) => setEmployeeType(e.target.value)}
                                            MenuProps={{
                                                PaperProps: {
                                                    sx: {
                                                        borderRadius: '16px',
                                                        maxHeight: '300px',     // 👈 dropdown height
                                                        overflowY: 'auto',      // 👈 scrollbar
                                                    },
                                                },
                                                MenuListProps: {
                                                    sx: {
                                                        '& .MuiMenuItem-root': {
                                                            borderRadius: '16px',
                                                            mx: '8px',
                                                            transition: 'all 0.2s ease',
                                                        },
                                                        '& .MuiMenuItem-root:hover': {
                                                            backgroundColor: '#063455',
                                                            color: '#fff',
                                                        },
                                                        '& .MuiMenuItem-root.Mui-selected': {
                                                            backgroundColor: '#063455',
                                                            color: '#fff',
                                                        },
                                                        '& .MuiMenuItem-root.Mui-selected:hover': {
                                                            backgroundColor: '#063455',
                                                            color: '#fff',
                                                        },
                                                    },
                                                },
                                            }}>
                                            <MenuItem value="all">All</MenuItem>
                                            {employeeTypes.map((t) => (
                                                <MenuItem key={t} value={t}>
                                                    {t}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} md={2}>
                                    <FormControl fullWidth size="small"
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: '16px',

                                                '& fieldset': {
                                                    borderRadius: '16px',
                                                },
                                            },
                                        }}>
                                        <InputLabel>Location</InputLabel>
                                        <Select
                                            value={location}
                                            label="Location"
                                            onChange={(e) => setLocation(e.target.value)}
                                            MenuProps={{
                                                PaperProps: {
                                                    sx: {
                                                        borderRadius: '16px',
                                                        maxHeight: '300px',     // 👈 dropdown height
                                                        overflowY: 'auto',      // 👈 scrollbar
                                                    },
                                                },
                                                MenuListProps: {
                                                    sx: {
                                                        '& .MuiMenuItem-root': {
                                                            borderRadius: '16px',
                                                            mx: '8px',
                                                            transition: 'all 0.2s ease',
                                                        },
                                                        '& .MuiMenuItem-root:hover': {
                                                            backgroundColor: '#063455',
                                                            color: '#fff',
                                                        },
                                                        '& .MuiMenuItem-root.Mui-selected': {
                                                            backgroundColor: '#063455',
                                                            color: '#fff',
                                                        },
                                                        '& .MuiMenuItem-root.Mui-selected:hover': {
                                                            backgroundColor: '#063455',
                                                            color: '#fff',
                                                        },
                                                    },
                                                },
                                            }}>
                                            <MenuItem value="all">All</MenuItem>
                                            {locations.map((l) => (
                                                <MenuItem key={l} value={l}>
                                                    {l}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} md={3}>
                                    {/* Add other filters as needed */}
                                    <Button variant="contained" onClick={fetchData} startIcon={<Refresh />} sx={{ textTransform: 'none', borderRadius: '16px', }}>
                                        Fetch Data
                                    </Button>
                                </Grid>
                            </Grid>
                            {/* </CardContent> */}
                        </Card>

                        {/* Actions */}
                        <Box sx={{ mb: 2, display: 'flex', gap: 2, justifyContent: 'flex-end', alignItems: 'center' }}>
                            <Typography variant="caption" color="textSecondary" sx={{ mr: 2 }}>
                                To import: Download template or export current sheet, modify values, and re-import.
                            </Typography>
                            <Button startIcon={<Download />} variant="outlined" onClick={handleDownloadTemplate}
                                sx={{ color: '#063455', border: '1px solid #063455', textTransform: 'none', borderRadius: '16px', }}>
                                Template
                            </Button>
                            <Button startIcon={<Upload />} variant="outlined" sx={{ color: '#063455', border: '1px solid #063455', whiteSpace: 'nowrap', borderRadius: '16px', textTransform: 'none' }}>
                                Import Excel
                                <input type="file" hidden accept=".csv, .xlsx, .xls" onChange={handleImport} />
                            </Button>
                            <Button startIcon={<Download />} variant="outlined" onClick={handleExport}
                                sx={{ color: '#063455', border: '1px solid #063455', whiteSpace: 'nowrap', borderRadius: '16px', textTransform: 'none' }}>
                                Export Excel
                            </Button>
                            <Button startIcon={<Save />} variant="contained" onClick={handleSave} disabled={loading}
                                sx={{ color: '#fff', whiteSpace: 'nowrap', textTransform: 'none', borderRadius: '16px', }}>
                                {loading ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </Box>

                        {loading && <LinearProgress sx={{ mb: 2 }} />}

                        {/* Grid */}
                        <TableContainer component={Paper} sx={{ overflowX: 'auto', borderRadius: '12px' }}>
                            <Table>
                                <TableHead>
                                    <TableRow sx={{ bgcolor: '#063455' }}>
                                        <TableCell sx={{ fontWeight: 600, color: '#fff' }}>Code</TableCell>
                                        <TableCell sx={{ fontWeight: 600, color: '#fff' }}>Employee</TableCell>
                                        <TableCell sx={{ fontWeight: 600, color: '#fff' }}>CNIC</TableCell>
                                        <TableCell sx={{ fontWeight: 600, color: '#fff' }}>Designation</TableCell>
                                        <TableCell sx={{ fontWeight: 600, color: '#fff' }}>Basic</TableCell>

                                        {/* Dynamic Allowance Headers */}
                                        {allowanceHeaders.map((h) => (
                                            <TableCell key={h.id} align="center" sx={{ bgcolor: '#e3f2fd' }}>
                                                {h.name}
                                            </TableCell>
                                        ))}

                                        <TableCell sx={{ fontWeight: 600, color: '#fff' }}>Gross Salary</TableCell>

                                        {/* Dynamic Deduction Headers */}
                                        {deductionHeaders.map((h) => (
                                            <TableCell key={h.id} align="center" sx={{ bgcolor: '#ffebee' }}>
                                                {h.name}
                                            </TableCell>
                                        ))}

                                        <TableCell sx={{ fontWeight: 600, color: '#fff' }}>Net Salary</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {payslips.map((row) => (
                                        <TableRow key={row.id}>
                                            <TableCell sx={{ position: 'sticky', left: 0, bgcolor: 'white', zIndex: 2 }}>{row.employee_id_number}</TableCell>
                                            <TableCell sx={{ position: 'sticky', left: 50, bgcolor: 'white', zIndex: 2 }}>
                                                <Typography variant="body2" fontWeight="bold">
                                                    {row.employee_name}
                                                </Typography>
                                                <Typography variant="caption" color="textSecondary">
                                                    {row.department}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>{row.employee?.national_id || '-'}</TableCell>
                                            <TableCell>{row.designation}</TableCell>
                                            <TableCell>{parseFloat(row.basic_salary).toLocaleString()}</TableCell>

                                            {/* Allowances Inputs */}
                                            {allowanceHeaders.map((h) => {
                                                const allowance = row.allowances.find((a) => a.allowance_type_id === h.id);
                                                return (
                                                    <TableCell key={h.id} sx={{ bgcolor: '#e3f2fd' }} p={0}>
                                                        <TextField size="small" variant="standard" inputProps={{ style: { textAlign: 'center' } }} value={allowance ? allowance.amount : 0} onChange={(e) => handleValueChange(row.id, 'allowance', h.id, e.target.value)} InputProps={{ disableUnderline: true }} fullWidth />
                                                    </TableCell>
                                                );
                                            })}

                                            <TableCell sx={{ fontWeight: 'bold' }}>{row.gross_salary.toLocaleString()}</TableCell>

                                            {/* Deductions Inputs */}
                                            {deductionHeaders.map((h) => {
                                                const deduction = row.deductions.find((d) => d.deduction_type_id === h.id);
                                                return (
                                                    <TableCell key={h.id} sx={{ bgcolor: '#ffebee' }} p={0}>
                                                        <TextField size="small" variant="standard" inputProps={{ style: { textAlign: 'center' } }} value={deduction ? deduction.amount : 0} onChange={(e) => handleValueChange(row.id, 'deduction', h.id, e.target.value)} InputProps={{ disableUnderline: true }} fullWidth />
                                                    </TableCell>
                                                );
                                            })}

                                            <TableCell sx={{ fontWeight: 'bold' }}>{row.net_salary.toLocaleString()}</TableCell>
                                        </TableRow>
                                    ))}
                                    {payslips.length === 0 && !loading && (
                                        <TableRow>
                                            <TableCell colSpan={10} align="center">
                                                No data found or generate payslips first.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                </LocalizationProvider>
            </div>
        </>
    );
}
