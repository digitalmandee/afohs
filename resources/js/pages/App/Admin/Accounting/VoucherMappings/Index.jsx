import React from 'react';
import { router, useForm } from '@inertiajs/react';
import debounce from 'lodash.debounce';
import { Chip, Grid, MenuItem, Stack, TableCell, TableRow, TextField } from '@mui/material';
import AppPage from '@/components/App/ui/AppPage';
import SurfaceCard from '@/components/App/ui/SurfaceCard';
import AdminDataTable from '@/components/App/ui/AdminDataTable';
import AppLoadingButton from '@/components/App/ui/AppLoadingButton';

export default function VoucherMappingsIndex({
    accounts = [],
    mappings = [],
    entityCandidates = { data: [] },
    entitySummary = {},
    expenseTypes = [],
    defaults = {},
    health = {},
    filters = {},
}) {
    const defaultForm = useForm({
        default_payable_account_id: String(defaults.default_payable_account_id || ''),
        default_advance_account_id: String(defaults.default_advance_account_id || ''),
        default_expense_account_id: String(defaults.default_expense_account_id || ''),
        default_receivable_account_id: String(defaults.default_receivable_account_id || ''),
    });
    const expenseForm = useForm({
        id: '',
        code: '',
        name: '',
        expense_account_id: '',
        is_active: true,
    });
    const [entityAccountSelection, setEntityAccountSelection] = React.useState({});
    const [localFilters, setLocalFilters] = React.useState({
        map_filter: filters?.map_filter || 'all',
        entity_type: filters?.entity_type || 'vendor',
        search: filters?.search || '',
        per_page: entityCandidates?.per_page || filters?.per_page || 50,
        page: 1,
    });
    const filtersRef = React.useRef(localFilters);
    const [savingEntityKey, setSavingEntityKey] = React.useState('');

    React.useEffect(() => {
        const entries = {};
        (entityCandidates?.data || []).forEach((row) => {
            entries[`${row.entity_type}:${row.entity_id}:${row.role}`] = row.account_id ? String(row.account_id) : '';
        });
        setEntityAccountSelection(entries);
    }, [entityCandidates]);

    React.useEffect(() => {
        const next = {
            map_filter: filters?.map_filter || 'all',
            entity_type: filters?.entity_type || 'vendor',
            search: filters?.search || '',
            per_page: entityCandidates?.per_page || filters?.per_page || 50,
            page: 1,
        };
        filtersRef.current = next;
        setLocalFilters(next);
    }, [entityCandidates?.per_page, filters?.entity_type, filters?.map_filter, filters?.per_page, filters?.search]);

    const submitFilters = React.useCallback((nextFilters) => {
        const payload = {};
        if (nextFilters.map_filter && nextFilters.map_filter !== 'all') payload.map_filter = nextFilters.map_filter;
        if (nextFilters.entity_type && nextFilters.entity_type !== 'vendor') payload.entity_type = nextFilters.entity_type;
        if (nextFilters.search?.trim()) payload.search = nextFilters.search.trim();
        payload.per_page = nextFilters.per_page || entityCandidates?.per_page || 50;
        if (Number(nextFilters.page) > 1) payload.page = Number(nextFilters.page);

        router.get(route('accounting.vouchers.mappings.index'), payload, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    }, [entityCandidates?.per_page]);

    const debouncedSubmit = React.useMemo(() => debounce((next) => submitFilters(next), 300), [submitFilters]);
    React.useEffect(() => () => debouncedSubmit.cancel(), [debouncedSubmit]);

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

    const accountLabel = (id) => {
        const account = accounts.find((row) => String(row.id) === String(id));
        return account ? `${account.full_code} - ${account.name}` : '-';
    };

    const rows = entityCandidates?.data || [];
    const mappedCount = rows.filter((row) => row.is_mapped).length;
    const unmappedCount = rows.filter((row) => !row.is_mapped).length;
    const entityTypeOptions = [
        { value: 'vendor', label: `Vendor (${entitySummary?.vendor || 0})` },
        { value: 'customer', label: `Customer (${entitySummary?.customer || 0})` },
        { value: 'member', label: `Member (${entitySummary?.member || 0})` },
        { value: 'corporate_member', label: `Corporate (${entitySummary?.corporate_member || 0})` },
    ];

    return (
        <AppPage
            eyebrow="Accounting"
            title="Voucher Mappings"
            subtitle="Configure entity/expense GL mappings and fallback defaults used by intelligent vouchers."
        >
            <SurfaceCard title="Health Snapshot" subtitle="Posting blocks when these fail.">
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    <Chip color={health.unmapped_vendors ? 'warning' : 'success'} label={`Unmapped Vendors: ${health.unmapped_vendors || 0}`} />
                    <Chip color={health.inactive_or_non_postable_mappings ? 'warning' : 'success'} label={`Invalid Mappings: ${health.inactive_or_non_postable_mappings || 0}`} />
                    <Chip color={health.missing_default_payable ? 'warning' : 'success'} label={`Default Payable: ${health.missing_default_payable ? 'Missing' : 'Set'}`} />
                    <Chip color={health.missing_default_advance ? 'warning' : 'success'} label={`Default Advance: ${health.missing_default_advance ? 'Missing' : 'Set'}`} />
                    <Chip color={health.missing_default_expense ? 'warning' : 'success'} label={`Default Expense: ${health.missing_default_expense ? 'Missing' : 'Set'}`} />
                    <Chip color={health.missing_default_receivable ? 'warning' : 'success'} label={`Default Receivable: ${health.missing_default_receivable ? 'Missing' : 'Set'}`} />
                </Stack>
            </SurfaceCard>

            <SurfaceCard title="Default Fallback Accounts" subtitle="Used when entity-specific mapping is not available.">
                <Grid container spacing={2}>
                    <Grid item xs={12} md={3}>
                        <TextField
                            select
                            label="Default Payable Account"
                            fullWidth
                            size="small"
                            value={defaultForm.data.default_payable_account_id}
                            onChange={(event) => defaultForm.setData('default_payable_account_id', event.target.value)}
                        >
                            {accounts.map((account) => (
                                <MenuItem key={account.id} value={String(account.id)}>
                                    {account.full_code} - {account.name}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <TextField
                            select
                            label="Default Advance Account"
                            fullWidth
                            size="small"
                            value={defaultForm.data.default_advance_account_id}
                            onChange={(event) => defaultForm.setData('default_advance_account_id', event.target.value)}
                        >
                            {accounts.map((account) => (
                                <MenuItem key={account.id} value={String(account.id)}>
                                    {account.full_code} - {account.name}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <TextField
                            select
                            label="Default Expense Account"
                            fullWidth
                            size="small"
                            value={defaultForm.data.default_expense_account_id}
                            onChange={(event) => defaultForm.setData('default_expense_account_id', event.target.value)}
                        >
                            {accounts.map((account) => (
                                <MenuItem key={account.id} value={String(account.id)}>
                                    {account.full_code} - {account.name}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                    <Grid item xs={12} md={2}>
                        <TextField
                            select
                            label="Default Receivable Account"
                            fullWidth
                            size="small"
                            value={defaultForm.data.default_receivable_account_id}
                            onChange={(event) => defaultForm.setData('default_receivable_account_id', event.target.value)}
                        >
                            {accounts.map((account) => (
                                <MenuItem key={account.id} value={String(account.id)}>
                                    {account.full_code} - {account.name}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                    <Grid item xs={12} md={1} sx={{ display: 'flex', alignItems: 'center' }}>
                        <AppLoadingButton
                            fullWidth
                            loading={defaultForm.processing}
                            loadingText="Saving..."
                            onClick={() => defaultForm.put(route('accounting.vouchers.mappings.defaults'))}
                        >
                            Save
                        </AppLoadingButton>
                    </Grid>
                </Grid>
            </SurfaceCard>

            <SurfaceCard title="Entity Mapping Registry" subtitle="All entities are listed here. Map or edit directly (mapped + unmapped).">
                <Stack direction="row" spacing={1} sx={{ mb: 1.5 }} flexWrap="wrap" useFlexGap>
                    <Chip
                        size="small"
                        color={localFilters.map_filter === 'all' ? 'primary' : 'default'}
                        label={`Page Rows: ${rows.length}`}
                        onClick={() => updateFilters({ map_filter: 'all' }, { immediate: true })}
                    />
                    <Chip
                        size="small"
                        color={localFilters.map_filter === 'unmapped' ? 'warning' : 'default'}
                        label={`Unmapped: ${unmappedCount}`}
                        onClick={() => updateFilters({ map_filter: 'unmapped' }, { immediate: true })}
                    />
                    <Chip
                        size="small"
                        color={localFilters.map_filter === 'mapped' ? 'success' : 'default'}
                        label={`Mapped: ${mappedCount}`}
                        onClick={() => updateFilters({ map_filter: 'mapped' }, { immediate: true })}
                    />
                    <TextField
                        select
                        size="small"
                        label="Entity Type"
                        value={localFilters.entity_type}
                        onChange={(event) => updateFilters({ entity_type: event.target.value }, { immediate: true })}
                        sx={{ minWidth: 190 }}
                    >
                        {entityTypeOptions.map((type) => (
                            <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
                        ))}
                    </TextField>
                    <TextField
                        size="small"
                        label="Search entity"
                        value={localFilters.search}
                        onChange={(event) => updateFilters({ search: event.target.value })}
                        sx={{ minWidth: 240 }}
                    />
                </Stack>
                <AdminDataTable
                    columns={[
                        { key: 'entity', label: 'Entity', minWidth: 280 },
                        { key: 'role', label: 'Role', minWidth: 120 },
                        { key: 'status', label: 'Map Status', minWidth: 120 },
                        { key: 'account', label: 'GL Account', minWidth: 360 },
                        { key: 'actions', label: 'Actions', minWidth: 140, align: 'right' },
                    ]}
                    rows={rows}
                    pagination={entityCandidates}
                    emptyMessage="No entities found."
                    renderRow={(row) => {
                        const rowKey = `${row.entity_type}:${row.entity_id}:${row.role}`;
                        const selectedAccountId = entityAccountSelection[rowKey] ?? '';
                        return (
                            <TableRow key={rowKey} hover>
                                <TableCell>
                                    <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
                                        <Chip size="small" label={row.entity_type} variant="outlined" />
                                        <span>{row.entity_name}</span>
                                        {row.entity_code ? <Chip size="small" label={row.entity_code} /> : null}
                                    </Stack>
                                </TableCell>
                                <TableCell>{row.role}</TableCell>
                                <TableCell>
                                    <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
                                        <Chip
                                            size="small"
                                            color={row.is_mapped ? 'success' : 'warning'}
                                            label={row.is_mapped ? 'Mapped' : 'Unmapped'}
                                        />
                                        {row.mapping_source ? (
                                            <Chip size="small" variant="outlined" label={row.mapping_source === 'vendor_default' ? 'Vendor Default' : 'Entity Map'} />
                                        ) : null}
                                    </Stack>
                                </TableCell>
                                <TableCell>
                                    <TextField
                                        select
                                        size="small"
                                        fullWidth
                                        value={selectedAccountId}
                                        onChange={(event) => {
                                            setEntityAccountSelection((prev) => ({
                                                ...prev,
                                                [rowKey]: event.target.value,
                                            }));
                                        }}
                                    >
                                        <MenuItem value="">Select account</MenuItem>
                                        {accounts.map((account) => (
                                            <MenuItem key={account.id} value={String(account.id)}>
                                                {account.full_code} - {account.name}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                </TableCell>
                                <TableCell align="right">
                                    <AppLoadingButton
                                        size="small"
                                        loading={savingEntityKey === rowKey}
                                        loadingText="Saving..."
                                        disabled={!selectedAccountId}
                                        onClick={() => {
                                            setSavingEntityKey(rowKey);
                                            router.post(route('accounting.vouchers.mappings.entity'), {
                                                entity_type: row.entity_type,
                                                entity_id: row.entity_id,
                                                role: row.role,
                                                account_id: selectedAccountId,
                                                is_active: true,
                                            }, {
                                                preserveScroll: true,
                                                onFinish: () => setSavingEntityKey(''),
                                            });
                                        }}
                                    >
                                        Save
                                    </AppLoadingButton>
                                </TableCell>
                            </TableRow>
                        );
                    }}
                />
            </SurfaceCard>

            <SurfaceCard title="Expense Type Mapping Upsert" subtitle="Quickly maintain expense types used by quick entry vouchers.">
                <Grid container spacing={2}>
                    <Grid item xs={12} md={2}>
                        <TextField label="Expense Type ID (optional)" fullWidth size="small" value={expenseForm.data.id} onChange={(e) => expenseForm.setData('id', e.target.value)} />
                    </Grid>
                    <Grid item xs={12} md={2}>
                        <TextField label="Code" fullWidth size="small" value={expenseForm.data.code} onChange={(e) => expenseForm.setData('code', e.target.value)} />
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <TextField label="Name" fullWidth size="small" value={expenseForm.data.name} onChange={(e) => expenseForm.setData('name', e.target.value)} />
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <TextField select label="Expense GL Account" fullWidth size="small" value={expenseForm.data.expense_account_id} onChange={(e) => expenseForm.setData('expense_account_id', e.target.value)}>
                            {accounts.map((account) => (
                                <MenuItem key={account.id} value={String(account.id)}>
                                    {account.full_code} - {account.name}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                    <Grid item xs={12} md={2} sx={{ display: 'flex', alignItems: 'center' }}>
                        <AppLoadingButton
                            fullWidth
                            loading={expenseForm.processing}
                            loadingText="Saving..."
                            onClick={() => expenseForm.post(route('accounting.vouchers.mappings.expense-type'))}
                        >
                            Save Expense
                        </AppLoadingButton>
                    </Grid>
                </Grid>
            </SurfaceCard>

            <SurfaceCard title="Recent Mapping Records" subtitle="Audit view of latest mapping rows.">
                <AdminDataTable
                    columns={[
                        { key: 'entity', label: 'Entity', minWidth: 220 },
                        { key: 'role', label: 'Role', minWidth: 120 },
                        { key: 'account', label: 'Account', minWidth: 280 },
                        { key: 'active', label: 'Active', minWidth: 90 },
                    ]}
                    rows={mappings}
                    pagination={null}
                    emptyMessage="No mappings configured."
                    renderRow={(row) => (
                        <TableRow key={row.id} hover>
                            <TableCell>{row.entity_type} #{row.entity_id}</TableCell>
                            <TableCell>{row.role}</TableCell>
                            <TableCell>{accountLabel(row.account_id)}</TableCell>
                            <TableCell>{row.is_active ? 'Yes' : 'No'}</TableCell>
                        </TableRow>
                    )}
                />
            </SurfaceCard>

            <SurfaceCard title="Expense Type Map" subtitle="Configured quick-entry expense types.">
                <AdminDataTable
                    columns={[
                        { key: 'code', label: 'Code', minWidth: 140 },
                        { key: 'name', label: 'Name', minWidth: 220 },
                        { key: 'account', label: 'Expense Account', minWidth: 320 },
                        { key: 'active', label: 'Active', minWidth: 90 },
                    ]}
                    rows={expenseTypes}
                    pagination={null}
                    emptyMessage="No expense types configured."
                    renderRow={(row) => (
                        <TableRow key={row.id} hover>
                            <TableCell>{row.code}</TableCell>
                            <TableCell>{row.name}</TableCell>
                            <TableCell>{row.expense_account ? `${row.expense_account.full_code} - ${row.expense_account.name}` : '-'}</TableCell>
                            <TableCell>{row.is_active ? 'Yes' : 'No'}</TableCell>
                        </TableRow>
                    )}
                />
            </SurfaceCard>
        </AppPage>
    );
}
