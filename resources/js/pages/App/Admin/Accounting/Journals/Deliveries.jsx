import React from 'react';
import { router } from '@inertiajs/react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
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

const StatCard = ({ label, value }) => (
  <Card sx={{ border: '1px solid', borderColor: 'divider' }}>
    <CardContent>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="h5" sx={{ mt: 1, fontWeight: 700, color: 'primary.main' }}>{value}</Typography>
    </CardContent>
  </Card>
);

export default function Deliveries({ deliveries, filters, summary, error }) {
  const rows = deliveries?.data || [];

  const apply = (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    router.get(route('accounting.journals.deliveries'), {
      status: form.get('status'),
      channel: form.get('channel'),
      search: form.get('search'),
    });
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 2, color: 'primary.main', fontWeight: 700 }}>Reminder Delivery Log</Typography>
      {error && <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={4}><StatCard label="Total" value={summary?.total || 0} /></Grid>
        <Grid item xs={12} md={4}><StatCard label="Sent" value={summary?.sent || 0} /></Grid>
        <Grid item xs={12} md={4}><StatCard label="Failed" value={summary?.failed || 0} /></Grid>
      </Grid>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <form onSubmit={apply}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={3}>
                <TextField select name="status" label="Status" defaultValue={filters?.status || ''} fullWidth>
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="sent">Sent</MenuItem>
                  <MenuItem value="failed">Failed</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField select name="channel" label="Channel" defaultValue={filters?.channel || ''} fullWidth>
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="database">Database</MenuItem>
                  <MenuItem value="mail">Email</MenuItem>
                  <MenuItem value="whatsapp">WhatsApp</MenuItem>
                  <MenuItem value="sms">SMS</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField name="search" label="Recipient/Response" defaultValue={filters?.search || ''} fullWidth />
              </Grid>
              <Grid item xs={12} md={1}>
                <Button type="submit" variant="contained" fullWidth>Apply</Button>
              </Grid>
              <Grid item xs={12} md={1}>
                <Button type="button" variant="outlined" fullWidth onClick={() => router.get(route('accounting.journals.deliveries'))}>Reset</Button>
              </Grid>
            </Grid>
          </form>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button variant="outlined" onClick={() => router.post(route('accounting.journals.deliveries.retry-failed'))}>
              Retry Failed Webhooks
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>At</TableCell>
                <TableCell>Entry</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Recipient</TableCell>
                <TableCell>Channel</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Attempts</TableCell>
                <TableCell>Response</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} align="center">No delivery logs found.</TableCell>
                </TableRow>
              )}
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.created_at || '-'}</TableCell>
                  <TableCell>{row.journal_entry?.entry_no || '-'}</TableCell>
                  <TableCell>{row.user?.name || '-'}</TableCell>
                  <TableCell>{row.recipient || '-'}</TableCell>
                  <TableCell>{row.channel}</TableCell>
                  <TableCell>
                    <Chip size="small" variant="outlined" color={row.status === 'sent' ? 'success' : 'error'} label={row.status} />
                  </TableCell>
                  <TableCell>{row.attempts}</TableCell>
                  <TableCell>{row.provider_response ? String(row.provider_response).slice(0, 90) : '-'}</TableCell>
                  <TableCell align="right">
                    {row.status === 'failed' && (row.channel === 'whatsapp' || row.channel === 'sms') ? (
                      <Button size="small" variant="outlined" onClick={() => router.post(route('accounting.journals.deliveries.retry', row.id))}>
                        Retry
                      </Button>
                    ) : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination data={deliveries} />
        </CardContent>
      </Card>
    </Box>
  );
}

