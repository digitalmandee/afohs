import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Box, Button, TextField, FormControl, Select, MenuItem, Grid, Typography, Autocomplete, Chip, Tooltip } from '@mui/material';
import axios from 'axios';
import debounce from 'lodash.debounce';
import { styled } from '@mui/material/styles';
import { Search } from '@mui/icons-material'
import { routeNameForContext } from '@/lib/utils';

const RoundedTextField = styled(TextField)({
    '& .MuiOutlinedInput-root': {
        borderRadius: '16px',
    },
});

const MenuFilter = ({ categories = [], onProductsLoaded, onLoadingChange, page = 1, onFiltersChange }) => {
    // Filter states
    const [nameFilter, setNameFilter] = useState('');
    const [menuCodeFilter, setMenuCodeFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState([]);
    const [subCategories, setSubCategories] = useState([]);
    const [subCategoryFilter, setSubCategoryFilter] = useState([]);
    const [manufacturers, setManufacturers] = useState([]);
    const [manufacturerFilter, setManufacturerFilter] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // Debounced fetch function
    const fetchProducts = useCallback(
        debounce(async (filters, pageNum) => {
            setIsLoading(true);
            onLoadingChange?.(true);

            try {
                const params = { page: pageNum };
                if (filters.name) params.name = filters.name;
                if (filters.menu_code) params.menu_code = filters.menu_code;
                if (filters.status && filters.status !== 'all') params.status = filters.status;
                if (filters.category_ids && filters.category_ids.length > 0) params.category_ids = filters.category_ids.join(',');
                if (filters.sub_category_ids && filters.sub_category_ids.length > 0) params.sub_category_ids = filters.sub_category_ids.join(',');
                if (filters.manufacturer_ids && filters.manufacturer_ids.length > 0) params.manufacturer_ids = filters.manufacturer_ids.join(',');

                const response = await axios.get(route(routeNameForContext('api.products.filter')), { params });

                if (response.data.success) {
                    onProductsLoaded?.(response.data.products);
                }
            } catch (error) {
                console.error('Error fetching products:', error);
            } finally {
                setIsLoading(false);
                onLoadingChange?.(false);
            }
        }, 400),
        [onProductsLoaded, onLoadingChange],
    );

    // Fetch Manufacturers
    useEffect(() => {
        axios.get(route(routeNameForContext('api.manufacturers.list'))).then((response) => {
            setManufacturers(response.data.manufacturers);
        });
    }, []);

    // Fetch Sub Categories when Categories change
    useEffect(() => {
        if (categoryFilter.length > 0) {
            // For simplicity, fetching all subcategories for selected categories could be complex if APIs expect single ID.
            // But we can iterate or change API.
            // Current 'api.sub-categories.by-category' takes {category_id}.
            // If multiple selected, we might want to fetch for all?
            // Or just clear if multiple? The user requirement isn't super specific.
            // Let's assume for now we only support sub-category if ONE category is selected.
            // Or better, let's update logic to support fetching for multiple if needed, but for now let's just stick to "if one category selected" or "fetch for first".
            // Actually, best UX: If categories selected, fetch subcategories for ALL those categories.
            // But our API `getByCategory` takes one ID.
            // Let's modify frontend to cycle through or just support one for now to avoid breaking changes to API if not needed.
            // Wait, I can just change the API to accept multiple, or just call it for the first one.
            // The requirement said "Update Product Filter".
            // Let's just handle the case where if 1 category is selected we show its subcategories.
            if (categoryFilter.length === 1) {
                axios.get(route(routeNameForContext('api.sub-categories.by-category'), categoryFilter[0])).then((response) => {
                    setSubCategories(response.data.subCategories);
                });
            } else {
                setSubCategories([]); // Reset if multiple or none (logic simplification)
            }
        } else {
            setSubCategories([]);
        }
    }, [categoryFilter]);

    // Auto-fetch on filter changes
    const isMounted = useRef(false);

    useEffect(() => {
        if (!isMounted.current) {
            isMounted.current = true;
            return;
        }

        const hasFilters = nameFilter || menuCodeFilter || statusFilter !== 'all' || categoryFilter.length > 0 || subCategoryFilter.length > 0 || manufacturerFilter.length > 0;

        if (!hasFilters) {
            onProductsLoaded?.(null);
            return;
        }

        fetchProducts(
            {
                name: nameFilter,
                menu_code: menuCodeFilter,
                status: statusFilter,
                category_ids: categoryFilter,
                sub_category_ids: subCategoryFilter,
                manufacturer_ids: manufacturerFilter,
            },
            page,
        );
    }, [nameFilter, menuCodeFilter, statusFilter, categoryFilter, subCategoryFilter, manufacturerFilter, page]);

    // Reset all filters
    const handleReset = () => {
        setNameFilter('');
        setMenuCodeFilter('');
        setStatusFilter('all');
        setCategoryFilter([]);
        setSubCategoryFilter([]);
        setManufacturerFilter([]);
        onFiltersChange?.();
    };

    return (
        <Box sx={{ mb: 3, mt: 3, boxShadow: 'none' }}>
            <Grid container spacing={2} alignItems="center">
                {/* Name Filter */}
                <Grid item xs={12} md={2}>
                    <RoundedTextField
                        fullWidth
                        size="small"
                        label="Product Name"
                        placeholder="Search name..."
                        value={nameFilter}
                        onChange={(e) => {
                            setNameFilter(e.target.value);
                            onFiltersChange?.();
                        }}
                    />
                </Grid>

                {/* Menu Code Filter */}
                <Grid item xs={12} md={2}>
                    <RoundedTextField
                        fullWidth
                        size="small"
                        label="Item Code"
                        placeholder="Search code..."
                        value={menuCodeFilter}
                        onChange={(e) => {
                            setMenuCodeFilter(e.target.value);
                            onFiltersChange?.();
                        }}
                    />
                </Grid>

                {/* Status Filter */}
                <Grid item xs={12} md={2}>
                    <Autocomplete
                        size="small"
                        options={[
                            { label: "Status", value: "all" },
                            { label: "Active", value: "active" },
                            { label: "Inactive", value: "inactive" },
                        ]}
                        getOptionLabel={(option) => option.label}
                        value={
                            [
                                { label: "Status", value: "all" },
                                { label: "Active", value: "active" },
                                { label: "Inactive", value: "inactive" },
                            ].find((opt) => opt.value === statusFilter) || null
                        }
                        onChange={(event, newValue) => {
                            setStatusFilter(newValue?.value || "all");
                            onFiltersChange?.();
                        }}
                        disableClearable
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                placeholder="Status"
                                sx={{
                                    "& .MuiOutlinedInput-root": {
                                        borderRadius: "16px",
                                    },
                                }}
                            />
                        )}
                        sx={{
                            "& .MuiAutocomplete-paper": {
                                borderRadius: "16px",
                                boxShadow: "none",
                                mt: "4px",
                            },
                        }}
                        renderOption={(props, option) => (
                            <li
                                {...props}
                                style={{
                                    borderRadius: "16px",
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = "#063455";
                                    e.currentTarget.style.color = "#fff";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = "";
                                    e.currentTarget.style.color = "";
                                }}
                            >
                                {option.label}
                            </li>
                        )}
                    />

                </Grid>

                <Grid item xs={12} md={2}>
                    <Autocomplete
                        multiple
                        size="small"
                        options={categories}
                        getOptionLabel={(option) => option.name || ''}
                        value={categories.filter((cat) => categoryFilter.includes(cat.id))}
                        onChange={(event, newValue) => {
                            setCategoryFilter(newValue.map((cat) => cat.id));
                            // Reset sub-category filter if category changes
                            setSubCategoryFilter([]);
                            onFiltersChange?.();
                        }}
                        slotProps={{
                            paper: {
                                sx: {
                                    borderRadius: "16px",
                                    boxShadow: "none",
                                    mt: 0.5,
                                },
                            },
                            listbox: {
                                sx: {
                                    "& .MuiAutocomplete-option:hover": {
                                        backgroundColor: "#063455 !important",
                                        color: "#fff",
                                        borderRadius:'16px',
                                        my:0.3
                                    },
                                    "& .MuiAutocomplete-option.Mui-focused": {
                                        backgroundColor: "#063455 !important",
                                        color: "#fff",
                                        borderRadius:'16px',
                                        my:0.3
                                    },
                                    "& .MuiAutocomplete-option[aria-selected='true']": {
                                        backgroundColor: "#063455 !important",
                                        color: "#fff",
                                        borderRadius:'16px',
                                        my:0.3
                                    },
                                },
                            },
                        }}
                        renderTags={(value, getTagProps) =>
                            value.length > 1 ? (
                                <Chip label={`${value.length} selected`} size="small" sx={{ backgroundColor: '#063455', color: '#fff' }} />
                            ) : (
                                value.map((option, index) => (
                                    <Chip
                                        {...getTagProps({ index })}
                                        key={option.id}
                                        label={option.name}
                                        size="small"
                                        sx={{
                                            backgroundColor: '#063455',
                                            color: '#fff',
                                            '& .MuiChip-deleteIcon': {
                                                color: '#fff',
                                            },
                                        }}
                                    />
                                ))
                            )
                        }
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                placeholder={categoryFilter.length === 0 ? 'Categories' : ''}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: '16px',
                                    },
                                }}
                            />
                        )}
                    />
                </Grid>

                <Grid item xs={12} md={2}>
                    <Autocomplete
                        multiple
                        size="small"
                        options={subCategories}
                        getOptionLabel={(option) => option.name || ''}
                        value={subCategories.filter((sub) => subCategoryFilter.includes(sub.id))}
                        disabled={subCategories.length === 0}
                        onChange={(event, newValue) => {
                            setSubCategoryFilter(newValue.map((sub) => sub.id));
                            onFiltersChange?.();
                        }}
                        slotProps={{
                            paper: {
                                sx: {
                                    borderRadius: "16px",
                                    boxShadow: "none",
                                    mt: 0.5,
                                },
                            },
                            listbox: {
                                sx: {
                                    "& .MuiAutocomplete-option:hover": {
                                        backgroundColor: "#063455 !important",
                                        color: "#fff",
                                        borderRadius:'16px',
                                        my:0.3
                                    },
                                    "& .MuiAutocomplete-option.Mui-focused": {
                                        backgroundColor: "#063455 !important",
                                        color: "#fff",
                                        borderRadius:'16px',
                                        my:0.3
                                    },
                                    "& .MuiAutocomplete-option[aria-selected='true']": {
                                        backgroundColor: "#063455 !important",
                                        color: "#fff",
                                        borderRadius:'16px',
                                        my:0.3
                                    },
                                },
                            },
                        }}
                        renderTags={(value, getTagProps) =>
                            value.length > 1 ? (
                                <Chip label={`${value.length} selected`} size="small" sx={{ backgroundColor: '#063455', color: '#fff' }} />
                            ) : (
                                value.map((option, index) => (
                                    <Chip
                                        {...getTagProps({ index })}
                                        key={option.id}
                                        label={option.name}
                                        size="small"
                                        sx={{
                                            backgroundColor: '#063455',
                                            color: '#fff',
                                            '& .MuiChip-deleteIcon': {
                                                color: '#fff',
                                            },
                                        }}
                                    />
                                ))
                            )
                        }
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                placeholder={subCategoryFilter.length === 0 ? 'Sub Categories' : ''}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: '16px',
                                    },
                                }}
                            />
                        )}
                    />
                </Grid>

                <Grid item xs={12} md={2}>
                    <Autocomplete
                        multiple
                        size="small"
                        options={manufacturers || []}
                        getOptionLabel={(option) => option.name || ''}
                        value={manufacturers.filter((m) => manufacturerFilter.includes(m.id))}
                        onChange={(event, newValue) => {
                            setManufacturerFilter(newValue.map((m) => m.id));
                            onFiltersChange?.();
                        }}
                        slotProps={{
                            paper: {
                                sx: {
                                    borderRadius: "16px",
                                    boxShadow: "none",
                                    mt: 0.5,
                                },
                            },
                            listbox: {
                                sx: {
                                    "& .MuiAutocomplete-option:hover": {
                                        backgroundColor: "#063455 !important",
                                        color: "#fff",
                                        borderRadius:'16px',
                                        my:0.3
                                    },
                                    "& .MuiAutocomplete-option.Mui-focused": {
                                        backgroundColor: "#063455 !important",
                                        color: "#fff",
                                        borderRadius:'16px',
                                        my:0.3
                                    },
                                    "& .MuiAutocomplete-option[aria-selected='true']": {
                                        backgroundColor: "#063455 !important",
                                        color: "#fff",
                                        borderRadius:'16px',
                                        my:0.3
                                    },
                                },
                            },
                        }}
                        renderTags={(value, getTagProps) =>
                            value.length > 1 ? (
                                <Chip label={`${value.length} selected`} size="small" sx={{ backgroundColor: '#063455', color: '#fff' }} />
                            ) : (
                                value.map((option, index) => (
                                    <Chip
                                        {...getTagProps({ index })}
                                        key={option.id}
                                        label={option.name}
                                        size="small"
                                        sx={{
                                            backgroundColor: '#063455',
                                            color: '#fff',
                                            '& .MuiChip-deleteIcon': {
                                                color: '#fff',
                                            },
                                        }}
                                    />
                                ))
                            )
                        }
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                placeholder={manufacturerFilter.length === 0 ? 'Manufacturer' : ''}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: '16px',
                                    },
                                }}
                            />
                        )}
                    />
                </Grid>

                {/* Reset Button */}
                <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, alignItems: 'center' }}>
                    {/* <Tooltip title="Reset Filters"> */}
                    <Button
                        variant="outlined"
                        onClick={handleReset}
                        disabled={isLoading}
                        sx={{
                            borderRadius: '16px',
                            height: 35,
                            px: 2,
                            color: '#063455',
                            textTransform: 'none',
                            border: '1px solid #063455',
                            '&:hover': {
                                backgroundColor: 'rgba(6, 52, 85, 0.04)',
                            },
                        }}
                    >
                        Reset
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<Search />}
                        // onClick={handleReset}
                        disabled={isLoading}
                        sx={{
                            borderRadius: '16px',
                            height: 35,
                            px: 1,
                            color: '#fff',
                            bgcolor: '#063455',
                            textTransform: 'none',
                            '&:hover': {
                                backgroundColor: '#063455',
                            },
                        }}
                    >
                        Search
                    </Button>
                    {/* </Tooltip> */}
                </Grid>
            </Grid>
        </Box>
    );
};

export default MenuFilter;
