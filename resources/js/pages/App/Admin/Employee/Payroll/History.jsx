import React, { useEffect, useMemo, useState } from 'react';
import { Head } from '@inertiajs/react';
import {
    Alert,
    Autocomplete,
    Chip,
    Grid,
    Stack,
    TableCell,
    TableRow,
    TextField,
    Typography,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import debounce from 'lodash.debounce';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import AppPage from '@/components/App/ui/AppPage';
import SurfaceCard from '@/components/App/ui/SurfaceCard';
import FilterToolbar from '@/components/App/ui/FilterToolbar';
import StatCard from '@/components/App/ui/StatCard';
import AdminDataTable from '@/components/App/ui/AdminDataTable';
import { compactDateActionBar, compactDateFieldSx, compactDateTextFieldProps } from '@/components/App/ui/dateFieldStyles';

const columns = [
    { key: 'period_name', label: 'Period', minWidth: 160 },
    { key: 'dates', label: 'Dates', minWidth: 180 },
    { key: 'basic_salary', label: 'Basic', minWidth: 140, align: 'right' },
    { key: 'allowances', label: 'Allowances', minWidth: 140, align: 'right' },
    { key: 'deductions', label: 'Deductions', minWidth: 140, align: 'right' },
    { key: 'net_salary', label: 'Net Salary', minWidth: 160, align: 'right' },
    { key: 'status', label: 'Status', minWidth: 120 },
];

const sampleHistoryData = {
    employee: {
        id: 'sample',
        name: 'Sample Employee',
        employee_id: 'EMP-SAMPLE',
    },
    totals: {
        total_basic_salary: 120000,
        total_deductions: 14000,
        total_net_salary: 106000,
    },
    payslips: [
        {
            id: 'sample-1',
            period_name: 'January 2026',
            start_date: '01/01/2026',
            end_date: '31/01/2026',
            basic_salary: 60000,
            total_allowances: 8000,
            total_deductions: 7000,
            net_salary: 61000,
            status: 'draft',
            is_sample: true,
        },
        {
            id: 'sample-2',
            period_name: 'February 2026',
            start_date: '01/02/2026',
            end_date: '28/02/2026',
            basic_salary: 60000,
            total_allowances: 7000,
            total_deductions: 7000,
            net_salary: 60000,
            status: 'approved',
            is_sample: true,
        },
    ],
};

const formatCurrency = (value) =>
    Number.parseFloat(value || 0).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

const statusColor = (status) => {
    switch (String(status || '').toLowerCase()) {
        case 'paid':
            return 'success';
        case 'approved':
            return 'info';
        case 'draft':
            return 'warning';
        default:
            return 'default';
    }
};

export default function History() {
    const { enqueueSnackbar } = useSnackbar();

    const [employee, setEmployee] = useState(null);
    const [fromDate, setFromDate] = useState(dayjs().startOf('year'));
    const [toDate, setToDate] = useState(dayjs().endOf('year'));
    const [loading, setLoading] = useState(false);
    const [employeesList, setEmployeesList] = useState([]);
    const [historyData, setHistoryData] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        let active = true;

        axios
            .get(route('employees.list'))
            .then((res) => {
                if (!active) {
                    return;
                }

                if (res.data.success) {
                    setEmployeesList(res.data.employees || []);
                } else {
                    setEmployeesList([]);
                }
            })
            .catch(() => {
                if (!active) {
                    return;
                }
                setEmployeesList([]);
                setErrorMessage('Employee choices could not be loaded.');
            });

        return () => {
            active = false;
        };
    }, []);

    const fetchHistory = React.useCallback(
        async (selectedEmployee, startDateValue, endDateValue) => {
            if (!selectedEmployee?.id) {
                setHistoryData(null);
                setLoading(false);
                setErrorMessage('');
                return;
            }

            setLoading(true);
            setErrorMessage('');

            try {
                const params = {
                    from_date: startDateValue ? dayjs(startDateValue).format('YYYY-MM-DD') : null,
                    to_date: endDateValue ? dayjs(endDateValue).format('YYYY-MM-DD') : null,
                };

                const res = await axios.get(route('api.payroll.history', { employeeId: selectedEmployee.id }), {
                    params,
                });

                if (res.data.success) {
                    setHistoryData({
                        employee: res.data.employee,
                        payslips: res.data.payslips || [],
                        totals: res.data.totals || {},
                    });
                } else {
                    setHistoryData({
                        employee: selectedEmployee,
                        payslips: [],
                        totals: {},
                    });
                }
            } catch (error) {
                setHistoryData(null);
                setErrorMessage('Failed to fetch payroll history for the selected employee.');
                enqueueSnackbar('Failed to fetch payroll history', { variant: 'error' });
            } finally {
                setLoading(false);
            }
        },
        [enqueueSnackbar],
    );

    const debouncedFetch = useMemo(
        () =>
            debounce((selectedEmployee, startDateValue, endDateValue) => {
                fetchHistory(selectedEmployee, startDateValue, endDateValue);
            }, 300),
        [fetchHistory],
    );

    useEffect(() => () => debouncedFetch.cancel(), [debouncedFetch]);

    useEffect(() => {
        debouncedFetch(employee, fromDate, toDate);
    }, [employee, fromDate, toDate, debouncedFetch]);

    const resetFilters = React.useCallback(() => {
        debouncedFetch.cancel();
        setEmployee(null);
        setFromDate(dayjs().startOf('year'));
        setToDate(dayjs().endOf('year'));
        setHistoryData(null);
        setErrorMessage('');
        setLoading(false);
    }, [debouncedFetch]);

    const visibleHistoryData = historyData || sampleHistoryData;
    const summaryCards = [
        {
            label: 'Total Basic Salary',
            value: formatCurrency(visibleHistoryData?.totals?.total_basic_salary),
            caption: visibleHistoryData?.employee?.name || 'Sample employee',
            tone: 'dark',
        },
        {
            label: 'Total Deductions',
            value: formatCurrency(visibleHistoryData?.totals?.total_deductions),
            caption: 'Aggregated payroll deductions',
            tone: 'light',
        },
        {
            label: 'Total Net Paid',
            value: formatCurrency(visibleHistoryData?.totals?.total_net_salary),
            caption:
                historyData?.employee?.employee_id ||
                'Sample totals shown until a live employee is selected',
            tone: 'muted',
        },
    ];

    return (
        <>
            <Head title="Employee Payroll History" />
            <LocalizationProvider dateAdapter={AdapterDayjs}>
                <AppPage
                    title="Employee Payroll History"
                    subtitle="Review salary history, allowances, deductions, and payroll status without losing context."
                >
                    {errorMessage ? (
                        <Alert severity="warning" sx={{ mb: 2 }}>
                            {errorMessage}
                        </Alert>
                    ) : null}

                    <Grid container spacing={2.5} sx={{ mb: 1 }}>
                        {summaryCards.map((card) => (
                            <Grid item xs={12} md={4} key={card.label}>
                                <StatCard {...card} />
                            </Grid>
                        ))}
                    </Grid>

                    <SurfaceCard
                        title="Live Filters"
                        subtitle="Pick an employee and adjust the date range. Results refresh automatically."
                    >
                        <FilterToolbar
                            title="Filters"
                            subtitle="Set payroll history filters and click Apply."
                            lowChrome
                            onApply={() => fetchHistory(employee, fromDate, toDate)}
                            onReset={resetFilters}
                        >
                            <Grid container spacing={1.25}>
                                <Grid item xs={12} md={4}>
                                    <Autocomplete
                                        options={employeesList}
                                        getOptionLabel={(option) =>
                                            `${option?.name || 'Unknown'} (${option?.employee_id || 'N/A'})`
                                        }
                                        value={employee}
                                        onChange={(_, value) => setEmployee(value)}
                                        isOptionEqualToValue={(option, value) =>
                                            String(option.id) === String(value.id)
                                        }
                                        renderInput={(params) => (
                                            <TextField {...params} label="Employee" size="small" />
                                        )}
                                    />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <DatePicker
                                        label="From Date"
                                        value={fromDate}
                                        onChange={(value) => setFromDate(value)}
                                        slotProps={{ textField: compactDateTextFieldProps, actionBar: compactDateActionBar }}
                                        format="DD/MM/YYYY"
                                        sx={compactDateFieldSx}
                                    />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <DatePicker
                                        label="To Date"
                                        value={toDate}
                                        onChange={(value) => setToDate(value)}
                                        slotProps={{ textField: compactDateTextFieldProps, actionBar: compactDateActionBar }}
                                        format="DD/MM/YYYY"
                                        sx={compactDateFieldSx}
                                    />
                                </Grid>
                            </Grid>
                        </FilterToolbar>
                    </SurfaceCard>

                    <SurfaceCard
                        title="Payslip History"
                        subtitle={
                            historyData?.employee
                                ? `Showing payroll history for ${historyData.employee.name}`
                                : 'Showing sample data until a live employee is selected.'
                        }
                    >
                        <AdminDataTable
                            columns={columns}
                            rows={visibleHistoryData?.payslips || []}
                            loading={loading}
                            emptyMessage={
                                employee
                                    ? 'No payroll history is available for the selected range.'
                                    : 'No payroll history available yet. Select an employee to load live records.'
                            }
                            tableMinWidth={980}
                            renderRow={(payslip) => (
                                <TableRow key={payslip.id} hover>
                                    <TableCell>
                                        <Stack spacing={0.4}>
                                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                                {payslip.period_name || 'Unknown Period'}
                                            </Typography>
                                            {payslip.is_sample ? (
                                                <Typography variant="caption" color="text.secondary">
                                                    Sample row
                                                </Typography>
                                            ) : null}
                                        </Stack>
                                    </TableCell>
                                    <TableCell>{`${payslip.start_date || 'N/A'} - ${payslip.end_date || 'N/A'}`}</TableCell>
                                    <TableCell align="right">{formatCurrency(payslip.basic_salary)}</TableCell>
                                    <TableCell align="right">{formatCurrency(payslip.total_allowances)}</TableCell>
                                    <TableCell align="right">{formatCurrency(payslip.total_deductions)}</TableCell>
                                    <TableCell align="right">{formatCurrency(payslip.net_salary)}</TableCell>
                                    <TableCell>
                                        <Stack direction="row" spacing={0.75}>
                                            <Chip
                                                size="small"
                                                label={payslip.status || 'Unknown'}
                                                color={statusColor(payslip.status)}
                                                variant={statusColor(payslip.status) === 'default' ? 'outlined' : 'filled'}
                                            />
                                            {payslip.is_sample ? (
                                                <Chip size="small" label="sample" variant="outlined" />
                                            ) : null}
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            )}
                        />
                    </SurfaceCard>
                </AppPage>
            </LocalizationProvider>
        </>
    );
}
