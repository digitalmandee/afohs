import React from 'react';
import { router } from '@inertiajs/react';
import { Alert, Button, Grid, MenuItem, TableCell, TableRow, TextField, Typography } from '@mui/material';
import AppPage from '@/components/App/ui/AppPage';
import AdminDataTable from '@/components/App/ui/AdminDataTable';
import DateRangeFilterFields from '@/components/App/ui/DateRangeFilterFields';
import FilterToolbar from '@/components/App/ui/FilterToolbar';
import StatCard from '@/components/App/ui/StatCard';
import SurfaceCard from '@/components/App/ui/SurfaceCard';
import { downloadReportCsv, downloadReportPdf, formatReportAmount, openReportPrint, sanitizeFilters } from './reportOutput';

export default function BankBook({ rows, summary = {}, filters = {}, bookLabel = 'Bank Book', error = null, accounts = [], paymentAccounts = [], tenants = [], sourceOptions = [] }) {
    const [localFilters, setLocalFilters] = React.useState({
        from: filters.from || '',
        to: filters.to || '',
        search: filters.search || '',
        source: filters.source || '',
        tenant_id: filters.tenant_id || '',
        account_id: filters.account_id || '',
        payment_account_id: filters.payment_account_id || '',
    });

    React.useEffect(() => {
        setLocalFilters({
            from: filters.from || '',
            to: filters.to || '',
            search: filters.search || '',
            source: filters.source || '',
            tenant_id: filters.tenant_id || '',
            account_id: filters.account_id || '',
            payment_account_id: filters.payment_account_id || '',
        });
    }, [filters.from, filters.to, filters.search, filters.source, filters.tenant_id, filters.account_id, filters.payment_account_id]);

    const apply = React.useCallback((next) => {
        router.get(route('accounting.reports.bank-book'), sanitizeFilters(next), {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    }, []);

    return (
        <AppPage
            eyebrow="Accounting Reports"
            title={bookLabel}
            subtitle="Running balance view for bank-side journal movements."
            actions={[
                <Button key="pdf" variant="outlined" onClick={() => downloadReportPdf('accounting.reports.bank-book.pdf', localFilters)}>Download PDF</Button>,
                <Button key="csv" variant="outlined" onClick={() => downloadReportCsv('accounting.reports.bank-book', localFilters)}>Export CSV</Button>,
                <Button key="print" variant="outlined" onClick={() => openReportPrint('accounting.reports.bank-book.print', localFilters)}>Print</Button>,
            ]}
        >
            <Grid container spacing={2.25}>
                <Grid item xs={12} md={3}><StatCard label="Rows" value={summary.records || 0} accent /></Grid>
                <Grid item xs={12} md={3}><StatCard label="Total Debit" value={formatReportAmount(summary.total_debit)} tone="light" /></Grid>
                <Grid item xs={12} md={3}><StatCard label="Total Credit" value={formatReportAmount(summary.total_credit)} tone="muted" /></Grid>
                <Grid item xs={12} md={3}><StatCard label="Closing Balance" value={formatReportAmount(summary.closing_balance)} tone="light" /></Grid>
            </Grid>

            {error ? <Alert severity="warning" variant="outlined">{error}</Alert> : null}

            <SurfaceCard lowChrome>
                <FilterToolbar
                    onApply={() => apply(localFilters)}
                    onReset={() => apply({ from: '', to: '' })}
                    lowChrome
                    title="Filters"
                    subtitle="Refine posting dates and reload this book."
                >
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={2.5}>
                            <TextField
                                label="Search"
                                value={localFilters.search}
                                onChange={(e) => setLocalFilters((prev) => ({ ...prev, search: e.target.value }))}
                                fullWidth
                                size="small"
                            />
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <TextField
                                select
                                label="Source"
                                value={localFilters.source}
                                onChange={(e) => setLocalFilters((prev) => ({ ...prev, source: e.target.value }))}
                                fullWidth
                                size="small"
                            >
                                <MenuItem value="">All</MenuItem>
                                {sourceOptions.map((source) => (
                                    <MenuItem key={source} value={source}>{source}</MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <TextField
                                select
                                label="Restaurant"
                                value={localFilters.tenant_id}
                                onChange={(e) => setLocalFilters((prev) => ({ ...prev, tenant_id: e.target.value }))}
                                fullWidth
                                size="small"
                            >
                                <MenuItem value="">All</MenuItem>
                                {tenants.map((tenant) => (
                                    <MenuItem key={tenant.id} value={tenant.id}>{tenant.name}</MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <TextField
                                select
                                label="Account"
                                value={localFilters.account_id}
                                onChange={(e) => setLocalFilters((prev) => ({ ...prev, account_id: e.target.value }))}
                                fullWidth
                                size="small"
                            >
                                <MenuItem value="">All</MenuItem>
                                {accounts.map((account) => (
                                    <MenuItem key={account.id} value={account.id}>
                                        {account.full_code} - {account.name}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={1.5}>
                            <TextField
                                select
                                label="Pay Account"
                                value={localFilters.payment_account_id}
                                onChange={(e) => setLocalFilters((prev) => ({ ...prev, payment_account_id: e.target.value }))}
                                fullWidth
                                size="small"
                            >
                                <MenuItem value="">All</MenuItem>
                                {paymentAccounts.map((account) => (
                                    <MenuItem key={account.id} value={account.id}>{account.name}</MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <DateRangeFilterFields
                            startValue={localFilters.from}
                            endValue={localFilters.to}
                            onStartChange={(value) => setLocalFilters((prev) => ({ ...prev, from: value }))}
                            onEndChange={(value) => setLocalFilters((prev) => ({ ...prev, to: value }))}
                            startGrid={{ xs: 12, md: 3 }}
                            endGrid={{ xs: 12, md: 3 }}
                        />
                    </Grid>
                </FilterToolbar>
            </SurfaceCard>

            <SurfaceCard lowChrome>
                <AdminDataTable
                    columns={[
                        { key: 'entry_date', label: 'Date', minWidth: 120 },
                        { key: 'entry_no', label: 'Entry No', minWidth: 170 },
                        { key: 'restaurant_name', label: 'Restaurant', minWidth: 170 },
                        { key: 'account', label: 'Account', minWidth: 260 },
                        { key: 'source_label', label: 'Source', minWidth: 200 },
                        { key: 'debit', label: 'Debit', minWidth: 120, align: 'right' },
                        { key: 'credit', label: 'Credit', minWidth: 120, align: 'right' },
                        { key: 'running_balance', label: 'Running Balance', minWidth: 150, align: 'right' },
                    ]}
                    rows={rows?.data || []}
                    pagination={rows}
                    tableMinWidth={1180}
                    emptyMessage="No bank book records found."
                    renderRow={(row) => (
                        <TableRow key={row.id} hover>
                            <TableCell>{row.entry_date || '-'}</TableCell>
                            <TableCell>{row.entry_no || '-'}</TableCell>
                            <TableCell>{row.restaurant_name || '-'}</TableCell>
                            <TableCell>{row.account || '-'}</TableCell>
                            <TableCell>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>{row.source_label || '-'}</Typography>
                            </TableCell>
                            <TableCell align="right">{formatReportAmount(row.debit)}</TableCell>
                            <TableCell align="right">{formatReportAmount(row.credit)}</TableCell>
                            <TableCell align="right">{formatReportAmount(row.running_balance)}</TableCell>
                        </TableRow>
                    )}
                />
            </SurfaceCard>
        </AppPage>
    );
}
