import React, { useMemo, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { Box, Button, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import { Search } from '@mui/icons-material';
import dayjs from 'dayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export default function PosGraphicalReport({ startDate, endDate, filters, rows }) {
    const [reportFilters, setReportFilters] = useState({
        start_date: filters?.start_date || startDate,
        end_date: filters?.end_date || endDate,
    });

    const data = useMemo(() => {
        return (rows || []).map((r) => ({
            date: r.date,
            total: Number(r.total || 0),
            orders: Number(r.orders || 0),
        }));
    }, [rows]);

    const applyFilters = () => {
        router.get(route('admin.reports.pos.graphical'), reportFilters);
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR' })
            .format(amount || 0)
            .replace('PKR', 'Rs');
    };

    const title = 'GRAPHICAL REPORT';

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
                                    setReportFilters((p) => ({ ...p, start_date: newValue ? newValue.format('YYYY-MM-DD') : '' }))
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
                                    setReportFilters((p) => ({ ...p, end_date: newValue ? newValue.format('YYYY-MM-DD') : '' }))
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

                <Paper sx={{ p: 2, borderRadius: '16px', mb: 2 }}>
                    <Box sx={{ height: 320 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip
                                    formatter={(value, name) => {
                                        if (name === 'total') return [formatCurrency(value), 'Total'];
                                        return [value, name];
                                    }}
                                />
                                <Bar dataKey="total" fill="#063455" />
                            </BarChart>
                        </ResponsiveContainer>
                    </Box>
                </Paper>

                <Paper sx={{ p: 2, borderRadius: '16px' }}>
                    <TableContainer>
                        <Table size="small">
                            <TableHead sx={{ backgroundColor: '#063455' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 700, color: '#fff' }}>Date</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: '#fff', textAlign: 'right' }}>Orders</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: '#fff', textAlign: 'right' }}>Total</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {data.map((r) => (
                                    <TableRow key={r.date}>
                                        <TableCell>{r.date}</TableCell>
                                        <TableCell sx={{ textAlign: 'right', fontWeight: 700 }}>{r.orders}</TableCell>
                                        <TableCell sx={{ textAlign: 'right', fontWeight: 700 }}>{formatCurrency(r.total)}</TableCell>
                                    </TableRow>
                                ))}
                                {(!data || data.length === 0) && (
                                    <TableRow>
                                        <TableCell colSpan={3} sx={{ textAlign: 'center', py: 4 }}>
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

