import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { Box, Button, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import { Search } from '@mui/icons-material';
import dayjs from 'dayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

export default function ClosingSalesReport({ startDate, endDate, filters, rows, grandTotal, grandPaid, grandBalance }) {
    const [reportFilters, setReportFilters] = useState({
        start_date: filters?.start_date || startDate,
        end_date: filters?.end_date || endDate,
    });

    const handleFilterChange = (field, value) => {
        setReportFilters((prev) => ({ ...prev, [field]: value }));
    };

    const applyFilters = () => {
        router.get(route('admin.reports.pos.closing-sales'), reportFilters);
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR' })
            .format(amount || 0)
            .replace('PKR', 'Rs');
    };

    const title = 'CLOSING SALES REPORT';

    return (
        <>
            <Head title={title} />
            <Box sx={{ p: 3, minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
                <Typography sx={{ fontWeight: 700, fontSize: '26px', color: '#063455', mb: 2 }}>{title}</Typography>

                <Paper sx={{ p: 2, borderRadius: '16px', mb: 2 }}>
                    <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <DatePicker
                                label="Start Date"
                                format="DD/MM/YYYY"
                                value={reportFilters.start_date ? dayjs(reportFilters.start_date) : null}
                                onChange={(newValue) =>
                                    handleFilterChange('start_date', newValue ? newValue.format('YYYY-MM-DD') : '')
                                }
                                slotProps={{
                                    textField: {
                                        size: 'small',
                                        InputProps: { sx: { borderRadius: '16px', '& fieldset': { borderRadius: '16px' } } },
                                    },
                                }}
                            />
                            <DatePicker
                                label="End Date"
                                format="DD/MM/YYYY"
                                value={reportFilters.end_date ? dayjs(reportFilters.end_date) : null}
                                onChange={(newValue) =>
                                    handleFilterChange('end_date', newValue ? newValue.format('YYYY-MM-DD') : '')
                                }
                                slotProps={{
                                    textField: {
                                        size: 'small',
                                        InputProps: { sx: { borderRadius: '16px', '& fieldset': { borderRadius: '16px' } } },
                                    },
                                }}
                            />
                        </LocalizationProvider>

                        <Button
                            variant="contained"
                            startIcon={<Search />}
                            onClick={applyFilters}
                            sx={{
                                backgroundColor: '#063455',
                                color: 'white',
                                borderRadius: '16px',
                                textTransform: 'none',
                                '&:hover': { backgroundColor: '#063455' },
                            }}
                        >
                            Search
                        </Button>
                    </Stack>
                </Paper>

                <Paper sx={{ p: 2, borderRadius: '16px' }}>
                    <TableContainer>
                        <Table size="small">
                            <TableHead sx={{ backgroundColor: '#063455' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 700, color: '#fff' }}>Payment Method</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: '#fff', textAlign: 'right' }}>Total</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: '#fff', textAlign: 'right' }}>Paid</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: '#fff', textAlign: 'right' }}>Balance</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {(rows || []).map((r) => (
                                    <TableRow key={r.payment_method}>
                                        <TableCell sx={{ textTransform: 'uppercase', fontWeight: 700 }}>
                                            {r.payment_method}
                                        </TableCell>
                                        <TableCell sx={{ textAlign: 'right' }}>{formatCurrency(r.total)}</TableCell>
                                        <TableCell sx={{ textAlign: 'right' }}>{formatCurrency(r.paid)}</TableCell>
                                        <TableCell sx={{ textAlign: 'right' }}>{formatCurrency(r.balance)}</TableCell>
                                    </TableRow>
                                ))}
                                <TableRow sx={{ backgroundColor: '#063455' }}>
                                    <TableCell sx={{ fontWeight: 700, color: '#fff' }}>GRAND TOTAL</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: '#fff', textAlign: 'right' }}>
                                        {formatCurrency(grandTotal)}
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: '#fff', textAlign: 'right' }}>
                                        {formatCurrency(grandPaid)}
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: '#fff', textAlign: 'right' }}>
                                        {formatCurrency(grandBalance)}
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            </Box>
        </>
    );
}

