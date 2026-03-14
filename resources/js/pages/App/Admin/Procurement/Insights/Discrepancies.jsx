import React from 'react';
import { Link, router } from '@inertiajs/react';
import { Box, Button, Card, CardContent, Chip, Grid, MenuItem, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';
import Pagination from '@/components/Pagination';

const StatCard = ({ label, value }) => (
  <Card sx={{ border: '1px solid', borderColor: 'divider' }}>
    <CardContent>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>{value}</Typography>
    </CardContent>
  </Card>
);

const typeMeta = {
  unbilled: { label: 'Unbilled', color: 'warning' },
  over_billed: { label: 'Over Billed', color: 'error' },
  under_billed: { label: 'Under Billed', color: 'info' },
  price_variance: { label: 'Price Variance', color: 'secondary' },
  matched: { label: 'Matched', color: 'success' },
};

export default function Discrepancies({ rows, summary = {}, vendors = [], filters = {}, error }) {
  const list = rows?.data || [];

  const submit = (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    router.get(route('procurement.insights.discrepancies'), {
      search: form.get('search'),
      vendor_id: form.get('vendor_id'),
      type: form.get('type'),
      from: form.get('from'),
      to: form.get('to'),
      show_matched: form.get('show_matched') ? 1 : 0,
    });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ color: 'primary.main', fontWeight: 700 }}>3-Way Match Queue</Typography>
          <Typography variant="body2" color="text.secondary">
            Monitor PO, GRN and Vendor Bill mismatches before month-end close.
          </Typography>
        </Box>
      </Box>

      {error && (
        <Card sx={{ mb: 2, border: '1px solid', borderColor: 'warning.main', bgcolor: 'rgba(237,108,2,0.08)' }}>
          <CardContent>
            <Typography color="warning.main">{error}</Typography>
          </CardContent>
        </Card>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ pb: 0 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={2}><StatCard label="Queue Items" value={summary.total || 0} /></Grid>
            <Grid item xs={12} md={2}><StatCard label="Unbilled" value={summary.unbilled || 0} /></Grid>
            <Grid item xs={12} md={2}><StatCard label="Over Billed" value={summary.over_billed || 0} /></Grid>
            <Grid item xs={12} md={2}><StatCard label="Under Billed" value={summary.under_billed || 0} /></Grid>
            <Grid item xs={12} md={2}><StatCard label="Price Variance" value={summary.price_variance || 0} /></Grid>
            <Grid item xs={12} md={2}><StatCard label="Matched" value={summary.matched || 0} /></Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <form onSubmit={submit}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={3}>
                <TextField name="search" label="Search GRN/PO/vendor" defaultValue={filters?.search || ''} fullWidth />
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
                <TextField select name="type" label="Queue Type" defaultValue={filters?.type || ''} fullWidth>
                  <MenuItem value="">All Types</MenuItem>
                  <MenuItem value="unbilled">Unbilled</MenuItem>
                  <MenuItem value="over_billed">Over Billed</MenuItem>
                  <MenuItem value="under_billed">Under Billed</MenuItem>
                  <MenuItem value="price_variance">Price Variance</MenuItem>
                  <MenuItem value="matched">Matched</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={1}>
                <TextField name="from" type="date" label="From" defaultValue={filters?.from || ''} InputLabelProps={{ shrink: true }} fullWidth />
              </Grid>
              <Grid item xs={12} md={1}>
                <TextField name="to" type="date" label="To" defaultValue={filters?.to || ''} InputLabelProps={{ shrink: true }} fullWidth />
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField
                  select
                  name="show_matched"
                  label="Matched"
                  defaultValue={Number(filters?.show_matched || 0)}
                  fullWidth
                >
                  <MenuItem value={0}>Hide</MenuItem>
                  <MenuItem value={1}>Show</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={1}>
                <Button type="submit" variant="contained" fullWidth>Go</Button>
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
                <TableCell>GRN</TableCell>
                <TableCell>PO</TableCell>
                <TableCell>Vendor</TableCell>
                <TableCell>Type</TableCell>
                <TableCell align="right">GRN Total</TableCell>
                <TableCell align="right">Billed Total</TableCell>
                <TableCell align="right">Delta</TableCell>
                <TableCell align="right">Price Variance</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {list.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} align="center">No discrepancy records found.</TableCell>
                </TableRow>
              )}
              {list.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.grn_no}</TableCell>
                  <TableCell>{row.po_no}</TableCell>
                  <TableCell>{row.vendor_name}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={typeMeta[row.type]?.label || row.type}
                      color={typeMeta[row.type]?.color || 'default'}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="right">{Number(row.receipt_total || 0).toFixed(2)}</TableCell>
                  <TableCell align="right">{Number(row.billed_total || 0).toFixed(2)}</TableCell>
                  <TableCell align="right">{Number(row.delta_amount || 0).toFixed(2)}</TableCell>
                  <TableCell align="right">{Number(row.price_variance_amount || 0).toFixed(2)}</TableCell>
                  <TableCell align="right">
                    {row.type === 'unbilled' ? (
                      <Button
                        size="small"
                        component={Link}
                        href={route('procurement.vendor-bills.create', { goods_receipt_id: row.id })}
                      >
                        Create Bill
                      </Button>
                    ) : (
                      <Typography variant="caption" color="text.secondary">Review</Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination data={rows} />
        </CardContent>
      </Card>
    </Box>
  );
}
