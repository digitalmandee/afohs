import React from 'react';
import { router, useForm } from '@inertiajs/react';
import {
    Alert,
    Box,
    Button,
    Checkbox,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    FormControlLabel,
    FormLabel,
    Grid,
    IconButton,
    MenuItem,
    Radio,
    RadioGroup,
    Stack,
    Switch,
    TextField,
    Typography,
} from '@mui/material';
import { Add, ChevronRight, Close, DeleteOutline, ExpandMore, OpenInNew, UploadFile } from '@mui/icons-material';
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

const normalBalanceDefaults = {
    asset: 'debit',
    expense: 'debit',
    liability: 'credit',
    equity: 'credit',
    income: 'credit',
};

const normalizeParts = (parts = []) => parts.map((part) => String(part ?? '').trim());

const getHierarchyInfo = (parts = []) => {
    const [s1, s2, s3, s4, s5] = normalizeParts(parts);
    if (!s1) return { level: 0, hasGap: false, segments: [] };
    if (!s2 && (s3 || s4 || s5)) return { level: 1, hasGap: true, segments: [s1] };
    if (!s3 && (s4 || s5)) return { level: 2, hasGap: true, segments: [s1, s2].filter(Boolean) };
    if (!s4 && s5) return { level: 3, hasGap: true, segments: [s1, s2, s3].filter(Boolean) };
    const segments = [s1, s2, s3, s4, s5].filter(Boolean);
    return { level: segments.length, hasGap: false, segments };
};

const matchesPrefix = (account, segments = []) => {
    const prefix = [account.segment1, account.segment2, account.segment3, account.segment4, account.segment5].filter(Boolean);
    if (prefix.length > segments.length) return false;

    for (let index = 0; index < prefix.length; index += 1) {
        if (String(prefix[index]) !== String(segments[index])) return false;
    }

    return true;
};

const SEGMENT_LABELS = ['Segment 1', 'Segment 2', 'Segment 3', 'Segment 4', 'Segment 5'];

const buildSegmentsFromParent = (parent, nextSegmentValue = '') => {
    const inherited = parent
        ? [parent.segment1, parent.segment2, parent.segment3, parent.segment4, parent.segment5].map((segment) => String(segment ?? '').trim())
        : ['', '', '', '', ''];

    const nextIndex = parent ? Number(parent.level || 0) : 0;
    inherited[nextIndex] = String(nextSegmentValue ?? '').trim();

    return inherited;
};

const resolveFormMode = (formData, accounts = []) => {
    const parent = formData.is_sub_account && formData.parent_id ? accounts.find((account) => String(account.id) === String(formData.parent_id)) : null;
    const nextSegmentIndex = parent ? Math.min(4, Number(parent.level || 0)) : 0;
    const segments = buildSegmentsFromParent(parent, formData.segment_value);
    const hierarchyInfo = getHierarchyInfo(segments);

    return {
        parent,
        nextSegmentIndex,
        nextLevel: nextSegmentIndex + 1,
        segments,
        hierarchyInfo,
    };
};

const recommendedPostableForLevel = (level) => Number(level) === 5;

const baseFormValues = {
    segment1: '',
    segment2: '',
    segment3: '',
    segment4: '',
    segment5: '',
    segment_value: '',
    name: '',
    type: 'asset',
    normal_balance: 'debit',
    parent_id: '',
    opening_balance: '0.00',
    description: '',
    is_postable: false,
    is_active: true,
    is_sub_account: false,
};

const sectionCardSx = {
    borderRadius: '18px',
    border: '1px solid rgba(226,232,240,0.85)',
    background: 'rgba(255,255,255,0.94)',
    p: { xs: 1.5, md: 2 },
    boxShadow: '0 10px 28px rgba(15,23,42,0.04)',
};

const dialogPaperSx = {
    borderRadius: { xs: '20px', md: '24px' },
    width: 'min(100%, 820px)',
    height: 'min(100vh - 32px, 860px)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(248,250,252,0.98) 100%)',
    boxShadow: '0 28px 80px rgba(15,23,42,0.18)',
};

const compactTextFieldSx = {
    '& .MuiInputBase-root': {
        borderRadius: '14px',
    },
    '& .MuiFormHelperText-root': {
        mt: 0.5,
    },
};

const compactHierarchyChipSx = {
    height: 22,
    borderRadius: '10px',
    '& .MuiChip-label': {
        px: 1,
        fontSize: '0.72rem',
        fontWeight: 600,
    },
};

const FormFields = ({
    formData,
    setFormData,
    errors,
    accounts,
    parentOptions,
    formMode,
    submitLabel,
    mode = 'create',
    onClose,
    derivedCurrentBalance = 0,
}) => (
    <>
        <DialogTitle
            sx={{
                px: { xs: 2, md: 2.5 },
                pt: { xs: 2, md: 2.25 },
                pb: 1.25,
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 1.5,
                borderBottom: '1px solid rgba(226,232,240,0.85)',
                backgroundColor: 'rgba(255,255,255,0.94)',
                backdropFilter: 'blur(10px)',
                flexShrink: 0,
            }}
        >
            <Box>
                <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.03em', fontSize: { xs: '1.45rem', md: '1.8rem' }, lineHeight: 1.1 }}>
                    {mode === 'edit' ? 'Edit Chart Of Account' : 'Create Chart Of Account'}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 560 }}>
                    Build a structured chart with guided parent hierarchy, proper balances, and a live code preview.
                </Typography>
            </Box>
            <IconButton onClick={onClose} size="small" sx={{ backgroundColor: 'rgba(148,163,184,0.08)' }}>
                <Close />
            </IconButton>
        </DialogTitle>

        <DialogContent
            sx={{
                px: { xs: 2, md: 2.5 },
                py: 1.75,
                flex: 1,
                minHeight: 0,
                overflowY: 'auto',
                overscrollBehavior: 'contain',
            }}
        >
            <Stack spacing={1.5}>
                <Box sx={sectionCardSx}>
                    <Stack spacing={1.5}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                            Account Setup
                        </Typography>
                        <Grid container spacing={1.5}>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    size="small"
                                    select
                                    label="Account Type"
                                    value={formData.type}
                                    onChange={(event) => {
                                        const nextType = event.target.value;
                                        setFormData('type', nextType);
                                        setFormData('normal_balance', normalBalanceDefaults[nextType] || 'debit');
                                    }}
                                    error={!!errors.type}
                                    helperText={errors.type || (formMode.parent ? `Locked to parent type: ${typeLabels[formMode.parent.type] || formMode.parent.type}` : 'Select the account family for this branch.')}
                                    disabled={!!formMode.parent}
                                    fullWidth
                                    sx={compactTextFieldSx}
                                >
                                    {Object.entries(typeLabels).map(([value, label]) => (
                                        <MenuItem key={value} value={value}>{label}</MenuItem>
                                    ))}
                                </TextField>
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <TextField
                                    size="small"
                                    label="Account Name"
                                    placeholder="Enter Account Name"
                                    value={formData.name}
                                    onChange={(event) => setFormData('name', event.target.value)}
                                    error={!!errors.name}
                                    helperText={errors.name}
                                    fullWidth
                                    sx={compactTextFieldSx}
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <Stack
                                    direction={{ xs: 'column', md: 'row' }}
                                    justifyContent="space-between"
                                    alignItems={{ xs: 'flex-start', md: 'center' }}
                                    spacing={0.75}
                                    sx={{ borderRadius: '14px', backgroundColor: 'rgba(248,250,252,0.95)', px: 1.25, py: 0.75, border: '1px solid rgba(226,232,240,0.7)' }}
                                >
                                    <FormControlLabel
                                        sx={{ mr: 0 }}
                                        control={<Switch size="small" checked={!!formData.is_active} onChange={(event) => setFormData('is_active', event.target.checked)} color="success" />}
                                        label="Is Active"
                                    />
                                    <FormControlLabel
                                        sx={{ mr: 0 }}
                                        control={(
                                            <Checkbox
                                                size="small"
                                                checked={!!formData.is_sub_account}
                                                onChange={(event) => {
                                                    const checked = event.target.checked;
                                                    setFormData('is_sub_account', checked);
                                                    if (!checked) {
                                                        setFormData('parent_id', '');
                                                        setFormData('segment_value', '');
                                                    }
                                                }}
                                            />
                                        )}
                                        label="Create as sub account"
                                    />
                                </Stack>
                            </Grid>
                        </Grid>
                    </Stack>
                </Box>

                <Box sx={sectionCardSx}>
                    <Stack spacing={1.5}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                            Hierarchy
                        </Typography>
                        <Grid container spacing={1.5}>
                            {formData.is_sub_account ? (
                                <Grid item xs={12}>
                                    <TextField
                                        size="small"
                                        select
                                        label="Parent Account"
                                        value={formData.parent_id}
                                        onChange={(event) => {
                                            const next = event.target.value;
                                            setFormData('parent_id', next);
                                            const parent = accounts.find((account) => String(account.id) === String(next));
                                            if (parent) {
                                                setFormData('type', parent.type);
                                                setFormData('normal_balance', parent.normal_balance || normalBalanceDefaults[parent.type] || 'debit');
                                                setFormData('is_postable', recommendedPostableForLevel((parent.level || 0) + 1));
                                            }
                                        }}
                                        error={!!errors.parent_id}
                                        helperText={errors.parent_id || 'Pick the header account this new account should sit under.'}
                                        fullWidth
                                        sx={compactTextFieldSx}
                                    >
                                        <MenuItem value="">Select Parent Account</MenuItem>
                                        {parentOptions.map((account) => (
                                            <MenuItem key={account.id} value={account.id}>
                                                {account.full_code} - {account.name}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                </Grid>
                            ) : null}

                            <Grid item xs={12}>
                                <TextField
                                    size="small"
                                    label="Account Code"
                                    placeholder={formMode.parent ? `Enter ${SEGMENT_LABELS[formMode.nextSegmentIndex]}` : 'Enter root account code'}
                                    value={formData.segment_value}
                                    onChange={(event) => setFormData('segment_value', event.target.value)}
                                    error={!!errors.segment1 || !!errors.segment2 || !!errors.segment3 || !!errors.segment4 || !!errors.segment5}
                                    helperText={
                                        errors.segment1
                                        || errors.segment2
                                        || errors.segment3
                                        || errors.segment4
                                        || errors.segment5
                                        || (formMode.parent
                                            ? `Only the next segment is editable. This will create level ${formMode.nextLevel} under ${formMode.parent.full_code}.`
                                            : 'For a root account, enter the first segment code.')
                                    }
                                    fullWidth
                                    sx={compactTextFieldSx}
                                />
                            </Grid>

                            {formMode.parent ? (
                                <Grid item xs={12}>
                                    <Stack direction="row" spacing={0.5} useFlexGap flexWrap="wrap">
                                        {formMode.segments.map((segment, index) => (
                                            <Chip
                                                key={SEGMENT_LABELS[index]}
                                                label={`${SEGMENT_LABELS[index]}: ${segment || '—'}`}
                                                size="small"
                                                variant={index === formMode.nextSegmentIndex ? 'filled' : 'outlined'}
                                                color={index === formMode.nextSegmentIndex ? 'primary' : 'default'}
                                                sx={{ borderRadius: '10px', height: 24 }}
                                            />
                                        ))}
                                    </Stack>
                                </Grid>
                            ) : null}

                            <Grid item xs={12}>
                                <Box sx={{ borderRadius: '14px', backgroundColor: 'rgba(248,250,252,0.82)', border: '1px dashed rgba(148,163,184,0.4)', p: 1.5 }}>
                                    <Stack spacing={0.5}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                            Hierarchy Preview
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {submitLabel} level: {formMode.hierarchyInfo.level || 'n/a'} · Parent path: {formMode.parent ? `${formMode.parent.full_code} - ${formMode.parent.name}` : 'Root account'}
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 800 }}>
                                            Final code: {formMode.segments.filter((part) => String(part || '').trim() !== '').join('-') || '—'}
                                        </Typography>
                                        <Typography variant="caption" color={formMode.hierarchyInfo.hasGap ? 'error.main' : 'text.secondary'}>
                                            {formMode.hierarchyInfo.hasGap
                                                ? 'Fill the next required segment in order from level 1 to level 5.'
                                                : formMode.hierarchyInfo.level <= 1
                                                    ? 'Root account without parent.'
                                                    : `Parent must be level ${formMode.hierarchyInfo.level - 1} with matching prefix and type.`}
                                        </Typography>
                                    </Stack>
                                </Box>
                            </Grid>
                        </Grid>
                    </Stack>
                </Box>

                <Box sx={sectionCardSx}>
                    <Stack spacing={1.5}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                            Balances and Metadata
                        </Typography>
                        <Grid container spacing={1.5}>
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth>
                                    <FormLabel sx={{ mb: 0.25, color: 'text.primary', fontWeight: 700, fontSize: '0.9rem' }}>Normal Balance</FormLabel>
                                    <RadioGroup row value={formData.normal_balance} onChange={(event) => setFormData('normal_balance', event.target.value)}>
                                        <FormControlLabel sx={{ mr: 1.5 }} value="debit" control={<Radio size="small" color="success" />} label="Debit" />
                                        <FormControlLabel value="credit" control={<Radio size="small" color="success" />} label="Credit" />
                                    </RadioGroup>
                                </FormControl>
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <Stack
                                    direction={{ xs: 'column', md: 'row' }}
                                    justifyContent="space-between"
                                    alignItems={{ xs: 'flex-start', md: 'center' }}
                                    spacing={0.75}
                                    sx={{ borderRadius: '14px', backgroundColor: 'rgba(248,250,252,0.95)', px: 1.25, py: 0.9, height: '100%', border: '1px solid rgba(226,232,240,0.7)' }}
                                >
                                    <FormControlLabel
                                        control={(
                                            <Switch
                                                size="small"
                                                checked={!!formData.is_postable}
                                                onChange={(event) => setFormData('is_postable', event.target.checked)}
                                                color="primary"
                                                disabled={formMode.nextLevel < 5}
                                            />
                                        )}
                                        label="Postable Account"
                                    />
                                    <Typography variant="caption" color="text.secondary">
                                        {formMode.nextLevel < 5 ? 'Only level 5 accounts can be postable.' : 'Level 5 accounts are the intended posting leaves.'}
                                    </Typography>
                                </Stack>
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <TextField
                                    size="small"
                                    label="Opening Balance"
                                    type="number"
                                    inputProps={{ step: '0.01' }}
                                    value={formData.opening_balance}
                                    onChange={(event) => setFormData('opening_balance', event.target.value)}
                                    error={!!errors.opening_balance}
                                    helperText={errors.opening_balance || 'Stored as the starting configured balance for this account.'}
                                    fullWidth
                                    sx={compactTextFieldSx}
                                />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <TextField
                                    size="small"
                                    label="Current Balance"
                                    value={Number(derivedCurrentBalance || 0).toFixed(2)}
                                    helperText="Read-only derived balance from opening balance plus posted ledger movement."
                                    fullWidth
                                    InputProps={{ readOnly: true }}
                                    sx={compactTextFieldSx}
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    size="small"
                                    label="Description"
                                    placeholder="Enter Description"
                                    value={formData.description}
                                    onChange={(event) => setFormData('description', event.target.value)}
                                    error={!!errors.description}
                                    helperText={errors.description}
                                    multiline
                                    minRows={2.5}
                                    fullWidth
                                    sx={compactTextFieldSx}
                                />
                            </Grid>
                        </Grid>
                    </Stack>
                </Box>
            </Stack>
        </DialogContent>
    </>
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

    const { data, setData, post, processing, errors, reset, transform } = useForm({
        ...baseFormValues,
    });

    const {
        data: editData,
        setData: setEditData,
        put,
        processing: editProcessing,
        errors: editErrors,
        reset: resetEdit,
        transform: transformEdit,
    } = useForm({
        ...baseFormValues,
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
            .filter((account) => Number(account.level) < 5)
            .filter((account) => account.is_postable === false || account.is_postable === 0)
            .sort((a, b) => String(a.full_code).localeCompare(String(b.full_code))),
        [accounts],
    );
    const createFormMode = React.useMemo(() => resolveFormMode(data, accounts), [accounts, data]);

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

    const editFormMode = React.useMemo(() => resolveFormMode(editData, accounts), [accounts, editData]);
    const createCurrentBalance = React.useMemo(() => {
        const opening = Number(data.opening_balance || 0);
        return Number.isFinite(opening) ? opening : 0;
    }, [data.opening_balance]);
    const editCurrentBalance = React.useMemo(() => {
        if (!editingAccount) return 0;
        const originalOpening = Number(editingAccount.opening_balance || 0);
        const existingCurrent = Number(editingAccount.current_balance || 0);
        const movement = existingCurrent - originalOpening;
        return movement + Number(editData.opening_balance || 0);
    }, [editData.opening_balance, editingAccount]);
    const eligibleEditParents = React.useMemo(() => {
        if (!editingAccount) return [];
        return accounts
            .filter((account) => Number(account.id) !== Number(editingAccount.id))
            .filter((account) => !descendantIds.has(Number(account.id)))
            .filter((account) => account.type === editData.type)
            .filter((account) => Number(account.level) < 5)
            .filter((account) => account.is_postable === false || account.is_postable === 0)
            .sort((a, b) => String(a.full_code).localeCompare(String(b.full_code)));
    }, [accounts, descendantIds, editData.type, editingAccount]);

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

    React.useEffect(() => {
        setExpanded(new Set(allExpandableIds));
    }, [allExpandableIds]);

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
        const [segment1, segment2, segment3, segment4, segment5] = createFormMode.segments;
        transform(() => ({
            ...data,
            segment1,
            segment2,
            segment3,
            segment4,
            segment5,
        }));
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
            segment5: node.segment5 || '',
            segment_value: node[`segment${node.level}`] || '',
            name: node.name || '',
            type: node.type || 'asset',
            normal_balance: node.normal_balance || normalBalanceDefaults[node.type] || 'debit',
            parent_id: node.parent_id ? String(node.parent_id) : '',
            opening_balance: String(node.opening_balance ?? '0.00'),
            description: node.description || '',
            is_postable: !!node.is_postable,
            is_active: node.is_active !== false,
            is_sub_account: !!node.parent_id,
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
        const [segment1, segment2, segment3, segment4, segment5] = editFormMode.segments;
        transformEdit(() => ({
            ...editData,
            segment1,
            segment2,
            segment3,
            segment4,
            segment5,
        }));
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
                        gap: 1,
                        py: 1,
                        px: 1.25,
                        mb: 0.75,
                        borderRadius: '14px',
                        border: '1px solid rgba(226,232,240,0.82)',
                        background: depth === 0
                            ? 'linear-gradient(180deg, rgba(248,250,253,0.96) 0%, rgba(255,255,255,0.98) 100%)'
                            : 'rgba(255,255,255,0.98)',
                        pl: { xs: 1, lg: 1.25 + depth * 1.5 },
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: { xs: '100%', lg: 118 } }}>
                        <IconButton size="small" onClick={() => toggleExpand(node.id)} disabled={!hasChildren}>
                            {hasChildren ? (isExpanded ? <ExpandMore fontSize="small" /> : <ChevronRight fontSize="small" />) : <ChevronRight sx={{ opacity: 0.22 }} fontSize="small" />}
                        </IconButton>
                        <Box>
                            <Typography variant="body2" sx={{ fontWeight: 800, color: 'primary.main', lineHeight: 1.15 }}>
                                {node.full_code}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                L{node.level} {node.parent_summary ? `· ${node.parent_summary.full_code}` : '· Root'}
                            </Typography>
                        </Box>
                    </Box>

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body1" sx={{ fontWeight: 700, color: 'text.primary', lineHeight: 1.2 }}>
                            {node.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Direct {Number(node.direct_balance || 0).toFixed(2)} · Roll-up {Number(aggregatedBalances.get(node.id) || 0).toFixed(2)}
                        </Typography>
                    </Box>

                    <Stack direction="row" spacing={0.5} useFlexGap flexWrap="wrap" sx={{ maxWidth: { xs: '100%', lg: 400 } }}>
                        <Chip label={typeLabels[node.type] || node.type} size="small" color={typeTone[node.type] || 'default'} variant="outlined" sx={compactHierarchyChipSx} />
                        <Chip label={`L${node.level}`} size="small" variant="outlined" sx={compactHierarchyChipSx} />
                        <Chip label={node.is_postable ? 'Postable' : 'Header'} size="small" variant="outlined" sx={compactHierarchyChipSx} />
                        {node.parent_summary ? <Chip label={`Parent ${node.parent_summary.name}`} size="small" variant="outlined" sx={compactHierarchyChipSx} /> : null}
                        {(node.usage?.rules || 0) > 0 ? <Chip label={`Rules ${node.usage.rules}`} size="small" color="info" variant="outlined" sx={compactHierarchyChipSx} /> : null}
                        {(node.usage?.payment_accounts || 0) > 0 ? <Chip label={`Banks ${node.usage.payment_accounts}`} size="small" color="info" variant="outlined" sx={compactHierarchyChipSx} /> : null}
                        {(node.usage?.journal_lines || 0) > 0 ? <Chip label={`Entries ${node.usage.journal_lines}`} size="small" color="info" variant="outlined" sx={compactHierarchyChipSx} /> : null}
                        {!node.is_active ? <Chip label="Inactive" size="small" color="warning" variant="outlined" sx={compactHierarchyChipSx} /> : null}
                    </Stack>

                    <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', ml: { lg: 'auto' } }}>
                        {!node.is_postable && Number(node.level) < 5 ? (
                            <Button
                                size="small"
                                variant="contained"
                                sx={{ minWidth: 0, px: 1.25 }}
                                onClick={() => {
                                    setData({
                                        ...baseFormValues,
                                        segment_value: '',
                                        name: '',
                                        type: node.type || 'asset',
                                        normal_balance: node.normal_balance || normalBalanceDefaults[node.type] || 'debit',
                                        parent_id: String(node.id),
                                        is_postable: recommendedPostableForLevel(Number(node.level) + 1),
                                        is_active: true,
                                        is_sub_account: true,
                                    });
                                    setOpenModal(true);
                                }}
                            >
                                Add Child
                            </Button>
                        ) : null}
                        {node.ledger_url ? (
                            <Button size="small" variant="outlined" sx={{ minWidth: 0, px: 1.1 }} endIcon={<OpenInNew fontSize="small" />} onClick={() => router.visit(node.ledger_url)}>
                                Ledger
                            </Button>
                        ) : (
                            <Button size="small" variant="outlined" sx={{ minWidth: 0, px: 1.1 }} disabled>
                                Unavailable
                            </Button>
                        )}
                        <Button size="small" variant="outlined" sx={{ minWidth: 0, px: 1.1 }} onClick={() => openEdit(node)}>
                            Edit
                        </Button>
                        <Button size="small" color="error" variant="outlined" sx={{ minWidth: 0, px: 1.1 }} startIcon={<DeleteOutline fontSize="small" />} onClick={() => router.delete(route('accounting.coa.destroy', node.id))}>
                            Delete
                        </Button>
                    </Box>
                </Box>

                {hasChildren && isExpanded ? (
                    <Box sx={{ ml: { xs: 0, lg: 0.75 } }}>
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
                subtitle="Manage a proper level 1-5 account hierarchy with clearer parent visibility, usage tracking, and direct drilldown into the ledger."
                actions={[
                    <Button key="template" variant="outlined" onClick={() => window.open(route('accounting.coa.template'), '_blank')}>Template</Button>,
                    <Button key="import" variant="outlined" startIcon={<UploadFile />} onClick={() => fileInputRef.current?.click()}>Import CSV</Button>,
                    <Button
                        key="add"
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => {
                            setData({ ...baseFormValues });
                            setOpenModal(true);
                        }}
                    >
                        Add Account
                    </Button>,
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

                <Grid container spacing={1.5}>
                    <Grid item xs={12} sm={6} md={3}><StatCard label="Total Accounts" value={summary.total} accent compact /></Grid>
                    <Grid item xs={12} sm={6} md={3}><StatCard label="Postable Accounts" value={summary.postable} tone="light" compact /></Grid>
                    <Grid item xs={12} sm={6} md={3}><StatCard label="Inactive Accounts" value={summary.inactive} tone="muted" compact /></Grid>
                    <Grid item xs={12} sm={6} md={3}><StatCard label="Revenue Branches" value={summary.income} tone="light" compact /></Grid>
                    <Grid item xs={12} sm={6} md={3}><StatCard label="Assets" value={summary.assets} tone="light" compact /></Grid>
                    <Grid item xs={12} sm={6} md={3}><StatCard label="Liabilities" value={summary.liabilities} tone="light" compact /></Grid>
                    <Grid item xs={12} sm={6} md={3}><StatCard label="Equity" value={summary.equity} tone="muted" compact /></Grid>
                    <Grid item xs={12} sm={6} md={3}><StatCard label="Expenses" value={summary.expense} tone="muted" compact /></Grid>
                </Grid>

                {error ? <Alert severity="warning" variant="outlined">{error}</Alert> : null}

                <SurfaceCard
                    title="Live Filters"
                    subtitle="Search by code or name, isolate a level or parent branch, and control whether inactive accounts are included in the hierarchy view."
                    cardSx={{ borderRadius: '18px' }}
                    contentSx={{ p: { xs: 1.5, md: 2 }, '&:last-child': { pb: { xs: 1.5, md: 2 } } }}
                >
                    <FilterToolbar
                        compact
                        onReset={() => {
                            setQuery('');
                            setTypeFilter('all');
                            setLevelFilter('all');
                            setParentFilter('all');
                            setShowInactive(false);
                        }}
                        actions={(
                            <Stack direction="row" spacing={0.75}>
                                <Button size="small" variant="outlined" onClick={expandAll}>Expand All</Button>
                                <Button size="small" variant="outlined" onClick={collapseAll}>Collapse All</Button>
                            </Stack>
                        )}
                    >
                        <Grid container spacing={1.25}>
                            <Grid item xs={12} md={4}>
                                <TextField size="small" label="Search by account code or name" value={query} onChange={(event) => setQuery(event.target.value)} fullWidth />
                            </Grid>
                            <Grid item xs={12} md={2.5}>
                                <TextField size="small" select label="Category" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} fullWidth>
                                    <MenuItem value="all">All Categories</MenuItem>
                                    <MenuItem value="asset">Assets</MenuItem>
                                    <MenuItem value="liability">Liabilities</MenuItem>
                                    <MenuItem value="equity">Equity</MenuItem>
                                    <MenuItem value="income">Revenue</MenuItem>
                                    <MenuItem value="expense">Expenses</MenuItem>
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={2.5}>
                                <TextField size="small" select label="Level" value={levelFilter} onChange={(event) => setLevelFilter(event.target.value)} fullWidth>
                                    <MenuItem value="all">All Levels</MenuItem>
                                    {[1, 2, 3, 4, 5].map((level) => <MenuItem key={level} value={level}>{`Level ${level}`}</MenuItem>)}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <TextField size="small" select label="Parent Branch" value={parentFilter} onChange={(event) => setParentFilter(event.target.value)} fullWidth>
                                    <MenuItem value="all">All Parents</MenuItem>
                                    {parentOptions.map((account) => (
                                        <MenuItem key={account.id} value={account.id}>
                                            {account.full_code} - {account.name}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid item xs={12}>
                                <Button size="small" variant={showInactive ? 'contained' : 'outlined'} onClick={() => setShowInactive((value) => !value)}>
                                    {showInactive ? 'Hiding inactive disabled' : 'Show inactive'}
                                </Button>
                            </Grid>
                        </Grid>
                    </FilterToolbar>
                </SurfaceCard>

                <SurfaceCard
                    title="Account Hierarchy"
                    subtitle="A cleaner tree view with parent metadata, account usage, and ledger drilldown from each node."
                    cardSx={{ borderRadius: '18px' }}
                    contentSx={{ p: { xs: 1.5, md: 2 }, '&:last-child': { pb: { xs: 1.5, md: 2 } } }}
                >
                    {groupedRoots.length === 0 ? (
                        <Box sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}>No accounts found.</Box>
                    ) : null}

                    {groupedRoots.map((group) => (
                        <Box key={group.type} sx={{ mb: 1.75 }}>
                            <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.9 }}>
                                <Typography variant="subtitle1" sx={{ color: 'primary.main', fontWeight: 800 }}>
                                    {group.label}
                                </Typography>
                                <Chip label={`${group.count} accounts`} size="small" color="primary" sx={compactHierarchyChipSx} />
                            </Stack>
                            {group.nodes.map((node) => renderNode(node))}
                        </Box>
                    ))}
                </SurfaceCard>
            </AppPage>

            <Dialog
                open={openModal}
                onClose={() => setOpenModal(false)}
                maxWidth="lg"
                fullWidth
                scroll="paper"
                PaperProps={{ sx: dialogPaperSx }}
            >
                <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', minHeight: 0, height: '100%' }}>
                    <FormFields
                        formData={data}
                        setFormData={setData}
                        errors={errors}
                        accounts={accounts}
                        parentOptions={parentOptions}
                        formMode={createFormMode}
                        submitLabel="Target"
                        mode="create"
                        onClose={() => setOpenModal(false)}
                        derivedCurrentBalance={createCurrentBalance}
                    />
                    <DialogActions
                        sx={{
                            px: { xs: 2, md: 2.5 },
                            py: 1.5,
                            borderTop: '1px solid rgba(226,232,240,0.85)',
                            backgroundColor: 'rgba(255,255,255,0.96)',
                            justifyContent: 'space-between',
                            flexShrink: 0,
                        }}
                    >
                        <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', md: 'block' } }}>
                            Accounts are created with guided hierarchy and live code validation.
                        </Typography>
                        <Stack direction="row" spacing={1}>
                            <Button onClick={() => setOpenModal(false)}>Cancel</Button>
                            <Button type="submit" variant="contained" disabled={processing} sx={{ minWidth: 128, borderRadius: '12px' }}>
                                Create
                            </Button>
                        </Stack>
                    </DialogActions>
                </form>
            </Dialog>

            <Dialog
                open={openEditModal}
                onClose={closeEdit}
                maxWidth="lg"
                fullWidth
                scroll="paper"
                PaperProps={{ sx: dialogPaperSx }}
            >
                <form onSubmit={submitEdit} style={{ display: 'flex', flexDirection: 'column', minHeight: 0, height: '100%' }}>
                    <FormFields
                        formData={editData}
                        setFormData={setEditData}
                        errors={editErrors}
                        accounts={accounts}
                        parentOptions={eligibleEditParents}
                        formMode={editFormMode}
                        submitLabel="Target"
                        mode="edit"
                        onClose={closeEdit}
                        derivedCurrentBalance={editCurrentBalance}
                    />
                    <DialogActions
                        sx={{
                            px: { xs: 2, md: 2.5 },
                            py: 1.5,
                            borderTop: '1px solid rgba(226,232,240,0.85)',
                            backgroundColor: 'rgba(255,255,255,0.96)',
                            justifyContent: 'space-between',
                            flexShrink: 0,
                        }}
                    >
                        <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', md: 'block' } }}>
                            Editing preserves current hierarchy safety and used-account restrictions.
                        </Typography>
                        <Stack direction="row" spacing={1}>
                            <Button onClick={closeEdit}>Cancel</Button>
                            <Button type="submit" variant="contained" disabled={editProcessing} sx={{ minWidth: 128, borderRadius: '12px' }}>
                                Save
                            </Button>
                        </Stack>
                    </DialogActions>
                </form>
            </Dialog>
        </>
    );
}
