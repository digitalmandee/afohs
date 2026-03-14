import React from 'react';
import { Link, router, useForm } from '@inertiajs/react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import Pagination from '@/components/Pagination';

const StatCard = ({ label, value }) => (
  <Card sx={{ border: '1px solid', borderColor: 'divider' }}>
    <CardContent>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="h5" sx={{ mt: 1, fontWeight: 700, color: 'primary.main' }}>{value}</Typography>
    </CardContent>
  </Card>
);

export default function Approvals({ entries, filters, approvalPolicy, summary }) {
  const rows = entries?.data || [];
  const [rejectId, setRejectId] = React.useState(null);
  const { data, setData, post, processing, reset } = useForm({ remarks: '' });

  const apply = (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    router.get(route('accounting.journals.approvals'), { search: form.get('search') });
  };

  const onReject = (e) => {
    e.preventDefault();
    if (!rejectId) return;
    post(route('accounting.journals.reject', rejectId), {
      onSuccess: () => {
        reset();
        setRejectId(null);
      },
    });
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 2, color: 'primary.main', fontWeight: 700 }}>Journal Approval Inbox</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Active policy: {approvalPolicy?.is_active ? 'Enabled' : 'Disabled'} · Maker-checker: {approvalPolicy?.enforce_maker_checker ? 'On' : 'Off'} · SLA: {approvalPolicy?.sla_hours ? `${approvalPolicy.sla_hours}h` : 'Not set'}
      </Typography>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={3}><StatCard label="Pending" value={summary?.pending || 0} /></Grid>
        <Grid item xs={12} md={3}><StatCard label="Overdue" value={summary?.overdue || 0} /></Grid>
        <Grid item xs={12} md={6}>
          <Card sx={{ border: '1px solid', borderColor: 'divider', height: '100%' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
              <Typography variant="body2" color="text.secondary">Reminder Controls</Typography>
              <Button variant="outlined" onClick={() => router.post(route('accounting.journals.remind-overdue'))}>
                Remind All Overdue
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <form onSubmit={apply}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={8}>
                <TextField name="search" label="Search entry no / description" defaultValue={filters?.search || ''} fullWidth />
              </Grid>
              <Grid item xs={12} md={2}>
                <Button type="submit" variant="contained" fullWidth>Apply</Button>
              </Grid>
              <Grid item xs={12} md={2}>
                <Button type="button" variant="outlined" fullWidth onClick={() => router.get(route('accounting.journals.approvals'))}>Reset</Button>
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
                <TableCell>Entry</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Description</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell>Next Step</TableCell>
                <TableCell>SLA</TableCell>
                <TableCell>Reminders</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center">No pending approvals.</TableCell>
                </TableRow>
              )}
              {rows.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>{entry.entry_no}</TableCell>
                  <TableCell>{entry.entry_date}</TableCell>
                  <TableCell>{entry.description || '-'}</TableCell>
                  <TableCell align="right">{Number(entry.amount || 0).toFixed(2)}</TableCell>
                  <TableCell>{entry.next_step ? `${entry.next_step.name} (${entry.next_step.role_name || 'any'})` : '-'}</TableCell>
                  <TableCell>
                    {entry.age_hours !== null ? (
                      <Chip
                        size="small"
                        color={entry.is_overdue ? 'error' : 'default'}
                        variant="outlined"
                        label={`${entry.age_hours}h`}
                      />
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    {entry.reminder_count || 0}
                    {entry.last_reminder_at && (
                      <Typography variant="caption" display="block" color="text.secondary">
                        {entry.last_reminder_at}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'inline-flex', gap: 1 }}>
                      <Button size="small" color="success" variant="outlined" onClick={() => router.post(route('accounting.journals.approve', entry.id))}>
                        Approve
                      </Button>
                      <Button size="small" color="error" variant="outlined" onClick={() => setRejectId(entry.id)}>
                        Reject
                      </Button>
                      <Button size="small" variant="outlined" onClick={() => router.post(route('accounting.journals.remind', entry.id))}>
                        Remind
                      </Button>
                      <Link href={route('accounting.journals.show', entry.id)}>Open</Link>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination data={entries} />
        </CardContent>
      </Card>

      <Dialog open={!!rejectId} onClose={() => setRejectId(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Reject Journal</DialogTitle>
        <form onSubmit={onReject}>
          <DialogContent>
            <TextField
              label="Remarks"
              value={data.remarks}
              onChange={(e) => setData('remarks', e.target.value)}
              fullWidth
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setRejectId(null)}>Cancel</Button>
            <Button type="submit" color="error" variant="contained" disabled={processing}>Reject</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
