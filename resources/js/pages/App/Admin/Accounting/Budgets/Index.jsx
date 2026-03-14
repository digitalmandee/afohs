import React from 'react';
import { useForm, router } from '@inertiajs/react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { Add, DeleteOutline } from '@mui/icons-material';
import Pagination from '@/components/Pagination';

const StatCard = ({ label, value, tone = 'default' }) => (
  <Card
    sx={{
      border: '1px solid',
      borderColor: 'divider',
      background: tone === 'muted' ? 'linear-gradient(180deg, rgba(6,52,85,0.06), rgba(6,52,85,0.02))' : 'background.paper',
    }}
  >
    <CardContent>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h5" sx={{ mt: 1, fontWeight: 700 }}>
        {value}
      </Typography>
    </CardContent>
  </Card>
);

export default function Index({ budgets, coaAccounts, filters, error }) {
  const [openModal, setOpenModal] = React.useState(false);
  const { data, setData, post, processing, errors, reset } = useForm({
    name: '',
    start_date: '',
    end_date: '',
    status: 'draft',
    remarks: '',
    lines: [{ account_id: '', amount: '' }],
  });

  const list = budgets?.data || [];
  const totalAmount = data.lines.reduce((sum, line) => sum + Number(line.amount || 0), 0);
  const totalBudgets = budgets?.total ?? list.length;
  const activeBudgets = list.filter((budget) => budget.status === 'active').length;
  const totalBudgeted = list.reduce((sum, budget) => sum + Number(budget.total_amount || 0), 0);

  const addLine = () => {
    setData('lines', [...data.lines, { account_id: '', amount: '' }]);
  };

  const removeLine = (index) => {
    setData(
      'lines',
      data.lines.filter((_, idx) => idx !== index)
    );
  };

  const updateLine = (index, key, value) => {
    const next = data.lines.map((line, idx) => (idx === index ? { ...line, [key]: value } : line));
    setData('lines', next);
  };

  const submit = (e) => {
    e.preventDefault();
    post(route('accounting.budgets.store'), {
      onSuccess: () => {
        reset();
        setOpenModal(false);
      },
    });
  };

  const submitFilters = (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    router.get(route('accounting.budgets.index'), {
      search: form.get('search'),
      status: form.get('status'),
      from: form.get('from'),
      to: form.get('to'),
    });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ color: 'primary.main', fontWeight: 700 }}>Budgets</Typography>
          <Typography variant="body2" color="text.secondary">
            Plan spend by account and keep teams aligned.
          </Typography>
        </Box>
        <Button variant="contained" onClick={() => setOpenModal(true)} startIcon={<Add />}>
          New Budget
        </Button>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <StatCard label="Total Budgets" value={totalBudgets} tone="muted" />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard label="Active Budgets" value={activeBudgets} />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard label="Total Budgeted" value={Number(totalBudgeted || 0).toFixed(2)} />
        </Grid>
      </Grid>

      {error && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <form onSubmit={submitFilters}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <TextField name="search" label="Search budgets" defaultValue={filters?.search || ''} fullWidth />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField select name="status" label="Status" defaultValue={filters?.status || ''} fullWidth>
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="closed">Closed</MenuItem>
                </TextField>
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
              <Grid item xs={12} md={1}>
                <Button type="submit" variant="contained" fullWidth>Apply</Button>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Budget Plans</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Period</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell align="right">Lines</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {list.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center">No budgets created yet.</TableCell>
                </TableRow>
              )}
              {list.map((budget) => (
                <TableRow key={budget.id}>
                  <TableCell>{budget.name}</TableCell>
                  <TableCell>
                    {budget.start_date} - {budget.end_date}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={budget.status}
                      size="small"
                      color={budget.status === 'active' ? 'success' : budget.status === 'closed' ? 'default' : 'warning'}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="right">{Number(budget.total_amount || 0).toFixed(2)}</TableCell>
                  <TableCell align="right">{budget.lines?.length || 0}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination data={budgets} />
        </CardContent>
      </Card>

      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create Budget</DialogTitle>
        <form onSubmit={submit}>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 0 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Budget Name"
                  value={data.name}
                  onChange={(e) => setData('name', e.target.value)}
                  error={!!errors.name}
                  helperText={errors.name}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  label="Start Date"
                  type="date"
                  value={data.start_date}
                  onChange={(e) => setData('start_date', e.target.value)}
                  error={!!errors.start_date}
                  helperText={errors.start_date}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  label="End Date"
                  type="date"
                  value={data.end_date}
                  onChange={(e) => setData('end_date', e.target.value)}
                  error={!!errors.end_date}
                  helperText={errors.end_date}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  select
                  label="Status"
                  value={data.status}
                  onChange={(e) => setData('status', e.target.value)}
                  error={!!errors.status}
                  helperText={errors.status}
                  fullWidth
                >
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="closed">Closed</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={8}>
                <TextField
                  label="Remarks"
                  value={data.remarks}
                  onChange={(e) => setData('remarks', e.target.value)}
                  multiline
                  minRows={2}
                  fullWidth
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Budget Lines
              </Typography>
              <Button size="small" onClick={addLine} startIcon={<Add />}>
                Add Line
              </Button>
            </Box>

            <Grid container spacing={2}>
              {data.lines.map((line, index) => (
                <React.Fragment key={`line-${index}`}>
                  <Grid item xs={12} md={7}>
                    <TextField
                      select
                      label="Account"
                      value={line.account_id}
                      onChange={(e) => updateLine(index, 'account_id', e.target.value)}
                      error={!!errors[`lines.${index}.account_id`]}
                      helperText={errors[`lines.${index}.account_id`]}
                      fullWidth
                    >
                      {coaAccounts.map((acc) => (
                        <MenuItem key={acc.id} value={acc.id}>
                          {acc.full_code} - {acc.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={10} md={4}>
                    <TextField
                      label="Amount"
                      type="number"
                      inputProps={{ min: 0, step: '0.01' }}
                      value={line.amount}
                      onChange={(e) => updateLine(index, 'amount', e.target.value)}
                      error={!!errors[`lines.${index}.amount`]}
                      helperText={errors[`lines.${index}.amount`]}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={2} md={1} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <IconButton
                      color="error"
                      onClick={() => removeLine(index)}
                      disabled={data.lines.length === 1}
                    >
                      <DeleteOutline />
                    </IconButton>
                  </Grid>
                </React.Fragment>
              ))}
            </Grid>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Total: {totalAmount.toFixed(2)}
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setOpenModal(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={processing || data.lines.length === 0}>
              Create Budget
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
