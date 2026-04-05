import React from 'react';
import { router } from '@inertiajs/react';
import { Button, Grid, MenuItem, TableCell, TableRow, TextField } from '@mui/material';
import AppPage from '@/components/App/ui/AppPage';
import AdminDataTable from '@/components/App/ui/AdminDataTable';
import DateRangeFilterFields from '@/components/App/ui/DateRangeFilterFields';
import FilterToolbar from '@/components/App/ui/FilterToolbar';
import StatCard from '@/components/App/ui/StatCard';
import SurfaceCard from '@/components/App/ui/SurfaceCard';
import { downloadReportCsv, downloadReportPdf, formatReportAmount, openReportPrint, sanitizeFilters } from './reportOutput';

export default function DayBook({ rows, summary = {}, accounts = [], paymentAccounts = [], tenants = [], sourceOptions = [], filters = {} }) {
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
        router.get(route('accounting.reports.day-book'), sanitizeFilters(next), {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    }, []);

    const rowsData = rows?.data || [];
    const totalDebit = summary?.total_debit ?? rowsData.reduce((sum, row) => sum + Number(row.debit_total || 0), 0);
    const totalCredit = summary?.total_credit ?? rowsData.reduce((sum, row) => sum + Number(row.credit_total || 0), 0);

    return (
        <AppPage
            eyebrow="Accounting Reports"
            title="Day Book"
            subtitle="Date-wise journal register for posted accounting entries."
            actions={[
                <Button key="pdf" variant="outlined" onClick={() => downloadReportPdf('accounting.reports.day-book.pdf', localFilters)}>Download PDF</Button>,
                <Button key="csv" variant="outlined" onClick={() => downloadReportCsv('accounting.reports.day-book', localFilters)}>Export CSV</Button>,
                <Button key="print" variant="outlined" onClick={() => openReportPrint('accounting.reports.day-book.print', localFilters)}>Print</Button>,
            ]}
        >
            <Grid container spacing={2.25}>
                <Grid item xs={12} md={4}><StatCard label="Entries" value={summary?.records || rows?.total || 0} accent /></Grid>
                <Grid item xs={12} md={4}><StatCard label="Total Debit" value={formatReportAmount(totalDebit)} tone="light" /></Grid>
                <Grid item xs={12} md={4}><StatCard label="Total Credit" value={formatReportAmount(totalCredit)} tone="muted" /></Grid>
            </Grid>

            <SurfaceCard lowChrome>
                <FilterToolbar
                    onApply={() => apply(localFilters)}
                    onReset={() => apply({ from: '', to: '' })}
                    lowChrome
                    title="Filters"
                    subtitle="Select date range and apply to refresh day book."
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
                        { key: 'entry_no', label: 'Entry No', minWidth: 170 },
                        { key: 'entry_date', label: 'Date', minWidth: 130 },
                        { key: 'restaurant_name', label: 'Restaurant', minWidth: 170 },
                        { key: 'source_label', label: 'Source', minWidth: 170 },
                        { key: 'description', label: 'Description', minWidth: 260 },
                        { key: 'debit_total', label: 'Debit', minWidth: 130, align: 'right' },
                        { key: 'credit_total', label: 'Credit', minWidth: 130, align: 'right' },
                    ]}
                    rows={rowsData}
                    pagination={rows}
                    tableMinWidth={960}
                    emptyMessage="No day book entries found."
                    renderRow={(row) => (
                        <TableRow key={row.id} hover>
                            <TableCell>{row.entry_no}</TableCell>
                            <TableCell>{row.entry_date}</TableCell>
                            <TableCell>{row.restaurant_name || '-'}</TableCell>
                            <TableCell>{row.source_label || '-'}</TableCell>
                            <TableCell>{row.memo || row.description || '-'}</TableCell>
                            <TableCell align="right">{formatReportAmount(row.debit_total)}</TableCell>
                            <TableCell align="right">{formatReportAmount(row.credit_total)}</TableCell>
                        </TableRow>
                    )}
                />
            </SurfaceCard>
        </AppPage>
    );
}
