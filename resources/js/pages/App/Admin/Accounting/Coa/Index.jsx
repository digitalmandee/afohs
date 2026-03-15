import React from 'react';
import { router, useForm } from '@inertiajs/react';
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
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { Add, ChevronRight, DeleteOutline, ExpandMore, OpenInNew, UploadFile } from '@mui/icons-material';
import AppPage from '@/components/App/ui/AppPage';
import FilterToolbar from '@/components/App/ui/FilterToolbar';
import StatCard from '@/components/App/ui/StatCard';
import SurfaceCard from '@/components/App/ui/SurfaceCard';

const typeLabels = {
    asset: 'Asset',
    liability: 'Liability',
    equity: 'Equity',
    income: 'Revenue',
    expense: 'Expense',
};

const typeTone = {
    asset: 'primary',
    liability: 'warning',
    equity: 'secondary',
    income: 'success',
    expense: 'error',
};

const normalizeParts = (parts = []) => parts.map((part) => String(part ?? '').trim());

const getHierarchyInfo = (parts = []) => {
    const [s1, s2, s3, s4] = normalizeParts(parts);
    if (!s1) return { level: 0, hasGap: false, segments: [] };
    if (!s2 && (s3 || s4)) return { level: 1, hasGap: true, segments: [s1] };
    if (!s3 && s4) return { level: 2, hasGap: true, segments: [s1, s2].filter(Boolean) };
    const segments = [s1, s2, s3, s4].filter(Boolean);
    return { level: segments.length, hasGap: false, segments };
};

const matchesPrefix = (account, segments = []) => {
    const prefix = [account.segment1, account.segment2, account.segment3, account.segment4].filter(Boolean);
    if (prefix.length > segments.length) return false;

    for (let index = 0; index < prefix.length; index += 1) {
        if (String(prefix[index]) !== String(segments[index])) return false;
    }

    return true;
};

const FormFields = ({
    formData,
    setFormData,
    errors,
    accounts,
    eligibleParents,
    hierarchyInfo,
    selectedParent,
    submitLabel,
}) => (
    <Grid container spacing={2} sx={{ mt: 0 }}>
        <Grid item xs={12} md={3}>
            <TextField label="Segment 1" value={formData.segment1} onChange={(event) => setFormData('segment1', event.target.value)} error={!!errors.segment1} helperText={errors.segment1} fullWidth />
        </Grid>
        <Grid item xs={12} md={3}>
            <TextField label="Segment 2" value={formData.segment2} onChange={(event) => setFormData('segment2', event.target.value)} error={!!errors.segment2} helperText={errors.segment2} fullWidth />
        </Grid>
        <Grid item xs={12} md={3}>
            <TextField label="Segment 3" value={formData.segment3} onChange={(event) => setFormData('segment3', event.target.value)} error={!!errors.segment3} helperText={errors.segment3} fullWidth />
        </Grid>
        <Grid item xs={12} md={3}>
            <TextField label="Segment 4" value={formData.segment4} onChange={(event) => setFormData('segment4', event.target.value)} fullWidth />
        </Grid>
        <Grid item xs={12} md={6}>
            <TextField label="Account Name" value={formData.name} onChange={(event) => setFormData('name', event.target.value)} error={!!errors.name} helperText={errors.name} fullWidth />
        </Grid>
        <Grid item xs={12} md={3}>
            <TextField
                select
                label="Type"
                value={formData.type}
                onChange={(event) => setFormData('type', event.target.value)}
                error={!!errors.type}
                helperText={errors.type}
                disabled={!!selectedParent}
                fullWidth
            >
                <MenuItem value="asset">Asset</MenuItem>
                <MenuItem value="liability">Liability</MenuItem>
                <MenuItem value="equity">Equity</MenuItem>
                <MenuItem value="income">Income</MenuItem>
                <MenuItem value="expense">Expense</MenuItem>
            </TextField>
        </Grid>
        <Grid item xs={12} md={3}>
            <TextField
                select
                label="Parent"
                value={formData.parent_id}
                onChange={(event) => {
                    const next = event.target.value;
                    setFormData('parent_id', next);
                    const parent = accounts.find((account) => String(account.id) === String(next));
                    if (parent) {
                        setFormData('type', parent.type);
                    }
                }}
                fullWidth
            >
                <MenuItem value="">None</MenuItem>
                {eligibleParents.map((account) => (
                    <MenuItem key={account.id} value={account.id}>
                        {account.full_code} - {account.name}
                    </MenuItem>
                ))}
            </TextField>
        </Grid>
        <Grid item xs={12} md={3}>
            <TextField select label="Postable" value={formData.is_postable ? 'yes' : 'no'} onChange={(event) => setFormData('is_postable', event.target.value === 'yes')} fullWidth>
                <MenuItem value="yes">Yes</MenuItem>
                <MenuItem value="no">No</MenuItem>
            </TextField>
        </Grid>
        <Grid item xs={12} md={3}>
            <TextField select label="Active" value={formData.is_active ? 'yes' : 'no'} onChange={(event) => setFormData('is_active', event.target.value === 'yes')} fullWidth>
                <MenuItem value="yes">Yes</MenuItem>
                <MenuItem value="no">No</MenuItem>
            </TextField>
        </Grid>
        <Grid item xs={12}>
            <Typography variant="caption" color="text.secondary">
                Code Preview: {[formData.segment1, formData.segment2, formData.segment3, formData.segment4].filter((part) => String(part || '').trim() !== '').join('-') || '—'}
                {selectedParent ? ` · Type locked to ${typeLabels[selectedParent.type] || selectedParent.type}` : ''}
            </Typography>
        </Grid>
        <Grid item xs={12}>
            <Typography variant="caption" color={hierarchyInfo.hasGap ? 'error.main' : 'text.secondary'}>
                {submitLabel} level: {hierarchyInfo.level || 'n/a'} ·
                {hierarchyInfo.hasGap
                    ? ' Fill segments in order from level 1 to level 4.'
                    : hierarchyInfo.level <= 1
                        ? ' Root account without parent.'
                        : ` Parent must be level ${hierarchyInfo.level - 1} with matching prefix and type.`}
            </Typography>
        </Grid>
        {errors.parent_id ? (
            <Grid item xs={12}>
                <Typography variant="caption" color="error">{errors.parent_id}</Typography>
            </Grid>
        ) : null}
        {errors.is_active ? (
            <Grid item xs={12}>
                <Typography variant="caption" color="error">{errors.is_active}</Typography>
            </Grid>
        ) : null}
    </Grid>
);

export default function Index({ accounts, error = null }) {
    const [openModal, setOpenModal] = React.useState(false);
    const [openEditModal, setOpenEditModal] = React.useState(false);
    const [editingAccount, setEditingAccount] = React.useState(null);
    const [query, setQuery] = React.useState('');
    const [typeFilter, setTypeFilter] = React.useState('all');
    const [levelFilter, setLevelFilter] = React.useState('all');
    const [parentFilter, setParentFilter] = React.useState('all');
    const [showInactive, setShowInactive] = React.useState(false);
    const [expanded, setExpanded] = React.useState(() => new Set());
    const fileInputRef = React.useRef(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        segment1: '',
        segment2: '',
        segment3: '',
        segment4: '',
        name: '',
        type: 'asset',
        parent_id: '',
        is_postable: false,
        is_active: true,
    });

    const {
        data: editData,
        setData: setEditData,
        put,
        processing: editProcessing,
        errors: editErrors,
        reset: resetEdit,
    } = useForm({
        segment1: '',
        segment2: '',
        segment3: '',
        segment4: '',
        name: '',
        type: 'asset',
        parent_id: '',
        is_postable: false,
        is_active: true,
    });

    const accountMap = React.useMemo(() => {
        const map = new Map();
        accounts.forEach((account) => map.set(account.id, { ...account, children: [] }));
        accounts.forEach((account) => {
            if (account.parent_id && map.has(account.parent_id)) {
                map.get(account.parent_id).children.push(map.get(account.id));
            }
        });
        map.forEach((node) => node.children.sort((a, b) => String(a.full_code).localeCompare(String(b.full_code))));
        return map;
    }, [accounts]);

    const roots = React.useMemo(
        () => accounts
            .filter((account) => !account.parent_id || !accountMap.has(account.parent_id))
            .map((account) => accountMap.get(account.id))
            .filter(Boolean)
            .sort((a, b) => String(a.full_code).localeCompare(String(b.full_code))),
        [accountMap, accounts],
    );

    const aggregatedBalances = React.useMemo(() => {
        const totals = new Map();
        const walk = (node) => {
            let total = Number(node.direct_balance || 0);
            (node.children || []).forEach((child) => {
                total += walk(child);
            });
            totals.set(node.id, total);
            return total;
        };
        roots.forEach((root) => walk(root));
        return totals;
    }, [roots]);

    const activeAccounts = React.useMemo(() => accounts.filter((account) => account.is_active !== false), [accounts]);
    const parentOptions = React.useMemo(
        () => accounts
            .filter((account) => account.is_postable === false || account.is_postable === 0 || Number(account.level) < 4)
            .sort((a, b) => String(a.full_code).localeCompare(String(b.full_code))),
        [accounts],
    );

    const createHierarchyInfo = React.useMemo(() => getHierarchyInfo([data.segment1, data.segment2, data.segment3, data.segment4]), [data.segment1, data.segment2, data.segment3, data.segment4]);
    const selectedParent = data.parent_id ? accounts.find((account) => String(account.id) === String(data.parent_id)) : null;
    const eligibleCreateParents = React.useMemo(() => {
        if (createHierarchyInfo.hasGap || createHierarchyInfo.level <= 1) return [];
        const targetLevel = createHierarchyInfo.level - 1;
        return accounts
            .filter((account) => account.type === data.type)
            .filter((account) => Number(account.level) === targetLevel)
            .filter((account) => matchesPrefix(account, createHierarchyInfo.segments))
            .sort((a, b) => String(a.full_code).localeCompare(String(b.full_code)));
    }, [accounts, createHierarchyInfo, data.type]);

    const descendantIds = React.useMemo(() => {
        if (!editingAccount || !accountMap.has(editingAccount.id)) return new Set();
        const ids = new Set();
        const stack = [...(accountMap.get(editingAccount.id).children || [])];
        while (stack.length > 0) {
            const node = stack.pop();
            if (!node) continue;
            ids.add(Number(node.id));
            (node.children || []).forEach((child) => stack.push(child));
        }
        return ids;
    }, [accountMap, editingAccount]);

    const editHierarchyInfo = React.useMemo(() => getHierarchyInfo([editData.segment1, editData.segment2, editData.segment3, editData.segment4]), [editData.segment1, editData.segment2, editData.segment3, editData.segment4]);
    const editSelectedParent = editData.parent_id ? accounts.find((account) => String(account.id) === String(editData.parent_id)) : null;
    const eligibleEditParents = React.useMemo(() => {
        if (!editingAccount || editHierarchyInfo.hasGap || editHierarchyInfo.level <= 1) return [];
        const targetLevel = editHierarchyInfo.level - 1;
        return accounts
            .filter((account) => Number(account.id) !== Number(editingAccount.id))
            .filter((account) => !descendantIds.has(Number(account.id)))
            .filter((account) => account.type === editData.type)
            .filter((account) => Number(account.level) === targetLevel)
            .filter((account) => matchesPrefix(account, editHierarchyInfo.segments))
            .sort((a, b) => String(a.full_code).localeCompare(String(b.full_code)));
    }, [accounts, descendantIds, editData.type, editHierarchyInfo, editingAccount]);

    React.useEffect(() => {
        if (!data.parent_id) return;
        if (!eligibleCreateParents.some((account) => String(account.id) === String(data.parent_id))) {
            setData('parent_id', '');
        }
    }, [data.parent_id, eligibleCreateParents, setData]);

    React.useEffect(() => {
        if (!editData.parent_id) return;
        if (!eligibleEditParents.some((account) => String(account.id) === String(editData.parent_id))) {
            setEditData('parent_id', '');
        }
    }, [editData.parent_id, eligibleEditParents, setEditData]);

    const matchesFilters = React.useCallback((node) => {
        const search = query.trim().toLowerCase();
        const searchMatch = search.length === 0
            || String(node.full_code || '').toLowerCase().includes(search)
            || String(node.name || '').toLowerCase().includes(search);
        const typeMatch = typeFilter === 'all' || node.type === typeFilter;
        const levelMatch = levelFilter === 'all' || Number(node.level) === Number(levelFilter);
        const activeMatch = showInactive || node.is_active !== false;
        return searchMatch && typeMatch && levelMatch && activeMatch;
    }, [levelFilter, query, showInactive, typeFilter]);

    const filterTree = React.useCallback((nodes) => nodes
        .map((node) => {
            const children = filterTree(node.children || []);
            if (matchesFilters(node) || children.length > 0) {
                return { ...node, children };
            }
            return null;
        })
        .filter(Boolean), [matchesFilters]);

    const scopedRoots = parentFilter === 'all' ? roots : [accountMap.get(Number(parentFilter))].filter(Boolean);
    const filteredRoots = React.useMemo(() => filterTree(scopedRoots), [filterTree, scopedRoots]);

    const countNodes = React.useCallback((nodes) => nodes.reduce((sum, node) => sum + 1 + countNodes(node.children || []), 0), []);

    const groupedRoots = React.useMemo(() => ['asset', 'liability', 'equity', 'income', 'expense']
        .map((type) => ({
            type,
            label: typeLabels[type] || type,
            nodes: filteredRoots.filter((node) => node.type === type),
        }))
        .map((group) => ({ ...group, count: countNodes(group.nodes) }))
        .filter((group) => group.nodes.length > 0), [countNodes, filteredRoots]);

    const allExpandableIds = React.useMemo(() => {
        const ids = [];
        const walk = (node) => {
            if (node.children && node.children.length > 0) {
                ids.push(node.id);
                node.children.forEach(walk);
            }
        };
        roots.forEach(walk);
        return ids;
    }, [roots]);

    const summary = React.useMemo(() => ({
        total: activeAccounts.length,
        assets: activeAccounts.filter((account) => account.type === 'asset').length,
        liabilities: activeAccounts.filter((account) => account.type === 'liability').length,
        equity: activeAccounts.filter((account) => account.type === 'equity').length,
        income: activeAccounts.filter((account) => account.type === 'income').length,
        expense: activeAccounts.filter((account) => account.type === 'expense').length,
        postable: activeAccounts.filter((account) => account.is_postable).length,
        inactive: accounts.filter((account) => account.is_active === false).length,
    }), [accounts, activeAccounts]);

    const submit = (event) => {
        event.preventDefault();
        post(route('accounting.coa.store'), {
            onSuccess: () => {
                reset();
                setOpenModal(false);
            },
        });
    };

    const openEdit = (node) => {
        setEditingAccount(node);
        setEditData({
            segment1: node.segment1 || '',
            segment2: node.segment2 || '',
            segment3: node.segment3 || '',
            segment4: node.segment4 || '',
            name: node.name || '',
            type: node.type || 'asset',
            parent_id: node.parent_id ? String(node.parent_id) : '',
            is_postable: !!node.is_postable,
            is_active: node.is_active !== false,
        });
        setOpenEditModal(true);
    };

    const closeEdit = () => {
        setOpenEditModal(false);
        setEditingAccount(null);
        resetEdit();
    };

    const submitEdit = (event) => {
        event.preventDefault();
        if (!editingAccount) return;
        put(route('accounting.coa.update', editingAccount.id), {
            onSuccess: () => closeEdit(),
        });
    };

    const toggleExpand = (id) => {
        setExpanded((previous) => {
            const next = new Set(previous);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const expandAll = () => setExpanded(new Set(allExpandableIds));
    const collapseAll = () => setExpanded(new Set());

    const renderNode = (node, depth = 0) => {
        const hasChildren = (node.children || []).length > 0;
        const isExpanded = expanded.has(node.id);

        return (
            <React.Fragment key={node.id}>
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: { xs: 'flex-start', lg: 'center' },
                        flexDirection: { xs: 'column', lg: 'row' },
                        gap: 1.5,
                        py: 1.5,
                        px: 1.75,
                        mb: 1,
                        borderRadius: '18px',
                        border: '1px solid rgba(226,232,240,0.9)',
                        background: depth === 0
                            ? 'linear-gradient(180deg, rgba(248,250,253,0.98) 0%, rgba(255,255,255,0.98) 100%)'
                            : '#ffffff',
                        pl: { xs: 1.25, lg: 1.75 + depth * 2.25 },
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: { xs: '100%', lg: 132 } }}>
                        <IconButton size="small" onClick={() => toggleExpand(node.id)} disabled={!hasChildren}>
                            {hasChildren ? (isExpanded ? <ExpandMore fontSize="small" /> : <ChevronRight fontSize="small" />) : <ChevronRight sx={{ opacity: 0.22 }} fontSize="small" />}
                        </IconButton>
                        <Box>
                            <Typography variant="body2" sx={{ fontWeight: 800, color: 'primary.main' }}>
                                {node.full_code}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                L{node.level} {node.parent_summary ? `· ${node.parent_summary.full_code}` : '· Root'}
                            </Typography>
                        </Box>
                    </Box>

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary' }}>
                            {node.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Direct {Number(node.direct_balance || 0).toFixed(2)} · Roll-up {Number(aggregatedBalances.get(node.id) || 0).toFixed(2)}
                        </Typography>
                    </Box>

                    <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap" sx={{ maxWidth: { xs: '100%', lg: 440 } }}>
                        <Chip label={typeLabels[node.type] || node.type} size="small" color={typeTone[node.type] || 'default'} variant="outlined" />
                        <Chip label={node.is_postable ? 'Postable' : 'Header'} size="small" variant="outlined" />
                        {node.parent_summary ? <Chip label={`Parent ${node.parent_summary.name}`} size="small" variant="outlined" /> : null}
                        {(node.usage?.rules || 0) > 0 ? <Chip label={`Rules ${node.usage.rules}`} size="small" color="info" variant="outlined" /> : null}
                        {(node.usage?.payment_accounts || 0) > 0 ? <Chip label={`Banks ${node.usage.payment_accounts}`} size="small" color="info" variant="outlined" /> : null}
                        {(node.usage?.journal_lines || 0) > 0 ? <Chip label={`Entries ${node.usage.journal_lines}`} size="small" color="info" variant="outlined" /> : null}
                        {!node.is_active ? <Chip label="Inactive" size="small" color="warning" variant="outlined" /> : null}
                    </Stack>

                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', ml: { lg: 'auto' } }}>
                        {node.ledger_url ? (
                            <Button size="small" variant="outlined" endIcon={<OpenInNew fontSize="small" />} onClick={() => router.visit(node.ledger_url)}>
                                Ledger
                            </Button>
                        ) : (
                            <Button size="small" variant="outlined" disabled>
                                Unavailable
                            </Button>
                        )}
                        <Button size="small" variant="outlined" onClick={() => openEdit(node)}>
                            Edit
                        </Button>
                        <Button size="small" color="error" variant="outlined" startIcon={<DeleteOutline fontSize="small" />} onClick={() => router.delete(route('accounting.coa.destroy', node.id))}>
                            Delete
                        </Button>
                    </Box>
                </Box>

                {hasChildren && isExpanded ? (
                    <Box sx={{ ml: { xs: 0, lg: 1 } }}>
                        {node.children.map((child) => renderNode(child, depth + 1))}
                    </Box>
                ) : null}
            </React.Fragment>
        );
    };

    return (
        <>
            <AppPage
                eyebrow="Accounting"
                title="Chart of Accounts"
                subtitle="Manage a proper level 1-4 account hierarchy with clearer parent visibility, usage tracking, and direct drilldown into the ledger."
                actions={[
                    <Button key="template" variant="outlined" onClick={() => window.open(route('accounting.coa.template'), '_blank')}>Template</Button>,
                    <Button key="import" variant="outlined" startIcon={<UploadFile />} onClick={() => fileInputRef.current?.click()}>Import CSV</Button>,
                    <Button key="add" variant="contained" startIcon={<Add />} onClick={() => setOpenModal(true)}>Add Account</Button>,
                ]}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,text/csv"
                    style={{ display: 'none' }}
                    onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (!file) return;
                        router.post(route('accounting.coa.import'), { file }, { forceFormData: true });
                        event.target.value = '';
                    }}
                />

                <Grid container spacing={2.25}>
                    <Grid item xs={12} md={2}><StatCard label="Total Accounts" value={summary.total} accent /></Grid>
                    <Grid item xs={12} md={2}><StatCard label="Assets" value={summary.assets} tone="light" /></Grid>
                    <Grid item xs={12} md={2}><StatCard label="Liabilities" value={summary.liabilities} tone="light" /></Grid>
                    <Grid item xs={12} md={2}><StatCard label="Equity" value={summary.equity} tone="muted" /></Grid>
                    <Grid item xs={12} md={2}><StatCard label="Revenue" value={summary.income} tone="light" /></Grid>
                    <Grid item xs={12} md={2}><StatCard label="Expenses" value={summary.expense} tone="muted" /></Grid>
                    <Grid item xs={12} md={3}><StatCard label="Postable Accounts" value={summary.postable} tone="light" /></Grid>
                    <Grid item xs={12} md={3}><StatCard label="Inactive Accounts" value={summary.inactive} tone="muted" /></Grid>
                </Grid>

                {error ? <Alert severity="warning" variant="outlined">{error}</Alert> : null}

                <SurfaceCard title="Live Filters" subtitle="Search by code or name, isolate a level or parent branch, and control whether inactive accounts are included in the hierarchy view.">
                    <FilterToolbar
                        onReset={() => {
                            setQuery('');
                            setTypeFilter('all');
                            setLevelFilter('all');
                            setParentFilter('all');
                            setShowInactive(false);
                        }}
                        actions={(
                            <Stack direction="row" spacing={1}>
                                <Button size="small" variant="outlined" onClick={expandAll}>Expand All</Button>
                                <Button size="small" variant="outlined" onClick={collapseAll}>Collapse All</Button>
                            </Stack>
                        )}
                    >
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={4}>
                                <TextField label="Search by account code or name" value={query} onChange={(event) => setQuery(event.target.value)} fullWidth />
                            </Grid>
                            <Grid item xs={12} md={2.5}>
                                <TextField select label="Category" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} fullWidth>
                                    <MenuItem value="all">All Categories</MenuItem>
                                    <MenuItem value="asset">Assets</MenuItem>
                                    <MenuItem value="liability">Liabilities</MenuItem>
                                    <MenuItem value="equity">Equity</MenuItem>
                                    <MenuItem value="income">Revenue</MenuItem>
                                    <MenuItem value="expense">Expenses</MenuItem>
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={2.5}>
                                <TextField select label="Level" value={levelFilter} onChange={(event) => setLevelFilter(event.target.value)} fullWidth>
                                    <MenuItem value="all">All Levels</MenuItem>
                                    {[1, 2, 3, 4].map((level) => <MenuItem key={level} value={level}>{`Level ${level}`}</MenuItem>)}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <TextField select label="Parent Branch" value={parentFilter} onChange={(event) => setParentFilter(event.target.value)} fullWidth>
                                    <MenuItem value="all">All Parents</MenuItem>
                                    {parentOptions.map((account) => (
                                        <MenuItem key={account.id} value={account.id}>
                                            {account.full_code} - {account.name}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid item xs={12}>
                                <Button variant={showInactive ? 'contained' : 'outlined'} onClick={() => setShowInactive((value) => !value)}>
                                    {showInactive ? 'Hiding inactive disabled' : 'Show inactive'}
                                </Button>
                            </Grid>
                        </Grid>
                    </FilterToolbar>
                </SurfaceCard>

                <SurfaceCard title="Account Hierarchy" subtitle="A cleaner tree view with parent metadata, account usage, and ledger drilldown from each node.">
                    {groupedRoots.length === 0 ? (
                        <Box sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}>No accounts found.</Box>
                    ) : null}

                    {groupedRoots.map((group) => (
                        <Box key={group.type} sx={{ mb: 2.5 }}>
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.25 }}>
                                <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 800 }}>
                                    {group.label}
                                </Typography>
                                <Chip label={`${group.count} accounts`} size="small" color="primary" />
                            </Stack>
                            {group.nodes.map((node) => renderNode(node))}
                        </Box>
                    ))}
                </SurfaceCard>
            </AppPage>

            <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="md" fullWidth>
                <DialogTitle>Add Account</DialogTitle>
                <form onSubmit={submit}>
                    <DialogContent>
                        <FormFields
                            formData={data}
                            setFormData={setData}
                            errors={errors}
                            accounts={accounts}
                            eligibleParents={eligibleCreateParents}
                            hierarchyInfo={createHierarchyInfo}
                            selectedParent={selectedParent}
                            submitLabel="Target"
                        />
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 2 }}>
                        <Button onClick={() => setOpenModal(false)}>Cancel</Button>
                        <Button type="submit" variant="contained" disabled={processing}>Create Account</Button>
                    </DialogActions>
                </form>
            </Dialog>

            <Dialog open={openEditModal} onClose={closeEdit} maxWidth="md" fullWidth>
                <DialogTitle>Edit Account</DialogTitle>
                <form onSubmit={submitEdit}>
                    <DialogContent>
                        <FormFields
                            formData={editData}
                            setFormData={setEditData}
                            errors={editErrors}
                            accounts={accounts}
                            eligibleParents={eligibleEditParents}
                            hierarchyInfo={editHierarchyInfo}
                            selectedParent={editSelectedParent}
                            submitLabel="Target"
                        />
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 2 }}>
                        <Button onClick={closeEdit}>Cancel</Button>
                        <Button type="submit" variant="contained" disabled={editProcessing}>Save Changes</Button>
                    </DialogActions>
                </form>
            </Dialog>
        </>
    );
}
