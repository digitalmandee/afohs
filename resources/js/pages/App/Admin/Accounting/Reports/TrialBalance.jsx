import React from 'react';
import { router } from '@inertiajs/react';
import { Box, Button, Card, CardContent, Chip, Grid, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';

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

export default function TrialBalance({ rows, summary, filters }) {
  const printView = () => {
    window.print();
  };

  const downloadCsv = () => {
    window.location.href = route('accounting.reports.trial-balance', {
      from: filters?.from || '',
      to: filters?.to || '',
      export: 'csv',
    });
  };

  const applyFilters = (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    router.get(route('accounting.reports.trial-balance'), {
      from: form.get('from'),
      to: form.get('to'),
    });
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 2, color: 'primary.main', fontWeight: 700, '@media print': { display: 'none' } }}>Trial Balance</Typography>

      <Box sx={{ display: 'none', '@media print': { display: 'block', mb: 2 } }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>Trial Balance</Typography>
        <Typography variant="body2" color="text.secondary">
          Period: {filters?.from || 'Start'} to {filters?.to || 'End'}
        </Typography>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <StatCard label="Total Debit" value={Number(summary?.total_debit || 0).toFixed(2)} tone="muted" />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard label="Total Credit" value={Number(summary?.total_credit || 0).toFixed(2)} />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard label="Difference" value={Number(summary?.difference || 0).toFixed(2)} />
        </Grid>
      </Grid>

      <Card sx={{ mb: 3, '@media print': { display: 'none' } }}>
        <CardContent>
          <form onSubmit={applyFilters}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <TextField
                  name="from"
                  label="From"
                  type="date"
                  defaultValue={filters?.from || ''}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  name="to"
                  label="To"
                  type="date"
                  defaultValue={filters?.to || ''}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <Button type="submit" variant="contained" sx={{ mt: { md: 1 } }}>
                  Apply
                </Button>
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
                <Button type="button" variant="outlined" sx={{ mt: { md: 1 } }} onClick={() => router.get(route('accounting.reports.trial-balance'))}>
                  Reset
                </Button>
              </Grid>
            </Grid>
          </form>
          <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {Object.entries(summary?.type_totals || {}).map(([type, data]) => (
              <Chip
                key={type}
                size="small"
                variant="outlined"
                label={`${type}: D ${Number(data?.debit || 0).toFixed(2)} | C ${Number(data?.credit || 0).toFixed(2)}`}
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
                <TableCell>Code</TableCell>
                <TableCell>Name</TableCell>
                <TableCell align="right">Debit</TableCell>
                <TableCell align="right">Credit</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center">No data.</TableCell>
                </TableRow>
              )}
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.code}</TableCell>
                  <TableCell sx={{ pl: 1 + (Number(row.level || 1) - 1) * 2 }}>
                    {row.name}
                    <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                      L{row.level}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">{Number(row.debit).toFixed(2)}</TableCell>
                  <TableCell align="right">{Number(row.credit).toFixed(2)}</TableCell>
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

      <Box sx={{ display: 'none', '@media print': { display: 'block', mt: 1 } }}>
        <Typography variant="caption" color="text.secondary">
          Totals: Debit {Number(summary?.total_debit || 0).toFixed(2)} | Credit {Number(summary?.total_credit || 0).toFixed(2)} | Gap {Number(summary?.difference || 0).toFixed(2)}
        </Typography>
      </Box>
    </Box>
  );
}
