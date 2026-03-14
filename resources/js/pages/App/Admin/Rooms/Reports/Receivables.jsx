import { useState } from 'react';
import { router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import AdminLayout from '@/layouts/AdminLayout';
import { Box, Card, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, TextField, Grid } from '@mui/material';
import { ArrowBack as ArrowBackIcon, Search as SearchIcon } from '@mui/icons-material';
import Pagination from '@/components/Pagination';
import dayjs from 'dayjs';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

const ReceivablesReport = ({ receipts = {}, filters = {} }) => {
    const receiptList = receipts.data || [];

    const [search, setSearch] = useState(filters.search || '');
    const [dateFrom, setDateFrom] = useState(filters.receipt_date_from ? dayjs(filters.receipt_date_from) : null);
    const [dateTo, setDateTo] = useState(filters.receipt_date_to ? dayjs(filters.receipt_date_to) : null);

    const handleApply = () => {
        router.get(
            route('rooms.reports.receivables'),
            {
                search: search || undefined,
                receipt_date_from: dateFrom ? dateFrom.format('YYYY-MM-DD') : undefined,
                receipt_date_to: dateTo ? dateTo.format('YYYY-MM-DD') : undefined,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const handleReset = () => {
        setSearch('');
        setDateFrom(null);
        setDateTo(null);
        router.get(route('rooms.reports.receivables'), {}, { preserveState: true, preserveScroll: true });
    };

    const getPayerName = (receipt) => {
        const payer = receipt?.payer;
        if (!payer) return '-';
        return payer.name || payer.full_name || payer.customer_name || '-';
    };

    const getRoomBookingLinks = (receipt) => {
        const links = receipt?.links || [];
        return links.filter((l) => l?.invoice?.invoice_type === 'room_booking');
    };

    const getAllocatedAmount = (receipt) => {
        return getRoomBookingLinks(receipt).reduce((sum, l) => sum + parseFloat(l.amount || 0), 0);
    };

    const getBookingNos = (receipt) => {
        const bookingNos = getRoomBookingLinks(receipt)
            .map((l) => l?.invoice?.invoiceable?.booking_no)
            .filter(Boolean);
        return Array.from(new Set(bookingNos));
    };

    const getRoomNames = (receipt) => {
        const roomNames = getRoomBookingLinks(receipt)
            .map((l) => l?.invoice?.invoiceable?.room?.name)
            .filter(Boolean);
        return Array.from(new Set(roomNames));
    };

    return (
        <AdminLayout>
            <Box sx={{ bgcolor: '#f5f5f5', minHeight: '100vh', p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <IconButton onClick={() => router.visit(route('rooms.reports'))}>
                            <ArrowBackIcon sx={{ color: '#063455' }} />
                        </IconButton>
                        <Typography sx={{ color: '#063455', fontWeight: 700, fontSize: '30px' }}>Receivables Report</Typography>
                    </Box>
                </Box>

                <Card sx={{ borderRadius: '12px', p: 2, mb: 2 }}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} md={4}>
                                <TextField
                                    size="small"
                                    fullWidth
                                    placeholder="Search receipt #, remarks, booking #"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <DatePicker label="Receipt Date From" format="DD-MM-YYYY" value={dateFrom} onChange={(v) => setDateFrom(v)} slotProps={{ textField: { size: 'small', fullWidth: true } }} />
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <DatePicker label="Receipt Date To" format="DD-MM-YYYY" value={dateTo} onChange={(v) => setDateTo(v)} slotProps={{ textField: { size: 'small', fullWidth: true } }} />
                            </Grid>
                            <Grid item xs={12} md={2} sx={{ display: 'flex', gap: 1 }}>
                                <Button variant="contained" startIcon={<SearchIcon />} onClick={handleApply} sx={{ bgcolor: '#063455', textTransform: 'none', flex: 1 }}>
                                    Apply
                                </Button>
                                <Button variant="outlined" onClick={handleReset} sx={{ textTransform: 'none' }}>
                                    Reset
                                </Button>
                            </Grid>
                        </Grid>
                    </LocalizationProvider>
                </Card>

                <Card sx={{ borderRadius: '12px' }}>
                    <TableContainer component={Paper} elevation={0}>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ backgroundColor: '#063455' }}>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600, whiteSpace: 'nowrap' }}>Receipt Date</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600, whiteSpace: 'nowrap' }}>Receipt No</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600, whiteSpace: 'nowrap' }}>Payer</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600, whiteSpace: 'nowrap' }}>Method</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600, whiteSpace: 'nowrap' }}>Account</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600, whiteSpace: 'nowrap' }}>Receipt Amount</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600, whiteSpace: 'nowrap' }}>Room Allocated</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600, whiteSpace: 'nowrap' }}>Booking #</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600, whiteSpace: 'nowrap' }}>Room</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600, whiteSpace: 'nowrap' }}>Remarks</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {receiptList.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                                            <Typography color="textSecondary">No receipts found</Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    receiptList.map((r) => {
                                        const allocated = getAllocatedAmount(r);
                                        const bookingNos = getBookingNos(r).join(', ');
                                        const rooms = getRoomNames(r).join(', ');
                                        return (
                                            <TableRow key={r.id} sx={{ '&:hover': { backgroundColor: '#f5f5f5' } }}>
                                                <TableCell sx={{ whiteSpace: 'nowrap' }}>{r.receipt_date ? dayjs(r.receipt_date).format('DD-MM-YYYY') : '-'}</TableCell>
                                                <TableCell sx={{ whiteSpace: 'nowrap' }}>{r.receipt_no || r.id}</TableCell>
                                                <TableCell sx={{ whiteSpace: 'nowrap' }}>{getPayerName(r)}</TableCell>
                                                <TableCell sx={{ whiteSpace: 'nowrap' }}>{r.payment_method || '-'}</TableCell>
                                                <TableCell sx={{ whiteSpace: 'nowrap' }}>{r.payment_account?.name || r.paymentAccount?.name || '-'}</TableCell>
                                                <TableCell sx={{ whiteSpace: 'nowrap' }}>{Number(r.amount || 0).toFixed(2)}</TableCell>
                                                <TableCell sx={{ whiteSpace: 'nowrap' }}>{Number(allocated || 0).toFixed(2)}</TableCell>
                                                <TableCell sx={{ whiteSpace: 'nowrap' }}>{bookingNos || '-'}</TableCell>
                                                <TableCell sx={{ whiteSpace: 'nowrap' }}>{rooms || '-'}</TableCell>
                                                <TableCell>{r.remarks || '-'}</TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Card>

                <Pagination data={receipts} />
            </Box>
        </AdminLayout>
    );
};

export default ReceivablesReport;

