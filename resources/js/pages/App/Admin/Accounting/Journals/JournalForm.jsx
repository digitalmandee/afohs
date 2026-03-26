import React from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
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

const emptyLine = () => ({
  account_id: '',
  description: '',
  debit: '',
  credit: '',
});

export default function JournalForm({ data, setData, errors, accounts = [], submitLabel, processing, onSubmit }) {
  const lines = data.lines || [];
  const totalDebit = lines.reduce((sum, line) => sum + Number(line.debit || 0), 0);
  const totalCredit = lines.reduce((sum, line) => sum + Number(line.credit || 0), 0);
  const difference = totalDebit - totalCredit;
  const displayAmount = (value) => (value === '' || value === null || value === undefined ? '' : value);

  const addLine = () => setData('lines', [...lines, emptyLine()]);
  const removeLine = (idx) => setData('lines', lines.filter((_, i) => i !== idx));
  const setLine = (idx, key, value) => {
    const next = lines.map((line, i) => (i === idx ? { ...line, [key]: value } : line));
    setData('lines', next);
  };
  const setAmountLine = (idx, side, value) => {
    const opposite = side === 'debit' ? 'credit' : 'debit';
    const numericValue = Number(value || 0);
    const next = lines.map((line, i) => (
      i === idx
        ? {
            ...line,
            [side]: value,
            [opposite]: numericValue > 0 ? '' : line[opposite],
          }
        : line
    ));

    setData('lines', next);
  };

  return (
    <Box>
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <TextField
                label="Entry Date"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={data.entry_date}
                onChange={(e) => setData('entry_date', e.target.value)}
                error={!!errors.entry_date}
                helperText={errors.entry_date}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={9}>
              <TextField
                label="Description"
                value={data.description}
                onChange={(e) => setData('description', e.target.value)}
                error={!!errors.description}
                helperText={errors.description}
                fullWidth
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="h6" sx={{ color: 'primary.main' }}>Journal Lines</Typography>
            <Button variant="outlined" startIcon={<Add />} onClick={addLine}>Add Line</Button>
          </Box>
          {!!errors.lines && (
            <Alert severity="warning" sx={{ mb: 1 }}>{errors.lines}</Alert>
          )}
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell width="33%">Account</TableCell>
                <TableCell width="33%">Description</TableCell>
                <TableCell align="right">Debit</TableCell>
                <TableCell align="right">Credit</TableCell>
                <TableCell align="right">Remove</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {lines.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center">No lines added.</TableCell>
                </TableRow>
              )}
              {lines.map((line, idx) => (
                <TableRow key={idx}>
                  <TableCell>
                    <TextField
                      select
                      size="small"
                      value={line.account_id || ''}
                      onChange={(e) => setLine(idx, 'account_id', e.target.value)}
                      fullWidth
                    >
                      <MenuItem value="">Select Account</MenuItem>
                      {accounts.map((acc) => (
                        <MenuItem key={acc.id} value={acc.id}>
                          {acc.full_code} - {acc.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      value={line.description || ''}
                      onChange={(e) => setLine(idx, 'description', e.target.value)}
                      fullWidth
                    />
                  </TableCell>
                  <TableCell align="right">
                    <TextField
                      size="small"
                      type="number"
                      inputProps={{ min: 0, step: '0.01' }}
                      value={displayAmount(line.debit)}
                      onChange={(e) => setAmountLine(idx, 'debit', e.target.value)}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <TextField
                      size="small"
                      type="number"
                      inputProps={{ min: 0, step: '0.01' }}
                      value={displayAmount(line.credit)}
                      onChange={(e) => setAmountLine(idx, 'credit', e.target.value)}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton color="error" onClick={() => removeLine(idx)} disabled={lines.length <= 1}>
                      <DeleteOutline fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={4}>
              <Typography variant="body2"><strong>Total Debit:</strong> {totalDebit.toFixed(2)}</Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="body2"><strong>Total Credit:</strong> {totalCredit.toFixed(2)}</Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="body2" color={Math.abs(difference) < 0.005 ? 'success.main' : 'warning.main'}>
                <strong>Difference:</strong> {difference.toFixed(2)}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
        <Button variant="contained" disabled={processing} onClick={onSubmit}>
          {submitLabel}
        </Button>
      </Box>
    </Box>
  );
}
