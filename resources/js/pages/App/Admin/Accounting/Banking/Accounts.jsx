import React from 'react';
import { useForm, router } from '@inertiajs/react';
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

export default function Accounts({ accounts, coaAccounts, filters }) {
  const [openModal, setOpenModal] = React.useState(false);
  const { data, setData, post, processing, errors, reset } = useForm({
    name: '',
    payment_method: 'bank_transfer',
    status: 'active',
    coa_account_id: '',
    is_default: false,
  });

  const list = accounts?.data || [];
  const coaMap = React.useMemo(() => new Map(coaAccounts.map((acc) => [acc.id, acc])), [coaAccounts]);

  const submitFilters = (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    router.get(route('accounting.bank-accounts.index'), {
      search: form.get('search'),
      status: form.get('status'),
      method: form.get('method'),
    });
  };

  const submit = (e) => {
    e.preventDefault();
    post(route('accounting.bank-accounts.store'), {
      onSuccess: () => {
        reset();
        setOpenModal(false);
      },
    });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4" sx={{ color: 'primary.main', fontWeight: 700 }}>Bank Accounts</Typography>
        <Button variant="contained" onClick={() => setOpenModal(true)}>
          Add Account
        </Button>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <form onSubmit={submitFilters}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <TextField name="search" label="Search name" defaultValue={filters?.search || ''} fullWidth />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField select name="method" label="Method" defaultValue={filters?.method || ''} fullWidth>
                  <MenuItem value="">All Methods</MenuItem>
                  <MenuItem value="bank_transfer">Bank</MenuItem>
                  <MenuItem value="online">Online</MenuItem>
                  <MenuItem value="cheque">Cheque</MenuItem>
                  <MenuItem value="cash">Cash</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField select name="status" label="Status" defaultValue={filters?.status || ''} fullWidth>
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={2}>
                <Button type="submit" variant="contained" fullWidth>Apply</Button>
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
                <TableCell>Name</TableCell>
                <TableCell>Method</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>COA</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {list.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center">No accounts.</TableCell>
                </TableRow>
              )}
              {list.map((acc) => (
                <TableRow key={acc.id}>
                  <TableCell>{acc.name}</TableCell>
                  <TableCell>{acc.payment_method}</TableCell>
                  <TableCell>{acc.status}</TableCell>
                  <TableCell>
                    {acc.coa_account_id && coaMap.has(acc.coa_account_id)
                      ? `${coaMap.get(acc.coa_account_id).full_code} - ${coaMap.get(acc.coa_account_id).name}`
                      : '-'}
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      color="error"
                      onClick={() => router.delete(route('accounting.bank-accounts.destroy', acc.id))}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination data={accounts} />
        </CardContent>
      </Card>

      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add Bank Account</DialogTitle>
        <form onSubmit={submit}>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 0 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Name"
                  value={data.name}
                  onChange={(e) => setData('name', e.target.value)}
                  error={!!errors.name}
                  helperText={errors.name}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  select
                  label="Method"
                  value={data.payment_method}
                  onChange={(e) => setData('payment_method', e.target.value)}
                  fullWidth
                >
                  <MenuItem value="bank_transfer">Bank</MenuItem>
                  <MenuItem value="online">Online</MenuItem>
                  <MenuItem value="cheque">Cheque</MenuItem>
                  <MenuItem value="cash">Cash</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  select
                  label="Status"
                  value={data.status}
                  onChange={(e) => setData('status', e.target.value)}
                  fullWidth
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  select
                  label="COA Account"
                  value={data.coa_account_id}
                  onChange={(e) => setData('coa_account_id', e.target.value)}
                  fullWidth
                >
                  <MenuItem value="">None</MenuItem>
                  {coaAccounts.map((acc) => (
                    <MenuItem key={acc.id} value={acc.id}>
                      {acc.full_code} - {acc.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setOpenModal(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={processing}>
              Create Account
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
