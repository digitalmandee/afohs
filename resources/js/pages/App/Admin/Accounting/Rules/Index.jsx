import React from 'react';
import { router, useForm } from '@inertiajs/react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { Add, DeleteOutline } from '@mui/icons-material';
import Pagination from '@/components/Pagination';

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

export default function Index({ rules, coaAccounts = [] }) {
  const [openModal, setOpenModal] = React.useState(false);
  const [editingRuleId, setEditingRuleId] = React.useState(null);
  const list = rules?.data || [];

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
    (coaAccounts || []).forEach((acc) => map.set(Number(acc.id), acc));
    return map;
  }, [coaAccounts]);

  const existingCodes = React.useMemo(() => new Set(list.map((rule) => rule.code)), [list]);
  const missingStandardRules = standardRuleCodes.filter((item) => !existingCodes.has(item.code));

  const openCreate = () => {
    setEditingRuleId(null);
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
    setData(
      'lines',
      data.lines.filter((_, i) => i !== index)
    );
  };

  const submit = (e) => {
    e.preventDefault();
    if (editingRuleId) {
      put(route('accounting.rules.update', editingRuleId), {
        onSuccess: () => setOpenModal(false),
      });
      return;
    }

    post(route('accounting.rules.store'), {
      onSuccess: () => setOpenModal(false),
    });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4" sx={{ color: 'primary.main', fontWeight: 700 }}>Posting Rules</Typography>
        <Button variant="contained" onClick={openCreate} startIcon={<Add />}>
          Add Rule
        </Button>
      </Box>

      {missingStandardRules.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Missing rule mappings: {missingStandardRules.map((item) => item.code).join(', ')}
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ mb: 1, color: 'primary.main', fontWeight: 700 }}>
            Standard Integration Coverage
          </Typography>
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
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Code</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Lines</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {list.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center">No posting rules.</TableCell>
                </TableRow>
              )}
              {list.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell>{rule.code}</TableCell>
                  <TableCell>{rule.name}</TableCell>
                  <TableCell>{(rule.lines || []).length}</TableCell>
                  <TableCell>
                    <Chip label={rule.is_active ? 'Active' : 'Inactive'} size="small" color={rule.is_active ? 'success' : 'default'} />
                  </TableCell>
                  <TableCell align="right">
                    <Button size="small" onClick={() => openEdit(rule)}>Edit</Button>
                    <Button size="small" color="error" onClick={() => router.delete(route('accounting.rules.destroy', rule.id))}>Delete</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination data={rules} />
        </CardContent>
      </Card>

      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingRuleId ? 'Edit Posting Rule' : 'Add Posting Rule'}</DialogTitle>
        <form onSubmit={submit}>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 0 }}>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Code"
                  value={data.code}
                  onChange={(e) => setData('code', e.target.value)}
                  error={!!errors.code}
                  helperText={errors.code}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Name"
                  value={data.name}
                  onChange={(e) => setData('name', e.target.value)}
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
                  onChange={(e) => setData('is_active', e.target.value === 'yes')}
                  fullWidth
                >
                  <MenuItem value="yes">Yes</MenuItem>
                  <MenuItem value="no">No</MenuItem>
                </TextField>
              </Grid>
            </Grid>

            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" sx={{ mb: 1 }}>Rule Lines</Typography>
              {!!errors.lines && (
                <Typography variant="caption" color="error" sx={{ display: 'block', mb: 1 }}>
                  {errors.lines}
                </Typography>
              )}
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
                        onChange={(e) => updateLine(index, 'account_id', e.target.value)}
                        fullWidth
                        disabled={!!line.use_payment_account}
                        error={!!accountFieldError}
                        helperText={
                          accountFieldError
                          || (line.use_payment_account
                            ? 'Will use selected payment/bank account mapping at runtime.'
                            : selectedAccount
                              ? `${selectedAccount.full_code} · ${selectedAccount.type} · L${selectedAccount.level}`
                              : 'Select posting account')
                        }
                      >
                        <MenuItem value="">Select account</MenuItem>
                        {coaAccounts.map((acc) => (
                          <MenuItem key={acc.id} value={acc.id}>
                            {acc.full_code} - {acc.name}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <TextField
                        select
                        label="Side"
                        value={line.side}
                        onChange={(e) => updateLine(index, 'side', e.target.value)}
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
                        onChange={(e) => updateLine(index, 'ratio', e.target.value)}
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
                        onChange={(e) => {
                          const usePaymentAccount = e.target.value === 'yes';
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
    </Box>
  );
}
