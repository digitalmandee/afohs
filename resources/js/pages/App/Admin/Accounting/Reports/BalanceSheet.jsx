import React from 'react';
import { router } from '@inertiajs/react';
import { Box, Button, Card, CardContent, Grid, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';

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

const Section = ({ title, rows }) => (
  <Card sx={{ mb: 3 }}>
    <CardContent>
      <Typography variant="h6" sx={{ mb: 1 }}>{title}</Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Code</TableCell>
            <TableCell>Name</TableCell>
            <TableCell align="right">Balance</TableCell>
            <TableCell align="right">Action</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} align="center">No data.</TableCell>
            </TableRow>
          )}
          {rows.map((row, idx) => (
            <TableRow key={`${row.code}-${idx}`}>
              <TableCell>{row.code}</TableCell>
              <TableCell>{row.name}</TableCell>
              <TableCell align="right">{Number(row.balance).toFixed(2)}</TableCell>
              <TableCell align="right">
                <Button size="small" variant="outlined" onClick={() => router.get(row.ledger_url)}>
                  Ledger
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </CardContent>
  </Card>
);

export default function BalanceSheet({ assets, liabilities, equity, summary, filters }) {
  const printView = () => {
    window.print();
  };

  const downloadCsv = () => {
    window.location.href = route('accounting.reports.balance-sheet', {
      from: filters?.from || '',
      to: filters?.to || '',
      export: 'csv',
    });
  };

  const applyFilters = (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    router.get(route('accounting.reports.balance-sheet'), {
      from: form.get('from'),
      to: form.get('to'),
    });
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 2, color: 'primary.main', fontWeight: 700, '@media print': { display: 'none' } }}>Balance Sheet</Typography>

      <Box sx={{ display: 'none', '@media print': { display: 'block', mb: 2 } }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>Balance Sheet</Typography>
        <Typography variant="body2" color="text.secondary">
          Period: {filters?.from || 'Start'} to {filters?.to || 'End'}
        </Typography>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}><StatCard label="Assets" value={Number(summary?.assets_total || 0).toFixed(2)} tone="muted" /></Grid>
        <Grid item xs={12} md={3}><StatCard label="Liabilities" value={Number(summary?.liabilities_total || 0).toFixed(2)} /></Grid>
        <Grid item xs={12} md={3}><StatCard label="Equity" value={Number(summary?.equity_total || 0).toFixed(2)} /></Grid>
        <Grid item xs={12} md={3}><StatCard label="Balance Gap" value={Number(summary?.difference || 0).toFixed(2)} /></Grid>
      </Grid>

      <Card sx={{ mb: 3, '@media print': { display: 'none' } }}>
        <CardContent>
          <form onSubmit={applyFilters}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <TextField name="from" label="From" type="date" defaultValue={filters?.from || ''} InputLabelProps={{ shrink: true }} fullWidth />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField name="to" label="To" type="date" defaultValue={filters?.to || ''} InputLabelProps={{ shrink: true }} fullWidth />
              </Grid>
              <Grid item xs={12} md={3}>
                <Button type="submit" variant="contained" sx={{ mt: { md: 1 } }}>Apply</Button>
              </Grid>
              <Grid item xs={12} md={2}>
                <Button type="button" variant="outlined" sx={{ mt: { md: 1 } }} onClick={downloadCsv}>
                  Export CSV
                </Button>
              </Grid>
              <Grid item xs={12} md={2}>
                <Button type="button" variant="outlined" sx={{ mt: { md: 1 } }} onClick={printView}>
                  Print
                </Button>
              </Grid>
              <Grid item xs={12} md={1}>
                <Button type="button" variant="outlined" sx={{ mt: { md: 1 } }} onClick={() => router.get(route('accounting.reports.balance-sheet'))}>
                  Reset
                </Button>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>

      <Section title="Assets" rows={assets} />
      <Section title="Liabilities" rows={liabilities} />
      <Section title="Equity" rows={equity} />

      <Box sx={{ display: 'none', '@media print': { display: 'block', mt: 1 } }}>
        <Typography variant="caption" color="text.secondary">
          Totals: Assets {Number(summary?.assets_total || 0).toFixed(2)} | Liabilities+Equity {Number(summary?.liabilities_equity_total || 0).toFixed(2)} | Gap {Number(summary?.difference || 0).toFixed(2)}
        </Typography>
      </Box>
    </Box>
  );
}
