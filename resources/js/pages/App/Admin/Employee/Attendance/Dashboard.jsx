import React, { useEffect, useMemo, useRef, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import {
    Autocomplete,
    Box,
    Button,
    Chip,
    Grid,
    IconButton,
    Stack,
    TableCell,
    TableRow,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import debounce from 'lodash.debounce';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import AssignmentRoundedIcon from '@mui/icons-material/AssignmentRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import ChecklistRoundedIcon from '@mui/icons-material/ChecklistRounded';
import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded';
import FactCheckRoundedIcon from '@mui/icons-material/FactCheckRounded';
import ModeEditOutlineRoundedIcon from '@mui/icons-material/ModeEditOutlineRounded';
import Groups2RoundedIcon from '@mui/icons-material/Groups2Rounded';
import SurfaceCard from '@/components/App/ui/SurfaceCard';
import AppPage from '@/components/App/ui/AppPage';
import FilterToolbar from '@/components/App/ui/FilterToolbar';
import StatCard from '@/components/App/ui/StatCard';
import AdminDataTable from '@/components/App/ui/AdminDataTable';

const quickLinks = [
    {
        label: 'Leave Management',
        caption: 'Applications and approvals',
        icon: <AssignmentRoundedIcon />,
        href: route('employees.leaves.application.index'),
    },
    {
        label: 'Manage Attendance',
        caption: 'Daily attendance updates',
        icon: <ChecklistRoundedIcon />,
        href: route('employees.attendances.management'),
    },
    {
        label: 'Monthly Report',
        caption: 'Month-wise attendance summary',
        icon: <CalendarMonthRoundedIcon />,
        href: route('employees.attendances.monthly.report'),
    },
    {
        label: 'Attendance Report',
        caption: 'Printable reporting view',
        icon: <EventAvailableRoundedIcon />,
        href: route('employees.attendances.report'),
    },
];

const columns = [
    { key: 'employee_id', label: 'Emp ID', minWidth: 120 },
    { key: 'name', label: 'Employee', minWidth: 220 },
    { key: 'department', label: 'Department', minWidth: 180 },
    { key: 'designation', label: 'Designation', minWidth: 180 },
    { key: 'joining_date', label: 'Joining Date', minWidth: 140 },
    { key: 'email', label: 'Email', minWidth: 220, truncate: true },
    { key: 'status', label: 'Status', minWidth: 140 },
    { key: 'actions', label: 'Actions', minWidth: 90, align: 'right' },
];

const resolveEmployeeStatus = (employee) => {
    if (employee?.department?.deleted_at) {
        return { label: 'Needs Attention', color: 'error' };
    }

    const normalized = String(employee?.status || 'active').toLowerCase();
    if (normalized === 'active') {
        return { label: 'Active', color: 'success' };
    }
    if (normalized === 'inactive') {
        return { label: 'Inactive', color: 'default' };
    }
    if (normalized === 'terminated') {
        return { label: 'Terminated', color: 'error' };
    }

    return { label: employee?.status || 'Active', color: 'info' };
};

export default function AttendanceDashboard() {
    const { props } = usePage();
    const {
        employees,
        stats = {},
        departments = [],
        filters: initialFilters = {},
    } = props;

    const safeEmployees = employees?.data || [];
    const pagination = employees
        ? {
              current_page: employees.current_page || 1,
              last_page: employees.last_page || 1,
              per_page: employees.per_page || 10,
              total: employees.total || safeEmployees.length,
              links: employees.links || [],
          }
        : null;

    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState(initialFilters?.search || '');
    const [selectedDepartments, setSelectedDepartments] = useState(
        Array.isArray(initialFilters?.department_ids)
            ? initialFilters.department_ids.map((id) => String(id))
            : [],
    );

    const filtersRef = useRef({
        search: initialFilters?.search || '',
        department_ids: Array.isArray(initialFilters?.department_ids)
            ? initialFilters.department_ids.map((id) => String(id))
            : [],
        page: 1,
    });

    useEffect(() => {
        const next = {
            search: initialFilters?.search || '',
            department_ids: Array.isArray(initialFilters?.department_ids)
                ? initialFilters.department_ids.map((id) => String(id))
                : [],
            page: 1,
        };
        filtersRef.current = next;
        setSearchTerm(next.search);
        setSelectedDepartments(next.department_ids);
    }, [initialFilters?.department_ids, initialFilters?.search]);

    const submitFilters = React.useCallback((nextFilters) => {
        setIsLoading(true);

        const payload = {};
        if (nextFilters.search?.trim()) {
            payload.search = nextFilters.search.trim();
        }
        if (Array.isArray(nextFilters.department_ids) && nextFilters.department_ids.length > 0) {
            payload.department_ids = nextFilters.department_ids;
        }
        if (Number(nextFilters.page) > 1) {
            payload.page = Number(nextFilters.page);
        }

        router.get(route('employees.attendances.dashboard'), payload, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
            onFinish: () => setIsLoading(false),
            onError: () => setIsLoading(false),
        });
    }, []);

    const debouncedSubmit = useMemo(() => debounce((next) => submitFilters(next), 300), [submitFilters]);

    useEffect(() => () => debouncedSubmit.cancel(), [debouncedSubmit]);

    const updateFilters = React.useCallback(
        (partial, { immediate = false } = {}) => {
            const nextFilters = {
                ...filtersRef.current,
                ...partial,
            };

            if (!Object.prototype.hasOwnProperty.call(partial, 'page')) {
                nextFilters.page = 1;
            }

            filtersRef.current = nextFilters;

            if (Object.prototype.hasOwnProperty.call(partial, 'search')) {
                setSearchTerm(nextFilters.search);
            }

            if (Object.prototype.hasOwnProperty.call(partial, 'department_ids')) {
                setSelectedDepartments(nextFilters.department_ids);
            }

            if (immediate) {
                debouncedSubmit.cancel();
                submitFilters(nextFilters);
                return;
            }

            debouncedSubmit(nextFilters);
        },
        [debouncedSubmit, submitFilters],
    );

    const resetFilters = React.useCallback(() => {
        debouncedSubmit.cancel();
        const nextFilters = {
            search: '',
            department_ids: [],
            page: 1,
        };
        filtersRef.current = nextFilters;
        setSearchTerm('');
        setSelectedDepartments([]);
        submitFilters(nextFilters);
    }, [debouncedSubmit, submitFilters]);

    const summaryCards = [
        {
            label: 'Total Employees',
            value: stats?.total_employees ?? 0,
            caption: `${departments?.length || 0} departments tracked`,
            icon: <Groups2RoundedIcon />,
            tone: 'dark',
        },
        {
            label: 'Present Today',
            value: stats?.total_present ?? 0,
            caption: 'Marked present',
            icon: <FactCheckRoundedIcon />,
            tone: 'light',
        },
        {
            label: 'Absent Today',
            value: stats?.total_absent ?? 0,
            caption: 'Not checked in',
            icon: <ChecklistRoundedIcon />,
            tone: 'muted',
        },
        {
            label: 'Late Today',
            value: stats?.total_late ?? 0,
            caption: 'Late attendance entries',
            icon: <EventAvailableRoundedIcon />,
            tone: 'light',
        },
    ];

    return (
        <AppPage
            title="Attendance Dashboard"
            subtitle="Track leave workflows, attendance coverage, and employee readiness from one aligned workspace."
            actions={(
                <Button
                    variant="contained"
                    startIcon={<AddRoundedIcon />}
                    onClick={() => router.visit(route('employees.leaves.application.create'))}
                    sx={{ textTransform: 'none', borderRadius: 999 }}
                >
                    New Application
                </Button>
            )}
        >
            <Grid container spacing={2.5} sx={{ mb: 1 }}>
                {summaryCards.map((card) => (
                    <Grid item xs={12} sm={6} xl={3} key={card.label}>
                        <StatCard compact {...card} />
                    </Grid>
                ))}
            </Grid>

            <SurfaceCard
                title="Attendance Shortcuts"
                subtitle="Jump into the most-used leave and attendance workflows."
            >
                <Grid container spacing={2}>
                    {quickLinks.map((link) => (
                        <Grid item xs={12} sm={6} xl={3} key={link.label}>
                            <Button
                                fullWidth
                                variant="outlined"
                                startIcon={link.icon}
                                onClick={() => router.visit(link.href)}
                                sx={{
                                    justifyContent: 'flex-start',
                                    borderRadius: 3,
                                    px: 2,
                                    py: 1.4,
                                    textTransform: 'none',
                                    borderColor: 'rgba(10,61,98,0.18)',
                                }}
                            >
                                <Stack alignItems="flex-start" spacing={0.15}>
                                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                        {link.label}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {link.caption}
                                    </Typography>
                                </Stack>
                            </Button>
                        </Grid>
                    ))}
                </Grid>
            </SurfaceCard>

            <SurfaceCard
                title="Live Filters"
                subtitle="Filter employees instantly by name, employee ID, email, designation, or department."
            >
                <FilterToolbar onReset={resetFilters}>
                    <Grid container spacing={1.25}>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                size="small"
                                placeholder="Search employee, email, ID, or designation"
                                value={searchTerm}
                                onChange={(event) => updateFilters({ search: event.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Autocomplete
                                multiple
                                options={departments}
                                value={departments.filter((department) => selectedDepartments.includes(String(department.id)))}
                                getOptionLabel={(option) => option?.name || ''}
                                isOptionEqualToValue={(option, value) => String(option.id) === String(value.id)}
                                onChange={(_, values) =>
                                    updateFilters({
                                        department_ids: values.map((value) => String(value.id)),
                                    })
                                }
                                renderInput={(params) => <TextField {...params} size="small" label="Departments" />}
                            />
                        </Grid>
                    </Grid>
                </FilterToolbar>
            </SurfaceCard>

            <SurfaceCard
                title="Employee Attendance Register"
                subtitle="Review active employees and move into edit workflows without losing your filters."
            >
                <AdminDataTable
                    columns={columns}
                    rows={safeEmployees}
                    loading={isLoading}
                    emptyMessage="No employee records are available for the selected attendance filters."
                    pagination={pagination}
                    tableMinWidth={1120}
                    stickyLastColumn
                    renderRow={(employee) => {
                        const status = resolveEmployeeStatus(employee);

                        return (
                            <TableRow key={employee.id} hover>
                                <TableCell>{employee?.employee_id || 'N/A'}</TableCell>
                                <TableCell>{employee?.name || 'Unnamed employee'}</TableCell>
                                <TableCell>{employee?.department?.name || 'Unassigned'}</TableCell>
                                <TableCell>{employee?.designation || 'Not set'}</TableCell>
                                <TableCell>{employee?.joining_date || 'N/A'}</TableCell>
                                <TableCell>{employee?.email || 'No email'}</TableCell>
                                <TableCell>
                                    <Chip
                                        size="small"
                                        label={status.label}
                                        color={status.color}
                                        variant={status.color === 'default' ? 'outlined' : 'filled'}
                                        sx={{ fontWeight: 700 }}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                        <Tooltip title="Edit employee">
                                            <IconButton
                                                size="small"
                                                onClick={() => router.visit(route('employees.edit', employee.id))}
                                                aria-label={`Edit ${employee?.name || 'employee'}`}
                                            >
                                                <ModeEditOutlineRoundedIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                </TableCell>
                            </TableRow>
                        );
                    }}
                />
            </SurfaceCard>
        </AppPage>
    );
}
