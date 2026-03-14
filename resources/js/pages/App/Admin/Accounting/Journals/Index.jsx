import React from 'react';
import { Link, router, useForm } from '@inertiajs/react';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import debounce from 'lodash.debounce';
import AppPage from '@/components/App/ui/AppPage';
import FilterToolbar from '@/components/App/ui/FilterToolbar';
import Pagination from '@/components/Pagination';
import StatCard from '@/components/App/ui/StatCard';
import SurfaceCard from '@/components/App/ui/SurfaceCard';

export default function Index({ entries, filters, summary, templatesEnabled, templates = [], recurringProfiles = [], approvalPolicy }) {
  const data = entries?.data || [];
  const [localFilters, setLocalFilters] = React.useState({
    search: filters?.search || '',
    status: filters?.status || '',
    from: filters?.from || '',
    to: filters?.to || '',
    per_page: filters?.per_page || entries?.per_page || 25,
    page: 1,
  });
  const filtersRef = React.useRef(localFilters);

  const submitFilters = React.useCallback((nextFilters) => {
    const payload = {};

    if (nextFilters.search?.trim()) {
      payload.search = nextFilters.search.trim();
    }
    if (nextFilters.status) {
      payload.status = nextFilters.status;
    }
    if (nextFilters.from) {
      payload.from = nextFilters.from;
    }
    if (nextFilters.to) {
      payload.to = nextFilters.to;
    }
    payload.per_page = nextFilters.per_page || 25;
    if (Number(nextFilters.page) > 1) {
      payload.page = Number(nextFilters.page);
    }

    router.get(route('accounting.journals.index'), payload, {
      preserveState: false,
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
      from: filters?.from || '',
      to: filters?.to || '',
      per_page: filters?.per_page || entries?.per_page || 25,
      page: 1,
    };
    filtersRef.current = next;
    setLocalFilters(next);
  }, [entries?.per_page, filters?.from, filters?.per_page, filters?.search, filters?.status, filters?.to]);

  const updateFilters = React.useCallback(
    (partial, { immediate = false } = {}) => {
      const nextFilters = {
        ...filtersRef.current,
        ...partial,
      };

      if (!Object.prototype.hasOwnProperty.call(partial, 'page')) {
        nextFilters.page = 1;
      }

      filtersRef.current = nextFilters;
      setLocalFilters(nextFilters);

      if (immediate) {
        debouncedSubmit.cancel();
        submitFilters(nextFilters);
        return;
      }

      debouncedSubmit(nextFilters);
    },
    [debouncedSubmit, submitFilters],
  );

  const updateFilter = React.useCallback(
    (name, value, options = {}) => {
      updateFilters({ [name]: value }, options);
    },
    [updateFilters],
  );

  const resetFilters = React.useCallback(() => {
    const next = {
      search: '',
      status: '',
      from: '',
      to: '',
      per_page: localFilters.per_page || 25,
      page: 1,
    };
    debouncedSubmit.cancel();
    filtersRef.current = next;
    setLocalFilters(next);
    submitFilters(next);
  }, [debouncedSubmit, localFilters.per_page, submitFilters]);
  const [openApply, setOpenApply] = React.useState(false);
  const [openRecurring, setOpenRecurring] = React.useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = React.useState('');
  const { data: applyData, setData: setApplyData, post: postApply, processing: applying, reset: resetApply } = useForm({
    entry_date: '',
    description: '',
  });
  const { data: recurringData, setData: setRecurringData, post: postRecurring, processing: recurringProcessing, reset: resetRecurring } = useForm({
    frequency: 'monthly',
    next_run_date: '',
  });
  const {
    data: policyData,
    setData: setPolicyData,
    post: postPolicy,
    processing: savingPolicy,
  } = useForm({
    is_active: true,
    enforce_maker_checker: true,
    approver_role: '',
    level1_role: '',
    level1_max_amount: '',
    level2_role: '',
    sla_hours: '',
    escalation_role: '',
    auto_post_below: '',
  });

  const onApplyTemplate = (e) => {
    e.preventDefault();
    if (!selectedTemplateId) return;
    postApply(route('accounting.journals.template.apply', selectedTemplateId), {
      onSuccess: () => {
        resetApply();
        setSelectedTemplateId('');
        setOpenApply(false);
      },
    });
  };

  const onScheduleRecurring = (e) => {
    e.preventDefault();
    if (!selectedTemplateId) return;
    postRecurring(route('accounting.journals.template.recurring', selectedTemplateId), {
      onSuccess: () => {
        resetRecurring();
        setSelectedTemplateId('');
        setOpenRecurring(false);
      },
    });
  };

  React.useEffect(() => {
    setPolicyData('is_active', approvalPolicy?.is_active ?? true);
    setPolicyData('enforce_maker_checker', approvalPolicy?.enforce_maker_checker ?? true);
    setPolicyData('approver_role', approvalPolicy?.approver_role ?? '');
    setPolicyData('level1_role', approvalPolicy?.level1_role ?? '');
    setPolicyData('level1_max_amount', approvalPolicy?.level1_max_amount ?? '');
    setPolicyData('level2_role', approvalPolicy?.level2_role ?? '');
    setPolicyData('sla_hours', approvalPolicy?.sla_hours ?? '');
    setPolicyData('escalation_role', approvalPolicy?.escalation_role ?? '');
    setPolicyData('auto_post_below', approvalPolicy?.auto_post_below ?? '');
  }, [approvalPolicy, setPolicyData]);

  const savePolicy = (e) => {
    e.preventDefault();
    postPolicy(route('accounting.journals.policy.save'));
  };

  return (
    <AppPage
      eyebrow="Accounting"
      title="Journal Entries"
      subtitle="Manage draft, approval, and posting activity with a denser accounting workspace and live filters."
      actions={[
          <Button key="approvals" variant="outlined" onClick={() => router.visit(route('accounting.journals.approvals'))}>
            Approval Inbox
          </Button>,
          <Button key="create" variant="contained" onClick={() => router.visit(route('accounting.journals.create'))}>
            New Journal
          </Button>,
      ]}
    >

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}><StatCard label="Total" value={summary?.records || 0} /></Grid>
        <Grid item xs={12} md={3}><StatCard label="Draft" value={summary?.draft || 0} tone="light" /></Grid>
        <Grid item xs={12} md={3}><StatCard label="Posted" value={summary?.posted || 0} tone="light" /></Grid>
        <Grid item xs={12} md={3}><StatCard label="Reversed" value={summary?.reversed || 0} tone="light" /></Grid>
      </Grid>

      {templatesEnabled && (
        <SurfaceCard title="Templates & Recurring" subtitle="Reuse recurring journals and execute due template schedules from one place.">
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button variant="outlined" onClick={() => setOpenApply(true)} disabled={templates.length === 0}>Apply Template</Button>
                <Button variant="outlined" onClick={() => setOpenRecurring(true)} disabled={templates.length === 0}>Schedule Recurring</Button>
                <Button variant="contained" onClick={() => router.post(route('accounting.journals.recurring.run'))}>Run Due Recurring</Button>
              </Box>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Active Templates</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {templates.length === 0 && <Typography variant="caption" color="text.secondary">No templates yet.</Typography>}
                  {templates.map((tpl) => (
                    <Chip key={tpl.id} label={tpl.name} size="small" variant="outlined" />
                  ))}
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Recurring Queue</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {recurringProfiles.length === 0 && <Typography variant="caption" color="text.secondary">No recurring profiles.</Typography>}
                  {recurringProfiles.map((p) => (
                    <Chip key={p.id} size="small" label={`${p.template?.name || 'Template'} · ${p.frequency} · ${p.next_run_date || '-'}`} />
                  ))}
                </Box>
              </Grid>
            </Grid>
        </SurfaceCard>
      )}

      <SurfaceCard title="Approval Controls" subtitle="Configure maker-checker thresholds, role routing, and reminder timing for journals.">
          <form onSubmit={savePolicy}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={2}>
                <TextField
                  select
                  label="Policy Active"
                  value={policyData.is_active ? 'yes' : 'no'}
                  onChange={(e) => setPolicyData('is_active', e.target.value === 'yes')}
                  fullWidth
                >
                  <MenuItem value="yes">Yes</MenuItem>
                  <MenuItem value="no">No</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  select
                  label="Maker Checker"
                  value={policyData.enforce_maker_checker ? 'yes' : 'no'}
                  onChange={(e) => setPolicyData('enforce_maker_checker', e.target.value === 'yes')}
                  fullWidth
                >
                  <MenuItem value="yes">Enforce</MenuItem>
                  <MenuItem value="no">Disable</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField
                  type="number"
                  label="Auto-Post Below"
                  value={policyData.auto_post_below}
                  onChange={(e) => setPolicyData('auto_post_below', e.target.value)}
                  inputProps={{ min: 0, step: '0.01' }}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <Button type="submit" variant="contained" fullWidth disabled={savingPolicy}>
                  Save Policy
                </Button>
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  label="Legacy Single Role"
                  value={policyData.approver_role}
                  onChange={(e) => setPolicyData('approver_role', e.target.value)}
                  placeholder="finance-manager"
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  label="Level 1 Role"
                  value={policyData.level1_role}
                  onChange={(e) => setPolicyData('level1_role', e.target.value)}
                  placeholder="finance-executive"
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField
                  type="number"
                  label="L1 Max Amount"
                  value={policyData.level1_max_amount}
                  onChange={(e) => setPolicyData('level1_max_amount', e.target.value)}
                  inputProps={{ min: 0, step: '0.01' }}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField
                  label="Level 2 Role"
                  value={policyData.level2_role}
                  onChange={(e) => setPolicyData('level2_role', e.target.value)}
                  placeholder="finance-manager"
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField
                  type="number"
                  label="SLA (Hours)"
                  value={policyData.sla_hours}
                  onChange={(e) => setPolicyData('sla_hours', e.target.value)}
                  inputProps={{ min: 1, step: 1 }}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  label="Escalation Role"
                  value={policyData.escalation_role}
                  onChange={(e) => setPolicyData('escalation_role', e.target.value)}
                  placeholder="finance-director"
                  fullWidth
                />
              </Grid>
            </Grid>
          </form>
      </SurfaceCard>

      <SurfaceCard title="Live Filters" subtitle="Results update automatically while you search, change status, or adjust date range.">
          <FilterToolbar onReset={resetFilters}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={3}>
                <TextField
                  label="Search entry or description"
                  value={localFilters.search}
                  onChange={(e) => updateFilter('search', e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField
                  select
                  label="Status"
                  value={localFilters.status}
                  onChange={(e) => updateFilter('status', e.target.value, { immediate: true })}
                  fullWidth
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="posted">Posted</MenuItem>
                  <MenuItem value="reversed">Reversed</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField
                  label="From"
                  type="date"
                  value={localFilters.from}
                  onChange={(e) => updateFilter('from', e.target.value, { immediate: true })}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField
                  label="To"
                  type="date"
                  value={localFilters.to}
                  onChange={(e) => updateFilter('to', e.target.value, { immediate: true })}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
              </Grid>
            </Grid>
          </FilterToolbar>
      </SurfaceCard>

      <SurfaceCard title="Journal Register" subtitle="Operational list of draft, posted, and reversed entries with standardized density and pagination.">
          <Table size="small">
            <TableHead>
              <TableRow
                sx={{
                  '& .MuiTableCell-head': {
                    bgcolor: '#0a3d62',
                    color: '#f8fafc',
                    borderBottom: 'none',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    py: 1.35,
                  },
                  '& .MuiTableCell-head:first-of-type': {
                    borderTopLeftRadius: 16,
                  },
                  '& .MuiTableCell-head:last-of-type': {
                    borderTopRightRadius: 16,
                  },
                }}
              >
                <TableCell>Entry No</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Description</TableCell>
                <TableCell align="right">Debit</TableCell>
                <TableCell align="right">Credit</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 5 }}>No entries found.</TableCell>
                </TableRow>
              )}
              {data.map((entry) => (
                <TableRow
                  key={entry.id}
                  hover
                  sx={{
                    '& .MuiTableCell-body': {
                      py: 1.45,
                      borderBottomColor: '#edf2f7',
                    },
                  }}
                >
                  <TableCell sx={{ fontWeight: 700, color: 'text.primary' }}>{entry.entry_no}</TableCell>
                  <TableCell>{entry.entry_date}</TableCell>
                  <TableCell>
                    <Chip
                      label={entry.status}
                      size="small"
                      color={entry.status === 'posted' ? 'success' : entry.status === 'reversed' ? 'warning' : 'default'}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{entry.description || '-'}</TableCell>
                  <TableCell align="right">{Number(entry.total_debit || 0).toFixed(2)}</TableCell>
                  <TableCell align="right">{Number(entry.total_credit || 0).toFixed(2)}</TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'inline-flex', gap: 1, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      <Link href={route('accounting.journals.show', entry.id)}>Open</Link>
                      {entry.status === 'draft' && (
                        <>
                          <Button size="small" variant="outlined" onClick={() => router.visit(route('accounting.journals.edit', entry.id))}>Edit</Button>
                          <Button size="small" variant="outlined" onClick={() => router.post(route('accounting.journals.submit', entry.id))}>Submit</Button>
                          <Button size="small" color="success" variant="outlined" onClick={() => router.post(route('accounting.journals.approve', entry.id))}>Approve/Post</Button>
                        </>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination data={entries} />
      </SurfaceCard>

      <Dialog open={openApply} onClose={() => setOpenApply(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Apply Journal Template</DialogTitle>
        <form onSubmit={onApplyTemplate}>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 0 }}>
              <Grid item xs={12}>
                <TextField
                  select
                  label="Template"
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  fullWidth
                >
                  <MenuItem value="">Select</MenuItem>
                  {templates.map((tpl) => <MenuItem key={tpl.id} value={tpl.id}>{tpl.name}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField label="Entry Date" type="date" InputLabelProps={{ shrink: true }} value={applyData.entry_date} onChange={(e) => setApplyData('entry_date', e.target.value)} fullWidth />
              </Grid>
              <Grid item xs={12}>
                <TextField label="Description (optional)" value={applyData.description} onChange={(e) => setApplyData('description', e.target.value)} fullWidth />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setOpenApply(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={!selectedTemplateId || applying}>Create Draft</Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog open={openRecurring} onClose={() => setOpenRecurring(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Schedule Recurring Journal</DialogTitle>
        <form onSubmit={onScheduleRecurring}>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 0 }}>
              <Grid item xs={12}>
                <TextField
                  select
                  label="Template"
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  fullWidth
                >
                  <MenuItem value="">Select</MenuItem>
                  {templates.map((tpl) => <MenuItem key={tpl.id} value={tpl.id}>{tpl.name}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  select
                  label="Frequency"
                  value={recurringData.frequency}
                  onChange={(e) => setRecurringData('frequency', e.target.value)}
                  fullWidth
                >
                  <MenuItem value="weekly">Weekly</MenuItem>
                  <MenuItem value="monthly">Monthly</MenuItem>
                  <MenuItem value="quarterly">Quarterly</MenuItem>
                  <MenuItem value="yearly">Yearly</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField label="Next Run Date" type="date" InputLabelProps={{ shrink: true }} value={recurringData.next_run_date} onChange={(e) => setRecurringData('next_run_date', e.target.value)} fullWidth />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setOpenRecurring(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={!selectedTemplateId || recurringProcessing}>Save Schedule</Button>
          </DialogActions>
        </form>
      </Dialog>
    </AppPage>
  );
}
