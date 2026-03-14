import React from 'react';
import {
    Box,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableFooter,
    TableHead,
    TablePagination,
    TableRow,
    Tabs,
    Tab,
    Typography,
} from '@mui/material';
import SurfaceCard from './SurfaceCard';

export default function DataTableCard({
    title,
    subtitle,
    tabs,
    activeTab = 0,
    onTabChange,
    columns,
    rows,
    renderRow,
    page = 0,
    rowsPerPage = 10,
    onPageChange,
    onRowsPerPageChange,
    emptyMessage = 'No records found.',
    actions,
    tableMinWidth = 1400,
}) {
    const pagedRows = React.useMemo(() => rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage), [page, rows, rowsPerPage]);

    return (
        <SurfaceCard
            title={title}
            subtitle={subtitle}
            actions={
                tabs?.length ? (
                    <Tabs
                        value={activeTab}
                        onChange={onTabChange}
                        sx={{
                            minHeight: 42,
                            bgcolor: 'rgba(6,52,85,0.04)',
                            borderRadius: '14px',
                            p: 0.4,
                            '& .MuiTabs-flexContainer': { gap: 0.5 },
                            '& .MuiTabs-indicator': { display: 'none' },
                        }}
                    >
                        {tabs.map((tab) => (
                            <Tab
                                key={tab.label}
                                label={tab.label}
                                sx={{
                                    minHeight: 34,
                                    borderRadius: '11px',
                                    color: '#6b7280',
                                    '&.Mui-selected': {
                                        color: '#063455',
                                        bgcolor: '#ffffff',
                                        boxShadow: '0 8px 16px rgba(15, 23, 42, 0.08)',
                                    },
                                }}
                            />
                        ))}
                    </Tabs>
                ) : (
                    actions
                )
            }
            contentSx={{ p: 0, '&:last-child': { pb: 0 } }}
            cardSx={{ overflow: 'hidden' }}
        >
            <TableContainer
                component={Paper}
                elevation={0}
                className="premium-scroll"
                sx={{
                    border: 'none',
                    borderRadius: 0,
                    overflowX: 'auto',
                    overflowY: 'hidden',
                }}
            >
                <Table sx={{ minWidth: tableMinWidth }}>
                    <TableHead>
                        <TableRow
                            sx={{
                                '& .MuiTableCell-head': {
                                    bgcolor: '#0a3d62',
                                    color: '#f8fafc',
                                    borderBottom: 'none',
                                    py: 1.4,
                                    fontSize: '0.72rem',
                                },
                                '& .MuiTableCell-head:first-of-type': {
                                    borderTopLeftRadius: 18,
                                },
                                '& .MuiTableCell-head:last-of-type': {
                                    borderTopRightRadius: 18,
                                },
                            }}
                        >
                            {columns.map((column) => (
                                <TableCell key={column.key} sx={column.sx || {}}>
                                    {column.label}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {pagedRows.length ? (
                            pagedRows.map((row, index) => renderRow(row, index))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                                    {emptyMessage}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                    <TableFooter>
                        <TableRow>
                            <TablePagination
                                colSpan={columns.length}
                                count={rows.length}
                                page={page}
                                rowsPerPage={rowsPerPage}
                                onPageChange={onPageChange}
                                onRowsPerPageChange={onRowsPerPageChange}
                                rowsPerPageOptions={[10, 25, 50, 100]}
                                labelRowsPerPage="Rows"
                                SelectProps={{
                                    size: 'small',
                                    MenuProps: { PaperProps: { sx: { borderRadius: 2 } } },
                                    sx: {
                                        minWidth: 74,
                                        '& .MuiSelect-select': { py: 0.6, pr: 4 },
                                    },
                                }}
                                sx={{
                                    px: { xs: 1.25, md: 2 },
                                    py: 0.4,
                                    borderTop: '1px solid #eef2f7',
                                    '& .MuiTablePagination-toolbar': {
                                        minHeight: 58,
                                        px: 0,
                                        gap: 1,
                                        flexWrap: 'wrap',
                                    },
                                    '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                                        fontSize: '0.84rem',
                                        color: '#6b7280',
                                        mb: 0,
                                    },
                                    '& .MuiTablePagination-actions': {
                                        marginLeft: 'auto',
                                    },
                                }}
                            />
                        </TableRow>
                    </TableFooter>
                </Table>
            </TableContainer>
            {actions && tabs?.length ? (
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 2.5, py: 1.5 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Showing {rows.length ? page * rowsPerPage + 1 : 0} to {Math.min(rows.length, page * rowsPerPage + rowsPerPage)} of {rows.length} records
                    </Typography>
                    <Box>{actions}</Box>
                </Stack>
            ) : null}
        </SurfaceCard>
    );
}
