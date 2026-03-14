import React from 'react';
import { Link, router } from '@inertiajs/react';
import axios from 'axios';
import { Box, Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Grid, MenuItem, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';
import Pagination from '@/components/Pagination';

const StatCard = ({ label, value }) => (
  <Card sx={{ border: '1px solid', borderColor: 'divider' }}>
    <CardContent>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>{value}</Typography>
    </CardContent>
  </Card>
);

export default function Index({ bills, filters, summary = {}, vendors = [] }) {
  const data = bills?.data || [];
  const [historyOpen, setHistoryOpen] = React.useState(false);
  const [historyRows, setHistoryRows] = React.useState([]);
  const [historyTitle, setHistoryTitle] = React.useState('');
  const [loadingHistory, setLoadingHistory] = React.useState(false);

  const submit = (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    router.get(route('procurement.vendor-bills.index'), {
      search: form.get('search'),
      status: form.get('status'),
      vendor_id: form.get('vendor_id'),
      from: form.get('from'),
      to: form.get('to'),
    });
  };

  const resetFilters = () => {
    router.get(route('procurement.vendor-bills.index'));
  };

  const openHistory = async (bill) => {
    setHistoryTitle(`Approval History - ${bill.bill_no}`);
    setHistoryRows([]);
    setLoadingHistory(true);
    setHistoryOpen(true);
    try {
      const res = await axios.get(route('procurement.approval-actions.index'), {
        params: { document_type: 'vendor_bill', document_id: bill.id },
      });
      setHistoryRows(res.data?.actions || []);
    } catch (e) {
      setHistoryRows([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4">Vendor Bills</Typography>
        <Button variant="contained" component={Link} href={route('procurement.vendor-bills.create')}>
          New Bill
        </Button>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ pb: 0 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}><StatCard label="Bills" value={summary.count || 0} /></Grid>
            <Grid item xs={12} md={3}><StatCard label="Total Value" value={Number(summary.total_value || 0).toFixed(2)} /></Grid>
            <Grid item xs={12} md={3}><StatCard label="Outstanding" value={Number(summary.outstanding || 0).toFixed(2)} /></Grid>
            <Grid item xs={12} md={3}><StatCard label="Posted" value={summary.posted || 0} /></Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <form onSubmit={submit}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={2}>
                <TextField name="search" label="Search bill/vendor" defaultValue={filters?.search || ''} fullWidth />
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField select name="status" label="Status" defaultValue={filters?.status || ''} fullWidth>
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="posted">Posted</MenuItem>
                  <MenuItem value="partially_paid">Partially Paid</MenuItem>
                  <MenuItem value="paid">Paid</MenuItem>
                  <MenuItem value="void">Void</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField select name="vendor_id" label="Vendor" defaultValue={filters?.vendor_id || ''} fullWidth>
                  <MenuItem value="">All Vendors</MenuItem>
                  {vendors.map((vendor) => (
                    <MenuItem key={vendor.id} value={vendor.id}>{vendor.name}</MenuItem>
                  ))}
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
              <Grid item xs={12} md={2}>
                <Button type="submit" variant="contained" fullWidth>Apply</Button>
              </Grid>
              <Grid item xs={12} md={2}>
                <Button type="button" variant="outlined" fullWidth onClick={resetFilters}>Reset</Button>
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
                <TableCell>Bill No</TableCell>
                <TableCell>Vendor</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Approval</TableCell>
                <TableCell>GL</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center">No bills.</TableCell>
                </TableRow>
              )}
              {data.map((bill) => (
                <TableRow key={bill.id}>
                  <TableCell>{bill.bill_no}</TableCell>
                  <TableCell>{bill.vendor?.name}</TableCell>
                  <TableCell>{bill.bill_date}</TableCell>
                  <TableCell>{bill.status}</TableCell>
                  <TableCell>{bill.latest_approval_action?.action || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={bill.gl_posted ? 'Posted' : 'Pending'}
                      color={bill.gl_posted ? 'success' : 'warning'}
                      variant={bill.gl_posted ? 'filled' : 'outlined'}
                    />
                  </TableCell>
                  <TableCell align="right">{Number(bill.grand_total || 0).toFixed(2)}</TableCell>
                  <TableCell align="right">
                    {bill.status === 'draft' && (
                      <>
                        <Button size="small" component={Link} href={route('procurement.vendor-bills.edit', bill.id)}>Edit</Button>
                        <Button size="small" onClick={() => router.post(route('procurement.vendor-bills.submit', bill.id))}>Submit</Button>
                        <Button size="small" color="success" onClick={() => router.post(route('procurement.vendor-bills.approve', bill.id))}>Approve</Button>
                        <Button size="small" color="error" onClick={() => router.post(route('procurement.vendor-bills.reject', bill.id))}>Reject</Button>
                      </>
                    )}
                    <Button size="small" onClick={() => openHistory(bill)}>History</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination data={bills} />
        </CardContent>
      </Card>

      <Dialog open={historyOpen} onClose={() => setHistoryOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{historyTitle}</DialogTitle>
        <DialogContent>
          {loadingHistory && <Typography>Loading history...</Typography>}
          {!loadingHistory && (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Action</TableCell>
                  <TableCell>By</TableCell>
                  <TableCell>Remarks</TableCell>
                  <TableCell>Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {historyRows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} align="center">No approval actions yet.</TableCell>
                  </TableRow>
                )}
                {historyRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.action}</TableCell>
                    <TableCell>{row.action_by_name || row.action_by || '-'}</TableCell>
                    <TableCell>{row.remarks || '-'}</TableCell>
                    <TableCell>{row.created_at || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistoryOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
