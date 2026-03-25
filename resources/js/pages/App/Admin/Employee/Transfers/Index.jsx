import React, { useEffect, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import { Box, Stack, TableCell, TableRow, Typography } from '@mui/material';
import AppPage from '@/components/App/ui/AppPage';
import AdminDataTable from '@/components/App/ui/AdminDataTable';
import StatCard from '@/components/App/ui/StatCard';
import SurfaceCard from '@/components/App/ui/SurfaceCard';

const safeTransfers = (transfers) => {
    if (!transfers || typeof transfers !== 'object') {
        return {
            data: [],
            total: 0,
            current_page: 1,
            last_page: 1,
        };
    }

    return {
        data: Array.isArray(transfers.data) ? transfers.data : [],
        total: Number(transfers.total || 0),
        current_page: Number(transfers.current_page || 1),
        last_page: Number(transfers.last_page || 1),
        links: transfers.links || [],
    };
};

function DetailLine({ label, value, tone = 'text.secondary' }) {
    return (
        <Typography variant="caption" sx={{ color: tone, display: 'block' }}>
            {label}: <strong>{value || '-'}</strong>
        </Typography>
    );
}

export default function TransfersIndex() {
    const { transfers: rawTransfers } = usePage().props;
    const transfers = safeTransfers(rawTransfers);
    const rows = transfers.data;
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const removeStart = router.on('start', () => setIsLoading(true));
        const removeFinish = router.on('finish', () => setIsLoading(false));
        const removeError = router.on('error', () => setIsLoading(false));

        return () => {
            removeStart();
            removeFinish();
            removeError();
        };
    }, []);

    return (
        <AppPage
            eyebrow="HR"
            title="Employee Transfer History"
            subtitle="Review historical employee transfers with safe rendering, visible table state, and operational summaries."
        >
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2.25}>
                <StatCard label="Transfers" value={transfers.total} accent />
                <StatCard label="Showing" value={rows.length} tone="light" />
            </Stack>

            <SurfaceCard title="Transfer Register" subtitle="Transfer records remain visible even when relations or results are missing.">
                <AdminDataTable
                    columns={[
                        { key: 'date', label: 'Date', minWidth: 120 },
                        { key: 'employee', label: 'Employee', minWidth: 220 },
                        { key: 'from', label: 'Transferred From', minWidth: 220, wrap: true },
                        { key: 'to', label: 'Transferred To', minWidth: 220, wrap: true },
                        { key: 'reason', label: 'Reason', minWidth: 220, wrap: true },
                    ]}
                    rows={rows}
                    loading={isLoading}
                    pagination={transfers}
                    tableMinWidth={1080}
                    emptyMessage="No transfer records found."
                    renderRow={(transfer) => (
                        <TableRow key={transfer.id} hover>
                            <TableCell>{transfer.transfer_date || '-'}</TableCell>
                            <TableCell>
                                <Typography sx={{ fontWeight: 700, color: 'text.primary' }}>
                                    {transfer.employee?.name || 'Unknown Employee'}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    #{transfer.employee?.employee_id || '-'}
                                </Typography>
                            </TableCell>
                            <TableCell>
                                <Box>
                                    <DetailLine label="Branch" value={transfer.from_branch?.name} />
                                    <DetailLine label="Dept" value={transfer.from_department?.name} />
                                    <DetailLine label="Desig" value={transfer.from_designation?.name} />
                                    <DetailLine label="Shift" value={transfer.from_shift?.name} />
                                </Box>
                            </TableCell>
                            <TableCell>
                                <Box>
                                    <DetailLine label="Branch" value={transfer.to_branch?.name} tone="success.main" />
                                    <DetailLine label="Dept" value={transfer.to_department?.name} tone="success.main" />
                                    <DetailLine label="Desig" value={transfer.to_designation?.name} tone="success.main" />
                                    <DetailLine label="Shift" value={transfer.to_shift?.name} tone="success.main" />
                                </Box>
                            </TableCell>
                            <TableCell>
                                <Typography variant="body2" color="text.secondary">
                                    {transfer.reason || 'No reason provided'}
                                </Typography>
                            </TableCell>
                        </TableRow>
                    )}
                />
            </SurfaceCard>
        </AppPage>
    );
}
