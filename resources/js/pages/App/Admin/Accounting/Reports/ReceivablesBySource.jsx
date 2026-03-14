import React from 'react';
import { router } from '@inertiajs/react';
import { Box, Button, Card, CardContent, Chip, Grid, MenuItem, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';
import Pagination from '@/components/Pagination';

const StatCard = ({ label, value }) => (
  <Card sx={{ border: '1px solid', borderColor: 'divider' }}>
    <CardContent>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 700 }}>{value}</Typography>
    </CardContent>
  </Card>
);

export default function ReceivablesBySource({ rows, summary = {}, sourceOptions = [], filters = {} }) {
  const list = rows?.data || [];
  const sourceTotals = summary?.source_totals || {};

  const apply = (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    router.get(route('accounting.reports.receivables-by-source'), {
      search: form.get('search'),
      source: form.get('source'),
      bucket: form.get('bucket'),
      from: form.get('from'),
      to: form.get('to'),
    });
  };

  const reset = () => {
    router.get(route('accounting.reports.receivables-by-source'));
  };

  const printView = () => window.print();

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 1, color: 'primary.main', fontWeight: 700, '@media print': { display: 'none' } }}>
        Receivables by Source
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, '@media print': { display: 'none' } }}>
        Unified receivables aging across membership, subscription, POS, room and events.
      </Typography>

      <Grid container spacing={2} sx={{ mb: 2, '@media print': { display: 'none' } }}>
        <Grid item xs={12} md={3}><StatCard label="Open Receivables" value={summary.records || 0} /></Grid>
        <Grid item xs={12} md={3}><StatCard label="Outstanding" value={Number(summary.total_balance || 0).toFixed(2)} /></Grid>
        <Grid item xs={12} md={3}><StatCard label="Average Age" value={`${Number(summary.average_age || 0).toFixed(1)} days`} /></Grid>
        <Grid item xs={12} md={3}><StatCard label="90+ Bucket" value={Number(summary?.bucket_balance?.['90+'] || 0).toFixed(2)} /></Grid>
      </Grid>

      <Card sx={{ mb: 2, '@media print': { display: 'none' } }}>
        <CardContent>
          <form onSubmit={apply}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <TextField name="search" label="Search invoice/member" defaultValue={filters?.search || ''} fullWidth />
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField select name="source" label="Source" defaultValue={filters?.source || ''} fullWidth>
                  <MenuItem value="">All Sources</MenuItem>
                  {sourceOptions.map((source) => (
                    <MenuItem key={source} value={source}>{source}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField select name="bucket" label="Bucket" defaultValue={filters?.bucket || ''} fullWidth>
                  <MenuItem value="">All Buckets</MenuItem>
                  <MenuItem value="current">Current</MenuItem>
                  <MenuItem value="1-30">1-30</MenuItem>
                  <MenuItem value="31-60">31-60</MenuItem>
                  <MenuItem value="61-90">61-90</MenuItem>
                  <MenuItem value="90+">90+</MenuItem>
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
            </Grid>
          </form>
          <Box sx={{ mt: 1.5, display: 'flex', gap: 1 }}>
            <Button size="small" variant="outlined" onClick={reset}>Reset</Button>
            <Button size="small" variant="outlined" onClick={printView}>Print</Button>
            <Button
              size="small"
              variant="outlined"
              onClick={() => {
                window.location.href = route('accounting.reports.receivables-by-source', { ...filters, export: 'csv' });
              }}
            >
              CSV
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Card sx={{ mb: 2, '@media print': { display: 'none' } }}>
        <CardContent>
          <Typography variant="subtitle2" sx={{ mb: 1, color: 'primary.main' }}>Source Exposure</Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {Object.keys(sourceTotals).length === 0 && (
              <Typography variant="body2" color="text.secondary">No source exposure data.</Typography>
            )}
            {Object.entries(sourceTotals).map(([source, stats]) => (
              <Chip
                key={source}
                label={`${source}: ${Number(stats.balance || 0).toFixed(2)} (${stats.count || 0})`}
                sx={{ bgcolor: 'rgba(6,52,85,0.08)', color: 'primary.main', border: '1px solid rgba(6,52,85,0.2)' }}
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
                <TableCell>Source</TableCell>
                <TableCell>Party</TableCell>
                <TableCell>Due Date</TableCell>
                <TableCell>Bucket</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell align="right">Paid</TableCell>
                <TableCell align="right">Balance</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {list.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center">No receivables found.</TableCell>
                </TableRow>
              )}
              {list.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.document_no}</TableCell>
                  <TableCell>{row.source}</TableCell>
                  <TableCell>{row.party}</TableCell>
                  <TableCell>{row.due_date || '-'}</TableCell>
                  <TableCell>{row.bucket}</TableCell>
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
    </Box>
  );
}
