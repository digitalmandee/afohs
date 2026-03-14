import React from 'react';
import { router } from '@inertiajs/react';
import { Box, Button, Card, CardContent, Chip, Grid, MenuItem, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';
import Pagination from '@/components/Pagination';

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
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="h5" sx={{ mt: 1, fontWeight: 700, color: 'primary.main' }}>{value}</Typography>
    </CardContent>
  </Card>
);

export default function Payables({ bills, total, summary, filters }) {
  const data = bills?.data || [];

  const submit = (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    router.get(route('accounting.payables'), {
      search: form.get('search'),
      status: form.get('status'),
      from: form.get('from'),
      to: form.get('to'),
    });
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 1, color: 'primary.main', fontWeight: 700 }}>Payables</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Total Outstanding: {Number(total || 0).toFixed(2)}
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}><StatCard label="Filtered Records" value={summary?.records || 0} tone="muted" /></Grid>
        <Grid item xs={12} md={3}><StatCard label="Filtered Outstanding" value={Number(summary?.filtered_outstanding || 0).toFixed(2)} /></Grid>
        <Grid item xs={12} md={2}><StatCard label="Draft" value={summary?.draft_count || 0} /></Grid>
        <Grid item xs={12} md={2}><StatCard label="Posted" value={summary?.posted_count || 0} /></Grid>
        <Grid item xs={12} md={2}><StatCard label="Partial Paid" value={summary?.partial_count || 0} /></Grid>
      </Grid>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <form onSubmit={submit}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={3}>
                <TextField name="search" label="Search bill/vendor" defaultValue={filters?.search || ''} fullWidth />
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField select name="status" label="Status" defaultValue={filters?.status || ''} fullWidth>
                  <MenuItem value="">All Open</MenuItem>
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="posted">Posted</MenuItem>
                  <MenuItem value="partially_paid">Partially Paid</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField
                  name="from"
                  label="From"
                  type="date"
                  defaultValue={filters?.from || ''}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField
                  name="to"
                  label="To"
                  type="date"
                  defaultValue={filters?.to || ''}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <Button type="submit" variant="contained" fullWidth>Apply</Button>
              </Grid>
              <Grid item xs={12} md={1}>
                <Button
                  type="button"
                  variant="outlined"
                  fullWidth
                  onClick={() => router.get(route('accounting.payables'))}
                >
                  Reset
                </Button>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Bill No</TableCell>
                <TableCell>Vendor</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell align="right">Paid</TableCell>
                <TableCell align="right">Balance</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center">No payables.</TableCell>
                </TableRow>
              )}
              {data.map((bill) => {
                const balance = Number(bill.grand_total || 0) - Number(bill.paid_amount || 0);
                return (
                  <TableRow key={bill.id}>
                    <TableCell>{bill.bill_no}</TableCell>
                    <TableCell>{bill.vendor?.name}</TableCell>
                    <TableCell>{bill.bill_date}</TableCell>
                    <TableCell>
                      <Chip
                        label={bill.status}
                        size="small"
                        color={bill.status === 'draft' ? 'default' : bill.status === 'partially_paid' ? 'warning' : 'success'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">{Number(bill.grand_total || 0).toFixed(2)}</TableCell>
                    <TableCell align="right">{Number(bill.paid_amount || 0).toFixed(2)}</TableCell>
                    <TableCell align="right">{balance.toFixed(2)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <Pagination data={bills} />
        </CardContent>
      </Card>
    </Box>
  );
}
