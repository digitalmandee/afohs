import React, { useMemo, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { Autocomplete, Box, Button, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { Search } from '@mui/icons-material';
import dayjs from 'dayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

export default function DishBreakdownSummary({ metric, title, rows, tenants, startDate, endDate, filters }) {
    const toArray = (v) => {
        if (Array.isArray(v)) return v.filter(Boolean);
        if (!v) return [];
        return String(v)
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
    };

    const toIntArray = (v) =>
        toArray(v)
            .map((x) => Number(x))
            .filter((n) => Number.isFinite(n) && n > 0);

    const [reportFilters, setReportFilters] = useState({
        start_date: filters?.start_date || startDate,
        end_date: filters?.end_date || endDate,
        tenant_ids: toIntArray(filters?.tenant_ids),
        category_names: toArray(filters?.category_names),
        item_search: filters?.item_search || '',
    });

    const routeName = metric === 'quantity' ? 'admin.reports.pos.dish-breakdown-quantity' : 'admin.reports.pos.dish-breakdown-price';

    const showTaxColumn = useMemo(() => (rows || []).some((r) => Number(r?.tax || 0) > 0), [rows]);

    const handleFilterChange = (field, value) => {
        setReportFilters((prev) => ({ ...prev, [field]: value }));
    };

    const applyFilters = () => {
        router.get(route(routeName), reportFilters);
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-PK', {
            style: 'currency',
            currency: 'PKR',
        })
            .format(amount || 0)
            .replace('PKR', 'Rs');
    };

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
                                        sx: { minWidth: 160 },
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
                                        sx: { minWidth: 160 },
                                        InputProps: { sx: { borderRadius: '16px', '& fieldset': { borderRadius: '16px' } } },
                                    },
                                }}
                            />
                        </LocalizationProvider>

                        <Autocomplete
                            multiple
                            size="small"
                            options={tenants || []}
                            getOptionLabel={(opt) => opt?.name || ''}
                            value={(tenants || []).filter((t) => reportFilters.tenant_ids.includes(t.id))}
                            onChange={(_, value) => handleFilterChange('tenant_ids', value.map((v) => v.id))}
                            renderInput={(params) => <TextField {...params} label="Restaurant" />}
                            sx={{ minWidth: 240 }}
                        />

                        <Autocomplete
                            multiple
                            freeSolo
                            size="small"
                            options={[]}
                            value={reportFilters.category_names}
                            onChange={(_, value) => handleFilterChange('category_names', value)}
                            renderInput={(params) => <TextField {...params} label="Category" />}
                            sx={{ minWidth: 220 }}
                        />

                        <TextField
                            size="small"
                            label="Item Code/Name"
                            value={reportFilters.item_search}
                            onChange={(e) => handleFilterChange('item_search', e.target.value)}
                            sx={{ minWidth: 220 }}
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
                                    <TableCell sx={{ fontWeight: 700, color: '#fff' }}>Item Code</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: '#fff' }}>Item Name</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: '#fff', textAlign: 'right' }}>Qty</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: '#fff', textAlign: 'right' }}>Sub Total</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: '#fff', textAlign: 'right' }}>Discount</TableCell>
                                    {showTaxColumn && (
                                        <TableCell sx={{ fontWeight: 700, color: '#fff', textAlign: 'right' }}>Tax</TableCell>
                                    )}
                                    <TableCell sx={{ fontWeight: 700, color: '#fff', textAlign: 'right' }}>Total Sale</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {(rows || []).map((r, idx) => (
                                    <TableRow key={`${r.code}-${r.name}-${idx}`}>
                                        <TableCell>{idx + 1}</TableCell>
                                        <TableCell>{r.code}</TableCell>
                                        <TableCell>{r.name}</TableCell>
                                        <TableCell sx={{ textAlign: 'right', fontWeight: 700 }}>{Number(r.qty || 0)}</TableCell>
                                        <TableCell sx={{ textAlign: 'right' }}>{formatCurrency(r.sub_total)}</TableCell>
                                        <TableCell sx={{ textAlign: 'right' }}>{formatCurrency(r.discount)}</TableCell>
                                        {showTaxColumn && <TableCell sx={{ textAlign: 'right' }}>{formatCurrency(r.tax)}</TableCell>}
                                        <TableCell sx={{ textAlign: 'right', fontWeight: 700 }}>{formatCurrency(r.total_sale)}</TableCell>
                                    </TableRow>
                                ))}
                                {(!rows || rows.length === 0) && (
                                    <TableRow>
                                        <TableCell colSpan={showTaxColumn ? 8 : 7} sx={{ textAlign: 'center', py: 4 }}>
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

