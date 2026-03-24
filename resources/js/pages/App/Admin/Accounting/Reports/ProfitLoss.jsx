import React from 'react';
import { router } from '@inertiajs/react';
import { Button, Grid, TableCell, TableRow, TextField } from '@mui/material';
import AppPage from '@/components/App/ui/AppPage';
import AdminDataTable from '@/components/App/ui/AdminDataTable';
import FilterToolbar from '@/components/App/ui/FilterToolbar';
import StatCard from '@/components/App/ui/StatCard';
import SurfaceCard from '@/components/App/ui/SurfaceCard';
import { downloadReportCsv, downloadReportPdf, formatReportAmount, openReportPrint, sanitizeFilters } from './reportOutput';

const formatNumber = formatReportAmount;

function SectionTable({ title, rows = [] }) {
    return (
        <SurfaceCard title={title} subtitle={`Ledger drilldown for ${title.toLowerCase()} accounts using the same standardized report table.`}>
            <AdminDataTable
                columns={[
                    { key: 'code', label: 'Code', minWidth: 120 },
                    { key: 'name', label: 'Name', minWidth: 260 },
                    { key: 'balance', label: 'Balance', minWidth: 140, align: 'right' },
                    { key: 'action', label: 'Action', minWidth: 140, align: 'right' },
                ]}
                rows={rows}
                tableMinWidth={920}
                emptyMessage={`No ${title.toLowerCase()} rows found.`}
                renderRow={(row, index) => (
                    <TableRow key={`${row.code}-${index}`} hover>
                        <TableCell>{row.code}</TableCell>
                        <TableCell>{row.name}</TableCell>
                        <TableCell align="right">{formatNumber(row.balance)}</TableCell>
                        <TableCell align="right">
                            <Button size="small" variant="outlined" onClick={() => row.ledger_url && router.get(row.ledger_url)} disabled={!row.ledger_url}>
                                Ledger
                            </Button>
                        </TableCell>
                    </TableRow>
                )}
            />
        </SurfaceCard>
    );
}

export default function ProfitLoss({ income = [], expense = [], summary = {}, filters }) {
    const [localFilters, setLocalFilters] = React.useState({
        from: filters?.from || '',
        to: filters?.to || '',
    });

    React.useEffect(() => {
        setLocalFilters({
            from: filters?.from || '',
            to: filters?.to || '',
        });
    }, [filters]);

    return (
        <AppPage
            eyebrow="Accounting Reports"
            title="Profit & Loss"
            subtitle="Income and expense visibility with direct ledger drilldown and the same premium report styling as the rest of accounting."
            actions={[
                <Button key="pdf" variant="outlined" onClick={() => downloadReportPdf('accounting.reports.profit-loss.pdf', sanitizeFilters(localFilters))}>Download PDF</Button>,
                <Button key="csv" variant="outlined" onClick={() => downloadReportCsv('accounting.reports.profit-loss', localFilters)}>Export CSV</Button>,
                <Button key="print" variant="outlined" onClick={() => openReportPrint('accounting.reports.profit-loss.print', sanitizeFilters(localFilters))}>Print</Button>,
            ]}
        >
            <Grid container spacing={2.25}>
                <Grid item xs={12} md={4}><StatCard label="Income" value={formatNumber(summary?.income_total)} accent /></Grid>
                <Grid item xs={12} md={4}><StatCard label="Expense" value={formatNumber(summary?.expense_total)} tone="light" /></Grid>
                <Grid item xs={12} md={4}><StatCard label="Net Profit" value={formatNumber(summary?.net_profit)} tone="muted" /></Grid>
            </Grid>

            <SurfaceCard title="Report Filters" subtitle="Adjust the reporting period without dropping back into the legacy report form layout.">
                <FilterToolbar onReset={() => router.get(route('accounting.reports.profit-loss'))}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={3}>
                            <TextField label="From" type="date" value={localFilters.from} onChange={(event) => setLocalFilters((current) => ({ ...current, from: event.target.value }))} InputLabelProps={{ shrink: true }} fullWidth />
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <TextField label="To" type="date" value={localFilters.to} onChange={(event) => setLocalFilters((current) => ({ ...current, to: event.target.value }))} InputLabelProps={{ shrink: true }} fullWidth />
                        </Grid>
                        <Grid item xs={12}>
                            <Button
                                variant="contained"
                                onClick={() => router.get(route('accounting.reports.profit-loss'), localFilters, {
                                    preserveState: true,
                                    preserveScroll: true,
                                    replace: true,
                                })}
                            >
                                Apply
                            </Button>
                        </Grid>
                    </Grid>
                </FilterToolbar>
            </SurfaceCard>

            <SectionTable title="Income" rows={income} />
            <SectionTable title="Expenses" rows={expense} />
        </AppPage>
    );
}
