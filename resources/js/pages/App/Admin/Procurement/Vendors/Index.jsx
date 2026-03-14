import React from 'react';
import { router, useForm } from '@inertiajs/react';
import {
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    MenuItem,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from '@mui/material';
import debounce from 'lodash.debounce';
import AppPage from '@/components/App/ui/AppPage';
import FilterToolbar from '@/components/App/ui/FilterToolbar';
import StatCard from '@/components/App/ui/StatCard';
import SurfaceCard from '@/components/App/ui/SurfaceCard';
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

export default function Index({ vendors, filters, summary = {} }) {
    const [openModal, setOpenModal] = React.useState(false);
    const [localFilters, setLocalFilters] = React.useState({
        search: filters?.search || '',
        status: filters?.status || '',
        per_page: filters?.per_page || vendors?.per_page || 25,
        page: 1,
    });
    const filtersRef = React.useRef(localFilters);

    const submitFilters = React.useCallback((nextFilters) => {
        const payload = {};

        if (nextFilters.search?.trim()) {
            payload.search = nextFilters.search.trim();
        }
        if (nextFilters.status) {
            payload.status = nextFilters.status;
        }
        payload.per_page = nextFilters.per_page || 25;
        if (Number(nextFilters.page) > 1) {
            payload.page = Number(nextFilters.page);
        }

        router.get(route('procurement.vendors.index'), payload, {
            preserveState: false,
            preserveScroll: true,
            replace: true,
        });
    }, []);

    const debouncedSubmit = React.useMemo(() => debounce((nextFilters) => submitFilters(nextFilters), 350), [submitFilters]);

    React.useEffect(() => () => debouncedSubmit.cancel(), [debouncedSubmit]);

    React.useEffect(() => {
        const next = {
            search: filters?.search || '',
            status: filters?.status || '',
            per_page: filters?.per_page || vendors?.per_page || 25,
            page: 1,
        };
        filtersRef.current = next;
        setLocalFilters(next);
    }, [filters?.per_page, filters?.search, filters?.status, vendors?.per_page]);

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

    const updateFilter = React.useCallback(
        (name, value, options = {}) => {
            updateFilters({ [name]: value }, options);
        },
        [updateFilters],
    );

    const resetFilters = React.useCallback(() => {
        const next = {
            search: '',
            status: '',
            per_page: localFilters.per_page || 25,
            page: 1,
        };
        debouncedSubmit.cancel();
        filtersRef.current = next;
        setLocalFilters(next);
        submitFilters(next);
    }, [debouncedSubmit, localFilters.per_page, submitFilters]);
    const { data, setData, post, processing, errors, reset } = useForm({
        code: '',
        name: '',
        phone: '',
        email: '',
        address: '',
        payment_terms_days: 0,
        currency: 'PKR',
        opening_balance: 0,
        status: 'active',
    });

    const list = vendors?.data || [];

    const submit = (e) => {
        e.preventDefault();
        post(route('procurement.vendors.store'), {
            onSuccess: () => {
                reset();
                setOpenModal(false);
            },
        });
    };

    return (
        <AppPage
            eyebrow="Procurement"
            title="Vendors"
            subtitle="Maintain supplier records, opening balances, and payment readiness in one consistent workspace."
            actions={[
                <Button key="create" variant="contained" onClick={() => setOpenModal(true)}>
                    Add Vendor
                </Button>,
            ]}
        >
            <Grid container spacing={2.25}>
                <Grid item xs={12} md={3}>
                    <StatCard label="Vendors" value={summary.count || 0} />
                </Grid>
                <Grid item xs={12} md={3}>
                    <StatCard label="Active" value={summary.active || 0} tone="light" />
                </Grid>
                <Grid item xs={12} md={3}>
                    <StatCard label="Inactive" value={summary.inactive || 0} tone="light" />
                </Grid>
                <Grid item xs={12} md={3}>
                    <StatCard label="Opening Balance" value={Number(summary.opening_balance || 0).toFixed(2)} tone="light" />
                </Grid>
            </Grid>

            <SurfaceCard title="Live Filters" subtitle="Results update automatically while you search or change vendor status.">
                <FilterToolbar onReset={resetFilters}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={8}>
                            <TextField
                                label="Search vendor"
                                placeholder="Search by code, name, or email"
                                value={localFilters.search}
                                onChange={(e) => updateFilter('search', e.target.value)}
                                fullWidth
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                                <TextField
                                    select
                                    label="Status"
                                    value={localFilters.status}
                                    onChange={(e) => updateFilter('status', e.target.value, { immediate: true })}
                                    fullWidth
                                >
                                <MenuItem value="">All</MenuItem>
                                <MenuItem value="active">Active</MenuItem>
                                <MenuItem value="inactive">Inactive</MenuItem>
                            </TextField>
                        </Grid>
                    </Grid>
                </FilterToolbar>
            </SurfaceCard>

            <SurfaceCard title="Vendor Register" subtitle="Standardized procurement list with denser rows, better status tags, and adjustable page size.">
                <TableContainer className="premium-scroll">
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={tableHeadSx}>
                                <TableCell>Code</TableCell>
                                <TableCell>Name</TableCell>
                                <TableCell>Phone</TableCell>
                                <TableCell>Email</TableCell>
                                <TableCell>Opening Balance</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell align="right">Action</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {list.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                                        No vendors found.
                                    </TableCell>
                                </TableRow>
                            )}
                            {list.map((vendor) => (
                                <TableRow
                                    key={vendor.id}
                                    hover
                                    sx={{
                                        '& .MuiTableCell-body': {
                                            py: 1.5,
                                            borderBottomColor: '#edf2f7',
                                        },
                                    }}
                                >
                                    <TableCell sx={{ fontWeight: 700, color: 'text.primary' }}>{vendor.code}</TableCell>
                                    <TableCell>
                                        <Typography sx={{ fontWeight: 700, color: 'text.primary' }}>{vendor.name}</Typography>
                                    </TableCell>
                                    <TableCell>{vendor.phone || '-'}</TableCell>
                                    <TableCell>{vendor.email || '-'}</TableCell>
                                    <TableCell>{Number(vendor.opening_balance || 0).toFixed(2)}</TableCell>
                                    <TableCell>
                                        <Chip
                                            size="small"
                                            label={vendor.status}
                                            color={vendor.status === 'active' ? 'success' : 'default'}
                                            variant={vendor.status === 'active' ? 'filled' : 'outlined'}
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <Button
                                            size="small"
                                            color="error"
                                            onClick={() => router.delete(route('procurement.vendors.destroy', vendor.id))}
                                        >
                                            Delete
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
                <Pagination data={vendors} />
            </SurfaceCard>

            <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: '22px' } }}>
                <DialogTitle>Add Vendor</DialogTitle>
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
                            <Grid item xs={12} md={4}>
                                <TextField label="Phone" value={data.phone} onChange={(e) => setData('phone', e.target.value)} fullWidth />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField label="Email" value={data.email} onChange={(e) => setData('email', e.target.value)} fullWidth />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField
                                    label="Terms (days)"
                                    type="number"
                                    value={data.payment_terms_days}
                                    onChange={(e) => setData('payment_terms_days', e.target.value)}
                                    fullWidth
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField label="Address" value={data.address} onChange={(e) => setData('address', e.target.value)} fullWidth />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField label="Currency" value={data.currency} onChange={(e) => setData('currency', e.target.value)} fullWidth />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField
                                    label="Opening Balance"
                                    type="number"
                                    value={data.opening_balance}
                                    onChange={(e) => setData('opening_balance', e.target.value)}
                                    fullWidth
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField select label="Status" value={data.status} onChange={(e) => setData('status', e.target.value)} fullWidth>
                                    <MenuItem value="active">Active</MenuItem>
                                    <MenuItem value="inactive">Inactive</MenuItem>
                                </TextField>
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 2 }}>
                        <Button onClick={() => setOpenModal(false)}>Cancel</Button>
                        <Button type="submit" variant="contained" disabled={processing}>
                            Create Vendor
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </AppPage>
    );
}
