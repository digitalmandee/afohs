import React from 'react';
import { router } from '@inertiajs/react';
import { Button, Chip, Grid, Stack, TableCell, TableRow, TextField, Typography } from '@mui/material';
import AppPage from '@/components/App/ui/AppPage';
import AdminDataTable from '@/components/App/ui/AdminDataTable';
import FilterToolbar from '@/components/App/ui/FilterToolbar';
import StatCard from '@/components/App/ui/StatCard';
import SurfaceCard from '@/components/App/ui/SurfaceCard';
import { downloadReportCsv, downloadReportPdf, formatReportAmount, openReportPrint, sanitizeFilters } from './reportOutput';

const metricRows = [
    { key: 'trial_balance_gap', label: 'Trial Balance Gap' },
    { key: 'assets_total', label: 'Assets Total' },
    { key: 'liabilities_total', label: 'Liabilities Total' },
    { key: 'equity_total', label: 'Equity Total' },
    { key: 'income_total', label: 'Income Total' },
    { key: 'expense_total', label: 'Expense Total' },
    { key: 'net_profit', label: 'Net Profit' },
];

const healthRows = [
    { key: 'current_ratio', label: 'Current Ratio', unit: '', better: 'up' },
    { key: 'debt_to_equity', label: 'Debt to Equity', unit: '', better: 'down' },
    { key: 'net_margin', label: 'Net Margin', unit: '%', better: 'up' },
];

const formatNumber = formatReportAmount;

export default function FinancialStatements({ filters, comparison = {}, currentHealth = {}, previousHealth = {}, healthComparison = {} }) {
    const [localFilters, setLocalFilters] = React.useState({
        from: filters?.from || '',
        to: filters?.to || '',
        compare_from: filters?.compare_from || '',
        compare_to: filters?.compare_to || '',
    });

    React.useEffect(() => {
        setLocalFilters({
            from: filters?.from || '',
            to: filters?.to || '',
            compare_from: filters?.compare_from || '',
            compare_to: filters?.compare_to || '',
        });
    }, [filters]);

    const applyFilters = (nextFilters = localFilters) => {
        router.get(route('accounting.reports.financial-statements'), nextFilters, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    return (
        <AppPage
            eyebrow="Accounting Reports"
            title="Financial Statements"
            subtitle="Executive comparison of current and previous periods with shared reporting components, cleaner metrics, and export-ready drilldown."
            actions={[
                <Button key="pdf" variant="outlined" onClick={() => downloadReportPdf('accounting.reports.financial-statements.pdf', sanitizeFilters(localFilters))}>Download PDF</Button>,
                <Button key="csv" variant="outlined" onClick={() => downloadReportCsv('accounting.reports.financial-statements', localFilters)}>Export CSV</Button>,
                <Button key="print" variant="outlined" onClick={() => openReportPrint('accounting.reports.financial-statements.print', sanitizeFilters(localFilters))}>Print</Button>,
            ]}
        >
            <Grid container spacing={2.25}>
                <Grid item xs={12} md={3}><StatCard label="Net Profit" value={formatNumber(comparison?.net_profit?.current)} accent /></Grid>
                <Grid item xs={12} md={3}><StatCard label="Assets" value={formatNumber(comparison?.assets_total?.current)} tone="light" /></Grid>
                <Grid item xs={12} md={3}><StatCard label="Liabilities" value={formatNumber(comparison?.liabilities_total?.current)} tone="light" /></Grid>
                <Grid item xs={12} md={3}><StatCard label="Equity" value={formatNumber(comparison?.equity_total?.current)} tone="muted" /></Grid>
            </Grid>

            <SurfaceCard title="Comparison Filters" subtitle="Review current and prior periods in one place without dropping back to the older report layout.">
                <FilterToolbar onReset={() => router.get(route('accounting.reports.financial-statements'))}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={3}>
                            <TextField label="Current From" type="date" value={localFilters.from} onChange={(event) => setLocalFilters((current) => ({ ...current, from: event.target.value }))} InputLabelProps={{ shrink: true }} fullWidth />
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <TextField label="Current To" type="date" value={localFilters.to} onChange={(event) => setLocalFilters((current) => ({ ...current, to: event.target.value }))} InputLabelProps={{ shrink: true }} fullWidth />
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <TextField label="Compare From" type="date" value={localFilters.compare_from} onChange={(event) => setLocalFilters((current) => ({ ...current, compare_from: event.target.value }))} InputLabelProps={{ shrink: true }} fullWidth />
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <TextField label="Compare To" type="date" value={localFilters.compare_to} onChange={(event) => setLocalFilters((current) => ({ ...current, compare_to: event.target.value }))} InputLabelProps={{ shrink: true }} fullWidth />
                        </Grid>
                        <Grid item xs={12}>
                            <Stack direction="row" spacing={1}>
                                <Button variant="contained" onClick={() => applyFilters()}>Apply</Button>
                                <Button variant="outlined" onClick={() => {
                                    const targets = [
                                        route('accounting.reports.trial-balance', { from: localFilters.from, to: localFilters.to }),
                                        route('accounting.reports.balance-sheet', { from: localFilters.from, to: localFilters.to }),
                                        route('accounting.reports.profit-loss', { from: localFilters.from, to: localFilters.to }),
                                        route('accounting.reports.receivables-by-source', { from: localFilters.from, to: localFilters.to }),
                                        route('accounting.reports.payables-aging', { from: localFilters.from, to: localFilters.to }),
                                    ];
                                    targets.forEach((url, index) => {
                                        setTimeout(() => window.open(url, '_blank', 'noopener,noreferrer'), index * 120);
                                    });
                                }}>
                                    Open Management Pack
                                </Button>
                            </Stack>
                        </Grid>
                    </Grid>
                </FilterToolbar>
            </SurfaceCard>

            <SurfaceCard title="Statement Comparison" subtitle="Period-over-period comparison matrix with deltas and percentage change.">
                <AdminDataTable
                    columns={[
                        { key: 'metric', label: 'Metric', minWidth: 220 },
                        { key: 'current', label: 'Current', minWidth: 140, align: 'right' },
                        { key: 'previous', label: 'Previous', minWidth: 140, align: 'right' },
                        { key: 'delta', label: 'Delta', minWidth: 140, align: 'right' },
                        { key: 'change', label: 'Change %', minWidth: 140, align: 'right' },
                    ]}
                    rows={metricRows}
                    tableMinWidth={980}
                    emptyMessage="No financial statement comparison data found."
                    renderRow={(row) => {
                        const metric = comparison?.[row.key] || {};
                        return (
                            <TableRow key={row.key} hover>
                                <TableCell sx={{ fontWeight: 700 }}>{row.label}</TableCell>
                                <TableCell align="right">{formatNumber(metric.current)}</TableCell>
                                <TableCell align="right">{formatNumber(metric.previous)}</TableCell>
                                <TableCell align="right">{formatNumber(metric.delta)}</TableCell>
                                <TableCell align="right">
                                    {metric.change_percent == null ? '-' : `${formatNumber(metric.change_percent)}%`}
                                </TableCell>
                            </TableRow>
                        );
                    }}
                />
            </SurfaceCard>

            <SurfaceCard title="Executive Health" subtitle="Liquidity, leverage, and margin indicators aligned to the same premium analytics treatment.">
                <Grid container spacing={2}>
                    {healthRows.map((row) => {
                        const currentValue = Number(currentHealth?.[row.key] || 0);
                        const previousValue = Number(previousHealth?.[row.key] || 0);
                        const delta = Number(healthComparison?.[row.key]?.delta || 0);
                        const positive = row.better === 'up' ? delta >= 0 : delta <= 0;

                        return (
                            <Grid item xs={12} md={4} key={row.key}>
                                <SurfaceCard
                                    title={row.label}
                                    subtitle={`Previous: ${formatNumber(previousValue)}${row.unit}`}
                                    contentSx={{ pt: 0 }}
                                >
                                    <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                                        <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main' }}>
                                            {formatNumber(currentValue)}{row.unit}
                                        </Typography>
                                        <Chip
                                            size="small"
                                            label={`${delta >= 0 ? '+' : ''}${formatNumber(delta)}${row.unit}`}
                                            color={positive ? 'success' : 'warning'}
                                            variant="outlined"
                                        />
                                    </Stack>
                                </SurfaceCard>
                            </Grid>
                        );
                    })}
                </Grid>
            </SurfaceCard>
        </AppPage>
    );
}
