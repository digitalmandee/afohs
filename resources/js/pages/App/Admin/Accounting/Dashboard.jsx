import React from 'react';
import { Link, router } from '@inertiajs/react';
import { Box, Button, Chip, Grid, MenuItem, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material';
import Pagination from '@/components/Pagination';
import AppPage from '@/components/App/ui/AppPage';
import SurfaceCard from '@/components/App/ui/SurfaceCard';
import StatCard from '@/components/App/ui/StatCard';

export default function Dashboard({ stats, latestTransactions, transactionFilters, moduleOptions }) {
    const recentEntries = stats?.recent_entries || [];
    const latestRows = latestTransactions?.data || [];
    const entryMix = stats?.entry_mix || [];
    const ruleCoverage = stats?.rule_coverage || { expected: [], active: [], missing: [] };
    const exceptions = stats?.exceptions || { failed_postings: 0, pending_postings: 0, recent_failures: [] };
    const [filters, setFilters] = React.useState({
        search: transactionFilters?.search || '',
        status: transactionFilters?.status || '',
        module_type: transactionFilters?.module_type || '',
        from: transactionFilters?.from || '',
        to: transactionFilters?.to || '',
    });

    const applyFilters = () => {
        router.get(route('accounting.dashboard'), filters, { preserveState: true, preserveScroll: true });
    };

    const resetFilters = () => {
        const cleared = { search: '', status: '', module_type: '', from: '', to: '' };
        setFilters(cleared);
        router.get(route('accounting.dashboard'), cleared, { preserveState: true, preserveScroll: true });
    };

    return (
        <AppPage
            eyebrow="Finance Control"
            title="Accounting Dashboard"
            subtitle="Track receivables, payables, ledger activity, posting coverage, and exception health from a single control surface."
            actions={[
                <Button key="coa" component={Link} href={route('accounting.coa.index')} variant="contained">
                    Chart of Accounts
                </Button>,
                <Button key="gl" component={Link} href={route('accounting.general-ledger')} variant="outlined">
                    General Ledger
                </Button>,
            ]}
        >
            <Grid container spacing={2.25}>
                <Grid item xs={12} md={3}><StatCard label="Total Accounts" value={stats.total_accounts} accent /></Grid>
                <Grid item xs={12} md={3}><StatCard label="Receivables" value={Number(stats.receivables || 0).toFixed(2)} /></Grid>
                <Grid item xs={12} md={3}><StatCard label="Payables" value={Number(stats.payables || 0).toFixed(2)} /></Grid>
                <Grid item xs={12} md={3}><StatCard label="AR 90+ Exposure" value={Number(stats.receivables_90_plus || 0).toFixed(2)} /></Grid>
                <Grid item xs={12} md={3}><StatCard label="AP 90+ Exposure" value={Number(stats.payables_90_plus || 0).toFixed(2)} /></Grid>
                <Grid item xs={12} md={3}><StatCard label="Vendors" value={stats.total_vendors} /></Grid>
                <Grid item xs={12} md={3}><StatCard label="Bank Accounts" value={stats.bank_accounts} /></Grid>
                <Grid item xs={12} md={3}><StatCard label="Cash Accounts" value={stats.cash_accounts} /></Grid>
                <Grid item xs={12} md={3}><StatCard label="Posting Failures" value={exceptions.failed_postings} /></Grid>
                <Grid item xs={12} md={3}><StatCard label="Posting Pending" value={exceptions.pending_postings} /></Grid>
            </Grid>

            <SurfaceCard title="Quick Actions" subtitle="Jump into the highest-traffic accounting workflows.">
                <Grid container spacing={1.5}>
                    <Grid item><Button component={Link} href={route('accounting.coa.index')} variant="contained">Chart of Accounts</Button></Grid>
                    <Grid item><Button component={Link} href={route('accounting.general-ledger')} variant="outlined">General Ledger</Button></Grid>
                    <Grid item><Button component={Link} href={route('accounting.receivables')} variant="outlined">Receivables</Button></Grid>
                    <Grid item><Button component={Link} href={route('accounting.payables')} variant="outlined">Payables</Button></Grid>
                    <Grid item><Button component={Link} href={route('accounting.reports.trial-balance')} variant="outlined">Trial Balance</Button></Grid>
                    <Grid item><Button component={Link} href={route('accounting.reports.financial-statements')} variant="outlined">Statements</Button></Grid>
                    <Grid item><Button component={Link} href={route('accounting.reports.management-pack')} variant="outlined">Management Pack</Button></Grid>
                    <Grid item><Button component={Link} href={route('accounting.reports.receivables-aging')} variant="outlined">AR Aging</Button></Grid>
                    <Grid item><Button component={Link} href={route('accounting.reports.receivables-by-source')} variant="outlined">AR by Source</Button></Grid>
                    <Grid item><Button component={Link} href={route('accounting.reports.payables-aging')} variant="outlined">AP Aging</Button></Grid>
                    <Grid item><Button component={Link} href={route('accounting.bank-reconciliation.index')} variant="outlined">Bank Reconciliation</Button></Grid>
                    <Grid item><Button component={Link} href={route('accounting.periods.index')} variant="outlined">Period Close</Button></Grid>
                </Grid>
            </SurfaceCard>

            <SurfaceCard title="Recent Transactions" subtitle="Latest entries moving through the books.">
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Entry No</TableCell>
                                <TableCell>Date</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Description</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {recentEntries.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} align="center">No recent entries.</TableCell>
                                </TableRow>
                            )}
                            {recentEntries.map((entry) => (
                                <TableRow key={entry.id}>
                                    <TableCell>{entry.entry_no}</TableCell>
                                    <TableCell>{entry.entry_date}</TableCell>
                                    <TableCell>{entry.status}</TableCell>
                                    <TableCell>{entry.description || '-'}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </SurfaceCard>

            <SurfaceCard title="Transaction Mix" subtitle="See which modules are generating accounting activity.">
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.25 }}>
                    {entryMix.length === 0 && <Typography variant="body2" color="text.secondary">No transaction mix available.</Typography>}
                    {entryMix.map((item, idx) => (
                        <Chip
                            key={`${item.module_type || 'generic'}-${idx}`}
                            label={`${item.module_type || 'general'}: ${item.total}`}
                            sx={{
                                bgcolor: 'rgba(6,52,85,0.10)',
                                border: '1px solid rgba(6,52,85,0.24)',
                                color: 'primary.main',
                                fontWeight: 700,
                            }}
                        />
                    ))}
                </Box>
            </SurfaceCard>

            <SurfaceCard
                title="Transaction Feed"
                subtitle="Filter the latest accounting activity by status, source module, and date range."
                actions={
                    <Stack direction="row" spacing={1}>
                        <Button variant="contained" onClick={applyFilters}>Apply</Button>
                        <Button variant="outlined" onClick={resetFilters}>Reset</Button>
                    </Stack>
                }
            >
                <Box
                    sx={{
                        p: 2,
                        mb: 2.5,
                        borderRadius: '18px',
                        border: '1px solid rgba(229,231,235,0.9)',
                        background: 'linear-gradient(180deg, rgba(248,250,253,0.92) 0%, rgba(255,255,255,0.92) 100%)',
                    }}
                >
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={3}>
                            <TextField
                                label="Search entry or description"
                                value={filters.search}
                                onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                                fullWidth
                            />
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <TextField
                                select
                                label="Status"
                                value={filters.status}
                                onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
                                fullWidth
                            >
                                <MenuItem value="">All</MenuItem>
                                <MenuItem value="draft">Draft</MenuItem>
                                <MenuItem value="posted">Posted</MenuItem>
                                <MenuItem value="reversed">Reversed</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <TextField
                                select
                                label="Module"
                                value={filters.module_type}
                                onChange={(e) => setFilters((prev) => ({ ...prev, module_type: e.target.value }))}
                                fullWidth
                            >
                                <MenuItem value="">All Modules</MenuItem>
                                {(moduleOptions || []).map((module) => (
                                    <MenuItem key={module} value={module}>{module}</MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <TextField
                                label="From"
                                type="date"
                                value={filters.from}
                                onChange={(e) => setFilters((prev) => ({ ...prev, from: e.target.value }))}
                                InputLabelProps={{ shrink: true }}
                                fullWidth
                            />
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <TextField
                                label="To"
                                type="date"
                                value={filters.to}
                                onChange={(e) => setFilters((prev) => ({ ...prev, to: e.target.value }))}
                                InputLabelProps={{ shrink: true }}
                                fullWidth
                            />
                        </Grid>
                    </Grid>
                </Box>

                <Typography variant="h6" sx={{ mb: 2, color: 'text.primary' }}>Latest Posted Feed</Typography>
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Entry No</TableCell>
                                <TableCell>Date</TableCell>
                                <TableCell>Module</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Description</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {latestRows.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} align="center">No transactions available.</TableCell>
                                </TableRow>
                            )}
                            {latestRows.map((entry) => (
                                <TableRow key={entry.id}>
                                    <TableCell>{entry.entry_no}</TableCell>
                                    <TableCell>{entry.entry_date}</TableCell>
                                    <TableCell>{entry.module_type || 'general'}</TableCell>
                                    <TableCell>{entry.status}</TableCell>
                                    <TableCell>{entry.description || '-'}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
                <Pagination data={latestTransactions} />
            </SurfaceCard>

            <SurfaceCard title="Integration Coverage" subtitle="Monitor posting-rule readiness across modules.">
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {(ruleCoverage.expected || []).map((code) => {
                        const isActive = (ruleCoverage.active || []).includes(code);
                        return (
                            <Chip
                                key={code}
                                label={code}
                                size="small"
                                color={isActive ? 'success' : 'warning'}
                                variant={isActive ? 'filled' : 'outlined'}
                            />
                        );
                    })}
                </Box>
                {(ruleCoverage.missing || []).length > 0 ? (
                    <Typography variant="body2" sx={{ mt: 2, color: 'warning.main' }}>
                        Missing active mappings: {(ruleCoverage.missing || []).join(', ')}
                    </Typography>
                ) : (
                    <Typography variant="body2" sx={{ mt: 2, color: 'success.main' }}>
                        All major module posting rules are active.
                    </Typography>
                )}
            </SurfaceCard>

            <SurfaceCard
                title="Exception Center"
                subtitle="Review posting failures and retry directly from the dashboard."
                actions={
                    <Button
                        size="small"
                        variant="outlined"
                        disabled={(exceptions.failed_postings || 0) === 0}
                        onClick={() => router.post(route('accounting.events.retry-all'))}
                    >
                        Retry All Failed
                    </Button>
                }
            >
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Event</TableCell>
                                <TableCell>Source</TableCell>
                                <TableCell>Error</TableCell>
                                <TableCell>Last Attempt</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {(exceptions.recent_failures || []).length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} align="center">No failed postings.</TableCell>
                                </TableRow>
                            )}
                            {(exceptions.recent_failures || []).map((failure) => (
                                <TableRow key={failure.id}>
                                    <TableCell>{failure.event_type}</TableCell>
                                    <TableCell>{failure.source_type.split('\\').pop()} #{failure.source_id}</TableCell>
                                    <TableCell>{failure.error_message || '-'}</TableCell>
                                    <TableCell>
                                        {failure.updated_at || '-'}
                                        <Button size="small" sx={{ ml: 1 }} onClick={() => router.post(route('accounting.events.retry', failure.id))}>
                                            Retry
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </SurfaceCard>
        </AppPage>
    );
}
