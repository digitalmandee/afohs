import React from 'react';
import { Alert, Box, CircularProgress, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import Pagination from '@/components/Pagination';

const defaultHeadRowSx = {
    '& .MuiTableCell-head': {
        bgcolor: '#0a3d62',
        color: '#f8fafc',
        borderBottom: 'none',
        py: 1.35,
        fontSize: '0.74rem',
        fontWeight: 700,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
    },
    '& .MuiTableCell-head:first-of-type': {
        borderTopLeftRadius: 18,
    },
    '& .MuiTableCell-head:last-of-type': {
        borderTopRightRadius: 18,
    },
};

export default function AdminDataTable({
    columns = [],
    rows = [],
    renderRow,
    emptyMessage = 'No records found.',
    loading = false,
    error = '',
    pagination = null,
    tableMinWidth = 1200,
    size = 'small',
    headRowSx = defaultHeadRowSx,
    tableSx = {},
    containerSx = {},
}) {
    return (
        <Box>
            <TableContainer
                component={Paper}
                elevation={0}
                className="premium-scroll"
                sx={{
                    border: '1px solid #e9eef5',
                    borderRadius: '20px',
                    overflowX: 'auto',
                    overflowY: 'hidden',
                    backgroundColor: '#fff',
                    ...containerSx,
                }}
            >
                <Table size={size} sx={{ minWidth: tableMinWidth, ...tableSx }}>
                    <TableHead>
                        <TableRow sx={headRowSx}>
                            {columns.map((column) => (
                                <TableCell key={column.key} align={column.align || 'left'} sx={column.sx || {}}>
                                    {column.label}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {error ? (
                            <TableRow>
                                <TableCell colSpan={columns.length} sx={{ py: 3 }}>
                                    <Alert severity="error" variant="outlined">
                                        {error}
                                    </Alert>
                                </TableCell>
                            </TableRow>
                        ) : null}

                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={columns.length} align="center" sx={{ py: 6 }}>
                                    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1.25, color: 'text.secondary' }}>
                                        <CircularProgress size={18} />
                                        Loading records...
                                    </Box>
                                </TableCell>
                            </TableRow>
                        ) : null}

                        {!loading && !error && rows.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={columns.length} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                                    {emptyMessage}
                                </TableCell>
                            </TableRow>
                        ) : null}

                        {!loading && !error ? rows.map((row, index) => renderRow(row, index)) : null}
                    </TableBody>
                </Table>
            </TableContainer>

            {pagination ? <Pagination data={pagination} /> : null}
        </Box>
    );
}
