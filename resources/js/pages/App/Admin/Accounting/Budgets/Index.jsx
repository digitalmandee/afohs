import React from 'react';
import { router, useForm } from '@inertiajs/react';
import debounce from 'lodash.debounce';
import {
    Alert,
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    Grid,
    IconButton,
    MenuItem,
    TableCell,
    TableRow,
    TextField,
    Typography,
} from '@mui/material';
import { Add, DeleteOutline } from '@mui/icons-material';
import AppPage from '@/components/App/ui/AppPage';
import AdminDataTable from '@/components/App/ui/AdminDataTable';
import FilterToolbar from '@/components/App/ui/FilterToolbar';
import StatCard from '@/components/App/ui/StatCard';
import SurfaceCard from '@/components/App/ui/SurfaceCard';

export default function Index({ budgets, coaAccounts, filters, error }) {
    const [openModal, setOpenModal] = React.useState(false);
    const rows = budgets?.data || [];
    const [localFilters, setLocalFilters] = React.useState({
        search: filters?.search || '',
        status: filters?.status || '',
        from: filters?.from || '',
        to: filters?.to || '',
        per_page: filters?.per_page || budgets?.per_page || 25,
        page: 1,
    });
    const filtersRef = React.useRef(localFilters);
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        start_date: '',
        end_date: '',
        status: 'draft',
        remarks: '',
        lines: [{ account_id: '', amount: '' }],
    });

    const submitFilters = React.useCallback((nextFilters) => {
        const payload = {};

        if (nextFilters.search?.trim()) payload.search = nextFilters.search.trim();
        if (nextFilters.status) payload.status = nextFilters.status;
        if (nextFilters.from) payload.from = nextFilters.from;
        if (nextFilters.to) payload.to = nextFilters.to;
        payload.per_page = nextFilters.per_page || 25;
        if (Number(nextFilters.page) > 1) payload.page = Number(nextFilters.page);

        router.get(route('accounting.budgets.index'), payload, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    }, []);

    const debouncedSubmit = React.useMemo(() => debounce((nextFilters) => submitFilters(nextFilters), 350), [submitFilters]);

    React.useEffect(() => () => debouncedSubmit.cancel(), [debouncedSubmit]);

    React.useEffect(() => {
        const next = {
            search: filters?.search || '',
            status: filters?.status || '',
            from: filters?.from || '',
            to: filters?.to || '',
            per_page: filters?.per_page || budgets?.per_page || 25,
            page: 1,
        };
        filtersRef.current = next;
        setLocalFilters(next);
    }, [budgets?.per_page, filters?.from, filters?.per_page, filters?.search, filters?.status, filters?.to]);

    const updateFilters = React.useCallback((partial, { immediate = false } = {}) => {
        const next = { ...filtersRef.current, ...partial };

        if (!Object.prototype.hasOwnProperty.call(partial, 'page')) {
            next.page = 1;
        }

        filtersRef.current = next;
        setLocalFilters(next);

        if (immediate) {
            debouncedSubmit.cancel();
            submitFilters(next);
            return;
        }

        debouncedSubmit(next);
    }, [debouncedSubmit, submitFilters]);

    const resetFilters = React.useCallback(() => {
        const cleared = {
            search: '',
            status: '',
            from: '',
            to: '',
            per_page: filtersRef.current.per_page || budgets?.per_page || 25,
            page: 1,
        };
        debouncedSubmit.cancel();
        filtersRef.current = cleared;
        setLocalFilters(cleared);
        submitFilters(cleared);
    }, [budgets?.per_page, debouncedSubmit, submitFilters]);

    const totalAmount = data.lines.reduce((sum, line) => sum + Number(line.amount || 0), 0);
    const totalBudgets = budgets?.total ?? rows.length;
    const activeBudgets = rows.filter((budget) => budget.status === 'active').length;
    const totalBudgeted = rows.reduce((sum, budget) => sum + Number(budget.total_amount || 0), 0);
    const draftBudgets = rows.filter((budget) => budget.status === 'draft').length;

    const addLine = () => {
        setData('lines', [...data.lines, { account_id: '', amount: '' }]);
    };

    const removeLine = (index) => {
        setData('lines', data.lines.filter((_, idx) => idx !== index));
    };

    const updateLine = (index, key, value) => {
        const next = data.lines.map((line, idx) => (idx === index ? { ...line, [key]: value } : line));
        setData('lines', next);
    };

    const submit = (event) => {
        event.preventDefault();
        post(route('accounting.budgets.store'), {
            onSuccess: () => {
                reset();
                setData('status', 'draft');
                setData('lines', [{ account_id: '', amount: '' }]);
                setOpenModal(false);
            },
        });
    };

    const columns = [
        { key: 'name', label: 'Budget', minWidth: 220 },
        { key: 'period', label: 'Period', minWidth: 220 },
        { key: 'status', label: 'Status', minWidth: 120 },
        { key: 'total', label: 'Total', minWidth: 140, align: 'right' },
        { key: 'lines', label: 'Lines', minWidth: 90, align: 'right' },
        { key: 'remarks', label: 'Remarks', minWidth: 260 },
    ];

    return (
        <>
            <AppPage
                eyebrow="Accounting"
                title="Budgets"
                subtitle="Plan account-wise spending with live filters, clearer period visibility, and cleaner operational review."
                actions={[
                    <Button key="add" variant="contained" startIcon={<Add />} onClick={() => setOpenModal(true)}>
                        New Budget
                    </Button>,
                ]}
            >
                <Grid container spacing={2.25}>
                    <Grid item xs={12} md={3}><StatCard label="Budget Plans" value={totalBudgets} accent /></Grid>
                    <Grid item xs={12} md={3}><StatCard label="Active Budgets" value={activeBudgets} tone="light" /></Grid>
                    <Grid item xs={12} md={3}><StatCard label="Draft Budgets" value={draftBudgets} tone="muted" /></Grid>
                    <Grid item xs={12} md={3}><StatCard label="Visible Budgeted" value={Number(totalBudgeted || 0).toFixed(2)} tone="light" /></Grid>
                </Grid>

                {error ? (
                    <Alert severity="warning" variant="outlined">
                        {error}
                    </Alert>
                ) : null}

                <SurfaceCard title="Live Filters" subtitle="Results update automatically as you refine budget name, status, and budget period.">
                    <FilterToolbar onReset={resetFilters}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={4}>
                                <TextField
                                    label="Search budgets"
                                    value={localFilters.search}
                                    onChange={(event) => updateFilters({ search: event.target.value })}
                                    fullWidth
                                />
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <TextField
                                    select
                                    label="Status"
                                    value={localFilters.status}
                                    onChange={(event) => updateFilters({ status: event.target.value }, { immediate: true })}
                                    fullWidth
                                >
                                    <MenuItem value="">All</MenuItem>
                                    <MenuItem value="draft">Draft</MenuItem>
                                    <MenuItem value="active">Active</MenuItem>
                                    <MenuItem value="closed">Closed</MenuItem>
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={2.5}>
                                <TextField
                                    label="From"
                                    type="date"
                                    value={localFilters.from}
                                    onChange={(event) => updateFilters({ from: event.target.value }, { immediate: true })}
                                    InputLabelProps={{ shrink: true }}
                                    fullWidth
                                />
                            </Grid>
                            <Grid item xs={12} md={2.5}>
                                <TextField
                                    label="To"
                                    type="date"
                                    value={localFilters.to}
                                    onChange={(event) => updateFilters({ to: event.target.value }, { immediate: true })}
                                    InputLabelProps={{ shrink: true }}
                                    fullWidth
                                />
                            </Grid>
                        </Grid>
                    </FilterToolbar>
                </SurfaceCard>

                <SurfaceCard title="Budget Register" subtitle="Review budget periods, status, lines, and amounts using the same shared accounting table system.">
                    <AdminDataTable
                        columns={columns}
                        rows={rows}
                        pagination={budgets}
                        emptyMessage="No budgets created yet."
                        tableMinWidth={1080}
                        renderRow={(budget) => (
                            <TableRow key={budget.id} hover>
                                <TableCell sx={{ fontWeight: 700, color: 'text.primary' }}>{budget.name}</TableCell>
                                <TableCell>{budget.start_date} - {budget.end_date}</TableCell>
                                <TableCell>
                                    <Chip
                                        label={budget.status}
                                        size="small"
                                        color={budget.status === 'active' ? 'success' : budget.status === 'closed' ? 'default' : 'warning'}
                                        variant="outlined"
                                        sx={{ textTransform: 'capitalize' }}
                                    />
                                </TableCell>
                                <TableCell align="right">{Number(budget.total_amount || 0).toFixed(2)}</TableCell>
                                <TableCell align="right">{budget.lines?.length || 0}</TableCell>
                                <TableCell>{budget.remarks || '-'}</TableCell>
                            </TableRow>
                        )}
                    />
                </SurfaceCard>
            </AppPage>

            <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="md" fullWidth>
                <DialogTitle>Create Budget</DialogTitle>
                <form onSubmit={submit}>
                    <DialogContent>
                        <Grid container spacing={2} sx={{ mt: 0 }}>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    label="Budget Name"
                                    value={data.name}
                                    onChange={(event) => setData('name', event.target.value)}
                                    error={!!errors.name}
                                    helperText={errors.name}
                                    fullWidth
                                />
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <TextField
                                    label="Start Date"
                                    type="date"
                                    value={data.start_date}
                                    onChange={(event) => setData('start_date', event.target.value)}
                                    error={!!errors.start_date}
                                    helperText={errors.start_date}
                                    InputLabelProps={{ shrink: true }}
                                    fullWidth
                                />
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <TextField
                                    label="End Date"
                                    type="date"
                                    value={data.end_date}
                                    onChange={(event) => setData('end_date', event.target.value)}
                                    error={!!errors.end_date}
                                    helperText={errors.end_date}
                                    InputLabelProps={{ shrink: true }}
                                    fullWidth
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField
                                    select
                                    label="Status"
                                    value={data.status}
                                    onChange={(event) => setData('status', event.target.value)}
                                    error={!!errors.status}
                                    helperText={errors.status}
                                    fullWidth
                                >
                                    <MenuItem value="draft">Draft</MenuItem>
                                    <MenuItem value="active">Active</MenuItem>
                                    <MenuItem value="closed">Closed</MenuItem>
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={8}>
                                <TextField
                                    label="Remarks"
                                    value={data.remarks}
                                    onChange={(event) => setData('remarks', event.target.value)}
                                    multiline
                                    minRows={2}
                                    fullWidth
                                />
                            </Grid>
                        </Grid>

                        <Divider sx={{ my: 3 }} />

                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                Budget Lines
                            </Typography>
                            <Button size="small" onClick={addLine} startIcon={<Add />}>
                                Add Line
                            </Button>
                        </Box>

                        <Grid container spacing={2}>
                            {data.lines.map((line, index) => (
                                <React.Fragment key={`line-${index}`}>
                                    <Grid item xs={12} md={7}>
                                        <TextField
                                            select
                                            label="Account"
                                            value={line.account_id}
                                            onChange={(event) => updateLine(index, 'account_id', event.target.value)}
                                            error={!!errors[`lines.${index}.account_id`]}
                                            helperText={errors[`lines.${index}.account_id`]}
                                            fullWidth
                                        >
                                            {coaAccounts.map((account) => (
                                                <MenuItem key={account.id} value={account.id}>
                                                    {account.full_code} - {account.name}
                                                </MenuItem>
                                            ))}
                                        </TextField>
                                    </Grid>
                                    <Grid item xs={10} md={4}>
                                        <TextField
                                            label="Amount"
                                            type="number"
                                            inputProps={{ min: 0, step: '0.01' }}
                                            value={line.amount}
                                            onChange={(event) => updateLine(index, 'amount', event.target.value)}
                                            error={!!errors[`lines.${index}.amount`]}
                                            helperText={errors[`lines.${index}.amount`]}
                                            fullWidth
                                        />
                                    </Grid>
                                    <Grid item xs={2} md={1} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <IconButton color="error" onClick={() => removeLine(index)} disabled={data.lines.length === 1}>
                                            <DeleteOutline />
                                        </IconButton>
                                    </Grid>
                                </React.Fragment>
                            ))}
                        </Grid>

                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                                Total: {totalAmount.toFixed(2)}
                            </Typography>
                        </Box>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 2 }}>
                        <Button onClick={() => setOpenModal(false)}>Cancel</Button>
                        <Button type="submit" variant="contained" disabled={processing || data.lines.length === 0}>
                            Create Budget
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </>
    );
}
