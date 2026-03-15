import React from 'react';
import { router, useForm } from '@inertiajs/react';
import debounce from 'lodash.debounce';
import {
    Alert,
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    IconButton,
    MenuItem,
    TableCell,
    TableRow,
    TextField,
    Typography,
} from '@mui/material';
import { Add, DeleteOutline } from '@mui/icons-material';
import AppPage from '@/components/App/ui/AppPage';
import AdminDataTable from '@/components/App/ui/AdminDataTable';
import FilterToolbar from '@/components/App/ui/FilterToolbar';
import StatCard from '@/components/App/ui/StatCard';
import SurfaceCard from '@/components/App/ui/SurfaceCard';

const standardRuleCodes = [
    { code: 'membership_invoice', label: 'Membership Invoice' },
    { code: 'membership_receipt', label: 'Membership Receipt' },
    { code: 'subscription_invoice', label: 'Subscription Invoice' },
    { code: 'subscription_receipt', label: 'Subscription Receipt' },
    { code: 'pos_invoice', label: 'POS Invoice' },
    { code: 'pos_receipt', label: 'POS Receipt' },
    { code: 'room_invoice', label: 'Room Invoice' },
    { code: 'room_receipt', label: 'Room Receipt' },
    { code: 'event_invoice', label: 'Event Invoice' },
    { code: 'event_receipt', label: 'Event Receipt' },
    { code: 'purchase_receipt', label: 'Goods Receipt' },
    { code: 'vendor_bill', label: 'Vendor Bill' },
    { code: 'vendor_payment', label: 'Vendor Payment' },
];

export default function Index({ rules, coaAccounts = [], filters }) {
    const [openModal, setOpenModal] = React.useState(false);
    const [editingRuleId, setEditingRuleId] = React.useState(null);
    const rows = rules?.data || [];
    const [localFilters, setLocalFilters] = React.useState({
        search: filters?.search || '',
        status: filters?.status || '',
        per_page: filters?.per_page || rules?.per_page || 25,
        page: 1,
    });
    const filtersRef = React.useRef(localFilters);
    const { data, setData, post, put, processing, errors, reset } = useForm({
        code: '',
        name: '',
        is_active: true,
        lines: [
            { account_id: '', side: 'debit', ratio: 1, use_payment_account: false },
            { account_id: '', side: 'credit', ratio: 1, use_payment_account: false },
        ],
    });

    const accountMap = React.useMemo(() => {
        const map = new Map();
        (coaAccounts || []).forEach((account) => map.set(Number(account.id), account));
        return map;
    }, [coaAccounts]);

    const existingCodes = React.useMemo(() => new Set(rows.map((rule) => rule.code)), [rows]);
    const missingStandardRules = standardRuleCodes.filter((item) => !existingCodes.has(item.code));

    const submitFilters = React.useCallback((nextFilters) => {
        const payload = {};

        if (nextFilters.search?.trim()) payload.search = nextFilters.search.trim();
        if (nextFilters.status) payload.status = nextFilters.status;
        payload.per_page = nextFilters.per_page || 25;
        if (Number(nextFilters.page) > 1) payload.page = Number(nextFilters.page);

        router.get(route('accounting.rules.index'), payload, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    }, []);

    const debouncedSubmit = React.useMemo(() => debounce((nextFilters) => submitFilters(nextFilters), 350), [submitFilters]);

    React.useEffect(() => () => debouncedSubmit.cancel(), [debouncedSubmit]);

    React.useEffect(() => {
        const next = {
            search: filters?.search || '',
            status: filters?.status || '',
            per_page: filters?.per_page || rules?.per_page || 25,
            page: 1,
        };
        filtersRef.current = next;
        setLocalFilters(next);
    }, [filters?.per_page, filters?.search, filters?.status, rules?.per_page]);

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

    const resetFilters = React.useCallback(() => {
        const cleared = {
            search: '',
            status: '',
            per_page: filtersRef.current.per_page || rules?.per_page || 25,
            page: 1,
        };
        debouncedSubmit.cancel();
        filtersRef.current = cleared;
        setLocalFilters(cleared);
        submitFilters(cleared);
    }, [debouncedSubmit, rules?.per_page, submitFilters]);

    const resetFormState = React.useCallback(() => {
        reset();
        setData({
            code: '',
            name: '',
            is_active: true,
            lines: [
                { account_id: '', side: 'debit', ratio: 1, use_payment_account: false },
                { account_id: '', side: 'credit', ratio: 1, use_payment_account: false },
            ],
        });
    }, [reset, setData]);

    const openCreate = () => {
        setEditingRuleId(null);
        resetFormState();
        setOpenModal(true);
    };

    const openEdit = (rule) => {
        setEditingRuleId(rule.id);
        setData({
            code: rule.code,
            name: rule.name,
            is_active: !!rule.is_active,
            lines: (rule.lines || []).map((line) => ({
                account_id: line.account_id || '',
                side: line.side || 'debit',
                ratio: line.ratio ?? 1,
                use_payment_account: !!line.use_payment_account,
            })),
        });
        setOpenModal(true);
    };

    const updateLine = (index, key, value) => {
        const next = [...data.lines];
        next[index] = { ...next[index], [key]: value };
        setData('lines', next);
    };

    const addLine = () => {
        setData('lines', [...data.lines, { account_id: '', side: 'debit', ratio: 1, use_payment_account: false }]);
    };

    const removeLine = (index) => {
        setData('lines', data.lines.filter((_, i) => i !== index));
    };

    const submit = (event) => {
        event.preventDefault();

        if (editingRuleId) {
            put(route('accounting.rules.update', editingRuleId), {
                onSuccess: () => {
                    setOpenModal(false);
                    resetFormState();
                },
            });
            return;
        }

        post(route('accounting.rules.store'), {
            onSuccess: () => {
                setOpenModal(false);
                resetFormState();
            },
        });
    };

    const activeRules = rows.filter((rule) => rule.is_active).length;
    const bankMappedLines = rows.reduce((sum, rule) => sum + (rule.lines || []).filter((line) => line.use_payment_account).length, 0);

    const columns = [
        { key: 'code', label: 'Code', minWidth: 190 },
        { key: 'name', label: 'Rule', minWidth: 220 },
        { key: 'lines', label: 'Lines', minWidth: 90, align: 'right' },
        { key: 'mapped', label: 'Bank Mapped', minWidth: 130, align: 'right' },
        { key: 'status', label: 'Status', minWidth: 120 },
        { key: 'action', label: 'Action', minWidth: 170, align: 'center' },
    ];

    return (
        <>
            <AppPage
                eyebrow="Accounting"
                title="Posting Rules"
                subtitle="Control how each source module posts into accounting with stronger visibility, coverage checks, and cleaner rule maintenance."
                actions={[
                    <Button key="add" variant="contained" startIcon={<Add />} onClick={openCreate}>
                        Add Rule
                    </Button>,
                ]}
            >
                <Grid container spacing={2.25}>
                    <Grid item xs={12} md={3}><StatCard label="Rules" value={rules?.total || rows.length} accent /></Grid>
                    <Grid item xs={12} md={3}><StatCard label="Active Rules" value={activeRules} tone="light" /></Grid>
                    <Grid item xs={12} md={3}><StatCard label="Coverage Gaps" value={missingStandardRules.length} tone="muted" /></Grid>
                    <Grid item xs={12} md={3}><StatCard label="Bank-Mapped Lines" value={bankMappedLines} tone="light" /></Grid>
                </Grid>

                {missingStandardRules.length > 0 ? (
                    <Alert severity="warning" variant="outlined">
                        Missing rule mappings: {missingStandardRules.map((item) => item.code).join(', ')}
                    </Alert>
                ) : null}

                <SurfaceCard title="Coverage Matrix" subtitle="Standard integration events that should be mapped before accounting cutover is considered complete.">
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {standardRuleCodes.map((item) => (
                            <Chip
                                key={item.code}
                                label={`${item.label} (${item.code})`}
                                size="small"
                                color={existingCodes.has(item.code) ? 'success' : 'warning'}
                                variant={existingCodes.has(item.code) ? 'filled' : 'outlined'}
                            />
                        ))}
                    </Box>
                </SurfaceCard>

                <SurfaceCard title="Live Filters" subtitle="Filter posting rules by code, name, and activation status without using a manual search step.">
                    <FilterToolbar onReset={resetFilters}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={8}>
                                <TextField
                                    label="Search code or rule name"
                                    value={localFilters.search}
                                    onChange={(event) => updateFilters({ search: event.target.value })}
                                    fullWidth
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField
                                    select
                                    label="Status"
                                    value={localFilters.status}
                                    onChange={(event) => updateFilters({ status: event.target.value }, { immediate: true })}
                                    fullWidth
                                >
                                    <MenuItem value="">All rules</MenuItem>
                                    <MenuItem value="active">Active</MenuItem>
                                    <MenuItem value="inactive">Inactive</MenuItem>
                                </TextField>
                            </Grid>
                        </Grid>
                    </FilterToolbar>
                </SurfaceCard>

                <SurfaceCard title="Rule Register" subtitle="Shared accounting table with consistent pagination, activation state, and direct maintenance actions.">
                    <AdminDataTable
                        columns={columns}
                        rows={rows}
                        pagination={rules}
                        emptyMessage="No posting rules found."
                        tableMinWidth={980}
                        renderRow={(rule) => (
                            <TableRow key={rule.id} hover>
                                <TableCell sx={{ fontWeight: 700, color: 'text.primary' }}>{rule.code}</TableCell>
                                <TableCell>{rule.name}</TableCell>
                                <TableCell align="right">{(rule.lines || []).length}</TableCell>
                                <TableCell align="right">{(rule.lines || []).filter((line) => line.use_payment_account).length}</TableCell>
                                <TableCell>
                                    <Chip
                                        label={rule.is_active ? 'Active' : 'Inactive'}
                                        size="small"
                                        color={rule.is_active ? 'success' : 'default'}
                                        variant="outlined"
                                    />
                                </TableCell>
                                <TableCell align="center">
                                    <Box sx={{ display: 'inline-flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
                                        <Button size="small" variant="outlined" onClick={() => openEdit(rule)}>
                                            Edit
                                        </Button>
                                        <Button
                                            size="small"
                                            color="error"
                                            variant="outlined"
                                            onClick={() => router.delete(route('accounting.rules.destroy', rule.id))}
                                        >
                                            Delete
                                        </Button>
                                    </Box>
                                </TableCell>
                            </TableRow>
                        )}
                    />
                </SurfaceCard>
            </AppPage>

            <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="md" fullWidth>
                <DialogTitle>{editingRuleId ? 'Edit Posting Rule' : 'Add Posting Rule'}</DialogTitle>
                <form onSubmit={submit}>
                    <DialogContent>
                        <Grid container spacing={2} sx={{ mt: 0 }}>
                            <Grid item xs={12} md={4}>
                                <TextField
                                    label="Code"
                                    value={data.code}
                                    onChange={(event) => setData('code', event.target.value)}
                                    error={!!errors.code}
                                    helperText={errors.code}
                                    fullWidth
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    label="Name"
                                    value={data.name}
                                    onChange={(event) => setData('name', event.target.value)}
                                    error={!!errors.name}
                                    helperText={errors.name}
                                    fullWidth
                                />
                            </Grid>
                            <Grid item xs={12} md={2}>
                                <TextField
                                    select
                                    label="Active"
                                    value={data.is_active ? 'yes' : 'no'}
                                    onChange={(event) => setData('is_active', event.target.value === 'yes')}
                                    fullWidth
                                >
                                    <MenuItem value="yes">Yes</MenuItem>
                                    <MenuItem value="no">No</MenuItem>
                                </TextField>
                            </Grid>
                        </Grid>

                        <Box sx={{ mt: 3 }}>
                            <Typography variant="h6" sx={{ mb: 1 }}>
                                Rule Lines
                            </Typography>
                            {errors.lines ? (
                                <Typography variant="caption" color="error" sx={{ display: 'block', mb: 1 }}>
                                    {errors.lines}
                                </Typography>
                            ) : null}

                            {data.lines.map((line, index) => {
                                const selectedAccount = accountMap.get(Number(line.account_id));
                                const accountFieldError = errors[`lines.${index}.account_id`];
                                const ratioFieldError = errors[`lines.${index}.ratio`];

                                return (
                                    <Grid container spacing={2} key={index} sx={{ mb: 2 }}>
                                        <Grid item xs={12} md={5}>
                                            <TextField
                                                select
                                                label="COA Account"
                                                value={line.account_id}
                                                onChange={(event) => updateLine(index, 'account_id', event.target.value)}
                                                fullWidth
                                                disabled={!!line.use_payment_account}
                                                error={!!accountFieldError}
                                                helperText={
                                                    accountFieldError
                                                    || (line.use_payment_account
                                                        ? 'Will use selected payment or bank account mapping at runtime.'
                                                        : selectedAccount
                                                            ? `${selectedAccount.full_code} · ${selectedAccount.type} · L${selectedAccount.level}`
                                                            : 'Select posting account')
                                                }
                                            >
                                                <MenuItem value="">Select account</MenuItem>
                                                {coaAccounts.map((account) => (
                                                    <MenuItem key={account.id} value={account.id}>
                                                        {account.full_code} - {account.name}
                                                    </MenuItem>
                                                ))}
                                            </TextField>
                                        </Grid>
                                        <Grid item xs={12} md={2}>
                                            <TextField
                                                select
                                                label="Side"
                                                value={line.side}
                                                onChange={(event) => updateLine(index, 'side', event.target.value)}
                                                fullWidth
                                            >
                                                <MenuItem value="debit">Debit</MenuItem>
                                                <MenuItem value="credit">Credit</MenuItem>
                                            </TextField>
                                        </Grid>
                                        <Grid item xs={12} md={2}>
                                            <TextField
                                                label="Ratio"
                                                type="number"
                                                value={line.ratio}
                                                onChange={(event) => updateLine(index, 'ratio', event.target.value)}
                                                fullWidth
                                                error={!!ratioFieldError}
                                                helperText={ratioFieldError}
                                            />
                                        </Grid>
                                        <Grid item xs={12} md={2}>
                                            <TextField
                                                select
                                                label="Bank Map"
                                                value={line.use_payment_account ? 'yes' : 'no'}
                                                onChange={(event) => {
                                                    const usePaymentAccount = event.target.value === 'yes';
                                                    updateLine(index, 'use_payment_account', usePaymentAccount);
                                                    if (usePaymentAccount) {
                                                        updateLine(index, 'account_id', '');
                                                    }
                                                }}
                                                fullWidth
                                            >
                                                <MenuItem value="no">No</MenuItem>
                                                <MenuItem value="yes">Yes</MenuItem>
                                            </TextField>
                                        </Grid>
                                        <Grid item xs={12} md={1} sx={{ display: 'flex', alignItems: 'center' }}>
                                            <IconButton color="error" onClick={() => removeLine(index)} disabled={data.lines.length <= 2}>
                                                <DeleteOutline />
                                            </IconButton>
                                        </Grid>
                                    </Grid>
                                );
                            })}

                            <Button onClick={addLine}>Add Line</Button>
                        </Box>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 2 }}>
                        <Button onClick={() => setOpenModal(false)}>Cancel</Button>
                        <Button type="submit" variant="contained" disabled={processing}>
                            Save Rule
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </>
    );
}
