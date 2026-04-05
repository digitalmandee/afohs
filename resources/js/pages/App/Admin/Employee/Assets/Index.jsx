import React, { useEffect, useMemo, useState } from 'react';
import { router } from '@inertiajs/react';
import {
    Alert,
    Box,
    Button,
    Chip,
    Grid,
    IconButton,
    Pagination,
    TableCell,
    TableRow,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import { Add, Delete, Edit, Search } from '@mui/icons-material';
import AppPage from '@/components/App/ui/AppPage';
import SurfaceCard from '@/components/App/ui/SurfaceCard';
import FilterToolbar from '@/components/App/ui/FilterToolbar';
import AdminDataTable from '@/components/App/ui/AdminDataTable';
import Create from './Create';
import EditAsset from './Edit';
import axios from 'axios';

const sampleAssets = [
    {
        id: 'sample-1',
        name: 'Sample Office Chair',
        classification: 'Furniture',
        type: 'Chair',
        location: 'Head Office',
        quantity: 4,
        status: 'active',
        is_sample: true,
    },
    {
        id: 'sample-2',
        name: 'Sample Laptop',
        classification: 'IT Equipment',
        type: 'Laptop',
        location: 'Accounts',
        quantity: 2,
        status: 'maintenance',
        is_sample: true,
    },
];

const columns = [
    { key: 'name', label: 'Name', minWidth: 220 },
    { key: 'classification', label: 'Classification', minWidth: 220, wrap: true },
    { key: 'type', label: 'Type', minWidth: 200, wrap: true },
    { key: 'location', label: 'Location', minWidth: 160 },
    { key: 'quantity', label: 'Qty', minWidth: 90, align: 'center' },
    { key: 'status', label: 'Status', minWidth: 140 },
    { key: 'actions', label: 'Actions', minWidth: 90, align: 'right' },
];

const splitChips = (value, color) =>
    String(value || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
        .map((item) => (
            <Chip
                key={`${color}-${item}`}
                label={item}
                size="small"
                variant="outlined"
                color={color}
                sx={{ mr: 0.5, mb: 0.5 }}
            />
        ));

const AssetsIndex = () => {
    const [assets, setAssets] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [limit] = useState(10);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [selectedAsset, setSelectedAsset] = useState(null);

    const getAssets = React.useCallback(async () => {
        setIsLoading(true);
        setErrorMessage('');

        try {
            const res = await axios.get(route('employees.assets.list'), {
                params: {
                    limit,
                    page,
                    search: searchTerm,
                },
            });

            if (res.data.success) {
                setAssets(res.data.assets?.data || []);
                setTotalPages(res.data.assets?.last_page || 1);
                setTotalItems(res.data.assets?.total || 0);
            } else {
                setAssets([]);
                setTotalPages(1);
                setTotalItems(0);
            }
        } catch (error) {
            setAssets([]);
            setTotalPages(1);
            setTotalItems(0);
            setErrorMessage('Unable to load assets right now.');
        } finally {
            setIsLoading(false);
        }
    }, [limit, page, searchTerm]);

    useEffect(() => {
        const timer = setTimeout(() => {
            getAssets();
        }, 300);

        return () => clearTimeout(timer);
    }, [getAssets]);

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this asset?')) {
            return;
        }

        try {
            await axios.delete(route('employees.assets.destroy', id));
            getAssets();
        } catch (error) {
            setErrorMessage('Unable to delete the selected asset.');
        }
    };

    const resetFilters = () => {
        setSearchTerm('');
        setPage(1);
    };

    const displayAssets = assets.length > 0 ? assets : sampleAssets;
    const paginationSummary = useMemo(
        () => `${totalItems || displayAssets.length} records`,
        [displayAssets.length, totalItems],
    );

    return (
        <AppPage
            title="Asset Inventory"
            subtitle="Track employee-facing assets with a visible register, safe loading states, and sample fallback rows when data is empty."
            actions={(
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => setCreateModalOpen(true)}
                        sx={{ textTransform: 'none', borderRadius: 999 }}
                    >
                        Add New Asset
                    </Button>
                    <Button
                        variant="outlined"
                        color="error"
                        onClick={() => router.visit(route('employees.assets.trashed'))}
                        sx={{ textTransform: 'none', borderRadius: 999 }}
                    >
                        Trashed
                    </Button>
                </Box>
            )}
        >
            {errorMessage ? (
                <Alert severity="warning" sx={{ mb: 2 }}>
                    {errorMessage}
                </Alert>
            ) : null}

            <SurfaceCard
                title="Live Filters"
                subtitle="Search assets instantly by name, classification, type, or location."
            >
                <FilterToolbar
                    title="Filters"
                    subtitle="Refine assets and click Apply."
                    lowChrome
                    onApply={getAssets}
                    onReset={resetFilters}
                >
                    <Grid container spacing={1.25}>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                size="small"
                                placeholder="Search assets..."
                                value={searchTerm}
                                onChange={(event) => {
                                    setSearchTerm(event.target.value);
                                    setPage(1);
                                }}
                                InputProps={{
                                    startAdornment: <Search color="action" sx={{ mr: 1 }} />,
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ height: '100%', display: 'flex', alignItems: 'center' }}
                            >
                                {paginationSummary}
                            </Typography>
                        </Grid>
                    </Grid>
                </FilterToolbar>
            </SurfaceCard>

            <SurfaceCard
                title="Asset Register"
                subtitle="The table remains visible for live data, empty states, and sample QA rows."
            >
                <AdminDataTable
                    columns={columns}
                    rows={displayAssets}
                    loading={isLoading}
                    error={errorMessage}
                    emptyMessage="No assets found."
                    tableMinWidth={1120}
                    renderRow={(asset) => (
                        <TableRow key={asset.id} hover>
                            <TableCell>
                                <Typography sx={{ fontWeight: 700 }}>{asset.name}</Typography>
                            </TableCell>
                            <TableCell>{splitChips(asset.classification, 'primary')}</TableCell>
                            <TableCell>{splitChips(asset.type, 'secondary')}</TableCell>
                            <TableCell>{asset.location || '-'}</TableCell>
                            <TableCell align="center">{asset.quantity}</TableCell>
                            <TableCell>
                                <Chip
                                    label={asset.is_sample ? 'sample data' : asset.status}
                                    size="small"
                                    color={asset.status === 'active' ? 'success' : 'default'}
                                    sx={{ textTransform: 'capitalize' }}
                                />
                            </TableCell>
                            <TableCell>
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                                    <Tooltip title={asset.is_sample ? 'Sample rows cannot be edited' : 'Edit asset'}>
                                        <span>
                                            <IconButton
                                                size="small"
                                                disabled={!!asset.is_sample}
                                                onClick={() => {
                                                    setSelectedAsset(asset);
                                                    setEditModalOpen(true);
                                                }}
                                            >
                                                <Edit fontSize="small" color="primary" />
                                            </IconButton>
                                        </span>
                                    </Tooltip>
                                    <Tooltip title={asset.is_sample ? 'Sample rows cannot be deleted' : 'Delete asset'}>
                                        <span>
                                            <IconButton
                                                size="small"
                                                color="error"
                                                disabled={!!asset.is_sample}
                                                onClick={() => handleDelete(asset.id)}
                                            >
                                                <Delete fontSize="small" />
                                            </IconButton>
                                        </span>
                                    </Tooltip>
                                </Box>
                            </TableCell>
                        </TableRow>
                    )}
                />

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                    <Pagination count={totalPages} page={page} onChange={(event, value) => setPage(value)} color="primary" />
                </Box>
            </SurfaceCard>

            <Create
                open={createModalOpen}
                onClose={() => setCreateModalOpen(false)}
                onSuccess={() => {
                    getAssets();
                }}
            />

            {selectedAsset ? (
                <EditAsset
                    open={editModalOpen}
                    onClose={() => {
                        setEditModalOpen(false);
                        setSelectedAsset(null);
                    }}
                    asset={selectedAsset}
                    onSuccess={() => {
                        getAssets();
                    }}
                />
            ) : null}
        </AppPage>
    );
};

export default AssetsIndex;
