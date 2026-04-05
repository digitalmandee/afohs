import React from 'react';
import { router, useForm } from '@inertiajs/react';
import { Alert, Box, Card, CardContent, Checkbox, Chip, FormControlLabel, Grid, MenuItem, TextField, Typography } from '@mui/material';
import AppLoadingButton from '@/components/App/ui/AppLoadingButton';
import ConfirmActionDialog from '@/components/App/ui/ConfirmActionDialog';
import useMutationAction from '@/hooks/useMutationAction';
import { formatAmount } from '@/lib/formatting';

export default function Index({ advances, vendors = [], openBills = [], poLockOverrideAllowed = false }) {
  const mutation = useMutationAction();
  const { data, setData, post, processing, errors, reset } = useForm({
    vendor_id: '',
    purchase_order_id: '',
    payment_account_id: '',
    advance_date: new Date().toISOString().slice(0, 10),
    amount: '',
    reference: '',
    remarks: '',
  });
  const [applyState, setApplyState] = React.useState({});

  const submit = (e) => {
    e.preventDefault();
    mutation.runAction({
      key: 'sa-create',
      requireConfirm: true,
      confirmConfig: {
        title: 'Create Supplier Advance',
        message: 'Create this supplier advance and save the draft?',
        confirmLabel: 'Create',
        severity: 'info',
      },
      successMessage: 'Supplier advance created.',
      errorMessage: 'Failed to create supplier advance.',
      action: ({ onSuccess, onError, onFinish }) => post(route('procurement.supplier-advances.store'), {
        onSuccess: () => {
          reset('purchase_order_id', 'payment_account_id', 'amount', 'reference', 'remarks');
          onSuccess();
        },
        onError,
        onFinish,
      }),
    });
  };

  const setApplyField = (advanceId, field, value) => {
    setApplyState((prev) => ({
      ...prev,
      [advanceId]: {
        ...(prev[advanceId] || {
          vendor_bill_id: '',
          amount: '',
          override_po_lock: false,
          override_reason: '',
        }),
        [field]: value,
      },
    }));
  };

  const applyAdvance = (row) => {
    const rowState = applyState[row.id] || {};
    mutation.runRouterAction({
      key: `sa-apply-${row.id}`,
      method: 'post',
      url: route('procurement.supplier-advances.apply', row.id),
      data: {
        vendor_bill_id: rowState.vendor_bill_id,
        amount: rowState.amount,
        override_po_lock: !!rowState.override_po_lock,
        override_reason: rowState.override_reason || '',
      },
      successMessage: 'Supplier advance applied to bill.',
      errorMessage: 'Failed to apply supplier advance.',
      confirmConfig: {
        title: 'Apply Supplier Advance',
        message: 'Apply this amount to the selected bill now?',
        confirmLabel: 'Apply',
        severity: 'warning',
      },
    });
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 2 }}>Supplier Advances</Typography>
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <form onSubmit={submit}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField select label="Vendor" value={data.vendor_id} onChange={(e) => setData('vendor_id', e.target.value)} error={!!errors.vendor_id} helperText={errors.vendor_id} fullWidth>
                  {vendors.map((vendor) => <MenuItem key={vendor.id} value={vendor.id}>{vendor.name}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField label="Payment Account ID" value={data.payment_account_id} onChange={(e) => setData('payment_account_id', e.target.value)} error={!!errors.payment_account_id} helperText={errors.payment_account_id} fullWidth />
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField label="Advance Date" type="date" value={data.advance_date} onChange={(e) => setData('advance_date', e.target.value)} InputLabelProps={{ shrink: true }} fullWidth />
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField label="Amount" type="number" value={data.amount} onChange={(e) => setData('amount', e.target.value)} error={!!errors.amount} helperText={errors.amount} fullWidth />
              </Grid>
              <Grid item xs={12}>
                <TextField label="Reference" value={data.reference} onChange={(e) => setData('reference', e.target.value)} fullWidth />
              </Grid>
              <Grid item xs={12}>
                <TextField label="Remarks" value={data.remarks} onChange={(e) => setData('remarks', e.target.value)} fullWidth />
              </Grid>
            </Grid>
            <AppLoadingButton type="submit" variant="contained" loading={processing || mutation.isPending('sa-create')} loadingLabel="Saving..." sx={{ mt: 2 }}>
              Create Advance
            </AppLoadingButton>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 1 }}>Advance Register</Typography>
          {(advances?.data || []).map((row) => (
            <Box key={row.id} sx={{ py: 1.5, borderBottom: '1px solid #eee', display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {row.advance_no} · {row.vendor?.name} · {row.status}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip size="small" label={`Total: ${formatAmount(row.amount)}`} />
                  <Chip size="small" label={`Applied: ${formatAmount(row.applied_amount)}`} />
                  <Chip size="small" color="primary" variant="outlined" label={`Remaining: ${formatAmount(row.remaining_amount)}`} />
                  <Chip size="small" variant="outlined" label={`PO: ${row.linked_po_no || 'Unlinked'}`} />
                </Box>
              </Box>

              {Array.isArray(row.applied_to_bills) && row.applied_to_bills.length > 0 ? (
                <Alert severity="info" sx={{ py: 0.25 }}>
                  Applied to: {row.applied_to_bills.map((entry) => `${entry.bill_no || `Bill#${entry.vendor_bill_id}`} (${formatAmount(entry.amount)})`).join(', ')}
                </Alert>
              ) : null}

              <Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: { xs: '1fr', md: '2fr 1fr auto auto' }, alignItems: 'center' }}>
                <TextField
                  select
                  size="small"
                  label="Apply To Bill"
                  value={applyState[row.id]?.vendor_bill_id || ''}
                  onChange={(e) => setApplyField(row.id, 'vendor_bill_id', e.target.value)}
                >
                  {openBills
                    .filter((bill) => String(bill.vendor_id) === String(row.vendor_id))
                    .map((bill) => (
                      <MenuItem key={bill.id} value={bill.id}>
                        {bill.bill_no} · Outstanding {formatAmount(bill.outstanding)}
                      </MenuItem>
                    ))}
                </TextField>
                <TextField
                  size="small"
                  label="Apply Amount"
                  type="number"
                  value={applyState[row.id]?.amount || ''}
                  onChange={(e) => setApplyField(row.id, 'amount', e.target.value)}
                  inputProps={{ min: 0, step: '0.01' }}
                />
                {poLockOverrideAllowed ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <FormControlLabel
                      sx={{ m: 0 }}
                      control={(
                        <Checkbox
                          size="small"
                          checked={!!applyState[row.id]?.override_po_lock}
                          onChange={(e) => setApplyField(row.id, 'override_po_lock', e.target.checked)}
                        />
                      )}
                      label="Admin PO override"
                    />
                    <TextField
                      size="small"
                      label="Override Reason"
                      value={applyState[row.id]?.override_reason || ''}
                      onChange={(e) => setApplyField(row.id, 'override_reason', e.target.value)}
                      disabled={!applyState[row.id]?.override_po_lock}
                    />
                  </Box>
                ) : <Box />}
                <AppLoadingButton
                  size="small"
                  variant="contained"
                  loading={mutation.isPending(`sa-apply-${row.id}`)}
                  loadingLabel="Applying..."
                  onClick={() => applyAdvance(row)}
                  disabled={Number(row.remaining_amount || 0) <= 0}
                >
                  Apply
                </AppLoadingButton>
              </Box>

              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <AppLoadingButton
                  size="small"
                  loading={mutation.isPending(`sa-submit-${row.id}`)}
                  loadingLabel="Submitting..."
                  onClick={() => mutation.runRouterAction({
                    key: `sa-submit-${row.id}`,
                    method: 'post',
                    url: route('procurement.supplier-advances.submit', row.id),
                    successMessage: 'Supplier advance submitted.',
                    errorMessage: 'Failed to submit supplier advance.',
                    confirmConfig: {
                      title: 'Submit Supplier Advance',
                      message: 'Submit this supplier advance for approval?',
                      confirmLabel: 'Submit',
                      severity: 'warning',
                    },
                  })}
                >
                  Submit
                </AppLoadingButton>
                <AppLoadingButton
                  size="small"
                  color="success"
                  loading={mutation.isPending(`sa-approve-${row.id}`)}
                  loadingLabel="Approving..."
                  onClick={() => mutation.runRouterAction({
                    key: `sa-approve-${row.id}`,
                    method: 'post',
                    url: route('procurement.supplier-advances.approve', row.id),
                    successMessage: 'Supplier advance approved.',
                    errorMessage: 'Failed to approve supplier advance.',
                    confirmConfig: {
                      title: 'Approve Supplier Advance',
                      message: 'Approve and post this supplier advance?',
                      confirmLabel: 'Approve',
                      severity: 'critical',
                    },
                  })}
                >
                  Approve
                </AppLoadingButton>
                <AppLoadingButton
                  size="small"
                  color="error"
                  loading={mutation.isPending(`sa-reject-${row.id}`)}
                  loadingLabel="Rejecting..."
                  onClick={() => mutation.runRouterAction({
                    key: `sa-reject-${row.id}`,
                    method: 'post',
                    url: route('procurement.supplier-advances.reject', row.id),
                    successMessage: 'Supplier advance rejected.',
                    errorMessage: 'Failed to reject supplier advance.',
                    confirmConfig: {
                      title: 'Reject Supplier Advance',
                      message: 'Reject this supplier advance?',
                      confirmLabel: 'Reject',
                      severity: 'danger',
                    },
                  })}
                >
                  Reject
                </AppLoadingButton>
              </Box>
            </Box>
          ))}
        </CardContent>
      </Card>
      <ConfirmActionDialog {...mutation.confirmDialogProps} />
    </Box>
  );
}
