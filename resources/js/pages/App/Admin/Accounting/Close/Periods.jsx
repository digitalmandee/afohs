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

export default function Periods({ periods, filters = {} }) {
  const [open, setOpen] = React.useState(false);
  const { data, setData, post, processing, reset } = useForm({
    name: '',
    start_date: '',
    end_date: '',
  });

  const apply = (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    router.get(route('accounting.periods.index'), { status: form.get('status') });
  };

  const create = () => {
    post(route('accounting.periods.store'), {
      onSuccess: () => {
        reset();
        setOpen(false);
      },
    });
  };

  const list = periods?.data || [];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ color: 'primary.main', fontWeight: 700 }}>Period Close & Locks</Typography>
          <Typography variant="body2" color="text.secondary">Close accounting periods with checklist controls and lock journal postings.</Typography>
        </Box>
        <Button variant="contained" onClick={() => setOpen(true)}>New Period</Button>
      </Box>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <form onSubmit={apply}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <TextField select name="status" label="Status" defaultValue={filters?.status || ''} fullWidth>
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="open">Open</MenuItem>
                  <MenuItem value="closed">Closed</MenuItem>
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
                <TableCell>Period</TableCell>
                <TableCell>Date Range</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Checklist</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {list.length === 0 && (
                <TableRow><TableCell colSpan={5} align="center">No accounting periods.</TableCell></TableRow>
              )}
              {list.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.name}</TableCell>
                  <TableCell>{p.start_date} to {p.end_date}</TableCell>
                  <TableCell>{p.status}</TableCell>
                  <TableCell>
                    Draft Journals: {p.checklist?.draft_journals || 0} | Failed Events: {p.checklist?.failed_events || 0} | Unreconciled Bank: {p.checklist?.unreconciled_bank || 0}
                    <br />
                    Draft Bills: {p.checklist?.draft_vendor_bills || 0} | Unbilled GRNs: {p.checklist?.unbilled_receipts || 0} | Open POs: {p.checklist?.open_purchase_orders || 0}
                  </TableCell>
                  <TableCell align="right">
                    {p.status === 'open' ? (
                      <>
                        <Button size="small" disabled={!p.checklist?.can_close} onClick={() => router.post(route('accounting.periods.lock', p.id))}>Lock</Button>
                        <Button size="small" color="warning" onClick={() => router.post(route('accounting.periods.lock', p.id), { force: true })}>Force Lock</Button>
                      </>
                    ) : (
                      <Button size="small" onClick={() => router.post(route('accounting.periods.reopen', p.id))}>Reopen</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination data={periods} />
        </CardContent>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Accounting Period</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={12}>
              <TextField label="Period Name" value={data.name} onChange={(e) => setData('name', e.target.value)} fullWidth />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="Start Date" type="date" value={data.start_date} onChange={(e) => setData('start_date', e.target.value)} InputLabelProps={{ shrink: true }} fullWidth />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="End Date" type="date" value={data.end_date} onChange={(e) => setData('end_date', e.target.value)} InputLabelProps={{ shrink: true }} fullWidth />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={processing} onClick={create}>Create</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
