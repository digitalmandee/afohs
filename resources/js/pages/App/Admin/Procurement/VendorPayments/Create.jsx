import React from 'react';
import { useForm } from '@inertiajs/react';
import { Box, Button, Card, CardContent, Grid, MenuItem, TextField, Typography } from '@mui/material';

const accountMethodByPaymentMethod = {
  cash: ['cash'],
  bank: ['bank', 'bank_transfer'],
  cheque: ['cheque', 'bank'],
  online: ['online', 'bank', 'bank_transfer'],
};

export default function Create({ vendors, paymentAccounts }) {
  const { data, setData, post, processing, errors } = useForm({
    vendor_id: '',
    payment_date: new Date().toISOString().slice(0, 10),
    method: 'cash',
    payment_account_id: '',
    amount: 0,
    reference: '',
    remarks: '',
  });

  const filteredAccounts = React.useMemo(() => {
    const allowedMethods = accountMethodByPaymentMethod[data.method] || [];
    return (paymentAccounts || []).filter((account) =>
      allowedMethods.includes(String(account.payment_method || '').toLowerCase())
    );
  }, [paymentAccounts, data.method]);

  const selectedAccount = React.useMemo(
    () => (paymentAccounts || []).find((account) => String(account.id) === String(data.payment_account_id)),
    [paymentAccounts, data.payment_account_id]
  );

  const submit = (e) => {
    e.preventDefault();
    post(route('procurement.vendor-payments.store'));
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 2 }}>Create Vendor Payment</Typography>
      <Card>
        <CardContent>
          <form onSubmit={submit}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField
                  select
                  label="Vendor"
                  value={data.vendor_id}
                  onChange={(e) => setData('vendor_id', e.target.value)}
                  error={!!errors.vendor_id}
                  helperText={errors.vendor_id}
                  fullWidth
                >
                  {vendors.map((v) => (
                    <MenuItem key={v.id} value={v.id}>{v.name}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  label="Payment Date"
                  type="date"
                  value={data.payment_date}
                  onChange={(e) => setData('payment_date', e.target.value)}
                  error={!!errors.payment_date}
                  helperText={errors.payment_date}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  select
                  label="Method"
                  value={data.method}
                  onChange={(e) => {
                    const nextMethod = e.target.value;
                    setData('method', nextMethod);
                    const allowed = accountMethodByPaymentMethod[nextMethod] || [];
                    if (data.payment_account_id) {
                      const current = (paymentAccounts || []).find(
                        (account) => String(account.id) === String(data.payment_account_id)
                      );
                      if (!current || !allowed.includes(String(current.payment_method || '').toLowerCase())) {
                        setData('payment_account_id', '');
                      }
                    }
                  }}
                  fullWidth
                >
                  <MenuItem value="cash">Cash</MenuItem>
                  <MenuItem value="bank">Bank</MenuItem>
                  <MenuItem value="cheque">Cheque</MenuItem>
                  <MenuItem value="online">Online</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  select
                  label="Payment Account"
                  value={data.payment_account_id}
                  onChange={(e) => setData('payment_account_id', e.target.value)}
                  error={!!errors.payment_account_id}
                  helperText={
                    errors.payment_account_id
                    || (data.method !== 'cash' ? 'Required for non-cash methods' : 'Optional for cash')
                  }
                  fullWidth
                >
                  <MenuItem value="">None</MenuItem>
                  {filteredAccounts.map((acc) => (
                    <MenuItem key={acc.id} value={acc.id}>{acc.name}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField
                  label="Amount"
                  type="number"
                  value={data.amount}
                  onChange={(e) => setData('amount', e.target.value)}
                  error={!!errors.amount}
                  helperText={errors.amount}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Reference"
                  value={data.reference}
                  onChange={(e) => setData('reference', e.target.value)}
                  error={!!errors.reference}
                  helperText={errors.reference}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Remarks"
                  value={data.remarks}
                  onChange={(e) => setData('remarks', e.target.value)}
                  error={!!errors.remarks}
                  helperText={errors.remarks}
                  fullWidth
                />
              </Grid>
            </Grid>

            <Card sx={{ mt: 2, border: '1px solid', borderColor: 'divider' }}>
              <CardContent sx={{ py: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Selected Account: {selectedAccount?.name || 'None'}{selectedAccount ? ` (${selectedAccount.payment_method})` : ''}
                </Typography>
              </CardContent>
            </Card>

            <Box sx={{ mt: 3 }}>
              <Button type="submit" variant="contained" disabled={processing}>
                Save Payment
              </Button>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
