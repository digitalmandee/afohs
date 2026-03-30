import React from 'react';
import { Link, router, useForm } from '@inertiajs/react';
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
    Grid,
    Stack,
    TableCell,
    TableRow,
    TextField,
    Typography,
} from '@mui/material';
import AppPage from '@/components/App/ui/AppPage';
import AdminDataTable from '@/components/App/ui/AdminDataTable';
import FilterToolbar from '@/components/App/ui/FilterToolbar';
import StatCard from '@/components/App/ui/StatCard';
import SurfaceCard from '@/components/App/ui/SurfaceCard';
import useFilterLoadingState from '@/hooks/useFilterLoadingState';
import { formatCurrency, formatCount } from '@/lib/formatting';

export default function Approvals({ entries, filters = {}, approvalPolicy, summary = {} }) {
    const rows = entries?.data || [];
    const [rejectId, setRejectId] = React.useState(null);
    const [localFilters, setLocalFilters] = React.useState({
        search: filters?.search || '',
        page: 1,
    });
    const filtersRef = React.useRef(localFilters);
    const { loading, beginLoading } = useFilterLoadingState([
        entries?.current_page,
        entries?.total,
        filters?.search,
        rows.length,
    ]);
    const { data, setData, post, processing, reset } = useForm({ remarks: '' });

    const submitFilters = React.useCallback((nextFilters) => {
        beginLoading();
        const payload = {};
        if (nextFilters.search?.trim()) payload.search = nextFilters.search.trim();
        if (Number(nextFilters.page) > 1) payload.page = Number(nextFilters.page);

        router.get(route('accounting.journals.approvals'), payload, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    }, [beginLoading]);

    const debouncedSubmit = React.useMemo(() => debounce((nextFilters) => submitFilters(nextFilters), 300), [submitFilters]);

    React.useEffect(() => () => debouncedSubmit.cancel(), [debouncedSubmit]);

    React.useEffect(() => {
        const next = {
            search: filters?.search || '',
            page: 1,
        };
        filtersRef.current = next;
        setLocalFilters(next);
    }, [filters?.search]);

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
        const cleared = { search: '', page: 1 };
        debouncedSubmit.cancel();
        filtersRef.current = cleared;
        setLocalFilters(cleared);
        submitFilters(cleared);
    }, [debouncedSubmit, submitFilters]);

    const onReject = (event) => {
        event.preventDefault();
        if (!rejectId) {
            return;
        }

        post(route('accounting.journals.reject', rejectId), {
            onSuccess: () => {
                reset();
                setRejectId(null);
            },
        });
    };

    const columns = [
        { key: 'entry', label: 'Entry', minWidth: 140 },
        { key: 'date', label: 'Date', minWidth: 120 },
        { key: 'description', label: 'Description', minWidth: 260 },
        { key: 'amount', label: 'Amount', minWidth: 140, align: 'right' },
        { key: 'step', label: 'Next Step', minWidth: 190 },
        { key: 'sla', label: 'SLA', minWidth: 120 },
        { key: 'reminders', label: 'Reminders', minWidth: 140 },
        { key: 'actions', label: 'Actions', minWidth: 280, align: 'right' },
    ];

    return (
        <AppPage
            eyebrow="Accounting"
            title="Journal Approvals"
            subtitle="Review pending journal approvals, SLA pressure, and reminder activity inside the shared accounting workspace."
            actions={[
                <Button
                    key="remind-all"
                    variant="outlined"
                    onClick={() => router.post(route('accounting.journals.remind-overdue'))}
                >
                    Remind All Overdue
                </Button>,
            ]}
        >
            <Alert severity={approvalPolicy?.is_active ? 'info' : 'warning'} variant="outlined">
                Active policy: {approvalPolicy?.is_active ? 'Enabled' : 'Disabled'} | Maker-checker: {approvalPolicy?.enforce_maker_checker ? 'On' : 'Off'} | SLA: {approvalPolicy?.sla_hours ? `${approvalPolicy.sla_hours}h` : 'Not set'}
            </Alert>

            <Grid container spacing={2.25}>
                <Grid item xs={12} md={4}><StatCard label="Pending" value={formatCount(summary?.pending)} accent /></Grid>
                <Grid item xs={12} md={4}><StatCard label="Overdue" value={formatCount(summary?.overdue)} tone="muted" /></Grid>
                <Grid item xs={12} md={4}><StatCard label="Current Search" value={localFilters.search?.trim() || 'All journals'} tone="light" /></Grid>
            </Grid>

            <SurfaceCard title="Live Filters" subtitle="Search by journal number or description with the same live filter behavior used across accounting registers.">
                <FilterToolbar onReset={resetFilters}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                            <TextField
                                label="Search entry no / description"
                                value={localFilters.search}
                                onChange={(event) => updateFilters({ search: event.target.value })}
                                fullWidth
                            />
                        </Grid>
                    </Grid>
                </FilterToolbar>
            </SurfaceCard>

            <SurfaceCard title="Approval Inbox" subtitle="Visible approval register with loading, empty-state feedback, and all review actions kept intact.">
                <AdminDataTable
                    columns={columns}
                    rows={rows}
                    loading={loading}
                    pagination={entries}
                    emptyMessage="No pending approvals."
                    tableMinWidth={1320}
                    renderRow={(entry) => (
                        <TableRow key={entry.id} hover>
                            <TableCell sx={{ fontWeight: 700, color: 'text.primary' }}>{entry.entry_no}</TableCell>
                            <TableCell>{entry.entry_date || '-'}</TableCell>
                            <TableCell>{entry.description || '-'}</TableCell>
                            <TableCell align="right">{formatCurrency(entry.amount)}</TableCell>
                            <TableCell>{entry.next_step ? `${entry.next_step.name} (${entry.next_step.role_name || 'any'})` : '-'}</TableCell>
                            <TableCell>
                                {entry.age_hours !== null ? (
                                    <Chip
                                        size="small"
                                        color={entry.is_overdue ? 'error' : 'default'}
                                        variant="outlined"
                                        label={`${entry.age_hours}h`}
                                    />
                                ) : '-'}
                            </TableCell>
                            <TableCell>
                                <Stack spacing={0.35}>
                                    <Typography>{entry.reminder_count || 0}</Typography>
                                    {entry.last_reminder_at ? (
                                        <Typography variant="body2" color="text.secondary">
                                            {entry.last_reminder_at}
                                        </Typography>
                                    ) : null}
                                </Stack>
                            </TableCell>
                            <TableCell align="right">
                                <Stack direction="row" spacing={1} justifyContent="flex-end" flexWrap="wrap" useFlexGap>
                                    <Button size="small" color="success" variant="outlined" onClick={() => router.post(route('accounting.journals.approve', entry.id))}>
                                        Approve
                                    </Button>
                                    <Button size="small" color="error" variant="outlined" onClick={() => setRejectId(entry.id)}>
                                        Reject
                                    </Button>
                                    <Button size="small" variant="outlined" onClick={() => router.post(route('accounting.journals.remind', entry.id))}>
                                        Remind
                                    </Button>
                                    <Button size="small" variant="outlined" component={Link} href={route('accounting.journals.show', entry.id)}>
                                        Open
                                    </Button>
                                </Stack>
                            </TableCell>
                        </TableRow>
                    )}
                />
            </SurfaceCard>

            <Dialog open={Boolean(rejectId)} onClose={() => setRejectId(null)} maxWidth="sm" fullWidth>
                <DialogTitle>Reject Journal</DialogTitle>
                <form onSubmit={onReject}>
                    <DialogContent>
                        <TextField
                            label="Remarks"
                            value={data.remarks}
                            onChange={(event) => setData('remarks', event.target.value)}
                            fullWidth
                        />
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 2 }}>
                        <Button onClick={() => setRejectId(null)}>Cancel</Button>
                        <Button type="submit" color="error" variant="contained" disabled={processing}>
                            Reject
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </AppPage>
    );
}
