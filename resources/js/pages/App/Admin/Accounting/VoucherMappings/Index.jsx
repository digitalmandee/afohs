import React from 'react';
import { useForm } from '@inertiajs/react';
import { Chip, Grid, MenuItem, Stack, TableCell, TableRow, TextField } from '@mui/material';
import AppPage from '@/components/App/ui/AppPage';
import SurfaceCard from '@/components/App/ui/SurfaceCard';
import AdminDataTable from '@/components/App/ui/AdminDataTable';
import AppLoadingButton from '@/components/App/ui/AppLoadingButton';

export default function VoucherMappingsIndex({ accounts = [], mappings = [], expenseTypes = [], defaults = {}, health = {} }) {
    const defaultForm = useForm({
        default_payable_account_id: String(defaults.default_payable_account_id || ''),
        default_advance_account_id: String(defaults.default_advance_account_id || ''),
        default_expense_account_id: String(defaults.default_expense_account_id || ''),
        default_receivable_account_id: String(defaults.default_receivable_account_id || ''),
    });
    const entityForm = useForm({
        entity_type: 'vendor',
        entity_id: '',
        role: 'payable',
        account_id: '',
        is_active: true,
    });
    const expenseForm = useForm({
        id: '',
        code: '',
        name: '',
        expense_account_id: '',
        is_active: true,
    });

    const accountLabel = (id) => {
        const account = accounts.find((row) => String(row.id) === String(id));
        return account ? `${account.full_code} - ${account.name}` : '-';
    };

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

            <SurfaceCard title="Entity Mapping Upsert" subtitle="Create or update one mapping record.">
                <Grid container spacing={2}>
                    <Grid item xs={12} md={2}>
                        <TextField select label="Entity Type" fullWidth size="small" value={entityForm.data.entity_type} onChange={(e) => entityForm.setData('entity_type', e.target.value)}>
                            {['vendor', 'customer', 'member', 'corporate_member'].map((type) => (
                                <MenuItem key={type} value={type}>{type}</MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                    <Grid item xs={12} md={2}>
                        <TextField label="Entity ID" fullWidth size="small" value={entityForm.data.entity_id} onChange={(e) => entityForm.setData('entity_id', e.target.value)} />
                    </Grid>
                    <Grid item xs={12} md={2}>
                        <TextField select label="Role" fullWidth size="small" value={entityForm.data.role} onChange={(e) => entityForm.setData('role', e.target.value)}>
                            <MenuItem value="payable">payable</MenuItem>
                            <MenuItem value="receivable">receivable</MenuItem>
                        </TextField>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <TextField select label="Mapped Account" fullWidth size="small" value={entityForm.data.account_id} onChange={(e) => entityForm.setData('account_id', e.target.value)}>
                            {accounts.map((account) => (
                                <MenuItem key={account.id} value={String(account.id)}>
                                    {account.full_code} - {account.name}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                    <Grid item xs={12} md={2} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AppLoadingButton
                            fullWidth
                            loading={entityForm.processing}
                            loadingText="Saving..."
                            onClick={() => entityForm.post(route('accounting.vouchers.mappings.entity'))}
                        >
                            Save Mapping
                        </AppLoadingButton>
                    </Grid>
                </Grid>
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

            <SurfaceCard title="Current Entity Mappings" subtitle="Recent mappings used by voucher engine.">
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
