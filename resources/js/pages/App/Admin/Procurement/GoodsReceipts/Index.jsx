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

export default function Index({ receipts, filters, summary = {}, vendors = [], warehouses = [] }) {
  const data = receipts?.data || [];

  const submit = (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    router.get(route('procurement.goods-receipts.index'), {
      search: form.get('search'),
      status: form.get('status'),
      vendor_id: form.get('vendor_id'),
      warehouse_id: form.get('warehouse_id'),
      from: form.get('from'),
      to: form.get('to'),
    });
  };

  const resetFilters = () => {
    router.get(route('procurement.goods-receipts.index'));
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4">Goods Receipts</Typography>
        <Button variant="contained" component={Link} href={route('procurement.goods-receipts.create')}>
          New GRN
        </Button>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ pb: 0 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}><StatCard label="Receipts" value={summary.count || 0} /></Grid>
            <Grid item xs={12} md={3}><StatCard label="Received" value={summary.received || 0} /></Grid>
            <Grid item xs={12} md={3}><StatCard label="Draft" value={summary.draft || 0} /></Grid>
            <Grid item xs={12} md={3}><StatCard label="Cancelled" value={summary.cancelled || 0} /></Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <form onSubmit={submit}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={3}>
                <TextField name="search" label="Search GRN/vendor" defaultValue={filters?.search || ''} fullWidth />
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField select name="status" label="Status" defaultValue={filters?.status || ''} fullWidth>
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="received">Received</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
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
                <TextField select name="warehouse_id" label="Warehouse" defaultValue={filters?.warehouse_id || ''} fullWidth>
                  <MenuItem value="">All Warehouses</MenuItem>
                  {warehouses.map((warehouse) => (
                    <MenuItem key={warehouse.id} value={warehouse.id}>{warehouse.name}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={1}>
                <TextField
                  name="from"
                  label="From"
                  type="date"
                  defaultValue={filters?.from || ''}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={1}>
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
              <Grid item xs={12} md={1}>
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
                <TableCell>GRN No</TableCell>
                <TableCell>Vendor</TableCell>
                <TableCell>Warehouse</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>GL</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">No receipts.</TableCell>
                </TableRow>
              )}
              {data.map((grn) => (
                <TableRow key={grn.id}>
                  <TableCell>{grn.grn_no}</TableCell>
                  <TableCell>{grn.vendor?.name}</TableCell>
                  <TableCell>{grn.warehouse?.name}</TableCell>
                  <TableCell>{grn.received_date}</TableCell>
                  <TableCell>{grn.status}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={grn.gl_posted ? 'Posted' : 'Pending'}
                      color={grn.gl_posted ? 'success' : 'warning'}
                      variant={grn.gl_posted ? 'filled' : 'outlined'}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination data={receipts} />
        </CardContent>
      </Card>
    </Box>
  );
}
