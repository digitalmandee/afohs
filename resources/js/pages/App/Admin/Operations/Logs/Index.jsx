import React from 'react';
import { Head, router } from '@inertiajs/react';
import {
    Alert,
    Box,
    Chip,
    Grid,
    MenuItem,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from '@mui/material';
import AppPage from '@/components/App/ui/AppPage';
import FilterToolbar from '@/components/App/ui/FilterToolbar';
import SurfaceCard from '@/components/App/ui/SurfaceCard';
import StatCard from '@/components/App/ui/StatCard';

const DEFAULT_FILTERS = {
    module: '',
    status: '',
    severity: '',
    entity_type: '',
    entity_id: '',
    correlation_id: '',
    from: '',
    to: '',
    search: '',
    per_page: 25,
};

export default function OperationalLogsIndex({ logs, filters, options, summary }) {
    const [localFilters, setLocalFilters] = React.useState({ ...DEFAULT_FILTERS, ...(filters || {}) });

    const updateFilter = (key, value) => {
        setLocalFilters((previous) => ({ ...previous, [key]: value }));
    };

    const applyFilters = () => {
        router.get(route('admin.operations.logs.index'), { ...localFilters, page: 1 }, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const resetFilters = () => {
        setLocalFilters(DEFAULT_FILTERS);
        router.get(route('admin.operations.logs.index'), { ...DEFAULT_FILTERS, page: 1 }, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    return (
        <>
            <Head title="Operation Logs" />
            <AppPage
                eyebrow="OPERATIONS"
                title="Operation Logs"
                subtitle="Trace failures and posting lifecycle with correlation IDs across accounting, procurement, and inventory."
                compact
            >
                <Box sx={{ display: 'grid', gap: 1.2, gridTemplateColumns: { xs: '1fr', md: 'repeat(4, minmax(0, 1fr))' } }}>
                    <StatCard label="Total" value={summary?.total ?? 0} compact />
                    <StatCard label="Failed" value={summary?.failed ?? 0} compact />
                    <StatCard label="Critical" value={summary?.critical ?? 0} compact />
                    <StatCard label="Warning" value={summary?.warning ?? 0} compact />
                </Box>

                <FilterToolbar
                    title="Filters"
                    subtitle="Filter logs by module, severity, entity, date range, and correlation ID."
                    onReset={resetFilters}
                    onApply={applyFilters}
                    lowChrome
                    compact
                >
                    <Grid container spacing={1}>
                        <Grid item xs={12} md={3}>
                            <TextField
                                size="small"
                                label="Module"
                                select
                                value={localFilters.module ?? ''}
                                onChange={(event) => updateFilter('module', event.target.value)}
                                fullWidth
                            >
                                <MenuItem value="">All</MenuItem>
                                {(options?.modules || []).map((option) => (
                                    <MenuItem key={option} value={option}>{option}</MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <TextField
                                size="small"
                                label="Status"
                                select
                                value={localFilters.status ?? ''}
                                onChange={(event) => updateFilter('status', event.target.value)}
                                fullWidth
                            >
                                <MenuItem value="">All</MenuItem>
                                {(options?.statuses || []).map((option) => (
                                    <MenuItem key={option} value={option}>{option}</MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <TextField
                                size="small"
                                label="Severity"
                                select
                                value={localFilters.severity ?? ''}
                                onChange={(event) => updateFilter('severity', event.target.value)}
                                fullWidth
                            >
                                <MenuItem value="">All</MenuItem>
                                {(options?.severities || []).map((option) => (
                                    <MenuItem key={option} value={option}>{option}</MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={2.5}>
                            <TextField
                                size="small"
                                label="Correlation ID"
                                value={localFilters.correlation_id ?? ''}
                                onChange={(event) => updateFilter('correlation_id', event.target.value)}
                                fullWidth
                            />
                        </Grid>
                        <Grid item xs={12} md={2.5}>
                            <TextField
                                size="small"
                                label="Search action/message"
                                value={localFilters.search ?? ''}
                                onChange={(event) => updateFilter('search', event.target.value)}
                                fullWidth
                            />
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <TextField
                                size="small"
                                label="From"
                                type="date"
                                InputLabelProps={{ shrink: true }}
                                value={localFilters.from ?? ''}
                                onChange={(event) => updateFilter('from', event.target.value)}
                                fullWidth
                            />
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <TextField
                                size="small"
                                label="To"
                                type="date"
                                InputLabelProps={{ shrink: true }}
                                value={localFilters.to ?? ''}
                                onChange={(event) => updateFilter('to', event.target.value)}
                                fullWidth
                            />
                        </Grid>
                    </Grid>
                </FilterToolbar>

                <SurfaceCard compact lowChrome>
                    {logs?.data?.length ? null : (
                        <Alert severity="info" sx={{ mb: 1 }}>
                            No operational logs found for current filters.
                        </Alert>
                    )}
                    <TableContainer component={Paper} sx={{ borderRadius: 2, border: '1px solid rgba(215,226,237,0.95)' }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Date</TableCell>
                                    <TableCell>Module</TableCell>
                                    <TableCell>Action</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Entity</TableCell>
                                    <TableCell>Message</TableCell>
                                    <TableCell>Correlation</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {(logs?.data || []).map((row) => (
                                    <TableRow key={row.id} hover>
                                        <TableCell>{row.created_at}</TableCell>
                                        <TableCell>
                                            <Chip size="small" label={row.module || '-'} />
                                        </TableCell>
                                        <TableCell sx={{ maxWidth: 280 }}>
                                            <Typography variant="body2" sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {row.action}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                size="small"
                                                label={`${row.status} / ${row.severity}`}
                                                color={row.status === 'failed' ? 'error' : 'default'}
                                                variant={row.status === 'failed' ? 'filled' : 'outlined'}
                                            />
                                        </TableCell>
                                        <TableCell>{row.entity_type && row.entity_id ? `${row.entity_type}#${row.entity_id}` : '-'}</TableCell>
                                        <TableCell sx={{ maxWidth: 420 }}>
                                            <Typography variant="body2" sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {row.message}
                                            </Typography>
                                        </TableCell>
                                        <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{row.correlation_id || '-'}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </SurfaceCard>
            </AppPage>
        </>
    );
}

