import React from 'react';
import {
    Box,
    IconButton,
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
    Tooltip,
    Typography,
} from '@mui/material';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
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
    showScrollArrows = true,
    showScrollFade = true,
    stickyFirstColumn = false,
    stickyLastColumn = false,
    scrollStep = null,
}) {
    const pagedRows = React.useMemo(() => rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage), [page, rows, rowsPerPage]);
    const tableContainerRef = React.useRef(null);
    const [scrollState, setScrollState] = React.useState({
        hasOverflow: false,
        canScrollLeft: false,
        canScrollRight: false,
    });

    const prefersReducedMotion = React.useMemo(() => {
        if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
            return false;
        }
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }, []);

    const updateScrollState = React.useCallback(() => {
        const node = tableContainerRef.current;
        if (!node) {
            return;
        }
        const maxScrollLeft = Math.max(node.scrollWidth - node.clientWidth, 0);
        const hasOverflow = maxScrollLeft > 1;
        const canScrollLeft = node.scrollLeft > 1;
        const canScrollRight = node.scrollLeft < maxScrollLeft - 1;
        setScrollState({ hasOverflow, canScrollLeft, canScrollRight });
    }, []);

    React.useEffect(() => {
        updateScrollState();
        const node = tableContainerRef.current;
        if (!node || typeof ResizeObserver === 'undefined') {
            return undefined;
        }
        const observer = new ResizeObserver(() => {
            updateScrollState();
        });
        observer.observe(node);
        return () => observer.disconnect();
    }, [rows.length, columns?.length, tableMinWidth, updateScrollState]);

    const resolveScrollDelta = React.useCallback(() => {
        const node = tableContainerRef.current;
        if (!node) {
            return 0;
        }
        if (typeof scrollStep === 'number' && Number.isFinite(scrollStep) && scrollStep > 0) {
            return scrollStep;
        }
        return Math.max(Math.round(node.clientWidth * 0.75), 280);
    }, [scrollStep]);

    const scrollHorizontally = React.useCallback(
        (direction) => {
            const node = tableContainerRef.current;
            if (!node) {
                return;
            }
            node.scrollBy({
                left: direction * resolveScrollDelta(),
                behavior: prefersReducedMotion ? 'auto' : 'smooth',
            });
        },
        [prefersReducedMotion, resolveScrollDelta]
    );

    const handleScroll = React.useCallback(() => {
        updateScrollState();
    }, [updateScrollState]);

    const columnPolicySx = React.useMemo(() => {
        const safeColumns = Array.isArray(columns) ? columns : [];
        const sx = {};

        safeColumns.forEach((column, index) => {
            const selector = `& .MuiTableRow-root > .MuiTableCell-root:nth-of-type(${index + 1})`;
            const cellSx = {};
            if (column.minWidth) {
                cellSx.minWidth = column.minWidth;
            }
            if (column.maxWidth) {
                cellSx.maxWidth = column.maxWidth;
            }
            if (column.truncate) {
                cellSx.whiteSpace = 'nowrap';
                cellSx.overflow = 'hidden';
                cellSx.textOverflow = 'ellipsis';
            } else if (column.wrap) {
                cellSx.whiteSpace = 'normal';
                cellSx.wordBreak = 'break-word';
            }
            if (Object.keys(cellSx).length > 0) {
                sx[selector] = cellSx;
            }
        });

        const firstColumnSticky = stickyFirstColumn || safeColumns[0]?.sticky === 'left';
        const lastColumnSticky = stickyLastColumn || safeColumns[safeColumns.length - 1]?.sticky === 'right';

        if (safeColumns.length > 0 && firstColumnSticky) {
            sx['& .MuiTableRow-root > .MuiTableCell-root:first-of-type'] = {
                position: 'sticky',
                left: 0,
                zIndex: 2,
                backgroundColor: '#fff',
                boxShadow: 'inset -1px 0 0 #e9eef5',
            };
            sx['& .MuiTableHead-root .MuiTableRow-root > .MuiTableCell-root:first-of-type'] = {
                zIndex: 6,
                backgroundColor: '#0a3d62',
            };
        }

        if (safeColumns.length > 0 && lastColumnSticky) {
            sx['& .MuiTableRow-root > .MuiTableCell-root:last-of-type'] = {
                position: 'sticky',
                right: 0,
                zIndex: 2,
                backgroundColor: '#fff',
                boxShadow: 'inset 1px 0 0 #e9eef5',
            };
            sx['& .MuiTableHead-root .MuiTableRow-root > .MuiTableCell-root:last-of-type'] = {
                zIndex: 6,
                backgroundColor: '#0a3d62',
            };
        }

        return sx;
    }, [columns, stickyFirstColumn, stickyLastColumn]);

    const showLeftFade = showScrollFade && scrollState.hasOverflow && scrollState.canScrollLeft;
    const showRightFade = showScrollFade && scrollState.hasOverflow && scrollState.canScrollRight;
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
            <Box sx={{ position: 'relative' }}>
            {showScrollArrows && scrollState.hasOverflow ? (
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        gap: 1,
                        mb: 1,
                        px: 0.25,
                    }}
                >
                    <Box
                        sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 0.5,
                            bgcolor: 'rgba(255,255,255,0.92)',
                            border: '1px solid #dbe5f1',
                            borderRadius: 999,
                            px: 0.4,
                            py: 0.2,
                            boxShadow: '0 10px 24px rgba(15, 23, 42, 0.12)',
                        }}
                    >
                        <Tooltip title="Scroll left columns">
                            <span>
                                <IconButton
                                    aria-label="Scroll table left"
                                    size="small"
                                    disabled={!scrollState.canScrollLeft}
                                    onClick={() => scrollHorizontally(-1)}
                                >
                                    <ChevronLeftRoundedIcon fontSize="small" />
                                </IconButton>
                            </span>
                        </Tooltip>
                        <Tooltip title="Scroll right columns">
                            <span>
                                <IconButton
                                    aria-label="Scroll table right"
                                    size="small"
                                    disabled={!scrollState.canScrollRight}
                                    onClick={() => scrollHorizontally(1)}
                                >
                                    <ChevronRightRoundedIcon fontSize="small" />
                                </IconButton>
                            </span>
                        </Tooltip>
                    </Box>
                </Box>
            ) : null}

            <TableContainer
                component={Paper}
                elevation={0}
                className="premium-scroll"
                ref={tableContainerRef}
                onScroll={handleScroll}
                tabIndex={0}
                onKeyDown={(event) => {
                    if (event.key === 'ArrowRight') {
                        event.preventDefault();
                        scrollHorizontally(1);
                    }
                    if (event.key === 'ArrowLeft') {
                        event.preventDefault();
                        scrollHorizontally(-1);
                    }
                }}
                sx={{
                    border: 'none',
                    borderRadius: 0,
                    overflowX: 'auto',
                    overflowY: 'hidden',
                    scrollBehavior: prefersReducedMotion ? 'auto' : 'smooth',
                    '&:focus-visible': {
                        outline: '2px solid #0a3d62',
                        outlineOffset: '1px',
                    },
                }}
            >
                <Table sx={{ minWidth: tableMinWidth, ...columnPolicySx }}>
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
            {showLeftFade ? (
                <Box
                    sx={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 64,
                        width: 26,
                        pointerEvents: 'none',
                        background: 'linear-gradient(90deg, rgba(15,23,42,0.16) 0%, rgba(15,23,42,0.04) 55%, rgba(15,23,42,0) 100%)',
                    }}
                />
            ) : null}
            {showRightFade ? (
                <Box
                    sx={{
                        position: 'absolute',
                        right: 0,
                        top: 0,
                        bottom: 64,
                        width: 26,
                        pointerEvents: 'none',
                        background: 'linear-gradient(270deg, rgba(15,23,42,0.16) 0%, rgba(15,23,42,0.04) 55%, rgba(15,23,42,0) 100%)',
                    }}
                />
            ) : null}
            </Box>
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
