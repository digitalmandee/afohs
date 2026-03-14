import React from 'react';
import { router, useForm, usePage } from '@inertiajs/react';
import { Alert, Box, Button, Card, CardContent, Grid, MenuItem, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';
import Pagination from '@/components/Pagination';

const StatCard = ({ label, value }) => (
  <Card sx={{ border: '1px solid', borderColor: 'divider' }}>
    <CardContent>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>{value}</Typography>
    </CardContent>
  </Card>
);

export default function PaymentRun({ bills, summary = {}, vendors = [], paymentAccounts = [], filters = {} }) {
  const { errors = {} } = usePage().props;
  const rows = bills?.data || [];
  const [selectedAllocations, setSelectedAllocations] = React.useState({});

  const { data, setData, post, processing, reset } = useForm({
    payment_date: new Date().toISOString().slice(0, 10),
    method: 'bank',
    payment_account_id: '',
    reference: '',
    remarks: 'Batch payment run',
  });

  const applyFilters = (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    router.get(route('procurement.payment-run.index'), {
      search: form.get('search'),
      vendor_id: form.get('vendor_id'),
      due_to: form.get('due_to'),
      min_age_days: form.get('min_age_days'),
      bucket: form.get('bucket'),
    });
  };

  const setAllocation = (billId, amount) => {
    setSelectedAllocations((prev) => ({
      ...prev,
      [billId]: amount,
    }));
  };

  const autoSelect = () => {
    const next = {};
    rows.forEach((row) => {
      next[row.id] = Number(row.outstanding || 0).toFixed(2);
    });
    setSelectedAllocations(next);
  };

  const clearSelect = () => setSelectedAllocations({});

  const selectedRows = rows
    .map((row) => ({
      bill_id: row.id,
      amount: Number(selectedAllocations[row.id] || 0),
      vendor_id: row.vendor_id,
    }))
    .filter((row) => row.amount > 0);

  const selectedTotal = selectedRows.reduce((sum, row) => sum + row.amount, 0);
  const selectedVendors = new Set(selectedRows.map((row) => row.vendor_id)).size;

  const runPayment = () => {
    post(route('procurement.payment-run.execute'), {
      data: {
        ...data,
        payment_account_id: data.payment_account_id || null,
        allocations: selectedRows,
      },
      preserveScroll: true,
      onSuccess: () => {
        setSelectedAllocations({});
        reset('reference', 'remarks');
      },
    });
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ color: 'primary.main', fontWeight: 700, mb: 0.5 }}>Payment Run</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Select open AP bills and post grouped vendor payments with allocation links.
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ pb: 0 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}><StatCard label="Open Bills" value={summary.count || 0} /></Grid>
            <Grid item xs={12} md={4}><StatCard label="Outstanding" value={Number(summary.outstanding || 0).toFixed(2)} /></Grid>
            <Grid item xs={12} md={4}><StatCard label="90+ Overdue" value={Number(summary.overdue_90_plus || 0).toFixed(2)} /></Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <form onSubmit={applyFilters}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <TextField name="search" label="Search bill/vendor" defaultValue={filters?.search || ''} fullWidth />
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField select name="vendor_id" label="Vendor" defaultValue={filters?.vendor_id || ''} fullWidth>
                  <MenuItem value="">All Vendors</MenuItem>
                  {vendors.map((vendor) => (
                    <MenuItem key={vendor.id} value={vendor.id}>{vendor.name}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField name="due_to" label="Due Before" type="date" defaultValue={filters?.due_to || ''} InputLabelProps={{ shrink: true }} fullWidth />
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField name="min_age_days" label="Min Age (Days)" type="number" defaultValue={filters?.min_age_days || ''} fullWidth />
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField select name="bucket" label="Bucket" defaultValue={filters?.bucket || ''} fullWidth>
                  <MenuItem value="">All Buckets</MenuItem>
                  <MenuItem value="0-30">0-30</MenuItem>
                  <MenuItem value="31-60">31-60</MenuItem>
                  <MenuItem value="61-90">61-90</MenuItem>
                  <MenuItem value="90+">90+</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={1}>
                <Button type="submit" variant="contained" fullWidth>Go</Button>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>Run Setup</Typography>
          {(errors?.allocations || errors?.payment_account_id) && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errors.allocations || errors.payment_account_id}
            </Alert>
          )}
          <Grid container spacing={2}>
            <Grid item xs={12} md={2}>
              <TextField label="Payment Date" type="date" value={data.payment_date} onChange={(e) => setData('payment_date', e.target.value)} InputLabelProps={{ shrink: true }} fullWidth />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField select label="Method" value={data.method} onChange={(e) => setData('method', e.target.value)} fullWidth>
                <MenuItem value="cash">Cash</MenuItem>
                <MenuItem value="bank">Bank</MenuItem>
                <MenuItem value="cheque">Cheque</MenuItem>
                <MenuItem value="online">Online</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                select
                label="Payment Account"
                value={data.payment_account_id}
                onChange={(e) => setData('payment_account_id', e.target.value)}
                fullWidth
              >
                <MenuItem value="">None</MenuItem>
                {paymentAccounts.map((acc) => (
                  <MenuItem key={acc.id} value={acc.id}>{acc.name} ({acc.payment_method})</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField label="Reference" value={data.reference} onChange={(e) => setData('reference', e.target.value)} fullWidth />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField label="Remarks" value={data.remarks} onChange={(e) => setData('remarks', e.target.value)} fullWidth />
            </Grid>
          </Grid>
          <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
            <Button variant="outlined" onClick={autoSelect}>Select All Outstanding</Button>
            <Button variant="outlined" onClick={clearSelect}>Clear</Button>
            <Button variant="contained" disabled={processing || selectedRows.length === 0} onClick={runPayment}>
              Post Payment Run
            </Button>
            <Typography variant="body2" color="text.secondary" sx={{ ml: 1, alignSelf: 'center' }}>
              Selected {selectedRows.length} bills across {selectedVendors} vendors · Total {selectedTotal.toFixed(2)}
            </Typography>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Bill No</TableCell>
                <TableCell>Vendor</TableCell>
                <TableCell>Due Date</TableCell>
                <TableCell>Bucket</TableCell>
                <TableCell align="right">Outstanding</TableCell>
                <TableCell align="right">Allocate</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">No payable bills match current filters.</TableCell>
                </TableRow>
              )}
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.bill_no}</TableCell>
                  <TableCell>{row.vendor?.name}</TableCell>
                  <TableCell>{row.due_date || row.bill_date}</TableCell>
                  <TableCell>{row.bucket}</TableCell>
                  <TableCell align="right">{Number(row.outstanding || 0).toFixed(2)}</TableCell>
                  <TableCell align="right" sx={{ width: 180 }}>
                    <TextField
                      size="small"
                      type="number"
                      inputProps={{ min: 0, step: '0.01', max: Number(row.outstanding || 0) }}
                      value={selectedAllocations[row.id] ?? ''}
                      onChange={(e) => setAllocation(row.id, e.target.value)}
                      fullWidth
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination data={bills} />
        </CardContent>
      </Card>
    </Box>
  );
}
