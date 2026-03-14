import React from 'react';
import { router } from '@inertiajs/react';
import { Box, Button, Card, CardContent, Grid, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';

const StatCard = ({ label, value }) => (
  <Card sx={{ border: '1px solid', borderColor: 'divider' }}>
    <CardContent>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="h5" sx={{ color: 'primary.main', fontWeight: 700 }}>{value}</Typography>
    </CardContent>
  </Card>
);

export default function ManagementPack({ filters, cashFlow, workingCapital, arBySource = [], budgetSummary = {}, inventoryValuation = [], bankPositions = [] }) {
  const submit = (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    router.get(route('accounting.reports.management-pack'), {
      from: form.get('from'),
      to: form.get('to'),
    });
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ color: 'primary.main', fontWeight: 700, mb: 1 }}>Management Pack</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Cash flow, working capital, budget variance and inventory valuation in one view.</Typography>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <form onSubmit={submit}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <TextField name="from" label="From" type="date" defaultValue={filters?.from || ''} InputLabelProps={{ shrink: true }} fullWidth />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField name="to" label="To" type="date" defaultValue={filters?.to || ''} InputLabelProps={{ shrink: true }} fullWidth />
              </Grid>
              <Grid item xs={12} md={2}>
                <Button type="submit" variant="contained" fullWidth>Apply</Button>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={3}><StatCard label="Cash Inflows" value={Number(cashFlow?.inflows || 0).toFixed(2)} /></Grid>
        <Grid item xs={12} md={3}><StatCard label="Cash Outflows" value={Number(cashFlow?.outflows || 0).toFixed(2)} /></Grid>
        <Grid item xs={12} md={3}><StatCard label="Net Cash Flow" value={Number(cashFlow?.net || 0).toFixed(2)} /></Grid>
        <Grid item xs={12} md={3}><StatCard label="Net Working Capital" value={Number(workingCapital?.net_position || 0).toFixed(2)} /></Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={4}><StatCard label="Budgeted" value={Number(budgetSummary?.budgeted || 0).toFixed(2)} /></Grid>
        <Grid item xs={12} md={4}><StatCard label="Actual" value={Number(budgetSummary?.actual || 0).toFixed(2)} /></Grid>
        <Grid item xs={12} md={4}><StatCard label="Variance" value={Number(budgetSummary?.variance || 0).toFixed(2)} /></Grid>
      </Grid>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" sx={{ color: 'primary.main', mb: 1.5 }}>AR by Source</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Source</TableCell>
                <TableCell align="right">Invoices</TableCell>
                <TableCell align="right">Outstanding</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {arBySource.length === 0 && (
                <TableRow><TableCell colSpan={3} align="center">No source-wise receivable data.</TableCell></TableRow>
              )}
              {arBySource.map((row) => (
                <TableRow key={row.source}>
                  <TableCell>{row.source}</TableCell>
                  <TableCell align="right">{row.total_invoices}</TableCell>
                  <TableCell align="right">{Number(row.outstanding || 0).toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" sx={{ color: 'primary.main', mb: 1.5 }}>Inventory Valuation by Warehouse</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Warehouse ID</TableCell>
                <TableCell align="right">Net Qty</TableCell>
                <TableCell align="right">Valuation</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {inventoryValuation.length === 0 && (
                <TableRow><TableCell colSpan={3} align="center">No inventory valuation data.</TableCell></TableRow>
              )}
              {inventoryValuation.map((row, idx) => (
                <TableRow key={`${row.warehouse_id}-${idx}`}>
                  <TableCell>{row.warehouse_id}</TableCell>
                  <TableCell align="right">{Number(row.net_qty || 0).toFixed(3)}</TableCell>
                  <TableCell align="right">{Number(row.valuation || 0).toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ color: 'primary.main', mb: 1.5 }}>Bank Positions</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Account</TableCell>
                <TableCell align="right">Opening</TableCell>
                <TableCell align="right">Inflows</TableCell>
                <TableCell align="right">Outflows</TableCell>
                <TableCell align="right">Closing</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {bankPositions.length === 0 && (
                <TableRow><TableCell colSpan={5} align="center">No bank account data.</TableCell></TableRow>
              )}
              {bankPositions.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.name}</TableCell>
                  <TableCell align="right">{Number(row.opening || 0).toFixed(2)}</TableCell>
                  <TableCell align="right">{Number(row.inflows || 0).toFixed(2)}</TableCell>
                  <TableCell align="right">{Number(row.outflows || 0).toFixed(2)}</TableCell>
                  <TableCell align="right">{Number(row.closing || 0).toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Box>
  );
}
