import React from 'react';
import { router } from '@inertiajs/react';
import { Button, Grid, TableCell, TableRow, TextField, Typography } from '@mui/material';
import AppPage from '@/components/App/ui/AppPage';
import AdminDataTable from '@/components/App/ui/AdminDataTable';
import FilterToolbar from '@/components/App/ui/FilterToolbar';
import StatCard from '@/components/App/ui/StatCard';
import SurfaceCard from '@/components/App/ui/SurfaceCard';
import { AdminIconAction, AdminRowActionGroup } from '@/components/App/ui/AdminRowActions';
import { AccountBalanceOutlined } from '@mui/icons-material';
import { downloadReportCsv, downloadReportPdf, formatReportAmount, openReportPrint, sanitizeFilters } from './reportOutput';

function SectionTable({ title, rows }) {
    return (
        <SurfaceCard title={title} subtitle={`Ledger-ready ${title.toLowerCase()} balances with direct drilldown to underlying account activity.`}>
            <AdminDataTable
                columns={[
                    { key: 'code', label: 'Code', minWidth: 120 },
                    { key: 'name', label: 'Name', minWidth: 260 },
                    { key: 'balance', label: 'Balance', minWidth: 140, align: 'right' },
                    { key: 'action', label: 'Action', minWidth: 140, align: 'right' },
                ]}
                rows={rows}
                tableMinWidth={980}
                emptyMessage={`No ${title.toLowerCase()} rows found.`}
                renderRow={(row, index) => (
                    <TableRow key={`${row.code}-${index}`} hover>
                        <TableCell>{row.code}</TableCell>
                        <TableCell>{row.name}</TableCell>
                        <TableCell align="right">{formatReportAmount(row.balance)}</TableCell>
                        <TableCell align="right">
                            <AdminRowActionGroup justify="flex-end">
                                <AdminIconAction title={row.ledger_url ? 'Open Ledger' : 'Ledger unavailable'} onClick={() => row.ledger_url && router.get(row.ledger_url)} disabled={!row.ledger_url}>
                                    <AccountBalanceOutlined fontSize="small" />
                                </AdminIconAction>
                            </AdminRowActionGroup>
                        </TableCell>
                    </TableRow>
                )}
            />
        </SurfaceCard>
    );
}

export default function BalanceSheet({ assets = [], liabilities = [], equity = [], summary, filters }) {
    const activeFilters = sanitizeFilters({
        from: filters?.from || '',
        to: filters?.to || '',
    });

    return (
        <AppPage
            eyebrow="Accounting Reports"
            title="Balance Sheet"
            subtitle="Structured asset, liability, and equity visibility using the same premium reporting system as the upgraded accounting module."
            actions={[
                <Button key="pdf" variant="outlined" onClick={() => downloadReportPdf('accounting.reports.balance-sheet.pdf', activeFilters)}>Download PDF</Button>,
                <Button key="export" variant="outlined" onClick={() => downloadReportCsv('accounting.reports.balance-sheet', activeFilters)}>Export CSV</Button>,
                <Button key="print" variant="outlined" onClick={() => openReportPrint('accounting.reports.balance-sheet.print', activeFilters)}>Print</Button>,
            ]}
        >
            <Grid container spacing={2.25}>
                <Grid item xs={12} md={3}><StatCard label="Assets" value={formatReportAmount(summary?.assets_total)} accent /></Grid>
                <Grid item xs={12} md={3}><StatCard label="Liabilities" value={formatReportAmount(summary?.liabilities_total)} tone="light" /></Grid>
                <Grid item xs={12} md={3}><StatCard label="Equity" value={formatReportAmount(summary?.equity_total)} tone="light" /></Grid>
                <Grid item xs={12} md={3}><StatCard label="Balance Gap" value={formatReportAmount(summary?.difference)} tone="muted" /></Grid>
            </Grid>

            <SurfaceCard title="Report Filters" subtitle="Adjust the reporting period while keeping the new accounting report layout consistent.">
                <FilterToolbar onReset={() => router.get(route('accounting.reports.balance-sheet'))}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={3}>
                            <TextField label="From" type="date" defaultValue={filters?.from || ''} InputLabelProps={{ shrink: true }} onChange={(event) => router.get(route('accounting.reports.balance-sheet'), { from: event.target.value, to: filters?.to || '' }, { preserveState: true, preserveScroll: true, replace: true })} fullWidth />
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <TextField label="To" type="date" defaultValue={filters?.to || ''} InputLabelProps={{ shrink: true }} onChange={(event) => router.get(route('accounting.reports.balance-sheet'), { from: filters?.from || '', to: event.target.value }, { preserveState: true, preserveScroll: true, replace: true })} fullWidth />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Typography sx={{ mt: 1.5, color: 'text.secondary' }}>
                                Liabilities + Equity: {formatReportAmount(summary?.liabilities_equity_total)}
                            </Typography>
                        </Grid>
                    </Grid>
                </FilterToolbar>
            </SurfaceCard>

            <SectionTable title="Assets" rows={assets} />
            <SectionTable title="Liabilities" rows={liabilities} />
            <SectionTable title="Equity" rows={equity} />
        </AppPage>
    );
}
