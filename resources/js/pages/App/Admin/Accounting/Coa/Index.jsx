import React from 'react';
import { useForm, router } from '@inertiajs/react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  IconButton,
  MenuItem,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { Add, ChevronRight, ExpandMore } from '@mui/icons-material';

const typeLabels = {
  asset: 'Asset',
  liability: 'Liability',
  equity: 'Equity',
  income: 'Revenue',
  expense: 'Expense',
};

const normalizeParts = (parts = []) => parts.map((p) => String(p ?? '').trim());

const getHierarchyInfo = (parts = []) => {
  const [s1, s2, s3, s4] = normalizeParts(parts);
  if (!s1) {
    return { level: 0, hasGap: false, segments: [] };
  }
  if (!s2 && (s3 || s4)) {
    return { level: 1, hasGap: true, segments: [s1] };
  }
  if (!s3 && s4) {
    return { level: 2, hasGap: true, segments: [s1, s2].filter(Boolean) };
  }
  const segments = [s1, s2, s3, s4].filter(Boolean);
  return { level: segments.length, hasGap: false, segments };
};

const matchesPrefix = (account, segments = []) => {
  const prefix = [
    account.segment1,
    account.segment2,
    account.segment3,
    account.segment4,
  ].filter(Boolean);
  if (prefix.length > segments.length) return false;
  for (let i = 0; i < prefix.length; i++) {
    if (String(prefix[i]) !== String(segments[i])) return false;
  }
  return true;
};

const StatCard = ({ label, value, tone = 'default' }) => (
  <Card
    sx={{
      border: '1px solid',
      borderColor: 'divider',
      background:
        tone === 'muted'
          ? 'linear-gradient(135deg, rgba(6,52,85,0.12) 0%, rgba(6,52,85,0.04) 60%)'
          : 'background.paper',
    }}
  >
    <CardContent>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h5" sx={{ mt: 1, fontWeight: 700, color: 'primary.main' }}>
        {value}
      </Typography>
    </CardContent>
  </Card>
);

export default function Index({ accounts }) {
  const [openModal, setOpenModal] = React.useState(false);
  const [openEditModal, setOpenEditModal] = React.useState(false);
  const [editingAccount, setEditingAccount] = React.useState(null);
  const fileInputRef = React.useRef(null);
  const [query, setQuery] = React.useState('');
  const [typeFilter, setTypeFilter] = React.useState('all');
  const [levelFilter, setLevelFilter] = React.useState('all');
  const [parentFilter, setParentFilter] = React.useState('all');
  const [showInactive, setShowInactive] = React.useState(false);
  const [expanded, setExpanded] = React.useState(() => new Set());

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

  const codePreview = [data.segment1, data.segment2, data.segment3, data.segment4]
    .filter((seg) => seg !== null && seg !== undefined && String(seg).trim() !== '')
    .join('-');

  const selectedParent = data.parent_id
    ? accounts.find((acc) => String(acc.id) === String(data.parent_id))
    : null;
  const createHierarchyInfo = React.useMemo(
    () => getHierarchyInfo([data.segment1, data.segment2, data.segment3, data.segment4]),
    [data.segment1, data.segment2, data.segment3, data.segment4]
  );

  const submit = (e) => {
    e.preventDefault();
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

  const editHierarchyInfo = React.useMemo(
    () => getHierarchyInfo([editData.segment1, editData.segment2, editData.segment3, editData.segment4]),
    [editData.segment1, editData.segment2, editData.segment3, editData.segment4]
  );
  const editSelectedParent = editData.parent_id
    ? accounts.find((acc) => String(acc.id) === String(editData.parent_id))
    : null;

  const submitEdit = (e) => {
    e.preventDefault();
    if (!editingAccount) return;
    put(route('accounting.coa.update', editingAccount.id), {
      onSuccess: () => {
        closeEdit();
      },
    });
  };

  const activeAccounts = accounts.filter((acc) => acc.is_active !== false);
  const totalAccounts = activeAccounts.length;
  const typeCounts = {
    asset: activeAccounts.filter((acc) => acc.type === 'asset').length,
    liability: activeAccounts.filter((acc) => acc.type === 'liability').length,
    equity: activeAccounts.filter((acc) => acc.type === 'equity').length,
    income: activeAccounts.filter((acc) => acc.type === 'income').length,
    expense: activeAccounts.filter((acc) => acc.type === 'expense').length,
  };

  const accountMap = React.useMemo(() => {
    const map = new Map();
    accounts.forEach((acc) => map.set(acc.id, { ...acc, children: [] }));
    accounts.forEach((acc) => {
      if (acc.parent_id && map.has(acc.parent_id)) {
        map.get(acc.parent_id).children.push(map.get(acc.id));
      }
    });
    map.forEach((node) => {
      node.children.sort((a, b) => String(a.full_code).localeCompare(String(b.full_code)));
    });
    return map;
  }, [accounts]);

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
  }, [editingAccount, accountMap]);

  const roots = React.useMemo(
    () =>
      accounts
        .filter((acc) => !acc.parent_id || !accountMap.has(acc.parent_id))
        .map((acc) => accountMap.get(acc.id))
        .filter(Boolean)
        .sort((a, b) => String(a.full_code).localeCompare(String(b.full_code))),
    [accounts, accountMap]
  );

  const aggregatedBalances = React.useMemo(() => {
    const result = new Map();

    const walk = (node) => {
      let total = Number(node.direct_balance || 0);
      (node.children || []).forEach((child) => {
        total += walk(child);
      });
      result.set(node.id, total);
      return total;
    };

    roots.forEach((root) => walk(root));
    return result;
  }, [roots]);

  const parentOptions = React.useMemo(
    () =>
      accounts
        .filter((acc) => acc.is_postable === false || acc.is_postable === 0 || acc.level < 4)
        .sort((a, b) => String(a.full_code).localeCompare(String(b.full_code))),
    [accounts]
  );

  const eligibleCreateParents = React.useMemo(() => {
    if (createHierarchyInfo.hasGap) return [];
    if (createHierarchyInfo.level <= 1) return [];
    const targetLevel = createHierarchyInfo.level - 1;
    return accounts
      .filter((acc) => acc.type === data.type)
      .filter((acc) => Number(acc.level) === targetLevel)
      .filter((acc) => matchesPrefix(acc, createHierarchyInfo.segments))
      .sort((a, b) => String(a.full_code).localeCompare(String(b.full_code)));
  }, [accounts, createHierarchyInfo, data.type]);

  const eligibleEditParents = React.useMemo(() => {
    if (!editingAccount) return [];
    if (editHierarchyInfo.hasGap) return [];
    if (editHierarchyInfo.level <= 1) return [];
    const targetLevel = editHierarchyInfo.level - 1;
    return accounts
      .filter((acc) => Number(acc.id) !== Number(editingAccount.id))
      .filter((acc) => !descendantIds.has(Number(acc.id)))
      .filter((acc) => acc.type === editData.type)
      .filter((acc) => Number(acc.level) === targetLevel)
      .filter((acc) => matchesPrefix(acc, editHierarchyInfo.segments))
      .sort((a, b) => String(a.full_code).localeCompare(String(b.full_code)));
  }, [accounts, editingAccount, descendantIds, editData.type, editHierarchyInfo]);

  React.useEffect(() => {
    if (!data.parent_id) return;
    const isAllowed = eligibleCreateParents.some((acc) => String(acc.id) === String(data.parent_id));
    if (!isAllowed) {
      setData('parent_id', '');
    }
  }, [data.parent_id, eligibleCreateParents, setData]);

  React.useEffect(() => {
    if (!editData.parent_id) return;
    const isAllowed = eligibleEditParents.some((acc) => String(acc.id) === String(editData.parent_id));
    if (!isAllowed) {
      setEditData('parent_id', '');
    }
  }, [editData.parent_id, eligibleEditParents, setEditData]);

  const matchesFilters = (node) => {
    const search = query.trim().toLowerCase();
    const searchMatch =
      search.length === 0 ||
      String(node.full_code || '').toLowerCase().includes(search) ||
      String(node.name || '').toLowerCase().includes(search);
    const typeMatch = typeFilter === 'all' || node.type === typeFilter;
    const levelMatch = levelFilter === 'all' || Number(node.level) === Number(levelFilter);
    const activeMatch = showInactive || node.is_active !== false;
    return searchMatch && typeMatch && levelMatch && activeMatch;
  };

  const filterTree = (nodes) =>
    nodes
      .map((node) => {
        const children = filterTree(node.children || []);
        if (matchesFilters(node) || children.length > 0) {
          return { ...node, children };
        }
        return null;
      })
      .filter(Boolean);

  const scopedRoots =
    parentFilter === 'all'
      ? roots
      : [accountMap.get(Number(parentFilter))].filter(Boolean);

  const filteredRoots = filterTree(scopedRoots);

  const countNodes = (nodes) => nodes.reduce((sum, node) => sum + 1 + countNodes(node.children || []), 0);

  const groupedRoots = React.useMemo(() => {
    const types = ['asset', 'liability', 'equity', 'income', 'expense'];
    return types
      .map((type) => ({
        type,
        label: typeLabels[type] || type,
        nodes: filteredRoots.filter((node) => node.type === type),
      }))
      .map((group) => ({
        ...group,
        count: countNodes(group.nodes),
      }))
      .filter((group) => group.nodes.length > 0);
  }, [filteredRoots]);

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

  const toggleExpand = (id) => {
    setExpanded((prev) => {
      const next = new Set(prev);
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
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expanded.has(node.id);
    return (
      <React.Fragment key={node.id}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            py: 1.25,
            px: 1.5,
            mb: 1,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            backgroundColor: 'background.paper',
            pl: 1.5 + depth * 2,
          }}
        >
          <IconButton size="small" onClick={() => toggleExpand(node.id)} disabled={!hasChildren}>
            {hasChildren ? (isExpanded ? <ExpandMore fontSize="small" /> : <ChevronRight fontSize="small" />) : <Box sx={{ width: 24 }} />}
          </IconButton>
          <Box sx={{ minWidth: 110 }}>
            <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>
              {node.full_code}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Level {node.level}
              {node.parent_id && accountMap.has(node.parent_id) && (
                <> · Parent {accountMap.get(node.parent_id).full_code}</>
              )}
            </Typography>
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {node.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Direct: {Number(node.direct_balance || 0).toFixed(2)} | Roll-up: {Number(aggregatedBalances.get(node.id) || 0).toFixed(2)}
            </Typography>
          </Box>
          <Chip
            label={typeLabels[node.type] || node.type}
            size="small"
            variant="outlined"
            sx={{ borderColor: 'primary.main', color: 'primary.main' }}
          />
          <Chip label={node.is_postable ? 'Postable' : 'Header'} size="small" />
          {(node.usage?.rules || 0) > 0 && <Chip label={`Rules ${node.usage.rules}`} size="small" color="info" variant="outlined" />}
          {(node.usage?.payment_accounts || 0) > 0 && <Chip label={`Banks ${node.usage.payment_accounts}`} size="small" color="info" variant="outlined" />}
          {(node.usage?.journal_lines || 0) > 0 && <Chip label={`Entries ${node.usage.journal_lines}`} size="small" color="info" variant="outlined" />}
          {!node.is_active && <Chip label="Inactive" size="small" color="warning" variant="outlined" />}
          <Button
            size="small"
            variant="outlined"
            onClick={() => openEdit(node)}
          >
            Edit
          </Button>
          <Button
            size="small"
            color="error"
            onClick={() => router.delete(route('accounting.coa.destroy', node.id))}
          >
            Delete
          </Button>
        </Box>
        {hasChildren && isExpanded && (
          <Box sx={{ ml: 1 }}>
            {node.children.map((child) => renderNode(child, depth + 1))}
          </Box>
        )}
      </React.Fragment>
    );
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ color: 'primary.main', fontWeight: 700 }}>Chart of Accounts</Typography>
          <Typography variant="body2" color="text.secondary">
            Build a clean hierarchy with consistent codes and levels.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" onClick={() => window.open(route('accounting.coa.template'), '_blank')}>
            Template
          </Button>
          <Button variant="outlined" onClick={() => fileInputRef.current?.click()}>
            Import CSV
          </Button>
          <Button variant="contained" onClick={() => setOpenModal(true)} startIcon={<Add />}>
            Add Account
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              router.post(route('accounting.coa.import'), { file }, { forceFormData: true });
              e.target.value = '';
            }}
          />
        </Box>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={2}>
          <StatCard label="Total Accounts" value={totalAccounts} tone="muted" />
        </Grid>
        <Grid item xs={12} md={2}>
          <StatCard label="Assets" value={typeCounts.asset} />
        </Grid>
        <Grid item xs={12} md={2}>
          <StatCard label="Liabilities" value={typeCounts.liability} />
        </Grid>
        <Grid item xs={12} md={2}>
          <StatCard label="Equity" value={typeCounts.equity} />
        </Grid>
        <Grid item xs={12} md={2}>
          <StatCard label="Revenue" value={typeCounts.income} />
        </Grid>
        <Grid item xs={12} md={2}>
          <StatCard label="Expenses" value={typeCounts.expense} />
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Accounts</Typography>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} md={4}>
              <TextField
                label="Search by name or code"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                select
                label="Category"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                fullWidth
              >
                <MenuItem value="all">All Categories</MenuItem>
                <MenuItem value="asset">Assets</MenuItem>
                <MenuItem value="liability">Liabilities</MenuItem>
                <MenuItem value="equity">Equity</MenuItem>
                <MenuItem value="income">Revenue</MenuItem>
                <MenuItem value="expense">Expenses</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                select
                label="Level"
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                fullWidth
              >
                <MenuItem value="all">All Levels</MenuItem>
                {[1, 2, 3, 4].map((level) => (
                  <MenuItem key={level} value={level}>{`Level ${level}`}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                select
                label="Parent"
                value={parentFilter}
                onChange={(e) => setParentFilter(e.target.value)}
                fullWidth
              >
                <MenuItem value="all">All Parents</MenuItem>
                {parentOptions.map((acc) => (
                  <MenuItem key={acc.id} value={acc.id}>
                    {acc.full_code} - {acc.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={3} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={showInactive}
                    onChange={(e) => setShowInactive(e.target.checked)}
                  />
                }
                label="Show inactive"
              />
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button size="small" variant="outlined" onClick={expandAll}>
                  Expand All
                </Button>
                <Button size="small" variant="outlined" onClick={collapseAll}>
                  Collapse All
                </Button>
              </Box>
            </Grid>
          </Grid>

          {groupedRoots.length === 0 && (
            <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>No accounts found.</Box>
          )}
          {groupedRoots.map((group) => (
            <Box key={group.type} sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main' }}>
                  {group.label}
                </Typography>
                <Chip label={group.count} size="small" sx={{ bgcolor: 'primary.main', color: '#fff' }} />
              </Box>
              {group.nodes.map((node) => renderNode(node))}
            </Box>
          ))}
        </CardContent>
      </Card>

      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add Account</DialogTitle>
        <form onSubmit={submit}>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 0 }}>
              <Grid item xs={12} md={3}>
                <TextField
                  label="Segment 1"
                  value={data.segment1}
                  onChange={(e) => setData('segment1', e.target.value)}
                  error={!!errors.segment1}
                  helperText={errors.segment1}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  label="Segment 2"
                  value={data.segment2}
                  onChange={(e) => setData('segment2', e.target.value)}
                  error={!!errors.segment2}
                  helperText={errors.segment2}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  label="Segment 3"
                  value={data.segment3}
                  onChange={(e) => setData('segment3', e.target.value)}
                  error={!!errors.segment3}
                  helperText={errors.segment3}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  label="Segment 4"
                  value={data.segment4}
                  onChange={(e) => setData('segment4', e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Account Name"
                  value={data.name}
                  onChange={(e) => setData('name', e.target.value)}
                  error={!!errors.name}
                  helperText={errors.name}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  select
                  label="Type"
                  value={data.type}
                  onChange={(e) => setData('type', e.target.value)}
                  fullWidth
                  disabled={!!selectedParent}
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
                  label="Parent (optional)"
                  value={data.parent_id}
                  onChange={(e) => {
                    const next = e.target.value;
                    setData('parent_id', next);
                    const parent = accounts.find((acc) => String(acc.id) === String(next));
                    if (parent) {
                      setData('type', parent.type);
                    }
                  }}
                  fullWidth
                >
                  <MenuItem value="">None</MenuItem>
                  {eligibleCreateParents.map((acc) => (
                    <MenuItem key={acc.id} value={acc.id}>
                      {acc.full_code} - {acc.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  select
                  label="Postable"
                  value={data.is_postable ? 'yes' : 'no'}
                  onChange={(e) => setData('is_postable', e.target.value === 'yes')}
                  fullWidth
                >
                  <MenuItem value="yes">Yes</MenuItem>
                  <MenuItem value="no">No</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  select
                  label="Active"
                  value={data.is_active ? 'yes' : 'no'}
                  onChange={(e) => setData('is_active', e.target.value === 'yes')}
                  fullWidth
                >
                  <MenuItem value="yes">Yes</MenuItem>
                  <MenuItem value="no">No</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">
                  Code Preview: {codePreview || '—'}
                  {selectedParent && ` · Type locked to ${typeLabels[selectedParent.type] || selectedParent.type}`}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" color={createHierarchyInfo.hasGap ? 'error.main' : 'text.secondary'}>
                  Target Level: {createHierarchyInfo.level || 'n/a'} ·
                  {createHierarchyInfo.hasGap
                    ? ' Please fill segments in order (L1 -> L4).'
                    : createHierarchyInfo.level <= 1
                      ? ' Root account (no parent).'
                      : ` Parent must be level ${createHierarchyInfo.level - 1} with same code prefix and type.`}
                </Typography>
              </Grid>
              {!!errors.parent_id && (
                <Grid item xs={12}>
                  <Typography variant="caption" color="error">
                    {errors.parent_id}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setOpenModal(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={processing}>
              Create Account
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog open={openEditModal} onClose={closeEdit} maxWidth="md" fullWidth>
        <DialogTitle>Edit Account</DialogTitle>
        <form onSubmit={submitEdit}>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 0 }}>
              <Grid item xs={12} md={3}>
                <TextField
                  label="Segment 1"
                  value={editData.segment1}
                  onChange={(e) => setEditData('segment1', e.target.value)}
                  error={!!editErrors.segment1}
                  helperText={editErrors.segment1}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  label="Segment 2"
                  value={editData.segment2}
                  onChange={(e) => setEditData('segment2', e.target.value)}
                  error={!!editErrors.segment2}
                  helperText={editErrors.segment2}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  label="Segment 3"
                  value={editData.segment3}
                  onChange={(e) => setEditData('segment3', e.target.value)}
                  error={!!editErrors.segment3}
                  helperText={editErrors.segment3}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  label="Segment 4"
                  value={editData.segment4}
                  onChange={(e) => setEditData('segment4', e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Account Name"
                  value={editData.name}
                  onChange={(e) => setEditData('name', e.target.value)}
                  error={!!editErrors.name}
                  helperText={editErrors.name}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  select
                  label="Type"
                  value={editData.type}
                  onChange={(e) => setEditData('type', e.target.value)}
                  error={!!editErrors.type}
                  helperText={editErrors.type}
                  disabled={!!editSelectedParent}
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
                  label="Parent (optional)"
                  value={editData.parent_id}
                  onChange={(e) => {
                    const next = e.target.value;
                    setEditData('parent_id', next);
                    const parent = accounts.find((acc) => String(acc.id) === String(next));
                    if (parent) {
                      setEditData('type', parent.type);
                    }
                  }}
                  fullWidth
                >
                  <MenuItem value="">None</MenuItem>
                  {eligibleEditParents.map((acc) => (
                      <MenuItem key={acc.id} value={acc.id}>
                        {acc.full_code} - {acc.name}
                      </MenuItem>
                    ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  select
                  label="Postable"
                  value={editData.is_postable ? 'yes' : 'no'}
                  onChange={(e) => setEditData('is_postable', e.target.value === 'yes')}
                  fullWidth
                >
                  <MenuItem value="yes">Yes</MenuItem>
                  <MenuItem value="no">No</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  select
                  label="Active"
                  value={editData.is_active ? 'yes' : 'no'}
                  onChange={(e) => setEditData('is_active', e.target.value === 'yes')}
                  fullWidth
                >
                  <MenuItem value="yes">Yes</MenuItem>
                  <MenuItem value="no">No</MenuItem>
                </TextField>
              </Grid>
              {!!editErrors.is_active && (
                <Grid item xs={12}>
                  <Typography variant="caption" color="error">
                    {editErrors.is_active}
                  </Typography>
                </Grid>
              )}
              <Grid item xs={12}>
                <Typography variant="caption" color={editHierarchyInfo.hasGap ? 'error.main' : 'text.secondary'}>
                  Target Level: {editHierarchyInfo.level || 'n/a'} ·
                  {editHierarchyInfo.hasGap
                    ? ' Please fill segments in order (L1 -> L4).'
                    : editHierarchyInfo.level <= 1
                      ? ' Root account (no parent).'
                      : ` Parent must be level ${editHierarchyInfo.level - 1} with same code prefix and type.`}
                </Typography>
              </Grid>
              {!!editErrors.parent_id && (
                <Grid item xs={12}>
                  <Typography variant="caption" color="error">
                    {editErrors.parent_id}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={closeEdit}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={editProcessing}>
              Save Changes
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
