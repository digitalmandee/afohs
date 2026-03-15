import React, { useEffect, useMemo, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import {
    Alert,
    Autocomplete,
    Avatar,
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Grid,
    IconButton,
    TableCell,
    TableRow,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import debounce from 'lodash.debounce';
import axios from 'axios';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import PublishedWithChangesRoundedIcon from '@mui/icons-material/PublishedWithChangesRounded';
import EventSeatIcon from '@mui/icons-material/EventSeat';
import Groups2RoundedIcon from '@mui/icons-material/Groups2Rounded';
import AssignmentTurnedInRoundedIcon from '@mui/icons-material/AssignmentTurnedInRounded';
import BadgeRoundedIcon from '@mui/icons-material/BadgeRounded';
import AdminDataTable from '@/components/App/ui/AdminDataTable';
import AppPage from '@/components/App/ui/AppPage';
import FilterToolbar from '@/components/App/ui/FilterToolbar';
import StatCard from '@/components/App/ui/StatCard';
import SurfaceCard from '@/components/App/ui/SurfaceCard';
import TransferModal from './TransferModal';

const columns = [
    { key: 'employee_id', label: 'Emp ID', sx: { minWidth: 120 } },
    { key: 'name', label: 'Employee', sx: { minWidth: 240 } },
    { key: 'department', label: 'Department', sx: { minWidth: 180 } },
    { key: 'subdepartment', label: 'Sub-Department', sx: { minWidth: 180 } },
    { key: 'designation', label: 'Designation', sx: { minWidth: 160 } },
    { key: 'joining_date', label: 'Joining Date', sx: { minWidth: 140 } },
    { key: 'email', label: 'Email', sx: { minWidth: 220 } },
    { key: 'phone', label: 'Contact', sx: { minWidth: 150 } },
    { key: 'status', label: 'Employee Status', sx: { minWidth: 160 } },
    { key: 'actions', label: 'Actions', align: 'right', sx: { minWidth: 140 } },
];

const autocompleteSx = {
    '& .MuiAutocomplete-inputRoot': {
        minHeight: 54,
    },
};

const findOption = (options, id) => options.find((option) => String(option.id) === String(id)) || null;

export default function EmployeeDashboard() {
    const { props } = usePage();
    const {
        employees,
        companyStats = [],
        departments: initialDepartments = [],
        overviewStats = {},
        filters: initialFilters = {},
    } = props;

    const [isLoading, setIsLoading] = useState(false);
    const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });
    const [transferModal, setTransferModal] = useState({ open: false, employee: null });
    const [fetchError, setFetchError] = useState('');

    const [departments, setDepartments] = useState(initialDepartments || []);
    const [subdepartments, setSubdepartments] = useState([]);
    const [branches, setBranches] = useState([]);
    const [shifts, setShifts] = useState([]);
    const [designations, setDesignations] = useState([]);

    const [filters, setFilters] = useState({
        search: initialFilters?.search || '',
        department_id: initialFilters?.department_id || '',
        subdepartment_id: initialFilters?.subdepartment_id || '',
        branch_id: initialFilters?.branch_id || '',
        shift_id: initialFilters?.shift_id || '',
        designation_id: initialFilters?.designation_id || '',
        per_page: initialFilters?.per_page || employees?.per_page || 25,
        page: 1,
    });
    const filtersRef = React.useRef(filters);

    const summaryCards = useMemo(
        () => [
            {
                label: 'Total Employees',
                value: overviewStats?.total_employees ?? 0,
                caption: `${overviewStats?.total_departments ?? 0} departments`,
                icon: <Groups2RoundedIcon />,
                tone: 'dark',
            },
            {
                label: 'Present Today',
                value: overviewStats?.present_today ?? 0,
                caption: `${overviewStats?.weekend_today ?? 0} on weekend`,
                icon: <EventSeatIcon />,
                tone: 'light',
            },
            {
                label: 'Absent Today',
                value: overviewStats?.absent_today ?? 0,
                caption: `${overviewStats?.total_subdepartments ?? 0} sub-departments`,
                icon: <AssignmentTurnedInRoundedIcon />,
                tone: 'muted',
            },
            {
                label: 'Active Salary Structures',
                value: overviewStats?.active_salary_structures ?? 0,
                caption: `${overviewStats?.employees_without_salary_structure ?? 0} missing structure`,
                icon: <BadgeRoundedIcon />,
                tone: 'light',
            },
        ],
        [overviewStats],
    );

    const submitFilters = React.useCallback((nextFilters) => {
        setIsLoading(true);

        const payload = {};
        if (nextFilters.search?.trim()) payload.search = nextFilters.search.trim();
        if (nextFilters.department_id) payload.department_id = nextFilters.department_id;
        if (nextFilters.subdepartment_id) payload.subdepartment_id = nextFilters.subdepartment_id;
        if (nextFilters.branch_id) payload.branch_id = nextFilters.branch_id;
        if (nextFilters.shift_id) payload.shift_id = nextFilters.shift_id;
        if (nextFilters.designation_id) payload.designation_id = nextFilters.designation_id;
        payload.per_page = nextFilters.per_page || 25;
        if (Number(nextFilters.page) > 1) payload.page = Number(nextFilters.page);

        router.get(route('employees.dashboard'), payload, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
            onFinish: () => setIsLoading(false),
            onError: () => setIsLoading(false),
        });
    }, []);

    const debouncedSubmit = React.useMemo(() => debounce((nextFilters) => submitFilters(nextFilters), 350), [submitFilters]);

    useEffect(() => () => debouncedSubmit.cancel(), [debouncedSubmit]);

    useEffect(() => {
        const next = {
            search: initialFilters?.search || '',
            department_id: initialFilters?.department_id || '',
            subdepartment_id: initialFilters?.subdepartment_id || '',
            branch_id: initialFilters?.branch_id || '',
            shift_id: initialFilters?.shift_id || '',
            designation_id: initialFilters?.designation_id || '',
            per_page: initialFilters?.per_page || employees?.per_page || 25,
            page: 1,
        };
        filtersRef.current = next;
        setFilters(next);
    }, [
        employees?.per_page,
        initialFilters?.branch_id,
        initialFilters?.department_id,
        initialFilters?.designation_id,
        initialFilters?.per_page,
        initialFilters?.search,
        initialFilters?.shift_id,
        initialFilters?.subdepartment_id,
    ]);

    useEffect(() => {
        let active = true;

        const fetchFilterData = async () => {
            try {
                const [branchesRes, shiftsRes, designationsRes, departmentsRes] = await Promise.all([
                    axios.get(route('branches.list')),
                    axios.get(route('shifts.list')),
                    axios.get(route('designations.list')),
                    axios.get(route('api.departments.listAll')),
                ]);

                if (!active) return;

                if (branchesRes.data.success) setBranches(branchesRes.data.branches || []);
                if (shiftsRes.data.success) setShifts(shiftsRes.data.shifts || []);
                if (designationsRes.data.success) setDesignations(designationsRes.data.data || []);
                if (departmentsRes.data.results) setDepartments(departmentsRes.data.results || []);
                setFetchError('');
            } catch (error) {
                if (active) {
                    setFetchError('Some employee filter options could not be loaded.');
                }
            }
        };

        fetchFilterData();

        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        const departmentId = filters.department_id;

        if (!departmentId) {
            setSubdepartments([]);
            return;
        }

        let active = true;

        axios
            .get(route('api.subdepartments.listAll', { department_id: departmentId }))
            .then((res) => {
                if (!active) return;
                setSubdepartments(res.data.results || []);
            })
            .catch(() => {
                if (!active) return;
                setSubdepartments([]);
            });

        return () => {
            active = false;
        };
    }, [filters.department_id]);

    const updateFilters = React.useCallback(
        (partial, { immediate = false } = {}) => {
            const nextFilters = {
                ...filtersRef.current,
                ...partial,
            };

            if (!Object.prototype.hasOwnProperty.call(partial, 'page')) {
                nextFilters.page = 1;
            }

            if (Object.prototype.hasOwnProperty.call(partial, 'department_id') && !partial.department_id) {
                nextFilters.subdepartment_id = '';
            }

            filtersRef.current = nextFilters;
            setFilters(nextFilters);

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
        const next = {
            search: '',
            department_id: '',
            subdepartment_id: '',
            branch_id: '',
            shift_id: '',
            designation_id: '',
            per_page: filtersRef.current.per_page || employees?.per_page || 25,
            page: 1,
        };
        debouncedSubmit.cancel();
        filtersRef.current = next;
        setFilters(next);
        submitFilters(next);
    }, [debouncedSubmit, employees?.per_page, submitFilters]);

    const handleDeleteClick = (id) => setDeleteDialog({ open: true, id });

    const handleConfirmDelete = () => {
        router.delete(route('employees.destroy', deleteDialog.id), {
            onSuccess: () => setDeleteDialog({ open: false, id: null }),
            onError: () => setDeleteDialog({ open: false, id: null }),
        });
    };

    const renderStatus = (employee, needsAttention, hasNoDepartment) => {
        if (needsAttention) {
            return (
                <Chip
                    size="small"
                    label={hasNoDepartment ? 'No Department' : 'Dept Deleted'}
                    sx={{
                        bgcolor: '#fee2e2',
                        color: '#b91c1c',
                        border: '1px solid #fecaca',
                        fontWeight: 700,
                    }}
                />
            );
        }

        return (
            <Chip
                size="small"
                label={(employee.status || 'active').charAt(0).toUpperCase() + (employee.status || 'active').slice(1)}
                sx={{
                    bgcolor: employee.status === 'inactive' ? 'rgba(220,38,38,0.08)' : 'rgba(21,128,61,0.08)',
                    color: employee.status === 'inactive' ? '#b91c1c' : '#166534',
                    border: `1px solid ${employee.status === 'inactive' ? 'rgba(220,38,38,0.2)' : 'rgba(21,128,61,0.2)'}`,
                    fontWeight: 700,
                }}
            />
        );
    };

    return (
        <>
            <AppPage
                eyebrow="Employee HR"
                title="Employee Management"
                subtitle="Monitor staff strength, attendance posture, and department readiness in a single premium workspace."
                actions={[
                    <Button key="trashed" variant="outlined" color="error" onClick={() => router.visit(route('employees.trashed'))}>
                        Trashed
                    </Button>,
                    <Button key="create" variant="contained" onClick={() => router.visit(route('employees.create'))}>
                        Add Employee
                    </Button>,
                ]}
            >
                <Grid container spacing={2.25}>
                    {summaryCards.map((card) => (
                        <Grid key={card.label} item xs={12} sm={6} md={3}>
                            <StatCard
                                label={card.label}
                                value={card.value}
                                caption={card.caption}
                                icon={card.icon}
                                tone={card.tone}
                            />
                        </Grid>
                    ))}
                </Grid>

                <SurfaceCard title="Company Overview" subtitle="Compare headcount and attendance posture across active branches.">
                    <Grid container spacing={2.25}>
                        {companyStats.length === 0 ? (
                            <Grid item xs={12}>
                                <Alert severity="info" variant="outlined">
                                    No branch-level employee statistics are available yet.
                                </Alert>
                            </Grid>
                        ) : (
                            companyStats.map((company) => (
                                <Grid item xs={12} sm={6} lg={3} key={company.id}>
                                    <StatCard
                                        label={company.name}
                                        value={company.total_employees}
                                        caption={`Present ${company.present}  |  Absent ${company.absent}  |  Weekend ${company.weekend}`}
                                        tone="dark"
                                    />
                                </Grid>
                            ))
                        )}
                    </Grid>
                </SurfaceCard>

                <SurfaceCard title="Live Filters" subtitle="Employee results update automatically while you search or refine HR filters.">
                    <FilterToolbar onReset={resetFilters}>
                        {fetchError ? (
                            <Alert severity="warning" variant="outlined">
                                {fetchError}
                            </Alert>
                        ) : null}
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={4}>
                                <TextField
                                    label="Search employee"
                                    placeholder="Name, ID, email, or national ID"
                                    value={filters.search}
                                    onChange={(e) => updateFilters({ search: e.target.value })}
                                    fullWidth
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Autocomplete
                                    options={branches}
                                    getOptionLabel={(option) => option.name || ''}
                                    value={findOption(branches, filters.branch_id)}
                                    onChange={(event, value) => updateFilters({ branch_id: value?.id || '' }, { immediate: true })}
                                    renderInput={(params) => <TextField {...params} label="Company" fullWidth />}
                                    sx={autocompleteSx}
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Autocomplete
                                    options={departments}
                                    getOptionLabel={(option) => option.name || ''}
                                    value={findOption(departments, filters.department_id)}
                                    onChange={(event, value) =>
                                        updateFilters(
                                            {
                                                department_id: value?.id || '',
                                                subdepartment_id: '',
                                            },
                                            { immediate: true },
                                        )
                                    }
                                    renderInput={(params) => <TextField {...params} label="Department" fullWidth />}
                                    sx={autocompleteSx}
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Autocomplete
                                    options={subdepartments}
                                    getOptionLabel={(option) => option.name || ''}
                                    value={findOption(subdepartments, filters.subdepartment_id)}
                                    disabled={!filters.department_id}
                                    onChange={(event, value) => updateFilters({ subdepartment_id: value?.id || '' }, { immediate: true })}
                                    renderInput={(params) => <TextField {...params} label="Sub-Department" fullWidth />}
                                    sx={autocompleteSx}
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Autocomplete
                                    options={designations}
                                    getOptionLabel={(option) => option.name || ''}
                                    value={findOption(designations, filters.designation_id)}
                                    onChange={(event, value) => updateFilters({ designation_id: value?.id || '' }, { immediate: true })}
                                    renderInput={(params) => <TextField {...params} label="Designation" fullWidth />}
                                    sx={autocompleteSx}
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Autocomplete
                                    options={shifts}
                                    getOptionLabel={(option) => option.name || ''}
                                    value={findOption(shifts, filters.shift_id)}
                                    onChange={(event, value) => updateFilters({ shift_id: value?.id || '' }, { immediate: true })}
                                    renderInput={(params) => <TextField {...params} label="Shift" fullWidth />}
                                    sx={autocompleteSx}
                                />
                            </Grid>
                        </Grid>
                    </FilterToolbar>
                </SurfaceCard>

                <SurfaceCard title="Employee Register" subtitle="Standardized HR register with denser rows, stronger status cues, and consistent pagination.">
                    <AdminDataTable
                        columns={columns}
                        rows={employees?.data || []}
                        pagination={employees}
                        loading={isLoading}
                        emptyMessage="No employees found."
                        tableMinWidth={1440}
                        renderRow={(employee) => {
                            const isDepartmentDeleted = employee.department?.deleted_at !== null && employee.department?.deleted_at !== undefined;
                            const hasNoDepartment = !employee.department_id || !employee.department;
                            const needsAttention = isDepartmentDeleted || hasNoDepartment;

                            return (
                                <TableRow
                                    key={employee.id}
                                    hover
                                    sx={{
                                        backgroundColor: needsAttention ? 'rgba(254,242,242,0.9)' : 'transparent',
                                        '& .MuiTableCell-body': {
                                            borderBottomColor: needsAttention ? 'rgba(248,113,113,0.16)' : '#edf2f7',
                                        },
                                    }}
                                >
                                    <TableCell sx={{ fontWeight: 700, color: '#0f172a' }}>
                                        <Tooltip title={employee.employee_id} arrow>
                                            <span>{employee.employee_id}</span>
                                        </Tooltip>
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, minWidth: 0 }}>
                                            <Avatar
                                                src={employee.photo_url || undefined}
                                                alt={employee.name}
                                                sx={{ width: 42, height: 42, border: '1px solid #e5e7eb' }}
                                            >
                                                {employee.name?.charAt(0) || 'E'}
                                            </Avatar>
                                            <Box sx={{ minWidth: 0 }}>
                                                <Tooltip title={employee.name} arrow>
                                                    <Typography
                                                        sx={{
                                                            fontWeight: 700,
                                                            color: '#334155',
                                                            whiteSpace: 'nowrap',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            maxWidth: 180,
                                                        }}
                                                    >
                                                        {employee.name}
                                                    </Typography>
                                                </Tooltip>
                                            </Box>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        {employee.department?.name ? (
                                            <Box>
                                                <Typography sx={{ color: needsAttention ? '#b91c1c' : '#64748b', fontWeight: 600 }}>
                                                    {employee.department.name}
                                                </Typography>
                                                {isDepartmentDeleted ? (
                                                    <Typography variant="caption" sx={{ color: '#b91c1c' }}>
                                                        Department deleted
                                                    </Typography>
                                                ) : null}
                                            </Box>
                                        ) : (
                                            <Typography variant="body2" sx={{ color: '#b91c1c', fontStyle: 'italic' }}>
                                                No Department
                                            </Typography>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {employee.subdepartment?.name ? (
                                            <Box>
                                                <Typography sx={{ color: '#64748b', fontWeight: 500 }}>{employee.subdepartment.name}</Typography>
                                                {employee.subdepartment?.deleted_at ? (
                                                    <Typography variant="caption" sx={{ color: '#b91c1c' }}>
                                                        Sub-department deleted
                                                    </Typography>
                                                ) : null}
                                            </Box>
                                        ) : (
                                            <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                                                -
                                            </Typography>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Tooltip title={employee.designation?.name || employee.designation || '-'} arrow>
                                            <Typography
                                                sx={{
                                                    color: '#64748b',
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    maxWidth: 150,
                                                }}
                                            >
                                                {employee.designation?.name || employee.designation || '-'}
                                            </Typography>
                                        </Tooltip>
                                    </TableCell>
                                    <TableCell sx={{ color: '#64748b' }}>{employee.joining_date || '-'}</TableCell>
                                    <TableCell>
                                        <Tooltip title={employee.email || '-'} arrow>
                                            <Typography
                                                sx={{
                                                    color: '#64748b',
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    maxWidth: 180,
                                                }}
                                            >
                                                {employee.email || '-'}
                                            </Typography>
                                        </Tooltip>
                                    </TableCell>
                                    <TableCell sx={{ color: '#64748b' }}>{employee.phone_no || '-'}</TableCell>
                                    <TableCell>{renderStatus(employee, needsAttention, hasNoDepartment)}</TableCell>
                                    <TableCell align="right">
                                        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.35 }}>
                                            <Tooltip title="Edit employee" arrow>
                                                <IconButton size="small" onClick={() => router.visit(route('employees.edit', employee.id))}>
                                                    <EditRoundedIcon sx={{ fontSize: '1.05rem', color: '#0c67a7' }} />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Delete employee" arrow>
                                                <IconButton size="small" onClick={() => handleDeleteClick(employee.id)}>
                                                    <DeleteOutlineRoundedIcon sx={{ fontSize: '1.05rem', color: '#dc2626' }} />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Transfer employee" arrow>
                                                <IconButton size="small" onClick={() => setTransferModal({ open: true, employee })}>
                                                    <PublishedWithChangesRoundedIcon sx={{ fontSize: '1.05rem', color: '#7c3aed' }} />
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

            <Dialog
                open={deleteDialog.open}
                onClose={() => setDeleteDialog({ open: false, id: null })}
                PaperProps={{ sx: { borderRadius: '22px' } }}
            >
                <DialogTitle>Delete Employee?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete this employee? They can be restored later from the trashed employees page.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5 }}>
                    <Button onClick={() => setDeleteDialog({ open: false, id: null })}>Cancel</Button>
                    <Button onClick={handleConfirmDelete} color="error" variant="contained">
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            <TransferModal
                open={transferModal.open}
                onClose={() => setTransferModal({ open: false, employee: null })}
                employee={transferModal.employee}
                onSuccess={() => {
                    router.reload({
                        preserveScroll: true,
                        preserveState: true,
                        only: ['employees', 'companyStats', 'overviewStats', 'filters'],
                    });
                }}
            />
        </>
    );
}
