import React from 'react';
import { useForm } from '@inertiajs/react';
import { Box, Button, Card, CardContent, Grid, MenuItem, TextField, Typography } from '@mui/material';

const accountMethodByPaymentMethod = {
  cash: ['cash'],
  bank: ['bank', 'bank_transfer'],
  cheque: ['cheque', 'bank'],
  online: ['online', 'bank', 'bank_transfer'],
};

export default function Edit({ payment, vendors, paymentAccounts, openVendorBills = [] }) {
  const { data, setData, put, processing, errors } = useForm({
    vendor_id: payment?.vendor_id || '',
    payment_date: payment?.payment_date || new Date().toISOString().slice(0, 10),
    method: payment?.method || 'cash',
    payment_intent: payment?.payment_intent || 'ledger_wise',
    vendor_bill_id: payment?.source_document_type ? payment?.source_document_id || '' : '',
    payment_account_id: payment?.payment_account_id || '',
    amount: payment?.amount || 0,
    reference: payment?.reference || '',
    remarks: payment?.remarks || '',
  });

  const filteredAccounts = React.useMemo(() => {
    const allowedMethods = accountMethodByPaymentMethod[data.method] || [];
    return (paymentAccounts || []).filter((account) =>
      allowedMethods.includes(String(account.payment_method || '').toLowerCase())
    );
  }, [paymentAccounts, data.method]);
  const billOptions = React.useMemo(
    () => (openVendorBills || []).filter((bill) => String(bill.vendor_id) === String(data.vendor_id)),
    [openVendorBills, data.vendor_id]
  );

  const submit = (e) => {
    e.preventDefault();
    put(route('procurement.vendor-payments.update', payment.id));
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 2 }}>Edit Vendor Payment</Typography>
      <Card>
        <CardContent>
          <form onSubmit={submit}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField select label="Vendor" value={data.vendor_id} onChange={(e) => setData('vendor_id', e.target.value)} error={!!errors.vendor_id} helperText={errors.vendor_id} fullWidth>
                  {vendors.map((vendor) => <MenuItem key={vendor.id} value={vendor.id}>{vendor.name}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField label="Payment Date" type="date" value={data.payment_date} onChange={(e) => setData('payment_date', e.target.value)} error={!!errors.payment_date} helperText={errors.payment_date} InputLabelProps={{ shrink: true }} fullWidth />
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
                      const current = (paymentAccounts || []).find((a) => String(a.id) === String(data.payment_account_id));
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
              <Grid item xs={12} md={3}>
                <TextField select label="Payment Intent" value={data.payment_intent} onChange={(e) => setData('payment_intent', e.target.value)} fullWidth>
                  <MenuItem value="ledger_wise">Ledger-wise</MenuItem>
                  <MenuItem value="invoice_wise">Invoice-wise</MenuItem>
                </TextField>
              </Grid>
              {data.payment_intent === 'invoice_wise' ? (
                <Grid item xs={12} md={6}>
                  <TextField select label="Vendor Bill" value={data.vendor_bill_id} onChange={(e) => setData('vendor_bill_id', e.target.value)} error={!!errors.vendor_bill_id} helperText={errors.vendor_bill_id} fullWidth>
                    <MenuItem value="">Select Bill</MenuItem>
                    {billOptions.map((bill) => {
                      const outstanding = Number(bill.grand_total || 0) - Number(bill.paid_amount || 0) - Number(bill.advance_applied_amount || 0);
                      return <MenuItem key={bill.id} value={bill.id}>{bill.bill_no} (Outstanding: {outstanding.toFixed(2)})</MenuItem>;
                    })}
                  </TextField>
                </Grid>
              ) : null}
              <Grid item xs={12} md={4}>
                <TextField
                  select
                  label="Payment Account"
                  value={data.payment_account_id}
                  onChange={(e) => setData('payment_account_id', e.target.value)}
                  error={!!errors.payment_account_id}
                  helperText={errors.payment_account_id || (data.method !== 'cash' ? 'Required for non-cash methods' : 'Optional for cash')}
                  fullWidth
                >
                  <MenuItem value="">None</MenuItem>
                  {filteredAccounts.map((acc) => <MenuItem key={acc.id} value={acc.id}>{acc.name}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField label="Amount" type="number" value={data.amount} onChange={(e) => setData('amount', e.target.value)} error={!!errors.amount} helperText={errors.amount} fullWidth />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField label="Reference" value={data.reference} onChange={(e) => setData('reference', e.target.value)} error={!!errors.reference} helperText={errors.reference} fullWidth />
              </Grid>
              <Grid item xs={12}>
                <TextField label="Remarks" value={data.remarks} onChange={(e) => setData('remarks', e.target.value)} error={!!errors.remarks} helperText={errors.remarks} fullWidth />
              </Grid>
            </Grid>

            <Box sx={{ mt: 3 }}>
              <Button type="submit" variant="contained" disabled={processing}>Update Payment</Button>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
