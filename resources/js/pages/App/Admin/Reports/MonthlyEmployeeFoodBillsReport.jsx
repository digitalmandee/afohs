import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { Box, Button, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { Search } from '@mui/icons-material';
import dayjs from 'dayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

export default function MonthlyEmployeeFoodBillsReport({ startDate, endDate, filters, rows }) {
    const [reportFilters, setReportFilters] = useState({
        start_date: filters?.start_date || startDate,
        end_date: filters?.end_date || endDate,
        employee_search: filters?.employee_search || '',
    });

    const handleFilterChange = (field, value) => {
        setReportFilters((prev) => ({ ...prev, [field]: value }));
    };

    const applyFilters = () => {
        router.get(route('admin.reports.pos.monthly-employee-food-bills'), reportFilters);
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR' })
            .format(amount || 0)
            .replace('PKR', 'Rs');
    };

    const title = 'MONTHLY EMPLOYEE FOOD BILLS REPORT';

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

                        <TextField
                            size="small"
                            label="Employee Name/ID"
                            value={reportFilters.employee_search}
                            onChange={(e) => handleFilterChange('employee_search', e.target.value)}
                            sx={{ minWidth: 240 }}
                        />

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
                                    <TableCell sx={{ fontWeight: 700, color: '#fff' }}>Sr #</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: '#fff' }}>Employee #</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: '#fff' }}>Employee Name</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: '#fff', textAlign: 'right' }}>Orders</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: '#fff', textAlign: 'right' }}>Total</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {(rows || []).map((r, idx) => (
                                    <TableRow key={r.employee_id}>
                                        <TableCell>{idx + 1}</TableCell>
                                        <TableCell>{r.employee_no}</TableCell>
                                        <TableCell>{r.employee_name}</TableCell>
                                        <TableCell sx={{ textAlign: 'right', fontWeight: 700 }}>{r.orders}</TableCell>
                                        <TableCell sx={{ textAlign: 'right', fontWeight: 700 }}>{formatCurrency(r.total)}</TableCell>
                                    </TableRow>
                                ))}
                                {(!rows || rows.length === 0) && (
                                    <TableRow>
                                        <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4 }}>
                                            No data found
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            </Box>
        </>
    );
}

