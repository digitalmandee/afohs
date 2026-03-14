import React from 'react';
import { router, useForm } from '@inertiajs/react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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

export default function Reconciliation({ sessions, paymentAccounts = [], filters = {}, activeSession, bookSnapshot }) {
  const [open, setOpen] = React.useState(false);
  const { data, setData, post, processing, reset } = useForm({
    payment_account_id: '',
    statement_start_date: '',
    statement_end_date: '',
    statement_opening_balance: '',
    statement_closing_balance: '',
    notes: '',
    statement_file: null,
    lines: [],
  });

  const apply = (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    router.get(route('accounting.bank-reconciliation.index'), {
      payment_account_id: form.get('payment_account_id'),
      status: form.get('status'),
      session_id: form.get('session_id'),
    });
  };

  const createSession = () => {
    post(route('accounting.bank-reconciliation.store'), {
      forceFormData: true,
      onSuccess: () => {
        reset();
        setOpen(false);
      },
    });
  };

  const list = sessions?.data || [];
  const lines = activeSession?.lines || [];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ color: 'primary.main', fontWeight: 700 }}>Bank Reconciliation</Typography>
          <Typography variant="body2" color="text.secondary">Import statement balances and auto-match with system cash movements.</Typography>
        </Box>
        <Button variant="contained" onClick={() => setOpen(true)}>New Session</Button>
      </Box>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <form onSubmit={apply}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <TextField select name="payment_account_id" label="Bank Account" defaultValue={filters?.payment_account_id || ''} fullWidth>
                  <MenuItem value="">All</MenuItem>
                  {paymentAccounts.map((acc) => (
                    <MenuItem key={acc.id} value={acc.id}>{acc.name}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField select name="status" label="Status" defaultValue={filters?.status || ''} fullWidth>
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="reconciled">Reconciled</MenuItem>
                  <MenuItem value="locked">Locked</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField select name="session_id" label="View Session" defaultValue={filters?.session_id || ''} fullWidth>
                  <MenuItem value="">None</MenuItem>
                  {list.map((s) => (
                    <MenuItem key={s.id} value={s.id}>{s.payment_account?.name} · {s.statement_end_date}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={2}>
                <Button variant="contained" type="submit" fullWidth>Apply</Button>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Account</TableCell>
                <TableCell>Period</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Statement Closing</TableCell>
                <TableCell align="right">Book Closing</TableCell>
                <TableCell align="right">Difference</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {list.length === 0 && (
                <TableRow><TableCell colSpan={7} align="center">No reconciliation sessions yet.</TableCell></TableRow>
              )}
              {list.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>{s.payment_account?.name}</TableCell>
                  <TableCell>{s.statement_start_date} to {s.statement_end_date}</TableCell>
                  <TableCell>{s.status}</TableCell>
                  <TableCell align="right">{Number(s.statement_closing_balance || 0).toFixed(2)}</TableCell>
                  <TableCell align="right">{Number(s.book_closing_balance || 0).toFixed(2)}</TableCell>
                  <TableCell align="right">{Number(s.difference_amount || 0).toFixed(2)}</TableCell>
                  <TableCell align="right">
                    <Button size="small" onClick={() => router.get(route('accounting.bank-reconciliation.index', { ...filters, session_id: s.id }))}>Open</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination data={sessions} />
        </CardContent>
      </Card>

      {activeSession && (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ color: 'primary.main' }}>
                Session #{activeSession.id} ({activeSession.status})
              </Typography>
              <Button
                variant="outlined"
                onClick={() => router.post(route('accounting.bank-reconciliation.auto-match', activeSession.id))}
              >
                Auto Match
              </Button>
            </Box>
            {bookSnapshot && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                Book Opening: {Number(bookSnapshot.opening_balance || 0).toFixed(2)} | Inflows: {Number(bookSnapshot.period_inflows || 0).toFixed(2)} | Outflows: {Number(bookSnapshot.period_outflows || 0).toFixed(2)} | Book Closing: {Number(bookSnapshot.closing_balance || 0).toFixed(2)}
              </Typography>
            )}
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Reference</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Direction</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Matched Ref</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {lines.length === 0 && (
                  <TableRow><TableCell colSpan={7} align="center">No statement lines added.</TableCell></TableRow>
                )}
                {lines.map((line) => (
                  <TableRow key={line.id}>
                    <TableCell>{line.txn_date}</TableCell>
                    <TableCell>{line.reference_no || '-'}</TableCell>
                    <TableCell>{line.description || '-'}</TableCell>
                    <TableCell>{line.direction}</TableCell>
                    <TableCell align="right">{Number(line.amount || 0).toFixed(2)}</TableCell>
                    <TableCell>{line.status}</TableCell>
                    <TableCell>{line.matched_reference || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create Reconciliation Session</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={12} md={4}>
              <TextField
                select
                label="Bank Account"
                value={data.payment_account_id}
                onChange={(e) => setData('payment_account_id', e.target.value)}
                fullWidth
              >
                {paymentAccounts.map((acc) => (
                  <MenuItem key={acc.id} value={acc.id}>{acc.name}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField label="Statement Start" type="date" value={data.statement_start_date} onChange={(e) => setData('statement_start_date', e.target.value)} InputLabelProps={{ shrink: true }} fullWidth />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField label="Statement End" type="date" value={data.statement_end_date} onChange={(e) => setData('statement_end_date', e.target.value)} InputLabelProps={{ shrink: true }} fullWidth />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="Statement Opening Balance" type="number" value={data.statement_opening_balance} onChange={(e) => setData('statement_opening_balance', e.target.value)} fullWidth />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="Statement Closing Balance" type="number" value={data.statement_closing_balance} onChange={(e) => setData('statement_closing_balance', e.target.value)} fullWidth />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Notes" value={data.notes} onChange={(e) => setData('notes', e.target.value)} fullWidth />
            </Grid>
            <Grid item xs={12}>
              <Button component="label" variant="outlined">
                Upload Statement CSV
                <input
                  hidden
                  type="file"
                  accept=".csv,text/csv,text/plain"
                  onChange={(e) => setData('statement_file', e.target.files?.[0] || null)}
                />
              </Button>
              <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                Format: `date,reference,description,direction,amount` or `date,reference,description,debit,credit`
              </Typography>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={createSession} disabled={processing}>Create</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
