import React from 'react';
import { FormControl, MenuItem, Pagination as MuiPagination, Select, Stack, Typography } from '@mui/material';
import { router } from '@inertiajs/react';

const Pagination = ({ data }) => {
    if (!data || !data.last_page || data.last_page <= 1) return null;

    const handleChange = (event, value) => {
        const url = new URL(window.location.href);
        url.searchParams.set('page', value);
        router.visit(url.toString(), { preserveScroll: true, preserveState: true });
    };

    const handleRowsPerPageChange = (event) => {
        const url = new URL(window.location.href);
        url.searchParams.set('per_page', event.target.value);
        url.searchParams.set('page', '1');
        router.visit(url.toString(), { preserveScroll: true, preserveState: true, replace: true });
    };

    return (
        <Stack
            direction={{ xs: 'column', md: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', md: 'center' }}
            spacing={1.5}
            sx={{
                mt: 2,
                p: 1.5,
                bgcolor: 'rgba(255,255,255,0.92)',
                borderRadius: '16px',
                border: '1px solid rgba(229,231,235,0.9)',
                boxShadow: '0 10px 22px rgba(15, 23, 42, 0.04)',
            }}
        >
            <Typography variant="body2" color="text.secondary">
                Showing {data.from || 0} to {data.to || 0} of {data.total} results
            </Typography>
            <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
                <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="body2" color="text.secondary">
                        Rows
                    </Typography>
                    <FormControl size="small">
                        <Select
                            value={String(data.per_page || 25)}
                            onChange={handleRowsPerPageChange}
                            sx={{
                                minWidth: 78,
                                borderRadius: '12px',
                                '& .MuiSelect-select': {
                                    py: 0.7,
                                },
                            }}
                        >
                            {[10, 25, 50, 100].map((option) => (
                                <MenuItem key={option} value={String(option)}>
                                    {option}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Stack>
                <MuiPagination
                    count={data.last_page}
                    page={data.current_page}
                    onChange={handleChange}
                    color="primary"
                    shape="rounded"
                    showFirstButton
                    showLastButton
                    sx={{
                        '& .MuiPaginationItem-root': {
                            fontWeight: 700,
                            borderRadius: '12px',
                        },
                    }}
                />
            </Stack>
        </Stack>
    );
};

export default Pagination;
