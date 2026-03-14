import React from 'react';
import { router } from '@inertiajs/react';
import { Box, Button, Card, CardContent, Grid, MenuItem, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';
import Pagination from '@/components/Pagination';

export default function GeneralLedger({ lines, accounts, filters }) {
  const data = lines?.data || [];

  const submit = (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    router.get(route('accounting.general-ledger'), {
      account_id: form.get('account_id'),
      from: form.get('from'),
      to: form.get('to'),
      search: form.get('search'),
    });
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 2, color: 'primary.main', fontWeight: 700 }}>General Ledger</Typography>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <form onSubmit={submit}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <TextField
                  select
                  label="Account"
                  name="account_id"
                  defaultValue={filters?.account_id || ''}
                  fullWidth
                >
                  <MenuItem value="">All</MenuItem>
                  {accounts.map((acc) => (
                    <MenuItem key={acc.id} value={acc.id}>
                      {acc.full_code} - {acc.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  name="search"
                  label="Search entry/description"
                  defaultValue={filters?.search || ''}
                  fullWidth
                />
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
                <Button type="submit" variant="contained" sx={{ mt: { md: 1 } }} fullWidth>
                  Apply
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
                <TableCell>Date</TableCell>
                <TableCell>Entry No</TableCell>
                <TableCell>Account</TableCell>
                <TableCell>Description</TableCell>
                <TableCell align="right">Debit</TableCell>
                <TableCell align="right">Credit</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">No ledger lines.</TableCell>
                </TableRow>
              )}
              {data.map((line) => (
                <TableRow key={line.id}>
                  <TableCell>{line.entry_date}</TableCell>
                  <TableCell>{line.entry_no}</TableCell>
                  <TableCell>{line.account?.full_code} - {line.account?.name}</TableCell>
                  <TableCell>{line.description || '-'}</TableCell>
                  <TableCell align="right">{Number(line.debit).toFixed(2)}</TableCell>
                  <TableCell align="right">{Number(line.credit).toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination data={lines} />
        </CardContent>
      </Card>
    </Box>
  );
}
