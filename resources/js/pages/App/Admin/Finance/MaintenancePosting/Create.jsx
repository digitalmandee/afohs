import React, { useState, useEffect } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import { Box, Card, CardContent, Typography, Grid, TextField, Button, FormControl, Select, MenuItem, InputLabel, Checkbox, FormGroup, FormControlLabel, Dialog, DialogTitle, DialogContent, DialogActions, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, InputAdornment, IconButton, Divider, Radio, RadioGroup, FormLabel, DialogContentText } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { useSnackbar } from 'notistack';
import { ArrowBack, ArrowForward, Percent } from '@mui/icons-material';
import axios from 'axios';

const STATUS_OPTIONS = ['Active', 'Expired', 'Suspended', 'Terminated', 'Absent', 'Cancelled', 'Not assign', 'Manual Inactive', 'Not Qualified', 'Transferred'];

export default function Create({ maintenanceType }) {
    const { enqueueSnackbar } = useSnackbar();

    // Form State
    const { data, setData, post, processing, errors, reset } = useForm({
        member_type: 'member', // Default
        start_id: 1,
        end_id: 100,
        statuses: [],
        invoice_date: dayjs().format('YYYY-MM-DD'),
        booking_type: 'Monthly Maintenance', // Just for display/logic
        amount: '', // Override amount
        start_date: null,
        end_date: null,

        // Charges
        discount_amount: '',
        discount_is_percent: false,
        tax_amount: '',
        tax_is_percent: true, // as per screenshot % seems default
        overdue_amount: '',
        overdue_is_percent: true,

        amount_in_words: '', // Just for fields
        comments: '',
    });

    // Calculations State
    const [days, setDays] = useState(0);
    const [calculatedTotal, setCalculatedTotal] = useState(0); // For the single row display
    const [previewData, setPreviewData] = useState(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    // State for Example Calculation
    const [subTotal, setSubTotal] = useState(0);
    const [finalTotal, setFinalTotal] = useState(0);

    // Number to Words Converter (Simple version)
    const numberToWords = (amount) => {
        if (!amount || amount === 0) return '';
        const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
        const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

        const convert = (n) => {
            if (n < 20) return ones[n];
            if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
            if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convert(n % 100) : '');
            if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '');
            if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + convert(n % 100000) : '');
            return n; // Fallback for very large numbers
        };

        return convert(Math.floor(amount)) + ' Only';
    };

    // Effect: Calculate Row Total (Subtotal) + Final Total (Charges)
    useEffect(() => {
        const amt = parseFloat(data.amount) || 0;
        let tempSubTotal = 0;

        // 1. Calculate SubTotal
        if (days > 0 && amt > 0) {
            const perDay = amt / 30;
            tempSubTotal = perDay * days;
        }
        setSubTotal(tempSubTotal);

        // 2. Calculate Final Total (Applying Charges)
        let total = tempSubTotal;
        let tax = 0;
        let discount = 0;
        let overdue = 0;

        // Tax
        const taxVal = parseFloat(data.tax_amount) || 0;
        if (taxVal > 0) {
            tax = data.tax_is_percent ? (tempSubTotal * taxVal) / 100 : taxVal;
        }

        // Discount
        const discVal = parseFloat(data.discount_amount) || 0;
        if (discVal > 0) {
            discount = data.discount_is_percent ? (tempSubTotal * discVal) / 100 : discVal;
        }

        // Overdue
        const odVal = parseFloat(data.overdue_amount) || 0;
        if (odVal > 0) {
            overdue = data.overdue_is_percent ? (tempSubTotal * odVal) / 100 : odVal;
        }

        total = total + tax + overdue - discount;

        // Prevent negative total if discount is huge
        if (total < 0) total = 0;

        setFinalTotal(total);
        setData('amount_in_words', numberToWords(total));
    }, [data.amount, days, data.tax_amount, data.tax_is_percent, data.discount_amount, data.discount_is_percent, data.overdue_amount, data.overdue_is_percent]);
    // Effect: Calculate Days
    useEffect(() => {
        if (data.start_date && data.end_date) {
            const start = dayjs(data.start_date);
            const end = dayjs(data.end_date);
            if (end.isValid() && start.isValid()) {
                const diff = end.diff(start, 'day') + 1;
                setDays(diff > 0 ? diff : 0);
            } else {
                setDays(0);
            }
        }
    }, [data.start_date, data.end_date]);

    const handleStatusChange = (status) => {
        const current = [...data.statuses];
        if (current.includes(status)) {
            setData(
                'statuses',
                current.filter((s) => s !== status),
            );
        } else {
            setData('statuses', [...current, status]);
        }
    };

    const handlePreview = () => {
        // Validate basics
        if (!data.start_date || !data.end_date) {
            enqueueSnackbar('Please select Start and End dates', { variant: 'error' });
            return;
        }

        setPreviewLoading(true);
        axios
            .post(route('finance.maintenance.preview'), {
                ...data,
                start_date: dayjs(data.start_date).format('YYYY-MM-DD'),
                end_date: dayjs(data.end_date).format('YYYY-MM-DD'),
                invoice_date: dayjs(data.invoice_date).format('YYYY-MM-DD'),
            })
            .then((res) => {
                setPreviewData(res.data);
                setShowPreview(true);
            })
            .catch((err) => {
                enqueueSnackbar(err.response?.data?.message || 'Error generating preview', { variant: 'error' });
            })
            .finally(() => setPreviewLoading(false));
    };

    const [skippedMembers, setSkippedMembers] = useState([]);
    const [showSkippedModal, setShowSkippedModal] = useState(false);
    const [storing, setStoring] = useState(false);

    const handleSubmit = (action) => {
        setStoring(true);
        const payload = {
            ...data,
            start_date: dayjs(data.start_date).format('YYYY-MM-DD'),
            end_date: dayjs(data.end_date).format('YYYY-MM-DD'),
            invoice_date: dayjs(data.invoice_date).format('YYYY-MM-DD'),
            action: action,
        };

        axios
            .post(route('finance.maintenance.store'), payload)
            .then((res) => {
                enqueueSnackbar(res.data.message, { variant: 'success' });
                reset();
                setShowPreview(false);

                if (res.data.skipped_members && res.data.skipped_members.length > 0) {
                    setSkippedMembers(res.data.skipped_members);
                    setShowSkippedModal(true);
                }
            })
            .catch((err) => {
                enqueueSnackbar(err.response?.data?.message || 'Failed to generate.', { variant: 'error' });
            })
            .finally(() => setStoring(false));
    };

    return (
        <div style={{
            backgroundColor: '#f5f5f5'
        }}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
                <Box p={3}>
                    <Typography sx={{ color: '#063455', fontWeight: '700', fontSize: '30px' }}>
                        Monthly Maintenance Fee Posting
                    </Typography>

                    <Card>
                        <CardContent>
                            <Box mb={2}>
                                <Typography sx={{ color: '#063455', fontWeight: '600', fontSize: '16px' }}>
                                    CHARGES FOR ALL MEMBERS
                                </Typography>
                            </Box>

                            <Grid container spacing={3}>
                                {/* Member Type Selection */}
                                <Grid item xs={12}>
                                    <FormControl component="fieldset">
                                        <FormLabel component="legend">Member Type</FormLabel>
                                        <RadioGroup row value={data.member_type} onChange={(e) => setData('member_type', e.target.value)}>
                                            <FormControlLabel value="member" control={<Radio />} label="Member" />
                                            <FormControlLabel value="corporate" control={<Radio />} label="Corporate Member" />
                                        </RadioGroup>
                                    </FormControl>
                                </Grid>

                                {/* Range Selection */}
                                <Grid item xs={12} md={6}>
                                    <Grid container spacing={2} alignItems="center">
                                        <Grid item>
                                            <Typography>Select Range:</Typography>
                                            {/* Info icon tooltip could go here */}
                                        </Grid>
                                        <Grid item xs>
                                            <TextField fullWidth label="Start ID" type="number" value={data.start_id} onChange={(e) => setData('start_id', e.target.value)} />
                                        </Grid>
                                        <Grid item xs>
                                            <TextField fullWidth label="End ID" type="number" value={data.end_id} onChange={(e) => setData('end_id', e.target.value)} />
                                        </Grid>
                                    </Grid>

                                    <Box mt={3}>
                                        <DatePicker label="Invoice Date" value={dayjs(data.invoice_date)} onChange={(val) => setData('invoice_date', val)} slotProps={{ textField: { fullWidth: true, required: true } }} />
                                    </Box>
                                </Grid>

                                {/* Status Selection */}
                                <Grid item xs={12} md={6}>
                                    <Typography gutterBottom>Select to Include Members by their Status</Typography>
                                    <FormGroup row>
                                        <Grid container>
                                            {STATUS_OPTIONS.map((status) => (
                                                <Grid item xs={6} key={status}>
                                                    <FormControlLabel control={<Checkbox checked={data.statuses.includes(status)} onChange={() => handleStatusChange(status)} size="small" />} label={status} />
                                                </Grid>
                                            ))}
                                        </Grid>
                                    </FormGroup>
                                </Grid>
                            </Grid>

                            <Divider sx={{ my: 3 }} />

                            {/* Charges Row */}
                            <Grid container spacing={2} alignItems="flex-end">
                                <Grid item xs={12} md={3}>
                                    <FormControl fullWidth size="small">
                                        <InputLabel>Type</InputLabel>
                                        <Select label="Type" value={data.booking_type}>
                                            <MenuItem value="Monthly Maintenance">Monthly Maintenance</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={6} md={1}>
                                    <TextField
                                        label="Amount"
                                        size="small"
                                        fullWidth
                                        value={data.amount}
                                        onChange={(e) => setData('amount', e.target.value)}
                                    // helperText="Empty = Default"
                                    />
                                </Grid>
                                <Grid item xs={6} md={1}>
                                    <TextField label="Per Day" size="small" fullWidth disabled value={data.amount ? (parseFloat(data.amount) / 30).toFixed(3) : ''} />
                                </Grid>
                                <Grid item xs={12} md={2}>
                                    <DatePicker label="Start Date" value={data.start_date} onChange={(val) => setData('start_date', val)} slotProps={{ textField: { size: 'small', fullWidth: true } }} />
                                </Grid>
                                <Grid item xs={12} md={2}>
                                    <DatePicker label="End Date" value={data.end_date} onChange={(val) => setData('end_date', val)} slotProps={{ textField: { size: 'small', fullWidth: true } }} />
                                </Grid>
                                <Grid item xs={6} md={1}>
                                    <TextField label="Days" size="small" fullWidth disabled value={days} />
                                </Grid>
                                <Grid item xs={6} md={1}>
                                    <TextField label="QTY" size="small" fullWidth disabled value="0" />
                                    {/* Qty is 0 in screenshot? Usually 1? Logic seems to be just calculation. */}
                                </Grid>
                                <Grid item xs={12} md={1}>
                                    <TextField label="Total" size="small" fullWidth disabled value={subTotal.toFixed(0)} />
                                </Grid>
                            </Grid>

                            <Box bgcolor="grey.300" p={1} my={2}>
                                <Grid container justifyContent="space-between">
                                    <Typography sx={{color:'#063455', fontWeight:'600', fontSize:'18px'}}>Total Charges (Base):</Typography>
                                    <Typography fontWeight="bold">{subTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}</Typography>
                                </Grid>
                            </Box>

                            {/* Footer Charges */}
                            {['Discount', 'Overdue', 'Tax'].map((type) => {
                                const field = type.toLowerCase();
                                return (
                                    <Grid container spacing={2} alignItems="center" key={type} mb={1}>
                                        <Grid item xs={3}>
                                            <Typography>{type} Amount/Charges:</Typography>
                                        </Grid>
                                        <Grid item xs={3}>
                                            <TextField fullWidth size="small" placeholder="Enter Amount" value={data[`${field}_amount`]} onChange={(e) => setData(`${field}_amount`, e.target.value)} />
                                        </Grid>
                                        <Grid item xs={1}>
                                            <FormControlLabel control={<Checkbox checked={data[`${field}_is_percent`]} onChange={(e) => setData(`${field}_is_percent`, e.target.checked)} />} label="%" />
                                        </Grid>
                                        <Grid item xs={5}>
                                            <Typography variant="body2" color="textSecondary" sx={{ display: 'flex', alignItems: 'center' }}>
                                                Details:
                                                {/* Info icon */}
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                );
                            })}

                            <Box bgcolor="grey.400" p={1} my={2}>
                                <Grid container justifyContent="space-between">
                                    <Typography sx={{color:'#063455', fontWeight:'600', fontSize:'18px'}}>Grand Total (Per Invoice):*</Typography>
                                    <Typography fontWeight="bold">{finalTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}</Typography>
                                </Grid>
                            </Box>

                            <Grid container spacing={2} mb={2}>
                                <Grid item xs={3}>
                                    <Typography>Amount Paid in Words:*</Typography>
                                </Grid>
                                <Grid item xs={9}>
                                    <TextField fullWidth size="small" multiline disabled value={data.amount_in_words} sx={{ bgcolor: 'grey.300' }} />
                                </Grid>
                            </Grid>

                            <Grid container spacing={2}>
                                <Grid item xs={3}>
                                    <Typography>Comments:</Typography>
                                </Grid>
                                <Grid item xs={9}>
                                    <TextField fullWidth multiline rows={2} placeholder="Give any details" value={data.comments} onChange={(e) => setData('comments', e.target.value)} />
                                </Grid>
                            </Grid>

                            <Box mt={4} display="flex" gap={2}>
                                <Button
                                    variant="contained"
                                    onClick={() => handleSubmit('save')}
                                    disabled={storing}
                                    sx={{
                                        color: '#fff',
                                        backgroundColor: '#063455',
                                        textTransform: 'none',
                                        '&:hover': {
                                            backgroundColor: '#052c3d',
                                        },
                                    }}
                                >
                                    {storing ? 'Saving...' : 'Save'}
                                </Button>
                                <Button variant="contained" onClick={() => handleSubmit('save_print')} disabled={storing}
                                    sx={{
                                        color: '#fff',
                                        backgroundColor: '#063455',
                                        textTransform: 'none',
                                        '&:hover': {
                                            backgroundColor: '#052c3d',
                                        },
                                    }}
                                >
                                    Save & Print
                                </Button>
                                <Button variant="contained" onClick={handlePreview} disabled={storing || previewLoading}
                                    sx={{
                                        color: '#fff',
                                        backgroundColor: '#063455',
                                        textTransform: 'none',
                                        '&:hover': {
                                            backgroundColor: '#052c3d',
                                        },
                                    }}>
                                    {previewLoading ? 'Loading...' : 'Preview'}
                                </Button>
                                <Button variant="contained" onClick={() => window.history.back()}
                                    sx={{
                                        color: '#063455',
                                        backgroundColor: 'transparent',
                                        textTransform: 'none',
                                        border:'1px solid #063455',
                                    }}>
                                    Cancel
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>

                    {/* Preview Modal */}
                    <Dialog open={showPreview} onClose={() => setShowPreview(false)} maxWidth="md" fullWidth>
                        <DialogTitle>Preview Maintenance Posting</DialogTitle>
                        <DialogContent>
                            {previewData && (
                                <Box>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Found {previewData.member_count} members. Grand Total: {previewData.grand_total.toLocaleString()}
                                        {previewData.skipped_count > 0 && (
                                            <Typography component="span" color="error" ml={2}>
                                                ({previewData.skipped_count} skipped)
                                            </Typography>
                                        )}
                                    </Typography>
                                    <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                                        <Table stickyHeader size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>ID</TableCell>
                                                    <TableCell>Member No</TableCell>
                                                    <TableCell>Name</TableCell>
                                                    <TableCell>Status</TableCell>
                                                    <TableCell>Monthly</TableCell>
                                                    <TableCell>Days</TableCell>
                                                    <TableCell>SubTotal</TableCell>
                                                    <TableCell>Tax</TableCell>
                                                    <TableCell>Disc</TableCell>
                                                    <TableCell>Overdue</TableCell>
                                                    <TableCell align="right">Net Total</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {previewData.members.map((row) => (
                                                    <TableRow key={row.member_id} sx={{ backgroundColor: row.is_skipped ? '#ffebee' : 'inherit' }}>
                                                        <TableCell>{row.member_id}</TableCell>
                                                        <TableCell>{row.membership_no}</TableCell>
                                                        <TableCell>{row.full_name}</TableCell>
                                                        <TableCell>{row.status}</TableCell>

                                                        {row.is_skipped ? (
                                                            <TableCell colSpan={7} sx={{ color: 'error.main' }}>
                                                                Skipped: {row.skip_reason}
                                                            </TableCell>
                                                        ) : (
                                                            <>
                                                                <TableCell>{row.monthly_rate}</TableCell>
                                                                <TableCell>{row.days}</TableCell>
                                                                <TableCell>{row.sub_total}</TableCell>
                                                                <TableCell>{row.charges_breakdown?.tax || 0}</TableCell>
                                                                <TableCell>{row.charges_breakdown?.discount || 0}</TableCell>
                                                                <TableCell>{row.charges_breakdown?.overdue || 0}</TableCell>
                                                                <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                                                    {row.total}
                                                                </TableCell>
                                                            </>
                                                        )}
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </Box>
                            )}
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setShowPreview(false)}>Close</Button>
                            <Button onClick={() => handleSubmit('save')} variant="contained" color="primary">
                                Confirm & Post
                            </Button>
                        </DialogActions>
                    </Dialog>

                    {/* Skipped Members Modal */}
                    <Dialog open={showSkippedModal} onClose={() => setShowSkippedModal(false)} maxWidth="sm" fullWidth>
                        <DialogTitle sx={{ color: 'warning.main', display: 'flex', alignItems: 'center', gap: 1 }}>Skipped Members</DialogTitle>
                        <DialogContent>
                            <DialogContentText mb={2}>The following members were NOT charged because they already have invoices for this period:</DialogContentText>
                            <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Member No</TableCell>
                                            <TableCell>Name</TableCell>
                                            <TableCell>Reason</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {skippedMembers.map((m, i) => (
                                            <TableRow key={i}>
                                                <TableCell>{m.membership_no}</TableCell>
                                                <TableCell>{m.full_name}</TableCell>
                                                <TableCell>{m.reason}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setShowSkippedModal(false)} variant="contained">
                                OK
                            </Button>
                        </DialogActions>
                    </Dialog>
                </Box>
            </LocalizationProvider>
        </div>
    );
}
