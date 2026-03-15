import React from 'react';
import { router, useForm } from '@inertiajs/react';
import debounce from 'lodash.debounce';
import { Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Grid, MenuItem, TableCell, TableRow, TextField } from '@mui/material';
import AppPage from '@/components/App/ui/AppPage';
import AdminDataTable from '@/components/App/ui/AdminDataTable';
import FilterToolbar from '@/components/App/ui/FilterToolbar';
import StatCard from '@/components/App/ui/StatCard';
import SurfaceCard from '@/components/App/ui/SurfaceCard';

export default function Periods({ periods, filters = {}, error = null }) {
    const [open, setOpen] = React.useState(false);
    const rows = periods?.data || [];
    const [localFilters, setLocalFilters] = React.useState({
        status: filters?.status || '',
        per_page: filters?.per_page || periods?.per_page || 25,
        page: 1,
    });
    const filtersRef = React.useRef(localFilters);
    const { data, setData, post, processing, reset } = useForm({
        name: '',
        start_date: '',
        end_date: '',
    });

    const submitFilters = React.useCallback((nextFilters) => {
        const payload = {};

        if (nextFilters.status) payload.status = nextFilters.status;
        payload.per_page = nextFilters.per_page || 25;
        if (Number(nextFilters.page) > 1) payload.page = Number(nextFilters.page);

        router.get(route('accounting.periods.index'), payload, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    }, []);

    const debouncedSubmit = React.useMemo(() => debounce((nextFilters) => submitFilters(nextFilters), 250), [submitFilters]);

    React.useEffect(() => () => debouncedSubmit.cancel(), [debouncedSubmit]);

    React.useEffect(() => {
        const next = {
            status: filters?.status || '',
            per_page: filters?.per_page || periods?.per_page || 25,
            page: 1,
        };
        filtersRef.current = next;
        setLocalFilters(next);
    }, [filters?.per_page, filters?.status, periods?.per_page]);

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
            status: '',
            per_page: filtersRef.current.per_page || periods?.per_page || 25,
            page: 1,
        };
        debouncedSubmit.cancel();
        filtersRef.current = cleared;
        setLocalFilters(cleared);
        submitFilters(cleared);
    }, [debouncedSubmit, periods?.per_page, submitFilters]);

    const create = () => {
        post(route('accounting.periods.store'), {
            onSuccess: () => {
                reset();
                setOpen(false);
            },
        });
    };

    const openCount = rows.filter((period) => period.status === 'open').length;
    const closeReadyCount = rows.filter((period) => period.checklist?.can_close).length;
    const blockedCount = rows.filter((period) => !period.checklist?.can_close).length;

    const columns = [
        { key: 'period', label: 'Period', minWidth: 180 },
        { key: 'range', label: 'Date Range', minWidth: 220 },
        { key: 'status', label: 'Status', minWidth: 120 },
        { key: 'checklist', label: 'Checklist', minWidth: 420 },
        { key: 'action', label: 'Action', minWidth: 180, align: 'center' },
    ];

    return (
        <>
            <AppPage
                eyebrow="Accounting"
                title="Period Close & Locks"
                subtitle="Manage close periods, review blocking checklist items, and control when journal posting is locked or reopened."
                actions={[
                    <Button key="new" variant="contained" onClick={() => setOpen(true)}>
                        New Period
                    </Button>,
                ]}
            >
                <Grid container spacing={2.25}>
                    <Grid item xs={12} md={3}><StatCard label="Periods" value={periods?.total || rows.length} accent /></Grid>
                    <Grid item xs={12} md={3}><StatCard label="Open" value={openCount} tone="light" /></Grid>
                    <Grid item xs={12} md={3}><StatCard label="Close Ready" value={closeReadyCount} tone="light" /></Grid>
                    <Grid item xs={12} md={3}><StatCard label="Blocked" value={blockedCount} tone="muted" /></Grid>
                </Grid>

                {error ? <Alert severity="warning" variant="outlined">{error}</Alert> : null}

                <SurfaceCard title="Live Filters" subtitle="Narrow period close records by status with the same shared accounting filter behavior.">
                    <FilterToolbar onReset={resetFilters}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={4}>
                                <TextField
                                    select
                                    label="Status"
                                    value={localFilters.status}
                                    onChange={(event) => updateFilters({ status: event.target.value }, { immediate: true })}
                                    fullWidth
                                >
                                    <MenuItem value="">All</MenuItem>
                                    <MenuItem value="open">Open</MenuItem>
                                    <MenuItem value="closed">Closed</MenuItem>
                                </TextField>
                            </Grid>
                        </Grid>
                    </FilterToolbar>
                </SurfaceCard>

                <SurfaceCard title="Period Register" subtitle="Close checklist visibility with direct lock, force-close, and reopen actions from one standardized register.">
                    <AdminDataTable
                        columns={columns}
                        rows={rows}
                        pagination={periods}
                        emptyMessage="No accounting periods."
                        tableMinWidth={1240}
                        renderRow={(period) => (
                            <TableRow key={period.id} hover>
                                <TableCell sx={{ fontWeight: 700, color: 'text.primary' }}>{period.name}</TableCell>
                                <TableCell>{period.start_date} to {period.end_date}</TableCell>
                                <TableCell>
                                    <Chip
                                        size="small"
                                        variant="outlined"
                                        color={period.status === 'open' ? 'warning' : 'success'}
                                        label={period.status}
                                        sx={{ textTransform: 'capitalize' }}
                                    />
                                </TableCell>
                                <TableCell>
                                    Draft Journals: {period.checklist?.draft_journals || 0} | Failed Events: {period.checklist?.failed_events || 0} | Unreconciled Bank: {period.checklist?.unreconciled_bank || 0}
                                    <br />
                                    Draft Bills: {period.checklist?.draft_vendor_bills || 0} | Unbilled GRNs: {period.checklist?.unbilled_receipts || 0} | Open POs: {period.checklist?.open_purchase_orders || 0}
                                </TableCell>
                                <TableCell align="center">
                                    <Box sx={{ display: 'inline-flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
                                        {period.status === 'open' ? (
                                            <>
                                                <Button
                                                    size="small"
                                                    variant="outlined"
                                                    disabled={!period.checklist?.can_close}
                                                    onClick={() => router.post(route('accounting.periods.lock', period.id))}
                                                >
                                                    Lock
                                                </Button>
                                                <Button
                                                    size="small"
                                                    color="warning"
                                                    variant="outlined"
                                                    onClick={() => router.post(route('accounting.periods.lock', period.id), { force: true })}
                                                >
                                                    Force Lock
                                                </Button>
                                            </>
                                        ) : (
                                            <Button size="small" variant="outlined" onClick={() => router.post(route('accounting.periods.reopen', period.id))}>
                                                Reopen
                                            </Button>
                                        )}
                                    </Box>
                                </TableCell>
                            </TableRow>
                        )}
                    />
                </SurfaceCard>
            </AppPage>

            <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Create Accounting Period</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 0 }}>
                        <Grid item xs={12}>
                            <TextField label="Period Name" value={data.name} onChange={(event) => setData('name', event.target.value)} fullWidth />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField label="Start Date" type="date" value={data.start_date} onChange={(event) => setData('start_date', event.target.value)} InputLabelProps={{ shrink: true }} fullWidth />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField label="End Date" type="date" value={data.end_date} onChange={(event) => setData('end_date', event.target.value)} InputLabelProps={{ shrink: true }} fullWidth />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)}>Cancel</Button>
                    <Button variant="contained" disabled={processing} onClick={create}>Create</Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
