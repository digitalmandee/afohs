import { useState, useEffect } from 'react';
import { usePage, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/AdminLayout';
import { Box, Card, CardContent, Typography, Button, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress, Pagination, Snackbar, Alert, Collapse, IconButton } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Visibility as VisibilityIcon, MoreVert as MoreVertIcon, ArrowBack as ArrowBackIcon, PlayArrow as PlayArrowIcon, Assessment as AssessmentIcon, Payment as PaymentIcon } from '@mui/icons-material';
import axios from 'axios';

const PayrollPreview = ({ period: initialPeriod, token: initialToken }) => {
    const { props } = usePage();
    const [period, setPeriod] = useState(initialPeriod || null);
    const [token, setToken] = useState(initialToken || null);
    const [previewRows, setPreviewRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(15);
    const [total, setTotal] = useState(0);
    const [lastPage, setLastPage] = useState(1);
    const [processing, setProcessing] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [expanded, setExpanded] = useState({});

    const formatAmount = (value) => Number(value || 0).toLocaleString();

    const getAllowances = (row) => {
        if (Array.isArray(row.allowances_breakdown)) return row.allowances_breakdown;
        const basicSalary = Number(row.basic_salary || 0);

        return (row.allowances || []).map((a) => {
            const type = a.allowance_type?.type || a.allowanceType?.type;
            if (type === 'percentage') {
                const percentage = Number(a.percentage ?? a.amount ?? 0);
                return { name: a.allowance_type?.name || a.allowanceType?.name || 'Allowance', amount: (basicSalary * percentage) / 100 };
            }

            return { name: a.allowance_type?.name || a.allowanceType?.name || 'Allowance', amount: Number(a.amount || 0) };
        });
    };

    const getDeductions = (row) => {
        if (Array.isArray(row.deductions_breakdown)) return row.deductions_breakdown;
        const basicSalary = Number(row.basic_salary || 0);
        const grossSalary = Number(row.gross_salary || basicSalary);

        return (row.deductions || []).map((d) => {
            const type = d.deduction_type?.type || d.deductionType?.type;
            const base = (d.deduction_type?.calculation_base || d.deductionType?.calculation_base) === 'gross_salary' ? grossSalary : basicSalary;

            if (type === 'percentage') {
                const percentage = Number(d.percentage ?? d.amount ?? 0);
                return { name: d.deduction_type?.name || d.deductionType?.name || 'Deduction', amount: (base * percentage) / 100 };
            }

            return { name: d.deduction_type?.name || d.deductionType?.name || 'Deduction', amount: Number(d.amount || 0) };
        });
    };

    useEffect(() => {
        fetchPreview(page);
    }, [page, perPage, period, token]);

    const fetchPreview = async (pageNumber = 1) => {
        if (!period) return;
        setLoading(true);
        try {
            const params = {
                page: pageNumber,
                per_page: perPage,
            };

            // attach token if provided (server will resolve employee ids from cache)
            if (token) {
                params.token = token;
            }

            const response = await axios.get(`/api/payroll/periods/${period.id}/preview`, { params });
            if (response.data.success) {
                const preview = response.data.preview;
                // paginator structure: data, current_page, last_page, per_page, total
                setPreviewRows(preview.data || []);
                setPage(preview.current_page || 1);
                setPerPage(preview.per_page || 15);
                setTotal(preview.total || 0);
                setLastPage(preview.last_page || 1);
            }
        } catch (error) {
            console.error('Error fetching preview:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePageChange = (event, value) => {
        setPage(value);
    };

    const handleProcessPayroll = async () => {
        if (!period) return;
        setProcessing(true);
        try {
            const payload = {};
            if (token) payload.token = token;

            const response = await axios.post(`/api/payroll/periods/${period.id}/process`, payload);

            if (response.data.success) {
                setSnackbar({ open: true, message: 'Payroll processed successfully', severity: 'success' });
                // redirect to payslips
                setTimeout(() => {
                    router.visit(route('employees.payroll.payslips'));
                }, 1200);
            } else {
                setSnackbar({ open: true, message: response.data.message || 'Error processing payroll', severity: 'error' });
            }
        } catch (err) {
            console.error(err);
            setSnackbar({ open: true, message: 'Error processing payroll', severity: 'error' });
        } finally {
            setProcessing(false);
        }
    };

    const handleCloseSnackbar = () => setSnackbar((s) => ({ ...s, open: false }));

    return (
        <AdminLayout>
            <Box sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <IconButton onClick={() => window.history.back()}>
                            <ArrowBackIcon sx={{ color: '#063455' }} />
                        </IconButton>
                        <Typography variant="h5" sx={{ color: '#063455', fontWeight: 600 }}>
                            Payroll Preview
                        </Typography>
                    </Box>
                </Box>

                <Grid container spacing={3}>
                    <Grid item xs={12}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" sx={{ color: '#063455', fontWeight: 600, mb: 2 }}>
                                    Period: {period?.period_name || 'N/A'}
                                </Typography>

                                {loading ? (
                                    <Box sx={{ textAlign: 'center', py: 6 }}>
                                        <CircularProgress />
                                    </Box>
                                ) : (
                                    <>
                                        <TableContainer component={Paper} sx={{ maxHeight: 500 }}>
                                            <Table stickyHeader size="small">
                                                <TableHead>
                                                    <TableRow sx={{ bgcolor: '#E5E5EA' }}>
                                                        <TableCell sx={{ fontWeight: 600, color: '#000' }}>Employee</TableCell>
                                                        <TableCell sx={{ fontWeight: 600, color: '#000' }}>Department</TableCell>
                                                        <TableCell sx={{ fontWeight: 600, color: '#000' }}>Basic Salary</TableCell>
                                                        <TableCell sx={{ fontWeight: 600, color: '#000' }}>Allowances</TableCell>
                                                        <TableCell sx={{ fontWeight: 600, color: '#000' }}>Deductions</TableCell>
                                                        <TableCell sx={{ fontWeight: 600, color: '#000' }}>Order Deductions</TableCell>
                                                        <TableCell sx={{ fontWeight: 600, color: '#000' }}>Gross Salary</TableCell>
                                                        <TableCell sx={{ fontWeight: 600, color: '#000' }}>Net Salary</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {previewRows.map((r) => (
                                                        <>
                                                            <TableRow key={`row-${r.employee_id}`}>
                                                                <TableCell>
                                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                        <IconButton size="small" onClick={() => setExpanded((p) => ({ ...p, [r.employee_id]: !p[r.employee_id] }))}>
                                                                            {expanded[r.employee_id] ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                                                                        </IconButton>
                                                                        <Box>
                                                                            <Typography variant="subtitle2">{r.employee_name}</Typography>
                                                                            <Typography variant="caption" color="textSecondary">
                                                                                {r.employee_number}
                                                                            </Typography>
                                                                        </Box>
                                                                    </Box>
                                                                </TableCell>
                                                                <TableCell>{r.department}</TableCell>
                                                                <TableCell>{formatAmount(r.basic_salary)}</TableCell>
                                                                <TableCell>{formatAmount(r.total_allowances)}</TableCell>
                                                                <TableCell>{formatAmount(r.total_deductions)}</TableCell>
                                                                <TableCell>{formatAmount(r.total_order_deductions)}</TableCell>
                                                                <TableCell>{formatAmount(r.gross_salary)}</TableCell>
                                                                <TableCell sx={{ fontWeight: 600 }}>{formatAmount(r.net_salary)}</TableCell>
                                                            </TableRow>

                                                            <TableRow>
                                                                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={8}>
                                                                    <Collapse in={!!expanded[r.employee_id]} timeout="auto" unmountOnExit>
                                                                        <Box sx={{ margin: 1 }}>
                                                                            <Typography variant="subtitle2">Allowances</Typography>
                                                                            {getAllowances(r).length > 0 ? (
                                                                                getAllowances(r).map((a, idx) => (
                                                                                    <Box key={`allowance-${r.employee_id}-${a.type_id ?? idx}`} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                                                                                        <Typography variant="body2">{a.name}</Typography>
                                                                                        <Typography variant="body2">{formatAmount(a.amount)}</Typography>
                                                                                    </Box>
                                                                                ))
                                                                            ) : (
                                                                                <Typography variant="body2" color="textSecondary">
                                                                                    No allowances.
                                                                                </Typography>
                                                                            )}

                                                                            <Box sx={{ mt: 2 }} />
                                                                            <Typography variant="subtitle2">Deductions</Typography>
                                                                            {getDeductions(r).length > 0 ? (
                                                                                getDeductions(r).map((d, idx) => (
                                                                                    <Box key={`deduction-${r.employee_id}-${d.type_id ?? idx}`} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                                                                                        <Typography variant="body2">{d.name}</Typography>
                                                                                        <Typography variant="body2">{formatAmount(d.amount)}</Typography>
                                                                                    </Box>
                                                                                ))
                                                                            ) : (
                                                                                <Typography variant="body2" color="textSecondary">
                                                                                    No deductions.
                                                                                </Typography>
                                                                            )}

                                                                            <Box sx={{ mt: 2 }} />
                                                                            <Typography variant="subtitle2">Order Deductions</Typography>
                                                                            {r.order_deductions && r.order_deductions.length > 0 ? (
                                                                                r.order_deductions.map((o) => {
                                                                                    const alreadyDeducted = !!o.deducted_at;
                                                                                    return (
                                                                                        <Box
                                                                                            key={`order-${o.id ?? o.name ?? Math.random()}`}
                                                                                            sx={{
                                                                                                display: 'flex',
                                                                                                justifyContent: 'space-between',
                                                                                                py: 0.5,
                                                                                                opacity: alreadyDeducted ? 0.6 : 1,
                                                                                                fontStyle: alreadyDeducted ? 'italic' : 'normal',
                                                                                            }}
                                                                                        >
                                                                                            <Typography variant="body2">{o.paid_at ? new Date(o.paid_at).toLocaleString() : '—'}</Typography>
                                                                                            <Typography variant="body2">{formatAmount(o.amount)}</Typography>
                                                                                            <Box sx={{ textAlign: 'right' }}>
                                                                                                <Typography variant="caption" color="textSecondary">
                                                                                                    {o.note || ''}
                                                                                                </Typography>
                                                                                                {o.deducted_at && (
                                                                                                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                                                                                                        Deducted: {new Date(o.deducted_at).toLocaleString()}
                                                                                                    </Typography>
                                                                                                )}
                                                                                            </Box>
                                                                                        </Box>
                                                                                    );
                                                                                })
                                                                            ) : (
                                                                                <Typography variant="body2" color="textSecondary">
                                                                                    No CTS order deductions for this period.
                                                                                </Typography>
                                                                            )}
                                                                        </Box>
                                                                    </Collapse>
                                                                </TableCell>
                                                            </TableRow>
                                                        </>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>

                                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                                            <Pagination count={lastPage} page={page} onChange={handlePageChange} color="primary" />
                                        </Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2 }}>
                                            <Button variant="contained" color="primary" onClick={handleProcessPayroll} disabled={processing}>
                                                {processing ? 'Processing...' : 'Process Payroll'}
                                            </Button>
                                        </Box>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Box>
            <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </AdminLayout>
    );
};

export default PayrollPreview;
