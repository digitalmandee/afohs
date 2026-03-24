import React from 'react';
import { router } from '@inertiajs/react';
import { Alert, Box, Button, Chip, Grid, Stack, TableCell, TableRow, TextField, Typography } from '@mui/material';
import AppPage from '@/components/App/ui/AppPage';
import AdminDataTable from '@/components/App/ui/AdminDataTable';
import FilterToolbar from '@/components/App/ui/FilterToolbar';
import StatCard from '@/components/App/ui/StatCard';
import SurfaceCard from '@/components/App/ui/SurfaceCard';

export default function TrialBalance({ rows = [], summary, filters, error = null }) {
    const downloadCsv = () => {
        window.location.href = route('accounting.reports.trial-balance', {
            from: filters?.from || '',
            to: filters?.to || '',
            export: 'csv',
        });
    };

    return (
        <AppPage
            eyebrow="Accounting Reports"
            title="Trial Balance"
            subtitle="Summarized account balances with ledger drilldown, grouped totals, and shared premium report styling."
            actions={[
                <Button key="export" variant="outlined" onClick={downloadCsv}>Export CSV</Button>,
                <Button key="print" variant="outlined" onClick={() => window.print()}>Print</Button>,
            ]}
        >
            <Grid container spacing={2.25}>
                <Grid item xs={12} md={4}><StatCard label="Total Debit" value={Number(summary?.total_debit || 0).toFixed(2)} accent /></Grid>
                <Grid item xs={12} md={4}><StatCard label="Total Credit" value={Number(summary?.total_credit || 0).toFixed(2)} tone="light" /></Grid>
                <Grid item xs={12} md={4}><StatCard label="Difference" value={Number(summary?.difference || 0).toFixed(2)} tone="muted" /></Grid>
            </Grid>

            {error ? <Alert severity="warning" variant="outlined">{error}</Alert> : null}

            <SurfaceCard title="Report Filters" subtitle="Adjust the statement period and refresh the report without leaving the standardized reporting shell.">
                <FilterToolbar onReset={() => router.get(route('accounting.reports.trial-balance'))}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={3}>
                            <TextField label="From" type="date" defaultValue={filters?.from || ''} InputLabelProps={{ shrink: true }} onChange={(event) => router.get(route('accounting.reports.trial-balance'), { from: event.target.value, to: filters?.to || '' }, { preserveState: true, preserveScroll: true, replace: true })} fullWidth />
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <TextField label="To" type="date" defaultValue={filters?.to || ''} InputLabelProps={{ shrink: true }} onChange={(event) => router.get(route('accounting.reports.trial-balance'), { from: filters?.from || '', to: event.target.value }, { preserveState: true, preserveScroll: true, replace: true })} fullWidth />
                        </Grid>
                    </Grid>
                </FilterToolbar>
                <Stack direction="row" spacing={1} sx={{ mt: 2 }} flexWrap="wrap" useFlexGap>
                    {Object.entries(summary?.type_totals || {}).map(([type, data]) => (
                        <Chip key={type} size="small" variant="outlined" label={`${type}: D ${Number(data?.debit || 0).toFixed(2)} | C ${Number(data?.credit || 0).toFixed(2)}`} />
                    ))}
                </Stack>
            </SurfaceCard>

            <SurfaceCard title="Trial Balance Register" subtitle="Ledger-ready account balance report with shared table density and hierarchy visibility.">
                <AdminDataTable
                    columns={[
                        { key: 'code', label: 'Code', minWidth: 120 },
                        { key: 'name', label: 'Name', minWidth: 260 },
                        { key: 'type', label: 'Type', minWidth: 140 },
                        { key: 'debit', label: 'Debit', minWidth: 120, align: 'right' },
                        { key: 'credit', label: 'Credit', minWidth: 120, align: 'right' },
                        { key: 'action', label: 'Action', minWidth: 140, align: 'right' },
                    ]}
                    rows={rows}
                    tableMinWidth={1120}
                    emptyMessage="No trial balance data found."
                    renderRow={(row) => (
                        <TableRow key={row.id} hover>
                            <TableCell>{row.code}</TableCell>
                            <TableCell>
                                <Typography sx={{ pl: (Number(row.level || 1) - 1) * 2, fontWeight: 700 }}>
                                    {row.name}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ pl: (Number(row.level || 1) - 1) * 2 }}>
                                    Level {row.level} · {row.is_postable ? 'Postable' : 'Header'}
                                </Typography>
                            </TableCell>
                            <TableCell>
                                <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
                                    <Chip size="small" variant="outlined" label={row.type} />
                                    <Chip size="small" variant="outlined" color={row.normal_balance === 'credit' ? 'warning' : 'primary'} label={row.normal_balance === 'credit' ? 'Credit Normal' : 'Debit Normal'} />
                                </Stack>
                            </TableCell>
                            <TableCell align="right">{Number(row.debit || 0).toFixed(2)}</TableCell>
                            <TableCell align="right">{Number(row.credit || 0).toFixed(2)}</TableCell>
                            <TableCell align="right">
                                {row.ledger_url ? (
                                    <Button size="small" variant="outlined" onClick={() => router.get(row.ledger_url)}>
                                        Ledger
                                    </Button>
                                ) : (
                                    <Button size="small" variant="outlined" disabled>
                                        Unavailable
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
