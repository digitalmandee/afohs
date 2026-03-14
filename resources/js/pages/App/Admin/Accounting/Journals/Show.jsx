import React from 'react';
import { router, useForm } from '@inertiajs/react';
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

const StatCard = ({ label, value, tone = 'default' }) => (
  <Card
    sx={{
      border: '1px solid',
      borderColor: 'divider',
      background: tone === 'muted'
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

export default function Show({ entry, entrySummary, timeline = [], templatesEnabled }) {
  const [openReverse, setOpenReverse] = React.useState(false);
  const [openTemplate, setOpenTemplate] = React.useState(false);
  const [openReject, setOpenReject] = React.useState(false);
  const { data: reverseData, setData: setReverseData, post: postReverse, processing: reversing, reset: resetReverse } = useForm({
    reason: '',
    entry_date: '',
  });
  const { data: templateData, setData: setTemplateData, post: postTemplate, processing: savingTemplate, reset: resetTemplate } = useForm({
    name: '',
    description: '',
  });
  const { data: rejectData, setData: setRejectData, post: postReject, processing: rejecting, reset: resetReject } = useForm({
    remarks: '',
  });

  const submitReverse = (e) => {
    e.preventDefault();
    postReverse(route('accounting.journals.reverse', entry.id), {
      onSuccess: () => {
        resetReverse();
        setOpenReverse(false);
      },
    });
  };

  const submitTemplate = (e) => {
    e.preventDefault();
    postTemplate(route('accounting.journals.template.store', entry.id), {
      onSuccess: () => {
        resetTemplate();
        setOpenTemplate(false);
      },
    });
  };

  const submitReject = (e) => {
    e.preventDefault();
    postReject(route('accounting.journals.reject', entry.id), {
      onSuccess: () => {
        resetReject();
        setOpenReject(false);
      },
    });
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 2, color: 'primary.main', fontWeight: 700 }}>Journal Entry {entry.entry_no}</Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}><StatCard label="Total Debit" value={Number(entrySummary?.total_debit || 0).toFixed(2)} tone="muted" /></Grid>
        <Grid item xs={12} md={4}><StatCard label="Total Credit" value={Number(entrySummary?.total_credit || 0).toFixed(2)} /></Grid>
        <Grid item xs={12} md={4}><StatCard label="Difference" value={Number(entrySummary?.difference || 0).toFixed(2)} /></Grid>
      </Grid>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
            <Box>
              <Typography variant="body1"><strong>Date:</strong> {entry.entry_date}</Typography>
              <Typography variant="body1">
                <strong>Status:</strong> <Chip sx={{ ml: 1 }} size="small" label={entry.status} color={entry.status === 'posted' ? 'success' : entry.status === 'reversed' ? 'warning' : 'default'} variant="outlined" />
              </Typography>
              <Typography variant="body1"><strong>Description:</strong> {entry.description || '-'}</Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {entry.status === 'draft' && (
                <>
                  <Button variant="outlined" onClick={() => router.visit(route('accounting.journals.edit', entry.id))}>
                    Edit Draft
                  </Button>
                  <Button variant="outlined" onClick={() => router.post(route('accounting.journals.submit', entry.id))}>
                    Submit
                  </Button>
                  <Button color="success" variant="contained" onClick={() => router.post(route('accounting.journals.approve', entry.id))}>
                    Approve/Post
                  </Button>
                  <Button color="error" variant="outlined" onClick={() => setOpenReject(true)}>
                    Reject
                  </Button>
                </>
              )}
              {templatesEnabled && (
                <Button variant="outlined" onClick={() => setOpenTemplate(true)}>
                  Save as Template
                </Button>
              )}
              {entry.status === 'posted' && (
                <Button color="warning" variant="contained" onClick={() => setOpenReverse(true)}>
                  Reverse Entry
                </Button>
              )}
              <Button variant="outlined" onClick={() => router.visit(route('accounting.journals.index'))}>Back</Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 1, color: 'primary.main' }}>Lines</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Account</TableCell>
                <TableCell>Description</TableCell>
                <TableCell align="right">Debit</TableCell>
                <TableCell align="right">Credit</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {entry.lines?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center">No lines.</TableCell>
                </TableRow>
              )}
              {entry.lines?.map((line) => (
                <TableRow key={line.id}>
                  <TableCell>{line.account?.full_code} - {line.account?.name}</TableCell>
                  <TableCell>{line.description || '-'}</TableCell>
                  <TableCell align="right">{Number(line.debit || 0).toFixed(2)}</TableCell>
                  <TableCell align="right">{Number(line.credit || 0).toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 1, color: 'primary.main' }}>Approval & Audit Timeline</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Action</TableCell>
                <TableCell>Remarks</TableCell>
                <TableCell>User</TableCell>
                <TableCell>At</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {timeline.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center">No timeline yet.</TableCell>
                </TableRow>
              )}
              {timeline.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.action}</TableCell>
                  <TableCell>{item.remarks || '-'}</TableCell>
                  <TableCell>{item.actor_name || item.action_by || '-'}</TableCell>
                  <TableCell>{item.created_at || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={openReverse} onClose={() => setOpenReverse(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reverse Journal Entry</DialogTitle>
        <form onSubmit={submitReverse}>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 0 }}>
              <Grid item xs={12}>
                <TextField label="Reason" value={reverseData.reason} onChange={(e) => setReverseData('reason', e.target.value)} fullWidth required />
              </Grid>
              <Grid item xs={12}>
                <TextField label="Reversal Date" type="date" InputLabelProps={{ shrink: true }} value={reverseData.entry_date} onChange={(e) => setReverseData('entry_date', e.target.value)} fullWidth />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setOpenReverse(false)}>Cancel</Button>
            <Button type="submit" variant="contained" color="warning" disabled={reversing}>Reverse</Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog open={openTemplate} onClose={() => setOpenTemplate(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Save Journal as Template</DialogTitle>
        <form onSubmit={submitTemplate}>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 0 }}>
              <Grid item xs={12}>
                <TextField label="Template Name" value={templateData.name} onChange={(e) => setTemplateData('name', e.target.value)} fullWidth required />
              </Grid>
              <Grid item xs={12}>
                <TextField label="Description" value={templateData.description} onChange={(e) => setTemplateData('description', e.target.value)} fullWidth />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setOpenTemplate(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={savingTemplate}>Save Template</Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog open={openReject} onClose={() => setOpenReject(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reject Journal</DialogTitle>
        <form onSubmit={submitReject}>
          <DialogContent>
            <TextField
              label="Remarks"
              value={rejectData.remarks}
              onChange={(e) => setRejectData('remarks', e.target.value)}
              fullWidth
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setOpenReject(false)}>Cancel</Button>
            <Button type="submit" color="error" variant="contained" disabled={rejecting}>Reject</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
