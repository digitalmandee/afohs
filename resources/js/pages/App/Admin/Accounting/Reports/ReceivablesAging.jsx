import React from 'react';
import { router } from '@inertiajs/react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
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
import Pagination from '@/components/Pagination';

const buckets = ['current', '1-30', '31-60', '61-90', '90+'];

const StatCard = ({ label, value }) => (
  <Card sx={{ border: '1px solid', borderColor: 'divider' }}>
    <CardContent>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="h5" sx={{ mt: 1, fontWeight: 700, color: 'primary.main' }}>{value}</Typography>
    </CardContent>
  </Card>
);

export default function ReceivablesAging({ rows, summary, filters }) {
  const data = rows?.data || [];
  const printView = () => {
    window.print();
  };

  const submit = (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    router.get(route('accounting.reports.receivables-aging'), {
      search: form.get('search'),
      from: form.get('from'),
      to: form.get('to'),
      bucket: form.get('bucket'),
    });
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 1, color: 'primary.main', fontWeight: 700, '@media print': { display: 'none' } }}>Receivables Aging</Typography>
      <Box sx={{ display: 'none', '@media print': { display: 'block', mb: 2 } }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>Receivables Aging</Typography>
        <Typography variant="body2" color="text.secondary">
          Period: {filters?.from || 'Start'} to {filters?.to || 'End'}
        </Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Open invoices aging analysis across customer/member balances.
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}><StatCard label="Open Documents" value={summary?.records || 0} /></Grid>
        <Grid item xs={12} md={3}><StatCard label="Total Outstanding" value={Number(summary?.total_balance || 0).toFixed(2)} /></Grid>
        <Grid item xs={12} md={3}><StatCard label="Average Age (Days)" value={summary?.average_age || 0} /></Grid>
        <Grid item xs={12} md={3}><StatCard label="90+ Exposure" value={Number(summary?.bucket_balance?.['90+'] || 0).toFixed(2)} /></Grid>
      </Grid>

      <Card sx={{ mb: 3, '@media print': { display: 'none' } }}>
        <CardContent>
          <form onSubmit={submit}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <TextField name="search" label="Search invoice/member" defaultValue={filters?.search || ''} fullWidth />
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField select name="bucket" label="Aging Bucket" defaultValue={filters?.bucket || ''} fullWidth>
                  <MenuItem value="">All Buckets</MenuItem>
                  {buckets.map((bucket) => <MenuItem key={bucket} value={bucket}>{bucket}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField name="from" label="From" type="date" defaultValue={filters?.from || ''} InputLabelProps={{ shrink: true }} fullWidth />
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField name="to" label="To" type="date" defaultValue={filters?.to || ''} InputLabelProps={{ shrink: true }} fullWidth />
              </Grid>
              <Grid item xs={12} md={1}>
                <Button type="submit" variant="contained" fullWidth>Apply</Button>
              </Grid>
              <Grid item xs={12} md={1}>
                <Button type="button" variant="outlined" fullWidth onClick={printView}>
                  Print
                </Button>
              </Grid>
              <Grid item xs={12} md={1}>
                <Button type="button" variant="outlined" fullWidth onClick={() => router.get(route('accounting.reports.receivables-aging'))}>
                  Reset
                </Button>
              </Grid>
            </Grid>
          </form>

          <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {buckets.map((bucket) => (
              <Chip
                key={bucket}
                size="small"
                variant="outlined"
                label={`${bucket}: ${summary?.bucket_count?.[bucket] || 0} | ${Number(summary?.bucket_balance?.[bucket] || 0).toFixed(2)}`}
                sx={{ borderColor: 'primary.main', color: 'primary.main' }}
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
                <TableCell>Invoice</TableCell>
                <TableCell>Party</TableCell>
                <TableCell>Due Date</TableCell>
                <TableCell align="right">Age</TableCell>
                <TableCell>Bucket</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell align="right">Paid</TableCell>
                <TableCell align="right">Balance</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center">No receivables aging records found.</TableCell>
                </TableRow>
              )}
              {data.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.document_no}</TableCell>
                  <TableCell>{row.party}</TableCell>
                  <TableCell>{row.due_date || '-'}</TableCell>
                  <TableCell align="right">{row.age_days}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={row.bucket}
                      color={row.bucket === '90+' ? 'error' : row.bucket === '61-90' ? 'warning' : 'default'}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="right">{Number(row.total || 0).toFixed(2)}</TableCell>
                  <TableCell align="right">{Number(row.paid || 0).toFixed(2)}</TableCell>
                  <TableCell align="right">{Number(row.balance || 0).toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination data={rows} />
        </CardContent>
      </Card>

      <Box sx={{ display: 'none', '@media print': { display: 'block', mt: 1 } }}>
        <Typography variant="caption" color="text.secondary">
          Totals: Outstanding {Number(summary?.total_balance || 0).toFixed(2)} | 90+ Exposure {Number(summary?.bucket_balance?.['90+'] || 0).toFixed(2)}
        </Typography>
      </Box>
    </Box>
  );
}
