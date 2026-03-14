import React from 'react';
import { router } from '@inertiajs/react';
import {
    Avatar,
    Box,
    Button,
    Chip,
    Grid,
    InputAdornment,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from '@mui/material';
import { ArrowBack, RestoreFromTrash, Search } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import debounce from 'lodash.debounce';
import dayjs from 'dayjs';
import AppPage from '@/components/App/ui/AppPage';
import SurfaceCard from '@/components/App/ui/SurfaceCard';
import FilterToolbar from '@/components/App/ui/FilterToolbar';
import Pagination from '@/components/Pagination';

const tableHeadSx = {
    '& .MuiTableCell-head': {
        bgcolor: '#0a3d62',
        color: '#f8fafc',
        borderBottom: 'none',
        fontSize: '0.74rem',
        fontWeight: 700,
        py: 1.35,
    },
    '& .MuiTableCell-head:first-of-type': {
        borderTopLeftRadius: 16,
    },
    '& .MuiTableCell-head:last-of-type': {
        borderTopRightRadius: 16,
    },
};

export default function TrashedCorporateMembers({ members, filters = {} }) {
    const { enqueueSnackbar } = useSnackbar();
    const [processingId, setProcessingId] = React.useState(null);
    const [localFilters, setLocalFilters] = React.useState({
        search: filters.search || '',
        per_page: filters.per_page || members?.per_page || 25,
        page: 1,
    });
    const filtersRef = React.useRef(localFilters);

    const submitFilters = React.useCallback((nextFilters) => {
        const payload = {};

        if (nextFilters.search?.trim()) {
            payload.search = nextFilters.search.trim();
        }
        payload.per_page = nextFilters.per_page || 25;
        if (Number(nextFilters.page) > 1) {
            payload.page = Number(nextFilters.page);
        }

        router.get(route('corporate-membership.trashed'), payload, {
            preserveScroll: true,
            preserveState: false,
            replace: true,
        });
    }, []);

    const debouncedSubmit = React.useMemo(() => debounce((nextFilters) => submitFilters(nextFilters), 350), [submitFilters]);

    React.useEffect(() => () => debouncedSubmit.cancel(), [debouncedSubmit]);

    React.useEffect(() => {
        const next = {
            search: filters.search || '',
            per_page: filters.per_page || members?.per_page || 25,
            page: 1,
        };
        filtersRef.current = next;
        setLocalFilters(next);
    }, [filters.per_page, filters.search, members?.per_page]);

    const updateFilters = React.useCallback(
        (partial, { immediate = false } = {}) => {
            const nextFilters = {
                ...filtersRef.current,
                ...partial,
            };

            if (!Object.prototype.hasOwnProperty.call(partial, 'page')) {
                nextFilters.page = 1;
            }

            filtersRef.current = nextFilters;
            setLocalFilters(nextFilters);

            if (immediate) {
                debouncedSubmit.cancel();
                submitFilters(nextFilters);
                return;
            }

            debouncedSubmit(nextFilters);
        },
        [debouncedSubmit, submitFilters],
    );

    const resetFilters = React.useCallback(() => {
        const next = {
            search: '',
            per_page: localFilters.per_page || 25,
            page: 1,
        };
        debouncedSubmit.cancel();
        filtersRef.current = next;
        setLocalFilters(next);
        submitFilters(next);
    }, [debouncedSubmit, localFilters.per_page, submitFilters]);

    const handleRestore = (id) => {
        setProcessingId(id);
        router.post(
            route('corporate-membership.restore', id),
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    enqueueSnackbar('Corporate member restored successfully', { variant: 'success' });
                    setProcessingId(null);
                },
                onError: () => {
                    enqueueSnackbar('Failed to restore corporate member', { variant: 'error' });
                    setProcessingId(null);
                },
            },
        );
    };

    const rows = members?.data || [];

    return (
        <AppPage
            eyebrow="Membership"
            title="Deleted Corporate Members"
            subtitle="Restore corporate records through the same premium filter and table pattern."
            actions={[
                <Button key="back" variant="outlined" startIcon={<ArrowBack />} onClick={() => router.get(route('corporate-membership.members'))}>
                    Back to Corporate Members
                </Button>,
            ]}
        >
            <SurfaceCard title="Live Filters" subtitle="Search updates automatically while you type.">
                <FilterToolbar onReset={resetFilters}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={8}>
                            <TextField
                                label="Search deleted corporate member"
                                placeholder="Membership no or member name"
                                value={localFilters.search}
                                onChange={(e) => updateFilters({ search: e.target.value })}
                                fullWidth
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Search fontSize="small" />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>
                    </Grid>
                </FilterToolbar>
            </SurfaceCard>

            <SurfaceCard title="Deleted Corporate Register" subtitle="Compact table with consistent pagination and restore actions.">
                <TableContainer className="premium-scroll">
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={tableHeadSx}>
                                <TableCell>Membership No</TableCell>
                                <TableCell>Member</TableCell>
                                <TableCell>Type</TableCell>
                                <TableCell>CNIC</TableCell>
                                <TableCell>Deleted At</TableCell>
                                <TableCell align="right">Action</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {rows.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                                        No deleted corporate members found.
                                    </TableCell>
                                </TableRow>
                            )}

                            {rows.map((member) => (
                                <TableRow
                                    key={member.id}
                                    hover
                                    sx={{
                                        '& .MuiTableCell-body': {
                                            py: 1.5,
                                            borderBottomColor: '#edf2f7',
                                        },
                                    }}
                                >
                                    <TableCell sx={{ fontWeight: 700, color: 'text.primary' }}>{member.membership_no || 'N/A'}</TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                                            <Avatar src={member.profile_photo?.file_path || '/placeholder.svg'} alt={member.full_name} />
                                            <Box>
                                                <Typography sx={{ fontWeight: 600, color: 'text.primary' }}>{member.full_name || 'N/A'}</Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {member.personal_email || 'N/A'}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Chip size="small" label="Corporate" color="info" variant="outlined" />
                                    </TableCell>
                                    <TableCell>{member.cnic_no || 'N/A'}</TableCell>
                                    <TableCell>{member.deleted_at ? dayjs(member.deleted_at).format('DD-MM-YYYY HH:mm') : 'N/A'}</TableCell>
                                    <TableCell align="right">
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            startIcon={<RestoreFromTrash />}
                                            onClick={() => handleRestore(member.id)}
                                            disabled={processingId === member.id}
                                        >
                                            {processingId === member.id ? 'Restoring...' : 'Restore'}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
                <Pagination data={members} />
            </SurfaceCard>
        </AppPage>
    );
}
