import React from 'react';
import { router, useForm } from '@inertiajs/react';
import { Box, Button, Card, CardContent, Grid, MenuItem, TextField, Typography } from '@mui/material';

export default function Index({ advances, vendors = [] }) {
  const { data, setData, post, processing, errors, reset } = useForm({
    vendor_id: '',
    purchase_order_id: '',
    payment_account_id: '',
    advance_date: new Date().toISOString().slice(0, 10),
    amount: '',
    reference: '',
    remarks: '',
  });

  const submit = (e) => {
    e.preventDefault();
    post(route('procurement.supplier-advances.store'), {
      onSuccess: () => reset('purchase_order_id', 'payment_account_id', 'amount', 'reference', 'remarks'),
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
            <Button type="submit" variant="contained" disabled={processing} sx={{ mt: 2 }}>Create Advance</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 1 }}>Advance Register</Typography>
          {(advances?.data || []).map((row) => (
            <Box key={row.id} sx={{ py: 1, borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
              <Typography variant="body2">{row.advance_no} · {row.vendor?.name} · {row.status}</Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button size="small" onClick={() => router.post(route('procurement.supplier-advances.submit', row.id))}>Submit</Button>
                <Button size="small" color="success" onClick={() => router.post(route('procurement.supplier-advances.approve', row.id))}>Approve</Button>
                <Button size="small" color="error" onClick={() => router.post(route('procurement.supplier-advances.reject', row.id))}>Reject</Button>
              </Box>
            </Box>
          ))}
        </CardContent>
      </Card>
    </Box>
  );
}
