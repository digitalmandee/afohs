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

export default function Index({ warehouses }) {
  const [openModal, setOpenModal] = React.useState(false);
  const { data, setData, post, processing, errors, reset } = useForm({
    code: '',
    name: '',
    address: '',
    is_global: true,
    tenant_id: '',
    status: 'active',
  });

  const submit = (e) => {
    e.preventDefault();
    post(route('inventory.warehouses.store'), {
      onSuccess: () => {
        reset();
        setOpenModal(false);
      },
    });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4">Warehouses</Typography>
        <Button variant="contained" onClick={() => setOpenModal(true)}>
          Add Warehouse
        </Button>
      </Box>

      <Card>
        <CardContent>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Code</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Scope</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {warehouses.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center">No warehouses.</TableCell>
                </TableRow>
              )}
              {warehouses.map((wh) => (
                <TableRow key={wh.id}>
                  <TableCell>{wh.code}</TableCell>
                  <TableCell>{wh.name}</TableCell>
                  <TableCell>{wh.is_global ? 'Global' : 'Tenant'}</TableCell>
                  <TableCell>{wh.status}</TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      color="error"
                      onClick={() => router.delete(route('inventory.warehouses.destroy', wh.id))}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add Warehouse</DialogTitle>
        <form onSubmit={submit}>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 0 }}>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Code"
                  value={data.code}
                  onChange={(e) => setData('code', e.target.value)}
                  error={!!errors.code}
                  helperText={errors.code}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={8}>
                <TextField
                  label="Name"
                  value={data.name}
                  onChange={(e) => setData('name', e.target.value)}
                  error={!!errors.name}
                  helperText={errors.name}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Address"
                  value={data.address}
                  onChange={(e) => setData('address', e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  select
                  label="Scope"
                  value={data.is_global ? 'global' : 'tenant'}
                  onChange={(e) => setData('is_global', e.target.value === 'global')}
                  fullWidth
                >
                  <MenuItem value="global">Global</MenuItem>
                  <MenuItem value="tenant">Tenant</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}>
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
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setOpenModal(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={processing}>
              Create Warehouse
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
