import React from 'react';
import { router } from '@inertiajs/react';
import { Button, Grid, TableCell, TableRow, Typography } from '@mui/material';
import AppPage from '@/components/App/ui/AppPage';
import AdminDataTable from '@/components/App/ui/AdminDataTable';
import DateRangeFilterFields from '@/components/App/ui/DateRangeFilterFields';
import FilterToolbar from '@/components/App/ui/FilterToolbar';
import StatCard from '@/components/App/ui/StatCard';
import SurfaceCard from '@/components/App/ui/SurfaceCard';
import { AdminIconAction, AdminRowActionGroup } from '@/components/App/ui/AdminRowActions';
import { AccountBalanceOutlined } from '@mui/icons-material';
import useFilterLoadingState from '@/hooks/useFilterLoadingState';
import { downloadReportCsv, downloadReportPdf, formatReportAmount, openReportPrint, sanitizeFilters } from './reportOutput';

function SectionTable({ title, rows, loading = false }) {
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
                loading={loading}
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
    const { loading, beginLoading } = useFilterLoadingState([
        assets.length,
        liabilities.length,
        equity.length,
        filters?.from,
        filters?.to,
    ]);
    const [localFilters, setLocalFilters] = React.useState({
        from: filters?.from || '',
        to: filters?.to || '',
    });
    const activeFilters = sanitizeFilters({
        from: localFilters.from,
        to: localFilters.to,
    });

    React.useEffect(() => {
        setLocalFilters({
            from: filters?.from || '',
            to: filters?.to || '',
        });
    }, [filters?.from, filters?.to]);

    const submitFilters = React.useCallback((nextFilters) => {
        beginLoading();
        router.get(route('accounting.reports.balance-sheet'), sanitizeFilters(nextFilters), {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    }, [beginLoading]);

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
                <FilterToolbar onReset={() => submitFilters({ from: '', to: '' })}>
                    <Grid container spacing={2}>
                        <DateRangeFilterFields
                            startValue={localFilters.from}
                            endValue={localFilters.to}
                            onStartChange={(value) => {
                                const next = { ...localFilters, from: value };
                                setLocalFilters(next);
                                submitFilters(next);
                            }}
                            onEndChange={(value) => {
                                const next = { ...localFilters, to: value };
                                setLocalFilters(next);
                                submitFilters(next);
                            }}
                            startGrid={{ xs: 12, md: 3 }}
                            endGrid={{ xs: 12, md: 3 }}
                        />
                        <Grid item xs={12} md={6}>
                            <Typography sx={{ mt: 1.5, color: 'text.secondary' }}>
                                Liabilities + Equity: {formatReportAmount(summary?.liabilities_equity_total)}
                            </Typography>
                        </Grid>
                    </Grid>
                </FilterToolbar>
            </SurfaceCard>

            <SectionTable title="Assets" rows={assets} loading={loading} />
            <SectionTable title="Liabilities" rows={liabilities} loading={loading} />
            <SectionTable title="Equity" rows={equity} loading={loading} />
        </AppPage>
    );
}
