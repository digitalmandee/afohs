import React from 'react';
import { router } from '@inertiajs/react';
import debounce from 'lodash.debounce';
import { Alert, Button, Chip, Grid, MenuItem, TableCell, TableRow, TextField } from '@mui/material';
import AppPage from '@/components/App/ui/AppPage';
import AdminDataTable from '@/components/App/ui/AdminDataTable';
import FilterToolbar from '@/components/App/ui/FilterToolbar';
import StatCard from '@/components/App/ui/StatCard';
import SurfaceCard from '@/components/App/ui/SurfaceCard';
import useFilterLoadingState from '@/hooks/useFilterLoadingState';

export default function Deliveries({ deliveries, filters, summary = {}, error = null }) {
    const rows = deliveries?.data || [];
    const [localFilters, setLocalFilters] = React.useState({
        status: filters?.status || '',
        channel: filters?.channel || '',
        search: filters?.search || '',
        per_page: deliveries?.per_page || 25,
        page: 1,
    });
    const filtersRef = React.useRef(localFilters);
    const { loading, beginLoading } = useFilterLoadingState([
        deliveries?.per_page,
        filters?.channel,
        filters?.search,
        filters?.status,
        rows.length,
        error,
    ]);

    const submitFilters = React.useCallback((nextFilters) => {
        beginLoading();
        const payload = {};
        if (nextFilters.status) payload.status = nextFilters.status;
        if (nextFilters.channel) payload.channel = nextFilters.channel;
        if (nextFilters.search?.trim()) payload.search = nextFilters.search.trim();
        payload.per_page = nextFilters.per_page || deliveries?.per_page || 25;
        if (Number(nextFilters.page) > 1) payload.page = Number(nextFilters.page);

        router.get(route('accounting.journals.deliveries'), payload, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    }, [beginLoading, deliveries?.per_page]);

    const debouncedSubmit = React.useMemo(() => debounce((next) => submitFilters(next), 300), [submitFilters]);
    React.useEffect(() => () => debouncedSubmit.cancel(), [debouncedSubmit]);

    React.useEffect(() => {
        const next = {
            status: filters?.status || '',
            channel: filters?.channel || '',
            search: filters?.search || '',
            per_page: deliveries?.per_page || 25,
            page: 1,
        };
        filtersRef.current = next;
        setLocalFilters(next);
    }, [deliveries?.per_page, filters?.channel, filters?.search, filters?.status]);

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
            channel: '',
            search: '',
            per_page: filtersRef.current.per_page || deliveries?.per_page || 25,
            page: 1,
        };
        debouncedSubmit.cancel();
        filtersRef.current = cleared;
        setLocalFilters(cleared);
        submitFilters(cleared);
    }, [debouncedSubmit, deliveries?.per_page, submitFilters]);

    const columns = [
        { key: 'created_at', label: 'At', minWidth: 160 },
        { key: 'entry', label: 'Entry', minWidth: 120 },
        { key: 'user', label: 'User', minWidth: 180 },
        { key: 'recipient', label: 'Recipient', minWidth: 220 },
        { key: 'channel', label: 'Channel', minWidth: 120 },
        { key: 'status', label: 'Status', minWidth: 110 },
        { key: 'attempts', label: 'Attempts', minWidth: 100, align: 'right' },
        { key: 'response', label: 'Provider Response', minWidth: 260 },
        { key: 'actions', label: 'Actions', minWidth: 140, align: 'right' },
    ];

    return (
        <AppPage
            eyebrow="Accounting"
            title="Reminder Delivery Log"
            subtitle="Track journal approval reminders, delivery failures, and retries from the same shared register system as the rest of accounting."
            actions={[
                <Button
                    key="retry-failed"
                    variant="outlined"
                    onClick={() => router.post(route('accounting.journals.deliveries.retry-failed'))}
                >
                    Retry Failed
                </Button>,
            ]}
        >
            {error ? <Alert severity="warning" variant="outlined">{error}</Alert> : null}

            <Grid container spacing={2.25}>
                <Grid item xs={12} md={4}><StatCard label="Total" value={summary?.total || 0} accent /></Grid>
                <Grid item xs={12} md={4}><StatCard label="Sent" value={summary?.sent || 0} tone="light" /></Grid>
                <Grid item xs={12} md={4}><StatCard label="Failed" value={summary?.failed || 0} tone="muted" /></Grid>
            </Grid>

            <SurfaceCard title="Live Filters" subtitle="Filter by delivery status, channel, or recipient/provider response with live updates.">
                <FilterToolbar
                    onReset={resetFilters}
                    onApply={() => submitFilters(localFilters)}
                    lowChrome
                    title="Filters"
                    subtitle="Refine delivery queue by channel, status, and retry state."
                >
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={3}>
                            <TextField
                                select
                                label="Status"
                                value={localFilters.status}
                                onChange={(event) => updateFilters({ status: event.target.value }, { immediate: true })}
                                fullWidth
                            >
                                <MenuItem value="">All</MenuItem>
                                <MenuItem value="sent">Sent</MenuItem>
                                <MenuItem value="failed">Failed</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <TextField
                                select
                                label="Channel"
                                value={localFilters.channel}
                                onChange={(event) => updateFilters({ channel: event.target.value }, { immediate: true })}
                                fullWidth
                            >
                                <MenuItem value="">All</MenuItem>
                                <MenuItem value="database">Database</MenuItem>
                                <MenuItem value="mail">Email</MenuItem>
                                <MenuItem value="whatsapp">WhatsApp</MenuItem>
                                <MenuItem value="sms">SMS</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                label="Recipient or provider response"
                                value={localFilters.search}
                                onChange={(event) => updateFilters({ search: event.target.value })}
                                fullWidth
                            />
                        </Grid>
                    </Grid>
                </FilterToolbar>
            </SurfaceCard>

            <SurfaceCard title="Delivery Register" subtitle="Shared reminder-delivery table with warning fallback instead of a broken or empty route.">
                <AdminDataTable
                    columns={columns}
                    rows={rows}
                    loading={loading}
                    pagination={deliveries}
                    error={error}
                    emptyMessage="No delivery logs found."
                    tableMinWidth={1320}
                    renderRow={(row) => (
                        <TableRow key={row.id} hover>
                            <TableCell>{row.created_at || '-'}</TableCell>
                            <TableCell>{row.journal_entry?.entry_no || '-'}</TableCell>
                            <TableCell>{row.user?.name || '-'}</TableCell>
                            <TableCell>{row.recipient || '-'}</TableCell>
                            <TableCell sx={{ textTransform: 'capitalize' }}>{row.channel || '-'}</TableCell>
                            <TableCell>
                                <Chip
                                    size="small"
                                    variant="outlined"
                                    color={row.status === 'sent' ? 'success' : 'error'}
                                    label={row.status || '-'}
                                />
                            </TableCell>
                            <TableCell align="right">{row.attempts || 0}</TableCell>
                            <TableCell>{row.provider_response ? String(row.provider_response).slice(0, 120) : '-'}</TableCell>
                            <TableCell align="right">
                                {row.status === 'failed' && (row.channel === 'whatsapp' || row.channel === 'sms') ? (
                                    <Button size="small" variant="outlined" onClick={() => router.post(route('accounting.journals.deliveries.retry', row.id))}>
                                        Retry
                                    </Button>
                                ) : (
                                    <Button size="small" variant="outlined" disabled>
                                        N/A
                                    </Button>
                                )}
                            </TableCell>
                        </TableRow>
                    )}
                />
            </SurfaceCard>
        </AppPage>
    );
}
