import React from 'react';
import { Link, router } from '@inertiajs/react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';

const StatCard = ({ label, current, previous, delta }) => (
  <Card sx={{ border: '1px solid', borderColor: 'divider' }}>
    <CardContent>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="h5" sx={{ mt: 1, fontWeight: 700, color: 'primary.main' }}>
        {Number(current || 0).toFixed(2)}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Previous: {Number(previous || 0).toFixed(2)}
      </Typography>
      <Typography variant="body2" sx={{ color: Number(delta || 0) >= 0 ? 'success.main' : 'error.main', fontWeight: 600 }}>
        Delta: {Number(delta || 0) >= 0 ? '+' : ''}{Number(delta || 0).toFixed(2)}
      </Typography>
    </CardContent>
  </Card>
);

const HealthCard = ({ label, value, previous, unit = '', better = 'up' }) => {
  const delta = Number(value || 0) - Number(previous || 0);
  const positive = better === 'up' ? delta >= 0 : delta <= 0;

  return (
    <Card sx={{ border: '1px solid', borderColor: 'divider' }}>
      <CardContent>
        <Typography variant="body2" color="text.secondary">{label}</Typography>
        <Typography variant="h5" sx={{ mt: 1, fontWeight: 700, color: 'primary.main' }}>
          {Number(value || 0).toFixed(2)}{unit}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Previous: {Number(previous || 0).toFixed(2)}{unit}
        </Typography>
        <Typography variant="body2" sx={{ color: positive ? 'success.main' : 'error.main', fontWeight: 600 }}>
          Delta: {delta >= 0 ? '+' : ''}{delta.toFixed(2)}{unit}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default function FinancialStatements({ filters, comparison, current, previous, currentHealth, previousHealth, healthComparison }) {
  const submit = (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    router.get(route('accounting.reports.financial-statements'), {
      from: form.get('from'),
      to: form.get('to'),
      compare_from: form.get('compare_from'),
      compare_to: form.get('compare_to'),
    });
  };

  const exportCsv = () => {
    window.location.href = route('accounting.reports.financial-statements', {
      from: filters?.from || '',
      to: filters?.to || '',
      compare_from: filters?.compare_from || '',
      compare_to: filters?.compare_to || '',
      export: 'csv',
    });
  };

  const printView = () => {
    window.print();
  };

  const openPrintPack = () => {
    const currentQuery = { from: current?.from, to: current?.to };
    const targets = [
      route('accounting.reports.trial-balance', currentQuery),
      route('accounting.reports.balance-sheet', currentQuery),
      route('accounting.reports.profit-loss', currentQuery),
      route('accounting.reports.receivables-aging', currentQuery),
      route('accounting.reports.receivables-by-source', currentQuery),
      route('accounting.reports.payables-aging', currentQuery),
    ];

    targets.forEach((url, idx) => {
      setTimeout(() => window.open(url, '_blank', 'noopener,noreferrer'), idx * 120);
    });
  };

  const rows = [
    { key: 'trial_balance_gap', label: 'Trial Balance Gap' },
    { key: 'assets_total', label: 'Assets Total' },
    { key: 'liabilities_total', label: 'Liabilities Total' },
    { key: 'equity_total', label: 'Equity Total' },
    { key: 'income_total', label: 'Income Total' },
    { key: 'expense_total', label: 'Expense Total' },
    { key: 'net_profit', label: 'Net Profit' },
  ];

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 1, color: 'primary.main', fontWeight: 700 }}>
        Financial Statements Comparison
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Compare current period against previous period with one-click drill down.
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <form onSubmit={submit}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={2}>
                <TextField name="from" label="Current From" type="date" defaultValue={filters?.from || ''} InputLabelProps={{ shrink: true }} fullWidth />
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField name="to" label="Current To" type="date" defaultValue={filters?.to || ''} InputLabelProps={{ shrink: true }} fullWidth />
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField name="compare_from" label="Previous From" type="date" defaultValue={filters?.compare_from || ''} InputLabelProps={{ shrink: true }} fullWidth />
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField name="compare_to" label="Previous To" type="date" defaultValue={filters?.compare_to || ''} InputLabelProps={{ shrink: true }} fullWidth />
              </Grid>
              <Grid item xs={12} md={1}>
                <Button type="submit" variant="contained" fullWidth sx={{ mt: { md: 1 } }}>Apply</Button>
              </Grid>
              <Grid item xs={12} md={1}>
                <Button type="button" variant="outlined" fullWidth sx={{ mt: { md: 1 } }} onClick={exportCsv}>CSV</Button>
              </Grid>
              <Grid item xs={12} md={1}>
                <Button type="button" variant="outlined" fullWidth sx={{ mt: { md: 1 } }} onClick={printView}>Print</Button>
              </Grid>
              <Grid item xs={12} md={1}>
                <Button type="button" variant="outlined" fullWidth sx={{ mt: { md: 1 } }} onClick={() => router.get(route('accounting.reports.financial-statements'))}>
                  Reset
                </Button>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <StatCard
            label="Net Profit"
            current={comparison?.net_profit?.current}
            previous={comparison?.net_profit?.previous}
            delta={comparison?.net_profit?.delta}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <StatCard
            label="Assets"
            current={comparison?.assets_total?.current}
            previous={comparison?.assets_total?.previous}
            delta={comparison?.assets_total?.delta}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <StatCard
            label="Liabilities"
            current={comparison?.liabilities_total?.current}
            previous={comparison?.liabilities_total?.previous}
            delta={comparison?.liabilities_total?.delta}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <StatCard
            label="Equity"
            current={comparison?.equity_total?.current}
            previous={comparison?.equity_total?.previous}
            delta={comparison?.equity_total?.delta}
          />
        </Grid>
      </Grid>

      <Typography variant="h6" sx={{ mb: 1, color: 'primary.main' }}>Executive Health</Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <HealthCard
            label="Current Ratio"
            value={currentHealth?.current_ratio}
            previous={previousHealth?.current_ratio}
            better="up"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <HealthCard
            label="Debt to Equity"
            value={currentHealth?.debt_to_equity}
            previous={previousHealth?.debt_to_equity}
            better="down"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <HealthCard
            label="Net Margin"
            value={currentHealth?.net_margin}
            previous={previousHealth?.net_margin}
            unit="%"
            better="up"
          />
        </Grid>
      </Grid>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 1, color: 'primary.main' }}>Executive Notes</Typography>
          <Typography variant="body2" sx={{ mb: 0.75, color: Number(comparison?.net_profit?.delta || 0) >= 0 ? 'success.main' : 'error.main' }}>
            Net profit movement: {Number(comparison?.net_profit?.delta || 0) >= 0 ? 'Improved' : 'Declined'} by {Number(Math.abs(comparison?.net_profit?.delta || 0)).toFixed(2)}.
          </Typography>
          <Typography variant="body2" sx={{ mb: 0.75, color: Number(healthComparison?.current_ratio?.delta || 0) >= 0 ? 'success.main' : 'warning.main' }}>
            Liquidity trend: Current ratio {Number(healthComparison?.current_ratio?.delta || 0) >= 0 ? 'improved' : 'decreased'}.
          </Typography>
          <Typography variant="body2" sx={{ color: Number(healthComparison?.debt_to_equity?.delta || 0) <= 0 ? 'success.main' : 'warning.main' }}>
            Leverage trend: Debt to equity {Number(healthComparison?.debt_to_equity?.delta || 0) <= 0 ? 'improved' : 'increased'}.
          </Typography>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>Comparison Matrix</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Metric</TableCell>
                <TableCell align="right">Current</TableCell>
                <TableCell align="right">Previous</TableCell>
                <TableCell align="right">Delta</TableCell>
                <TableCell align="right">Change %</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.key}>
                  <TableCell>{row.label}</TableCell>
                  <TableCell align="right">{Number(comparison?.[row.key]?.current || 0).toFixed(2)}</TableCell>
                  <TableCell align="right">{Number(comparison?.[row.key]?.previous || 0).toFixed(2)}</TableCell>
                  <TableCell align="right">{Number(comparison?.[row.key]?.delta || 0).toFixed(2)}</TableCell>
                  <TableCell align="right">
                    {comparison?.[row.key]?.change_percent == null
                      ? '-'
                      : `${Number(comparison?.[row.key]?.change_percent || 0).toFixed(2)}%`}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ color: 'primary.main' }}>Drill-down Reports</Typography>
            <Button size="small" variant="outlined" onClick={openPrintPack}>
              Open Print Pack
            </Button>
          </Box>
          <Grid container spacing={2}>
            <Grid item><Button component={Link} href={route('accounting.reports.trial-balance', { from: current?.from, to: current?.to })} variant="outlined">Trial Balance</Button></Grid>
            <Grid item><Button component={Link} href={route('accounting.reports.balance-sheet', { from: current?.from, to: current?.to })} variant="outlined">Balance Sheet</Button></Grid>
            <Grid item><Button component={Link} href={route('accounting.reports.profit-loss', { from: current?.from, to: current?.to })} variant="outlined">Profit & Loss</Button></Grid>
            <Grid item><Button component={Link} href={route('accounting.reports.receivables-aging', { from: current?.from, to: current?.to })} variant="outlined">AR Aging</Button></Grid>
            <Grid item><Button component={Link} href={route('accounting.reports.receivables-by-source', { from: current?.from, to: current?.to })} variant="outlined">AR by Source</Button></Grid>
            <Grid item><Button component={Link} href={route('accounting.reports.payables-aging', { from: current?.from, to: current?.to })} variant="outlined">AP Aging</Button></Grid>
            <Grid item><Button component={Link} href={route('accounting.general-ledger', { from: current?.from, to: current?.to })} variant="outlined">General Ledger</Button></Grid>
          </Grid>
        </CardContent>
      </Card>

      <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
        Current: {current?.from} to {current?.to} | Previous: {previous?.from} to {previous?.to}
      </Typography>

      <Box sx={{ display: 'none', '@media print': { display: 'block', mt: 2 } }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, color: 'primary.main' }}>
          Financial Statements Summary
        </Typography>
        <Typography variant="body2" sx={{ mb: 1 }}>
          Period: {current?.from} to {current?.to} | Comparison: {previous?.from} to {previous?.to}
        </Typography>
        <Typography variant="body2">Net Profit: {Number(comparison?.net_profit?.current || 0).toFixed(2)} (Prev {Number(comparison?.net_profit?.previous || 0).toFixed(2)})</Typography>
        <Typography variant="body2">Current Ratio: {Number(currentHealth?.current_ratio || 0).toFixed(2)} | Debt/Equity: {Number(currentHealth?.debt_to_equity || 0).toFixed(2)}</Typography>
      </Box>
    </Box>
  );
}
