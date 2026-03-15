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
    Grid,
    MenuItem,
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

export default function Reconciliation({ sessions, paymentAccounts = [], filters = {}, activeSession, bookSnapshot, error = null }) {
    const [open, setOpen] = React.useState(false);
    const list = sessions?.data || [];
    const activeLines = activeSession?.lines || [];
    const [localFilters, setLocalFilters] = React.useState({
        payment_account_id: filters?.payment_account_id || '',
        status: filters?.status || '',
        session_id: filters?.session_id || '',
        per_page: filters?.per_page || sessions?.per_page || 25,
        page: 1,
    });
    const filtersRef = React.useRef(localFilters);
    const { data, setData, post, processing, reset } = useForm({
        payment_account_id: '',
        statement_start_date: '',
        statement_end_date: '',
        statement_opening_balance: '',
        statement_closing_balance: '',
        notes: '',
        statement_file: null,
        lines: [],
    });

    const submitFilters = React.useCallback((nextFilters) => {
        const payload = {};

        if (nextFilters.payment_account_id) payload.payment_account_id = nextFilters.payment_account_id;
        if (nextFilters.status) payload.status = nextFilters.status;
        if (nextFilters.session_id) payload.session_id = nextFilters.session_id;
        payload.per_page = nextFilters.per_page || 25;
        if (Number(nextFilters.page) > 1) payload.page = Number(nextFilters.page);

        router.get(route('accounting.bank-reconciliation.index'), payload, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    }, []);

    const debouncedSubmit = React.useMemo(() => debounce((nextFilters) => submitFilters(nextFilters), 250), [submitFilters]);

    React.useEffect(() => () => debouncedSubmit.cancel(), [debouncedSubmit]);

    React.useEffect(() => {
        const next = {
            payment_account_id: filters?.payment_account_id || '',
            status: filters?.status || '',
            session_id: filters?.session_id || '',
            per_page: filters?.per_page || sessions?.per_page || 25,
            page: 1,
        };
        filtersRef.current = next;
        setLocalFilters(next);
    }, [filters?.payment_account_id, filters?.per_page, filters?.session_id, filters?.status, sessions?.per_page]);

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
            payment_account_id: '',
            status: '',
            session_id: '',
            per_page: filtersRef.current.per_page || sessions?.per_page || 25,
            page: 1,
        };
        debouncedSubmit.cancel();
        filtersRef.current = cleared;
        setLocalFilters(cleared);
        submitFilters(cleared);
    }, [debouncedSubmit, sessions?.per_page, submitFilters]);

    const createSession = () => {
        post(route('accounting.bank-reconciliation.store'), {
            forceFormData: true,
            onSuccess: () => {
                reset();
                setOpen(false);
            },
        });
    };

    const reconciledCount = list.filter((session) => session.status === 'reconciled').length;
    const draftCount = list.filter((session) => session.status === 'draft').length;
    const visibleDifference = list.reduce((sum, session) => sum + Number(session.difference_amount || 0), 0);

    const sessionColumns = [
        { key: 'account', label: 'Account', minWidth: 200 },
        { key: 'period', label: 'Period', minWidth: 220 },
        { key: 'status', label: 'Status', minWidth: 120 },
        { key: 'statement', label: 'Statement Closing', minWidth: 150, align: 'right' },
        { key: 'book', label: 'Book Closing', minWidth: 140, align: 'right' },
        { key: 'difference', label: 'Difference', minWidth: 130, align: 'right' },
        { key: 'action', label: 'Action', minWidth: 120, align: 'center' },
    ];

    const lineColumns = [
        { key: 'date', label: 'Date', minWidth: 120 },
        { key: 'reference', label: 'Reference', minWidth: 140 },
        { key: 'description', label: 'Description', minWidth: 240 },
        { key: 'direction', label: 'Direction', minWidth: 120 },
        { key: 'amount', label: 'Amount', minWidth: 120, align: 'right' },
        { key: 'status', label: 'Status', minWidth: 120 },
        { key: 'matched', label: 'Matched Ref', minWidth: 180 },
    ];

    return (
        <>
            <AppPage
                eyebrow="Accounting"
                title="Bank Reconciliation"
                subtitle="Track bank statement sessions, compare book balances, and move unreconciled cash activity toward close readiness."
                actions={[
                    <Button key="new" variant="contained" onClick={() => setOpen(true)}>
                        New Session
                    </Button>,
                ]}
            >
                <Grid container spacing={2.25}>
                    <Grid item xs={12} md={3}><StatCard label="Sessions" value={sessions?.total || list.length} accent /></Grid>
                    <Grid item xs={12} md={3}><StatCard label="Reconciled" value={reconciledCount} tone="light" /></Grid>
                    <Grid item xs={12} md={3}><StatCard label="Draft" value={draftCount} tone="muted" /></Grid>
                    <Grid item xs={12} md={3}><StatCard label="Visible Difference" value={visibleDifference.toFixed(2)} tone="light" /></Grid>
                </Grid>

                {error ? <Alert severity="warning" variant="outlined">{error}</Alert> : null}

                <SurfaceCard title="Live Filters" subtitle="Filter sessions by bank account, reconciliation state, or jump directly into an existing session.">
                    <FilterToolbar onReset={resetFilters}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={4}>
                                <TextField
                                    select
                                    label="Bank Account"
                                    value={localFilters.payment_account_id}
                                    onChange={(event) => updateFilters({ payment_account_id: event.target.value }, { immediate: true })}
                                    fullWidth
                                >
                                    <MenuItem value="">All accounts</MenuItem>
                                    {paymentAccounts.map((account) => (
                                        <MenuItem key={account.id} value={account.id}>{account.name}</MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <TextField
                                    select
                                    label="Status"
                                    value={localFilters.status}
                                    onChange={(event) => updateFilters({ status: event.target.value }, { immediate: true })}
                                    fullWidth
                                >
                                    <MenuItem value="">All statuses</MenuItem>
                                    <MenuItem value="draft">Draft</MenuItem>
                                    <MenuItem value="reconciled">Reconciled</MenuItem>
                                    <MenuItem value="locked">Locked</MenuItem>
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={5}>
                                <TextField
                                    select
                                    label="Open Session"
                                    value={localFilters.session_id}
                                    onChange={(event) => updateFilters({ session_id: event.target.value }, { immediate: true })}
                                    fullWidth
                                >
                                    <MenuItem value="">No session selected</MenuItem>
                                    {list.map((session) => (
                                        <MenuItem key={session.id} value={session.id}>
                                            {session.payment_account?.name} · {session.statement_end_date}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                        </Grid>
                    </FilterToolbar>
                </SurfaceCard>

                <SurfaceCard title="Reconciliation Sessions" subtitle="Statement sessions with difference visibility and direct drill-in to auto-match and review.">
                    <AdminDataTable
                        columns={sessionColumns}
                        rows={list}
                        pagination={sessions}
                        emptyMessage="No reconciliation sessions yet."
                        tableMinWidth={1080}
                        renderRow={(session) => (
                            <TableRow key={session.id} hover>
                                <TableCell sx={{ fontWeight: 700, color: 'text.primary' }}>{session.payment_account?.name}</TableCell>
                                <TableCell>{session.statement_start_date} to {session.statement_end_date}</TableCell>
                                <TableCell>
                                    <Chip
                                        size="small"
                                        variant="outlined"
                                        color={session.status === 'reconciled' ? 'success' : session.status === 'locked' ? 'default' : 'warning'}
                                        label={session.status}
                                        sx={{ textTransform: 'capitalize' }}
                                    />
                                </TableCell>
                                <TableCell align="right">{Number(session.statement_closing_balance || 0).toFixed(2)}</TableCell>
                                <TableCell align="right">{Number(session.book_closing_balance || 0).toFixed(2)}</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700 }}>{Number(session.difference_amount || 0).toFixed(2)}</TableCell>
                                <TableCell align="center">
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        onClick={() => updateFilters({ session_id: session.id }, { immediate: true })}
                                    >
                                        Open
                                    </Button>
                                </TableCell>
                            </TableRow>
                        )}
                    />
                </SurfaceCard>

                {activeSession ? (
                    <SurfaceCard
                        title={`Session #${activeSession.id}`}
                        subtitle={`Status: ${activeSession.status}. Review imported statement lines and compare with system movement before final close.`}
                        actions={(
                            <Button
                                variant="outlined"
                                onClick={() => router.post(route('accounting.bank-reconciliation.auto-match', activeSession.id))}
                            >
                                Auto Match
                            </Button>
                        )}
                    >
                        {bookSnapshot ? (
                            <Grid container spacing={2} sx={{ mb: 2.5 }}>
                                <Grid item xs={12} md={3}><StatCard label="Book Opening" value={Number(bookSnapshot.opening_balance || 0).toFixed(2)} tone="light" /></Grid>
                                <Grid item xs={12} md={3}><StatCard label="Inflows" value={Number(bookSnapshot.period_inflows || 0).toFixed(2)} tone="light" /></Grid>
                                <Grid item xs={12} md={3}><StatCard label="Outflows" value={Number(bookSnapshot.period_outflows || 0).toFixed(2)} tone="muted" /></Grid>
                                <Grid item xs={12} md={3}><StatCard label="Book Closing" value={Number(bookSnapshot.closing_balance || 0).toFixed(2)} accent /></Grid>
                            </Grid>
                        ) : null}

                        <AdminDataTable
                            columns={lineColumns}
                            rows={activeLines}
                            pagination={null}
                            emptyMessage="No statement lines added."
                            tableMinWidth={1040}
                            renderRow={(line) => (
                                <TableRow key={line.id} hover>
                                    <TableCell>{line.txn_date}</TableCell>
                                    <TableCell>{line.reference_no || '-'}</TableCell>
                                    <TableCell>{line.description || '-'}</TableCell>
                                    <TableCell sx={{ textTransform: 'capitalize' }}>{line.direction}</TableCell>
                                    <TableCell align="right">{Number(line.amount || 0).toFixed(2)}</TableCell>
                                    <TableCell>
                                        <Chip
                                            size="small"
                                            variant="outlined"
                                            color={line.status === 'matched' ? 'success' : line.status === 'adjustment' ? 'primary' : 'warning'}
                                            label={line.status}
                                            sx={{ textTransform: 'capitalize' }}
                                        />
                                    </TableCell>
                                    <TableCell>{line.matched_reference || '-'}</TableCell>
                                </TableRow>
                            )}
                        />
                    </SurfaceCard>
                ) : null}
            </AppPage>

            <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>Create Reconciliation Session</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 0 }}>
                        <Grid item xs={12} md={4}>
                            <TextField
                                select
                                label="Bank Account"
                                value={data.payment_account_id}
                                onChange={(event) => setData('payment_account_id', event.target.value)}
                                fullWidth
                            >
                                {paymentAccounts.map((account) => (
                                    <MenuItem key={account.id} value={account.id}>{account.name}</MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TextField
                                label="Statement Start"
                                type="date"
                                value={data.statement_start_date}
                                onChange={(event) => setData('statement_start_date', event.target.value)}
                                InputLabelProps={{ shrink: true }}
                                fullWidth
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TextField
                                label="Statement End"
                                type="date"
                                value={data.statement_end_date}
                                onChange={(event) => setData('statement_end_date', event.target.value)}
                                InputLabelProps={{ shrink: true }}
                                fullWidth
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                label="Statement Opening Balance"
                                type="number"
                                value={data.statement_opening_balance}
                                onChange={(event) => setData('statement_opening_balance', event.target.value)}
                                fullWidth
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                label="Statement Closing Balance"
                                type="number"
                                value={data.statement_closing_balance}
                                onChange={(event) => setData('statement_closing_balance', event.target.value)}
                                fullWidth
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                label="Notes"
                                value={data.notes}
                                onChange={(event) => setData('notes', event.target.value)}
                                fullWidth
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Button component="label" variant="outlined">
                                Upload Statement CSV
                                <input
                                    hidden
                                    type="file"
                                    accept=".csv,text/csv,text/plain"
                                    onChange={(event) => setData('statement_file', event.target.files?.[0] || null)}
                                />
                            </Button>
                            <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                                Format: `date,reference,description,direction,amount` or `date,reference,description,debit,credit`
                            </Typography>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={createSession} disabled={processing}>Create</Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
