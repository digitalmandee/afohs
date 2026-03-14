import React from 'react';
import { router } from '@inertiajs/react';
import { Alert, Box, Button, Card, CardContent, Chip, Grid, MenuItem, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';
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

export default function Outstanding({ rows, summary, filters, error }) {
  const data = rows?.data || [];

  const submit = (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    router.get(route('accounting.outstanding'), {
      search: form.get('search'),
      bucket: form.get('bucket'),
    });
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 2, color: 'primary.main', fontWeight: 700 }}>Outstanding</Typography>
      {error && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}><StatCard label="Filtered Invoices" value={summary?.records || 0} tone="muted" /></Grid>
        <Grid item xs={12} md={3}><StatCard label="Total Balance" value={Number(summary?.total_balance || 0).toFixed(2)} /></Grid>
        <Grid item xs={12} md={3}><StatCard label="Average Age (Days)" value={summary?.average_age || 0} /></Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary">Aging Buckets</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                {['0-30', '31-60', '61-90', '90+'].map((bucket) => (
                  <Chip
                    key={bucket}
                    size="small"
                    variant="outlined"
                    label={`${bucket}: ${summary?.bucket_count?.[bucket] || 0}`}
                    sx={{ borderColor: 'primary.main', color: 'primary.main' }}
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <form onSubmit={submit}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={7}>
                <TextField name="search" label="Search invoice/member" defaultValue={filters?.search || ''} fullWidth />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField select name="bucket" label="Aging Bucket" defaultValue={filters?.bucket || ''} fullWidth>
                  <MenuItem value="">All Buckets</MenuItem>
                  <MenuItem value="0-30">0-30</MenuItem>
                  <MenuItem value="31-60">31-60</MenuItem>
                  <MenuItem value="61-90">61-90</MenuItem>
                  <MenuItem value="90+">90+</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={2}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button type="submit" variant="contained" fullWidth>Apply</Button>
                  <Button
                    type="button"
                    variant="outlined"
                    fullWidth
                    onClick={() => router.get(route('accounting.outstanding'))}
                  >
                    Reset
                  </Button>
                </Box>
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
                <TableCell>Invoice</TableCell>
                <TableCell>Payer</TableCell>
                <TableCell>Due Date</TableCell>
                <TableCell>Age (days)</TableCell>
                <TableCell>Bucket</TableCell>
                <TableCell align="right">Balance</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">No outstanding invoices.</TableCell>
                </TableRow>
              )}
              {data.map((row, idx) => (
                <TableRow key={`${row.invoice_no}-${idx}`}>
                  <TableCell>{row.invoice_no}</TableCell>
                  <TableCell>{row.payer}</TableCell>
                  <TableCell>{row.due_date || '-'}</TableCell>
                  <TableCell>{row.age}</TableCell>
                  <TableCell>
                    <Chip label={row.bucket} size="small" variant="outlined" color={row.bucket === '90+' ? 'error' : row.bucket === '61-90' ? 'warning' : 'default'} />
                  </TableCell>
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
