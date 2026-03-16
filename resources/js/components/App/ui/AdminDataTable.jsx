import React from 'react';
import {
    Alert,
    Box,
    CircularProgress,
    IconButton,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tooltip,
} from '@mui/material';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
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
    showScrollArrows = true,
    showScrollFade = true,
    stickyFirstColumn = false,
    stickyLastColumn = false,
    scrollStep = null,
}) {
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
    }, [rows.length, columns.length, tableMinWidth, updateScrollState]);

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
            const delta = resolveScrollDelta();
            node.scrollBy({
                left: direction * delta,
                behavior: prefersReducedMotion ? 'auto' : 'smooth',
            });
        },
        [prefersReducedMotion, resolveScrollDelta]
    );

    const handleScroll = React.useCallback(() => {
        updateScrollState();
    }, [updateScrollState]);

    const columnPolicySx = React.useMemo(() => {
        const sx = {};

        columns.forEach((column, index) => {
            const columnPosition = index + 1;
            const selector = `& .MuiTableRow-root > .MuiTableCell-root:nth-of-type(${columnPosition})`;
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

        const firstColumnSticky = stickyFirstColumn || columns[0]?.sticky === 'left';
        const lastColumnSticky = stickyLastColumn || columns[columns.length - 1]?.sticky === 'right';

        if (columns.length > 0 && firstColumnSticky) {
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

        if (columns.length > 0 && lastColumnSticky) {
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
        <Box sx={{ position: 'relative' }}>
            {showScrollArrows && scrollState.hasOverflow ? (
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        gap: 1,
                        mb: 1,
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
                    border: '1px solid #e9eef5',
                    borderRadius: '20px',
                    overflowX: 'auto',
                    overflowY: 'hidden',
                    backgroundColor: '#fff',
                    scrollBehavior: prefersReducedMotion ? 'auto' : 'smooth',
                    '&:focus-visible': {
                        outline: '2px solid #0a3d62',
                        outlineOffset: '1px',
                    },
                    ...containerSx,
                }}
            >
                <Table size={size} sx={{ minWidth: tableMinWidth, ...columnPolicySx, ...tableSx }}>
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

            {showLeftFade ? (
                <Box
                    sx={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: pagination ? 64 : 0,
                        width: 26,
                        pointerEvents: 'none',
                        borderTopLeftRadius: 20,
                        borderBottomLeftRadius: pagination ? 0 : 20,
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
                        bottom: pagination ? 64 : 0,
                        width: 26,
                        pointerEvents: 'none',
                        borderTopRightRadius: 20,
                        borderBottomRightRadius: pagination ? 0 : 20,
                        background: 'linear-gradient(270deg, rgba(15,23,42,0.16) 0%, rgba(15,23,42,0.04) 55%, rgba(15,23,42,0) 100%)',
                    }}
                />
            ) : null}

            {pagination ? <Pagination data={pagination} /> : null}
        </Box>
    );
}
